/**
 * Concrete Kings: The Block Chronicles
 * Card Component & Visual Design Engine (Spec v3.0 #7-#10 & #93)
 *
 * Renders retro 16-bit card components with categories, rarity borders,
 * recommendation badges, state modifiers, and Canon Card glow effects.
 */

const CK_CARD_CATEGORIES = {
  SOCIAL: { label: 'SOCIAL', icon: '💬', color: '#6fe8d8' },
  CHAOS: { label: 'CHAOS', icon: '🔥', color: '#ffcd68' },
  CRIME: { label: 'CRIME', icon: '🕶️', color: '#f25438' },
  TECH: { label: 'TECH', icon: '⚡', color: '#ff7fbf' }
};

const CK_CARD_RARITIES = {
  COMMON: { label: 'COMMON', color: '#a0aac2', border: '2px solid #2d313d' },
  RARE: { label: 'RARE', color: '#6fe8d8', border: '2px solid #6fe8d8' },
  EPIC: { label: 'EPIC', color: '#ffcd68', border: '2px solid #ffcd68' },
  LEGENDARY: { label: 'LEGENDARY', color: '#f25438', border: '2px solid #f25438' },
  CANON: { label: 'CANON', color: '#ffcd68', border: '3px solid #ffcd68', glow: '0 0 12px #ffcd68' }
};

function renderCardHtml(card = {}, options = {}) {
  const categoryKey = (card.category || 'SOCIAL').toUpperCase();
  const cat = CK_CARD_CATEGORIES[categoryKey] || CK_CARD_CATEGORIES.SOCIAL;
  const rarityKey = (card.rarity || (card.isCanon ? 'CANON' : 'COMMON')).toUpperCase();
  const rarity = CK_CARD_RARITIES[rarityKey] || CK_CARD_RARITIES.COMMON;

  const stateClass = options.state ? `card-state-${options.state.toLowerCase()}` : 'card-state-idle';
  const recommendationBadge = options.recommendation ? `
    <div style="position:absolute; top:-10px; right:8px; background:${options.recommendation.color}; color:#101116; font-family:'Press Start 2P', monospace; font-size:6px; padding:2px 6px; border-radius:2px; box-shadow:0 2px 4px rgba(0,0,0,0.5);">
      ${options.recommendation.label}
    </div>
  ` : '';

  const title = card.title || card.text || 'UNKNOWN CARD';
  const description = card.description || card.text || '';
  const tags = card.tags || [];

  return `
    <div class="ck-card ${stateClass} ${card.isCanon ? 'ck-card-canon' : ''}"
         data-card-id="${card.id || ''}"
         style="position:relative; width:130px; height:180px; background:#151821; border:${rarity.border}; box-shadow:${rarity.glow || '0 4px 10px rgba(0,0,0,0.6)'}; border-radius:6px; padding:8px; box-sizing:border-box; display:flex; flex-direction:column; justify-space-between; user-select:none; transition:transform 120ms ease, box-shadow 120ms ease;">

      ${recommendationBadge}

      <!-- TOP CATEGORY BAR -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #2d313d; padding-bottom:4px; margin-bottom:6px;">
        <span style="font-family:'Press Start 2P', monospace; font-size:6px; color:${cat.color}; display:flex; align-items:center; gap:2px;">
          <span>${cat.icon}</span> ${cat.label}
        </span>
        <span style="font-family:'Press Start 2P', monospace; font-size:5px; color:${rarity.color};">${rarity.label}</span>
      </div>

      <!-- TITLE -->
      <div style="font-family:'Press Start 2P', monospace; font-size:7px; color:#ffcd68; margin-bottom:6px; line-height:1.2; text-overflow:ellipsis; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
        ${title}
      </div>

      <!-- ART CONTAINER -->
      <div style="flex:1; background:#101116; border:1px solid #2d313d; border-radius:4px; display:flex; align-items:center; justify-content:center; margin-bottom:6px; padding:4px;">
        <span style="font-size:24px;">${cat.icon}</span>
      </div>

      <!-- DESCRIPTION -->
      <div style="font-family:'JetBrains Mono', monospace; font-size:8px; color:#cbd5ed; line-height:1.2; margin-bottom:4px; height:32px; overflow:hidden;">
        ${description}
      </div>

      <!-- TAGS FOOTER -->
      <div style="display:flex; gap:2px; flex-wrap:wrap;">
        ${tags.map(t => `<span style="background:#2d313d; color:#6fe8d8; font-family:'JetBrains Mono', monospace; font-size:6px; padding:1px 3px; border-radius:2px;">${t}</span>`).join('')}
      </div>
    </div>
  `;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderCardHtml, CK_CARD_CATEGORIES, CK_CARD_RARITIES };
}
if (typeof window !== 'undefined') {
  window.CardComponent = { renderCardHtml, CK_CARD_CATEGORIES, CK_CARD_RARITIES };
}
