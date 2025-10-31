import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Download, Calendar } from 'lucide-react';
import { db } from '@/utils/database';
import { toast } from 'sonner';

interface TransactionData {
  userId: string;
  name: string;
  transactionNo: string;
  feesDeposit: number;
  depositDate: string;
  startingDate: string;
  endingDate: string;
}

const MonthlyTransactionReport: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const isLoadingRef = useRef(false);
  const { state: sidebarState } = useSidebar();

  const months = useMemo(() => [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ], []);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const fetchTransactionReport = useCallback(async () => {
    if (isLoadingRef.current) return; // Prevent multiple simultaneous calls

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const result = await db.getMonthlyTransactionReport(selectedMonth, selectedYear);

      if (result.success && result.data) {
        setTransactions(result.data);
        const total = result.data.reduce((sum: number, transaction: TransactionData) =>
          sum + (transaction.feesDeposit || 0), 0
        );
        setTotalAmount(total);
      } else {
        toast.error(result.error || 'Failed to fetch transaction report');
        setTransactions([]);
        setTotalAmount(0);
      }
    } catch (error) {
      console.error('Error fetching transaction report:', error);
      toast.error('Failed to fetch transaction report. Please try again.');
      setTransactions([]);
      setTotalAmount(0);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const downloadCSV = () => {
    if (transactions.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['User Id', 'Name', 'TNo.', 'Fees Deposit', 'Deposit Date', 'Starting Date', 'Ending Date'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(transaction => [
        transaction.userId,
        `"${transaction.name}"`,
        transaction.transactionNo,
        transaction.feesDeposit,
        transaction.depositDate,
        transaction.startingDate,
        transaction.endingDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `monthly_transaction_report_${selectedMonth}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV file downloaded successfully');
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTransactionReport();
    }, 100); // Small debounce to prevent rapid calls

    return () => clearTimeout(timeoutId);
  }, [fetchTransactionReport]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Monthly Transaction Report</h1>
        </div>
        <Button onClick={downloadCSV} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction Filters</span>
            <div className="text-sm font-normal text-muted-foreground">
              Total Amount: ₹{totalAmount.toLocaleString()}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-red-600 text-white">
          <CardTitle className="text-center text-xl font-bold">
            Monthly Transaction - GYM
          </CardTitle>
          <div className="text-center text-lg font-semibold">
            {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
              <p className="text-gray-600">Loading transaction report...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-600 hover:bg-red-600">
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">User Id</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Name</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">TNo.</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Fees Deposit</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Deposit Date</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Starting Date</TableHead>
                    <TableHead className="text-white font-bold text-center">Ending Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground border">
                        No transactions found for the selected month and year
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction, index) => (
                      <TableRow
                        key={index}
                        className={`hover:bg-blue-50 border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <TableCell className="font-medium border-r text-center py-3">{transaction.userId}</TableCell>
                        <TableCell className="border-r text-center py-3">{transaction.name}</TableCell>
                        <TableCell className="border-r text-center py-3">{transaction.transactionNo}</TableCell>
                        <TableCell className="border-r text-center font-semibold py-3 text-green-700">₹{transaction.feesDeposit.toLocaleString()}</TableCell>
                        <TableCell className="border-r text-center py-3">{transaction.depositDate}</TableCell>
                        <TableCell className="border-r text-center py-3">{transaction.startingDate}</TableCell>
                        <TableCell className="text-center py-3">{transaction.endingDate}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {transactions.length > 0 && (
                <div className="mt-0 border-t-2 border-gray-300">
                  <div className="bg-gray-100 p-4 flex justify-between items-center font-bold text-lg">
                    <span>Total Transactions: {transactions.length}</span>
                    <span className="text-green-700">Total Amount: ₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyTransactionReport;