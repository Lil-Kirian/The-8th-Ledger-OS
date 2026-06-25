"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Package,
  Users,
  TrendingUp,
  Hammer,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
  DollarSign,
  BarChart3,
  Wrench,
  Store,
  PiggyBank,
  Vote,
  ArrowRight,
  Lock,
  Unlock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IhcpPanel } from "./ihcp-panel";
import { EnableInventory } from "@/components/inventory/enable-inventory";
import { EnableForge } from "@/components/forge/enable-forge";
import { InventoryManager } from "@/components/inventory/inventory-manager";
import { ForgeLedger } from "@/components/forge/forge-ledger";
import { WorkerRoster } from "@/components/forge/worker-roster";
import { RevenueBreakdown } from "./revenue-breakdown";
import { BusinessProposalForm } from "./business-proposal-form";

interface Hall {
  id: string;
  name: string;
  status: string;
  hallClass: string;
  inventoryEnabled: boolean;
  forgeEnabled: boolean;
  ihcpBalance: number;
  sriScore: number;
  ahgiScore: number;
  closureStatus: string;
  businessStatus: string;
}

interface OperationsDashboardProps {
  hall: Hall;
  isAdmin?: boolean;
}

export function OperationsDashboard({ hall, isAdmin = false }: OperationsDashboardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");
  const [activeTab, setActiveTab] = useState("overview");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isOperational = hall.status === "live" || hall.status === "operating";
  const hasInventory = hall.inventoryEnabled;
  const hasForge = hall.forgeEnabled;
  const hasOperations = hasInventory || hasForge;

  const sections = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "ihcp", label: "IHCP", icon: PiggyBank },
    ...(hasInventory ? [{ id: "inventory", label: "Inventory", icon: Package }] : []),
    ...(hasForge ? [{ id: "forge", label: "Forge", icon: Hammer }] : []),
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "proposals", label: "Proposals", icon: Vote },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Operations Command
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Hall #{hall.id.slice(-4)} — {hall.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={isOperational ? "default" : "secondary"}
            className={isOperational ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
          >
            {isOperational ? "OPERATIONAL" : hall.status.toUpperCase()}
          </Badge>
          {hasInventory && (
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              <Store className="w-3 h-3 mr-1" />
              Inventory
            </Badge>
          )}
          {hasForge && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Wrench className="w-3 h-3 mr-1" />
              Forge
            </Badge>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">SRI Score</p>
                <p className="text-2xl font-bold text-white mt-1">{hall.sriScore}</p>
              </div>
              <Shield className="w-8 h-8 text-cyan-500/40" />
            </div>
            <Progress value={hall.sriScore} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">AHGI Score</p>
                <p className="text-2xl font-bold text-white mt-1">{hall.ahgiScore}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500/40" />
            </div>
            <Progress value={hall.ahgiScore} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">IHCP Balance</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${hall.ihcpBalance.toLocaleString()}
                </p>
              </div>
              <PiggyBank className="w-8 h-8 text-amber-500/40" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Internal Hall Contribution Pool</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Hall Class</p>
                <p className="text-2xl font-bold text-white mt-1">{hall.hallClass || "I"}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-violet-500/40" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {hasOperations ? "Universal Operations Active" : "Default Configuration"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enable CTAs (if not enabled) */}
      {!hasOperations && isOperational && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <EnableInventory hallId={hall.id} />
          <EnableForge hallId={hall.id} />
        </motion.div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1 mb-6">
          {sections.map((section) => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
            >
              <section.icon className="w-4 h-4 mr-2" />
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="overview" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-500" />
                    Operations Status
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Real-time view of hall operational capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className={`p-3 rounded-full ${hasInventory ? "bg-cyan-500/20" : "bg-slate-700/50"}`}>
                        {hasInventory ? (
                          <Unlock className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Inventory System</p>
                        <p className="text-xs text-slate-400">
                          {hasInventory
                            ? "Active — Public sales and stock management enabled"
                            : "Locked — Vote to enable inventory operations"}
                        </p>
                      </div>
                      <Badge
                        variant={hasInventory ? "default" : "secondary"}
                        className={hasInventory ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-700 text-slate-400"}
                      >
                        {hasInventory ? "ENABLED" : "DISABLED"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className={`p-3 rounded-full ${hasForge ? "bg-amber-500/20" : "bg-slate-700/50"}`}>
                        {hasForge ? (
                          <Unlock className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">The Forge</p>
                        <p className="text-xs text-slate-400">
                          {hasForge
                            ? "Active — Worker management and payroll enabled"
                            : "Locked — Vote to enable forge operations"}
                        </p>
                      </div>
                      <Badge
                        variant={hasForge ? "default" : "secondary"}
                        className={hasForge ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"}
                      >
                        {hasForge ? "ENABLED" : "DISABLED"}
                      </Badge>
                    </div>
                  </div>

                  {hall.closureStatus !== "active" && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Closure Protocol Active</p>
                        <p className="text-xs text-red-300/70">
                          This hall is under closure protocol. Operations are restricted.
                        </p>
                      </div>
                    </div>
                  )}

                  {hasOperations && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      <Button
                        variant="outline"
                        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                        onClick={() => setActiveTab("inventory")}
                        disabled={!hasInventory}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Manage Inventory
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                      <Button
                        variant="outline"
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => setActiveTab("forge")}
                        disabled={!hasForge}
                      >
                        <Hammer className="w-4 h-4 mr-2" />
                        Manage Forge
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                      <Button
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => setActiveTab("proposals")}
                      >
                        <Vote className="w-4 h-4 mr-2" />
                        New Proposal
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="ihcp" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <IhcpPanel hallId={hall.id} balance={hall.ihcpBalance} isAdmin={isAdmin} />
            </motion.div>
          </TabsContent>

          {hasInventory && (
            <TabsContent value="inventory" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <InventoryManager hallId={hall.id} isAdmin={isAdmin} />
              </motion.div>
            </TabsContent>
          )}

          {hasForge && (
            <TabsContent value="forge" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <WorkerRoster hallId={hall.id} isAdmin={isAdmin} />
                <ForgeLedger hallId={hall.id} />
              </motion.div>
            </TabsContent>
          )}

          <TabsContent value="revenue" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RevenueBreakdown hallId={hall.id} />
            </motion.div>
          </TabsContent>

          <TabsContent value="proposals" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <BusinessProposalForm
                hallId={hall.id}
                enabledFeatures={{
                  inventory: hasInventory,
                  forge: hasForge,
                  ihcp: true,
                }}
              />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}