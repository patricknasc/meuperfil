export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando confirmação",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  PREPARING: "Em preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const ORDER_STATUS_TONE: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/30",
  AWAITING_PAYMENT: "bg-warning/10 text-warning border-warning/30",
  PAID: "bg-success/10 text-success border-success/20",
  PREPARING: "bg-accent/10 text-accent border-accent/20",
  SHIPPED: "bg-accent/10 text-accent border-accent/20",
  DELIVERED: "bg-success/10 text-success border-success/20",
  COMPLETED: "bg-success/10 text-success border-success/20",
  CANCELED: "bg-surface-hover text-muted border-border",
  REFUNDED: "bg-surface-hover text-muted border-border",
};

export const ORDER_CHANNEL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  PIX_DIRECT: "Pix direto",
  PLATFORM: "Plataforma",
};

/** Owner-facing name of the action that moves an order to each status. */
export const ORDER_ACTION_LABEL: Record<string, string> = {
  AWAITING_PAYMENT: "Aguardar pagamento",
  PAID: "Marcar como pago",
  PREPARING: "Em preparação",
  SHIPPED: "Marcar como enviado",
  DELIVERED: "Marcar como entregue",
  COMPLETED: "Concluir",
  CANCELED: "Cancelar pedido",
  REFUNDED: "Marcar como reembolsado",
};
