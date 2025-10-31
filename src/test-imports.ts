// Test file to verify all imports are working correctly
import { ReportData, ReportType } from '@/components/reports';
import { LegacyMember } from '@/utils/database';

// Test that types are properly exported
const testReportData: ReportData = {
  memberName: 'Test Member',
  totalPaid: 1000,
  balance: 500,
  status: 'active',
  gstIncluded: true
};

const testReportType: ReportType = ReportType.DAILY_INCOME;

console.log('Imports test passed:', { testReportData, testReportType });

export { testReportData, testReportType };