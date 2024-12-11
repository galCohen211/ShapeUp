import { Router } from "express";
import passport from "passport";
import { Request, Response } from "express";
import { signup, login, testCookie } from "../controllers/user-controller"
import { IUserType } from "../models/user-model";
import verifyToken from "../middleware/verifyToken";
const userRouter = Router();

function isLoggedIn(req: Request, res: Response, next: any): void {
  req.user ? next() : res.sendStatus(401);
}

userRouter.get("/", (req: Request, res: Response) => {
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
  res.send(`Hello ${req.user.email}`);
});

userRouter.get("/auth/google/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }
    req.session.destroy(() => {
      res.send("Goodbye!");
    });
  });
});

userRouter.get("/auth/google/failure", (req: Request, res: Response) => {
  res.send("Failed to authenticate");
});

userRouter.post("/signup", (req: Request, res: Response) => {
  signup(req, res);
});

userRouter.post("/login", (req: Request, res: Response) => {
  login(req, res);
});

userRouter.get("/testCookie", verifyToken([IUserType.USER]), (req: Request, res: Response) => {
  testCookie(req, res);
});

export default userRouter;
