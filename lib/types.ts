import type { AppProps as LinktreeLinkAppContext } from "@linktr.ee/linkapp/types";

export type AppProps = LinktreeLinkAppContext & {
  tokenEndpointUrl?: string;
  tokenAuthToken?: string;
  accessToken?: string;
  folderId?: string;
  maxFiles?: number | string;
  uploadedImages?: string[];
};
