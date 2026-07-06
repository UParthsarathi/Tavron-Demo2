const fs = require('fs');
let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

const projectChatsOld = `  const projectChats: any[] = projects.map(p => ({
    id: \`proj-\${p.id}\`,
    name: p.name,
    role: \`Project • \${p.engineers.length} engineers\`,
    isTask: false,
    isProject: true,
    project: p
  }));`;

const projectChatsNew = `  const projectEngineerChats: any[] = projects.flatMap(p => 
    p.engineers.map(e => ({
      id: \`proj-\${p.id}-eng-\${e.id}\`,
      name: e.name,
      role: \`Project: \${p.name}\`,
      isTask: false,
      isProjectContext: true,
      engineer: e,
      project: p
    }))
  );`;

code = code.replace(projectChatsOld, projectChatsNew);
code = code.replace('...projectChats,', '...projectEngineerChats,');

const renderOld = `          {filteredChats.filter(c => c.isProject).length > 0 && (
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
          {filteredChats.filter(c => !c.isProject).map((chat) => (`;

const renderNew = `          {filteredChats.filter(c => c.isProjectContext).length > 0 && (
            <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Project Discussions
            </div>
          )}
          {filteredChats.filter(c => c.isProjectContext).map((chat) => (
            <button 
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={cn(
                "w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800/50 text-left relative",
                selectedChat === chat.id ? "bg-gray-50 dark:bg-gray-800/80" : ""
              )}
            >
              <div className="relative flex-shrink-0">
                {chat.engineer?.avatar ? (
                  <img src={chat.engineer.avatar} alt={chat.name} className="w-10 h-10 rounded-full bg-gray-100 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold uppercase">
                    {chat.name.charAt(0)}
                  </div>
                )}
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
          
          {filteredChats.filter(c => !c.isProjectContext).length > 0 && (
            <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800/50 border-t text-xs font-bold text-gray-500 uppercase tracking-wider">
              General Direct Messages
            </div>
          )}
          {filteredChats.filter(c => !c.isProjectContext).map((chat) => (`;

code = code.replace(renderOld, renderNew);

const headerOld = `              <div className="flex flex-col">
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

const headerNew = `              <div className="flex flex-col">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {activeChat.isProjectContext ? <Hash className="w-4 h-4 text-indigo-400" /> : null}
                  {activeChat.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-[400px]">
                  {activeChat.isProjectContext 
                    ? <>Discussion regarding <strong>{activeChat.project?.name}</strong> with {activeChat.name}.</> 
                    : <>This is a direct message with <strong>{activeChat.name}</strong> ({activeChat.role}).</>}
                </p>
              </div>`;

code = code.replace(headerOld, headerNew);

const contextLabelOld = `                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{activeChat.isTask ? "Project Discussion Context" : "Direct Message Context"}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeChat.isTask 
                    ? <>This discussion is tied to the task <strong>{activeChat.name}</strong> in {activeChat.role}.</> 
                    : <>This is a direct message with <strong>{activeChat.name}</strong> ({activeChat.role}).</>}
                </p>`;
const contextLabelNew = `                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{activeChat.isProjectContext ? "Project Context" : "Direct Message Context"}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeChat.isProjectContext 
                    ? <>This is your 1-on-1 thread with <strong>{activeChat.name}</strong> scoped to the project <strong>{activeChat.project?.name}</strong>.</> 
                    : <>This is a direct message with <strong>{activeChat.name}</strong> ({activeChat.role}).</>}
                </p>`;

code = code.replace(contextLabelOld, contextLabelNew);

fs.writeFileSync('src/components/messages/MessagesView.tsx', code);
