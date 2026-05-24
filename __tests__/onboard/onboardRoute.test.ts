import crypto from "node:crypto";

import { POST as onboardPost } from "@/app/api/onboard/route";

const mockHeaders = jest.fn();
const mockCreateOtpCode = jest.fn();
const mockGenerateOtpCode = jest.fn();
const mockLogOtpCode = jest.fn();
const mockSeedRandomRowsForOrganization = jest.fn();
const mockSendOtpEmail = jest.fn();
const mockCreateOrganization = jest.fn();
const mockGetOrganizationBySlug = jest.fn();
const mockAssertRateLimit = jest.fn();
const mockCreateUser = jest.fn();
const mockGetUserByEmail = jest.fn();

jest.mock("next/headers", () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock("@/lib/auth/otp", () => ({
  createOtpCode: (...args: unknown[]) => mockCreateOtpCode(...args),
  generateOtpCode: (...args: unknown[]) => mockGenerateOtpCode(...args),
  logOtpCode: (...args: unknown[]) => mockLogOtpCode(...args),
}));

jest.mock("@/lib/dataRows", () => ({
  seedRandomRowsForOrganization: (...args: unknown[]) => mockSeedRandomRowsForOrganization(...args),
}));

jest.mock("@/lib/email", () => ({
  sendOtpEmail: (...args: unknown[]) => mockSendOtpEmail(...args),
}));

jest.mock("@/lib/organizations", () => ({
  createOrganization: (...args: unknown[]) => mockCreateOrganization(...args),
  getOrganizationBySlug: (...args: unknown[]) => mockGetOrganizationBySlug(...args),
}));

jest.mock("@/lib/rateLimit", () => ({
  assertRateLimit: (...args: unknown[]) => mockAssertRateLimit(...args),
}));

jest.mock("@/lib/users", () => ({
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  getUserByEmail: (...args: unknown[]) => mockGetUserByEmail(...args),
}));

function createHeaderStore() {
  return {
    get: jest.fn().mockReturnValue(null),
  };
}

function createRequest(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return new Request("http://localhost/api/onboard", {
    method: "POST",
    body: formData,
  });
}

function getLocation(response: Response) {
  return new URL(response.headers.get("location") ?? "", "http://localhost");
}

describe("onboard route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders.mockResolvedValue(createHeaderStore());
    mockAssertRateLimit.mockResolvedValue(undefined);
    mockGetUserByEmail.mockResolvedValue(null);
    mockGetOrganizationBySlug.mockResolvedValue(null);
    mockCreateOrganization.mockResolvedValue({
      id: "org-1",
      name: "Acme",
      slug: "acme",
      notificationEmail: "owner@example.com",
    });
    mockCreateUser.mockResolvedValue({
      id: "user-1",
      email: "owner@example.com",
      name: "Owner",
      organizationId: "org-1",
    });
    mockSeedRandomRowsForOrganization.mockResolvedValue(undefined);
    mockGenerateOtpCode.mockReturnValue("654321");
    mockCreateOtpCode.mockResolvedValue(undefined);
    mockLogOtpCode.mockReturnValue(undefined);
    mockSendOtpEmail.mockResolvedValue(undefined);
  });

  it("redirects when onboarding data is invalid", async () => {
    const response = await onboardPost(
      createRequest({
        email: "bad-email",
        name: "A",
        organizationName: "",
      }),
    );

    expect(getLocation(response).pathname).toBe("/onboard");
    expect(getLocation(response).searchParams.get("error")).toBe(
      "Enter valid onboarding details.",
    );
  });

  it("redirects when onboarding is rate limited", async () => {
    mockAssertRateLimit.mockRejectedValue(new Error("Try again later."));

    const response = await onboardPost(
      createRequest({
        email: "owner@example.com",
        name: "Owner",
        organizationName: "Acme",
      }),
    );

    expect(getLocation(response).searchParams.get("error")).toBe("Try again later.");
  });

  it("redirects when the user email already exists", async () => {
    mockGetUserByEmail.mockResolvedValue({ id: "user-1" });

    const response = await onboardPost(
      createRequest({
        email: "owner@example.com",
        name: "Owner",
        organizationName: "Acme",
      }),
    );

    expect(getLocation(response).searchParams.get("error")).toBe(
      "A user already exists for this email.",
    );
  });

  it("redirects when the organization name cannot produce a slug", async () => {
    const response = await onboardPost(
      createRequest({
        email: "owner@example.com",
        name: "Owner",
        organizationName: "!!!",
      }),
    );

    expect(getLocation(response).searchParams.get("error")).toBe(
      "Organization name must contain letters or numbers.",
    );
  });

  it("uses a randomized slug when the base slug already exists", async () => {
    const randomUuidSpy = jest
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("12345678-aaaa-bbbb-cccc-dddddddddddd");
    mockGetOrganizationBySlug.mockResolvedValue({
      id: "org-existing",
    });

    await onboardPost(
      createRequest({
        email: "owner@example.com",
        name: "Owner",
        organizationName: "Acme",
      }),
    );

    expect(mockCreateOrganization).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme-12345678",
      notificationEmail: "owner@example.com",
    });

    randomUuidSpy.mockRestore();
  });

  it("seeds 500 rows when the onboarding form requests seed data", async () => {
    await onboardPost(
      createRequest({
        email: "owner@example.com",
        name: "Owner",
        organizationName: "Acme",
        seedData: "on",
      }),
    );

    expect(mockSeedRandomRowsForOrganization).toHaveBeenCalledWith({
      organizationId: "org-1",
      count: 500,
    });
  });

  it("skips seed data when the checkbox is not selected", async () => {
    await onboardPost(
      createRequest({
        email: "owner@example.com",
        name: "Owner",
        organizationName: "Acme",
      }),
    );

    expect(mockSeedRandomRowsForOrganization).not.toHaveBeenCalled();
  });

  it("creates organization, user, and OTP then redirects to login", async () => {
    const response = await onboardPost(
      createRequest({
        email: "owner@example.com",
        name: "Owner",
        organizationName: "Acme",
      }),
    );

    expect(mockCreateOrganization).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme",
      notificationEmail: "owner@example.com",
    });
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: "owner@example.com",
      name: "Owner",
      organizationId: "org-1",
    });
    expect(mockCreateOtpCode).toHaveBeenCalledWith({
      code: "654321",
      email: "owner@example.com",
      userId: "user-1",
    });
    expect(mockLogOtpCode).toHaveBeenCalledWith({
      code: "654321",
      email: "owner@example.com",
    });
    expect(mockSendOtpEmail).toHaveBeenCalledWith({
      code: "654321",
      to: "owner@example.com",
    });
    expect(getLocation(response).pathname).toBe("/login");
    expect(getLocation(response).searchParams.get("email")).toBe("owner@example.com");
    expect(getLocation(response).searchParams.get("sent")).toBe("1");
    expect(getLocation(response).searchParams.get("success")).toBe(
      "Organization onboarded. Enter the OTP sent to your email.",
    );
  });
});
