/* ============================================================
   GYM Management System – Login & Registration Logic
   ============================================================ */

const loginTab      = document.getElementById('loginTab');
const registerTab   = document.getElementById('registerTab');
const loginForm     = document.getElementById('loginForm');
const registerForm  = document.getElementById('registerForm');
const registerRole  = document.getElementById('registerRole');
const memberFields  = document.getElementById('memberFields');
const loader        = document.getElementById('loader');
const currentYear   = document.getElementById('currentYear');

// Default hardcoded admin (no Firebase needed)
const DEFAULT_ADMIN = {
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin',
    name: 'System Administrator'
};

currentYear.textContent = new Date().getFullYear();

/* ----------------------------------------------------------
   Flag: prevents auth.js onAuthStateChanged from redirecting
   us away from the login page while we are still on it
   ---------------------------------------------------------- */
window.__onLoginPage = true;

/* ----------------------------------------------------------
   Tab Switching
   ---------------------------------------------------------- */
function switchTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    }
}

loginTab.addEventListener('click',    () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));

/* ----------------------------------------------------------
   Show/hide member-specific fields when role changes
   ---------------------------------------------------------- */
registerRole.addEventListener('change', function () {
    memberFields.style.display = this.value === 'member' ? 'block' : 'none';
});

/* ----------------------------------------------------------
   Utility: Calculate membership expiry (30 days from now)
   ---------------------------------------------------------- */
function calculateExpiryDate() {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

/* ----------------------------------------------------------
   Loader helpers
   ---------------------------------------------------------- */
let _loaderOverlay = null;

function showLoader(message = 'Processing, please wait...') {
    const loaderContent = loader.querySelector('.loader-content p');
    if (loaderContent) loaderContent.textContent = message;
    loader.classList.add('active');

    // Disable all form controls
    document.querySelectorAll('form input, form select, form button').forEach(el => {
        el.disabled = true;
        el.style.cursor  = 'not-allowed';
        el.style.opacity = '0.7';
    });

    // Create overlay only once
    if (!_loaderOverlay) {
        _loaderOverlay = document.createElement('div');
        _loaderOverlay.className = 'loader-overlay';
        document.body.appendChild(_loaderOverlay);
    }
}

function hideLoader() {
    loader.classList.remove('active');

    // Re-enable all form controls
    document.querySelectorAll('form input, form select, form button').forEach(el => {
        el.disabled      = false;
        el.style.cursor  = '';
        el.style.opacity = '';
    });

    // Remove overlay
    if (_loaderOverlay) {
        _loaderOverlay.remove();
        _loaderOverlay = null;
    }
}

/* ----------------------------------------------------------
   Toast notifications
   ---------------------------------------------------------- */
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = document.createElement('i');
    icon.className = type === 'success'
        ? 'fas fa-check-circle toast-icon'
        : 'fas fa-exclamation-circle toast-icon';

    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
            if (container && container.children.length === 0) container.remove();
        }, 300);
    }, 4500);
}

/* ----------------------------------------------------------
   Validation helpers
   ---------------------------------------------------------- */
function clearValidationEffects(form) {
    form.querySelectorAll('.invalid-input').forEach(el => el.classList.remove('invalid-input'));
}

// Remove red border when user starts typing
document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input',  function () { this.classList.remove('invalid-input'); });
    el.addEventListener('change', function () { this.classList.remove('invalid-input'); });
});

/* ----------------------------------------------------------
   Map Firebase error codes → friendly messages
   ---------------------------------------------------------- */
function getFriendlyAuthError(error) {
    if (error.code) {
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/invalid-login-credentials':
                return 'Invalid email or password.';
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/user-disabled':
                return 'This account has been suspended. Contact support.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/email-already-in-use':
                return 'This email address is already registered.';
            case 'auth/weak-password':
                return 'Password must be at least 8 characters.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            case 'auth/operation-not-allowed':
                return 'This operation is currently disabled. Contact support.';
            default:
                break;
        }
    }
    // For custom thrown errors (e.g. role mismatch) — only show clean messages
    if (error.message
        && !error.message.startsWith('{')
        && !error.message.includes('INVALID_LOGIN_CREDENTIALS')
        && !error.message.includes('Firebase:')) {
        return error.message;
    }
    return 'Something went wrong. Please try again.';
}

