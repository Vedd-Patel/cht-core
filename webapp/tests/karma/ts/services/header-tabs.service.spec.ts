import { TestBed } from '@angular/core/testing';
import * as chai from 'chai';
import { expect } from 'chai';
import sinon from 'sinon';
chai.use(require('chai-shallow-deep-equal'));

import { HeaderTabsService } from '@mm-services/header-tabs.service';
import { AuthService } from '@mm-services/auth.service';

describe('HeaderTabs service', () => {
  let service: HeaderTabsService;
  let authService;

  beforeEach(() => {
    authService = { has: sinon.stub() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService }
      ]
    });

    service = TestBed.inject(HeaderTabsService);
  });

  afterEach(() => sinon.restore());

  describe('get()', () => {
    it('should return default tabs when settings not provided', () => {
      const tabs = service.get();
      // @ts-ignore
      expect(tabs).to.shallowDeepEqual([
        { name: 'messages', defaultIcon: 'fa-envelope', icon: undefined, weight: 1 },
        { name: 'tasks', defaultIcon: 'fa-flag', icon: undefined, weight: 2 },
        { name: 'reports', defaultIcon: 'fa-list-alt', icon: undefined, weight: 3 },
        { name: 'contacts', defaultIcon: 'fa-user', icon: undefined, weight: 4 },
        { name: 'analytics', defaultIcon: 'fa-bar-chart-o', icon: undefined, weight: 5 },
      ]);

      expect(service.get({})).to.deep.equal(tabs);
      expect(service.get({ key: 'value' } as any as any)).to.deep.equal(tabs);
      expect(service.get({ header_tabs: {} })).to.deep.equal(tabs);
    });

    it('should replace icons when provided', () => {
      const headerTabsSettings = {
        tasks: { icon: 'fa-whatever' },
        reports: { resource_icon: 'some-icon' },
        analytics: { resource_icon: 'other-icon', icon: 'fa-icon' },
        contacts: { resource_icon: 'one-icon', icon: 'not-fa-icon' },
      };

      const tabs = service.get({ header_tabs: headerTabsSettings });
      // @ts-ignore
      expect(tabs).to.shallowDeepEqual([
        { name: 'messages', icon: undefined, resourceIcon: undefined, defaultIcon: 'fa-envelope', weight: 1 },
        { name: 'tasks', icon: 'fa-whatever', resourceIcon: undefined, defaultIcon: 'fa-flag', weight: 2 },
        { name: 'reports', icon: undefined, resourceIcon: 'some-icon', defaultIcon: 'fa-list-alt', weight: 3 },
        { name: 'contacts', icon: undefined, resourceIcon: 'one-icon', defaultIcon: 'fa-user', weight: 4 },
        { name: 'analytics', icon: 'fa-icon', resourceIcon: 'other-icon', defaultIcon: 'fa-bar-chart-o', weight: 5 },
      ]);
    });

    it('should include typeName property for tabs that need bubble counters', () => {
      const tabs = service.get();

      const messagesTab = tabs.find(tab => tab.name === 'messages');
      expect(messagesTab).to.exist;
      expect(messagesTab!.typeName).to.equal('message');

      const tasksTab = tabs.find(tab => tab.name === 'tasks');
      expect(tasksTab).to.exist;
      expect(tasksTab!.typeName).to.equal('task');

      const reportsTab = tabs.find(tab => tab.name === 'reports');
      expect(reportsTab).to.exist;
      expect(reportsTab!.typeName).to.equal('report');

      const contactsTab = tabs.find(tab => tab.name === 'contacts');
      expect(contactsTab).to.exist;
      expect(contactsTab!.typeName).to.be.undefined;

      const analyticsTab = tabs.find(tab => tab.name === 'analytics');
      expect(analyticsTab).to.exist;
      expect(analyticsTab!.typeName).to.be.undefined;
    });
  });

  describe('getAuthorizedTabs()', () => {
    it('should return authorized tabs', async () => {
      authService.has.withArgs(['can_view_messages', 'can_view_messages_tab']).returns(true);
      authService.has.withArgs(['can_view_tasks', 'can_view_tasks_tab']).returns(false);
      authService.has.withArgs(['can_view_reports', 'can_view_reports_tab']).returns(true);
      authService.has.withArgs(['can_view_contacts', 'can_view_contacts_tab']).returns(false);
      authService.has.withArgs(['can_view_analytics', 'can_view_analytics_tab']).returns(true);

      const tabs = await service.getAuthorizedTabs();

      expect(tabs).to.deep.equal([
        {
          name: 'messages',
          route: 'messages',
          defaultIcon: 'fa-envelope',
          translation: 'Messages',
          permissions: ['can_view_messages', 'can_view_messages_tab'],
          typeName: 'message',
          icon: undefined,
          resourceIcon: undefined,
          weight: 1
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
          weight: 3
        },
        {
          name: 'analytics',
          route: 'analytics',
          defaultIcon: 'fa-bar-chart-o',
          translation: 'Analytics',
          permissions: ['can_view_analytics', 'can_view_analytics_tab'],
          icon: undefined,
          resourceIcon: undefined,
          weight: 5
        }
      ]);
    });

    it('should return empty array if there arent authorized tabs', async () => {
      authService.has.returns(false);

      const tabs = await service.getAuthorizedTabs();

      expect(tabs).to.deep.equal([]);
    });

    it('should return default tabs when settings not provided', async () => {
      authService.has.withArgs(['can_view_messages', 'can_view_messages_tab']).returns(false);
      authService.has.withArgs(['can_view_tasks', 'can_view_tasks_tab']).returns(true);
      authService.has.withArgs(['can_view_reports', 'can_view_reports_tab']).returns(false);
      authService.has.withArgs(['can_view_contacts', 'can_view_contacts_tab']).returns(true);
      authService.has.withArgs(['can_view_analytics', 'can_view_analytics_tab']).returns(true);

      const tabs = await service.getAuthorizedTabs();

      expect(tabs).to.deep.equal([
        {
          name: 'tasks',
          route: 'tasks',
          defaultIcon: 'fa-flag',
          translation: 'Tasks',
          permissions: ['can_view_tasks', 'can_view_tasks_tab'],
          typeName: 'task',
          icon: undefined,
          resourceIcon: undefined,
          weight: 2
        },
        {
          name: 'contacts',
          route: 'contacts',
          defaultIcon: 'fa-user',
          translation: 'Contacts',
          permissions: ['can_view_contacts', 'can_view_contacts_tab'],
          icon: undefined,
          resourceIcon: undefined,
          weight: 4
        },
        {
          name: 'analytics',
          route: 'analytics',
          defaultIcon: 'fa-bar-chart-o',
          translation: 'Analytics',
          permissions: ['can_view_analytics', 'can_view_analytics_tab'],
          icon: undefined,
          resourceIcon: undefined,
          weight: 5
        }
      ]);
    });

    it('should replace icons when provided', async () => {
      const headerTabsSettings = {
        messages: { resource_icon: 'pomegranate-icon' },
        tasks: { icon: 'fa-apple' },
        contacts: { resource_icon: 'pear-icon', icon: 'not-fa-pear-icon' },
        reports: { resource_icon: 'pineapple-icon', icon: 'not-fa-pineapple-icon' },
        analytics: { resource_icon: 'mango-icon', icon: 'fa-mango-icon' },
      };
      authService.has.withArgs(['can_view_messages', 'can_view_messages_tab']).returns(true);
      authService.has.withArgs(['can_view_tasks', 'can_view_tasks_tab']).returns(true);
      authService.has.withArgs(['can_view_reports', 'can_view_reports_tab']).returns(false);
      authService.has.withArgs(['can_view_contacts', 'can_view_contacts_tab']).returns(true);
      authService.has.withArgs(['can_view_analytics', 'can_view_analytics_tab']).returns(true);

      const tabs = await service.getAuthorizedTabs({ header_tabs: headerTabsSettings });

      expect(tabs).to.deep.equal([
        {
          name: 'messages',
          route: 'messages',
          defaultIcon: 'fa-envelope',
          translation: 'Messages',
          permissions: ['can_view_messages', 'can_view_messages_tab'],
          typeName: 'message',
          icon: undefined,
          resourceIcon: 'pomegranate-icon',
          weight: 1
        },
        {
          name: 'tasks',
          route: 'tasks',
          defaultIcon: 'fa-flag',
          translation: 'Tasks',
          permissions: ['can_view_tasks', 'can_view_tasks_tab'],
          typeName: 'task',
          icon: 'fa-apple',
          resourceIcon: undefined,
          weight: 2
        },
        {
          name: 'contacts',
          route: 'contacts',
          defaultIcon: 'fa-user',
          translation: 'Contacts',
          permissions: ['can_view_contacts', 'can_view_contacts_tab'],
          icon: undefined,
          resourceIcon: 'pear-icon',
          weight: 4
        },
        {
          name: 'analytics',
          route: 'analytics',
          defaultIcon: 'fa-bar-chart-o',
          translation: 'Analytics',
          permissions: ['can_view_analytics', 'can_view_analytics_tab'],
          icon: 'fa-mango-icon',
          resourceIcon: 'mango-icon',
          weight: 5
        }
      ]);
    });
  });

  describe('getPrimaryTab()', () => {
    it('should return the primary tab from the authorized ones', async () => {
      authService.has.withArgs(['can_view_messages', 'can_view_messages_tab']).returns(true);
      authService.has.withArgs(['can_view_tasks', 'can_view_tasks_tab']).returns(false);
      authService.has.withArgs(['can_view_reports', 'can_view_reports_tab']).returns(true);
      authService.has.withArgs(['can_view_contacts', 'can_view_contacts_tab']).returns(false);
      authService.has.withArgs(['can_view_analytics', 'can_view_analytics_tab']).returns(true);

      const tab = await service.getPrimaryTab();

      expect(tab).to.deep.equal({
        name: 'messages',
        route: 'messages',
        defaultIcon: 'fa-envelope',
        translation: 'Messages',
        permissions: ['can_view_messages', 'can_view_messages_tab'],
        typeName: 'message',
        icon: undefined,
        resourceIcon: undefined,
        weight: 1
      });
    });

    it('should return the primary tab and it is not the first tab from the original list', async () => {
      authService.has.withArgs(['can_view_messages', 'can_view_messages_tab']).returns(false);
      authService.has.withArgs(['can_view_tasks', 'can_view_tasks_tab']).returns(false);
      authService.has.withArgs(['can_view_reports', 'can_view_reports_tab']).returns(true);
      authService.has.withArgs(['can_view_contacts', 'can_view_contacts_tab']).returns(false);
      authService.has.withArgs(['can_view_analytics', 'can_view_analytics_tab']).returns(true);

      const tab = await service.getPrimaryTab();

      expect(tab).to.deep.equal({
        name: 'reports',
        route: 'reports',
        defaultIcon: 'fa-list-alt',
        translation: 'Reports',
        permissions: ['can_view_reports', 'can_view_reports_tab'],
        typeName: 'report',
        icon: undefined,
        resourceIcon: undefined,
        weight: 3
      });
    });

    it('should return undefined if there arent authorized tabs', async () => {
      authService.has.returns(false);

      const tab = await service.getPrimaryTab();

      expect(tab).to.be.undefined;
    });

    it('should return default tab when settings not provided', async () => {
      authService.has.withArgs(['can_view_messages', 'can_view_messages_tab']).returns(false);
      authService.has.withArgs(['can_view_tasks', 'can_view_tasks_tab']).returns(false);
      authService.has.withArgs(['can_view_reports', 'can_view_reports_tab']).returns(false);
      authService.has.withArgs(['can_view_contacts', 'can_view_contacts_tab']).returns(true);
      authService.has.withArgs(['can_view_analytics', 'can_view_analytics_tab']).returns(true);

      const tab = await service.getPrimaryTab();

      expect(tab).to.deep.equal({
        name: 'contacts',
        route: 'contacts',
        defaultIcon: 'fa-user',
        translation: 'Contacts',
        permissions: ['can_view_contacts', 'can_view_contacts_tab'],
        icon: undefined,
        resourceIcon: undefined,
        weight: 4
      });
    });

    it('should replace icons when provided', async () => {
      const headerTabsSettings = {
        messages: { resource_icon: 'pomegranate-icon' },
        tasks: { icon: 'fa-apple' },
        contacts: { resource_icon: 'pear-icon', icon: 'not-fa-pear-icon' },
        reports: { resource_icon: 'pineapple-icon', icon: 'not-fa-pineapple-icon' },
        analytics: { resource_icon: 'mango-icon', icon: 'fa-mango-icon' },
      };
      authService.has.withArgs(['can_view_messages', 'can_view_messages_tab']).returns(false);
      authService.has.withArgs(['can_view_tasks', 'can_view_tasks_tab']).returns(false);
      authService.has.withArgs(['can_view_reports', 'can_view_reports_tab']).returns(false);
      authService.has.withArgs(['can_view_contacts', 'can_view_contacts_tab']).returns(false);
      authService.has.withArgs(['can_view_analytics', 'can_view_analytics_tab']).returns(true);

      const tab = await service.getPrimaryTab({ header_tabs: headerTabsSettings });

      expect(tab).to.deep.equal({
        name: 'analytics',
        route: 'analytics',
        defaultIcon: 'fa-bar-chart-o',
        translation: 'Analytics',
        permissions: ['can_view_analytics', 'can_view_analytics_tab'],
        icon: 'fa-mango-icon',
        resourceIcon: 'mango-icon',
        weight: 5
      });
    });
  });
});
