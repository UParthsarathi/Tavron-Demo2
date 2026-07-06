const fs = require('fs');
let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

// Update normal handleSendMessage
code = code.replace(
  `    } else if (activeChat && !activeChat.isTask) {
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
    }`,
  `    } else if (activeChat && !activeChat.isTask) {
      const newMsg = {
        id: generateId(),
        sender_email: user?.email || '',
        sender_name: myName,
        sender_role: userRole,
        content: messageText.trim(),
        created_at: new Date().toISOString(),
        image_url: attachedImage || undefined
      };
      fetch(\`/api/messages/\${activeChat.id}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      }).catch(console.error);

      setDmChats(prev => ({
        ...prev,
        [activeChat.id]: [
          ...(prev[activeChat.id] || []),
          {
            id: newMsg.id,
            authorRole: newMsg.sender_role,
            authorName: newMsg.sender_name,
            content: newMsg.content,
            createdAt: newMsg.created_at,
            imageUrl: newMsg.image_url
          }
        ]
      }));
      setMessageText('');
      setAttachedImage(null);
    }`
);

// Add useEffect for polling
if (!code.includes('setInterval(')) {
  code = code.replace(
    "  const handleSendMessage = (e: React.FormEvent) => {",
    `  useEffect(() => {
    if (!activeChat || activeChat.isTask) return;
    const fetchMessages = () => {
      fetch(\`/api/messages/\${activeChat.id}\`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setDmChats(prev => ({
              ...prev,
              [activeChat.id]: data.map((msg: any) => ({
                id: msg.id,
                authorRole: msg.sender_role,
                authorName: msg.sender_name,
                content: msg.content,
                createdAt: msg.created_at,
                imageUrl: msg.image_url
              }))
            }));
          }
        })
        .catch(console.error);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [activeChat?.id]);

  const handleSendMessage = (e: React.FormEvent) => {`
  );
}

// Update simulated reply
code = code.replace(
  `                        } else if (activeChat && !activeChat.isTask) {
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
                        }`,
  `                        } else if (activeChat && !activeChat.isTask) {
                          const newMsg = {
                            id: generateId(),
                            sender_email: activeChat.engineer ? activeChat.engineer.email : 'simulated@engineer.com',
                            sender_name: activeChat.engineer ? activeChat.engineer.name : 'Simulated Engineer',
                            sender_role: 'ENGINEER',
                            content: messageText.trim(),
                            created_at: new Date().toISOString(),
                            image_url: attachedImage || undefined
                          };
                          fetch(\`/api/messages/\${activeChat.id}\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newMsg)
                          }).catch(console.error);

                          setDmChats(prev => ({
                            ...prev,
                            [activeChat.id]: [
                              ...(prev[activeChat.id] || []),
                              {
                                id: newMsg.id,
                                authorRole: newMsg.sender_role,
                                authorName: newMsg.sender_name,
                                content: newMsg.content,
                                createdAt: newMsg.created_at,
                                imageUrl: newMsg.image_url
                              }
                            ]
                          }));
                          setMessageText('');
                          setAttachedImage(null);
                        }`
);

fs.writeFileSync('src/components/messages/MessagesView.tsx', code);
