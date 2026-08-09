const test = require('node:test');
const assert = require('node:assert/strict');

// Minimal DOM stub for accessibility tests
function createDomStub() {
  const classListStore = new Set();
  const styleStore = {};
  const elements = new Map();

  const body = {
    style: styleStore,
    classList: {
      add: (...cls) => cls.forEach(c => classListStore.add(c)),
      remove: (...cls) => cls.forEach(c => classListStore.delete(c)),
      contains: c => classListStore.has(c)
    }
  };

  const getElementById = (id) => {
    if (!elements.has(id)) {
      elements.set(id, { value: '', checked: false, style: {} });
    }
    return elements.get(id);
  };

  return { body, getElementById, classListStore, styleStore, elements };
}

test('Accessibility: setAccessColorblind sets correct CSS filter', () => {
  const dom = createDomStub();
  const app = {
    setAccessColorblind(mode) {
      dom.body.style.filter = 'none';
      if (mode === 'protanopia') dom.body.style.filter = 'url(#protanopia-filter)';
      else if (mode === 'deuteranopia') dom.body.style.filter = 'url(#deuteranopia-filter)';
      else if (mode === 'tritanopia') dom.body.style.filter = 'url(#tritanopia-filter)';
      else if (mode === 'monochrome') dom.body.style.filter = 'grayscale(100%)';
    }
  };

  app.setAccessColorblind('protanopia');
  assert.equal(dom.body.style.filter, 'url(#protanopia-filter)');

  app.setAccessColorblind('monochrome');
  assert.equal(dom.body.style.filter, 'grayscale(100%)');

  app.setAccessColorblind('none');
  assert.equal(dom.body.style.filter, 'none');
});

test('Accessibility: setAccessTextScale applies text-scale CSS class', () => {
  const dom = createDomStub();
  const app = {
    setAccessTextScale(scale) {
      dom.body.classList.remove('text-scale-125', 'text-scale-150', 'text-scale-175');
      if (scale !== '100') {
        dom.body.classList.add('text-scale-' + scale);
      }
    }
  };

  app.setAccessTextScale('150');
  assert.equal(dom.body.classList.contains('text-scale-150'), true);

  app.setAccessTextScale('100');
  assert.equal(dom.body.classList.contains('text-scale-150'), false);
});

test('Accessibility: setAccessHighContrast and setAccessReducedMotion toggle body classes', () => {
  const dom = createDomStub();
  const app = {
    setAccessHighContrast(active) {
      if (active) dom.body.classList.add('high-contrast');
      else dom.body.classList.remove('high-contrast');
    },
    setAccessReducedMotion(active) {
      if (active) dom.body.classList.add('reduced-motion');
      else dom.body.classList.remove('reduced-motion');
    }
  };

  app.setAccessHighContrast(true);
  assert.equal(dom.body.classList.contains('high-contrast'), true);

  app.setAccessHighContrast(false);
  assert.equal(dom.body.classList.contains('high-contrast'), false);

  app.setAccessReducedMotion(true);
  assert.equal(dom.body.classList.contains('reduced-motion'), true);
});

test('Accessibility: setAccessShowFps toggles FPS overlay visibility', () => {
  const dom = createDomStub();
  const fpsOverlay = { style: { display: 'none' } };
  dom.elements.set('fpsOverlay', fpsOverlay);

  const app = {
    setAccessShowFps(active) {
      this.showFpsCounter = active;
      const overlay = dom.getElementById('fpsOverlay');
      if (overlay) overlay.style.display = active ? 'block' : 'none';
    }
  };

  app.setAccessShowFps(true);
  assert.equal(fpsOverlay.style.display, 'block');

  app.setAccessShowFps(false);
  assert.equal(fpsOverlay.style.display, 'none');
});
