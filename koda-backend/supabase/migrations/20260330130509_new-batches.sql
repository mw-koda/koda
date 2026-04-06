create table batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  max_interns int not null check (max_interns > 0),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index batches_name_idx on batches (name);
create index batches_date_idx on batches (start_date, end_date);

create table batch_interns (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  intern_id uuid not null references interns(id) on delete cascade,
  assigned_at timestamp default now(),
  unique (intern_id)
);

create index batch_interns_batch_id_idx on batch_interns (batch_id);
create index batch_interns_intern_id_idx on batch_interns (intern_id);