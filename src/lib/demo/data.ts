// The demo dataset + in-memory store. This branch runs with NO backend:
// src/lib/demo/api.ts serves everything below with the same signatures as
// the real src/lib/api modules. Mutations edit these arrays in place and
// reset on refresh — that's a feature for a demo.
//
// Dates are relative to "now" so the data always looks alive: some
// milestones overdue, one due today, chatter from the last few hours.

import type {
  ConversationType,
  DailyLog,
  MilestoneStatus,
  Profile,
  ProjectStatus,
  TaskStatus,
} from '@/types';

// ---------------------------------------------------------------------------
// Time helpers (local-time date-only strings; UTC ISO timestamps)
// ---------------------------------------------------------------------------

export function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

export function daysAgoIso(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, (days * 17) % 60, 0, 0);
  return d.toISOString();
}

/** Local calendar date offset by n days, as yyyy-mm-dd. */
export function dateOnly(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function sleep(ms = 160): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Store row shapes (internal to the demo layer)
// ---------------------------------------------------------------------------

export interface ProjectRow {
  id: string;
  name: string;
  status: ProjectStatus;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneRow {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string; // yyyy-mm-dd
  status: MilestoneStatus;
  imageUrl?: string;
}

export interface TaskRow {
  id: string;
  projectId: string | null; // null = standalone ("Delegate Work")
  title: string;
  status: TaskStatus;
  engineerId: string;
  createdAt: string;
}

export interface DocRow {
  id: string;
  projectId: string;
  title: string;
  type: 'LINK' | 'DOCUMENT';
  url: string;
  dateAdded: string;
}

export interface DmRow {
  id: string;
  a: string; // profile ids, a < b
  b: string;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  replyToId?: string;
  createdAt: string;
}

// Entity-attached conversations get deterministic ids so nothing needs to
// "create" them — mirroring the DB triggers of the real backend.
export const convForProject = (projectId: string) => `conv-p-${projectId}`;
export const convForTask = (taskId: string) => `conv-t-${taskId}`;
export const convForMilestone = (milestoneId: string) => `conv-m-${milestoneId}`;

// ---------------------------------------------------------------------------
// People: 2 managers + 16 engineers
// ---------------------------------------------------------------------------

const person = (
  id: string,
  name: string,
  role: 'MANAGER' | 'ENGINEER',
  discipline: string | null
): Profile => ({
  id,
  name,
  email: `${id.replace(/^[me]-/, '')}@tavron.demo`,
  role,
  discipline,
  avatarUrl: null,
});

export const profiles: Profile[] = [
  person('m-vikram', 'Vikram Rao', 'MANAGER', null),
  person('m-meera', 'Meera Krishnan', 'MANAGER', null),
  person('e-ananya', 'Ananya Iyer', 'ENGINEER', 'Mechanical Engineer'),
  person('e-rohan', 'Rohan Deshpande', 'ENGINEER', 'Electrical Engineer'),
  person('e-priya', 'Priya Nair', 'ENGINEER', 'Civil Engineer'),
  person('e-arjun', 'Arjun Menon', 'ENGINEER', 'Piping Engineer'),
  person('e-sneha', 'Sneha Kulkarni', 'ENGINEER', 'Instrumentation Engineer'),
  person('e-karthik', 'Karthik Reddy', 'ENGINEER', 'Mechanical Engineer'),
  person('e-divya', 'Divya Sharma', 'ENGINEER', 'Process Engineer'),
  person('e-aditya', 'Aditya Verma', 'ENGINEER', 'Electrical Engineer'),
  person('e-lakshmi', 'Lakshmi Pillai', 'ENGINEER', 'QA/QC Engineer'),
  person('e-nikhil', 'Nikhil Joshi', 'ENGINEER', 'Civil Engineer'),
  person('e-ishita', 'Ishita Bose', 'ENGINEER', 'Controls Engineer'),
  person('e-suresh', 'Suresh Babu', 'ENGINEER', 'Rotating Equipment Engineer'),
  person('e-farhan', 'Farhan Ali', 'ENGINEER', 'HSE Engineer'),
  person('e-tanvi', 'Tanvi Mehta', 'ENGINEER', 'Planning Engineer'),
  person('e-vivek', 'Vivek Anand', 'ENGINEER', 'Fabrication Engineer'),
  person('e-neha', 'Neha Gupta', 'ENGINEER', 'Piping Stress Engineer'),
];

/** The two viewpoints offered on the demo entry screen. */
export const DEMO_PERSONAS = [
  {
    profileId: 'm-vikram',
    headline: 'Vikram Rao',
    caption: 'Project Manager — full dashboard, all projects, delegate work',
  },
  {
    profileId: 'e-ananya',
    headline: 'Ananya Iyer',
    caption: 'Mechanical Engineer — assigned projects, own tasks and logs',
  },
] as const;

// ---------------------------------------------------------------------------
// Projects, milestones, tasks, documents
// ---------------------------------------------------------------------------

export const projects: ProjectRow[] = [
  {
    id: 'p-turbine',
    name: 'Unit 2 Turbine Overhaul',
    status: 'ACTIVE',
    memberIds: ['e-ananya', 'e-suresh', 'e-karthik', 'e-vivek', 'e-lakshmi', 'e-farhan'],
    createdAt: daysAgoIso(45),
    updatedAt: hoursAgoIso(2),
  },
  {
    id: 'p-kochi',
    name: 'Kochi Plant Expansion — Phase 1',
    status: 'ACTIVE',
    memberIds: ['e-priya', 'e-nikhil', 'e-rohan', 'e-aditya', 'e-arjun', 'e-neha', 'e-tanvi'],
    createdAt: daysAgoIso(90),
    updatedAt: hoursAgoIso(5),
  },
  {
    id: 'p-substation',
    name: 'Substation Retrofit — Bay 4',
    status: 'ACTIVE',
    memberIds: ['e-rohan', 'e-aditya', 'e-ishita', 'e-sneha'],
    createdAt: daysAgoIso(25),
    updatedAt: hoursAgoIso(3),
  },
  {
    id: 'p-pipeline',
    name: 'Pipeline Integrity Audit',
    status: 'ACTIVE',
    memberIds: ['e-arjun', 'e-neha', 'e-lakshmi', 'e-farhan'],
    createdAt: daysAgoIso(30),
    updatedAt: daysAgoIso(1, 16),
  },
  {
    id: 'p-etp',
    name: 'Effluent Treatment Upgrade',
    status: 'ACTIVE',
    memberIds: ['e-divya', 'e-sneha', 'e-nikhil', 'e-priya', 'e-ishita'],
    createdAt: daysAgoIso(15),
    updatedAt: daysAgoIso(2, 11),
  },
  {
    id: 'p-bfp',
    name: 'Boiler Feed Pump Replacement',
    status: 'COMPLETED',
    memberIds: ['e-ananya', 'e-suresh', 'e-karthik'],
    createdAt: daysAgoIso(150),
    updatedAt: daysAgoIso(20),
  },
  {
    id: 'p-mep',
    name: 'Warehouse MEP Fit-out',
    status: 'COMPLETED',
    memberIds: ['e-rohan', 'e-sneha', 'e-nikhil'],
    createdAt: daysAgoIso(200),
    updatedAt: daysAgoIso(60),
  },
];

export const milestones: MilestoneRow[] = [
  // Unit 2 Turbine Overhaul — the at-risk project (two overdue)
  { id: 'm-t1', projectId: 'p-turbine', title: 'Shutdown & isolation', dueDate: dateOnly(-30), status: 'COMPLETED' },
  { id: 'm-t2', projectId: 'p-turbine', title: 'Rotor removal & transport', dueDate: dateOnly(-21), status: 'COMPLETED' },
  { id: 'm-t3', projectId: 'p-turbine', title: 'Rotor NDT inspection', dueDate: dateOnly(-12), status: 'IN_PROGRESS' },
  { id: 'm-t4', projectId: 'p-turbine', title: 'Bearing replacement', dueDate: dateOnly(-4), status: 'PENDING' },
  { id: 'm-t5', projectId: 'p-turbine', title: 'Reassembly & alignment', dueDate: dateOnly(14), status: 'PENDING' },
  { id: 'm-t6', projectId: 'p-turbine', title: 'Trial run & handover', dueDate: dateOnly(28), status: 'PENDING' },

  // Kochi Plant Expansion — one slipped pour
  { id: 'm-k1', projectId: 'p-kochi', title: 'Site grading & piling', dueDate: dateOnly(-40), status: 'COMPLETED' },
  { id: 'm-k2', projectId: 'p-kochi', title: 'Foundation pour — Block C', dueDate: dateOnly(-6), status: 'IN_PROGRESS' },
  { id: 'm-k3', projectId: 'p-kochi', title: 'Structural steel erection', dueDate: dateOnly(9), status: 'PENDING' },
  { id: 'm-k4', projectId: 'p-kochi', title: 'Underground piping', dueDate: dateOnly(21), status: 'PENDING' },
  { id: 'm-k5', projectId: 'p-kochi', title: 'Cable tray routing', dueDate: dateOnly(34), status: 'PENDING' },

  // Substation Retrofit — FAT due today
  { id: 'm-s1', projectId: 'p-substation', title: 'Design freeze', dueDate: dateOnly(-8), status: 'COMPLETED' },
  { id: 'm-s2', projectId: 'p-substation', title: 'Relay panel FAT', dueDate: dateOnly(0), status: 'IN_PROGRESS' },
  { id: 'm-s3', projectId: 'p-substation', title: 'Outage window & changeover', dueDate: dateOnly(5), status: 'PENDING' },
  { id: 'm-s4', projectId: 'p-substation', title: 'Commissioning', dueDate: dateOnly(12), status: 'PENDING' },

  // Pipeline Integrity Audit — healthy
  { id: 'm-p1', projectId: 'p-pipeline', title: 'Desk study & data collection', dueDate: dateOnly(-10), status: 'COMPLETED' },
  { id: 'm-p2', projectId: 'p-pipeline', title: 'Field inspection — Section A', dueDate: dateOnly(6), status: 'IN_PROGRESS' },
  { id: 'm-p3', projectId: 'p-pipeline', title: 'Corrosion mapping report', dueDate: dateOnly(18), status: 'PENDING' },
  { id: 'm-p4', projectId: 'p-pipeline', title: 'Final recommendations', dueDate: dateOnly(40), status: 'PENDING' },

  // Effluent Treatment Upgrade — early stage
  { id: 'm-e1', projectId: 'p-etp', title: 'Process design basis', dueDate: dateOnly(3), status: 'IN_PROGRESS' },
  { id: 'm-e2', projectId: 'p-etp', title: 'P&ID issue for review', dueDate: dateOnly(16), status: 'PENDING' },
  { id: 'm-e3', projectId: 'p-etp', title: 'Civil works tender', dueDate: dateOnly(45), status: 'PENDING' },

  // Completed projects
  { id: 'm-b1', projectId: 'p-bfp', title: 'Pump procurement', dueDate: dateOnly(-70), status: 'COMPLETED' },
  { id: 'm-b2', projectId: 'p-bfp', title: 'Installation & alignment', dueDate: dateOnly(-35), status: 'COMPLETED' },
  { id: 'm-b3', projectId: 'p-bfp', title: 'Performance test', dueDate: dateOnly(-22), status: 'COMPLETED' },
  { id: 'm-w1', projectId: 'p-mep', title: 'HVAC installation', dueDate: dateOnly(-90), status: 'COMPLETED' },
  { id: 'm-w2', projectId: 'p-mep', title: 'Fire alarm commissioning', dueDate: dateOnly(-65), status: 'COMPLETED' },
];

// Real projects carry 35–40 milestones. The hand-written ones above tell the
// story (the overdue rotor NDT, today's FAT, ...); the generator below fills
// each active project out to realistic scale with activity × area items.
// Generated past items are always COMPLETED so the at-risk picture stays
// exactly the curated one; future items are PENDING.
function expandMilestones() {
  const plans: {
    projectId: string;
    startDaysAgo: number;
    horizonDays: number;
    add: number;
    acts: string[];
    zones: string[];
  }[] = [
    {
      projectId: 'p-turbine', startDaysAgo: 42, horizonDays: 30, add: 32,
      acts: ['Scaffolding & insulation', 'Casing NDT', 'Blade clearance survey', 'Diaphragm inspection', 'Gland seal overhaul', 'Valve refurbishment', 'Oil flushing', 'Loop checks'],
      zones: ['HP section', 'IP section', 'LP section', 'Front pedestal'],
    },
    {
      projectId: 'p-kochi', startDaysAgo: 85, horizonDays: 60, add: 35,
      acts: ['Excavation & PCC', 'Rebar & shuttering', 'Concrete pour', 'Steel erection', 'Grouting', 'Piping fit-up', 'Cable laying', 'Painting & fireproofing', 'Punch-list closure'],
      zones: ['Block A', 'Block B', 'Block C', 'Pipe rack'],
    },
    {
      projectId: 'p-substation', startDaysAgo: 22, horizonDays: 25, add: 32,
      acts: ['Panel installation', 'Cable termination', 'Loop testing', 'Relay settings', 'Earthing checks', 'HV testing', 'SCADA integration', 'Documentation'],
      zones: ['Feeder 1', 'Feeder 2', 'Bus section', 'Control room'],
    },
    {
      projectId: 'p-pipeline', startDaysAgo: 28, horizonDays: 55, add: 31,
      acts: ['Access & scaffolding', 'Surface preparation', 'UT survey', 'Radiography', 'CP measurements', 'Defect assessment', 'Repair recommendation', 'Report sign-off'],
      zones: ['Section A', 'Section B', 'Section C', 'River crossing'],
    },
    {
      projectId: 'p-etp', startDaysAgo: 12, horizonDays: 75, add: 34,
      acts: ['Design review', 'HAZOP actions', 'Equipment RFQ', 'Vendor evaluation', 'Civil drawings', 'Structural design', 'Instrumentation index', 'Tender package', 'Approval cycle'],
      zones: ['Clarifier', 'Aeration basin', 'Sludge handling', 'Outfall'],
    },
  ];

  for (const plan of plans) {
    const names = plan.acts.flatMap((a) => plan.zones.map((z) => `${a} — ${z}`)).slice(0, plan.add);
    const span = plan.startDaysAgo + plan.horizonDays;
    names.forEach((title, i) => {
      const offset = Math.round(-plan.startDaysAgo + (i / (names.length - 1)) * span);
      milestones.push({
        id: `m-gen-${plan.projectId}-${i}`,
        projectId: plan.projectId,
        title,
        dueDate: dateOnly(offset),
        status: offset < 0 ? 'COMPLETED' : 'PENDING',
      });
    });
  }
}
expandMilestones();

export const tasks: TaskRow[] = [
  // Turbine
  { id: 't-t1', projectId: 'p-turbine', title: 'Dye-penetrant test on rotor blades', status: 'IN_PROGRESS', engineerId: 'e-ananya', createdAt: daysAgoIso(6) },
  { id: 't-t2', projectId: 'p-turbine', title: 'Vendor quote for journal bearings', status: 'TODO', engineerId: 'e-suresh', createdAt: daysAgoIso(5) },
  { id: 't-t3', projectId: 'p-turbine', title: 'Fabricate rotor lifting fixture', status: 'IN_PROGRESS', engineerId: 'e-vivek', createdAt: daysAgoIso(8) },
  { id: 't-t4', projectId: 'p-turbine', title: 'Balance report review', status: 'TODO', engineerId: 'e-karthik', createdAt: daysAgoIso(3) },
  { id: 't-t5', projectId: 'p-turbine', title: 'Weld procedure qualification', status: 'DONE', engineerId: 'e-vivek', createdAt: daysAgoIso(12) },
  { id: 't-t6', projectId: 'p-turbine', title: 'Lube oil flushing plan', status: 'DONE', engineerId: 'e-ananya', createdAt: daysAgoIso(10) },

  // Kochi
  { id: 't-k1', projectId: 'p-kochi', title: 'Rebar inspection checklist — Block C', status: 'IN_PROGRESS', engineerId: 'e-priya', createdAt: daysAgoIso(4) },
  { id: 't-k2', projectId: 'p-kochi', title: 'Concrete pour schedule rev 2', status: 'TODO', engineerId: 'e-nikhil', createdAt: daysAgoIso(2) },
  { id: 't-k3', projectId: 'p-kochi', title: 'HT cable sizing calculation', status: 'IN_PROGRESS', engineerId: 'e-aditya', createdAt: daysAgoIso(7) },
  { id: 't-k4', projectId: 'p-kochi', title: 'Pipe rack isometrics review', status: 'TODO', engineerId: 'e-arjun', createdAt: daysAgoIso(3) },
  { id: 't-k5', projectId: 'p-kochi', title: 'Stress analysis — cooling water line', status: 'IN_PROGRESS', engineerId: 'e-neha', createdAt: daysAgoIso(5) },
  { id: 't-k6', projectId: 'p-kochi', title: 'Transformer foundation drawing', status: 'DONE', engineerId: 'e-rohan', createdAt: daysAgoIso(11) },

  // Substation
  { id: 't-s1', projectId: 'p-substation', title: 'FAT punch list', status: 'IN_PROGRESS', engineerId: 'e-ishita', createdAt: daysAgoIso(2) },
  { id: 't-s2', projectId: 'p-substation', title: 'SCADA point mapping', status: 'IN_PROGRESS', engineerId: 'e-sneha', createdAt: daysAgoIso(4) },
  { id: 't-s3', projectId: 'p-substation', title: 'Protection settings sheet', status: 'TODO', engineerId: 'e-rohan', createdAt: daysAgoIso(1) },
  { id: 't-s4', projectId: 'p-substation', title: 'Panel labeling drawings', status: 'DONE', engineerId: 'e-aditya', createdAt: daysAgoIso(6) },

  // Pipeline
  { id: 't-p1', projectId: 'p-pipeline', title: 'Compile pigging history', status: 'DONE', engineerId: 'e-lakshmi', createdAt: daysAgoIso(9) },
  { id: 't-p2', projectId: 'p-pipeline', title: 'UT thickness survey plan', status: 'IN_PROGRESS', engineerId: 'e-arjun', createdAt: daysAgoIso(3) },
  { id: 't-p3', projectId: 'p-pipeline', title: 'CP system data review', status: 'TODO', engineerId: 'e-neha', createdAt: daysAgoIso(2) },

  // ETP
  { id: 't-e1', projectId: 'p-etp', title: 'Mass balance calculation', status: 'IN_PROGRESS', engineerId: 'e-divya', createdAt: daysAgoIso(3) },
  { id: 't-e2', projectId: 'p-etp', title: 'Instrument index draft', status: 'TODO', engineerId: 'e-ishita', createdAt: daysAgoIso(1) },

  // Completed projects (all DONE — these threads land in Archived)
  { id: 't-b1', projectId: 'p-bfp', title: 'Baseplate grouting', status: 'DONE', engineerId: 'e-suresh', createdAt: daysAgoIso(40) },
  { id: 't-b2', projectId: 'p-bfp', title: 'Vibration baseline readings', status: 'DONE', engineerId: 'e-ananya', createdAt: daysAgoIso(30) },
  { id: 't-w1', projectId: 'p-mep', title: 'Duct leak test', status: 'DONE', engineerId: 'e-sneha', createdAt: daysAgoIso(70) },

  // Standalone ("Delegate Work")
  { id: 'st-1', projectId: null, title: 'Prepare monthly progress deck', status: 'TODO', engineerId: 'e-karthik', createdAt: daysAgoIso(2) },
  { id: 'st-2', projectId: null, title: 'Calibrate site survey instruments', status: 'IN_PROGRESS', engineerId: 'e-sneha', createdAt: daysAgoIso(4) },
  { id: 'st-3', projectId: null, title: 'Update vendor contact register', status: 'TODO', engineerId: 'e-divya', createdAt: daysAgoIso(1) },
  { id: 'st-4', projectId: null, title: 'Renew crane operator certifications', status: 'IN_PROGRESS', engineerId: 'e-lakshmi', createdAt: daysAgoIso(6) },
  { id: 'st-5', projectId: null, title: 'Archive Q2 inspection reports', status: 'DONE', engineerId: 'e-lakshmi', createdAt: daysAgoIso(9) },
  { id: 'st-6', projectId: null, title: 'Draft welding consumables PO', status: 'TODO', engineerId: 'e-ananya', createdAt: daysAgoIso(1) },
];

export const docs: DocRow[] = [
  { id: 'd-t1', projectId: 'p-turbine', title: 'Turbine OEM overhaul manual', type: 'LINK', url: 'https://example.com/oem-manual', dateAdded: daysAgoIso(40) },
  { id: 'd-t2', projectId: 'p-turbine', title: 'Shutdown method statement', type: 'LINK', url: 'https://example.com/method-statement', dateAdded: daysAgoIso(32) },
  { id: 'd-t3', projectId: 'p-turbine', title: 'Rotor inspection ITP', type: 'LINK', url: 'https://example.com/itp', dateAdded: daysAgoIso(12) },
  { id: 'd-k1', projectId: 'p-kochi', title: 'Civil IFC drawing set', type: 'LINK', url: 'https://example.com/ifc-drawings', dateAdded: daysAgoIso(60) },
  { id: 'd-k2', projectId: 'p-kochi', title: 'Geotech report', type: 'LINK', url: 'https://example.com/geotech', dateAdded: daysAgoIso(80) },
  { id: 'd-s1', projectId: 'p-substation', title: 'Relay coordination study', type: 'LINK', url: 'https://example.com/relay-study', dateAdded: daysAgoIso(15) },
  { id: 'd-p1', projectId: 'p-pipeline', title: 'Previous ILI run report (2024)', type: 'LINK', url: 'https://example.com/ili-2024', dateAdded: daysAgoIso(25) },
  { id: 'd-e1', projectId: 'p-etp', title: 'Discharge norms circular', type: 'LINK', url: 'https://example.com/norms', dateAdded: daysAgoIso(10) },
];

// ---------------------------------------------------------------------------
// Daily logs — the last ~2 weeks, generated from small per-discipline pools
// ---------------------------------------------------------------------------

const LOG_POOL: { engineerId: string; projectId: string | null; lines: string[] }[] = [
  { engineerId: 'e-ananya', projectId: 'p-turbine', lines: [
    'Continued DP testing on stage 3 blades; two indications logged for review.',
    'Finished lube oil flushing plan and shared with Suresh for the skid tie-in.',
    'On the turbine deck all day — clearance readings recorded for the front bearing.',
  ]},
  { engineerId: 'e-suresh', projectId: 'p-turbine', lines: [
    'Chased bearing vendor for revised quote; delivery quoted at 3 weeks.',
    'Reviewed rotor runout readings with the NDT crew.',
  ]},
  { engineerId: 'e-karthik', projectId: 'p-turbine', lines: [
    'Started on the balance report; waiting on the OEM correction weights table.',
    'Helped Vivek with the lifting fixture load calc.',
  ]},
  { engineerId: 'e-vivek', projectId: 'p-turbine', lines: [
    'Lifting fixture fit-up done; welding tomorrow after WPS sign-off.',
    'Consumables stock check — flagged low stock of E7018.',
  ]},
  { engineerId: 'e-lakshmi', projectId: 'p-pipeline', lines: [
    'Compiled pigging history into the audit workbook.',
    'Witnessed hydrotest reinstatement checks; punch items closed.',
  ]},
  { engineerId: 'e-farhan', projectId: 'p-turbine', lines: [
    'Toolbox talk on confined space entry for the condenser crew.',
    'Updated the site risk register; two new entries for night lifts.',
  ]},
  { engineerId: 'e-priya', projectId: 'p-kochi', lines: [
    'Rebar inspection at Block C — cover issues at two grid lines, marked up.',
    'Coordinated with the batching plant on tomorrow’s pour window.',
  ]},
  { engineerId: 'e-nikhil', projectId: 'p-kochi', lines: [
    'Reworked the pour schedule around the crane availability clash.',
    'Site walk with the surveyor to verify Block D benchmarks.',
  ]},
  { engineerId: 'e-rohan', projectId: 'p-substation', lines: [
    'Drafted protection settings sheet for Bay 4 feeders.',
    'Reviewed transformer foundation drawing comments from civil.',
  ]},
  { engineerId: 'e-aditya', projectId: 'p-kochi', lines: [
    'HT cable sizing — derating factors confirmed with the vendor catalogue.',
    'Closed out panel labeling comments from the FAT pre-check.',
  ]},
  { engineerId: 'e-arjun', projectId: 'p-pipeline', lines: [
    'Marked UT survey grid for Section A; access scaffolding requested.',
    'Isometrics review — 14 of 32 sheets done.',
  ]},
  { engineerId: 'e-neha', projectId: 'p-kochi', lines: [
    'Stress run for the cooling water line; two supports relocated.',
    'CP data review started; rectifier logs from 2023 are patchy.',
  ]},
  { engineerId: 'e-sneha', projectId: 'p-substation', lines: [
    'SCADA point mapping 60% done; alarm priorities agreed with operations.',
    'Bench-calibrated the survey instruments due this month.',
  ]},
  { engineerId: 'e-ishita', projectId: 'p-substation', lines: [
    'FAT punch list updated after vendor call — 6 open items.',
    'Started the instrument index for the ETP upgrade.',
  ]},
  { engineerId: 'e-divya', projectId: 'p-etp', lines: [
    'Mass balance first pass complete; sludge line numbers look high, rechecking.',
    'Collected effluent lab results for the design basis.',
  ]},
  { engineerId: 'e-tanvi', projectId: 'p-kochi', lines: [
    'Updated the L3 schedule with the revised pour dates.',
    'Prepared the two-week lookahead for Monday’s review.',
  ]},
];

/**
 * Self-contained "site photo" placeholder (SVG data URI — no network).
 * Three scene variants so a feed full of photos doesn't look copy-pasted.
 */
function sitePhoto(label: string, variant = 0): string {
  const scenes = [
    // camera glyph
    `<circle cx="320" cy="150" r="34" fill="none" stroke="#9ca3af" stroke-width="4"/>
     <circle cx="320" cy="150" r="14" fill="#9ca3af"/>
     <rect x="286" y="106" width="24" height="14" rx="3" fill="#9ca3af"/>`,
    // pipe rack
    `<g stroke="#9ca3af" stroke-width="5" fill="none">
       <line x1="120" y1="115" x2="520" y2="115"/><line x1="120" y1="142" x2="520" y2="142"/>
       <line x1="120" y1="169" x2="520" y2="169"/><line x1="175" y1="90" x2="175" y2="195"/>
       <line x1="320" y1="90" x2="320" y2="195"/><line x1="465" y1="90" x2="465" y2="195"/>
     </g>`,
    // crane
    `<g stroke="#9ca3af" stroke-width="5" fill="none">
       <line x1="205" y1="205" x2="205" y2="80"/><line x1="205" y1="80" x2="430" y2="95"/>
       <line x1="205" y1="122" x2="305" y2="88"/><line x1="430" y1="95" x2="430" y2="148"/>
       <rect x="414" y="148" width="32" height="24"/>
     </g>`,
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#374151"/><stop offset="1" stop-color="#111827"/>
    </linearGradient></defs>
    <rect width="640" height="360" fill="url(#g)"/>
    ${scenes[variant % scenes.length]}
    <text x="320" y="250" text-anchor="middle" font-family="monospace" font-size="18" fill="#e5e7eb">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function buildLogs(): DailyLog[] {
  const rows: DailyLog[] = [];
  const projectName = (pid: string | null) =>
    pid ? projects.find((p) => p.id === pid)?.name ?? null : null;

  for (let day = 0; day < 12; day++) {
    const d = new Date();
    d.setDate(d.getDate() - day);
    if (d.getDay() === 0) continue; // site runs six days a week
    // A rotating subset logs each day so the feed looks organic.
    LOG_POOL.forEach((pool, idx) => {
      if ((day + idx) % 3 === 0) return;
      const line = pool.lines[(day + idx) % pool.lines.length];
      const author = profiles.find((p) => p.id === pool.engineerId)!;
      rows.push({
        id: `log-${day}-${pool.engineerId}`,
        authorId: pool.engineerId,
        authorName: author.name,
        logDate: dateOnly(-day),
        content: line,
        projectId: pool.projectId,
        projectName: projectName(pool.projectId),
        taskId: null,
        createdAt: daysAgoIso(day, 17),
      });
    });
  }
  // A few entries carry geotagged site photos — the field-evidence story.
  // Attach to each engineer's most recent entry so the photos always show
  // near the top of the feed regardless of the generator's skip pattern.
  const photoSeeds: { engineerId: string; label: string; nth?: number }[] = [
    { engineerId: 'e-ananya', label: 'Site photo — rotor stage 3' },
    { engineerId: 'e-priya', label: 'Site photo — Block C rebar' },
    { engineerId: 'e-ishita', label: 'Site photo — Bay 4 panel' },
    { engineerId: 'e-vivek', label: 'Site photo — lifting fixture' },
    { engineerId: 'e-arjun', label: 'Site photo — Section A grid' },
    { engineerId: 'e-sneha', label: 'Site photo — SCADA bench' },
    { engineerId: 'e-nikhil', label: 'Site photo — Block D benchmark' },
    { engineerId: 'e-farhan', label: 'Site photo — toolbox talk' },
    { engineerId: 'e-suresh', label: 'Site photo — bearing housing' },
    { engineerId: 'e-neha', label: 'Site photo — CW line supports' },
    { engineerId: 'e-ananya', label: 'Site photo — clearance readings', nth: 1 },
    { engineerId: 'e-priya', label: 'Site photo — pour preparation', nth: 1 },
  ];
  photoSeeds.forEach((seed, i) => {
    const own = rows
      .filter((r) => r.authorId === seed.engineerId)
      .sort((a, b) => b.logDate.localeCompare(a.logDate));
    const row = own[seed.nth ?? 0];
    if (row) row.imageUrl = sitePhoto(seed.label, i);
  });

  return rows;
}

export const logs: DailyLog[] = buildLogs();

// ---------------------------------------------------------------------------
// Daily-log verification: a manager signs off one engineer's whole day.
// Keyed `${authorId}|${logDate}`. Editing that day clears the sign-off.
// ---------------------------------------------------------------------------

export const logVerifications: Record<string, { byId: string; byName: string; at: string }> = {};

export const verificationKey = (authorId: string, logDate: string) => `${authorId}|${logDate}`;

function seedVerifications() {
  const yesterday = dateOnly(-1);
  const today = dateOnly(0);
  const engineerDays = [...new Set(logs.map((l) => verificationKey(l.authorId, l.logDate)))];
  let i = 0;
  for (const key of engineerDays) {
    const logDate = key.split('|')[1];
    if (logDate === today) continue; // today: pending review
    // Yesterday: roughly half reviewed, so the demo shows both states.
    if (logDate === yesterday && i++ % 2 === 0) continue;
    const manager = i % 3 === 0 ? profiles[1] : profiles[0]; // Meera or Vikram
    logVerifications[key] = {
      byId: manager.id,
      byName: manager.name,
      at: `${logDate}T18:30:00.000Z`,
    };
  }
}
seedVerifications();

// ---------------------------------------------------------------------------
// Messaging: DM conversations, messages, read state
// ---------------------------------------------------------------------------

export const dms: DmRow[] = [
  { id: 'conv-dm-1', a: 'e-ananya', b: 'm-vikram' },
  { id: 'conv-dm-2', a: 'm-meera', b: 'm-vikram' },
  { id: 'conv-dm-3', a: 'e-ananya', b: 'e-rohan' },
];

const msg = (
  id: string,
  conversationId: string,
  authorId: string,
  content: string,
  createdAt: string,
  replyToId?: string
): MessageRow => ({ id, conversationId, authorId, content, createdAt, replyToId });

export const messages: MessageRow[] = [
  // Unit 2 Turbine — General (busy channel; 2 unread for Vikram)
  msg('msg-tg1', convForProject('p-turbine'), 'm-vikram', 'Team — client wants a recovery plan for the NDT slip by Thursday. Ananya, where do we stand?', daysAgoIso(1, 9)),
  msg('msg-tg2', convForProject('p-turbine'), 'e-ananya', 'Stage 1 and 2 blades are done. Stage 3 in progress — the two indications need MPI confirmation before I can call it.', daysAgoIso(1, 11)),
  msg('msg-tg3', convForProject('p-turbine'), 'e-suresh', 'Bearing vendor came back — 3 weeks delivery from PO. We should order this week or reassembly slips too.', daysAgoIso(1, 15)),
  msg('msg-tg4', convForProject('p-turbine'), 'm-vikram', 'Raise the PR today, I’ll approve it tonight.', daysAgoIso(1, 16)),
  msg('msg-tg5', convForProject('p-turbine'), 'e-ananya', 'MPI crew confirmed for tomorrow morning. If the indications clear, NDT closes end of week.', hoursAgoIso(2)),
  msg('msg-tg6', convForProject('p-turbine'), 'e-karthik', 'Balance report draft is in the shared folder — flagging one correction weight outside OEM table.', hoursAgoIso(1.5)),

  // Kochi — General
  msg('msg-kg1', convForProject('p-kochi'), 'm-meera', 'Pour window for Block C confirmed with the batching plant — Saturday 6am.', daysAgoIso(2, 10)),
  msg('msg-kg2', convForProject('p-kochi'), 'e-priya', 'Rebar cover issues at grids 4 and 7 fixed and re-inspected. Clear to pour from my side.', daysAgoIso(2, 14)),
  msg('msg-kg3', convForProject('p-kochi'), 'e-nikhil', 'Crane clash resolved — mobile crane released to steel erection from Monday.', daysAgoIso(1, 10)),
  msg('msg-kg4', convForProject('p-kochi'), 'm-vikram', 'Good. Tanvi, reflect the new pour date in the L3 before the client call.', daysAgoIso(1, 12)),
  msg('msg-kg5', convForProject('p-kochi'), 'e-tanvi', 'Done — lookahead updated and circulated.', hoursAgoIso(5)),

  // Substation — General (today)
  msg('msg-sg1', convForProject('p-substation'), 'e-ishita', 'FAT running now. 6 punch items so far, none category A.', hoursAgoIso(4)),
  msg('msg-sg2', convForProject('p-substation'), 'e-rohan', 'Protection settings sheet uploaded for review before the outage window.', hoursAgoIso(3)),
  msg('msg-sg3', convForProject('p-substation'), 'm-vikram', 'Nice progress. Keep the punch list in the FAT thread so it’s traceable.', hoursAgoIso(2.5)),

  // Pipeline / ETP — quieter channels
  msg('msg-pg1', convForProject('p-pipeline'), 'e-arjun', 'Scaffolding for Section A access approved — survey starts Thursday.', daysAgoIso(2, 9)),
  msg('msg-pg2', convForProject('p-pipeline'), 'm-meera', 'Noted. Keep daily coverage in the logs, the client audit team may visit.', daysAgoIso(2, 11)),
  msg('msg-eg1', convForProject('p-etp'), 'e-divya', 'Design basis draft is out — please comment by Friday.', daysAgoIso(3, 15)),
  msg('msg-eg2', convForProject('p-etp'), 'e-priya', 'Civil inputs added for the tender package.', daysAgoIso(2, 16)),

  // Task thread: DP test (1 unread for Vikram)
  msg('msg-t1a', convForTask('t-t1'), 'm-vikram', 'Any movement on the two stage-3 indications?', daysAgoIso(1, 13)),
  msg('msg-t1b', convForTask('t-t1'), 'e-ananya', 'Re-cleaned and retested one — it’s a scratch, not a crack. Second one needs MPI to be sure.', daysAgoIso(1, 14), 'msg-t1a'),
  msg('msg-t1c', convForTask('t-t1'), 'm-vikram', 'OK. Document both either way, the client will ask.', daysAgoIso(1, 15)),
  msg('msg-t1d', convForTask('t-t1'), 'e-ananya', 'MPI slot booked for 8am tomorrow. Report by noon.', hoursAgoIso(4)),

  // Task thread: HT cable sizing
  msg('msg-k3a', convForTask('t-k3'), 'e-aditya', 'Vendor catalogue derating matches my calc within 2%. Proceeding with 3x300 sqmm.', daysAgoIso(2, 12)),
  msg('msg-k3b', convForTask('t-k3'), 'm-meera', 'Fine by me — attach the calc sheet to the project docs when final.', daysAgoIso(2, 13)),
  msg('msg-k3c', convForTask('t-k3'), 'e-rohan', 'Check the tray fill with Neha’s new routing before you freeze it.', daysAgoIso(1, 9), 'msg-k3a'),

  // Task thread: SCADA mapping
  msg('msg-s2a', convForTask('t-s2'), 'e-sneha', 'Point list at 60%. Operations wants alarm priorities reshuffled for Bay 4.', daysAgoIso(1, 10)),
  msg('msg-s2b', convForTask('t-s2'), 'e-ishita', 'Use the priority scheme from the Bay 2 retrofit — I’ll send the doc.', daysAgoIso(1, 11)),

  // Task thread: UT survey
  msg('msg-p2a', convForTask('t-p2'), 'e-arjun', 'Grid marked for Section A. 240 test points.', daysAgoIso(1, 16)),
  msg('msg-p2b', convForTask('t-p2'), 'e-lakshmi', 'I’ll witness the first day for QA sign-off.', daysAgoIso(1, 17)),

  // Archived thread (DONE task on a completed project)
  msg('msg-b2a', convForTask('t-b2'), 'e-ananya', 'Baseline vibration readings attached — all within ISO 10816 zone A.', daysAgoIso(28, 11)),
  msg('msg-b2b', convForTask('t-b2'), 'm-vikram', 'Perfect close-out. Thanks.', daysAgoIso(28, 12)),

  // Milestone thread: Rotor NDT (1 unread for Ananya)
  msg('msg-m3a', convForMilestone('m-t3'), 'm-vikram', 'This milestone is 12 days over. What’s the realistic close date?', daysAgoIso(2, 9)),
  msg('msg-m3b', convForMilestone('m-t3'), 'e-ananya', 'If MPI clears the last indication: Friday. If not, we need the OEM disposition — add a week.', daysAgoIso(2, 10)),
  msg('msg-m3c', convForMilestone('m-t3'), 'm-vikram', 'Plan for Friday, flag me the moment MPI says otherwise.', hoursAgoIso(26)),

  // Milestone thread: Foundation pour
  msg('msg-m2a', convForMilestone('m-k2'), 'e-priya', 'Pour is go for Saturday. Curing plan posted in docs.', daysAgoIso(1, 18)),
  msg('msg-m2b', convForMilestone('m-k2'), 'm-meera', 'Thanks — milestone closes once the cube tests pass.', daysAgoIso(1, 19)),

  // DMs
  msg('msg-d1a', 'conv-dm-1', 'm-vikram', 'Ananya — can you present the turbine recovery plan at Thursday’s client call?', daysAgoIso(1, 12)),
  msg('msg-d1b', 'conv-dm-1', 'e-ananya', 'Yes, I’ll keep it to five slides. Will send you a draft tomorrow.', daysAgoIso(1, 13)),
  msg('msg-d1c', 'conv-dm-1', 'm-vikram', 'Great. Include the bearing delivery risk.', daysAgoIso(1, 14)),
  msg('msg-d1d', 'conv-dm-1', 'e-ananya', 'Draft sent to your inbox — added a slide on the MPI outcome scenarios.', hoursAgoIso(1)),

  msg('msg-d2a', 'conv-dm-2', 'm-meera', 'Kochi steel erection starts Monday — want to walk the site together Friday?', daysAgoIso(1, 8)),
  msg('msg-d2b', 'conv-dm-2', 'm-vikram', 'Friday 10am works. Let’s also review the ETP tender split.', daysAgoIso(1, 9)),
  msg('msg-d2c', 'conv-dm-2', 'm-meera', 'Booked.', daysAgoIso(1, 10)),

  msg('msg-d3a', 'conv-dm-3', 'e-ananya', 'Rohan, does the substation outage clash with our trial run window?', daysAgoIso(1, 15)),
  msg('msg-d3b', 'conv-dm-3', 'e-rohan', 'No — outage is Bay 4 only, your feeders stay live. Checked with operations.', hoursAgoIso(2)),
];

// Bulk chatter so project reports and channels read like a real org.
// Entries are [daysAgo, hour, authorId, text]; everything is at least a day
// old so the seeded unread badges (set in seedReads below) stay untouched.
function expandChat() {
  const chatter: { convId: string; entries: [number, number, string, string][] }[] = [
    { convId: convForProject('p-turbine'), entries: [
      [9, 9, 'm-vikram', 'Kickoff recap posted — shutdown scope is frozen, no additions without my sign-off.'],
      [8, 11, 'e-suresh', 'Rotor lifted clean this morning. Transport cradle worked exactly as planned.'],
      [8, 15, 'e-lakshmi', 'Receiving inspection on the gasket kits done — all conforming, GRN raised.'],
      [7, 10, 'e-vivek', 'Fixture drawings sent for review. Need sign-off before Thursday to hold the schedule.'],
      [7, 14, 'e-karthik', 'OEM says the correction weight table travels with their service rep next week.'],
      [6, 9, 'e-farhan', 'Permit audit clean. Two reminders issued on harness clips at the condenser deck.'],
      [5, 12, 'e-ananya', 'Stage 1 blades: no indications. Moving to stage 2 tomorrow morning.'],
      [4, 16, 'm-meera', 'Client walk-through Friday 10am — keep the laydown area presentable please.'],
      [3, 10, 'e-suresh', 'Bearing PR raised and sitting in approvals.'],
      [2, 13, 'e-vivek', 'Fixture welded and load-tested to 125%. Certificates in the project docs.'],
    ]},
    { convId: convForProject('p-kochi'), entries: [
      [9, 8, 'm-meera', 'Weekly cadence reminder: progress photos in the logs by 6pm daily.'],
      [8, 10, 'e-priya', 'Block B pour cube results in — 28-day strength comfortably above spec.'],
      [8, 14, 'e-rohan', 'Transformer plinth conduits cast in. As-built markup with the surveyor.'],
      [7, 9, 'e-arjun', 'Pipe rack spool deliveries resequenced — zone 2 arrives first now.'],
      [6, 11, 'e-tanvi', 'Two-week lookahead circulated. Steel erection is the critical path.'],
      [6, 15, 'e-nikhil', 'Dewatering pump on standby for Saturday, forecast shows rain.'],
      [5, 10, 'e-aditya', 'HT cable drum schedule confirmed with the vendor — no slippage.'],
      [4, 12, 'e-neha', 'Stress package for the CW line issued for checking.'],
      [3, 9, 'm-vikram', 'Good recovery on the crane clash, team. Keep Saturday tight.'],
      [2, 15, 'e-priya', 'Shutter alignment check done for Block C — ready for the pour window.'],
    ]},
    { convId: convForProject('p-substation'), entries: [
      [6, 10, 'e-rohan', 'Outage application submitted to grid control for the changeover window.'],
      [5, 11, 'e-ishita', 'Vendor FAT procedure reviewed — added two test cases for breaker interlocks.'],
      [4, 9, 'e-sneha', 'Alarm priority list signed off by operations.'],
      [3, 14, 'e-aditya', 'Panel labeling drawings released as rev 1.'],
      [2, 10, 'm-vikram', 'Confirm the outage window by Thursday — grid control needs 72h notice.'],
    ]},
    { convId: convForProject('p-pipeline'), entries: [
      [6, 9, 'e-lakshmi', 'Audit workbook structure agreed with QA — one sheet per section.'],
      [5, 13, 'e-neha', 'CP historical data request sent to operations.'],
      [4, 10, 'e-arjun', 'Scaffolding erection starts Wednesday for Section A access.'],
      [3, 11, 'e-farhan', 'Confined-space rescue plan updated for the river crossing chamber.'],
    ]},
    { convId: convForProject('p-etp'), entries: [
      [5, 10, 'e-divya', 'Lab results for raw effluent uploaded — COD higher than the old design basis.'],
      [4, 14, 'e-ishita', 'Instrument index skeleton ready; tagging convention follows the plant standard.'],
      [3, 9, 'e-priya', 'Civil scope split drafted for the tender package.'],
      [2, 11, 'e-nikhil', 'Site levels taken around the clarifier area — report in docs.'],
    ]},
    // Task threads that were quiet get real back-and-forth.
    { convId: convForTask('t-t2'), entries: [
      [5, 10, 'e-suresh', 'Three vendors shortlisted. SKF fastest at 3 weeks from PO.'],
      [5, 11, 'm-vikram', 'Go with the fastest unless the price is silly.'],
      [4, 9, 'e-suresh', 'PR raised with the SKF quote attached.'],
    ]},
    { convId: convForTask('t-t3'), entries: [
      [7, 9, 'e-vivek', 'Fit-up complete, waiting on WPS sign-off to start welding.'],
      [6, 15, 'e-karthik', 'Load calc reviewed — good to weld.'],
    ]},
    { convId: convForTask('t-k1'), entries: [
      [3, 10, 'e-priya', 'Checklist rev B uploaded with the cover fixes included.'],
      [3, 12, 'm-meera', 'Use rev B for Saturday’s pour. Archive rev A.'],
    ]},
    { convId: convForTask('t-k5'), entries: [
      [4, 11, 'e-neha', 'Two supports need relocation near the rack tie-in — markup attached.'],
      [4, 14, 'e-arjun', 'Isometrics updated to suit. Reissued for checking.'],
    ]},
    { convId: convForTask('t-s1'), entries: [
      [2, 10, 'e-ishita', 'Punch list steady at 6 items, none category A.'],
      [2, 11, 'e-rohan', 'Try to close at least 3 before the outage window.'],
    ]},
    { convId: convForTask('t-e1'), entries: [
      [3, 9, 'e-divya', 'First pass done; sludge line numbers look high.'],
      [2, 16, 'e-priya', 'Recheck the recycle stream split before you lock it.'],
    ]},
    { convId: convForTask('t-p3'), entries: [
      [2, 9, 'e-neha', '2023 rectifier logs are patchy — flagged the gaps.'],
      [1, 10, 'e-lakshmi', 'Note the gaps in the audit register so the client sees them.'],
    ]},
  ];

  chatter.forEach((thread, ti) => {
    thread.entries.forEach(([d, h, authorId, text], mi) => {
      messages.push(msg(`msg-gen-${ti}-${mi}`, thread.convId, authorId, text, daysAgoIso(d, h)));
    });
  });
}
expandChat();

/** `${conversationId}|${profileId}` → last-read ISO timestamp. */
export const reads: Record<string, string> = {};

function seedReads() {
  const nowIso = new Date().toISOString();
  const convIds = new Set<string>(messages.map((m) => m.conversationId));
  dms.forEach((d) => convIds.add(d.id));
  for (const persona of ['m-vikram', 'e-ananya']) {
    for (const convId of convIds) reads[`${convId}|${persona}`] = nowIso;
  }
  // Unread stories: Vikram has fresh replies waiting; so does Ananya.
  reads[`${convForProject('p-turbine')}|m-vikram`] = hoursAgoIso(3); // 2 unread
  reads[`${convForTask('t-t1')}|m-vikram`] = hoursAgoIso(5); // 1 unread
  reads[`conv-dm-1|m-vikram`] = hoursAgoIso(2); // 1 unread
  reads[`${convForProject('p-turbine')}|e-ananya`] = hoursAgoIso(1.75); // karthik's note
  reads[`${convForMilestone('m-t3')}|e-ananya`] = daysAgoIso(2, 12); // vikram's follow-up
  reads[`conv-dm-3|e-ananya`] = hoursAgoIso(3); // rohan's answer
}
seedReads();

// ---------------------------------------------------------------------------
// Current viewer (the demo's stand-in for the auth session / RLS context)
// ---------------------------------------------------------------------------

let currentUserId: string | null = null;

export function setCurrentDemoUser(profileId: string | null): void {
  currentUserId = profileId;
}

export function getCurrentDemoUser(): Profile | null {
  return profiles.find((p) => p.id === currentUserId) ?? null;
}

export function viewerIsManager(): boolean {
  return getCurrentDemoUser()?.role === 'MANAGER';
}

/** Projects the current viewer can see — the demo's RLS. */
export function visibleProjects(): ProjectRow[] {
  const me = getCurrentDemoUser();
  if (!me) return [];
  if (me.role === 'MANAGER') return projects;
  return projects.filter((p) => p.memberIds.includes(me.id));
}

export function touchProject(projectId: string | null | undefined): void {
  if (!projectId) return;
  const p = projects.find((x) => x.id === projectId);
  if (p) p.updatedAt = new Date().toISOString();
}
