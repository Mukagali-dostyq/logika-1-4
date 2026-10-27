"use strict";
/* =====================================================================
   ПРОСТРАНСТВЕННОЕ МЫШЛЕНИЕ: куб со значками (cube3d) · сосчитай кубики / план (cubes)
   ===================================================================== */

/* Куб: грани F (перед) B (зад) L R U (верх) D (низ). Повороты «катим куб»:
   R — вправо: передняя грань уходит направо; L — влево; U — вверх: передняя уходит наверх; D — вниз. */
const CUBE_MOVES = {
  R: f => ({ ...f, F: f.L, R: f.F, B: f.R, L: f.B }),
  L: f => ({ ...f, F: f.R, L: f.F, B: f.L, R: f.B }),
  U: f => ({ ...f, F: f.D, U: f.F, B: f.U, D: f.B }),
  D: f => ({ ...f, F: f.U, D: f.F, B: f.D, U: f.B }),
};
const MOVE_TXT = { R: tx("вправо", "оңға"), L: tx("влево", "солға"), U: tx("вверх", "жоғары"), D: tx("вниз", "төмен") };
const MOVE_ARR = { R: "→", L: "←", U: "↑", D: "↓" };
const FACE_TXT = { F: tx("спереди", "алдында"), U: tx("сверху", "үстінде"), R: tx("справа", "оң жағында") };
const CUBE_SYMS = [{ s: "star", c: "yellow" }, { s: "circle", c: "red" }, { s: "triangle", c: "green" }, { s: "square", c: "blue" }, { s: "heart", c: "purple" }, { s: "diamond", c: "orange" }];

