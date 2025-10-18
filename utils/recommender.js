// Simple keyword-driven recommender mapping user criteria to dataset fields
import { materialsData } from '../data/materialsData';

const criteriaWeights = {
  durability: 1,
  "moisture resistance": 1,
  cost: 1,
  biodegradability: 1,
};

const datasetFieldMap = {
  durability: ['Tensile Strength (MPa)', 'Compressive Strength (MPa)', 'Hardness (Shore D)', 'Fatigue Resistance (Cycles)'],
  "moisture resistance": ['Corrosion Resistance (1–10)'],
  cost: ['Cost ($/kg)'],
  biodegradability: ['Biodegradability (%)'],
};

const normalize = (value, min, max, higherIsBetter = true) => {
  if (isNaN(value)) return 0;
  if (max === min) return 0;
  const v = (value - min) / (max - min);
  return higherIsBetter ? Math.max(0, Math.min(1, v)) : Math.max(0, Math.min(1, 1 - v));
};

const computeMinMax = (data, field) => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  data.forEach(item => {
    const num = parseFloat(item[field]);
    if (!isNaN(num)) {
      if (num < min) min = num;
      if (num > max) max = num;
    }
  });
  if (!isFinite(min)) min = 0;
  if (!isFinite(max)) max = 1;
  return { min, max };
};

export const recommendMaterials = (userText, topK = 5) => {
  const text = (userText || '').toLowerCase();
  const activeCriteria = Object.keys(criteriaWeights).filter(key => text.includes(key));

  // default to all if no explicit criteria mentioned
  const criteriaToUse = activeCriteria.length ? activeCriteria : Object.keys(criteriaWeights);

  const minMaxCache = {};
  const scoreForItem = (item) => {
    let score = 0;
    let totalWeight = 0;
    criteriaToUse.forEach(criteria => {
      const weight = criteriaWeights[criteria] || 1;
      const fields = datasetFieldMap[criteria] || [];
      if (!fields.length) return;

      let fieldScoreSum = 0;
      let fieldCount = 0;
      fields.forEach(field => {
        if (!minMaxCache[field]) minMaxCache[field] = computeMinMax(materialsData, field);
        const { min, max } = minMaxCache[field];
        const raw = parseFloat(item[field]);
        // For cost lower is better
        const higherIsBetter = field === 'Cost ($/kg)' ? false : true;
        const n = normalize(raw, min, max, higherIsBetter);
        fieldScoreSum += n;
        fieldCount += 1;
      });
      if (fieldCount > 0) {
        score += (fieldScoreSum / fieldCount) * weight;
        totalWeight += weight;
      }
    });
    if (totalWeight === 0) return 0;
    return score / totalWeight;
  };

  const ranked = materialsData
    .map(item => ({ item, score: scoreForItem(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ item, score }) => ({
      name: item['Material Name'],
      score,
      type: item['Material Type'],
      costPerKg: item['Cost ($/kg)'],
      biodegradabilityPct: item['Biodegradability (%)'],
      moistureResistance: item['Corrosion Resistance (1–10)'],
      durability: {
        tensileStrengthMPa: item['Tensile Strength (MPa)'],
        compressiveStrengthMPa: item['Compressive Strength (MPa)'],
        hardnessShoreD: item['Hardness (Shore D)'],
        fatigueCycles: item['Fatigue Resistance (Cycles)'],
      },
      description: item['Description'],
      raw: item,
    }));

  return ranked;
};

export default recommendMaterials;


