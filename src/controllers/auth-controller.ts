import passport from "passport";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { validationResult } from "express-validator";
import { Strategy as GoogleStrategy, VerifyCallback } from "passport-google-oauth2";

import User, { IGymOwnerStatus, IUserType } from "../models/user-model";
import { RegisterUserParams, TokenPayload } from "../types/auth.types";


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const SERVER_URL = process.env.SERVER_URL as string;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${SERVER_URL}/users/auth/google/callback`,
      passReqToCallback: true,
    },
    async function (
      request: Request,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback
    ) {
      try {
        const avatarUrl = `${SERVER_URL}/src/assets/default-avatar.png`;

        const res = await registerGeneralUser({
          email: profile.email,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          userRole: IUserType.USER,
          avatarUrl,
        });

        if ("accessToken" in res) {
          request.res?.cookie("access_token", res.accessToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000 // 1 hour
          });
        }

        if ("refreshToken" in res) {
          request.res?.cookie("refresh_token", res.refreshToken, {
            maxAge: 60 * 60 * 24 * 1000 * 7 // 1 week
          });
        }

        if ("error" in res && res.error) {
          return done(res.error, null);
        }

        if ("_id" in res && res._id) {
          return done(null, { id: res._id });
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Responsible for retrieving the user's information from the session in each request
passport.serializeUser(function (
  user: Express.User,
  done: (err: unknown, id?: unknown) => void
): void {
  done(null, user);
});

// Responsible for retrieving the user's information from the session in each request
passport.deserializeUser(function (
  user: Express.User,
  done: (err: unknown, user?: Express.User) => void
): void {
  done(null, user);
});


export const signup = async (req: Request, res: Response) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation array is not empty", error: errors.array() });
    return;
  }

  const { email, password, firstName, lastName, street, city, birthdate, gender } = req.body;

  let userRole: IUserType = IUserType.USER; // default role is user
  let gymOwnerLicenseImageUrl: string | undefined;

  const gymOwnerLicenseImage = req.files && "gymOwnerLicenseImage" in req.files ? (req.files["gymOwnerLicenseImage"] as Express.Multer.File[])[0] : null;
  if (gymOwnerLicenseImage) {
    userRole = IUserType.GYM_OWNER;
    gymOwnerLicenseImageUrl = `${req.protocol}://${req.get("host")}/src/uploads/${gymOwnerLicenseImage.filename}`;
  }

  const avatar = req.files && "avatar" in req.files ? (req.files["avatar"] as Express.Multer.File[])[0] : null;
  if (!avatar) {
    return res.status(400).json({ message: "Please upload an avatar", error: "avatar is not defined" });
  }
  const avatarUrl = `${req.protocol}://${req.get("host")}/src/uploads/${avatar.filename}`;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const userData: RegisterUserParams = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      street,
      city,
      userRole,
      birthdate,
      gender,
      avatarUrl,
    };

    if (gymOwnerLicenseImageUrl) {
      userData.gymOwnerLicenseImage = gymOwnerLicenseImageUrl;
      userData.gymOwnerStatus = IGymOwnerStatus.PENDING
    }

    const result = await registerGeneralUser(userData);

    if (result.message) {
      const response: { message?: string; status?: number; error?: any } = { message: result.message };

      if ("status" in result) {
        response.status = result.status;
      }

      if ("error" in result) {
        response.error = result.error;
      }

      return res.status(response.status || 400).json(response);
    }

    if ("accessToken" in result) {
      res.cookie("access_token", result.accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      if ("refreshToken" in result) {
        res.cookie("refresh_token", result.refreshToken, {
          maxAge: 60 * 60 * 24 * 1000 * 7 // 1 week
        });
      }

      return res.status(201).json({
        message: "User registered successfully",
        userId: result._id
      });
    }
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const login = async (req: Request, res: Response) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation array is not empty", error: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Wrong email or password" });
    }

    // This is SSO user - no password in user object
    if (!user.password) {
      return res.status(401).json({ message: "Wrong email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Wrong email or password" });
    }

    const result = generateJWT(user._id, user.role);
    const accessToken = result.accessToken;
    const refreshToken = result.refreshToken;

    if (accessToken) {
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1 hour
        sameSite: "lax"
      })
    }

    if (refreshToken) {
      res.cookie("refresh_token", refreshToken, {
        maxAge: 60 * 60 * 24 * 1000 * 7, // 1 week
        sameSite: "lax"
      })
      user.refreshTokens?.push(refreshToken)
    }
    await user.save(); // save the refresh token in user object

    return res.status(200).json({
      message: "Logged in successfully",
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      creditCard: user.creditCard || null,
      avatarUrl: user.avatarUrl,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

  }
  catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err });
  }
}

