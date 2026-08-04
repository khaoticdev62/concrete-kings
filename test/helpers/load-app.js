const fs = require('fs');
const path = require('path');
const vm = require('vm');

const INDEX_HTML = path.join(__dirname, '..', '..', 'index.html');
const BOUNDARY = "document.getElementById('blackCard')";

function loadGameModule() {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) throw new Error('index.html: could not find inline <script> block');
  const script = match[1];

  // Find the boundary: the occurrence of document.getElementById('blackCard')
  // that comes with .addEventListener (the DOM-wiring boundary, not the method call)
  const boundaryIndex = script.indexOf(BOUNDARY + ".addEventListener");
  if (boundaryIndex === -1) {
    throw new Error(`index.html: could not find test boundary marker "${BOUNDARY}.addEventListener"`);
  }
  const testable = script.slice(0, boundaryIndex);
  const context = { console, Math };
  vm.createContext(context);
  const wrapped = `${testable}\n({ Deck, Game, ReceiptSystem, RECEIPT_POOL, BLACK_CARDS, WHITE_CARDS, DICE_EFFECTS });`;
  return vm.runInContext(wrapped, context);
}

module.exports = { loadGameModule };
