import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import RootLayout, { metadata } from "@/app/layout";
import HomePage from "@/app/page";
import { LoginFormCard } from "@/components/login/loginFormCard";
import { OnboardingFormCard } from "@/components/onboard/onboardingFormCard";
import { TransferWorkspace } from "@/components/transfer/transferWorkspace";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe("App smoke tests", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockRedirect.mockReset();
  });

  it("renders the login email step", () => {
    render(
      <LoginFormCard
        email=""
        error=""
        isOtpStep={false}
        requestOtpPath="/api/auth/request-otp"
        success=""
        verifyOtpPath="/api/auth/verify-otp"
      />,
    );

    expect(screen.getByRole("heading", { name: /secure login/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send login code/i })).toBeInTheDocument();
  });

  it("renders the organization onboarding option", () => {
    render(<OnboardingFormCard actionPath="/api/onboard" error="" />);

    expect(screen.getByRole("heading", { name: /onboard organization/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create organization/i })).toBeInTheDocument();
  });

  it("renders the transfer workspace", () => {
    render(
      <TransferWorkspace
        addRowPath="/api/transfer/add-row"
        deleteRowPath="/api/transfer/delete-row"
        email="org-a@example.com"
        error=""
        logoutPath="/api/auth/logout"
        organizationName="Organization A"
        recipients={[{ id: "org-b", name: "Organization B" }]}
        rows={[
          {
            id: "row-1",
            organizationId: "org-a",
            fieldOne: "one",
            fieldTwo: "two",
            fieldThree: "three",
            sourceTransferId: null,
            deletedAt: null,
            createdAt: new Date(),
          },
        ]}
        success=""
        transferRowsPath="/api/transfer/submit"
      />,
    );

    expect(screen.getByRole("heading", { name: /transfer data/i })).toBeInTheDocument();
    expect(screen.getByText(/1 visible rows/i)).toBeInTheDocument();
  });

  it("redirects the home route to login", () => {
    HomePage();

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("keeps the root layout renderable and exports portal metadata", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <main data-testid="smoke-child">Smoke child</main>
      </RootLayout>,
    );

    expect(markup).toContain('<html lang="en"');
    expect(markup).toContain('data-testid="smoke-child"');
    expect(metadata).toMatchObject({
      title: "Secure Data Portal",
      description: "Modern account and data transfer interface",
    });
  });
});
