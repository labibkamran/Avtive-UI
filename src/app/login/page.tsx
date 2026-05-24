import { getSession } from "@/lib/auth/session";
import { LoginFormCard } from "@/components/login/loginFormCard";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/transfer");
  }

  const params = (await searchParams) ?? {};
  const email = getSearchValue(params.email) ?? "";
  const error = getSearchValue(params.error) ?? "";
  const success = getSearchValue(params.success) ?? "";
  const sent = getSearchValue(params.sent) === "1";

  return (
    <LoginFormCard
      email={email}
      error={error}
      isOtpStep={sent}
      requestOtpPath="/api/auth/request-otp"
      success={success}
      verifyOtpPath="/api/auth/verify-otp"
    />
  );
}
