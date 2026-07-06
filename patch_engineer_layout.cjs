const fs = require('fs');

let code = fs.readFileSync('src/components/layout/EngineerLayout.tsx', 'utf8');

const importStatement = `import { EngineerDashboard } from '@/components/dashboard/EngineerDashboard';\nexport function EngineerLayout`;

code = code.replace(`export function EngineerLayout`, importStatement);

const renderDashboard = `) : currentView === 'account' ? (
          <AccountView />
        ) : currentView === 'dashboard' ? (
          <EngineerDashboard projects={assignedProjects} />
        ) : selectedProject ? (`;

code = code.replace(`) : currentView === 'account' ? (
          <AccountView />
        ) : selectedProject ? (`, renderDashboard);

fs.writeFileSync('src/components/layout/EngineerLayout.tsx', code);
