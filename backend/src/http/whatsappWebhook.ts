import type { Request, Response } from "express";
import { env } from "../config/env";
import { handleIncomingWhatsAppText } from "../modules/conversation/whatsappConversationService";
import { sendWhatsAppTextMessage } from "../modules/whatsapp/whatsappApi";

export const verifyWhatsAppWebhook = (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.whatsappVerifyToken && typeof challenge === "string") {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

export const handleWhatsAppWebhook = async (req: Request, res: Response) => {
  // Meta sends a specific structure; we only handle simple text messages here.
  const body = req.body as any;

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

          const from = message.from as string;
          const textBody = message.text?.body as string;
          if (!from || !textBody) {
            continue;
          }

          const reply = await handleIncomingWhatsAppText({
            fromPhone: from,
            text: textBody,
          });

          await sendWhatsAppTextMessage({
            to: from,
            body: reply,
          });
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error handling WhatsApp webhook", error);
    return res.sendStatus(500);
  }
};

