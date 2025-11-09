import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Lucide React Icons
import {
  BarChart3, TrendingUp, DollarSign, Users, Calendar, Phone, BookOpen,
  ChevronRight, Settings, Loader2, Maximize2, ChevronLeft, Download,
  FileText, PieChart as PieChartIcon, LineChart as LineChartIcon, Activity
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

// Hooks & Context
import { useToast } from '@/hooks/use-toast';

// Chart Components
import { ChartRenderer, chartCards } from '@/components/charts';
import { ChartData, ChartCard, ChartConfig, ChartViewOptions } from '@/components/charts/types';
import * as ChartGenerators from '@/components/charts/ChartDataGenerators';

export const Charts: React.FC = () => {
  const [activeChart, setActiveChart] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [showChartResultsDialog, setShowChartResultsDialog] = useState(false);
  const [selectedChartCard, setSelectedChartCard] = useState<ChartCard | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    dateRange: {
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    },
    filters: {
      period: 'monthly',
      chartType: 'bar',
      limit: 50,
      aggregation: 'monthly'
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0
    }
  });

  const [viewOptions, setViewOptions] = useState<ChartViewOptions>({
    showBoth: false,
    primaryType: 'bar',
    showDataTable: false,
    enablePagination: true,
    maxDataPoints: 100
  });

  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();

  // Memoized filtered and paginated data for performance
  const processedChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    let processed = [...chartData];
    
    // Apply data limit for large datasets
    if (processed.length > viewOptions.maxDataPoints) {
      processed = processed.slice(0, viewOptions.maxDataPoints);
    }
    
    // Apply pagination if enabled
    if (viewOptions.enablePagination) {
      const startIndex = (chartConfig.pagination.page - 1) * chartConfig.pagination.pageSize;
      const endIndex = startIndex + chartConfig.pagination.pageSize;
      processed = processed.slice(startIndex, endIndex);
    }
    
    return processed;
  }, [chartData, viewOptions, chartConfig.pagination]);

  const openChartDialog = (chartCard: ChartCard) => {
    setSelectedChartCard(chartCard);
    setChartConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        chartType: chartCard.defaultChartType
      }
    }));
    setViewOptions(prev => ({
      ...prev,
      primaryType: chartCard.defaultChartType === 'pie' ? 'pie' : 'bar'
    }));
    setShowChartDialog(true);
    setActiveChart(null);
    setChartData([]);
  };

  const generateChart = async (chartType: string, config?: ChartConfig) => {
    setActiveChart(chartType);
    setIsGeneratingChart(true);
    setShowChartDialog(false);

    try {
      let data: ChartData[] = [];
      const currentConfig = config || chartConfig;

      toast({
        title: "Generating Chart",
        description: "Processing data, please wait...",
      });

      switch (chartType) {
        // Financial Charts
        case 'collection-expense':
          data = await ChartGenerators.generateCollectionExpenseChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate, 
            currentConfig.filters.aggregation
          );
          break;
        case 'collection-trend':
          data = await ChartGenerators.generateCollectionTrendChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate, 
            currentConfig.filters.aggregation
          );
          break;
        case 'expense-breakdown':
          data = await ChartGenerators.generateExpenseBreakdownChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate
          );
          break;
        case 'revenue-analysis':
          data = await ChartGenerators.generateRevenueAnalysisChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate, 
            currentConfig.filters.aggregation
          );
          break;

        // Member Charts
        case 'member-admission':
          data = await ChartGenerators.generateMemberAdmissionChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate, 
            currentConfig.filters.aggregation
          );
          break;
        case 'membership-status':
          data = await ChartGenerators.generateMembershipStatusChart();
          break;
        case 'member-demographics':
          data = await ChartGenerators.generateMemberDemographicsChart();
          break;
        case 'membership-plans':
          data = await ChartGenerators.generateMembershipPlansChart();
          break;   
     // Enquiry Charts
        case 'enquiry-trend':
          data = await ChartGenerators.generateEnquiryTrendChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate, 
            currentConfig.filters.aggregation
          );
          break;
        case 'enquiry-to-member':
          data = await ChartGenerators.generateEnquiryToMemberChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate, 
            currentConfig.filters.aggregation
          );
          break;
        case 'enquiry-followup':
          data = await ChartGenerators.generateEnquiryFollowupChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate
          );
          break;
        case 'enquiry-executive':
          data = await ChartGenerators.generateEnquiryExecutiveChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate
          );
          break;

        // Course Charts
        case 'course-wise':
          data = await ChartGenerators.generateCourseWiseChart();
          break;
        case 'all-course-wise':
          data = await ChartGenerators.generateAllCourseWiseChart();
          break;
        case 'course-revenue':
          data = await ChartGenerators.generateCourseRevenueChart(
            currentConfig.dateRange.startDate, 
            currentConfig.dateRange.endDate
          );
          break;

        default:
          data = [];
      }

      // Update pagination info
      setChartConfig(prev => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          total: data.length
        }
      }));

      setChartData(data);
      setShowChartResultsDialog(true);

      toast({
        title: "Chart Generated",
        description: `${selectedChartCard?.title || 'Chart'} generated successfully with ${data.length} data points.`,
      });
    } catch (error) {
      console.error('Error generating chart:', error);
      toast({
        title: "Error",
        description: "Failed to generate chart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingChart(false);
    }
  };

  // Data table component for detailed view
  const renderDataTable = (data: ChartData[]) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    
    return (
      <div className="mt-6 border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2">
          <h4 className="font-semibold">Data Table</h4>
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-2 text-left font-medium">
                    {column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedChartData.map((row, index) => (
                <tr key={index} className="border-t">
                  {columns.map((column) => (
                    <td key={column} className="px-4 py-2">
                      {typeof row[column] === 'number' && (column.toLowerCase().includes('amount') || column.toLowerCase().includes('revenue') || column.toLowerCase().includes('value'))
                        ? `₹${row[column].toLocaleString()}`
                        : row[column]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };  
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
              Charts & Analytics
            </h1>
            <p className="text-muted-foreground">
              Interactive charts and visual insights for your gym data
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Performance Settings */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Chart Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Max Data Points</Label>
              <Select 
                value={viewOptions.maxDataPoints.toString()} 
                onValueChange={(value) => setViewOptions(prev => ({ ...prev, maxDataPoints: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 points</SelectItem>
                  <SelectItem value="100">100 points</SelectItem>
                  <SelectItem value="200">200 points</SelectItem>
                  <SelectItem value="500">500 points</SelectItem>
                  <SelectItem value="1000">1000 points</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Page Size</Label>
              <Select 
                value={chartConfig.pagination.pageSize.toString()} 
                onValueChange={(value) => setChartConfig(prev => ({ 
                  ...prev, 
                  pagination: { ...prev.pagination, pageSize: parseInt(value), page: 1 }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={viewOptions.enablePagination}
                onCheckedChange={(checked) => setViewOptions(prev => ({ ...prev, enablePagination: checked }))}
              />
              <Label>Enable Pagination</Label>
            </div>
          </div>
        </CardContent>
      </Card>   
   {/* Chart Categories */}
      <div className="grid gap-6">
        {/* Financial Charts */}
        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Financial Charts</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {chartCards.filter(card => card.category === 'financial').map((card) => {
                const Icon = card.icon;
                return (
                  <div 
                    key={card.id}
                    className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 group/chart"
                    onClick={() => openChartDialog(card)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 ${card.color} rounded-full`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-medium text-green-800 dark:text-green-200">{card.title}</h4>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-2">{card.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {card.supportedTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Member Charts */}
        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Member Charts</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {chartCards.filter(card => card.category === 'member').map((card) => {
                const Icon = card.icon;
                return (
                  <div 
                    key={card.id}
                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 group/chart"
                    onClick={() => openChartDialog(card)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 ${card.color} rounded-full`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">{card.title}</h4>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">{card.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {card.supportedTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card> 
       {/* Enquiry Charts */}
        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-purple-600" />
                <span>Enquiry Charts</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {chartCards.filter(card => card.category === 'enquiry').map((card) => {
                const Icon = card.icon;
                return (
                  <div 
                    key={card.id}
                    className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 group/chart"
                    onClick={() => openChartDialog(card)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 ${card.color} rounded-full`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-medium text-purple-800 dark:text-purple-200">{card.title}</h4>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">{card.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {card.supportedTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Course Charts */}
        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-orange-600" />
                <span>Course Charts</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {chartCards.filter(card => card.category === 'course').map((card) => {
                const Icon = card.icon;
                return (
                  <div 
                    key={card.id}
                    className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 group/chart"
                    onClick={() => openChartDialog(card)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 ${card.color} rounded-full`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-medium text-orange-800 dark:text-orange-200">{card.title}</h4>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">{card.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {card.supportedTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>   
   {/* Chart Configuration Dialog */}
      <Dialog open={showChartDialog} onOpenChange={setShowChartDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedChartCard?.icon && <selectedChartCard.icon className="h-5 w-5" />}
              <span>Configure {selectedChartCard?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={chartConfig.dateRange.startDate}
                  onChange={(e) => setChartConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, startDate: e.target.value }
                  }))}
                />
                <Input
                  type="date"
                  value={chartConfig.dateRange.endDate}
                  onChange={(e) => setChartConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, endDate: e.target.value }
                  }))}
                />
              </div>
            </div>

            {/* Chart Type Selection */}
            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select 
                value={chartConfig.filters.chartType} 
                onValueChange={(value: 'bar' | 'pie' | 'line' | 'area' | 'composed') => 
                  setChartConfig(prev => ({ ...prev, filters: { ...prev.filters, chartType: value } }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedChartCard?.supportedTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center space-x-2">
                        {type === 'bar' && <BarChart3 className="h-4 w-4" />}
                        {type === 'pie' && <PieChartIcon className="h-4 w-4" />}
                        {type === 'line' && <LineChartIcon className="h-4 w-4" />}
                        {type === 'area' && <Activity className="h-4 w-4" />}
                        {type === 'composed' && <BarChart3 className="h-4 w-4" />}
                        <span>{type.charAt(0).toUpperCase() + type.slice(1)} Chart</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Aggregation */}
            <div className="space-y-2">
              <Label>Data Aggregation</Label>
              <Select 
                value={chartConfig.filters.aggregation} 
                onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => 
                  setChartConfig(prev => ({ ...prev, filters: { ...prev.filters, aggregation: value } }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Options */}
            <div className="space-y-4">
              <Label>View Options</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-both" className="text-sm">Show Both Bar & Pie Charts</Label>
                  <Switch
                    id="show-both"
                    checked={viewOptions.showBoth}
                    onCheckedChange={(checked) => setViewOptions(prev => ({ ...prev, showBoth: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-table" className="text-sm">Show Data Table</Label>
                  <Switch
                    id="show-table"
                    checked={viewOptions.showDataTable}
                    onCheckedChange={(checked) => setViewOptions(prev => ({ ...prev, showDataTable: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowChartDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => generateChart(selectedChartCard?.id || '', chartConfig)}
                disabled={isGeneratingChart}
              >
                {isGeneratingChart ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Chart'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>    
      <Dialog open={showChartResultsDialog} onOpenChange={setShowChartResultsDialog}>
        <DialogContent className={`${isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-6xl max-h-[90vh]'} overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedChartCard?.icon && <selectedChartCard.icon className="h-5 w-5" />}
                <span>{selectedChartCard?.title}</span>
                {isGeneratingChart && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Chart Display */}
            <div className="min-h-[400px]">
              {isGeneratingChart ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Generating chart...</p>
                    <p className="text-sm text-muted-foreground mt-1">Processing {chartData.length} data points</p>
                  </div>
                </div>
              ) : selectedChartCard ? (
                <Tabs defaultValue="primary" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="primary">
                      {chartConfig.filters.chartType?.charAt(0).toUpperCase() + chartConfig.filters.chartType?.slice(1)} Chart
                    </TabsTrigger>
                    {viewOptions.showBoth && chartConfig.filters.chartType !== 'pie' && (
                      <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                    )}
                    {viewOptions.showBoth && chartConfig.filters.chartType !== 'bar' && (
                      <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="primary" className="mt-4">
                    <ChartRenderer 
                      chartCard={selectedChartCard} 
                      data={processedChartData} 
                      chartType={chartConfig.filters.chartType || 'bar'} 
                    />
                  </TabsContent>
                  
                  {viewOptions.showBoth && chartConfig.filters.chartType !== 'pie' && (
                    <TabsContent value="pie" className="mt-4">
                      <ChartRenderer 
                        chartCard={selectedChartCard} 
                        data={processedChartData} 
                        chartType="pie" 
                      />
                    </TabsContent>
                  )}
                  
                  {viewOptions.showBoth && chartConfig.filters.chartType !== 'bar' && (
                    <TabsContent value="bar" className="mt-4">
                      <ChartRenderer 
                        chartCard={selectedChartCard} 
                        data={processedChartData} 
                        chartType="bar" 
                      />
                    </TabsContent>
                  )}
                </Tabs>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No chart selected
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {viewOptions.enablePagination && chartData.length > chartConfig.pagination.pageSize && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((chartConfig.pagination.page - 1) * chartConfig.pagination.pageSize) + 1} to{' '}
                  {Math.min(chartConfig.pagination.page * chartConfig.pagination.pageSize, chartData.length)} of{' '}
                  {chartData.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChartConfig(prev => ({ 
                      ...prev, 
                      pagination: { ...prev.pagination, page: Math.max(1, prev.pagination.page - 1) }
                    }))}
                    disabled={chartConfig.pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {chartConfig.pagination.page} of {Math.ceil(chartData.length / chartConfig.pagination.pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChartConfig(prev => ({ 
                      ...prev, 
                      pagination: { 
                        ...prev.pagination, 
                        page: Math.min(Math.ceil(chartData.length / prev.pagination.pageSize), prev.pagination.page + 1) 
                      }
                    }))}
                    disabled={chartConfig.pagination.page >= Math.ceil(chartData.length / chartConfig.pagination.pageSize)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}        
    {/* Chart Summary */}
            {!isGeneratingChart && chartData.length > 0 && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-lg">{chartData.length}</p>
                    <p className="text-muted-foreground">Total Records</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{processedChartData.length}</p>
                    <p className="text-muted-foreground">Displayed</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{selectedChartCard?.category}</p>
                    <p className="text-muted-foreground">Category</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{chartConfig.filters.chartType}</p>
                    <p className="text-muted-foreground">Chart Type</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{format(new Date(), 'MMM dd')}</p>
                    <p className="text-muted-foreground">Generated</p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Table */}
            {viewOptions.showDataTable && !isGeneratingChart && renderDataTable(chartData)}

            {/* Action Buttons */}
            <div className="flex justify-between items-center border-t pt-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PNG
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowChartResultsDialog(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowChartResultsDialog(false);
                    setShowChartDialog(true);
                  }}
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Reconfigure
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};