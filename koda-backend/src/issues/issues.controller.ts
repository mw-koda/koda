import { Controller, Get, Param, Query } from '@nestjs/common';
import { IssuesService, Issue } from './issues.service';
import { IssueFilterDto } from './dto/issues.dto';

@Controller('issues')
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
