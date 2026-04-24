import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({ example: 'octocat' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  githubUsername?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @ApiPropertyOptional({ enum: ['active', 'pending', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'pending', 'inactive'])
  status?: 'active' | 'pending' | 'inactive';
}
