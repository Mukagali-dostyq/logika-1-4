"use strict";
/* =====================================================================
   АЛГОРИТМЫ: робот (robot)
   СИММЕТРИЯ И ПОВОРОТЫ: дорисуй отражение (mirror) · поверни фигуру (rotate)
   ГЕОМЕТРИЧЕСКИЕ КОНСТРУКЦИИ: собери силуэт (pieces) · переложи палочку (sticks)
   ===================================================================== */

const DIRS4 = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const ARROW = { U: "↑", D: "↓", L: "←", R: "→" };
const DIRNAME = { U: tx("вверх", "жоғары"), D: tx("вниз", "төмен"), L: tx("влево", "солға"), R: tx("вправо", "оңға") };
const ROBOT_SVG = `<svg viewBox="0 0 100 100"><g stroke="#151821" stroke-width="5" stroke-linejoin="round"><line x1="50" y1="6" x2="50" y2="20"/><circle cx="50" cy="6" r="5" fill="#F03E3E"/><rect x="18" y="20" width="64" height="48" rx="12" fill="#2F5BFF"/><rect x="26" y="68" width="48" height="24" rx="6" fill="#7B4AE2"/></g><circle cx="37" cy="42" r="8" fill="#fff"/><circle cx="63" cy="42" r="8" fill="#fff"/><circle cx="37" cy="42" r="3.5" fill="#151821"/><circle cx="63" cy="42" r="3.5" fill="#151821"/><rect x="38" y="56" width="24" height="5" rx="2" fill="#151821"/></svg>`;
const STAR_SVG = `<svg viewBox="0 0 100 100"><path d="M50 6 L61.8 36.5 L94 37.6 L68.6 57.8 L77.6 89.4 L50 71 L22.4 89.4 L31.4 57.8 L6 37.6 L38.2 36.5 Z" fill="#FFC21A" stroke="#151821" stroke-width="5" stroke-linejoin="round"/></svg>`;

