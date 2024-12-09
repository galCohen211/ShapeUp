import User from "../models/user-model";
// import { Types } from "mongoose";
// import jwt from "jsonwebtoken";

// const generateJWT = (userID: Types.ObjectId, UserEmail: string) => {
//   const token = jwt.sign(
//     { id: userID.toString(), email: UserEmail },
//     process.env.JWT_SECRET || "cats",
//     { expiresIn: "1h" }
//   );

//   return token;
// };

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
  username: string,
  firstName: string,
  lastName: string,
  address: string,
  password?: string
) => {
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        message: "User already exists",
        user: existingUser,
      };
    }

    const newUser = await new User({
      email,
      password,
      username,
      firstName,
      lastName,
      address,
      type: "user",
      favoriteGyms: [],
    }).save();
    console.log("new user created" + newUser);

    // const token = generateJWT(newUser._id, newUser.email);

    return {
      message: "User created successfully",
      user: newUser,
      //   token,
    };
  } catch (err) {
    return { message: "Error accured", error: err };
  }
};

export { loginUser, registerUser };
