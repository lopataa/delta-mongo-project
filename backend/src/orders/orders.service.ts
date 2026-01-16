import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument } from './order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async create(
    dto: CreateOrderDto,
    meta?: { checkoutSessionId?: string; cartId?: string },
  ): Promise<OrderDocument> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must include at least one item');
    }

    const total = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return this.orderModel.create({ ...dto, total, ...meta });
  }

  async findAll(): Promise<OrderDocument[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByCheckoutSessionId(
    sessionId: string,
  ): Promise<OrderDocument | null> {
    return this.orderModel.findOne({ checkoutSessionId: sessionId }).exec();
  }
}
