"use strict";
/* =====================================================================
   ПЕЧАТНЫЕ ЛИСТЫ ДЛЯ УРОКОВ БЕЗ УСТРОЙСТВ
   Вкладка «Печать» в каждом классе: выбор тем, числа заданий, уровня,
   количества вариантов → листы A4 с полем «Имя/Класс/Дата» + ответы для учителя.
   Клавиша P (или кнопка) — печать или «Сохранить как PDF».
   Набор задаётся числом-«зерном»: та же ссылка = те же задания (удобно делиться).
   ===================================================================== */

const LETTER = i => "АБВГДЕЖ"[i];
const PAPER_NOTE = {
  odd: tx("Обведи лишнюю фигуру.", "Артық фигураны дөңгелектеп қой."),
  sort: tx("Впиши номера фигур в нужные места.", "Фигуралардың нөмірлерін керекті орындарға жаз."),
  pattern: tx("Обведи букву правильного ответа.", "Дұрыс жауаптың әрпін дөңгелектеп қой."),
  numseq: tx("Впиши число в пустую клетку.", "Бос ұяшыққа сан жаз."),
  analogy: tx("Обведи букву правильного ответа.", "Дұрыс жауаптың әрпін дөңгелектеп қой."),
  order: tx("Впиши имена в клетки по порядку.", "Есімдерді ұяшықтарға ретімен жаз."),
  triangle: tx("Впиши число в центр последнего треугольника.", "Соңғы үшбұрыштың ортасына сан жаз."),
  signs: tx("Впиши знаки в квадратики.", "Шаршыларға таңбаларды жаз."),
  matrix: tx("Обведи букву правильного ответа.", "Дұрыс жауаптың әрпін дөңгелектеп қой."),
  deduce: t => t.mode === "houses" ? tx("Впиши имена под домами.", "Есімдерді үйлердің астына жаз.") : tx("Заполни таблицу знаками ✗ и ✓, потом впиши цвет (питомца) под каждым ребёнком.", "Кестені ✗ және ✓ белгілерімен толтыр, сосын әр баланың астына түсті (жануарды) жаз."),
  statements: tx("Обведи «Верно» или «Неверно» у каждого высказывания.", "Әр пікірдің жанындағы «Дұрыс» не «Бұрыс» сөзін дөңгелектеп қой."),
  combi: t => t.mode.endsWith("Count") ? tx("Впиши ответ. Можно перебрать варианты на черновике.", "Жауапты жаз. Нұсқаларды жоба дәптерде қарап шығуға болады.") : t.mode === "pairs" ? tx("Соедини линиями все пары, потом посчитай линии.", "Барлық жұпты сызықпен қосып, сызықтарды сана.") : tx("Запиши или нарисуй все варианты внизу. Сколько их?", "Барлық нұсқаны төменге жаз не сал. Олар нешеу?"),
  robot: t => t.mode === "bug" ? tx("Обведи неверную команду и напиши рядом верную.", "Қате команданы дөңгелектеп, жанына дұрысын жаз.") : tx("Запиши программу стрелками на строке «Программа».", "Бағдарламаны «Бағдарлама» жолына бағыттауыштармен жаз."),
  pieces: tx("Раздели силуэт линиями на эти детали (детали можно поворачивать).", "Сұлбаны сызықтармен осы бөлшектерге бөл (бөлшектерді бұруға болады)."),
  sticks: tx("Зачеркни палочку, которую перекладываешь, и дорисуй её на новом месте. Запиши верное равенство.", "Ауыстыратын таяқшаны сызып, жаңа орнына сал. Дұрыс теңдікті жаз."),
  mirror: tx("Закрась клетки второй половины (теми же цветами).", "Екінші жартысының ұяшықтарын (сол түстермен) боя."),
  rotate: tx("Обведи букву правильного ответа.", "Дұрыс жауаптың әрпін дөңгелектеп қой."),
  cube3d: tx("Обведи букву правильного ответа.", "Дұрыс жауаптың әрпін дөңгелектеп қой."),
  cubes: t => t.mode === "plan" ? tx("Впиши в каждую клетку плана, сколько там кубиков. Зелёный край — нижний край плана, оранжевый — правый.", "Жоспардың әр ұяшығына неше текше барын жаз. Жасыл шет — жоспардың төменгі шеті, қызғылт сары — оң жағы.") : tx("Впиши ответ.", "Жауапты жаз."),
  sudoku: tx("Нарисуй нужные фигуры в пустых клетках.", "Бос ұяшықтарға керекті фигураларды сал."),
  scales: tx("Впиши ответ.", "Жауапты жаз."),
  nim: tx("Обведи число.", "Санды дөңгелектеп қой."),
  river: tx("Запиши по порядку, кого фермер везёт в каждом рейсе.", "Фермердің әр рейсте кімді алып өтетінін ретімен жаз."),
  wordprob: tx("Впиши ответ. Можно нарисовать условие.", "Жауапты жаз. Шартты салып көруге болады."),
};

