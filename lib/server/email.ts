import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || "587");
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass,
  },
});

export async function sendVerificationEmail(email: string, link: string) {
  if (!host || !user || !pass) {
    console.error("SMTP settings are missing in .env.local. Email NOT sent.");
    return;
  }

  const from = process.env.SMTP_FROM || user;

  await transporter.sendMail({
    from: `"Abide" <${from}>`,
    to: email,
    subject: "Verify your email - Abide",
    html: `
      <div style="font-family: serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="color: #D4AF37; text-align: center;">Welcome to Abide</h1>
        <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.6;">Click the link below to verify your email address and start your journey with God's Word:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #D4AF37; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Verify Account</a>
        </div>
        <p style="font-size: 14px; color: #666;">If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Abide - Bible encouragement, always with you.</p>
      </div>
    `,
  });
}
