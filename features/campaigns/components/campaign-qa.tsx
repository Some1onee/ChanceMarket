"use client";

import * as React from "react";
import { toast } from "sonner";
import { MessageCircleQuestion } from "lucide-react";
import type { CampaignQuestionRow } from "@/lib/supabase/database.types";
import { askQuestionAction } from "@/features/campaigns/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CampaignQA({
  campaignId,
  questions,
  signedIn,
}: {
  campaignId: string;
  questions: CampaignQuestionRow[];
  signedIn: boolean;
}) {
  const [question, setQuestion] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function submit() {
    setSending(true);
    const result = await askQuestionAction({ campaignId, question });
    setSending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setQuestion("");
    toast.success("Question sent — the seller's answer may be published here.");
  }

  return (
    <section aria-labelledby="qa-heading" className="space-y-4">
      <h2 id="qa-heading" className="text-lg font-semibold">
        Questions &amp; answers
      </h2>

      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published answers yet. Ask the first question.
        </p>
      ) : (
        <ul className="space-y-4">
          {questions.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-card p-4">
              <p className="flex items-start gap-2 text-sm font-medium">
                <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {item.question}
              </p>
              {item.answer ? (
                <p className="mt-2 pl-6 text-sm text-muted-foreground">{item.answer}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {signedIn ? (
        <div className="space-y-2 rounded-lg border border-border bg-subtle p-4">
          <Label htmlFor="ask-question">Ask the seller</Label>
          <Textarea
            id="ask-question"
            rows={2}
            maxLength={500}
            placeholder="Questions and published answers are visible to everyone."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <Button size="sm" onClick={() => void submit()} loading={sending} disabled={question.trim().length < 5}>
            Send question
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <a href="/sign-in" className="text-primary underline underline-offset-2">
            Sign in
          </a>{" "}
          to ask the seller a question.
        </p>
      )}
    </section>
  );
}
