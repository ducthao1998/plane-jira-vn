/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { isEmpty } from "lodash-es";
import { Zap } from "lucide-react";
import { observer } from "mobx-react";
import { Link, useLocation, useParams } from "react-router";
// plane helpers
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { cn } from "@plane/utils";
// components
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper";
import { SidebarFavoritesMenu } from "@/components/workspace/sidebar/favorites/favorites-menu";
import { SidebarProjectsList } from "@/components/workspace/sidebar/projects-list";
import { SidebarQuickActions } from "@/components/workspace/sidebar/quick-actions";
import { SidebarMenuItems } from "@/components/workspace/sidebar/sidebar-menu-items";
// hooks
import { useFavorite } from "@/hooks/store/use-favorite";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { SidebarTeamsList } from "@/plane-web/components/workspace/sidebar/teams-sidebar-list";

const DapdSidebarLink: FC = observer(function DapdSidebarLink() {
  const params = useParams();
  const location = useLocation();
  const slug = params.workspaceSlug;
  if (!slug) return null;
  const href = `/${slug}/dapd-dashboard`;
  const isActive = location.pathname === href;
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 transition outline-none",
        {
          "!bg-layer-transparent-active text-primary": isActive,
          "text-secondary hover:bg-layer-transparent-hover": !isActive,
        }
      )}
    >
      <Zap className="size-4 flex-shrink-0" />
      <span className="text-13 font-medium">DAPD Dashboard</span>
      <span className="bg-purple-100 text-purple-700 ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold">AI</span>
    </Link>
  );
});

export const AppSidebar = observer(function AppSidebar() {
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { groupedFavorites } = useFavorite();

  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const isFavoriteEmpty = isEmpty(groupedFavorites);

  return (
    <SidebarWrapper title="Projects" quickActions={<SidebarQuickActions />}>
      <SidebarMenuItems />
      {/* DAPD Dashboard Link */}
      <DapdSidebarLink />
      {/* Favorites Menu */}
      {canPerformWorkspaceMemberActions && !isFavoriteEmpty && <SidebarFavoritesMenu />}
      {/* Teams List */}
      <SidebarTeamsList />
      {/* Projects List */}
      <SidebarProjectsList />
    </SidebarWrapper>
  );
});
