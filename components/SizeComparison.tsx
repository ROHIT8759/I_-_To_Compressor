'use client';

import { motion } from 'framer-motion';
import { formatBytes, savedPercent } from '@/lib/utils';

interface SizeComparisonProps {
    originalSize: number;
    compressedSize: number;
}

export default function SizeComparison({ originalSize, compressedSize }: SizeComparisonProps) {
    if (!originalSize || !compressedSize) return null;

    const saved = savedPercent(originalSize, compressedSize);
    const compressedRatio = compressedSize / originalSize; // 0–1

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-5 w-full"
        >
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Size Comparison</h3>

            {/* Before bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Original</span>
                    <span className="font-medium text-slate-200">{formatBytes(originalSize)}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-slate-500"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.6 }}
                    />
                </div>
            </div>

            {/* After bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Compressed</span>
                    <span className="font-medium text-emerald-400">{formatBytes(compressedSize)}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${compressedRatio * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    />
                </div>
            </div>

            {/* Savings badge */}
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center"
            >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                    🎉 {saved}% smaller — {formatBytes(originalSize - compressedSize)} saved
                </span>
            </motion.div>
        </motion.div>
    );
}