export const logout = async (req: Request, res: Response) => {
  try {

    const refreshToken = req.body.refreshToken;
    const decoded = await get_decoded(req, res, refreshToken);

    if (!decoded || !("id" in decoded)) {
      return res.status(400).json({ message: "error while decoding refreshToken" });
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(400).json({ message: "Invalid refresh token" });
    }

    // If refreshTokens list doesn't include 'refreshToken', we clear the list (maybe a breach)
    if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
      user.refreshTokens = [];
      await user.save();
      return res.status(400).json({ message: "Invalid refresh token" });
    }

    // remove 'refreshToken' from refreshTokens list 
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken) || [];
    await user.save();

    res.clearCookie("access_token", { httpOnly: true });  // clear the cookie
    res.clearCookie("refresh_token", { httpOnly: true });  // clear the cookie
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  const decoded = await get_decoded(req, res, refreshToken);

  if (!decoded || !("id" in decoded)) {
    return res.status(400).json({ message: "error while decoding refreshToken" });
  }

  try {
    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
      user.refreshTokens = [];
      await user.save();
      res.status(400).json({ message: "Invalid token" });
      return;
    }

    const result = generateJWT(user._id, user.role);
    if (!result) {
      user.refreshTokens = [];
      await user.save();
      return res.status(400).json({ message: "Missing auth configuration" });
    }

    if (!result.accessToken) {
      return res.status(400).json({ message: "Missing auth configuration (no access token)" });
    }

    if (!result.refreshToken) {
      return res.status(400).json({ message: "Missing auth configuration (no refresh token)" });
    }
    const newAccessToken = result.accessToken;

    res.clearCookie("access_token", { httpOnly: true });  // clear the cookie
    res.cookie("access_token", newAccessToken, { // create a cookie with the new access token
      httpOnly: true,
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    const newRefreshToken = result.refreshToken;
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken) || [];
    user.refreshTokens.push(newRefreshToken)
    await user.save();

    return res.status(200).send({
      message: "New tokens generated",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err });
  }
}

const registerGeneralUser = async (params: RegisterUserParams) => {
  const { email, password, firstName, lastName, street, city, userRole, birthdate, gender, avatarUrl, gymOwnerLicenseImage, gymOwnerStatus } = params;
  const user = await User.findOne({ email });

  // "regular" user
  if (user && password) {
    return { message: "User already exists", status: 400 };
  }

  // SSO user - don't register, just create token
  if (user) {
    const result = generateJWT(user._id, user.role);
    if (result.refreshToken) {
      user.refreshTokens?.push(result.refreshToken)
    }
    await user.save();
    return result;
  }

  try {

    const newUser = await new User({
      email: email,
      password: password, // if SSO is used, the value is null
      firstName: firstName,
      lastName: lastName,
      street: street,
      city: city,
      role: userRole,
      birthdate: birthdate,
      gender: gender,
      avatarUrl: avatarUrl,
      refreshTokens: [],
      gymOwnerLicenseImage: gymOwnerLicenseImage,
      gymOwnerStatus: gymOwnerStatus,
      favoriteGyms: [],
      isChatGptAllowed: true
    }).save();

    const result = generateJWT(newUser._id, newUser.role);
    if (result.refreshToken) {
      newUser.refreshTokens?.push(result.refreshToken)
    }
    await newUser.save(); // save the refreshToken

    return result;
  }
  catch (err) {
    return { message: "Failed to register user", error: err, status: 500 };
  }
}

const generateJWT = (userId: Types.ObjectId, role: IUserType) => {
  if (!process.env.JWT_SECRET) {
    return { message: "Missing auth configuration" };
  }

  const accessToken = jwt.sign(
    { id: userId.toString(), role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  const refreshToken = jwt.sign(
    { id: userId.toString(), role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
  );

  return {
    _id: userId,
    accessToken: accessToken,
    refreshToken: refreshToken
  };
};

export const getFromCookie = async (req: Request, res: Response, property: string) => {
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    res.status(400).json({ message: "Access token not found" });
    return;
  }

  try {
    if (!process.env.JWT_SECRET) {
      return { message: "Missing auth configuration" };
    }

    // get decoded cookie
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET) as { [key: string]: any };

    // get the desired property from the decoded cookie
    if (decoded && decoded[property]) {
      return decoded[property];
    } else {
      res.status(400).json({ message: `'${property}' not found in access token` });
    }

  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
}

const get_decoded = async (req: Request, res: Response, refreshToken: string) => {

  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token not found" });
    return;
  }

  if (!process.env.JWT_SECRET) {
    return { message: "Missing auth configuration" };
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as TokenPayload;
  return decoded;
}

export default passport;
