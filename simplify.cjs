const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/WorkloadWidget.tsx', 'utf8');
code = code.replace(
  "<span>{totalTasks} tasks ({projectTasks} proj, {delegatedTasks} del)</span>",
  "<span>{totalTasks} tasks at hand</span>"
);
fs.writeFileSync('src/components/dashboard/WorkloadWidget.tsx', code);
