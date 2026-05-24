import { Building2, KeyRound, Mail, Shield } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormCardProps = {
  requestOtpPath: string;
  email: string;
  error: string;
  isOtpStep: boolean;
  success: string;
  verifyOtpPath: string;
};

export function LoginFormCard({
  requestOtpPath,
  email,
  error,
  isOtpStep,
  success,
  verifyOtpPath,
}: LoginFormCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <Card className="w-full max-w-[620px] bg-[linear-gradient(180deg,_#1c2853,_var(--card))]">
        <CardHeader className="pb-5">
          <div className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border border-[#455790] bg-white/5 px-3 py-1 text-xs text-[#c6d1f4]">
            <Shield className="size-3.5" />
            Secure Workspace
          </div>
          <CardTitle className="text-[34px] leading-[1.15]">Secure Login</CardTitle>
          <CardDescription className="text-base">
            {isOtpStep
              ? "Enter the code sent to your email to continue."
              : "Enter your organization email to receive a login code."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-xl border border-[#384b85] bg-[rgb(11_18_40_/_55%)] px-4 py-3 text-sm text-foreground">
              {success}
            </div>
          ) : null}

          {isOtpStep ? (
            <form className="grid gap-4" action={verifyOtpPath} method="post">
              <input type="hidden" name="email" value={email} />
              <div>
                <Label htmlFor="code">Verification Code</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="code"
                    name="code"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    placeholder="123456"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="mt-1 h-12 rounded-xl text-sm font-semibold">
                Verify and Continue
              </Button>
            </form>
          ) : (
            <form className="grid gap-4" action={requestOtpPath} method="post">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={email}
                    placeholder="name@company.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="mt-1 h-12 rounded-xl text-sm font-semibold">
                Send Login Code
              </Button>
            </form>
          )}

          {!isOtpStep ? (
            <div className="mt-5 space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                New organization? Start with onboarding.
              </p>
              <Button
                asChild
                variant="secondary"
                className="h-12 w-full rounded-xl border border-[#455790] bg-white/8 text-sm font-semibold text-foreground hover:bg-white/12"
              >
                <Link href="/onboard">
                  <Building2 className="size-4" />
                  Onboard Organization
                </Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
