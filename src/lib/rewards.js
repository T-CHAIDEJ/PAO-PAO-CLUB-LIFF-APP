import { supabase } from './supabase.js';

// An empty/unreachable 007_rewards genuinely means "nothing to show yet" —
// no placeholder catalog. A fake-but-unredeemable list here previously
// made an empty table look like a real (if broken) catalog, which is more
// confusing than an honest empty state.
export async function fetchRewardsCatalog() {
  try {
    const { data, error } = await supabase
      .from('007_rewards')
      .select('id, reward_id, name, points_required, stock')
      .eq('is_active', true)
      .order('points_required', { ascending: true });
    if (error) throw error;
    // reward_id (not id) is the business key 016_redemptions.reward_id
    // references — same PK-vs-business-key split as children.child_id.
    return (data ?? []).map(r => ({ id: r.id, rewardId: r.reward_id, name: r.name, pts: r.points_required, stock: r.stock, redeemable: true }));
  } catch (e) {
    console.warn('[rewards] catalog fetch failed:', e?.message);
    return [];
  }
}

// The cheapest reward the user can't afford yet (skipping out-of-stock
// ones), or null if every reward is already reachable.
export function nextUnlockedReward(catalog, points) {
  return catalog.find(r => points < r.pts && !(r.stock != null && r.stock <= 0)) ?? null;
}
