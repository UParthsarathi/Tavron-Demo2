const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/WorkloadWidget.tsx', 'utf8');

code = code.replace(
  /<div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1\.5 mb-1 overflow-hidden flex">[\s\S]*?<\/div>[\s]*<\/div>[\s]*<\/div>/,
  `</div>
              </div>`
);

fs.writeFileSync('src/components/dashboard/WorkloadWidget.tsx', code);
