"use client";

import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";
import { usePayroll } from "@/hooks/use-forge";

interface PayrollHistoryProps {
  hallId: string;
}

export default function PayrollHistory({ hallId }: PayrollHistoryProps) {
  const { payroll, isLoading } = usePayroll(hallId);

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse text-slate-500">Loading payroll history...</div>
      </div>
    );
  }

  const ledgers = payroll?.payrollHistory || [];
  const sorted = [...ledgers].sort(
    (a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()
  );

  const totalPaid = sorted.reduce((sum, l) => sum + l.totalPayroll, 0);
  const avgWorkers =
    sorted.length > 0
      ? Math.round(sorted.reduce((sum, l) => sum + l.workerCount, 0) / sorted.length)
      : 0;

  // Calculate month-over-month change
  const changes = sorted.map((ledger, i) => {
    if (i === sorted.length - 1) return { trend: "neutral" as const, pct: 0 };
    const prev = sorted[i + 1];
    const diff = ledger.totalPayroll - prev.totalPayroll;
    const pct = prev.totalPayroll ? (diff / prev.totalPayroll) * 100 : 0;
    return {
      trend: diff > 0 ? ("up" as const) : diff < 0 ? ("down" as const) : ("neutral" as const),
      pct: Math.abs(pct),
    };
  });

  const handleExport = () => {
    const csv = [
      ["Month", "Workers", "Total Payroll", "Status"],
      ...sorted.map((l) => [l.month, l.workerCount.toString(), l.totalPayroll.toString(), "EXECUTED"]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-history-${hallId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Payroll Paid"
          value={`$${totalPaid.toLocaleString()}`}
          color="cyan"
        />
        <SummaryCard
          icon={<Users className="w-5 h-5" />}
          label="Avg. Monthly Workers"
          value={avgWorkers.toString()}
          color="amber"
        />
        <SummaryCard
          icon={<Calendar className="w-5 h-5" />}
          label="Payroll Records"
          value={sorted.length.toString()}
          color="slate"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Payroll Ledger
          </h3>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-500 text-xs uppercase tracking-wider">
                  Month
                </TableHead>
                <TableHead className="text-slate-500 text-xs uppercase tracking-wider text-right">
                  Workers
                </TableHead>
                <TableHead className="text-slate-500 text-xs uppercase tracking-wider text-right">
                  Total Payroll
                </TableHead>
                <TableHead className="text-slate-500 text-xs uppercase tracking-wider text-right">
                  MoM Change
                </TableHead>
                <TableHead className="text-slate-500 text-xs uppercase tracking-wider text-right">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                    No payroll history recorded.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((ledger, i) => {
                  const change = changes[i];
                  return (
                    <TableRow
                      key={ledger.month}
                      className="border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <TableCell className="text-slate-200 text-sm font-medium">
                        {ledger.month}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm text-right">
                        {ledger.workerCount}
                      </TableCell>
                      <TableCell className="text-slate-200 text-sm font-semibold text-right">
                        ${ledger.totalPayroll.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {change.trend === "neutral" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Minus className="w-3 h-3" /> —
                          </span>
                        ) : change.trend === "up" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <TrendingUp className="w-3 h-3" />
                            +{change.pct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <TrendingDown className="w-3 h-3" />
                            -{change.pct.toFixed(1)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-950/30 text-emerald-400 border border-emerald-900/50">
                          EXECUTED
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "cyan" | "amber" | "slate";
}) {
  const colors = {
    cyan: "bg-cyan-950/30 border-cyan-900/50 text-cyan-400",
    amber: "bg-amber-950/30 border-amber-900/50 text-amber-400",
    slate: "bg-slate-900/50 border-slate-800 text-slate-400",
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">{icon}</div>
      <div className="text-xl font-bold text-slate-100">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider mt-1 opacity-90">
        {label}
      </div>
    </div>
  );
}