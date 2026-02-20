'use client';

import { useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import DropZone from '@/components/DropZone';
import FileList from '@/components/FileList';
import CompressionSlider from '@/components/CompressionSlider';
import ProgressBar from '@/components/ProgressBar';
import SizeComparison from '@/components/SizeComparison';
import SuccessAnimation from '@/components/SuccessAnimation';

import SEOContent from '@/components/SEOContent';
import type { UploadedFile, CompressionState } from '@/types';
import { COMPRESSION_DEFAULT } from '@/lib/constants';

// ── helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

// Upload a single file via the /api/upload route
async function uploadFile(
  file: File,
  onProgress: (pct: number) => void
): Promise<{ fileId: string; publicId: string; url: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        const body = JSON.parse(xhr.responseText);
        reject(new Error(body.error ?? 'Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const toolRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [compressionLevel, setCompressionLevel] = useState(COMPRESSION_DEFAULT);
  const [appState, setAppState] = useState<CompressionState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressProgress, setCompressProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Aggregated totals
  const totalOriginal = files.reduce((s, f) => s + f.size, 0);
  const totalCompressed = files.reduce(
    (s, f) => s + (f.compressedSize ?? f.size),
    0
  );

  // ── Scroll to tool ──────────────────────────────────────────────────────
  const scrollToTool = () =>
    toolRef.current?.scrollIntoView({ behavior: 'smooth' });

  // ── Accept new files ────────────────────────────────────────────────────
  const handleFilesAccepted = useCallback((newFiles: File[]) => {
    const uploaded: UploadedFile[] = newFiles.map((f) => ({
      id: uid(),
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      cloudinaryPublicId: '',
      cloudinaryUrl: '',
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...uploaded]);
    setAppState('idle');
  }, []);

  // ── Remove a file ───────────────────────────────────────────────────────
  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ── Upload all pending files ─────────────────────────────────────────────
  const handleUploadAll = async (): Promise<UploadedFile[]> => {
    setAppState('uploading');
    setUploadProgress(0);

    const pending = files.filter((f) => f.status === 'pending');
    if (pending.length === 0) return files;

    let completedCount = 0;
    const results: UploadedFile[] = [...files];

    await Promise.all(
      pending.map(async (uf) => {
        // Mark as uploading
        setFiles((prev) =>
          prev.map((f) => (f.id === uf.id ? { ...f, status: 'uploading' } : f))
        );

        try {
          const res = await uploadFile(uf.file, (pct) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === uf.id ? { ...f, progress: pct } : f))
            );
          });

          completedCount++;
          const overallPct = Math.round((completedCount / pending.length) * 100);
          setUploadProgress(overallPct);

          const updated: UploadedFile = {
            ...uf,
            status: 'uploaded',
            progress: 100,
            dbFileId: res.fileId,
            cloudinaryPublicId: res.publicId,
            cloudinaryUrl: res.url,
          };

          setFiles((prev) =>
            prev.map((f) => (f.id === uf.id ? { ...f, ...updated } : f))
          );

          // Update working results array
          const idx = results.findIndex((f) => f.id === uf.id);
          if (idx !== -1) results[idx] = { ...results[idx], ...updated };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Upload failed';
          toast.error(`${uf.name}: ${message}`);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uf.id ? { ...f, status: 'error', error: message } : f
            )
          );
        }
      })
    );

    return results;
  };

  // ── Compress all uploaded files ──────────────────────────────────────────
  const handleCompressAll = async (currentFiles: UploadedFile[]) => {
    setAppState('compressing');
    setCompressProgress(0);

    const toCompress = currentFiles.filter((f) => f.status === 'uploaded');
    if (toCompress.length === 0) {
      toast.error('No files ready to compress.');
      setAppState('uploaded');
      return;
    }

    let done = 0;

    await Promise.all(
      toCompress.map(async (uf) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id ? { ...f, status: 'compressing', progress: 0 } : f
          )
        );

        try {
          const res = await fetch('/api/compress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              compressionLevel,
              publicId: uf.cloudinaryPublicId,
              fileType: uf.type,
              dbFileId: uf.dbFileId,
            }),
          });

          if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error ?? 'Compression failed');
          }

          const data = await res.json();
          done++;
          setCompressProgress(Math.round((done / toCompress.length) * 100));

          setFiles((prev) =>
            prev.map((f) =>
              f.id === uf.id
                ? {
                  ...f,
                  status: 'compressed',
                  progress: 100,
                  compressedSize: data.compressedSize,
                  compressedUrl: data.compressedUrl,
                }
                : f
            )
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Compression failed';
          toast.error(`${uf.name}: ${message}`);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uf.id ? { ...f, status: 'error', error: message } : f
            )
          );
        }
      })
    );

    setAppState('done');
    toast.success('All files compressed successfully!');
  };

  // ── Main action: upload then compress ────────────────────────────────────
  const handleCompressNow = async () => {
    if (files.length === 0) {
      toast.error('Please add at least one file first.');
      scrollToTool();
      return;
    }

    try {
      const withUploads = await handleUploadAll();
      await handleCompressAll(withUploads);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      toast.error(message);
      setAppState('idle');
    }
  };

  // ── Download ZIP ─────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const ids = files
        .filter((f) => f.status === 'compressed')
        .map((f) => f.dbFileId)
        .filter((id): id is string => Boolean(id));

      if (ids.length === 0) {
        toast.error('No compressed files to download.');
        return;
      }

      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: ids }),
      });

      if (!res.ok) throw new Error('Download failed');

      const data = (await res.json()) as {
        files?: Array<{ id: string; fileName: string; fileType: string; url: string }>;
      };

      const downloadFiles = data.files ?? [];
      if (downloadFiles.length === 0) {
        throw new Error('No downloadable files found.');
      }

      for (const file of downloadFiles) {
        const a = document.createElement('a');
        a.href = file.url;
        a.download = file.fileName;
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Download failed';
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setFiles([]);
    setAppState('idle');
    setUploadProgress(0);
    setCompressProgress(0);
    scrollToTool();
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const hasFiles = files.length > 0;
  const canCompress =
    hasFiles &&
    appState !== 'uploading' &&
    appState !== 'compressing' &&
    appState !== 'done' &&
    files.some((f) => f.status === 'pending' || f.status === 'uploaded');

  const progressPhase =
    appState === 'uploading'
      ? 'uploading'
      : appState === 'compressing'
        ? 'compressing'
        : appState === 'done'
          ? 'done'
          : 'idle';

  const progressValue =
    appState === 'uploading'
      ? uploadProgress
      : appState === 'compressing'
        ? compressProgress
        : appState === 'done'
          ? 100
          : 0;

  const compressedFiles = files.filter((f) => f.status === 'compressed');
  const showComparison =
    appState === 'done' && compressedFiles.length > 0 && totalCompressed < totalOriginal;

  return (
    <>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <HeroSection onScrollToTool={scrollToTool} />

      {/* ── Tool Section ─────────────────────────────────────────── */}
      <section ref={toolRef} className="tool-section">
        {/* Background blobs (subtle) */}
        <div className="blob blob-2" style={{ opacity: 0.07 }} />

        <div className="relative z-10 w-full max-w-2xl mx-auto space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-slate-100 text-center mb-2">
              Upload &amp; Compress
            </h2>
            <p className="text-slate-400 text-center text-sm">
              Add files, pick your compression level, and download in seconds.
            </p>
          </motion.div>

          {/* Dropzone */}
          <DropZone
            onFilesAccepted={handleFilesAccepted}
            disabled={appState === 'uploading' || appState === 'compressing'}
          />

          <AnimatePresence>
            {/* File list */}
            {hasFiles && (
              <FileList files={files} onRemove={handleRemove} />
            )}

            {/* Slider */}
            {hasFiles && appState !== 'done' && (
              <motion.div
                key="slider"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <CompressionSlider
                  value={compressionLevel}
                  onChange={setCompressionLevel}
                  totalOriginalSize={totalOriginal}
                />
              </motion.div>
            )}

            {/* Progress bar */}
            {(appState === 'uploading' || appState === 'compressing' || appState === 'done') && (
              <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ProgressBar phase={progressPhase} progress={progressValue} />
              </motion.div>
            )}

            {/* Size comparison */}
            {showComparison && (
              <motion.div key="comparison" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <SizeComparison
                  originalSize={totalOriginal}
                  compressedSize={totalCompressed}
                />
              </motion.div>
            )}

            {/* Success */}
            {appState === 'done' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6"
              >
                <SuccessAnimation
                  onDownload={handleDownload}
                  onReset={handleReset}
                  isDownloading={isDownloading}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compress Now Button */}
          {canCompress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 pt-2"
            >
              <p className="text-xs text-slate-400">Max file size: 100 MB per file</p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCompressNow}
                className="btn-primary text-lg px-8 py-3"
              >
                ⚡ Compress Now
              </motion.button>
            </motion.div>
          )}
        </div>
      </section>

      <SEOContent />

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer>
        <p>
          © {new Date().getFullYear()} Compraser &nbsp;·&nbsp; Files are encrypted, stored
          temporarily, and auto-deleted after 24 hours.
        </p>
      </footer>
    </>
  );
}
