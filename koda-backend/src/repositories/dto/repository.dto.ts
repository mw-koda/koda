export class UpsertRepositoryDto {
  github_repo_id!: string;
  owner!: string;
  name!: string;
  url!: string;
  team_id?: string | null;
}
