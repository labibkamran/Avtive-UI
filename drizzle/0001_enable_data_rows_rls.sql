ALTER TABLE "data_rows" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "data_rows" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "data_rows_org_isolation"
ON "data_rows"
FOR ALL
USING (
  "organization_id" = ANY (
    string_to_array(current_setting('app.allowed_organization_ids', true), ',')::uuid[]
  )
)
WITH CHECK (
  "organization_id" = ANY (
    string_to_array(current_setting('app.allowed_organization_ids', true), ',')::uuid[]
  )
);
