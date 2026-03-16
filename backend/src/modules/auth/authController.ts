import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../db/client";
import { env } from "../../config/env";
import type { AuthenticatedRequest } from "./authMiddleware";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' })
});

const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

const createToken = (userId: string) => {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: "7d" });
};

export const registerHandler = async (req: Request, res: Response) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errors = z.flattenError(parseResult.error);
    return res.status(400).json({ message: "Invalid input", errors: errors });
  }

  const { name, email, password } = parseResult.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  // const token = createToken(user.id);

  return res.status(201).json({
    message: "Registration successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};

export const loginHandler = async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errors = z.flattenError(parseResult.error);
    return res.status(400).json({ message: "Invalid input", errors: errors });
  }

  const { email, password } = parseResult.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = createToken(user.id);
  
  if (!token) {
    return res.status(401).json({ message: "Something went wrong" });
  }

  const isProduction = env.nodeEnv === "production";

  // Set the cookie directly in the browser
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({
    message: "Login successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};


export const logoutHandler = (req: Request, res: Response) => {
  const isProduction = env.nodeEnv === "production";

  res.cookie("token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0), // Expire immediately
    path: "/",
  });

  return res.json({ message: "Logged out successfully" });
};


export const meHandler = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  return res.json({ user: req.user });
};

