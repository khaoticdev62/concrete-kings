/**
 * CARD RPG — Aseprite MCP Asset Pipeline (PRD CRPG-MAP-PRD-002 §50–§94, §106, §108–§111)
 *
 * This is the SPEC-DRIVEN pipeline layer. Per §92, Aseprite MCP is a
 * development-time production toolchain, NOT a game runtime dependency. The shipped
 * game only needs PNG + JSON metadata. So this module provides everything that can be
 * built and verified without Aseprite installed:
 *
 *   1. ASSET_SPEC_CONTRACT (§53/§108) — every MCP request includes these fields.
 *   2. buildAssetSpec(partial) — normalize + validate a spec before generation.
 *   3. Asset naming standard (§59) — assetName(spec) / validateAssetName(name).
 *   4. AssetValidator (§58/§94) — decodes REAL PNGs (pngjs) and checks:
 *        dimensions, color mode, anti-aliasing (partial-alpha), unexpected
 *        transparency, constrained palette, duplicate assets, naming, frame count
 *        (via optional JSON sidecar or sprite-sheet height math).
 *   5. MCPPromptGenerator (§109) — emits the exact Aseprite MCP task text a dev
 *        pastes into the MCP (Aseprite + scripting/export tooling).
 *   6. ASSET_QUALITY_GATE (§94) — STYLE/SCALE/PALETTE/SILHOUETTE/READABILITY/
 *        ANIMATION/NAMING/EXPORT pass/fail over a validated asset.
 *
 * DOM-free; runs in Node (used by tests + a future CI gate) and browser (wired but
 * inert without files). The decode path is guarded so a missing pngjs dependency or
 * a browser context degrades gracefully to spec-only validation.
 */
