import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as requestOtpPost } from "@/app/api/auth/request-otp/route";
import { POST as verifyOtpPost } from "@/app/api/auth/verify-otp/route";

const mockHeaders = jest.fn();
const mockCreateOtpCode = jest.fn();
const mockCreateSession = jest.fn();
const mockClearSession = jest.fn();
const mockAssertRateLimit = jest.fn();
const mockGenerateOtpCode = jest.fn();
const mockLogOtpCode = jest.fn();
const mockSendOtpEmail = jest.fn();
const mockVerifyOtpCode = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockGetUserById = jest.fn();

jest.mock("next/headers", () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock("@/lib/auth/otp", () => ({
  createOtpCode: (...args: unknown[]) => mockCreateOtpCode(...args),
  generateOtpCode: (...args: unknown[]) => mockGenerateOtpCode(...args),
  logOtpCode: (...args: unknown[]) => mockLogOtpCode(...args),
  verifyOtpCode: (...args: unknown[]) => mockVerifyOtpCode(...args),
}));

jest.mock("@/lib/auth/session", () => ({
  clearSession: (...args: unknown[]) => mockClearSession(...args),
  createSession: (...args: unknown[]) => mockCreateSession(...args),
}));

jest.mock("@/lib/email", () => ({
  sendOtpEmail: (...args: unknown[]) => mockSendOtpEmail(...args),
}));

jest.mock("@/lib/rateLimit", () => ({
  assertRateLimit: (...args: unknown[]) => mockAssertRateLimit(...args),
}));

jest.mock("@/lib/users", () => ({
  getUserByEmail: (...args: unknown[]) => mockGetUserByEmail(...args),
  getUserById: (...args: unknown[]) => mockGetUserById(...args),
}));

function createHeaderStore() {
  return {
    get: jest.fn().mockReturnValue(null),
  };
}

function createRequest(pathname: string, values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    body: formData,
  });
}

function getLocation(response: Response) {
  return new URL(response.headers.get("location") ?? "", "http://localhost");
}

