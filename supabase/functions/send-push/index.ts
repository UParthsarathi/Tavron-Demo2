// send-push — Web Push fan-out for one chat message.
//
// Called by the sender's client right after a message insert succeeds (see
// useConversations.sendMessage). The caller must be the message's author, and
// only recent messages are pushed, so the function can't be replayed to spam
// old history. Recipients mirror conversation visibility (the RLS rules):
//   DM        the other participant
//   PROJECT   project members + all managers
//   MILESTONE project members + all managers
//   TASK      project members (when the task has a project) + assignee + managers
// minus the author. Subscriptions the push service reports dead (404/410)
// are deleted so the table self-heals.
//
// Deployed with verify_jwt = true. VAPID keys come from Vault through the
// service-role-only get_vapid_keys() function (see the push_subscriptions
// migration).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const VAPID_CONTACT = "mailto:parthu3915@gmail.com";
const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000;
const BODY_LIMIT = 140;

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

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// One Vault read + key import per cold start.
let appServerPromise: Promise<webpush.ApplicationServer> | null = null;
function getAppServer(): Promise<webpush.ApplicationServer> {
  appServerPromise ??= (async () => {
    const { data, error } = await admin.rpc("get_vapid_keys");
    if (error || !data) {
      throw new Error(`VAPID keys unavailable: ${error?.message ?? "empty"}`);
    }
    const vapidKeys = await webpush.importVapidKeys(JSON.parse(data), {
      extractable: false,
    });
    return webpush.ApplicationServer.new({
      contactInformation: VAPID_CONTACT,
      vapidKeys,
    });
  })();
  return appServerPromise;
}

type MessageRow = {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  image_path: string | null;
  created_at: string;
  author: { name: string } | null;
  conversation: {
    type: "TASK" | "MILESTONE" | "PROJECT" | "DM";
    project_id: string | null;
    dm_a: string | null;
    dm_b: string | null;
    project: { name: string } | null;
    task: { title: string; assignee_id: string | null } | null;
    milestone: { title: string } | null;
  } | null;
};

/** Everyone who can see the conversation, minus the author. */
async function resolveRecipients(msg: MessageRow): Promise<string[]> {
  const conv = msg.conversation!;
  const ids = new Set<string>();
  if (conv.type === "DM") {
    if (conv.dm_a) ids.add(conv.dm_a);
    if (conv.dm_b) ids.add(conv.dm_b);
  } else {
    const { data: managers } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "MANAGER");
    for (const m of managers ?? []) ids.add(m.id);
    if (conv.project_id) {
      const { data: members } = await admin
        .from("project_members")
        .select("profile_id")
        .eq("project_id", conv.project_id);
      for (const m of members ?? []) ids.add(m.profile_id);
    }
    if (conv.type === "TASK" && conv.task?.assignee_id) {
      ids.add(conv.task.assignee_id);
    }
  }
  ids.delete(msg.author_id);
  return [...ids];
}

/** WhatsApp-style notification copy: DMs headline the person, channels the thread. */
function notificationCopy(msg: MessageRow): { title: string; body: string } {
  const conv = msg.conversation!;
  const author = msg.author?.name ?? "Someone";
  let text = msg.content.trim();
  if (!text && msg.image_path) text = "\u{1F4F7} Photo";
  if (text.length > BODY_LIMIT) text = `${text.slice(0, BODY_LIMIT - 1)}…`;

  if (conv.type === "DM") return { title: author, body: text };

  const project = conv.project?.name;
  const thread =
    conv.type === "PROJECT" ? "General"
    : conv.type === "TASK" ? (conv.task?.title ?? "Task")
    : (conv.milestone?.title ?? "Milestone");
  const title = project ? `${thread} · ${project}` : thread;
  return { title, body: `${author}: ${text}` };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) {
    return json({ error: "Not authenticated" }, 401);
  }

  let body: { messageId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.messageId) {
    return json({ error: "messageId is required" }, 400);
  }

  const { data: msg, error: msgError } = await admin
    .from("messages")
    .select(`
      id, conversation_id, author_id, content, image_path, created_at,
      author:profiles ( name ),
      conversation:conversations (
        type, project_id, dm_a, dm_b,
        project:projects ( name ),
        task:tasks ( title, assignee_id ),
        milestone:milestones ( title )
      )
    `)
    .eq("id", body.messageId)
    .maybeSingle();
  if (msgError || !msg?.conversation) {
    return json({ error: "Message not found" }, 404);
  }
  const message = msg as unknown as MessageRow;

  if (message.author_id !== caller.user.id) {
    return json({ error: "Only the author can fan out a message" }, 403);
  }
  if (Date.now() - new Date(message.created_at).getTime() > MAX_MESSAGE_AGE_MS) {
    return json({ error: "Message too old to notify" }, 400);
  }

  const recipients = await resolveRecipients(message);
  if (recipients.length === 0) {
    return json({ ok: true, sent: 0, removed: 0, failed: 0 });
  }

  const { data: subs, error: subsError } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("profile_id", recipients);
  if (subsError) {
    return json({ error: `Failed to load subscriptions: ${subsError.message}` }, 500);
  }
  if (!subs || subs.length === 0) {
    return json({ ok: true, sent: 0, removed: 0, failed: 0 });
  }

  const { title, body: notifBody } = notificationCopy(message);
  const payload = JSON.stringify({
    title,
    body: notifBody,
    tag: message.conversation_id, // collapses stacked notifications per thread
    conversationId: message.conversation_id,
    url: `/?c=${message.conversation_id}`,
  });

  const appServer = await getAppServer();
  let sent = 0;
  let removed = 0;
  let failed = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        const subscriber = appServer.subscribe({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        });
        await subscriber.pushTextMessage(payload, {
          ttl: 24 * 60 * 60,
          urgency: webpush.Urgency.High,
        });
        sent++;
      } catch (err) {
        const status =
          err instanceof webpush.PushMessageError ? err.response.status : 0;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
          removed++;
        } else {
          console.error(`push to ${sub.id} failed:`, err);
          failed++;
        }
      }
    }),
  );

  return json({ ok: true, sent, removed, failed });
});
