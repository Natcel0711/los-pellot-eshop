import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../shared/icon/icon';
import { AdminApi } from '../../../core/api/admin-api';
import { AdminDashboard } from '../../../shared/admin-models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Icon],
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly adminApi = inject(AdminApi);

  protected readonly dashboard = signal<AdminDashboard | null>(null);

  ngOnInit(): void {
    this.adminApi.getDashboard().subscribe((d) => this.dashboard.set(d));
  }
}
