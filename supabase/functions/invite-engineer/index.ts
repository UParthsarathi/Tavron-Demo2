// invite-engineer — called by the Add Engineer form (managers only).
//
// Sends a Supabase auth invitation email. The invitee's name/discipline/role
// travel in the invite metadata; the on_auth_user_created DB trigger turns
// them into a profiles row when the invitee accepts and sets a password.
//
// Deployed with verify_jwt = true, so only signed-in users reach this code;
// the manager check below is the real authorization gate.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Identify the caller from their JWT.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) {
    return json({ error: "Not authenticated" }, 401);
  }

  // Only managers may invite.
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.user.id)
    .single();
  if (profile?.role !== "MANAGER") {
    return json({ error: "Only managers can invite engineers" }, 403);
  }

  let body: { email?: string; name?: string; discipline?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const discipline = body.discipline?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A valid email is required" }, 400);
  }
  if (!discipline) {
    return json({ error: "A discipline is required" }, 400);
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      name: body.name?.trim() || email.split("@")[0],
      discipline,
      role: "ENGINEER",
    },
  });
  if (error) {
    // Most common case: the user already exists.
    return json({ error: error.message }, 400);
  }

  return json({ ok: true, userId: data.user?.id });
});