/* условие для бумаги: убираем «нажми / перетащи», где нужно — пишем своё */
const PAPER_Q = {
  odd: t => t.mode === "emoji" ? tx("Какой предмет лишний? Обведи его.", "Қай зат артық? Оны дөңгелектеп қой.") : tx("Какая фигура лишняя? Обведи её.", "Қай фигура артық? Оны дөңгелектеп қой."),
  deduce: t => t.mode === "houses" ? tx("Кто в каком доме живёт?", "Кім қай үйде тұрады?") : t.set === "bag" ? tx("Кому какой рюкзак?", "Кімге қай рюкзак?") : tx("У кого какой питомец?", "Кімнің қандай үй жануары бар?"),
  pieces: () => tx("Из каких деталей собран силуэт?", "Сұлба қандай бөлшектерден құралған?"),
  robot: t => t.mode === "bug" ? tx("Робот должен дойти до звезды, но в программе одна ошибка. Найди её.", "Робот жұлдызға жетуі керек, бірақ бағдарламада бір қате бар. Оны тап.") : null,
  combi: t => t.mode === "outfit" ? tx("Составь все разные наряды: в наряд входит по одной вещи каждого вида.", "Барлық түрлі киім жиынтығын құра: жиынтыққа әр түрден бір зат кіреді.")
    : t.mode === "pairs" ? tx(`${t.n} друзей решили: каждый сыграет с каждым по одной партии в шашки. Соедини линиями все пары. Сколько будет партий?`, `${t.n} дос шешті: әркім әркіммен дойбыдан бір партия ойнайды. Барлық жұпты сызықпен қос. Неше партия болады?`) : null,
};
const NO_TAP = { ru: /(нажм|нажи|перетащ|перетаскив|«Плыть»)/i, kz: /(\sбас[\s.,!—]|\sбас$|^бас\s|батырма|апар[\s.,]|сүйре)/i };
function paperQ(type, t) {
  const q = (PAPER_Q[type] && PAPER_Q[type](t)) || t.q;
  const strip = (txt, re) => { const parts = txt.split(/(?<=[.!?])\s+/); const keep = parts.filter(p => !re.test(" " + p)); return keep.length ? keep.join(" ") : txt; };
  return { ru: strip(q.ru, NO_TAP.ru), kz: strip(q.kz, NO_TAP.kz) };
}

