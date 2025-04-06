// masonry-grid-item.directive.ts
import {
    Directive,
    ElementRef,
    HostListener,
    Renderer2,
    AfterViewInit,
} from '@angular/core';

@Directive({
    selector: '[appMasonryGridItem]',
    standalone: true,
})
export class MasonryGridItemDirective implements AfterViewInit {
    constructor(private el: ElementRef, private renderer: Renderer2) {}

    ngAfterViewInit() {
        this.setRowSpan();
    }

    @HostListener('window:resize')
    onResize() {
        this.setRowSpan();
    }

    private setRowSpan() {
        const grid = this.el.nativeElement.parentElement;
        const rowHeight = parseInt(
            getComputedStyle(grid).getPropertyValue('grid-auto-rows')
        );
        const rowGap = parseInt(getComputedStyle(grid).getPropertyValue('gap'));
        const contentHeight =
            this.el.nativeElement.getBoundingClientRect().height;

        const rowSpan = Math.ceil(
            (contentHeight + rowGap) / (rowHeight + rowGap)
        );
        this.renderer.setStyle(
            this.el.nativeElement,
            'grid-row-end',
            `span ${rowSpan}`
        );
    }
}
