import nodemailer from "nodemailer";

import { getEnv } from "@/lib/env";

type OtpEmailInput = {
  code: string;
  to: string;
};

type TransferEmailInput = {
  message: string;
  senderOrgName: string;
  to: string;
};

function getTransporter() {
  const env = getEnv();

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
}

export async function sendOtpEmail({ code, to }: OtpEmailInput) {
  const env = getEnv();

  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Your Secure Data Portal login code",
    text: `Your login code is ${code}. It expires in 10 minutes.`,
  });
}

export async function sendTransferNotificationEmail({
  message,
  senderOrgName,
  to,
}: TransferEmailInput) {
  const env = getEnv();

  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "New data transfer received",
    text: `${senderOrgName} transferred data to your organization.\n\nMessage:\n${message}`,
  });
}
