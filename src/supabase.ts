// src/supabase.ts - VERSI ASLI (Supabase Connected)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const setupPresence = async (userId: string, username: string) => {
  if (!supabase) return;

  // 1. Update status online di database
  await supabase.from("players").upsert({
    id: userId,
    username,
    is_online: true,
    last_active: new Date().toISOString(),
  });

  // 2. Set offline saat user tutup browser
  window.addEventListener("beforeunload", async () => {
    if (!supabase) return;
    await supabase
      .from("players")
      .update({ is_online: false })
      .eq("id", userId);
  });

  // 3. Set offline otomatis kalau koneksi putus (heartbeat)
  setInterval(async () => {
    if (!supabase) return;
    await supabase
      .from("players")
      .update({
        is_online: true,
        last_active: new Date().toISOString(),
      })
      .eq("id", userId);
  }, 30000); // Update setiap 30 detik
};

export const upsertPlayerProfile = async (userId: string, username: string) => {
  if (!supabase) return;
  const { error } = await supabase.from("players").upsert({
    id: userId,
    username,
    is_online: true,
    last_active: new Date().toISOString(),
  });
  if (error) console.warn("Failed to upsert player profile", error);
};

export const signOutSupabase = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};
