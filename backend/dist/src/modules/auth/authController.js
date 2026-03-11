"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.meHandler = exports.loginHandler = exports.registerHandler = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const client_1 = require("../../db/client");
const env_1 = require("../../config/env");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
const hashPassword = async (password) => {
    const saltRounds = 10;
    return bcrypt_1.default.hash(password, saltRounds);
};
const verifyPassword = async (password, hash) => {
    return bcrypt_1.default.compare(password, hash);
};
const createToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, env_1.env.jwtSecret, { expiresIn: "7d" });
};
const registerHandler = async (req, res) => {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid input", errors: parseResult.error.flatten() });
    }
    const { name, email, password } = parseResult.data;
    const existing = await client_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await hashPassword(password);
    const user = await client_1.prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
        },
    });
    const token = createToken(user.id);
    return res.status(201).json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
};
exports.registerHandler = registerHandler;
const loginHandler = async (req, res) => {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid input", errors: parseResult.error.flatten() });
    }
    const { email, password } = parseResult.data;
    const user = await client_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = createToken(user.id);
    return res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
};
exports.loginHandler = loginHandler;
const meHandler = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthenticated" });
    }
    return res.json({ user: req.user });
};
exports.meHandler = meHandler;
