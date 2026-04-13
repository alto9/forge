export type RoadmapIssueRow = {
    projectItemId: string;
    number: number;
    title: string;
    htmlUrl: string;
    /** e.g. "octo-org/Hello-World" — from GitHub Issue.repository.nameWithOwner */
    repositoryNameWithOwner: string;
    sprint: string | null;
    status: string | null;
    milestoneTitle: string | null;
};

export type RoadmapFieldConfig = {
    statusFieldName: string;
    sprintFieldName: string;
    doneStatusName: string;
};

export type RoadmapProjectMeta = {
    id: string;
    title: string;
};
