const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/WorkloadWidget.tsx', 'utf8');

code = code.replace(
  /<div className="text-right">[\s\S]*?<\/div>/,
  `<div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activeProjects} <span className="text-xs text-gray-500 font-normal">proj</span></p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{totalTasks} <span className="text-xs text-gray-500 font-normal">tasks</span></p>
                </div>`
);

code = code.replace(
  /<div className="flex justify-between text-\[10px\] text-gray-500">[\s\S]*?<\/div>/,
  ``
);

fs.writeFileSync('src/components/dashboard/WorkloadWidget.tsx', code);
