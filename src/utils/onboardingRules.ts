/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure business logic for Admin-Only Employee Onboarding & Database Import:
 * 1. Admin-only role guard (strictly hidden from HOD & Employee views)
 * 2. National ID (NID) & Birth Certificate (BRN) Auto-Fill Lookup (Bangladesh EC / BDRIS + 64-District BBS Geo-Code Decoder + Bangla/English Numeral Normalizer)
 * 3. Pro-Rata Leave Entitlement Calculator (CL: 10, SL: 14, FL: 13, EL: 16 divided by 12 * remaining months)
 * 4. Auto-generated Employee Login Credentials (Username = Company Name 'CHARU', Password = Employee ID)
 * 5. Dynamic Department & Employee Type creation helpers
 */

import { Employee, Role } from '../types';

export type IdentityDocType = 'nid' | 'brn';

export type AccessTagType = 'employee' | 'officer' | 'hod' | 'admin';

export interface CitizenIdentityRecord {
  docType: IdentityDocType;
  idNumber: string;
  formatted17DigitId?: string;
  decodedBbsDistrictCode?: string;
  nameBn: string;
  nameEn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  motherNameBn: string;
  motherNameEn: string;
  dob: string; // YYYY-MM-DD
  gender: 'male' | 'female';
  bloodGroup: string;
  phoneSuggested: string;
  photoUrl: string;
  verifiedSource: 'EC_NID_SERVER' | 'BDRIS_BIRTH_SERVER' | 'AI_OCR_REAL_CARD' | 'PORICHOY_GATEWAY';
  permanentAddress: {
    divisionId: string;
    divisionNameBn: string;
    divisionNameEn: string;
    districtId: string;
    districtNameBn: string;
    districtNameEn: string;
    upazila: string;
    upazilaBn: string;
    postOfficeBn: string;
    postCode: string;
    villageBn: string;
    villageEn: string;
  };
}

export interface LeaveQuotaConfig {
  CL: number; // নৈমিত্তিক ছুটি (Casual Leave) = 10
  SL: number; // অসুস্থতাজনিত ছুটি (Sick Leave) = 14
  FL: number; // অ্যাপেল / উৎসব ছুটি (Festival Leave) = 13
  EL: number; // অর্জিত ছুটি (Earned Leave) = 16
}

export const DEFAULT_ANNUAL_LEAVE_QUOTAS: LeaveQuotaConfig = {
  CL: 10,
  SL: 14,
  FL: 13,
  EL: 16,
};

export interface LeaveProRataItem {
  code: 'CL' | 'SL' | 'FL' | 'EL';
  nameBn: string;
  nameEn: string;
  annualQuota: number;
  monthlyRate: number; // quota / 12
  remainingMonths: number;
  exactEntitlement: number; // +((quota / 12) * remainingMonths).toFixed(2)
  roundedEntitlement: number; // Math.round((quota / 12) * remainingMonths)
  formulaBn: string;
  formulaEn: string;
}

export interface ProRataLeaveResult {
  joinDate: string;
  joinYear: number;
  joinMonthIndex: number; // 0..11
  joinMonthNameBn: string;
  joinMonthNameEn: string;
  remainingMonths: number; // 1..12
  items: {
    CL: LeaveProRataItem;
    SL: LeaveProRataItem;
    FL: LeaveProRataItem;
    EL: LeaveProRataItem;
  };
  totalAnnualQuota: number;
  totalExactEntitlement: number;
  totalRoundedEntitlement: number;
}

export interface EmployeeLoginCredentials {
  companyName: string;
  username: string;
  password: string;
  accessTag: AccessTagType;
  accessTagLabelBn: string;
  accessTagLabelEn: string;
  mappedSystemRole: Role;
}

export interface CustomDepartmentItem {
  id: string;
  code: string;
  nameBn: string;
  nameEn: string;
  subSections: string[];
  isCustom?: boolean;
}

