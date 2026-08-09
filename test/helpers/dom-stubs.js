// Minimal browser-like stubs for server-side tests that touch DOM APIs.
if (typeof globalThis.document === 'undefined') {
  const elements = new Map();
  globalThis.document = {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, {
          textContent: '', onclick: null, style: {}, className: '',
          appendChild() {}, innerHTML: ''
        });
      }
      return elements.get(id);
    },
    createElement(tag) {
      return { textContent: '', onclick: null, style: {}, className: '', appendChild() {} };
    }
  };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    addEventListener() {},
    dispatchEvent() {}
  };
}
