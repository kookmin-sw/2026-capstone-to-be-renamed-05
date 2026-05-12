import type {
  CompanyDashboardResponse,
  CompanyProfileProposal,
  EmployeeTrendPoint,
} from '@cpa/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeadlineType,
  Job,
  JobStatus,
  Prisma,
  AssetPurpose,
  AssetStatus,
  SubmissionStatus,
  SubmissionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyJobSubmissionDto } from './dto/create-company-job-submission.dto';
import { CreateCompanyProfileSubmissionDto } from './dto/create-company-profile-submission.dto';
import { ListCompaniesDto } from './dto/list-companies.dto';
import { UpdateCompanyBackgroundDto } from './dto/update-company-background.dto';
import { UpdateCompanyLogoDto } from './dto/update-company-logo.dto';

const companyListInclude = {
  logoAsset: { select: { publicUrl: true } },
  backgroundAsset: { select: { publicUrl: true } },
  jobs: {
    where: { status: JobStatus.OPEN },
    select: { id: true },
  },
} satisfies Prisma.CompanyInclude;

const jobInclude = {
  company: {
    include: {
      logoAsset: { select: { publicUrl: true } },
      backgroundAsset: { select: { publicUrl: true } },
    },
  },
  source: true,
  labels: {
    include: {
      label: true,
    },
  },
} satisfies Prisma.JobInclude;

const companyDetailInclude = {
  logoAsset: { select: { publicUrl: true } },
  backgroundAsset: { select: { publicUrl: true } },
  jobs: {
    where: { status: JobStatus.OPEN },
    include: jobInclude,
    orderBy: [{ deadline: 'asc' as const }, { createdAt: 'desc' as const }],
  },
} satisfies Prisma.CompanyInclude;

