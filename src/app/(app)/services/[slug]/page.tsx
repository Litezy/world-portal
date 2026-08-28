import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { findServicePage, servicePages } from "@/content/services";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return servicePages.map((s) => ({ slug: s.slug }));
}

/** Only the three services above exist; anything else is a 404, not a render. */
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = findServicePage(slug);
  if (!service) return buildMetadata({ title: "Not found", noIndex: true });

  return buildMetadata({
    title: `${service.eyebrow} — coming soon`,
    description: service.intro,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = findServicePage(slug);
  if (!service) notFound();

  return (
    <>
      <Section spacing="md">
        <Container>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="size-4" />
            Back to World Portal
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14">
            <div>
              <Badge variant="eyebrow" dot className="mb-4">
                {service.eyebrow}
              </Badge>
              <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance text-ink-900 sm:text-[42px]">
                {service.title}{" "}
                <span className="heading-serif font-normal">{service.titleAccent}</span>
              </h1>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                {service.intro}
              </p>

              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/12 px-3.5 py-1.5 text-[12.5px] font-medium text-ink-900">
                <Sparkles className="size-3.5 text-primary" />
                Not open yet — passports and visas are live today
              </p>
            </div>

            <ParallaxImage
              src={service.image.src}
              alt={service.image.alt}
              fill
              sizes="(max-width: 1024px) 92vw, 520px"
              strength={12}
              className="aspect-[4/3] rounded-[1.75rem]"
            />
          </div>
        </Container>
      </Section>

      <Section spacing="sm" tone="muted">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-ink-900">
                How it will work
              </h2>
              <ol className="mt-6 grid gap-5">
                {service.steps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[15px] font-semibold tracking-tight text-ink-900">
                        {step.title}
                      </p>
                      <p className="mt-1 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-5">
              <Card variant="solid" radius="2xl" padding="lg" className="gap-0">
                <h2 className="text-[17px] font-semibold tracking-tight text-ink-900">
                  What is included
                </h2>
                <ul className="mt-4 grid gap-3">
                  {service.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="text-[13.5px] leading-relaxed text-ink-800">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card variant="solid" radius="2xl" padding="lg" className="gap-0">
                <h2 className="text-[17px] font-semibold tracking-tight text-ink-900">
                  {service.meanwhile.title}
                </h2>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {service.meanwhile.body}
                </p>
                <Button asChild variant="primary" size="md" className="mt-5 self-start">
                  <Link href={service.meanwhile.href}>
                    {service.meanwhile.cta}
                    <ArrowRight />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
