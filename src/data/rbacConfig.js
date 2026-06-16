/**
 * Enterprise RBAC: module-scoped features (Level 2) under each PERMISSION_MODULES id (Level 1).
 * Academics uses nested parent-child groups; other modules use flat feature lists.
 *
 * Permission levels scaffold (future API): VIEW | EDIT | DELETE | FULL — currently stores boolean enabled.
 */
export const FEATURE_ACCESS_LEVEL = {
  BOOLEAN: 'boolean',
  VIEW: 'view_only',
  EDIT: 'edit',
  DELETE: 'delete',
  FULL: 'full',
}

/** @type {Record<string, { id: string, label: string, children?: { id: string, label: string }[] }[]>} */
export const RBAC_MODULE_FEATURES = {
  academics: [
    {
      id: 'batchGroup',
      label: 'Batch',
      children: [{ id: 'batch', label: 'Batch' }],
    },
    {
      id: 'facultySubjectsGroup',
      label: 'Faculty Subjects',
      children: [{ id: 'facultySubjects', label: 'Faculty Subjects' }],
    },
    {
      id: 'liveClassGroup',
      label: 'Live Class',
      children: [
        { id: 'scheduledClasses', label: 'Scheduled Classes' },
        { id: 'recordedClasses', label: 'Recorded Classes' },
        { id: 'liveSessions', label: 'Live Sessions' },
        { id: 'calendarView', label: 'Calendar View' },
      ],
    },
    {
      id: 'contentLibraryGroup',
      label: 'Content Library',
      children: [
        { id: 'contentDashboard', label: 'Dashboard' },
        { id: 'contentUpload', label: 'Upload' },
        { id: 'allContent', label: 'All Content' },
        { id: 'contentSubjects', label: 'Subjects' },
        { id: 'contentTopics', label: 'Topics' },
        { id: 'contentCategories', label: 'Categories' },
        { id: 'freeResources', label: 'Free Resources' },
        { id: 'currentAffairs', label: 'Current Affairs' },
      ],
    },
    {
      id: 'categoriesGroup',
      label: 'Categories',
      children: [
        { id: 'programs', label: 'Programs' },
        { id: 'examCategory', label: 'Exam Category' },
        { id: 'examSubcategory', label: 'Exam Subcategory' },
        { id: 'courses', label: 'Courses' },
        { id: 'subject', label: 'Subject' },
        { id: 'topic', label: 'Topic' },
        { id: 'teachers', label: 'Teachers' },
        { id: 'city', label: 'City' },
        { id: 'classrooms', label: 'Classrooms' },
      ],
    },
  ],
  test_management: [
    {
      id: 'dashboardGroup',
      label: 'Dashboard',
      children: [{ id: 'dashboard', label: 'Dashboard' }],
    },
    {
      id: 'cbtManagementGroup',
      label: 'CBT Management',
      children: [
        { id: 'cbtTest', label: 'CBT Test' },
        { id: 'omr', label: 'OMR' },
      ],
    },
    {
      id: 'mainsManagementGroup',
      label: 'Mains Management',
      children: [
        { id: 'mainsManagement', label: 'Mains Management' },
        { id: 'evaluationOversight', label: 'Evaluation Oversight' },
      ],
    },
    {
      id: 'questionBankGroup',
      label: 'Question Bank',
      children: [{ id: 'questionBank', label: 'Question Bank' }],
    },
    {
      id: 'testConfigurationGroup',
      label: 'Test Configuration',
      children: [
        { id: 'examPattern', label: 'Exam Pattern' },
        { id: 'sectionManagement', label: 'Section Management' },
        { id: 'languageSettings', label: 'Language Settings' },
      ],
    },
  ],
  users_access: [
    {
      id: 'usersAccessGroup',
      label: 'User & Access',
      children: [
        { id: 'listUsers', label: 'List Users' },
        { id: 'coupons', label: 'Coupons' },
      ],
    },
  ],
  engagement_crm: [
    {
      id: 'crmGroup',
      label: 'CRM',
      children: [
        { id: 'leads', label: 'Leads' },
        { id: 'enquiries', label: 'Enquiries' },
        { id: 'helpDesk', label: 'Help Desk' },
        { id: 'pushNotifications', label: 'Push Notifications' },
      ],
    },
  ],
  content_marketing: [
    {
      id: 'marketingGroup',
      label: 'Marketing',
      children: [
        { id: 'website', label: 'Website' },
        { id: 'seoLanding', label: 'SEO Landing Page' },
        { id: 'blogs', label: 'Blogs' },
      ],
    },
  ],
  finance_operation: [
    {
      id: 'financeOperationGroup',
      label: 'Finance Operations',
      children: [
        { id: 'paymentDashboard', label: 'Payment Dashboard' },
        { id: 'studentPaymentReports', label: 'Student Payment Reports' },
        { id: 'paymentVerification', label: 'Payment Verification Center' },
        { id: 'emiManagement', label: 'EMI Management' },
        { id: 'receiptManagement', label: 'Receipt Management' },
        { id: 'studentFinanceProfiles', label: 'Student Finance Profiles' },
        { id: 'paymentAttemptLogs', label: 'Payment Attempt Logs' },
        { id: 'offlinePaymentApproval', label: 'Offline Payment Approval' },
        { id: 'gstInvoiceSettings', label: 'GST & Invoice Settings' },
      ],
    },
  ],
  sales_analysis: [
    {
      id: 'salesAnalysisGroup',
      label: 'Sales & Analysis',
      children: [
        { id: 'leadDashboard', label: 'Lead Dashboard' },
        { id: 'userJourneyTracking', label: 'User Journey Tracking' },
        { id: 'leadManagement', label: 'Lead Management' },
        { id: 'conversionFunnel', label: 'Conversion Funnel' },
        { id: 'sourceAnalytics', label: 'Source Analytics' },
        { id: 'counselorPerformance', label: 'Counselor Performance' },
        { id: 'followUpManager', label: 'Follow-up Manager' },
        { id: 'paymentFailureTracking', label: 'Payment Failure Tracking' },
        { id: 'reportsExports', label: 'Reports & Exports' },
        { id: 'trackingConfiguration', label: 'Tracking Configuration' },
      ],
    },
  ],
  bookstore_management: [
    {
      id: 'bookstoreManagementGroup',
      label: 'Bookstore Management',
      children: [
        { id: 'bookstoreDashboard', label: 'Dashboard' },
        { id: 'products', label: 'Products' },
        { id: 'inventory', label: 'Inventory' },
        { id: 'orders', label: 'Orders' },
        { id: 'payments', label: 'Payments' },
        { id: 'recommendations', label: 'Recommendations' },
        { id: 'invoices', label: 'Invoices' },
        { id: 'bookstoreReports', label: 'Reports & Analytics' },
      ],
    },
  ],
  wallet_rewards: [
    {
      id: 'walletRewardsGroup',
      label: 'Wallet & Rewards',
      children: [
        { id: 'rewardsDashboard', label: 'Dashboard' },
        { id: 'rewardRules', label: 'Reward Rules' },
        { id: 'studentWallets', label: 'Student Wallets' },
        { id: 'manualAdjustments', label: 'Manual Adjustments' },
        { id: 'redemptions', label: 'Redemptions' },
        { id: 'leaderboards', label: 'Leaderboards' },
        { id: 'badges', label: 'Badges' },
        { id: 'fraudMonitoring', label: 'Fraud Monitoring' },
        { id: 'rewardsReports', label: 'Reports' },
        { id: 'rewardsSettings', label: 'Settings' },
        { id: 'studentPortalPreview', label: 'Student Portal (Preview)' },
      ],
    },
  ],
  operations: [
    {
      id: 'operationsGroup',
      label: 'Operations',
      children: [
        { id: 'liveModule', label: 'Live Module' },
        { id: 'reportsAnalytics', label: 'Reports & Analytics' },
        { id: 'configurations', label: 'Configuration' },
        { id: 'auditLogs', label: 'Audit Logs' },
      ],
    },
  ],
  system_tools: [
    {
      id: 'systemToolsGroup',
      label: 'System Tools',
      children: [
        { id: 'dataImportExport', label: 'Data Import / Export' },
        { id: 'apiIntegrations', label: 'API Integrations' },
        { id: 'queueMonitor', label: 'Queue Monitor' },
      ],
    },
  ],
}
