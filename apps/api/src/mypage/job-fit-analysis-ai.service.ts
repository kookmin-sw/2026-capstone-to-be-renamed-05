import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  resolveOpenAIModel,
  resolveOpenAIReasoningEffort,
  usesOpenAIReasoning,
} from '../config/openai-runtime';

type JobFitAnalysisAiJob = {
  title: string;
  description: string;
  jobFamily: string;
  employmentType: string;
  companyType: string;
  kicpaCondition: string;
  traineeStatus: string;
  practicalTrainingInstitution: boolean | null;
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  location: string | null;
  deadlineType: string;
  deadline: string | null;
  labels: string[];
  company: {
    name: string;
    type: string;
    tags: string[];
    description: string | null;
  };
};

type JobFitAnalysisAiResume = {
  fileName: string;
  contentType: string;
  byteSize: number;
  fileBase64: string;
};

export type GenerateJobFitAnalysisInput = {
  job: JobFitAnalysisAiJob;
  resume: JobFitAnalysisAiResume;
};

export type GeneratedJobFitAnalysis = {
  fitScore: number;
  summary: string;
  strengths: string[];
  companyPriorities: string[];
  gaps: string[];
  recommendation: string;
  rawJson: Record<string, unknown>;
};

type RawObject = Record<string, unknown>;

const MAX_ITEMS = 4;
const FILE_INPUT_BAD_REQUEST_STATUSES = new Set([400, 415, 422]);

