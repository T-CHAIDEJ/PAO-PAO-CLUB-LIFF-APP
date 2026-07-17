// Shared text-input styling used by every child/onboarding form — previously
// copy-pasted in OnboardingScreen, ChildModals, and BabyTrackerScreen.
export const inputStyle = {
  width: '100%', minWidth: 0, maxWidth: '100%', height: 46, padding: '0 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)', font: 'var(--type-body)', color: 'var(--text-body)',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};

// Safari on iOS can render <input type="date"> with a native calendar
// control that ignores width:100% and bleeds past its own box — turning
// off native appearance hands rendering fully to our CSS instead.
export const dateInputStyle = { ...inputStyle, WebkitAppearance: 'none', appearance: 'none' };

// HTML date inputs take max/min as plain YYYY-MM-DD strings.
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
