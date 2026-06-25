// app/admin/marketplace/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Search,
  ArrowUpDown,
  TrendingUp,
  Shield,
  AlertTriangle,
  Hash,
  Wallet,
  Percent,
  Truck,
  Timer,
  Lock,
  Unlock,
} from "lucide-react";

/* ============================================================
   TYPES — Aligned with updated schema
   ============================================================ */
interface OwnershipListing {
  id: string;
  ownershipId: string;
  hallId: string;
  hallName: string;
  sellerId: string;
  sellerName: string;
  sellerKycTier?: string;
  buyerId?: string;
  buyerName?: string;
  percentListed: number;
  pricePerPercent: number;
  totalPrice: number;
  floorPrice: number;
  status: "active" | "pending" | "completed" | "cancelled" | "refunded";
  listedAt: string;
  expiresAt?: string;
  soldAt?: string;
  escrowStartedAt?: string;
  escrowExpiresAt?: string;
  auditHash?: string;
  belowFloorApproved: boolean;
  viewCount: number;
  interestCount: number;
  isFractional: boolean;
}

interface InventoryItem {
  id: string;
  hallId: string;
  hallName: string;
  title: string;
  price: number;
  quantity: number;
  quantitySold: number;
  status: "active" | "inactive" | "sold_out";
  listedAt: string;
  imageUrl?: string | null;
}

interface InventoryOrder {
  id: string;
  inventoryId: string;
  itemTitle: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  quantity: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
  escrowReleasedAt?: string;
  createdAt: string;
  platformFee: number;
  fulfillmentCost: number;
  netToHall: number;
}

interface MarketplaceStats {
  totalOwnershipListings: number;
  activeOwnershipListings: number;
  totalInventoryItems: number;
  activeInventoryItems: number;
  totalFeesCollected: number;
  escrowHeld: number;
  ownershipVolume: number;
  inventoryVolume: number;
  totalIhcpContributed: number;
  totalIhcpRepaid: number;
  activeEscrows: number;
  escrowExpiring24h: number;
}

/* ============================================================
   UTILS
   ============================================================ */
function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n / 100);
}

function formatCurrencyWhole(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n / 100);
}

