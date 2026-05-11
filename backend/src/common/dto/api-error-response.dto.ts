import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorDetailDto {
  @ApiProperty({ example: 'fullName' })
  field: string;

  @ApiProperty({ example: 'fullName must match owner/repo format' })
  message: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'VALIDATION_ERROR' })
  errorCode: string;

  @ApiProperty({ example: 'Request validation failed' })
  message: string;

  @ApiProperty({ example: '/repos' })
  path: string;

  @ApiProperty({ example: '2026-04-15T12:00:00.000Z' })
  timestamp: string;

  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];
}
