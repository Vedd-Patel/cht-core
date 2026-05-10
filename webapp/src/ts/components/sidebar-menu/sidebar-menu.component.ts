import { Component, OnDestroy, OnInit, ViewChild, Input } from '@angular/core';
import { BaseMenuComponent } from '@mm-components/base-menu/base-menu.component';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { PanelHeaderComponent } from '@mm-components/panel-header/panel-header.component';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink, NavigationStart, Router } from '@angular/router';
import { AuthDirective } from '@mm-directives/auth.directive';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { RelativeDatePipe } from '@mm-pipes/date.pipe';

import { GlobalActions } from '@mm-actions/global';

import { Store } from '@ngrx/store';
import { LocationService } from '@mm-services/location.service';
import { DBSyncService } from '@mm-services/db-sync.service';
import { ModalService } from '@mm-services/modal.service';
import { StorageInfoService } from '@mm-services/storage-info.service';
import { SettingsService } from '@mm-services/settings.service';

import { filter } from 'rxjs/operators';
import { Selectors } from '@mm-selectors/index';

@Component({
  selector: 'mm-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  imports: [
    MatSidenavContainer,
    MatSidenav,
    PanelHeaderComponent,
    MatSidenavContent,
    NgFor,
    RouterLink,
    AuthDirective,
    MatIcon,
    NgIf,
    NgClass,
    TranslatePipe,
    RelativeDatePipe,
  ],
})
export class SidebarMenuComponent extends BaseMenuComponent implements OnInit, OnDestroy {
  @Input() canLogOut: boolean = false;
  @ViewChild('sidebar') sidebar!: MatSidenav;
  private globalActions: GlobalActions;
  replicationStatus: any;
  moduleOptions: MenuOption[] = [];
  secondaryOptions: MenuOption[] = [];
  adminAppPath: string = '';

  constructor(
    protected store: Store,
    protected locationService: LocationService,
    protected dbSyncService: DBSyncService,
    protected modalService: ModalService,
    private router: Router,
    protected readonly storageInfoService: StorageInfoService,
    private settingsService: SettingsService,
  ) {
    super(store, dbSyncService, modalService, storageInfoService);
    this.globalActions = new GlobalActions(store);
  }

  ngOnInit() {
    super.ngOnInit();
    this.adminAppPath = this.locationService.adminPath;
    this.setModuleOptions();
    this.setSecondaryOptions();
    this.additionalSubscriptions();
    this.subscribeToRouter();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  close() {
    return this.globalActions.closeSidebarMenu();
  }

  replicate(): void {
    if (this.replicationStatus?.current?.disableSyncButton) {
      return;
    }
    super.replicate();
  }

  private subscribeToRouter() {
    const routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => this.close());
    this.subscriptions.add(routerSubscription);
  }

  private additionalSubscriptions() {
    const subscribeSidebarMenu = this.store
      .select(Selectors.getSidebarMenu)
      .subscribe((sidebarMenu: any) => this.sidebar?.toggle(sidebarMenu?.isOpen));
    this.subscriptions.add(subscribeSidebarMenu);

    const subscribePrivacyPolicy = this.store
      .select(Selectors.getShowPrivacyPolicy)
      .subscribe((showPrivacyPolicy: boolean) => this.setSecondaryOptions(showPrivacyPolicy));
    this.subscriptions.add(subscribePrivacyPolicy);
  }

  private sortByWeight(options: MenuOption[]): MenuOption[] {
    return [...options].sort((a, b) => {
      const wa = a.weight ?? 6;
      const wb = b.weight ?? 6;
      if (wa !== wb) {
        return wa - wb;
      }
      return a.translationKey.localeCompare(b.translationKey);
    });
  }

  private async setModuleOptions() {
    let settings: Record<string, any> = {};
    try {
      settings = await this.settingsService.get();
    } catch (e) {
      console.error('Failed to load settings for sidebar menu ordering', e);
    }

    const headerTabsConfig: Record<string, any> = settings?.['header_tabs'] ?? {};

    const getWeight = (name: string, defaultWeight: number): number => {
      const configWeight = headerTabsConfig[name]?.weight;
      return typeof configWeight === 'number' ? configWeight : defaultWeight;
    };

    const builtInOptions: MenuOption[] = [
      {
        routerLink: 'messages',
        icon: 'fa-envelope',
        translationKey: 'Messages',
        hasPermissions: 'can_view_messages,!can_view_messages_tab',
        weight: getWeight('messages', 1),
      },
      {
        routerLink: 'tasks',
        icon: 'fa-flag',
        translationKey: 'Tasks',
        hasPermissions: 'can_view_tasks,!can_view_tasks_tab',
        weight: getWeight('tasks', 2),
      },
      {
        routerLink: 'reports',
        icon: 'fa-list-alt',
        translationKey: 'Reports',
        hasPermissions: 'can_view_reports,!can_view_reports_tab',
        weight: getWeight('reports', 3),
      },
      {
        routerLink: 'contacts',
        icon: 'fa-user',
        translationKey: 'Contacts',
        hasPermissions: 'can_view_contacts,!can_view_contacts_tab',
        weight: getWeight('contacts', 4),
      },
      {
        routerLink: 'analytics',
        icon: 'fa-bar-chart-o',
        translationKey: 'Analytics',
        hasPermissions: 'can_view_analytics,!can_view_analytics_tab',
        weight: getWeight('analytics', 5),
      },
    ];

    const extensionOptions: MenuOption[] = (settings?.['app_main_tab'] ?? []).map((ext: any) => ({
      routerLink: ext.route ?? ext.name ?? ext.id,
      icon: ext.icon?.startsWith('fa-') ? ext.icon : 'fa-plus',
      translationKey: ext.title ?? ext.name ?? ext.id ?? '',
      hasPermissions: ext.permissions ? ext.permissions.join(',') : undefined,
      canDisplay: !ext.permissions,
      weight: typeof ext.weight === 'number' ? ext.weight : 6,
    }));

    this.moduleOptions = this.sortByWeight([...builtInOptions, ...extensionOptions]);
  }

  private setSecondaryOptions(showPrivacyPolicy = false) {
    this.secondaryOptions = [
      {
        routerLink: 'trainings',
        icon: 'fa-graduation-cap',
        translationKey: 'training_materials.page.title',
        canDisplay: true,
      },
      {
        routerLink: 'about',
        icon: 'fa-question',
        translationKey: 'about',
        canDisplay: true,
      },
      {
        routerLink: 'user',
        icon: 'fa-user',
        translationKey: 'edit.user.settings',
        hasPermissions: 'can_edit_profile',
      },
      {
        routerLink: 'privacy-policy',
        icon: 'fa-lock',
        translationKey: 'privacy.policy',
        canDisplay: showPrivacyPolicy,
      },
      {
        icon: 'fa-bug',
        translationKey: 'Report Bug',
        canDisplay: true,
        click: () => this.openFeedback(),
      },
    ];
  }
}

interface MenuOption {
  icon: string;
  translationKey: string;
  routerLink?: string;
  hasPermissions?: string;
  canDisplay?: boolean;
  click?: () => void;
  weight?: number;
}