/* ============================================================
   LOGIN FORM SUBMIT
   ============================================================ */
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearValidationEffects(loginForm);

    const emailInput    = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const roleInput     = document.getElementById('loginRole');

    const email    = emailInput.value.trim();
    const password = passwordInput.value;          // ← do NOT trim passwords
    const role     = roleInput.value;

    // ── Client-side validation ──────────────────────────────
    let hasErrors = false;

    if (!email) {
        emailInput.classList.add('invalid-input');
        hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.classList.add('invalid-input');
        showToast('Please enter a valid email address.', 'error');
        hasErrors = true;
    }

    if (!password) {
        passwordInput.classList.add('invalid-input');
        hasErrors = true;
    }

    if (!role) {
        roleInput.classList.add('invalid-input');
        hasErrors = true;
    }

    if (hasErrors) {
        if (!email || !password || !role) {
            showToast('Please fill in all fields.', 'error');
        }
        return;
    }

    // ── Hardcoded default admin ─────────────────────────────
    if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password && role === 'admin') {
        showLoader('Setting up admin session...');
        localStorage.setItem('currentUser', JSON.stringify({
            uid:   'default-admin-uid',
            email: DEFAULT_ADMIN.email,
            role:  DEFAULT_ADMIN.role,
            name:  DEFAULT_ADMIN.name
        }));
        showToast('Welcome back, System Administrator!', 'success');
        await new Promise(r => setTimeout(r, 900));
        window.location.href = 'admin.html';
        return;
    }

    // ── Firebase sign-in ────────────────────────────────────
    showLoader('Authenticating...');
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);

        showLoader('Loading your profile...');
        const uid = userCredential.user.uid;

        // Fetch user document from the correct collection
        let userDoc;
        if (role === 'member') {
            userDoc = await firebase.firestore().collection('members').doc(uid).get();
        } else {
            userDoc = await firebase.firestore().collection('users').doc(uid).get();
        }

        // ── Self-healing: user exists in Auth but not Firestore ─
        if (!userDoc.exists) {
            // Check the other collection for a role mismatch
            const otherCollection = role === 'member' ? 'users' : 'members';
            const otherDoc = await firebase.firestore().collection(otherCollection).doc(uid).get();

            if (otherDoc.exists) {
                const correctPortal = otherDoc.data().role === 'member' ? 'Member Portal' : 'User Directory';
                // Sign out so the form stays fully functional
                await firebase.auth().signOut();
                throw new Error(`Wrong portal selected. Please choose "${correctPortal}" and try again.`);
            }

            // Auto-create missing Firestore document
            console.warn('[GYM] User document missing – auto-creating…');
            const fallback = {
                name:      userCredential.user.displayName || email.split('@')[0],
                email,
                role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (role === 'member') {
                fallback.phone             = '';
                fallback.package           = 'basic';
                fallback.status            = 'active';
                fallback.joinDate          = new Date().toISOString().split('T')[0];
                fallback.membershipExpires = calculateExpiryDate();
            }
            await firebase.firestore()
                .collection(role === 'member' ? 'members' : 'users')
                .doc(uid)
                .set(fallback);
            userDoc = await firebase.firestore()
                .collection(role === 'member' ? 'members' : 'users')
                .doc(uid).get();
        }

        // ── Role mismatch ────────────────────────────────────
        if (userDoc.data().role !== role) {
            await firebase.auth().signOut();
            throw new Error(`This account is not registered as "${role}". Please select the correct portal.`);
        }

        // ── Success: store session & redirect ────────────────
        localStorage.setItem('currentUser', JSON.stringify({
            uid:   uid,
            email: userCredential.user.email,
            role,
            name:  userDoc.data().name || email.split('@')[0]
        }));

        showToast(`Welcome back, ${userDoc.data().name || email.split('@')[0]}! Redirecting…`, 'success');
        showLoader('Redirecting…');
        await new Promise(r => setTimeout(r, 1000));

        switch (role) {
            case 'admin':  window.location.href = 'admin.html';  break;
            case 'member': window.location.href = 'member.html'; break;
            case 'user':   window.location.href = 'user.html';   break;
            default:       throw new Error('Unknown role');
        }

    } catch (error) {
        console.error('[GYM] Login error:', error);
        showToast(getFriendlyAuthError(error), 'error');
        hideLoader();   // ← explicit call here so form is re-enabled immediately on error
    }
    // Note: no `finally` here because on SUCCESS we are navigating away
    // and hideLoader would flash briefly before redirect
});

