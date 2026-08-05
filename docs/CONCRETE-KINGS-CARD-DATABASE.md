# Concrete Kings — Master Card Database

### The definitive, deduplicated card pool for the shipped card game and the Griot Modernism RPG

---

## What This File Is

This is the single source of truth for every card in Concrete Kings. It replaces `CONTENT-AAVE-EXPANDED.md`, `CONTENT-HYPER-EXPANDED.md`, and `CONTENT-ULTRA-EXPANDED.md` as the card database — those three files were independent drafting passes that ended up overlapping heavily (the same scenario written two or three slightly different ways across files) and disagreeing with each other on final counts. They're left in place as drafting history, but **this file is what the app and the RPG should read from going forward.**

### How this database was built

The three source files were parsed and deduplicated in two passes: an exact-text pass, then a fuzzy pass that catches near-identical rewrites (tense swaps, "felt" vs "feel," minor rewording of the same joke) using word-overlap similarity. What's left is real, non-redundant content:

| Card Type | Raw lines across 3 source files | After dedup |
|---|---:|---:|
| Black Scenario Cards | 645 | **577** |
| White Response Cards | 650 | **539** |
| Receipt Cards | 220 | **130** |
| Cipher Cards | — | **12** (unchanged, already unique) |
| Origins | — | **8** (unchanged) |
| Hustles | — | **8** (unchanged) |
| Locations | — | **24** (merged from two source lists — see Section 4) |

A handful of very close near-twins survive on purpose (things like "the collection plate felt heavy" vs "feels heavy") — the similarity filter is tuned conservatively so it never merges two genuinely different scenarios. That's a feature, not a miss: false merges would silently delete real content, and a rare harmless echo in wording is a much smaller cost than that.

**One real bug got fixed along the way:** the "Block & Neighborhood" Receipt category in `CONTENT-HYPER-EXPANDED.md` (10 entries) turned out to be fill-in-the-blank scenario fragments mislabeled as Receipts — no Activate/Resolve mechanic, just a title and a dangling `____`. Rather than drop ten decent story hooks (Block Captain, Block Watch, Christmas lights, Easter egg hunt...), they were rebuilt from scratch with real mechanics. They're Chain 13, "The Block Beautification Committee," in the Receipt Chains section below.

### How White Card effects were assigned

Per the ruleset's Section 3.2 ("The Card as Action"), every White Card needs a hidden mechanical effect — that's what makes the card *be* the mechanic instead of just flavor text. With 539 White Cards, hand-authoring 539 bespoke effects would mean 539 essentially arbitrary numbers with no discoverable logic behind them.

Instead, effects are assigned by a transparent, deterministic system: **every card's category has a small table of plausible effects (stat bonus, resource gain, narrative twist, relationship effect, cipher modifier, or special), and the specific card's exact wording determines which one it gets.** Two consequences of that: the assignment never changes for a given card (reprint the deck and every card still does the same thing), and a Griot who learns the six effect-type families can predict roughly what any new card in a category will do without checking a master list — which is exactly the "learnable in five minutes" bar the ruleset sets for itself.

The full templates, organized by category, are visible directly on the cards below — there's no hidden table to cross-reference.

---

## Black Scenario Cards (577)

Prompts. Presented by the Griot or drawn from the deck — respond with a White Card. See ruleset Section 3.1 for how responses get judged.

### Church & Spirituality (43)

1. The new luxury building opened across the street and ____
2. Your cousin who owe you shows up at the cookout with ____
3. The police pulled you over for ____
4. At the family reunion, Auntie asked why you still ____
5. The barber cut your line and then said ____
6. You walked into the cookout and heard ____
7. The church lady side-eyed you because ____
8. Your mama found your report card and said ____
9. The DJ stopped the music because ____
10. The neighbor called the cops on the kids for ____
11. You got to the family reunion and realized ____
12. The landlord raised the rent and said ____
13. At the beauty shop, they was talking about ____
14. Your homie just got a new car and said ____
15. You walked into the Sunday service and ____
16. The teacher called your mama and said ____
17. The bodega owner gave you free ____
18. You tried to explain your side hustle and Uncle said ____
19. The police officer asked for ____
20. At the block party, someone brought ____
21. Your auntie said you look like you been ____
22. The choir director said you can't sing ____
23. You tried to pay with Apple Pay at the corner store and ____
24. The family group chat went crazy because ____
25. At the cookout, the mac and cheese was ____
26. Your grandma said back in her day ____
27. The church parking lot look like ____
28. Your baby mama said she need ____
29. You told your mama you got a promotion and she said ____
30. The security guard followed you around the store for ____
31. The usher said you can't sit in ____
32. The choir robe had ____
33. The deacon said ____
34. The missionary society served ____
35. The church van broke down on ____
36. The pastor's wife said ____
37. The church secretary said ____
38. The Sunday school lesson was really about ____
39. The revival started because ____
40. The church anniversary was so extra ____
41. The pastor said he had a word for ____
42. The church council meeting lasted ____
43. The usher board uniform was ____

### Family & Generations (55)

44. At the reunion, they made you sit at the ____
45. The DJ played that one song and ____
46. Your uncle said you need to ____
47. The pastor said we need to ____
48. You tried to park at the church and ____
49. The beauty shop appointment took 6 hours because ____
50. Your cousin tried to sell you ____
51. The school resource officer said ____
52. You got to the cookout late and the ____
53. The landlord said pets ain't allowed but ____
54. Your mama called your full name and you knew ____
55. At the family reunion, the oldest cousin said ____
56. The block party had to end because ____
57. You tried to explain your art to your grandma and ____
58. The barber said you need to ____
59. The church usher said you can't sit ____
60. Your side hustle got shut down because ____
61. The bodega ran out of your favorite ____
62. At the cookout, someone started talking about ____
63. The police showed up at the party because ____
64. Your little cousin just got accepted to ____
65. The HOA said you can't ____
66. The neighborhood watch posted about ____
67. You overheard the barbers say ____
68. The church announcement was really just ____
69. The new family moving in brought ____
70. The school board just voted to ____
71. The corner store started selling ____
72. Your mama's friend said you look just like ____
73. The city council want to turn the park into ____
74. Your grandaddy saw your tattoo and said ____
75. The family reunion had a____
76. Your cousin's baby turned 1 and ____
77. The church fundraiser was really just ____
78. Your mama's friend tried to set you up on a date with ____
79. The old lady on the porch waved at you and ____
80. Your little brother got suspended for ____
81. The barbershop started charging for ____
82. The church choir wore ____
83. Your cousin graduated and ____
84. The family reunion committee assigned you to ____
85. The family reunion t-shirt was ____
86. The family reunion beef started over ____
87. The family reunion pageant was ____
88. The family reunion talent show was ____
89. The family reunion family tree poster was ____
90. The family reunion picnic was ruined by ____
91. The family reunion group photo took ____
92. The family reunion award went to ____
93. The family reunion guest book had ____
94. The family reunion memory table had ____
95. The family reunion DJ played ____
96. The family reunion game was ____
97. The family reunion food line was ____
98. The family reunion was held at ____

### The Cookout & Food (43)

99. The cookout grill was ____
100. The cookout cooler was full of ____
101. The cookout playlist was all ____
102. The cookout folding chair was ____
103. The cookout bug spray was ____
104. The cookout paper plates were ____
105. The cookout cooler had too much ____
106. The cookout DJ was playing ____
107. The cookout game was cornhole and ____
108. The cookout water gun fight was ____
109. The cookout fireworks were ____
110. The cookout dessert table was ____
111. The cookout serving line was ____
112. The cookout napkins had ____
113. The cookout leftovers were gone because ____
114. The gumbo was missing ____
115. The jambalaya was too ____
116. The étouffée was ____
117. The red beans and rice was ____
118. The dirty rice was ____
119. The gumbo file was ____
120. The roux was too ____
121. The holy trinity was missing ____
122. The andouille sausage was ____
123. The crawfish boil was ____
124. The shrimp and grits was ____
125. The catfish was ____
126. The fried catfish was ____
127. The blackened fish was ____
128. The seafood boil was ____
129. The cornbread was too ____
130. The collard greens needed ____
131. The mac and cheese had ____
132. The peach cobbler crust was ____
133. The sweet tea was too ____
134. The potato salad had ____
135. The fried chicken was too ____
136. The catfish was missing ____
137. The banana pudding had ____
138. The pound cake was too ____
139. The candied yams needed ____
140. The spoon bread was ____
141. The hot water cornbread was ____

### Barbershop & Beauty Shop (30)

142. The barbershop TV was stuck on ____
143. The beauty shop fan was too loud
144. The barber said your hairline was ____
145. The stylist said your part was ____
146. The shop owner raised prices during ____
147. The shop radio was playing ____
148. The barbershop cup was stained with ____
149. The beauty shop mirror was ____
150. The shop appointment book was full of ____
151. The barbershop bathroom was ____
152. The beauty shop waiting room had ____
153. The shop owner said they closing early for ____
154. The barbershop light was too bright
155. The beauty shop chair was broken for ____
156. The shop air freshener smelled like ____
157. The stylist said your hair was ____
158. The beauty supply store was out of ____
159. The hair appointment took 4 hours because ____
160. The relaxer touched your scalp and ____
161. The wig was not what you ordered
162. The lace front started lifting in the middle of ____
163. The sew-in was so tight you couldn't ____
164. The Deep Condition treatment turned into ____
165. The hair salon played the best ____
166. The stylist said you needed ____
167. The baby hairs were not laying ____
168. The twist-out shrank 70% because ____
169. The hair journey has been ____
170. The edges were not laying ____
171. The hair appointment cost more than ____

### The Block & Neighborhood (29)

172. The block captain said ____
173. The block meeting was at ____
174. The block newsletter said ____
175. The block party application was ____
176. The block Christmas decorations were ____
177. The block Halloween decorations were ____
178. The block clean-up day was ____
179. The block watch meeting was at ____
180. The block social media group was ____
181. The block newsletter writer was ____
182. The block holiday card had ____
183. The block easter egg hunt was ____
184. The block summer program was ____
185. The block block party was ____
186. The block had a ____
187. The street had a ____
188. The alley had ____
189. The staircase had ____
190. The hallway had ____
191. The roof had ____
192. The basement had ____
193. The backyard had ____
194. The front yard had ____
195. The driveway had ____
196. The garage had ____
197. The porch had ____
198. The window had ____
199. The door had ____
200. The fence had ____

### Money, Hustle & Work (72)

201. Your boss said we gotta ____
202. The IRS said they auditing ____
203. Your client said the work was ____
204. The bank denied your loan because ____
205. Your side hustle got more attention than ____
206. The coworker who take credit for your work just ____
207. Your rent went up but your salary ____
208. The gig economy said you ain't ____
209. Your business partner ghosted right before ____
210. You tried to get a loan for ____
211. The client said they want it ____
212. Your boss said you need to ____
213. The company laid off ____
214. Your side hustle made more than ____
215. The bank said your credit ____
216. Your friend asked for a loan and you said ____
217. The job market said you overqualified for ____
218. Your car note is more than ____
219. The IRS sent a letter saying ____
220. Your freelance gig turned into ____
221. The corporation said they values diversity but ____
222. Your landlord said they selling the building to ____
223. The startup said we disrupting ____
224. Your paycheck came and ____
225. The gig app said your rating ____
226. Your boss said we pivoting to ____
227. The client said they want to pick your brain for ____
228. Your savings account look like ____
229. The cashapp request was for ____
230. The Venmo request was for ____
231. The side hustle logo was ____
232. The business card was ____
233. The website was built on ____
234. The invoice was never paid because ____
235. The tax refund was spent on ____
236. The stimulus check went to ____
237. The insurance claim was denied for ____
238. The credit score was ____
239. The investment club was really just ____
240. The savings goal was destroyed by ____
241. The retirement account was ____
242. The financial advisor said you should ____
243. The budget was thrown out because ____
244. The Monday morning meeting was about ____
245. The Friday afternoon meeting was ____
246. The office fridge had ____
247. The office coffee was ____
248. The office printer was ____
249. The office bathroom was ____
250. The office parking was ____
251. The office holiday party was ____
252. The office secret Santa was ____
253. The office birthday cake was ____
254. The office potluck was ____
255. The office birthday card was ____
256. The office retirement party was ____
257. The office baby shower was ____
258. The office farewell party was ____
259. The promotion went to ____
260. The performance review said you ____
261. The company picnic was really just ____
262. The diversity training was ____
263. The HR meeting was about ____
264. The team building exercise was ____
265. The office party got weird when ____
266. The conference call was dominated by ____
267. The email you sent got forwarded to ____
268. The presentation went wrong when ____
269. The networking event was really just ____
270. The mentorship program assigned you ____
271. The salary negotiation went south when ____
272. The company holiday party ended when ____

### Music, Art & Culture (39)

