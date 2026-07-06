const fs = require('fs');

const dataCode = `import { Engineer, Project, Milestone, EngineerTask, TaskComment, ProjectDoc } from './types';

export const mockEngineers: Engineer[] = [
  { id: 'eng-1', name: 'Parthsarathi', email: 'parthsarathi3915@gmail.com', role: 'Engineer' },
  { id: 'eng-2', name: 'Parthu Epic', email: 'parthuepicgames@gmail.com', role: 'Engineer' },
  { id: 'eng-3', name: 'Alice Smith', email: 'engineer3@demo.com', role: 'Frontend Engineer' },
  { id: 'eng-4', name: 'Bob Johnson', email: 'engineer4@demo.com', role: 'Backend Engineer' },
  { id: 'eng-5', name: 'Charlie Davis', email: 'engineer5@demo.com', role: 'DevOps Engineer' },
  { id: 'eng-6', name: 'Diana Evans', email: 'engineer6@demo.com', role: 'QA Engineer' },
  { id: 'eng-7', name: 'Evan Harris', email: 'engineer7@demo.com', role: 'Full Stack Engineer' },
  { id: 'eng-8', name: 'Fiona Garcia', email: 'engineer8@demo.com', role: 'Data Engineer' },
  { id: 'eng-9', name: 'George Hall', email: 'engineer9@demo.com', role: 'Security Engineer' },
  { id: 'eng-10', name: 'Hannah Lee', email: 'engineer10@demo.com', role: 'Mobile Engineer' },
  { id: 'eng-11', name: 'Ian Martin', email: 'engineer11@demo.com', role: 'Frontend Engineer' },
  { id: 'eng-12', name: 'Julia Nelson', email: 'engineer12@demo.com', role: 'Backend Engineer' },
  { id: 'eng-13', name: 'Kevin Perez', email: 'engineer13@demo.com', role: 'Systems Engineer' },
  { id: 'eng-14', name: 'Laura Quinn', email: 'engineer14@demo.com', role: 'Cloud Engineer' },
  { id: 'eng-15', name: 'Michael Reed', email: 'engineer15@demo.com', role: 'Full Stack Engineer' }
];

export const mockManagers = [
  { id: 'mgr-1', name: 'Parthu Manager', email: 'parthu3915@gmail.com', role: 'Product Manager' },
  { id: 'mgr-2', name: 'Admin Manager', email: 'manager@demo.com', role: 'Engineering Manager' }
];

const generatedMilestones: Milestone[] = Array.from({ length: 8 }).map((_, i) => {
  const isPast = i < 3;
  const isCurrent = i === 3;
  const status = isPast ? 'COMPLETED' : isCurrent ? 'IN_PROGRESS' : 'PENDING';
  const daysOffset = i * 4 - 10;
  
  return {
    id: \`m-gen-\${i}\`,
    title: \`Phase \${i + 1}: \${['Planning', 'Design', 'Implementation', 'Testing', 'Review', 'Deployment', 'Feedback', 'Optimization'][i % 8]}\`,
    description: \`Detailed requirements for phase \${i + 1}\`,
    dueDate: new Date(Date.now() + daysOffset * 86400000).toISOString(),
    status
  };
});

const generateTasks = (projectIdx: number, engineersToAssign: Engineer[]): EngineerTask[] => {
  return engineersToAssign.flatMap((eng, i) => {
    return [
      {
        id: \`t-\${projectIdx}-\${eng.id}-1\`,
        title: \`Setup environment for \${eng.name}\`,
        description: \`Initial repository setup and dependencies installation.\`,
        status: 'DONE',
        engineerId: eng.id,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        comments: []
      },
      {
        id: \`t-\${projectIdx}-\${eng.id}-2\`,
        title: \`Implement core feature module (\${i})\`,
        description: \`Work on the main business logic and API integration.\`,
        status: 'IN_PROGRESS',
        engineerId: eng.id,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        comments: [
          {
            id: \`c-\${projectIdx}-\${eng.id}-1\`,
            content: \`Started working on this today.\`,
            authorId: eng.id,
            authorName: eng.name,
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      },
      {
        id: \`t-\${projectIdx}-\${eng.id}-3\`,
        title: \`Write unit tests for module (\${i})\`,
        description: \`Ensure 80% test coverage.\`,
        status: 'TODO',
        engineerId: eng.id,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        comments: []
      }
    ];
  });
};

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Tavron Core V2',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 21 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 21 * 3600000).toISOString(),
    engineers: mockEngineers.slice(0, 5),
    milestones: [
      { id: 'm-1', title: 'Architecture Review', dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), status: 'IN_PROGRESS' },
      { id: 'm-2', title: 'Beta Release', dueDate: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'PENDING' },
      ...generatedMilestones
    ],
    docs: [
      { id: 'd-1', title: 'Architecture Spec', url: 'https://docs.tavron.com/core-v2-spec', type: 'LINK', dateAdded: new Date(Date.now() - 86400000).toISOString() }
    ],
    tasks: generateTasks(1, mockEngineers.slice(0, 5))
  },
  {
    id: 'proj-2',
    name: 'Kemen Systems Integration',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    engineers: mockEngineers.slice(3, 10),
    milestones: [
      { id: 'm-k1', title: 'Initial System Handshake', dueDate: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'PENDING' },
      { id: 'm-k2', title: 'Data Migration', dueDate: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'PENDING' }
    ],
    docs: [],
    tasks: generateTasks(2, mockEngineers.slice(3, 10))
  },
  {
    id: 'proj-3',
    name: 'Mani Offset Project',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    engineers: mockEngineers.slice(8, 15),
    milestones: [
      { id: 'm-3', title: 'Initial Kickoff', dueDate: new Date(Date.now() - 15 * 86400000).toISOString(), status: 'COMPLETED' },
      { id: 'm-4', title: 'Phase 1 Delivery', dueDate: new Date(Date.now() + 12 * 86400000).toISOString(), status: 'IN_PROGRESS' }
    ],
    docs: [
      { id: 'd-2', title: 'Client Requirements.pdf', url: '#', type: 'DOCUMENT', dateAdded: new Date(Date.now() - 17 * 86400000).toISOString() }
    ],
    tasks: generateTasks(3, mockEngineers.slice(8, 15))
  },
  {
    id: 'proj-4',
    name: 'Internal Tools Overhaul',
    status: 'ON_HOLD',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    engineers: [mockEngineers[0], mockEngineers[5], mockEngineers[10], mockEngineers[14]],
    milestones: [
      { id: 'm-5', title: 'Audit Existing Tools', dueDate: new Date(Date.now() - 20 * 86400000).toISOString(), status: 'COMPLETED' }
    ],
    docs: [],
    tasks: generateTasks(4, [mockEngineers[0], mockEngineers[5], mockEngineers[10], mockEngineers[14]])
  }
];
`;
fs.writeFileSync('src/data.ts', dataCode);
