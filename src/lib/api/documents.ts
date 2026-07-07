import { supabase } from '@/lib/supabase';
import { uploadAttachment } from './storage';

export async function addLinkDocument(input: {
  projectId: string;
  title: string;
  url: string;
  createdBy: string;
}): Promise<void> {
  const { error } = await supabase.from('documents').insert({
    project_id: input.projectId,
    title: input.title,
    doc_type: 'LINK',
    url: input.url,
    created_by: input.createdBy,
  });
  if (error) throw new Error(`Failed to attach link: ${error.message}`);
}

export async function uploadDocument(input: {
  projectId: string;
  title: string;
  file: File;
  createdBy: string;
}): Promise<void> {
  const filePath = await uploadAttachment('documents', input.file);
  const { error } = await supabase.from('documents').insert({
    project_id: input.projectId,
    title: input.title,
    doc_type: 'DOCUMENT',
    file_path: filePath,
    created_by: input.createdBy,
  });
  if (error) throw new Error(`Failed to upload document: ${error.message}`);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', documentId);
  if (error) throw new Error(`Failed to remove document: ${error.message}`);
}
