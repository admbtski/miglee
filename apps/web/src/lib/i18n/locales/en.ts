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
        'We use cookies to improve your experience on our site. You can choose which categories of cookies you want to allow. Essential cookies are always enabled as they are necessary for the site to function properly.',
    },
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
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      savePreferences: 'Save Preferences',
      saving: 'Saving...',
      saved: 'Cookie settings saved successfully',
    },
  },
} as const;

export type Translations = typeof en;
