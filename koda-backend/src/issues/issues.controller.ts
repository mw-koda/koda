import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { IssuesService, Issue } from './issues.service';
import { IssueFilterDto } from './dto/issues.dto';

@Controller('issues')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEAM_LEAD)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  // NOTE: /recent MUST be declared before /:id
  // otherwise NestJS will treat "recent" as an :id param
  @Get('recent')
  getRecent(@Query('limit') limit?: string): Promise<Issue[]> {
    return this.issuesService.findRecent(limit ? parseInt(limit, 10) : 10);
  }

  @Get()
  findAll(@Query() filter: IssueFilterDto): Promise<{
    data: Issue[];
    total: number | null;
    page: number;
    limit: number;
  }> {
    return this.issuesService.findAll(filter);
  }

  @Get('intern/:internId')
  findByInternId(
    @Param('internId') internId: string,
    @Query() filter: IssueFilterDto,
  ): Promise<Issue[]> {
    return this.issuesService.findByInternId(internId, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Issue | null> {
    return this.issuesService.findOne(id);
  }
}
