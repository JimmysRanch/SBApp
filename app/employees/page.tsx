"use client";
export const runtime = "nodejs";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import React from "react";

// Type definition for an employee record
const INACTIVE_KEYWORDS = ["inactive", "archived", "disabled", "terminated", "deleted"];

interface Employee {
  id: string;
  name: string;
  active: boolean;
}

function inferIsActive(record: Record<string, unknown> | null | undefined) {
  if (!record || typeof record !== "object") {
    return true;
  }

  const boolKeys = ["active", "is_active", "enabled", "is_enabled"] as const;
  for (const key of boolKeys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  const status = (record as Record<string, unknown>).status;
  if (typeof status === "string") {
    const lowered = status.toLowerCase();
    if (INACTIVE_KEYWORDS.some((flag) => lowered.includes(flag))) {
      return false;
    }
  }

  const archivedAt = (record as Record<string, unknown>).archived_at;
  if (archivedAt !== null && archivedAt !== undefined) {
    return false;
  }

  return true;
}

function coerceString(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

/**
 * Employees list page.  Displays a list of employees and a button to
 * create a new employee.  An employee detail page could be added
 * similarly to the clients detail view.
 */
export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const loadEmployees = async (page = 1, searchTerm = search, statusFilter = status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/employees?${params}`);
      if (!response.ok) throw new Error("Failed to load employees");
      
      const { data, pagination } = await response.json();
      
      const mapped = (data as any[]).map((row, index) => ({
        id: coerceString(row.id, `staff-${index + 1}`),
        name: coerceString(row.name, `Staff #${index + 1}`),
        active: inferIsActive(row),
      }));
      
      setRows(mapped);
      setCurrentPage(pagination.page);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error("Failed to load employees:", error);
      // Fallback to old method if new API fails
      const { data, error: supabaseError } = await supabase.from("employees").select("*").order("name");
      if (!supabaseError && data) {
        const mapped = (data as any[]).map((row, index) => ({
          id: coerceString(row.id, `staff-${index + 1}`),
          name: coerceString(row.name, `Staff #${index + 1}`),
          active: inferIsActive(row),
        }));
        setRows(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadEmployees(1, search, status);
  };

  const handlePageChange = (page: number) => {
    loadEmployees(page, search, status);
  };

  return (
    <PageContainer>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="space-y-4 md:col-span-2">
          <h1 className="text-3xl font-bold text-primary-dark">Staff</h1>
          
          {/* Search and Filter Form */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Search
            </button>
          </form>
          
          <div>
            <Link
              href="/employees/new"
              className="inline-block rounded-full bg-primary px-4 py-2 text-white shadow hover:bg-primary-dark"
            >
              Add Staff Member
            </Link>
          </div>
          
          {loading ? (
            <p>Loading…</p>
          ) : (
            <ul className="divide-y">
              {rows.map((e) => (
                <li
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="relative flex cursor-pointer justify-between py-3"
                >
                  <span className="font-medium">{e.name}</span>
                  <span className="text-sm text-gray-600">{e.active ? "Active" : "Inactive"}</span>
                  {selected?.id === e.id && (
                    <Link
                      href={`/employees/${e.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-primary/80 text-lg font-semibold text-white"
                    >
                      Employee Page
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </Card>
        <Card className="md:col-start-3">
          {selected ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-primary-dark">Quick View</h2>
              <p className="font-medium">{selected.name}</p>
              <p className="text-sm text-gray-600">
                Status: {selected.active ? "Active" : "Inactive"}
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-lg font-semibold text-primary-dark">Employee Details</h2>
              <p className="text-sm text-gray-600">Select an employee to view details.</p>
            </>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
