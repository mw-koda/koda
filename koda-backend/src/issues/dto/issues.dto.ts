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

// 1. Extract the state into an Enum so the validator can use it
export enum IssueState {
  OPEN = 'open',
  CLOSED = 'closed',
  IN_PROGRESS = 'in_progress',
}

// ----------------------------------------------------

export class CreateIssueDto {
  @IsString()
  @IsNotEmpty()
  repo_id!: string;

  @IsString()
  @IsNotEmpty()
  github_issue_id!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(IssueState)
  @IsNotEmpty()
  state!: IssueState;

  @IsDateString()
  @IsNotEmpty()
  created_at!: string;

  @IsDateString()
  @IsNotEmpty()
  updated_at!: string;

  @IsOptional()
  @IsDateString()
  closed_at?: string | null;

  @IsOptional()
  @IsArray()
  labels?: Record<string, unknown>[];

  @IsObject()
  @IsNotEmpty()
  raw_payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  assignee_name?: string | null;

  @IsOptional()
  @IsUrl()
  assignee_avatar?: string | null;
}

// ----------------------------------------------------

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(IssueState)
  state?: IssueState;

  @IsOptional()
  @IsDateString()
  updated_at?: string;

  @IsOptional()
  @IsDateString()
  closed_at?: string | null;

  @IsOptional()
  @IsArray()
  labels?: Record<string, unknown>[];

  @IsOptional()
  @IsObject()
  raw_payload?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  assignee_name?: string | null;

  @IsOptional()
  @IsUrl()
  assignee_avatar?: string | null;
}

// ----------------------------------------------------

export class IssueFilterDto {
  @IsOptional()
  @IsString()
  repo_id?: string;

  @IsOptional()
  @IsEnum(IssueState)
  state?: IssueState;

  @IsOptional()
  @IsString()
  intern_id?: string;

  @IsOptional()
  @IsDateString()
  period_start?: string;

  @IsOptional()
  @IsDateString()
  period_end?: string;

  // @Type is crucial here. Query parameters come in as strings (e.g., "?page=1").
  // This tells NestJS to transform the string "1" into the number 1 before validating.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
