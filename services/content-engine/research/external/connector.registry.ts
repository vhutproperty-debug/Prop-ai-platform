import type { ExternalConnectorType } from "@/config/content-engine";
import type { ExternalResearchData } from "@/types/content-research";

export interface ExternalResearchConnector {
  id: ExternalConnectorType;
  name: string;
  isEnabled(): boolean;
  fetch(params: { projectSlug?: string; localitySlug?: string; builderSlug?: string }): Promise<ExternalResearchData>;
}

function stubConnector(
  id: ExternalConnectorType,
  name: string
): ExternalResearchConnector {
  return {
    id,
    name,
    isEnabled() {
      return false;
    },
    async fetch() {
      return {
        connectorId: id,
        available: false,
        items: [],
        fetchedAt: new Date().toISOString(),
      };
    },
  };
}

const connectors: ExternalResearchConnector[] = [
  stubConnector("government_data", "Government Data"),
  stubConnector("infrastructure_updates", "Infrastructure Updates"),
  stubConnector("builder_announcements", "Builder Announcements"),
  stubConnector("market_statistics", "Market Statistics"),
  stubConnector("interest_rate_trends", "Interest Rate Trends"),
  stubConnector("news_feeds", "News Feeds"),
];

export const externalResearchRegistry = {
  list(): ExternalResearchConnector[] {
    return connectors;
  },

  get(id: ExternalConnectorType): ExternalResearchConnector | undefined {
    return connectors.find((c) => c.id === id);
  },

  register(connector: ExternalResearchConnector) {
    const idx = connectors.findIndex((c) => c.id === connector.id);
    if (idx >= 0) connectors[idx] = connector;
    else connectors.push(connector);
  },

  async fetchAll(params: {
    projectSlug?: string;
    localitySlug?: string;
    builderSlug?: string;
  }): Promise<ExternalResearchData[]> {
    const results = await Promise.all(
      connectors.map((c) => c.fetch(params))
    );
    return results;
  },
};
