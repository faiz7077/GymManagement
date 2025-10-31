import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Lucide React Icons
import {
  BarChart3, TrendingUp, DollarSign, Users, Calendar, Gift, Building2,
  RefreshCw, Eye, Calculator, Settings, FileText, User, UserPlus, Phone,
  MessageCircle, BookOpen, Receipt
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

// Hooks & Context
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Database & Types
import { db } from '@/utils/database';

// Report Components and Types
import {
  ReportDateRange,
  ReportLoadingSkeleton,
  ReportEmptyState,
  ReportData,
  ReportExportActions
} from '@/components/reports';
import { ReportType, REPORT_CONFIGS, ReportFilters } from '@/components/reports/types';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count?: number;
  requiresDateRange?: boolean;
  category: 'financial' | 'member' | 'staff' | 'analytics';
}

interface ReportConfig {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    status?: string;
    membershipType?: string;
    month?: string;
  };
}

export const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showReportResultsDialog, setShowReportResultsDialog] = useState(false);
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    dateRange: {
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    },
    filters: {
      status: 'all',
      membershipType: 'all',
      month: format(new Date(), 'yyyy-MM')
    }
  });

  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();

  const reportCards: ReportCard[] = [
    // Financial Reports
    {
      id: ReportType.ALL_COLLECTION,
      title: 'All Collection Report',
      description: 'Complete collection report with all payment types and methods',
      icon: DollarSign,
      color: 'bg-green-600',
      requiresDateRange: true,
      category: 'financial'
    },
    {
      id: ReportType.MEMBER_BALANCE_PAYMENT,
      title: 'Member Wise Balance Payment Report',
      description: 'Individual member payment status and outstanding balances',
      icon: Users,
      color: 'bg-blue-600',
      requiresDateRange: false,
      category: 'financial'
    },
    {
      id: ReportType.EXPENSE_REPORT,
      title: 'Expense Report',
      description: 'Track all gym expenses and operational costs',
      icon: TrendingUp,
      color: 'bg-red-600',
      requiresDateRange: true,
      category: 'financial'
    },
    {
      id: ReportType.PAYMENT_DETAILS,
      title: 'Payment Details',
      description: 'Detailed payment transactions and receipt information',
      icon: Receipt,
      color: 'bg-purple-600',
      requiresDateRange: true,
      category: 'financial'
    },
    {
      id: ReportType.COURSE_WISE_COLLECTION,
      title: 'Course Wise Collection',
      description: 'Revenue breakdown by membership plans and services',
      icon: BarChart3,
      color: 'bg-indigo-600',
      requiresDateRange: true,
      category: 'financial'
    },
    {
      id: ReportType.DATE_WISE_BALANCE_PAYMENT,
      title: 'Date wise Balance Payment Report',
      description: 'Daily balance and payment tracking report',
      icon: Calendar,
      color: 'bg-teal-600',
      requiresDateRange: true,
      category: 'financial'
    },
    {
      id: ReportType.GST_REPORT,
      title: 'GST Report',
      description: 'GST breakdown and tax calculations for compliance',
      icon: Calculator,
      color: 'bg-yellow-600',
      requiresDateRange: true,
      category: 'financial'
    },
    {
      id: ReportType.BALANCE_SHEET,
      title: 'Balance Sheet',
      description: 'Financial position with assets, liabilities and equity',
      icon: FileText,
      color: 'bg-gray-600',
      requiresDateRange: true,
      category: 'financial'
    },
    {
      id: ReportType.PROFIT_LOSS,
      title: 'Profit And Loss Corner',
      description: 'Income statement showing revenue, expenses and profit',
      icon: TrendingUp,
      color: 'bg-emerald-600',
      requiresDateRange: true,
      category: 'financial'
    },

    // Member Reports
    {
      id: ReportType.ACTIVE_DEACTIVE_MEMBERSHIP,
      title: 'Active/Deactive Membership Report',
      description: 'Status-wise membership analysis and trends',
      icon: Users,
      color: 'bg-cyan-600',
      requiresDateRange: false,
      category: 'member'
    },
    {
      id: ReportType.MEMBER_BIRTHDAY,
      title: 'Member Birthday Report',
      description: 'Members celebrating birthdays for engagement campaigns',
      icon: Gift,
      color: 'bg-pink-600',
      requiresDateRange: false,
      category: 'member'
    },
    {
      id: ReportType.MEMBERSHIP_END_DATE,
      title: 'Membership End Date Report',
      description: 'Track membership expiry dates and renewal requirements',
      icon: Calendar,
      color: 'bg-red-600',
      requiresDateRange: false,
      category: 'member'
    },
    {
      id: ReportType.MEMBER_INFORMATION,
      title: 'Member Information',
      description: 'Comprehensive member database with all details',
      icon: User,
      color: 'bg-blue-500',
      requiresDateRange: false,
      category: 'member'
    },
    {
      id: ReportType.MEMBER_DETAIL_REPORT,
      title: 'Member Detail Report',
      description: 'In-depth member profiles with payment and attendance history',
      icon: FileText,
      color: 'bg-slate-600',
      requiresDateRange: false,
      category: 'member'
    },
    {
      id: ReportType.MEMBER_COURSE_LEDGER,
      title: 'Member Course Registration Ledger Report',
      description: 'Member enrollment history and course progression tracking',
      icon: BookOpen,
      color: 'bg-violet-600',
      requiresDateRange: true,
      category: 'member'
    },

    // Enquiry Reports
    {
      id: ReportType.ENQUIRY_TO_ENROLL,
      title: 'Enquiry To Enroll Report',
      description: 'Track enquiry conversion rates and enrollment success',
      icon: UserPlus,
      color: 'bg-orange-600',
      requiresDateRange: true,
      category: 'analytics'
    },
    {
      id: ReportType.ENQUIRY_FOLLOWUP,
      title: 'Enquiry Followup Report',
      description: 'Pending enquiry follow-ups and contact schedules',
      icon: Phone,
      color: 'bg-amber-600',
      requiresDateRange: true,
      category: 'analytics'
    },
    {
      id: ReportType.ALL_FOLLOWUP,
      title: 'All Followup Report',
      description: 'Complete follow-up history and communication tracking',
      icon: MessageCircle,
      color: 'bg-lime-600',
      requiresDateRange: true,
      category: 'analytics'
    },

    // Staff Reports
    {
      id: ReportType.MEMBER_INSTRUCTOR_ALLOCATION,
      title: 'Member Wise Instructor Allocation Report',
      description: 'Trainer assignments and member distribution analysis',
      icon: Building2,
      color: 'bg-indigo-600',
      requiresDateRange: false,
      category: 'staff'
    },
    {
      id: ReportType.PERSONAL_INSTRUCTOR,
      title: 'Personal Instructor Report',
      description: 'Individual trainer performance and member assignments',
      icon: User,
      color: 'bg-purple-500',
      requiresDateRange: false,
      category: 'staff'
    },

    // Comprehensive Reports
    {
      id: ReportType.DETAIL_REPORT,
      title: 'Detail Report',
      description: 'Comprehensive gym operations report with all metrics',
      icon: FileText,
      color: 'bg-gray-700',
      requiresDateRange: true,
      category: 'analytics'
    }
  ];

  const openReportDialog = (reportCard: ReportCard) => {
    setSelectedReportCard(reportCard);
    setShowReportDialog(true);
    setActiveReport(null);
    setReportData([]);
  };

  const generateReport = async (reportType: string, config?: ReportConfig) => {
    setActiveReport(reportType);
    setIsGeneratingReport(true);
    setShowReportDialog(false);

    try {
      let data: ReportData[] = [];
      const currentConfig = config || reportConfig;

      switch (reportType) {
        // Financial Reports
        case ReportType.ALL_COLLECTION:
          data = await generateAllCollectionReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;
        case ReportType.MEMBER_BALANCE_PAYMENT:
          data = await generateMemberBalancePaymentReport(currentConfig.filters.status);
          break;
        case ReportType.EXPENSE_REPORT:
          data = await generateExpenseReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;
        case ReportType.PAYMENT_DETAILS:
          data = await generatePaymentDetailsReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;
        case ReportType.COURSE_WISE_COLLECTION:
          data = await generateCourseWiseCollectionReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;
        case ReportType.DATE_WISE_BALANCE_PAYMENT:
          data = await generateDateWiseBalancePaymentReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;
        case ReportType.GST_REPORT:
          data = await generateGSTReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;
        case ReportType.BALANCE_SHEET:
          data = await generateBalanceSheetReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;
        case ReportType.PROFIT_LOSS:
          data = await generateProfitLossReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;

        // Member Reports
        case ReportType.ACTIVE_DEACTIVE_MEMBERSHIP:
          data = await generateActiveDeactiveMembershipReport(currentConfig.filters.status);
          break;
        case ReportType.MEMBER_BIRTHDAY:
          data = await generateMemberBirthdayReport(currentConfig.filters.month);
          break;
        case ReportType.MEMBERSHIP_END_DATE:
          data = await generateMembershipEndDateReport();
          break;
        case ReportType.MEMBER_INFORMATION:
          data = await generateMemberInformationReport(currentConfig.filters.status);
          break;
        case ReportType.MEMBER_DETAIL_REPORT:
          data = await generateMemberDetailReport(currentConfig.filters.status);
          break;
        case ReportType.MEMBER_COURSE_LEDGER:
          data = await generateMemberCourseLedgerReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;

        // Enquiry Reports
        case ReportType.ENQUIRY_TO_ENROLL:
          data = await generateEnquiryToEnrollReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;
        case ReportType.ENQUIRY_FOLLOWUP:
          data = await generateEnquiryFollowupReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;
        case ReportType.ALL_FOLLOWUP:
          data = await generateAllFollowupReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;

        // Staff Reports
        case ReportType.MEMBER_INSTRUCTOR_ALLOCATION:
          data = await generateMemberInstructorAllocationReport();
          break;
        case ReportType.PERSONAL_INSTRUCTOR:
          data = await generatePersonalInstructorReport(currentConfig.filters.instructor);
          break;

        // Comprehensive Reports
        case ReportType.DETAIL_REPORT:
          data = await generateDetailReport(currentConfig.dateRange.startDate, currentConfig.dateRange.endDate);
          break;

        default:
          data = [];
      }

      setReportData(data);

      // Show results in popup dialog
      setShowReportResultsDialog(true);

      toast({
        title: "Report Generated",
        description: `${selectedReportCard?.title || 'Report'} generated successfully with ${data.length} records.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Comprehensive Report Generation Functions
  
  // Financial Reports
  const generateAllCollectionReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const result = await window.electronAPI.getAllReceipts();
      if (!result.success || !result.data) return [];
      
      const receipts = result.data.filter((receipt: any) => {
        const receiptDate = receipt.created_at.split('T')[0];
        return receiptDate >= startDate && receiptDate <= endDate;
      });

      return receipts.map((receipt: any) => ({
        memberName: receipt.member_name || 'Unknown Member',
        receiptNumber: receipt.receipt_number,
        totalPaid: receipt.amount_paid || receipt.amount || 0,
        balance: receipt.due_amount || 0,
        status: receipt.due_amount > 0 ? 'partial' : 'paid',
        gstIncluded: true,
        paymentDate: receipt.created_at?.split('T')[0],
        paymentMethod: receipt.payment_type,
        membershipType: receipt.plan_type,
        cgst: receipt.cgst || 0,
        sgst: receipt.sigst || 0,
        totalTax: (receipt.cgst || 0) + (receipt.sigst || 0),
        phoneNumber: receipt.mobile_no,
        email: receipt.email
      }));
    } catch (error) {
      console.error('Error generating all collection report:', error);
      return [];
    }
  };

  const generateMemberBalancePaymentReport = async (statusFilter?: string): Promise<ReportData[]> => {
    try {
      const memberData = await db.getAllMembersWithDueAmounts();
      const reportData: ReportData[] = [];

      for (const member of memberData || []) {
        if (statusFilter && statusFilter !== 'all' && member.status !== statusFilter) {
          continue;
        }

        const receiptsResult = await window.electronAPI.getReceiptsByMember(member.id);
        const receipts = receiptsResult.success ? receiptsResult.data || [] : [];
        const totalPaid = receipts.reduce((sum: number, r: any) => sum + (r.amount_paid || r.amount || 0), 0);
        const lastReceipt = receipts[0];
        const totalAmount = (member.registrationFee || 0) + (member.packageFee || member.membershipFees || 0) - (member.discount || 0);

        reportData.push({
          memberName: member.name,
          memberId: member.customMemberId || member.id,
          totalAmount: totalAmount,
          totalPaid: totalPaid,
          balance: member.dueAmount || member.due_amount || 0,
          status: member.status || 'active',
          gstIncluded: false,
          lastPaymentDate: lastReceipt?.created_at?.split('T')[0],
          phoneNumber: member.mobileNo,
          email: member.email,
          membershipType: member.planType
        });
      }

      return reportData.sort((a, b) => (b.balance || 0) - (a.balance || 0));
    } catch (error) {
      console.error('Error generating member balance payment report:', error);
      return [];
    }
  };

  const generateExpenseReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const staffResult = await window.electronAPI.getStaffReceipts();
      const expenses: ReportData[] = [];

      if (staffResult.success && staffResult.data) {
        staffResult.data.forEach((receipt: any) => {
          const receiptDate = receipt.created_at.split('T')[0];
          if (receiptDate >= startDate && receiptDate <= endDate) {
            expenses.push({
              memberName: receipt.member_name || receipt.staff_name,
              description: receipt.description || 'Staff Expense',
              expenseCategory: receipt.receipt_category || 'salary',
              totalPaid: receipt.amount || 0,
              balance: 0,
              status: 'paid',
              gstIncluded: false,
              expenseDate: receiptDate,
              paymentMethod: receipt.payment_type,
              phoneNumber: receipt.receipt_number
            });
          }
        });
      }

      return expenses.sort((a, b) => new Date(b.expenseDate || '').getTime() - new Date(a.expenseDate || '').getTime());
    } catch (error) {
      console.error('Error generating expense report:', error);
      return [];
    }
  };

  const generatePaymentDetailsReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const result = await window.electronAPI.getAllReceipts();
      if (!result.success || !result.data) return [];
      
      const receipts = result.data.filter((receipt: any) => {
        const receiptDate = receipt.created_at.split('T')[0];
        return receiptDate >= startDate && receiptDate <= endDate;
      });

      return receipts.map((receipt: any) => ({
        receiptNumber: receipt.receipt_number,
        memberName: receipt.member_name || 'Unknown',
        totalPaid: receipt.amount || 0,
        balance: receipt.due_amount || 0,
        status: receipt.due_amount > 0 ? 'partial' : 'paid',
        gstIncluded: true,
        paymentDate: receipt.created_at?.split('T')[0],
        paymentMethod: receipt.payment_type,
        description: receipt.description,
        phoneNumber: receipt.mobile_no,
        email: receipt.email
      }));
    } catch (error) {
      console.error('Error generating payment details report:', error);
      return [];
    }
  };

  const generateCourseWiseCollectionReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const memberData = await db.getAllMembersWithDueAmounts();
      const courseCollections: { [key: string]: { total: number; count: number; paid: number } } = {};

      for (const member of memberData || []) {
        if (member.dateOfRegistration >= startDate && member.dateOfRegistration <= endDate) {
          const course = member.planType || 'General';
          if (!courseCollections[course]) {
            courseCollections[course] = { total: 0, count: 0, paid: 0 };
          }
          
          const totalFees = (member.registrationFee || 0) + (member.packageFee || member.membershipFees || 0) - (member.discount || 0);
          const paidAmount = totalFees - (member.dueAmount || member.due_amount || 0);
          
          courseCollections[course].total += totalFees;
          courseCollections[course].paid += paidAmount;
          courseCollections[course].count += 1;
        }
      }

      return Object.entries(courseCollections).map(([course, data]) => ({
        courseName: course,
        memberCount: data.count,
        totalRevenue: data.total,
        totalPaid: data.paid,
        balance: data.total - data.paid,
        status: data.total === data.paid ? 'completed' : 'pending',
        gstIncluded: false,
        description: `${data.count} members enrolled`,
        memberName: course,
        phoneNumber: `${data.count} members`,
        email: `₹${data.total.toLocaleString()} total`
      }));
    } catch (error) {
      console.error('Error generating course wise collection report:', error);
      return [];
    }
  };

  const generateDateWiseBalancePaymentReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const result = await window.electronAPI.getAllReceipts();
      if (!result.success || !result.data) return [];
      
      const receipts = result.data.filter((receipt: any) => {
        const receiptDate = receipt.created_at.split('T')[0];
        return receiptDate >= startDate && receiptDate <= endDate;
      });

      const dailyData: { [key: string]: { paid: number; due: number; count: number } } = {};

      receipts.forEach((receipt: any) => {
        const date = receipt.created_at.split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { paid: 0, due: 0, count: 0 };
        }
        dailyData[date].paid += receipt.amount_paid || receipt.amount || 0;
        dailyData[date].due += receipt.due_amount || 0;
        dailyData[date].count += 1;
      });

      return Object.entries(dailyData).map(([date, data]) => ({
        memberName: `Daily Summary - ${format(new Date(date), 'PPP')}`,
        paymentDate: date,
        totalPaid: data.paid,
        balance: data.due,
        status: data.due > 0 ? 'pending' : 'completed',
        gstIncluded: false,
        totalTransactions: data.count,
        description: `${data.count} transactions, ₹${(data.paid + data.due).toLocaleString()} total`,
        phoneNumber: `${data.count} transactions`,
        email: `₹${(data.paid + data.due).toLocaleString()} total`
      })).sort((a, b) => new Date(b.paymentDate || '').getTime() - new Date(a.paymentDate || '').getTime());
    } catch (error) {
      console.error('Error generating date wise balance payment report:', error);
      return [];
    }
  };

  const generateGSTReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const result = await window.electronAPI.getAllReceipts();
      if (!result.success || !result.data) return [];

      const receipts = result.data.filter((receipt: any) => {
        const receiptDate = receipt.created_at.split('T')[0];
        return receiptDate >= startDate && receiptDate <= endDate;
      });

      return receipts.map((receipt: any) => ({
        receiptNumber: receipt.receipt_number,
        memberName: receipt.member_name || 'Unknown Member',
        totalPaid: receipt.amount_paid || receipt.amount || 0,
        balance: 0,
        status: 'completed',
        gstIncluded: true,
        paymentDate: receipt.created_at?.split('T')[0],
        cgst: receipt.cgst || 0,
        sgst: receipt.sigst || 0,
        totalTax: (receipt.cgst || 0) + (receipt.sigst || 0),
        phoneNumber: receipt.receipt_number || 'N/A',
        email: `CGST: ₹${(receipt.cgst || 0).toFixed(2)}, SGST: ₹${(receipt.sigst || 0).toFixed(2)}`
      })).sort((a, b) => (b.totalTax || 0) - (a.totalTax || 0));
    } catch (error) {
      console.error('Error generating GST report:', error);
      return [];
    }
  };

  const generateBalanceSheetReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const receiptsResult = await window.electronAPI.getAllReceipts();
      const receipts = receiptsResult.success ? receiptsResult.data || [] : [];
      
      const filteredReceipts = receipts.filter((receipt: any) => {
        const receiptDate = receipt.created_at.split('T')[0];
        return receiptDate >= startDate && receiptDate <= endDate;
      });

      const totalRevenue = filteredReceipts.reduce((sum: number, r: any) => sum + (r.amount_paid || r.amount || 0), 0);
      const totalDue = filteredReceipts.reduce((sum: number, r: any) => sum + (r.due_amount || 0), 0);
      
      const staffResult = await window.electronAPI.getStaffReceipts();
      const staffExpenses = staffResult.success ? staffResult.data || [] : [];
      const totalExpenses = staffExpenses.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

      return [
        {
          category: 'Assets',
          memberName: 'Cash & Bank',
          totalPaid: totalRevenue,
          balance: 0,
          status: 'asset',
          gstIncluded: false,
          description: 'Current Assets',
          phoneNumber: 'Current Assets',
          email: `₹${totalRevenue.toLocaleString()}`
        },
        {
          category: 'Assets',
          memberName: 'Accounts Receivable',
          totalPaid: totalDue,
          balance: 0,
          status: 'asset',
          gstIncluded: false,
          description: 'Current Assets',
          phoneNumber: 'Current Assets',
          email: `₹${totalDue.toLocaleString()}`
        },
        {
          category: 'Liabilities',
          memberName: 'Staff Payables',
          totalPaid: totalExpenses,
          balance: 0,
          status: 'liability',
          gstIncluded: false,
          description: 'Current Liabilities',
          phoneNumber: 'Current Liabilities',
          email: `₹${totalExpenses.toLocaleString()}`
        },
        {
          category: 'Equity',
          memberName: 'Net Worth',
          totalPaid: totalRevenue + totalDue - totalExpenses,
          balance: 0,
          status: 'equity',
          gstIncluded: false,
          description: 'Owner\'s Equity',
          phoneNumber: 'Owner\'s Equity',
          email: `₹${(totalRevenue + totalDue - totalExpenses).toLocaleString()}`
        }
      ];
    } catch (error) {
      console.error('Error generating balance sheet report:', error);
      return [];
    }
  };

  const generateProfitLossReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const receiptsResult = await window.electronAPI.getAllReceipts();
      const receipts = receiptsResult.success ? receiptsResult.data || [] : [];
      
      const filteredReceipts = receipts.filter((receipt: any) => {
        const receiptDate = receipt.created_at.split('T')[0];
        return receiptDate >= startDate && receiptDate <= endDate;
      });

      const totalRevenue = filteredReceipts.reduce((sum: number, r: any) => sum + (r.amount_paid || r.amount || 0), 0);
      
      const staffResult = await window.electronAPI.getStaffReceipts();
      const staffExpenses = staffResult.success ? staffResult.data || [] : [];
      const totalExpenses = staffExpenses.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      
      const grossProfit = totalRevenue;
      const netProfit = grossProfit - totalExpenses;

      return [
        {
          category: 'Revenue',
          memberName: 'Membership Fees',
          totalPaid: totalRevenue,
          balance: 0,
          status: 'revenue',
          gstIncluded: false,
          description: 'Primary Revenue',
          phoneNumber: 'Income',
          email: `₹${totalRevenue.toLocaleString()}`
        },
        {
          category: 'Gross Profit',
          memberName: 'Gross Profit',
          totalPaid: grossProfit,
          balance: 0,
          status: 'profit',
          gstIncluded: false,
          description: 'Gross Margin',
          phoneNumber: 'Gross Margin',
          email: `₹${grossProfit.toLocaleString()}`
        },
        {
          category: 'Expenses',
          memberName: 'Staff Salaries',
          totalPaid: totalExpenses,
          balance: 0,
          status: 'expense',
          gstIncluded: false,
          description: 'Operating Expense',
          phoneNumber: 'Operating Expense',
          email: `₹${totalExpenses.toLocaleString()}`
        },
        {
          category: 'Net Profit',
          memberName: 'Net Profit',
          totalPaid: netProfit,
          balance: 0,
          status: netProfit >= 0 ? 'profit' : 'loss',
          gstIncluded: false,
          description: 'Bottom Line',
          phoneNumber: 'Bottom Line',
          email: `₹${netProfit.toLocaleString()}`
        }
      ];
    } catch (error) {
      console.error('Error generating profit loss report:', error);
      return [];
    }
  };

  // Member Reports
  const generateActiveDeactiveMembershipReport = async (statusFilter?: string): Promise<ReportData[]> => {
    try {
      const memberData = await db.getAllMembersWithDueAmounts();
      const reportData: ReportData[] = [];

      for (const member of memberData || []) {
        if (statusFilter && statusFilter !== 'all' && member.status !== statusFilter) {
          continue;
        }

        reportData.push({
          memberName: member.name,
          memberId: member.customMemberId || member.id,
          totalPaid: 0,
          balance: member.dueAmount || member.due_amount || 0,
          status: member.status || 'active',
          gstIncluded: false,
          joiningDate: member.dateOfRegistration,
          expiryDate: member.subscriptionEndDate,
          membershipType: member.planType,
          phoneNumber: member.mobileNo,
          email: member.email,
          subscriptionStatus: member.subscriptionStatus
        });
      }

      return reportData.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return 0;
      });
    } catch (error) {
      console.error('Error generating active/deactive membership report:', error);
      return [];
    }
  };

  const generateMemberBirthdayReport = async (month?: string): Promise<ReportData[]> => {
    try {
      const memberData = await db.getAllMembersWithDueAmounts();
      const reportData: ReportData[] = [];
      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

      for (const member of memberData || []) {
        if (member.dateOfBirth) {
          const birthDate = new Date(member.dateOfBirth);
          const birthMonth = birthDate.getMonth() + 1;
          
          if (birthMonth === targetMonth) {
            reportData.push({
              memberName: member.name,
              totalPaid: 0,
              balance: 0,
              status: member.status || 'active',
              gstIncluded: false,
              birthday: member.dateOfBirth,
              age: member.age || new Date().getFullYear() - birthDate.getFullYear(),
              phoneNumber: member.mobileNo,
              email: member.email,
              membershipType: member.planType,
              joiningDate: member.dateOfRegistration,
              memberId: member.customMemberId || member.id
            });
          }
        }
      }

      return reportData.sort((a, b) => {
        const dateA = new Date(a.birthday || '');
        const dateB = new Date(b.birthday || '');
        return dateA.getDate() - dateB.getDate();
      });
    } catch (error) {
      console.error('Error generating member birthday report:', error);
      return [];
    }
  };

  const generateMembershipEndDateReport = async (): Promise<ReportData[]> => {
    try {
      const memberData = await db.getAllMembersWithDueAmounts();
      const reportData: ReportData[] = [];
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      for (const member of memberData || []) {
        if (member.subscriptionEndDate) {
          const endDate = new Date(member.subscriptionEndDate);
          const isExpiringSoon = endDate <= thirtyDaysFromNow && endDate >= today;
          const isExpired = endDate < today;
          
          if (isExpiringSoon || isExpired) {
            const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            reportData.push({
              memberName: member.name,
              memberId: member.customMemberId || member.id,
              totalPaid: 0,
              balance: member.dueAmount || member.due_amount || 0,
              status: isExpired ? 'expired' : 'expiring_soon',
              gstIncluded: false,
              expiryDate: member.subscriptionEndDate,
              joiningDate: member.dateOfRegistration,
              phoneNumber: member.mobileNo,
              email: member.email,
              membershipType: member.planType,
              daysLeft: isExpired ? 'Expired' : `${daysUntilExpiry} days left`
            });
          }
        }
      }

      return reportData.sort((a, b) => {
        const dateA = new Date(a.expiryDate || '');
        const dateB = new Date(b.expiryDate || '');
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error('Error generating membership end date report:', error);
      return [];
    }
  };

  const generateMemberInformationReport = async (statusFilter?: string): Promise<ReportData[]> => {
    try {
      const memberData = await db.getAllMembersWithDueAmounts();
      const reportData: ReportData[] = [];

      for (const member of memberData || []) {
        if (statusFilter && statusFilter !== 'all' && member.status !== statusFilter) {
          continue;
        }

        reportData.push({
          memberName: member.name,
          memberId: member.customMemberId || member.id,
          totalPaid: 0,
          balance: member.dueAmount || member.due_amount || 0,
          status: member.status || 'active',
          gstIncluded: false,
          phoneNumber: member.mobileNo,
          email: member.email,
          membershipType: member.planType,
          joiningDate: member.dateOfRegistration,
          expiryDate: member.subscriptionEndDate,
          address: member.address,
          occupation: member.occupation,
          age: member.age,
          gender: member.sex
        });
      }

      return reportData.sort((a, b) => a.memberName.localeCompare(b.memberName));
    } catch (error) {
      console.error('Error generating member information report:', error);
      return [];
    }
  };

  const generateMemberDetailReport = async (statusFilter?: string): Promise<ReportData[]> => {
    try {
      const memberData = await db.getAllMembersWithDueAmounts();
      const reportData: ReportData[] = [];

      for (const member of memberData || []) {
        if (statusFilter && statusFilter !== 'all' && member.status !== statusFilter) {
          continue;
        }

        const receiptsResult = await window.electronAPI.getReceiptsByMember(member.id);
        const receipts = receiptsResult.success ? receiptsResult.data || [] : [];
        const totalPaid = receipts.reduce((sum: number, r: any) => sum + (r.amount_paid || r.amount || 0), 0);
        const lastReceipt = receipts[0];

        reportData.push({
          memberName: member.name,
          memberId: member.customMemberId || member.id,
          totalPaid: totalPaid,
          balance: member.dueAmount || member.due_amount || 0,
          status: member.status || 'active',
          gstIncluded: false,
          phoneNumber: member.mobileNo,
          email: member.email,
          membershipType: member.planType,
          joiningDate: member.dateOfRegistration,
          expiryDate: member.subscriptionEndDate,
          lastPaymentDate: lastReceipt?.created_at?.split('T')[0],
          totalAttendance: receipts.length,
          assignedTrainer: member.assignedTrainer || 'Not Assigned'
        });
      }

      return reportData.sort((a, b) => (b.totalPaid || 0) - (a.totalPaid || 0));
    } catch (error) {
      console.error('Error generating member detail report:', error);
      return [];
    }
  };

  const generateMemberCourseLedgerReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const memberData = await db.getAllMembersWithDueAmounts();
      const reportData: ReportData[] = [];

      for (const member of memberData || []) {
        if (member.dateOfRegistration >= startDate && member.dateOfRegistration <= endDate) {
          const receiptsResult = await window.electronAPI.getReceiptsByMember(member.id);
          const receipts = receiptsResult.success ? receiptsResult.data || [] : [];
          
          reportData.push({
            memberName: member.name,
            memberId: member.customMemberId || member.id,
            totalPaid: receipts.reduce((sum: number, r: any) => sum + (r.amount_paid || r.amount || 0), 0),
            balance: member.dueAmount || member.due_amount || 0,
            status: member.status || 'active',
            gstIncluded: false,
            phoneNumber: member.mobileNo,
            email: member.email,
            membershipType: member.planType,
            joiningDate: member.dateOfRegistration,
            expiryDate: member.subscriptionEndDate,
            courseEnrollment: member.planType,
            registrationFee: member.registrationFee || 0,
            packageFee: member.packageFee || member.membershipFees || 0,
            discount: member.discount || 0
          });
        }
      }

      return reportData.sort((a, b) => new Date(b.joiningDate || '').getTime() - new Date(a.joiningDate || '').getTime());
    } catch (error) {
      console.error('Error generating member course ledger report:', error);
      return [];
    }
  };

  // Enquiry Reports
  const generateEnquiryToEnrollReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const enquiriesResult = await window.electronAPI.getAllEnquiries();
      const membersResult = await db.getAllMembersWithDueAmounts();
      
      if (!enquiriesResult.success || !membersResult) return [];
      
      const enquiries = enquiriesResult.data || [];
      const members = membersResult || [];
      const reportData: ReportData[] = [];

      enquiries.forEach((enquiry: any) => {
        const enquiryDate = enquiry.created_at?.split('T')[0] || enquiry.date_of_enquiry;
        if (enquiryDate >= startDate && enquiryDate <= endDate) {
          const convertedMember = members.find(member => member.convertedFromEnquiry === enquiry.id);
          
          reportData.push({
            memberName: enquiry.name,
            totalPaid: 0,
            balance: 0,
            status: convertedMember ? 'enrolled' : 'pending',
            gstIncluded: false,
            enquiryDate: enquiryDate,
            conversionDate: convertedMember?.dateOfRegistration,
            followUpDate: enquiry.follow_up_date,
            phoneNumber: enquiry.mobile_no,
            email: enquiry.email || 'N/A',
            referredBy: enquiry.ref_person_name || 'Direct',
            interestedIn: enquiry.interested_in || 'General',
            enquiryStatus: enquiry.status
          });
        }
      });

      return reportData.sort((a, b) => {
        if (a.status === 'enrolled' && b.status !== 'enrolled') return -1;
        if (a.status !== 'enrolled' && b.status === 'enrolled') return 1;
        return new Date(b.enquiryDate || '').getTime() - new Date(a.enquiryDate || '').getTime();
      });
    } catch (error) {
      console.error('Error generating enquiry to enroll report:', error);
      return [];
    }
  };

  const generateEnquiryFollowupReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const enquiriesResult = await window.electronAPI.getAllEnquiries();
      if (!enquiriesResult.success) return [];
      
      const enquiries = enquiriesResult.data || [];
      const reportData: ReportData[] = [];
      const today = new Date().toISOString().split('T')[0];

      enquiries.forEach((enquiry: any) => {
        const followUpDate = enquiry.follow_up_date;
        if (followUpDate && followUpDate >= startDate && followUpDate <= endDate && enquiry.status !== 'converted') {
          const isOverdue = followUpDate < today;
          
          reportData.push({
            memberName: enquiry.name,
            totalPaid: 0,
            balance: 0,
            status: isOverdue ? 'overdue' : 'pending',
            gstIncluded: false,
            enquiryDate: enquiry.created_at?.split('T')[0] || enquiry.date_of_enquiry,
            followUpDate: followUpDate,
            phoneNumber: enquiry.mobile_no,
            email: enquiry.email || 'N/A',
            referredBy: enquiry.ref_person_name || 'Direct',
            interestedIn: enquiry.interested_in || 'General',
            enquiryStatus: enquiry.status,
            notes: enquiry.notes
          });
        }
      });

      return reportData.sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        return new Date(a.followUpDate || '').getTime() - new Date(b.followUpDate || '').getTime();
      });
    } catch (error) {
      console.error('Error generating enquiry followup report:', error);
      return [];
    }
  };

  const generateAllFollowupReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const enquiriesResult = await window.electronAPI.getAllEnquiries();
      if (!enquiriesResult.success) return [];
      
      const enquiries = enquiriesResult.data || [];
      const reportData: ReportData[] = [];

      enquiries.forEach((enquiry: any) => {
        const enquiryDate = enquiry.created_at?.split('T')[0] || enquiry.date_of_enquiry;
        if (enquiryDate >= startDate && enquiryDate <= endDate) {
          reportData.push({
            memberName: enquiry.name,
            totalPaid: 0,
            balance: 0,
            status: enquiry.status || 'new',
            gstIncluded: false,
            enquiryDate: enquiryDate,
            followUpDate: enquiry.follow_up_date,
            phoneNumber: enquiry.mobile_no,
            email: enquiry.email || 'N/A',
            referredBy: enquiry.ref_person_name || 'Direct',
            interestedIn: enquiry.interested_in || 'General',
            enquiryStatus: enquiry.status,
            notes: enquiry.notes
          });
        }
      });

      return reportData.sort((a, b) => new Date(b.enquiryDate || '').getTime() - new Date(a.enquiryDate || '').getTime());
    } catch (error) {
      console.error('Error generating all followup report:', error);
      return [];
    }
  };

  // Staff Reports
  const generateMemberInstructorAllocationReport = async (): Promise<ReportData[]> => {
    try {
      const memberData = await db.getAllMembersWithDueAmounts();
      const staffResult = await window.electronAPI.getAllStaff();
      const staff = staffResult.success ? staffResult.data || [] : [];
      const reportData: ReportData[] = [];

      const trainerAllocations: { [key: string]: { members: any[]; trainer: any } } = {};
      
      memberData?.forEach(member => {
        const trainerName = member.assignedTrainer || 'Unassigned';
        if (!trainerAllocations[trainerName]) {
          const trainer = staff.find(s => s.name === trainerName);
          trainerAllocations[trainerName] = { members: [], trainer };
        }
        trainerAllocations[trainerName].members.push(member);
      });

      Object.entries(trainerAllocations).forEach(([trainerName, data]) => {
        data.members.forEach(member => {
          reportData.push({
            memberName: member.name,
            memberId: member.customMemberId || member.id,
            totalPaid: 0,
            balance: member.dueAmount || member.due_amount || 0,
            status: member.status || 'active',
            gstIncluded: false,
            phoneNumber: member.mobileNo,
            email: member.email,
            membershipType: member.planType,
            assignedTrainer: trainerName,
            specialization: data.trainer?.specialization || 'General',
            joiningDate: member.dateOfRegistration
          });
        });
      });

      return reportData.sort((a, b) => {
        if (a.assignedTrainer !== b.assignedTrainer) {
          return a.assignedTrainer.localeCompare(b.assignedTrainer);
        }
        return a.memberName.localeCompare(b.memberName);
      });
    } catch (error) {
      console.error('Error generating member instructor allocation report:', error);
      return [];
    }
  };

  const generatePersonalInstructorReport = async (instructorFilter?: string): Promise<ReportData[]> => {
    try {
      const staffResult = await window.electronAPI.getAllStaff();
      if (!staffResult.success) return [];
      
      const staff = staffResult.data || [];
      const memberData = await db.getAllMembersWithDueAmounts();
      const reportData: ReportData[] = [];

      staff.forEach((staffMember: any) => {
        if (instructorFilter && instructorFilter !== 'all' && staffMember.name !== instructorFilter) {
          return;
        }

        const assignedMembers = memberData?.filter(member => 
          member.assignedTrainer === staffMember.name
        ) || [];

        reportData.push({
          instructorName: staffMember.name,
          memberName: staffMember.name,
          totalPaid: 0,
          balance: assignedMembers.length,
          status: staffMember.status || 'active',
          gstIncluded: false,
          phoneNumber: staffMember.mobileNo,
          email: staffMember.email,
          joiningDate: staffMember.joiningDate,
          specialization: staffMember.specialization || 'General Trainer',
          totalMembers: assignedMembers.length,
          activeMembers: assignedMembers.filter(m => m.status === 'active').length,
          membershipType: staffMember.designation || 'Trainer'
        });
      });

      return reportData.sort((a, b) => (b.totalMembers || 0) - (a.totalMembers || 0));
    } catch (error) {
      console.error('Error generating personal instructor report:', error);
      return [];
    }
  };

  // Comprehensive Report
  const generateDetailReport = async (startDate: string, endDate: string): Promise<ReportData[]> => {
    try {
      const receiptsResult = await window.electronAPI.getAllReceipts();
      const memberData = await db.getAllMembersWithDueAmounts();
      const enquiriesResult = await window.electronAPI.getAllEnquiries();
      const staffResult = await window.electronAPI.getAllStaff();
      
      const receipts = receiptsResult.success ? receiptsResult.data || [] : [];
      const enquiries = enquiriesResult.success ? enquiriesResult.data || [] : [];
      const staff = staffResult.success ? staffResult.data || [] : [];
      
      const filteredReceipts = receipts.filter((receipt: any) => {
        const receiptDate = receipt.created_at.split('T')[0];
        return receiptDate >= startDate && receiptDate <= endDate;
      });

      const totalRevenue = filteredReceipts.reduce((sum: number, r: any) => sum + (r.amount_paid || r.amount || 0), 0);
      const totalMembers = memberData?.length || 0;
      const activeMembers = memberData?.filter(m => m.status === 'active').length || 0;
      const totalEnquiries = enquiries.length;
      const convertedEnquiries = memberData?.filter(m => m.convertedFromEnquiry).length || 0;
      const totalStaff = staff.length;

      return [
        {
          category: 'Financial',
          memberName: 'Total Revenue',
          totalPaid: totalRevenue,
          balance: 0,
          status: 'summary',
          gstIncluded: false,
          description: `₹${totalRevenue.toLocaleString()} collected in selected period`,
          phoneNumber: 'Financial Summary',
          email: `₹${totalRevenue.toLocaleString()}`
        },
        {
          category: 'Members',
          memberName: 'Total Members',
          totalPaid: totalMembers,
          balance: 0,
          status: 'summary',
          gstIncluded: false,
          description: `${totalMembers} total members in system`,
          phoneNumber: 'Member Summary',
          email: `${totalMembers} total members`
        },
        {
          category: 'Members',
          memberName: 'Active Members',
          totalPaid: activeMembers,
          balance: 0,
          status: 'summary',
          gstIncluded: false,
          description: `${activeMembers} currently active members`,
          phoneNumber: 'Member Summary',
          email: `${activeMembers} active members`
        },
        {
          category: 'Enquiries',
          memberName: 'Total Enquiries',
          totalPaid: totalEnquiries,
          balance: 0,
          status: 'summary',
          gstIncluded: false,
          description: `${totalEnquiries} total enquiries received`,
          phoneNumber: 'Enquiry Summary',
          email: `${totalEnquiries} enquiries`
        },
        {
          category: 'Enquiries',
          memberName: 'Converted Enquiries',
          totalPaid: convertedEnquiries,
          balance: 0,
          status: 'summary',
          gstIncluded: false,
          description: `${convertedEnquiries} enquiries converted to members`,
          phoneNumber: 'Conversion Summary',
          email: `${convertedEnquiries} converted`
        },
        {
          category: 'Staff',
          memberName: 'Total Staff',
          totalPaid: totalStaff,
          balance: 0,
          status: 'summary',
          gstIncluded: false,
          description: `${totalStaff} staff members employed`,
          phoneNumber: 'Staff Summary',
          email: `${totalStaff} staff members`
        }
      ];
    } catch (error) {
      console.error('Error generating detail report:', error);
      return [];
    }
  };







  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-destructive text-destructive-foreground';
      case 'frozen': return 'bg-warning text-warning-foreground';
      case 'expired': return 'bg-destructive text-destructive-foreground';
      case 'expiring_soon': return 'bg-warning text-warning-foreground';
      case 'enrolled': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'partial': return 'bg-warning text-warning-foreground';
      case 'paid': return 'bg-success text-success-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getColumnClassName = (column: any, value: any) => {
    let className = '';
    
    if (column.type === 'currency' && typeof value === 'number') {
      className += value > 0 ? 'font-semibold text-green-600' : '';
    }
    
    if (column.id === 'balance' && typeof value === 'number') {
      className += value > 0 ? 'text-red-600 font-semibold' : 'text-green-600';
    }
    
    if (column.id === 'memberName') {
      className += 'font-medium';
    }
    
    if (column.id === 'memberId') {
      className += 'font-mono text-sm';
    }
    
    return className;
  };

  const formatCellValue = (column: any, value: unknown, row: ReportData) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    switch (column.type) {
      case 'currency':
        return `₹${(typeof value === 'number' ? value : 0).toLocaleString()}`;
      
      case 'date':
        try {
          return value ? format(new Date(value), 'MMM dd, yyyy') : 'N/A';
        } catch {
          return value || 'N/A';
        }
      
      case 'status':
        return (
          <Badge className={getStatusColor(value)}>
            {value}
          </Badge>
        );
      
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      
      case 'percentage':
        return typeof value === 'number' ? `${value.toFixed(2)}%` : value;
      
      default:
        return value || 'N/A';
    }
  };

  const getTableHeaders = (reportType: string | null) => {
    const config = Object.values(REPORT_CONFIGS).find(config => config.id === reportType);
    if (config) {
      return config.columns.map(col => ({
        label: col.label,
        className: col.width || 'w-auto'
      }));
    }

    // Fallback for unmapped report types
    return [
      { label: 'Name/Description', className: 'w-[20%]' },
      { label: 'Amount/Count', className: 'w-[15%]' },
      { label: 'Balance/Info', className: 'w-[15%]' },
      { label: 'Status', className: 'w-[12%]' },
      { label: 'Date/Period', className: 'w-[15%]' },
      { label: 'Contact', className: 'w-[12%]' },
      { label: 'Additional Info', className: 'w-[11%]' }
    ];

  };

  const renderTableRow = (reportType: string | null, row: ReportData, index: number) => {
    const config = Object.values(REPORT_CONFIGS).find(config => config.id === reportType);
    if (!config) return null;

    return (
      <>
        {config.columns.map((column, colIndex) => {
          const value = row[column.id as keyof ReportData];
          
          return (
            <TableCell key={colIndex} className={getColumnClassName(column, value)}>
              {formatCellValue(column, value, row)}
            </TableCell>
          );
        })}
      </>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {sidebarState === 'collapsed' && <SidebarTrigger />}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Reports</h1>
              <p className="text-muted-foreground">Comprehensive reporting and analytics dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${report.color} text-white group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateReport(report.id)}
                      disabled={isGeneratingReport}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                  <Button
                    onClick={() => openReportDialog(report)}
                    disabled={isGeneratingReport}
                    className="w-full"
                    variant={activeReport === report.id ? "default" : "outline"}
                  >
                    {isGeneratingReport && activeReport === report.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure & Generate
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>


      </div>

      {/* Report Configuration Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReportCard && (
                <>
                  <selectedReportCard.icon className="h-5 w-5" />
                  Configure {selectedReportCard.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedReportCard && (
            <div className="space-y-6">
              <p className="text-muted-foreground">{selectedReportCard.description}</p>

              {/* Date Range Configuration */}
              {selectedReportCard.requiresDateRange && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Date Range</Label>
                  <ReportDateRange
                    startDate={reportConfig.dateRange.startDate}
                    endDate={reportConfig.dateRange.endDate}
                    onStartDateChange={(date) =>
                      setReportConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, startDate: date }
                      }))
                    }
                    onEndDateChange={(date) =>
                      setReportConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, endDate: date }
                      }))
                    }
                  />
                </div>
              )}

              {/* Status Filter for Active Membership Report */}
              {selectedReportCard.id === 'active-membership' && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Membership Status</Label>
                  <Select
                    value={reportConfig.filters.status}
                    onValueChange={(value) =>
                      setReportConfig(prev => ({
                        ...prev,
                        filters: { ...prev.filters, status: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                      <SelectItem value="frozen">Frozen Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Month Filter for Birthday Report */}
              {selectedReportCard.id === 'birthday-report' && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Select Month</Label>
                  <Select
                    value={reportConfig.filters.month}
                    onValueChange={(value) =>
                      setReportConfig(prev => ({
                        ...prev,
                        filters: { ...prev.filters, month: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-01">January 2024</SelectItem>
                      <SelectItem value="2024-02">February 2024</SelectItem>
                      <SelectItem value="2024-03">March 2024</SelectItem>
                      <SelectItem value="2024-04">April 2024</SelectItem>
                      <SelectItem value="2024-05">May 2024</SelectItem>
                      <SelectItem value="2024-06">June 2024</SelectItem>
                      <SelectItem value="2024-07">July 2024</SelectItem>
                      <SelectItem value="2024-08">August 2024</SelectItem>
                      <SelectItem value="2024-09">September 2024</SelectItem>
                      <SelectItem value="2024-10">October 2024</SelectItem>
                      <SelectItem value="2024-11">November 2024</SelectItem>
                      <SelectItem value="2024-12">December 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Report Category Badge */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Category:</Label>
                <Badge variant="secondary" className="capitalize">
                  {selectedReportCard.category}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowReportDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => generateReport(selectedReportCard.id, reportConfig)}
                  disabled={isGeneratingReport}
                  className="min-w-[120px]"
                >
                  {isGeneratingReport ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Results Dialog */}
      <Dialog open={showReportResultsDialog} onOpenChange={setShowReportResultsDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedReportCard && (
                  <>
                    <selectedReportCard.icon className="h-5 w-5" />
                    {selectedReportCard.title} Results
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {reportData.length} records
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activeReport && generateReport(activeReport, reportConfig)}
                  disabled={isGeneratingReport}
                >
                  <RefreshCw className={`h-4 w-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <ReportExportActions
                  data={reportData}
                  filename={activeReport || 'report'}
                  recordCount={reportData.length}
                  onExcelExport={() => {
                    toast({
                      title: "Feature Coming Soon",
                      description: "Excel export will be available in the next update.",
                    });
                  }}
                />
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Report Configuration Summary */}
            {selectedReportCard && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{selectedReportCard.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {selectedReportCard.category}
                        </Badge>
                        {selectedReportCard.requiresDateRange && (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(reportConfig.dateRange.startDate), 'MMM dd, yyyy')} - {format(new Date(reportConfig.dateRange.endDate), 'MMM dd, yyyy')}
                          </span>
                        )}
                        {reportConfig.filters.status && reportConfig.filters.status !== 'all' && (
                          <Badge variant="secondary">
                            Status: {reportConfig.filters.status}
                          </Badge>
                        )}
                        {reportConfig.filters.month && selectedReportCard.id === 'birthday-report' && (
                          <Badge variant="secondary">
                            Month: {format(new Date(reportConfig.filters.month + '-01'), 'MMMM yyyy')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Data Table */}
            <Card>
              <CardContent className="p-0">
                {isGeneratingReport && (
                  <div className="p-6">
                    <ReportLoadingSkeleton rows={5} columns={7} />
                  </div>
                )}

                {!isGeneratingReport && reportData.length === 0 && (
                  <div className="p-6">
                    <ReportEmptyState
                      title="No Report Data"
                      description="No data available for the selected report criteria."
                    />
                  </div>
                )}

                {!isGeneratingReport && reportData.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[60vh] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            {getTableHeaders(activeReport).map((header, index) => (
                              <TableHead key={index} className={header.className}>
                                {header.label}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.map((row, index) => (
                            <TableRow key={index} className="hover:bg-muted/50">
                              {renderTableRow(activeReport, row, index)}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;