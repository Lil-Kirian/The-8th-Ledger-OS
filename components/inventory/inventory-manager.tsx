// components/inventory/inventory-manager.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Boxes,
  Tag,
  Image as ImageIcon,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Loader2,
  ImagePlus,
  Calculator,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInventory } from "@/hooks/use-inventory";

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
  images?: string | null;
  tags?: string | null;
  specs?: string | null;
}

interface InventoryManagerProps {
  hallId: string;
  isAdmin?: boolean;
  canManage?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function InventoryManager({
  hallId,
  isAdmin = false,
  canManage = false,
  onSuccess,
  onError,
}: InventoryManagerProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState<InventoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const canEditInventory = isAdmin || canManage;

  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    costOfGoods: "",
    reorderThreshold: "",
    imageUrl: "",
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    costOfGoods: "",
    reorderThreshold: "",
    imageUrl: "",
  });

  const { data: inventoryData, isLoading, refetch } = useInventory(hallId);
  const items: InventoryItem[] = inventoryData?.items || [];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalStockValue = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalSoldValue = items.reduce(
    (sum, item) => sum + item.price * item.quantitySold,
    0,
  );
  const totalCOGS = items.reduce(
    (sum, item) => sum + item.costOfGoods * item.quantitySold,
    0,
  );
  const totalProfit = totalSoldValue - totalCOGS;
  const lowStockItems = items.filter(
    (item) => item.quantity <= item.reorderThreshold && item.quantity > 0,
  );
  const outOfStockItems = items.filter((item) => item.quantity === 0);

  const handleAddItem = async () => {
    const price = parseFloat(newItem.price);
    const quantity = parseInt(newItem.quantity);
    const costOfGoods = parseFloat(newItem.costOfGoods || "0");
    const reorderThreshold = parseInt(newItem.reorderThreshold || "0");

    if (!newItem.title || !price || !quantity) {
      setInlineError("Title, price, and quantity are required");
      return;
    }

    setActionLoading("add");
    setInlineError(null);

    try {
      const res = await fetch(`/api/halls/${hallId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newItem.title,
          description: newItem.description,
          price: Math.round(price * 100), // cents
          quantity,
          costOfGoods: Math.round(costOfGoods * 100),
          reorderThreshold,
          imageUrl: newItem.imageUrl || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || data.message || `Failed to add item (${res.status})`,
        );

      setShowAddItem(false);
      setNewItem({
        title: "",
        description: "",
        price: "",
        quantity: "",
        costOfGoods: "",
        reorderThreshold: "",
        imageUrl: "",
      });
      onSuccess?.("Item added to inventory");
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add item";
      setInlineError(msg);
      onError?.(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditItem = async () => {
    if (!showEditItem) return;

    const price = parseFloat(editForm.price);
    const quantity = parseInt(editForm.quantity);
    const costOfGoods = parseFloat(editForm.costOfGoods || "0");
    const reorderThreshold = parseInt(editForm.reorderThreshold || "0");

    if (!editForm.title || !price || quantity < 0) {
      setInlineError("Title and valid price are required");
      return;
    }

    setActionLoading(`edit-${showEditItem.id}`);
    setInlineError(null);

    try {
      const res = await fetch(
        `/api/halls/${hallId}/inventory/${showEditItem.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editForm.title,
            description: editForm.description,
            price: Math.round(price * 100),
            quantity,
            costOfGoods: Math.round(costOfGoods * 100),
            reorderThreshold,
            imageUrl: editForm.imageUrl || null,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || data.message || `Failed to update item (${res.status})`,
        );

      setShowEditItem(null);
      onSuccess?.("Item updated successfully");
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update item";
      setInlineError(msg);
      onError?.(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (item: InventoryItem) => {
    setEditForm({
      title: item.title,
      description: item.description || "",
      price: (item.price / 100).toString(),
      quantity: item.quantity.toString(),
      costOfGoods: (item.costOfGoods / 100).toString(),
      reorderThreshold: item.reorderThreshold.toString(),
      imageUrl: item.imageUrl || "",
    });
    setInlineError(null);
    setShowEditItem(item);
  };

  const handleToggleListing = async (item: InventoryItem) => {
    const newStatus = item.status === "active" ? "inactive" : "active";
    setActionLoading(`toggle-${item.id}`);

    try {
      const res = await fetch(
        `/api/halls/${hallId}/inventory/${item.id}/toggle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error ||
            data.message ||
            `Failed to toggle listing (${res.status})`,
        );

      onSuccess?.(
        newStatus === "active"
          ? "Item listed on marketplace"
          : "Item hidden from marketplace",
      );
      refetch();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to toggle listing";
      onError?.(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteItem = async () => {
    if (!showDeleteConfirm) return;
    setActionLoading(`delete-${showDeleteConfirm.id}`);

    try {
      const res = await fetch(
        `/api/halls/${hallId}/inventory/${showDeleteConfirm.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || data.message || `Failed to delete item (${res.status})`,
        );

      setShowDeleteConfirm(null);
      onSuccess?.("Item removed from inventory");
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete item";
      onError?.(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0)
      return {
        label: "OUT OF STOCK",
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: XCircle,
      };
    if (item.quantity <= item.reorderThreshold)
      return {
        label: "LOW STOCK",
        color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        icon: AlertTriangle,
      };
    return {
      label: "IN STOCK",
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      icon: CheckCircle2,
    };
  };

  const estimatedNet = (() => {
    const price = parseFloat(newItem.price || "0");
    if (!price) return 0;
    const gross = price;
    const platformFee = gross * 0.05;
    const fulfillment = gross * 0.15; // estimated 15% fulfillment
    return Math.max(0, gross - platformFee - fulfillment);
  })();

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Total Items
            </p>
            <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              {outOfStockItems.length} out of stock
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Stock Value
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              ${(totalStockValue / 100).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">At current prices</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Total Sold
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              ${(totalSoldValue / 100).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <p className="text-xs text-emerald-400">Revenue generated</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Net Profit
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              ${(totalProfit / 100).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">After COGS deduction</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="space-y-2">
          {outOfStockItems.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  {outOfStockItems.length} items out of stock
                </p>
                <p className="text-xs text-red-300/70">
                  Restock immediately to resume sales
                </p>
              </div>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  {lowStockItems.length} items at reorder threshold
                </p>
                <p className="text-xs text-amber-300/70">
                  Consider restocking soon
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 w-full sm:w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilterStatus(filterStatus === "all" ? "active" : "all")
            }
            className="border-slate-700 text-slate-400 hover:bg-slate-800"
          >
            <Filter className="w-4 h-4 mr-1" />
            {filterStatus === "all" ? "All" : "Active Only"}
          </Button>
          {canEditInventory && (
            <Button
              size="sm"
              onClick={() => {
                setInlineError(null);
                setShowAddItem(true);
              }}
              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Inventory List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Boxes className="w-4 h-4 text-cyan-500" />
            Inventory Registry
          </CardTitle>
          <CardDescription className="text-slate-400">
            {filteredItems.length} of {items.length} items · Manage stock,
            pricing, and public listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading inventory...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No inventory items</p>
              <p className="text-slate-600 text-xs mt-1">
                {canEditInventory
                  ? "Add items to start selling on the marketplace"
                  : "Hall inventory is empty"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const status = getStockStatus(item);
                const StatusIcon = status.icon;
                const isExpanded = expandedItem === item.id;
                const stockPercent =
                  item.quantity > 0
                    ? Math.min(
                        100,
                        (item.quantity /
                          (item.quantity + item.quantitySold || 1)) *
                          100,
                      )
                    : 0;
                const margin = item.price - item.costOfGoods;
                const marginPercent =
                  item.price > 0 ? Math.round((margin / item.price) * 100) : 0;
                const isToggling = actionLoading === `toggle-${item.id}`;
                const isDeleting = actionLoading === `delete-${item.id}`;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border border-slate-800 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-white truncate">
                            {item.title}
                          </p>
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          {item.status === "active" ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <Eye className="w-3 h-3 mr-1" />
                              Listed
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-700/50 text-slate-400">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {item.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-white">
                          ${(item.price / 100).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.quantitySold} sold · {item.quantity} in stock
                        </p>
                      </div>

                      <div className="w-20 shrink-0">
                        <Progress value={stockPercent} className="h-1.5" />
                        <p className="text-[10px] text-slate-500 mt-1 text-center">
                          {item.quantity} units
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                          onClick={() =>
                            setExpandedItem(isExpanded ? null : item.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>

                        {canEditInventory && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem
                                className="text-slate-300 hover:text-white hover:bg-slate-700"
                                onClick={() => openEdit(item)}
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-slate-300 hover:text-white hover:bg-slate-700"
                                onClick={() => handleToggleListing(item)}
                                disabled={isToggling}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : item.status === "active" ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Hide from Marketplace
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    List on Marketplace
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => setShowDeleteConfirm(item)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
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
                              <p className="text-xs text-slate-500 uppercase">
                                Price
                              </p>
                              <p className="text-white font-medium mt-1">
                                ${(item.price / 100).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">
                                Cost of Goods
                              </p>
                              <p className="text-slate-300 font-medium mt-1">
                                ${(item.costOfGoods / 100).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">
                                Margin
                              </p>
                              <p
                                className={`font-medium mt-1 ${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}
                              >
                                ${(margin / 100).toLocaleString()} (
                                {marginPercent}%)
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">
                                Reorder At
                              </p>
                              <p className="text-amber-400 font-medium mt-1">
                                {item.reorderThreshold} units
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">
                                In Stock
                              </p>
                              <p className="text-white font-medium mt-1">
                                {item.quantity} units
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">
                                Total Sold
                              </p>
                              <p className="text-cyan-400 font-medium mt-1">
                                {item.quantitySold} units
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">
                                Revenue
                              </p>
                              <p className="text-emerald-400 font-medium mt-1">
                                $
                                {(
                                  (item.price * item.quantitySold) /
                                  100
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase">
                                Listed
                              </p>
                              <p className="text-slate-300 font-medium mt-1">
                                {new Date(item.listedAt).toLocaleDateString()}
                              </p>
                            </div>
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

      {/* Add Item Dialog */}
      <Dialog
        open={showAddItem}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddItem(false);
            setInlineError(null);
          }
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-500" />
              Add Inventory Item
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new product to the hall inventory. It will be listed on the
              marketplace once set to active.
            </DialogDescription>
          </DialogHeader>

          {inlineError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{inlineError}</p>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Item Name</Label>
              <Input
                placeholder="e.g., Organic Tomatoes 500g"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Input
                placeholder="Brief description..."
                value={newItem.description}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Image URL</Label>
              <div className="relative">
                <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="https://..."
                  value={newItem.imageUrl}
                  onChange={(e) =>
                    setNewItem({ ...newItem, imageUrl: e.target.value })
                  }
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Price (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, price: e.target.value })
                    }
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem({ ...newItem, quantity: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Cost of Goods (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.costOfGoods}
                    onChange={(e) =>
                      setNewItem({ ...newItem, costOfGoods: e.target.value })
                    }
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Reorder Threshold</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={newItem.reorderThreshold}
                  onChange={(e) =>
                    setNewItem({ ...newItem, reorderThreshold: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Net to Hall Preview */}
            {parseFloat(newItem.price || "0") > 0 && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-start gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-400 font-medium">
                      Estimated Net to Hall Treasury
                    </p>
                    <p className="text-xs text-emerald-300/70">
                      Price ${parseFloat(newItem.price || "0").toFixed(2)} → 5%
                      platform fee ($
                      {(parseFloat(newItem.price || "0") * 0.05).toFixed(2)}) →
                      est. fulfillment →{" "}
                      <span className="text-emerald-400 font-bold">
                        ~${estimatedNet.toFixed(2)} net
                      </span>
                    </p>
                    <p className="text-[10px] text-emerald-300/50 mt-1">
                      Net flows to hall treasury before dividends. Actual
                      fulfillment cost varies.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-sm text-cyan-400 font-medium">
                    Marketplace Listing
                  </p>
                  <p className="text-xs text-cyan-300/70">
                    This item will be added to inventory. Set status to "active"
                    to list it publicly on the 8th Ledger Inventory Marketplace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddItem(false);
                setInlineError(null);
              }}
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
              disabled={actionLoading === "add"}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={actionLoading === "add"}
              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              {actionLoading === "add" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Inventory
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!showEditItem}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditItem(null);
            setInlineError(null);
          }
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-cyan-500" />
              Edit Item
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update inventory item details for {showEditItem?.title}
            </DialogDescription>
          </DialogHeader>

          {inlineError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{inlineError}</p>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Item Name</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Image URL</Label>
              <div className="relative">
                <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={editForm.imageUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, imageUrl: e.target.value })
                  }
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Price (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: e.target.value })
                    }
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Quantity</Label>
                <Input
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) =>
                    setEditForm({ ...editForm, quantity: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Cost of Goods (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.costOfGoods}
                    onChange={(e) =>
                      setEditForm({ ...editForm, costOfGoods: e.target.value })
                    }
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Reorder Threshold</Label>
                <Input
                  type="number"
                  value={editForm.reorderThreshold}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      reorderThreshold: e.target.value,
                    })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditItem(null);
                setInlineError(null);
              }}
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
              disabled={!!actionLoading?.startsWith("edit-")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditItem}
              disabled={!!actionLoading?.startsWith("edit-")}
              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              {actionLoading?.startsWith("edit-") ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) setShowDeleteConfirm(null);
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Remove Item
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to remove{" "}
              <span className="text-white font-medium">
                {showDeleteConfirm?.title}
              </span>{" "}
              from inventory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
              disabled={!!actionLoading?.startsWith("delete-")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteItem}
              disabled={!!actionLoading?.startsWith("delete-")}
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            >
              {actionLoading?.startsWith("delete-") ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
