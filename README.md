# 🎙️ VoxScribe

**AI-powered voice transcription that preserves your personality.**

VoxScribe is a modern web application that captures your voice and converts it to text using Google's Gemini AI. Unlike traditional transcription tools, VoxScribe provides both a word-for-word transcription and an intelligent, concise version that preserves your unique speaking style and tone.

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white)

---

## ✨ Features

- **🎤 One-Click Recording** — Start recording with a single click using your browser's microphone
- **📝 Dual Transcription Modes**
  - **Word-for-Word** — Exact verbatim transcription including filler words (um, ah, like)
  - **Concise Mode** — AI-refined version that removes stutters while preserving your personality and tone
- **🌍 Multi-Language Support** — Handles code-switching and multiple languages seamlessly
- **🎨 Real-Time Audio Visualizer** — Beautiful waveform visualization while recording
- **📋 Copy to Clipboard** — Quickly copy transcriptions with one click
- **🌙 Modern Dark UI** — Sleek, responsive interface built with Tailwind CSS

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework with hooks |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast build tool |
| **Google Gemini AI** | Advanced audio transcription |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Beautiful icon library |
| **Web Audio API** | Real-time audio visualization |
| **MediaRecorder API** | Browser-based audio capture |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **pnpm**, **npm**, or **yarn**
- **Google Gemini API Key** — [Get one here](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/voice-transcribe.git
   cd voice-transcribe
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the project root:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173` and allow microphone access when prompted.

---

## 📁 Project Structure

```
voice-transcribe/
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
│
└── src/
    ├── main.tsx               # React entry point
    ├── App.tsx                # Main application component
    ├── index.css              # Global styles
    │
    ├── types/
    │   └── index.ts           # TypeScript type definitions
    │
    ├── components/
    │   ├── AudioVisualizer.tsx    # Real-time audio waveform display
    │   └── TranscriptCard.tsx     # Transcription result card component
    │
    └── services/
        └── geminiService.ts   # Gemini AI integration
```

---

## 🎯 How It Works

1. **Record** — Click the "Record Message" button and speak into your microphone
2. **Process** — Audio is captured as WebM, converted to base64, and sent to Gemini AI
3. **Transcribe** — Gemini returns both verbatim and refined transcriptions
4. **View** — Toggle between word-for-word and concise modes on each transcript card

### AI Transcription Logic

The Gemini model is instructed to:
- Capture everything verbatim, including filler words and pauses
- Support code-switching between multiple languages
- Create a concise version that:
  - Removes stutters and redundant fillers
  - Preserves the speaker's original tone and personality
  - Maintains emotional energy and speaking style

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_KEY` | Your Google Gemini API key | ✅ Yes |

### Gemini Model

The app uses `gemini-3-flash-preview` for fast, high-quality transcription. You can modify this in [src/services/geminiService.ts](src/services/geminiService.ts).

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for powerful AI capabilities
- [Lucide](https://lucide.dev/) for beautiful icons
- [Vite](https://vitejs.dev/) for blazing-fast development experience

---

<p align="center">
  Built with ❤️ and 🎙️
</p>
