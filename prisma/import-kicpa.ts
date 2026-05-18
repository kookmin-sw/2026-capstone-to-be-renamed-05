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

for (const envFilePath of resolveEnvFilePaths()) {
  loadDotenv({ path: envFilePath, override: false });
}

const KICPA_BASE_URL = "https://www.kicpa.or.kr";
const DEFAULT_LIMIT = 300;
const DEFAULT_DELAY_MS = 500;
const HTTP_TIMEOUT_MS = 15_000;
const HTTP_MAX_RETRIES = 2;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

type BoardKey = "all" | "cpa" | "trainee";
type ConcreteBoardKey = Exclude<BoardKey, "all">;
type CheerioRoot = ReturnType<typeof cheerio.load>;

type KicpaBoardConfig = {
  key: ConcreteBoardKey;
  label: string;
  listPath: string;
  detailPath: string;
  listParams: Record<string, string>;
};

type CliOptions = {
  board: BoardKey;
  limit: number;
  pages?: number;
  delayMs: number;
  dryRun: boolean;
};

type KicpaListJob = {
  board: KicpaBoardConfig;
  postId: string;
  rowNumber?: number;
  title: string;
  companyName: string;
  originalUrl: string;
  detailFetchUrl: string;
  location?: string;
  jobKindText?: string;
  employmentText?: string;
  registeredText?: string;
  viewCount?: number;
};

type DetailField = {
  text: string;
  href?: string;
};

type KicpaDetail = {
  title?: string;
  companyTypeText?: string;
  companyName?: string;
  homepageUrl?: string;
  recruitmentCountText?: string;
  employmentText?: string;
  location?: string;
  careerText?: string;
  salaryText?: string;
  educationText?: string;
  deadlineText?: string;
  description?: string;
};

type ParsedDeadline = {
  deadlineType: DeadlineType;
  deadline: Date | null;
};

