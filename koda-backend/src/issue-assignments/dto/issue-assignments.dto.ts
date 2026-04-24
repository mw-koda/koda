import { ApiProperty } from '@nestjs/swagger';

export class ManualAssignDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  intern_id!: string;
}

export class AutoLinkDto {
  @ApiProperty({ example: '123456789' })
  github_issue_id!: string;

  @ApiProperty({ example: 'octocat' })
  github_username!: string;
}
