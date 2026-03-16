import { Router } from "express";
import { registerHandler, loginHandler, meHandler, logoutHandler } from "./authController";
import { requireAuth } from "./authMiddleware";

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
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Registration successful'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       409:
 *         description: Email already exists
 *       400:
 *         description: Invalid input
 */
authRouter.post("/register", registerHandler);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
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
 *     responses:
 *       200:
 *         description: Login successful. Sets an httpOnly 'token' cookie.
 *         headers:
 *           Set-Cookie:
 *             description: Contains the JWT auth token
 *             schema:
 *               type: string
 *               example: token=abc123xyz; Path=/; HttpOnly; Max-Age=604800
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "Login successful" 
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Invalid input
 */
authRouter.post("/login", loginHandler);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     description: Clears the authentication cookie to end the session.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         headers:
 *           Set-Cookie:
 *             description: Clears the token cookie by setting it to an empty string and an expired date.
 *             schema:
 *               type: string
 *               example: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly
 *       401:
 *         description: Unauthorized (if session was already invalid)
 */
authRouter.post("/logout", logoutHandler);


/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
authRouter.get("/me", requireAuth, meHandler);

