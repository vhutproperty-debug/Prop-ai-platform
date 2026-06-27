export interface BuilderCrawlConfig {
  slug: string;
  name: string;
  website: string;
  projectsListingUrl: string;
  /** CSS selector or path pattern for project links — optional */
  projectLinkPattern?: RegExp;
}

export const SUPPORTED_BUILDERS: BuilderCrawlConfig[] = [
  {
    slug: "oberoi-realty",
    name: "Oberoi Realty",
    website: "https://www.oberoirealty.com",
    projectsListingUrl: "https://www.oberoirealty.com/residential-properties",
    projectLinkPattern: /\/residential-properties\/[a-z0-9-]+/i,
  },
  {
    slug: "lodha",
    name: "Lodha",
    website: "https://www.lodhagroup.com",
    projectsListingUrl: "https://www.lodhagroup.com/projects",
    projectLinkPattern: /\/projects\/[^/]+\/[a-z0-9-]+(?:\/|$)/i,
  },
  {
    slug: "rustomjee",
    name: "Rustomjee",
    website: "https://www.rustomjee.com",
    projectsListingUrl: "https://www.rustomjee.com/projects",
    projectLinkPattern: /\/projects\/[a-z0-9-]+/i,
  },
  {
    slug: "kalpataru",
    name: "Kalpataru",
    website: "https://www.kalpataru.com",
    projectsListingUrl: "https://www.kalpataru.com/residential",
    projectLinkPattern: /\/[a-z0-9-]+/i,
  },
  {
    slug: "godrej",
    name: "Godrej Properties",
    website: "https://www.godrejproperties.com",
    projectsListingUrl: "https://www.godrejproperties.com/residential-projects",
    projectLinkPattern: /\/residential-projects\/[a-z0-9-]+/i,
  },
  {
    slug: "runwal",
    name: "Runwal",
    website: "https://www.runwal.com",
    projectsListingUrl: "https://www.runwal.com/residential-projects",
    projectLinkPattern: /\/residential-projects\/[a-z0-9-]+/i,
  },
  {
    slug: "sunteck",
    name: "Sunteck",
    website: "https://www.sunteck.in",
    projectsListingUrl: "https://www.sunteck.in/projects",
    projectLinkPattern: /\/projects\/[a-z0-9-]+/i,
  },
  {
    slug: "shapoorji-pallonji",
    name: "Shapoorji Pallonji",
    website: "https://www.shapoorjipallonji.com",
    projectsListingUrl: "https://www.shapoorjipallonji.com/real-estate",
    projectLinkPattern: /\/real-estate\/[a-z0-9-]+/i,
  },
];

export function getBuilderConfig(slug: string): BuilderCrawlConfig | undefined {
  return SUPPORTED_BUILDERS.find((b) => b.slug === slug);
}
