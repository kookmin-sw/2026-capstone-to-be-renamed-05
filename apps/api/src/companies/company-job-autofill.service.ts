import type {
  CompanyJobAutofillDraft,
  CompanyJobAutofillResponse,
} from '@cpa/shared';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

type AutofillInput = {
  companyName?: string | null;
  sourceText: string;
  originalUrl?: string;
};

type RawObject = Record<string, unknown>;

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const MAX_WARNINGS = 5;
const JOB_FAMILY_VALUES = [
  'AUDIT',
  'TAX',
  'FAS',
  'DEAL',
  'INTERNAL_ACCOUNTING',
  'IN_HOUSE',
] as const satisfies readonly CompanyJobAutofillDraft['jobFamily'][];
const EMPLOYMENT_TYPE_VALUES = [
  'FULL_TIME',
  'CONTRACT',
  'INTERN',
  'PART_TIME',
] as const satisfies readonly CompanyJobAutofillDraft['employmentType'][];
const KICPA_CONDITION_VALUES = [
  'REQUIRED',
  'PREFERRED',
  'NONE',
  'UNCLEAR',
] as const satisfies readonly CompanyJobAutofillDraft['kicpaCondition'][];
const TRAINEE_STATUS_VALUES = [
  'AVAILABLE',
  'UNAVAILABLE',
  'UNCLEAR',
] as const satisfies readonly CompanyJobAutofillDraft['traineeStatus'][];
const DEADLINE_TYPE_VALUES = [
  'FIXED_DATE',
  'UNTIL_FILLED',
  'ALWAYS_OPEN',
] as const satisfies readonly CompanyJobAutofillDraft['deadlineType'][];

@Injectable()
export class CompanyJobAutofillService {
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  async generateDraft(
    input: AutofillInput,
  ): Promise<CompanyJobAutofillResponse> {
    const openai = this.getClient();
    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() || DEFAULT_OPENAI_MODEL;

    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              '너는 CPA 채용공고 등록 폼을 채우는 한국어 정보 추출 도우미다. 원문에 근거가 없으면 추정하지 말고 UNCLEAR 또는 null을 사용한다.',
          },
          {
            role: 'user',
            content: this.buildPrompt(input),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('empty OpenAI response');
      }

      const parsed = this.parseJson(content);
      const parsedObject = this.asObject(parsed) ?? {};
      const draftSource = parsedObject.draft ?? parsedObject;
      const draft = this.normalizeDraft(draftSource, input);
      const warnings = this.normalizeWarnings(parsedObject.warnings);

      if (draft.deadlineType === 'FIXED_DATE' && !draft.deadline) {
        warnings.push('마감일을 확인해 주세요.');
      }

