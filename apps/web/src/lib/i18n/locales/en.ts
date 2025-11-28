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
} as const;

export type Translations = typeof en;
