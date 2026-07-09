/* HUZUR — uygulama motoru v4 | tek doğruluk kaynağı: state → render(state)
   v3: hibrit ses — gerçek kamu malı kayıtlar (SES_KAYNAKLARI.md) + sentez yedek
   v4: yolculuklar, ön-render seslendirme (edge-tts), seri koruma, rozetler,
       ana ekran check-in, notlar, gerçek yerel bildirim, frekans sesleri */
"use strict";

/* ================= STATE ================= */
const STORE_KEY = "huzur_v1";

const defaultState = () => ({
  onboarded: false,
  name: "",
  goals: [],
  reminder: "21:00",
  premium: false,
  goalWeekly: 5,
  screen: "home",
  cat: "hepsi",
  favorites: [],
  user: null,            // {email, created} — kayıt (şimdilik cihazda; bulut v5)
  topluBildirim: false,  // toplu seans öncesi 10 dk hatırlatma
  voice: "f",            // seslendirme tercihi: f=kadın, m=erkek
  guideOn: true,         // sesli rehber varsayılan açık (v4: gerçek kayıtlar)
  reminders: ["21:00"],  // vardiya modu: birden çok hatırlatma saati
  checkins: {},          // {"2026-07-04": moodVal} — ana ekran "Bugün nasılsın?"
  notes: [],             // [{d, title, t}] — seans sonu notları
  badges: [],            // kazanılan rozet id'leri
  freezes: 2,            // bu ayki Seri Koruma hakkı
  freezeMonth: "",       // hak yenileme takibi ("2026-07")
  programDone: {},       // {programId: [tamamlanan meditasyon id'leri]}
  stats: {
    sessions: 0, totalMin: 0, streak: 0, lastDay: "",
    days: {},          // {"2026-07-04": dakika}
    sessionsByDay: {}, // {"2026-07-04": seans sayısı}
    moods: {},         // {"2026-07-04": [4,5]}
    catsDone: {},      // {cat: seans sayısı} — Kâşif rozeti
  },
});

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    const merged = Object.assign(defaultState(), s, { screen: "home" });
    // v1 -> v2 geçişi: eski kayıtlarda olmayan alanları tamamla
    merged.stats = Object.assign(defaultState().stats, s.stats || {});
    merged.stats.sessionsByDay = merged.stats.sessionsByDay || {};
    merged.stats.moods = merged.stats.moods || {};
    if (!merged.goalWeekly) merged.goalWeekly = 5;
    // v3 -> v4 geçişi
    merged.stats.catsDone = merged.stats.catsDone || {};
    if (!Array.isArray(merged.reminders) || !merged.reminders.length) merged.reminders = [s.reminder || "21:00"];
    merged.checkins = merged.checkins || {};
    merged.notes = Array.isArray(merged.notes) ? merged.notes : [];
    merged.badges = Array.isArray(merged.badges) ? merged.badges : [];
    merged.programDone = merged.programDone || {};
    if (typeof merged.guideOn !== "boolean") merged.guideOn = true;
    if (merged.voice !== "m") merged.voice = "f";
    merged.user = s.user || null;
    if (typeof merged.topluBildirim !== "boolean") merged.topluBildirim = false;
    return merged;
  } catch (e) {
    console.warn("state okunamadı, sıfırdan başlıyor", e);
    return defaultState();
  }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { console.warn("kaydedilemedi", e); }
}

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);
const todayKey = () => new Date().toISOString().slice(0, 10);
const fmt = (sec) => {
  sec = Math.max(0, Math.floor(sec));
  return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
};
function toast(msg) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 2400);
}
function catInfo(cat) { return CAT_ART[cat] || ["🧘", "linear-gradient(135deg,#2b5876,#4e4376)"]; }
function findItem(id) {
  return MEDITATIONS.find((m) => m.id === id) || STORIES.find((s) => s.id === id) || null;
}
function isFav(id) { return state.favorites.includes(id); }
function soundName(id) { return (SOUNDS.find((s) => s.id === id) || {}).name || id; }
function icon(name, cls) { return `<span class="icon ${cls || ""}">${ICONS[name] || ""}</span>`; }

