import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user-model';

class UserController {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // This method generates the URL that the user will be redirected to in order to authenticate with Google
  public generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    });
  }

  // This method exchanges the code received from Google for an access token and refresh token
  public async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  // This method fetches the user's information from Google
  public async getUserInfo() {
    const oauth2 = google.oauth2({ auth: this.oauth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    return userInfo.data;
  }

// This method finds an existing user by email or creates a new user if the email is not found
  public async findOrCreateUser(googleUserInfo: any) {
    const existingUser = await User.findOne({ email: googleUserInfo.email });

    if (existingUser) {
      return existingUser;
    }

    const newUser = new User({
      email: googleUserInfo.email,
      username: googleUserInfo.email.split('@')[0],
      password: '',
      firstName: googleUserInfo.given_name || '',
      lastName: googleUserInfo.family_name || '',
      address: '',
      type: 'user',
      favoriteGyms: [],
    });

    await newUser.save();
    return newUser;
  }

  // Google login
  public async loginGoogle(code: string) {
    try {
      const tokens = await this.getTokens(code);
      const userInfo = await this.getUserInfo();
      const user = await this.findOrCreateUser(userInfo);
      return { user, tokens };
    } catch (error) {
      console.error('Error during Google login:', error);
      throw new Error('Something went wrong with Google login');
    }
  }
}

export default new UserController();
