// app/(dashboard)/halls/[id]/inventory/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Store,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Boxes,
  Search,
  ChevronRight,
  BarChart3,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Lock,
  ExternalLink,
  ImageIcon,
  Tag,
  Plus,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryManager } from "@/components/inventory/inventory-manager";
import { PublicListingToggle } from "@/components/inventory/public-listing-toggle";
import { useInventory } from "@/hooks/use-inventory";
import { useHall } from "@/hooks/use-hall";
import Link from "next/link";

interface InventoryItem {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  quantitySold: number;
  costOfGoods: number;
  reorderThreshold: number;
  status: string;
  listedAt: string;
  createdAt: string;
  imageUrl?: string | null;
  images?: string | null; // JSON array string
  tags?: string | null; // JSON array string
  specs?: string | null; // JSON object string
}

function getItemImage(item: InventoryItem): string | null {
  if (item.imageUrl) return item.imageUrl;
  if (item.images) {
    try {
      const parsed = JSON.parse(item.images) as string[];
      return parsed[0] || null;
    } catch {
      return null;
    }
  }
  return null;
}

function getItemTags(item: InventoryItem): string[] {
  if (!item.tags) return [];
  try {
    return JSON.parse(item.tags) as string[];
  } catch {
    return [];
  }
}

function getItemSpecs(item: InventoryItem): Record<string, string> {
  if (!item.specs) return {};
  try {
    return JSON.parse(item.specs) as Record<string, string>;
  } catch {
    return {};
  }
}

