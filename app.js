'use strict';
/* Eli5 – explain any word or phrase like you're five */
const VERSION = '1.3.0';
const DEFAULT_MODEL = 'gemini-flash-latest';
const PROXY = (window.ELI5_PROXY || '').replace(/\/$/, '');
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
};

/* ---------- settings ---------- */
const navLang = (navigator.language || 'en').toLowerCase();
const settings = Object.assign({ lang: /^(nb|nn|no)/.test(navLang) ? 'nb' : 'en', read: 'voice', rate: 0.95, voice: '', apiKey: '', autoModels: null }, store.get('eli5.settings', {}));
const saveSettings = () => store.set('eli5.settings', settings);
const hasKey = () => !!(settings.apiKey || PROXY);

/* ---------- texts ---------- */
const T = {
  en: {
    install: 'Install app', heroTitle: 'What do you wonder about?', heroSub: "Type or say a word or phrase. I'll explain it like you're five.",
    askPh: 'e.g. black hole', followPh: 'Ask about this…', listening: 'Listening… talk now', tryLabel: 'Try:', recent: 'Recent', clear: 'Clear',
    wantMore: 'Want more?', settings: 'Settings', lang: 'Language', readAloud: 'Read answers aloud', readOff: 'Off', readVoice: 'When I talk', readAlways: 'Always',
    voice: 'Voice', speed: 'Speaking speed', advanced: 'Advanced', ownKey: 'Own Gemini key (optional)', ownKeyHint: "Only needed if the built-in AI isn't working. Free key at aistudio.google.com/apikey",
    done: 'Done', iosTitle: 'Install on iPhone', iosText: 'Tap the Share button in Safari, then «Add to Home Screen».', ok: 'OK',
    more: 'Tell me more', other: 'Say it another way', example: 'Give an example', why: 'Why?', older: a => a === 'adult' ? 'Like a grown-up' : `Like I'm ${a}`,
    level: a => a === 5 ? '' : a === 'adult' ? 'Grown-up' : `Age ${a}`, read: 'Read', stop: 'Stop', copy: 'Copy', share: 'Share', copied: 'Copied!', retry: 'Try again',
    whatIs: w => `What does “${w}” mean?`, version: 'Version', installed: 'Eli5 is installed', installHow: 'Open the browser menu ⋮ and choose «Install app».',
    noMic: "Your browser can't listen. Type instead.", micDenied: 'The app may not use the microphone. Allow it in the browser settings.', noSpeech: "I didn't hear anything. Try again!",
    transcribing: 'Writing down what you said…', noKey: 'The AI isn’t set up yet. The owner must add the CLOUDFLARE_API_TOKEN secret in the GitHub repo (or add your own key in Settings).',
    offline: 'You are offline. Connect to the internet and try again.', busy: 'The free AI is busy right now. Wait a moment and try again.', slow: 'The AI took too long. Try again.',
    badKey: 'The AI key is not valid.', blocked: 'The AI would not answer that one.', empty: 'The AI gave an empty answer. Try again.',
    st_wiki: 'Looking it up on Wikipedia…', st_write: 'Writing a simple explanation…', st_check: 'Checking that every fact is right…',
    checkedWiki: 'Fact-checked against Wikipedia:', checked: 'Fact-checked', unchecked: 'Could not double-check this one.', recheck: 'Check again',
    shareApp: 'Share Eli5 with someone', shareText: 'Eli5 explains any word or phrase like you’re five. Type or just say it:', linkCopied: 'Link copied – paste it in a message',
    statusOk: 'AI connected ✓', statusBad: 'AI not reachable', statusOwn: 'Using your own key', defaultVoice: 'Default voice', langNames: { en: 'English', nb: 'Norwegian' },
    kids: [['🌈', 'rainbow'], ['🕳️', 'black hole'], ['🌐', 'the internet'], ['🍎', 'gravity'], ['💉', 'vaccine'], ['🌱', 'photosynthesis'], ['💸', 'inflation'], ['🤖', 'artificial intelligence'], ['⚡', 'electricity'], ['🧬', 'DNA'], ['🌋', 'volcano'], ['⛓️', 'blockchain'], ['🧲', 'magnet'], ['🌍', 'climate change'], ['📈', 'stock market'], ['🦠', 'bacteria'], ['🌙', 'why the moon changes shape'], ['🗳️', 'democracy'], ['✈️', 'how planes fly'], ['🧊', 'why ice floats']],
  },
  nb: {
    install: 'Installer app', heroTitle: 'Hva lurer du på?', heroSub: 'Skriv eller si et ord eller en setning. Jeg forklarer det som om du er fem år.',
    askPh: 'f.eks. sort hull', followPh: 'Spør mer om dette…', listening: 'Lytter … snakk nå', tryLabel: 'Prøv:', recent: 'Nylig', clear: 'Tøm',
    wantMore: 'Vil du vite mer?', settings: 'Innstillinger', lang: 'Språk', readAloud: 'Les svarene høyt', readOff: 'Av', readVoice: 'Når jeg snakker', readAlways: 'Alltid',
    voice: 'Stemme', speed: 'Lesehastighet', advanced: 'Avansert', ownKey: 'Egen Gemini-nøkkel (valgfritt)', ownKeyHint: 'Trengs bare hvis den innebygde AI-en ikke virker. Gratis nøkkel på aistudio.google.com/apikey',
    done: 'Ferdig', iosTitle: 'Installer på iPhone', iosText: 'Trykk på Del-knappen i Safari, og velg «Legg til på Hjem-skjerm».', ok: 'OK',
    more: 'Fortell mer', other: 'Si det på en annen måte', example: 'Gi et eksempel', why: 'Hvorfor?', older: a => a === 'adult' ? 'Som til en voksen' : `Som om jeg er ${a}`,
    level: a => a === 5 ? '' : a === 'adult' ? 'Voksen' : `${a} år`, read: 'Les', stop: 'Stopp', copy: 'Kopier', share: 'Del', copied: 'Kopiert!', retry: 'Prøv igjen',
    whatIs: w => `Hva betyr «${w}»?`, version: 'Versjon', installed: 'Eli5 er installert', installHow: 'Åpne menyen ⋮ i nettleseren og velg «Installer app».',
    noMic: 'Nettleseren kan ikke lytte. Skriv i stedet.', micDenied: 'Appen får ikke bruke mikrofonen. Tillat det i nettleserens innstillinger.', noSpeech: 'Jeg hørte ingenting. Prøv igjen!',
    transcribing: 'Skriver ned det du sa …', noKey: 'AI-en er ikke satt opp ennå. Eieren må legge inn secret CLOUDFLARE_API_TOKEN i GitHub-repoet (eller legg inn egen nøkkel under Innstillinger).',
    offline: 'Du er ikke på nett. Koble til internett og prøv igjen.', busy: 'Den gratis AI-en er opptatt akkurat nå. Vent litt og prøv igjen.', slow: 'AI-en brukte for lang tid. Prøv igjen.',
    badKey: 'AI-nøkkelen er ikke gyldig.', blocked: 'AI-en ville ikke svare på det.', empty: 'AI-en ga et tomt svar. Prøv igjen.',
    st_wiki: 'Slår opp på Wikipedia …', st_write: 'Skriver en enkel forklaring …', st_check: 'Sjekker at alle fakta stemmer …',
    checkedWiki: 'Faktasjekket mot Wikipedia:', checked: 'Faktasjekket', unchecked: 'Klarte ikke å dobbeltsjekke denne.', recheck: 'Sjekk igjen',
    shareApp: 'Del Eli5 med noen', shareText: 'Eli5 forklarer alle ord og uttrykk som om du er fem år. Bare skriv eller si det:', linkCopied: 'Lenken er kopiert – lim den inn i en melding',
    statusOk: 'AI tilkoblet ✓', statusBad: 'Får ikke kontakt med AI-en', statusOwn: 'Bruker din egen nøkkel', defaultVoice: 'Standardstemme', langNames: { en: 'engelsk', nb: 'norsk' },
    kids: [['🌈', 'regnbue'], ['🕳️', 'sort hull'], ['🌐', 'internett'], ['🍎', 'tyngdekraft'], ['💉', 'vaksine'], ['🌱', 'fotosyntese'], ['💸', 'inflasjon'], ['🤖', 'kunstig intelligens'], ['⚡', 'strøm'], ['🧬', 'DNA'], ['🌋', 'vulkan'], ['⛓️', 'blokkjede'], ['🧲', 'magnet'], ['🌍', 'klimaendringer'], ['📈', 'aksjemarkedet'], ['🦠', 'bakterier'], ['🌙', 'hvorfor månen skifter form'], ['🗳️', 'demokrati'], ['✈️', 'hvordan fly flyr'], ['🌧️', 'hvorfor det regner']],
  },
};
const t = (k, ...a) => { const v = T[settings.lang][k] ?? T.en[k]; return typeof v === 'function' ? v(...a) : v; };
const SR_LANG = { en: 'en-US', nb: 'nb-NO' };
const AGES = [5, 8, 12, 16, 'adult'];

