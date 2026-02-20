"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FolderUp, Loader2, ShieldCheck, Upload, XCircle, Zap } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  DEFAULT_COMPRESSION_PERCENTAGE,
  MAX_COMPRESSION_PERCENTAGE,
  MAX_FILE_SIZE_BYTES,
  MIN_COMPRESSION_PERCENTAGE,
} from "@/lib/constants";
import { cn, formatBytes, getExtension, sanitizeFilePath } from "@/lib/utils";
import type { CompressRequestBody, CompressionResult, UploadedAsset } from "@/types/compression";

type LocalFile = {
  id: string;
  file: File;
  relativePath: string;
  status: "queued" | "uploading" | "uploaded" | "error";
  progress: number;
  uploaded?: UploadedAsset;
  error?: string;
};

async function uploadFileWithProgress(
  file: File,
  relativePath: string,
  onProgress: (progress: number) => void,
): Promise<UploadedAsset> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("relativePath", relativePath);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const message = JSON.parse(xhr.responseText)?.error || "Upload failed.";
          reject(new Error(message));
        } catch {
          reject(new Error("Upload failed."));
        }
        return;
      }
      resolve(JSON.parse(xhr.responseText) as UploadedAsset);
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.send(formData);
  });
}

function estimateCompressedSize(bytes: number, compressionPercentage: number) {
  const normalized = compressionPercentage / 100;
  const savingsFactor = 0.2 + normalized * 0.55;
  return Math.max(1, Math.round(bytes * (1 - savingsFactor)));
}

function buildAcceptMap() {
  return Array.from(ALLOWED_MIME_TYPES).reduce<Record<string, string[]>>((acc, type) => {
    acc[type] = [];
    return acc;
  }, {});
}

function validateFile(file: File) {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) return "Unsupported file type.";
  if (!ALLOWED_MIME_TYPES.has(file.type)) return "Unsupported MIME type.";
  if (file.size > MAX_FILE_SIZE_BYTES) return "File exceeds 100MB limit.";
  return null;
}