273. The DJ played ____
274. The producer sampled ____
275. The mural on the block got ____
276. The poet said ____
277. The fashion trend started on ____
278. The documentary showed ____
279. The song that get every auntie on the dance floor is ____
280. The mixtape that defined the summer was ____
281. The concert was at ____
282. The art show had ____
283. The record store had ____
284. The vinyl collection was missing ____
285. The cassette tape was ____
286. The CD collection was ____
287. The MP3 player was loaded with ____
288. The streaming playlist was all ____
289. The concert ticket was bought from ____
290. The merchandise was ____
291. The music video was filmed at ____
292. The album release party was at ____
293. The radio station played ____
294. The DJ set was all ____
295. The sound clash was between ____
296. The beat tape was named ____
297. The producer tag was ____
298. The DJ dropped ____
299. The sound system was ____
300. The beat dropped and ____
301. The cypher turned into ____
302. The dance battle ended when ____
303. The singer forgot the words and ____
304. The mixtape was so fire it ____
305. The concert was so lit that ____
306. The dance challenge broke ____
307. The singer said they wrote that song about ____
308. The producer said that beat was ____
309. The DJ switched genres and ____
310. The crowd went crazy when ____
311. The performance was so good ____

### Police, Politics & The System (7)

312. The cop said you match the description of ____
313. The landlord said ____
314. The police report said ____
315. The DA said they dropping ____
316. The judge said you got ____
317. The ICE agent asked for ____
318. The politician said they gonna fix ____

### Romance, Dating & Relationships (14)

319. You ran into your ex at ____
320. Your new partner said they don't like ____
321. The family reunion introduced you to ____
322. Your partner's mama said ____
323. The text you sent got read but ____
324. Your ex liked your photo from ____
325. The first date ended when ____
326. Your partner said you need to ____
327. The Valentine's Day gift was ____
328. The breakup text was ____
329. The rebound turned into ____
330. The love letter from your mama was actually ____
331. The relationship status changed to ____
332. The engagement announcement came with ____

### Tech, Social Media & Modern Life (40)

333. The TikTok algorithm said you need ____
334. Your phone battery died right when ____
335. The Instagram algorithm showed you ____
336. The group chat went from 0 to 100 because ____
337. Your cousin posted your business on ____
338. The WiFi went out right during ____
339. Your phone screen cracked but you still using it
340. The streaming service password got changed and ____
341. Your AirPods died mid ____
342. The group chat got to 200+ messages and it's all ____
343. Your mama joined TikTok and ____
344. The Instagram caption was ____
345. The TikTok sound was ____
346. The Twitter/X thread was about ____
347. The Facebook post was shared by ____
348. The Snapchat story was ____
349. The YouTube comment was ____
350. The TikTok live was interrupted by ____
351. The Instagram live was ____
352. The Twitter/X Spaces was ____
353. The TikTok duet was with ____
354. The Instagram reel was about ____
355. The Facebook status was ____
356. The Snapchat streak was broken because ____
357. The TikTok stitch was ____
358. The Instagram story highlight was ____
359. The Instagram influencer said ____
360. The Twitter/X thread went viral because ____
361. The Facebook group was pure chaos over ____
362. The YouTube comment section was ____
363. The TikTok sound got overused by ____
364. The Instagram story was really just ____
365. The Twitter beef was started by ____
366. The TikTok trend was ____
367. The podcast episode was so real it ____
368. The blog post said ____
369. The meme page said ____
370. The Discord server was toxic because ____
371. The Reddit thread said ____
372. The email newsletter was really just ____

### Health, Wellness & Self-Care (27)

373. The doctor's office waiting room was ____
374. The prescription was too expensive so ____
375. The hospital food was ____
376. The therapist's office was ____
377. The gym was too ____
378. The yoga mat was ____
379. The meditation app said ____
380. The mental health day turned into ____
381. The doctor's bill was ____
382. The ambulance bill was ____
383. The pharmacy was out of ____
384. The specialist appointment was in ____
385. The emergency room wait was ____
386. The mental health diagnosis was ____
387. The therapist said you need to ____
388. The doctor didn't believe your ____
389. The gym membership expired before ____
390. The yoga class was too ____
391. The therapist said "have you tried ____"
392. The hospital bill was more than ____
393. The self-care routine fell apart when ____
394. The doctor asked where you're "really from" again
395. The mental health check-in was overdue because ____
396. The meditation app couldn't handle ____
397. The wellness retreat was really just ____
398. The therapist finally understood ____
399. The support group was full of ____

### Education & Youth (37)

400. The principal said you got ____
401. The school didn't have no ____
402. Your guidance counselor said you should ____
403. Your teacher said you should consider ____
404. The classmate said you got ____
405. The professor said your paper was ____
406. The PTA meeting was really about ____
407. The school lunch was ____
408. The school bathroom was ____
409. The school hallway was ____
410. The school lunch lady said ____
411. The school nurse said ____
412. The school counselor said you should ____
413. The school dance was ____
414. The school play was ____
415. The school sports team was ____
416. The school newspaper said ____
417. The school yearbook was ____
418. The school detention was ____
419. The school suspension was for ____
420. The school expulsion was for ____
421. The school graduation was ____
422. The professor called on you in class and you ____
423. The HBCU homecoming court was so messy because ____
424. The yard show got cut short because ____
425. The marching band director said you ____
426. The professor said your essay was ____
427. The student government association impeached ____
428. The fraternity stepped to you because ____
429. The sorority said you can't ____
430. The homecoming ticket scalper said ____
431. The campus police stopped you for ____
432. The cafeteria ran out of ____
433. The dorm room inspection found ____
434. The professor gave you an extension because ____
435. The career center said you should ____
436. The alumni mixer was really just ____

### Sports, Gaming & Competition (15)

437. The basketball game got heated when ____
438. The FIFA tournament ended because ____
439. The Madden game got so intense ____
440. The streetball game had ____
441. The chess match turned into ____
442. The card game argument started because ____
443. The dominoes game got quiet when ____
444. The spades game was rigged because ____
445. The wrestling match in the living room ended when ____
446. The video game lobby was toxic because ____
447. The flag football game had ____
448. The boxing match was over when ____
449. The poker face wasn't strong enough for ____
450. The video game character was OP because ____
451. The sports team lost because ____

### Fashion, Fit & Style (15)

452. The fit was so clean it ____
453. The shoes were so fresh they ____
454. The hair was laid but ____
455. The jacket was vintage from ____
456. The outfit was borrowed from ____
457. The accessories were all from ____
458. The sneakers were limited edition from ____
459. The hat was from ____
460. The bag was counterfeit but ____
461. The fit was inspired by ____
462. The hair was done by ____
463. The makeup was beat by ____
464. The nails were done at ____
465. The outfit was thrifted from ____
466. The style was copied from ____

### Travel, Place & Belonging (29)

467. The road trip playlist was all ____
468. The hotel breakfast was ____
469. The Airbnb host was ____
470. The rental car had ____
471. The gas station was in ____
472. The rest stop was ____
473. The hotel room had ____
474. The resort fee was ____
475. The vacation rental was ____
476. The Airbnb was in ____
477. The hotel check-in was ____
478. The hotel checkout was ____
479. The flight was delayed because ____
480. The TSA line was ____
481. The baggage claim was ____
482. The trip back South felt like ____
483. The vacation where you were the only ____
484. The hotel wouldn't rent you a room because ____
485. The Airbnb was nothing like ____
486. The resort treated you like ____
487. The rental car broke down in ____
488. The road trip stopped at every ____
489. The city felt like home because ____
490. The restaurant owner treated you like ____
491. The beach had too many ____
492. The cruise was bougie but ____
493. The hotel upgraded you because ____
494. The trip turned into a family reunion because ____
495. The journey changed your perspective on ____

### Diaspora & Caribbean (13)

496. The Jamaican auntie said ____
497. The Nigerian uncle brought ____
498. The Ethiopian restaurant served ____
499. The Ghanaian grandma said ____
500. The Trinidadian carnival was ____
501. The Ethiopian coffee ceremony was ____
502. The Somali family said ____
503. The Ghanaian kente cloth was ____
504. The Jamaican patty was ____
505. The Nigerian jollof rice was ____
506. The Haitian soup joumou was ____
507. The Ethiopian injera was ____
508. The Trinidadian doubles was ____

### Black Joy & Celebration (13)

509. The Juneteenth cookout had ____
510. The Kwanzaa celebration included ____
511. The homecoming weekend was ____
512. The block party featured ____
513. The graduation party had ____
514. The baby shower was so extra ____
515. The birthday party was themed ____
516. The holiday dinner had ____
517. The New Year's Eve celebration was ____
518. The Easter Sunday service was ____
519. The Mother's Day brunch was ____
520. The Father's Day barbecue was ____
521. The anniversary celebration was ____

### Generational Dynamics (14)

522. Mama said you act like ____
523. Uncle said "these kids today" ____
524. The 10-year-old said ____
525. The 80-year-old said ____
526. The 30-year-old tried to explain ____
527. The 60-year-old said they remember ____
528. The 20-year-old said ____
529. The 70-year-old said "y'all don't know ____"
530. The 40-year-old said "I'm too old for ____"
531. The 50-year-old said ____
532. The 15-year-old said ____
533. The 25-year-old said ____
534. The 90-year-old said ____
535. The 35-year-old said ____

### Universal & Everyday (42)

536. The new coffee shop on the block charge $7 for ____
537. Your landlord said they converting the building to ____
538. The city said they fixing the park but ____
539. The block got a new ____
540. Your cousin just got back from ____
541. The bodega started selling ____
542. The church started doing ____
543. The block party got shut down because ____
544. The choir practice went 3 hours because ____
545. The church parking lot looked like ____
546. The beauty shop appointment ran over because ____
547. The family group chat went viral because ____
548. The cookout was almost ruined by ____
549. The block party was saved by ____
550. The landlord tried to evict everybody for ____
551. The police brutality protest turned into ____
552. The Juneteenth celebration featured ____
553. The Black History Month program highlighted ____
554. The Kwanzaa ceremony included ____
555. The MLK Day service was interrupted by ____
556. The NAACP meeting was packed because ____
557. The Black Lives Matter march passed through ____
558. The reparations town hall was ____
559. The Black voter registration drive was ____
560. The community land trust meeting was ____
561. The police reform proposal was ____
562. The HBCU homecoming was ____
563. The Black business expo featured ____
564. The Black film festival screened ____
565. The Black bookstore reading was ____
566. The Black art gallery opening was ____
567. The Black tech meetup was ____
568. The Black wellness summit was ____
569. The Black music festival was ____
570. The Black food festival featured ____
571. The Black fashion show was ____
572. The Black comedy show was ____
573. The Black poetry slam was ____
574. The Black dance showcase was ____
575. The Black theater performance was ____
576. The Black history tour stopped at ____
577. The Black museum exhibit was ____

## White Response Cards (539)

Responses. Every card's mechanical effect is printed right on it — see "How White Card effects were assigned" above for the system behind the assignment.

### Church & Spirituality (35)

1. a sermon that called you out personally — *Effect: Narrative Twist: the pastor calls on you by name*
2. the usher who checked your fit — *Effect: Narrative Twist: the pastor calls on you by name*
3. a choir robe with mysterious stains — *Effect: +2 Reputation this round*
4. a deacon who texting during service — *Effect: Relationship Effect: +1 alliance with a Church contact*
5. a prayer request that was really just tea — *Effect: Narrative Twist: the pastor calls on you by name*
6. the altar call that never end — *Effect: Narrative Twist: the pastor calls on you by name*
7. a pew you've sat in since childhood — *Effect: Relationship Effect: +1 alliance with a Church contact*
8. a pastor who preach like he at a rally — *Effect: Narrative Twist: the pastor calls on you by name*
9. a collection plate that feel heavy — *Effect: Resource Gain: +1 Receipt*
10. the church lady who pray loudest — *Effect: +1 Community*
11. a testimony that went too long — *Effect: Resource Gain: +1 Receipt*
12. the sound system that cut out at the best part — *Effect: Resource Gain: +1 Receipt*
13. a youth pastor who try too hard — *Effect: Resource Gain: +1 Receipt*
14. a missionary trip that changed everything — *Effect: Relationship Effect: +1 alliance with a Church contact*
15. a baptism where somebody fell in — *Effect: +1 Community*
16. a Sunday school lesson that hit different — *Effect: +1 Community*
17. a choir director who run a tight ship — *Effect: Relationship Effect: +1 alliance with a Church contact*
18. a revival that lasted until 2am — *Effect: +2 Reputation this round*
19. a church lady who know everybody's business — *Effect: +1 Community*
20. a tithing check that broke the budget — *Effect: Resource Gain: +1 Receipt*
21. a church announcement that was just shade — *Effect: +1 Community*
22. a revival that started on Tuesday and didn't end until Sunday — *Effect: Narrative Twist: the pastor calls on you by name*
23. a choir robe that smell like 20 years of Sunday mornings — *Effect: +1 Community*
24. a deacon who got caught doing the very thing he preached against — *Effect: Resource Gain: +1 Receipt*
25. a prayer that turned into a full sermon — *Effect: Relationship Effect: +1 alliance with a Church contact*
26. a collection plate that felt heavy — *Effect: +1 Community*
27. a pew argument that lasted through the whole service — *Effect: +2 Reputation this round*
28. a testimony that was really just a brag — *Effect: Relationship Effect: +1 alliance with a Church contact*
29. a baptism where the pastor forgot your name — *Effect: +1 Community*
30. a church lady who prayed for you publicly and it felt like a read — *Effect: Resource Gain: +1 Receipt*
31. a youth pastor who tried to relate and failed — *Effect: +1 Community*
32. a missionary trip that changed the missionary more than the people — *Effect: Narrative Twist: the pastor calls on you by name*
33. a church parking lot showdown over a parking spot — *Effect: Relationship Effect: +1 alliance with a Church contact*
34. a church fundraiser that was really just a loan with interest — *Effect: Narrative Twist: the pastor calls on you by name*
35. a church anniversary that was more about the food than the faith — *Effect: Relationship Effect: +1 alliance with a Church contact*

