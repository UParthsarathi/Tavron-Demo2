const fs = require('fs');
let code = fs.readFileSync('src/hooks/useProjects.ts', 'utf8');

// Replace the bad line
code = code.replace("const addTaskComment =\n    addDailyLog = useCallback", "const addTaskComment = useCallback");

// Replace the inner addDailyLog we accidentally created? No, wait:
/*
  const addTaskComment =
    addDailyLog = useCallback((projectId: string, taskId: string, comment: TaskComment) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        const newTasks = p.tasks.map(t => {
          if (t.id === taskId) {
              const addDailyLog = useCallback((projectId: string, log: any) => {
*/

code = code.replace("  const addTaskComment =\n    addDailyLog = useCallback", "  const addTaskComment = useCallback");
code = code.replace("          if (t.id === taskId) {\n              const addDailyLog = useCallback", "            return { ...t, comments: [...(t.comments || []), comment] };\n          }\n          return t;\n        });\n        modified = { ...p, tasks: newTasks, updatedAt: new Date().toISOString() };\n        return modified;\n      }\n      return p;\n    });\n    commit(next, null, modified);\n  }, [projects, commit]);\n\n  const addDailyLog = useCallback");

fs.writeFileSync('src/hooks/useProjects.ts', code);
