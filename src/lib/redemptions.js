import { logAction, logError } from './userLogs.js';

// Redeeming a reward touches 3 tables with no server-side transaction
// available to us (anon key, no RPC) — so this does its best in order:
// 1) claim stock first (if the reward tracks it) so we never deduct points
//    for something that just ran out, 2) deduct points via a 006_points
//    ledger row, 3) log the redemption itself. Not perfectly atomic, but
//    ordered to fail safe (worst case: stock claimed but points/log step
//    fails). Each failure point logs which step it was — a plain "redeem
//    failed" catch-all wouldn't tell us whether stock/points already moved
//    before the failure, which is exactly the state that needs reconciling.
export async function redeemReward(supabase, { lineUid, reward, currentBalance }) {
  if (reward.stock != null) {
    const { data: claimed, error: stockErr } = await supabase
      .from('007_rewards')
      .update({ stock: reward.stock - 1 })
      .eq('id', reward.id)
      .gt('stock', 0)
      .select('id');
    if (stockErr) { logError(lineUid, 'redeem_stock_claim', stockErr); throw stockErr; }
    if (!claimed || claimed.length === 0) {
      const err = new Error('OUT_OF_STOCK');
      err.code = 'OUT_OF_STOCK';
      throw err; // expected user-facing case (reward sold out), not a system error — no log
    }
  }

  const newBalance = currentBalance - reward.pts;

  const { error: pointsErr } = await supabase.from('006_points').insert({
    line_uid: lineUid, source: 'redeem', points: -reward.pts, balance: newBalance,
  });
  if (pointsErr) {
    logError(lineUid, reward.stock != null ? 'redeem_points_deduct_after_stock_claimed' : 'redeem_points_deduct', pointsErr);
    throw pointsErr;
  }

  const { error: redemptionErr } = await supabase.from('016_redemptions').insert({
    line_uid: lineUid, reward_id: reward.rewardId, points_used: reward.pts, status: 'pending',
  });
  if (redemptionErr) {
    logError(lineUid, 'redeem_log_insert_after_points_deducted', redemptionErr);
    throw redemptionErr;
  }

  logAction(lineUid, 'redeem_reward', { oldValue: reward.rewardId, newValue: `-${reward.pts}pts -> ${newBalance}` });
  return { newBalance };
}
