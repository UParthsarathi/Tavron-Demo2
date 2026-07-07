import { supabase } from '@/lib/supabase';
import type { MilestoneStatus } from '@/types';
import { uploadAttachment } from './storage';

export async function addMilestone(input: {
  projectId: string;
  title: string;
  dueDate: string; // ISO date
  imageFile?: File | null;
}): Promise<void> {
  const proofPath = input.imageFile
    ? await uploadAttachment('milestone-proofs', input.imageFile)
    : null;
  const { error } = await supabase.from('milestones').insert({
    project_id: input.projectId,
    title: input.title,
    due_date: input.dueDate,
    proof_image_path: proofPath,
  });
  if (error) throw new Error(`Failed to add milestone: ${error.message}`);
}

/** Completing a milestone requires a proof image (UI enforces, DB stores). */
export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus,
  proofImageFile?: File | null
): Promise<void> {
  const update: { status: MilestoneStatus; proof_image_path?: string } = { status };
  if (proofImageFile) {
    update.proof_image_path = await uploadAttachment('milestone-proofs', proofImageFile);
  }
  const { error } = await supabase.from('milestones').update(update).eq('id', milestoneId);
  if (error) throw new Error(`Failed to update milestone: ${error.message}`);
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  const { error } = await supabase.from('milestones').delete().eq('id', milestoneId);
  if (error) throw new Error(`Failed to delete milestone: ${error.message}`);
}
