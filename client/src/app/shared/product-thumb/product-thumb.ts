import { Component, Input } from '@angular/core';
import { Icon } from '../icon/icon';

// Drop-in replacement for a bare category icon anywhere a product is shown —
// renders the real photo when the product has one, falling back to its
// category icon otherwise. Caller controls the surrounding box size/shape;
// this only fills it (image: object-cover, icon: sized via iconClass).
@Component({
  selector: 'app-product-thumb',
  imports: [Icon],
  styleUrl: './product-thumb.css',
  templateUrl: './product-thumb.html',
})
export class ProductThumb {
  @Input() imageUrl: string | null = null;
  @Input({ required: true }) iconName!: string;
  @Input() iconClass = 'w-8 h-8';
  @Input() alt = '';
}