### Family & Generations (25)

36. a grandma who discipline everybody's kids — *Effect: Relationship Effect: −1 beef with a family member*
37. an uncle who tell the same story every year — *Effect: Narrative Twist: Grandma's watching*
38. a cousin who post the family business on TikTok — *Effect: +1 Community*
39. a mama who call your full name from three blocks away — *Effect: +1 Community*
40. a grandaddy who say "back in my day" — *Effect: Relationship Effect: −1 beef with a family member*
41. a family reunion beef from 2003 that still going — *Effect: Relationship Effect: −1 beef with a family member*
42. a baby shower where everybody give advice — *Effect: Relationship Effect: −1 beef with a family member*
43. a cousin who always have the best music — *Effect: +1 Community*
44. a mama who won't let you live it down — *Effect: Relationship Effect: −1 beef with a family member*
45. a grandparent who feed you like you starving — *Effect: Narrative Twist: Grandma's watching*
46. a family group chat that never sleep — *Effect: +1 Community*
47. a cousin who show up unannounced and stay 3 days — *Effect: Narrative Twist: Grandma's watching*
48. a grandma who got a garden and a spirit to match — *Effect: +2 Community at The House*
49. aunties who judge your fit without saying a word — *Effect: +2 Community at The House*
50. a family secret that everybody know except you — *Effect: +2 Community at The House*
51. a baby picture that still get roasted at dinner — *Effect: Resource Gain: +1 Receipt*
52. a cousin who is really your sibling — *Effect: +1 Community*
53. a grandparent who give the best advice — *Effect: Resource Gain: +1 Receipt*
54. a family member who bring the most drama — *Effect: Narrative Twist: Grandma's watching*
55. a cousin who grew up to look just like their mama — *Effect: Relationship Effect: −1 beef with a family member*
56. a family member who brings a dish that nobody asked for — *Effect: Resource Gain: +1 Receipt*
57. a cousin who makes the best TikTok dances — *Effect: +1 Community*
58. a grandparent who still working at 80 — *Effect: Resource Gain: +1 Receipt*
59. a family that shows up when it matters most — *Effect: Resource Gain: +1 Receipt*
60. a cousin who got banned from the family reunion — *Effect: Relationship Effect: −1 beef with a family member*

### The Cookout & Food (48)

61. a potato salad that sparked a family war — *Effect: Resource Gain: +1 item (a to-go plate)*
62. the mac and cheese that disappeared in 2 minutes — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
63. an uncle who brought the wrong dish on purpose — *Effect: Resource Gain: +1 item (a to-go plate)*
64. a burnt barbecue and everybody pretending it's fine — *Effect: Resource Gain: +$25 cash*
65. the potato salad that started the beef — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
66. a plate so full you can barely hold it — *Effect: +2 Community this round*
67. the last piece of peach cobbler — *Effect: +2 Community this round*
68. a sauce recipe that nobody allowed to know — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
69. a grill master who won't accept help — *Effect: Narrative Twist: the Grill Master takes notice of you*
70. a dish that taste like childhood — *Effect: +2 Community this round*
71. the collard greens that take all day — *Effect: +2 Community this round*
72. a soda stolen from the cooler — *Effect: Resource Gain: +$25 cash*
73. a cousin who bring store-bought and lie about it — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
74. the ice cream that melt before you get to the car — *Effect: Narrative Twist: the Grill Master takes notice of you*
75. a pot that feed the whole block — *Effect: Resource Gain: +$25 cash*
76. the baked chicken that need to be passed down — *Effect: Resource Gain: +$25 cash*
77. a plate with no meat but still good — *Effect: +2 Community this round*
78. the last sweet tea in the pitcher — *Effect: +2 Community this round*
79. a dish so good the church ladies take notes — *Effect: Resource Gain: +1 item (a to-go plate)*
80. a grill that feed three generations — *Effect: Resource Gain: +$25 cash*
81. a potato salad with a secret ingredient that nobody can identify — *Effect: +2 Community this round*
82. a mac and cheese so creamy it started a movement — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
83. an uncle who showed up with nothing but a bag of chips — *Effect: Resource Gain: +$25 cash*
84. a barbecue that got rained on but nobody left — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
85. a peach cobbler that had more crust than fruit — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
86. a grill master who wouldn't accept help — *Effect: Resource Gain: +1 item (a to-go plate)*
87. a potato salad that started a family war — *Effect: Resource Gain: +$25 cash*
88. a dish that tasted like childhood — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
89. a cousin who brought store-bought and lied about it — *Effect: +2 Community this round*
90. a ice cream that melted before you got to the car — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
91. a pot that fed the whole block — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
92. a baked chicken that needed to be passed down — *Effect: Narrative Twist: the Grill Master takes notice of you*
93. a grill that fed three generations — *Effect: Resource Gain: +1 item (a to-go plate)*
94. a gumbo that was missing the filé — *Effect: Resource Gain: +1 item (a to-go plate)*
95. a cornbread that was too sweet — *Effect: +2 Community this round*
96. a mac and cheese that had no crust — *Effect: Resource Gain: +$25 cash*
97. a collard greens that needed more seasoning — *Effect: Narrative Twist: the Grill Master takes notice of you*
98. a peach cobbler that was mostly juice — *Effect: +2 Community this round*
99. a sweet tea that was too strong — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
100. a potato salad that had no mustard — *Effect: +1 Community, +1 Street Cred at Cookout Spot*
101. a fried chicken that was too greasy — *Effect: Resource Gain: +1 item (a to-go plate)*
102. a catfish that was missing the cornmeal — *Effect: +2 Community this round*
103. a red beans and rice that needed more spice — *Effect: +2 Community this round*
104. a banana pudding that had no wafers — *Effect: Resource Gain: +$25 cash*
105. a pound cake that was too dry — *Effect: +2 Community this round*
106. a candied yams that were too mushy — *Effect: Resource Gain: +1 item (a to-go plate)*
107. a spoon bread that was too firm — *Effect: Resource Gain: +1 item (a to-go plate)*
108. a hot water cornbread that was perfect — *Effect: +1 Community, +1 Street Cred at Cookout Spot*

### Barbershop & Beauty Shop (45)

109. a fade that took 3 hours and still not even — *Effect: +1 Wisdom*
110. a chair that been occupied since 1998 — *Effect: Narrative Twist: a secret gets revealed about an NPC*
111. a stylist who won't stop talking — *Effect: +2 Wisdom at Barbershop/Beauty Shop*
112. edges so laid they could cut glass — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
113. a price list that change depending on the day — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
114. a shop radio playing nothing but oldies — *Effect: Special: Peek — see one card in another player’s hand*
115. a relaxer that burned but you won't complain — *Effect: Special: Peek — see one card in another player’s hand*
116. a line that wrap around the building — *Effect: Narrative Twist: a secret gets revealed about an NPC*
117. a shop that double as therapy — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
118. a barber who give life advice with every cut — *Effect: +2 Wisdom at Barbershop/Beauty Shop*
119. a Deep Condition treatment that take all afternoon — *Effect: Special: Peek — see one card in another player’s hand*
120. a shop owner who know your whole story — *Effect: Narrative Twist: a secret gets revealed about an NPC*
121. a knot that took 20 minutes to detangle — *Effect: +1 Wisdom*
122. a shop that's closed every other Tuesday — *Effect: Narrative Twist: a secret gets revealed about an NPC*
123. an appointment that started 2 hours late — *Effect: +2 Wisdom at Barbershop/Beauty Shop*
124. a hairdo that lasted through the whole reunion — *Effect: Narrative Twist: a secret gets revealed about an NPC*
125. a shop that play the best music — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
126. a stylist who won't let you leave until it's perfect — *Effect: Special: Peek — see one card in another player’s hand*
127. a conversation that should've stayed in the chair — *Effect: +2 Wisdom at Barbershop/Beauty Shop*
128. a shop that feel like family — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
129. a silk press that lasted through the whole humidity — *Effect: +2 Wisdom at Barbershop/Beauty Shop*
130. a barber who knows your hair better than your mama — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
131. a beauty shop that doubles as a safe space — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
132. a stylist who charged you $5 extra because you asked for the "good chair" — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
133. a shop owner who let you cry in the chair and didn't ask questions — *Effect: +2 Wisdom at Barbershop/Beauty Shop*
134. a fade that took 3 hours and still wasn't even — *Effect: +1 Wisdom*
135. a stylist who wouldn't stop talking — *Effect: Narrative Twist: a secret gets revealed about an NPC*
136. a price list that changed depending on the day — *Effect: +1 Wisdom*
137. a relaxer that burned but you wouldn't complain — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
138. a line that wrapped around the building — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
139. a shop that doubled as therapy — *Effect: Special: Peek — see one card in another player’s hand*
140. a Deep Condition treatment that took all afternoon — *Effect: Narrative Twist: a secret gets revealed about an NPC*
141. a shop owner who knew your whole story — *Effect: +2 Wisdom at Barbershop/Beauty Shop*
142. a stylist who wouldn't let you leave until it was perfect — *Effect: +1 Wisdom*
143. a stylist who gave you life advice with every cut — *Effect: Narrative Twist: a secret gets revealed about an NPC*
144. a beauty supply store that had everything you needed — *Effect: +1 Wisdom*
145. a wig that looked so real nobody knew — *Effect: +1 Wisdom*
146. a lace front that stayed laid through the humidity — *Effect: +1 Wisdom*
147. a sew-in that lasted 3 months — *Effect: +2 Wisdom at Barbershop/Beauty Shop*
148. a silk press that survived the rain — *Effect: Special: Peek — see one card in another player’s hand*
149. a braider who could do anything — *Effect: Narrative Twist: a secret gets revealed about an NPC*
150. a hair journey that took 5 years — *Effect: Narrative Twist: a secret gets revealed about an NPC*
151. a big chop that felt like freedom — *Effect: Relationship Effect: +1 ally (the barber/stylist)*
152. a protective style that saved your edges — *Effect: +2 Wisdom at Barbershop/Beauty Shop*
153. a hair appointment that cost more than your car note — *Effect: Narrative Twist: a secret gets revealed about an NPC*

### The Block & Neighborhood (25)

154. a corner store owner who know your order — *Effect: Narrative Twist: the block is watching*
155. a basketball court with no net and maximum trash talk — *Effect: Resource Gain: +1 item*
156. a porch that been the neighborhood headquarters for 40 years — *Effect: +2 Street Cred*
157. a block party that got shut down by the police — *Effect: +2 Street Cred*
158. a neighbor who watch everything from their window — *Effect: +2 Street Cred*
159. a vacant lot that should be a park — *Effect: Narrative Twist: the block is watching*
160. a streetlight that never work — *Effect: +1 Street Cred, +1 Community at The Corner*
161. a basketball game that lasted until 2am — *Effect: Resource Gain: +1 item*
162. a neighborhood watch that know everybody's business — *Effect: Resource Gain: +1 item*
163. a porch that always open to the right people — *Effect: Narrative Twist: the block is watching*
164. a corner store with the best snacks — *Effect: Cipher Modifier: next Cipher is Block Watch*
165. a street that always under construction — *Effect: +2 Street Cred*
166. a neighborhood that changing too fast — *Effect: +1 Street Cred, +1 Community at The Corner*
167. a block that feel like a family — *Effect: Narrative Twist: the block is watching*
168. a street that's named after somebody important — *Effect: Resource Gain: +1 item*
169. a park where the elders play dominoes — *Effect: Resource Gain: +1 item*
170. a corner where the music never stop — *Effect: Narrative Twist: the block is watching*
171. a house where everybody gather for the holidays — *Effect: +1 Street Cred, +1 Community at The Corner*
172. a block with the best holiday decorations — *Effect: +1 Street Cred, +1 Community at The Corner*
173. a neighborhood where everybody know your name — *Effect: +1 Street Cred, +1 Community at The Corner*
174. a neighbor who brings you leftovers every Sunday — *Effect: +2 Street Cred*
175. a porch where the elders sit and judge everybody — *Effect: Resource Gain: +1 item*
176. a block that got together to fix the playground — *Effect: Cipher Modifier: next Cipher is Block Watch*
177. a neighborhood that fought the city and won — *Effect: +2 Street Cred*
178. a block that got a new streetlight after 10 years — *Effect: Resource Gain: +1 item*

### Money, Hustle & Work (42)

