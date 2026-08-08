const fs = require('fs');
const path = require('path');
const vm = require('vm');

const INDEX_HTML = path.join(__dirname, '..', '..', 'index.html');
const CARDS_JS = path.join(__dirname, '..', '..', 'cards.js');
const BOUNDARY = "document.getElementById('blackCard')";

function loadGameModule() {
  const cardsScript = fs.readFileSync(CARDS_JS, 'utf8');
  const storyScript = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'pixel_engine', 'story-engine.js'), 'utf8');
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) throw new Error('index.html: could not find inline <script> block');
  const script = match[1];
  const boundaryIndex = script.indexOf(BOUNDARY + ".addEventListener");
  if (boundaryIndex === -1) {
    throw new Error(`index.html: could not find test boundary marker "${BOUNDARY}.addEventListener"`);
  }
  const testable = script.slice(0, boundaryIndex);
  const context = { 
    console, 
    Math,
    CHARACTER_ORIGINS: typeof global.CHARACTER_ORIGINS !== 'undefined' ? global.CHARACTER_ORIGINS : undefined,
    document: typeof global.document !== 'undefined' ? global.document : undefined,
    window: typeof global.window !== 'undefined' ? global.window : undefined,
    setInterval: typeof global.setInterval !== 'undefined' ? global.setInterval : undefined,
    clearInterval: typeof global.clearInterval !== 'undefined' ? global.clearInterval : undefined,
    setTimeout: typeof global.setTimeout !== 'undefined' ? global.setTimeout : undefined,
    clearTimeout: typeof global.clearTimeout !== 'undefined' ? global.clearTimeout : undefined,
    Event: typeof global.Event !== 'undefined' ? global.Event : undefined
  };
  
  // Keep VM context's globals dynamically linked to Node's global object in tests
  Object.defineProperty(context, 'document', {
    get() { return global.document; },
    set(v) { global.document = v; }
  });
  Object.defineProperty(context, 'window', {
    get() { return global.window; },
    set(v) { global.window = v; }
  });

  vm.createContext(context);
  const wrapped = `${cardsScript}\n${storyScript}\n${testable}\n({ Deck, Game, ReceiptSystem, AllianceSystem, RECEIPT_POOL, BLACK_CARDS, WHITE_CARDS, DICE_EFFECTS, app, NarrativeStoryEngine, NARRATIVE_BEATS, ENDINGS });`;
  return vm.runInContext(wrapped, context);
}

module.exports = { loadGameModule };
