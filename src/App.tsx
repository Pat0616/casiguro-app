import { useState } from "react";
import { MOCK_NOTIFICATIONS, MOCK_ORDERS } from "@/data/mockData";
import { NOW, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { formatCurrency, isoDate } from "@/lib/utils";
import type { AppNotification, NewOrderFormData, Order, OrderUpdatePayload, PageKey } from "@/types";
import AppShell from "@/components/layout/AppShell";
import Toast from "@/components/ui/Toast";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import OrderManagementPage from "@/pages/OrderManagementPage";
import ProductionMonitoringPage from "@/pages/ProductionMonitoringPage";
import CompletedTransactionsPage from "@/pages/CompletedTransactionsPage";
import CustomerOverviewPage from "@/pages/CustomerOverviewPage";
import StatisticsPage from "@/pages/StatisticsPage";
import NotificationsPage from "@/pages/NotificationsPage";

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [active, setActive] = useState<PageKey>("dashboard");
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [toast, setToast] = useState("");

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const pushNotification = (entry: Omit<AppNotification, "id" | "timestamp">) => {
    setNotifications((prev) => [{ id: `note-${Date.now()}-${Math.random()}`, timestamp: new Date(NOW.getTime()), ...entry }, ...prev]);
  };

  // --- These two handlers are the seam where real API/DB calls will plug in later. ---

  const handleCreateOrder = (data: NewOrderFormData) => {
    const isStock = data.orderType === "stock";
    const totalPrice = data.quantity * data.unitPrice;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      refNo: `TXN-2026-${String(orders.length + 1).padStart(4, "0")}`,
      customerName: data.customerName,
      contactNumber: data.contactNumber,
      product: data.product,
      category: data.category,
      orderType: data.orderType,
      quantity: data.quantity,
      quantityCompleted: isStock ? data.quantity : 0,
      unitPrice: data.unitPrice,
      totalPrice,
      amountPaid: isStock ? totalPrice : 0,
      balance: isStock ? 0 : totalPrice,
      paymentStatus: isStock ? "paid" : "unpaid",
      status: isStock ? "completed" : "pending",
      notes: data.notes,
      dateOrdered: data.dateOrdered,
      dueDate: data.dueDate,
      dateCompleted: isStock ? data.dateOrdered : undefined,
    };
    setOrders((prev) => [newOrder, ...prev]);
    pushNotification({
      type: "new_order",
      user: "Admin User",
      orderRef: newOrder.refNo,
      customerName: newOrder.customerName,
      detail: `New ${isStock ? "Stock" : "Custom"} Order created — ${newOrder.product} × ${newOrder.quantity}`,
    });
    flashToast(isStock ? "Stock order saved and marked Complete." : "Custom order saved and sent to Production Monitoring.");
  };

  const handleUpdateOrder = (id: string, changes: OrderUpdatePayload) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const totalPrice = changes.quantity * changes.unitPrice;
        const balance = Math.max(totalPrice - changes.amountPaid, 0);
        const updated: Order = {
          ...o,
          ...changes,
          totalPrice,
          balance,
          dateCompleted: changes.status === "completed" ? o.dateCompleted || isoDate(NOW) : o.dateCompleted,
        };

        const diffs: string[] = [];
        if (o.unitPrice !== changes.unitPrice) diffs.push(`Unit Price changed from ${formatCurrency(o.unitPrice)} → ${formatCurrency(changes.unitPrice)}`);
        if (o.amountPaid !== changes.amountPaid) diffs.push(`Amount Paid changed from ${formatCurrency(o.amountPaid)} → ${formatCurrency(changes.amountPaid)}`);
        if (o.quantity !== changes.quantity) diffs.push(`Quantity Required changed from ${o.quantity} → ${changes.quantity}`);
        if (o.quantityCompleted !== changes.quantityCompleted) diffs.push(`Quantity Completed changed from ${o.quantityCompleted} → ${changes.quantityCompleted}`);
        if (o.paymentStatus !== changes.paymentStatus) diffs.push(`Payment Status changed from ${PAYMENT_STATUS[o.paymentStatus].label} → ${PAYMENT_STATUS[changes.paymentStatus].label}`);

        if (o.status !== changes.status) {
          pushNotification({
            type: "status_update",
            user: "Admin User",
            orderRef: o.refNo,
            customerName: o.customerName,
            detail: `Order Status changed from ${ORDER_STATUS[o.status].label} → ${ORDER_STATUS[changes.status].label}`,
          });
        }
        diffs.forEach((d) => {
          pushNotification({ type: "detail_update", user: "Admin User", orderRef: o.refNo, customerName: o.customerName, detail: d });
        });

        return updated;
      })
    );
    flashToast(changes.status === "completed" ? "Order marked Complete and moved to Completed Transactions." : "Order updated successfully.");
  };

  if (!isAuthed) {
    return <LoginPage onLogin={() => setIsAuthed(true)} />;
  }

  const unreadCount = notifications.filter((n) => (NOW.getTime() - n.timestamp.getTime()) / 60000 < 180).length;

  return (
    <>
      <AppShell active={active} onNavigate={setActive} unreadCount={unreadCount} onLogout={() => setIsAuthed(false)}>
        {active === "dashboard" && <DashboardPage orders={orders} />}
        {active === "orders" && <OrderManagementPage orders={orders} onCreateOrder={handleCreateOrder} />}
        {active === "production" && <ProductionMonitoringPage orders={orders} onUpdateOrder={handleUpdateOrder} />}
        {active === "completed" && <CompletedTransactionsPage orders={orders} />}
        {active === "customers" && <CustomerOverviewPage orders={orders} />}
        {active === "statistics" && <StatisticsPage orders={orders} />}
        {active === "notifications" && <NotificationsPage notifications={notifications} />}
      </AppShell>
      <Toast message={toast} />
    </>
  );
}
