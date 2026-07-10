/**
 * AuraTask Authentication Module
 * Manages user accounts and active sessions locally in the browser storage.
 */
const Auth = {
    // Key names for localStorage
    USERS_KEY: 'auratask_users',
    SESSION_KEY: 'auratask_current_user',
    /**
     * Get list of all registered users from storage
     */
    getUsers() {
        const usersJSON = localStorage.getItem(this.USERS_KEY);
        return usersJSON ? JSON.parse(usersJSON) : {};
    },
    /**
     * Save users registry
     */
    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },
    /**
     * Registers a new user
     * @param {string} name - Full Name
     * @param {string} email - Email Address
     * @param {string} password - Password
     * @returns {Object} { success: boolean, message: string, user: Object|null }
     */
    register(name, email, password) {
        // Validation
        if (!name || !email || !password) {
            return { success: false, message: 'All fields are required.' };
        }
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters.' };
        }
        const emailLower = email.toLowerCase().trim();
        const users = this.getUsers();
        if (users[emailLower]) {
            return { success: false, message: 'An account with this email already exists.' };
        }
        // Create new user object
        const newUser = {
            name: name.trim(),
            email: emailLower,
            password: btoa(password), // Simple base64 encoding to avoid plain text in localStorage
            createdAt: new Date().toISOString()
        };
        // Save
        users[emailLower] = newUser;
        this.saveUsers(users);
        return { 
            success: true, 
            message: 'Registration successful! You can now log in.',
            user: { name: newUser.name, email: newUser.email }
        };
    },
    /**
     * Authenticates user and initiates session
     * @param {string} email - Email Address
     * @param {string} password - Password
     * @returns {Object} { success: boolean, message: string, user: Object|null }
     */
    login(email, password) {
        if (!email || !password) {
            return { success: false, message: 'Please provide both email and password.' };
        }
        const emailLower = email.toLowerCase().trim();
        const users = this.getUsers();
        const user = users[emailLower];
        if (!user || user.password !== btoa(password)) {
            return { success: false, message: 'Invalid email or password.' };
        }
        // Set session
        const sessionUser = { name: user.name, email: user.email };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionUser));
        return {
            success: true,
            message: 'Logged in successfully!',
            user: sessionUser
        };
    },
    /**
     * Ends the current active user session
     */
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    },
    /**
     * Returns the active session user, or null if not logged in
     * @returns {Object|null}
     */
    getCurrentUser() {
        const sessionJSON = localStorage.getItem(this.SESSION_KEY);
        return sessionJSON ? JSON.parse(sessionJSON) : null;
    },
    /**
     * Checks if a user is currently logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
};
// Export to window scope
window.Auth = Auth;
