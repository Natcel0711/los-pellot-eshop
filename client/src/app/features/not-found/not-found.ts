import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Translation } from '../../core/services/translation';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  styleUrl: './not-found.css',
  templateUrl: './not-found.html',
})
export class NotFound {
  protected readonly i18n = inject(Translation);
}
