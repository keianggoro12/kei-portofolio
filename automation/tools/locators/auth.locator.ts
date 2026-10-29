export const authLocators = {
  landing: {
    signUpButton: { role: 'button', name: 'Sign up' },
    logInButton: { role: 'button', name: 'Log in' },
  },

  dialog: {
    registerTitle: 'Create your account',
    loginTitle: 'Welcome back',
    nameInput: { role: 'textbox', name: 'Full name' },
    phoneInput: { role: 'textbox', name: 'Phone number' },
    emailInput: { role: 'textbox', name: 'Email' },
    // Label diberi tanda wajib ("Password*"); regex supaya tidak ikut cocok ke "Confirm password*".
    passwordInput: { role: 'textbox', name: /^Password/ },
    confirmPasswordInput: { role: 'textbox', name: 'Confirm password' },
    registerSubmit: { role: 'button', name: 'Create account' },
    // Tab "Log in" dan tombol submit punya nama sama; submit selalu yang terakhir.
    loginSubmit: { role: 'button', name: 'Log in' },
    errorMessage: '[data-slot="auth-error"]',
  },

  sidebar: {
    profileLink: { role: 'link', name: /Profile$/ },
    signOutButton: { role: 'button', name: 'Sign out' },
  },
};
