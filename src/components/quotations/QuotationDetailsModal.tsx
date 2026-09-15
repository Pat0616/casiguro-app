// casiguro-app/src/components/quotations/QuotationDetailsModal.tsx
import React, { useState } from "react";
import {
  FileText,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Send,
  AlertTriangle,
  Lock,
  Boxes,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import type { Quotation, Order } from "@/types";
import {
  updateQuotationStatus,
  acceptAndConvertToOrder,
} from "@/utils/quotationAPI";
import { GRADIENT } from "@/lib/constants";

function formatCurrency(n: number) {
  return "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface QuotationDetailsModalProps {
  quotation: Quotation | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: (updatedQuote: Quotation) => void;
  onConvertedToOrder: (order: Order) => void;
  onEditAndResend?: (quote: Quotation) => void;
}

export default function QuotationDetailsModal({
  quotation,
  open,
  onClose,
  onStatusUpdated,
  onConvertedToOrder,
  onEditAndResend,
}: QuotationDetailsModalProps) {
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Conversion prompt modal state
  const [showConvertPrompt, setShowConvertPrompt] = useState(false);
  const [convertDueDate, setConvertDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [convertNotes, setConvertNotes] = useState("");

  // Rejection prompt modal state
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!open || !quotation) return null;

  const handleSendQuote = async () => {
    try {
      setLoadingAction(true);
      setActionError(null);
      await updateQuotationStatus(quotation.id, "sent");
      onStatusUpdated({ ...quotation, status: "sent" });
    } catch (err: any) {
      console.error("Send quote error:", err);
      setActionError(err.message || "Failed to send quotation");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!rejectionReason.trim()) {
      setActionError("Please provide a reason for the customer rejection.");
      return;
    }
    try {
      setLoadingAction(true);
      setActionError(null);
      await updateQuotationStatus(quotation.id, "rejected", rejectionReason.trim());
      onStatusUpdated({
        ...quotation,
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });
      setShowRejectPrompt(false);
    } catch (err: any) {
      console.error("Reject quote error:", err);
      setActionError(err.message || "Failed to reject quotation");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmConvert = async () => {
    try {
      setLoadingAction(true);
      setActionError(null);
      const res = await acceptAndConvertToOrder(quotation.id, {
        dueDate: convertDueDate,
        notes: convertNotes.trim() || undefined,
      });

      onConvertedToOrder(res.order);
      onStatusUpdated({
        ...quotation,
        status: "accepted",
        convertedOrderId: res.order.id,
        convertedOrderRef: res.order.refNo,
      });
      setShowConvertPrompt(false);
      onClose();
    } catch (err: any) {
      console.error("Convert quote error:", err);
      setActionError(err.message || "Failed to convert quotation to order");
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-500" />
            Draft Proposal
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
            <Send className="h-3 w-3 text-sky-600" />
            Sent to Customer
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Accepted & Converted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            Rejected
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 font-mono">{quotation.quoteNo}</span>
              {getStatusBadge(quotation.status)}
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Quotation: {quotation.customerName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {actionError && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
        )}

        {/* Accepted Banner */}
        {quotation.status === "accepted" && (
          <div className="mt-4 rounded-xl bg-emerald-50/80 p-3.5 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-emerald-700" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Locked Historical Quotation Record</p>
                <p className="text-[11px] text-emerald-700">
                  This proposal was officially accepted and converted into Operational Order{" "}
                  <span className="font-mono font-bold">{quotation.convertedOrderRef || "Active Order"}</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rejected Banner */}
        {quotation.status === "rejected" && (
          <div className="mt-4 rounded-xl bg-rose-50/80 p-3.5 border border-rose-200">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
              <XCircle className="h-4 w-4 text-rose-600" />
              Quotation Rejected by Customer
            </div>
            {quotation.rejectionReason && (
              <p className="text-xs text-rose-700 mt-1 pl-6">
                Reason: "{quotation.rejectionReason}"
              </p>
            )}
          </div>
        )}

        {/* Expired Banner */}
        {quotation.status === "expired" && (
          <div className="mt-4 rounded-xl bg-amber-50/80 p-3.5 border border-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div className="text-xs text-amber-900">
              This quotation reached its validity deadline (
              <span className="font-semibold">{quotation.validUntil}</span>) without customer acceptance.
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                <span className="font-semibold text-slate-900">{quotation.customerName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                <span className="font-semibold text-slate-900">
                  {quotation.contactNumber || "No contact info"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Valid Until</span>
                <span className="font-semibold text-slate-900">{quotation.validUntil}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-600 flex justify-between">
              <span>Itemized Deliverables ({quotation.items.length})</span>
              <span>Financial Snapshot</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[11px] text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Deliverable</th>
                    <th className="px-4 py-2.5">Type & Category</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Base Ref Price</th>
                    <th className="px-4 py-2.5 text-right">Agreed Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {quotation.items.map((it, idx) => {
                    const hasAdjustment =
                      !it.isCustom && it.basePrice > 0 && Math.abs(it.finalUnitPrice - it.basePrice) > 0.001;

                    return (
                      <tr key={it.id || idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{it.itemName}</div>
                          {it.itemDescription && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{it.itemDescription}</div>
                          )}
                          {hasAdjustment && it.priceAdjustmentReason && (
                            <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                              <span>Reason: {it.priceAdjustmentReason}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {it.itemType === "service" ? (
                              <Briefcase className="h-3 w-3 text-sky-600" />
                            ) : (
                              <Boxes className="h-3 w-3 text-pink-600" />
                            )}
                            {it.category || "General"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold">{it.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                          {it.isCustom ? "Custom" : formatCurrency(it.basePrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(it.finalUnitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-700">Quotation Grand Total:</span>
              <span className="font-mono font-extrabold text-base text-pink-700">
                {formatCurrency(quotation.totalAmount)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="rounded-xl border border-slate-200 p-4 text-xs bg-slate-50/50">
              <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Scope & Agreement Notes
              </span>
              <p className="text-slate-600 whitespace-pre-line">{quotation.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-slate-400">Created by {quotation.createdBy || "Staff"}</div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Close
            </button>

            {/* If Draft: Allow Sending */}
            {quotation.status === "draft" && (
              <button
                type="button"
                onClick={handleSendQuote}
                disabled={loadingAction}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 ${GRADIENT}`}
              >
                <Send className="h-3.5 w-3.5" />
                {loadingAction ? "Sending..." : "Send Proposal to Customer"}
              </button>
            )}

            {/* If Sent: Accept & Convert or Reject */}
            {quotation.status === "sent" && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectPrompt(true)}
                  disabled={loadingAction}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                >
                  Reject Quote
                </button>
                <button
                  type="button"
                  onClick={() => setShowConvertPrompt(true)}
                  disabled={loadingAction}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 ${GRADIENT}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Accept & Convert to Order
                </button>
              </>
            )}

            {/* If Rejected: Allow Edit & Resend */}
            {quotation.status === "rejected" && onEditAndResend && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditAndResend(quotation);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 ${GRADIENT}`}
              >
                Edit & Resend Proposal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modal: Conversion to Order Prompt */}
      {showConvertPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-100">
            <h3 className="text-base font-bold text-slate-900">Accept Proposal & Create Order</h3>
            <p className="text-xs text-slate-500 mt-1">
              This will atomically commit an operational transaction (Order) with all snapshot line items.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Production Due Date *</label>
                <input
                  type="date"
                  required
                  value={convertDueDate}
                  onChange={(e) => setConvertDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Order Production Notes</label>
                <textarea
                  rows={2}
                  placeholder="Special handling instructions..."
                  value={convertNotes}
                  onChange={(e) => setConvertNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConvertPrompt(false)}
                className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConvert}
                disabled={loadingAction}
                className={`rounded-xl px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 ${GRADIENT}`}
              >
                {loadingAction ? "Converting..." : "Confirm & Convert"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Rejection Reason Prompt */}
      {showRejectPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-100">
            <h3 className="text-base font-bold text-slate-900">Record Quotation Rejection</h3>
            <p className="text-xs text-slate-500 mt-1">
              Please enter the customer's feedback or reason for not accepting the quotation.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Budget exceeded, competitor selected, specifications changed..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRejectPrompt(false)}
                className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectQuote}
                disabled={loadingAction}
                className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                {loadingAction ? "Rejecting..." : "Record Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
