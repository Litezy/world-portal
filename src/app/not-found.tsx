import Link from "next/link";

import { Compass, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-7" />
      </div>
      <div className="space-y-2">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="font-display text-2xl font-semibold">
          This page took a different route
        </h1>
        <p className="max-w-md text-sm text-pretty text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild leftIcon={<Home />}>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>
    </div>
  );
}
