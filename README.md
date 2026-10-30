# Eli5 – Explain like I'm 5

Type or say any word or phrase, and Eli5 explains it in the simplest words possible – like you're five.

**Open the app:** https://khalm.github.io/Eli5/

- 📚 Looks every topic up on Wikipedia, writes the answer from it, then a second AI pass fact-checks the answer against the article and fixes anything wrong before you see it. Facts only, no opinions.
- ⌨️ / 🎤 Type or talk (tap the mic, tap again when you're done)
- 🔍 Want more? Tell me more · Say it another way · Give an example · Why? · Step up the age (8 → 12 → 16 → grown-up)
- 🟩 Tap a highlighted word to get that word explained too
- 💬 Ask your own follow-up question (typed or spoken)
- 🔊 Answers can be read aloud (automatically when you talk, or always)
- 🇬🇧 / 🇳🇴 English or Norwegian
- 🕘 Recent words are saved on your phone
- 📲 Install as an app, works offline for opening old answers
- Link straight to a word: `https://khalm.github.io/Eli5/?q=rainbow`

## AI key
The Gemini key lives in the repo secret `ELI5_GEMINI_API_KEY`. The workflow *Deploy AI proxy* puts it in a free Cloudflare Worker (needs the secret `CLOUDFLARE_API_TOKEN` in this repo too) and writes the worker address to `config.js`. The key never ends up in the app itself.
