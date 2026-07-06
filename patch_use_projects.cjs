const fs = require('fs');
let code = fs.readFileSync('src/hooks/useProjects.ts', 'utf8');

code = code.replace("const STORAGE_KEY = 'tavron-projects-data-v3';", "const STORAGE_KEY = 'tavron-projects-data-v4';");

const addDailyLogFunc = `
  const addDailyLog = useCallback((projectId: string, log: any) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, dailyLogs: [log, ...(p.dailyLogs || [])], updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Submitted daily log', modified);
  }, [projects, commit]);
`;

code = code.replace("return {", addDailyLogFunc + "\n  return {");
code = code.replace("addTaskComment", "addTaskComment,\n    addDailyLog");

fs.writeFileSync('src/hooks/useProjects.ts', code);