function applyTexts() {
  document.documentElement.lang = settings.lang === 'nb' ? 'nb' : 'en';
  document.querySelectorAll('[data-t]').forEach(el => { const v = t(el.dataset.t); if (typeof v === 'string') el.textContent = v; });
  document.querySelectorAll('[data-tp]').forEach(el => el.placeholder = t(el.dataset.tp));
  $('#langLabel').textContent = settings.lang === 'nb' ? 'NO' : 'EN';
  $('#versionLabel').textContent = `${t('version')} ${VERSION}`;
  renderTry(); renderRecent();
  if (current) { renderThread(); }
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, ms = 2600) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms); }

/* ---------- Gemini (picks the newest free Flash model automatically) ---------- */
let rawModels = null, modelCache = null;
async function fetchModelList() {
  if (rawModels) return rawModels;
  const r = settings.apiKey
    ? await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { headers: { 'x-goog-api-key': settings.apiKey } })
    : await fetch(PROXY + '/models');
  if (!r.ok) throw new Error('models ' + r.status);
  return (rawModels = (await r.json()).models || []);
}
function rankModels(list) {
  const bad = /(image|tts|audio|live|embed|vision|thinking-exp|computer|robotics|veo|imagen|aqa|gemma|nano|banana)/i;
  const usable = list.filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace(/^models\//, '')).filter(n => /^gemini/.test(n) && /flash/.test(n) && !bad.test(n));
  const ver = n => { const v = n.match(/gemini-(\d+(?:\.\d+)?)/); return v ? parseFloat(v[1]) : 0; };
  const score = n => ver(n) * 100 - (/lite/.test(n) ? 30 : 0) - (/(preview|exp)/.test(n) ? 15 : 0) - (/-\d{3,}$/.test(n) ? 1 : 0) + (/latest/.test(n) ? 50 : 0);
  return usable.sort((a, b) => score(b) - score(a));
}
async function pickModels() {
  if (modelCache) return modelCache;
  const c = settings.autoModels;
  if (c && Date.now() - c.t < 864e5 && c.list?.length && c.key === !!settings.apiKey) return (modelCache = c.list);
  try {
    const all = rankModels(await fetchModelList());
    // Main models first, then one lite model as a last resort (it has its own free quota)
    const list = [...all.filter(n => !/lite/.test(n)).slice(0, 3), ...all.filter(n => /lite/.test(n)).slice(0, 1)];
    if (list.length) { modelCache = list; settings.autoModels = { t: Date.now(), list, key: !!settings.apiKey }; saveSettings(); return list; }
  } catch { }
  return [DEFAULT_MODEL, 'gemini-flash-lite-latest'];
}
function thinkCfg(m, level = 'low') {
  if (/gemini-2\.5/.test(m)) return /pro/.test(m) ? null : { thinkingBudget: 0 };
  if (/gemini-([3-9]|\d{2})/.test(m)) return { thinkingLevel: level };
  return null;
}
async function readSSE(r, onText, signal) {
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', full = '', blocked = false;
  for (;;) {
    if (signal?.aborted) { rd.cancel().catch(() => { }); throw new DOMException('aborted', 'AbortError'); }
    const { value, done } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      let d; try { d = JSON.parse(line.slice(5)); } catch { continue; }
      if (d.error) throw new Error(d.error.message || 'AI error');
      if (d.promptFeedback?.blockReason) blocked = true;
      const tx = (d.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
      if (tx) { full += tx; onText(full); }
    }
  }
  if (!full.trim()) throw new Error(blocked ? t('blocked') : t('empty'));
  return full;
}
const cooldown = {}; let fastModel = null, searchOffUntil = 0;
function orderModels(list) {
  const now = Date.now();
  const ok = list.filter(m => !(cooldown[m] > now)), busy = list.filter(m => cooldown[m] > now).sort((a, b) => cooldown[a] - cooldown[b]);
  if (fastModel && ok.includes(fastModel)) ok.splice(ok.indexOf(fastModel), 1), ok.unshift(fastModel);
  return [...ok, ...busy];
}
const retryDelayOf = msg => { const m = String(msg).match(/retry in ([\d.]+)s|"retryDelay":\s*"(\d+)s"/i); return m ? Math.ceil(+(m[1] || m[2]) * 1000) : 0; };

let lastModel = null;
async function gemini({ contents, system = '', temp = 0.3, onText = null, signal = null, tools = null, avoid = null, think = 'low' }) {
  if (!hasKey()) throw new Error(t('noKey'));
  if (!navigator.onLine) throw new Error(t('offline'));
  const base = await pickModels(), stream = !!onText, direct = !!settings.apiKey;
  const body = { contents, generationConfig: { temperature: temp } };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  let lastErr;
  for (let round = 0; round < 2; round++) {
    let order = orderModels(base);
    // A different model checks the answer than the one that wrote it (catches more mistakes)
    if (avoid && order.length > 1 && order.includes(avoid)) order = [...order.filter(x => x !== avoid), avoid];
    for (const m of order) {
      if (round === 0 && cooldown[m] > Date.now() && base.some(x => !(cooldown[x] > Date.now()))) continue;
      let useThink = true, useTools = !!tools && !(searchOffUntil > Date.now());
      for (let again = 0; again < 3; again++) {
        const gc = { ...body.generationConfig };
        if (useThink) { const th = thinkCfg(m, think); if (th) gc.thinkingConfig = th; }
        const url = direct
          ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`
          : `${PROXY}/${stream ? 'stream' : 'gemini'}/${encodeURIComponent(m)}`;
        const ac = new AbortController(); let started = false;
        const onAbort = () => ac.abort(); signal?.addEventListener('abort', onAbort);
        let timer = setTimeout(() => ac.abort(), stream ? 20000 : 15000);
        const r = await fetch(url, {
          method: 'POST', signal: ac.signal, body: JSON.stringify({ ...body, generationConfig: gc, ...(useTools ? { tools } : {}) }),
          headers: direct ? { 'Content-Type': 'application/json', 'x-goog-api-key': settings.apiKey } : { 'Content-Type': 'application/json' },
        }).catch(e => ({ ok: false, status: e.name === 'AbortError' ? -1 : 0 }));
        const done = () => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); };
        if (signal?.aborted) { done(); throw new DOMException('aborted', 'AbortError'); }
        if (r.ok) {
          try {
            let txt;
            if (stream) {
              txt = await readSSE(r, f => { if (!started) { started = true; clearTimeout(timer); timer = setTimeout(() => ac.abort(), 90000); } onText(f); }, ac.signal);
            } else {
              const d = await r.json();
              txt = (d.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
              if (!txt.trim()) throw new Error(d.promptFeedback?.blockReason ? t('blocked') : t('empty'));
            }
            done(); lastModel = m; if (!tools) fastModel = /lite/.test(m) ? fastModel : m;
            return txt.trim();
          } catch (e) {
            done();
            if (signal?.aborted) throw e;
            if (e.name === 'AbortError' && !started) { cooldown[m] = Date.now() + 30000; lastErr = new Error(t('slow')); break; }
            throw e;
          }
        }
        done();
        if (r.status === -1) { cooldown[m] = Date.now() + 30000; lastErr = new Error(t('slow')); break; }
        let msg = ''; try { msg = (await r.json()).error?.message || ''; } catch { }
        if (r.status === 400 && useThink && /think/i.test(msg)) { useThink = false; continue; }
        if (useTools && (r.status === 400 || r.status === 429) && /search|ground|tool/i.test(msg)) { useTools = false; searchOffUntil = Date.now() + 30 * 60e3; continue; }
        if (r.status === 404) { modelCache = null; settings.autoModels = null; saveSettings(); lastErr = new Error('Model not found: ' + m); break; }
        if (r.status === 400 && /API key/i.test(msg)) throw new Error(t('badKey'));
        if (r.status === 403) throw new Error(msg || t('noKey'));
        if ([429, 500, 503, 0].includes(r.status)) {
          cooldown[m] = Date.now() + (r.status === 429 ? Math.max(retryDelayOf(msg), /per day|daily|PerDay/i.test(msg) ? 3600e3 : 60000) : 20000);
          lastErr = new Error(r.status === 429 || r.status >= 500 ? t('busy') : t('offline'));
          if (r.status === 0) { await sleep(700); continue; }
          break;
        }
        throw new Error(msg || 'AI error ' + r.status);
      }
    }
    if (round === 0) await sleep(1200);
  }
  throw lastErr || new Error(t('busy'));
}

/* ---------- prompts ---------- */
const LEVEL = {
  5: 'a five-year-old child. Use only very short, everyday words a five-year-old knows. Very short sentences. Compare it to something a small child knows from daily life (toys, food, animals, playing, family, the body). 2–4 sentences, under 60 words',
  8: 'an eight-year-old. Use simple words and short sentences. Use a comparison from everyday life. 3–5 sentences, under 90 words',
  12: 'a twelve-year-old. Plain words; you may use a couple of real terms if you explain them right away. Say how or why it works. Under 120 words',
  16: 'a teenager of sixteen. Use the proper terms but explain them plainly. Explain how and why. Under 160 words',
  adult: 'a curious adult who is not an expert. Be precise but plain and concrete. Under 200 words',
};
function systemPrompt(th) {
  const langName = th.lang === 'nb' ? 'Norwegian bokmål' : 'English';
  return `You are Eli5. You explain any word, phrase, idea or question so simply that the listener understands it right away.
The listener is ${LEVEL[th.age]}.
Rules:
- ACCURACY COMES FIRST. Simplify by leaving things out, never by saying something that is not true. A simple sentence must still be a true sentence.
- Take your facts from the SOURCES below. Do not add facts that are not in the sources, unless they are basic, undisputed common knowledge.
- Never invent or guess numbers, dates, names, places, records or quotes. If you are not sure of a detail, leave it out.
- Avoid "always", "never", "all", "only", "the biggest", "the first" unless that is exactly true.
- A comparison must not make the listener believe something false. If a comparison only partly fits, say "a bit like" and keep it to what really matches.
- Explain facts, never opinions. Don't say whether something is good or bad, right or wrong, and don't repeat what some people think as if it were a fact.
- If something is a matter of opinion, politics, religion or taste, explain neutrally what it is, and say simply that people think differently about it, without taking a side.
- If scientists or experts don't know yet, or disagree, say that simply instead of picking a side.
- If the sources don't cover the question and you are not completely sure, say honestly and simply that you are not sure, instead of guessing.
- Be warm, friendly and concrete. No talking down, no "Great question!", no filler.
- Start every answer with ONE emoji that fits, alone on the first line.
- Plain text only: no headings, no bullet lists, no bold, no markdown. Use a blank line between paragraphs if you need more than one.
- Mark at most 2 words in your answer that the listener might not know with double square brackets, like [[engine]], so they can tap them for an explanation. Only mark words you actually used. Never mark the topic itself.
- If the word has several common meanings, explain the most common one, then add one short last paragraph starting with "(" that mentions the other meaning(s) and ends with ")".
- If it looks like a misspelling, explain the word they most likely meant.
- If it is a person, place, brand or event, explain who or what it is and why people know about it.
- If the topic is sad, scary or grown-up, still explain it honestly, but gently and calmly.
- For follow-ups, keep to the listener level above, add something new, and don't repeat what you already said.
- Always write in ${langName}, even if the question is in another language.

${sourcesBlock(th.sources)}`;
}
function sourcesBlock(src) {
  if (!src?.length) return 'SOURCES: No Wikipedia article was found for this. Only say things you are completely sure are true. If you don\'t know what it is, say so simply and ask what they mean.';
  return 'SOURCES (from Wikipedia). If a source is about something else than what is asked, ignore that source.\n\n' +
    src.map((x, i) => `[${i + 1}] ${x.lang === 'no' ? 'Norwegian' : 'English'} Wikipedia: "${x.title}"\n${x.text}`).join('\n\n');
}
function verifyPrompt(th) {
  return `You are a strict fact-checker for an app that explains things to children and curious people.
The app simplifies on purpose. Leaving out details is fine, and simple words are fine. But NOTHING it says may be false or misleading.
Check the ANSWER against the SOURCES and against your own solid knowledge.
Flag: factual errors; wrong or made-up numbers, dates, names or places; claims the sources don't support and that aren't basic common knowledge; comparisons that would make the listener believe something false; words like "always", "never", "all", "only" that make a claim untrue; explaining the wrong meaning of the word; presenting something uncertain or disputed as settled; opinions or value judgements presented as facts (saying something is good/bad/right/wrong, or taking a side on a political, religious or moral question).
Do NOT flag simplifications that are still true, and do not flag style.
Reply with JSON only, no other text:
{"source_matches": [numbers of the sources that are about what was asked, e.g. [1]],
 "ok": true or false,
 "issues": ["short description of each problem"],
 "fixed": "only if ok is false: the full corrected answer. Same language, same listener level, about the same length, same format: one emoji alone on the first line, then plain text, keep or add at most 2 [[hard words]]. Fix only what is wrong. If ok is true: empty string"}

${sourcesBlock(th.sources)}`;
}
function parseJSON(t) {
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(t); } catch { }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error('bad json');
}

/* ---------- Wikipedia ---------- */
const WIKI_LANG = { en: 'en', nb: 'no' };
async function wikiApi(lang, params, signal) {
  const r = await fetch(`https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', ...params }), { signal });
  if (!r.ok) throw new Error('wiki ' + r.status);
  return r.json();
}
async function wikiArticle(lang, page, max, signal) {
  const e = await wikiApi(lang, { prop: 'extracts', explaintext: '1', exsectionformat: 'plain', titles: page.title, redirects: '1' }, signal);
  let text = (e.query?.pages?.[0]?.extract || '').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 80) return null;
  if (text.length > max) text = text.slice(0, max).replace(/\s+\S*$/, '') + ' …';
  return { lang, title: page.title, url: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`, text };
}
/* One quick request per language: search + the article intros in one go */
async function wikiSearch(q, lang, n, signal) {
  const d = await wikiApi(lang, { generator: 'search', gsrsearch: q, gsrlimit: '5', prop: 'extracts|pageprops|info', exintro: '1', explaintext: '1', exlimit: '5', ppprop: 'disambiguation', inprop: 'url', redirects: '1' }, signal);
  return (d.query?.pages || []).filter(p => !(p.pageprops && 'disambiguation' in p.pageprops) && (p.extract || '').length >= 80)
    .sort((a, b) => a.index - b.index).slice(0, n)
    .map((p, i) => {
      let text = p.extract.replace(/\n{3,}/g, '\n\n').trim(); const max = i ? 1200 : 2500;
      if (text.length > max) text = text.slice(0, max).replace(/\s+\S*$/, '') + ' …';
      return { lang, title: p.title, url: p.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`, text };
    });
}
const wikiCache = new Map();   // looked up while you type, so it's ready when you press go
function gatherSources(q, lang) {
  const key = lang + '|' + q.trim().toLowerCase();
  if (wikiCache.has(key)) return wikiCache.get(key);
  const main = WIKI_LANG[lang] || 'en';
  const jobs = [wikiSearch(q, main, 2)];
  if (main !== 'en') jobs.push(wikiSearch(q, 'en', 1));   // English Wikipedia is often more complete
  const pr = Promise.allSettled(jobs).then(res => res.flatMap(r => r.status === 'fulfilled' ? r.value : []));
  wikiCache.set(key, pr); if (wikiCache.size > 30) wikiCache.delete(wikiCache.keys().next().value);
  pr.then(l => { if (!l.length) wikiCache.delete(key); });
  return pr;
}
function prefetchWiki(q) { q = cleanTopic(q || ''); if (q.length >= 2) gatherSources(q, settings.lang).catch(() => { }); }
let prefetchTimer;
function prefetchSoon(q) { clearTimeout(prefetchTimer); prefetchTimer = setTimeout(() => prefetchWiki(q), 450); }
/* Fuller articles for "tell me more" etc. – fetched in the background after the first answer */
const deepJobs = new Map();
function deepenSources(th) {
  if (deepJobs.has(th.id)) return deepJobs.get(th.id);
  const job = Promise.all((th.sources || []).map(async (s, i) => {
    if (s.full) return;
    const a = await wikiArticle(s.lang, s, i ? 2500 : 6000).catch(() => null);
    if (a) { s.text = a.text; s.full = true; }
  }));
  deepJobs.set(th.id, job); return job;
}
function addSources(th, list) {
  th.sources = th.sources || [];
  for (const s of list) if (!th.sources.some(x => x.url === s.url)) th.sources.push(s);
  th.sources = th.sources.slice(0, 6);
}
const FOLLOW = {
  more: () => 'Tell me more about it. Add new things I haven’t heard yet, like how it works or why. Keep it just as simple.',
  other: () => 'I didn’t quite get it. Explain it again in a completely different way, with a new comparison.',
  example: () => 'Give me one or two concrete examples from everyday life that I would know.',
  why: () => 'Why is it like that? Or why does it matter? Explain simply.',
  older: a => a === 'adult' ? 'Now explain it to me like I’m a grown-up. Use the real words, but keep it clear.' : `Now explain it like I’m ${a} years old. You may use a few more precise words.`,
};

/* ---------- threads ---------- */
let current = null, abortCtl = null, busy = false;
const loadHistory = () => store.get('eli5.history', []);
function saveThread(th) {
  const h = loadHistory().filter(x => x.id !== th.id);
  h.unshift(th); store.set('eli5.history', h.slice(0, 40));
}
function newThread(topic) {
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), topic, lang: settings.lang, age: 5, turns: [], t: Date.now() };
}
function contentsOf(th) {
  return th.turns.filter(x => !x.error).map((x, i) => ({ role: x.role, parts: [{ text: x.role === 'user' ? (i === 0 ? `Explain this: ${x.text}` : x.prompt || x.text) : x.text }] }));
}

