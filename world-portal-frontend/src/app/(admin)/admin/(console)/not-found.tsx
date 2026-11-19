import Link from "next/link";

import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { consoleNotFound as copy } from "@/content/admin";

/** Unknown console addresses stay inside the console shell. */
export default function ConsoleNotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title={copy.title}
      description={copy.body}
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">{copy.home}</Link>
        </Button>
      }
    />
  );
}
