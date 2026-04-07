import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BatchesModule } from './batches/batches.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { IssuesModule } from './issues/issues.module';
import { IssueAssignmentsModule } from './issue-assignments/issue-assignments.module';
import { UsersModule } from './auth/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    IssuesModule,
    IssueAssignmentsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
