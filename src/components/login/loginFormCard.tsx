import { LockKeyhole, Mail, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormCardProps = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function LoginFormCard({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
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
            Sign in to continue to your secure workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="name@company.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="Enter your password"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="mt-1 h-12 rounded-xl text-sm font-semibold">
              Login and Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
