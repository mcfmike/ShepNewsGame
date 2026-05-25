const PRIZES = [
  {
    name: "A Genuine Bendy Bully Toy!",
    description: "Worth approximately £2.99. Bully says 'Super, smashing, great!' when squeezed. Batteries not included — or needed.",
    value: "£2.99",
    tier: 0
  },
  {
    name: "Six Months of Daily Mirrors!",
    description: "That's 180 newspapers, weighing approximately 90 kilograms. You'll need a strong trolley — and a bigger letterbox.",
    value: "£54",
    tier: 1
  },
  {
    name: "One Thousand Ten-Pence Mix Bags!",
    description: "10,000 individual penny sweets. Your dentist has been informed and sends his warmest congratulations.",
    value: "£100",
    tier: 1
  },
  {
    name: "The Complete 1989 TV Times Collection!",
    description: "All 52 issues in pristine condition. Ideal for lining the budgie's cage, or revisiting what Anneka Rice got up to.",
    value: "Priceless (to someone)",
    tier: 2
  },
  {
    name: "A Working Holiday in Barrowford!",
    description: "Seven nights above the shop. Chris does a lovely cooked breakfast. Barrie does the papers. You're on the till.",
    value: "Negotiable",
    tier: 2
  },
  {
    name: "A Speedboat!",
    description: "Magnificent. Absolutely magnificent. It's currently moored in Burnley Canal. In February. You'll need a coat.",
    value: "£12,000",
    tier: 3
  },
  {
    name: "A Vintage Embassy Cigarettes Collection!",
    description: "Thirty cartons from 1987. They may be slightly stale. On the other hand, very retro. Very East Lancashire.",
    value: "Cannot be disclosed",
    tier: 3
  }
];

function selectPrize(score) {
  let tier;
  if (score < 50) tier = 0;
  else if (score < 150) tier = 1;
  else if (score < 250) tier = 2;
  else tier = 3;

  const tieredPrizes = PRIZES.filter(p => p.tier === tier);
  return tieredPrizes[Math.floor(Math.random() * tieredPrizes.length)];
}
