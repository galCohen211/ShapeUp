import { Router } from 'express';
import passport from 'passport';


const userRouter = Router();

function isLoggedIn(req: any, res: any, next: any): void {
  req.user ? next() : res.sendStatus(401);
}

userRouter.get('/', (req, res) => {
  res.send('<a href="/users/auth/google">Authenticate with Google</a>');
});

userRouter.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

userRouter.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/users/auth/google/protected',
    failureRedirect: '/users/auth/google/failure',
  })
);

userRouter.get('/auth/google/protected', isLoggedIn, (req: any, res) => {
  res.send(`Hello ${req.user.username}`);
});

userRouter.get('/auth/google/logout', (req: any, res) => {
  req.logout((err: any) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }
    req.session.destroy(() => {
      res.send('Goodbye!');
    });
  });
});

userRouter.get('/auth/google/failure', (req, res) => {
  res.send('Failed to authenticate');
});

export default userRouter;