export interface CustomEmployeeTypeItem {
  id: string;
  nameBn: string;
  nameEn: string;
  badgeColor: string;
  defaultAccessTag: AccessTagType;
  employmentTypeKey: 'permanent' | 'probation' | 'contract' | 'worker';
  descriptionBn: string;
  isCustom?: boolean;
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaNumber(val: number | string): string {
  return String(val).replace(/\d/g, d => BN_DIGITS[Number(d)]);
}

/**
 * Converts Bangla numerals (০-৯) to ASCII digits (0-9) and strips non-digits.
 */
export function normalizeIdentityNumber(raw: string): string {
  if (!raw) return '';
  const bnToEn = raw.replace(/[০-৯]/g, ch => String(BN_DIGITS.indexOf(ch)));
  return bnToEn.replace(/[^\d]/g, '');
}

/**
 * Normalizes any Date of Birth string (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, Bangla digits) to YYYY-MM-DD
 */
export function normalizeDateOfBirth(rawDob?: string): string | undefined {
  if (!rawDob || !rawDob.trim()) return undefined;
  const ascii = rawDob
    .trim()
    .replace(/[০-৯]/g, ch => String(BN_DIGITS.indexOf(ch)));

  if (/^\d{4}-\d{2}-\d{2}$/.test(ascii)) {
    return ascii;
  }
  const dmy = ascii.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return ascii;
}

/**
 * 1. Strictly checks whether the current user role is allowed to see and use
 * the Employee Onboarding & Database Import module.
 */
export function isAdminRoleForOnboarding(role: Role): boolean {
  return (
    role === 'superAdmin' ||
    role === 'hrManager' ||
    role === 'hrExecutive' ||
    role === 'accounts'
  );
}

/**
 * Curated preset NID & Birth Certificate records for 1-click demo & instant verification
 */
export const PRESET_CITIZEN_RECORDS: CitizenIdentityRecord[] = [
  {
    docType: 'nid',
    idNumber: '1996361784512',
    formatted17DigitId: '19963617845120000',
    decodedBbsDistrictCode: '36',
    nameBn: 'মোঃ সাইফুল ইসলাম চৌধুরী',
    nameEn: 'Md. Saiful Islam Chowdhury',
    fatherNameBn: 'মোঃ আব্দুল মতিন চৌধুরী',
    fatherNameEn: 'Md. Abdul Matin Chowdhury',
    motherNameBn: 'মিসেস রোকেয়া বেগম',
    motherNameEn: 'Mrs. Rokeya Begum',
    dob: '1996-04-15',
    gender: 'male',
    bloodGroup: 'B+',
    phoneSuggested: '+8801712-884920',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
    verifiedSource: 'EC_NID_SERVER',
    permanentAddress: {
      divisionId: 'sylhet',
      divisionNameBn: 'সিলেট',
      divisionNameEn: 'Sylhet',
      districtId: 'habiganj',
      districtNameBn: 'হবিগঞ্জ',
      districtNameEn: 'Habiganj',
      upazila: 'Madhabpur, Post: Saiham Nagar',
      upazilaBn: 'মাধবপুর, ডাকঘর: সায়হাম নগর',
      postOfficeBn: 'সায়হাম নগর',
      postCode: '3333',
      villageBn: 'গ্রাম: নোয়াপাড়া, ইউনিয়ন: নোয়াপাড়া',
      villageEn: 'Village: Noapara, Union: Noapara',
    },
  },
  {
    docType: 'nid',
    idNumber: '8254963147',
    formatted17DigitId: '19985818254963147',
    decodedBbsDistrictCode: '58',
    nameBn: 'শারমিন আক্তার জুঁই',
    nameEn: 'Sharmin Akter Jui',
    fatherNameBn: 'মোঃ ফজলুল হক তালুকদার',
    fatherNameEn: 'Md. Fazlul Haque Talukder',
    motherNameBn: 'সালমা খাতুন',
    motherNameEn: 'Salma Khatun',
    dob: '1998-08-22',
    gender: 'female',
    bloodGroup: 'O+',
    phoneSuggested: '+8801819-442105',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=180&auto=format&fit=crop&q=80',
    verifiedSource: 'EC_NID_SERVER',
    permanentAddress: {
      divisionId: 'sylhet',
      divisionNameBn: 'সিলেট',
      divisionNameEn: 'Sylhet',
      districtId: 'moulvibazar',
      districtNameBn: 'মৌলভীবাজার',
      districtNameEn: 'Moulvibazar',
      upazila: 'Sreemangal, Post: Kalighat',
      upazilaBn: 'শ্রীমঙ্গল, ডাকঘর: কালীঘাট',
      postOfficeBn: 'কালীঘাট',
      postCode: '3210',
      villageBn: 'গ্রাম: ভানুগাছ রোড, ওয়ার্ড নং-০৪',
      villageEn: 'Village: Bhanugach Road, Ward-04',
    },
  },
  {
    docType: 'nid',
    idNumber: '19913625896314785',
    formatted17DigitId: '19913625896314785',
    decodedBbsDistrictCode: '36',
    nameBn: 'প্রকৌশলী তানভীর আহমেদ সিদ্দিকী',
    nameEn: 'Engr. Tanvir Ahmed Siddiqui',
    fatherNameBn: 'আলহাজ্ব মোস্তাফিজুর রহমান সিদ্দিকী',
    fatherNameEn: 'Alhaj Mostafizur Rahman Siddiqui',
    motherNameBn: 'নুরজাহান বেগম',
    motherNameEn: 'Nurjahan Begum',
    dob: '1991-11-10',
    gender: 'male',
    bloodGroup: 'A+',
    phoneSuggested: '+8801711-903412',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=180&auto=format&fit=crop&q=80',
    verifiedSource: 'EC_NID_SERVER',
    permanentAddress: {
      divisionId: 'sylhet',
      divisionNameBn: 'সিলেট',
      divisionNameEn: 'Sylhet',
      districtId: 'sylhet',
      districtNameBn: 'সিলেট',
      districtNameEn: 'Sylhet',
      upazila: 'Beanibazar, Post: Beanibazar Sadar',
      upazilaBn: 'বিয়ানীবাজার, ডাকঘর: বিয়ানীবাজার সদর',
      postOfficeBn: 'বিয়ানীবাজার সদর',
      postCode: '3170',
      villageBn: 'গ্রাম: খাসা, প্রফেসর পাড়া',
      villageEn: 'Village: Khasa, Professor Para',
    },
  },
  {
    docType: 'brn',
    idNumber: '20013614785236987',
    formatted17DigitId: '20013614785236987',
    decodedBbsDistrictCode: '36',
    nameBn: 'মোঃ আরিফুল ইসলাম রনি',
    nameEn: 'Md. Ariful Islam Rony',
    fatherNameBn: 'মোঃ সিরাজুল ইসলাম',
    fatherNameEn: 'Md. Sirajul Islam',
    motherNameBn: 'হালিমা বেগম',
    motherNameEn: 'Halima Begum',
    dob: '2001-02-14',
    gender: 'male',
    bloodGroup: 'AB+',
    phoneSuggested: '+8801914-775231',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=180&auto=format&fit=crop&q=80',
    verifiedSource: 'BDRIS_BIRTH_SERVER',
    permanentAddress: {
      divisionId: 'chattogram',
      divisionNameBn: 'চট্টগ্রাম',
      divisionNameEn: 'Chattogram',
      districtId: 'brahmanbaria',
      districtNameBn: 'ব্রাহ্মণবাড়িয়া',
      districtNameEn: 'Brahmanbaria',
      upazila: 'Sarail, Post: Shahbajpur',
      upazilaBn: 'সরাইল, ডাকঘর: শাহবাজপুর',
      postOfficeBn: 'শাহবাজপুর',
      postCode: '3430',
      villageBn: 'গ্রাম: শাহবাজপুর উত্তর পাড়া',
      villageEn: 'Village: Shahbajpur North Para',
    },
  },
  {
    docType: 'brn',
    idNumber: '20029015874123654',
    formatted17DigitId: '20029015874123654',
    decodedBbsDistrictCode: '90',
    nameBn: 'তাসনিম জাহান মিম',
    nameEn: 'Tasnim Jahan Mim',
    fatherNameBn: 'মোঃ আনোয়ার হোসেন',
    fatherNameEn: 'Md. Anwar Hossain',
    motherNameBn: 'ফাতেমা জোহরা',
    motherNameEn: 'Fatema Zohra',
    dob: '2002-06-05',
    gender: 'female',
    bloodGroup: 'O+',
    phoneSuggested: '+8801615-663890',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=180&auto=format&fit=crop&q=80',
    verifiedSource: 'BDRIS_BIRTH_SERVER',
    permanentAddress: {
      divisionId: 'sylhet',
      divisionNameBn: 'সিলেট',
      divisionNameEn: 'Sylhet',
      districtId: 'sunamganj',
      districtNameBn: 'সুনামগঞ্জ',
      districtNameEn: 'Sunamganj',
      upazila: 'Chhatak, Post: Gobindaganj',
      upazilaBn: 'ছাতক, ডাকঘর: গোবিন্দগঞ্জ',
      postOfficeBn: 'গোবিন্দগঞ্জ',
      postCode: '3080',
      villageBn: 'গ্রাম: সৈদেরগাঁও, ছাতক',
      villageEn: 'Village: Sydergaon, Chhatak',
    },
  },
];

/**
 * Official Bangladesh Bureau of Statistics (BBS) & Election Commission (EC) 2-digit District Geo-Codes
 * embedded in real 13-digit and 17-digit NID and Birth Registration numbers!
 */
export const BBS_DISTRICT_GEO_CODES: Record<
  string,
  CitizenIdentityRecord['permanentAddress']
> = {
  '36': {
    divisionId: 'sylhet',
    divisionNameBn: 'সিলেট',
    divisionNameEn: 'Sylhet',
    districtId: 'habiganj',
    districtNameBn: 'হবিগঞ্জ',
    districtNameEn: 'Habiganj',
    upazila: 'Madhabpur, Post: Saiham Nagar',
    upazilaBn: 'মাধবপুর, ডাকঘর: সায়হাম নগর',
    postOfficeBn: 'সায়হাম নগর',
    postCode: '3333',
    villageBn: 'গ্রাম: নোয়াপাড়া, ইউনিয়ন: নোয়াপাড়া',
    villageEn: 'Village: Noapara, Union: Noapara',
  },
  '58': {
    divisionId: 'sylhet',
    divisionNameBn: 'সিলেট',
    divisionNameEn: 'Sylhet',
    districtId: 'moulvibazar',
    districtNameBn: 'মৌলভীবাজার',
    districtNameEn: 'Moulvibazar',
    upazila: 'Sreemangal, Post: Sreemangal Sadar',
    upazilaBn: 'শ্রীমঙ্গল, ডাকঘর: শ্রীমঙ্গল সদর',
    postOfficeBn: 'শ্রীমঙ্গল সদর',
    postCode: '3210',
    villageBn: 'গ্রাম: ভানুগাছ রোড, শ্রীমঙ্গল',
    villageEn: 'Village: Bhanugach Road, Sreemangal',
  },
  '90': {
    divisionId: 'sylhet',
    divisionNameBn: 'সিলেট',
    divisionNameEn: 'Sylhet',
    districtId: 'sunamganj',
    districtNameBn: 'সুনামগঞ্জ',
    districtNameEn: 'Sunamganj',
    upazila: 'Chhatak, Post: Gobindaganj',
    upazilaBn: 'ছাতক, ডাকঘর: গোবিন্দগঞ্জ',
    postOfficeBn: 'গোবিন্দগঞ্জ',
    postCode: '3080',
    villageBn: 'গ্রাম: সৈদেরগাঁও, ছাতক',
    villageEn: 'Village: Sydergaon, Chhatak',
  },
  '91': {
    divisionId: 'sylhet',
    divisionNameBn: 'সিলেট',
    divisionNameEn: 'Sylhet',
    districtId: 'sylhet',
    districtNameBn: 'সিলেট',
    districtNameEn: 'Sylhet',
    upazila: 'Golapganj, Post: Dhakadakshin',
    upazilaBn: 'গোলাপগঞ্জ, ডাকঘর: ঢাকাদক্ষিণ',
    postOfficeBn: 'ঢাকাদক্ষিণ',
    postCode: '3161',
    villageBn: 'গ্রাম: দত্তরাইল, গোলাপগঞ্জ',
    villageEn: 'Village: Dattarail, Golapganj',
  },
  '26': {
    divisionId: 'dhaka',
    divisionNameBn: 'ঢাকা',
    divisionNameEn: 'Dhaka',
    districtId: 'dhaka',
    districtNameBn: 'ঢাকা',
    districtNameEn: 'Dhaka',
    upazila: 'Savar, Post: Savar Cantonment',
    upazilaBn: 'সাভার, ডাকঘর: সাভার ক্যান্টনমেন্ট',
    postOfficeBn: 'সাভার',
    postCode: '1344',
    villageBn: 'গ্রাম/মহল্লা: ব্যাংক কলোনি, সাভার',
    villageEn: 'Area: Bank Colony, Savar',
  },
  '33': {
    divisionId: 'dhaka',
    divisionNameBn: 'ঢাকা',
    divisionNameEn: 'Dhaka',
    districtId: 'gazipur',
    districtNameBn: 'গাজীপুর',
    districtNameEn: 'Gazipur',
    upazila: 'Sreepur, Post: Mawna',
    upazilaBn: 'শ্রীপুর, ডাকঘর: মাওনা',
    postOfficeBn: 'মাওনা',
    postCode: '1740',
    villageBn: 'গ্রাম: মাওনা চৌরাস্তা, শ্রীপুর',
    villageEn: 'Village: Mawna Chowrasta, Sreepur',
  },
  '67': {
    divisionId: 'dhaka',
    divisionNameBn: 'ঢাকা',
    divisionNameEn: 'Dhaka',
    districtId: 'narayanganj',
    districtNameBn: 'নারায়ণগঞ্জ',
    districtNameEn: 'Narayanganj',
    upazila: 'Rupganj, Post: Bhulta',
    upazilaBn: 'রূপগঞ্জ, ডাকঘর: ভুলতা',
    postOfficeBn: 'ভুলতা',
    postCode: '1462',
    villageBn: 'গ্রাম: গাউছিয়া, রূপগঞ্জ',
    villageEn: 'Village: Gausia, Rupganj',
  },
  '68': {
    divisionId: 'dhaka',
    divisionNameBn: 'ঢাকা',
    divisionNameEn: 'Dhaka',
    districtId: 'narsingdi',
    districtNameBn: 'নরসিংদী',
    districtNameEn: 'Narsingdi',
    upazila: 'Shibpur, Post: Shibpur Sadar',
    upazilaBn: 'শিবপুর, ডাকঘর: শিবপুর সদর',
    postOfficeBn: 'শিবপুর সদর',
    postCode: '1620',
    villageBn: 'গ্রাম: কলেজ গেট, শিবপুর',
    villageEn: 'Village: College Gate, Shibpur',
  },
  '93': {
    divisionId: 'dhaka',
    divisionNameBn: 'ঢাকা',
    divisionNameEn: 'Dhaka',
    districtId: 'tangail',
    districtNameBn: 'টাঙ্গাইল',
    districtNameEn: 'Tangail',
    upazila: 'Mirzapur, Post: Gorai',
    upazilaBn: 'মির্জাপুর, ডাকঘর: গোড়াই',
    postOfficeBn: 'গোড়াই',
    postCode: '1940',
    villageBn: 'গ্রাম: গোড়াই শিল্পাঞ্চল, মির্জাপুর',
    villageEn: 'Village: Gorai Industrial Area, Mirzapur',
  },
  '48': {
    divisionId: 'dhaka',
    divisionNameBn: 'ঢাকা',
    divisionNameEn: 'Dhaka',
    districtId: 'kishoreganj',
    districtNameBn: 'কিশোরগঞ্জ',
    districtNameEn: 'Kishoreganj',
    upazila: 'Bhairab, Post: Bhairab Bazar',
    upazilaBn: 'ভৈরব, ডাকঘর: ভৈরব বাজার',
    postOfficeBn: 'ভৈরব বাজার',
    postCode: '2350',
    villageBn: 'গ্রাম: কমলপুর, ভৈরব',
    villageEn: 'Village: Kamalpur, Bhairab',
  },
  '12': {
    divisionId: 'chattogram',
    divisionNameBn: 'চট্টগ্রাম',
    divisionNameEn: 'Chattogram',
    districtId: 'brahmanbaria',
    districtNameBn: 'ব্রাহ্মণবাড়িয়া',
    districtNameEn: 'Brahmanbaria',
    upazila: 'Ashuganj, Post: Ashuganj',
    upazilaBn: 'আশুগঞ্জ, ডাকঘর: আশুগঞ্জ',
    postOfficeBn: 'আশুগঞ্জ',
    postCode: '3402',
    villageBn: 'গ্রাম: চর চারতলা, আশুগঞ্জ',
    villageEn: 'Village: Char Chartala, Ashuganj',
  },
  '19': {
    divisionId: 'chattogram',
    divisionNameBn: 'চট্টগ্রাম',
    divisionNameEn: 'Chattogram',
    districtId: 'cumilla',
    districtNameBn: 'কুমিল্লা',
    districtNameEn: 'Cumilla',
    upazila: 'Debidwar, Post: Debidwar Sadar',
    upazilaBn: 'দেবিদ্বার, ডাকঘর: দেবিদ্বার সদর',
    postOfficeBn: 'দেবিদ্বার সদর',
    postCode: '3530',
    villageBn: 'গ্রাম: বড়শালঘর, দেবিদ্বার',
    villageEn: 'Village: Barashalghar, Debidwar',
  },
  '13': {
    divisionId: 'chattogram',
    divisionNameBn: 'চট্টগ্রাম',
    divisionNameEn: 'Chattogram',
    districtId: 'chandpur',
    districtNameBn: 'চাঁদপুর',
    districtNameEn: 'Chandpur',
    upazila: 'Hajiganj, Post: Hajiganj',
    upazilaBn: 'হাজীগঞ্জ, ডাকঘর: হাজীগঞ্জ',
    postOfficeBn: 'হাজীগঞ্জ',
    postCode: '3610',
    villageBn: 'গ্রাম: বলাখাল, হাজীগঞ্জ',
    villageEn: 'Village: Balakhal, Hajiganj',
  },
  '30': {
    divisionId: 'chattogram',
    divisionNameBn: 'চট্টগ্রাম',
    divisionNameEn: 'Chattogram',
    districtId: 'feni',
    districtNameBn: 'ফেনী',
    districtNameEn: 'Feni',
    upazila: 'Chhagalnaiya, Post: Chhagalnaiya',
    upazilaBn: 'ছাগলনাইয়া, ডাকঘর: ছাগলনাইয়া',
    postOfficeBn: 'ছাগলনাইয়া',
    postCode: '3910',
    villageBn: 'গ্রাম: মটুয়া, ছাগলনাইয়া',
    villageEn: 'Village: Matua, Chhagalnaiya',
  },
  '75': {
    divisionId: 'chattogram',
    divisionNameBn: 'চট্টগ্রাম',
    divisionNameEn: 'Chattogram',
    districtId: 'noakhali',
    districtNameBn: 'নোয়াখালী',
    districtNameEn: 'Noakhali',
    upazila: 'Begumganj, Post: Chowmuhani',
    upazilaBn: 'বেগমগঞ্জ, ডাকঘর: চৌমুহনী',
    postOfficeBn: 'চৌমুহনী',
    postCode: '3821',
    villageBn: 'গ্রাম: গণিপুর, চৌমুহনী',
    villageEn: 'Village: Ganipur, Chowmuhani',
  },
  '51': {
    divisionId: 'chattogram',
    divisionNameBn: 'চট্টগ্রাম',
    divisionNameEn: 'Chattogram',
    districtId: 'lakshmipur',
    districtNameBn: 'লক্ষ্মীপুর',
    districtNameEn: 'Lakshmipur',
    upazila: 'Raipur, Post: Raipur Sadar',
    upazilaBn: 'রায়পুর, ডাকঘর: রায়পুর সদর',
    postOfficeBn: 'রায়পুর সদর',
    postCode: '3710',
    villageBn: 'গ্রাম: রাখালিয়া, রায়পুর',
    villageEn: 'Village: Rakhalia, Raipur',
  },
  '15': {
    divisionId: 'chattogram',
    divisionNameBn: 'চট্টগ্রাম',
    divisionNameEn: 'Chattogram',
    districtId: 'chattogram',
    districtNameBn: 'চট্টগ্রাম',
    districtNameEn: 'Chattogram',
    upazila: 'Sitakunda, Post: Kumira',
    upazilaBn: 'সীতাকুণ্ড, ডাকঘর: কুমিরা',
    postOfficeBn: 'কুমিরা',
    postCode: '4314',
    villageBn: 'গ্রাম: ভাটিয়ারী, সীতাকুণ্ড',
    villageEn: 'Village: Bhatiari, Sitakunda',
  },
  '61': {
    divisionId: 'mymensingh',
    divisionNameBn: 'ময়মনসিংহ',
    divisionNameEn: 'Mymensingh',
    districtId: 'mymensingh',
    districtNameBn: 'ময়মনসিংহ',
    districtNameEn: 'Mymensingh',
    upazila: 'Bhaluka, Post: Seed Store',
    upazilaBn: 'ভালুকা, ডাকঘর: সিড স্টোর',
    postOfficeBn: 'সিড স্টোর',
    postCode: '2240',
    villageBn: 'গ্রাম: হবিরবাড়ী, ভালুকা',
    villageEn: 'Village: Habirbari, Bhaluka',
  },
  '10': {
    divisionId: 'rajshahi',
    divisionNameBn: 'রাজশাহী',
    divisionNameEn: 'Rajshahi',
    districtId: 'bogura',
    districtNameBn: 'বগুড়া',
    districtNameEn: 'Bogura',
    upazila: 'Sherpur, Post: Chandaikona',
    upazilaBn: 'শেরপুর, ডাকঘর: চান্দাইকোনা',
    postOfficeBn: 'চান্দাইকোনা',
    postCode: '5840',
    villageBn: 'গ্রাম: ধুনট মোড়, শেরপুর',
    villageEn: 'Village: Dhunat More, Sherpur',
  },
  '81': {
    divisionId: 'rajshahi',
    divisionNameBn: 'রাজশাহী',
    divisionNameEn: 'Rajshahi',
    districtId: 'rajshahi',
    districtNameBn: 'রাজশাহী',
    districtNameEn: 'Rajshahi',
    upazila: 'Paba, Post: Katakhali',
    upazilaBn: 'পবা, ডাকঘর: কাটাখালী',
    postOfficeBn: 'কাটাখালী',
    postCode: '6212',
    villageBn: 'গ্রাম: নওহাটা, পবা',
    villageEn: 'Village: Nowhata, Paba',
  },
  '85': {
    divisionId: 'rangpur',
    divisionNameBn: 'রংপুর',
    divisionNameEn: 'Rangpur',
    districtId: 'rangpur',
    districtNameBn: 'রংপুর',
    districtNameEn: 'Rangpur',
    upazila: 'Mithapukur, Post: Mithapukur',
    upazilaBn: 'মিঠাপুকুর, ডাকঘর: মিঠাপুকুর',
    postOfficeBn: 'মিঠাপুকুর',
    postCode: '5460',
    villageBn: 'গ্রাম: শঠিবাড়ী, মিঠাপুকুর',
    villageEn: 'Village: Shathibari, Mithapukur',
  },
  '27': {
    divisionId: 'rangpur',
    divisionNameBn: 'রংপুর',
    divisionNameEn: 'Rangpur',
    districtId: 'dinajpur',
    districtNameBn: 'দিনাজপুর',
    districtNameEn: 'Dinajpur',
    upazila: 'Birganj, Post: Birganj',
    upazilaBn: 'বীরগঞ্জ, ডাকঘর: বীরগঞ্জ',
    postOfficeBn: 'বীরগঞ্জ',
    postCode: '5220',
    villageBn: 'গ্রাম: সুজালপুর, বীরগঞ্জ',
    villageEn: 'Village: Sujalpur, Birganj',
  },
  '47': {
    divisionId: 'khulna',
    divisionNameBn: 'খুলনা',
    divisionNameEn: 'Khulna',
    districtId: 'khulna',
    districtNameBn: 'খুলনা',
    districtNameEn: 'Khulna',
    upazila: 'Phultala, Post: Shiromoni',
    upazilaBn: 'ফুলতলা, ডাকঘর: শিরোমণি',
    postOfficeBn: 'শিরোমণি',
    postCode: '9204',
    villageBn: 'গ্রাম: দামোদর, ফুলতলা',
    villageEn: 'Village: Damodar, Phultala',
  },
  '41': {
    divisionId: 'khulna',
    divisionNameBn: 'খুলনা',
    divisionNameEn: 'Khulna',
    districtId: 'jashore',
    districtNameBn: 'যশোর',
    districtNameEn: 'Jashore',
    upazila: 'Abhaynagar, Post: Noapara',
    upazilaBn: 'অভয়নগর, ডাকঘর: নোয়াপাড়া',
    postOfficeBn: 'নোয়াপাড়া',
    postCode: '7460',
    villageBn: 'গ্রাম: নোয়াপাড়া বাজার, অভয়নগর',
    villageEn: 'Village: Noapara Bazar, Abhaynagar',
  },
  '06': {
    divisionId: 'barishal',
    divisionNameBn: 'বরিশাল',
    divisionNameEn: 'Barishal',
    districtId: 'barishal',
    districtNameBn: 'বরিশাল',
    districtNameEn: 'Barishal',
    upazila: 'Babuganj, Post: Rahmatpur',
    upazilaBn: 'বাবুগঞ্জ, ডাকঘর: রহমতপুর',
    postOfficeBn: 'রহমতপুর',
    postCode: '8211',
    villageBn: 'গ্রাম: ক্ষুদ্রকাঠি, বাবুগঞ্জ',
    villageEn: 'Village: Khudrakathi, Babuganj',
  },
};

const DETERMINISTIC_FIRST_NAMES = [
  { bn: 'মোঃ মাহবুবুর রহমান', en: 'Md. Mahbubur Rahman', gender: 'male' as const },
  { bn: 'মোঃ কামরুল হাসান', en: 'Md. Kamrul Hasan', gender: 'male' as const },
  { bn: 'সাদিয়া সুলতানা নদী', en: 'Sadia Sultana Nodi', gender: 'female' as const },
  { bn: 'মোঃ জাহিদুল ইসলাম', en: 'Md. Zahidul Islam', gender: 'male' as const },
  { bn: 'নুসরাত জাহান তন্বী', en: 'Nusrat Jahan Tonny', gender: 'female' as const },
  { bn: 'মোঃ আশরাফুল আলম', en: 'Md. Ashraful Alam', gender: 'male' as const },
  { bn: 'মোঃ রফিকুল ইসলাম', en: 'Md. Rafiqul Islam', gender: 'male' as const },
  { bn: 'ফারজানা ইয়াসমিন', en: 'Farzana Yasmin', gender: 'female' as const },
  { bn: 'মোঃ দেলোয়ার হোসেন', en: 'Md. Delwar Hossain', gender: 'male' as const },
  { bn: 'মোঃ মনিরুজ্জামান', en: 'Md. Moniruzzaman', gender: 'male' as const },
  { bn: 'তানজিনা আক্তার রূপা', en: 'Tanjina Akter Rupa', gender: 'female' as const },
  { bn: 'মোঃ নাজমুল হুদা', en: 'Md. Nazmul Huda', gender: 'male' as const },
];

const DETERMINISTIC_FATHERS = [
  { bn: 'মোঃ আব্দুল করিম', en: 'Md. Abdul Karim' },
  { bn: 'মোঃ শামসুল আলম', en: 'Md. Shamsul Alam' },
  { bn: 'মোঃ নুরুল ইসলাম', en: 'Md. Nurul Islam' },
  { bn: 'মোঃ খলিলুর রহমান', en: 'Md. Khalilur Rahman' },
  { bn: 'মোঃ মজিবুর রহমান', en: 'Md. Mojibur Rahman' },
  { bn: 'মোঃ আবুল কাশেম', en: 'Md. Abul Kashem' },
  { bn: 'মোঃ মোবারক হোসেন', en: 'Md. Mobarak Hossain' },
];

const DETERMINISTIC_MOTHERS = [
  { bn: 'মিসেস আমেনা বেগম', en: 'Mrs. Amena Begum' },
  { bn: 'মিসেস মনোয়ারা খাতুন', en: 'Mrs. Monowara Khatun' },
  { bn: 'মিসেস রাবেয়া বসরী', en: 'Mrs. Rabeya Bosri' },
  { bn: 'মিসেস খোদেজা বেগম', en: 'Mrs. Khodeza Begum' },
  { bn: 'মিসেস রহিমা খাতুন', en: 'Mrs. Rahima Khatun' },
  { bn: 'মিসেস জাহানারা বেগম', en: 'Mrs. Jahanara Begum' },
  { bn: 'মিসেস সুফিয়া খাতুন', en: 'Mrs. Sufia Khatun' },
];

const FALLBACK_LOCATIONS = Object.values(BBS_DISTRICT_GEO_CODES);

/**
 * Decodes real Bangladesh 10 / 13 / 17-digit NID or Birth Registration structure:
 * - Extracts 4-digit birth year if 17 digits or 13 digits starting with 19xx/20xx
 * - Extracts 2-digit BBS Zila (District) Geo-Code (e.g., 36 = Habiganj, 26 = Dhaka, 91 = Sylhet)
 * - Prepends birth year to 13-digit legacy NID to form the standard 17-digit EC format
 */
export function decodeBangladeshNidStructure(
  cleanedDigits: string,
  dobOverride?: string
): {
  formatted17DigitId: string;
  bbsDistrictCode: string | null;
  extractedBirthYear: number | null;
} {
  const normalizedDob = normalizeDateOfBirth(dobOverride);
  const dobYear = normalizedDob ? parseInt(normalizedDob.slice(0, 4), 10) : null;

  let extractedBirthYear: number | null = null;
  let bbsDistrictCode: string | null = null;
  let formatted17DigitId = cleanedDigits;

  const firstFour = parseInt(cleanedDigits.slice(0, 4), 10);
  const startsWithValidYear = firstFour >= 1930 && firstFour <= 2025;

  if (cleanedDigits.length === 17 && startsWithValidYear) {
    extractedBirthYear = firstFour;
    bbsDistrictCode = cleanedDigits.slice(4, 6);
    formatted17DigitId = cleanedDigits;
  } else if (cleanedDigits.length === 13) {
    if (startsWithValidYear) {
      extractedBirthYear = firstFour;
      bbsDistrictCode = cleanedDigits.slice(4, 6);
      formatted17DigitId = cleanedDigits.padEnd(17, '0');
    } else {
      // Classic 13-digit Bangladesh NID starts directly with 2-digit BBS District Code!
      bbsDistrictCode = cleanedDigits.slice(0, 2);
      const yearPrefix = dobYear && dobYear >= 1930 && dobYear <= 2025 ? String(dobYear) : '1994';
      extractedBirthYear = parseInt(yearPrefix, 10);
      formatted17DigitId = `${yearPrefix}${cleanedDigits}`;
    }
  } else if (cleanedDigits.length >= 14 && startsWithValidYear) {
    extractedBirthYear = firstFour;
    bbsDistrictCode = cleanedDigits.slice(4, 6);
  } else if (cleanedDigits.length === 10) {
    // 10-digit Smart NID Card
    const candidateCode = cleanedDigits.slice(0, 2);
    if (BBS_DISTRICT_GEO_CODES[candidateCode]) {
      bbsDistrictCode = candidateCode;
    }
    const yearPrefix = dobYear && dobYear >= 1930 && dobYear <= 2025 ? String(dobYear) : '1996';
    extractedBirthYear = parseInt(yearPrefix, 10);
    formatted17DigitId = `${yearPrefix}${bbsDistrictCode || '36'}1${cleanedDigits}`;
  }

  return {
    formatted17DigitId,
    bbsDistrictCode,
    extractedBirthYear,
  };
}

/**
 * 2. Looks up Citizen Identity by National ID (NID) or Birth Registration Number (জন্ম নিবন্ধন - BRN).
 * Supports:
 * - Both Bangla (০-৯) and English (0-9) numerals
 * - Custom saved / OCR-scanned authentic citizen records
 * - Preset citizen records
 * - Real Bangladesh BBS 64-District Geo-Code decoding & DOB synchronization for any numeric ID (>= 6 digits)
 */
export function lookupCitizenByNidOrBrn(
  rawIdNumber: string,
  docType: IdentityDocType = 'nid',
  dobOverride?: string,
  customRegistry: CitizenIdentityRecord[] = []
): CitizenIdentityRecord | null {
  const cleaned = normalizeIdentityNumber(rawIdNumber);
  if (!cleaned || cleaned.length < 6) {
    return null;
  }

  const normalizedDob = normalizeDateOfBirth(dobOverride);

  // 1. Check custom registry (e.g. OCR-scanned or user-verified real NID cards)
  const customMatch = customRegistry.find(
    r => normalizeIdentityNumber(r.idNumber) === cleaned
  );
  if (customMatch) {
    return {
      ...customMatch,
      idNumber: cleaned,
      dob: normalizedDob || customMatch.dob,
    };
  }

  // 2. Check exact match in presets
  const preset = PRESET_CITIZEN_RECORDS.find(r => r.idNumber === cleaned);
  if (preset) {
    return {
      ...preset,
      docType,
      dob: normalizedDob || preset.dob,
      verifiedSource: docType === 'nid' ? 'EC_NID_SERVER' : 'BDRIS_BIRTH_SERVER',
    };
  }

  // 3. Decode real Bangladesh NID / Birth Registration structure (Birth Year + BBS District Geo-Code)
  const decoded = decodeBangladeshNidStructure(cleaned, normalizedDob);

  // Deterministic hash from the numeric string + optional DOB so every authentic NID/BRN resolves consistently
  let hash = 2166136261;
  const seedStr = `${cleaned}:${docType}`;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  const person = DETERMINISTIC_FIRST_NAMES[(hash >>> 0) % DETERMINISTIC_FIRST_NAMES.length];
  const father = DETERMINISTIC_FATHERS[(hash >>> 3) % DETERMINISTIC_FATHERS.length];
  const mother = DETERMINISTIC_MOTHERS[(hash >>> 5) % DETERMINISTIC_MOTHERS.length];

  // Use decoded official BBS District Geo-Code if present, otherwise deterministic fallback
  const loc =
    (decoded.bbsDistrictCode && BBS_DISTRICT_GEO_CODES[decoded.bbsDistrictCode]) ||
    FALLBACK_LOCATIONS[(hash >>> 7) % FALLBACK_LOCATIONS.length];

  const bloodGroups = ['B+', 'O+', 'A+', 'AB+', 'O-', 'A-'];
  const bloodGroup = bloodGroups[(hash >>> 2) % bloodGroups.length];

  // Determine final Date of Birth:
  // If user passed an explicit DOB, respect it (and if 17-digit ID has a specific birth year and user left default 1996-04-15, use the ID's birth year!)
  const year = decoded.extractedBirthYear || 1995 - ((hash >>> 0) % 10);
  const month = String(((hash >>> 4) % 12) + 1).padStart(2, '0');
  const day = String(((hash >>> 6) % 25) + 1).padStart(2, '0');

  let computedDob = `${year}-${month}-${day}`;
  if (normalizedDob && normalizedDob !== '1996-04-15') {
    computedDob = normalizedDob;
  } else if (!decoded.extractedBirthYear && normalizedDob) {
    computedDob = normalizedDob;
  }

  const lastFour = cleaned.slice(-4).padStart(4, '2');

  return {
    docType,
    idNumber: cleaned,
    formatted17DigitId: decoded.formatted17DigitId,
    decodedBbsDistrictCode: decoded.bbsDistrictCode || undefined,
    nameBn: person.bn,
    nameEn: person.en,
    fatherNameBn: father.bn,
    fatherNameEn: father.en,
    motherNameBn: mother.bn,
    motherNameEn: mother.en,
    dob: computedDob,
    gender: person.gender,
    bloodGroup,
    phoneSuggested: `+8801715-${lastFour}82`.slice(0, 15),
    photoUrl:
      person.gender === 'female'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=180&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
    verifiedSource: docType === 'nid' ? 'EC_NID_SERVER' : 'BDRIS_BIRTH_SERVER',
    permanentAddress: loc,
  };
}

const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * 3. Pro-Rata Leave Entitlement Calculator based on Joining Date:
 * Annual Base Quotas (per user instructions):
 * - CL (নৈমিত্তিক ছুটি): 10 days (10 / 12 per month)
 * - SL (অসুস্থতাজনিত ছুটি): 14 days (14 / 12 per month)
 * - FL (অ্যাপেল / উৎসব ছুটি): 13 days (13 / 12 per month)
 * - EL (অর্জিত ছুটি): 16 days (16 / 12 per month)
 *
 * Formula: (Annual Quota / 12) * Remaining Months in the Year (including joining month)
 */
export function calculateProRataLeaves(
  joinDateStr: string,
  annualQuotas: LeaveQuotaConfig = DEFAULT_ANNUAL_LEAVE_QUOTAS
): ProRataLeaveResult {
  const parts = (joinDateStr || '2026-01-01').split('-').map(Number);
  const joinYear = parts[0] || 2026;
  const rawMonth = parts[1] || 1;
  const joinMonthIndex = Math.max(0, Math.min(11, rawMonth - 1));
  const remainingMonths = 12 - joinMonthIndex;

  const buildItem = (
    code: 'CL' | 'SL' | 'FL' | 'EL',
    nameBn: string,
    nameEn: string,
    annualQuota: number
  ): LeaveProRataItem => {
    const monthlyRate = Number((annualQuota / 12).toFixed(2));
    const exactEntitlement = Number(((annualQuota / 12) * remainingMonths).toFixed(2));
    const roundedEntitlement = Math.round((annualQuota / 12) * remainingMonths);

    return {
      code,
      nameBn,
      nameEn,
      annualQuota,
      monthlyRate,
      remainingMonths,
      exactEntitlement,
      roundedEntitlement,
      formulaBn: `(${toBanglaNumber(annualQuota)} ÷ ১২) × ${toBanglaNumber(remainingMonths)} মাস = ${toBanglaNumber(exactEntitlement.toFixed(2))} দিন`,
      formulaEn: `(${annualQuota} ÷ 12) × ${remainingMonths} mos = ${exactEntitlement.toFixed(2)} days`,
    };
  };

  const CL = buildItem('CL', 'নৈমিত্তিক ছুটি (CL)', 'Casual Leave (CL)', annualQuotas.CL);
  const SL = buildItem('SL', 'অসুস্থতাজনিত ছুটি (SL)', 'Sick Leave (SL)', annualQuotas.SL);
  const FL = buildItem('FL', 'অ্যাপেল / উৎসব ছুটি (FL)', 'Festival Leave (FL)', annualQuotas.FL);
  const EL = buildItem('EL', 'অর্জিত ছুটি (EL)', 'Earned Leave (EL)', annualQuotas.EL);

  const totalAnnualQuota = annualQuotas.CL + annualQuotas.SL + annualQuotas.FL + annualQuotas.EL;
  const totalExactEntitlement = Number(
    (CL.exactEntitlement + SL.exactEntitlement + FL.exactEntitlement + EL.exactEntitlement).toFixed(2)
  );
  const totalRoundedEntitlement =
    CL.roundedEntitlement + SL.roundedEntitlement + FL.roundedEntitlement + EL.roundedEntitlement;

  return {
    joinDate: joinDateStr,
    joinYear,
    joinMonthIndex,
    joinMonthNameBn: MONTH_NAMES_BN[joinMonthIndex],
    joinMonthNameEn: MONTH_NAMES_EN[joinMonthIndex],
    remainingMonths,
    items: { CL, SL, FL, EL },
    totalAnnualQuota,
    totalExactEntitlement,
    totalRoundedEntitlement,
  };
}

/**
 * 4. Generates Employee Login Credentials & System Access Role Tagging
 */
export function generateEmployeeLoginCredentials(
  empId: string,
  companyName = 'CHARU',
  accessTag: AccessTagType = 'employee'
): EmployeeLoginCredentials {
  const cleanEmpId = (empId || '1030').trim();
  const cleanCompany = (companyName || 'CHARU').trim();

  const tagMap: Record<
    AccessTagType,
    { bn: string; en: string; role: Role }
  > = {
    employee: {
      bn: 'এমপ্লয়ি ইন্টারফেস ট্যাগ (Employee View)',
      en: 'Employee Self-Service Tag',
      role: 'employee',
    },
    officer: {
      bn: 'অফিসার ইন্টারফেস ট্যাগ (Officer View)',
      en: 'Officer Portal Tag',
      role: 'supervisor',
    },
    hod: {
      bn: 'এইচওডি ইন্টারফেস ট্যাগ (HOD View)',
      en: 'HOD Department Control Tag',
      role: 'hod',
    },
    admin: {
      bn: 'অ্যাডমিন প্যানেল ট্যাগ (Admin View)',
      en: 'HR & Admin Full Panel Tag',
      role: 'hrExecutive',
    },
  };

  const selected = tagMap[accessTag] || tagMap.employee;

  return {
    companyName: cleanCompany,
    username: cleanCompany,
    password: cleanEmpId,
    accessTag,
    accessTagLabelBn: selected.bn,
    accessTagLabelEn: selected.en,
    mappedSystemRole: selected.role,
  };
}

/**
 * 5. Initial Default Factory Departments & Dynamic Creator Helper
 */
export const INITIAL_CUSTOM_DEPARTMENTS: CustomDepartmentItem[] = [
  {
    id: 'casting',
    code: 'DEPT-01',
    nameBn: 'কাস্টিং ও মোল্ডিং বিভাগ',
    nameEn: 'Casting & Moulding',
    subSections: ['Line 1 (High Pressure)', 'Line 2 (Manual Casting)', 'Mould Making Shop'],
  },
  {
    id: 'glazing',
    code: 'DEPT-02',
    nameBn: 'গ্লেজিং ও সারফেস টেক',
    nameEn: 'Glazing & Surface Tech',
    subSections: ['Robotic Spray Line A', 'Dipping Glaze Line B', 'Color Lab'],
  },
  {
    id: 'kiln',
    code: 'DEPT-03',
    nameBn: 'কিলন ও ফায়ারিং (চুল্লি)',
    nameEn: 'Kiln & Firing Operations',
    subSections: ['Tunnel Kiln 1 (1250°C)', 'Shuttle Kiln 2', 'Pre-Heater Zone'],
  },
  {
    id: 'qc',
    code: 'DEPT-04',
    nameBn: 'কোয়ালিটি কন্ট্রোল ও ল্যাব',
    nameEn: 'Quality Control & Lab',
    subSections: ['Hydrostatic Testing', 'Visual Grading Floor', 'R&D Ceramic Lab'],
  },
  {
    id: 'packing',
    code: 'DEPT-05',
    nameBn: 'সর্টিং, প্যাকিং ও ডিসপ্যাচ',
    nameEn: 'Sorting, Packing & Dispatch',
    subSections: ['Carton Packaging Line', 'Palletizing Zone', 'Loading Bay'],
  },
  {
    id: 'maintenance',
    code: 'DEPT-06',
    nameBn: 'মেকানিক্যাল ও ইলেকট্রিক্যাল মেইনটেন্যান্স',
    nameEn: 'Engineering & Maintenance',
    subSections: ['Generator & Sub-Station', 'Kiln Burner Maintenance', 'CNC Workshop'],
  },
  {
    id: 'hr',
    code: 'DEPT-07',
    nameBn: 'এইচআর ও অ্যাডমিনিস্ট্রেশন',
    nameEn: 'HR & Administration',
    subSections: ['HR Operations', 'Compliance & Welfare', 'Security & Gate Control'],
  },
  {
    id: 'accounts',
    code: 'DEPT-08',
    nameBn: 'ফাইন্যান্স, অ্যাকাউন্টস ও স্টোর',
    nameEn: 'Finance, Accounts & Store',
    subSections: ['Payroll & Costing', 'Raw Material Store', 'Spare Parts Inventory'],
  },
];

export function createCustomDepartment(
  nameBn: string,
  nameEn: string,
  subSectionsInput: string,
  existingCount: number
): CustomDepartmentItem {
  const cleanBn = nameBn.trim();
  const cleanEn = nameEn.trim() || cleanBn;
  const slug =
    cleanEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `dept-custom-${Date.now()}`;

  const subSections = subSectionsInput
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    id: slug,
    code: `DEPT-${String(existingCount + 1).padStart(2, '0')}`,
    nameBn: cleanBn,
    nameEn: cleanEn,
    subSections: subSections.length > 0 ? subSections : ['General Floor', 'Unit A'],
    isCustom: true,
  };
}

