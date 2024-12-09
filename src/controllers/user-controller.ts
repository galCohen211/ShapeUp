import passport from 'passport';
import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth2';
import User from '../models/user-model';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;

passport.use(new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/users/auth/google/callback",
    passReqToCallback: true,
  },
  async function (
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ) {
    try{
      console.log('profile' + profile)
      const existingUser = await User.findOne({ email: profile.email });
      if(existingUser){
        console.log('user already exists' + existingUser)
        return done(null, existingUser);
      }

      const newUser = await new User({
        email: profile.email,
        username: profile.displayName,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        address: ' ',
        type: 'user',
        favoriteGyms:[],
      }).save();
      console.log('new user created' + newUser)
      return done(null, newUser);
    }catch(err){
      return done(err, null);
    }
  }
));

//Responsible for retrieving the user's information from the session in each request
passport.serializeUser(function (user: Express.User, done: (err: any, id?: unknown) => void): void {
  done(null, user);
});

//Responsible for retrieving the user's information from the session in each request
passport.deserializeUser(function (user: Express.User, done: (err: any, user?: Express.User) => void): void {
  done(null, user);
});

export default passport;
