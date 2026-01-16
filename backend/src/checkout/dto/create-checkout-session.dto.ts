export class CreateCheckoutSessionDto {
  cartId: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  customerName?: string;
  phone?: string;
  address?: string;
}