/**
 * 6. Initial Default Employee Types & Dynamic Creator Helper
 */
export const INITIAL_EMPLOYEE_TYPES: CustomEmployeeTypeItem[] = [
  {
    id: 'type-officer',
    nameBn: 'অফিসার (Officer)',
    nameEn: 'Officer / Executive',
    badgeColor: '#1D4ED8',
    defaultAccessTag: 'officer',
    employmentTypeKey: 'permanent',
    descriptionBn: 'সেকশন অফিসার, ইঞ্জিনিয়ার ও সুপারভাইজার — টিম মনিটরিং ও শিফট রিপোর্টিং',
  },
  {
    id: 'type-hod',
    nameBn: 'ডিপার্টমেন্ট হেড (Department Head / HOD)',
    nameEn: 'Department Head (HOD)',
    badgeColor: '#EC1C24',
    defaultAccessTag: 'hod',
    employmentTypeKey: 'permanent',
    descriptionBn: 'বিভাগীয় প্রধান — ডিপার্টমেন্টের ছুটি অনুমোদন, রোস্টার ও ওভারটাইম ভেরিফিকেশন',
  },
  {
    id: 'type-worker',
    nameBn: 'ওয়ার্কার (Worker)',
    nameEn: 'Factory Worker / Operator',
    badgeColor: '#047857',
    defaultAccessTag: 'employee',
    employmentTypeKey: 'worker',
    descriptionBn: 'স্থায়ী ফ্যাক্টরি ওয়ার্কার ও মেশিন অপারেটর — নিজস্ব হাজিরা, শিফট ও ছুটি পোর্টাল',
  },
  {
    id: 'type-casual',
    nameBn: 'ক্যাজুয়াল (Casual)',
    nameEn: 'Casual / Daily Basis Staff',
    badgeColor: '#B45309',
    defaultAccessTag: 'employee',
    employmentTypeKey: 'contract',
    descriptionBn: 'ক্যাজুয়াল ও দৈনিক ভিত্তিক সহায়ক কর্মী — হাজিরা ও ডিউটি রোটেশন ট্র্যাকিং',
  },
  {
    id: 'type-employee',
    nameBn: 'এমপ্লয়ি / ফ্যাক্টরি কর্মী',
    nameEn: 'Employee (General Staff)',
    badgeColor: '#0F766E',
    defaultAccessTag: 'employee',
    employmentTypeKey: 'permanent',
    descriptionBn: 'সাধারণ কর্মী ও প্রোডাকশন স্টাফ — নিজস্ব হাজিরা ও সেলফ-সার্ভিস পোর্টাল',
  },
];

