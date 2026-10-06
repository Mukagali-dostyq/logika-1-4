"use strict";
/* =====================================================================
   СТРАНИЦА КЛАССА: Главная · Учимся · Тренируемся · Банк задач ·
   Проверочная · Мои результаты · Доска (режим учителя).
   Маршруты — через #адрес, поэтому каждую страницу можно открыть ссылкой.
   ===================================================================== */

const GRADE = window.GRADE || 1;
const G = GRADES[GRADE];
const KIND = { tap: tx("Выбор ответа", "Жауап таңдау"), drag: tx("Перетаскивание", "Сүйреу"), input: tx("Ввод числа", "Сан енгізу"), build: tx("Построение", "Құрастыру"), grid: tx("Рисование на сетке", "Торда салу"), "3d": tx("3D-модель", "3D-модель"), game: tx("Игра", "Ойын") };
const LVL_NAME = { 1: tx("лёгкий", "жеңіл"), 2: tx("средний", "орташа"), 3: tx("трудный", "қиын") };

/* ---------------- результаты ученика (в этом браузере) ---------------- */
const PROG = {
  key: `g${GRADE}`,
  load() { const d = store.get(this.key, null) || {}; d.hist ||= []; d.tests ||= []; return d; },
  save(d) { store.set(this.key, d); },
  add(e) { const d = this.load(); d.hist.push({ type: e.type, seed: e.seed, level: e.level, ok: !!e.ok, att: e.attempts, h: e.hints, mode: e.mode, ts: Date.now() }); if (d.hist.length > 600) d.hist = d.hist.slice(-600); this.save(d); },
  topic(type) {
    const h = this.load().hist.filter(e => e.type === type); const last = h.slice(-8);
    const good = last.filter(e => e.ok && e.att <= 2).length;
    const status = !h.length ? "new" : last.length >= 5 && good >= Math.ceil(last.length * 0.75) ? "done" : "work";
    return { n: h.length, ok: h.filter(e => e.ok).length, status, acc: last.length ? good / last.length : 0 };
  },
  mistakes() { // ошибки, которые потом не были исправлены
    const h = this.load().hist; const seen = new Map();
    for (const e of h) seen.set(`${e.type}|${e.seed}|${e.level}`, e);
    return [...seen.values()].filter(e => !e.ok).reverse().slice(0, 30);
  },
};
const STATUS = { new: tx("не начато", "басталмаған"), work: tx("в процессе", "үйреніп жатыр"), done: tx("освоено", "меңгерілді") };

/* ---------------- шапка ---------------- */
const TABS = [["", tx("Главная", "Басты бет")], ["learn", tx("Учимся", "Үйренеміз")], ["train", tx("Тренируемся", "Жаттығамыз")], ["bank", tx("Банк задач", "Есептер банкі")], ["test", tx("Проверочная", "Тексеру жұмысы")], ["results", tx("Мои результаты", "Нәтижелерім")], ["board", tx("Доска", "Тақта")], ["print", tx("Печать", "Басып шығару")]];
function header() {
  const h = el(`<header class="topbar"><div class="in">
    <a class="brand" href="../index.html">${LOGO}<span>Логика <i>1–4</i></span></a>
    <nav class="gpills">${[1, 2, 3, 4].map(g => `<a href="../${g}/index.html" class="${g === GRADE ? "on" : ""}" title="${g} класс">${g}</a>`).join("")}</nav>
    <nav class="tabs">${TABS.map(([r, n]) => `<a href="#/${r}" data-r="${r}">${T(n)}</a>`).join("")}</nav>
    <a class="acclink" href="../account/index.html">${ACCESS.premium ? "✓ " + L("Полный доступ", "Толық қолжетімділік") : ACCESS.session ? "👤 " + L("Аккаунт", "Аккаунт") : "🔑 " + L("Войти", "Кіру")}</a>
    <div class="lang-switch"><button data-l="ru">RU</button><button data-l="kz">ҚАЗ</button></div></div></header>`);
  document.body.prepend(h);
}
const LOGO = `<svg class="logo" viewBox="0 0 40 40"><rect x="3" y="3" width="15" height="15" rx="3" fill="#FFD23F" stroke="#fff" stroke-width="2.5"/><circle cx="29.5" cy="10.5" r="7.5" fill="#12B886" stroke="#fff" stroke-width="2.5"/><path d="M10.5 22 L18 36 L3 36 Z" fill="#FF4F7B" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M29.5 22 L37 29.5 L29.5 37 L22 29.5 Z" fill="#2F5BFF" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>`;

/* ---------------- маршрутизатор ---------------- */
const main = () => $("#view");
function route() {
  const [path, qs] = location.hash.replace(/^#\/?/, "").split("?");
  window.ROUTE_QS = new URLSearchParams(qs || "");
  const parts = path.split("/").filter(Boolean);
  const r = parts[0] || "";
  $$(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.r === r));
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  const v = main(); v.innerHTML = ""; window.scrollTo(0, 0);
  ({ "": viewHome, learn: viewLearn, train: viewTrain, bank: viewBank, test: viewTest, results: viewResults, board: viewBoard, print: viewPrint }[r] || viewHome)(v, parts.slice(1));
}
const go = h => { if (location.hash === h) route(); else location.hash = h; };

