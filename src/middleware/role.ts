import { Request, Response, NextFunction } from "express";

export function requireRole(...allowed: Array<"MANAGER" | "OPERATOR" | "PROJECT_MANAGER">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
