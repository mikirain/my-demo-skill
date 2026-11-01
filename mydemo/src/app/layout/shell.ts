import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { WorkspaceStore } from '../core/store';
import { ROLE_LABEL, COUNTRY_LABEL, deadlineText, deadlineTone } from '../core/format';
import { Icon } from '../shared/ui/icon';
import { Badge } from '../shared/ui/badge';
import { ToastHost } from '../shared/ui/toast-host';
import { ToastService } from '../shared/ui/toast.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Badge, ToastHost],
  template: `
    <a class="skip" href="#main">跳到主内容</a>

    <div class="shell">
      <aside class="sidebar" [class.sidebar--open]="mobileNav()">
        <div class="brand">
          <span class="brand__mark" aria-hidden="true"></span>
          <div class="brand__text">
            <span class="brand__name">BidScope</span>
            <span class="brand__sub">竞品标书分析工作台</span>
          </div>
        </div>

        <div class="sidebar__scroll">
          <nav class="nav" aria-label="主导航">
            @for (item of mainNav; track item.path) {
              <a
                class="nav__item"
                [routerLink]="item.path"
                routerLinkActive="nav__item--active"
                [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
                (click)="mobileNav.set(false)"
              >
                <ui-icon [name]="item.icon" [size]="16" />
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>

          <div class="nav-sep">
          <div class="nav-group__label">知识复用</div>
          <nav class="nav" aria-label="知识复用导航">
            @for (item of knowledgeNav; track item.path) {
              <a class="nav__item" [routerLink]="item.path" routerLinkActive="nav__item--active" (click)="mobileNav.set(false)">
                <ui-icon [name]="item.icon" [size]="16" />
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </div>

        @if (inProject() && project(); as p) {
          <div class="nav-group">
            <div class="nav-group__label">
              当前项目
              <span class="nav-group__name">{{ p.name }}</span>
              <span class="nav-group__meta">{{ country(p.country) }} · {{ p.mw }}MW/{{ p.mwh }}MWh</span>
            </div>
            <nav class="nav" aria-label="项目导航">
              @for (item of projectNav(p.id); track item.path) {
                <a
                  class="nav__item nav__item--sub"
                  [routerLink]="item.path"
                  routerLinkActive="nav__item--active"
                  (click)="mobileNav.set(false)"
                >
                  <ui-icon [name]="item.icon" [size]="16" />
                  <span>{{ item.label }}</span>
                </a>
              }
            </nav>
          </div>
        }
        </div>

        <div class="sidebar__bottom">
          <nav class="nav nav--admin" aria-label="系统导航">
            @for (item of adminNav; track item.path) {
              <a class="nav__item" [routerLink]="item.path" routerLinkActive="nav__item--active" (click)="mobileNav.set(false)">
                <ui-icon [name]="item.icon" [size]="16" />
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>

          <div class="sidebar__foot">
            <span class="small muted">演示数据 · 非真实企业信息</span>
            <span class="small muted">v1.1 · 2026-10-24</span>
          </div>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button type="button" class="topbar__menu" aria-label="打开导航" (click)="mobileNav.set(!mobileNav())">
            <ui-icon name="menu" [size]="18" />
          </button>

          <nav class="crumbs" aria-label="面包屑">
            <a routerLink="/dashboard">工作台</a>
            @if (inProject() && project(); as p) {
              <ui-icon name="chevron-right" [size]="12" />
              <a [routerLink]="['/projects', p.id, 'overview']">{{ p.name }}</a>
            }
            @if (pageLabel()) {
              <ui-icon name="chevron-right" [size]="12" />
              <span class="crumbs__current">{{ pageLabel() }}</span>
            }
          </nav>

          <div class="topbar__right">
            @if (inProject() && project(); as p) {
              <ui-badge [label]="deadline(p.deadline)" [tone]="deadlineToneOf(p.deadline)" icon="clock" />
            }
            <div class="search">
              <ui-icon name="search" [size]="14" />
              <input
                class="search__input"
                type="search"
                placeholder="检索参数、竞对、项目"
                aria-label="全局检索"
                (keydown.enter)="onSearch($event)"
              />
            </div>
            <div class="user" [attr.title]="user().name + ' · ' + roleLabel(user().role)">
              <span class="user__avatar">{{ user().initials }}</span>
              <span class="user__meta">
                <span class="user__name">{{ user().name }}</span>
                <span class="user__role">{{ roleLabel(user().role) }}</span>
              </span>
            </div>
          </div>
        </header>

        <main id="main" class="content" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (mobileNav()) {
      <div class="nav-scrim" (click)="mobileNav.set(false)" aria-hidden="true"></div>
    }

    <ui-toast-host />
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
      }
      .skip {
        position: absolute;
        left: -9999px;
        top: 0;
        background: var(--surface);
        border: 1px solid var(--accent);
        padding: 8px 12px;
        z-index: 300;
      }
      .skip:focus {
        left: 12px;
        top: 12px;
      }
      .shell {
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        min-height: 100dvh;
        background: var(--bg);
      }

      /* ---------------- sidebar ---------------- */
      .sidebar {
        border-right: 1px solid var(--line);
        background: var(--bg-subtle);
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        height: 100dvh;
        overflow: hidden;
      }
      .sidebar__scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .sidebar__bottom {
        flex: none;
        background: var(--bg-subtle);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 16px 14px;
        border-bottom: 1px solid var(--line);
      }
      .brand__mark {
        width: 18px;
        height: 18px;
        background: var(--ink);
        position: relative;
        flex: none;
      }
      .brand__mark::after {
        content: '';
        position: absolute;
        inset: 5px;
        background: var(--surface);
      }
      .brand__text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .brand__name {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
      .brand__sub {
        font-size: 11px;
        color: var(--ink-3);
      }
      .nav {
        display: flex;
        flex-direction: column;
        padding: 8px;
        gap: 1px;
      }
      .nav__item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 10px;
        min-height: 38px;
        color: var(--ink-2);
        font-size: 13px;
        border-left: 2px solid transparent;
      }
      .nav__item:hover {
        background: #eeeef0;
        color: var(--ink);
        text-decoration: none;
      }
      .nav__item--active {
        background: var(--surface);
        border-left-color: var(--accent);
        color: var(--ink);
        font-weight: 500;
      }
      .nav__item--sub {
        padding-left: 18px;
        font-size: 13px;
      }
      .nav-group {
        border-top: 1px solid var(--line);
        padding-top: 8px;
        margin-top: 4px;
      }
      .nav-group__label {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 4px 16px 8px;
        font-size: 11px;
        color: var(--ink-3);
      }
      .nav-group__name {
        font-size: 12px;
        color: var(--ink-2);
        font-weight: 500;
      }
      .nav-group__meta {
        font-size: 11px;
        color: var(--ink-3);
        font-family: var(--font-mono);
      }
      .nav-sep {
        border-top: 1px solid var(--line);
        padding-top: 6px;
        margin-top: 2px;
      }
      .nav--admin {
        border-top: 1px solid var(--line);
        padding-top: 8px;
        padding-bottom: 4px;
      }
      .sidebar__foot {
        margin-top: 0;
        padding: 12px 16px;
        border-top: 1px solid var(--line);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      /* ---------------- main ---------------- */
      .main {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .topbar {
        height: 56px;
        border-bottom: 1px solid var(--line);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        background: var(--surface);
        position: sticky;
        top: 0;
        z-index: var(--z-nav);
      }
      .topbar__menu {
        display: none;
        border: 1px solid var(--line);
        background: var(--surface);
        min-width: 36px;
        min-height: 36px;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .crumbs {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--ink-3);
        min-width: 0;
        overflow: hidden;
      }
      .crumbs a {
        color: var(--ink-2);
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .crumbs__current {
        color: var(--ink);
        font-weight: 500;
        white-space: nowrap;
      }
      .topbar__right {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .search {
        display: flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--line);
        background: var(--bg-subtle);
        padding: 0 8px;
        min-height: 32px;
        color: var(--ink-3);
      }
      .search__input {
        border: none;
        background: transparent;
        font-size: 12px;
        width: 180px;
        min-height: 30px;
        outline: none;
        color: var(--ink);
      }
      .search__input:focus-visible {
        outline: none;
      }
      .search:focus-within {
        border-color: var(--accent);
        background: var(--surface);
      }
      .user {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-left: 12px;
        border-left: 1px solid var(--line);
      }
      .user__avatar {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--ink);
        color: #fff;
        font-size: 12px;
      }
      .user__meta {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }
      .user__name {
        font-size: 12px;
        color: var(--ink);
      }
      .user__role {
        font-size: 11px;
        color: var(--ink-3);
      }
      .content {
        flex: 1;
        min-width: 0;
        outline: none;
      }
      .nav-scrim {
        display: none;
      }

      @media (max-width: 1024px) {
        .shell {
          grid-template-columns: minmax(0, 1fr);
        }
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 260px;
          z-index: 120;
          transform: translateX(-100%);
          transition: transform 200ms ease-out;
        }
        .sidebar--open {
          transform: none;
        }
        .nav-scrim {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(17, 18, 20, 0.4);
          z-index: 110;
        }
        .topbar__menu {
          display: inline-flex;
        }
        .search__input {
          width: 120px;
        }
        .user__meta {
          display: none;
        }
      }
      @media (max-width: 640px) {
        .search {
          display: none;
        }
        .crumbs {
          font-size: 11px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .sidebar {
          transition: none;
        }
      }
    `,
  ],
})
export class Shell {
  private readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly mobileNav = signal(false);
  readonly project = this.store.activeProject;
  readonly user = this.store.currentUser;
  readonly pageLabel = signal('');
  readonly inProject = signal(false);

