import React, { useState, useEffect } from 'react';
import { Settings, Phone, MessageSquare, Save, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';

interface WhatsAppSettings {
  adminPhone: string;
  gymName: string;
  enabled: boolean;
  welcomeTemplate: string;
  receiptTemplate: string;
  birthdayTemplate: string;
  expiryTemplate: string;
  attendanceTemplate: string;
  dueAmountTemplate: string;
}

export const WhatsAppSettings: React.FC = () => {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    adminPhone: '',
    gymName: 'Prime Fitness Health Point',
    enabled: true,
    welcomeTemplate: 'Dear {member_name}, Please Submit your Photo, Copy of ID in GYM. If You\'ve already submitted documents ignore this message. Team: {gym_name} 📋',
    receiptTemplate: 'Hi {member_name}, we\'ve received ₹{amount_paid}. Receipt #{receipt_number} is attached. Thank you for choosing {gym_name}! 🎉',
    birthdayTemplate: 'Dear {member_name}, Wish you a very Happy Birthday. May all your dreams come true. Team: {gym_name} 🎉',
    expiryTemplate: 'Hi {member_name}, your membership ends in {days} day(s) on {end_date}. Renew now to keep smashing your goals! ⚠️',
    attendanceTemplate: 'Hi {member_name}, we missed you at the gym lately. Let\'s get back on track together—see you soon? 💪',
    dueAmountTemplate: 'Hi {member_name}, your outstanding balance is ₹{due_amount}. Please clear it at your convenience to avoid service interruption. Thanks! 🙏'
  });
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load settings from database
      const adminPhone = await db.getSetting('whatsapp_admin_phone') || '';
      const gymName = await db.getSetting('gym_name') || 'Prime Fitness Health Point';
      const enabled = (await db.getSetting('whatsapp_enabled')) === 'true';
      
      setSettings(prev => ({
        ...prev,
        adminPhone,
        gymName,
        enabled
      }));
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(settings.adminPhone)) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number with country code (e.g., +919144605788)",
          variant: "destructive",
        });
        return;
      }

      // Save settings to database
      await db.setSetting('whatsapp_admin_phone', settings.adminPhone);
      await db.setSetting('gym_name', settings.gymName);
      await db.setSetting('whatsapp_enabled', settings.enabled.toString());
      
      // Update message templates
      await db.updateWhatsAppTemplate('welcome_message', settings.welcomeTemplate);
      await db.updateWhatsAppTemplate('receipt_created', settings.receiptTemplate);
      await db.updateWhatsAppTemplate('birthday_wish', settings.birthdayTemplate);
      await db.updateWhatsAppTemplate('membership_expiring', settings.expiryTemplate);
      await db.updateWhatsAppTemplate('attendance_reminder', settings.attendanceTemplate);
      await db.updateWhatsAppTemplate('due_amount_reminder', settings.dueAmountTemplate);

      toast({
        title: "Settings Saved",
        description: "WhatsApp automation settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast({
        title: "Error",
        description: "Failed to save WhatsApp settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestMessage = async () => {
    try {
      if (!testPhone) {
        toast({
          title: "Phone Number Required",
          description: "Please enter a phone number to send test message.",
          variant: "destructive",
        });
        return;
      }

      const testMessage = {
        id: `test_${Date.now()}`,
        member_id: 'test',
        member_name: 'Test User',
        member_phone: testPhone,
        message_type: 'test_message',
        message_content: `🧪 Test message from ${settings.gymName} WhatsApp automation system. If you received this, the system is working correctly! 👍`,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const result = await db.createWhatsAppMessage(testMessage);
      if (result.success) {
        toast({
          title: "Test Message Queued",
          description: "Test message has been queued for sending.",
        });
      } else {
        throw new Error('Failed to queue test message');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({
        title: "Error",
        description: "Failed to send test message.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
            WhatsApp Settings
          </h1>
          <p className="text-muted-foreground">Configure WhatsApp automation settings and message templates</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Basic Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminPhone">Your WhatsApp Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminPhone"
                    type="tel"
                    placeholder="+919144605788"
                    value={settings.adminPhone}
                    onChange={(e) => setSettings(prev => ({ ...prev, adminPhone: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your WhatsApp number with country code (e.g., +91 for India)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gymName">Gym Name</Label>
                <Input
                  id="gymName"
                  placeholder="Prime Fitness Health Point"
                  value={settings.gymName}
                  onChange={(e) => setSettings(prev => ({ ...prev, gymName: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="enabled">Enable WhatsApp Automation</Label>
            </div>
          </CardContent>
        </Card>

        {/* Test Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span>Test WhatsApp Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="testPhone">Test Phone Number</Label>
                <Input
                  id="testPhone"
                  type="tel"
                  placeholder="+919144605788"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleTestMessage} variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Test Message
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Send a test message to verify your WhatsApp automation is working correctly.
            </p>
          </CardContent>
        </Card>

        {/* Message Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Message Templates</CardTitle>
            <p className="text-sm text-muted-foreground">
              Customize the automated messages sent to members. Use placeholders like {'{member_name}'}, {'{amount_paid}'}, {'{gym_name}'}, etc.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="welcomeTemplate">Welcome Message</Label>
                <Textarea
                  id="welcomeTemplate"
                  rows={3}
                  value={settings.welcomeTemplate}
                  onChange={(e) => setSettings(prev => ({ ...prev, welcomeTemplate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptTemplate">Receipt Confirmation</Label>
                <Textarea
                  id="receiptTemplate"
                  rows={3}
                  value={settings.receiptTemplate}
                  onChange={(e) => setSettings(prev => ({ ...prev, receiptTemplate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdayTemplate">Birthday Wish</Label>
                <Textarea
                  id="birthdayTemplate"
                  rows={3}
                  value={settings.birthdayTemplate}
                  onChange={(e) => setSettings(prev => ({ ...prev, birthdayTemplate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryTemplate">Membership Expiry</Label>
                <Textarea
                  id="expiryTemplate"
                  rows={3}
                  value={settings.expiryTemplate}
                  onChange={(e) => setSettings(prev => ({ ...prev, expiryTemplate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendanceTemplate">Attendance Reminder</Label>
                <Textarea
                  id="attendanceTemplate"
                  rows={3}
                  value={settings.attendanceTemplate}
                  onChange={(e) => setSettings(prev => ({ ...prev, attendanceTemplate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueAmountTemplate">Due Amount Reminder</Label>
                <Textarea
                  id="dueAmountTemplate"
                  rows={3}
                  value={settings.dueAmountTemplate}
                  onChange={(e) => setSettings(prev => ({ ...prev, dueAmountTemplate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Placeholders */}
        <Card>
          <CardHeader>
            <CardTitle>Available Placeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Member Info:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• {'{member_name}'}</li>
                  <li>• {'{member_phone}'}</li>
                  <li>• {'{member_id}'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Payment Info:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• {'{amount_paid}'}</li>
                  <li>• {'{due_amount}'}</li>
                  <li>• {'{receipt_number}'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Dates:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• {'{start_date}'}</li>
                  <li>• {'{end_date}'}</li>
                  <li>• {'{days}'} (until expiry)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Gym Info:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• {'{gym_name}'}</li>
                  <li>• {'{plan_type}'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};