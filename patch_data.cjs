const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

const importReplacement = `import { Engineer, Project, Milestone, EngineerTask, TaskComment, ProjectDoc, DailyLog } from './types';`;
code = code.replace(`import { Engineer, Project, Milestone, EngineerTask, TaskComment, ProjectDoc } from './types';`, importReplacement);

const dailyLogsGen = `
const generateDailyLogs = (projectIdx: number, engineersToAssign: Engineer[]): DailyLog[] => {
  return engineersToAssign.flatMap((eng, i) => {
    return [
      {
        id: \`dl-\${projectIdx}-\${eng.id}-1\`,
        projectId: \`proj-\${projectIdx}\`,
        engineerId: eng.id,
        engineerName: eng.name,
        tasksCompleted: \`Completed site preparation and initial module setup for Phase \${projectIdx}.\`,
        blockers: i % 2 === 0 ? 'Waiting on material delivery for the next phase.' : undefined,
        photoUrl: 'https://images.unsplash.com/photo-1541888081639-6511b8b60094?q=80&w=600&auto=format&fit=crop',
        location: { lat: 37.7749 + (Math.random() * 0.01), lng: -122.4194 + (Math.random() * 0.01) },
        createdAt: new Date(Date.now() - (24 + i * 2) * 3600000).toISOString()
      },
      {
        id: \`dl-\${projectIdx}-\${eng.id}-2\`,
        projectId: \`proj-\${projectIdx}\`,
        engineerId: eng.id,
        engineerName: eng.name,
        tasksCompleted: \`Finished wiring and tested the main connections.\`,
        photoUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop',
        location: { lat: 37.7749 + (Math.random() * 0.01), lng: -122.4194 + (Math.random() * 0.01) },
        createdAt: new Date(Date.now() - (48 + i * 2) * 3600000).toISOString()
      }
    ];
  });
};
`;

code = code.replace("export const initialProjects: Project[] = [", dailyLogsGen + "\nexport const initialProjects: Project[] = [");

code = code.replace(/tasks: generateTasks\(1, mockEngineers\.slice\(0, 5\)\)/g, "tasks: generateTasks(1, mockEngineers.slice(0, 5)),\n    dailyLogs: generateDailyLogs(1, mockEngineers.slice(0, 5))");
code = code.replace(/tasks: generateTasks\(2, mockEngineers\.slice\(3, 10\)\)/g, "tasks: generateTasks(2, mockEngineers.slice(3, 10)),\n    dailyLogs: generateDailyLogs(2, mockEngineers.slice(3, 10))");
code = code.replace(/tasks: generateTasks\(3, mockEngineers\.slice\(8, 15\)\)/g, "tasks: generateTasks(3, mockEngineers.slice(8, 15)),\n    dailyLogs: generateDailyLogs(3, mockEngineers.slice(8, 15))");
code = code.replace(/tasks: generateTasks\(4, \[mockEngineers\[0\], mockEngineers\[5\], mockEngineers\[10\], mockEngineers\[14\]\]\)/g, "tasks: generateTasks(4, [mockEngineers[0], mockEngineers[5], mockEngineers[10], mockEngineers[14]]),\n    dailyLogs: generateDailyLogs(4, [mockEngineers[0], mockEngineers[5], mockEngineers[10], mockEngineers[14]])");

fs.writeFileSync('src/data.ts', code);
