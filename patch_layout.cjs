const fs = require('fs');
let code = fs.readFileSync('src/components/layout/EngineerLayout.tsx', 'utf8');

code = code.replace(
  "import { EngineerDashboard } from '@/components/dashboard/EngineerDashboard';",
  "import { EngineerDashboard } from '@/components/dashboard/EngineerDashboard';\nimport { DailyLogView } from '@/components/daily-log/DailyLogView';"
);

const targetRender = `        ) : currentView === 'dashboard' ? (
          <EngineerDashboard projects={assignedProjects} />`;

const replacementRender = `        ) : currentView === 'dashboard' ? (
          <EngineerDashboard projects={assignedProjects} />
        ) : currentView === 'daily_log' ? (
          <DailyLogView />`;

code = code.replace(targetRender, replacementRender);

fs.writeFileSync('src/components/layout/EngineerLayout.tsx', code);
