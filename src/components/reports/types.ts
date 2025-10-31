// Comprehensive Report Data Interface
export interface ReportData {
    // Core identification
    id?: string;
    memberName: string;
    memberId?: string;
    customMemberId?: string;
    
    // Financial data
    totalAmount?: number;
    totalPaid: number;
    balance: number;
    dueAmount?: number;
    amountPaid?: number;
    registrationFee?: number;
    packageFee?: number;
    membershipFees?: number;
    discount?: number;
    
    // Tax information
    cgst?: number;
    sgst?: number;
    totalTax?: number;
    gstIncluded: boolean;
    
    // Payment information
    paymentMethod?: string;
    paymentType?: string;
    paymentMode?: string;
    paymentDate?: string;
    lastPaymentDate?: string;
    receiptNumber?: string;
    transactionId?: string;
    
    // Member information
    status: string;
    membershipType?: string;
    planType?: string;
    joiningDate?: string;
    expiryDate?: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    subscriptionStatus?: string;
    
    // Contact information
    phoneNumber?: string;
    email?: string;
    address?: string;
    alternateNumber?: string;
    
    // Personal information
    age?: number;
    gender?: string;
    dateOfBirth?: string;
    birthday?: string;
    anniversary?: string;
    bloodGroup?: string;
    occupation?: string;
    maritalStatus?: string;
    
    // Physical measurements
    height?: number;
    weight?: number;
    bmi?: number;
    bodyFat?: number;
    
    // Attendance and activity
    lastAttendance?: string;
    totalAttendance?: number;
    attendanceCount?: number;
    checkInTime?: string;
    checkOutTime?: string;
    
    // Staff and trainer information
    assignedTrainer?: string;
    instructorName?: string;
    trainerAllocation?: string;
    specialization?: string;
    staffRole?: string;
    staffDesignation?: string;
    staffSalary?: number;
    staffJoiningDate?: string;
    
    // Course and program information
    courseName?: string;
    courseType?: string;
    services?: string[];
    programEnrollment?: string;
    courseEnrollment?: string;
    
    // Enquiry information
    enquiryDate?: string;
    enquiryNumber?: string;
    conversionDate?: string;
    followUpDate?: string;
    followUpStatus?: string;
    enquiryStatus?: string;
    referredBy?: string;
    interestedIn?: string;
    notes?: string;
    
    // Financial calculations and analytics
    monthlyRevenue?: number;
    profitMargin?: number;
    expenses?: number;
    netProfit?: number;
    grossProfit?: number;
    totalRevenue?: number;
    
    // Expense information
    expenseCategory?: string;
    expenseType?: string;
    expenseDescription?: string;
    expenseAmount?: number;
    expenseDate?: string;
    
    // Additional metadata
    category?: string;
    description?: string;
    paidStatus?: string;
    memberImage?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    
    // Report-specific fields
    daysLeft?: string;
    daysUntilExpiry?: number;
    isExpired?: boolean;
    isExpiringSoon?: boolean;
    memberCount?: number;
    totalMembers?: number;
    activeMembers?: number;
    inactiveMembers?: number;
    conversionRate?: number;
    
    // Summary and aggregation fields
    totalRecords?: number;
    averageAmount?: number;
    maxAmount?: number;
    minAmount?: number;
    totalTransactions?: number;
}

// Comprehensive Report Types Enum
export enum ReportType {
    // Financial Reports
    ALL_COLLECTION = 'all-collection',
    MEMBER_BALANCE_PAYMENT = 'member-balance-payment',
    EXPENSE_REPORT = 'expense-report',
    PAYMENT_DETAILS = 'payment-details',
    COURSE_WISE_COLLECTION = 'course-wise-collection',
    DATE_WISE_BALANCE_PAYMENT = 'date-wise-balance-payment',
    GST_REPORT = 'gst-report',
    BALANCE_SHEET = 'balance-sheet',
    PROFIT_LOSS = 'profit-loss',
    
    // Member Reports
    ACTIVE_DEACTIVE_MEMBERSHIP = 'active-deactive-membership',
    MEMBER_BIRTHDAY = 'member-birthday',
    MEMBERSHIP_END_DATE = 'membership-end-date',
    MEMBER_INFORMATION = 'member-information',
    MEMBER_DETAIL_REPORT = 'member-detail-report',
    MEMBER_COURSE_LEDGER = 'member-course-ledger',
    
