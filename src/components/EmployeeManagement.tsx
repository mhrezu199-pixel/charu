/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Charu Ceramic Industries Ltd — Admin-Only Employee Onboarding & Database Import Hub
 * Features:
 * 1. Simplified Manual Personal, Address (Hover/Type Autocomplete), Education, NID, Mobile, Salary & Internal Company Reference Auto-Fill (ID -> Name & Section)
 * 2. Employment Setup: Employee Type (Officer, Department Head, Worker, Casual — synced from Settings), Department, Designation (Hover/Type Autocomplete), Joining Date, Reporting Boss & Leave Approval Hierarchy
 * 3. Auto-Generated Login Credentials (Username = CHARU, Password = Employee ID) & Pro-Rata Leave Calculator (CL: 10, SL: 14, FL: 13, EL: 16)
 * 4. 1-Click Legacy Floor Personnel Import & Master Employee Directory
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  UserPlus,
  Search,
  MapPin,
  Briefcase,
  Building2,
  ShieldCheck,
  KeyRound,
  Calendar,
  Calculator,
  CheckCircle2,
  Sparkles,
  Users,
  Database,
  UploadCloud,
  Copy,
  Check,
  GraduationCap,
  Phone,
  Banknote,
  UserCheck,
  GitBranch,
  Settings,
  ChevronDown,
  FileBadge,
} from 'lucide-react';
import { Employee, LeaveBalance, Locale } from '../types';
import { BANGLADESH_DISTRICTS, BANGLADESH_DIVISIONS } from '../data/districts';
import {
  AccessTagType,
  CustomDepartmentItem,
  CustomEmployeeTypeItem,
  CustomDesignationItem,
  EXISTING_UNREGISTERED_WORKERS,
  UnregisteredExistingWorker,
  INITIAL_PRESENT_ADDRESS_SUGGESTIONS,
  INITIAL_EDUCATION_SUGGESTIONS,
  calculateProRataLeaves,
  generateEmployeeLoginCredentials,
  lookupCompanyReferenceById,
  lookupReportingBossAndApprovers,
  loadMasterOrgConfig,
  toBanglaNumber,
} from '../utils/onboardingRules';

