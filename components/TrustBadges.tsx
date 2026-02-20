'use client';

import { motion } from 'framer-motion';
import { ShieldCheckIcon, TrashIcon, CloudIcon } from './icons';

const badges = [
    {
        icon: <ShieldCheckIcon />,
        label: '256-bit Encryption',
        description: 'AES-256 secured transfer',
    },
    {
        icon: <TrashIcon />,
        label: 'Auto-Deleted',
        description: 'Files removed after 24h',
    },
    {
        icon: <CloudIcon />,
        label: 'Cloud Secure',
        description: 'Stored on Cloudinary CDN',
    },
];

export default function TrustBadges() {
    return (
        <div className="flex flex-wrap justify-center gap-3 mt-6">
            {badges.map((badge, i) => (
                <motion.div
                    key={badge.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="trust-badge"
                >
                    <span className="text-indigo-400 w-4 h-4 flex-shrink-0">{badge.icon}</span>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-200">{badge.label}</span>
                        <span className="text-[10px] text-slate-400">{badge.description}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
