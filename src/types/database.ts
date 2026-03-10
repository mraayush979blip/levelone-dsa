// Database Types
export type UserRole = 'admin' | 'student';
export type UserStatus = 'active' | 'revoked';
export type SubmissionType = 'github' | 'file' | 'leetcode';
export type SubmissionStatus = 'valid' | 'late' | 'deleted';
export type PhaseStatus = 'upcoming' | 'live' | 'ended' | 'paused';
export type ActivityType = 'HEARTBEAT' | 'PAGE_VIEW' | 'VIDEO_PROGRESS' | 'SUBMISSION_CREATED' | 'SUBMISSION_UPDATED' | 'SUBMISSION_DELETED';

// User Interface
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  role: UserRole;
  status: UserStatus;
  total_time_spent_seconds: number;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
  roll_number?: string;
  batch?: string;
  phone?: string;
  current_streak?: number;
  max_streak?: number;
  last_activity_date?: string;
  points?: number;
  equipped_theme?: string;
  equipped_banner?: string;
  equipped_avatar?: string;
  leetcode_username?: string;
}

// Phase Interface
export interface Phase {
  id: string;
  phase_number: number;
  title: string;
  description?: string;
  youtube_url?: string;
  assignment_resource_url?: string;
  assignment_file_url?: string;
  assignment_leetcode_url?: string;
  leetcode_problem_slug?: string;
  allowed_submission_type?: 'github' | 'file' | 'both' | 'leetcode';
  start_date: string;
  end_date: string;
  status: PhaseStatus;
  is_active: boolean;
  is_mandatory: boolean;
  is_paused: boolean;
  pause_reason?: string;
  paused_at?: string;
  min_seconds_required: number;
  total_assignments: number;
  bypass_time_requirement?: boolean;
  created_at: string;
  updated_at: string;
}

// Phase Phase Task Interface
export interface PhaseTask {
  id: string;
  phase_id: string;
  title: string;
  url: string;
  points: number;
  created_at: string;
}

export interface TaskSubmission {
  id: string;
  student_id: string;
  task_id: string;
  phase_id: string;
  verified_at: string;
}

// Submission Interface
export interface Submission {
  id: string;
  student_id: string;
  phase_id: string;
  assignment_index: number;
  submission_type: SubmissionType;
  github_url?: string;
  file_url?: string;
  notes?: string;
  status: SubmissionStatus;
  is_deleted: boolean;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

// Submission History Interface
export interface SubmissionHistory {
  id: string;
  submission_id: string;
  student_id: string;
  phase_id: string;
  version: number;
  submission_type: SubmissionType;
  github_url?: string;
  file_url?: string;
  notes?: string;
  status: SubmissionStatus;
  deadline_at: string;
  is_before_deadline: boolean;
  created_at: string;
}

// Student Phase Activity Interface
export interface StudentPhaseActivity {
  id: string;
  student_id: string;
  phase_id: string;
  total_time_spent_seconds: number;
  video_duration_seconds?: number;
  video_watched_seconds: number;
  video_completed: boolean;
  is_deleted: boolean;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

// Activity Log Interface
export interface ActivityLog {
  id: string;
  student_id: string;
  phase_id: string;
  activity_type: ActivityType;
  payload: Record<string, any>;
  created_at: string;
}

// CSV Import Interface
export interface CSVImport {
  id: string;
  admin_id: string;
  file_name: string;
  total_rows: number;
  successful_count: number;
  failed_count: number;
  error_details: Array<{ row: number; error: string; data: any }>;
  created_at: string;
}

// API Response Types
export interface PhaseWithStats extends Phase {
  total_students_in_phase: number;
  completed_count: number;
  completion_percent: number;
}

export interface StudentWithStats extends User {
  submissions_count: number;
}

export interface PhaseDetailResponse {
  phase: Phase;
  student_activity: {
    video_completed: boolean;
    video_watched_percent: number;
    time_spent_seconds: number;
  };
  submission: {
    current: Submission | null;
    can_submit: boolean;
    can_edit: boolean;
  };
  class_stats: {
    total_students: number;
    completed_count: number;
    completion_percent: number;
  };
}

export interface RetentionStats {
  total_students: number;
  retained_count: number;
  revoked_count: number;
  retention_percent: number;
  pie_chart_data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}
