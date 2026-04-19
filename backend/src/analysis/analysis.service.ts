import { Injectable } from '@nestjs/common';
import { WorkItem } from '@prisma/client';
import OpenAI from 'openai';
import {
  PRIORITY_LEVELS,
  PriorityLevelValue,
} from '../common/domain.constants';
import { PrismaService } from '../prisma.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { jaccardSimilarity } from './utils/text-similarity';

type LabelRecommendation = {
  label: string;
  reason: string;
  score: number;
};

type LlmPriorityResult = {
  priority: PriorityLevelValue;
  reason: string;
  recommendations: LabelRecommendation[];
};

class UnionFind {
  private parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, idx) => idx);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) {
      this.parent[rb] = ra;
    }
  }
}

@Injectable()
export class AnalysisService {
  private readonly similarityThreshold = 0.55;
  private readonly openai: OpenAI | null;
  private readonly priorityRank: Record<string, number> = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly repositoriesService: RepositoriesService,
  ) {
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  private heuristicFallback(item: WorkItem): LlmPriorityResult {
    const text = `${item.title} ${item.body ?? ''}`.toLowerCase();

    let priority: PriorityLevelValue = PRIORITY_LEVELS[1];
    let reason = 'Default prototype heuristic score.';
    const recs: LabelRecommendation[] = [];

    if (text.includes('crash') || text.includes('security') || text.includes('critical')) {
      priority = PRIORITY_LEVELS[2];
      reason = 'Crash/security keyword detected.';
      recs.push({ label: 'bug', reason: 'Crash/security signal', score: 0.9 });
      recs.push({ label: 'priority/high', reason: 'High-risk signal', score: 0.8 });
    } else if (text.includes('typo') || text.includes('docs') || text.includes('documentation')) {
      priority = PRIORITY_LEVELS[0];
      reason = 'Documentation/typo keyword detected.';
      recs.push({ label: 'documentation', reason: 'Doc-related change', score: 0.85 });
    } else {
      recs.push({ label: 'feature', reason: 'General improvement request', score: 0.55 });
    }

    return {
      priority,
      reason,
      recommendations: recs,
    };
  }

  private extractFirstJsonObject(text: string): string | null {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }
    return text.slice(start, end + 1);
  }

  private async classifyPriorityWithLlm(item: WorkItem): Promise<LlmPriorityResult> {
    if (!this.openai) {
      return this.heuristicFallback(item);
    }

    const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

    const prompt = [
      'You are a GitHub triage assistant.',
      'Classify issue/PR priority and suggest labels.',
      'Return strict JSON only with this schema:',
      '{"priority":"LOW|MEDIUM|HIGH","reason":"string","recommendations":[{"label":"string","reason":"string","score":0.0}]}.',
      `Title: ${item.title}`,
      `Body: ${item.body ?? ''}`,
      `Type: ${item.type}`,
      `State: ${item.state}`,
    ].join('\n');

    const response = await this.openai.responses.create({
      model,
      input: prompt,
      temperature: 0.1,
    });

    const rawText = response.output_text ?? '';
    const jsonText = this.extractFirstJsonObject(rawText);
    if (!jsonText) {
      return this.heuristicFallback(item);
    }

    try {
      const parsed = JSON.parse(jsonText) as {
        priority?: string;
        reason?: string;
        recommendations?: Array<{ label?: string; reason?: string; score?: number }>;
      };

      const priority = PRIORITY_LEVELS.includes(parsed.priority as PriorityLevelValue)
        ? (parsed.priority as PriorityLevelValue)
        : PRIORITY_LEVELS[1];

      const recommendations = Array.isArray(parsed.recommendations)
        ? parsed.recommendations
            .filter((rec) => rec.label && rec.reason)
            .map((rec) => ({
              label: String(rec.label),
              reason: String(rec.reason),
              score: typeof rec.score === 'number' ? rec.score : 0.5,
            }))
        : [];

      return {
        priority,
        reason: parsed.reason ? String(parsed.reason) : 'LLM response parsed without reason.',
        recommendations,
      };
    } catch {
      return this.heuristicFallback(item);
    }
  }

  async analyzeRepository(userId: number, repositoryId: number) {
    await this.repositoriesService.getOwnedRepositoryOrThrow(userId, repositoryId);

    const items = await this.prisma.workItem.findMany({
      where: { repositoryId },
      orderBy: { updatedAtOnGitHub: 'desc' },
    });

    await this.prisma.duplicateGroup.deleteMany({ where: { repositoryId } });

    if (items.length === 0) {
      return {
        repositoryId,
        analyzedItems: 0,
        duplicateGroups: 0,
        llmUsed: this.openai !== null,
        analyzedAt: new Date(),
      };
    }

    const uf = new UnionFind(items.length);
    const pairSimilarity = new Map<string, number>();

    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const leftText = `${items[i].title} ${items[i].body ?? ''}`;
        const rightText = `${items[j].title} ${items[j].body ?? ''}`;
        const similarity = jaccardSimilarity(leftText, rightText);

        if (similarity >= this.similarityThreshold) {
          uf.union(i, j);
          pairSimilarity.set(`${i}:${j}`, similarity);
        }
      }
    }

    const groups = new Map<number, number[]>();
    for (let i = 0; i < items.length; i += 1) {
      const root = uf.find(i);
      const existing = groups.get(root) ?? [];
      existing.push(i);
      groups.set(root, existing);
    }

    let duplicateGroupCount = 0;
    for (const [, indices] of groups) {
      if (indices.length < 2) {
        continue;
      }

      const sortedItemIds = indices
        .map((idx) => items[idx].id)
        .sort((a, b) => a - b);

      let maxSimilarity = this.similarityThreshold;
      for (let x = 0; x < indices.length; x += 1) {
        for (let y = x + 1; y < indices.length; y += 1) {
          const i = Math.min(indices[x], indices[y]);
          const j = Math.max(indices[x], indices[y]);
          const key = `${i}:${j}`;
          const s = pairSimilarity.get(key) ?? this.similarityThreshold;
          if (s > maxSimilarity) maxSimilarity = s;
        }
      }

      const group = await this.prisma.duplicateGroup.create({
        data: {
          repositoryId,
          groupKey: sortedItemIds.join('-'),
          similarity: maxSimilarity,
        },
      });

      duplicateGroupCount += 1;

      for (const idx of indices) {
        await this.prisma.duplicateGroupItem.create({
          data: {
            groupId: group.id,
            workItemId: items[idx].id,
          },
        });
      }
    }

    for (const item of items) {
      const classified = await this.classifyPriorityWithLlm(item);

      await this.prisma.analysisResult.upsert({
        where: { workItemId: item.id },
        update: {
          repositoryId,
          priority: classified.priority,
          priorityReason: classified.reason,
          labelRecommendations: JSON.stringify(classified.recommendations),
          analyzedAt: new Date(),
        },
        create: {
          repositoryId,
          workItemId: item.id,
          priority: classified.priority,
          priorityReason: classified.reason,
          labelRecommendations: JSON.stringify(classified.recommendations),
          analyzedAt: new Date(),
        },
      });
    }

    return {
      repositoryId,
      analyzedItems: items.length,
      duplicateGroups: duplicateGroupCount,
      llmUsed: this.openai !== null,
      analyzedAt: new Date(),
    };
  }

  async getDuplicateGroups(userId: number, repositoryId: number) {
    await this.repositoriesService.getOwnedRepositoryOrThrow(userId, repositoryId);

    return this.prisma.duplicateGroup.findMany({
      where: { repositoryId },
      orderBy: [{ similarity: 'desc' }, { createdAt: 'desc' }],
      include: {
        items: {
          include: {
            workItem: true,
          },
        },
      },
    });
  }

  async getPriorities(userId: number, repositoryId: number) {
    await this.repositoriesService.getOwnedRepositoryOrThrow(userId, repositoryId);

    const results = await this.prisma.analysisResult.findMany({
      where: { repositoryId },
      include: { workItem: true },
      orderBy: { analyzedAt: 'desc' },
    });

    return results.sort((left, right) => {
      const rankDiff =
        (this.priorityRank[right.priority] ?? 0) - (this.priorityRank[left.priority] ?? 0);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return right.analyzedAt.getTime() - left.analyzedAt.getTime();
    });
  }

  async getLabelRecommendations(userId: number, repositoryId: number) {
    const prioritized = await this.getPriorities(userId, repositoryId);
    return prioritized.map((result) => ({
      itemId: result.workItem.id,
      title: result.workItem.title,
      recommendations: this.parseRecommendations(result.labelRecommendations),
    }));
  }

  private parseRecommendations(raw: string | null): LabelRecommendation[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const obj = item as Record<string, unknown>;
          return {
            label: String(obj.label ?? ''),
            reason: String(obj.reason ?? ''),
            score: typeof obj.score === 'number' ? obj.score : 0.5,
          };
        })
        .filter((item) => item.label.length > 0 && item.reason.length > 0);
    } catch {
      return [];
    }
  }
}