/* ---------- краткий ответ для учителя ---------- */
const nm = o => T(o);
function answerHTML(t) {
  const P = t.people || t.P;
  switch (t.type) {
    case "odd": return `№${t.ans + 1}. ${T(t.why)}`;
    case "sort": {
      const groups = new Map(); const add = (k, i) => { if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i + 1); };
      t.items.forEach((it, i) => {
        if (t.mode === "cat") add(L(CATS[it.cat].ru, CATS[it.cat].kz), i);
        else if (t.mode === "two") add(T(ATTR[t.A].pl(it[t.A])), i);
        else if (t.mode === "table") add(L(`${COLORS[it.c].pl} ${SHAPES[it.s].pl}`, `${COLORS[it.c].kz} ${SHAPES[it.s].kzpl}`), i);
        else add({ A: L("только левый круг", "тек сол шеңбер"), AB: L("середина", "ортасы"), B: L("только правый круг", "тек оң шеңбер"), O: L("вне кругов", "шеңберден тыс") }[vennRegion(it, t.A, t.B)], i);
      });
      return [...groups].map(([k, v]) => `${k}: <b>${v.join(", ")}</b>`).join("; ");
    }
    case "pattern": return t.mode === "error" ? `№${t.ans + 1}. ${T(trackDesc(t.tracks[t.badTrack]))}` : `<b>${LETTER(t.ans)}</b>. ${t.tracks.map(tr => T(trackDesc(tr))).join(" ")}`;
    case "numseq": return `<b>${t.ans}</b>. ${T(t.desc)}`;
    case "analogy": return `<b>${LETTER(t.ans)}</b>. ${L(t.says.map(s => s.ru).join("; "), t.says.map(s => s.kz).join("; "))}`;
    case "order": return t.sol.map(p => T(P[p])).join(" ▸ ");
    case "triangle": { const r = TRI_RULES.find(x => x.id === t.rule); return `<b>${t.ans}</b>. ${L(r.ru, r.kz)}: ${r.s(...t.qn)}`; }
    case "signs": return `<b>${t.nums.map((x, i) => x + (i < t.ops.length ? ` ${t.ops[i]} ` : "")).join("")} = ${t.v}</b>`;
    case "matrix": return `<b>${LETTER(t.ans)}</b>. ${T(t.rule)}`;
    case "deduce": return t.mode === "houses" ? t.sol.map((p, h) => `№${h + 1} — ${T(P[p])}`).join(", ") : t.sol.map((v, p) => `${T(P[p])} — ${T(OWN_SETS[t.set].name(t.items[v]))}`).join(", ");
    case "statements": return t.st.map((s, i) => `${i + 1} — <b>${s.v ? L("В", "Д") : L("Н", "Б")}</b>`).join(", ") + ` <span class="mute">(${L("В — верно, Н — неверно", "Д — дұрыс, Б — бұрыс")})</span>`;
    case "combi": return t.mode === "digits" ? `<b>${t.total}</b>: ${t.all.join(", ")}` : `<b>${t.total}</b>${t.groups ? ` (${t.groups.map(g => g.items.length).join(" × ")})` : t.n ? ` (${range(t.n - 1).map(i => t.n - 1 - i).join(" + ")})` : ""}`;
    case "robot": return t.mode === "bug" ? L(`ошибка в команде №${t.bad + 1}, верно: <b>${progText([t.best[t.bad]])}</b>`, `қате №${t.bad + 1} командада, дұрысы: <b>${progText([t.best[t.bad]])}</b>`) : `<b>${progText(t.best)}</b> <span class="mute">${L("(возможны и другие верные пути)", "(басқа дұрыс жолдар да болуы мүмкін)")}</span>`;
    case "pieces": {
      const cells = []; t.pieces.forEach((p, i) => rotN(PIECES[p.kind], p.sr).forEach(([x, y]) => cells.push([x + p.sx, y + p.sy, p.col])));
      const W = Math.max(...cells.map(c => c[0])) + 1, H = Math.max(...cells.map(c => c[1])) + 1;
      return `<svg viewBox="-2 -2 ${W * 20 + 4} ${H * 20 + 4}" width="${W * 14 + 3}" height="${H * 14 + 3}">${cells.map(([x, y, c]) => `<rect x="${x * 20}" y="${y * 20}" width="20" height="20" fill="${c}" stroke="#151821" stroke-width="2"/>`).join("")}</svg>`;
    }
    case "sticks": return `<b>${t.sol.e.a} ${t.sol.e.op} ${t.sol.e.b} = ${t.sol.e.c}</b>`;
    case "mirror": {
      const { W, H, horiz } = t; const GW = horiz ? W : 2 * W, GH = horiz ? 2 * H : H; const all = {};
      Object.entries(t.cells).forEach(([k, c]) => { const [x, y] = k.split(",").map(Number); all[k] = c; all[horiz ? `${x},${2 * H - 1 - y}` : `${2 * W - 1 - x},${y}`] = c; });
      return `<svg viewBox="0 0 ${GW * 10} ${GH * 10}" width="${GW * 10}" height="${GH * 10}">${range(GH).map(y => range(GW).map(x => `<rect x="${x * 10}" y="${y * 10}" width="10" height="10" fill="${all[`${x},${y}`] ? COLORS[all[`${x},${y}`]].hex : "#fff"}" stroke="#aaa" stroke-width=".6"/>`).join("")).join("")}<line ${horiz ? `x1="0" x2="${GW * 10}" y1="${GH * 5}" y2="${GH * 5}"` : `y1="0" y2="${GH * 10}" x1="${GW * 5}" x2="${GW * 5}"`} stroke="#F03E3E" stroke-width="2"/></svg>`;
    }
    case "rotate": return `<b>${LETTER(t.ans)}</b>`;
    case "cube3d": return `<b>${LETTER(t.ans)}</b> <span class="inl">${shapeSVG({ ...CUBE_SYMS[t.ansSym], z: "big" }, 20)}</span>`;
    case "cubes": return t.mode === "plan" ? `${L("план", "жоспар")}: <b>${t.Hm.map(r => r.join(" ")).join(" / ")}</b> <span class="mute">${L("(строки сверху вниз)", "(жолдар жоғарыдан төмен)")}</span>` : `<b>${t.total}</b>`;
    case "sudoku": return `<svg viewBox="0 0 ${t.n * 20} ${t.n * 20}" width="${t.n * 17}" height="${t.n * 17}">${t.sol.map((row, r) => row.map((v, c) => `<rect x="${c * 20}" y="${r * 20}" width="20" height="20" fill="${t.G[r][c] >= 0 ? "#eee" : "#fff"}" stroke="#999" stroke-width=".8"/><g transform="translate(${c * 20 + 2} ${r * 20 + 2}) scale(.16)">${shapeSVG({ ...CUBE_SYMS[v], z: "big" }, 100).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`).join("")).join("")}</svg>`;
    case "scales": return `<b>${t.ask} = ${t.ans} ${L("кг", "кг")}</b>`;
    case "nim": return L(`взять <b>${t.take}</b>`, `<b>${t.take}</b> алу`);
    case "river": { const S = RIVER_SETS[t.set]; return [1, null, 0, 1, 2, null, 1].map((c, k) => `${k + 1}) ${c == null ? L("назад один", "кері жалғыз") : T(S.names[c]) + (k % 2 ? " ←" : " →")}`).join("; "); }
    case "wordprob": return `<b>${t.ans}</b>. ${T(t.steps.at(-1))}`;
  }
  return "";
}

