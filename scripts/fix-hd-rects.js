const fs = require('fs');
const path = 'index.html';
let html = fs.readFileSync(path, 'utf8');
const startMarker = '/* High-detail canvas scaling helpers for inline draw calls */';
const endMarker = 'function drawCharacterPreview';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);
if (start === -1 || end === -1) {
  console.log('markers not found');
  process.exit(1);
}
const before = html.slice(0, start);
const section = html.slice(start, end);
const after = html.slice(end);
const fixed = section.replace(/ctx\.fillRect\(\.\.\.hdRect\(ctx, (.*?)\)\)\)\);/g, 'ctx.fillRect(...hdRect(ctx, $1));').replace(/ctx\.fillRect\(\.\.\.hdRect\(ctx, (.*?)\)\)\)\)/g, 'ctx.fillRect(...hdRect(ctx, $1));');
if (section === fixed) {
  console.log('no fix applied');
} else {
  fs.writeFileSync(path, before + fixed + after);
  console.log('fixed malformed hdRect calls');
}
