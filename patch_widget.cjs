const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/UpcomingMilestonesWidget.tsx', 'utf8');

const updatedLogic = `export function UpcomingMilestonesWidget({ projects }: UpcomingMilestonesWidgetProps) {
  const upcoming: { project: Project, milestone: Milestone }[] = [];
  
  projects.forEach(p => {
    if (p.status !== 'ACTIVE') return;
    const projectPending = p.milestones
      .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2);
      
    projectPending.forEach(m => {
      const dueDate = new Date(m.dueDate);
      const now = new Date();
      // Look ahead up to 30 days, ignore past due
      if (isAfter(dueDate, now) && isBefore(dueDate, addDays(now, 30))) {
        upcoming.push({ project: p, milestone: m });
      }
    });
  });

  upcoming.sort((a, b) => new Date(a.milestone.dueDate).getTime() - new Date(b.milestone.dueDate).getTime());`;

code = code.replace(`export function UpcomingMilestonesWidget({ projects }: UpcomingMilestonesWidgetProps) {
  const upcoming: { project: Project, milestone: Milestone }[] = [];
  
  projects.forEach(p => {
    if (p.status !== 'ACTIVE') return;
    p.milestones.forEach(m => {
      const dueDate = new Date(m.dueDate);
      const now = new Date();
      // Look ahead up to 30 days, ignore past due
      if (m.status !== 'COMPLETED' && isAfter(dueDate, now) && isBefore(dueDate, addDays(now, 30))) {
        upcoming.push({ project: p, milestone: m });
      }
    });
  });

  upcoming.sort((a, b) => new Date(a.milestone.dueDate).getTime() - new Date(b.milestone.dueDate).getTime());`, updatedLogic);

code = code.replace(`{upcoming.slice(0, 5).map(({ project, milestone }) => (`, `{upcoming.map(({ project, milestone }) => (`);

fs.writeFileSync('src/components/dashboard/UpcomingMilestonesWidget.tsx', code);
