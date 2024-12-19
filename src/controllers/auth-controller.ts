import passport from "passport";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { validationResult } from "express-validator";
import { Strategy as GoogleStrategy, VerifyCallback } from "passport-google-oauth2";

import User, { IUserType } from "../models/user-model";
import { RegisterUserParams, TokenPayload } from "../types/auth.types";


// Gooogle SSO
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
        const res = await registerGeneralUser({
          email: profile.email,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          userType: IUserType.USER
        });

        if ("accessToken" in res) {
          request.res?.cookie("access_token", res.accessToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000 // 1 hour
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
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password, firstName, lastName, address, gymOwnerLicenseImage } = req.body;

  let userType: IUserType = IUserType.USER; // default type is user
  if (gymOwnerLicenseImage) {
    userType = IUserType.GYM_OWNER;
  }

  const avatar = req.files && "avatar" in req.files ? (req.files["avatar"] as Express.Multer.File[])[0] : null;
  if (!avatar) {
    return res.status(400).json({ error: "Please upload an avatar" });
  }
  const avatarUrl = `${req.protocol}://${req.get("host")}/src/uploads/${avatar.filename}`;

  try {
    const result = await registerGeneralUser({
      email,
      firstName,
      lastName,
      password,
      address,
      userType,
      avatarUrl,
      gymOwnerLicenseImage
    });

    if (result.message) {
      return res.status(400).json({ message: result.message });
    }

    if ("accessToken" in result) {
      res.cookie("access_token", result.accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      return res.status(201).json({
        message: "User registered successfully",
        userId: result._id
      });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Wrong email or password");
    }

    // This is SSO user - no password in user object
    if (!user.password) {
      return res.status(400).send("Wrong email or password");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send("Wrong email or password");
    }

    if (!process.env.JWT_SECRET) {
      return { message: "Missing auth configuration" };
    }

    const result = generateJWT(user._id, user.type);
    const accessToken = result.accessToken;
    const refreshToken = result.refreshToken;

    if (accessToken) {
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000 // 1 hour
      })
    }

    if (refreshToken) {
      user.refreshTokens?.push(refreshToken)
    }
    await user.save(); // save the refresh token in user object

    return res.status(200).send({
      email: user.email,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

  }
  catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const logout = async (req: Request, res: Response) => {
  try {

    const refreshToken = req.body.refreshToken;
    const decoded = await get_decoded(req, res, refreshToken);

    if (!decoded || 'error' in decoded) {
      return res.status(400).json({ message: "Invalid data" });
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
    return res.status(200).send({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  const decoded = await get_decoded(req, res, refreshToken);

  if (!decoded || 'error' in decoded) {
    return res.status(400).json({ message: "Invalid data" });
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

    const result = generateJWT(user._id, user.type);
    if (!result) {
      user.refreshTokens = [""];
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
    return res.status(500).json({ message: "Server error" });
  }
}

const registerGeneralUser = async (params: RegisterUserParams) => {
  const { email, firstName, lastName, password, address, userType, gymOwnerLicenseImage, avatarUrl } = params;
  const user = await User.findOne({ email });

  // "regular" user
  if (user && password) {
    return { message: "User already exists" };
  }

  // SSO user - don't register, just create token
  if (user) {
    return generateJWT(user._id, user.type);
  }

  try {
    let hashedPassword: string | null = null;

    if (!address) {
      let address: string | null = null;
    }
    if (!gymOwnerLicenseImage) {
      let gymOwnerLicenseImage: string | null = null;
    }
    if (!avatarUrl) {
      let avatarUrl: string | null = null;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const newUser = await new User({
      email: email,
      password: hashedPassword, // if SSO is used, the value is null
      firstName: firstName,
      lastName: lastName,
      address: address,
      type: userType,
      favoriteGyms: [],
      avatarUrl: avatarUrl,
      gymOwnerLicenseImage: gymOwnerLicenseImage
    }).save();

    const result = generateJWT(newUser._id, newUser.type);
    if (result.refreshToken) {
      newUser.refreshTokens?.push(result.refreshToken)
    }
    await newUser.save(); // save the refreshToken

    return result;
  }
  catch (err) {
    return { message: "Failed to register user", error: err };
  }
}

const generateJWT = (userId: Types.ObjectId, type: IUserType) => {
  if (!process.env.JWT_SECRET) {
    return { message: "Missing auth configuration" };
  }

  const accessToken = jwt.sign(
    { id: userId.toString(), type: type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  const refreshToken = jwt.sign(
    { id: userId.toString(), type: type },
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
      res.status(400).json({ message: `'${property}' not found in token` });
    }

  } catch (error) {
    res.status(400).json({ message: "Invalid token", error: error });
  }
}

const get_decoded = async (req: Request, res: Response, refreshToken: string) => {

  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token not found" });
    return;
  }

  if (!process.env.JWT_SECRET) {
    return { error: "Missing auth configuration" };
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as TokenPayload;
  return decoded;
}

export default passport;