  readonly mainNav: NavItem[] = [
    { path: '/dashboard', label: '工作台', icon: 'grid' },
    { path: '/projects', label: '项目', icon: 'folder' },
    { path: '/assistant', label: 'AI 助手', icon: 'chat' },
  ];

  readonly knowledgeNav: NavItem[] = [
    { path: '/retro', label: '中标复盘', icon: 'target' },
    { path: '/experience', label: '经验库', icon: 'book' },
    { path: '/match', label: '相似项目匹配', icon: 'search' },
    { path: '/library', label: '竞品情报库', icon: 'library' },
  ];

  readonly adminNav: NavItem[] = [{ path: '/admin', label: '系统管理', icon: 'settings' }];

  private readonly labelMap: Record<string, string> = {
    overview: '项目概览',
    documents: '资料管理',
    parameters: '参数矩阵',
    comparison: '对比分析',
    insights: '研判与风险',
    reviews: '审核待办',
    reports: '报告中心',
  };

  constructor() {
    const destroyRef = inject(DestroyRef);
    const sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.url.split('?')[0];
      const match = /^\/projects\/([^/]+)/.exec(url);
      if (match) {
        this.store.setActiveProject(match[1]);
        const page = url.split('/')[3] ?? '';
        this.pageLabel.set(this.labelMap[page] ?? '');
        this.inProject.set(page !== '');
      } else {
        this.inProject.set(false);
        this.pageLabel.set(this.globalLabel(url));
      }
      this.mobileNav.set(false);
    });
    destroyRef.onDestroy(() => sub.unsubscribe());
  }

  private globalLabel(url: string): string {
    const map: [string, string][] = [
      ['/assistant', 'AI 助手'],
      ['/retro', '中标复盘'],
      ['/experience', '经验库'],
      ['/match', '相似项目匹配'],
      ['/library', '竞品情报库'],
      ['/admin', '系统管理'],
    ];
    const hit = map.find(([prefix]) => url.startsWith(prefix));
    return hit ? hit[1] : '';
  }

  projectNav(id: string): NavItem[] {
    const base = '/projects/' + id;
    return [
      { path: base + '/overview', label: '项目概览', icon: 'grid' },
      { path: base + '/documents', label: '资料管理', icon: 'file' },
      { path: base + '/parameters', label: '参数矩阵', icon: 'table' },
      { path: base + '/comparison', label: '对比分析', icon: 'scale' },
      { path: base + '/insights', label: '研判与风险', icon: 'bulb' },
      { path: base + '/reviews', label: '审核待办', icon: 'check-square' },
      { path: base + '/reports', label: '报告中心', icon: 'doc' },
    ];
  }

  country(code: keyof typeof COUNTRY_LABEL): string {
    return COUNTRY_LABEL[code];
  }

  deadline(iso: string): string {
    return deadlineText(iso);
  }

  deadlineToneOf(iso: string): 'ok' | 'warn' | 'danger' | 'neutral' {
    const tone = deadlineTone(iso);
    return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'neutral';
  }

  roleLabel(role: keyof typeof ROLE_LABEL): string {
    return ROLE_LABEL[role];
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    if (!value) return;
    this.toast.push(`已检索「${value}」`, 'info', '演示环境：结果来自本地 Mock 数据，共匹配 12 条');
  }
}
