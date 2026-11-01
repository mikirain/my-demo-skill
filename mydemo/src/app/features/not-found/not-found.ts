import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Btn } from '../../shared/ui/btn';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Btn],
  template: `
    <div class="page">
      <div class="nf">
        <span class="nf__code mono">404</span>
        <h1 class="nf__title">页面不存在</h1>
        <p class="nf__text">
          请求的地址没有对应的页面。可能链接已失效，或该项目 / 文档已归档。演示环境支持通过左侧导航访问全部 11 个页面。
        </p>
        <div class="row row--wrap">
          <a routerLink="/dashboard"><ui-btn variant="primary" icon="grid">返回工作台</ui-btn></a>
          <a routerLink="/projects"><ui-btn variant="secondary" icon="folder">查看项目列表</ui-btn></a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .nf {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 56px 0;
        max-width: 60ch;
      }
      .nf__code {
        font-size: 13px;
        letter-spacing: 0.24em;
        color: var(--ink-3);
      }
      .nf__title {
        font-size: 28px;
      }
      .nf__text {
        color: var(--ink-2);
        line-height: 1.7;
        margin-bottom: 8px;
      }
    `,
  ],
})
export class NotFound {}
