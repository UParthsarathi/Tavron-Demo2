const fs = require('fs');
let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

code = code.replace(
  "                        if (activeChat?.isTask && onAddTaskComment) {\n                          onAddTaskComment(activeChat.project.id, activeChat.originalTask.id, {\n                            id: generateId(),\n                            authorRole: 'ENGINEER',\n                            authorName: activeChat.engineer ? activeChat.engineer.name : 'Simulated Engineer',\n                            content: messageText.trim(),\n                            createdAt: new Date().toISOString(),\n                            imageUrl: attachedImage || undefined\n                          });\n                          setMessageText('');\n                          setAttachedImage(null);\n                        }",
  `                        if (activeChat?.isTask && onAddTaskComment) {
                          onAddTaskComment(activeChat.project.id, activeChat.originalTask.id, {
                            id: generateId(),
                            authorRole: 'ENGINEER',
                            authorName: activeChat.engineer ? activeChat.engineer.name : 'Simulated Engineer',
                            content: messageText.trim(),
                            createdAt: new Date().toISOString(),
                            imageUrl: attachedImage || undefined
                          });
                          setMessageText('');
                          setAttachedImage(null);
                        } else if (activeChat && !activeChat.isTask) {
                          setDmChats(prev => ({
                            ...prev,
                            [activeChat.id]: [
                              ...(prev[activeChat.id] || []),
                              {
                                id: generateId(),
                                authorRole: 'ENGINEER',
                                authorName: activeChat.engineer ? activeChat.engineer.name : 'Simulated Engineer',
                                content: messageText.trim(),
                                createdAt: new Date().toISOString(),
                                imageUrl: attachedImage || undefined
                              }
                            ]
                          }));
                          setMessageText('');
                          setAttachedImage(null);
                        }`
);

fs.writeFileSync('src/components/messages/MessagesView.tsx', code);
