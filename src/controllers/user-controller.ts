import { Request, Response } from 'express';
import { google } from 'googleapis';
import User from '../models/user-model';

class UserController {
  static async loginGoogle(req: Request, res: Response): Promise<void> {
      const { code } = req.query;
      if (!code) {
        console.log("Code not received");
        res.status(400).json({ error: 'No code received' });
        return;
      }
    
    try {

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code as string);

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
        console.error("Error during Google login:", error);
      res.status(400).json({ error: 'Something went wrong with Google login' });
    }
  }
}

export default UserController;
