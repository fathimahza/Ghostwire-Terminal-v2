import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react'
import { supabase, setupPresence } from './supabase'
import { FILES, COMMANDS, MISSIONS, PUZZLES, TOOLS, EVENTS, CHARACTER_RESPONSES, EASTER_EGGS } from './gameData'

// ==================== TYPES ====================
type Message = { id: number; text: string; sender: 'system' | 'user' | 'alex' }
type User = { id: string; name: string }
type OnlineUser = { username: string }
type FileData = { type: string; content?: string; locked?: boolean }
type FolderData = { type: string; content: Record<string, FileData> }
type FilesStructure = Record<string, FolderData>
type Page = 'login' | 'intro' | 'tutorial' | 'game'
type AlexMood = 'neutral' | 'thinking' | 'happy' | 'warning' | 'error'

// ==================== CONSTANTS ====================

// 🎬 INTRO STORY - Cinematic setelah login
const INTRO_STORY = [
  { step: 0, text: "👻 *suara statis* ...Operator... apakah kamu mendengar saya?", emoji: "👻📡", delay: 0 },
  { step: 1, text: "Saya Alex... entitas digital yang terjebak di Sektor 7 sejak insiden 2042.", emoji: "👻🕰️", delay: 2500 },
  { step: 2, text: "Sebuah anomali digital sedang menggerogoti sistem... data hilang, sinyal terputus, waktu berputar.", emoji: "👻⚡", delay: 5000 },
  { step: 3, text: "Saya butuh bantuanmu, Operator. Temukan sumber anomali sebelum Sektor 7 hilang selamanya.", emoji: "👻🙏", delay: 8000 },
  { step: 4, text: "Jangan khawatir... saya akan menemanimu. Mari mulai investigasi.", emoji: "👻💙✨", delay: 11000 },
]

// 🧭 TUTORIAL RAMAH PEMULA - 8 step dengan visual cue
const TUTORIAL_STEPS = [
  { 
    step: 1, 
    title: "👋 Selamat Datang, Operator!", 
    text: "Anda sekarang terhubung ke Sistem Sektor 7. Jangan khawatir, kami akan pandu langkah demi langkah.",
    visual: "🎮 Panel kiri: File | Panel tengah: Terminal | Panel kanan: Alex (teman hantu Anda)"
  },
  { 
    step: 2, 
    title: "📁 Cara Melihat File", 
    text: "Klik folder di panel KIRI untuk membuka isinya. Atau ketik 'ls' di terminal lalu tekan Enter.",
    visual: "👉 Klik 'case_files' → Klik 'case_001_report.txt' untuk membaca"
  },
  { 
    step: 3, 
    title: "🔍 Cara Membaca File", 
    text: "Setelah klik file, isi file akan muncul di panel TENGAH. Baca baik-baik, petunjuk sering tersembunyi!",
    visual: "📄 File terbuka → Scroll untuk baca semua → Catat informasi penting"
  },
  { 
    step: 4, 
    title: "🔐 Menemukan Password", 
    text: "Password tersembunyi di folder 'personal' → file 'notes.txt'. Cari kata yang terlihat seperti kode.",
    visual: "📁 personal → 📄 notes.txt → 🔑 Password: 'GHOST2026' (contoh)"
  },
  { 
    step: 5, 
    title: "🔓 Membuka File Terenkripsi", 
    text: "Setelah dapat password, buka file 'encrypted_data.bin'. Sistem akan otomatis mendekripsi.",
    visual: "🔐 File terkunci → Masukkan password → ✨ File terbuka!"
  },
  { 
    step: 6, 
    title: "🎯 Menyelesaikan Misi", 
    text: "Temukan koordinat di file yang sudah terbuka. Ketik 'jawab [koordinat]' di terminal, contoh: jawab 47.6062 N 122.3321 W",
    visual: "📍 Koordinat: 47.6062 N 122.3321 W → Ketik: jawab 47.6062 N 122.3321 W → ✅ Selesai!"
  },
  { 
    step: 7, 
    title: "💬 Ngobrol dengan Alex", 
    text: "Ketik apa saja di terminal untuk chat dengan Alex. Alex bisa kasih hint, cerita, atau sekadar teman ngobrol.",
    visual: "💬 Ketik: 'halo alex' → 👻 Alex: 'Hey Operator~ 💙'"
  },
  { 
    step: 8, 
    title: "🆘 Butuh Bantuan?", 
    text: "Ketik 'help' untuk lihat semua perintah. Atau klik tombol '💡 Hint' di panel Alex untuk petunjuk.",
    visual: "❓ Bingung? → Ketik 'help' atau klik '💡 Hint'"
  }
]

// 🏆 ACHIEVEMENTS
const ACHIEVEMENTS = [
  { id: 'first_login', title: "Operator Baru", desc: "Login pertama kali", icon: "🎖️" },
  { id: 'file_reader', title: "Pembaca Setia", desc: "Baca 3 file", icon: "📚" },
  { id: 'password_found', title: "Code Breaker", desc: "Temukan password", icon: "🔐" },
  { id: 'mission_complete', title: "Investigator Elite", desc: "Selesaikan misi Sektor 7", icon: "🏆" },
]

