import dotenv from 'dotenv';
dotenv.config();

const getEnvVar = (name: string): string => {
    const value = process.env[name];
    if(!value){
        throw new Error(`FATAL ERROR: Environment variable ${name} is not defined.`);
    }
    return value;
};

const config = {
    port: getEnvVar('PORT'),
    nodeEnv: getEnvVar('NODE_ENV'),
    mongoUri: getEnvVar('MONGODB_URI'),
  jwt: {
    accessTokenSecret: getEnvVar('ACCESS_TOKEN_SECRET'),
    accessTokenExpiry: getEnvVar('ACCESS_TOKEN_EXPIRY'),
    refreshTokenSecret: getEnvVar('REFRESH_TOKEN_SECRET'),
    refreshTokenExpiry: getEnvVar('REFRESH_TOKEN_EXPIRY'),
  },
   cloudinary: {
    cloudName: getEnvVar('CLOUDINARY_CLOUD_NAME'),
    apiKey: getEnvVar('CLOUDINARY_API_KEY'),
    apiSecret: getEnvVar('CLOUDINARY_API_SECRET'),
  },
  twilio: {
    accountSid: getEnvVar('TWILIO_ACCOUNT_SID'),
    authToken: getEnvVar('TWILIO_AUTH_TOKEN'),
    phoneNumber: getEnvVar('TWILIO_PHONE_NUMBER'),
  },
   google: { 
    clientId: getEnvVar('GOOGLE_CLIENT_ID'),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
  },
   email: {
    host: getEnvVar('EMAIL_HOST'),
    port: parseInt(getEnvVar('EMAIL_PORT'), 10),
    user: getEnvVar('EMAIL_USER'),
    pass: getEnvVar('EMAIL_PASS'),
  },
};

export default config;