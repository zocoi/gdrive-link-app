import type { AppProps as LinktreeLinkAppContext } from '@linktr.ee/linkapp/types'

export type AppProps = LinktreeLinkAppContext & {
  tokenEndpointUrl?: string
  tokenAuthToken?: string
  listEndpointUrl?: string
  // folderId is used as a storage prefix; keep name to avoid breaking settings
  folderId?: string
  maxFiles?: number | string
  uploadedImages?: string[]
}
