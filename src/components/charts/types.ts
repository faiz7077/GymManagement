export interface ChartData {
  [key: string]: any;
}

export interface ChartCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  category: 'financial' | 'member' | 'enquiry' | 'course';
  defaultChartType: 'bar' | 'pie' | 'line' | 'area' | 'composed';
  supportedTypes: ('bar' | 'pie' | 'line' | 'area' | 'composed')[];
}

export interface ChartConfig {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    period?: string;
    chartType?: 'bar' | 'pie' | 'line' | 'area' | 'composed';
    limit?: number;
    aggregation?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface ChartViewOptions {
  showBoth: boolean;
  primaryType: 'bar' | 'pie';
  showDataTable: boolean;
  enablePagination: boolean;
  maxDataPoints: number;
}