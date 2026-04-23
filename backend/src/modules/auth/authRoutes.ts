import { Router } from "express";
import { registerHandler, loginHandler, meHandler } from "./authController";
import { requireAuth } from "./authMiddleware";
import { asyncHandler } from "../../http/asyncHandler";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication operations (register, login, profile)
 */
export const authRouter = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Created successfully with JWT token
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already registered
 */
authRouter.post("/register", asyncHandler(registerHandler));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Authenticated successfully with JWT token
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */
authRouter.post("/login", asyncHandler(loginHandler));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned
 *       401:
 *         description: Unauthenticated
 */
authRouter.get("/me", asyncHandler(requireAuth), meHandler);

