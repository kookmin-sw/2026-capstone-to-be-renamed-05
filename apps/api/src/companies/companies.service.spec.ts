import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CompanyType,
  DeadlineType,
  EmploymentType,
  JobFamily,
  JobStatus,
  KicpaCondition,
  SubmissionStatus,
  SubmissionType,
  TraineeStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CompaniesService } from './companies.service';

const createdAt = new Date('2026-05-06T00:00:00.000Z');

function jobSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 'submission-1',
    companyId: 'company-1',
    company: { name: '테스트회계법인' },
    submittedBy: { username: 'company-user' },
    reviewedBy: null,
    targetJob: null,
    submissionType: SubmissionType.CREATE,
    targetJobId: null,
    title: '감사 공고',
    description: '설명',
    originalUrl: 'https://example.com/job',
    jobFamily: JobFamily.AUDIT,
    employmentType: EmploymentType.FULL_TIME,
    kicpaCondition: KicpaCondition.PREFERRED,
    traineeStatus: TraineeStatus.AVAILABLE,
    practicalTrainingInstitution: true,
    minExperienceYears: 0,
    maxExperienceYears: 1,
    location: '서울',
    deadlineType: DeadlineType.UNTIL_FILLED,
    deadline: null,
    status: SubmissionStatus.PENDING,
    adminNote: null,
    approvedJobId: null,
    createdAt,
    updatedAt: createdAt,
    reviewedAt: null,
    ...overrides,
  };
}

function managedJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    title: '게시된 감사 공고',
    description: '기존 본문',
    companyId: 'company-1',
    company: {
      id: 'company-1',
      name: '테스트회계법인',
      logoUrl: null,
    },
    source: { id: 'source-1', name: '기업회원 제출' },
    labels: [],
    editSubmissions: [],
    originalUrl: 'https://example.com/job',
    jobFamily: JobFamily.AUDIT,
    employmentType: EmploymentType.FULL_TIME,
    companyType: CompanyType.LOCAL_ACCOUNTING_FIRM,
    kicpaCondition: KicpaCondition.PREFERRED,
    traineeStatus: TraineeStatus.AVAILABLE,
    practicalTrainingInstitution: true,
    minExperienceYears: 0,
    maxExperienceYears: 1,
    location: '서울',
    deadlineType: DeadlineType.UNTIL_FILLED,
    deadline: null,
    status: JobStatus.OPEN,
    lastCheckedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function companyDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: 'company-1',
    name: '테스트회계법인',
    type: CompanyType.LOCAL_ACCOUNTING_FIRM,
    websiteUrl: null,
    logoUrl: '/company-logos/old.png',
    description: null,
    businessNumber: null,
    employeeTrend: null,
    externalLinks: [],
    tags: [],
    employeeCount: null,
    averageSalary: null,
    foundedYear: null,
    recentAttritionRate: null,
    ownerUserId: 'user-1',
    createdAt,
    updatedAt: createdAt,
    jobs: [],
    ...overrides,
  };
}

