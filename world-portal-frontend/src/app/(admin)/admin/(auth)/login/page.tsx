import { Suspense } from "react";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { AdminLogo } from "@/components/admin/admin-palette";
import { login } from "@/content/admin";
import { LoginForm } from "@/features/auth/components/login-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Sign in", noIndex: true });

export default function LoginPage() {
  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-lg border border-border/80 bg-card p-7 shadow-2xl shadow-foreground/10 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <AdminLogo href="/" markClassName="h-8 sm:h-8" />
          <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
            {login.title}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">{login.body}</p>
        </div>

        <div className="mt-7">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <Link
        href="/"
        className="mx-auto mt-6 flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" />
        {login.backToSite}
      </Link>
    </div>
  );
}
