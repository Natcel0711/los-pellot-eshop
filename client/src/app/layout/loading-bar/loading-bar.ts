import { Component, inject } from '@angular/core';
import { Loading } from '../../core/services/loading';

@Component({
  selector: 'app-loading-bar',
  styleUrl: './loading-bar.css',
  templateUrl: './loading-bar.html',
})
export class LoadingBar {
  protected readonly loading = inject(Loading);
}
