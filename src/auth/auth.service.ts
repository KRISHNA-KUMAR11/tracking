import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './schemas/refresh.token.schema';
import { v4 as uuidv4 } from 'uuid';
import { PinoLogger } from 'nestjs-pino';

uuidv4();

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { name, email, password } = signUpDto;
    const emailExists = await this.userModel.findOne({ email });
    if (emailExists) {
      throw new ConflictException('Email is already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  }

  async login(LoginDto: LoginDto) {
    const { email, password } = LoginDto;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid password');
    }
    const accessToken = await this.GenarateUserTokens(user);
    return { accessToken };
  }

  async refreshTokens(refreshToken: string) {
    const refreshTokens = await this.RefreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gt: new Date() },
    });

    if (!refreshTokens) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.GenarateUserTokens(refreshTokens.userId);
  }

  async GenarateUserTokens(userID) {
    const accessToken = await this.jwtService.sign(
      { userID },
      { expiresIn: '1d' },
    );
    const refreshToken = uuidv4();

    await this.storeRefreshToken(refreshToken, userID);
    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userID) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);
    await this.RefreshTokenModel.updateOne(
      { token },
      { $set: { userId: userID, expiryDate } },
      { upsert: true },
    );
    this.logger.info('Refresh token stored');
  }
}