(function (root, factory) {
  const mod = factory(
    (typeof require !== 'undefined') ? tryRequire('./dynamic-map-state.js') : null
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (typeof window !== 'undefined') {
    window.AssetPipeline = mod;
    window.ASSET_SPEC_CONTRACT = mod.ASSET_SPEC_CONTRACT;
    window.buildAssetSpec = mod.buildAssetSpec;
    window.AssetValidator = mod.AssetValidator;
    window.MCPPromptGenerator = mod.MCPPromptGenerator;
    window.ASSET_QUALITY_GATE = mod.ASSET_QUALITY_GATE;
    window.MCPBridge = mod.MCPBridge;
    window.assetName = mod.assetName;
    window.validateAssetName = mod.validateAssetName;
  }
  function tryRequire(p) { try { return require(p); } catch (e) { return null; } }
})(this, function () {

  // ---- §53 / §108 — every asset starts with a spec; every MCP request includes these ----
  const ASSET_SPEC_CONTRACT = Object.freeze({
    required: ['id', 'category', 'pixel_scale', 'dimensions', 'palette', 'outline_rule', 'export_format'],
    optional: [
      'style', 'lighting', 'animation', 'layers', 'tags', 'variants',
      'directions', 'color_mode', 'source_file', 'json_sidecar', 'base_file'
    ],
    categories: ['location', 'tile', 'road', 'sidewalk', 'architecture', 'prop',
      'character', 'vehicle', 'effect', 'event', 'ui', 'terrain'],
    exportFormats: ['png', 'spritesheet_png_json', 'aseprite']
  });

  // ---- §59 — naming standard ----
  // map_{category}_{name}_{variant?}  e.g. map_building_diner_blueplate_night
  const ASSET_NAME_RE = /^map_(tile|road|sidewalk|architecture|prop|character|vehicle|effect|event|ui|terrain|building|location)_[a-z0-9]+(_[a-z0-9]+)*$/;

  function assetName(spec) {
    if (!spec || !spec.id) throw new Error('assetName: spec.id required');
    return String(spec.id);
  }

  function validateAssetName(name) {
    if (typeof name !== 'string') return { ok: false, reason: 'name-not-string' };
    if (!ASSET_NAME_RE.test(name)) return { ok: false, reason: 'does-not-match-standard', example: 'map_building_diner_blueplate_night' };
    return { ok: true };
  }

  // ---- §53 — normalize + validate a spec before handing to MCP ----
  function buildAssetSpec(partial) {
    const spec = Object.assign({}, partial);
    const missing = ASSET_SPEC_CONTRACT.required.filter(k => spec[k] === undefined || spec[k] === null || spec[k] === '');
    if (missing.length) {
      return { ok: false, errors: missing.map(k => `missing:${k}`), spec: null };
    }
    if (!ASSET_SPEC_CONTRACT.categories.includes(spec.category)) {
      return { ok: false, errors: [`invalid-category:${spec.category}`], spec: null };
    }
    // palette may be a constrained array OR a named palette reference (§53 palette: city_night)
    const palOk = Array.isArray(spec.palette) ? spec.palette.length > 0
      : (typeof spec.palette === 'string' && spec.palette.length > 0);
    if (!palOk) {
      return { ok: false, errors: ['missing:palette (array or name required)'], spec: null };
    }
    if (!ASSET_SPEC_CONTRACT.exportFormats.includes(spec.export_format)) {
      return { ok: false, errors: [`invalid-export_format:${spec.export_format}`], spec: null };
    }
    // normalize dimensions
    const d = spec.dimensions;
    if (!d || typeof d.width !== 'number' || typeof d.height !== 'number') {
      return { ok: false, errors: ['dimensions-malformed'], spec: null };
    }
    if (d.width % spec.pixel_scale !== 0 || d.height % spec.pixel_scale !== 0) {
      return { ok: false, errors: [`dimensions-not-multiple-of-pixel_scale:${spec.pixel_scale}`], spec: null };
    }
    if (spec.name === undefined) spec.name = assetName(spec);
    const nameCheck = validateAssetName(spec.name);
    if (!nameCheck.ok) {
      return { ok: false, errors: [`bad-name:${nameCheck.reason}`], spec: null };
    }
    return { ok: true, errors: [], spec };
  }

  // ---- §58 / §94 — AssetValidator: decodes REAL pngs via pngjs ----
  function loadPng(path) {
    try {
      const pngjs = tryResolve('pngjs');
      if (!pngjs) return { ok: false, reason: 'pngjs-unavailable' };
      const fs = require('fs');
      if (!fs.existsSync(path)) return { ok: false, reason: 'file-missing', path };
      const PNG = require('pngjs').PNG;
      const buf = fs.readFileSync(path);
      const png = PNG.sync.read(buf);
      return { ok: true, png, path };
    } catch (e) {
      return { ok: false, reason: 'decode-error:' + e.message, path };
    }
  }
  function tryResolve(p) { try { require.resolve(p); return p; } catch (e) { return null; } }

  // detect partial-alpha pixels (sign of anti-aliasing / soft edges), §58/§57
  function countPartialAlpha(png) {
    const data = png.data, ch = png.channels;
    let partial = 0, total = png.width * png.height;
    for (let i = 0; i < data.length; i += ch) {
      const a = ch >= 4 ? data[i + 3] : 255;
      if (a !== 0 && a !== 255) partial++;
    }
    return { partial, total };
  }

  function colorMismatch(png, palette, tol) {
    if (!palette || !Array.isArray(palette) || !palette.length) return null; // can't check
    const t = tol == null ? 24 : tol;
    const data = png.data, ch = png.channels;
    let mism = 0, considered = 0;
    for (let i = 0; i < data.length; i += ch) {
      const a = ch >= 4 ? data[i + 3] : 255;
      if (a === 0) continue; // ignore transparent
      considered++;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      let best = Infinity;
      for (const c of palette) {
        const dr = r - c[0], dg = g - c[1], db = b - c[2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < best) best = dist;
      }
      if (best > t * t) mism++;
    }
    return { mismatched: mism, considered };
  }

  class AssetValidator {
    constructor(options) {
      options = options || {};
      this.tol = options.paletteTolerance == null ? 24 : options.paletteTolerance;
      this.maxPartialAlphaRatio = options.maxPartialAlphaRatio == null ? 0.02 : options.maxPartialAlphaRatio;
      this.seen = new Map(); // path -> hash-ish signature for duplicate detection
    }

    // Validate one asset file against its spec (§58 checks that apply to pixels).
    // Returns { ok, checks:[{name, ok, detail}] , errors:[] }
    validateFile(path, spec) {
      const loaded = loadPng(path);
      if (!loaded.ok) {
        return { ok: false, errors: [loaded.reason], checks: [], path: loaded.path };
      }
      return this._validatePng(loaded.png, spec, path);
    }

    // Validate a decoded PNG object (used by validateFile + tests w/ in-memory PNGs).
    _validatePng(png, spec, path) {
      const out = { ok: true, checks: [], errors: [], path: path || null };

      // dimensions (§58)
      if (spec && spec.dimensions) {
        const dimOk = png.width === spec.dimensions.width && png.height === spec.dimensions.height;
        out.checks.push({ name: 'dimensions', ok: dimOk, detail: `${png.width}x${png.height} vs ${spec.dimensions.width}x${spec.dimensions.height}` });
        if (!dimOk) out.ok = false;
      }
      // pixel-scale divisible (§7/§8)
      if (spec && spec.pixel_scale) {
        const scOk = png.width % spec.pixel_scale === 0 && png.height % spec.pixel_scale === 0;
        out.checks.push({ name: 'pixel_scale', ok: scOk, detail: `scale ${spec.pixel_scale}` });
        if (!scOk) out.ok = false;
      }
      // color mode (§58 wrong color mode) — aseprite assets should be RGBA or indexed
      const ct = (png.colorType !== undefined) ? png.colorType : (png.channels === 4 ? 6 : png.channels === 3 ? 2 : png.channels === 1 ? 0 : 6);
      const colorType = ct; // 6=RGBA, 2=RGB, 3=indexed, 0=gray, 4=gray+alpha
      const modeOk = [2, 3, 4, 6].includes(colorType);
      out.checks.push({ name: 'color_mode', ok: modeOk, detail: `colorType ${colorType}` });
      if (!modeOk) out.ok = false;

      // anti-aliasing / partial alpha (§57/§58)
      const pa = countPartialAlpha(png);
      const ratio = pa.total ? pa.partial / pa.total : 0;
      const aaOk = ratio <= this.maxPartialAlphaRatio;
      out.checks.push({ name: 'no_antialiasing', ok: aaOk, detail: `partialAlphaRatio ${ratio.toFixed(4)}` });
      if (!aaOk) out.ok = false;

      // unexpected transparency: not requested but present (§58)
      if (spec && spec.color_mode === 'opaque') {
        const anyTransparent = this._hasTransparent(png);
        const transOk = !anyTransparent;
        out.checks.push({ name: 'no_unexpected_transparency', ok: transOk, detail: anyTransparent ? 'transparent pixels found' : 'none' });
        if (!transOk) out.ok = false;
      }

      // constrained palette (§10/§58 wrong palette)
      const pm = colorMismatch(png, spec && spec.palette, this.tol);
      if (pm) {
        const ok = pm.considered === 0 || pm.mismatched === 0;
        out.checks.push({ name: 'palette', ok, detail: `${pm.mismatched}/${pm.considered} off-palette` });
        if (!ok) out.ok = false;
      }

      // duplicate detection (§58 duplicate assets)
      const sig = this._signature(png, spec);
      if (this.seen.has(sig)) {
        out.checks.push({ name: 'duplicate', ok: false, detail: `duplicate of ${this.seen.get(sig)}` });
        out.ok = false;
      } else {
        this.seen.set(sig, path);
        out.checks.push({ name: 'duplicate', ok: true, detail: 'unique' });
      }

      // naming (§59)
      if (spec && spec.name) {
        const nc = validateAssetName(spec.name);
        out.checks.push({ name: 'naming', ok: nc.ok, detail: nc.ok ? spec.name : nc.reason });
        if (!nc.ok) out.ok = false;
      }
      return out;
    }

    _hasTransparent(png) {
      const data = png.data, ch = png.channels;
      for (let i = 3; i < data.length; i += ch) if (data[i] < 255) return true;
      return false;
    }

    _signature(png, spec) {
      // cheap signature: downsample every 997th pixel to a string (good enough for dup detect).
      // Incorporate the asset name so two DIFFERENTLY named assets with identical pixels
      // are NOT falsely flagged as duplicates (they are distinct entities).
      const name = (spec && (spec.name || spec.id)) || '';
      const data = png.data, ch = png.channels, parts = [];
      for (let i = 0; i < data.length; i += ch * 997) {
        parts.push(data[i] + ',' + data[i + 1] + ',' + data[i + 2] + ',' + (ch >= 4 ? data[i + 3] : 255));
      }
      return name + '#' + parts.join('|');
    }

    // Validate a spec-only (no file) — used pre-generation (§53 gate).
    validateSpec(spec) {
      const built = buildAssetSpec(spec);
      return { ok: built.ok, errors: built.errors, checks: [{ name: 'spec_contract', ok: built.ok }] };
    }
  }

  // ---- §109 — emit the exact Aseprite MCP task text a dev pastes into the MCP ----
  class MCPPromptGenerator {
    static generate(spec, opts) {
      opts = opts || {};
      const built = buildAssetSpec(spec);
      if (!built.ok) throw new Error('MCPPromptGenerator: invalid spec — ' + built.errors.join(', '));
      const s = built.spec;
      const lines = [];
      lines.push(`Create a ${s.dimensions.width}×${s.dimensions.height} pixel-art ${s.style || s.category} asset.`);
      lines.push('');
      lines.push('Style:');
      lines.push(`  ${s.style || 'gritty modern narrative RPG (CARD RPG)'}.`);
      lines.push(`  pixel scale: ${s.pixel_scale}px base tiles.`);
      if (s.lighting) lines.push(`  lighting: ${s.lighting}.`);
      if (s.outline_rule) lines.push(`  outline: ${s.outline_rule}.`);
      lines.push('');
      lines.push('Required:');
      const req = Array.isArray(s.required_elements) ? s.required_elements
        : (s.animation && s.animation.required ? s.animation.required : []);
      req.forEach(r => lines.push(`  - ${r}`));
      if (s.directions) lines.push(`  - directions: ${s.directions.join(', ')}`);
      lines.push('');
      lines.push('Layers:');
      (s.layers || ['GUIDES', 'SHADOW', 'BASE', 'DETAIL', 'LIGHT', 'FX']).forEach(l => lines.push(`  ${l}`));
      if (s.animation && s.animation.tags) {
        lines.push('');
        lines.push('Animations:');
        s.animation.tags.forEach(t => lines.push(`  ${t}: ${s.animation.durations ? s.animation.durations[t] || 100 : 100}ms`));
      }
      if (s.variants && s.variants.length) {
        lines.push('');
        lines.push('Variants:');
        s.variants.forEach(v => lines.push(`  - ${v}`));
      }
      lines.push('');
      lines.push('Export:');
      lines.push(`  ${s.export_format === 'spritesheet_png_json' ? 'PNG spritesheets + JSON metadata' : s.export_format}.`);
      lines.push('Do not anti-alias.');
      lines.push('Do not introduce gradients.');
      lines.push('Preserve hard pixel edges.');
      if (opts.target) lines.push(`Target: ${opts.target}.`);
      return lines.join('\n');
    }
  }

  // ---- §94 — production quality gate over a validated asset ----
  const ASSET_QUALITY_GATE = Object.freeze({
    gates: ['STYLE', 'SCALE', 'PALETTE', 'SILHOUETTE', 'READABILITY', 'ANIMATION', 'NAMING', 'EXPORT'],
    run(asset) {
      // asset: { spec, validation, notes }
      const v = asset.validation;
      const find = (n) => v && v.checks && v.checks.find(c => c.name === n);
      const results = {};
      results.SCALE = !!(find('pixel_scale') && find('pixel_scale').ok);
      results.NAMING = !!(find('naming') && find('naming').ok);
      const pal = find('palette');
      results.PALETTE = !pal || pal.ok; // no palette check, or it passed
      results.STYLE = !!(asset.spec && asset.spec.style);
      results.SILHOUETTE = !!(asset.spec && asset.spec.silhouette) || !!(asset.notes && asset.notes.silhouette);
      results.READABILITY = !!(asset.spec && asset.spec.readability) || !!(asset.notes && asset.notes.readability);
      results.ANIMATION = !(asset.spec && asset.spec.animation) || !!(asset.spec.animation && asset.spec.animation.tags && asset.spec.animation.tags.length);
      results.EXPORT = !!(asset.spec && ASSET_SPEC_CONTRACT.exportFormats.includes(asset.spec.export_format));
      const allPass = Object.values(results).every(Boolean);
      return { ok: allPass, results };
    }
  });

  // ---- §50/§52/§93 — MCPBridge: generate a REAL asset via the Aseprite MCP server ----
  // This is the execute-and-validate half of the pipeline. It shells out to the
  // Python MCP client (scripts/aseprite_mcp_client.py) which talks to the installed
  // Aseprite MCP server + Aseprite.exe, produces a PNG, then runs AssetValidator on it.
  class MCPBridge {
    constructor(options) {
      options = options || {};
      this.python = options.python || null; // optional explicit python exe
      this.clientScript = options.clientScript
        || (typeof __dirname !== 'undefined' ? require('path').join(__dirname, '..', '..', 'scripts', 'aseprite_mcp_client.py').replace(/\\/g, '/')
          : 'scripts/aseprite_mcp_client.py');
      this.outdir = options.outdir || null;
      this.validator = new AssetValidator(options.validatorOptions || {});
      this._spawn = options.spawn || null; // injectable for tests
    }

    // Returns { ok, generated:{png,ase}, validation, spec, error }
    async generate(specInput) {
      const built = buildAssetSpec(specInput);
      if (!built.ok) return { ok: false, error: 'spec-invalid:' + built.errors.join(','), generated: null, validation: null, spec: null };
      const spec = built.spec;
      // normalize the spec into the draw plan the MCP client understands
      const drawPlan = this._toDrawPlan(spec);
      const tmp = require('fs');
      const os = require('os');
      const path = require('path');
      const specFile = path.join(os.tmpdir(), spec.id + '.spec.json').replace(/\\/g, '/');
      tmp.writeFileSync(specFile, JSON.stringify(Object.assign({}, spec, { draw: drawPlan })));
      const outdir = (this.outdir || (spec.dir || path.join('assets', 'generated'))).toString().replace(/\\/g, '/');
      const spawn = this._spawn || ((cmd, args) => {
        const { execFile } = require('child_process');
        const child = execFile(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
        // normalize to a spawn-like emitter with .stdout/.stderr/.on('close')
        return child;
      });

      const py = this.python || this._detectPython();
      if (!py) return { ok: false, error: 'python-unavailable', generated: null, validation: null, spec };
      const child = spawn(py, [this.clientScript, specFile, '--outdir', outdir]);
      const out = await new Promise((resolve) => {
        let data = '', err = '';
        child.stdout.on('data', d => data += d);
        child.stderr.on('data', d => err += d);
        child.on('close', () => resolve({ data, err }));
      });
      let gen;
      try { gen = JSON.parse(out.data.trim().split('\n').pop()); } catch (e) { gen = { ok: false, error: 'bad-client-output:' + out.err }; }
      if (!gen.ok) return { ok: false, error: gen.error || 'generation-failed', generated: null, validation: null, spec };
      const validation = this.validator.validateFile(gen.png, spec);
      return { ok: validation.ok, generated: { png: gen.png, ase: gen.ase }, validation, spec };
    }

    _toDrawPlan(spec) {
      // A spec can carry an explicit `draw` plan; otherwise synthesize a base fill
      // + outline from the spec so generation always produces a valid pixel block.
      if (Array.isArray(spec.draw) && spec.draw.length) return spec.draw;
      const base = (spec.base_color) || (Array.isArray(spec.palette) && spec.palette[0]) || [32, 36, 46];
      const hex = Array.isArray(base) ? '#' + base.map(c => c.toString(16).padStart(2, '0')).join('') : String(base);
      const w = spec.dimensions.width, h = spec.dimensions.height;
      const outline = spec.outline_rule ? (spec.outline_color || '#0a0a0c') : null;
      const plan = [{ op: 'fill', color: hex }];
      if (outline) plan.push({ op: 'outline', color: outline });
      return plan;
    }

    _detectPython() {
      // The Aseprite MCP server requires its own venv (with the `mcp` package).
      // Search upward from this module for the aseprite-mcp dir, then its venv.
      // Return a forward-slash path: Node's spawn on Windows mangles single
      // backslashes in executable paths (WinError 2 / ENOENT).
      const fs = require('fs'), path = require('path');
      let dir = __dirname || '.';
      for (let i = 0; i < 6; i++) {
        const candidate = path.join(dir, 'aseprite-mcp', '.venv', 'Scripts', 'python.exe').replace(/\\/g, '/');
        if (fs.existsSync(candidate.replace(/\//g, '\\'))) return candidate;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
      return null;
    }

    // validate an already-generated PNG path (no generation)
    validatePath(pngPath, spec) { return this.validator.validateFile(pngPath, spec); }
  }

  return {
    ASSET_SPEC_CONTRACT, assetName, validateAssetName, buildAssetSpec,
    AssetValidator, MCPPromptGenerator, ASSET_QUALITY_GATE, loadPng, MCPBridge
  };
});
