// src/utils/mail.ts
import nodemailer from 'nodemailer';
import config from '../config';
import logger from './logger';

// Create a reusable transporter object using Mailtrap's SMTP details
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.user, // Your Mailtrap username
    pass: config.email.pass, // Your Mailtrap password
  },
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  const mailOptions = {
    from: `"SocialSphere" <from@socialsphere.com>`, // A generic sender address
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to Mailtrap successfully: ${info.messageId}`);
  } catch (error) {
    logger.error(`Email failed to send to Mailtrap`, error);
    throw new Error('Email sending failed.');
  }
};