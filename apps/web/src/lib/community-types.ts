import {
  COMMUNITY_BOARD_TYPES,
  type CommunityAnswerItem,
  type CommunityBoardType,
  type CommunityPostItem,
  type CommunityPostStatus,
} from "@cpa/shared";

export type BoardType = CommunityBoardType;
export type PostStatus = CommunityPostStatus;
export type SortOrder = "latest" | "popular";
export type CommunityPost = CommunityPostItem;
export type CommunityAnswer = CommunityAnswerItem;

export interface CreatePostInput {
  boardType: BoardType;
  title: string;
  content: string;
  tags: string[];
  isAnonymous: boolean;
}

export interface CreateAnswerInput {
  postId: string;
  content: string;
  isAnonymous: boolean;
}

export const BOARD_TYPES = COMMUNITY_BOARD_TYPES;

export const boardTypeLabels: Record<BoardType, string> = {
  CPA_PREP: "CPA 수험생 Q&A",
  TRAINEE: "수습 CPA 방",
  SENIOR: "선배 회계사 Q&A",
  FREE: "자유게시판",
};

export const boardTags: Record<BoardType, string[]> = {
  CPA_PREP: [
    "#1차시험",
    "#2차시험",
    "#실무수습",
    "#Big4",
    "#인턴",
    "#공부전략",
    "#회계학",
    "#세법",
    "#시간관리",
    "#선택과목",
  ],
  TRAINEE: ["#수습생활", "#배치", "#감사업무", "#야근", "#법인문화"],
  SENIOR: ["#이직", "#연봉", "#FAS", "#Deal", "#인하우스", "#커리어패스"],
  FREE: ["#잡담", "#후기", "#정보공유", "#회계사생활"],
};

export const popularTags = [
  "#1차시험",
  "#2차시험",
  "#실무수습",
  "#Big4",
  "#인턴",
  "#공부전략",
  "#회계학",
  "#세법",
  "#시간관리",
  "#선택과목",
];
