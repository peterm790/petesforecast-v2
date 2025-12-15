import { Clerk as ClerkJS } from '@clerk/clerk-js';
import { dark } from '@clerk/themes';
import { createLoginOverlay, createProfileButton } from './ui.js';

// Use Clerk's default dark theme
const clerkAppearance = {
    baseTheme: dark
};

export async function initAuth(menuRoot) {
    const pubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!pubKey) {
        console.warn('Clerk: Missing VITE_CLERK_PUBLISHABLE_KEY in .env');
        return;
    }

    const clerk = new ClerkJS(pubKey);
    
    // Non-blocking load
    try {
        await clerk.load();
    } catch (err) {
        console.error('Clerk failed to load:', err);
        return;
    }

    const overlay = createLoginOverlay();
    let profileBtn = null;
    let overlayTimeout = null;

    function mountProfileButton(user) {
        if (profileBtn) return; // Already mounted
        
        const email = user.primaryEmailAddress?.emailAddress;
        profileBtn = createProfileButton(email, async () => {
            await clerk.signOut();
        });
        
        // Insert before help button if exists, otherwise append
        const helpBtn = menuRoot.querySelector('.pf-help-btn');
        if (helpBtn) {
            menuRoot.insertBefore(profileBtn, helpBtn);
        } else {
            menuRoot.appendChild(profileBtn);
        }
    }

    function removeProfileButton() {
        if (profileBtn) {
            profileBtn.remove();
            profileBtn = null;
        }
    }

    function handleAuthState() {
        if (clerk.user) {
            // --- SIGNED IN ---
            // Clear any pending overlay show
            if (overlayTimeout) {
                clearTimeout(overlayTimeout);
                overlayTimeout = null;
            }
            
            // Hide overlay immediately
            overlay.hide();
            
            // Add profile UI
            mountProfileButton(clerk.user);
            
        } else {
            // --- SIGNED OUT ---
            removeProfileButton();
            
            // Show overlay with 500ms delay if not already visible
            // This prevents flash if user is briefly signed out or loading
            if (!overlayTimeout) {
                overlayTimeout = setTimeout(() => {
                    overlay.show();
                    
                    // Mount SignIn if container is empty
                    if (overlay.container && !overlay.container.hasChildNodes()) {
                        clerk.mountSignIn(overlay.container, {
                            appearance: clerkAppearance
                        });
                    }
                    overlayTimeout = null;
                }, 500);
            }
        }
    }

    // Listen for auth changes
    clerk.addListener((resources) => {
        handleAuthState();
    });

    // Initial check
    handleAuthState();
}
