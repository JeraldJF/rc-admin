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
    dateRequested: "2025-11-21T06:30:00Z", // 2 hours ago
    dateApproved: "2025-11-21T08:15:00Z",
    status: "approved",
  },
  {
    id: "2",
    studentName: "Emily Davis",
    instituteName: "National University of Management",
    dateRequested: "2025-11-20T10:20:00Z", // 1 day ago
    status: "pending",
  },
  {
    id: "3",
    studentName: "Michael Brown",
    instituteName: "Institute of Technology of Cambodia",
    dateRequested: "2025-11-18T15:45:00Z", // 3 days ago
    status: "rejected",
  },
  {
    id: "4",
    studentName: "Sophia Wilson",
    instituteName: "Norton University",
    teacherName: "Prof. Robert Lee",
    dateRequested: "2025-11-19T09:00:00Z", // 2 days ago
    dateApproved: "2025-11-20T14:30:00Z", // 1 day ago
    status: "approved",
  },
  {
    id: "5",
    studentName: "James Martinez",
    instituteName: "Royal University of Phnom Penh",
    dateRequested: "2025-11-21T05:15:00Z", // 3 hours ago
    status: "pending",
  },
  {
    id: "6",
    studentName: "Olivia Taylor",
    instituteName: "Institute of Technology of Cambodia",
    teacherName: "Dr. Emily White",
    dateRequested: "2025-11-11T13:20:00Z", // 10 days ago
    dateApproved: "2025-11-12T11:45:00Z", // 9 days ago
    status: "approved",
  },
  {
    id: "7",
    studentName: "Lucas Anderson",
    instituteName: "Build Bright University",
    dateRequested: "2025-11-20T18:00:00Z", // 1 day ago
    status: "pending",
  },
  {
    id: "8",
    studentName: "Charlotte Harris",
    instituteName: "Pannasastra University",
    teacherName: "Prof. Christopher Lee",
    dateRequested: "2025-11-15T10:30:00Z", // 6 days ago
    dateApproved: "2025-11-16T09:20:00Z", // 5 days ago
    status: "approved",
  },
  {
    id: "9",
    studentName: "Ethan Williams",
    instituteName: "Battambang University",
    dateRequested: "2025-11-21T07:45:00Z", // 1 hour ago
    status: "pending",
  },
  {
    id: "10",
    studentName: "Ava Thompson",
    instituteName: "Cambodian Mekong University",
    teacherName: "Dr. Jennifer Park",
    dateRequested: "2025-11-17T11:15:00Z", // 4 days ago
    dateApproved: "2025-11-18T16:00:00Z", // 3 days ago
    status: "approved",
  },
];
