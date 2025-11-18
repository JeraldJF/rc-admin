export interface Entity {
  id: string;
  name_english: string;
  name_khmer: string;
  father_name?: string;
  mother_name?: string;
  dob: string;
  gender: string;
  province?: string;
  district?: string;
  commune?: string;
  village?: string;
  schema: "Student" | "Teacher";
  created: string;
  updated: string;
}

export const mockEntities: Entity[] = [
  {
    id: "1",
    name_english: "Thea Monorith",
    name_khmer: "ធា មន័រឹទ្ធ",
    father_name: "ម៉ៅន សូមថា",
    mother_name: "ថួប គីនមា",
    dob: "2012-10-21",
    gender: "Male",
    province: "Kandal",
    district: "Ta Khmau",
    commune: "Doeum Mien",
    village: "Prek Ta Pov",
    schema: "Student",
    created: "2025-08-04T06:54:29.421Z",
    updated: "2025-08-04T06:54:29.421Z",
  },
  {
    id: "2",
    name_english: "Dy mariya",
    name_khmer: "ឌី ម៉ារីយ៉ា",
    father_name: "ឌី សុខឡាយ",
    mother_name: "លី ច័ន្ទនី",
    dob: "2011-05-15",
    gender: "Female",
    province: "Phnom Penh",
    district: "Chamkar Mon",
    commune: "Tonle Bassac",
    village: "Boeng Keng Kang",
    schema: "Student",
    created: "2025-08-04T06:54:29.348Z",
    updated: "2025-08-04T06:54:29.348Z",
  },
  {
    id: "3",
    name_english: "KAN OUDOMMONI",
    name_khmer: "កន់ អូឌុមមុនី",
    father_name: "កន់ វិច័យ",
    mother_name: "សុខ រដ្ឋា",
    dob: "2010-08-22",
    gender: "Female",
    province: "Siem Reap",
    district: "Siem Reap",
    commune: "Sala Kamraeuk",
    village: "Svay Dangkum",
    schema: "Student",
    created: "2025-08-04T06:53:06.225Z",
    updated: "2025-08-04T06:54:29.250Z",
  },
  {
    id: "4",
    name_english: "KEAT MARINA",
    name_khmer: "កៀត ម៉ារីណា",
    father_name: "កៀត សុខា",
    mother_name: "ជិន សោភា",
    dob: "2009-03-10",
    gender: "Female",
    province: "Battambang",
    district: "Battambang",
    commune: "Ratanak",
    village: "Kdol Ta Hen",
    schema: "Student",
    created: "2025-08-04T07:08:19.136Z",
    updated: "2025-08-04T07:08:19.136Z",
  },
  {
    id: "5",
    name_english: "POV SAKNA",
    name_khmer: "ពៅ សក្កណា",
    father_name: "ពៅ រដ្ឋា",
    mother_name: "ហុក ម៉ាលី",
    dob: "2008-12-05",
    gender: "Male",
    province: "Kandal",
    district: "Kien Svay",
    commune: "Kokir",
    village: "Prey Veng",
    schema: "Student",
    created: "2025-08-04T06:54:29.497Z",
    updated: "2025-08-04T06:54:29.497Z",
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
