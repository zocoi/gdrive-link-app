import { useEffect, useState } from "react";

type GoogleTokenClient = {
  callback: (resp: { access_token?: string; expires_in?: number; error?: unknown }) => void;
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type TokenCache = {
  token: string;
  expiresAt: number | null;
};

type GoogleAuthGlobal = {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (resp: { access_token?: string; expires_in?: number; error?: unknown }) => void;
      }) => GoogleTokenClient;
    };
  };
};

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const tokenClients: Record<string, GoogleTokenClient | null> = {};
const tokenCaches: Record<string, TokenCache | null> = {};
let scriptPromise: Promise<void> | null = null;

type UseDriveAuthParams = {
  accessToken?: string;
  tokenEndpointUrl?: string;
  tokenAuthToken?: string;
  googleClientId?: string;
  scope: string;
};

export const useDriveAuth = ({
  accessToken,
  tokenEndpointUrl,
  tokenAuthToken,
  googleClientId,
  scope,
}: UseDriveAuthParams) => {
  const [isGisReady, setIsGisReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!googleClientId || isGisReady) return;
    if (!scriptPromise) {
      scriptPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          `script[src="${SCRIPT_SRC}"]`,
        );
        if (existing) {
          existing.onload = () => resolve();
          existing.onerror = () => reject(new Error("Failed to load Google Identity Services."));
          if (existing.dataset.loaded === "true") {
            resolve();
          }
          return;
        }
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.dataset.loaded = "true";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Identity Services."));
        document.head.appendChild(script);
      });
    }

    scriptPromise
      .then(() => {
        const globalGoogle = (window as Window & { google?: GoogleAuthGlobal }).google;
        if (!globalGoogle?.accounts?.oauth2) {
          throw new Error("Google Identity Services unavailable.");
        }
        if (!tokenClients[scope]) {
          tokenClients[scope] = globalGoogle.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope,
            callback: () => {},
          });
        }
        setIsGisReady(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load Google Identity script.");
      });
  }, [googleClientId, isGisReady, scope]);

  const requestGoogleToken = async () => {
    if (!tokenClients[scope] || !isGisReady) {
      throw new Error("Google Sign-In not ready. Check Client ID and script load.");
    }
    return new Promise<string>((resolve, reject) => {
      tokenClients[scope]!.callback = (resp) => {
        if ("access_token" in resp && typeof resp.access_token === "string") {
          const expiresAt = resp.expires_in
            ? Date.now() + Math.max(Number(resp.expires_in) - 60, 0) * 1000
            : null;
          tokenCaches[scope] = { token: resp.access_token, expiresAt };
          resolve(resp.access_token);
          return;
        }
        reject(new Error("Failed to get Google access token."));
      };
      tokenClients[scope]!.requestAccessToken({ prompt: "consent" });
    });
  };

  const fetchAccessToken = async () => {
    if (!tokenEndpointUrl) {
      throw new Error("Add a token endpoint to fetch a Drive access token.");
    }
    const headers: HeadersInit = { Accept: "application/json" };
    if (tokenAuthToken?.trim()) {
      headers.Authorization = `Bearer ${tokenAuthToken.trim()}`;
    }
    const response = await fetch(tokenEndpointUrl, { method: "GET", headers });
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
    tokenCaches[scope] = { token, expiresAt };
    return token;
  };

  const getAccessToken = async () => {
    if (accessToken?.trim()) {
      return accessToken.trim();
    }
    const cache = tokenCaches[scope];
    if (cache?.token && (!cache.expiresAt || cache.expiresAt > Date.now())) {
      return cache.token;
    }
    if (tokenEndpointUrl) {
      return fetchAccessToken();
    }
    if (googleClientId) {
      return requestGoogleToken();
    }
    throw new Error("No auth configured for Drive.");
  };

  return {
    getAccessToken,
    isGisReady,
    requestGoogleToken,
    authError: error,
  };
};
