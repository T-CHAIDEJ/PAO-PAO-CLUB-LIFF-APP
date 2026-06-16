const WHO_DATA = {
  boys: {
    wfa: [
      {month:0,sd2neg:2.5,median:3.5,sd2pos:4.6},
      {month:1,sd2neg:2.9,median:4.3,sd2pos:5.8},
      {month:2,sd2neg:3.5,median:5.2,sd2pos:6.9},
      {month:3,sd2neg:4.1,median:5.9,sd2pos:7.9},
      {month:4,sd2neg:4.5,median:6.4,sd2pos:8.6},
      {month:5,sd2neg:4.8,median:6.9,sd2pos:9.2},
      {month:6,sd2neg:5.1,median:7.3,sd2pos:9.7},
      {month:7,sd2neg:5.3,median:7.6,sd2pos:10.2},
      {month:8,sd2neg:5.5,median:7.9,sd2pos:10.5},
      {month:9,sd2neg:5.7,median:8.1,sd2pos:10.8},
      {month:10,sd2neg:5.9,median:8.3,sd2pos:11.1},
      {month:11,sd2neg:6.0,median:8.5,sd2pos:11.3},
      {month:12,sd2neg:6.2,median:8.7,sd2pos:11.6},
      {month:15,sd2neg:6.6,median:9.3,sd2pos:12.5},
      {month:18,sd2neg:7.0,median:9.8,sd2pos:13.2},
      {month:21,sd2neg:7.4,median:10.3,sd2pos:13.9},
      {month:24,sd2neg:7.7,median:10.8,sd2pos:14.5},
      {month:30,sd2neg:8.4,median:11.8,sd2pos:15.9},
      {month:36,sd2neg:9.0,median:12.7,sd2pos:17.1}
    ],
    lhfa: [
      {month:0,sd2neg:46.1,median:49.9,sd2pos:53.7},
      {month:1,sd2neg:50.8,median:54.7,sd2pos:58.6},
      {month:2,sd2neg:54.4,median:58.4,sd2pos:62.4},
      {month:3,sd2neg:57.3,median:61.4,sd2pos:65.5},
      {month:4,sd2neg:59.7,median:63.9,sd2pos:68.0},
      {month:5,sd2neg:61.7,median:65.9,sd2pos:70.1},
      {month:6,sd2neg:63.3,median:67.6,sd2pos:71.9},
      {month:7,sd2neg:64.8,median:69.2,sd2pos:73.5},
      {month:8,sd2neg:66.2,median:70.6,sd2pos:75.0},
      {month:9,sd2neg:67.5,median:72.0,sd2pos:76.5},
      {month:10,sd2neg:68.7,median:73.3,sd2pos:77.9},
      {month:11,sd2neg:69.9,median:74.5,sd2pos:79.2},
      {month:12,sd2neg:71.0,median:75.7,sd2pos:80.5},
      {month:15,sd2neg:73.8,median:79.0,sd2pos:84.1},
      {month:18,sd2neg:76.3,median:81.8,sd2pos:87.2},
      {month:21,sd2neg:78.7,median:84.4,sd2pos:90.0},
      {month:24,sd2neg:81.0,median:86.8,sd2pos:92.7},
      {month:30,sd2neg:85.1,median:91.4,sd2pos:97.7},
      {month:36,sd2neg:88.7,median:95.3,sd2pos:101.9}
    ],
    hcfa: [
      {month:0,sd2neg:31.9,median:34.5,sd2pos:37.0},
      {month:1,sd2neg:34.2,median:36.7,sd2pos:39.2},
      {month:2,sd2neg:35.8,median:38.3,sd2pos:40.8},
      {month:3,sd2neg:37.0,median:39.5,sd2pos:42.0},
      {month:4,sd2neg:38.0,median:40.5,sd2pos:43.0},
      {month:5,sd2neg:38.8,median:41.3,sd2pos:43.8},
      {month:6,sd2neg:39.5,median:42.0,sd2pos:44.5},
      {month:7,sd2neg:40.1,median:42.6,sd2pos:45.2},
      {month:8,sd2neg:40.6,median:43.2,sd2pos:45.7},
      {month:9,sd2neg:41.1,median:43.6,sd2pos:46.2},
      {month:10,sd2neg:41.5,median:44.0,sd2pos:46.6},
      {month:11,sd2neg:41.8,median:44.4,sd2pos:46.9},
      {month:12,sd2neg:42.1,median:44.7,sd2pos:47.2},
      {month:15,sd2neg:42.7,median:45.3,sd2pos:47.9},
      {month:18,sd2neg:43.2,median:45.8,sd2pos:48.4},
      {month:21,sd2neg:43.6,median:46.3,sd2pos:48.9},
      {month:24,sd2neg:43.9,median:46.6,sd2pos:49.3}
    ]
  },
  girls: {
    wfa: [
      {month:0,sd2neg:2.3,median:3.2,sd2pos:4.2},
      {month:1,sd2neg:2.7,median:3.9,sd2pos:5.1},
      {month:2,sd2neg:3.2,median:4.6,sd2pos:6.2},
      {month:3,sd2neg:3.7,median:5.3,sd2pos:7.2},
      {month:4,sd2neg:4.1,median:5.9,sd2pos:7.9},
      {month:5,sd2neg:4.4,median:6.4,sd2pos:8.5},
      {month:6,sd2neg:4.7,median:6.8,sd2pos:9.0},
      {month:7,sd2neg:4.9,median:7.1,sd2pos:9.5},
      {month:8,sd2neg:5.1,median:7.3,sd2pos:9.8},
      {month:9,sd2neg:5.3,median:7.6,sd2pos:10.2},
      {month:10,sd2neg:5.4,median:7.8,sd2pos:10.5},
      {month:11,sd2neg:5.6,median:8.0,sd2pos:10.7},
      {month:12,sd2neg:5.7,median:8.2,sd2pos:11.0},
      {month:15,sd2neg:6.1,median:8.8,sd2pos:11.9},
      {month:18,sd2neg:6.5,median:9.4,sd2pos:12.7},
      {month:21,sd2neg:6.9,median:9.9,sd2pos:13.5},
      {month:24,sd2neg:7.2,median:10.4,sd2pos:14.2},
      {month:30,sd2neg:7.9,median:11.4,sd2pos:15.6},
      {month:36,sd2neg:8.5,median:12.3,sd2pos:16.8}
    ],
    lhfa: [
      {month:0,sd2neg:45.4,median:49.1,sd2pos:52.9},
      {month:1,sd2neg:49.8,median:53.7,sd2pos:57.6},
      {month:2,sd2neg:53.0,median:57.1,sd2pos:61.1},
      {month:3,sd2neg:55.6,median:59.8,sd2pos:64.0},
      {month:4,sd2neg:57.8,median:62.1,sd2pos:66.4},
      {month:5,sd2neg:59.6,median:64.0,sd2pos:68.5},
      {month:6,sd2neg:61.2,median:65.7,sd2pos:70.3},
      {month:7,sd2neg:62.7,median:67.3,sd2pos:72.0},
      {month:8,sd2neg:64.0,median:68.7,sd2pos:73.5},
      {month:9,sd2neg:65.3,median:70.1,sd2pos:75.0},
      {month:10,sd2neg:66.5,median:71.5,sd2pos:76.4},
      {month:11,sd2neg:67.7,median:72.8,sd2pos:77.8},
      {month:12,sd2neg:68.9,median:74.0,sd2pos:79.2},
      {month:15,sd2neg:71.7,median:77.2,sd2pos:82.7},
      {month:18,sd2neg:74.2,median:80.0,sd2pos:85.8},
      {month:21,sd2neg:76.7,median:82.7,sd2pos:88.7},
      {month:24,sd2neg:78.9,median:85.2,sd2pos:91.4},
      {month:30,sd2neg:83.2,median:89.8,sd2pos:96.4},
      {month:36,sd2neg:87.0,median:93.9,sd2pos:100.8}
    ],
    hcfa: [
      {month:0,sd2neg:31.5,median:33.9,sd2pos:36.2},
      {month:1,sd2neg:33.7,median:36.1,sd2pos:38.5},
      {month:2,sd2neg:35.1,median:37.6,sd2pos:40.0},
      {month:3,sd2neg:36.2,median:38.6,sd2pos:41.1},
      {month:4,sd2neg:37.0,median:39.5,sd2pos:42.0},
      {month:5,sd2neg:37.7,median:40.3,sd2pos:42.8},
      {month:6,sd2neg:38.3,median:40.9,sd2pos:43.4},
      {month:7,sd2neg:38.9,median:41.5,sd2pos:44.0},
      {month:8,sd2neg:39.3,median:41.9,sd2pos:44.5},
      {month:9,sd2neg:39.7,median:42.4,sd2pos:44.9},
      {month:10,sd2neg:40.1,median:42.7,sd2pos:45.3},
      {month:11,sd2neg:40.4,median:43.0,sd2pos:45.7},
      {month:12,sd2neg:40.7,median:43.3,sd2pos:46.0},
      {month:15,sd2neg:41.2,median:43.9,sd2pos:46.6},
      {month:18,sd2neg:41.6,median:44.4,sd2pos:47.1},
      {month:21,sd2neg:42.0,median:44.8,sd2pos:47.5},
      {month:24,sd2neg:42.3,median:45.1,sd2pos:47.8}
    ]
  }
};

