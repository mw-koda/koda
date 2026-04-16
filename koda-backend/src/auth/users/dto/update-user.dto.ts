import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;
  
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  githubUsername?: string;

  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @IsOptional()
  @IsIn(['active', 'pending', 'inactive'])
  status?: 'active' | 'pending' | 'inactive';
}
