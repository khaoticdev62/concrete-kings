const fs = require('fs');
const path = require('path');
const vm = require('vm');

const INDEX_HTML = path.join(__dirname, '..', '..', 'index.html');
const CARDS_JS = path.join(__dirname, '..', '..', 'cards.js');
const BOUNDARY = "document.getElementById('blackCard')";

function loadGameModule() {
  const cardsScript = fs.readFileSync(CARDS_JS, 'utf8');
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) throw new Error('index.html: could not find inline <script> block');
  const script = match[1];
  const boundaryIndex = script.indexOf(BOUNDARY + ".addEventListener");
  if (boundaryIndex === -1) {
    throw new Error(`index.html: could not find test boundary marker "${BOUNDARY}.addEventListener"`);
  }
  const testable = script.slice(0, boundaryIndex);
  const context = { console, Math };
  vm.createContext(context);
  const wrapped = `${cardsScript}\n${testable}\n({ Deck, Game, ReceiptSystem, AllianceSystem, RECEIPT_POOL, BLACK_CARDS, WHITE_CARDS, DICE_EFFECTS });`;
  return vm.runInContext(wrapped, context);
}

module.exports = { loadGameModule };
