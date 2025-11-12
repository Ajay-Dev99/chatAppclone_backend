
const nodemailer = require('nodemailer');




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (email, subject, otp) => {
    const safeEmail = String(email).trim();
    const safeOtp = String(otp).replace(/[^\d]/g, "");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OTP Verification</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f5f6fa;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1f2933;
        }
        .wrapper {
            width: 100%;
            padding: 32px 0;
            display: flex;
            justify-content: center;
        }
        .card {
            background-color: #ffffff;
            border-radius: 18px;
            box-shadow: 0 18px 45px rgba(16, 24, 40, 0.12);
            max-width: 520px;
            width: 92%;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0ca678, #2c7be5);
            padding: 28px 36px;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 36px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 12px;
            font-weight: 600;
        }
        .message {
            line-height: 1.6;
            margin-bottom: 28px;
            font-size: 15px;
        }
        .otp-box {
            display: inline-block;
            letter-spacing: 12px;
            padding: 18px 24px;
            font-size: 28px;
            font-weight: 700;
            color: #0ca678;
            border-radius: 14px;
            background-color: #ecfdf3;
            border: 1px solid rgba(12, 166, 120, 0.22);
            margin-bottom: 28px;
        }
        .note {
            font-size: 13px;
            color: #52616d;
            margin-top: 12px;
        }
        .divider {
            height: 1px;
            background-color: #e5e8ec;
            margin: 28px 0;
        }
        .footer {
            padding: 0 36px 32px;
            color: #94a3b8;
            font-size: 12px;
            line-height: 1.5;
        }
        @media (max-width: 600px) {
            .card {
                width: 100%;
            }
            .header, .content, .footer {
                padding: 24px;
            }
            .otp-box {
                letter-spacing: 10px;
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1>WhatsApp Clone</h1>
                <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Secure sign-in verification</p>
            </div>
            <div class="content">
                <p class="greeting">Hi ${safeEmail},</p>
                <p class="message">
                    We received a request to verify your email address for WhatsApp Clone. Please use the following
                    one-time password to complete the verification process. This code is valid for the next <strong>5 minutes</strong>.
                </p>
                <div class="otp-box">${safeOtp}</div>
                <p class="note">
                    If you did not request this verification, you can safely ignore this email.
                    For security, do not share this code with anyone.
                </p>
                <div class="divider"></div>
                <p class="message" style="margin-bottom: 8px;">
                    Need help or have questions? Reply to this email and we'll be happy to assist.
                </p>
            </div>
            <div class="footer">
                <p>
                    This is an automated message sent to ${safeEmail}. Please do not share this code with anyone.
                    Your security is our priority.
                </p>
                <p style="margin-top: 8px;">© ${new Date().getFullYear()} WhatsApp Clone. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    const text = `WhatsApp Clone OTP Verification

Hi ${safeEmail},

Your OTP is ${safeOtp}. Please use this code within the next 5 minutes to complete your verification.

If you did not request this message, please ignore it.`;
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            text,
            html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return result;
    } catch (error) {
        console.log('Error sending email:', error);
        throw error;
    }
}

module.exports = sendEmail;