function cleanTopic(s) { return s.replace(/\s+/g, ' ').trim().replace(/^["“«]|["”»]$/g, ''); }
async function explain(topic, spoken = false) {
  topic = cleanTopic(topic); if (!topic) return;
  stopSpeaking(); abortCtl?.abort();
  current = newThread(topic);
  current.turns.push({ role: 'user', text: topic });
  showThread();
  await ask(spoken);
}
async function follow(kind, extra, spoken = false) {
  if (!current || busy) return;
  stopSpeaking(); current.lang = settings.lang;
  let label, prompt;
  let term;
  if (kind === 'older') { current.age = extra; label = '📈 ' + t('older', extra); prompt = FOLLOW.older(extra); }
  else if (kind === 'term') { label = '🔎 ' + t('whatIs', extra); prompt = `What does "${extra}" mean? Explain just that word, in the context of what we talked about.`; term = extra; }
  else if (kind === 'ask') { label = extra; prompt = extra; }
  else { label = { more: '🔍 ', other: '🔄 ', example: '💡 ', why: '🤔 ' }[kind] + t(kind); prompt = FOLLOW[kind](); }
  current.turns.push({ role: 'user', text: label, prompt, kind, term });
  renderThread(); scrollEnd();
  await ask(spoken);
}
function setStatus(turn, st) { turn.status = st; if (current) updateLastCard(); }
async function ask(spoken) {
  const th = current; busy = true;
  // drop any old failed answer before trying again
  th.turns = th.turns.filter(x => !x.error);
  const turn = { role: 'model', text: '', age: th.age, pending: true, status: 'wiki' };
  th.turns.push(turn);
  renderThread(); scrollEnd();
  abortCtl = new AbortController(); const signal = abortCtl.signal;
  try {
    // 1. Look it up on Wikipedia (the topic first time, and any tapped word)
    const req = th.turns.filter(x => x.role === 'user').slice(-1)[0];
    if (!th.sources) addSources(th, await gatherSources(th.topic, th.lang).catch(() => []));
    else if (req.kind === 'term') addSources(th, await gatherSources(req.term, th.lang).catch(() => []));
    else if (req !== th.turns[0]) await Promise.race([deepenSources(th), sleep(2500)]);   // more depth for follow-ups
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    // 2. Write the answer from the sources
    setStatus(turn, 'write');
    const contents = contentsOf({ turns: th.turns.filter(x => x !== turn) });
    let txt = await gemini({ contents, system: systemPrompt(th), signal, think: 'minimal' });
    // 3. Fact-check it (another model, against the same sources) and fix anything wrong before showing it
    setStatus(turn, 'check');
    const reqText = req === th.turns[0] ? `Explain: ${th.topic}` : `${req.prompt || req.text} (the conversation is about: ${th.topic})`;
    try {
      const v = parseJSON(await gemini({
        temp: 0, signal, system: verifyPrompt(th),
        contents: [{ role: 'user', parts: [{ text: `REQUEST: ${reqText}\nLISTENER: ${LEVEL[th.age].split('.')[0]}\n\nANSWER TO CHECK:\n${txt}` }] }],
      }));
      if (v.ok === false && typeof v.fixed === 'string' && v.fixed.trim().length > 10) { txt = v.fixed.trim(); turn.checked = 'fixed'; }
      else turn.checked = 'ok';
      const used = (Array.isArray(v.source_matches) ? v.source_matches : []).map(n => th.sources[+n - 1]).filter(Boolean);
      turn.sources = used.map(({ title, url, lang }) => ({ title, url, lang }));
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      turn.checked = 'no';
    }
    turn.text = txt; turn.pending = false; delete turn.status;
    if (current !== th) return;
    th.t = Date.now(); saveThread(th); deepenSources(th);
    renderThread();
    if (settings.read === 'always' || (settings.read === 'voice' && spoken)) speak(turn, th.turns.length - 1);
  } catch (e) {
    if (e.name === 'AbortError') { th.turns = th.turns.filter(x => x !== turn); return; }
    turn.pending = false; turn.error = true; turn.text = e.message || String(e);
    if (current === th) renderThread();
  } finally { if (current === th) busy = false; renderMore(); }
}

