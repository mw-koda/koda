import { Module } from '@nestjs/common';
import { InternsService } from './interns.service';
import { InternsController } from './interns.controller';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [IssuesModule],
  controllers: [InternsController],
  providers: [InternsService],
  exports: [InternsService],
})
export class InternsModule {}
