import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetDashboardQueryDto {
  @ApiPropertyOptional({ example: '11111111-1111-1111-1111-111111111111' })
  @IsOptional()
  @IsUUID('4')
  teamId?: string;
}
