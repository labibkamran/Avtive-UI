import Link from "next/link";
import { Building2, Mail, Shield, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OnboardingFormCardProps = {
  actionPath: string;
  error: string;
};

export function OnboardingFormCard({ actionPath, error }: OnboardingFormCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <Card className="w-full max-w-[680px] bg-[linear-gradient(180deg,_#1c2853,_var(--card))]">
        <CardHeader className="pb-5">
          <div className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border border-[#455790] bg-white/5 px-3 py-1 text-xs text-[#c6d1f4]">
            <Shield className="size-3.5" />
            Organization Setup
          </div>
          <CardTitle className="text-[34px] leading-[1.15]">Onboard Organization</CardTitle>
          <CardDescription className="text-base">
            Create an organization, seed optional random data, and verify by email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <form className="grid gap-4" action={actionPath} method="post">
            <div>
              <Label htmlFor="organizationName">Organization Name</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="organizationName"
                  name="organizationName"
                  placeholder="Acme Security"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">Your Name</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Jane Admin"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Organization Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@company.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                name="seedData"
                className="mt-1 size-4 accent-[var(--primary)]"
              />
              <span>
                Seed this organization with 500 random rows after onboarding.
              </span>
            </label>

            <Button type="submit" className="mt-1 h-12 rounded-xl text-sm font-semibold">
              Create Organization
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already onboarded?{" "}
            <Link href="/login" className="font-medium text-primary">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
