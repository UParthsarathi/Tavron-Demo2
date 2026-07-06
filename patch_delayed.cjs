const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DelayedProjectsWidget.tsx', 'utf8');

const updatedDelayed = `const delayedProjects = projects.filter(p => {
    if (p.status !== 'ACTIVE') return false;
    const projectPending = p.milestones
      .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2);
    return projectPending.some(m => {
      const isPastDue = new Date(m.dueDate).getTime() < Date.now();
      return isPastDue;
    });
  });`;

code = code.replace(`const delayedProjects = projects.filter(p => {
    if (p.status !== 'ACTIVE') return false;
    return p.milestones.some(m => {
      const isPastDue = new Date(m.dueDate).getTime() < Date.now();
      return isPastDue && m.status !== 'COMPLETED';
    });
  });`, updatedDelayed);

const renderDelayed = `const delayedMilestones = project.milestones
              .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 2)
              .filter(m => new Date(m.dueDate).getTime() < Date.now());`;

code = code.replace(`const delayedMilestones = project.milestones.filter(m => new Date(m.dueDate).getTime() < Date.now() && m.status !== 'COMPLETED');`, renderDelayed);

fs.writeFileSync('src/components/dashboard/DelayedProjectsWidget.tsx', code);
