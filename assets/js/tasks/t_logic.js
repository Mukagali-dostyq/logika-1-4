"use strict";
/* =====================================================================
   ОГРАНИЧЕНИЯ И РАЗМЕЩЕНИЕ: судоку с картинками (sudoku)
   КОМБИНАТОРИКА: combi
   СТРАТЕГИЧЕСКИЕ ЗАДАЧИ: весы (scales) · игра «возьми последнюю» (nim) · переправа (river)
   ЛОГИЧЕСКИЕ ЗАДАЧИ В ТЕКСТЕ: wordprob
   ===================================================================== */

/* ---------------------------- СУДОКУ ---------------------------- */
function sudokuSolveCount(G, n, br, bc, limit = 2) {
  let cnt = 0; const g = G.map(r => r.slice());
  const ok = (r, c, v) => { for (let k = 0; k < n; k++) if (g[r][k] === v || g[k][c] === v) return false; if (br) { const r0 = r - r % br, c0 = c - c % bc; for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) if (g[r0 + i][c0 + j] === v) return false; } return true; };
  const rec = () => { for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (g[r][c] < 0) { for (let v = 0; v < n; v++) if (ok(r, c, v)) { g[r][c] = v; rec(); g[r][c] = -1; if (cnt >= limit) return; } return; } cnt++; };
  rec(); return cnt;
}
registerTask({
  id: "sudoku", dir: "sudoku", kind: "tap", title: tx("Судоку с картинками", "Суретті судоку"),
  gen(R, grade, level) {
    const [n, br, bc] = grade === 1 ? [3, 0, 0] : grade === 4 && level >= 2 ? [6, 2, 3] : [4, 2, 2];
    const holes = { 1: [4, 5, 6], 2: [6, 8, 9], 3: [9, 10, 11], 4: [11, 15, 19] }[grade][level - 1];
    let sol = range(n).map(r => range(n).map(c => br ? (bc * (r % br) + Math.floor(r / br) + c) % n : (r + c) % n));
    // перемешиваем: символы, строки внутри полос, полосы, столбцы внутри стопок
    const sym = R.shuffle(range(n)); sol = sol.map(r => r.map(v => sym[v]));
    const shufGroups = (k, size) => R.shuffle(range(k / size)).flatMap(b => R.shuffle(range(size)).map(i => b * size + i));
    const ro = br ? shufGroups(n, br) : R.shuffle(range(n)); const co = br ? shufGroups(n, bc) : R.shuffle(range(n));
    sol = ro.map(r => co.map(c => sol[r][c]));
    const G = sol.map(r => r.slice());
    let removed = 0;
    for (const k of R.shuffle(range(n * n))) { if (removed >= holes) break; const r = Math.floor(k / n), c = k % n; const v = G[r][c]; G[r][c] = -1; if (sudokuSolveCount(G, n, br, bc) === 1) removed++; else G[r][c] = v; }
    return { n, br, bc, sol, G, q: br ? tx(`Заполни клетки так, чтобы в каждой строке, в каждом столбце и в каждом выделенном квадрате все ${n} картинок были разными.`, `Әр жолда, әр бағанда және әр бөлінген шаршыда барлық ${n} сурет әртүрлі болатындай ұяшықтарды толтыр.`)
        : tx("Заполни клетки так, чтобы в каждой строке и в каждом столбце все картинки были разными.", "Әр жолда және әр бағанда барлық сурет әртүрлі болатындай ұяшықтарды толтыр."),
      hints: [tx("Найди строку, столбец или квадрат, где не хватает только одной картинки.", "Бір ғана суреті жетпейтін жолды, бағанды немесе шаршыны тап."), tx("Для пустой клетки посмотри, какие картинки уже есть в её строке, столбце и квадрате — какая осталась?", "Бос ұяшық үшін оның жолында, бағанында және шаршысында қандай суреттер бар екенін қара — қайсысы қалды?")] };
  },
  render(t, box) {
    const { n, br, bc } = t;
    const pic = v => shapeSVG({ ...CUBE_SYMS[v], z: "big" }, n === 6 ? 40 : 52);
    const cur = t.G.map(r => r.slice());
    const grid = el(`<div class="sgrid n${n}" style="--n:${n}">${range(n).map(r => range(n).map(c => `<div class="sc ${t.G[r][c] >= 0 ? "given" : ""} ${br && c % bc === bc - 1 && c < n - 1 ? "br" : ""} ${br && r % br === br - 1 && r < n - 1 ? "bb" : ""}" data-r="${r}" data-c="${c}" ${t.G[r][c] < 0 ? "data-zone" : ""}>${t.G[r][c] >= 0 ? pic(t.G[r][c]) : ""}</div>`).join("")).join("")}</div>`);
    const pal = el(`<div class="spal">${range(n).map(v => `<div class="chip pic" data-chip data-v="${v}">${pic(v)}</div>`).join("")}<button type="button" class="chip pic erase" data-chip data-v="-1">⌫</button></div>`);
    box.append(el(`<div class="sudoku"></div>`)); $(".sudoku", box).append(grid, pal);
    const set = (r, c, v) => { cur[r][c] = v; const x = $(`.sc[data-r="${r}"][data-c="${c}"]`, grid); x.innerHTML = v >= 0 ? pic(v) : ""; x.classList.remove("bad"); };
    dnd(box, { onDrop(chip, z) { if (!z || box.classList.contains("locked") || !z.classList.contains("sc")) return; const v = +chip.dataset.v; set(+z.dataset.r, +z.dataset.c, v); $$(".sc.bad", grid).forEach(x => x.classList.remove("bad")); } });
    const conflicts = () => {
      const bad = new Set(); let where = null;
      const groups = [];
      for (let i = 0; i < n; i++) { groups.push({ k: "row", cells: range(n).map(j => [i, j]) }); groups.push({ k: "col", cells: range(n).map(j => [j, i]) }); }
      if (br) for (let a = 0; a < n; a += br) for (let b = 0; b < n; b += bc) { const cells = []; for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) cells.push([a + i, b + j]); groups.push({ k: "box", cells }); }
      for (const g of groups) { const seen = {}; for (const [r, c] of g.cells) { const v = cur[r][c]; if (v < 0) continue; if (seen[v]) { bad.add(`${r},${c}`); bad.add(seen[v]); where ||= g.k; } else seen[v] = `${r},${c}`; } }
      return { bad, where };
    };
    return {
      check() {
        const { bad, where } = conflicts();
        if (bad.size) { bad.forEach(k => { const [r, c] = k.split(","); $(`.sc[data-r="${r}"][data-c="${c}"]`, grid).classList.add("bad"); }); return { ok: false, msg: tx(`Одинаковые картинки в одном${where === "row" ? "й строке" : where === "col" ? "м столбце" : "м квадрате"} — они подсвечены.`, `Бір ${where === "row" ? "жолда" : where === "col" ? "бағанда" : "шаршыда"} бірдей суреттер бар — олар белгіленген.`) }; }
        if (cur.flat().includes(-1)) return EMPTY(tx("Заполни все пустые клетки.", "Барлық бос ұяшықты толтыр."));
        return { ok: true };
      },
      solve() {
        // шаги «осталась одна картинка»: ищем клетку с единственным кандидатом
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (t.G[r][c] < 0) set(r, c, -1);
        const g = t.G.map(r => r.slice()); const st = [];
        const cand = (r, c) => range(n).filter(v => { for (let k = 0; k < n; k++) if (g[r][k] === v || g[k][c] === v) return false; if (br) { const r0 = r - r % br, c0 = c - c % bc; for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) if (g[r0 + i][c0 + j] === v) return false; } return true; });
        let guard = 0;
        while (g.flat().includes(-1) && guard++ < 60) {
          let found = null;
          for (let r = 0; r < n && !found; r++) for (let c = 0; c < n && !found; c++) if (g[r][c] < 0) { const cs = cand(r, c); if (cs.length === 1) found = [r, c, cs[0], "single"]; }
          if (!found) for (let r = 0; r < n && !found; r++) for (let c = 0; c < n && !found; c++) if (g[r][c] < 0) found = [r, c, t.sol[r][c], "rest"];
          const [r, c, v, why] = found; g[r][c] = v;
          if (st.length < 4) st.push({ t: why === "single" ? withH(tx(`В клетке (строка ${r + 1}, столбец ${c + 1}) может быть только эта картинка — остальные уже есть рядом.`, `(${r + 1}-жол, ${c + 1}-баған) ұяшығында тек осы сурет бола алады — қалғандары көршілерде бар.`), `<span class="inl">${shapeSVG({ ...CUBE_SYMS[v], z: "big" }, 26)}</span>`) : tx("Дальше так же.", "Әрі қарай да солай."), act: () => set(r, c, v) });
          else { const last = st[st.length - 1]; const prev = last.act; const rr = r, cc = c, vv = v; last.t = tx("Остальные клетки заполняем тем же способом.", "Қалған ұяшықтарды да солай толтырамыз."); last.act = async () => { await prev(); await sleep(140); set(rr, cc, vv); }; }
        }
        return st;
      },
    };
  },
});

