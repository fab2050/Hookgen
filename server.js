// ═══════════════════════════════════════════════════════════════════════════
//  VIRAL2026 v3.0 — Backend Server (Node.js + Express + Groq)
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY; // Set this in Hostinger env vars
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─────── Groq API helper ───────
async function callGroq(systemPrompt, userPrompt, maxTokens = 2000) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set on server');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.85,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`Groq ${res.status}: ${errTxt.substring(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(text);
  } catch (_e) {
    // Aggressive JSON repair
    let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const ob = (clean.match(/\{/g) || []).length;
    const cb = (clean.match(/\}/g) || []).length;
    const osb = (clean.match(/\[/g) || []).length;
    const csb = (clean.match(/\]/g) || []).length;
    for (let i = 0; i < ob - cb; i++) clean += '}';
    for (let i = 0; i < osb - csb; i++) clean += ']';
    return JSON.parse(clean);
  }
}

// ─────── Core viral knowledge (always injected) ───────
const VIRAL_KNOWLEDGE = `You know the proven viral mechanics for short-form video (TikTok/Reels/Shorts):

RETENTION CURVE:
- Second 0-1: Pattern interrupt (movement, bold text, unexpected visual, close-up face)
- Second 1-3: Hook creates curiosity gap or emotional spike — swiping away must feel like a loss
- Second 3-6: The "aha" moment or emotional peak — this drives LIKES
- Second 6-9: Actionable depth/value — this drives SAVES
- Second 9-12: Strong opinion + CTA — this drives COMMENTS and SHARES

WHAT DRIVES EACH METRIC:
- Views = hook strength + thumbnail + trending audio
- Likes = emotional resonance (awe, surprise, anger, joy, craving)
- Saves = actionable tips viewers want to reference later
- Comments = strong opinions, direct questions, controversial takes
- Shares = relatability ("this is so me") + shock value

NICHE-SPECIFIC TACTICS:
- Dealerships/cars: transformation moments, price reveals, customer reaction POV shots, "first car" emotion
- Restaurants/food: extreme close-ups with steam/sizzle/cheese pulls, reaction shots after first bite
- Service businesses: before/after transformations, hidden tricks, insider secrets
- Local/community: use universal pain points, not hyper-local references
- Credit/finance: relief moments, approval reactions, handing-over-keys moments

WHAT DOES NOT WORK:
- Generic motivational statements ("success takes hard work")
- Vague promises ("change your life")
- Filler intros ("hey guys", "today we're gonna")
- Repeating the same structure for different businesses
- Using brand names or fake phone numbers in video visuals (video AI distorts them)`;

