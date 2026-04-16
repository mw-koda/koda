import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { UserRecord } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  findMine(@CurrentUser() user: UserRecord) {
    return this.teamsService.findMine(user.id, user.role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  create(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser() user: UserRecord,
  ) {
    return this.teamsService.create(createTeamDto, user.id, user.role);
  }

  @Post(':id/members')
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addTeamMemberDto: AddTeamMemberDto,
    @CurrentUser() user: UserRecord,
  ) {
    return this.teamsService.addMember(
      id,
      addTeamMemberDto,
      user.id,
      user.role,
    );
  }

  @Delete(':id/members/:userId')
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: UserRecord,
  ) {
    return this.teamsService.removeMember(id, userId, user.id, user.role);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserRecord,
  ) {
    return this.teamsService.findOne(id, user.id, user.role);
  }
}
