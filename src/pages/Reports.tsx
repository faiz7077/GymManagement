import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';
import { format } from 'date-fns';

interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
  expenseBreakdown: {
    salaries: number;
    maintenance: number;
    food: number;
    other: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const expenseCategories = {
  salaries: { label: 'Staff Salaries', color: '#0088FE' },
  maintenance: { label: 'Maintenance', color: '#00C49F' },
  food: { label: 'Food & Beverages', color: '#FFBB28' },
  other: { label: 'Other Expenses', color: '#FF8042' }
};

export const Reports: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonthData, setCurrentMonthData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadReportsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load data for the entire year
      const yearlyData: MonthlyData[] = [];
      
      for (let month = 1; month <= 12; month++) {
        // Get receipts (revenue) for the month
        const receipts = await db.getAllReceipts();
        const monthReceipts = receipts.filter(receipt => {
          const receiptDate = new Date(receipt.created_at);
          return receiptDate.getFullYear() === selectedYear && receiptDate.getMonth() + 1 === month;
        });
        
        const revenue = monthReceipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);
        
        // Get expenses for the month
        const expenseReport = await db.getMonthlyExpenseReport(selectedYear, month);
        const expenses = expenseReport?.totalAmount || 0;
        const expenseBreakdown = expenseReport?.categoryTotals || {
          salaries: 0,
          maintenance: 0,
          food: 0,
          other: 0
        };
        
        const monthData: MonthlyData = {
          month: format(new Date(selectedYear, month - 1), 'MMM'),
          year: selectedYear,
          revenue,
          expenses,
          profit: revenue - expenses,
          expenseBreakdown
        };
        
        yearlyData.push(monthData);
        
        // Set current month data
        if (month === selectedMonth) {
          setCurrentMonthData(monthData);
        }
      }
      
      setMonthlyData(yearlyData);
    } catch (error) {
      console.error('Error loading reports data:', error);
      toast({
        title: "Error",
        description: "Failed to load reports data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, toast]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount).replace('₹', '₹');
  };

  const getPieChartData = () => {
    if (!currentMonthData) return [];
    
    return Object.entries(currentMonthData.expenseBreakdown)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: expenseCategories[key as keyof typeof expenseCategories].label,
        value,
        color: expenseCategories[key as keyof typeof expenseCategories].color
      }));
  };

  const yearlyTotals = monthlyData.reduce(
    (totals, month) => ({
      revenue: totals.revenue + month.revenue,
      expenses: totals.expenses + month.expenses,
      profit: totals.profit + month.profit
    }),
    { revenue: 0, expenses: 0, profit: 0 }
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
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
  ];

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Reports</h1>
          <p className="text-muted-foreground">Financial reports with revenue, expenses, and profit analysis</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={loadReportsData}
            disabled={loading}
            title="Refresh Reports"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading reports data...
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue ({selectedYear})</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(yearlyTotals.revenue)}</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Expenses ({selectedYear})</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(yearlyTotals.expenses)}</p>
                    </div>
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Net Profit ({selectedYear})</p>
                      <p className={`text-2xl font-bold ${yearlyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(yearlyTotals.profit)}
                      </p>
                    </div>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${yearlyTotals.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <DollarSign className={`h-4 w-4 ${yearlyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Month</p>
                      <p className="text-2xl font-bold">{months.find(m => m.value === selectedMonth)?.label}</p>
                      <p className={`text-sm ${currentMonthData && currentMonthData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currentMonthData ? formatCurrency(currentMonthData.profit) : '₹0'}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue vs Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue vs Expenses ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Profit Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Profit Trend ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#8884d8" 
                        strokeWidth={3}
                        name="Profit"
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Expense Breakdown Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  {getPieChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No expense data for selected month
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Summary ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {monthlyData.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <div className="font-medium">{month.month}</div>
                        <div className="flex space-x-4 text-sm">
                          <span className="text-green-600">+{formatCurrency(month.revenue)}</span>
                          <span className="text-red-600">-{formatCurrency(month.expenses)}</span>
                          <span className={`font-medium ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(month.profit)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Expense Categories */}
            {currentMonthData && (
              <Card>
                <CardHeader>
                  <CardTitle>Expense Categories - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(currentMonthData.expenseBreakdown).map(([category, amount]) => (
                      <div key={category} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {expenseCategories[category as keyof typeof expenseCategories].label}
                            </p>
                            <p className="text-xl font-bold">{formatCurrency(amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {currentMonthData.expenses > 0 ? 
                                `${((amount / currentMonthData.expenses) * 100).toFixed(1)}% of total` : 
                                '0% of total'
                              }
                            </p>
                          </div>
                          <div 
                            className="w-3 h-12 rounded"
                            style={{ backgroundColor: expenseCategories[category as keyof typeof expenseCategories].color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};