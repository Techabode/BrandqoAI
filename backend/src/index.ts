import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { prisma } from "./db/client";
import { authRouter } from "./modules/auth/authRoutes";
import { handleWhatsAppWebhook, verifyWhatsAppWebhook } from "./http/whatsappWebhook";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check server and database health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is up
 *       500:
 *         description: Database or server error
 */
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "up" });
  } catch (error) {
    res.status(500).json({ status: "error", db: "down" });
  }
});

app.use("/api/auth", authRouter);

// swagger documentation route (automatically generated from JSDoc comments)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/whatsapp/webhook:
 *   get:
 *     summary: Verify WhatsApp webhook
 *     tags: [WhatsApp]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Challenge response
 *       403:
 *         description: Verification failed
 *   post:
 *     summary: Handle incoming WhatsApp webhook messages
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Payload from WhatsApp
 *     responses:
 *       200:
 *         description: Message processed
 */
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