/* ---------------------------- КОМБИНАТОРИКА ---------------------------- */
const SHIRT = (c, px = 46) => `<svg viewBox="0 0 100 100" width="${px}" height="${px}"><path d="M30 12 L42 8 Q50 16 58 8 L70 12 L92 30 L80 44 L72 38 L72 90 L28 90 L28 38 L20 44 L8 30 Z" fill="${COLORS[c].hex}" stroke="#151821" stroke-width="5" stroke-linejoin="round"/></svg>`;
const PANTS = (c, px = 46) => `<svg viewBox="0 0 100 100" width="${px}" height="${px}"><path d="M24 8 L76 8 L84 92 L58 92 L50 38 L42 92 L16 92 Z" fill="${COLORS[c].hex}" stroke="#151821" stroke-width="5" stroke-linejoin="round"/></svg>`;
const CAP = (c, px = 46) => `<svg viewBox="0 0 100 100" width="${px}" height="${px}"><path d="M14 66 Q14 24 50 22 Q86 24 86 66 Z" fill="${COLORS[c].hex}" stroke="#151821" stroke-width="5" stroke-linejoin="round"/><path d="M60 66 L96 66 L96 74 L56 74 Z" fill="${COLORS[c].hex}" stroke="#151821" stroke-width="5" stroke-linejoin="round"/></svg>`;
const GROUP_DRAW = { shirt: SHIRT, pants: PANTS, cap: CAP };
const GROUP_NAME = { shirt: tx("футболки", "футболкалар"), pants: tx("брюки", "шалбарлар"), cap: tx("кепки", "кепкалар") };
registerTask({
  id: "combi", dir: "combi", kind: "build", title: tx("Сколько вариантов?", "Неше нұсқа?"),
  gen(R, grade, level) {
    const outfit = (sizes, count = false) => {
      const kinds = ["shirt", "pants", "cap"].slice(0, sizes.length);
      const groups = kinds.map((k, i) => ({ k, items: R.sample(COLOR_KEYS.slice(0, 5), sizes[i]) }));
      const total = sizes.reduce((a, b) => a * b, 1);
      const what = groups.map(g => `${g.items.length} ${GROUP_NAME[g.k].ru}`).join(", "), whatK = groups.map(g => `${g.items.length} ${GROUP_NAME[g.k].kz}`).join(", ");
      return { mode: count ? "outfitCount" : "outfit", groups, total,
        q: count ? tx(`Есть ${what}. Сколько разных нарядов можно составить, если в наряд входит по одной вещи каждого вида?`, `${whatK} бар. Әр түрден бір заттан алып, неше түрлі киім жиынтығын құрауға болады?`)
          : tx("Составь все разные наряды: нажми на одну вещь каждого вида — наряд появится внизу. Найди все!", "Барлық түрлі киім жиынтығын құра: әр түрден бір затты бас — жиынтық төменде пайда болады. Бәрін тап!"),
        hints: [tx("Действуй по порядку: возьми первую футболку и надень с ней по очереди все брюки. Потом вторую футболку…", "Ретімен әрекет ет: бірінші футболканы алып, онымен барлық шалбарды кезекпен ки. Сосын екінші футболканы…"), tx(`Для каждой футболки — столько нарядов, сколько брюк${sizes.length > 2 ? " (а потом ещё умножить на число кепок)" : ""}.`, `Әр футболкаға — шалбар санындай жиынтық${sizes.length > 2 ? " (сосын кепка санына көбейту)" : ""}.`)] };
    };
    const digits = (k, len, rep, count = false, zero = false) => {
      const ds = zero ? [0, ...R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], k - 1)].sort() : R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], k).sort();
      const all = []; const rec = s => { if (s.length === len) { if (s[0] !== 0) all.push(s.join("")); return; } for (const d of ds) if (rep || !s.includes(d)) rec([...s, d]); }; rec([]);
      const lenW = { 2: tx("двузначные", "екі таңбалы"), 3: tx("трёхзначные", "үш таңбалы") }[len];
      return { mode: count ? "digitsCount" : "digits", ds, len, rep, total: all.length, all,
        q: count ? tx(`Сколько ${lenW.ru.replace("ые", "ых")} чисел можно составить из цифр ${ds.join(", ")}${rep ? " (цифры могут повторяться)" : ", если цифры в числе не повторяются"}?`, `${ds.join(", ")} цифрларынан ${rep ? "(цифрлар қайталана алады)" : "(цифрлар қайталанбайды)"} неше ${lenW.kz} сан құрауға болады?`)
          : tx(`Составь все ${lenW.ru} числа из цифр ${ds.join(", ")}${rep ? " (цифры могут повторяться)" : " (цифры в числе не повторяются)"}. Нажимай на цифры.`, `${ds.join(", ")} цифрларынан барлық ${lenW.kz} санды құра${rep ? " (цифрлар қайталана алады)" : " (цифрлар қайталанбайды)"}. Цифрларды бас.`),
        hints: [tx("Действуй по порядку: сначала все числа, которые начинаются с самой маленькой цифры, потом со следующей…", "Ретімен әрекет ет: алдымен ең кіші цифрдан басталатын сандарды, сосын келесісінен…"), ...(zero ? [tx("Число не может начинаться с нуля!", "Сан нөлден басталмайды!")] : [tx(`На первое место — ${ds.length} вариантов, на второе — ${rep ? ds.length : ds.length - 1}.`, `Бірінші орынға — ${ds.length} нұсқа, екіншіге — ${rep ? ds.length : ds.length - 1}.`)])] };
    };
    const pairs = (n, count = false) => {
      const P = R.sample(NAMES, n); const total = n * (n - 1) / 2;
      return { mode: count ? "pairsCount" : "pairs", P, n, total,
        q: count ? tx(`${n} друзей устроили турнир по шашкам: каждый сыграл с каждым по одной партии. Сколько всего было партий?`, `${n} дос дойбы турнирін өткізді: әркім әркіммен бір партия ойнады. Барлығы неше партия болды?`)
          : tx(`${n} друзей решили: каждый сыграет с каждым по одной партии в шашки. Нарисуй все партии: нажми на двух ребят — между ними появится линия.`, `${n} дос шешті: әркім әркіммен дойбыдан бір партия ойнайды. Барлық партияны сыз: екі баланы бас — арасында сызық пайда болады.`),
        hints: [tx("Начни с первого: с кем он сыграет? Со всеми остальными. Потом второй — с кем ещё не играл?", "Біріншіден баста: ол кіммен ойнайды? Қалғандардың бәрімен. Сосын екіншісі — кіммен әлі ойнамады?"), tx("Одна линия — одна партия. Партия Алии с Тимуром — это та же партия, что Тимура с Алией.", "Бір сызық — бір партия. Әлия мен Тимурдың партиясы — Тимур мен Әлияның партиясымен бірдей.")] };
    };
    if (grade === 1) return level === 1 ? outfit([2, 2]) : level === 2 ? outfit([2, 3]) : digits(2, 2, true);
    if (grade === 2) return level === 1 ? outfit([3, 2]) : level === 2 ? digits(3, 2, false) : pairs(4);
    if (grade === 3) return level === 1 ? outfit([2, 2, 2]) : level === 2 ? (R.chance(0.5) ? digits(3, 3, false) : digits(4, 2, false)) : pairs(5);
    return level === 1 ? outfit(R.pick([[3, 4], [4, 3, 2], [2, 3, 3]]), true) : level === 2 ? pairs(R.int(6, 8), true) : digits(4, 2, false, true, true);
  },
  render(t, box) {
    if (t.mode.endsWith("Count")) {
      if (t.mode === "outfitCount") box.append(el(`<div class="cgroups">${t.groups.map(g => `<div class="cg"><div class="k">${T(GROUP_NAME[g.k])}</div>${g.items.map(c => GROUP_DRAW[g.k](c, 50)).join("")}</div>`).join("")}</div>`));
      if (t.mode === "pairsCount") box.append(el(`<div class="cgroups">${t.P.map((p, i) => `<span class="pill">${avatarSVG(i, 30)}${T(p)}</span>`).join("")}</div>`));
      if (t.mode === "digitsCount") box.append(el(`<div class="cgroups digs">${t.ds.map(d => `<span class="dig">${d}</span>`).join("")}</div>`));
      const f = numField({ max: 3 }); const line = el(`<div class="ansline">${L("Ответ:", "Жауабы:")} </div>`); line.append(f); box.append(line, keypad(() => $(".checkb", box.closest(".task"))?.click())); focusNum(f);
      const expl = t.mode === "outfitCount" ? tx(`${t.groups.map(g => g.items.length).join(" × ")} = ${t.total}: для каждой вещи первого вида подходит любая вещь второго вида${t.groups.length > 2 ? ", а к каждой паре — любая кепка" : ""}.`, `${t.groups.map(g => g.items.length).join(" × ")} = ${t.total}: бірінші түрдің әр затына екінші түрдің кез келген заты келеді${t.groups.length > 2 ? ", ал әр жұпқа — кез келген кепка" : ""}.`)
        : t.mode === "pairsCount" ? tx(`Каждый играет с ${t.n - 1} друзьями: ${t.n} × ${t.n - 1} = ${t.n * (t.n - 1)}. Но так каждая партия посчитана дважды (Алия–Тимур и Тимур–Алия), поэтому делим на 2: ${t.total}.`, `Әркім ${t.n - 1} доспен ойнайды: ${t.n} × ${t.n - 1} = ${t.n * (t.n - 1)}. Бірақ әр партия екі рет саналды (Әлия–Тимур және Тимур–Әлия), сондықтан 2-ге бөлеміз: ${t.total}.`)
          : tx(`На первое место — ${t.ds.filter(d => d).length} цифры (ноль нельзя), на второе — ${t.rep ? t.ds.length : t.ds.length - 1} (любая, кроме уже взятой): ${t.ds.filter(d => d).length} × ${t.rep ? t.ds.length : t.ds.length - 1} = ${t.total}.`, `Бірінші орынға — ${t.ds.filter(d => d).length} цифр (нөл болмайды), екіншіге — ${t.rep ? t.ds.length : t.ds.length - 1} (алынғаннан басқа кез келгені): ${t.ds.filter(d => d).length} × ${t.rep ? t.ds.length : t.ds.length - 1} = ${t.total}.`);
      return {
        check() { if (!f.value) return EMPTY(tx("Впиши число.", "Сан жаз.")); if (+f.value === t.total) { f.classList.add("good"); return { ok: true, msg: expl }; } f.classList.add("bad"); setTimeout(() => f.classList.remove("bad"), 900);
          if (t.mode === "pairsCount" && +f.value === t.n * (t.n - 1)) return { ok: false, msg: tx("Почти! Но каждую партию ты посчитал дважды: «Алия с Тимуром» и «Тимур с Алией» — это одна и та же партия.", "Сәл қалды! Бірақ әр партияны екі рет санадың: «Әлия Тимурмен» және «Тимур Әлиямен» — бір партия.") };
          if (t.mode === "outfitCount" && +f.value === t.groups.reduce((s, g) => s + g.items.length, 0)) return { ok: false, msg: tx("Ты сложил вещи. Но наряд — это сочетание: к каждой футболке подходит каждая пара брюк. Тут нужно умножать.", "Сен заттарды қостың. Бірақ жиынтық — үйлесім: әр футболкаға әр шалбар келеді. Мұнда көбейту керек.") };
          return { ok: false, msg: tx("Попробуй перебрать варианты по порядку, ничего не пропуская.", "Нұсқаларды ештеңе қалдырмай ретімен қарап шық.") }; },
        solve() { return [{ t: t.hints[0] }, { t: expl, act: () => { f.set(t.total); f.classList.add("good"); } }]; },
      };
    }
    const found = []; const list = el(`<div class="clist"></div>`); const counter = el(`<div class="ccount"></div>`);
    const upd = () => { counter.innerHTML = L(`Найдено: ${found.length}`, `Табылды: ${found.length}`); };
    if (t.mode === "outfit") {
      const sel = t.groups.map(() => null);
      const gw = el(`<div class="cgroups">${t.groups.map((g, gi) => `<div class="cg"><div class="k">${T(GROUP_NAME[g.k])}</div>${g.items.map((c, ci) => `<button type="button" class="citem" data-g="${gi}" data-c="${ci}">${GROUP_DRAW[g.k](c, 52)}</button>`).join("")}</div>`).join("")}</div>`);
      box.append(gw, counter, list); upd();
      const drawOutfit = combo => `<div class="outfit">${combo.map((ci, gi) => GROUP_DRAW[t.groups[gi].k](t.groups[gi].items[ci], 34)).join("")}</div>`;
      gw.addEventListener("click", e => {
        const b = e.target.closest(".citem"); if (!b || box.classList.contains("locked")) return;
        const gi = +b.dataset.g, ci = +b.dataset.c; sel[gi] = ci; $$(`.citem[data-g="${gi}"]`, gw).forEach(x => x.classList.toggle("sel", x === b));
        if (sel.every(x => x != null)) {
          const key = sel.join("-");
          if (found.includes(key)) { toast(tx("Такой наряд уже есть!", "Мұндай жиынтық бар!")); flash($(`[data-k="${key}"]`, list), "hl", 1200); }
          else { found.push(key); list.append(el(`<div class="cfound" data-k="${key}">${drawOutfit([...sel])}</div>`)); upd(); }
          sel.fill(null); setTimeout(() => $$(".citem", gw).forEach(x => x.classList.remove("sel")), 250);
        }
      });
      const allKeys = []; const rec = (s, i) => { if (i === t.groups.length) return allKeys.push(s.join("-")); t.groups[i].items.forEach((_, ci) => rec([...s, ci], i + 1)); }; rec([], 0);
      return {
        check() { if (!found.length) return EMPTY(tx("Собери хотя бы один наряд.", "Кем дегенде бір жиынтық құра.")); if (found.length === t.total) return { ok: true, msg: tx(`Всего ${t.total} нарядов: ${t.groups.map(g => g.items.length).join(" × ")} = ${t.total}.`, `Барлығы ${t.total} жиынтық: ${t.groups.map(g => g.items.length).join(" × ")} = ${t.total}.`) }; return { ok: false, msg: tx(`Найдено ${found.length}, но это ещё не все наряды. Перебирай по порядку: первая футболка со всеми брюками, потом вторая…`, `${found.length} табылды, бірақ бұл әлі барлығы емес. Ретімен қара: бірінші футболка барлық шалбармен, сосын екіншісі…`) }; },
        solve() { return [{ t: t.hints[0] }, { t: tx(`Получается ${t.groups.map(g => g.items.length).join(" × ")} = ${t.total} нарядов.`, `${t.groups.map(g => g.items.length).join(" × ")} = ${t.total} жиынтық шығады.`), act: async () => { list.innerHTML = ""; found.length = 0; for (const k of allKeys) { found.push(k); list.append(el(`<div class="cfound">${drawOutfit(k.split("-").map(Number))}</div>`)); upd(); await sleep(150); } } }]; },
      };
    }
    if (t.mode === "digits") {
      let cur = [];
      const pad = el(`<div class="cgroups digs">${t.ds.map(d => `<button type="button" class="dig" data-d="${d}">${d}</button>`).join("")}<button type="button" class="dig er">⌫</button></div>`);
      const shown = el(`<div class="cnum">_ _</div>`);
      box.append(pad, shown, counter, list); upd();
      const draw = () => (shown.textContent = range(t.len).map(i => cur[i] ?? "_").join(" "));
      draw();
      pad.addEventListener("click", e => {
        const b = e.target.closest(".dig"); if (!b || box.classList.contains("locked")) return;
        if (b.classList.contains("er")) { cur.pop(); return draw(); }
        const d = +b.dataset.d; if (!t.rep && cur.includes(d)) return toast(tx("Цифры не должны повторяться.", "Цифрлар қайталанбауы керек."));
        cur.push(d); draw();
        if (cur.length === t.len) { const s = cur.join(""); if (found.includes(s)) { toast(tx("Это число уже есть!", "Бұл сан бар!")); flash($(`[data-k="${s}"]`, list), "hl", 1200); } else { found.push(s); list.append(el(`<div class="cfound num" data-k="${s}">${s}</div>`)); upd(); } setTimeout(() => { cur = []; draw(); }, 300); }
      });
      return {
        check() { if (!found.length) return EMPTY(tx("Составь хотя бы одно число.", "Кем дегенде бір сан құра.")); if (found.length === t.total) return { ok: true, msg: tx(`Всего ${t.total}: ${t.all.join(", ")}.`, `Барлығы ${t.total}: ${t.all.join(", ")}.`) }; return { ok: false, msg: tx(`Найдено ${found.length} — есть ещё! Перебирай по порядку: сначала все числа, которые начинаются на ${t.ds[0]}.`, `${found.length} табылды — тағы бар! Ретімен қара: алдымен ${t.ds[0]} цифрынан басталатын сандардың бәрі.`) }; },
        solve() { return [{ t: t.hints[0] }, { t: tx(`Все числа: ${t.all.join(", ")} — их ${t.total}.`, `Барлық сандар: ${t.all.join(", ")} — ${t.total} сан.`), act: async () => { list.innerHTML = ""; found.length = 0; for (const s of t.all) { found.push(s); list.append(el(`<div class="cfound num">${s}</div>`)); upd(); await sleep(140); } } }]; },
      };
    }
    // pairs: граф «каждый с каждым»
    const R0 = 120, cx = 160, cy = 150;
    const pos = range(t.n).map(i => [cx + R0 * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / t.n), cy + R0 * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / t.n)]);
    const svg = el(`<svg class="pgraph" viewBox="0 0 320 300"><g class="edges"></g>${t.P.map((p, i) => `<g class="pn" data-i="${i}" transform="translate(${pos[i][0]} ${pos[i][1]})"><circle r="27" fill="${AV_COLORS[i]}" stroke="#151821" stroke-width="4"/><text text-anchor="middle" dy="6" font-weight="700" font-size="17" fill="#fff">${p.ru.slice(0, 2)}</text></g>`).join("")}</svg>`);
    box.append(el(`<div class="pairsbox"></div>`)); $(".pairsbox", box).append(svg, el(`<div><div class="cgroups">${t.P.map((p, i) => `<span class="pill" style="border-color:${AV_COLORS[i]}"><b style="color:${AV_COLORS[i]}">${p.ru.slice(0, 2)}</b> ${T(p)}</span>`).join("")}</div></div>`)); $(".pairsbox > div", box).append(counter); upd();
    let first = null;
    const edge = (a, b) => `<line x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[b][0]}" y2="${pos[b][1]}" stroke="#151821" stroke-width="5" stroke-linecap="round" data-k="${a}-${b}"/>`;
    svg.addEventListener("click", e => {
      const g = e.target.closest(".pn"); if (!g || box.classList.contains("locked")) return; const i = +g.dataset.i;
      if (first == null) { first = i; g.classList.add("sel"); return; }
      $$(".pn", svg).forEach(x => x.classList.remove("sel"));
      if (first === i) { first = null; return; }
      const k = [Math.min(first, i), Math.max(first, i)].join("-"); first = null;
      if (found.includes(k)) { toast(tx("Эта партия уже есть — линия уже нарисована.", "Бұл партия бар — сызық сызылған.")); flash($(`line[data-k="${k}"]`, svg), "hl", 1200); return; }
      found.push(k); $(".edges", svg).insertAdjacentHTML("beforeend", edge(...k.split("-").map(Number))); upd();
    });
    return {
      check() { if (!found.length) return EMPTY(tx("Нарисуй хотя бы одну партию.", "Кем дегенде бір партияны сыз.")); if (found.length === t.total) return { ok: true, msg: tx(`Всего ${t.total} партий: ${range(t.n - 1).map(i => t.n - 1 - i).join(" + ")} = ${t.total}.`, `Барлығы ${t.total} партия: ${range(t.n - 1).map(i => t.n - 1 - i).join(" + ")} = ${t.total}.`) }; const miss = range(t.n).find(i => found.filter(k => k.split("-").map(Number).includes(i)).length < t.n - 1); return { ok: false, msg: tx(`Нарисовано ${found.length} — не все. Например, ${t.P[miss].ru} сыграл(а) ещё не со всеми.`, `${found.length} сызылды — бәрі емес. Мысалы, ${t.P[miss].kz} әлі бәрімен ойнаған жоқ.`) }; },
      solve() { const st = []; for (let a = 0; a < t.n - 1; a++) st.push({ t: tx(`${t.P[a].ru} играет со всеми, с кем ещё не играл(а): ${t.n - 1 - a} ${plural(t.n - 1 - a, "партия", "партии", "партий")}.`, `${t.P[a].kz} әлі ойнамағандардың бәрімен ойнайды: ${t.n - 1 - a} партия.`), act: () => { for (let b = a + 1; b < t.n; b++) { const k = `${a}-${b}`; if (!found.includes(k)) { found.push(k); $(".edges", svg).insertAdjacentHTML("beforeend", edge(a, b)); } } upd(); } }); st.push({ t: tx(`Всего: ${range(t.n - 1).map(i => t.n - 1 - i).join(" + ")} = ${t.total}.`, `Барлығы: ${range(t.n - 1).map(i => t.n - 1 - i).join(" + ")} = ${t.total}.`) }); return st; },
    };
  },
});

