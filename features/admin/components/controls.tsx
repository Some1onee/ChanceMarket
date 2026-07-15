"use client";

import {
  closeCampaignNowAction,
  decideSellerAction,
  moderateCampaignAction,
  refundPaymentAction,
  rerollDrawAction,
  resolveDisputeAction,
  resolveReportAction,
  setAccountStatusAction,
  setUserRoleAction,
  toggleJurisdictionAction,
  verifyWinnerAction,
} from "@/features/admin/actions";
import { JustifiedAction } from "@/features/admin/components/justified-action";

export function ModerationControls({ caseId, campaignId }: { caseId: string; campaignId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <JustifiedAction
        triggerLabel="Approve"
        triggerVariant="primary"
        title="Approve campaign"
        description="The campaign goes live immediately (or on its scheduled start)."
        confirmLabel="Approve & publish"
        onConfirm={(reason) => moderateCampaignAction({ caseId, campaignId, decision: "approved", reason })}
      />
      <JustifiedAction
        triggerLabel="Request changes"
        title="Request changes"
        description="The seller is notified and can edit + resubmit the draft."
        confirmLabel="Send back to seller"
        onConfirm={(reason) =>
          moderateCampaignAction({ caseId, campaignId, decision: "changes_requested", reason })
        }
      />
      <JustifiedAction
        triggerLabel="Reject"
        destructive
        title="Reject campaign"
        description="Permanent rejection; the seller is notified with your reason."
        confirmLabel="Reject campaign"
        onConfirm={(reason) => moderateCampaignAction({ caseId, campaignId, decision: "rejected", reason })}
      />
    </div>
  );
}

export function SellerControls({ sellerId, status }: { sellerId: string; status: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" ? (
        <JustifiedAction
          triggerLabel="Approve"
          triggerVariant="primary"
          title="Approve seller"
          confirmLabel="Approve seller"
          onConfirm={(reason) => decideSellerAction({ sellerId, decision: "approved", reason })}
        />
      ) : null}
      {status === "approved" ? (
        <JustifiedAction
          triggerLabel="Suspend"
          destructive
          title="Suspend seller"
          description="Live campaigns stay visible but the seller cannot create new ones."
          confirmLabel="Suspend seller"
          onConfirm={(reason) => decideSellerAction({ sellerId, decision: "suspended", reason })}
        />
      ) : (
        <JustifiedAction
          triggerLabel="Reject"
          destructive
          title="Reject application"
          confirmLabel="Reject application"
          onConfirm={(reason) => decideSellerAction({ sellerId, decision: "rejected", reason })}
        />
      )}
    </div>
  );
}

export function CloseCampaignControl({ campaignId }: { campaignId: string }) {
  return (
    <JustifiedAction
      triggerLabel="Close & draw now"
      title="Close entries and run the draw"
      description="Closes entries, cancels unpaid orders, freezes the snapshot and selects the winner. Cannot be undone."
      confirmLabel="Run close pipeline"
      destructive
      onConfirm={(reason) => closeCampaignNowAction({ campaignId, reason })}
    />
  );
}

export function WinnerControls({ drawId }: { drawId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <JustifiedAction
        triggerLabel="Verify winner"
        triggerVariant="primary"
        title="Confirm winner eligibility"
        description="Records the verification and opens prize fulfilment."
        confirmLabel="Winner verified"
        onConfirm={(notes) => verifyWinnerAction({ drawId, outcome: "verified", notes })}
      />
      <JustifiedAction
        triggerLabel="Fail verification"
        destructive
        title="Fail winner verification"
        description="Use the re-draw procedure afterwards, per the official rules."
        confirmLabel="Mark as failed"
        onConfirm={(notes) => verifyWinnerAction({ drawId, outcome: "failed", notes })}
      />
      <JustifiedAction
        triggerLabel="Re-draw"
        destructive
        title="Controlled re-draw"
        description="Requires a second admin (different person). Both approvals are recorded publicly on the draw record."
        confirmLabel="Execute re-draw"
        extraField={{ label: "Second approver email", placeholder: "admin2@example.com", type: "email" }}
        onConfirm={(reason, secondApproverEmail) =>
          rerollDrawAction({ drawId, reason, secondApproverEmail })
        }
      />
    </div>
  );
}

