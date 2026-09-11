import { Service } from '@angular/core';
import { Subject } from 'rxjs';

@Service()
export class Toast {
  private readonly messageSubject = new Subject<string>();
  readonly message$ = this.messageSubject.asObservable();

  show(message: string): void {
    this.messageSubject.next(message);
  }
}
