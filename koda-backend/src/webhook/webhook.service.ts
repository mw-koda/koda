import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RepositoriesService } from '../repositories/repositories.service';
import { IssuesService } from '../issues/issues.service';
import { IssueAssignmentsService } from '../issue-assignments/issue-assignments.service';
import { IssueState } from '../issues/dto/issues.dto'; // <-- Add this import

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

    // 1. Upsert the repository
    const savedRepo = await this.repositoriesService.upsertFromWebhook({
      github_repo_id: String(repo.id),
      owner: (repo.owner as Record<string, unknown>).login as string,
      name: repo.name as string,
      full_name: repo.full_name as string,
      html_url: repo.html_url as string,
      url: repo.url as string,
      // Note: team_id is left null initially based on your schema
    });

    const github_issue_id = String(issue.number) + '_' + String(repo.id);
    let currentIssueId: string;

    // 2. Handle Issue creation/updates
    if (action === 'opened') {
      const savedIssue = await this.issuesService.upsertFromWebhook({
        repo_id: savedRepo.id, // Using the UUID
        github_issue_id,
        title: issue.title as string,
        state: IssueState.OPEN,
        created_at: issue.created_at as string,
        updated_at: issue.updated_at as string,
        closed_at: null,
        labels: (issue.labels as Record<string, unknown>[]) ?? [],
        raw_payload: payload,
      });
      currentIssueId = savedIssue.id;
    } else {
      // For edited, reopened, closed, assigned, etc., make sure we have the UUID
      let existingIssue = await this.issuesService.updateByGithubId(
        github_issue_id,
        {
          title: issue.title as string,
          state:
            action === 'closed'
              ? IssueState.CLOSED
              : action === 'reopened'
                ? IssueState.OPEN
                : undefined,
          updated_at: issue.updated_at as string,
          closed_at:
            action === 'closed' ? (issue.closed_at as string) : undefined,
          labels: (issue.labels as Record<string, unknown>[]) ?? [],
          raw_payload: payload,
        },
      );

      // If the issue doesn't exist (e.g., missed 'opened' event), create it
      if (!existingIssue) {
        existingIssue = await this.issuesService.upsertFromWebhook({
          repo_id: savedRepo.id,
          github_issue_id,
          title: issue.title as string,
          state: action === 'closed' ? IssueState.CLOSED : IssueState.OPEN,
          created_at: issue.created_at as string,
          updated_at: issue.updated_at as string,
          closed_at: action === 'closed' ? (issue.closed_at as string) : null,
          labels: (issue.labels as Record<string, unknown>[]) ?? [],
          raw_payload: payload,
        });
      }
      currentIssueId = existingIssue.id;
    }

    // 3. Handle Assignments
    const assignee = (payload.assignee || issue.assignee) as Record<
      string,
      unknown
    > | null;

    if (assignee?.login) {
      if (
        action === 'assigned' ||
        action === 'opened' ||
        action === 'reopened'
      ) {
        await this.issueAssignmentsService.autoLinkFromWebhook(
          currentIssueId,
          assignee.login as string,
        );
      } else if (action === 'unassigned') {
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
