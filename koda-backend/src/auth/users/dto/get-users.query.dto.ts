import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class GetUsersQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const normalized = value.trim();
    return normalized.length === 0 ? undefined : normalized;
  })
  search?: string;
}