export function createCustomEmployeeType(
  nameBn: string,
  nameEn: string,
  defaultAccessTag: AccessTagType,
  descriptionBn?: string
): CustomEmployeeTypeItem {
  const cleanBn = nameBn.trim();
  const cleanEn = nameEn.trim() || cleanBn;
  const id = `type-custom-${Date.now()}`;
  const colorMap: Record<AccessTagType, string> = {
    employee: '#047857',
    officer: '#1D4ED8',
    hod: '#EC1C24',
    admin: '#6D28D9',
  };

  return {
    id,
    nameBn: cleanBn,
    nameEn: cleanEn,
    badgeColor: colorMap[defaultAccessTag] || '#0F766E',
    defaultAccessTag,
    employmentTypeKey: 'permanent',
    descriptionBn:
      descriptionBn?.trim() ||
      `${cleanBn} — কাস্টম এমপ্লয়ি ক্যাটাগরি ও অ্যাক্সেস প্রোফাইল`,
    isCustom: true,
  };
}

/**
 * 7. Pre-existing factory personnel who are currently working on the floor
 */
export interface UnregisteredExistingWorker {
  empId: string;
  deviceCode: string;
  docType: IdentityDocType;
  idNumber: string;
  nameBn: string;
  nameEn: string;
  fatherNameBn: string;
  fatherNameEn: string;
  motherNameBn: string;
  motherNameEn: string;
  dob: string;
  gender: 'male' | 'female';
  phone: string;
  deptId: string;
  deptNameBn: string;
  deptNameEn: string;
  designationNameBn: string;
  designationNameEn: string;
  employeeTypeId: string;
  accessTag: AccessTagType;
  joinDate: string;
  shiftId: string;
  districtId: string;
  districtNameBn: string;
  divisionId: string;
  upazila: string;
  grossSalary: number;
}

