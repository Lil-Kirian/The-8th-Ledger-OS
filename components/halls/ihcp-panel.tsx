"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PiggyBank,
  TrendingUp,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  History,
  Calculator,
  Shield,
  Info,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Percent,
  Calendar,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useIhcpStatus, useProposeIhcp, useContributeIhcp } from "@/hooks/use-ihcp";

interface IhcpPanelProps {
  hallId: string;
  balance: number;
  isAdmin?: boolean;
}

// FIX: API uses "stock" not "inventory" for purpose validation
const PURPOSE_LABELS: Record<string, { label: string; color: string; icon: unknown }> = {
  payroll: { label: "Payroll", color: "bg-amber-500/20 text-amber-400", icon: Wallet },
  stock: { label: "Inventory Stock", color: "bg-cyan-500/20 text-cyan-400", icon: PiggyBank },
  marketing: { label: "Marketing", color: "bg-violet-500/20 text-violet-400", icon: TrendingUp },
  upgrade: { label: "Asset Upgrade", color: "bg-emerald-500/20 text-emerald-400", icon: ArrowUpRight },
  emergency: { label: "Emergency", color: "bg-red-500/20 text-red-400", icon: AlertCircle },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: unknown }> = {
  active: { label: "Active", color: "bg-amber-500/20 text-amber-400", icon: Clock },
  repaid: { label: "Repaid", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  defaulted: { label: "Defaulted", color: "bg-red-500/20 text-red-400", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-slate-500/20 text-slate-400", icon: XCircle },
};

export function IhcpPanel({ hallId, balance, isAdmin = false }: IhcpPanelProps) {
  const [showContribute, setShowContribute] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributePurpose, setContributePurpose] = useState("stock"); // FIX: default to "stock" not "inventory"
  const [proposeAmount, setProposeAmount] = useState(""); // FIX: new state
  const [proposePurpose, setProposePurpose] = useState("stock"); // FIX: new state
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const { data: ihcpData, isLoading } = useIhcpStatus(hallId);
  const proposeIhcp = useProposeIhcp();
  const contributeIhcp = useContributeIhcp();

  const contributions = ihcpData?.contributions || [];
  const totalContributed = contributions.reduce((sum: number, c: unknown) => sum + c.amount, 0);
  const totalRepaid = contributions.reduce((sum: number, c: unknown) => sum + c.repaidAmount, 0);
  const activeContributions = contributions.filter((c: unknown) => c.status === "active");
  const repaidContributions = contributions.filter((c: unknown) => c.status === "repaid");

  const handleContribute = async () => {
    const amount = parseInt(contributeAmount);
    if (!amount || amount < 1) return;

    await contributeIhcp.mutateAsync({
      hallId,
      amount,
      purpose: contributePurpose,
    });

    setShowContribute(false);
    setContributeAmount("");
  };

  // FIX: propose now collects amount + purpose to match API
  const handleProposeIhcp = async () => {
    const amount = parseInt(proposeAmount);
    if (!amount || amount < 1) return;

    await proposeIhcp.mutateAsync({
      hallId,
      amount,
      purpose: proposePurpose,
      description: `IHCP proposal for ${proposePurpose}: $${amount.toLocaleString()}`,
    });

    setShowPropose(false);
    setProposeAmount("");
    setProposePurpose("stock");
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <PiggyBank className="w-16 h-16 text-amber-500" />
          </div>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Current Balance</p>
            <p className="text-3xl font-bold text-white mt-2">${balance.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Available for hall operations</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Contributed</p>
            <p className="text-3xl font-bold text-white mt-2">${totalContributed.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <p className="text-xs text-emerald-400">{activeContributions.length} active pools</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Repaid</p>
            <p className="text-3xl font-bold text-white mt-2">${totalRepaid.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <p className="text-xs text-cyan-400">{repaidContributions.length} completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Return Info */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            How IHCP Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-xs">1</span>
                </div>
                <p className="text-white font-medium">Contribute</p>
              </div>
              <p className="text-slate-400 text-xs pl-10">
                Owners vote to create an IHCP. Members contribute capital for specific hall needs.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400 font-bold text-xs">2</span>
                </div>
                <p className="text-white font-medium">Spend</p>
              </div>
              <p className="text-slate-400 text-xs pl-10">
                8th Ledger executes the spending (payroll, stock, upgrades) from the IHCP balance.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-xs">3</span>
                </div>
                <p className="text-white font-medium">Repay</p>
              </div>
              <p className="text-slate-400 text-xs pl-10">
                Revenue flows in. IHCP gets repaid FIRST before dividends, with 5% priority return.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <span className="text-violet-400 font-bold text-xs">4</span>
                </div>
                <p className="text-white font-medium">Distribute</p>
              </div>
              <p className="text-slate-400 text-xs pl-10">
                Once IHCP is repaid, normal revenue flow resumes. Contributors earn their 5% extra.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowContribute(true)}
          className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
        >
          <Plus className="w-4 h-4 mr-2" />
          Contribute to IHCP
        </Button>
        {isAdmin && (
          <Button
            onClick={() => setShowPropose(true)}
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Propose New IHCP
          </Button>
        )}
      </div>

      {/* Contributions List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-500" />
            Contribution History
          </CardTitle>
          <CardDescription className="text-slate-400">
            All IHCP contributions, repayments, and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading contributions...</div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-8">
              <PiggyBank className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No contributions yet</p>
              <p className="text-slate-600 text-xs mt-1">
                Contributions will appear here once members fund the IHCP
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map((contribution: unknown) => {
                const purpose = PURPOSE_LABELS[contribution.purpose] || PURPOSE_LABELS.payroll;
                const status = STATUS_CONFIG[contribution.status] || STATUS_CONFIG.active;
                const PurposeIcon = purpose.icon;
                const StatusIcon = status.icon;
                const repaymentPercent = contribution.amount > 0
                  ? Math.round((contribution.repaidAmount / (contribution.amount * 1.05)) * 100)
                  : 0;
                const isExpanded = expandedEntry === contribution.id;

                return (
                  <motion.div
                    key={contribution.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border border-slate-800 rounded-lg overflow-hidden"
                  >
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                      onClick={() => setExpandedEntry(isExpanded ? null : contribution.id)}
                    >
                      <div className={`p-2 rounded-lg ${purpose.color}`}>
                        <PurposeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{purpose.label}</p>
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Contributed ${contribution.amount.toLocaleString()} · {new Date(contribution.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          ${contribution.repaidAmount.toLocaleString()} / ${Math.round(contribution.amount * 1.05).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">{repaymentPercent}% repaid</p>
                      </div>
                      <div className="w-24">
                        <Progress value={Math.min(100, repaymentPercent)} className="h-1.5" />
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-800"
                        >
                          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-slate-500 uppercase">Original Amount</p>
                              <p className="text-white font-medium mt-1">${contribution.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">Repaid So Far</p>
                              <p className="text-emerald-400 font-medium mt-1">${contribution.repaidAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">Total Owed (incl. 5%)</p>
                              <p className="text-amber-400 font-medium mt-1">
                                ${Math.round(contribution.amount * 1.05).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">Remaining</p>
                              <p className="text-violet-400 font-medium mt-1">
                                ${Math.max(0, Math.round(contribution.amount * 1.05) - contribution.repaidAmount).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            <p className="text-xs text-slate-500">
                              <Info className="w-3 h-3 inline mr-1" />
                              Repayment is deducted automatically from hall revenue before dividends are distributed.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contribute Dialog */}
      <Dialog open={showContribute} onOpenChange={setShowContribute}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-amber-500" />
              Contribute to IHCP
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Contribute capital to the Internal Hall Contribution Pool. You will be repaid with 5% priority return.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Purpose</Label>
              <Select value={contributePurpose} onValueChange={setContributePurpose}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="stock">Inventory Stock</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="upgrade">Asset Upgrade</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="number"
                  min={1}
                  placeholder="Enter amount..."
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
              <p className="text-xs text-slate-500">
                Min: $1 · You will receive {contributeAmount ? Math.round(parseInt(contributeAmount) * 1.05).toLocaleString() : "0"} on full repayment
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Percent className="w-4 h-4 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">5% Priority Return</p>
                  <p className="text-xs text-amber-300/70">
                    IHCP contributors are repaid first from revenue, before dividends. You earn 5% extra on your contribution.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContribute(false)}
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleContribute}
              disabled={!contributeAmount || parseInt(contributeAmount) < 1 || contributeIhcp.isPending}
              className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
            >
              {contributeIhcp.isPending ? "Processing..." : "Contribute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Propose Dialog — FIX: now has amount + purpose fields */}
      <Dialog open={showPropose} onOpenChange={setShowPropose}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-500" />
              Propose New IHCP
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a proposal to establish an Internal Hall Contribution Pool for this hall.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Purpose</Label>
              <Select value={proposePurpose} onValueChange={setProposePurpose}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="stock">Inventory Stock</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="upgrade">Asset Upgrade</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Target Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="number"
                  min={1}
                  placeholder="Enter target amount..."
                  value={proposeAmount}
                  onChange={(e) => setProposeAmount(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
              <p className="text-xs text-slate-500">
                This is the target IHCP amount. Owners will vote to approve it.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <p className="text-sm text-white">Requires 51% hall vote to pass</p>
              </div>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <p className="text-sm text-white">5% priority return for all contributors</p>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <p className="text-sm text-white">Repaid before dividends from revenue</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPropose(false)}
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProposeIhcp}
              disabled={!proposeAmount || parseInt(proposeAmount) < 1 || proposeIhcp.isPending}
              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              {proposeIhcp.isPending ? "Creating..." : "Create Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}