import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { prisma } from "./db/client";
import { authRouter } from "./modules/auth/authRoutes";
import { conversationRouter } from "./modules/conversation/conversationRoutes";
import { contentRouter } from "./modules/content/contentRoutes";
import { brandRouter } from "./modules/brand/brandRoutes";
import { handleWhatsAppWebhook, verifyWhatsAppWebhook } from "./http/whatsappWebhook";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";
import cookieParser from "cookie-parser";


const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "up" });
  } catch (error) {
    res.status(500).json({ status: "error", db: "down" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/conversation", conversationRouter);
app.use("/api/content", contentRouter);
app.use("/api/brand", brandRouter);

// swagger documentation route (automatically generated from JSDoc comments)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/whatsapp/webhook", verifyWhatsAppWebhook);
app.post("/api/whatsapp/webhook", handleWhatsAppWebhook);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Generic error handler
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const start = async () => {
  try {
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`API server listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

void start();

