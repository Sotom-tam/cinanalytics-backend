import axios from "axios";

export async function sendEmail({ to, subject, html, text }) {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Cinalytics",
          email: process.env.BREVO_SENDER_EMAIL, // must be verified
        },
        to: Array.isArray(to)
          ? to.map((email) => ({ email }))
          : [{ email: to }],
        subject,
        htmlContent: html || `<p>${text}</p>`,
        textContent: text,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Brevo error:", error.response?.data || error.message);
    throw error;
  }
}