/* ---------- одно задание на бумаге ---------- */
function paperTask(type, seed, grade, level, num) {
  const def = TASKS[type];
  const task = makeTask(type, seed, grade, level);
  const card = el(`<div class="ptask t-${type} ${task.mode === "error" ? "perr" : ""}"><div class="phead"><span class="pnum">${num}</span><span class="pdir">${T(def.title)}</span>${LEVEL_DOTS(level)}</div>
    <div class="pq">${T(paperQ(type, task))}</div><div class="pnote">✎ ${T(typeof PAPER_NOTE[type] === "function" ? PAPER_NOTE[type](task) : PAPER_NOTE[type])}</div><div class="tbody"></div></div>`);
  const body = $(".tbody", card);
  def.render(task, body, { grade, level, mode: "paper", card, feed() {} });
  if (["combi", "river", "sticks", "robot"].includes(type) && !(type === "combi" && task.mode.endsWith("Count")) && !(type === "robot" && task.mode === "bug")) body.append(el(`<div class="plines"><i></i><i></i>${type === "combi" || type === "river" ? "<i></i><i></i>" : ""}</div>`));
  if (type === "combi" && task.mode.endsWith("Count") === false) body.append(el(`<div class="ansline">${L("Всего:", "Барлығы:")} <span class="pbox"></span></div>`));
  return { card, task };
}

