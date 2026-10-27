"use strict";
/* =====================================================================
   ПОРЯДОК И СРАВНЕНИЕ (order) · ВЫВОДЫ ИЗ УСЛОВИЙ (deduce) · ВЫСКАЗЫВАНИЯ (statements)
   Каждая задача проверяется перебором: решение существует и оно ОДНО.
   ===================================================================== */

const RELS = {
  height: { more: tx("выше", "биік"), less: tx("ниже", "аласа"), top: tx("самый высокий", "ең биік"), bot: tx("самый низкий", "ең аласа"), topF: "самая высокая", botF: "самая низкая", q: tx("Расставь ребят по росту: слева — самый высокий.", "Балаларды бойы бойынша тұрғыз: сол жақта — ең биігі.") },
  age: { more: tx("старше", "үлкен"), less: tx("младше", "кіші"), top: tx("самый старший", "ең үлкені"), bot: tx("самый младший", "ең кішісі"), topF: "самая старшая", botF: "самая младшая", q: tx("Расставь ребят по возрасту: слева — самый старший.", "Балаларды жасы бойынша тұрғыз: сол жақта — ең үлкені.") },
  speed: { more: tx("бегает быстрее", "жылдам жүгіреді"), less: tx("бегает медленнее", "баяу жүгіреді"), top: tx("самый быстрый", "ең жылдамы"), bot: tx("самый медленный", "ең баяуы"), topF: "самая быстрая", botF: "самая медленная", q: tx("Расставь ребят по скорости бега: слева — самый быстрый.", "Балаларды жүгіру жылдамдығы бойынша тұрғыз: сол жақта — ең жылдамы.") },
};
/* суждение о порядке → текст; o — массив индексов (0 = первый слева = «самый …») */
function orderClueText(c, P, rel) {
  const n = i => P[i];
  const R = RELS[rel];
  switch (c.k) {
    case "cmp": return c.flip
      ? tx(`${n(c.b).ru} ${R.less.ru}, чем ${n(c.a).ru}.`, `${n(c.b).kz} ${KZ.abl(n(c.a).kz)} ${R.less.kz}.`)
      : tx(`${n(c.a).ru} ${R.more.ru}, чем ${n(c.b).ru}.`, `${n(c.a).kz} ${KZ.abl(n(c.b).kz)} ${R.more.kz}.`);
    case "top": return tx(`${n(c.a).ru} ${R.more.ru} всех.`, `${n(c.a).kz} бәрінен ${R.more.kz}.`);
    case "bot": return tx(`${n(c.a).ru} ${R.less.ru} всех.`, `${n(c.a).kz} бәрінен ${R.less.kz}.`);
    case "btw": return tx(`${n(c.b).ru} ${R.less.ru}, чем ${n(c.a).ru}, но ${R.more.ru}, чем ${n(c.c).ru}.`, `${n(c.b).kz} ${KZ.abl(n(c.a).kz)} ${R.less.kz}, бірақ ${KZ.abl(n(c.c).kz)} ${R.more.kz}.`);
    case "mid": return tx(`${n(c.a).ru} — не ${n(c.a).g === "f" ? R.topF : R.top.ru} и не ${n(c.a).g === "f" ? R.botF : R.bot.ru}.`, `${n(c.a).kz} ${R.top.kz} да емес, ${R.bot.kz} да емес.`);
  }
}
function orderClueOk(c, pos) { // pos[person] = место (0 — первый)
  const N = pos.length;
  switch (c.k) {
    case "cmp": return pos[c.a] < pos[c.b];
    case "top": return pos[c.a] === 0;
    case "bot": return pos[c.a] === N - 1;
    case "btw": return pos[c.a] < pos[c.b] && pos[c.b] < pos[c.c];
    case "mid": return pos[c.a] !== 0 && pos[c.a] !== N - 1;
  }
}
/* общий «решатель»: добавляем случайные верные условия, пока решение не станет единственным,
   потом выбрасываем лишние условия */
function buildClues(R, all, pool, okFn, maxClues = 8) {
  let clues = [], alive = all.slice();
  const cand = R.shuffle(pool);
  for (const c of cand) {
    if (alive.length === 1) break;
    const nxt = alive.filter(p => okFn(c, p));
    if (nxt.length < alive.length) { clues.push(c); alive = nxt; }
  }
  if (alive.length !== 1) return null;
  for (const c of R.shuffle(clues.slice())) {
    const rest = clues.filter(x => x !== c);
    if (all.filter(p => rest.every(x => okFn(x, p))).length === 1) clues = rest;
  }
  if (clues.length > maxClues) return null;
  return clues;
}