    // Enquiry Reports
    ENQUIRY_TO_ENROLL = 'enquiry-to-enroll',
    ENQUIRY_FOLLOWUP = 'enquiry-followup',
    ALL_FOLLOWUP = 'all-followup',
    
    // Staff Reports
    MEMBER_INSTRUCTOR_ALLOCATION = 'member-instructor-allocation',
    PERSONAL_INSTRUCTOR = 'personal-instructor',
    
    // Comprehensive Reports
    DETAIL_REPORT = 'detail-report'
}

// Filter Definitions
export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterDefinition {
    id: string;
    label: string;
    type: 'date' | 'select' | 'multiselect' | 'text' | 'number' | 'daterange';
    options?: FilterOption[];
    required?: boolean;
    defaultValue?: any;
}

// Report Configuration
export interface ReportConfig {
    id: ReportType;
    title: string;
    description: string;
    requiresDateRange: boolean;
    icon: string;
    category: 'financial' | 'member' | 'staff' | 'analytics';
    availableFilters: FilterDefinition[];
    columns: ColumnDefinition[];
}

export interface ColumnDefinition {
    id: string;
    label: string;
    type: 'text' | 'number' | 'currency' | 'date' | 'status' | 'percentage';
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
}

// Report Filters Interface
export interface ReportFilters {
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    status?: string;
    membershipType?: string;
    paymentMethod?: string;
    instructor?: string;
    course?: string;
    month?: string;
    year?: string;
    category?: string;
    memberIds?: string[];
    amountRange?: {
        min: number;
        max: number;
    };
}

