// components/inventory/enable-inventory.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Store,
  DollarSign,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Vote,
  Clock,
  Boxes,
  Truck,
  ChevronRight,
  Globe,
  Settings,
  Loader2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";

interface EnableInventoryProps {
  hallId: string;
  hallName?: string;
  hallClass?: string;
  inventoryEnabled?: boolean;
  forgeEnabled?: boolean;
  sriScore?: number;
  sriTier?: string;
  canPropose?: boolean;
  disabled?: boolean;
  onProposalCreated?: (proposalId: string) => void;
  onError?: (error: string) => void;
}

const INVENTORY_FEATURES = [
  {
    icon: Store,
    title: "Public Marketplace",
    description: "List products for sale to anyone — no KYC required for small orders",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  {
    icon: Boxes,
    title: "Stock Management",
    description: "Track quantities, reorder thresholds, and stock alerts in real-time",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  {
    icon: DollarSign,
    title: "COGS Tracking",
    description: "Monitor cost of goods sold, margins, and profitability per item",
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    description: "Revenue reports, top sellers, and inventory turnover metrics",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  {
    icon: Truck,
    title: "Order Fulfillment",
    description: "8th Ledger handles shipping, delivery, and customer service",
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
  },
  {
    icon: Globe,
    title: "B2B & B2C Sales",
    description: "Sell to individuals and businesses with verification tiers",
    color: "text-sky-400",
    bgColor: "bg-sky-500/20",
  },
];

export function EnableInventory({
  hallId,
  hallName = "this hall",
  hallClass = "I",
  inventoryEnabled = false,
  forgeEnabled = false,
  sriScore = 50,
  sriTier = "silver",
  canPropose = false,
  disabled = false,
  onProposalCreated,
  onError,
}: EnableInventoryProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);

  // Create a proposal to enable inventory (51% vote required)
  const handleEnable = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/halls/${hallId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "inventory_enable",
          title: "Enable Inventory System",
          description: `Proposal to activate the inventory marketplace for ${hallName}. This allows the hall to list physical products for public sale. Revenue flows to hall treasury after 5% platform fee and fulfillment costs.`,
          amount: 0,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.error || data.message || `Failed to create proposal (${res.status})`;
        throw new Error(msg);
      }

      const proposalId = data.id || data.proposalId || data.proposal?.id;
      if (proposalId) {
        setCreatedProposalId(proposalId);
      }

      setShowConfirm(false);
      setShowSuccess(true);
      onProposalCreated?.(proposalId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create proposal";
      setError(msg);
      onError?.(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already enabled state
  if (inventoryEnabled) {
    return (
      <Card className="bg-slate-900/50 border-emerald-800/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/20">
                <Unlock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-white text-base">Inventory System</CardTitle>
                <CardDescription className="text-slate-400">
                  Public product sales & stock management — ACTIVE
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              ENABLED
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {INVENTORY_FEATURES.slice(0, 3).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                >
                  <div className={`p-1.5 rounded-md ${feature.bgColor} w-fit mb-2`}>
                    <Icon className={`w-3.5 h-3.5 ${feature.color}`} />
                  </div>
                  <p className="text-xs font-medium text-white">{feature.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300/80">
              Inventory is active. You can add products, manage stock, and view sales analytics.
              Revenue flows: Buyer pays → 8th Ledger deducts fulfillment cost → 5% platform fee → Net to Hall Treasury → Dividends.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`bg-slate-900/50 border-slate-800 relative overflow-hidden group ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/20">
                <Lock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-white text-base">Inventory System</CardTitle>
                <CardDescription className="text-slate-400">
                  Public product sales & stock management
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-slate-700/50 text-slate-400 border-slate-700">
              DISABLED
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Enable inventory to sell physical products on the 8th Ledger Marketplace. 
            Revenue flows directly to hall treasury. This requires a <span className="text-cyan-400 font-medium">51% hall vote</span> to activate.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {INVENTORY_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
                >
                  <div className={`p-1.5 rounded-md ${feature.bgColor} w-fit mb-2`}>
                    <Icon className={`w-3.5 h-3.5 ${feature.color}`} />
                  </div>
                  <p className="text-xs font-medium text-white">{feature.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <p className="text-xs text-cyan-300/80">
              Once enabled, the hall can list products, set prices, and manage stock. 
              8th Ledger handles fulfillment, payments, and customer service. 
              Revenue: Buyer pays → fulfillment cost deducted → 5% platform fee → Net to Hall Treasury → Dividends distributed.
            </p>
          </div>

          {/* Universal Operations note */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Settings className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400">
              <span className="text-slate-300 font-medium">Universal Operations:</span> Any hall class (I/II/III) can enable inventory via democratic vote. 
              Your hall is currently Class {hallClass}. 
              {forgeEnabled
                ? " The Forge (worker management) is also active."
                : " You can also propose Forge enablement separately for worker management."}
            </div>
          </div>

          {/* SRI context */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <BarChart3 className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="text-xs text-violet-300/80">
              Hall SRI: <span className="text-violet-400 font-bold">{sriScore}</span> ({sriTier}) · 
              {sriScore >= 90 ? " Reduced marketplace fees (0.25%) apply." : sriScore >= 75 ? " Reduced marketplace fees (0.5%) apply." : " Standard marketplace fees (1%) apply."}
            </div>
          </div>

          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!canPropose || disabled}
            className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Package className="w-4 h-4 mr-2" />
            {canPropose ? "Propose Inventory Activation" : "Speaker/Executive Only"}
            {canPropose && !disabled && <ArrowRight className="w-4 h-4 ml-auto" />}
          </Button>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-cyan-500" />
              Propose Inventory Activation
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This will create a hall vote to enable the inventory system. All owners will vote.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
              <div className="flex items-center gap-3">
                <Vote className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-white">Democratic Vote Required</p>
                  <p className="text-xs text-slate-400">51% of ownership weight must approve</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-white">48-Hour Voting Period</p>
                  <p className="text-xs text-slate-400">Owners cast votes within the window</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-white">Instant Activation on Pass</p>
                  <p className="text-xs text-slate-400">Inventory unlocks immediately after 51% threshold</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-cyan-400 font-medium">Hall Class Note</p>
                  <p className="text-xs text-cyan-300/70">
                    Your hall is currently Class {hallClass}. Enabling inventory upgrades operational capability 
                    but does not change the class label. The class is a default — inventory is a democratic upgrade available to any hall.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnable}
              disabled={isSubmitting}
              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Proposal...
                </>
              ) : (
                "Create Proposal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              Proposal Created
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Unlock className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-white font-medium mb-2">Inventory Activation Proposal Submitted</p>
            <p className="text-sm text-slate-400">
              All hall owners have been notified. The vote is now open for 48 hours. 
              You need 51% approval to activate inventory.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">What happens next?</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">Owners cast votes over 48 hours</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">If 51% passes: Inventory activates instantly</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">You can then add products and list them publicly</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2">
            {createdProposalId && (
              <Link href={`/halls/${hallId}/proposals/${createdProposalId}`} className="w-full">
                <Button className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Proposal
                </Button>
              </Link>
            )}
            <Button
              onClick={() => setShowSuccess(false)}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 w-full"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}