/* ---------------- общие кусочки ---------------- */
function topicCard(type, actions = ["learn", "train"]) {
  const def = TASKS[type], st = PROG.topic(type), d = DIRS[def.dir];
  if (!isOpen(type)) return `<div class="tcard locked" style="--dc:${d.color}"><div class="tc-top"><span class="tc-dir">${T(d.title)}</span><span class="st">🔒</span></div>
    <h3>${T(def.title)}</h3><div class="tc-kind mute">${T(KIND[def.kind])}</div><div class="btns"><a class="btn sm" href="../account/index.html">🔒 ${L("Открыть доступ", "Қолжетімділікті ашу")}</a></div></div>`;
  return `<div class="tcard" style="--dc:${d.color}">
    <div class="tc-top"><span class="tc-dir">${T(d.title)}</span><span class="st st-${st.status}">${T(STATUS[st.status])}</span></div>
    <h3>${T(def.title)}</h3>
    <div class="tc-kind mute">${T(KIND[def.kind])}${st.n ? ` · ${L(`решено ${st.ok} из ${st.n}`, `${st.n}-ден ${st.ok} шешілді`)}` : ""}</div>
    <div class="btns">${actions.includes("learn") ? `<a class="btn sm" href="#/learn/${type}">${L("Учиться", "Үйрену")}</a>` : ""}${actions.includes("train") ? `<a class="btn sm g" href="#/train/${type}">${L("Тренироваться", "Жаттығу")}</a>` : ""}</div></div>`;
}
function byDirs(types) { const m = {}; types.forEach(t => (m[TASKS[t].dir] ||= []).push(t)); return Object.entries(m).sort((a, b) => DIRS[a[0]].n - DIRS[b[0]].n); }
/* экран «тема закрыта» */
function lockedView(v, type) {
  const free = LG_CONFIG.FREE_TOPICS.filter(t => G.topics.includes(t)).map(t => `«${T(TASKS[t].title)}»`).join(", ");
  v.append(el(`<section class="card lockbox"><div style="font-size:56px">🔒</div><h2>${type ? T(TASKS[type].title) : L("Полная версия", "Толық нұсқа")}</h2>
    <p class="lead">${L(`Эта часть открыта по подписке. Бесплатно: ${free} — лёгкий уровень.`, `Бұл бөлім жазылым арқылы ашылады. Тегін: ${free} — жеңіл деңгей.`)}</p>
    <div class="btns"><a class="btn y" href="../account/index.html">🔑 ${L("Войти или оформить доступ", "Кіру немесе қолжетімділік алу")}</a><a class="btn" href="#/learn">${L("Бесплатные темы", "Тегін тақырыптар")}</a></div></section>`));
}
const OPEN_TOPICS = () => G.topics.filter(t => isOpen(t));
const capLevel = (type, l) => Math.max(1, Math.min(l, openLevel(type) || 1));
function record(e, mode) { if (mode !== "board" && mode !== "demo") PROG.add({ ...e, mode }); }

/* ================= ГЛАВНАЯ КЛАССА ================= */
function viewHome(v) {
  const done = G.topics.filter(t => PROG.topic(t).status === "done").length;
  const name = store.get("name", "");
  v.append(el(`<section class="ghero ${G.theme}"><div class="deco d-${GRADE}"></div><div class="in">
    <div class="eyebrow"><span class="tag">${L("Логическое мышление", "Логикалық ойлау")}</span>${L(`${G.topics.length} тем · задания трёх уровней · новые варианты без конца`, `${G.topics.length} тақырып · үш деңгейлі тапсырма · шексіз жаңа нұсқа`)}</div>
    <h1><span class="gnum">${GRADE}</span> ${L("класс", "сынып")}<br><span class="hand u">${T(G.motto)}</span></h1>
    <p class="lead">${T(G.about)}</p>
    <div class="btns big"><a class="btn y" href="#/learn">📘 ${L("Учимся", "Үйренеміз")}</a><a class="btn" href="#/train/mix">🎯 ${L("Тренировка-микс", "Аралас жаттығу")}</a><a class="btn" href="#/test">📝 ${L("Проверочная", "Тексеру жұмысы")}</a></div>
    ${ACCESS.premium ? "" : `<div class="freenote">🔓 ${L(`Бесплатно открыто: ${OPEN_TOPICS().length} из ${G.topics.length} тем, лёгкий уровень. <a href="../account/index.html">Полный доступ →</a>`, `Тегін ашық: ${G.topics.length}-ден ${OPEN_TOPICS().length} тақырып, жеңіл деңгей. <a href="../account/index.html">Толық қолжетімділік →</a>`)}</div>`}
    <div class="gstat">${name ? `<b>${name}</b> · ` : ""}${L(`освоено тем: <b>${done}</b> из ${G.topics.length}`, `меңгерілген тақырып: ${G.topics.length}-ден <b>${done}</b>`)}<div class="bar"><i style="width:${(100 * done) / G.topics.length}%"></i></div></div>
  </div></section>`));
  const map = el(`<section class="sec"><h2>${L("Карта тем", "Тақырыптар картасы")} <span class="hand" style="color:var(--g2)">${L("выбирай!", "таңда!")}</span></h2><div class="dirmap"></div></section>`);
  byDirs(G.topics).forEach(([dir, ts]) => $(".dirmap", map).append(el(`<div class="dirblock"><div class="dirh" style="--dc:${DIRS[dir].color}"><b>${DIRS[dir].n}</b>${T(DIRS[dir].title)}</div><div class="grid auto">${ts.map(t => topicCard(t)).join("")}</div></div>`)));
  v.append(map);
}

