import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface ReportEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const ReportEmptyState: React.FC<ReportEmptyStateProps> = ({
  title = "No Data Available",
  description = "No data found for the selected criteria. Try adjusting your filters or date range.",
  icon = <FileText className="h-12 w-12 text-muted-foreground" />
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon}
        <h3 className="mt-4 text-lg font-semibold text-muted-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};