import { useDriveAuth } from "@/components/use-drive-auth";
import type { AppProps } from "@/lib/types";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";

type DriveImage = {
  id: string;
  name?: string;
  url: string;
  link?: string;
  fallback?: string;
};

const DEFAULT_FOLDER_ID = "1vwfuUfhL6K78llVP4YbSEcVkSsXU8-M7";
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'><rect width='240' height='180' fill='%23666'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='white' font-family='Arial, sans-serif'>Image unavailable</text></svg>`,
  );

const buildPublicImageUrl = (id: string) => `https://drive.google.com/uc?export=view&id=${id}`;

export const Carousel: FC<AppProps & { listEndpointUrl?: string }> = ({
  accessToken,
  tokenEndpointUrl,
  tokenAuthToken,
  googleClientId,
  folderId,
  listEndpointUrl,
}) => {
  const [images, setImages] = useState<DriveImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetFolderId = useMemo(
    () => (folderId && folderId.trim() ? folderId.trim() : DEFAULT_FOLDER_ID),
    [folderId],
  );

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
    scope: "https://www.googleapis.com/auth/drive.readonly",
  });

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      if (listEndpointUrl?.trim()) {
        const response = await fetch(
          `${listEndpointUrl}${listEndpointUrl.includes("?") ? "&" : "?"}folderId=${encodeURIComponent(targetFolderId)}`,
        );
        if (!response.ok) {
          throw new Error(`List endpoint failed (${response.status})`);
        }
        const payload = (await response.json()) as {
          files?: Array<{
            id?: string;
            name?: string;
            webViewLink?: string;
            thumbnailLink?: string;
          }>;
        };
        const mapped =
          payload.files
            ?.filter((file): file is Required<Pick<typeof file, "id">> & typeof file => Boolean(file?.id))
            .map((file) => ({
              id: file.id!,
              name: file.name,
              link: file.webViewLink,
              url: buildPublicImageUrl(file.id!),
              fallback: file.thumbnailLink,
            })) ?? [];
        setImages(mapped);
        return;
      }

      const token = await getAccessToken();
      const params = new URLSearchParams({
        q: `'${targetFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: "files(id,name,webViewLink,thumbnailLink)",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
        pageSize: "20",
      });
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Drive list failed (${response.status})`);
      }
      const payload = (await response.json()) as {
        files?: Array<{
          id?: string;
          name?: string;
          webViewLink?: string;
          thumbnailLink?: string;
        }>;
      };
      const mapped =
        payload.files
          ?.filter((file): file is Required<Pick<typeof file, "id">> & typeof file => Boolean(file?.id))
          .map((file) => ({
            id: file.id!,
            name: file.name,
            link: file.webViewLink,
            url: buildPublicImageUrl(file.id!),
            fallback: file.thumbnailLink,
          })) ?? [];
      setImages(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images.");
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!targetFolderId) return;
    if (listEndpointUrl?.trim()) {
      void fetchImages();
      return;
    }
    if (accessToken?.trim()) {
      void fetchImages();
      return;
    }
  }, [targetFolderId, accessToken, listEndpointUrl]);

  return (
    <div className="rounded-linktree bg-linktree-primary px-4 py-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-linktree-button-text/70">
            Drive gallery
          </div>
          <div className="text-lg font-bold text-linktree-button-text">Latest uploads</div>
        </div>
        <button
          type="button"
          className="rounded-linktree bg-linktree-button-bg px-3 py-2 text-xs font-semibold text-linktree-button-text"
          onClick={() => {
            setError(null);
            void fetchImages();
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-linktree bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">
          {error}
        </div>
      ) : null}

      {!listEndpointUrl && googleClientId ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-linktree border border-linktree-button-bg px-3 py-2 text-xs font-semibold text-linktree-button-text"
            onClick={() => {
              setError(null);
              requestGoogleToken()
                .then(() => fetchImages())
                .catch((err) => {
                  setError(err instanceof Error ? err.message : "Google sign-in failed.");
                });
            }}
          >
            {isGisReady ? "Sign in to load images" : "Loading Google Sign-In..."}
          </button>
          <div className="text-xs text-linktree-button-text/70">
            Uses Drive readonly scope to list images in your folder.
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-linktree-button-text/70">Loading images...</div>
        ) : images.length === 0 ? (
          <div className="text-sm text-linktree-button-text/70">
            No images found in the folder yet.
          </div>
        ) : (
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative w-48 flex-shrink-0 snap-center overflow-hidden rounded-linktree bg-linktree-button-bg/10"
              >
                <img
                  src={image.url}
                  alt={image.name || "Drive image"}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                  onError={(event) => {
                    const img = event.target as HTMLImageElement;
                    if (image.fallback && img.dataset.state !== "fallback") {
                      img.dataset.state = "fallback";
                      img.src = image.fallback;
                      return;
                    }
                    if (img.dataset.state !== "placeholder") {
                      img.dataset.state = "placeholder";
                      img.src = PLACEHOLDER_IMG;
                    }
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 text-[11px] font-semibold text-white line-clamp-1">
                  {image.name || "Image"}
                </div>
                {image.link ? (
                  <a
                    href={image.link}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0"
                    aria-label="Open in Drive"
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