/* Gün bazlı sabit seçim (günün meditasyonu / sözü / ücretsiz hikayesi) */
function dayIndex(mod) {
  const d = new Date();
  const n = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  return mod > 0 ? n % mod : 0;
}
function freeStoryToday() { return STORIES[dayIndex(STORIES.length)]; }
function storyLocked(id) {
  if (LANSMAN_MODU) return false; // v1: her şey açık
  return !state.premium && id !== freeStoryToday().id;
}
/* Günün meditasyonu: premium bile olsa O GÜN ücretsizdir (cömert katman) */
function dailyFreeMed() { return MEDITATIONS[dayIndex(MEDITATIONS.length)]; }
function medLocked(m) {
  if (LANSMAN_MODU) return false; // v1: her şey açık
  return !!m.premium && !state.premium && m.id !== dailyFreeMed().id;
}
function monthKey() { return new Date().toISOString().slice(0, 7); }
function ensureMonthlyFreeze() {
  if (state.freezeMonth !== monthKey()) {
    state.freezeMonth = monthKey();
    state.freezes = 2;
    save();
  }
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ================= GERÇEK KAYITLAR (kamu malı/CC0 — SES_KAYNAKLARI.md) ================= */
const SAMPLES = {
  rain: "sounds/rain.mp3",
  ocean: "sounds/ocean.mp3",
  selale: "sounds/selale.mp3",
  wind: "sounds/wind.mp3",
  fire: "sounds/fire.mp3",
  forest: "sounds/forest.mp3",
  ciftlik: "sounds/ciftlik.mp3",
  /* white: sentez kalır — beyaz gürültünün aslı zaten matematik */
};
const ONESHOTS = { moo: ["sounds/moo1.mp3", "sounds/moo2.mp3", "sounds/moo3.mp3"] };

/* ================= AUDIO ENGINE v3 (hibrit: kayıt + sentez yedek) ================= */
const Audio_ = {
  ctx: null, master: null,
  channels: {},          // key -> {id, key, gain, nodes[], timeouts[], vol, mode}
  buffers: {}, _loads: {},
  timerEnd: 0, timerInt: null,

  ensure() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {}); return true; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
      return true;
    } catch (e) { console.warn("AudioContext yok", e); return false; }
  },

  /* --- kayıt yükleme --- */
  loadBuffer(url) {
    if (this.buffers[url]) return Promise.resolve(this.buffers[url]);
    if (this._loads[url]) return this._loads[url];
    const p = fetch(url)
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
      .then((ab) => new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej)))
      .then((buf) => { this.buffers[url] = buf; delete this._loads[url]; return buf; })
      .catch((e) => { delete this._loads[url]; throw e; });
    this._loads[url] = p;
    return p;
  },

  playBuffer(ch, buf, vol, loop) {
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    if (loop) {
      src.loop = true;
      src.loopStart = Math.min(0.25, buf.duration / 4);
      src.loopEnd = Math.max(src.loopStart + 1, buf.duration - 0.25);
    }
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g); g.connect(ch.gain);
    src.start();
    ch.nodes.push(src, g);
    return src;
  },

  noiseBuffer(type) {
    if (!this._bufs) this._bufs = {};
    if (this._bufs[type]) return this._bufs[type];
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (type === "pink") {
        // 1/f eğimli gürültü (3 kutuplu klasik yaklaşım)
        b0 = 0.99765 * b0 + w * 0.0990460;
        b1 = 0.96300 * b1 + w * 0.2965164;
        b2 = 0.57000 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
      }
      else d[i] = w;
    }
    this._bufs[type] = buf;
    return buf;
  },

  noiseSrc(type) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(type);
    src.loop = true;
    src.loopStart = 0; src.loopEnd = 2;
    return src;
  },

  later(ch, ms, fn) {
    const t = setTimeout(() => { if (this.channels[ch.key] === ch) fn(); }, ms);
    ch.timeouts.push(t);
  },

  blip(ch, make) {
    try { make(this.ctx, ch.gain); } catch (e) {}
  },

  /* --- çiftlik canlıları: gerçek möö + sentez keçi/çan/kuş aksanları --- */
  _goat(ctx, out) {
    const o = ctx.createOscillator(), og = ctx.createGain(), trem = ctx.createOscillator(), tg = ctx.createGain();
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 850; f.Q.value = 1.8;
    const now = ctx.currentTime, dur = 0.55 + Math.random() * 0.25;
    o.type = "sawtooth"; o.frequency.value = 215 + Math.random() * 55;
    trem.frequency.value = 8; tg.gain.value = 0.045;
    trem.connect(tg); tg.connect(og.gain);
    og.gain.setValueAtTime(0.001, now);
    og.gain.exponentialRampToValueAtTime(0.07, now + 0.08);
    og.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(f); f.connect(og); og.connect(out);
    o.start(now); trem.start(now); o.stop(now + dur + 0.05); trem.stop(now + dur + 0.05);
  },
  _bell(ctx, out) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), og = ctx.createGain();
    const now = ctx.currentTime;
    o.type = "triangle"; o.frequency.value = 640; o2.type = "sine"; o2.frequency.value = 958;
    og.gain.setValueAtTime(0.04, now);
    og.gain.exponentialRampToValueAtTime(0.0008, now + 1.9);
    o.connect(og); o2.connect(og); og.connect(out);
    o.start(now); o2.start(now); o.stop(now + 2); o2.stop(now + 2);
  },
  _bird(ctx, out) {
    const o = ctx.createOscillator(), og = ctx.createGain();
    const now = ctx.currentTime;
    o.type = "sine"; o.frequency.setValueAtTime(3200, now);
    o.frequency.exponentialRampToValueAtTime(4300, now + 0.12);
    og.gain.setValueAtTime(0.03, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    o.connect(og); og.connect(out); o.start(now); o.stop(now + 0.2);
  },
  _mooSynth(ctx, out) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), og = ctx.createGain();
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 300; f.Q.value = 1.2;
    const now = ctx.currentTime, dur = 1.1 + Math.random() * 0.5;
    o.type = "sawtooth"; o2.type = "sine";
    o.frequency.setValueAtTime(96, now); o.frequency.exponentialRampToValueAtTime(66, now + dur);
    o2.frequency.setValueAtTime(192, now); o2.frequency.exponentialRampToValueAtTime(132, now + dur);
    og.gain.setValueAtTime(0.001, now);
    og.gain.exponentialRampToValueAtTime(0.14, now + 0.28);
    og.gain.setValueAtTime(0.14, now + dur * 0.6);
    og.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(f); o2.connect(f); f.connect(og); og.connect(out);
    o.start(now); o2.start(now); o.stop(now + dur + 0.05); o2.stop(now + dur + 0.05);
  },

  farmLife(ch, useRealMoo) {
    if (useRealMoo) ONESHOTS.moo.forEach((u) => this.loadBuffer(u).catch(() => {}));
    const next = () => {
      const r = Math.random();
      if (r < 0.5) {
        const u = ONESHOTS.moo[Math.floor(Math.random() * ONESHOTS.moo.length)];
        const b = useRealMoo ? this.buffers[u] : null;
        if (b) { try { this.playBuffer(ch, b, 0.55, false); } catch (e) {} }
        else this.blip(ch, this._mooSynth);
      }
      else if (r < 0.74) this.blip(ch, this._goat);
      else if (r < 0.88) this.blip(ch, this._bell);
      else this.blip(ch, this._bird);
      this.later(ch, 5000 + Math.random() * 10000, next);
    };
    this.later(ch, 2500, next);
  },

  /* --- sentez tarifleri (yedek yol) --- */
  buildGraph(id, ch) {
    const c = this.ctx, g = ch.gain, keep = ch.nodes;

    const noise = (type, filters, gainVal) => {
      const src = this.noiseSrc(type);
      let node = src;
      filters.forEach((f) => { node.connect(f); node = f; });
      const gg = c.createGain(); gg.gain.value = gainVal;
      node.connect(gg); gg.connect(g);
      src.start();
      keep.push(src, gg, ...filters);
      return { src, gg };
    };
    const filt = (type, freq, Q) => { const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (Q) f.Q.value = Q; return f; };

    if (id === "white") {
      noise("white", [filt("lowpass", 4000)], 0.7);

    } else if (id === "rain") {
      noise("white", [filt("bandpass", 1500, 0.45), filt("highpass", 350)], 0.62);
      noise("brown", [filt("lowpass", 240)], 0.22);
      const drop = () => {
        this.blip(ch, (ctx, out) => {
          const o = ctx.createOscillator(), og = ctx.createGain();
          const f = filt("highpass", 1800);
          o.type = "sine"; o.frequency.value = 2200 + Math.random() * 3200;
          const now = ctx.currentTime, v = 0.02 + Math.random() * 0.05;
          og.gain.setValueAtTime(v, now);
          og.gain.exponentialRampToValueAtTime(0.0005, now + 0.03 + Math.random() * 0.04);
          o.connect(f); f.connect(og); og.connect(out);
          o.start(now); o.stop(now + 0.09);
        });
        this.later(ch, 90 + Math.random() * 320, drop);
      };
      this.later(ch, 300, drop);

    } else if (id === "ocean") {
      const base = noise("brown", [filt("lowpass", 620)], 0.5);
      const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
      const lfoG = c.createGain(); lfoG.gain.value = 0.22;
      lfo.connect(lfoG); lfoG.connect(base.gg.gain); lfo.start();
      keep.push(lfo, lfoG);
      const wave = () => {
        this.blip(ch, (ctx, out) => {
          const src = this.noiseSrc("white");
          const f = filt("bandpass", 900, 0.7);
          const wg = ctx.createGain();
          const now = ctx.currentTime, dur = 3.2 + Math.random() * 1.6;
          wg.gain.setValueAtTime(0.001, now);
          wg.gain.exponentialRampToValueAtTime(0.16 + Math.random() * 0.08, now + dur * 0.35);
          wg.gain.exponentialRampToValueAtTime(0.001, now + dur);
          f.frequency.setValueAtTime(1400, now);
          f.frequency.exponentialRampToValueAtTime(500, now + dur);
          src.connect(f); f.connect(wg); wg.connect(out);
          src.start(now); src.stop(now + dur + 0.1);
        });
        this.later(ch, 6500 + Math.random() * 5500, wave);
      };
      this.later(ch, 1200, wave);

    } else if (id === "selale") {
      noise("white", [filt("lowpass", 2100)], 0.5);
      noise("white", [filt("bandpass", 3400, 0.5)], 0.18);
      noise("brown", [filt("lowpass", 300)], 0.34);

    } else if (id === "wind") {
      const f = filt("bandpass", 480, 1.5);
      noise("white", [f], 0.6);
      const lfo = c.createOscillator(); lfo.frequency.value = 0.12;
      const lfoG = c.createGain(); lfoG.gain.value = 240;
      lfo.connect(lfoG); lfoG.connect(f.frequency); lfo.start();
      keep.push(lfo, lfoG);

    } else if (id === "fire") {
      noise("brown", [filt("lowpass", 850)], 0.55);
      const crack = () => {
        this.blip(ch, (ctx, out) => {
          const o = ctx.createOscillator(), og = ctx.createGain();
          o.type = "square"; o.frequency.value = 1600 + Math.random() * 2600;
          const now = ctx.currentTime;
          og.gain.setValueAtTime(0.06 + Math.random() * 0.09, now);
          og.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          o.connect(og); og.connect(out); o.start(now); o.stop(now + 0.06);
        });
        this.later(ch, 130 + Math.random() * 650, crack);
      };
      this.later(ch, 350, crack);

    } else if (id === "forest") {
      noise("brown", [filt("lowpass", 430)], 0.4);
      const chirp = () => {
        this.blip(ch, (ctx, out) => {
          const o = ctx.createOscillator(), og = ctx.createGain();
          o.type = "sine"; o.frequency.value = 4100 + Math.random() * 600;
          const now = ctx.currentTime;
          for (let k = 0; k < 3; k++) {
            og.gain.setValueAtTime(0.04, now + k * 0.09);
            og.gain.exponentialRampToValueAtTime(0.001, now + k * 0.09 + 0.06);
          }
          o.connect(og); og.connect(out); o.start(now); o.stop(now + 0.32);
        });
        this.later(ch, 900 + Math.random() * 2600, chirp);
      };
      this.later(ch, 600, chirp);

    } else if (id === "ciftlik") {
      noise("brown", [filt("lowpass", 380)], 0.3);
      noise("white", [filt("bandpass", 950, 0.6)], 0.07);
      this.farmLife(ch, false);

    } else if (id === "brown") {
      noise("brown", [filt("lowpass", 1100)], 0.62);

    } else if (id === "pink") {
      noise("pink", [filt("lowpass", 6000)], 0.55);

    } else if (id === "f174" || id === "f432") {
      // saf frekans tonu + oktav rengi + yavaş nefes alan genlik
      const base = id === "f174" ? 174 : 432;
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = base;
      const o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.value = base * 2;
      const og = c.createGain(); og.gain.value = 0.2;
      const og2 = c.createGain(); og2.gain.value = 0.035;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.13;
      const lg = c.createGain(); lg.gain.value = 0.05;
      lfo.connect(lg); lg.connect(og.gain);
      o.connect(og); og.connect(g);
      o2.connect(og2); og2.connect(g);
      o.start(); o2.start(); lfo.start();
      keep.push(o, o2, og, og2, lfo, lg);
    } else {
      return false;
    }
    return true;
  },

  synthInto(ch) {
    let ok = false;
    try { ok = this.buildGraph(ch.id, ch); } catch (e) { console.warn("sentez kurulamadı", ch.id, e); }
    ch.mode = ok ? "synth" : "dead";
    return ok;
  },

  /* key: kanal adı (karışımda ses id'si; oynatıcı "_player" kullanır) */
  start(id, key, vol) {
    key = key || id;
    if (!this.ensure()) { toast("Bu tarayıcıda ses desteklenmiyor"); return false; }
    this.stopChannel(key, false);
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    const target = typeof vol === "number" ? vol : 0.8;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(target, t + 1.4);
    g.connect(this.master);
    const ch = { id, key, gain: g, nodes: [], timeouts: [], vol: target, mode: "loading" };
    this.channels[key] = ch;

    const url = SAMPLES[id];
    if (url) {
      this.loadBuffer(url).then((buf) => {
        if (this.channels[key] !== ch) return;
        this.playBuffer(ch, buf, 1, true);
        ch.mode = "sample";
        if (id === "ciftlik") this.farmLife(ch, true);
      }).catch((e) => {
        if (this.channels[key] !== ch) return;
        console.warn("kayıt yüklenemedi, senteze düşülüyor:", id, String(e));
        this.synthInto(ch);
      });
      return true;
    }
    return this.synthInto(ch);
  },

  setVol(key, v) {
    const ch = this.channels[key];
    if (!ch) return;
    ch.vol = v;
    try {
      const t = this.ctx.currentTime;
      ch.gain.gain.cancelScheduledValues(t);
      ch.gain.gain.setTargetAtTime(v, t, 0.08);
    } catch (e) {}
  },

  stopChannel(key, fade = true) {
    const ch = this.channels[key];
    if (!ch) return;
    delete this.channels[key];
    ch.timeouts.forEach(clearTimeout);
    const kill = () => ch.nodes.concat([ch.gain]).forEach((n) => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
    if (fade && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        ch.gain.gain.cancelScheduledValues(t);
        ch.gain.gain.setValueAtTime(ch.gain.gain.value, t);
        ch.gain.gain.linearRampToValueAtTime(0, t + 0.7);
      } catch (e) {}
      setTimeout(kill, 800);
    } else kill();
    if (!this.mixKeys().length) this.clearTimer(false);
  },

  stopAll(fade = true) {
    Object.keys(this.channels).forEach((k) => this.stopChannel(k, fade));
    this.clearTimer(false);
  },

  mixKeys() { return Object.keys(this.channels).filter((k) => k !== "_player"); },

  setTimer(min) {
    this.clearTimer(false);
    if (!min || min <= 0) { renderMixer(); return; }
    this.timerEnd = Date.now() + min * 60000;
    this.timerInt = setInterval(() => {
      if (Date.now() >= this.timerEnd) {
        this.stopAll();
        renderSounds();
        toast("Zamanlayıcı bitti, sesler durdu 🌙");
      } else {
        const el = $("mixer-timer-label");
        if (el) el.textContent = "Kalan: " + fmt((this.timerEnd - Date.now()) / 1000);
      }
    }, 1000);
    renderMixer();
  },
  clearTimer(rerender = true) {
    clearInterval(this.timerInt);
    this.timerInt = null; this.timerEnd = 0;
    if (rerender) renderMixer();
  },
};

