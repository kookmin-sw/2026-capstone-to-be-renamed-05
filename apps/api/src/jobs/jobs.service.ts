import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeadlineType,
  Job,
  JobEngagementEventType,
  JobStatus,
  Prisma,
} from '@prisma/client';
import type {
  JobCalendarEvent,
  JobCalendarRange,
  JobListItem as SharedJobListItem,
} from '@cpa/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ListJobCalendarDto } from './dto/list-job-calendar.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { buildJobPresetWhere } from './job-presets';

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

type JobWithRelations = Job &
  Prisma.JobGetPayload<{ include: typeof jobInclude }>;

const kstDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const salaryLevelRanges = {
  TOP_1: { previousPercent: 0, endPercent: 1 },
  TOP_2_5: { previousPercent: 1, endPercent: 5 },
  TOP_6_10: { previousPercent: 5, endPercent: 10 },
  TOP_11_20: { previousPercent: 10, endPercent: 20 },
} as const;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListJobsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = await this.buildWhere(query);
    if ((query.sort ?? 'deadlineAsc') === 'deadlineAsc') {
      return this.listByDeadlineAsc(where, page, pageSize);
    }
    if (query.sort === 'expired') {
      return this.listExpired(where, page, pageSize);
    }
    const orderBy = this.buildOrderBy(query.sort);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        include: jobInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items: items.map((job) => this.toListItem(job)),
      page,
      pageSize,
      total,
    };
  }

  private async listByDeadlineAsc(
    where: Prisma.JobWhereInput,
    page: number,
    pageSize: number,
  ) {
    const today = startOfToday();
    const buckets = [
      {
        where: this.withAnd(where, {
          deadlineType: DeadlineType.FIXED_DATE,
          deadline: { gte: today },
        }),
        orderBy: [{ deadline: 'asc' as const }, { createdAt: 'desc' as const }],
      },
      {
        where: this.withAnd(where, {
          OR: [
            { deadlineType: { not: DeadlineType.FIXED_DATE } },
            { deadline: null },
          ],
        }),
        orderBy: [{ createdAt: 'desc' as const }],
      },
      {
        where: this.withAnd(where, {
          deadlineType: DeadlineType.FIXED_DATE,
          deadline: { lt: today },
        }),
        orderBy: [
          { deadline: 'desc' as const },
          { createdAt: 'desc' as const },
        ],
      },
    ];

    const counts = await this.prisma.$transaction(
      buckets.map((bucket) => this.prisma.job.count({ where: bucket.where })),
    );
    const total = counts.reduce((sum, count) => sum + count, 0);
    const items: JobWithRelations[] = [];
    let skipped = (page - 1) * pageSize;
    let remaining = pageSize;

    for (let index = 0; index < buckets.length && remaining > 0; index += 1) {
      const count = counts[index];
      if (skipped >= count) {
        skipped -= count;
        continue;
      }

      const bucketItems = await this.prisma.job.findMany({
        where: buckets[index].where,
        include: jobInclude,
        orderBy: buckets[index].orderBy,
        skip: skipped,
        take: remaining,
      });
      items.push(...bucketItems);
      remaining -= bucketItems.length;
      skipped = 0;
    }

    return {
      items: items.map((job) => this.toListItem(job)),
      page,
      pageSize,
      total,
    };
  }

  private async listExpired(
    where: Prisma.JobWhereInput,
    page: number,
    pageSize: number,
  ) {
    const expiredWhere = this.withAnd(where, {
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: { lt: startOfToday() },
    });
    const orderBy = [
      { deadline: 'desc' as const },
      { createdAt: 'desc' as const },
    ];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where: expiredWhere,
        include: jobInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.job.count({ where: expiredWhere }),
    ]);

    return {
      items: items.map((job) => this.toListItem(job)),
      page,
      pageSize,
      total,
    };
  }

  async detail(id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, status: JobStatus.OPEN },
      include: {
        ...jobInclude,
        aiSuggestions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!job) {
      throw new NotFoundException('공고를 찾을 수 없습니다.');
    }

    return {
      ...this.toListItem(job),
      description: job.description,
      practicalTrainingInstitution: job.practicalTrainingInstitution,
      minExperienceYears: job.minExperienceYears,
      maxExperienceYears: job.maxExperienceYears,
      location: job.location,
      aiSuggestion: job.aiSuggestions[0] ?? null,
    };
  }

  async recordEngagement(
    id: string,
    type: JobEngagementEventType,
    actorUserId?: string | null,
  ) {
    if (
      type !== JobEngagementEventType.DETAIL_VIEW &&
      type !== JobEngagementEventType.ORIGINAL_CLICK
    ) {
      throw new BadRequestException('기록할 수 없는 공고 행동 유형입니다.');
    }

    const job = await this.prisma.job.findFirst({
      where: { id, status: JobStatus.OPEN },
      select: { id: true, companyId: true },
    });
    if (!job) {
      throw new NotFoundException('공고를 찾을 수 없습니다.');
    }

    await this.prisma.jobEngagementEvent.create({
      data: {
        jobId: job.id,
        companyId: job.companyId,
        type,
        actorUserId: actorUserId ?? null,
      },
    });

    return { ok: true };
  }

  async calendar(query: ListJobCalendarDto) {
    const start = parseKstDateBoundary(query.from, 'start');
    const end = parseKstDateBoundary(query.to, 'end');
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('from은 to보다 이전 날짜여야 합니다.');
    }

    const where = await this.buildCalendarWhere(query, start, end);
    const items = await this.prisma.job.findMany({
      where,
      include: jobInclude,
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
    });

    const groups = new Map<string, SharedJobListItem[]>();
    const events: JobCalendarEvent[] = [];
    const ranges: JobCalendarRange[] = [];

    for (const job of items) {
      const listItem = this.toListItem(job);
      const deadlineDate =
        job.deadlineType === DeadlineType.FIXED_DATE && job.deadline
          ? formatKstDateKey(job.deadline)
          : null;

      ranges.push({
        startDate: formatKstDateKey(job.createdAt),
        endDate: deadlineDate,
        job: listItem,
      });

      if (isDateWithinRange(job.createdAt, start, end)) {
        events.push({
          date: formatKstDateKey(job.createdAt),
          type: 'START',
          job: listItem,
        });
      }

      if (
        deadlineDate &&
        job.deadlineType === DeadlineType.FIXED_DATE &&
        job.deadline &&
        isDateWithinRange(job.deadline, start, end)
      ) {
        const date = deadlineDate;
        const jobs = groups.get(date) ?? [];
        jobs.push(listItem);
        groups.set(date, jobs);
        events.push({ date, type: 'DEADLINE', job: listItem });
      }
    }

    return {
      from: query.from,
      to: query.to,
      days: [...groups.entries()]
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([date, jobs]) => ({
          date,
          total: jobs.length,
          jobs,
        })),
      events: events.sort((first, second) => {
        const dateOrder = first.date.localeCompare(second.date);
        if (dateOrder !== 0) return dateOrder;
        if (first.type !== second.type) {
          return first.type === 'START' ? -1 : 1;
        }
        return first.job.title.localeCompare(second.job.title);
      }),
      ranges: ranges.sort((first, second) => {
        const startOrder = first.startDate.localeCompare(second.startDate);
        if (startOrder !== 0) return startOrder;
        const firstEnd = first.endDate ?? first.startDate;
        const secondEnd = second.endDate ?? second.startDate;
        const endOrder = firstEnd.localeCompare(secondEnd);
        if (endOrder !== 0) return endOrder;
        return first.job.title.localeCompare(second.job.title);
      }),
    };
  }

  private toListItem(job: JobWithRelations): SharedJobListItem {
    return {
      id: job.id,
      title: job.title,
      companyId: job.companyId,
      companyName: job.company.name,
      companyAverageSalary: job.company.averageSalary,
      companyLogoUrl: job.company.logoAsset?.publicUrl ?? null,
      companyBackgroundUrl: job.company.backgroundAsset?.publicUrl ?? null,
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

  private async buildWhere(query: ListJobsDto): Promise<Prisma.JobWhereInput> {
    const where: Prisma.JobWhereInput = {
      status: JobStatus.OPEN,
      ...(query.jobFamily?.length && { jobFamily: { in: query.jobFamily } }),
      ...(query.companyType?.length && {
        companyType: { in: query.companyType },
      }),
      ...(query.traineeStatus?.length && {
        traineeStatus: { in: query.traineeStatus },
      }),
      ...(query.employmentType?.length && {
        employmentType: { in: query.employmentType },
      }),
      ...(query.kicpaCondition?.length && {
        kicpaCondition: { in: query.kicpaCondition },
      }),
      ...(query.deadlineType?.length && {
        deadlineType: { in: query.deadlineType },
      }),
      ...(query.practicalTrainingInstitution !== undefined && {
        practicalTrainingInstitution: query.practicalTrainingInstitution,
      }),
    };
    const and: Prisma.JobWhereInput[] = [];

    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { company: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    const locations = [
      ...(query.locations ?? []),
      ...(query.location ? [query.location] : []),
    ]
      .map((location) => location.trim())
      .filter((location) => location && location !== '전국')
      .filter((location, index, all) => all.indexOf(location) === index);

    if (locations.length) {
      and.push({
        OR: locations.map((location) => ({
          location: { contains: location, mode: 'insensitive' },
        })),
      });
    }

    const presetWhere = await buildJobPresetWhere(this.prisma, query.preset);
    if (presetWhere) {
      and.push(presetWhere);
    }

    if (query.deadlineWithinDays !== undefined) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setDate(today.getDate() + query.deadlineWithinDays);
      end.setHours(23, 59, 59, 999);
      and.push({
        deadlineType: DeadlineType.FIXED_DATE,
        deadline: { gte: today, lte: end },
      });
    }

    if (query.careerLevel?.length) {
      and.push({
        OR: query.careerLevel.map((level) => this.buildCareerLevelWhere(level)),
      });
    }

    if (
      query.minExperienceYears !== undefined ||
      query.maxExperienceYears !== undefined
    ) {
      const lowerBound = query.minExperienceYears ?? 0;
      const upperBound = query.maxExperienceYears ?? 50;
      and.push({ minExperienceYears: { lte: upperBound } });
      and.push({
        OR: [
          { maxExperienceYears: { gte: lowerBound } },
          { maxExperienceYears: null },
        ],
      });
    }

    const companyWhere = await this.buildCompanyWhere(query);
    if (companyWhere) {
      and.push({ company: companyWhere });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    return where;
  }

  private buildCareerLevelWhere(
    level: NonNullable<ListJobsDto['careerLevel']>[number],
  ): Prisma.JobWhereInput {
    const range =
      level === 'entry'
        ? { lower: 0, upper: 0 }
        : level === 'junior'
          ? { lower: 1, upper: 3 }
          : { lower: 4, upper: 50 };

    return {
      AND: [
        { minExperienceYears: { lte: range.upper } },
        {
          OR: [
            { maxExperienceYears: { gte: range.lower } },
            { maxExperienceYears: null },
          ],
        },
      ],
    };
  }

  private withAnd(
    where: Prisma.JobWhereInput,
    condition: Prisma.JobWhereInput,
  ): Prisma.JobWhereInput {
    const existingAnd = Array.isArray(where.AND)
      ? where.AND
      : where.AND
        ? [where.AND]
        : [];
    return {
      ...where,
      AND: [...existingAnd, condition],
    };
  }

  private async buildCompanyWhere(
    query: ListJobsDto,
  ): Promise<Prisma.CompanyWhereInput | null> {
    const currentYear = new Date().getFullYear();
    const conditions: Prisma.CompanyWhereInput[] = [];

    if (
      query.minCompanyAgeYears !== undefined ||
      query.maxCompanyAgeYears !== undefined
    ) {
      conditions.push({
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
      conditions.push({
        recentAttritionRate: { lte: query.maxAttritionRate },
      });
    }

    const salaryWhere = await this.buildSalaryCompanyWhere(query.salaryLevel);
    if (salaryWhere) {
      conditions.push(salaryWhere);
    }

    if (conditions.length === 0) return null;
    if (conditions.length === 1) return conditions[0];
    return { AND: conditions };
  }

  private async buildSalaryCompanyWhere(
    salaryLevel: ListJobsDto['salaryLevel'],
  ): Promise<Prisma.CompanyWhereInput | null> {
    if (!salaryLevel?.length) return null;

    const conditions = await Promise.all(
      salaryLevel.map((level) => this.buildSingleSalaryCompanyWhere(level)),
    );
    if (conditions.length === 1) return conditions[0];
    return { OR: conditions };
  }

  private async buildSingleSalaryCompanyWhere(
    salaryLevel: NonNullable<ListJobsDto['salaryLevel']>[number],
  ): Promise<Prisma.CompanyWhereInput> {
    const salaryKnownWhere = { averageSalary: { not: null } };

    if (salaryLevel === 'ABOVE_AVERAGE') {
      const aggregate = await this.prisma.company.aggregate({
        where: salaryKnownWhere,
        _avg: { averageSalary: true },
      });
      const averageSalary = aggregate._avg.averageSalary;
      if (averageSalary === null) return { id: { in: [] } };
      return {
        averageSalary: {
          gte: Math.ceil(averageSalary),
        },
      };
    }

    const range = salaryLevelRanges[salaryLevel];
    const total = await this.prisma.company.count({
      where: salaryKnownWhere,
    });
    if (total === 0) return { id: { in: [] } };

    const skip = Math.ceil((total * range.previousPercent) / 100);
    const end = Math.ceil((total * range.endPercent) / 100);
    const take = Math.max(0, end - skip);
    if (take === 0) return { id: { in: [] } };

    const companies = await this.prisma.company.findMany({
      where: salaryKnownWhere,
      select: { id: true },
      orderBy: [{ averageSalary: 'desc' }, { id: 'asc' }],
      skip,
      take,
    });

    return { id: { in: companies.map((company) => company.id) } };
  }

  private async buildCalendarWhere(
    query: ListJobCalendarDto,
    start: Date,
    end: Date,
  ): Promise<Prisma.JobWhereInput> {
    const where = await this.buildWhere(query);
    const and = Array.isArray(where.AND)
      ? where.AND
      : where.AND
        ? [where.AND]
        : [];

    return {
      ...where,
      AND: [
        ...and,
        {
          OR: [
            {
              deadlineType: DeadlineType.FIXED_DATE,
              createdAt: { lte: end },
              deadline: { gte: start },
            },
            { createdAt: { gte: start, lte: end } },
          ],
        },
      ],
    };
  }

  private buildOrderBy(sort: ListJobsDto['sort']) {
    if (sort === 'latest') {
      return [{ createdAt: 'desc' as const }];
    }
    if (sort === 'experienceAsc') {
      return [
        { minExperienceYears: 'asc' as const },
        { deadline: 'asc' as const },
        { createdAt: 'desc' as const },
      ];
    }
    if (sort === 'companyType') {
      return [
        { companyType: 'asc' as const },
        { deadline: 'asc' as const },
        { createdAt: 'desc' as const },
      ];
    }
    return [{ deadline: 'asc' as const }, { createdAt: 'desc' as const }];
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
}

function parseKstDateBoundary(value: string, boundary: 'start' | 'end') {
  const suffix =
    boundary === 'start' ? 'T00:00:00.000+09:00' : 'T23:59:59.999+09:00';
  const date = new Date(`${value}${suffix}`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('날짜 형식은 YYYY-MM-DD여야 합니다.');
  }
  return date;
}

function formatKstDateKey(date: Date) {
  const parts = kstDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function isDateWithinRange(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
