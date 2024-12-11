import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from "jsonwebtoken";

import { IUserType } from "../models/user-model";

interface TokenPayload extends JwtPayload {
    id: string;
    type: IUserType;
}

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
            if (!allowedRoles.includes(result.type)) {
                res.status(403).send("Forbidden. You don't have access to this resource");
                return;
            }

            req.query.userId = result.id; // we may use it in controllers
            req.query.type = result.type;
            next();
        }
        catch (err) {
            res.clearCookie("access_token");
            return res.redirect("/");
        }
    }
}
export default verifyToken;