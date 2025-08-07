const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppName: () => ipcRenderer.invoke('app-name'),

  // Menu events
  onMenuNewMember: (callback) => ipcRenderer.on('menu-new-member', callback),
  onMenuNewEnquiry: (callback) => ipcRenderer.on('menu-new-enquiry', callback),
  onMenuNavigate: (callback) => ipcRenderer.on('menu-navigate', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Platform info
  platform: process.platform,

  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

  // Database operations
  // Authentication
  login: (username, password) => ipcRenderer.invoke('auth-login', username, password),
  
  // Users
  getAllUsers: () => ipcRenderer.invoke('users-get-all'),
  createUser: (userData) => ipcRenderer.invoke('users-create', userData),
  
  // Members
  getAllMembers: () => ipcRenderer.invoke('members-get-all'),
  getAllMembersWithDueAmounts: () => ipcRenderer.invoke('get-all-members-with-due-amounts'),
  getMemberById: (id) => ipcRenderer.invoke('members-get-by-id', id),
  createMember: (memberData) => ipcRenderer.invoke('members-create', memberData),
  updateMember: (id, memberData) => ipcRenderer.invoke('members-update', id, memberData),
  deleteMember: (id) => ipcRenderer.invoke('members-delete', id),
  
  //Attendance
  getAllAttendance: () => ipcRenderer.invoke('getAllAttendance'),
  createAttendance: (attendanceData) => ipcRenderer.invoke('createAttendance', attendanceData),
  updateAttendance: (id, attendanceData) => ipcRenderer.invoke('updateAttendance', id, attendanceData),

  // Staff Attendance
  getAllStaffAttendance: () => ipcRenderer.invoke('getAllStaffAttendance'),
  createStaffAttendance: (attendanceData) => ipcRenderer.invoke('createStaffAttendance', attendanceData),
  updateStaffAttendance: (id, attendanceData) => ipcRenderer.invoke('updateStaffAttendance', id, attendanceData),
  
  // Staff
  getAllStaff: () => ipcRenderer.invoke('staff-get-all'),
  getStaffById: (id) => ipcRenderer.invoke('staff-get-by-id', id),
  createStaff: (staffData) => ipcRenderer.invoke('staff-create', staffData),
  updateStaff: (id, staffData) => ipcRenderer.invoke('staff-update', id, staffData),
  deleteStaff: (id) => ipcRenderer.invoke('staff-delete', id),
  
  // Receipts
  getAllReceipts: () => ipcRenderer.invoke('receipts-get-all'),
  getMemberReceipts: () => ipcRenderer.invoke('receipts-get-member-only'),
  getReceiptsByMember: (memberId) => ipcRenderer.invoke('receipts-get-by-member', memberId),
  createReceipt: (receiptData) => ipcRenderer.invoke('receipts-create', receiptData),
  updateReceipt: (id, receiptData) => ipcRenderer.invoke('receipts-update', id, receiptData),
  deleteReceipt: (id) => ipcRenderer.invoke('receipts-delete', id),
  
  // Staff salary receipts
  createStaffSalaryReceipt: (staffId, staffName, amount, paymentType, description, createdBy) => 
    ipcRenderer.invoke('staff-salary-receipt-create', staffId, staffName, amount, paymentType, description, createdBy),
  createSalaryUpdateReceipt: (staffId, staffName, oldSalary, newSalary, createdBy) => 
    ipcRenderer.invoke('salary-update-receipt-create', staffId, staffName, oldSalary, newSalary, createdBy),
  createBonusReceipt: (staffId, staffName, bonusAmount, paymentType, description, createdBy) => 
    ipcRenderer.invoke('bonus-receipt-create', staffId, staffName, bonusAmount, paymentType, description, createdBy),
  getStaffReceipts: (staffName) => ipcRenderer.invoke('staff-receipts-get', staffName),
  
  // Enquiries
  getAllEnquiries: () => ipcRenderer.invoke('enquiries-get-all'),
  getEnquiryById: (id) => ipcRenderer.invoke('enquiries-get-by-id', id),
  createEnquiry: (enquiryData) => ipcRenderer.invoke('enquiries-create', enquiryData),
  updateEnquiry: (id, enquiryData) => ipcRenderer.invoke('enquiries-update', id, enquiryData),
  deleteEnquiry: (id) => ipcRenderer.invoke('enquiries-delete', id),
  convertEnquiryToMember: (enquiryId, memberData) => ipcRenderer.invoke('enquiries-convert-to-member', enquiryId, memberData),
  generateEnquiryNumber: () => ipcRenderer.invoke('generate-enquiry-number'),
  getMonthlyTransactionReport: (month, year) => ipcRenderer.invoke('get-monthly-transaction-report', month, year),
  
  // Body Measurements
  createBodyMeasurement: (measurementData) => ipcRenderer.invoke('body-measurements-create', measurementData),
  getAllBodyMeasurements: () => ipcRenderer.invoke('body-measurements-get-all'),
  getBodyMeasurementsByMember: (memberId) => ipcRenderer.invoke('body-measurements-get-by-member', memberId),
  updateBodyMeasurement: (id, measurementData) => ipcRenderer.invoke('body-measurements-update', id, measurementData),
  deleteBodyMeasurement: (id) => ipcRenderer.invoke('body-measurements-delete', id),
  
  // File system operations
  saveReceiptPDF: (receiptData, pdfBuffer) => ipcRenderer.invoke('save-receipt-pdf', receiptData, pdfBuffer),
  getReceiptsDirectory: () => ipcRenderer.invoke('get-receipts-directory'),
  openReceiptsFolder: () => ipcRenderer.invoke('open-receipts-folder'),
  getReceiptFilePath: (receiptData) => ipcRenderer.invoke('get-receipt-file-path', receiptData),

  // Invoices
  getAllInvoices: () => ipcRenderer.invoke('get-all-invoices'),
  getInvoicesByMemberId: (memberId) => ipcRenderer.invoke('get-invoices-by-member-id', memberId),
  createInvoice: (invoiceData) => ipcRenderer.invoke('create-invoice', invoiceData),
  updateInvoicePayment: (invoiceId, paidAmount) => ipcRenderer.invoke('update-invoice-payment', invoiceId, paidAmount),
  getMemberDueAmount: (memberId) => ipcRenderer.invoke('get-member-due-amount', memberId),
  payMemberDueAmount: (memberId, paymentAmount, paymentType, createdBy) => ipcRenderer.invoke('pay-member-due-amount', memberId, paymentAmount, paymentType, createdBy),

  // Utilities
  generateId: () => ipcRenderer.invoke('generate-id'),
  generateReceiptNumber: () => ipcRenderer.invoke('generate-receipt-number'),
  generateInvoiceNumber: () => ipcRenderer.invoke('generate-invoice-number'),
  renewMembership: (memberId, planType, membershipFees, createdBy) => ipcRenderer.invoke('renew-membership', memberId, planType, membershipFees, createdBy),
  updateMemberReceiptsInfo: (memberId) => ipcRenderer.invoke('update-member-receipts-info', memberId),
  updateMemberReceiptsFeeStructure: (memberId) => ipcRenderer.invoke('update-member-receipts-fee-structure', memberId),
  recalculateMemberTotals: (memberId) => ipcRenderer.invoke('recalculate-member-totals', memberId),
  getMemberDueAmount: (memberId) => ipcRenderer.invoke('get-member-due-amount', memberId),
  fixReceiptAmounts: () => ipcRenderer.invoke('fix-receipt-amounts'),
  
  // Subscription status
  updateAllSubscriptionStatuses: () => ipcRenderer.invoke('update-all-subscription-statuses'),
  
  // Expenses
  getAllExpenses: () => ipcRenderer.invoke('expense-get-all'),
  getExpenseById: (id) => ipcRenderer.invoke('expense-get-by-id', id),
  createExpense: (expenseData) => ipcRenderer.invoke('expense-create', expenseData),
  updateExpense: (id, expenseData) => ipcRenderer.invoke('expense-update', id, expenseData),
  deleteExpense: (id) => ipcRenderer.invoke('expense-delete', id),
  getExpensesByCategory: (category) => ipcRenderer.invoke('expense-get-by-category', category),
  getExpensesByDateRange: (startDate, endDate) => ipcRenderer.invoke('expense-get-by-date-range', startDate, endDate),
  getMonthlyExpenseReport: (year, month) => ipcRenderer.invoke('expense-get-monthly-report', year, month),
  
  // WhatsApp Automation
  getAllWhatsAppMessages: () => ipcRenderer.invoke('whatsapp-get-all-messages'),
  retryWhatsAppMessage: (messageId) => ipcRenderer.invoke('whatsapp-retry-message', messageId),
  triggerBirthdayMessages: () => ipcRenderer.invoke('whatsapp-trigger-birthday-messages'),
  getTodaysBirthdayMembers: () => ipcRenderer.invoke('whatsapp-get-todays-birthday-members'),
  triggerExpiryReminders: () => ipcRenderer.invoke('whatsapp-trigger-expiry-reminders'),
  triggerAttendanceReminders: () => ipcRenderer.invoke('whatsapp-trigger-attendance-reminders'),
  processPendingWhatsAppMessages: () => ipcRenderer.invoke('whatsapp-process-pending-messages'),
  sendWhatsAppMessage: (messageData) => ipcRenderer.invoke('whatsapp-send-message', messageData),
  updateWhatsAppMessageStatus: (messageId, status, sentAt, errorMessage) => ipcRenderer.invoke('whatsapp-update-message-status', messageId, status, sentAt, errorMessage),
  
  // Settings
  getSetting: (key) => ipcRenderer.invoke('settings-get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings-set', key, value),
  updateWhatsAppTemplate: (messageType, templateContent) => ipcRenderer.invoke('whatsapp-update-template', messageType, templateContent),
  createWhatsAppMessage: (messageData) => ipcRenderer.invoke('whatsapp-create-message', messageData)
});

// Remove the loading text when the page is ready
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});