function bfs(W, H, rock, s, g) {
  const key = (x, y) => y * W + x; const prev = new Map([[key(...s), null]]); const q = [s];
  while (q.length) { const [x, y] = q.shift(); if (x === g[0] && y === g[1]) break;
    for (const d of "RDLU") { const [dx, dy] = DIRS4[d]; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || rock.has(key(nx, ny)) || prev.has(key(nx, ny))) continue; prev.set(key(nx, ny), [x, y, d]); q.push([nx, ny]); } }
  if (!prev.has(key(...g))) return null;
  const path = []; let cur = g; while (prev.get(key(...cur))) { const [px, py, d] = prev.get(key(...cur)); path.unshift(d); cur = [px, py]; }
  return path;
}
const compress = (path, rep) => { const out = []; for (const d of path) { const l = out[out.length - 1]; if (rep && l && l.d === d && l.n < 5) l.n++; else out.push({ d, n: 1 }); } return out; };
const progText = p => p.map(c => ARROW[c.d] + (c.n > 1 ? "×" + c.n : "")).join(" ");
function simulate(W, H, rock, s, prog) {
  let [x, y] = s; const trail = [[x, y]];
  for (let i = 0; i < prog.length; i++) for (let k = 0; k < prog[i].n; k++) {
    const [dx, dy] = DIRS4[prog[i].d]; const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return { crash: "edge", at: i, trail, x, y };
    if (rock.has(ny * W + nx)) return { crash: "rock", at: i, trail, x, y };
    x = nx; y = ny; trail.push([x, y]);
  }
  return { trail, x, y };
}
registerTask({
  id: "robot", dir: "algo", kind: "build", title: tx("Робот-помощник", "Робот-көмекші"),
  gen(R, grade, level) {
    const W = grade === 1 ? 4 : grade === 2 ? 5 : 6, H = grade === 1 ? 4 : grade === 2 ? 5 : (grade === 3 ? 5 : 6);
    const rep = grade >= 3;
    const bug = (grade === 2 && level === 3) || (grade === 3 && level >= 2 && R.chance(0.5)) || (grade === 4 && level === 2);
    const [lo, hi] = grade === 1 ? [3, 5] : grade === 2 ? [4, 7] : grade === 3 ? [6, 10] : [7, 12];
    for (let t = 0; t < 500; t++) {
      const rock = new Set(); const dens = grade === 1 ? 0.12 : 0.2;
      for (let i = 0; i < W * H; i++) if (R.chance(dens)) rock.add(i);
      const s = [R.int(0, W - 1), R.int(0, H - 1)], g = [R.int(0, W - 1), R.int(0, H - 1)];
      rock.delete(s[1] * W + s[0]); rock.delete(g[1] * W + g[0]);
      const path = bfs(W, H, rock, s, g); if (!path || path.length < lo || path.length > hi) continue;
      const turns = path.filter((d, i) => i && d !== path[i - 1]).length; if (grade >= 2 && turns < 2) continue;
      const best = compress(path, rep);
      const base = { W, H, rock: [...rock], s, g, rep, best, minLen: best.length };
      const limit = grade === 4 && level === 3 ? best.length : null;
      if (bug) {
        const prog = best.map(c => ({ ...c })); const i = R.int(0, prog.length - 1);
        if (rep && prog[i].n > 1 && R.chance(0.5)) prog[i].n += R.pick([-1, 1]); else prog[i].d = R.pick("UDLR".split("").filter(d => d !== prog[i].d));
        const sim = simulate(W, H, rock, s, prog); if (!sim.crash && sim.x === g[0] && sim.y === g[1]) continue;
        return { ...base, mode: "bug", prog, bad: i, q: tx("Робот должен дойти до звезды, но в программе одна ошибка. Нажми на неверную команду и исправь её стрелкой.", "Робот жұлдызға жетуі керек, бірақ бағдарламада бір қате бар. Қате команданы басып, бағыттауышпен түзет."),
          hints: [tx("Пройди программу пальцем по полю — шаг за шагом. Где робот сворачивает не туда?", "Бағдарламаны саусағыңмен өрісте қадамдап жүріп шық. Робот қай жерде қате бұрылады?"), tx(`Ошибка в команде №${i + 1}.`, `Қате №${i + 1} командада.`)] };
      }
      return { ...base, mode: "build", limit, q: limit ? tx(`Составь программу, чтобы робот дошёл до звезды. Используй не больше ${limit} команд (повтор ×2, ×3 считается одной командой).`, `Робот жұлдызға жетуі үшін бағдарлама құр. ${limit} командадан артық қолданба (×2, ×3 қайталау — бір команда).`)
          : tx("Составь программу из стрелок, чтобы робот дошёл до звезды и не врезался в камни.", "Робот жұлдызға жетіп, тастарға соқтығыспауы үшін бағыттауыштардан бағдарлама құр."),
        hints: [tx("Сначала найди дорогу глазами, потом записывай её по одному шагу.", "Алдымен жолды көзбен тап, сосын оны бір-бір қадаммен жаз."), ...(rep ? [tx("Несколько одинаковых шагов подряд можно записать одной командой: нажми на команду в программе, чтобы поставить ×2, ×3…", "Қатар келген бірдей қадамдарды бір командамен жазуға болады: бағдарламадағы команданы басып, ×2, ×3… қой.")] : [])] };
    }
    throw new Error("robot");
  },
  render(t, box, ctx) {
    const rock = new Set(t.rock); const W = t.W, H = t.H;
    const field = el(`<div class="rfield" style="--w:${W};--h:${H}">${range(W * H).map(i => `<div class="rc ${rock.has(i) ? "rock" : ""}" data-i="${i}"></div>`).join("")}<div class="rstar">${STAR_SVG}</div><div class="rbot">${ROBOT_SVG}</div></div>`);
    const prog = el(`<div class="rprog"><div class="pl">${L("Программа:", "Бағдарлама:")}</div><div class="pcmds"></div></div>`);
    const pad = el(`<div class="rpad">${"LURD".split("").map(d => `<button type="button" class="btn rbtn" data-d="${d}">${ARROW[d]}</button>`).join("")}<button type="button" class="btn sm dk rclear">${L("Стереть", "Өшіру")}</button><button type="button" class="btn sm y rrun">▶ ${L("Пуск", "Іске қосу")}</button></div>`);
    box.append(el(`<div class="robot"></div>`)); const wrap = $(".robot", box); wrap.append(field, el(`<div class="rside"></div>`)); $(".rside", wrap).append(prog, pad);
    const bot = $(".rbot", field), star = $(".rstar", field);
    const put = (n, x, y) => { n.style.setProperty("--x", x); n.style.setProperty("--y", y); };
    put(star, ...t.g); put(bot, ...t.s);
    let P = t.mode === "bug" ? t.prog.map(c => ({ ...c })) : []; let selI = null; let lastSim = null;
    const draw = () => {
      $(".pcmds", prog).innerHTML = P.map((c, i) => `<button type="button" class="pcmd ${i === selI ? "sel" : ""}" data-i="${i}">${ARROW[c.d]}${c.n > 1 ? `<sub>×${c.n}</sub>` : ""}${t.mode === "build" ? `<i class="x" data-x="${i}">×</i>` : ""}</button>`).join("") || `<span class="mute">${L("пусто — нажимай стрелки", "бос — бағыттауыштарды бас")}</span>`;
      if (t.limit) $(".pcmds", prog).insertAdjacentHTML("beforeend", `<span class="plim ${P.length > t.limit ? "over" : ""}">${P.length}/${t.limit}</span>`);
    };
    draw();
    const locked = () => box.classList.contains("locked");
    pad.addEventListener("click", e => {
      if (locked()) return;
      const b = e.target.closest(".rbtn");
      if (b) { resetBot(); if (t.mode === "bug") { if (selI == null) return toast(tx("Сначала нажми на неверную команду в программе.", "Алдымен бағдарламадағы қате команданы бас.")); P[selI].d = b.dataset.d; } else { const l = P[P.length - 1]; if (t.rep && false && l && l.d === b.dataset.d) l.n++; else P.push({ d: b.dataset.d, n: 1 }); } draw(); }
      if (e.target.closest(".rclear")) { resetBot(); if (t.mode === "bug") P = t.prog.map(c => ({ ...c })); else P = []; selI = null; draw(); }
      if (e.target.closest(".rrun")) run();
    });
    prog.addEventListener("click", e => {
      if (locked()) return;
      const x = e.target.closest("[data-x]"); if (x) { resetBot(); P.splice(+x.dataset.x, 1); draw(); return; }
      const c = e.target.closest(".pcmd"); if (!c) return; const i = +c.dataset.i; resetBot();
      if (t.mode === "bug") { if (selI === i && t.rep) P[i].n = P[i].n % 5 + 1; selI = i; }
      else if (t.rep) P[i].n = P[i].n % 5 + 1;
      draw();
    });
    function resetBot() { put(bot, ...t.s); bot.classList.remove("crash", "win"); $$(".rc.trail", field).forEach(n => n.classList.remove("trail")); lastSim = null; }
    let running = false;
    async function run(progArg) {
      if (running) return; running = true; resetBot();
      const pr = progArg || P;
      const sim = simulate(W, H, rock, t.s, pr); lastSim = sim;
      for (const [x, y] of sim.trail.slice(1)) { put(bot, x, y); $(`.rc[data-i="${y * W + x}"]`, field).classList.add("trail"); await sleep(260); }
      if (sim.crash) { bot.classList.add("crash"); }
      else if (sim.x === t.g[0] && sim.y === t.g[1]) bot.classList.add("win");
      running = false; return sim;
    }
    return {
      check() {
        if (!P.length) return EMPTY(tx("Составь программу из стрелок.", "Бағыттауыштардан бағдарлама құр."));
        const sim = simulate(W, H, rock, t.s, P);
        run();
        if (sim.crash) return { ok: false, msg: tx(`На команде №${sim.at + 1} (${ARROW[P[sim.at].d]}) робот ${sim.crash === "rock" ? "врезается в камень" : "выходит за край поля"}.`, `№${sim.at + 1} командада (${ARROW[P[sim.at].d]}) робот ${sim.crash === "rock" ? "тасқа соғылады" : "өрістен шығып кетеді"}.`) };
        if (sim.x !== t.g[0] || sim.y !== t.g[1]) return { ok: false, msg: tx("Робот остановился не на звезде. Посмотри, где он закончил путь, и поправь программу.", "Робот жұлдызда тоқтамады. Ол қай жерде тоқтағанын қарап, бағдарламаны түзет.") };
        if (t.limit && P.length > t.limit) return { ok: false, msg: tx(`Робот дошёл, но команд ${P.length}, а нужно не больше ${t.limit}. Объедини одинаковые шаги в повтор (×2, ×3).`, `Робот жетті, бірақ команда саны ${P.length}, ал ${t.limit}-ден аспауы керек. Бірдей қадамдарды қайталауға (×2, ×3) біріктір.`) };
        const extra = !t.limit && t.mode === "build" && P.reduce((s, c) => s + c.n, 0) > t.best.reduce((s, c) => s + c.n, 0) ? tx(" Есть путь короче — попробуй найти его!", " Бұдан қысқа жол бар — тауып көр!") : tx("", "");
        return { ok: true, msg: tx(`Программа: ${progText(P)}.${extra.ru}`, `Бағдарлама: ${progText(P)}.${extra.kz}`) };
      },
      solve() {
        const st = [];
        if (t.mode === "bug") st.push({ t: tx(`Ошибка в команде №${t.bad + 1}: должно быть ${ARROW[t.best[t.bad].d]}${t.best[t.bad].n > 1 ? "×" + t.best[t.bad].n : ""}.`, `Қате №${t.bad + 1} командада: ${ARROW[t.best[t.bad].d]}${t.best[t.bad].n > 1 ? "×" + t.best[t.bad].n : ""} болуы керек.`), act: () => { selI = t.bad; P = t.best.map(c => ({ ...c })); draw(); } });
        else st.push({ t: tx(`Кратчайший путь: ${progText(t.best)}.`, `Ең қысқа жол: ${progText(t.best)}.`), act: () => { P = t.best.map(c => ({ ...c })); draw(); } });
        st.push({ t: tx("Запускаем — робот на звезде!", "Іске қосамыз — робот жұлдызда!"), act: () => run(t.best) });
        return st;
      },
    };
  },
});

