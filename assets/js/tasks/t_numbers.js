"use strict";
/* =====================================================================
   ЧИСЛОВЫЕ ГОЛОВОЛОМКИ: треугольники (triangle) · расставь знаки (signs)
   ТАБЛИЦЫ И МАТРИЦЫ: matrix
   ===================================================================== */

/* Правила для треугольников: a — левый нижний, b — правый нижний, c — верхний.
   txt — как правило читается вслух, steps — как считать на конкретных числах. */
const TRI_RULES = [
  { id: "a+b+c", f: (a, b, c) => a + b + c, ru: "сложить все три числа", kz: "үш санды қосу", s: (a, b, c) => `${a} + ${b} + ${c} = ${a + b + c}`, g: 2 },
  { id: "a+b-c", f: (a, b, c) => a + b - c, ru: "сложить нижние числа и вычесть верхнее", kz: "төменгі сандарды қосып, жоғарғысын азайту", s: (a, b, c) => `${a} + ${b} − ${c} = ${a + b - c}`, g: 2 },
  { id: "c-a-b", f: (a, b, c) => c - a - b, ru: "из верхнего вычесть оба нижних", kz: "жоғарғыдан екі төменгіні азайту", s: (a, b, c) => `${c} − ${a} − ${b} = ${c - a - b}`, g: 2 },
  { id: "a+b", f: (a, b) => a + b, ru: "сложить нижние числа (верхнее не нужно)", kz: "төменгі сандарды қосу (жоғарғысы керек емес)", s: (a, b) => `${a} + ${b} = ${a + b}`, g: 2 },
  { id: "c+a-b", f: (a, b, c) => c + a - b, ru: "к верхнему прибавить левое и вычесть правое", kz: "жоғарғыға сол жақтағыны қосып, оң жақтағыны азайту", s: (a, b, c) => `${c} + ${a} − ${b} = ${c + a - b}`, g: 2 },
  { id: "a*b-c", f: (a, b, c) => a * b - c, ru: "перемножить нижние и вычесть верхнее", kz: "төменгілерді көбейтіп, жоғарғысын азайту", s: (a, b, c) => `${a} × ${b} − ${c} = ${a * b - c}`, g: 3 },
  { id: "a*b+c", f: (a, b, c) => a * b + c, ru: "перемножить нижние и прибавить верхнее", kz: "төменгілерді көбейтіп, жоғарғысын қосу", s: (a, b, c) => `${a} × ${b} + ${c} = ${a * b + c}`, g: 3 },
  { id: "(a+b)*c", f: (a, b, c) => (a + b) * c, ru: "сложить нижние и умножить на верхнее", kz: "төменгілерді қосып, жоғарғыға көбейту", s: (a, b, c) => `(${a} + ${b}) × ${c} = ${(a + b) * c}`, g: 3 },
  { id: "a*b*c", f: (a, b, c) => a * b * c, ru: "перемножить все три числа", kz: "үш санды көбейту", s: (a, b, c) => `${a} × ${b} × ${c} = ${a * b * c}`, g: 3 },
  { id: "a*b", f: (a, b) => a * b, ru: "перемножить нижние числа", kz: "төменгі сандарды көбейту", s: (a, b) => `${a} × ${b} = ${a * b}`, g: 3 },
  { id: "(a+b)-c*2", f: (a, b, c) => a + b - 2 * c, ru: "сложить нижние и вычесть удвоенное верхнее", kz: "төменгілерді қосып, жоғарғының екі еселенгенін азайту", s: (a, b, c) => `${a} + ${b} − 2×${c} = ${a + b - 2 * c}`, g: 4 },
  { id: "(c-a)*b", f: (a, b, c) => (c - a) * b, ru: "из верхнего вычесть левое и умножить на правое", kz: "жоғарғыдан сол жақтағыны азайтып, оң жақтағыға көбейту", s: (a, b, c) => `(${c} − ${a}) × ${b} = ${(c - a) * b}`, g: 4 },
  { id: "a*c-b", f: (a, b, c) => a * c - b, ru: "умножить левое на верхнее и вычесть правое", kz: "сол жақтағыны жоғарғыға көбейтіп, оң жақтағыны азайту", s: (a, b, c) => `${a} × ${c} − ${b} = ${a * c - b}`, g: 4 },
];
registerTask({
  id: "triangle", dir: "numpuzzle", kind: "input", title: tx("Числа в треугольниках", "Үшбұрыштағы сандар"),
  gen(R, grade, level) {
    const g = Math.max(2, grade);
    const cand = TRI_RULES.filter(r => r.g <= g + 1); // проверяем и по «чужим» правилам — чтобы ответ был единственным
    const told = level === 1 && grade <= 2; // правило сказано в условии — берём самые понятные
    const use = told ? TRI_RULES.filter(r => r.id === "a+b+c" || r.id === "a+b-c") : TRI_RULES.filter(r => r.g <= g && (g < 3 || r.g >= g - 1 || level === 1));
    const max = grade <= 2 ? 20 : grade === 3 ? 60 : 100;
    const nlo = grade <= 2 ? 1 : 2, nhi = grade <= 2 ? 9 : grade === 3 ? 9 : 12;
    for (let t = 0; t < 600; t++) {
      const rule = R.pick(use);
      const mk = () => { for (let k = 0; k < 50; k++) { const a = R.int(nlo, nhi), b = R.int(nlo, nhi), c = R.int(nlo, rule.id === "c-a-b" ? 20 : nhi); const v = rule.f(a, b, c); if (v >= 0 && v <= max) return [a, b, c]; } return null; };
      const shown = level === 1 && grade <= 2 ? 1 : 2;
      const ex = [];
      for (let k = 0; k < shown; k++) { const e = mk(); if (e) ex.push(e); }
      const qn = mk(); if (!qn || ex.length < shown) continue;
      // добавляем примеры, пока правило не станет единственным
      let alive = cand.filter(r => ex.every(([a, b, c]) => r.f(a, b, c) === rule.f(a, b, c)));
      let guard = 0;
      while (alive.length > 1 && ex.length < 3 && guard++ < 30) {
        const e = mk(); if (!e) break;
        const keep = alive.filter(r => r.f(...e) === rule.f(...e));
        if (keep.length < alive.length) { ex.push(e); alive = keep; }
      }
      if (alive.length !== 1 && !(level === 1 && grade <= 2)) continue;
      const ans = rule.f(...qn);
      // ответ по «чужому» правилу не должен совпадать с правильным — иначе нечему учить
      const others = TRI_RULES.filter(r => r !== rule && r.f(...qn) === ans);
      if (others.length && level > 1) continue;
      return { rule: rule.id, ex: ex.map(e => [...e, rule.f(...e)]), qn, ans, told: level === 1 && grade <= 2,
        q: level === 1 && grade <= 2 ? tx(`Правило: чтобы получить число в центре, нужно ${rule.ru}. Найди число в последнем треугольнике.`, `Ереже: ортадағы санды табу үшін ${rule.kz} керек. Соңғы үшбұрыштағы санды тап.`)
          : tx("Числа в центре получены по одному и тому же правилу. Найди правило и число в последнем треугольнике.", "Ортадағы сандар бір ережемен алынған. Ережені тауып, соңғы үшбұрыштағы санды тап."),
        hints: [tx("Попробуй сложить, вычесть или умножить числа в вершинах. Правило должно подходить ко ВСЕМ треугольникам.", "Төбелердегі сандарды қосып, азайтып немесе көбейтіп көр. Ереже БАРЛЫҚ үшбұрышқа сай болуы керек."),
          tx(`Подсказка: нужно ${rule.ru}.`, `Кеңес: ${rule.kz} керек.`)] };
    }
    throw new Error("triangle");
  },
  render(t, box) {
    const rule = TRI_RULES.find(r => r.id === t.rule);
    const tri = (a, b, c, mid) => `<div class="tri"><svg viewBox="-14 -16 228 210"><path d="M100 14 L188 164 L12 164 Z" fill="#FFF8EC" stroke="#151821" stroke-width="5" stroke-linejoin="round"/>
      ${[[100, 14, c], [12, 164, a], [188, 164, b]].map(([x, y, v]) => `<circle cx="${x}" cy="${y}" r="23" fill="#fff" stroke="#151821" stroke-width="4"/><text x="${x}" y="${y + 1}" class="tvs">${v}</text>`).join("")}
      ${mid !== "" ? `<text x="100" y="116" class="tvm">${mid}</text>` : ""}</svg><span class="tslot"></span><span class="tcalc"></span></div>`;
    const f = numField({ max: 4 });
    const row = el(`<div class="trirow">${t.ex.map(([a, b, c, m]) => tri(a, b, c, m)).join("")}${tri(t.qn[0], t.qn[1], t.qn[2], "")}</div>`);
    $$(".tri", row).at(-1).classList.add("qt");
    $(".tri.qt .tslot", row).append(f);
    box.append(row, keypad(() => $(".checkb", box.closest(".task"))?.click()));
    focusNum(f);
    const tris = () => $$(".tri", row);
    return {
      check() {
        if (!f.value) return EMPTY(tx("Впиши число в центр последнего треугольника.", "Соңғы үшбұрыштың ортасына сан жаз."));
        const v = +f.value;
        if (v === t.ans) { f.classList.add("good"); return { ok: true, msg: tx(`Правило: ${rule.ru}. ${rule.s(...t.qn)}.`, `Ереже: ${rule.kz}. ${rule.s(...t.qn)}.`) }; }
        f.classList.add("bad"); setTimeout(() => f.classList.remove("bad"), 900);
        // ученик применил какое-то другое правило? покажем, где оно ломается
        const other = TRI_RULES.find(r => r.id !== t.rule && r.f(...t.qn) === v);
        if (other && !t.told) {
          const bad = t.ex.find(([a, b, c, m]) => other.f(a, b, c) !== m);
          if (bad) return { ok: false, msg: tx(`Похоже, ты решил ${other.ru}. Проверь это правило на треугольнике с числами ${bad[0]}, ${bad[1]}, ${bad[2]}: ${other.s(bad[0], bad[1], bad[2])}, а в центре стоит ${bad[3]}. Значит, правило другое.`, `Сен «${other.kz}» деп шештің бе? Осы ережені ${bad[0]}, ${bad[1]}, ${bad[2]} сандары бар үшбұрышта тексер: ${other.s(bad[0], bad[1], bad[2])}, ал ортасында ${bad[3]}. Демек, ереже басқа.`) };
        }
        return { ok: false, msg: tx("Не совпадает. Проверь своё правило на каждом заполненном треугольнике — оно должно подходить ко всем.", "Сәйкес емес. Ережеңді әр толтырылған үшбұрышта тексер — ол бәріне сай болуы керек.") };
      },
      solve() {
        const st = [];
        if (!t.told) st.push({ t: tx("Одного треугольника мало: к нему могут подойти разные правила. Поэтому проверяем правило на каждом примере.", "Бір үшбұрыш аз: оған әртүрлі ереже сәйкес келуі мүмкін. Сондықтан ережені әр мысалда тексереміз.") });
        t.ex.forEach(([a, b, c, m], i) => st.push({ t: tx(`Треугольник ${i + 1}: ${rule.s(a, b, c)} ✓`, `${i + 1}-үшбұрыш: ${rule.s(a, b, c)} ✓`), act: () => { const x = tris()[i]; $(".tcalc", x).textContent = rule.s(a, b, c); x.classList.add("hl"); } }));
        st.push({ t: tx(`Правило подходит ко всем: ${rule.ru}. Значит: ${rule.s(...t.qn)}.`, `Ереже бәріне сай: ${rule.kz}. Демек: ${rule.s(...t.qn)}.`), act: () => { f.set(t.ans); f.classList.add("good"); $(".tcalc", tris().at(-1)).textContent = rule.s(...t.qn); } });
        return st;
      },
    };
  },
});

