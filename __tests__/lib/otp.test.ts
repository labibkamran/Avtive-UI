export {};

const mockGetEnv = jest.fn();

jest.mock("@/lib/env", () => ({
  getEnv: (...args: unknown[]) => mockGetEnv(...args),
}));

describe("otp helpers", () => {
  const originalConsoleInfo = console.info;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockReturnValue({
      NODE_ENV: "development",
      SESSION_SECRET: "12345678901234567890123456789012",
    });
    console.info = jest.fn();
  });

  afterAll(() => {
    console.info = originalConsoleInfo;
  });

  it("generates a six digit code", async () => {
    const { generateOtpCode } = await import("@/lib/auth/otp");

    expect(generateOtpCode()).toMatch(/^\d{6}$/);
  });

  it("hashes the same OTP code deterministically", async () => {
    const { hashOtpCode } = await import("@/lib/auth/otp");

    expect(hashOtpCode("123456")).toBe(hashOtpCode("123456"));
    expect(hashOtpCode("123456")).not.toBe(hashOtpCode("654321"));
  });

  it("prints OTP codes outside production", async () => {
    const { logOtpCode } = await import("@/lib/auth/otp");

    logOtpCode({ code: "123456", email: "owner@example.com" });

    expect(console.info).toHaveBeenCalledWith("[OTP] owner@example.com: 123456");
  });

  it("suppresses OTP logs in production", async () => {
    mockGetEnv.mockReturnValue({
      NODE_ENV: "production",
      SESSION_SECRET: "12345678901234567890123456789012",
    });
    const { logOtpCode } = await import("@/lib/auth/otp");

    logOtpCode({ code: "123456", email: "owner@example.com" });

    expect(console.info).not.toHaveBeenCalled();
  });
});
