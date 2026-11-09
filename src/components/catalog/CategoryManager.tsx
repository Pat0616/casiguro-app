import { FormEvent, useState } from "react";
import { AlertCircle, Edit2, FolderPlus, Loader2, Plus, Tags, Trash2, X } from "lucide-react";
import type { Category } from "@/types";
import { MOBILE_CARD_LIST } from "@/lib/constants";
import { createCategory, deleteCategory, updateCategory } from "@/utils/categoryAPI";

interface CategoryManagerProps {
  categories: Category[];
  loading: boolean;
  error: string | null;
  // Called after a create / rename / delete so the page can reload categories and items
  onChanged: () => void | Promise<void>;
}

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

// The Categories section of the Catalog page. Categories are only created here.
export default function CategoryManager({ categories, loading, error, onChanged }: CategoryManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openForm = (category: Category | null) => {
    setEditing(category);
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) return setFormError("Enter a category name.");
    const duplicate = categories.find((c) => c.id !== editing?.id && c.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) return setFormError(`A category named "${duplicate.name}" already exists.`);

    try {
      setSaving(true);
      setFormError(null);
      const payload = { name: trimmed, description: description.trim() };
      if (editing) await updateCategory(editing.id, payload);
      else await createCategory(payload);
      setFormOpen(false);
      setEditing(null);
      await onChanged();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      await onChanged();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  };

  const inUse = (category: Category) => category.productCount > 0 || category.orderCount > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Categories</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Group catalog items. Items without a category show as <span className="font-semibold">General</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {loading ? (
        <p className="p-12 text-center text-sm text-slate-500">Loading categories...</p>
      ) : error ? (
        <div className="p-12 text-center text-sm text-rose-500">
          <AlertCircle className="mx-auto mb-2 h-6 w-6" />
          {error}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center">
          <Tags className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No categories yet</p>
          <p className="mt-1 text-xs text-slate-500">Create your first category, then assign it to catalog items.</p>
        </div>
      ) : (
        <>
        {/* Phones: one card per category instead of a sideways-scrolling table */}
        <ul className={`${MOBILE_CARD_LIST} md:hidden`}>
          {categories.map((category) => (
            <li key={category.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{category.name}</p>
                {category.description && <p className="mt-0.5 text-xs text-slate-500">{category.description}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {category.productCount} item{category.productCount === 1 ? "" : "s"} · {category.orderCount} order{category.orderCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openForm(category)}
                  aria-label={`Edit ${category.name}`}
                  className="rounded-md p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-700"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(category);
                    setDeleteError(null);
                  }}
                  aria-label={`Delete ${category.name}`}
                  className="rounded-md p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-left">Description</th>
                <th className="w-24 px-4 py-2.5 text-center">Items</th>
                <th className="w-24 px-4 py-2.5 text-center">Orders</th>
                <th className="w-24 px-4 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-900">{category.name}</td>
                  <td className="px-4 py-3 text-slate-500">{category.description || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-700">{category.productCount}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-700">{category.orderCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openForm(category)}
                        aria-label={`Edit ${category.name}`}
                        title="Edit"
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-sky-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(category);
                          setDeleteError(null);
                        }}
                        aria-label={`Delete ${category.name}`}
                        title={inUse(category) ? "In use; can't be deleted" : "Delete"}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Add / edit */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && closeForm()}
        >
          <form
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
            className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                  <FolderPlus className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 id="category-form-title" className="text-lg font-bold text-slate-900">
                  {editing ? "Edit Category" : "Add Category"}
                </h2>
              </div>
              <button type="button" onClick={closeForm} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-slate-700">
                Name <span className="text-rose-500">*</span>
                <input
                  autoFocus
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Apparel, Signage, Stickers & Labels"
                  className={`${inputClass} mt-1 font-normal`}
                />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Description <span className="font-normal text-slate-400">(optional)</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What belongs in this category"
                  className={`${inputClass} mt-1 resize-none font-normal`}
                />
              </label>
              {editing && editing.productCount > 0 && (
                <p className="text-[11px] text-slate-500">
                  Renaming updates the {editing.productCount} catalog item{editing.productCount === 1 ? "" : "s"} in this category.
                  Saved quotations and orders keep the name they were created with.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-wait disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && !deleting && setDeleteTarget(null)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="delete-category-title" className="text-lg font-bold text-slate-900">Delete category?</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {inUse(deleteTarget) ? (
                    <>
                      <span className="font-semibold text-slate-900">{deleteTarget.name}</span> is still used by{" "}
                      {[
                        deleteTarget.productCount > 0 && `${deleteTarget.productCount} catalog item${deleteTarget.productCount === 1 ? "" : "s"}`,
                        deleteTarget.orderCount > 0 && `${deleteTarget.orderCount} order${deleteTarget.orderCount === 1 ? "" : "s"}`,
                      ].filter(Boolean).join(" and ")}
                      , so it can't be deleted.{" "}
                      {deleteTarget.productCount > 0
                        ? "Move those items to another category first."
                        : "Orders keep their category, but you can still rename it."}
                    </>
                  ) : (
                    <>
                      Delete <span className="font-semibold text-slate-900">{deleteTarget.name}</span>? No catalog items or orders use it.
                    </>
                  )}
                </p>
              </div>
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
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {inUse(deleteTarget) ? "Close" : "Cancel"}
              </button>
              {!inUse(deleteTarget) && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete category"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
