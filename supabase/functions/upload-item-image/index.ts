import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// This function handles uploading a new image for an item.
// It receives the image as form-data, compresses it, uses the Supabase service role key
// to bypass RLS and upload the file to the 'item-images' storage bucket,
// and returns the public URL of the uploaded image.

console.log("Starting 'upload-item-image' function...");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided in the 'file' field.");
    }
    console.log(`Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // --- Image Compression Logic ---
    let uploadData: Uint8Array | File = file;
    let contentType = file.type;
    let fileExtension = "jpg";

    try {
      const arrayBuffer = await file.arrayBuffer();
      const inputBytes = new Uint8Array(arrayBuffer);
      
      console.log("Decoding image for compression...");
      const img = await Image.decode(inputBytes);
      
      // Resize if too large (max 1200px width)
      if (img.width > 1200) {
        console.log(`Resizing from ${img.width}px to 1200px`);
        img.resize(1200, Image.RESIZE_AUTO);
      }

      // Encode to JPEG with 80% quality
      console.log("Encoding to optimized JPEG...");
      uploadData = await img.encodeJPEG(80);
      contentType = "image/jpeg";
      fileExtension = "jpg";
      console.log(`Compression complete. New size: ${uploadData.length} bytes`);
    } catch (compressionError) {
      console.warn("Compression failed or unsupported format, uploading original file:", compressionError);
      // Fallback to original file data
      uploadData = file;
    }
    // -------------------------------

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const filePath = `itens/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;
    console.log(`Uploading to path: ${filePath}`);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("item-images")
      .upload(filePath, uploadData, {
        contentType: contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("item-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log(`Upload successful. Public URL: ${publicUrl}`);

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Main function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
