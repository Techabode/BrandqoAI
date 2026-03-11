"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWhatsAppWebhook = exports.verifyWhatsAppWebhook = void 0;
const env_1 = require("../config/env");
const whatsappConversationService_1 = require("../modules/conversation/whatsappConversationService");
const whatsappApi_1 = require("../modules/whatsapp/whatsappApi");
const verifyWhatsAppWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === env_1.env.whatsappVerifyToken && typeof challenge === "string") {
        return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
};
exports.verifyWhatsAppWebhook = verifyWhatsAppWebhook;
const handleWhatsAppWebhook = async (req, res) => {
    // Meta sends a specific structure; we only handle simple text messages here.
    const body = req.body;
    try {
        const entries = body.entry ?? [];
        for (const entry of entries) {
            const changes = entry.changes ?? [];
            for (const change of changes) {
                const value = change.value;
                const messages = value?.messages ?? [];
                for (const message of messages) {
                    if (message.type !== "text") {
                        continue;
                    }
                    const from = message.from;
                    const textBody = message.text?.body;
                    if (!from || !textBody) {
                        continue;
                    }
                    const reply = await (0, whatsappConversationService_1.handleIncomingWhatsAppText)({
                        fromPhone: from,
                        text: textBody,
                    });
                    await (0, whatsappApi_1.sendWhatsAppTextMessage)({
                        to: from,
                        body: reply,
                    });
                }
            }
        }
        return res.sendStatus(200);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error handling WhatsApp webhook", error);
        return res.sendStatus(500);
    }
};
exports.handleWhatsAppWebhook = handleWhatsAppWebhook;