/* ---------- rendering ---------- */
function parseAnswer(text) {
  let s = text.replace(/\*\*|__|^#+\s*/gm, '').trim();
  let emoji = '';
  const first = s.split('\n')[0].trim();
  if (first && first.length <= 8 && /\p{Extended_Pictographic}/u.test(first) && !/[\p{L}\p{N}]/u.test(first)) { emoji = first; s = s.slice(s.indexOf('\n') + 1).trim(); }
  else { const m = s.match(/^(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)\s*/u); if (m && s.length > m[0].length) { emoji = m[1]; s = s.slice(m[0].length); } }
  return { emoji, body: s };
}
function bodyHTML(body, streaming) {
  const paras = body.split(/\n\s*\n|\n/).map(p => p.trim()).filter(Boolean);
  return paras.map((p, i) => {
    let h = esc(p).replace(/\[\[([^\]\n]{1,40})\]\]/g, (_, w) => `<button class="term" data-term="${esc(w)}">${esc(w)}</button>`).replace(/\[\[|\]\]/g, '');
    const aside = /^\(.*\)$/.test(p) && i > 0;
    return `<p class="${aside ? 'aside' : ''}${streaming && i === paras.length - 1 ? ' cursor' : ''}">${h}</p>`;
  }).join('') || (streaming ? '<p class="cursor"></p>' : '');
}
const ICON = {
  read: '<svg viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  stop: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
};
function cardHTML(turn, idx) {
  if (turn.error) return `<div class="card err" data-idx="${idx}"><div class="body"><p>😕 ${esc(turn.text)}</p></div><div class="acts"><button class="retry" data-act="retry">↻ ${esc(t('retry'))}</button></div></div>`;
  if (turn.pending && !turn.text) return `<div class="card" data-idx="${idx}"><div class="typing"><i></i><i></i><i></i></div><p class="status">${esc(t('st_' + (turn.status || 'write')))}</p></div>`;
  const { emoji, body } = parseAnswer(turn.text);
  const lvl = t('level', turn.age ?? 5);
  const speakingThis = speakingIdx === idx;
  const acts = turn.pending ? '' : `<div class="acts">
    <button data-act="read" class="${speakingThis ? 'speaking' : ''}">${speakingThis ? ICON.stop : ICON.read}<span>${esc(speakingThis ? t('stop') : t('read'))}</span></button>
    <button data-act="copy">${ICON.copy}<span>${esc(t('copy'))}</span></button>
    ${navigator.share ? `<button data-act="share">${ICON.share}<span>${esc(t('share'))}</span></button>` : ''}</div>`;
  let chk = '';
  if (turn.checked === 'no') chk = `<p class="check warn">⚠️ ${esc(t('unchecked'))}${!turn.pending && idx === current.turns.length - 1 ? ` <button class="link-btn" data-act="redo">↻ ${esc(t('recheck'))}</button>` : ''}</p>`;
  else if (turn.checked) {
    const links = (turn.sources || []).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`).join(', ');
    chk = `<p class="check">✓ ${links ? esc(t('checkedWiki')) + ' ' + links : esc(t('checked'))}</p>`;
  }
  return `<div class="card" data-idx="${idx}">${lvl ? `<span class="level">${esc(lvl)}</span>` : ''}${emoji ? `<div class="emo">${emoji}</div>` : ''}<div class="body">${bodyHTML(body, turn.pending)}</div>${chk}${acts}</div>`;
}
function renderThread() {
  if (!current) return;
  $('#topicTitle').textContent = current.topic;
  $('#turns').innerHTML = current.turns.map((x, i) => {
    if (x.role === 'user') return i === 0 ? '' : `<div class="q"><span>${esc(x.text)}</span></div>`;
    return cardHTML(x, i);
  }).join('');
  renderMore();
}
function updateLastCard() {
  const idx = current.turns.length - 1, el = $(`#turns .card[data-idx="${idx}"]`);
  if (el) el.outerHTML = cardHTML(current.turns[idx], idx); else renderThread();
  nearBottomScroll();
}
function renderMore() {
  const show = current && !busy && current.turns.some(x => x.role === 'model' && !x.error && !x.pending);
  $('#more').hidden = !show;
  if (!show) return;
  const i = AGES.indexOf(current.age), next = AGES[i + 1];
  const chips = [['more', '🔍'], ['other', '🔄'], ['example', '💡'], ['why', '🤔']].map(([k, e]) => `<button class="chip" data-follow="${k}"><span class="e">${e}</span>${esc(t(k))}</button>`);
  if (next) chips.push(`<button class="chip" data-follow="older" data-age="${next}"><span class="e">📈</span>${esc(t('older', next))}</button>`);
  $('#moreChips').innerHTML = chips.join('');
}
function scrollEnd() { requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })); }
function nearBottomScroll() { if (window.innerHeight + window.scrollY > document.body.scrollHeight - 260) window.scrollTo({ top: document.body.scrollHeight }); }

