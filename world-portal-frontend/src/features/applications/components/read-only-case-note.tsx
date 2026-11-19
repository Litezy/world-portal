import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { caseWorkflow } from "@/content/admin";

/**
 * Stands in for the desk actions (stage, price, payment, invite) on a role
 * that can't use them. Their routes need MANAGER or STAFF, so a partner saw
 * the buttons and got a 403 on every click.
 */
export function ReadOnlyCaseNote() {
  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-2 p-6">
      <CardTitle className="text-base">{caseWorkflow.title}</CardTitle>
      <CardDescription className="text-[12.5px]">
        {caseWorkflow.readOnly}
      </CardDescription>
    </Card>
  );
}
