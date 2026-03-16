import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../db/client";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  
  const token = req.cookies.token;

  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { userId: string };
    
    const user = await prisma.user.findUnique({ where: { id: payload.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

