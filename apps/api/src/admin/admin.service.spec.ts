import { ConflictException } from '@nestjs/common';
import {
  CompanyType,
  CpaVerificationStatus,
  DeadlineType,
  EmploymentType,
  EmploymentHistoryStatus,
  JobFamily,
  JobStatus,
  KicpaCondition,
  PersonalCareerStage,
  PersonalVerificationRequestStatus,
  SubmissionStatus,
  SubmissionType,
  TraineeStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService review flows', () => {
  let tx: {
    jobSubmission: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    source: {
      upsert: jest.Mock;
    };
    job: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    company: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    companyProfileSubmission: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    personalVerificationRequest: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    personalProfile: {
      upsert: jest.Mock;
    };
  };
  let prisma: {
    $transaction: jest.Mock;
    companyProfileSubmission: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: AdminService;

  beforeEach(() => {
    tx = {
      jobSubmission: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      source: {
        upsert: jest.fn(),
      },
      job: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      company: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      companyProfileSubmission: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      personalVerificationRequest: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      personalProfile: {
        upsert: jest.fn(),
      },
    };
    prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      companyProfileSubmission: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new AdminService(prisma as unknown as PrismaService);
  });

  it('approves a pending job submission by creating a public job', async () => {
    const createdAt = new Date('2026-05-06T00:00:00.000Z');
    const submission = {
      id: 'submission-1',
      companyId: 'company-1',
      company: {
        id: 'company-1',
        name: '테스트회계법인',
        type: CompanyType.LOCAL_ACCOUNTING_FIRM,
      },
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
    };
    tx.jobSubmission.findUnique.mockResolvedValue(submission);
    tx.source.upsert.mockResolvedValue({ id: 'source-1' });
    let capturedJobCreateArg: unknown;
    let capturedSubmissionUpdateArg: unknown;
    tx.job.create.mockImplementation((args: unknown) => {
      capturedJobCreateArg = args;
      return Promise.resolve({ id: 'job-1' });
    });
    tx.jobSubmission.update.mockImplementation((args: unknown) => {
      capturedSubmissionUpdateArg = args;
      return Promise.resolve({
        ...submission,
        status: SubmissionStatus.APPROVED,
        adminNote: '확인',
        approvedJobId: 'job-1',
        reviewedBy: { username: 'admin' },
        reviewedAt: createdAt,
        updatedAt: createdAt,
      });
    });

    const result = await service.approveJobSubmission(
      'submission-1',
      'admin-1',
      '확인',
    );

    expect(tx.source.upsert).toHaveBeenCalledWith({
      where: { name: '기업회원 제출' },
      update: {},
      create: {
        name: '기업회원 제출',
        description: '기업회원이 제출하고 관리자가 승인한 채용공고',
      },
    });
    const jobCreateArg = capturedJobCreateArg as {
      data: {
        companyId: string;
        sourceId: string;
        companyType: CompanyType;
        originalUrl: string;
      };
    };
    expect(jobCreateArg.data).toMatchObject({
      companyId: 'company-1',
      sourceId: 'source-1',
      companyType: CompanyType.LOCAL_ACCOUNTING_FIRM,
      originalUrl: 'https://example.com/job',
    });
    const updateArg = capturedSubmissionUpdateArg as {
      data: {
        status: SubmissionStatus;
        approvedJobId: string;
        reviewedById: string;
      };
    };
    expect(updateArg.data).toMatchObject({
      status: SubmissionStatus.APPROVED,
      approvedJobId: 'job-1',
      reviewedById: 'admin-1',
    });
    expect(result.approvedJobId).toBe('job-1');
  });

  it('rejects already processed job submissions', async () => {
    tx.jobSubmission.findUnique.mockResolvedValue({
      status: SubmissionStatus.APPROVED,
    });

    await expect(
      service.approveJobSubmission('submission-1', 'admin-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.job.create).not.toHaveBeenCalled();
  });

  it('approves a pending update submission by updating the target job', async () => {
    const createdAt = new Date('2026-05-06T00:00:00.000Z');
    const submission = {
      id: 'submission-update-1',
      companyId: 'company-1',
      company: {
        id: 'company-1',
        name: '테스트회계법인',
        type: CompanyType.LOCAL_ACCOUNTING_FIRM,
      },
      submittedBy: { username: 'company-user' },
      reviewedBy: null,
      targetJob: { id: 'job-1', title: '기존 공고' },
      submissionType: SubmissionType.UPDATE,
      targetJobId: 'job-1',
      title: '수정 공고',
      description: '수정 설명',
      originalUrl: 'https://example.com/job-updated',
      jobFamily: JobFamily.TAX,
      employmentType: EmploymentType.FULL_TIME,
      kicpaCondition: KicpaCondition.REQUIRED,
      traineeStatus: TraineeStatus.AVAILABLE,
      practicalTrainingInstitution: true,
      minExperienceYears: 1,
      maxExperienceYears: 3,
      location: '서울',
      deadlineType: DeadlineType.UNTIL_FILLED,
      deadline: null,
      status: SubmissionStatus.PENDING,
      adminNote: null,
      approvedJobId: null,
      createdAt,
      updatedAt: createdAt,
      reviewedAt: null,
    };
    tx.jobSubmission.findUnique.mockResolvedValue(submission);
    tx.job.findFirst.mockResolvedValue({ id: 'job-1' });
    let capturedJobUpdateArg: unknown;
    tx.job.update.mockImplementation((args: unknown) => {
      capturedJobUpdateArg = args;
      return Promise.resolve({ id: 'job-1' });
    });
    tx.jobSubmission.update.mockResolvedValue({
      ...submission,
      status: SubmissionStatus.APPROVED,
      reviewedBy: { username: 'admin' },
      reviewedAt: createdAt,
      updatedAt: createdAt,
    });

    await service.approveJobSubmission(
      'submission-update-1',
      'admin-1',
      '확인',
    );

    expect(tx.source.upsert).not.toHaveBeenCalled();
    expect(tx.job.create).not.toHaveBeenCalled();
    expect(tx.job.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'job-1',
        companyId: 'company-1',
        status: JobStatus.OPEN,
      },
      select: { id: true },
    });
    const updateArg = capturedJobUpdateArg as {
      where: { id: string };
      data: {
        title: string;
        description: string;
        originalUrl: string;
        companyType: CompanyType;
      };
    };
    expect(updateArg).toMatchObject({
      where: { id: 'job-1' },
      data: {
        title: '수정 공고',
        description: '수정 설명',
        originalUrl: 'https://example.com/job-updated',
        companyType: CompanyType.LOCAL_ACCOUNTING_FIRM,
      },
    });
  });

  it('rejects a profile submission without updating the public company', async () => {
    const createdAt = new Date('2026-05-06T00:00:00.000Z');
    const reviewed = {
      id: 'profile-1',
      companyId: 'company-1',
      company: { id: 'company-1', name: '테스트회계법인' },
      submittedBy: { username: 'company-user' },
      reviewedBy: { username: 'admin' },
      proposed: { name: '새 회사명' },
      status: SubmissionStatus.REJECTED,
      adminNote: '보류',
      createdAt,
      updatedAt: createdAt,
      reviewedAt: createdAt,
    };
    prisma.companyProfileSubmission.findUnique.mockResolvedValue({
      status: SubmissionStatus.PENDING,
    });
    prisma.companyProfileSubmission.update.mockResolvedValue(reviewed);

    await service.rejectProfileSubmission('profile-1', 'admin-1', '보류');

    expect(tx.company.update).not.toHaveBeenCalled();
  });

  it('approves CPA verification requests and maps unplaced CPAs to no employment history', async () => {
    const createdAt = new Date('2026-05-06T00:00:00.000Z');
    const request = {
      id: 'verification-1',
      userId: 'user-1',
      user: { username: 'jobseeker', displayName: 'CPA user' },
      reviewedBy: null,
      applicantName: 'Kim CPA',
      birthDate: '1998-03-14',
      registrationNumber: 'CPA-123456',
      registrationNumberLast4: '3456',
      requestedCareerStage: PersonalCareerStage.CPA_UNPLACED,
      status: PersonalVerificationRequestStatus.PENDING,
      adminNote: null,
      reviewedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
    tx.personalVerificationRequest.findUnique.mockResolvedValue(request);
    tx.personalVerificationRequest.update.mockResolvedValue({
      ...request,
      birthDate: null,
      registrationNumber: null,
      status: PersonalVerificationRequestStatus.APPROVED,
      reviewedBy: { username: 'admin' },
      reviewedAt: createdAt,
    });

    const result = await service.approvePersonalVerificationRequest(
      'verification-1',
      'admin-1',
      'ok',
    );

    const upsertArg = firstMockArg<{
      where: { userId: string };
      update: {
        cpaVerificationStatus: CpaVerificationStatus;
        careerStage: PersonalCareerStage;
        employmentHistoryStatus: EmploymentHistoryStatus;
      };
      create: {
        userId: string;
        cpaVerificationStatus: CpaVerificationStatus;
        careerStage: PersonalCareerStage;
        employmentHistoryStatus: EmploymentHistoryStatus;
      };
    }>(tx.personalProfile.upsert);
    expect(upsertArg.where.userId).toBe('user-1');
    expect(upsertArg.update).toMatchObject({
      cpaVerificationStatus: CpaVerificationStatus.CPA_VERIFIED,
      careerStage: PersonalCareerStage.CPA_UNPLACED,
      employmentHistoryStatus: EmploymentHistoryStatus.NONE,
    });
    expect(upsertArg.create).toMatchObject({
      userId: 'user-1',
      cpaVerificationStatus: CpaVerificationStatus.CPA_VERIFIED,
      careerStage: PersonalCareerStage.CPA_UNPLACED,
      employmentHistoryStatus: EmploymentHistoryStatus.NONE,
    });

    const updateArg = firstMockArg<{
      where: { id: string };
      data: {
        status: PersonalVerificationRequestStatus;
        birthDate: null;
        registrationNumber: null;
      };
    }>(tx.personalVerificationRequest.update);
    expect(updateArg.where.id).toBe('verification-1');
    expect(updateArg.data).toMatchObject({
      status: PersonalVerificationRequestStatus.APPROVED,
      birthDate: null,
      registrationNumber: null,
    });
    expect(result.registrationNumber).toBeNull();
  });

  it('maps trainee and licensed CPA verification approvals to employment history', async () => {
    const createdAt = new Date('2026-05-06T00:00:00.000Z');
    const request = {
      id: 'verification-2',
      userId: 'user-2',
      user: { username: 'trainee', displayName: null },
      reviewedBy: null,
      applicantName: 'Lee CPA',
      birthDate: '1997-01-01',
      registrationNumber: 'T-1111',
      registrationNumberLast4: '1111',
      requestedCareerStage: PersonalCareerStage.TRAINEE,
      status: PersonalVerificationRequestStatus.PENDING,
      adminNote: null,
      reviewedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
    tx.personalVerificationRequest.findUnique.mockResolvedValue(request);
    tx.personalVerificationRequest.update.mockResolvedValue({
      ...request,
      status: PersonalVerificationRequestStatus.APPROVED,
      birthDate: null,
      registrationNumber: null,
      reviewedBy: { username: 'admin' },
      reviewedAt: createdAt,
    });

    await service.approvePersonalVerificationRequest(
      'verification-2',
      'admin-1',
    );

    const upsertArg = firstMockArg<{
      update: { employmentHistoryStatus: EmploymentHistoryStatus };
    }>(tx.personalProfile.upsert);
    expect(upsertArg.update.employmentHistoryStatus).toBe(
      EmploymentHistoryStatus.HAS_EMPLOYMENT,
    );
  });
});

function firstMockArg<T>(mock: { mock: { calls: unknown[][] } }): T {
  return mock.mock.calls[0][0] as T;
}
