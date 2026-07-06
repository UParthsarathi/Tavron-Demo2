const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/EngineerDashboard.tsx', 'utf8');

code = code.replace(`).slice(0, 5);`, `);`);

fs.writeFileSync('src/components/dashboard/EngineerDashboard.tsx', code);
