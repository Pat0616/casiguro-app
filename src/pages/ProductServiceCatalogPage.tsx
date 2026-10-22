// casiguro-app/src/pages/ProductServiceCatalogPage.tsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  Boxes,
  Briefcase,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import type { CatalogItem, CatalogItemType } from "@/types";
import {
  getCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  toggleCatalogItemStatus,
  type CatalogItemPayload,
} from "@/utils/catalogAPI";
import { CATEGORIES } from "@/lib/constants";
import { uploadImageToCloudinary } from "@/utils/CloudinaryAPI";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // Cloudinary free-plan image limit

function formatCurrency(n: number) {
  return "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProductServiceCatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "service">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState<CatalogItemPayload>({
    name: "",
    type: "product",
    basePrice: 0,
    variants: [],
    description: "",
    imageUrl: null,
    categoryId: null,
    isStockItem: false,
    isActive: true,
  });
  const [formCategoryName, setFormCategoryName] = useState("Apparel");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);
  const availableCategories = Array.from(
    new Set([
      ...items
        .filter((item) => typeFilter === "all" || item.type === typeFilter)
        .map((item) => item.categoryName?.trim())
        .filter((category): category is string => Boolean(category)),
    ])
  ).sort((a, b) => a.localeCompare(b));
  const categoryOptions = Array.from(new Set([...CATEGORIES, ...availableCategories, formCategoryName]));

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCatalogItems({ includeInactive: true });
      setItems(data);
    } catch (err: unknown) {
      console.error("Failed to load catalog items:", err);
      setError(err instanceof Error ? err.message : "Failed to load catalog items");
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
      variants: [],
      description: "",
      imageUrl: null,
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
      variants: item.variants || [],
      description: item.description || "",
      imageUrl: item.imageUrl || null,
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
    setImageDragActive(false);
  };

  const uploadImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError("Only image files can be uploaded.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFormError("Image must be 10 MB or smaller.");
      return;
    }

    try {
      setImageUploading(true);
      setFormError(null);
      const imageUrl = await uploadImageToCloudinary(file);
      setFormData((current) => ({ ...current, imageUrl }));
    } catch (err: unknown) {
      console.error("Catalog image upload error:", err);
      setFormError(err instanceof Error ? err.message : "Failed to upload item image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadImageFile(file);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setImageDragActive(false);
    if (imageUploading || saving) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImageFile(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUploading) {
      setFormError("Wait for the image upload to finish before saving.");
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Item name is required.");
      return;
    }
    if (formData.basePrice < 0) {
      setFormError("Base price cannot be negative.");
      return;
    }
    const variantNames = new Set<string>();
    for (const [index, variant] of (formData.variants || []).entries()) {
      const name = variant.name.trim();
      if (!name) {
        setFormError(`Enter a name for option #${index + 1}.`);
        return;
      }
      if (!Number.isFinite(variant.price) || variant.price < 0) {
        setFormError(`Enter a valid non-negative price for ${name}.`);
        return;
      }
      if (variantNames.has(name.toLowerCase())) {
        setFormError(`Option "${name}" is listed more than once.`);
        return;
      }
      variantNames.add(name.toLowerCase());
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
    } catch (err: unknown) {
      console.error("Save catalog item error:", err);
      setFormError(err instanceof Error ? err.message : "Failed to save item");
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
    } catch (err: unknown) {
      console.error("Toggle status error:", err);
      alert(`Failed to update status: ${err instanceof Error ? err.message : "Error"}`);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    try {
      setDeletingItemId(deleteTarget.id);
      setDeleteError(null);
      await deleteCatalogItem(deleteTarget.id);
      setItems((current) => current.filter((entry) => entry.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      console.error("Delete catalog item error:", err);
      setDeleteError(err instanceof Error ? err.message : "Failed to delete item.");
    } finally {
      setDeletingItemId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      item.categoryName?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.isActive) ||
      (statusFilter === "inactive" && !item.isActive);

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
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
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type filter */}
            <div className="flex items-center gap-1 border-b border-slate-200 sm:border-0" aria-label="Catalog item type">
              <button
                onClick={() => {
                  setTypeFilter("all");
                  setCategoryFilter("all");
                }}
                aria-pressed={typeFilter === "all"}
                className={`border-b-2 px-3 py-2 text-xs font-semibold transition sm:rounded-md sm:border-0 sm:py-1.5 ${
                  typeFilter === "all" ? "border-sky-600 text-sky-700 sm:bg-sky-50" : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => {
                  setTypeFilter("product");
                  setCategoryFilter("all");
                }}
                aria-pressed={typeFilter === "product"}
                className={`flex items-center gap-1 border-b-2 px-3 py-2 text-xs font-semibold transition sm:rounded-md sm:border-0 sm:py-1.5 ${
                  typeFilter === "product" ? "border-sky-600 text-sky-700 sm:bg-sky-50" : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Boxes className="h-3 w-3" />
                Products
              </button>
              <button
                onClick={() => {
                  setTypeFilter("service");
                  setCategoryFilter("all");
                }}
                aria-pressed={typeFilter === "service"}
                className={`flex items-center gap-1 border-b-2 px-3 py-2 text-xs font-semibold transition sm:rounded-md sm:border-0 sm:py-1.5 ${
                  typeFilter === "service" ? "border-sky-600 text-sky-700 sm:bg-sky-50" : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Briefcase className="h-3 w-3" />
                Services
              </button>
            </div>

            <span className="hidden h-6 w-px bg-slate-200 sm:block" />

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
        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {typeFilter === "product" ? "Product categories" : typeFilter === "service" ? "Service categories" : "Categories"}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["all", ...availableCategories].map((category) => {
              const selected = categoryFilter === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  aria-pressed={selected}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
                  }`}
                >
                  {category === "all" ? "All categories" : category}
                </button>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      {/* Catalog Cards */}
      <div>
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading catalog items...</div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-white p-12 text-center text-sm text-rose-500">
            <AlertCircle className="mx-auto h-6 w-6 mb-2" />
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            No catalog items found matching your filters.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative aspect-[16/10] bg-slate-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <ImageIcon className="h-10 w-10" aria-hidden="true" />
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    item.type === "service" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-700"
                  }`}>
                    {item.type === "service" ? <Briefcase className="h-3 w-3" /> : <Boxes className="h-3 w-3" />}
                    {item.type === "service" ? "Service" : "Product"}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900" title={item.name}>{item.name}</h2>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {item.categoryName}
                      </span>
                    </div>
                    {item.isActive ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </div>
                  <p className="min-h-10 text-sm text-slate-500 line-clamp-2">
                    {item.description || <span className="italic text-slate-400">No description provided</span>}
                  </p>
                  <div className="flex items-end justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Base reference price</p>
                      <p className="mt-0.5 font-mono text-lg font-bold text-slate-900">
                        {item.variants?.length
                          ? `From ${formatCurrency(Math.min(...item.variants.map((variant) => variant.price)))}`
                          : formatCurrency(item.basePrice)}
                      </p>
                      {Boolean(item.variants?.length) && (
                        <p className="text-[11px] text-slate-500">{item.variants?.length} priced options</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        disabled={deletingItemId === item.id}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        title="Edit Item"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        disabled={deletingItemId === item.id}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                          item.isActive
                            ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(item);
                        }}
                        disabled={deletingItemId === item.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-50"
                        title="Delete Item"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingItemId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingItemId) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-catalog-item-title"
            aria-describedby="delete-catalog-item-description"
            className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="delete-catalog-item-title" className="text-lg font-bold text-slate-900">
                  Delete catalog item?
                </h2>
                <p id="delete-catalog-item-description" className="mt-1 text-sm text-slate-600">
                  Remove <span className="font-semibold text-slate-900">{deleteTarget.name}</span> from the catalog?
                  Existing quotations and orders will keep their saved item details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                disabled={Boolean(deletingItemId)}
                aria-label="Close delete confirmation"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {deleteError && (
              <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                disabled={Boolean(deletingItemId)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={Boolean(deletingItemId)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deletingItemId ? "Deleting..." : "Delete item"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
          // A file dropped outside the dropzone would otherwise make the browser open the image
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          <div className="my-4 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
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

            <form onSubmit={handleFormSubmit} className="mt-5">
              <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
                {/* Left: image dropzone */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-700">Item Image</span>
                  <label
                    onDragEnter={(e) => {
                      e.preventDefault();
                      if (!imageUploading && !saving) setImageDragActive(true);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setImageDragActive(false);
                    }}
                    onDrop={handleImageDrop}
                    className={cn(
                      "relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition",
                      imageDragActive
                        ? "border-sky-500 bg-sky-50"
                        : formData.imageUrl
                          ? "border-slate-200 bg-slate-100"
                          : "border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-sky-50/40",
                      (imageUploading || saving) && "pointer-events-none"
                    )}
                  >
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Item preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center px-6 text-center">
                        <ImageIcon className={cn("h-16 w-16", imageDragActive ? "text-sky-500" : "text-slate-300")} aria-hidden="true" />
                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          {imageDragActive ? "Drop the image to upload" : "Drag & drop an image here"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          or <span className="font-semibold text-sky-700">click to browse</span>
                        </p>
                        <p className="mt-3 text-[11px] text-slate-400">PNG, JPG or WEBP · up to 10 MB</p>
                      </div>
                    )}
                    {imageDragActive && formData.imageUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-sky-600/70 text-sm font-semibold text-white">
                        Drop to replace image
                      </div>
                    )}
                    {imageUploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 text-sm font-semibold text-slate-700">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                        Uploading image...
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                      disabled={imageUploading || saving}
                    />
                  </label>
                  {formData.imageUrl ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400">Click or drop a new image to replace it.</p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: null })}
                        disabled={imageUploading || saving}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">Optional. Shown in the catalog and the quotation item picker.</p>
                  )}
                </div>

                {/* Right: item details */}
                <div className="space-y-4">
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
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Priced options</label>
                        <p className="mt-0.5 text-[11px] text-slate-400">Optional sizes or dimensions with their own prices.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((current) => ({
                            ...current,
                            variants: [...(current.variants || []), { name: "", price: 0 }],
                          }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
                      >
                        Add option
                      </button>
                    </div>
                    {(formData.variants || []).map((variant, index) => (
                      <div key={index} className="mb-2 grid grid-cols-[minmax(0,1fr)_120px_auto] items-center gap-2">
                        <input
                          value={variant.name}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              variants: (current.variants || []).map((option, optionIndex) =>
                                optionIndex === index ? { ...option, name: event.target.value } : option
                              ),
                            }))
                          }
                          aria-label={`Option ${index + 1} name`}
                          placeholder="e.g. Small or 4×6"
                          className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.price}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              variants: (current.variants || []).map((option, optionIndex) =>
                                optionIndex === index
                                  ? { ...option, price: Number(event.target.value) || 0 }
                                  : option
                              ),
                            }))
                          }
                          aria-label={`Option ${index + 1} price`}
                          placeholder="Price"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((current) => ({
                              ...current,
                              variants: (current.variants || []).filter((_, optionIndex) => optionIndex !== index),
                            }))
                          }
                          aria-label={`Remove option ${index + 1}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
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
                      Used when no priced options are configured. Selected option prices are used in quotations and orders.
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
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving || imageUploading}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || imageUploading}
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
