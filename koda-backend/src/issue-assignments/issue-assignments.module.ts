import { Module } from '@nestjs/common';
import { IssueAssignmentsController } from './issue-assignments.controller';
import { IssueAssignmentsService } from './issue-assignments.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [IssueAssignmentsController],
  providers: [IssueAssignmentsService],
  exports: [IssueAssignmentsService],
})
export class IssueAssignmentsModule {}
