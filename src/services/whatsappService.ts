// WhatsApp Automation Service
// This service handles automated WhatsApp messaging for the gym management system

import { db } from '@/utils/database';

export interface WhatsAppMessage {
  id: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  message_type: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed' | 'scheduled';
  scheduled_at?: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

export class WhatsAppAutomationService {
  private static instance: WhatsAppAutomationService;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): WhatsAppAutomationService {
    if (!WhatsAppAutomationService.instance) {
      WhatsAppAutomationService.instance = new WhatsAppAutomationService();
    }
    return WhatsAppAutomationService.instance;
  }

  // Start the automation service
  start() {
    if (this.isRunning) return;
    
    console.log('🤖 WhatsApp Automation Service started');
    this.isRunning = true;
    
    // Process messages every 30 seconds
    this.intervalId = setInterval(() => {
      this.processMessages();
    }, 30000);

    // Run daily tasks at 9 AM
    this.scheduleDailyTasks();
    
    // Process any pending messages immediately
    this.processMessages();
  }

  // Stop the automation service
  stop() {
    if (!this.isRunning) return;
    
    console.log('🛑 WhatsApp Automation Service stopped');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Process pending WhatsApp messages
  private async processMessages() {
    try {
      const pendingMessages = await db.getPendingWhatsAppMessages();
      
      for (const message of pendingMessages) {
        await this.sendMessage(message);
        // Add small delay between messages to avoid rate limiting
        await this.delay(1000);
      }
    } catch (error) {
      console.error('Error processing WhatsApp messages:', error);
    }
  }

  // Send individual WhatsApp message
  private async sendMessage(message: WhatsAppMessage) {
    try {
      console.log(`📱 Sending WhatsApp message to ${message.member_name} (${message.member_phone})`);
      console.log(`📝 Message: ${message.message_content}`);
      
      // For free WhatsApp automation, we'll use WhatsApp Web API or similar
      // This is a placeholder for the actual WhatsApp sending logic
      const success = await this.sendViaWhatsAppWeb(message);
      
      if (success) {
        await db.updateWhatsAppMessageStatus(
          message.id, 
          'sent', 
          new Date().toISOString()
        );
        console.log(`✅ Message sent successfully to ${message.member_name}`);
      } else {
        await db.updateWhatsAppMessageStatus(
          message.id, 
          'failed', 
          null, 
          'Failed to send message'
        );
        console.log(`❌ Failed to send message to ${message.member_name}`);
      }
    } catch (error) {
      console.error(`Error sending message to ${message.member_name}:`, error);
      await db.updateWhatsAppMessageStatus(
        message.id, 
        'failed', 
        null, 
        error.message
      );
    }
  }

  // Real WhatsApp Web automation using Electron IPC
  private async sendViaWhatsAppWeb(message: WhatsAppMessage): Promise<boolean> {
    try {
      console.log(`🔄 Attempting to send WhatsApp message to ${message.member_phone}`);
      console.log(`📄 Content: ${message.message_content}`);
      
      // Use Electron IPC to send message via main process
      const result = await window.electronAPI.sendWhatsAppMessage({
        phone: message.member_phone,
        message: message.message_content,
        memberName: message.member_name
      });
      
      if (result.success) {
        console.log(`✅ WhatsApp message sent successfully to ${message.member_name}`);
        return true;
      } else {
        console.error(`❌ Failed to send WhatsApp message to ${message.member_name}: ${result.error}`);
        return false;
      }
      
    } catch (error) {
      console.error('WhatsApp Web send error:', error);
      return false;
    }
  }

  // Schedule daily automated tasks
  private scheduleDailyTasks() {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0); // 9:00 AM
    
    // If it's already past 9 AM today, schedule for tomorrow
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilScheduled = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.runDailyTasks();
      // Schedule to run every 24 hours
      setInterval(() => {
        this.runDailyTasks();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilScheduled);
  }

  // Run daily automated tasks
  private async runDailyTasks() {
    console.log('🕘 Running daily WhatsApp automation tasks...');
    
    try {
      // Send birthday wishes
      const birthdayMessages = await db.triggerBirthdayMessages();
      console.log(`🎂 Created ${birthdayMessages} birthday messages`);
      
      // Send expiry reminders
      const expiryMessages = await db.triggerExpiryReminders();
      console.log(`⏰ Created ${expiryMessages} expiry reminder messages`);
      
      // Send attendance reminders (every 3 days)
      if (new Date().getDate() % 3 === 0) {
        const attendanceMessages = await db.triggerAttendanceReminders();
        console.log(`🏋️ Created ${attendanceMessages} attendance reminder messages`);
      }
      
    } catch (error) {
      console.error('Error running daily tasks:', error);
    }
  }

  // Trigger immediate messages for specific events
  async triggerReceiptMessage(memberId: string, receiptId: string) {
    try {
      const success = await db.triggerReceiptMessage(memberId, receiptId);
      if (success) {
        console.log(`💰 Receipt message queued for member ${memberId}`);
      }
      return success;
    } catch (error) {
      console.error('Error triggering receipt message:', error);
      return false;
    }
  }

  async triggerWelcomeMessage(memberId: string) {
    try {
      const messageData = await db.generateWelcomeMessage(memberId);
      if (messageData) {
        const success = await db.createWhatsAppMessage(messageData);
        if (success) {
          console.log(`👋 Welcome message queued for member ${memberId}`);
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('Error triggering welcome message:', error);
      return false;
    }
  }

  async triggerDueAmountReminder(memberId: string) {
    try {
      const messageData = await db.generateDueAmountMessage(memberId);
      if (messageData) {
        const success = await db.createWhatsAppMessage(messageData);
        if (success) {
          console.log(`💳 Due amount reminder queued for member ${memberId}`);
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('Error triggering due amount reminder:', error);
      return false;
    }
  }

  // Get message statistics
  async getMessageStats() {
    try {
      const stats = await db.getWhatsAppMessageStats();
      return stats;
    } catch (error) {
      console.error('Error getting message stats:', error);
      return {
        total: 0,
        sent: 0,
        pending: 0,
        failed: 0
      };
    }
  }

  // Utility function for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      startedAt: this.intervalId ? new Date().toISOString() : null
    };
  }
}

// Export singleton instance
export const whatsappService = WhatsAppAutomationService.getInstance();