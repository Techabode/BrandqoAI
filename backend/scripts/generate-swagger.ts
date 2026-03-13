import swaggerAutogen from "swagger-autogen";
import path from "path";

const outputFile = path.join(__dirname, "../src/docs/swagger-output.json");
const endpointsFiles = [
    path.join(__dirname, "../src/index.ts"),
    path.join(__dirname, "../src/modules/auth/authRoutes.ts"),
    path.join(__dirname, "../src/modules/brand/brandRoutes.ts"),
    path.join(__dirname, "../src/modules/content/contentRoutes.ts"),
    path.join(__dirname, "../src/modules/conversation/conversationRoutes.ts"),
    path.join(__dirname, "../src/http/whatsappWebhook.ts"),
];

const doc = {
    info: {
        title: "BrandqoAI Backend API",
        description:
            "Automatically generated API documentation for BrandqoAI backend",
    },
    host: `localhost:4000`,
    schemes: ["http"],
};

(async () => {
    await swaggerAutogen({ openapi: "3.0.0", language: "en" })(
        outputFile,
        endpointsFiles,
        doc
    );
    console.log("Swagger spec generated at", outputFile);
})();
