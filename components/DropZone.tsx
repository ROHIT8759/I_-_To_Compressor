'use client';

import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/constants';
import { validateFile, formatBytes } from '@/lib/utils';
import { UploadIcon } from './icons';

interface DropZoneProps {
    onFilesAccepted: (files: File[]) => void;
    disabled?: boolean;
}

export default function DropZone({ onFilesAccepted, disabled = false }: DropZoneProps) {
    const onDrop = useCallback(
        (accepted: File[], rejected: FileRejection[]) => {
            // Validate each accepted file
            const valid: File[] = [];
            for (const file of accepted) {
                const error = validateFile(file);
                if (error) {
                    toast.error(`${file.name}: ${error}`);
                } else {
                    valid.push(file);
                }
            }

            // Report rejections
            for (const { file, errors } of rejected) {
                const msg = errors.map((e) => e.message).join(', ');
                toast.error(`${file.name}: ${msg}`);
            }

            if (valid.length > 0) {
                onFilesAccepted(valid);
            }
        },
        [onFilesAccepted]
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        noClick: disabled,
        noDrag: disabled,
        accept: Object.fromEntries(ALLOWED_MIME_TYPES.map((t) => [t, []])),
        maxSize: MAX_FILE_SIZE,
        multiple: true,
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            {/* Hidden input that also supports folder upload */}
            <div
                {...getRootProps()}
                className={`dropzone ${isDragActive && !isDragReject ? 'dropzone-active' : ''} ${isDragReject ? 'dropzone-reject' : ''
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input {...getInputProps()} />
                {/* Folder upload input (not managed by dropzone) */}
                {!disabled && (
                    <input
                        id="folder-input"
                        type="file"
                        // @ts-expect-error – webkitdirectory is non-standard
                        webkitdirectory="true"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            const valid: File[] = [];
                            for (const f of files) {
                                const err = validateFile(f);
                                if (err) toast.error(`${f.name}: ${err}`);
                                else valid.push(f);
                            }
                            if (valid.length > 0) onFilesAccepted(valid);
                            e.target.value = '';
                        }}
                    />
                )}

                <AnimatePresence mode="wait">
                    {isDragActive ? (
                        <motion.div
                            key="drag-active"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <div className="text-indigo-400 animate-bounce">
                                <UploadIcon />
                            </div>
                            <p className="text-indigo-300 font-semibold text-lg">
                                {isDragReject ? 'Some files are not allowed' : 'Drop your files here!'}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="text-slate-500">
                                <UploadIcon />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-200 font-semibold text-lg">
                                    Drag &amp; drop files or folders here
                                </p>
                                <p className="text-slate-400 text-sm mt-1">
                                    or click to browse &nbsp;·&nbsp;
                                    <button
                                        type="button"
                                        className="text-indigo-400 hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            document.getElementById('folder-input')?.click();
                                        }}
                                    >
                                        upload a folder
                                    </button>
                                </p>
                            </div>
                            <p className="text-slate-500 text-xs">
                                PDF, JPG, PNG, DOCX, MP4, ZIP and more &nbsp;·&nbsp; Max {formatBytes(MAX_FILE_SIZE)} per file
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