export function getWHOData(gender, indicator) {
  const g = gender === 'male' ? 'boys' : 'girls';
  return WHO_DATA[g][indicator] || [];
}

export function getWHOValueAtMonth(gender, indicator, month) {
  const data = getWHOData(gender, indicator);
  const exact = data.find(d => d.month === month);
  if (exact) return exact;
  const lower = [...data].reverse().find(d => d.month <= month);
  const upper = data.find(d => d.month >= month);
  if (!lower) return upper;
  if (!upper) return lower;
  if (lower.month === upper.month) return lower;
  const ratio = (month - lower.month) / (upper.month - lower.month);
  return {
    month,
    sd2neg: +(lower.sd2neg + ratio * (upper.sd2neg - lower.sd2neg)).toFixed(2),
    median: +(lower.median + ratio * (upper.median - lower.median)).toFixed(2),
    sd2pos: +(lower.sd2pos + ratio * (upper.sd2pos - lower.sd2pos)).toFixed(2)
  };
}

export function getStatus(value, whoValue) {
  if (!whoValue || value == null) return 'unknown';
  if (value < whoValue.sd2neg) return 'low';
  if (value > whoValue.sd2pos) return 'high';
  return 'normal';
}

export function getStatusLabel(status) {
  switch(status) {
    case 'low': return 'ต่ำกว่าเกณฑ์';
    case 'high': return 'เกินเกณฑ์';
    case 'normal': return 'ตามเกณฑ์';
    default: return 'ไม่มีข้อมูล';
  }
}

export default WHO_DATA;
