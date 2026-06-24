import { env } from "@/config/env";
import type { Lead } from "@/types/lead";

/**
 * Future-ready integration hooks for external CRM and messaging platforms.
 * Each adapter is no-op when credentials are not configured.
 */
export const leadIntegrationsService = {
  async onLeadCreated(lead: Lead) {
    await Promise.allSettled([
      this.syncHubSpot(lead, "create"),
      this.notifyWhatsApp(lead, "create"),
      this.sendMetaConversion(lead, "Lead"),
      this.notifyWebhook(lead, "lead.created"),
    ]);
  },

  async onLeadUpdated(lead: Lead, change: string) {
    await Promise.allSettled([
      this.syncHubSpot(lead, "update"),
      this.notifyWebhook(lead, "lead.updated", { change }),
    ]);
  },

  async syncHubSpot(lead: Lead, action: "create" | "update") {
    if (!process.env.HUBSPOT_ACCESS_TOKEN) {
      return { synced: false, reason: "hubspot_not_configured" };
    }

    // Placeholder for HubSpot CRM API v3 contact upsert
    console.info(`[HubSpot] ${action} lead`, lead.email);
    return { synced: true, provider: "hubspot", action };
  },

  async notifyWhatsApp(lead: Lead, action: "create" | "message") {
    if (!process.env.WHATSAPP_API_TOKEN) {
      return { sent: false, reason: "whatsapp_not_configured" };
    }

    console.info(`[WhatsApp] ${action} notification for`, lead.phone);
    return { sent: true, provider: "whatsapp", action };
  },

  async sendMetaConversion(lead: Lead, eventName: string) {
    if (!process.env.META_PIXEL_ID || !process.env.META_ACCESS_TOKEN) {
      return { sent: false, reason: "meta_not_configured" };
    }

    console.info(`[Meta CAPI] ${eventName} event for`, lead.email);
    return { sent: true, provider: "meta", eventName };
  },

  async notifyWebhook(
    lead: Lead,
    event: string,
    meta?: Record<string, unknown>
  ) {
    if (!env.CRM_WEBHOOK_URL) {
      return { delivered: false, reason: "webhook_not_configured" };
    }

    try {
      const response = await fetch(env.CRM_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          lead,
          meta,
          timestamp: new Date().toISOString(),
        }),
      });

      return { delivered: response.ok, status: response.status };
    } catch (error) {
      console.error("[CRM Webhook]", error);
      return { delivered: false, reason: "webhook_failed" };
    }
  },
};
