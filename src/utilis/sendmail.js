// import nodemailer from "nodemailer";

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }) {
  const { data, error } = await resend.emails.send({
    from: 'Cinalytics onboarding@resend.dev',
    to,
    subject,
    html: html || `<p>${text}</p>`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.GMAIL_USER,
//         pass: process.env.GMAIL_PASS,
//     },
//     pool: false,
//   maxConnections: 1,
//   maxMessages: 1,

//   connectionTimeout: 20000,
//   greetingTimeout: 20000,
//   socketTimeout: 20000,

//   tls: {
//     rejectUnauthorized: false,
//   },
// });

// export const sendEmail = async ({ to, subject, text, html }) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `Cinanalytics <${process.env.GMAIL_USER}>`,
//       to,
//       subject,
//       text,
//       html,
//     });

//     console.log("Email sent:", info.messageId);
//     return info;
//   } catch (error) {
//     console.error("Email error:", error);
//     throw error;
//   }
// };