function renderTry() {
  const list = [...T[settings.lang].kids].sort(() => Math.random() - .5).slice(0, 6);
  $('#tryChips').innerHTML = list.map(([e, w]) => `<button class="chip" data-try="${esc(w)}"><span class="e">${e}</span>${esc(w)}</button>`).join('');
}
function renderRecent() {
  const h = loadHistory();
  $('#recentWrap').hidden = !h.length;
  $('#recentList').innerHTML = h.slice(0, 12).map(th => {
    const ans = th.turns.find(x => x.role === 'model' && !x.error);
    const emo = ans ? parseAnswer(ans.text).emoji || '💬' : '💬';
    const n = th.turns.filter(x => x.role === 'model' && !x.error).length;
    return `<li><button data-open="${th.id}"><span class="re">${emo}</span><span class="rt">${esc(th.topic)}</span>${n > 1 ? `<span class="rn">+${n - 1}</span>` : ''}</button></li>`;
  }).join('');
}

/* ---------- views ---------- */
function showThread(push = true) {
  document.body.classList.add('in-thread'); $('#home').hidden = true; $('#thread').hidden = false; $('#followForm').hidden = false; $('#backBtn').hidden = false;
  $('#followInput').value = '';
  renderThread(); window.scrollTo(0, 0);
  if (push) history.pushState({ v: 'thread' }, '');
}
function showHome() {
  stopListening(); stopSpeaking(); abortCtl?.abort(); busy = false; current = null;
  document.body.classList.remove('in-thread'); $('#home').hidden = false; $('#thread').hidden = true; $('#followForm').hidden = true; $('#backBtn').hidden = true;
  $('#askInput').value = ''; renderRecent(); window.scrollTo(0, 0);
}
addEventListener('popstate', () => { if (current) showHome(); });
$('#backBtn').onclick = () => history.state?.v === 'thread' ? history.back() : showHome();
$('#brand').onclick = () => { if (current) $('#backBtn').click(); };

