import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import RootLayout, { metadata } from "@/app/layout";
import { DemoSessionProvider } from "@/app/providers/demoSessionProvider";
import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";

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

  it("renders the login page and submits to the transfer route", () => {
    render(
      <DemoSessionProvider>
        <LoginPage />
      </DemoSessionProvider>,
    );

    expect(screen.getByRole("heading", { name: /secure login/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "name@company.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "topsecret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login and continue/i }));

    expect(mockPush).toHaveBeenCalledWith("/transfer");
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
