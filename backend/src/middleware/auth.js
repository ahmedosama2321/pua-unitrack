import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentication required." });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ message: "User not found." });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden." });
    }
    next();
  };
}

export function requireApprovedDoctor(req, res, next) {
  if (req.user?.role === "DOCTOR" && req.user.approval !== "APPROVED") {
    return res.status(403).json({ message: "Your doctor account is awaiting admin approval." });
  }
  next();
}