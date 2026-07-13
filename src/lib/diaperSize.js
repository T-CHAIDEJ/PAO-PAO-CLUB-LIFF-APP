// PAO PAO diaper size ranges. Dev B added a `005_diaper` table meant to
// replace this hardcoded list (Screen ↔ DB map marks it as an unconnected
// gap), but it's empty as of this writing — switching to it now would show
// no size recommendation at all. Keeping this hardcoded source until that
// table actually has rows.
export const PP_SIZES = [
  { code: 'NB',  min: 0,  max: 5  },
  { code: 'S',   min: 4,  max: 8  },
  { code: 'M',   min: 7,  max: 12 },
  { code: 'L',   min: 9,  max: 14 },
  { code: 'XL',  min: 12, max: 17 },
  { code: 'XXL', min: 15, max: 25 },
];

export function recommendSize(kg) {
  return PP_SIZES.find(s => kg >= s.min && kg <= s.max) || PP_SIZES[PP_SIZES.length - 1];
}
