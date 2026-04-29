// Headless HTTP client for the Ubiquilife Support external API.
//
// Usable on its own from any React app, or wrapped by SupportProvider
// to feed the floating widget.

export interface SupportConfig {
  /** e.g. https://support.ubiqui.life/external-api — no trailing slash. */
  apiBaseUrl: string;
  /** Bearer token from the Support app's external API tokens page. */
  apiKey: string;
  /** Reported as `source_app` on every ticket. */
  appName: string;
  /** Optional — pre-fills the reporter field. */
  defaultReporterName?: string;
  /** Optional — cross-platform user correlation. */
  identimeUserId?: string;
}

export interface SupportLookupItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface SupportTicketDraft {
  title: string;
  description: string;
  categoryId?: string;
  priorityId?: string;
  reporterName?: string;
  sourceUrl?: string;
  contextData?: Record<string, unknown>;
}

export interface SupportTicket {
  id: string;
  title: string;
  status?: string;
  priority?: string;
}

const headers = (cfg: SupportConfig): HeadersInit => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Bearer ${cfg.apiKey}`,
});

const normaliseLookup = (raw: unknown): SupportLookupItem[] => {
  const arr = Array.isArray(raw)
    ? raw
    : (raw as { data?: SupportLookupItem[] })?.data ?? [];
  return (arr as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ''),
    // `name` may be a plain string OR a Spatie translatable JSON object
    // ({"en": "Critical", ...}); fall through to the English value.
    name:
      typeof row.name === 'string'
        ? row.name
        : (row.name as Record<string, string>)?.en ?? '',
    icon: row.icon as string | undefined,
    color: row.color as string | undefined,
  }));
};

export class SupportClient {
  constructor(private cfg: SupportConfig) {}

  async categories(): Promise<SupportLookupItem[]> {
    return this.getLookup('categories');
  }

  async priorities(): Promise<SupportLookupItem[]> {
    return this.getLookup('priorities');
  }

  async statuses(): Promise<SupportLookupItem[]> {
    return this.getLookup('statuses');
  }

  async createTicket(draft: SupportTicketDraft): Promise<SupportTicket | null> {
    const body: Record<string, unknown> = {
      title: draft.title,
      description: draft.description,
      source_app: this.cfg.appName,
      category_id: draft.categoryId,
      priority_id: draft.priorityId,
      reporter_name: draft.reporterName ?? this.cfg.defaultReporterName,
      source_url: draft.sourceUrl ?? (typeof window !== 'undefined' ? window.location.href : undefined),
      identime_user_id: this.cfg.identimeUserId,
    };
    const ctx: Record<string, unknown> = {
      ...(draft.contextData ?? {}),
      client_app: this.cfg.appName,
      client_platform: 'react',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      viewport:
        typeof window !== 'undefined'
          ? { width: window.innerWidth, height: window.innerHeight }
          : undefined,
      timestamp: new Date().toISOString(),
    };
    body.context_data = JSON.stringify(ctx);

    const res = await fetch(`${this.cfg.apiBaseUrl}/tickets`, {
      method: 'POST',
      headers: headers(this.cfg),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Support API ${res.status}: ${text}`);
    }
    const json = (await res.json()) as { data?: SupportTicket };
    return json.data ?? null;
  }

  private async getLookup(path: 'categories' | 'priorities' | 'statuses'): Promise<SupportLookupItem[]> {
    const res = await fetch(`${this.cfg.apiBaseUrl}/lookup/${path}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${this.cfg.apiKey}` },
    });
    if (!res.ok) throw new Error(`Support lookup ${path} failed: ${res.status}`);
    return normaliseLookup(await res.json());
  }
}
