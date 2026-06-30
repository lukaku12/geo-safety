import { Badge, type BadgeTone } from "@/components/ui/badge";
import { OUTCOME_LABELS } from "@/lib/reconciliation/status";
import type {
  ReconciliationOutcome,
  TransactionStatus,
} from "@/lib/types/domain";

const TXN_STATUS: Record<
  TransactionStatus,
  { tone: BadgeTone; label: string }
> = {
  matched: { tone: "success", label: "Matched" },
  unmatched: { tone: "warning", label: "Unmatched" },
  ignored: { tone: "neutral", label: "Ignored" },
};

export function TransactionStatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  const { tone, label } = TXN_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const OUTCOME_TONE: Record<ReconciliationOutcome, BadgeTone> = {
  ok: "success",
  underpaid: "danger",
  overpaid: "warning",
  inactive: "neutral",
};

export function OutcomeBadge({ outcome }: { outcome: ReconciliationOutcome }) {
  return (
    <Badge tone={OUTCOME_TONE[outcome]}>{OUTCOME_LABELS[outcome]}</Badge>
  );
}
