import { redirect } from "next/navigation";

import { OnboardingFormCard } from "@/components/onboard/onboardingFormCard";
import { getSession } from "@/lib/auth/session";

type OnboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardPage({ searchParams }: OnboardPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/transfer");
  }

  const params = (await searchParams) ?? {};

  return (
    <OnboardingFormCard
      actionPath="/api/onboard"
      error={getSearchValue(params.error) ?? ""}
    />
  );
}
