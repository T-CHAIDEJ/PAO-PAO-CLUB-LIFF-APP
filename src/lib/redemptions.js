// Redeeming a reward touches 3 tables with no server-side transaction
// available to us (anon key, no RPC) — so this does its best in order:
// 1) claim stock first (if the reward tracks it) so we never deduct points
//    for something that just ran out, 2) deduct points via a 006_points
//    ledger row, 3) log the redemption itself. Not perfectly atomic, but
//    ordered to fail safe (worst case: stock claimed but points/log step
//    fails — logged to console, reward creator should reconcile manually).
export async function redeemReward(supabase, { lineUid, reward, currentBalance }) {
  if (reward.stock != null) {
    const { data: claimed, error: stockErr } = await supabase
      .from('007_rewards')
      .update({ stock: reward.stock - 1 })
      .eq('id', reward.id)
      .gt('stock', 0)
      .select('id');
    if (stockErr) throw stockErr;
    if (!claimed || claimed.length === 0) {
      const err = new Error('OUT_OF_STOCK');
      err.code = 'OUT_OF_STOCK';
      throw err;
    }
  }

  const newBalance = currentBalance - reward.pts;

  const { error: pointsErr } = await supabase.from('006_points').insert({
    line_uid: lineUid, source: 'redeem', points: -reward.pts, balance: newBalance,
  });
  if (pointsErr) throw pointsErr;

  const { error: redemptionErr } = await supabase.from('016_redemptions').insert({
    line_uid: lineUid, reward_id: reward.rewardId, points_used: reward.pts, status: 'pending',
  });
  if (redemptionErr) throw redemptionErr;

  return { newBalance };
}