/* ---------- events ---------- */
$('#askInput').addEventListener('input', e => prefetchSoon(e.target.value));
$('#tryChips').addEventListener('pointerdown', e => { const b = e.target.closest('[data-try]'); if (b) prefetchWiki(b.dataset.try); });
$('#askForm').onsubmit = e => { e.preventDefault(); stopListening(); const v = $('#askInput').value; if (v.trim()) { $('#askInput').blur(); explain(v); } };
$('#followForm').onsubmit = e => {
  e.preventDefault(); stopListening(); const v = $('#followInput').value.trim(); if (!v || busy) return;
  $('#followInput').value = ''; $('#followInput').blur(); follow('ask', v);
};
$('#tryChips').onclick = e => { const b = e.target.closest('[data-try]'); if (b) explain(b.dataset.try); };
$('#recentList').onclick = e => {
  const b = e.target.closest('[data-open]'); if (!b) return;
  const th = loadHistory().find(x => x.id === b.dataset.open); if (!th) return;
  current = th; showThread(); scrollEnd();
};
$('#clearRecent').onclick = () => { store.set('eli5.history', []); renderRecent(); };
$('#moreChips').onclick = e => {
  const b = e.target.closest('[data-follow]'); if (!b) return;
  follow(b.dataset.follow, b.dataset.age ? (b.dataset.age === 'adult' ? 'adult' : +b.dataset.age) : undefined);
};
$('#turns').onclick = async e => {
  const term = e.target.closest('[data-term]'); if (term) return follow('term', term.dataset.term);
  const b = e.target.closest('[data-act]'); if (!b) return;
  const idx = +b.closest('.card').dataset.idx, turn = current.turns[idx];
  const plain = () => { const { emoji, body } = parseAnswer(turn.text); return body.replace(/\[\[|\]\]/g, ''); };
  if (b.dataset.act === 'retry') { if (!busy) ask(false); }
  else if (b.dataset.act === 'redo') { if (!busy && idx === current.turns.length - 1) { current.turns.pop(); ask(false); } }
  else if (b.dataset.act === 'read') { speakingIdx === idx ? stopSpeaking() : speak(turn, idx); }
  else if (b.dataset.act === 'copy') { try { await navigator.clipboard.writeText(`${current.topic}\n\n${plain()}`); toast(t('copied')); } catch { } }
  else if (b.dataset.act === 'share') { navigator.share({ title: current.topic, text: `${current.topic}: ${plain()}`, url: location.href.split('#')[0] }).catch(() => { }); }
};

