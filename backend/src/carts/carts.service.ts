import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/product.schema';
import { Cart, CartDocument } from './cart.schema';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CartsService.name);
  private readonly cartIdleMs: number;
  private readonly cleanupIntervalMs: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {
    const idleMinutes = Number(process.env.CART_IDLE_MINUTES ?? 15);
    this.cartIdleMs =
      Number.isFinite(idleMinutes) && idleMinutes > 0
        ? idleMinutes * 60 * 1000
        : 15 * 60 * 1000;

    const cleanupMs = Number(process.env.CART_CLEANUP_INTERVAL_MS ?? 60000);
    this.cleanupIntervalMs =
      Number.isFinite(cleanupMs) && cleanupMs > 0 ? cleanupMs : 60000;
  }

  onModuleInit() {
    const runCleanup = () => {
      void this.cleanupExpiredCarts().catch((error) => {
        this.logger.error(
          'Cart cleanup failed',
          error instanceof Error ? error.stack : String(error),
        );
      });
    };

    runCleanup();
    this.cleanupTimer = setInterval(runCleanup, this.cleanupIntervalMs);
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async create(): Promise<Cart> {
    return this.cartModel.create({
      items: [],
      expiresAt: this.buildExpiryDate(),
    });
  }

  async findOne(id: string): Promise<Cart> {
    const cart = await this.getActiveCart(id);
    cart.expiresAt = this.buildExpiryDate();
    await cart.save();
    await cart.populate('items.productId');
    return cart;
  }

  async getSnapshot(id: string): Promise<Cart> {
    const cart = await this.getActiveCart(id);
    await cart.populate('items.productId');
    return cart;
  }

  async addItem(cartId: string, dto: AddCartItemDto): Promise<Cart> {
    const quantity = this.normalizeQuantity(dto.quantity);
    const cart = await this.getActiveCart(cartId);
    const existing = cart.items.find(
      (item) => item.productId.toString() === dto.productId,
    );

    this.ensureValidProductId(dto.productId);
    await this.reserveStock(dto.productId, quantity);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        productId: new Types.ObjectId(dto.productId),
        quantity,
      });
    }

    cart.expiresAt = this.buildExpiryDate();

    try {
      await cart.save();
    } catch (error) {
      await this.releaseStock(dto.productId, quantity);
      throw error;
    }

    await cart.populate('items.productId');
    return cart;
  }

  async updateItem(
    cartId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const quantity = this.normalizeUpdateQuantity(dto.quantity);
    const cart = await this.getActiveCart(cartId);
    const item = cart.items.find(
      (entry) => entry.productId.toString() === productId,
    );

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity === 0) {
      this.ensureValidProductId(productId);
      await this.releaseStock(productId, item.quantity);
      cart.items = cart.items.filter(
        (entry) => entry.productId.toString() !== productId,
      );
      cart.expiresAt = this.buildExpiryDate();

      try {
        await cart.save();
      } catch (error) {
        await this.reserveStock(productId, item.quantity);
        throw error;
      }

      await cart.populate('items.productId');
      return cart;
    }

    const delta = quantity - item.quantity;
    let revertAdjustment: (() => Promise<void>) | null = null;

    this.ensureValidProductId(productId);

    if (delta > 0) {
      await this.reserveStock(productId, delta);
      revertAdjustment = () => this.releaseStock(productId, delta);
    } else if (delta < 0) {
      await this.releaseStock(productId, Math.abs(delta));
      revertAdjustment = () =>
        this.reserveStock(productId, Math.abs(delta));
    }

    item.quantity = quantity;
    cart.expiresAt = this.buildExpiryDate();

    try {
      await cart.save();
    } catch (error) {
      if (revertAdjustment) {
        await revertAdjustment();
      }
      throw error;
    }

    await cart.populate('items.productId');
    return cart;
  }

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    const cart = await this.getActiveCart(cartId);
    const item = cart.items.find(
      (entry) => entry.productId.toString() === productId,
    );

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    this.ensureValidProductId(productId);
    await this.releaseStock(productId, item.quantity);
    cart.items = cart.items.filter(
      (entry) => entry.productId.toString() !== productId,
    );
    cart.expiresAt = this.buildExpiryDate();

    try {
      await cart.save();
    } catch (error) {
      await this.reserveStock(productId, item.quantity);
      throw error;
    }

    await cart.populate('items.productId');
    return cart;
  }

  async clear(cartId: string): Promise<{ deleted: boolean }> {
    const cart = await this.getActiveCart(cartId);
    await this.releaseCartStock(cart);
    await this.cartModel.deleteOne({ _id: cart._id }).exec();
    return { deleted: true };
  }

  async finalize(cartId: string): Promise<{ deleted: boolean }> {
    const cart = await this.cartModel.findById(cartId).exec();
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.expiresAt.getTime() <= Date.now()) {
      await this.expireCart(cartId);
      throw new NotFoundException('Cart expired');
    }

    await this.cartModel.deleteOne({ _id: cart._id }).exec();
    return { deleted: true };
  }

  private buildExpiryDate(): Date {
    return new Date(Date.now() + this.cartIdleMs);
  }

  private normalizeQuantity(quantity: number): number {
    const normalized = Number(quantity);
    if (!Number.isInteger(normalized) || normalized < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }
    return normalized;
  }

  private normalizeUpdateQuantity(quantity: number): number {
    const normalized = Number(quantity);
    if (!Number.isInteger(normalized) || normalized < 0) {
      throw new BadRequestException('Quantity must be 0 or higher');
    }
    return normalized;
  }

  private async getActiveCart(id: string): Promise<CartDocument> {
    const cart = await this.cartModel.findById(id).exec();
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.expiresAt.getTime() <= Date.now()) {
      await this.expireCart(id);
      throw new NotFoundException('Cart expired');
    }

    return cart;
  }

  private async expireCart(cartId: string): Promise<void> {
    const expiredCart = await this.cartModel
      .findOneAndDelete({ _id: cartId, expiresAt: { $lte: new Date() } })
      .exec();

    if (!expiredCart) {
      return;
    }

    await this.releaseCartStock(expiredCart);
  }

  private async cleanupExpiredCarts(): Promise<void> {
    const now = new Date();
    while (true) {
      const expiredCart = await this.cartModel
        .findOneAndDelete({ expiresAt: { $lte: now } })
        .exec();

      if (!expiredCart) {
        break;
      }

      await this.releaseCartStock(expiredCart);
    }
  }

  private async reserveStock(productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      return;
    }

    const product = await this.productModel
      .findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      )
      .exec();

    if (product) {
      return;
    }

    const exists = await this.productModel.exists({ _id: productId });
    if (!exists) {
      throw new NotFoundException('Product not found');
    }

    throw new BadRequestException('Insufficient stock');
  }

  private async releaseStock(
    productId: string,
    quantity: number,
  ): Promise<void> {
    if (quantity <= 0) {
      return;
    }

    await this.productModel
      .findByIdAndUpdate(productId, { $inc: { stock: quantity } })
      .exec();
  }

  private async releaseCartStock(cart: CartDocument): Promise<void> {
    for (const item of cart.items) {
      await this.releaseStock(item.productId.toString(), item.quantity);
    }
  }

  private ensureValidProductId(productId: string): void {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product id');
    }
  }
}
