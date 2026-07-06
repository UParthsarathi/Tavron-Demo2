const fs = require('fs');

// Patch ProjectList.tsx
let pl = fs.readFileSync('src/components/projects/ProjectList.tsx', 'utf8');
pl = pl.replace('grid-cols-1 md:grid-cols-2', 'grid-cols-2 md:grid-cols-2');
pl = pl.replace('gap-4 sm:gap-6', 'gap-3 sm:gap-6');
fs.writeFileSync('src/components/projects/ProjectList.tsx', pl);

// Patch ProjectCard.tsx
let pc = fs.readFileSync('src/components/projects/ProjectCard.tsx', 'utf8');
pc = pc.replace('p-6 cursor-pointer', 'p-4 sm:p-6 cursor-pointer');
pc = pc.replace('mb-6', 'mb-4 sm:mb-6');
pc = pc.replace('text-lg text-gray-900', 'text-base sm:text-lg text-gray-900');
pc = pc.replace('flex justify-between items-start', 'flex flex-col sm:flex-row sm:justify-between items-start gap-2 sm:gap-0');
fs.writeFileSync('src/components/projects/ProjectCard.tsx', pc);

