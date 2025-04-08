import { JwtPayload } from "jsonwebtoken";

import { IUserType, IGender, IGymOwnerStatus } from "../models/user-model";

export interface RegisterUserParams {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    street?: string;
    city?: string;
    userRole?: IUserType;
    birthdate?: Date;
    gender?: IGender;
    avatarUrl?: string;
    gymOwnerLicenseImage?: string;
    gymOwnerStatus?: IGymOwnerStatus;
}

export interface TokenPayload extends JwtPayload {
    id: string;
    role: IUserType;
}
