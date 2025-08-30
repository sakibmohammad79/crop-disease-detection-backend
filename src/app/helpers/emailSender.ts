import { config } from "../config";
import nodemailer from "nodemailer";

const emailSender = async (email: string, html: string) => { 
  try {
    const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
      auth: {
        user: config.emailSender.smtp_user,
        pass: config.emailSender.smtp_user_pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"Crop Disease Detection 👻" <${config.emailSender.email_from}>`, // Dynamic sender
      to: email,
      subject: "Password Reset Link ✔",
      html: html,
    });

    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send email");
  }
};

export default emailSender;