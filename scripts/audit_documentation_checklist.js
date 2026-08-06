const fs = require('fs');
const path = require('path');

const docFiles = [
  'CONTENT-HYPER-EXPANDED.md',
  'CONTENT-ULTRA-EXPANDED.md',
  'DESIGN.md',
  'DESIGN-CARD-ANIMATION.md',
  'GAME-MECHANICS-ADVANCED.md',
  'GAME-MECHANICS-E2E.md',
  'GRIT-MODERNISM-RPG-RULES.md',
  'CLAUDE-AAVE-MASTER-PROMPT.md',
  'CLAUDE-DESIGN-PROMPT.md',
  'CONCRETE-KINGS-CARD-DATABASE.md',
  'CONTENT-AAVE-EXPANDED.md'
];

const rootDir = path.join(__dirname, '..');

docFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  const exists = fs.existsSync(filePath);
  const size = exists ? fs.statSync(filePath).size : 0;
  console.log(`${file}: ${exists ? 'EXISTS (' + size + ' bytes)' : 'MISSING'}`);
});
