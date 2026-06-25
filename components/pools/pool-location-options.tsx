"use client";

import { Card } from "@/components/ui/card";
import { MapPin, Check, Users } from "lucide-react";

interface LocationOption {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  cost?: number;
  image?: string;
  description?: string;
  votes?: number;
  voteWeight?: number;
  isSelected?: boolean;
}

interface PoolLocationOptionsProps {
  options?: string | null;
  selected?: string | null;
}

export function PoolLocationOptions({ options, selected }: PoolLocationOptionsProps) {
  const locationList: LocationOption[] = options ? JSON.parse(options) : [];

  if (locationList.length === 0) {
    return (
      <Card className="p-5 border-white/5 bg-[#0a0a0a]">
        <p className="text-sm text-white/30 text-center py-8">No location options available yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 border-white/5 bg-[#0a0a0a]">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-cyan-400" />
          Location Options
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {locationList.map((loc, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 transition-colors ${
                loc.name === selected
                  ? "border-cyan-500/30 bg-cyan-500/5"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-medium text-white">{loc.name}</h4>
                  <p className="text-[10px] text-white/30 mt-1">{loc.address}</p>
                </div>
                {loc.name === selected && (
                  <div className="rounded-full bg-cyan-500/20 p-1">
                    <Check className="h-3 w-3 text-cyan-400" />
                  </div>
                )}
              </div>

              {loc.description && <p className="text-[10px] text-white/20 mt-2 leading-relaxed">{loc.description}</p>}

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                {loc.cost !== undefined && (
                  <span className="text-[10px] text-white/30">Cost: ${loc.cost.toLocaleString()}</span>
                )}
                <span className="text-[10px] text-white/30 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {loc.votes || 0} votes
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}