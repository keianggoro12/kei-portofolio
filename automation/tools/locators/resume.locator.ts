export const resumeLocators = {
  dashboard: {
    path: '/user/dashboard',
    createButton: { role: 'button', name: 'Create a CV' },
  },

  list: {
    path: '/user/resume-builder',
    heading: { role: 'heading', name: 'Resume Builder' },
    createButton: { role: 'button', name: 'Create CV' },
    moreActionsButton: { role: 'button', name: 'More actions' },
    editButton: { role: 'button', name: 'Edit' },
    deleteMenuItem: { role: 'menuitem', name: 'Delete' },
  },

  templateDialog: {
    title: 'Start from a template',
    continueButton: { role: 'button', name: 'Continue' },
  },

  nameDialog: {
    title: 'Name your CV',
    nameInput: { role: 'textbox', name: 'CV name' },
    continueButton: { role: 'button', name: 'Continue' },
  },

  deleteDialog: {
    title: 'Delete this CV?',
    confirmButton: { role: 'button', name: 'Delete' },
  },

  editor: {
    // URL editor: /user/<resumeId>/edit
    pathPattern: /\/user\/([a-z0-9]+)\/edit$/,
    personal: {
      fullName: { role: 'textbox', name: /^Full name/ },
      role: { role: 'textbox', name: 'Role' },
      email: { role: 'textbox', name: 'Email' },
      phone: { role: 'textbox', name: 'Phone number' },
      address: { role: 'textbox', name: 'Address' },
      portfolioUrl: { role: 'textbox', name: 'Portfolio URL' },
      summary: { role: 'textbox', name: 'About me' },
    },
    // Tiap section punya id `section-<key>`; label field sama untuk semua entri,
    // jadi entri ke-n diambil dengan .nth(n) di dalam section.
    section: (key: string) => `#section-${key}`,
    addEntryButton: { role: 'button', name: 'Add' },
    addBulletButton: { role: 'button', name: 'Add bullet' },
    bulletInput: (index: number) => ({ role: 'textbox', name: `Add bullet ${index + 1}` }),
    // Picker bulan/tahun: <select id="<field>-<entryId>-month|year">.
    monthSelect: (field: 'startDate' | 'endDate' | 'date') => `select[id^="${field}-"][id$="-month"]`,
    yearSelect: (field: 'startDate' | 'endDate' | 'date') => `select[id^="${field}-"][id$="-year"]`,
    fields: {
      education: { institution: 'Institution', location: 'Location', degree: 'Degree', gpa: 'GPA' },
      experience: { company: 'Company', jobTitle: 'Job title', location: 'Location', employmentType: 'Employment type' },
      skills: { name: 'Skill', level: 'Level' },
      projects: { name: 'Project', url: 'URL' },
      achievements: { title: 'Title', organization: 'Organization', url: 'URL' },
      certifications: { name: 'Name', issuer: 'Issuer', url: 'URL' },
    },
    saveButton: { role: 'button', name: 'Save' },
    savedToast: 'Saved',
    previewMeasureTree: '[data-testid="measure-tree"]',
  },
};
