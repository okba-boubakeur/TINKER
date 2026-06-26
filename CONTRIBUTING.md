# 🤝 Contributing to Tinker AI

First off, thank you for considering contributing to Tinker AI! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

All kinds of contributions are welcome: bug fixes, feature requests, documentation improvements, UI/UX updates, or feedback!

---

## 🛠️ Development Setup

Tinker AI is a desktop application built using **Tauri v2** (Rust backend) and **React 19** (Vite + CSS custom variables frontend).

### Prerequisites
Before you start hacking, make sure you have the following installed:
1. **Node.js** (v18 or higher)
2. **Rust & Cargo** (via [rustup.rs](https://rustup.rs/))
3. **C++ Build Tools** (Visual Studio workload)
4. **Chris Titus Tech WinUtil Catalog:** Set up a folder (by default at `D:\tinker-ai\winutil`) containing the configuration JSONs.

### Steps to Run Locally
1. **Fork** the repository on GitHub.
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/TINKER.git
   cd TINKER
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Run in Development Mode:**
   ```bash
   npm run tauri dev
   ```
   This command starts the Vite dev server and opens the Tauri native window with hot-reloading active.

---

## 📂 Project Roadmap & Contribution Areas

We are actively looking for help in the following areas:
* **🤖 Agent Improvements:** Refining the planning prompts, expanding the Powershell sandbox guardrails, or adding support for new AI providers.
* **🎙️ Voice & TTS:** Enhancing the 3D Orb visualizer shaders, optimizing local/edge speech processing, or implementing custom voice options.
* **⚙️ System Integrations:** Adding more default tweaks, improving process monitoring diagnostics, or polishing Winget silent install routines.
* **🎨 UI/UX Styling:** Premium responsive components, transitions, and dark mode theme updates.

---

## 📝 Pull Request Guidelines

1. **Create a branch:** Create a feature branch off of `main` for your changes:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. **Write clean code:** Follow consistent formatting. Keep React components modular and Rust commands robust and safe.
3. **Commit your changes:** Write clear, conventional commit messages:
   ```bash
   git commit -m "feat: add support for local Ollama models"
   ```
4. **Run tests & build:** Make sure the app builds without errors before opening a PR:
   ```bash
   npm run build
   npm run tauri build
   ```
5. **Submit the PR:** Push to your fork and open a Pull Request against the `main` branch of the original repository. Provide a clear description of your changes, screenshots if applicable, and reference any related issues.

## 💬 Communication & Questions

If you have questions or want to discuss design decisions, feel free to open a **GitHub Discussion** or file an issue labeled `question`.

Thank you for building the future of autonomous system administration with us! 🚀
