import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Clock, CheckCircle, XCircle, Users, TrendingUp, Settings, RefreshCw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';
import { format } from 'date-fns';

interface WhatsAppMessage {
  id: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  message_type: string;
  message_content: string;
  status: 'pending' | 'opened' | 'sent' | 'failed' | 'scheduled';
  scheduled_at?: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

const messageTypeLabels = {
  receipt_created: 'Receipt Created',
  membership_expiring: 'Membership Expiring',
  attendance_reminder: 'Attendance Reminder',
  due_amount_reminder: 'Due Amount Reminder',
  birthday_wish: 'Birthday Wish',
  welcome_message: 'Welcome Message',
  renewal_reminder: 'Renewal Reminder'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  opened: 'bg-orange-100 text-orange-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  scheduled: 'bg-blue-100 text-blue-800'
};

export const WhatsAppAutomation: React.FC = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    todayCount: 0
  });
  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const messagesData = await db.getAllWhatsAppMessages();
      setMessages(messagesData);

      // Calculate stats
      const today = new Date().toDateString();
      const todayMessages = messagesData.filter(msg =>
        new Date(msg.created_at).toDateString() === today
      );

      setStats({
        total: messagesData.length,
        sent: messagesData.filter(msg => msg.status === 'sent').length,
        pending: messagesData.filter(msg => msg.status === 'pending' || msg.status === 'opened').length,
        failed: messagesData.filter(msg => msg.status === 'failed').length,
        todayCount: todayMessages.length
      });
    } catch (error) {
      console.error('Error loading WhatsApp messages:', error);
      toast({
        title: "Error",
        description: "Failed to load WhatsApp messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterMessages = useCallback(() => {
    let filtered = messages;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(msg => msg.message_type === typeFilter);
    }

    setFilteredMessages(filtered);
  }, [messages, statusFilter, typeFilter]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    filterMessages();
  }, [filterMessages]);

  const handleRetryMessage = async (messageId: string) => {
    try {
      const result = await db.retryWhatsAppMessage(messageId);
      if (result.success) {
        toast({
          title: "Message Queued",
          description: "Message has been queued for retry.",
        });
        loadMessages();
      } else {
        throw new Error(result.error || 'Failed to retry message');
      }
    } catch (error) {
      console.error('Error retrying message:', error);
      toast({
        title: "Error",
        description: "Failed to retry message.",
        variant: "destructive",
      });
    }
  };

  const handleDebugBirthdays = async () => {
    try {
      console.log('🔍 Debug: Checking birthday logic...');

      toast({
        title: "Debugging Birthdays",
        description: "This will trigger birthday messages in debug mode. Check console for details...",
      });

      // For now, let's use the existing triggerBirthdayMessages which has debug info
      const result = await db.triggerBirthdayMessages();

      console.log('🔍 Debug result - messages created:', result);

      toast({
        title: "Debug Complete",
        description: `Debug completed. ${result} birthday messages would be created. Check console for detailed debug info.`,
      });

      // Reload messages to see any that were created
      loadMessages();

    } catch (error) {
      console.error('Error debugging birthdays:', error);
      toast({
        title: "Debug Error",
        description: "Failed to debug birthdays. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleTriggerBirthdayMessages = async () => {
    try {
      console.log('🎂 Triggering birthday messages for today...');

      toast({
        title: "Checking Birthdays",
        description: "Looking for members with birthday today...",
      });

      const result = await db.triggerBirthdayMessages();

      if (result > 0) {
        toast({
          title: "Birthday Messages Created",
          description: `${result} birthday messages have been queued for members with birthday today.`,
        });
        console.log(`🎉 Created ${result} birthday messages`);
      } else {
        toast({
          title: "No Birthdays Today",
          description: "No members have their birthday today. No messages were created.",
        });
        console.log('📅 No members have birthday today');
      }

      loadMessages();
    } catch (error) {
      console.error('Error triggering birthday messages:', error);
      toast({
        title: "Error",
        description: "Failed to trigger birthday messages.",
        variant: "destructive",
      });
    }
  };

  const handleTriggerExpiryReminders = async () => {
    try {
      const result = await db.triggerExpiryReminders();
      toast({
        title: "Expiry Reminders Triggered",
        description: `${result} expiry reminder messages have been queued.`,
      });
      loadMessages();
    } catch (error) {
      console.error('Error triggering expiry reminders:', error);
      toast({
        title: "Error",
        description: "Failed to trigger expiry reminders.",
        variant: "destructive",
      });
    }
  };

  const handleTriggerAttendanceReminders = async () => {
    try {
      const result = await db.triggerAttendanceReminders();
      toast({
        title: "Attendance Reminders Triggered",
        description: `${result} attendance reminder messages have been queued.`,
      });
      loadMessages();
    } catch (error) {
      console.error('Error triggering attendance reminders:', error);
      toast({
        title: "Error",
        description: "Failed to trigger attendance reminders.",
        variant: "destructive",
      });
    }
  };

  const handleSendPendingMessages = async () => {
    try {
      console.log('🚀 Starting to process pending WhatsApp messages...');

      toast({
        title: "Opening WhatsApp",
        description: "Opening WhatsApp for pending messages. Please wait...",
      });

      const result = await db.processPendingWhatsAppMessages();

      console.log(`🌐 Opened WhatsApp for ${result} messages`);

      toast({
        title: "WhatsApp Opened",
        description: `WhatsApp opened for ${result} messages. Send them manually and click "Mark as Sent" for each.`,
      });

      // Reload messages after a short delay to see status updates
      setTimeout(() => {
        loadMessages();
      }, 3000);
    } catch (error) {
      console.error('Error processing pending messages:', error);
      toast({
        title: "Error",
        description: "Failed to process pending messages. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      console.log('🧪 Testing WhatsApp integration...');

      // Create a test message
      const testMessage = {
        phone: '+919999999999', // Test number
        message: 'This is a test message from Prime Fitness Health Point WhatsApp automation system. 🏋️‍♂️',
        memberName: 'Test User'
      };

      toast({
        title: "Testing WhatsApp",
        description: "Opening WhatsApp Web with test message...",
      });

      const result = await window.electronAPI.sendWhatsAppMessage(testMessage);

      if (result.success) {
        toast({
          title: "Test Successful",
          description: "WhatsApp Web should have opened with the test message. You can modify the number and send it.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      toast({
        title: "Test Failed",
        description: "Failed to test WhatsApp integration. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleSendIndividualMessage = async (message: WhatsAppMessage) => {
    try {
      console.log(`📱 Opening WhatsApp for ${message.member_name}...`);

      toast({
        title: "Opening WhatsApp",
        description: `Opening WhatsApp for ${message.member_name}...`,
      });

      // Send the message using WhatsApp integration
      const result = await window.electronAPI.sendWhatsAppMessage({
        phone: message.member_phone,
        message: message.message_content,
        memberName: message.member_name
      });

      if (result.success) {
        // Update the message status to opened (WhatsApp opened, but not yet sent)
        const updateResult = await db.updateWhatsAppMessageStatus(
          message.id,
          'opened',
          null,
          null
        );

        if (updateResult.success) {
          toast({
            title: "WhatsApp Opened",
            description: `WhatsApp opened for ${message.member_name}. Click "Mark as Sent" after you send the message.`,
          });

          // Reload messages to show updated status
          loadMessages();
        }
      } else {
        // Update the message status to failed
        await db.updateWhatsAppMessageStatus(
          message.id,
          'failed',
          null,
          result.error || 'Failed to open WhatsApp'
        );

        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`Error opening WhatsApp for ${message.member_name}:`, error);
      toast({
        title: "Failed to Open WhatsApp",
        description: `Failed to open WhatsApp for ${message.member_name}. ${error.message}`,
        variant: "destructive",
      });

      // Reload messages to show any status changes
      loadMessages();
    }
  };

  const handleMarkAsSent = async (message: WhatsAppMessage) => {
    try {
      console.log(`✅ Marking message as sent for ${message.member_name}...`);

      // Update the message status to sent
      const updateResult = await db.updateWhatsAppMessageStatus(
        message.id,
        'sent',
        new Date().toISOString(),
        null
      );

      if (updateResult.success) {
        toast({
          title: "Message Marked as Sent",
          description: `Message to ${message.member_name} has been marked as sent.`,
        });

        // Reload messages to show updated status
        loadMessages();
      } else {
        throw new Error('Failed to update message status');
      }
    } catch (error) {
      console.error(`Error marking message as sent for ${message.member_name}:`, error);
      toast({
        title: "Error",
        description: `Failed to mark message as sent for ${message.member_name}.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
              WhatsApp Automation
            </h1>
            <p className="text-muted-foreground">Automated messaging system for member communication</p>
          </div>
        </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSendPendingMessages} variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
              📤 Open WhatsApp for Pending ({stats.pending})
            </Button>
            <Button onClick={handleTestWhatsApp} variant="secondary" size="sm">
              🧪 Test WhatsApp
            </Button>
            <Button onClick={handleDebugBirthdays} variant="secondary" size="sm">
              🔍 Debug Birthdays
            </Button>
            <Button onClick={handleTriggerBirthdayMessages} variant="outline" size="sm">
              🎂 Birthday Messages
            </Button>
            <Button onClick={handleTriggerExpiryReminders} variant="outline" size="sm">
              ⏰ Expiry Reminders
            </Button>
            <Button onClick={handleTriggerAttendanceReminders} variant="outline" size="sm">
              🏋️ Attendance Reminders
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.sent}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.todayCount}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages Table */}
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Messages</CardTitle>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="opened">Opened</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(messageTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading messages...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages found matching your criteria.
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-600 hover:bg-blue-600">
                        <TableHead className="text-white font-bold border-r border-red-500 text-center">Member</TableHead>
                        <TableHead className="text-white font-bold border-r border-red-500 text-center">Phone</TableHead>
                        <TableHead className="text-white font-bold border-r border-red-500 text-center">Type</TableHead>
                        <TableHead className="text-white font-bold border-r border-red-500 text-center">Message</TableHead>
                        <TableHead className="text-white font-bold border-r border-red-500 text-center">Status</TableHead>
                        <TableHead className="text-white font-bold border-r border-red-500 text-center">Created</TableHead>
                        <TableHead className="text-white font-bold border-r border-red-500 text-center">Sent</TableHead>
                        <TableHead className="text-white font-bold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMessages.map((message, index) => (
                        <TableRow
                          key={message.id}
                          className={`hover:bg-blue-50 border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <TableCell className="border-r text-center py-3 font-medium">{message.member_name}</TableCell>
                          <TableCell className="border-r text-center py-3">{message.member_phone}</TableCell>
                          <TableCell className="border-r text-center py-3">
                            <Badge variant="outline">
                              {messageTypeLabels[message.message_type as keyof typeof messageTypeLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell className="border-r py-3 max-w-xs">
                            <div className="truncate" title={message.message_content}>
                              {message.message_content}
                            </div>
                          </TableCell>
                          <TableCell className="border-r text-center py-3">
                            <Badge className={statusColors[message.status]}>
                              {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="border-r text-center py-3">
                            {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="border-r text-center py-3">
                            {message.sent_at ? format(new Date(message.sent_at), 'dd/MM/yyyy HH:mm') : '-'}
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <div className="flex gap-1 justify-center">
                              {message.status === 'pending' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleSendIndividualMessage(message)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  title="Open WhatsApp for this message"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              {message.status === 'opened' && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleMarkAsSent(message)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    title="Mark as sent after you've sent the message"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendIndividualMessage(message)}
                                    title="Open WhatsApp again"
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {message.status === 'failed' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRetryMessage(message.id)}
                                  title="Retry failed message"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              {message.status === 'sent' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendIndividualMessage(message)}
                                  title="Send again"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Automation Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Automated Messages</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Welcome messages for new members</li>
                    <li>• Receipt confirmations for payments</li>
                    <li>• Birthday wishes (daily at 9 AM)</li>
                    <li>• Membership expiry reminders (7 days before)</li>
                    <li>• Attendance reminders (every 3 days for inactive members)</li>
                    <li>• Due amount reminders</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">System Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Automation Service:</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Tasks:</span>
                      <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Message Processing:</span>
                      <Badge className="bg-green-100 text-green-800">Running</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>How WhatsApp Integration Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📱 Message Sending Process</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                    <li>Messages are queued when events occur (receipts, expiry, etc.)</li>
                    <li>Click "Send Pending Messages" to open WhatsApp for all pending messages</li>
                    <li>WhatsApp Web will open in your browser for each message (status: "Opened")</li>
                    <li>Manually send the message in WhatsApp (you can modify it if needed)</li>
                    <li>Click "Mark as Sent" button to confirm the message was sent</li>
                    <li>Only then will the message status change to "Sent"</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                    <li>Make sure you're logged into WhatsApp Web in your browser</li>
                    <li>Each message will open a new WhatsApp chat window</li>
                    <li>You have control over what gets sent - review before sending</li>
                    <li>Phone numbers are automatically formatted for WhatsApp</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Best Practices</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                    <li>Process messages during business hours for better response</li>
                    <li>Review message content before sending in WhatsApp</li>
                    <li>Keep your WhatsApp Web session active</li>
                    <li>Always click "Mark as Sent" after sending to track properly</li>
                    <li>Process messages in small batches to avoid overwhelming</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      );
};