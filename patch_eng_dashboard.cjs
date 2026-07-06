const fs = require('fs');

let code = fs.readFileSync('src/components/dashboard/EngineerDashboard.tsx', 'utf8');

code = code.replace("t.status === 'PENDING' || t.status === 'IN_PROGRESS'", "t.status === 'TODO' || t.status === 'IN_PROGRESS'");
code = code.replace("t.status === 'COMPLETED'", "t.status === 'DONE'");
code = code.replace("{task.description || 'No description'}", "{task.title}");

fs.writeFileSync('src/components/dashboard/EngineerDashboard.tsx', code);
