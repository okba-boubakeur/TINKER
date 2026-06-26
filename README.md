# ⚡ Tinker AI

<p align="center">
  <img src="https://raw.githubusercontent.com/okba-boubakeur/TINKER/main/icon.svg" alt="Tinker AI Logo" width="120px" height="120px" />
</p>

<h3 align="center">Tinker AI</h3>
<p align="center">
  <strong>A premium, agentic desktop assistant for Windows — automate system tuning, software management, and diagnostics using natural language.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Tauri-v2-FFC107?style=for-the-badge&logo=tauri&logoColor=black" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/Rust-2021-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/Three.js-R3F-black?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Vercel_AI_SDK-black?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel AI SDK" />
</p>

---

Tinker AI blends real-time system monitoring, Chris Titus Tech's **WinUtil** automation catalog, and Vercel's **AI SDK** into a cohesive, high-performance desktop control center. Speak or type commands in natural language, and let the autonomous agent handle everything from installing apps to applying system tweaks — safely, securely, and silently.

---

## 📥 Download & Install

> **Windows 64-bit only.** Requires no prior technical knowledge to use.

| Package | Description |
|---|---|
| 🟢 **[Download Setup Installer (.exe)](https://github.com/okba-boubakeur/TINKER/releases/latest)** | Recommended — runs a standard Windows setup wizard |
| 🔵 **[Download MSI Installer (.msi)](https://github.com/okba-boubakeur/TINKER/releases/latest)** | Alternative for enterprise or custom deployments |

---

## 🚀 First Launch Setup Guide

After installing and launching Tinker AI for the first time, follow these steps to configure the app:

### Step 1 — 🤖 Set Up Your AI Provider

Click the **⚙️ Settings** icon (top-right of the chatpanel) and go to the **AI Provider** section.

You need at least **one** of the following:

#### Option A: Google Gemini (Recommended — Free Tier Available)
1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)** → Sign in with your Google account.
2. Click **"Create API Key"** → Copy the key.
3. Paste it into the **Google Gemini Key** field in Tinker AI Settings.
4. Select your preferred model — **`gemini-2.5-flash`** is recommended for speed and quality.

#### Option B: OpenRouter (Access Claude, GPT-4, Mixtral & more)
1. Go to **[OpenRouter.ai](https://openrouter.ai/keys)** → Create a free account.
2. Click **"Create Key"** → Copy the key.
3. Paste it into the **OpenRouter Key** field in Settings.
4. Choose any model from the dropdown (e.g., `anthropic/claude-3.5-sonnet`).

---

### Step 2 — 🔍 Enable Web Search (Optional but Recommended)

Web search lets the AI look up real-time solutions to system issues. Choose one:

#### Option A: Tavily API (Built for AI Agents — 1,000 free searches/month)
1. Go to **[Tavily.com](https://app.tavily.com/)** → Sign up for free.
2. Copy your **API Key** from the dashboard.
3. Paste it into the **Tavily Key** field in Settings.

#### Option B: Brave Search API (2,000 free queries/month)
1. Go to **[Brave Search API](https://api.search.brave.com/)** → Sign up for free.
2. Copy your **Subscription Key**.
3. Paste it into the **Brave Search Key** field in Settings.

---

### Step 3 — 🎙️ Choose Your Voice (Text-to-Speech)

Tinker AI uses **Microsoft Edge Neural Voices** for high-quality, natural-sounding speech. To pick your preferred voice:

1. In **Settings**, go to the **Voice / TTS** section.
2. Browse available voices organized by **language and accent**, for example:
   - 🇺🇸 `en-US-JennyNeural` — friendly American English female voice
   - 🇬🇧 `en-GB-RyanNeural` — natural British English male voice
   - 🇫🇷 `fr-FR-DeniseNeural` — French female voice
   - 🇩🇪 `de-DE-ConradNeural` — German male voice
3. Click **"Test Voice"** to hear a preview.
4. Select your preferred voice and save Settings.

> Voices are streamed in real-time using Microsoft's Edge TTS service — **no API key required for TTS**.

---

### Step 4 — ⚙️ Configure WinUtil Catalog Path

Tinker AI reads Chris Titus Tech's WinUtil JSON catalog (tweaks & applications) from a local folder.

1. Download or clone the WinUtil repository locally — the `winutil/` folder is already bundled inside this repository.
2. In **Settings**, set the **WinUtil Path** to point to the `winutil` folder (default: same directory as the app).
3. The app will automatically load the available tweaks and software categories.

---

## 💡 How It Works

Just ask Tinker AI anything — it will autonomously figure out the best solution:

1. ⚙️ **Use WinUtil Tools** — Apply Chris Titus Tech's optimized registry tweaks and scripts.
2. 📚 **Use Its Knowledge Base** — Draw on built-in system administration expertise.
3. 🌐 **Search the Web** — Find real-time solutions to specific system errors.
4. 🛡️ **Ask Your Permission** — Always shows you the planned commands before executing.
5. 🛠️ **Solve Almost Any Issue** — From silent app installs to complex system fixes.

---

## 📸 Screenshots

<p align="center">
  <strong>Overview</strong><br/>
  <img src="https://raw.githubusercontent.com/okba-boubakeur/TINKER/main/public/screenshots/Overview.jpg" alt="Overview" width="90%" />
</p>

<hr/>

<p align="center">
  <strong>Steps &amp; Progression</strong><br/>
  <img src="https://raw.githubusercontent.com/okba-boubakeur/TINKER/main/public/screenshots/Steps%20%26%20progression.jpg" alt="Steps and Progression" width="90%" />
</p>

<hr/>

<p align="center">
  <strong>Tweaks Panel</strong><br/>
  <img src="https://raw.githubusercontent.com/okba-boubakeur/TINKER/main/public/screenshots/Tweaks.JPG" alt="Tweaks Panel" width="90%" />
</p>

<hr/>

<p align="center">
  <strong>Software &amp; Apps Panel</strong><br/>
  <img src="https://raw.githubusercontent.com/okba-boubakeur/TINKER/main/public/screenshots/Apps.JPG" alt="Software and Apps Panel" width="90%" />
</p>

<hr/>

<p align="center">
  <strong>Settings &amp; API Configuration</strong><br/>
  <img src="https://raw.githubusercontent.com/okba-boubakeur/TINKER/main/public/screenshots/Settings.JPG" alt="Settings and API Configuration" width="90%" />
</p>

<hr/>

<p align="center">
  <strong>Execution Log Terminal</strong><br/>
  <img src="https://raw.githubusercontent.com/okba-boubakeur/TINKER/main/public/screenshots/Execution%20log.JPG" alt="Execution Log Terminal" width="90%" />
</p>

---

## ✨ Key Features

### 1. 🤖 Autonomous AI Agent Loop
* **Natural Language Control:** Converse naturally to request system tweaks, troubleshoot issues, or install applications.
* **Smart Planning & Confirmation:** The agent constructs multi-step plans. Sensitive commands require your explicit approval before executing.
* **Multi-Provider LLM Support:** Connect to **Google Gemini** or **OpenRouter** — supporting Gemini, Claude, GPT-4, Mistral, and more.

### 2. 🎙️ 3D Voice Assistant & Orb
* **Interactive 3D Orb:** A responsive 3D visualizer powered by React Three Fiber and custom shaders reacting in real-time to agent states (Idle, Listening, Processing, Speaking).
* **Multilingual Speech Recognition:** Web Speech API with multi-language support for seamless voice commands.
* **Neural Text-to-Speech:** Microsoft Edge TTS with 300+ high-quality neural voices across 40+ languages — no extra API key required.

### 3. ⚙️ WinUtil Automation Catalog
* **System Tweaks:** Registry modifications, service configurations, and performance optimizations from the Chris Titus Tech catalog.
* **Software Management:** Install and uninstall Windows apps silently using the **Windows Package Manager (Winget)**.
* **Manual Control Panel:** Browse and run tweaks or app installations directly from the UI — no AI required.

### 4. 📊 Real-Time System Monitoring
* **Performance Overview:** Live CPU, RAM, and disk usage dashboards.
* **Process Monitor:** Top resource-consuming processes updated dynamically.

### 5. 🔍 Secure Web & Shell Tools
* **AI-Powered Troubleshooting:** Queries **Tavily** or **Brave Search** for real-time system solutions.
* **Sandboxed PowerShell Execution:** Built-in safety blocklist prevents destructive commands from executing.
* **Execution Log Terminal:** A resizable output console showing real-time logs, results, and errors.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, CSS Custom Variables |
| 3D Visuals | Three.js, React Three Fiber, `@react-three/drei` |
| Desktop Runtime | Tauri v2 (Rust) |
| AI / LLM | Vercel AI SDK, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic` |
| System Metrics | Rust `sysinfo` crate |
| Voice / TTS | Microsoft Edge TTS (`msedge-tts` Rust crate) |
| Web Search | Tavily API, Brave Search API |

---

## 🧑‍💻 Build From Source

### Prerequisites
1. **Node.js** v18+
2. **Rust & Cargo** (via [rustup.rs](https://rustup.rs/))
3. **C++ Build Tools** (Visual Studio — "Desktop development with C++" workload)

### Installation
```bash
git clone https://github.com/okba-boubakeur/TINKER.git
cd TINKER
npm install
```

### Development
```bash
npm run tauri dev
```

### Production Build
```bash
npm run tauri build
# Outputs to: src-tauri/target/release/bundle/
```

---

## 📁 Project Structure

```
├── src/                      # React Frontend
│   ├── components/           # UI Components (Orb, Chat, Panel, Cards, Modals)
│   ├── lib/                  # Agent Loop, AI Handlers, Task Queues, TTS
│   ├── App.jsx               # Main Application Shell
│   └── index.css             # Design System & Theme Tokens
├── src-tauri/                # Rust Backend (Tauri)
│   ├── src/
│   │   ├── lib.rs            # Rust Commands (sysinfo, shell executor, WinUtil parsers)
│   │   ├── tts.rs            # Edge TTS Bindings
│   │   └── main.rs           # App Entrypoint
│   └── tauri.conf.json       # Tauri Configuration
├── winutil/                  # WinUtil Catalog (Tweaks + Applications JSON)
├── public/screenshots/       # App Screenshots
└── package.json              # Dependencies & Build Scripts
```

---

## 🛡️ Security & Guardrails

* **Explicit Approval Required:** The AI agent **cannot execute any shell command** without showing you a confirmation dialog first.
* **Command Blocklist:** The Rust backend intercepts and blocks destructive operations — format volume, disk wipe, root deletions, etc.

---

## 🤝 Contributing

Contributions are what make open-source such an amazing place to learn and grow. **All contributions are welcome!**

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development setup guide and PR guidelines.

---

## 🙏 Special Thanks & Credits

A massive thank you to **Chris Titus (@christitustech)** and his incredible open-source project **[WinUtil](https://github.com/christitustech/winutil)**. 
Tinker AI relies on the extensive research, tweaks, and software catalogs curated by Chris and the WinUtil community. By acting as an AI interface over the WinUtil catalog, Tinker AI aims to bring the power of his Windows automation tools to even more users through natural language.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
