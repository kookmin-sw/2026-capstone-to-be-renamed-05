import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JobFilterPreference, UserJobPresetItem } from '@cpa/shared';
import { PrismaService } from '../prisma/prisma.service';

const stringFilterKeys = [
  'search',
  'jobFamily',
  'companyType',
  'traineeStatus',
  'employmentType',
  'kicpaCondition',
  'deadlineType',
  'practicalTrainingInstitution',
  'deadlineWithinDays',
  'careerLevel',
  'minExperienceYears',
  'maxExperienceYears',
  'minCompanyAgeYears',
  'maxCompanyAgeYears',
  'maxAttritionRate',
  'sort',
] as const;

type StringFilterKey = (typeof stringFilterKeys)[number];

type UserJobPresetRecord = {
  id: string;
  filterState: Prisma.JsonValue;
  autoLabel: string;
  filterSignature: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
};

const jobFamilyLabels: Record<string, string> = {
  AUDIT: '감사',
  TAX: '세무',
  FAS: 'FAS',
  DEAL: 'Deal',
  INTERNAL_ACCOUNTING: '내부회계',
  IN_HOUSE: '인하우스',
};

const companyTypeLabels: Record<string, string> = {
  BIG4: 'Big4',
  LOCAL_ACCOUNTING_FIRM: '로컬 회계법인',
  MID_SMALL_ACCOUNTING_FIRM: '중소 회계법인',
  FINANCIAL_COMPANY: '금융사',
  GENERAL_COMPANY: '일반 기업',
  PUBLIC_INSTITUTION: '공공기관',
};

const traineeStatusLabels: Record<string, string> = {
  AVAILABLE: '수습 가능',
  UNAVAILABLE: '수습 불가',
  UNCLEAR: '수습 불명확',
};

const employmentTypeLabels: Record<string, string> = {
  FULL_TIME: '정규직',
  CONTRACT: '계약직',
  INTERN: '인턴',
  PART_TIME: '파트타임',
};

const kicpaConditionLabels: Record<string, string> = {
  REQUIRED: 'KICPA 필수',
  PREFERRED: 'KICPA 우대',
  NONE: 'KICPA 무관',
  UNCLEAR: 'KICPA 불명확',
};

const deadlineTypeLabels: Record<string, string> = {
  FIXED_DATE: '특정일 마감',
  UNTIL_FILLED: '채용시 마감',
  ALWAYS_OPEN: '상시채용',
};

