/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Charu HCM — Workforce Map (Bangladesh 64 Districts)
 * Authentic 64-District Interactive Map with Default (0/64) & Dynamic Highlighting
 * Includes Section + District + Designation Filtering & Live Employee Directory List
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Share2,
  Users,
  Building,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Search,
  X,
  Layers,
  Briefcase,
  UserCheck,
  Award,
  Phone,
  Eye,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  BANGLADESH_DISTRICTS,
  BANGLADESH_DIVISIONS,
  DistrictGeo,
  BANGLADESH_MAP_COORDINATES,
} from '../data/districts';
import { EXACT_DISTRICT_SVG_PATHS } from '../data/districtExactPaths';
import { Employee, Locale, Role } from '../types';
import {
  computeDistrictDistribution,
  DistrictStat,
  DENSITY_TIERS,
  DensityTier,
  getDensityTier,
} from '../utils/rules';
import { formatLocalizedNumber, toBanglaDigits } from '../data/translations';

interface WorkforceMapProps {
  employees: Employee[];
  locale: Locale;
  currentRole: Role;
  onFilterEmployeeDistrict?: (districtId: string) => void;
}

export type DesignationCategory =
  | 'all'
  | 'hod'
  | 'supervisor'
  | 'employee'
  | 'manager'
  | 'officer'
  | 'technician'
  | 'operator'
  | 'helper';

/**
 * Classifies an employee's designationId into the 3 core factory hierarchy tiers
 * requested by the user: বিভাগীয় প্রধান (HOD), সুপারভাইজার (Supervisor), এমপ্লয়ি (Employee)
 */
export function getDesignationRoleGroup(designationId: string): 'hod' | 'supervisor' | 'employee' {
  if (designationId === 'hod' || designationId === 'manager' || designationId === 'asst-mgr') {
    return 'hod';
  }
  if (designationId === 'supervisor') {
    return 'supervisor';
  }
  return 'employee';
}

export const SECTION_OPTIONS = [
  { id: 'all', nameBn: 'সকল সেকশন (All Sections)', nameEn: 'All Sections' },
  { id: 'casting', nameBn: 'কাস্টিং সেকশন (Casting & Moulding)', nameEn: 'Casting Section' },
  { id: 'glazing', nameBn: 'গ্লেজিং সেকশন (Glazing & Surface)', nameEn: 'Glazing Section' },
  { id: 'kiln', nameBn: 'কিলন ও ফায়ারিং সেকশন (Kiln & Firing)', nameEn: 'Kiln & Firing Section' },
  { id: 'packing', nameBn: 'বাছাই ও প্যাকেজিং সেকশন (Sorting & Packing)', nameEn: 'Sorting & Packing Section' },
  { id: 'qa', nameBn: 'গুণমান নিয়ন্ত্রণ সেকশন (Quality Assurance)', nameEn: 'Quality Assurance (QA)' },
  { id: 'maintenance', nameBn: 'প্রকৌশল ও রক্ষণাবেক্ষণ (Maintenance)', nameEn: 'Engineering & Maintenance' },
  { id: 'hr', nameBn: 'এইচআর ও প্রশাসন (HR & Admin)', nameEn: 'HR & Administration' },
  { id: 'accounts', nameBn: 'হিসাব ও অর্থ সেকশন (Accounts)', nameEn: 'Accounts & Finance' },
];

export const DESIGNATION_FILTER_OPTIONS: {
  id: DesignationCategory;
  nameBn: string;
  nameEn: string;
}[] = [
  { id: 'all', nameBn: 'সকল পদবি (All Designations)', nameEn: 'All Designations' },
  { id: 'hod', nameBn: 'বিভাগীয় প্রধান (HOD / Department Head)', nameEn: 'Head of Department (HOD)' },
  { id: 'supervisor', nameBn: 'সুপারভাইজার (Section Supervisor)', nameEn: 'Section Supervisor' },
  { id: 'employee', nameBn: 'এমপ্লয়ি / অপারেটর (General Employee)', nameEn: 'Employee / Operator' },
  { id: 'technician', nameBn: 'সিনিয়র টেকনিশিয়ান (Senior Technician)', nameEn: 'Senior Technician' },
  { id: 'operator', nameBn: 'মেশিন অপারেটর (Machine Operator)', nameEn: 'Machine Operator' },
  { id: 'officer', nameBn: 'এক্সিকিউটিভ / অফিসার (Executive)', nameEn: 'Executive / Officer' },
  { id: 'helper', nameBn: 'উৎপাদন সহকারী (Production Assistant)', nameEn: 'Production Assistant' },
];

