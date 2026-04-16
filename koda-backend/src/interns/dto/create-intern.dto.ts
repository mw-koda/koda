import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateInternDto {
  @IsUUID()
  user_id: string;

  @IsUUID()
  team_id: string;

  @IsOptional()
  @IsString()
  name?: string;
}