      return {
        draft,
        warnings: [...new Set(warnings)].slice(0, MAX_WARNINGS),
      };
    } catch {
      throw new ServiceUnavailableException(
        'AI 자동입력 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }

  private getClient() {
    const apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OpenAI API 키가 설정되어 있지 않습니다.',
      );
    }

    if (!this.client) {
      this.client = new OpenAI({
        apiKey,
        maxRetries: 1,
        timeout: 20_000,
      });
    }

    return this.client;
  }

  private buildPrompt(input: AutofillInput) {
    const originalUrl = this.stringValue(input.originalUrl) ?? null;
    const companyName = this.stringValue(input.companyName) ?? '미확인';
    const sourceText = input.sourceText.trim().slice(0, 12_000);

    return [
      '아래 채용공고 원문을 읽고 기업회원 공고 등록 폼 초안을 JSON으로 작성해 주세요.',
      '',
      '반드시 아래 형태의 JSON 객체만 반환하세요.',
      '{',
      '  "draft": {',
      '    "title": "string",',
      '    "description": "string",',
      '    "originalUrl": "string|null",',
      '    "jobFamily": "AUDIT|TAX|FAS|DEAL|INTERNAL_ACCOUNTING|IN_HOUSE",',
      '    "employmentType": "FULL_TIME|CONTRACT|INTERN|PART_TIME",',
      '    "kicpaCondition": "REQUIRED|PREFERRED|NONE|UNCLEAR",',
      '    "traineeStatus": "AVAILABLE|UNAVAILABLE|UNCLEAR",',
      '    "practicalTrainingInstitution": "boolean|null",',
      '    "minExperienceYears": "number|null",',
      '    "maxExperienceYears": "number|null",',
      '    "location": "string|null",',
      '    "deadlineType": "FIXED_DATE|UNTIL_FILLED|ALWAYS_OPEN",',
      '    "deadline": "YYYY-MM-DD|null"',
      '  },',
      '  "warnings": ["string"]',
      '}',
      '',
      `허용 jobFamily: ${JOB_FAMILY_VALUES.join(', ')}`,
      `허용 employmentType: ${EMPLOYMENT_TYPE_VALUES.join(', ')}`,
      `허용 kicpaCondition: ${KICPA_CONDITION_VALUES.join(', ')}`,
      `허용 traineeStatus: ${TRAINEE_STATUS_VALUES.join(', ')}`,
      `허용 deadlineType: ${DEADLINE_TYPE_VALUES.join(', ')}`,
      '',
      '규칙:',
      '- description은 원문에 있는 업무, 자격, 근무조건, 전형 정보를 바탕으로 5000자 이내 한국어 설명으로 정리합니다.',
      '- originalUrl은 제공된 원문 링크 또는 원문에 명시된 http/https URL만 사용합니다.',
      '- 마감일이 특정 날짜면 deadlineType은 FIXED_DATE, deadline은 YYYY-MM-DD로 둡니다.',
      '- 채용시 마감은 UNTIL_FILLED, 상시 채용은 ALWAYS_OPEN으로 둡니다.',
      '- 경력 연수는 숫자만 사용하고, 신입 또는 무관이면 minExperienceYears를 0으로 둡니다.',
      '- 확실하지 않은 CPA/KICPA/수습 관련 값은 UNCLEAR 또는 null로 둡니다.',
      '',
      `회사명: ${companyName}`,
      `제공된 원문 링크: ${originalUrl ?? '없음'}`,
      '',
      '원문:',
      sourceText,
    ].join('\n');
  }

  private normalizeDraft(
    rawInput: unknown,
    input: AutofillInput,
  ): CompanyJobAutofillDraft {
    const raw = this.asObject(rawInput) ?? {};
    const sourceText = input.sourceText.trim();
    const minExperienceYears = this.numberValue(raw.minExperienceYears);
    const maxExperienceYears = this.numberValue(raw.maxExperienceYears);
    const normalizedRange =
      minExperienceYears !== null &&
      maxExperienceYears !== null &&
      minExperienceYears > maxExperienceYears
        ? {
            minExperienceYears: maxExperienceYears,
            maxExperienceYears: minExperienceYears,
          }
        : { minExperienceYears, maxExperienceYears };
    const deadlineType = this.enumValue(
      raw.deadlineType,
      DEADLINE_TYPE_VALUES,
      'FIXED_DATE',
    );

    return {
      title: this.limit(
        this.stringValue(raw.title) ?? this.fallbackTitle(sourceText),
        160,
      ),
      description: this.limit(
        this.stringValue(raw.description) ?? sourceText,
        5000,
      ),
      originalUrl:
        this.urlValue(raw.originalUrl) ??
        this.urlValue(input.originalUrl) ??
        null,
      jobFamily: this.enumValue(raw.jobFamily, JOB_FAMILY_VALUES, 'AUDIT'),
      employmentType: this.enumValue(
        raw.employmentType,
        EMPLOYMENT_TYPE_VALUES,
        'FULL_TIME',
      ),
      kicpaCondition: this.enumValue(
        raw.kicpaCondition,
        KICPA_CONDITION_VALUES,
        'UNCLEAR',
      ),
      traineeStatus: this.enumValue(
        raw.traineeStatus,
        TRAINEE_STATUS_VALUES,
        'UNCLEAR',
      ),
      practicalTrainingInstitution: this.booleanValue(
        raw.practicalTrainingInstitution,
      ),
      minExperienceYears: normalizedRange.minExperienceYears,
      maxExperienceYears: normalizedRange.maxExperienceYears,
      location: this.limitNullable(this.stringValue(raw.location), 120),
      deadlineType,
      deadline:
        deadlineType === 'FIXED_DATE' ? this.dateValue(raw.deadline) : null,
    };
  }

  private parseJson(content: string) {
    const trimmed = content
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');
    return JSON.parse(trimmed) as unknown;
  }

  private asObject(value: unknown): RawObject | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as RawObject;
  }

  private stringValue(value: unknown) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private enumValue<T extends readonly string[]>(
    value: unknown,
    allowed: T,
    fallback: T[number],
  ): T[number] {
    if (
      typeof value === 'string' &&
      (allowed as readonly string[]).includes(value)
    ) {
      return value;
    }
    return fallback;
  }

  private booleanValue(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '가능', '해당', '제공'].includes(normalized)) {
      return true;
    }
    if (['false', 'no', 'n', '불가', '미해당', '없음'].includes(normalized)) {
      return false;
    }
    return null;
  }

  private numberValue(value: unknown) {
    const number =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value.replace(/[^\d.-]/g, ''))
          : Number.NaN;
    if (!Number.isInteger(number) || number < 0 || number > 50) {
      return null;
    }
    return number;
  }

  private dateValue(value: unknown) {
    const raw = this.stringValue(value);
    const match = raw?.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) return null;
    const date = new Date(`${match[0]}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    return match[0];
  }

  private urlValue(value: unknown) {
    const raw = this.stringValue(value);
    if (!raw) return null;

    try {
      const url = new URL(raw);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  }

  private normalizeWarnings(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private fallbackTitle(sourceText: string) {
    return (
      sourceText
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean) ?? '채용공고'
    );
  }

  private limit(value: string, maxLength: number) {
    return value.length <= maxLength ? value : value.slice(0, maxLength);
  }

  private limitNullable(value: string | null, maxLength: number) {
    return value ? this.limit(value, maxLength) : null;
  }
}
