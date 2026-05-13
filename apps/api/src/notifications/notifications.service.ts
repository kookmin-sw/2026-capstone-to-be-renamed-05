import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BookmarkTargetType,
  DeadlineType,
  JobStatus,
  type Notification as NotificationRecord,
  NotificationType,
  Prisma,
  UserRole,
} from '@prisma/client';
import type {
  NotificationItem,
  NotificationListResponse,
  NotificationReadAllResponse,
  NotificationUnreadCountResponse,
  TagSubscriptionItem,
  TagSubscriptionListResponse,
} from '@cpa/shared';
import { PrismaService } from '../prisma/prisma.service';

const DEADLINE_SOON_DAYS = 7;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const notificationJobInclude = {
  company: { select: { name: true } },
  labels: { include: { label: true } },
} satisfies Prisma.JobInclude;

type PrismaWritable = PrismaService | Prisma.TransactionClient;
type NotificationJobRecord = Prisma.JobGetPayload<{
  include: typeof notificationJobInclude;
}>;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      unreadOnly?: boolean;
    } = {},
  ): Promise<NotificationListResponse> {
    await this.ensureBookmarkDeadlineNotifications(userId);

    const page = this.clampInt(options.page, 1, 1, 10_000);
    const pageSize = this.clampInt(
      options.pageSize,
      DEFAULT_PAGE_SIZE,
      1,
      MAX_PAGE_SIZE,
    );
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(options.unreadOnly ? { readAt: null } : {}),
    };

    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items: items.map((item) => this.toNotificationItem(item)),
      page,
      pageSize,
      total,
      unreadCount,
    };
  }

  async unreadCount(userId: string): Promise<NotificationUnreadCountResponse> {
    await this.ensureBookmarkDeadlineNotifications(userId);
    const unreadCount = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { unreadCount };
  }

  async markRead(userId: string, id: string): Promise<NotificationItem> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    if (notification.readAt) {
      return this.toNotificationItem(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return this.toNotificationItem(updated);
  }

  async markAllRead(userId: string): Promise<NotificationReadAllResponse> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updatedCount: result.count, unreadCount: 0 };
  }

  async listTagSubscriptions(
    userId: string,
  ): Promise<TagSubscriptionListResponse> {
    const labels = await this.prisma.label.findMany({
      include: {
        tagSubscriptions: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      items: labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        subscribed: label.tagSubscriptions.length > 0,
      })),
    };
  }

  async subscribeTag(
    userId: string,
    labelId: string,
  ): Promise<TagSubscriptionItem> {
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      select: { id: true, name: true, color: true },
    });
    if (!label) {
      throw new NotFoundException('태그를 찾을 수 없습니다.');
    }

    await this.prisma.jobTagSubscription.upsert({
      where: { userId_labelId: { userId, labelId } },
      update: {},
      create: { userId, labelId },
    });

    return {
      id: label.id,
      name: label.name,
      color: label.color,
      subscribed: true,
    };
  }

  async unsubscribeTag(
    userId: string,
    labelId: string,
  ): Promise<{ ok: boolean }> {
    await this.prisma.jobTagSubscription.deleteMany({
      where: { userId, labelId },
    });
    return { ok: true };
  }

  async createDeadlineSoonNotificationForUserJob(
    userId: string,
    jobId: string,
    client: PrismaWritable = this.prisma,
  ) {
    const job = await client.job.findUnique({
      where: { id: jobId },
      include: notificationJobInclude,
    });
    if (!job || !this.isDeadlineSoon(job)) return;
    await this.createDeadlineSoonNotifications(client, job, [userId]);
  }

  async notifyBookmarkDeadlineSoonForJob(
    jobId: string,
    client: PrismaWritable = this.prisma,
  ) {
    const job = await client.job.findUnique({
      where: { id: jobId },
      include: notificationJobInclude,
    });
    if (!job || !this.isDeadlineSoon(job)) return;

    const bookmarks = await client.bookmark.findMany({
      where: { targetType: BookmarkTargetType.JOB, targetId: jobId },
      select: { userId: true },
    });
    const userIds = [...new Set(bookmarks.map((bookmark) => bookmark.userId))];
    await this.createDeadlineSoonNotifications(client, job, userIds);
  }

  async notifyBookmarkStatusChanged(
    jobId: string,
    status: JobStatus,
    changedAt: Date = new Date(),
    client: PrismaWritable = this.prisma,
  ) {
    const job = await client.job.findUnique({
      where: { id: jobId },
      include: notificationJobInclude,
    });
    if (!job) return;

    const bookmarks = await client.bookmark.findMany({
      where: { targetType: BookmarkTargetType.JOB, targetId: jobId },
      select: { userId: true },
    });
    const userIds = [...new Set(bookmarks.map((bookmark) => bookmark.userId))];
    if (userIds.length === 0) return;

    await client.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: NotificationType.BOOKMARK_STATUS_CHANGED,
        title: '관심 공고 상태 변경',
        body: `${job.company.name} · ${job.title} 공고가 ${statusLabel(status)} 상태로 변경됐습니다.`,
        href: jobHref(job.id),
        jobId: job.id,
        dedupeKey: `bookmark:status:${job.id}:${status}:${changedAt.toISOString()}`,
        metadata: {
          jobTitle: job.title,
          companyName: job.company.name,
          status,
        },
      })),
      skipDuplicates: true,
    });
  }

  async notifyTagSubscribersForNewJob(
    jobId: string,
    client: PrismaWritable = this.prisma,
  ) {
    const job = await client.job.findUnique({
      where: { id: jobId },
      include: notificationJobInclude,
    });
    if (!job || job.status !== JobStatus.OPEN || job.labels.length === 0) {
      return;
    }

    const labelIds = job.labels.map(({ labelId }) => labelId);
    const subscriptions = await client.jobTagSubscription.findMany({
      where: {
        labelId: { in: labelIds },
        user: { role: UserRole.JOB_SEEKER },
      },
      select: {
        userId: true,
        labelId: true,
        label: { select: { name: true } },
      },
    });

    const byUser = new Map<
      string,
      { labelIds: string[]; labelNames: string[] }
    >();
    for (const subscription of subscriptions) {
      const current = byUser.get(subscription.userId) ?? {
        labelIds: [],
        labelNames: [],
      };
      current.labelIds.push(subscription.labelId);
      current.labelNames.push(subscription.label.name);
      byUser.set(subscription.userId, current);
    }

    if (byUser.size === 0) return;

    await client.notification.createMany({
      data: [...byUser.entries()].map(([userId, matched]) => ({
        userId,
        type: NotificationType.TAG_NEW_JOB,
        title: '구독 태그 새 공고',
        body: `${matched.labelNames.join(', ')} 태그의 새 공고가 등록됐습니다: ${job.company.name} · ${job.title}`,
        href: jobHref(job.id),
        jobId: job.id,
        labelId: matched.labelIds[0] ?? null,
        dedupeKey: `tag:new-job:${job.id}`,
        metadata: {
          jobTitle: job.title,
          companyName: job.company.name,
          matchedLabelIds: matched.labelIds,
          matchedLabelNames: matched.labelNames,
        },
      })),
      skipDuplicates: true,
    });
  }

  async ensureBookmarkDeadlineNotifications(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId, targetType: BookmarkTargetType.JOB },
      select: { targetId: true },
    });
    const jobIds = [...new Set(bookmarks.map((bookmark) => bookmark.targetId))];
    if (jobIds.length === 0) return;

    const { start, end } = deadlineSoonWindow();
    const jobs = await this.prisma.job.findMany({
      where: {
        id: { in: jobIds },
        status: JobStatus.OPEN,
        deadlineType: DeadlineType.FIXED_DATE,
        deadline: { gte: start, lte: end },
      },
      include: notificationJobInclude,
    });

    for (const job of jobs) {
      await this.createDeadlineSoonNotifications(this.prisma, job, [userId]);
    }
  }

  private async createDeadlineSoonNotifications(
    client: PrismaWritable,
    job: NotificationJobRecord,
    userIds: string[],
  ) {
    if (userIds.length === 0 || !job.deadline) return;
    const uniqueUserIds = [...new Set(userIds)];
    const deadlineKey = dateKey(job.deadline);

    await client.notification.createMany({
      data: uniqueUserIds.map((userId) => ({
        userId,
        type: NotificationType.BOOKMARK_DEADLINE_SOON,
        title: '관심 공고 마감 임박',
        body: `${job.company.name} · ${job.title} 공고가 ${formatKoreanDate(job.deadline!)} 마감됩니다.`,
        href: jobHref(job.id),
        jobId: job.id,
        dedupeKey: `bookmark:deadline-soon:${job.id}:${deadlineKey}`,
        metadata: {
          jobTitle: job.title,
          companyName: job.company.name,
          deadline: job.deadline!.toISOString(),
        },
      })),
      skipDuplicates: true,
    });
  }

  private isDeadlineSoon(
    job: Pick<NotificationJobRecord, 'status' | 'deadlineType' | 'deadline'>,
  ) {
    if (
      job.status !== JobStatus.OPEN ||
      job.deadlineType !== DeadlineType.FIXED_DATE ||
      !job.deadline
    ) {
      return false;
    }

    const { start, end } = deadlineSoonWindow();
    return job.deadline >= start && job.deadline <= end;
  }

  private toNotificationItem(record: NotificationRecord): NotificationItem {
    return {
      id: record.id,
      type: record.type,
      title: record.title,
      body: record.body,
      href: record.href,
      jobId: record.jobId,
      labelId: record.labelId,
      metadata: toRecord(record.metadata),
      readAt: record.readAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private clampInt(
    value: number | undefined,
    fallback: number,
    min: number,
    max: number,
  ) {
    if (value === undefined || !Number.isInteger(value)) return fallback;
    return Math.min(max, Math.max(min, value));
  }
}

function deadlineSoonWindow() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + DEADLINE_SOON_DAYS);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatKoreanDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function statusLabel(status: JobStatus) {
  if (status === JobStatus.OPEN) return '공개';
  if (status === JobStatus.CLOSED) return '마감';
  return '임시저장';
}

function jobHref(jobId: string) {
  return `/jobs/detail/?id=${encodeURIComponent(jobId)}`;
}

function toRecord(value: Prisma.JsonValue): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value;
}
