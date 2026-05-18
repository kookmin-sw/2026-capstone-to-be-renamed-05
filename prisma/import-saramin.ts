import { PrismaPg } from "@prisma/adapter-pg";
import {
  Company,
  CompanyType,
  DeadlineType,
  EmploymentType,
  JobFamily,
  KicpaCondition,
  Label,
  Prisma,
  PrismaClient,
  Source,
  TraineeStatus,
  UserRole,
} from "@prisma/client";
import argon2 from "argon2";
import * as cheerio from "cheerio";
import { config as loadDotenv } from "dotenv";
import { createHash, randomBytes } from "node:crypto";
import {
  resolveEnvFilePaths,
  resolvePrismaPostgresConfig,
} from "../apps/api/src/config/runtime-environment";
import {
  ensureGeneratedCompanyBackgroundAsset,
  ensureGeneratedCompanyLogoAsset,
} from "./company-logo-assets";

for (const envFilePath of resolveEnvFilePaths()) {
  loadDotenv({ path: envFilePath, override: false });
}

const DEFAULT_SARAMIN_URL =
  "https://www.saramin.co.kr/zf_user/jobs/list/job-category?cat_kewd=329%2C334%2C330&panel_type=&search_optional_item=n&search_done=y&panel_count=y&preview=y";
const SARAMIN_BASE_URL = "https://www.saramin.co.kr";
const DEFAULT_LIMIT = 500;
const DEFAULT_DELAY_MS = 500;
const DEFAULT_PAGE_SIZE = 50;
const HTTP_TIMEOUT_MS = 15_000;
const HTTP_MAX_RETRIES = 2;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

type CheerioRoot = ReturnType<typeof cheerio.load>;

type CliOptions = {
  url: string;
  limit: number;
  pages?: number;
  delayMs: number;
  dryRun: boolean;
};

type SaraminListJob = {
  recIdx: string;
  companyName: string;
  title: string;
  originalUrl: string;
  listUrl: string;
  jobSectors: string[];
  badges: string[];
  location?: string;
  careerText?: string;
  educationText?: string;
  deadlineText?: string;
  registeredText?: string;
  companySignals: string[];
};

type SaraminDetail = {
  canonicalUrl?: string;
  metaDescription?: string;
  metaKeywords?: string;
  homepageUrl?: string;
  description?: string;
  deadline?: Date | null;
};

type ParsedDeadline = {
  deadlineType: DeadlineType;
  deadline: Date | null;
};

type NormalizedJob = {
  listJob: SaraminListJob;
  detail: SaraminDetail;
  title: string;
  description: string;
  originalUrl: string;
  companyName: string;
  companyType: CompanyType;
  jobFamily: JobFamily;
  employmentType: EmploymentType;
  kicpaCondition: KicpaCondition;
  traineeStatus: TraineeStatus;
  practicalTrainingInstitution: boolean;
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  location: string | null;
  aiSummary: string;
  deadlineType: DeadlineType;
  deadline: Date | null;
  labelNames: string[];
  companyTags: string[];
};

type ImportStats = {
  parsed: number;
  imported: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
};

class HttpRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "HttpRequestError";
  }
}

function createPrismaClient() {
  const { connectionString, schema } = resolvePrismaPostgresConfig();

  return new PrismaClient({
    adapter: new PrismaPg(
      { connectionString },
      schema ? { schema } : undefined,
    ),
  });
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    url: DEFAULT_SARAMIN_URL,
    limit: DEFAULT_LIMIT,
    delayMs: DEFAULT_DELAY_MS,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const [name, inlineValue] = arg.includes("=")
      ? arg.split(/=(.*)/s, 2)
      : [arg, undefined];

    const readValue = () => {
      if (inlineValue !== undefined) {
        return inlineValue;
      }

      index += 1;
      const value = argv[index];
      if (!value) {
        throw new Error(`Missing value for ${name}`);
      }
      return value;
    };

    switch (name) {
      case "--url":
        options.url = readValue();
        break;
      case "--limit":
        options.limit = parsePositiveInteger(readValue(), "--limit");
        break;
      case "--pages":
        options.pages = parsePositiveInteger(readValue(), "--pages");
        break;
      case "--delay-ms":
        options.delayMs = parseNonNegativeInteger(readValue(), "--delay-ms");
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        printUsageAndExit();
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function parsePositiveInteger(value: string, optionName: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }

  return parsed;
}

function parseNonNegativeInteger(value: string, optionName: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${optionName} must be a non-negative integer.`);
  }

  return parsed;
}

function printUsageAndExit(): never {
  console.log(`Usage: npm run prisma:import:saramin -- [options]

Options:
  --url <url>          Saramin list URL to import
  --limit <number>    Maximum jobs to import (default: ${DEFAULT_LIMIT})
  --pages <number>    Maximum list pages to scan
  --delay-ms <number> Delay between Saramin requests (default: ${DEFAULT_DELAY_MS})
  --dry-run           Fetch and parse without writing to the database
`);
  process.exit(0);
}

async function fetchText(url: string, attempt = 0): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  }).catch((error: unknown) => {
    throw new HttpRequestError(
      `Failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  });

  if (response.ok) {
    return response.text();
  }

  const body = await response.text().catch(() => "");
  if (attempt < HTTP_MAX_RETRIES && shouldRetry(response.status)) {
    await sleep(getRetryDelayMs(response, attempt));
    return fetchText(url, attempt + 1);
  }

  throw new HttpRequestError(
    `Saramin request failed: ${response.status} ${response.statusText}`,
    response.status,
    body.slice(0, 500),
  );
}

