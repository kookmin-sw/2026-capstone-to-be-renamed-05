import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CompanyType, UserRole } from '@prisma/client';
import argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  const jwtService = {
    sign: jest.fn(() => 'signed-token'),
  } as unknown as JwtService;

  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    company: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      company: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback: (client: typeof prisma) => unknown) =>
        callback(prisma),
      ),
    };
    service = new AuthService(prisma as unknown as PrismaService, jwtService);
    jest.clearAllMocks();
  });

  it('rejects public admin registration', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.register({
        username: 'new-admin',
        password: 'password123',
        role: UserRole.ADMIN,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(argon2.hash).not.toHaveBeenCalled();
  });

  it('creates a company user and owned company in one transaction', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      username: 'company-user',
      displayName: '담당자',
      role: UserRole.COMPANY,
    });
    prisma.company.create.mockResolvedValue({
      id: 'company-1',
      name: '테스트회계법인',
    });

    const result = await service.register({
      username: 'company-user',
      password: 'password123',
      role: UserRole.COMPANY,
      displayName: '담당자',
      companyName: '테스트회계법인',
      companyType: CompanyType.LOCAL_ACCOUNTING_FIRM,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.company.create).toHaveBeenCalledWith({
      data: {
        name: '테스트회계법인',
        type: CompanyType.LOCAL_ACCOUNTING_FIRM,
        ownerUserId: 'user-1',
      },
    });
    expect(result.user).toMatchObject({
      username: 'company-user',
      role: UserRole.COMPANY,
      companyId: 'company-1',
    });
  });

  it('requires a company name when registering a company user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.register({
        username: 'company-user',
        password: 'password123',
        role: UserRole.COMPANY,
        companyType: CompanyType.LOCAL_ACCOUNTING_FIRM,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.company.create).not.toHaveBeenCalled();
    expect(argon2.hash).not.toHaveBeenCalled();
  });

  it('returns the latest safe user with profile image URL', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'jobseeker',
      displayName: '수습 CPA',
      profileImageUrl: null,
      role: UserRole.JOB_SEEKER,
      ownedCompany: null,
      profileImageAsset: {
        publicUrl: 'https://assets.example.com/profile.png',
      },
    });

    await expect(service.findSafeUser('user-1')).resolves.toEqual({
      id: 'user-1',
      username: 'jobseeker',
      displayName: '수습 CPA',
      profileImageUrl: 'https://assets.example.com/profile.png',
      role: UserRole.JOB_SEEKER,
      companyId: null,
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
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
  });
});
