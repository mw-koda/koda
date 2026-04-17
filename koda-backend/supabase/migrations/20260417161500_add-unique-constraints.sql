-- Add unique constraints required for upsert operations
ALTER TABLE repositories ADD CONSTRAINT repositories_github_repo_id_key UNIQUE (github_repo_id);
ALTER TABLE issues ADD CONSTRAINT issues_github_issue_id_key UNIQUE (github_issue_id);
ALTER TABLE issue_assignments ADD CONSTRAINT issue_assignments_issue_id_intern_id_key UNIQUE (issue_id, intern_id);
ALTER TABLE users ADD CONSTRAINT users_github_id_key UNIQUE (github_id);
