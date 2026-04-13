import type { RoadmapFieldConfig, RoadmapIssueRow, RoadmapProjectMeta } from './roadmapTypes';
import type { ProjectBoardTarget } from './projectBoardUrl';

export type { RoadmapFieldConfig, RoadmapIssueRow, RoadmapProjectMeta } from './roadmapTypes';

type GraphQLResponse<T> = {
    data?: T;
    errors?: Array<{ message: string }>;
};

const PROJECT_ITEMS_QUERY = `
query ProjectV2Items($login: String!, $number: Int!, $after: String) {
  organization(login: $login) {
    projectV2(number: $number) {
      id
      title
      items(first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          content {
            ... on Issue {
              number
              title
              url
              repository {
                nameWithOwner
              }
              milestone {
                title
              }
            }
          }
          fieldValues(first: 40) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2SingleSelectField {
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldIterationValue {
                title
                field {
                  ... on ProjectV2IterationField {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const USER_PROJECT_ITEMS_QUERY = `
query UserProjectV2Items($login: String!, $number: Int!, $after: String) {
  user(login: $login) {
    projectV2(number: $number) {
      id
      title
      items(first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          content {
            ... on Issue {
              number
              title
              url
              repository {
                nameWithOwner
              }
              milestone {
                title
              }
            }
          }
          fieldValues(first: 40) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2SingleSelectField {
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldIterationValue {
                title
                field {
                  ... on ProjectV2IterationField {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

async function githubGraphql<T>(
    token: string,
    query: string,
    variables: Record<string, unknown>
): Promise<T> {
    const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'forge-studio-roadmap'
        },
        body: JSON.stringify({ query, variables })
    });
    const json = (await res.json()) as GraphQLResponse<T>;
    if (!res.ok) {
        throw new Error(`GitHub GraphQL HTTP ${res.status}: ${JSON.stringify(json)}`);
    }
    if (json.errors?.length) {
        const msg = json.errors.map((e) => e.message).join('; ');
        throw new Error(`GitHub GraphQL: ${msg}`);
    }
    if (json.data === undefined) {
        throw new Error('GitHub GraphQL: empty response');
    }
    return json.data;
}

type ProjectV2ItemsDataOrg = {
    organization: {
        projectV2: ProjectV2Node | null;
    } | null;
};

type ProjectV2ItemsDataUser = {
    user: {
        projectV2: ProjectV2Node | null;
    } | null;
};

type ProjectV2Node = {
    id: string;
    title: string;
    items: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: ProjectItemNode[];
    };
};

type ProjectItemNode = {
    id: string;
    content: null | {
        number: number;
        title: string;
        url: string;
        repository: { nameWithOwner: string } | null;
        milestone: { title: string } | null;
    };
    fieldValues: {
        nodes: FieldValueNode[];
    };
};

type FieldValueNode =
    | {
          name: string;
          field: { name: string } | null;
      }
    | {
          title: string;
          field: { name: string } | null;
      };

function extractFieldMap(nodes: FieldValueNode[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const n of nodes) {
        if (!n.field?.name) {
            continue;
        }
        if ('name' in n && typeof n.name === 'string') {
            map.set(n.field.name, n.name);
        } else if ('title' in n && typeof n.title === 'string') {
            map.set(n.field.name, n.title);
        }
    }
    return map;
}

function mapItemToRow(
    item: ProjectItemNode,
    fields: RoadmapFieldConfig
): RoadmapIssueRow | null {
    const issue = item.content;
    if (!issue) {
        return null;
    }
    const map = extractFieldMap(item.fieldValues.nodes as FieldValueNode[]);
    const status = map.get(fields.statusFieldName) ?? null;
    const sprintRaw = map.get(fields.sprintFieldName);
    const sprint = sprintRaw !== undefined ? sprintRaw : null;

    if (status === fields.doneStatusName) {
        return null;
    }

    const repo = issue.repository?.nameWithOwner?.trim();
    if (!repo) {
        return null;
    }

    return {
        projectItemId: item.id,
        number: issue.number,
        title: issue.title,
        htmlUrl: issue.url,
        repositoryNameWithOwner: repo,
        sprint,
        status,
        milestoneTitle: issue.milestone?.title ?? null
    };
}

export async function fetchRoadmapIssues(
    token: string,
    target: ProjectBoardTarget,
    fields: RoadmapFieldConfig
): Promise<{ project: RoadmapProjectMeta; issues: RoadmapIssueRow[] }> {
    const query =
        target.ownerKind === 'org' ? PROJECT_ITEMS_QUERY : USER_PROJECT_ITEMS_QUERY;
    const loginKey = target.ownerKind === 'org' ? 'organization' : 'user';

    const allRows: RoadmapIssueRow[] = [];
    let cursor: string | null = null;
    let projectMeta: RoadmapProjectMeta | null = null;

    for (;;) {
        const variables: Record<string, unknown> = {
            login: target.owner,
            number: target.number,
            after: cursor
        };
        const data = await githubGraphql<ProjectV2ItemsDataOrg | ProjectV2ItemsDataUser>(
            token,
            query,
            variables
        );
        const container = data[loginKey as keyof typeof data] as
            | { projectV2: ProjectV2Node | null }
            | null
            | undefined;
        const proj = container?.projectV2;
        if (!proj) {
            throw new Error(
                `GitHub Project not found for ${target.ownerKind} "${target.owner}" number ${target.number}. Check github_board and your access.`
            );
        }
        if (!projectMeta) {
            projectMeta = { id: proj.id, title: proj.title };
        }
        for (const node of proj.items.nodes) {
            const row = mapItemToRow(node, fields);
            if (row) {
                allRows.push(row);
            }
        }
        if (!proj.items.pageInfo.hasNextPage || !proj.items.pageInfo.endCursor) {
            break;
        }
        cursor = proj.items.pageInfo.endCursor;
    }

    if (!projectMeta) {
        throw new Error('GitHub Project returned no data.');
    }

    return { project: projectMeta, issues: allRows };
}

/**
 * If organization query returns null project (wrong API path), try user login.
 */
export async function fetchRoadmapIssuesWithFallback(
    token: string,
    target: ProjectBoardTarget,
    fields: RoadmapFieldConfig
): Promise<{ project: RoadmapProjectMeta; issues: RoadmapIssueRow[] }> {
    try {
        return await fetchRoadmapIssues(token, target, fields);
    } catch (e) {
        if (target.ownerKind !== 'org') {
            throw e;
        }
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('not found') && !msg.includes('Could not resolve')) {
            throw e;
        }
        const userTarget: ProjectBoardTarget = {
            ownerKind: 'user',
            owner: target.owner,
            number: target.number
        };
        return await fetchRoadmapIssues(token, userTarget, fields);
    }
}