/* ============================================================
   REGISTRATION FORM SUBMIT
   ============================================================ */
registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearValidationEffects(registerForm);

    const nameInput            = document.getElementById('registerName');
    const emailInput           = document.getElementById('registerEmail');
    const passwordInput        = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('registerConfirmPassword');
    const roleInput            = document.getElementById('registerRole');
    const phoneInput           = document.getElementById('registerPhone');
    const packageInput         = document.getElementById('registerPackage');

    const name            = nameInput.value.trim();
    const email           = emailInput.value.trim();
    const password        = passwordInput.value;      // ← no trim
    const confirmPassword = confirmPasswordInput.value;
    const role            = roleInput.value;
    const phone           = phoneInput?.value.trim() || '';
    const packageVal      = packageInput?.value || '';

    // ── Required fields ────────────────────────────────────
    let hasErrors = false;
    if (!name)            { nameInput.classList.add('invalid-input');            hasErrors = true; }
    if (!email)           { emailInput.classList.add('invalid-input');           hasErrors = true; }
    if (!password)        { passwordInput.classList.add('invalid-input');        hasErrors = true; }
    if (!confirmPassword) { confirmPasswordInput.classList.add('invalid-input'); hasErrors = true; }
    if (!role)            { roleInput.classList.add('invalid-input');            hasErrors = true; }

    if (hasErrors) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    // ── Name ───────────────────────────────────────────────
    if (name.length < 3 || !/^[a-zA-Z\s]+$/.test(name)) {
        nameInput.classList.add('invalid-input');
        showToast('Full name must be at least 3 characters (letters and spaces only).', 'error');
        return;
    }

    // ── Email ──────────────────────────────────────────────
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.classList.add('invalid-input');
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    // ── Password strength ──────────────────────────────────
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        passwordInput.classList.add('invalid-input');
        showToast(
            'Password must be at least 8 characters with uppercase, lowercase, number and special character.',
            'error'
        );
        return;
    }

    // ── Passwords match ────────────────────────────────────
    if (password !== confirmPassword) {
        confirmPasswordInput.classList.add('invalid-input');
        showToast('Passwords do not match. Please re-enter.', 'error');
        return;
    }

    // ── Member-specific fields ─────────────────────────────
    if (role === 'member') {
        if (!phone) {
            phoneInput.classList.add('invalid-input');
            showToast('Phone number is required for members.', 'error');
            return;
        }
        if (!/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
            phoneInput.classList.add('invalid-input');
            showToast('Please enter a valid phone number.', 'error');
            return;
        }
        if (!packageVal) {
            packageInput.classList.add('invalid-input');
            showToast('Please select a membership package.', 'error');
            return;
        }
    }

    // ── Admin registration blocked ─────────────────────────
    if (role === 'admin') {
        showToast('Admin accounts cannot be created through self-registration.', 'error');
        return;
    }

    // ── Firebase registration ──────────────────────────────
    showLoader('Creating your account…');
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        showLoader('Setting up your profile…');
        const userData = {
            name,
            email,
            role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (role === 'member') {
            userData.phone             = phone;
            userData.package           = packageVal;
            userData.status            = 'active';
            userData.joinDate          = new Date().toISOString().split('T')[0];
            userData.membershipExpires = calculateExpiryDate();
        }

        showLoader('Finalizing registration…');
        await firebase.firestore()
            .collection(role === 'member' ? 'members' : 'users')
            .doc(uid)
            .set(userData);

        // ── IMPORTANT: sign out after registration so the user
        //    must log in explicitly. This prevents auth.js from
        //    redirecting away with a half-initialized session. ──
        await firebase.auth().signOut();
        localStorage.removeItem('currentUser');

        showToast('Registration successful! You can now log in.', 'success');
        await new Promise(r => setTimeout(r, 1400));

        // Switch to login tab and reset form — no page reload
        switchTab('login');
        registerForm.reset();
        memberFields.style.display = 'none';

    } catch (error) {
        console.error('[GYM] Registration error:', error);
        showToast(getFriendlyAuthError(error), 'error');
    } finally {
        hideLoader();
    }
});