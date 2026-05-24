import { CircleCheckBig, Send } from "lucide-react";

import type { DataRow } from "@/db/schema";
import { SecurePortalShell } from "@/components/portal/securePortalShell";
import { DeleteRowSubmitButton } from "@/components/transfer/deleteRowSubmitButton";
import { Button } from "@/components/ui/button";

type TransferWorkspaceProps = {
  addRowPath: string;
  deleteRowPath: string;
  email: string;
  error: string;
  logoutPath: string;
  organizationName: string;
  recipients: Array<{
    id: string;
    name: string;
  }>;
  rows: DataRow[];
  success: string;
  transferRowsPath: string;
};

export function TransferWorkspace({
  addRowPath,
  deleteRowPath,
  email,
  error,
  logoutPath,
  organizationName,
  recipients,
  rows,
  success,
  transferRowsPath,
}: TransferWorkspaceProps) {
  return (
    <SecurePortalShell
      email={email}
      logoutPath={logoutPath}
      organizationName={organizationName}
    >
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

        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            role="status"
            className="rounded-2xl border border-[#384b85] bg-[rgb(11_18_40_/_55%)] px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <CircleCheckBig className="mt-0.5 size-5 text-accent" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Transfer complete</p>
                <p className="text-sm text-muted-foreground">{success}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{rows.length} visible rows</p>
          <form action={addRowPath} method="post">
            <Button type="submit" variant="ghost" className="h-10 rounded-xl px-4">
              Add Row
            </Button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[1fr_1fr_1fr_96px] gap-3 border-b border-border bg-white/5 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
            <span>Field One</span>
            <span>Field Two</span>
            <span>Field Three</span>
            <span className="text-right">Action</span>
          </div>
          <div className="max-h-[420px] overflow-auto">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_1fr_1fr_96px] gap-3 border-b border-border/70 px-4 py-3 text-sm last:border-b-0"
              >
                <span className="min-w-0 truncate">{row.fieldOne}</span>
                <span className="min-w-0 truncate">{row.fieldTwo}</span>
                <span className="min-w-0 truncate">{row.fieldThree}</span>
                <form action={deleteRowPath} method="post" className="text-right">
                  <input type="hidden" name="rowId" value={row.id} />
                  <DeleteRowSubmitButton />
                </form>
              </div>
            ))}
          </div>
        </div>

        <form action={transferRowsPath} method="post" className="grid gap-3">
          <label
            htmlFor="recipientOrganizationId"
            className="text-sm font-medium text-muted-foreground"
          >
            Recipient Organization
          </label>
          <select
            id="recipientOrganizationId"
            name="recipientOrganizationId"
            required
            className="h-12 rounded-xl border border-input bg-secondary px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring"
            defaultValue=""
          >
            <option value="" disabled>
              Select organization
            </option>
            {recipients.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.name}
              </option>
            ))}
          </select>

          <label htmlFor="message" className="text-sm font-medium text-muted-foreground">
            Transfer Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            maxLength={500}
            className="min-h-28 rounded-xl border border-input bg-secondary px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring"
            placeholder="Add a message for the recipient organization"
          />
          <Button
            type="submit"
            className="h-12 rounded-xl px-5 text-sm font-semibold"
          >
            <Send className="size-4" />
            Transfer Data
          </Button>
        </form>
      </div>
    </SecurePortalShell>
  );
}
