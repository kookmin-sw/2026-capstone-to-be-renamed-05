import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CompanyType, User, UserRole } from '@prisma/client';
import argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type SafeUserRecord = Pick<
  User,
  'id' | 'username' | 'displayName' | 'profileImageUrl' | 'role'
> & {
  ownedCompany?: { id: string } | null;
  profileImageAsset?: { publicUrl: string } | null;
};

export type SafeAuthUser = {
  id: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  role: UserRole;
  companyId: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 아이디입니다.');
    }
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException(
        '관리자 계정은 공개 회원가입으로 생성할 수 없습니다.',
      );
    }

    if (dto.role === UserRole.COMPANY) {
      const companyName = dto.companyName?.trim();

      if (!companyName) {
        throw new BadRequestException('기업회원은 회사명이 필요합니다.');
      }
      const existingCompany = await this.prisma.company.findUnique({
        where: { name: companyName },
      });
      if (existingCompany) {
        throw new ConflictException('이미 등록된 회사명입니다.');
      }

      const passwordHash = await argon2.hash(dto.password);
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            username: dto.username,
            passwordHash,
            displayName: dto.displayName,
            role: dto.role,
          },
        });
        const company = await tx.company.create({
          data: {
            name: companyName,
            type: dto.companyType ?? CompanyType.LOCAL_ACCOUNTING_FIRM,
            ownerUserId: createdUser.id,
          },
        });

        return { ...createdUser, ownedCompany: { id: company.id } };
      });

      return this.toAuthResponse(user);
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
        role: dto.role,
      },
    });

    return this.toAuthResponse({ ...user, ownedCompany: null });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        ownedCompany: { select: { id: true } },
        profileImageAsset: { select: { publicUrl: true } },
      },
    });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return this.toAuthResponse(user);
  }

  async findSafeUser(userId: string): Promise<SafeAuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImageUrl: true,
        role: true,
        ownedCompany: { select: { id: true } },
        profileImageAsset: { select: { publicUrl: true } },
      },
    });
    return user ? this.toSafeUser(user) : null;
  }

  private toAuthResponse(user: SafeUserRecord) {
    const safeUser = this.toSafeUser(user);
    const accessToken = this.jwtService.sign({
      sub: safeUser.id,
      username: safeUser.username,
      role: safeUser.role,
      companyId: safeUser.companyId,
    });

    return { user: safeUser, accessToken };
  }

  private toSafeUser(user: SafeUserRecord): SafeAuthUser {
    const companyId = user.ownedCompany?.id ?? null;
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      profileImageUrl:
        user.profileImageAsset?.publicUrl ?? user.profileImageUrl ?? null,
      role: user.role,
      companyId,
    };
  }
}
