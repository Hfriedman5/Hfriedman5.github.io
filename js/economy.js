// The town's shared economy: the captain's daily sea report and the Athenian Exchange in the Bank.
// Everything here is worked out from the date alone, so every visitor sees the same sea and the same market,
// and reloading never rerolls anything.

// A repeatable random number in [0, 1) for any key, like '2026-10-9:crete:sea'.
export const seeded = (key) => { let h = 2166136261; for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 15; return ((Math.imul(h, 2246822507) >>> 0) % 1e6) / 1e6; };
const pickBy = (table, r) => table.find((row) => (r -= row[2]) < 0) || table[table.length - 1];
export const dayKeyOf = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/* ---------------- The sea report ---------------- */
// Every day each route gets its own sea and its own market, so the best voyage changes from day to day.
export const ROUTES = [
  { id: 'aegina', name: 'Aegina', hours: 2, gain: .1, risk: 0, cargo: 'pistachios' },
  { id: 'crete', name: 'Crete', hours: 4, gain: .5, risk: .2, cargo: 'olive oil' },
  { id: 'egypt', name: 'Egypt', hours: 8, gain: 1, risk: .35, cargo: 'grain' },
];
const SEAS = [['calm seas', .5, .3], ['choppy seas', 1, .45], ['storms at sea', 1.6, .25]];   // effect on sinking risk, how often
const MARKETS = [['low', .6, .25], ['normal', 1, .5], ['high', 1.4, .25]];                     // effect on profit, how often
// One route's conditions on one day (before any Machine Room weather is added on top).
export function seaFor(rt, date) {
  const key = dayKeyOf(date);
  const sea = pickBy(SEAS, seeded(`${key}:${rt.id}:sea`)), market = pickBy(MARKETS, seeded(`${key}:${rt.id}:market`));
  return { sea: sea[0], storm: sea[1] > 1, calm: sea[1] < 1, demand: market[0], gain: Math.round(rt.gain * market[1] * 100) / 100, risk: rt.risk ? rt.risk * sea[1] : sea[1] > 1 ? .08 : 0 };
}
const route = (id) => ROUTES.find((r) => r.id === id);
const demandScore = (s) => (s.demand === 'high' ? 1 : s.demand === 'low' ? -1 : 0);

