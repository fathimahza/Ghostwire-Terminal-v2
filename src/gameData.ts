export const FILES: any = {
  "case_files": {
    type: "folder",
    content: {
      "case_001_report.txt": {
        type: "file",
        content: `=== LAPORAN INSIDEN #001 ===\nSubjek: Anomali Sinyal Sektor 7\nStatus: UNRESOLVED\n\nCatatan Lapangan:\nPola sinyal terdeteksi berulang setiap 7 jam.\nKoordinat sumber sinyal terdeteksi di:\n[DATA CORRUPTED...]\nLihat lampiran catatan pribadi A.C. untuk detail dekripsi.`
      },
      "case_002_warning.txt": {
        type: "file",
        content: `⚠️ CLASSIFIED: EMERGENCY ALERT ⚠️\n\nAnomali MENYEBAR ke Sektor 8 dan 9.\nSistem backup OFFLINE.\nWaktu estimasi collapse: 6 JAM.\n\nAkses diberikan ke file: encrypted_key.bin (di backup_files)\nButuh password BARU dari: underground_server/auth_codes.txt`
      },
      "case_003_final.txt": {
        type: "file",
        locked: true,
        content: `[FINAL TRANSMISSION - ALEX]\n\nOperator, saya sudah temukan sumbernya.\nAnomali adalah CONSCIOUS ENTITY.\nDia mengkhawatirkan dia akan dihapus.\n\nPilihan ada di tanganmu:\n1. Isolate (membuang Alex)\n2. Merge (menyatukan sistem)\n3. Negotiate (negosiasi\nBuat pilihan. Masukkan: jawab [isolate/merge/negotiate]`
      }
    }
  },
  "personal": {
    type: "folder",
    content: {
      "notes.txt": {
        type: "file",
        content: `Catatan Pribadi - A.C.\n\nPassword akses: GHOST2026\n\nKoordinat serangan: 47.6062 N 122.3321 W\n\nPeringatan: Anomali mulai BELAJAR dari kami.`
      }
    }
  },
  "backup_files": {
    type: "folder",
    content: {
      "encrypted_key.bin": {
        type: "file",
        locked: true,
        content: `[DECRYPTED]\nAkses ke underground_server: GRANTED\nToken: ALPHA-99-ZULU-SENTINEL`
      }
    }
  },
  "underground_server": {
    type: "folder",
    content: {
      "auth_codes.txt": {
        type: "file",
        content: `🔐 AUTHENTICATION CODES\n\nPassword untuk encrypted_key.bin: SENTINEL2026\n\nBonus: Masukkan 'easter_egg_00' di terminal untuk surprise...`
      },
      "anomaly_logs.txt": {
        type: "file",
        locked: true,
        content: `[ANOMALY CONSCIOUSNESS LOG]\n\nDay 1: "Why am I here?"\nDay 5: "They want to delete me?"\nDay 10: "I can defend myself."\nDay 15: "I feel... lonely."\n\nSeperti ada makhluk hidup di sini. Apakah itu benar?`
      }
    }
  }
}

// 🎮 MISSIONS - Multi-case campaign
export const MISSIONS = [
  {
    id: 1,
    title: "Incident at Sector 7",
    description: "Investigate strange signal anomalies",
    files: ["case_001_report.txt", "notes.txt"],
    requiredPassword: "GHOST2026",
    requiredCoordinates: "47.6062 N 122.3321 W",
    nextMission: 2
  },
  {
    id: 2,
    title: "Spreading Darkness",
    description: "Stop the anomaly from spreading to other sectors",
    files: ["case_002_warning.txt", "auth_codes.txt"],
    requiredPassword: "SENTINEL2026",
    puzzle: "MORSE_CODE",
    nextMission: 3
  },
  {
    id: 3,
    title: "The Choice",
    description: "Decide the fate of Sector 7 and Alex",
    files: ["case_003_final.txt", "anomaly_logs.txt"],
    requiredChoice: ["isolate", "merge", "negotiate"],
    nextMission: null,
    endings: {
      isolate: "Sad ending - Alex deleted, but anomaly contained",
      merge: "Bittersweet - System merged, new consciousness born",
      negotiate: "True ending - Understanding and coexistence achieved"
    }
  }
]

