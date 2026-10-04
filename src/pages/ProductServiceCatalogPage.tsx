// casiguro-app/src/pages/ProductServiceCatalogPage.tsx
import React, { useState, useEffect } from "react";
import {
  PackageCheck,
  Plus,
  Search,
  Edit2,
  CheckCircle,
  XCircle,
  Tag,
  Boxes,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import type { CatalogItem, CatalogItemType } from "@/types";
import {
  getCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  toggleCatalogItemStatus,
  type CatalogItemPayload,
} from "@/utils/catalogAPI";
import { CATEGORIES } from "@/lib/constants";
import Badge from "@/components/ui/Badge";

function formatCurrency(n: number) {
  return "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProductServiceCatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "service">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState<CatalogItemPayload>({
    name: "",
    type: "product",
    basePrice: 0,
    description: "",
    categoryId: null,
    isStockItem: false,
    isActive: true,
  });
  const [formCategoryName, setFormCategoryName] = useState("Apparel");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCatalogItems({ includeInactive: true });
      setItems(data);
    } catch (err: any) {
      console.error("Failed to load catalog items:", err);
      setError(err.message || "Failed to load catalog items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      type: "product",
      basePrice: 0,
      description: "",
      categoryId: null,
      isStockItem: false,
      isActive: true,
    });
    setFormCategoryName(CATEGORIES[0] || "General");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      basePrice: item.basePrice,
      description: item.description || "",
      categoryId: item.categoryId || null,
      isStockItem: item.isStockItem,
      isActive: item.isActive,
    });
    setFormCategoryName(item.categoryName || "General");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Item name is required.");
      return;
    }
    if (formData.basePrice < 0) {
      setFormError("Base price cannot be negative.");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      const payload: CatalogItemPayload = {
        ...formData,
        categoryId: formCategoryName,
      };

      if (editingItem) {
        await updateCatalogItem(editingItem.id, payload);
      } else {
        await createCatalogItem(payload);
      }

      handleCloseModal();
      await fetchItems();
    } catch (err: any) {
      console.error("Save catalog item error:", err);
      setFormError(err.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: CatalogItem) => {
    try {
      const res = await toggleCatalogItemStatus(item.id, !item.isActive);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: res.isActive } : i))
      );
    } catch (err: any) {
      console.error("Toggle status error:", err);
      alert(`Failed to update status: ${err.message || "Error"}`);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.isActive) ||
      (statusFilter === "inactive" && !item.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Product & Service Catalog
            </h1>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
              Admin Exclusive
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Official deliverable master registry and reference pricing snapshots for CASIGURO Enterprises, Inc.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          Add Catalog Item
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setTypeFilter("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter("product")}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === "product" ? "bg-white text-sky-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Boxes className="h-3 w-3" />
              Products
            </button>
            <button
              onClick={() => setTypeFilter("service")}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === "service" ? "bg-white text-sky-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="h-3 w-3" />
              Services
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === "active" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === "inactive" ? "bg-white text-slate-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading catalog items...</div>
        ) : error ? (
          <div className="p-12 text-center text-sm text-rose-500">
            <AlertCircle className="mx-auto h-6 w-6 mb-2" />
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No catalog items found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Item Name & Description</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-right">Base Reference Price</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      {item.description ? (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</div>
                      ) : (
                        <div className="text-xs text-slate-400 italic mt-0.5">No description provided</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.type === "service" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 border border-sky-200">
                          <Briefcase className="h-3 w-3" />
                          Service
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                          <Boxes className="h-3 w-3" />
                          Product
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {item.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(item.basePrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 border border-slate-200">
                          <XCircle className="h-3 w-3 text-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="Edit Item"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
                            item.isActive
                              ? "text-slate-600 hover:bg-slate-100 border-slate-200"
                              : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          }`}
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900">
              {editingItem ? "Edit Catalog Item" : "Add Catalog Item"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reference deliverables will be available for employee multi-item quotation creation.
            </p>

            {formError && (
              <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sublimation Full Jersey, Tarpaulin Printing"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CatalogItemType })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="product">Product (Physical Good)</option>
                    <option value="service">Service (Labor / Design)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategoryName}
                    onChange={(e) => setFormCategoryName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Base Reference Price (₱) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Acts as the baseline price snapshot. Employees must provide a reason if altering this price in quotations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Specifications, material details, dimensions..."
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <span>Active in Catalog</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isStockItem}
                    onChange={(e) => setFormData({ ...formData, isStockItem: e.target.checked })}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <span>Stock Inventory Item</span>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingItem ? "Update Item" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

