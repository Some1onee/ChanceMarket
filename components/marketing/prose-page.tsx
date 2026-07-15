import type { Metadata } from "next";
import { Section } from "@/components/marketing/section";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type ProseSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function buildMetadata(title: string, description: string): Metadata {
  return { title, description };
}

/**
 * Shared layout for institutional/legal pages. `legalTemplate` marks the
 * content as a template pending review by qualified local counsel.
 */
export function ProsePage({
  eyebrow,
  title,
  intro,
  sections,
  legalTemplate = false,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: ProseSection[];
  legalTemplate?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Section eyebrow={eyebrow} title={title} description={intro} className="max-w-3xl">
      {legalTemplate ? (
        <Alert variant="warning" className="mb-8">
          <AlertDescription>
            <strong>Template notice:</strong> this document is a working template pending review and
            approval by qualified counsel in each launch territory. It is not legal advice and must
            not be treated as final.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <section key={index} aria-labelledby={`section-${index}`}>
            <h2 id={`section-${index}`} className="mb-2 text-lg font-semibold">
              {section.heading}
            </h2>
            {section.paragraphs?.map((paragraph, pIndex) => (
              <p key={pIndex} className="mb-3 text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {section.bullets.map((bullet, bIndex) => (
                  <li key={bIndex}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
      {children}
    </Section>
  );
}
