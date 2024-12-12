import { JwtPayload } from "jsonwebtoken";

import { IUserType } from "../models/user-model";

export interface RegisterUserParams {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    address?: string;
    userType?: IUserType;
    avatarUrl?: string;
    gymOwnerLicenseImage?: string;
}

export interface TokenPayload extends JwtPayload {
    id: string;
    type: IUserType;
}
