const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const dailyLogCode = `
export interface DailyLog {
  id: string;
  projectId: string;
  engineerId: string;
  engineerName: string;
  tasksCompleted: string;
  blockers?: string;
  photoUrl: string;
  location?: { lat: number; lng: number };
  createdAt: string;
}
`;

code = code.replace("export interface Project {", dailyLogCode + "\nexport interface Project {\n  dailyLogs?: DailyLog[];");
fs.writeFileSync('src/types.ts', code);
