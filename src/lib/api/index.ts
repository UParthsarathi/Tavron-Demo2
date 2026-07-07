// The single data-access layer for Tavron. Components and hooks import from
// here (`@/lib/api`) and never call the Supabase client directly — that's what
// keeps the backend swap/testing story clean. One module per entity.

export * as profiles from './profiles';
export * as projects from './projects';
export * as milestones from './milestones';
export * as tasks from './tasks';
export * as documents from './documents';
export * as dailyLogs from './dailyLogs';
export * as storage from './storage';
