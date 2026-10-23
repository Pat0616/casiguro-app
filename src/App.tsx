import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import type { AppNotification, NewOrderFormData, Order } from "@/types";
import { getOrders, createOrder } from "@/utils/orderAPI";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/utils/notificationAPI";
import { subscribeToAccountChanges, subscribeToNotifications, subscribeToOrders } from "@/utils/socket";
import { getPendingAccountCount } from "@/utils/accountAPI";
import { getMe } from "@/utils/authAPI";
import { todayKey } from "@/lib/utils";

import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AccountsPage from "@/pages/AccountsPage";
import AccountDetailPage from "@/pages/AccountDetailPage";
import DashboardPage from "@/pages/DashboardPage";
import OrderManagementPage from "@/pages/OrderManagementPage";
import ProductionMonitoringPage from "@/pages/ProductionMonitoringPage";
import CompletedTransactionsPage from "@/pages/CompletedTransactionsPage";
import CustomerOverviewPage from "@/pages/CustomerOverviewPage";
import StatisticsPage from "@/pages/StatisticsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ProductServiceCatalogPage from "@/pages/ProductServiceCatalogPage";
import Toast from "@/components/ui/Toast";

import { AuthProvider, useAuth } from "./context/AuthenticationContext";
import ProtectedRoute from "./routes/ProtectedRoutes";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";

function MainApp() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingAccountsCount, setPendingAccountsCount] = useState(0);
  const [toast, setToast] = useState("");
  // Re-render every page at local midnight so "Due today" / "Overdue" labels flip without a reload
  const [, setDayKey] = useState(todayKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => {
        setDayKey(todayKey());
        scheduleMidnight();
      }, nextMidnight.getTime() - now.getTime());
    };
    scheduleMidnight();
    return () => clearTimeout(timer);
  }, []);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Account lifecycle: keep the admin's pending-registration badge live, and react immediately when an admin
  // changes *this* user's account (deactivated -> signed out, promoted -> admin menu appears)
  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === "admin";
    const refreshPending = () => {
      if (isAdmin) getPendingAccountCount().then((r) => setPendingAccountsCount(r.pendingCount)).catch(() => undefined);
    };
    refreshPending();

    const signOut = (message: string) => {
      setUser(null);
      navigate("/login");
      flashToast(message);
    };

    const unsubscribe = subscribeToAccountChanges(({ userId }) => {
      refreshPending();
      if (userId !== user.id) return;
      getMe()
        .then((me) => setUser(me))
        .catch(() => signOut("Your account is no longer active. Please contact an administrator."));
    });

    const handleExpired = (event: Event) => {
      signOut((event as CustomEvent<string>).detail || "Your session has ended. Please sign in again.");
    };
    window.addEventListener("auth:expired", handleExpired);

    return () => {
      unsubscribe();
      window.removeEventListener("auth:expired", handleExpired);
    };
  }, [user?.id, user?.role]);

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

  // Merge an order the server already saved (e.g. quotation conversion, document edits, payments)
  const handleOrderSaved = (saved: Order) => {
    setOrders((prev) =>
      prev.some((o) => o.id === saved.id) ? prev.map((o) => (o.id === saved.id ? saved : o)) : [saved, ...prev]
    );
  };

  // Production Monitoring saved progress (or an admin cancelled the order)
  const handleProductionSaved = (saved: Order) => {
    handleOrderSaved(saved);
    flashToast(
      saved.status === "completed"
        ? "Order marked Complete and moved to Completed Transactions."
        : saved.status === "cancelled"
          ? `SOA ${saved.soaNo} was cancelled.`
          : "Order updated successfully."
    );
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
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell unreadCount={unreadCount} pendingAccountsCount={pendingAccountsCount} />}>
            <Route
              path="/orders"
              element={
                <OrderManagementPage orders={orders} onCreateOrder={handleCreateOrder} onOrderSaved={handleOrderSaved} />
              }
            />
            <Route
              path="/production"
              element={
                <ProductionMonitoringPage orders={orders} onOrderChange={handleOrderSaved} onOrderSaved={handleProductionSaved} />
              }
            />
            <Route
              path="/completed"
              element={<CompletedTransactionsPage orders={orders} onOrderUpdated={handleOrderSaved} />}
            />
            <Route path="/customers" element={<CustomerOverviewPage orders={orders} onOrderChange={handleOrderSaved} />} />
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
              <Route path="/products-services" element={<ProductServiceCatalogPage />} />
              <Route path="/accounts" element={<AccountsPage onPendingCountChange={setPendingAccountsCount} />} />
              <Route path="/accounts/:id" element={<AccountDetailPage />} />
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
