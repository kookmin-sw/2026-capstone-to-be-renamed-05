import { DeadlineType, JobStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let prisma: {
    job: { findUnique: jest.Mock; findMany: jest.Mock };
    bookmark: { findMany: jest.Mock };
    notification: {
      createMany: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    label: { findMany: jest.Mock; findUnique: jest.Mock };
    jobTagSubscription: {
      findMany: jest.Mock;
      upsert: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: NotificationsService;

  beforeEach(() => {
    prisma = {
      job: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      bookmark: {
        findMany: jest.fn(),
      },
      notification: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      label: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      jobTagSubscription: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
    };
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it('creates a deadline-soon notification only for an open bookmarked job in the 7 day window', async () => {
    const deadline = deadlineDaysFromNow(3);
    prisma.job.findUnique.mockResolvedValue(
      jobRecord({
        deadline,
        deadlineType: DeadlineType.FIXED_DATE,
        status: JobStatus.OPEN,
      }),
    );

    await service.createDeadlineSoonNotificationForUserJob('user-1', 'job-1');

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'user-1',
          type: NotificationType.BOOKMARK_DEADLINE_SOON,
          jobId: 'job-1',
          dedupeKey: `bookmark:deadline-soon:job-1:${deadline.toISOString().slice(0, 10)}`,
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('does not create deadline notifications for closed jobs', async () => {
    prisma.job.findUnique.mockResolvedValue(
      jobRecord({
        deadline: deadlineDaysFromNow(3),
        deadlineType: DeadlineType.FIXED_DATE,
        status: JobStatus.CLOSED,
      }),
    );

    await service.createDeadlineSoonNotificationForUserJob('user-1', 'job-1');

    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('creates one tag notification per user even when multiple subscribed labels match', async () => {
    prisma.job.findUnique.mockResolvedValue(
      jobRecord({
        labels: [
          { labelId: 'label-a', label: { id: 'label-a', name: '감사' } },
          { labelId: 'label-b', label: { id: 'label-b', name: '수습' } },
        ],
      }),
    );
    prisma.jobTagSubscription.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        labelId: 'label-a',
        label: { name: '감사' },
      },
      {
        userId: 'user-1',
        labelId: 'label-b',
        label: { name: '수습' },
      },
      {
        userId: 'user-2',
        labelId: 'label-b',
        label: { name: '수습' },
      },
    ]);

    await service.notifyTagSubscribersForNewJob('job-1');

    const createArg = firstMockArg<{
      data: Array<{
        userId: string;
        type: NotificationType;
        dedupeKey: string;
        metadata: { matchedLabelNames: string[] };
      }>;
      skipDuplicates: boolean;
    }>(prisma.notification.createMany);
    expect(createArg.skipDuplicates).toBe(true);
    expect(createArg.data).toHaveLength(2);
    expect(createArg.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-1',
          type: NotificationType.TAG_NEW_JOB,
          dedupeKey: 'tag:new-job:job-1',
        }),
        expect.objectContaining({
          userId: 'user-2',
          type: NotificationType.TAG_NEW_JOB,
        }),
      ]),
    );
    const userOneNotification = createArg.data.find(
      (item) => item.userId === 'user-1',
    );
    expect(userOneNotification?.metadata.matchedLabelNames).toEqual([
      '감사',
      '수습',
    ]);
  });

  it('lists labels with the current users subscription state without creating backfill notifications', async () => {
    prisma.label.findMany.mockResolvedValue([
      {
        id: 'label-a',
        name: '감사',
        color: '#ef476f',
        tagSubscriptions: [{ id: 'sub-1' }],
      },
      {
        id: 'label-b',
        name: '수습',
        color: null,
        tagSubscriptions: [],
      },
    ]);

    const result = await service.listTagSubscriptions('user-1');

    expect(result.items).toEqual([
      { id: 'label-a', name: '감사', color: '#ef476f', subscribed: true },
      { id: 'label-b', name: '수습', color: null, subscribed: false },
    ]);
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('marks one notification as read for the current user', async () => {
    const createdAt = new Date('2026-05-13T00:00:00.000Z');
    prisma.notification.findFirst.mockResolvedValue({
      id: 'notification-1',
      userId: 'user-1',
      type: NotificationType.TAG_NEW_JOB,
      title: '새 공고',
      body: '태그 새 공고',
      href: '/jobs/detail/?id=job-1',
      jobId: 'job-1',
      labelId: 'label-1',
      metadata: { matchedLabelNames: ['감사'] },
      dedupeKey: 'tag:new-job:job-1',
      readAt: null,
      createdAt,
    });
    prisma.notification.update.mockResolvedValue({
      id: 'notification-1',
      userId: 'user-1',
      type: NotificationType.TAG_NEW_JOB,
      title: '새 공고',
      body: '태그 새 공고',
      href: '/jobs/detail/?id=job-1',
      jobId: 'job-1',
      labelId: 'label-1',
      metadata: { matchedLabelNames: ['감사'] },
      dedupeKey: 'tag:new-job:job-1',
      readAt: createdAt,
      createdAt,
    });

    const result = await service.markRead('user-1', 'notification-1');

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'notification-1', userId: 'user-1' },
    });
    const updateArg = firstMockArg<{
      where: { id: string };
      data: { readAt: Date };
    }>(prisma.notification.update);
    expect(updateArg.where).toEqual({ id: 'notification-1' });
    expect(updateArg.data.readAt).toBeInstanceOf(Date);
    expect(result.readAt).toBe(createdAt.toISOString());
  });
});

function deadlineDaysFromNow(days: number) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  deadline.setHours(12, 0, 0, 0);
  return deadline;
}

function jobRecord(
  overrides: Partial<{
    status: JobStatus;
    deadlineType: DeadlineType;
    deadline: Date | null;
    labels: Array<{ labelId: string; label: { id: string; name: string } }>;
  }> = {},
) {
  return {
    id: 'job-1',
    title: '감사본부 수습 CPA',
    status: overrides.status ?? JobStatus.OPEN,
    deadlineType: overrides.deadlineType ?? DeadlineType.UNTIL_FILLED,
    deadline: overrides.deadline ?? null,
    company: { name: '테스트회계법인' },
    labels: overrides.labels ?? [],
  };
}

function firstMockArg<T>(mock: { mock: { calls: unknown[][] } }): T {
  return mock.mock.calls[0][0] as T;
}
