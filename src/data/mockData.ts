export interface Entity {
  id: string;
  schema: "Student" | "Teacher";
  created: string;
  updated: string;
  
  // Common fields
  dob: string;
  gender: string;
  
  // Student-specific fields
  fullName?: string;
  mobile?: string;
  email?: string;
  instituteName?: string;
  
  // Teacher-specific fields
  name?: string;
  subject?: string;
  
  // Legacy fields (keeping for backward compatibility)
  name_english?: string;
  father_name?: string;
  mother_name?: string;
  province?: string;
  district?: string;
  commune?: string;
  village?: string;
}

export const mockEntities: Entity[] = [
  {
    id: "1",
    schema: "Student",
    fullName: "Thea Monorith",
    dob: "2005-03-15",
    gender: "Male",
    mobile: "+855 12 345 678",
    email: "thea.monorith@student.edu",
    instituteName: "Royal University of Phnom Penh",
    created: "2025-11-18T10:30:00Z",
    updated: "2025-11-19T08:15:00Z",
    name_english: "Thea Monorith",
  },
  {
    id: "2",
    schema: "Student",
    fullName: "Sophia Chen",
    dob: "2006-07-22",
    gender: "Female",
    mobile: "+855 98 765 432",
    email: "sophia.chen@student.edu",
    instituteName: "National University of Management",
    created: "2025-11-17T09:15:00Z",
    updated: "2025-11-18T14:20:00Z",
    name_english: "Sophia Chen",
  },
  {
    id: "3",
    schema: "Teacher",
    name: "David Williams",
    dob: "1985-11-08",
    gender: "Male",
    mobile: "+855 11 222 333",
    email: "david.williams@teacher.edu",
    instituteName: "International School of Phnom Penh",
    created: "2025-11-15T08:00:00Z",
    updated: "2025-11-18T16:30:00Z",
    name_english: "David Williams",
  },
  {
    id: "4",
    schema: "Student",
    fullName: "Emma Thompson",
    dob: "2005-09-12",
    gender: "Female",
    mobile: "+855 77 888 999",
    email: "emma.thompson@student.edu",
    instituteName: "Siem Reap University",
    created: "2025-11-10T13:45:00Z",
    updated: "2025-11-19T10:15:00Z",
    name_english: "Emma Thompson",
  },
  {
    id: "5",
    schema: "Teacher",
    name: "Michael Rodriguez",
    dob: "1978-04-25",
    gender: "Male",
    mobile: "+855 99 111 222",
    email: "michael.rodriguez@teacher.edu",
    instituteName: "Norton University",
    created: "2025-11-05T07:30:00Z",
    updated: "2025-11-17T15:00:00Z",
    name_english: "Michael Rodriguez",
  },
  {
    id: "6",
    schema: "Student",
    fullName: "Olivia Martinez",
    dob: "2006-02-18",
    gender: "Female",
    mobile: "+855 88 333 444",
    email: "olivia.martinez@student.edu",
    instituteName: "Battambang University",
    created: "2025-10-28T11:00:00Z",
    updated: "2025-11-16T09:30:00Z",
    name_english: "Olivia Martinez",
  },
  {
    id: "7",
    schema: "Teacher",
    name: "James Anderson",
    dob: "1982-06-30",
    gender: "Male",
    mobile: "+855 70 555 666",
    email: "james.anderson@teacher.edu",
    instituteName: "Pannasastra University",
    created: "2025-10-15T10:15:00Z",
    updated: "2025-11-12T12:45:00Z",
    name_english: "James Anderson",
  },
  {
    id: "8",
    schema: "Student",
    fullName: "Ava Brown",
    dob: "2005-12-05",
    gender: "Female",
    mobile: "+855 66 777 888",
    email: "ava.brown@student.edu",
    instituteName: "Institute of Technology of Cambodia",
    created: "2025-09-20T14:20:00Z",
    updated: "2025-11-14T16:00:00Z",
    name_english: "Ava Brown",
  },
  {
    id: "9",
    schema: "Teacher",
    name: "Benjamin Lee",
    dob: "1990-08-14",
    gender: "Male",
    mobile: "+855 55 999 000",
    email: "benjamin.lee@teacher.edu",
    instituteName: "Build Bright University",
    created: "2025-08-25T09:45:00Z",
    updated: "2025-11-10T13:15:00Z",
    name_english: "Benjamin Lee",
  },
  {
    id: "10",
    schema: "Student",
    fullName: "Isabella Garcia",
    dob: "2006-05-28",
    gender: "Female",
    mobile: "+855 44 111 222",
    email: "isabella.garcia@student.edu",
    instituteName: "Cambodian Mekong University",
    created: "2025-07-18T08:30:00Z",
    updated: "2025-11-08T11:45:00Z",
    name_english: "Isabella Garcia",
  },
];

