import { ApiProperty } from '@nestjs/swagger';

export class PerformanceTrendDto {
  @ApiProperty({ example: '2026-W16' })
  week!: string;
  @ApiProperty({ example: 84.2 })
  averageScore!: number;
}
