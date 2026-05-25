// Shelf item definitions with bounding boxes (canvas coordinates 800x600)
// Shelf rows: y=70-140 (row1), y=158-228 (row2), y=248-316 (row3)
const SHELF_ITEMS = {
  daily_mirror: {
    id: 'daily_mirror', label: 'Daily Mirror',
    x: 22, y: 72, w: 168, h: 68,
    color: '#CC0000', textColor: '#ffffff',
    row: 1, basePoints: 10
  },
  the_sun: {
    id: 'the_sun', label: 'The Sun',
    x: 208, y: 72, w: 168, h: 68,
    color: '#FF4400', textColor: '#ffffff',
    row: 1, basePoints: 10
  },
  daily_express: {
    id: 'daily_express', label: 'Daily Express',
    x: 394, y: 72, w: 168, h: 68,
    color: '#000066', textColor: '#ffffff',
    row: 1, basePoints: 10
  },
  sunday_times: {
    id: 'sunday_times', label: 'Sunday Times',
    x: 580, y: 72, w: 200, h: 68,
    color: '#222222', textColor: '#ffffff',
    row: 1, basePoints: 10
  },
  benson: {
    id: 'benson', label: "Benson & Hedges",
    x: 22, y: 160, w: 168, h: 68,
    color: '#D4AA00', textColor: '#1a1a1a',
    row: 2, basePoints: 15
  },
  embassy: {
    id: 'embassy', label: 'Embassy No.1',
    x: 208, y: 160, w: 168, h: 68,
    color: '#006633', textColor: '#ffffff',
    row: 2, basePoints: 15
  },
  tv_times: {
    id: 'tv_times', label: 'TV Times',
    x: 394, y: 160, w: 168, h: 68,
    color: '#CC4400', textColor: '#ffffff',
    row: 2, basePoints: 15
  },
  radio_times: {
    id: 'radio_times', label: 'Radio Times',
    x: 580, y: 160, w: 200, h: 68,
    color: '#005500', textColor: '#ffffff',
    row: 2, basePoints: 15
  },
  mars: {
    id: 'mars', label: 'Mars Bar',
    x: 30, y: 250, w: 220, h: 66,
    color: '#8B0000', textColor: '#ffffff',
    row: 3, basePoints: 20
  },
  kitkat: {
    id: 'kitkat', label: 'Kit Kat',
    x: 290, y: 250, w: 220, h: 66,
    color: '#CC0000', textColor: '#ffffff',
    row: 3, basePoints: 20
  },
  mix_bag: {
    id: 'mix_bag', label: '10p Mix Bag',
    x: 550, y: 250, w: 222, h: 66,
    color: '#FF69B4', textColor: '#ffffff',
    row: 3, basePoints: 20
  }
};

// 5 rounds of customer requests
const ROUNDS = [
  {
    customerId: 'wilf',
    items: ['daily_mirror', 'benson'],
    line: "Could I have me Daily Mirror and twenty Bensons, love? Me legs aren't what they were!"
  },
  {
    customerId: 'simon',
    items: ['the_sun', 'mars'],
    line: "Sun and a Mars Bar please, mate. Big match today — can't miss it!"
  },
  {
    customerId: 'jordan',
    items: ['tv_times', 'kitkat'],
    line: "TV Times and a Kit Kat please! Dead excited about the new Doctor Who episode!"
  },
  {
    customerId: 'betty',
    items: ['radio_times', 'daily_express'],
    line: "Radio Times and the Express please, pet. Ooh, is it going to snow again d'you think?"
  },
  {
    customerId: 'derek',
    items: ['embassy', 'mix_bag'],
    line: "Twenty Embassy and one of them mix bags, if you'd be so kind. Cheers love."
  }
];

// Projectile types with wobble and scoring config
const PROJECTILES = {
  newspaper: {
    id: 'newspaper',
    label: 'Roll Newspaper',
    multiplier: 1,
    wobbleMag: 8,
    wobbleFreqX: 0.0018,
    wobbleFreqY: 0.0023,
    color: '#D4D0C0',
    description: '1× points — Steady aim'
  },
  '1p': {
    id: '1p',
    label: 'Throw 1p',
    multiplier: 2,
    wobbleMag: 22,
    wobbleFreqX: 0.003,
    wobbleFreqY: 0.0039,
    color: '#B87333',
    description: '2× points — Tricky!'
  },
  '2p': {
    id: '2p',
    label: 'Throw 2p!',
    multiplier: 3,
    wobbleMag: 45,
    wobbleFreqX: 0.0051,
    wobbleFreqY: 0.0063,
    color: '#B87333',
    description: '3× points — Expert only!'
  }
};