export const provinces = [
  "Banteay Meanchey",
  "Battambang",
  "Kampong Cham",
  "Kampong Chhnang",
  "Kampong Speu",
  "Kampong Thom",
  "Kampot",
  "Kandal",
  "Kep",
  "Koh Kong",
  "Kratié",
  "Mondulkiri",
  "Oddar Meanchey",
  "Pailin",
  "Phnom Penh",
  "Preah Vihear",
  "Prey Veng",
  "Pursat",
  "Ratanakiri",
  "Siem Reap",
  "Sihanoukville",
  "Stung Treng",
  "Svay Rieng",
  "Takéo",
  "Tbong Khmum",
];

export const districts: Record<string, string[]> = {
  Kandal: ["Kandal Stueng", "Kien Svay", "Khsach Kandal", "Kaoh Thum", "Lvea Aem", "Mukh Kampul", "Angk Snuol", "Ponhea Lueu", "S'ang", "Ta Khmau"],
  "Phnom Penh": ["Chamkar Mon", "Doun Penh", "Prampir Meakkakra", "Tuol Kouk", "Dangkao", "Mean Chey", "Ruessei Kaev", "Sen Sok", "Pou Senchey", "Chroy Changvar", "Prek Pnov", "Chbar Ampov"],
  "Siem Reap": ["Siem Reap", "Angkor Chum", "Angkor Thum", "Banteay Srei", "Chi Kraeng", "Kralanh", "Puok", "Prasat Bakong", "Soutr Nikom", "Srei Snam", "Svay Leu", "Varin"],
  Battambang: ["Battambang", "Banan", "Thma Koul", "Bavel", "Aek Phnum", "Moung Ruessei", "Rotanak Mondol", "Sangkae", "Samlout", "Sampov Loun", "Phnum Proek", "Kamrieng", "Koas Krala", "Rukhak Kiri"],
};

export const communes: Record<string, string[]> = {
  "Ta Khmau": ["Doeum Mien", "Preaek Lieb", "Preaek Ta Sek", "Preaek Ta Nung", "Roluos", "Samraong", "Ta Khmau"],
  "Kien Svay": ["Kokir", "Preaek Ta Kov", "Preaek Anhchanh", "Preaek Phnov", "Roluos", "Svay Rolum"],
  "Chamkar Mon": ["Tonle Bassac", "Boeung Keng Kang I", "Boeung Keng Kang II", "Boeung Keng Kang III", "Olympic", "Tumnob Tuek"],
  Siem_Reap: ["Sala Kamraeuk", "Siem Reab", "Srangae", "Svay Dangkum", "Wat Bo"],
  Battambang: ["Ratanak", "Chamkar Samraong", "Prek Mohatep", "Prek Preah Sdach", "Rotanak", "Svaydangkum", "Thmei", "Wat Kor"],
};

export const villages: Record<string, string[]> = {
  "Doeum Mien": ["Prek Ta Pov", "Doeum Mien", "Preaek Ambel"],
  Kokir: ["Prey Veng", "Kokir Leu", "Kokir Kraom"],
  "Tonle Bassac": ["Boeng Keng Kang", "Toul Svay Prey I", "Toul Svay Prey II"],
  "Sala Kamraeuk": ["Svay Dangkum", "Sala Kamraeuk", "Trapeang Ses"],
  Ratanak: ["Kdol Ta Hen", "Pralay", "Ratanak"],
};

export const institutes = [
  "Royal University of Phnom Penh",
  "National University of Management",
  "Institute of Technology of Cambodia",
  "Royal University of Law and Economics",
  "Pannasastra University of Cambodia",
  "Norton University",
  "Build Bright University",
  "Cambodian Mekong University",
  "University of Cambodia",
  "International University",
  "Siem Reap University",
  "Battambang University",
  "International School of Phnom Penh",
  "Northbridge International School Cambodia",
  "Canadian International School of Phnom Penh",
  "Western International School of Phnom Penh",
  "Zaman International School",
  "American Intercon School",
  "British International School Phnom Penh",
  "Australian Centre for Education",
];
