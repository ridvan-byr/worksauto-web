"use client";

import * as React from "react";
import { Users, Calendar, History, Plus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useStaffList,
  useStaffLeaves,
  useStaffAuditLogs,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useCreateStaffLeave,
  StaffRecord,
  CreateStaffLeaveInput,
} from "@/features/staff/api/use-staff-management";
import { StaffRecord as SettingsStaffRecord } from "@/features/settings/api/use-settings";
import { StaffListTab } from "@/features/staff/components/staff-list-tab";
import { StaffLeaveTab } from "@/features/staff/components/staff-leave-tab";
import { StaffAuditTab } from "@/features/staff/components/staff-audit-tab";
import { CreateLeaveModal } from "@/features/staff/components/create-leave-modal";
import { StaffModal } from "@/features/settings/components/staff-modal";
import { StaffDeleteModal } from "@/features/settings/components/staff-delete-modal";

type ActiveTab = "staff" | "leaves" | "audit";

export default function StaffPage() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("staff");

  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<StaffRecord | null>(null);
  const [deletingStaff, setDeletingStaff] = React.useState<StaffRecord | null>(null);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = React.useState(false);
  const [leavePreselectedUserId, setLeavePreselectedUserId] = React.useState<string | null>(null);

  // Queries
  const { data: staffList = [], isLoading: isStaffLoading } = useStaffList();
  const { data: leaves = [], isLoading: isLeavesLoading } = useStaffLeaves();
  const { data: auditLogs = [], isLoading: isAuditLoading } = useStaffAuditLogs();

  // Mutations
  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();
  const createLeaveMutation = useCreateStaffLeave();

  // Handlers
  const handleOpenCreateStaff = () => {
    setEditingStaff(null);
    setIsStaffModalOpen(true);
  };

  const handleEditStaff = (staff: StaffRecord) => {
    setEditingStaff(staff);
    setIsStaffModalOpen(true);
  };

  const handleDeleteStaff = (staff: StaffRecord) => {
    setDeletingStaff(staff);
  };

  const handleDefineLeave = (staffId: string) => {
    setLeavePreselectedUserId(staffId);
    setIsLeaveModalOpen(true);
  };

  const handleStaffFormSubmit = async (data: {
    name: string;
    surname?: string;
    phone: string;
    email?: string;
    role: string;
    assignedLift?: string | null;
    specialty?: string;
    isActive?: boolean;
  }) => {
    if (editingStaff) {
      await updateStaffMutation.mutateAsync({ id: editingStaff.id, data });
      setIsStaffModalOpen(false);
      setEditingStaff(null);
    } else {
      await createStaffMutation.mutateAsync(data);
      setIsStaffModalOpen(false);
    }
  };

  const handleConfirmDeleteStaff = async () => {
    if (!deletingStaff) return;
    await deleteStaffMutation.mutateAsync(deletingStaff.id);
    setDeletingStaff(null);
  };

  const handleReactivateStaff = async (staff: StaffRecord) => {
    await updateStaffMutation.mutateAsync({
      id: staff.id,
      data: { isActive: true },
    });
  };

  const handleCreateLeaveSubmit = async (data: CreateStaffLeaveInput) => {
    await createLeaveMutation.mutateAsync(data);
    setIsLeaveModalOpen(false);
    setLeavePreselectedUserId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Personel & Kadro Yönetimi
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Servis ekibi, atölye ustaları, lift atamaları, izin takibi ve personel denetim geçmişi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLeavePreselectedUserId(null);
              setIsLeaveModalOpen(true);
            }}
            className="rounded-xl text-xs h-9 font-semibold text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            İzin Girişi
          </Button>
          <Button
            type="button"
            onClick={handleOpenCreateStaff}
            className="rounded-xl text-xs h-9 font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Yeni Personel Ekle
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 w-fit max-w-full overflow-x-auto border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "staff"
              ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Kadro & Ustalar</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-md bg-slate-200/60 dark:bg-slate-800 text-[10px] font-semibold">
            {staffList.filter((s) => s.isActive !== false).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leaves")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "leaves"
              ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>İzin Takibi</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-md bg-slate-200/60 dark:bg-slate-800 text-[10px] font-semibold">
            {leaves.filter((l) => l.status !== "CANCELLED").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "audit"
              ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <History className="h-4 w-4" />
          <span>İşlem Geçmişi</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-md bg-slate-200/60 dark:bg-slate-800 text-[10px] font-semibold">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "staff" && (
        <StaffListTab
          staff={staffList}
          leaves={leaves}
          onOpenCreateModal={handleOpenCreateStaff}
          onEditStaff={handleEditStaff}
          onDeleteStaff={handleDeleteStaff}
          onReactivateStaff={handleReactivateStaff}
          onDefineLeave={handleDefineLeave}
          isLoading={isStaffLoading}
        />
      )}

      {activeTab === "leaves" && (
        <StaffLeaveTab
          leaves={leaves}
          onOpenCreateModal={() => {
            setLeavePreselectedUserId(null);
            setIsLeaveModalOpen(true);
          }}
          isLoading={isLeavesLoading}
        />
      )}

      {activeTab === "audit" && (
        <StaffAuditTab logs={auditLogs} isLoading={isAuditLoading} />
      )}

      {/* Modals */}
      <StaffModal
        isOpen={isStaffModalOpen}
        editingStaff={editingStaff as unknown as SettingsStaffRecord}
        onClose={() => {
          setIsStaffModalOpen(false);
          setEditingStaff(null);
        }}
        onSubmit={handleStaffFormSubmit}
        isPending={createStaffMutation.isPending || updateStaffMutation.isPending}
      />

      <StaffDeleteModal
        staff={deletingStaff as unknown as SettingsStaffRecord}
        onClose={() => setDeletingStaff(null)}
        onConfirm={handleConfirmDeleteStaff}
        isPending={deleteStaffMutation.isPending}
      />

      <CreateLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setLeavePreselectedUserId(null);
        }}
        staffList={staffList}
        preselectedUserId={leavePreselectedUserId}
        onSubmit={handleCreateLeaveSubmit}
        isPending={createLeaveMutation.isPending}
      />
    </div>
  );
}