registerTask({
  id: "cube3d", dir: "spatial", kind: "3d", title: tx("Поверни кубик", "Текшені айналдыр"),
  gen(R, grade, level) {
    const syms = R.shuffle(range(6));
    const faces = { F: syms[0], B: syms[1], L: syms[2], R: syms[3], U: syms[4], D: syms[5] };
    const n = grade <= 2 ? 1 : grade === 3 ? level : level + 1;
    const ask = grade === 4 && level >= 2 ? R.pick(["F", "U"]) : "F";
    for (let t = 0; t < 100; t++) {
      const moves = range(n).map(() => R.pick("RLUD".split("")));
      if (moves.some((m, i) => i && ({ R: "L", L: "R", U: "D", D: "U" })[m] === moves[i - 1])) continue; // без «туда-обратно»
      let f = faces; moves.forEach(m => (f = CUBE_MOVES[m](f)));
      if (f[ask] === faces[ask] && n > 1) continue;
      const ans = f[ask];
      const opts = R.shuffle([ans, ...R.sample(range(6).filter(x => x !== ans), 3)]);
      return { faces, moves, ask, ansSym: ans, opts, ans: opts.indexOf(ans),
        q: tx(`Кубик повернули ${moves.map(m => `${MOVE_ARR[m]} ${MOVE_TXT[m].ru}`).join(", потом ")}. Какой значок окажется ${FACE_TXT[ask].ru}?`, `Текшені ${moves.map(m => `${MOVE_ARR[m]} ${MOVE_TXT[m].kz}`).join(", сосын ")} айналдырды. ${cap(FACE_TXT[ask].kz)} қай белгі болады?`),
        hints: [tx("«Вправо» — кубик катится вправо: передняя грань уходит направо, а спереди оказывается та, что была слева.", "«Оңға» — текше оңға домалайды: алдыңғы жақ оңға кетеді, ал алдыға сол жақтағы шығады."),
          tx("«Вверх» — передняя грань уходит наверх, а спереди оказывается та, что была снизу. Смотри на развёртку!", "«Жоғары» — алдыңғы жақ жоғары кетеді, ал алдыға астыңғы жақ шығады. Жазбаға қара!")] };
    }
    throw new Error("cube3d");
  },
  render(t, box, ctx) {
    const sym = i => shapeSVG({ ...CUBE_SYMS[i], z: "big" }, 64);
    let paperCube = "";
    if (ctx.mode === "paper") { // для печати — плоский изометрический рисунок (3D-сцены принтеры рисуют неверно)
      const w = 62, h = 36, hz = 72, ox = 70, oy = 80;
      const P = (x, y, z) => [ox + (x - y) * w, oy + (x + y) * h - z * hz];
      const face = (pts, fill) => `<polygon points="${pts.map(p => p.join(",")).join(" ")}" fill="${fill}" stroke="#151821" stroke-width="4" stroke-linejoin="round"/>`;
      const symAt = (o, u, v, i) => `<g transform="matrix(${u[0] / 100} ${u[1] / 100} ${v[0] / 100} ${v[1] / 100} ${o[0]} ${o[1]})"><g transform="translate(18 18) scale(.64)">${shapeSVG({ ...CUBE_SYMS[i], z: "big" }, 100).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g></g>`;
      const d = (a, b) => [b[0] - a[0], b[1] - a[1]];
      paperCube = `<svg viewBox="2 2 136 156" width="200">${face([P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)], "#FFFDF6")}${face([P(0, 1, 1), P(1, 1, 1), P(1, 1, 0), P(0, 1, 0)], "#FFF8EC")}${face([P(1, 1, 1), P(1, 0, 1), P(1, 0, 0), P(1, 1, 0)], "#F1E9D6")}
        ${symAt(P(0, 0, 1), d(P(0, 0, 1), P(1, 0, 1)), d(P(0, 0, 1), P(0, 1, 1)), t.faces.U)}${symAt(P(0, 1, 1), d(P(0, 1, 1), P(1, 1, 1)), d(P(0, 1, 1), P(0, 1, 0)), t.faces.F)}${symAt(P(1, 1, 1), d(P(1, 1, 1), P(1, 0, 1)), d(P(1, 1, 1), P(1, 1, 0)), t.faces.R)}</svg>`;
    }
    const wrap = el(`<div class="cubewrap">
      <div class="cubebox">${paperCube || `<div class="scene"><div class="view"><div class="cube">${["F", "B", "L", "R", "U", "D"].map(k => `<div class="face f${k}" data-f="${k}">${sym(t.faces[k])}</div>`).join("")}</div></div></div>`}
        <div class="ctrl"></div></div>
      <div class="netbox"><div class="k">${L("Развёртка кубика", "Текше жазбасы")}</div><div class="net">${["U", "L", "F", "R", "B", "D"].map(k => `<div class="nf n${k}"><span>${{ U: L("верх", "үсті"), L: L("лево", "сол"), F: L("перед", "алды"), R: L("право", "оң"), B: L("зад", "арты"), D: L("низ", "асты") }[k]}</span>${shapeSVG({ ...CUBE_SYMS[t.faces[k]], z: "big" }, 40)}</div>`).join("")}</div></div></div>`);
    box.append(wrap);
    const cube = $(".cube", wrap);
    let f = { ...t.faces }; let busy = false;
    const paint = () => $$(".face", cube).forEach(n => (n.innerHTML = sym(f[n.dataset.f])));
    async function roll(m) {
      if (busy) return; busy = true;
      const rot = { R: "rotateY(90deg)", L: "rotateY(-90deg)", U: "rotateX(90deg)", D: "rotateX(-90deg)" }[m];
      cube.style.transition = "transform .7s cubic-bezier(.4,.1,.3,1)"; cube.style.transform = rot;
      await sleep(720);
      cube.style.transition = "none"; f = CUBE_MOVES[m](f); paint(); cube.style.transform = "none"; void cube.offsetWidth;
      busy = false;
    }
    const ctrl = $(".ctrl", wrap);
    const free = ctx.mode === "learn" || ctx.mode === "board";
    const mkCtrl = () => {
      ctrl.innerHTML = `<span class="mute">${L("Покрути сам:", "Өзің айналдыр:")}</span>${"LURD".split("").map(m => `<button type="button" class="btn sm" data-m="${m}">${MOVE_ARR[m]}</button>`).join("")}<button type="button" class="btn sm dk" data-m="0">↺</button>`;
    };
    if (free) mkCtrl();
    ctrl.addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (!b) return; if (b.dataset.m === "0") { f = { ...t.faces }; paint(); } else roll(b.dataset.m); });
    const ch = choiceUI(box, t.opts.map(i => shapeSVG({ ...CUBE_SYMS[i], z: "big" }, 56)), { cls: "shapes" });
    let tries = 0;
    return {
      check() {
        const i = ch.get(); if (i == null) return EMPTY(tx("Выбери значок внизу.", "Төменнен белгіні таңда."));
        if (i === t.ans) { ch.mark(i, "good"); return { ok: true }; }
        ch.mark(i, "bad"); setTimeout(() => ch.clear(), 900); tries++;
        if (ctx.mode === "train" && tries === 1) { mkCtrl(); return { ok: false, msg: tx("Не тот значок. Теперь можно покрутить кубик кнопками и проверить себя — но сначала попробуй представить в уме!", "Белгі басқа. Енді текшені батырмалармен айналдырып, өзіңді тексеруге болады — бірақ алдымен ойша елестетіп көр!") }; }
        let g = t.faces; const path = t.moves.map(m => { g = CUBE_MOVES[m](g); return g[t.ask]; });
        return { ok: false, msg: tx(`Проследи по шагам: после каждого поворота запиши, что ${FACE_TXT[t.ask].ru}.`, `Қадаммен бақыла: әр бұрылыстан кейін ${FACE_TXT[t.ask].kz} не тұрғанын жаз.`) };
      },
      solve() {
        const st = [{ t: withH(tx(`Сначала ${FACE_TXT.F.ru} — этот значок.`, `Алдымен ${FACE_TXT.F.kz} — мына белгі.`), `<span class="inl">${shapeSVG({ ...CUBE_SYMS[t.faces.F], z: "big" }, 30)}</span>`), act: () => { f = { ...t.faces }; paint(); } }];
        let g = t.faces;
        t.moves.forEach((m, k) => { g = CUBE_MOVES[m](g); const now = g[t.ask]; st.push({ t: withH(tx(`Поворот ${k + 1}: ${MOVE_ARR[m]} ${MOVE_TXT[m].ru}. Теперь ${FACE_TXT[t.ask].ru}:`, `${k + 1}-бұрылыс: ${MOVE_ARR[m]} ${MOVE_TXT[m].kz}. Енді ${FACE_TXT[t.ask].kz}:`), `<span class="inl">${shapeSVG({ ...CUBE_SYMS[now], z: "big" }, 30)}</span>`), act: () => roll(m) }); });
        st.push({ t: tx("Это и есть ответ.", "Жауабы осы."), act: () => { ch.set(t.ans); ch.mark(t.ans, "good"); } });
        return st;
      },
    };
  },
});

