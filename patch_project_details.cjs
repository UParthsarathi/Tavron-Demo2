const fs = require('fs');
let code = fs.readFileSync('src/components/projects/ProjectDetails.tsx', 'utf8');

const targetState = `  const [activeTab, setActiveTab] = useState<'overview' | 'engineers' | 'milestones' | 'tasks'>('overview');`;
const replacementState = `  const [activeTab, setActiveTab] = useState<'overview' | 'engineers' | 'milestones' | 'tasks' | 'logs'>('overview');`;
code = code.replace(targetState, replacementState);

const targetTabs = `          { id: 'overview', label: 'Overview' },
          { id: 'engineers', label: 'Engineers' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'milestones', label: 'Milestones' }`;
const replacementTabs = `          { id: 'overview', label: 'Overview' },
          { id: 'engineers', label: 'Engineers' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'milestones', label: 'Milestones' },
          { id: 'logs', label: 'Daily Logs' }`;
code = code.replace(targetTabs, replacementTabs);

const targetLogsContent = `        {activeTab === 'milestones' && (`;
const replacementLogsContent = `        {activeTab === 'logs' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Daily Logs</h3>
            </div>
            {(!project.dailyLogs || project.dailyLogs.length === 0) ? (
              <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">No logs yet</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Engineers haven't submitted any daily logs for this project.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {[...project.dailyLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(log => (
                  <div key={log.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-full sm:w-1/3 md:w-1/4 flex-shrink-0">
                        {log.photoUrl ? (
                          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 relative">
                            <img src={log.photoUrl} alt="Site capture" className="w-full h-full object-cover" />
                            {log.location && (
                              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md">
                                <MapPin className="w-3 h-3" /> Geo-tagged
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full aspect-[4/3] rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400">
                            No photo
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              {log.engineerName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {new Date(log.createdAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Work Completed</span>
                          <p className="whitespace-pre-wrap">{log.tasksCompleted}</p>
                        </div>
                        {log.blockers && (
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Blockers / Issues</span>
                            <p className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/30 whitespace-pre-wrap">{log.blockers}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'milestones' && (`;
code = code.replace(targetLogsContent, replacementLogsContent);

const iconTarget = `import { Circle, CircleCheck, CheckCircle2, ChevronRight, MessageSquare, ChevronLeft, Calendar, FileText, Upload, Plus, PencilLine, Download, MapPin, Search } from 'lucide-react';`;
if (!code.includes("MapPin")) {
  code = code.replace("FileText, Upload, Plus", "FileText, Upload, Plus, MapPin");
}

fs.writeFileSync('src/components/projects/ProjectDetails.tsx', code);
