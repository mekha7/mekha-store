const OWNER_PHONE = "+918050426215";

export function notifyOwner(orderId, customerName, total, cart) {
  const message = `
🧾 *New Invoice Generated*
---------------------------------
*Invoice ID:* ${orderId}
*Customer:* ${customerName}
*Total:* ₹${total}
*Items:* ${cart.map((i) => i.name).join(", ")}
---------------------------------
Login to Admin Panel for details.
  `;

  // WhatsApp notification
  window.open(
    `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

// Optional Email Notification (Supabase)
export async function notifyOwnerEmail(supabase, orderId, customerName, total, cart) {
  await supabase.from("invoice_notifications").insert([
    {
      invoice_id: orderId,
      customer_name: customerName,
      total: total,
      cart_json: cart
    }
  ]);
}
// eslint-disable-next-line 
export default {};