registerTask({
  id: "order", dir: "order", kind: "drag", title: tx("Кто выше? Расставь по порядку", "Кім биік? Ретімен тұрғыз"),
  gen(R, grade, level) {
    const N = grade === 1 ? 3 : grade === 2 ? (level === 3 ? 4 : 3 + (level > 1 ? 1 : 0)) : grade === 3 ? (level === 3 ? 5 : 4) : (level === 1 ? 4 : 5);
    const rel = grade === 1 ? R.pick(["height", "height", "age"]) : R.pick(["height", "age", "speed"]);
    const people = R.sample(NAMES, N);
    const sol = R.shuffle(range(N)); // sol[место] = человек
    const pos = []; sol.forEach((p, i) => (pos[p] = i));
    const kinds = grade <= 2 ? ["cmp"] : grade === 3 ? ["cmp", "cmp", "top", "bot", "btw"] : ["cmp", "btw", "mid", "top", "bot"];
    const pool = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      if (grade <= 2 && j - i > 1 && level < 3) continue; // в 1–2 классе — только соседи по порядку
      pool.push({ k: "cmp", a: sol[i], b: sol[j], flip: grade >= 2 && R.chance(0.4) });
    }
    if (kinds.includes("top")) pool.push({ k: "top", a: sol[0] });
    if (kinds.includes("bot")) pool.push({ k: "bot", a: sol[N - 1] });
    if (kinds.includes("btw")) for (let i = 0; i + 2 < N; i++) pool.push({ k: "btw", a: sol[i], b: sol[i + 1], c: sol[i + 2] });
    if (kinds.includes("mid")) for (let i = 1; i < N - 1; i++) pool.push({ k: "mid", a: sol[i] });
    const all = perms(range(N)).map(o => { const p = []; o.forEach((x, i) => (p[x] = i)); return p; });
    for (let t = 0; t < 40; t++) {
      const clues = buildClues(R, all, pool, orderClueOk, N + 1);
      if (clues) return { N, rel, people, sol, clues: R.shuffle(clues), q: RELS[rel].q,
        hints: [tx("Начни с того, кто точно первый: про него ни разу не сказано, что кто-то его «обгоняет».", "Алдымен анық бірінші тұрғанды тап: оны ешкім «озбайды»."),
          tx("Запиши условия стрелками: «А выше, чем Б» → А ▸ Б. Потом собери цепочку.", "Шарттарды бағыттауышпен жаз: «А Б-дан биік» → А ▸ Б. Сосын тізбек құрастыр.")] };
    }
    throw new Error("order");
  },
  render(t, box) {
    const P = t.people;
    const clues = el(`<ol class="clues">${t.clues.map((c, i) => `<li data-i="${i}">${T(orderClueText(c, P, t.rel))}</li>`).join("")}</ol>`);
    const pool = el(`<div class="pool" data-zone="pool">${P.map((p, i) => `<div class="chip person" data-chip data-p="${i}">${avatarSVG(i, 44)}<span>${T(p)}</span></div>`).join("")}</div>`);
    const slots = el(`<div class="slots"><div class="slab l">${T(RELS[t.rel].top)}</div>${range(t.N).map(i => `<div class="dz slot" data-zone="s${i}"><b>${i + 1}</b></div>`).join("")}<div class="slab r">${T(RELS[t.rel].bot)}</div></div>`);
    box.append(clues, pool, slots);
    dnd(box, { onDrop(chip, z) {
      if (box.classList.contains("locked")) return;
      if (z && z.classList.contains("slot")) { const old = $("[data-chip]", z); if (old && old !== chip) { const from = chip.parentElement; (from.classList.contains("slot") ? from : pool).append(old); } z.append(chip); }
      else pool.append(chip);
      unflash(clues, "bad");
    } });
    const arrangement = () => range(t.N).map(i => { const c = $(`[data-zone="s${i}"] [data-chip]`, slots); return c ? +c.dataset.p : null; });
    const place = order => order.forEach((p, i) => $(`[data-zone="s${i}"]`, slots).append($(`[data-p="${p}"]`, box)));
    return {
      check() {
        const a = arrangement(); if (a.includes(null)) return EMPTY(tx("Поставь всех ребят на места.", "Барлық баланы орнына қой."));
        const pos = []; a.forEach((p, i) => (pos[p] = i));
        const bad = t.clues.findIndex(c => !orderClueOk(c, pos));
        if (bad < 0) return { ok: true };
        $$("li", clues)[bad].classList.add("bad");
        return { ok: false, msg: tx(`Не выполняется условие №${bad + 1}: «${orderClueText(t.clues[bad], P, t.rel).ru}»`, `№${bad + 1} шарт орындалмайды: «${orderClueText(t.clues[bad], P, t.rel).kz}»`) };
      },
      solve() {
        const st = t.clues.map((c, i) => ({ t: tx(`Условие ${i + 1}: ${orderClueText(c, P, t.rel).ru}`, `${i + 1}-шарт: ${orderClueText(c, P, t.rel).kz}`), act: () => { unflash(clues, "hl"); $$("li", clues)[i].classList.add("hl"); } }));
        st.push({ t: tx(`Собираем всё вместе: ${t.sol.map(p => P[p].ru).join(" ▸ ")}. Каждое условие выполняется — и другого порядка нет.`, `Бәрін біріктіреміз: ${t.sol.map(p => P[p].kz).join(" ▸ ")}. Әр шарт орындалады — басқа рет жоқ.`), act: () => { unflash(clues, "hl"); place(t.sol); $$("li", clues).forEach(li => li.classList.add("okc")); } });
        return st;
      },
    };
  },
});

