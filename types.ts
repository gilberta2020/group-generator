
export interface Student {
  id: string; // Unique identifier (ID if provided, else Name)
  name: string;
  studentId?: string;
  groupId: number;
  assignedAt: number;
}

export interface Group {
  id: number;
  maxSize: number;
}

export const TARGET_GROUPS = [2, 3, 4, 5];
export const GROUP_MAX_SIZE = 5;
export const ADMIN_PASSCODE = "1234";