/* ================= SESLİ REHBER (v4: ön-render kayıt + sentez yedek) =================
   Öncelik: sounds/tts/<id>_<ses>_<satır>.mp3 (edge-tts ile önceden üretilmiş gerçek ses).
   Kayıt yoksa/yüklenemezse Web SpeechSynthesis'e düşer. TTS.on = state.guideOn. */
const TTS = {
  meta: null,   // tts_meta.json — {itemId: {voices:["f","m"], starts:[..]}}
  audio: null,
  get on() { return !!state.guideOn; },
  fileFor(item, idx) {
    const m = this.meta && item && this.meta[item.id];
    if (!m || !Array.isArray(m.voices) || !m.voices.length) return null;
    const v = m.voices.includes(state.voice) ? state.voice : m.voices[0];
    return "sounds/tts/" + item.id + "_" + v + "_" + idx + ".mp3";
  },
  say(item, idx, text) {
    if (!this.on) return;
    const f = this.fileFor(item, idx);
    if (!f) { this.speak(text); return; }
    this.stopAll();
    try {
      const a = new window.Audio(f);
      this.audio = a;
      a.volume = 1;
      a.play().catch(() => { if (this.audio === a) this.speak(text); });
    } catch (e) { this.speak(text); }
  },
  speak(text) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "tr-TR"; u.rate = 0.85; u.pitch = 0.95;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  },
  stopAll() {
    if (this.audio) { try { this.audio.pause(); } catch (e) {} this.audio = null; }
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
  },
};

/* ================= SEANS SONU (duygu günlüğü) ================= */
let lastSession = null; // {mins, title}

function showDone(mins, title) {
  lastSession = { mins, title };
  $("done-text").textContent = `${mins} dakikalık "${title}" seansını tamamladın. Serin: ${state.stats.streak} gün 🔥`;
  document.querySelectorAll("#mood-row button").forEach((b) => b.classList.remove("on"));
  const noteEl = $("done-note");
  if (noteEl) noteEl.value = "";
  $("done").classList.remove("hidden");
}
function closeDone(moodVal) {
  if (moodVal) {
    const day = todayKey();
    if (!state.stats.moods[day]) state.stats.moods[day] = [];
    state.stats.moods[day].push(moodVal);
    save();
    const m = MOODS.find((x) => x[0] === moodVal);
    toast(`Duygu günlüğüne eklendi: ${m ? m[1] + " " + m[2] : ""}`);
  }
  // seans notu (isteğe bağlı)
  const noteEl = $("done-note");
  const txt = noteEl ? (noteEl.value || "").trim() : "";
  if (txt && lastSession) {
    state.notes.unshift({ d: new Date().toISOString(), title: lastSession.title, t: txt.slice(0, 400) });
    save();
    if (!moodVal) toast("Notun kaydedildi 📝");
  }
  if (noteEl) noteEl.value = "";
  $("done").classList.add("hidden");
  renderAll();
}

