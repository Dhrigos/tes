"use client";

import AppLayoutTemplate from "@/layouts/app/app-sidebar-layout";
import { type BreadcrumbItem } from "@/types";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({
  children,
  breadcrumbs,
  ...props
}: AppLayoutProps) {
  return (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
      {children}

      {/* 🔔 Toaster Sonner untuk notifikasi */}
      <Toaster richColors position="top-right" />
    </AppLayoutTemplate>
  );
}
