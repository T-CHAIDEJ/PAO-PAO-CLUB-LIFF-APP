import { supabase } from './supabase.js';

// Used until 007_rewards loads, or as a fallback if it's empty/unreachable.
// Kept in one place so Home (progress-to-next-reward) and Rewards (catalog)
// never drift out of sync with each other.
export const REWARDS_FALLBACK = [
  { id: 'sampling',   name: 'Sampling PaoPao (เลือกไซส์ NB-2XL)',      pts: 100, stock: null },
  { id: 'mini-pack',  name: 'ผ้าอ้อมเปาเปา ไซซ์มินิ (NB-2XL) 1 ชิ้น', pts: 200, stock: null },
  { id: 'toy-bin',    name: 'ถังเก็บของเล่นลูกน้อย 1 ชิ้น (คละลาย)',  pts: 300, stock: null },
];

export async function fetchRewardsCatalog() {
  try {
    const { data, error } = await supabase
      .from('007_rewards')
      .select('id, name, points_required, stock')
      .eq('is_active', true)
      .order('points_required', { ascending: true });
    if (error) throw error;
    if (data && data.length) {
      return data.map(r => ({ id: r.id, name: r.name, pts: r.points_required, stock: r.stock }));
    }
  } catch (e) {
    console.warn('[rewards] catalog fetch failed:', e?.message);
  }
  return REWARDS_FALLBACK;
}

// The cheapest reward the user can't afford yet (skipping out-of-stock
// ones), or null if every reward is already reachable.
export function nextUnlockedReward(catalog, points) {
  return catalog.find(r => points < r.pts && !(r.stock != null && r.stock <= 0)) ?? null;
}
