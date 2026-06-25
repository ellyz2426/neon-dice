// ============================================================
// NEON DICE VR — Holographic Yahtzee Dice Game
// Built with IWSDK 0.4.x — playable in VR and browser
// ============================================================

import {
  World, createSystem, PanelUI, PanelDocument, UIKitDocument, UIKit,
  BoxGeometry, MeshStandardMaterial, MeshBasicMaterial, Mesh,
  Color, Group, PointLight, DirectionalLight, AmbientLight, FogExp2,
  LineSegments, BufferGeometry, Float32BufferAttribute, LineBasicMaterial,
  SphereGeometry, CylinderGeometry, EdgesGeometry, Object3D,
  Follower, ScreenSpace, InputComponent,
} from '@iwsdk/core';

// Runtime input interface (typed at runtime, not in SDK types)
interface RuntimeInput {
  keyboard?: {
    getKeyDown(key: string): boolean;
    getKeyPressed(key: string): boolean;
  };
  gamepads: Record<'left'|'right', {
    getButtonDown(id: string): boolean;
    getButtonValue(id: string): number;
    getAxesValues(id: string): { x: number; y: number } | undefined;
  } | undefined>;
}

// ============================================================
// TYPES
// ============================================================
type Screen = 'title'|'modeselect'|'difficulty'|'playing'|'paused'|'gameover'|
  'leaderboard'|'achievements'|'stats'|'settings'|'help'|'skins'|'countdown';
type Mode = 'solo'|'vsai'|'speed'|'farkle'|'daily'|'marathon'|'zen'|'practice';
type Cat = 'ones'|'twos'|'threes'|'fours'|'fives'|'sixes'|
  'three-kind'|'four-kind'|'full-house'|'sm-straight'|'lg-straight'|'yahtzee'|'chance';

const UPPER: Cat[] = ['ones','twos','threes','fours','fives','sixes'];
const LOWER: Cat[] = ['three-kind','four-kind','full-house','sm-straight','lg-straight','yahtzee','chance'];
const ALL_CATS: Cat[] = [...UPPER, ...LOWER];
const CLBL: Record<Cat, string> = {
  ones:'Ones', twos:'Twos', threes:'Threes', fours:'Fours', fives:'Fives', sixes:'Sixes',
  'three-kind':'3 of a Kind', 'four-kind':'4 of a Kind', 'full-house':'Full House',
  'sm-straight':'Sm Straight', 'lg-straight':'Lg Straight', yahtzee:'Yahtzee', chance:'Chance',
};
const CFACE: Record<string, number> = { ones:1, twos:2, threes:3, fours:4, fives:5, sixes:6 };

// ============================================================
// THEMES
// ============================================================
interface Theme { name: string; accent: string; bg: string; fog: string; kept: string; table: string; grid: string; }
const THEMES: Theme[] = [
  { name:'Neon Holodeck', accent:'#00ffff', bg:'#000a0f', fog:'#000a0f', kept:'#00ff88', table:'#003344', grid:'#004455' },
  { name:'Crimson Grid', accent:'#ff3366', bg:'#0f0005', fog:'#0f0005', kept:'#ff8888', table:'#330011', grid:'#440022' },
  { name:'Toxic Neon', accent:'#33ff33', bg:'#000f00', fog:'#000f00', kept:'#88ff44', table:'#003300', grid:'#004400' },
  { name:'Ultra Violet', accent:'#aa55ff', bg:'#05000f', fog:'#05000f', kept:'#cc88ff', table:'#110033', grid:'#220044' },
  { name:'Solar Blaze', accent:'#ff8800', bg:'#0f0500', fog:'#0f0500', kept:'#ffbb44', table:'#331100', grid:'#442200' },
];

// ============================================================
// SKINS
// ============================================================
interface Skin { name: string; body: string; edge: string; pip: string; unlock: string; req: (s: Save) => boolean; }
const SKINS: Skin[] = [
  { name:'Neon Cyan', body:'#0a2030', edge:'#00ffff', pip:'#00ffff', unlock:'Default', req:()=>true },
  { name:'Solar Flare', body:'#301005', edge:'#ff6600', pip:'#ff8800', unlock:'Play 10 games', req:s=>s.totalGames>=10 },
  { name:'Plasma Pink', body:'#250a15', edge:'#ff33aa', pip:'#ff55cc', unlock:'Score 300+', req:s=>s.bestScore>=300 },
  { name:'Frost Blue', body:'#051530', edge:'#3388ff', pip:'#55aaff', unlock:'Win vs AI', req:s=>s.aiWins>=1 },
  { name:'Toxic Green', body:'#0a200a', edge:'#33ff33', pip:'#55ff55', unlock:'Get a Yahtzee', req:s=>s.totalYahtzees>=1 },
  { name:'Royal Gold', body:'#201505', edge:'#ffcc00', pip:'#ffdd44', unlock:'Score 250+', req:s=>s.bestScore>=250 },
  { name:'Void Purple', body:'#150a25', edge:'#aa33ff', pip:'#cc66ff', unlock:'Play all modes', req:s=>s.modesPlayed.size>=7 },
  { name:'Inferno', body:'#250505', edge:'#ff2222', pip:'#ff4444', unlock:'5 Yahtzees', req:s=>s.totalYahtzees>=5 },
];