/* ---------------------------------------------------------------------
   РАССТАВЬ ЗНАКИ: 7 □ 3 □ 2 = 6   (+ и −; в 4 классе ещё ×)
   --------------------------------------------------------------------- */
function evalSigns(nums, ops) { // × выполняется первым
  const terms = [nums[0]]; const pm = [];
  ops.forEach((o, i) => { if (o === "×") terms[terms.length - 1] *= nums[i + 1]; else { pm.push(o); terms.push(nums[i + 1]); } });
  return terms.reduce((s, x, i) => (i === 0 ? x : pm[i - 1] === "+" ? s + x : s - x), 0);
}
registerTask({
  id: "signs", dir: "numpuzzle", kind: "tap", title: tx("Расставь знаки", "Таңбаларды қой"),
  gen(R, grade, level) {
    const n = grade <= 2 ? 3 : grade === 3 ? (level === 3 ? 5 : 4) : (level === 1 ? 4 : 5);
    const set = grade === 4 && level >= 2 ? ["+", "−", "×"] : ["+", "−"];
    const hi = grade <= 2 ? 9 : 12;
    for (let t = 0; t < 500; t++) {
      const nums = range(n).map(() => R.int(1, hi));
      const all = []; const rec = (acc) => { if (acc.length === n - 1) return all.push(acc.slice()); for (const s of set) { acc.push(s); rec(acc); acc.pop(); } }; rec([]);
      const ops = R.pick(all); const v = evalSigns(nums, ops);
      if (v < 0 || v > (grade <= 2 ? 20 : 100)) continue;
      if (set.includes("×") && !ops.includes("×")) continue;
      const sols = all.filter(o => evalSigns(nums, o) === v);
      if (sols.length !== 1) continue; // решение единственное
      if (ops.every(o => o === "+")) continue;
      return { nums, ops, v, set, q: tx(`Поставь между числами знаки ${set.join(" ")}, чтобы получилось верное равенство. Нажимай на квадратик, чтобы сменить знак.`, `Теңдік дұрыс болуы үшін сандардың арасына ${set.join(" ")} таңбаларын қой. Таңбаны ауыстыру үшін шаршыны бас.`),
        hints: [tx("Сначала посмотри, что получится, если везде поставить «+». Это больше или меньше нужного?", "Алдымен барлық жерге «+» қойсаң не шығатынын қара. Бұл керегінен көп пе, аз ба?"),
          ...(set.includes("×") ? [tx("Помни: умножение выполняется раньше сложения и вычитания.", "Есте сақта: көбейту қосу мен азайтудан бұрын орындалады.")] : [tx(`Каждый «−» вместо «+» уменьшает сумму на удвоенное число после знака.`, `«+» орнына қойылған әр «−» қосындыны таңбадан кейінгі санның екі еселенгеніне азайтады.`)])] };
    }
    throw new Error("signs");
  },
  render(t, box) {
    const cur = t.ops.map(() => null);
    const row = el(`<div class="eqrow">${t.nums.map((x, i) => `<span class="en">${x}</span>${i < t.nums.length - 1 ? `<button type="button" class="eop" data-i="${i}">?</button>` : ""}`).join("")}<span class="en">=</span><span class="en res">${t.v}</span></div>`);
    const live = el(`<div class="eqlive mute"></div>`);
    box.append(row, live);
    const upd = () => {
      $$(".eop", row).forEach((b, i) => { b.textContent = cur[i] ?? "?"; b.classList.toggle("set", !!cur[i]); });
      live.innerHTML = cur.includes(null) ? "" : L(`Сейчас получается: ${evalSigns(t.nums, cur)}`, `Қазір шығады: ${evalSigns(t.nums, cur)}`);
    };
    row.addEventListener("click", e => { const b = e.target.closest(".eop"); if (!b || box.classList.contains("locked")) return; const i = +b.dataset.i; const s = t.set; cur[i] = s[(s.indexOf(cur[i]) + 1) % s.length]; upd(); });
    return {
      check() {
        if (cur.includes(null)) return EMPTY(tx("Поставь знаки во все квадратики.", "Барлық шаршыға таңба қой."));
        const v = evalSigns(t.nums, cur);
        if (v === t.v) return { ok: true };
        return { ok: false, msg: tx(`С такими знаками получается ${v}, а нужно ${t.v}. ${v > t.v ? "Нужно уменьшить." : "Нужно увеличить."}`, `Мұндай таңбалармен ${v} шығады, ал керегі — ${t.v}. ${v > t.v ? "Азайту керек." : "Көбейту керек."}`) };
      },
      solve() {
        const plus = t.nums.map(() => "+").slice(1);
        const sAll = evalSigns(t.nums, plus);
        const st = [{ t: tx(`Если везде «+», получится ${sAll}. А нужно ${t.v}.`, `Барлық жерде «+» болса, ${sAll} шығады. Ал керегі — ${t.v}.`), act: () => { plus.forEach((s, i) => (cur[i] = s)); upd(); } }];
        st.push({ t: tx(`Пробуем разные знаки и проверяем — подходит только один вариант: ${t.nums.map((x, i) => x + (i < t.ops.length ? ` ${t.ops[i]} ` : "")).join("")} = ${t.v}.`, `Әртүрлі таңбаны қойып тексереміз — бір ғана нұсқа сай: ${t.nums.map((x, i) => x + (i < t.ops.length ? ` ${t.ops[i]} ` : "")).join("")} = ${t.v}.`), act: () => { t.ops.forEach((s, i) => (cur[i] = s)); upd(); } });
        return st;
      },
    };
  },
});

