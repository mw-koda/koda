import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { IssuesModule } from '../issues/issues.module';
import { IssueAssignmentsModule } from '../issue-assignments/issue-assignments.module';

@Module({
  imports: [RepositoriesModule, IssuesModule, IssueAssignmentsModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