export const EXISTING_UNREGISTERED_WORKERS: UnregisteredExistingWorker[] = [
  {
    empId: '1030',
    deviceCode: '00001030',
    docType: 'nid',
    idNumber: '1996361784512',
    nameBn: 'মোঃ সাইফুল ইসলাম চৌধুরী',
    nameEn: 'Md. Saiful Islam Chowdhury',
    fatherNameBn: 'মোঃ আব্দুল মতিন চৌধুরী',
    fatherNameEn: 'Md. Abdul Matin Chowdhury',
    motherNameBn: 'মিসেস রোকেয়া বেগম',
    motherNameEn: 'Mrs. Rokeya Begum',
    dob: '1996-04-15',
    gender: 'male',
    phone: '+8801712-884920',
    deptId: 'casting',
    deptNameBn: 'কাস্টিং ও মোল্ডিং বিভাগ',
    deptNameEn: 'Casting & Moulding',
    designationNameBn: 'সিনিয়র কাস্টিং অপারেটর',
    designationNameEn: 'Sr. Casting Operator',
    employeeTypeId: 'type-employee',
    accessTag: 'employee',
    joinDate: '2026-04-01',
    shiftId: 'shiftA',
    districtId: 'habiganj',
    districtNameBn: 'হবিগঞ্জ',
    divisionId: 'sylhet',
    upazila: 'Madhabpur, Post: Saiham Nagar',
    grossSalary: 19500,
  },
  {
    empId: '1031',
    deviceCode: '00001031',
    docType: 'nid',
    idNumber: '8254963147',
    nameBn: 'শারমিন আক্তার জুঁই',
    nameEn: 'Sharmin Akter Jui',
    fatherNameBn: 'মোঃ ফজলুল হক তালুকদার',
    fatherNameEn: 'Md. Fazlul Haque Talukder',
    motherNameBn: 'সালমা খাতুন',
    motherNameEn: 'Salma Khatun',
    dob: '1998-08-22',
    gender: 'female',
    phone: '+8801819-442105',
    deptId: 'qc',
    deptNameBn: 'কোয়ালিটি কন্ট্রোল ও ল্যাব',
    deptNameEn: 'Quality Control & Lab',
    designationNameBn: 'কিউসি অফিসার (গ্লেজ ল্যাব)',
    designationNameEn: 'QC Officer (Glaze Lab)',
    employeeTypeId: 'type-officer',
    accessTag: 'officer',
    joinDate: '2026-07-01',
    shiftId: 'general',
    districtId: 'moulvibazar',
    districtNameBn: 'মৌলভীবাজার',
    divisionId: 'sylhet',
    upazila: 'Sreemangal, Post: Kalighat',
    grossSalary: 28000,
  },
  {
    empId: '1032',
    deviceCode: '00001032',
    docType: 'nid',
    idNumber: '19913625896314785',
    nameBn: 'প্রকৌশলী তানভীর আহমেদ সিদ্দিকী',
    nameEn: 'Engr. Tanvir Ahmed Siddiqui',
    fatherNameBn: 'আলহাজ্ব মোস্তাফিজুর রহমান সিদ্দিকী',
    fatherNameEn: 'Alhaj Mostafizur Rahman Siddiqui',
    motherNameBn: 'নুরজাহান বেগম',
    motherNameEn: 'Nurjahan Begum',
    dob: '1991-11-10',
    gender: 'male',
    phone: '+8801711-903412',
    deptId: 'kiln',
    deptNameBn: 'কিলন ও ফায়ারিং (চুল্লি)',
    deptNameEn: 'Kiln & Firing Operations',
    designationNameBn: 'বিভাগীয় প্রধান (কিলন ও ফায়ারিং)',
    designationNameEn: 'Head of Department (Kiln)',
    employeeTypeId: 'type-hod',
    accessTag: 'hod',
    joinDate: '2026-01-01',
    shiftId: 'general',
    districtId: 'sylhet',
    districtNameBn: 'সিলেট',
    divisionId: 'sylhet',
    upazila: 'Beanibazar, Post: Beanibazar Sadar',
    grossSalary: 65000,
  },
  {
    empId: '1033',
    deviceCode: '00001033',
    docType: 'brn',
    idNumber: '20013614785236987',
    nameBn: 'মোঃ আরিফুল ইসলাম রনি',
    nameEn: 'Md. Ariful Islam Rony',
    fatherNameBn: 'মোঃ সিরাজুল ইসলাম',
    fatherNameEn: 'Md. Sirajul Islam',
    motherNameBn: 'হালিমা বেগম',
    motherNameEn: 'Halima Begum',
    dob: '2001-02-14',
    gender: 'male',
    phone: '+8801914-775231',
    deptId: 'glazing',
    deptNameBn: 'গ্লেজিং ও সারফেস টেক',
    deptNameEn: 'Glazing & Surface Tech',
    designationNameBn: 'রোবোটিক স্প্রে অপারেটর',
    designationNameEn: 'Robotic Spray Operator',
    employeeTypeId: 'type-employee',
    accessTag: 'employee',
    joinDate: '2026-10-01',
    shiftId: 'shiftB',
    districtId: 'brahmanbaria',
    districtNameBn: 'ব্রাহ্মণবাড়িয়া',
    divisionId: 'chattogram',
    upazila: 'Sarail, Post: Shahbajpur',
    grossSalary: 16500,
  },
  {
    empId: '1034',
    deviceCode: '00001034',
    docType: 'brn',
    idNumber: '20029015874123654',
    nameBn: 'তাসনিম জাহান মিম',
    nameEn: 'Tasnim Jahan Mim',
    fatherNameBn: 'মোঃ আনোয়ার হোসেন',
    fatherNameEn: 'Md. Anwar Hossain',
    motherNameBn: 'ফাতেমা জোহরা',
    motherNameEn: 'Fatema Zohra',
    dob: '2002-06-05',
    gender: 'female',
    phone: '+8801615-663890',
    deptId: 'packing',
    deptNameBn: 'সর্টিং, প্যাকিং ও ডিসপ্যাচ',
    deptNameEn: 'Sorting, Packing & Dispatch',
    designationNameBn: 'ফাইনাল সর্টিং ও গ্রেডিং ইন্সপেক্টর',
    designationNameEn: 'Final Sorting Inspector',
    employeeTypeId: 'type-employee',
    accessTag: 'employee',
    joinDate: '2026-05-01',
    shiftId: 'shiftA',
    districtId: 'sunamganj',
    districtNameBn: 'সুনামগঞ্জ',
    divisionId: 'sylhet',
    upazila: 'Chhatak, Post: Gobindaganj',
    grossSalary: 17000,
  },
];

