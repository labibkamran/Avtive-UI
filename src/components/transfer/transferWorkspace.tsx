import { CircleCheckBig, Send } from "lucide-react";

import { SecurePortalShell } from "@/components/portal/securePortalShell";
import { Button } from "@/components/ui/button";

type TransferWorkspaceProps = {
  email: string;
  message: string;
  onLogout: () => void;
  onTransfer: () => void;
};

export function TransferWorkspace({
  email,
  message,
  onLogout,
  onTransfer,
}: TransferWorkspaceProps) {
  return (
    <SecurePortalShell email={email} onLogout={onLogout}>
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#455790] bg-white/5 px-3 py-1 text-xs text-[#c6d1f4]">
            <Send className="size-3.5" />
            Transfer Center
          </div>
          <h1 className="text-[28px] font-semibold text-foreground">Transfer Data</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Move your secured records into the protected workspace using the same
            interface and tone as the reference portal.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            className="h-12 rounded-xl px-5 text-sm font-semibold"
            onClick={onTransfer}
          >
            <Send className="size-4" />
            Transfer Data
          </Button>
        </div>

        {message ? (
          <div
            role="status"
            className="rounded-2xl border border-[#384b85] bg-[rgb(11_18_40_/_55%)] px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <CircleCheckBig className="mt-0.5 size-5 text-accent" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Transfer complete</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SecurePortalShell>
  );
}
