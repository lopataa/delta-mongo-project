import { Body, Controller, Post } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CompleteCheckoutSessionDto } from './dto/complete-checkout-session.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('session')
  createSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.checkoutService.createSession(dto);
  }

  @Post('complete')
  complete(@Body() dto: CompleteCheckoutSessionDto) {
    return this.checkoutService.completeSession(dto);
  }
}
