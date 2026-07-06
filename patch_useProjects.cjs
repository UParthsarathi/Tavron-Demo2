const fs = require('fs');
let code = fs.readFileSync('src/hooks/useProjects.ts', 'utf8');

code = code.replace(`import { useState, useEffect, useCallback, useRef } from 'react';`, `import { useState, useEffect, useCallback, useRef, useMemo } from 'react';`);

const returnStatement = `const filteredProjects = useMemo(() => {
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
  }, [projects]);

  return {
    projects: filteredProjects,
    loading,`;

code = code.replace(`return {
    projects,
    loading,`, returnStatement);

fs.writeFileSync('src/hooks/useProjects.ts', code);
