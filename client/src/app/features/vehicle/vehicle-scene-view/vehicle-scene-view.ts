import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  VehicleSceneHandle,
  VehicleView,
  createVehicleScene,
} from '../vehicle-scene';

@Component({
  selector: 'app-vehicle-scene-view',
  styleUrl: './vehicle-scene-view.css',
  templateUrl: './vehicle-scene-view.html',
})
export class VehicleSceneView implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() activeCategory: string | null = null;

  @Output() hotspotClick = new EventEmitter<{ category: string; label: string }>();
  @Output() hotspotHover = new EventEmitter<{ category: string; x: number; y: number } | null>();
  @Output() autoRotateChange = new EventEmitter<boolean>();

  private scene: VehicleSceneHandle | null = null;

  ngAfterViewInit(): void {
    this.scene = createVehicleScene(this.containerRef.nativeElement, {
      onHotspotClick: (category, label) => this.hotspotClick.emit({ category, label }),
      onHotspotHover: (category, x, y) =>
        this.hotspotHover.emit(category ? { category, x: x ?? 0, y: y ?? 0 } : null),
      onAutoRotateChange: (isOn) => this.autoRotateChange.emit(isOn),
    });

    if (this.activeCategory) this.scene.setActiveCategory(this.activeCategory);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeCategory'] && this.scene) {
      this.scene.setActiveCategory(this.activeCategory);
    }
  }

  ngOnDestroy(): void {
    // Critical: stops the rAF loop, disconnects the ResizeObserver, disposes
    // the renderer, and removes the canvas — without this the render loop
    // keeps running into a detached container after navigating away.
    this.scene?.destroy();
  }

  goToView(view: VehicleView): void {
    this.scene?.goToView(view);
  }

  focusCategory(category: string): void {
    this.scene?.focusCategory(category);
  }

  toggleAutoRotate(): boolean {
    return this.scene?.toggleAutoRotate() ?? false;
  }

  get autoRotate(): boolean {
    return this.scene?.autoRotate ?? false;
  }

  getHotspotScreenPositions() {
    return this.scene?.getHotspotScreenPositions() ?? [];
  }
}
