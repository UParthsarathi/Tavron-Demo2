const fs = require('fs');
let code = fs.readFileSync('src/hooks/useProjects.ts', 'utf8');

const returnStatement = `const filteredProjects = useMemo(() => {
    return projects.map(p => {
      const pending = p.milestones
        .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 2);
      return { ...p, milestones: pending };
    });
  }, [projects]);`;

code = code.replace(`const filteredProjects = useMemo(() => {
    return projects.map(p => {
      const pending = p.milestones
        .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 2);
      const completed = p.milestones.filter(m => m.status === 'COMPLETED');
      const relevantMilestones = [...completed, ...pending].sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      return { ...p, milestones: relevantMilestones };
    });
  }, [projects]);`, returnStatement);

fs.writeFileSync('src/hooks/useProjects.ts', code);