/* ---------------------------------------------------------------------
   ВЫВОДЫ ИЗ УСЛОВИЙ: кому что принадлежит (owners) / кто в каком доме живёт (houses)
   --------------------------------------------------------------------- */
const OWN_SETS = {
  bag: { q: tx("Распредели рюкзаки: перетащи каждый рюкзак к его хозяину.", "Рюкзактарды тарат: әр рюкзакты иесіне апар."), noun: tx("рюкзак", "рюкзак"),
    items: ["red", "blue", "green", "yellow", "purple"], pic: (v, px) => bagSVG(v, px), name: v => tx(`${COLORS[v].m} рюкзак`, `${COLORS[v].kz} рюкзак`), adj: v => tx(COLORS[v].m, COLORS[v].kz) },
  pet: { q: tx("У каждого ребёнка свой питомец. Перетащи питомца к хозяину.", "Әр баланың өз үй жануары бар. Жануарды иесіне апар."), noun: tx("питомец", "үй жануары"),
    items: ["🐱", "🐶", "🐰", "🐹", "🐢"], pic: (v, px) => emo(v, px * 0.8), name: v => ({ "🐱": tx("кошка", "мысық"), "🐶": tx("собака", "ит"), "🐰": tx("кролик", "қоян"), "🐹": tx("хомяк", "атжалман"), "🐢": tx("черепаха", "тасбақа") })[v] },
};
function ownClueText(c, S, P) {
  const nm = v => S.name(v);
  const g = p => ruGen(P[p]);
  switch (c.k) {
    case "pos": return tx(`У ${g(c.p)} — ${nm(c.v).ru}.`, `${KZ.loc(P[c.p].kz)} — ${nm(c.v).kz}.`);
    case "neg": return tx(`У ${g(c.p)} не ${nm(c.v).ru}.`, `${KZ.loc(P[c.p].kz)} ${nm(c.v).kz} жоқ.`);
    case "neg2": return tx(`У ${g(c.p)} не ${nm(c.v).ru} и не ${nm(c.w).ru}.`, `${KZ.loc(P[c.p].kz)} ${nm(c.v).kz} да, ${nm(c.w).kz} да жоқ.`);
    case "negb": return tx(`${cap(nm(c.v).ru)} — не у ${g(c.p)} и не у ${g(c.q)}.`, `${cap(nm(c.v).kz)} ${KZ.loc(P[c.p].kz)} де, ${KZ.loc(P[c.q].kz)} де жоқ.`);
  }
}
function ownClueOk(c, a) { // a[person] = индекс предмета
  switch (c.k) {
    case "pos": return a[c.p] === c.v;
    case "neg": return a[c.p] !== c.v;
    case "neg2": return a[c.p] !== c.v && a[c.p] !== c.w;
    case "negb": return a[c.p] !== c.v && a[c.q] !== c.v;
  }
}
const HOUSE_TXT = (c, P) => {
  const n = i => P[i];
  switch (c.k) {
    case "left": return tx(`${n(c.a).ru} живёт левее, чем ${n(c.b).ru}.`, `${n(c.a).kz} ${KZ.gen(n(c.b).kz)} сол жағында тұрады.`);
    case "rnext": return tx(`${n(c.b).ru} живёт сразу справа от ${ruGen(n(c.a))}.`, `${n(c.b).kz} ${KZ.gen(n(c.a).kz)} дәл оң жағында тұрады.`);
    case "nb": return tx(`${n(c.a).ru} и ${n(c.b).ru} — соседи.`, `${kzAnd(n(c.a).kz, n(c.b).kz)} — көршілер.`);
    case "nnb": return tx(`${n(c.a).ru} и ${n(c.b).ru} — не соседи.`, `${kzAnd(n(c.a).kz, n(c.b).kz)} — көрші емес.`);
    case "edge": return tx(`${n(c.a).ru} живёт в крайнем доме.`, `${n(c.a).kz} шеткі үйде тұрады.`);
    case "notedge": return tx(`${n(c.a).ru} живёт не в крайнем доме.`, `${n(c.a).kz} шеткі үйде тұрмайды.`);
    case "no": return tx(`${n(c.a).ru} живёт не в доме №${c.h + 1}.`, `${n(c.a).kz} №${c.h + 1} үйде тұрмайды.`);
    case "at": return tx(`${n(c.a).ru} живёт в доме №${c.h + 1}.`, `${n(c.a).kz} №${c.h + 1} үйде тұрады.`);
  }
};
function houseOk(c, pos) { // pos[person] = номер дома
  const N = pos.length;
  switch (c.k) {
    case "left": return pos[c.a] < pos[c.b];
    case "rnext": return pos[c.b] === pos[c.a] + 1;
    case "nb": return Math.abs(pos[c.a] - pos[c.b]) === 1;
    case "nnb": return Math.abs(pos[c.a] - pos[c.b]) !== 1;
    case "edge": return pos[c.a] === 0 || pos[c.a] === N - 1;
    case "notedge": return pos[c.a] !== 0 && pos[c.a] !== N - 1;
    case "no": return pos[c.a] !== c.h;
    case "at": return pos[c.a] === c.h;
  }
}
registerTask({
  id: "deduce", dir: "deduce", kind: "drag", title: tx("Кто чем владеет? Кто где живёт?", "Кімде не бар? Кім қайда тұрады?"),
  gen(R, grade, level) {
    const houses = grade >= 3 && (level === 3 || (grade === 4 && level >= 2) || R.chance(0.25));
    if (houses) {
      const N = grade === 3 ? 4 : (level === 3 ? 5 : 4);
      const P = R.sample(NAMES, N);
      const sol = R.shuffle(range(N)); const pos = []; sol.forEach((p, h) => (pos[p] = h));
      const pool = [];
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (a !== b) {
        if (pos[a] < pos[b]) pool.push({ k: "left", a, b });
        if (pos[b] === pos[a] + 1) pool.push({ k: "rnext", a, b });
        if (a < b && Math.abs(pos[a] - pos[b]) === 1) pool.push({ k: "nb", a, b });
        if (a < b && Math.abs(pos[a] - pos[b]) > 1 && grade === 4) pool.push({ k: "nnb", a, b });
      }
      for (let a = 0; a < N; a++) {
        pool.push(pos[a] === 0 || pos[a] === N - 1 ? { k: "edge", a } : { k: "notedge", a });
        for (let h = 0; h < N; h++) if (h !== pos[a]) pool.push({ k: "no", a, h });
      }
      const all = perms(range(N)).map(o => { const p = []; o.forEach((x, h) => (p[x] = h)); return p; });
      for (let t = 0; t < 60; t++) {
        const clues = buildClues(R, all, pool, houseOk, N + 2);
        if (clues && clues.length >= N - 1) return { mode: "houses", N, P, sol, clues: R.shuffle(clues), q: tx("Кто в каком доме живёт? Перетащи ребят к домам.", "Кім қай үйде тұрады? Балаларды үйлерге апар."),
          hints: [tx("Найди условие, после которого вариантов меньше всего (например, «в крайнем доме» — только №1 или последний).", "Нұсқасы ең аз шартты тап (мысалы, «шеткі үйде» — тек №1 немесе соңғысы)."),
            tx("Пробуй поставить человека в дом и проверь все условия. Если что-то не сходится — переставь.", "Адамды үйге қойып, барлық шартты тексер. Бірдеңе сәйкес келмесе — орнын ауыстыр.")] };
      }
      throw new Error("houses");
    }
    const set = R.pick(grade === 1 ? ["bag", "bag", "pet"] : ["bag", "pet"]);
    const S = OWN_SETS[set];
    const N = grade === 1 ? 3 : grade === 2 ? (level === 3 ? 4 : 3) : grade === 3 ? 4 : (level === 1 ? 4 : 5);
    const P = R.sample(NAMES, N);
    const items = R.sample(S.items, N);
    const sol = R.shuffle(range(N)); // sol[person] = предмет
    const kinds = grade === 1 ? ["pos", "neg"] : grade === 2 ? ["pos", "neg", "neg"] : grade === 3 ? ["neg", "neg", "neg2", "pos"] : ["neg", "neg2", "negb", "negb"];
    const pool = [];
    for (let p = 0; p < N; p++) for (let v = 0; v < N; v++) {
      if (sol[p] === v) { if (kinds.includes("pos")) pool.push({ k: "pos", p, v }); }
      else {
        pool.push({ k: "neg", p, v });
        for (let w = v + 1; w < N; w++) if (sol[p] !== w && kinds.includes("neg2")) pool.push({ k: "neg2", p, v, w });
        for (let q = p + 1; q < N; q++) if (sol[q] !== v && kinds.includes("negb")) pool.push({ k: "negb", p, q, v });
      }
    }
    const all = perms(range(N));
    for (let t = 0; t < 80; t++) {
      // в младших классах «положительные» условия реже, иначе задача решается в одно действие
      const pl = pool.filter(c => c.k !== "pos" || R.chance(grade === 1 ? 0.6 : 0.3));
      const clues = buildClues(R, all, pl, ownClueOk, N + 2);
      if (!clues) continue;
      if (grade >= 2 && clues.filter(c => c.k === "pos").length > 1) continue;
      if (!gridSolve(N, clues).done) continue; // решается без перебора — можно показать по шагам в таблице
      return { mode: "own", set, N, P, items, sol, clues: R.shuffle(clues), q: S.q,
        hints: [tx("Начни с того, про кого известно точно (или у кого остался только один вариант).", "Нақты белгілі адамнан (немесе бір ғана нұсқасы қалғаннан) баста."),
          tx("Нарисуй таблицу: строки — ребята, столбцы — предметы. Ставь ✗, где нельзя, и ✓, где точно.", "Кесте сыз: жолдар — балалар, бағандар — заттар. Болмайтын жерге ✗, анық жерге ✓ қой.")] };
    }
    throw new Error("deduce own");
  },
  render(t, box, ctx) {
    const P = t.P;
    if (t.mode === "houses") {
      const clues = el(`<ol class="clues">${t.clues.map((c, i) => `<li>${T(HOUSE_TXT(c, P))}</li>`).join("")}</ol>`);
      const pool = el(`<div class="pool" data-zone="pool">${P.map((p, i) => `<div class="chip person" data-chip data-p="${i}">${avatarSVG(i, 40)}<span>${T(p)}</span></div>`).join("")}</div>`);
      const street = el(`<div class="street">${range(t.N).map(h => `<div class="house"><svg viewBox="0 0 100 70" class="hs"><path d="M8 34 L50 4 L92 34" fill="${["#F03E3E", "#2F5BFF", "#12B886", "#FF8A1F", "#7B4AE2"][h]}" stroke="#151821" stroke-width="4" stroke-linejoin="round"/><rect x="18" y="32" width="64" height="36" fill="#FFF8EC" stroke="#151821" stroke-width="4"/><text x="50" y="57" text-anchor="middle" font-weight="700" font-size="22" fill="#151821">№${h + 1}</text></svg><div class="dz slot" data-zone="h${h}"></div></div>`).join("")}</div>`);
      box.append(clues, pool, street);
      dnd(box, { onDrop(chip, z) {
        if (box.classList.contains("locked")) return;
        if (z && z.classList.contains("slot")) { const old = $("[data-chip]", z); if (old && old !== chip) { const from = chip.parentElement; (from.classList.contains("slot") ? from : pool).append(old); } z.append(chip); } else pool.append(chip);
        unflash(clues, "bad");
      } });
      const arr = () => range(t.N).map(h => { const c = $(`[data-zone="h${h}"] [data-chip]`, street); return c ? +c.dataset.p : null; });
      return {
        check() {
          const a = arr(); if (a.includes(null)) return EMPTY(tx("Засели все дома.", "Барлық үйге адам қондыр."));
          const pos = []; a.forEach((p, h) => (pos[p] = h));
          const bad = t.clues.findIndex(c => !houseOk(c, pos));
          if (bad < 0) return { ok: true };
          $$("li", clues)[bad].classList.add("bad");
          return { ok: false, msg: tx(`Не выполняется условие №${bad + 1}: «${HOUSE_TXT(t.clues[bad], P).ru}»`, `№${bad + 1} шарт орындалмайды: «${HOUSE_TXT(t.clues[bad], P).kz}»`) };
        },
        solve() {
          const st = t.clues.map((c, i) => ({ t: tx(`Условие ${i + 1} сужает выбор: ${HOUSE_TXT(c, P).ru}`, `${i + 1}-шарт таңдауды тарылтады: ${HOUSE_TXT(c, P).kz}`), act: () => { unflash(clues, "hl"); $$("li", clues)[i].classList.add("hl"); } }));
          st.push({ t: tx(`Подходит только один вариант: ${t.sol.map((p, h) => `№${h + 1} — ${P[p].ru}`).join(", ")}.`, `Тек бір нұсқа сәйкес: ${t.sol.map((p, h) => `№${h + 1} — ${P[p].kz}`).join(", ")}.`), act: () => { unflash(clues, "hl"); t.sol.forEach((p, h) => $(`[data-zone="h${h}"]`, street).append($(`[data-p="${p}"]`, box))); $$("li", clues).forEach(li => li.classList.add("okc")); } });
          return st;
        },
      };
    }
    const S = OWN_SETS[t.set];
    const own = { ...S, name: i => S.name(t.items[i]) };
    const clues = el(`<ol class="clues">${t.clues.map((c, i) => `<li>${T(ownClueText(c, own, P))}</li>`).join("")}</ol>`);
    const pool = el(`<div class="pool" data-zone="pool">${t.items.map((v, i) => `<div class="chip pic" data-chip data-v="${i}" title="">${S.pic(v, 52)}</div>`).join("")}</div>`);
    const kids = el(`<div class="kids">${P.map((p, i) => `<div class="kid">${avatarSVG(i, 64)}<b>${T(p)}</b><div class="dz slot" data-zone="k${i}"></div></div>`).join("")}</div>`);
    const gridBox = el(`<div class="lgrid-wrap"></div>`);
    box.append(clues, kids, pool, gridBox);
    if (ctx.mode === "paper") gridBox.append(el(`<table class="lgrid"><tr><th></th>${t.items.map(v => `<th>${S.pic(v, 30)}</th>`).join("")}</tr>${P.map(p => `<tr><th>${T(p)}</th>${t.items.map(() => "<td></td>").join("")}</tr>`).join("")}</table>`));
    dnd(box, { onDrop(chip, z) {
      if (box.classList.contains("locked")) return;
      if (z && z.classList.contains("slot")) { const old = $("[data-chip]", z); if (old && old !== chip) { const from = chip.parentElement; (from.classList.contains("slot") ? from : pool).append(old); } z.append(chip); } else pool.append(chip);
      unflash(clues, "bad");
    } });
    const arr = () => range(t.N).map(p => { const c = $(`[data-zone="k${p}"] [data-chip]`, kids); return c ? +c.dataset.v : null; });
    return {
      check() {
        const a = arr(); if (a.includes(null)) return EMPTY(tx("Отдай каждому по предмету.", "Әркімге бір заттан бер."));
        const bad = t.clues.findIndex(c => !ownClueOk(c, a));
        if (bad < 0) return { ok: true };
        $$("li", clues)[bad].classList.add("bad");
        return { ok: false, msg: tx(`Не выполняется условие №${bad + 1}: «${ownClueText(t.clues[bad], own, P).ru}»`, `№${bad + 1} шарт орындалмайды: «${ownClueText(t.clues[bad], own, P).kz}»`) };
      },
      solve() {
        // таблица-решётка: ставим ✗ и ✓ по шагам
        const g = el(`<table class="lgrid"><tr><th></th>${t.items.map(v => `<th>${S.pic(v, 30)}</th>`).join("")}</tr>${P.map((p, r) => `<tr><th>${T(p)}</th>${t.items.map((v, c) => `<td data-r="${r}" data-c="${c}"></td>`).join("")}</tr>`).join("")}</table>`);
        gridBox.innerHTML = ""; gridBox.append(g);
        const cell = (r, c) => $(`td[data-r="${r}"][data-c="${c}"]`, g);
        const log = gridSolve(t.N, t.clues).log;
        const st = [{ t: tx("Составим таблицу: строки — ребята, столбцы — предметы.", "Кесте құрамыз: жолдар — балалар, бағандар — заттар.") }];
        for (const e of log) st.push({ t: e.why(P, own), act: () => { e.marks.forEach(([r, c, m]) => { const x = cell(r, c); x.textContent = m; x.className = m === "✓" ? "y" : "n"; x.classList.add("pop"); }); } });
        st.push({ t: tx("Таблица заполнена — раздаём предметы.", "Кесте толды — заттарды таратамыз."), act: () => t.sol.forEach((v, p) => $(`[data-zone="k${p}"]`, kids).append($(`[data-v="${v}"]`, box))) });
        return st;
      },
    };
  },
});
/* решение в таблице без перебора: ✗ из условий, потом «единственный вариант в строке/столбце» */
function gridSolve(N, clues) {
  const G = range(N).map(() => range(N).map(() => 0)); // 0 — пусто, -1 — ✗, 1 — ✓
  const log = [];
  const setX = (r, c, marks) => { if (G[r][c] === 0) { G[r][c] = -1; marks.push([r, c, "✗"]); } };
  const setV = (r, c, marks) => { if (G[r][c] !== 1) { G[r][c] = 1; marks.push([r, c, "✓"]); for (let k = 0; k < N; k++) { if (k !== c) setX(r, k, marks); if (k !== r) setX(k, c, marks); } } };
  clues.forEach((c, i) => {
    const marks = [];
    if (c.k === "pos") setV(c.p, c.v, marks);
    if (c.k === "neg") setX(c.p, c.v, marks);
    if (c.k === "neg2") { setX(c.p, c.v, marks); setX(c.p, c.w, marks); }
    if (c.k === "negb") { setX(c.p, c.v, marks); setX(c.q, c.v, marks); }
    log.push({ marks, why: (P, S) => tx(`Условие ${i + 1}: ${ownClueText(c, S, P).ru} Ставим ${c.k === "pos" ? "✓, а в остальных клетках строки и столбца — ✗" : "✗"}.`, `${i + 1}-шарт: ${ownClueText(c, S, P).kz} ${c.k === "pos" ? "✓ қоямыз, жол мен бағанның қалған ұяшықтарына — ✗" : "✗ қоямыз"}.`) });
  });
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < N; r++) {
      const free = range(N).filter(c => G[r][c] === 0);
      if (free.length === 1 && !G[r].includes(1)) { const marks = []; const c = free[0]; setV(r, c, marks); log.push({ marks, why: (P, S) => tx(`У ${ruGen(P[r])} остался только один вариант — ${S.name(c).ru}. Ставим ✓.`, `${KZ.loc(P[r].kz)} бір ғана нұсқа қалды — ${S.name(c).kz}. ✓ қоямыз.`) }); changed = true; }
    }
    for (let c = 0; c < N; c++) {
      const free = range(N).filter(r => G[r][c] === 0);
      if (free.length === 1 && !range(N).some(r => G[r][c] === 1)) { const marks = []; const r = free[0]; setV(r, c, marks); log.push({ marks, why: (P, S) => tx(`${cap(S.name(c).ru)} может быть только у ${ruGen(P[r])}. Ставим ✓.`, `${cap(S.name(c).kz)} тек ${KZ.loc(P[r].kz)} болуы мүмкін. ✓ қоямыз.`) }); changed = true; }
    }
  }
  const done = G.every(row => row.includes(1));
  return { done, log };
}

