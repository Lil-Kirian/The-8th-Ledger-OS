"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Hammer,
  Users,
  Wrench,
  DollarSign,
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Vote,
  Clock,
  TrendingUp,
  MessageSquare,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToggleForge } from "@/hooks/use-forge";

interface EnableForgeProps {
  hallId: string;
  hallClass?: string; // FIX: added optional prop
}

const FORGE_FEATURES = [
  {
    icon: Users,
    title: "Worker Roster",
    description: "Hire, manage, and review workers assigned to your hall assets",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  {
    icon: DollarSign,
    title: "Payroll Management",
    description: "Automated salary payments, tax handling, and contract management",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  {
    icon: TrendingUp,
    title: "Performance Reviews",
    description: "Track worker output, schedule reviews, and propose terminations",
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
  },
  {
    icon: MessageSquare,
    title: "8th Ledger Relay",
    description: "Secure hall-to-worker messaging through 8th Ledger mediation",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  {
    icon: FileText,
    title: "Forge Ledger",
    description: "Monthly payroll history, staffing costs, and operational reports",
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
  },
  {
    icon: Wrench,
    title: "Maintenance Appeals",
    description: "Propose repairs, upgrades, and vendor contracts for execution",
    color: "text-sky-400",
    bgColor: "bg-sky-500/20",
  },
];

export function EnableForge({ hallId, hallClass = "I" }: EnableForgeProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const toggleForge = useToggleForge();

  // FIX: send enable: true to match API contract
  const handleEnable = async () => {
    await toggleForge.mutateAsync({ hallId, enable: true });
    setShowConfirm(false);
    setShowSuccess(true);
  };

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/20">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-white text-base">The Forge</CardTitle>
                <CardDescription className="text-slate-400">
                  Worker management & payroll system
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
            Enable the Forge to hire workers, manage payroll, and run active operations for this hall. 
            This requires a <span className="text-amber-400 font-medium">51% hall vote</span> to activate.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FORGE_FEATURES.map((feature, index) => {
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

          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300/80">
              Once enabled, the hall can propose hires, set staffing levels, and fund payroll through treasury or IHCP. 
              8th Ledger handles all employment contracts and payments.
            </p>
          </div>

          <Button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
          >
            <Hammer className="w-4 h-4 mr-2" />
            Propose Forge Activation
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Hammer className="w-5 h-5 text-amber-500" />
              Propose Forge Activation
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This will create a hall vote to enable the Forge system. All owners will vote.
            </DialogDescription>
          </DialogHeader>

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
                  <p className="text-xs text-slate-400">Forge unlocks immediately after 51% threshold</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">Hall Class Note</p>
                  <p className="text-xs text-amber-300/70">
                    Your hall is currently Class {hallClass}. Enabling the Forge upgrades operational capability 
                    but does not change the class label. The class is a default — Forge is a democratic upgrade.
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
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnable}
              disabled={toggleForge.isPending}
              className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
            >
              {toggleForge.isPending ? "Creating Proposal..." : "Create Proposal"}
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
            <p className="text-white font-medium mb-2">Forge Activation Proposal Submitted</p>
            <p className="text-sm text-slate-400">
              All hall owners have been notified. The vote is now open for 48 hours. 
              You need 51% approval to activate the Forge.
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
                <span className="text-slate-300">If 51% passes: Forge activates instantly</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">You can then propose hires and set staffing</span>
              </div>
            </div>
          </div>

          <DialogFooter>
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