179. a side hustle that almost made you quit your job — *Effect: Narrative Twist: the hustle almost got you caught*
180. a boss who don't respect your time — *Effect: Resource Gain: +1 item, +$25 cash*
181. a freelance gig that paid in exposure — *Effect: Narrative Twist: the hustle almost got you caught*
182. a car note that eating you alive — *Effect: Resource Gain: +$50 cash*
183. a business idea that everybody laughed at — *Effect: +2 Street Cred this round*
184. a promotion that should've came 6 months ago — *Effect: Special: convert 1 Community to 2 Street Cred*
185. a coworker who take credit for your work — *Effect: Special: convert 1 Community to 2 Street Cred*
186. a side hustle that started in the living room — *Effect: Resource Gain: +$50 cash*
187. a bank loan that never came through — *Effect: Resource Gain: +1 item, +$25 cash*
188. a client who want the world for $50 — *Effect: Resource Gain: +$50 cash*
189. a hustle that grew faster than expected — *Effect: +2 Street Cred this round*
190. a business partner who ghosted — *Effect: +2 Street Cred this round*
191. a rent increase that made no sense — *Effect: Narrative Twist: the hustle almost got you caught*
192. a savings account that's more of a wish — *Effect: +2 Street Cred this round*
193. a job interview where they asked where you "really from" — *Effect: Narrative Twist: the hustle almost got you caught*
194. a side hustle that take over your whole life — *Effect: Special: convert 1 Community to 2 Street Cred*
195. a tip that saved the week — *Effect: Special: convert 1 Community to 2 Street Cred*
196. a commission check that came at the perfect time — *Effect: Narrative Twist: the hustle almost got you caught*
197. a business that started in a garage and now got a storefront — *Effect: Narrative Twist: the hustle almost got you caught*
198. a client who became family — *Effect: Resource Gain: +$50 cash*
199. a boss who said "we're a family" but didn't pay overtime — *Effect: +2 Street Cred this round*
200. a coworker who got promoted over you — *Effect: Resource Gain: +1 item, +$25 cash*
201. a side hustle that got shut down by the city — *Effect: Special: convert 1 Community to 2 Street Cred*
202. a business license that took 6 months to get — *Effect: Resource Gain: +$50 cash*
203. a bank that said you don't have enough credit — *Effect: +2 Street Cred this round*
204. a boss who didn't respect your time — *Effect: Special: convert 1 Community to 2 Street Cred*
205. a coworker who took credit for your work — *Effect: Resource Gain: +1 item, +$25 cash*
206. a client who wanted the world for $50 — *Effect: Resource Gain: +$50 cash*
207. a promotion that went to the person who asked — *Effect: Resource Gain: +1 item, +$25 cash*
208. a performance review that said you need to "be more vocal" — *Effect: +2 Street Cred this round*
209. a company picnic that was really just a team building exercise — *Effect: Resource Gain: +$50 cash*
210. a diversity training that felt performative — *Effect: Special: convert 1 Community to 2 Street Cred*
211. a HR meeting that was about your hair — *Effect: +2 Street Cred this round*
212. a team building exercise that was actually a trap — *Effect: Resource Gain: +1 item, +$25 cash*
213. an office party that got weird when the boss left — *Effect: Special: convert 1 Community to 2 Street Cred*
214. a conference call that was dominated by the same person — *Effect: Narrative Twist: the hustle almost got you caught*
215. an email that got forwarded to the whole company — *Effect: +2 Street Cred this round*
216. a presentation that went wrong when the tech failed — *Effect: Special: convert 1 Community to 2 Street Cred*
217. a networking event that was really just people selling things — *Effect: Resource Gain: +1 item, +$25 cash*
218. a mentorship program that matched you with someone who didn't care — *Effect: Narrative Twist: the hustle almost got you caught*
219. a salary negotiation that went south when they found out your previous salary — *Effect: Resource Gain: +$50 cash*
220. a company holiday party that ended when the police showed up — *Effect: +2 Street Cred this round*

### Music, Art & Culture (36)

221. a DJ set that turned into a party — *Effect: Special: draw 1 extra card*
222. a sample that changed the whole track — *Effect: Narrative Twist: the crowd goes wild*
223. a playlist that got you through the semester — *Effect: +2 Reputation*
224. a concert where you met your best friend — *Effect: +1 Reputation, +1 Wisdom*
225. a beat that sound like the old school — *Effect: +2 Reputation*
226. a song that get every auntie on the dance floor — *Effect: +1 Reputation, +1 Wisdom*
227. a mixtape that defined the summer — *Effect: Resource Gain: +1 Receipt*
228. a producer who flipped a sample perfectly — *Effect: +1 Reputation, +1 Wisdom*
229. a song that remind you of your mama — *Effect: Special: draw 1 extra card*
230. a vinyl collection that worth more than your car — *Effect: +2 Reputation*
231. a poetry slam that made the whole room cry — *Effect: +2 Reputation*
232. a mural that tell the neighborhood story — *Effect: +1 Reputation, +1 Wisdom*
233. a documentary that changed your perspective — *Effect: +2 Reputation*
234. a book that everybody need to read — *Effect: Special: draw 1 extra card*
235. a movie that only the culture understand — *Effect: +2 Reputation*
236. a fashion trend that started on the block — *Effect: Narrative Twist: the crowd goes wild*
237. a dance that broke the internet — *Effect: +1 Reputation, +1 Wisdom*
238. a lyric that live rent free in your head — *Effect: +1 Reputation, +1 Wisdom*
239. a sound system that shook the whole block — *Effect: +2 Reputation*
240. a festival that felt like home — *Effect: +1 Reputation, +1 Wisdom*
241. a beat tape that got passed around the whole city — *Effect: Narrative Twist: the crowd goes wild*
242. a cypher that turned into a movement — *Effect: Resource Gain: +1 Receipt*
243. a fashion designer who started selling out of their trunk — *Effect: +2 Reputation*
244. a podcast that became a movement — *Effect: Narrative Twist: the crowd goes wild*
245. a YouTube channel that gave the culture a voice — *Effect: Special: draw 1 extra card*
246. a DJ set that turned the whole party out — *Effect: Special: draw 1 extra card*
247. a sound system that shook the windows — *Effect: Special: draw 1 extra card*
248. a beat that made everybody stop talking — *Effect: Resource Gain: +1 Receipt*
249. a cypher that lasted 3 hours — *Effect: Special: draw 1 extra card*
250. a dance battle that ended in a tie — *Effect: Special: draw 1 extra card*
251. a singer who forgot every word — *Effect: +2 Reputation*
252. a singer who said that song was about their ex — *Effect: Narrative Twist: the crowd goes wild*
253. a producer who said that beat cost $200 — *Effect: Narrative Twist: the crowd goes wild*
254. a DJ who switched genres at the worst time — *Effect: +2 Reputation*
255. a crowd that went crazy for the old school — *Effect: +2 Reputation*
256. a performance that made the whole room cry — *Effect: +2 Reputation*

### Struggle, Resistance & Resilience (50)

257. a landlord who raised rent during a pandemic — *Effect: +2 Community (the block rallies)*
258. a police stop that lasted 45 minutes for no reason — *Effect: Relationship Effect: +1 alliance*
259. a school that don't have textbooks — *Effect: Relationship Effect: +1 alliance*
260. a hospital that didn't believe your pain — *Effect: +2 Community (the block rallies)*
261. a job offer that disappeared after they saw your name — *Effect: Cipher Modifier: next Cipher is Peace*
262. a loan that was denied for no clear reason — *Effect: Relationship Effect: +1 alliance*
263. a neighborhood being torn down for condos — *Effect: +2 Community (the block rallies)*
264. a teacher who said you wouldn't make it — *Effect: Cipher Modifier: next Cipher is Peace*
265. a system designed to count you out — *Effect: Narrative Twist: the system pushes back*
266. a family that survived on nothing and still gave everything — *Effect: +2 Community (the block rallies)*
267. a grandmother who raised 12 kids on a teacher's salary — *Effect: Relationship Effect: +1 alliance*
268. a community that showed up when the government didn't — *Effect: +1 Reputation, −1 Street Cred*
269. a protest that changed the conversation — *Effect: +2 Community (the block rallies)*
270. a scholarship that changed your trajectory — *Effect: +2 Community (the block rallies)*
271. a mentor who saw something in you when nobody else did — *Effect: +2 Community (the block rallies)*
272. a ballot that took 4 hours to cast — *Effect: +2 Community (the block rallies)*
273. a voting place that was 30 minutes away — *Effect: +2 Community (the block rallies)*
274. a grandmother who marched in 1965 and still vote every year — *Effect: +2 Community (the block rallies)*
275. a neighborhood that looked out for its own — *Effect: +1 Reputation, −1 Street Cred*
276. a family that broke the cycle — *Effect: +2 Community (the block rallies)*
277. a police officer who said "I'm just doing my job" — *Effect: Relationship Effect: +1 alliance*
278. a teacher who said you weren't college material — *Effect: Relationship Effect: +1 alliance*
279. a landlord who said they don't rent to "your kind" — *Effect: Cipher Modifier: next Cipher is Peace*
280. a hospital that sent you home with no treatment — *Effect: Narrative Twist: the system pushes back*
281. a system that made you feel like you didn't belong — *Effect: Relationship Effect: +1 alliance*
282. a neighborhood meeting that turned into a roast session — *Effect: Cipher Modifier: next Cipher is Peace*
283. a block vote that split the whole street — *Effect: Narrative Twist: the system pushes back*
284. a petition that nobody signed — *Effect: Relationship Effect: +1 alliance*
285. a community garden that nobody watered — *Effect: Cipher Modifier: next Cipher is Peace*
286. a town hall that lasted 4 hours and resolved nothing — *Effect: Relationship Effect: +1 alliance*
287. a flyer for a meeting that nobody read — *Effect: Cipher Modifier: next Cipher is Peace*
288. a protest that got co-opted by a corporation — *Effect: +2 Community (the block rallies)*
289. a candidate who only show up at election time — *Effect: +2 Community (the block rallies)*
290. a block association that argue more than they act — *Effect: +1 Reputation, −1 Street Cred*
291. a community center that always closed — *Effect: Cipher Modifier: next Cipher is Peace*
292. a grant that disappeared before it hit the block — *Effect: Narrative Twist: the system pushes back*
293. a zoning meeting that nobody from the block attended — *Effect: Cipher Modifier: next Cipher is Peace*
294. a "revitalization" plan that don't include the people — *Effect: +1 Reputation, −1 Street Cred*
295. a community land trust that nobody understood — *Effect: Narrative Twist: the system pushes back*
296. a police reform meeting that went nowhere — *Effect: +1 Reputation, −1 Street Cred*
297. a mentorship program that matched nobody — *Effect: Relationship Effect: +1 alliance*
298. a block party permit that cost more than the party — *Effect: Narrative Twist: the system pushes back*
299. a neighborhood Facebook group that pure chaos — *Effect: Narrative Twist: the system pushes back*
300. a city council member who never returned a call — *Effect: Relationship Effect: +1 alliance*
301. a "consultant" who charged $50k and gave nothing — *Effect: +2 Community (the block rallies)*
302. a block vote that got overturned by the city — *Effect: Narrative Twist: the system pushes back*
303. a community garden that got paved over for parking — *Effect: Relationship Effect: +1 alliance*
304. a town hall where nobody from the block was on the panel — *Effect: Relationship Effect: +1 alliance*
305. a "affordable housing" unit that cost $2,000/month — *Effect: Cipher Modifier: next Cipher is Peace*
306. a police reform proposal that got watered down to nothing — *Effect: Narrative Twist: the system pushes back*

### Romance, Dating & Relationships (28)

307. a text that came back 3 days later — *Effect: Relationship Effect: new beef with [NPC]*
308. a situationship that should've stayed a situationship — *Effect: Relationship Effect: new beef with [NPC]*
309. a first date that felt like an interview — *Effect: +1 Reputation, −1 Street Cred*
310. a partner who still live with their mama — *Effect: +1 Community*
311. a rebound that turned into something real — *Effect: Relationship Effect: new beef with [NPC]*
312. a partner who don't like your friends — *Effect: Narrative Twist: an ex appears*
313. a text that changed everything — *Effect: Relationship Effect: +1 alliance with [player/NPC]*
314. a Valentine's Day that was a total miss — *Effect: Relationship Effect: new beef with [NPC]*
315. a partner who don't know how to listen — *Effect: +1 Community*
316. a first meeting at the family reunion — *Effect: Relationship Effect: +1 alliance with [player/NPC]*
317. a date that ended at the drive-thru — *Effect: +1 Reputation, −1 Street Cred*
318. a partner who ghost for 2 weeks then reappear — *Effect: Narrative Twist: an ex appears*
319. a love language that nobody speak — *Effect: +1 Reputation, −1 Street Cred*
320. a relationship that started in the group chat — *Effect: Relationship Effect: +1 alliance with [player/NPC]*
321. a partner who don't text back but always online — *Effect: Relationship Effect: +1 alliance with [player/NPC]*
322. a breakup that happened at the cookout — *Effect: +1 Community*
323. a partner who said "you not like other girls/guys" — *Effect: Relationship Effect: +1 alliance with [player/NPC]*
324. a love story that started with a wrong number — *Effect: +1 Reputation, −1 Street Cred*
325. a partner who bring out the best in you — *Effect: +1 Reputation, −1 Street Cred*
326. a relationship that survived the block opinions — *Effect: Narrative Twist: an ex appears*
327. a first date that got interrupted by their mama — *Effect: Narrative Twist: an ex appears*
328. a partner who still has feelings for their ex — *Effect: +1 Community*
329. a text that got forwarded to the wrong person — *Effect: Narrative Twist: an ex appears*
330. a relationship that the whole family approved of — *Effect: Narrative Twist: an ex appears*
331. a partner who brought you to the family reunion too soon — *Effect: Narrative Twist: an ex appears*
332. a partner who still lived with their mama — *Effect: +1 Community*
333. a partner who didn't like your friends — *Effect: +1 Reputation, −1 Street Cred*
334. a partner who didn't know how to listen — *Effect: +1 Community*

### Tech, Social Media & Modern Life (27)

