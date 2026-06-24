import { env } from "@/config/env";

export const crmService = {
  async notifyNewLead(lead: {
    _id?: unknown;
    name: string;
    email: string;
    phone: string;
    source?: string;
    query?: string;
  }) {
    if (!env.CRM_WEBHOOK_URL) {
      console.info("[CRM] Lead captured (webhook not configured):", lead.email);
      return { delivered: false, reason: "webhook_not_configured" };
    }

    try {
      const response = await fetch(env.CRM_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "lead.created",
          lead,
          timestamp: new Date().toISOString(),
        }),
      });

      return { delivered: response.ok, status: response.status };
    } catch (error) {
      console.error("[CRM] Webhook failed:", error);
      return { delivered: false, reason: "webhook_failed" };
    }
  },
};
