const fs = require('fs');
let code = fs.readFileSync('src/components/daily-log/DailyLogView.tsx', 'utf8');

const targetReturn = `      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DailyLogForm 
          projects={assignedProjects} 
          onSubmit={handleSubmit} 
        />
      </motion.div>
    </div>
  );
}`;

const listCode = `
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DailyLogForm 
          projects={assignedProjects} 
          onSubmit={handleSubmit} 
        />
      </motion.div>

      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Recent Logs</h3>
        <div className="space-y-6">
          {(() => {
            const myLogs = assignedProjects.flatMap(p => 
              (p.dailyLogs || []).filter(l => l.engineerName === (user?.email?.split('@')[0] || 'Engineer') || p.engineers.some(e => e.email.toLowerCase().trim() === myEmail && l.engineerId === e.id))
                .map(l => ({ ...l, projectName: p.name }))
            ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            if (myLogs.length === 0) {
              return (
                <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <Clock className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">No past logs</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You haven't submitted any daily logs yet.</p>
                </div>
              );
            }
            
            return myLogs.map(log => (
              <div key={log.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-1/4 flex-shrink-0">
                    {log.photoUrl ? (
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 relative">
                        <img src={log.photoUrl} alt="Site capture" className="w-full h-full object-cover" />
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
                        <div className="font-medium text-gray-900 dark:text-gray-100">{log.projectName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Tasks Completed</span>
                      <p className="whitespace-pre-wrap">{log.tasksCompleted}</p>
                    </div>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
`;

code = code.replace(targetReturn, listCode);
fs.writeFileSync('src/components/daily-log/DailyLogView.tsx', code);
