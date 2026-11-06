import { useState } from 'react';
import BulkOrderFlow from '@/components/bulk/BulkOrderFlow';
import IndividualOrderFlow from '@/components/order/IndividualOrderFlow';
import OrderTypeStep, { type OrderType } from '@/components/order/OrderTypeStep';
import Dialog from '@/components/ui/Dialog';
import type { ServiceId } from '@/data/services';

interface OrderModalProps {
  initialService: ServiceId | null;
  onClose: () => void;
}

export default function OrderModal({ initialService, onClose }: OrderModalProps) {
  const [orderType, setOrderType] = useState<OrderType | null>(initialService ? 'individual' : null);
  const handleBack = () => setOrderType(null);

  if (orderType === 'bulk') {
    return <BulkOrderFlow onBack={handleBack} onClose={onClose} />;
  }

  if (orderType === 'individual') {
    return <IndividualOrderFlow initialService={initialService} onBack={handleBack} onClose={onClose} />;
  }

  return (
    <Dialog eyebrow="Start your order" title="How would you like to order?" onClose={onClose}>
      <OrderTypeStep onSelect={setOrderType} />
    </Dialog>
  );
}
