import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class AddTeamMemberDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role!: Role;
}
