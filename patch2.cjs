const fs = require('fs');
let code = fs.readFileSync('src/components/projects/ProjectDetails.tsx', 'utf8');

code = code.replace(
  "import { mockEngineers } from '@/data';",
  "import { useEffect } from 'react';"
);

code = code.replace(
  "  // Filter available engineers to not show ones already in project\n  const availableEngineers = mockEngineers.filter(me => !project.engineers.find(e => e.id === me.id));",
  `  const [backendEngineers, setBackendEngineers] = useState<Engineer[]>([]);
  useEffect(() => {
    fetch('/api/engineers')
      .then(res => res.json())
      .then(data => setBackendEngineers(data))
      .catch(err => console.error("Failed to fetch engineers", err));
  }, []);

  // Filter available engineers to not show ones already in project
  const availableEngineers = backendEngineers.filter(me => !project.engineers.find(e => e.id === me.id));`
);
fs.writeFileSync('src/components/projects/ProjectDetails.tsx', code);
