import twilio from 'twilio';
import config from '../config';
import logger from './logger';

const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

export const sendSms = async (to: string, body: string) => {
     if (config.nodeEnv === 'development') {
    logger.info(`--- MOCKED SMS ---`);
    logger.info(`To: ${to}`);
    logger.info(`Body: ${body}`);
    logger.info(`--------------------`);
    return; 
  }
    try{
        await twilioClient.messages.create({
            body: body,
            from: config.twilio.phoneNumber,
            to: to,
        });
        logger.info(`SMS sent successfully to ${to}`);
    } catch (error) {
        logger.error(`Failed to send SMS to ${to}`, error);
        throw new Error('SMS sending failed.');
    }
};