interface EmployeeManagementProps {
  employees: Employee[];
  locale: Locale;
  onAddEmployee: (emp: Employee) => void;
  onAddLeaveBalance?: (balance: LeaveBalance) => void;
  onNavigateSettings?: () => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  locale,
  onAddEmployee,
  onAddLeaveBalance,
  onNavigateSettings,
}) => {
  // Primary Admin Tabs: 'onboarding' (Manual Onboarding + Legacy Import) vs 'directory' (Full Database List)
  const [activeTab, setActiveTab] = useState<'onboarding' | 'directory'>('onboarding');

  // Master Departments, Employee Types & Designations loaded from Settings / Power Control
  const [departments, setDepartments] = useState<CustomDepartmentItem[]>(
    () => loadMasterOrgConfig().departments
  );
  const [employeeTypes, setEmployeeTypes] = useState<CustomEmployeeTypeItem[]>(
    () => loadMasterOrgConfig().employeeTypes
  );
  const [designationBank, setDesignationBank] = useState<CustomDesignationItem[]>(
    () => loadMasterOrgConfig().designations
  );

  useEffect(() => {
    const refreshMaster = () => {
      const cfg = loadMasterOrgConfig();
      setDepartments(cfg.departments);
      setEmployeeTypes(cfg.employeeTypes);
      setDesignationBank(cfg.designations);
    };
    refreshMaster();
    window.addEventListener('charu_master_config_updated', refreshMaster);
    return () => window.removeEventListener('charu_master_config_updated', refreshMaster);
  }, []);

  // ============================================================================
  // SECTION 1: MANUAL PERSONAL, ADDRESS (HOVER AUTOCOMPLETE), EDUCATION, SALARY & REFERENCE
  // ============================================================================
  const [nameBn, setNameBn] = useState<string>('মোঃ সাইফুল ইসলাম চৌধুরী');
  const [nameEn, setNameEn] = useState<string>('Md. Saiful Islam Chowdhury');
  const [fatherNameBn, setFatherNameBn] = useState<string>('মোঃ আব্দুল মতিন চৌধুরী');
  const [motherNameBn, setMotherNameBn] = useState<string>('মিসেস রোকেয়া বেগম');

  // Present Address with Hover / Type-ahead Autocomplete
  const [presentAddress, setPresentAddress] = useState<string>(
    'চারু সিরামিক ফ্যাক্টরি কোয়ার্টার, মাধবপুর, হবিগঞ্জ'
  );
  const [showPresentHover, setShowPresentHover] = useState<boolean>(false);

  // Permanent Address (Division + 64 District + Upazila/Village with Hover Autocomplete)
  const [divisionId, setDivisionId] = useState<string>('sylhet');
  const [districtId, setDistrictId] = useState<string>('habiganj');
  const [permanentUpazilaDetails, setPermanentUpazilaDetails] = useState<string>(
    'মাধবপুর, ডাকঘর: সায়হাম নগর, গ্রাম: নোয়াপাড়া'
  );
  const [showPermHover, setShowPermHover] = useState<boolean>(false);

  // Education (Hover Autocomplete), NID, Mobile, DOB, Gender, Blood Group, Salary
  const [educationBn, setEducationBn] = useState<string>(
    'ডিপ্লোমা ইন সিরামিক টেকনোলজি (Diploma in Ceramic Technology)'
  );
  const [showEduHover, setShowEduHover] = useState<boolean>(false);
  const [nidNumber, setNidNumber] = useState<string>('1996361784512');
  const [phone, setPhone] = useState<string>('+8801712-884920');
  const [grossSalary, setGrossSalary] = useState<number>(22500);
  const [dob, setDob] = useState<string>('1996-04-15');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [bloodGroup, setBloodGroup] = useState<string>('B+');
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80'
  );

  // Internal Company Reference ("রেফারেন্স — আমাদের কোম্পানির কোন লোকটা তাকে রেফার করছে")
  const [referrerEmpId, setReferrerEmpId] = useState<string>('1003');
  const [referrerNameBn, setReferrerNameBn] = useState<string>('ইঞ্জি. মফিজুর রহমান');
  const [referrerSectionBn, setReferrerSectionBn] = useState<string>(
    'কাস্টিং ও মোল্ডিং বিভাগ — Line 1 (High Pressure)'
  );
  const [referrerAutoMatched, setReferrerAutoMatched] = useState<boolean>(true);
  const [showReferrerHover, setShowReferrerHover] = useState<boolean>(false);

  // ============================================================================
  // SECTION 2: EMPLOYMENT TYPE, DEPARTMENT, DESIGNATION (HOVER), JOIN DATE & BOSS/LEAVE CHAIN
  // ============================================================================
  const [empId, setEmpId] = useState<string>(() => String(1030 + employees.length));
  const [deviceCode, setDeviceCode] = useState<string>(() =>
    String(1030 + employees.length).padStart(8, '0')
  );
  const [selectedEmpTypeId, setSelectedEmpTypeId] = useState<string>('type-officer');
  const [accessTag, setAccessTag] = useState<AccessTagType>('officer');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('casting');
  const [selectedSubSection, setSelectedSubSection] = useState<string>('Line 1 (High Pressure)');

  // Designation with Hover / Type-ahead Autocomplete ("ইঞ্জিনিয়ার, অ্যাসিস্ট্যান্ট ইঞ্জিনিয়ার")
  const [designationName, setDesignationName] = useState<string>(
    'অ্যাসিস্ট্যান্ট ইঞ্জিনিয়ার (Assistant Engineer)'
  );
  const [showDesigHover, setShowDesigHover] = useState<boolean>(false);

  const [joinDate, setJoinDate] = useState<string>('2026-04-01');
  const [shiftId, setShiftId] = useState<string>('general');

  // Reporting Boss & Leave Approval Hierarchy ("রিপোর্টিং বস কে, কার কাছে ছুটি চাইবে, কে ছুটি অনুমোদন দেবে")
  const [reportingBossEmpId, setReportingBossEmpId] = useState<string>('1012');
  const [reportingBossName, setReportingBossName] = useState<string>(
    'কামাল হোসেন (#১০১২ — সেকশন সুপারভাইজার)'
  );
  const [leaveApplyToName, setLeaveApplyToName] = useState<string>(
    'কামাল হোসেন (#১০১২ — প্রাথমিক সুপারিশকারী)'
  );
  const [leaveApproverName, setLeaveApproverName] = useState<string>(
    'ইঞ্জি. মফিজুর রহমান (#১০০৩ — ডিপার্টমেন্ট হেড / HOD)'
  );

  // ============================================================================
  // SECTION 3: CREDENTIALS, PRO-RATA LEAVE & FEEDBACK STATE
  // ============================================================================
  const [copiedCreds, setCopiedCreds] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<{
    nameBn: string;
    empId: string;
    username: string;
    password: string;
    deptBn: string;
    empTypeBn: string;
    totalLeaveDays: number;
    referrerInfo: string;
    bossInfo: string;
  } | null>(null);

  // Directory filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Auto-fill Referrer Name & Section when Referrer Employee ID is typed!
  const handleReferrerIdChange = (val: string) => {
    setReferrerEmpId(val);
    const matched = lookupCompanyReferenceById(val, employees);
    if (matched) {
      setReferrerNameBn(matched.nameBn);
      setReferrerSectionBn(`${matched.deptNameBn} — ${matched.designationName}`);
      setReferrerAutoMatched(true);
    } else {
      setReferrerAutoMatched(false);
    }
  };

  const handleSelectReferrerEmployee = (emp: Employee) => {
    setReferrerEmpId(emp.empId);
    const matched = lookupCompanyReferenceById(emp.empId, employees);
    if (matched) {
      setReferrerNameBn(matched.nameBn);
      setReferrerSectionBn(`${matched.deptNameBn} — ${matched.designationName}`);
      setReferrerAutoMatched(true);
    }
    setShowReferrerHover(false);
  };

  // Auto-update Reporting Boss & Leave Approver when Department changes
  const handleDepartmentChange = (newDeptId: string) => {
    setSelectedDeptId(newDeptId);
    const foundDept = departments.find(d => d.id === newDeptId);
    if (foundDept && foundDept.subSections.length > 0) {
      setSelectedSubSection(foundDept.subSections[0]);
    }
    const chain = lookupReportingBossAndApprovers(newDeptId, employees);
    setReportingBossEmpId(chain.reportingBossEmpId);
    setReportingBossName(chain.reportingBossNameBn);
    setLeaveApplyToName(chain.leaveApplyToNameBn);
    setLeaveApproverName(chain.leaveApproverNameBn);
  };

  const handleReportingBossSelect = (bossEmpId: string) => {
    setReportingBossEmpId(bossEmpId);
    const chain = lookupReportingBossAndApprovers(selectedDeptId, employees, bossEmpId);
    setReportingBossName(chain.reportingBossNameBn);
    setLeaveApplyToName(chain.leaveApplyToNameBn);
    setLeaveApproverName(chain.leaveApproverNameBn);
  };

  // Filtered Present Address suggestions
  const filteredPresentSuggestions = useMemo(() => {
    const q = presentAddress.trim().toLowerCase();
    if (!q) return INITIAL_PRESENT_ADDRESS_SUGGESTIONS;
    const matches = INITIAL_PRESENT_ADDRESS_SUGGESTIONS.filter(item =>
      item.toLowerCase().includes(q)
    );
    return matches.length > 0 ? matches : INITIAL_PRESENT_ADDRESS_SUGGESTIONS;
  }, [presentAddress]);

  // Filtered Education suggestions
  const filteredEduSuggestions = useMemo(() => {
    const q = educationBn.trim().toLowerCase();
    if (!q) return INITIAL_EDUCATION_SUGGESTIONS;
    const matches = INITIAL_EDUCATION_SUGGESTIONS.filter(item =>
      item.toLowerCase().includes(q)
    );
    return matches.length > 0 ? matches : INITIAL_EDUCATION_SUGGESTIONS;
  }, [educationBn]);

  // Filtered Designation suggestions ("ইঞ্জিনিয়ার, অ্যাসিস্ট্যান্ট ইঞ্জিনিয়ার")
  const filteredDesignationSuggestions = useMemo(() => {
    const q = designationName.trim().toLowerCase();
    if (!q) return designationBank;
    const matches = designationBank.filter(
      d =>
        d.titleBn.toLowerCase().includes(q) ||
        d.titleEn.toLowerCase().includes(q)
    );
    return matches.length > 0 ? matches : designationBank;
  }, [designationName, designationBank]);

  // Permanent Address District & Upazila suggestions
  const currentDistrictObj = useMemo(
    () => BANGLADESH_DISTRICTS.find(d => d.id === districtId) || BANGLADESH_DISTRICTS[0],
    [districtId]
  );

  const permanentAddressSuggestions = useMemo(() => {
    const distBn = currentDistrictObj?.nameBn || 'হবিগঞ্জ';
    return [
      `${distBn} সদর, ডাকঘর: ${distBn} সদর, গ্রাম: কলেজ পাড়া`,
      `মাধবপুর, ডাকঘর: সায়হাম নগর, গ্রাম: নোয়াপাড়া (${distBn})`,
      `চুনারুঘাট / শ্রীমঙ্গল রোড, ডাকঘর: চান্দপুর (${distBn})`,
      `নবীগঞ্জ / বানিয়াচং, ডাকঘর: সদর, গ্রাম: উত্তর পাড়া (${distBn})`,
    ];
  }, [currentDistrictObj]);

  // Pro-rata Leave Calculation (CL: 10, SL: 14, FL: 13, EL: 16)
  const proRataLeave = useMemo(() => calculateProRataLeaves(joinDate), [joinDate]);

  // Auto-generated Login Credentials (Username = CHARU, Password = Employee ID)
  const loginCreds = useMemo(
    () => generateEmployeeLoginCredentials(empId, 'CHARU', accessTag),
    [empId, accessTag]
  );

  const selectedDeptObj = useMemo(
    () => departments.find(d => d.id === selectedDeptId) || departments[0],
    [departments, selectedDeptId]
  );

  const selectedEmpTypeObj = useMemo(
    () => employeeTypes.find(t => t.id === selectedEmpTypeId) || employeeTypes[0],
    [employeeTypes, selectedEmpTypeId]
  );

  // Sync employee type selection with access tag
  const handleSelectEmpType = (typeId: string) => {
    setSelectedEmpTypeId(typeId);
    const found = employeeTypes.find(t => t.id === typeId);
    if (found) {
      setAccessTag(found.defaultAccessTag);
    }
  };

  // Load a pre-existing unregistered factory worker into the form
  const handleLoadExistingWorker = (worker: UnregisteredExistingWorker) => {
    setEmpId(worker.empId);
    setDeviceCode(worker.deviceCode);
    setNidNumber(worker.idNumber);
    setNameBn(worker.nameBn);
    setNameEn(worker.nameEn);
    setFatherNameBn(worker.fatherNameBn);
    setMotherNameBn(worker.motherNameBn);
    setDob(worker.dob);
    setGender(worker.gender);
    setPhone(worker.phone);
    setDivisionId(worker.divisionId);
    setDistrictId(worker.districtId);
    setPermanentUpazilaDetails(worker.upazila);
    setPresentAddress('চারু সিরামিক ফ্যাক্টরি কোয়ার্টার, মাধবপুর, হবিগঞ্জ');
    setSelectedDeptId(worker.deptId);
    setDesignationName(worker.designationNameBn);
    setSelectedEmpTypeId(worker.employeeTypeId);
    setAccessTag(worker.accessTag);
    setJoinDate(worker.joinDate);
    setShiftId(worker.shiftId);
    setGrossSalary(worker.grossSalary);
    handleDepartmentChange(worker.deptId);
  };

  // Submit & Onboard Employee into Master Database
  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim() || !empId.trim()) return;

    const newEmployee: Employee = {
      empId: empId.trim(),
      deviceCode: deviceCode.trim() || empId.trim().padStart(8, '0'),
      nameBn: nameBn.trim(),
      nameEn: nameEn.trim() || nameBn.trim(),
      photoUrl,
      gender,
      dob,
      phone: phone.trim(),
      workEmail: `emp${empId.trim()}@charuceramic.com`,
      address: {
        permanent: {
          divisionId,
          districtId,
          upazila: permanentUpazilaDetails,
          details: `${permanentUpazilaDetails}, ${currentDistrictObj?.nameBn || ''}`,
        },
        present: {
          divisionId: 'sylhet',
          districtId: 'habiganj',
          upazila: presentAddress,
          details: presentAddress,
        },
      },
      homeDistrictId: districtId,
      employment: {
        joinDate,
        confirmationDate: null,
        type: selectedEmpTypeObj?.employmentTypeKey || 'permanent',
        deptId: selectedDeptId,
        deptName: selectedDeptObj?.nameEn || 'Casting & Moulding',
        sectionId: `${selectedDeptId}-sec-1`,
        sectionName: selectedSubSection || 'Main Section',
        designationId:
          accessTag === 'hod'
            ? 'desig-2'
            : accessTag === 'officer'
            ? 'desig-4'
            : 'desig-6',
        designationName: designationName.trim() || 'অফিসার',
        gradeId: accessTag === 'hod' ? 'G-2' : accessTag === 'officer' ? 'G-4' : 'G-6',
        locationId: 'factory-habiganj',
        managerEmpId: reportingBossEmpId || '1012',
        hodEmpId: '1003',
      },
      schedule: {
        defaultShiftId: shiftId,
        weeklyOff: {
          mode: 'weekday',
          weekday: 5,
        },
      },
      status: 'active',
      privateInfo: {
        nid: nidNumber.trim(),
        bloodGroup,
        bank: {
          bankName: 'Dutch-Bangla Bank PLC',
          branch: 'Madhabpur Branch',
          accountNo: `701.105.${empId.trim()}99`,
          routing: '090360452',
        },
        family: [
          { name: fatherNameBn, relation: 'Father', phone },
          { name: motherNameBn, relation: 'Mother', phone },
        ],
        emergencyContact: { name: fatherNameBn, phone },
        salary: {
          gross: Number(grossSalary) || 20000,
          basic: Math.round((Number(grossSalary) || 20000) * 0.6),
          structureId: 'grade-standard',
        },
      },
      isActive: true,
      fatherNameBn,
      motherNameBn,
      idDocType: 'nid',
      nidOrBrn: nidNumber.trim(),
      employeeTypeId: selectedEmpTypeId,
      employeeTypeNameBn: selectedEmpTypeObj?.nameBn || 'অফিসার (Officer)',
      accessTag,
      loginCredentials: {
        username: loginCreds.username,
        password: loginCreds.password,
      },
      proRataLeaves: {
        CL: proRataLeave.items.CL.roundedEntitlement,
        SL: proRataLeave.items.SL.roundedEntitlement,
        FL: proRataLeave.items.FL.roundedEntitlement,
        EL: proRataLeave.items.EL.roundedEntitlement,
        total: proRataLeave.totalRoundedEntitlement,
      },
      educationBn: educationBn.trim(),
      presentAddressText: presentAddress.trim(),
      reference: {
        empId: referrerEmpId.trim(),
        nameBn: referrerNameBn.trim(),
        sectionName: referrerSectionBn.trim(),
      },
      approvalChain: {
        reportingBossEmpId,
        reportingBossName,
        leaveApplyToName,
        leaveApproverName,
      },
    };

    onAddEmployee(newEmployee);

    if (onAddLeaveBalance) {
      const newLeaveBalance: LeaveBalance = {
        empId: newEmployee.empId,
        year: proRataLeave.joinYear,
        balances: {
          CL: {
            entitled: proRataLeave.items.CL.roundedEntitlement,
            used: 0,
            pending: 0,
            carried: 0,
          },
          SL: {
            entitled: proRataLeave.items.SL.roundedEntitlement,
            used: 0,
            pending: 0,
            carried: 0,
          },
          FL: {
            entitled: proRataLeave.items.FL.roundedEntitlement,
            used: 0,
            pending: 0,
            carried: 0,
          },
          EL: {
            entitled: proRataLeave.items.EL.roundedEntitlement,
            used: 0,
            pending: 0,
            carried: 0,
          },
        },
      };
      onAddLeaveBalance(newLeaveBalance);
    }

    setSuccessBanner({
      nameBn: newEmployee.nameBn,
      empId: newEmployee.empId,
      username: loginCreds.username,
      password: loginCreds.password,
      deptBn: selectedDeptObj?.nameBn || '',
      empTypeBn: selectedEmpTypeObj?.nameBn || '',
      totalLeaveDays: proRataLeave.totalRoundedEntitlement,
      referrerInfo: `${referrerNameBn} (আইডি #${toBanglaNumber(referrerEmpId)})`,
      bossInfo: reportingBossName,
    });

    const nextNum = parseInt(empId, 10) + 1 || 1050;
    setEmpId(String(nextNum));
    setDeviceCode(String(nextNum).padStart(8, '0'));
  };

  // Filtered directory list
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        e.nameEn.toLowerCase().includes(q) ||
        e.nameBn.includes(searchQuery) ||
        e.empId.toLowerCase().includes(q) ||
        e.deviceCode.includes(q);
      const matchesDept = deptFilter === 'all' || e.employment.deptId === deptFilter;
      const matchesDist = districtFilter === 'all' || e.homeDistrictId === districtFilter;
      return matchesSearch && matchesDept && matchesDist;
    });
  }, [employees, searchQuery, deptFilter, districtFilter]);

  return (
    <div className="space-y-6">
      {/* =====================================================================
          ADMIN EXECUTIVE HEADER BANNER (Bold Corporate Typography)
         ===================================================================== */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#062C21] via-[#0B3B2D] to-[#041D15] text-white p-6 sm:p-7 shadow-xl border border-emerald-500/30">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>অ্যাডমিন এক্সক্লুসিভ — এমপ্লয়ি অনবোর্ডিং ও ডাটাবেজ ইমপোর্ট</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              নতুন কর্মী নিয়োগ, রেফারেন্স অটো-ফিল ও মাস্টার ডাটাবেজ এন্ট্রি
            </h1>
            <p className="text-sm sm:text-base font-semibold text-emerald-100/95 max-w-3xl leading-relaxed">
              সহজ ম্যানুয়াল ফর্মে কর্মীর নাম, বাবা-মায়ের নাম, বর্তমান ও স্থায়ী ঠিকানা (হোভার অটো-সাজেশনসহ), শিক্ষাগত যোগ্যতা, স্যালারি, কোম্পানি রেফারেন্স (আইডি দিলেই নাম ও সেকশন অটো-ফিল) এবং রিপোর্টিং বস ও ছুটি অনুমোদনকারী নির্ধারণ করুন।
            </p>
          </div>

          {/* Primary Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 bg-black/35 p-1.5 rounded-2xl border border-white/15 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('onboarding')}
              className={`px-4 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 transition ${
                activeTab === 'onboarding'
                  ? 'bg-amber-400 text-[#042F2E] shadow-md'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন অনবোর্ডিং ফর্ম</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 transition ${
                activeTab === 'directory'
                  ? 'bg-amber-400 text-[#042F2E] shadow-md'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>মাস্টার কর্মী তালিকা ({toBanglaNumber(employees.length)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SUCCESS BANNER AFTER ONBOARDING
         ===================================================================== */}
      {successBanner && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 border-2 border-emerald-400/50 shadow-xl animate-in fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-lg">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-extrabold">
                  অনবোর্ডিং ও ডাটাবেজ রেজিস্ট্রেশন সফলভাবে সম্পন্ন!
                </div>
                <h3 className="text-xl font-black text-white">
                  {successBanner.nameBn} — সফলভাবে ডাটাবেজে যুক্ত হয়েছেন!
                </h3>
                <p className="text-sm font-bold text-emerald-100">
                  বিভাগ: <span className="text-amber-300">{successBanner.deptBn}</span> · ক্যাটাগরি:{' '}
                  <span className="text-amber-300">{successBanner.empTypeBn}</span> · রেফারেন্স:{' '}
                  <span className="text-amber-300">{successBanner.referrerInfo}</span> · রিপোর্টিং বস:{' '}
                  <span className="text-amber-300">{successBanner.bossInfo}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-black/40 p-4 rounded-2xl border border-white/15">
              <div className="px-3 py-1.5 rounded-xl bg-white/10">
                <div className="text-xs font-bold text-emerald-300 uppercase">ইউজারনেম</div>
                <div className="text-base font-black text-white tracking-wider">
                  {successBanner.username}
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/10">
                <div className="text-xs font-bold text-amber-300 uppercase">পাসওয়ার্ড (আইডি)</div>
                <div className="text-base font-black text-amber-300 tracking-wider">
                  {successBanner.password}
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/10">
                <div className="text-xs font-bold text-emerald-300 uppercase">মোট ছুটি বরাদ্দ</div>
                <div className="text-base font-black text-white">
                  {toBanglaNumber(successBanner.totalLeaveDays)} দিন
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-extrabold text-white"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 1: SIMPLIFIED MANUAL ONBOARDING & LEGACY IMPORT
         ===================================================================== */}
      {activeTab === 'onboarding' ? (
        <div className="space-y-6">
          {/* Quick 1-Click Bar: Existing Unregistered Floor Personnel */}
          <div className="bg-white rounded-3xl border-2 border-[#E6DCD2] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-black">
                  <UploadCloud className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1E1314]">
                    কারখানায় কর্মরত অ-নিবন্ধিত কর্মীদের ১-ক্লিকে ডাটাবেজে ইমপোর্ট করুন
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-[#5E4D4E]">
                    নিচের যেকোনো কর্মীর কার্ডে ক্লিক করলে তার সকল তথ্য স্বয়ংক্রিয়ভাবে নিচের ম্যানুয়াল ফর্মে লোড হবে
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold border border-amber-300 self-start sm:self-center">
                অপেক্ষমাণ কর্মী: {toBanglaNumber(EXISTING_UNREGISTERED_WORKERS.length)} জন
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {EXISTING_UNREGISTERED_WORKERS.map(w => {
                const alreadyAdded = employees.some(e => e.empId === w.empId);
                return (
                  <button
                    key={w.empId}
                    type="button"
                    onClick={() => handleLoadExistingWorker(w)}
                    className={`text-left p-3.5 rounded-2xl border-2 transition flex flex-col justify-between gap-2 ${
                      alreadyAdded
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-[#FBF6F2] hover:bg-white border-[#E6DCD2] hover:border-[#EC1C24] shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-[#1E1314] text-white text-xs font-black">
                          আইডি #{toBanglaNumber(w.empId)}
                        </span>
                        <span className="text-xs font-extrabold text-[#EC1C24]">
                          {w.districtNameBn}
                        </span>
                      </div>
                      <div className="text-sm font-black text-[#1E1314] mt-2 truncate">
                        {w.nameBn}
                      </div>
                      <div className="text-xs font-bold text-[#5E4D4E] mt-0.5 truncate">
                        {w.designationNameBn}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#E6DCD2] flex items-center justify-between text-xs font-extrabold">
                      <span className="text-[#5E4D4E]">বেতন: ৳{toBanglaNumber(w.grossSalary)}</span>
                      <span className="text-emerald-700">
                        {alreadyAdded ? '✓ যুক্ত হয়েছে' : 'ফর্মে লোড করুন →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleCompleteOnboarding} className="space-y-6">
            {/* =================================================================
                STEP 1: MANUAL PERSONAL DETAILS, ADDRESS (HOVER AUTOCOMPLETE),
                        EDUCATION, NID, MOBILE, SALARY & COMPANY REFERENCE
               ================================================================= */}
            <div className="bg-white rounded-3xl border-2 border-[#E6DCD2] p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#F0E6DD] pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#EC1C24] text-white flex items-center justify-center font-black text-lg shadow-md">
                    ১
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#1E1314]">
                      ব্যক্তিগত তথ্য, বর্তমান ও স্থায়ী ঠিকানা, শিক্ষা, বেতন এবং কোম্পানি রেফারেন্স
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-[#5E4D4E]">
                      ম্যানুয়াল এন্ট্রি সিস্টেম — বর্তমান ঠিকানা ও শিক্ষায় মাউস হোভার বা টাইপ করলে অটো-সাজেশন আসবে
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-xl bg-[#FDE8E9] text-[#EC1C24] text-xs font-black border border-[#EC1C24]/25 self-start sm:self-center">
                  ধাপ ১ / ৩ • ম্যানুয়াল প্রোফাইল
                </span>
              </div>

              {/* Row 1: Name (Bangla + English), Father's Name, Mother's Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                    কর্মীর নাম (বাংলা) <span className="text-[#EC1C24]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameBn}
                    onChange={e => setNameBn(e.target.value)}
                    placeholder="যেমন: মোঃ সাইফুল ইসলাম চৌধুরী"
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                    কর্মীর নাম (ইংরেজি - English) <span className="text-[#EC1C24]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={e => setNameEn(e.target.value)}
                    placeholder="e.g. Md. Saiful Islam Chowdhury"
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                    বাবার নাম (Father's Name) <span className="text-[#EC1C24]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fatherNameBn}
                    onChange={e => setFatherNameBn(e.target.value)}
                    placeholder="বাবার পূর্ণ নাম লিখুন"
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                    মায়ের নাম (Mother's Name) <span className="text-[#EC1C24]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={motherNameBn}
                    onChange={e => setMotherNameBn(e.target.value)}
                    placeholder="মায়ের পূর্ণ নাম লিখুন"
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Present Address (with Hover/Typing Autocomplete) & Permanent Address */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                {/* PRESENT ADDRESS WITH HOVER / TYPE-AHEAD SUGGESTIONS */}
                <div
                  className="p-4 rounded-2xl bg-[#FBF6F2] border-2 border-[#E6DCD2] space-y-3 relative"
                  onMouseEnter={() => setShowPresentHover(true)}
                  onMouseLeave={() => setShowPresentHover(false)}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-[#1E1314] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#EC1C24]" />
                      <span>প্রেজেন্ট অ্যাড্রেস / বর্তমান ঠিকানা (টাইপ বা হোভার করুন)</span>
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold border border-amber-300">
                      হোভার অটো-সাজেশন
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={presentAddress}
                      onFocus={() => setShowPresentHover(true)}
                      onChange={e => {
                        setPresentAddress(e.target.value);
                        setShowPresentHover(true);
                      }}
                      placeholder="বর্তমান আবাসিক ঠিকানা বা কোয়ার্টার লিখুন..."
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-white border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:border-[#EC1C24] focus:outline-none"
                    />
                    <ChevronDown className="w-4 h-4 text-[#5E4D4E] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

                    {/* Hover / Focus Autocomplete Dropdown */}
                    {showPresentHover && (
                      <div className="mt-2 p-2.5 rounded-2xl bg-white border-2 border-[#EC1C24]/40 shadow-xl space-y-1.5 z-30">
                        <div className="flex items-center justify-between px-2 py-1 text-xs font-extrabold text-[#5E4D4E] border-b border-[#F0E6DD]">
                          <span>প্রেজেন্ট অ্যাড্রেস কুইক সাজেশন (ক্লিক করে সিলেক্ট করুন):</span>
                          <button
                            type="button"
                            onClick={() => setShowPresentHover(false)}
                            className="text-[#EC1C24] font-black"
                          >
                            বন্ধ ✕
                          </button>
                        </div>
                        <div className="max-h-44 overflow-y-auto space-y-1">
                          {filteredPresentSuggestions.map((addr, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPresentAddress(addr);
                                setShowPresentHover(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-between ${
                                presentAddress === addr
                                  ? 'bg-[#FDE8E9] text-[#EC1C24]'
                                  : 'hover:bg-[#FBF6F2] text-[#1E1314]'
                              }`}
                            >
                              <span>{addr}</span>
                              <span className="text-xs font-extrabold text-[#EC1C24] shrink-0 ml-2">
                                সিলেক্ট
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PERMANENT ADDRESS (Division + 64 District + Upazila/Village with Hover) */}
                <div
                  className="p-4 rounded-2xl bg-[#FBF6F2] border-2 border-[#E6DCD2] space-y-3"
                  onMouseEnter={() => setShowPermHover(true)}
                  onMouseLeave={() => setShowPermHover(false)}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-[#1E1314] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-700" />
                      <span>পার্মানেন্ট অ্যাড্রেস / স্থায়ী ঠিকানা (৬৪ জেলা ম্যাপে যুক্ত)</span>
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold border border-emerald-300">
                      জেলা: {currentDistrictObj?.nameBn}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-xs font-extrabold text-[#5E4D4E] mb-1">
                        স্থায়ী বিভাগ (Division)
                      </span>
                      <select
                        value={divisionId}
                        onChange={e => {
                          const newDiv = e.target.value;
                          setDivisionId(newDiv);
                          const firstDist = BANGLADESH_DISTRICTS.find(
                            d => d.divisionId === newDiv
                          );
                          if (firstDist) setDistrictId(firstDist.id);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:border-[#EC1C24] focus:outline-none"
                      >
                        {BANGLADESH_DIVISIONS.map(div => (
                          <option key={div.id} value={div.id}>
                            {div.nameBn} ({div.nameEn})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="block text-xs font-extrabold text-[#5E4D4E] mb-1">
                        স্থায়ী জেলা (৬৪ জেলা)
                      </span>
                      <select
                        value={districtId}
                        onChange={e => {
                          const dId = e.target.value;
                          setDistrictId(dId);
                          const found = BANGLADESH_DISTRICTS.find(d => d.id === dId);
                          if (found) setDivisionId(found.divisionId);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:border-[#EC1C24] focus:outline-none"
                      >
                        {BANGLADESH_DISTRICTS.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.nameBn} ({d.nameEn})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={permanentUpazilaDetails}
                      onFocus={() => setShowPermHover(true)}
                      onChange={e => setPermanentUpazilaDetails(e.target.value)}
                      placeholder="উপজেলা, ডাকঘর ও গ্রামের নাম লিখুন..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:border-[#EC1C24] focus:outline-none"
                    />
                    {showPermHover && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {permanentAddressSuggestions.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setPermanentUpazilaDetails(sug);
                              setShowPermHover(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-[#D9CEC5] text-xs font-bold text-[#1E1314]"
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Educational Qualification (with Hover), NID Number, Mobile Number, Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                {/* Education with Hover Autocomplete */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowEduHover(true)}
                  onMouseLeave={() => setShowEduHover(false)}
                >
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#EC1C24]" />
                    <span>শিক্ষাগত যোগ্যতা (হোভার/টাইপ)</span>
                  </label>
                  <input
                    type="text"
                    value={educationBn}
                    onFocus={() => setShowEduHover(true)}
                    onChange={e => {
                      setEducationBn(e.target.value);
                      setShowEduHover(true);
                    }}
                    placeholder="যেমন: বি.এসসি ইঞ্জিনিয়ারিং / ডিপ্লোমা / এইচএসসি"
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                  {showEduHover && (
                    <div className="mt-1.5 p-2 rounded-2xl bg-white border-2 border-[#EC1C24]/30 shadow-xl max-h-44 overflow-y-auto space-y-1 z-30">
                      {filteredEduSuggestions.map((edu, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEducationBn(edu);
                            setShowEduHover(false);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#FBF6F2] text-xs font-bold text-[#1E1314] block"
                        >
                          {edu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* NID / Birth Reg Number */}
                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5 flex items-center gap-1.5">
                    <FileBadge className="w-4 h-4 text-[#EC1C24]" />
                    <span>এনআইডি / জন্ম নিবন্ধন নম্বর <span className="text-[#EC1C24]">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nidNumber}
                    onChange={e => setNidNumber(e.target.value)}
                    placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি নম্বর"
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-700" />
                    <span>মোবাইল নাম্বার <span className="text-[#EC1C24]">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+88017XXXXXXXX"
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                </div>

                {/* Gross Salary */}
                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-amber-700" />
                    <span>মাসিক মোট বেতন (Gross Salary ৳) <span className="text-[#EC1C24]">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    value={grossSalary}
                    onChange={e => setGrossSalary(Number(e.target.value))}
                    placeholder="22500"
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-black text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: INTERNAL COMPANY REFERENCE ("রেফারেন্স — আমাদের কোম্পানির কোন লোকটা তাকে রেফার করছে") */}
              <div
                className="p-5 rounded-2xl bg-gradient-to-r from-[#FFF8F1] via-[#FBF6F2] to-[#F3FBF7] border-2 border-amber-400/60 space-y-4"
                onMouseEnter={() => setShowReferrerHover(true)}
                onMouseLeave={() => setShowReferrerHover(false)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#1E1314]">
                        রেফারেন্স (কোম্পানির অভ্যন্তরীণ রেফারকারী কর্মীর তথ্য — ডাটাবেজ অটো-ফিল)
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-[#5E4D4E]">
                        আমাদের কোম্পানির যে কর্মী তাকে রেফার করেছেন তার <strong className="text-[#EC1C24]">আইডি (ID)</strong> লিখলেই ডাটাবেজ থেকে স্বয়ংক্রিয়ভাবে তার নাম ও সেকশন চলে আসবে!
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border self-start sm:self-center ${
                      referrerAutoMatched
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {referrerAutoMatched
                      ? '✓ ডাটাবেজ থেকে রেফারকারী ভেরিফাইড'
                      : 'আইডি লিখুন অথবা নিচের তালিকা থেকে বাছাই করুন'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Referrer ID Input */}
                  <div>
                    <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                      রেফারকারী কর্মীর আইডি (Referrer ID)
                    </label>
                    <input
                      type="text"
                      value={referrerEmpId}
                      onFocus={() => setShowReferrerHover(true)}
                      onChange={e => handleReferrerIdChange(e.target.value)}
                      placeholder="যেমন: 1001, 1002, 1003, 1012..."
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-amber-500 text-sm font-black text-[#1E1314] focus:border-[#EC1C24] focus:outline-none"
                    />
                  </div>

                  {/* Referrer Name (Auto-filled from DB) */}
                  <div>
                    <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                      রেফারকারী কর্মীর নাম (অটো-ফিল)
                    </label>
                    <input
                      type="text"
                      value={referrerNameBn}
                      onChange={e => setReferrerNameBn(e.target.value)}
                      placeholder="আইডি দিলে নাম অটো বসবে"
                      className="w-full px-4 py-3 rounded-xl bg-emerald-50/70 border-2 border-emerald-400 text-sm font-black text-emerald-950 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Referrer Section/Department (Auto-filled from DB) */}
                  <div>
                    <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                      রেফারকারীর সেকশন ও পদবী (অটো-ফিল)
                    </label>
                    <input
                      type="text"
                      value={referrerSectionBn}
                      onChange={e => setReferrerSectionBn(e.target.value)}
                      placeholder="আইডি দিলে সেকশন অটো বসবে"
                      className="w-full px-4 py-3 rounded-xl bg-emerald-50/70 border-2 border-emerald-400 text-sm font-black text-emerald-950 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Hover / Click Bar of Existing Company Employees for 1-Click Reference Test */}
                {showReferrerHover && (
                  <div className="pt-2 border-t border-amber-300/60">
                    <div className="text-xs font-extrabold text-[#5E4D4E] mb-2">
                      ডাটাবেজের বিদ্যমান কর্মীদের তালিকা (ক্লিক করলেই রেফারেন্স অটো-ফিল হবে):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {employees.slice(0, 8).map(emp => (
                        <button
                          key={emp.empId}
                          type="button"
                          onClick={() => handleSelectReferrerEmployee(emp)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${
                            referrerEmpId === emp.empId
                              ? 'bg-[#EC1C24] text-white border-[#EC1C24] shadow-xs'
                              : 'bg-white hover:bg-amber-50 text-[#1E1314] border-[#D9CEC5]'
                          }`}
                        >
                          <span className="font-black">#{toBanglaNumber(emp.empId)}</span>
                          <span>•</span>
                          <span>{emp.nameBn}</span>
                          <span className="opacity-75">({emp.employment.deptName})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================================
                STEP 2: EMPLOYEE TYPE, DEPARTMENT, DESIGNATION (HOVER),
                        JOINING DATE & REPORTING BOSS / LEAVE APPROVAL CHAIN
               ================================================================= */}
            <div className="bg-white rounded-3xl border-2 border-[#E6DCD2] p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#F0E6DD] pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                    ২
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#1E1314]">
                      এমপ্লয়ি টাইপ, বিভাগ, পদবী (হোভার অটো-সাজেশন), জয়েনিং ডেট ও ছুটি অনুমোদন চেইন
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-[#5E4D4E]">
                      কর্মী কি অফিসার, ডিপার্টমেন্ট হেড, ওয়ার্কার নাকি ক্যাজুয়াল এবং তার রিপোর্টিং বস ও ছুটি অনুমোদনকারী কে তা নির্ধারণ করুন
                    </p>
                  </div>
                </div>

                {/* Shortcut to Settings / Power Control where Employee Types & Departments are created */}
                {onNavigateSettings && (
                  <button
                    type="button"
                    onClick={onNavigateSettings}
                    className="px-4 py-2.5 rounded-xl bg-[#FBF6F2] hover:bg-[#1E1314] text-[#1E1314] hover:text-white border-2 border-[#D9CEC5] text-xs font-extrabold flex items-center gap-2 transition self-start sm:self-center shrink-0"
                  >
                    <Settings className="w-4 h-4 text-[#EC1C24]" />
                    <span>নতুন বিভাগ / এমপ্লয়ি টাইপ তৈরি করুন (সেটিংস ও ক্ষমতা বণ্টন) →</span>
                  </button>
                )}
              </div>

              {/* 2A. Select Employee Type Cards (Officer, Department Head, Worker, Casual — synced from Settings) */}
              <div className="space-y-2.5">
                <label className="block text-sm font-black text-[#1E1314]">
                  ১. এমপ্লয়ি টাইপ নির্বাচন করুন (সেটিংস থেকে নিয়ন্ত্রিত — অফিসার / ডিপার্টমেন্ট হেড / ওয়ার্কার / ক্যাজুয়াল)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {employeeTypes.map(t => {
                    const isSelected = selectedEmpTypeId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectEmpType(t.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#1E1314] text-white border-[#EC1C24] shadow-md'
                            : 'bg-[#FBF6F2] hover:bg-white text-[#1E1314] border-[#D9CEC5]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-black text-white"
                            style={{ backgroundColor: t.badgeColor }}
                          >
                            {t.defaultAccessTag.toUpperCase()}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div>
                          <div className="text-base font-black leading-snug">{t.nameBn}</div>
                          <div
                            className={`text-xs font-bold mt-1 line-clamp-2 ${
                              isSelected ? 'text-white/80' : 'text-[#5E4D4E]'
                            }`}
                          >
                            {t.descriptionBn}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2B. Employee ID, Department, Sub-section, Designation (Hover Auto-Suggest), Joining Date, Shift */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {/* Employee ID */}
                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                    এমপ্লয়ি আইডি (Employee ID — পাসওয়ার্ড হিসেবে ব্যবহৃত হবে) <span className="text-[#EC1C24]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={empId}
                    onChange={e => {
                      setEmpId(e.target.value);
                      setDeviceCode(e.target.value.padStart(8, '0'));
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-black text-[#EC1C24] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                </div>

                {/* Department Selector */}
                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>বিভাগ / ডিপার্টমেন্ট (Department) <span className="text-[#EC1C24]">*</span></span>
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={e => handleDepartmentChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.nameBn} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-section Selector */}
                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                    সাব-সেকশন / প্রোডাকশন লাইন
                  </label>
                  <select
                    value={selectedSubSection}
                    onChange={e => setSelectedSubSection(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  >
                    {(selectedDeptObj?.subSections || ['Main Line']).map((sub, i) => (
                      <option key={i} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation with Hover / Type-ahead Autocomplete ("ইঞ্জিনিয়ার, অ্যাসিস্ট্যান্ট ইঞ্জিনিয়ার") */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowDesigHover(true)}
                  onMouseLeave={() => setShowDesigHover(false)}
                >
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#EC1C24]" />
                      <span>পদবী / ডেজিগনেশন (হোভার বা টাইপ করুন)</span>
                    </span>
                    <span className="text-xs font-extrabold text-[#EC1C24]">অটো-সাজেশন</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={designationName}
                    onFocus={() => setShowDesigHover(true)}
                    onChange={e => {
                      setDesignationName(e.target.value);
                      setShowDesigHover(true);
                    }}
                    placeholder="যেমন: ইঞ্জিনিয়ার / অ্যাসিস্ট্যান্ট ইঞ্জিনিয়ার / অপারেটর"
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />

                  {showDesigHover && (
                    <div className="mt-1.5 p-2.5 rounded-2xl bg-white border-2 border-[#EC1C24]/40 shadow-xl max-h-52 overflow-y-auto space-y-1 z-30">
                      <div className="text-xs font-extrabold text-[#5E4D4E] px-2 py-1 border-b border-[#F0E6DD] flex items-center justify-between">
                        <span>পদবী তালিকা (ক্লিক করলেই সিলেক্ট হবে):</span>
                        <button
                          type="button"
                          onClick={() => setShowDesigHover(false)}
                          className="text-[#EC1C24] font-black"
                        >
                          ✕
                        </button>
                      </div>
                      {filteredDesignationSuggestions.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setDesignationName(d.titleBn);
                            setShowDesigHover(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FBF6F2] text-xs sm:text-sm font-bold text-[#1E1314] flex items-center justify-between"
                        >
                          <span>{d.titleBn}</span>
                          <span className="px-2 py-0.5 rounded bg-[#F0E6DD] text-[11px] font-extrabold text-[#5E4D4E] uppercase">
                            {d.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#EC1C24]" />
                    <span>জয়েনিং ডেট (Joining Date — ছুটি হিসাবের ভিত্তি) <span className="text-[#EC1C24]">*</span></span>
                  </label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={e => setJoinDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-black text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  />
                </div>

                {/* Shift Selector */}
                <div>
                  <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                    নির্ধারিত কাজের শিফট (Assigned Shift)
                  </label>
                  <select
                    value={shiftId}
                    onChange={e => setShiftId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#FBF6F2] border-2 border-[#D9CEC5] text-sm font-bold text-[#1E1314] focus:bg-white focus:border-[#EC1C24] focus:outline-none"
                  >
                    <option value="general">জেনারেল শিফট (০৮:০০ - ১৭:০০)</option>
                    <option value="shiftA">মর্নিং শিফট A (০৬:০০ - ১৪:০০)</option>
                    <option value="shiftB">ইভিনিং শিফট B (১৪:০০ - ২২:০০)</option>
                    <option value="shiftC">নাইট শিফট C (২২:০০ - ০৬:০০)</option>
                  </select>
                </div>
              </div>

              {/* 2C. REPORTING BOSS & LEAVE APPROVAL HIERARCHY ("তার রিপোর্টিং বস কে এবং সে কার কাছে ছুটি চাইবে ও কে অনুমোদন দেবে") */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F0F7FF] via-[#F8FAFC] to-[#F0FDF4] border-2 border-blue-300 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                      <GitBranch className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#1E1314]">
                        রিপোর্টিং বস এবং ছুটি আবেদন ও অনুমোদন চেইন (Reporting Boss & Leave Approval Hierarchy)
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-[#5E4D4E]">
                        এই কর্মীর সরাসরি রিপোর্টিং বস কে, সে ছুটির জন্য কার কাছে আবেদন করবে এবং চূড়ান্ত ছুটি কে অনুমোদন দেবে
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-extrabold border border-blue-300">
                    অটো-লিঙ্কড অ্যাপ্রুভাল চেইন
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Direct Reporting Boss */}
                  <div>
                    <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                      ১. সরাসরি রিপোর্টিং বস (Reporting Boss)
                    </label>
                    <select
                      value={reportingBossEmpId}
                      onChange={e => handleReportingBossSelect(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border-2 border-blue-400 text-sm font-bold text-[#1E1314] focus:outline-none"
                    >
                      {employees.map(emp => (
                        <option key={emp.empId} value={emp.empId}>
                          {emp.nameBn} (#{toBanglaNumber(emp.empId)} — {emp.employment.designationName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Leave Application Recipient (1st Level) */}
                  <div>
                    <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                      ২. ছুটির জন্য কার কাছে আবেদন করবে (১ম স্তর)
                    </label>
                    <input
                      type="text"
                      value={leaveApplyToName}
                      onChange={e => setLeaveApplyToName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-blue-300 text-sm font-bold text-[#1E1314] focus:outline-none"
                    />
                  </div>

                  {/* 3. Final Leave Approver (HOD / HR Admin) */}
                  <div>
                    <label className="block text-sm font-extrabold text-[#1E1314] mb-1.5">
                      ৩. চূড়ান্ত ছুটি কে অনুমোদন দেবে (Final Approver)
                    </label>
                    <input
                      type="text"
                      value={leaveApproverName}
                      onChange={e => setLeaveApproverName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-emerald-400 text-sm font-bold text-emerald-950 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================================
                STEP 3: AUTO LOGIN CREDENTIALS (USERNAME = CHARU, PASSWORD = EMP ID)
                        & PRO-RATA LEAVE CALCULATOR (CL:10, SL:14, FL:13, EL:16)
               ================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 5 Cols: Auto Login Credentials Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#161213] via-[#221719] to-[#2C1417] text-white rounded-3xl p-6 border-2 border-[#EC1C24]/40 shadow-lg flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EC1C24] text-white text-xs font-black">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>ধাপ ৩A • লগইন অ্যাক্সেস ও পাসওয়ার্ড</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `Username: ${loginCreds.username} | Password: ${loginCreds.password}`
                        );
                        setCopiedCreds(true);
                        setTimeout(() => setCopiedCreds(false), 2000);
                      }}
                      className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-extrabold text-white flex items-center gap-1.5"
                    >
                      {copiedCreds ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-xl font-black text-white">
                    অটো-জেনারেটেড অ্যাপ লগইন আইডি ও পাসওয়ার্ড
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-white/80">
                    কোম্পানির নিয়ম অনুযায়ী ইউজারনেম সর্বদা <strong className="text-amber-300">CHARU</strong> এবং পাসওয়ার্ড হবে কর্মীর নিজস্ব <strong className="text-amber-300">এমপ্লয়ি আইডি</strong>।
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                      <div className="text-xs font-bold text-white/70 uppercase">
                        ইউজারনেম (কোম্পানি নাম)
                      </div>
                      <div className="text-2xl font-black text-amber-300 tracking-wider mt-1">
                        {loginCreds.username}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                      <div className="text-xs font-bold text-white/70 uppercase">
                        পাসওয়ার্ড (এমপ্লয়ি আইডি)
                      </div>
                      <div className="text-2xl font-black text-emerald-300 tracking-wider mt-1">
                        {loginCreds.password}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Tag Selector */}
                <div className="pt-3 border-t border-white/15 space-y-2">
                  <div className="text-xs font-extrabold text-white/85">
                    সিস্টেম ইন্টারফেস অ্যাক্সেস ট্যাগ (এই কর্মী লগইন করলে কোন ভিউ দেখবে):
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'employee', label: 'এমপ্লয়ি / ওয়ার্কার ভিউ' },
                        { id: 'officer', label: 'অফিসার / ইঞ্জিনিয়ার ভিউ' },
                        { id: 'hod', label: 'ডিপার্টমেন্ট হেড (HOD)' },
                        { id: 'admin', label: 'এইচআর অ্যাডমিন প্যানেল' },
                      ] as Array<{ id: AccessTagType; label: string }>
                    ).map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setAccessTag(tag.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold border text-left transition ${
                          accessTag === tag.id
                            ? 'bg-[#EC1C24] text-white border-white shadow-sm'
                            : 'bg-white/5 text-white/75 border-white/15 hover:bg-white/10'
                        }`}
                      >
                        ✓ {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 7 Cols: Pro-Rata Leave Entitlement Calculator */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border-2 border-[#E6DCD2] shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>ধাপ ৩B • জয়েনিং ডেট অনুযায়ী আনুপাতিক ছুটি ক্যালকুলেটর</span>
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#FBF6F2] border border-[#D9CEC5] text-xs font-extrabold text-[#1E1314]">
                      জয়েনিং মাস: {proRataLeave.joinMonthNameBn} {toBanglaNumber(proRataLeave.joinYear)} • অবশিষ্ট:{' '}
                      <strong className="text-[#EC1C24]">
                        {toBanglaNumber(proRataLeave.remainingMonths)} মাস
                      </strong>
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-[#1E1314]">
                    বাৎসরিক ছুটি ১২ মাস দিয়ে ভাগ করে অবশিষ্ট মাসের আনুপাতিক হিসাব
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-[#5E4D4E] mt-0.5">
                    সূত্র: <strong className="text-[#1E1314]">(বাৎসরিক কোটা ÷ ১২) × বছরের অবশিষ্ট মাস</strong> — নৈমিত্তিক (CL: ১০), অসুস্থতা (SL: ১৪), উৎসব (FL: ১৩), অর্জিত (EL: ১৬)
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {(['CL', 'SL', 'FL', 'EL'] as const).map(code => {
                      const item = proRataLeave.items[code];
                      return (
                        <div
                          key={code}
                          className="p-3.5 rounded-2xl bg-[#FBF6F2] border-2 border-[#E6DCD2] flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-sm font-black text-[#1E1314]">{item.nameBn}</div>
                            <div className="text-xs font-bold text-[#5E4D4E] mt-0.5">
                              {item.formulaBn}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-black text-[#EC1C24]">
                              {toBanglaNumber(item.roundedEntitlement)} দিন
                            </div>
                            <div className="text-[11px] font-bold text-[#5E4D4E]">
                              বার্ষিক {toBanglaNumber(item.annualQuota)} দিন
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Final Submit Button */}
                <div className="pt-3 border-t-2 border-[#F0E6DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm font-extrabold text-[#1E1314]">
                    মোট প্রাপ্য ছুটি:{' '}
                    <span className="text-lg font-black text-emerald-700">
                      {toBanglaNumber(proRataLeave.totalRoundedEntitlement)} দিন
                    </span>{' '}
                    (বার্ষিক মোট ৫৩ দিনের মধ্যে)
                  </div>

                  <button
                    type="submit"
                    className="px-7 py-4 rounded-2xl bg-[#EC1C24] hover:bg-[#C4141B] text-white text-base font-black shadow-lg flex items-center justify-center gap-2.5 transition cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>কর্মী অনবোর্ড ও ডাটাবেজে সেভ করুন</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* =====================================================================
           TAB 2: MASTER EMPLOYEE DIRECTORY (সকল নিবন্ধিত কর্মীর তালিকা)
           ===================================================================== */
        <div className="bg-white rounded-3xl border-2 border-[#E6DCD2] p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#1E1314]">
                মাস্টার কর্মী ডাটাবেজ ডিরেক্টরি ({toBanglaNumber(filteredEmployees.length)} জন)
              </h2>
              <p className="text-sm font-bold text-[#5E4D4E]">
                নাম, আইডি, রেফারেন্স, রিপোর্টিং বস, বিভাগ ও ৬৪ জেলা অনুযায়ী কর্মীদের সম্পূর্ণ তালিকা
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#5E4D4E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                  className="pl-9 pr-4 py-2.5 bg-[#FBF6F2] border-2 border-[#D9CEC5] rounded-xl text-sm font-bold text-[#1E1314] focus:outline-none focus:border-[#EC1C24]"
                />
              </div>

              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-[#FBF6F2] border-2 border-[#D9CEC5] rounded-xl text-sm font-bold text-[#1E1314]"
              >
                <option value="all">সকল বিভাগ</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nameBn}
                  </option>
                ))}
              </select>

              <select
                value={districtFilter}
                onChange={e => setDistrictFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-[#FBF6F2] border-2 border-[#D9CEC5] rounded-xl text-sm font-bold text-[#1E1314]"
              >
                <option value="all">সকল জেলা (৬৪)</option>
                {BANGLADESH_DISTRICTS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(emp => {
              const distObj = BANGLADESH_DISTRICTS.find(d => d.id === emp.homeDistrictId);
              return (
                <div
                  key={emp.empId}
                  className="p-4 rounded-2xl bg-[#FBF6F2] border-2 border-[#E6DCD2] hover:border-[#EC1C24] transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={emp.photoUrl}
                        alt={emp.nameEn}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-base font-black text-[#1E1314] truncate">
                          {emp.nameBn}
                        </div>
                        <div className="text-xs font-bold text-[#5E4D4E] truncate">
                          {emp.employment.designationName} • {emp.employment.deptName}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#1E1314] text-white text-xs font-black shrink-0">
                      #{toBanglaNumber(emp.empId)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold bg-white p-3 rounded-xl border border-[#E6DCD2]">
                    <div>
                      <span className="text-[#5E4D4E] block">নিজ জেলা:</span>
                      <span className="text-[#1E1314] font-extrabold">
                        {distObj?.nameBn || emp.homeDistrictId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5E4D4E] block">লগইন পাসওয়ার্ড:</span>
                      <span className="text-[#EC1C24] font-black">
                        CHARU / {emp.empId}
                      </span>
                    </div>
                    {emp.reference && (
                      <div className="col-span-2 pt-1 border-t border-[#F0E6DD]">
                        <span className="text-[#5E4D4E]">রেফারেন্স: </span>
                        <span className="text-emerald-800 font-extrabold">
                          {emp.reference.nameBn} (#{toBanglaNumber(emp.reference.empId)})
                        </span>
                      </div>
                    )}
                    {emp.approvalChain && (
                      <div className="col-span-2 pt-1 border-t border-[#F0E6DD]">
                        <span className="text-[#5E4D4E]">রিপোর্টিং বস: </span>
                        <span className="text-blue-900 font-extrabold">
                          {emp.approvalChain.reportingBossName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
