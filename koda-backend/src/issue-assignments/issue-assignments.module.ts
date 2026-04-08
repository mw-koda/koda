import { Module } from '@nestjs/common';
import { IssueAssignmentsController } from './issue-assignments.controller';
import { IssueAssignmentsService } from './issue-assignments.service';

@Module({
  controllers: [IssueAssignmentsController],
  providers: [IssueAssignmentsService],
})
export class IssueAssignmentsModule {}
