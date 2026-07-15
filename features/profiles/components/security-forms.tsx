"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/schema";
import { resetPasswordAction } from "@/features/auth/actions";
import { signOutAllSessionsAction } from "@/features/profiles/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ChangePasswordCard() {
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    const result = await resetPasswordAction(values);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Password updated");
    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <Button type="submit" loading={form.formState.isSubmitting}>
                Update password
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function SessionsCard() {
  async function revoke() {
    const result = await signOutAllSessionsAction();
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Signed out on all other devices");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>
          If you signed in on a shared or lost device, revoke every session except this one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => void revoke()}>
          Sign out other devices
        </Button>
      </CardContent>
    </Card>
  );
}
