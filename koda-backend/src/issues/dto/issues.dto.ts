import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsObject,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 1. Extract the state into an Enum so the validator can use it
export enum IssueState {
  OPEN = 'open',
  CLOSED = 'closed',
  IN_PROGRESS = 'in_progress',
}

// ----------------------------------------------------

export class CreateIssueDto {
  @ApiProperty({ example: 'repository-uuid' })
  @IsString()
  @IsNotEmpty()
  repo_id!: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  github_issue_id!: string;

  @ApiProperty({ example: 'Fix login redirect' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ enum: IssueState })
  @IsEnum(IssueState)
  @IsNotEmpty()
  state!: IssueState;

  @ApiProperty({ example: '2026-04-23T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  created_at!: string;

  @ApiProperty({ example: '2026-04-23T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  updated_at!: string;

  @ApiPropertyOptional({ example: '2026-04-23T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  closed_at?: string | null;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  labels?: Record<string, unknown>[];

  @ApiProperty({ type: Object })
  @IsObject()
  @IsNotEmpty()
  raw_payload!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'octocat' })
  @IsOptional()
  @IsString()
  assignee_name?: string | null;

  @ApiPropertyOptional({ example: 'https://avatars.githubusercontent.com/u/1?v=4' })
  @IsOptional()
  @IsUrl()
  assignee_avatar?: string | null;
}

// ----------------------------------------------------

export class UpdateIssueDto {
  @ApiPropertyOptional({ example: 'Fix login redirect' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: IssueState })
  @IsOptional()
  @IsEnum(IssueState)
  state?: IssueState;

  @ApiPropertyOptional({ example: '2026-04-23T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  updated_at?: string;

  @ApiPropertyOptional({ example: '2026-04-23T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  closed_at?: string | null;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  labels?: Record<string, unknown>[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  raw_payload?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'octocat' })
  @IsOptional()
  @IsString()
  assignee_name?: string | null;

  @ApiPropertyOptional({ example: 'https://avatars.githubusercontent.com/u/1?v=4' })
  @IsOptional()
  @IsUrl()
  assignee_avatar?: string | null;
}

// ----------------------------------------------------

export class IssueFilterDto {
  @ApiPropertyOptional({ example: 'repository-uuid' })
  @IsOptional()
  @IsString()
  repo_id?: string;

  @ApiPropertyOptional({ enum: IssueState })
  @IsOptional()
  @IsEnum(IssueState)
  state?: IssueState;

  @ApiPropertyOptional({ example: 'intern-uuid' })
  @IsOptional()
  @IsString()
  intern_id?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  period_start?: string;

  @ApiPropertyOptional({ example: '2026-01-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  period_end?: string;

  // @Type is crucial here. Query parameters come in as strings (e.g., "?page=1").
  // This tells NestJS to transform the string "1" into the number 1 before validating.
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
