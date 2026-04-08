import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DefaultAdminSeeder } from './auth/default-admin.seeder';
import { AuthModule } from './auth/auth.module';
import { BatchesModule } from './batches/batches.module';
import { PerformanceModule } from './performance/performance.module';
import { SupabaseModule } from './supabase/supabase.module';
import { IssuesModule } from './issues/issues.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SupabaseModule,
    BatchesModule,
    IssuesModule,
    SupabaseModule,
    BatchesModule,
    PerformanceModule,
    TeamsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DefaultAdminSeeder],
})
export class AppModule {}
