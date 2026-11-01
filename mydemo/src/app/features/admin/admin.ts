import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_THRESHOLDS, WorkspaceStore } from '../../core/store';
import { PARAM_DEFS } from '../../core/mock/params';
import { DEFAULT_PERMISSIONS, PERMISSION_ACTIONS, ROLE_ORDER } from '../../core/mock/users';
import { Badge } from '../../shared/ui/badge';
import { Btn } from '../../shared/ui/btn';
import { Empty } from '../../shared/ui/empty';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { Progress } from '../../shared/ui/progress';
import { TabItem, Tabs } from '../../shared/ui/tabs';
import { ToastService } from '../../shared/ui/toast.service';
import { AUDIT_ACTION_LABEL, DIMENSION_LABEL, DIMENSIONS, LEVEL_LABEL, ROLE_LABEL, fmtDateTime } from '../../core/format';
import {
  AuditAction,
  Condition,
  Dimension,
  ParamDef,
  ParamLevel,
  Permission,
  PermissionMatrix,
  Role,
  Tone,
} from '../../core/types';
import { downloadCsv } from '../../core/download';

const LEVELS: ParamLevel[] = ['cell', 'module', 'rack', 'system', 'plant'];
const COND_OPTIONS: { key: keyof Condition; label: string }[] = [
  { key: 'dod', label: 'DoD' },
  { key: 'temperature', label: '温度' },
  { key: 'boundary', label: '边界' },
  { key: 'sohEnd', label: 'SoH 终点' },
  { key: 'loadRate', label: '负载率' },
];
const CYCLE: Permission[] = ['allow', 'read', 'deny'];

function cloneMatrix(src: PermissionMatrix): PermissionMatrix {
  const out = {} as PermissionMatrix;
  ROLE_ORDER.forEach((role) => {
    const row: Record<string, Permission> = {};
    PERMISSION_ACTIONS.forEach((a) => {
      row[a.key] = src[role][a.key] ?? 'deny';
    });
    out[role] = row;
  });
  return out;
}

function cloneDefs(): ParamDef[] {
  return PARAM_DEFS.map((d) => ({ ...d, requiredConditions: [...d.requiredConditions], aliases: [...d.aliases] }));
}

