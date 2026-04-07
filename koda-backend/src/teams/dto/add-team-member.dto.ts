import { Role } from '../../common/enums/role.enum';

export class AddTeamMemberDto {
  userId!: string;
  role!: Role;
}
