import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IssuesService, Issue } from './issues.service';
import { IssueFilterDto } from './dto/issues.dto';

@Controller('issues')
@ApiTags('Issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  // NOTE: /recent MUST be declared before /:id
  // otherwise NestJS will treat "recent" as an :id param
  @Get('recent')
  @ApiOperation({ summary: 'Get recent issues' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecent(@Query('limit') limit?: string): Promise<Issue[]> {
    return this.issuesService.findRecent(limit ? parseInt(limit, 10) : 10);
  }

  @Get()
  @ApiOperation({ summary: 'List issues' })
  findAll(@Query() filter: IssueFilterDto): Promise<{
    data: Issue[];
    total: number | null;
    page: number;
    limit: number;
  }> {
    return this.issuesService.findAll(filter);
  }

  @Get('intern/:internId')
  @ApiOperation({ summary: 'List issues for an intern' })
  @ApiParam({ name: 'internId', type: String })
  findByInternId(
    @Param('internId') internId: string,
    @Query() filter: IssueFilterDto,
  ): Promise<Issue[]> {
    return this.issuesService.findByInternId(internId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an issue by id' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string): Promise<Issue | null> {
    return this.issuesService.findOne(id);
  }
}
