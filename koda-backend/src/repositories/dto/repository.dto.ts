export class UpsertRepositoryDto {
  github_repo_id!: string;
  owner!: string;
  name!: string;
  full_name!: string;
  html_url!: string;
  url!: string;
  team_id?: string | null;
}
