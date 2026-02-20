'use client';

import { motion } from 'framer-motion';
import { CheckCircleIcon, DownloadIcon } from './icons';

interface SuccessAnimationProps {
    onDownload: () => void;
    onReset: () => void;
    isDownloading: boolean;
}

export default function SuccessAnimation({
    onDownload,
    onReset,
    isDownloading,
}: SuccessAnimationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-6 py-8"
        >
            {/* Animated checkmark */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                className="relative"
            >
                {/* Glow ring */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-emerald-500/20"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
                <div className="text-emerald-400 relative z-10">
                    <CheckCircleIcon />
                </div>
            </motion.div>

            <div className="text-center">
                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-slate-100"
                >
                    Compression Complete!
                </motion.h3>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="text-slate-400 text-sm mt-1"
                >
                    Your files are ready to download.
                </motion.p>
            </div>

            {/* Download button */}
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={onDownload}
                disabled={isDownloading}
                className="btn-primary flex items-center gap-2"
            >
                {isDownloading ? (
                    <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Preparing ZIP…
                    </>
                ) : (
                    <>
                        <DownloadIcon />
                        Download All as ZIP
                    </>
                )}
            </motion.button>

            {/* Reset link */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={onReset}
                className="text-sm text-slate-400 hover:text-indigo-400 transition-colors underline underline-offset-2"
            >
                Compress more files
            </motion.button>
        </motion.div>
    );
}
