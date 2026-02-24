/**
 * THEMES MODULE - Dark/Light/Cyber Theme System
 * Version: 2.0.0
 */

const Themes = (() => {
    'use strict';

    const STORAGE_KEY = 'cyber_lock_theme';
    const THEMES = ['cyber', 'light', 'dark'];
    
    let currentTheme = 'cyber';
    let onThemeChange = null;

    /**
     * Initialize theme system
     */
    const init = (callback = null) => {
        onThemeChange = callback;
        
        // Load saved theme
        loadTheme();
        
        // Setup theme toggle button
        setupToggle();
        
        console.log(`🎨 Theme system initialized: ${currentTheme}`);
    };

    /**
     * Load theme from localStorage
     */
    const loadTheme = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && THEMES.includes(saved)) {
                setTheme(saved);
            } else {
                setTheme('cyber'); // Default
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
            setTheme('cyber');
        }
    };

    /**
     * Save theme to localStorage
     */
    const saveTheme = (theme) => {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    /**
     * Set theme
     */
    const setTheme = (theme) => {
        if (!THEMES.includes(theme)) return false;

        // Remove existing theme classes
        document.body.classList.remove(...THEMES.map(t => `${t}-theme`));
        
        // Add new theme class
        document.body.classList.add(`${theme}-theme`);
        
        // Update current theme
        currentTheme = theme;
        
        // Update toggle button icon
        updateToggleIcon(theme);
        
        // Save preference
        saveTheme(theme);
        
        // Trigger callback
        if (onThemeChange) onThemeChange(theme);
        
        // Dispatch event for other modules
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        
        return true;
    };

    /**
     * Toggle to next theme
     */
    const toggleTheme = () => {
        const currentIndex = THEMES.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        const nextTheme = THEMES[nextIndex];
        
        setTheme(nextTheme);
        
        // Show notification
        showThemeNotification(nextTheme);
        
        return nextTheme;
    };

    /**
     * Setup theme toggle button
     */
    const setupToggle = () => {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;

        // Remove existing listeners
        toggleBtn.replaceWith(toggleBtn.cloneNode(true));
        
        // Add new listener
        document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    };

    /**
     * Update toggle button icon
     */
    const updateToggleIcon = (theme) => {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;

        const icons = {
            cyber: 'fa-moon',
            light: 'fa-sun',
            dark: 'fa-star'
        };

        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = `fas ${icons[theme] || 'fa-moon'}`;
        }
    };

    /**
     * Show theme change notification
     */
    const showThemeNotification = (theme) => {
        const names = {
            cyber: 'CYBER MODE',
            light: 'LIGHT MODE',
            dark: 'DARK MODE'
        };

        const notification = document.createElement('div');
        notification.className = 'theme-saved';
        notification.innerHTML = `
            <i class="fas ${theme === 'cyber' ? 'fa-moon' : theme === 'light' ? 'fa-sun' : 'fa-star'}"></i>
            <span>${names[theme]} ACTIVATED</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    };

    /**
     * Get current theme
     */
    const getCurrentTheme = () => currentTheme;

    /**
     * Get all available themes
     */
    const getThemes = () => [...THEMES];

    /**
     * Check if dark mode is active
     */
    const isDarkMode = () => {
        return currentTheme === 'cyber' || currentTheme === 'dark';
    };

    // Public API
    return {
        init,
        setTheme,
        toggleTheme,
        getCurrentTheme,
        getThemes,
        isDarkMode
    };
})();

// Freeze object
Object.freeze(Themes);