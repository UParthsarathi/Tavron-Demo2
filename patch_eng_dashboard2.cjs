const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/EngineerDashboard.tsx', 'utf8');

code = code.replace(`<div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {task.title}
                    </div>`, ``);

fs.writeFileSync('src/components/dashboard/EngineerDashboard.tsx', code);
