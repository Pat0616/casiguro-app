import { useState } from "react";
import { Plus } from "lucide-react";
import type { NewOrderFormData, Order } from "@/types";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import MiniCalendar from "@/components/orders/MiniCalendar";
import DeadlinePanel from "@/components/orders/DeadlinePanel";
import NewOrderModal from "@/components/orders/NewOrderModal";

interface OrderManagementPageProps {
  orders: Order[];
  onCreateOrder: (data: NewOrderFormData) => void;
}

export default function OrderManagementPage({ orders, onCreateOrder }: OrderManagementPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Order Management"
        title="Calendar & New Orders"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> New Order
          </Button>
        }
      />

      {/* Mobile: Calendar on top (order-1), Deadlines below (order-2)
        <div className="order-2 w-full lg:order-1 lg:w-[68%] xl:w-[70%]">
          <DeadlinePanel orders={orders} selectedDate={selectedDate} onClear={() => setSelectedDate(null)} />
        <div className="order-1 w-full lg:order-2 lg:w-[32%] xl:w-[30%]">
          <MiniCalendar orders={orders} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

      <NewOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(data) => {
          onCreateOrder(data);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
