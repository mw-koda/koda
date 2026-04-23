import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import {
  IssueAssignmentsService,
  IssueAssignment,
  IssueAssignmentWithRelations,
} from './issue-assignments.service';
import { ManualAssignDto } from './dto/issue-assignments.dto';

@Controller('issues/:issueId/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEAM_LEAD)
export class IssueAssignmentsController {
  constructor(private readonly assignmentsService: IssueAssignmentsService) {}

  @Get()
  findByIssue(
    @Param('issueId') issueId: string,
  ): Promise<IssueAssignmentWithRelations[]> {
    return this.assignmentsService.findByIssueId(issueId);
  }

  @Post()
  manualAssign(
    @Param('issueId') issueId: string,
    @Body() dto: ManualAssignDto,
  ): Promise<IssueAssignment> {
    return this.assignmentsService.manualAssign(issueId, dto);
  }

  @Delete(':assignmentId')
  remove(
    @Param('assignmentId') assignmentId: string,
  ): Promise<{ removed: boolean }> {
    return this.assignmentsService.removeAssignment(assignmentId);
  }
}
