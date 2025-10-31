import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

// Import database service
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const DatabaseService = require('./database.cjs');
const WhatsAppIntegration = require('./whatsappIntegration.cjs');

// WhatsApp automation service (simplified for main process)
class WhatsAppMainService {
  constructor(dbService) {
    this.db = dbService;
    this.isRunning = false;
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) return;
    
    console.log('🤖 WhatsApp Automation Service started in main process');
    this.isRunning = true;
    
    // Process messages every 30 seconds
    this.intervalId = setInterval(() => {
      this.processMessages();
    }, 30000);

    // Run daily tasks
    this.scheduleDailyTasks();
  }

  stop() {
    if (!this.isRunning) return;
    
    console.log('🛑 WhatsApp Automation Service stopped');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async processMessages() {
    try {
      const pendingMessages = this.db.getPendingWhatsAppMessages();
      
      for (const message of pendingMessages) {
        // Simulate sending message
        console.log(`📱 Processing WhatsApp message for ${message.member_name}: ${message.message_content}`);
        
        // Update status to sent (in real implementation, this would be after actual sending)
        this.db.updateWhatsAppMessageStatus(
          message.id, 
          'sent', 
          new Date().toISOString()
        );
      }
    } catch (error) {
      console.error('Error processing WhatsApp messages:', error);
    }
  }

  scheduleDailyTasks() {
    // Run daily tasks at 9 AM
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0);
    
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilScheduled = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.runDailyTasks();
      setInterval(() => {
        this.runDailyTasks();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilScheduled);
  }

  async runDailyTasks() {
    console.log('🕘 Running daily WhatsApp automation tasks...');
    
    try {
      const birthdayMessages = await this.db.triggerBirthdayMessages();
      const expiryMessages = await this.db.triggerExpiryReminders();
      
      if (new Date().getDate() % 3 === 0) {
        const attendanceMessages = await this.db.triggerAttendanceReminders();
        console.log(`🏋️ Created ${attendanceMessages} attendance reminders`);
      }
      
      console.log(`🎂 Created ${birthdayMessages} birthday messages, ⏰ ${expiryMessages} expiry reminders`);
    } catch (error) {
      console.error('Error running daily tasks:', error);
    }
  }
}

