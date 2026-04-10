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

  @Post()
  @Roles(Role.COORDINATOR, Role.TEAM_LEAD)
  create(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser() user: UserRecord,
  ) {
    return this.teamsService.create(createTeamDto, user.id);
  }

  @Post(':id/members')
  @Roles(Role.COORDINATOR, Role.TEAM_LEAD)
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addTeamMemberDto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(id, addTeamMemberDto);
  }

  @Delete(':id/members/:userId')
  @Roles(Role.COORDINATOR, Role.TEAM_LEAD)
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.teamsService.removeMember(id, userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.findOne(id);
  }
}