describe('CompaniesService submission ownership', () => {
  let prisma: {
    company: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    companyProfileSubmission: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    jobSubmission: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    job: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: CompaniesService;

  beforeEach(() => {
    prisma = {
      company: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      companyProfileSubmission: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      jobSubmission: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      job: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new CompaniesService(prisma as unknown as PrismaService);
  });

  it('rejects company submission when the user does not own a company', async () => {
    prisma.company.findUnique.mockResolvedValue(null);

    await expect(
      service.createJobSubmission('user-1', {
        title: '감사 공고',
        description: '설명',
        originalUrl: 'https://example.com/job',
        jobFamily: JobFamily.AUDIT,
        employmentType: EmploymentType.FULL_TIME,
        kicpaCondition: KicpaCondition.UNCLEAR,
        traineeStatus: TraineeStatus.UNCLEAR,
        deadlineType: DeadlineType.UNTIL_FILLED,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.jobSubmission.create).not.toHaveBeenCalled();
  });

  it('requires a deadline for fixed-date job submissions', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });

    await expect(
      service.createJobSubmission('user-1', {
        title: '감사 공고',
        description: '설명',
        originalUrl: 'https://example.com/job',
        jobFamily: JobFamily.AUDIT,
        employmentType: EmploymentType.FULL_TIME,
        kicpaCondition: KicpaCondition.UNCLEAR,
        traineeStatus: TraineeStatus.UNCLEAR,
        deadlineType: DeadlineType.FIXED_DATE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.jobSubmission.create).not.toHaveBeenCalled();
  });

  it('rejects blank company image profile submissions', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });

    await expect(
      service.createProfileSubmission('user-1', {
        logoUrl: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.companyProfileSubmission.create).not.toHaveBeenCalled();
  });

  it('creates a company image profile submission', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.companyProfileSubmission.findFirst.mockResolvedValue(null);
    prisma.companyProfileSubmission.create.mockResolvedValue({
      id: 'profile-submission-1',
      companyId: 'company-1',
      company: { name: '테스트회계법인' },
      submittedBy: { username: 'company-user' },
      reviewedBy: null,
      proposed: { logoUrl: '/company-logos/new.png' },
      status: SubmissionStatus.PENDING,
      adminNote: null,
      createdAt,
      updatedAt: createdAt,
      reviewedAt: null,
    });

    const result = await service.createProfileSubmission('user-1', {
      logoUrl: ' /company-logos/new.png ',
    });

    expect(prisma.companyProfileSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          companyId: 'company-1',
          submittedById: 'user-1',
          proposed: { logoUrl: '/company-logos/new.png' },
        },
      }),
    );
    expect(result.proposed.logoUrl).toBe('/company-logos/new.png');
  });

  it('updates a company image immediately without creating a profile submission', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.company.update.mockResolvedValue(
      companyDetail({ logoUrl: '/uploads/company-logos/new.png' }),
    );

    const result = await service.updateLogo('user-1', {
      logoUrl: ' /uploads/company-logos/new.png ',
    });

    expect(prisma.company.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'company-1' },
        data: { logoUrl: '/uploads/company-logos/new.png' },
      }),
    );
    expect(prisma.companyProfileSubmission.create).not.toHaveBeenCalled();
    expect(result.logoUrl).toBe('/uploads/company-logos/new.png');
  });

  it('rejects blank immediate company image updates', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });

    await expect(
      service.updateLogo('user-1', {
        logoUrl: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.company.update).not.toHaveBeenCalled();
  });

  it('uses the owned company id and marks new requests as CREATE', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    let capturedCreateArg: unknown;
    prisma.jobSubmission.create.mockImplementation((args: unknown) => {
      capturedCreateArg = args;
      return Promise.resolve(jobSubmission());
    });

    await service.createJobSubmission('user-1', {
      title: '감사 공고',
      description: '설명',
      originalUrl: 'https://example.com/job',
      jobFamily: JobFamily.AUDIT,
      employmentType: EmploymentType.FULL_TIME,
      kicpaCondition: KicpaCondition.PREFERRED,
      traineeStatus: TraineeStatus.AVAILABLE,
      practicalTrainingInstitution: true,
      minExperienceYears: 0,
      maxExperienceYears: 1,
      location: '서울',
      deadlineType: DeadlineType.UNTIL_FILLED,
    });

    const createArg = capturedCreateArg as {
      data: {
        companyId: string;
        submittedById: string;
        submissionType: SubmissionType;
      };
    };
    expect(createArg.data).toMatchObject({
      companyId: 'company-1',
      submittedById: 'user-1',
      submissionType: SubmissionType.CREATE,
    });
  });

  it('lists only the owned company jobs including open and closed jobs', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.job.findMany.mockResolvedValue([
      managedJob(),
      managedJob({ id: 'job-2', status: JobStatus.CLOSED }),
    ]);

    const result = await service.listMyJobs('user-1');

    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: 'company-1',
          status: { in: [JobStatus.OPEN, JobStatus.CLOSED] },
        },
      }),
    );
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: 'job-1',
      description: '기존 본문',
      status: JobStatus.OPEN,
    });
  });

  it('creates an UPDATE request for an owned open job', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prisma.jobSubmission.findFirst.mockResolvedValue(null);
    let capturedCreateArg: unknown;
    prisma.jobSubmission.create.mockImplementation((args: unknown) => {
      capturedCreateArg = args;
      return Promise.resolve(
        jobSubmission({
          id: 'submission-update-1',
          submissionType: SubmissionType.UPDATE,
          targetJobId: 'job-1',
          targetJob: { id: 'job-1', title: '기존 공고' },
        }),
      );
    });

    const result = await service.createJobEditSubmission('user-1', 'job-1', {
      title: '수정 공고',
      description: '수정 설명',
      originalUrl: 'https://example.com/job-updated',
      jobFamily: JobFamily.TAX,
      employmentType: EmploymentType.FULL_TIME,
      kicpaCondition: KicpaCondition.REQUIRED,
      traineeStatus: TraineeStatus.AVAILABLE,
      deadlineType: DeadlineType.UNTIL_FILLED,
    });

    expect(prisma.job.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'job-1',
        companyId: 'company-1',
        status: JobStatus.OPEN,
      },
      select: { id: true },
    });
    const createArg = capturedCreateArg as {
      data: {
        submissionType: SubmissionType;
        targetJobId: string;
      };
    };
    expect(createArg.data).toMatchObject({
      submissionType: SubmissionType.UPDATE,
      targetJobId: 'job-1',
    });
    expect(result.targetJobId).toBe('job-1');
  });

  it('rejects duplicate pending UPDATE requests for the same job', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prisma.jobSubmission.findFirst.mockResolvedValue({ id: 'pending-1' });

    await expect(
      service.createJobEditSubmission('user-1', 'job-1', {
        title: '수정 공고',
        description: '수정 설명',
        originalUrl: 'https://example.com/job-updated',
        jobFamily: JobFamily.TAX,
        employmentType: EmploymentType.FULL_TIME,
        kicpaCondition: KicpaCondition.REQUIRED,
        traineeStatus: TraineeStatus.AVAILABLE,
        deadlineType: DeadlineType.UNTIL_FILLED,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.jobSubmission.create).not.toHaveBeenCalled();
  });

  it('soft closes owned open jobs instead of deleting them', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prisma.job.update.mockResolvedValue(
      managedJob({ status: JobStatus.CLOSED, editSubmissions: [] }),
    );

    const result = await service.closeMyJob('user-1', 'job-1');

    expect(prisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1' },
        data: { status: JobStatus.CLOSED },
      }),
    );
    expect(result.status).toBe(JobStatus.CLOSED);
  });

  it('updates only owned pending job submissions', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.jobSubmission.findFirst.mockResolvedValue({ id: 'submission-1' });
    let capturedUpdateArg: unknown;
    prisma.jobSubmission.update.mockImplementation((args: unknown) => {
      capturedUpdateArg = args;
      return Promise.resolve(
        jobSubmission({
          title: '수정된 요청',
          description: '수정된 설명',
          originalUrl: 'https://example.com/job-updated',
        }),
      );
    });

    const result = await service.updateMyJobSubmission(
      'user-1',
      'submission-1',
      {
        title: '수정된 요청',
        description: '수정된 설명',
        originalUrl: 'https://example.com/job-updated',
        jobFamily: JobFamily.TAX,
        employmentType: EmploymentType.FULL_TIME,
        kicpaCondition: KicpaCondition.REQUIRED,
        traineeStatus: TraineeStatus.AVAILABLE,
        deadlineType: DeadlineType.UNTIL_FILLED,
      },
    );

    expect(prisma.jobSubmission.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'submission-1',
        companyId: 'company-1',
        submittedById: 'user-1',
        status: SubmissionStatus.PENDING,
      },
      select: { id: true },
    });
    const updateArg = capturedUpdateArg as {
      where: { id: string };
      data: {
        title: string;
        originalUrl: string;
        jobFamily: JobFamily;
      };
    };
    expect(updateArg).toMatchObject({
      where: { id: 'submission-1' },
      data: {
        title: '수정된 요청',
        originalUrl: 'https://example.com/job-updated',
        jobFamily: JobFamily.TAX,
      },
    });
    expect(result.title).toBe('수정된 요청');
  });

  it('cancels owned pending job submissions by deleting the submission', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.jobSubmission.findFirst.mockResolvedValue({ id: 'submission-1' });
    prisma.jobSubmission.delete.mockResolvedValue(jobSubmission());

    await service.cancelMyJobSubmission('user-1', 'submission-1');

    expect(prisma.jobSubmission.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'submission-1' },
      }),
    );
  });
});
