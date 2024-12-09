import passport from 'passport';
import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth2';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;

passport.use(new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/users/auth/google/callback",
    passReqToCallback: true,
  },
  function (
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: Express.User,
    done: VerifyCallback
  ) {
    
    return done(null, profile);
  }
));

passport.serializeUser(function (user: Express.User, done: (err: any, id?: unknown) => void): void {
  done(null, user);
});

passport.deserializeUser(function (user: Express.User, done: (err: any, user?: Express.User) => void): void {
  done(null, user);
});

export default passport;