const careerLevelLabels: Record<string, string> = {
  entry: '신입',
  junior: '주니어',
  experienced: '경력',
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getJobFilterPreference(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { jobFilterPreference: true },
    });

    return {
      filter: this.normalizeJobFilterPreference(user?.jobFilterPreference),
      authenticated: true,
    };
  }

  async updateJobFilterPreference(
    userId: string,
    filter: Record<string, unknown>,
  ) {
    const normalized = this.normalizeJobFilterPreference(filter) ?? {};
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        jobFilterPreference: normalized,
      },
    });

    return { filter: normalized, authenticated: true };
  }

  async listJobPresets(userId: string) {
    const presets = await this.prisma.userJobPreset.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: presets.map((preset) => this.toUserJobPresetItem(preset)),
      authenticated: true,
    };
  }

  async createJobPreset(
    userId: string,
    filter: Record<string, unknown>,
    name?: string,
  ) {
    const normalized = this.normalizeJobPresetFilter(filter);
    if (!this.hasMeaningfulPresetFilter(normalized)) {
      throw new BadRequestException('저장할 필터 조합이 없습니다.');
    }

    const filterSignature = this.createFilterSignature(normalized);
    const existing = await this.prisma.userJobPreset.findFirst({
      where: { userId, filterSignature },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('이미 저장된 필터 조합입니다.');
    }

    const preset = await this.prisma.userJobPreset.create({
      data: {
        userId,
        filterState: normalized,
        autoLabel:
          this.normalizePresetName(name) ?? this.createAutoLabel(normalized),
        filterSignature,
      },
    });

    return this.toUserJobPresetItem(preset);
  }

  async markJobPresetUsed(userId: string, id: string) {
    const preset = await this.findOwnJobPreset(userId, id);
    const updated = await this.prisma.userJobPreset.update({
      where: { id: preset.id },
      data: { lastUsedAt: new Date() },
    });

    return this.toUserJobPresetItem(updated);
  }

  async deleteJobPreset(userId: string, id: string) {
    const preset = await this.findOwnJobPreset(userId, id);
    const deleted = await this.prisma.userJobPreset.delete({
      where: { id: preset.id },
    });

    return this.toUserJobPresetItem(deleted);
  }

  private async findOwnJobPreset(userId: string, id: string) {
    const preset = await this.prisma.userJobPreset.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!preset) {
      throw new NotFoundException('개인 프리셋을 찾을 수 없습니다.');
    }
    return preset;
  }

  private normalizeJobFilterPreference(
    value: unknown,
  ): JobFilterPreference | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const input = value as Record<string, unknown>;
    const filter: JobFilterPreference = {};
    for (const key of stringFilterKeys) {
      const raw = input[key];
      if (typeof raw === 'string') {
        this.setStringFilterValue(filter, key, raw);
      }
    }

    if (Array.isArray(input.selectedLocations)) {
      filter.selectedLocations = input.selectedLocations
        .filter((location): location is string => typeof location === 'string')
        .map((location) => location.trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 30);
    }

    return filter;
  }

  private normalizeJobPresetFilter(value: unknown): JobFilterPreference {
    const normalized = this.normalizeJobFilterPreference(value) ?? {};
    if (normalized.sort === 'deadlineAsc') {
      delete normalized.sort;
    }

    return this.orderJobFilterPreference(normalized);
  }

  private setStringFilterValue(
    filter: JobFilterPreference,
    key: StringFilterKey,
    raw: string,
  ) {
    const value = raw.trim().slice(0, 120);
    if (!value) return;
    (filter as Record<StringFilterKey, string>)[key] = value;
  }

  private orderJobFilterPreference(filter: JobFilterPreference) {
    const ordered: JobFilterPreference = {};
    for (const key of stringFilterKeys) {
      const value = filter[key];
      if (typeof value === 'string' && value) {
        (ordered as Record<StringFilterKey, string>)[key] = value;
      }
    }
    if (filter.selectedLocations?.length) {
      ordered.selectedLocations = [...new Set(filter.selectedLocations)];
    }
    return ordered;
  }

  private hasMeaningfulPresetFilter(filter: JobFilterPreference) {
    if (filter.selectedLocations?.length) return true;
    return stringFilterKeys.some(
      (key) => key !== 'sort' && Boolean(filter[key]),
    );
  }

  private createFilterSignature(filter: JobFilterPreference) {
    return JSON.stringify(this.orderJobFilterPreference(filter));
  }

  private normalizePresetName(value: string | undefined) {
    if (!value) return null;
    const name = value.trim().replace(/\s+/g, ' ').slice(0, 30);
    return name || null;
  }

  private createAutoLabel(filter: JobFilterPreference) {
    const parts: string[] = [];
    const location = this.createLocationLabel(filter.selectedLocations);
    if (location) parts.push(location);
    this.pushMappedLabel(parts, filter.jobFamily, jobFamilyLabels);
    this.pushMappedLabel(parts, filter.companyType, companyTypeLabels);
    this.pushCareerLabel(parts, filter.careerLevel);
    if (filter.practicalTrainingInstitution === 'true') parts.push('실무수습');
    this.pushMappedLabel(parts, filter.traineeStatus, traineeStatusLabels);
    this.pushMappedLabel(parts, filter.kicpaCondition, kicpaConditionLabels);
    this.pushMappedLabel(parts, filter.employmentType, employmentTypeLabels);
    this.pushDeadlineLabel(parts, filter);
    if (filter.search) parts.push(filter.search);

    if (!parts.length) return '내 필터 조합';
    const visible = parts.slice(0, 3);
    const hiddenCount = parts.length - visible.length;
    return hiddenCount > 0
      ? `${visible.join('·')} 외 ${hiddenCount}`
      : visible.join('·');
  }

  private createLocationLabel(locations: string[] | undefined) {
    if (!locations?.length) return '';
    const [first, ...rest] = locations;
    const trimmed = first.trim();
    if (!trimmed) return '';
    return rest.length ? `${trimmed} 외 ${rest.length}지역` : trimmed;
  }

  private pushMappedLabel(
    parts: string[],
    value: string | undefined,
    labels: Record<string, string>,
  ) {
    if (!value) return;
    parts.push(labels[value] ?? value);
  }

  private pushCareerLabel(parts: string[], value: string | undefined) {
    if (!value) return;
    const labels = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => careerLevelLabels[item] ?? item);
    if (labels.length) parts.push(labels.join('/'));
  }

  private pushDeadlineLabel(
    parts: string[],
    filter: Pick<JobFilterPreference, 'deadlineType' | 'deadlineWithinDays'>,
  ) {
    if (filter.deadlineWithinDays) {
      parts.push(`${filter.deadlineWithinDays}일 이내 마감`);
      return;
    }
    this.pushMappedLabel(parts, filter.deadlineType, deadlineTypeLabels);
  }

  private toUserJobPresetItem(preset: UserJobPresetRecord): UserJobPresetItem {
    return {
      id: preset.id,
      filterState: this.normalizeJobFilterPreference(preset.filterState) ?? {},
      autoLabel: preset.autoLabel,
      filterSignature: preset.filterSignature,
      createdAt: preset.createdAt.toISOString(),
      updatedAt: preset.updatedAt.toISOString(),
      lastUsedAt: preset.lastUsedAt?.toISOString() ?? null,
    };
  }
}
