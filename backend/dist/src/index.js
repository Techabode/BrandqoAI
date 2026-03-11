"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const client_1 = require("./db/client");
const authRoutes_1 = require("./modules/auth/authRoutes");
const whatsappWebhook_1 = require("./http/whatsappWebhook");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./docs/swagger");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigin,
    credentials: true,
}));
app.use(express_1.default.json());
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
        await client_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ok", db: "up" });
    }
    catch (error) {
        res.status(500).json({ status: "error", db: "down" });
    }
});
app.use("/api/auth", authRoutes_1.authRouter);
// swagger documentation route (automatically generated from JSDoc comments)
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
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
app.get("/api/whatsapp/webhook", whatsappWebhook_1.verifyWhatsAppWebhook);
app.post("/api/whatsapp/webhook", whatsappWebhook_1.handleWhatsAppWebhook);
app.use((err, _req, res, _next) => {
    // Generic error handler
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
});
const start = async () => {
    try {
        app.listen(env_1.env.port, () => {
            // eslint-disable-next-line no-console
            console.log(`API server listening on http://localhost:${env_1.env.port}`);
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to start server", error);
        process.exit(1);
    }
};
void start();
