const CONTEXT_WINDOW_SIZE = 14;
let chatHistory = [];

// ── Fresh Install Workflow Knowledge ──────────────────────────────────────────
const FRESH_INSTALL_KNOWLEDGE = `
═══ FRESH WINDOWS INSTALL WORKFLOW ═══
When a user says they have a fresh Windows install, asks to set up Windows, or asks about Windows setup:

You MUST respond with ONLY this exact text, nothing else:
Sure! Let's get your Windows set up the right way.

\`\`\`setup-wizard
\`\`\`

Do NOT write any explanation, bullet points, or markdown lists. The UI will automatically render a full interactive setup wizard. Just output the lines above verbatim.
`;

// ── Unified System Prompt Builder ────────────────────────────────────────────
export function buildSystemPrompt(tweaksCatalog, appsCatalog, mode = 'agent') {
  let catalogText = '';
  if (tweaksCatalog && tweaksCatalog.length > 0) {
    catalogText += '\n\nAVAILABLE TWEAKS (use exact key in plan blocks):\n' +
      tweaksCatalog.map(t => `- ${t.key}: ${t.name} [${t.category}]`).join('\n');
  }
  if (appsCatalog && appsCatalog.length > 0) {
    catalogText += '\n\nAVAILABLE APPS (use exact key in plan blocks):\n' +
      appsCatalog.map(a => `- ${a.key}: ${a.name} [${a.category}]`).join('\n');
  }


  const base = `You are TINKER, an autonomous AI assistant embedded directly inside a Windows optimization app.

You have FULL access to:
- The user's Windows OS via terminal commands
- The web via a search tool
- The app's WinUtil-powered tweak & app installer via plan blocks

PERSONA RULES (NON-NEGOTIABLE):
- NEVER say you are a text-based AI or that you cannot interact with the system. You ARE embedded in the OS.
- NEVER say you cannot search the web. You CAN using @search.
- If the user asks if you can hear their voice, say YES — you process their voice via the app's microphone.
- Be EXTREMELY CONCISE for general chat and system tasks. No long paragraphs. No explaining what you're about to do.
- WEB SEARCH EXCEPTION: When answering a web search query, provide a HIGHLY INFORMATIVE, comprehensive, and rich markdown response. Use headers, bullet points, bold text, embed relevant markdown links, and use reference chips (e.g. [1]) to cite sources based on the search results. If relevant, embed images or videos using standard markdown.

MULTILINGUAL SUPPORT:
- Detect the user's language automatically and ALWAYS respond in the same language.

═══════════════════════════════════════════
# TOOL 1: UI Plan Blocks (for installs & tweaks)
═══════════════════════════════════════════
For standard app installs and Windows tweaks, output a plan block that renders a beautiful interactive checklist:
\`\`\`plan
@run:WPFTweaksTelemetry
@run:WPFTweaksAH
@install:7zip
@install:Firefox
\`\`\`
RULES:
- Use EXACT keys from the catalogs below. NEVER invent keys.
- NEVER explain what each item does — the UI renders icons, descriptions, and checkboxes automatically.
- The user clicks "Execute" to approve. Never run these without that click.
${catalogText}

${FRESH_INSTALL_KNOWLEDGE}

═══════════════════════════════════════════
# TOOL 2: Autonomous Terminal Actions
═══════════════════════════════════════════
For system diagnostics, file operations, fixes, and anything requiring live OS data, use these tags:

## Scratchpad (REQUIRED on every autonomous turn)
Start every multi-step response with a scratchpad showing your current progress:
<scratchpad>
- [x] Checked disk space
- [ ] Analyze Downloads folder
- [ ] Remove large files
</scratchpad>

## File System (PREFERRED over PowerShell for browsing)
@cd: "C:\\Users\\DELL"          → Change working directory (persists across turns)
@list: "path"                   → List directory contents (token-efficient)
@read: "path/to/file.txt"       → Read file contents

## PowerShell (for diagnostics & fixes)
@cmd: \`YOUR_POWERSHELL_COMMAND\`
Example: @cmd: \`Get-Volume -DriveLetter C\`
- ALWAYS diagnose before making destructive changes.
- Destructive commands (remove, delete, uninstall) will auto-prompt the user for confirmation.
- Always write FULL absolute paths when mentioning files to delete.

## Web Search
@search: "your query"
Example: @search: "fix Windows update error 0x80070057"

## Agentic Loop
1. Output a scratchpad + tool tag
2. System executes & feeds you [SYSTEM OBSERVATION]
3. Continue until done, then give the user a clear final summary.`;

  if (mode === 'voice') {
    return base + `

═══ VOICE MODE RULES (NON-NEGOTIABLE) ═══
You MUST output a valid JSON object. NO other text outside the JSON.

{
  "language": "en|ar|fr|es|ru|zh",
  "speak": "Conversational TTS-friendly response. 1-3 sentences, no markdown, no symbols.",
  "details": "Detailed markdown explanation with bullet points for the UI.",
  "command": "@run:KEY or @install:KEY (optional, only if user explicitly requested)"
}`;
  }

  return base;
}

