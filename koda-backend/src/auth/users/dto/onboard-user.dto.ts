import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class OnboardUserDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  githubUsername!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}