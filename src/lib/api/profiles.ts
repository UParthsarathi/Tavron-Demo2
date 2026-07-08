import { supabase } from '@/lib/supabase';
import type { Engineer, Profile } from '@/types';
import type { Tables } from '@/types/database';

export function mapProfileToEngineer(row: {
  id: string;
  name: string;
  email: string;
  discipline: string | null;
  avatar_url: string | null;
}): Engineer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_url ?? undefined,
    role: row.discipline ?? 'Engineer',
  };
}

function mapProfile(row: Tables<'profiles'>): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    discipline: row.discipline,
    avatarUrl: row.avatar_url,
  };
}

/** The engineer directory (used by the assign-engineer modal and task forms). */
export async function fetchEngineers(): Promise<Engineer[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, discipline, avatar_url')
    .eq('role', 'ENGINEER')
    .order('name');
  if (error) throw new Error(`Failed to load engineers: ${error.message}`);
  return data.map(mapProfileToEngineer);
}

/** Everyone on the team (managers + engineers) — used by the new-DM picker. */
export async function fetchTeam(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');
  if (error) throw new Error(`Failed to load team: ${error.message}`);
  return data.map(mapProfile);
}

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return data ? mapProfile(data) : null;
}

/** Manager-only (enforced server-side by the edge function). */
export async function inviteEngineer(input: {
  email: string;
  name?: string;
  discipline: string;
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('invite-engineer', {
    body: input,
  });
  if (error) {
    // Surface the function's error body when available.
    let message = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      }
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
}