/* ================= УЧИМСЯ ================= */
function viewLearn(v, [type]) {
  if (!type || !TASKS[type] || !G.topics.includes(type)) {
    v.append(el(`<section><div class="eyebrow"><span class="tag">${L("Учимся", "Үйренеміз")}</span>${L("короткое объяснение → пример с разбором → три задачи", "қысқа түсіндіру → талдауы бар мысал → үш есеп")}</div>
      <h2>${L("Что будем", "Не")} <span class="hand u">${L("изучать?", "үйренеміз?")}</span></h2></section>`));
    const g = el(`<div class="dirmap"></div>`);
    byDirs(G.topics).forEach(([dir, ts]) => g.append(el(`<div class="dirblock"><div class="dirh" style="--dc:${DIRS[dir].color}"><b>${DIRS[dir].n}</b>${T(DIRS[dir].title)}</div><div class="grid auto">${ts.map(t => topicCard(t, ["learn"])).join("")}</div></div>`)));
    v.append(g); return;
  }
  if (!isOpen(type)) return lockedView(v, type);
  const def = TASKS[type], Lr = LEARN[type], d = DIRS[def.dir];
  v.append(el(`<section class="learnhead" style="--dc:${d.color}">
    <a class="back" href="#/learn">← ${L("все темы", "барлық тақырып")}</a>
    <div class="eyebrow"><span class="tag" style="background:${d.color}">${T(d.title)}</span>${L(`${GRADE} класс`, `${GRADE} сынып`)}</div>
    <h2>${T(def.title)}</h2>
    <div class="idea card"><div class="k">${L("Главная мысль", "Басты ой")}</div><div class="ideat">${T(Lr.idea)}</div><span class="hnote tipn">${T(Lr.tip)} ↘</span></div>
    <div class="grid g3 steps3">${Lr.steps.map((s, i) => `<div class="card step"><span class="sn">${i + 1}</span>${T(s)}</div>`).join("")}</div></section>`));
  // пример с разбором
  const demo = el(`<section class="sec"><h3>${L("Смотри, как решать", "Қалай шешетінін қара")}</h3><div class="demohost"></div></section>`);
  v.append(demo);
  const dp = playTask({ type, grade: GRADE, level: 1, seed: 101, mode: "learn", host: $(".demohost", demo), allowNew: false });
  const playBtn = el(`<button class="btn y" type="button">▶ ${L("Показать решение по шагам", "Шешімін қадамдап көрсету")}</button>`);
  $(".tbar", dp.card).prepend(playBtn); playBtn.onclick = () => { playBtn.remove(); dp.solve(); };
  // теперь сам
  const you = el(`<section class="sec"><h3>${L("Теперь ты", "Енді өзің")} <span class="hand" style="color:var(--red)">${L("три задачи", "үш есеп")}</span></h3><div class="progdots"></div><div class="youhost"></div></section>`);
  v.append(you);
  let k = 0; const res = [];
  const dots = () => ($(".progdots", you).innerHTML = [0, 1, 2].map(i => `<i class="${res[i] === true ? "ok" : res[i] === false ? "no" : i === k ? "cur" : ""}">${i + 1}</i>`).join(""));
  const next = () => {
    dots();
    if (k >= 3) { $(".youhost", you).innerHTML = ""; $(".youhost", you).append(el(`<div class="card done"><h3>${L("Тема пройдена!", "Тақырып өтілді!")}</h3><p>${L(`Верно: ${res.filter(Boolean).length} из 3.`, `Дұрысы: 3-тен ${res.filter(Boolean).length}.`)}</p><div class="btns"><a class="btn g" href="#/train/${type}">${L("Тренироваться дальше", "Әрі қарай жаттығу")}</a><a class="btn" href="#/learn">${L("Другая тема", "Басқа тақырып")}</a></div></div>`)); return; }
    playTask({ type, grade: GRADE, level: capLevel(type, k + 1), mode: "learn", host: $(".youhost", you), onResult: e => { res[k] = e.ok; record(e, "learn"); dots(); }, onNext: () => { k++; next(); } });
  };
  next();
}

