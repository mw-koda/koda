import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AttendanceModule } from './attendance/attendance.module';
import { BatchesModule } from './batches/batches.module';
import { DashboardModule } from './dashboard/dashboard.module';
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
    AttendanceModule,
    BatchesModule,
    DashboardModule,
    WebhookModule,
    TeamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
