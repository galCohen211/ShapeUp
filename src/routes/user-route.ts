import { Request, Response, Router } from "express";
import passport from "passport";
import { body, query, param } from "express-validator";

import upload from "../multer";
import verifyToken from "../middleware/verifyToken";
import { IUserType } from "../models/user-model";
import { signup, login, logout, refresh } from "../controllers/auth-controller"
import UserController from "../controllers/user-controller";

const router = Router();

function isLoggedIn(req: Request, res: Response, next: any): void {
  req.user ? next() : res.sendStatus(401);
}

router.get("/", (req: Request, res: Response) => {
  res.send('<a href="/users/auth/google">Authenticate with Google</a>');
});

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    // session: false,
    successRedirect: "/users/auth/google/protected",
    failureRedirect: "/users/auth/google/failure",
  })
);

router.get("/auth/google/protected", isLoggedIn, (req: any, res) => {
  res.send(`Hello ${req.user.id}`);
});

router.get("/auth/google/failure", (req: Request, res: Response) => {
  res.send("Failed to authenticate");
});

router.post("/signup",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "gymOwnerLicenseImage", maxCount: 1 }
  ]),
  [
    body("email").notEmpty().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("firstName").notEmpty().isString().withMessage("First name is required and must be a string"),
    body("lastName").notEmpty().isString().withMessage("Last name is required and must be a string"),
    body("street").notEmpty().isString().withMessage("Street is required and must be a string"),
    body("city").notEmpty().isString().withMessage("City is required and must be a string"),
    body("birthdate").notEmpty().isString().withMessage("Birthdate is required and must be a string"),
    body("gender").notEmpty().withMessage("Gender is required"),
  ],
  (req: Request, res: Response) => {
    signup(req, res);
  });

router.post("/login",
  [
    body("email").notEmpty().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  (req: Request, res: Response) => {
    login(req, res);
  });

router.post("/logout",
  (req: Request, res: Response) => {
    logout(req, res);
  });

router.post("/refresh",
  (req: Request, res: Response) => {
    refresh(req, res);
  });


router.get("/user/:userId", UserController.getUserById,
  [param("userId")
    .notEmpty()
    .withMessage("User ID is required.")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId."),]
);

router.get("/getMyProfile",
  verifyToken([IUserType.ADMIN, IUserType.GYM_OWNER, IUserType.USER]),
  (req: Request, res: Response) => {
    UserController.getMyProfile(req, res);
  });

router.put("/updateUserById/:userId",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  verifyToken([IUserType.GYM_OWNER, IUserType.USER]),
  [
    param("userId")
      .notEmpty().withMessage("User ID is required.")
      .isMongoId().withMessage("User ID must be a valid MongoDB ObjectId."),
    body("firstName").optional().isString(),
    body("lastName").optional().isString(),
    body("city").optional().isString(),
    body("street").optional().isString(),
  ],
  UserController.updateUserById
);

router.post(
  "/addFavoriteGym/:userId",
  verifyToken([IUserType.USER]),
  [
    param("userId")
      .notEmpty()
      .withMessage("User ID is required.")
      .isMongoId()
      .withMessage("User ID must be a valid MongoDB ObjectId."),
    body("gymId")
      .notEmpty()
      .withMessage("Gym ID is required.")
      .isMongoId()
      .withMessage("Gym ID must be a valid MongoDB ObjectId."),
  ],
  UserController.addFavoriteGym
);

router.delete(
  "/deleteFavoriteGymById/",
  verifyToken([IUserType.USER]),
  [
    body("gymId")
      .notEmpty()
      .withMessage("Gym ID is required.")
      .isMongoId()
      .withMessage("Gym ID must be a valid MongoDB ObjectId."),
  ],
  UserController.deleteFavoriteGymById
);

router.get(
  "/filter",
  verifyToken([IUserType.GYM_OWNER, IUserType.ADMIN]),
  [
    query("search")
      .notEmpty()
      .withMessage("Search query is required")
      .isString()
      .withMessage("Search query must be a string"),
  ],
  UserController.filterUsers
);

router.delete("/:userId", UserController.deleteUserById,
  verifyToken([IUserType.USER, IUserType.ADMIN]),
  [
    param("userId")
      .notEmpty()
      .withMessage("User ID is required.")
      .isMongoId()
      .withMessage("User ID must be a valid MongoDB ObjectId.")
  ]
);

export default router;
