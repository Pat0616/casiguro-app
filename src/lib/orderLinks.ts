import type { Order } from "@/types";

/** Pending, in production or ready for pickup (shown in Production Monitoring) */
export const isActiveOrder = (o: Order) => o.status !== "completed" && o.status !== "cancelled";

/** Page that opens this order's window: Production Monitoring while active, Completed Transactions afterwards */
export const orderLink = (o: Order) =>
  `${isActiveOrder(o) ? "/production" : "/completed"}?order=${encodeURIComponent(o.id)}`;
