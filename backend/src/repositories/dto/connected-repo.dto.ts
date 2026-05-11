import { ApiProperty } from '@nestjs/swagger';

export class ConnectedRepositoryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'swiftlang/swift' })
  fullName: string;

  @ApiProperty({ example: 'swiftlang' })
  owner: string;

  @ApiProperty({ example: 'swift' })
  name: string;

  @ApiProperty({ example: false })
  isPrivate: boolean;

  @ApiProperty({ example: 'main', required: false })
  defaultBranch?: string;

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z', required: false })
  lastSyncedAt?: string;
}

export class ConnectedRepositoryListResponseDto {
  @ApiProperty({ type: [ConnectedRepositoryDto] })
  items: ConnectedRepositoryDto[];

  @ApiProperty({ example: 2 })
  total: number;
}
