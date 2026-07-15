"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { saveSkillQuestionAction } from "@/features/campaigns/wizard-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SkillEditor({
  campaignId,
  initialQuestion,
  initialOptions,
}: {
  campaignId: string;
  initialQuestion: string;
  initialOptions: string[];
}) {
  const [question, setQuestion] = React.useState(initialQuestion);
  const [options, setOptions] = React.useState<string[]>(
    initialOptions.length >= 3 ? initialOptions : ["", "", ""],
  );
  const [correctIndex, setCorrectIndex] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    const result = await saveSkillQuestionAction(campaignId, {
      question,
      options: options.map((label) => ({ label })),
      correctIndex,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Skill question saved");
  }

  return (
    <div className="space-y-4">
      <Alert variant="info">
        <AlertDescription>
          The correct answer is stored server-side only and is never sent to entrants&apos;
          browsers. Answers are validated on the server with a limit of 5 attempts.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="skill-question">Qualifying question</Label>
        <Input
          id="skill-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="A genuine question of skill, knowledge or judgement"
        />
      </div>

      <RadioGroup
        value={String(correctIndex)}
        onValueChange={(value) => setCorrectIndex(Number(value))}
        aria-label="Mark the correct option"
      >
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <RadioGroupItem
              id={`opt-correct-${index}`}
              value={String(index)}
              aria-label={`Option ${index + 1} is correct`}
            />
            <Input
              aria-label={`Option ${index + 1}`}
              value={option}
              onChange={(event) =>
                setOptions((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
              placeholder={`Option ${index + 1}`}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove option ${index + 1}`}
              disabled={options.length <= 3}
              onClick={() =>
                setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <Trash2 className="text-destructive" aria-hidden />
            </Button>
          </div>
        ))}
      </RadioGroup>
      <p className="text-xs text-muted-foreground">
        Select the radio button next to the correct option.
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={options.length >= 6}
          onClick={() => setOptions((current) => [...current, ""])}
        >
          <Plus aria-hidden /> Add option
        </Button>
        <Button size="sm" onClick={() => void save()} loading={saving}>
          Save question
        </Button>
      </div>
    </div>
  );
}