/* ================= PLAYER ================= */
const Player = {
  item: null, elapsed: 0, running: false, int: null, lineIdx: -1, isStory: false,

  open(id) {
    const item = findItem(id);
    if (!item) return;
    this.isStory = !!STORIES.find((s) => s.id === id);
    const locked = this.isStory ? storyLocked(id) : medLocked(item);
    if (locked) { openPaywall(); return; }
    $("program").classList.add("hidden");
    this.item = item;
    // ön-render ses varsa satır zamanları meta'dan gelir (ses süresine göre ayarlı)
    const tm = TTS.meta && TTS.meta[item.id];
    this.starts = (item.lines || []).map((l, i) =>
      tm && Array.isArray(tm.starts) && typeof tm.starts[i] === "number" ? tm.starts[i] : l[0]
    );
    // hikaye: kesintisiz anlatım — okuma bitince ortam sesi devam eder
    this.readEnd = (this.isStory && tm && tm.readEnd) || 0;
    this.readDone = false;
    this.sessionRecorded = false;
    this.elapsed = 0; this.lineIdx = -1; this.running = false;
    $("player").classList.toggle("story", this.isStory);
    $("player-tag").textContent = this.isStory ? "UYKU HİKAYESİ" : "MEDİTASYON";
    $("player-title").textContent = item.title;
    $("player-total").textContent = "/ " + fmt(item.dur * 60);
    $("player-time").textContent = "00:00";
    $("player-line").textContent = "Hazır olduğunda ▶ ile başla…";
    $("player-toggle").textContent = "▶";
    $("player-fav").textContent = isFav(id) ? "💛" : "🤍";
    $("ring-fg").style.strokeDashoffset = 553;
    $("story-flow").innerHTML = "";
    $("story-prog-fill").style.width = "0%";
    $("story-time").textContent = "00:00 / " + fmt(item.dur * 60);
    this.setTTSLabel();
    $("player").classList.remove("hidden");
  },

  setTTSLabel() {
    $("player-tts").textContent = TTS.on ? "🔊" : "🔇";
    $("story-tts").textContent = TTS.on ? "🔊 Sesli Oku: Açık" : "🔇 Sesli Oku: Kapalı";
    $("story-tts").classList.toggle("on", TTS.on);
    const m = TTS.meta && this.item && TTS.meta[this.item.id];
    const multi = !!(m && Array.isArray(m.voices) && m.voices.length > 1);
    $("player-voice").classList.toggle("hidden", !multi || !TTS.on);
    $("player-voice").textContent = state.voice === "m" ? "👨 Erkek Ses" : "👩 Kadın Ses";
  },

  toggle() { if (!this.item) return; this.running ? this.pause() : this.play(); },

  play() {
    if (!this.item || this.running) return;
    this.running = true;
    $("player-toggle").textContent = "⏸";
    Audio_.stopAll(); // karışım ile üst üste binmesin
    if (this.item.sound) Audio_.start(this.item.sound, "_player", 0.55);
    clearInterval(this.int);
    this.int = setInterval(() => this.tick(), 1000);
    this.tick();
  },

  pause() {
    this.running = false;
    clearInterval(this.int);
    $("player-toggle").textContent = "▶";
    Audio_.stopChannel("_player");
    TTS.stopAll();
  },

  tick() {
    if (!this.item) return;
    const total = this.item.dur * 60;
    this.elapsed++;
    if (this.elapsed >= total) { this.finish(); return; }
    $("player-time").textContent = fmt(this.elapsed);
    const pct = Math.min(1, this.elapsed / Math.max(1, total));
    $("ring-fg").style.strokeDashoffset = 553 * (1 - pct);
    $("story-prog-fill").style.width = (pct * 100).toFixed(1) + "%";
    $("story-time").textContent = fmt(this.elapsed) + " / " + fmt(total);

    const lines = this.item.lines || [];
    let idx = this.lineIdx;
    for (let i = 0; i < lines.length; i++) {
      const at = this.starts && this.starts[i] != null ? this.starts[i] : lines[i][0];
      if (this.elapsed >= at) idx = i;
    }
    if (idx !== this.lineIdx && idx >= 0) {
      this.lineIdx = idx;
      const text = lines[idx][1];
      if (this.isStory) {
        const p = document.createElement("p");
        p.textContent = text;
        $("story-flow").appendChild(p);
        requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add("show")));
        const flow = $("story-flow");
        setTimeout(() => { try { flow.scrollTo({ top: flow.scrollHeight, behavior: "smooth" }); } catch (e) { flow.scrollTop = flow.scrollHeight; } }, 120);
      } else {
        const el = $("player-line");
        el.classList.add("fade");
        setTimeout(() => { el.textContent = text; el.classList.remove("fade"); }, 450);
      }
      TTS.say(this.item, idx, text);
    }

    // hikaye anlatımı bitti: tebrik ekranı YOK (uyku bölünmez), ortam sesi akar
    if (this.isStory && this.readEnd && !this.readDone && this.elapsed >= this.readEnd) {
      this.readDone = true;
      if (!this.sessionRecorded) {
        recordSession(Math.max(1, Math.round(this.readEnd / 60)), this.item);
        this.sessionRecorded = true;
      }
      const p = document.createElement("p");
      p.className = "endnote";
      p.textContent = "🌙 Hikaye sona erdi… " + soundName(this.item.sound) + " sesi seninle. İyi uykular.";
      $("story-flow").appendChild(p);
      requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add("show")));
      const flow = $("story-flow");
      setTimeout(() => { try { flow.scrollTo({ top: flow.scrollHeight, behavior: "smooth" }); } catch (e) { flow.scrollTop = flow.scrollHeight; } }, 120);
    }
  },

  finish() {
    const item = this.item;
    const mins = item ? item.dur : 0;
    if (this.isStory) {
      // süre doldu: sayaç durur ama ORTAM SESİ ÇALMAYA DEVAM EDER (uyuyan uyandırılmaz)
      clearInterval(this.int);
      this.running = false;
      $("player-toggle").textContent = "▶";
      if (!this.sessionRecorded && item) {
        recordSession(Math.max(1, Math.round((this.readEnd || mins * 60) / 60)), item);
        this.sessionRecorded = true;
      }
      return;
    }
    this.pause();
    recordSession(mins, item);
    $("player").classList.add("hidden");
    this.item = null;
    showDone(mins, item ? item.title : "");
  },

  close() {
    if (this.item && !this.sessionRecorded && this.elapsed >= 60 && this.elapsed < this.item.dur * 60) {
      recordSession(Math.floor(this.elapsed / 60), this.item);
      toast(`${Math.floor(this.elapsed / 60)} dk kaydedildi 👏`);
    }
    this.pause();
    this.item = null;
    $("player").classList.add("hidden");
    renderAll();
  },
};

/* ================= BREATH ================= */
const Breath = {
  b: null, cycle: 0, running: false, timer: null,

  open(id) {
    this.b = BREATHS.find((x) => x.id === id);
    if (!this.b) return;
    this.cycle = 0; this.running = false;
    $("breath-title").textContent = this.b.name;
    $("breath-phase").textContent = "Hazır";
    $("breath-count").textContent = `Tur 0 / ${this.b.cycles}`;
    $("breath-toggle").textContent = "▶";
    $("breath-circle").style.transform = "scale(1)";
    $("breath").classList.remove("hidden");
  },

  toggle() {
    if (this.running) { this.stop(); return; }
    this.running = true;
    $("breath-toggle").textContent = "⏸";
    this.cycle = 0;
    this.phaseLoop();
  },

  phaseLoop() {
    if (!this.running || !this.b) return;
    if (this.cycle >= this.b.cycles) { this.done(); return; }
    this.cycle++;
    $("breath-count").textContent = `Tur ${this.cycle} / ${this.b.cycles}`;
    const seq = [
      ["Nefes al…", this.b.inhale, 2.1],
      ["Tut", this.b.hold, 2.1],
      ["Nefes ver…", this.b.exhale, 1],
      ["Tut", this.b.hold2, 1],
    ].filter((p) => p[1] > 0);
    let i = 0;
    const step = () => {
      if (!this.running) return;
      if (i >= seq.length) { this.phaseLoop(); return; }
      const [label, secs, scale] = seq[i];
      $("breath-phase").textContent = label + " " + secs;
      const c = $("breath-circle");
      c.style.transition = `transform ${secs}s ease-in-out`;
      c.style.transform = `scale(${scale})`;
      i++;
      this.timer = setTimeout(step, secs * 1000);
    };
    step();
  },

  done() {
    const b = this.b;
    this.stop();
    const totalSec = (b.inhale + b.hold + b.exhale + b.hold2) * b.cycles;
    const mins = Math.max(1, Math.round(totalSec / 60));
    recordSession(mins, { id: "breath" });
    $("breath").classList.add("hidden");
    showDone(mins, b.name);
  },

  stop() {
    this.running = false;
    clearTimeout(this.timer);
    $("breath-toggle").textContent = "▶";
    const c = $("breath-circle");
    c.style.transition = "transform 1s ease-in-out";
    c.style.transform = "scale(1)";
  },

  close() { this.stop(); $("breath").classList.add("hidden"); },
};

/* ================= STATS ================= */
function recordSession(mins, item) {
  if (!mins || mins <= 0) return;
  const st = state.stats, today = todayKey();
  st.sessions++;
  st.totalMin += mins;
  st.days[today] = (st.days[today] || 0) + mins;
  st.sessionsByDay[today] = (st.sessionsByDay[today] || 0) + 1;
  if (item && item.cat) st.catsDone[item.cat] = (st.catsDone[item.cat] || 0) + 1;
  if (st.lastDay !== today) {
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const y2 = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    if (st.lastDay === y) {
      st.streak = st.streak + 1;
    } else if (st.lastDay === y2 && state.freezes > 0) {
      // Seri Koruma: 1 gün kaçırıldı ama hak varsa seri kopmaz
      state.freezes--;
      st.streak = st.streak + 1;
      toast(`Seri Koruma devrede 🧊 Serin ${st.streak} günde devam ediyor`);
    } else {
      st.streak = 1;
    }
    st.lastDay = today;
  }
  if (item) updatePrograms(item);
  save();
  checkBadges(item);
}

/* Yolculuk ilerlemesi */
function updatePrograms(item) {
  PROGRAMS.forEach((p) => {
    if (!p.days.includes(item.id)) return;
    if (!state.programDone[p.id]) state.programDone[p.id] = [];
    const arr = state.programDone[p.id];
    if (arr.includes(item.id)) return;
    arr.push(item.id);
    const total = p.days.filter((id) => findItem(id)).length;
    if (arr.length >= total) toast(`${p.emoji} "${p.title}" tamamlandı! 🎉`);
    else toast(`${p.emoji} ${p.title}: ${arr.length}/${total} gün`);
  });
}

