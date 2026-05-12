import {
  createCommunityAnswer,
  createCommunityPost,
  fetchCommunityPost,
  fetchCommunityPosts,
  likeCommunityAnswer,
  likeCommunityPost,
  resolveCommunityPost,
} from "./api";
import type {
  BoardType,
  CommunityAnswer,
  CommunityPost,
  CreateAnswerInput,
  CreatePostInput,
  SortOrder,
} from "./community-types";

export async function getPosts(options: {
  board?: BoardType;
  search?: string;
  sort?: SortOrder;
  mine?: boolean;
}): Promise<CommunityPost[]> {
  const data = await fetchCommunityPosts(options);
  return data.items;
}

export async function getPost(id: string): Promise<CommunityPost | undefined> {
  if (!id) return undefined;
  const data = await fetchCommunityPost(id);
  return data.post;
}

export async function getPostDetail(id: string) {
  return fetchCommunityPost(id);
}

export async function getAnswers(postId: string): Promise<CommunityAnswer[]> {
  if (!postId) return [];
  const data = await fetchCommunityPost(postId);
  return data.answers;
}

export async function createPost(
  input: CreatePostInput,
): Promise<CommunityPost> {
  return createCommunityPost(input);
}

export async function createAnswer(
  input: CreateAnswerInput,
): Promise<CommunityAnswer> {
  return createCommunityAnswer(input.postId, {
    content: input.content,
    isAnonymous: input.isAnonymous,
  });
}

export async function resolvePost(postId: string, answerId: string) {
  return resolveCommunityPost(postId, answerId);
}

export async function likePost(postId: string): Promise<CommunityPost> {
  return likeCommunityPost(postId);
}

export async function likeAnswer(answerId: string): Promise<CommunityAnswer> {
  return likeCommunityAnswer(answerId);
}

export async function getTrendingPosts(): Promise<CommunityPost[]> {
  const data = await fetchCommunityPosts({ sort: "popular" });
  return data.items.slice(0, 5);
}
