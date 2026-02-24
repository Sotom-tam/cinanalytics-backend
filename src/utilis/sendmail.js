import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }) {
  const { data, error } = await resend.emails.send({
    from: 'Cinalytics <onboarding@resend.dev>',
    to,
    subject,
    html: html || `<p>${text}</p>`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}