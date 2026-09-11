import { Component, OnInit, inject, signal } from '@angular/core';
import { Icon } from '../../../shared/icon/icon';
import { AdminApi } from '../../../core/api/admin-api';
import { Toast } from '../../../core/services/toast';
import { AdminMake, AdminModel, AdminTrim, AdminYear } from '../../../shared/admin-models';

@Component({
  selector: 'app-vehicles',
  imports: [Icon],
  styleUrl: './vehicles.css',
  templateUrl: './vehicles.html',
})
export class Vehicles implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast = inject(Toast);

  protected readonly years = signal<AdminYear[]>([]);
  protected readonly makes = signal<AdminMake[]>([]);
  protected readonly models = signal<AdminModel[]>([]);
  protected readonly trims = signal<AdminTrim[]>([]);
  protected readonly expandedModelId = signal<number | null>(null);

  ngOnInit(): void {
    this.refreshYears();
    this.refreshMakes();
    this.refreshModels();
  }

  private refreshYears(): void {
    this.adminApi.getYears().subscribe((years) => this.years.set(years));
  }

  private refreshMakes(): void {
    this.adminApi.getMakes().subscribe((makes) => this.makes.set(makes));
  }

  private refreshModels(): void {
    this.adminApi.getModels().subscribe((models) => this.models.set(models));
  }

  addYear(input: HTMLInputElement): void {
    const year = Number(input.value);
    if (!year) return;
    this.adminApi.createYear(year).subscribe({
      next: () => {
        input.value = '';
        this.refreshYears();
      },
      error: (err) => this.toast.show(err?.error?.error ?? 'No se pudo agregar el año.'),
    });
  }

  removeYear(year: AdminYear): void {
    if (!confirm(`¿Eliminar el año ${year.year}? Se eliminarán sus modelos y trims asociados.`)) return;
    this.adminApi.deleteYear(year.id).subscribe(() => {
      this.refreshYears();
      this.refreshModels();
    });
  }

  addMake(input: HTMLInputElement): void {
    const name = input.value.trim();
    if (!name) return;
    this.adminApi.createMake(name).subscribe({
      next: () => {
        input.value = '';
        this.refreshMakes();
      },
      error: (err) => this.toast.show(err?.error?.error ?? 'No se pudo agregar la marca.'),
    });
  }

  removeMake(make: AdminMake): void {
    if (!confirm(`¿Eliminar la marca "${make.name}"?`)) return;
    this.adminApi.deleteMake(make.id).subscribe({
      next: () => this.refreshMakes(),
      error: (err) => this.toast.show(err?.error?.error ?? 'No se pudo eliminar la marca.'),
    });
  }

  addModel(yearSelect: HTMLSelectElement, makeSelect: HTMLSelectElement, nameInput: HTMLInputElement): void {
    const yearId = Number(yearSelect.value);
    const makeId = Number(makeSelect.value);
    const name = nameInput.value.trim();
    if (!yearId || !makeId || !name) return;

    this.adminApi.createModel(yearId, makeId, name).subscribe({
      next: () => {
        nameInput.value = '';
        this.refreshModels();
      },
      error: (err) => this.toast.show(err?.error?.error ?? 'No se pudo agregar el modelo.'),
    });
  }

  removeModel(model: AdminModel): void {
    if (!confirm(`¿Eliminar "${model.year} ${model.makeName} ${model.name}"? Se eliminarán sus trims.`)) return;
    this.adminApi.deleteModel(model.id).subscribe(() => {
      this.refreshModels();
      if (this.expandedModelId() === model.id) this.expandedModelId.set(null);
    });
  }

  toggleTrims(model: AdminModel): void {
    if (this.expandedModelId() === model.id) {
      this.expandedModelId.set(null);
      return;
    }
    this.expandedModelId.set(model.id);
    this.adminApi.getTrims(model.id).subscribe((trims) => this.trims.set(trims));
  }

  addTrim(modelId: number, input: HTMLInputElement): void {
    const name = input.value.trim();
    if (!name) return;
    this.adminApi.createTrim(modelId, name).subscribe({
      next: () => {
        input.value = '';
        this.adminApi.getTrims(modelId).subscribe((trims) => this.trims.set(trims));
      },
      error: (err) => this.toast.show(err?.error?.error ?? 'No se pudo agregar el trim.'),
    });
  }

  removeTrim(trim: AdminTrim): void {
    this.adminApi.deleteTrim(trim.id).subscribe(() => {
      this.adminApi.getTrims(trim.modelId).subscribe((trims) => this.trims.set(trims));
    });
  }
}
