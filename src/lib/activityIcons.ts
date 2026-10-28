// Icon, colour and short label for each kind of activity, shared by Notifications and the account audit log.
// Colours: green = money in / done, rose = cancel/void/delete/blocked, sky = production, amber = edits & warnings,
// violet = accounts, pink = quotations, slate = sign-ins and neutral events.
import {
  Ban,
  Banknote,
  CalendarX,
  CircleCheckBig,
  Download,
  Eye,
  EyeOff,
  Factory,
  FileCheck2,
  FileOutput,
  FilePen,
  FilePlus2,
  FileText,
  FileX2,
  HandCoins,
  Hourglass,
  KeyRound,
  Landmark,
  Lock,
  LogIn,
  LogOut,
  PackageCheck,
  PackagePlus,
  PenLine,
  Pencil,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShieldPlus,
  ShoppingCart,
  Trash2,
  Undo2,
  UserCheck,
  UserPlus,
  UserX,
  type LucideIcon,
} from "lucide-react";
import type { AuditLogEntry } from "@/types";

export interface ActivityStyle {
  icon: LucideIcon;
  tint: string;
  label: string;
}

const TINT = {
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  pink: "bg-pink-50 text-pink-600",
  teal: "bg-teal-50 text-teal-600",
  slate: "bg-slate-100 text-slate-600",
};

const style = (icon: LucideIcon, tint: string, label: string): ActivityStyle => ({ icon, tint, label });

/** Keyed by activity event: the audit action, made more specific where needed (e.g. order.ready, payment.ewt) */
export const ACTIVITY: Record<string, ActivityStyle> = {
  // Orders & production
  "order.create": style(ShoppingCart, TINT.sky, "Order created"),
  "order.create_from_quotation": style(FileOutput, TINT.sky, "Order from quotation"),
  "order.pending": style(Hourglass, TINT.slate, "Back to pending"),
  "order.in_production": style(Factory, TINT.sky, "Production updated"),
  "order.ready": style(PackageCheck, TINT.violet, "Ready for pickup"),
  "order.completed": style(CircleCheckBig, TINT.green, "Order completed"),
  "order.update": style(PenLine, TINT.amber, "Order edited"),
  "order.documents_update": style(FilePen, TINT.amber, "Documents edited"),
  "order.cancel": style(Ban, TINT.rose, "Order cancelled"),
  // Payments
  "payment.record": style(Banknote, TINT.green, "Payment recorded"),
  "payment.down_payment": style(HandCoins, TINT.green, "Down payment"),
  "payment.ewt": style(Landmark, TINT.teal, "EWT recorded"),
  "payment.void": style(Undo2, TINT.rose, "Payment voided"),
  "payment.update": style(Banknote, TINT.amber, "Payment edited"), // from before the payment log existed
  // Quotations
  "quotation.create": style(FilePlus2, TINT.pink, "Quotation created"),
  "quotation.update": style(FilePen, TINT.pink, "Quotation edited"),
  "quotation.draft": style(FileText, TINT.pink, "Back to draft"),
  "quotation.sent": style(Send, TINT.pink, "Quotation sent"),
  "quotation.accepted": style(FileCheck2, TINT.green, "Quotation accepted"),
  "quotation.rejected": style(FileX2, TINT.rose, "Quotation rejected"),
  "quotation.expired": style(CalendarX, TINT.slate, "Quotation expired"),
  // Catalog
  "catalog.create": style(PackagePlus, TINT.amber, "Item added"),
  "catalog.update": style(Pencil, TINT.amber, "Item edited"),
  "catalog.activate": style(Eye, TINT.amber, "Item activated"),
  "catalog.deactivate": style(EyeOff, TINT.slate, "Item deactivated"),
  "catalog.delete": style(Trash2, TINT.rose, "Item deleted"),
  // Accounts
  "account.register": style(UserPlus, TINT.violet, "Registered"),
  "account.approve": style(UserCheck, TINT.green, "Account approved"),
  "account.reactivate": style(UserCheck, TINT.green, "Account reactivated"),
  "account.reject": style(UserX, TINT.rose, "Registration rejected"),
  "account.deactivate": style(UserX, TINT.rose, "Account deactivated"),
  "account.promote": style(ShieldCheck, TINT.violet, "Promoted to admin"),
  "account.promote_failed": style(ShieldAlert, TINT.rose, "Promotion failed"),
  "account.create_admin": style(ShieldPlus, TINT.violet, "Admin created"),
  "account.audit_export": style(Download, TINT.slate, "Log exported"),
  // Sign-ins
  "auth.login": style(LogIn, TINT.slate, "Signed in"),
  "auth.logout": style(LogOut, TINT.slate, "Signed out"),
  "auth.login_failed": style(KeyRound, TINT.amber, "Wrong password"),
  "auth.login_blocked": style(Lock, TINT.rose, "Sign-in blocked"),
};

const statusTo = (entry: AuditLogEntry) => {
  const to = entry.changes?.status?.to;
  return typeof to === "string" ? to : null;
};

/** The specific event of an audit entry; some actions are split by what changed */
export function auditEvent(entry: AuditLogEntry): string {
  switch (entry.action) {
    case "order.create":
      return / from quotation /.test(entry.description) ? "order.create_from_quotation" : "order.create";
    case "order.production_update":
    case "order.update": {
      const to = statusTo(entry);
      return to ? `order.${to}` : "order.in_production";
    }
    case "payment.record":
      // Descriptions start with (or follow "Recorded ") the payment type label
      if (/(^|Recorded )Down payment/.test(entry.description)) return "payment.down_payment";
      if (/(^|Recorded )EWT/.test(entry.description)) return "payment.ewt";
      return "payment.record";
    case "quotation.accept":
      return "quotation.accepted";
    case "quotation.status_change": {
      const to = statusTo(entry);
      return to ? `quotation.${to}` : "quotation.update";
    }
    case "catalog.status_change":
      return entry.changes?.active?.to ? "catalog.activate" : "catalog.deactivate";
    default:
      return entry.action;
  }
}