// ============================================================
// ACHIEVEMENTS
// ============================================================
interface Ach { id: string; name: string; desc: string; chk: (s: Save) => boolean; }
const ACHS: Ach[] = [
  { id:'first_game', name:'First Roll', desc:'Complete your first game', chk:s=>s.totalGames>=1 },
  { id:'ten_games', name:'Regular', desc:'Play 10 games', chk:s=>s.totalGames>=10 },
  { id:'fifty_games', name:'Dedicated', desc:'Play 50 games', chk:s=>s.totalGames>=50 },
  { id:'score_100', name:'Century', desc:'Score 100+ in a game', chk:s=>s.bestScore>=100 },
  { id:'score_200', name:'Double Century', desc:'Score 200+', chk:s=>s.bestScore>=200 },
  { id:'score_300', name:'Triple Threat', desc:'Score 300+', chk:s=>s.bestScore>=300 },
  { id:'score_400', name:'High Roller', desc:'Score 400+', chk:s=>s.bestScore>=400 },
  { id:'yahtzee_1', name:'YAHTZEE!', desc:'Roll your first Yahtzee', chk:s=>s.totalYahtzees>=1 },
  { id:'yahtzee_3', name:'Lucky Streak', desc:'3 career Yahtzees', chk:s=>s.totalYahtzees>=3 },
  { id:'yahtzee_5', name:'Dice Master', desc:'5 career Yahtzees', chk:s=>s.totalYahtzees>=5 },
  { id:'yahtzee_10', name:'Yahtzee Legend', desc:'10 career Yahtzees', chk:s=>s.totalYahtzees>=10 },
  { id:'double_yahtzee', name:'Double Down', desc:'2 Yahtzees in one game', chk:s=>s.bestYzGame>=2 },
  { id:'upper_bonus', name:'Bonus Earned', desc:'Get the upper bonus', chk:s=>s.upperBonuses>=1 },
  { id:'five_upper', name:'Bonus Collector', desc:'5 upper bonuses', chk:s=>s.upperBonuses>=5 },
  { id:'full_house', name:'Full House', desc:'Score a Full House', chk:s=>s.fullHouses>=1 },
  { id:'lg_straight', name:'Going Long', desc:'Large Straight', chk:s=>s.lgStraights>=1 },
  { id:'sm_straight', name:'Running', desc:'Small Straight', chk:s=>s.smStraights>=1 },
  { id:'ai_win', name:'Victor', desc:'Beat the AI', chk:s=>s.aiWins>=1 },
  { id:'ai_win_5', name:'Dominant', desc:'Beat AI 5 times', chk:s=>s.aiWins>=5 },
  { id:'ai_hard', name:'Grandmaster', desc:'Beat AI on Hard', chk:s=>s.aiHardWins>=1 },
  { id:'speed_win', name:'Speed Demon', desc:'Finish a Speed game', chk:s=>s.speedGames>=1 },
  { id:'daily_done', name:'Daily Player', desc:'Finish a Daily', chk:s=>s.dailyGames>=1 },
  { id:'daily_3', name:'Daily Streak', desc:'3-day streak', chk:s=>s.dailyStreak>=3 },
  { id:'daily_7', name:'Weekly Warrior', desc:'7-day streak', chk:s=>s.dailyStreak>=7 },
  { id:'farkle_win', name:'Risk Taker', desc:'Win a Farkle game', chk:s=>s.farkleWins>=1 },
  { id:'farkle_bank_2k', name:'Big Bank', desc:'Bank 2000+ in Farkle', chk:s=>s.farkleBestBank>=2000 },
  { id:'marathon_win', name:'Endurance', desc:'Win a Marathon', chk:s=>s.marathonWins>=1 },
  { id:'mode_3', name:'Explorer', desc:'Play 3 modes', chk:s=>s.modesPlayed.size>=3 },
  { id:'mode_all', name:'Mode Master', desc:'Play all 8 modes', chk:s=>s.modesPlayed.size>=8 },
  { id:'rolls_100', name:'Dice Roller', desc:'Roll 100 times', chk:s=>s.totalRolls>=100 },
  { id:'rolls_500', name:'Dice Fanatic', desc:'Roll 500 times', chk:s=>s.totalRolls>=500 },
  { id:'rolls_1k', name:'Dice Machine', desc:'Roll 1000 times', chk:s=>s.totalRolls>=1000 },
  { id:'play_30m', name:'Time In', desc:'Play 30 minutes', chk:s=>s.playTime>=1800 },
  { id:'play_1h', name:'Time Invested', desc:'Play 1 hour', chk:s=>s.playTime>=3600 },
  { id:'skin_unlock', name:'Stylin', desc:'Unlock a new skin', chk:s=>SKINS.some((_,i)=>i>0&&SKINS[i].req(s)) },
  { id:'level_5', name:'Apprentice', desc:'Reach Level 5', chk:s=>s.level>=5 },
  { id:'level_10', name:'Adept', desc:'Reach Level 10', chk:s=>s.level>=10 },
  { id:'level_25', name:'Expert', desc:'Reach Level 25', chk:s=>s.level>=25 },
  { id:'chance_30', name:'Lucky Chance', desc:'Score 30 on Chance', chk:s=>s.bestChance>=30 },
  { id:'zero_cat', name:'Strategic Zero', desc:'Take a zero', chk:s=>s.zerosTaken>=1 },
  { id:'perfect_upper', name:'Perfect Upper', desc:'63+ upper no zeros', chk:s=>s.perfectUppers>=1 },
];

// ============================================================
// SAVE DATA
// ============================================================
interface Save {
  bestScore: number; totalScore: number; totalGames: number; totalRolls: number;
  totalYahtzees: number; bestYzGame: number; upperBonuses: number;
  fullHouses: number; lgStraights: number; smStraights: number;
  aiWins: number; aiHardWins: number; speedGames: number;
  dailyGames: number; dailyStreak: number; lastDaily: string;
  farkleWins: number; farkleBestBank: number; marathonWins: number;
  bestChance: number; zerosTaken: number; perfectUppers: number;
  modesPlayed: Set<string>; playTime: number; level: number; xp: number;
  achievements: Set<string>; skinIdx: number; themeIdx: number;
  masterVol: number; sfxVol: number; musicVol: number;
  leaderboard: { score: number; mode: string; date: string }[];
}
function defSave(): Save {
  return { bestScore:0, totalScore:0, totalGames:0, totalRolls:0, totalYahtzees:0,
    bestYzGame:0, upperBonuses:0, fullHouses:0, lgStraights:0, smStraights:0,
    aiWins:0, aiHardWins:0, speedGames:0, dailyGames:0, dailyStreak:0, lastDaily:'',
    farkleWins:0, farkleBestBank:0, marathonWins:0, bestChance:0, zerosTaken:0,
    perfectUppers:0, modesPlayed:new Set(), playTime:0, level:1, xp:0,
    achievements:new Set(), skinIdx:0, themeIdx:0, masterVol:0.8, sfxVol:0.8,
    musicVol:0.5, leaderboard:[] };
}
function loadSave(): Save {
  try {
    const raw = localStorage.getItem('neon-dice-save');
    if (!raw) return defSave();
    const j = JSON.parse(raw); const s = defSave();
    for (const k of Object.keys(s) as (keyof Save)[]) {
      if (j[k] !== undefined) {
        if (k === 'modesPlayed' || k === 'achievements') (s as any)[k] = new Set(j[k]);
        else (s as any)[k] = j[k];
      }
    }
    return s;
  } catch { return defSave(); }
}
function saveSave(s: Save) {
  const j: any = {};
  for (const k of Object.keys(s) as (keyof Save)[]) { const v = s[k]; j[k] = v instanceof Set ? [...v] : v; }
  try { localStorage.setItem('neon-dice-save', JSON.stringify(j)); } catch {}
}
let save = loadSave();

// ============================================================
// AUDIO
// ============================================================
class Audio {
  ctx: AudioContext | null = null;
  master!: GainNode; sfx!: GainNode; music!: GainNode;
  init() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
    this.music = this.ctx.createGain(); this.music.connect(this.master);
    this.setVol(save.masterVol, save.sfxVol, save.musicVol);
  }
  setVol(m: number, s: number, mu: number) {
    if (!this.ctx) return;
    this.master.gain.setValueAtTime(m, this.ctx.currentTime);
    this.sfx.gain.setValueAtTime(s, this.ctx.currentTime);
    this.music.gain.setValueAtTime(mu, this.ctx.currentTime);
  }
  ensure() { if (!this.ctx) this.init(); if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  private t(freq: number, type: OscillatorType, dur: number, vol: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq * (0.97 + Math.random() * 0.06);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.sfx); o.start(); o.stop(this.ctx.currentTime + dur);
  }
  roll() { for (let i = 0; i < 5; i++) setTimeout(() => this.t(200 + Math.random() * 300, 'triangle', 0.06, 0.15), i * 30); this.t(150, 'sine', 0.2, 0.1); }
  diceHit() { this.t(300 + Math.random() * 200, 'triangle', 0.04, 0.1); }
  keep() { this.t(660, 'sine', 0.1, 0.2); this.t(880, 'sine', 0.08, 0.12); }
  unkeep() { this.t(440, 'triangle', 0.08, 0.15); }
  score(pts: number) { const b = pts > 30 ? 880 : pts > 15 ? 660 : 440; this.t(b, 'sine', 0.2, 0.25); setTimeout(() => this.t(b * 1.25, 'triangle', 0.15, 0.15), 80); }
  yahtzee() { [660,880,1100,1320,1540,1760].forEach((f,i) => setTimeout(() => this.t(f, 'sine', 0.3, 0.25), i * 80)); }
  farkle() { this.t(220, 'sawtooth', 0.4, 0.25); setTimeout(() => this.t(165, 'square', 0.3, 0.2), 100); }
  gameOver() { [880,770,660,550,440].forEach((f,i) => setTimeout(() => this.t(f, 'triangle', 0.3, 0.2), i * 120)); }
  victory() { [440,550,660,880,1100,1320].forEach((f,i) => setTimeout(() => this.t(f, 'sine', 0.25, 0.25), i * 80)); }
  click() { this.t(1000, 'sine', 0.04, 0.12); }
  achievement() { [880,1100,1320,1540,1760].forEach((f,i) => setTimeout(() => this.t(f, 'sine', 0.2, 0.2), i * 60)); }
  levelUp() { [440,550,660,770,880,1100].forEach((f,i) => setTimeout(() => this.t(f, 'triangle', 0.25, 0.2), i * 50)); }
  bank() { this.t(660, 'sine', 0.15, 0.2); this.t(880, 'triangle', 0.12, 0.15); }
  startDrone() {
    if (!this.ctx) return;
    [55, 82.5, 110].forEach(f => {
      const o = this.ctx!.createOscillator(), g = this.ctx!.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.03;
      o.connect(g); g.connect(this.music); o.start();
    });
  }
}
const audio = new Audio();

