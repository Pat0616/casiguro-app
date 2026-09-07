import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import type { AppNotification, NewOrderFormData, Order, OrderUpdatePayload } from "@/types";
import { getOrders, createOrder, updateOrder } from "@/utils/orderAPI";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/utils/notificationAPI";
import { subscribeToNotifications, subscribeToOrders } from "@/utils/socket";

import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import OrderManagementPage from "@/pages/OrderManagementPage";
import ProductionMonitoringPage from "@/pages/ProductionMonitoringPage";
import CompletedTransactionsPage from "@/pages/CompletedTransactionsPage";
import CustomerOverviewPage from "@/pages/CustomerOverviewPage";
import StatisticsPage from "@/pages/StatisticsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import Toast from "@/components/ui/Toast";

import { AuthProvider, useAuth } from "./context/AuthenticationContext";
import ProtectedRoute from "./routes/ProtectedRoutes";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";

function MainApp() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toast, setToast] = useState("");

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Load orders and persistent notifications from database when authenticated
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [ordersData, notifsData] = await Promise.all([
          getOrders(),
          getNotifications(),
        ]);
        setOrders(ordersData);
        setNotifications(notifsData);
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    };

    loadData();

    // Catch up if user returns from being offline or switches tabs
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener("focus", handleFocus);

    // Subscribe to real-time WebSocket events
    const unsubscribeOrders = subscribeToOrders(
      (newOrder) => {
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      },
      (updatedOrder) => {
        setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      }
    );

    const unsubscribeNotifications = subscribeToNotifications((notif) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      flashToast(`🔔 ${notif.user}: ${notif.detail}`);
    });

    return () => {
      window.removeEventListener("focus", handleFocus);
      unsubscribeOrders();
      unsubscribeNotifications();
    };
  }, [user]);

  const handleCreateOrder = async (data: NewOrderFormData) => {
    try {
      const created = await createOrder(data);
      setOrders((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
      flashToast(
        data.orderType === "stock"
          ? "Stock order saved and marked Complete."
          : "Custom order saved and sent to Production Monitoring."
      );
    } catch (err: any) {
      console.error("Create order failed:", err);
      flashToast(`Failed to create order: ${err.message || "Unknown error"}`);
    }
  };

  const handleUpdateOrder = async (id: string, changes: OrderUpdatePayload) => {
    try {
      const updated = await updateOrder(id, changes);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      flashToast(
        changes.status === "completed"
          ? "Order marked Complete and moved to Completed Transactions."
          : "Order updated successfully."
      );
    } catch (err: any) {
      console.error("Update order failed:", err);
      flashToast(`Failed to update order: ${err.message || "Unknown error"}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  // Persistent unread count from database
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell unreadCount={unreadCount} />}>
            <Route
              path="/orders"
              element={<OrderManagementPage orders={orders} onCreateOrder={handleCreateOrder} />}
            />
            <Route
              path="/production"
              element={<ProductionMonitoringPage orders={orders} onUpdateOrder={handleUpdateOrder} />}
            />
            <Route path="/completed" element={<CompletedTransactionsPage orders={orders} />} />
            <Route path="/customers" element={<CustomerOverviewPage orders={orders} />} />
            <Route
              path="/notifications"
              element={
                <NotificationsPage
                  notifications={notifications}
                  onMarkAllAsRead={handleMarkAllRead}
                  onMarkAsRead={handleMarkOneRead}
                />
              }
            />

            <Route element={<ProtectedAdminRoute />}>
              <Route path="/dashboard" element={<DashboardPage orders={orders} />} />
              <Route path="/statistics" element={<StatisticsPage orders={orders} />} />
            </Route>
          </Route>
        </Route>
      </Routes>

      <Toast message={toast} />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </Router>
  );
}
