import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpsertRepositoryDto } from './dto/repository.dto';
import { Repository } from './repository.entity';

@Injectable()
export class RepositoriesService {
  constructor(private readonly supabase: SupabaseService) {}

  private get client() {
    return this.supabase.getClient();
  }

  async upsertFromWebhook(dto: UpsertRepositoryDto): Promise<Repository> {
    const { data, error } = await this.client
      .from('repositories')
      .upsert(dto, { onConflict: 'github_repo_id' })
      .select()
      .single<Repository>();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(): Promise<Repository[]> {
    const { data, error } = await this.client
      .from('repositories')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<Repository[]>();

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findOne(id: string): Promise<Repository | null> {
    const { data, error } = await this.client
      .from('repositories')
      .select('*')
      .eq('id', id)
      .single<Repository>();

    if (error) throw new Error(error.message);
    return data;
  }
}