// ============================================================
// SCORING
// ============================================================
function countD(dice: number[]): number[] { const c = [0,0,0,0,0,0,0]; for (const d of dice) c[d]++; return c; }
function calcScore(cat: Cat, dice: number[]): number {
  const counts = countD(dice), sum = dice.reduce((a,b) => a + b, 0), face = CFACE[cat];
  if (face) return counts[face] * face;
  const mx = Math.max(...counts.slice(1));
  switch (cat) {
    case 'three-kind': return mx >= 3 ? sum : 0;
    case 'four-kind': return mx >= 4 ? sum : 0;
    case 'full-house': return counts.slice(1).includes(3) && counts.slice(1).includes(2) ? 25 : 0;
    case 'sm-straight': { const u = [...new Set([...dice].sort())].join(''); return u.includes('1234')||u.includes('2345')||u.includes('3456') ? 30 : 0; }
    case 'lg-straight': { const u = [...new Set([...dice].sort())].join(''); return u==='12345'||u==='23456' ? 40 : 0; }
    case 'yahtzee': return mx === 5 ? 50 : 0;
    case 'chance': return sum;
    default: return 0;
  }
}
function scoreFarkle(dice: number[]): { pts: number; used: number } {
  const counts = countD(dice);
  if (dice.length === 6 && counts.slice(1).every(c => c === 1)) return { pts: 1500, used: 6 };
  if (dice.length === 6 && counts.slice(1).filter(c => c === 2).length === 3) return { pts: 1500, used: 6 };
  let pts = 0, used = 0;
  for (let f = 1; f <= 6; f++) {
    if (counts[f] >= 3) { const base = f === 1 ? 1000 : f * 100; const n = counts[f]; const mult = n === 4 ? 2 : n === 5 ? 4 : n === 6 ? 8 : 1; pts += base * mult; used += n; counts[f] = 0; }
  }
  pts += counts[1] * 100; used += counts[1]; pts += counts[5] * 50; used += counts[5];
  return { pts, used };
}
function hasFarkle(dice: number[]): boolean { return scoreFarkle(dice).pts > 0; }

// ============================================================
// AI
// ============================================================
type AIDiff = 'easy'|'medium'|'hard';
function aiPick(dice: number[], scored: Map<Cat, number>, diff: AIDiff): Cat {
  const avail = ALL_CATS.filter(c => !scored.has(c));
  if (!avail.length) return 'chance';
  if (diff === 'easy') return avail[Math.floor(Math.random() * avail.length)];
  let best = avail[0], bv = -1;
  for (const c of avail) { let v = calcScore(c, dice); if (diff === 'hard') { if (c === 'yahtzee' && v === 0) v = -5; if (c === 'lg-straight' && v === 0) v = -3; if (UPPER.includes(c) && v >= (CFACE[c] || 0) * 3) v += 5; } if (v > bv) { bv = v; best = c; } }
  return best;
}
function aiKeep(dice: number[]): boolean[] {
  const counts = countD(dice), keep = [false,false,false,false,false];
  const mxF = counts.indexOf(Math.max(...counts.slice(1)), 1);
  if (Math.max(...counts.slice(1)) >= 2) { for (let i = 0; i < 5; i++) if (dice[i] === mxF) keep[i] = true; return keep; }
  for (let i = 0; i < 5; i++) if (dice[i] >= 4) keep[i] = true;
  return keep;
}

