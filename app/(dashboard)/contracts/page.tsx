"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  Loader2,
  Shield,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { formatCurrencyExact, formatDate } from "@/lib/utils";

type PacContract = {
  id: string;
  token: string;
  hallName: string;
  hallId: string | null;
  poolId: string;
  vertical: string;
  emoji: string;
  ownershipPercent: number;
  value: number;
  dynamicValuePerPercent: number;
  issuedAt: string;
  expiresAt: string | null;
  assetImage: string;
  revenueHistory: number[];
  status: "active" | "maturing" | "dormant";
  sriScore: number | null;
  ahgiScore: number | null;
  accumulatedDividends: number;
  pirDebt: number;
};

type ContractsApiResponse = {
  success: boolean;
  contracts?: PacContract[];
  error?: string;
};

function statusClass(status: PacContract["status"]) {
  const map = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    maturing: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dormant: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };
  return map[status];
}

function exportContracts(contracts: PacContract[]) {
  const rows = contracts.map((contract) => [
    contract.token,
    contract.hallName,
    contract.vertical,
    contract.ownershipPercent,
    contract.value,
    contract.status,
    contract.issuedAt,
  ]);

  const csv = [
    ["Token", "Hall", "Vertical", "Ownership%", "Value", "Status", "Issued"],
    ...rows,
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "8TH_LEDGER_PAC_CONTRACTS.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<PacContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadContracts() {
      try {
        setLoading(true);
        const response = await fetch("/api/contracts", {
          credentials: "include",
        });
        const payload = (await response.json()) as ContractsApiResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Failed to load PAC contracts");
        }

        if (active) {
          setContracts(payload.contracts || []);
          setError(null);
        }
      } catch (err) {
        if (active)
          setError(
            err instanceof Error ? err.message : "Failed to load PAC contracts",
          );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadContracts();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      totalValue: contracts.reduce((sum, contract) => sum + contract.value, 0),
      activeContracts: contracts.filter(
        (contract) => contract.status === "active",
      ).length,
      totalOwnership: contracts.reduce(
        (sum, contract) => sum + contract.ownershipPercent,
        0,
      ),
      totalDividends: contracts.reduce(
        (sum, contract) => sum + contract.accumulatedDividends,
        0,
      ),
    }),
    [contracts],
  );

  const statCards: Array<{ label: string; value: string; Icon: LucideIcon }> = [
    {
      label: "Total Value",
      value: formatCurrencyExact(stats.totalValue),
      Icon: FileText,
    },
    {
      label: "Active",
      value: stats.activeContracts.toLocaleString(),
      Icon: Shield,
    },
    {
      label: "Ownership",
      value: `${stats.totalOwnership.toFixed(2)}%`,
      Icon: TrendingUp,
    },
    {
      label: "Dividends",
      value: formatCurrencyExact(stats.totalDividends),
      Icon: Download,
    },
  ];

  return (
    <main className="min-h-screen bg-[#050508] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <Shield className="h-4 w-4" />
              Sovereign Deed Registry
            </div>
            <h1 className="text-4xl font-bold tracking-tight">PAC Contracts</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Your live Perpetual Asset Contract records, generated from
              ownership data.
            </p>
          </div>

          <button
            onClick={() => exportContracts(contracts)}
            disabled={contracts.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          {statCards.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wider text-slate-500">
                {label}
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        {loading && (
          <div className="flex min-h-72 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading PAC contracts
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
            {error}
          </div>
        )}

        {!loading && !error && contracts.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-10 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-slate-500" />
            <h2 className="text-xl font-semibold">No PAC contracts yet</h2>
            <p className="mt-2 text-sm text-slate-400">
              PACs appear here after you receive ownership in a forged pool.
            </p>
          </div>
        )}

        {!loading && !error && contracts.length > 0 && (
          <section className="grid gap-5 lg:grid-cols-2">
            {contracts.map((contract) => (
              <article
                key={contract.id}
                className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
              >
                <div className="flex gap-4 p-5">
                  <img
                    src={contract.assetImage}
                    alt={contract.hallName}
                    className="h-28 w-28 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span>{contract.emoji}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {contract.vertical}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(contract.status)}`}
                      >
                        {contract.status}
                      </span>
                    </div>
                    <h2 className="truncate text-lg font-semibold">
                      {contract.hallName}
                    </h2>
                    <p className="mt-1 truncate font-mono text-xs text-cyan-300">
                      {contract.token}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">Ownership</div>
                        <div className="font-semibold">
                          {contract.ownershipPercent.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Value</div>
                        <div className="font-semibold">
                          {formatCurrencyExact(contract.value)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Issued</div>
                        <div className="font-semibold">
                          {formatDate(contract.issuedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
