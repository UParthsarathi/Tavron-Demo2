const fs = require('fs');

// Patch ProjectDetails.tsx
let pd = fs.readFileSync('src/components/projects/ProjectDetails.tsx', 'utf8');
pd = pd.replace('onDiscussTask?: (taskId: string) => void;', 'onDiscussTask?: (task: EngineerTask) => void;');
fs.writeFileSync('src/components/projects/ProjectDetails.tsx', pd);

// Patch ProjectTasksTab.tsx
let ptt = fs.readFileSync('src/components/projects/tabs/ProjectTasksTab.tsx', 'utf8');
ptt = ptt.replace('onDiscussTask?: (taskId: string) => void;', 'onDiscussTask?: (task: EngineerTask) => void;');
ptt = ptt.replace('onClick={() => onDiscussTask(t.id)}', 'onClick={() => onDiscussTask(t)}');
fs.writeFileSync('src/components/projects/tabs/ProjectTasksTab.tsx', ptt);

// Patch ManagerLayout.tsx
let ml = fs.readFileSync('src/components/layout/ManagerLayout.tsx', 'utf8');
ml = ml.replace('onDiscussTask={(taskId) => {', 'onDiscussTask={(task) => {');
ml = ml.replace('setSelectedChatId(`task-${taskId}`);', 'setSelectedChatId(`proj-${selectedProjectId}-eng-${task.engineerId}`);');
fs.writeFileSync('src/components/layout/ManagerLayout.tsx', ml);

// Patch EngineerLayout.tsx
let el = fs.readFileSync('src/components/layout/EngineerLayout.tsx', 'utf8');
el = el.replace('onDiscussTask={(taskId) => {', 'onDiscussTask={(task) => {');
el = el.replace('setSelectedChatId(`task-${taskId}`);', 'setSelectedChatId(`proj-${selectedProjectId}-eng-${task.engineerId}`);');
fs.writeFileSync('src/components/layout/EngineerLayout.tsx', el);

