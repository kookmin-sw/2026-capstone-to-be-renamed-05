import { ApiProperty } from '@nestjs/swagger';

class DuplicateItemDto {
  @ApiProperty({ example: 102 })
  itemId: number;

  @ApiProperty({ example: 88428 })
  number: number;

  @ApiProperty({ example: 'PULL_REQUEST' })
  type: string;

  @ApiProperty({ example: 'Fix crash when parsing source file' })
  title: string;

  @ApiProperty({ example: 'https://github.com/swiftlang/swift/pull/88428' })
  url: string;
}

class DuplicateGroupDto {
  @ApiProperty({ example: 1 })
  groupId: number;

  @ApiProperty({ example: 0.66 })
  similarity: number;

  @ApiProperty({ type: [DuplicateItemDto] })
  items: DuplicateItemDto[];
}

export class DuplicateGroupsResponseDto {
  @ApiProperty({ type: [DuplicateGroupDto] })
  groups: DuplicateGroupDto[];

  @ApiProperty({ example: 6 })
  totalGroups: number;
}