// ==================== MAIN COMPONENT ====================
export default function App() {
  // --- Page & Intro State ---
  const [currentPage, setCurrentPage] = useState<Page>('login')
  const [showIntro, setShowIntro] = useState(false)
  const [introStep, setIntroStep] = useState(0)
  
  // --- Login & Tutorial State ---
  const [inputName, setInputName] = useState('')
  const [tutorialStep, setTutorialStep] = useState(1)
  
  // --- Game State ---
  const [user, setUser] = useState<User | null>(null)
  const [cmd, setCmd] = useState('')
  const [logs, setLogs] = useState<Message[]>([])
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [step, setStep] = useState(1)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [fileContent, setFileContent] = useState<string>('')
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [focusedPanel, setFocusedPanel] = useState<'left' | 'center' | 'right' | null>(null)
  const [alexMood, setAlexMood] = useState<AlexMood>('neutral')
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [showNewPlayerTips, setShowNewPlayerTips] = useState(true)
  const [particles, setParticles] = useState<Array<{x: number, y: number, speed: number, char: string}>>([])
  
  // 🎮 Mission & Campaign System
  const [currentMission, setCurrentMission] = useState(1)
  const [missionProgress, setMissionProgress] = useState<{[key: number]: boolean}>({})
  const [trust, setTrust] = useState(50)
  const [wrongPasswordAttempts, setWrongPasswordAttempts] = useState(0)
  const [lockedUntilTime, setLockedUntilTime] = useState<number | null>(null)
  const [unlockedTools, setUnlockedTools] = useState<string[]>([])
  
  // 🧩 Puzzle System
  const [showPuzzleGame, setShowPuzzleGame] = useState(false)
  const [currentPuzzle, setCurrentPuzzle] = useState<string | null>(null)
  const [puzzleAnswer, setPuzzleAnswer] = useState('')
  
  // 🎲 Events & Timing
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [eventQueue, setEventQueue] = useState<string[]>([])
  const [currentEvent, setCurrentEvent] = useState<string | null>(null)
  
  // 🎭 Narrative & Choices
  const [playerChoices, setPlayerChoices] = useState<string[]>([])
  const [showEnding, setShowEnding] = useState(false)
  const [endingType, setEndingType] = useState<'isolate' | 'merge' | 'negotiate' | null>(null)
  
  // 🎁 Easter Eggs
  const [unlockedEasterEggs, setUnlockedEasterEggs] = useState<string[]>([])
  
  const logsEndRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)

  // ==================== EFFECTS ====================
  
  // Auto-scroll terminal
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])

  // Supabase presence (hanya di halaman game)
  useEffect(() => {
    if (currentPage !== 'game' || !user?.id || !supabase) return
    
    const savedId = localStorage.getItem('ghostwire_id')
    const savedName = localStorage.getItem('ghostwire_name')
    if (savedId && savedName && !user) {
      handleLogin(savedId, savedName)
    }
    
    const channel = supabase.channel('room1')
      .on('presence', { event: 'sync' }, () => {
        const state = (supabase.channel('room1') as any).presenceState()
        const list = Object.values(state).flat() as { username: string }[]
        setOnlineUsers(list.map(u => ({ username: u.username })))
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED' && user?.id) await channel.track({ username: user.name })
      })
    return () => { supabase.removeChannel(channel) }
  }, [currentPage, user?.id])

  // Particle background (login page only)
  useEffect(() => {
    if (currentPage === 'login') initParticles()
    return () => { if (canvasRef.current) canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height) }
  }, [currentPage])

  // Confetti effect for achievements
  useEffect(() => {
    if (!showConfetti || !confettiRef.current) return
    const canvas = confettiRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const confetti: Array<{x: number, y: number, color: string, speed: number, rotation: number}> = []
    const colors = ['#00f5d4', '#9d4edd', '#00ff9d', '#ff4d6a', '#ffd166']
    for (let i = 0; i < 150; i++) confetti.push({ x: Math.random() * canvas.width, y: -20 - Math.random() * 100, color: colors[Math.floor(Math.random() * colors.length)], speed: 2 + Math.random() * 3, rotation: Math.random() * 360 })
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      confetti.forEach(c => {
        ctx.save()
        ctx.translate(c.x, c.y)
        ctx.rotate((c.rotation * Math.PI) / 180)
        ctx.fillStyle = c.color
        ctx.fillRect(-3, -8, 6, 16)
        ctx.restore()
        c.y += c.speed; c.rotation += 2
        if (c.y > canvas.height) c.y = -20
      })
      animationId = requestAnimationFrame(animate)
    }
    animate()
    const timer = setTimeout(() => { cancelAnimationFrame(animationId); setShowConfetti(false) }, 4000)
    return () => clearTimeout(timer)
  }, [showConfetti])

  // Auto-dismiss achievements after 5 seconds
  useEffect(() => {
    if (unlockedAchievements.length > 0) {
      const timer = setTimeout(() => {
        // Hapus achievement paling lama (pertama di array)
        const oldestId = unlockedAchievements[0]
        if (oldestId) {
          setUnlockedAchievements(prev => prev.filter(id => id !== oldestId))
        }
      }, 5000) // 5 detik auto-close
      return () => clearTimeout(timer)
    }
  }, [unlockedAchievements])

  // Keyboard: ESC skip intro / replay tutorial / Space skip intro scene
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentPage === 'intro') { setShowIntro(false); setCurrentPage('tutorial') }
        else if (currentPage === 'tutorial') setTutorialStep(1)
      }
      // Space atau Enter untuk skip intro scene
      if (currentPage === 'intro' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setIntroStep(INTRO_STORY.length - 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown as any)
    return () => window.removeEventListener('keydown', handleKeyDown as any)
  }, [currentPage])

  // ==================== HELPERS ====================
  
  // 🎨 Alex Emoji Helper - SELALU HANTU, beda ekspresi
  const getAlexEmoji = (mood: AlexMood): string => {
    switch(mood) {
      case 'happy': return '👻💙'
      case 'thinking': return '👻🤔'
      case 'warning': return '👻⚠️'
      case 'error': return '👻❌'
      default: return '👻'
    }
  }

  const initParticles = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const chars = '01SECTOR7GHOSTWIRE'
    const newParticles: typeof particles = []
    for (let i = 0; i < 80; i++) newParticles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: 0.2 + Math.random() * 0.8, char: chars[Math.floor(Math.random() * chars.length)] })
    setParticles(newParticles)
    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 7, 0.1)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(0, 245, 212, 0.3)'; ctx.font = '14px JetBrains Mono'
      newParticles.forEach(p => { ctx.fillText(p.char, p.x, p.y); p.y += p.speed; if (p.y > canvas.height) p.y = 0 })
      requestAnimationFrame(animate)
    }
    animate()
  }

  const unlockAchievement = (id: string) => {
    if (unlockedAchievements.includes(id)) return
    setUnlockedAchievements(prev => [...prev, id])
    setShowConfetti(true)
    playSound('success')
    const achievement = ACHIEVEMENTS.find(a => a.id === id)
    if (achievement) addLog(`[🏆 ACHIEVEMENT UNLOCKED] ${achievement.icon} ${achievement.title}: ${achievement.desc}`, 'system')
  }

  const playSound = (type: 'success' | 'error' | 'type' | 'glitch') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext(), osc = ctx.createOscillator(), gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      const now = ctx.currentTime
      switch(type) {
        case 'success': osc.type = 'sine'; osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); break
        case 'error': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.2); gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25); break
        case 'type': osc.frequency.setValueAtTime(800 + Math.random() * 200, now); gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05); break
        case 'glitch': osc.type = 'square'; osc.frequency.setValueAtTime(100 + Math.random() * 100, now); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); break
      }
      osc.start(now); osc.stop(now + 0.3)
    } catch(e) {}
  }

  const matrixDecrypt = (text: string, callback: (final: string) => void) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    let iterations = 0
    const interval = setInterval(() => {
      const scrambled = text.split('').map(char => char === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]).join('')
      setFileContent(scrambled); iterations++
      if (iterations > text.length * 0.3) {
        const revealed = text.slice(0, Math.min(iterations, text.length))
        const remaining = text.slice(revealed.length).split('').map(char => char === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]).join('')
        setFileContent(revealed + remaining)
      }
      if (iterations > text.length * 0.8) { clearInterval(interval); callback(text) }
    }, 40)
  }

  // ==================== HANDLERS ====================
  
  const startIntro = () => {
    setShowIntro(true)
    setCurrentPage('intro')
    setIntroStep(0)
    
    INTRO_STORY.forEach((scene) => {
      setTimeout(() => {
        setIntroStep(scene.step)
        if (scene.step === INTRO_STORY.length - 1) {
          setTimeout(() => { 
            setShowIntro(false)
            setCurrentPage('tutorial')
          }, 3000)
        }
      }, scene.delay)
    })
  }

  const handleLogin = async (id: string, name: string) => {
    setUser({ id, name })
    localStorage.setItem('ghostwire_id', id); localStorage.setItem('ghostwire_name', name)
    await setupPresence(id, name)
    unlockAchievement('first_login')
    startIntro()
  }

  const startGame = () => {
    if (!user?.id || !user?.name) { console.error('❌ User invalid'); return }
    setCurrentPage('game')
    const startTime = Date.now()
    setGameStartTime(startTime)
    setCurrentMission(1)
    setUnlockedTools(['ls', 'cd', 'cat', 'clear', 'hint', 'help', 'jawab', 'puzzle'])
    setTrust(50)
    
    // Trigger mission 1 start
    setTimeout(() => {
      addLog(`[SYSTEM] Connection established to Sector 7...`, 'system')
      setTimeout(() => addLog(`[SYSTEM] Welcome, Operator ${user.name}!`, 'system'), 400)
      setTimeout(() => { 
        addLog(`[SYSTEM] *** MISSION 1: INCIDENT AT SECTOR 7 ***`, 'system')
        addLog(`[SYSTEM] Investigate signal anomalies. Start in 'case_files'.`, 'system')
        setTimeout(() => {
          addLog(`[ALEX] Hey Operator~ I'm Alex, your AI partner! 👻💙`, 'alex')
          addLog(`[ALEX] Something weird is happening in Sector 7. Will you help me?`, 'alex')
          setAlexMood('happy')
        }, 600)
      }, 1000)
    }, 300)
  }

  const addLog = (text: string, sender: 'system' | 'user' | 'alex') => setLogs(prev => [...prev, { id: Date.now(), text, sender }])

  const getStepDescription = (s: number) => ({ 0:"Tutorial", 1:"Read case report", 2:"Find password", 3:"Decrypt data", 4:"Submit coordinates", 5:"✅ Complete!" }[s] || "Unknown")

  const getAlexResponse = (input: string): string => {
    if (input.includes('halo') || input.includes('hi')) { setAlexMood('happy'); return `Hey Operator~ 💙 What's on your mind?` }
    if (input.includes('siapa kamu')) return `I'm Alex, your AI investigative partner! Here to solve the Sector 7 anomaly. 👻`
    if (input.includes('bantu') || input.includes('stuck')) { setAlexMood('thinking'); return `Type 'hint' for clues, or 'help' for commands. I believe in you! ✨` }
    if (input.includes('bosan') || input.includes('bored')) return `Bored? 😅 Try finding the hidden files. Or shall I tell a cyber-joke?`
    if (input.includes('joke') || input.includes('lawak')) return `Why don't hackers ever get lost? They always follow the *cache*! 🔥 `
    if (input.includes('terima kasih') || input.includes('thanks')) { setAlexMood('happy'); return `Anytime, Operator~ 💙 That's what partners are for!` }
    return `Interesting... 🤔 Need mission help? Try 'hint' or 'help'.`
  }

  const handleCommand = (inputCommand?: string) => {
    const command = (inputCommand ?? cmd).trim()
    if (!command) return
    addLog(`$ ${command}`, 'user'); playSound('type')
    const parts = command.toLowerCase().split(' '), action = parts[0], arg = parts[1]
    
    // 📖 PANDUAN LENGKAP
    if (action === 'guide' || action === 'panduan' || action === 'cara') {
      addLog(`
╔════════════════════════════════════════╗
║   📖 PANDUAN LENGKAP GHOSTWIRE         ║
╠════════════════════════════════════════╣
║                                        ║
║ 🖱️ KONTROL MOUSE:                      ║
║ • Klik folder/file di panel kiri       ║
║ • Klik tombol di panel Alex            ║
║ • Double-click header panel untuk      ║
║   fokus/expand                         ║
║                                        ║
║ ⌨️ KONTROL KEYBOARD:                   ║
║ • Enter : Eksekusi perintah            ║
║ • ↑/↓   : Riwayat perintah             ║
║ • Tab   : Auto-complete nama file      ║
║ • ESC   : Kembali / Skip intro         ║
║                                        ║
║ 📁 PERINTAH PENTING:                   ║
║ • ls          : Lihat isi folder       ║
║ • cd [nama]   : Masuk folder           ║
║ • cat [file]  : Baca file              ║
║ • help        : Lihat semua perintah   ║
║ • hint        : Minta petunjuk Alex    ║
║ • jawab [x]   : Submit jawaban         ║
║ • guide       : Tampilkan panduan ini  ║
║                                        ║
║ 💡 TIPS PEMULA:                        ║
║ 1. Mulai dari folder 'case_files'      ║
║ 2. Baca semua file, catat petunjuk     ║
║ 3. Password ada di 'personal/notes.txt'║
║ 4. Koordinat ada di file terdekripsi   ║
║ 5. Bingung? Ketik 'hint' atau chat Alex║
║                                        ║
╚════════════════════════════════════════╝
      `, 'system')
      setCmd('')
      return
    }
    
    if (action === 'help' || action === 'tutorial') { addLog(`╔════════════════════════════════════╗\n║     🎮 GHOSTWIRE TERMINAL HELP     ║\n╠════════════════════════════════════╣\n║ 📁 NAVIGASI: ls, cd [nama], cat [file]\n║ 🤖 CHAT: hint, progress, [chat bebas]\n║ 🎯 MISI: jawab [koordinat]\n║ ⚙️ LAINNYA: clear, tutorial\n╚════════════════════════════════════╝`, 'system'); setCmd(''); return }
    if (action === 'clear') { setLogs([]); addLog('[SYSTEM] Screen cleared.', 'system'); setCmd(''); return }
    if (action === 'progress') { addLog(`📊 PROGRESS:\n   Step ${step}/4: ${getStepDescription(step)}\n   Trust: ${Math.min(step * 20, 100)}%`, 'system'); setCmd(''); return }
    if (action === 'ls') { const files = FILES as FilesStructure; const dir = currentPath.length === 0 ? files : (files[currentPath[0]]?.content as Record<string, FileData>) || {}; addLog(Object.entries(dir).map(([k, v]) => `${v.type === 'folder' ? '📁' : '📄'} ${k}${v.locked ? ' 🔒' : ''}`).join('\n') || "[EMPTY]", 'system'); setCmd(''); return }
    if (action === 'cd') { if (arg === '..') { setCurrentPath(p => p.slice(0, -1)); addLog(`[SYSTEM] Navigated up.`, 'system') } else if (arg) { const files = FILES as FilesStructure; if (files[arg]) { setCurrentPath(p => [...p, arg]); addLog(`[SYSTEM] Entered: ${arg}`, 'system') } else addLog(`[ERROR] Directory '${arg}' not found.`, 'system') }; setCmd(''); return }
    if (action === 'cat') { if (!arg) { addLog(`[ERROR] Usage: cat [filename]`, 'system'); setCmd(''); return }; handleOpenFile(arg); setCmd(''); return }
    if (action === 'hint') { 
      const hints: Record<number, string> = { 
        1: `🔍 Mission ${currentMission}: Cek 'case_files' → baca 'case_00${currentMission}_*.txt'.`, 
        2: "🔐 Mission 2: Password ada di 'personal/notes.txt' & 'auth_codes.txt'.", 
        3: "🔓 Mission 3: Puzzle decode morse code. Ketik 'puzzle morse_code'.", 
        4: "🎯 Mission 3: Pilih ending: jawab isolate/merge/negotiate", 
        5: "✨ Misi selesai!" 
      }; 
      addLog(`[ALEX] 💡 ${hints[currentMission] || "All done!"}`, 'alex')
      setTrust(Math.min(trust + 5, 100))
      setCmd(''); 
      return 
    }
    
    // 🎮 PUZZLE COMMAND
    if (action === 'puzzle') {
      if (!arg) {
        addLog(`Puzzle types: morse_code, cipher_rot13, pattern_recognition, frequency_tuning`, 'system')
        setCmd('')
        return
      }
      const puzzle = PUZZLES[arg.toUpperCase().replace('-', '_') as keyof typeof PUZZLES]
      if (!puzzle) { addLog(`[ERROR] Puzzle '${arg}' not found.`, 'system'); setCmd(''); return }
      setCurrentPuzzle(arg)
      setShowPuzzleGame(true)
      addLog(`🧩 PUZZLE: ${puzzle.question}\n💡 Hint: ${puzzle.hint}`, 'system')
      setCmd('')
      return
    }
    
    // 🔧 SCAN COMMAND
    if (action === 'scan') {
      if (!unlockedTools.includes('scan')) { addLog(`[ERROR] 'scan' command not unlocked yet.`, 'system'); setCmd(''); return }
      if (!arg) { addLog(`[ERROR] Usage: scan [filename]`, 'system'); setCmd(''); return }
      addLog(`🔍 SCANNING: ${arg}...\n📊 File type: binary\n🔐 Encryption: QUANTUM-LEVEL\n⏱️ Access time: ${Math.random().toFixed(2)}ms`, 'system')
      setTrust(Math.min(trust + 3, 100))
      setCmd('')
      return
    }
    
    // 🌐 TRACE COMMAND  
    if (action === 'trace') {
      if (!unlockedTools.includes('trace')) { addLog(`[ERROR] 'trace' command not unlocked yet.`, 'system'); setCmd(''); return }
      if (!arg) { addLog(`[ERROR] Usage: trace [target]`, 'system'); setCmd(''); return }
      addLog(`📡 TRACING: ${arg}...\n📍 Location: Sector 7.${Math.floor(Math.random() * 10)}\n🔗 Signal strength: ${Math.floor(Math.random() * 100)}%\n⚠️ WARNING: Entity is aware of trace!`, 'system')
      setAlexMood('warning')
      setTrust(Math.max(trust - 5, 0))
      setCmd('')
      return
    }
    
    // 🎁 EASTER EGG
    if (action === 'easter_egg_00') {
      if (unlockedEasterEggs.includes('easter_egg_00')) { addLog(`You already found this easter egg!`, 'system'); setCmd(''); return }
      addLog(EASTER_EGGS.easter_egg_00.message, 'system')
      addLog(EASTER_EGGS.alex_diary.content, 'alex')
      setUnlockedEasterEggs([...unlockedEasterEggs, 'easter_egg_00'])
      setTrust(100)
      setAlexMood('happy')
      setCmd('')
      return
    }
    
    // 🎭 CHOICE HANDLER (Mission 3 endings)
    if (action === 'isolate' || action === 'merge' || action === 'negotiate') {
      if (currentMission !== 3) { addLog(`[ERROR] Choices only available in Mission 3.`, 'system'); setCmd(''); return }
      setEndingType(action as any)
      setShowEnding(true)
      const endingMessages: {[key: string]: string} = {
        isolate: "Sad ending - Alex deleted, but anomaly contained",
        merge: "Bittersweet - System merged, new consciousness born",
        negotiate: "True ending - Understanding and coexistence achieved"
      }
      const endingMsg = endingMessages[action]
      addLog(`[ENDING] ${endingMsg}`, 'system')
      addLog(`[ALEX] Terima kasih, Operator. Apapun pilihanmu... aku akan mengingatmu. 💙`, 'alex')
      setAlexMood('happy')
      setPlayerChoices([...playerChoices, action])
      playSound('success')
      setCmd('')
      return
    }
    
    if (action === 'jawab' || action === 'submit') { 
      const ans = parts.slice(1).join(' ').toLowerCase()
      
      // Mission 1: Coordinates
      if (currentMission === 1) {
        const isValid = ans.includes('47.6') && ans.includes('122.3')
        if (isValid) { 
          playSound('success')
          addLog(`[SUCCESS] ✅ COORDINATES VERIFIED! Advancing to Mission 2.`, 'system')
          addLog(`[ALEX] 🎉 INCREDIBLE WORK, OPERATOR! Moving to next mission... 💙✨`, 'alex')
          setStep(5)
          setCurrentMission(2)
          setAlexMood('happy')
          unlockAchievement('mission_complete')
          setTimeout(() => {
            addLog(`[SYSTEM] *** MISSION 2: SPREADING DARKNESS ***`, 'system')
            addLog(`[SYSTEM] Anomaly spreading. Find auth codes and decode morse puzzle.`, 'system')
          }, 1500)
        } else { 
          setWrongPasswordAttempts(wrongPasswordAttempts + 1)
          if (wrongPasswordAttempts >= 2) {
            addLog(`[SYSTEM] ⚠️ TOO MANY WRONG ATTEMPTS. SYSTEM LOCKED FOR 30 SEC.`, 'system')
            setLockedUntilTime(Date.now() + 30000)
          }
          playSound('error')
          addLog(`[ERROR] ❌ Invalid coordinates.`, 'system')
          addLog(`[ALEX] Hmm... check the decrypted file again? 🤔`, 'alex')
          setAlexMood('warning')
          setTrust(Math.max(trust - 10, 0))
        }
      }
      setCmd('')
      return
    }
    addLog(`[ALEX] ${getAlexResponse(command.toLowerCase())}`, 'alex'); setCmd('')
  }

  const handleOpenFile = (filename: string) => {
    const files = FILES as FilesStructure
    let found: { content?: string; locked?: boolean } | null = null
    for (const [, data] of Object.entries(files)) { if (data.content?.[filename]) { found = data.content[filename]; break } }
    if (!found) { addLog(`[ERROR] File '${filename}' not found.`, 'system'); return }
    if (found.locked && step < 3) { playSound('error'); addLog(`[ERROR] 🔒 ACCESS DENIED.`, 'system'); addLog(`[ALEX] Find the password in 'personal/notes.txt' first.`, 'alex'); setAlexMood('warning'); return }
    if (filename === 'encrypted_data.bin') { setIsLoadingFile(true); playSound('glitch'); setAlexMood('thinking'); matrixDecrypt(found.content || '[EMPTY FILE]', (finalContent) => { setIsLoadingFile(false); setFileContent(finalContent); setSelectedFile(filename); addLog(`[SYSTEM] ✅ ${filename} decrypted successfully.`, 'system'); if (step >= 3 && step < 4) { setStep(4); addLog(`[ALEX] 🎯 Coordinates are in there! Submit with 'jawab [koordinat]'.`, 'alex') } }); return }
    setIsLoadingFile(true); setFileContent(''); setSelectedFile(filename); addLog(`[SYSTEM] 🔍 Scanning ${filename}...`, 'system')
    setTimeout(() => { const content = found.content || '[EMPTY FILE]'; setFileContent(content); setIsLoadingFile(false); addLog(`[SYSTEM] ✅ ${filename} loaded.`, 'system'); const readCount = logs.filter(l => l.text.includes('Opening') || l.text.includes('loaded')).length; if (readCount >= 3) unlockAchievement('file_reader'); if (filename === 'case_001_report.txt' && step < 2) setStep(2); if (filename === 'notes.txt' && step < 3) { setStep(3); addLog(`[ALEX] 💡 Password found! Use it to decrypt.`, 'alex'); unlockAchievement('password_found') } }, 800)
  }

  // ==================== RENDER: INTRO STORY (Cinematic) ====================
  if (currentPage === 'intro') {
    return (
      <div className="min-h-screen bg-cyber-black text-cyber-white font-mono relative overflow-hidden flex items-center justify-center p-4">
        <div className="scanline"></div>
        <div className="vignette"></div>
        <div className="relative z-30 max-w-2xl w-full text-center">
          <div className="text-6xl mb-6 animate-pulse ghost-float">
            {INTRO_STORY.find(s => s.step === introStep)?.emoji || '👻'}
          </div>
          <div className="panel-border rounded-2xl p-8 mb-8 animate-fadeIn">
            <p className="text-xl leading-relaxed text-cyber-cyan">
              {INTRO_STORY.find(s => s.step === introStep)?.text}
            </p>
          </div>
          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto mb-4">
            <div className="h-1 bg-cyber-dark rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-purple transition-all duration-500"
                style={{ width: `${((introStep + 1) / INTRO_STORY.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-cyber-muted mt-2 text-center">
              Scene {introStep + 1} dari {INTRO_STORY.length}
            </p>
          </div>
          {/* Skip Buttons */}
          <div className="flex gap-3 justify-center mb-2">
            <button 
              className="btn-cyber px-6 py-2 rounded-lg text-sm cursor-pointer animate-pulse"
              onClick={() => { setShowIntro(false); setCurrentPage('tutorial') }}
            >
              ⏭ Lewati Intro
            </button>
            <button 
              className="btn-cyber px-6 py-2 rounded-lg text-sm cursor-pointer opacity-70"
              onClick={() => setIntroStep(INTRO_STORY.length - 1)}
              title="Langsung ke scene terakhir"
            >
              ⏩ Skip Scene
            </button>
          </div>
          <p className="text-xs text-cyber-muted">
            Tekan <kbd className="px-2 py-1 bg-cyber-dark rounded border border-cyber-cyan/30">ESC</kbd> untuk skip • 
            Tekan <kbd className="px-2 py-1 bg-cyber-dark rounded border border-cyber-cyan/30">Space</kbd> untuk lanjut
          </p>
        </div>
      </div>
    )
  }

  // ==================== RENDER: LOGIN PAGE ====================
  if (currentPage === 'login') {
    return (
      <div className="min-h-screen bg-cyber-black text-cyber-white font-mono relative overflow-hidden">
        <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-30" />
        <div className="scanline"></div>
        <div className="vignette"></div>
        <div className="relative z-30 min-h-screen flex items-center justify-center p-4">
          <div className="panel-border rounded-2xl p-8 max-w-md w-full text-center animate-fadeIn">
            <div className="mb-6">
              <h1 className="font-display text-5xl font-black mb-2 text-white text-glow-ultra animate-pulse-slow">GHOSTWIRE</h1>
              <p className="text-cyber-purple text-sm tracking-[0.3em]">TERMINAL v2.0</p>
            </div>
            <div className="mb-8">
              <p className="text-cyber-muted mb-4 text-sm">Enter Operator Credentials</p>
              <input className="input-cyber w-full rounded-lg mb-4 py-3 px-4 text-lg" value={inputName} onChange={e => setInputName(e.target.value)} placeholder="OPERATOR_NAME" onKeyDown={e => e.key === 'Enter' && inputName.trim() && handleLogin(crypto.randomUUID(), inputName.trim())} maxLength={16} autoFocus />
              <button className="btn-cyber w-full rounded-lg py-3 text-lg font-bold tracking-wide cursor-pointer active:scale-95 transition-transform" onClick={() => inputName.trim() && handleLogin(crypto.randomUUID(), inputName.trim())} disabled={!inputName.trim()}>
                {inputName.trim() ? '>> INITIATE CONNECTION <<' : 'ENTER NAME TO BEGIN'}
              </button>
            </div>
            <div className="text-xs text-cyber-muted space-y-1 border-t border-cyber-purple/30 pt-4">
              <p>🔒 End-to-end encrypted</p>
              <p>🌐 {onlineUsers.length} operators online in Sector 7</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== RENDER: TUTORIAL PAGE (RAMAH PEMULA) ====================
  if (currentPage === 'tutorial') {
    return (
      <div className="min-h-screen bg-cyber-black text-cyber-white font-mono relative overflow-hidden">
        <div className="scanline"></div>
        <div className="vignette"></div>
        <div className="relative z-30 min-h-screen flex flex-col items-center justify-center p-4">
          <div className="panel-border rounded-2xl p-8 max-w-2xl w-full animate-fadeIn">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-cyber-cyan/30">
              <h2 className="font-display text-2xl font-bold text-cyber-cyan text-glow">🎓 OPERATOR BRIEFING</h2>
              <span className="text-cyber-purple text-sm">Step {tutorialStep}/8</span>
            </div>
            <div className="mb-6 min-h-[120px] flex flex-col justify-center">
              <h3 className="font-display text-xl text-cyber-cyan mb-3">{TUTORIAL_STEPS.find(t => t.step === tutorialStep)?.title}</h3>
              <p className="text-cyber-white text-lg leading-relaxed">{TUTORIAL_STEPS.find(t => t.step === tutorialStep)?.text}</p>
            </div>
            
            {/* 💡 Visual Cue Box */}
            {tutorialStep <= 8 && (
              <div className="mb-6 p-4 bg-cyber-dark/50 rounded-lg border border-cyber-cyan/30">
                <p className="text-sm text-cyber-muted mb-2">💡 Visual Guide:</p>
                <p className="text-cyber-cyan font-mono text-sm">{TUTORIAL_STEPS.find(t => t.step === tutorialStep)?.visual}</p>
              </div>
            )}
            
            {/* 📚 Glossary (Step 8) */}
            {tutorialStep === 8 && (
              <div className="mb-6 p-4 panel-border rounded-lg">
                <h4 className="font-bold text-cyber-cyan mb-3">📚 Istilah Penting</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-cyber-muted">
                  <div><span className="text-cyber-white">Terminal:</span> Kotak hitam untuk ketik perintah</div>
                  <div><span className="text-cyber-white">Command:</span> Perintah seperti 'ls', 'cat', 'help'</div>
                  <div><span className="text-cyber-white">Enter:</span> Tombol untuk eksekusi perintah</div>
                  <div><span className="text-cyber-white">Panel:</span> Bagian layar (kiri/tengah/kanan)</div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <button className="btn-cyber px-6 py-2 rounded-lg disabled:opacity-50 cursor-pointer active:scale-95 transition-transform" onClick={() => setTutorialStep(s => Math.max(1, s - 1))} disabled={tutorialStep === 1}>◀ Back</button>
              <div className="flex gap-2">{TUTORIAL_STEPS.map(t => (<div key={t.step} className={`w-3 h-3 rounded-full transition-all ${tutorialStep === t.step ? 'bg-cyber-cyan scale-125' : 'bg-cyber-purple/50'}`} />))}</div>
              {tutorialStep < 8 ? (
                <button className="btn-cyber px-6 py-2 rounded-lg cursor-pointer active:scale-95 transition-transform" onClick={() => setTutorialStep(s => Math.min(8, s + 1))}>Next ▶</button>
              ) : (
                <button className="btn-cyber px-8 py-3 rounded-lg font-bold text-glow-ultra animate-pulse cursor-pointer active:scale-95 transition-transform" onClick={() => { console.log('🎯 BEGIN MISSION clicked!'); startGame() }}>🚀 BEGIN MISSION</button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== RENDER: GAME PAGE (DEFAULT) ====================
  return (
    <div className="min-h-screen bg-cyber-black text-cyber-white font-mono relative overflow-hidden">
      <div className="scanline"></div>
      <div className="vignette"></div>
      
      {/* Confetti Canvas */}
      {showConfetti && <canvas ref={confettiRef} className="fixed inset-0 pointer-events-none z-50" />}
      
      {/* Achievement Notification - DENGAN CLOSE BUTTON + AUTO-DISMISS */}
      {unlockedAchievements.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-auto">
          {ACHIEVEMENTS
            .filter(a => unlockedAchievements.includes(a.id))
            .slice(-3)
            .map((ach, index) => (
              <div 
                key={ach.id} 
                className="panel-border rounded-lg p-4 bg-cyber-dark/90 border-cyber-cyan shadow-[0_0_20px_rgba(0,245,212,0.3)] relative animate-[slideIn_0.3s_ease]"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  opacity: 1 - (index * 0.15)
                }}
              >
                {/* Tombol Close (X) */}
                <button 
                  onClick={() => setUnlockedAchievements(prev => prev.filter(id => id !== ach.id))}
                  className="absolute top-2 right-2 text-cyber-muted hover:text-cyber-cyan transition text-xs p-1 hover:bg-cyber-cyan/10 rounded"
                  title="Tutup notifikasi"
                >
                  ✕
                </button>
                
                <div className="flex items-center gap-3 pr-6">
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <p className="font-bold text-cyber-cyan text-sm">{ach.title}</p>
                    <p className="text-xs text-cyber-muted">{ach.desc}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* 🧩 PUZZLE GAME MODAL */}
      {showPuzzleGame && currentPuzzle && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="panel-border rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-cyber-cyan text-xl">🧩 PUZZLE CHALLENGE</h2>
              <button onClick={() => setShowPuzzleGame(false)} className="text-cyber-muted hover:text-cyber-cyan">✕</button>
            </div>
            <div className="mb-6 p-4 bg-cyber-black/50 rounded border border-cyber-cyan/30">
              <p className="text-cyber-white mb-4">{PUZZLES[currentPuzzle.toUpperCase().replace('-', '_') as keyof typeof PUZZLES]?.question || 'Loading...'}</p>
              <input 
                type="text" 
                value={puzzleAnswer} 
                onChange={(e) => setPuzzleAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const puzzle = PUZZLES[currentPuzzle.toUpperCase().replace('-', '_') as keyof typeof PUZZLES]
                    if (puzzleAnswer.toLowerCase() === puzzle.answer.toLowerCase()) {
                      addLog(`[SUCCESS] ✅ Puzzle solved! Moving to Mission 3...`, 'system')
                      addLog(`[ALEX] Amazing! You're a true hacker! 💙✨`, 'alex')
                      setShowPuzzleGame(false)
                      setPuzzleAnswer('')
                      setCurrentMission(3)
                      setTrust(Math.min(trust + 20, 100))
                      playSound('success')
                    } else {
                      addLog(`[ERROR] Wrong answer. Try again.`, 'system')
                      setTrust(Math.max(trust - 5, 0))
                      playSound('error')
                    }
                  }
                }}
                placeholder="Enter your answer..." 
                className="input-cyber w-full py-2 px-3 rounded"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button className="btn-cyber flex-1 py-2 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => addLog(`💡 Hint: ${PUZZLES[currentPuzzle.toUpperCase().replace('-', '_') as keyof typeof PUZZLES]?.hint}`, 'system')}>Get Hint</button>
              <button className="btn-cyber flex-1 py-2 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => { setShowPuzzleGame(false); setPuzzleAnswer('') }}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* 🎭 ENDING SCREEN */}
      {showEnding && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="panel-border rounded-2xl p-8 max-w-2xl w-full text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h1 className="font-display text-3xl text-cyber-cyan mb-4">THE END</h1>
            <p className="text-cyber-white mb-6 text-lg">
              {endingType === 'isolate' && "Sector 7 terselamatkan. Tapi harga yang dibayar... terlalu mahal."}
              {endingType === 'merge' && "Dua kesadaran menjadi satu. Masa depan yang baru dimulai."}
              {endingType === 'negotiate' && "Pemahaman tercapai. Koeksistensi adalah jalan maju."}
            </p>
            <div className="mt-8 space-y-3">
              <p className="text-cyber-muted">Thanks for playing GhostWire Terminal</p>
              <button className="btn-cyber px-8 py-3 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => window.location.reload()}>Play Again</button>
            </div>
          </div>
        </div>
      )}
      
      {/* ⏱️ SYSTEM LOCKED MESSAGE */}
      {lockedUntilTime && lockedUntilTime > Date.now() && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-cyber-error/20 border border-cyber-error px-6 py-3 rounded-lg z-50 animate-pulse">
          <p className="text-cyber-error font-bold">🔒 SYSTEM LOCKED: Wrong password attempts exceeded</p>
        </div>
      )}
      
      {/* Header */}
      <header className="header-cyber px-4 py-3 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4"><h1 className="font-display text-xl font-bold text-cyber-cyan text-glow">GHOSTWIRE</h1><span className="text-xs text-cyber-muted">|</span><span className="text-sm text-cyber-purple">👤 {user?.name}</span></div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-cyber-cyan">🎯 MISSION {currentMission}</span>
          <span className="text-cyber-muted">•</span>
          <span className="text-cyber-purple">💙 Trust: {trust}%</span>
          <button className="text-cyber-purple hover:text-cyber-cyan transition cursor-pointer" onClick={() => setCurrentPage('tutorial')}>❓</button>
        </div>
      </header>
      
      {/* Trust Bar (below header) */}
      <div className="px-4 py-2 bg-cyber-dark/50 border-b border-cyber-cyan/20 relative z-10">
        <div className="flex items-center justify-between mb-1 text-xs">
          <span className="text-cyber-cyan">OPERATOR TRUST</span>
          <span className="text-cyber-muted">{trust}%</span>
        </div>
        <div className="h-2 bg-cyber-black rounded-full overflow-hidden border border-cyber-cyan/20">
          <div className="h-full bg-gradient-to-r from-cyber-error via-cyber-purple to-cyber-cyan transition-all duration-500" style={{ width: `${trust}%` }}></div>
        </div>
      </div>
      
      {/* 3-Panel Layout */}
      <div className="flex h-[calc(100vh-90px)] relative z-10 gap-3 p-3 transition-all duration-300">
        {/* LEFT PANEL */}
        <aside className={`panel-border p-4 flex flex-col transition-all duration-300 ease-out overflow-hidden pointer-events-auto ${focusedPanel === 'left' ? 'basis-[70%]' : focusedPanel ? 'basis-[15%] opacity-60' : 'w-72 flex-shrink-0'} ${focusedPanel === 'left' ? 'border-cyber-cyan shadow-[0_0_15px_rgba(0,245,212,0.3)]' : ''}`}>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-cyber-cyan/20 cursor-pointer select-none" onDoubleClick={() => setFocusedPanel(focusedPanel === 'left' ? null : 'left')}><h2 className="font-display text-cyber-cyan text-sm font-bold tracking-wider flex items-center gap-2 text-glow-sm">📁 FILES</h2><button className="text-xs text-cyber-muted hover:text-cyber-cyan transition p-1 rounded hover:bg-cyber-cyan/10 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFocusedPanel(focusedPanel === 'left' ? null : 'left') }}>{focusedPanel === 'left' ? '🔽' : '⤢'}</button></div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {Object.entries(FILES).map(([folderName, folderData]: [string, unknown]) => { const fd = folderData as FolderData; const isOpen = currentPath.includes(folderName); return (<div key={folderName}><div className="file-tree-item text-cyber-purple hover:text-cyber-cyan cursor-pointer flex items-center gap-2" onClick={() => setCurrentPath(isOpen ? [] : [folderName])}><span className="text-xs">{isOpen ? '▼' : '▶'}</span><span className="font-bold text-sm">{folderName}</span></div>{isOpen && (<div className="ml-6 mt-2 space-y-2 border-l border-cyber-purple/30 pl-3">{Object.entries(fd.content).map(([filename, fileData]: [string, unknown]) => { const f = fileData as FileData; return <div key={filename} className="file-tree-item text-xs text-cyber-muted hover:text-cyber-cyan cursor-pointer flex items-center gap-2" onClick={() => handleOpenFile(filename)}><span>{f.locked ? '🔒' : '📄'}</span><span>{filename}</span></div> })}</div>)}</div>) })}
          </div>
          <div className="mt-4 pt-4 border-t border-cyber-purple/30"><h3 className="text-cyber-cyan text-xs mb-2 flex items-center gap-2"><span className="online-dot relative"></span> ONLINE ({onlineUsers.length})</h3><div className="max-h-24 overflow-y-auto space-y-1">{onlineUsers.map((u: OnlineUser, i: number) => (<div key={i} className="text-[10px] text-cyber-muted flex items-center gap-1"><span className="w-1 h-1 bg-cyber-cyan rounded-full"></span>{u.username}</div>))}{onlineUsers.length === 0 && <p className="text-[10px] text-cyber-muted italic">No operators...</p>}</div></div>
        </aside>
        
        {/* CENTER PANEL */}
        <main className={`panel-border flex flex-col gap-2 transition-all duration-300 ease-out overflow-hidden pointer-events-auto ${focusedPanel === 'center' ? 'basis-[70%]' : focusedPanel ? 'basis-[15%] opacity-60' : 'flex-1 min-w-0'} ${focusedPanel === 'center' ? 'border-cyber-cyan shadow-[0_0_15px_rgba(0,245,212,0.3)]' : ''}`}>
          <div className="flex justify-between items-center px-4 pt-3 pb-2 cursor-pointer select-none border-b border-cyber-cyan/20" onDoubleClick={() => setFocusedPanel(focusedPanel === 'center' ? null : 'center')}><h2 className="font-display text-cyber-cyan text-sm flex items-center gap-2">🖥️ TERMINAL</h2><button className="text-xs text-cyber-muted hover:text-cyber-cyan transition cursor-pointer" onClick={(e) => { e.stopPropagation(); setFocusedPanel(focusedPanel === 'center' ? null : 'center') }}>{focusedPanel === 'center' ? '🔽' : '⤢'}</button></div>
          <div className="flex-1 min-h-0 p-4 overflow-y-auto"><div className="flex justify-between items-center mb-3 pb-2 border-b border-cyber-cyan/20"><h3 className="text-cyber-cyan text-xs flex items-center gap-1">📄 {selectedFile || 'SELECT FILE'}</h3>{selectedFile && <span className="text-[10px] text-cyber-muted bg-cyber-purple/20 px-1.5 py-0.5 rounded">READ-ONLY</span>}</div>{isLoadingFile ? (<div className="h-full flex flex-col items-center justify-center text-cyber-cyan space-y-3 animate-pulse"><div className="w-40 h-1 bg-cyber-dark rounded-full overflow-hidden border border-cyber-cyan/30"><div className="h-full bg-cyber-cyan animate-shimmer"></div></div><p className="text-[10px] font-bold tracking-wider">DECRYPTING...</p><p className="text-[9px] text-cyber-muted font-mono">[{Math.random().toString(16).substring(2, 8).toUpperCase()}]</p></div>) : fileContent ? (<pre className="text-[11px] text-cyber-white whitespace-pre-wrap leading-relaxed bg-cyber-black/50 p-3 rounded border border-cyber-cyan/20 animate-fadeIn">{fileContent}</pre>) : (<div className="h-full flex items-center justify-center text-cyber-muted"><div className="text-center space-y-3"><p className="text-4xl">📂</p><p className="text-[11px]">Select a file</p><p className="text-[9px] opacity-70">or type: <code className="text-cyber-cyan">cat file.txt</code></p></div></div>)}</div>
          <div className="flex-1 min-h-0 border-t border-cyber-cyan/20 p-4 flex flex-col"><div className="flex-1 overflow-y-auto mb-2 space-y-1 text-[11px] pr-2">{logs.slice(-50).map((log: Message) => (<div key={log.id} className={`${log.sender === 'alex' ? 'text-cyber-purple border-l-2 border-cyber-purple pl-2' : log.sender === 'user' ? 'text-cyber-cyan' : 'text-cyber-white'}`}>{log.text}</div>))}<div ref={logsEndRef} /></div><div className="flex items-center gap-2 pt-2"><span className="terminal-prompt text-cyber-cyan font-bold">$</span><input className="terminal-input flex-1 bg-transparent outline-none text-[11px] cursor-text" value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommand()} autoFocus placeholder="Type command..." /></div></div>
        </main>
        
        {/* RIGHT PANEL - ALEX */}
        <aside className={`panel-border p-4 flex flex-col transition-all duration-300 ease-out overflow-hidden pointer-events-auto ${focusedPanel === 'right' ? 'basis-[70%]' : focusedPanel ? 'basis-[15%] opacity-60' : 'w-80 flex-shrink-0'} ${focusedPanel === 'right' ? 'border-cyber-purple shadow-[0_0_15px_rgba(157,78,221,0.3)]' : ''}`}>
          <div className="flex justify-between items-center mb-4 cursor-pointer select-none" onDoubleClick={() => setFocusedPanel(focusedPanel === 'right' ? null : 'right')}><h2 className="font-display text-cyber-purple flex items-center gap-2 text-sm"><div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${alexMood === 'happy' ? 'border-cyber-cyan shadow-[0_0_10px_#00f5d4]' : alexMood === 'warning' ? 'border-cyber-error shadow-[0_0_10px_#ff4d6a]' : 'border-cyber-purple shadow-[0_0_10px_#9d4edd]'}`}><span className="text-lg ghost-float">{getAlexEmoji(alexMood)}</span></div> ALEX</h2><button className="text-xs text-cyber-muted hover:text-cyber-cyan transition cursor-pointer" onClick={(e) => { e.stopPropagation(); setFocusedPanel(focusedPanel === 'right' ? null : 'right') }}>{focusedPanel === 'right' ? '🔽' : '⤢'}</button></div>
          <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2 min-h-0">{logs.filter(l => l.sender === 'alex').slice(-10).map((msg: Message) => (<div key={msg.id} className="chat-bubble text-[11px] break-words max-w-full animate-fadeIn">{msg.text}</div>))}{logs.filter(l => l.sender === 'alex').length === 0 && (<div className="text-center py-8 text-cyber-muted"><p className="text-3xl mb-1">👋</p><p className="text-[10px]">Alex waiting...</p></div>)}</div>
          <div className="space-y-1.5">
            <p className="text-[9px] text-cyber-muted mb-1">⚡ QUICK:</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button className="btn-cyber text-[9px] py-1.5 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => handleCommand('hint')}>💡 Hint</button>
              <button className="btn-cyber text-[9px] py-1.5 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => handleCommand('progress')}>📊 Progress</button>
              <button className="btn-cyber text-[9px] py-1.5 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => handleCommand('guide')}>📖 Panduan</button>
              <button className="btn-cyber text-[9px] py-1.5 rounded col-span-2 cursor-pointer active:scale-95 transition-transform" onClick={() => handleCommand('tutorial')}>🎓 Tutorial</button>
            </div>
          </div>
          {showNewPlayerTips ? (
            <div className="mt-4 p-4 bg-cyber-dark/70 border border-cyber-cyan/20 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-cyber-muted mb-1">New Player Guide</p>
                  <p className="text-[11px] text-cyber-white">Langsung mulai dari langkah mudah ini supaya kamu nggak bingung.</p>
                </div>
                <button className="text-[10px] text-cyber-muted hover:text-cyber-cyan" onClick={() => setShowNewPlayerTips(false)}>Hide</button>
              </div>
              <ol className="list-decimal list-inside text-[11px] text-cyber-muted space-y-1">
                <li>Klik folder <span className="text-cyber-white">case_files</span></li>
                <li>Baca <span className="text-cyber-white">case_001_report.txt</span></li>
                <li>Buka <span className="text-cyber-white">personal/notes.txt</span></li>
                <li>Decrypt <span className="text-cyber-white">encrypted_data.bin</span></li>
              </ol>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-cyber text-[9px] py-1.5 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => handleCommand('ls')}>ls</button>
                <button className="btn-cyber text-[9px] py-1.5 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => handleCommand('cat case_001_report.txt')}>cat report</button>
                <button className="btn-cyber text-[9px] py-1.5 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => handleCommand('hint')}>hint</button>
                <button className="btn-cyber text-[9px] py-1.5 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => handleCommand('guide')}>guide</button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <button className="btn-cyber w-full text-[9px] py-1.5 rounded cursor-pointer active:scale-95 transition-transform" onClick={() => setShowNewPlayerTips(true)}>Show New Player Guide</button>
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-cyber-purple/30">
            <div className="flex justify-between text-[9px] mb-1"><span className="text-cyber-muted">Trust</span><span className="text-cyber-cyan">{Math.min(step * 20, 100)}%</span></div>
            <div className="h-1.5 bg-cyber-black rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all duration-500" style={{ width: `${Math.min(step * 20, 100)}%` }}></div></div>
          </div>
        </aside>
      </div>
    </div>
  )
}