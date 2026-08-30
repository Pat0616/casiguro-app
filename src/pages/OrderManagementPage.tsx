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

      {/* 70% deadlines on left / 30% calendar on right */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full lg:w-[68%] xl:w-[70%]">
          <DeadlinePanel orders={orders} selectedDate={selectedDate} onClear={() => setSelectedDate(null)} />
        </div>
        <div className="w-full lg:w-[32%] xl:w-[30%]">
          <MiniCalendar orders={orders} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>
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