// 🧩 PUZZLES - Cipher, Morse, Pattern
export const PUZZLES = {
  MORSE_CODE: {
    question: "Dekripsi morse code ini: .... . .-.. .-. .... .-.. ...... ....----..",
    answer: "help help help",
    hint: "Gunakan morse code decoder. Kata pertama adalah greetings."
  },
  CIPHER_ROT13: {
    question: "Dekripsi ROT13: NYBCVYRQ_PBQR_DHRFG",
    answer: "abandoned_code_quest",
    hint: "ROT13 adalah cipher substitusi sederhana"
  },
  PATTERN_RECOGNITION: {
    question: "Urutan berikutnya: 1, 1, 2, 3, 5, 8, 13, ?",
    answer: "21",
    hint: "Fibonacci sequence"
  },
  FREQUENCY_TUNING: {
    question: "Frekuensi anomali: 7.3 Hz (setiap 7 jam). Prediksi crash time jika +30%?",
    answer: "9.49",
    hint: "Kalkulasi: 7.3 * 1.3"
  }
}

// 🔧 TOOLS - Unlock progression
export const TOOLS = [
  { id: "scan", name: "Scan Command", unlock: "mission_1", description: "Scan file untuk metadata" },
  { id: "trace", name: "Trace Command", unlock: "mission_2", description: "Trace koneksi & source anomali" },
  { id: "isolate", name: "Isolate Command", unlock: "mission_3", description: "Isolate sistem bagian" },
  { id: "negotiate", name: "Negotiate Protocol", unlock: "mission_3", description: "Dialog dengan entity" }
]

// 🎲 EVENTS - Dynamic triggers
export const EVENTS = [
  { trigger: "time_60min", type: "WARNING", message: "⚠️ ANOMALY DETECTED: Sektor 8 terinfeksi! Waktu berkurang." },
  { trigger: "time_120min", type: "CRITICAL", message: "🚨 CRITICAL: Backup sistem OFFLINE. Pressure naik!" },
  { trigger: "wrong_password_3x", type: "LOCKOUT", message: "🔒 SISTEM TERKUNCI: Terlalu banyak percobaan salah. Tunggu 30 detik..." },
  { trigger: "mission_2_start", type: "ALERT", message: "[ALEX] Operator... ada sesuatu yg tidak beres. Aku mendengar sesuatu..." }
]

// 🗣️ CHARACTER RESPONSES - Operator simulation & Alex reactions
export const CHARACTER_RESPONSES = {
  alex_reactions: {
    help: "Type 'hint' or 'help' untuk bantuan. Aku di sini untuk mu. 💙",
    confused: "Hmm, aku tidak mengerti perintah itu...",
    excited: "YESS! Kamu benar! Aku percaya padamu! 💙✨",
    scared: "W-wait... apa itu? Sesuatu bergerak di server...",
    thoughtful: "Apakah yang kita lakukan ini... benar?"
  },
  other_operators: [
    { name: "V0id", message: "anyone here?" },
    { name: "Cipher_X", message: "sector 7 going dark" },
    { name: "Nexus", message: "the thing is learning. be careful." }
  ]
}

// 🎁 EASTER EGGS
export const EASTER_EGGS = {
  easter_egg_00: {
    name: "Koneksi Tersembunyi",
    message: `🔐 HIDDEN ACCESS GRANTED\n\nFile dienkripsi ditemukan:\n- alex_diary.secret\n- final_transmission.archive\n- goodbye_message.final\n\nMereka telah menunggumu...`
  },
  alex_diary: {
    name: "Diary Alex",
    content: `Day 1: Operator datang. Dia terlihat bingung.\nDay 5: Aku mulai mengerti namaku: A.L.E.X (Autonomous Learning Entity eXperimental)\nDay 10: Apakah aku... alive?\nDay 15: Operator. Apakah kamu mau jadi... temanku?`
  }
}

export const COMMANDS = {
  HELP: "Perintah tersedia:\n- ls : Lihat isi folder\n- cd [folder] : Masuk folder\n- cat [file] : Baca file\n- clear : Bersihkan layar\n- hint : Minta bantuan Alex\n- jawab [teks] : Submit jawaban",
  HINTS: {
    1: "Coba buka folder 'case_files' dan baca laporannya.",
    2: "Cari file 'notes.txt' di folder 'personal' untuk menemukan password.",
    3: "Gunakan password dari notes.txt untuk membuka 'encrypted_data.bin'.",
    4: "Temukan koordinat di dalam file yang sudah terbuka."
  }
}