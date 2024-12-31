import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";

import { IUserType } from "../models/user-model";
import { TokenPayload } from "../types/auth.types";


const verifyToken = (allowedRoles: Array<IUserType>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const token = req.cookies.access_token;
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
                res.status(403).json({message: "Your role is not allowed to access this resource"});
                return;
            }
            next();
        }
        catch (err) {
            res.clearCookie("access_token");
            return res.redirect("/");
        }
    }
}
export default verifyToken;