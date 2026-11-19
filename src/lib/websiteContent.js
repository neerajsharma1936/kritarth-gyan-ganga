import { supabase, isSupabaseConfigured } from "./supabase";
import { getWebsiteContent } from "../utils/storage";

const BUCKET = "website-assets";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Check the Vercel environment variables.");
  }
  return supabase;
}

function safeSegment(value) {
  return String(value || "image").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 50) || "image";
}

async function uploadBlob(blob, field) {
  const client = requireSupabase();
  const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${safeSegment(field)}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Supabase did not return a public image URL.");
  return data.publicUrl;
}

export async function uploadWebsiteImage(file, field) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Please choose a valid image file.");
  }
  if (file.size > 12 * 1024 * 1024) throw new Error("Choose an image smaller than 12 MB.");
  return uploadBlob(file, field);
}

async function publishDataUrl(value, field) {
  if (typeof value !== "string" || !value.startsWith("data:")) return value || "";
  const response = await fetch(value);
  const blob = await response.blob();
  return uploadBlob(blob, field);
}

export async function publishWebsiteContent(content) {
  const client = requireSupabase();
  const next = { ...content };
  next.heroImage = await publishDataUrl(next.heroImage, "hero");
  next.approachImage = await publishDataUrl(next.approachImage, "approach");
  if (Array.isArray(next.stories)) {
    next.stories = await Promise.all(next.stories.map(async (story, index) => ({
      ...story,
      photo: await publishDataUrl(story.photo, `story-${story.id || index + 1}`),
    })));
  }
  const { error } = await client.from("website_content").upsert({
    id: 1,
    data: next,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) throw error;
  try { localStorage.setItem("tms_website_content", JSON.stringify(next)); } catch {}
  return next;
}

export async function fetchPublishedWebsiteContent() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("website_content")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data?.data && typeof data.data === "object"
    ? { ...getWebsiteContent(), ...data.data }
    : getWebsiteContent();
}
