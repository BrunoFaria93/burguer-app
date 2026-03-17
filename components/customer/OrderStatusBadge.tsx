import { OrderStatus } from "@prisma/client";

const labels: Record<OrderStatus, string> = {
  PENDING: "Aguardando pagamento",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const colors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-500",
  CONFIRMED: "bg-blue-500/20 text-blue-500",
  PREPARING: "bg-orange-500/20 text-orange-500",
  READY: "bg-purple-500/20 text-purple-500",
  OUT_FOR_DELIVERY: "bg-cyan-500/20 text-cyan-500",
  DELIVERED: "bg-green-500/20 text-green-500",
  CANCELLED: "bg-red-500/20 text-red-500",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}
