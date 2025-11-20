import type { AppProps as LinktreeLinkAppContext } from "@linktr.ee/linkapp/types";

export type AppProps = LinktreeLinkAppContext & {
  uploadEndpointUrl?: string;
  authToken?: string;
  folderId?: string;
  maxFiles?: number | string;
};
