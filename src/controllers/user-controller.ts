import passport from "passport";
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth2";
import { registerUser } from "../services/user-service";

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
      request: any,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback
    ) {
      try {
        const res = await registerUser(
          profile.email,
          profile.displayName,
          profile.name.givenName,
          profile.name.familyName,
          " " // address
        );
        if (res.error) {
          return done(res.error, null);
        }
        return done(null, { user: res.user });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

//Responsible for retrieving the user's information from the session in each request
passport.serializeUser(function (
  user: Express.User,
  done: (err: any, id?: unknown) => void
): void {
  done(null, user);
});

//Responsible for retrieving the user's information from the session in each request
passport.deserializeUser(function (
  user: Express.User,
  done: (err: any, user?: Express.User) => void
): void {
  done(null, user);
});

export default passport;