// ============================================================
// SEEDED RNG
// ============================================================
function seededRng(seed: number): () => number { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function dailySeed(): number { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate(); }

// ============================================================
// 3D DICE
// ============================================================
const DS = 0.12, DG = 0.18, DY = 1.1, DZ = -1.6;
const PIPS: Record<number, [number,number][]> = {
  1: [[0,0]], 2: [[-0.3,0.3],[0.3,-0.3]], 3: [[-0.3,0.3],[0,0],[0.3,-0.3]],
  4: [[-0.3,0.3],[0.3,0.3],[-0.3,-0.3],[0.3,-0.3]],
  5: [[-0.3,0.3],[0.3,0.3],[0,0],[-0.3,-0.3],[0.3,-0.3]],
  6: [[-0.3,0.3],[0.3,0.3],[-0.3,0],[0.3,0],[-0.3,-0.3],[0.3,-0.3]],
};

class DiceMgr {
  groups: Group[] = []; bodies: Mesh[] = []; edges: LineSegments[] = [];
  pipGrps: Group[] = []; values = [1,2,3,4,5,6]; kept = [false,false,false,false,false,false];
  rolling = [false,false,false,false,false,false]; rollT = [0,0,0,0,0,0];
  targetV = [1,2,3,4,5,6]; count = 5; lights: PointLight[] = [];
  constructor(private scene: Object3D) {}
  create(si: number) {
    const sk = SKINS[si] || SKINS[0];
    const geom = new BoxGeometry(DS, DS, DS), eGeom = new EdgesGeometry(geom);
    for (let i = 0; i < 6; i++) {
      const g = new Group();
      const mat = new MeshStandardMaterial({ color: new Color(sk.body), emissive: new Color(sk.body), emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.85 });
      const body = new Mesh(geom, mat); g.add(body); this.bodies.push(body);
      const edge = new LineSegments(eGeom, new LineBasicMaterial({ color: new Color(sk.edge), transparent: true, opacity: 0.8 })); g.add(edge); this.edges.push(edge);
      const pg = new Group(); g.add(pg); this.pipGrps.push(pg);
      const li = new PointLight(new Color(sk.pip), 0.3, 0.5); li.position.set(0, DS * 0.8, 0); g.add(li); this.lights.push(li);
      g.position.set((i - (this.count - 1) / 2) * DG, DY, DZ);
      g.visible = i < this.count; this.scene.add(g); this.groups.push(g);
      this.updatePips(i, this.values[i], sk);
    }
  }
  updatePips(idx: number, val: number, sk?: Skin) {
    const s = sk || SKINS[save.skinIdx] || SKINS[0];
    const pg = this.pipGrps[idx]; while (pg.children.length) pg.remove(pg.children[0]);
    const pG = new SphereGeometry(DS * 0.09, 8, 8), pM = new MeshBasicMaterial({ color: new Color(s.pip) });
    for (const [px, py] of (PIPS[val] || PIPS[1])) { const p = new Mesh(pG, pM); p.position.set(px * DS * 0.35, DS * 0.51, py * DS * 0.35); pg.add(p); }
  }
  setCount(n: number) { this.count = n; for (let i = 0; i < 6; i++) { this.groups[i].visible = i < n; this.groups[i].position.x = (i - (n - 1) / 2) * DG; } }
  rollAll(seed?: number) {
    const rng = seed !== undefined ? seededRng(seed) : Math.random;
    for (let i = 0; i < this.count; i++) { if (!this.kept[i]) { this.targetV[i] = Math.floor(rng() * 6) + 1; this.rolling[i] = true; this.rollT[i] = 0.4 + Math.random() * 0.3; } }
    audio.roll();
  }
  isRolling(): boolean { return this.rolling.some((r, i) => r && i < this.count); }
  update(dt: number) {
    for (let i = 0; i < this.count; i++) {
      if (this.rolling[i]) {
        this.rollT[i] -= dt; const g = this.groups[i];
        g.rotation.x += dt * (15 + Math.random() * 10); g.rotation.z += dt * (10 + Math.random() * 8);
        g.position.y = DY + Math.sin(this.rollT[i] * 20) * 0.03;
        if (this.rollT[i] <= 0) { this.rolling[i] = false; this.values[i] = this.targetV[i]; g.rotation.set(0,0,0); g.position.y = DY; this.updatePips(i, this.values[i]); audio.diceHit(); }
      }
      if (this.kept[i]) { this.lights[i].intensity = 0.8 + Math.sin(Date.now() * 0.005) * 0.2; (this.edges[i].material as LineBasicMaterial).color.set(THEMES[save.themeIdx]?.kept || '#00ff88'); }
      else { this.lights[i].intensity = 0.3; (this.edges[i].material as LineBasicMaterial).color.set((SKINS[save.skinIdx] || SKINS[0]).edge); }
    }
  }
  clearKeeps() { for (let i = 0; i < 6; i++) this.kept[i] = false; }
  toggleKeep(i: number) { if (i < 0 || i >= this.count) return; this.kept[i] = !this.kept[i]; this.kept[i] ? audio.keep() : audio.unkeep(); }
  getDice(n?: number): number[] { return this.values.slice(0, n || this.count); }
  applySkin(idx: number) {
    const sk = SKINS[idx] || SKINS[0];
    for (let i = 0; i < 6; i++) {
      (this.bodies[i].material as MeshStandardMaterial).color.set(sk.body);
      (this.bodies[i].material as MeshStandardMaterial).emissive.set(sk.body);
      (this.edges[i].material as LineBasicMaterial).color.set(sk.edge);
      this.lights[i].color.set(sk.pip); this.updatePips(i, this.values[i], sk);
    }
  }
}

// ============================================================
// GAME MANAGER
// ============================================================
class Game {
  screen: Screen = 'title'; mode: Mode = 'solo'; aiDiff: AIDiff = 'medium';
  turn = 0; rollsLeft = 3; scored = new Map<Cat, number>();
  yzCount = 0; upperT = 0; lowerT = 0; totalScore = 0;
  gameStart = 0; turnTimer = 20; timerActive = false;
  aiScored = new Map<Cat, number>(); aiTotal = 0;
  fScore = 0; fTurn = 0; fTarget = 10000; fDL = 6;
  fSel = [false,false,false,false,false,false]; fDone = false;
  mG = 0; mS: number[] = []; mAS: number[] = [];
  cdTimer = 3; pendMode: Mode = 'solo';
  toastQ: string[] = []; toastT = 0; achPage = 0;
  trText = ''; trT = 0;
  dice!: DiceMgr;
  setDice(d: DiceMgr) { this.dice = d; }

  startGame(mode: Mode) {
    this.mode = mode; save.modesPlayed.add(mode);
    this.turn = 1; this.rollsLeft = 3; this.scored.clear();
    this.yzCount = 0; this.upperT = 0; this.lowerT = 0;
    this.totalScore = 0; this.gameStart = Date.now();
    this.dice.clearKeeps(); this.trText = ''; this.trT = 0;
    if (mode === 'farkle') { this.dice.setCount(6); this.fScore = 0; this.fTurn = 0; this.fDL = 6; this.fSel = [false,false,false,false,false,false]; this.fDone = false; }
    else this.dice.setCount(5);
    if (mode === 'vsai' || mode === 'marathon') { this.aiScored.clear(); this.aiTotal = 0; }
    if (mode === 'marathon') { this.mG = 0; this.mS = []; this.mAS = []; }
    if (mode === 'speed') { this.turnTimer = 20; this.timerActive = false; }
    this.screen = 'playing';
  }

  rollDice() {
    if (this.dice.isRolling()) return;
    if (this.mode === 'farkle') { this.rollFarkle(); return; }
    if (this.mode !== 'zen' && this.mode !== 'practice' && this.rollsLeft <= 0) return;
    if (this.mode !== 'zen' && this.mode !== 'practice') this.rollsLeft--;
    const seed = this.mode === 'daily' ? dailySeed() + this.turn * 100 + (3 - this.rollsLeft) : undefined;
    this.dice.rollAll(seed); save.totalRolls++;
    if (this.mode === 'speed') { this.turnTimer = 20; this.timerActive = true; }
  }

  scoreCat(cat: Cat) {
    if (this.scored.has(cat) || this.rollsLeft === 3 || this.dice.isRolling()) return;
    const dice = this.dice.getDice(5);
    let pts = calcScore(cat, dice);
    if (cat === 'yahtzee' && pts === 50) { this.yzCount++; save.totalYahtzees++; save.bestYzGame = Math.max(save.bestYzGame, this.yzCount); audio.yahtzee(); }
    else if (calcScore('yahtzee', dice) === 50 && this.scored.has('yahtzee') && (this.scored.get('yahtzee') || 0) > 0) { this.yzCount++; this.totalScore += 100; save.totalYahtzees++; audio.yahtzee(); this.toastQ.push('Yahtzee Bonus! +100'); }
    if (pts === 0) save.zerosTaken++;
    if (cat === 'full-house' && pts > 0) save.fullHouses++;
    if (cat === 'lg-straight' && pts > 0) save.lgStraights++;
    if (cat === 'sm-straight' && pts > 0) save.smStraights++;
    if (cat === 'chance') save.bestChance = Math.max(save.bestChance, pts);
    this.scored.set(cat, pts); this.totalScore += pts; audio.score(pts);
    this.trText = `${CLBL[cat]}: +${pts}`; this.trT = 2;
    this.upperT = UPPER.reduce((s,c) => s + (this.scored.get(c) || 0), 0);
    this.lowerT = LOWER.reduce((s,c) => s + (this.scored.get(c) || 0), 0);
    if (UPPER.every(c => this.scored.has(c)) && this.upperT >= 63) { this.totalScore += 35; save.upperBonuses++; if (UPPER.every(c => (this.scored.get(c) || 0) > 0)) save.perfectUppers++; this.toastQ.push('Upper Bonus! +35'); }
    this.nextTurn();
  }

  nextTurn() {
    if (this.mode === 'speed') this.timerActive = false;
    if (this.scored.size >= 13) {
      if (this.mode === 'vsai' || this.mode === 'marathon') this.runAi();
      if (this.mode === 'marathon') { this.mS.push(this.totalScore); this.mAS.push(this.aiTotal); this.mG++; if (this.mG < 3) { this.turn = 1; this.rollsLeft = 3; this.scored.clear(); this.yzCount = 0; this.totalScore = 0; this.dice.clearKeeps(); this.aiScored.clear(); this.aiTotal = 0; return; } }
      this.endGame(); return;
    }
    this.turn++; this.rollsLeft = (this.mode === 'zen' || this.mode === 'practice') ? 99 : 3;
    this.dice.clearKeeps(); if (this.mode === 'speed') this.turnTimer = 20;
  }

  runAi() {
    this.aiScored.clear(); this.aiTotal = 0;
    for (let t = 0; t < 13; t++) {
      let d = [0,0,0,0,0].map(() => Math.floor(Math.random() * 6) + 1);
      for (let r = 0; r < 2; r++) { const k = aiKeep(d); d = d.map((v, i) => k[i] ? v : Math.floor(Math.random() * 6) + 1); }
      const c = aiPick(d, this.aiScored, this.aiDiff); const p = calcScore(c, d); this.aiScored.set(c, p); this.aiTotal += p;
    }
    const aiUp = UPPER.reduce((s,c) => s + (this.aiScored.get(c) || 0), 0);
    if (aiUp >= 63) this.aiTotal += 35;
  }

  endGame() {
    const el = (Date.now() - this.gameStart) / 1000;
    save.totalGames++; save.totalScore += this.totalScore;
    save.bestScore = Math.max(save.bestScore, this.totalScore); save.playTime += el;
    save.xp += Math.floor(this.totalScore / 5) + 10;
    const old = save.level; save.level = Math.floor(save.xp / 100) + 1;
    if (save.level > old) { this.toastQ.push(`Level Up! ${save.level}`); audio.levelUp(); }
    if (this.mode === 'vsai' && this.totalScore > this.aiTotal) { save.aiWins++; if (this.aiDiff === 'hard') save.aiHardWins++; }
    if (this.mode === 'speed') save.speedGames++;
    if (this.mode === 'daily') { save.dailyGames++; const today = new Date().toISOString().slice(0,10); if (!save.lastDaily) save.dailyStreak = 1; else { const diff = (new Date(today).getTime() - new Date(save.lastDaily).getTime()) / 86400000; save.dailyStreak = diff <= 1 ? save.dailyStreak + 1 : 1; } save.lastDaily = today; }
    if (this.mode === 'marathon') { const pw = this.mS.filter((s,i) => s > this.mAS[i]).length; if (pw >= 2) save.marathonWins++; }
    save.leaderboard.push({ score: this.totalScore, mode: this.mode, date: new Date().toISOString().slice(0,10) });
    save.leaderboard.sort((a,b) => b.score - a.score); if (save.leaderboard.length > 10) save.leaderboard = save.leaderboard.slice(0,10);
    this.checkAch(); saveSave(save); this.screen = 'gameover';
    (this.mode === 'vsai' && this.totalScore > this.aiTotal) ? audio.victory() : audio.gameOver();
  }

  rollFarkle() { if (this.dice.isRolling() || this.fDone) return; this.fSel = [false,false,false,false,false,false]; this.dice.clearKeeps(); this.dice.rollAll(); save.totalRolls++; }
  checkFarkleRoll() { if (!hasFarkle(this.dice.getDice(this.fDL))) { this.fTurn = 0; this.fDone = true; audio.farkle(); this.trText = 'FARKLE!'; this.trT = 2; } }
  farkleSelect(i: number) { if (i >= this.fDL || this.fDone) return; this.fSel[i] = !this.fSel[i]; this.dice.kept[i] = this.fSel[i]; this.fSel[i] ? audio.keep() : audio.unkeep(); }
  farkleBank() {
    this.fScore += this.fTurn; save.farkleBestBank = Math.max(save.farkleBestBank, this.fTurn); audio.bank();
    if (this.fScore >= this.fTarget) { save.farkleWins++; this.totalScore = this.fScore; this.endGame(); return; }
    this.fTurn = 0; this.fDL = 6; this.fSel = [false,false,false,false,false,false]; this.dice.clearKeeps(); this.dice.setCount(6); this.fDone = false;
  }
  farkleConfirm() {
    const sel = this.dice.getDice(this.fDL).filter((_, i) => this.fSel[i]);
    if (!sel.length) return; const { pts, used } = scoreFarkle(sel); if (pts === 0) return;
    this.fTurn += pts; audio.score(pts); this.trText = `+${pts}`; this.trT = 1.5;
    this.fDL -= used; if (this.fDL <= 0) { this.fDL = 6; this.toastQ.push('Hot Dice!'); }
    this.fSel = [false,false,false,false,false,false]; this.dice.clearKeeps(); this.dice.setCount(this.fDL);
  }
  checkAch() { for (const a of ACHS) if (!save.achievements.has(a.id) && a.chk(save)) { save.achievements.add(a.id); this.toastQ.push(a.name); audio.achievement(); } }
  getRating(): string { return this.totalScore >= 350 ? 'S' : this.totalScore >= 300 ? 'A' : this.totalScore >= 250 ? 'B' : this.totalScore >= 200 ? 'C' : this.totalScore >= 150 ? 'D' : 'F'; }
  update(dt: number) {
    if (this.trT > 0) this.trT -= dt; if (this.toastT > 0) this.toastT -= dt;
    if (this.mode === 'speed' && this.screen === 'playing' && this.timerActive) { this.turnTimer -= dt; if (this.turnTimer <= 0) { const av = ALL_CATS.filter(c => !this.scored.has(c)); if (av.length) { let w = av[0], wv = Infinity; for (const c of av) { const v = calcScore(c, this.dice.getDice(5)); if (v < wv) { wv = v; w = c; } } this.scoreCat(w); } } }
    if (this.screen === 'countdown') { this.cdTimer -= dt; if (this.cdTimer <= 0) this.startGame(this.pendMode); }
  }
}
const game = new Game();

// ============================================================
// PANEL MANAGER
// ============================================================
class Panels {
  docs = new Map<string, UIKitDocument>();
  pendF = false; fDelay = 0;
  panelPos = new Map<string, { entity: any; pos: number[]; scr: Screen[] }>();
  setDoc(n: string, d: UIKitDocument) { this.docs.set(n, d); }
  el(p: string, id: string) { return this.docs.get(p)?.getElementById(id) as UIKit.Text | undefined; }
  st(p: string, id: string, t: string) { this.el(p, id)?.setProperties({ text: t }); }
  oc(p: string, id: string, fn: () => void) { this.el(p, id)?.addEventListener('click', fn); }

  wireTitle() {
    this.st('title', 'level-display', `Level ${save.level} - ${save.level < 5 ? 'Novice' : save.level < 10 ? 'Apprentice' : save.level < 25 ? 'Adept' : 'Expert'}`);
    this.oc('title', 'btn-play', () => { audio.click(); game.screen = 'modeselect'; this.vis(); });
    this.oc('title', 'btn-scores', () => { audio.click(); game.screen = 'leaderboard'; this.updLB(); this.vis(); });
    this.oc('title', 'btn-achievements', () => { audio.click(); game.achPage = 0; game.screen = 'achievements'; this.updAch(); this.vis(); });
    this.oc('title', 'btn-stats', () => { audio.click(); game.screen = 'stats'; this.updStats(); this.vis(); });
    this.oc('title', 'btn-skins', () => { audio.click(); game.screen = 'skins'; this.updSkins(); this.vis(); });
    this.oc('title', 'btn-settings', () => { audio.click(); game.screen = 'settings'; this.vis(); });
    this.oc('title', 'btn-help', () => { audio.click(); game.screen = 'help'; this.vis(); });
  }
  wireMode() {
    const ms: [string, Mode][] = [['btn-solo','solo'],['btn-vsai','vsai'],['btn-speed','speed'],['btn-farkle','farkle'],['btn-daily','daily'],['btn-marathon','marathon'],['btn-zen','zen'],['btn-practice','practice']];
    for (const [b, m] of ms) this.oc('mode', b, () => { audio.click(); if (m === 'vsai') { game.pendMode = m; game.screen = 'difficulty'; this.vis(); } else if (m === 'speed') { game.pendMode = m; game.cdTimer = 3; game.screen = 'countdown'; this.vis(); } else { game.startGame(m); this.vis(); this.updHUD(); } });
    this.oc('mode', 'btn-back', () => { audio.click(); game.screen = 'title'; this.vis(); });
  }
  wireDiff() {
    this.oc('difficulty', 'btn-easy', () => { audio.click(); game.aiDiff = 'easy'; game.startGame(game.pendMode); this.vis(); this.updHUD(); });
    this.oc('difficulty', 'btn-medium', () => { audio.click(); game.aiDiff = 'medium'; game.startGame(game.pendMode); this.vis(); this.updHUD(); });
    this.oc('difficulty', 'btn-hard', () => { audio.click(); game.aiDiff = 'hard'; game.startGame(game.pendMode); this.vis(); this.updHUD(); });
    this.oc('difficulty', 'btn-back', () => { audio.click(); game.screen = 'modeselect'; this.vis(); });
  }
  wireSC() {
    const cm: [string, Cat][] = [['cat-ones','ones'],['cat-twos','twos'],['cat-threes','threes'],['cat-fours','fours'],['cat-fives','fives'],['cat-sixes','sixes'],['cat-three-kind','three-kind'],['cat-four-kind','four-kind'],['cat-full-house','full-house'],['cat-sm-straight','sm-straight'],['cat-lg-straight','lg-straight'],['cat-yahtzee','yahtzee'],['cat-chance','chance']];
    for (const [id, cat] of cm) this.oc('scorecard', id, () => { if (game.screen !== 'playing' || game.mode === 'farkle' || game.mode === 'practice') return; audio.click(); game.scoreCat(cat); this.updSC(); this.updHUD(); });
  }
  wirePause() { this.oc('pause', 'btn-resume', () => { audio.click(); game.screen = 'playing'; this.vis(); }); this.oc('pause', 'btn-quit', () => { audio.click(); game.screen = 'title'; this.vis(); }); }
  wireGO() { this.oc('gameover', 'btn-rematch', () => { audio.click(); game.startGame(game.mode); this.vis(); this.updHUD(); this.updSC(); }); this.oc('gameover', 'btn-menu', () => { audio.click(); game.screen = 'title'; this.vis(); }); }
  wireSettings() {
    const vs = 0.1;
    this.oc('settings', 'btn-master-up', () => { save.masterVol = Math.min(1, save.masterVol + vs); audio.setVol(save.masterVol, save.sfxVol, save.musicVol); this.updSett(); saveSave(save); });
    this.oc('settings', 'btn-master-down', () => { save.masterVol = Math.max(0, save.masterVol - vs); audio.setVol(save.masterVol, save.sfxVol, save.musicVol); this.updSett(); saveSave(save); });
    this.oc('settings', 'btn-sfx-up', () => { save.sfxVol = Math.min(1, save.sfxVol + vs); audio.setVol(save.masterVol, save.sfxVol, save.musicVol); this.updSett(); saveSave(save); });
    this.oc('settings', 'btn-sfx-down', () => { save.sfxVol = Math.max(0, save.sfxVol - vs); audio.setVol(save.masterVol, save.sfxVol, save.musicVol); this.updSett(); saveSave(save); });
    this.oc('settings', 'btn-music-up', () => { save.musicVol = Math.min(1, save.musicVol + vs); audio.setVol(save.masterVol, save.sfxVol, save.musicVol); this.updSett(); saveSave(save); });
    this.oc('settings', 'btn-music-down', () => { save.musicVol = Math.max(0, save.musicVol - vs); audio.setVol(save.masterVol, save.sfxVol, save.musicVol); this.updSett(); saveSave(save); });
    this.oc('settings', 'btn-theme-next', () => { save.themeIdx = (save.themeIdx + 1) % THEMES.length; this.updSett(); saveSave(save); });
    this.oc('settings', 'btn-theme-prev', () => { save.themeIdx = (save.themeIdx - 1 + THEMES.length) % THEMES.length; this.updSett(); saveSave(save); });
    this.oc('settings', 'btn-back', () => { audio.click(); game.screen = 'title'; this.vis(); });
  }
  updSett() { this.st('settings', 'master-vol', `${Math.round(save.masterVol * 100)}%`); this.st('settings', 'sfx-vol', `${Math.round(save.sfxVol * 100)}%`); this.st('settings', 'music-vol', `${Math.round(save.musicVol * 100)}%`); this.st('settings', 'theme-name', THEMES[save.themeIdx]?.name || 'Neon Holodeck'); }
  wireAch() {
    this.oc('achievements', 'btn-prev', () => { if (game.achPage > 0) { game.achPage--; this.updAch(); } });
    this.oc('achievements', 'btn-next', () => { if (game.achPage < Math.ceil(ACHS.length / 15) - 1) { game.achPage++; this.updAch(); } });
    this.oc('achievements', 'btn-back', () => { audio.click(); game.screen = 'title'; this.vis(); });
  }
  updAch() {
    const pp = 15, s = game.achPage * pp;
    this.st('achievements', 'ach-count', `${ACHS.filter(a => save.achievements.has(a.id)).length}/${ACHS.length} Unlocked`);
    this.st('achievements', 'page-display', `${game.achPage + 1}/${Math.ceil(ACHS.length / pp)}`);
    for (let i = 0; i < pp; i++) { const a = ACHS[s + i]; if (a) { const d = save.achievements.has(a.id); this.st('achievements', `ach-${i+1}`, `${d?'[*]':'[ ]'} ${a.name} - ${a.desc}`); this.el('achievements', `ach-${i+1}`)?.setProperties({ color: d ? '#ffaa00' : '#666666' }); } else this.st('achievements', `ach-${i+1}`, '-'); }
  }
  wireStats() { this.oc('stats', 'btn-back', () => { audio.click(); game.screen = 'title'; this.vis(); }); }
  updStats() {
    this.st('stats', 'stat-1', `Games Played: ${save.totalGames}`); this.st('stats', 'stat-2', `Best Score: ${save.bestScore}`);
    this.st('stats', 'stat-3', `Average Score: ${save.totalGames ? Math.round(save.totalScore / save.totalGames) : 0}`);
    this.st('stats', 'stat-4', `Total Yahtzees: ${save.totalYahtzees}`); this.st('stats', 'stat-5', `Best Yahtzees (game): ${save.bestYzGame}`);
    this.st('stats', 'stat-6', `Upper Bonuses: ${save.upperBonuses}`); this.st('stats', 'stat-7', `Total Rolls: ${save.totalRolls}`);
    this.st('stats', 'stat-8', `Win Rate vs AI: ${save.aiWins > 0 ? Math.round(save.aiWins / Math.max(1, save.totalGames) * 100) : 0}%`);
    this.st('stats', 'stat-9', `Daily Streak: ${save.dailyStreak}`); this.st('stats', 'stat-10', `Play Time: ${Math.round(save.playTime / 60)}m`);
  }
  wireSkins() { for (let i = 0; i < 8; i++) this.oc('skins', `skin-${i+1}`, () => { audio.click(); if (SKINS[i].req(save)) { save.skinIdx = i; game.dice.applySkin(i); this.updSkins(); saveSave(save); } }); this.oc('skins', 'btn-back', () => { audio.click(); game.screen = 'title'; this.vis(); }); }
  updSkins() { for (let i = 0; i < 8; i++) { const sk = SKINS[i], ul = sk.req(save), sel = save.skinIdx === i; this.st('skins', `skin-${i+1}`, `${sel?'[*]':ul?'[ ]':'[X]'} ${ul?sk.name:`${sk.name} (${sk.unlock})`}`); this.el('skins', `skin-${i+1}`)?.setProperties({ color: ul ? sk.pip : '#444444', borderColor: sel ? sk.pip : '#333333' }); } }
  wireLB() { this.oc('leaderboard', 'btn-back', () => { audio.click(); game.screen = 'title'; this.vis(); }); }
  updLB() { for (let i = 0; i < 10; i++) { const e = save.leaderboard[i]; this.st('leaderboard', `lb-${i+1}`, e ? `${i+1}. ${e.score} (${e.mode}) ${e.date}` : `${i+1}. ---`); } }
  wireHelp() { this.oc('help', 'btn-back', () => { audio.click(); game.screen = 'title'; this.vis(); }); }
  wireFarkle() {
    this.oc('farkle-hud', 'btn-bank', () => { if (game.mode !== 'farkle' || game.screen !== 'playing') return; audio.click(); game.farkleBank(); this.updFH(); });
    this.oc('farkle-hud', 'btn-farkle-roll', () => { if (game.mode !== 'farkle' || game.screen !== 'playing') return; game.farkleConfirm(); this.updFH(); game.rollFarkle(); this.pendF = true; this.fDelay = 1.0; });
  }
  updFH() { this.st('farkle-hud', 'banked-score', `${game.fScore}`); this.st('farkle-hud', 'turn-score', `${game.fTurn}`); this.st('farkle-hud', 'target-score', `${game.fTarget}`); this.st('farkle-hud', 'dice-left', `${game.fDL}`); }
  updHUD() {
    this.st('hud', 'turn-display', `${game.turn}/13`);
    this.st('hud', 'rolls-display', `${(game.mode === 'zen' || game.mode === 'practice') ? 'INF' : game.rollsLeft}`);
    this.st('hud', 'score-display', `${game.totalScore}`); this.st('hud', 'mode-display', game.mode.toUpperCase());
    this.st('hud', 'timer-display', game.mode === 'speed' ? `${Math.ceil(game.turnTimer)}` : '--');
    this.st('hud', 'ai-score-display', (game.mode === 'vsai' || game.mode === 'marathon') ? `${game.aiTotal}` : '-');
  }
  updSC() {
    const dice = game.dice.getDice(5);
    const cats: [string, Cat][] = [['cat-ones','ones'],['cat-twos','twos'],['cat-threes','threes'],['cat-fours','fours'],['cat-fives','fives'],['cat-sixes','sixes'],['cat-three-kind','three-kind'],['cat-four-kind','four-kind'],['cat-full-house','full-house'],['cat-sm-straight','sm-straight'],['cat-lg-straight','lg-straight'],['cat-yahtzee','yahtzee'],['cat-chance','chance']];
    for (const [id, cat] of cats) {
      if (game.scored.has(cat)) { const pts = game.scored.get(cat)!; this.st('scorecard', id, `${CLBL[cat]}: ${pts}`); this.el('scorecard', id)?.setProperties({ color: pts > 0 ? '#ffffff' : '#666666' }); }
      else { const pv = game.rollsLeft < 3 ? calcScore(cat, dice) : 0; this.st('scorecard', id, `${CLBL[cat]}: -${game.rollsLeft < 3 ? ` (${pv})` : ''}`); this.el('scorecard', id)?.setProperties({ color: UPPER.includes(cat) ? '#44ff44' : '#ff00ff' }); }
    }
    this.st('scorecard', 'upper-bonus', `Bonus: ${UPPER.reduce((s,c) => s + (game.scored.get(c) || 0), 0)}/63`);
    this.st('scorecard', 'yahtzee-bonus', `Yahtzee Bonus: ${Math.max(0, game.yzCount - 1) * 100}`);
    this.st('scorecard', 'total-score', `TOTAL: ${game.totalScore}`);
  }
  updGO() {
    const won = game.mode === 'vsai' && game.totalScore > game.aiTotal;
    this.st('gameover', 'result-title', game.mode === 'vsai' ? (won ? 'YOU WIN!' : 'AI WINS') : 'GAME OVER');
    this.st('gameover', 'result-mode', game.mode.toUpperCase()); this.st('gameover', 'result-score', `${game.totalScore}`);
    this.st('gameover', 'result-upper', `Upper: ${game.upperT} | Bonus: ${game.upperT >= 63 ? 'Yes' : 'No'}`);
    this.st('gameover', 'result-lower', `Lower: ${game.lowerT}`); this.st('gameover', 'result-yahtzees', `Yahtzees: ${game.yzCount}`);
    this.st('gameover', 'result-best', `Best: ${save.bestScore}`); this.st('gameover', 'result-rating', `Rating: ${game.getRating()}`);
  }
  updTR() { if (game.trT > 0) { const p = game.trText.split(':'); this.st('turnresult', 'result-cat', p[0] || ''); this.st('turnresult', 'result-pts', p[1]?.trim() || game.trText); } }
  updCD() { const n = Math.ceil(game.cdTimer); this.st('countdown', 'count-text', n > 0 ? `${n}` : 'GO!'); }
  updToast() { if (game.toastT <= 0 && game.toastQ.length > 0) { this.st('toast', 'toast-text', game.toastQ.shift()!); game.toastT = 2; } }
  vis() {
    this.panelPos.forEach((cfg) => { const v = cfg.scr.includes(game.screen); if (cfg.entity?.object3D) { if (v) cfg.entity.object3D.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]); else cfg.entity.object3D.position.set(0, -100, 0); } });
    if (game.screen === 'gameover') this.updGO();
    if (game.screen === 'settings') this.updSett();
    if (game.screen === 'playing') { this.updHUD(); this.updSC(); if (game.mode === 'farkle') this.updFH(); }
  }
  updFChk(dt: number) { if (this.pendF) { this.fDelay -= dt; if (this.fDelay <= 0 && !game.dice.isRolling()) { this.pendF = false; game.checkFarkleRoll(); this.updFH(); } } }
}
const panels = new Panels();

