import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './auth.guard';

@UseGuards(AuthGuard)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  someprotectedRoute(@Req() req) {
    return { message: 'Accessed Resource', userID: req.userID };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