/* ---------------------------------------------------------------------
   КУБИКИ: сколько всего? / заполни план (сколько кубиков в каждой клетке)
   Высоты не растут к зрителю — тогда видна верхушка каждого столбика.
   --------------------------------------------------------------------- */
function isoSVG(Hm, { px = 34, hlLayer = 0, fade = 0 } = {}) {
  const X = Hm[0].length, Y = Hm.length; const w = px, h = px * 0.5, hz = px * 0.95;
  const cubes = [];
  for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) for (let z = 0; z < Hm[y][x]; z++) cubes.push([x, y, z]);
  cubes.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[2] - b[2] || a[1] - b[1]);
  const maxZ = Math.max(1, ...Hm.flat());
  const W = (X + Y) * w, Ht = (X + Y) * h + maxZ * hz + 6;
  const ox = Y * w, oy = maxZ * hz + 3;
  const P = (x, y, z) => [ox + (x - y) * w, oy + (x + y) * h - z * hz];
  const poly = pts => pts.map(p => p.join(",")).join(" ");
  let s = "";
  for (const [x, y, z] of cubes) {
    const hl = hlLayer && z === hlLayer - 1, fd = fade && z !== hlLayer - 1;
    const top = hl ? "#FFD23F" : "#8FB0FF", left = hl ? "#E0AE14" : "#2F5BFF", right = hl ? "#C7960A" : "#1D3FC0";
    const op = fd ? ' opacity=".25"' : "";
    s += `<g${op} stroke="#151821" stroke-width="2" stroke-linejoin="round">
      <polygon fill="${top}" points="${poly([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)])}"/>
      <polygon fill="${left}" points="${poly([P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)])}"/>
      <polygon fill="${right}" points="${poly([P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)])}"/></g>`;
  }
  // цветные стороны «пола»: синяя — левая передняя, оранжевая — правая передняя (для плана)
  s = `<polyline points="${poly([P(0, Y, 0), P(X, Y, 0)])}" stroke="#12B886" stroke-width="7" fill="none" stroke-linecap="round"/><polyline points="${poly([P(X, 0, 0), P(X, Y, 0)])}" stroke="#FF8A1F" stroke-width="7" fill="none" stroke-linecap="round"/>` + s;
  return `<svg class="iso" viewBox="0 0 ${W} ${Ht}" width="${W}" height="${Ht}">${s}</svg>`;
}
const rot90 = Hm => Hm[0].map((_, x) => Hm.map(r => r[x]).reverse());
registerTask({
  id: "cubes", dir: "spatial", kind: "input", title: tx("Сколько кубиков?", "Неше текше?"),
  gen(R, grade, level) {
    const [X, Y, Z] = grade <= 2 ? (level === 1 ? [2, 2, 2] : [3, 2, 2]) : grade === 3 ? (level === 1 ? [3, 2, 3] : [3, 3, 3]) : [3, 3, level === 3 ? 4 : 3];
    const plan = (grade === 3 && level === 3) || (grade === 4 && level >= 2);
    for (let t = 0; t < 300; t++) {
      const Hm = range(Y).map(() => range(X).map(() => 0));
      // высоты не растут к зрителю: h[y][x] ≤ h[y-1][x] и ≤ h[y][x-1]
      for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) { const cap = Math.min(y ? Hm[y - 1][x] : Z, x ? Hm[y][x - 1] : Z); Hm[y][x] = R.int(y + x === 0 ? Math.max(1, cap - 1) : 0, cap); }
      const total = Hm.flat().reduce((a, b) => a + b, 0);
      const hidden = Hm.flat().reduce((a, b) => a + Math.max(0, b - 1), 0);
      if (total < (grade <= 2 ? 4 : 7) || (grade >= 3 && hidden < 2) || Hm.flat().filter(v => v === 0).length > (X * Y) / 2) continue;
      if (plan) return { Hm, X, Y, mode: "plan", total, q: tx("Посмотри на постройку и заполни план: сколько кубиков стоит в каждой клетке? Нажимай на клетку, чтобы менять число.", "Құрылысқа қарап, жоспарды толтыр: әр ұяшықта неше текше тұр? Санды ауыстыру үшін ұяшықты бас."),
        hints: [tx("Зелёная сторона пола на рисунке — это нижний край плана, оранжевая — правый край.", "Суреттегі еденнің жасыл жағы — жоспардың төменгі шеті, қызғылт сары жағы — оң жақ шеті."), tx("Считай этажи в каждом столбике сверху вниз.", "Әр бағанадағы қабаттарды жоғарыдан төмен сана.")] };
      return { Hm, X, Y, mode: "count", total, q: tx("Сколько кубиков в этой постройке? Не забудь о тех, что спрятаны внизу.", "Бұл құрылыста неше текше бар? Астында жасырынғандарын ұмытпа."),
        hints: [tx("Под каждым кубиком, который стоит наверху, обязательно есть кубик — иначе он упадёт.", "Жоғарыда тұрған әр текшенің астында міндетті түрде текше бар — әйтпесе ол құлайды."), tx("Считай по этажам: сколько кубиков на первом этаже, сколько на втором…", "Қабат бойынша сана: бірінші қабатта неше текше, екіншіде неше…")] };
    }
    throw new Error("cubes");
  },
  render(t, box, ctx) {
    const pic = el(`<div class="isobox"><div class="isopic">${isoSVG(t.Hm, { px: t.X + t.Y > 5 ? 40 : 48 })}</div></div>`);
    box.append(pic);
    let view = t.Hm;
    if (ctx.mode !== "test") {
      const rb = el(`<button type="button" class="btn sm">${L("↻ Обойти постройку", "↻ Құрылысты айналып қара")}</button>`);
      rb.onclick = () => { view = rot90(view); $(".isopic", pic).innerHTML = isoSVG(view, { px: t.X + t.Y > 5 ? 40 : 48 }); };
      pic.append(rb);
    }
    if (t.mode === "count") {
      const f = numField({ max: 3 });
      box.append(el(`<div class="ansline">${L("Всего кубиков:", "Барлық текше:")} </div>`)); $(".ansline", box).append(f);
      box.append(keypad(() => $(".checkb", box.closest(".task"))?.click())); focusNum(f);
      const layers = range(Math.max(...t.Hm.flat())).map(z => t.Hm.flat().filter(v => v > z).length);
      return {
        check() {
          if (!f.value) return EMPTY(tx("Впиши число.", "Сан жаз."));
          const v = +f.value;
          if (v === t.total) { f.classList.add("good"); return { ok: true, msg: tx(`По этажам: ${layers.join(" + ")} = ${t.total}.`, `Қабат бойынша: ${layers.join(" + ")} = ${t.total}.`) }; }
          f.classList.add("bad"); setTimeout(() => f.classList.remove("bad"), 900);
          const visible = t.Hm.flat().filter(v => v > 0).length + t.Hm.flat().reduce((a, b) => a + Math.max(0, b - 1), 0);
          return { ok: false, msg: v < t.total ? tx("Получилось меньше, чем на самом деле. Может, ты не посчитал кубики, которые спрятаны под верхними?", "Шын мәнінен аз шықты. Үстіңгілердің астындағы жасырын текшелерді санамадың ба?") : tx("Получилось больше. Проверь, не посчитал ли ты какой-то кубик дважды.", "Көп шықты. Бір текшені екі рет санамадың ба, тексер.") };
        },
        solve() {
          const st = layers.map((n, z) => ({ t: tx(`${z + 1}-й этаж: ${n} ${plural(n, "кубик", "кубика", "кубиков")}.`, `${z + 1}-қабат: ${n} текше.`), act: () => { $(".isopic", pic).innerHTML = isoSVG(t.Hm, { px: t.X + t.Y > 5 ? 40 : 48, hlLayer: z + 1, fade: 1 }); } }));
          st.push({ t: tx(`Всего: ${layers.join(" + ")} = ${t.total}.`, `Барлығы: ${layers.join(" + ")} = ${t.total}.`), act: () => { $(".isopic", pic).innerHTML = isoSVG(t.Hm, { px: t.X + t.Y > 5 ? 40 : 48 }); f.set(t.total); f.classList.add("good"); } });
          return st;
        },
      };
    }
    // план: таблица Y×X, нижний край — зелёный (передний левый), правый — оранжевый
    const val = range(t.Y).map(() => range(t.X).map(() => 0));
    const maxZ = Math.max(...t.Hm.flat()) + 1;
    const planEl = el(`<div class="plan" style="--x:${t.X}">${range(t.Y).map(y => range(t.X).map(x => `<button type="button" class="pc" data-x="${x}" data-y="${y}">0</button>`).join("")).join("")}</div>`);
    box.append(el(`<div class="planwrap"><div class="k">${L("План (вид сверху)", "Жоспар (үстінен көрінісі)")}</div></div>`)); $(".planwrap", box).append(planEl);
    planEl.addEventListener("click", e => { const b = e.target.closest(".pc"); if (!b || box.classList.contains("locked")) return; const x = +b.dataset.x, y = +b.dataset.y; val[y][x] = (val[y][x] + 1) % (maxZ + 1); b.textContent = val[y][x]; b.classList.remove("bad"); });
    return {
      check() {
        const bad = []; for (let y = 0; y < t.Y; y++) for (let x = 0; x < t.X; x++) if (val[y][x] !== t.Hm[y][x]) bad.push([x, y]);
        if (!bad.length) return { ok: true };
        bad.forEach(([x, y]) => $(`.pc[data-x="${x}"][data-y="${y}"]`, planEl).classList.add("bad"));
        return { ok: false, msg: tx(`Неверно в ${bad.length} ${plural(bad.length, "клетке", "клетках", "клетках")} (подсвечены). Сверь цветные края пола на рисунке и на плане.`, `${bad.length} ұяшықта қате (белгіленген). Суреттегі және жоспардағы еденнің түсті шеттерін салыстыр.`) };
      },
      solve() {
        return [
          { t: tx("Зелёный край пола — это нижний край плана, оранжевый — правый.", "Еденнің жасыл шеті — жоспардың төменгі шеті, қызғылт сары — оң жақ шеті.") },
          { t: tx("Считаем высоту каждого столбика и записываем в клетку.", "Әр бағананың биіктігін санап, ұяшыққа жазамыз."), act: async () => { for (let y = 0; y < t.Y; y++) for (let x = 0; x < t.X; x++) { val[y][x] = t.Hm[y][x]; const b = $(`.pc[data-x="${x}"][data-y="${y}"]`, planEl); b.textContent = val[y][x]; b.classList.remove("bad"); b.classList.add("pop"); await sleep(120); } } },
        ];
      },
    };
  },
});
