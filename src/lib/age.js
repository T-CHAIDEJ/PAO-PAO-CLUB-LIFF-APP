// Shared "X ปี Y เดือน" age label used by every screen that shows a
// child's age (Home, Diaper, Tracker, Profile) — previously copy-pasted
// in 4 places with identical logic.
export function calcAge(birthdate) {
  if (!birthdate) return null;
  const ms = Date.now() - new Date(birthdate).getTime();
  const totalMonths = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.4375));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (totalMonths < 1) return 'แรกเกิด';
  if (years === 0) return `${months} เดือน`;
  return months === 0 ? `${years} ปี` : `${years} ปี ${months} เดือน`;
}
