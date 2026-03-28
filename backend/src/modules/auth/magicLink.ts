import jwt from "jsonwebtoken";
import { env } from "../../config/env";

const MAGIC_LINK_EXPIRY = "15m";
const MAGIC_LINK_SECRET = env.magicLinkSecret ?? env.jwtSecret;

interface MagicLinkPayload {
  userId: string;
  whatsappPhone: string;
  purpose: "whatsapp-dashboard-handoff";
}

export const createWhatsAppMagicLinkToken = (params: {
  userId: string;
  whatsappPhone: string;
}) => {
  const payload: MagicLinkPayload = {
    userId: params.userId,
    whatsappPhone: params.whatsappPhone,
    purpose: "whatsapp-dashboard-handoff",
  };

  return jwt.sign(payload, MAGIC_LINK_SECRET, { expiresIn: MAGIC_LINK_EXPIRY });
};

export const verifyWhatsAppMagicLinkToken = (token: string): MagicLinkPayload => {
  const decoded = jwt.verify(token, MAGIC_LINK_SECRET) as jwt.JwtPayload;

  if (
    typeof decoded.userId !== "string" ||
    typeof decoded.whatsappPhone !== "string" ||
    decoded.purpose !== "whatsapp-dashboard-handoff"
  ) {
    throw new Error("Invalid magic link payload");
  }

  return {
    userId: decoded.userId,
    whatsappPhone: decoded.whatsappPhone,
    purpose: "whatsapp-dashboard-handoff",
  };
};
