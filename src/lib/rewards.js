import { supabase } from './supabase.js';

// Used until 007_rewards loads, or as a fallback if it's empty/unreachable.
// Kept in one place so Home (progress-to-next-reward) and Rewards (catalog)
// never drift out of sync with each other. redeemable:false marks these as
// display-only — their id isn't a real reward_id, so redeemReward() would
// fail trying to write it as a FK. Real DB rows are always redeemable.
export const REWARDS_FALLBACK = [
  { id: 'sampling',   name: 'Sampling PaoPao (เลือกไซส์ NB-2XL)',      pts: 100, stock: null, redeemable: false },
  { id: 'mini-pack',  name: 'ผ้าอ้อมเปาเปา ไซซ์มินิ (NB-2XL) 1 ชิ้น', pts: 200, stock: null, redeemable: false },
  { id: 'toy-bin',    name: 'ถังเก็บของเล่นลูกน้อย 1 ชิ้น (คละลาย)',  pts: 300, stock: null, redeemable: false },
];

export async function fetchRewardsCatalog() {
  try {
    const { data, error } = await supabase
      .from('007_rewards')
      .select('id, reward_id, name, points_required, stock')
      .eq('is_active', true)
      .order('points_required', { ascending: true });
    if (error) throw error;
    if (data && data.length) {
      // reward_id (not id) is the business key 016_redemptions.reward_id
      // references — same PK-vs-business-key split as children.child_id.
      return data.map(r => ({ id: r.id, rewardId: r.reward_id, name: r.name, pts: r.points_required, stock: r.stock, redeemable: true }));
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