export default function HallInventoryPage() {
  const params = useParams();
  const hallId = params.id as string;
  const [activeTab, setActiveTab] = useState("manage");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: hall, isLoading: hallLoading } = useHall(hallId);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventory(hallId);

  const items: InventoryItem[] = inventoryData?.items || [];
  const canManage = hall?.canManage || hall?.isAdmin || false;
  const inventoryEnabled = hall?.inventoryEnabled || false;
  const hallClass = hall?.hallClass || "I";
  const ihcpBalance = hall?.ihcpBalance || 0;

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getItemTags(item).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalStockValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSoldValue = items.reduce((sum, item) => sum + item.price * item.quantitySold, 0);
  const totalCOGS = items.reduce((sum, item) => sum + item.costOfGoods * item.quantitySold, 0);
  const totalProfit = totalSoldValue - totalCOGS;
  const lowStockItems = items.filter((item) => item.quantity <= item.reorderThreshold && item.quantity > 0);
  const outOfStockItems = items.filter((item) => item.quantity === 0);
  const listedItems = items.filter((item) => item.status === "active");
  const hiddenItems = items.filter((item) => item.status !== "active");

  if (hallLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500">Loading hall data...</div>
      </div>
    );
  }

  if (!inventoryEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link href={`/halls/${hallId}`}>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Hall
              </Button>
            </Link>
          </div>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-12 text-center">
              <Lock className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Inventory System Locked</h2>
              <p className="text-slate-400 max-w-md mx-auto mb-6">
                The inventory system is not enabled for this hall. Propose a vote to activate it through the Operations dashboard.
              </p>
              <Link href={`/halls/${hallId}/operations`}>
                <Button className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30">
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Operations
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/halls/${hallId}`}>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Store className="w-6 h-6 text-cyan-500" />
                Inventory
              </h1>
              <p className="text-sm text-slate-400">
                Hall #{hallId.slice(-4)} — {hall?.name || "Loading..."}
              </p>
            </div>
            <Badge className="bg-slate-800 text-slate-300 border-slate-700">
              Class {hallClass}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/marketplace/inventory" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                View Storefront
              </Button>
            </Link>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              <Eye className="w-3 h-3 mr-1" />
              {listedItems.length} Listed
            </Badge>
            <Badge className="bg-slate-700/50 text-slate-400 border-slate-700">
              <EyeOff className="w-3 h-3 mr-1" />
              {hiddenItems.length} Hidden
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Items</p>
              <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Stock Value</p>
              <p className="text-2xl font-bold text-white mt-1">${totalStockValue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">${totalSoldValue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Profit</p>
              <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ${totalProfit.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Low Stock</p>
              <p className={`text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? "text-amber-400" : "text-white"}`}>
                {lowStockItems.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                IHCP Balance
              </p>
              <p className="text-2xl font-bold text-violet-400 mt-1">${ihcpBalance.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <div className="space-y-2">
            {outOfStockItems.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">{outOfStockItems.length} items out of stock</p>
                  <p className="text-xs text-red-300/70">Restock immediately to resume sales</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => setActiveTab("manage")}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Restock
                </Button>
              </div>
            )}
            {lowStockItems.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-400">{lowStockItems.length} items at reorder threshold</p>
                  <p className="text-xs text-amber-300/70">Consider restocking soon</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1 mb-6">
            <TabsTrigger
              value="manage"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
            >
              <Boxes className="w-4 h-4 mr-2" />
              Manage Inventory
            </TabsTrigger>
            <TabsTrigger
              value="listings"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400"
            >
              <Eye className="w-4 h-4 mr-2" />
              Public Listings
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 text-slate-400"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {items.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">No Inventory Yet</h2>
                    <p className="text-slate-400 max-w-md mx-auto mb-6">
                      Your hall's inventory is empty. Add your first product to start selling on the 8th Ledger Exchange.
                    </p>
                    <Button
                      className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                      onClick={() => {
                        // Scroll to or trigger the add form inside InventoryManager
                        const btn = document.querySelector('[data-add-item-trigger]') as HTMLButtonElement | null;
                        btn?.click();
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Item
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
              <InventoryManager hallId={hallId} canManage={canManage} />
            </motion.div>
          </TabsContent>

          <TabsContent value="listings" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Search items, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{listedItems.length} listed</span>
                  <span className="text-slate-600">·</span>
                  <span>{hiddenItems.length} hidden</span>
                  <span className="text-slate-600">·</span>
                  <span>{items.length} total</span>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-12 text-center">
                    <Eye className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">No items match your search</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => {
                    const img = getItemImage(item);
                    const tags = getItemTags(item);
                    const specs = getItemSpecs(item);
                    const margin = item.price > 0
                      ? Math.round(((item.price - item.costOfGoods) / item.price) * 100)
                      : 0;
                    const isLowStock = item.quantity <= item.reorderThreshold && item.quantity > 0;
                    const isOut = item.quantity === 0;

                    return (
                      <Card
                        key={item.id}
                        className={`bg-slate-900/50 border-slate-800 overflow-hidden ${isOut ? "opacity-60" : ""}`}
                      >
                        {img ? (
                          <div className="relative h-40 bg-slate-800">
                            <img
                              src={img}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            {isOut && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                  Out of Stock
                                </Badge>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-40 bg-slate-800 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-slate-700" />
                          </div>
                        )}
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                              <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                            </div>
                            <Badge
                              className={
                                item.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : "bg-slate-700/50 text-slate-400 border-slate-700"
                              }
                            >
                              {item.status === "active" ? "Listed" : "Hidden"}
                            </Badge>
                          </div>

                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tags.slice(0, 3).map((t) => (
                                <Badge
                                  key={t}
                                  variant="outline"
                                  className="text-[10px] border-slate-700 text-slate-400"
                                >
                                  <Tag className="w-2.5 h-2.5 mr-1" />
                                  {t}
                                </Badge>
                              ))}
                              {tags.length > 3 && (
                                <span className="text-[10px] text-slate-600">+{tags.length - 3}</span>
                              )}
                            </div>
                          )}

                          {Object.keys(specs).length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(specs).slice(0, 2).map(([k, v]) => (
                                <span key={k} className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <div>
                              <p className="text-lg font-bold text-white">${item.price.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-500">
                                COGS: ${item.costOfGoods} · Margin: {margin}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${isLowStock ? "text-amber-400" : isOut ? "text-red-400" : "text-slate-300"}`}>
                                {item.quantity} left
                              </p>
                              <p className="text-[10px] text-slate-500">{item.quantitySold} sold</p>
                            </div>
                          </div>

                          <PublicListingToggle item={item} hallId={hallId} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-500" />
                      Sales Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {items.slice(0, 5).map((item) => {
                        const totalUnits = item.quantitySold + item.quantity;
                        const salesPercent = totalUnits > 0
                          ? Math.min(100, (item.quantitySold / totalUnits) * 100)
                          : 0;
                        return (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white truncate">{item.title}</span>
                              <span className="text-slate-400">{item.quantitySold} sold</span>
                            </div>
                            <Progress value={salesPercent} className="h-1.5" />
                          </div>
                        );
                      })}
                      {items.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">No sales data yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Revenue Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs text-slate-500">Gross Revenue</p>
                        <p className="text-lg font-bold text-white">${totalSoldValue.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs text-slate-500">COGS</p>
                        <p className="text-lg font-bold text-red-400">${totalCOGS.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs text-slate-500">Net Profit</p>
                        <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          ${totalProfit.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs text-slate-500">Avg Margin</p>
                        <p className="text-lg font-bold text-violet-400">
                          {items.length > 0
                            ? Math.round(items.reduce((sum, item) => {
                                const m = item.price - item.costOfGoods;
                                return sum + (item.price > 0 ? (m / item.price) * 100 : 0);
                              }, 0) / items.length)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    Inventory Turnover
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const totalUnits = item.quantity + item.quantitySold;
                      const turnover = totalUnits > 0
                        ? (item.quantitySold / totalUnits * 100).toFixed(1)
                        : "0.0";
                      return (
                        <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.title}</p>
                            <p className="text-xs text-slate-500">
                              {item.quantitySold} sold / {totalUnits} total
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-violet-400">{turnover}%</p>
                            <p className="text-xs text-slate-500">turnover</p>
                          </div>
                          <div className="w-24 shrink-0">
                            <Progress value={parseFloat(turnover)} className="h-1.5" />
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">No inventory to analyze</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}