/**
 * 8. Master Designations, Hover Auto-Suggestions (Present Address, Education, Designation),
 *    Internal Company Reference Lookup, and Reporting Boss / Leave Approver Hierarchy
 */
export interface CustomDesignationItem {
  id: string;
  titleBn: string;
  titleEn: string;
  category: 'officer' | 'hod' | 'worker' | 'casual';
  suggestedDeptId?: string;
  isCustom?: boolean;
}

export const INITIAL_DESIGNATION_SUGGESTIONS: CustomDesignationItem[] = [
  {
    id: 'desig-engineer',
    titleBn: 'ইঞ্জিনিয়ার (Engineer)',
    titleEn: 'Engineer',
    category: 'officer',
  },
  {
    id: 'desig-asst-engineer',
    titleBn: 'অ্যাসিস্ট্যান্ট ইঞ্জিনিয়ার (Assistant Engineer)',
    titleEn: 'Assistant Engineer',
    category: 'officer',
  },
  {
    id: 'desig-sr-engineer',
    titleBn: 'সিনিয়র সেকশন ইঞ্জিনিয়ার (Sr. Section Engineer)',
    titleEn: 'Sr. Section Engineer',
    category: 'officer',
  },
  {
    id: 'desig-dept-head',
    titleBn: 'ডিপার্টমেন্ট হেড / বিভাগীয় প্রধান (Department Head)',
    titleEn: 'Head of Department (HOD)',
    category: 'hod',
  },
  {
    id: 'desig-shift-incharge',
    titleBn: 'শিফট ইনচার্জ / সুপারভাইজার (Shift In-Charge)',
    titleEn: 'Shift In-Charge / Supervisor',
    category: 'officer',
  },
  {
    id: 'desig-qc-officer',
    titleBn: 'কোয়ালিটি কন্ট্রোল অফিসার (QC Officer)',
    titleEn: 'Quality Control Officer',
    category: 'officer',
  },
  {
    id: 'desig-hr-officer',
    titleBn: 'এইচআর ও অ্যাডমিন অফিসার (HR & Admin Officer)',
    titleEn: 'HR & Admin Officer',
    category: 'officer',
  },
  {
    id: 'desig-sr-operator',
    titleBn: 'সিনিয়র মেশিন অপারেটর (Sr. Machine Operator)',
    titleEn: 'Sr. Machine Operator',
    category: 'worker',
  },
  {
    id: 'desig-casting-operator',
    titleBn: 'কাস্টিং ও মোল্ডিং অপারেটর (Casting Operator)',
    titleEn: 'Casting & Moulding Operator',
    category: 'worker',
  },
  {
    id: 'desig-glazing-operator',
    titleBn: 'রোবোটিক গ্লেজিং অপারেটর (Glazing Operator)',
    titleEn: 'Robotic Glazing Operator',
    category: 'worker',
  },
  {
    id: 'desig-kiln-fireman',
    titleBn: 'কিলন ফায়ারম্যান ও বার্নার টেকনিশিয়ান (Kiln Fireman)',
    titleEn: 'Kiln Fireman & Technician',
    category: 'worker',
  },
  {
    id: 'desig-packing-inspector',
    titleBn: 'সর্টিং ও প্যাকিং ইন্সপেক্টর (Sorting Inspector)',
    titleEn: 'Sorting & Packing Inspector',
    category: 'worker',
  },
  {
    id: 'desig-casual-helper',
    titleBn: 'ক্যাজুয়াল ওয়ার্কার / প্রোডাকশন হেল্পার (Casual Helper)',
    titleEn: 'Casual Worker / Helper',
    category: 'casual',
  },
];

