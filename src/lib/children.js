import { computeStage, PREGNANCY_STAGE } from './stage.js';
import { recommendSize } from './diaperSize.js';
import { uploadChildAvatar } from './avatar.js';

// Everything that touches 003_children beyond simple reads lives here so
// Home's "+ เพิ่มลูก" / "แก้ไข" / "ลูกเกิดแล้ว" flows and onboarding's
// segment B form all share one source of truth instead of drifting.

export async function insertPregnantChild(supabase, lineUid, { name, dueDate, photoFile } = {}) {
  const { data, error } = await supabase.from('003_children').insert({
    line_uid: lineUid, name: name || null, is_pregnant: true, due_date: dueDate || null, stage: PREGNANCY_STAGE,
  }).select().single();
  if (error) throw error;

  if (photoFile) {
    try {
      data.avatar_url = await uploadChildAvatar(supabase, data.child_id, photoFile);
    } catch (e) { console.warn('[children] avatar upload failed:', e?.message); }
  }
  return data;
}

export async function insertBornChild(supabase, lineUid, { name, gender, birthdate, weightKg, heightCm, photoFile }) {
  const { data: child, error } = await supabase.from('003_children').insert({
    line_uid: lineUid, name, gender, birth_date: birthdate,
    birth_weight: weightKg, birth_height: heightCm,
    is_pregnant: false, stage: computeStage(birthdate),
  }).select().single();
  if (error) throw error;

  if (photoFile) {
    try {
      child.avatar_url = await uploadChildAvatar(supabase, child.child_id, photoFile);
    } catch (e) { console.warn('[children] avatar upload failed:', e?.message); }
  }

  if (weightKg && heightCm) {
    await supabase.from('004_growth').insert({
      child_id: child.child_id, recorded_date: birthdate,
      weight_kg: weightKg, height_cm: heightCm,
      diaper_size: recommendSize(weightKg).code,
    });
  }
  return child;
}

// Converts an existing pregnant child row into a born one in place —
// used when that specific pregnancy's baby arrives (not a new insert).
export async function graduatePregnantChild(supabase, child, { name, gender, birthdate, weightKg, heightCm, photoFile }) {
  const patch = {
    name, gender, birth_date: birthdate,
    birth_weight: weightKg, birth_height: heightCm,
    is_pregnant: false, due_date: null,
    stage: computeStage(birthdate),
  };
  if (photoFile) {
    patch.avatar_url = await uploadChildAvatar(supabase, child.child_id, photoFile);
  }
  const { error } = await supabase.from('003_children').update(patch).eq('child_id', child.child_id);
  if (error) throw error;

  if (weightKg && heightCm) {
    await supabase.from('004_growth').insert({
      child_id: child.child_id, recorded_date: birthdate,
      weight_kg: weightKg, height_cm: heightCm,
      diaper_size: recommendSize(weightKg).code,
    });
  }
  return patch;
}

// Edits an already-born or already-pregnant child's own info (name,
// gender, dates, photo) — not a stage transition.
export async function updateChildInfo(supabase, child, patch, photoFile) {
  const finalPatch = { ...patch };
  if (!child.is_pregnant && patch.birth_date) finalPatch.stage = computeStage(patch.birth_date);
  if (photoFile) {
    finalPatch.avatar_url = await uploadChildAvatar(supabase, child.child_id, photoFile);
  }
  const { error } = await supabase.from('003_children').update(finalPatch).eq('child_id', child.child_id);
  if (error) throw error;
  return finalPatch;
}
