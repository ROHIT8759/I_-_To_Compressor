'use client';

import { motion } from 'framer-motion';
import { formatBytes, estimateCompressedSize } from '@/lib/utils';
import { COMPRESSION_MIN, COMPRESSION_MAX } from '@/lib/constants';

interface CompressionSliderProps {
    value: number;
    onChange: (value: number) => void;
    totalOriginalSize: number;
}

export default function CompressionSlider({
    value,
    onChange,
    totalOriginalSize,
}: CompressionSliderProps) {
    const estimated = estimateCompressedSize(totalOriginalSize, value);
    const saving = totalOriginalSize - estimated;

    // Color from green (low compression) to orange (high compression)
    const hue = Math.round(120 - (value / 90) * 90); // 120 (green) → 30 (orange)
    const trackColor = `hsl(${hue}, 65%, 50%)`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 w-full"
        >
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-sm font-semibold text-slate-200">Compression Level</p>
                    <p className="text-xs text-slate-400">Higher = smaller file, lower quality</p>
                </div>
                <div className="text-right">
                    <span
                        className="text-2xl font-bold"
                        style={{ color: trackColor }}
                    >
                        {value}%
                    </span>
                </div>
            </div>

            {/* Slider */}
            <div className="relative">
                <input
                    type="range"
                    min={COMPRESSION_MIN}
                    max={COMPRESSION_MAX}
                    step={5}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="slider w-full"
                    style={{ accentColor: trackColor }}
                />
                <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-500">10% (mild)</span>
                    <span className="text-xs text-slate-500">90% (aggressive)</span>
                </div>
            </div>

            {/* Estimated output */}
            {totalOriginalSize > 0 && (
                <motion.div
                    key={value}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 flex items-center justify-between text-sm"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Estimated output:</span>
                        <span className="font-semibold text-slate-200">{formatBytes(estimated)}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">~{formatBytes(saving)} saved</span>
                </motion.div>
            )}
        </motion.div>
    );
}