// ═══════════════════════════════════════════════════════════════════════════
//  ENDPOINT 1: ANALYZE (new first pass — understand the business)
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/analyze', async (req, res) => {
  try {
    const { topic, audience } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'Topic required' });

    const result = await callGroq(
      `You are a viral video strategist. ${VIRAL_KNOWLEDGE}

You deeply analyze a business/topic BEFORE writing any content. Return ONLY valid JSON.`,
      `Analyze this business for viral video creation:

TOPIC: ${topic}
${audience ? `AUDIENCE: ${audience}` : ''}

Provide a strategic analysis. Identify:
1. The CORE pain point this business solves (what keeps their customer up at night)
2. The #1 emotional hot button for this audience
3. The most-googled question in this niche
4. What makes this business different from competitors (or the angle to take)
5. The 3 hook patterns that work best for this specific niche
6. The signature visual that would stop scrolls for this niche

Return JSON:
{
  "pain_point": "the core pain in 15 words",
  "hot_button": "the emotional trigger in 15 words",
  "burning_question": "what they're googling at 2am",
  "angle": "the differentiator or viral angle",
  "best_hook_patterns": ["pattern 1 name", "pattern 2 name", "pattern 3 name"],
  "signature_visual": "the scroll-stopping visual in 20 words"
}`,
      800
    );
    res.json(result);
  } catch (e) {
    console.error('analyze error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ENDPOINT 2: HOOKS
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/hooks', async (req, res) => {
  try {
    const { topic, audience, profile, analysis } = req.body || {};
    if (!topic || !profile) return res.status(400).json({ error: 'Missing fields' });

    const result = await callGroq(
      `You are a viral copywriter writing in the voice of ${profile.name}: ${profile.style}.

${VIRAL_KNOWLEDGE}

Rule #1: Weak hook = low views. Return ONLY valid JSON object with "hooks" array.`,
      `Write 8 viral hooks for: "${topic}"
${audience ? `Audience: ${audience}` : ''}
${analysis ? `\nSTRATEGIC CONTEXT (use this):
- Core pain: ${analysis.pain_point}
- Hot button: ${analysis.hot_button}
- Burning question: ${analysis.burning_question}
- Angle: ${analysis.angle}
- Best patterns for this niche: ${(analysis.best_hook_patterns || []).join(', ')}` : ''}

Requirements:
- Each hook must use a DIFFERENT pattern (don't repeat structures)
- 5-15 words max
- Spoken as the first words in a 12s vertical video
- Must hit the pain point or hot button directly
- Specific to "${topic}" — zero generic filler
- Patterns to use: curiosity gap, hot take, POV, challenge, story opener, shocking stat, direct callout, before/after tease

Score each 80-100 on scroll-stopping power.

Return: {"hooks": [{"text":"...","score":95,"pattern":"curiosity gap"}, ...]}`,
      1500
    );
    res.json(result);
  } catch (e) {
    console.error('hooks error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ENDPOINT 3: DEPTH
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/depth', async (req, res) => {
  try {
    const { topic, audience, hook, analysis } = req.body || {};
    if (!topic || !hook) return res.status(400).json({ error: 'Missing fields' });

    const result = await callGroq(
      `You are a viral content strategist. ${VIRAL_KNOWLEDGE}

Rule #2: Low saves = not enough depth. Viewers must think "I need to save this."

Return ONLY valid JSON object with "items" array of 5 strings.`,
      `Topic: "${topic}"
Hook: "${hook}"
${audience ? `Audience: ${audience}` : ''}
${analysis ? `Pain point: ${analysis.pain_point}\nBurning question: ${analysis.burning_question}` : ''}

Write 5 depth points that make this video save-worthy. Each must be:
- A SPECIFIC insider tip (not "do your research" filler)
- Something they cannot easily Google
- Actionable, numbered steps or lesser-known tactics
- 10-20 words
- Written so viewers screenshot to remember it
- Specific to "${topic}"

Return: {"items": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]}`,
      1200
    );
    res.json(result);
  } catch (e) {
    console.error('depth error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ENDPOINT 4: EMOTIONS
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/emotions', async (req, res) => {
  try {
    const { topic, audience, hook, analysis } = req.body || {};
    if (!topic || !hook) return res.status(400).json({ error: 'Missing fields' });

    const result = await callGroq(
      `You are a viral emotion strategist. ${VIRAL_KNOWLEDGE}

Rule #3: Low likes = no emotion. Viewer must FEEL something so strong they double-tap instinctively.

Return ONLY valid JSON object with "emotions" array.`,
      `Topic: "${topic}"
Hook: "${hook}"
${audience ? `Audience: ${audience}` : ''}
${analysis ? `Hot button: ${analysis.hot_button}` : ''}

Generate 3 DIFFERENT emotional angles. For each:
- emoji: single emoji capturing the emotion
- title: 2-4 word emotion name
- desc: HOW to execute this in the video, specific to "${topic}" (15-25 words)
- voiceover: EXACT spoken sentence that delivers this emotion (10-20 words, natural speech)
- visual_cue: what the viewer sees during this moment (10-15 words, no brand names)

Choose from: awe, anger, FOMO, surprise, joy, empowerment, vulnerability, nostalgia, shock, craving, relief.

Return: {"emotions": [{"emoji":"...","title":"...","desc":"...","voiceover":"...","visual_cue":"..."}, ...]}`,
      1500
    );
    res.json(result);
  } catch (e) {
    console.error('emotions error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ENDPOINT 5: OPINIONS
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/opinions', async (req, res) => {
  try {
    const { topic, audience, hook, analysis } = req.body || {};
    if (!topic || !hook) return res.status(400).json({ error: 'Missing fields' });

    const result = await callGroq(
      `You are a viral opinion strategist. ${VIRAL_KNOWLEDGE}

Rule #4: Low comments = no strong opinion. Must be bold enough that 50% agree loudly, 50% argue.

Return ONLY valid JSON object with "opinions" array of 5 strings.`,
      `Topic: "${topic}"
Hook: "${hook}"
${audience ? `Audience: ${audience}` : ''}
${analysis ? `Angle: ${analysis.angle}` : ''}

Generate 5 polarizing opinions. Each must:
- Be 8-18 words
- Be a SPOKEN sentence (not a headline)
- Specific to "${topic}"
- Make people tag friends, type "FACTS", or argue
- Include at least 1 ending in a question to bait comments

Return: {"opinions": ["opinion 1", "opinion 2", "opinion 3", "opinion 4", "opinion 5"]}`,
      1000
    );
    res.json(result);
  } catch (e) {
    console.error('opinions error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ENDPOINT 6: SCRIPT (production-ready with super-clear instructions)
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/script', async (req, res) => {
  try {
    const { topic, audience, hook, depthItems, emotion, opinion, analysis } = req.body || {};
    if (!hook || !emotion || !opinion || !depthItems) return res.status(400).json({ error: 'Missing fields' });

    const result = await callGroq(
      `You are a professional short-form video director. ${VIRAL_KNOWLEDGE}

Rule #5: Relatability. Rule #6: Quality.

You write production scripts with ZERO guesswork. Every second is accounted for with:
- EXACT voiceover text (what to say)
- EXACT camera angle and shot type
- EXACT visual action and what viewer sees
- EXACT on-screen text (2-4 words max, universal phrases only — no brand names, no phone numbers)
- EXACT transition to next scene
- EXACT facial expression or body language cue for creator

Return ONLY valid JSON.`,
      `Write a complete 12-second production script:

TOPIC: ${topic}
HOOK: ${hook}
DEPTH TOPICS: ${depthItems.slice(0, 3).join('; ')}
EMOTION: ${emotion.title} — voiceover line: "${emotion.voiceover}" — visual: ${emotion.visual_cue || 'reaction shot'}
OPINION: "${opinion}"
${analysis ? `Pain point: ${analysis.pain_point}` : ''}

Break into 4 segments (0-3s, 3-6s, 6-9s, 9-12s). Each segment needs:
- time: timestamp
- voiceover: EXACT words to speak (must be spoken naturally, count syllables to fit)
- camera: shot type (close-up, medium, wide, POV, over-shoulder, handheld, static)
- action: what the creator/subject DOES physically (facial expression, hand movement, walking, etc)
- visual: what the VIEWER sees (no brand names, no logos, no phone numbers, no addresses — use universal phrases)
- text_overlay: 2-4 word on-screen text (universal only: "GET APPROVED", "LOW DOWN", "BAD CREDIT OK", "DRIVE TODAY", "NO CREDIT NEEDED" — NEVER business names, NEVER phone numbers)
- transition: how to cut to next scene (hard cut, zoom, whip pan, match cut, jump cut)
- expression: creator facial expression (confident smile, shocked, relieved, serious, excited)

Also include:
- music: genre + energy + tempo (e.g., "upbeat hip-hop 120bpm, punchy bass")
- cta: the final call to action (what to say + show)

Return: {"segments":[{"time":"0-3s","voiceover":"...","camera":"...","action":"...","visual":"...","text_overlay":"...","transition":"...","expression":"..."}],"music":"...","cta":"...","total_duration":"12 seconds","filming_tips":["tip 1","tip 2","tip 3","tip 4"]}`,
      3000
    );
    res.json(result);
  } catch (e) {
    console.error('script error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ENDPOINT 7: VALIDATE + VIDEO AI PROMPT
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/validate', async (req, res) => {
  try {
    const { topic, audience, hook, depthItems, emotion, opinion, script } = req.body || {};
    if (!script) return res.status(400).json({ error: 'Missing fields' });

    const segs = script.segments || [];
    const scriptSummary = segs.map(s =>
      `[${s.time}] Say: "${s.voiceover}" | Camera: ${s.camera} | Action: ${s.action} | Visual: ${s.visual} | Text: ${s.text_overlay} | Transition: ${s.transition}`
    ).join('\n');

    const result = await callGroq(
      `You are a viral video quality analyst and expert video AI prompt engineer. ${VIRAL_KNOWLEDGE}

Your job:
1. Score each of Brian Mark's 6 rules (1-10) with specific praise or criticism
2. Give overall verdict: AMAZING (85+), GREAT (70-84), GOOD (55-69), or NEEDS WORK (<55)
3. Identify weaknesses with SPECIFIC replacements
4. Write a BULLETPROOF video AI generation prompt that:
   - Uses ONLY universal phrases (NEVER brand names, NEVER phone numbers, NEVER logos, NEVER addresses)
   - Specifies clear simple on-screen text: "GET APPROVED", "LOW DOWN", "BAD CREDIT OK", "DRIVE TODAY", "NO CREDIT"
   - Describes shot-by-shot with precise timing
   - Specifies camera movements, pacing, and transitions
   - Addresses video AI's weakness with text rendering (keep text minimal, max 3 words per scene)
   - Works for Grok, Sora, Runway, Kling, Veo

Return ONLY valid JSON.`,
      `Analyze this full viral video package:

TOPIC: ${topic}
AUDIENCE: ${audience || 'general'}
HOOK: "${hook}"
DEPTH: ${(depthItems || []).join('; ')}
EMOTION: ${emotion?.title} — "${emotion?.voiceover}"
OPINION: "${opinion}"
SCRIPT:
${scriptSummary}
MUSIC: ${script.music || 'not specified'}
CTA: ${script.cta || 'not specified'}

Return JSON:
{
  "scores": {
    "hook": {"score": 9, "note": "specific praise or criticism"},
    "depth": {"score": 8, "note": "..."},
    "emotion": {"score": 7, "note": "..."},
    "opinion": {"score": 8, "note": "..."},
    "relatability": {"score": 7, "note": "..."},
    "quality": {"score": 8, "note": "..."}
  },
  "overall_score": 82,
  "verdict": "GREAT",
  "predicted_reach": "500K-2M views",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": [
    {"issue": "what is wrong (be specific about which element)", "fix": "exact replacement text or action", "category": "hook|opinion|emotion|depth|script"}
  ],
  "video_prompt": "CRITICAL: Write a BULLETPROOF video generation prompt. Format: Vertical 9:16 aspect ratio, 12 seconds total duration, 24fps. BREAK INTO 4 SCENES with exact timestamps. For each scene specify: EXACT camera angle, EXACT visual composition, EXACT 2-3 word text overlay (ONLY universal car dealership phrases like GET APPROVED / LOW DOWN / BAD CREDIT OK / DRIVE TODAY / NO CREDIT / FAST APPROVAL / YES YOU CAN — ABSOLUTELY NO business names, phone numbers, addresses, logos, branded clothing, or specific dealership signs), transition type, color grade (warm golden hour / cool modern / high contrast), music sync point. INCLUDE EXPLICIT NEGATIVE PROMPTS: no distorted text, no fake business names, no phone numbers, no logos, no branded shirts, no addresses, no gibberish signs. Subject wears plain solid color t-shirt. End with clear single-phrase CTA text. Make it 250-400 words total."
}`,
      3500
    );
    res.json(result);
  } catch (e) {
    console.error('validate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─────── Health check ───────
app.get('/api/health', (req, res) => {
  res.json({
    status: GROQ_API_KEY ? 'ok' : 'missing_api_key',
    model: GROQ_MODEL
  });
});

// ─────── Serve SPA ───────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`VIRAL2026 server running on port ${PORT}`);
  console.log(`Model: ${GROQ_MODEL}`);
  console.log(`API key configured: ${!!GROQ_API_KEY}`);
});
