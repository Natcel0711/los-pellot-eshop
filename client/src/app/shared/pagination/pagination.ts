import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-pagination',
  imports: [Icon],
  styleUrl: './pagination.css',
  templateUrl: './pagination.html',
})
export class Pagination {
  @Input({ required: true }) page = 1;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) totalItems = 0;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<number>();

  get rangeStart(): number {
    return this.totalItems === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  goTo(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages);
    if (clamped !== this.page) this.pageChange.emit(clamped);
  }
}