/* ---------------------------------------------------------------------
   ДОРИСУЙ ОТРАЖЕНИЕ
   --------------------------------------------------------------------- */
registerTask({
  id: "mirror", dir: "symmetry", kind: "grid", title: tx("Дорисуй отражение", "Шағылысын сал"),
  gen(R, grade, level) {
    const horiz = grade >= 3 && R.chance(0.4);
    const half = grade === 1 ? 3 : grade === 2 ? 4 : 5, other = grade === 1 ? 4 : grade === 2 ? 5 : 6;
    const W = horiz ? other : half, H = horiz ? half : other; // размер половинки
    const ncol = grade <= 2 ? 1 : level === 1 ? 1 : 2 + (grade === 4 && level === 3 ? 1 : 0);
    const cols = ["blue", "red", "green"].slice(0, ncol);
    const target = grade === 1 ? 5 : grade === 2 ? 7 : 10;
    for (let t = 0; t < 200; t++) {
      const cells = {}; let x = horiz ? R.int(0, W - 1) : W - 1, y = horiz ? H - 1 : R.int(0, H - 1); // начинаем у оси
      let k = 0; while (Object.keys(cells).length < target && k++ < 200) { cells[`${x},${y}`] = R.pick(cols); const [dx, dy] = R.pick(Object.values(DIRS4)); x = Math.max(0, Math.min(W - 1, x + dx)); y = Math.max(0, Math.min(H - 1, y + dy)); }
      if (Object.keys(cells).length < target - 1) continue;
      return { W, H, horiz, cells, cols, q: horiz ? tx("Дорисуй нижнюю половину так, чтобы получилось зеркальное отражение верхней. Нажимай на клетки.", "Төменгі жартысын жоғарғысының айнадағы шағылысы болатындай сал. Ұяшықтарды бас.") : tx("Дорисуй правую половину так, чтобы получилось зеркальное отражение левой. Нажимай на клетки.", "Оң жақ жартысын сол жақтың айнадағы шағылысы болатындай сал. Ұяшықтарды бас."),
        hints: [tx("Считай клетки от оси (толстая линия): клетка у самой оси отражается тоже к самой оси.", "Ұяшықтарды осьтен (жуан сызықтан) сана: оське жақын ұяшық та оське жақын шағылысады."), ...(ncol > 1 ? [tx("Цвет тоже отражается: нажимай на клетку несколько раз, чтобы сменить цвет.", "Түс те шағылысады: түсті ауыстыру үшін ұяшықты бірнеше рет бас.")] : [])] };
    }
    throw new Error("mirror");
  },
  render(t, box) {
    const { W, H, horiz } = t;
    const GW = horiz ? W : 2 * W, GH = horiz ? 2 * H : H;
    const mine = {};
    const isGiven = (x, y) => (horiz ? y < H : x < W);
    const mirrorOf = (x, y) => (horiz ? [x, 2 * H - 1 - y] : [2 * W - 1 - x, y]);
    const want = {}; Object.entries(t.cells).forEach(([k, c]) => { const [x, y] = k.split(",").map(Number); const [mx, my] = mirrorOf(x, y); want[`${mx},${my}`] = c; });
    const grid = el(`<div class="mgrid2 ${horiz ? "h" : "v"}" style="--w:${GW};--h:${GH}">${range(GH).map(y => range(GW).map(x => { const k = `${x},${y}`; const g = isGiven(x, y); return `<div class="mcell ${g ? "given" : "free"}" data-k="${k}" ${g && t.cells[k] ? `style="background:${COLORS[t.cells[k]].hex}"` : ""}></div>`; }).join("")).join("")}<div class="axis"></div></div>`);
    box.append(grid);
    const paint = (k, c) => { const n = $(`[data-k="${k}"]`, grid); if (c) { mine[k] = c; n.style.background = COLORS[c].hex; } else { delete mine[k]; n.style.background = ""; } };
    grid.addEventListener("click", e => {
      const n = e.target.closest(".mcell.free"); if (!n || box.classList.contains("locked")) return;
      const k = n.dataset.k; const seq = [null, ...t.cols]; const cur = mine[k] || null; paint(k, seq[(seq.indexOf(cur) + 1) % seq.length]);
      $$(".mcell.bad", grid).forEach(x => x.classList.remove("bad"));
    });
    return {
      check() {
        if (!Object.keys(mine).length) return EMPTY(tx("Закрась клетки во второй половине.", "Екінші жартысындағы ұяшықтарды боя."));
        const keys = new Set([...Object.keys(mine), ...Object.keys(want)]);
        const bad = [...keys].filter(k => mine[k] !== want[k]);
        if (!bad.length) return { ok: true };
        bad.forEach(k => $(`[data-k="${k}"]`, grid).classList.add("bad"));
        const miss = bad.filter(k => want[k] && !mine[k]).length, extra = bad.filter(k => mine[k] && !want[k]).length, col = bad.length - miss - extra;
        return { ok: false, msg: tx(`Не совпадает клеток: ${bad.length} (они подсвечены).${miss ? ` Не закрашено: ${miss}.` : ""}${extra ? ` Лишних: ${extra}.` : ""}${col ? ` Не тот цвет: ${col}.` : ""}`, `Сәйкес емес ұяшық: ${bad.length} (белгіленген).${miss ? ` Боялмаған: ${miss}.` : ""}${extra ? ` Артық: ${extra}.` : ""}${col ? ` Түсі басқа: ${col}.` : ""}`) };
      },
      solve() {
        const order = Object.keys(want).sort((a, b) => { const [ax, ay] = a.split(",").map(Number), [bx, by] = b.split(",").map(Number); return horiz ? ay - by : ax - bx; });
        return [
          { t: tx("Убираем всё лишнее и отражаем клетки, начиная от оси.", "Артықты өшіріп, ұяшықтарды осьтен бастап шағылыстырамыз."), act: () => Object.keys(mine).forEach(k => paint(k, null)) },
          { t: tx("Каждая клетка на том же расстоянии от оси, что и её «пара».", "Әр ұяшық осьтен өз «жұбымен» бірдей қашықтықта."), act: async () => { $$(".mcell.bad", grid).forEach(x => x.classList.remove("bad")); for (const k of order) { paint(k, want[k]); $(`[data-k="${k}"]`, grid).classList.add("pop"); await sleep(140); } } },
        ];
      },
    };
  },
});

