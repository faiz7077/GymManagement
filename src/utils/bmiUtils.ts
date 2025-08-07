// BMI calculation and utility functions

export const calculateBMI = (weight: number, height: number): number => {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const getBMIColor = (bmi: number): string => {
  if (bmi < 18.5) return 'text-blue-600';
  if (bmi < 25) return 'text-green-600';
  if (bmi < 30) return 'text-yellow-600';
  return 'text-red-600';
};

export const getBMIBadgeColor = (bmi: number): string => {
  if (bmi < 18.5) return 'bg-blue-100 text-blue-800';
  if (bmi < 25) return 'bg-green-100 text-green-800';
  if (bmi < 30) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export const convertCmToFeetInches = (cm: number): string => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};

export const convertFeetInchesToCm = (feet: number, inches: number): number => {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
};

export const getIdealWeightRange = (height: number): { min: number; max: number } => {
  // Using BMI range of 18.5-24.9 for normal weight
  const heightInMeters = height / 100;
  const minWeight = Math.round(18.5 * heightInMeters * heightInMeters);
  const maxWeight = Math.round(24.9 * heightInMeters * heightInMeters);
  return { min: minWeight, max: maxWeight };
};

// BMR (Basal Metabolic Rate) calculation using Mifflin-St Jeor Equation
export const calculateBMR = (weight: number, height: number, age: number, gender: string): number => {
  // weight in kg, height in cm, age in years
  let bmr: number;
  
  if (gender.toLowerCase() === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  return Math.round(bmr);
};

// Activity level multipliers for Total Daily Energy Expenditure (TDEE)
export const getTDEE = (bmr: number, activityLevel: string): number => {
  const multipliers = {
    sedentary: 1.2,        // Little or no exercise
    light: 1.375,          // Light exercise/sports 1-3 days/week
    moderate: 1.55,        // Moderate exercise/sports 3-5 days/week
    active: 1.725,         // Hard exercise/sports 6-7 days a week
    veryActive: 1.9        // Very hard exercise/sports & physical job
  };
  
  const multiplier = multipliers[activityLevel as keyof typeof multipliers] || 1.2;
  return Math.round(bmr * multiplier);
};