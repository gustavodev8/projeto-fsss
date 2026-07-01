<?php
declare(strict_types=1);

use Fsss\Api\Services\AdminService;
use Fsss\Api\Services\AuthService;
use Fsss\Api\Services\ItemService;
use Fsss\Api\Services\UploadService;
use Fsss\Api\Services\ReservationService;
use Fsss\Api\Repositories\TimeSlotRepository;
use Fsss\Api\Support\Auth;
use Fsss\Api\Support\Request;
use Fsss\Api\Support\Response;
use Fsss\Api\Support\Router;

return static function (Router $router): void {
    $authService = new AuthService();
    $itemService = new ItemService();
    $reservationService = new ReservationService();
    $adminService = new AdminService();
    $uploadService = new UploadService();
    $timeSlots = new TimeSlotRepository();

    $router->get('/health', static fn () => [
        'ok' => true,
        'service' => 'fsss-api',
    ]);

    $router->get('/time-slots', static fn () => [
        'timeSlots' => array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'label' => $row['label'],
                'start' => $row['start_time'],
                'end' => $row['end_time'],
                'isBreak' => (int) $row['is_break'] === 1,
                'order' => (int) $row['sort_order'],
            ];
        }, $timeSlots->listAll()),
    ]);

    $router->post('/auth/login', static function (Request $request) use ($authService): array {
        $user = $authService->login(
            (string) ($request->input('email', '')),
            (string) ($request->input('password', ''))
        );

        Auth::storeUser($user);

        return [
            'user' => $user,
            'expiresAt' => $_SESSION['expires_at'] ?? null,
        ];
    });

    $router->post('/auth/logout', static function (): void {
        Auth::clear();
        session_destroy();
        Response::noContent();
    });

    $router->get('/auth/me', static fn (): array => [
        'user' => Auth::user(),
        'expired' => Auth::isExpired(),
    ]);

    $router->get('/items', static function (Request $request) use ($itemService): array {
        $category = $request->input('category');
        return ['items' => $itemService->list(is_string($category) ? $category : null)];
    });

    $router->get('/items/{id}', static function (Request $request, array $params) use ($itemService): array {
        return ['item' => $itemService->find($params['id'])];
    });

    $router->post('/admin/items', static function (Request $request) use ($itemService): array {
        return ['item' => $itemService->create($request->body)];
    });

    $router->put('/admin/items/{id}', static function (Request $request, array $params) use ($itemService): array {
        return ['item' => $itemService->update($params['id'], $request->body)];
    });

    $router->delete('/admin/items/{id}', static function (Request $request, array $params) use ($itemService): void {
        $itemService->delete($params['id']);
        Response::noContent();
    });

    $router->post('/admin/items/{id}/force-delete', static function (Request $request, array $params) use ($itemService): void {
        $itemService->forceDelete($params['id']);
        Response::noContent();
    });

    $router->post('/upload-item-image', static function (Request $request) use ($uploadService): array {
        $files = $request->body['__files'] ?? [];
        $file = $files['file'] ?? null;
        if (!is_array($file)) {
            throw new Fsss\Api\Support\HttpException(400, 'Missing upload file');
        }

        return $uploadService->storeItemImage($file, $request);
    });

    $router->get('/reservations', static function (Request $request) use ($reservationService): array {
        $scope = (string) ($request->input('scope', 'all'));
        $user = Auth::user();

        if ($scope === 'mine' && $user !== null) {
            return ['reservations' => $reservationService->listMine((string) $user['id'])];
        }

        if ($scope === 'cancelled') {
            return ['reservations' => $reservationService->listCancelled($request->input('userEmail') ? (string) $request->input('userEmail') : null)];
        }

        return ['reservations' => $reservationService->listAll()];
    });

    $router->post('/reservations', static function (Request $request) use ($reservationService): array {
        return ['reservation' => $reservationService->create($request->body)];
    });

    $router->post('/reservations/{id}/cancel', static function (Request $request, array $params) use ($reservationService): void {
        $reservationService->cancelById($params['id']);
        Response::noContent();
    });

    $router->post('/reservations/groups/{groupId}/cancel', static function (Request $request, array $params) use ($reservationService): void {
        $reservationService->cancelByGroup($params['groupId']);
        Response::noContent();
    });

    $router->get('/admin/professors', static fn () => [
        'professors' => $adminService->listProfessors(),
    ]);

    $router->post('/admin/professors', static function (Request $request) use ($adminService): array {
        return ['professor' => $adminService->createProfessor($request->body)];
    });

    $router->put('/admin/professors/{id}', static function (Request $request, array $params) use ($adminService): array {
        return ['professor' => $adminService->updateProfessor($params['id'], $request->body)];
    });

    $router->delete('/admin/professors/{id}', static function (Request $request, array $params) use ($adminService): void {
        $adminService->deactivateProfessor($params['id']);
        Response::noContent();
    });

    $router->get('/admin/blocked-dates', static fn () => [
        'blockedDates' => $adminService->listBlockedDates(),
    ]);

    $router->get('/blocked-dates', static fn () => [
        'blockedDates' => $adminService->listBlockedDates(),
    ]);

    $router->post('/admin/blocked-dates', static function (Request $request) use ($adminService): array {
        return ['blockedDate' => $adminService->createBlockedDate($request->body)];
    });

    $router->delete('/admin/blocked-dates/{id}', static function (Request $request, array $params) use ($adminService): void {
        $adminService->deleteBlockedDate($params['id']);
        Response::noContent();
    });
};
