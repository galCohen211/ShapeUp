import { Request, Response } from 'express';
import { google } from 'googleapis';
import User from '../models/user-model';

class UserController {
  static async loginGoogle(req: Request, res: Response): Promise<void> {
      const { code } = req.body; //query
      if (!code) {
        console.log("Code not received");
        res.status(400).json({ error: 'No code received' });
        return;
      }
      console.log("Code received:", code);
    
    try {

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code as string); //+ as string

      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
      const userInfo = await oauth2.userinfo.get();


      if (!userInfo.data.email) {
        res.status(400).json({ error: 'Email not found in Google user info' });
        return;
      }

      let user = await User.findOne({ email: userInfo.data.email });

      if (!user) {
        user = new User({
          email: userInfo.data.email,
          username: userInfo.data.email.split('@')[0],
          firstName: userInfo.data.given_name || 'Not delivered',
          lastName: userInfo.data.family_name || 'Not delivered',
          address: 'Not delivered',
          type: 'user',
          favoriteGyms: [],
        });
        await user.save();
      }

      res.status(200).json({
        user,
        accessToken: tokens.access_token,
        success: true,
      });

    } catch (error) {
        if (error instanceof Error) {
            console.error("Error during Google login:", (error as any).response?.data || error.message, (error as any).response?.config);
        } else {
            console.error("Unexpected error during Google login:", error);
        }
        console.log(req.body);
      res.status(400).json({ error: 'Something went wrong with Google login' });
    }
  }
}

export default UserController;


// import { Request, Response } from 'express';
// import { OAuth2Client } from 'google-auth-library';
// import User from '../models/user-model';
// import jwt from 'jsonwebtoken';

// class UserController {
//   static async googleLogin(req: Request, res: Response): Promise<void> {
//     const { idToken } = req.body;

//     const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 

//     let ticket;
//     try {
//       ticket = await client.verifyIdToken({
//         idToken,
//         audience: "284693083284-kg8atgnkqq0sf1sl875j9ghe5in9vog0.apps.googleusercontent.com", 
//       });
//     } catch (error) {
//         console.log("Error during Google login:", error);
//       res.status(401).json({ success: false, message: 'Invalid Google token' });
//       return;
//     }

//     const payload = ticket.getPayload();
    
//     if (!payload || !payload.email) {
//         res.status(400).json({ success: false, message: 'Invalid or missing email in Google token' });
//         return;
//     }

//     const { email, given_name: firstName, family_name: lastName } = payload;

//     let user = await User.findOne({ email });

//     if (!user) {
//       user = new User({
//         email,
//         firstName,
//         lastName,
//         username: email.split('@')[0],
//         address: 'Not provided',
//         type: 'user',
//         favoriteGyms: [],
//       });
//       await user.save();
//     }

//     const accessToken = jwt.sign(
//       { userId: user._id, role: user.type },
//       process.env.JWT_SECRET as string,
//       { expiresIn: '1h' }
//     );

//     res.status(200).json({
//       user: {
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         address: user.address,
//         type: user.type,
//         favoriteGyms: user.favoriteGyms,
//       },
//       accessToken,
//       success: true,
//     });
//   }
// }

// export default UserController;

