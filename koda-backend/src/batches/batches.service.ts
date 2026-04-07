import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AssignInternsDto } from './dto/assign-interns.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

type BatchRow = {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  max_interns: number;
  created_at: string | null;
  updated_at: string | null;
};

type InternRow = {
  id: string;
  user_id: string | null;
  team_id: string | null;
  created_at: string | null;
  users?: {
    id: string;
    name: string | null;
    email: string | null;
    github_username: string | null;
  } | null;
};

type BatchSummary = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  maxInterns: number;
  enrolledCount: number;
  availableSlots: number;
  isFull: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type BatchDetail = BatchSummary & {
  assignedInterns: Array<{
    id: string;
    assignedAt: string | null;
    userId: string | null;
    teamId: string | null;
    name: string | null;
    email: string | null;
    githubUsername: string | null;
  }>;
};

@Injectable()
export class BatchesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createBatchDto: CreateBatchDto): Promise<BatchDetail> {
    const payload = this.buildBatchPayload(createBatchDto);
    this.assertDateRange(payload.start_date, payload.end_date);

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('batches')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.getBatchDetail(data.id);
  }

  async findAll(search?: string): Promise<BatchSummary[]> {
    const supabase = this.supabaseService.getClient();
    let query = supabase.from('batches').select('*').order('created_at', {
      ascending: false,
    });

    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      query = query.or(
        `name.ilike.%${normalizedSearch}%,description.ilike.%${normalizedSearch}%`,
      );
    }

    const [batchesResult, enrollmentsResult] = await Promise.all([
      query,
      supabase.from('batch_interns').select('batch_id'),
    ]);

    if (batchesResult.error) {
      throw new BadRequestException(batchesResult.error.message);
    }

    if (enrollmentsResult.error) {
      throw new BadRequestException(enrollmentsResult.error.message);
    }

    const enrolledCounts = new Map<string, number>();
    for (const row of enrollmentsResult.data ?? []) {
      enrolledCounts.set(
        row.batch_id,
        (enrolledCounts.get(row.batch_id) ?? 0) + 1,
      );
    }

    return (batchesResult.data ?? []).map((batch) =>
      this.mapBatchSummary(batch, enrolledCounts.get(batch.id) ?? 0),
    );
  }

  async findOne(id: string): Promise<BatchDetail> {
    return this.getBatchDetail(id);
  }

  async update(
    id: string,
    updateBatchDto: UpdateBatchDto,
  ): Promise<BatchDetail> {
    const existingBatch = await this.getBatchRowOrThrow(id);
    const nextPayload = this.buildBatchPayload({
      name: updateBatchDto.name ?? existingBatch.name,
      description:
        updateBatchDto.description === undefined
          ? (existingBatch.description ?? undefined)
          : updateBatchDto.description,
      startDate: updateBatchDto.startDate ?? existingBatch.start_date,
      endDate: updateBatchDto.endDate ?? existingBatch.end_date,
      maxInterns: updateBatchDto.maxInterns ?? existingBatch.max_interns,
    });

    this.assertDateRange(nextPayload.start_date, nextPayload.end_date);

    const currentEnrollment = await this.getEnrolledCount(id);
    if (nextPayload.max_interns < currentEnrollment) {
      throw new BadRequestException(
        'Max interns cannot be lower than the current enrolled count.',
      );
    }

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('batches')
      .update({
        ...nextPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.getBatchDetail(data.id);
  }

  async assignInterns(
    id: string,
    assignInternsDto: AssignInternsDto,
  ): Promise<BatchDetail> {
    const internIds = Array.from(new Set(assignInternsDto.internIds));
    if (!internIds.length) {
      throw new BadRequestException('At least one intern ID is required.');
    }

    const batch = await this.getBatchRowOrThrow(id);
    const currentEnrollment = await this.getEnrolledCount(id);

    if (currentEnrollment + internIds.length > batch.max_interns) {
      throw new BadRequestException('Batch capacity would be exceeded.');
    }

    const supabase = this.supabaseService.getClient();
    const { data: interns, error: internsError } = await supabase
      .from('interns')
      .select(
        'id, user_id, team_id, created_at, users:user_id(id, name, email, github_username)',
      )
      .in('id', internIds)
      .order('created_at', { ascending: true });

    if (internsError) {
      throw new BadRequestException(internsError.message);
    }

    const foundInternIds = new Set((interns ?? []).map((intern) => intern.id));
    const missingInternIds = internIds.filter(
      (internId) => !foundInternIds.has(internId),
    );
    if (missingInternIds.length > 0) {
      throw new BadRequestException(
        `The following interns were not found: ${missingInternIds.join(', ')}`,
      );
    }

    const { data: existingAssignments, error: assignmentLookupError } =
      await supabase
        .from('batch_interns')
        .select('intern_id, batch_id')
        .in('intern_id', internIds);

    if (assignmentLookupError) {
      throw new BadRequestException(assignmentLookupError.message);
    }

    if ((existingAssignments ?? []).length > 0) {
      const alreadyAssigned = (existingAssignments ?? [])
        .filter((assignment) => assignment.batch_id !== id)
        .map((assignment) => assignment.intern_id);

      if (alreadyAssigned.length > 0) {
        throw new ConflictException(
          `These interns are already assigned to a batch: ${alreadyAssigned.join(', ')}`,
        );
      }

      throw new ConflictException(
        'One or more interns are already assigned to this batch.',
      );
    }

    const { error: insertError } = await supabase.from('batch_interns').insert(
      internIds.map((internId) => ({
        batch_id: id,
        intern_id: internId,
      })),
    );

    if (insertError) {
      throw new BadRequestException(insertError.message);
    }

    return this.getBatchDetail(id);
  }

  private async getBatchDetail(id: string): Promise<BatchDetail> {
    const batch = await this.getBatchRowOrThrow(id);
    const enrolledCount = await this.getEnrolledCount(id);
    const assignedInterns = await this.getAssignedInterns(id);

    return {
      ...this.mapBatchSummary(batch, enrolledCount),
      assignedInterns,
    };
  }

  private async getBatchRowOrThrow(id: string): Promise<BatchRow> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Batch not found.');
    }

    return data;
  }

  private async getEnrolledCount(batchId: string): Promise<number> {
    const supabase = this.supabaseService.getClient();
    const { count, error } = await supabase
      .from('batch_interns')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', batchId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return count ?? 0;
  }

  private async getAssignedInterns(
    batchId: string,
  ): Promise<BatchDetail['assignedInterns']> {
    const supabase = this.supabaseService.getClient();
    const { data: relations, error: relationsError } = await supabase
      .from('batch_interns')
      .select('batch_id, intern_id, assigned_at')
      .eq('batch_id', batchId)
      .order('assigned_at', { ascending: true });

    if (relationsError) {
      throw new BadRequestException(relationsError.message);
    }

    const internIds = (relations ?? []).map((relation) => relation.intern_id);
    if (internIds.length === 0) {
      return [];
    }

    const { data: interns, error: internsError } = await supabase
      .from('interns')
      .select(
        'id, user_id, team_id, users:user_id(id, name, email, github_username)',
      )
      .in('id', internIds);

    if (internsError) {
      throw new BadRequestException(internsError.message);
    }

    const internById = new Map(
      (interns ?? []).map((intern) => [intern.id, intern]),
    );

    return (relations ?? []).map((relation) => {
      const intern = internById.get(relation.intern_id) as
        | InternRow
        | undefined;

      return {
        id: relation.intern_id,
        assignedAt: relation.assigned_at,
        userId: intern?.user_id ?? null,
        teamId: intern?.team_id ?? null,
        name: intern?.users?.name ?? null,
        email: intern?.users?.email ?? null,
        githubUsername: intern?.users?.github_username ?? null,
      };
    });
  }

  private mapBatchSummary(
    batch: BatchRow,
    enrolledCount: number,
  ): BatchSummary {
    return {
      id: batch.id,
      name: batch.name,
      description: batch.description,
      startDate: batch.start_date,
      endDate: batch.end_date,
      maxInterns: batch.max_interns,
      enrolledCount,
      availableSlots: Math.max(batch.max_interns - enrolledCount, 0),
      isFull: enrolledCount >= batch.max_interns,
      createdAt: batch.created_at,
      updatedAt: batch.updated_at,
    };
  }

  private buildBatchPayload(input: CreateBatchDto | UpdateBatchDto) {
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException('Batch name is required.');
    }

    const description = input.description?.trim();
    const startDate = this.normalizeDate(input.startDate);
    const endDate = this.normalizeDate(input.endDate);
    const maxInterns = this.normalizePositiveInteger(
      input.maxInterns,
      'maxInterns',
    );

    return {
      name,
      description: description ?? null,
      start_date: startDate,
      end_date: endDate,
      max_interns: maxInterns,
    };
  }

  private normalizeDate(value: string | Date | undefined): string {
    if (!value) {
      throw new BadRequestException('startDate and endDate are required.');
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('One or more dates are invalid.');
    }

    return parsedDate.toISOString().slice(0, 10);
  }

  private normalizePositiveInteger(
    value: number | undefined,
    fieldName: string,
  ): number {
    if (value === undefined || value === null) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer.`);
    }

    return value;
  }

  private assertDateRange(startDate: string, endDate: string): void {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('startDate must be on or before endDate.');
    }
  }
}
