const fs = require('fs');
let code = fs.readFileSync('src/components/projects/ProjectDetails.tsx', 'utf8');
code = code.replace("import React, { useState, useRef } from 'react';", "import React, { useState, useRef, useEffect } from 'react';");
code = code.replace("import { useEffect } from 'react';\n", "");
fs.writeFileSync('src/components/projects/ProjectDetails.tsx', code);