/* ---------------------------- ВЕСЫ ---------------------------- */
const SC_OBJ = ["🍎", "🍐", "🍉", "🍍", "🎃"];
const SC_NAME = { "🍎": tx("яблоко", "алма"), "🍐": tx("груша", "алмұрт"), "🍉": tx("арбуз", "қарбыз"), "🍍": tx("ананас"), "🎃": tx("тыква", "асқабақ") };
function scaleSVG(left, right, tilt = 0) {
  const side = (items, x) => { let h = ""; items.forEach((it, i) => { const xx = x - (items.length - 1) * 17 + i * 34; h += typeof it === "number" ? `<g transform="translate(${xx} 0)"><path d="M-15 -2 L15 -2 L11 -28 L-11 -28 Z" fill="#596073" stroke="#151821" stroke-width="3"/><text y="-9" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${it}</text></g>` : `<text x="${xx}" y="-4" text-anchor="middle" font-size="30">${it}</text>`; }); return h; };
  return `<svg class="scale" viewBox="0 0 300 150"><g class="beam" style="transform:rotate(${tilt}deg)"><line x1="40" y1="40" x2="260" y2="40" stroke="#151821" stroke-width="7" stroke-linecap="round"/>
    <g transform="translate(60 40)"><line x1="0" y1="0" x2="-30" y2="50" stroke="#151821" stroke-width="2"/><line x1="0" y1="0" x2="30" y2="50" stroke="#151821" stroke-width="2"/><g class="pan" style="transform:rotate(${-tilt}deg)"><path d="M-50 50 L50 50 Q40 64 0 64 Q-40 64 -50 50 Z" fill="#FFD23F" stroke="#151821" stroke-width="3"/><g transform="translate(0 50)">${side(left, 0)}</g></g></g>
    <g transform="translate(240 40)"><line x1="0" y1="0" x2="-30" y2="50" stroke="#151821" stroke-width="2"/><line x1="0" y1="0" x2="30" y2="50" stroke="#151821" stroke-width="2"/><g class="pan" style="transform:rotate(${-tilt}deg)"><path d="M-50 50 L50 50 Q40 64 0 64 Q-40 64 -50 50 Z" fill="#FFD23F" stroke="#151821" stroke-width="3"/><g transform="translate(0 50)">${side(right, 0)}</g></g></g></g>
    <path d="M150 40 L132 140 L168 140 Z" fill="#151821"/><circle cx="150" cy="40" r="8" fill="#FFD23F" stroke="#151821" stroke-width="3"/></svg>`;
}
registerTask({
  id: "scales", dir: "strategy", kind: "input", title: tx("Задачи на весы", "Таразы есептері"),
  gen(R, grade, level) {
    const [A, B] = R.sample(SC_OBJ, 2);
    const tpl = grade <= 2 ? "T1" : grade === 3 ? ["T1", "T2", "T3"][level - 1] : ["T2", "T3", "T5"][level - 1];
    for (let t = 0; t < 200; t++) {
      const a = R.int(1, grade <= 2 ? 5 : 9);
      let eqs, ask, ans, expl;
      if (tpl === "T1") { const n = R.int(2, 4); eqs = [[Array(n).fill(A), [n * a]]]; ask = A; ans = a; expl = [tx(`${n} ${SC_NAME[A].ru} весят ${n * a} кг. Значит, одно — ${n * a} : ${n} = ${a} кг.`, `${n} ${SC_NAME[A].kz} ${n * a} кг тартады. Демек, біреуі — ${n * a} : ${n} = ${a} кг.`)]; }
      if (tpl === "T2") { const m = R.int(2, 3); const b = m * a; eqs = [[Array(m).fill(A), [B]], [[A, B], [a + b]]]; ask = A; ans = a;
        expl = [tx(`Из первых весов: ${SC_NAME[B].ru} = ${m} × ${SC_NAME[A].ru}.`, `Бірінші таразыдан: ${SC_NAME[B].kz} = ${m} × ${SC_NAME[A].kz}.`), tx(`Заменим ${SC_NAME[B].ru} на вторых весах: там ${m + 1} × ${SC_NAME[A].ru} = ${a + b} кг.`, `Екінші таразыда ${SC_NAME[B].kz} орнына қоямыз: ${m + 1} × ${SC_NAME[A].kz} = ${a + b} кг.`), tx(`Значит, ${SC_NAME[A].ru} весит ${a + b} : ${m + 1} = ${a} кг.`, `Демек, ${SC_NAME[A].kz} ${a + b} : ${m + 1} = ${a} кг тартады.`)]; }
      if (tpl === "T3") { const d = R.int(1, 4); const b = a + d; eqs = [[[B], [A, d]], [[A, B], [a + b]]]; ask = A; ans = a;
        expl = [tx(`Из первых весов: ${SC_NAME[B].ru} тяжелее, чем ${SC_NAME[A].ru}, на ${d} кг.`, `Бірінші таразыдан: ${SC_NAME[B].kz} ${KZ.abl(SC_NAME[A].kz)} ${d} кг ауыр.`), tx(`На вторых весах заменим ${SC_NAME[B].ru} на «${SC_NAME[A].ru} + ${d} кг»: 2 × ${SC_NAME[A].ru} + ${d} = ${a + b}.`, `Екінші таразыда ${SC_NAME[B].kz} орнына «${SC_NAME[A].kz} + ${d} кг» қоямыз: 2 × ${SC_NAME[A].kz} + ${d} = ${a + b}.`), tx(`2 × ${SC_NAME[A].ru} = ${a + b - d}, значит, ${SC_NAME[A].ru} = ${a} кг.`, `2 × ${SC_NAME[A].kz} = ${a + b - d}, демек, ${SC_NAME[A].kz} = ${a} кг.`)]; }
      if (tpl === "T5") { const b = R.int(1, 9); eqs = [[[A, A, B], [2 * a + b]], [[A, B], [a + b]]]; ask = A; ans = a;
        expl = [tx("Сравним весы: слева на первых весах лежит всё то же, что на вторых, и ещё одно " + SC_NAME[A].ru + ".", "Таразыларды салыстырайық: біріншінің сол жағында екіншідегінің бәрі және тағы бір " + SC_NAME[A].kz + " бар."), tx(`Значит, ${SC_NAME[A].ru} весит ${2 * a + b} − ${a + b} = ${a} кг.`, `Демек, ${SC_NAME[A].kz} ${2 * a + b} − ${a + b} = ${a} кг тартады.`)]; }
      // проверка перебором: решение единственное
      const objs = [...new Set(eqs.flatMap(([l, r]) => [...l, ...r].filter(x => typeof x !== "number")))];
      const sols = []; const vals = range(30).map(i => i + 1);
      const sum = (side, env) => side.reduce((s, x) => s + (typeof x === "number" ? x : env[x]), 0);
      for (const v1 of vals) for (const v2 of objs.length > 1 ? vals : [0]) { const env = { [objs[0]]: v1 }; if (objs.length > 1) env[objs[1]] = v2; if (eqs.every(([l, r]) => sum(l, env) === sum(r, env))) sols.push(env); }
      if (sols.length !== 1 || sols[0][ask] !== ans) continue;
      return { eqs, ask, ans, expl, env: sols[0], q: tx(`Весы находятся в равновесии. Сколько килограммов весит ${SC_NAME[ask].ru} ${ask}?`, `Таразылар тепе-теңдікте тұр. ${cap(SC_NAME[ask].kz)} ${ask} неше килограмм тартады?`),
        hints: [tx("Если весы в равновесии, слева и справа одинаковый вес. Одинаковые предметы весят одинаково.", "Таразы тепе-теңдікте болса, екі жағының салмағы бірдей. Бірдей заттардың салмағы бірдей."), expl[0]] };
    }
    throw new Error("scales");
  },
  render(t, box) {
    const sw = el(`<div class="scales">${t.eqs.map(([l, r], i) => `<div class="sbox" data-i="${i}"><b>${i + 1}</b>${scaleSVG(l, r)}</div>`).join("")}</div>`);
    const f = numField({ max: 2 }); const line = el(`<div class="ansline">${t.ask} = </div>`); line.append(f); line.append(el(`<span> ${L("кг", "кг")}</span>`));
    box.append(sw, line, keypad(() => $(".checkb", box.closest(".task"))?.click())); focusNum(f);
    const tiltAll = env => t.eqs.forEach(([l, r], i) => { const s = side => side.reduce((a, x) => a + (typeof x === "number" ? x : env[x]), 0); const d = s(r) - s(l); $$(".sbox", sw)[i].innerHTML = `<b>${i + 1}</b>` + scaleSVG(l, r, Math.max(-12, Math.min(12, d * 3))); });
    return {
      check() {
        if (!f.value) return EMPTY(tx("Впиши число.", "Сан жаз."));
        const v = +f.value;
        if (v === t.ans) { f.classList.add("good"); return { ok: true }; }
        f.classList.add("bad"); setTimeout(() => f.classList.remove("bad"), 900);
        // покажем, какие весы «перекосятся» при таком ответе (второй предмет — как в решении, если он есть)
        const env = { ...t.env, [t.ask]: v }; const other = Object.keys(t.env).find(k => k !== t.ask);
        // для второго предмета берём значение из первых весов, если их можно так прочитать
        tiltAll(env);
        const i = t.eqs.findIndex(([l, r]) => l.reduce((a, x) => a + (typeof x === "number" ? x : env[x]), 0) !== r.reduce((a, x) => a + (typeof x === "number" ? x : env[x]), 0));
        setTimeout(() => tiltAll(t.env), 1600);
        return { ok: false, msg: tx(`Если ${t.ask} весит ${v} кг, весы №${i + 1} не будут в равновесии — посмотри, как они наклонились.`, `Егер ${t.ask} ${v} кг тартса, №${i + 1} тараза тепе-теңдікте болмайды — қалай қисайғанына қара.`) };
      },
      solve() { return [...t.expl.map(e => ({ t: e })), { t: tx(`Ответ: ${t.ask} = ${t.ans} кг.`, `Жауабы: ${t.ask} = ${t.ans} кг.`), act: () => { f.set(t.ans); f.classList.add("good"); } }]; },
    };
  },
});