/* ---------------------------------------------------------------------
   ПОВОРОТ ФИГУРЫ (полимино с отметкой)
   --------------------------------------------------------------------- */
const normCells = cells => { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
const rotCW = cells => normCells(cells.map(([x, y]) => [-y, x]));
const flipH = cells => normCells(cells.map(([x, y]) => [-x, y]));
const ckey = cells => normCells(cells).map(c => c.join(",")).join(";");
function rotN(cells, n) { let c = normCells(cells); for (let i = 0; i < ((n % 4) + 4) % 4; i++) c = rotCW(c); return c; }
function polySVG(cells, mark, px = 26, color = "#2F5BFF") {
  const W = Math.max(...cells.map(c => c[0])) + 1, H = Math.max(...cells.map(c => c[1])) + 1;
  const mk = mark ? cells.findIndex(c => c[0] === mark[0] && c[1] === mark[1]) : -1;
  return `<svg viewBox="-3 -3 ${W * 20 + 6} ${H * 20 + 6}" width="${(W * 20 + 6) * px / 20}" height="${(H * 20 + 6) * px / 20}">${cells.map(([x, y], i) => `<rect x="${x * 20}" y="${y * 20}" width="20" height="20" fill="${i === mk ? "#FFC21A" : color}" stroke="#151821" stroke-width="2.5"/>`).join("")}</svg>`;
}
/* фигура с отмеченной клеткой: отметка — часть фигуры, поэтому храним клетки с флагом */
const rotM = (cells, n) => { let c = cells.map(x => x.slice()); for (let i = 0; i < ((n % 4) + 4) % 4; i++) c = c.map(([x, y, m]) => [-y, x, m]); return normM(c); };
const flipM = cells => normM(cells.map(([x, y, m]) => [-x, y, m]));
const normM = cells => { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(([x, y, m]) => [x - mx, y - my, m]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
const mkey = cells => normM(cells).map(c => c.join(",")).join(";");
function polyMSVG(cells, px = 26, color = "#2F5BFF") {
  const W = Math.max(...cells.map(c => c[0])) + 1, H = Math.max(...cells.map(c => c[1])) + 1;
  return `<svg class="poly" viewBox="-3 -3 ${W * 20 + 6} ${H * 20 + 6}" width="${(W * 20 + 6) * px / 20}" height="${(H * 20 + 6) * px / 20}">${cells.map(([x, y, m]) => `<rect x="${x * 20}" y="${y * 20}" width="20" height="20" fill="${m ? "#FFC21A" : color}" stroke="#151821" stroke-width="2.5"/>${m ? `<circle cx="${x * 20 + 10}" cy="${y * 20 + 10}" r="4.5" fill="#151821"/>` : ""}`).join("")}</svg>`;
}
registerTask({
  id: "rotate", dir: "symmetry", kind: "tap", title: tx("Поверни фигуру", "Фигураны бұр"),
  gen(R, grade, level) {
    const n = grade === 2 ? 4 : grade === 3 ? 5 : 6;
    for (let t = 0; t < 400; t++) {
      const cells = [[0, 0]]; while (cells.length < n) { const [x, y] = R.pick(cells); const [dx, dy] = R.pick(Object.values(DIRS4)); if (!cells.some(c => c[0] === x + dx && c[1] === y + dy)) cells.push([x + dx, y + dy]); }
      const base = normM(cells.map(([x, y], i) => [x, y, i === 0 ? 1 : 0]));
      const vars = []; for (let f = 0; f < 2; f++) for (let r = 0; r < 4; r++) vars.push(mkey(rotM(f ? flipM(base) : base, r)));
      if (new Set(vars).size !== 8) continue; // без симметрий — все 8 положений разные
      const W0 = Math.max(...base.map(c => c[0])) + 1, H0 = Math.max(...base.map(c => c[1])) + 1; if (Math.max(W0, H0) > 4) continue;
      const mode = grade === 2 && level <= 2 ? "same" : "turn";
      if (mode === "same") {
        const r = R.int(1, 3); const right = rotM(base, r);
        const opts = [right, flipM(base), rotM(flipM(base), 1), rotM(flipM(base), 2), rotM(flipM(base), 3)];
        const pick = [right, ...R.sample(opts.slice(1), 3)];
        const sh = R.shuffle(pick);
        return { mode, base, opts: sh, ans: sh.findIndex(o => mkey(o) === mkey(right)), r, q: tx("Какая фигура — это та же самая фигура, только повёрнутая? (Переворачивать нельзя!)", "Қай фигура — дәл осы фигура, тек бұрылған? (Аударуға болмайды!)"),
          hints: [tx("Следи за жёлтой клеткой с точкой: где она относительно «хвостика» фигуры?", "Нүктесі бар сары ұяшықты бақыла: ол фигураның «құйрығына» қатысты қайда?"), tx("Три варианта — зеркальные отражения: их можно получить, только перевернув фигуру, как блин.", "Үш нұсқа — айнадағы шағылыс: оларды фигураны құймақ сияқты аударып қана алуға болады.")] };
      }
      const r = grade === 3 ? R.pick([1, 2, 3]) : R.pick([1, 3, 2]);
      const right = rotM(base, r);
      const others = [flipM(right), rotM(base, r + 1), rotM(base, r + 2), rotM(base, r + 3), flipM(base)].filter(o => mkey(o) !== mkey(right));
      const uniq = []; for (const o of R.shuffle(others)) if (!uniq.some(u => mkey(u) === mkey(o)) && uniq.length < 3) uniq.push(o);
      if (!uniq.some(u => mkey(u) === mkey(flipM(right)))) uniq[0] = flipM(right); // зеркальная ловушка всегда есть
      const sh = R.shuffle([right, ...uniq]);
      const angle = { 1: tx("на 90° по часовой стрелке", "сағат тілімен 90°-қа"), 2: tx("на 180° (пол-оборота)", "180°-қа (жарты айналым)"), 3: tx("на 90° против часовой стрелки", "сағат тіліне қарсы 90°-қа") }[r];
      return { mode, base, opts: sh, ans: sh.findIndex(o => mkey(o) === mkey(right)), r, angle,
        q: tx(`Какая фигура получится, если повернуть эту ${angle.ru}?`, `Мына фигураны ${angle.kz} бұрсақ, қандай фигура шығады?`),
        hints: [tx("Следи за жёлтой клеткой с точкой — куда она переедет?", "Нүктесі бар сары ұяшықты бақыла — ол қайда ауысады?"), tx("Поворот на 90° по часовой: то, что было сверху, станет справа.", "Сағат тілімен 90° бұрғанда: жоғарыдағы оң жаққа шығады.")] };
    }
    throw new Error("rotate");
  },
  render(t, box, ctx) {
    const src = el(`<div class="rotsrc"><div class="rs">${polyMSVG(t.base, 34)}</div>${t.mode === "turn" ? `<div class="rarrow">${t.r === 3 ? "↺" : "↻"} <b>${t.r === 2 ? "180°" : "90°"}</b></div>` : ""}</div>`);
    box.append(src);
    const tryBtn = el(`<button type="button" class="btn sm">${L("↻ Покрутить фигуру", "↻ Фигураны бұру")}</button>`);
    if (ctx.mode !== "test") src.append(tryBtn);
    let ang = 0;
    tryBtn.onclick = () => { ang += 90; $(".rs svg", src).style.transform = `rotate(${ang}deg)`; };
    const ch = choiceUI(box, t.opts.map(o => polyMSVG(o, 30)), { cls: "polys" });
    return {
      check() {
        const i = ch.get(); if (i == null) return EMPTY(tx("Выбери фигуру внизу.", "Төменнен фигураны таңда."));
        if (i === t.ans) { ch.mark(i, "good"); return { ok: true }; }
        ch.mark(i, "bad"); setTimeout(() => ch.clear(), 900);
        const o = mkey(t.opts[i]);
        const isRot = [0, 1, 2, 3].map(k => mkey(rotM(t.base, k))).indexOf(o);
        if (isRot < 0) return { ok: false, msg: tx("Это зеркальное отражение: его можно получить, только перевернув фигуру. Поворотом так не выйдет.", "Бұл айнадағы шағылыс: оны фигураны аударып қана алуға болады. Бұрумен бұлай шықпайды.") };
        return { ok: false, msg: tx(`Это поворот ${{ 0: "на 0° (фигура не повернулась)", 1: "на 90° по часовой стрелке", 2: "на 180°", 3: "на 90° против часовой стрелки" }[isRot]}, а нужно ${t.angle.ru}.`, `Бұл ${{ 0: "0°-қа (бұрылмаған)", 1: "сағат тілімен 90°-қа", 2: "180°-қа", 3: "сағат тіліне қарсы 90°-қа" }[isRot]} бұру, ал керегі — ${t.angle.kz}.`) };
      },
      solve() {
        const deg = t.mode === "same" ? t.r * 90 : t.r === 3 ? -90 : t.r * 90;
        return [
          { t: tx("Следим за жёлтой клеткой и поворачиваем фигуру.", "Сары ұяшықты бақылап, фигураны бұрамыз."), act: async () => { const s = $(".rs svg", src); s.style.transition = "transform 1.2s"; s.style.transform = `rotate(${deg}deg)`; await sleep(1300); } },
          { t: tx("Ищем среди ответов такую же фигуру — вот она.", "Жауаптардың ішінен дәл осындай фигураны іздейміз — міне ол."), act: () => { ch.set(t.ans); ch.mark(t.ans, "good"); } },
          { t: tx("Остальные варианты — либо отражения, либо поворот в другую сторону.", "Қалған нұсқалар — не шағылыс, не басқа жаққа бұру.") },
        ];
      },
    };
  },
});

/* ---------------------------------------------------------------------
   СОБЕРИ СИЛУЭТ ИЗ ДЕТАЛЕЙ
   --------------------------------------------------------------------- */
const PIECES = {
  I2: [[0, 0], [1, 0]], I3: [[0, 0], [1, 0], [2, 0]], L3: [[0, 0], [0, 1], [1, 1]],
  I4: [[0, 0], [1, 0], [2, 0], [3, 0]], O4: [[0, 0], [1, 0], [0, 1], [1, 1]], T4: [[0, 0], [1, 0], [2, 0], [1, 1]],
  L4: [[0, 0], [0, 1], [0, 2], [1, 2]], J4: [[1, 0], [1, 1], [1, 2], [0, 2]], S4: [[1, 0], [2, 0], [0, 1], [1, 1]], Z4: [[0, 0], [1, 0], [1, 1], [2, 1]],
};
const PCOL = ["#2F5BFF", "#F03E3E", "#12B886", "#FF8A1F", "#7B4AE2"];
registerTask({
  id: "pieces", dir: "geometry", kind: "drag", title: tx("Собери силуэт", "Сұлбаны құрастыр"),
  gen(R, grade, level) {
    const np = grade === 1 ? 2 : grade === 2 ? (level === 3 ? 3 : 2) : grade === 3 ? 3 : (level === 1 ? 3 : 4);
    const kinds = grade === 1 ? ["I2", "I3", "L3"] : grade === 2 ? ["I2", "I3", "L3", "O4", "L4", "T4"] : ["L3", "I3", "O4", "T4", "L4", "J4", "S4", "Z4", "I4"];
    const rotate = grade >= 2;
    for (let t = 0; t < 400; t++) {
      const occ = new Map(); const sol = [];
      for (let p = 0; p < np; p++) {
        const kind = R.pick(kinds); const r = rotate ? R.int(0, 3) : 0; const cells = rotN(PIECES[kind], r);
        let placed = false;
        for (let k = 0; k < 80 && !placed; k++) {
          let ox, oy;
          if (!occ.size) { ox = 0; oy = 0; } else { const [ax, ay] = R.pick([...occ.keys()].map(s => s.split(",").map(Number))); const [dx, dy] = R.pick(Object.values(DIRS4)); const [cx, cy] = R.pick(cells); ox = ax + dx - cx; oy = ay + dy - cy; }
          const abs = cells.map(([x, y]) => [x + ox, y + oy]);
          if (abs.some(([x, y]) => occ.has(`${x},${y}`))) continue;
          if (occ.size && !abs.some(([x, y]) => Object.values(DIRS4).some(([dx, dy]) => occ.has(`${x + dx},${y + dy}`)))) continue;
          abs.forEach(([x, y]) => occ.set(`${x},${y}`, p)); sol.push({ kind, r, ox, oy, cells }); placed = true;
        }
        if (!placed) break;
      }
      if (sol.length !== np) continue;
      const all = [...occ.keys()].map(s => s.split(",").map(Number));
      const mx = Math.min(...all.map(c => c[0])), my = Math.min(...all.map(c => c[1]));
      const W = Math.max(...all.map(c => c[0])) - mx + 1, H = Math.max(...all.map(c => c[1])) - my + 1;
      if (W > 7 || H > 5 || (grade === 1 && W > 5)) continue;
      // без «дыр» и без одиночных выступов-ловушек не проверяем — любая полная укладка засчитывается
      const board = all.map(([x, y]) => [x - mx, y - my]);
      const pieces = sol.map((s, i) => ({ kind: s.kind, sr: s.r, sx: s.ox - mx, sy: s.oy - my, start: rotate ? R.int(0, 3) : s.r, col: PCOL[i] }));
      if (rotate && pieces.every(p => p.start === p.sr)) pieces[0].start = (pieces[0].sr + 1) % 4;
      return { W, H, board, pieces, rotate, q: rotate ? tx("Собери силуэт из деталей. Перетаскивай детали на серое поле, нажми на деталь, чтобы повернуть её.", "Бөлшектерден сұлбаны құрастыр. Бөлшектерді сұр өріске апар, бұру үшін бөлшекті бас.") : tx("Собери силуэт из деталей: перетащи их на серое поле.", "Бөлшектерден сұлбаны құрастыр: оларды сұр өріске апар."),
        hints: [tx("Начни с самой большой детали или с самого «неудобного» угла силуэта.", "Ең үлкен бөлшектен немесе сұлбаның ең «ыңғайсыз» бұрышынан баста."), tx("Если деталь не влезает — поверни её.", "Бөлшек сыймаса — оны бұр.")] };
    }
    throw new Error("pieces");
  },
  render(t, box, ctx) {
    if (ctx.mode === "paper") { // на бумаге: силуэт + детали рядом, ребёнок делит силуэт линиями
      const cellsSVG = (cells, px, fill, dash) => { const W = Math.max(...cells.map(c => c[0])) + 1, H = Math.max(...cells.map(c => c[1])) + 1; return `<svg viewBox="-2 -2 ${W * 20 + 4} ${H * 20 + 4}" width="${(W * 20 + 4) * px / 20}" height="${(H * 20 + 4) * px / 20}">${cells.map(([x, y]) => `<rect x="${x * 20}" y="${y * 20}" width="20" height="20" fill="${fill}" stroke="#151821" stroke-width="${dash ? 1 : 2.5}" ${dash ? 'stroke-dasharray="2 2"' : ""}/>`).join("")}</svg>`; };
      box.append(el(`<div class="paperpieces"><div>${cellsSVG(t.board, 60, "#fff", true)}</div><div class="pp">${t.pieces.map(p => cellsSVG(rotN(PIECES[p.kind], p.start), 36, p.col)).join("")}</div></div>`));
      return {};
    }
    const stage = el(`<div class="pstage"></div>`); box.append(stage);
    const bw = Math.max(260, box.clientWidth || 600);
    const S = Math.max(34, Math.min(58, Math.floor(bw / (t.W + 7))));
    stage.style.setProperty("--s", S + "px");
    const boardSet = new Set(t.board.map(c => c.join(",")));
    const boardEl = el(`<div class="pboard" style="width:${t.W * S}px;height:${t.H * S}px">${t.board.map(([x, y]) => `<i style="left:${x * S}px;top:${y * S}px"></i>`).join("")}</div>`);
    const tray = el(`<div class="ptray"></div>`);
    stage.append(boardEl, tray);
    const state = t.pieces.map(p => ({ r: p.start, at: null })); // at — [x,y] на поле или null (в лотке)
    const pel = t.pieces.map((p, i) => { const n = el(`<div class="piece" data-i="${i}"></div>`); n.style.setProperty("--c", p.col); return n; });
    const drawPiece = i => { const c = rotN(PIECES[t.pieces[i].kind], state[i].r); const n = pel[i]; const w = Math.max(...c.map(q => q[0])) + 1, h = Math.max(...c.map(q => q[1])) + 1; n.style.width = w * S + "px"; n.style.height = h * S + "px"; n.innerHTML = c.map(([x, y]) => `<i style="left:${x * S}px;top:${y * S}px"></i>`).join(""); return c; };
    const layout = () => {
      const sr = stage.getBoundingClientRect(), br = boardEl.getBoundingClientRect();
      let tx0 = 0, ty0 = 0, rowH = 0; const tw = tray.getBoundingClientRect(); const trayLeft = tw.left - sr.left + 14, trayTop = tw.top - sr.top + 14;
      pel.forEach((n, i) => {
        const c = drawPiece(i);
        if (state[i].at) { n.style.left = br.left - sr.left + state[i].at[0] * S + "px"; n.style.top = br.top - sr.top + state[i].at[1] * S + "px"; n.classList.add("on"); }
        else {
          const w = parseFloat(n.style.width), h = parseFloat(n.style.height);
          if (tx0 + w > tw.width - 28 && tx0 > 0) { tx0 = 0; ty0 += rowH + 14; rowH = 0; }
          n.style.left = trayLeft + tx0 + "px"; n.style.top = trayTop + ty0 + "px"; tx0 += w + 18; rowH = Math.max(rowH, h); n.classList.remove("on");
        }
      });
      tray.style.minHeight = ty0 + rowH + 30 + "px";
    };
    pel.forEach(n => stage.append(n));
    requestAnimationFrame(layout); setTimeout(layout, 60);
    const ro = new ResizeObserver(() => layout()); ro.observe(stage);
    const occupied = skip => { const m = new Set(); state.forEach((s, i) => { if (i !== skip && s.at) rotN(PIECES[t.pieces[i].kind], s.r).forEach(([x, y]) => m.add(`${x + s.at[0]},${y + s.at[1]}`)); }); return m; };
    let drag = null;
    stage.addEventListener("pointerdown", e => {
      const n = e.target.closest(".piece"); if (!n || box.classList.contains("locked")) return;
      e.preventDefault(); const i = +n.dataset.i; const r = n.getBoundingClientRect();
      drag = { i, n, x: e.clientX, y: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, moved: false, id: e.pointerId }; n.setPointerCapture?.(e.pointerId);
    });
    stage.addEventListener("pointermove", e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) { drag.moved = true; drag.n.classList.add("lift"); state[drag.i].at = null; }
      if (drag.moved) { const sr = stage.getBoundingClientRect(); drag.n.style.left = e.clientX - sr.left - drag.ox + "px"; drag.n.style.top = e.clientY - sr.top - drag.oy + "px"; }
    });
    const up = e => {
      if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; d.n.classList.remove("lift");
      if (!d.moved) { if (t.rotate) { state[d.i].r = (state[d.i].r + 1) % 4; if (state[d.i].at) { const c = rotN(PIECES[t.pieces[d.i].kind], state[d.i].r); const occ = occupied(d.i); if (!c.every(([x, y]) => boardSet.has(`${x + state[d.i].at[0]},${y + state[d.i].at[1]}`) && !occ.has(`${x + state[d.i].at[0]},${y + state[d.i].at[1]}`))) state[d.i].at = null; } } layout(); return; }
      const br = boardEl.getBoundingClientRect(), pr = d.n.getBoundingClientRect();
      const gx = Math.round((pr.left - br.left) / S), gy = Math.round((pr.top - br.top) / S);
      const c = rotN(PIECES[t.pieces[d.i].kind], state[d.i].r); const occ = occupied(d.i);
      const fits = c.every(([x, y]) => boardSet.has(`${x + gx},${y + gy}`) && !occ.has(`${x + gx},${y + gy}`));
      state[d.i].at = fits ? [gx, gy] : null; layout();
    };
    stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
    return {
      check() {
        if (state.some(s => !s.at)) return EMPTY(tx("Положи на поле все детали.", "Барлық бөлшекті өріске қой."));
        const occ = occupied(-1);
        if (occ.size === boardSet.size) return { ok: true };
        return { ok: false, msg: tx("Не все клетки силуэта закрыты. Попробуй повернуть детали или поменять их местами.", "Сұлбаның барлық ұяшығы жабылмаған. Бөлшектерді бұрып немесе орнын ауыстырып көр.") };
      },
      solve() {
        return [
          { t: tx("Начинаем с детали, у которой меньше всего вариантов.", "Нұсқасы ең аз бөлшектен бастаймыз."), act: () => { state.forEach(s => (s.at = null)); state[0].r = t.pieces[0].sr; state[0].at = [t.pieces[0].sx, t.pieces[0].sy]; layout(); } },
          { t: tx("Остальные детали ложатся на свободные места.", "Қалған бөлшектер бос орындарға түседі."), act: async () => { for (let i = 1; i < t.pieces.length; i++) { await sleep(400); state[i].r = t.pieces[i].sr; state[i].at = [t.pieces[i].sx, t.pieces[i].sy]; layout(); } } },
        ];
      },
    };
  },
});

/* ---------------------------------------------------------------------
   ПЕРЕЛОЖИ ОДНУ ПАЛОЧКУ (цифры из палочек, как на электронных часах)
   --------------------------------------------------------------------- */
const SEG = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
const SEG2D = Object.fromEntries(Object.entries(SEG).map(([d, s]) => [s.split("").sort().join(""), +d]));
let STICK_BANK = null;
function stickBank() {
  if (STICK_BANK) return STICK_BANK;
  const out = [];
  const slots = (a, op, b, c) => { const S = new Set(); [a, b, c].forEach((d, k) => SEG[d].split("").forEach(s => S.add(`${k}${s}`))); S.add("oh"); if (op === "+") S.add("ov"); return S; };
  const ALL = []; for (const k of [0, 1, 2]) for (const s of "abcdefg") ALL.push(`${k}${s}`); ALL.push("oh", "ov");
  const read = S => { const dig = [0, 1, 2].map(k => SEG2D["abcdefg".split("").filter(s => S.has(`${k}${s}`)).join("")]); if (dig.some(d => d === undefined) || !S.has("oh")) return null; return { a: dig[0], op: S.has("ov") ? "+" : "−", b: dig[1], c: dig[2] }; };
  const val = e => (e.op === "+" ? e.a + e.b : e.a - e.b) === e.c;
  for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) for (let c = 0; c <= 9; c++) for (const op of ["+", "−"]) {
    if ((op === "+" ? a + b : a - b) === c) continue;
    const S = slots(a, op, b, c); const sols = [];
    for (const from of S) { if (from === "oh") continue; for (const to of ALL) { if (S.has(to)) continue; const T2 = new Set(S); T2.delete(from); T2.add(to); const e = read(T2); if (e && val(e)) sols.push({ from, to, e }); } }
    if (sols.length === 1) out.push({ a, op, b, c, sol: sols[0] });
  }
  return (STICK_BANK = out);
}
registerTask({
  id: "sticks", dir: "geometry", kind: "tap", title: tx("Переложи одну палочку", "Бір таяқшаны ауыстыр"),
  gen(R, grade, level) {
    const bank = stickBank();
    const pool = bank.filter(x => level === 1 ? x.sol.from[0] === x.sol.to[0] || x.sol.from[0] === "o" || x.sol.to[0] === "o" : level === 2 ? true : x.sol.from[0] !== x.sol.to[0]);
    const p = R.pick(pool.length ? pool : bank);
    return { ...p, q: tx(`Равенство неверное. Переложи ОДНУ палочку, чтобы оно стало верным. Нажми на палочку, потом — на пустое место.`, `Теңдік дұрыс емес. Ол дұрыс болуы үшін БІР таяқшаны ауыстыр. Таяқшаны бас, сосын — бос орынды.`),
      hints: [tx("Палочку можно взять из цифры или из знака «+» и положить в другую цифру или в знак.", "Таяқшаны цифрдан немесе «+» белгісінен алып, басқа цифрға не белгіге қоюға болады."),
        tx(`Подсказка: палочку нужно взять ${p.sol.from[0] === "o" ? "из знака «+»" : `из ${["первого", "второго", "третьего"][+p.sol.from[0]]} числа`}.`, `Кеңес: таяқшаны ${p.sol.from[0] === "o" ? "«+» белгісінен" : `${["бірінші", "екінші", "үшінші"][+p.sol.from[0]]} саннан`} алу керек.`)] };
  },
  render(t, box) {
    const orig = new Set(); [t.a, t.b, t.c].forEach((d, k) => SEG[d].split("").forEach(s => orig.add(`${k}${s}`))); orig.add("oh"); if (t.op === "+") orig.add("ov");
    let S = new Set(orig), held = null;
    // координаты палочек: цифра 60×110, отрезки
    const segXY = { a: [10, 5, 40, 0], b: [50, 10, 0, 40], c: [50, 60, 0, 40], d: [10, 105, 40, 0], e: [5, 60, 0, 40], f: [5, 10, 0, 40], g: [10, 55, 40, 0] };
    const X0 = [10, 170, 330], OX = 100, EQX = 255;
    const stick = (id, x, y, dx, dy) => { const x2 = x + dx, y2 = y + dy; return `<g class="stk" data-id="${id}"><line class="hit" x1="${x}" y1="${y}" x2="${x2}" y2="${y2}"/><line class="st" x1="${x}" y1="${y}" x2="${x2}" y2="${y2}"/><circle class="hd" cx="${dx ? x2 : x}" cy="${dy ? y : y}" r="5.5"/></g>`; };
    const svg = el(`<svg class="sticks" viewBox="0 0 410 120"></svg>`);
    const draw = () => {
      let h = "";
      [0, 1, 2].forEach(k => "abcdefg".split("").forEach(s => { const [x, y, dx, dy] = segXY[s]; h += stick(`${k}${s}`, X0[k] + x, y + 5, dx, dy); }));
      h += stick("oh", OX + 5, 60, 40, 0) + stick("ov", OX + 25, 40, 0, 40);
      h += `<line class="eqs" x1="${EQX}" y1="48" x2="${EQX + 40}" y2="48"/><line class="eqs" x1="${EQX}" y1="72" x2="${EQX + 40}" y2="72"/>`;
      svg.innerHTML = h;
      $$(".stk", svg).forEach(g => { const id = g.dataset.id; g.classList.toggle("on", S.has(id)); g.classList.toggle("held", id === held); g.classList.toggle("slot", !S.has(id) && held != null); });
    };
    draw();
    const reset = el(`<button type="button" class="btn sm">${L("↺ Вернуть как было", "↺ Бастапқы қалпына")}</button>`);
    box.append(svg, el(`<div class="btns"></div>`)); $(".btns", box).append(reset);
    reset.onclick = () => { if (box.classList.contains("locked")) return; S = new Set(orig); held = null; draw(); };
    svg.addEventListener("click", e => {
      const g = e.target.closest(".stk"); if (!g || box.classList.contains("locked")) return; const id = g.dataset.id;
      if (S.has(id)) { if (id === "oh") return toast(tx("Минус трогать нельзя — без него не будет знака.", "Минусты қозғауға болмайды — онсыз белгі болмайды.")); held = held === id ? null : id; }
      else if (held) { S.delete(held); S.add(id); held = null; }
      draw();
    });
    const readEq = () => { const dig = [0, 1, 2].map(k => SEG2D["abcdefg".split("").filter(s => S.has(`${k}${s}`)).join("")]); return { dig, op: S.has("ov") ? "+" : "−" }; };
    return {
      check() {
        const rem = [...orig].filter(x => !S.has(x)), add = [...S].filter(x => !orig.has(x));
        if (!rem.length) return EMPTY(tx("Переложи одну палочку: нажми на неё, потом на пустое место.", "Бір таяқшаны ауыстыр: оны бас, сосын бос орынды бас."));
        if (rem.length > 1) return { ok: false, msg: tx("Переложено больше одной палочки. Нажми «Вернуть как было» и попробуй снова.", "Бірден көп таяқша ауыстырылды. «Бастапқы қалпына» батырмасын басып, қайта көр.") };
        const { dig, op } = readEq();
        if (dig.some(d => d === undefined)) return { ok: false, msg: tx("Получилась фигура, которая не похожа ни на одну цифру.", "Ешбір цифрға ұқсамайтын фигура шықты.") };
        const ok = (op === "+" ? dig[0] + dig[1] : dig[0] - dig[1]) === dig[2];
        if (ok) return { ok: true, msg: tx(`${dig[0]} ${op} ${dig[1]} = ${dig[2]} — верно!`, `${dig[0]} ${op} ${dig[1]} = ${dig[2]} — дұрыс!`) };
        return { ok: false, msg: tx(`Получилось ${dig[0]} ${op} ${dig[1]} = ${dig[2]}, а это неверно: ${dig[0]} ${op} ${dig[1]} = ${op === "+" ? dig[0] + dig[1] : dig[0] - dig[1]}.`, `${dig[0]} ${op} ${dig[1]} = ${dig[2]} шықты, бұл бұрыс: ${dig[0]} ${op} ${dig[1]} = ${op === "+" ? dig[0] + dig[1] : dig[0] - dig[1]}.`) };
      },
      solve() {
        const e = t.sol.e;
        return [
          { t: tx(`Сейчас написано ${t.a} ${t.op} ${t.b} = ${t.c} — это неверно.`, `Қазір ${t.a} ${t.op} ${t.b} = ${t.c} деп жазылған — бұл бұрыс.`), act: () => { S = new Set(orig); held = t.sol.from; draw(); } },
          { t: tx(`Берём эту палочку и кладём сюда — получается ${e.a} ${e.op} ${e.b} = ${e.c}.`, `Осы таяқшаны алып, мына жерге қоямыз — ${e.a} ${e.op} ${e.b} = ${e.c} шығады.`), act: () => { S.delete(t.sol.from); S.add(t.sol.to); held = null; draw(); $(`.stk[data-id="${t.sol.to}"]`, svg)?.classList.add("moved"); } },
        ];
      },
    };
  },
});