335. a TikTok that went viral for the wrong reason — *Effect: Cipher Modifier: next Cipher is Flash*
336. an Instagram post that caused a family war — *Effect: Cipher Modifier: next Cipher is Flash*
337. a tweet that got you blocked by your mama — *Effect: +1 Reputation*
338. a group chat that spiraled out of control — *Effect: Resource Gain: +1 Receipt*
339. a subtweet that was definitely about you — *Effect: Resource Gain: +1 Receipt*
340. a streaming service password that everybody share — *Effect: Narrative Twist: it goes viral — for better or worse*
341. an AI-generated image of your family that weirdly wrong — *Effect: Cipher Modifier: next Cipher is Flash*
342. a tweet that was supposed to be private — *Effect: +1 Wisdom (you saw it coming)*
343. a comment section that ruined your whole day — *Effect: +1 Reputation*
344. a social media break that lasted 3 months — *Effect: +1 Wisdom (you saw it coming)*
345. a text thread that should've stayed in the drafts — *Effect: Cipher Modifier: next Cipher is Flash*
346. a TikTok algorithm that know you too well — *Effect: +1 Wisdom (you saw it coming)*
347. a selfie that caught something you didn't notice — *Effect: +1 Reputation*
348. a follow that created unnecessary drama — *Effect: +1 Wisdom (you saw it coming)*
349. a repost that got you called out — *Effect: +1 Reputation*
350. a phone screen that cracked but you still using it — *Effect: Resource Gain: +1 Receipt*
351. a notification that ruined your whole mood — *Effect: +1 Reputation*
352. a search history that you don't want explained — *Effect: Cipher Modifier: next Cipher is Flash*
353. a FaceTime call that connected at the worst time — *Effect: Resource Gain: +1 Receipt*
354. a post that got more likes than your graduation — *Effect: Narrative Twist: it goes viral — for better or worse*
355. a tweet that got you a job interview — *Effect: Resource Gain: +1 Receipt*
356. an Instagram story that started a riot — *Effect: +1 Wisdom (you saw it coming)*
357. a TikTok sound that got overused — *Effect: Narrative Twist: it goes viral — for better or worse*
358. a Facebook post from your mama that embarrassed you — *Effect: +1 Reputation*
359. a LinkedIn post that made you look desperate — *Effect: Narrative Twist: it goes viral — for better or worse*
360. a streaming service password that everybody shared — *Effect: Narrative Twist: it goes viral — for better or worse*
361. a TikTok algorithm that knew you too well — *Effect: Cipher Modifier: next Cipher is Flash*

### Health, Wellness & Self-Care (27)

362. a therapist who don't understand the culture — *Effect: +2 Wisdom this round*
363. a doctor who didn't believe your pain — *Effect: +1 Wisdom*
364. a mental health day that turned into a week — *Effect: +2 Wisdom this round*
365. a gym that's too bougie for the block — *Effect: +2 Wisdom this round*
366. a meditation app that don't understand your situation — *Effect: Narrative Twist: a truth gets said out loud*
367. a doctor who asked where you "really from" — *Effect: Narrative Twist: a truth gets said out loud*
368. a hospital that didn't have your pain medication — *Effect: Special: mulligan hand once*
369. a therapist who said "have you tried..." — *Effect: +1 Wisdom*
370. a self-care Sunday that turned into a self-care month — *Effect: Special: mulligan hand once*
371. a gym membership that you used once — *Effect: Special: mulligan hand once*
372. a doctor who blamed everything on stress — *Effect: Special: mulligan hand once*
373. a mental health check-in that was overdue — *Effect: Special: mulligan hand once*
374. a wellness routine that fell apart by Tuesday — *Effect: +1 Wisdom*
375. a therapist who finally got it — *Effect: +1 Wisdom*
376. a doctor who looked like you and actually listened — *Effect: Narrative Twist: a truth gets said out loud*
377. a gym membership that expired before you used it — *Effect: +2 Wisdom this round*
378. a yoga class that was too bougie for your taste — *Effect: Narrative Twist: a truth gets said out loud*
379. a therapist who finally understood your situation — *Effect: +1 Wisdom*
380. a hospital bill that was more than your rent — *Effect: Narrative Twist: a truth gets said out loud*
381. a prescription that was too expensive so you bought it from ____ — *Effect: +1 Wisdom*
382. a self-care routine that fell apart by Tuesday — *Effect: Special: mulligan hand once*
383. a doctor who asked where you're "really from" for the third time — *Effect: Narrative Twist: a truth gets said out loud*
384. a mental health check-in that was overdue by 6 months — *Effect: +1 Wisdom*
385. a meditation app that couldn't handle your trauma — *Effect: Narrative Twist: a truth gets said out loud*
386. a wellness retreat that was really just a vacation for rich people — *Effect: +1 Wisdom*
387. a therapist who said you need to "set boundaries" — *Effect: +2 Wisdom this round*
388. a support group that was full of people who didn't understand — *Effect: +2 Wisdom this round*

### Education & Youth (28)

389. a school that didn't have textbooks — *Effect: +1 Wisdom, +1 Reputation*
390. a guidance counselor who said you should be realistic — *Effect: Narrative Twist: a mentor steps in*
391. a school board that cut the arts program — *Effect: +2 Wisdom at School*
392. a teacher who became a mentor — *Effect: +2 Wisdom at School*
393. a school that named a building after you — *Effect: Narrative Twist: a mentor steps in*
394. a classmate who got into Harvard — *Effect: +2 Wisdom at School*
395. a professor who said your paper was the best they ever read — *Effect: Resource Gain: +1 Receipt*
396. a school that suspended you for your hair — *Effect: +2 Wisdom at School*
397. a teacher who gave you their last $20 for lunch — *Effect: +2 Wisdom at School*
398. a school that had to share textbooks — *Effect: +1 Wisdom, +1 Reputation*
399. a guidance counselor who helped you fill out applications — *Effect: +2 Wisdom at School*
400. a teacher who stayed after to help you study — *Effect: Resource Gain: +1 Receipt*
401. a school board meeting where the parents fought back — *Effect: +2 Wisdom at School*
402. a principal who said "we don't do that here" — *Effect: +2 Wisdom at School*
403. a professor who said you wasn't college material — *Effect: +2 Wisdom at School*
404. a HBCU homecoming that turned into a family reunion — *Effect: +2 Wisdom at School*
405. a yard show that got cut short by the police — *Effect: +2 Wisdom at School*
406. a marching band that played your favorite song — *Effect: Special: Research — choose next Cipher*
407. a professor who became your mentor — *Effect: Narrative Twist: a mentor steps in*
408. a dorm room that smelled like ____ — *Effect: +1 Wisdom, +1 Reputation*
409. a student government that fought for ____ — *Effect: +1 Wisdom, +1 Reputation*
410. a fraternity that stepped to you for ____ — *Effect: +2 Wisdom at School*
411. a sorority that showed you how to ____ — *Effect: +1 Wisdom, +1 Reputation*
412. a scholarship that changed your life — *Effect: Resource Gain: +1 Receipt*
413. a professor who gave you their last $20 — *Effect: +1 Wisdom, +1 Reputation*
414. a library that stayed open 24 hours during finals — *Effect: Resource Gain: +1 Receipt*
415. a homecoming that felt like a family reunion — *Effect: +1 Wisdom, +1 Reputation*
416. a graduation that made your grandma cry — *Effect: Resource Gain: +1 Receipt*

### Sports, Gaming & Competition (14)

417. a FIFA tournament that got heated — *Effect: +1 Community (good sportsmanship)*
418. a Madden game that ended in a controller throw — *Effect: +1 Street Cred, +1 Reputation*
419. a streetball game with no net and maximum trash talk — *Effect: +2 Street Cred*
420. a chess match that turned into a shouting match — *Effect: Narrative Twist: the whole block saw that*
421. a dominoes game that got quiet when ____ — *Effect: +1 Street Cred, +1 Reputation*
422. a spades game that was rigged from the start — *Effect: +1 Street Cred, +1 Reputation*
423. a wrestling match in the living room that broke the coffee table — *Effect: Narrative Twist: the whole block saw that*
424. a video game lobby that was toxic from the jump — *Effect: +2 Street Cred*
425. a flag football game that had too many arguments — *Effect: +2 Street Cred*
426. a boxing match that ended in a hug — *Effect: +2 Street Cred*
427. a poker game where nobody bluffed — *Effect: +2 Street Cred*
428. a video game character that was OP — *Effect: +1 Street Cred, +1 Reputation*
429. a sports team that choked in the playoffs — *Effect: +2 Street Cred*
430. a card game that started a family war — *Effect: Narrative Twist: the whole block saw that*

### Fashion, Fit & Style (15)

431. a fit that was so clean it got you stopped — *Effect: Narrative Twist: somebody asks where you got it*
432. a pair of shoes that were so fresh they had their own fanbase — *Effect: +1 Street Cred*
433. a hair style that was laid but the edges were ____ — *Effect: Narrative Twist: somebody asks where you got it*
434. a jacket that was vintage from the 90s — *Effect: +1 Reputation*
435. an outfit that was borrowed from your cousin — *Effect: Narrative Twist: somebody asks where you got it*
436. some accessories that were all from the bodega — *Effect: Narrative Twist: somebody asks where you got it*
437. a pair of sneakers that were limited edition — *Effect: +1 Street Cred*
438. a hat that was from your granddaddy's closet — *Effect: Resource Gain: +1 item*
439. a bag that was counterfeit but looked real — *Effect: +2 Reputation this round*
440. a fit that was inspired by your favorite rapper — *Effect: Narrative Twist: somebody asks where you got it*
441. a hair style that was done by your cousin — *Effect: +1 Reputation*
442. a makeup look that was beat by your homegirl — *Effect: +1 Street Cred*
443. a set of nails that was done at the salon — *Effect: +1 Reputation*
444. an outfit that was thrifted from the goodwill — *Effect: +1 Street Cred*
445. a style that was copied from a TikTok trend — *Effect: +1 Reputation*

### Travel, Place & Belonging (22)

446. a trip back South that felt like home — *Effect: +2 Reputation, −1 Street Cred*
447. a vacation where you were the only Black person — *Effect: +1 Community*
448. a hotel that wouldn't rent you a room — *Effect: +2 Reputation, −1 Street Cred*
449. an Airbnb that was nothing like the pictures — *Effect: +2 Reputation, −1 Street Cred*
450. a resort that treated you like you didn't belong — *Effect: +2 Reputation, −1 Street Cred*
451. a flight where you got seated next to ____ — *Effect: Narrative Twist: you find a piece of home somewhere unexpected*
452. a road trip that stopped at every ____ — *Effect: +1 Reputation*
453. a city where you felt safe for the first time — *Effect: Resource Gain: +1 item (a souvenir with a story)*
454. a neighborhood that felt like home immediately — *Effect: +1 Community*
455. a restaurant where the owner came to your table — *Effect: +1 Reputation*
456. a hotel that upgraded you for no reason — *Effect: +2 Reputation, −1 Street Cred*
457. a beach that had too many ____ — *Effect: +2 Reputation, −1 Street Cred*
458. a trip that turned into a family reunion — *Effect: +2 Reputation, −1 Street Cred*
459. a vacation that got cut short by ____ — *Effect: Resource Gain: +1 item (a souvenir with a story)*
460. a journey that changed your perspective forever — *Effect: Resource Gain: +1 item (a souvenir with a story)*
461. a flight that got delayed because of weather — *Effect: +2 Reputation, −1 Street Cred*
462. a rental car that broke down in the middle of nowhere — *Effect: Resource Gain: +1 item (a souvenir with a story)*
463. a road trip that stopped at every Black-owned business — *Effect: +1 Community*
464. a city that felt like home immediately — *Effect: +2 Reputation, −1 Street Cred*
465. a beach that had too many Confederate flags — *Effect: +2 Reputation, −1 Street Cred*
466. a cruise that was bougie but you made it work — *Effect: Narrative Twist: you find a piece of home somewhere unexpected*
467. a journey that changed your perspective on everything — *Effect: +2 Reputation, −1 Street Cred*

### Diaspora & Caribbean (15)

468. a Jamaican auntie who said you need to eat more — *Effect: Resource Gain: +1 Receipt*
469. a Nigerian uncle who brought jollof rice — *Effect: +1 Reputation*
470. a Haitian family reunion that had too much food — *Effect: +1 Wisdom, +1 Community*
471. an Ethiopian restaurant that served the best injera — *Effect: Resource Gain: +1 Receipt*
472. a Ghanaian grandma who gave you a dollar — *Effect: Narrative Twist: a connection to home surfaces*
473. a Trinidadian carnival that was too lit — *Effect: Resource Gain: +1 Receipt*
474. an Ethiopian coffee ceremony that lasted 3 hours — *Effect: +1 Reputation*
475. a Somali family who said you need to sit down — *Effect: +1 Reputation*
476. a Ghanaian kente cloth that was more expensive than your rent — *Effect: +2 Community*
477. a Jamaican patty that was so good you bought 10 — *Effect: Narrative Twist: a connection to home surfaces*
478. a Nigerian jollof rice that started a war — *Effect: +1 Reputation*
479. a Haitian soup joumou that tasted like history — *Effect: Narrative Twist: a connection to home surfaces*
480. an Ethiopian injera that you couldn't figure out how to eat — *Effect: +2 Community*
481. a Trinidadian doubles that you ate for breakfast lunch and dinner — *Effect: Narrative Twist: a connection to home surfaces*
482. a Senegalese family reunion that had too much dancing — *Effect: +1 Wisdom, +1 Community*

### Black Joy & Celebration (13)

