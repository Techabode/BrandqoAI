"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppTextMessage = void 0;
const env_1 = require("../../config/env");
const WHATSAPP_API_BASE = "https://graph.facebook.com/v20.0";
const sendWhatsAppTextMessage = async (payload) => {
    if (!env_1.env.whatsappAccessToken || !env_1.env.whatsappPhoneNumberId) {
        // eslint-disable-next-line no-console
        console.warn("WhatsApp credentials not configured; skipping send");
        return;
    }
    const url = `${WHATSAPP_API_BASE}/${env_1.env.whatsappPhoneNumberId}/messages`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env_1.env.whatsappAccessToken}`,
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
exports.sendWhatsAppTextMessage = sendWhatsAppTextMessage;
