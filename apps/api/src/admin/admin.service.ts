import type {
  CompanyProfileProposal,
  PersonalVerificationRequestItem,
} from '@cpa/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  CompanyType,
  CpaVerificationStatus,
  DeadlineType,
  EmploymentHistoryStatus,
  JobStatus,
  PersonalCareerStage,
  PersonalVerificationRequestStatus,
  Prisma,
  SubmissionStatus,
  SubmissionType,
  UserRole,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

const jobSubmissionInclude = {
  company: { select: { id: true, name: true, type: true } },
  submittedBy: { select: { username: true } },
  reviewedBy: { select: { username: true } },
  targetJob: { select: { id: true, title: true } },
} satisfies Prisma.JobSubmissionInclude;

const profileSubmissionInclude = {
  company: { select: { id: true, name: true } },
  submittedBy: { select: { username: true } },
  reviewedBy: { select: { username: true } },
} satisfies Prisma.CompanyProfileSubmissionInclude;

const personalVerificationRequestInclude = {
  user: { select: { username: true, displayName: true } },
  reviewedBy: { select: { username: true } },
} satisfies Prisma.PersonalVerificationRequestInclude;

type JobSubmissionRecord = Prisma.JobSubmissionGetPayload<{
  include: typeof jobSubmissionInclude;
}>;

type ProfileSubmissionRecord = Prisma.CompanyProfileSubmissionGetPayload<{
  include: typeof profileSubmissionInclude;
}>;

type PersonalVerificationRequestRecord =
  Prisma.PersonalVerificationRequestGetPayload<{
    include: typeof personalVerificationRequestInclude;
  }>;

const adminJobInclude = {
  company: {
    include: {
      logoAsset: { select: { publicUrl: true } },
    },
  },
  source: true,
} satisfies Prisma.JobInclude;

const adminCompanyInclude = {
  logoAsset: { select: { publicUrl: true } },
  backgroundAsset: { select: { publicUrl: true } },
  _count: { select: { jobs: true } },
} satisfies Prisma.CompanyInclude;