export const WorkforceMap: React.FC<WorkforceMapProps> = ({
  employees,
  locale,
  currentRole,
  onFilterEmployeeDistrict,
}) => {
  // Primary Filter States: Section + District + Designation
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<DesignationCategory>('all');
  const [addressType, setAddressType] = useState<'permanent' | 'present'>('permanent');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDensityTier, setSelectedDensityTier] = useState<DensityTier | null>(null);

  // Default Empty Map (0/64) preview state & highlight color theme
  const [isEmptyMapPreview, setIsEmptyMapPreview] = useState<boolean>(false);
  const [mapColorScheme, setMapColorScheme] = useState<'emerald' | 'crimson'>('emerald');

  // Map zoom & UI states
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showAllRanked, setShowAllRanked] = useState<boolean>(false);
  const [showPosterModal, setShowPosterModal] = useState<boolean>(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState<string>('');

  // Quick District Search state
  const [districtSearchQuery, setDistrictSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Tooltip hover state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<{
    district: DistrictGeo;
    count: number;
    percentage: number;
    x: number;
    y: number;
  } | null>(null);

  const isHR = ['superAdmin', 'hrManager', 'hrExecutive'].includes(currentRole);

  // Helper to get an employee's district ID based on addressType
  const getEmpDistrictId = (emp: Employee) =>
    addressType === 'permanent'
      ? emp.address.permanent.districtId
      : emp.address.present.districtId;

  // Helper to check if an employee matches the selected Designation filter
  const matchesDesignationFilter = (emp: Employee, desigFilter: DesignationCategory) => {
    if (desigFilter === 'all') return true;
    const desigId = emp.employment.designationId;
    if (desigFilter === 'hod') {
      return getDesignationRoleGroup(desigId) === 'hod';
    }
    if (desigFilter === 'supervisor') {
      return getDesignationRoleGroup(desigId) === 'supervisor';
    }
    if (desigFilter === 'employee') {
      return getDesignationRoleGroup(desigId) === 'employee';
    }
    return desigId === desigFilter;
  };

  // 1. Employees filtered by Section + Designation (used to show district counts across the map)
  const sectionAndDesignationEmployees = useMemo(() => {
    if (isEmptyMapPreview) return [];
    return employees.filter(emp => {
      if (emp.status !== 'active') return false;
      if (selectedSection !== 'all' && emp.employment.deptId !== selectedSection) return false;
      if (!matchesDesignationFilter(emp, selectedDesignation)) return false;
      return true;
    });
  }, [employees, selectedSection, selectedDesignation, isEmptyMapPreview]);

  // 2. Employees filtered by Section ONLY (used to populate district dropdown counts)
  const sectionOnlyEmployees = useMemo(() => {
    if (isEmptyMapPreview) return [];
    return employees.filter(emp => {
      if (emp.status !== 'active') return false;
      if (selectedSection !== 'all' && emp.employment.deptId !== selectedSection) return false;
      return true;
    });
  }, [employees, selectedSection, isEmptyMapPreview]);

  // 3. Employees filtered by Section + District ONLY (used to compute the Designation Breakdown: HOD / Supervisor / Employee counts!)
  const sectionAndDistrictEmployees = useMemo(() => {
    if (isEmptyMapPreview) return [];
    return sectionOnlyEmployees.filter(emp => {
      const dId = getEmpDistrictId(emp);
      if (selectedDistrictFilter !== 'all' && dId !== selectedDistrictFilter) return false;
      if (selectedDivision !== 'all') {
        const distObj = BANGLADESH_DISTRICTS.find(d => d.id === dId);
        if (distObj && distObj.divisionId !== selectedDivision) return false;
      }
      return true;
    });
  }, [sectionOnlyEmployees, selectedDistrictFilter, selectedDivision, addressType, isEmptyMapPreview]);

  // 4. Designation Breakdown counts for current Section + District selection
  const designationBreakdown = useMemo(() => {
    let hodCount = 0;
    let supervisorCount = 0;
    let employeeCount = 0;
    const exactCounts: Record<string, number> = {};

    sectionAndDistrictEmployees.forEach(emp => {
      const grp = getDesignationRoleGroup(emp.employment.designationId);
      if (grp === 'hod') hodCount++;
      else if (grp === 'supervisor') supervisorCount++;
      else employeeCount++;

      const dId = emp.employment.designationId;
      exactCounts[dId] = (exactCounts[dId] || 0) + 1;
    });

    return {
      total: sectionAndDistrictEmployees.length,
      hodCount,
      supervisorCount,
      employeeCount,
      exactCounts,
    };
  }, [sectionAndDistrictEmployees]);

  // 5. Final Filtered Employees (Section + District + Designation + Search) for the Employee List & Map Highlight
  const finalFilteredEmployees = useMemo(() => {
    return sectionAndDistrictEmployees.filter(emp => {
      if (!matchesDesignationFilter(emp, selectedDesignation)) return false;
      if (employeeSearchQuery.trim()) {
        const q = employeeSearchQuery.toLowerCase().trim();
        const match =
          emp.nameEn.toLowerCase().includes(q) ||
          emp.nameBn.includes(q) ||
          emp.empId.toLowerCase().includes(q) ||
          emp.employment.designationName.toLowerCase().includes(q) ||
          emp.employment.deptName.toLowerCase().includes(q) ||
          (emp.address.permanent.upazila && emp.address.permanent.upazila.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [sectionAndDistrictEmployees, selectedDesignation, employeeSearchQuery]);

  // Extract district references for map highlighting
  // If a specific district is selected in the filter, we highlight based on finalFilteredEmployees
  const mapActiveEmployees = useMemo(() => {
    if (isEmptyMapPreview) return [];
    return sectionAndDesignationEmployees.filter(emp => {
      const dId = getEmpDistrictId(emp);
      if (selectedDistrictFilter !== 'all' && dId !== selectedDistrictFilter) return false;
      return true;
    });
  }, [sectionAndDesignationEmployees, selectedDistrictFilter, addressType, isEmptyMapPreview]);

  const employeeDistricts = useMemo(() => {
    return mapActiveEmployees.map(emp => ({
      districtId: getEmpDistrictId(emp),
    }));
  }, [mapActiveEmployees, addressType]);

  // Compute distribution across all 64 districts
  const distribution = useMemo(() => {
    return computeDistrictDistribution(
      BANGLADESH_DISTRICTS,
      employeeDistricts,
      mapActiveEmployees.length,
      false // Keep exact district counts visible when filtering by section/district
    );
  }, [employeeDistricts, mapActiveEmployees.length]);

  const statsMap = useMemo(() => {
    const map = new Map<string, DistrictStat>();
    distribution.stats.forEach(s => map.set(s.districtId, s));
    return map;
  }, [distribution]);

  // Also compute district counts for the Section-only level so the District Dropdown shows how many people exist in each district
  const sectionDistrictCounts = useMemo(() => {
    const map = new Map<string, number>();
    sectionOnlyEmployees.forEach(emp => {
      const dId = getEmpDistrictId(emp);
      map.set(dId, (map.get(dId) || 0) + 1);
    });
    return map;
  }, [sectionOnlyEmployees, addressType]);

  // Count how many of the 8 Divisions have at least 1 active district
  const divisionsCoveredCount = useMemo(() => {
    const divs = new Set<string>();
    distribution.stats.forEach(s => {
      if (s.count > 0 && s.districtId !== 'others') {
        const dObj = BANGLADESH_DISTRICTS.find(d => d.id === s.districtId);
        if (dObj) divs.add(dObj.divisionId);
      }
    });
    return divs.size;
  }, [distribution]);

  // Distribution across density tiers for the legend
  const densityTierStats = useMemo(() => {
    const counts: Record<DensityTier, number> = {
      zero: 0,
      low: 0,
      medium: 0,
      high: 0,
      'very-high': 0,
    };

    BANGLADESH_DISTRICTS.forEach(dist => {
      const stat = statsMap.get(dist.id);
      const count = stat ? stat.count : 0;
      const tier = getDensityTier(count);
      counts[tier] = (counts[tier] || 0) + 1;
    });

    return { counts };
  }, [statsMap]);

  const maxCount = useMemo(() => {
    const counts = distribution.stats.map(s => s.count);
    return Math.max(...counts, 1);
  }, [distribution]);

  const selectedDistrictGeo = useMemo(() => {
    if (selectedDistrictFilter === 'all') return null;
    return BANGLADESH_DISTRICTS.find(d => d.id === selectedDistrictFilter) || null;
  }, [selectedDistrictFilter]);

  // Mouse hover handlers for district tooltip
  const handleMouseEnterDistrict = (dist: DistrictGeo, e: React.MouseEvent) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const stat = statsMap.get(dist.id);
    const count = stat ? stat.count : 0;
    const percentage = stat ? stat.percentage : 0;

    setHoveredDistrict({
      district: dist,
      count,
      percentage,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMoveDistrict = (e: React.MouseEvent) => {
    if (!mapContainerRef.current || !hoveredDistrict) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    setHoveredDistrict(prev =>
      prev
        ? {
            ...prev,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          }
        : null
    );
  };

  const handleMouseLeaveDistrict = () => {
    setHoveredDistrict(null);
  };

  // Matching districts for quick search input
  const searchedDistricts = useMemo(() => {
    if (!districtSearchQuery.trim()) return [];
    const q = districtSearchQuery.toLowerCase().trim();
    return BANGLADESH_DISTRICTS.filter(d => {
      return (
        d.nameEn.toLowerCase().includes(q) ||
        d.nameBn.includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.divisionId.toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [districtSearchQuery]);

  const handleSelectDistrictFromSearch = (dist: DistrictGeo) => {
    setIsEmptyMapPreview(false);
    setSelectedDistrictFilter(dist.id);
    if (selectedDivision !== 'all' && dist.divisionId !== selectedDivision) {
      setSelectedDivision('all');
    }
    setDistrictSearchQuery(locale === 'bn' ? dist.nameBn : dist.nameEn);
    setIsSearchFocused(false);
  };

  const handleResetFilters = () => {
    setIsEmptyMapPreview(false);
    setSelectedSection('all');
    setSelectedDistrictFilter('all');
    setSelectedDesignation('all');
    setSelectedDivision('all');
    setSelectedDensityTier(null);
    setDistrictSearchQuery('');
    setEmployeeSearchQuery('');
  };

  const currentSectionLabel = useMemo(() => {
    const found = SECTION_OPTIONS.find(s => s.id === selectedSection);
    return found ? (locale === 'bn' ? found.nameBn.split(' (')[0] : found.nameEn) : '';
  }, [selectedSection, locale]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & FILTER CONTROL SYSTEM (সেকশন + জেলা + পদবি ফিল্টার) */}
      <div className="bg-white rounded-2xl p-6 border border-[#EDE4DC] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#0D8A6A]/10 via-[#EC1C24]/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C7B7C]">
                {locale === 'bn' ? 'বাংলাদেশ কর্মী মানচিত্র · ৬৪ জেলা' : 'BANGLADESH WORKFORCE MAP · 64 DISTRICTS'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F6EC] text-[#15803D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-ping mr-1.5" />
                {locale === 'bn' ? 'লাইভ অনবোর্ডিং সিঙ্ক' : 'Live Onboarding Sync'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2A1A1B]">
              {locale === 'bn' ? 'আমাদের বাংলাদেশ — জেলা ও সেকশনভিত্তিক কর্মী বণ্টন' : 'Our Bangladesh — District & Section Workforce Map'}
            </h1>
            <p className="text-xs md:text-sm text-[#8C7B7C] mt-1">
              {locale === 'bn'
                ? 'কর্মী অনবোর্ড হওয়ার সাথে সাথে জেলাগুলো মানচিত্রে হাইলাইট হয়। সেকশন, জেলা এবং পদবি দিয়ে ফিল্টার করে কর্মীদের তালিকা দেখুন।'
                : 'Districts dynamically light up as employees onboard. Filter by Section, District, and Designation to inspect staff.'}
            </p>
          </div>

          {/* Quick State / Theme Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Default 0/64 Empty Map vs Active Onboarding Map */}
            <button
              type="button"
              onClick={() => setIsEmptyMapPreview(prev => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shadow-xs ${
                isEmptyMapPreview
                  ? 'bg-[#0D8A6A] text-white border-[#0D8A6A]'
                  : 'bg-[#FBF6F2] text-[#2A1A1B] border-[#EDE4DC] hover:border-[#0D8A6A]'
              }`}
              title={
                locale === 'bn'
                  ? 'যখন কোনো এমপ্লয়ি অনবোর্ড করা নেই তখন ডিফল্ট ম্যাপ (০/৬৪) কেমন দেখাবে তা দেখুন'
                  : 'Preview Default Empty Map State (0/64)'
              }
            >
              <span>{isEmptyMapPreview ? '🟢' : '⚪'}</span>
              <span>
                {isEmptyMapPreview
                  ? locale === 'bn'
                    ? 'অনবোর্ডেড কর্মী ম্যাপে ফিরুন'
                    : 'Show Active Workforce Map'
                  : locale === 'bn'
                  ? 'ডিফল্ট ম্যাপ দেখুন (০/৬৪)'
                  : 'Default Empty Map (0/64)'}
              </span>
            </button>

            <button
              onClick={() => setShowPosterModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FDE8E9] border border-[#EDE4DC] text-[#EC1C24] rounded-xl text-xs font-bold transition shadow-xs"
              title="Share Poster"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'পোস্টার' : 'Poster'}</span>
            </button>
          </div>
        </div>

        {/* PROMINENT 3-TIER FILTER PANEL: SECTION + DISTRICT + DESIGNATION */}
        <div className="mt-5 p-4 md:p-5 bg-[#FBF6F2] rounded-2xl border border-[#EDE4DC] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EC1C24] text-white flex items-center justify-center shadow-xs">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#2A1A1B]">
                  {locale === 'bn'
                    ? 'স্মার্ট ফিল্টারিং সিস্টেম (সেকশন · জেলা · পদবি)'
                    : 'Smart Workforce Filter (Section · District · Designation)'}
                </h2>
                <p className="text-[11px] text-[#8C7B7C]">
                  {locale === 'bn'
                    ? 'যেমন: কাস্টিং সেকশনে হবিগঞ্জ জেলার সুপারভাইজার, বিভাগীয় প্রধান বা এমপ্লয়ি কে কে আছেন তা দেখুন'
                    : 'Example: Filter Casting Section + Habiganj District + Supervisor / HOD / Employee'}
                </p>
              </div>
            </div>

            {/* Quick Example Presets for 1-Click Testing */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsEmptyMapPreview(false);
                  setSelectedSection('casting');
                  setSelectedDistrictFilter('habiganj');
                  setSelectedDesignation('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition border flex items-center gap-1 ${
                  selectedSection === 'casting' && selectedDistrictFilter === 'habiganj' && !isEmptyMapPreview
                    ? 'bg-[#EC1C24] text-white border-[#EC1C24] shadow-xs'
                    : 'bg-white text-[#2A1A1B] border-[#EDE4DC] hover:border-[#EC1C24]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{locale === 'bn' ? 'কাস্টিং + হবিগঞ্জ জেলা' : 'Casting + Habiganj'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEmptyMapPreview(false);
                  setSelectedSection('all');
                  setSelectedDistrictFilter('habiganj');
                  setSelectedDesignation('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition border ${
                  selectedSection === 'all' && selectedDistrictFilter === 'habiganj' && !isEmptyMapPreview
                    ? 'bg-[#0D8A6A] text-white border-[#0D8A6A] shadow-xs'
                    : 'bg-white text-[#2A1A1B] border-[#EDE4DC] hover:border-[#0D8A6A]'
                }`}
              >
                <span>{locale === 'bn' ? 'সকল সেকশন + হবিগঞ্জ' : 'All Sections + Habiganj'}</span>
              </button>

              {(selectedSection !== 'all' ||
                selectedDistrictFilter !== 'all' ||
                selectedDesignation !== 'all' ||
                isEmptyMapPreview) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#2A1A1B] text-white hover:bg-black transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{locale === 'bn' ? 'সকল ফিল্টার রিসেট' : 'Reset All'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Main Dropdown Selectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* FILTER 1: SECTION / DEPARTMENT */}
            <div className="bg-white p-3 rounded-xl border border-[#EDE4DC] shadow-2xs">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#8C7B7C] mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#EC1C24]" />
                <span>{locale === 'bn' ? '১. সেকশন / বিভাগ নির্বাচন করুন' : '1. Select Section / Dept'}</span>
              </label>
              <select
                value={selectedSection}
                onChange={e => {
                  setIsEmptyMapPreview(false);
                  setSelectedSection(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#EDE4DC] bg-[#FBF6F2] focus:bg-white text-xs font-bold text-[#2A1A1B] focus:outline-none focus:border-[#EC1C24] cursor-pointer"
              >
                {SECTION_OPTIONS.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {locale === 'bn' ? sec.nameBn : sec.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* FILTER 2: DISTRICT (64 DISTRICTS) */}
            <div className="bg-white p-3 rounded-xl border border-[#EDE4DC] shadow-2xs">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#8C7B7C] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0D8A6A]" />
                <span>{locale === 'bn' ? '২. জেলা নির্বাচন করুন (৬৪ জেলা)' : '2. Select Home District'}</span>
              </label>
              <select
                value={selectedDistrictFilter}
                onChange={e => {
                  setIsEmptyMapPreview(false);
                  setSelectedDistrictFilter(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#EDE4DC] bg-[#FBF6F2] focus:bg-white text-xs font-bold text-[#2A1A1B] focus:outline-none focus:border-[#0D8A6A] cursor-pointer"
              >
                <option value="all">
                  {locale === 'bn'
                    ? `সকল জেলা (মোট ${toBanglaDigits(sectionOnlyEmployees.length)} জন কর্মী)`
                    : `All 64 Districts (${sectionOnlyEmployees.length} staff)`}
                </option>
                {/* Sort districts so those with employees in the selected section appear first, then alphabetically */}
                {[...BANGLADESH_DISTRICTS]
                  .sort((a, b) => {
                    const ca = sectionDistrictCounts.get(a.id) || 0;
                    const cb = sectionDistrictCounts.get(b.id) || 0;
                    if (cb !== ca) return cb - ca;
                    return a.nameEn.localeCompare(b.nameEn);
                  })
                  .map(dist => {
                    const cnt = sectionDistrictCounts.get(dist.id) || 0;
                    return (
                      <option key={dist.id} value={dist.id}>
                        {locale === 'bn'
                          ? `${dist.nameBn} (${dist.nameEn}) — ${toBanglaDigits(cnt)} জন`
                          : `${dist.nameEn} (${dist.nameBn}) — ${cnt} staff`}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* FILTER 3: DESIGNATION (পদবি) */}
            <div className="bg-white p-3 rounded-xl border border-[#EDE4DC] shadow-2xs">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#8C7B7C] mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>{locale === 'bn' ? '৩. পদবি নির্বাচন করুন (Designation)' : '3. Select Designation'}</span>
              </label>
              <select
                value={selectedDesignation}
                onChange={e => {
                  setIsEmptyMapPreview(false);
                  setSelectedDesignation(e.target.value as DesignationCategory);
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#EDE4DC] bg-[#FBF6F2] focus:bg-white text-xs font-bold text-[#2A1A1B] focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {DESIGNATION_FILTER_OPTIONS.map(des => (
                  <option key={des.id} value={des.id}>
                    {locale === 'bn' ? des.nameBn : des.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Search District Input & Address Type Toggle Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#EDE4DC]/80">
            {/* Search District Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#8C7B7C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  locale === 'bn'
                    ? 'দ্রুত জেলা খুঁজুন (যেমন: হবিগঞ্জ, ফরিদপুর, রাজবাড়ী, লক্ষ্মীপুর, কুমিল্লা)...'
                    : 'Type to search & jump to any district (e.g. Habiganj, Faridpur, Cumilla)...'
                }
                value={districtSearchQuery}
                onChange={e => {
                  setDistrictSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchedDistricts.length > 0) {
                    handleSelectDistrictFromSearch(searchedDistricts[0]);
                  }
                }}
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#EDE4DC] focus:border-[#0D8A6A] rounded-xl text-xs font-medium text-[#2A1A1B] placeholder-[#8C7B7C] focus:outline-none"
              />
              {districtSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setDistrictSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7B7C] hover:text-[#2A1A1B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Search Dropdown */}
              {isSearchFocused && searchedDistricts.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-[#EDE4DC] shadow-2xl z-50 overflow-hidden divide-y divide-[#EDE4DC] max-h-64 overflow-y-auto">
                  {searchedDistricts.map(dist => {
                    const count = sectionDistrictCounts.get(dist.id) || 0;
                    return (
                      <div
                        key={dist.id}
                        onMouseDown={() => handleSelectDistrictFromSearch(dist)}
                        className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#E7F6EC]/60 transition text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              count > 0 ? 'bg-[#0D8A6A]' : 'bg-[#D6CFC2]'
                            }`}
                          />
                          <span className="font-bold text-[#2A1A1B]">
                            {locale === 'bn' ? dist.nameBn : dist.nameEn}
                          </span>
                          <span className="text-[#8C7B7C] text-[11px]">
                            ({locale === 'bn' ? dist.nameEn : dist.nameBn})
                          </span>
                        </div>
                        <span className="font-bold text-[#0D8A6A]">
                          {formatLocalizedNumber(count, locale)} {locale === 'bn' ? 'জন' : 'staff'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Address Type & Highlight Color Theme */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex p-0.5 bg-white border border-[#EDE4DC] rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setAddressType('permanent')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    addressType === 'permanent'
                      ? 'bg-[#2A1A1B] text-white'
                      : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
                  }`}
                >
                  {locale === 'bn' ? 'স্থায়ী ঠিকানা' : 'Permanent'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddressType('present')}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    addressType === 'present'
                      ? 'bg-[#2A1A1B] text-white'
                      : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
                  }`}
                >
                  {locale === 'bn' ? 'বর্তমান ঠিকানা' : 'Present'}
                </button>
              </div>

              {/* Highlight Palette Switcher (Emerald Green vs Charu Red) */}
              <div className="inline-flex p-0.5 bg-white border border-[#EDE4DC] rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setMapColorScheme('emerald')}
                  className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                    mapColorScheme === 'emerald'
                      ? 'bg-[#0D8A6A] text-white'
                      : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300" />
                  <span>{locale === 'bn' ? 'সবুজ থিম' : 'Green'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapColorScheme('crimson')}
                  className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                    mapColorScheme === 'crimson'
                      ? 'bg-[#EC1C24] text-white'
                      : 'text-[#8C7B7C] hover:text-[#2A1A1B]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-300" />
                  <span>{locale === 'bn' ? 'লাল থিম' : 'Red'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID: LEFT = AUTHENTIC BANGLADESH MAP POSTER | RIGHT = DESIGNATION BREAKDOWN & EMPLOYEE LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): AUTHENTIC BANGLADESH 64-DISTRICT MAP CARD (Matching Image 2 & Image 3) */}
        <div className="lg:col-span-7 bg-[#F6F2E9] rounded-3xl border border-[#E2DDD2] p-5 md:p-7 shadow-md flex flex-col justify-between relative overflow-hidden">
          {/* Top Poster Header inside Map Frame (Matches "আমার বাংলাদেশ ০/৬৪" & "৫/৬৪") */}
          <div className="flex items-start justify-between gap-4 mb-3 relative z-10">
            <div>
              <div className="text-xs md:text-sm font-bold text-[#6E6A63] tracking-wide">
                {locale === 'bn' ? 'বাংলাদেশ কর্মী ম্যাপ' : 'Bangladesh Workforce Map'}
                {selectedSection !== 'all' && (
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-[#0D8A6A]/15 text-[#0D8A6A] text-xs font-extrabold">
                    {currentSectionLabel}
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-[#1C1B18] tracking-tight mt-0.5">
                {locale === 'bn' ? 'আমার বাংলাদেশ' : 'Our Bangladesh'}
              </h2>
            </div>

            {/* Right Big Fraction Counter: e.g. ০/৬৪ or ৫/৬৪ or ২৬/৬৪ */}
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-1">
                <span
                  className="text-4xl md:text-5xl font-black tracking-tight transition-colors duration-300"
                  style={{
                    color: mapColorScheme === 'emerald' ? '#0D8A6A' : '#EC1C24',
                  }}
                >
                  {formatLocalizedNumber(distribution.districtsCovered, locale)}
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-[#6E6A63]">
                  /{formatLocalizedNumber(64, locale)}
                </span>
              </div>

              {/* Zoom Toolbar */}
              <div className="flex items-center gap-0.5 bg-white/80 backdrop-blur-xs border border-[#DED8CE] rounded-xl p-0.5 mt-2 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.max(0.85, z - 0.2))}
                  className="p-1 hover:bg-white text-[#6E6A63] hover:text-[#1C1B18] rounded-lg transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-[#6E6A63] px-1.5">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.min(2.4, z + 0.2))}
                  className="p-1 hover:bg-white text-[#6E6A63] hover:text-[#1C1B18] rounded-lg transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:bg-white text-[#6E6A63] hover:text-[#1C1B18] rounded-lg transition"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Map Canvas */}
          <div
            ref={mapContainerRef}
            onMouseLeave={handleMouseLeaveDistrict}
            className="relative w-full aspect-[2391/2106] rounded-2xl overflow-hidden flex items-center justify-center select-none"
          >
            {/* Floating District Hover Tooltip */}
            {hoveredDistrict && (() => {
              const accentColor =
                hoveredDistrict.count > 0
                  ? mapColorScheme === 'emerald'
                    ? '#0D8A6A'
                    : '#EC1C24'
                  : '#8C7B7C';
              const containerWidth = mapContainerRef.current?.clientWidth || 500;
              const clampedLeft = Math.min(Math.max(hoveredDistrict.x, 105), containerWidth - 105);
              const showBelow = hoveredDistrict.y < 120;

              return (
                <div
                  className="absolute pointer-events-none z-40 shadow-2xl rounded-2xl p-3 border border-white/20 bg-[#141413]/95 backdrop-blur-md text-white text-xs whitespace-nowrap min-w-[190px]"
                  style={{
                    left: `${clampedLeft}px`,
                    top: showBelow ? `${hoveredDistrict.y + 22}px` : `${hoveredDistrict.y - 18}px`,
                    transform: showBelow ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)',
                  }}
                >
                  {showBelow ? (
                    <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-3 h-3 bg-[#141413] border-l border-t border-white/20 rotate-45" />
                  ) : (
                    <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-[#141413] border-r border-b border-white/20 rotate-45" />
                  )}

                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="font-bold text-sm text-white">
                        {locale === 'bn'
                          ? hoveredDistrict.district.nameBn
                          : hoveredDistrict.district.nameEn}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/60 uppercase font-semibold bg-white/10 px-1.5 py-0.5 rounded">
                      {hoveredDistrict.district.divisionId}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-3 pt-1.5 border-t border-white/10">
                    <span className="text-white/70 text-[11px]">
                      {selectedSection !== 'all'
                        ? locale === 'bn'
                          ? `${currentSectionLabel}-এ কর্মী:`
                          : `Staff in ${currentSectionLabel}:`
                        : locale === 'bn'
                        ? 'মোট কর্মী সংখ্যা:'
                        : 'Total Employees:'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-base font-black"
                        style={{
                          color: hoveredDistrict.count > 0 ? '#34D399' : '#9CA3AF',
                        }}
                      >
                        {formatLocalizedNumber(hoveredDistrict.count, locale)}
                      </span>
                      <span className="text-[10px] text-white/60">
                        {locale === 'bn' ? 'জন' : 'staff'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/50 mt-1">
                    {locale === 'bn'
                      ? 'ক্লিক করে এই জেলার কর্মীদের ফিল্টার করুন'
                      : 'Click to filter employees of this district'}
                  </div>
                </div>
              );
            })()}

            {/* Scalable Map Layer */}
            <div
              className="relative w-full h-full transition-transform duration-300 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Clean 0/64 Base Map Image (All 64 districts in muted stone #E3DCCB with #F6F2E9 borders) */}
              <img
                src="/assets/aistudio/bangladesh-map-clean-base.jpg"
                alt="Bangladesh 64 Districts Base Map"
                className="w-full h-full object-contain pointer-events-none select-none"
              />

              {/* Dynamic 64-District Vector Polygon Overlay (2391 x 2106) */}
              <svg
                viewBox="0 0 2391 2106"
                className="absolute inset-0 w-full h-full pointer-events-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
                  </filter>
                </defs>

                {/* LAYER 1: District Polygons (Highlight active districts where count > 0, plus hover/selected states) */}
                {BANGLADESH_DISTRICTS.map(dist => {
                  const exact = EXACT_DISTRICT_SVG_PATHS[dist.id];
                  if (!exact || !exact.path) return null;

                  const stat = statsMap.get(dist.id);
                  const count = stat ? stat.count : 0;
                  const hasEmployees = count > 0 && !isEmptyMapPreview;
                  const isSelectedDistrict = selectedDistrictFilter === dist.id;
                  const isHovered = hoveredDistrict?.district.id === dist.id;
                  const tier = getDensityTier(count);

                  const matchesDivision =
                    selectedDivision === 'all' || dist.divisionId === selectedDivision;
                  const matchesDensity =
                    selectedDensityTier === null || selectedDensityTier === tier;
                  const isVisibleByFilter = matchesDivision && matchesDensity;

                  // Determine polygon fill color when highlighted or hovered
                  let fillColor = 'transparent';
                  let fillOpacity = 0;

                  if (hasEmployees && isVisibleByFilter) {
                    if (mapColorScheme === 'emerald') {
                      // Authentic "আমার বাংলাদেশ" Emerald Green style from Image 3
                      fillColor = isHovered
                        ? '#06A77D'
                        : isSelectedDistrict
                        ? '#096B52'
                        : '#0D8A6A';
                      fillOpacity = isHovered ? 0.98 : 0.94;
                    } else {
                      // Charu Red density ramp style
                      fillColor =
                        count >= 6
                          ? '#C81922'
                          : count >= 3
                          ? '#E02F35'
                          : '#EE5A45';
                      fillOpacity = isHovered ? 0.98 : 0.92;
                    }
                  } else if (isSelectedDistrict && !isEmptyMapPreview) {
                    // Selected district with 0 employees in current filter: subtle amber/outline highlight
                    fillColor = '#F59E0B';
                    fillOpacity = 0.42;
                  } else if (isHovered) {
                    fillColor = mapColorScheme === 'emerald' ? '#0D8A6A' : '#EC1C24';
                    fillOpacity = 0.34;
                  }

                  const strokeColor =
                    isSelectedDistrict && !isEmptyMapPreview
                      ? '#1C1B18'
                      : isHovered
                      ? '#FFFFFF'
                      : hasEmployees && isVisibleByFilter
                      ? '#F6F2E9'
                      : 'transparent';

                  const strokeWidth = isSelectedDistrict
                    ? 5.5
                    : isHovered
                    ? 4.5
                    : hasEmployees && isVisibleByFilter
                    ? 2.5
                    : 0;

                  return (
                    <path
                      key={`poly-${dist.id}`}
                      d={exact.path}
                      fill={fillColor}
                      fillOpacity={fillOpacity}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      pointerEvents="all"
                      className="cursor-pointer transition-colors duration-200"
                      onClick={() => {
                        setIsEmptyMapPreview(false);
                        setSelectedDistrictFilter(prev => (prev === dist.id ? 'all' : dist.id));
                      }}
                      onMouseEnter={e => handleMouseEnterDistrict(dist, e)}
                      onMouseMove={handleMouseMoveDistrict}
                    />
                  );
                })}

                {/* LAYER 2: Bullseye Pins & Bengali District Name Labels at Exact 2391x2106 Polygon Centroids */}
                {[...BANGLADESH_DISTRICTS]
                  .sort((a, b) => {
                    // Render hovered and selected districts last so their labels always appear on top
                    const aPriority =
                      hoveredDistrict?.district.id === a.id
                        ? 2
                        : selectedDistrictFilter === a.id
                        ? 1
                        : 0;
                    const bPriority =
                      hoveredDistrict?.district.id === b.id
                        ? 2
                        : selectedDistrictFilter === b.id
                        ? 1
                        : 0;
                    return aPriority - bPriority;
                  })
                  .map(dist => {
                    const exact = EXACT_DISTRICT_SVG_PATHS[dist.id];
                    if (!exact) return null;

                    const stat = statsMap.get(dist.id);
                    const count = stat ? stat.count : 0;
                    const hasEmployees = count > 0 && !isEmptyMapPreview;
                    const isSelectedDistrict = selectedDistrictFilter === dist.id && !isEmptyMapPreview;
                    const isHovered = hoveredDistrict?.district.id === dist.id;
                    const tier = getDensityTier(count);

                    const matchesDivision =
                      selectedDivision === 'all' || dist.divisionId === selectedDivision;
                    const matchesDensity =
                      selectedDensityTier === null || selectedDensityTier === tier;

                    if ((!matchesDivision || !matchesDensity) && !isHovered) return null;

                    // Show pin & label on districts that are highlighted (have employees) or selected/hovered
                    if (!hasEmployees && !isSelectedDistrict && !isHovered) return null;

                    // Always anchor pin at the exact 2391x2106 polygon interior center
                    const pinX = exact.cx;
                    const pinY = exact.cy;
                    const mapCoord = BANGLADESH_MAP_COORDINATES[dist.id];
                    const labelPos = mapCoord?.labelPos || 'top';

                    let labelX = pinX;
                    let labelY = pinY - 22;
                    let labelAnchor: 'start' | 'middle' | 'end' = 'middle';

                    if (labelPos === 'right') {
                      labelX = pinX + (mapCoord?.labelOffsetX ?? (hasEmployees ? 56 : 24));
                      labelY = pinY + (mapCoord?.labelOffsetY ?? 7);
                      labelAnchor = 'start';
                    } else if (labelPos === 'left') {
                      labelX = pinX + (mapCoord?.labelOffsetX ?? -20);
                      labelY = pinY + (mapCoord?.labelOffsetY ?? 7);
                      labelAnchor = 'end';
                    } else if (labelPos === 'bottom') {
                      labelX = pinX + (mapCoord?.labelOffsetX ?? 0);
                      labelY = pinY + (mapCoord?.labelOffsetY ?? 34);
                      labelAnchor = 'middle';
                    } else {
                      labelX = pinX + (mapCoord?.labelOffsetX ?? 0);
                      labelY = pinY + (mapCoord?.labelOffsetY ?? -22);
                      labelAnchor = 'middle';
                    }

                    const isEmphasized = isSelectedDistrict || isHovered;

                    return (
                      <g
                        key={`pin-${dist.id}`}
                        className="pointer-events-none"
                      >
                        {/* Radar Pulse on Selected or Hovered District */}
                        {isEmphasized && (
                          <circle
                            cx={pinX}
                            cy={pinY}
                            r="36"
                            fill="#EC1C24"
                            className="animate-ping opacity-45"
                          />
                        )}

                        {/* Bullseye Pin (White Outer Ring + Red Center Dot, matching Image 3) */}
                        <circle
                          cx={pinX}
                          cy={pinY}
                          r={isEmphasized ? 17 : 13}
                          fill="#FFFFFF"
                          stroke="#1C1B18"
                          strokeWidth={isEmphasized ? 3.5 : 2.2}
                          filter="url(#pinShadow)"
                        />
                        <circle
                          cx={pinX}
                          cy={pinY}
                          r={isEmphasized ? 8.5 : 6.5}
                          fill="#EC1C24"
                        />

                        {/* Employee Count Pill next to pin when > 0 */}
                        {hasEmployees && (
                          <g transform={`translate(${pinX + 15}, ${pinY - 6})`}>
                            <rect
                              x="0"
                              y="-13"
                              width={count >= 10 ? 42 : 32}
                              height="20"
                              rx="10"
                              fill="#EC1C24"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                            <text
                              x={count >= 10 ? 21 : 16}
                              y="1"
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize="13"
                              fontWeight="900"
                              fontFamily="sans-serif"
                            >
                              {formatLocalizedNumber(count, locale)}
                            </text>
                          </g>
                        )}

                        {/* Crisp Bengali District Label with White Outline Halo right at its District */}
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor={labelAnchor}
                          fill={isEmphasized ? '#EC1C24' : '#1C1B18'}
                          fontSize={isEmphasized ? '31' : '25'}
                          fontWeight="900"
                          stroke="#FFFFFF"
                          strokeWidth="6.5"
                          paintOrder="stroke"
                          style={{ letterSpacing: '0.3px' }}
                        >
                          {locale === 'bn' ? dist.nameBn : dist.nameEn}
                        </text>
                      </g>
                    );
                  })}
              </svg>
            </div>
          </div>

          {/* Bottom Progress Bar & Summary Strip inside Map Poster (Matches Image 2 & Image 3) */}
          <div className="mt-4 pt-3 space-y-2.5 relative z-10">
            {/* Progress Track */}
            <div className="w-full h-3 bg-[#E2DDD2] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, distribution.coveragePercentage)}%`,
                  backgroundColor: mapColorScheme === 'emerald' ? '#0D8A6A' : '#EC1C24',
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
              <div className="font-extrabold text-[#1C1B18]">
                {formatLocalizedNumber(distribution.coveragePercentage, locale)}%{' '}
                {locale === 'bn' ? 'বাংলাদেশ কভার হয়েছে' : 'of Bangladesh Covered'}
              </div>
              <div className="font-semibold text-[#6E6A63]">
                {locale === 'bn'
                  ? `${toBanglaDigits(distribution.districtsCovered)}টি জেলা · ৮টির মধ্যে ${toBanglaDigits(divisionsCoveredCount)}টি বিভাগ`
                  : `${distribution.districtsCovered} Districts · ${divisionsCoveredCount} of 8 Divisions`}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): DESIGNATION BREAKDOWN + FILTERED EMPLOYEE LIST */}
        <div className="lg:col-span-5 space-y-5">
          {/* CARD A: DESIGNATION BREAKDOWN (পদবি অনুযায়ী কর্মী সংখ্যা: বিভাগীয় প্রধান, সুপারভাইজার, এমপ্লয়ি) */}
          <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-[#EDE4DC] pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#EC1C24]" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#EC1C24]">
                    {locale === 'bn' ? 'পদবি ভিত্তিক পরিসংখ্যান' : 'DESIGNATION BREAKDOWN'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#2A1A1B] mt-0.5">
                  {selectedDistrictGeo
                    ? locale === 'bn'
                      ? `${selectedDistrictGeo.nameBn} জেলা`
                      : `${selectedDistrictGeo.nameEn} District`
                    : locale === 'bn'
                    ? 'সকল জেলা'
                    : 'All Districts'}{' '}
                  ·{' '}
                  <span className="text-[#0D8A6A]">
                    {selectedSection === 'all'
                      ? locale === 'bn'
                        ? 'সকল সেকশন'
                        : 'All Sections'
                      : currentSectionLabel}
                  </span>
                </h3>
              </div>

              <div className="text-right bg-[#FBF6F2] px-3 py-1.5 rounded-xl border border-[#EDE4DC]">
                <div className="text-xl font-black text-[#2A1A1B]">
                  {formatLocalizedNumber(designationBreakdown.total, locale)}
                </div>
                <div className="text-[10px] font-bold text-[#8C7B7C]">
                  {locale === 'bn' ? 'মোট কর্মী' : 'Total Staff'}
                </div>
              </div>
            </div>

            {/* 3 Interactive Role Tier Cards: বিভাগীয় প্রধান (HOD), সুপারভাইজার (Supervisor), এমপ্লয়ি (Employee) */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. HOD / বিভাগীয় প্রধান */}
              <button
                type="button"
                onClick={() =>
                  setSelectedDesignation(prev => (prev === 'hod' ? 'all' : 'hod'))
                }
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  selectedDesignation === 'hod'
                    ? 'border-[#EC1C24] bg-[#FDE8E9]/60 ring-2 ring-[#EC1C24]/20 shadow-xs'
                    : 'border-[#EDE4DC] bg-[#FBF6F2] hover:bg-white hover:border-[#EC1C24]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-[#EC1C24] bg-[#FDE8E9] px-2 py-0.5 rounded-md">
                    HOD
                  </span>
                  {selectedDesignation === 'hod' && (
                    <span className="w-2 h-2 rounded-full bg-[#EC1C24] animate-ping" />
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-black text-[#2A1A1B]">
                    {formatLocalizedNumber(designationBreakdown.hodCount, locale)}
                    <span className="text-xs font-bold text-[#8C7B7C] ml-1">
                      {locale === 'bn' ? 'জন' : ''}
                    </span>
                  </div>
                  <div className="text-[11px] font-extrabold text-[#2A1A1B] mt-0.5 leading-tight">
                    {locale === 'bn' ? 'বিভাগীয় প্রধান' : 'Dept Head'}
                  </div>
                </div>
              </button>

              {/* 2. Supervisor / সুপারভাইজার */}
              <button
                type="button"
                onClick={() =>
                  setSelectedDesignation(prev => (prev === 'supervisor' ? 'all' : 'supervisor'))
                }
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  selectedDesignation === 'supervisor'
                    ? 'border-[#0D8A6A] bg-[#E7F6EC]/70 ring-2 ring-[#0D8A6A]/20 shadow-xs'
                    : 'border-[#EDE4DC] bg-[#FBF6F2] hover:bg-white hover:border-[#0D8A6A]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-[#0D8A6A] bg-[#E7F6EC] px-2 py-0.5 rounded-md">
                    SUP
                  </span>
                  {selectedDesignation === 'supervisor' && (
                    <span className="w-2 h-2 rounded-full bg-[#0D8A6A] animate-ping" />
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-black text-[#2A1A1B]">
                    {formatLocalizedNumber(designationBreakdown.supervisorCount, locale)}
                    <span className="text-xs font-bold text-[#8C7B7C] ml-1">
                      {locale === 'bn' ? 'জন' : ''}
                    </span>
                  </div>
                  <div className="text-[11px] font-extrabold text-[#2A1A1B] mt-0.5 leading-tight">
                    {locale === 'bn' ? 'সুপারভাইজার' : 'Supervisor'}
                  </div>
                </div>
              </button>

              {/* 3. Employee / এমপ্লয়ি */}
              <button
                type="button"
                onClick={() =>
                  setSelectedDesignation(prev => (prev === 'employee' ? 'all' : 'employee'))
                }
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  selectedDesignation === 'employee'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 shadow-xs'
                    : 'border-[#EDE4DC] bg-[#FBF6F2] hover:bg-white hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                    EMP
                  </span>
                  {selectedDesignation === 'employee' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-black text-[#2A1A1B]">
                    {formatLocalizedNumber(designationBreakdown.employeeCount, locale)}
                    <span className="text-xs font-bold text-[#8C7B7C] ml-1">
                      {locale === 'bn' ? 'জন' : ''}
                    </span>
                  </div>
                  <div className="text-[11px] font-extrabold text-[#2A1A1B] mt-0.5 leading-tight">
                    {locale === 'bn' ? 'এমপ্লয়ি / অপারেটর' : 'Employee'}
                  </div>
                </div>
              </button>
            </div>

            <div className="text-[11px] text-[#8C7B7C] flex items-center justify-between pt-1">
              <span>
                {locale === 'bn'
                  ? 'পদবি কার্ডে ক্লিক করে সরাসরি তালিকা ফিল্টার করুন'
                  : 'Click any designation card above to filter the employee list'}
              </span>
              {selectedDesignation !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedDesignation('all')}
                  className="text-[#EC1C24] font-bold hover:underline"
                >
                  {locale === 'bn' ? 'সব পদবি দেখুন' : 'Show All'}
                </button>
              )}
            </div>
          </div>

          {/* CARD B: FILTERED EMPLOYEE LIST (নির্বাচিত সেকশন, জেলা ও পদবির কর্মীদের তালিকা) */}
          <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-extrabold text-[#2A1A1B] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#0D8A6A]" />
                  <span>
                    {locale === 'bn' ? 'কর্মীদের তালিকা (Employee List)' : 'Filtered Employee List'}
                  </span>
                </h4>
                <p className="text-[11px] text-[#8C7B7C]">
                  {locale === 'bn'
                    ? `পাওয়া গেছে ${toBanglaDigits(finalFilteredEmployees.length)} জন কর্মী`
                    : `Showing ${finalFilteredEmployees.length} matching employees`}
                </p>
              </div>

              {/* Search within filtered employees */}
              <div className="relative w-44">
                <Search className="w-3 h-3 text-[#8C7B7C] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={locale === 'bn' ? 'নাম বা আইডি খুঁজুন...' : 'Find by name/ID...'}
                  value={employeeSearchQuery}
                  onChange={e => setEmployeeSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 text-[11px] bg-[#FBF6F2] border border-[#EDE4DC] rounded-lg focus:outline-none focus:border-[#EC1C24]"
                />
                {employeeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setEmployeeSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7B7C]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Employee Cards List */}
            {finalFilteredEmployees.length > 0 ? (
              <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
                {finalFilteredEmployees.map(emp => {
                  const empDistId = getEmpDistrictId(emp);
                  const distObj = BANGLADESH_DISTRICTS.find(d => d.id === empDistId);
                  const roleGrp = getDesignationRoleGroup(emp.employment.designationId);
                  const addrDetails =
                    addressType === 'permanent' ? emp.address.permanent : emp.address.present;

                  return (
                    <div
                      key={emp.empId}
                      onClick={() => setSelectedDistrictFilter(empDistId)}
                      className="p-3 rounded-xl border border-[#EDE4DC] hover:border-[#0D8A6A] bg-[#FBF6F2]/60 hover:bg-white transition cursor-pointer flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={emp.photoUrl}
                          alt={emp.nameEn}
                          className="w-10 h-10 rounded-full object-cover border border-[#EDE4DC] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-[#2A1A1B] group-hover:text-[#0D8A6A] transition truncate">
                              {locale === 'bn' ? emp.nameBn : emp.nameEn}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#8C7B7C] bg-white px-1.5 py-0.5 rounded border border-[#EDE4DC]">
                              #{emp.empId}
                            </span>
                          </div>

                          {/* Designation & Section Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                roleGrp === 'hod'
                                  ? 'bg-[#FDE8E9] text-[#EC1C24]'
                                  : roleGrp === 'supervisor'
                                  ? 'bg-[#E7F6EC] text-[#0D8A6A]'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              {roleGrp === 'hod'
                                ? locale === 'bn'
                                  ? `বিভাগীয় প্রধান (${emp.employment.designationName})`
                                  : emp.employment.designationName
                                : roleGrp === 'supervisor'
                                ? locale === 'bn'
                                  ? `সুপারভাইজার (${emp.employment.designationName})`
                                  : emp.employment.designationName
                                : locale === 'bn'
                                ? `এমপ্লয়ি (${emp.employment.designationName})`
                                : emp.employment.designationName}
                            </span>

                            <span className="text-[10px] font-semibold text-[#2A1A1B] bg-white border border-[#EDE4DC] px-2 py-0.5 rounded-md">
                              {emp.employment.deptName} · {emp.employment.sectionName}
                            </span>
                          </div>

                          {/* District & Upazila Location */}
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#8C7B7C]">
                            <span className="flex items-center gap-1 font-semibold text-[#2A1A1B]">
                              <MapPin className="w-3 h-3 text-[#EC1C24]" />
                              {distObj
                                ? locale === 'bn'
                                  ? distObj.nameBn
                                  : distObj.nameEn
                                : empDistId}
                              {addrDetails?.upazila ? `, ${addrDetails.upazila}` : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {emp.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {onFilterEmployeeDistrict && isHR && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onFilterEmployeeDistrict(empDistId);
                          }}
                          className="p-1.5 rounded-lg bg-white border border-[#EDE4DC] text-[#8C7B7C] hover:text-[#EC1C24] hover:border-[#EC1C24] shrink-0"
                          title={locale === 'bn' ? 'প্রোফাইল ডিরেক্টরিতে দেখুন' : 'Open in Directory'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FBF6F2] rounded-2xl border border-dashed border-[#EDE4DC] space-y-2">
                <Users className="w-8 h-8 text-[#8C7B7C] mx-auto opacity-60" />
                <div className="text-xs font-bold text-[#2A1A1B]">
                  {isEmptyMapPreview
                    ? locale === 'bn'
                      ? 'ডিফল্ট খালি ম্যাপ প্রিভিউ সক্রিয় (০ জন কর্মী)'
                      : 'Default Empty Map Preview Active (0 Employees)'
                    : locale === 'bn'
                    ? 'এই ফিল্টারে কোনো কর্মী পাওয়া যায়নি'
                    : 'No employees match the current filter combination'}
                </div>
                <p className="text-[11px] text-[#8C7B7C]">
                  {locale === 'bn'
                    ? 'অন্য সেকশন, জেলা বা পদবি নির্বাচন করুন অথবা ফিল্টার রিসেট করুন।'
                    : 'Try selecting another Section, District, or Designation.'}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 px-3.5 py-1.5 bg-[#EC1C24] text-white rounded-xl text-xs font-bold hover:bg-[#C4141B] transition"
                >
                  {locale === 'bn' ? 'সকল কর্মী দেখুন' : 'Reset Filters'}
                </button>
              </div>
            )}
          </div>

          {/* CARD C: RANKED DISTRICTS BY SHARE */}
          <div className="bg-white rounded-2xl border border-[#EDE4DC] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#2A1A1B]">
                {locale === 'bn' ? 'কোন জেলা থেকে কত জন (র‌্যাংকিং)' : 'Ranked Districts by Headcount'}
              </h4>
              <span className="text-xs text-[#8C7B7C]">
                {locale === 'bn'
                  ? `মোট ${toBanglaDigits(distribution.districtsCovered)}টি জেলায় কর্মী`
                  : `${distribution.districtsCovered} active districts`}
              </span>
            </div>

            <div className="space-y-2">
              {(showAllRanked ? distribution.stats : distribution.stats.slice(0, 5)).map(
                (item, index) => {
                  const sharePct = item.percentage;
                  const isCurrent = selectedDistrictFilter === item.districtId;
                  return (
                    <div
                      key={item.districtId}
                      onClick={() => {
                        if (item.districtId !== 'others') {
                          setIsEmptyMapPreview(false);
                          setSelectedDistrictFilter(prev =>
                            prev === item.districtId ? 'all' : item.districtId
                          );
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-[#0D8A6A] bg-[#E7F6EC]/50'
                          : 'border-[#EDE4DC] hover:border-[#8C7B7C] bg-[#FBF6F2]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white border border-[#EDE4DC] flex items-center justify-center font-bold text-[11px] text-[#8C7B7C]">
                            {formatLocalizedNumber(index + 1, locale)}
                          </span>
                          <span className="font-bold text-[#2A1A1B]">
                            {locale === 'bn' ? item.nameBn : item.nameEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#0D8A6A]">
                            {formatLocalizedNumber(item.count, locale)} {locale === 'bn' ? 'জন' : 'staff'}
                          </span>
                          <span className="text-[#8C7B7C] text-[11px]">
                            ({formatLocalizedNumber(sharePct, locale)}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-[#EDE4DC] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (item.count / maxCount) * 100)}%`,
                            backgroundColor: mapColorScheme === 'emerald' ? '#0D8A6A' : '#EC1C24',
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {distribution.stats.length > 5 && (
              <button
                onClick={() => setShowAllRanked(s => !s)}
                className="mt-3 w-full py-1.5 text-center text-xs font-bold text-[#0D8A6A] hover:underline flex items-center justify-center gap-1"
              >
                <span>
                  {showAllRanked
                    ? locale === 'bn'
                      ? 'সংক্ষিপ্ত করুন'
                      : 'Show Less'
                    : locale === 'bn'
                    ? `সকল সক্রিয় জেলা দেখুন (${toBanglaDigits(distribution.stats.length)}টি)`
                    : `Show All (${distribution.stats.length} districts)`}
                </span>
                {showAllRanked ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shareable Board Poster Modal */}
      {showPosterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF6F2] rounded-3xl max-w-lg w-full p-6 border border-[#EDE4DC] shadow-2xl relative">
            <button
              onClick={() => setShowPosterModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#EDE4DC] text-[#2A1A1B] flex items-center justify-center hover:bg-[#FDE8E9]"
            >
              ✕
            </button>

            <div className="bg-white rounded-2xl p-6 border border-[#EDE4DC] shadow-md text-center">
              <div className="w-10 h-10 mx-auto mb-2 bg-[#EC1C24] rounded-lg rotate-45 flex items-center justify-center shadow-lg">
                <div className="w-3 h-3 bg-white -rotate-45" />
              </div>
              <h2 className="text-xl font-black tracking-wide text-[#2A1A1B]">
                CHARU CERAMIC INDUSTRIES LTD
              </h2>
              <div className="text-[10px] tracking-widest uppercase text-[#8C7B7C] font-semibold">
                STYLISH LIVING · WORKFORCE DEMOGRAPHICS
              </div>

              <div className="my-5 p-4 bg-[#FBF6F2] rounded-xl border border-[#EDE4DC] text-left">
                <div className="text-xs text-[#8C7B7C] uppercase font-bold">
                  {locale === 'bn' ? 'সারসংক্ষেপ' : 'Summary Executive Metric'}
                </div>
                <div className="text-2xl font-black text-[#0D8A6A] mt-1">
                  {formatLocalizedNumber(distribution.districtsCovered, locale)}/
                  {formatLocalizedNumber(64, locale)}{' '}
                  {locale === 'bn' ? 'জেলা কভার' : 'Districts'} (
                  {formatLocalizedNumber(distribution.coveragePercentage, locale)}%)
                </div>
                <div className="text-xs text-[#2A1A1B] mt-2">
                  <span className="font-bold">Active Staff Mapped:</span>{' '}
                  {finalFilteredEmployees.length} employees across {divisionsCoveredCount} divisions.
                </div>
              </div>

              <div className="text-[11px] text-[#8C7B7C] flex items-center justify-between border-t border-[#EDE4DC] pt-3">
                <span>Verified by HR Department</span>
                <span className="text-[#EC1C24] font-semibold">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  window.print();
                  setShowPosterModal(false);
                }}
                className="flex-1 py-2.5 bg-[#EC1C24] text-white rounded-xl text-xs font-bold hover:bg-[#C4141B] transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>{locale === 'bn' ? 'প্রিন্ট / সেভ করুন' : 'Print / Save PDF'}</span>
              </button>
              <button
                onClick={() => setShowPosterModal(false)}
                className="py-2.5 px-4 bg-white border border-[#EDE4DC] text-[#2A1A1B] rounded-xl text-xs font-semibold hover:bg-gray-100"
              >
                {locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
