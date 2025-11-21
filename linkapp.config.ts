import { SettingsElementInput, type LinkAppConfig } from '@linktr.ee/linkapp/types'

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
    name: 'Cloud Upload Dropzone',
    tagline: 'Collect photos and videos straight into your storage',
    description: [
      'Let visitors drop photos and videos that upload to your bucket via a service-account endpoint.',
      'Ideal for gathering event media, client submissions, or team assets without exposing your storage.',
    ],
    manifest_version: '0.0.1',
    version: '1.0.0',
    supporting_links: {
      terms_of_service: 'https://linktr.ee/terms',
      privacy_policy: 'https://linktr.ee/privacy',
      website: 'https://linktr.ee',
    },
    category: 'share',
    search_terms: ['cloud', 'upload', 'photos', 'videos', 'storage', 'bucket'],
    author: {
      name: 'Cloud Upload App',
      accounts: ['cloud_upload_app'],
      contact: {
        url: 'https://linktr.ee',
        email: 'hello@linktr.ee',
      },
    },
  },
  settings: {
    title: 'Cloud uploader',
    uses_url: false,
    has_url: false,
    overview: {
      title: 'Cloud uploader',
      description: 'Upload photos and videos to your storage bucket using your service-account powered endpoint.',
    },
    supports_featured_layout: true,
    elements: [
      {
        id: 'tokenEndpointUrl',
        inputType: SettingsElementInput.url,
        title: 'Token endpoint URL',
        description:
          'HTTPS endpoint that returns an access token for uploads (service account-backed). Not required if your upload endpoint accepts public requests.',
        validation: {
          required: false,
        },
      },
      {
        id: 'listEndpointUrl',
        inputType: SettingsElementInput.url,
        title: 'List endpoint URL',
        description:
          'Public endpoint that returns images from storage. Expected shape: { files: [{ id, name, webViewLink, thumbnailLink }] }.',
        validation: {
          required: false,
        },
      },
      {
        id: 'tokenAuthToken',
        inputType: SettingsElementInput.text,
        title: 'Token endpoint auth (optional)',
        description: 'If your upload endpoint expects an Authorization header, it will be sent as Bearer {token}.',
        validation: {
          required: false,
          maxLength: 200,
        },
      },
      {
        id: 'folderId',
        inputType: SettingsElementInput.text,
        title: 'Bucket prefix',
        description: 'Uploads will use this prefix inside your bucket (optional).',
        validation: {
          required: false,
          maxLength: 200,
        },
      },
      {
        id: 'maxFiles',
        inputType: SettingsElementInput.number,
        title: 'Max files per drop',
        description: 'Limit how many files can be enqueued at once.',
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
    tokenEndpointUrl: 'http://localhost:3001/upload-to-drive',
    listEndpointUrl: 'http://localhost:3001/list-drive-images',
    tokenAuthToken: 'example-bearer-token',
    folderId: '',
    maxFiles: 5,
    uploadedImages: [
      '/sample-1.svg',
      '/sample-2.svg',
      '/sample-3.svg',
      '/sample-4.svg',
      '/sample-5.svg',
      '/sample-6.svg',
      '/sample-7.svg',
      '/sample-8.svg',
      '/sample-9.svg',
      '/sample-10.svg',
      '/sample-11.svg',
      '/sample-12.svg',
    ],
  },
} satisfies LinkAppConfig

export default config
