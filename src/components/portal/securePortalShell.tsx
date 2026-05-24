import { LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type SecurePortalShellProps = {
  email: string;
  children: React.ReactNode;
  onLogout: () => void;
};

export function SecurePortalShell({
  email,
  children,
  onLogout,
}: SecurePortalShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1050px] flex-col gap-4 px-4 py-5 sm:px-6 sm:py-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#455790] bg-white/5 px-3 py-1 text-xs text-[#c6d1f4]">
            <ShieldCheck className="size-3.5" />
            Secure Workspace
          </div>
          <div>
            <p className="text-[21px] font-semibold text-foreground">Secure Data Portal</p>
            <p className="text-sm text-muted-foreground">Signed in as {email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          className="h-11 rounded-xl border border-border bg-transparent px-4 text-foreground hover:bg-white/5"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </header>

      <main className="rounded-[18px] border border-border bg-[linear-gradient(180deg,_#1b2650,_#141f43)] p-6 shadow-[0_20px_50px_rgb(0_0_0_/_28%)] sm:p-8">
        {children}
      </main>
    </div>
  );
}