function shouldRetry(status: number) {
  return status === 429 || status >= 500;
}

function getRetryDelayMs(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  return Math.min(5000, 750 * 2 ** attempt);
}

function buildListPageUrl(baseUrl: string, page: number) {
  const url = new URL(baseUrl);
  url.hash = "";
  url.searchParams.set("page_count", String(DEFAULT_PAGE_SIZE));
  url.searchParams.set("sort", url.searchParams.get("sort") ?? "RL");
  url.searchParams.set("type", url.searchParams.get("type") ?? "job-category");

  if (page > 1) {
    url.searchParams.set("page", String(page));
    url.searchParams.set("isAjaxRequest", "0");
    url.searchParams.set("is_param", "1");
    url.searchParams.set("isSearchResultEmpty", "1");
    url.searchParams.set("isSectionHome", "0");
    url.searchParams.set("searchParamCount", "1");
  } else {
    url.searchParams.delete("page");
  }

  return url.toString();
}

function parseListPage(html: string) {
  const $ = cheerio.load(html);
  const totalCountText = normalizeText($(".total_count em").first().text());
  const totalCount = totalCountText
    ? Number.parseInt(totalCountText.replace(/,/g, ""), 10)
    : undefined;
  const jobs = new Map<string, SaraminListJob>();

  $(".common_recruilt_list .list_item, .list_recruiting .list_item").each(
    (_, element) => {
      const item = $(element);
      const recIdx = parseRecIdx(item.attr("id")) ?? parseRecIdx(item.html());
      const titleLink = item.find(".job_tit a.str_tit").first();
      const title =
        normalizeText(titleLink.attr("title")) || normalizeText(titleLink.text());
      const companyName = normalizeCompanyName(
        item.find(".company_nm a.str_tit").first().text(),
      );
      const href = titleLink.attr("href");

      if (!recIdx || !title || !companyName || jobs.has(recIdx)) {
        return;
      }

      const listUrl = toAbsoluteSaraminUrl(
        href ?? `/zf_user/jobs/relay/view?view_type=list&rec_idx=${recIdx}`,
      );
      const jobSectors = uniqueStrings(
        item
          .find(".job_sector span")
          .toArray()
          .map((sector) => normalizeText($(sector).text()))
          .filter(Boolean),
      );
      const badges = uniqueStrings(
        item
          .find(".job_badge span")
          .toArray()
          .map((badge) => normalizeText($(badge).text()))
          .filter(Boolean),
      );
      const companySignals = uniqueStrings(
        [
          ...item
            .find(".company_nm .main_corp, .company_nm .info_stock")
            .toArray()
            .map((signal) =>
              normalizeText($(signal).attr("title")) ||
              normalizeText($(signal).text()),
            ),
        ].filter(Boolean),
      );

      jobs.set(recIdx, {
        recIdx,
        companyName,
        title,
        originalUrl: buildCanonicalJobUrl(recIdx),
        listUrl,
        jobSectors,
        badges,
        location: normalizeOptionalText(item.find(".work_place").first().text()),
        careerText: normalizeOptionalText(item.find(".career").first().text()),
        educationText: normalizeOptionalText(
          item.find(".education").first().text(),
        ),
        deadlineText: normalizeOptionalText(
          item.find(".support_detail .date").first().text(),
        ),
        registeredText: normalizeOptionalText(
          item.find(".support_detail .deadlines").first().text(),
        ),
        companySignals,
      });
    },
  );

  return {
    totalCount: Number.isFinite(totalCount) ? totalCount : undefined,
    jobs: [...jobs.values()],
  };
}

