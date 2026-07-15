"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { sellerOnboardingSchema, type SellerOnboardingInput } from "@/features/sellers/schema";
import { applyAsSellerAction, startSellerVerificationAction } from "@/features/sellers/actions";
import { COUNTRIES } from "@/lib/localization/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function SellerOnboardingForm() {
  const router = useRouter();
  const form = useForm<SellerOnboardingInput>({
    resolver: zodResolver(sellerOnboardingSchema),
    defaultValues: {
      publicName: "",
      publicBio: "",
      entityType: "individual",
      businessName: "",
      countryCode: "GB",
      acceptSellerTerms: false as unknown as true,
    },
  });

  const entityType = form.watch("entityType");

  async function onSubmit(values: SellerOnboardingInput) {
    const result = await applyAsSellerAction(values);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    // Kick off KYC/KYB with the configured provider (mock auto-verifies in dev).
    const verification = await startSellerVerificationAction();
    if (verification.ok) {
      toast.success("Application submitted — verification started.");
    } else {
      toast.success("Application submitted. Verification will follow.");
    }
    router.push("/seller");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="publicName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Public seller name</FormLabel>
              <FormControl>
                <Input placeholder="Shown on your campaigns" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="entityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>You are selling as</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="individual">An individual</SelectItem>
                    <SelectItem value="company">A company</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="countryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country of establishment</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {entityType === "company" ? (
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registered company name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="publicBio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About you (public, optional)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="acceptSellerTerms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2.5">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="leading-snug font-normal">
                  I accept the{" "}
                  <a
                    href="/seller-standards"
                    target="_blank"
                    className="underline underline-offset-2"
                  >
                    seller standards
                  </a>{" "}
                  and confirm I own (or am authorised to offer) every prize I list, with documentary
                  proof available on request.
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
          Apply to sell
        </Button>
        <p className="text-xs text-muted-foreground">
          Identity (KYC/KYB) verification follows, then a manual review by our team. You can save
          draft campaigns while your application is pending, but nothing goes live before approval.
        </p>
      </form>
    </Form>
  );
}
