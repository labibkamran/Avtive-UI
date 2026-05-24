export {};

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn((_config?: unknown) => ({
  sendMail: mockSendMail,
}));
const mockGetEnv = jest.fn();

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: (config: unknown) => mockCreateTransport(config),
  },
}));

jest.mock("@/lib/env", () => ({
  getEnv: (...args: unknown[]) => mockGetEnv(...args),
}));

describe("email helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockReturnValue({
      EMAIL_FROM: "no-reply@example.com",
      EMAIL_PASS: "password",
      EMAIL_USER: "no-reply@example.com",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: 465,
      SMTP_SECURE: true,
    });
  });

  it("sends the OTP email with the expected content", async () => {
    const { sendOtpEmail } = await import("@/lib/email");

    await sendOtpEmail({
      code: "123456",
      to: "owner@example.com",
    });

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-reply@example.com",
        pass: "password",
      },
    });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "no-reply@example.com",
      to: "owner@example.com",
      subject: "Your Secure Data Portal login code",
      text: "Your login code is 123456. It expires in 10 minutes.",
    });
  });

  it("sends transfer notification emails with sender and message details", async () => {
    const { sendTransferNotificationEmail } = await import("@/lib/email");

    await sendTransferNotificationEmail({
      to: "recipient@example.com",
      senderOrgName: "Acme",
      message: "Dataset is ready.",
    });

    expect(mockSendMail).toHaveBeenCalledWith({
      from: "no-reply@example.com",
      to: "recipient@example.com",
      subject: "New data transfer received",
      text: "Acme transferred data to your organization.\n\nMessage:\nDataset is ready.",
    });
  });
});