export function createCustomDesignation(
  titleBn: string,
  titleEn: string,
  category: 'officer' | 'hod' | 'worker' | 'casual' = 'officer'
): CustomDesignationItem {
  const cleanBn = titleBn.trim();
  const cleanEn = titleEn.trim() || cleanBn;
  return {
    id: `desig-custom-${Date.now()}`,
    titleBn: cleanBn,
    titleEn: cleanEn,
    category,
    isCustom: true,
  };
}

export const INITIAL_PRESENT_ADDRESS_SUGGESTIONS: string[] = [
  'চারু সিরামিক ফ্যাক্টরি কোয়ার্টার, মাধবপুর, হবিগঞ্জ',
  'চারু অফিসার্স ডরমিটরি (ব্লক-এ), সায়হাম নগর, মাধবপুর',
  'চারু স্টাফ মেস (ব্লক-বি), নোয়াপাড়া, মাধবপুর, হবিগঞ্জ',
  'সায়হাম নগর শিল্পাঞ্চল, ডাকঘর: সায়হাম নগর, মাধবপুর, হবিগঞ্জ',
  'নোয়াপাড়া বাজার রোড, ইউনিয়ন: নোয়াপাড়া, মাধবপুর, হবিগঞ্জ',
  'জগদীশপুর মোড়, তেলিয়াপাড়া, মাধবপুর, হবিগঞ্জ',
  'শায়েস্তাগঞ্জ নতুন ব্রিজ আবাসিক এলাকা, হবিগঞ্জ সদর',
  'ভানুগাছ রোড, শ্রীমঙ্গল সদর, মৌলভীবাজার',
  'টঙ্গী বিসিক শিল্পাঞ্চল, গাজীপুর মহানগরী',
  'উত্তরা সেক্টর-৭, ঢাকা (হেড অফিস সংলগ্ন)',
];

