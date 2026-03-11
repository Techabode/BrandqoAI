"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const client_1 = require("../../db/client");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid authorization header" });
    }
    const token = authHeader.substring("Bearer ".length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        const user = await client_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
        };
        return next();
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.requireAuth = requireAuth;