// ============================================================
// GAME SYSTEM
// ============================================================
export class GameSystem extends createSystem({ panelDocs: { required: [PanelDocument] } }) {
  private dm!: DiceMgr; private wired = new Set<string>(); private lastR = false;
  init() {
    this.dm = new DiceMgr(this.scene); this.dm.create(save.skinIdx); game.setDice(this.dm);
    this.queries.panelDocs.subscribe('qualify', (entity) => {
      const doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
      if (!doc) return;
      const cfg = entity.getValue(PanelUI, 'config') as string | undefined;
      if (!cfg) return;
      const n = cfg.replace('./ui/', '').replace('.json', '');
      if (this.wired.has(n)) return; this.wired.add(n); panels.setDoc(n, doc);
      switch (n) {
        case 'title': panels.wireTitle(); break; case 'mode': panels.wireMode(); break;
        case 'difficulty': panels.wireDiff(); break; case 'scorecard': panels.wireSC(); break;
        case 'pause': panels.wirePause(); break; case 'gameover': panels.wireGO(); break;
        case 'settings': panels.wireSettings(); panels.updSett(); break;
        case 'achievements': panels.wireAch(); break; case 'stats': panels.wireStats(); break;
        case 'skins': panels.wireSkins(); break; case 'leaderboard': panels.wireLB(); break;
        case 'help': panels.wireHelp(); break; case 'farkle-hud': panels.wireFarkle(); break;
      }
      panels.vis();
    });
    this.buildEnv();
  }
  update(dt: number, _t: number) {
    this.dm.update(dt);
    const r = this.dm.isRolling();
    if (this.lastR && !r && game.screen === 'playing' && game.mode !== 'farkle') { panels.updSC(); panels.updHUD(); }
    this.lastR = r; game.update(dt); panels.updFChk(dt); panels.updToast(); panels.updTR();
    if (game.screen === 'countdown') panels.updCD();
    if (game.mode === 'speed' && game.screen === 'playing') panels.updHUD();
    this.handleInput();
  }
  handleInput() {
    const inp = (this.world as any).input as RuntimeInput | undefined;
    const kb = inp?.keyboard, rGp = inp?.gamepads?.right;
    if (game.screen === 'paused') { if (kb?.getKeyDown('Escape') || kb?.getKeyDown('KeyP') || rGp?.getButtonDown(InputComponent.B_Button)) { audio.click(); game.screen = 'playing'; panels.vis(); } return; }
    if (game.screen !== 'playing') return;
    if (kb?.getKeyDown('Escape') || kb?.getKeyDown('KeyP') || rGp?.getButtonDown(InputComponent.B_Button)) { audio.click(); game.screen = 'paused'; panels.vis(); return; }
    if (kb?.getKeyDown('Space') || rGp?.getButtonDown(InputComponent.Trigger)) { audio.ensure(); game.rollDice(); }
    if (game.mode !== 'farkle') { for (let i = 0; i < 5; i++) if (kb?.getKeyDown(`Digit${i + 1}`) && game.rollsLeft < 3) this.dm.toggleKeep(i); }
    else { for (let i = 0; i < 6; i++) if (kb?.getKeyDown(`Digit${i + 1}`)) game.farkleSelect(i); }
  }
  buildEnv() {
    const th = THEMES[save.themeIdx] || THEMES[0];
    this.scene.fog = new FogExp2(new Color(th.fog), 0.04);
    this.scene.add(new AmbientLight(new Color(th.accent), 0.15));
    const dl = new DirectionalLight(0xffffff, 0.4); dl.position.set(5, 10, 5); this.scene.add(dl);
    const al = new PointLight(new Color(th.accent), 1.5, 15); al.position.set(0, 3, -2); this.scene.add(al);
    const gs = 40, gd = 40, step = gs / gd, half = gs / 2, gv: number[] = [];
    for (let i = 0; i <= gd; i++) { const p = -half + i * step; gv.push(-half, 0, p, half, 0, p, p, 0, -half, p, 0, half); }
    const gg = new BufferGeometry(); gg.setAttribute('position', new Float32BufferAttribute(gv, 3));
    this.scene.add(new LineSegments(gg, new LineBasicMaterial({ color: new Color(th.grid), transparent: true, opacity: 0.3 })));
    const tg = new CylinderGeometry(0.6, 0.6, 0.02, 32);
    const table = new Mesh(tg, new MeshStandardMaterial({ color: new Color(th.table), emissive: new Color(th.table), emissiveIntensity: 0.2, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.7 }));
    table.position.set(0, DY - DS / 2 - 0.02, DZ); this.scene.add(table);
    const te = new LineSegments(new EdgesGeometry(tg), new LineBasicMaterial({ color: new Color(th.accent), transparent: true, opacity: 0.6 })); te.position.copy(table.position); this.scene.add(te);
    const dg = new SphereGeometry(0.01, 4, 4), dm = new MeshBasicMaterial({ color: new Color(th.accent), transparent: true, opacity: 0.3 });
    for (let i = 0; i < 80; i++) { const d = new Mesh(dg, dm); d.position.set((Math.random() - 0.5) * 20, Math.random() * 5, (Math.random() - 0.5) * 20); this.scene.add(d); }
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const container = document.getElementById('app') as HTMLDivElement;
  const world = await World.create(container, {
    xr: { offer: 'once' },
    render: { fov: 70, near: 0.01, far: 200, defaultLighting: false, camera: { position: [0, 1.6, 0], lookAt: [0, 1.2, -1.6] } },
    input: { canvasPointerEvents: true },
    features: { grabbing: false, locomotion: { browserControls: true }, physics: false, spatialUI: true },
  } as any);

  const cfgs: { config: string; pos: number[]; scale: number; fol: boolean; scr: Screen[] }[] = [
    { config: './ui/title.json', pos: [0, 1.6, -2.5], scale: 2.5, fol: false, scr: ['title'] },
    { config: './ui/mode.json', pos: [0, 1.6, -2.5], scale: 2.5, fol: false, scr: ['modeselect'] },
    { config: './ui/difficulty.json', pos: [0, 1.6, -2.5], scale: 2.5, fol: false, scr: ['difficulty'] },
    { config: './ui/hud.json', pos: [0, 2.0, -2.0], scale: 1.8, fol: true, scr: ['playing'] },
    { config: './ui/scorecard.json', pos: [0.8, 1.4, -1.8], scale: 1.6, fol: false, scr: ['playing'] },
    { config: './ui/farkle-hud.json', pos: [-0.8, 1.4, -1.8], scale: 1.6, fol: false, scr: ['playing'] },
    { config: './ui/turnresult.json', pos: [0, 1.5, -1.5], scale: 1.5, fol: false, scr: ['playing'] },
    { config: './ui/countdown.json', pos: [0, 1.6, -2.0], scale: 3.0, fol: false, scr: ['countdown'] },
    { config: './ui/pause.json', pos: [0, 1.6, -2.0], scale: 2.5, fol: false, scr: ['paused'] },
    { config: './ui/gameover.json', pos: [0, 1.6, -2.5], scale: 2.5, fol: false, scr: ['gameover'] },
    { config: './ui/settings.json', pos: [0, 1.6, -2.5], scale: 2.0, fol: false, scr: ['settings'] },
    { config: './ui/achvlist.json', pos: [0, 1.6, -2.5], scale: 2.0, fol: false, scr: ['achievements'] },
    { config: './ui/stats.json', pos: [0, 1.6, -2.5], scale: 2.0, fol: false, scr: ['stats'] },
    { config: './ui/skins.json', pos: [0, 1.6, -2.5], scale: 2.0, fol: false, scr: ['skins'] },
    { config: './ui/leaderboard.json', pos: [0, 1.6, -2.5], scale: 2.0, fol: false, scr: ['leaderboard'] },
    { config: './ui/help.json', pos: [0, 1.6, -2.5], scale: 2.0, fol: false, scr: ['help'] },
    { config: './ui/toast.json', pos: [0, 2.3, -2.0], scale: 1.5, fol: true, scr: ['playing', 'gameover', 'title'] },
  ];

  for (const c of cfgs) {
    const entity = world.createTransformEntity();
    entity.addComponent(PanelUI, { config: c.config });
    if (c.fol) { entity.addComponent(Follower); const off = entity.getVectorView(Follower, 'offsetPosition'); if (off) { off[0] = c.pos[0]; off[1] = c.pos[1] - 1.6; off[2] = c.pos[2]; } entity.addComponent(ScreenSpace); }
    if (entity.object3D) { entity.object3D.position.set(c.pos[0], c.pos[1], c.pos[2]); entity.object3D.scale.setScalar(c.scale); }
    panels.panelPos.set(c.config.replace('./ui/', '').replace('.json', ''), { entity, pos: c.pos, scr: c.scr });
  }

  world.registerSystem(GameSystem);
  panels.vis();
  audio.ensure(); audio.startDrone();
}

main().catch(console.error);
