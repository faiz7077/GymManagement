import { format } from 'date-fns';
import { db } from '@/utils/database';

interface ChartData {
  [key: string]: any;
}

// Utility function for date aggregation
export const getAggregationKey = (date: Date, aggregation: string): string => {
  switch (aggregation) {
    case 'daily':
      return format(date, 'yyyy-MM-dd');
    case 'weekly':
      return format(date, 'yyyy-\'W\'ww');
    case 'yearly':
      return format(date, 'yyyy');
    case 'monthly':
    default:
      return format(date, 'yyyy-MM');
  }
};

// Financial Chart Generators
export const generateCollectionExpenseChart = async (
  startDate: string, 
  endDate: string, 
  aggregation: string = 'monthly'
): Promise<ChartData[]> => {
  try {
    const receiptsResult = await window.electronAPI.getAllReceipts();
    const expensesResult = await window.electronAPI.getStaffReceipts();
    
    if (!receiptsResult.success || !expensesResult.success) return [];
    
    const receipts = receiptsResult.data || [];
    const expenses = expensesResult.data || [];
    
    const dataMap = new Map<string, { collection: number; expense: number }>();
    
    // Process receipts
    receipts.forEach((receipt: any) => {
      const receiptDate = new Date(receipt.created_at);
      if (receiptDate >= new Date(startDate) && receiptDate <= new Date(endDate)) {
        const key = getAggregationKey(receiptDate, aggregation);
        const existing = dataMap.get(key) || { collection: 0, expense: 0 };
        existing.collection += receipt.amount_paid || receipt.amount || 0;
        dataMap.set(key, existing);
      }
    });
    
    // Process expenses
    expenses.forEach((expense: any) => {
      const expenseDate = new Date(expense.created_at);
      if (expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate)) {
        const key = getAggregationKey(expenseDate, aggregation);
        const existing = dataMap.get(key) || { collection: 0, expense: 0 };
        existing.expense += expense.amount || 0;
        dataMap.set(key, existing);
      }
    });
    
    return Array.from(dataMap.entries())
      .map(([period, data]) => ({
        period,
        collection: data.collection,
        expense: data.expense,
        profit: data.collection - data.expense,
        profitMargin: data.collection > 0 ? ((data.collection - data.expense) / data.collection * 100).toFixed(1) : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error('Error generating collection expense chart:', error);
    return [];
  }
};

export const generateCollectionTrendChart = async (
  startDate: string, 
  endDate: string, 
  aggregation: string = 'monthly'
): Promise<ChartData[]> => {
  try {
    const receiptsResult = await window.electronAPI.getAllReceipts();
    if (!receiptsResult.success) return [];
    
    const receipts = receiptsResult.data || [];
    const collectionMap = new Map<string, number>();
    
    receipts.forEach((receipt: any) => {
      const receiptDate = new Date(receipt.created_at);
      if (receiptDate >= new Date(startDate) && receiptDate <= new Date(endDate)) {
        const key = getAggregationKey(receiptDate, aggregation);
        collectionMap.set(key, (collectionMap.get(key) || 0) + (receipt.amount_paid || receipt.amount || 0));
      }
    });
    
    return Array.from(collectionMap.entries())
      .map(([period, amount]) => ({ period, amount, growth: 0 }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((item, index, array) => ({
        ...item,
        growth: index > 0 ? ((item.amount - array[index - 1].amount) / array[index - 1].amount * 100).toFixed(1) : 0
      }));
  } catch (error) {
    console.error('Error generating collection trend chart:', error);
    return [];
  }
};
export const generateExpenseBreakdownChart = async (
  startDate: string, 
  endDate: string
): Promise<ChartData[]> => {
  try {
    const expensesResult = await window.electronAPI.getStaffReceipts();
    if (!expensesResult.success) return [];
    
    const expenses = expensesResult.data || [];
    const categoryMap = new Map<string, number>();
    
    expenses.forEach((expense: any) => {
      const expenseDate = new Date(expense.created_at);
      if (expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate)) {
        const category = expense.receipt_category || expense.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + (expense.amount || 0));
      }
    });
    
    const total = Array.from(categoryMap.values()).reduce((sum, value) => sum + value, 0);
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error generating expense breakdown chart:', error);
    return [];
  }
};

export const generateRevenueAnalysisChart = async (
  startDate: string, 
  endDate: string, 
  aggregation: string = 'monthly'
): Promise<ChartData[]> => {
  try {
    const receiptsResult = await window.electronAPI.getAllReceipts();
    if (!receiptsResult.success) return [];
    
    const receipts = receiptsResult.data || [];
    const revenueMap = new Map<string, { membership: number; registration: number; other: number }>();
    
    receipts.forEach((receipt: any) => {
      const receiptDate = new Date(receipt.created_at);
      if (receiptDate >= new Date(startDate) && receiptDate <= new Date(endDate)) {
        const key = getAggregationKey(receiptDate, aggregation);
        const existing = revenueMap.get(key) || { membership: 0, registration: 0, other: 0 };
        
        const amount = receipt.amount_paid || receipt.amount || 0;
        if (receipt.description?.toLowerCase().includes('membership')) {
          existing.membership += amount;
        } else if (receipt.description?.toLowerCase().includes('registration')) {
          existing.registration += amount;
        } else {
          existing.other += amount;
        }
        
        revenueMap.set(key, existing);
      }
    });
    
    return Array.from(revenueMap.entries())
      .map(([period, data]) => ({
        period,
        membership: data.membership,
        registration: data.registration,
        other: data.other,
        total: data.membership + data.registration + data.other
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error('Error generating revenue analysis chart:', error);
    return [];
  }
};

// Member Chart Generators
export const generateMemberAdmissionChart = async (
  startDate: string, 
  endDate: string, 
  aggregation: string = 'monthly'
): Promise<ChartData[]> => {
  try {
    const memberData = await db.getAllMembersWithDueAmounts();
    const admissionMap = new Map<string, number>();
    
    (memberData || []).forEach((member: any) => {
      const joinDate = new Date(member.dateOfRegistration || member.created_at);
      if (joinDate >= new Date(startDate) && joinDate <= new Date(endDate)) {
        const key = getAggregationKey(joinDate, aggregation);
        admissionMap.set(key, (admissionMap.get(key) || 0) + 1);
      }
    });
    
    return Array.from(admissionMap.entries())
      .map(([period, admissions]) => ({ period, admissions }))
      .sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error('Error generating member admission chart:', error);
    return [];
  }
};export
 const generateMembershipStatusChart = async (): Promise<ChartData[]> => {
  try {
    const memberData = await db.getAllMembersWithDueAmounts();
    const statusMap = new Map<string, number>();
    
    (memberData || []).forEach((member: any) => {
      const status = member.status || 'active';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    const total = Array.from(statusMap.values()).reduce((sum, value) => sum + value, 0);
    
    return Array.from(statusMap.entries())
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error generating membership status chart:', error);
    return [];
  }
};

export const generateMemberDemographicsChart = async (): Promise<ChartData[]> => {
  try {
    const memberData = await db.getAllMembersWithDueAmounts();
    const genderMap = new Map<string, number>();
    
    (memberData || []).forEach((member: any) => {
      const gender = member.sex || 'unknown';
      genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
    });
    
    return Array.from(genderMap.entries())
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));
  } catch (error) {
    console.error('Error generating member demographics chart:', error);
    return [];
  }
};

export const generateMembershipPlansChart = async (): Promise<ChartData[]> => {
  try {
    const memberData = await db.getAllMembersWithDueAmounts();
    const planMap = new Map<string, number>();
    
    (memberData || []).forEach((member: any) => {
      const plan = member.planType || 'general';
      planMap.set(plan, (planMap.get(plan) || 0) + 1);
    });
    
    return Array.from(planMap.entries())
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error generating membership plans chart:', error);
    return [];
  }
};

// Enquiry Chart Generators
export const generateEnquiryTrendChart = async (
  startDate: string, 
  endDate: string, 
  aggregation: string = 'monthly'
): Promise<ChartData[]> => {
  try {
    const enquiriesResult = await window.electronAPI.getAllEnquiries();
    if (!enquiriesResult.success) return [];
    
    const enquiries = enquiriesResult.data || [];
    const enquiryMap = new Map<string, number>();
    
    enquiries.forEach((enquiry: any) => {
      const enquiryDate = new Date(enquiry.dateOfEnquiry || enquiry.created_at);
      if (enquiryDate >= new Date(startDate) && enquiryDate <= new Date(endDate)) {
        const key = getAggregationKey(enquiryDate, aggregation);
        enquiryMap.set(key, (enquiryMap.get(key) || 0) + 1);
      }
    });
    
    return Array.from(enquiryMap.entries())
      .map(([period, enquiries]) => ({ period, enquiries }))
      .sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error('Error generating enquiry trend chart:', error);
    return [];
  }
};
export const generateEnquiryToMemberChart = async (
  startDate: string, 
  endDate: string, 
  aggregation: string = 'monthly'
): Promise<ChartData[]> => {
  try {
    const enquiriesResult = await window.electronAPI.getAllEnquiries();
    if (!enquiriesResult.success) return [];
    
    const enquiries = enquiriesResult.data || [];
    const conversionMap = new Map<string, { enquiries: number; conversions: number }>();
    
    enquiries.forEach((enquiry: any) => {
      const enquiryDate = new Date(enquiry.dateOfEnquiry || enquiry.created_at);
      if (enquiryDate >= new Date(startDate) && enquiryDate <= new Date(endDate)) {
        const key = getAggregationKey(enquiryDate, aggregation);
        const existing = conversionMap.get(key) || { enquiries: 0, conversions: 0 };
        existing.enquiries += 1;
        if (enquiry.status === 'converted') {
          existing.conversions += 1;
        }
        conversionMap.set(key, existing);
      }
    });
    
    return Array.from(conversionMap.entries())
      .map(([period, data]) => ({
        period,
        enquiries: data.enquiries,
        conversions: data.conversions,
        conversionRate: data.enquiries > 0 ? ((data.conversions / data.enquiries) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error('Error generating enquiry to member chart:', error);
    return [];
  }
};

export const generateEnquiryFollowupChart = async (
  startDate: string, 
  endDate: string
): Promise<ChartData[]> => {
  try {
    const enquiriesResult = await window.electronAPI.getAllEnquiries();
    if (!enquiriesResult.success) return [];
    
    const enquiries = enquiriesResult.data || [];
    const statusMap = new Map<string, number>();
    
    enquiries.forEach((enquiry: any) => {
      const enquiryDate = new Date(enquiry.dateOfEnquiry || enquiry.created_at);
      if (enquiryDate >= new Date(startDate) && enquiryDate <= new Date(endDate)) {
        const status = enquiry.status || 'new';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      }
    });
    
    return Array.from(statusMap.entries())
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error generating enquiry followup chart:', error);
    return [];
  }
};

export const generateEnquiryExecutiveChart = async (
  startDate: string, 
  endDate: string
): Promise<ChartData[]> => {
  try {
    const enquiriesResult = await window.electronAPI.getAllEnquiries();
    if (!enquiriesResult.success) return [];
    
    const enquiries = enquiriesResult.data || [];
    const executiveMap = new Map<string, { total: number; converted: number }>();
    
    enquiries.forEach((enquiry: any) => {
      const enquiryDate = new Date(enquiry.dateOfEnquiry || enquiry.created_at);
      if (enquiryDate >= new Date(startDate) && enquiryDate <= new Date(endDate)) {
        const executive = enquiry.createdBy || 'Unknown';
        const existing = executiveMap.get(executive) || { total: 0, converted: 0 };
        existing.total += 1;
        if (enquiry.status === 'converted') {
          existing.converted += 1;
        }
        executiveMap.set(executive, existing);
      }
    });
    
    return Array.from(executiveMap.entries())
      .map(([executive, data]) => ({
        executive,
        total: data.total,
        converted: data.converted,
        conversionRate: data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.total - a.total);
  } catch (error) {
    console.error('Error generating enquiry executive chart:', error);
    return [];
  }
};// Course Chart Generators
export const generateCourseWiseChart = async (): Promise<ChartData[]> => {
  try {
    const memberData = await db.getAllMembersWithDueAmounts();
    const courseMap = new Map<string, number>();
    
    (memberData || []).forEach((member: any) => {
      const services = Array.isArray(member.services) ? member.services : 
                      typeof member.services === 'string' ? JSON.parse(member.services || '[]') : [];
      
      services.forEach((service: string) => {
        courseMap.set(service, (courseMap.get(service) || 0) + 1);
      });
    });
    
    return Array.from(courseMap.entries())
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error generating course wise chart:', error);
    return [];
  }
};

export const generateAllCourseWiseChart = async (): Promise<ChartData[]> => {
  try {
    const memberData = await db.getAllMembersWithDueAmounts();
    const courseMap = new Map<string, { active: number; inactive: number; total: number }>();
    
    (memberData || []).forEach((member: any) => {
      const services = Array.isArray(member.services) ? member.services : 
                      typeof member.services === 'string' ? JSON.parse(member.services || '[]') : [];
      
      services.forEach((service: string) => {
        const existing = courseMap.get(service) || { active: 0, inactive: 0, total: 0 };
        existing.total += 1;
        if (member.status === 'active') {
          existing.active += 1;
        } else {
          existing.inactive += 1;
        }
        courseMap.set(service, existing);
      });
    });
    
    return Array.from(courseMap.entries())
      .map(([course, data]) => ({
        course: course.charAt(0).toUpperCase() + course.slice(1),
        active: data.active,
        inactive: data.inactive,
        total: data.total
      }))
      .sort((a, b) => b.total - a.total);
  } catch (error) {
    console.error('Error generating all course wise chart:', error);
    return [];
  }
};

export const generateCourseRevenueChart = async (
  startDate: string, 
  endDate: string
): Promise<ChartData[]> => {
  try {
    const memberData = await db.getAllMembersWithDueAmounts();
    const courseRevenueMap = new Map<string, number>();
    
    (memberData || []).forEach((member: any) => {
      const joinDate = new Date(member.dateOfRegistration || member.created_at);
      if (joinDate >= new Date(startDate) && joinDate <= new Date(endDate)) {
        const services = Array.isArray(member.services) ? member.services : 
                        typeof member.services === 'string' ? JSON.parse(member.services || '[]') : [];
        
        const revenue = (member.registrationFee || 0) + (member.packageFee || member.membershipFees || 0) - (member.discount || 0);
        
        services.forEach((service: string) => {
          courseRevenueMap.set(service, (courseRevenueMap.get(service) || 0) + revenue);
        });
      }
    });
    
    return Array.from(courseRevenueMap.entries())
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Error generating course revenue chart:', error);
    return [];
  }
};