function getHoursRemaining(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 ? Math.round(diff / (1000 * 60 * 60)) : 0;
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    refunded: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    inactive: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    sold_out: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };
  return map[status] || "bg-slate-500/10 text-slate-400";
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function AdminMarketplacePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [ownershipListings, setOwnershipListings] = useState<OwnershipListing[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryOrders, setInventoryOrders] = useState<InventoryOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("listedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedListing, setSelectedListing] = useState<OwnershipListing | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<InventoryOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/marketplace");
      if (!res.ok) throw new Error("Failed to fetch marketplace data");
      const data = await res.json();
      setStats(data.stats);
      setOwnershipListings(data.ownershipListings || []);
      setInventoryItems(data.inventoryItems || []);
      setInventoryOrders(data.inventoryOrders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (
    type: "cancel" | "release" | "refund",
    id: string,
    marketType: "ownership" | "inventory"
  ) => {
    setActionLoading(`${type}-${id}`);
    try {
      let endpoint: string;
      if (marketType === "ownership") {
        endpoint = `/api/marketplace/ownership/${id}/${type}`;
      } else {
        // Inventory orders are managed via admin order endpoint
        endpoint = `/api/admin/marketplace/orders/${id}`;
      }

      const body = marketType === "inventory" ? JSON.stringify({ action: type }) : undefined;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: marketType === "inventory" ? { "Content-Type": "application/json" } : undefined,
        body,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Action failed");
      }

      fetchMarketplaceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOwnership = ownershipListings
    .filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          l.hallName?.toLowerCase().includes(q) ||
          l.sellerName?.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortBy as keyof OwnershipListing];
      const bVal = b[sortBy as keyof OwnershipListing];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const filteredInventory = inventoryItems
    .filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          i.title?.toLowerCase().includes(q) ||
          i.hallName?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortBy as keyof InventoryItem];
      const bVal = b[sortBy as keyof InventoryItem];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-950 min-h-screen">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-400 hover:text-red-300"
            onClick={() => setError(null)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">8th Ledger Exchange</h1>
          <p className="text-slate-400 mt-1">
            Monitor ownership trades, inventory sales, escrow flows, and IHCP activity
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-2"
        >
          <Shield className="h-4 w-4 mr-2" />
          Admin Command
        </Badge>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Ownership Listings</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats?.activeOwnershipListings || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  of {stats?.totalOwnershipListings || 0} total
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-cyan-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Inventory Items</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats?.activeInventoryItems || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  of {stats?.totalInventoryItems || 0} total
                </p>
              </div>
              <Package className="h-8 w-8 text-emerald-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Fees Collected</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrencyWhole(stats?.totalFeesCollected || 0)}
                </p>
                <p className="text-xs text-emerald-500 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  All time
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Escrow Held</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrencyWhole(stats?.escrowHeld || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats?.activeEscrows || 0} active holds
                </p>
              </div>
              <Clock className="h-8 w-8 text-violet-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Ownership Volume</p>
                <p className="text-xl font-bold text-white mt-1">
                  {formatCurrencyWhole(stats?.ownershipVolume || 0)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-cyan-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Inventory Volume</p>
                <p className="text-xl font-bold text-white mt-1">
                  {formatCurrencyWhole(stats?.inventoryVolume || 0)}
                </p>
              </div>
              <Package className="h-6 w-6 text-emerald-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">IHCP Pool</p>
                <p className="text-xl font-bold text-violet-400 mt-1">
                  {formatCurrencyWhole((stats?.totalIhcpContributed || 0) - (stats?.totalIhcpRepaid || 0))}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatCurrencyWhole(stats?.totalIhcpContributed || 0)} contributed · {formatCurrencyWhole(stats?.totalIhcpRepaid || 0)} repaid
                </p>
              </div>
              <Wallet className="h-6 w-6 text-violet-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escrow Alert */}
      {(stats?.escrowExpiring24h || 0) > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Timer className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">
              {stats?.escrowExpiring24h} escrow(s) expiring within 24 hours
            </p>
            <p className="text-xs text-amber-300/60">
              Review pending ownership and inventory orders for release or refund
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={() => setStatusFilter("pending")}
          >
            View Pending
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search listings, halls, sellers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="border-slate-800 text-slate-400"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <ArrowUpDown className="h-4 w-4 mr-2" />
          {sortOrder === "asc" ? "Oldest First" : "Newest First"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ownership" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger
            value="ownership"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ownership Market
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
          >
            <Package className="h-4 w-4 mr-2" />
            Inventory Market
          </TabsTrigger>
        </TabsList>

        {/* Ownership Tab */}
        <TabsContent value="ownership" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Ownership Listings</CardTitle>
              <CardDescription className="text-slate-400">
                PAC trades across all halls. 1% fee on full sales, 2% on fractional. Floor = Dynamic Valuation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Hall</TableHead>
                    <TableHead className="text-slate-400">Seller</TableHead>
                    <TableHead className="text-slate-400">%</TableHead>
                    <TableHead className="text-slate-400">Ask/1%</TableHead>
                    <TableHead className="text-slate-400">Floor</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Escrow</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwnership.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-slate-500 py-8"
                      >
                        No ownership listings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOwnership.map((listing) => {
                      const hoursLeft = getHoursRemaining(listing.escrowExpiresAt);
                      const isBelowFloor = listing.pricePerPercent < listing.floorPrice && !listing.belowFloorApproved;
                      return (
                        <TableRow
                          key={listing.id}
                          className="border-slate-800 hover:bg-slate-800/30"
                        >
                          <TableCell className="text-white font-medium">
                            <div className="flex flex-col">
                              <span>{listing.hallName || `Hall ${listing.hallId.slice(0, 8)}`}</span>
                              {listing.isFractional && (
                                <span className="text-[10px] text-violet-400">Fractional</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <div className="flex flex-col">
                              <span>{listing.sellerName || listing.sellerId.slice(0, 8)}</span>
                              <span className="text-[10px] text-slate-500">KYC: {listing.sellerKycTier || "unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-cyan-400 font-mono">
                            {listing.percentListed}%
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="flex flex-col">
                              <span>{formatCurrency(listing.pricePerPercent)}</span>
                              {isBelowFloor && (
                                <span className="text-[10px] text-red-400 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Below floor
                                </span>
                              )}
                              {listing.belowFloorApproved && (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                  <Unlock className="h-3 w-3" />
                                  Hall approved
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {formatCurrency(listing.floorPrice)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadge(listing.status)}
                            >
                              {listing.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {hoursLeft !== null ? (
                              <span className={hoursLeft <= 24 ? "text-amber-400" : "text-slate-400"}>
                                <Timer className="h-3 w-3 inline mr-1" />
                                {hoursLeft}h left
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                onClick={() => {
                                  setSelectedListing(listing);
                                  setDetailOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {listing.status === "active" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                  onClick={() =>
                                    handleAction("cancel", listing.id, "ownership")
                                  }
                                  disabled={actionLoading === `cancel-${listing.id}`}
                                >
                                  {actionLoading === `cancel-${listing.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              {listing.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300"
                                    onClick={() =>
                                      handleAction("release", listing.id, "ownership")
                                    }
                                    disabled={
                                      actionLoading === `release-${listing.id}`
                                    }
                                  >
                                    {actionLoading === `release-${listing.id}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300"
                                    onClick={() =>
                                      handleAction("refund", listing.id, "ownership")
                                    }
                                    disabled={
                                      actionLoading === `refund-${listing.id}`
                                    }
                                  >
                                    {actionLoading === `refund-${listing.id}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="mt-6 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Inventory Items</CardTitle>
              <CardDescription className="text-slate-400">
                Products listed by halls. 5% platform fee + fulfillment on sales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Product</TableHead>
                    <TableHead className="text-slate-400">Hall</TableHead>
                    <TableHead className="text-slate-400">Price</TableHead>
                    <TableHead className="text-slate-400">Stock</TableHead>
                    <TableHead className="text-slate-400">Sold</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Listed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-slate-500 py-8"
                      >
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border-slate-800 hover:bg-slate-800/30"
                      >
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center gap-2">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center">
                                <Package className="h-4 w-4 text-slate-600" />
                              </div>
                            )}
                            {item.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {item.hallName || `Hall ${item.hallId.slice(0, 8)}`}
                        </TableCell>
                        <TableCell className="text-emerald-400">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-cyan-400">
                          {item.quantitySold}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusBadge(item.status)}
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {new Date(item.listedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Inventory Orders */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Inventory Orders</CardTitle>
              <CardDescription className="text-slate-400">
                Recent purchases and escrow status. 48-hour hold period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Item</TableHead>
                    <TableHead className="text-slate-400">Buyer</TableHead>
                    <TableHead className="text-slate-400">Qty</TableHead>
                    <TableHead className="text-slate-400">Total</TableHead>
                    <TableHead className="text-slate-400">Net to Hall</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Escrow</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-slate-500 py-8"
                      >
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventoryOrders.map((order) => {
                      const hoursLeft = getHoursRemaining(order.escrowReleasedAt);
                      return (
                        <TableRow
                          key={order.id}
                          className="border-slate-800 hover:bg-slate-800/30"
                        >
                          <TableCell className="text-white font-medium">
                            {order.itemTitle}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {order.buyerName || order.buyerId.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {order.quantity}
                          </TableCell>
                          <TableCell className="text-emerald-400">
                            {formatCurrency(order.amount)}
                          </TableCell>
                          <TableCell className="text-violet-400">
                            {formatCurrency(order.netToHall)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadge(order.status)}
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {hoursLeft !== null ? (
                              <span className={hoursLeft <= 24 ? "text-amber-400" : "text-slate-400"}>
                                <Timer className="h-3 w-3 inline mr-1" />
                                {hoursLeft}h
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setOrderDetailOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {order.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300"
                                    onClick={() =>
                                      handleAction("release", order.id, "inventory")
                                    }
                                    disabled={
                                      actionLoading === `release-${order.id}`
                                    }
                                  >
                                    {actionLoading === `release-${order.id}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300"
                                    onClick={() =>
                                      handleAction("refund", order.id, "inventory")
                                    }
                                    disabled={
                                      actionLoading === `refund-${order.id}`
                                    }
                                  >
                                    {actionLoading === `refund-${order.id}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ownership Listing Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Full ownership listing information
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Listing ID</p>
                  <p className="text-white font-mono text-xs">{selectedListing.id}</p>
                </div>
                <div>
                  <p className="text-slate-500">Hall</p>
                  <p className="text-white">{selectedListing.hallName || selectedListing.hallId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Seller</p>
                  <p className="text-white">{selectedListing.sellerName || selectedListing.sellerId}</p>
                  <p className="text-[10px] text-slate-500">KYC: {selectedListing.sellerKycTier || "unknown"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Ownership</p>
                  <p className="text-cyan-400">{selectedListing.percentListed}%</p>
                  {selectedListing.isFractional && (
                    <p className="text-[10px] text-violet-400">Fractional sale</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-500">Ask Price / 1%</p>
                  <p className="text-white">{formatCurrency(selectedListing.pricePerPercent)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Floor Price / 1%</p>
                  <p className="text-slate-300">{formatCurrency(selectedListing.floorPrice)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Price</p>
                  <p className="text-white font-semibold">{formatCurrency(selectedListing.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <Badge variant="outline" className={getStatusBadge(selectedListing.status)}>
                    {selectedListing.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-500">Views</p>
                  <p className="text-white">{selectedListing.viewCount}</p>
                </div>
                <div>
                  <p className="text-slate-500">Interest</p>
                  <p className="text-white">{selectedListing.interestCount}</p>
                </div>
              </div>

              {selectedListing.auditHash && (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Audit Hash
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 break-all">
                    {selectedListing.auditHash}
                  </p>
                </div>
              )}

              {selectedListing.escrowStartedAt && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Escrow Active
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Started: {new Date(selectedListing.escrowStartedAt).toLocaleString()}
                  </p>
                  {selectedListing.escrowExpiresAt && (
                    <p className="text-slate-400 text-xs">
                      Expires: {new Date(selectedListing.escrowExpiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {selectedListing.buyerName && (
                <div>
                  <p className="text-slate-500 text-sm">Buyer</p>
                  <p className="text-white">{selectedListing.buyerName}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inventory Order Detail Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Inventory purchase with fee breakdown
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Order ID</p>
                  <p className="text-white font-mono text-xs">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-slate-500">Item</p>
                  <p className="text-white">{selectedOrder.itemTitle}</p>
                </div>
                <div>
                  <p className="text-slate-500">Buyer</p>
                  <p className="text-white">{selectedOrder.buyerName || selectedOrder.buyerId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Quantity</p>
                  <p className="text-white">{selectedOrder.quantity}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Item Total</span>
                  <span className="text-white">{formatCurrency(selectedOrder.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Platform Fee (5%)
                  </span>
                  <span className="text-cyan-400">{formatCurrency(selectedOrder.platformFee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Fulfillment
                  </span>
                  <span className="text-amber-400">{formatCurrency(selectedOrder.fulfillmentCost)}</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-white">Net to Hall Treasury</span>
                  <span className="text-emerald-400">{formatCurrency(selectedOrder.netToHall)}</span>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-sm mb-1">Status</p>
                <Badge variant="outline" className={getStatusBadge(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </div>

              {selectedOrder.escrowReleasedAt && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Escrow Released
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {new Date(selectedOrder.escrowReleasedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}