/* ================= ТРЕНИРУЕМСЯ ================= */
function viewTrain(v, [type]) {
  if (!type) {
    v.append(el(`<section><div class="eyebrow"><span class="tag">${L("Тренируемся", "Жаттығамыз")}</span>${L("10 заданий подряд · сложность растёт, когда получается", "қатарынан 10 тапсырма · жақсы шықса, қиындық өседі")}</div>
      <h2>${L("Выбери", "Тақырыпты")} <span class="hand u">${L("тему", "таңда")}</span></h2>
      <div class="btns" style="margin:14px 0"><a class="btn y" href="#/train/mix">🎲 ${L("Микс из всех тем", "Барлық тақырыптан аралас")}</a><a class="btn" href="#/train/repeat">🔁 ${L("Повторить ошибки", "Қателерді қайталау")}</a></div></section>`));
    const g = el(`<div class="dirmap"></div>`);
    byDirs(G.topics).forEach(([dir, ts]) => g.append(el(`<div class="dirblock"><div class="dirh" style="--dc:${DIRS[dir].color}"><b>${DIRS[dir].n}</b>${T(DIRS[dir].title)}</div><div class="grid auto">${ts.map(t => topicCard(t, ["train"])).join("")}</div></div>`)));
    v.append(g); return;
  }
  const mix = type === "mix", rep = type === "repeat";
  if (!mix && !rep && !G.topics.includes(type)) return go("#/train");
  if (!mix && !rep && !isOpen(type)) return lockedView(v, type);
  const N = 10; let i = 0, level = 1, streak = 0; const res = [];
  const queue = rep ? PROG.mistakes().filter(m => isOpen(m.type, m.level)).slice(0, N) : null;
  if (rep && !queue.length) { v.append(el(`<div class="card"><h3>${L("Ошибок для повторения нет", "Қайталайтын қате жоқ")}</h3><p>${L("Отлично! Попробуй тренировку-микс.", "Керемет! Аралас жаттығуды көр.")}</p><div class="btns" style="margin-top:12px"><a class="btn y" href="#/train/mix">${L("Микс", "Аралас")}</a></div></div>`)); return; }
  const total = rep ? queue.length : N;
  const title = mix ? tx("Микс из всех тем", "Барлық тақырыптан аралас") : rep ? tx("Повторяем ошибки", "Қателерді қайталаймыз") : TASKS[type].title;
  const wrap = el(`<section><a class="back" href="#/train">← ${L("выбор темы", "тақырып таңдау")}</a><div class="trhead"><h2>${T(title)}</h2><div class="progdots"></div></div><div class="host"></div></section>`);
  v.append(wrap);
  const dots = () => ($(".progdots", wrap).innerHTML = range(total).map(k => `<i class="${res[k] === true ? "ok" : res[k] === false ? "no" : k === i ? "cur" : ""}">${k + 1}</i>`).join(""));
  const pickType = () => (mix ? new Rnd(newSeed()).pick(OPEN_TOPICS()) : type);
  const next = () => {
    dots();
    if (i >= total) return finish();
    const q = rep ? queue[i] : null;
    playTask({ type: q ? q.type : pickType(), seed: q ? q.seed : undefined, grade: GRADE, level: q ? q.level : (ACCESS.premium ? level : 1), mode: "train", host: $(".host", wrap),
      onResult: e => { res[i] = e.ok; record(e, "train"); dots(); if (e.ok && e.attempts === 1) { streak++; if (streak >= 2 && level < (ACCESS.premium ? 3 : LG_CONFIG.FREE_LEVEL)) { level++; streak = 0; toast(tx(`Уровень повышен: ${LVL_NAME[level].ru}!`, `Деңгей көтерілді: ${LVL_NAME[level].kz}!`)); } } else { streak = 0; if (!e.ok && level > 1) level--; } },
      onNext: () => { i++; next(); } });
  };
  function finish() {
    const ok = res.filter(Boolean).length; const stars = ok >= total - 1 ? 3 : ok >= total * 0.7 ? 2 : ok >= total / 2 ? 1 : 0;
    $(".host", wrap).innerHTML = ""; $(".host", wrap).append(el(`<div class="card done"><div class="stars">${[1, 2, 3].map(s => `<span class="${s <= stars ? "on" : ""}">★</span>`).join("")}</div>
      <h3>${L(`Верно: ${ok} из ${total}`, `Дұрысы: ${total}-ден ${ok}`)}</h3><p class="mute">${stars === 3 ? L("Превосходно! Можно брать тему посложнее.", "Тамаша! Қиынырақ тақырыпты алуға болады.") : L("Ошибки сохранены в «Моих результатах» — их можно повторить.", "Қателер «Нәтижелерімде» сақталды — оларды қайталауға болады.")}</p>
      <div class="btns"><button class="btn y" type="button" onclick="location.reload()">${L("Ещё раз", "Тағы бір рет")}</button><a class="btn" href="#/train">${L("Другая тема", "Басқа тақырып")}</a><a class="btn" href="#/results">${L("Мои результаты", "Нәтижелерім")}</a></div></div>`));
  }
  next();
}

