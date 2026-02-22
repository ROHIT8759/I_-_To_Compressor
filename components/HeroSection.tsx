'use client';

import { motion } from 'framer-motion';
import TrustBadges from './TrustBadges';

interface HeroSectionProps {
    onScrollToTool: () => void;
}

export default function HeroSection({ onScrollToTool }: HeroSectionProps) {
    return (
        <section className="hero-section">
            {/* Background blobs */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                {/* Pill badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6"
                >
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    No Sign-Up Required · 100% Free
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="hero-headline"
                >
                    Compress Files
                    <br />
                    <span className="gradient-text">Instantly</span> Without
                    <br />
                    Losing Quality
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="hero-sub max-w-2xl mx-auto"
                >
                    Compress as much as you need, whenever you need it.
                    Securely compress PDFs, images, videos and more in seconds.
                    Your files are encrypted in transit, stored temporarily, and auto-deleted in 24 hours.
                </motion.p>

                {/* CTA */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onScrollToTool}
                    className="btn-primary mt-8"
                >
                    Compress Now →
                </motion.button>

                {/* Trust badges */}
                <TrustBadges />

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-16 flex justify-center"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-0.5 h-10 bg-gradient-to-b from-indigo-400 to-transparent rounded-full"
                    />
                </motion.div>
            </div>
        </section>
    );
}
