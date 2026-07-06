const fs = require('fs');
let code = fs.readFileSync('src/hooks/useProjects.ts', 'utf8');

code = code.replace(`import { useState, useEffect, useCallback, useRef, useMemo } from 'react';`, `import { useState, useEffect, useCallback, useRef } from 'react';`);

const oldReturn = `return {
    projects,
    loading,`;

code = code.replace(`const filteredProjects = useMemo(() => {
    return projects.map(p => {
      const pending = p.milestones
        .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 2);
      return { ...p, milestones: pending };
    });
  }, [projects]);

  return {
    projects: filteredProjects,
    loading,`, oldReturn);

fs.writeFileSync('src/hooks/useProjects.ts', code);
