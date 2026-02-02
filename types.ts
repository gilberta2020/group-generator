
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
export const GROUP_MAX_SIZE = 13; // 4 groups * 13 = 52 total capacity (to cover 50 students)
export const ADMIN_PASSCODE = "1234";

export const WHATSAPP_LINKS: Record<number, string> = {
  2: "https://chat.whatsapp.com/GSp27Rpgqp0EeTZjADbffY",
  3: "https://chat.whatsapp.com/FeqbbuRkHnE0WUZP7rJwtP",
  4: "https://chat.whatsapp.com/IvsghT87HQh9J7yiy10NLF",
  5: "https://chat.whatsapp.com/GIB1b754vsKKCrWdUfsbbb"
};
