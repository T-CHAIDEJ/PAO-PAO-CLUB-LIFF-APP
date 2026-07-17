import { supabase } from './supabase.js';

// Used until 005_diaper loads, and as a safety net if the table is ever
// empty or unreachable — recommendSize() must never return nothing.
const FALLBACK_SIZES = [
  { code: 'NB',  min: 0,  max: 5,  ageMin: null, ageMax: 1,    description: 'แรกเกิด' },
  { code: 'S',   min: 4,  max: 8,  ageMin: 0,    ageMax: 4,    description: 'ตัวเล็กแรกเกิด' },
  { code: 'M',   min: 7,  max: 12, ageMin: 3,    ageMax: 9,    description: 'วัยคืบคลาน' },
  { code: 'L',   min: 9,  max: 14, ageMin: 8,    ageMax: 18,   description: 'วัยหัดเดิน' },
  { code: 'XL',  min: 12, max: 17, ageMin: 15,   ageMax: 30,   description: 'วัยซน' },
  { code: 'XXL', min: 15, max: 25, ageMin: 24,   ageMax: null, description: 'เด็กโต' },
];

let sizesCache = null;

// Fetch once at app boot (see App.jsx). Non-fatal — falls back silently.
export async function loadDiaperSizes() {
  try {
    const { data, error } = await supabase
      .from('005_diaper')
      .select('size_name, weight_min, weight_max, age_min, age_max, description')
      .eq('is_active', true)
      .order('weight_min', { ascending: true });
    if (error) throw error;
    if (data && data.length) {
      sizesCache = data.map(d => ({
        code: d.size_name, min: d.weight_min, max: d.weight_max,
        ageMin: d.age_min, ageMax: d.age_max, description: d.description,
      }));
    }
  } catch (e) {
    console.warn('[diaperSize] load failed, using fallback:', e?.message);
  }
  return getSizes();
}

export function getSizes() {
  return sizesCache && sizesCache.length ? sizesCache : FALLBACK_SIZES;
}

export function recommendSize(kg) {
  const sizes = getSizes();
  return sizes.find(s => kg >= s.min && kg <= s.max) || sizes[sizes.length - 1];
}

// Sizes deliberately overlap by a couple kg with the next one up (real
// diaper fit varies by body shape, not just weight) — recommendSize()
// always resolves that overlap by picking the smaller/current size. This
// tells the UI when a weight also already qualifies for the next size up,
// so it can show fit-check guidance right at the recommendation instead of
// silently locking them into the smaller size.
export function isNearSizeBoundary(kg) {
  if (kg == null) return false;
  const sizes = getSizes();
  const idx = sizes.findIndex(s => kg >= s.min && kg <= s.max);
  if (idx === -1) return false;
  const next = sizes[idx + 1];
  return !!(next && kg >= next.min && kg <= next.max);
}