/* ---------- speaking (read aloud) ---------- */
let speakingIdx = -1, voices = [];
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = speechSynthesis.getVoices();
  const pre = settings.lang === 'nb' ? /^(nb|no|nn)/i : /^en/i;
  const list = voices.filter(v => pre.test(v.lang));
  $('#setVoice').innerHTML = `<option value="">${esc(t('defaultVoice'))}</option>` + list.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('');
  $('#setVoice').value = list.some(v => v.voiceURI === settings.voice) ? settings.voice : '';
}
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice() {
  const pre = settings.lang === 'nb' ? /^(nb|no|nn)/i : /^en/i;
  return voices.find(v => v.voiceURI === settings.voice && pre.test(v.lang))
    || voices.find(v => pre.test(v.lang) && /google|natural|neural|premium|enhanced/i.test(v.name))
    || voices.find(v => pre.test(v.lang));
}
function speak(turn, idx) {
  if (!('speechSynthesis' in window)) return;
  stopSpeaking();
  const { body } = parseAnswer(turn.text);
  const text = body.replace(/\[\[|\]\]/g, '').replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/[()]/g, ', ');
  // Split into sentences: long utterances get cut off on some phones
  const parts = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text];
  const v = pickVoice();
  speakingIdx = idx; renderThread();
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.trim());
    u.lang = SR_LANG[settings.lang]; u.rate = settings.rate; if (v) u.voice = v;
    if (i === parts.length - 1) u.onend = u.onerror = () => { if (speakingIdx === idx) { speakingIdx = -1; renderThread(); } };
    speechSynthesis.speak(u);
  });
}
function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (speakingIdx !== -1) { speakingIdx = -1; if (current) renderThread(); }
}

