const fs = require('fs');

const code = `import { Engineer, Project, Milestone } from './types';

export const mockEngineers: Engineer[] = [
  { id: 'eng-1', name: 'Parthu', email: 'parthsarathi3915@gmail.com', role: 'Engineer' },
  { id: 'eng-2', name: 'Parthu Epic', email: 'parthuepicgames@gmail.com', role: 'Engineer' }
];

const generatedMilestones: Milestone[] = Array.from({ length: 30 }).map((_, i) => {
  const isPast = i < 10;
  const isCurrent = i >= 10 && i < 15;
  const status = isPast ? 'COMPLETED' : isCurrent ? 'IN_PROGRESS' : 'PENDING';
  const daysOffset = i * 2 - 20;
  
  return {
    id: \`m-gen-\${i}\`,
    title: \`Milestone \${i + 1}: \${['Design', 'Implementation', 'Testing', 'Review', 'Deployment'][i % 5]} Phase\`,
    description: \`Detailed requirements for phase \${i + 1}\`,
    dueDate: new Date(Date.now() + daysOffset * 86400000).toISOString(),
    status
  };
});

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Tavron Core V2',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 21 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 21 * 3600000).toISOString(),
    engineers: [mockEngineers[0]],
    milestones: [
      { id: 'm-1', title: 'Architecture Review', dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), status: 'IN_PROGRESS' },
      { id: 'm-2', title: 'Beta Release', dueDate: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'PENDING' },
      ...generatedMilestones
    ],
    docs: [
      { id: 'd-1', title: 'Architecture Spec', url: 'https://docs.tavron.com/core-v2-spec', type: 'LINK', dateAdded: new Date(Date.now() - 86400000).toISOString() }
    ],
    tasks: []
  },
  {
    id: 'proj-2',
    name: 'Kemen Systems Integration',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    engineers: [mockEngineers[0], mockEngineers[1]],
    milestones: [
      { id: 'm-k1', title: 'Initial System Handshake', dueDate: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'PENDING' }
    ],
    docs: [],
    tasks: []
  },
  {
    id: 'proj-3',
    name: 'Mani Offset Project',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    engineers: [mockEngineers[1]],
    milestones: [
      { id: 'm-3', title: 'Initial Kickoff', dueDate: new Date(Date.now() - 15 * 86400000).toISOString(), status: 'COMPLETED' }
    ],
    docs: [
      { id: 'd-2', title: 'Client Requirements.pdf', url: '#', type: 'DOCUMENT', dateAdded: new Date(Date.now() - 17 * 86400000).toISOString() }
    ],
    tasks: []
  }
];
`;

fs.writeFileSync('src/data.ts', code);