/* ================= БАНК ЗАДАЧ ================= */
function viewBank(v, [type, lv, idx]) {
  if (type && TASKS[type]) {
    const level = +lv || 1, i = +idx || 0;
    if (!isOpen(type, level)) return lockedView(v, type);
    const wrap = el(`<section><a class="back" href="#/bank">← ${L("банк задач", "есептер банкі")}</a><div class="bnav"><a class="btn sm" href="#/bank/${type}/${level}/${Math.max(0, i - 1)}" ${i === 0 ? "disabled" : ""}>‹ ${L("Предыдущая", "Алдыңғы")}</a><span class="disp bno">№ ${level}.${String(i + 1).padStart(2, "0")}</span><a class="btn sm" href="#/bank/${type}/${level}/${Math.min(BANK_PER_LEVEL - 1, i + 1)}">${L("Следующая", "Келесі")} ›</a></div><div class="host"></div></section>`);
    v.append(wrap);
    playTask({ type, grade: GRADE, level, seed: bankSeed(type, GRADE, level, i), num: `${level}.${String(i + 1).padStart(2, "0")}`, mode: "train", host: $(".host", wrap), onResult: e => record(e, "bank") });
    return;
  }
  const f = store.get("bankf" + GRADE, { dir: "", lvl: 0, kind: "" });
  const dirs = [...new Set(G.topics.map(t => TASKS[t].dir))].sort((a, b) => DIRS[a].n - DIRS[b].n);
  const kinds = [...new Set(G.topics.map(t => TASKS[t].kind))];
  const total = G.topics.length * 3 * BANK_PER_LEVEL;
  v.append(el(`<section><div class="eyebrow"><span class="tag">${L("Банк задач", "Есептер банкі")}</span>${L(`${total} проверенных задач для ${GRADE} класса · у каждой свой номер`, `${GRADE} сыныпқа арналған ${total} тексерілген есеп · әрқайсысының өз нөмірі бар`)}</div>
    <h2>${L("Найди", "Өзіңе")} <span class="hand u">${L("задачу", "есеп тап")}</span></h2>
    <p class="lead mute">${L("Каждая задача проверена программой: решение существует и, где нужно, оно единственное. Номер задачи один и тот же у всех — удобно задавать на дом: «реши 2.07 из темы „Весы“».", "Әр есепті бағдарлама тексерген: шешімі бар және, қажет болса, жалғыз. Есеп нөмірі бәрінде бірдей — үйге беруге ыңғайлы: «„Таразы“ тақырыбынан 2.07 есепті шығар».")}</p></section>`));
  const bar = el(`<div class="filters card flat">
    <div><div class="k">${L("Направление", "Бағыт")}</div><div class="chips" data-f="dir"><button data-v="">${L("все", "барлығы")}</button>${dirs.map(d => `<button data-v="${d}">${T(DIRS[d].title)}</button>`).join("")}</div></div>
    <div class="row"><div><div class="k">${L("Сложность", "Қиындық")}</div><div class="chips" data-f="lvl"><button data-v="0">${L("любая", "кез келген")}</button>${[1, 2, 3].map(l => `<button data-v="${l}">${T(LVL_NAME[l])}</button>`).join("")}</div></div>
    <div><div class="k">${L("Действие", "Әрекет")}</div><div class="chips" data-f="kind"><button data-v="">${L("любое", "кез келген")}</button>${kinds.map(k => `<button data-v="${k}">${T(KIND[k])}</button>`).join("")}</div></div></div></div>`);
  const list = el(`<div class="banklist"></div>`);
  v.append(bar, list);
  const draw = () => {
    $$(".chips", bar).forEach(c => $$("button", c).forEach(b => b.classList.toggle("on", String(f[c.dataset.f]) === b.dataset.v)));
    store.set("bankf" + GRADE, f);
    const ts = G.topics.filter(t => (!f.dir || TASKS[t].dir === f.dir) && (!f.kind || TASKS[t].kind === f.kind));
    list.innerHTML = ts.map(t => `<div class="bankrow"><div class="bh"><span class="tc-dir" style="background:${DIRS[TASKS[t].dir].color}">${T(DIRS[TASKS[t].dir].title)}</span><b>${T(TASKS[t].title)}</b><span class="mute">${T(KIND[TASKS[t].kind])}</span></div>
      ${[1, 2, 3].filter(l => !+f.lvl || +f.lvl === l).map(l => `<div class="bl"><span class="bll">${LEVEL_DOTS(l)} ${T(LVL_NAME[l])}</span>${isOpen(t, l) ? range(BANK_PER_LEVEL).map(i => `<a class="bnum" href="#/bank/${t}/${l}/${i}">${l}.${String(i + 1).padStart(2, "0")}</a>`).join("") : `<a class="bnum lockn" href="../account/index.html">🔒 ${L("по подписке", "жазылым арқылы")}</a>`}</div>`).join("")}</div>`).join("") || `<p class="mute">${L("Ничего не найдено — сними фильтр.", "Ештеңе табылмады — сүзгіні алып таста.")}</p>`;
  };
  bar.addEventListener("click", e => { const b = e.target.closest(".chips button"); if (!b) return; const k = b.closest(".chips").dataset.f; f[k] = k === "lvl" ? +b.dataset.v : b.dataset.v; draw(); });
  draw();
}

