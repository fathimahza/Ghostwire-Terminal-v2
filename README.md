# 👻 GHOSTWIRE TERMINAL v2
**Investigasi Digital Sektor 7**

[![License](https://img.shields.io/github/license/fathimahza/ghostwire-terminal-v2?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

---

##  TENTANG GAME
**GhostWire Terminal** adalah game petualangan interaktif bertema cyberpunk di mana kamu berperan sebagai **Operator** yang menyelidiki anomali digital di Sektor 7. Dibantu oleh **Alex**, AI partner yang ditenagai oleh Groq LLM, kamu akan memecahkan teka-teki, mendekripsi file, dan menemukan koordinat tersembunyi.

Semua berjalan dalam antarmuka terminal futuristik yang imersif, lengkap dengan efek CRT, glitch dinamis, dan sistem presence real-time.

---

## ✨ FITUR UTAMA
- ️ **Terminal CLI + GUI Hybrid**: Navigasi via ketik (`ls`, `cd`, `cat`) atau klik panel
- 🤖 **AI Partner (Alex)**: Ngobrol bebas, minta hint kontekstual, Powered by Groq Llama-3
- 🌐 **Realtime Presence**: Lihat operator lain yang sedang aktif (Supabase)
- 🎨 **Cyber-Noir UI**: Efek scanline, vignette, glow neon, dan focus-mode panel
-  **Self-Hosted Proxy**: API key AI aman di server, tidak terekspos ke client
- 📦 **Zero-Cost Stack**: React, Vite, Tailwind, Express, Supabase Free Tier, Groq Free Tier

---

## 🚀 CARA JALANKAN (LOCAL DEVELOPMENT)

### Prerequisites
- Node.js `>= 18`
- npm / yarn
- Akun Supabase (untuk fitur presence)
- Akun Groq (untuk fitur AI Alex)

### Langkah-langkah
1. **Clone & Install**
   ```bash
   git clone https://github.com/fathimahza/ghostwire-terminal-v2.git
   cd ghostwire-terminal-v2
   npm install