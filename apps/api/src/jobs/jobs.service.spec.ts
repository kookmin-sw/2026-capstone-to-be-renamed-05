import { NotFoundException } from '@nestjs/common';
import {
  CompanyType,
  DeadlineType,
  EmploymentType,
  JobEngagementEventType,
  JobFamily,
  JobStatus,
  KicpaCondition,
  TraineeStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let prisma: {
    job: {
      findFirst: jest.Mock<Promise<unknown>, [Prisma.JobFindFirstArgs]>;
      findMany: jest.Mock;
      count: jest.Mock;
      groupBy: jest.Mock;
    };
    company: {
      aggregate: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
    };
    companyMetadata: {
      findMany: jest.Mock;
    };
    jobEngagementEvent: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: JobsService;

  beforeEach(() => {
    prisma = {
      job: {
        findFirst: jest.fn<Promise<unknown>, [Prisma.JobFindFirstArgs]>(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      company: {
        aggregate: jest.fn().mockResolvedValue({
          _avg: { averageSalary: null },
        }),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      companyMetadata: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      jobEngagementEvent: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([[], 0]),
    };
    service = new JobsService(prisma as unknown as PrismaService);
  });

  it('does not return closed jobs from public detail lookups', async () => {
    prisma.job.findFirst.mockResolvedValue(null);

    await expect(service.detail('job-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.job.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1', status: JobStatus.OPEN },
      }),
    );
  });

  it('returns curated job AI summaries with approved suggestion metadata', async () => {
    const now = new Date('2026-05-15T00:00:00.000Z');
    prisma.job.findFirst.mockResolvedValue({
      id: 'job-1',
      title: '감사본부 신입 회계사',
      description: '감사조서 작성과 재무제표 검토를 담당합니다.',
      companyId: 'company-1',
      sourceId: 'source-1',
      originalUrl: 'https://example.com/jobs/audit',
      jobFamily: JobFamily.AUDIT,
      employmentType: EmploymentType.FULL_TIME,
      companyType: CompanyType.LOCAL_ACCOUNTING_FIRM,
      kicpaCondition: KicpaCondition.PREFERRED,
      traineeStatus: TraineeStatus.AVAILABLE,
      practicalTrainingInstitution: true,
      minExperienceYears: 0,
      maxExperienceYears: 1,
      location: '서울 중구',
      aiSummary: '수습 CPA가 감사 실무를 빠르게 경험하기 좋은 공고입니다.',
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: new Date('2026-05-31T14:59:59.000Z'),
      status: JobStatus.OPEN,
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
      company: {
        name: '한빛회계법인',
        averageSalary: null,
        logoAsset: null,
        backgroundAsset: null,
      },
      source: { name: 'KICPA 채용' },
      labels: [],
      aiSuggestions: [
        {
          id: 'suggestion-1',
          jobId: 'job-1',
          summary: '감사 신입에게 적합합니다.',
          tags: ['수습가능'],
          risks: ['마감일 확인'],
          rawJson: {},
          status: 'APPROVED',
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    const result = await service.detail('job-1');

    const [findFirstArgs] = prisma.job.findFirst.mock.calls[0];
    expect(findFirstArgs).toMatchObject({
      include: {
        aiSuggestions: {
          where: { status: 'APPROVED' },
        },
      },
    });
    expect(result.aiSummary).toBe(
      '수습 CPA가 감사 실무를 빠르게 경험하기 좋은 공고입니다.',
    );
    expect(result.aiSuggestion?.summary).toBe('감사 신입에게 적합합니다.');
  });

  it('records public engagement events for open jobs without returning actor data', async () => {
    prisma.job.findFirst.mockResolvedValue({
      id: 'job-1',
      companyId: 'company-1',
    });
    prisma.jobEngagementEvent.create.mockResolvedValue({ id: 'event-1' });

    const result = await service.recordEngagement(
      'job-1',
      JobEngagementEventType.ORIGINAL_CLICK,
      'user-1',
    );

    expect(prisma.job.findFirst).toHaveBeenCalledWith({
      where: { id: 'job-1', status: JobStatus.OPEN },
      select: { id: true, companyId: true },
    });
    expect(prisma.jobEngagementEvent.create).toHaveBeenCalledWith({
      data: {
        jobId: 'job-1',
        companyId: 'company-1',
        type: JobEngagementEventType.ORIGINAL_CLICK,
        actorUserId: 'user-1',
      },
    });
    expect(result).toEqual({ ok: true });
  });

  it('rejects engagement recording for missing public jobs', async () => {
    prisma.job.findFirst.mockResolvedValue(null);

    await expect(
      service.recordEngagement(
        'job-missing',
        JobEngagementEventType.DETAIL_VIEW,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.jobEngagementEvent.create).not.toHaveBeenCalled();
  });

  it('filters active-hiring by companies with at least five open jobs', async () => {
    prisma.job.groupBy.mockResolvedValue([
      { companyId: 'company-1', _count: { _all: 5 } },
      { companyId: 'company-2', _count: { _all: 4 } },
      { companyId: 'company-3', _count: { _all: 7 } },
    ]);

    await service.list({ preset: 'active-hiring', search: '감사' });

    expect(prisma.job.groupBy).toHaveBeenCalledWith({
      by: ['companyId'],
      where: { status: JobStatus.OPEN },
      _count: { _all: true },
    });
    const where = getLastJobFindManyWhere(prisma);
    const andItems = getAndItems(where);
    expect(where.status).toBe(JobStatus.OPEN);
    expect(andItems).toContainEqual({
      companyId: { in: ['company-1', 'company-3'] },
    });
    expect(JSON.stringify(andItems)).toContain('"contains":"감사"');
  });

  it('filters career-verified by explicit company metadata signals', async () => {
    prisma.companyMetadata.findMany.mockResolvedValue([
      { companyId: 'company-big4' },
      { companyId: 'company-public' },
    ]);
    prisma.job.findMany.mockResolvedValue([]);

    await service.calendar({
      from: '2026-05-01',
      to: '2026-05-31',
      preset: 'career-verified',
    });

    const metadataArgs = getLastMetadataFindManyArgs(prisma);
    expect(metadataArgs.where.careerVerificationSignals.hasSome).toEqual(
      expect.arrayContaining(['BIG4', 'PUBLIC_INSTITUTION']),
    );
    expect(metadataArgs.select).toEqual({ companyId: true });
    const where = getLastJobFindManyWhere(prisma);
    expect(getAndItems(where)).toContainEqual({
      companyId: { in: ['company-big4', 'company-public'] },
    });
  });

  it('filters salaryLevel ABOVE_AVERAGE by companies at or above the known average salary', async () => {
    prisma.company.aggregate.mockResolvedValue({
      _avg: { averageSalary: 7000 },
    });

    await service.list({ salaryLevel: ['ABOVE_AVERAGE'], sort: 'latest' });

    expect(prisma.company.aggregate).toHaveBeenCalledWith({
      where: { averageSalary: { not: null } },
      _avg: { averageSalary: true },
    });
    const where = getLastJobFindManyWhere(prisma);
    expect(getAndItems(where)).toContainEqual({
      company: { averageSalary: { gte: 7000 } },
    });
  });

  it.each([
    ['TOP_1', 0, 1],
    ['TOP_2_5', 1, 4],
    ['TOP_6_10', 5, 5],
    ['TOP_11_20', 10, 10],
  ] as const)(
    'filters salaryLevel %s by deterministic salary rank slice',
    async (salaryLevel, skip, take) => {
      prisma.company.count.mockResolvedValue(100);
      prisma.company.findMany.mockResolvedValue([{ id: `${salaryLevel}-id` }]);

      await service.list({ salaryLevel: [salaryLevel], sort: 'latest' });

      expect(prisma.company.count).toHaveBeenCalledWith({
        where: { averageSalary: { not: null } },
      });
      expect(prisma.company.findMany).toHaveBeenCalledWith({
        where: { averageSalary: { not: null } },
        select: { id: true },
        orderBy: [{ averageSalary: 'desc' }, { id: 'asc' }],
        skip,
        take,
      });
      const where = getLastJobFindManyWhere(prisma);
      expect(getAndItems(where)).toContainEqual({
        company: { id: { in: [`${salaryLevel}-id`] } },
      });
    },
  );

  it('returns an empty company id filter when salary ranks have no known salary data', async () => {
    prisma.company.count.mockResolvedValue(0);

    await service.list({ salaryLevel: ['TOP_1'], sort: 'latest' });

    expect(prisma.company.findMany).not.toHaveBeenCalled();
    const where = getLastJobFindManyWhere(prisma);
    expect(getAndItems(where)).toContainEqual({
      company: { id: { in: [] } },
    });
  });

  it('applies salaryLevel filters to calendar queries', async () => {
    prisma.company.count.mockResolvedValue(100);
    prisma.company.findMany.mockResolvedValue([{ id: 'top-company' }]);
    prisma.job.findMany.mockResolvedValue([]);

    await service.calendar({
      from: '2026-05-01',
      to: '2026-05-31',
      salaryLevel: ['TOP_1'],
    });

    const where = getLastJobFindManyWhere(prisma);
    expect(getAndItems(where)).toContainEqual({
      company: { id: { in: ['top-company'] } },
    });
  });
});

function getLastJobFindManyWhere(prisma: {
  job: { findMany: jest.Mock };
}): Prisma.JobWhereInput {
  const call = prisma.job.findMany.mock.calls.at(-1) as
    | [{ where?: Prisma.JobWhereInput }]
    | undefined;
  return call?.[0].where ?? {};
}

function getLastMetadataFindManyArgs(prisma: {
  companyMetadata: { findMany: jest.Mock };
}) {
  const call = prisma.companyMetadata.findMany.mock.calls.at(-1) as
    | [
        {
          where: { careerVerificationSignals: { hasSome: string[] } };
          select: { companyId: true };
        },
      ]
    | undefined;
  if (!call) throw new Error('companyMetadata.findMany was not called');
  return call[0];
}

function getAndItems(where: Prisma.JobWhereInput): Prisma.JobWhereInput[] {
  if (!where.AND) return [];
  return Array.isArray(where.AND) ? where.AND : [where.AND];
}
