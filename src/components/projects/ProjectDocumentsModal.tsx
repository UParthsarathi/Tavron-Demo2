import React, { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Project } from '@/types';
import { FileText, Plus, Trash2, Link as LinkIcon, Upload } from 'lucide-react';
import { cn, formatTimeAgo } from '@/lib/utils';
import type { NewDocumentInput } from '@/hooks/useProjects';

interface ProjectDocumentsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onAddDoc: (projectId: string, input: NewDocumentInput) => void;
  onDeleteDoc: (projectId: string, docId: string) => void;
  readOnly?: boolean;
}

export function ProjectDocumentsModal({ project, isOpen, onClose, onAddDoc, onDeleteDoc, readOnly = false }: ProjectDocumentsModalProps) {
  const [isAddMode, setIsAddMode] = useState(false);
  const [docUploadMode, setDocUploadMode] = useState<'link' | 'file'>('link');
  const [dTitle, setDTitle] = useState('');
  const [dUrl, setDUrl] = useState('');
  const [dFile, setDFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dTitle) return;
    if (docUploadMode === 'link') {
      if (!dUrl) return;
      onAddDoc(project.id, { title: dTitle, type: 'LINK', url: dUrl });
    } else {
      if (!dFile) return;
      onAddDoc(project.id, { title: dTitle, type: 'DOCUMENT', file: dFile });
    }

    setDTitle('');
    setDUrl('');
    setDFile(null);
    setIsAddMode(false);
  };

  if (isAddMode) {
    return (
      <Modal isOpen={isOpen} onClose={() => { setIsAddMode(false); onClose(); }} title="Attach Document / Link">
        <form onSubmit={submitDoc} className="flex flex-col gap-5">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setDocUploadMode('link')}
              className={cn("flex-1 text-sm font-medium py-1.5 rounded-md transition-colors", docUploadMode === 'link' ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
            >
              External Link
            </button>
            <button
              type="button"
              onClick={() => setDocUploadMode('file')}
              className={cn("flex-1 text-sm font-medium py-1.5 rounded-md transition-colors", docUploadMode === 'file' ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
            >
              File Upload
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Document Title</label>
            <input
              type="text"
              required
              value={dTitle}
              onChange={(e) => setDTitle(e.target.value)}
              placeholder="e.g. Architecture Diagram"
              className="mt-1.5 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors"
            />
          </div>

          {docUploadMode === 'link' ? (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
              <div className="relative mt-1.5">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  required
                  value={dUrl}
                  onChange={(e) => setDUrl(e.target.value)}
                  placeholder="https://"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors"
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900/50 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full"
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => setDFile(e.target.files?.[0] ?? null)}
              />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              {dFile ? (
                <p className="text-sm font-medium text-gray-900 dark:text-white">{dFile.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Click to choose a file</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF, DOCX, or PNG (max. 10MB)</p>
                </>
              )}
            </button>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsAddMode(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={docUploadMode === 'file' && !dFile}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {docUploadMode === 'link' ? 'Attach Link' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Documents">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {project.docs.length} document{project.docs.length !== 1 ? 's' : ''}
          </p>
          {!readOnly && (
            <button
              onClick={() => setIsAddMode(true)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Document
            </button>
          )}
        </div>

        {project.docs.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 italic text-sm">No documents attached to this project.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {project.docs.map(doc => (
              <div key={doc.id} className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">
                      {doc.title}
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{doc.type} • Added {formatTimeAgo(doc.dateAdded)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={doc.url} target="_blank" rel="noreferrer" className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                    View
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => onDeleteDoc(project.id, doc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Remove Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
