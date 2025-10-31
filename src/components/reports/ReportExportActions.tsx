import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

interface ReportExportActionsProps {
  data: any[];
  filename: string;
  onExcelExport?: () => void;
  recordCount?: number;
}

export const ReportExportActions: React.FC<ReportExportActionsProps> = ({
  data,
  filename,
  onExcelExport,
  recordCount
}) => {
  const exportToCSV = () => {
    if (data.length === 0) return;
    
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <h4 className="text-md font-semibold">
        Report Results {recordCount && `(${recordCount} records)`}
      </h4>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          className="flex items-center space-x-1"
          disabled={data.length === 0}
        >
          <Download className="h-3 w-3" />
          <span>Export CSV</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExcelExport}
          className="flex items-center space-x-1"
          disabled={data.length === 0}
        >
          <FileSpreadsheet className="h-3 w-3" />
          <span>Export Excel</span>
        </Button>
      </div>
    </div>
  );
};