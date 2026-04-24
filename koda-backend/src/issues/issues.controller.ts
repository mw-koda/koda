import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { IssuesService, Issue } from './issues.service';
import { IssueFilterDto } from './dto/issues.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserRecord } from '../auth/auth.service';

@Controller('issues')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('recent')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.TEAM_LEAD, Role.INTERN)
  async findRecent(@Query('limit') limit: string): Promise<Issue[]> {
    // NOTE: /recent MUST be declared before /:id
    return this.issuesService.findRecent(limit ? parseInt(limit, 10) : 10);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.TEAM_LEAD, Role.INTERN)
  async findAll(
    @Query() filter: IssueFilterDto,
    @CurrentUser() user: UserRecord,
  ): Promise<{
    data: Issue[];
    total: number | null;
    page: number;
    limit: number;
  }> {
    // If the user is an intern, they can only see their own issues
    if (user.role === Role.INTERN) {
      if (!user.intern_id) {
        return {
          data: [],
          total: 0,
          page: filter.page || 1,
          limit: filter.limit || 20,
        };
      }
      filter.intern_id = user.intern_id;
    }

    return this.issuesService.findAll(filter);
  }

  @Get('intern/:internId')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.TEAM_LEAD, Role.INTERN)
  async findByInternId(
    @Param('internId') internId: string,
    @Query() filter: IssueFilterDto,
    @CurrentUser() user: UserRecord,
  ): Promise<Issue[]> {
    if (user.role === Role.INTERN && user.intern_id !== internId) {
      throw new ForbiddenException('You can only view your own issues.');
    }
    return this.issuesService.findByInternId(internId, filter);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.TEAM_LEAD)
  findOne(@Param('id') id: string): Promise<Issue | null> {
    return this.issuesService.findOne(id);
  }
}
