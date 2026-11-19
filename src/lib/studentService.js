

import { supabase, isSupabaseConfigured } from "./supabase";

const STUDENTS_TABLE = "students";
const PHOTO_BUCKET = "student-photos";

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Check your Vercel environment variables.");
  }
}

function normalizeClassName(value = "") {
  const v = String(value || "").trim().toLowerCase();

  if (v === "nursery" || v === "nursary") return "Nursery";
  if (v === "lkg") return "LKG";
  if (v === "ukg") return "UKG";

  const match = v.match(/(?:class\s*)?(\d+)(?:th|st|nd|rd)?/);
  return match ? `Class ${Number(match[1])}` : String(value || "").trim();
}

function prepareStudentData(student) {
  const data = { ...student };
  delete data.id;
  delete data.rollNo;
  delete data.archived;
  delete data.photoUrl;

  return data;
}

async function uploadStudentPhoto(studentId, photo) {
  if (!photo || !photo.startsWith("data:image/")) return null;

  const response = await fetch(photo);
  const blob = await response.blob();

  const extension = blob.type === "image/png"
    ? "png"
    : blob.type === "image/webp"
      ? "webp"
      : "jpg";

  const path = `${studentId}/profile.${extension}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: blob.type,
    });

  if (error) throw error;

  return path;
}

async function addPhotoUrl(student) {
  const photoPath = student.data?.photoPath;

  if (!photoPath) return student;

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(photoPath, 60 * 60);

  if (error) throw error;

  return {
    ...student,
    photo: data.signedUrl,
  };
}

function mapStudent(row) {
  const data = row.data || {};

  return {
    ...data,
    id: row.id,
    rollNo: row.roll_no,
    name: row.name,
    className: normalizeClassName(data.className || row.class_name),
    archived: row.archived,
  };
}

async function savePhotoIfNeeded(studentId, student) {
  const data = prepareStudentData(student);

  if (student.photo?.startsWith("data:image/")) {
    const photoPath = await uploadStudentPhoto(studentId, student.photo);
    if (photoPath) data.photoPath = photoPath;
  }

  delete data.photo;

  return data;
}

export async function getStudents({ includeArchived = true } = {}) {
  ensureSupabase();

  let query = supabase
    .from(STUDENTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.eq("archived", false);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Promise.all(
    (data || []).map(async (row) => {
      const student = mapStudent(row);
      return addPhotoUrl(student);
    })
  );
}

export async function getStudentById(id) {
  ensureSupabase();

  const { data, error } = await supabase
    .from(STUDENTS_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return addPhotoUrl(mapStudent(data));
}

export async function addStudent(student) {
  ensureSupabase();

  const { data: existing, error: listError } = await supabase
    .from(STUDENTS_TABLE)
    .select("roll_no");

  if (listError) throw listError;

  const numbers = (existing || []).map((item) =>
    Number(String(item.roll_no || "").replace(/\D/g, "")) || 0
  );

  const rollNo = `TMS-${String(Math.max(0, ...numbers) + 1).padStart(3, "0")}`;
  const id = `STU-${Date.now()}`;
  const monthlyFee = Number(student.monthlyFee || 0);
  const feeStartMonth = student.feeStartMonth || new Date().toISOString().slice(0, 7);
  const className = normalizeClassName(student.className);

  const newStudent = {
    ...student,
    id,
    rollNo,
    className,
    monthlyFee,
    totalFees: monthlyFee * 12,
    paidFees: Number(student.paidFees || 0),
    lastPaymentDate: student.lastPaymentDate || "",
    feeStartMonth,
    feeHistory: [
      {
        className,
        monthlyFee,
        effectiveFrom: feeStartMonth,
      },
    ],
    archived: false,
  };

  const data = await savePhotoIfNeeded(id, newStudent);

  const { data: saved, error } = await supabase
    .from(STUDENTS_TABLE)
    .insert({
      id,
      roll_no: rollNo,
      name: newStudent.name || "",
      class_name: className,
      archived: false,
      data,
    })
    .select("*")
    .single();

  if (error) throw error;

  return addPhotoUrl(mapStudent(saved));
}

export async function updateStudent(id, patch) {
  ensureSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from(STUDENTS_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const current = mapStudent(existing);
  const { feeEffectiveFrom, ...safePatch } = patch || {};

  const next = {
    ...current,
    ...safePatch,
    className: normalizeClassName(safePatch.className || current.className),
  };

  const classChanged = next.className !== current.className;
  const feeChanged =
    Number(next.monthlyFee || 0) !== Number(current.monthlyFee || 0);

  if (classChanged || feeChanged) {
    const effectiveFrom = String(
      feeEffectiveFrom ||
      safePatch.feeStartMonth ||
      new Date().toISOString().slice(0, 7)
    ).slice(0, 7);

    const history = Array.isArray(current.feeHistory)
      ? current.feeHistory.slice()
      : [];

    const withoutSame = history.filter(
      (item) => String(item.effectiveFrom || "").slice(0, 7) !== effectiveFrom
    );

    next.feeHistory = [
      ...withoutSame,
      {
        className: next.className,
        monthlyFee: Number(next.monthlyFee) || 0,
        effectiveFrom,
      },
    ].sort((a, b) =>
      String(a.effectiveFrom).localeCompare(String(b.effectiveFrom))
    );

    next.feeStartMonth = effectiveFrom;
    next.totalFees = Number(next.monthlyFee || 0) * 12;
  }

  const data = await savePhotoIfNeeded(id, next);

  const { data: saved, error } = await supabase
    .from(STUDENTS_TABLE)
    .update({
      name: next.name || "",
      class_name: next.className || "",
      data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return addPhotoUrl(mapStudent(saved));
}

export async function archiveStudent(id) {
  ensureSupabase();

  const { data, error } = await supabase
    .from(STUDENTS_TABLE)
    .update({
      archived: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return mapStudent(data);
}

export async function restoreStudent(id) {
  ensureSupabase();

  const { data, error } = await supabase
    .from(STUDENTS_TABLE)
    .update({
      archived: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return mapStudent(data);
}
