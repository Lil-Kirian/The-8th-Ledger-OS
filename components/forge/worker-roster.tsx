"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import WorkerCard from "./worker-card";
import { useWorkers } from "@/hooks/use-forge";

interface WorkerRosterProps {
  hallId: string;
  onProposeHire?: () => void;
  onProposeFire?: (workerId: string) => void;
}

export function WorkerRoster({
  hallId,
  onProposeHire,
  onProposeFire,
}: WorkerRosterProps) {
  const { workers, count, hallClass, canProposeHire, showSalaries, isLoading } = useWorkers(hallId);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PROBATION" | "TERMINATED" | "SUSPENDED">("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"salary" | "performance" | "hired">("hired");

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse text-slate-500">Loading workers...</div>
      </div>
    );
  }

  const filtered = workers
    .filter((w) => (filter === "ALL" ? true : w.status.toUpperCase() === filter))
    .filter(
      (w) =>
        w.role.toLowerCase().includes(search.toLowerCase()) ||
        w.workerNumber.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "salary") return (b.salary || 0) - (a.salary || 0);
      if (sortBy === "performance") return b.performanceScore - a.performanceScore;
      return new Date(b.hiredAt).getTime() - new Date(a.hiredAt).getTime();
    });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search workers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            {(["ALL", "ACTIVE", "PROBATION", "TERMINATED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === f
                    ? "bg-slate-800 text-cyan-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortBy(sortBy === "salary" ? "performance" : sortBy === "performance" ? "hired" : "salary")}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            title="Sort"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {canProposeHire && (
            <button
              onClick={onProposeHire}
              className="px-4 py-2.5 bg-cyan-950/30 border border-cyan-900/50 rounded-lg text-cyan-400 text-sm font-medium hover:bg-cyan-950/50 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Propose Hire
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {filtered.length} worker{filtered.length !== 1 ? "s" : ""} shown of {count}
        </span>
        <span>Sorted by {sortBy}</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((worker, i) => (
            <motion.div
              key={worker.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
            >
              <WorkerCard
                worker={worker}
                hallClass={hallClass}
                showSalary={showSalaries}
                canMessage={true}
                onMessage={(id) => console.log("Relay to", id)}
                onReview={(id) => console.log("Review", id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 text-center border border-dashed border-slate-800 rounded-xl"
        >
          <SlidersHorizontal className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No workers match your filters.</p>
          {canProposeHire && (
            <p className="text-slate-600 text-xs mt-2">
              Propose a new hire to build your team.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default WorkerRoster;
