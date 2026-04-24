import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ example: 24 })
  totalInterns!: number;
  @ApiProperty({ example: 7 })
  pendingReports!: number;
  @ApiProperty({ example: 13 })
  openIssues!: number;
  @ApiProperty({ example: 89.5 })
  averageScore!: number;
}
