import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  create() {
    return this.cartsService.create();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(id);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(id, dto);
  }

  @Put(':id/items/:productId')
  updateItem(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(id, productId, dto);
  }

  @Delete(':id/items/:productId')
  removeItem(@Param('id') id: string, @Param('productId') productId: string) {
    return this.cartsService.removeItem(id, productId);
  }

  @Delete(':id')
  clear(@Param('id') id: string) {
    return this.cartsService.clear(id);
  }
}
