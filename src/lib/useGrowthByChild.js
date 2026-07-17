import { useState, useEffect } from 'react';
import { supabase } from './supabase.js';

// Fetches the latest growth record for every child at once (keyed by
// child_id) so any child-aware screen can show each child's own
// weight/height without a per-switch refetch. Called once at the top
// (App.jsx) and passed down — previously Home and Tracker each ran their
// own duplicate copy of this same fetch.
export function useGrowthByChild(childrenList) {
  const [growthByChild, setGrowthByChild] = useState({});
  useEffect(() => {
    const bornIds = (childrenList || []).filter(c => !c.is_pregnant).map(c => c.child_id);
    if (bornIds.length === 0) { setGrowthByChild({}); return; }
    let alive = true;
    supabase
      .from('004_growth')
      .select('child_id, weight_kg, height_cm, recorded_date')
      .in('child_id', bornIds)
      .order('recorded_date', { ascending: false })
      .then(({ data }) => {
        if (!alive) return;
        const map = {};
        (data || []).forEach((r) => { if (!map[r.child_id]) map[r.child_id] = r; });
        setGrowthByChild(map);
      });
    return () => { alive = false; };
  }, [childrenList]);
  return growthByChild;
}
