import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RepositoriesService } from '../repositories/repositories.service';
import { IssuesService } from '../issues/issues.service';
import { IssueAssignmentsService } from '../issue-assignments/issue-assignments.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly repositoriesService: RepositoriesService,
    private readonly issuesService: IssuesService,
    private readonly issueAssignmentsService: IssueAssignmentsService,
  ) {}

  // ─── HMAC Validation ────────────────────────────────────────────────────────

  validateSignature(rawBody: Buffer, signature: string): void {
    const secret = this.config.get<string>('GITHUB_WEBHOOK_SECRET');
    if (!secret) throw new Error('GITHUB_WEBHOOK_SECRET is not configured');

    const expected =
      'sha256=' +
      crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expected);

    // Constant-time comparison to prevent timing attacks
    if (
      sigBuffer.length !== expBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  // ─── Event Router ────────────────────────────────────────────────────────────

  async handleEvent(
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    switch (event) {
      case 'issues':
        await this.handleIssueEvent(payload);
        break;
      case 'issue_comment':
        this.handleIssueCommentEvent(payload);
        break;
      case 'push':
        this.handlePushEvent(payload);
        break;
      case 'pull_request':
        this.handlePullRequestEvent(payload);
        break;
      default:
        this.logger.log(`Unhandled GitHub event: ${event}`);
    }
  }

  // ─── issues event ────────────────────────────────────────────────────────────

  private async handleIssueEvent(
    payload: Record<string, unknown>,
  ): Promise<void> {
    const action = payload.action as string;
    const issue = payload.issue as Record<string, unknown>;
    const repo = payload.repository as Record<string, unknown>;

    // Always upsert the repository first
    const savedRepo = await this.repositoriesService.upsertFromWebhook({
      github_repo_id: String(repo.id),
      owner: (repo.owner as Record<string, unknown>).login as string,
      name: repo.name as string,
      full_name: repo.full_name as string,
      html_url: repo.html_url as string,
    });

    const github_issue_id = String(issue.number) + '_' + String(repo.id);

    if (action === 'opened') {
      await this.issuesService.upsertFromWebhook({
        repo_id: savedRepo.id,
        github_issue_id,
        title: issue.title as string,
        state: 'open',
        created_at: issue.created_at as string,
        updated_at: issue.updated_at as string,
        closed_at: null,
        labels: (issue.labels as Record<string, unknown>[]) ?? [],
        raw_payload: payload,
      });
    }

    if (action === 'edited' || action === 'reopened') {
      await this.issuesService.updateByGithubId(github_issue_id, {
        title: issue.title as string,
        state: action === 'reopened' ? 'open' : undefined,
        updated_at: issue.updated_at as string,
        labels: (issue.labels as Record<string, unknown>[]) ?? [],
        raw_payload: payload,
      });
    }

    if (action === 'closed') {
      await this.issuesService.updateByGithubId(github_issue_id, {
        state: 'closed',
        closed_at: issue.closed_at as string,
        updated_at: issue.updated_at as string,
        raw_payload: payload,
      });
    }

    // Handle assignee changes
    if (action === 'assigned') {
      const assignee = issue.assignee as Record<string, unknown> | null;
      if (assignee?.login) {
        await this.issueAssignmentsService.autoLinkFromWebhook(
          github_issue_id,
          assignee.login as string,
        );
      }
    }

    if (action === 'unassigned') {
      const assignee = payload.assignee as Record<string, unknown> | null;
      if (assignee?.login) {
        await this.issueAssignmentsService.removeAssignmentByUsername(
          github_issue_id,
          assignee.login as string,
        );
      }
    }
  }

  // ─── issue_comment event ─────────────────────────────────────────────────────

  private handleIssueCommentEvent(payload: Record<string, unknown>): void {
    const issue = payload.issue as Record<string, unknown> | null;
    this.logger.log(
      `issue_comment action=${String(payload.action)} on issue #${String(issue?.number)}`,
    );
  }

  // ─── push event ──────────────────────────────────────────────────────────────

  private handlePushEvent(payload: Record<string, unknown>): void {
    const repo = payload.repository as Record<string, unknown> | null;
    this.logger.log(`push event on repo ${String(repo?.full_name)}`);
  }

  // ─── pull_request event ──────────────────────────────────────────────────────

  private handlePullRequestEvent(payload: Record<string, unknown>): void {
    const repo = payload.repository as Record<string, unknown> | null;
    this.logger.log(
      `pull_request action=${String(payload.action)} on repo ${String(repo?.full_name)}`,
    );
  }
}
