'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon, ZapIcon } from './icons';

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <span className="text-indigo-400">
                            <ZapIcon />
                        </span>
                        <span className="text-xl font-bold gradient-text">Compraser</span>
                    </motion.div>

                    {/* Right side */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4"
                    >
                        <span className="text-sm text-slate-400 hidden sm:inline">
                            Free · Secure · Fast
                        </span>

                        {/* Theme toggle */}
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="theme-toggle"
                                aria-label="Toggle theme"
                            >
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={theme}
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                                    </motion.span>
                                </AnimatePresence>
                            </button>
                        )}
                    </motion.div>
                </div>
            </div>
        </nav>
    );
}
