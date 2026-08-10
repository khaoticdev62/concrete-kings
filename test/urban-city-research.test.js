const test = require('node:test');
const assert = require('node:assert/strict');
const { CITY_RESEARCH_PROFILES } = require('../src/pixel_engine/topdown-city-data.js');

test('UrbanCityResearch: defines research profiles for all 12 real-world cities', () => {
  const cities = [
    'Detroit', 'Miami', 'NewOrleans', 'Houston', 'Baltimore',
    'Chicago', 'NewYork', 'LosAngeles', 'Philadelphia', 'Atlanta',
    'Phoenix', 'Seattle'
  ];

  cities.forEach(c => {
    const profile = CITY_RESEARCH_PROFILES[c];
    assert.ok(profile, `Missing research profile for city: ${c}`);
    assert.ok(profile.signature && profile.signature.length > 10, `${c} missing visual signature`);
    assert.ok(Array.isArray(profile.materials) && profile.materials.length >= 3, `${c} missing materials array`);
    assert.ok(profile.lighting && profile.lighting.length > 5, `${c} missing lighting description`);
    assert.ok(Array.isArray(profile.colors) && profile.colors.length >= 4, `${c} missing color palette array`);
    assert.ok(profile.mood && profile.mood.length > 3, `${c} missing mood descriptor`);
    assert.ok(profile.timeCue, `${c} missing time cue`);
    assert.ok(profile.keyDetail, `${c} missing key detail`);
  });
});
