"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "BrandqoAI Backend API",
            version: "1.0.0",
            description: "API documentation for BrandqoAI backend (auth, health, and webhooks).",
        },
        servers: [
            {
                url: `http://localhost:${env_1.env.port}`,
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
        path_1.default.join(process.cwd(), "src/modules/**/*.ts"),
        path_1.default.join(process.cwd(), "src/http/**/*.ts"),
    ],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