function parseRecIdx(value?: string | null) {
  return value?.match(/rec(?:_idx|-link|-)?[_-]?(\d{5,})|rec-(\d{5,})/)?.[1]
    ?? value?.match(/rec(?:_idx)?=(\d{5,})/)?.[1]
    ?? value?.match(/rec-(\d{5,})/)?.[1]
    ?? undefined;
}

function parseDetailPage(html: string): SaraminDetail {
  const $ = cheerio.load(html);
  const metaDescription = normalizeOptionalText(
    $('meta[name="description"]').attr("content") ??
      $('meta[property="og:description"]').attr("content"),
  );
  const metaKeywords = normalizeOptionalText(
    $('meta[name="keywords"]').attr("content"),
  );
  const canonicalUrl = normalizeOptionalText($('link[rel="canonical"]').attr("href"));
  const homepageUrl = extractHomepageUrl(metaDescription);
  const selectorDescription = extractDetailDescription($);
  const deadline = parseDeadlineFromText(metaDescription ?? "")?.deadline;

  return {
    canonicalUrl,
    metaDescription,
    metaKeywords,
    homepageUrl,
    description: selectorDescription,
    deadline,
  };
}

function extractDetailDescription($: CheerioRoot) {
  const selectors = [
    ".jv_cont",
    ".jv_detail",
    ".cont_recruit",
    ".recruit_detail",
    ".user_content",
    ".template-wrap",
    ".wrap_jview .jv_summary",
  ];

  for (const selector of selectors) {
    const text = normalizeLongText($(selector).first().text());
    if (text.length >= 80) {
      return truncateText(text, 2500);
    }
  }

  return undefined;
}

function extractHomepageUrl(text?: string) {
  const homepage = text?.match(/홈페이지:([^,\s]+)/)?.[1];
  if (!homepage) {
    return undefined;
  }

  return homepage.startsWith("http") ? homepage : `https://${homepage}`;
}

async function collectJobs(options: CliOptions) {
  const collected = new Map<string, SaraminListJob>();
  let page = 1;
  let totalCount: number | undefined;

  while (collected.size < options.limit) {
    if (options.pages && page > options.pages) {
      break;
    }

    const pageUrl = buildListPageUrl(options.url, page);
    console.log(`[saramin] Fetching list page ${page}: ${pageUrl}`);
    const html = await fetchText(pageUrl);
    const parsed = parseListPage(html);

    if (parsed.totalCount !== undefined) {
      totalCount = parsed.totalCount;
    }
    if (!parsed.jobs.length) {
      console.warn(`[saramin] Page ${page} contained no jobs. Stopping.`);
      break;
    }

    for (const job of parsed.jobs) {
      if (!collected.has(job.recIdx)) {
        collected.set(job.recIdx, job);
      }
      if (collected.size >= options.limit) {
        break;
      }
    }

    if (totalCount !== undefined && collected.size >= totalCount) {
      break;
    }

    page += 1;
    await sleep(options.delayMs);
  }

  return [...collected.values()].slice(0, options.limit);
}

async function enrichJobs(jobs: SaraminListJob[], delayMs: number) {
  const enriched: NormalizedJob[] = [];

  for (const [index, listJob] of jobs.entries()) {
    let detail: SaraminDetail = {};
    try {
      console.log(
        `[saramin] Fetching detail ${index + 1}/${jobs.length}: ${listJob.recIdx}`,
      );
      detail = parseDetailPage(await fetchText(listJob.listUrl));
    } catch (error) {
      console.warn(
        `[saramin] Detail fetch failed for ${listJob.recIdx}: ${formatError(error)}`,
      );
    }

    enriched.push(normalizeJob(listJob, detail));

    if (index < jobs.length - 1) {
      await sleep(delayMs);
    }
  }

  return enriched;
}

