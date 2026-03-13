import swaggerJsdoc, { type Options } from "swagger-jsdoc";
import fs from "fs";
import path from "path";
import { env } from "../config/env";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BrandqoAI Backend API",
      version: "1.0.0",
      description: "API documentation for BrandqoAI backend (auth, health, and webhooks).",
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            name: { type: "string" },
          },
        },
        BrandProfile: {
          type: "object",
          properties: {
            id: { type: "string" },
            brandName: { type: "string" },
            industry: { type: "string" },
            targetAudience: { type: "string" },
            toneOfVoice: { type: "string" },
          },
        },
      },
    },
  },
  // glob patterns for files containing JSDoc comments
  apis: [
    path.join(process.cwd(), "src/modules/**/*.ts"),
    path.join(process.cwd(), "src/http/**/*.ts"),
  ],
};

const generatedPath = path.join(__dirname, "swagger-output.json");

export const swaggerSpec = fs.existsSync(generatedPath)
  ? JSON.parse(fs.readFileSync(generatedPath, "utf-8"))
  : swaggerJsdoc(options);