/* Rozetler */
function checkBadges(item) {
  const st = state.stats, h = new Date().getHours();
  const earned = {
    ilkadim: st.sessions >= 1,
    seri3: st.streak >= 3,
    seri7: st.streak >= 7,
    seri30: st.streak >= 30,
    saat1: st.totalMin >= 60,
    saat10: st.totalMin >= 600,
    gecekusu: !!item && (h >= 22 || h < 4),
    erkenkus: !!item && h >= 5 && h < 8,
    kasif: Object.keys(st.catsDone).length >= 5,
    yolcu: PROGRAMS.some((p) => {
      const total = p.days.filter((id) => findItem(id)).length;
      return total > 0 && (state.programDone[p.id] || []).length >= total;
    }),
  };
  BADGES.forEach((b) => {
    if (earned[b.id] && !state.badges.includes(b.id)) {
      state.badges.push(b.id);
      save();
      confetti();
      toast(`Rozet kazandın: ${b.emoji} ${b.name}!`);
    }
  });
}

/* Konfeti kutlaması */
function confetti() {
  const phone = $("phone") || document.getElementById("phone");
  if (!phone) return;
  const wrap = document.createElement("div");
  wrap.className = "confetti";
  const colors = ["#7FC4E8", "#B3E3F7", "#F5D08C", "#E07A7A", "#A48DF0"];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = (Math.random() * 0.5).toFixed(2) + "s";
    p.style.animationDuration = (1.6 + Math.random() * 1.2).toFixed(2) + "s";
    wrap.appendChild(p);
  }
  phone.appendChild(wrap);
  setTimeout(() => wrap.remove(), 3400);
}

function weekDates() {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const out = [];
  for (let i = 0; i < 7; i++) {
    out.push(new Date(now.getTime() - (mondayOffset - i) * 86400000).toISOString().slice(0, 10));
  }
  return out;
}
function weekSessionCount() {
  const today = todayKey();
  return weekDates().filter((d) => d <= today).reduce((a, d) => a + (state.stats.sessionsByDay[d] || 0), 0);
}

/* ================= RENDER ================= */
function medItemHTML(m) {
  const [emoji, grad] = catInfo(m.cat);
  const lock = medLocked(m) ? `<span class="lock">🔒</span>`
    : (m.premium && !state.premium && !LANSMAN_MODU ? `<span class="lock">🎁</span>` : "");
  const fav = isFav(m.id) ? "💛" : "";
  return `<button class="item" data-play="${m.id}">
    <div class="art" style="background:${grad}">${emoji}</div>
    <div class="info"><b>${m.title}</b><span>${m.dur} dk · ${(CATS.find(c=>c.id===m.cat)||{}).name || ""}</span></div>
    ${fav}${lock}
  </button>`;
}

