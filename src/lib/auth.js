import { isSupabaseConfigured, supabase } from "./supabase";
import { setSession, clearSession } from "../utils/storage";

export async function getAdminProfile(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { profile: null, error: new Error("Supabase is not configured.") };
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (error) return { profile: null, error };
  if (!data || data.is_active !== true || !["admin", "super_admin"].includes(data.role)) {
    return { profile: null, error: new Error("This account does not have active administrator access.") };
  }
  return { profile: data, error: null };
}

export async function signInAdmin(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null, error: new Error("Supabase is not configured. Add the Project URL and publishable key to the deployment environment.") };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || "").trim().toLowerCase(),
    password: String(password || ""),
  });
  if (error) return { session: null, error };
  const { profile, error: profileError } = await getAdminProfile(data.user?.id);
  if (profileError) {
    await supabase.auth.signOut();
    clearSession();
    return { session: null, error: profileError };
  }
  const session = {
    userId: profile.id,
    id: profile.id,
    role: profile.role,
    isSuperAdmin: profile.role === "super_admin",
    name: profile.full_name || data.user.email || "Administrator",
    email: data.user.email || "",
  };
  // Keep a non-authoritative display snapshot for existing dashboard components.
  // Route protection always verifies the live Supabase Auth session and profile.
  setSession(session);
  return { session, error: null };
}

export async function getCurrentAdminSession() {
  if (!isSupabaseConfigured || !supabase) return { session: null, error: new Error("Supabase is not configured.") };
  const { data, error } = await supabase.auth.getSession();
  if (error) return { session: null, error };
  if (!data.session?.user) {
    clearSession();
    return { session: null, error: null };
  }
  const { profile, error: profileError } = await getAdminProfile(data.session.user.id);
  if (profileError) {
    await supabase.auth.signOut();
    clearSession();
    return { session: null, error: profileError };
  }
  const session = {
    userId: profile.id,
    id: profile.id,
    role: profile.role,
    isSuperAdmin: profile.role === "super_admin",
    name: profile.full_name || data.session.user.email || "Administrator",
    email: data.session.user.email || "",
  };
  // Refresh the UI-only snapshot after reload; it is never used to authorize admin routes.
  setSession(session);
  return { session, error: null };
}

export async function signOutAdmin() {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
}
