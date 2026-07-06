const fs = require('fs');

let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

// Replace taskChats with projectChats
const taskChatsStr = `  const taskChats: any[] = projects.flatMap(p => 
    p.tasks.map(t => {
      const assignedEngineer = p.engineers.find(e => e.id === t.engineerId);
      return {
        id: \`task-\${t.id}\`,
        name: t.title,
        role: \`Project: \${p.name}\${assignedEngineer ? \` • Assigned to \${assignedEngineer.name}\` : ''}\`,
        isTask: true,
        originalTask: t,
        project: p,
        engineer: assignedEngineer
      };
    })
  );`;

const projectChatsStr = `  const projectChats: any[] = projects.map(p => ({
    id: \`proj-\${p.id}\`,
    name: p.name,
    role: \`Project • \${p.engineers.length} engineers\`,
    isTask: false,
    isProject: true,
    project: p
  }));`;

code = code.replace(taskChatsStr, projectChatsStr);
code = code.replace('...taskChats,', '...projectChats,');

const oldRenderStr = `{filteredChats.map((chat) => (
            <button 
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={cn(
                "w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800/50 text-left relative",
                selectedChat === chat.id ? "bg-gray-50 dark:bg-gray-800/80" : ""
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold uppercase">
                  {chat.isTask ? <Hash className="w-5 h-5" /> : chat.name.charAt(0)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate pr-2">{chat.name}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {chat.role}
                </p>
              </div>
            </button>
          ))}`;

const newRenderStr = `
          {filteredChats.filter(c => c.isProject).length > 0 && (
            <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Projects
            </div>
          )}
          {filteredChats.filter(c => c.isProject).map((chat) => (
            <button 
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={cn(
                "w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800/50 text-left relative",
                selectedChat === chat.id ? "bg-gray-50 dark:bg-gray-800/80" : ""
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold uppercase">
                  <Hash className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate pr-2">{chat.name}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {chat.role}
                </p>
              </div>
            </button>
          ))}
          
          {filteredChats.filter(c => !c.isProject).length > 0 && (
            <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800/50 border-t text-xs font-bold text-gray-500 uppercase tracking-wider">
              Direct Messages
            </div>
          )}
          {filteredChats.filter(c => !c.isProject).map((chat) => (
            <button 
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={cn(
                "w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800/50 text-left relative",
                selectedChat === chat.id ? "bg-gray-50 dark:bg-gray-800/80" : ""
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold uppercase">
                  {chat.name.charAt(0)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate pr-2">{chat.name}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {chat.role}
                </p>
              </div>
            </button>
          ))}
`;

code = code.replace(oldRenderStr, newRenderStr);

// Also need to adjust the header to match the new structure
const oldHeader = `              <div className="flex flex-col">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {activeChat.isTask ? <Hash className="w-4 h-4 text-gray-400" /> : null}
                  {activeChat.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-[400px]">
                  {activeChat.isTask 
                    ? <>This discussion is tied to the task <strong>{activeChat.name}</strong> in {activeChat.role}.</> 
                    : <>This is a direct message with <strong>{activeChat.name}</strong> ({activeChat.role}).</>}
                </p>
              </div>`;

const newHeader = `              <div className="flex flex-col">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {activeChat.isProject ? <Hash className="w-4 h-4 text-indigo-400" /> : null}
                  {activeChat.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-[400px]">
                  {activeChat.isProject 
                    ? <>This is the general discussion for <strong>{activeChat.name}</strong>.</> 
                    : <>This is a direct message with <strong>{activeChat.name}</strong> ({activeChat.role}).</>}
                </p>
              </div>`;

code = code.replace(oldHeader, newHeader);

// And we need to remove the "isTask" check from fetching messages since both use DM table now!
// Wait, currently:
// const activeTaskComments = activeChat?.isTask ? (activeChat.originalTask.comments || []) : (dmChats[activeChat?.id || ''] || []);

const activeTaskCommentsOld = `const activeTaskComments = activeChat?.isTask ? (activeChat.originalTask.comments || []) : (dmChats[activeChat?.id || ''] || []);`;
const activeTaskCommentsNew = `const activeTaskComments = dmChats[activeChat?.id || ''] || [];`;
code = code.replace(activeTaskCommentsOld, activeTaskCommentsNew);

const fetchOld = `  useEffect(() => {
    if (!activeChat || activeChat.isTask) return;
    const fetchMessages = () => {`;
const fetchNew = `  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = () => {`;
code = code.replace(fetchOld, fetchNew);

// Finally, we need to adjust handleSendMessage because it had special logic for tasks
code = code.replace(/if \(activeChat\?\.isTask && onAddTaskComment\) \{[\s\S]*?\} else if \(activeChat && !activeChat\.isTask\) \{/, 'if (activeChat) {');

// We also need to fix the second reference in the "Manager testing" simulated reply
code = code.replace(/if \(activeChat\?\.isTask && onAddTaskComment\) \{[\s\S]*?\} else if \(activeChat && !activeChat\.isTask\) \{/g, 'if (activeChat) {');

fs.writeFileSync('src/components/messages/MessagesView.tsx', code);
