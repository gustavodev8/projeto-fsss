import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { corsHeaders } from "../_shared/cors.ts";

// This function handles uploading a new image for an item.
// It receives the image as form-data, uses the Supabase service role key
// to bypass RLS and upload the file to the 'item-images' storage bucket,
// and returns the public URL of the uploaded image.

console.log("Starting 'upload-item-image' function...");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided in the 'file' field.");
    }
    console.log(`Received file: ${file.name}, size: ${file.size}`);

    // Create a Supabase client with the service role key to upload the file.
    // This will bypass RLS policies on the storage.
    // This is necessary because the custom auth flow does not provide a JWT
    // that would allow for user-based RLS policies.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `itens/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    console.log(`Uploading to path: ${filePath}`);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("item-images")
      .upload(filePath, file, {
        contentType: file.type,
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
