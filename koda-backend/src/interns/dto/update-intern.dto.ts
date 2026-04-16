import { IsOptional, IsUUID, IsString } from 'class-validator';

export class UpdateInternDto {
  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
