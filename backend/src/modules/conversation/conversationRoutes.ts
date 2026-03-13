import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../auth/authMiddleware";
import { prisma } from "../../db/client";

const router = Router();

// GET /api/conversation/:userId - Get conversation state for a user
/**
 * @swagger
 * /api/conversation/{userId}:
 *   get:
 *     summary: Get conversation state for a user
 *     tags: [Conversation]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation:
 *                   type: object
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:userId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const { userId } = req.params;

        const conversation = await prisma.conversationState.findFirst({
            where: { userId: userId as string },
            include: {
                user: true,
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        res.json({ conversation });
    } catch (error) {
        console.error("Conversation fetch error:", error);
        res.status(500).json({ error: "Failed to fetch conversation" });
    }
});

export { router as conversationRouter };