/* ---------- страница «Печать» ---------- */
function viewPrint(v) {
  const q = window.ROUTE_QS || new URLSearchParams();
  const saved = store.get("print" + GRADE, {});
  if (q.get("lang") === "kz" || q.get("lang") === "ru") setLang(q.get("lang")); // ссылка может задать язык листов
  const cfg = {
    t: [].concat(q.get("t") ?? saved.t ?? "").join(",").split(",").filter(x => G.topics.includes(x) && isOpen(x)),
    n: +(q.get("n") ?? saved.n ?? 8), l: +(q.get("l") ?? saved.l ?? 0), v: +(q.get("v") ?? saved.v ?? 1),
    a: +(q.get("a") ?? saved.a ?? 1), s: +(q.get("s") ?? saved.s ?? 0) || newSeed() % 100000,
  };
  const panel = el(`<section class="printpanel noprint">
    <div class="eyebrow"><span class="tag">${L("Уроки без устройств", "Құрылғысыз сабақтар")}</span>${L("листы A4 · варианты · ответы для учителя", "A4 парақтар · нұсқалар · мұғалімге жауаптар")}</div>
    <h2>${L("Печатные", "Басып шығаруға")} <span class="hand u">${L("листы", "парақтар")}</span></h2>
    <div class="card pcfg">
      <div><div class="k">${L("Темы (можно несколько; ничего не выбрано — все темы класса)", "Тақырыптар (бірнешеуін таңдауға болады; ештеңе таңдалмаса — сыныптың барлық тақырыбы)")}</div><div class="chips tch">${G.topics.map(t => isOpen(t) ? `<button data-t="${t}">${T(TASKS[t].title)}</button>` : `<a class="lockchip" href="../account/index.html">🔒 ${T(TASKS[t].title)}</a>`).join("")}</div></div>
      <div class="row">
        <div><div class="k">${L("Заданий в варианте", "Нұсқадағы тапсырма")}</div><div class="chips" data-k="n">${[4, 6, 8, 10, 12].map(n => `<button data-v="${n}">${n}</button>`).join("")}</div></div>
        <div><div class="k">${L("Сложность", "Қиындық")}</div><div class="chips" data-k="l"><button data-v="0">${L("по нарастающей", "біртіндеп")}</button>${[1, 2, 3].map(l => `<button data-v="${l}" ${!ACCESS.premium && l > LG_CONFIG.FREE_LEVEL ? "disabled" : ""}>${T(LVL_NAME[l])}</button>`).join("")}</div></div>
        <div><div class="k">${L("Вариантов", "Нұсқа саны")}</div><div class="chips" data-k="v">${[1, 2, 3, 4].map(n => `<button data-v="${n}">${n}</button>`).join("")}</div></div>
        <div><div class="k">${L("Ответы для учителя", "Мұғалімге жауаптар")}</div><div class="chips" data-k="a"><button data-v="1">${L("в конце", "соңында")}</button><button data-v="0">${L("без ответов", "жауапсыз")}</button></div></div>
      </div>
      <div class="btns"><button class="btn y pr" type="button">🖨 ${L("Печать / PDF", "Басып шығару / PDF")} <kbd>P</kbd></button><button class="btn rg" type="button">↻ ${L("Другие задания", "Басқа тапсырмалар")}</button><button class="btn sm cp" type="button">🔗 ${L("Ссылка на этот набор", "Осы жинаққа сілтеме")}</button><span class="mute setno"></span></div>
      <p class="mute pt">${L("Совет: в окне печати выберите «Сохранить как PDF», чтобы получить файл. Печатайте в цвете — в заданиях важны цвета фигур. Язык листов — как выбран вверху (RU/ҚАЗ).", "Кеңес: файл алу үшін басып шығару терезесінде «PDF ретінде сақтау» таңдаңыз. Түсті басып шығарыңыз — тапсырмаларда фигуралардың түсі маңызды. Парақтың тілі — жоғарыда таңдалғандай (RU/ҚАЗ).")}</p>
    </div></section>`);
  const sheets = el(`<div class="sheets"></div>`);
  v.append(panel, sheets);
  const sync = () => {
    $$(".tch button", panel).forEach(b => b.classList.toggle("on", cfg.t.includes(b.dataset.t)));
    $$(".chips[data-k]", panel).forEach(c => $$("button", c).forEach(b => b.classList.toggle("on", String(cfg[c.dataset.k]) === b.dataset.v)));
    $(".setno", panel).textContent = (LANG.cur === "kz" ? "Жинақ №" : "Набор №") + cfg.s;
    store.set("print" + GRADE, { ...cfg, s: undefined });
    history.replaceState(null, "", `#/print?t=${cfg.t.join(",")}&n=${cfg.n}&l=${cfg.l}&v=${cfg.v}&a=${cfg.a}&s=${cfg.s}&lang=${LANG.cur}`);
  };
  panel.addEventListener("click", e => {
    const tb = e.target.closest(".tch button"); if (tb) { const t = tb.dataset.t; cfg.t = cfg.t.includes(t) ? cfg.t.filter(x => x !== t) : [...cfg.t, t]; build(); return; }
    const b = e.target.closest(".chips[data-k] button"); if (b) { cfg[b.closest(".chips").dataset.k] = +b.dataset.v; build(); return; }
    if (e.target.closest(".pr")) window.print();
    if (e.target.closest(".rg")) { cfg.s = newSeed() % 100000; build(); }
    if (e.target.closest(".cp")) { navigator.clipboard?.writeText(location.href).then(() => toast(tx("Ссылка скопирована — по ней откроются те же задания.", "Сілтеме көшірілді — ол арқылы сол тапсырмалар ашылады.")), () => toast(tx("Скопируйте адрес из адресной строки.", "Мекенжай жолынан көшіріңіз."))); }
  });
  function build() {
    sync(); sheets.innerHTML = "";
    const topics = cfg.t.length ? cfg.t : G.topics.filter(t => isOpen(t));
    const R0 = new Rnd(`print|${GRADE}|${cfg.s}`);
    let pool = []; const seq = [];
    while (seq.length < cfg.n) { if (!pool.length) pool = R0.shuffle(topics); seq.push(pool.pop()); }
    const lv = k => cfg.l || (k < cfg.n / 3 ? 1 : k < (2 * cfg.n) / 3 ? 2 : 3);
    const keys = [];
    for (let vi = 1; vi <= cfg.v; vi++) {
      const R = new Rnd(`print|${GRADE}|${cfg.s}|v${vi}`);
      const sheet = el(`<section class="sheet"><header class="shead"><div class="sbrand">${L("Логика", "Логика")} <i>1–4</i> · ${L(`${GRADE} класс`, `${GRADE} сынып`)}</div><div class="svar">${L("Вариант", "Нұсқа")} ${vi}</div>
        <div class="sname">${L("Имя", "Аты")}: <i class="fill"></i> ${L("Класс", "Сынып")}: <i class="fill s"></i> ${L("Дата", "Күні")}: <i class="fill s"></i></div></header><div class="pgrid"></div>
        <footer class="sfoot">${L("Набор", "Жинақ")} №${cfg.s}-${vi} · mukagali-dostyq.github.io/logika-1-4</footer></section>`);
      sheets.append(sheet);
      const key = [];
      seq.forEach((type, k) => {
        const level = capLevel(type, lv(k)); const seed = R.int(1, 1e9);
        try { const { card, task } = paperTask(type, seed, GRADE, level, k + 1); $(".pgrid", sheet).append(card); key.push([k + 1, TASKS[type].title, answerHTML(task)]); }
        catch (err) { console.error(type, err); }
      });
      keys.push(key);
    }
    if (cfg.a) {
      const ak = el(`<section class="sheet answers"><header class="shead"><div class="sbrand">${L("Ответы для учителя", "Мұғалімге арналған жауаптар")}</div><div class="svar">${L("Набор", "Жинақ")} №${cfg.s}</div></header></section>`);
      keys.forEach((key, vi) => ak.append(el(`<div class="akey"><h3>${L("Вариант", "Нұсқа")} ${vi + 1}</h3><table>${key.map(([n, title, a]) => `<tr><td class="an">${n}</td><td class="at">${T(title)}</td><td>${a}</td></tr>`).join("")}</table></div>`)));
      sheets.append(ak);
    }
  }
  build();
}