/* ---------------------------- ИГРА «ВОЗЬМИ ПОСЛЕДНЮЮ» ---------------------------- */
registerTask({
  id: "nim", dir: "strategy", kind: "game", title: tx("Выигрышный ход", "Жеңіс жүрісі"),
  gen(R, grade, level) {
    const k = grade === 4 && level >= 2 ? 3 : 2; const misere = grade === 4 && level === 3;
    let N; do N = R.int(grade === 3 ? 5 : 8, grade === 3 ? 12 : 20); while ((misere ? (N - 1) % (k + 1) : N % (k + 1)) === 0);
    const take = misere ? (N - 1) % (k + 1) : N % (k + 1);
    return { N, k, misere, take, q: tx(`На столе ${N} звёздочек. Двое по очереди берут от 1 до ${k} звёздочек. ${misere ? "Кто возьмёт последнюю — ПРОИГРАЛ." : "Кто возьмёт последнюю — выиграл."} Сейчас твой ход. Сколько нужно взять, чтобы точно выиграть?`, `Үстелде ${N} жұлдызша бар. Екеуі кезекпен 1-ден ${k}-ге дейін жұлдызша алады. ${misere ? "Соңғысын алған — ЖЕҢІЛЕДІ." : "Соңғысын алған — жеңеді."} Қазір сенің жүрісің. Сөзсіз жеңу үшін нешеуін алу керек?`),
      hints: [misere ? tx(`Подумай с конца: если сопернику осталась 1 звёздочка — он проиграл. А если ${k + 2}?`, `Соңынан ойла: қарсыласқа 1 жұлдызша қалса — ол жеңілді. Ал ${k + 2} қалса ше?`) : tx(`Подумай с конца: если у соперника ${k + 1} звёздочки, сколько бы он ни взял, последнюю возьмёшь ты.`, `Соңынан ойла: қарсыласта ${k + 1} жұлдызша болса, ол қанша алса да, соңғысын сен аласың.`),
        misere ? tx(`Оставляй сопернику 1, ${k + 2}, ${2 * k + 3}… звёздочек.`, `Қарсыласқа 1, ${k + 2}, ${2 * k + 3}… жұлдызша қалдыр.`) : tx(`Оставляй сопернику ${k + 1}, ${2 * (k + 1)}, ${3 * (k + 1)}… звёздочек.`, `Қарсыласқа ${k + 1}, ${2 * (k + 1)}, ${3 * (k + 1)}… жұлдызша қалдыр.`)] };
  },
  render(t, box, ctx) {
    let left = t.N;
    const pile = el(`<div class="nimpile"></div>`);
    const drawPile = (hl = 0) => { pile.innerHTML = range(left).map(i => `<span class="nst ${i >= left - hl ? "hl" : ""}">★</span>`).join(""); };
    drawPile();
    box.append(pile);
    const ch = choiceUI(box, range(t.k).map(i => `<b class="bign">${i + 1}</b>`), { cls: "nums", onPick: i => drawPile(i + 1) });
    const game = el(`<div class="nimgame"></div>`); box.append(game);
    const lose = n => (t.misere ? (n - 1) % (t.k + 1) === 0 : n % (t.k + 1) === 0); // позиция проигрышна для того, кто ходит
    function playOn() {
      // играем до конца: компьютер ходит наилучшим образом
      game.innerHTML = `<div class="k">${L("Доиграем партию!", "Ойынды аяқтайық!")}</div><div class="nimlog"></div><div class="btns">${range(t.k).map(i => `<button type="button" class="btn sm" data-t="${i + 1}">${L("Взять", "Алу")} ${i + 1}</button>`).join("")}</div>`;
      const log = $(".nimlog", game);
      const say = h => log.insertAdjacentHTML("beforeend", `<div>${h}</div>`);
      const end = me => { $(".btns", game)?.remove(); say(`<b>${me ? L("Ты победил(а)! 🎉", "Сен жеңдің! 🎉") : L("Победил компьютер. Попробуй ещё — держись правила!", "Компьютер жеңді. Тағы көр — ережені ұстан!")}</b>`); };
      const R2 = new Rnd(newSeed());
      const compMove = () => { // компьютер ходит наилучшим образом, а из проигрышной позиции — наугад
        let c = 0; for (let x = 1; x <= Math.min(t.k, left); x++) if (lose(left - x) && (!t.misere || left - x >= 1)) { c = x; break; }
        if (!c) c = R2.int(1, Math.min(t.k, left));
        left -= c; drawPile(); say(L(`Компьютер взял ${c}, осталось ${left}.`, `Компьютер ${c} алды, ${left} қалды.`));
        if (left === 0) { end(t.misere); return true; }
        return false;
      };
      $(".btns", game).addEventListener("click", async e => {
        const b = e.target.closest("[data-t]"); if (!b) return; const n = Math.min(+b.dataset.t, left);
        left -= n; drawPile(); say(L(`Ты взял(а) ${n}, осталось ${left}.`, `Сен ${n} алдың, ${left} қалды.`));
        if (left === 0) return end(!t.misere);
        await sleep(500); compMove();
      });
      say(L(`Ты взял(а) ${t.take}, осталось ${left}. Ход компьютера…`, `Сен ${t.take} алдың, ${left} қалды. Компьютердің жүрісі…`));
      setTimeout(compMove, 700);
    }
    return {
      check() {
        const i = ch.get(); if (i == null) return EMPTY(tx("Выбери, сколько звёздочек взять.", "Неше жұлдызша алатыныңды таңда."));
        if (i + 1 === t.take) { ch.mark(i, "good"); left = t.N - t.take; drawPile(); if (ctx.mode !== "test") setTimeout(playOn, 300); return { ok: true, msg: tx(`Останется ${t.N - t.take} — ${t.misere ? `это 1 + ${t.k + 1}×${(t.N - t.take - 1) / (t.k + 1)}` : `это ${t.k + 1}×${(t.N - t.take) / (t.k + 1)}`}. Теперь соперник в проигрышной позиции.`, `${t.N - t.take} қалады — ${t.misere ? `бұл 1 + ${t.k + 1}×${(t.N - t.take - 1) / (t.k + 1)}` : `бұл ${t.k + 1}×${(t.N - t.take) / (t.k + 1)}`}. Енді қарсылас жеңілетін жағдайда.`) }; }
        ch.mark(i, "bad"); setTimeout(() => ch.clear(), 900);
        const rest = t.N - (i + 1);
        let reply = 1; for (let x = 1; x <= t.k; x++) if (lose(rest - x)) { reply = x; break; }
        return { ok: false, msg: tx(`Тогда останется ${rest}. Соперник возьмёт ${reply}, оставит тебе ${rest - reply} — и сможет так делать до конца.`, `Онда ${rest} қалады. Қарсылас ${reply} алып, саған ${rest - reply} қалдырады — және соңына дейін солай істей алады.`) };
      },
      solve() {
        const safe = range(6).map(i => (t.misere ? 1 + i * (t.k + 1) : (i + 1) * (t.k + 1))).filter(x => x < t.N);
        return [
          { t: t.hints[0] },
          { t: tx(`«Плохие» для соперника числа: ${safe.join(", ")}. Кто получил такое число перед своим ходом — проиграет, если другой не ошибётся.`, `Қарсылас үшін «жаман» сандар: ${safe.join(", ")}. Жүріс алдында осындай сан алған — екіншісі қателеспесе, жеңіледі.`) },
          { t: tx(`Сейчас ${t.N}. Берём ${t.take} — остаётся ${t.N - t.take}.`, `Қазір ${t.N}. ${t.take} аламыз — ${t.N - t.take} қалады.`), act: () => { ch.set(t.take - 1); ch.mark(t.take - 1, "good"); drawPile(t.take); } },
        ];
      },
    };
  },
});

