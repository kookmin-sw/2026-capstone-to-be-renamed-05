import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  COMPANY_LOGO_FIELD_NAME,
  COMPANY_LOGO_MAX_BYTES,
  saveCompanyLogoUpload,
  type UploadedCompanyLogoFile,
} from '../uploads/company-logo-upload';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { RequestWithUser } from './auth.types';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('company-logo')
  @UseInterceptors(
    FileInterceptor(COMPANY_LOGO_FIELD_NAME, {
      limits: { fileSize: COMPANY_LOGO_MAX_BYTES },
    }),
  )
  async uploadCompanyLogo(
    @UploadedFile() file: UploadedCompanyLogoFile | undefined,
  ) {
    return { logoUrl: await saveCompanyLogoUpload(file) };
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    res.cookie('access_token', result.accessToken, cookieOptions);
    return { user: result.user };
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    res.cookie('access_token', result.accessToken, cookieOptions);
    return { user: result.user };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: RequestWithUser) {
    return { user: req.user };
  }

  @HttpCode(200)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }
}