function renderHome() {
  const h = new Date().getHours();
  $("greeting").textContent =
    (h < 6 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar") +
    (state.name ? ", " + state.name : "");
  $("streak-chip").textContent = "🔥 " + state.stats.streak + (state.freezes > 0 ? " 🧊" + state.freezes : "");

  // Bugün nasılsın? (check-in)
  const ci = state.checkins[todayKey()] || 0;
  $("checkin-row").innerHTML = MOODS.map(([v, emo, lbl]) =>
    `<button data-checkin="${v}" class="${ci === v ? "on" : ""}" title="${lbl}"><span>${emo}</span><i>${lbl}</i></button>`
  ).join("");
  $("checkin-hint").textContent = ci
    ? "Not ettim — aşağıdaki öneriler şu anki moduna göre ✨"
    : "Dokun; önerileri sana göre ayarlayalım";

  const daily = dailyFreeMed();
  $("daily-tag").textContent = (daily.premium && !LANSMAN_MODU) ? "GÜNÜN MEDİTASYONU · BUGÜN ÜCRETSİZ 🎁" : "GÜNÜN MEDİTASYONU";
  $("daily-title").textContent = daily.title;
  $("daily-meta").textContent = `${daily.dur} dk · ${(CATS.find(c=>c.id===daily.cat)||{}).name || ""}`;
  $("daily-play").dataset.play = daily.id;

  // Toplu seans: yaklaşan geri sayımla, canlıyken nabızlı "Katıl" kartı
  const ts = topluDurum();
  if (ts) {
    $("toplu-card").innerHTML = ts.canli
      ? `<button class="card feat toplu canli" data-play="${ts.item.id}">
          <div class="hero-tag">🔴 ŞU AN CANLI · TOPLU SEANS</div>
          <div class="feat-body"><span class="feat-emoji">${ts.s.emoji}</span>
            <div><h2>${ts.s.ad}</h2><span class="muted small">${topluKatilim(ts.s)} kişi şu an birlikte · ${ts.item.dur} dk</span></div></div>
          <span class="feat-play">▶ Katıl</span>
        </button>`
      : `<div class="card toplu">
          <div class="row-between"><span class="hero-tag">🌍 TOPLU SEANS</span>
            <button class="icon-btn sm" id="toplu-zil" title="Seans öncesi hatırlat">${state.topluBildirim ? "🔔" : "🔕"}</button></div>
          <div class="feat-body"><span class="feat-emoji">${ts.s.emoji}</span>
            <div><h2>${ts.s.ad}</h2><span class="muted small">${ts.s.saat}'de herkesle aynı anda · <b id="toplu-sayac">${fmtKalan(ts.kalan)}</b> sonra</span></div></div>
        </div>`;
    const zil = $("toplu-zil");
    if (zil) zil.onclick = () => {
      state.topluBildirim = !state.topluBildirim;
      save(); renderHome(); Notif.sync();
      toast(state.topluBildirim ? "Toplu seanslardan 10 dk önce haber vereceğim 🔔" : "Toplu seans hatırlatması kapalı");
    };
  }

  // Devam eden yolculuk
  const cont = PROGRAMS.map((p) => {
    const days = p.days.filter((id) => findItem(id));
    const done = (state.programDone[p.id] || []).filter((id) => days.includes(id));
    return { p, days, done: done.length, next: days.find((id) => !done.includes(id)) };
  }).find((x) => x.done > 0 && x.done < x.days.length);
  $("home-prog-wrap").classList.toggle("hidden", !cont);
  if (cont) {
    const nx = findItem(cont.next);
    $("home-prog-wrap").innerHTML = `<button class="card feat prog-cont" data-openprog="${cont.p.id}">
      <div class="hero-tag">YOLCULUĞUNA DEVAM ET ${cont.p.emoji}</div>
      <div class="feat-body"><div><h2>${cont.p.title}</h2>
        <span class="muted small">Gün ${cont.done + 1}/${cont.days.length}${nx ? " · Sıradaki: " + nx.title : ""}</span></div></div>
      <div class="gbar sm"><div class="gfill" style="width:${Math.round((cont.done / cont.days.length) * 100)}%"></div></div>
    </button>`;
  }

  const done = weekSessionCount(), goal = state.goalWeekly || 5;
  const pct = Math.min(100, Math.round((done / goal) * 100));
  $("goal-label").textContent = `${done} / ${goal} seans`;
  $("goal-fill").style.width = pct + "%";
  $("goal-done-msg").classList.toggle("hidden", done < goal);
  $("goal-fill").classList.toggle("full", done >= goal);

  $("quote-text").textContent = "“" + QUOTES[dayIndex(QUOTES.length)] + "”";

  const fs = freeStoryToday();
  const quick = [
    { t: "3 dk Odak", e: "⚡", id: "m6", g: "linear-gradient(135deg,#1e3c72,#2a5298)" },
    { t: "Sakinleşme Nefesi", e: "🍃", breath: "bcalm", g: "linear-gradient(135deg,#134E5E,#2d7d6e)" },
    { t: "Yağmur Sesi", e: "🌧️", sound: "rain", g: "linear-gradient(135deg,#2b5876,#4e4376)" },
    { t: fs.title, e: fs.emoji, id: fs.id, g: "linear-gradient(135deg,#141E30,#3a4d6b)", sub: LANSMAN_MODU ? "Uyku hikayesi" : "Bugün ücretsiz" },
  ];
  $("quick-row").innerHTML = quick.map((q) => {
    const attr = q.id ? `data-play="${q.id}"` : q.breath ? `data-breath="${q.breath}"` : `data-sound="${q.sound}"`;
    return `<button class="tile" style="background:${q.g}" ${attr}><span class="t-emoji">${q.e}</span><b>${q.t}</b><span>${q.sub || "Hemen başla"}</span></button>`;
  }).join("");

  // Favoriler şeridi (Meditopia'da gizli köşede — bizde vitrinde)
  const favs = state.favorites.map(findItem).filter(Boolean).slice(0, 8);
  $("home-fav-wrap").classList.toggle("hidden", !favs.length);
  $("home-fav-row").innerHTML = favs.map((f) =>
    `<button class="tile" style="background:linear-gradient(135deg,#3d3653,#5a4a7a)" data-play="${f.id}">
      <span class="t-emoji">${f.emoji || catInfo(f.cat)[0]}</span><b>${f.title}</b><span>${f.dur} dk</span></button>`
  ).join("");

  // Sana özel: check-in varsa moda göre, yoksa hedeflere göre
  const MOOD_CATS = {
    1: ["stres", "ofke", "kaygi", "sefkat"],
    2: ["uyku", "sefkat", "stres"],
    3: ["odak", "stres", "sukran"],
    4: ["sukran", "iliskiler", "odak"],
    5: ["ozguven", "sukran", "iliskiler"],
  };
  const prefs = ci ? MOOD_CATS[ci] : (state.goals.length ? state.goals : ["stres", "uyku"]);
  const picks = [];
  // kategoriler arası dönüşümlü seçim (tek kategoriye doymasın)
  const pools = prefs.map((c) => MEDITATIONS.filter((m) => m.cat === c));
  for (let k = 0; picks.length < 4; k++) {
    let added = false;
    pools.forEach((pool) => {
      if (pool[k] && picks.length < 4 && !picks.includes(pool[k])) { picks.push(pool[k]); added = true; }
    });
    if (!added) break;
  }
  $("foryou-sub").textContent = ci ? "· şu anki moduna göre" : "· hedeflerine göre";
  $("for-you").innerHTML = (picks.length ? picks : MEDITATIONS.slice(0, 4)).map(medItemHTML).join("");
}

function renderExplore() {
  // Yolculuklar
  $("prog-row").innerHTML = PROGRAMS.map((p) => {
    const days = p.days.filter((id) => findItem(id));
    if (!days.length) return "";
    const done = (state.programDone[p.id] || []).filter((id) => days.includes(id)).length;
    const pct = Math.round((done / days.length) * 100);
    return `<button class="prog-card" data-openprog="${p.id}">
      <span class="hero-tag">${p.tag} · ${days.length} GÜN</span>
      <span class="prog-emoji">${p.emoji}</span>
      <b>${p.title}</b>
      <span class="muted small">${p.desc}</span>
      <div class="gbar sm"><div class="gfill" style="width:${pct}%"></div></div>
      <span class="small prog-pct">${done}/${days.length} tamamlandı</span>
    </button>`;
  }).join("");

  $("cat-chips").innerHTML = CATS.map(
    (c) => `<button class="chip ${state.cat === c.id ? "on" : ""}" data-cat="${c.id}">${c.name}</button>`
  ).join("");
  const list = state.cat === "hepsi" ? MEDITATIONS : MEDITATIONS.filter((m) => m.cat === state.cat);
  $("explore-list").innerHTML = list.length
    ? list.map(medItemHTML).join("")
    : `<p class="muted small">Bu kategoride içerik yok.</p>`;
}

/* Yolculuk detay ekranı */
function openProgram(pid) {
  const p = PROGRAMS.find((x) => x.id === pid);
  if (!p) return;
  const done = state.programDone[p.id] || [];
  const days = p.days.filter((id) => findItem(id));
  const next = days.find((id) => !done.includes(id));
  $("program-title").textContent = p.emoji + " " + p.title;
  $("program-desc").textContent = p.desc;
  $("program-days").innerHTML = days.map((id, i) => {
    const m = findItem(id);
    const isDone = done.includes(id);
    const mark = isDone ? "✅" : medLocked(m) ? "🔒" : id === next ? "▶" : "·";
    return `<button class="item pday ${isDone ? "done" : ""} ${id === next ? "next" : ""}" data-play="${id}">
      <div class="art" style="background:${catInfo(m.cat)[1]}">${isDone ? "✓" : i + 1}</div>
      <div class="info"><b>Gün ${i + 1} · ${m.title}</b><span>${m.dur} dk</span></div>
      <span class="lock">${mark}</span>
    </button>`;
  }).join("");
  $("program").classList.remove("hidden");
}

function renderSleep() {
  const fs = freeStoryToday();
  $("story-featured").innerHTML = `
    <button class="card feat" data-play="${fs.id}">
      <div class="hero-tag">${LANSMAN_MODU ? "GÜNÜN HİKAYESİ 🌙" : "GÜNÜN HİKAYESİ · BUGÜN ÜCRETSİZ 🎁"}</div>
      <div class="feat-body">
        <span class="feat-emoji">${fs.emoji}</span>
        <div><h2>${fs.title}</h2><span class="muted small">${fs.dur} dk · sesli okuma destekli</span></div>
      </div>
      <span class="feat-play">▶ Dinle</span>
    </button>`;

  $("story-row").innerHTML = STORIES.filter((s) => s.id !== fs.id).map((s) => {
    const lock = storyLocked(s.id) ? " 🔒" : "";
    return `<button class="tile" style="background:linear-gradient(135deg,#141E30,#3a4d6b)" data-play="${s.id}">
      <span class="t-emoji">${s.emoji}</span><b>${s.title}${lock}</b><span>${s.dur} dk</span></button>`;
  }).join("");

  $("sleep-med-list").innerHTML = MEDITATIONS.filter((m) => m.cat === "uyku").map(medItemHTML).join("");

  $("sleep-sound-row").innerHTML = ["rain", "ocean", "selale"].map((id) => {
    const s = SOUNDS.find((x) => x.id === id);
    return `<button class="tile" style="background:linear-gradient(135deg,#134E5E,#2d7d6e)" data-sound="${s.id}">
      ${icon(s.icon, "t-icon")}<b>${s.name}</b><span>Karışıma ekle</span></button>`;
  }).join("");
}

function renderBreathe() {
  $("breath-list").innerHTML = BREATHS.map(
    (b) => `<button class="item" data-breath="${b.id}">
      <div class="art" style="background:linear-gradient(135deg,#134E5E,#2d7d6e)">${b.emoji}</div>
      <div class="info"><b>${b.name}</b><span>${b.desc}</span></div></button>`
  ).join("");
  renderSounds();
}

function renderSounds() {
  $("sound-grid").innerHTML = SOUNDS.map(
    (s) => `<button class="sound ${Audio_.channels[s.id] ? "playing" : ""}" data-sound="${s.id}">
      ${icon(s.icon, "s-icon")}${s.name}</button>`
  ).join("");
  renderMixer();
}

function renderMixer() {
  const bar = $("mixer");
  const keys = Audio_.mixKeys();
  if (!keys.length) { bar.classList.add("hidden"); return; }
  bar.classList.remove("hidden");
  $("mixer-timer-label").textContent = Audio_.timerEnd
    ? "Kalan: " + fmt((Audio_.timerEnd - Date.now()) / 1000)
    : "Zamanlayıcı kapalı";
  $("mixer-rows").innerHTML = keys.map((k) => {
    const ch = Audio_.channels[k];
    const s = SOUNDS.find((x) => x.id === ch.id) || {};
    return `<div class="mrow">
      ${icon(s.icon, "m-icon")}
      <span class="m-name">${s.name || ch.id}</span>
      <input type="range" min="0" max="100" value="${Math.round(ch.vol * 100)}" data-vol="${k}">
      <button class="icon-btn sm" data-mixoff="${k}">✕</button>
    </div>`;
  }).join("");
}

function renderProfile() {
  $("profile-name").textContent = state.name || "Profil";
  $("premium-chip").textContent = LANSMAN_MODU ? "🌕 Lansman: her şey açık"
    : state.premium ? "⭐ Premium Üye" : "⭐ Premium'a Geç";
  $("st-streak").textContent = state.stats.streak;
  $("st-min").textContent = state.stats.totalMin;
  $("st-ses").textContent = state.stats.sessions;
  $("goal-select").value = String(state.goalWeekly || 5);

  // Hesap
  $("account-row").innerHTML = state.user
    ? `<span>📧 ${escapeHtml(state.user.email)}</span><span class="muted small">${state.premium ? "Premium üye ⭐" : LANSMAN_MODU ? "Lansman üyesi 🌕" : "Ücretsiz üyelik"}</span>`
    : `<span>📧 Hesap oluştur</span><span class="muted small">Serin ve rozetlerin güvende olsun →</span>`;

  // Seri Koruma
  $("freeze-chip").textContent = `🧊 Seri Koruma: ${state.freezes} hak`;

  // Rozetler
  $("badge-grid").innerHTML = BADGES.map((b) => {
    const got = state.badges.includes(b.id);
    return `<div class="badge ${got ? "got" : ""}" title="${b.desc}"><span>${b.emoji}</span><i>${b.name}</i></div>`;
  }).join("");
  $("badge-count").textContent = `${state.badges.length}/${BADGES.length}`;

  // Hatırlatıcılar (vardiya modu: çoklu saat)
  $("rem-list").innerHTML = state.reminders.length
    ? state.reminders.map((t, i) =>
        `<div class="mrow"><span class="m-name">⏰ ${t}</span><span class="muted small" style="flex:1"></span><button class="icon-btn sm" data-delrem="${i}">✕</button></div>`
      ).join("")
    : '<p class="muted small">Hatırlatma saati yok. Aşağıdan ekle.</p>';

  // Notlar
  const notes = state.notes.slice(0, 20);
  $("note-list").innerHTML = notes.length
    ? notes.map((n, i) =>
        `<div class="note"><div class="row-between"><b class="small">${escapeHtml(n.title || "Seans")}</b>
          <button class="icon-btn sm" data-delnote="${i}">✕</button></div>
          <p class="small">${escapeHtml(n.t)}</p>
          <span class="muted small">${(n.d || "").slice(0, 10)}</span></div>`
      ).join("")
    : '<p class="muted small">Seans sonunda not bırakırsan burada birikir. 📝</p>';

  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  let maxV = 1;
  const bars = weekDates().map((d, i) => {
    const v = state.stats.days[d] || 0;
    maxV = Math.max(maxV, v);
    return [days[i], v];
  });
  $("week-chart").innerHTML = bars.map(
    ([lbl, v]) => `<div class="wbar"><div class="bar ${v ? "" : "empty"}" style="height:${Math.max(4, (v / maxV) * 100)}%"></div><span>${lbl}</span></div>`
  ).join("");

  const cells = [];
  let sum = 0, cnt = 0;
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const arr = state.stats.moods[d] || [];
    if (arr.length) {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      sum += avg; cnt++;
      const m = MOODS[Math.min(4, Math.max(0, Math.round(avg) - 1))];
      cells.push(`<div class="mcell"><div class="mbar" style="height:${(avg / 5) * 100}%"></div><span>${m[1]}</span></div>`);
    } else {
      cells.push(`<div class="mcell"><div class="mbar empty"></div><span>·</span></div>`);
    }
  }
  $("mood-chart").innerHTML = cells.join("");
  if (cnt) {
    const avg = sum / cnt;
    const m = MOODS[Math.min(4, Math.max(0, Math.round(avg) - 1))];
    $("mood-avg").textContent = `Ortalama: ${m[1]} ${avg.toFixed(1)}`;
  } else {
    $("mood-avg").textContent = "Henüz kayıt yok";
  }

  const favs = state.favorites.map(findItem).filter(Boolean);
  $("fav-list").innerHTML = favs.length
    ? favs.map((f) => (f.emoji ? `<button class="item" data-play="${f.id}"><div class="art" style="background:linear-gradient(135deg,#141E30,#3a4d6b)">${f.emoji}</div><div class="info"><b>${f.title}</b><span>${f.dur} dk</span></div></button>` : medItemHTML(f))).join("")
    : `<p class="muted small">Henüz favorin yok. Oynatıcıda 🤍 simgesine dokun.</p>`;
}