/* ---------------------------- ПЕРЕПРАВА ---------------------------- */
const RIVER_SETS = [
  { items: ["🐺", "🐐", "🥬"], names: [tx("волк", "қасқыр"), tx("коза", "ешкі"), tx("капуста", "қырыққабат")], acc: [tx("волка", "қасқырды"), tx("козу", "ешкіні"), tx("капусту", "қырыққабатты")], bad: [[0, 1], [1, 2]], eat: [tx("волк съест козу", "қасқыр ешкіні жейді"), tx("коза съест капусту", "ешкі қырыққабатты жейді")] },
  { items: ["🦊", "🐔", "🌾"], names: [tx("лиса", "түлкі"), tx("курица", "тауық"), tx("зерно", "дән")], acc: [tx("лису", "түлкіні"), tx("курицу", "тауықты"), tx("зерно", "дәнді")], bad: [[0, 1], [1, 2]], eat: [tx("лиса съест курицу", "түлкі тауықты жейді"), tx("курица склюёт зерно", "тауық дәнді шоқиды")] },
];
registerTask({
  id: "river", dir: "strategy", kind: "game", title: tx("Переправа", "Өткел"),
  gen(R) { const s = R.int(0, RIVER_SETS.length - 1); const S = RIVER_SETS[s];
    return { set: s, q: tx(`Фермеру нужно перевезти на другой берег ${S.names.map(n => n.ru).join(", ")}. В лодку помещается фермер и ещё один пассажир. Без фермера нельзя оставлять вместе: ${S.eat.map(e => e.ru).join("; ")}. Нажимай на пассажира, чтобы посадить его в лодку, и на «Плыть».`, `Фермер ${S.names.map(n => n.kz).join(", ")} арғы жағаға өткізуі керек. Қайыққа фермер мен тағы бір жолаушы сыяды. Фермерсіз бірге қалдыруға болмайды: ${S.eat.map(e => e.kz).join("; ")}. Жолаушыны қайыққа отырғызу үшін оны бас, сосын «Жүзу» батырмасын бас.`),
      hints: [tx("Первым рейсом можно везти только одного — того, кого опасно оставлять с обоими.", "Бірінші рейспен тек біреуін алып өтуге болады — екеуімен де қалдыруға қауіпті болғанын."), tx("Иногда пассажира нужно привезти обратно!", "Кейде жолаушыны кері алып келу керек!")] }; },
  render(t, box) {
    const S = RIVER_SETS[t.set];
    let side = [0, 0, 0], boat = 0, cargo = null, trips = 0;
    const ui = el(`<div class="river"><div class="bank l" data-b="0"></div><div class="water"><div class="boat"></div></div><div class="bank r" data-b="1"></div></div>`);
    const bar = el(`<div class="btns"><button type="button" class="btn y go">⛵ ${L("Плыть", "Жүзу")}</button><button type="button" class="btn sm dk rreset">${L("Начать сначала", "Басынан бастау")}</button><span class="mute trips"></span></div>`);
    box.append(ui, bar);
    const draw = () => {
      [0, 1].forEach(b => { $(`.bank[data-b="${b}"]`, ui).innerHTML = (boat === b ? `<span class="farmer">🧑‍🌾</span>` : "") + S.items.map((e, i) => side[i] === b && cargo !== i ? `<button type="button" class="rit" data-i="${i}">${e}</button>` : "").join(""); });
      const bt = $(".boat", ui); bt.classList.toggle("right", boat === 1); bt.innerHTML = `🛶${cargo != null ? `<button type="button" class="rit inb" data-i="${cargo}">${S.items[cargo]}</button>` : ""}`;
      $(".trips", bar).innerHTML = L(`Рейсов: ${trips}`, `Рейс: ${trips}`);
    };
    draw();
    ui.addEventListener("click", e => {
      const b = e.target.closest(".rit"); if (!b || box.classList.contains("locked")) return; const i = +b.dataset.i;
      if (b.classList.contains("inb")) cargo = null; else if (side[i] === boat) cargo = cargo === i ? null : i;
      draw();
    });
    const danger = (sd, bt) => { for (let k = 0; k < S.bad.length; k++) { const [a, b] = S.bad[k]; if (sd[a] === sd[b] && sd[a] !== bt) return k; } return -1; };
    $(".go", bar).onclick = () => { if (!box.classList.contains("locked")) sail(); };
    function sail() {
      const ns = side.slice(); if (cargo != null) ns[cargo] = 1 - boat; const nb = 1 - boat;
      const d = danger(ns, nb);
      if (d >= 0) { toast(tx(`Так нельзя: ${S.eat[d].ru}, пока фермера нет рядом!`, `Болмайды: фермер жоқта ${S.eat[d].kz}!`), 3200); return; }
      side = ns; boat = nb; cargo = null; trips++; draw();
      if (side.every(x => x === 1)) toast(tx("Все на другом берегу!", "Бәрі арғы жағада!"));
    }
    $(".rreset", bar).onclick = () => { if (box.classList.contains("locked")) return; side = [0, 0, 0]; boat = 0; cargo = null; trips = 0; draw(); };
    const plan = [1, null, 0, 1, 2, null, 1];
    return {
      check() {
        if (!trips) return EMPTY(tx("Начни перевозить: нажми на пассажира, потом «Плыть».", "Тасымалдауды баста: жолаушыны бас, сосын «Жүзу»."));
        if (side.every(x => x === 1)) return { ok: true, msg: trips <= 7 ? tx(`Получилось за ${trips} рейсов — это самый короткий способ!`, `${trips} рейсте шықты — бұл ең қысқа тәсіл!`) : tx(`Получилось за ${trips} рейсов. Можно и за 7!`, `${trips} рейсте шықты. 7 рейсте де болады!`) };
        return { ok: false, msg: tx("Ещё не все на другом берегу. Продолжай!", "Әлі бәрі арғы жағада емес. Жалғастыр!") };
      },
      solve() {
        side = [0, 0, 0]; boat = 0; cargo = null; trips = 0; draw();
        const nm = i => (i == null ? tx("никого", "ешкімді") : S.acc[i]);
        return plan.map((c, k) => ({ t: c == null ? tx(`Рейс ${k + 1}: обратно фермер плывёт один.`, `${k + 1}-рейс: фермер кері жалғыз жүзеді.`) : tx(`Рейс ${k + 1}: ${k % 2 ? "обратно" : "туда"} везём ${nm(c).ru}.${k === 3 ? " Главный трюк: везём обратно!" : ""}`, `${k + 1}-рейс: ${nm(c).kz} ${k % 2 ? "кері" : "арғы жаққа"} апарамыз.${k === 3 ? " Басты айла: кері алып келеміз!" : ""}`), act: () => { cargo = c; draw(); setTimeout(sail, 450); } }));
      },
    };
  },
});

