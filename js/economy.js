// The town's shared economy: the captain's daily sea report and the Athenian Exchange in the Bank.
// Every visitor sees the same sea and the same market, and reloading never rerolls anything. Each day's luck comes from
// the date plus, from FAIR_FROM on, a random number the server draws for that day (part E of the cloud SQL). The server
// only hands out days that have already started in New York, so nobody can work out tomorrow's market ahead of time.

// A repeatable random number in [0, 1) for any key, like '2026-10-9:crete:sea'.
export const seeded = (key) => { let h = 2166136261; for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 15; return ((Math.imul(h, 2246822507) >>> 0) % 1e6) / 1e6; };
const pickBy = (table, r) => table.find((row) => (r -= row[2]) < 0) || table[table.length - 1];
export const dayKeyOf = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// The sea and the Exchange keep New York time, so a new day starts at the same moment for everyone, wherever they play.
const NY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric' });
let todayMemo = { at: -Infinity, day: null }; // the farm asks many times a frame, so remember it for a second
export function marketToday(now) {
  if (!now && Date.now() - todayMemo.at < 1000) return todayMemo.day;
  const p = Object.fromEntries(NY.formatToParts(now || new Date()).map((x) => [x.type, x.value]));
  const day = new Date(Number(p.year), Number(p.month) - 1, Number(p.day));
  if (!now) todayMemo = { at: Date.now(), day };
  return day;
}
const NY_TIME = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
// The moment a New York day begins (midnight there is 4am or 5am UTC, depending on daylight saving).
export function nyStart(day) {
  for (const h of [4, 5]) { const t = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), h); if (dayKeyOf(marketToday(new Date(t))) === dayKeyOf(day) && nyHours(new Date(t)) === 0) return t; }
  return Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), 5);
}
const nyHours = (now) => { const p = Object.fromEntries(NY_TIME.formatToParts(now).map((x) => [x.type, x.value])); return Number(p.hour) + Number(p.minute) / 60; };
// From FAIR_FROM on, a day's luck needs that day's number from the server; until it arrives, the day has not happened
// here yet. Days before FAIR_FROM replay exactly as they always did, so no past price changes.
export const FAIR_FROM = new Date(2026, 9, 13); // launch day: the first New York day after the update went live
const drawn = {}; // dayKeyOf keys -> the server's number for that day
export const useSeeds = (map) => { Object.assign(drawn, map); };
const dayTag = (d) => { const k = dayKeyOf(d); return d < FAIR_FROM ? k : drawn[k] ? `${k}#${drawn[k]}` : null; };
// Prices move at four moments a day from FAIR_FROM on: midnight (the day's number), then 6am, noon, and 6pm New York time,
// each with its own number from the server, handed out only when that moment arrives.
export const TICKS = 4, TICK_NAMES = ['midnight', '6am', 'noon', '6pm'];
const slotTag = (d, j) => { const k = `${dayKeyOf(d)}#${j}`; return drawn[k] ? `${k}#${drawn[k]}` : null; };

