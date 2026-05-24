import { POST as addRowPost } from "@/app/api/transfer/add-row/route";
import { POST as deleteRowPost } from "@/app/api/transfer/delete-row/route";
import { POST as submitTransferPost } from "@/app/api/transfer/submit/route";

const mockRevalidatePath = jest.fn();
const mockGetAuthenticatedUser = jest.fn();
const mockAddUnlistedRow = jest.fn();
const mockCopyVisibleRowsToOrganization = jest.fn();
const mockGetVisibleRowsForOrganization = jest.fn();
const mockSoftDeleteRow = jest.fn();
const mockSendTransferNotificationEmail = jest.fn();
const mockGetTransferRecipientOrganizations = jest.fn();
const mockAssertRateLimit = jest.fn();
const mockCreateTransfer = jest.fn();

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

jest.mock("@/lib/dataRows", () => ({
  addUnlistedRow: (...args: unknown[]) => mockAddUnlistedRow(...args),
  copyVisibleRowsToOrganization: (...args: unknown[]) => mockCopyVisibleRowsToOrganization(...args),
  getVisibleRowsForOrganization: (...args: unknown[]) => mockGetVisibleRowsForOrganization(...args),
  softDeleteRow: (...args: unknown[]) => mockSoftDeleteRow(...args),
}));

jest.mock("@/lib/email", () => ({
  sendTransferNotificationEmail: (...args: unknown[]) => mockSendTransferNotificationEmail(...args),
}));

jest.mock("@/lib/organizations", () => ({
  getTransferRecipientOrganizations: (...args: unknown[]) =>
    mockGetTransferRecipientOrganizations(...args),
}));

jest.mock("@/lib/rateLimit", () => ({
  assertRateLimit: (...args: unknown[]) => mockAssertRateLimit(...args),
}));

jest.mock("@/lib/transfers", () => ({
  createTransfer: (...args: unknown[]) => mockCreateTransfer(...args),
}));

function createRequest(pathname: string, values?: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values ?? {})) {
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

describe("transfer routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthenticatedUser.mockResolvedValue({
      id: "user-1",
      email: "owner@example.com",
      name: "Owner",
      organizationId: "org-1",
      organizationName: "Acme",
      organizationSlug: "acme",
    });
    mockAssertRateLimit.mockResolvedValue(undefined);
    mockGetTransferRecipientOrganizations.mockResolvedValue([
      {
        id: "org-2",
        name: "Beta",
        notificationEmail: "beta@example.com",
      },
    ]);
    mockGetVisibleRowsForOrganization.mockResolvedValue([
      {
        id: "row-1",
      },
    ]);
    mockCreateTransfer.mockResolvedValue({
      id: "transfer-1",
    });
    mockAddUnlistedRow.mockResolvedValue(undefined);
    mockSoftDeleteRow.mockResolvedValue(undefined);
    mockCopyVisibleRowsToOrganization.mockResolvedValue(undefined);
    mockSendTransferNotificationEmail.mockResolvedValue(undefined);
  });

  it("redirects unauthenticated add-row requests to login", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const response = await addRowPost(createRequest("/api/transfer/add-row"));

    expect(response.status).toBe(303);
    expect(getLocation(response).pathname).toBe("/login");
  });

  it("adds an unlisted row for the active organization", async () => {
    const response = await addRowPost(createRequest("/api/transfer/add-row"));

    expect(mockAddUnlistedRow).toHaveBeenCalledWith("org-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transfer");
    expect(getLocation(response).pathname).toBe("/transfer");
  });

  it("ignores delete requests with a missing row id", async () => {
    const response = await deleteRowPost(createRequest("/api/transfer/delete-row"));

    expect(mockSoftDeleteRow).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(getLocation(response).pathname).toBe("/transfer");
  });

  it("deletes a valid row and revalidates the transfer page", async () => {
    const response = await deleteRowPost(
      createRequest("/api/transfer/delete-row", {
        rowId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(mockSoftDeleteRow).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      "org-1",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transfer");
    expect(getLocation(response).pathname).toBe("/transfer");
  });

  it("redirects when the transfer payload is invalid", async () => {
    const response = await submitTransferPost(
      createRequest("/api/transfer/submit", {
        message: "",
        recipientOrganizationId: "",
      }),
    );

    expect(getLocation(response).pathname).toBe("/transfer");
    expect(getLocation(response).searchParams.get("error")).toBe(
      "Select a recipient and enter a transfer message.",
    );
  });

  it("redirects when transfer rate limiting is triggered", async () => {
    mockAssertRateLimit.mockRejectedValue(new Error("Too many transfers."));

    const response = await submitTransferPost(
      createRequest("/api/transfer/submit", {
        message: "Hello",
        recipientOrganizationId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(getLocation(response).searchParams.get("error")).toBe("Too many transfers.");
  });

  it("redirects when the selected recipient is not available", async () => {
    mockGetTransferRecipientOrganizations.mockResolvedValue([]);

    const response = await submitTransferPost(
      createRequest("/api/transfer/submit", {
        message: "Hello",
        recipientOrganizationId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(getLocation(response).searchParams.get("error")).toBe(
      "Select a valid recipient organization.",
    );
  });

  it("redirects when there are no rows available to transfer", async () => {
    mockGetTransferRecipientOrganizations.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Beta",
        notificationEmail: "beta@example.com",
      },
    ]);
    mockGetVisibleRowsForOrganization.mockResolvedValue([]);

    const response = await submitTransferPost(
      createRequest("/api/transfer/submit", {
        message: "Hello",
        recipientOrganizationId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(getLocation(response).searchParams.get("error")).toBe(
      "There are no rows to transfer.",
    );
  });

  it("creates a transfer, copies rows, and sends a notification", async () => {
    mockGetTransferRecipientOrganizations.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Beta",
        notificationEmail: "beta@example.com",
      },
    ]);
    mockGetVisibleRowsForOrganization.mockResolvedValue([{ id: "row-1" }, { id: "row-2" }]);

    const response = await submitTransferPost(
      createRequest("/api/transfer/submit", {
        message: "Take this dataset.",
        recipientOrganizationId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    );

    expect(mockCreateTransfer).toHaveBeenCalledWith({
      createdByUserId: "user-1",
      fromOrganizationId: "org-1",
      toOrganizationId: "550e8400-e29b-41d4-a716-446655440000",
      message: "Take this dataset.",
      rowCount: 2,
    });
    expect(mockCopyVisibleRowsToOrganization).toHaveBeenCalledWith({
      fromOrganizationId: "org-1",
      toOrganizationId: "550e8400-e29b-41d4-a716-446655440000",
      transferId: "transfer-1",
    });
    expect(mockSendTransferNotificationEmail).toHaveBeenCalledWith({
      to: "beta@example.com",
      senderOrgName: "Acme",
      message: "Take this dataset.",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/transfer");
    expect(getLocation(response).searchParams.get("success")).toBe(
      "Data transferred successfully.",
    );
  });
});
