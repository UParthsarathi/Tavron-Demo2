const fs = require('fs');
let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

code = code.replace(
  /              <div className="bg-white dark:bg-\[\#18181b\] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm mb-6">\n                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Project Discussion Context<\/h4>\n                <p className="text-sm text-gray-500 dark:text-gray-400">\n                  This discussion is tied to the task <strong>\{activeChat.name\}<\/strong> in \{activeChat.role\}.\n                <\/p>\n              <\/div>/,
  `              <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{activeChat.isTask ? "Project Discussion Context" : "Direct Message Context"}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeChat.isTask 
                    ? <>This discussion is tied to the task <strong>{activeChat.name}</strong> in {activeChat.role}.</> 
                    : <>This is a direct message with <strong>{activeChat.name}</strong> ({activeChat.role}).</>}
                </p>
              </div>`
);
fs.writeFileSync('src/components/messages/MessagesView.tsx', code);
