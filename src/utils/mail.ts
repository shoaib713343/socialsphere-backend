import nodemailer from 'nodemailer';
import logger from './logger';

export const sendEmail = async (options: {
    to: string;
    subject: string;
    html: string;
}) => {
    const testAccount = await nodemailer.createTestAccount();

     const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

    const mailOptions = {
    from: '"SocialSphere" <noreply@socialsphere.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);

  logger.info(`Email sent: ${info.messageId}`);
  logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);

}