const companyDashboardInclude = {
  ...companyDetailInclude,
  profileSubmissions: {
    where: { status: SubmissionStatus.PENDING },
    include: {
      company: { select: { name: true } },
      submittedBy: { select: { username: true } },
      reviewedBy: { select: { username: true } },
    },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.CompanyInclude;

const profileSubmissionInclude = {
  company: { select: { name: true } },
  submittedBy: { select: { username: true } },
  reviewedBy: { select: { username: true } },
} satisfies Prisma.CompanyProfileSubmissionInclude;

const jobSubmissionInclude = {
  company: { select: { name: true } },
  submittedBy: { select: { username: true } },
  reviewedBy: { select: { username: true } },
  targetJob: { select: { id: true, title: true } },
} satisfies Prisma.JobSubmissionInclude;

const managedJobInclude = {
  ...jobInclude,
  editSubmissions: {
    where: {
      submissionType: SubmissionType.UPDATE,
      status: SubmissionStatus.PENDING,
    },
    include: jobSubmissionInclude,
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.JobInclude;

type CompanyListRecord = Prisma.CompanyGetPayload<{
  include: typeof companyListInclude;
}>;

type CompanyDetailRecord = Prisma.CompanyGetPayload<{
  include: typeof companyDetailInclude;
}>;

type CompanyDashboardRecord = Prisma.CompanyGetPayload<{
  include: typeof companyDashboardInclude;
}>;

type JobWithRelations = Job &
  Prisma.JobGetPayload<{ include: typeof jobInclude }>;

type CompanyProfileSubmissionRecord =
  Prisma.CompanyProfileSubmissionGetPayload<{
    include: typeof profileSubmissionInclude;
  }>;

type JobSubmissionRecord = Prisma.JobSubmissionGetPayload<{
  include: typeof jobSubmissionInclude;
}>;

type ManagedJobRecord = Job &
  Prisma.JobGetPayload<{ include: typeof managedJobInclude }>;

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListCompaniesDto) {
    const where = this.buildWhere(query);

    const [companies, total, openTotal, noJobTotal] =
      await this.prisma.$transaction([
        this.prisma.company.findMany({
          where,
          include: companyListInclude,
          orderBy: this.buildOrderBy(query.sort),
        }),
        this.prisma.company.count({ where }),
        this.prisma.company.count({
          where: {
            ...where,
            jobs: { some: { status: JobStatus.OPEN } },
          },
        }),
        this.prisma.company.count({
          where: {
            ...where,
            jobs: { none: { status: JobStatus.OPEN } },
          },
        }),
      ]);

    return {
      items: companies.map((company) => this.toListItem(company)),
      total,
      openTotal,
      noJobTotal,
    };
  }

  async detail(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: companyDetailInclude,
    });

    if (!company) {
      throw new NotFoundException('회사를 찾을 수 없습니다.');
    }

    return this.toDetailItem(company);
  }

  async me(userId: string): Promise<CompanyDashboardResponse> {
    const company = await this.prisma.company.findUnique({
      where: { ownerUserId: userId },
      include: companyDashboardInclude,
    });

    if (!company) {
      throw new ForbiddenException('기업회원 회사 정보를 찾을 수 없습니다.');
    }

    return {
      company: this.toDetailItem(company),
      pendingProfileSubmission: company.profileSubmissions[0]
        ? this.toProfileSubmissionItem(company.profileSubmissions[0])
        : null,
    };
  }

  async createProfileSubmission(
    userId: string,
    dto: CreateCompanyProfileSubmissionDto,
  ) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const proposed = this.normalizeProfileProposal(dto);

    if (Object.keys(proposed).length === 0) {
      throw new BadRequestException('수정 요청 내용이 필요합니다.');
    }

    const pending = await this.prisma.companyProfileSubmission.findFirst({
      where: { companyId: company.id, status: SubmissionStatus.PENDING },
      select: { id: true },
    });
    if (pending) {
      throw new ConflictException(
        '이미 검수 대기 중인 회사 정보 수정 요청이 있습니다.',
      );
    }

    const submission = await this.prisma.companyProfileSubmission.create({
      data: {
        companyId: company.id,
        submittedById: userId,
        proposed,
      },
      include: profileSubmissionInclude,
    });

    return this.toProfileSubmissionItem(submission);
  }

  async updateLogo(userId: string, dto: UpdateCompanyLogoDto) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const logoAssetId = this.optionalTrimmed(dto.logoAssetId);

    if (!logoAssetId) {
      throw new BadRequestException('기업 이미지 파일을 업로드해 주세요.');
    }
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: logoAssetId,
        companyId: company.id,
        purpose: AssetPurpose.COMPANY_LOGO,
        status: AssetStatus.READY,
      },
      select: { id: true },
    });
    if (!asset) {
      throw new BadRequestException(
        '사용 가능한 기업 이미지 업로드를 찾을 수 없습니다.',
      );
    }

    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: { logoAsset: { connect: { id: asset.id } } },
      include: companyDetailInclude,
    });

    return this.toDetailItem(updated);
  }

  async updateBackground(userId: string, dto: UpdateCompanyBackgroundDto) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const backgroundAssetId = this.optionalTrimmed(dto.backgroundAssetId);

    if (!backgroundAssetId) {
      throw new BadRequestException('기업 배경 이미지 파일을 업로드해 주세요.');
    }
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: backgroundAssetId,
        companyId: company.id,
        purpose: AssetPurpose.COMPANY_BACKGROUND,
        status: AssetStatus.READY,
      },
      select: { id: true },
    });
    if (!asset) {
      throw new BadRequestException(
        '사용 가능한 기업 배경 이미지 업로드를 찾을 수 없습니다.',
      );
    }

    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: { backgroundAsset: { connect: { id: asset.id } } },
      include: companyDetailInclude,
    });

    return this.toDetailItem(updated);
  }

  async createJobSubmission(
    userId: string,
    dto: CreateCompanyJobSubmissionDto,
  ) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const deadline = this.normalizeDeadline(dto.deadlineType, dto.deadline);
    this.validateExperienceRange(
      dto.minExperienceYears,
      dto.maxExperienceYears,
    );

    const submission = await this.prisma.jobSubmission.create({
      data: {
        companyId: company.id,
        submittedById: userId,
        submissionType: SubmissionType.CREATE,
        title: dto.title.trim(),
        description: dto.description.trim(),
        originalUrl: dto.originalUrl.trim(),
        jobFamily: dto.jobFamily,
        employmentType: dto.employmentType,
        kicpaCondition: dto.kicpaCondition,
        traineeStatus: dto.traineeStatus,
        practicalTrainingInstitution: dto.practicalTrainingInstitution,
        minExperienceYears: dto.minExperienceYears,
        maxExperienceYears: dto.maxExperienceYears,
        location: this.optionalTrimmed(dto.location),
        deadlineType: dto.deadlineType,
        deadline,
      },
      include: jobSubmissionInclude,
    });

    return this.toJobSubmissionItem(submission);
  }

  async listMyJobs(userId: string) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const jobs = await this.prisma.job.findMany({
      where: {
        companyId: company.id,
        status: { in: [JobStatus.OPEN, JobStatus.CLOSED] },
      },
      include: managedJobInclude,
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }, { updatedAt: 'desc' }],
    });

    return { items: jobs.map((job) => this.toManagedJobItem(job)) };
  }

  async createJobEditSubmission(
    userId: string,
    jobId: string,
    dto: CreateCompanyJobSubmissionDto,
  ) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id,
        status: JobStatus.OPEN,
      },
      select: { id: true },
    });
    if (!job) {
      throw new NotFoundException('수정 가능한 공고를 찾을 수 없습니다.');
    }

    const pending = await this.prisma.jobSubmission.findFirst({
      where: {
        targetJobId: job.id,
        submissionType: SubmissionType.UPDATE,
        status: SubmissionStatus.PENDING,
      },
      select: { id: true },
    });
    if (pending) {
      throw new ConflictException(
        '이미 검수 대기 중인 공고 수정 요청이 있습니다.',
      );
    }

    const deadline = this.normalizeDeadline(dto.deadlineType, dto.deadline);
    this.validateExperienceRange(
      dto.minExperienceYears,
      dto.maxExperienceYears,
    );

    const submission = await this.prisma.jobSubmission.create({
      data: {
        companyId: company.id,
        submittedById: userId,
        submissionType: SubmissionType.UPDATE,
        targetJobId: job.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        originalUrl: dto.originalUrl.trim(),
        jobFamily: dto.jobFamily,
        employmentType: dto.employmentType,
        kicpaCondition: dto.kicpaCondition,
        traineeStatus: dto.traineeStatus,
        practicalTrainingInstitution: dto.practicalTrainingInstitution,
        minExperienceYears: dto.minExperienceYears,
        maxExperienceYears: dto.maxExperienceYears,
        location: this.optionalTrimmed(dto.location),
        deadlineType: dto.deadlineType,
        deadline,
      },
      include: jobSubmissionInclude,
    });

    return this.toJobSubmissionItem(submission);
  }

  async closeMyJob(userId: string, jobId: string) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id,
        status: JobStatus.OPEN,
      },
      select: { id: true },
    });
    if (!job) {
      throw new NotFoundException('삭제 가능한 공고를 찾을 수 없습니다.');
    }

    const closed = await this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.CLOSED },
      include: managedJobInclude,
    });

    return this.toManagedJobItem(closed);
  }

  async listMyJobSubmissions(userId: string) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const submissions = await this.prisma.jobSubmission.findMany({
      where: { companyId: company.id, submittedById: userId },
      include: jobSubmissionInclude,
      orderBy: { createdAt: 'desc' },
    });

    return { items: submissions.map((item) => this.toJobSubmissionItem(item)) };
  }

  async updateMyJobSubmission(
    userId: string,
    submissionId: string,
    dto: CreateCompanyJobSubmissionDto,
  ) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const existing = await this.prisma.jobSubmission.findFirst({
      where: {
        id: submissionId,
        companyId: company.id,
        submittedById: userId,
        status: SubmissionStatus.PENDING,
      },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('수정 가능한 공고 요청을 찾을 수 없습니다.');
    }

    const deadline = this.normalizeDeadline(dto.deadlineType, dto.deadline);
    this.validateExperienceRange(
      dto.minExperienceYears,
      dto.maxExperienceYears,
    );

    const submission = await this.prisma.jobSubmission.update({
      where: { id: existing.id },
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        originalUrl: dto.originalUrl.trim(),
        jobFamily: dto.jobFamily,
        employmentType: dto.employmentType,
        kicpaCondition: dto.kicpaCondition,
        traineeStatus: dto.traineeStatus,
        practicalTrainingInstitution: dto.practicalTrainingInstitution,
        minExperienceYears: dto.minExperienceYears,
        maxExperienceYears: dto.maxExperienceYears,
        location: this.optionalTrimmed(dto.location),
        deadlineType: dto.deadlineType,
        deadline,
      },
      include: jobSubmissionInclude,
    });

    return this.toJobSubmissionItem(submission);
  }

  async cancelMyJobSubmission(userId: string, submissionId: string) {
    const company = await this.getOwnedCompanyOrThrow(userId);
    const existing = await this.prisma.jobSubmission.findFirst({
      where: {
        id: submissionId,
        companyId: company.id,
        submittedById: userId,
        status: SubmissionStatus.PENDING,
      },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('취소 가능한 공고 요청을 찾을 수 없습니다.');
    }

    const submission = await this.prisma.jobSubmission.delete({
      where: { id: existing.id },
      include: jobSubmissionInclude,
    });

    return this.toJobSubmissionItem(submission);
  }

  private toListItem(company: CompanyListRecord | CompanyDetailRecord) {
    return {
      id: company.id,
      name: company.name,
      type: company.type,
      websiteUrl: company.websiteUrl,
      logoUrl: this.logoUrl(company),
      backgroundUrl: this.backgroundUrl(company),
      description: company.description,
      tags: company.tags,
      employeeCount: company.employeeCount,
      averageSalary: company.averageSalary,
      foundedYear: company.foundedYear,
      recentAttritionRate: company.recentAttritionRate,
      openJobCount: company.jobs.length,
    };
  }

  private toDetailItem(company: CompanyDetailRecord | CompanyDashboardRecord) {
    return {
      ...this.toListItem(company),
      businessNumber: company.businessNumber,
      externalLinks: company.externalLinks,
      employeeTrend: this.toEmployeeTrend(company.employeeTrend),
      openJobs: company.jobs.map((job) => this.toJobListItem(job)),
    };
  }

  private buildWhere(query: ListCompaniesDto): Prisma.CompanyWhereInput {
    const where: Prisma.CompanyWhereInput = {};
    const and: Prisma.CompanyWhereInput[] = [
      ...(query.companyType ? [{ type: query.companyType }] : []),
      ...(query.tag ? [{ tags: { has: query.tag } }] : []),
      ...(query.hasOpenJobs === true
        ? [{ jobs: { some: { status: JobStatus.OPEN } } }]
        : []),
      ...(query.hasOpenJobs === false
        ? [{ jobs: { none: { status: JobStatus.OPEN } } }]
        : []),
    ];

    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ],
      });
    }

    if (
      query.minEmployeeCount !== undefined ||
      query.maxEmployeeCount !== undefined
    ) {
      and.push({
        employeeCount: {
          ...(query.minEmployeeCount !== undefined && {
            gte: query.minEmployeeCount,
          }),
          ...(query.maxEmployeeCount !== undefined && {
            lte: query.maxEmployeeCount,
          }),
        },
      });
    }

    if (
      query.minAverageSalary !== undefined ||
      query.maxAverageSalary !== undefined
    ) {
      and.push({
        averageSalary: {
          ...(query.minAverageSalary !== undefined && {
            gte: query.minAverageSalary,
          }),
          ...(query.maxAverageSalary !== undefined && {
            lte: query.maxAverageSalary,
          }),
        },
      });
    }

    if (
      query.minCompanyAgeYears !== undefined ||
      query.maxCompanyAgeYears !== undefined
    ) {
      const currentYear = new Date().getFullYear();
      and.push({
        foundedYear: {
          ...(query.minCompanyAgeYears !== undefined && {
            lte: currentYear - query.minCompanyAgeYears + 1,
          }),
          ...(query.maxCompanyAgeYears !== undefined && {
            gte: currentYear - query.maxCompanyAgeYears + 1,
          }),
        },
      });
    }

    if (query.maxAttritionRate !== undefined) {
      and.push({ recentAttritionRate: { lte: query.maxAttritionRate } });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    return where;
  }

  private buildOrderBy(sort: ListCompaniesDto['sort']) {
    if (sort === 'employeeCountDesc') {
      return [{ employeeCount: 'desc' as const }, { name: 'asc' as const }];
    }
    if (sort === 'averageSalaryDesc') {
      return [{ averageSalary: 'desc' as const }, { name: 'asc' as const }];
    }
    if (sort === 'companyAgeDesc') {
      return [{ foundedYear: 'asc' as const }, { name: 'asc' as const }];
    }
    return [{ name: 'asc' as const }];
  }

  private toJobListItem(job: JobWithRelations) {
    return {
      id: job.id,
      title: job.title,
      companyId: job.companyId,
      companyName: job.company.name,
      companyAverageSalary: job.company.averageSalary,
      companyLogoUrl: this.logoUrl(job.company),
      companyBackgroundUrl: this.backgroundUrl(job.company),
      companyType: job.companyType,
      jobFamily: job.jobFamily,
      employmentType: job.employmentType,
      kicpaCondition: job.kicpaCondition,
      traineeStatus: job.traineeStatus,
      practicalTrainingInstitution: job.practicalTrainingInstitution,
      minExperienceYears: job.minExperienceYears,
      maxExperienceYears: job.maxExperienceYears,
      location: job.location,
      deadlineType: job.deadlineType,
      deadline: job.deadline?.toISOString() ?? null,
      dDay: this.calculateDDay(job),
      sourceName: job.source.name,
      originalUrl: job.originalUrl,
      createdAt: job.createdAt.toISOString(),
      lastCheckedAt: job.lastCheckedAt.toISOString(),
      labels: job.labels.map(({ label }) => label.name),
    };
  }

  private toProfileSubmissionItem(submission: CompanyProfileSubmissionRecord) {
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

  private toManagedJobItem(job: ManagedJobRecord) {
    return {
      ...this.toJobListItem(job),
      description: job.description,
      status: job.status,
      pendingEditSubmission: job.editSubmissions[0]
        ? this.toJobSubmissionItem(job.editSubmissions[0])
        : null,
    };
  }

  private toEmployeeTrend(
    value: Prisma.JsonValue | null,
  ): EmployeeTrendPoint[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((point) => {
        if (
          !point ||
          typeof point !== 'object' ||
          Array.isArray(point) ||
          typeof point.month !== 'string' ||
          typeof point.joined !== 'number' ||
          typeof point.left !== 'number' ||
          typeof point.total !== 'number'
        ) {
          return null;
        }

        return {
          month: point.month,
          joined: point.joined,
          left: point.left,
          total: point.total,
        };
      })
      .filter((point): point is EmployeeTrendPoint => point !== null);
  }

  private calculateDDay(job: Pick<Job, 'deadline' | 'deadlineType'>) {
    if (job.deadlineType !== DeadlineType.FIXED_DATE || !job.deadline) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(job.deadline);
    deadline.setHours(0, 0, 0, 0);
    return Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
  }

  private async getOwnedCompanyOrThrow(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    if (!company) {
      throw new ForbiddenException('기업회원 회사 정보를 찾을 수 없습니다.');
    }
    return company;
  }

  private normalizeProfileProposal(
    dto: CreateCompanyProfileSubmissionDto,
  ): Prisma.JsonObject {
    const proposed: Prisma.JsonObject = {};

    const name = this.optionalTrimmed(dto.name);
    if (name !== undefined) proposed.name = name;
    if (dto.type !== undefined) proposed.type = dto.type;

    this.assignNullableString(proposed, 'websiteUrl', dto.websiteUrl);
    this.assignNullableString(proposed, 'description', dto.description);
    this.assignNullableString(proposed, 'businessNumber', dto.businessNumber);

    if (dto.externalLinks !== undefined) {
      proposed.externalLinks = this.normalizeStringArray(dto.externalLinks, 10);
    }
    if (dto.tags !== undefined) {
      proposed.tags = this.normalizeStringArray(dto.tags, 20);
    }

    return proposed;
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

  private assignNullableString(
    target: Prisma.JsonObject,
    key: string,
    value: string | undefined,
  ) {
    if (value === undefined) return;
    const trimmed = value.trim();
    target[key] = trimmed ? trimmed : null;
  }

  private optionalTrimmed(value: string | undefined) {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private logoUrl(company: { logoAsset?: { publicUrl: string } | null }) {
    return company.logoAsset?.publicUrl ?? null;
  }

  private backgroundUrl(company: {
    backgroundAsset?: { publicUrl: string } | null;
  }) {
    return company.backgroundAsset?.publicUrl ?? null;
  }

  private normalizeStringArray(values: string[], max: number) {
    return values
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index)
      .slice(0, max);
  }

  private normalizeDeadline(deadlineType: DeadlineType, value?: string) {
    if (deadlineType !== DeadlineType.FIXED_DATE) {
      return null;
    }
    if (!value) {
      throw new BadRequestException(
        '마감일 지정 공고는 deadline이 필요합니다.',
      );
    }
    const deadline = new Date(value);
    if (Number.isNaN(deadline.getTime())) {
      throw new BadRequestException('deadline 형식이 올바르지 않습니다.');
    }
    return deadline;
  }

  private validateExperienceRange(min?: number, max?: number) {
    if (min !== undefined && max !== undefined && min > max) {
      throw new BadRequestException(
        '최소 경력은 최대 경력보다 클 수 없습니다.',
      );
    }
  }
}
