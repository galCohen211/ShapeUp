import User, { IUserType } from "../models/user-model";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateJWT = (userId: Types.ObjectId, email: string, type: string) => {
  if (!process.env.JWT_SECRET) {
    return { message: "Missing auth configuration" };
  }
  const token = jwt.sign(
    { id: userId.toString(), type: type},
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  return {
    _id: userId,
    email: email,
    token: token
  };
};


const loginUser = async (email: string, password: string) => {
  const existingUser = await User.findOne({ email });
  // Check password match!!!
  //   const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
  //   if (!isPasswordCorrect) {
  //     return res.status(401).json({ message: "Invalid credentials!" });
  //   }

  if (!existingUser) {
    return { message: "User not found" };
  }

  //   const token = generateJWT(existingUser._id, existingUser.email);
  return {
    message: "User found",
    user: existingUser,
    // , token
  };
};

const registerUser = async (
  email: string,
  firstName: string,
  lastName: string,
  address: string,
  password?: string
) => {
  try {
    const user = await User.findOne({ email });
    if (user) {
      return { message: "User already exists" };
    }

    let hashedPassword: string | null = null;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const newUser = await new User({
      email,
      hashedPassword, // if SSO is used, the value is null
      firstName,
      lastName,
      address,
      type: IUserType.USER, // change to role?
      favoriteGyms: [],
    }).save();

    console.log("New user created:" + newUser);
    const token = generateJWT(newUser._id, newUser.email, newUser.type);

    return {
      message: "User created successfully",
      user: newUser,
      token: token
    };
  } catch (err) {
    return { message: "Failed to register user", error: err };
  }
};

export { loginUser, registerUser };
