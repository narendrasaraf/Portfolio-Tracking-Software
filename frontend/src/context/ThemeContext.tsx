import { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Forcing Dark Mode: isDark is always true, toggleTheme does nothing
    const isDark = true;
    const toggleTheme = () => { };

    // Always ensure the 'dark' class is present on the document
    if (typeof document !== 'undefined') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
