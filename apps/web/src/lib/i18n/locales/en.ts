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
      title: 'Language',
      label: 'Language',
      description: 'Change the language used in the user interface.',
    },
    timezone: {
      title: 'Time zone',
      label: 'Time zone',
      automatic: 'Automatic time zone',
      description:
        'All dates and times will be displayed in your local time zone.',
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