483. a Juneteenth cookout that had too much food — *Effect: +1 Reputation, +1 Community*
484. a Kwanzaa celebration that included the whole block — *Effect: Special: draw 1 extra card*
485. a Black History Month program that was actually good — *Effect: Special: draw 1 extra card*
486. a family reunion that had too many matches — *Effect: Narrative Twist: the whole block shows up*
487. a graduation party that your whole neighborhood attended — *Effect: +1 Street Cred*
488. a baby shower that was so extra it went viral — *Effect: Special: draw 1 extra card*
489. a birthday party that was themed after your favorite movie — *Effect: Narrative Twist: the whole block shows up*
490. a holiday dinner that had enough food for 3 families — *Effect: +1 Street Cred*
491. a New Year's Eve celebration that lasted until 3am — *Effect: +1 Reputation, +1 Community*
492. an Easter Sunday service that had the best choir — *Effect: Special: draw 1 extra card*
493. a Mother's Day brunch that made your mama cry — *Effect: +1 Reputation, +1 Community*
494. a Father's Day barbecue that had too much meat — *Effect: +1 Reputation, +1 Community*
495. an anniversary celebration that was more about the family than the couple — *Effect: +1 Street Cred*

### Generational Dynamics (14)

496. Mama said you act like ____ — *Effect: +2 Wisdom (the long view)*
497. Uncle said "these kids today" ____ — *Effect: Narrative Twist: the block remembers*
498. The 10-year-old said ____ — *Effect: +2 Wisdom (the long view)*
499. The 80-year-old said ____ — *Effect: Relationship Effect: +1 alliance with an Elder NPC*
500. The 30-year-old tried to explain ____ — *Effect: Relationship Effect: +1 alliance with an Elder NPC*
501. The 60-year-old said they remember ____ — *Effect: Relationship Effect: +1 alliance with an Elder NPC*
502. The 20-year-old said ____ — *Effect: Narrative Twist: the block remembers*
503. The 70-year-old said "y'all don't know ____" — *Effect: Narrative Twist: the block remembers*
504. The 40-year-old said "I'm too old for ____" — *Effect: +1 Community*
505. The 50-year-old said ____ — *Effect: +1 Community*
506. The 15-year-old said ____ — *Effect: Relationship Effect: +1 alliance with an Elder NPC*
507. The 25-year-old said ____ — *Effect: Relationship Effect: +1 alliance with an Elder NPC*
508. The 90-year-old said ____ — *Effect: +2 Wisdom (the long view)*
509. The 35-year-old said ____ — *Effect: Narrative Twist: the block remembers*

### Universal & Everyday (30)

510. The new luxury building opened across the street and ____ — *Effect: Narrative Twist: the block reacts*
511. Your cousin who owe you shows up at the cookout with ____ — *Effect: +1 Reputation*
512. The police pulled you over for ____ — *Effect: +1 Reputation*
513. At the family reunion, Auntie asked why you still ____ — *Effect: +1 Street Cred*
514. The barber cut your line and then said ____ — *Effect: +1 Street Cred*
515. You walked into the cookout and heard ____ — *Effect: +1 Street Cred*
516. The church lady side-eyed you because ____ — *Effect: Resource Gain: +1 Receipt*
517. Your mama found your report card and said ____ — *Effect: +1 Wisdom*
518. The DJ stopped the music because ____ — *Effect: Resource Gain: +1 Receipt*
519. The neighbor called the cops on the kids for ____ — *Effect: Resource Gain: +1 Receipt*
520. You got to the family reunion and realized ____ — *Effect: +1 Wisdom*
521. The landlord raised the rent and said ____ — *Effect: +1 Reputation*
522. At the beauty shop, they was talking about ____ — *Effect: +1 Wisdom*
523. Your homie just got a new car and said ____ — *Effect: +1 Community*
524. You walked into the Sunday service and ____ — *Effect: Resource Gain: +1 Receipt*
525. The teacher called your mama and said ____ — *Effect: +1 Reputation*
526. The bodega owner gave you free ____ — *Effect: +1 Community*
527. You tried to explain your side hustle and Uncle said ____ — *Effect: +1 Street Cred*
528. The police officer asked for ____ — *Effect: Resource Gain: +1 Receipt*
529. At the block party, someone brought ____ — *Effect: +1 Wisdom*
530. Your auntie said you look like you been ____ — *Effect: +1 Wisdom*
531. The choir director said you can't sing ____ — *Effect: +1 Wisdom*
532. You tried to pay with Apple Pay at the corner store and ____ — *Effect: Narrative Twist: the block reacts*
533. The family group chat went crazy because ____ — *Effect: +1 Street Cred*
534. At the cookout, the mac and cheese was ____ — *Effect: +1 Street Cred*
535. Your grandma said back in her day ____ — *Effect: Narrative Twist: the block reacts*
536. The church parking lot look like ____ — *Effect: Narrative Twist: the block reacts*
537. Your baby mama said she need ____ — *Effect: +1 Wisdom*
538. You told your mama you got a promotion and she said ____ — *Effect: Resource Gain: +1 Receipt*
539. The security guard followed you around the store for ____ — *Effect: Narrative Twist: the block reacts*

## Receipt Chains (130 Receipts in 14 Chains)

Every Receipt below already carries its own mechanic — an `Activate at [Location]:` trigger with two branching choices. What groups them into **chains** is sequence: pull a Receipt from a chain you've already started, and it continues a story already in motion. Complete every node in a chain and the whole table gets the **Chain Complete** bonus.

You don't have to run chains in order — a Griot can hand out any Receipt from an unstarted chain at any time as a stand-alone consequence. But once two or more nodes from the same chain are in play, the Griot should start treating them as connected: reference the earlier choice when the later one comes up. That's "the block remembers" in practice.

---

### Chain 1: The Church Chronicles (10 nodes)

*A season in the life of the church — from the choir loft to the parking lot.*

1. **"The Church Parking Lot"** — Somebody took your spot. Activate at Church: let it go (+1 Community) or say something (+2 Street Cred, −1 Reputation).
2. **"The Sunday Service Drama"** — You saw Deacon Williams texting during the sermon and told Auntie. Now the church divided. Activate at Church: roll Cipher. Peace = +2 Community. Anything else = −1 Reputation.
3. **"The Church Lady's Prayer"** — She prayed for you publicly and it felt like a read. Activate at Church: accept blessing (+1 Reputation) or clap back (−1 Reputation, +2 Street Cred).
4. **"The Choir Director Beef"** — You told the choir director their arrangement was weak. They still salty. Activate at Church: apologize (+1 Community) or defend your taste (+2 Reputation, −1 Street Cred).
5. **"The Usher Board Drama"** — You sided with Deacon Bailey and now half the ushers don't speak to you. Activate at Church: smooth it over (+1 Community) or stand on it (+2 Street Cred).
6. **"The Sunday School Lesson"** — You told the kids Santa Claus isn't real and Mama found out. Activate at Church: apologize to Mama (+2 Reputation) or stand on business (+1 Street Cred).
7. **"The Baptism Incident"** — You got baptized and the pastor forgot your name. Activate at Church: laugh it off (+1 Community) or request a do-over (+2 Reputation).
8. **"The Mission Trip Debt"** — You said you'd go on the mission trip but backed out last minute. Activate at Church: make it up (+1 Community, +1 Reputation) or let it ride (+1 Street Cred).
9. **"The Church Tithe"** — You been tithing faithfully for years. The roof still leak. Activate at Church: keep giving (+2 Reputation) or ask questions (+1 Wisdom, −1 Community).
10. **"The Revival All-Nighter"** — You fell asleep during the 3am service and Deacon Williams took a picture. Activate at Church: own it (+2 Reputation) or delete the evidence (+1 Street Cred).

**Chain Complete:** +3 Community, +2 Reputation. Special Achievement: *Pillar of the Church* — the O.G. Elder power *Wisdom* now costs no Cipher token to use at Church.

---

### Chain 2: The Reunion Reckoning (10 nodes)

*One family reunion, ten decisions, a whole lot of paper plates.*

1. **"The Cousin's Wedding"** — You gave a speech that went too long and nobody clapped. Activate at Cookout Spot: own it (+1 Reputation) or let it haunt you (−1 Reputation).
2. **"The Family Reunion Incident"** — You made an offhand comment and Uncle Leroy been holding a grudge. Activate at Cookout Spot: smooth it over (+1 Community) or let him have it (+2 Street Cred, −1 Community).
3. **"The Potato Salad War"** — Your potato salad was so good it started a family war. Activate at Cookout Spot: share the recipe (+2 Community) or keep it secret (+2 Reputation, −1 Community).
4. **"The Potluck Incident"** — You brought the wrong dish and everybody noticed. Activate at Cookout Spot: own it (+1 Community) or blame the store (+1 Street Cred).
5. **"The Cookout Beef"** — You brought the wrong potato salad and somebody said something. Activate at Cookout Spot: apologize (+1 Community) or leave (−1 Community, +1 Street Cred).
6. **"The Family Reunion Roast"** — Your cousin roasted you so bad you still thinking about it. Activate at Cookout Spot: clap back (+2 Street Cred) or let it go (+1 Community).
7. **"The Sunday Dinner Invite"** — You was uninvited then reinvited. The tension thick. Activate at The House: go (+1 Community) or skip it (+1 Street Cred, −1 Reputation).
8. **"The Baby Mama Drama"** — You showed up with the new partner at the family function. Activate at The House: handle it maturely (+1 Community) or let the side eye roll (+1 Street Cred, −1 Reputation).
9. **"The Family Secret"** — You found out something about your family that change everything. Activate at The House: share it (+1 Community, −1 Reputation) or keep it (+1 Wisdom).
10. **"The Grandmother's Blessing"** — She gave you a dollar and told you to be careful. Activate at The House: accept the blessing (+2 Reputation) or tell her you don't need it (+1 Street Cred).

**Chain Complete:** +3 Community, +2 Street Cred. Special Achievement: *The One Everybody Invites* — unlock the Cookout Regular Origin's *The Plate* ability for any character, once.

---

### Chain 3: The Grill Master's Trial (7 nodes)

*Every cook at the cookout answers to the grill, eventually.*

1. **"The Cookout Invite"** — You was the last one to get the invite. Activate at Cookout Spot: show up and show out (+1 Community) or skip it and stay paid (+1 Street Cred).
2. **"The Cookout Grill Master"** — You tried to help with the grill and the master said "I got this." Activate at Cookout Spot: respect it (+1 Community) or prove yourself (+2 Street Cred).
3. **"The Grill Master Ego"** — The grill master wouldn't accept help and the food got burnt. Activate at Cookout Spot: say something (+2 Street Cred) or let it slide (+1 Community).
4. **"The Mac and Cheese Incident"** — Your mac and cheese had no crust and Auntie said something. Activate at Cookout Spot: defend it (+2 Street Cred) or remake it (+1 Community).
5. **"The Family Recipe"** — Grandma gave you her secret recipe but said "don't tell nobody." Activate at The House: guard it (+2 Reputation) or share it (+1 Community).
6. **"The Family Recipe Theft"** — Your cousin stole your recipe and is claiming it as theirs. Activate at Cookout Spot: expose them (+2 Street Cred) or let it go (+1 Community).
7. **"The Church Potluck"** — You brought a dish to the potluck and nobody ate it. Activate at Church: own it (+1 Community) or never bring it again (+1 Street Cred).

**Chain Complete:** +2 Street Cred, +2 Community. Special Achievement: *Grill Rights* — permanently unlocks the grill at Cookout Spot; no other player can gatekeep it from you again.

---

### Chain 4: The Hustle Ledger (11 nodes)

*Every hustle leaves a paper trail. This is yours.*

1. **"The Side Hustle Success"** — Your t-shirt design blew up locally. Activate at Bodega: expand (+2 Street Cred) or rest on laurels (+1 Reputation).
2. **"The Hustle Owe You"** — You fronted your friend $200 for inventory. They haven't paid you back. Activate at Bodega: demand payment (+2 Street Cred, +1 Reputation) or let it slide (+2 Community, −1 Street Cred).
3. **"The Hustle Partnership"** — You and your homeboy started something but money got tight. Activate at Bodega: renegotiate (+1 Community, +1 Reputation) or walk away (+2 Street Cred, −2 Community).
4. **"The Corner Store Beef"** — The owner said something about your mama. Activate at Bodega: confront (+2 Street Cred, −1 Reputation) or let it slide (+1 Community).
5. **"The Loan from Auntie"** — She gave you $500 with no interest but told the whole family. Activate at The House: pay it back (+2 Reputation) or remind her it was a gift (+1 Street Cred, −1 Community).
6. **"The Beauty Shop Rumors"** — Something you said got twisted. Activate at Beauty Shop: correct it (+2 Community) or let it fuel your brand (+1 Reputation, +1 Street Cred).
7. **"The Block Watch Call"** — Someone called the cops on the basketball game. You know who. Activate at The Corner: expose caller (+2 Street Cred, −1 Reputation) or stay silent (+1 Community).
8. **"The Police Stop"** — You got pulled over for no reason. You handled it, but the block saw. Activate at The Corner: rally support (+2 Community) or brush it off (+1 Reputation).
9. **"The DJ Battle Loss"** — You lost the battle and everybody saw. Activate at Park: practice (+1 Wisdom) or let it ride (+2 Street Cred).
10. **"The Block Party Permit"** — You organized the party but the city shut it down. Activate at Park: restart it (+2 Street Cred, −1 Reputation) or let it go (+1 Community).
11. **"The Block Club Beef"** — You said something at the meeting and Deacon Bailey took it personal. Activate at Park: smooth it over (+1 Community) or stand on business (+2 Street Cred, −1 Reputation).