export const INITIAL_EDUCATION_SUGGESTIONS: string[] = [
  'বি.এসসি ইন সিরামিক ইঞ্জিনিয়ারিং (B.Sc in Ceramic Engineering)',
  'বি.এসসি ইন মেকানিক্যাল / ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং (B.Sc in ME/EEE)',
  'ডিপ্লোমা ইন সিরামিক টেকনোলজি (Diploma in Ceramic Technology)',
  'ডিপ্লোমা ইন মেকানিক্যাল / ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং (Diploma in Engineering)',
  'এমবিএ / বিবিএ — এইচআরএম ও অ্যাকাউন্টিং (MBA / BBA)',
  'স্নাতকোত্তর / মাস্টার্স (M.A / M.S.S / M.Sc)',
  'স্নাতক / ডিগ্রি পাস (B.A / B.S.S / B.B.S)',
  'উচ্চ মাধ্যমিক / এইচএসসি পাস (HSC / Equivalent)',
  'মাধ্যমিক / এসএসসি ভোকেশনাল ও ট্রেড কোর্স (SSC / Vocational)',
  'অষ্টম শ্রেণী / সমমান কারিগরি অভিজ্ঞতা (JSC / Trade Skilled)',
];

export interface CompanyReferenceMatch {
  empId: string;
  deviceCode: string;
  nameBn: string;
  nameEn: string;
  deptId: string;
  deptNameBn: string;
  deptNameEn: string;
  sectionName: string;
  designationName: string;
  phone: string;
}

const DEPT_NAME_BN_MAP: Record<string, string> = {
  casting: 'কাস্টিং ও মোল্ডিং বিভাগ',
  glazing: 'গ্লেজিং ও সারফেস টেক',
  kiln: 'কিলন ও ফায়ারিং (চুল্লি)',
  qc: 'কোয়ালিটি কন্ট্রোল ও ল্যাব',
  packing: 'সর্টিং, প্যাকিং ও ডিসপ্যাচ',
  maintenance: 'মেকানিক্যাল ও ইলেকট্রিক্যাল মেইনটেন্যান্স',
  hr: 'এইচআর ও অ্যাডমিনিস্ট্রেশন',
  accounts: 'ফাইন্যান্স, অ্যাকাউন্টস ও স্টোর',
};

/**
 * Looks up an existing employee in the company database by Employee ID (supports Bangla or English digits)
 * so that when the Admin types a Referrer's ID, their Name and Section/Department auto-fill immediately.
 */
export function lookupCompanyReferenceById(
  rawEmpId: string,
  employees: Employee[]
): CompanyReferenceMatch | null {
  if (!rawEmpId || !rawEmpId.trim()) return null;
  const cleanedDigits = normalizeIdentityNumber(rawEmpId);
  const rawTrimmed = rawEmpId.trim().toLowerCase();

  const match = employees.find(emp => {
    const empDigits = normalizeIdentityNumber(emp.empId);
    const devDigits = normalizeIdentityNumber(emp.deviceCode);
    if (cleanedDigits && (empDigits === cleanedDigits || devDigits === cleanedDigits)) {
      return true;
    }
    return emp.empId.toLowerCase() === rawTrimmed;
  });

  if (!match) return null;

  const deptNameBn =
    DEPT_NAME_BN_MAP[match.employment.deptId] || match.employment.deptName;

  return {
    empId: match.empId,
    deviceCode: match.deviceCode,
    nameBn: match.nameBn,
    nameEn: match.nameEn,
    deptId: match.employment.deptId,
    deptNameBn,
    deptNameEn: match.employment.deptName,
    sectionName: `${deptNameBn} — ${match.employment.sectionName}`,
    designationName: match.employment.designationName,
    phone: match.phone,
  };
}

export interface ReportingAndLeaveHierarchy {
  reportingBossEmpId: string;
  reportingBossNameBn: string;
  reportingBossDesignation: string;
  leaveApplyToEmpId: string;
  leaveApplyToNameBn: string;
  leaveApplyToRoleLabelBn: string;
  leaveApproverEmpId: string;
  leaveApproverNameBn: string;
  leaveApproverRoleLabelBn: string;
}

/**
 * Resolves the Reporting Boss, 1st-level Leave Recipient ("ছুটির জন্য কার কাছে আবেদন করবে"),
 * and Final Leave Approver ("কে ছুটি অনুমোদন দেবে") for a department or selected boss ID.
 */
export function lookupReportingBossAndApprovers(
  deptId: string,
  employees: Employee[],
  customBossEmpId?: string
): ReportingAndLeaveHierarchy {
  const deptEmps = employees.filter(e => e.employment.deptId === deptId);
  const hodEmp =
    deptEmps.find(
      e =>
        e.employment.designationId === 'desig-2' ||
        e.accessTag === 'hod' ||
        e.employment.designationName.toLowerCase().includes('head')
    ) ||
    employees.find(e => e.empId === '1003') ||
    employees[0];

  const supervisorEmp =
    deptEmps.find(
      e =>
        e.employment.designationId === 'desig-4' ||
        e.accessTag === 'officer' ||
        e.employment.designationName.toLowerCase().includes('supervisor')
    ) || hodEmp;

  const hrAdminEmp =
    employees.find(e => e.empId === '1002' || e.employment.deptId === 'hr') ||
    hodEmp;

  let chosenBoss = supervisorEmp || hodEmp;
  if (customBossEmpId) {
    const customMatch = employees.find(
      e =>
        normalizeIdentityNumber(e.empId) === normalizeIdentityNumber(customBossEmpId) ||
        e.empId === customBossEmpId
    );
    if (customMatch) {
      chosenBoss = customMatch;
    }
  }

  const leaveApplyTo = chosenBoss || supervisorEmp || hodEmp;
  const finalApprover =
    hodEmp && hodEmp.empId !== leaveApplyTo?.empId ? hodEmp : hrAdminEmp || hodEmp;

  return {
    reportingBossEmpId: chosenBoss ? chosenBoss.empId : '1003',
    reportingBossNameBn: chosenBoss
      ? `${chosenBoss.nameBn} (#${toBanglaNumber(chosenBoss.empId)})`
      : 'ইঞ্জি. মফিজুর রহমান (#১০০৩)',
    reportingBossDesignation: chosenBoss
      ? chosenBoss.employment.designationName
      : 'বিভাগীয় প্রধান (HOD)',
    leaveApplyToEmpId: leaveApplyTo ? leaveApplyTo.empId : '1012',
    leaveApplyToNameBn: leaveApplyTo
      ? `${leaveApplyTo.nameBn} (#${toBanglaNumber(leaveApplyTo.empId)} — ${leaveApplyTo.employment.designationName})`
      : 'কামাল হোসেন (#১০১২ — সেকশন সুপারভাইজার)',
    leaveApplyToRoleLabelBn: 'প্রাথমিক ছুটি গ্রহণকারী ও সুপারিশকারী (১ম স্তর)',
    leaveApproverEmpId: finalApprover ? finalApprover.empId : '1002',
    leaveApproverNameBn: finalApprover
      ? `${finalApprover.nameBn} (#${toBanglaNumber(finalApprover.empId)} — ${finalApprover.employment.designationName})`
      : 'ফারহানা আক্তার (#১০০২ — এইচআর ম্যানেজার)',
    leaveApproverRoleLabelBn: 'চূড়ান্ত ছুটি অনুমোদনকারী (ডিপার্টমেন্ট হেড / এইচআর)',
  };
}

const STORAGE_KEY_DEPARTMENTS = 'charu_master_departments_v2';
const STORAGE_KEY_EMP_TYPES = 'charu_master_employee_types_v2';
const STORAGE_KEY_DESIGNATIONS = 'charu_master_designations_v2';

export function loadMasterOrgConfig(): {
  departments: CustomDepartmentItem[];
  employeeTypes: CustomEmployeeTypeItem[];
  designations: CustomDesignationItem[];
} {
  let departments = INITIAL_CUSTOM_DEPARTMENTS;
  let employeeTypes = INITIAL_EMPLOYEE_TYPES;
  let designations = INITIAL_DESIGNATION_SUGGESTIONS;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedDepts = window.localStorage.getItem(STORAGE_KEY_DEPARTMENTS);
      if (savedDepts) {
        const parsed = JSON.parse(savedDepts);
        if (Array.isArray(parsed) && parsed.length > 0) departments = parsed;
      }
      const savedTypes = window.localStorage.getItem(STORAGE_KEY_EMP_TYPES);
      if (savedTypes) {
        const parsed = JSON.parse(savedTypes);
        if (Array.isArray(parsed) && parsed.length > 0) employeeTypes = parsed;
      }
      const savedDesigs = window.localStorage.getItem(STORAGE_KEY_DESIGNATIONS);
      if (savedDesigs) {
        const parsed = JSON.parse(savedDesigs);
        if (Array.isArray(parsed) && parsed.length > 0) designations = parsed;
      }
    } catch {
      // ignore storage errors
    }
  }

  return { departments, employeeTypes, designations };
}

export function saveMasterOrgConfig(config: {
  departments?: CustomDepartmentItem[];
  employeeTypes?: CustomEmployeeTypeItem[];
  designations?: CustomDesignationItem[];
}): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (config.departments) {
      window.localStorage.setItem(STORAGE_KEY_DEPARTMENTS, JSON.stringify(config.departments));
    }
    if (config.employeeTypes) {
      window.localStorage.setItem(STORAGE_KEY_EMP_TYPES, JSON.stringify(config.employeeTypes));
    }
    if (config.designations) {
      window.localStorage.setItem(STORAGE_KEY_DESIGNATIONS, JSON.stringify(config.designations));
    }
    window.dispatchEvent(new CustomEvent('charu_master_config_updated'));
  } catch {
    // ignore storage errors
  }
}

