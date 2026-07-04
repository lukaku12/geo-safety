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
  unmatched: { tone: "danger", label: "Unmatched" },
  ignored: { tone: "neutral", label: "Ignored" },
};

export function TransactionStatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  const { tone, label } = TXN_STATUS[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

// Brief's color rule: green when paid >= expected (incl. overpaid), red when
// paid less, grey when nothing was paid at all.
const OUTCOME_TONE: Record<ReconciliationOutcome, BadgeTone> = {
  ok: "success",
  underpaid: "danger",
  overpaid: "success",
  unpaid: "neutral",
  inactive: "neutral",
};

export function OutcomeBadge({ outcome }: { outcome: ReconciliationOutcome }) {
  return (
    <Badge tone={OUTCOME_TONE[outcome]} dot>
      {OUTCOME_LABELS[outcome]}
    </Badge>
  );
}
