/**
 * Format date for database storage without timezone issues
 * @param date - The date to format
 * @returns The formatted date string in YYYY-MM-DD format
 */
export const formatDateForDatabase = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Safely convert any date value to a valid date string
 * @param dateValue - The date value to convert (can be string, Date, null, undefined)
 * @param fallback - Optional fallback date (defaults to current date)
 * @returns A valid date string
 */
export const safeDate = (dateValue: any, fallback?: Date): string => {
  if (!dateValue) return (fallback || new Date()).toISOString();
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date found:', dateValue, 'using fallback date instead');
      return (fallback || new Date()).toISOString();
    }
    return typeof dateValue === 'string' ? dateValue : date.toISOString();
  } catch (error) {
    console.warn('Date conversion error:', error, 'for value:', dateValue);
    return (fallback || new Date()).toISOString();
  }
};

/**
 * Calculate subscription end date based on start date and plan duration
 * @param startDate - The subscription start date (string or Date)
 * @param planType - The plan type or custom duration in months
 * @returns The calculated end date as ISO string
 */
export const calculateSubscriptionEndDate = (
  startDate: string | Date, 
  planType: string | number
): string => {
  const start = new Date(startDate);
  
  // Validate start date
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start date provided');
  }
  
  let monthsToAdd: number;
  
  // Handle plan types and custom durations
  if (typeof planType === 'number') {
    monthsToAdd = planType;
  } else {
    switch (planType.toLowerCase()) {
      case 'monthly':
        monthsToAdd = 1;
        break;
      case 'quarterly':
        monthsToAdd = 3;
        break;
      case 'half_yearly':
      case 'half-yearly':
        monthsToAdd = 6;
        break;
      case 'yearly':
        monthsToAdd = 12;
        break;
      case '2_months':
      case '2-months':
        monthsToAdd = 2;
        break;
      case '4_months':
      case '4-months':
        monthsToAdd = 4;
        break;
      case '7_months':
      case '7-months':
        monthsToAdd = 7;
        break;
      case '9_months':
      case '9-months':
        monthsToAdd = 9;
        break;
      case '10_months':
      case '10-months':
        monthsToAdd = 10;
        break;
      case '11_months':
      case '11-months':
        monthsToAdd = 11;
        break;
      default:
        // Try to parse as number if it's a string
        const parsed = parseInt(planType.toString());
        if (!isNaN(parsed) && parsed > 0) {
          monthsToAdd = parsed;
        } else {
          monthsToAdd = 1; // Default to 1 month
        }
    }
  }
  
  // Calculate end date
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + monthsToAdd);
  
  // Handle edge cases for month-end dates
  // If the original date was the last day of the month, 
  // make sure the end date is also the last day of its month
  if (start.getDate() === getLastDayOfMonth(start)) {
    endDate.setDate(getLastDayOfMonth(endDate));
  }
  
  return endDate.toISOString();
};

/**
 * Get the last day of the month for a given date
 */
const getLastDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

/**
 * Calculate end date specifically for member updates
 * This function is used when updating a member's plan
 */
export const calculateEndDateForUpdate = (
  startDate: string | Date,
  planDurationInMonths: number
): string => {
  return calculateSubscriptionEndDate(startDate, planDurationInMonths);
};

/**
 * Get plan duration in months from plan type
 */
export const getPlanDurationInMonths = (planType: string): number => {
  switch (planType.toLowerCase()) {
    case 'monthly':
      return 1;
    case 'quarterly':
      return 3;
    case 'half_yearly':
    case 'half-yearly':
      return 6;
    case 'yearly':
      return 12;
    case '2_months':
    case '2-months':
      return 2;
    case '4_months':
    case '4-months':
      return 4;
    case '7_months':
    case '7-months':
      return 7;
    case '9_months':
    case '9-months':
      return 9;
    case '10_months':
    case '10-months':
      return 10;
    case '11_months':
    case '11-months':
      return 11;
    default:
      return 1; // Default to monthly
  }
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};