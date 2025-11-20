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
    name: "Gdrive Link App",
    tagline: "Display your key metrics and stats",
    description: [
      "Showcase up to 6 important statistics about yourself or your business with customizable labels and values.",
      "Perfect for highlighting achievements, milestones, or key performance indicators in a clean, professional format that matches your Linktree style.",
    ],
    manifest_version: "0.0.1",
    version: "1.0.0",
    supporting_links: {
      terms_of_service: "https://linktr.ee/terms",
      privacy_policy: "https://linktr.ee/privacy",
      website: "https://linktr.ee",
    },
    category: "share",
    search_terms: [
      "stats",
      "metrics",
      "numbers",
      "data",
      "showcase",
      "kpi",
      "analytics",
    ],
    author: {
      name: "Stats Showcase Developer",
      accounts: ["stats_showcase_dev"],
      contact: {
        url: "https://linktr.ee",
        email: "hello@linktr.ee",
      },
    },
  },
  settings: {
    title: "Stats Showcase",
    uses_url: false,
    has_url: false,
    overview: {
      title: "Stats Showcase",
      description: "Display your key metrics and stats on your profile",
    },
    supports_featured_layout: true,
    elements: [
      {
        id: "statsList",
        inputType: SettingsElementInput.array,
        title: "Stats List",
        description: "Add up to 6 stats to showcase on your profile",
        validation: {
          required: false,
          maxSize: 6,
        },
        array_options: {
          add_item_button_text: "Add a stat",
          add_item_title: "Add stat",
          add_second_item_button_text: "Add another stat",
          edit_item_title: "Edit stat",
          item_format: "{{name}}: {{value}}",
        },
        array_elements: [
          {
            id: "name",
            title: "Label",
            inputType: SettingsElementInput.text,
            validation: {
              required: true,
              minLength: 1,
              maxLength: 50,
            },
          },
          {
            id: "value",
            title: "Value",
            inputType: SettingsElementInput.text,
            validation: {
              required: true,
              minLength: 1,
              maxLength: 20,
            },
          },
        ],
      },
    ],
  },
  url_match_rules: { hostnames: [], patterns: [] },
  preview_props: {
    statsList: [
      {
        name: "Followers",
        value: "125000",
      },
      {
        name: "Monthly Views",
        value: "2500000",
      },
      {
        name: "Projects",
        value: "47",
      },
      {
        name: "Countries",
        value: "28",
      },
    ],
  },
} satisfies LinkAppConfig;

export default config;