function normalizeJob(listJob: SaraminListJob, detail: SaraminDetail) {
  const textParts = [
    listJob.title,
    listJob.companyName,
    listJob.jobSectors.join(" "),
    listJob.badges.join(" "),
    listJob.careerText,
    listJob.educationText,
    listJob.deadlineText,
    detail.metaDescription,
    detail.metaKeywords,
    detail.description,
  ].filter(Boolean);
  const searchText = textParts.join(" ");
  const companyType = inferCompanyType(
    listJob.companyName,
    searchText,
    listJob.companySignals,
  );
  const jobFamily = inferJobFamily(searchText);
  const employmentType = inferEmploymentType(searchText);
  const kicpaCondition = inferKicpaCondition(searchText);
  const traineeStatus = inferTraineeStatus(searchText, companyType);
  const practicalTrainingInstitution =
    traineeStatus === TraineeStatus.AVAILABLE &&
    (companyType === CompanyType.BIG4 ||
      companyType === CompanyType.LOCAL_ACCOUNTING_FIRM ||
      companyType === CompanyType.MID_SMALL_ACCOUNTING_FIRM);
  const experience = parseExperienceYears(listJob.careerText, searchText);
  const deadline = parseDeadlineFromText(
    [detail.metaDescription, listJob.deadlineText].filter(Boolean).join(" "),
  );
  const location = listJob.location ?? null;
  const description = buildJobDescription(listJob, detail);
  const aiSummary = buildAiSummary({
    title: listJob.title,
    companyName: listJob.companyName,
    jobFamily,
    kicpaCondition,
    traineeStatus,
    practicalTrainingInstitution,
    location,
    deadlineType: deadline.deadlineType,
  });
  const labelNames = buildLabelNames({
    jobFamily,
    employmentType,
    kicpaCondition,
    traineeStatus,
    deadline,
    minExperienceYears: experience.min,
  });

  return {
    listJob,
    detail,
    title: listJob.title,
    description,
    originalUrl: buildCanonicalJobUrl(listJob.recIdx),
    companyName: listJob.companyName,
    companyType,
    jobFamily,
    employmentType,
    kicpaCondition,
    traineeStatus,
    practicalTrainingInstitution,
    minExperienceYears: experience.min,
    maxExperienceYears: experience.max,
    location,
    aiSummary,
    deadlineType: deadline.deadlineType,
    deadline: detail.deadline ?? deadline.deadline,
    labelNames,
    companyTags: buildCompanyTags(companyType, listJob.companySignals),
  } satisfies NormalizedJob;
}

function inferCompanyType(
  companyName: string,
  searchText: string,
  signals: string[],
) {
  const haystack = `${companyName} ${searchText} ${signals.join(" ")}`;

  if (/(삼일|삼정|안진|한영|pwc|kpmg|deloitte|ey|big4)/i.test(haystack)) {
    return CompanyType.BIG4;
  }
  if (/회계법인/.test(haystack)) {
    return CompanyType.LOCAL_ACCOUNTING_FIRM;
  }
  if (/(세무법인|세무회계|회계사무소|세무사무소)/.test(haystack)) {
    return CompanyType.MID_SMALL_ACCOUNTING_FIRM;
  }
  if (/(은행|증권|보험|투자|자산운용|캐피탈|카드|금융|펀드|financ)/i.test(haystack)) {
    return CompanyType.FINANCIAL_COMPANY;
  }
  if (/(공사|공단|재단|협회|공공기관|지방자치|정부|대학교|병원)/.test(haystack)) {
    return CompanyType.PUBLIC_INSTITUTION;
  }

  return CompanyType.GENERAL_COMPANY;
}

function inferJobFamily(searchText: string) {
  if (/(내부회계|내부통제|icfr|sox|공시|연결결산)/i.test(searchText)) {
    return JobFamily.INTERNAL_ACCOUNTING;
  }
  if (/(deal|m&a|m＆a|transaction|재무실사|실사|valuation|가치평가|투자자문)/i.test(searchText)) {
    return JobFamily.DEAL;
  }
  if (/(fas|재무자문|기업가치|컨설팅)/i.test(searchText)) {
    return JobFamily.FAS;
  }
  if (/(세무|tax|법인세|부가세|원천세|조세|기장|신고)/i.test(searchText)) {
    return JobFamily.TAX;
  }
  if (/(감사|audit|공인회계사|kicpa|aicpa)/i.test(searchText)) {
    return JobFamily.AUDIT;
  }

  return JobFamily.IN_HOUSE;
}

function inferEmploymentType(searchText: string) {
  if (/(인턴|intern|수습)/i.test(searchText)) {
    return EmploymentType.INTERN;
  }
  if (/(계약직|contract|기간제|파견)/i.test(searchText)) {
    return EmploymentType.CONTRACT;
  }
  if (/(파트|아르바이트|part[- ]?time)/i.test(searchText)) {
    return EmploymentType.PART_TIME;
  }

  return EmploymentType.FULL_TIME;
}

