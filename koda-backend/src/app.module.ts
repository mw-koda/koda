import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BatchesModule } from './batches/batches.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InternsModule } from './interns/interns.module';
import { ReportsModule } from './reports/reports.module';
import { SupabaseModule } from './supabase/supabase.module';
import { WebhookModule } from './webhook/webhook.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    SupabaseModule,
    AuthModule,
    BatchesModule,
    DashboardModule,
    InternsModule,
    ReportsModule,
    WebhookModule,
    TeamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
