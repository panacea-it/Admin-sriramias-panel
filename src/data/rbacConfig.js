/**
 * Enterprise RBAC: module-scoped features (Level 2) under each PERMISSION_MODULES id (Level 1).
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

/** @type {Record<string, { id: string, label: string }[]>} */
export const RBAC_MODULE_FEATURES = {
  academics: [
    { id: 'studentManagement', label: 'Student Management' },
    { id: 'courseManagement', label: 'Course Management' },
    { id: 'batchManagement', label: 'Batch Management' },
    { id: 'liveClasses', label: 'Live Classes' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'exams', label: 'Exams' },
    { id: 'results', label: 'Results' },
    { id: 'facultyManagement', label: 'Faculty Management' },
    { id: 'studyMaterials', label: 'Study Materials' },
  ],
  users_access: [
    { id: 'userCreation', label: 'User Creation' },
    { id: 'adminCreation', label: 'Admin Creation' },
    { id: 'roleAssignment', label: 'Role Assignment' },
    { id: 'walletManagement', label: 'Wallet Management' },
    { id: 'coupons', label: 'Coupons' },
    { id: 'accessControl', label: 'Access Control' },
    { id: 'permissionEditing', label: 'Permission Editing' },
  ],
  engagement_crm: [
    { id: 'leads', label: 'Leads' },
    { id: 'enquiries', label: 'Enquiries' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'helpDesk', label: 'Help Desk' },
    { id: 'campaignTracking', label: 'Campaign Tracking' },
    { id: 'followUps', label: 'Follow Ups' },
  ],
  content_marketing: [
    { id: 'blogManagement', label: 'Blog Management' },
    { id: 'freeResources', label: 'Free Resources' },
    { id: 'currentAffairs', label: 'Current Affairs' },
    { id: 'bannerManagement', label: 'Banner Management' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'seoContent', label: 'SEO Content' },
    { id: 'mediaUploads', label: 'Media Uploads' },
  ],
  test_management: [
    { id: 'omrManagement', label: 'OMR Management' },
    { id: 'cbtManagement', label: 'CBT Management' },
    { id: 'mainsManagement', label: 'Mains Management' },
    { id: 'questionBank', label: 'Question Bank' },
    { id: 'testConfiguration', label: 'Test Configuration' },
    { id: 'evaluationOversight', label: 'Evaluation Oversight' },
    { id: 'testAnalytics', label: 'Test Analytics' },
  ],
  operations: [
    { id: 'userWorkflow', label: 'User Workflow' },
    { id: 'reportsAnalytics', label: 'Reports & Analytics' },
    { id: 'configurations', label: 'Configurations' },
    { id: 'auditLogs', label: 'Audit Logs' },
    { id: 'operationalTasks', label: 'Operational Tasks' },
    { id: 'teamAssignments', label: 'Team Assignments' },
    { id: 'processTracking', label: 'Process Tracking' },
    { id: 'dataMonitoring', label: 'Data Monitoring' },
    { id: 'approvalManagement', label: 'Approval Management' },
    { id: 'internalEscalations', label: 'Internal Escalations' },
  ],
  system_tools: [
    { id: 'logs', label: 'Logs' },
    { id: 'databaseAccess', label: 'Database Access' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'platformSettings', label: 'Platform Settings' },
    { id: 'backupControl', label: 'Backup Control' },
    { id: 'apiSettings', label: 'API Settings' },
  ],
}
