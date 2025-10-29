// Simple daily-rotating innovations dataset
// Selects an item by (UTC) day index to provide a new one each day

export const innovations = [
  {
    id: 'seaweed-packaging',
    title: 'Edible Seaweed-Based Packaging',
    inventor: 'Dr. Lila Kim',
    affiliation: 'OceanRenew Labs',
    year: '2023',
    category: 'Packaging',
    location: 'Vancouver, Canada',
    description:
      'A fully biodegradable and even edible film derived from seaweed polysaccharides. It replaces single-use plastic sachets for condiments and dry goods, dissolving harmlessly in water and leaving no microplastics.',
    materials: ['Alginate (seaweed)', 'Carrageenan', 'Plant-based plasticizers'],
    impact:
      'Replaces millions of plastic sachets annually; marine-safe; compostable at home.',
    notes:
      'Formulation optimizes barrier properties for moisture and oxygen while maintaining food safety. Pilot trials with local food vendors reduced plastic sachet waste by ~78% in three months.',
    links: [
      { label: 'Project Overview', url: 'https://example.org/seaweed-packaging' },
      { label: 'Open Protocol (PDF)', url: 'https://example.org/seaweed-protocol.pdf' },
    ],
  },
  {
    id: 'mycelium-foam',
    title: 'Mycelium Foam for Protective Packaging',
    inventor: 'Amir Hassan',
    affiliation: 'BioForm Works',
    year: '2024',
    category: 'Protective Packaging',
    location: 'Rotterdam, Netherlands',
    description:
      'Mycelium-grown foam molded into custom inserts that replace polystyrene. The substrate uses agricultural waste and fully decomposes in soil within weeks.',
    materials: ['Mycelium', 'Agricultural husks', 'Hemp fiber'],
    impact:
      'Eliminates fossil-based foams; low-energy growth; circular feedstock stream.',
    notes:
      'Density and cushioning tuned by growth time and substrate composition. Partners report 40% reduction in breakage vs. EPS at similar weight.',
    links: [
      { label: 'Case Study', url: 'https://example.org/mycelium-foam' },
    ],
  },
  {
    id: 'starch-cutlery',
    title: 'Compostable Starch-Based Cutlery',
    inventor: 'Priya Nandakumar',
    affiliation: 'GreenTable Co.',
    year: '2022',
    category: 'Food Service',
    location: 'Bengaluru, India',
    description:
      'Heat-resistant cutlery made from a starch-PLA blend with natural fibers for stiffness. Designed to compost in municipal facilities in under 90 days.',
    materials: ['PLA', 'Corn starch', 'Bamboo fiber'],
    impact:
      'Replaces single-use plastics at scale; lower carbon intensity than PS/PP.',
    notes:
      'Blend ratio balances rigidity and heat deflection. Surface finish improves mouthfeel and reduces water uptake.',
    links: [
      { label: 'Standards & Certification', url: 'https://example.org/starch-cutlery' },
    ],
  },
];

export const getInnovationOfTheDay = () => {
  const now = new Date();
  const dayIndex = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  return innovations[dayIndex % innovations.length];
};

export default innovations;


