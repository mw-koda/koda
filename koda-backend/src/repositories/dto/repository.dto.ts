import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertRepositoryDto {
  @ApiProperty({ example: '12345678' })
  github_repo_id!: string;

  @ApiProperty({ example: 'octocat' })
  owner!: string;

  @ApiProperty({ example: 'koda' })
  name!: string;

  @ApiProperty({ example: 'https://github.com/octocat/koda' })
  url!: string;

  @ApiPropertyOptional({ example: '22222222-2222-2222-2222-222222222222', nullable: true })
  team_id?: string | null;
}
