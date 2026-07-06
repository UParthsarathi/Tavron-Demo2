const fs = require('fs');

let code = fs.readFileSync('src/components/projects/ProjectDetails.tsx', 'utf8');

const targetClose = `                      </div>
                    );
                  })}
                </div>`;

const replacementClose = `                      </div>
                    );
                  })})()}
                </div>`;

code = code.replace(targetClose, replacementClose);

fs.writeFileSync('src/components/projects/ProjectDetails.tsx', code);