function inferKicpaCondition(searchText: string) {
  if (/(kicpa|공인회계사|회계사).{0,20}(필수|required|자격증 필수)|필수.{0,20}(kicpa|공인회계사|회계사)/i.test(searchText)) {
    return KicpaCondition.REQUIRED;
  }
  if (/(kicpa|aicpa|공인회계사|회계사)/i.test(searchText)) {
    return KicpaCondition.PREFERRED;
  }
  if (/(자격|우대|필수)/.test(searchText)) {
    return KicpaCondition.UNCLEAR;
  }

  return KicpaCondition.NONE;
}

function inferTraineeStatus(searchText: string, companyType: CompanyType) {
  if (/(실무수습|수습\s*회계사|수습\s*cpa|trainee)/i.test(searchText)) {
    return TraineeStatus.AVAILABLE;
  }
  if (
    /(신입|인턴)/.test(searchText) &&
    (companyType === CompanyType.BIG4 ||
      companyType === CompanyType.LOCAL_ACCOUNTING_FIRM ||
      companyType === CompanyType.MID_SMALL_ACCOUNTING_FIRM)
  ) {
    return TraineeStatus.UNCLEAR;
  }
  if (/(경력|년\s*이상|팀장|manager|lead)/i.test(searchText)) {
    return TraineeStatus.UNAVAILABLE;
  }

  return TraineeStatus.UNCLEAR;
}

function parseExperienceYears(careerText: string | undefined, searchText: string) {
  const career = careerText ?? "";
  if (/(신입|경력무관)/.test(career)) {
    return { min: 0, max: null };
  }

  const range = career.match(/경력\s*(\d+)년\s*[~\-]\s*(\d+)년/);
  if (range) {
    return {
      min: Number.parseInt(range[1], 10),
      max: Number.parseInt(range[2], 10),
    };
  }

  const maxOnly = career.match(/경력\s*(\d+)년\s*(?:↓|이하|미만)/);
  if (maxOnly) {
    return { min: 0, max: Number.parseInt(maxOnly[1], 10) };
  }

  const minOnly = (career || searchText).match(/경력\s*(\d+)년|(\d+)년\s*이상/);
  if (minOnly) {
    return {
      min: Number.parseInt(minOnly[1] ?? minOnly[2], 10),
      max: null,
    };
  }

  return { min: null, max: null };
}

function parseDeadlineFromText(text: string): ParsedDeadline {
  if (/(상시채용|상시\s*채용|상시모집)/.test(text)) {
    return { deadlineType: DeadlineType.ALWAYS_OPEN, deadline: null };
  }
  if (/(채용시|채용 시|수시채용|수시\s*채용)/.test(text)) {
    return { deadlineType: DeadlineType.UNTIL_FILLED, deadline: null };
  }

  const isoDate = text.match(/마감일:(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    return {
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: createKstEndOfDayDate(
        Number.parseInt(isoDate[1], 10),
        Number.parseInt(isoDate[2], 10),
        Number.parseInt(isoDate[3], 10),
      ),
    };
  }

  const monthDay = text.match(/~\s*(\d{1,2})[./](\d{1,2})/);
  if (monthDay) {
    return {
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: createDeadlineFromMonthDay(
        Number.parseInt(monthDay[1], 10),
        Number.parseInt(monthDay[2], 10),
      ),
    };
  }

  const dDay = text.match(/D-(\d+)/i);
  if (dDay) {
    return {
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: createDeadlineFromOffset(Number.parseInt(dDay[1], 10)),
    };
  }

  if (/(D-day|오늘마감|오늘 마감)/i.test(text)) {
    return {
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: createDeadlineFromOffset(0),
    };
  }

  if (/(내일마감|내일 마감)/.test(text)) {
    return {
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: createDeadlineFromOffset(1),
    };
  }

  return { deadlineType: DeadlineType.UNTIL_FILLED, deadline: null };
}

function createDeadlineFromMonthDay(month: number, day: number) {
  const now = new Date();
  let year = now.getFullYear();
  let deadline = createKstEndOfDayDate(year, month, day);

  if (deadline.getTime() < now.getTime() - 30 * 24 * 60 * 60 * 1000) {
    year += 1;
    deadline = createKstEndOfDayDate(year, month, day);
  }

  return deadline;
}

function createDeadlineFromOffset(days: number) {
  const now = new Date();
  const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return createKstEndOfDayDate(
    target.getFullYear(),
    target.getMonth() + 1,
    target.getDate(),
  );
}

function createKstEndOfDayDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 14, 59, 59));
}