export function UploadWorkspace() {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [compressionPercentage, setCompressionPercentage] = useState(DEFAULT_COMPRESSION_PERCENTAGE);
  const [phase, setPhase] = useState<"idle" | "uploading" | "compressing" | "done" | "error">("idle");
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const onSelectFiles = useCallback((selectedFiles: File[]) => {
    const nextItems = selectedFiles.map((file) => {
      const error = validateFile(file);
      return {
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        relativePath: sanitizeFilePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name),
        status: error ? ("error" as const) : ("queued" as const),
        progress: 0,
        error: error || undefined,
      } satisfies LocalFile;
    });

    const failures = nextItems.filter((item) => item.status === "error");
    if (failures.length) {
      toast.error(`${failures.length} file(s) rejected due to size/type validation.`);
    }

    setFiles((prev) => [...prev, ...nextItems]);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onSelectFiles(acceptedFiles);
    },
    [onSelectFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: buildAcceptMap(),
  });

  const totals = useMemo(() => {
    const validFiles = files.filter((f) => f.status !== "error");
    const originalTotal = validFiles.reduce((sum, item) => sum + item.file.size, 0);
    const estimatedCompressed = estimateCompressedSize(originalTotal, compressionPercentage);
    return { originalTotal, estimatedCompressed };
  }, [files, compressionPercentage]);

  const percentSavedEstimate = useMemo(() => {
    if (!totals.originalTotal) return 0;
    return Math.max(0, Math.round(((totals.originalTotal - totals.estimatedCompressed) / totals.originalTotal) * 100));
  }, [totals]);

  const uploadAndCompress = useCallback(async () => {
    const uploadable = files.filter((f) => f.status !== "error");
    if (!uploadable.length) {
      toast.error("Add at least one valid file first.");
      return;
    }

    setPhase("uploading");
    setCompressionProgress(0);
    setResult(null);

    const uploadedAssets: UploadedAsset[] = [];
    try {
      for (const item of uploadable) {
        setFiles((prev) =>
          prev.map((entry) => (entry.id === item.id ? { ...entry, status: "uploading", progress: 0, error: undefined } : entry)),
        );

        const uploaded = await uploadFileWithProgress(item.file, item.relativePath, (progress) => {
          setFiles((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, progress } : entry)));
        });

        uploadedAssets.push(uploaded);
        setFiles((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status: "uploaded", progress: 100, uploaded } : entry)));
      }

      setPhase("compressing");
      let fakeProgress = 8;
      const progressTimer = window.setInterval(() => {
        fakeProgress = Math.min(92, fakeProgress + 7);
        setCompressionProgress(fakeProgress);
      }, 280);

      const payload: CompressRequestBody = {
        assets: uploadedAssets,
        compressionPercentage,
      };

      const compressionRes = await fetch("/api/compress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      window.clearInterval(progressTimer);
      setCompressionProgress(100);

      if (!compressionRes.ok) {
        const message = (await compressionRes.json().catch(() => null))?.error || "Compression failed.";
        throw new Error(message);
      }

      const data = (await compressionRes.json()) as CompressionResult;
      setResult(data);
      setPhase("done");
      toast.success("Compression complete. ZIP is ready.");
    } catch (error) {
      console.error(error);
      setPhase("error");
      toast.error(error instanceof Error ? error.message : "Compression failed.");
    }
  }, [compressionPercentage, files]);

  const reset = useCallback(() => {
    setFiles([]);
    setResult(null);
    setCompressionProgress(0);
    setPhase("idle");
  }, []);

  const openFolderPicker = useCallback(() => {
    folderInputRef.current?.click();
  }, []);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 rounded-3xl border border-white/30 bg-white/65 p-4 shadow-soft backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/60 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Compression Workspace</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
            256-bit encryption
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900/50 dark:text-sky-200">
            Auto-delete storage
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
            Cloud secure storage
          </span>
        </div>
      </div>

      <motion.div whileHover={{ scale: 1.005 }}>
        <div
          {...getRootProps()}
          className={cn(
            "cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all md:p-12",
            isDragActive
              ? "border-brand-500 bg-brand-50/60 dark:bg-brand-900/20"
              : "border-slate-300 bg-white/70 hover:border-brand-400 dark:border-slate-600 dark:bg-slate-800/60",
          )}
        >

          <input {...getInputProps()} />
          <input
            ref={folderInputRef}
            className="hidden"
            type="file"
            multiple
            onChange={(event) => {
              const selected = Array.from(event.currentTarget.files || []);
              onSelectFiles(selected);
              event.currentTarget.value = "";
            }}
            // @ts-expect-error webkitdirectory is browser-specific but required for folder upload.
            webkitdirectory=""
            directory=""
          />
          <motion.div
            animate={{ y: isDragActive ? -2 : 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200"
          >
            <Upload className="h-7 w-7" />
          </motion.div>
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
            {isDragActive ? "Drop files to upload" : "Drag and drop files here"}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Supports PDF, JPG, PNG, DOCX, MP4, ZIP and more (up to 100MB per file)
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Select Files
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openFolderPicker();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <FolderUp className="h-4 w-4" />
              Upload Folder
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Queued Files</p>
            <p className="text-xs text-slate-500 dark:text-slate-300">{files.length} item(s)</p>
          </div>
          <div className="max-h-64 space-y-3 overflow-auto pr-1">
            {!files.length ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                No files added yet.
              </p>
            ) : null}
            {files.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.relativePath}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{formatBytes(item.file.size)}</p>
                  </div>
                  {item.status === "error" ? (
                    <XCircle className="h-5 w-5 text-rose-500" />
                  ) : item.status === "uploaded" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Loader2 className={cn("h-5 w-5 text-slate-400", item.status === "uploading" && "animate-spin")} />
                  )}
                </div>
                {item.status === "error" ? (
                  <p className="mt-2 text-xs text-rose-500">{item.error}</p>
                ) : (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Compression Control</p>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
              <span>Compression level</span>
              <span>{compressionPercentage}%</span>
            </div>
            <input
              type="range"
              min={MIN_COMPRESSION_PERCENTAGE}
              max={MAX_COMPRESSION_PERCENTAGE}
              step={1}
              value={compressionPercentage}
              onChange={(event) => setCompressionPercentage(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-brand-500 dark:bg-slate-700"
            />
          </div>

          <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-300">Original</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatBytes(totals.originalTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-300">Estimated compressed</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatBytes(totals.estimatedCompressed)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percentSavedEstimate}%` }} />
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Estimated savings: {percentSavedEstimate}%</p>
          </div>

          <button
            type="button"
            onClick={uploadAndCompress}
            disabled={phase === "uploading" || phase === "compressing"}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {(phase === "uploading" || phase === "compressing") && <Loader2 className="h-4 w-4 animate-spin" />}
            Compress Now
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "compressing" && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-800 dark:bg-brand-900/30"
          >
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-brand-900 dark:text-brand-100">Compressing files</span>
              <span className="text-brand-700 dark:text-brand-300">{compressionProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-200/60 dark:bg-brand-700/50">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${compressionProgress}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-xl bg-white/70 dark:bg-slate-800" />
              ))}
            </div>
          </motion.div>
        )}

        {phase === "done" && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-900 dark:bg-emerald-950/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 240 }}>
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <div>
                  <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Compression successful</p>
                  <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80">
                    Saved {result.percentSaved}% and prepared a secure ZIP bundle.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={result.signedDownloadUrl}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Download All ZIP
                </a>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/90 p-3 dark:bg-slate-900/70">
                <p className="text-xs text-slate-500 dark:text-slate-300">Original size</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatBytes(result.originalTotalBytes)}</p>
              </div>
              <div className="rounded-xl bg-white/90 p-3 dark:bg-slate-900/70">
                <p className="text-xs text-slate-500 dark:text-slate-300">Compressed size</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatBytes(result.compressedTotalBytes)}</p>
              </div>
              <div className="rounded-xl bg-white/90 p-3 dark:bg-slate-900/70">
                <p className="text-xs text-slate-500 dark:text-slate-300">Storage saved</p>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{result.percentSaved}%</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === "idle" || phase === "uploading" || phase === "error") && (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            Signed secure download URLs
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-600" />
            Cloudinary + Supabase pipeline
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-brand-600" />
            Temporary storage with cleanup endpoint
          </div>
        </div>
      )}
    </section>
  );
}
