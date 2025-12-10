export const en = {
  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
  },

  // Settings
  settings: {
    title: 'Settings',
    subtitle: 'Customize your workspace and personal preferences',
    language: {
      title: 'Language / Język / Sprache',
      label: 'Language',
      description: 'Change the language used in the user interface',
      changed: 'Language has been changed',
      error: 'Failed to change language',
    },
    timezone: {
      title: 'Time zone',
      label: 'Time zone',
      automatic: 'Automatic time zone',
      description: 'Select your time zone for correct date display',
      detected: 'Detected zone',
      changed: 'Time zone has been changed',
      error: 'Failed to change time zone',
    },
    theme: {
      title: 'Theme',
      description: 'Choose light, dark or automatic theme',
      light: 'Light',
      dark: 'Dark',
      system: 'Automatic',
      changed: 'Theme has been changed',
    },
    info: {
      tip: 'Tip',
      tipMessage:
        'Language and time zone changes are saved in your profile and synchronized across all devices.',
    },
    dateWeek: {
      title: 'Date & week',
      dateFormat: 'Date Format',
      weekStart: 'Week start',
      weekStartHelp: 'This will change how all calendars in your app look.',
      weekend: 'Weekend',
    },
    appearance: {
      title: 'Appearance',
      themeMode: 'Theme mode',
      description:
        'Choose how the app looks to you. Select a single theme, or sync with your system and automatically switch between day and night themes.',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
      active: 'Active',
    },
    actions: {
      saveChanges: 'Save changes',
      reset: 'Reset',
    },
    deleteAccount: {
      title: 'Delete Account',
      description:
        'Request account deletion. Your account will be deactivated and can be restored within 30 days.',
      warning:
        'Warning: Your account will be deactivated. You can restore it within 30 days by visiting /restore-account. After 30 days, restoration will no longer be possible.',
      button: 'Delete Account',
      modal: {
        title: 'Delete Account',
        description:
          'Your account will be deactivated immediately. You have 30 days to restore it if you change your mind.',
        reasonLabel: 'Reason for deletion (optional)',
        reasonPlaceholder: 'Tell us why you are leaving...',
        confirmLabel: 'Type DELETE to confirm',
        confirmPlaceholder: 'DELETE',
        cancel: 'Cancel',
        confirm: 'Delete Account',
        success:
          'Your account has been deactivated. You can restore it within 30 days.',
        error: 'Failed to delete account',
        invalidConfirmation: 'Please type DELETE to confirm',
      },
    },
  },

  // Account Restoration
  accountRestoration: {
    request: {
      title: 'Restore Your Account',
      subtitle: 'Enter your email address to receive a restoration link',
      emailLabel: 'Email address',
      emailPlaceholder: 'your@email.com',
      submit: 'Send Restoration Link',
      submitting: 'Sending...',
      success:
        'If your account exists and was recently deleted, you will receive an email with restoration instructions.',
      error: 'Failed to request account restoration',
    },
    restore: {
      title: 'Restore Your Account',
      subtitle: 'Click below to restore your account',
      button: 'Restore My Account',
      restoring: 'Restoring...',
      success: 'Your account has been restored! You can now log in.',
      error:
        'Failed to restore account. The link may have expired or is invalid.',
      backToLogin: 'Back to Login',
    },
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    subtitle: 'Manage your notifications and stay updated',
    loginRequired: 'You must be logged in to view notifications',
    refresh: 'Refresh',
    markAllRead: 'Mark all read',
    all: 'All',
    unread: 'Unread',
    read: 'Read',
    total: 'Total',
    markAsRead: 'Mark as read',
    delete: 'Delete',
    loadedAll: 'All loaded',
    empty: {
      all: 'No notifications',
      unread: 'No unread notifications',
      read: 'No read notifications',
      description: 'Notifications will appear here when something happens',
      changeFilter: 'Change filter to see other notifications',
    },
    kinds: {
      EVENT_REMINDER: 'Event reminder',
      EVENT_UPDATED: 'Event updated',
      EVENT_CANCELED: 'Event canceled',
      EVENT_CREATED: 'New event',
      NEW_MESSAGE: 'New message',
      NEW_COMMENT: 'New comment',
      NEW_REVIEW: 'New review',
      MEMBER_JOINED: 'New participant',
      MEMBER_LEFT: 'Participant left',
      INVITE_RECEIVED: 'Invitation received',
      default: 'Notification',
    },
    // Notification content (title + body with interpolation)
    content: {
      EVENT_CREATED: {
        title: 'New event',
        body: 'A new event has been created.',
      },
      EVENT_UPDATED: {
        title: 'Event updated',
        body: 'Event "{{eventTitle}}" has been updated.{{changesDescription}}',
      },
      EVENT_CANCELED: {
        title: 'Event canceled',
        body: '{{reason}}',
      },
      EVENT_DELETED: {
        title: 'Event deleted',
        body: 'The event has been permanently deleted.',
      },
      EVENT_INVITE: {
        title: 'Event invitation',
        body: 'You have been invited to "{{eventTitle}}".',
      },
      EVENT_INVITE_ACCEPTED: {
        title: 'Invitation accepted',
        body: '{{actorName}} accepted your invitation to join the event.',
      },
      EVENT_MEMBERSHIP_APPROVED: {
        title: 'Request approved',
        body: 'Your request to join "{{eventTitle}}" has been approved.',
      },
      EVENT_MEMBERSHIP_REJECTED: {
        title: 'Request rejected',
        body: 'Your request to join "{{eventTitle}}" was rejected.{{reason}}',
      },
      EVENT_MEMBER_KICKED: {
        title: 'Removed from event',
        body: 'You have been removed from the event.{{reason}}',
      },
      EVENT_MEMBER_ROLE_CHANGED: {
        title: 'Role changed',
        body: 'Your role has been changed to {{newRole}}.',
      },
      JOIN_REQUEST: {
        title: 'New join request',
        body: '{{actorName}} is requesting to join your event.',
      },
      BANNED: {
        title: 'Banned',
        body: 'You have been banned from the event.{{reason}}',
      },
      UNBANNED: {
        title: 'Unbanned',
        body: 'Your ban has been lifted. You can request to join again.',
      },
      WAITLIST_JOINED: {
        title: 'Added to waitlist',
        body: '{{actorName}} joined the waitlist.',
      },
      WAITLIST_PROMOTED: {
        title: 'Promoted from waitlist',
        body: "You've been promoted from the waitlist! You're now a participant.",
      },
      EVENT_REVIEW_RECEIVED: {
        title: 'New review',
        body: '{{actorName}} left a review ({{rating}} ⭐){{reviewContent}}',
      },
      EVENT_FEEDBACK_RECEIVED: {
        title: 'New feedback',
        body: '{{actorName}} submitted feedback ({{rating}} ⭐).',
      },
      EVENT_FEEDBACK_REQUEST: {
        title: 'Share your feedback',
        body: 'How was "{{eventTitle}}"? Share your feedback.',
      },
      REVIEW_HIDDEN: {
        title: 'Review hidden',
        body: 'Your review has been hidden by {{moderatorName}}.',
      },
      EVENT_COMMENT_ADDED: {
        title: 'New comment',
        body: '{{actorName}}: {{commentContent}}',
      },
      COMMENT_REPLY: {
        title: 'Reply to your comment',
        body: '{{actorName}}: {{commentContent}}',
      },
      COMMENT_HIDDEN: {
        title: 'Comment hidden',
        body: 'Your comment has been hidden by {{moderatorName}}.',
      },
      NEW_MESSAGE: {
        title: 'New message',
        body: '{{actorName}}: {{messageContent}}',
      },
      NEW_COMMENT: {
        title: 'New comment',
        body: '{{actorName}} added a comment.',
      },
      NEW_REVIEW: {
        title: 'New review',
        body: '{{actorName}} left a review ({{rating}} ⭐).',
      },
      EVENT_CHAT_MESSAGE: {
        title: 'New chat message',
        body: '{{actorName}}: {{messageContent}}',
      },
      EVENT_REMINDER: {
        title: 'Event reminder',
        body: 'Event "{{eventTitle}}" starts {{startsIn}}.',
      },
      SYSTEM: {
        title: 'System notification',
        body: '{{message}}',
      },
    },
    roles: {
      OWNER: 'owner',
      MODERATOR: 'moderator',
      PARTICIPANT: 'participant',
    },
    relativeTime: {
      inMinutes: 'in {{count}} min',
      inHours: 'in {{count}} hours',
      inDays: 'in {{count}} days',
      soon: 'soon',
    },
    reasonPrefix: 'Reason:',
    changedFields: {
      title: 'title',
      description: 'description',
      notes: 'notes',
      startAt: 'start time',
      endAt: 'end time',
      address: 'location',
      onlineUrl: 'online link',
      min: 'minimum participants',
      max: 'maximum participants',
      meetingKind: 'meeting type',
      visibility: 'visibility',
      joinMode: 'join mode',
      addressVisibility: 'address visibility',
      membersVisibility: 'members visibility',
      joinOpensMinutesBeforeStart: 'registration opening',
      joinCutoffMinutesBeforeStart: 'registration closing',
      allowJoinLate: 'late joining',
      lateJoinCutoffMinutesAfterStart: 'late join cutoff',
      levels: 'levels',
      categories: 'categories',
      tags: 'tags',
    },
    changesPrefix: ' Changed:',
  },

  // Favourites
  favourites: {
    title: 'Favourites',
    subtitle: 'Your saved events',
    savedEvents: 'saved',
    savedEvent: 'event',
    savedEventsPlural: 'events',
    emptyTitle: 'No favourites yet',
    emptyDescription:
      'Browse events and click the ❤️ icon to save interesting events for later.',
    browseEvents: 'Browse Events',
    loadMore: 'Load More',
    loading: 'Loading…',
    loadingFavourites: 'Loading your favourites...',
    removeFromFavourites: 'Remove from favourites',
    viewEvent: 'View Event',
    participants: 'participants',
    showingEvents: 'Showing',
  },

  // My Events
  myEvents: {
    title: 'My Events',
    subtitle: 'Manage all your events in one place',
    loading: 'Loading...',
    notAuthenticated: 'Not authenticated',
    pleaseLogin: 'Please log in to view your events',
    errorLoading: 'Error loading events',
    noEvents: 'No events',
    tryChangeFilters: 'Try changing the filters',
    noEventsYet: "You don't have any events yet",
    clearFilters: 'Clear all filters',
    showing: 'Showing',
    event: 'event',
    events: 'events',
    multipleSelectionAllowed: 'Multiple selection allowed',
    filters: {
      role: 'Role',
      status: 'Status',
      all: 'Filters',
      owner: 'Owner',
      moderator: 'Moderator',
      member: 'Member',
      pending: 'Pending',
      invited: 'Invited',
      rejected: 'Rejected',
      banned: 'Banned',
      waitlist: 'Waitlist',
      upcoming: 'Upcoming',
      ongoing: 'Ongoing',
      finished: 'Finished',
      canceled: 'Canceled',
    },
    badges: {
      owner: 'OWNER',
      moderator: 'MODERATOR',
      member: 'MEMBER',
      joined: 'JOINED',
      pending: 'PENDING',
      invited: 'INVITED',
      rejected: 'REJECTED',
      banned: 'BANNED',
      left: 'LEFT',
      waitlist: 'WAITLIST',
      live: 'LIVE',
      finished: 'FINISHED',
      canceled: 'CANCELED',
      deleted: 'DELETED',
    },
    actions: {
      manage: 'Manage',
      view: 'View',
      cancel: 'Cancel',
      leave: 'Leave',
      withdraw: 'Withdraw',
      accept: 'Accept',
      decline: 'Decline',
    },
    messages: {
      requestRejected: 'Your request was rejected',
      youAreBanned: 'You are banned from this Event',
    },
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    events: 'Events',
    account: 'Account',
    settings: 'Settings',
  },

  // Account Sidebar Navigation
  accountNav: {
    groups: {
      personal: 'Your Profile',
      activity: 'Events & Activity',
      communication: 'Communication',
      billing: 'Subscription & Billing',
      tools: 'Advanced Tools',
      settingsSupport: 'Settings & Support',
    },
    items: {
      viewProfile: 'View Profile',
      editProfile: 'Edit Profile',
      myEvents: 'My Events',
      favourites: 'Favourites',
      chats: 'Chats',
      notifications: 'Notifications',
      subscription: 'Subscription',
      plansAndBills: 'Plans & Bills',
      analytics: 'Analytics',
      settings: 'Settings',
      cookieSettings: 'Cookie Settings',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      help: 'Help',
      signOut: 'Sign out',
    },
  },

  // Help & Support
  help: {
    title: 'Help & Support',
    subtitle: 'Get help with your account and events',
    form: {
      title: 'Contact Support',
      subtitle: "Fill out the form below and we'll respond within 24 hours",
      category: {
        label: 'Category',
        placeholder: 'Select a category...',
        account: 'Account & Profile',
        events: 'Events & Activities',
        billing: 'Billing & Subscription',
        technical: 'Technical Issue',
        other: 'Other',
      },
      subject: {
        label: 'Subject',
        placeholder: 'Brief description of your issue',
      },
      message: {
        label: 'Message',
        placeholder: 'Please describe your issue in detail...',
      },
      responseTime: 'We typically respond within 24 hours',
      submit: 'Send Message',
      sending: 'Sending...',
      success: "Your message has been sent! We'll get back to you soon.",
      error: 'Please fill in all fields',
    },
    contact: {
      emailTitle: 'Email Support',
      emailDescription: 'Prefer email? Send us a message directly',
      faqTitle: 'Common Questions',
      faqItems: {
        createEvent: 'How do I create an event?',
        manageSubscription: 'Managing subscriptions',
        privacy: 'Privacy & security',
        paymentIssues: 'Payment issues',
      },
    },
  },

  // Cookie Settings
  cookies: {
    title: 'Cookie Settings',
    subtitle: 'Manage your cookie preferences and privacy settings',
    about: {
      title: 'About Cookies',
      description:
        'We use cookies to improve your experience on our site. Click the button below to customize your cookie preferences for each category.',
    },
    howItWorks: {
      title: 'How it works',
      description:
        'Click the button above to open the cookie consent banner where you can accept, reject, or customize your cookie preferences for each category.',
    },
    categoriesTitle: 'Cookie Categories',
    clickManage:
      'Click "Manage Cookie Preferences" above to customize your choices.',
    gdprCompliant: 'GDPR & ePrivacy Compliant',
    gdprDescription:
      'We respect your privacy and comply with GDPR and ePrivacy regulations. You have full control over your cookie preferences and can change them at any time.',
    categories: {
      essential: {
        name: 'Essential Cookies',
        description:
          'These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you.',
        required: '(Required)',
        examples: {
          session: 'Session cookies',
          security: 'Security tokens',
          loadBalancing: 'Load balancing',
        },
      },
      analytics: {
        name: 'Analytics Cookies',
        description:
          'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.',
        examples: {
          googleAnalytics: 'Google Analytics',
          pageViews: 'Page view tracking',
          userBehavior: 'User behavior',
        },
      },
      marketing: {
        name: 'Marketing Cookies',
        description:
          'These cookies may be set through our site by our advertising partners. They may be used to build a profile of your interests.',
        examples: {
          adTargeting: 'Ad targeting',
          socialMedia: 'Social media pixels',
          remarketing: 'Remarketing',
        },
      },
      preferences: {
        name: 'Preference Cookies',
        description:
          'These cookies enable the website to provide enhanced functionality and personalization based on your interactions.',
        examples: {
          language: 'Language settings',
          theme: 'Theme preferences',
          region: 'Region settings',
        },
      },
    },
    actions: {
      manageCookies: 'Manage Cookie Preferences',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      savePreferences: 'Save Preferences',
      saving: 'Saving...',
      saved: 'Cookie settings saved successfully',
    },
  },

  // Analytics
  analytics: {
    title: 'Analytics',
    subtitle: 'Track your event performance and engagement',
    comingSoon: {
      title: 'Analytics coming soon',
      description:
        "We're working on bringing you detailed analytics for your events. Track views, engagement, and more.",
      button: 'Coming Soon',
    },
  },

  // Plans and Bills
  plansAndBills: {
    title: 'Plans & Billing',
    subtitle: 'Manage your subscription and billing information',
    loading: 'Loading billing information...',
    currentPlan: {
      title: 'Current Plan',
      renewsOn: 'Renews on',
      expiresOn: 'Expires on',
      timeToRenewal: 'Time until renewal',
      timeToExpiry: 'Time until expiry',
      daysRemaining: 'days remaining',
      day: 'day',
      days: 'days',
      willRenewOn: 'Plan will renew on',
      willExpireOn: 'Plan will expire on',
      planDetails: 'Plan Details',
      type: 'Type',
      subscription: 'Subscription',
      oneTime: 'One-time',
      period: 'Period',
      yearly: 'Yearly',
      monthly: 'Monthly',
      startDate: 'Start date',
      renewal: 'Renewal',
      expiry: 'Expiry',
      upgradePlan: 'Upgrade Plan',
      changePlan: 'Change Plan',
      cancelSubscription: 'Cancel Subscription',
    },
    paymentHistory: {
      title: 'Payment History',
      subtitle: 'View your billing history and invoices',
      date: 'Date',
      description: 'Description',
      amount: 'Amount',
      status: 'Status',
      actionsColumn: 'Actions',
      to: 'to',
      active: 'Active',
      paid: 'Paid',
      pending: 'Pending',
      failed: 'Failed',
      view: 'View',
      receipt: 'Receipt',
      noHistory: 'No payment history',
      noHistoryDescription: 'When you make payments, they will appear here.',
      plan: 'Plan',
      event: 'Event',
      actionPackage: 'Action Package',
      actions: 'actions',
    },
    cancelModal: {
      title: 'Cancel Subscription',
      description:
        'Your subscription will remain active until the end of the current billing period.',
      confirmButton: 'Cancel Subscription',
      cancelButton: 'Keep Subscription',
    },
    toast: {
      cancelSuccess:
        'Subscription will be cancelled at the end of the billing period',
      cancelError: 'Failed to cancel subscription',
      receiptNotAvailable: 'Receipt is not yet available',
      receiptError: 'Failed to fetch receipt',
    },
  },

  // Terms of Service
  termsOfService: {
    title: 'Terms of Service',
    subtitle: 'Read our terms and conditions',
    downloadPdf: 'Download PDF',
    selectLanguage: 'Select language:',
    english: 'English',
    polish: 'Polish',
    german: 'German',
    lastUpdated: 'Last updated:',
    viewOnline: 'View online',
  },

  // Privacy Policy
  privacyPolicy: {
    title: 'Privacy Policy',
    subtitle: 'Learn how we protect your data',
    downloadPdf: 'Download PDF',
    selectLanguage: 'Select language:',
    english: 'English',
    polish: 'Polish',
    german: 'German',
    lastUpdated: 'Last updated:',
    viewOnline: 'View online',
  },

  // Events Filters
  eventsFilters: {
    // Panel
    title: 'Filters',
    clearAll: 'Clear',
    // Time Status
    timeStatus: 'Time Status',
    any: 'Any',
    upcoming: 'Upcoming',
    ongoing: 'Ongoing',
    past: 'Past',
    // Date Range
    dateRange: 'Date Range',
    dateRangeHint: 'Custom date range is available only when Time Status = Any',
    dateRangeDisabled: 'Disabled by time status',
    startDate: 'Start Date',
    endDate: 'End Date',
    // Presets
    nowPlus1h: 'Now +1h',
    tonight: 'Tonight',
    tomorrow: 'Tomorrow',
    weekend: 'Weekend',
    next7days: 'Next 7 days',
    // Meeting Type
    meetingType: 'Meeting Type',
    onsite: 'Onsite',
    online: 'Online',
    hybrid: 'Hybrid',
    // Level
    level: 'Level',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    // Join Mode
    joinMode: 'Join Mode',
    open: 'Open',
    request: 'Request',
    inviteOnly: 'Invite Only',
    // Organizer
    organizer: 'Organizer',
    verifiedOnly: 'Verified only',
    verifiedHint: 'Show only events from verified organizers',
  },

  // Events Search (Top Drawer)
  eventsSearch: {
    title: 'Search',
    searchLabel: 'Search',
    searchPlaceholder: 'Search tags or categories…',
    loadingPlaceholder: 'Loading suggestions…',
    tagsLabel: 'Tags',
    categoriesLabel: 'Categories',
    locationLabel: 'Location',
    locationPlaceholder: 'Enter city...',
    distanceLabel: 'Distance',
    global: 'Global',
    apply: 'Search',
    close: 'Close',
  },

  // Mobile Search Bar
  mobileSearch: {
    searchPlaceholder: 'Search events...',
    filters: 'Filters',
  },

  // Subscription Plans
  subscriptionPlans: {
    title: 'Choose your user plan',
    subtitle:
      'Upgrade your account to unlock more features and grow your events',
    billingTypes: {
      subscription: 'Subscription',
      monthly: 'Monthly',
      yearly: 'Yearly',
      save20: 'Save 20%',
    },
    tooltips: {
      subscription:
        'Subscription: Renews automatically every 30 days. Cancel anytime.',
      monthly:
        'Monthly: One-time payment. Access for 30 days without auto-renewal.',
      yearly: 'Yearly: One-time payment. Access for 12 months. Save 20%!',
    },
    badges: {
      autoRenewal: 'Auto-renewal',
      noSubscription: 'No subscription',
      oneTimeCharge: 'One-time charge',
      mostPopular: 'MOST POPULAR',
      activePlan: 'ACTIVE PLAN',
    },
    priceLabels: {
      perMonth: '/ month',
      perYear: '/ year',
      saveYearly: 'Save',
      yearly: 'yearly',
    },
    buttons: {
      activePlan: 'Active plan',
      freePlan: 'Basic plan',
      selectPlan: 'Select plan',
    },
    features: {
      included: "What's included",
      joinQuestions: 'Join questions',
      noJoinQuestions: 'No join questions',
    },
    infoBanner: {
      subscriptionNote: 'All subscription plans can be cancelled at any time.',
      onetimeNote:
        'All one-time payments are final. Choose the plan that best fits your needs.',
      important: 'Important:',
    },
  },
} as const;

export type Translations = typeof en;
