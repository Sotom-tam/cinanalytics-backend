import SibApiV3Sdk from '@getbrevo/brevo';

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const transactionalApi = new SibApiV3Sdk.TransactionalEmailsApi();

// /
//  * Send a single email
//  */
export async function sendEmail({ to, subject, html, text }) {
  const email = new SibApiV3Sdk.SendSmtpEmail();

  email.sender = { name: 'Cinalytics', email: process.env.BREVO_SENDER_EMAIL };
  email.to = Array.isArray(to)
    ? to.map((addr) => ({ email: addr }))
    : [{ email: to }];
  email.subject = subject;
  email.htmlContent = html || `<p>${text}</p>`;
  if (text) email.textContent = text;

  try {
    const data = await transactionalApi.sendTransacEmail(email);
    return data;
  } catch (error) {
    throw new Error(`Brevo sendEmail failed: ${error.message}`);
  }
}

// /
//  * Send multiple emails (bulk) — fires them all concurrently
//  * emails: Array of { to, subject, html, text }
//  */
export async function sendBulkEmails(emails) {
  const results = await Promise.allSettled(
    emails.map((emailData) => sendEmail(emailData))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results
    .filter((r) => r.status === 'rejected')
    .map((r, i) => ({ index: i, reason: r.reason.message }));

  if (failed.length > 0) {
    console.error('Some emails failed:', failed);
  }

  console.log("Emails sent:",` ${succeeded}/${emails.length}`);
  return { succeeded, failed, results };
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
//       from: Cinanalytics <${process.env.GMAIL_USER}>,
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