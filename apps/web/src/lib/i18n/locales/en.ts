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
      INTENT_REMINDER: 'Event reminder',
      INTENT_UPDATED: 'Event updated',
      INTENT_CANCELED: 'Event canceled',
      INTENT_CREATED: 'New event',
      NEW_MESSAGE: 'New message',
      NEW_COMMENT: 'New comment',
      NEW_REVIEW: 'New review',
      MEMBER_JOINED: 'New participant',
      MEMBER_LEFT: 'Participant left',
      INVITE_RECEIVED: 'Invitation received',
      default: 'Notification',
    },
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

  // My Intents
  myIntents: {
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
      youAreBanned: 'You are banned from this Intent',
    },
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    intents: 'Events',
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
} as const;

export type Translations = typeof en;