/* ---------------- The sea report ---------------- */
// Every day each route gets its own sea and its own market, so the best voyage changes from day to day.
export const ROUTES = [
  { id: 'aegina', name: 'Aegina', hours: 2, gain: .1, risk: .05, cargo: 'pistachios' },
  { id: 'crete', name: 'Crete', hours: 4, gain: .5, risk: .25, cargo: 'olive oil' },
  { id: 'egypt', name: 'Egypt', hours: 8, gain: 1, risk: .42, cargo: 'grain' },
];
// A fourth, longer route that only students of Course 12 at the Academy know how to sail. It is kept out of ROUTES,
// which the Exchange reads, so the market is the same for everyone.
export const SYRACUSE = { id: 'syracuse', name: 'Syracuse', hours: 12, gain: 1.5, risk: .45, cargo: 'Sicilian grain' };
const SEAS = [['calm seas', .5, .3], ['choppy seas', 1, .45], ['storms at sea', 1.6, .25]];   // effect on sinking risk, how often
const MARKETS = [['low', .6, .25], ['normal', 1, .5], ['high', 1.4, .25]];                     // effect on profit, how often
// One route's conditions on one day (before any Machine Room weather is added on top).
export function seaFor(rt, date) {
  const tag = dayTag(date);
  if (!tag) return null; // that day's number has not arrived from the server yet
  const sea = pickBy(SEAS, seeded(`${tag}:${rt.id}:sea`)), market = pickBy(MARKETS, seeded(`${tag}:${rt.id}:market`));
  return { sea: sea[0], storm: sea[1] > 1, calm: sea[1] < 1, demand: market[0], gain: Math.round(rt.gain * market[1] * 100) / 100, risk: rt.risk * sea[1] };
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
// The Exchange closes for festivals and, from FAIR_FROM on, every Saturday. Laurion Silver, which used to report on
// Saturdays, reports on Sundays instead.
const SATURDAY = { name: 'Saturday', weekly: true };
export const closedOn = (d) => festivalOn(d) || (d >= FAIR_FROM && d.getDay() === 6 ? SATURDAY : null);
export const reportDay = (c, d) => (c.day === 6 && d >= FAIR_FROM ? 0 : c.day);
export const nextOpen = (d) => { let x = addDays(d, 1); while (closedOn(x)) x = addDays(x, 1); return x; };

// What is in season today, and what starts next month, plus any festival closing the Exchange this week.
export function seasonLines(d = marketToday()) {
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
  { id: 'olive', name: 'Athena Olive Press', day: 1, e0: 4, M: 9, payout: .94, oldPayout: .72,
    makes: 'Presses olives and ships the oil.', watch: 'Demand for olive oil on the Crete route in the captain\'s sea report, and the olive harvest (October to December).',
    news: (d, s) => .04 * demandScore(s.crete) + seasonal('olive', d),
    good: 'A second olive press opens at Athena Olive Press.', bad: 'A cracked millstone halts the Athena Olive Press.' },
  { id: 'ship', name: 'Piraeus Shipyard', day: 2, e0: 5.5, M: 9, payout: .8, oldPayout: .6,
    makes: 'Builds and repairs ships.', watch: 'Storms in the sea report. Storms are good for business: damaged and sunk ships need replacing.',
    news: (d, s) => ROUTES.reduce((t, r) => t + (s[r.id].storm ? .025 : s[r.id].calm ? -.005 : 0), 0),
    good: 'The navy orders new triremes from Piraeus Shipyard.', bad: 'A timber shortage slows work at Piraeus Shipyard.' },
  { id: 'pottery', name: 'Agora Pottery', day: 3, e0: 2.5, M: 8, payout: .8, oldPayout: .6,
    makes: 'Makes amphorae, the jars that oil and grain ship in.', watch: 'Last week\'s demand for olive oil and grain. Orders for jars come a week after the cargo does.',
    news: (d, s, past) => .03 * (demandScore(past.crete) + demandScore(past.egypt)),
    good: 'Agora Pottery wins a contract for new temple vases.', bad: 'A kiln fire damages the Agora Pottery workshop.' },
  { id: 'pistachio', name: 'Aegina Pistachio Growers', day: 4, e0: 3, M: 8.5, payout: .86, oldPayout: .66,
    makes: 'Grows pistachios on Aegina and ships them to Athens.', watch: 'Demand for pistachios on the Aegina route, and storms there that hold the boats in port.',
    news: (d, s) => .05 * demandScore(s.aegina) - (s.aegina.storm ? .02 : 0),
    good: 'Aegina\'s pistachio harvest is the biggest in years.', bad: 'Pests hit the pistachio orchards on Aegina.' },
  { id: 'grain', name: 'Nile Grain Traders', day: 5, e0: 4.5, M: 9, payout: .94, oldPayout: .72,
    makes: 'Buys grain in Egypt and ships it to Athens.', watch: 'Demand for grain on the Egypt route, and storms there that sink cargo.',
    news: (d, s) => .04 * demandScore(s.egypt) - (s.egypt.storm ? .03 : 0),
    good: 'The Nile floods right on schedule, promising a big grain harvest.', bad: 'A low Nile means a thin grain harvest this year.' },
  { id: 'silver', name: 'Laurion Silver Mines', day: 6, e0: 6, M: 11, payout: 1, oldPayout: .92, events: .3,
    makes: 'Mines the silver that Athens turns into coins.', watch: 'Only the headlines. The mines ignore the sea, so news from Laurion is the whole story. It pays all of its profit out to owners.',
    news: () => 0,
    good: 'Miners strike a rich new silver vein at Laurion.', bad: 'Flooding closes a shaft at the Laurion mines.' },
  { id: 'tours', name: 'Acropolis Tours', day: 0, e0: 3.5, M: 8, payout: .74, oldPayout: .55,
    makes: 'Guides visitors around the Acropolis.', watch: 'Calm seas, since visitors arrive by boat, and the season: busy in summer, quiet in winter.',
    news: (d, s) => ROUTES.reduce((t, r) => t + (s[r.id].calm ? .02 : s[r.id].storm ? -.02 : 0), 0) + seasonal('tours', d),
    good: 'A famous poet will perform at the Acropolis this week.', bad: 'Rumors of pirates keep visitors away from Athens.' },
];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const coById = (id) => COMPANIES.find((c) => c.id === id);
const EPOCH = new Date(2026, 6, 1); // the market's first day; its history is replayed from here
const BELIEF = .35;                 // how much of the week's news the price takes in before the report
// From this day on, companies pay out more of their profit and grow faster, so owning shares pays better. Days before it
// replay exactly as they did, so no price or past dividend changes.
const RAISE = new Date(2026, 9, 12);
const weeksBetween = (a, b) => Math.max(0, (b - a) / 6048e5);
const growth = (d) => Math.pow(1.003, weeksBetween(EPOCH, d < RAISE ? d : RAISE)) * Math.pow(1.01, weeksBetween(RAISE, d)); // 0.3% a week, then 1%

// Replays every day from EPOCH to `today` and returns each company's price history, reports, and the news.
// If today's number has not arrived from the server, it stops at yesterday and says it is waiting.
let cached = null;
export function market(today = marketToday()) {
  const live = dayKeyOf(today) === dayKeyOf(marketToday()), slotNow = live ? Math.floor(nyHours(new Date()) / (24 / TICKS)) : TICKS - 1;
  const key = `${dayKeyOf(today)}|${Object.keys(drawn).length}|${slotNow}`;
  if (cached?.key === key) return cached;
  const seas = (d) => Object.fromEntries(ROUTES.map((r) => [r.id, seaFor(r, d)]));
  const state = Object.fromEntries(COMPANIES.map((c) => [c.id, { F: c.e0, sum: 0, u: 0, last: null, days: [], owed: false }]));
  const news = [];
  let waiting = false;
  for (let d = new Date(EPOCH); d <= today; d = addDays(d, 1)) {
    const k = dayKeyOf(d), tag = dayTag(d), s = seas(d), past = seas(addDays(d, -7)), headlines = [], fest = closedOn(d);
    if (!tag || Object.values(s).includes(null) || Object.values(past).includes(null)) { waiting = true; break; }
    if (fest) headlines.push({ text: fest.weekly ? 'The Exchange is closed on Saturdays.' : `The Exchange is closed today for the ${fest.name}.` });
    const moments = d < FAIR_FROM || fest ? 1 : TICKS; // from FAIR_FROM on, an open day has four moments when prices move
    if (live && d >= today && moments > 1 && slotNow > 0 && !slotTag(d, slotNow)) waiting = true; // this moment's number is not here yet
    for (const c of COMPANIES) {
      const st = state[c.id], rate = (c.events || .12) / moments;
      // The day's signs for this company (the sea and the season), taken in a share at a time, and now and then a piece
      // of company news, which can break at any of the day's moments.
      const daily = c.news(d, s, past);
      const event = (t, at) => {
        if (seeded(`${t}:${c.id}:event`) >= rate) return 0;
        const good = seeded(`${t}:${c.id}:mood`) < .5, size = .06 + seeded(`${t}:${c.id}:size`) * .08;
        headlines.push({ co: c.id, text: good ? c.good : c.bad, good, at });
        return good ? size : -size;
      };
      if (fest) { // closed: the news still comes, the price holds, and a report due today waits for the next open day
        st.sum += daily + event(tag, 0);
        if (d.getDay() === reportDay(c, d)) st.owed = true;
        const prev = st.days.at(-1);
        st.days.push({ key: k, price: prev ? prev.price : c.M * st.F, report: null, expected: st.F * (1 + BELIEF * st.sum), closed: fest.name });
        continue;
      }
      const prices = [];
      let report = null;
      for (let j = 0; j < moments; j++) {
        const t = j ? slotTag(d, j) : tag;
        if (!t) break; // a moment that has not come yet today
        st.sum += daily / moments + event(t, j);
        if (j === 0) {
          // Day-to-day jitter that fades: the market sometimes just disagrees for a while.
          st.u = .7 * st.u + (seeded(`${tag}:${c.id}:noise`) - .5) * .03;
          if (d.getDay() === reportDay(c, d) || st.owed) {
            st.owed = false;
            // This week's profit: the company's normal level (growing slowly), pushed up or down by the week's signs, plus some luck.
            const base = c.e0 * growth(d), luck = (seeded(`${tag}:${c.id}:luck`) - .5) * .12;
            const e = base * (1 + st.sum) * (1 + luck);
            const expected = st.F * (1 + BELIEF * st.sum);
            report = { e, expected, surprise: e / expected - 1, dividend: Math.max(0, Math.round((d < RAISE ? c.oldPayout : c.payout) * e * 10) / 10) };
            st.F = .6 * e + .4 * st.F; st.sum = 0; st.last = report; // the market's next guess leans on this week's number
            headlines.push({ co: c.id, report: true, good: report.surprise >= 0, text: `${c.name} reports a profit of ${report.e.toFixed(1)} per share, ${Math.abs(Math.round(report.surprise * 100))}% ${report.surprise >= 0 ? 'above' : 'below'} what the market expected.` });
          }
        }
        prices.push(Math.max(5, c.M * st.F * (1 + BELIEF * st.sum) * (1 + st.u)));
      }
      st.days.push({ key: k, price: prices.at(-1), ...(moments > 1 ? { ticks: prices } : {}), report, expected: st.F * (1 + BELIEF * st.sum) });
    }
    headlines.sort((a, b) => (a.at || 0) - (b.at || 0));
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
  cached = { key, waiting, companies: Object.fromEntries(COMPANIES.map((c) => [c.id, state[c.id].days])), news, owed: Object.fromEntries(COMPANIES.map((c) => [c.id, state[c.id].owed])),
    signs: Object.fromEntries(COMPANIES.map((c) => [c.id, { sum: state[c.id].sum, F: state[c.id].F }])) };
  return cached;
}
// When a company reports next, in days from today, and whether a festival moved it.
export function nextReport(c, m, today = marketToday()) {
  let owed = m.owed[c.id];
  for (let i = 1; i <= 21; i++) {
    const d = addDays(today, i), f = closedOn(d);
    if (f) { if (d.getDay() === reportDay(c, d)) owed = f.name; continue; }
    if (owed || d.getDay() === reportDay(c, d)) return { days: i, date: d, moved: owed && d.getDay() !== reportDay(c, d) ? (typeof owed === 'string' ? owed : closedOn(today)?.name) : null };
  }
  return { days: 7, date: addDays(today, 7), moved: null };
}
// What the news so far says about a company's next report: above zero means a profit above what the market expects.
// It cannot see news still to come or the luck of the report itself, so it is a lean, not an answer. Thales reads it.
export function outlook(c, m, reportDate) {
  const s = m.signs[c.id];
  return (c.e0 * growth(reportDate) * (1 + s.sum)) / (s.F * (1 + BELIEF * s.sum)) - 1;
}
/* ---------------- The farm: crops and what Demetrios pays for them ---------------- */
// Slower crops pay more per harvest; faster ones pay more per hour, if you come back often to replant.
export const CROPS = [
  { id: 'radish', name: 'Radishes', seedName: 'Radish seeds', one: 'bunch of radishes', many: 'bunches of radishes', cost: 10, hours: 1, price: 25 },
  { id: 'wheat', name: 'Wheat', seedName: 'Wheat seeds', one: 'sheaf of wheat', many: 'sheaves of wheat', cost: 30, hours: 8, price: 90 },
  { id: 'grapes', name: 'Grapes', seedName: 'Grape vines', one: 'basket of grapes', many: 'baskets of grapes', cost: 60, hours: 24, price: 200 },
  { id: 'olives', name: 'Olives', seedName: 'Olive saplings', one: 'basket of olives', many: 'baskets of olives', cost: 100, hours: 72, price: 400 },
];
// What the workshop makes from them. Each sells for about twice what the crop it came from does.
export const GOODS = [
  { id: 'bread', name: 'Bread', one: 'loaf of bread', many: 'loaves of bread', price: 180 },
  { id: 'wine', name: 'Wine', one: 'amphora of wine', many: 'amphorae of wine', price: 400 },
  { id: 'oil', name: 'Olive oil', one: 'amphora of olive oil', many: 'amphorae of olive oil', price: 800 },
];
export const STATIONS = [
  { id: 'oven', name: 'Bread oven', cost: 400, from: 'wheat', makes: 'bread', hours: 1, verb: 'bake', doing: 'Baking', what: 'Each sheaf of wheat bakes into a loaf of bread.' },
  { id: 'winepress', name: 'Wine press', cost: 1200, from: 'grapes', makes: 'wine', hours: 24, verb: 'press', doing: 'Fermenting', what: 'Each basket of grapes makes an amphora of wine.' },
  { id: 'oilpress', name: 'Olive press', cost: 2500, from: 'olives', makes: 'oil', hours: 12, verb: 'press', doing: 'Pressing', what: 'Each basket of olives makes an amphora of olive oil.' },
];
export const cropById = (id) => CROPS.find((c) => c.id === id);
// Honey, from beehives by the farm (Course 7 at the Academy). Demetrios buys it like a crop.
export const HONEY = { id: 'honey', name: 'Honey', one: 'jar of honey', many: 'jars of honey', price: 150 };
export const produceById = (id) => CROPS.find((c) => c.id === id) || GOODS.find((g) => g.id === id) || (id === HONEY.id ? HONEY : undefined);
const CROP_MARKETS = [['low', .8, .25], ['normal', 1, .5], ['high', 1.25, .25]];
// Today's price for one harvest (or one thing made from it): a daily ups and downs (the same for everyone), plus two seasons:
// grapes sell high in the two weeks before the Great Dionysia, olives during the olive harvest.
export function cropPrice(crop, date = new Date()) {
  const day = pickBy(CROP_MARKETS, seeded(`${dayKeyOf(date)}:crop:${crop.id}`));
  let mult = day[1], note = day[0] === 'normal' ? '' : day[0] === 'high' ? 'in demand today' : 'not much demand today';
  const m = date.getMonth(), dd = date.getDate();
  if ((crop.id === 'grapes' || crop.id === 'wine') && m === 2 && dd >= 14 && dd <= 29) { mult *= 1.4; note = 'the Great Dionysia is coming'; }
  if (crop.id === 'olives' && [9, 10, 11].includes(m)) { mult *= 1.25; note = 'olive harvest season'; }
  const cm = crisisPrice(crop, date);
  if (cm > 1) { mult *= cm; note = { drought: 'the drought has pushed prices up', pests: 'pests have made it scarce', strike: 'the dock strike has made it scarce' }[crisisOn(marketToday(date)).now.type]; }
  return { price: Math.round(crop.price * mult), note };
}

/* ---------------- Crises ---------------- */
// Now and then something goes wrong in Athens, the same for everyone: pirates on one route, a strike at the docks, pests
// on one crop, or a drought. At most one at a time, about once a week. Each comes from its
// day's number from the server, so nobody knows before that day; a drought is announced the day before it starts.
export const CRISES = {
  pirates: { name: 'Pirates', days: 2 },
  strike: { name: 'Dock strike', days: 1 },
  pests: { name: 'Pests', days: 2 },
  drought: { name: 'Drought', days: 1, upTo: 3, warn: 1 },
};
const CRISIS_ODDS = 1 / 6; // on a calm day, the chance something starts
const PEST_CROPS = ['wheat', 'grapes', 'olives'];
let crisisCache = null;
// What is happening on `day` (a New York date), and what is coming: { now, soon }, each null or
// { type, target, start, end } with start and end as dates (end is the first calm day).
export function crisisOn(day = marketToday()) {
  const key = `${dayKeyOf(day)}|${Object.keys(drawn).length}`;
  if (crisisCache?.key === key) return crisisCache.out;
  let busyUntil = FAIR_FROM, last = null;
  const all = [];
  for (let d = new Date(FAIR_FROM); d <= day; d = addDays(d, 1)) {
    const tag = dayTag(d);
    if (!tag) break; // that day's number has not arrived: nothing new can start
    if (d < busyUntil) continue;
    if (seeded(`${tag}:crisis`) >= CRISIS_ODDS) continue;
    const types = Object.keys(CRISES), type = types[Math.floor(seeded(`${tag}:crisis:type`) * types.length)], def = CRISES[type];
    const r = seeded(`${tag}:crisis:target`);
    const target = type === 'pirates' ? ROUTES[Math.floor(r * ROUTES.length)].id : type === 'pests' ? PEST_CROPS[Math.floor(r * PEST_CROPS.length)] : null;
    const start = addDays(d, def.warn || 0), len = def.upTo ? def.days + Math.floor(seeded(`${tag}:crisis:len`) * (def.upTo - def.days + 1)) : def.days;
    last = { id: dayKeyOf(d), type, target, announced: new Date(d), start, end: addDays(start, len) };
    last.from = nyStart(last.start); last.to = nyStart(last.end); // as moments, for growing crops
    all.push(last); busyUntil = last.end;
  }
  const out = { now: last && day >= last.start && day < last.end ? last : null, soon: last && day < last.start ? last : null, all };
  crisisCache = { key, out };
  return out;
}
// Crop prices that day, before the drought or pests are added: see cropPrice.
const crisisPrice = (crop, date) => {
  const c = crisisOn(marketToday(date)).now;
  if (c?.type === 'drought' && CROPS.some((x) => x.id === crop.id)) return 1.2;
  if (c?.type === 'pests' && c.target === crop.id) return 1.3;
  if (c?.type === 'strike' && GOODS.some((g) => g.id === crop.id)) return 1.2;
  return 1;
};

// The price a trade happens at: whole coins.
export const tradePrice = (p) => Math.max(1, Math.round(p));

/* ---------------- The harbor order board ---------------- */
// A new order goes up every 12 hours (New York time: midnight and noon). Each asks for two or three kinds of goods at once and pays 50%
// more than Demetrios would pay for them the day it went up. An order stays up long enough to make its slowest item
// from seed, if you start right away and keep watering, plus half a day; keeping a stock lets you fill it at once.
// Orders overlap on purpose: most share an item with the one before, so you sometimes have to choose which to fill.
// Every order comes from its day's number from the server, so nobody can see one before its day begins.
const ORDER_HOURS = 12;
const BUYERS = ['A ship bound for Rhodes', 'A merchant from Corinth', 'The kitchen of the Prytaneion, where the city feeds its guests', 'Plato, who is hosting a symposium',
  'A wedding party in the Kerameikos', 'The garrison at Eleusis', 'A trader sailing for Syracuse', 'The crew of a trireme heading out on patrol', 'The family of an Olympic victor, throwing a feast'];
// id, fewest, most, how often, hours the order stays up when this is its slowest item
const ORDER_ITEMS = [['wheat', 4, 9, 1, 24], ['grapes', 2, 5, 1, 36], ['olives', 2, 4, 1, 84], ['bread', 5, 10, 1.25, 24], ['wine', 2, 4, 1.25, 60], ['oil', 1, 3, 1.25, 96]];
const ORDER_LIFE_MAX = Math.max(...ORDER_ITEMS.map((x) => x[4]));
const FESTIVAL_ORDERS = { 'Lenaia': ['wine', 'grapes'], 'Great Dionysia': ['wine', 'grapes'], 'Thargelia': ['wheat', 'bread'], 'Panathenaia': ['oil', 'olives'], 'Thesmophoria': ['bread', 'wheat'] };
// A festival in the next two weeks, if any: the first order each day is for it, and it is bigger.
function festivalSoon(d) {
  for (let i = 1; i <= 14; i++) { const f = festivalOn(addDays(d, i)); if (f && !festivalOn(addDays(d, i - 1)) && FESTIVAL_ORDERS[f.name]) return { ...f, date: addDays(d, i) }; }
  return null;
}
const slotBefore = (d, slot) => (slot > 0 ? [d, slot - 1] : [addDays(d, -1), 24 / ORDER_HOURS - 1]);
// The kinds an order would ask for on its own. The first kind always stays in the final order, so the next order can share it.
function baseKinds(d, slot) {
  const tag = dayTag(d);
  if (!tag) return null;
  const r = (what) => seeded(`${tag}:order:${slot}:${what}`), fest = slot === 0 ? festivalSoon(d) : null;
  if (fest) return { fest, kinds: FESTIVAL_ORDERS[fest.name].map((id) => ORDER_ITEMS.find((x) => x[0] === id)) };
  const pool = [...ORDER_ITEMS], kinds = [];
  for (let i = 0, n = r('kinds') < .5 ? 2 : 3; i < n; i++) {
    let roll = r(`kind${i}`) * pool.reduce((t, x) => t + x[3], 0), j = 0;
    while ((roll -= pool[j][3]) > 0) j++;
    kinds.push(pool.splice(j, 1)[0]);
  }
  return { fest: null, kinds };
}
function orderFor(d, slot) {
  const base = baseKinds(d, slot);
  if (!base) return null;
  const tag = dayTag(d), r = (what) => seeded(`${tag}:order:${slot}:${what}`), { fest } = base, kinds = [...base.kinds];
  const before = baseKinds(...slotBefore(d, slot))?.kinds[0]; // share it, 3 times in 4
  if (!fest && before && !kinds.includes(before) && r('share') < .75) kinds[kinds.length - 1] = before;
  const items = kinds.map(([id, lo, hi]) => ({ id, n: Math.round((lo + Math.floor(r(`n:${id}`) * (hi - lo + 1))) * (fest ? 1.5 : 1)) }));
  const value = items.reduce((t, x) => t + x.n * cropPrice(produceById(x.id), d).price, 0);
  return { id: `${dayKeyOf(d)}#${slot}`, buyer: fest ? `The festival stewards, for the ${fest.name} on ${dateText(fest.date)}` : BUYERS[Math.floor(r('buyer') * BUYERS.length)],
    items, value, pay: Math.round((value * 1.5) / 10) * 10, life: Math.max(...kinds.map((k) => k[4])), festival: fest?.name || null };
}
// Every order on the board right now, with how many hours each has left, soonest to come down first.
export function ordersAt(now = new Date()) {
  const today = marketToday(now), h = nyHours(now), slot = Math.floor(h / ORDER_HOURS), into = h - slot * ORDER_HOURS, out = [];
  let d = today, k = slot;
  for (let back = 0; back * ORDER_HOURS < ORDER_LIFE_MAX; back++, [d, k] = slotBefore(d, k)) {
    const o = orderFor(d, k), left = o && o.life - into - back * ORDER_HOURS;
    if (o && left > 0) out.push({ ...o, hoursLeft: left });
  }
  return { orders: out.sort((a, b) => a.hoursLeft - b.hoursLeft), nextIn: ORDER_HOURS - into };
}
