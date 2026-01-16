import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Post('login')
  login(@Body() body: { password?: string }) {
    const expected = process.env.ADMIN_TOKEN ?? 'schoolshop-admin';
    if (!body?.password || body.password !== expected) {
      throw new UnauthorizedException('Oops! That kitty key is not right.');
    }

    return { token: expected };
  }
}
