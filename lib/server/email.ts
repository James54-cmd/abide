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

export async function sendVerificationEmail(email: string, link: string, fullName?: string) {
  if (!host || !user || !pass) {
    console.error("SMTP settings are missing in .env.local. Email NOT sent.");
    return;
  }

  const from = process.env.SMTP_FROM || user;
  const nameToUse = fullName || email.split("@")[0];

  await transporter.sendMail({
    from: `"Abide" <${from}>`,
    to: email,
    subject: "Verify your email - Abide",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email – Abide</title>
</head>
<body style="margin:0; padding:0; background-color:#FBFAF7; font-family: Georgia, 'Times New Roman', serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FBFAF7; padding: 48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px; width:100%; background-color:#FFFFFF;
                 border:1px solid #E0D8C0; border-radius:4px;
                 overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">

          <!-- Top ornament bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #7a6010 0%, #D4AF37 40%, #f0d060 60%, #D4AF37 80%, #7a6010 100%);
                        height:3px; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 48px 48px 32px;">
              <!-- Logo mark (Cross SVG) -->
              <div style="margin-bottom:20px;">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" fill="#D4AF37"/>
                </svg>
              </div>

              <!-- Wordmark -->
              <p style="margin:0; font-size:11px; letter-spacing:6px; text-transform:uppercase;
                         color:#D4AF37; font-family:Georgia, serif;">
                A B I D E
              </p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="margin: 24px 0 0;">
                <tr>
                  <td style="border-top:1px solid #ece4d0;"></td>
                  <td width="12" align="center"
                    style="color:#D4AF37; font-size:14px; padding: 0 12px;">✦</td>
                  <td style="border-top:1px solid #ece4d0;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Scripture pull-quote -->
          <tr>
            <td align="center" style="padding: 0 64px 32px;">
              <p style="margin:0; font-size:15px; line-height:1.8; color:#7a6010;
                         font-style:italic; text-align:center;">
                "Abide in me, and I in you."
              </p>
              <p style="margin:8px 0 0; font-size:11px; letter-spacing:3px;
                         color:#b8a56a; text-transform:uppercase; text-align:center;">
                John 15:4
              </p>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td style="padding: 0 48px 40px;">
              <p style="margin:0 0 16px; font-size:16px; line-height:1.75; color:#0F0E0B;">
                Hello ${nameToUse},
              </p>
              <p style="margin:0 0 32px; font-size:16px; line-height:1.75; color:#5a4f2a;">
                Thank you for joining Abide. Confirm your email address below
                to begin your daily journey through God's Word.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}"
                      style="display:inline-block;
                             background: linear-gradient(135deg, #b8930a 0%, #D4AF37 50%, #e8c84a 100%);
                             color:#FFFFFF;
                             padding: 16px 48px;
                             border-radius: 2px;
                             font-family: Georgia, serif;
                             font-size: 13px;
                             font-weight: bold;
                             letter-spacing: 3px;
                             text-decoration: none;
                             text-transform: uppercase;
                             box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);">
                      Verify My Account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:28px 0 0; font-size:12px; color:#b8a56a;
                         text-align:center; line-height:1.6;">
                Or copy this link into your browser:<br/>
                <a href="${link}"
                  style="color:#D4AF37; word-break:break-all; text-decoration:none;">
                  ${link}
                </a>
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding: 0 48px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #f2ede0; padding-top:24px;">
                    <p style="margin:0; font-size:12px; color:#b8a56a; line-height:1.6;">
                      If you didn't create an Abide account, you can safely
                      ignore this email — no action is needed.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="background-color:#FBFAF7; padding:24px 48px;
                     border-top:1px solid #f2ede0;">
              <p style="margin:0 0 8px; font-size:11px; letter-spacing:4px;
                         text-transform:uppercase; color:#b8a56a;">
                Abide
              </p>
              <p style="margin:0; font-size:11px; color:#b8a56a; line-height:1.6;">
                Bible encouragement, always with you.
              </p>
            </td>
          </tr>

          <!-- Bottom ornament bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #7a6010 0%, #D4AF37 40%, #f0d060 60%, #D4AF37 80%, #7a6010 100%);
                        height:3px; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, link: string, fullName?: string) {
  if (!host || !user || !pass) {
    console.error("SMTP settings are missing in .env.local. Password reset email NOT sent.");
    return;
  }

  const from = process.env.SMTP_FROM || user;
  const nameToUse = fullName || email.split("@")[0];

  await transporter.sendMail({
    from: `"Abide" <${from}>`,
    to: email,
    subject: "Reset your password - Abide",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your password – Abide</title>
</head>
<body style="margin:0; padding:0; background-color:#FBFAF7; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FBFAF7; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px; width:100%; background-color:#FFFFFF;
                 border:1px solid #E0D8C0; border-radius:4px;
                 overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <tr>
            <td style="background: linear-gradient(90deg, #7a6010 0%, #D4AF37 40%, #f0d060 60%, #D4AF37 80%, #7a6010 100%);
                        height:3px; font-size:0; line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding: 48px 48px 32px;">
              <p style="margin:0; font-size:11px; letter-spacing:6px; text-transform:uppercase;
                         color:#D4AF37; font-family:Georgia, serif;">A B I D E</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 48px 40px;">
              <p style="margin:0 0 16px; font-size:16px; line-height:1.75; color:#0F0E0B;">
                Hello ${nameToUse},
              </p>
              <p style="margin:0 0 32px; font-size:16px; line-height:1.75; color:#5a4f2a;">
                We received a request to reset your Abide password. Choose a new password using the link below.
                If you did not ask for this, you can ignore this email.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}"
                      style="display:inline-block;
                             background: linear-gradient(135deg, #b8930a 0%, #D4AF37 50%, #e8c84a 100%);
                             color:#FFFFFF;
                             padding: 16px 48px;
                             border-radius: 2px;
                             font-family: Georgia, serif;
                             font-size: 13px;
                             font-weight: bold;
                             letter-spacing: 3px;
                             text-decoration: none;
                             text-transform: uppercase;
                             box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0; font-size:12px; color:#b8a56a;
                         text-align:center; line-height:1.6;">
                Or copy this link into your browser:<br/>
                <a href="${link}" style="color:#D4AF37; word-break:break-all; text-decoration:none;">${link}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:#FBFAF7; padding:24px 48px; border-top:1px solid #f2ede0;">
              <p style="margin:0; font-size:11px; color:#b8a56a;">Bible encouragement, always with you.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}
