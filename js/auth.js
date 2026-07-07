/* ============================================================
   GYM Management System – Auth State & Session Helpers
   auth.js is loaded on ALL pages EXCEPT index.html
   ============================================================ */

// ── Logout ──────────────────────────────────────────────────
function logout() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        console.log(`[GYM] Logging out: ${user.email}`);
    }
    localStorage.removeItem('currentUser');

    try {
        firebase.auth().signOut()
            .then(() => { window.location.href = 'index.html'; })
            .catch(() => { window.location.href = 'index.html'; });
    } catch (_) {
        window.location.href = 'index.html';
    }
}

// Expose globally for inline onclick handlers
window.logout = logout;

/* ============================================================
   Auth State Observer
   Protects every page (member.html, admin.html, user.html)
   by redirecting to login when there is no valid session.

   IMPORTANT: The login page (index.html) sets
   window.__onLoginPage = true BEFORE auth.js could run,
   but auth.js is NOT loaded on index.html at all, so this
   guard is a safety net for any unexpected inclusion.
   ============================================================ */
firebase.auth().onAuthStateChanged((firebaseUser) => {
    // If running on the login page itself — do nothing
    if (window.__onLoginPage) return;

    if (!firebaseUser) {
        // Check for a localStorage fallback session (default admin, offline mode)
        const cached = JSON.parse(localStorage.getItem('currentUser'));
        if (cached && cached.role) {
            console.log('[GYM] Firebase session null, using cached session:', cached.email);
            return; // Allow access
        }
        // No session at all — redirect to login
        console.warn('[GYM] No active session found. Redirecting to login…');
        window.location.href = 'index.html';
    } else {
        console.log('[GYM] Active Firebase session:', firebaseUser.email);
    }
});

/* ============================================================
   Helper utilities used by dashboard pages
   ============================================================ */

/** Returns the current user object from localStorage */
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser')) || null;
    } catch (_) {
        return null;
    }
}

/** Returns the role string of the current user */
function getCurrentRole() {
    const u = getCurrentUser();
    return u ? u.role : null;
}

window.getCurrentUser = getCurrentUser;
window.getCurrentRole = getCurrentRole;