/* ---------------------------------------------------------------------
   ВЫСКАЗЫВАНИЯ: верно или неверно? «все», «некоторые», «ни один»
   --------------------------------------------------------------------- */
function predWord(p, form) { // form: pl | subjPl
  if (p.a === "s") return tx(SHAPES[p.v].pl, SHAPES[p.v].kzpl);
  const A = p.a === "c" ? COLORS[p.v] : SIZES[p.v];
  return form === "subjPl" ? tx(`${A.pl} фигуры`, `${A.kz} фигуралар`) : tx(A.pl, A.kz);
}
const predOk = (p, it) => it[p.a] === p.v;
function stmtText(s) {
  const P = s.P, Q = s.Q;
  if (s.k === "all") return tx(`Все ${predWord(P, "subjPl").ru} — ${predWord(Q, "pl").ru}.`, `Барлық ${predWord(P, "subjPl").kz} — ${predWord(Q, "pl").kz}.`);
  if (s.k === "if") return tx(`Если фигура — ${SHAPES[P.v].ru}, то она ${COLORS[Q.v][SHAPES[P.v].g]}.`, `Егер фигура ${SHAPES[P.v].kz} болса, онда ол ${COLORS[Q.v].kz}.`);
  if (s.k === "some") return tx(`Некоторые ${predWord(P, "subjPl").ru} — ${predWord(Q, "pl").ru}.`, `Кейбір ${predWord(P, "subjPl").kz} — ${predWord(Q, "pl").kz}.`);
  const g = P.a === "s" ? SHAPES[P.v].g : "f";
  const subj = P.a === "s" ? tx(SHAPES[P.v].ru, SHAPES[P.v].kz) : tx(`${(P.a === "c" ? COLORS : SIZES)[P.v].f} фигура`, `${(P.a === "c" ? COLORS : SIZES)[P.v].kz} фигура`);
  const adj = (Q.a === "c" ? COLORS : SIZES)[Q.v];
  if (s.k === "none") return tx(`${{ m: "Ни один", f: "Ни одна", n: "Ни одно" }[g]} ${subj.ru} не ${adj[g]}.`, `Бірде-бір ${subj.kz} ${adj.kz} емес.`);
  return tx(`Есть ${adj[g]} ${subj.ru}.`, `${cap(adj.kz)} ${subj.kz} бар.`); // exists
}
function stmtTruth(s, items) {
  const Ps = items.filter(it => predOk(s.P, it));
  if (s.k === "all" || s.k === "if") return Ps.every(it => predOk(s.Q, it));
  if (s.k === "none") return !Ps.some(it => predOk(s.Q, it));
  return Ps.some(it => predOk(s.Q, it)); // some, exists
}
registerTask({
  id: "statements", dir: "statements", kind: "tap", title: tx("Верно или неверно?", "Дұрыс па, бұрыс па?"),
  gen(R, grade, level) {
    const nItems = grade === 2 ? 6 : grade === 3 ? 8 : 9;
    const nSt = grade === 2 ? 3 : 4;
    const useZ = grade >= 3 && level >= 2;
    for (let t = 0; t < 400; t++) {
      const shapes = R.sample(["circle", "square", "triangle", "star", "heart"], 3), colors = R.sample(["red", "blue", "green", "yellow"], 3);
      const items = range(nItems).map(() => ({ s: R.pick(shapes), c: R.pick(colors), z: useZ ? R.pick(["big", "small"]) : "big" }));
      const preds = [...shapes.map(v => ({ a: "s", v })), ...colors.map(v => ({ a: "c", v })), ...(useZ ? [{ a: "z", v: "big" }, { a: "z", v: "small" }] : [])];
      const kinds = grade === 2 ? ["all", "exists", "none"] : grade === 3 ? ["all", "some", "none", "exists"] : ["all", "some", "none", "if", "all"];
      const st = [];
      for (let g = 0; g < 200 && st.length < nSt; g++) {
        const k = R.pick(kinds);
        let P = R.pick(preds), Q = R.pick(preds);
        if (P.a === Q.a) continue;
        if ((k === "none" || k === "exists") && Q.a === "s") continue;
        if (k === "if" && !(P.a === "s" && Q.a === "c")) continue;
        if (grade === 2 && k === "all" && P.a !== "s") continue;
        const Ps = items.filter(it => predOk(P, it));
        if (Ps.length < 2) continue;
        const s = { k, P, Q };
        if (k === "some" && Ps.every(it => predOk(Q, it))) continue; // «некоторые» без двусмысленности: не все
        s.v = stmtTruth(s, items);
        if (st.some(x => x.k === s.k && x.P.v === P.v && x.Q.v === Q.v)) continue;
        if (st.filter(x => x.v === s.v).length >= Math.ceil(nSt / 2) + (R.chance(0.3) ? 1 : 0)) continue;
        st.push(s);
      }
      if (st.length < nSt || st.every(s => s.v) || st.every(s => !s.v)) continue;
      return { items, st, q: tx("Посмотри на картинку. Какие высказывания верные, а какие — нет?", "Суретке қара. Қай пікір дұрыс, қайсысы бұрыс?"),
        hints: [tx("«Все» — значит, без единого исключения. Чтобы опровергнуть «все», хватит одной неподходящей фигуры.", "«Барлық» — бірде-бір ерекшеліксіз. «Барлығын» жоққа шығару үшін бір сәйкес емес фигура жетеді."),
          tx("«Некоторые» и «есть» — значит, найдётся хотя бы одна такая фигура. «Ни один» — нет ни одной.", "«Кейбір» мен «бар» — кем дегенде біреуі табылады. «Бірде-бір» — біреуі де жоқ.")] };
    }
    throw new Error("statements");
  },
  render(t, box) {
    const pic = el(`<div class="spic">${t.items.map((it, i) => `<span class="sit" data-i="${i}">${shapeSVG(it, 62)}</span>`).join("")}</div>`);
    const list = el(`<div class="stlist">${t.st.map((s, i) => `<div class="stm" data-i="${i}"><span class="stt">${T(stmtText(s))}</span><span class="tf"><button type="button" data-v="1">${L("Верно", "Дұрыс")}</button><button type="button" data-v="0">${L("Неверно", "Бұрыс")}</button></span></div>`).join("")}</div>`);
    box.append(pic, list);
    const ans = t.st.map(() => null);
    list.addEventListener("click", e => {
      const b = e.target.closest(".tf button"); if (!b || box.classList.contains("locked")) return;
      const row = b.closest(".stm"); const i = +row.dataset.i; ans[i] = +b.dataset.v;
      $$(".tf button", row).forEach(x => x.classList.toggle("on", x === b)); row.classList.remove("bad", "good");
    });
    const showWhy = i => {
      unflash(pic, "hl"); unflash(pic, "dim");
      const s = t.st[i]; const Ps = t.items.map((it, k) => [it, k]).filter(([it]) => predOk(s.P, it));
      const goodQ = Ps.filter(([it]) => predOk(s.Q, it)), badQ = Ps.filter(([it]) => !predOk(s.Q, it));
      t.items.forEach((it, k) => !predOk(s.P, it) && $(`.sit[data-i="${k}"]`, pic).classList.add("dim"));
      if (s.k === "all" || s.k === "if") { (s.v ? goodQ : badQ).forEach(([, k]) => $(`.sit[data-i="${k}"]`, pic).classList.add("hl")); return s.v ? tx("Проверяем все подходящие фигуры — исключений нет. Верно.", "Барлық сәйкес фигураны тексереміз — ерекшелік жоқ. Дұрыс.") : tx(`Нашлось исключение (подсвечено) — значит, «все» неверно.`, `Ерекшелік табылды (белгіленген) — демек, «барлығы» бұрыс.`); }
      if (s.k === "none") { goodQ.forEach(([, k]) => $(`.sit[data-i="${k}"]`, pic).classList.add("hl")); return s.v ? tx("Среди подходящих фигур нет ни одной такой. Верно.", "Сәйкес фигуралардың ішінде ондай бірде-біреуі жоқ. Дұрыс.") : tx("А вот такая фигура есть (подсвечена) — значит, «ни один» неверно.", "Ал мұндай фигура бар (белгіленген) — демек, «бірде-бір» бұрыс."); }
      goodQ.forEach(([, k]) => $(`.sit[data-i="${k}"]`, pic).classList.add("hl"));
      return s.v ? tx("Такая фигура есть (подсвечена) — значит, верно.", "Мұндай фигура бар (белгіленген) — демек, дұрыс.") : tx("Ни одной такой фигуры нет — значит, неверно.", "Мұндай бірде-бір фигура жоқ — демек, бұрыс.");
    };
    return {
      check() {
        if (ans.includes(null)) return EMPTY(tx("Ответь на каждое высказывание: «верно» или «неверно».", "Әр пікірге жауап бер: «дұрыс» не «бұрыс»."));
        const wrong = t.st.map((s, i) => (ans[i] === (s.v ? 1 : 0) ? -1 : i)).filter(i => i >= 0);
        $$(".stm", list).forEach((r, i) => r.classList.toggle("bad", wrong.includes(i)));
        if (!wrong.length) { $$(".stm", list).forEach(r => r.classList.add("good")); return { ok: true }; }
        const w = showWhy(wrong[0]);
        return { ok: false, msg: tx(`Ошибок: ${wrong.length}. Посмотри на высказывание №${wrong[0] + 1}. ${w.ru}`, `Қате: ${wrong.length}. №${wrong[0] + 1} пікірге қара. ${w.kz}`) };
      },
      solve() {
        return t.st.map((s, i) => ({ t: tx(`«${stmtText(s).ru}» — ${s.v ? "верно" : "неверно"}. ${showWhyText(i).ru}`, `«${stmtText(s).kz}» — ${s.v ? "дұрыс" : "бұрыс"}. ${showWhyText(i).kz}`), act: () => { showWhy(i); const r = $$(".stm", list)[i]; $$(".tf button", r).forEach(b => b.classList.toggle("on", +b.dataset.v === (s.v ? 1 : 0))); r.classList.add("good"); } }));
        function showWhyText(i) { const s = t.st[i]; if (s.k === "all" || s.k === "if") return s.v ? tx("Исключений нет.", "Ерекшелік жоқ.") : tx("Есть исключение.", "Ерекшелік бар."); if (s.k === "none") return s.v ? tx("Таких нет.", "Ондай жоқ.") : tx("Такая есть.", "Ондай бар."); return s.v ? tx("Хотя бы одна есть.", "Кем дегенде біреуі бар.") : tx("Ни одной нет.", "Біреуі де жоқ."); }
      },
    };
  },
});