/* ================= ПРОВЕРОЧНАЯ ================= */
let TEST = null;
function viewTest(v, [sub]) {
  if (sub === "run" && TEST) return runTest(v);
  if (sub === "result" && TEST && TEST.done) return testResult(v);
  const s = store.get("testcfg" + GRADE, { topic: "", n: 10, lvl: 0, time: 0 });
  const card = el(`<section><div class="eyebrow"><span class="tag">${L("Проверочная работа", "Тексеру жұмысы")}</span>${L("без подсказок · одна попытка · разбор после", "кеңессіз · бір әрекет · талдау соңында")}</div>
    <h2>${L("Проверь", "Өзіңді")} <span class="hand u">${L("себя", "тексер")}</span></h2>
    <div class="card testcfg">
      <div><div class="k">${L("Тема", "Тақырып")}</div><select class="sel" data-k="topic"><option value="">${L("Смешанная: все темы", "Аралас: барлық тақырып")}</option>${OPEN_TOPICS().map(t => `<option value="${t}">${TASKS[t].title.ru} / ${TASKS[t].title.kz}</option>`).join("")}</select></div>
      <div><div class="k">${L("Сколько заданий", "Неше тапсырма")}</div><div class="chips" data-k="n">${[5, 10, 15].map(n => `<button data-v="${n}">${n}</button>`).join("")}</div></div>
      <div><div class="k">${L("Сложность", "Қиындық")}</div><div class="chips" data-k="lvl"><button data-v="0">${L("по нарастающей", "біртіндеп өседі")}</button>${[1, 2, 3].map(l => `<button data-v="${l}">${T(LVL_NAME[l])}</button>`).join("")}</div></div>
      <div><div class="k">${L("Время", "Уақыт")}</div><div class="chips" data-k="time"><button data-v="0">${L("без таймера", "таймерсіз")}</button>${[10, 20, 30].map(m => `<button data-v="${m}">${m} ${L("мин", "мин")}</button>`).join("")}</div></div>
      <div class="btns"><button class="btn y startb" type="button">▶ ${L("Начать", "Бастау")}</button></div></div></section>`);
  v.append(card);
  const sel = $("select", card); if (!OPEN_TOPICS().includes(s.topic)) s.topic = ""; sel.value = s.topic;
  if (!ACCESS.premium) { s.lvl = LG_CONFIG.FREE_LEVEL; $$('[data-k="lvl"] button', card).forEach(b => { if (+b.dataset.v !== LG_CONFIG.FREE_LEVEL) b.disabled = true; }); }
  const draw = () => $$(".chips", card).forEach(c => $$("button", c).forEach(b => b.classList.toggle("on", String(s[c.dataset.k]) === b.dataset.v)));
  draw();
  card.addEventListener("click", e => { const b = e.target.closest(".chips button"); if (b) { s[b.closest(".chips").dataset.k] = +b.dataset.v; draw(); } });
  sel.onchange = () => (s.topic = sel.value);
  $(".startb", card).onclick = () => {
    store.set("testcfg" + GRADE, s);
    const R = new Rnd(newSeed());
    const types = s.topic ? range(s.n).map(() => s.topic) : (() => { const a = []; let pool = R.shuffle(OPEN_TOPICS()); while (a.length < s.n) { if (!pool.length) pool = R.shuffle(OPEN_TOPICS()); a.push(pool.pop()); } return a; })();
    TEST = { cfg: { ...s }, items: types.map((t, k) => ({ type: t, seed: newSeed(), level: capLevel(t, s.lvl || (k < s.n / 3 ? 1 : k < (2 * s.n) / 3 ? 2 : 3)), ok: null })), i: 0, start: Date.now(), done: false };
    go("#/test/run");
  };
}
function runTest(v) {
  const wrap = el(`<section><div class="trhead"><h2>${L("Проверочная", "Тексеру")}</h2><div class="progdots"></div><div class="timer disp"></div></div><div class="host"></div></section>`);
  v.append(wrap);
  const dots = () => ($(".progdots", wrap).innerHTML = TEST.items.map((it, k) => `<i class="${it.ok != null ? "ans" : k === TEST.i ? "cur" : ""}">${k + 1}</i>`).join(""));
  let tm = null;
  if (TEST.cfg.time) {
    const end = TEST.start + TEST.cfg.time * 60000;
    const tick = () => { const left = Math.max(0, end - Date.now()); const t = $(".timer", wrap); if (!t) return clearInterval(tm); t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`; t.classList.toggle("warn", left < 60000); if (!left) { clearInterval(tm); finish(); } };
    tm = setInterval(tick, 500); tick();
  }
  const show = () => {
    dots(); if (TEST.i >= TEST.items.length) return finish();
    const it = TEST.items[TEST.i];
    playTask({ type: it.type, seed: it.seed, grade: GRADE, level: it.level, mode: "test", host: $(".host", wrap), num: TEST.i + 1,
      onResult: e => { it.ok = e.ok; record(e, "test"); }, onNext: () => { TEST.i++; show(); } });
  };
  function finish() { clearInterval(tm); if (TEST.done) return; TEST.done = true; TEST.time = Math.round((Date.now() - TEST.start) / 1000);
    const d = PROG.load(); d.tests.push({ ts: Date.now(), topic: TEST.cfg.topic, n: TEST.items.length, ok: TEST.items.filter(x => x.ok).length, time: TEST.time }); d.tests = d.tests.slice(-50); PROG.save(d);
    go("#/test/result"); }
  show();
}
function testResult(v) {
  const ok = TEST.items.filter(x => x.ok).length, n = TEST.items.length, pc = Math.round((100 * ok) / n);
  const wrap = el(`<section><div class="eyebrow"><span class="tag">${L("Результат", "Нәтиже")}</span>${L(`время: ${Math.floor(TEST.time / 60)} мин ${TEST.time % 60} с`, `уақыт: ${Math.floor(TEST.time / 60)} мин ${TEST.time % 60} с`)}</div>
    <h2><span class="bigscore">${ok}</span> / ${n} <span class="hand" style="color:${pc >= 80 ? "var(--green)" : pc >= 50 ? "var(--orange)" : "var(--red)"}">${pc >= 80 ? L("отлично!", "керемет!") : pc >= 50 ? L("хорошо, но есть что повторить", "жақсы, бірақ қайталайтын нәрсе бар") : L("нужно потренироваться", "жаттығу керек")}</span></h2>
    <div class="grid auto treview">${TEST.items.map((it, k) => `<button class="card trv ${it.ok ? "ok" : "no"}" data-k="${k}" type="button"><b>${k + 1}</b> ${T(TASKS[it.type].title)} ${LEVEL_DOTS(it.level)}<span>${it.ok ? "✓" : it.ok === false ? "✗" : "—"}</span><small>${L("смотреть разбор", "талдауды көру")}</small></button>`).join("")}</div>
    <div class="host" style="margin-top:20px"></div>
    <div class="btns" style="margin-top:20px"><a class="btn y" href="#/test">${L("Новая проверочная", "Жаңа тексеру")}</a><a class="btn" href="#/results">${L("Мои результаты", "Нәтижелерім")}</a></div></section>`);
  v.append(wrap);
  wrap.addEventListener("click", e => { const b = e.target.closest(".trv"); if (!b) return; const it = TEST.items[+b.dataset.k]; const p = playTask({ type: it.type, seed: it.seed, grade: GRADE, level: it.level, mode: "train", host: $(".host", wrap), allowNew: false }); p.solve(); $(".host", wrap).scrollIntoView({ behavior: "smooth" }); });
}

/* ================= МОИ РЕЗУЛЬТАТЫ ================= */
function viewResults(v) {
  const d = PROG.load(); const name = store.get("name", "");
  const solved = d.hist.filter(e => e.ok).length;
  v.append(el(`<section><div class="eyebrow"><span class="tag">${L("Мои результаты", "Нәтижелерім")}</span>${L("хранятся только в этом браузере", "тек осы браузерде сақталады")}</div>
    <h2>${L("Как у меня", "Менің")} <span class="hand u">${L("дела?", "жетістігім")}</span></h2>
    <div class="row" style="margin:12px 0"><label class="k" style="margin:0">${L("Моё имя:", "Атым:")}</label><input class="namein" value="${name.replace(/"/g, "&quot;")}" maxlength="30" placeholder="${LANG.cur === "kz" ? "Атыңды жаз" : "Напиши своё имя"}"></div>
    <div class="grid g3 kpis"><div class="card"><div class="k">${L("Решено заданий", "Шешілген тапсырма")}</div><div class="kpi">${solved}</div></div>
      <div class="card"><div class="k">${L("Освоено тем", "Меңгерілген тақырып")}</div><div class="kpi">${G.topics.filter(t => PROG.topic(t).status === "done").length}<small>/${G.topics.length}</small></div></div>
      <div class="card"><div class="k">${L("Проверочных", "Тексеру жұмысы")}</div><div class="kpi">${d.tests.length}</div></div></div></section>`));
  $(".namein", v).onchange = e => store.set("name", e.target.value.trim());
  const mist = PROG.mistakes();
  v.append(el(`<section class="sec"><h3>${L("Задания для повторения", "Қайталауға арналған тапсырмалар")}</h3>${mist.length ? `<div class="btns" style="margin:10px 0"><a class="btn y" href="#/train/repeat">🔁 ${L("Повторить все подряд", "Барлығын қатарынан қайталау")}</a></div><div class="grid auto">${mist.slice(0, 12).map(m => `<a class="card mist" href="#/bank-replay/${m.type}/${m.level}/${m.seed}"><b>${T(TASKS[m.type].title)}</b> ${LEVEL_DOTS(m.level)}<small class="mute">${new Date(m.ts).toLocaleDateString()}</small></a>`).join("")}</div>` : `<p class="mute">${L("Ошибок нет — так держать!", "Қате жоқ — осылай жалғастыр!")}</p>`}</section>`));
  const rows = G.topics.map(t => { const s = PROG.topic(t); return `<div class="mrow"><span class="mt">${T(TASKS[t].title)}</span><span class="st st-${s.status}">${T(STATUS[s.status])}</span><span class="bar"><i style="width:${Math.round(s.acc * 100)}%"></i></span><span class="mute">${s.n ? `${s.ok}/${s.n}` : "—"}</span></div>`; }).join("");
  v.append(el(`<section class="sec"><h3>${L("Темы", "Тақырыптар")}</h3><div class="card mastery">${rows}</div><p class="mute" style="margin-top:8px">${L("Тема «освоена», если из последних 8 заданий не меньше 75% решено сразу или со второй попытки.", "Соңғы 8 тапсырманың кемінде 75%-ы бірден немесе екінші әрекеттен шешілсе, тақырып «меңгерілді».")}</p></section>`));
  if (d.tests.length) v.append(el(`<section class="sec"><h3>${L("Проверочные работы", "Тексеру жұмыстары")}</h3><div class="card"><table class="ttab"><tr><th>${L("Дата", "Күні")}</th><th>${L("Тема", "Тақырып")}</th><th>${L("Результат", "Нәтиже")}</th><th>${L("Время", "Уақыт")}</th></tr>${d.tests.slice().reverse().map(x => `<tr><td>${new Date(x.ts).toLocaleString()}</td><td>${x.topic ? T(TASKS[x.topic].title) : L("смешанная", "аралас")}</td><td><b>${x.ok}/${x.n}</b></td><td>${Math.floor(x.time / 60)}:${String(x.time % 60).padStart(2, "0")}</td></tr>`).join("")}</table></div></section>`));
  const rb = el(`<section class="sec"><button class="btn sm dk" type="button">${L("Стереть мои результаты", "Нәтижелерімді өшіру")}</button></section>`);
  $("button", rb).onclick = () => { if (confirm(LANG.cur === "kz" ? "Барлық нәтижені өшіру керек пе?" : "Стереть все результаты этого класса?")) { PROG.save({ hist: [], tests: [] }); route(); } };
  v.append(rb);
}

/* ================= ДОСКА (режим учителя) ================= */
function viewBoard(v) {
  document.body.classList.add("boardmode");
  const s = store.get("board" + GRADE, { topic: G.topics[0], lvl: 1 });
  if (!isOpen(s.topic)) s.topic = OPEN_TOPICS()[0];
  s.lvl = capLevel(s.topic, s.lvl);
  const sc = [0, 0];
  const top = el(`<section class="boardbar card flat">
    <select class="sel">${OPEN_TOPICS().map(t => `<option value="${t}">${TASKS[t].title.ru} / ${TASKS[t].title.kz}</option>`).join("")}</select>
    <div class="chips lv">${[1, 2, 3].map(l => `<button data-v="${l}" ${!ACCESS.premium && l > LG_CONFIG.FREE_LEVEL ? "disabled" : ""}>${T(LVL_NAME[l])}</button>`).join("")}</div>
    <div class="timerbox"><button class="btn sm" data-t="30">⏱ 30</button><button class="btn sm" data-t="60">60</button><button class="btn sm" data-t="90">90</button><span class="timer disp"></span></div>
    <div class="teams"><button class="btn sm team" data-i="0">${L("Команда 1", "1-топ")}: <b>0</b></button><button class="btn sm team" data-i="1" style="background:var(--g);color:var(--gink)">${L("Команда 2", "2-топ")}: <b>0</b></button></div>
    <button class="btn sm dk fs" type="button">⛶ ${L("Весь экран", "Толық экран")}</button></section>`);
  const host = el(`<div class="boardhost"></div>`);
  v.append(top, host);
  const sel = $(".sel", top); sel.value = s.topic;
  const draw = () => $$(".lv button", top).forEach(b => b.classList.toggle("on", +b.dataset.v === s.lvl));
  const play = () => { store.set("board" + GRADE, s); playTask({ type: s.topic, grade: GRADE, level: s.lvl, mode: "board", host, onNew: play }); };
  sel.onchange = () => { s.topic = sel.value; play(); };
  top.addEventListener("click", e => {
    const l = e.target.closest(".lv button"); if (l) { s.lvl = capLevel(s.topic, +l.dataset.v); draw(); play(); }
    const tm = e.target.closest("[data-t]"); if (tm) startTimer(+tm.dataset.t);
    const t = e.target.closest(".team"); if (t) { sc[+t.dataset.i]++; $("b", t).textContent = sc[+t.dataset.i]; t.classList.add("pop"); setTimeout(() => t.classList.remove("pop"), 400); }
    if (e.target.closest(".fs")) document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  });
  top.addEventListener("contextmenu", e => { const t = e.target.closest(".team"); if (t) { e.preventDefault(); sc[+t.dataset.i] = Math.max(0, sc[+t.dataset.i] - 1); $("b", t).textContent = sc[+t.dataset.i]; } });
  let th = null;
  function startTimer(sec) { clearInterval(th); const end = Date.now() + sec * 1000; const tEl = $(".timer", top); const tick = () => { if (!tEl.isConnected) return clearInterval(th); const left = Math.max(0, Math.ceil((end - Date.now()) / 1000)); tEl.textContent = left; tEl.classList.toggle("warn", left <= 5); if (!left) { clearInterval(th); tEl.textContent = LANG.cur === "kz" ? "Уақыт!" : "Время!"; } }; th = setInterval(tick, 250); tick(); }
  draw(); play();
}

/* повтор ошибки: #/bank-replay/type/level/seed */
function viewReplay(v, [type, lv, seed]) {
  if (!isOpen(type, +lv)) return lockedView(v, type);
  const wrap = el(`<section><a class="back" href="#/results">← ${L("мои результаты", "нәтижелерім")}</a><div class="host"></div></section>`); v.append(wrap);
  playTask({ type, grade: GRADE, level: +lv, seed: +seed, mode: "train", host: $(".host", wrap), onResult: e => record(e, "repeat") });
}

/* ---------------- запуск ---------------- */
async function boot() {
  $("#view").innerHTML = `<p class="mute" style="padding:40px 0">…</p>`;
  try { await Promise.race([accessInit(), sleep(8000)]); } catch (e) { console.warn(e); }
  document.documentElement.style.setProperty("--g", G.color); document.documentElement.style.setProperty("--gink", G.ink);
  document.documentElement.style.setProperty("--g2", GRADE === 1 ? "#E8A500" : G.color);
  injectDefs(); header(); initLang();
  const r0 = route;
  window.route = () => { document.body.classList.remove("boardmode"); const p = location.hash.replace(/^#\/?/, "").split("/"); if (p[0] === "bank-replay") { $$(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.r === "results")); const v = main(); v.innerHTML = ""; return viewReplay(v, p.slice(1)); } r0(); };
  window.addEventListener("hashchange", window.route);
  // клавиша P — печатные листы: на странице «Печать» сразу открывает печать / сохранение в PDF
  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target instanceof Element && e.target.closest("input,textarea,select"))) return;
    if (!["p", "P", "з", "З"].includes(e.key)) return;
    e.preventDefault();
    if (location.hash.startsWith("#/print")) window.print();
    else { location.hash = "#/print"; setTimeout(() => window.print(), 900); }
  });
  window.route();
}
document.addEventListener("DOMContentLoaded", boot);