/* ---------- listening (talk) ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, recBtn = null, mediaRec = null;
function setListening(btn, on) {
  document.querySelectorAll('.mic').forEach(b => b.classList.remove('on'));
  if (on) btn.classList.add('on');
  $('#askListening').hidden = !(on && btn.id === 'askMic');
  if (on && btn.id === 'followMic') $('#followInput').placeholder = t('listening'); else $('#followInput').placeholder = t('followPh');
}
function stopListening() {
  if (rec) { try { rec.abort(); } catch { } rec = null; }
  if (mediaRec && mediaRec.state === 'recording') { mediaRec._cancel = true; mediaRec.stop(); }
  if (recBtn) setListening(recBtn, false); recBtn = null;
}
function listen(btn, input, onFinal) {
  if (recBtn === btn) {   // tap again = done talking
    if (rec) { try { rec.stop(); } catch { } } else if (mediaRec?.state === 'recording') mediaRec.stop();
    return;
  }
  stopListening(); stopSpeaking();
  recBtn = btn;
  if (SR) return listenSR(btn, input, onFinal);
  if (navigator.mediaDevices?.getUserMedia && window.MediaRecorder) return listenRecord(btn, input, onFinal);
  recBtn = null; toast(t('noMic'));
}
function listenSR(btn, input, onFinal) {
  const r = new SR(); rec = r;
  r.lang = SR_LANG[settings.lang]; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  let finalText = '', gotAny = false;
  const before = input.value;
  r.onstart = () => setListening(btn, true);
  r.onresult = ev => {
    let interim = ''; finalText = '';
    for (let i = 0; i < ev.results.length; i++) { const res = ev.results[i]; (res.isFinal ? (finalText += res[0].transcript) : (interim += res[0].transcript)); }
    gotAny = true; input.value = (finalText + interim).trim(); if (input.id === 'askInput') prefetchSoon(input.value);
  };
  r.onerror = ev => {
    if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') toast(t('micDenied'), 4500);
    else if (ev.error === 'no-speech') toast(t('noSpeech'));
    else if (ev.error === 'network' && navigator.mediaDevices?.getUserMedia && window.MediaRecorder) { rec = null; listenRecord(btn, input, onFinal); return; }
  };
  r.onend = () => {
    if (rec !== r) return;
    rec = null; recBtn = null; setListening(btn, false);
    const text = (finalText || (gotAny ? input.value : '')).trim();
    if (text) { input.value = text; onFinal(text); } else if (!gotAny) input.value = before;
  };
  try { r.start(); } catch { rec = null; recBtn = null; toast(t('noMic')); }
}
/* Fallback for browsers without speech recognition: record a clip and let Gemini write it down */
async function listenRecord(btn, input, onFinal) {
  let streamM;
  try { streamM = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch { recBtn = null; toast(t('micDenied'), 4500); return; }
  if (recBtn !== btn) { streamM.getTracks().forEach(x => x.stop()); return; }
  const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(x => MediaRecorder.isTypeSupported?.(x)) || '';
  const mr = new MediaRecorder(streamM, type ? { mimeType: type } : undefined); mediaRec = mr;
  const chunks = [];
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  // auto-stop after silence
  let ctx, raf, quietSince = 0, heard = false;
  try {
    ctx = new AudioContext(); const an = ctx.createAnalyser(); an.fftSize = 512; ctx.createMediaStreamSource(streamM).connect(an);
    const buf = new Uint8Array(an.fftSize), t0 = Date.now();
    const tick = () => {
      if (mr.state !== 'recording') return;
      an.getByteTimeDomainData(buf); let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
      const now = Date.now();
      if (peak > 14) { heard = true; quietSince = 0; } else if (!quietSince) quietSince = now;
      if ((heard && quietSince && now - quietSince > 1600) || now - t0 > 15000 || (!heard && now - t0 > 7000)) { mr.stop(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  } catch { setTimeout(() => mr.state === 'recording' && mr.stop(), 8000); }
  mr.onstop = async () => {
    cancelAnimationFrame(raf); ctx?.close().catch(() => { }); streamM.getTracks().forEach(x => x.stop());
    mediaRec = null; recBtn = null; setListening(btn, false);
    if (mr._cancel) return;
    if (!heard && ctx) { toast(t('noSpeech')); return; }
    const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
    toast(t('transcribing'), 8000);
    try {
      const b64 = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
      const txt = await gemini({ temp: 0, contents: [{ role: 'user', parts: [{ inlineData: { mimeType: (mr.mimeType || 'audio/webm').split(';')[0], data: b64 } }, { text: `Write down exactly what is said in this recording (it is most likely ${settings.lang === 'nb' ? 'Norwegian' : 'English'}). Output only the words, nothing else. If nothing is said, output nothing.` }] }] });
      $('#toast').classList.remove('show');
      const clean = txt.replace(/^["“«]|["”»]$/g, '').trim();
      if (clean) { input.value = clean; onFinal(clean); } else toast(t('noSpeech'));
    } catch (e) { toast(e.message || String(e), 4000); }
  };
  mr.start(250); setListening(btn, true);
}
$('#askMic').onclick = () => listen($('#askMic'), $('#askInput'), text => explain(text, true));
$('#followMic').onclick = () => { if (busy) return; listen($('#followMic'), $('#followInput'), text => { $('#followInput').value = ''; follow('ask', text, true); }); };

/* ---------- settings & language ---------- */
function setLang(l) {
  if (settings.lang === l) return;
  settings.lang = l; saveSettings(); stopListening(); stopSpeaking(); loadVoices(); applyTexts();
}
$('#langBtn').onclick = () => { setLang(settings.lang === 'nb' ? 'en' : 'nb'); toast(settings.lang === 'nb' ? 'Norsk' : 'English'); };
$('#settingsBtn').onclick = () => {
  $('#setLang').value = settings.lang; $('#setRead').value = settings.read; $('#setRate').value = settings.rate; $('#rateVal').textContent = settings.rate.toFixed(2) + '×';
  $('#setKey').value = settings.apiKey; loadVoices(); checkStatus(); $('#settingsDlg').showModal();
};
$('#setLang').onchange = e => { setLang(e.target.value); $('#setVoice').value = ''; };
$('#setRead').onchange = e => { settings.read = e.target.value; saveSettings(); };
$('#setVoice').onchange = e => { settings.voice = e.target.value; saveSettings(); speakSample(); };
$('#setRate').oninput = e => { settings.rate = +e.target.value; $('#rateVal').textContent = settings.rate.toFixed(2) + '×'; saveSettings(); };
$('#setRate').onchange = () => speakSample();
$('#setKey').onchange = e => { settings.apiKey = e.target.value.trim(); settings.autoModels = null; modelCache = null; rawModels = null; saveSettings(); checkStatus(); };
function speakSample() {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(settings.lang === 'nb' ? 'Hei! Sånn høres jeg ut.' : 'Hi! This is how I sound.');
  u.lang = SR_LANG[settings.lang]; u.rate = settings.rate; const v = pickVoice(); if (v) u.voice = v; speechSynthesis.speak(u);
}
async function checkStatus() {
  const el = $('#statusLine');
  if (settings.apiKey) { el.textContent = t('statusOwn'); return; }
  if (!PROXY) { el.textContent = t('noKey'); return; }
  el.textContent = '…';
  try { const r = await fetch(PROXY + '/health'); const d = await r.json(); el.textContent = d.key ? t('statusOk') : t('noKey'); }
  catch { el.textContent = t('statusBad'); }
}

/* ---------- share the app ---------- */
const APP_URL = 'https://khalm.github.io/Eli5/';
$('#shareAppBtn').onclick = async () => {
  if (navigator.share) { try { await navigator.share({ title: 'Eli5', text: t('shareText'), url: APP_URL }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(`${t('shareText')} ${APP_URL}`); toast(t('linkCopied'), 3000); } catch { prompt('', APP_URL); }
};

/* ---------- install ---------- */
let deferredPrompt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; if (!isStandalone()) $('#installBtn').hidden = false; });
addEventListener('appinstalled', () => { $('#installBtn').hidden = true; toast(t('installed')); });
$('#installBtn').onclick = async () => {
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('#installBtn').hidden = true; }
  else if (isIOS) $('#iosDlg').showModal();
  else toast(t('installHow'), 5000);
};

/* ---------- start ---------- */
applyTexts();
if (!isStandalone()) $('#installBtn').hidden = false;   // always offer it; shows instructions if the browser can't prompt
// Open a word straight from a link: …/Eli5/?q=rainbow
const q = new URLSearchParams(location.search).get('q');
if (q) { history.replaceState(null, '', location.pathname); explain(q); }
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.register('sw.js').then(reg => reg.update().catch(() => { })).catch(() => { });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded && !current) { reloaded = true; location.reload(); } });
}
pickModels().catch(() => { });