type AdminJobRecord = Prisma.JobGetPayload<{ include: typeof adminJobInclude }>;
type AdminCompanyRecord = Prisma.CompanyGetPayload<{
  include: typeof adminCompanyInclude;
}>;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  async dashboard() {
    const [
      jobs,
      companies,
      members,
      openJobs,
      closedJobs,
      draftJobs,
      recentJobs,
      recentCompanies,
    ] = await this.prisma.$transaction([
      this.prisma.job.count(),
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.job.count({ where: { status: JobStatus.OPEN } }),
      this.prisma.job.count({ where: { status: JobStatus.CLOSED } }),
      this.prisma.job.count({ where: { status: JobStatus.DRAFT } }),
      this.prisma.job.findMany({
        include: adminJobInclude,
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.company.findMany({
        include: adminCompanyInclude,
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const jobsByStatus = {
      [JobStatus.OPEN]: openJobs,
      [JobStatus.CLOSED]: closedJobs,
      [JobStatus.DRAFT]: draftJobs,
    };

    return {
      counts: {
        jobs,
        companies,
        members,
        jobsByStatus,
      },
      recentJobs: recentJobs.map((job) => this.toAdminJob(job)),
      recentCompanies: recentCompanies.map((company) =>
        this.toAdminCompany(company),
      ),
    };
  }

  async listSources() {
    const items = await this.prisma.source.findMany({
      orderBy: { name: 'asc' },
    });
    return { items };
  }

  async listJobs(query: Record<string, string | undefined>) {
    const { page, pageSize } = this.parsePagination(query);
    const where = this.buildAdminJobWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        include: adminJobInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items: items.map((job) => this.toAdminJob(job)),
      page,
      pageSize,
      total,
    };
  }

  async getJob(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: adminJobInclude,
    });
    if (!job) throw new NotFoundException('Job not found.');
    return this.toAdminJob(job);
  }

  async createJob(dto: CreateJobDto) {
    const job = await this.prisma.job.create({
      data: this.toJobWriteData(dto),
      include: adminJobInclude,
    });
    if (job.status === JobStatus.OPEN) {
      await this.notificationsService?.notifyTagSubscribersForNewJob(job.id);
    }
    return this.toAdminJob(job);
  }

  async updateJob(id: string, dto: CreateJobDto) {
    const previous = await this.prisma.job.findUnique({
      where: { id },
      select: { status: true, deadlineType: true, deadline: true },
    });
    if (!previous) throw new NotFoundException('Job not found.');

    const job = await this.prisma.job.update({
      where: { id },
      data: this.toJobWriteData(dto),
      include: adminJobInclude,
    });
    await this.emitJobNotifications(id, previous, {
      status: job.status,
      deadlineType: job.deadlineType,
      deadline: job.deadline,
      updatedAt: job.updatedAt,
    });
    return this.toAdminJob(job);
  }

  async updateJobStatus(id: string, status: JobStatus | undefined) {
    if (!status || !this.isJobStatus(status)) {
      throw new BadRequestException('Valid job status is required.');
    }

    const previous = await this.prisma.job.findUnique({
      where: { id },
      select: { status: true, deadlineType: true, deadline: true },
    });
    if (!previous) throw new NotFoundException('Job not found.');

    const job = await this.prisma.job.update({
      where: { id },
      data: { status },
      include: adminJobInclude,
    });
    await this.emitJobNotifications(id, previous, {
      status: job.status,
      deadlineType: job.deadlineType,
      deadline: job.deadline,
      updatedAt: job.updatedAt,
    });
    return this.toAdminJob(job);
  }

  async closeJob(id: string) {
    return this.updateJobStatus(id, JobStatus.CLOSED);
  }

  async refreshJobCheckedAt(id: string) {
    const job = await this.prisma.job.update({
      where: { id },
      data: { lastCheckedAt: new Date() },
      include: adminJobInclude,
    });
    return this.toAdminJob(job);
  }

  async listAiSuggestions() {
    const items = await this.prisma.aiSuggestion.findMany({
      include: { job: { select: { id: true, title: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return {
      items: items.map((item) => ({
        id: item.id,
        jobId: item.jobId,
        jobTitle: item.job.title,
        summary: item.summary,
        tags: item.tags,
        risks: item.risks,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    };
  }

  async reviewAiSuggestion(id: string, action: 'approve' | 'reject') {
    const suggestion = await this.prisma.aiSuggestion.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!suggestion) {
      throw new NotFoundException('AI 제안을 찾을 수 없습니다.');
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const updated = await this.prisma.aiSuggestion.update({
      where: { id },
      data: { status },
      include: { job: { select: { id: true, title: true } } },
    });
    return {
      id: updated.id,
      jobId: updated.jobId,
      jobTitle: updated.job.title,
      summary: updated.summary,
      tags: updated.tags,
      risks: updated.risks,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async listCompanies(query: Record<string, string | undefined>) {
    const { page, pageSize } = this.parsePagination(query);
    const where = this.buildAdminCompanyWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        include: adminCompanyInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      items: items.map((company) => this.toAdminCompany(company)),
      page,
      pageSize,
      total,
    };
  }

  async getCompany(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: adminCompanyInclude,
    });
    if (!company) throw new NotFoundException('Company not found.');
    return this.toAdminCompany(company);
  }

  async updateCompany(id: string, payload: Record<string, unknown>) {
    const existing = await this.prisma.company.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Company not found.');

    const data = this.toCompanyWriteData(payload);

    const company = await this.prisma.company.update({
      where: { id },
      data,
      include: adminCompanyInclude,
    });
    return this.toAdminCompany(company);
  }

  async createCompany(payload: Record<string, unknown>) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name) {
      throw new BadRequestException('회사명은 필수입니다.');
    }

    const type =
      typeof payload.type === 'string' && this.isCompanyType(payload.type)
        ? payload.type
        : 'LOCAL_ACCOUNTING_FIRM';

    let ownerUserId =
      typeof payload.ownerUserId === 'string' ? payload.ownerUserId : '';
    if (!ownerUserId) {
      const admin = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      });
      if (!admin) {
        throw new BadRequestException('소유자를 지정할 수 없습니다.');
      }
      ownerUserId = admin.id;
    }

    const writeData = this.toCompanyWriteData(payload);

    const company = await this.prisma.company.create({
      data: {
        name,
        type,
        websiteUrl: (writeData.websiteUrl as string | null) ?? null,
        description: (writeData.description as string | null) ?? null,
        businessNumber: (writeData.businessNumber as string | null) ?? null,
        externalLinks: (writeData.externalLinks as string[]) ?? [],
        tags: (writeData.tags as string[]) ?? [],
        employeeCount: (writeData.employeeCount as number | null) ?? null,
        averageSalary: (writeData.averageSalary as number | null) ?? null,
        foundedYear: (writeData.foundedYear as number | null) ?? null,
        recentAttritionRate:
          (writeData.recentAttritionRate as number | null) ?? null,
        owner: { connect: { id: ownerUserId } },
      },
      include: adminCompanyInclude,
    });
    return this.toAdminCompany(company);
  }

  async listMembers(query: Record<string, string | undefined>) {
    const { page, pageSize } = this.parsePagination(query);
    const where = this.buildAdminMemberWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((member) => ({
        id: member.id,
        username: member.username,
        displayName: member.displayName,
        role: member.role,
        accountStatus: 'ACTIVE',
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      })),
      page,
      pageSize,
      total,
    };
  }

  async listPersonalVerificationRequests(): Promise<{
    items: PersonalVerificationRequestItem[];
  }> {
    const items = await this.prisma.personalVerificationRequest.findMany({
      include: personalVerificationRequestInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      items: items.map((item) => this.toPersonalVerificationRequestItem(item)),
    };
  }

  async approvePersonalVerificationRequest(
    id: string,
    adminUserId: string,
    adminNote?: string,
  ): Promise<PersonalVerificationRequestItem> {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.personalVerificationRequest.findUnique({
        where: { id },
        include: personalVerificationRequestInclude,
      });
      if (!request) {
        throw new NotFoundException('CPA verification request not found.');
      }
      this.assertVerificationPending(request.status);

      const reviewedAt = new Date();
      await tx.personalProfile.upsert({
        where: { userId: request.userId },
        update: {
          cpaVerificationStatus: CpaVerificationStatus.CPA_VERIFIED,
          careerStage: request.requestedCareerStage,
          employmentHistoryStatus: this.employmentHistoryForCareerStage(
            request.requestedCareerStage,
          ),
          verifiedAt: reviewedAt,
        },
        create: {
          userId: request.userId,
          cpaVerificationStatus: CpaVerificationStatus.CPA_VERIFIED,
          careerStage: request.requestedCareerStage,
          employmentHistoryStatus: this.employmentHistoryForCareerStage(
            request.requestedCareerStage,
          ),
          verifiedAt: reviewedAt,
        },
      });

      const reviewed = await tx.personalVerificationRequest.update({
        where: { id },
        data: {
          status: PersonalVerificationRequestStatus.APPROVED,
          adminNote: this.optionalTrimmed(adminNote),
          reviewedById: adminUserId,
          reviewedAt,
          birthDate: null,
          registrationNumber: null,
        },
        include: personalVerificationRequestInclude,
      });

      return this.toPersonalVerificationRequestItem(reviewed);
    });
  }

  async rejectPersonalVerificationRequest(
    id: string,
    adminUserId: string,
    adminNote?: string,
  ): Promise<PersonalVerificationRequestItem> {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.personalVerificationRequest.findUnique({
        where: { id },
        include: personalVerificationRequestInclude,
      });
      if (!request) {
        throw new NotFoundException('CPA verification request not found.');
      }
      this.assertVerificationPending(request.status);

      await tx.personalProfile.upsert({
        where: { userId: request.userId },
        update: {
          cpaVerificationStatus: CpaVerificationStatus.UNVERIFIED,
          careerStage: null,
          employmentHistoryStatus: EmploymentHistoryStatus.UNKNOWN,
          verifiedAt: null,
        },
        create: {
          userId: request.userId,
          cpaVerificationStatus: CpaVerificationStatus.UNVERIFIED,
          employmentHistoryStatus: EmploymentHistoryStatus.UNKNOWN,
        },
      });

      const reviewed = await tx.personalVerificationRequest.update({
        where: { id },
        data: {
          status: PersonalVerificationRequestStatus.REJECTED,
          adminNote: this.optionalTrimmed(adminNote),
          reviewedById: adminUserId,
          reviewedAt: new Date(),
          birthDate: null,
          registrationNumber: null,
        },
        include: personalVerificationRequestInclude,
      });

      return this.toPersonalVerificationRequestItem(reviewed);
    });
  }

  async listJobSubmissions() {
    const items = await this.prisma.jobSubmission.findMany({
      include: jobSubmissionInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return { items: items.map((item) => this.toJobSubmissionItem(item)) };
  }

  async approveJobSubmission(
    id: string,
    adminUserId: string,
    adminNote?: string,
  ) {
    const outcome = await this.prisma.$transaction(async (tx) => {
      const submission = await tx.jobSubmission.findUnique({
        where: { id },
        include: jobSubmissionInclude,
      });
      if (!submission) {
        throw new NotFoundException('공고 제출을 찾을 수 없습니다.');
      }
      this.assertPending(submission.status);
      if (!submission.originalUrl) {
        throw new BadRequestException(
          '원문 링크가 있는 공고만 승인할 수 있습니다.',
        );
      }

      if (submission.submissionType === SubmissionType.UPDATE) {
        if (!submission.targetJobId) {
          throw new BadRequestException('수정 대상 공고가 필요합니다.');
        }

        const targetJob = await tx.job.findFirst({
          where: {
            id: submission.targetJobId,
            companyId: submission.companyId,
            status: JobStatus.OPEN,
          },
          select: {
            id: true,
            status: true,
            deadlineType: true,
            deadline: true,
          },
        });
        if (!targetJob) {
          throw new ConflictException('수정 대상 공고가 공개 상태가 아닙니다.');
        }

        const updatedJob = await tx.job.update({
          where: { id: targetJob.id },
          data: {
            title: submission.title,
            description: submission.description,
            originalUrl: submission.originalUrl,
            jobFamily: submission.jobFamily,
            employmentType: submission.employmentType,
            companyType: submission.company.type,
            kicpaCondition: submission.kicpaCondition,
            traineeStatus: submission.traineeStatus,
            practicalTrainingInstitution:
              submission.practicalTrainingInstitution,
            minExperienceYears: submission.minExperienceYears,
            maxExperienceYears: submission.maxExperienceYears,
            location: submission.location,
            deadlineType: submission.deadlineType,
            deadline: submission.deadline,
            lastCheckedAt: new Date(),
          },
          select: {
            status: true,
            deadlineType: true,
            deadline: true,
            updatedAt: true,
          },
        });

        const reviewed = await tx.jobSubmission.update({
          where: { id },
          data: {
            status: SubmissionStatus.APPROVED,
            adminNote: this.optionalTrimmed(adminNote),
            reviewedById: adminUserId,
            reviewedAt: new Date(),
          },
          include: jobSubmissionInclude,
        });

        return {
          kind: 'updated' as const,
          item: this.toJobSubmissionItem(reviewed),
          updatedJobId: targetJob.id,
          previousJob: {
            status: targetJob.status,
            deadlineType: targetJob.deadlineType,
            deadline: targetJob.deadline,
          },
          currentJob: updatedJob,
        };
      }

      const source = await tx.source.upsert({
        where: { name: '기업회원 제출' },
        update: {},
        create: {
          name: '기업회원 제출',
          description: '기업회원이 제출하고 관리자가 승인한 채용공고',
        },
      });

      const job = await tx.job.create({
        data: {
          title: submission.title,
          description: submission.description,
          companyId: submission.companyId,
          sourceId: source.id,
          originalUrl: submission.originalUrl,
          jobFamily: submission.jobFamily,
          employmentType: submission.employmentType,
          companyType: submission.company.type,
          kicpaCondition: submission.kicpaCondition,
          traineeStatus: submission.traineeStatus,
          practicalTrainingInstitution: submission.practicalTrainingInstitution,
          minExperienceYears: submission.minExperienceYears,
          maxExperienceYears: submission.maxExperienceYears,
          location: submission.location,
          deadlineType: submission.deadlineType,
          deadline: submission.deadline,
          status: JobStatus.OPEN,
          lastCheckedAt: new Date(),
        },
        select: { id: true },
      });

      const reviewed = await tx.jobSubmission.update({
        where: { id },
        data: {
          status: SubmissionStatus.APPROVED,
          adminNote: this.optionalTrimmed(adminNote),
          approvedJobId: job.id,
          reviewedById: adminUserId,
          reviewedAt: new Date(),
        },
        include: jobSubmissionInclude,
      });

      return {
        kind: 'created' as const,
        item: this.toJobSubmissionItem(reviewed),
        createdJobId: job.id,
      };
    });

    if (outcome.kind === 'created') {
      await this.notificationsService?.notifyTagSubscribersForNewJob(
        outcome.createdJobId,
      );
    }
    if (outcome.kind === 'updated') {
      await this.emitJobNotifications(
        outcome.updatedJobId,
        outcome.previousJob,
        outcome.currentJob,
      );
    }

    return outcome.item;
  }

  async rejectJobSubmission(
    id: string,
    adminUserId: string,
    adminNote?: string,
  ) {
    const submission = await this.prisma.jobSubmission.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!submission) {
      throw new NotFoundException('공고 제출을 찾을 수 없습니다.');
    }
    this.assertPending(submission.status);

    const reviewed = await this.prisma.jobSubmission.update({
      where: { id },
      data: {
        status: SubmissionStatus.REJECTED,
        adminNote: this.optionalTrimmed(adminNote),
        reviewedById: adminUserId,
        reviewedAt: new Date(),
      },
      include: jobSubmissionInclude,
    });

    return this.toJobSubmissionItem(reviewed);
  }

  async listProfileSubmissions() {
    const items = await this.prisma.companyProfileSubmission.findMany({
      include: profileSubmissionInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return { items: items.map((item) => this.toProfileSubmissionItem(item)) };
  }

  async approveProfileSubmission(
    id: string,
    adminUserId: string,
    adminNote?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.companyProfileSubmission.findUnique({
        where: { id },
        include: profileSubmissionInclude,
      });
      if (!submission) {
        throw new NotFoundException('회사 정보 수정 요청을 찾을 수 없습니다.');
      }
      this.assertPending(submission.status);

      const proposed = this.toCompanyProfileProposal(submission.proposed);
      if (proposed.name) {
        const duplicate = await tx.company.findFirst({
          where: {
            name: proposed.name,
            id: { not: submission.companyId },
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new ConflictException('이미 등록된 회사명입니다.');
        }
      }

      await tx.company.update({
        where: { id: submission.companyId },
        data: this.toCompanyUpdateData(proposed),
      });

      const reviewed = await tx.companyProfileSubmission.update({
        where: { id },
        data: {
          status: SubmissionStatus.APPROVED,
          adminNote: this.optionalTrimmed(adminNote),
          reviewedById: adminUserId,
          reviewedAt: new Date(),
        },
        include: profileSubmissionInclude,
      });

      return this.toProfileSubmissionItem(reviewed);
    });
  }

  async rejectProfileSubmission(
    id: string,
    adminUserId: string,
    adminNote?: string,
  ) {
    const submission = await this.prisma.companyProfileSubmission.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!submission) {
      throw new NotFoundException('회사 정보 수정 요청을 찾을 수 없습니다.');
    }
    this.assertPending(submission.status);

    const reviewed = await this.prisma.companyProfileSubmission.update({
      where: { id },
      data: {
        status: SubmissionStatus.REJECTED,
        adminNote: this.optionalTrimmed(adminNote),
        reviewedById: adminUserId,
        reviewedAt: new Date(),
      },
      include: profileSubmissionInclude,
    });

    return this.toProfileSubmissionItem(reviewed);
  }

  private async emitJobNotifications(
    jobId: string,
    previous: {
      status: JobStatus;
      deadlineType: DeadlineType;
      deadline: Date | null;
    },
    current: {
      status: JobStatus;
      deadlineType: DeadlineType;
      deadline: Date | null;
      updatedAt: Date;
    },
  ) {
    if (previous.status !== current.status) {
      await this.notificationsService?.notifyBookmarkStatusChanged(
        jobId,
        current.status,
        current.updatedAt,
      );
    }

    if (
      previous.status !== JobStatus.OPEN &&
      current.status === JobStatus.OPEN
    ) {
      await this.notificationsService?.notifyTagSubscribersForNewJob(jobId);
    }

    if (
      current.status === JobStatus.OPEN &&
      (previous.deadlineType !== current.deadlineType ||
        previous.deadline?.getTime() !== current.deadline?.getTime())
    ) {
      await this.notificationsService?.notifyBookmarkDeadlineSoonForJob(jobId);
    }
  }

  private assertPending(status: SubmissionStatus) {
    if (status !== SubmissionStatus.PENDING) {
      throw new ConflictException('이미 처리된 제출입니다.');
    }
  }

  private assertVerificationPending(status: PersonalVerificationRequestStatus) {
    if (status !== PersonalVerificationRequestStatus.PENDING) {
      throw new ConflictException(
        'CPA verification request is already reviewed.',
      );
    }
  }

  private employmentHistoryForCareerStage(stage: PersonalCareerStage) {
    return stage === PersonalCareerStage.CPA_UNPLACED
      ? EmploymentHistoryStatus.NONE
      : EmploymentHistoryStatus.HAS_EMPLOYMENT;
  }

  private toCompanyUpdateData(proposed: CompanyProfileProposal) {
    const data: Prisma.CompanyUpdateInput = {};
    if (proposed.name !== undefined) data.name = proposed.name;
    if (proposed.type !== undefined) data.type = proposed.type;
    if (proposed.websiteUrl !== undefined)
      data.websiteUrl = proposed.websiteUrl;
    if (proposed.description !== undefined) {
      data.description = proposed.description;
    }
    if (proposed.businessNumber !== undefined) {
      data.businessNumber = proposed.businessNumber;
    }
    if (proposed.externalLinks !== undefined) {
      data.externalLinks = proposed.externalLinks;
    }
    if (proposed.tags !== undefined) data.tags = proposed.tags;
    return data;
  }

  private toCompanyProfileProposal(value: Prisma.JsonValue) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const input = value as Record<string, unknown>;
    const proposal: CompanyProfileProposal = {};
    if (typeof input.name === 'string') proposal.name = input.name;
    if (typeof input.type === 'string') {
      proposal.type = input.type as CompanyProfileProposal['type'];
    }
    for (const key of [
      'websiteUrl',
      'description',
      'businessNumber',
    ] as const) {
      const raw = input[key];
      if (typeof raw === 'string' || raw === null) {
        proposal[key] = raw;
      }
    }
    if (Array.isArray(input.externalLinks)) {
      proposal.externalLinks = input.externalLinks.filter(
        (item): item is string => typeof item === 'string',
      );
    }
    if (Array.isArray(input.tags)) {
      proposal.tags = input.tags.filter(
        (item): item is string => typeof item === 'string',
      );
    }
    return proposal;
  }

  private toJobSubmissionItem(submission: JobSubmissionRecord) {
    return {
      id: submission.id,
      companyId: submission.companyId,
      companyName: submission.company.name,
      title: submission.title,
      description: submission.description,
      originalUrl: submission.originalUrl,
      jobFamily: submission.jobFamily,
      employmentType: submission.employmentType,
      kicpaCondition: submission.kicpaCondition,
      traineeStatus: submission.traineeStatus,
      practicalTrainingInstitution: submission.practicalTrainingInstitution,
      minExperienceYears: submission.minExperienceYears,
      maxExperienceYears: submission.maxExperienceYears,
      location: submission.location,
      deadlineType: submission.deadlineType,
      deadline: submission.deadline?.toISOString() ?? null,
      status: submission.status,
      adminNote: submission.adminNote,
      approvedJobId: submission.approvedJobId,
      submissionType: submission.submissionType,
      targetJobId: submission.targetJobId,
      targetJobTitle: submission.targetJob?.title ?? null,
      submittedByUsername: submission.submittedBy.username,
      reviewedByUsername: submission.reviewedBy?.username ?? null,
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() ?? null,
    };
  }

  private toProfileSubmissionItem(submission: ProfileSubmissionRecord) {
    return {
      id: submission.id,
      companyId: submission.companyId,
      companyName: submission.company.name,
      proposed: this.toCompanyProfileProposal(submission.proposed),
      status: submission.status,
      adminNote: submission.adminNote,
      submittedByUsername: submission.submittedBy.username,
      reviewedByUsername: submission.reviewedBy?.username ?? null,
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() ?? null,
    };
  }

  private toPersonalVerificationRequestItem(
    request: PersonalVerificationRequestRecord,
  ): PersonalVerificationRequestItem {
    return {
      id: request.id,
      userId: request.userId,
      username: request.user.username,
      displayName: request.user.displayName,
      applicantName: request.applicantName,
      birthDate: request.birthDate,
      registrationNumber: request.registrationNumber,
      registrationNumberLast4: request.registrationNumberLast4,
      requestedCareerStage: request.requestedCareerStage,
      status: request.status,
      adminNote: request.adminNote,
      reviewedByUsername: request.reviewedBy?.username ?? null,
      reviewedAt: request.reviewedAt?.toISOString() ?? null,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }

  private toAdminJob(job: AdminJobRecord) {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      companyId: job.companyId,
      companyName: job.company.name,
      sourceId: job.sourceId,
      sourceName: job.source.name,
      originalUrl: job.originalUrl,
      jobFamily: job.jobFamily,
      employmentType: job.employmentType,
      companyType: job.companyType,
      kicpaCondition: job.kicpaCondition,
      traineeStatus: job.traineeStatus,
      practicalTrainingInstitution: job.practicalTrainingInstitution,
      minExperienceYears: job.minExperienceYears,
      maxExperienceYears: job.maxExperienceYears,
      location: job.location,
      deadlineType: job.deadlineType,
      deadline: job.deadline?.toISOString() ?? null,
      status: job.status,
      lastCheckedAt: job.lastCheckedAt.toISOString(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  private toAdminCompany(company: AdminCompanyRecord) {
    return {
      id: company.id,
      name: company.name,
      type: company.type,
      websiteUrl: company.websiteUrl,
      logoUrl: company.logoAsset?.publicUrl ?? null,
      backgroundUrl: company.backgroundAsset?.publicUrl ?? null,
      description: company.description,
      businessNumber: company.businessNumber,
      externalLinks: company.externalLinks,
      tags: company.tags,
      employeeCount: company.employeeCount,
      averageSalary: company.averageSalary,
      foundedYear: company.foundedYear,
      recentAttritionRate: company.recentAttritionRate,
      jobCount: company._count.jobs,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  private parsePagination(query: Record<string, string | undefined>) {
    return {
      page: this.clampNumber(query.page, 1, 1, 10_000),
      pageSize: this.clampNumber(query.pageSize, 20, 1, 100),
    };
  }

  private clampNumber(
    raw: string | undefined,
    fallback: number,
    min: number,
    max: number,
  ) {
    const number = Number(raw);
    if (!Number.isInteger(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  private buildAdminJobWhere(query: Record<string, string | undefined>) {
    const where: Prisma.JobWhereInput = {};
    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
        { source: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (query.companyId) where.companyId = query.companyId;
    if (query.status && this.isJobStatus(query.status)) {
      where.status = query.status;
    }
    return where;
  }

  private buildAdminCompanyWhere(query: Record<string, string | undefined>) {
    const where: Prisma.CompanyWhereInput = {};
    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }
    if (query.companyType && this.isCompanyType(query.companyType)) {
      where.type = query.companyType;
    }
    return where;
  }

  private buildAdminMemberWhere(query: Record<string, string | undefined>) {
    const where: Prisma.UserWhereInput = {};
    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (query.role && this.isUserRole(query.role)) where.role = query.role;
    return where;
  }

  private toJobWriteData(dto: CreateJobDto) {
    return {
      title: dto.title,
      description: dto.description,
      companyId: dto.companyId,
      sourceId: dto.sourceId,
      originalUrl: dto.originalUrl,
      jobFamily: dto.jobFamily,
      employmentType: dto.employmentType,
      companyType: dto.companyType,
      kicpaCondition: dto.kicpaCondition,
      traineeStatus: dto.traineeStatus,
      practicalTrainingInstitution: dto.practicalTrainingInstitution ?? null,
      minExperienceYears: dto.minExperienceYears ?? null,
      maxExperienceYears: dto.maxExperienceYears ?? null,
      location: dto.location ?? null,
      deadlineType: dto.deadlineType,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      status: dto.status ?? JobStatus.OPEN,
      lastCheckedAt: new Date(),
    };
  }

  private toCompanyWriteData(
    payload: Record<string, unknown>,
  ): Prisma.CompanyUpdateInput {
    const data: Prisma.CompanyUpdateInput = {};
    if (typeof payload.name === 'string') data.name = payload.name.trim();
    if (typeof payload.type === 'string' && this.isCompanyType(payload.type)) {
      data.type = payload.type;
    }
    if (typeof payload.websiteUrl === 'string' || payload.websiteUrl === null) {
      data.websiteUrl = payload.websiteUrl;
    }
    if (
      typeof payload.description === 'string' ||
      payload.description === null
    ) {
      data.description = payload.description;
    }
    if (
      typeof payload.businessNumber === 'string' ||
      payload.businessNumber === null
    ) {
      data.businessNumber = payload.businessNumber;
    }
    if (Array.isArray(payload.externalLinks)) {
      data.externalLinks = payload.externalLinks.filter(
        (item): item is string => typeof item === 'string',
      );
    }
    if (Array.isArray(payload.tags)) {
      data.tags = payload.tags.filter(
        (item): item is string => typeof item === 'string',
      );
    }
    if (
      typeof payload.employeeCount === 'number' ||
      payload.employeeCount === null
    ) {
      data.employeeCount = payload.employeeCount;
    }
    if (
      typeof payload.averageSalary === 'number' ||
      payload.averageSalary === null
    ) {
      data.averageSalary = payload.averageSalary;
    }
    if (
      typeof payload.foundedYear === 'number' ||
      payload.foundedYear === null
    ) {
      data.foundedYear = payload.foundedYear;
    }
    if (
      typeof payload.recentAttritionRate === 'number' ||
      payload.recentAttritionRate === null
    ) {
      data.recentAttritionRate = payload.recentAttritionRate;
    }
    return data;
  }

  private emptyJobStatusCounts() {
    return Object.values(JobStatus).reduce(
      (counts, status) => ({ ...counts, [status]: 0 }),
      {} as Record<JobStatus, number>,
    );
  }

  private isJobStatus(status: string): status is JobStatus {
    return Object.values(JobStatus).includes(status as JobStatus);
  }

  private isCompanyType(type: string): type is CompanyType {
    return Object.values(CompanyType).includes(type as CompanyType);
  }

  private isUserRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
  }

  private optionalTrimmed(value: string | undefined) {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
}
