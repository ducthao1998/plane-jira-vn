/**
 * DAPD Dashboard Layout - Tich hop DAPD Engine vao Plane
 */

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { DapdDashboardHeader } from "./header";

export default function DapdDashboardLayout() {
  return (
    <>
      <AppHeader header={<DapdDashboardHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