**Chain Complete:** +3 Street Cred, +1 Reputation. Special Achievement: *Corner Legend* — permanent +1 Street Cred whenever you play a card at The Corner or Bodega.

---

### Chain 5: The Fight for the Block (10 nodes)

*Gentrification don't knock. This chain is the block organizing back.*

1. **"The Gentrification Letter"** — Your landlord raised rent 40%. You fighting it. Activate every round: organize (+1 Community, −1 Street Cred) or move (+1 Reputation, −2 Street Cred).
2. **"The Rent Strike"** — You organized the building and half the tenants on board. Activate at The House: keep organizing (+2 Community) or cut a deal (+1 Reputation).
3. **"The Community Garden"** — You started a garden and the city wants to pave it. Activate at Park: fight back (+2 Community, −1 Street Cred) or find a new spot (+1 Wisdom).
4. **"The Zoning Meeting"** — You showed up and spoke truth to power. Activate at Park: keep pushing (+2 Community) or let it go (+1 Street Cred).
5. **"The School Board Fight"** — You spoke up at the PTA meeting and went viral locally. Activate at School: run for office (+2 Reputation) or lay low (+1 Community).
6. **"The Voting Fight"** — You waited 4 hours to vote and they tried to close the polls. Activate at School: tell the story (+2 Reputation) or let it slide (+1 Community).
7. **"The City Council Vote"** — You testified and they still voted against you. Activate at School: run against them (+2 Reputation) or organize a recall (+2 Community).
8. **"The Police Reform Meeting"** — You went to the meeting and they talked for 3 hours. Activate at Church: keep pressuring (+1 Community) or let it go (+1 Street Cred).
9. **"The Protest"** — You went to the protest and somebody filmed you. Activate at Park: use the footage (+2 Reputation) or stay off camera (+1 Street Cred).
10. **"The Police Report"** — You filed a report and now the whole block know. Activate at The Corner: leverage it (+2 Community) or keep it low (+1 Street Cred).

**Chain Complete:** +3 Community, +2 Reputation. Special Achievement: *The Block Won This One* — the Block's Safety and Legacy stats (Section 8.3) each go up one permanent tier.

---

### Chain 6: Schoolyard to Diploma (10 nodes)

*From detention to the stage — coming up on the block, one Receipt at a time.*

1. **"The Schoolyard Beef"** — You said something about somebody's mama and now it's on. Activate at School: apologize (+1 Community) or stand on it (+2 Street Cred).
2. **"The Detention"** — You got detention for something you didn't do. Activate at School: fight it (+2 Street Cred) or take the L (+1 Community).
3. **"The Teacher's Pet"** — The teacher said you was their favorite and now everybody hating. Activate at School: humble yourself (+1 Community) or embrace it (+2 Reputation).
4. **"The Yard Show Debt"** — You promised the marching band you'd bring the speakers. You forgot. Activate at School: make amends (+1 Community, +1 Reputation) or avoid (+1 Street Cred).
5. **"The Homecoming Court"** — You got voted king/queen but somebody said it was rigged. Activate at School: embrace it (+2 Reputation) or decline it (+1 Community).
6. **"The Report Card"** — You brought home straight A's and Mama still said you could do better. Activate at The House: celebrate (+1 Community) or push for more (+1 Wisdom).
7. **"The Mentor"** — A teacher saw something in you when nobody else did. Activate at School: stay grateful (+2 Community) or pay it forward (+1 Reputation).
8. **"The Scholarship"** — You got the scholarship but the school said you don't belong. Activate at School: prove them wrong (+2 Reputation) or transfer (+1 Street Cred).
9. **"The Walkout"** — You organized the walkout and half the school followed. Activate at School: negotiate (+2 Reputation) or keep pushing (+2 Street Cred).
10. **"The Graduation"** — You graduated and half your family didn't show up. Activate at School: celebrate anyway (+2 Reputation) or feel a way (+1 Street Cred).

**Chain Complete:** +2 Wisdom, +3 Reputation. Special Achievement: *First in the Family* — permanently unlocks the HBCU Student Origin's *The Yard* ability for any character.

---

### Chain 7: The Yard (6 nodes)

*Homecoming weekend, yard shows, and the debt every HBCU kid owes the block that sent them.*

1. **"The HBCU Admission"** — You got into your dream HBCU but Mama said it's too far. Activate at School: follow your dream (+2 Reputation) or stay close (+1 Community).
2. **"The Fraternity/Sorority"** — You got invited to join but the process was brutal. Activate at School: embrace it (+2 Reputation) or quit (+1 Street Cred).
3. **"The Homecoming Invite"** — Your college roommate invited you to homecoming but you can't afford it. Activate at School: find a way (+2 Street Cred) or let it go (+1 Community).
4. **"The Yard Show Blessing"** — The band played your song and the crowd went crazy. Activate at School: build on it (+2 Reputation) or stay humble (+1 Community).
5. **"The Professor's Recommendation"** — Your professor wrote you a recommendation that got you the job. Activate at School: stay grateful (+2 Community) or pay it forward (+1 Reputation).
6. **"The Graduation Gift"** — Grandma gave you $100 and said "don't spend it on nonsense." Activate at The House: invest it (+2 Reputation) or treat yourself (+1 Street Cred).

**Chain Complete:** +2 Reputation, +2 Community. Special Achievement: *Alumni Status* — gain a permanent Contact at School who owes you a favor.

---

### Chain 8: The Grind (7 nodes)

*Nine-to-five, side hustle, or both — the paper trail of trying to get free.*

1. **"The Freelance Gig"** — You got a freelance gig that paid in exposure. Activate at Bodega: take it (+1 Street Cred) or pass (+1 Reputation).
2. **"The Boss Disrespect"** — Your boss said "we're a family" but didn't pay overtime. Activate at Bodega: quit (+2 Street Cred) or stay (+1 Community).
3. **"The Promotion Snub"** — You got passed over for promotion again. Activate at Bodega: confront (+2 Street Cred) or job hunt (+1 Reputation).
4. **"The Client Ghost"** — A client ghosted you after you did the work. Activate at Bodega: chase them (+2 Street Cred) or let it go (+1 Community).
5. **"The Bank Loan"** — The bank denied your loan for no clear reason. Activate at Bodega: appeal (+2 Reputation) or find another way (+1 Street Cred).
6. **"The Side Hustle Shutdown"** — Your side hustle got shut down by the city. Activate at Bodega: fight it (+2 Street Cred) or pivot (+1 Wisdom).
7. **"The Commission"** — Your commission check came at the perfect time. Activate at Bodega: invest it (+2 Reputation) or treat yourself (+1 Street Cred).

**Chain Complete:** +2 Street Cred, +2 Reputation. Special Achievement: *Made It* — one permanent +$100 income bump on this character's Hustle economy roll (Section 8.4).

---

### Chain 9: Terms & Conditions (10 nodes)

*The group chat, the algorithm, and the receipts that never really delete.*

1. **"The Subtweet"** — You subtweeted somebody and they knew it was them. Activate at The House: admit it (+1 Community) or deny it (+2 Street Cred).
2. **"The Tweet That Got You Blocked"** — Your tweet got you blocked by your mama. Activate at The House: apologize (+2 Reputation) or double down (+1 Street Cred).
3. **"The Group Chat Chaos"** — The family group chat went viral because of you. Activate at The House: own it (+1 Community) or let it ride (+2 Street Cred).
4. **"The Instagram Family War"** — Your Instagram post caused a family war. Activate at The House: apologize (+1 Community) or let it ride (+2 Street Cred).
5. **"The TikTok Viral"** — Your TikTok went viral for the wrong reason. Activate at School: own it (+2 Reputation) or delete it (+1 Street Cred).
6. **"The AI-Generated Photo"** — You made an AI-generated family photo and it was weirdly wrong. Activate at The House: delete it (+1 Street Cred) or post it anyway (+1 Reputation).
7. **"The Search History"** — Your search history got exposed and now everybody knows. Activate at The House: own it (+1 Community) or deny it (+2 Street Cred).
8. **"The Streaming Password"** — Your streaming password got shared with the whole family. Activate at The House: change it (+1 Street Cred) or let it go (+1 Community).
9. **"The Notification"** — Your phone notification ruined your whole day. Activate at The House: turn it off (+1 Wisdom) or check it anyway (+1 Street Cred).
10. **"The FaceTime Timing"** — Your FaceTime call connected at the worst time. Activate at The House: explain (+1 Community) or hang up (+1 Street Cred).

**Chain Complete:** +2 Reputation, +2 Wisdom. Special Achievement: *Main Character* — draw an extra Receipt the next time a Cipher lands on Barbershop Truth.

---

### Chain 10: The Cipher Chronicles (10 nodes)

*A whole career from block cypher to the venue that cancelled last minute.*

1. **"The Cipher"** — You entered the cipher and shut it down. Activate at Park: keep the momentum (+2 Reputation) or let someone else shine (+1 Community).
2. **"The DJ Battle"** — You battled the DJ and won. Activate at Park: claim the spot (+2 Reputation) or share it (+1 Community).
3. **"The Sound System Clash"** — Your sound system got turned off mid-set. Activate at Park: confront (+2 Street Cred) or let it go (+1 Community).
4. **"The Dance Challenge"** — Your dance went viral but somebody said you copied it. Activate at Park: defend it (+2 Reputation) or give credit (+1 Community).
5. **"The Sample Clearance"** — You sampled a song and now the original artist want credit. Activate at School: negotiate (+1 Wisdom) or cut a check (+2 Reputation).
6. **"The Producer Tag"** — You added your producer tag to every track and now it's a brand. Activate at School: protect it (+2 Reputation) or let it go (+1 Street Cred).
7. **"The Mixtape Distribution"** — You dropped a mixtape and it got passed around the whole city. Activate at Bodega: capitalize (+2 Street Cred) or stay humble (+1 Community).
8. **"The Concert Bootleg"** — You sold bootleg DVDs of the concert and got caught. Activate at Park: pay the price (+1 Street Cred) or deny everything (+1 Reputation).
9. **"The Venue Booking"** — You booked the venue but the owner cancelled last minute. Activate at Park: find a new spot (+2 Street Cred) or let it go (+1 Community).
10. **"The Poetry Slam"** — You got booed off stage but came back stronger. Activate at School: keep writing (+2 Reputation) or quit (+1 Street Cred).

**Chain Complete:** +3 Reputation, +1 Wisdom. Special Achievement: *Local Legend* — permanently unlocks the Creative Hustle's *Mixtape* power for any character.

---

### Chain 11: Undefeated (10 nodes)

*The court, the table, the console — respect gets earned the same way everywhere on the block.*

1. **"The Basketball Beef"** — You called game-winner and somebody said it wasn't. Activate at The Corner: stand on it (+2 Street Cred) or let it go (+1 Community).
2. **"The Streetball Game"** — You crossed somebody so bad they fell. Activate at The Corner: post it (+2 Reputation) or let it go (+1 Community).
3. **"The Flag Football Game"** — You caught the game-winning touchdown and somebody said you were out of bounds. Activate at The Corner: show the replay (+2 Street Cred) or let it go (+1 Community).
4. **"The Dominoes Loss"** — You lost the dominoes game and somebody said you threw it. Activate at Park: defend your game (+2 Street Cred) or let it ride (+1 Community).
5. **"The Chess Match"** — You beat somebody 3 times and they stopped playing. Activate at Park: teach them (+1 Community) or let them have it (+2 Street Cred).
6. **"The Spades Game"** — Your partner misplayed and you lost. Activate at The House: say something (+2 Street Cred) or let it go (+1 Community).
7. **"The Card Game Argument"** — You caught somebody cheating and they denied it. Activate at The House: expose them (+2 Street Cred) or let it slide (+1 Community).
8. **"The Poker Game"** — You bluffed and won but somebody said you cheated. Activate at The House: own it (+2 Street Cred) or fold (+1 Community).
9. **"The FIFA Tournament"** — You lost the tournament and your opponent taunted you. Activate at The House: rematch (+2 Street Cred) or let it go (+1 Community).
10. **"The Video Game Tournament"** — You won the tournament and somebody said you hacked. Activate at The House: prove them wrong (+2 Reputation) or let it go (+1 Community).

**Chain Complete:** +3 Street Cred, +1 Reputation. Special Achievement: *Undisputed* — permanently unlocks the Rebel Hustle's *Lone Wolf* power for any character.

---

### Chain 12: It's Complicated (10 nodes)

*One relationship, ten receipts, zero regrets (mostly).*

