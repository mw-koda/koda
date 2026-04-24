import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  IssueAssignmentsService,
  IssueAssignment,
  IssueAssignmentWithRelations,
} from './issue-assignments.service';
import { ManualAssignDto } from './dto/issue-assignments.dto';

@Controller('issues/:issueId/assignments')
@ApiTags('Issue Assignments')
export class IssueAssignmentsController {
  constructor(private readonly assignmentsService: IssueAssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List assignments for an issue' })
  @ApiParam({ name: 'issueId', type: String })
  findByIssue(
    @Param('issueId') issueId: string,
  ): Promise<IssueAssignmentWithRelations[]> {
    return this.assignmentsService.findByIssueId(issueId);
  }

  @Post()
  @ApiOperation({ summary: 'Manually assign an issue' })
  @ApiParam({ name: 'issueId', type: String })
  @ApiBody({ type: ManualAssignDto })
  manualAssign(
    @Param('issueId') issueId: string,
    @Body() dto: ManualAssignDto,
  ): Promise<IssueAssignment> {
    return this.assignmentsService.manualAssign(issueId, dto);
  }

  @Delete(':assignmentId')
  @ApiOperation({ summary: 'Remove an issue assignment' })
  @ApiParam({ name: 'issueId', type: String })
  @ApiParam({ name: 'assignmentId', type: String })
  remove(
    @Param('assignmentId') assignmentId: string,
  ): Promise<{ removed: boolean }> {
    return this.assignmentsService.removeAssignment(assignmentId);
  }
}
