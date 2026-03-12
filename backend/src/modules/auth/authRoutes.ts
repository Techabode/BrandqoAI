import { Router } from "express";
import { registerHandler, loginHandler, meHandler } from "./authController";
import { requireAuth } from "./authMiddleware";

export const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/me", requireAuth, meHandler);

