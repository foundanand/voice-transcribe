# 🎙️ LazyTyper

**AI-powered voice transcription for macOS that actually sounds like you.**

LazyTyper is a lightweight, native macOS application that captures your voice and converts it to text using Google's Gemini AI. It sits in your menu bar and provides a quick-access "Notch" for instant recording and transcription.

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8D8?logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-Stable-000000?logo=rust&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white)

---

## ✨ Features

- **⚡ Quick Access Notch** — A centered, always-on-top "Notch" UI (Tray click) for instant transcription.
- **📝 Dual Transcription Modes**
  - **Verbatim** — Literal word-for-word capture including fillers (um, ah, like).
  - **Concise** — AI-refined version that removes stutters but **preserves your unique personality and tone**.
- **🔄 Instant Sync** — Real-time state synchronization between the mini-Notch and the main history window.
- **✍️ Multiline Editing** — Edit transcription results directly in the boxy Notch before copying.
- **🚀 Internal GPU Optimization** — Baked-in hardware acceleration for ultra-smooth performance.
- **📋 Copy-First Workflow** — The primary button automatically becomes a Copy button once transcription is ready.
- **🌍 Multi-Language Support** — Handles code-switching and multiple languages seamlessly.
- **💎 Premium macOS Design** — Sleek card-like UI with vibrancy, rounded corners, and smooth animations.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Tauri 2.0** | Native macOS window management & system tray |
| **Rust** | High-performance backend & window positioning |
| **React 19** | Modern UI framework with hooks |
| **Google Gemini AI** | Advanced audio transcription (gemini-3-flash) |
| **Lucide React** | Beautiful icon library |
| **Tailwind CSS** | Utility-first styling with custom glassmorphism |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Rust** (stable)
- **pnpm**
- **Google Gemini API Key** — [Get one here](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lazytyper.git
   cd lazytyper
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. **Run in Development**
   ```bash
   pnpm tauri dev
   ```

5. **Build for production**
   ```bash
   pnpm tauri build
   ```

---

## 🎯 How It Works

1. **Summon** — Click the tray icon in your macOS menu bar to reveal the **Notch**.
2. **Record** — Hit the Mic button. Speak naturally.
3. **Transcribe** — Audio is sent to Gemini which returns both Verbatim and Concise text.
4. **Edit & Copy** — Refine the text directly in the boxy Notch, toggle Concise mode if needed, and hit Copy.

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_KEY` | Your Google Gemini API key | ✅ Yes |

### Gemini Model
The app uses `gemini-3-flash-preview` for blazing-fast transcription. You can adjust the system prompt or model in [src/services/geminiService.ts](src/services/geminiService.ts).

---

<p align="center">
  Built with ❤️ for focused thinkers.
</p>