function buildJobDescription(listJob: SaraminListJob, detail: SaraminDetail) {
  const detailText = detail.description ?? detail.metaDescription;
  const lines = [
    detailText,
    `사람인에서 수집한 공고입니다. 원문 공고 ID: ${listJob.recIdx}`,
    listJob.jobSectors.length
      ? `직무 키워드: ${listJob.jobSectors.join(", ")}`
      : undefined,
    listJob.location ? `근무지: ${listJob.location}` : undefined,
    listJob.careerText ? `경력/고용형태: ${listJob.careerText}` : undefined,
    listJob.educationText ? `학력: ${listJob.educationText}` : undefined,
    listJob.deadlineText ? `마감 표시: ${listJob.deadlineText}` : undefined,
    listJob.registeredText ? `등록 정보: ${listJob.registeredText}` : undefined,
  ].filter((line): line is string => Boolean(line));

  return truncateText(uniqueStrings(lines).join("\n"), 3000);
}

function buildAiSummary(input: {
  title: string;
  companyName: string;
  jobFamily: JobFamily;
  kicpaCondition: KicpaCondition;
  traineeStatus: TraineeStatus;
  practicalTrainingInstitution: boolean;
  location: string | null;
  deadlineType: DeadlineType;
}) {
  const familyLabel = jobFamilyLabels[input.jobFamily];
  const kicpaText =
    input.kicpaCondition === KicpaCondition.REQUIRED
      ? "KICPA 자격 필수 신호가 있는 공고입니다"
      : input.kicpaCondition === KicpaCondition.PREFERRED
        ? "KICPA 또는 회계사 관련 역량이 우대될 가능성이 있습니다"
        : input.kicpaCondition === KicpaCondition.UNCLEAR
          ? "KICPA 조건은 원문에서 추가 확인이 필요합니다"
          : "KICPA 조건은 명시적으로 확인되지 않았습니다";
  const traineeText =
    input.traineeStatus === TraineeStatus.AVAILABLE
      ? input.practicalTrainingInstitution
        ? "실무수습 가능성이 높은 회계법인 공고입니다"
        : "수습 관련 표현이 있어 지원 전 인정 여부 확인이 필요합니다"
      : input.traineeStatus === TraineeStatus.UNCLEAR
        ? "수습 가능 여부는 원문 또는 기업 확인이 필요합니다"
        : "경력 또는 즉시 투입 중심 공고로 보입니다";
  const deadlineText =
    input.deadlineType === DeadlineType.FIXED_DATE
      ? "마감일이 정해져 있습니다"
      : input.deadlineType === DeadlineType.ALWAYS_OPEN
        ? "상시채용 공고입니다"
        : "채용 시 마감형 공고로 보입니다";

  return `${input.companyName}의 ${input.title} 공고는 ${familyLabel} 계열로 분류했습니다. ${kicpaText}. ${traineeText}. 근무지는 ${input.location ?? "원문 확인 필요"}이며, ${deadlineText}.`;
}

function buildLabelNames(input: {
  jobFamily: JobFamily;
  employmentType: EmploymentType;
  kicpaCondition: KicpaCondition;
  traineeStatus: TraineeStatus;
  deadline: ParsedDeadline;
  minExperienceYears: number | null;
}) {
  const labels = [
    jobFamilyLabels[input.jobFamily],
    input.minExperienceYears === 0
      ? "신입"
      : input.minExperienceYears !== null
        ? "경력"
        : null,
    input.employmentType === EmploymentType.INTERN ? "인턴" : null,
    input.traineeStatus === TraineeStatus.AVAILABLE ? "수습가능" : null,
    input.kicpaCondition === KicpaCondition.REQUIRED ? "KICPA필수" : null,
    input.kicpaCondition === KicpaCondition.PREFERRED ? "KICPA우대" : null,
    input.deadline.deadlineType === DeadlineType.ALWAYS_OPEN ? "상시채용" : null,
    isUrgentDeadline(input.deadline.deadline) ? "마감임박" : null,
  ].filter((label): label is string => Boolean(label));

  return uniqueStrings(labels);
}

function buildCompanyTags(companyType: CompanyType, signals: string[]) {
  return uniqueStrings([
    companyTypeLabels[companyType],
    ...signals,
    "사람인수집",
  ]).slice(0, 8);
}

