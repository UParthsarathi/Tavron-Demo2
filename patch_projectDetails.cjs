const fs = require('fs');
let code = fs.readFileSync('src/components/projects/ProjectDetails.tsx', 'utf8');

const filterLogic = `const pendingMilestones = project.milestones.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 2);
  const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED');
  const displayMilestones = [...completedMilestones, ...pendingMilestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (`;

code = code.replace(`return (`, filterLogic);
code = code.replace(`{project.milestones.map(m => {`, `{displayMilestones.map(m => {`);

fs.writeFileSync('src/components/projects/ProjectDetails.tsx', code);
