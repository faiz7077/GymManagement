import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Gift, Building2, Calculator, Calendar } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface ReportQuickActionsProps {
  onActionClick: (reportType: string) => void;
}

export const ReportQuickActions: React.FC<ReportQuickActionsProps> = ({
  onActionClick
}) => {
  const quickActions: QuickAction[] = [
    {
      id: 'active-membership',
      label: 'Active Members',
      icon: <Users className="h-3 w-3" />,
      onClick: () => onActionClick('active-membership')
    },
    {
      id: 'birthday-report',
      label: 'Birthdays',
      icon: <Gift className="h-3 w-3" />,
      onClick: () => onActionClick('birthday-report')
    },
    {
      id: 'staff-allocation',
      label: 'Staff Report',
      icon: <Building2 className="h-3 w-3" />,
      onClick: () => onActionClick('staff-allocation')
    },
    {
      id: 'gst-report',
      label: 'GST Report',
      icon: <Calculator className="h-3 w-3" />,
      onClick: () => onActionClick('gst-report')
    },
    {
      id: 'membership-end-date',
      label: 'End Date Report',
      icon: <Calendar className="h-3 w-3" />,
      onClick: () => onActionClick('membership-end-date')
    }
  ];

  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
      {quickActions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="flex items-center space-x-1"
        >
          {action.icon}
          <span className="text-xs">{action.label}</span>
        </Button>
      ))}
    </div>
  );
};