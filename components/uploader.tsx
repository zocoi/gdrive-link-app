import type { AppProps } from "@/lib/types";
import { useDriveAuth } from "@/components/use-drive-auth";
import type { FC, DragEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type UploadStatus = "queued" | "uploading" | "success" | "error";

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  message?: string;
  shareUrl?: string;
};

const ACCEPTED_MIME_PREFIXES = ["image/", "video/"];
const FALLBACK_MAX_FILES = 6;
const DEFAULT_FOLDER_ID = "1vwfuUfhL6K78llVP4YbSEcVkSsXU8-M7";

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || value % 1 === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getShareUrlFromId = (fileId?: string) =>
  fileId ? `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk` : undefined;

export const Uploader: FC<AppProps> = ({
  tokenEndpointUrl,
  tokenAuthToken,
  accessToken,
  googleClientId,
  folderId,
  maxFiles,
}) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const safeMaxFiles = useMemo(() => {
    if (typeof maxFiles === "number" && maxFiles > 0) return maxFiles;
    if (typeof maxFiles === "string") {
      const parsed = Number.parseInt(maxFiles, 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return FALLBACK_MAX_FILES;
  }, [maxFiles]);

  const targetFolderId = (folderId || DEFAULT_FOLDER_ID).trim();
  const {
    getAccessToken,
    isGisReady,
    requestGoogleToken,
    authError,
  } = useDriveAuth({
    accessToken,
    tokenEndpointUrl: tokenEndpointUrl?.trim(),
    tokenAuthToken: tokenAuthToken?.trim(),
    googleClientId,
    scope: "https://www.googleapis.com/auth/drive.file",
  });

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const ensureShareable = async (uploadId: string, fileId: string, token: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "reader",
            type: "anyone",
            allowFileDiscovery: false,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to set sharing (status ${response.status})`);
      }
      setUploads((current) =>
        current.map((upload) =>
          upload.id === uploadId
            ? { ...upload, message: "Uploaded & shared publicly" }
            : upload,
        ),
      );
    } catch (err) {
      setUploads((current) =>
        current.map((upload) =>
          upload.id === uploadId
            ? {
                ...upload,
                message: "Uploaded, but failed to make public",
              }
            : upload,
        ),
      );
    }
  };

  const isAcceptedFile = (file: File) =>
    ACCEPTED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));

  const addUploads = (files: File[]) => {
    if (!tokenEndpointUrl?.trim() && !accessToken?.trim() && !googleClientId) {
      setError(
        "Add a token endpoint, paste an access token, or set a Google Client ID to upload to Drive.",
      );
      return;
    }

    const newItems: UploadItem[] = [];
    for (const file of files) {
      if (!isAcceptedFile(file)) {
        setError("Only photos and videos are allowed.");
        continue;
      }
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        status: "queued",
        progress: 0,
      });
    }

    if (newItems.length === 0) return;

    setError(null);
    let trimmed = false;
    setUploads((prev) => {
      const availableSlots = Math.max(safeMaxFiles - prev.length, 0);
      const itemsToAdd = availableSlots > 0 ? newItems.slice(0, availableSlots) : [];
      if (itemsToAdd.length < newItems.length) {
        trimmed = true;
      }
      const nextUploads = [...prev, ...itemsToAdd];
      queueUploads(nextUploads);
      return nextUploads;
    });
    if (trimmed) {
      setError(`You can queue up to ${safeMaxFiles} files at once.`);
    }
  };

  const queueUploads = (items: UploadItem[]) => {
    items
      .filter((item) => item.status === "queued")
      .forEach((item) => {
        uploadSingle(item);
      });
  };

  const uploadSingle = (item: UploadItem) => {
    setUploads((current) =>
      current.map((existing) =>
        existing.id === item.id ? { ...existing, status: "uploading", progress: 1 } : existing,
      ),
    );

    const doUpload = async () => {
      let accessToken: string;
      try {
        accessToken = await getAccessToken();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to fetch access token for Drive.";
        setUploads((current) =>
          current.map((existing) =>
            existing.id === item.id
              ? {
                  ...existing,
                  status: "error",
                  message,
                }
              : existing,
          ),
        );
        return;
      }

      const metadata = {
        name: item.file.name,
        parents: targetFolderId ? [targetFolderId] : undefined,
      };

      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      formData.append("file", item.file);

      const uploadUrl =
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true";
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploads((current) =>
          current.map((existing) =>
            existing.id === item.id ? { ...existing, progress } : existing,
          ),
        );
      };

      xhr.onerror = () => {
        setUploads((current) =>
          current.map((existing) =>
            existing.id === item.id
              ? {
                  ...existing,
                  status: "error",
                  message: "Network error while uploading.",
                }
              : existing,
          ),
        );
      };

      xhr.onload = () => {
        const success = xhr.status >= 200 && xhr.status < 300;
        if (success) {
          let payload: unknown;
          try {
            payload = JSON.parse(xhr.responseText);
          } catch (err) {
            payload = null;
          }

          const data = payload as {
            id?: string;
            webViewLink?: string;
          };

          const fileId = data?.id;
          const shareUrl = data?.webViewLink || getShareUrlFromId(fileId);

          setUploads((current) =>
            current.map((existing) =>
              existing.id === item.id
                ? {
                    ...existing,
                    status: "success",
                    progress: 100,
                    shareUrl,
                    message: "Uploaded",
                  }
                : existing,
            ),
          );

          if (fileId) {
            void ensureShareable(item.id, fileId, accessToken);
          }
          return;
        }

        let failureMessage = "Upload failed.";
        try {
          const parsed = JSON.parse(xhr.responseText) as { error?: { message?: string } };
          if (parsed?.error?.message) {
            failureMessage = parsed.error.message;
          }
        } catch {
          failureMessage = xhr.responseText || failureMessage;
        }

        setUploads((current) =>
          current.map((existing) =>
            existing.id === item.id
              ? { ...existing, status: "error", message: failureMessage }
              : existing,
          ),
        );
      };

      xhr.send(formData);
    };

    void doUpload();
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, safeMaxFiles);
    addUploads(files);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const hasUploads = uploads.length > 0;

  return (
    <div className="rounded-linktree bg-linktree-primary px-4 py-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-linktree-button-text/70">
            Drive uploader
          </div>
          <div className="text-lg font-bold text-linktree-button-text">
            Drop photos and videos
          </div>
        </div>
        <div className="rounded-linktree border border-linktree-button-bg/20 px-3 py-1 text-xs text-linktree-button-text/80">
          Folder: {targetFolderId || "Set in settings"}
        </div>
      </div>

      <label
        onDrop={onDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-linktree border-2 border-dashed px-4 py-6 transition ${
          isDragging
            ? "border-linktree-button-bg bg-linktree-button-bg/10"
            : "border-linktree-button-bg/30 bg-linktree-button-bg/5"
        }`}
      >
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="text-sm font-semibold text-linktree-button-text">
          Click to choose or drop files
        </div>
        <div className="mt-1 text-xs text-linktree-button-text/80">
          Up to {safeMaxFiles} files per drop (photos and videos only)
        </div>
      </label>

      <div className="mt-3 text-xs text-linktree-button-text/70">
        Files will be made shareable after upload. Accepted: photos and videos.
      </div>

      {error ? (
        <div className="mt-3 rounded-linktree bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">
          {error}
        </div>
      ) : null}

      {googleClientId ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-linktree bg-linktree-button-bg px-3 py-2 text-xs font-semibold text-linktree-button-text"
            onClick={() => {
              setError(null);
              requestGoogleToken().catch((err) => {
                setError(err instanceof Error ? err.message : "Google sign-in failed.");
              });
            }}
          >
            {isGisReady ? "Sign in with Google for Drive upload" : "Loading Google Sign-In..."}
          </button>
          <div className="text-xs text-linktree-button-text/70">
            Uses Drive scope `drive.file` to upload into your folder.
          </div>
        </div>
      ) : null}

      {hasUploads ? (
        <div className="mt-4 space-y-3">
          {uploads.map((item) => (
            <div
              key={item.id}
              className="rounded-linktree bg-linktree-button-bg/10 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-linktree-button-text">
                    {item.file.name}
                  </div>
                  <div className="text-xs text-linktree-button-text/70">
                    {formatBytes(item.file.size)}
                  </div>
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-linktree-button-text/70">
                  {item.status === "uploading" && `${item.progress}%`}
                  {item.status === "queued" && "Queued"}
                  {item.status === "success" && "Done"}
                  {item.status === "error" && "Error"}
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-linktree bg-linktree-button-bg/20">
                <div
                  className={`h-full transition-all ${
                    item.status === "error"
                      ? "bg-red-500/70"
                      : "bg-linktree-button-bg"
                  }`}
                  style={{ width: `${item.status === "success" ? 100 : item.progress}%` }}
                />
              </div>
              {item.message ? (
                <div className="mt-1 text-xs text-linktree-button-text/80">
                  {item.message}
                </div>
              ) : null}
              {item.shareUrl ? (
                <a
                  href={item.shareUrl}
                  className="mt-2 inline-flex items-center text-xs font-semibold text-linktree-button-text underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  View in Drive
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
