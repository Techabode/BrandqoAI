import swaggerJsdoc, { type Options } from "swagger-jsdoc";
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
    },
  },
  // glob patterns for files containing JSDoc comments
  apis: [
    path.join(process.cwd(), "src/modules/**/*.ts"),
    path.join(process.cwd(), "src/http/**/*.ts"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