export function RefundControl({
  transactionId,
  maxRefundableMinor,
}: {
  transactionId: string;
  maxRefundableMinor: number;
}) {
  return (
    <JustifiedAction
      triggerLabel="Refund"
      title="Issue refund"
      description={`Refundable balance: ${maxRefundableMinor} minor units. Partial refunds allowed.`}
      confirmLabel="Issue refund"
      extraField={{ label: "Amount (minor units)", placeholder: String(maxRefundableMinor), type: "number" }}
      onConfirm={(reason, amount) =>
        refundPaymentAction({
          transactionId,
          amountMinor: Number.parseInt(amount, 10),
          reason,
        })
      }
    />
  );
}

export function JurisdictionToggle({
  jurisdictionId,
  isActive,
}: {
  jurisdictionId: string;
  isActive: boolean;
}) {
  return (
    <JustifiedAction
      triggerLabel={isActive ? "Deactivate" : "Activate"}
      destructive={isActive}
      title={isActive ? "Deactivate jurisdiction" : "Activate jurisdiction"}
      description={
        isActive
          ? "All campaigns immediately stop being available in this territory."
          : "Confirm that legal review has approved the rules for this territory before activating."
      }
      confirmLabel={isActive ? "Deactivate" : "Activate"}
      onConfirm={(reason) =>
        toggleJurisdictionAction({ jurisdictionId, isActive: !isActive, reason })
      }
    />
  );
}

export function ReportControls({ reportId }: { reportId: string }) {
  return (
    <div className="flex gap-2">
      <JustifiedAction
        triggerLabel="Actioned"
        triggerVariant="primary"
        title="Mark report as actioned"
        confirmLabel="Mark actioned"
        onConfirm={(reason) => resolveReportAction({ reportId, status: "actioned", reason })}
      />
      <JustifiedAction
        triggerLabel="Dismiss"
        title="Dismiss report"
        confirmLabel="Dismiss"
        onConfirm={(reason) => resolveReportAction({ reportId, status: "dismissed", reason })}
      />
    </div>
  );
}

export function DisputeControls({ disputeId }: { disputeId: string }) {
  return (
    <div className="flex gap-2">
      <JustifiedAction
        triggerLabel="Resolve"
        triggerVariant="primary"
        title="Resolve dispute"
        confirmLabel="Resolve"
        onConfirm={(resolution) => resolveDisputeAction({ disputeId, status: "resolved", resolution })}
      />
      <JustifiedAction
        triggerLabel="Reject"
        destructive
        title="Reject dispute"
        confirmLabel="Reject"
        onConfirm={(resolution) => resolveDisputeAction({ disputeId, status: "rejected", resolution })}
      />
    </div>
  );
}

export function UserRoleControl({ userId, role, has }: { userId: string; role: string; has: boolean }) {
  return (
    <JustifiedAction
      triggerLabel={has ? `Revoke ${role}` : `Grant ${role}`}
      destructive={has}
      triggerSize="sm"
      title={`${has ? "Revoke" : "Grant"} role: ${role}`}
      confirmLabel={has ? "Revoke role" : "Grant role"}
      onConfirm={(reason) =>
        setUserRoleAction({
          userId,
          role: role as "seller" | "moderator" | "compliance" | "support" | "finance" | "admin",
          grant: !has,
          reason,
        })
      }
    />
  );
}

export function AccountStatusControl({ userId, status }: { userId: string; status: string }) {
  const next = status === "active" ? "restricted" : "active";
  return (
    <JustifiedAction
      triggerLabel={next === "restricted" ? "Restrict" : "Reactivate"}
      destructive={next === "restricted"}
      title={next === "restricted" ? "Restrict account" : "Reactivate account"}
      confirmLabel="Apply"
      onConfirm={(reason) =>
        setAccountStatusAction({ userId, status: next as "active" | "restricted", reason })
      }
    />
  );
}
