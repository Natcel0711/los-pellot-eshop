import { Component, HostBinding, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { iconMarkup } from '../icons';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
})
export class Icon {
  @Input() name = 'bolt';

  @HostBinding('class') @Input() class = 'w-5 h-5';

  constructor(private readonly sanitizer: DomSanitizer) {}

  // Safe: markup is always the fixed SVG path data from ICONS in shared/icons.ts
  // (a developer-authored constant, never user input), keyed by `name`.
  get svg(): SafeHtml {
    const inner = iconMarkup(this.name);
    const markup = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">${inner}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(markup);
  }
}
