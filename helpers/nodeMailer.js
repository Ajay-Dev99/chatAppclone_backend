
const nodemailer = require('nodemailer');




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (email, subject, otp) => {



    const text = `
<h1>Hello ${email}</h1>
<p>Your OTP is ${otp}</p>
`;
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            text: text
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