type NormalizedJob = {
  listJob: KicpaListJob;
  detail: KicpaDetail;
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

const kicpaBoards: Record<ConcreteBoardKey, KicpaBoardConfig> = {
  cpa: {
    key: "cpa",
    label: "구인(CPA)",
    listPath: "/home/jobOffrSrchGnrl/list.face",
    detailPath: "/home/jobOffrSrchGnrl/detail.face",
    listParams: {
      ijJobSep: "1",
      listCnt: "20",
    },
  },
  trainee: {
    key: "trainee",
    label: "구인(수습CPA)",
    listPath: "/home/jobOffrSrchNewGnrl/list.face",
    detailPath: "/home/jobOffrSrchNewGnrl/detail.face",
    listParams: {
      listCnt: "20",
      ijEmpSep: "all",
    },
  },
};

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
    board: "all",
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
      case "--board":
        options.board = parseBoard(readValue());
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

function parseBoard(value: string): BoardKey {
  if (value === "all" || value === "cpa" || value === "trainee") {
    return value;
  }

  throw new Error("--board must be one of: all, cpa, trainee.");
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
  console.log(`Usage: npm run prisma:import:kicpa -- [options]

Options:
  --board <name>      Board to import: all, cpa, trainee (default: all)
  --limit <number>   Maximum jobs to import across selected boards (default: ${DEFAULT_LIMIT})
  --pages <number>   Maximum pages to scan per board
  --delay-ms <n>     Delay between KICPA requests (default: ${DEFAULT_DELAY_MS})
  --dry-run          Fetch and parse without writing to the database
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
    `KICPA request failed: ${response.status} ${response.statusText}`,
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

function selectedBoards(board: BoardKey) {
  if (board === "all") {
    return [kicpaBoards.cpa, kicpaBoards.trainee];
  }

  return [kicpaBoards[board]];
}

function buildListPageUrl(board: KicpaBoardConfig, page: number) {
  const url = new URL(board.listPath, KICPA_BASE_URL);
  for (const [key, value] of Object.entries(board.listParams)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("page", String(page));

  return url.toString();
}

function buildDetailFetchUrl(board: KicpaBoardConfig, postId: string, page = 1) {
  const url = new URL(board.detailPath, KICPA_BASE_URL);
  url.searchParams.set("ijIdNum", postId);
  url.searchParams.set("page", String(page));
  for (const [key, value] of Object.entries(board.listParams)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function buildCanonicalDetailUrl(board: KicpaBoardConfig, postId: string) {
  const url = new URL(board.detailPath, KICPA_BASE_URL);
  url.searchParams.set("ijIdNum", postId);

  return url.toString();
}

function parseListPage(board: KicpaBoardConfig, html: string) {
  const $ = cheerio.load(html);
  const totalCount = parseTotalCount($);
  const jobs: KicpaListJob[] = [];

  $("table.table_st02 tbody tr").each((_, element) => {
    const row = $(element);
    const cells = row.find("td").toArray();
    const titleLink = row.find("a.subject_title").first();
    const postId = parsePostId(titleLink.attr("onclick"));
    const title = normalizeText(titleLink.text());

    if (!postId || !title || cells.length < 6) {
      return;
    }

    const rowNumber = parseInteger($(cells[0]).text());
    const companyName = normalizeCompanyName($(cells[2]).text());
    const location = normalizeLocationText($(cells[3]).text());
    const isTraineeBoard = board.key === "trainee";
    const jobKindText = normalizeOptionalText($(cells[4]).text());
    const employmentText = isTraineeBoard
      ? normalizeOptionalText($(cells[5]).text())
      : undefined;
    const registeredText = normalizeOptionalText(
      $(cells[isTraineeBoard ? 6 : 5]).text(),
    );
    const viewCount = parseInteger($(cells[isTraineeBoard ? 7 : 6]).text());

    jobs.push({
      board,
      postId,
      rowNumber: rowNumber ?? undefined,
      title,
      companyName,
      originalUrl: buildCanonicalDetailUrl(board, postId),
      detailFetchUrl: buildDetailFetchUrl(board, postId),
      location,
      jobKindText,
      employmentText,
      registeredText,
      viewCount: viewCount ?? undefined,
    });
  });

  return { totalCount, jobs };
}

function parseTotalCount($: CheerioRoot) {
  const totalText = normalizeText($("p.total").first().text());
  const matched = totalText.match(/총\s*([\d,]+)\s*건/);
  if (!matched) {
    return undefined;
  }

  return Number.parseInt(matched[1].replace(/,/g, ""), 10);
}

function parsePostId(value?: string | null) {
  return value?.match(/fn_detail\(['"]?(\d+)['"]?\)/)?.[1];
}

async function collectJobs(options: CliOptions) {
  const collected = new Map<string, KicpaListJob>();

  for (const board of selectedBoards(options.board)) {
    let page = 1;
    let totalCount: number | undefined;

    while (collected.size < options.limit) {
      if (options.pages && page > options.pages) {
        break;
      }

      const pageUrl = buildListPageUrl(board, page);
      console.log(`[kicpa] Fetching ${board.label} page ${page}: ${pageUrl}`);
      const parsed = parseListPage(board, await fetchText(pageUrl));

      if (parsed.totalCount !== undefined) {
        totalCount = parsed.totalCount;
      }
      if (!parsed.jobs.length) {
        console.warn(`[kicpa] ${board.label} page ${page} contained no jobs.`);
        break;
      }

      for (const job of parsed.jobs) {
        if (!collected.has(job.originalUrl)) {
          collected.set(job.originalUrl, job);
        }
        if (collected.size >= options.limit) {
          break;
        }
      }

      if (totalCount !== undefined && page * listCountForBoard(board) >= totalCount) {
        break;
      }

      page += 1;
      await sleep(options.delayMs);
    }
  }

  return [...collected.values()].slice(0, options.limit);
}

function listCountForBoard(board: KicpaBoardConfig) {
  return Number.parseInt(board.listParams.listCnt ?? "20", 10);
}

async function enrichJobs(jobs: KicpaListJob[], delayMs: number) {
  const enriched: NormalizedJob[] = [];

  for (const [index, listJob] of jobs.entries()) {
    let detail: KicpaDetail = {};
    try {
      console.log(
        `[kicpa] Fetching detail ${index + 1}/${jobs.length}: ${listJob.postId}`,
      );
      detail = parseDetailPage(await fetchText(listJob.detailFetchUrl));
    } catch (error) {
      console.warn(
        `[kicpa] Detail fetch failed for ${listJob.postId}: ${formatError(error)}`,
      );
    }

    enriched.push(normalizeJob(listJob, detail));

    if (index < jobs.length - 1) {
      await sleep(delayMs);
    }
  }

  return enriched;
}

function parseDetailPage(html: string): KicpaDetail {
  const $ = cheerio.load(html);
  const fields = extractDetailFields($);
  const content = normalizeLongText($("pre.txt_infor").first().text());
  const title = extractDetailTitle($, fields);
  const homepageField = fields.get("홈페이지");

  return {
    title,
    companyTypeText: fieldText(fields, "회사구분"),
    companyName: normalizeCompanyName(fieldText(fields, "회사명")),
    homepageUrl: normalizeHomepageUrl(homepageField?.href ?? homepageField?.text),
    recruitmentCountText: fieldText(fields, "채용인원"),
    employmentText: fieldText(fields, "고용형태"),
    location: normalizeLocationText(fieldText(fields, "근무지역")),
    careerText: fieldText(fields, "경력"),
    salaryText: fieldText(fields, "급여조건"),
    educationText: fieldText(fields, "학력"),
    deadlineText: fieldText(fields, "마감일"),
    description: content || undefined,
  };
}

function extractDetailFields($: CheerioRoot) {
  const fields = new Map<string, DetailField>();

  $("table.table_st02_write tr").each((_, rowElement) => {
    const children = $(rowElement).children("th,td").toArray();

    for (let index = 0; index < children.length; index += 1) {
      const child = $(children[index]);
      if (!child.is("th")) {
        continue;
      }

      const label = normalizeFieldLabel(child.text());
      const td = children.slice(index + 1).find((candidate) => $(candidate).is("td"));
      if (!label || !td) {
        continue;
      }

      const cell = $(td);
      const href = normalizeOptionalText(cell.find("a[href]").first().attr("href"));
      fields.set(label, {
        text: normalizeLongText(cell.text()),
        href,
      });
    }
  });

  return fields;
}

function extractDetailTitle($: CheerioRoot, fields: Map<string, DetailField>) {
  const strongTitle = normalizeOptionalText(
    $("table.table_st02_write th")
      .filter((_, element) => normalizeFieldLabel($(element).text()) === "제목")
      .first()
      .next("td")
      .find("strong")
      .first()
      .text(),
  );

  return strongTitle ?? fieldText(fields, "제목");
}

function fieldText(fields: Map<string, DetailField>, label: string) {
  return normalizeOptionalText(fields.get(normalizeFieldLabel(label))?.text);
}

function normalizeJob(listJob: KicpaListJob, detail: KicpaDetail) {
  const title = detail.title ?? listJob.title;
  const companyName = normalizeCompanyName(detail.companyName ?? listJob.companyName);
  const location = detail.location ?? listJob.location ?? null;
  const searchText = [
    title,
    companyName,
    listJob.board.label,
    listJob.jobKindText,
    listJob.employmentText,
    detail.companyTypeText,
    detail.recruitmentCountText,
    detail.employmentText,
    detail.location,
    detail.careerText,
    detail.salaryText,
    detail.educationText,
    detail.deadlineText,
    detail.description,
  ]
    .filter(Boolean)
    .join(" ");
  const companyType = inferCompanyType(companyName, detail.companyTypeText, searchText);
  const jobFamily = inferJobFamily(searchText);
  const employmentType = inferEmploymentType(
    detail.employmentText ?? listJob.employmentText,
    searchText,
  );
  const kicpaCondition = inferKicpaCondition(listJob.board.key, searchText);
  const traineeStatus = inferTraineeStatus(listJob.board.key, searchText, companyType);
  const practicalTrainingInstitution =
    listJob.board.key === "trainee" ||
    (traineeStatus === TraineeStatus.AVAILABLE && isAccountingFirm(companyType));
  const experience = parseExperienceYears(detail.careerText, searchText);
  const deadline = parseDeadlineFromText(detail.deadlineText ?? searchText);
  const description = buildJobDescription(listJob, detail);
  const aiSummary = buildAiSummary({
    title,
    companyName,
    boardLabel: listJob.board.label,
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
    title,
    description,
    originalUrl: listJob.originalUrl,
    companyName,
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
    deadline: deadline.deadline,
    labelNames,
    companyTags: buildCompanyTags(companyType, listJob.board.key),
  } satisfies NormalizedJob;
}

function inferCompanyType(
  companyName: string,
  companyTypeText: string | undefined,
  searchText: string,
) {
  const haystack = `${companyName} ${companyTypeText ?? ""} ${searchText}`;

  if (/(삼일|삼정|안진|한영|pwc|kpmg|deloitte|ey|big\s*4)/i.test(companyName)) {
    return CompanyType.BIG4;
  }
  if (/회계법인/.test(companyTypeText ?? "") || /회계법인/.test(companyName)) {
    return CompanyType.LOCAL_ACCOUNTING_FIRM;
  }
  if (/(회계사무소|세무법인|세무회계|세무사무소)/.test(haystack)) {
    return CompanyType.MID_SMALL_ACCOUNTING_FIRM;
  }
  if (/공공기관|공사|공단|재단|협회|정부|대학교|병원/.test(haystack)) {
    return CompanyType.PUBLIC_INSTITUTION;
  }
  if (/(은행|증권|보험|투자|자산운용|캐피탈|카드|금융|펀드|financ)/i.test(haystack)) {
    return CompanyType.FINANCIAL_COMPANY;
  }

  return CompanyType.GENERAL_COMPANY;
}

function inferJobFamily(searchText: string) {
  if (/(내부회계|내부통제|icfr|sox|공시|연결결산)/i.test(searchText)) {
    return JobFamily.INTERNAL_ACCOUNTING;
  }
  if (/(deal|m&a|m＆a|transaction|재무실사|실사|valuation|가치평가|투자자문|기업금융)/i.test(searchText)) {
    return JobFamily.DEAL;
  }
  if (/(세무|tax|법인세|부가세|원천세|조세|기장|신고)/i.test(searchText)) {
    return JobFamily.TAX;
  }
  if (/(fas|재무자문|기업가치|컨설팅|ipo|ifrs conversion)/i.test(searchText)) {
    return JobFamily.FAS;
  }
  if (/(감사|audit|공인회계사|회계사|kicpa|cpa)/i.test(searchText)) {
    return JobFamily.AUDIT;
  }

  return JobFamily.IN_HOUSE;
}

function inferEmploymentType(employmentText: string | undefined, searchText: string) {
  const explicit = employmentText ?? "";
  if (/(파트|아르바이트|part[- ]?time)/i.test(explicit)) {
    return EmploymentType.PART_TIME;
  }
  if (/(계약직|contract|기간제|파견)/i.test(explicit)) {
    return EmploymentType.CONTRACT;
  }
  if (/(인턴|intern)/i.test(explicit)) {
    return EmploymentType.INTERN;
  }
  if (/(풀타임|full[- ]?time|정규직)/i.test(explicit)) {
    return EmploymentType.FULL_TIME;
  }

  if (/(계약직|contract|기간제|파견)/i.test(searchText)) {
    return EmploymentType.CONTRACT;
  }
  if (/(풀타임|full[- ]?time|정규직)/i.test(searchText)) {
    return EmploymentType.FULL_TIME;
  }
  if (/(파트|아르바이트|part[- ]?time)/i.test(searchText)) {
    return EmploymentType.PART_TIME;
  }
  if (/(인턴|intern)/i.test(searchText)) {
    return EmploymentType.INTERN;
  }

  return EmploymentType.FULL_TIME;
}

function inferKicpaCondition(board: ConcreteBoardKey, searchText: string) {
  if (board === "cpa") {
    return KicpaCondition.REQUIRED;
  }
  if (board === "trainee") {
    return KicpaCondition.PREFERRED;
  }
  if (/(kicpa|공인회계사|회계사|cpa).{0,30}(필수|required|자격증 필수)|필수.{0,30}(kicpa|공인회계사|회계사|cpa)/i.test(searchText)) {
    return KicpaCondition.REQUIRED;
  }
  if (/(kicpa|aicpa|공인회계사|회계사|cpa)/i.test(searchText)) {
    return KicpaCondition.PREFERRED;
  }

  return KicpaCondition.NONE;
}

function inferTraineeStatus(
  board: ConcreteBoardKey,
  searchText: string,
  companyType: CompanyType,
) {
  if (board === "trainee") {
    return TraineeStatus.AVAILABLE;
  }
  if (/(실무수습|수습\s*회계사|수습\s*cpa|수습\s*공인회계사|trainee)/i.test(searchText)) {
    return TraineeStatus.AVAILABLE;
  }
  return TraineeStatus.UNAVAILABLE;
}

function isAccountingFirm(companyType: CompanyType) {
  return (
    companyType === CompanyType.BIG4 ||
    companyType === CompanyType.LOCAL_ACCOUNTING_FIRM ||
    companyType === CompanyType.MID_SMALL_ACCOUNTING_FIRM
  );
}

function parseExperienceYears(careerText: string | undefined, searchText: string) {
  const haystack = `${careerText ?? ""} ${searchText}`;

  if (/(신입|경력무관|무관|졸업예정)/.test(careerText ?? "")) {
    return { min: 0, max: null };
  }

  const range = haystack.match(/(\d+)\s*[~\-]\s*(\d+)\s*년|(\d+)\s*년차\s*[~\-]\s*(\d+)\s*년차/);
  if (range) {
    return {
      min: Number.parseInt(range[1] ?? range[3], 10),
      max: Number.parseInt(range[2] ?? range[4], 10),
    };
  }

  const minOnly = haystack.match(/경력\s*(\d+)\s*년|(\d+)\s*년\s*이상|(\d+)\s*년차\s*이상/);
  if (minOnly) {
    return {
      min: Number.parseInt(minOnly[1] ?? minOnly[2] ?? minOnly[3], 10),
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

  const date = text.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (date) {
    return {
      deadlineType: DeadlineType.FIXED_DATE,
      deadline: createKstEndOfDayDate(
        Number.parseInt(date[1], 10),
        Number.parseInt(date[2], 10),
        Number.parseInt(date[3], 10),
      ),
    };
  }

  return { deadlineType: DeadlineType.UNTIL_FILLED, deadline: null };
}

function createKstEndOfDayDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 14, 59, 59));
}

function buildJobDescription(listJob: KicpaListJob, detail: KicpaDetail) {
  const nonContactLines = [
    detail.description,
    `한국공인회계사회 ${listJob.board.label}에서 수집한 공고입니다. 원문 게시글 ID: ${listJob.postId}`,
    detail.companyTypeText ? `회사구분: ${detail.companyTypeText}` : undefined,
    detail.recruitmentCountText
      ? `채용인원: ${detail.recruitmentCountText}`
      : undefined,
    detail.employmentText ? `고용형태: ${detail.employmentText}` : undefined,
    detail.location ?? listJob.location
      ? `근무지역: ${detail.location ?? listJob.location}`
      : undefined,
    detail.careerText ? `경력: ${detail.careerText}` : undefined,
    detail.salaryText ? `급여조건: ${detail.salaryText}` : undefined,
    detail.educationText ? `학력: ${detail.educationText}` : undefined,
    detail.deadlineText ? `마감일: ${detail.deadlineText}` : undefined,
    listJob.registeredText ? `등록일자: ${listJob.registeredText}` : undefined,
  ].filter((line): line is string => Boolean(line));

  return truncateText(uniqueStrings(nonContactLines).join("\n"), 4000);
}

function buildAiSummary(input: {
  title: string;
  companyName: string;
  boardLabel: string;
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
      ? "KICPA 자격 필수로 분류했습니다"
      : input.kicpaCondition === KicpaCondition.PREFERRED
        ? "KICPA 또는 CPA 관련 역량 우대 가능성이 있습니다"
        : "KICPA 조건은 명시적으로 확인되지 않았습니다";
  const traineeText =
    input.traineeStatus === TraineeStatus.AVAILABLE
      ? input.practicalTrainingInstitution
        ? "수습CPA 채용 또는 실무수습 가능 신호가 있습니다"
        : "수습 관련 표현이 있어 원문 확인이 필요합니다"
      : input.traineeStatus === TraineeStatus.UNCLEAR
        ? "수습 가능 여부는 원문 또는 회사 확인이 필요합니다"
        : "수습 가능 신호는 확인되지 않았습니다";
  const deadlineText =
    input.deadlineType === DeadlineType.FIXED_DATE
      ? "마감일이 정해져 있습니다"
      : input.deadlineType === DeadlineType.ALWAYS_OPEN
        ? "상시채용 공고입니다"
        : "채용 시 마감 또는 마감일 미기재 공고입니다";

  return `${input.companyName}의 ${input.title} 공고는 한국공인회계사회 ${input.boardLabel} 출처이며 ${familyLabel} 계열로 분류했습니다. ${kicpaText}. ${traineeText}. 근무지는 ${input.location ?? "원문 확인 필요"}이며, ${deadlineText}.`;
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

function buildCompanyTags(companyType: CompanyType, board: ConcreteBoardKey) {
  return uniqueStrings([
    companyTypeLabels[companyType],
    "KICPA수집",
    board === "trainee" ? "수습CPA채용" : undefined,
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
    where: { name: "한국공인회계사회" },
    update: { baseUrl: KICPA_BASE_URL },
    create: { name: "한국공인회계사회", baseUrl: KICPA_BASE_URL },
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
          `${job.companyName}의 한국공인회계사회 채용공고를 통해 생성된 기업 프로필입니다.`,
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
      description: `${job.companyName}의 한국공인회계사회 채용공고를 통해 생성된 기업 프로필입니다.`,
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
        const action = await upsertJob(prisma, source, labelByName, company, job);

        stats.imported += 1;
        if (action === "created") {
          stats.created += 1;
        } else {
          stats.updated += 1;
        }
      } catch (error) {
        stats.failed += 1;
        console.warn(
          `[kicpa] Failed to import ${job.listJob.postId}: ${formatError(error)}`,
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
    board: job.listJob.board.key,
    postId: job.listJob.postId,
    companyName: job.companyName,
    title: job.title,
    originalUrl: job.originalUrl,
    jobFamily: job.jobFamily,
    employmentType: job.employmentType,
    companyType: job.companyType,
    kicpaCondition: job.kicpaCondition,
    traineeStatus: job.traineeStatus,
    practicalTrainingInstitution: job.practicalTrainingInstitution,
    deadlineType: job.deadlineType,
    deadline: job.deadline?.toISOString() ?? null,
    location: job.location,
    labels: job.labelNames,
  }));

  console.log(JSON.stringify({ count: jobs.length, preview }, null, 2));
}

function buildCompanyOwnerUsername(companyName: string) {
  return `kicpa-company-${hashText(companyName).slice(0, 16)}`;
}

function hashText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeHomepageUrl(value: string | undefined) {
  const normalized = normalizeOptionalText(value);
  if (!normalized || /^mailto:/i.test(normalized)) {
    return undefined;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  if (/^[\w.-]+\.[a-z]{2,}/i.test(normalized)) {
    return `https://${normalized}`;
  }

  return undefined;
}

function normalizeCompanyName(value: string | undefined) {
  const normalized = normalizeText(value);
  return normalized || "회사명 미확인";
}

function normalizeFieldLabel(value: string | undefined | null) {
  return normalizeText(value).replace(/\s+/g, "");
}

function normalizeText(value: string | undefined | null) {
  return decodeHtml(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeOptionalText(value: string | undefined | null) {
  const normalized = normalizeText(value);
  return normalized.length ? normalized : undefined;
}

function normalizeLocationText(value: string | undefined | null) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return undefined;
  }

  const parts = normalized.split(" ");
  if (parts.length === 2 && parts[0] === parts[1]) {
    return parts[0];
  }

  return normalized;
}

function normalizeLongText(value: string | undefined | null) {
  return decodeHtml(value ?? "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function parseInteger(value: string | undefined | null) {
  const parsed = Number.parseInt(normalizeText(value).replace(/,/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
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
  console.log(`[kicpa] Import complete: ${JSON.stringify(stats)}`);
}

main().catch((error) => {
  console.error(`[kicpa] Import failed: ${formatError(error)}`);
  process.exitCode = 1;
});
