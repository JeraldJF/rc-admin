export interface Entity {
  id: string;
  name_english: string;
  father_name?: string;
  mother_name?: string;
  dob: string;
  gender: string;
  province?: string;
  district?: string;
  commune?: string;
  village?: string;
  created: string;
  updated: string;
  schema: "Student" | "Teacher";
}

export const mockEntities: Entity[] = [
  {
    id: "1",
    name_english: "Thea Monorith",
    father_name: "Thea Veasna",
    mother_name: "Sok Channary",
    dob: "2005-03-15",
    gender: "Male",
    province: "Kandal",
    district: "Ta Khmau",
    commune: "Ta Khmau",
    village: "Prek Eng",
    created: "2024-01-15T10:30:00Z",
    updated: "2024-01-20T14:45:00Z",
    schema: "Student",
  },
  {
    id: "2",
    name_english: "Sophia Chen",
    father_name: "Chen Wei",
    mother_name: "Liu Mei",
    dob: "2006-07-22",
    gender: "Female",
    province: "Phnom Penh",
    district: "Chamkar Mon",
    commune: "Toul Svay Prey",
    village: "Boeung Trabek",
    created: "2024-01-16T09:15:00Z",
    updated: "2024-01-21T11:20:00Z",
    schema: "Student",
  },
  {
    id: "3",
    name_english: "David Williams",
    dob: "1985-11-08",
    gender: "Male",
    created: "2024-01-10T08:00:00Z",
    updated: "2024-01-18T16:30:00Z",
    schema: "Teacher",
  },
  {
    id: "4",
    name_english: "Emma Thompson",
    father_name: "Robert Thompson",
    mother_name: "Sarah Johnson",
    dob: "2005-09-12",
    gender: "Female",
    province: "Siem Reap",
    district: "Siem Reap",
    commune: "Sala Kamreuk",
    village: "Wat Bo",
    created: "2024-01-17T13:45:00Z",
    updated: "2024-01-22T10:15:00Z",
    schema: "Student",
  },
  {
    id: "5",
    name_english: "Michael Rodriguez",
    dob: "1978-04-25",
    gender: "Male",
    created: "2024-01-12T07:30:00Z",
    updated: "2024-01-19T15:00:00Z",
    schema: "Teacher",
  },
  {
    id: "6",
    name_english: "Olivia Martinez",
    father_name: "Carlos Martinez",
    mother_name: "Ana Garcia",
    dob: "2006-02-18",
    gender: "Female",
    province: "Battambang",
    district: "Battambang",
    commune: "Chamkar Samraong",
    village: "Kdol Doun Teav",
    created: "2024-01-14T11:00:00Z",
    updated: "2024-01-23T09:30:00Z",
    schema: "Student",
  },
  {
    id: "7",
    name_english: "James Anderson",
    dob: "1982-06-30",
    gender: "Male",
    created: "2024-01-11T10:15:00Z",
    updated: "2024-01-20T12:45:00Z",
    schema: "Teacher",
  },
  {
    id: "8",
    name_english: "Ava Brown",
    father_name: "William Brown",
    mother_name: "Elizabeth White",
    dob: "2005-12-05",
    gender: "Female",
    province: "Kandal",
    district: "Takhmau",
    commune: "Prek Ho",
    village: "Roluos",
    created: "2024-01-18T14:20:00Z",
    updated: "2024-01-24T16:00:00Z",
    schema: "Student",
  },
  {
    id: "9",
    name_english: "Benjamin Lee",
    dob: "1990-08-14",
    gender: "Male",
    created: "2024-01-13T09:45:00Z",
    updated: "2024-01-21T13:15:00Z",
    schema: "Teacher",
  },
  {
    id: "10",
    name_english: "Isabella Garcia",
    father_name: "Jose Garcia",
    mother_name: "Maria Lopez",
    dob: "2006-05-28",
    gender: "Female",
    province: "Phnom Penh",
    district: "Daun Penh",
    commune: "Chaktomuk",
    village: "Wat Phnom",
    created: "2024-01-19T08:30:00Z",
    updated: "2024-01-25T11:45:00Z",
    schema: "Student",
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
