import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Receipt, 
  FileText, 
  Briefcase, 
  CreditCard, 
  Activity,
  Settings as SettingsIcon
} from 'lucide-react';
import { PackageSettings } from './PackageSettings';
import { TaxSettings } from './TaxSettings';
import { ExpenseCategorySettings } from './ExpenseCategorySettings';
import { OccupationSettings } from './OccupationSettings';
import { PaymentTypeSettings } from './PaymentTypeSettings';
import { BodyMeasurementFieldSettings } from './BodyMeasurementFieldSettings';

export const MasterSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('packages');

  const masterDataTabs = [
    {
      id: 'packages',
      label: 'Packages',
      icon: Package,
      description: 'Manage membership packages and pricing plans',
      component: PackageSettings
    },
    {
      id: 'tax-settings',
      label: 'Tax Settings',
      icon: Receipt,
      description: 'Configure tax rates and types (CGST, SGST, etc.)',
      component: TaxSettings
    },
    {
      id: 'expense-categories',
      label: 'Expense Categories',
      icon: FileText,
      description: 'Define categories for expense tracking',
      component: ExpenseCategorySettings
    },
    {
      id: 'occupations',
      label: 'Occupations',
      icon: Briefcase,
      description: 'Manage list of member occupations',
      component: OccupationSettings
    },
    {
      id: 'payment-types',
      label: 'Payment Types',
      icon: CreditCard,
      description: 'Configure available payment methods',
      component: PaymentTypeSettings
    },
    {
      id: 'body-measurements',
      label: 'Body Measurement Fields',
      icon: Activity,
      description: 'Define custom body measurement fields',
      component: BodyMeasurementFieldSettings
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Master Settings
        </CardTitle>
        <CardDescription>
          Configure master data used throughout the application. Changes here will affect all forms and records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-auto p-1">
            {masterDataTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex flex-col gap-1 p-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {masterDataTabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">{tab.description}</p>
                </div>
                <Component />
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Info Card */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <SettingsIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Important Notes</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Master settings changes affect all forms and existing records</li>
                <li>• Deactivating items will hide them from new forms but preserve historical data</li>
                <li>• Package pricing can be overridden in individual receipts and member forms</li>
                <li>• Tax settings support both inclusive and exclusive calculations</li>
                <li>• Body measurement fields can be customized with units and validation</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