/* ---------------------------- ЗАДАЧИ В ТЕКСТЕ ---------------------------- */
const WORD = {
  queue: { g: [1, 2, 3], make(R, grade) { const a = R.int(2, grade === 1 ? 4 : 7), b = R.int(2, grade === 1 ? 4 : 8); const p = R.pick(NAMES); return { ans: a + b - 1, pic: { k: "queue", a, b },
    q: tx(`В очереди за мороженым ${p.ru} стоит ${a}-${p.g === "f" ? "й" : "м"} спереди и ${b}-${p.g === "f" ? "й" : "м"} сзади. Сколько всего человек в очереди?`, `Балмұздаққа кезекте ${p.kz} алдынан ${a}-ші, артынан ${b}-ші тұр. Кезекте барлығы неше адам бар?`),
    steps: [tx(`Спереди от ${ruGen(p)} — ${a - 1} чел., сзади — ${b - 1} чел.`, `${KZ.gen(p.kz)} алдында — ${a - 1} адам, артында — ${b - 1} адам.`), tx(`Всего: ${a - 1} + ${b - 1} + 1 (сам${p.g === "f" ? "а" : ""} ${p.ru}) = ${a + b - 1}.`, `Барлығы: ${a - 1} + ${b - 1} + 1 (${p.kz} өзі) = ${a + b - 1}.`)],
    trap: { v: a + b, m: tx(`${p.ru} посчитан${p.g === "f" ? "а" : ""} дважды — и «спереди», и «сзади». Нарисуй очередь!`, `${p.kz} екі рет саналды — «алдынан» да, «артынан» да. Кезекті сызып көр!`) } }; } },
  logs: { g: [1, 2, 3], make(R) { const n = R.int(3, 7); const cutQ = R.chance(0.5); return cutQ ? { ans: n - 1, pic: { k: "log", n }, q: tx(`Бревно распилили на ${n} частей. Сколько сделали распилов?`, `Бөренені ${n} бөлікке араламен кесті. Неше рет кесті?`), steps: [tx("Нарисуем бревно: каждый распил добавляет одну часть, а первая часть есть с самого начала.", "Бөренені сызайық: әр кесу бір бөлік қосады, ал бірінші бөлік басынан бар."), tx(`Распилов на один меньше, чем частей: ${n} − 1 = ${n - 1}.`, `Кесу саны бөліктен бір кем: ${n} − 1 = ${n - 1}.`)], trap: { v: n, m: tx("Посмотри на картинку: между частями — распилы. Их меньше, чем частей.", "Суретке қара: бөліктердің арасы — кесілген жер. Олар бөліктен аз.") } }
    : { ans: n, pic: { k: "log", n }, q: tx(`Бревно распилили ${n - 1} раз${n - 1 > 4 ? "" : "а"}. Сколько получилось частей?`, `Бөренені ${n - 1} рет кесті. Неше бөлік шықты?`), steps: [tx("Один распил — две части, два распила — три части…", "Бір кесу — екі бөлік, екі кесу — үш бөлік…"), tx(`Частей на одну больше, чем распилов: ${n - 1} + 1 = ${n}.`, `Бөлік кесуден бір көп: ${n - 1} + 1 = ${n}.`)], trap: { v: n - 1, m: tx("Нарисуй бревно и распилы — частей получится больше, чем распилов.", "Бөрене мен кесулерді сыз — бөлік кесуден көп шығады.") } }; } },
  siblings: { g: [1, 2], make(R) { const b = R.int(1, 3), s = R.int(1, 2); const p = R.pick(NAMES.filter(n => n.g === "f")); const br = { 1: "1 старший брат", 2: "2 старших брата", 3: "3 старших брата" }[b], sr = { 1: "1 младшая сестра", 2: "2 младшие сестры" }[s];
    return { ans: b + s + 1, q: tx(`У ${ruGen(p)} ${br} и ${sr}. Сколько детей в семье?`, `${KZ.gen(p.kz)} ${b} ағасы және ${s} сіңлісі бар. Отбасында неше бала бар?`), steps: [tx(`Братья и сёстры: ${b} + ${s} = ${b + s}.`, `Ағалары мен сіңлілері: ${b} + ${s} = ${b + s}.`), tx(`Не забудем саму ${p.g === "f" ? p.ru.replace(/я$/, "ю").replace(/а$/, "у") : p.ru}: ${b + s} + 1 = ${b + s + 1}.`, `${p.kz} өзін ұмытпайық: ${b + s} + 1 = ${b + s + 1}.`)], trap: { v: b + s, m: tx(`А саму ${p.ru.replace(/я$/, "ю").replace(/а$/, "у")} ты посчитал?`, `${p.kz} өзін санадың ба?`) } }; } },
  brothers: { g: [3, 4], make(R) { const n = R.int(3, 5); return { ans: n + 1, q: tx(`В семье ${n} ${plural(n, "брат", "брата", "братьев")}, и у каждого из них есть одна сестра. Сколько детей в семье?`, `Отбасында ${n} ағайынды ұл бар, әрқайсысының бір қарындасы бар. Отбасында неше бала бар?`), steps: [tx("У каждого брата есть сестра — но это одна и та же девочка!", "Әр ұлдың қарындасы бар — бірақ бұл бір ғана қыз!"), tx(`${n} ${plural(n, "брат", "брата", "братьев")} + 1 сестра = ${n + 1}.`, `${n} ұл + 1 қыз = ${n + 1}.`)], trap: { v: 2 * n, m: tx("Сестёр не так много: у всех братьев она одна и та же!", "Қарындас көп емес: барлық ұлдың қарындасы — бір қыз!") } }; } },
  eggs: { g: [2, 3], make(R) { const m = R.int(3, 8), k = R.int(2, 5); return { ans: m, q: tx(`Одно яйцо варится ${m} минут. Сколько минут будут вариться ${k} яйца в одной кастрюле?`, `Бір жұмыртқа ${m} минут піседі. Бір кастрөлдегі ${k} жұмыртқа неше минут піседі?`), steps: [tx("Яйца варятся одновременно, а не по очереди.", "Жұмыртқалар кезекпен емес, бір уақытта піседі."), tx(`Значит, тоже ${m} минут.`, `Демек, бәрібір ${m} минут.`)], trap: { v: m * k, m: tx("Яйца в одной кастрюле варятся одновременно — время не складывается!", "Бір кастрөлдегі жұмыртқалар бір уақытта піседі — уақыт қосылмайды!") } }; } },
  age: { g: [2, 3], make(R) { const a = R.int(2, 4), b = R.int(9, 14), c = R.int(1, 3); const p = R.pick(NAMES.filter(n => n.g === "m")); return { ans: b - a - c, q: tx(`Через ${a} года ${ruGen(p).replace(/а$/, "у")} будет ${b} лет. Сколько лет было ${ruGen(p).replace(/а$/, "у")} ${c} ${plural(c, "год", "года", "лет")} назад?`, `${a} жылдан кейін ${p.kz} ${b} жаста болады. ${c} жыл бұрын ${p.kz} неше жаста болды?`), steps: [tx(`Сейчас: ${b} − ${a} = ${b - a}.`, `Қазір: ${b} − ${a} = ${b - a}.`), tx(`${c} ${plural(c, "год", "года", "лет")} назад: ${b - a} − ${c} = ${b - a - c}.`, `${c} жыл бұрын: ${b - a} − ${c} = ${b - a - c}.`)], trap: { v: b - c, m: tx("Сначала узнай, сколько ему лет сейчас.", "Алдымен оның қазір неше жаста екенін біл.") } }; } },
  socks: { g: [3, 4], make(R) { const k = R.int(2, 4); const cw = ["двух", "трёх", "четырёх"][k - 2]; return { ans: k + 1, q: tx(`В тёмном ящике лежат носки ${cw} цветов (их много). Какое наименьшее число носков нужно достать не глядя, чтобы среди них точно оказались два носка одного цвета?`, `Қараңғы жәшікте ${k} түсті шұлық жатыр (көп). Араларында бір түсті екі шұлық сөзсіз болуы үшін, қарамай ең кемі неше шұлық алу керек?`), steps: [tx(`Самый «невезучий» случай: первые ${k} носка — все разных цветов.`, `Ең «сәтсіз» жағдай: алғашқы ${k} шұлық — бәрі әртүрлі түсті.`), tx(`Следующий, ${k + 1}-й, обязательно совпадёт с одним из них.`, `Келесі, ${k + 1}-ші, міндетті түрде біреуімен сәйкес келеді.`)], trap: { v: 2, m: tx("Два носка могут оказаться разного цвета. Подумай о самом «невезучем» случае.", "Екі шұлық әртүрлі түсті болуы мүмкін. Ең «сәтсіз» жағдайды ойла.") } }; } },
  fence: { g: [3, 4], make(R) { const d = R.pick([2, 3, 5]), n = R.int(3, 6); const Lm = d * n; return { ans: n + 1, pic: { k: "fence", n }, q: tx(`Вдоль дорожки длиной ${Lm} метров поставили столбики через каждые ${d} ${plural(d, "метр", "метра", "метров")} — от начала до самого конца. Сколько столбиков поставили?`, `Ұзындығы ${Lm} метр жолдың бойына әр ${d} метр сайын бағана қойды — басынан соңына дейін. Неше бағана қойылды?`), steps: [tx(`Промежутков: ${Lm} : ${d} = ${n}.`, `Аралық саны: ${Lm} : ${d} = ${n}.`), tx(`Столбиков на один больше, чем промежутков: ${n} + 1 = ${n + 1}.`, `Бағана аралықтан бір көп: ${n} + 1 = ${n + 1}.`)], trap: { v: n, m: tx("Ты посчитал промежутки. А столбик стоит и в начале, и в конце — нарисуй!", "Сен аралықтарды санадың. Бағана басында да, соңында да тұр — сызып көр!") } }; } },
  stairs: { g: [4], make(R) { const per = R.int(10, 18), f1 = R.int(3, 4), f2 = R.int(5, 7); return { ans: per * (f2 - 1), q: tx(`Чтобы подняться с 1-го этажа на ${f1}-й, нужно пройти ${per * (f1 - 1)} ступенек. Сколько ступенек с 1-го этажа на ${f2}-й? (Во всех пролётах ступенек поровну.)`, `1-қабаттан ${f1}-қабатқа көтерілу үшін ${per * (f1 - 1)} баспалдақ жүру керек. 1-қабаттан ${f2}-қабатқа неше баспалдақ? (Барлық аралықта баспалдақ саны бірдей.)`), steps: [tx(`С 1-го на ${f1}-й — это ${f1 - 1} пролёта, в каждом ${per * (f1 - 1)} : ${f1 - 1} = ${per}.`, `1-ден ${f1}-қабатқа — ${f1 - 1} аралық, әрқайсысында ${per * (f1 - 1)} : ${f1 - 1} = ${per}.`), tx(`С 1-го на ${f2}-й — ${f2 - 1} пролётов: ${per} × ${f2 - 1} = ${per * (f2 - 1)}.`, `1-ден ${f2}-қабатқа — ${f2 - 1} аралық: ${per} × ${f2 - 1} = ${per * (f2 - 1)}.`)], trap: { v: per * (f1 - 1) / f1 * f2, m: tx("С 1-го этажа на 3-й — только 2 пролёта, а не 3!", "1-қабаттан 3-қабатқа — 3 емес, 2 аралық қана!") } }; } },
  legs: { g: [4], make(R) { const c = R.int(2, 8), r = R.int(2, 8); return { ans: r, q: tx(`Во дворе гуляют куры и кролики. У них вместе ${c + r} голов и ${2 * c + 4 * r} ног. Сколько кроликов?`, `Аулада тауықтар мен қояндар жүр. Бәрінің бірге ${c + r} басы және ${2 * c + 4 * r} аяғы бар. Неше қоян бар?`), steps: [tx(`Пусть все ${c + r} — куры. Тогда ног было бы ${2 * (c + r)}.`, `Барлық ${c + r} — тауық болсын. Онда аяқ саны ${2 * (c + r)} болар еді.`), tx(`Лишних ног: ${2 * c + 4 * r} − ${2 * (c + r)} = ${2 * r}. У каждого кролика на 2 ноги больше.`, `Артық аяқ: ${2 * c + 4 * r} − ${2 * (c + r)} = ${2 * r}. Әр қоянның аяғы 2-ге көп.`), tx(`Кроликов: ${2 * r} : 2 = ${r}.`, `Қоян саны: ${2 * r} : 2 = ${r}.`)], trap: { v: c, m: tx("Это число кур. А вопрос — про кроликов.", "Бұл — тауық саны. Ал сұрақ — қояндар туралы.") } }; } },
  pages: { g: [4], make(R) { const n = R.int(12, 40); return { ans: 9 + 2 * (n - 9), q: tx(`Сколько цифр нужно напечатать, чтобы пронумеровать страницы книги с 1-й по ${n}-ю?`, `Кітап беттерін 1-ден ${n}-ге дейін нөмірлеу үшін неше цифр басу керек?`), steps: [tx("Страницы 1–9: по одной цифре — 9 цифр.", "1–9 беттер: бір цифрдан — 9 цифр."), tx(`Страницы 10–${n}: их ${n - 9}, по две цифры — ${2 * (n - 9)}.`, `10–${n} беттер: ${n - 9} бет, екі цифрдан — ${2 * (n - 9)}.`), tx(`Всего: 9 + ${2 * (n - 9)} = ${9 + 2 * (n - 9)}.`, `Барлығы: 9 + ${2 * (n - 9)} = ${9 + 2 * (n - 9)}.`)], trap: { v: n, m: tx("Страниц — " + n + ", но у двузначных номеров по ДВЕ цифры.", "Бет саны — " + n + ", бірақ екі таңбалы нөмірлерде ЕКІ цифр бар.") } }; } },
};
registerTask({
  id: "wordprob", dir: "text", kind: "input", title: tx("Логические задачи", "Логикалық есептер"),
  gen(R, grade, level) {
    const keys = Object.keys(WORD).filter(k => WORD[k].g.includes(grade));
    const k = keys[(R.int(0, keys.length - 1) + level) % keys.length];
    const w = WORD[k].make(R, grade);
    return { k, ...w, hints: [tx("Нарисуй условие: человечков, бревно, столбики…", "Шартты сыз: адамдарды, бөренені, бағаналарды…"), w.steps[0]] };
  },
  render(t, box) {
    const pic = el(`<div class="wpic"></div>`);
    const f = numField({ max: 3 }); const line = el(`<div class="ansline">${L("Ответ:", "Жауабы:")} </div>`); line.append(f);
    box.append(pic, line, keypad(() => $(".checkb", box.closest(".task"))?.click())); focusNum(f);
    const drawPic = () => {
      const p = t.pic; if (!p) return;
      if (p.k === "queue") { const n = p.a + p.b - 1; pic.innerHTML = `<div class="queue">${range(n).map(i => `<span class="${i === p.a - 1 ? "me" : ""}">${avatarSVG(i === p.a - 1 ? 1 : 7, 38)}</span>`).join("")}</div><div class="mute">${L("← начало очереди", "← кезектің басы")}</div>`; }
      if (p.k === "log") pic.innerHTML = `<div class="logline">${range(p.n).map(i => `<span class="lg"></span>${i < p.n - 1 ? `<span class="cut">✂</span>` : ""}`).join("")}</div>`;
      if (p.k === "fence") pic.innerHTML = `<div class="fence">${range(p.n + 1).map(i => `<span class="post"></span>${i < p.n ? `<span class="gap"></span>` : ""}`).join("")}</div>`;
    };
    return {
      check() {
        if (!f.value) return EMPTY(tx("Впиши ответ.", "Жауапты жаз."));
        const v = +f.value; if (v === t.ans) { f.classList.add("good"); drawPic(); return { ok: true, msg: t.steps.at(-1) }; }
        f.classList.add("bad"); setTimeout(() => f.classList.remove("bad"), 900);
        if (t.trap && v === t.trap.v) return { ok: false, msg: t.trap.m };
        return { ok: false, msg: tx("Перечитай условие и попробуй нарисовать его.", "Шартты қайта оқып, сызып көр.") };
      },
      solve() { const st = t.steps.map((s, i) => ({ t: s, act: i === 0 ? drawPic : null })); st.push({ t: tx(`Ответ: ${t.ans}.`, `Жауабы: ${t.ans}.`), act: () => { f.set(t.ans); f.classList.add("good"); } }); return st; },
    };
  },
});
