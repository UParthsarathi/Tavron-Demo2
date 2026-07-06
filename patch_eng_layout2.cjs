const fs = require('fs');

let code = fs.readFileSync('src/components/layout/EngineerLayout.tsx', 'utf8');

const filterLogic = `// Filter projects where this engineer is assigned
  const assignedProjects = projects.filter(p => 
    p.engineers.some(e => e.email.toLowerCase().trim() === myEmail)
  ).map(p => {
    // Only consider the next 2 pending/in-progress milestones
    const pending = p.milestones
      .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2);
    const completed = p.milestones.filter(m => m.status === 'COMPLETED');
    
    // Sort all relevant milestones by due date
    const relevantMilestones = [...completed, ...pending].sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    return {
      ...p,
      milestones: relevantMilestones
    };
  });

  const selectedProject = selectedProjectId 
    ? assignedProjects.find(p => p.id === selectedProjectId) 
    : null;`;

code = code.replace(`// Filter projects where this engineer is assigned
  const assignedProjects = projects.filter(p => 
    p.engineers.some(e => e.email.toLowerCase().trim() === myEmail)
  );

  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId) 
    : null;`, filterLogic);

fs.writeFileSync('src/components/layout/EngineerLayout.tsx', code);