// Comprehensive Report Configurations
export const REPORT_CONFIGS: Record<ReportType, ReportConfig> = {
    // Financial Reports
    [ReportType.ALL_COLLECTION]: {
        id: ReportType.ALL_COLLECTION,
        title: 'All Collection Report',
        description: 'Complete collection report with all payment types and methods',
        requiresDateRange: true,
        icon: 'DollarSign',
        category: 'financial',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
            { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: [
                { value: 'all', label: 'All Methods' },
                { value: 'cash', label: 'Cash' },
                { value: 'upi', label: 'UPI' },
                { value: 'card', label: 'Card' },
                { value: 'bank_transfer', label: 'Bank Transfer' }
            ]},
            { id: 'membershipType', label: 'Membership Type', type: 'select', options: [
                { value: 'all', label: 'All Types' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'half_yearly', label: 'Half Yearly' },
                { value: 'yearly', label: 'Yearly' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Member Name', type: 'text', width: '20%', sortable: true },
            { id: 'receiptNumber', label: 'Receipt No.', type: 'text', width: '12%' },
            { id: 'totalPaid', label: 'Amount Paid', type: 'currency', width: '15%', sortable: true },
            { id: 'paymentMethod', label: 'Payment Method', type: 'text', width: '12%' },
            { id: 'paymentDate', label: 'Payment Date', type: 'date', width: '12%', sortable: true },
            { id: 'membershipType', label: 'Plan Type', type: 'text', width: '12%' },
            { id: 'cgst', label: 'CGST', type: 'currency', width: '8%' },
            { id: 'sgst', label: 'SGST', type: 'currency', width: '9%' }
        ]
    },

    [ReportType.MEMBER_BALANCE_PAYMENT]: {
        id: ReportType.MEMBER_BALANCE_PAYMENT,
        title: 'Member Wise Balance Payment Report',
        description: 'Individual member payment status and outstanding balances',
        requiresDateRange: false,
        icon: 'Users',
        category: 'financial',
        availableFilters: [
            { id: 'status', label: 'Member Status', type: 'select', options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'frozen', label: 'Frozen' }
            ]},
            { id: 'membershipType', label: 'Membership Type', type: 'select', options: [
                { value: 'all', label: 'All Types' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'half_yearly', label: 'Half Yearly' },
                { value: 'yearly', label: 'Yearly' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Member Name', type: 'text', width: '18%', sortable: true },
            { id: 'memberId', label: 'Member ID', type: 'text', width: '10%' },
            { id: 'totalAmount', label: 'Total Amount', type: 'currency', width: '12%' },
            { id: 'totalPaid', label: 'Amount Paid', type: 'currency', width: '12%', sortable: true },
            { id: 'balance', label: 'Due Amount', type: 'currency', width: '12%', sortable: true },
            { id: 'status', label: 'Status', type: 'status', width: '10%' },
            { id: 'lastPaymentDate', label: 'Last Payment', type: 'date', width: '12%' },
            { id: 'phoneNumber', label: 'Contact', type: 'text', width: '14%' }
        ]
    },

    [ReportType.EXPENSE_REPORT]: {
        id: ReportType.EXPENSE_REPORT,
        title: 'Expense Report',
        description: 'Track all gym expenses and operational costs',
        requiresDateRange: true,
        icon: 'TrendingUp',
        category: 'financial',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
            { id: 'category', label: 'Expense Category', type: 'select', options: [
                { value: 'all', label: 'All Categories' },
                { value: 'salary', label: 'Staff Salary' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'utilities', label: 'Utilities' },
                { value: 'other', label: 'Other' }
            ]}
        ],
        columns: [
            { id: 'description', label: 'Description', type: 'text', width: '25%' },
            { id: 'expenseCategory', label: 'Category', type: 'text', width: '15%' },
            { id: 'totalPaid', label: 'Amount', type: 'currency', width: '15%', sortable: true },
            { id: 'paymentMethod', label: 'Payment Method', type: 'text', width: '12%' },
            { id: 'expenseDate', label: 'Date', type: 'date', width: '12%', sortable: true },
            { id: 'memberName', label: 'Paid To', type: 'text', width: '21%' }
        ]
    },

    [ReportType.PAYMENT_DETAILS]: {
        id: ReportType.PAYMENT_DETAILS,
        title: 'Payment Details',
        description: 'Detailed payment transactions and receipt information',
        requiresDateRange: true,
        icon: 'Receipt',
        category: 'financial',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
            { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: [
                { value: 'all', label: 'All Methods' },
                { value: 'cash', label: 'Cash' },
                { value: 'upi', label: 'UPI' },
                { value: 'card', label: 'Card' },
                { value: 'bank_transfer', label: 'Bank Transfer' }
            ]}
        ],
        columns: [
            { id: 'receiptNumber', label: 'Receipt No.', type: 'text', width: '12%' },
            { id: 'memberName', label: 'Member Name', type: 'text', width: '18%', sortable: true },
            { id: 'totalPaid', label: 'Amount', type: 'currency', width: '12%', sortable: true },
            { id: 'paymentMethod', label: 'Payment Method', type: 'text', width: '12%' },
            { id: 'paymentDate', label: 'Payment Date', type: 'date', width: '12%', sortable: true },
            { id: 'description', label: 'Description', type: 'text', width: '20%' },
            { id: 'balance', label: 'Due Amount', type: 'currency', width: '14%' }
        ]
    },

    [ReportType.COURSE_WISE_COLLECTION]: {
        id: ReportType.COURSE_WISE_COLLECTION,
        title: 'Course Wise Collection',
        description: 'Revenue breakdown by membership plans and services',
        requiresDateRange: true,
        icon: 'BarChart3',
        category: 'financial',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
            { id: 'course', label: 'Course/Plan Type', type: 'select', options: [
                { value: 'all', label: 'All Courses' },
                { value: 'gym', label: 'Gym' },
                { value: 'aerobics', label: 'Aerobics' },
                { value: 'yoga', label: 'Yoga' },
                { value: 'personal_training', label: 'Personal Training' }
            ]}
        ],
        columns: [
            { id: 'courseName', label: 'Course/Plan', type: 'text', width: '20%', sortable: true },
            { id: 'memberCount', label: 'Members', type: 'number', width: '12%', sortable: true },
            { id: 'totalRevenue', label: 'Total Revenue', type: 'currency', width: '15%', sortable: true },
            { id: 'totalPaid', label: 'Amount Collected', type: 'currency', width: '15%', sortable: true },
            { id: 'balance', label: 'Outstanding', type: 'currency', width: '15%', sortable: true },
            { id: 'status', label: 'Status', type: 'status', width: '10%' },
            { id: 'description', label: 'Details', type: 'text', width: '13%' }
        ]
    },

    [ReportType.DATE_WISE_BALANCE_PAYMENT]: {
        id: ReportType.DATE_WISE_BALANCE_PAYMENT,
        title: 'Date wise Balance Payment Report',
        description: 'Daily balance and payment tracking report',
        requiresDateRange: true,
        icon: 'Calendar',
        category: 'financial',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true }
        ],
        columns: [
            { id: 'paymentDate', label: 'Date', type: 'date', width: '15%', sortable: true },
            { id: 'totalPaid', label: 'Amount Collected', type: 'currency', width: '18%', sortable: true },
            { id: 'balance', label: 'Outstanding', type: 'currency', width: '15%', sortable: true },
            { id: 'totalTransactions', label: 'Transactions', type: 'number', width: '12%' },
            { id: 'status', label: 'Status', type: 'status', width: '10%' },
            { id: 'description', label: 'Summary', type: 'text', width: '30%' }
        ]
    },

    [ReportType.GST_REPORT]: {
        id: ReportType.GST_REPORT,
        title: 'GST Report',
        description: 'GST breakdown and tax calculations for compliance',
        requiresDateRange: true,
        icon: 'Calculator',
        category: 'financial',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true }
        ],
        columns: [
            { id: 'receiptNumber', label: 'Receipt No.', type: 'text', width: '12%' },
            { id: 'memberName', label: 'Member Name', type: 'text', width: '18%', sortable: true },
            { id: 'totalPaid', label: 'Taxable Amount', type: 'currency', width: '15%', sortable: true },
            { id: 'cgst', label: 'CGST', type: 'currency', width: '12%' },
            { id: 'sgst', label: 'SGST', type: 'currency', width: '12%' },
            { id: 'totalTax', label: 'Total Tax', type: 'currency', width: '12%', sortable: true },
            { id: 'paymentDate', label: 'Date', type: 'date', width: '19%', sortable: true }
        ]
    },

    [ReportType.BALANCE_SHEET]: {
        id: ReportType.BALANCE_SHEET,
        title: 'Balance Sheet',
        description: 'Financial position with assets, liabilities and equity',
        requiresDateRange: true,
        icon: 'FileText',
        category: 'financial',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true }
        ],
        columns: [
            { id: 'category', label: 'Category', type: 'text', width: '25%' },
            { id: 'memberName', label: 'Item', type: 'text', width: '25%' },
            { id: 'totalPaid', label: 'Amount', type: 'currency', width: '20%', sortable: true },
            { id: 'description', label: 'Type', type: 'text', width: '15%' },
            { id: 'status', label: 'Status', type: 'status', width: '15%' }
        ]
    },

    [ReportType.PROFIT_LOSS]: {
        id: ReportType.PROFIT_LOSS,
        title: 'Profit And Loss Corner',
        description: 'Income statement showing revenue, expenses and profit',
        requiresDateRange: true,
        icon: 'TrendingUp',
        category: 'financial',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true }
        ],
        columns: [
            { id: 'category', label: 'Category', type: 'text', width: '25%' },
            { id: 'memberName', label: 'Item', type: 'text', width: '25%' },
            { id: 'totalPaid', label: 'Amount', type: 'currency', width: '20%', sortable: true },
            { id: 'description', label: 'Type', type: 'text', width: '15%' },
            { id: 'status', label: 'Status', type: 'status', width: '15%' }
        ]
    },

    // Member Reports
    [ReportType.ACTIVE_DEACTIVE_MEMBERSHIP]: {
        id: ReportType.ACTIVE_DEACTIVE_MEMBERSHIP,
        title: 'Active/Deactive Membership Report',
        description: 'Status-wise membership analysis and trends',
        requiresDateRange: false,
        icon: 'Users',
        category: 'member',
        availableFilters: [
            { id: 'status', label: 'Member Status', type: 'select', options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'frozen', label: 'Frozen' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Member Name', type: 'text', width: '20%', sortable: true },
            { id: 'memberId', label: 'Member ID', type: 'text', width: '12%' },
            { id: 'status', label: 'Status', type: 'status', width: '12%' },
            { id: 'membershipType', label: 'Plan Type', type: 'text', width: '12%' },
            { id: 'joiningDate', label: 'Join Date', type: 'date', width: '12%', sortable: true },
            { id: 'expiryDate', label: 'Expiry Date', type: 'date', width: '12%', sortable: true },
            { id: 'phoneNumber', label: 'Contact', type: 'text', width: '20%' }
        ]
    },

    [ReportType.MEMBER_BIRTHDAY]: {
        id: ReportType.MEMBER_BIRTHDAY,
        title: 'Member Birthday Report',
        description: 'Members celebrating birthdays for engagement campaigns',
        requiresDateRange: false,
        icon: 'Gift',
        category: 'member',
        availableFilters: [
            { id: 'month', label: 'Month', type: 'select', options: [
                { value: '01', label: 'January' },
                { value: '02', label: 'February' },
                { value: '03', label: 'March' },
                { value: '04', label: 'April' },
                { value: '05', label: 'May' },
                { value: '06', label: 'June' },
                { value: '07', label: 'July' },
                { value: '08', label: 'August' },
                { value: '09', label: 'September' },
                { value: '10', label: 'October' },
                { value: '11', label: 'November' },
                { value: '12', label: 'December' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Member Name', type: 'text', width: '20%', sortable: true },
            { id: 'birthday', label: 'Birthday', type: 'date', width: '12%', sortable: true },
            { id: 'age', label: 'Age', type: 'number', width: '8%' },
            { id: 'phoneNumber', label: 'Contact', type: 'text', width: '15%' },
            { id: 'email', label: 'Email', type: 'text', width: '18%' },
            { id: 'status', label: 'Status', type: 'status', width: '10%' },
            { id: 'membershipType', label: 'Plan Type', type: 'text', width: '17%' }
        ]
    },

    [ReportType.MEMBERSHIP_END_DATE]: {
        id: ReportType.MEMBERSHIP_END_DATE,
        title: 'Membership End Date Report',
        description: 'Track membership expiry dates and renewal requirements',
        requiresDateRange: false,
        icon: 'Calendar',
        category: 'member',
        availableFilters: [
            { id: 'status', label: 'Expiry Status', type: 'select', options: [
                { value: 'all', label: 'All' },
                { value: 'expiring_soon', label: 'Expiring Soon' },
                { value: 'expired', label: 'Expired' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Member Name', type: 'text', width: '18%', sortable: true },
            { id: 'memberId', label: 'Member ID', type: 'text', width: '12%' },
            { id: 'expiryDate', label: 'Expiry Date', type: 'date', width: '15%', sortable: true },
            { id: 'daysLeft', label: 'Days Left', type: 'text', width: '10%' },
            { id: 'status', label: 'Status', type: 'status', width: '12%' },
            { id: 'membershipType', label: 'Plan Type', type: 'text', width: '12%' },
            { id: 'phoneNumber', label: 'Contact', type: 'text', width: '21%' }
        ]
    },

    [ReportType.MEMBER_INFORMATION]: {
        id: ReportType.MEMBER_INFORMATION,
        title: 'Member Information',
        description: 'Comprehensive member database with all details',
        requiresDateRange: false,
        icon: 'User',
        category: 'member',
        availableFilters: [
            { id: 'status', label: 'Member Status', type: 'select', options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'frozen', label: 'Frozen' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Member Name', type: 'text', width: '15%', sortable: true },
            { id: 'memberId', label: 'Member ID', type: 'text', width: '10%' },
            { id: 'phoneNumber', label: 'Contact', type: 'text', width: '12%' },
            { id: 'email', label: 'Email', type: 'text', width: '15%' },
            { id: 'membershipType', label: 'Plan Type', type: 'text', width: '10%' },
            { id: 'joiningDate', label: 'Join Date', type: 'date', width: '10%', sortable: true },
            { id: 'status', label: 'Status', type: 'status', width: '8%' },
            { id: 'address', label: 'Address', type: 'text', width: '20%' }
        ]
    },

    [ReportType.MEMBER_DETAIL_REPORT]: {
        id: ReportType.MEMBER_DETAIL_REPORT,
        title: 'Member Detail Report',
        description: 'In-depth member profiles with payment and attendance history',
        requiresDateRange: false,
        icon: 'FileText',
        category: 'member',
        availableFilters: [
            { id: 'status', label: 'Member Status', type: 'select', options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'frozen', label: 'Frozen' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Member Name', type: 'text', width: '15%', sortable: true },
            { id: 'memberId', label: 'Member ID', type: 'text', width: '10%' },
            { id: 'totalPaid', label: 'Total Paid', type: 'currency', width: '12%', sortable: true },
            { id: 'balance', label: 'Due Amount', type: 'currency', width: '12%', sortable: true },
            { id: 'lastPaymentDate', label: 'Last Payment', type: 'date', width: '12%' },
            { id: 'assignedTrainer', label: 'Trainer', type: 'text', width: '12%' },
            { id: 'totalAttendance', label: 'Attendance', type: 'number', width: '10%' },
            { id: 'status', label: 'Status', type: 'status', width: '17%' }
        ]
    },

    [ReportType.MEMBER_COURSE_LEDGER]: {
        id: ReportType.MEMBER_COURSE_LEDGER,
        title: 'Member Course Registration Ledger Report',
        description: 'Member enrollment history and course progression tracking',
        requiresDateRange: true,
        icon: 'BookOpen',
        category: 'member',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
            { id: 'course', label: 'Course Type', type: 'select', options: [
                { value: 'all', label: 'All Courses' },
                { value: 'gym', label: 'Gym' },
                { value: 'aerobics', label: 'Aerobics' },
                { value: 'yoga', label: 'Yoga' },
                { value: 'personal_training', label: 'Personal Training' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Member Name', type: 'text', width: '18%', sortable: true },
            { id: 'memberId', label: 'Member ID', type: 'text', width: '10%' },
            { id: 'courseEnrollment', label: 'Course', type: 'text', width: '15%' },
            { id: 'joiningDate', label: 'Enrollment Date', type: 'date', width: '12%', sortable: true },
            { id: 'totalPaid', label: 'Amount Paid', type: 'currency', width: '12%', sortable: true },
            { id: 'balance', label: 'Due Amount', type: 'currency', width: '12%' },
            { id: 'status', label: 'Status', type: 'status', width: '21%' }
        ]
    },

    // Enquiry Reports
    [ReportType.ENQUIRY_TO_ENROLL]: {
        id: ReportType.ENQUIRY_TO_ENROLL,
        title: 'Enquiry To Enroll Report',
        description: 'Track enquiry conversion rates and enrollment success',
        requiresDateRange: true,
        icon: 'UserPlus',
        category: 'analytics',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
            { id: 'status', label: 'Conversion Status', type: 'select', options: [
                { value: 'all', label: 'All' },
                { value: 'enrolled', label: 'Enrolled' },
                { value: 'pending', label: 'Pending' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Name', type: 'text', width: '18%', sortable: true },
            { id: 'phoneNumber', label: 'Contact', type: 'text', width: '12%' },
            { id: 'enquiryDate', label: 'Enquiry Date', type: 'date', width: '12%', sortable: true },
            { id: 'status', label: 'Status', type: 'status', width: '12%' },
            { id: 'conversionDate', label: 'Conversion Date', type: 'date', width: '12%' },
            { id: 'interestedIn', label: 'Interested In', type: 'text', width: '12%' },
            { id: 'referredBy', label: 'Referred By', type: 'text', width: '22%' }
        ]
    },

    [ReportType.ENQUIRY_FOLLOWUP]: {
        id: ReportType.ENQUIRY_FOLLOWUP,
        title: 'Enquiry Followup Report',
        description: 'Pending enquiry follow-ups and contact schedules',
        requiresDateRange: true,
        icon: 'Phone',
        category: 'analytics',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
            { id: 'status', label: 'Followup Status', type: 'select', options: [
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'completed', label: 'Completed' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Name', type: 'text', width: '18%', sortable: true },
            { id: 'phoneNumber', label: 'Contact', type: 'text', width: '12%' },
            { id: 'enquiryDate', label: 'Enquiry Date', type: 'date', width: '12%' },
            { id: 'followUpDate', label: 'Follow-up Date', type: 'date', width: '12%', sortable: true },
            { id: 'status', label: 'Status', type: 'status', width: '12%' },
            { id: 'interestedIn', label: 'Interested In', type: 'text', width: '12%' },
            { id: 'notes', label: 'Notes', type: 'text', width: '22%' }
        ]
    },

    [ReportType.ALL_FOLLOWUP]: {
        id: ReportType.ALL_FOLLOWUP,
        title: 'All Followup Report',
        description: 'Complete follow-up history and communication tracking',
        requiresDateRange: true,
        icon: 'MessageCircle',
        category: 'analytics',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true }
        ],
        columns: [
            { id: 'memberName', label: 'Name', type: 'text', width: '18%', sortable: true },
            { id: 'phoneNumber', label: 'Contact', type: 'text', width: '12%' },
            { id: 'enquiryDate', label: 'Enquiry Date', type: 'date', width: '12%', sortable: true },
            { id: 'followUpDate', label: 'Follow-up Date', type: 'date', width: '12%' },
            { id: 'status', label: 'Status', type: 'status', width: '12%' },
            { id: 'interestedIn', label: 'Interested In', type: 'text', width: '12%' },
            { id: 'notes', label: 'Notes', type: 'text', width: '22%' }
        ]
    },

    // Staff Reports
    [ReportType.MEMBER_INSTRUCTOR_ALLOCATION]: {
        id: ReportType.MEMBER_INSTRUCTOR_ALLOCATION,
        title: 'Member Wise Instructor Allocation Report',
        description: 'Trainer assignments and member distribution analysis',
        requiresDateRange: false,
        icon: 'Building2',
        category: 'staff',
        availableFilters: [
            { id: 'instructor', label: 'Instructor', type: 'select', options: [
                { value: 'all', label: 'All Instructors' }
            ]}
        ],
        columns: [
            { id: 'memberName', label: 'Member Name', type: 'text', width: '20%', sortable: true },
            { id: 'memberId', label: 'Member ID', type: 'text', width: '12%' },
            { id: 'assignedTrainer', label: 'Assigned Trainer', type: 'text', width: '18%', sortable: true },
            { id: 'specialization', label: 'Specialization', type: 'text', width: '15%' },
            { id: 'membershipType', label: 'Plan Type', type: 'text', width: '12%' },
            { id: 'joiningDate', label: 'Join Date', type: 'date', width: '12%' },
            { id: 'status', label: 'Status', type: 'status', width: '11%' }
        ]
    },

    [ReportType.PERSONAL_INSTRUCTOR]: {
        id: ReportType.PERSONAL_INSTRUCTOR,
        title: 'Personal Instructor Report',
        description: 'Individual trainer performance and member assignments',
        requiresDateRange: false,
        icon: 'User',
        category: 'staff',
        availableFilters: [
            { id: 'instructor', label: 'Instructor', type: 'select', options: [
                { value: 'all', label: 'All Instructors' }
            ]}
        ],
        columns: [
            { id: 'instructorName', label: 'Instructor Name', type: 'text', width: '18%', sortable: true },
            { id: 'specialization', label: 'Specialization', type: 'text', width: '15%' },
            { id: 'totalMembers', label: 'Total Members', type: 'number', width: '12%', sortable: true },
            { id: 'activeMembers', label: 'Active Members', type: 'number', width: '12%', sortable: true },
            { id: 'phoneNumber', label: 'Contact', type: 'text', width: '12%' },
            { id: 'joiningDate', label: 'Join Date', type: 'date', width: '12%' },
            { id: 'status', label: 'Status', type: 'status', width: '19%' }
        ]
    },

    // Comprehensive Reports
    [ReportType.DETAIL_REPORT]: {
        id: ReportType.DETAIL_REPORT,
        title: 'Detail Report',
        description: 'Comprehensive gym operations report with all metrics',
        requiresDateRange: true,
        icon: 'FileText',
        category: 'analytics',
        availableFilters: [
            { id: 'dateRange', label: 'Date Range', type: 'daterange', required: true }
        ],
        columns: [
            { id: 'category', label: 'Category', type: 'text', width: '20%' },
            { id: 'memberName', label: 'Description', type: 'text', width: '25%' },
            { id: 'totalPaid', label: 'Value/Count', type: 'currency', width: '15%', sortable: true },
            { id: 'status', label: 'Status', type: 'status', width: '12%' },
            { id: 'description', label: 'Details', type: 'text', width: '28%' }
        ]
    }
};