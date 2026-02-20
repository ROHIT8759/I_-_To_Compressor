'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
    phase: 'uploading' | 'compressing' | 'idle' | 'done';
    progress: number; // 0–100
}

const phaseLabel = {
    idle: '',
    uploading: 'Uploading files…',
    compressing: 'Compressing files…',
    done: 'All done!',
};

const phaseColor = {
    idle: 'bg-indigo-500',
    uploading: 'bg-indigo-500',
    compressing: 'bg-amber-500',
    done: 'bg-emerald-500',
};

export default function ProgressBar({ phase, progress }: ProgressBarProps) {
    if (phase === 'idle') return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full glass-card p-4"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">{phaseLabel[phase]}</span>
                <span className="text-sm font-bold text-slate-200">{Math.round(progress)}%</span>
            </div>

            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${phaseColor[phase]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
            </div>

            {/* Shimmer overlay while in progress */}
            {phase !== 'done' && (
                <div
                    className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                    aria-hidden
                >
                    <div className="shimmer-bar" />
                </div>
            )}
        </motion.div>
    );
}
