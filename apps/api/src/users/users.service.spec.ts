import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService job presets', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    userJobPreset: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userJobPreset: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('rejects empty personal preset snapshots', async () => {
    await expect(service.createJobPreset('user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.userJobPreset.create).not.toHaveBeenCalled();
  });

  it('creates normalized personal presets with a stable signature and label', async () => {
    const record = createRecord({
      filterState: {
        selectedLocations: ['서울'],
        jobFamily: 'AUDIT',
        careerLevel: 'entry',
      },
      autoLabel: '서울·감사·신입',
      filterSignature:
        '{"jobFamily":"AUDIT","careerLevel":"entry","selectedLocations":["서울"]}',
    });
    prisma.userJobPreset.create.mockResolvedValue(record);

    const result = await service.createJobPreset('user-1', {
      selectedLocations: ['서울'],
      jobFamily: 'AUDIT',
      careerLevel: 'entry',
      quick: 'entry',
      preset: 'active-hiring',
      userPresetId: 'preset-1',
      sort: 'deadlineAsc',
    });

    expect(getLastCreateArgs(prisma).data).toEqual({
      userId: 'user-1',
      filterState: {
        jobFamily: 'AUDIT',
        careerLevel: 'entry',
        selectedLocations: ['서울'],
      },
      autoLabel: '서울·감사·신입',
      filterSignature:
        '{"jobFamily":"AUDIT","careerLevel":"entry","selectedLocations":["서울"]}',
    });
    expect(result.autoLabel).toBe('서울·감사·신입');
  });

  it('uses a custom name as the personal preset label', async () => {
    prisma.userJobPreset.create.mockImplementation(
      (args: {
        data: {
          filterState: Record<string, unknown>;
          autoLabel: string;
          filterSignature: string;
        };
      }) =>
        createRecord({
          filterState: args.data.filterState,
          autoLabel: args.data.autoLabel,
          filterSignature: args.data.filterSignature,
        }),
    );

    const result = await service.createJobPreset(
      'user-1',
      { search: '감사' },
      '  감사 포지션  ',
    );

    expect(getLastCreateArgs(prisma).data.autoLabel).toBe('감사 포지션');
    expect(result.autoLabel).toBe('감사 포지션');
  });

  it('rejects duplicate personal preset signatures', async () => {
    prisma.userJobPreset.findFirst.mockResolvedValue({ id: 'preset-1' });

    await expect(
      service.createJobPreset('user-1', { search: '감사' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects saving more than five personal presets', async () => {
    prisma.userJobPreset.count.mockResolvedValue(5);

    await expect(
      service.createJobPreset('user-1', { search: '감사' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes deletes to the current user', async () => {
    prisma.userJobPreset.findFirst.mockResolvedValue(null);

    await expect(
      service.deleteJobPreset('user-1', 'preset-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.userJobPreset.findFirst).toHaveBeenCalledWith({
      where: { id: 'preset-1', userId: 'user-1' },
      select: { id: true },
    });
    expect(prisma.userJobPreset.delete).not.toHaveBeenCalled();
  });
});

function getLastCreateArgs(prisma: { userJobPreset: { create: jest.Mock } }): {
  data: {
    userId: string;
    filterState: Record<string, unknown>;
    autoLabel: string;
    filterSignature: string;
  };
} {
  const call = prisma.userJobPreset.create.mock.calls.at(-1) as
    | [
        {
          data: {
            userId: string;
            filterState: Record<string, unknown>;
            autoLabel: string;
            filterSignature: string;
          };
        },
      ]
    | undefined;
  if (!call) throw new Error('userJobPreset.create was not called');
  return call[0];
}

function createRecord(
  overrides: Partial<{
    id: string;
    filterState: Record<string, unknown>;
    autoLabel: string;
    filterSignature: string;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
  }>,
) {
  const now = new Date('2026-05-09T00:00:00.000Z');
  return {
    id: 'preset-1',
    filterState: {},
    autoLabel: '내 필터 조합',
    filterSignature: '{}',
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    ...overrides,
  };
}
