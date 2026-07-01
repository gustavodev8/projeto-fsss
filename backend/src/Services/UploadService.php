<?php
declare(strict_types=1);

namespace Fsss\Api\Services;

use Fsss\Api\Support\Auth;
use Fsss\Api\Support\Env;
use Fsss\Api\Support\HttpException;
use Fsss\Api\Support\Request;

final class UploadService
{
    public function storeItemImage(array $file, ?Request $request = null): array
    {
        Auth::requireAdmin();

        if (!isset($file['error']) || (int) $file['error'] !== UPLOAD_ERR_OK) {
            throw new HttpException(400, 'Upload failed');
        }

        $maxMb = max(1, (int) Env::get('MAX_UPLOAD_MB', '5'));
        $maxBytes = $maxMb * 1024 * 1024;
        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            throw new HttpException(413, 'File too large');
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new HttpException(400, 'Invalid upload');
        }

        $mime = $this->detectMime($tmp);
        $ext = match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => throw new HttpException(415, 'Unsupported image type'),
        };

        $uploadDir = $this->uploadDir();
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
            throw new HttpException(500, 'Could not prepare upload directory');
        }

        $filename = 'item-' . bin2hex(random_bytes(16)) . '.' . $ext;
        $target = rtrim($uploadDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file($tmp, $target)) {
            throw new HttpException(500, 'Could not save uploaded file');
        }

        return [
            'filename' => $filename,
            'url' => $this->buildPublicUrl($filename, $request),
        ];
    }

    private function detectMime(string $path): string
    {
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $mime = finfo_file($finfo, $path);
                finfo_close($finfo);

                if (is_string($mime) && $mime !== '') {
                    return $mime;
                }
            }
        }

        $imageInfo = @getimagesize($path);
        if (is_array($imageInfo) && isset($imageInfo['mime']) && is_string($imageInfo['mime']) && $imageInfo['mime'] !== '') {
            return $imageInfo['mime'];
        }

        if (function_exists('exif_imagetype')) {
            $imageType = @exif_imagetype($path);
            $mime = match ($imageType) {
                IMAGETYPE_JPEG => 'image/jpeg',
                IMAGETYPE_PNG => 'image/png',
                IMAGETYPE_WEBP => 'image/webp',
                IMAGETYPE_GIF => 'image/gif',
                default => null,
            };

            if (is_string($mime)) {
                return $mime;
            }
        }

        throw new HttpException(415, 'Could not detect file type');
    }

    private function uploadDir(): string
    {
        $dir = Env::get('UPLOAD_DIR', 'public/uploads');
        return $this->resolvePath($dir);
    }

    private function publicPath(): string
    {
        return rtrim(Env::get('UPLOAD_PUBLIC_PATH', '/uploads'), '/');
    }

    private function buildPublicUrl(string $filename, ?Request $request = null): string
    {
        $baseUrl = null;

        if ($request !== null) {
            $origin = $request->header('Origin');
            if (is_string($origin) && $origin !== '') {
                $baseUrl = rtrim($origin, '/');
            }
        }

        if ($baseUrl === null) {
            $baseUrl = rtrim(Env::get('APP_URL', ''), '/');
        }

        if ($baseUrl === '') {
            return $this->publicPath() . '/' . $filename;
        }

        return $baseUrl . $this->publicPath() . '/' . $filename;
    }

    private function resolvePath(string $path): string
    {
        $base = realpath(dirname(__DIR__, 2));
        if ($base === false) {
            throw new HttpException(500, 'Could not resolve backend path');
        }

        if (str_starts_with($path, '.') || str_starts_with($path, '/')) {
            return $base . DIRECTORY_SEPARATOR . ltrim($path, '/\\');
        }

        return $base . DIRECTORY_SEPARATOR . $path;
    }
}
