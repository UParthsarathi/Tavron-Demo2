const fs = require('fs');

let code = fs.readFileSync('src/components/projects/tabs/ProjectMilestonesTab.tsx', 'utf8');

// Add imports
code = code.replace("import React from 'react';", "import React, { useEffect, useRef } from 'react';");

// Add refs inside component
const refInsertTarget = "export function ProjectMilestonesTab({\n  project,\n  readOnly,\n  showAllMilestones,\n  onToggleShowAll,\n  onAddMilestoneClick,\n  onCompleteMilestoneClick,\n  onDeleteMilestone\n}: ProjectMilestonesTabProps) {\n";
const refInsertCode = `  const currentMilestoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAllMilestones && currentMilestoneRef.current) {
      currentMilestoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showAllMilestones]);
`;

code = code.replace(refInsertTarget, refInsertTarget + refInsertCode);

// Add ref to the current milestone node
const displayListCode = `return displayList.map((m, originalIdx) => {
                const idx = showAllMilestones ? originalIdx : 0;
                const isEven = idx % 2 === 0;
                const dueDate = new Date(m.dueDate);
                dueDate.setHours(0,0,0,0);
                const today = new Date();
                today.setHours(0,0,0,0);
                const isPastDue = dueDate < today && m.status !== 'COMPLETED';
                const isCurrent = m.status !== 'COMPLETED' && (originalIdx === 0 || sorted.slice(0, originalIdx).every(prev => prev.status === 'COMPLETED'));
              
                return (
                  <div 
                    key={m.id} 
                    ref={isCurrent ? currentMilestoneRef : null}
                    className={cn("relative flex items-center justify-between md:justify-normal w-full", isEven ? "md:flex-row-reverse" : "md:flex-row")}
                  >`;

code = code.replace(`return displayList.map((m, originalIdx) => {
                const idx = showAllMilestones ? originalIdx : 0;
                const isEven = idx % 2 === 0;
                const dueDate = new Date(m.dueDate);
                dueDate.setHours(0,0,0,0);
                const today = new Date();
                today.setHours(0,0,0,0);
                const isPastDue = dueDate < today && m.status !== 'COMPLETED';
              
                return (
                  <div key={m.id} className={cn("relative flex items-center justify-between md:justify-normal w-full", isEven ? "md:flex-row-reverse" : "md:flex-row")}>`, displayListCode);

fs.writeFileSync('src/components/projects/tabs/ProjectMilestonesTab.tsx', code);
