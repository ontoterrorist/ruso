/* Aprende ruso — lógica de la app: lecciones, repaso espaciado, voz y vistas. */
(() => {
  'use strict';

  /* ───────── estado guardado ───────── */
  const KEY = 'ruso-advance-v1';
  const DAY = 864e5;
  const DEFAULT_SET = { translit: true, trans: 'auto', autoplay: true, rate: 1, engine: 'neural', typing: true, sfx: true, voice: '', limit: 60, unlockAll: false, newWords: 10 };
  function fresh() {
    return { v: 1, name: '', g: '', started: Date.now(), done: {}, cards: {}, xp: 0, days: [], set: { ...DEFAULT_SET }, seenIntro: false };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); s.set = { ...DEFAULT_SET, ...(s.set || {}) }; return { ...fresh(), ...s }; }
    } catch (e) { /* sin almacenamiento: se juega igual, sin guardar */ }
    return fresh();
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* nada */ } updateBadge(); }

  /* ───────── utilidades de texto ───────── */
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => [...(el || document).querySelectorAll(sel)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const VOW = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* solo el género: el texto queda con sus acentos y con {name}, como lo usa el motor de voz */
  const resolveG = s => String(s).replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (m, a, b) => S.g === 'f' ? b : a);
  function resolve(s) {
    return String(s).replace(/\{name\}/g, S.name || 'amigo').replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (m, a, b) => S.g === 'f' ? b : a);
  }
  const stress = s => s.replace(/([аеёиоуыэюяАЕЁИОУЫЭЮЯ])'/g, '$1́');
  /* para mostrar: resuelve, escapa y pone acentos */
  const show = s => stress(esc(resolve(s)));
  /* para la voz y para comparar: sin marcas de acento */
  const plain = s => resolve(s).replace(/([аеёиоуыэюяАЕЁИОУЫЭЮЯ])'/g, '$1');
  const isCyr = s => /[а-яё]/i.test(s);
  function norm(s) {
    return plain(s).toLowerCase().replace(/́/g, '').replace(/ё/g, 'е').replace(/[.,!?¿¡«»"“”—–\-…:;()]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const similarity = (a, b) => { a = norm(a); b = norm(b); return 1 - lev(a, b) / Math.max(a.length, b.length, 1); };

  /* transliteración pensada para hispanohablantes: х = j, г+e/i = gu, acento en la vocal tónica */
  const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'j', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e' };
  const IOT = { е: ['e', 'ye'], ё: ['io', 'yo'], ю: ['iu', 'yu'], я: ['ia', 'ya'] };
  const ACC = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý' };
  const GO = /(^|[^а-яё])(его|него|ничего|чего|кого|того|этого|моего|твоего|всего|сегодня)(?=[^а-яё]|$)/gi;
  function translit(src) {
    let s = resolve(src).replace(GO, (m, a, w) => a + w.replace(/г/i, c => c === 'Г' ? 'В' : 'в'));
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], lo = ch.toLowerCase();
      if (ch === "'") continue;
      const stressed = s[i + 1] === "'" || lo === 'ё';
      const prev = (s[i - 1] || '').toLowerCase();
      let t;
      if (IOT[lo]) {
        const afterCons = /[бвгджзйклмнпрстфхцчшщ]/.test(prev);
        t = IOT[lo][afterCons ? 0 : 1];
      } else if (lo in TR) {
        t = TR[lo];
        if (lo === 'г' && /[еиэ]/i.test(s[i + 1] || '')) t = 'gu';
      } else { out += ch; continue; }
      if (stressed && t) { const k = t.length - 1; t = t.slice(0, k) + (ACC[t[k]] || t[k]); }
      if (ch !== lo && t) t = t[0].toUpperCase() + t.slice(1);
      out += t;
    }
    return out;
  }
  /* ruso con transliteración opcional debajo */
  /* en la lección de lectura (la 0) no se muestra la transliteración: el ejercicio es leer cirílico */
  let readingMode = false;
  const ruHTML = (s, cls) => '<span class="ru ' + (cls || '') + '">' + show(s) + '</span>' + (S.set.translit && !readingMode && isCyr(s) ? '<span class="tr">' + esc(translit(s)) + '</span>' : '');
  /* textos propios con HTML (notas, frases de Masha): solo se escapa el nombre; el ruso entre [[ ]] se vuelve tocable */
  const rich = s => stress(resolve(String(s).replace(/\{name\}/g, esc(S.name || 'amigo')))).replace(/\[\[(.+?)\]\]/g, (m, t) => '<span class="say" data-say="' + esc(t) + '">' + t + '</span>');

  /* ───────── voz ───────── */
  const synth = window.speechSynthesis;
  let ruVoices = [];
  function loadVoices() {
    if (!synth) return;
    ruVoices = synth.getVoices().filter(v => /^ru/i.test(v.lang));
  }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }
  function voice() {
    if (!ruVoices.length) return null;
    if (S.set.voice) { const v = ruVoices.find(v => v.name === S.set.voice); if (v) return v; }
    return ruVoices.find(v => /milena|katya|svetlana|dariya|irina|alena|google/i.test(v.name)) || ruVoices[0];
  }
  /* voz del navegador: respaldo cuando falta un audio, y para el nombre de quien estudia */
  function browserSay(text, opt) {
    opt = opt || {};
    if (!synth || !text || !ruVoices.length && !/[a-z]/i.test(text)) { if (opt.done) setTimeout(opt.done, 10); return; }
    const u = new SpeechSynthesisUtterance(plain(text).replace(/…/g, ', '));
    u.lang = 'ru-RU';
    const v = voice(); if (v) u.voice = v;
    u.rate = (S.set.rate || 1) * 0.85;
    u.pitch = opt.pitch || 1;
    let ended = false, started = false;
    const end = () => { if (ended) return; ended = true; clearTimeout(guard); if (opt.masha) M.talk(false); if (opt.done) opt.done(); };
    /* algunos navegadores (Safari en iPhone) ignoran la voz del sistema fuera de un toque y no avisan:
       si no empieza o no termina a tiempo, se sigue igual para que nada se quede colgado */
    let guard = setTimeout(() => { if (!started) end(); }, 2500);
    u.onstart = () => {
      started = true; if (opt.masha) M.talk(true);
      clearTimeout(guard); guard = setTimeout(end, 4000 + u.text.length * 150);
    };
    u.onend = end; u.onerror = end;
    synth.speak(u);
  }

  /* Motor de voz: cada frase del curso tiene su audio, generado con voces neuronales rusas (Piper)
     y con la sílaba tónica que marca el curso. El archivo se encuentra por un hash de «voz|texto». */
  function cyrb53(str, seed) {
    seed = seed || 0;
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  const voiceId = v => v === 'user' ? (S.g === 'f' ? 'user_f2' : 'user_m') : (v || 'masha');
  /* Un solo reproductor para todas las frases. En iPhone, Safari solo deja sonar audio que nace de un toque;
     un reproductor que ya sonó una vez tras un toque puede volver a sonar después sin problemas. */
  const player = new Audio();
  player.preload = 'auto';
  const SILENCIO = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAABAAAAlgAenp6enp6enp6enp6enp6enp6enp6enp6pqampqampqampqampqampqampqampqamptPT09PT09PT09PT09PT09PT09PT09PT09P/////////////////////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQCcQAAAAAAAAJY+/rsqgAAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
  let voiceToken = 0, audioUnlocked = false, warnedBlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    if (!player.src || player.src === location.href) {
      player.src = SILENCIO;
      const p = player.play();
      if (p) p.catch(() => {});
    }
  }
  ['touchend', 'mousedown', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
  /* guarda en el teléfono los audios que ya sonaron, para usarlos sin conexión */
  function keepAudio(url) {
    try { if (window.caches) caches.open('ruso-advance-audio').then(c => c.match(url).then(h => h || c.add(url))).catch(() => {}); } catch (e) { /* nada */ }
  }
  function stopVoice() {
    voiceToken++;
    player.onplaying = player.onended = player.onerror = null;
    try { player.pause(); } catch (e) { /* nada */ }
    if (synth) synth.cancel();
    M.talk(false);
  }
  function speak(text, opt) {
    opt = opt || {};
    stopVoice();
    if (!text) { if (opt.done) opt.done(); return; }
    audioUnlocked = true;
    const token = voiceToken, vid = voiceId(opt.voice);
    const masha = opt.masha !== undefined ? opt.masha : vid === 'masha';
    const report = opt.report || (() => {});
    const raw = resolveG(String(text).replace(/\u0301/g, "'"));
    const queue = [];
    raw.split('{name}').forEach((part, i) => {
      if (i > 0 && S.name) queue.push({ name: S.name });
      const t = part.trim();
      if (isCyr(t)) queue.push({ text: t });
    });
    let i = 0;
    const next = () => {
      if (token !== voiceToken) return;
      if (i >= queue.length) { if (masha) M.talk(false); if (opt.done) opt.done(); return; }
      const q = queue[i++];
      const fallback = why => {
        if (token !== voiceToken) return;
        if (why) report(false, why);
        browserSay(q.name || q.text, { done: next, masha, pitch: opt.pitch });
      };
      /* con el motor de Masha, el nombre de quien estudia se deja como una pausa breve */
      if (q.name && S.set.engine !== 'browser') return setTimeout(next, 250);
      if (q.name || S.set.engine === 'browser') return fallback();
      const url = 'audio/' + cyrb53(vid + '|' + q.text) + '.mp3';
      player.onplaying = () => { if (token !== voiceToken) return; if (masha) M.talk(true); report(true); };
      player.onended = () => { if (token !== voiceToken) return; if (masha) M.talk(false); keepAudio(url); next(); };
      player.onerror = () => fallback('no se pudo cargar el audio (error ' + (player.error ? player.error.code : '?') + ')');
      player.src = url;
      player.defaultPlaybackRate = player.playbackRate = S.set.rate || 1;
      const p = player.play();
      if (p) p.catch(err => {
        if (token !== voiceToken || !err || err.name === 'AbortError') return;
        if (err.name === 'NotAllowedError') {
          if (masha) M.talk(false);
          report(false, 'el navegador bloqueó el sonido');
          if (!warnedBlocked) { warnedBlocked = true; toast('Toca 🔊 para oír la frase'); }
        } else fallback(err.name);
      });
    };
    next();
  }
  const PITCH = { olga: 0.8, waiter: 0.6, seller: 1.1, doctor: 0.7 };

  /* reconocimiento de voz (solo algunos navegadores) */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function listen(expected, cb) {
    if (!SR) return cb(-1);
    let r;
    try { r = new SR(); } catch (e) { return cb(-1); }
    r.lang = 'ru-RU'; r.maxAlternatives = 5; r.interimResults = false;
    let got = false;
    r.onresult = e => {
      got = true;
      const alts = [...e.results[0]].map(a => a.transcript);
      let best = 0, heard = alts[0] || '';
      alts.forEach(a => { const sc = similarity(a, expected); if (sc > best) { best = sc; heard = a; } });
      cb(best, heard);
    };
    r.onerror = () => { if (!got) { got = true; cb(-1); } };
    r.onend = () => { if (!got) cb(-2); };
    try { r.start(); } catch (e) { cb(-1); }
  }

  /* ───────── sonidos ───────── */
  let actx;
  function sfx(kind) {
    if (!S.set.sfx) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { ok: [660, 990], bad: [260, 196], done: [523, 659, 784, 1047] }[kind] || [440];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.09;
        o.type = kind === 'bad' ? 'triangle' : 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.18);
      });
    } catch (e) { /* sin audio */ }
  }

  /* ───────── Masha ───────── */
  const M = Masha.mount($('#avatar'));
  function say(text, expr, raw) {
    $('#bubble').innerHTML = '<span class="who">Маша</span>' + (raw ? text : rich(text));
    M.set(expr || 'neutral');
  }
  const line = (k, vars) => { let t = pick(LINES[k]); for (const v in vars || {}) t = t.replace('{' + v + '}', vars[v]); return t; };

  /* ───────── tarjetas ───────── */
  const CARDS = {};
  const LESSON_IDX = {};
  LESSONS.forEach((L, li) => {
    LESSON_IDX[L.id] = li;
    L.phrases.forEach((p, i) => { CARDS['p:' + L.id + ':' + i] = { t: 'p', L, ru: p[0], es: p[1], note: p[2] }; });
    let last = null;
    L.dialog.forEach((st, i) => {
      if (st.ru) last = st;
      if (st.u && last && st.u.length > (st.k || 1)) CARDS['c:' + L.id + ':' + i] = { t: 'c', L, prompt: last, u: st.u, k: st.k || 1 };
    });
    CARDS['g:' + L.grammar.id] = { t: 'g', L, G: L.grammar };
  });
  ALPHABET.forEach((a, i) => { CARDS['a:' + i] = { t: 'a', a, i }; });
  const lessonCards = L => Object.keys(CARDS).filter(id => CARDS[id].L === L);
  const GRAMMAR = {};
  LESSONS.forEach(L => { GRAMMAR[L.grammar.id] = L; });

  /* tres modalidades: diálogos (frases y conversación), palabras y gramática (con el alfabeto) */
  const MODE_OF = id => id[0] === 'v' ? 'words' : id[0] === 'g' || id[0] === 'a' ? 'grammar' : 'conv';
  const MODES = { conv: 'Diálogos', words: 'Palabras', grammar: 'Gramática' };

  /* ───────── palabras: 6000, en un archivo aparte que se carga al usarlas ───────── */
  let VOCAB = null, vocabLoading = null;
  function ensureVocab() {
    if (VOCAB) return Promise.resolve();
    if (vocabLoading) return vocabLoading;
    vocabLoading = new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = 'vocab/palabras.js';
      s.onload = () => {
        VOCAB = window.VOCAB.map((r, i) => ({ t: 'v', i, ru: r[0], es: r[1], pos: r[2], note: r[3], ex: r[4], exes: r[5], k: r[6] }));
        VOCAB.forEach(w => { CARDS['v:' + w.ru] = w; });
        updateBadge(); ok();
      };
      s.onerror = () => { vocabLoading = null; ko(); };
      document.head.appendChild(s);
    });
    return vocabLoading;
  }
  const wordsKnown = () => Object.keys(S.cards).filter(id => id[0] === 'v').length;
  const POS = { 'sust m': 'sustantivo masculino', 'sust f': 'sustantivo femenino', 'sust n': 'sustantivo neutro', 'sust pl': 'sustantivo plural',
    'verbo impf': 'verbo imperfectivo', 'verbo pf': 'verbo perfectivo', 'verbo impf/pf': 'verbo imperfectivo y perfectivo', adj: 'adjetivo', adv: 'adverbio',
    pron: 'pronombre', prep: 'preposición', conj: 'conjunción', part: 'partícula', num: 'numeral', interj: 'interjección', pred: 'predicativo' };
  const posName = p => POS[p] || p;

  /* ───────── repetición espaciada (variante simple de SM-2) ───────── */
  const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const dueIn = days => dayStart(Date.now()) + days * DAY + 3 * 3600e3;
  const newCard = () => ({ ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: Date.now(), re: false });
  /* q: 0 otra vez · 1 difícil · 2 bien · 3 fácil */
  function nextState(c, q, noFuzz) {
    const n = { ...c, reps: c.reps + 1 };
    if (q === 0) {
      n.lapses++; n.ease = Math.max(1.3, n.ease - 0.2);
      n.ivl = n.ivl >= 1 ? Math.max(1, Math.round(n.ivl * 0.4)) : 0;
      n.due = Date.now() + 10 * 60e3; n.re = true;
      return n;
    }
    let ivl;
    if (n.ivl < 1) ivl = q === 3 ? 3 : 1;
    else if (n.re) ivl = Math.max(1, n.ivl) + (q === 3 ? 1 : 0);
    else if (q === 1) { ivl = Math.max(n.ivl + 1, Math.round(n.ivl * 1.2)); n.ease = Math.max(1.3, n.ease - 0.15); }
    else if (q === 2) ivl = Math.max(n.ivl + 1, Math.round(n.ivl * n.ease));
    else { ivl = Math.max(n.ivl + 2, Math.round(n.ivl * n.ease * 1.3)); n.ease += 0.15; }
    if (!noFuzz && ivl > 4) ivl = Math.round(ivl * (0.95 + Math.random() * 0.1));
    n.ivl = Math.min(ivl, 365); n.re = false; n.due = dueIn(n.ivl);
    return n;
  }
  const fmtIvl = d => d < 1 ? '10 min' : d === 1 ? '1 día' : d < 30 ? d + ' días' : d < 365 ? Math.round(d / 30) + ' mes' + (Math.round(d / 30) > 1 ? 'es' : '') : '1 año';
  function grade(id, q) {
    S.cards[id] = nextState(S.cards[id] || newCard(), q);
  }
  const dueIds = mode => Object.keys(S.cards).filter(id => CARDS[id] && S.cards[id].due <= Date.now() && (!mode || MODE_OF(id) === mode)).sort((a, b) => S.cards[a].due - S.cards[b].due);
  function updateBadge() {
    const n = dueIds().length, b = $('#badge');
    if (!b) return;
    b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
  }
  function markDay() {
    const t = new Date().toLocaleDateString('sv');
    if (!S.days.includes(t)) S.days.push(t);
    if (S.days.length > 400) S.days = S.days.slice(-400);
  }
  function streak() {
    const set = new Set(S.days); let n = 0; const d = new Date();
    if (!set.has(d.toLocaleDateString('sv'))) d.setDate(d.getDate() - 1);
    while (set.has(d.toLocaleDateString('sv'))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ───────── lecciones: desbloqueo ───────── */
  const isDone = L => !!S.done[L.id];
  const lessonNum = L => parseInt(L.id.slice(1), 10);
  /* la lección 0 (alfabeto) es la primera para quien empieza; quien ya avanzó puede hacerla cuando quiera */
  const started = () => LESSONS.some(L => L.level > 0 && isDone(L));
  const nextLesson = () => LESSONS.find(L => !isDone(L) && !(L.level === 0 && started()));
  /* la clase 0 se puede saltar: la primera lección del nivel 1 siempre está abierta */
  const unlocked = L => S.set.unlockAll || isDone(L) || L === nextLesson() || L.level === 0 || L === LESSONS.find(x => x.level > 0);

  /* ───────── navegación ───────── */
  const main = $('#main');
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function route() {
    readingMode = false;
    if (synth) synth.cancel();
    M.talk(false);
    if (!S.name || !S.g) return renderOnboard();
    const h = location.hash.slice(1) || 'home';
    const [r, arg] = h.split('/');
    const navR = r === 'lesson' ? 'path' : r === 'notes' ? 'grammar' : r;
    $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === navR));
    if (r === 'lesson' && LESSON_IDX[arg] != null) renderLesson(LESSONS[LESSON_IDX[arg]]);
    else if (r === 'path') renderPath();
    else if (r === 'review') renderReview(MODES[arg] ? arg : '');
    else if (r === 'words') renderWords(arg);
    else if (r === 'grammar' || r === 'notes') renderGrammar(arg);
    else if (r === 'settings') renderSettings();
    else renderHome();
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* atajos de teclado: 1-4 eligen, Intro sigue, Espacio repite el audio */
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement.tagName === 'BUTTON' && !document.activeElement.disabled) return;
    if (e.key === 'Enter') {
      if (typing && document.activeElement.classList.contains('type-in')) return;
      const b = $$('[data-enter]', main).filter(b => !b.disabled && b.offsetParent).pop();
      if (b) { e.preventDefault(); b.click(); }
      return;
    }
    if (typing) return;
    if (/^[1-9]$/.test(e.key)) {
      const c = $$('.choice:not(:disabled), .grades .btn', main).filter(b => b.offsetParent);
      const b = c.find(b => b.dataset.k === e.key);
      if (b) { e.preventDefault(); b.click(); }
    } else if (e.key === ' ') {
      const b = $('[data-replay]', main);
      if (b) { e.preventDefault(); b.click(); }
    }
  });
  /* cualquier [data-say] dice su texto */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-say]');
    if (t) speak(t.dataset.say, { voice: t.dataset.voice || 'masha' });
  });

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  const sayBtn = (text, extra, voice) => '<button class="icon-btn" data-say="' + esc(resolveG(text)) + '" data-voice="' + (voice || 'masha') + '" ' + (extra || '') + ' aria-label="Escuchar" title="Escuchar">🔊</button>';

  /* ───────── bienvenida ───────── */
  function renderOnboard() {
    $$('#nav a').forEach(a => a.classList.remove('on'));
    if (!S.name) {
      say('Привет. Soy Masha. Voy a ser tu profesora de ruso. Primero lo primero: ¿cómo te llamas?', 'neutral');
      main.innerHTML = `<div class="card onboard"><div class="kicker">Bienvenida</div><h1>Aprende ruso</h1>
        <p>Vas a aprender ruso <b>conversando</b>: cada lección es una charla con Masha, unas frases clave y una idea pequeña de gramática. Después, el <b>repaso espaciado</b> te vuelve a preguntar cada cosa justo cuando estás a punto de olvidarla.</p>
        <label for="nm"><b>¿Cómo te llamas?</b></label>
        <input type="text" id="nm" maxlength="24" autocomplete="given-name" placeholder="Tu nombre">
        <button class="btn primary big wide" id="ok" data-enter>Seguir</button></div>`;
      const inp = $('#nm'); inp.focus();
      const ok = () => { const v = inp.value.trim(); if (!v) { say('Un nombre. Cualquiera. Hasta «Pelmén» sirve, pero ese ya está ocupado.', 'annoyed'); return; } S.name = v; save(); renderOnboard(); };
      $('#ok').onclick = ok;
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
      return;
    }
    say('Очень приятно, {name}. Pregunta importante: en ruso el pasado y algunos adjetivos cambian si eres hombre o mujer. «Я был» o «я была». ¿Cómo te hablo?', 'smirk');
    main.innerHTML = `<div class="card onboard"><div class="kicker">Una pregunta de gramática</div><h2>¿En masculino o en femenino?</h2>
      <p class="muted">Solo cambia las formas rusas que dices tú (я был / я была, я согласен / я согласна). Puedes cambiarlo luego en Ajustes.</p>
      <div class="choice-row"><button class="btn big" data-g="m">Masculino<br><small class="ru">я был</small></button><button class="btn big" data-g="f">Femenino<br><small class="ru">я была́</small></button></div></div>`;
    $$('[data-g]').forEach(b => b.onclick = () => {
      S.g = b.dataset.g; save();
      go('#home');
    });
  }

  /* ───────── inicio ───────── */
  function greeting() {
    const h = new Date().getHours();
    return pick(LINES[h < 5 ? 'night' : h < 12 ? 'morning' : h < 19 ? 'day' : h < 23 ? 'evening' : 'night']);
  }
  function renderHome() {
    const ids = dueIds(), due = ids.length, nl = nextLesson(), inDeck = Object.keys(S.cards).length;
    const dueOf = m => ids.filter(id => MODE_OF(id) === m).length;
    const mature = Object.values(S.cards).filter(c => c.ivl >= 21).length;
    const st = streak(), nw = wordsKnown();
    const gSeen = Object.keys(S.cards).filter(id => id[0] === 'g').length;
    if (!S.seenIntro) { say('Hay tres caminos. Diálogos: conversas conmigo. Palabras: las seis mil más usadas, de diez en diez. Gramática: las reglas, con tablas. Lo que aprendes vuelve al repaso justo antes de que lo olvides. Simple. Como yo.', 'smirk'); S.seenIntro = true; save(); }
    else if (due >= 25) say(line('manyDue', { n: due }), 'annoyed');
    else if (!due && inDeck) say(line('noDue'), 'pleased');
    else if (S.days.length && !S.days.includes(new Date().toLocaleDateString('sv')) && Math.random() < 0.5) say(pick(LINES.back), 'smirk');
    else say(greeting(), 'neutral');

    /* previsión de 7 días */
    const fc = [];
    for (let d = 0; d < 7; d++) {
      const end = dayStart(Date.now()) + (d + 1) * DAY + 3 * 3600e3;
      const start = d === 0 ? -Infinity : end - DAY;
      fc.push(Object.values(S.cards).filter(c => c.due > start && c.due <= end).length);
    }
    const max = Math.max(1, ...fc);
    const days = ['hoy', 'mañ.', ...[2, 3, 4, 5, 6].map(i => { const d = new Date(Date.now() + i * DAY); return ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'][d.getDay()]; })];
    const dueChip = m => dueOf(m) ? '<span class="due-chip">' + dueOf(m) + ' por repasar</span>' : '';

    main.innerHTML = `
      <div class="kicker">Привет, ${esc(S.name)}</div>
      <div class="card review-card">
        <div class="grow"><div class="kicker">Repaso de hoy</div>
          <div class="big-num">${due}</div>
          <p class="muted">${due ? Object.keys(MODES).filter(dueOf).map(m => MODES[m] + ' ' + dueOf(m)).join(' · ') : inDeck ? 'nada pendiente por ahora' : 'aún no tienes tarjetas: elige por dónde empezar'}</p></div>
        <button class="btn ${due ? 'primary' : ''}" id="goRev" ${due ? 'data-enter' : 'disabled'}>Repasar todo</button>
      </div>
      <div class="modes">
        <div class="card mode">
          <div class="kicker">Diálogos ${dueChip('conv')}</div>
          <h2>Conversaciones con Masha</h2>
          <p class="muted small">${LESSONS.length} lecciones: una charla, frases clave y una idea de gramática.</p>
          ${nl ? `<p><span class="muted small">Lección ${lessonNum(nl)}</span><br><b class="ru">${show(nl.ru)}</b> · ${esc(nl.es)}</p>
          <button class="btn ${due ? '' : 'primary'} wide" id="goLes" ${due ? '' : 'data-enter'}>Empezar lección</button>`
          : '<p>Terminaste todas las lecciones. Puedes repetir cualquier conversación.</p><button class="btn wide" id="goPath">Ver lecciones</button>'}
        </div>
        <div class="card mode">
          <div class="kicker">Palabras y frases ${dueChip('words')}</div>
          <h2>Las 6000 palabras más usadas</h2>
          <p class="muted small">De la más frecuente a la menos, cada una con su frase de ejemplo.</p>
          <p><b>${nw}</b> <span class="muted">de 6000</span></p><div class="pbar"><i style="width:${Math.min(100, nw / 60)}%"></i></div>
          <button class="btn wide" id="goWords">Aprender ${S.set.newWords} palabras</button>
        </div>
        <div class="card mode">
          <div class="kicker">Gramática ${dueChip('grammar')}</div>
          <h2>Las reglas, una a una</h2>
          <p class="muted small">${GTOPICS.length} temas, ${LESSONS.length} explicaciones con ejercicios y tablas para consultar.</p>
          <p><b>${gSeen}</b> <span class="muted">de ${LESSONS.length} en tu repaso</span></p><div class="pbar"><i style="width:${Math.round(gSeen / LESSONS.length * 100)}%"></i></div>
          <button class="btn wide" id="goGram">Ver los temas</button>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat"><b>${st}</b><span>${st === 1 ? 'día' : 'días'} de racha</span></div>
        <div class="stat"><b>${S.xp}</b><span>XP</span></div>
        <div class="stat"><b>${inDeck}</b><span>tarjetas aprendidas</span></div>
        <div class="stat"><b>${mature}</b><span>dominadas (21+ días)</span></div>
      </div>
      ${inDeck ? `<div class="card dark"><h3>Próximos 7 días</h3><div class="forecast">${fc.map((n, i) => `<div><span>${n || ''}</span><i style="height:${Math.round(n / max * 44)}px"></i>${days[i]}</div>`).join('')}</div></div>` : ''}
      <div class="card dark small"><b>Cómo funciona.</b> Elige cada día lo que quieras: una conversación, una tanda de palabras o un tema de gramática. Todo lo que practicas entra al <b>repaso</b>: si aciertas, la tarjeta vuelve más tarde (1 día, 3, 8, 20…); si fallas, vuelve pronto. Unos minutos al día bastan.</div>`;
    $('#goRev').onclick = () => go('#review');
    const l = $('#goLes'); if (l) l.onclick = () => go('#lesson/' + nl.id);
    const p = $('#goPath'); if (p) p.onclick = () => go('#path');
    $('#goWords').onclick = () => go('#words/learn');
    $('#goGram').onclick = () => go('#grammar');
  }

  /* ───────── lista de lecciones ───────── */
  function renderPath() {
    const nl = nextLesson();
    say(nl ? 'Las lecciones van en orden. Cada una abre la siguiente. Sí, como un videojuego. No, no hay jefe final. Bueno, yo.' : 'Todo terminado. Puedes repetir cualquier conversación. Te reto a hacerlo sin traducción.', 'smirk');
    const openLv = nl ? nl.level : LEVELS.length;
    main.innerHTML = LEVELS.map(lv => {
      const ls = LESSONS.filter(L => L.level === lv.id), nd = ls.filter(isDone).length;
      return `<details class="level" ${lv.id === openLv ? 'open' : ''}>
        <summary class="level-head"><h2>Nivel ${lv.id} · <span class="ru">${show(lv.ru)}</span></h2><span class="muted small grow">${esc(lv.es)} — ${esc(lv.note)}</span>
          <span class="lv-prog" title="${nd} de ${ls.length}"><i style="width:${Math.round(nd / ls.length * 100)}%"></i></span><b class="small">${nd}/${ls.length}</b></summary>
        <div class="lessons">${ls.map(L => {
          const i = lessonNum(L), d = isDone(L), u = unlocked(L);
          return `<button class="lesson-tile ${d ? 'done' : ''} ${L === nl ? 'next' : ''} ${u ? '' : 'locked'}" data-l="${L.id}" ${u ? '' : 'aria-disabled="true"'}>
            <span class="n">${i}</span><span class="st">${d ? '✓ hecha' : L === nl ? '▶ siguiente' : u ? '' : '🔒'}</span>
            <span class="t">${show(L.ru)}</span><span class="s">${esc(L.es)}</span></button>`;
        }).join('')}</div>
      </details>`;
    }).join('');
    const cur = $('details[open] .next');
    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center' }), 50);
    $$('[data-l]').forEach(b => b.onclick = () => {
      const L = LESSONS[LESSON_IDX[b.dataset.l]];
      if (!unlocked(L)) { say('Esa todavía no. Primero «' + show(nextLesson().ru) + '». Paciencia. Es una virtud rusa. Bueno, más o menos.', 'annoyed', true); return; }
      go('#lesson/' + L.id);
    });
  }

  /* ───────── lección ───────── */
  const STAGES = ['Escena', 'Diálogo', 'Frases', 'Gramática', 'Práctica'];
  function stepsBar(k) { return '<div class="steps" aria-label="Paso ' + (k + 1) + ' de 5">' + STAGES.map((s, i) => '<span class="' + (i < k ? 'done' : i === k ? 'on' : '') + '" title="' + s + '"></span>').join('') + '</div>'; }
  function lessonHead(L, k) {
    return stepsBar(k) + '<div class="kicker">Lección ' + lessonNum(L) + ' · ' + STAGES[k] + '</div>';
  }

  function renderLesson(L) {
    if (!unlocked(L)) { go('#path'); return; }
    stageScene(L);
  }

  function stageScene(L) {
    say(L.intro, 'smirk');
    main.innerHTML = lessonHead(L, 0) + `
      <div class="card"><div class="lesson-title"><h1 class="ru">${show(L.ru)}</h1><span class="muted">${esc(L.es)}</span></div>
      <p class="scene">${esc(resolve(L.scene))}</p>
      <p class="muted small">Primero, la conversación. Elige tus respuestas. Toca 🔊 para oír cualquier frase.</p>
      <button class="btn primary big" data-enter id="go">Empezar la conversación</button></div>`;
    $('#go').onclick = () => stageDialog(L);
  }

  function stageDialog(L) {
    const hideTrans = S.set.trans === 'hide' || (S.set.trans === 'auto' && L.level > 1);
    let showOpts = !hideTrans;
    let i = 0, mistakes = 0, hidden = null;
    readingMode = !!L.reading;
    main.innerHTML = lessonHead(L, 1) + `<div class="card"><div class="toolbar">
        <button class="chip ${showOpts ? 'on' : ''}" id="tt">Traducción</button>
        <button class="chip ${S.set.translit ? 'on' : ''}" id="tl">Transliteración</button></div>
      <div class="chat" id="chat"></div><div id="act"></div></div>`;
    const chat = $('#chat'), act = $('#act');
    $('#tt').onclick = e => { showOpts = !showOpts; e.target.classList.toggle('on', showOpts); $$('.msg .es', chat).forEach(x => x.classList.toggle('hid', !showOpts)); $$('.choice .es').forEach(x => x.hidden = !showOpts); };
    $('#tl').onclick = e => { S.set.translit = !S.set.translit; save(); e.target.classList.toggle('on', S.set.translit); toast(S.set.translit ? 'Transliteración activada' : 'Transliteración desactivada'); };

    function bubble(st, me) {
      const who = me ? esc(S.name) : st.who ? show(SPEAKERS[st.who].name) : 'Маша';
      const d = document.createElement('div');
      d.className = 'msg' + (me ? ' me' : '');
      /* en la lección de lectura, Masha dice la palabra y no se ve escrita hasta que eliges la correcta */
      const ruPart = st.hide && L.reading ? '<span class="ru hide-slot">🔊 · · ·</span>' : ruHTML(st.ru);
      d.innerHTML = '<div class="head">' + who + '</div><div class="line"><div class="grow">' + ruPart +
        '<span class="es ' + (showOpts || L.reading ? '' : 'hid') + '" title="Toca para ver">' + esc(resolve(st.es)) + '</span></div>' +
        sayBtn(st.ru, '', me ? 'user' : (st.who || 'masha')) + '</div>';
      const es = $('.es', d); es.onclick = () => es.classList.remove('hid');
      chat.appendChild(d);
      d.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (st.hide && L.reading) hidden = { d, st };
      return d;
    }
    function step() {
      act.innerHTML = '';
      if (i >= L.dialog.length) return finish();
      const st = L.dialog[i];
      if (st.n) {
        const d = document.createElement('div'); d.className = 'narr'; d.textContent = resolve(st.n); chat.appendChild(d);
        i++; return step();
      }
      if (st.ru) {
        bubble(st);
        if (!st.who) M.set(st.e || 'neutral');
        if (S.set.autoplay) speak(st.ru, { voice: st.who || 'masha', pitch: PITCH[st.who] });
        i++;
        if (L.dialog[i] && L.dialog[i].u) return step();
        act.innerHTML = '<div class="row" style="margin-top:14px"><button class="btn primary" data-enter id="nx">Siguiente ▸</button></div>';
        $('#nx').onclick = step;
        return;
      }
      if (st.u) return turn(st);
    }
    function turn(st) {
      const k = st.k || 1;
      const opts = shuffle(st.u.map((o, j) => ({ ru: o[0], es: o[1], c: o[2], ok: j < k })));
      act.innerHTML = '<div class="choices">' + opts.map((o, j) =>
        '<button class="choice" data-k="' + (j + 1) + '" data-j="' + j + '">' + ruHTML(o.ru) + '<span class="es" ' + (showOpts && !L.reading ? '' : 'hidden') + '>' + esc(resolve(o.es)) + '</span></button>').join('') + '</div>';
      $$('.choice', act).forEach(b => b.onclick = () => {
        const o = opts[+b.dataset.j];
        if (!o.ok) {
          mistakes++; b.classList.add('bad'); b.disabled = true; sfx('bad');
          say(o.c || line('wrong'), pick(['annoyed', 'eyeroll']));
          return;
        }
        sfx('ok');
        $$('.choice', act).forEach(x => x.disabled = true);
        if (hidden) { const slot = $('.hide-slot', hidden.d); if (slot) slot.outerHTML = ruHTML(hidden.st.ru); hidden = null; }
        const d = bubble({ ru: o.ru, es: o.es }, true);
        if (S.set.autoplay) speak(o.ru, { voice: 'user' });
        if (o.c) say(o.c, pick(['smirk', 'pleased']));
        else if (Math.random() < 0.35) say(line('right'), 'pleased');
        else say(pick(['Bien.', 'Ajá.', 'Хорошо.', 'Sigue.', 'Да. Eso.', 'Ну да.', 'Vale.']), pick(['neutral', 'pleased']));
        i++;
        const after = document.createElement('div');
        after.className = 'row';
        after.style.marginTop = '14px';
        after.innerHTML = (SR ? '<button class="btn ghost mic" id="mic">🎤 Dilo tú</button>' : '') + '<span class="grow"></span><button class="btn primary" data-enter id="nx">Siguiente ▸</button>';
        act.innerHTML = ''; act.appendChild(after);
        $('#nx').onclick = step;
        const mic = $('#mic');
        if (mic) mic.onclick = () => {
          if (synth) synth.cancel();
          mic.classList.add('mic-on'); mic.textContent = '🎤 Escuchando…';
          listen(o.ru, (sc, heard) => {
            mic.classList.remove('mic-on'); mic.textContent = '🎤 Otra vez';
            if (sc === -1) say('Tu navegador no me deja escucharte. O no le diste permiso al micrófono. Tímido.', 'eyeroll');
            else if (sc === -2) say('No oí nada. ¿Hablaste? ¿O solo moviste los labios?', 'annoyed');
            else if (sc >= 0.8) say('Oí «' + esc(heard) + '». ' + pick(['Casi nativo. Casi.', 'Bien dicho. Pelmén giró una oreja.', 'Хорошо. Se entendió todo.']), 'happy', true);
            else if (sc >= 0.5) say('Oí «' + esc(heard) + '». Se entiende. Más o menos. Escucha otra vez y repite.', 'smirk', true);
            else say('Oí «' + esc(heard) + '». Eso… no era la frase. Escúchala y prueba otra vez.', 'annoyed', true);
          });
        };
      });
    }
    function finish() {
      const good = mistakes === 0;
      say(good ? 'Conversación sin un solo error. Sospechoso. Muy bien.' : mistakes <= 2 ? 'Bien. Algunos tropiezos, pero llegamos.' : 'Llegamos al final. Con ' + mistakes + ' errores, pero llegamos. Para eso es la práctica.', good ? 'happy' : 'smirk');
      act.innerHTML = '<div class="row" style="margin-top:16px"><button class="btn ghost" id="again">↺ Repetir diálogo</button><span class="grow"></span><button class="btn primary" data-enter id="nx">Frases clave ▸</button></div>';
      $('#again').onclick = () => stageDialog(L);
      $('#nx').onclick = () => stagePhrases(L);
    }
    step();
  }

  function stagePhrases(L) {
    readingMode = false;
    say('Estas son las frases que importan. Escúchalas. Repítelas en voz alta. Sí, en voz alta. Nadie te oye. Bueno, Pelmén.', 'neutral');
    main.innerHTML = lessonHead(L, 2) + `<div class="card">
      <div class="row" style="margin-bottom:6px"><h2 class="grow" style="margin:0">Frases clave</h2><button class="btn ghost" id="all">🔊 Todas</button></div>
      ${L.phrases.map(p => `<div class="phrase">${sayBtn(p[0])}<div class="grow">${ruHTML(p[0])}<span class="es">${esc(resolve(p[1]))}</span>${p[2] ? '<span class="note">' + esc(p[2]) + '</span>' : ''}</div></div>`).join('')}
      <div class="row" style="margin-top:16px"><span class="grow"></span><button class="btn primary" data-enter id="nx">Gramática ▸</button></div></div>`;
    $('#nx').onclick = () => stageGrammar(L);
    $('#all').onclick = () => {
      let j = 0;
      const next = () => { if (j < L.phrases.length && location.hash.includes(L.id)) speak(L.phrases[j++][0], { done: () => setTimeout(next, 450) }); };
      next();
    };
  }

  function stageGrammar(L) {
    const G = L.grammar;
    say('Una idea de gramática. Solo una. Volverá en el repaso, así que no hace falta memorizarla hoy. Entiéndela y ya.', 'neutral');
    main.innerHTML = lessonHead(L, 3) + `<div class="card"><div class="kicker">Gramática</div><h2>${show(G.title)}</h2>
      <div class="grammar-body">${rich(G.body)}</div>
      <p class="muted small">Toca las palabras resaltadas para oírlas.</p>
      <div class="row" style="margin-top:16px"><span class="grow"></span><button class="btn primary" data-enter id="nx">Practicar ▸</button></div></div>`;
    $('#nx').onclick = () => stagePractice(L);
  }

  function stagePractice(L) {
    const ids = lessonCards(L);
    const phr = ids.filter(id => CARDS[id].t === 'p'), conv = ids.filter(id => CARDS[id].t === 'c'), gid = ids.find(id => CARDS[id].t === 'g');
    let q = shuffle(phr.concat(conv));
    /* la gramática aparece tres veces, repartida */
    const at = [Math.floor(q.length / 3), Math.floor(q.length * 2 / 3), q.length];
    at.reverse().forEach(p => q.splice(p, 0, gid));
    /* y un poco de repaso de lecciones anteriores, intercalado */
    const old = dueIds().filter(id => CARDS[id].L !== L).slice(0, 3);
    old.forEach(id => q.splice(1 + Math.floor(Math.random() * q.length), 0, id));
    const before = new Set(Object.keys(S.cards));
    say('Ahora practicamos. Lo nuevo entra al repaso. Lo que falles, te lo vuelvo a preguntar aquí mismo.', 'smirk');
    runSession({
      queue: q, mode: 'lesson', head: lessonHead(L, 4), lesson: L,
      /* las tarjetas que ya tenías y no tocaba repasar no cambian su calendario */
      frozen: id => before.has(id) && S.cards[id].due > Date.now(),
      done: res => lessonEnd(L, res),
    });
  }

  function lessonEnd(L, res) {
    const first = !isDone(L);
    S.done[L.id] = { at: Date.now(), n: ((S.done[L.id] || {}).n || 0) + 1 };
    lessonCards(L).forEach(id => { if (!S.cards[id]) S.cards[id] = { ...newCard(), due: dueIn(1) }; });
    if (L.addAlphabet) ALPHABET.forEach((_, i) => { if (!S.cards['a:' + i]) S.cards['a:' + i] = { ...newCard(), due: dueIn(1) }; });
    const xp = (first ? 50 : 15) + res.ok * 2;
    S.xp += xp; markDay(); save();
    sfx('done');
    say(L.outro, 'happy');
    const nl = nextLesson();
    const levelEnd = first && (!nl || nl.level !== L.level);
    main.innerHTML = stepsBar(5) + `<div class="card center"><div class="kicker">Lección completada</div>
      <h1 class="ru">${show(L.ru)}</h1>
      <p class="big-num">+${xp} XP</p>
      <p>${res.ok} de ${res.total} a la primera · ${lessonCards(L).length} tarjetas en tu repaso</p>
      ${levelEnd ? '<p><b>¡Nivel ' + L.level + ' terminado!</b></p>' : ''}
      <p class="muted small">Mañana te pregunto lo de hoy. No lo olvides. Bueno, olvídalo un poco: así funciona la memoria.</p>
      <div class="row" style="justify-content:center;margin-top:12px">
        <button class="btn" id="home">Inicio</button>
        ${nl ? '<button class="btn primary" data-enter id="next">Siguiente: ' + show(nl.ru) + '</button>' : ''}
      </div></div>`;
    $('#home').onclick = () => go('#home');
    const n = $('#next'); if (n) n.onclick = () => go('#lesson/' + nl.id);
  }

  /* ───────── repaso ───────── */
  function renderReview(mode) {
    const ids = dueIds(mode);
    if (!ids.length) {
      const nl = nextLesson(), others = Object.keys(MODES).filter(m => dueIds(m).length);
      say(Object.keys(S.cards).length ? line('noDue') : 'No hay nada que repasar porque no has aprendido nada. Todavía. Elige una lección, unas palabras o un tema.', 'pleased');
      main.innerHTML = `<div class="card center"><div class="kicker">Repaso${mode ? ' · ' + MODES[mode] : ''}</div><h1>Todo al día</h1>
        <p class="muted">Vuelve cuando haya tarjetas pendientes; el número aparece en el menú.</p>
        <div class="row" style="justify-content:center">${others.map(m => '<button class="btn primary" data-m="' + m + '">Repasar ' + MODES[m].toLowerCase() + ' (' + dueIds(m).length + ')</button>').join('')}
        ${!others.length && nl ? '<button class="btn primary" data-enter id="les">Lección: ' + show(nl.ru) + '</button>' : ''}<button class="btn" id="home">Inicio</button></div></div>`;
      $$('[data-m]').forEach(b => b.onclick = () => go('#review/' + b.dataset.m));
      const l = $('#les'); if (l) l.onclick = () => go('#lesson/' + nl.id);
      $('#home').onclick = () => go('#home');
      return;
    }
    /* se mezclan los tipos para que no salgan todas las de una lección juntas */
    const q = shuffle(ids.slice(0, S.set.limit));
    say(q.length > 30 ? 'Muchas tarjetas. Vamos poco a poco. Una cada vez.' : 'Repaso. La parte aburrida que funciona. Vamos.', 'neutral');
    runSession({ queue: q, mode: 'review', label: 'Repaso' + (mode ? ' · ' + MODES[mode] : ''), head: '', back: '#home', done: res => reviewEnd(res, mode) });
  }
  function reviewEnd(res, mode) {
    markDay(); save(); sfx('done');
    say(line('sessionEnd'), 'happy');
    const left = dueIds(mode).length;
    main.innerHTML = `<div class="card center"><div class="kicker">Repaso terminado</div>
      <p class="big-num">${res.ok}/${res.total}</p><p>a la primera · +${res.xp} XP</p>
      ${left ? '<p class="muted">Quedan ' + left + ' tarjetas (por el límite de cada sesión).</p>' : ''}
      <div class="row" style="justify-content:center;margin-top:10px"><button class="btn" id="home">Inicio</button>
      ${left ? '<button class="btn primary" data-enter id="more">Seguir repasando</button>' : (nextLesson() ? '<button class="btn primary" data-enter id="les">Siguiente lección</button>' : '')}</div></div>`;
    $('#home').onclick = () => go('#home');
    const m = $('#more'); if (m) m.onclick = () => renderReview(mode);
    const l = $('#les'); if (l) l.onclick = () => go('#lesson/' + nextLesson().id);
  }

  /* ───────── motor de ejercicios ───────── */
  function distractors(C, n, field) {
    let pool;
    if (C.t === 'v') {
      /* palabras de la misma clase y de frecuencia parecida */
      const near = VOCAB.slice(Math.max(0, C.i - 400), C.i + 400).filter(w => w !== C);
      pool = shuffle(near.filter(w => w.pos === C.pos)).concat(shuffle(near));
    } else {
      const li = LESSON_IDX[C.L.id];
      /* primero frases de esta lección y de las cercanas ya vistas; solo si faltan, de más adelante */
      const all = Object.values(CARDS).filter(x => x.t === 'p' && x !== C);
      const near = all.filter(x => LESSON_IDX[x.L.id] <= li && li - LESSON_IDX[x.L.id] <= 5);
      pool = shuffle(near).concat(shuffle(all.filter(x => !near.includes(x))));
    }
    /* que ninguna opción comparta un significado con la correcta («grande» y «grande, mayor») */
    const senses = x => String(resolve(x[field])).split(/[,;]/).map(norm).filter(Boolean);
    const seen = new Set(senses(C)), out = [];
    for (const x of pool) {
      const k = senses(x);
      if (k.length && !k.some(v => seen.has(v))) { k.forEach(v => seen.add(v)); out.push(x); }
      if (out.length >= n) break;
    }
    return out;
  }
  /* la palabra dentro de su frase de ejemplo, para completar el hueco */
  function clozeOf(w) {
    if (w.k == null || w.k < 0) return null;
    const toks = w.ex.split(' '), m = (toks[w.k] || '').match(/^([«"]*)(.+?)([.,!?;:»"…]*)$/);
    if (!m) return null;
    return { before: toks.slice(0, w.k).join(' '), pre: m[1], form: m[2], post: m[3], after: toks.slice(w.k + 1).join(' ') };
  }
  const tokens = s => resolve(s).replace(/[.,!?¿¡«»…—]/g, ' ').split(/\s+/).filter(Boolean);
  const awkward = s => /[…\/]/.test(s);

  /* elige el tipo de ejercicio según lo madura que esté la tarjeta */
  function buildEx(id, mode, o) {
    const C = CARDS[id], st = S.cards[id] || newCard(), ivl = mode !== 'review' ? 0 : st.ivl;
    if (C.t === 'v') {
      const canType = S.set.typing && !/\s/.test(C.ru), canCloze = !!clozeOf(C);
      let kinds;
      if (mode !== 'review') kinds = ['ru2es', 'es2ru', 'listen'];
      else if (ivl < 2) kinds = ['ru2es', 'es2ru'];
      else if (ivl < 7) kinds = ['es2ru', 'listen', canCloze ? 'cloze' : 'ru2es'];
      else kinds = [canType ? 'type' : 'es2ru', canCloze ? 'cloze' : 'listen', 'listen', 'es2ru'];
      return { id, C, kind: pick(kinds) };
    }
    if (C.t === 'p') {
      const n = tokens(C.ru).length;
      const canTiles = n >= 3 && !awkward(C.ru), canType = S.set.typing && n <= 4 && !awkward(C.ru);
      let kinds;
      if (mode !== 'review') kinds = ['ru2es', 'ru2es', 'es2ru'];
      else if (ivl < 2) kinds = ['ru2es', 'es2ru'];
      else if (ivl < 7) kinds = ['es2ru', canTiles ? 'tiles' : 'listen', 'listen'];
      else kinds = [canType ? 'type' : 'es2ru', canTiles ? 'tiles' : 'listen', 'listen'];
      return { id, C, kind: pick(kinds) };
    }
    if (C.t === 'c') return { id, C, kind: ivl >= 7 || C.L.reading ? 'conv-listen' : 'conv' };
    if (C.t === 'g') {
      const d = C.G.drills;
      let j = Math.floor(Math.random() * d.length);
      if (d.length > 1 && j === st.last) j = (j + 1) % d.length;
      if (o && o.pickJ) j = o.pickJ(id, d.length);
      return { id, C, kind: 'drill', j };
    }
    return { id, C, kind: ivl >= 3 ? 'abc-rev' : 'abc' };
  }

  function runSession(o) {
    const queue = o.queue.slice(), firstTry = {}, lastQ = {};
    /* en lecciones, palabras nuevas y temas de gramática se enseña; en el repaso se califica */
    const teach = o.mode !== 'review';
    /* en un tema de gramática, cada ejercicio cuenta por separado aunque sean de la misma tarjeta */
    const each = o.mode === 'grammar', keyOf = ex => each ? ex.id + '#' + ex.j : ex.id;
    let done = 0, total = each ? queue.length : new Set(queue).size, ok = 0, xp = 0, run = 0;
    function next() {
      if (!queue.length) return o.done({ ok, total, xp });
      const id = queue.shift();
      const ex = buildEx(id, o.mode, o);
      render(ex);
    }
    function top() {
      const pct = Math.round(done / (done + queue.length + 1) * 100);
      return o.head + `<div class="session-top"><span>${o.label || (o.mode === 'lesson' ? 'Práctica' : 'Repaso')}</span><span class="grow"></span><span>${queue.length + 1} por delante</span>
        <button class="chip" id="quit">Salir</button></div><div class="progress"><i style="width:${pct}%"></i></div>`;
    }
    function render(ex) {
      const C = ex.C;
      readingMode = !!(C.L && C.L.reading);
      let body = '', options = null, answerRu = '', autoAudio = '', check = null;
      const isNew = teach && !S.cards[ex.id];
      if (ex.kind === 'ru2es' || ex.kind === 'listen') {
        const ds = distractors(C, 3, 'es');
        options = shuffle([{ h: esc(resolve(C.es)), ok: true }, ...ds.map(d => ({ h: esc(resolve(d.es)) }))]);
        answerRu = C.ru; autoAudio = C.ru;
        body = ex.kind === 'ru2es'
          ? `<div class="ex-type">${isNew ? 'Nueva · ' : ''}¿Qué significa?</div><div class="prompt">${ruHTML(C.ru)} ${sayBtn(C.ru, 'data-replay')}</div>`
          : `<div class="ex-type">Escucha · ¿Qué significa?</div><div class="listen-big"><button data-say="${esc(resolveG(C.ru))}" data-voice="masha" data-replay aria-label="Escuchar otra vez">🔊</button></div>`;
      } else if (ex.kind === 'es2ru') {
        const ds = distractors(C, 3, 'ru');
        options = shuffle([{ h: ruHTML(C.ru), ok: true }, ...ds.map(d => ({ h: ruHTML(d.ru) }))]);
        answerRu = C.ru;
        body = `<div class="ex-type">¿Cómo se dice en ruso?</div><div class="prompt es-p">${esc(resolve(C.es))}</div>` +
          (C.t === 'v' ? `<div class="prompt-sub">${esc(posName(C.pos))}</div>` : '');
      } else if (ex.kind === 'cloze') {
        const z = clozeOf(C);
        const others = distractors(C, 8, 'es').map(clozeOf).filter(x => x && norm(x.form) !== norm(z.form)).slice(0, 3);
        /* las otras opciones con la misma mayúscula inicial que la correcta, para no delatarla */
        const cap = f => z.form[0] === z.form[0].toUpperCase() ? f[0].toUpperCase() + f.slice(1) : f[0].toLowerCase() + f.slice(1);
        options = shuffle([{ h: ruHTML(z.form), ok: true }, ...others.map(x => ({ h: ruHTML(cap(x.form)) }))]);
        answerRu = C.ex;
        body = `<div class="ex-type">Completa la frase</div>
          <div class="prompt">${show(z.before)} ${show(z.pre)}<span class="blank"></span>${show(z.post)} ${show(z.after)}</div>
          <div class="prompt-sub">${esc(C.exes)}</div>`;
      } else if (ex.kind === 'tiles') {
        answerRu = C.ru;
        const right = tokens(C.ru);
        const extra = shuffle(distractors(C, 6, 'ru').flatMap(d => tokens(d.ru)).filter(w => !right.some(r => norm(r) === norm(w)))).slice(0, 3);
        const bank = shuffle(right.concat(extra)).map((w, j) => ({ w, j }));
        body = `<div class="ex-type">Arma la frase en ruso</div><div class="prompt es-p">${esc(resolve(C.es))}</div>
          <div class="tiles answer" id="ans"></div><div class="tiles" id="bank">${bank.map(b => `<button class="tile" data-j="${b.j}">${show(b.w)}</button>`).join('')}</div>
          <div class="row"><button class="btn ghost" id="clr">Borrar</button><span class="grow"></span><button class="btn primary" id="chk" data-enter>Comprobar</button></div>`;
        check = () => norm($$('#ans .tile').map(t => t.textContent).join(' ')) === norm(C.ru);
      } else if (ex.kind === 'type') {
        answerRu = C.ru;
        body = `<div class="ex-type">Escríbelo en ruso</div><div class="prompt es-p">${esc(resolve(C.es))}</div>
          <input class="type-in" id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ru" placeholder="по-русски…">
          ${keyboard()}<div class="row"><button class="btn ghost" id="skip">No sé</button><span class="grow"></span><button class="btn primary" id="chk" data-enter>Comprobar</button></div>`;
      } else if (ex.kind === 'conv' || ex.kind === 'conv-listen') {
        const p = C.prompt, k = C.k;
        const right = pick(C.u.slice(0, k)), wrong = shuffle(C.u.slice(k)).slice(0, 2);
        options = shuffle([{ h: ruHTML(right[0]), ok: true, ru: right[0] }, ...wrong.map(w => ({ h: ruHTML(w[0]), c: w[2], ru: w[0] }))]);
        answerRu = right[0]; autoAudio = p.ru;
        const who = p.who ? show(SPEAKERS[p.who].name) : 'Маша';
        body = `<div class="ex-type">Conversación · ¿Qué respondes?</div>
          <div class="msg" style="max-width:100%"><div class="head">${who}</div><div class="line"><div class="grow">
          ${ex.kind === 'conv-listen' ? '<span class="ru hidden-line" id="hl">· · ·</span><button class="chip" id="showl">Ver texto</button>' : ruHTML(p.ru)}
          <span class="es hid" id="pes">${esc(resolve(p.es))}</span></div>${sayBtn(p.ru, 'data-replay', p.who || 'masha')}</div></div>`;
      } else if (ex.kind === 'drill') {
        const d = C.G.drills[ex.j];
        options = shuffle(d.o.map((t, j) => ({ h: isCyr(t) ? ruHTML(t) : esc(t), ok: j === 0, ru: t })));
        answerRu = d.q ? d.q.replace('___', d.o[0]) : (isCyr(d.o[0]) ? d.o[0] : '');
        body = `<div class="ex-type">Gramática · ${show(C.G.title)}</div>
          ${d.p ? `<div class="prompt es-p">${show(d.p)}</div>` : ''}
          ${d.q ? `<div class="prompt">${show(d.q).replace('___', '<span class="blank"></span>')}</div>` : ''}
          ${d.es ? `<div class="prompt-sub">${esc(d.es)}</div>` : ''}`;
        ex.explain = d.x;
      } else if (ex.kind === 'abc' || ex.kind === 'abc-rev') {
        const a = C.a, others = shuffle(ALPHABET.filter(x => x !== a)).slice(0, 3);
        autoAudio = a[2];
        if (ex.kind === 'abc') {
          options = shuffle([{ h: esc(a[1]), ok: true }, ...others.map(x => ({ h: esc(x[1]) }))]);
          body = `<div class="ex-type">Alfabeto · ¿Cómo suena?</div><div class="big-letter">${a[0]}</div><p class="center muted">como en ${ruHTML(a[2])} ${sayBtn(a[2], 'data-replay')}</p>`;
        } else {
          options = shuffle([{ h: '<span class="ru" style="font-size:26px">' + a[0] + '</span>', ok: true }, ...others.map(x => ({ h: '<span class="ru" style="font-size:26px">' + x[0] + '</span>' }))]);
          body = `<div class="ex-type">Alfabeto · ¿Qué letra es?</div><div class="prompt es-p">Suena: ${esc(a[1])}</div><p class="muted">Escucha: ${sayBtn(a[2], 'data-replay')}</p>`;
        }
        answerRu = a[2];
      }

      main.innerHTML = top() + '<div class="card" id="ex">' + body +
        (options ? '<div class="choices">' + options.map((op, j) => '<button class="choice" data-k="' + (j + 1) + '" data-j="' + j + '">' + op.h + '</button>').join('') + '</div>' : '') +
        '<div id="fb"></div></div>';
      $('#quit').onclick = () => { save(); go(o.back || (o.mode === 'lesson' ? '#path' : '#home')); };
      if (autoAudio && S.set.autoplay) speak(autoAudio, { voice: C.prompt ? (C.prompt.who || 'masha') : 'masha', pitch: C.prompt && PITCH[C.prompt.who] });
      const pes = $('#pes'); if (pes) pes.onclick = () => pes.classList.remove('hid');
      const sl = $('#showl'); if (sl) sl.onclick = () => { $('#hl').outerHTML = ruHTML(C.prompt.ru); sl.remove(); };

      if (options) $$('.choice', main).forEach(b => b.onclick = () => {
        const op = options[+b.dataset.j];
        $$('.choice', main).forEach((x, j) => { x.disabled = true; if (options[j].ok) x.classList.add('ok'); else if (x !== b) x.classList.add('dim'); });
        if (!op.ok) b.classList.add('bad');
        answered(ex, !!op.ok, { answerRu, comment: op.c, chosen: op, voice: ex.kind.startsWith('conv') ? 'user' : 'masha' });
      });
      if (ex.kind === 'tiles') {
        const ans = $('#ans');
        $$('#bank .tile').forEach(t => t.onclick = () => {
          if (t.classList.contains('used')) return;
          t.classList.add('used');
          const c = document.createElement('button'); c.className = 'tile'; c.textContent = t.textContent; c.dataset.j = t.dataset.j;
          c.onclick = () => { c.remove(); t.classList.remove('used'); };
          ans.appendChild(c);
          stopVoice(); browserSay(t.textContent);
        });
        $('#clr').onclick = () => { ans.innerHTML = ''; $$('#bank .tile').forEach(t => t.classList.remove('used')); };
        $('#chk').onclick = () => {
          if (!ans.children.length) return;
          const r = check();
          $$('#ex button').forEach(b => b.disabled = true);
          answered(ex, r, { answerRu });
        };
      }
      if (ex.kind === 'type') {
        const inp = $('#tin');
        if (!matchMedia('(pointer: coarse)').matches) inp.focus();
        $$('.kbd button').forEach(b => b.onclick = () => {
          const k = b.dataset.key;
          if (k === 'bs') inp.value = inp.value.slice(0, -1); else inp.value += k;
          if (!matchMedia('(pointer: coarse)').matches) inp.focus();
        });
        if (matchMedia('(pointer: coarse)').matches) inp.readOnly = true;
        const go2 = () => {
          const v = inp.value.trim(); if (!v) return;
          const a = norm(v), b = norm(C.ru);
          const exact = a === b, close = !exact && b.length > 4 && lev(a, b) <= 1;
          inp.disabled = true; $$('#ex button').forEach(x => x.disabled = true);
          answered(ex, exact || close, { answerRu, typo: close });
        };
        $('#chk').onclick = go2;
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go2(); } });
        $('#skip').onclick = () => { inp.disabled = true; $$('#ex button').forEach(x => x.disabled = true); answered(ex, false, { answerRu }); };
      }
    }

    function answered(ex, right, info) {
      const id = ex.id, first = !(keyOf(ex) in firstTry);
      if (first) { firstTry[keyOf(ex)] = right; if (right) ok++; }
      run = right ? run + 1 : 0;
      sfx(right ? 'ok' : 'bad');
      if (ex.kind === 'drill') { S.cards[id] = S.cards[id] || newCard(); S.cards[id].last = ex.j; }
      const frozen = o.frozen && o.frozen(id);
      if (right) { xp += 2; S.xp += 2; }
      if (info.comment) say(info.comment, 'eyeroll');
      else if (right) say(run >= 3 && run % 3 === 0 ? line('streak') : line('right'), run >= 3 ? 'happy' : pick(['pleased', 'smirk', 'neutral']));
      else say(line('wrong'), pick(['annoyed', 'sad', 'eyeroll']));

      readingMode = false;
      let html = '<div class="feedback ' + (right ? 'ok' : 'bad') + '"><h3>' + (right ? (info.typo ? 'Casi perfecto' : pick(['Правильно!', 'Хорошо!', 'Верно!'])) : 'Не совсем…') + '</h3>';
      const esLine = ex.C.t === 'p' ? ex.C.es : ex.C.t === 'v' ? (ex.kind === 'cloze' ? ex.C.exes : ex.C.es) : '';
      if (info.answerRu) html += '<div class="row">' + sayBtn(info.answerRu, '', info.voice) + '<div class="grow">' + ruHTML(info.answerRu) + (esLine ? '<span class="es">' + esc(resolve(esLine)) + '</span>' : '') + '</div></div>';
      if (ex.C.t === 'v') html += ex.kind === 'cloze'
        ? '<p class="small" style="margin-top:6px"><b class="ru">' + show(ex.C.ru) + '</b> — ' + esc(ex.C.es) + '</p>'
        : '<div class="row wex">' + sayBtn(ex.C.ex) + '<div class="grow"><span class="ru">' + show(ex.C.ex) + '</span><span class="es">' + esc(ex.C.exes) + '</span></div></div>';
      if (ex.kind.startsWith('conv')) html += '<p class="small muted" style="margin-top:6px">' + show(ex.C.prompt.ru) + ' — ' + esc(resolve(ex.C.prompt.es)) + '</p>';
      if (ex.explain) html += '<p class="small" style="margin-top:6px">' + show(ex.explain) + '</p>';
      if (ex.C.note && !right) html += '<p class="small">' + (ex.C.t === 'v' ? show(ex.C.note) : esc(ex.C.note)) + '</p>';

      /* calendario */
      const graded = q => {
        /* en la lección, una tarjeta repetida (la gramática sale tres veces) solo se agenda una vez, salvo si se falla */
        if (!frozen && (!teach || q === 0 || !lastQ[id])) grade(id, q);
        lastQ[id] = q;
        if (q === 0) {
          /* vuelve en esta misma sesión, unas tarjetas más adelante */
          const pos = Math.min(queue.length, 3 + Math.floor(Math.random() * 3));
          queue.splice(pos, 0, id);
        } else done++;
        save(); next();
      };
      if (!right) {
        html += '<div class="row" style="margin-top:12px"><span class="grow"></span><button class="btn red" data-enter id="cont">Continuar</button></div>';
      } else if (teach || frozen) {
        html += '<div class="row" style="margin-top:12px"><span class="grow"></span><button class="btn green" data-enter id="cont">Continuar</button></div>';
      } else {
        const c = S.cards[id] || newCard();
        const iv = q => fmtIvl(nextState(c, q, true).ivl);
        html += '<div class="grades"><button class="btn" data-k="1" data-q="1">Difícil<small>' + iv(1) + '</small></button>' +
          '<button class="btn green" data-k="2" data-q="2" data-enter>Bien<small>' + iv(2) + '</small></button>' +
          '<button class="btn" data-k="3" data-q="3">Fácil<small>' + iv(3) + '</small></button></div>';
      }
      html += '</div>';
      $('#fb').innerHTML = html;
      $('#fb').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (info.answerRu && !right && S.set.autoplay) speak(info.answerRu, { voice: info.voice });
      const cont = $('#cont');
      if (cont) cont.onclick = () => graded(right ? (info.typo ? 1 : 2) : 0);
      $$('.grades .btn').forEach(b => b.onclick = () => graded(+b.dataset.q));
    }
    next();
  }

  function keyboard() {
    const rows = ['йцукенгшщзхъ', 'фывапролджэ', 'ячсмитьбюё'];
    return '<div class="kbd" aria-label="Teclado ruso">' + rows.map((r, i) => '<div>' + [...r].map(ch => '<button type="button" data-key="' + ch + '">' + ch + '</button>').join('') +
      (i === 2 ? '<button type="button" class="w" data-key="bs" aria-label="Borrar">⌫</button>' : '') + '</div>').join('') +
      '<div><button type="button" class="w" data-key=" " style="max-width:260px;flex:8">espacio</button></div></div>';
  }


  /* ───────── palabras y frases ───────── */
  const PACK = 50, LEVEL_W = 500;
  const wState = w => { const c = S.cards['v:' + w.ru]; return !c ? 'new' : c.ivl >= 21 ? 'known' : 'learning'; };
  const W_ICON = { new: '', learning: '◐', known: '●' };
  function renderWords(arg) {
    if (!VOCAB) {
      main.innerHTML = '<div class="card center"><p class="muted">Cargando las 6000 palabras…</p></div>';
      ensureVocab().then(() => { if (/^#words/.test(location.hash)) renderWords(arg); })
        .catch(() => { main.innerHTML = '<div class="card center"><p>No se pudieron cargar las palabras. ¿Hay conexión?</p><button class="btn" id="retry">Reintentar</button></div>'; $('#retry').onclick = () => renderWords(arg); });
      return;
    }
    if (arg === 'learn') return learnWords(VOCAB.filter(w => wState(w) === 'new').slice(0, S.set.newWords));
    if (/^\d+$/.test(arg || '') && +arg >= 1 && +arg <= Math.ceil(VOCAB.length / PACK)) return renderPack(+arg);
    const nw = wordsKnown(), due = dueIds('words').length, known = VOCAB.filter(w => wState(w) === 'known').length;
    const next = VOCAB.findIndex(w => wState(w) === 'new');
    say(nw ? pick(['Con seis mil palabras entiendes casi todo lo que oyes. Casi. El resto lo adivinas, como los rusos.', 'Diez palabras al día y en dos años eres peligroso. En ruso.', 'Las palabras se olvidan. Por eso existe el repaso. Y yo.'])
      : 'Seis mil palabras, de la más usada a la menos. Con las primeras mil ya entiendes muchísimo. Empezamos de diez en diez.', 'smirk');
    const levels = Math.ceil(VOCAB.length / LEVEL_W), openLv = next < 0 ? -1 : Math.floor(next / LEVEL_W);
    main.innerHTML = `<div class="card">
        <div class="kicker">Palabras y frases</div><h1>Las 6000 palabras más usadas</h1>
        <p class="muted">Ordenadas por frecuencia: primero las que más vas a oír. Cada una trae una frase de ejemplo con audio. Después de aprenderlas, el repaso te las pregunta de varias formas: qué significa, cómo se dice, escucharla, completar la frase y escribirla.</p>
        <p><b>${nw}</b> <span class="muted">de ${VOCAB.length} en tu repaso · ${known} dominadas</span></p><div class="pbar"><i style="width:${nw / VOCAB.length * 100}%"></i></div>
        <div class="row" style="margin-top:14px">${next >= 0 ? `<button class="btn primary" data-enter id="learn">Aprender ${S.set.newWords} nuevas</button>` : ''}
          <button class="btn" id="rev" ${due ? '' : 'disabled'}>Repasar palabras (${due})</button></div>
      </div>` + Array.from({ length: levels }, (_, lv) => {
        const ws = VOCAB.slice(lv * LEVEL_W, (lv + 1) * LEVEL_W), nd = ws.filter(w => wState(w) !== 'new').length;
        const packs = Math.ceil(ws.length / PACK);
        return `<details class="level" ${lv === openLv ? 'open' : ''}>
          <summary class="level-head"><h2>Palabras ${lv * LEVEL_W + 1}–${lv * LEVEL_W + ws.length}</h2><span class="muted small grow">${lv === 0 ? 'Las imprescindibles' : lv < 2 ? 'Lo básico de cada día' : lv < 4 ? 'Para conversar con soltura' : lv < 8 ? 'Para leer y entender noticias' : 'Para entender casi todo'}</span>
            <span class="lv-prog"><i style="width:${Math.round(nd / ws.length * 100)}%"></i></span><b class="small">${nd}/${ws.length}</b></summary>
          <div class="lessons">${Array.from({ length: packs }, (_, k) => {
            const n = lv * (LEVEL_W / PACK) + k + 1, pw = VOCAB.slice((n - 1) * PACK, n * PACK), pd = pw.filter(w => wState(w) !== 'new').length;
            return `<button class="lesson-tile ${pd === pw.length ? 'done' : ''}" data-p="${n}"><span class="n">PAQUETE ${n}</span><span class="st">${pd === pw.length ? '✓' : pd ? pd + '/' + pw.length : ''}</span>
              <span class="t ru">${pw.slice(0, 3).map(w => show(w.ru)).join(', ')}…</span><span class="s">${pw.slice(0, 3).map(w => esc(w.es.split(',')[0])).join(', ')}…</span></button>`;
          }).join('')}</div></details>`;
      }).join('');
    const l = $('#learn'); if (l) l.onclick = () => go('#words/learn');
    $('#rev').onclick = () => go('#review/words');
    $$('[data-p]').forEach(b => b.onclick = () => go('#words/' + b.dataset.p));
  }

  function renderPack(n) {
    const ws = VOCAB.slice((n - 1) * PACK, n * PACK), news = ws.filter(w => wState(w) === 'new');
    say(news.length ? 'Paquete ' + n + '. Toca una palabra para oírla. Si ya te las sabes, dímelo y no te aburro.' : 'Este paquete ya está en tu repaso. Bien. No te confíes.', 'neutral');
    main.innerHTML = `<div class="row" style="margin-bottom:12px"><a class="btn ghost" href="#words">◂ Palabras</a><span class="grow"></span>
        ${n > 1 ? `<a class="btn ghost" href="#words/${n - 1}">‹</a>` : ''}${n * PACK < VOCAB.length ? `<a class="btn ghost" href="#words/${n + 1}">›</a>` : ''}</div>
      <div class="card"><div class="kicker">Paquete ${n} · palabras ${(n - 1) * PACK + 1}–${(n - 1) * PACK + ws.length}</div>
        <div class="row">${news.length ? `<button class="btn primary" data-enter id="learn">Aprender ${Math.min(S.set.newWords, news.length)} nuevas</button><button class="btn ghost" id="known">Ya me las sé todas</button>` : '<span class="muted">Todas estas palabras están en tu repaso.</span>'}</div>
        <div class="wlist">${ws.map(w => `<div class="wrow ${wState(w)}">${sayBtn(w.ru)}<div class="grow"><b class="ru">${show(w.ru)}</b> <span class="muted small">${esc(posName(w.pos))}</span><span class="es">${esc(w.es)}</span></div><span class="wst" title="${{ new: 'nueva', learning: 'aprendiendo', known: 'dominada' }[wState(w)]}">${W_ICON[wState(w)]}</span></div>`).join('')}</div>
        <p class="muted small" style="margin-top:10px">◐ aprendiendo · ● dominada (21 días o más)</p></div>`;
    const l = $('#learn'); if (l) l.onclick = () => learnWords(news.slice(0, S.set.newWords));
    const k = $('#known'); if (k) k.onclick = () => {
      if (!confirm('¿Marcar como sabidas las ' + news.length + ' palabras nuevas de este paquete? Te las preguntaré dentro de un mes, por si acaso.')) return;
      news.forEach(markKnown); save(); toast(news.length + ' palabras marcadas como sabidas'); renderPack(n);
    };
  }
  /* «ya la sé»: entra al repaso con un intervalo largo, para comprobarlo más adelante */
  function markKnown(w) { S.cards['v:' + w.ru] = { ...newCard(), ivl: 30, reps: 1, due: dueIn(30) }; }

  /* aprender: primero se presentan las palabras una a una, luego se practican */
  function learnWords(list) {
    if (!list.length) { say('No quedan palabras nuevas. Seis mil. Las tienes todas. Ahora a repasarlas.', 'happy'); go('#words'); return; }
    const learn = [];
    let i = 0;
    const show1 = () => {
      if (i >= list.length) return practice();
      const w = list[i];
      main.innerHTML = `<div class="steps">${list.map((_, j) => '<span class="' + (j < i ? 'done' : j === i ? 'on' : '') + '"></span>').join('')}</div>
        <div class="kicker">Palabra nueva · ${i + 1} de ${list.length} · nº ${w.i + 1} en frecuencia</div>
        <div class="card word-card">
          <div class="row"><div class="grow">${ruHTML(w.ru, 'word-big')}</div>${sayBtn(w.ru, 'data-replay')}</div>
          <p class="word-es">${esc(w.es)}</p>
          <p class="muted small">${esc(posName(w.pos))}${w.note ? ' · ' + show(w.note) : ''}</p>
          <div class="row wex">${sayBtn(w.ex)}<div class="grow">${ruHTML(w.ex)}<span class="es">${esc(w.exes)}</span></div></div>
          <div class="row" style="margin-top:16px"><button class="btn ghost" id="know">Ya la sé</button><span class="grow"></span><button class="btn primary" data-enter id="nx">${i + 1 < list.length ? 'Siguiente ▸' : 'Practicar ▸'}</button></div>
        </div>`;
      if (S.set.autoplay) speak(w.ru, { done: () => setTimeout(() => { if ($('.word-card')) speak(w.ex); }, 400) });
      $('#nx').onclick = () => { learn.push(w); i++; show1(); };
      $('#know').onclick = () => { markKnown(w); save(); i++; show1(); };
    };
    const practice = () => {
      if (!learn.length) { save(); say('¿Todas sabidas? Te creo. Por ahora. Dentro de un mes te pregunto.', 'smirk'); return go('#words'); }
      say('Ahora te pregunto las que no sabías. Sin mirar atrás.', 'smirk');
      const ids = learn.map(w => 'v:' + w.ru);
      runSession({ queue: shuffle(ids), mode: 'learn', label: 'Palabras nuevas', head: '', back: '#words', done: res => {
        markDay(); save(); sfx('done');
        say(pick(['Diez palabras más. El ruso empieza a rendirse.', 'Bien. Mañana te las pregunto. No las olvides. Bueno, olvídalas un poco: así funciona la memoria.', 'Guardadas. Pelmén está impresionado. No lo demuestra, pero lo está.']), 'happy');
        const more = VOCAB.some(w => wState(w) === 'new');
        main.innerHTML = `<div class="card center"><div class="kicker">Palabras aprendidas</div>
          <p class="big-num">+${learn.length}</p><p>${res.ok} de ${res.total} a la primera · ${wordsKnown()} de ${VOCAB.length} en tu repaso</p>
          <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" id="back">Palabras</button>
          ${more ? '<button class="btn primary" data-enter id="more">Otras ' + S.set.newWords + '</button>' : ''}</div></div>`;
        $('#back').onclick = () => go('#words');
        const m = $('#more'); if (m) m.onclick = () => { if (location.hash === '#words/learn') route(); else go('#words/learn'); };
      } });
    };
    say(pick(['Palabras nuevas. Escucha, mira el ejemplo y sigue. Si ya la sabes, dilo: no pierdo el tiempo.', 'Vamos con unas palabras. Fíjate en el acento: cambia todo.']), 'neutral');
    show1();
  }

  /* ───────── gramática: temas, tablas y alfabeto ───────── */
  function renderGrammar(tab) {
    tab = !tab || tab === 'grammar' ? 'temas' : tab;
    if (GRAMMAR[tab]) return renderGTopic(tab);
    const tabs = `<div class="tabs">${[['temas', 'Temas'], ['tablas', 'Tablas'], ['abc', 'Alfabeto']].map(([k, t]) => `<a class="btn ${tab === k ? 'primary' : ''}" href="#grammar/${k}">${t}</a>`).join('')}</div>`;
    if (tab === 'abc') {
      const inDeck = ALPHABET.every((_, i) => S.cards['a:' + i]);
      say('El alfabeto. Treinta y tres letras. Cinco son trampas: В, Н, Р, С, У, Х. Parecen latinas y no lo son. Bueno, seis.', 'smirk');
      main.innerHTML = tabs + `<div class="card dark"><p>Toca una letra para oírla. Si quieres practicarlo desde cero, haz la <a href="#lesson/l0">clase 0</a>.</p>
        <button class="btn ${inDeck ? '' : 'primary'}" id="addabc" ${inDeck ? 'disabled' : ''}>${inDeck ? 'El alfabeto ya está en tu repaso' : 'Añadir las 33 letras al repaso'}</button></div>
        <div class="abc">${ALPHABET.map(a => `<button data-say="${esc(a[2])}" data-voice="masha"><span class="L">${a[0]}</span><span class="snd">${esc(a[1])}</span><span class="ex">${show(a[2])}</span></button>`).join('')}</div>`;
      const b = $('#addabc');
      if (b && !inDeck) b.onclick = () => {
        ALPHABET.forEach((_, i) => { if (!S.cards['a:' + i]) S.cards['a:' + i] = newCard(); });
        save(); toast('33 letras añadidas al repaso'); renderGrammar('abc');
      };
      return;
    }
    if (tab === 'tablas') {
      say('Tablas. Sí, los rusos también las odian. Pero las sabemos. Toca cualquier forma para oírla.', 'eyeroll');
      const cell = t => `<td><button class="tcell" data-say="${esc(t)}" data-voice="masha">${show(t)}</button></td>`;
      const lab = t => { const [a, q] = t.split(' · '); return show(a) + (q ? '<small>' + show(q) + '</small>' : ''); };
      main.innerHTML = tabs + TABLES.map(T => {
        const side = T.side || CASOS;
        let html = `<details class="gnote" ${T.id === 'sust1' ? 'open' : ''}><summary><span class="grow">${show(T.title)}</span></summary><div class="grammar-body">
          <div class="tscroll"><table class="gtable"><thead><tr>${T.head.map(h => `<th>${show(h)}</th>`).join('')}</tr></thead>
          <tbody>${T.rows.map((r, i) => `<tr><th>${lab(side[i])}</th>${r.map(cell).join('')}</tr>`).join('')}</tbody></table></div>`;
        if (T.extra) html += `<h4>${show(T.extra.title)}</h4><div class="tscroll"><table class="gtable"><tbody>${T.extra.cells.map((c, i) => `<tr><th>${show(T.extra.side[i])}</th>${cell(c)}</tr>`).join('')}</tbody></table></div>`;
        return html + `<p class="small">${show(T.note)}</p></div></details>`;
      }).join('');
      return;
    }
    const studied = id => !!S.cards['g:' + id];
    const nS = Object.keys(GRAMMAR).filter(studied).length;
    say(nS ? 'Elige un tema, o deja que te pregunte de todo un poco. Lo que ya estudiaste vuelve solo en el repaso.' : 'Toda la gramática del curso, ordenada por tema. Puedes empezar por donde quieras. Yo empezaría por el principio. Pero no soy tu madre.', 'neutral');
    main.innerHTML = tabs + `<div class="card"><div class="kicker">Gramática</div><h1>Las reglas, una a una</h1>
        <p class="muted">Cada tema tiene una explicación corta y ejercicios. Al practicarlo, entra a tu repaso. Las conversaciones usan los mismos temas, en el mismo orden.</p>
        <p><b>${nS}</b> <span class="muted">de ${LESSONS.length} temas en tu repaso</span></p><div class="pbar"><i style="width:${nS / LESSONS.length * 100}%"></i></div>
        <div class="row" style="margin-top:14px"><button class="btn primary" id="mix" ${nS ? 'data-enter' : 'disabled'}>Práctica mixta (10 ejercicios)</button>
        <button class="btn" id="rev" ${dueIds('grammar').length ? '' : 'disabled'}>Repasar gramática (${dueIds('grammar').length})</button></div></div>` +
      GTOPICS.map((T, ti) => {
        const nd = T.g.filter(studied).length;
        return `<details class="level" ${ti === 0 && !nS ? 'open' : ''}><summary class="level-head"><h2>${esc(T.title)}</h2><span class="muted small grow">${esc(T.es)}</span>
          <span class="lv-prog"><i style="width:${Math.round(nd / T.g.length * 100)}%"></i></span><b class="small">${nd}/${T.g.length}</b></summary>
          <div class="glist">${T.g.map(g => `<a class="grow-row ${studied(g) ? 'done' : ''}" href="#grammar/${g}"><span class="grow">${show(GRAMMAR[g].grammar.title)}</span><span class="muted small">${studied(g) ? '✓ en repaso' : GRAMMAR[g].grammar.drills.length + ' ejercicios'}</span></a>`).join('')}</div></details>`;
      }).join('');
    $('#mix').onclick = () => {
      const pool = shuffle(Object.keys(GRAMMAR).filter(studied)), q = [];
      for (let k = 0; q.length < 10 && pool.length; k++) q.push('g:' + pool[k % pool.length]);
      practiceGrammar(q, '#grammar', 'Práctica de gramática');
    };
    $('#rev').onclick = () => go('#review/grammar');
  }

  function renderGTopic(gid) {
    const L = GRAMMAR[gid], G = L.grammar, T = GTOPICS.find(t => t.g.includes(gid)), k = T.g.indexOf(gid);
    const prev = T.g[k - 1], next = T.g[k + 1];
    say(pick(['Lee. Es corto. Luego practicas y te lo pregunto otro día.', 'Una regla. Una sola. Puedes con ella.', 'Toca las palabras rusas para oírlas. Sí, todas suenan.']), 'neutral');
    main.innerHTML = `<div class="row" style="margin-bottom:12px"><a class="btn ghost" href="#grammar">◂ ${esc(T.title)}</a><span class="grow"></span>
        ${prev ? `<a class="btn ghost" href="#grammar/${prev}" title="Anterior">‹</a>` : ''}${next ? `<a class="btn ghost" href="#grammar/${next}" title="Siguiente">›</a>` : ''}</div>
      <div class="card"><div class="kicker">${esc(T.title)} · ${k + 1} de ${T.g.length}</div><h1>${show(G.title)}</h1>
        <div class="grammar-body">${rich(G.body)}</div>
        <div class="row" style="margin-top:8px"><button class="btn primary" data-enter id="prac">Practicar (${G.drills.length} ejercicios)</button>
        <span class="grow"></span><span class="muted small">Viene de la lección ${lessonNum(L)}${unlocked(L) ? ' · <a href="#lesson/' + L.id + '">ver la conversación</a>' : ''}</span></div></div>`;
    $('#prac').onclick = () => practiceGrammar(G.drills.map(() => 'g:' + gid), '#grammar/' + gid, show(G.title), next && ('#grammar/' + next));
  }
  /* cada ejercicio de un tema sale una vez, en orden aleatorio */
  function practiceGrammar(queue, back, label, nextHash) {
    const order = {}, before = new Set(Object.keys(S.cards));
    runSession({
      queue, mode: 'grammar', label, head: '', back,
      pickJ: (id, n) => { order[id] = order[id] && order[id].length ? order[id] : shuffle([...Array(n).keys()]); return order[id].shift(); },
      frozen: id => before.has(id) && S.cards[id].due > Date.now(),
      done: res => {
        markDay(); save(); sfx('done');
        say(res.ok === res.total ? 'Todo bien a la primera. Sospechoso. Muy bien.' : 'Bien. Lo que fallaste vuelve en el repaso. Para eso está.', res.ok === res.total ? 'happy' : 'smirk');
        main.innerHTML = `<div class="card center"><div class="kicker">Gramática</div><p class="big-num">${res.ok}/${res.total}</p><p>a la primera · +${res.xp} XP</p>
          <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" id="back">Volver</button>${nextHash ? '<button class="btn primary" data-enter id="nx">Siguiente tema</button>' : ''}</div></div>`;
        $('#back').onclick = () => go(back);
        const n = $('#nx'); if (n) n.onclick = () => go(nextHash);
      },
    });
  }

  /* ───────── ajustes ───────── */
  function renderSettings() {
    say('Ajustes. Puedes cambiar casi todo. Menos a mí.', 'smirk');
    const sw = (k, label, sub) => `<div class="set"><label for="s-${k}">${label}<small>${sub}</small></label><span class="switch"><input type="checkbox" id="s-${k}" data-set="${k}" ${S.set[k] ? 'checked' : ''}><span></span></span></div>`;
    const voices = ruVoices.length
      ? `<select id="s-voice"><option value="">Automática</option>${ruVoices.map(v => `<option ${v.name === S.set.voice ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>`
      : '<span class="muted small">Tu navegador no tiene voz rusa propia. No pasa nada: el motor de Masha no la necesita.</span>';
    main.innerHTML = `<h1>Ajustes</h1>
      <div class="card">
        <div class="set"><label for="s-name">Tu nombre<small>Masha lo usa en los diálogos.</small></label><input type="text" id="s-name" maxlength="24" value="${esc(S.name)}"></div>
        <div class="set"><label>Cómo te hablo<small>Cambia tus formas rusas: я был / я была.</small></label><span class="seg"><button data-g="m" class="${S.g === 'm' ? 'on' : ''}">Masculino</button><button data-g="f" class="${S.g === 'f' ? 'on' : ''}">Femenino</button></span></div>
        <div class="set"><label>Traducción en los diálogos<small>«Auto»: visible en el nivel 1, oculta después (toca para verla).</small></label><span class="seg">${['show', 'auto', 'hide'].map(v => `<button data-tr="${v}" class="${S.set.trans === v ? 'on' : ''}">${{ show: 'Siempre', auto: 'Auto', hide: 'Oculta' }[v]}</button>`).join('')}</span></div>
        ${sw('translit', 'Transliteración', 'El ruso en letras latinas debajo, con la sílaba tónica marcada.')}
        ${sw('autoplay', 'Audio automático', 'Lee en voz alta cada frase nueva.')}
        ${sw('typing', 'Ejercicios de escribir', 'Con teclado ruso en pantalla, para las tarjetas más maduras.')}
        ${sw('sfx', 'Sonidos', 'Pitidos de acierto y error.')}
        ${sw('unlockAll', 'Desbloquear todas las lecciones', 'Si ya sabes algo de ruso y quieres saltar en los diálogos.')}
      </div>
      <div class="card">
        <div class="set"><label>Motor de voz<small>«Masha»: voces neuronales rusas grabadas para cada frase, con el acento correcto. «Navegador»: la voz de tu sistema.</small></label><span class="seg">${[['neural', 'Masha'], ['browser', 'Navegador']].map(([v, l]) => `<button data-eng="${v}" class="${S.set.engine === v ? 'on' : ''}">${l}</button>`).join('')}</span> <button class="btn ghost" id="test">Probar</button></div>
        <div class="set"><label for="s-voice">Voz del navegador<small>Se usa con el motor «Navegador», para tu nombre y para las palabras sueltas.</small></label>${voices}</div>
        <div class="set"><label for="s-rate">Velocidad de la voz<small id="ratev">${S.set.rate.toFixed(2)}×</small></label><input type="range" id="s-rate" min="0.6" max="1.3" step="0.05" value="${S.set.rate}"></div>
        <div class="set"><label for="s-new">Palabras nuevas por tanda<small>Cuántas palabras te presento cada vez en «Palabras».</small></label><select id="s-new">${[5, 10, 15, 20].map(n => `<option ${n === S.set.newWords ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="set"><label for="s-limit">Tarjetas por sesión de repaso<small>Las que sobren quedan para la siguiente.</small></label><select id="s-limit">${[20, 40, 60, 100, 200].map(n => `<option ${n === S.set.limit ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      </div>
      <div class="card">
        <h3>Tu progreso</h3>
        <p class="muted small">Se guarda solo en este navegador. Puedes descargarlo para pasarlo a otro dispositivo.</p>
        <div class="row"><button class="btn" id="exp">Descargar copia</button><label class="btn" for="imp" style="margin:0">Cargar copia</label><input type="file" id="imp" accept="application/json,.json" hidden><span class="grow"></span><button class="btn red" id="reset">Borrar todo</button></div>
      </div>
      <p class="muted small center">Aprende ruso · Masha y su gato Pelmén te esperan cada día.</p>`;
    $$('[data-set]').forEach(c => c.onchange = () => { S.set[c.dataset.set] = c.checked; save(); });
    $('#s-name').onchange = e => { const v = e.target.value.trim(); if (v) { S.name = v; save(); toast('Nombre guardado'); } };
    $$('[data-g]').forEach(b => b.onclick = () => { S.g = b.dataset.g; save(); renderSettings(); });
    $$('[data-tr]').forEach(b => b.onclick = () => { S.set.trans = b.dataset.tr; save(); renderSettings(); });
    $$('[data-eng]').forEach(b => b.onclick = () => { S.set.engine = b.dataset.eng; save(); renderSettings(); });
    const sv = $('#s-voice'); if (sv) sv.onchange = () => { S.set.voice = sv.value; save(); };
    $('#test').onclick = () => {
      let said = false;
      speak("Я Ма'ша. А как тебя' зову'т?", { voice: 'masha', report: (ok, why) => {
        if (said) return; said = true;
        toast(ok ? '✓ La voz de Masha funciona' : '✗ Sin voz: ' + why);
      } });
      setTimeout(() => { if (!said) { said = true; toast('✗ El audio no empezó. Revisa el volumen y el modo silencio.'); } }, 6000);
    };
    $('#s-rate').oninput = e => { S.set.rate = +e.target.value; $('#ratev').textContent = S.set.rate.toFixed(2) + '×'; save(); };
    $('#s-limit').onchange = e => { S.set.limit = +e.target.value; save(); };
    $('#s-new').onchange = e => { S.set.newWords = +e.target.value; save(); };
    $('#exp').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
      a.download = 'aprende-ruso-' + new Date().toLocaleDateString('sv') + '.json';
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('#imp').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => {
        const s = JSON.parse(t);
        if (!s || typeof s.cards !== 'object') throw new Error('formato');
        S = { ...fresh(), ...s, set: { ...DEFAULT_SET, ...(s.set || {}) } }; save(); toast('Progreso cargado'); route();
      }).catch(() => say('Ese archivo no es una copia de Aprende ruso. ¿Me quieres engañar?', 'annoyed'));
    };
    $('#reset').onclick = () => {
      if (!confirm('¿Borrar todo tu progreso? No se puede deshacer.')) return;
      S = fresh(); save(); location.hash = ''; route();
    };
  }

  /* ───────── arranque ───────── */
  updateBadge();
  /* si ya hay palabras en el repaso, se cargan antes de mostrar nada, para contarlas */
  (Object.keys(S.cards).some(id => id[0] === 'v') ? ensureVocab().catch(() => {}) : Promise.resolve()).then(route);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
