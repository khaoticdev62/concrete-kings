/**
 * CARD RPG — Map Asset Registry (PRD CRPG-MAP-PRD-002 §53/§57/§59)
 *
 * Maps the §59 asset naming standard onto the renderer's lookup needs:
 *   given a generated asset file name like `map_building_diner_blueplate_night.png`
 *   it indexes it under category `building`, key `diner_blueplate_night`, and can
 *   later resolve a location/character/vehicle/prop/tile/fx/event to the most
 *   appropriate generated PNG via flexible candidate matching.
 *
 * This is the bridge between "we generated these assets with Aseprite MCP" and
 * "the world-map renderer should draw them instead of the geometric fallback".
 *
 * DOM-free + Node-testable. No filesystem access at module load; scanning is an
 * explicit `scanSync()` (Node only) and browsers feed a prebuilt manifest via
 * `fromManifest()`. Paths are stored relative to the asset base (e.g.
 * `generated/map_building_x.png`) so the existing DMAssetManager (`base:'assets/'`)
 * can load them as `assets/generated/map_building_x.png`.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (typeof window !== 'undefined') {
    window.MapAssetRegistryModule = mod;
    window.MapAssetRegistry = mod.MapAssetRegistry;
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // §59 naming: map_{category}_{name}_{variant?}
  // Allowed category tokens in the spec validator (asset-pipeline ASSET_NAME_RE),
  // plus common PRD §59 shorthand aliases we normalize for resolution.
  const CATEGORIES = ['tile', 'road', 'sidewalk', 'architecture', 'prop', 'character',
    'vehicle', 'effect', 'event', 'ui', 'terrain', 'building', 'location'];
  const ALIASES = { char: 'character', fx: 'effect', loc: 'location', arch: 'architecture' };

  const NAME_RE = /^map_([a-z0-9]+)_([a-z0-9]+(_[a-z0-9]+)*)(\.[a-z0-9]+)?$/;

  function slug(s) {
    if (s == null) return '';
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function normCat(c) { return ALIASES[c] || c; }

  class MapAssetRegistry {
    constructor() {
      // index[category] = Map<key, path>
      this.index = {};
      CATEGORIES.forEach(c => { this.index[c] = new Map(); });
      this.basePath = 'generated/';
      this.count = 0;
    }

    setBasePath(p) { this.basePath = p || 'generated/'; return this; }

    // Parse a single filename (no dir) and index it. Returns true if indexed.
    _indexFile(filename) {
      const m = NAME_RE.exec(filename);
      if (!m) return false;
      const cat = normCat(m[1]);
      if (!this.index[cat]) this.index[cat] = new Map();
      const key = m[2];
      const path = (this.basePath + filename).replace(/\\/g, '/');
      this.index[cat].set(key, path);
      this.count++;
      return true;
    }

    // Build from an explicit list of file names (or full relative paths).
    fromPaths(paths) {
      (paths || []).forEach(p => {
        const fn = String(p).split(/[\\/]/).pop();
        this._indexFile(fn);
      });
      return this;
    }

    // Node only: scan a directory for *.png (and *.aseprite) and index them.
    scanSync(dir, basePath) {
      if (basePath) this.basePath = basePath;
      let fs;
      try { fs = require('fs'); } catch (e) { return this; }
      if (!fs.existsSync(dir)) return this;
      const entries = fs.readdirSync(dir);
      entries.forEach(fn => {
        if (/\.(png|aseprite)$/i.test(fn)) this._indexFile(fn);
      });
      return this;
    }

    // Look up the first matching key within a (normalized) category.
    _lookup(cat, candidates) {
      const m = this.index[normCat(cat)];
      if (!m) return null;
      for (const c of candidates) {
        if (!c) continue;
        if (m.has(c)) return m.get(c);
      }
      return null;
    }

    // ---- high-level resolvers (what the renderer calls) ----

    // location: try id, name, type, then with a variant (timeOfDay/state)
    resolveLocation(type, id, name, variant) {
      const ids = [slug(id), slug(name), slug(type)];
      if (variant) {
        ids.push(slug(id) + '_' + slug(variant));
        ids.push(slug(name) + '_' + slug(variant));
        ids.push(slug(type) + '_' + slug(variant));
      }
      return this._lookup('building', ids);
    }

    resolveCharacter(id, name) {
      return this._lookup('character', [slug(id), slug(name)]);
    }

    resolveVehicle(id, name) {
      return this._lookup('vehicle', [slug(id), slug(name)]);
    }

    resolveTile(name) { return this._lookup('tile', [slug(name)]); }
    resolveProp(name) { return this._lookup('prop', [slug(name)]); }
    resolveEffect(name) { return this._lookup('effect', [slug(name)]); }
    resolveEvent(name) { return this._lookup('event', [slug(name)]); }
    resolveTerrain(name) { return this._lookup('terrain', [slug(name)]); }

    // all paths for a category (for diagnostics / manifest export)
    all(category) {
      const m = this.index[normCat(category)];
      return m ? Array.from(m.values()) : [];
    }

    has(category) {
      const m = this.index[normCat(category)];
      return !!(m && m.size);
    }
  }

  return { MapAssetRegistry, NAME_RE, slug, CATEGORIES, ALIASES };
});
