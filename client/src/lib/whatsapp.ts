export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Order {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string | null;
  total_amount: string;
  notes?: string | null;
}

export function formatWhatsAppMessage(order: Order, items: OrderItem[]): string {
  const lines: string[] = [];
  
  lines.push(`🛒 *New Order: ${order.order_number}*`);
  lines.push('');
  lines.push(`👤 *Customer:* ${order.customer_name}`);
  lines.push(`📱 *Phone:* ${order.customer_phone}`);
  
  if (order.delivery_address) {
    lines.push(`📍 *Address:* ${order.delivery_address}`);
  }
  
  lines.push('');
  lines.push('📦 *Items:*');
  
  items.forEach((item, index) => {
    const subtotal = parseFloat(item.subtotal).toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    lines.push(`${index + 1}. ${item.product_name}`);
    lines.push(`   Qty: ${item.quantity} × KES ${parseFloat(item.unit_price).toLocaleString()} = ${subtotal}`);
  });
  
  lines.push('');
  lines.push(`💰 *Total: ${parseFloat(order.total_amount).toLocaleString('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}*`);
  
  if (order.notes) {
    lines.push('');
    lines.push(`📝 *Notes:* ${order.notes}`);
  }
  
  return lines.join('\n');
}

export function generateWhatsAppLink(
  phoneNumber: string,
  message: string
): string {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  const formattedPhone = cleanPhone.startsWith('254') 
    ? cleanPhone 
    : cleanPhone.startsWith('0') 
    ? `254${cleanPhone.slice(1)}` 
    : `254${cleanPhone}`;
  
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
