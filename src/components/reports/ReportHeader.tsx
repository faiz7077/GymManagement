import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ReportHeaderProps {
  title: string;
  icon: React.ReactNode;
  onGenerate: () => void;
  isGenerating: boolean;
  description?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  title,
  icon,
  onGenerate,
  isGenerating,
  description
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          {icon}
          <span>{title}</span>
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <Button 
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex items-center space-x-2"
      >
        {isGenerating && <RefreshCw className="h-4 w-4 animate-spin" />}
        <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
      </Button>
    </div>
  );
};