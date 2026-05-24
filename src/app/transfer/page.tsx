import { requireSession } from "@/lib/auth/session";
import { getVisibleRowsForOrganization } from "@/lib/dataRows";
import { getTransferRecipientOrganizations } from "@/lib/organizations";
import { TransferWorkspace } from "@/components/transfer/transferWorkspace";

type TransferPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TransferPage({ searchParams }: TransferPageProps) {
  const session = await requireSession();
  const rows = await getVisibleRowsForOrganization(session.organizationId);
  const recipients = await getTransferRecipientOrganizations(session.organizationId);
  const params = (await searchParams) ?? {};

  return (
    <TransferWorkspace
      addRowPath="/api/transfer/add-row"
      deleteRowPath="/api/transfer/delete-row"
      email={session.email}
      error={getSearchValue(params.error) ?? ""}
      logoutPath="/api/auth/logout"
      organizationName={session.organizationName}
      recipients={recipients}
      rows={rows}
      success={getSearchValue(params.success) ?? ""}
      transferRowsPath="/api/transfer/submit"
    />
  );
}