let mainWindow;
let dbService;
let whatsappService;
let whatsappIntegration;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Add your app icon here
    show: false, // Don't show until ready
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Show loading screen first
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));

  // Then load the app
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  // Wait a bit before loading the main app to show the loading screen
  setTimeout(() => {
    mainWindow.loadURL(startUrl).catch(err => {
      console.error('Failed to load app:', err);
      // If we can't load the app in dev mode, show an error
      if (isDev) {
        // Don't automatically open DevTools, but still show the error
        mainWindow.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;">
            <h1>Error: Could not connect to development server</h1>
            <p>Make sure Vite is running with <code>npm run dev</code> before starting Electron.</p>
            <pre style="background: #f0f0f0; padding: 10px; border-radius: 5px;">${err.toString()}</pre>
          </div>'
        `);
      }
    });
  }, 500);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // DevTools will not automatically open, but can be toggled with the menu option
    // or keyboard shortcut (Cmd+Alt+I on macOS, Ctrl+Shift+I on Windows/Linux)
  });

  // Filter out autofill console errors
  mainWindow.webContents.on('console-message', (event, level, message) => {
    if (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses')) {
      event.preventDefault();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Member',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-member');
          }
        },
        {
          label: 'New Enquiry',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-new-enquiry');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('menu-navigate', 'dashboard');
          }
        },
        {
          label: 'Members',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('menu-navigate', 'members');
          }
        },
        {
          label: 'Enquiries',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('menu-navigate', 'enquiries');
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.minimize();
          }
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.close();
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Hide ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Function to schedule daily subscription status updates
const scheduleSubscriptionStatusUpdates = () => {
  // Update subscription statuses immediately on app start
  dbService.updateAllSubscriptionStatuses();
  
  // Calculate time until midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();
  
  // Set timeout to run at midnight, then set up daily interval
  setTimeout(() => {
    dbService.updateAllSubscriptionStatuses();
    // Set up daily interval (24 hours in milliseconds)
    setInterval(() => {
      dbService.updateAllSubscriptionStatuses();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
};

// App event listeners
app.whenReady().then(() => {
  // Initialize database
  dbService = new DatabaseService();
  
  // Initialize WhatsApp integration
  whatsappIntegration = new WhatsAppIntegration();
  whatsappIntegration.initialize();
  
  // Initialize WhatsApp automation service
  whatsappService = new WhatsAppMainService(dbService);
  whatsappService.start();
  console.log('WhatsApp automation service initialized');
  
  // Schedule daily subscription status updates
  scheduleSubscriptionStatusUpdates();

  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (dbService) {
      dbService.close();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (dbService) {
    dbService.close();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (eventInner, navigationUrl) => {
    eventInner.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('app-name', () => {
  return app.getName();
});

// Window control handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Database IPC handlers

// Authentication
ipcMain.handle('auth-login', async (event, username, password) => {
  try {
    const user = dbService.authenticateUser(username, password);
    return { success: !!user, user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
});

// Users
ipcMain.handle('users-get-all', async () => {
  try {
    const users = dbService.getAllUsers();
    return { success: true, data: users };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('users-create', async (event, userData) => {
  try {
    const success = dbService.createUser(userData);
    return { success };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('users-update-password', async (event, userId, newPassword) => {
  try {
    const success = dbService.updateUserPassword(userId, newPassword);
    return { success };
  } catch (error) {
    console.error('Update user password error:', error);
    return { success: false, error: error.message };
  }
});

// Members
ipcMain.handle('members-get-all', async () => {
  try {
    const members = dbService.getAllMembers();
    return { success: true, data: members };
  } catch (error) {
    console.error('Get members error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('members-get-by-id', async (event, id) => {
  try {
    const member = dbService.getMemberById(id);
    return { success: true, data: member };
  } catch (error) {
    console.error('Get member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('members-create', async (event, memberData) => {
  try {
    const success = dbService.createMember(memberData);
    
    // Trigger welcome message for new member
    if (success && memberData.id) {
      setTimeout(async () => {
        const welcomeMessage = await dbService.generateWelcomeMessage(memberData.id);
        if (welcomeMessage) {
          dbService.createWhatsAppMessage(welcomeMessage);
          console.log(`👋 Welcome message queued for new member: ${memberData.name}`);
        }
      }, 5000); // 5 second delay
    }
    
    return { success };
  } catch (error) {
    console.error('Create member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('members-update', async (event, id, memberData) => {
  try {
    const success = dbService.updateMember(id, memberData);
    return { success };
  } catch (error) {
    console.error('Update member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('members-delete', async (event, id, deletedBy, deletionReason) => {
  try {
    const success = dbService.deleteMember(id, deletedBy, deletionReason);
    return { success };
  } catch (error) {
    console.error('Delete member error:', error);
    return { success: false, error: error.message };
  }
});

// Member due amounts
ipcMain.handle('get-all-members-with-due-amounts', async () => {
  try {
    const members = dbService.getAllMembersWithDueAmounts();
    return { success: true, data: members };
  } catch (error) {
    console.error('Get members with due amounts error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-member-due-amount', async (event, memberId) => {
  try {
    const dueInfo = dbService.getMemberDueAmount(memberId);
    return { success: true, data: dueInfo };
  } catch (error) {
    console.error('Get member due amount error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('pay-member-due-amount', async (event, memberId, paymentAmount, paymentType, createdBy) => {
  try {
    const result = dbService.payMemberDueAmount(memberId, paymentAmount, paymentType, createdBy);
    return result;
  } catch (error) {
    console.error('Pay member due amount error:', error);
    return { success: false, error: error.message };
  }
});

// Find member by mobile number
ipcMain.handle('find-member-by-mobile', async (event, mobileNumber) => {
  try {
    const result = dbService.findMemberByMobile(mobileNumber);
    return result;
  } catch (error) {
    console.error('Find member by mobile error:', error);
    return { success: false, error: error.message };
  }
});

// Get member payment history
ipcMain.handle('get-member-payment-history', async (event, memberId) => {
  try {
    const result = dbService.getMemberPaymentHistory(memberId);
    return result;
  } catch (error) {
    console.error('Get member payment history error:', error);
    return { success: false, error: error.message };
  }
});

// Test IPC handler
ipcMain.handle('test-ipc', async () => {
  console.log('🚨🚨🚨 TEST IPC WORKING! 🚨🚨🚨');
  return { success: true, message: 'IPC is working!' };
});

// Partial Members
ipcMain.handle('members-save-partial', async (event, partialData) => {
  console.log('🚨🚨🚨 MAIN PROCESS: Received save-partial-member request:', partialData);
  console.log('🚨🚨🚨 MAIN PROCESS: dbService exists:', !!dbService);
  console.log('🚨🚨🚨 MAIN PROCESS: savePartialMember method exists:', typeof dbService?.savePartialMember);
  
  try {
    const result = dbService.savePartialMember(partialData);
    console.log('🚨🚨🚨 MAIN PROCESS: Save partial member result:', result);
    return result;
  } catch (error) {
    console.error('🚨🚨🚨 MAIN PROCESS: Save partial member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('members-is-partial', async (event, memberId) => {
  console.log('Main: Received is-partial-member request:', memberId);
  try {
    const isPartial = dbService.isPartialMember(memberId);
    console.log('Main: Is partial member result:', isPartial);
    return { success: true, data: isPartial };
  } catch (error) {
    console.error('Main: Check partial member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('members-complete-partial', async (event, memberId, membershipData) => {
  console.log('Main: Received complete-partial-member request:', memberId, membershipData);
  try {
    const result = dbService.completePartialMember(memberId, membershipData);
    console.log('Main: Complete partial member result:', result);
    return result;
  } catch (error) {
    console.error('Main: Complete partial member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('members-get-partial', async () => {
  console.log('Main: Received get-partial-members request');
  try {
    const partialMembers = dbService.getPartialMembers();
    console.log('Main: Get partial members result:', partialMembers?.length || 0);
    return { success: true, data: partialMembers };
  } catch (error) {
    console.error('Main: Get partial members error:', error);
    return { success: false, error: error.message };
  }
});

// Deleted Members
ipcMain.handle('deleted-members-get-all', async () => {
  try {
    const deletedMembers = dbService.getAllDeletedMembers();
    return { success: true, data: deletedMembers };
  } catch (error) {
    console.error('Get deleted members error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deleted-members-get-by-id', async (event, id) => {
  try {
    const deletedMember = dbService.getDeletedMemberById(id);
    return { success: true, data: deletedMember };
  } catch (error) {
    console.error('Get deleted member by ID error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deleted-members-restore', async (event, deletedMemberId) => {
  try {
    const result = dbService.restoreDeletedMember(deletedMemberId);
    return result;
  } catch (error) {
    console.error('Restore deleted member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deleted-members-permanent-delete', async (event, deletedMemberId) => {
  try {
    const result = dbService.permanentlyDeleteMember(deletedMemberId);
    return result;
  } catch (error) {
    console.error('Permanent delete member error:', error);
    return { success: false, error: error.message };
  }
});

//Attendance
ipcMain.handle('getAllAttendance', () => {
  try {
    const records = dbService.getAllAttendance();
    return { success: true, data: records };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('createAttendance', (_, attendanceData) => {
  try {
    const success = dbService.createAttendance(attendanceData);
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updateAttendance', (_, id, attendanceData) => {
  try {
    const success = dbService.updateAttendance(id, attendanceData);
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Staff Attendance
ipcMain.handle('getAllStaffAttendance', () => {
  try {
    const records = dbService.getAllStaffAttendance();
    return { success: true, data: records };
  } catch (error) {
    console.error('Get staff attendance error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('createStaffAttendance', (_, attendanceData) => {
  try {
    const success = dbService.createStaffAttendance(attendanceData);
    return { success };
  } catch (error) {
    console.error('Create staff attendance error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updateStaffAttendance', (_, id, attendanceData) => {
  try {
    const success = dbService.updateStaffAttendance(id, attendanceData);
    return { success };
  } catch (error) {
    console.error('Update staff attendance error:', error);
    return { success: false, error: error.message };
  }
});

// Staff
ipcMain.handle('staff-get-all', async () => {
  try {
    const staff = dbService.getAllStaff();
    return { success: true, data: staff };
  } catch (error) {
    console.error('Get staff error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('staff-get-by-id', async (event, id) => {
  try {
    const staff = dbService.getStaffById(id);
    return { success: true, data: staff };
  } catch (error) {
    console.error('Get staff by ID error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('staff-create', async (event, staffData) => {
  try {
    console.log('Main.js - Received staff creation request:', JSON.stringify(staffData, null, 2));
    const success = await dbService.createStaff(staffData);
    console.log('Main.js - Staff creation result:', success);
    return { success };
  } catch (error) {
    console.error('Create staff error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('staff-update', async (event, id, staffData) => {
  try {
    const success = await dbService.updateStaff(id, staffData);
    return { success };
  } catch (error) {
    console.error('Update staff error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('staff-delete', async (event, id) => {
  try {
    const success = await dbService.deleteStaff(id);
    return { success };
  } catch (error) {
    console.error('Delete staff error:', error);
    return { success: false, error: error.message };
  }
});

// Receipts
ipcMain.handle('receipts-get-all', async () => {
  try {
    const receipts = dbService.getAllReceipts();
    return { success: true, data: receipts };
  } catch (error) {
    console.error('Get receipts error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('receipts-get-member-only', async () => {
  try {
    console.log('Available dbService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(dbService)));
    console.log('getMemberReceipts exists:', typeof dbService.getMemberReceipts);
    
    if (typeof dbService.getMemberReceipts !== 'function') {
      console.error('getMemberReceipts is not a function, falling back to getAllReceipts with filtering');
      const allReceipts = dbService.getAllReceipts();
      const memberReceipts = allReceipts.filter(receipt => 
        !receipt.receipt_category || receipt.receipt_category === 'member'
      );
      return { success: true, data: memberReceipts };
    }
    
    const receipts = dbService.getMemberReceipts();
    return { success: true, data: receipts };
  } catch (error) {
    console.error('Get member receipts error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('receipts-get-by-member', async (event, memberId) => {
  try {
    const receipts = dbService.getReceiptsByMemberId(memberId);
    return { success: true, data: receipts };
  } catch (error) {
    console.error('Get receipts by member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('receipts-get-member-history', async (event, memberId) => {
  try {
    const receipts = dbService.getMemberReceiptHistory(memberId);
    return { success: true, data: receipts };
  } catch (error) {
    console.error('Get member receipt history error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('receipts-create', async (event, receiptData) => {
  try {
    const success = dbService.createReceipt(receiptData);
    return { success };
  } catch (error) {
    console.error('Create receipt error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('receipts-update', async (event, id, receiptData) => {
  try {
    const success = dbService.updateReceipt(id, receiptData);
    return { success };
  } catch (error) {
    console.error('Update receipt error:', error);
    return { success: false, error: error.message };
  }
});

// Receipt versioning handlers
ipcMain.handle('receipts-create-version', async (event, receiptData) => {
  try {
    const success = dbService.createReceiptVersion(receiptData);
    return { success };
  } catch (error) {
    console.error('Create receipt version error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('receipts-mark-superseded', async (event, receiptId) => {
  try {
    const success = dbService.markReceiptAsSuperseded(receiptId);
    return { success };
  } catch (error) {
    console.error('Mark receipt as superseded error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('receipts-get-history', async (event, originalReceiptId) => {
  try {
    const history = dbService.getReceiptHistory(originalReceiptId);
    return { success: true, data: history };
  } catch (error) {
    console.error('Get receipt history error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('receipts-delete', async (event, id) => {
  try {
    const success = dbService.deleteReceipt(id);
    return { success };
  } catch (error) {
    console.error('Delete receipt error:', error);
    return { success: false, error: error.message };
  }
});

// Staff salary receipt handlers
ipcMain.handle('staff-salary-receipt-create', async (event, staffId, staffName, amount, paymentType, description, createdBy) => {
  try {
    const receipt = dbService.createStaffSalaryReceipt(staffId, staffName, amount, paymentType, description, createdBy);
    return { success: !!receipt, data: receipt };
  } catch (error) {
    console.error('Create staff salary receipt error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('salary-update-receipt-create', async (event, staffId, staffName, oldSalary, newSalary, createdBy) => {
  try {
    const receipt = dbService.createSalaryUpdateReceipt(staffId, staffName, oldSalary, newSalary, createdBy);
    return { success: !!receipt, data: receipt };
  } catch (error) {
    console.error('Create salary update receipt error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bonus-receipt-create', async (event, staffId, staffName, bonusAmount, paymentType, description, createdBy) => {
  try {
    const receipt = dbService.createBonusReceipt(staffId, staffName, bonusAmount, paymentType, description, createdBy);
    return { success: !!receipt, data: receipt };
  } catch (error) {
    console.error('Create bonus receipt error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('staff-receipts-get', async (event, staffName = null) => {
  try {
    const receipts = dbService.getStaffReceipts(staffName);
    return { success: true, data: receipts };
  } catch (error) {
    console.error('Get staff receipts error:', error);
    return { success: false, error: error.message };
  }
});

// Enquiries
ipcMain.handle('enquiries-get-all', async () => {
  try {
    const enquiries = dbService.getAllEnquiries();
    return { success: true, data: enquiries };
  } catch (error) {
    console.error('Get enquiries error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('enquiries-get-by-id', async (event, id) => {
  try {
    const enquiry = dbService.getEnquiryById(id);
    return { success: true, data: enquiry };
  } catch (error) {
    console.error('Get enquiry by ID error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('enquiries-create', async (event, enquiryData) => {
  try {
    const success = dbService.createEnquiry(enquiryData);
    return { success };
  } catch (error) {
    console.error('Create enquiry error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('enquiries-update', async (event, id, enquiryData) => {
  try {
    const success = dbService.updateEnquiry(id, enquiryData);
    return { success };
  } catch (error) {
    console.error('Update enquiry error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('enquiries-delete', async (event, id) => {
  try {
    const success = dbService.deleteEnquiry(id);
    return { success };
  } catch (error) {
    console.error('Delete enquiry error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('enquiries-convert-to-member', async (event, enquiryId, memberData) => {
  try {
    const result = dbService.convertEnquiryToMember(enquiryId, memberData);
    return result;
  } catch (error) {
    console.error('Convert enquiry to member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('generate-enquiry-number', async () => {
  try {
    const enquiryNumber = dbService.generateEnquiryNumber();
    return enquiryNumber;
  } catch (error) {
    console.error('Generate enquiry number error:', error);
    return 'ENQ001';
  }
});

// Monthly transaction report
ipcMain.handle('get-monthly-transaction-report', async (event, month, year) => {
  try {
    const report = dbService.getMonthlyTransactionReport(month, year);
    return { success: true, data: report };
  } catch (error) {
    console.error('Get monthly transaction report error:', error);
    return { success: false, error: error.message };
  }
});

// Body measurements
ipcMain.handle('body-measurements-create', async (event, measurementData) => {
  try {
    const success = dbService.createBodyMeasurement(measurementData);
    return { success };
  } catch (error) {
    console.error('Create body measurement error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('body-measurements-get-all', async () => {
  try {
    const measurements = dbService.getAllBodyMeasurements();
    return { success: true, data: measurements };
  } catch (error) {
    console.error('Get body measurements error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('body-measurements-get-by-member', async (event, memberId) => {
  try {
    const measurements = dbService.getBodyMeasurementsByMember(memberId);
    return { success: true, data: measurements };
  } catch (error) {
    console.error('Get body measurements by member error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('body-measurements-update', async (event, id, measurementData) => {
  try {
    const success = dbService.updateBodyMeasurement(id, measurementData);
    return { success };
  } catch (error) {
    console.error('Update body measurement error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('body-measurements-delete', async (event, id) => {
  try {
    const success = dbService.deleteBodyMeasurement(id);
    return { success };
  } catch (error) {
    console.error('Delete body measurement error:', error);
    return { success: false, error: error.message };
  }
});

// File system operations for receipts
ipcMain.handle('save-receipt-pdf', async (event, receiptData, pdfBuffer) => {
  try {
    const { app } = require('electron');
    const fs = require('fs');
    const path = require('path');

    // Create receipts directory in user data
    const userDataPath = app.getPath('userData');
    const receiptsDir = path.join(userDataPath, 'receipts');

    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    // Generate filename
    const date = new Date(receiptData.created_at).toISOString().split('T')[0];
    const memberName = receiptData.member_name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Receipt_${receiptData.receipt_number}_${memberName}_${date}.pdf`;
    const filePath = path.join(receiptsDir, filename);

    // Save PDF file
    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

    return { success: true, filePath, filename };
  } catch (error) {
    console.error('Save receipt PDF error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-receipts-directory', async () => {
  try {
    const { app } = require('electron');
    const path = require('path');

    const userDataPath = app.getPath('userData');
    const receiptsDir = path.join(userDataPath, 'receipts');

    return { success: true, path: receiptsDir };
  } catch (error) {
    console.error('Get receipts directory error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-receipts-folder', async () => {
  try {
    const { shell, app } = require('electron');
    const path = require('path');

    const userDataPath = app.getPath('userData');
    const receiptsDir = path.join(userDataPath, 'receipts');

    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    shell.openPath(receiptsDir);
    return { success: true };
  } catch (error) {
    console.error('Open receipts folder error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-receipt-file-path', async (event, receiptData) => {
  try {
    const { app } = require('electron');
    const path = require('path');

    const userDataPath = app.getPath('userData');
    const receiptsDir = path.join(userDataPath, 'receipts');

    const date = new Date(receiptData.created_at).toISOString().split('T')[0];
    const memberName = receiptData.member_name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Receipt_${receiptData.receipt_number}_${memberName}_${date}.pdf`;
    const filePath = path.join(receiptsDir, filename);

    return { success: true, filePath, filename, exists: require('fs').existsSync(filePath) };
  } catch (error) {
    console.error('Get receipt file path error:', error);
    return { success: false, error: error.message };
  }
});

// Utility functions
ipcMain.handle('generate-id', async () => {
  return dbService.generateId();
});

ipcMain.handle('generate-receipt-number', async () => {
  return dbService.generateReceiptNumber();
});

ipcMain.handle('generate-invoice-number', async () => {
  return dbService.generateInvoiceNumber();
});

ipcMain.handle('generate-member-number', async () => {
  return dbService.generateMemberNumber();
});

ipcMain.handle('update-member-number', async (event, memberId, newMemberNumber) => {
  try {
    const result = dbService.updateMemberNumber(memberId, newMemberNumber);
    return result;
  } catch (error) {
    console.error('Update member number error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-member-number-available', async (event, memberNumber, excludeMemberId) => {
  try {
    const isTaken = dbService.isMemberNumberTaken(memberNumber);
    // If excludeMemberId is provided, check if it's taken by a different member
    if (excludeMemberId && isTaken) {
      const existing = dbService.db.prepare('SELECT id FROM members WHERE custom_member_id = ?').get(memberNumber);
      return { available: existing?.id === excludeMemberId };
    }
    return { available: !isTaken };
  } catch (error) {
    console.error('Check member number availability error:', error);
    return { available: false, error: error.message };
  }
});

// Invoice operations
ipcMain.handle('get-all-invoices', async () => {
  return dbService.getAllInvoices();
});

ipcMain.handle('get-invoices-by-member-id', async (event, memberId) => {
  return dbService.getInvoicesByMemberId(memberId);
});

ipcMain.handle('create-invoice', async (event, invoiceData) => {
  try {
    const result = dbService.createInvoice(invoiceData);
    return { success: !!result };
  } catch (error) {
    console.error('Create invoice error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-invoice-payment', async (event, invoiceId, paidAmount) => {
  return dbService.updateInvoicePayment(invoiceId, paidAmount);
});

ipcMain.handle('recalculate-member-totals', async (event, memberId) => {
  try {
    const result = dbService.recalculateMemberTotals(memberId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error recalculating member totals:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fix-receipt-amounts', async () => {
  try {
    const fixedCount = dbService.fixReceiptAmounts();
    return { success: true, fixedCount };
  } catch (error) {
    console.error('Error fixing receipt amounts:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-member-due-amounts', async (event, memberId, additionalPayment) => {
  try {
    const result = dbService.clearMemberDueAmounts(memberId, additionalPayment);
    return { success: true, data: result };
  } catch (error) {
    console.error('Clear member due amounts error:', error);
    return { success: false, error: error.message };
  }
});

// Force migration handler - simplified
ipcMain.handle('force-migration', async () => {
  try {
    dbService.forceMigration();
    return { success: true };
  } catch (error) {
    console.error('Force migration error:', error);
    return { success: false, error: error.message };
  }
});

// Force packages migration handler
ipcMain.handle('force-packages-migration', async () => {
  try {
    dbService.forcePackagesMigration();
    return { success: true };
  } catch (error) {
    console.error('Force packages migration error:', error);
    return { success: false, error: error.message };
  }
});

// Check packages constraint handler
ipcMain.handle('check-packages-constraint', async () => {
  try {
    const supportsCustom = dbService.checkPackagesConstraint();
    return { success: true, supportsCustom };
  } catch (error) {
    console.error('Check packages constraint error:', error);
    return { success: false, error: error.message };
  }
});

// Subscription status handler
ipcMain.handle('update-all-subscription-statuses', async () => {
  try {
    dbService.updateAllSubscriptionStatuses();
    return { success: true };
  } catch (error) {
    console.error('Update subscription statuses error:', error);
    return { success: false, error: error.message };
  }
});

// Renewal handler
ipcMain.handle('renew-membership', async (event, memberId, planType, membershipFees, createdBy) => {
  try {
    const result = dbService.renewMembership(memberId, planType, membershipFees, createdBy);
    return result;
  } catch (error) {
    console.error('Renew membership error:', error);
    return { success: false, error: error.message };
  }
});

// Test receipt creation handler
ipcMain.handle('test-receipt-creation', async () => {
  try {
    const testReceipt = {
      id: dbService.generateId(),
      receipt_number: dbService.generateReceiptNumber(),
      member_id: 'test-member-id',
      member_name: 'Test Member',
      amount: 100,
      payment_type: 'cash',
      description: 'Test receipt creation',
      receipt_category: 'member',
      created_at: new Date().toISOString(),
      created_by: 'System Test'
    };
    
    const result = dbService.createReceipt(testReceipt);
    return { success: !!result, data: result };
  } catch (error) {
    console.error('Test receipt creation error:', error);
    return { success: false, error: error.message };
  }
});

// Update member receipts info handler
ipcMain.handle('update-member-receipts-info', async (event, memberId) => {
  try {
    console.log('Updating member receipts info for member:', memberId);
    if (!dbService || typeof dbService.updateMemberReceiptsInfo !== 'function') {
      throw new Error('Database service or method not available');
    }
    const success = dbService.updateMemberReceiptsInfo(memberId);
    console.log('Update member receipts info result:', success);
    return { success };
  } catch (error) {
    console.error('Update member receipts info error:', error);
    return { success: false, error: error.message };
  }
});

// Update member receipts with new fee structure
ipcMain.handle('update-member-receipts-fee-structure', async (event, memberId) => {
  try {
    console.log('Updating member receipts fee structure for member:', memberId);
    if (!dbService || typeof dbService.updateMemberReceiptsWithFeeStructure !== 'function') {
      throw new Error('Database service or method not available');
    }
    const result = dbService.updateMemberReceiptsWithFeeStructure(memberId);
    console.log('Update member receipts fee structure result:', result);
    return result;
  } catch (error) {
    console.error('Update member receipts fee structure error:', error);
    return { success: false, error: error.message };
  }
});



console.log('Electron main process ready with enquiry support and master settings');

ipcMain.handle('expense-delete', async (event, id) => {
  try {
    const success = dbService.deleteExpense(id);
    return { success };
  } catch (error) {
    console.error('Delete expense error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('expense-get-by-category', async (event, category) => {
  try {
    const expenses = dbService.getExpensesByCategory(category);
    return { success: true, data: expenses };
  } catch (error) {
    console.error('Get expenses by category error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('expense-get-by-date-range', async (event, startDate, endDate) => {
  try {
    const expenses = dbService.getExpensesByDateRange(startDate, endDate);
    return { success: true, data: expenses };
  } catch (error) {
    console.error('Get expenses by date range error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('expense-get-monthly-report', async (event, year, month) => {
  try {
    const report = dbService.getMonthlyExpenseReport(year, month);
    return { success: true, data: report };
  } catch (error) {
    console.error('Get monthly expense report error:', error);
    return { success: false, error: error.message };
  }
});

// WhatsApp Automation IPC handlers
ipcMain.handle('whatsapp-get-all-messages', async () => {
  try {
    const messages = dbService.getAllWhatsAppMessages();
    return { success: true, data: messages };
  } catch (error) {
    console.error('Get all WhatsApp messages error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-get-pending-messages', async () => {
  try {
    const messages = dbService.getPendingWhatsAppMessages();
    return { success: true, data: messages };
  } catch (error) {
    console.error('Get pending WhatsApp messages error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-retry-message', async (event, messageId) => {
  try {
    const success = dbService.retryWhatsAppMessage(messageId);
    return { success };
  } catch (error) {
    console.error('Retry WhatsApp message error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-trigger-birthday-messages', async () => {
  try {
    const count = await dbService.triggerBirthdayMessages();
    return { success: true, data: count };
  } catch (error) {
    console.error('Trigger birthday messages error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-get-todays-birthday-members', async () => {
  try {
    const members = dbService.getTodaysBirthdayMembers();
    return { success: true, data: members };
  } catch (error) {
    console.error('Get today\'s birthday members error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-trigger-expiry-reminders', async () => {
  try {
    const count = await dbService.triggerExpiryReminders();
    return { success: true, data: count };
  } catch (error) {
    console.error('Trigger expiry reminders error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-trigger-attendance-reminders', async () => {
  try {
    const count = await dbService.triggerAttendanceReminders();
    return { success: true, data: count };
  } catch (error) {
    console.error('Trigger attendance reminders error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-process-pending-messages', async () => {
  try {
    const count = await dbService.processPendingWhatsAppMessages(whatsappIntegration);
    return { success: true, data: count };
  } catch (error) {
    console.error('Process pending WhatsApp messages error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-send-message', async (event, messageData) => {
  try {
    console.log('📱 Received WhatsApp send request:', messageData);
    
    if (!whatsappIntegration) {
      throw new Error('WhatsApp integration not initialized');
    }
    
    const result = await whatsappIntegration.sendMessage(
      messageData.phone,
      messageData.message,
      messageData.memberName
    );
    
    return result;
  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-update-message-status', async (event, messageId, status, sentAt, errorMessage) => {
  try {
    const success = dbService.updateWhatsAppMessageStatus(messageId, status, sentAt, errorMessage);
    return { success };
  } catch (error) {
    console.error('Update WhatsApp message status error:', error);
    return { success: false, error: error.message };
  }
});

// Settings IPC handlers
ipcMain.handle('settings-get', async (event, key) => {
  try {
    const value = dbService.getSetting(key);
    return { success: true, data: value };
  } catch (error) {
    console.error('Get setting error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('settings-set', async (event, key, value) => {
  try {
    const success = dbService.setSetting(key, value);
    return { success };
  } catch (error) {
    console.error('Set setting error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-update-template', async (event, messageType, templateContent) => {
  try {
    const success = dbService.updateWhatsAppTemplate(messageType, templateContent);
    return { success };
  } catch (error) {
    console.error('Update WhatsApp template error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('whatsapp-create-message', async (event, messageData) => {
  try {
    const result = dbService.createWhatsAppMessage(messageData);
    return result;
  } catch (error) {
    console.error('Create WhatsApp message error:', error);
    return { success: false, error: error.message };
  }
});

// Master Settings IPC handlers

// Package Management
ipcMain.handle('master-packages-get-all', async () => {
  try {
    const packages = dbService.getAllPackages();
    return { success: true, data: packages };
  } catch (error) {
    console.error('Get all packages error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-packages-create', async (event, packageData) => {
  try {
    const success = dbService.createPackage(packageData);
    return { success };
  } catch (error) {
    console.error('Create package error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-packages-update', async (event, id, packageData) => {
  try {
    const success = dbService.updatePackage(id, packageData);
    return { success };
  } catch (error) {
    console.error('Update package error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-packages-delete', async (event, id) => {
  try {
    const success = dbService.deletePackage(id);
    return { success };
  } catch (error) {
    console.error('Delete package error:', error);
    return { success: false, error: error.message };
  }
});

// Tax Settings Management
ipcMain.handle('master-tax-settings-get-all', async () => {
  try {
    const taxSettings = dbService.getAllTaxSettings();
    return { success: true, data: taxSettings };
  } catch (error) {
    console.error('Get all tax settings error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-tax-settings-create', async (event, taxData) => {
  try {
    const success = dbService.createTaxSetting(taxData);
    return { success };
  } catch (error) {
    console.error('Create tax setting error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-tax-settings-update', async (event, id, taxData) => {
  try {
    const success = dbService.updateTaxSetting(id, taxData);
    return { success };
  } catch (error) {
    console.error('Update tax setting error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-tax-settings-delete', async (event, id) => {
  try {
    const success = dbService.deleteTaxSetting(id);
    return { success };
  } catch (error) {
    console.error('Delete tax setting error:', error);
    return { success: false, error: error.message };
  }
});

// Expense Categories Management
ipcMain.handle('master-expense-categories-get-all', async () => {
  try {
    const categories = dbService.getAllExpenseCategories();
    return { success: true, data: categories };
  } catch (error) {
    console.error('Get all expense categories error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-expense-categories-create', async (event, categoryData) => {
  try {
    const success = dbService.createExpenseCategory(categoryData);
    return { success };
  } catch (error) {
    console.error('Create expense category error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-expense-categories-update', async (event, id, categoryData) => {
  try {
    const success = dbService.updateExpenseCategory(id, categoryData);
    return { success };
  } catch (error) {
    console.error('Update expense category error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-expense-categories-delete', async (event, id) => {
  try {
    const success = dbService.deleteExpenseCategory(id);
    return { success };
  } catch (error) {
    console.error('Delete expense category error:', error);
    return { success: false, error: error.message };
  }
});

// Occupations Management
ipcMain.handle('master-occupations-get-all', async () => {
  try {
    const occupations = dbService.getAllOccupations();
    return { success: true, data: occupations };
  } catch (error) {
    console.error('Get all occupations error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-occupations-create', async (event, occupationData) => {
  try {
    const success = dbService.createOccupation(occupationData);
    return { success };
  } catch (error) {
    console.error('Create occupation error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-occupations-update', async (event, id, occupationData) => {
  try {
    const success = dbService.updateOccupation(id, occupationData);
    return { success };
  } catch (error) {
    console.error('Update occupation error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-occupations-delete', async (event, id) => {
  try {
    const success = dbService.deleteOccupation(id);
    return { success };
  } catch (error) {
    console.error('Delete occupation error:', error);
    return { success: false, error: error.message };
  }
});

// Payment Types Management
ipcMain.handle('master-payment-types-get-all', async () => {
  try {
    const paymentTypes = dbService.getAllPaymentTypes();
    return { success: true, data: paymentTypes };
  } catch (error) {
    console.error('Get all payment types error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-payment-types-create', async (event, paymentData) => {
  try {
    const success = dbService.createPaymentType(paymentData);
    return { success };
  } catch (error) {
    console.error('Create payment type error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-payment-types-update', async (event, id, paymentData) => {
  try {
    const success = dbService.updatePaymentType(id, paymentData);
    return { success };
  } catch (error) {
    console.error('Update payment type error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-payment-types-delete', async (event, id) => {
  try {
    const success = dbService.deletePaymentType(id);
    return { success };
  } catch (error) {
    console.error('Delete payment type error:', error);
    return { success: false, error: error.message };
  }
});

// Body Measurement Fields Management
ipcMain.handle('master-body-measurement-fields-get-all', async () => {
  try {
    const fields = dbService.getAllBodyMeasurementFields();
    return { success: true, data: fields };
  } catch (error) {
    console.error('Get all body measurement fields error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-body-measurement-fields-create', async (event, fieldData) => {
  try {
    const success = dbService.createBodyMeasurementField(fieldData);
    return { success };
  } catch (error) {
    console.error('Create body measurement field error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-body-measurement-fields-update', async (event, id, fieldData) => {
  try {
    const success = dbService.updateBodyMeasurementField(id, fieldData);
    return { success };
  } catch (error) {
    console.error('Update body measurement field error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('master-body-measurement-fields-delete', async (event, id) => {
  try {
    const success = dbService.deleteBodyMeasurementField(id);
    return { success };
  } catch (error) {
    console.error('Delete body measurement field error:', error);
    return { success: false, error: error.message };
  }
});

console.log('Electron main process ready with enquiry support and master settings');
