export class CreateOrderItemDto {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export class CreateOrderDto {
  items: CreateOrderItemDto[];
  customerName: string;
  email: string;
  phone: string;
  address: string;
}