function renderNav() {
  document.querySelectorAll("#nav button").forEach((b) =>
    b.classList.toggle("active", b.dataset.screen === state.screen)
  );
  ["home", "explore", "sleep", "breathe", "profile"].forEach((s) =>
    $("screen-" + s).classList.toggle("hidden", s !== state.screen)
  );
}

function renderAll() {
  renderNav();
  renderHome();
  renderExplore();
  renderSleep();
  renderBreathe();
  renderProfile();
}

/* ================= TOPLU SEANSLAR (senkronu saat sağlar) ================= */
function fmtKalan(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? `${h} sa ${m} dk` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function topluDurum() {
  const simdi = new Date();
  let enYakin = null;
  for (const s of TOPLU_SEANSLAR) {
    const item = findItem(s.icerik);
    if (!item) continue;
    const [h, m] = s.saat.split(":").map(Number);
    const bas = new Date(simdi); bas.setHours(h, m, 0, 0);
    const bit = new Date(bas.getTime() + item.dur * 60000);
    if (simdi >= bas && simdi < bit) return { s, item, canli: true, kalan: 0 };
    const aday = simdi >= bit ? new Date(bas.getTime() + 86400000) : bas;
    const kalan = Math.floor((aday - simdi) / 1000);
    if (!enYakin || kalan < enYakin.kalan) enYakin = { s, item, canli: false, kalan };
  }
  return enYakin;
}
function topluKatilim(s) {
  // v2'de gerçek sayaca bağlanacak; şimdilik güne göre nefes alan simülasyon
  const j = Math.round(Math.sin(Date.now() / 90000 + s.taban) * 90);
  return (s.taban + j).toLocaleString("tr-TR");
}

/* canlı sayaç */
function liveCount() {
  const base = 2400 + Math.round(1200 * Math.sin(Date.now() / 240000));
  const jitter = Math.round(Math.random() * 60 - 30);
  const el = $("live-count");
  if (el) el.textContent = (base + jitter).toLocaleString("tr-TR");
}

/* ================= PAYWALL ================= */
function openPaywall() {
  if (LANSMAN_MODU) { toast("Lansman dönemi: tüm içerik ücretsiz 🌕"); return; }
  $("paywall").classList.remove("hidden");
}

/* ================= KAYIT (hesap oluşturma) ================= */
function openSignup() {
  $("su-email").value = state.user ? state.user.email : "";
  $("signup").classList.remove("hidden");
}
function submitSignup() {
  const email = ($("su-email").value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    toast("Geçerli bir e-posta yazmalısın ✉️");
    return;
  }
  state.user = { email, created: new Date().toISOString() };
  save();
  $("signup").classList.add("hidden");
  confetti();
  toast(`Hesabın hazır ${state.name || ""} 🎉`);
  renderProfile();
}

/* ================= ONBOARDING ================= */
function initOnboarding() {
  if (state.onboarded) return;
  $("onboarding").classList.remove("hidden");
  const show = (n) => {
    $("onboarding").classList.toggle("dawn", n === 0); // şafak fonu sadece kayıt adımında
    document.querySelectorAll(".ob-step").forEach(
      (s) => s.classList.toggle("hidden", s.dataset.step !== String(n))
    );
  };
  show(0);
  const goStep1 = () => { state.name = ($("ob-name").value || "").trim(); show(1); };
  $("ob-register").onclick = () => {
    const email = ($("ob-email").value || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast("Geçerli bir e-posta yazmalısın ✉️"); return; }
    state.user = { email, created: new Date().toISOString() };
    goStep1();
    toast("Hesabın hazır 🎉");
  };
  $("ob-skip").onclick = goStep1;
  document.querySelectorAll("#ob-goals .goal").forEach((g) => {
    g.onclick = () => g.classList.toggle("on");
  });
  $("ob-next-1").onclick = () => {
    state.goals = [...document.querySelectorAll("#ob-goals .goal.on")].map((g) => g.dataset.goal);
    show(2);
  };
  $("ob-finish").onclick = () => {
    state.reminder = $("ob-time").value || "21:00";
    state.reminders = [state.reminder];
    state.onboarded = true;
    save();
    $("onboarding").classList.add("hidden");
    renderAll();
    toast(`Hoş geldin${state.name ? " " + state.name : ""} 🌿`);
    // kayıt artık ilk adımda; atlayanlara sonraki açılışta hatırlatılır
  };
}

/* ================= EVENTS (delegasyon) ================= */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-play],[data-sound],[data-breath],[data-cat],[data-mood],[data-mixoff],[data-checkin],[data-openprog],[data-delrem],[data-delnote]");
  if (!t) return;
  if (t.dataset.play) { Player.open(t.dataset.play); return; }
  if (t.dataset.breath) { Breath.open(t.dataset.breath); return; }
  if (t.dataset.cat) { state.cat = t.dataset.cat; save(); renderExplore(); return; }
  if (t.dataset.openprog) { openProgram(t.dataset.openprog); return; }
  if (t.dataset.checkin) {
    const v = parseInt(t.dataset.checkin, 10);
    const day = todayKey();
    if (!state.checkins[day]) {
      // günün ilk check-in'i duygu günlüğüne de işlenir
      if (!state.stats.moods[day]) state.stats.moods[day] = [];
      state.stats.moods[day].push(v);
    }
    state.checkins[day] = v;
    save();
    renderHome();
    return;
  }
  if (t.dataset.delrem) {
    state.reminders.splice(parseInt(t.dataset.delrem, 10), 1);
    save(); renderProfile(); Notif.sync();
    return;
  }
  if (t.dataset.delnote) {
    state.notes.splice(parseInt(t.dataset.delnote, 10), 1);
    save(); renderProfile();
    return;
  }
  if (t.dataset.mood) {
    document.querySelectorAll("#mood-row button").forEach((b) => b.classList.toggle("on", b === t));
    return;
  }
  if (t.dataset.mixoff) { Audio_.stopChannel(t.dataset.mixoff); renderSounds(); return; }
  if (t.dataset.sound) {
    const id = t.dataset.sound;
    if (Audio_.channels[id]) { Audio_.stopChannel(id); }
    else {
      if (!Audio_.start(id, id, 0.75)) return;
      if (state.screen !== "breathe") { state.screen = "breathe"; renderNav(); }
      toast(soundName(id) + " karışıma eklendi 🎛️");
    }
    renderSounds();
  }
});

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t && t.dataset && t.dataset.vol) {
    Audio_.setVol(t.dataset.vol, Math.max(0, Math.min(100, parseInt(t.value, 10) || 0)) / 100);
  }
});

