import { Request, Response, Router } from "express";
import passport from "passport";
import { body, query, param } from "express-validator";

import { signup, login, getFromCookie } from "../controllers/auth-controller"
import { IUserType } from "../models/user-model";
import verifyToken from "../middleware/verifyToken";
import upload from "../multer";
import UserController from "../controllers/user-controller";

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

userRouter.post("/signup", upload.fields([{ name: "avatar", maxCount: 1 }]),
  [
    body("email").notEmpty().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("firstName").notEmpty().isString().withMessage("First name is required and must be a string"),
    body("lastName").notEmpty().isString().withMessage("Last name is required and must be a string"),
    body("address").notEmpty().isString().withMessage("Address is required and must be a string"),
  ],
  (req: Request, res: Response) => {
    signup(req, res);
  });

userRouter.post("/login",
  [
    body("email").notEmpty().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  (req: Request, res: Response) => {
    login(req, res);
  });

  userRouter.put("/update-user/:userId", upload.fields([{ name: "avatar", maxCount: 1 }]), verifyToken([IUserType.GYM_OWNER, IUserType.USER]),
  [
    param("userId")
    .notEmpty().withMessage("User ID is required.")
    .isMongoId().withMessage("User ID must be a valid MongoDB ObjectId."),
    body("password").optional(),
    body("firstName").optional().isString(),
    body("lastName").optional().isString(),
    body("address").optional().isString(),
  ],
  UserController.updateUser
);


export default userRouter;