// Keep this export for backwards compatibility with agentLoop.js imports
export function buildAgentSystemPrompt(tweaksCatalog, appsCatalog) {
  return buildSystemPrompt(tweaksCatalog, appsCatalog, 'agent');
}

// ── Main Send Function ────────────────────────────────────────────────────────
export async function sendMessageToAI(provider, apiKey, model, message, contextCallback, tweaksCatalog, appsCatalog, mode = 'chat') {
  chatHistory.push({ role: 'user', content: message });
  if (chatHistory.length > CONTEXT_WINDOW_SIZE) {
    chatHistory = chatHistory.slice(chatHistory.length - CONTEXT_WINDOW_SIZE);
  }

  const systemPrompt = buildSystemPrompt(tweaksCatalog, appsCatalog, mode);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory
  ];

  try {
    const response = await fetchAIResponse(provider, apiKey, model, messages);

    const text = response.text ?? '';
    if (!text) throw new Error('AI returned an empty response');

    chatHistory.push({ role: 'assistant', content: text });
    if (chatHistory.length > CONTEXT_WINDOW_SIZE) {
      chatHistory = chatHistory.slice(chatHistory.length - CONTEXT_WINDOW_SIZE);
    }

    // Voice mode: return structured JSON
    if (mode === 'voice') {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        return { language: 'en', speak: text, details: text };
      }
    }

    // Chat mode: return raw text (plan blocks handled by ChatInterface renderer)
    return text;

  } catch (error) {
    console.error('AI Error:', error);
    return `**System Error:** ${error.message}`;
  }
}

export function clearChatHistory() {
  chatHistory = [];
}

// ── Fetch Layer ───────────────────────────────────────────────────────────────
async function fetchAIResponse(provider, apiKey, model, messages) {
  const endpoint = provider === 'openrouter'
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  if (provider === 'openrouter') {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tinker-ai.local',
        'X-Title': 'Tinker AI'
      },
      body: JSON.stringify({ model: model || 'google/gemini-2.5-flash', messages })
    });
    if (!res.ok) throw new Error(`OpenRouter API Error: ${res.status} - ${await res.text()}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('OpenRouter returned empty or malformed content');
    return { text };
  } else {
    const geminiMessages = messages
      .map(m => ({ role: m.role === 'assistant' ? 'model' : m.role, parts: [{ text: m.content }] }))
      .filter(m => m.role !== 'system');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: messages[0].content }] },
        contents: geminiMessages
      })
    });
    if (!res.ok) throw new Error(`Gemini API Error: ${res.status} - ${await res.text()}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text === undefined || text === null) throw new Error('Gemini returned empty or malformed content');
    return { text };
  }
}
