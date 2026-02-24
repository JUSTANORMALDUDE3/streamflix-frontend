import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const availableThemes = [
    { id: 'dark', label: 'Dark Mode' },
    { id: 'papaya', label: 'Papaya Whip' },
    { id: 'nature', label: 'Nature Green' }
];

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('app-theme');
        return savedTheme || 'dark'; // default theme
    });

    useEffect(() => {
        // Only override classes that are themes
        document.body.classList.remove('theme-dark', 'theme-papaya', 'theme-nature');
        document.body.classList.add(`theme-${theme}`);
        localStorage.setItem('app-theme', theme);

        // Add transition class slightly after mount so initial load doesn't animate (flash)
        const timeout = setTimeout(() => {
            document.body.classList.add('theme-transition');
        }, 50);

        return () => clearTimeout(timeout);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
            {children}
        </ThemeContext.Provider>
    );
};
