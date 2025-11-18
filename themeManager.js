class ThemeManager {
    constructor() {
        this.storageKey = 'darkMode';
        this.className = 'dark-mode';
    }
    
    load() {
        const saved = localStorage.getItem(this.storageKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return saved === 'true' || (saved === null && prefersDark);
    }
    
    apply(isDark) {
        document.documentElement.classList.toggle(this.className, isDark);
        localStorage.setItem(this.storageKey, isDark.toString());
        console.log(`🎨 Theme applied: ${isDark ? 'dark' : 'light'}`);
    }
    
    toggle() {
        const isDark = !document.documentElement.classList.contains(this.className);
        this.apply(isDark);
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: isDark ? 'dark' : 'light' } 
        }));
        return isDark;
    }
    
    isDark() {
        return document.documentElement.classList.contains(this.className);
    }
}

window.themeManager = new ThemeManager();
