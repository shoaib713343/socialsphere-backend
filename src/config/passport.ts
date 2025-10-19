import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserModel, IUser } from '../features/auth.model';
import config from './index';


passport.use(
    new GoogleStrategy(
        {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: '/api/v1/auth/google/callback',
        proxy: true,
        },
        async (accessToken, refreshAccessToken, profile, done) => {
            try {
                let user = await UserModel.findOne({ email: profile.emails?.[0].value });

                if(user) {
                    return done(null, user);
                } else {
                const newUser = await UserModel.create({
                    username: profile.displayName.replace(/\s/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
                    email: profile.emails?.[0].value,
                    provider: 'google',
                    isEmailVerified: true,
                });
                return done(null, newUser);
                }
            } catch (error) {
                return done(error as Error, false);
            }
        }
    )
)