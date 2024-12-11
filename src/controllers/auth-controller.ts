import passport from "passport";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { validationResult } from "express-validator";
import { Strategy as GoogleStrategy, VerifyCallback } from "passport-google-oauth2";

import User, { IUserType } from "../models/user-model";
import { RegisterUserParams } from "../types/auth.types";

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

        if ("token" in res) {
          request.res?.cookie("access_token", res.token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
          });
        }

        if ("error" in res && res.error) {
          return done(res.error, null);
        }

        if ("email" in res && res.email) {
          return done(null, { email: res.email });
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

  try {
    const result = await registerGeneralUser({
      email,
      firstName,
      lastName,
      password,
      address,
      userType,
      gymOwnerLicenseImage
    });

    if (result.message) {
      return res.status(400).json({ message: result.message });
    }

    if ("token" in result) {
      res.cookie("access_token", result.token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      return res.status(201).json({
        message: "User registered successfully",
        email: result.email
      });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const registerGeneralUser = async (params: RegisterUserParams) => {
  const { email, firstName, lastName, password, address, userType, gymOwnerLicenseImage } = params;
  const user = await User.findOne({ email });
  if (user) {
    return { message: "User already exists" };
  }

  try {
    let hashedPassword: string | null = null;

    if (!address) {
      let address: string | null = null;
    }
    if (!gymOwnerLicenseImage) {
      let gymOwnerLicenseImage: string | null = null;
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
      gymOwnerLicenseImage: gymOwnerLicenseImage
    }).save();

    console.log("New user created: " + newUser);
    const result = generateJWT(newUser._id, newUser.email, newUser.type);
    return result;
  }
  catch (err) {
    return { message: "Failed to register user", error: err };
  }
}

const generateJWT = (userId: Types.ObjectId, email: string, type: IUserType) => {
  if (!process.env.JWT_SECRET) {
    return { message: "Missing auth configuration" };
  }
  const token = jwt.sign(
    { id: userId.toString(), type: type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  return {
    _id: userId,
    email: email,
    token: token
  };
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

    if (!user.password) {
      return res.status(400).send("this is SSO user - no password");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send("Wrong email or password");
    }

    if (!process.env.JWT_SECRET) {
      return { message: "Missing auth configuration" };
    }

    const token = jwt.sign(
      { _id: user._id, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION });

    return res.status(200).send({
      _id: user._id,
      email: user.email,
      token: token
    });

  }
  catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const testCookie = async (req: Request, res: Response) => {
  return res.status(200).json({ message: "this is a cookie test" });
}

export default passport;
