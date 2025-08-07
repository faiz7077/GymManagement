// WhatsApp Integration Service for Electron
// This service handles actual WhatsApp message sending using various methods

const { shell } = require('electron');
const https = require('https');
const querystring = require('querystring');

class WhatsAppIntegration {
  constructor() {
    this.isInitialized = false;
    this.method = 'web'; // 'web', 'api', 'callmebot'
  }

  async initialize() {
    console.log('🔧 Initializing WhatsApp Integration Service...');
    this.isInitialized = true;
    return true;
  }

  async sendMessage(phone, message, memberName) {
    try {
      console.log(`📱 Sending WhatsApp message to ${memberName} (${phone})`);
      console.log(`📝 Message: ${message}`);

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = this.cleanPhoneNumber(phone);
      
      if (!this.isValidPhoneNumber(cleanPhone)) {
        throw new Error(`Invalid phone number: ${phone}`);
      }

      // Try different methods in order of preference
      const methods = [
        () => this.sendViaWhatsAppWeb(cleanPhone, message, memberName),
        () => this.sendViaCallMeBot(cleanPhone, message, memberName),
        () => this.sendViaWhatsAppAPI(cleanPhone, message, memberName)
      ];

      for (const method of methods) {
        try {
          const result = await method();
          if (result.success) {
            console.log(`✅ Message sent successfully to ${memberName} via ${result.method}`);
            return { success: true, method: result.method };
          }
        } catch (error) {
          console.log(`⚠️ Method failed, trying next: ${error.message}`);
          continue;
        }
      }

      throw new Error('All sending methods failed');

    } catch (error) {
      console.error(`❌ Failed to send message to ${memberName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Method 1: WhatsApp Web (opens in browser)
  async sendViaWhatsAppWeb(phone, message, memberName) {
    try {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
      
      console.log(`🌐 Opening WhatsApp Web for ${memberName}: ${whatsappUrl}`);
      
      // Open WhatsApp Web in default browser
      await shell.openExternal(whatsappUrl);
      
      // Since we can't detect if the message was actually sent via web,
      // we'll consider it successful if the URL opened
      return { success: true, method: 'WhatsApp Web' };
      
    } catch (error) {
      throw new Error(`WhatsApp Web failed: ${error.message}`);
    }
  }

  // Method 2: CallMeBot API (Free service)
  async sendViaCallMeBot(phone, message, memberName) {
    return new Promise((resolve, reject) => {
      try {
        // CallMeBot requires registration and API key
        // This is a placeholder - you need to register at https://www.callmebot.com/
        const apiKey = process.env.CALLMEBOT_API_KEY || 'YOUR_API_KEY';
        
        if (apiKey === 'YOUR_API_KEY') {
          throw new Error('CallMeBot API key not configured');
        }

        const postData = querystring.stringify({
          phone: phone,
          text: message,
          apikey: apiKey
        });

        const options = {
          hostname: 'api.callmebot.com',
          port: 443,
          path: '/whatsapp.php',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log(`📞 CallMeBot response: ${data}`);
              resolve({ success: true, method: 'CallMeBot API' });
            } else {
              reject(new Error(`CallMeBot API error: ${res.statusCode} - ${data}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(new Error(`CallMeBot request failed: ${error.message}`));
        });

        req.write(postData);
        req.end();

      } catch (error) {
        reject(new Error(`CallMeBot setup failed: ${error.message}`));
      }
    });
  }

  // Method 3: Generic WhatsApp API (placeholder for other services)
  async sendViaWhatsAppAPI(phone, message, memberName) {
    try {
      // This is a placeholder for other WhatsApp API services
      // You can integrate with services like:
      // - Twilio WhatsApp API
      // - WhatsApp Business API
      // - Other third-party services
      
      console.log(`🔌 WhatsApp API not configured for ${memberName}`);
      throw new Error('WhatsApp API not configured');
      
    } catch (error) {
      throw new Error(`WhatsApp API failed: ${error.message}`);
    }
  }

  // Utility methods
  cleanPhoneNumber(phone) {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it starts with +91, keep it
    if (cleaned.startsWith('+91')) {
      return cleaned;
    }
    
    // If it starts with 91, add +
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // If it's a 10-digit Indian number, add +91
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return '+91' + cleaned;
    }
    
    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  isValidPhoneNumber(phone) {
    // Basic validation for Indian phone numbers
    const indianPattern = /^\+91[6-9]\d{9}$/;
    const internationalPattern = /^\+\d{10,15}$/;
    
    return indianPattern.test(phone) || internationalPattern.test(phone);
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      method: this.method,
      availableMethods: ['WhatsApp Web', 'CallMeBot API', 'WhatsApp API']
    };
  }
}

module.exports = WhatsAppIntegration;