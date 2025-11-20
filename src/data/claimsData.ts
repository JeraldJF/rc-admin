export interface Claim {
  id: string;
  studentName: string;
  instituteName: string;
  teacherName?: string;
  dateRequested: string;
  dateApproved?: string;
  status: "pending" | "approved" | "rejected";
}

export const mockClaims: Claim[] = [
  {
    id: "1",
    studentName: "John Smith",
    instituteName: "Royal University of Phnom Penh",
    teacherName: "Dr. Sarah Johnson",
    dateRequested: "2024-01-15",
    dateApproved: "2024-01-16",
    status: "approved",
  },
  {
    id: "2",
    studentName: "Emily Davis",
    instituteName: "National University of Management",
    dateRequested: "2024-01-18",
    status: "pending",
  },
  {
    id: "3",
    studentName: "Michael Brown",
    instituteName: "Institute of Technology of Cambodia",
    dateRequested: "2024-01-20",
    status: "rejected",
  },
  {
    id: "4",
    studentName: "Sophia Wilson",
    instituteName: "Norton University",
    teacherName: "Prof. Robert Lee",
    dateRequested: "2024-01-22",
    dateApproved: "2024-01-23",
    status: "approved",
  },
  {
    id: "5",
    studentName: "James Martinez",
    instituteName: "Royal University of Phnom Penh",
    dateRequested: "2024-01-25",
    status: "pending",
  },
];
