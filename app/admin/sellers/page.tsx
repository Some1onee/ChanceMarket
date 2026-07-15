import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SellerControls } from "@/features/admin/components/controls";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Sellers", robots: { index: false } };

export default async function AdminSellersPage() {
  const supabase = await getSupabaseServerClient();
  const { data: sellers } = await supabase
    .from("seller_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Sellers</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Seller</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>KYB</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(sellers ?? []).map((seller) => (
            <TableRow key={seller.id}>
              <TableCell>
                <span className="font-medium">{seller.public_name}</span>
                {seller.business_name ? (
                  <span className="block text-xs text-muted-foreground">
                    {seller.business_name}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="capitalize">{seller.entity_type}</TableCell>
              <TableCell>{seller.country_code}</TableCell>
              <TableCell>
                <Badge
                  variant={seller.kyb_status === "verified" ? "success" : "warning"}
                  className="capitalize"
                >
                  {seller.kyb_status.replaceAll("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    seller.status === "approved"
                      ? "success"
                      : seller.status === "pending"
                        ? "warning"
                        : "destructive"
                  }
                  className="capitalize"
                >
                  {seller.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <SellerControls sellerId={seller.id} status={seller.status} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