@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Badge, Btn, Empty, Icon, Modal, Progress, Tabs],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="page-head__main">
          <h1 class="page-title">系统管理</h1>
          <p class="page-sub">演示环境：配置变更仅写入本地信号并记录审计</p>
        </div>
        <div class="page-actions">
          <ui-badge label="演示环境 · 不落库" tone="neutral" icon="info" />
        </div>
      </header>

      <ui-tabs [tabs]="tabItems()" [active]="tab()" label="系统管理分页" (change)="tab.set($event)" />

      <div class="tab-body">
        @switch (tab()) {
          @case ('users') {
            <div class="banner banner--warn section">
              <ui-icon name="lock" [size]="16" />
              <span>最小权限原则：系统管理员不可读取文档正文，只能查看元数据与审计日志。矩阵中的「只读」表示可查看列表与元数据，不可打开原文。</span>
            </div>

            <section class="section">
              <div class="section-head">
                <h2 class="section-title">用户（{{ usersView().length }}）</h2>
                <span class="section-hint">状态按演示规则生成：id 序号为奇数 = 启用，偶数 = 停用</span>
              </div>
              @if (usersView().length === 0) {
                <ui-empty title="暂无用户" hint="演示数据未加载任何账号，请联系管理员。" />
              } @else {
                <div class="table-wrap">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>用户</th>
                        <th style="width: 150px">角色</th>
                        <th style="width: 130px">最近登录</th>
                        <th style="width: 110px">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (u of usersView(); track u.id) {
                        <tr>
                          <td>
                            <div class="row">
                              <span class="avatar">{{ u.initials }}</span>
                              <div class="stack stack--tight">
                                <span class="strong">{{ u.name }}</span>
                                <span class="mono small muted">{{ u.id }}</span>
                              </div>
                            </div>
                          </td>
                          <td><ui-badge [label]="roleLabel(u.role)" tone="neutral" icon="user" /></td>
                          <td class="mono small">{{ fmt(u.lastLogin) }}</td>
                          <td>
                            <ui-badge [label]="u.statusLabel" [tone]="u.statusTone" [icon]="u.statusTone === 'ok' ? 'check' : 'lock'" />
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>

            <section class="section">
              <div class="section-head">
                <h2 class="section-title">权限矩阵（{{ actions.length }} 项操作 × {{ roles.length }} 个角色）</h2>
                <div class="row row--wrap legend">
                  <span class="legend__item"><ui-icon name="check" [size]="14" /><span>允许</span></span>
                  <span class="legend__item"><ui-icon name="eye" [size]="14" /><span>只读</span></span>
                  <span class="legend__item"><ui-icon name="lock" [size]="14" /><span>禁止</span></span>
                </div>
              </div>
              <div class="table-wrap">
                <table class="table matrix">
                  <thead>
                    <tr>
                      <th style="min-width: 176px">操作 / 角色</th>
                      @for (r of roles; track r) {
                        <th class="matrix__role">{{ roleLabel(r) }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (a of actions; track a.key) {
                      <tr>
                        <th scope="row" class="matrix__action">{{ a.label }}</th>
                        @for (r of roles; track r) {
                          <td>
                            <button
                              type="button"
                              [class]="'cell cell--' + perm(r, a.key)"
                              [attr.aria-label]="cellLabel(a.label, a.key, r)"
                              (click)="cycleCell(r, a.key)"
                            >
                              <ui-icon [name]="permIcon(r, a.key)" [size]="14" />
                              <span>{{ permLabel(r, a.key) }}</span>
                            </button>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <div class="row row--between row--wrap matrix__foot">
                <span class="small muted">点击单元格切换：允许 → 只读 → 禁止。相对默认值已改动 {{ changedCells() }} 处，保存后写入审计日志。</span>
                <div class="row">
                  <ui-btn variant="secondary" icon="refresh" (click)="resetMatrix()">恢复默认</ui-btn>
                  <ui-btn variant="primary" icon="check" (click)="saveMatrix()">保存</ui-btn>
                </div>
              </div>
            </section>
          }

          @case ('dict') {
            <section class="section">
              <div class="filter-bar">
                <div class="row" style="flex: 1">
                  <ui-icon name="search" [size]="14" />
                  <input class="input" type="search" placeholder="搜索 key、名称或别名" aria-label="搜索参数字典"
                    [ngModel]="dq()" (ngModelChange)="dq.set($event)" />
                </div>
                <select class="select" aria-label="按维度筛选" [ngModel]="ddim()" (ngModelChange)="ddim.set($event)">
                  <option value="all">全部维度</option>
                  @for (d of dimensions; track d) {
                    <option [value]="d">{{ dimLabel(d) }}</option>
                  }
                </select>
                <select class="select" aria-label="按层级筛选" [ngModel]="dlevel()" (ngModelChange)="dlevel.set($event)">
                  <option value="all">全部层级</option>
                  @for (l of levels; track l) {
                    <option [value]="l">{{ levelLabel(l) }}</option>
                  }
                </select>
                <ui-btn variant="primary" icon="plus" (click)="openAddDef()">新增参数</ui-btn>
              </div>

              <p class="count-line small muted">共 {{ defsFiltered().length }} / {{ defs().length }} 项 · 字典版本 v1.0 · 编辑仅作用于本页信号</p>

              @if (defsFiltered().length === 0) {
                <ui-empty title="没有匹配的参数定义" hint="当前搜索与筛选条件下没有结果，可清空条件后重试。"
                  actionLabel="清空筛选" (action)="clearDefFilters()" />
              } @else {
                <div class="table-wrap">
                  <table class="table">
                    <thead>
                      <tr>
                        <th style="width: 168px">key</th>
                        <th>名称</th>
                        <th style="width: 90px">单位</th>
                        <th style="width: 84px">维度</th>
                        <th style="width: 84px">层级</th>
                        <th>必需条件</th>
                        <th class="num" style="width: 80px">别名数</th>
                        <th style="width: 70px">版本</th>
                        <th style="width: 80px">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (d of defsFiltered(); track d.key) {
                        <tr>
                          <td class="mono small">{{ d.key }}</td>
                          <td>{{ d.label }}</td>
                          <td class="mono small">{{ d.unit }}</td>
                          <td class="small">{{ dimLabel(d.domain) }}</td>
                          <td class="small">{{ levelLabel(d.level) }}</td>
                          <td>
                            @for (c of d.requiredConditions; track c) {
                              <span class="cond-chip">{{ condLabel(c) }}</span>
                            }
                            @if (d.requiredConditions.length === 0) {
                              <span class="muted small">—</span>
                            }
                          </td>
                          <td class="num">{{ d.aliases.length }}</td>
                          <td class="mono small">v{{ d.version }}</td>
                          <td><ui-btn size="sm" variant="ghost" icon="edit" (click)="openEditDef(d)">编辑</ui-btn></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          }

          @case ('thresholds') {
            <div class="grid grid--2 section">
              <section class="card">
                <div class="card-hd">
                  <h2 class="card-title">判定阈值</h2>
                  <span class="card-sub">影响参数矩阵的免检与强制人工判定</span>
                </div>
                <div class="card-bd stack">
                  <div class="grid grid--2">
                    <div class="field">
                      <label for="th-auto">免检置信度阈值</label>
                      <input id="th-auto" class="input mono" type="number" min="0.7" max="0.95" step="0.01"
                        [ngModel]="autoPass()" (ngModelChange)="autoPass.set(num($event))" />
                      <span class="hint">0.70–0.95，达到该值免检进入矩阵</span>
                    </div>
                    <div class="field">
                      <label for="th-manual">强制人工阈值</label>
                      <input id="th-manual" class="input mono" type="number" min="0.4" max="0.8" step="0.01"
                        [ngModel]="manualForce()" (ngModelChange)="manualForce.set(num($event))" />
                      <span class="hint">0.40–0.80，且必须低于免检阈值</span>
                    </div>
                    <div class="field">
                      <label for="th-sample">免检抽检比例（%）</label>
                      <input id="th-sample" class="input mono" type="number" min="5" max="30" step="1"
                        [ngModel]="sampleRate()" (ngModelChange)="sampleRate.set(num($event))" />
                      <span class="hint">5–30，免检条目按比例抽检</span>
                    </div>
                    <div class="field">
                      <label for="th-kb">知识库有效期（月）</label>
                      <input id="th-kb" class="input mono" type="number" min="6" max="36" step="1"
                        [ngModel]="kbMonths()" (ngModelChange)="kbMonths.set(num($event))" />
                      <span class="hint">6–36，竞对情报超期视为可能失效</span>
                    </div>
                    <div class="field">
                      <label for="th-timeout">审核超时升级（小时）</label>
                      <input id="th-timeout" class="input mono" type="number" min="4" max="72" step="1"
                        [ngModel]="reviewHours()" (ngModelChange)="reviewHours.set(num($event))" />
                      <span class="hint">4–72，超时后升级给投标经理</span>
                    </div>
                  </div>
                </div>
              </section>

              <section class="card">
                <div class="card-hd">
                  <h2 class="card-title">维度权重默认值</h2>
                  <span class="card-sub mono">合计 {{ weightTotal() }}</span>
                </div>
                <div class="card-bd stack">
                  <div class="grid grid--3">
                    @for (d of dimensions; track d) {
                      <div class="field">
                        <label [attr.for]="'th-w-' + d">{{ dimLabel(d) }}</label>
                        <input [id]="'th-w-' + d" class="input mono" type="number" min="0" max="100" step="1"
                          [ngModel]="weights()[d]" (ngModelChange)="setWeight(d, num($event))" />
                      </div>
                    }
                  </div>
                  <ui-progress [value]="weightTotal()" [tone]="weightTotal() === 100 ? 'ok' : 'danger'" [showValue]="false" label="权重合计进度" />
                  <span class="hint">六维权重合计必须等于 100，否则无法保存；权重用于对比分析得分计算。</span>
                </div>
              </section>
            </div>

            <section class="card section">
              <div class="card-hd">
                <h2 class="card-title">保存配置</h2>
                <span class="card-sub">变更说明必填，写入审计日志</span>
              </div>
              <div class="card-bd stack">
                @if (issues().length > 0) {
                  <div class="banner banner--danger">
                    <ui-icon name="alert" [size]="16" />
                    <ul class="issue-list">
                      @for (i of issues(); track i) {
                        <li>{{ i }}</li>
                      }
                    </ul>
                  </div>
                }
                @if (storeMsg()) {
                  <div class="banner banner--danger">
                    <ui-icon name="alert" [size]="16" />
                    <span>{{ storeMsg() }}</span>
                  </div>
                }
                <div class="field">
                  <label for="th-note">变更说明 *</label>
                  <textarea id="th-note" class="input" rows="3" placeholder="例如：依据 10 月复盘，抽检比例由 10% 调整为 15%"
                    [ngModel]="note()" (ngModelChange)="note.set($event)"></textarea>
                  <span class="hint">说明随审计事件一并记录，便于回溯配置依据。</span>
                </div>
              </div>
              <div class="card-ft">
                <span>配置仅写入本地信号，仅本次会话有效</span>
                <div class="row">
                  <ui-btn variant="secondary" icon="refresh" (click)="resetThresholds()">恢复默认</ui-btn>
                  <ui-btn variant="primary" icon="check" (click)="saveThresholds()">保存阈值配置</ui-btn>
                </div>
              </div>
            </section>
          }

          @case ('audit') {
            <section class="section">
              <div class="filter-bar">
                <div class="row" style="flex: 1">
                  <ui-icon name="filter" [size]="14" />
                  <span class="small muted">按动作、操作人、结果筛选</span>
                </div>
                <select class="select" aria-label="按动作筛选" [ngModel]="aAction()" (ngModelChange)="aAction.set($event)">
                  <option value="all">全部动作</option>
                  @for (a of actionOptions; track a) {
                    <option [value]="a">{{ actionLabel(a) }}</option>
                  }
                </select>
                <select class="select" aria-label="按操作人筛选" [ngModel]="aActor()" (ngModelChange)="aActor.set($event)">
                  <option value="all">全部操作人</option>
                  @for (a of actors(); track a) {
                    <option [value]="a">{{ a }}</option>
                  }
                </select>
                <select class="select" aria-label="按结果筛选" [ngModel]="aResult()" (ngModelChange)="aResult.set($event)">
                  <option value="all">全部结果</option>
                  <option value="ok">成功</option>
                  <option value="denied">已拒绝</option>
                </select>
                <ui-btn variant="secondary" icon="download" (click)="exportAudit()">导出 CSV</ui-btn>
              </div>

              <p class="count-line small muted">共 {{ auditFiltered().length }} / {{ store.auditEvents().length }} 条事件 · 审计不可修改与删除</p>

              @if (auditFiltered().length === 0) {
                <ui-empty title="没有匹配的审计事件" hint="当前动作、操作人与结果组合下没有记录，可清空筛选后重试。"
                  actionLabel="清空筛选" (action)="clearAuditFilters()" />
              } @else {
                <div class="table-wrap">
                  <table class="table">
                    <thead>
                      <tr>
                        <th class="mono" style="width: 104px">时间</th>
                        <th style="width: 84px">操作人</th>
                        <th style="width: 128px">动作</th>
                        <th>对象</th>
                        <th style="width: 96px">结果</th>
                        <th class="mono" style="width: 118px">IP</th>
                        <th>详情</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (e of auditFiltered(); track e.id) {
                        <tr>
                          <td class="mono small">{{ fmt(e.at) }}</td>
                          <td class="small">{{ e.actor }}</td>
                          <td>
                            <ui-badge [label]="actionLabel(e.action)" tone="neutral" [icon]="e.action === 'config' ? 'settings' : 'file'" />
                          </td>
                          <td class="small">{{ e.target }}</td>
                          <td>
                            <ui-badge [label]="e.result === 'ok' ? '成功' : '已拒绝'" [tone]="e.result === 'ok' ? 'ok' : 'danger'"
                              [icon]="e.result === 'ok' ? 'check' : 'lock'" />
                          </td>
                          <td class="mono small">{{ e.ip }}</td>
                          <td class="small muted">{{ e.detail ?? '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          }
        }
      </div>
    </div>

    <ui-modal [open]="defOpen()" [title]="editingKey() ? '编辑参数定义' : '新增参数定义'" size="md" (close)="defOpen.set(false)">
      <div class="stack">
        <div class="banner banner--info">
          <ui-icon name="info" [size]="16" />
          <span>参数 key 是抽取与对比的稳定标识，保存后不可更改；编辑会提升版本号。</span>
        </div>
        <div class="grid grid--2">
          <div class="field">
            <label for="df-key">参数 key *</label>
            <input id="df-key" class="input mono" placeholder="snake_case，如 system_rte" [disabled]="!!editingKey()"
              [ngModel]="dKey()" (ngModelChange)="dKey.set($event)" />
          </div>
          <div class="field">
            <label for="df-label">名称 *</label>
            <input id="df-label" class="input" [ngModel]="dLabel()" (ngModelChange)="dLabel.set($event)" />
          </div>
        </div>
        <div class="grid grid--3">
          <div class="field">
            <label for="df-unit">单位</label>
            <input id="df-unit" class="input mono" placeholder="—" [ngModel]="dUnit()" (ngModelChange)="dUnit.set($event)" />
          </div>
          <div class="field">
            <label for="df-dim">维度 *</label>
            <select id="df-dim" class="select" [ngModel]="dDom()" (ngModelChange)="dDom.set($event)">
              @for (d of dimensions; track d) {
                <option [value]="d">{{ dimLabel(d) }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="df-level">层级 *</label>
            <select id="df-level" class="select" [ngModel]="dLev()" (ngModelChange)="dLev.set($event)">
              @for (l of levels; track l) {
                <option [value]="l">{{ levelLabel(l) }}</option>
              }
            </select>
          </div>
        </div>
        <div class="field">
          <span class="label">必需条件</span>
          <div class="row row--wrap">
            @for (c of condOptions; track c.key) {
              <label class="check-inline">
                <input type="checkbox" class="checkbox" [checked]="dConds().includes(c.key)" (change)="toggleCond(c.key, $event)" />
                <span>{{ c.label }}</span>
              </label>
            }
          </div>
          <span class="hint">选中的条件必须在对比时一致，否则判为不可比。</span>
        </div>
        <div class="field">
          <span class="label">别名管理（{{ dAliases().length }}）</span>
          <div class="row">
            <input class="input" placeholder="输入别名后回车添加" aria-label="新增别名" [ngModel]="dAliasDraft()"
              (ngModelChange)="dAliasDraft.set($event)" (keydown.enter)="addAlias()" />
            <ui-btn size="sm" variant="secondary" icon="plus" (click)="addAlias()">添加</ui-btn>
          </div>
          @if (dAliases().length === 0) {
            <span class="hint">暂无别名，抽取时仅按名称与 key 精确匹配。</span>
          } @else {
            <div class="row row--wrap">
              @for (a of dAliases(); track a) {
                <span class="alias">
                  {{ a }}
                  <button type="button" class="alias__x" [attr.aria-label]="'移除别名 ' + a" (click)="removeAlias(a)">
                    <ui-icon name="x" [size]="10" />
                  </button>
                </span>
              }
            </div>
          }
        </div>
        @if (defErr()) {
          <span class="error"><ui-icon name="alert" [size]="12" />{{ defErr() }}</span>
        }
      </div>
      <div modal-footer>
        <ui-btn variant="secondary" (click)="defOpen.set(false)">取消</ui-btn>
        <ui-btn variant="primary" (click)="saveDef()">保存</ui-btn>
      </div>
    </ui-modal>
  `,
  styles: [
    `
      .tab-body {
        padding-top: var(--sp-4);
      }
      .legend {
        gap: 12px;
      }
      .legend__item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--ink-2);
      }
      .avatar {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--line-strong);
        background: var(--bg-subtle);
        font-size: 12px;
        color: var(--ink-2);
        flex: none;
      }
      .matrix th.matrix__role {
        text-align: center;
        font-weight: 500;
      }
      .matrix__action {
        font-size: 12px;
        font-weight: 400;
        color: var(--ink-2);
        text-align: left;
        border-bottom: 1px solid var(--line);
      }
      .matrix td {
        text-align: center;
        padding: 4px 6px;
      }
      .matrix__foot {
        margin-top: 12px;
      }
      .cell {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
        min-height: 30px;
        padding: 2px 6px;
        border: 1px solid var(--line);
        background: var(--surface);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
      }
      .cell:hover {
        border-color: var(--line-strong);
        background: var(--bg-subtle);
      }
      .cell:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
      }
      .cell--allow {
        color: var(--accent);
        border-color: #c3cef5;
        background: var(--accent-weak);
      }
      .cell--read {
        color: var(--ink-2);
      }
      .cell--deny {
        color: var(--ink-3);
        background: var(--bg-subtle);
        border-style: dashed;
      }
      .count-line {
        margin: 8px 0;
      }
      .issue-list {
        margin: 0;
        padding-left: 18px;
      }
      .check-inline {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--ink-2);
        cursor: pointer;
      }
      .alias {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border: 1px solid var(--line-strong);
        background: var(--bg-subtle);
        font-size: 12px;
        color: var(--ink-2);
      }
      .alias__x {
        border: none;
        background: transparent;
        color: var(--ink-3);
        cursor: pointer;
        padding: 0;
        display: inline-flex;
        align-items: center;
      }
      .alias__x:hover {
        color: var(--danger);
      }
    `,
  ],
})
export class Admin {
  readonly store = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);

  readonly roles = ROLE_ORDER;
  readonly actions = PERMISSION_ACTIONS;
  readonly dimensions = DIMENSIONS;
  readonly levels = LEVELS;
  readonly condOptions = COND_OPTIONS;
  readonly actionOptions: AuditAction[] = [
    'upload',
    'parse',
    'extract',
    'correct',
    'confirm',
    'conflict',
    'export',
    'approve',
    'login',
    'config',
  ];

  readonly tab = signal('users');
  readonly matrix = signal<PermissionMatrix>(cloneMatrix(DEFAULT_PERMISSIONS));
  readonly defs = signal<ParamDef[]>(cloneDefs());

  readonly tabItems = computed<TabItem[]>(() => [
    { id: 'users', label: '用户与权限', count: this.store.users().length },
    { id: 'dict', label: '参数字典', count: this.defs().length },
    { id: 'thresholds', label: '阈值配置' },
    { id: 'audit', label: '审计日志', count: this.store.auditEvents().length },
  ]);

  readonly usersView = computed(() =>
    this.store.users().map((u) => {
      const active = Number(u.id.replace(/[^0-9]/g, '')) % 2 === 1;
      return { ...u, statusLabel: active ? '启用' : '停用', statusTone: (active ? 'ok' : 'neutral') as Tone };
    }),
  );

  readonly dq = signal('');
  readonly ddim = signal('all');
  readonly dlevel = signal('all');

  readonly defsFiltered = computed(() => {
    const q = this.dq().trim().toLowerCase();
    return this.defs().filter((d) => {
      if (q) {
        const hit =
          d.key.toLowerCase().includes(q) ||
          d.label.toLowerCase().includes(q) ||
          d.aliases.some((a) => a.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (this.ddim() !== 'all' && d.domain !== this.ddim()) return false;
      if (this.dlevel() !== 'all' && d.level !== this.dlevel()) return false;
      return true;
    });
  });

  readonly defOpen = signal(false);
  readonly editingKey = signal<string | null>(null);
  readonly dKey = signal('');
  readonly dLabel = signal('');
  readonly dUnit = signal('');
  readonly dDom = signal<Dimension>('technical');
  readonly dLev = signal<ParamLevel>('system');
  readonly dConds = signal<(keyof Condition)[]>([]);
  readonly dAliases = signal<string[]>([]);
  readonly dAliasDraft = signal('');
  readonly defErr = signal('');

  readonly autoPass = signal(this.store.thresholds().autoPass);
  readonly manualForce = signal(this.store.thresholds().manualForce);
  readonly sampleRate = signal(this.store.thresholds().sampleRate);
  readonly kbMonths = signal(this.store.thresholds().kbValidityMonths);
  readonly reviewHours = signal(this.store.thresholds().reviewTimeoutHours);
  readonly weights = signal<Record<Dimension, number>>({ ...this.store.thresholds().weights });
  readonly note = signal('');
  readonly storeMsg = signal('');

  readonly weightTotal = computed(() => DIMENSIONS.reduce((acc, d) => acc + (this.weights()[d] ?? 0), 0));

  readonly issues = computed<string[]>(() => {
    const out: string[] = [];
    if (this.autoPass() < 0.7 || this.autoPass() > 0.95) out.push('免检置信度阈值需在 0.70–0.95 之间');
    if (this.manualForce() < 0.4 || this.manualForce() > 0.8) out.push('强制人工阈值需在 0.40–0.80 之间');
    if (this.manualForce() >= this.autoPass()) out.push('强制人工阈值必须低于免检置信度阈值');
    if (this.sampleRate() < 5 || this.sampleRate() > 30) out.push('免检抽检比例需在 5–30 之间');
    if (this.kbMonths() < 6 || this.kbMonths() > 36) out.push('知识库有效期需在 6–36 个月之间');
    if (this.reviewHours() < 4 || this.reviewHours() > 72) out.push('审核超时升级需在 4–72 小时之间');
    if (this.weightTotal() !== 100) out.push(`六维权重合计必须为 100，当前为 ${this.weightTotal()}`);
    return out;
  });

  readonly aAction = signal('all');
  readonly aActor = signal('all');
  readonly aResult = signal('all');
  readonly actors = computed(() => Array.from(new Set(this.store.auditEvents().map((e) => e.actor))));
  readonly auditFiltered = computed(() =>
    this.store.auditEvents().filter((e) => {
      if (this.aAction() !== 'all' && e.action !== this.aAction()) return false;
      if (this.aActor() !== 'all' && e.actor !== this.aActor()) return false;
      if (this.aResult() !== 'all' && e.result !== this.aResult()) return false;
      return true;
    }),
  );

  num(value: unknown): number {
    return Number(value);
  }

  fmt(at: string): string {
    return fmtDateTime(at);
  }

  roleLabel(role: Role): string {
    return ROLE_LABEL[role];
  }

  dimLabel(d: Dimension): string {
    return DIMENSION_LABEL[d];
  }

  levelLabel(l: ParamLevel): string {
    return LEVEL_LABEL[l] ?? l;
  }

  actionLabel(a: AuditAction): string {
    return AUDIT_ACTION_LABEL[a];
  }

  condLabel(key: keyof Condition): string {
    return COND_OPTIONS.find((c) => c.key === key)?.label ?? String(key);
  }

  perm(role: Role, key: string): Permission {
    return this.matrix()[role][key] ?? 'deny';
  }

  permLabel(role: Role, key: string): string {
    const p = this.perm(role, key);
    return p === 'allow' ? '允许' : p === 'read' ? '只读' : '禁止';
  }

  permIcon(role: Role, key: string): string {
    const p = this.perm(role, key);
    return p === 'allow' ? 'check' : p === 'read' ? 'eye' : 'lock';
  }

  cellLabel(label: string, key: string, role: Role): string {
    return `${label} / ${ROLE_LABEL[role]}：当前${this.permLabel(role, key)}，点击切换`;
  }

  cycleCell(role: Role, key: string): void {
    const next = CYCLE[(CYCLE.indexOf(this.perm(role, key)) + 1) % CYCLE.length];
    const copy = cloneMatrix(this.matrix());
    copy[role][key] = next;
    this.matrix.set(copy);
  }

  changedCells(): number {
    const m = this.matrix();
    let n = 0;
    ROLE_ORDER.forEach((role) => {
      PERMISSION_ACTIONS.forEach((a) => {
        if (m[role][a.key] !== (DEFAULT_PERMISSIONS[role][a.key] ?? 'deny')) n += 1;
      });
    });
    return n;
  }

  saveMatrix(): void {
    const changed = this.changedCells();
    this.store.pushAudit('config', '角色权限矩阵', `改动 ${changed} 处；${this.matrixSummary()}`);
    this.toast.push('权限矩阵已保存', 'ok', `改动 ${changed} 处；已写入审计日志`);
  }

  resetMatrix(): void {
    this.matrix.set(cloneMatrix(DEFAULT_PERMISSIONS));
    this.store.pushAudit('config', '角色权限矩阵', '恢复默认权限矩阵');
    this.toast.push('已恢复默认矩阵', 'info', '默认值来自角色权限基线，尚未保存到配置');
  }

  clearDefFilters(): void {
    this.dq.set('');
    this.ddim.set('all');
    this.dlevel.set('all');
  }

  openAddDef(): void {
    this.editingKey.set(null);
    this.dKey.set('');
    this.dLabel.set('');
    this.dUnit.set('');
    this.dDom.set('technical');
    this.dLev.set('system');
    this.dConds.set([]);
    this.dAliases.set([]);
    this.dAliasDraft.set('');
    this.defErr.set('');
    this.defOpen.set(true);
  }

  openEditDef(d: ParamDef): void {
    this.editingKey.set(d.key);
    this.dKey.set(d.key);
    this.dLabel.set(d.label);
    this.dUnit.set(d.unit);
    this.dDom.set(d.domain);
    this.dLev.set(d.level);
    this.dConds.set([...d.requiredConditions]);
    this.dAliases.set([...d.aliases]);
    this.dAliasDraft.set('');
    this.defErr.set('');
    this.defOpen.set(true);
  }

  addAlias(): void {
    const value = this.dAliasDraft().trim();
    if (!value) return;
    if (!this.dAliases().includes(value)) this.dAliases.update((list) => [...list, value]);
    this.dAliasDraft.set('');
  }

  removeAlias(alias: string): void {
    this.dAliases.update((list) => list.filter((a) => a !== alias));
  }

  toggleCond(key: keyof Condition, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.dConds.update((list) => (checked ? [...list, key] : list.filter((k) => k !== key)));
  }

  saveDef(): void {
    const key = this.dKey().trim();
    const label = this.dLabel().trim();
    if (!key) {
      this.defErr.set('请填写参数 key');
      return;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      this.defErr.set('key 必须为小写 snake_case，例如 system_rte');
      return;
    }
    if (this.defs().some((d) => d.key === key && d.key !== this.editingKey())) {
      this.defErr.set('该 key 已存在，请更换');
      return;
    }
    if (!label) {
      this.defErr.set('请填写参数名称');
      return;
    }
    const editing = this.editingKey();
    const prev = this.defs().find((d) => d.key === editing);
    const def: ParamDef = {
      key,
      label,
      unit: this.dUnit().trim() || '—',
      domain: this.dDom(),
      level: this.dLev(),
      requiredConditions: [...this.dConds()],
      aliases: [...this.dAliases()],
      version: editing ? (prev?.version ?? 1) + 1 : 1,
    };
    this.defs.update((list) => (editing ? list.map((d) => (d.key === editing ? def : d)) : [def, ...list]));
    this.store.pushAudit('config', `参数字典 ${def.key} v${def.version}`, editing ? '编辑参数定义' : '新增参数定义');
    this.toast.push(editing ? '参数定义已更新' : '参数定义已新增', 'ok', `${def.label} · ${def.key} v${def.version}`);
    this.defOpen.set(false);
  }

  setWeight(d: Dimension, value: number): void {
    const next = { ...this.weights() };
    next[d] = value;
    this.weights.set(next);
  }

  saveThresholds(): void {
    this.storeMsg.set('');
    if (this.issues().length > 0) {
      this.toast.push('阈值校验未通过', 'danger', '请先修正标红的配置项');
      return;
    }
    if (!this.note().trim()) {
      this.toast.push('请填写变更说明', 'danger', '变更说明用于审计追溯');
      return;
    }
    const res = this.store.updateThresholds(
      {
        autoPass: this.autoPass(),
        manualForce: this.manualForce(),
        sampleRate: this.sampleRate(),
        kbValidityMonths: this.kbMonths(),
        reviewTimeoutHours: this.reviewHours(),
        weights: { ...this.weights() },
      },
      this.note().trim(),
    );
    if (!res.ok) {
      this.storeMsg.set(res.message ?? '保存失败');
      this.toast.push('保存失败', 'danger', res.message ?? '');
      return;
    }
    this.note.set('');
    this.toast.push('阈值配置已保存', 'ok', '已写入审计日志；演示环境不持久化');
  }

  resetThresholds(): void {
    this.autoPass.set(DEFAULT_THRESHOLDS.autoPass);
    this.manualForce.set(DEFAULT_THRESHOLDS.manualForce);
    this.sampleRate.set(DEFAULT_THRESHOLDS.sampleRate);
    this.kbMonths.set(DEFAULT_THRESHOLDS.kbValidityMonths);
    this.reviewHours.set(DEFAULT_THRESHOLDS.reviewTimeoutHours);
    this.weights.set({ ...DEFAULT_THRESHOLDS.weights });
    this.note.set('');
    this.storeMsg.set('');
    this.toast.push('已恢复默认阈值', 'info', '默认值来自 PRD v1.0，尚未保存');
  }

  clearAuditFilters(): void {
    this.aAction.set('all');
    this.aActor.set('all');
    this.aResult.set('all');
  }

  exportAudit(): void {
    const rows: (string | number)[][] = [
      ['时间', '操作人', '动作', '对象', '结果', 'IP', '详情'],
      ...this.auditFiltered().map((e) => [
        e.at.replace('T', ' '),
        e.actor,
        AUDIT_ACTION_LABEL[e.action],
        e.target,
        e.result === 'ok' ? '成功' : '已拒绝',
        e.ip,
        e.detail ?? '',
      ]),
    ];
    downloadCsv('BidScope-审计日志.csv', rows);
    this.store.pushAudit('export', '审计日志 CSV', `导出 ${this.auditFiltered().length} 行`);
    this.toast.push('已导出 CSV', 'ok', `共 ${this.auditFiltered().length} 行，遵循当前筛选条件`);
  }

  private matrixSummary(): string {
    const m = this.matrix();
    return ROLE_ORDER.map((role) => {
      const counts = { allow: 0, read: 0, deny: 0 };
      PERMISSION_ACTIONS.forEach((a) => {
        counts[m[role][a.key] ?? 'deny'] += 1;
      });
      return `${ROLE_LABEL[role]} 允许${counts.allow}/只读${counts.read}/禁止${counts.deny}`;
    }).join('；');
  }
}
