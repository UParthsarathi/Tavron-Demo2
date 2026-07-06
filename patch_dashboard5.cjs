const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/EngineerDashboard.tsx', 'utf8');

const updatedMilestonesLogic = `const allMilestones = projects.flatMap(p => 
    p.milestones.map(m => ({ ...m, projectName: p.name, projectId: p.id }))
  );
  
  const pendingMilestones = projects.flatMap(p => {
    return p.milestones
      .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2)
      .map(m => ({ ...m, projectName: p.name, projectId: p.id }));
  });
  const completedMilestones = allMilestones.filter(m => m.status === 'COMPLETED');
  
  const upcomingMilestones = [...pendingMilestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());`;

code = code.replace(`const allMilestones = projects.flatMap(p => 
    p.milestones.map(m => ({ ...m, projectName: p.name, projectId: p.id }))
  );
  
  const pendingMilestones = allMilestones.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS');
  const completedMilestones = allMilestones.filter(m => m.status === 'COMPLETED');
  
  const upcomingMilestones = projects.flatMap(p => {
    return p.milestones
      .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2)
      .map(m => ({ ...m, projectName: p.name, projectId: p.id }));
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());`, updatedMilestonesLogic);

fs.writeFileSync('src/components/dashboard/EngineerDashboard.tsx', code);
