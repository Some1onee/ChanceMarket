"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { signUpSchema, type SignUpInput } from "@/features/auth/schema";
import { signUpAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Dictionary } from "@/lib/localization/dictionaries";

export function SignUpForm({ t }: { t: Dictionary["auth"]["signUp"] }) {
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      acceptTerms: false as unknown as true,
      marketingOptIn: false,
    },
  });

  async function onSubmit(values: SignUpInput) {
    const result = await signUpAction(values);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setSubmittedEmail(result.data.email);
  }

  if (submittedEmail) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MailCheck aria-hidden />
        </div>
        <h1 className="text-xl font-semibold">{t.inboxTitle}</h1>
        <p className="text-sm text-muted-foreground">
          {t.inboxBodyPrefix} <strong>{submittedEmail}</strong>
          {t.inboxBodySuffix}
        </p>
        <Button variant="outline" asChild>
          <Link href="/sign-in">{t.backToSignIn}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.alreadyMember}{" "}
          <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
            {t.signIn}
          </Link>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.displayName}</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="nickname"
                    placeholder={t.displayNamePlaceholder}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.email}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.password}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>{t.passwordHint}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2.5">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="leading-snug font-normal">
                    {t.acceptTermsPrefix}{" "}
                    <Link href="/terms" className="underline underline-offset-2" target="_blank">
                      {t.termsOfService}
                    </Link>
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="marketingOptIn"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2.5">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="leading-snug font-normal text-muted-foreground">
                    {t.marketingOptIn}
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            {t.submit}
          </Button>
        </form>
      </Form>
    </div>
  );
}
