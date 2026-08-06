const fs = require('fs');
const path = require('path');

const wireframesDir = path.join(__dirname, '..', 'wireframes');
const files = [
  'Concrete Kings Block Map.html',
  'Concrete Kings Card Animation System.html',
  'Concrete Kings Card Design System.html',
  'Concrete Kings Game Interfaces.html'
];

files.forEach(file => {
  const filePath = path.join(wireframesDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File missing: ${file}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`=== ${file} === (${content.length} bytes)`);

  // Search for script tags or bundled data
  const matches = content.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
  if (matches) {
    try {
      const template = JSON.parse(matches[1]);
      console.log(`Template keys: ${Object.keys(template).join(', ')}`);
    } catch (e) {
      console.log(`Template parse error: ${e.message}`);
    }
  } else {
    console.log(`No __bundler/template tag found in ${file}`);
  }
});
