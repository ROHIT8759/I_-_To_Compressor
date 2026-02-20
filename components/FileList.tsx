'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { UploadedFile } from '@/types';
import { formatBytes, fileTypeIcon } from '@/lib/utils';
import { XIcon } from './icons';

interface FileListProps {
    files: UploadedFile[];
    onRemove: (id: string) => void;
}

function FileSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 animate-pulse">
            <div className="w-9 h-9 rounded-lg bg-slate-700" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-slate-700" />
                <div className="h-2.5 w-1/3 rounded bg-slate-700" />
            </div>
        </div>
    );
}

export default function FileList({ files, onRemove }: FileListProps) {
    if (files.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2 w-full mt-4 max-h-64 overflow-y-auto pr-1 custom-scrollbar"
        >
            <AnimatePresence>
                {files.map((f) => (
                    <motion.div
                        key={f.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="file-row"
                    >
                        {f.status === 'uploading' ? (
                            <FileSkeleton />
                        ) : (
                            <div className="flex items-center gap-3 p-3 rounded-xl glass-card group">
                                {/* Icon */}
                                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-lg flex-shrink-0">
                                    {fileTypeIcon(f.type)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-200 truncate">{f.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-slate-400">{formatBytes(f.size)}</span>
                                        {f.compressedSize && (
                                            <>
                                                <span className="text-xs text-slate-600">→</span>
                                                <span className="text-xs text-emerald-400 font-medium">
                                                    {formatBytes(f.compressedSize)}
                                                </span>
                                            </>
                                        )}

                                        {/* Status pill */}
                                        <span
                                            className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${f.status === 'compressed'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : f.status === 'error'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : f.status === 'compressing'
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : 'bg-indigo-500/20 text-indigo-300'
                                                }`}
                                        >
                                            {f.status === 'uploaded'
                                                ? 'Ready'
                                                : f.status === 'compressing'
                                                    ? 'Compressing…'
                                                    : f.status === 'compressed'
                                                        ? 'Done'
                                                        : f.status === 'error'
                                                            ? 'Error'
                                                            : 'Pending'}
                                        </span>
                                    </div>

                                    {/* Progress bar (per-file) */}
                                    {(f.status === 'uploading' || f.status === 'compressing') && (
                                        <div className="mt-1.5 h-1 rounded-full bg-slate-700 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-indigo-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${f.progress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Remove button */}
                                {(f.status === 'uploaded' || f.status === 'error' || f.status === 'compressed') && (
                                    <button
                                        onClick={() => onRemove(f.id)}
                                        className="ml-1 p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                        aria-label="Remove file"
                                    >
                                        <XIcon />
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}
