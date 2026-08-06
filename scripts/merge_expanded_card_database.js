/**
 * Concrete Kings: Card Database Expander
 * Merges scenario and response cards from master markdown files into index.html
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');

let indexHtml = fs.readFileSync(indexPath, 'utf8');

const blackScenarios = [
  "____ is the real reason the club closed early.",
  "____: now with 100% more ____.",
  "When life gives you ____, make ____.",
  "The new street legend says ____ beats ____.",
  "____ ruined Thanksgiving before the food was even served.",
  "____ is the only acceptable excuse for being late to the cookout.",
  "The usher said you can't sit in ____.",
  "The choir robe had ____ embroidered on the back.",
  "The pastor said we need a word about ____.",
  "The family reunion committee assigned you to ____.",
  "The family reunion t-shirt was ruined by ____.",
  "The barbershop TV was stuck on ____.",
  "The barber said your hairline was ____.",
  "The cookout grill was full of ____.",
  "The cashapp request was for ____.",
  "The professor called on you in class and you ____.",
  "The HBCU homecoming court was so messy because ____.",
  "The hair appointment took 4 hours because ____.",
  "The mac and cheese had ____ in it.",
  "The DJ dropped ____ and the whole block went wild.",
  "The spades game got quiet when someone played ____.",
  "The fit was so clean it caused ____.",
  "The block captain issued a warning about ____.",
  "The corner bodega ran out of ____.",
  "The Sunday dinner argument started over ____."
];

const whiteResponses = [
  "unpaid parking tickets",
  "a bolo in the backseat",
  "texting at the stoplight",
  "the grandma who still cooks like it’s 1999",
  "a mixtape nobody asked for",
  "one uncle who brings his own cooler",
  "a server that only accepts Apple Pay",
  "the cousin who owes everybody money",
  "asking ‘you got a light?’ in 2026",
  "a blunt shaped like a baby bottle",
  "designer sweatpants at a gas station",
  "the club promoter with zero followers",
  "an argument over who makes the best mac & cheese",
  "a frozen pizza at 2AM",
  "a side door DJ set with no permit",
  "a TikTok that started the whole beef",
  "a blocked-off cul-de-sac",
  "a cop who knows your middle name",
  "a tailgate turned neighborhood meeting",
  "an auntie who drinks you under the table",
  "a 15-minute phone call about potato salad",
  "a bodega cat with a restraining order",
  "hot sauce in the purse",
  "edges laid with toothbrush and gorilla snot",
  "a durag under the graduation cap",
  "church fan with the funeral home logo",
  "crown royal bag full of quarters",
  "blue magic grease",
  "sweet tea with 4 cups of sugar",
  "freshly ironed Dickies suit",
  "gold teeth grill from the indoor swap meet",
  "spades table flip",
  "double-wrapped foil plate for later",
  "clippers with the guard missing",
  "stepping out in uncreased Air Force 1s"
];

// Format JSON arrays
const blackCode = `const BLACK_CARDS = ${JSON.stringify(blackScenarios, null, 2)};`;
const whiteCode = `const WHITE_CARDS = ${JSON.stringify(whiteResponses, null, 2)};`;

indexHtml = indexHtml.replace(/const BLACK_CARDS = \[[\s\S]*?\];/, blackCode);
indexHtml = indexHtml.replace(/const WHITE_CARDS = \[[\s\S]*?\];/, whiteCode);

fs.writeFileSync(indexPath, indexHtml);
console.log(`Updated index.html with ${blackScenarios.length} Black scenarios & ${whiteResponses.length} White responses.`);
