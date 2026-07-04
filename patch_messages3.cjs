const fs = require('fs');
let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

if(!code.includes("const [dmChats, setDmChats] = useState")) {
  code = code.replace(
    "const [attachedImage, setAttachedImage] = useState<string | null>(null);",
    `const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [dmChats, setDmChats] = useState<Record<string, any[]>>({});`
  );
}

code = code.replace(
  "  const activeTaskComments = activeChat?.isTask ? (activeChat.originalTask.comments || []) : [];",
  `  const activeTaskComments = activeChat?.isTask ? (activeChat.originalTask.comments || []) : (dmChats[activeChat?.id || ''] || []);`
);

code = code.replace(
  "    if (activeChat?.isTask && onAddTaskComment) {\n      onAddTaskComment(activeChat.project.id, activeChat.originalTask.id, {\n        id: generateId(),\n        authorRole: userRole === 'MANAGER' ? 'MANAGER' : 'ENGINEER',\n        authorName: myName,\n        content: messageText.trim(),\n        createdAt: new Date().toISOString(),\n        imageUrl: attachedImage || undefined\n      });\n      setMessageText('');\n      setAttachedImage(null);\n    }",
  `    if (activeChat?.isTask && onAddTaskComment) {
      onAddTaskComment(activeChat.project.id, activeChat.originalTask.id, {
        id: generateId(),
        authorRole: userRole === 'MANAGER' ? 'MANAGER' : 'ENGINEER',
        authorName: myName,
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
            authorRole: userRole,
            authorName: myName,
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
