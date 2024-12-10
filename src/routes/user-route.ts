import { Router } from "express";
import passport from "passport";
import { Request, Response } from "express";

const userRouter = Router();

function isLoggedIn(req: Request, res: Response, next: any): void { 
  req.user ? next() : res.sendStatus(401);
}

userRouter.get("/", (req:Request, res:Response) => { 
  res.send('<a href="/users/auth/google">Authenticate with Google</a>');
});

userRouter.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

userRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    // session: false,
    successRedirect: "/users/auth/google/protected",
    failureRedirect: "/users/auth/google/failure",
  })
);

userRouter.get("/auth/google/protected", isLoggedIn, (req: any, res) => { 
  res.send(`Hello ${req.user.user.username}`);
});

userRouter.get("/auth/google/logout", (req: Request, res:Response) => { 
  req.logout((err: any) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }
    req.session.destroy(() => {
      res.send("Goodbye!");
    });
  });
});

userRouter.get("/auth/google/failure", (req:Request, res:Response) => { 
  res.send("Failed to authenticate");
});

export default userRouter;
