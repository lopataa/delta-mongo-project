import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { CartsService } from '../carts/carts.service';
import { Product } from '../products/product.schema';
import { OrdersService } from '../orders/orders.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CompleteCheckoutSessionDto } from './dto/complete-checkout-session.dto';

type CartProduct = Product & {
  _id: string | { toString(): string };
  images?: string[];
};

@Injectable()
export class CheckoutService {
  private stripeClient: Stripe | null = null;
  private readonly currency: string;

  constructor(
    private readonly cartsService: CartsService,
    private readonly ordersService: OrdersService,
  ) {
    this.currency = process.env.STRIPE_CURRENCY ?? 'usd';
  }

  async createSession(dto: CreateCheckoutSessionDto) {
    if (!dto.cartId) {
      throw new BadRequestException('Cart id is required');
    }

    const successUrl =
      dto.successUrl ?? process.env.STRIPE_SUCCESS_URL ?? '';
    const cancelUrl = dto.cancelUrl ?? process.env.STRIPE_CANCEL_URL ?? '';

    if (!successUrl || !cancelUrl) {
      throw new BadRequestException(
        'Success and cancel URLs are required for checkout',
      );
    }

    const cart = await this.cartsService.getSnapshot(dto.cartId);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const lineItems = cart.items.map((item) => {
      const product = item.productId as unknown as CartProduct;
      if (!product || !product.name) {
        throw new NotFoundException('Product not found');
      }

      const unitAmount = Math.round(product.price * 100);
      if (!Number.isFinite(unitAmount) || unitAmount < 1) {
        throw new BadRequestException('Invalid product price');
      }

      const images = this.getStripeImages(product.images);
      const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData =
        {
          name: product.name,
          description: product.description,
        };

      if (images.length) {
        productData.images = images;
      }

      return {
        quantity: item.quantity,
        price_data: {
          currency: this.currency,
          unit_amount: unitAmount,
          product_data: productData,
        },
      };
    });

    const session = await this.getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: dto.cartId,
      metadata: {
        cartId: dto.cartId,
        customerName: dto.customerName ?? '',
        email: dto.customerEmail ?? '',
        phone: dto.phone ?? '',
        address: dto.address ?? '',
      },
      customer_email: dto.customerEmail,
    });

    return { url: session.url, id: session.id };
  }

  async completeSession(dto: CompleteCheckoutSessionDto) {
    if (!dto.sessionId) {
      throw new BadRequestException('Session id is required');
    }

    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.retrieve(dto.sessionId);

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment not completed');
    }

    const cartId = session.metadata?.cartId;
    if (!cartId) {
      throw new BadRequestException('Missing cart reference');
    }

    const existing = await this.ordersService.findByCheckoutSessionId(
      session.id,
    );
    if (existing) {
      return { orderId: existing._id, status: 'existing' };
    }

    const cart = await this.cartsService.getSnapshot(cartId);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const orderItems = cart.items.map((item) => {
      const product = item.productId as unknown as CartProduct;
      const imageUrl = product.images?.[0] ?? '';
      return {
        productId: String(product._id),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl,
      };
    });

    const customerName =
      session.metadata?.customerName?.trim() || 'Stripe customer';
    const email =
      session.metadata?.email?.trim() || session.customer_email || '';
    if (!email) {
      throw new BadRequestException('Missing customer email');
    }
    const phone = session.metadata?.phone?.trim() || 'n/a';
    const address = session.metadata?.address?.trim() || 'n/a';

    const order = await this.ordersService.create(
      {
        items: orderItems,
        customerName,
        email,
        phone,
        address,
      },
      { checkoutSessionId: session.id, cartId },
    );

    await this.cartsService.finalize(cartId);

    return { orderId: order._id, status: 'created' };
  }

  private getStripe(): Stripe {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('Stripe is not configured');
    }

    this.stripeClient = new Stripe(secretKey);
    return this.stripeClient;
  }

  private getStripeImages(images?: string[]): string[] {
    if (!images?.length) {
      return [];
    }

    const image = images.find((item) => /^https?:\/\//i.test(item));
    return image ? [image] : [];
  }
}
