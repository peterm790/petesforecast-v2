import './auth.css';

export function createLoginOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'pf-auth-overlay hidden'; // Start hidden
    
    // Container for Clerk SignIn
    const container = document.createElement('div');
    container.id = 'clerk-sign-in';
    overlay.appendChild(container);
    
    document.body.appendChild(overlay);
    
    return {
        element: overlay,
        container,
        show: () => {
             overlay.classList.remove('hidden');
             // Small delay to allow display:block to apply before opacity transition
             requestAnimationFrame(() => {
                 overlay.classList.add('visible');
             });
        },
        hide: () => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 500); // Match CSS transition
        }
    };
}

export function createProfileButton(userEmail, onSignOut) {
    const container = document.createElement('div');
    container.className = 'pf-profile-container';

    const btn = document.createElement('div');
    btn.className = 'pf-profile-btn';
    btn.textContent = '👤';
    btn.setAttribute('aria-label', 'User Profile');
    
    const dropdown = document.createElement('div');
    dropdown.className = 'pf-profile-dropdown';
    
    const emailEl = document.createElement('div');
    emailEl.className = 'pf-profile-email';
    emailEl.textContent = userEmail || 'User';
    dropdown.appendChild(emailEl);
    
    const signOutBtn = document.createElement('button');
    signOutBtn.className = 'pf-profile-action';
    signOutBtn.textContent = 'Sign Out';
    
    // Wrap onSignOut to close dropdown
    signOutBtn.onclick = (e) => {
        e.stopPropagation(); // Don't toggle menu
        onSignOut();
    };
    dropdown.appendChild(signOutBtn);
    
    container.appendChild(btn);
    container.appendChild(dropdown);
    
    // Toggle menu
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.classList.toggle('visible');
        if (isVisible) {
            btn.textContent = '×';
            btn.classList.add('active'); // Style as active
        } else {
            btn.textContent = '👤';
            btn.classList.remove('active');
        }
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
        // If dropdown is visible AND click is outside container
        if (dropdown.classList.contains('visible') && !container.contains(e.target)) {
            dropdown.classList.remove('visible');
            btn.textContent = '👤';
            btn.classList.remove('active');
        }
    });
    
    return container;
}
