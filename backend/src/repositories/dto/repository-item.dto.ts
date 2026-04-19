import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  WORK_ITEM_STATES,
  WORK_ITEM_TYPES,
  WorkItemStateValue,
  WorkItemTypeValue,
} from '../../common/domain.constants';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class RepositoryItemsQueryDto {
  @ApiPropertyOptional({ enum: WORK_ITEM_TYPES })
  @IsOptional()
  @IsIn(WORK_ITEM_TYPES)
  type?: WorkItemTypeValue;

  @ApiPropertyOptional({ enum: WORK_ITEM_STATES })
  @IsOptional()
  @IsIn(WORK_ITEM_STATES)
  state?: WorkItemStateValue;

  @ApiPropertyOptional({
    example: 50,
    minimum: 1,
    maximum: 200,
    description: '한 번에 반환할 item 개수 (기본값 50)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({
    example: 0,
    minimum: 0,
    description: '조회 시작 오프셋 (기본값 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class RepositoryItemDto {
  @ApiProperty({ example: 101 })
  id: number;

  @ApiProperty({ example: 88428 })
  number: number;

  @ApiProperty({ enum: WORK_ITEM_TYPES, example: 'PULL_REQUEST' })
  type: WorkItemTypeValue;

  @ApiProperty({ enum: WORK_ITEM_STATES, example: 'OPEN' })
  state: WorkItemStateValue;

  @ApiProperty({ example: 'Fix crash in parser' })
  title: string;

  @ApiProperty({ example: 'https://github.com/swiftlang/swift/pull/88428' })
  url: string;

  @ApiPropertyOptional({ type: [String], example: ['bug', 'priority/high'] })
  labels?: string[];

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z' })
  updatedAtOnGitHub: string;
}

export class RepositoryItemListResponseDto {
  @ApiProperty({ type: [RepositoryItemDto] })
  items: RepositoryItemDto[];

  @ApiProperty({ example: 84, description: '필터 조건에 맞는 전체 item 개수' })
  total: number;

  @ApiProperty({ example: 50, description: '현재 응답에 적용된 limit 값' })
  limit: number;

  @ApiProperty({ example: 0, description: '현재 응답에 적용된 offset 값' })
  offset: number;
}
