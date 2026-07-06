const fs = require('fs');

const tasksTab = `import React, { useRef, useState } from 'react';
import { Project, EngineerTask, TaskStatus, TaskComment } from '@/types';
import { Plus, ListTodo, SquareCheck, MessageCircle, Trash2, ArrowLeft, Image as ImageIcon, X, Send } from 'lucide-react';
import { formatTimeAgo, cn } from '@/lib/utils';

interface ProjectTasksTabProps {
  project: Project;
  readOnly?: boolean;
  onAssignTaskClick: () => void;
  onUpdateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
  onDiscussTask?: (taskId: string) => void;
  onAddTaskComment: (projectId: string, taskId: string, comment: Omit<TaskComment, 'id' | 'createdAt'>) => void;
}

export function ProjectTasksTab({
  project,
  readOnly,
  onAssignTaskClick,
  onUpdateTaskStatus,
  onDeleteTask,
  onDiscussTask,
  onAddTaskComment
}: ProjectTasksTabProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [taskCommentText, setTaskCommentText] = useState('');
  const [taskCommentImage, setTaskCommentImage] = useState<File | null>(null);
  const taskImageInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = (taskId: string) => {
    if (!taskCommentText.trim() && !taskCommentImage) return;

    let imageUrl = undefined;
    if (taskCommentImage) {
      imageUrl = URL.createObjectURL(taskCommentImage);
    }

    onAddTaskComment(project.id, taskId, {
      authorRole: 'MANAGER',
      authorName: 'Manager',
      content: taskCommentText.trim(),
      imageUrl
    });

    setTaskCommentText('');
    setTaskCommentImage(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Engineer Tasks</h3>
        {!readOnly && (
          <button 
            onClick={onAssignTaskClick}
            disabled={project.engineers.length === 0}
            className="flex items-center gap-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" /> Assign Task
          </button>
        )}
      </div>
      {(!project.tasks || project.tasks.length === 0) ? (
        <p className="text-gray-500 dark:text-gray-400 italic">
          {project.engineers.length === 0 ? "Add engineers to the project to start assigning tasks." : "No tasks assigned yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {project.tasks.map(t => {
            const assignee = project.engineers.find(e => e.id === t.engineerId);
            return (
              <div key={t.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="pt-0.5">
                      {t.status === 'DONE' ? (
                        <SquareCheck className="w-5 h-5 text-brand-green-text" />
                      ) : t.status === 'IN_PROGRESS' ? (
                        <ListTodo className="w-5 h-5 text-amber-500" />
                      ) : (
                        <ListTodo className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h4 className={cn("font-medium", t.status === 'DONE' ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white")}>
                        {t.title}
                      </h4>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        {assignee ? (
                          <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                            <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold uppercase">{assignee.name.charAt(0)}</div>
                            {assignee.name}
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 dark:text-red-400">Unassigned</span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">• Created {formatTimeAgo(t.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:pl-0 pl-9">
                    <button
                      onClick={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", expandedTaskId === t.id ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800")}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t.comments?.length ? \`\${t.comments.length} Messages\` : 'Discuss'}
                    </button>

                    <select
                      value={t.status}
                      onChange={(e) => onUpdateTaskStatus(project.id, t.id, e.target.value as TaskStatus)}
                      disabled={readOnly}
                      className={cn("text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white", readOnly ? "opacity-70 cursor-not-allowed" : "")}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                    {!readOnly && (
                      <button 
                        onClick={() => onDeleteTask(project.id, t.id)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {expandedTaskId === t.id && (
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Task Discussion</h4>
                      {onDiscussTask && (
                        <button onClick={() => onDiscussTask(t.id)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          Open in Full Messages View <ArrowLeft className="w-3 h-3 rotate-[135deg]" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 max-h-64 overflow-y-auto mb-4 p-2 custom-scrollbar">
                      {(!t.comments || t.comments.length === 0) ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No messages yet. Start the discussion.</p>
                      ) : (
                        t.comments.map(c => (
                          <div key={c.id} className={cn("flex flex-col max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl", c.authorRole === 'MANAGER' ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 self-end rounded-br-sm shadow-sm" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white self-start rounded-bl-sm shadow-sm")}>
                            <span className={cn("text-[10px] uppercase font-bold tracking-wider mb-1", c.authorRole === 'MANAGER' ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400")}>
                              {c.authorName} • {formatTimeAgo(c.createdAt)}
                            </span>
                            {c.content && <p className="text-sm whitespace-pre-wrap">{c.content}</p>}
                            {c.imageUrl && (
                              <img src={c.imageUrl} alt="Attachment" className="mt-2 rounded-lg max-h-40 object-cover border border-gray-100/20" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {!readOnly && (
                      <div className="flex flex-col gap-2 mt-auto">
                        {taskCommentImage && (
                          <div className="relative inline-block w-20 h-20 group rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <img src={URL.createObjectURL(taskCommentImage)} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setTaskCommentImage(null)} 
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-end gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-white focus-within:border-transparent transition-all">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={taskImageInputRef}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setTaskCommentImage(e.target.files[0]);
                              }
                            }}
                          />
                          <button 
                            onClick={() => taskImageInputRef.current?.click()}
                            className="p-2 sm:p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                            title="Attach Image"
                          >
                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <textarea
                            value={taskCommentText}
                            onChange={(e) => setTaskCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(t.id);
                              }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm py-2.5 px-2 outline-none resize-none max-h-32 min-h-[40px]"
                            rows={1}
                          />
                          <button 
                            onClick={() => handleSendMessage(t.id)}
                            disabled={!taskCommentText.trim() && !taskCommentImage}
                            className="p-2 sm:p-2.5 text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
                          >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/projects/tabs/ProjectTasksTab.tsx', tasksTab);

