import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";

import { IUserType } from "../models/user-model";
import { TokenPayload } from "../types/auth.types";


const verifyToken = (allowedRoles: Array<IUserType>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
    
        let token: string | undefined;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
        }

        if (!token && req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
        }

        if (!token) {
        res.status(401).send("Missing token");
        return;
        }

        if (!process.env.JWT_SECRET) {
        res.status(400).send("Missing auth configuration");
        return;
        }

        try {
        const result = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;

        // check if the user role is allowed
        if (!allowedRoles.includes(result.role)) {
            res.status(403).json({ message: "Your role is not allowed to access this resource" });
            return;
        }

        (req as any).userId = result.id;
        (req as any).userRole = result.role;

        next();
        } catch (err) {
        res.clearCookie("access_token");
        res.status(401).json({ message: "Invalid or expired token" });
        return;
        }
    }
}
export default verifyToken;