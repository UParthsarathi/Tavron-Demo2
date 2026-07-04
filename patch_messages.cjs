const fs = require('fs');
let code = fs.readFileSync('src/components/messages/MessagesView.tsx', 'utf8');

code = code.replace(
  "const [attachedImage, setAttachedImage] = useState<string | null>(null);",
  `const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [engineers, setEngineers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/engineers')
      .then(res => res.json())
      .then(data => setEngineers(data))
      .catch(console.error);
  }, []);`
);

code = code.replace(
  "  const allChats: any[] = [\n    ...taskChats\n  ];",
  `  const engineerChats = engineers.map(e => ({
    id: \`eng-\${e.id}\`,
    name: e.name,
    role: e.role,
    isTask: false,
    engineer: e
  }));

  const allChats: any[] = [
    ...taskChats,
    ...engineerChats
  ];`
);

fs.writeFileSync('src/components/messages/MessagesView.tsx', code);