/* ---------------- The Athenian Exchange ---------------- */
// Seven businesses, one weekly profit report each, one report every day of the week.
// What moves a company is written into its `news` function: each day it adds up good and bad signs from things
// visitors can see (the sea report, the season, the day's headlines). The market only half believes the news while
// it happens; the rest shows up when the company reports, so paying attention gives you an edge (but not a sure thing).
// Seasons nudge some companies every day they last. The Exchange shows the current season (and the next one coming)
// so nobody has to remember that the olive harvest began weeks ago.
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const SEASONS = [
  { name: 'The olive harvest', months: [9, 10, 11], co: 'olive', effect: .01, says: 'good for Athena Olive Press' },
  { name: 'Summer sailing season', months: [5, 6, 7], co: 'tours', effect: .02, says: 'busy for Acropolis Tours' },
  { name: 'Winter', months: [11, 0, 1], co: 'tours', effect: -.01, says: 'quiet for Acropolis Tours' },
];
const seasonal = (co, d) => SEASONS.filter((s) => s.co === co && s.months.includes(d.getMonth())).reduce((t, s) => t + s.effect, 0);
// Athens had no weekends, but it did stop for festivals. The Exchange closes on these days: prices hold still and
// trading pauses, news keeps happening, and any report due that day moves to the next open day.
export const FESTIVALS = [
  { name: 'Lenaia', month: 0, day: 26, days: 1, about: 'a winter festival of Dionysus, with comic plays' },
  { name: 'Great Dionysia', month: 2, day: 28, days: 2, about: 'the great festival of Dionysus, with days of plays in the theater' },
  { name: 'Thargelia', month: 4, day: 25, days: 1, about: 'a festival of Apollo and the first harvest' },
  { name: 'Panathenaia', month: 7, day: 14, days: 2, about: 'Athena\'s birthday festival, with a grand procession up the Acropolis' },
  { name: 'Thesmophoria', month: 9, day: 26, days: 1, about: 'a festival of Demeter, kept by the women of Athens' },
];
export const festivalOn = (d) => FESTIVALS.find((f) => f.month === d.getMonth() && d.getDate() >= f.day && d.getDate() < f.day + f.days) || null;
export const dateText = (d) => `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
export const nextOpen = (d) => { let x = addDays(d, 1); while (festivalOn(x)) x = addDays(x, 1); return x; };

// What is in season today, and what starts next month, plus any festival closing the Exchange this week.
export function seasonLines(d = new Date()) {
  const m = d.getMonth(), next = (m + 1) % 12;
  const now = SEASONS.filter((s) => s.months.includes(m)).map((s) => `${s.name} runs through ${MONTH_NAMES[s.months.at(-1)]}: ${s.says}.`);
  const soon = SEASONS.filter((s) => s.months[0] === next).map((s) => `Coming up: ${s.name.toLowerCase()} starts ${MONTH_NAMES[next]} 1, ${s.says}.`);
  const today = festivalOn(d);
  for (let i = 1; i <= 7 && !today; i++) {
    const f = festivalOn(addDays(d, i));
    if (f) { soon.unshift(`Coming up: the Exchange closes ${dateText(addDays(d, i))} for the ${f.name}, ${f.about}. News keeps happening while it is closed, so prices can jump when it reopens.`); break; }
  }
  return { now: now.length ? now : ['No season is affecting the market right now.'], soon };
}

export const COMPANIES = [
  { id: 'olive', name: 'Athena Olive Press', day: 1, e0: 4, M: 9, payout: .72,
    makes: 'Presses olives and ships the oil.', watch: 'Demand for olive oil on the Crete route in the captain\'s sea report, and the olive harvest (October to December).',
    news: (d, s) => .04 * demandScore(s.crete) + seasonal('olive', d),
    good: 'A second olive press opens at Athena Olive Press.', bad: 'A cracked millstone halts the Athena Olive Press.' },
  { id: 'ship', name: 'Piraeus Shipyard', day: 2, e0: 5.5, M: 9, payout: .6,
    makes: 'Builds and repairs ships.', watch: 'Storms in the sea report. Storms are good for business: damaged and sunk ships need replacing.',
    news: (d, s) => ROUTES.reduce((t, r) => t + (s[r.id].storm ? .025 : s[r.id].calm ? -.005 : 0), 0),
    good: 'The navy orders new triremes from Piraeus Shipyard.', bad: 'A timber shortage slows work at Piraeus Shipyard.' },
  { id: 'pottery', name: 'Agora Pottery', day: 3, e0: 2.5, M: 8, payout: .6,
    makes: 'Makes amphorae, the jars that oil and grain ship in.', watch: 'Last week\'s demand for olive oil and grain. Orders for jars come a week after the cargo does.',
    news: (d, s, past) => .03 * (demandScore(past.crete) + demandScore(past.egypt)),
    good: 'Agora Pottery wins a contract for new temple vases.', bad: 'A kiln fire damages the Agora Pottery workshop.' },
  { id: 'pistachio', name: 'Aegina Pistachio Growers', day: 4, e0: 3, M: 8.5, payout: .66,
    makes: 'Grows pistachios on Aegina and ships them to Athens.', watch: 'Demand for pistachios on the Aegina route, and storms there that hold the boats in port.',
    news: (d, s) => .05 * demandScore(s.aegina) - (s.aegina.storm ? .02 : 0),
    good: 'Aegina\'s pistachio harvest is the biggest in years.', bad: 'Pests hit the pistachio orchards on Aegina.' },
  { id: 'grain', name: 'Nile Grain Traders', day: 5, e0: 4.5, M: 9, payout: .72,
    makes: 'Buys grain in Egypt and ships it to Athens.', watch: 'Demand for grain on the Egypt route, and storms there that sink cargo.',
    news: (d, s) => .04 * demandScore(s.egypt) - (s.egypt.storm ? .03 : 0),
    good: 'The Nile floods right on schedule, promising a big grain harvest.', bad: 'A low Nile means a thin grain harvest this year.' },
  { id: 'silver', name: 'Laurion Silver Mines', day: 6, e0: 6, M: 11, payout: .92, events: .3,
    makes: 'Mines the silver that Athens turns into coins.', watch: 'Only the headlines. The mines ignore the sea, so news from Laurion is the whole story. It pays the biggest share of its profit out to owners.',
    news: () => 0,
    good: 'Miners strike a rich new silver vein at Laurion.', bad: 'Flooding closes a shaft at the Laurion mines.' },
  { id: 'tours', name: 'Acropolis Tours', day: 0, e0: 3.5, M: 8, payout: .55,
    makes: 'Guides visitors around the Acropolis.', watch: 'Calm seas, since visitors arrive by boat, and the season: busy in summer, quiet in winter.',
    news: (d, s) => ROUTES.reduce((t, r) => t + (s[r.id].calm ? .02 : s[r.id].storm ? -.02 : 0), 0) + seasonal('tours', d),
    good: 'A famous poet will perform at the Acropolis this week.', bad: 'Rumors of pirates keep visitors away from Athens.' },
];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const coById = (id) => COMPANIES.find((c) => c.id === id);
const EPOCH = new Date(2026, 6, 1); // the market's first day; its history is replayed from here
const BELIEF = .35;                 // how much of the week's news the price takes in before the report

// Replays every day from EPOCH to `today` and returns each company's price history, reports, and the news.
let cached = null;
export function market(today = new Date()) {
  const key = dayKeyOf(today);
  if (cached?.key === key) return cached;
  const seas = (d) => Object.fromEntries(ROUTES.map((r) => [r.id, seaFor(r, d)]));
  const state = Object.fromEntries(COMPANIES.map((c) => [c.id, { F: c.e0, sum: 0, u: 0, last: null, days: [], owed: false }]));
  const news = [];
  for (let d = new Date(EPOCH); d <= today; d = addDays(d, 1)) {
    const k = dayKeyOf(d), s = seas(d), past = seas(addDays(d, -7)), headlines = [], fest = festivalOn(d);
    if (fest) headlines.push({ text: `The Exchange is closed today for the ${fest.name}.` });
    for (const c of COMPANIES) {
      const st = state[c.id];
      // Today's signs for this company: the sea and season, plus now and then a piece of company news.
      let n = c.news(d, s, past);
      const roll = seeded(`${k}:${c.id}:event`);
      if (roll < (c.events || .12)) {
        const good = seeded(`${k}:${c.id}:mood`) < .5, size = .06 + seeded(`${k}:${c.id}:size`) * .08;
        n += good ? size : -size;
        headlines.push({ co: c.id, text: good ? c.good : c.bad, good });
      }
      st.sum += n;
      if (fest) { // closed: the price holds, and a report due today waits for the next open day
        if (d.getDay() === c.day) st.owed = true;
        const prev = st.days.at(-1);
        st.days.push({ key: k, price: prev ? prev.price : c.M * st.F, report: null, expected: st.F * (1 + BELIEF * st.sum), closed: fest.name });
        continue;
      }
      // Day-to-day jitter that fades: the market sometimes just disagrees for a while.
      st.u = .7 * st.u + (seeded(`${k}:${c.id}:noise`) - .5) * .03;
      let report = null;
      if (d.getDay() === c.day || st.owed) {
        st.owed = false;
        // This week's profit: the company's normal level (growing slowly), pushed up or down by the week's signs, plus some luck.
        const base = c.e0 * Math.pow(1.003, (d - EPOCH) / 6048e5), luck = (seeded(`${k}:${c.id}:luck`) - .5) * .12;
        const e = base * (1 + st.sum) * (1 + luck);
        const expected = st.F * (1 + BELIEF * st.sum);
        report = { e, expected, surprise: e / expected - 1, dividend: Math.max(0, Math.round(c.payout * e * 10) / 10) };
        st.F = .6 * e + .4 * st.F; st.sum = 0; st.last = report; // the market's next guess leans on this week's number
        headlines.push({ co: c.id, report: true, good: report.surprise >= 0, text: `${c.name} reports a profit of ${report.e.toFixed(1)} per share, ${Math.abs(Math.round(report.surprise * 100))}% ${report.surprise >= 0 ? 'above' : 'below'} what the market expected.` });
      }
      const price = Math.max(5, c.M * st.F * (1 + BELIEF * st.sum) * (1 + st.u));
      st.days.push({ key: k, price, report, expected: st.F * (1 + BELIEF * st.sum) });
    }
    // The sea report makes the news too: storms and unusual demand on each route.
    for (const r of ROUTES) {
      if (s[r.id].storm) headlines.push({ text: `Storms at sea on the ${r.name} route.` });
      if (s[r.id].demand !== 'normal') headlines.push({ text: `${s[r.id].demand === 'high' ? 'High' : 'Little'} demand for ${r.cargo} on the ${r.name} route.` });
    }
    if (d.getDate() === 1 && d.getMonth() === 9) headlines.push({ text: 'The olive harvest begins across Attica.' });
    if (d.getDate() === 1 && d.getMonth() === 0) headlines.push({ text: 'The olive harvest is over for the year.' });
    if (d.getDate() === 1 && d.getMonth() === 5) headlines.push({ text: 'Summer sailing season begins. Visitors are on their way to Athens.' });
    if (d.getDate() === 1 && d.getMonth() === 11) headlines.push({ text: 'Winter arrives. Fewer visitors make the trip to Athens.' });
    news.push({ key: k, date: new Date(d), headlines });
  }
  cached = { key, companies: Object.fromEntries(COMPANIES.map((c) => [c.id, state[c.id].days])), news, owed: Object.fromEntries(COMPANIES.map((c) => [c.id, state[c.id].owed])) };
  return cached;
}
// When a company reports next, in days from today, and whether a festival moved it.
export function nextReport(c, m, today = new Date()) {
  let owed = m.owed[c.id];
  for (let i = 1; i <= 21; i++) {
    const d = addDays(today, i), f = festivalOn(d);
    if (f) { if (d.getDay() === c.day) owed = f.name; continue; }
    if (owed || d.getDay() === c.day) return { days: i, date: d, moved: owed && d.getDay() !== c.day ? (typeof owed === 'string' ? owed : festivalOn(today)?.name) : null };
  }
  return { days: 7, date: addDays(today, 7), moved: null };
}
/* ---------------- The farm: crops and what Demetrios pays for them ---------------- */
// Slower crops pay more per harvest; faster ones pay more per hour, if you come back often to replant.
export const CROPS = [
  { id: 'radish', name: 'Radishes', seedName: 'Radish seeds', one: 'bunch of radishes', many: 'bunches of radishes', cost: 10, hours: 1, price: 25 },
  { id: 'wheat', name: 'Wheat', seedName: 'Wheat seeds', one: 'sheaf of wheat', many: 'sheaves of wheat', cost: 30, hours: 8, price: 90 },
  { id: 'grapes', name: 'Grapes', seedName: 'Grape vines', one: 'basket of grapes', many: 'baskets of grapes', cost: 60, hours: 24, price: 200 },
  { id: 'olives', name: 'Olives', seedName: 'Olive saplings', one: 'basket of olives', many: 'baskets of olives', cost: 100, hours: 72, price: 400 },
];
// What the workshop makes from them. Each sells for about 40% more than the crop it came from.
export const GOODS = [
  { id: 'bread', name: 'Bread', one: 'loaf of bread', many: 'loaves of bread', price: 130 },
  { id: 'wine', name: 'Wine', one: 'amphora of wine', many: 'amphorae of wine', price: 290 },
  { id: 'oil', name: 'Olive oil', one: 'amphora of olive oil', many: 'amphorae of olive oil', price: 560 },
];
export const STATIONS = [
  { id: 'oven', name: 'Bread oven', cost: 400, from: 'wheat', makes: 'bread', hours: 1, verb: 'bake', doing: 'Baking', what: 'Each sheaf of wheat bakes into a loaf of bread.' },
  { id: 'winepress', name: 'Wine press', cost: 1200, from: 'grapes', makes: 'wine', hours: 24, verb: 'press', doing: 'Fermenting', what: 'Each basket of grapes makes an amphora of wine.' },
  { id: 'oilpress', name: 'Olive press', cost: 2500, from: 'olives', makes: 'oil', hours: 12, verb: 'press', doing: 'Pressing', what: 'Each basket of olives makes an amphora of olive oil.' },
];
export const cropById = (id) => CROPS.find((c) => c.id === id);
export const produceById = (id) => CROPS.find((c) => c.id === id) || GOODS.find((g) => g.id === id);
const CROP_MARKETS = [['low', .8, .25], ['normal', 1, .5], ['high', 1.25, .25]];
// Today's price for one harvest (or one thing made from it): a daily ups and downs (the same for everyone), plus two seasons:
// grapes sell high in the two weeks before the Great Dionysia, olives during the olive harvest.
export function cropPrice(crop, date = new Date()) {
  const day = pickBy(CROP_MARKETS, seeded(`${dayKeyOf(date)}:crop:${crop.id}`));
  let mult = day[1], note = day[0] === 'normal' ? '' : day[0] === 'high' ? 'in demand today' : 'not much demand today';
  const m = date.getMonth(), dd = date.getDate();
  if ((crop.id === 'grapes' || crop.id === 'wine') && m === 2 && dd >= 14 && dd <= 29) { mult *= 1.4; note = 'the Great Dionysia is coming'; }
  if (crop.id === 'olives' && [9, 10, 11].includes(m)) { mult *= 1.25; note = 'olive harvest season'; }
  return { price: Math.round(crop.price * mult), note };
}

// The price a trade happens at: whole coins.
export const tradePrice = (p) => Math.max(1, Math.round(p));
