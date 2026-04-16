import { IsEnum, IsUUID } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class AddTeamMemberDto {
  @IsUUID()
  userId!: string;

  @IsEnum(Role)
  role!: Role;
}
