import type { AppProps } from "@/lib/types";
import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type GoogleTokenClient = {
  callback: (resp: { access_token?: string; expires_in?: number; error?: unknown }) => void;
  requestAccessToken: (options?: { prompt?: string }) => void;
};

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

export const Carousel: FC<AppProps> = ({
  accessToken,
  tokenEndpointUrl,
  tokenAuthToken,
  googleClientId,
  folderId,
}) => {
  const [images, setImages] = useState<DriveImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenCache, setTokenCache] = useState<{
    token: string;
    expiresAt: number | null;
  } | null>(null);
  const [isGisReady, setIsGisReady] = useState(false);
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);

  const targetFolderId = useMemo(
    () => (folderId && folderId.trim() ? folderId.trim() : DEFAULT_FOLDER_ID),
    [folderId],
  );
  const tokenEndpoint = tokenEndpointUrl?.trim();
  const tokenAuth = tokenAuthToken?.trim();

  useEffect(() => {
    if (!googleClientId || tokenClientRef.current || typeof window === "undefined") return;
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (existing && existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        const script = existing || document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.loaded = "true";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Identity Services."));
        if (!existing) document.head.appendChild(script);
      });

    loadScript()
      .then(() => {
        const globalGoogle = (window as typeof window & { google?: typeof google }).google;
        if (!globalGoogle?.accounts?.oauth2) {
          throw new Error("Google Identity Services unavailable.");
        }
        tokenClientRef.current = globalGoogle.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "https://www.googleapis.com/auth/drive.readonly",
          callback: () => {},
        });
        setIsGisReady(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load Google Identity script.");
      });
  }, [googleClientId]);

  const requestGoogleToken = async () => {
    if (!tokenClientRef.current || !isGisReady) {
      throw new Error("Google Sign-In not ready. Check Client ID and script load.");
    }
    return new Promise<string>((resolve, reject) => {
      tokenClientRef.current!.callback = (resp) => {
        if ("access_token" in resp && typeof resp.access_token === "string") {
          const expiresAt = resp.expires_in
            ? Date.now() + Math.max(Number(resp.expires_in) - 60, 0) * 1000
            : null;
          setTokenCache({ token: resp.access_token, expiresAt });
          resolve(resp.access_token);
          return;
        }
        reject(new Error("Failed to get Google access token."));
      };
      tokenClientRef.current!.requestAccessToken({ prompt: "consent" });
    });
  };

  const fetchAccessToken = async () => {
    if (!tokenEndpoint) {
      throw new Error("Add a token or token endpoint in settings to pull images from Drive.");
    }
    const headers: HeadersInit = { Accept: "application/json" };
    if (tokenAuth) {
      headers.Authorization = `Bearer ${tokenAuth}`;
    }
    const response = await fetch(tokenEndpoint, { method: "GET", headers });
    if (!response.ok) {
      throw new Error(`Token endpoint error (${response.status})`);
    }
    const payload = (await response.json()) as {
      access_token?: string;
      token?: string;
      expires_in?: number;
      expires_at?: number;
    };
    const token = payload.access_token || payload.token;
    if (!token) {
      throw new Error("Token endpoint did not return access_token.");
    }
    const expiresAt = payload.expires_at
      ? payload.expires_at * 1000
      : payload.expires_in
        ? Date.now() + Math.max(Number(payload.expires_in) - 60, 0) * 1000
        : null;
    setTokenCache({ token, expiresAt });
    return token;
  };

  const getAccessToken = async () => {
    if (accessToken?.trim()) {
      return accessToken.trim();
    }
    if (tokenCache?.token && (!tokenCache.expiresAt || tokenCache.expiresAt > Date.now())) {
      return tokenCache.token;
    }
    if (googleClientId && isGisReady) {
      return requestGoogleToken();
    }
    return fetchAccessToken();
  };

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
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
    // Attempt auto-fetch if we already have a token cached or pasted
    if (accessToken?.trim() || tokenCache?.token) {
      void fetchImages();
    }
  }, [targetFolderId, accessToken, tokenCache]);

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

      {googleClientId ? (
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
