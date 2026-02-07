import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const THEME_STORAGE_KEY = 'imposter_theme_settings';

export type ThemeMode = 'default' | 'dynamic';

interface ThemeSettings {
    mode: ThemeMode;
}

interface ThemeContextValue {
    mode: ThemeMode;
    toggleTheme: () => Promise<ThemeMode>;
    isLoading: boolean;
}

const defaultSettings: ThemeSettings = {
    mode: 'default',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('default');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (stored) {
                    const settings = JSON.parse(stored);
                    if (settings.mode === 'default' || settings.mode === 'dynamic') {
                        setMode(settings.mode);
                    }
                }
            } catch (error) {
                console.error('Failed to load theme settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const toggleTheme = useCallback(async () => {
        const newMode = mode === 'default' ? 'dynamic' : 'default';
        setMode(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: newMode }));
        } catch (error) {
            console.error('Failed to save theme settings:', error);
        }
        return newMode;
    }, [mode]);

    const value: ThemeContextValue = {
        mode,
        toggleTheme,
        isLoading,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
}
