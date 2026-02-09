'use client';

import { useTheme } from '@/lib/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            aria-label="切换主题"
        >
            {theme === 'light' ? (
                <Moon size={20} />
            ) : (
                <Sun size={20} />
            )}
        </button>
    );
}