function isUrgentDeadline(deadline: Date | null) {
  if (!deadline) {
    return false;
  }

  const now = Date.now();
  const diffMs = deadline.getTime() - now;
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

async function ensureSource(prisma: PrismaClient) {
  return prisma.source.upsert({
    where: { name: "사람인" },
    update: { baseUrl: SARAMIN_BASE_URL },
    create: { name: "사람인", baseUrl: SARAMIN_BASE_URL },
  });
}

async function ensureLabels(prisma: PrismaClient) {
  const labelSeedData = [
    { name: "수습가능", color: "emerald" },
    { name: "KICPA우대", color: "blue" },
    { name: "KICPA필수", color: "indigo" },
    { name: "마감임박", color: "rose" },
    { name: "신입", color: "cyan" },
    { name: "경력", color: "slate" },
    { name: "감사", color: "violet" },
    { name: "세무", color: "amber" },
    { name: "FAS", color: "fuchsia" },
    { name: "Deal", color: "purple" },
    { name: "내부회계", color: "orange" },
    { name: "인하우스", color: "teal" },
    { name: "상시채용", color: "green" },
    { name: "인턴", color: "sky" },
  ];
  const labels = await Promise.all(
    labelSeedData.map((label) =>
      prisma.label.upsert({
        where: { name: label.name },
        update: { color: label.color },
        create: label,
      }),
    ),
  );

  return new Map(labels.map((label) => [label.name, label]));
}

async function ensureCompany(
  prisma: PrismaClient,
  job: NormalizedJob,
  ownerPasswordHash: string,
) {
  const existing = await prisma.company.findUnique({
    where: { name: job.companyName },
  });

  if (existing) {
    return prisma.company.update({
      where: { id: existing.id },
      data: {
        type: existing.type,
        websiteUrl: existing.websiteUrl ?? job.detail.homepageUrl,
        description:
          existing.description ??
          `${job.companyName}의 사람인 채용공고를 통해 생성된 기업 프로필입니다.`,
        externalLinks: mergeStringArrays(existing.externalLinks, [
          job.detail.homepageUrl,
          job.originalUrl,
        ]),
        tags: mergeStringArrays(existing.tags, job.companyTags),
      },
    });
  }

  const owner = await prisma.user.upsert({
    where: { username: buildCompanyOwnerUsername(job.companyName) },
    update: {
      displayName: `${job.companyName} 담당자`,
      role: UserRole.COMPANY,
    },
    create: {
      username: buildCompanyOwnerUsername(job.companyName),
      passwordHash: ownerPasswordHash,
      displayName: `${job.companyName} 담당자`,
      role: UserRole.COMPANY,
    },
  });

  return prisma.company.create({
    data: {
      name: job.companyName,
      type: job.companyType,
      websiteUrl: job.detail.homepageUrl,
      description: `${job.companyName}의 사람인 채용공고를 통해 생성된 기업 프로필입니다.`,
      externalLinks: uniqueStrings([job.detail.homepageUrl, job.originalUrl]),
      tags: job.companyTags,
      ownerUserId: owner.id,
    },
  });
}

async function upsertJob(
  prisma: PrismaClient,
  source: Source,
  labelByName: Map<string, Label>,
  company: Company,
  job: NormalizedJob,
) {
  const existing = await prisma.job.findFirst({
    where: { originalUrl: job.originalUrl },
  });
  const payload = {
    title: job.title,
    description: job.description,
    companyId: company.id,
    sourceId: source.id,
    originalUrl: job.originalUrl,
    jobFamily: job.jobFamily,
    employmentType: job.employmentType,
    companyType: company.type,
    kicpaCondition: job.kicpaCondition,
    traineeStatus: job.traineeStatus,
    practicalTrainingInstitution: job.practicalTrainingInstitution,
    minExperienceYears: job.minExperienceYears,
    maxExperienceYears: job.maxExperienceYears,
    location: job.location,
    aiSummary: job.aiSummary,
    deadlineType: job.deadlineType,
    deadline: job.deadline,
    lastCheckedAt: new Date(),
  } satisfies Prisma.JobUncheckedCreateInput;

  const savedJob = existing
    ? await prisma.job.update({
        where: { id: existing.id },
        data: payload,
      })
    : await prisma.job.create({
        data: payload,
      });
  const labels = job.labelNames
    .map((labelName) => labelByName.get(labelName))
    .filter((label): label is Label => Boolean(label));

  await prisma.jobLabel.deleteMany({ where: { jobId: savedJob.id } });
  if (labels.length) {
    await prisma.jobLabel.createMany({
      data: labels.map((label) => ({
        jobId: savedJob.id,
        labelId: label.id,
      })),
      skipDuplicates: true,
    });
  }

  return existing ? "updated" : "created";
}

async function importJobs(jobs: NormalizedJob[]) {
  const prisma = createPrismaClient();
  const stats: ImportStats = {
    parsed: jobs.length,
    imported: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const [source, labelByName, ownerPasswordHash] = await Promise.all([
      ensureSource(prisma),
      ensureLabels(prisma),
      argon2.hash(randomBytes(32).toString("hex")),
    ]);

    for (const job of jobs) {
      try {
        const company = await ensureCompany(prisma, job, ownerPasswordHash);
        const logoResult = await ensureGeneratedCompanyLogoAsset(
          prisma,
          company,
        );
        const backgroundResult = await ensureGeneratedCompanyBackgroundAsset(
          prisma,
          logoResult.company,
        );
        const action = await upsertJob(
          prisma,
          source,
          labelByName,
          backgroundResult.company,
          job,
        );

        stats.imported += 1;
        if (action === "created") {
          stats.created += 1;
        } else {
          stats.updated += 1;
        }
      } catch (error) {
        stats.failed += 1;
        console.warn(
          `[saramin] Failed to import ${job.listJob.recIdx}: ${formatError(error)}`,
        );
      }
    }

    return stats;
  } finally {
    await prisma.$disconnect();
  }
}

function printDryRun(jobs: NormalizedJob[]) {
  const preview = jobs.slice(0, 10).map((job) => ({
    recIdx: job.listJob.recIdx,
    companyName: job.companyName,
    title: job.title,
    originalUrl: job.originalUrl,
    jobFamily: job.jobFamily,
    employmentType: job.employmentType,
    companyType: job.companyType,
    kicpaCondition: job.kicpaCondition,
    traineeStatus: job.traineeStatus,
    deadlineType: job.deadlineType,
    deadline: job.deadline?.toISOString() ?? null,
    location: job.location,
    labels: job.labelNames,
  }));

  console.log(JSON.stringify({ count: jobs.length, preview }, null, 2));
}

function buildCanonicalJobUrl(recIdx: string) {
  return `${SARAMIN_BASE_URL}/zf_user/jobs/view?rec_idx=${recIdx}`;
}

function toAbsoluteSaraminUrl(href: string) {
  return new URL(href.replace(/&amp;/g, "&"), SARAMIN_BASE_URL).toString();
}

function buildCompanyOwnerUsername(companyName: string) {
  return `saramin-company-${hashText(companyName).slice(0, 16)}`;
}

function hashText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeCompanyName(value: string | undefined) {
  return normalizeText(value)
    .replace(/\s*관심기업\s*등록\s*/g, "")
    .trim();
}

function normalizeText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeOptionalText(value: string | undefined | null) {
  const normalized = normalizeText(value);
  return normalized.length ? normalized : undefined;
}

function normalizeLongText(value: string | undefined | null) {
  return (value ?? "")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function mergeStringArrays(first: string[], second: Array<string | undefined>) {
  return uniqueStrings([...first, ...second.filter(Boolean)]);
}

function uniqueStrings(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatError(error: unknown) {
  if (error instanceof HttpRequestError) {
    return `${error.message}${error.body ? ` (${error.body})` : ""}`;
  }

  return error instanceof Error ? error.message : String(error);
}

const jobFamilyLabels: Record<JobFamily, string> = {
  [JobFamily.AUDIT]: "감사",
  [JobFamily.TAX]: "세무",
  [JobFamily.FAS]: "FAS",
  [JobFamily.DEAL]: "Deal",
  [JobFamily.INTERNAL_ACCOUNTING]: "내부회계",
  [JobFamily.IN_HOUSE]: "인하우스",
};

const companyTypeLabels: Record<CompanyType, string> = {
  [CompanyType.BIG4]: "Big4",
  [CompanyType.LOCAL_ACCOUNTING_FIRM]: "회계법인",
  [CompanyType.MID_SMALL_ACCOUNTING_FIRM]: "중소형회계",
  [CompanyType.FINANCIAL_COMPANY]: "금융회사",
  [CompanyType.GENERAL_COMPANY]: "일반기업",
  [CompanyType.PUBLIC_INSTITUTION]: "공공기관",
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const listJobs = await collectJobs(options);
  const normalizedJobs = await enrichJobs(listJobs, options.delayMs);

  if (options.dryRun) {
    printDryRun(normalizedJobs);
    return;
  }

  const stats = await importJobs(normalizedJobs);
  console.log(`[saramin] Import complete: ${JSON.stringify(stats)}`);
}

main().catch((error) => {
  console.error(`[saramin] Import failed: ${formatError(error)}`);
  process.exitCode = 1;
});
