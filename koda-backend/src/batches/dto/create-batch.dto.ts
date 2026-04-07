export class CreateBatchDto {
  name!: string;
  description?: string;
  startDate!: string | Date;
  endDate!: string | Date;
  maxInterns!: number;
}
