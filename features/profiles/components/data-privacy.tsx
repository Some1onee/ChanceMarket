"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { closeAccountAction, exportMyDataAction } from "@/features/profiles/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DataPrivacyActions() {
  const router = useRouter();
  const [exporting, setExporting] = React.useState(false);

  async function exportData() {
    setExporting(true);
    const result = await exportMyDataAction();
    setExporting(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chancemarket-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  }

  async function closeAccount() {
    const result = await closeAccountAction();
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export your data</CardTitle>
          <CardDescription>
            Download a JSON file with your profile, entries, orders, favourites and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void exportData()} loading={exporting}>
            <Download aria-hidden /> Download my data
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Close account</CardTitle>
          <CardDescription>
            Closing your account signs you out everywhere and disables all participation. Records we
            must keep for financial and legal reasons (orders, payments, draw results) are retained
            for the statutory period, then erased.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Close my account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This takes effect immediately. Any live entries remain valid for their draws; if
                  you win, we will contact you at your account email.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my account</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => void closeAccount()}>
                  Close account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
