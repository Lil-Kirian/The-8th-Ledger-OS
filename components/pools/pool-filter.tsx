"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

const verticals = [
  { value: "ledgerprop", label: "LedgerProp" },
  { value: "ledgerauto", label: "LedgerAuto" },
  { value: "ledgertech", label: "LedgerTech" },
  { value: "ledgeredu", label: "LedgerEdu" },
  { value: "ledgerhealth", label: "LedgerHealth" },
  { value: "ledgerbiz", label: "LedgerBiz" },
  { value: "ledgertravel", label: "LedgerTravel" },
  { value: "ledgeragri", label: "LedgerAgri" },
  { value: "ledgerenergy", label: "LedgerEnergy" },
  { value: "ledgeraccess", label: "LedgerAccess" },
];

const statuses = [
  { value: "filling", label: "Filling" },
  { value: "filled", label: "Filled" },
  { value: "forged", label: "Forged" },
  { value: "active", label: "Active" },
];

const hallClasses = [
  { value: "I", label: "Class I — Passive" },
  { value: "II", label: "Class II — Managed" },
  { value: "III", label: "Class III — Active" },
];

interface PoolFilterProps {
  filters: {
    vertical: string;
    status: string;
    country: string;
    hallClass: string;
  };
  onChange: (filters: any) => void;
  countries: string[];
}

export function PoolFilter({ filters, onChange, countries }: PoolFilterProps) {
  const [open, setOpen] = useState(false);

  const update = (key: string, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clear = () => {
    onChange({ vertical: "all", status: "all", country: "all", hallClass: "all" });
  };

  const hasFilters =
    filters.vertical !== "all" ||
    filters.status !== "all" ||
    filters.country !== "all" ||
    filters.hallClass !== "all";

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className={`border-white/10 bg-white/5 text-white hover:bg-white/10 ${
          hasFilters ? "border-cyan-500/30 text-cyan-400" : ""
        }`}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filter
        {hasFilters && <span className="ml-2 h-2 w-2 rounded-full bg-cyan-400" />}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 z-50 rounded-lg border border-white/10 bg-[#0f0f0f] p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Filters</h4>
              {hasFilters && (
                <button
                  onClick={clear}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Vertical</label>
                <select
                  value={filters.vertical}
                  onChange={(e) => update("vertical", e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Verticals</option>
                  {verticals.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => update("status", e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Hall Class</label>
                <select
                  value={filters.hallClass}
                  onChange={(e) => update("hallClass", e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Classes</option>
                  {hallClasses.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Country</label>
                <select
                  value={filters.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Countries</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}