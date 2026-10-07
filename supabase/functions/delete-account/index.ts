import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse({ error: "Authentication is required." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKeyMap = Deno.env.get("SUPABASE_SECRET_KEYS");
  let secretKey: string | undefined;
  if (secretKeyMap) {
    try {
      const parsed = JSON.parse(secretKeyMap) as Record<string, string>;
      secretKey = parsed.default;
    } catch (_error) {
      return jsonResponse({ error: "Account deletion is not configured." }, 500);
    }
  }
  secretKey ||= Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !secretKey) {
    return jsonResponse({ error: "Account deletion is not configured." }, 500);
  }

  try {
    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !data.user) return jsonResponse({ error: "Your session is invalid or expired." }, 401);

    // The target is taken only from the verified Auth response; the request body is ignored.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(data.user.id);
    if (deleteError) return jsonResponse({ error: "The account could not be deleted." }, 500);

    return jsonResponse({ success: true }, 200);
  } catch (_error) {
    return jsonResponse({ error: "The account could not be deleted." }, 500);
  }
});
