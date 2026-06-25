"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PoolCard } from "./pool-card";
import { PoolFilter } from "./pool-filter";
import { Search } from "lucide-react";

interface PoolListProps {
  pools: Array<{
    id: string;
    poolId: string;
    name: string;
    verticalId: string;
    imageUrl?: string | null;
    country: string;
    committed: number;
    target: number;
    participants: number;
    maxParticipants: number;
    status: string;
    hallClass?: string | null;
    minCommitment: number;
    closesAt: Date;
    assetBookValue?: number;
  }>;
  onPoolClick?: (poolId: string) => void;
}

export function PoolList({ pools, onPoolClick }: PoolListProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    vertical: "all",
    status: "all",
    country: "all",
    hallClass: "all",
  });

  const filtered = pools.filter((pool) => {
    const matchesSearch =
      pool.name.toLowerCase().includes(search.toLowerCase()) ||
      pool.country.toLowerCase().includes(search.toLowerCase());
    const matchesVertical = filters.vertical === "all" || pool.verticalId === filters.vertical;
    const matchesStatus = filters.status === "all" || pool.status === filters.status;
    const matchesCountry = filters.country === "all" || pool.country === filters.country;
    const matchesClass = filters.hallClass === "all" || pool.hallClass === filters.hallClass;

    return matchesSearch && matchesVertical && matchesStatus && matchesCountry && matchesClass;
  });

  const countries = Array.from(new Set(pools.map((p) => p.country))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pools..."
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>
        <PoolFilter filters={filters} onChange={setFilters} countries={countries} />
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-white/20 text-sm">
          No pools match your filters.
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((pool, i) => (
            <PoolCard key={pool.id} pool={pool} index={i} onClick={() => onPoolClick?.(pool.poolId)} />
          ))}
        </div>
      )}
    </div>
  );
}