@Injectable()
export class JobFitAnalysisAiService {
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  async generate(
    input: GenerateJobFitAnalysisInput,
  ): Promise<GeneratedJobFitAnalysis> {
    const openai = this.getClient();
    const model = resolveOpenAIModel(
      this.config.get<string>('OPENAI_JOB_FIT_MODEL'),
      this.config.get<string>('OPENAI_MODEL'),
    );
    const reasoningEffort = resolveOpenAIReasoningEffort(
      this.config.get<string>('OPENAI_JOB_FIT_REASONING_EFFORT'),
      this.config.get<string>('OPENAI_REASONING_EFFORT'),
    );
    const useReasoning = usesOpenAIReasoning(model);

    try {
      const response = await openai.responses.create({
        model,
        store: false,
        ...(useReasoning
          ? { reasoning: { effort: reasoningEffort } }
          : { temperature: 0.2 }),
        text: {
          format: {
            type: 'json_schema',
            name: 'job_fit_analysis',
            strict: true,
            schema: this.responseSchema(),
          },
        },
        instructions:
          'You are a Korean career analyst for CPA/accounting job seekers. Compare the job posting with the attached resume file. Do not expose unnecessary personal data. If the file is hard to read, mention that limitation in gaps. Return only JSON.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: this.buildPrompt(input),
              },
              {
                type: 'input_file',
                filename: input.resume.fileName,
                file_data: this.buildFileData(input.resume),
                detail: 'low',
              },
            ],
          },
        ],
      });

      const content = response.output_text;
      if (!content) throw new Error('empty OpenAI response');

      const parsed = this.asObject(JSON.parse(content)) ?? {};
      const normalized = this.normalize(parsed);

      return {
        ...normalized,
        rawJson: {
          provider: 'openai',
          api: 'responses',
          model,
          reasoningEffort: useReasoning ? reasoningEffort : null,
          responseId: response.id,
          usage: response.usage ?? null,
          parsed,
        },
      };
    } catch (error) {
      if (this.isFileInputBadRequest(error)) {
        throw new BadRequestException(
          '이력서 파일을 OpenAI가 읽지 못했습니다. PDF, DOCX, TXT 형식인지 확인해 주세요. DOC, HWP, HWPX는 PDF 또는 DOCX로 변환해 다시 업로드해 주세요.',
        );
      }
      throw new ServiceUnavailableException(
        'AI 적합도 분석 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
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
        timeout: 25_000,
      });
    }

    return this.client;
  }

  private buildPrompt(input: GenerateJobFitAnalysisInput) {
    const job = input.job;
    const resume = input.resume;

    return [
      '첨부 이력서 파일과 아래 채용공고를 비교해 구직자에게 보여줄 적합도 분석 JSON을 작성하세요.',
      '',
      '분석 규칙:',
      '- fitScore는 실제 합격 확률이 아니라 공고 요건과 이력서 근거의 상대 적합도 점수입니다.',
      '- summary와 recommendation은 한국어 한두 문장으로 작성합니다.',
      '- strengths, companyPriorities, gaps는 각각 짧은 한국어 문장 배열로 작성합니다.',
      '- 이력서 파일을 읽기 어렵거나 구조가 불명확하면 gaps에 파일 품질 또는 변환 필요성을 포함합니다.',
      '- KICPA, 수습 가능 여부, 경력 연수, 직무군, 회사 유형을 우선 비교합니다.',
      '',
      '공고:',
      JSON.stringify(
        {
          title: job.title,
          description: this.limit(job.description, 5000),
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
          deadline: job.deadline,
          labels: job.labels,
          company: {
            name: job.company.name,
            type: job.company.type,
            tags: job.company.tags,
            description: job.company.description,
          },
        },
        null,
        2,
      ),
      '',
      '첨부 이력서 메타데이터:',
      JSON.stringify(
        {
          fileName: resume.fileName,
          contentType: resume.contentType,
          byteSize: resume.byteSize,
        },
        null,
        2,
      ),
    ].join('\n');
  }

  private responseSchema() {
    return {
      type: 'object',
      additionalProperties: false,
      required: [
        'fitScore',
        'summary',
        'strengths',
        'companyPriorities',
        'gaps',
        'recommendation',
      ],
      properties: {
        fitScore: {
          type: 'integer',
          description:
            '공고와 이력서 파일의 직무 적합도 점수. 실제 합격 확률이 아닙니다.',
        },
        summary: { type: 'string' },
        strengths: {
          type: 'array',
          items: { type: 'string' },
        },
        companyPriorities: {
          type: 'array',
          items: { type: 'string' },
        },
        gaps: {
          type: 'array',
          items: { type: 'string' },
        },
        recommendation: { type: 'string' },
      },
    };
  }

  private buildFileData(resume: JobFitAnalysisAiResume) {
    const contentType = resume.contentType.includes('/')
      ? resume.contentType
      : 'application/octet-stream';
    return `data:${contentType};base64,${resume.fileBase64}`;
  }

  private normalize(raw: RawObject): Omit<GeneratedJobFitAnalysis, 'rawJson'> {
    return {
      fitScore: this.clampInteger(raw.fitScore, 0, 100, 60),
      summary: this.stringValue(raw.summary, 700),
      strengths: this.stringArray(raw.strengths),
      companyPriorities: this.stringArray(raw.companyPriorities),
      gaps: this.stringArray(raw.gaps),
      recommendation: this.stringValue(raw.recommendation, 700),
    };
  }

  private asObject(value: unknown): RawObject | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as RawObject)
      : null;
  }

  private clampInteger(
    value: unknown,
    min: number,
    max: number,
    fallback: number,
  ) {
    const parsed =
      typeof value === 'number' ? value : Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.round(parsed)));
  }

  private stringArray(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => this.stringValue(item, 240))
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
  }

  private stringValue(value: unknown, maxLength: number) {
    return typeof value === 'string'
      ? this.limit(value.replace(/\s+/g, ' ').trim(), maxLength)
      : '';
  }

  private limit(value: string, maxLength: number) {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }

  private isFileInputBadRequest(error: unknown) {
    const status =
      typeof (error as { status?: unknown })?.status === 'number'
        ? (error as { status: number }).status
        : null;
    return status !== null && FILE_INPUT_BAD_REQUEST_STATUSES.has(status);
  }
}