describe("auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders.mockResolvedValue(createHeaderStore());
    mockAssertRateLimit.mockResolvedValue(undefined);
    mockGenerateOtpCode.mockReturnValue("123456");
    mockCreateOtpCode.mockResolvedValue(undefined);
    mockLogOtpCode.mockReturnValue(undefined);
    mockSendOtpEmail.mockResolvedValue(undefined);
    mockCreateSession.mockResolvedValue(undefined);
    mockClearSession.mockResolvedValue(undefined);
  });

  it("redirects when the login email is invalid", async () => {
    const response = await requestOtpPost(
      createRequest("/api/auth/request-otp", { email: "not-an-email" }),
    );

    expect(response.status).toBe(303);
    expect(getLocation(response).pathname).toBe("/login");
    expect(getLocation(response).searchParams.get("error")).toBe(
      "Enter a valid email address.",
    );
    expect(mockAssertRateLimit).not.toHaveBeenCalled();
  });

  it("redirects when requesting an OTP hits the rate limit", async () => {
    mockAssertRateLimit.mockRejectedValue(new Error("Too many attempts."));

    const response = await requestOtpPost(
      createRequest("/api/auth/request-otp", { email: "org@example.com" }),
    );

    expect(response.status).toBe(303);
    expect(getLocation(response).searchParams.get("error")).toBe("Too many attempts.");
  });

  it("redirects when the user does not exist for the submitted email", async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const response = await requestOtpPost(
      createRequest("/api/auth/request-otp", { email: "org@example.com" }),
    );

    expect(getLocation(response).searchParams.get("error")).toBe(
      "No organization user exists for this email.",
    );
  });

  it("creates and sends an OTP for a known user", async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "org@example.com",
    });

    const response = await requestOtpPost(
      createRequest("/api/auth/request-otp", { email: "org@example.com" }),
    );

    expect(mockAssertRateLimit).toHaveBeenCalledWith({
      action: "request-otp",
      key: "org@example.com:unknown",
      limit: 5,
      windowMs: 900000,
    });
    expect(mockCreateOtpCode).toHaveBeenCalledWith({
      code: "123456",
      email: "org@example.com",
      userId: "user-1",
    });
    expect(mockLogOtpCode).toHaveBeenCalledWith({
      code: "123456",
      email: "org@example.com",
    });
    expect(mockSendOtpEmail).toHaveBeenCalledWith({
      code: "123456",
      to: "org@example.com",
    });
    expect(getLocation(response).pathname).toBe("/login");
    expect(getLocation(response).searchParams.get("email")).toBe("org@example.com");
    expect(getLocation(response).searchParams.get("sent")).toBe("1");
  });

  it("redirects when the OTP verification payload is invalid", async () => {
    const response = await verifyOtpPost(
      createRequest("/api/auth/verify-otp", {
        code: "123",
        email: "org@example.com",
      }),
    );

    expect(getLocation(response).pathname).toBe("/login");
    expect(getLocation(response).searchParams.get("error")).toBe(
      "Enter the 6 digit code.",
    );
    expect(getLocation(response).searchParams.get("sent")).toBe("1");
  });

  it("redirects when OTP verification hits the rate limit", async () => {
    mockAssertRateLimit.mockRejectedValue(new Error("Please wait."));

    const response = await verifyOtpPost(
      createRequest("/api/auth/verify-otp", {
        code: "123456",
        email: "org@example.com",
      }),
    );

    expect(getLocation(response).searchParams.get("email")).toBe("org@example.com");
    expect(getLocation(response).searchParams.get("error")).toBe("Please wait.");
    expect(getLocation(response).searchParams.get("sent")).toBe("1");
  });

  it("redirects when the OTP code is rejected", async () => {
    mockVerifyOtpCode.mockResolvedValue({
      ok: false,
      reason: "Invalid or expired code.",
    });

    const response = await verifyOtpPost(
      createRequest("/api/auth/verify-otp", {
        code: "123456",
        email: "org@example.com",
      }),
    );

    expect(getLocation(response).searchParams.get("error")).toBe(
      "Invalid or expired code.",
    );
  });

  it("redirects when the session user cannot be loaded after OTP verification", async () => {
    mockVerifyOtpCode.mockResolvedValue({
      ok: true,
      userId: "user-1",
    });
    mockGetUserById.mockResolvedValue(null);

    const response = await verifyOtpPost(
      createRequest("/api/auth/verify-otp", {
        code: "123456",
        email: "org@example.com",
      }),
    );

    expect(getLocation(response).searchParams.get("error")).toBe(
      "Unable to create session.",
    );
  });

  it("creates a session and redirects to transfer after successful OTP verification", async () => {
    mockVerifyOtpCode.mockResolvedValue({
      ok: true,
      userId: "user-1",
    });
    mockGetUserById.mockResolvedValue({
      id: "user-1",
      email: "org@example.com",
      name: "Org User",
      organizationId: "org-1",
      organizationName: "Org 1",
      organizationSlug: "org-1",
    });

    const response = await verifyOtpPost(
      createRequest("/api/auth/verify-otp", {
        code: "123456",
        email: "org@example.com",
      }),
    );

    expect(getLocation(response).pathname).toBe("/transfer");
    expect(mockCreateSession).toHaveBeenCalledWith({
      id: "user-1",
      email: "org@example.com",
      name: "Org User",
      organizationId: "org-1",
      organizationName: "Org 1",
      organizationSlug: "org-1",
    });
  });

  it("clears the session and redirects to login on logout", async () => {
    const response = await logoutPost(new Request("http://localhost/api/auth/logout", {
      method: "POST",
    }));

    expect(response.status).toBe(303);
    expect(getLocation(response).pathname).toBe("/login");
    expect(mockClearSession).toHaveBeenCalled();
  });
});
