import {
  SettingsElementInput,
  type LinkAppConfig,
} from "@linktr.ee/linkapp/types";

/**
 * LinkApp Configuration
 *
 * This configuration defines your LinkApp's manifest, settings, and URL matching rules.
 * The config is validated at build time and runtime to ensure it conforms to the schema.
 *
 * @see https://docs.linktree.com/link-apps for more information
 */
const config = {
  manifest: {
    name: "Drive Upload Dropzone",
    tagline: "Collect photos and videos straight into Google Drive",
    description: [
      "Let visitors drop photos and videos that upload to your Google Drive via a service-account endpoint.",
      "Ideal for gathering event media, client submissions, or team assets without exposing your Drive.",
    ],
    manifest_version: "0.0.1",
    version: "1.0.0",
    supporting_links: {
      terms_of_service: "https://linktr.ee/terms",
      privacy_policy: "https://linktr.ee/privacy",
      website: "https://linktr.ee",
    },
    category: "share",
    search_terms: ["google drive", "upload", "photos", "videos", "storage", "cloud"],
    author: {
      name: "Drive Upload App",
      accounts: ["drive_upload_app"],
      contact: {
        url: "https://linktr.ee",
        email: "hello@linktr.ee",
      },
    },
  },
  settings: {
    title: "Drive uploader",
    uses_url: false,
    has_url: false,
    overview: {
      title: "Drive uploader",
      description:
        "Upload photos and videos to a Google Drive folder using your service-account powered endpoint.",
    },
    supports_featured_layout: true,
    elements: [
      {
        id: "uploadEndpointUrl",
        inputType: SettingsElementInput.url,
        title: "Upload endpoint URL",
        description:
          "HTTPS endpoint that accepts multipart/form-data with `file` and optional `folderId`; it should make uploads shareable.",
        validation: {
          required: true,
        },
      },
      {
        id: "authToken",
        inputType: SettingsElementInput.text,
        title: "Bearer token (optional)",
        description:
          "If your endpoint expects an Authorization header, it will be sent as Bearer {token}.",
        validation: {
          required: false,
          maxLength: 200,
        },
      },
      {
        id: "folderId",
        inputType: SettingsElementInput.text,
        title: "Google Drive folder ID",
        description: "Uploads will target this folder ID.",
        validation: {
          required: true,
          minLength: 6,
          maxLength: 200,
        },
      },
      {
        id: "maxFiles",
        inputType: SettingsElementInput.number,
        title: "Max files per drop",
        description: "Limit how many files can be enqueued at once.",
        validation: {
          required: false,
          min: 1,
          max: 20,
        },
      },
    ],
  },
  url_match_rules: { hostnames: [], patterns: [] },
  preview_props: {
    uploadEndpointUrl: "https://api.example.com/upload-to-drive",
    authToken: "example-bearer-token",
    folderId: "1iPuycVFc4gtdgDnAESXEvqod4sN7R7xU",
    maxFiles: 5,
    uploadedImages: [
      "/sample-1.svg",
      "/sample-2.svg",
      "/sample-3.svg",
      "/sample-4.svg",
      "/sample-5.svg",
      "/sample-6.svg",
      "/sample-7.svg",
      "/sample-8.svg",
      "/sample-9.svg",
      "/sample-10.svg",
      "/sample-11.svg",
      "/sample-12.svg",
    ],
  },
} satisfies LinkAppConfig;

export default config;
