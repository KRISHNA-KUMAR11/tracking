import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from 'src/auth.guard';
import { ApiBasicAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly AuthService: AuthService) {}

  @Post('/signup')
  @UseGuards(AuthGuard)
  @ApiBasicAuth('basic')
  async signup(@Body() signUpDto: SignUpDto) {
    return this.AuthService.signUp(signUpDto);
  }

  @Throttle({ short: { limit: 1, ttl: 1000 } })
  @Post('/login')
  @UseGuards(AuthGuard)
  @ApiBasicAuth('basic')
  async login(@Body() LoginDto: LoginDto) {
    return this.AuthService.login(LoginDto);
  }

  @Post('/refresh')
  async refreshTokens(@Body() RefreshTokenDto: RefreshTokenDto) {
    return this.AuthService.refreshTokens(RefreshTokenDto.refreshToken);
  }
}