/* ---------------------------------------------------------------------
   МАТРИЦА 3×3: какой фигуры не хватает?
   --------------------------------------------------------------------- */
registerTask({
  id: "matrix", dir: "matrix", kind: "tap", title: tx("Чего не хватает в таблице?", "Кестеде не жетпейді?"),
  gen(R, grade, level) {
    const shapes = R.sample(["circle", "square", "triangle", "star", "heart", "diamond"], 3);
    const colors = R.sample(["red", "blue", "green", "yellow", "purple"], 3);
    const L3 = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
    let kind, cell;
    if (grade === 2 && level === 1) { kind = "rowcol"; cell = (r, c) => ({ s: shapes[r], c: colors[c], z: "big" }); }
    else if (grade === 2 || (grade === 3 && level === 1)) { kind = "latin"; const p = R.shuffle([0, 1, 2]); cell = (r, c) => ({ s: shapes[L3[r][c]], c: colors[p[r]], z: "big" }); }
    else if (grade === 3) { kind = "latin2"; const sh = R.int(1, 2); cell = (r, c) => ({ s: shapes[L3[r][c]], c: colors[L3[(r * sh) % 3][(c + 1) % 3]], z: "big" }); }
    else { kind = level === 1 ? "latin2" : "count"; cell = level === 1 ? (r, c) => ({ s: shapes[L3[r][c]], c: colors[L3[(r * 2) % 3][(c + 1) % 3]], z: "big" }) : (r, c) => ({ s: shapes[L3[r][c]], c: colors[L3[r][(c + 2) % 3]], z: "big", n: c + 1 }); }
    const M = range(3).map(r => range(3).map(c => cell(r, c)));
    if (kind === "latin2") { // проверка: в каждой строке и столбце по одному цвету и форме, и пары не повторяются
      const pairs = new Set(M.flat().map(o => o.s + o.c)); if (pairs.size < 9) return this.gen(R, grade, level);
    }
    const br = R.int(grade === 2 ? 1 : 0, 2), bc = R.int(grade === 2 ? 1 : 0, 2);
    const right = M[br][bc];
    const opts = [right]; const pool = [];
    for (const s of shapes) for (const c of colors) for (const n of kind === "count" ? [1, 2, 3] : [0]) pool.push({ s, c, z: "big", ...(n ? { n } : {}) });
    for (const o of R.shuffle(pool)) { if (opts.length >= 4) break; if (!opts.some(x => sameShape(x, o)) && (o.s === right.s || o.c === right.c || (o.n && o.n === right.n))) opts.push(o); }
    const sh = R.shuffle(opts);
    const rules = { rowcol: tx("В каждой строке — одна и та же форма, в каждом столбце — один и тот же цвет.", "Әр жолда — бір пішін, әр бағанда — бір түс."),
      latin: tx("В каждой строке и в каждом столбце есть все три формы, по одной. Цвет в строке одинаковый.", "Әр жол мен әр бағанда үш пішіннің әрқайсысы бір реттен бар. Жолдағы түс бірдей."),
      latin2: tx("В каждой строке и каждом столбце — по одной фигуре каждой формы и каждого цвета.", "Әр жол мен әр бағанда әр пішіннен және әр түстен бір-бір фигура бар."),
      count: tx("В каждой строке и столбце все формы и цвета разные, а число точек растёт слева направо: 1, 2, 3.", "Әр жол мен бағанда пішін мен түс әртүрлі, ал нүкте саны солдан оңға өседі: 1, 2, 3.") };
    return { M, br, bc, opts: sh, ans: sh.findIndex(o => sameShape(o, right)), right, kind, rule: rules[kind],
      q: tx("Какой фигуры не хватает в таблице? Посмотри на строки и столбцы.", "Кестеде қай фигура жетпейді? Жолдар мен бағандарға қара."),
      hints: [tx("Посмотри на строку с пустой клеткой: каких форм и цветов в ней уже нет?", "Бос ұяшығы бар жолға қара: онда қай пішін мен түс жоқ?"), tx("Теперь проверь столбец с пустой клеткой.", "Енді бос ұяшығы бар бағанды тексер.")] };
  },
  render(t, box) {
    const grid = el(`<div class="mgrid">${t.M.map((row, r) => row.map((o, c) => `<div class="mc ${r === t.br && c === t.bc ? "q" : ""}" data-r="${r}" data-c="${c}">${r === t.br && c === t.bc ? "?" : shapeSVG(o, 70)}</div>`).join("")).join("")}</div>`);
    box.append(grid);
    const q = $(".mc.q", grid);
    const ch = choiceUI(box, t.opts.map(o => shapeSVG(o, 70)), { cls: "shapes", onPick: i => { q.innerHTML = shapeSVG(t.opts[i], 70); } });
    const rowCells = r => $$(`.mc[data-r="${r}"]`, grid), colCells = c => $$(`.mc[data-c="${c}"]`, grid);
    return {
      check() {
        const i = ch.get(); if (i == null) return EMPTY(tx("Выбери фигуру внизу.", "Төменнен фигураны таңда."));
        if (i === t.ans) { ch.mark(i, "good"); return { ok: true, msg: t.rule }; }
        ch.mark(i, "bad"); setTimeout(() => ch.clear(), 900);
        const o = t.opts[i];
        const inRow = range(3).filter(c => c !== t.bc).map(c => t.M[t.br][c]); const inCol = range(3).filter(r => r !== t.br).map(r => t.M[r][t.bc]);
        let m;
        if (t.kind !== "rowcol" && inRow.some(x => x.s === o.s)) { m = tx(`В этой строке уже есть ${SHAPES[o.s].ru} — второй такой формы быть не должно.`, `Бұл жолда ${SHAPES[o.s].kz} бар — екіншісі болмауы керек.`); flash(rowCells(t.br), "hl", 1600); }
        else if (t.kind !== "rowcol" && inCol.some(x => x.s === o.s)) { m = tx(`В этом столбце уже есть ${SHAPES[o.s].ru}.`, `Бұл бағанда ${SHAPES[o.s].kz} бар.`); flash(colCells(t.bc), "hl", 1600); }
        else if (t.kind === "latin" && o.c !== t.right.c) { m = tx("Посмотри на цвет: в каждой строке он одинаковый.", "Түсіне қара: әр жолда ол бірдей."); flash(rowCells(t.br), "hl", 1600); }
        else if (t.kind === "rowcol") { m = o.s !== t.right.s ? tx("В каждой строке форма одинаковая — посмотри на соседей слева.", "Әр жолда пішін бірдей — сол жақтағы көршілерге қара.") : tx("В каждом столбце цвет одинаковый — посмотри на фигуры сверху.", "Әр бағанда түс бірдей — жоғарыдағы фигураларға қара."); }
        else if (inRow.some(x => x.c === o.c) || inCol.some(x => x.c === o.c)) { m = tx(`Такой цвет уже есть в этой строке или в этом столбце.`, `Бұл түс осы жолда немесе бағанда бар.`); flash([...rowCells(t.br), ...colCells(t.bc)], "hl", 1600); }
        else m = tx("Посмотри на число точек: как оно меняется в строке?", "Нүкте санына қара: жолда ол қалай өзгереді?");
        return { ok: false, msg: m };
      },
      solve() {
        return [
          { t: t.rule },
          { t: tx("Смотрим на строку с пустой клеткой.", "Бос ұяшығы бар жолға қараймыз."), act: () => { unflash(grid); flash(rowCells(t.br)); } },
          { t: tx("И на столбец с пустой клеткой.", "Бос ұяшығы бар бағанға қараймыз."), act: () => { unflash(grid); flash(colCells(t.bc)); } },
          { t: tx("Подходит только одна фигура.", "Тек бір фигура сай келеді."), act: () => { unflash(grid); ch.set(t.ans); ch.mark(t.ans, "good"); q.innerHTML = shapeSVG(t.right, 70); q.classList.add("good"); } },
        ];
      },
    };
  },
});
