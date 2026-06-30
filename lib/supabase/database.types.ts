/**
 * Hand-authored mirror of the Postgres schema (seed_schema.sql) and the RPC
 * functions (supabase/reconcile.sql), shaped for the `supabase-js` generic.
 *
 * In a larger codebase this file would be generated with
 * `supabase gen types typescript`; it is committed by hand here so the repo is
 * self-contained and the column/RPC contracts are reviewable in one place.
 */

export type TransactionStatus = "matched" | "unmatched" | "ignored";
export type MatchMethod = "inn_exact" | "manual";
export type ContractStatus = "active" | "paused" | "ended";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          tax_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tax_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          company_id: string;
          monthly_amount: number;
          status: ContractStatus;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          monthly_amount: number;
          status: ContractStatus;
          start_date: string;
          end_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contracts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      bank_transactions: {
        Row: {
          id: string;
          doc_key: string;
          entry_date: string;
          amount: number;
          currency: string;
          sender_name: string | null;
          sender_inn: string | null;
          sender_account: string | null;
          purpose: string | null;
          matched_company_id: string | null;
          match_method: MatchMethod | null;
          match_confidence: number | null;
          status: TransactionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doc_key: string;
          entry_date: string;
          amount: number;
          currency?: string;
          sender_name?: string | null;
          sender_inn?: string | null;
          sender_account?: string | null;
          purpose?: string | null;
          matched_company_id?: string | null;
          match_method?: MatchMethod | null;
          match_confidence?: number | null;
          status?: TransactionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["bank_transactions"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "bank_transactions_matched_company_id_fkey";
            columns: ["matched_company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      reconcile_by_inn: {
        Args: Record<string, never>;
        Returns: {
          matched_count: number;
          unmatched_count: number;
          total_processed: number;
        }[];
      };
      reconciliation_stats: {
        Args: { p_period_start?: string | null; p_period_end?: string | null };
        Returns: {
          total_count: number;
          matched_count: number;
          unmatched_count: number;
          ignored_count: number;
          total_amount: number;
          matched_amount: number;
          unmatched_amount: number;
        }[];
      };
      company_reconciliation: {
        Args: { p_period_start: string; p_period_end: string };
        Returns: {
          company_id: string;
          name: string;
          tax_id: string;
          expected: number;
          actual: number;
          matched_count: number;
          active_contract_count: number;
        }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