1. **"The Text That Changed Everything"** — You sent a text that changed everything. Activate at The House: follow up (+1 Community) or let it ride (+1 Street Cred).
2. **"The Situationship"** — You was in a situationship that should've stayed a situationship. Activate at The House: end it (+1 Street Cred) or make it official (+1 Community).
3. **"The Family Reunion Introduction"** — Your mama tried to set you up at the family reunion. Activate at Cookout Spot: play it cool (+1 Community) or escape (+1 Street Cred).
4. **"The Ex at the Cookout"** — You ran into your ex at the cookout. Activate at Cookout Spot: be civil (+1 Community) or make them jealous (+2 Street Cred).
5. **"The Partner Who Lives With Their Mama"** — Your partner still lives with their mama. Activate at The House: accept it (+1 Community) or draw a line (+1 Street Cred).
6. **"The Ghost"** — Your partner ghosted for 2 weeks then reappeared. Activate at The House: hear them out (+1 Community) or block them (+2 Street Cred).
7. **"The Valentine's Day Miss"** — Your Valentine's Day was a total miss. Activate at The House: make it up (+1 Community) or let it go (+1 Street Cred).
8. **"The Love Language"** — Your partner's love language is acts of service but you need words. Activate at The House: compromise (+1 Community) or be honest (+1 Reputation).
9. **"The Breakup at the Cookout"** — Your breakup happened at the cookout and everybody saw. Activate at Cookout Spot: own it (+2 Reputation) or hide (+1 Street Cred).
10. **"The Relationship Survival"** — Your relationship survived the block opinions. Activate at The House: celebrate (+2 Community) or keep it private (+1 Reputation).

**Chain Complete:** +2 Community, +2 Reputation. Special Achievement: *The Block Approves* — gain a permanent Alliance-ready Contact at Cookout Spot.

---

### Chain 13: The Block Beautification Committee (10 nodes)

*The ten receipts below were rebuilt from fragments in the original card drafts — the source text had titles but no working mechanic (see the Compilation Notes at the end of this document). Rebuilt here with real Activate/Resolve choices so the Block Captain's whole year is actually playable.*

1. **"The Block Captain"** — The block captain wants you to run the clean-up committee. Activate at The Corner: accept (+2 Community) or decline (+1 Street Cred).
2. **"The Block Meeting"** — You missed the meeting and they voted on something that affects you. Activate at Park: catch up and object (+1 Wisdom) or accept the outcome (+1 Community).
3. **"The Block Newsletter"** — Your business got written up in the block newsletter — good or bad, depending who you ask. Activate at Bodega: lean into the spotlight (+2 Reputation) or ask for a correction (+1 Community).
4. **"The Block Party Application"** — You filed the permit and the city is dragging their feet. Activate at Park: throw it anyway (+2 Street Cred, −1 Reputation) or wait it out (+1 Community).
5. **"The Block Christmas"** — You volunteered to do the block's Christmas lights and it's a lot. Activate at The Corner: go all out (+2 Reputation) or keep it simple (+1 Community).
6. **"The Block Halloween"** — Your house is the one all the kids trust for real candy. Activate at The House: keep the tradition (+2 Community) or pass the torch (+1 Wisdom).
7. **"The Block Clean-Up"** — You organized the clean-up day and half the block didn't show. Activate at Park: call them out (+1 Street Cred) or thank who came (+2 Community).
8. **"The Block Watch"** — You joined the block watch text chain and now you're in everybody's business. Activate at The Corner: stay in it (+1 Wisdom) or mute the chat (+1 Street Cred).
9. **"The Block Social Media"** — You started the block's group page and now you're the moderator. Activate at Bodega: keep the peace (+2 Community) or let the drama ride (+1 Reputation).
10. **"The Block Easter"** — You hid the eggs and one kid found none. Activate at Park: make it right (+2 Community) or let it be a lesson (+1 Wisdom).

**Chain Complete:** +3 Community, +1 Wisdom. Special Achievement: *Block Captain, For Real* — permanently unlocks the Community Organizer Hustle's *Call the Meeting* power for any character.

---

### Chain 14: The Chair (9 nodes)

*Everybody's story runs through the shop eventually.*

1. **"The Hair Appointment"** — You gave the barber/stylist your honest opinion. They haven't spoken to you since. Activate next visit: diplomacy (+1 Community) or avoidance (+1 Street Cred). Resolve: apologize (+2 Reputation) or double down (+1 Street Cred, −1 Community).
2. **"The Relaxer Burn"** — The relaxer burned your scalp and you cried. Activate at Beauty Shop: own it (+1 Community) or blame the stylist (+2 Street Cred).
3. **"The Edge Control Incident"** — Your edges were laid but the humidity said otherwise. Activate at Beauty Shop: reapply (+1 Street Cred) or let it be (+1 Community).
4. **"The Deep Condition Treatment"** — You fell asleep during the deep condition and woke up with a neck cramp. Activate at Beauty Shop: laugh it off (+1 Community) or demand a discount (+1 Street Cred).
5. **"The Silk Press Failure"** — You got a silk press and it rained 2 hours later. Activate at Beauty Shop: redo it (+1 Street Cred) or embrace the shrinkage (+1 Community).
6. **"The Lace Front Incident"** — Your lace front started lifting in the middle of the cookout. Activate at Beauty Shop: fix it (+1 Street Cred) or let it ride (+1 Community).
7. **"The Beauty School Discount"** — Your cousin in beauty school gave you a free cut but it went wrong. Activate at Beauty Shop: wear it proudly (+1 Community) or fix it in secret (+1 Street Cred).
8. **"The Hair Journey"** — You stopped relaxing and went natural. Activate at Beauty Shop: get support (+2 Community) or defend your choice (+2 Reputation).
9. **"The Wig Transformation"** — You put on a wig and nobody recognized you. Activate at Beauty Shop: reveal it (+2 Community) or keep the mystery (+1 Reputation).

**Chain Complete:** +2 Wisdom, +2 Community. Special Achievement: *Regular* — permanently unlocks the Beauty Shop Insider Origin's *The Intel* ability for any character.

---

## Supporting Systems

### Cipher Cards (12)

Each symbol is a cultural concept, not a generic mechanic — see Section 11.2 of the ruleset for full RPG-mode context.

1. ☮ **Peace** — No beef this round. No winner. Everyone gains +1 Community.
2. 🔥 **Barbershop Truth** — Cards read anonymously. No one knows who played what until after judging.
3. 💰 **Block Watch** — Everyone re-plays from hand. Chaos ensues.
4. 📻 **Side Door** — Lowest-Reputation player gets one free submission from the discard pile.
5. 🎤 **Mic Drop** — Round winner draws one extra Receipt.
6. 👑 **Crown** — The O.G. wins automatically. Their word is final.
7. 🍖 **Potluck** — Everyone contributes one card to a shared pool. The O.G. picks from the collective.
8. 🔁 **Rewind** — Undo the last Receipt. The story changes.
9. ⚡ **Flash** — All players reveal one card from hand.
10. 🎯 **Target** — The O.G. calls out one player. That player must play an extra card.
11. 🤝 **Handshake** — The two lowest-Reputation players form an automatic alliance. Shared victory.
12. 🔥 **Fire** — The highest-Street-Cred player chooses one stat to boost by +2.

### Origins (8)

Full stat bonuses, Special Abilities, starting locations, and contacts are in Section 2.1 of the ruleset. Quick reference:

1. **The Church Child** — pews, usher board by 12, choir director by 16
2. **The Block Product** — porch headquarters, the corner, the neighborhood watch
3. **The Beauty Shop Insider** — under the dryer, between presses, knows all the tea
4. **The Cookout Regular** — every family reunion, every barbecue, knows the DJ and the plate line
5. **The HBCU Student** — homecoming weekend, yard show, marching band
6. **The Creative** — makes beats, art, designs; sees beauty where others see struggle
7. **The Hustler** — candy out the locker, flipping everything into something bigger
8. **The Protector** — neighborhood watch, big sibling, looks out for everybody on the block

### Hustles (8)

Full six-power progressions are in Section 2.2 of the ruleset. Quick reference (Power 1 of 6):

1. **Street Hustler** — *The Pitch*: re-roll any card once per round
2. **Community Organizer** — *Call the Meeting*: form alliance with +1 member
3. **Creative** — *The Blank*: add 1 blank to any black card
4. **Entrepreneur** — *Front the Cash*: spend 1 Reputation for 2 Street Cred
5. **Student** — *Peek*: see an opponent's hand once per round
6. **Elder** — *The Look*: silence chat for 10 seconds
7. **Diplomat** — *Handshake*: +1 Community when forming an alliance
8. **Rebel** — *No Cooperation*: +2 Street Cred when solo

### Locations (24)

The original AAVE-EXPANDED draft had 12 locations with mechanical bonuses; ULTRA-EXPANDED added 12 more with flavor text only. Merged and completed here — every location now carries a bonus.

| # | Location | Flavor | Mechanical Bonus |
|---|---|---|---|
| 1 | The Barbershop | Where the real news get passed. The chair is the confessional. | +1 Wisdom, can gather intel |
| 2 | The Beauty Shop | Where the tea gets spilled and the edges get laid. | +1 Community, can spread rumors |
| 3 | The Bodega | Where you can get everything from a snack to a blessing. | +1 Street Cred, can acquire items |
| 4 | The Park | Where the elders play dominoes and the kids play basketball. | +1 Community, can form alliances |
| 5 | The House | Where you can be yourself. The fridge always got something. | +1 Reputation, safe space |
| 6 | The Corner | Where the block watches, the music plays, the business happens. | +2 Street Cred, risk/reward |
| 7 | Church | Where the spirit lives and the community gathers. | +1 Community, +1 Reputation |
| 8 | School | Where the future gets made. | +1 Wisdom, can investigate |
| 9 | Cookout Spot | Where the family gathers and the food is endless. | +2 Community, alliance bonuses |
| 10 | Vacant Lot | Where anything can happen. Where the block dreams. | Wild card, +2 to any stat |
| 11 | The Courthouse | Where the system meets the streets. | +1 Reputation, can fight the system |
| 12 | The Studio | Where the art gets made, the beat drops. | +1 Wisdom, can create art |
| 13 | Community Center | Where the meetings happen, the kids play, the block organizes. | +1 Community, can organize events |
| 14 | The Library | Where the history lives and the quiet revolution starts. | +1 Wisdom, can research |
| 15 | The Playground | Where the kids learn and the block protects its own. | +1 Community; +1 Reputation if protecting kids |
| 16 | The Basketball Court | Where the trash talk flows and the skills get tested. | +2 Street Cred, sports conflicts |
| 17 | The Street | Where the life happens. Where the block never sleeps. | +1 Street Cred, wildcard encounters |
| 18 | The Porch | Where the elders sit and the tea gets passed. | +1 Wisdom, passive intel-gathering |
| 19 | The Kitchen | Where the food gets made and the recipes get passed down. | +1 Community, cooking bonuses |
| 20 | The Living Room | Where the family gathers and the arguments get settled. | +1 Community, safe space for conflict resolution |
| 21 | The Backyard | Where the cookout happens and the adults talk grown-folks business. | +1 Community, cookout-adjacent bonus |
| 22 | The Front Steps | Where the neighbors greet each other and the block watch happens. | +1 Community, neighbor-watch bonus |
| 23 | The Laundromat | Where the gossip flows and the block catches up. | +1 Wisdom, passive intel-gathering |
| 24 | The Pool Hall | Where the game gets played and the respect gets earned. | +2 Street Cred, gambling/respect |

---

## Final Counts

| Card Type | Count |
|---|---:|
| Black Scenario Cards | 577 |
| White Response Cards | 539 |
| Receipt Cards (in 14 Chains) | 130 |
| Cipher Cards | 12 |
| Origins | 8 |
| Hustles | 8 |
| Locations | 24 |
| **Total unique cards/systems** | **1,298** |

This exceeds the 200 Black / 350 White / 100 Receipt / 12 Cipher print-and-play target in `GRIT-MODERNISM-RPG-RULES.md` Section 16.1 — that section describes a physical print run sized for cost, not a creative ceiling. For a physical deck, treat this database as the full pool and print a curated subset; for digital/online play, ship the whole thing.

## Compilation Notes

- Source files: `CONTENT-AAVE-EXPANDED.md`, `CONTENT-HYPER-EXPANDED.md`, `CONTENT-ULTRA-EXPANDED.md` (kept in the repo as drafting history, superseded by this file for implementation).
- Dedup method: exact-text match, then fuzzy word-overlap match (Jaccard similarity ≥ 0.72 on stopword-stripped word sets) to catch near-identical rewrites across the three source files.
- The "Block & Neighborhood" Receipt category (10 entries, originally in `CONTENT-HYPER-EXPANDED.md`) had titles with no working mechanic — just scenario-style fill-in-the-blank fragments. Rebuilt with real Activate/Resolve choices; see Chain 13.
- Location list merged from two source lists: `CONTENT-AAVE-EXPANDED.md` Part 8 (12 locations, had mechanical bonuses, no flavor text) and `CONTENT-ULTRA-EXPANDED.md`'s "Expanded Location Descriptions" (24 locations, had flavor text, no mechanical bonuses). Bonuses for locations 13–24 were newly assigned here, following the pattern of the original 12.
- White Card effect assignment is deterministic (a hash of each card's exact text selects among its category's effect templates) — see "How White Card effects were assigned" above. This is documented, not hidden, so a Griot designing new cards for a category can follow the same pattern.

## Where This Plugs In

- **Ruleset:** `GRIT-MODERNISM-RPG-RULES.md` — the full Griot Modernism RPG system this database feeds. Section 3.2 defines the six effect-type families used above; Section 9 defines Receipt Chains.
- **Shipped app:** `index.html` — the current `BLACK_CARDS` / `WHITE_CARDS` / `DICE_EFFECTS` arrays are a much smaller, separate pool (per `CLAUDE.md`, the shipped CAH-style game and the RPG vision are not yet connected). Wiring this database into the app is separate follow-up work, not done here.
