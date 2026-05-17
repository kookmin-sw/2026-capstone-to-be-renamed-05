const OPENAI_REASONING_EFFORTS = ['low', 'medium', 'high'] as const;

export type OpenAiReasoningEffort = (typeof OPENAI_REASONING_EFFORTS)[number];

export const DEFAULT_OPENAI_MODEL = 'gpt-5.5';
export const DEFAULT_OPENAI_REASONING_EFFORT: OpenAiReasoningEffort = 'low';

export function resolveOpenAIModel(
  ...values: Array<string | null | undefined>
) {
  return firstNonEmpty(values) ?? DEFAULT_OPENAI_MODEL;
}

export function resolveOpenAIReasoningEffort(
  ...values: Array<string | null | undefined>
): OpenAiReasoningEffort {
  const value = firstNonEmpty(values)?.toLowerCase();
  if (isOpenAIReasoningEffort(value)) return value;
  return DEFAULT_OPENAI_REASONING_EFFORT;
}

export function usesOpenAIReasoning(model: string) {
  const normalized = model.trim().toLowerCase();
  return normalized.startsWith('gpt-5') || /^o\d/.test(normalized);
}

function firstNonEmpty(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean);
}

function isOpenAIReasoningEffort(
  value: string | undefined,
): value is OpenAiReasoningEffort {
  return OPENAI_REASONING_EFFORTS.includes(value as OpenAiReasoningEffort);
}