function bindStatic() {
  document.querySelectorAll("#nav button").forEach((b) => {
    b.onclick = () => { state.screen = b.dataset.screen; renderAll(); };
  });

  $("player-close").onclick = () => Player.close();
  $("player-toggle").onclick = () => Player.toggle();
  $("player-fav").onclick = () => {
    if (!Player.item) return;
    const id = Player.item.id;
    const i = state.favorites.indexOf(id);
    if (i >= 0) state.favorites.splice(i, 1); else state.favorites.push(id);
    save();
    $("player-fav").textContent = isFav(id) ? "💛" : "🤍";
    toast(isFav(id) ? "Favorilere eklendi 💛" : "Favorilerden çıkarıldı");
  };
  const ttsToggle = () => {
    state.guideOn = !state.guideOn;
    save();
    if (!state.guideOn) TTS.stopAll();
    Player.setTTSLabel();
    toast(state.guideOn ? "Sesli rehber açık 🔊" : "Sesli rehber kapalı");
  };
  $("player-tts").onclick = ttsToggle;
  $("story-tts").onclick = ttsToggle;
  $("player-voice").onclick = () => {
    state.voice = state.voice === "m" ? "f" : "m";
    save();
    Player.setTTSLabel();
    toast(state.voice === "m" ? "Erkek ses seçildi 👨" : "Kadın ses seçildi 👩");
  };

  $("done-close").onclick = () => {
    const sel = document.querySelector("#mood-row button.on");
    closeDone(sel ? parseInt(sel.dataset.mood, 10) : 0);
  };
  $("done-skip").onclick = () => closeDone(0);

  $("breath-close").onclick = () => Breath.close();
  $("breath-toggle").onclick = () => Breath.toggle();

  $("sound-stop").onclick = () => { Audio_.stopAll(); renderSounds(); };
  $("sound-timer").onchange = (e) => Audio_.setTimer(parseInt(e.target.value, 10) || 0);

  $("goal-select").onchange = (e) => {
    state.goalWeekly = parseInt(e.target.value, 10) || 5;
    save(); renderHome();
    toast(`Haftalık hedef: ${state.goalWeekly} seans 🎯`);
  };

  $("premium-chip").onclick = () => { if (!state.premium) openPaywall(); };
  $("paywall-close").onclick = () => $("paywall").classList.add("hidden");
  document.querySelectorAll(".pw-plan").forEach((p) => {
    p.onclick = () => {
      document.querySelectorAll(".pw-plan").forEach((x) => x.classList.remove("on"));
      p.classList.add("on");
    };
  });
  $("pw-trial").onclick = () => {
    state.premium = true;
    save();
    $("paywall").classList.add("hidden");
    renderAll();
    toast("Premium deneme başladı ⭐ (demo)");
  };

  $("quote-share").onclick = async () => {
    const text = $("quote-text").textContent + " — MediLuna";
    try {
      if (navigator.share) { await navigator.share({ text }); }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(text); toast("Söz panoya kopyalandı 📋"); }
      else toast("Paylaşım desteklenmiyor");
    } catch (e) { /* kullanıcı iptal etti */ }
  };

  $("rem-add").onclick = () => {
    const t = $("rem-new").value;
    if (!t) return;
    if (state.reminders.includes(t)) { toast("Bu saat zaten ekli"); return; }
    if (state.reminders.length >= 4) { toast("En fazla 4 hatırlatma saati"); return; }
    state.reminders.push(t);
    state.reminders.sort();
    save();
    renderProfile();
    Notif.sync();
    toast("Hatırlatıcı eklendi: " + t + " 🔔");
  };

  $("program-close").onclick = () => $("program").classList.add("hidden");

  $("su-btn").onclick = submitSignup;
  $("su-close").onclick = () => $("signup").classList.add("hidden");
  $("su-email").addEventListener("keydown", (e) => { if (e.key === "Enter") submitSignup(); });
  $("account-row").onclick = () => { if (!state.user) openSignup(); };

  $("reset-btn").onclick = () => {
    if (!confirm("Tüm veriler silinsin mi?")) return;
    Audio_.stopAll(false); TTS.stopAll();
    localStorage.removeItem(STORE_KEY);
    state = defaultState();
    renderAll();
    initOnboarding();
  };

  // özel çizim ikonları yerleştir (nav + statik)
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const s = ICONS[el.dataset.icon];
    if (s) el.innerHTML = s;
  });

  // duygu satırı
  $("mood-row").innerHTML = MOODS.map(
    ([v, emo, lbl]) => `<button data-mood="${v}" title="${lbl}"><span>${emo}</span><i>${lbl}</i></button>`
  ).join("");
}

/* ================= YEREL BİLDİRİM (Capacitor LocalNotifications) =================
   APK'da gerçek bildirim planlar; tarayıcıda sessizce atlanır. */
const Notif = {
  plugin() {
    try {
      return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) || null;
    } catch (e) { return null; }
  },
  async sync() {
    const p = this.plugin();
    if (!p) return;
    try {
      const perm = await p.requestPermissions();
      if (perm && perm.display && perm.display !== "granted") return;
      const pending = await p.getPending();
      if (pending && pending.notifications && pending.notifications.length) {
        await p.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
      }
      const list = [];
      let id = 1;
      state.reminders.slice(0, 4).forEach((t) => {
        const hm = t.split(":");
        list.push({
          id: id++,
          title: "MediLuna 🌙",
          body: "Küçük bir mola zamanı. Bugünkü seansın seni bekliyor.",
          schedule: { on: { hour: parseInt(hm[0], 10) || 21, minute: parseInt(hm[1], 10) || 0 }, allowWhileIdle: true },
        });
      });
      // sabah: günün sözü (uygulama her açılışta yeniden planlar, söz güncellenir)
      list.push({
        id: 900, title: "Günün Sözü ☀️",
        body: QUOTES[dayIndex(QUOTES.length)],
        schedule: { on: { hour: 8, minute: 30 }, allowWhileIdle: true },
      });
      // akşam: seri hatırlatması
      list.push({
        id: 901, title: "Serini koru 🔥",
        body: "Bugün henüz seans yapmadıysan 3 dakika bile yeter.",
        schedule: { on: { hour: 20, minute: 45 }, allowWhileIdle: true },
      });
      // toplu seanslar: 10 dk önce çağrı (kullanıcı açtıysa)
      if (state.topluBildirim) {
        let tid = 910;
        TOPLU_SEANSLAR.forEach((s) => {
          const [h, m] = s.saat.split(":").map(Number);
          let hh = h, mm = m - 10;
          if (mm < 0) { mm += 60; hh = (hh + 23) % 24; }
          list.push({
            id: tid++, title: `${s.emoji} ${s.ad} birazdan başlıyor`,
            body: `${s.saat}'te herkes aynı anda başlıyor — yerini al.`,
            schedule: { on: { hour: hh, minute: mm }, allowWhileIdle: true },
          });
        });
      }
      await p.schedule({ notifications: list });
    } catch (e) { console.warn("bildirim planlanamadı", e); }
  },
};

/* ================= SW (PWA çevrimdışı) ================= */
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW kaydolmadı", e));
  });
}

/* ================= BOOT ================= */
try {
  ensureMonthlyFreeze();
  bindStatic();
  renderAll();
  initOnboarding();
  liveCount();
  setInterval(liveCount, 5000);
  // toplu seans geri sayımı: saniyede bir sadece sayaç metni; durum değişince tam çizim
  setInterval(() => {
    const ts = topluDurum();
    if (!ts) return;
    const el = $("toplu-sayac");
    if (ts.canli && el) { renderHome(); return; }           // geri sayım bitti → canlı kart
    if (!ts.canli && !el) { renderHome(); return; }         // canlı bitti → geri sayım kartı
    if (el && !ts.canli) el.textContent = fmtKalan(ts.kalan);
  }, 1000);
  Notif.sync();
  // kayıtlı ama hesapsız kullanıcıya açılışta bir kez kayıt öner (kapatılabilir)
  if (state.onboarded && !state.user) setTimeout(openSignup, 1200);
  // ön-render seslendirme haritası (yoksa sentez TTS'e düşülür)
  fetch("tts_meta.json?v=7")
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => { TTS.meta = j || {}; })
    .catch(() => { TTS.meta = {}; });
} catch (e) {
  console.error("BOOT HATASI:", e);
  document.body.insertAdjacentHTML("beforeend", `<div style="position:fixed;top:0;left:0;right:0;background:#a33;color:#fff;padding:8px;font:12px monospace;z-index:99">${String(e)}</div>`);
}
