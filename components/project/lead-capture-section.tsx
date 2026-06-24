"use client";

import { useState, useTransition } from "react";
import { createLeadAction } from "@/actions/leads";
import { SectionHeader } from "@/components/project/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LeadCaptureSectionProps {
  projectId: string;
  projectSlug: string;
  builderId?: string;
  locationId?: string;
  projectName: string;
}

export function LeadCaptureSection({
  projectId,
  projectSlug,
  builderId,
  locationId,
  projectName,
}: LeadCaptureSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setIsSuccess(false);

    startTransition(async () => {
      const result = await createLeadAction({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        query: String(formData.get("query") ?? "") || undefined,
        source: "project_page",
        projectId,
        projectSlug,
        builderId,
        locationId,
      });

      if (result.success) {
        setIsSuccess(true);
        setMessage("Thank you. Our team will contact you shortly.");
        return;
      }

      setMessage(result.error);
    });
  }

  return (
    <section id="enquire" className="section-padding">
      <div className="container-premium">
        <div className="grid gap-10 rounded-[2rem] border border-border bg-surface-dark p-8 text-white sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <SectionHeader
            eyebrow="Enquire"
            title={`Interested in ${projectName}?`}
            description="Share your details and a Prop AI advisor will reach out with availability, pricing, and site visit options."
            className="[&_h2]:text-white [&_p]:text-white/70"
          />

          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lead-name" className="text-white/80">
                Full name
              </Label>
              <Input
                id="lead-name"
                name="name"
                required
                minLength={2}
                placeholder="Your name"
                disabled={isPending || isSuccess}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lead-email" className="text-white/80">
                  Email
                </Label>
                <Input
                  id="lead-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  disabled={isPending || isSuccess}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-phone" className="text-white/80">
                  Phone
                </Label>
                <Input
                  id="lead-phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  disabled={isPending || isSuccess}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-query" className="text-white/80">
                Message (optional)
              </Label>
              <Textarea
                id="lead-query"
                name="query"
                rows={4}
                placeholder="Preferred configuration, budget, or questions"
                disabled={isPending || isSuccess}
              />
            </div>

            {message ? (
              <p
                className={
                  isSuccess ? "text-sm text-accent" : "text-sm text-red-300"
                }
                role="status"
              >
                {message}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={isPending || isSuccess}
            >
              {isPending ? "Submitting..." : "Request a callback"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
