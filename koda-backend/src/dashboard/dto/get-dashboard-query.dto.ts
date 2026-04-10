import { IsOptional, IsUUID } from 'class-validator';

export class GetDashboardQueryDto {
  @IsOptional()
  @IsUUID('4')
  teamId?: string;
}
