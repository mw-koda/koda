import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { UserRecord } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamsService, type TeamDashboardData } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Teams')
@ApiBearerAuth('bearer-auth')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  @ApiOperation({ summary: 'List the current user teams' })
  @ApiQuery({ name: 'batchId', required: false, type: String })
  findMine(
    @CurrentUser() user: UserRecord,
    @Query('batchId') batchId?: string,
  ) {
    return this.teamsService.findMine(user.id, user.role, batchId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  @ApiOperation({ summary: 'Create a team' })
  @ApiBody({ type: CreateTeamDto })
  create(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser() user: UserRecord,
  ) {
    return this.teamsService.create(createTeamDto, user.id, user.role);
  }

  @Post(':id/members')
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  @ApiOperation({ summary: 'Add a member to a team' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AddTeamMemberDto })
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
  @ApiOperation({ summary: 'Remove a member from a team' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'userId', type: String })
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: UserRecord,
  ) {
    return this.teamsService.removeMember(id, userId, user.id, user.role);
  }

  @Get(':id/dashboard')
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  @ApiOperation({ summary: 'Get team dashboard data' })
  @ApiParam({ name: 'id', type: String })
  getDashboard(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserRecord,
  ): Promise<TeamDashboardData> {
    return this.teamsService.getDashboard(id, user.id, user.role);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  @ApiOperation({ summary: 'Get a team by id' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserRecord,
  ) {
    return this.teamsService.findOne(id, user.id, user.role);
  }
}
