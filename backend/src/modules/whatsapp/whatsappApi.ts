import { env } from "../../config/env";

interface WhatsAppTextMessagePayload {
  to: string;
  body: string;
}

const WHATSAPP_API_BASE = "https://graph.facebook.com/v20.0";

export const sendWhatsAppTextMessage = async (payload: WhatsAppTextMessagePayload) => {
  if (!env.whatsappAccessToken || !env.whatsappPhoneNumberId) {
    // eslint-disable-next-line no-console
    console.warn("WhatsApp credentials not configured; skipping send");
    return;
  }

  const url = `${WHATSAPP_API_BASE}/${env.whatsappPhoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.whatsappAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: payload.to,
      type: "text",
      text: {
        body: payload.body,
      },
    }),
  });

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error("Failed to send WhatsApp message", await response.text());
  }
};

