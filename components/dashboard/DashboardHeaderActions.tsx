"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  canManageJobs,
  canUploadCv,
  type UserRole,
} from "@/lib/constants/roles";

export function DashboardHeaderActions({ userRole }: { userRole: UserRole }) {
  return (
    <div className="flex flex-wrap gap-2">
      {canUploadCv(userRole) && (
        <Link href="/upload">
          <Button size="sm">+ Subir CV</Button>
        </Link>
      )}
      {canManageJobs(userRole) && (
        <Link href="/jobs">
          <Button size="sm" variant="secondary">
            Gestionar vacantes
          </Button>
        </Link>
      )}
      <Link href="/pipeline">
        <Button size="sm" variant="secondary">
          Ver pipeline
        </Button>
      </Link>
    </div>
  );
}
