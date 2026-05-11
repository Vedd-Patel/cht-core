import { Injectable } from '@angular/core';

import { AuthService } from '@mm-services/auth.service';

const DEFAULT_TAB_WEIGHTS: Record<string, number> = {
  messages: 1,
  tasks: 2,
  reports: 3,
  contacts: 4,
  analytics: 5,
};

const DEFAULT_EXTENSION_WEIGHT = 6;

export interface ExtensionTab {
  id?: string;
  name?: string;
  route?: string;
  icon?: string;
  title?: string;
  permissions?: string[];
  resource_icon?: string;
  weight?: number;
}

export interface ChtSettings {
  header_tabs?: Record<string, { weight?: number; icon?: string; resource_icon?: string; }>;
  app_main_tab?: ExtensionTab[];
}

export interface HeaderTab {
  name: string;
  route: string;
  defaultIcon: string;
  translation: string;
  permissions: string[];
  typeName?: string;
  icon?: string;
  resourceIcon?: string;
  weight?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HeaderTabsService {
  constructor(
    private authService: AuthService
  ) { }

  private readonly tabs: HeaderTab[] = [
    {
      name: 'messages',
      route: 'messages',
      defaultIcon: 'fa-envelope',
      translation: 'Messages',
      permissions: ['can_view_messages', 'can_view_messages_tab'],
      typeName: 'message',
      icon: undefined,
      resourceIcon: undefined,
      weight: DEFAULT_TAB_WEIGHTS['messages'],
    },
    {
      name: 'tasks',
      route: 'tasks',
      defaultIcon: 'fa-flag',
      translation: 'Tasks',
      permissions: ['can_view_tasks', 'can_view_tasks_tab'],
      typeName: 'task',
      icon: undefined,
      resourceIcon: undefined,
      weight: DEFAULT_TAB_WEIGHTS['tasks'],
    },
    {
      name: 'reports',
      route: 'reports',
      defaultIcon: 'fa-list-alt',
      translation: 'Reports',
      permissions: ['can_view_reports', 'can_view_reports_tab'],
      typeName: 'report',
      icon: undefined,
      resourceIcon: undefined,
      weight: DEFAULT_TAB_WEIGHTS['reports'],
    },
    {
      name: 'contacts',
      route: 'contacts',
      defaultIcon: 'fa-user',
      translation: 'Contacts',
      permissions: ['can_view_contacts', 'can_view_contacts_tab'],
      icon: undefined,
      resourceIcon: undefined,
      weight: DEFAULT_TAB_WEIGHTS['contacts'],
    },
    {
      name: 'analytics',
      route: 'analytics',
      defaultIcon: 'fa-bar-chart-o',
      translation: 'Analytics',
      permissions: ['can_view_analytics', 'can_view_analytics_tab'],
      icon: undefined,
      resourceIcon: undefined,
      weight: DEFAULT_TAB_WEIGHTS['analytics'],
    }
  ];

  private sortTabsByWeight(tabs: HeaderTab[]): HeaderTab[] {
    return [...tabs].sort((a, b) => {
      const wa = a.weight ?? DEFAULT_EXTENSION_WEIGHT;
      const wb = b.weight ?? DEFAULT_EXTENSION_WEIGHT;
      if (wa !== wb) {
        return wa - wb;
      }
      return a.name.localeCompare(b.name);
    });
  }

  get(settings?: ChtSettings): HeaderTab[] {
    this.tabs.forEach(tab => {
      tab.weight = DEFAULT_TAB_WEIGHTS[tab.name];
      tab.icon = undefined;
      tab.resourceIcon = undefined;
    });

    if (!settings?.header_tabs && !settings?.app_main_tab) {
      return this.sortTabsByWeight(this.tabs);
    }

    if (settings?.header_tabs) {
      this.tabs.forEach(tab => {
        const tabConfig = settings.header_tabs?.[tab.name];
        if (!tabConfig) {
          return;
        }
        if (tabConfig.icon && tabConfig.icon.startsWith('fa-')) {
          tab.icon = tabConfig.icon;
        }
        if (tabConfig.resource_icon) {
          tab.resourceIcon = tabConfig.resource_icon;
        }
        if (typeof tabConfig.weight === 'number') {
          tab.weight = tabConfig.weight;
        }
      });
    }

    const extensionTabs: HeaderTab[] = this.getExtensionTabs(settings);
    const allTabs = [...this.tabs, ...extensionTabs];
    return this.sortTabsByWeight(allTabs);
  }

  private getExtensionTabs(settings?: ChtSettings): HeaderTab[] {
    const appMainTabs = settings?.app_main_tab ?? [];
    return appMainTabs.map(ext => ({
      name: ext.name ?? ext.id ?? '',
      route: ext.route ?? ext.name ?? ext.id ?? '',
      defaultIcon: ext.icon ?? 'fa-plus',
      translation: ext.title ?? ext.name ?? ext.id ?? '',
      permissions: ext.permissions ?? [],
      icon: ext.icon?.startsWith('fa-') ? ext.icon : undefined,
      resourceIcon: ext.resource_icon ?? undefined,
      weight: typeof ext.weight === 'number' ? ext.weight : DEFAULT_EXTENSION_WEIGHT,
    }));
  }

  async getAuthorizedTabs(settings?: ChtSettings): Promise<HeaderTab[]> {
    const tabs = this.get(settings);
    const tabAuthorization = await Promise.all(
      tabs.map(tab => this.authService.has(tab.permissions))
    );
    return tabs.filter((_, index) => tabAuthorization[index]);
  }

  async getPrimaryTab(settings?: ChtSettings): Promise<HeaderTab | undefined> {
    const tabs = await this.getAuthorizedTabs(settings);

    return tabs?.[0];
  }
}
