import Image from "next/image";

import { Logo } from "@/components/common/logo";
import { agencyAuth, agencySection } from "@/content/agency";

export default function AgencyAuthLayout({ children }: LayoutProps<"/agency">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative isolate hidden overflow-hidden bg-ink-950 lg:block">
        <Image
          src={agencyAuth.image.src}
          alt={agencyAuth.image.alt}
          fill
          priority
          sizes="55vw"
          className="-z-20 object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(6,9,14,0.55)_0%,rgba(6,9,14,0.15)_45%,rgba(6,9,14,0.7)_100%)]"
        />
        <div className="flex h-full flex-col justify-between p-10">
          <Logo href="/" />
          <div className="max-w-md">
            <p className="text-[15px] leading-relaxed text-white/80">
              {agencySection.body}
            </p>
            <p className="mt-3 text-[13px] text-white/60">{agencySection.note}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-ink-50 px-6 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo href="/" tone="dark" />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
    </div>
  );
}
