import { User, Microscope, TrendingUp, CheckSquare, Shield, Settings, Tag } from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'common:routes.application',
    children: [
      {
        label: 'XAI Analysis',
        path: '/home/analysis',
        Icon: <Microscope className={iconClasses} />,
        end: true,
      },
      {
        label: 'Analytics',
        path: '/home/analytics',
        Icon: <TrendingUp className={iconClasses} />,
      },
      {
        label: 'Review Queue',
        path: '/home/review-queue',
        Icon: <CheckSquare className={iconClasses} />,
      },
      {
        label: 'Compliance',
        path: '/home/compliance',
        Icon: <Shield className={iconClasses} />,
      },
      {
        label: 'Custom Defects',
        path: '/home/custom-defects',
        Icon: <Settings className={iconClasses} />,
      },
      {
        label: 'Dataset Labeling',
        path: '/home/labeling',
        Icon: <Tag className={iconClasses} />,
      },
    ],
  },
  {
    label: 'common:routes.settings',
    children: [
      {
        label: 'common:routes.profile',
        path: pathsConfig.app.profileSettings,
        Icon: <User className={iconClasses} />,
      },
    ],
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const navigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
});
