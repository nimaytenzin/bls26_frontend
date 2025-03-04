import {
    Component,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild,
} from '@angular/core';
import { OwnerTopbarComponent } from './owner-topbar/owner-topbar.component';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AdminSidebarComponent } from '../admin/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../admin/admin-topbar/admin-topbar.component';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { OwnerLayoutService } from './service/owner-layout.service';
import { OwnerSidebarComponent } from './owner-sidebar/owner-sidebar.component';

@Component({
    selector: 'app-owner-layout',
    templateUrl: './owner-layout.component.html',
    styleUrls: ['./owner-layout.component.scss'],
})
export class OwnerLayoutComponent implements OnDestroy {
    overlayMenuOpenSubscription: Subscription;

    routeChangeSubscription: Subscription;

    menuOutsideClickListener: any;

    profileMenuOutsideClickListener: any;

    @ViewChild(OwnerSidebarComponent) appSidebar!: OwnerSidebarComponent;

    @ViewChild(OwnerTopbarComponent) appTopbar!: OwnerTopbarComponent;

    isProfileRoute: boolean = false;

    constructor(
        public layoutService: OwnerLayoutService,
        public renderer: Renderer2,
        public router: Router,
        private authService: AuthService
    ) {
        this.overlayMenuOpenSubscription =
            this.layoutService.overlayOpen$.subscribe(() => {
                if (!this.menuOutsideClickListener) {
                    this.menuOutsideClickListener = this.renderer.listen(
                        'document',
                        'click',
                        (event) => {
                            const isOutsideClicked = !(
                                this.appSidebar.el.nativeElement.isSameNode(
                                    event.target
                                ) ||
                                this.appSidebar.el.nativeElement.contains(
                                    event.target
                                ) ||
                                this.appTopbar.menuButton.nativeElement.isSameNode(
                                    event.target
                                ) ||
                                this.appTopbar.menuButton.nativeElement.contains(
                                    event.target
                                )
                            );

                            if (isOutsideClicked) {
                                this.hideMenu();
                            }
                        }
                    );
                }

                if (!this.profileMenuOutsideClickListener) {
                    this.profileMenuOutsideClickListener = this.renderer.listen(
                        'document',
                        'click',
                        (event) => {
                            const isOutsideClicked = !(
                                this.appTopbar.menu.nativeElement.isSameNode(
                                    event.target
                                ) ||
                                this.appTopbar.menu.nativeElement.contains(
                                    event.target
                                ) ||
                                this.appTopbar.topbarMenuButton.nativeElement.isSameNode(
                                    event.target
                                ) ||
                                this.appTopbar.topbarMenuButton.nativeElement.contains(
                                    event.target
                                )
                            );

                            if (isOutsideClicked) {
                                this.hideProfileMenu();
                            }
                        }
                    );
                }

                if (this.layoutService.state.staticMenuMobileActive) {
                    this.blockBodyScroll();
                }
            });

        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => {
                this.hideMenu();
                this.hideProfileMenu();
            });

        this.routeChangeSubscription = this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                const url = event.urlAfterRedirects;
                if (url === '/tenant/profile') {
                    this.isProfileRoute = true;
                } else {
                    this.isProfileRoute = false;
                }
            });
    }

    hideMenu() {
        this.layoutService.state.overlayMenuActive = false;
        this.layoutService.state.staticMenuMobileActive = false;
        this.layoutService.state.menuHoverActive = false;
        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }
        this.unblockBodyScroll();
    }

    hideProfileMenu() {
        this.layoutService.state.profileSidebarVisible = false;
        if (this.profileMenuOutsideClickListener) {
            this.profileMenuOutsideClickListener();
            this.profileMenuOutsideClickListener = null;
        }
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(
                new RegExp(
                    '(^|\\b)' +
                        'blocked-scroll'.split(' ').join('|') +
                        '(\\b|$)',
                    'gi'
                ),
                ' '
            );
        }
    }

    get containerClass() {
        return {
            'layout-theme-light':
                this.layoutService.config().colorScheme === 'light',
            'layout-theme-dark':
                this.layoutService.config().colorScheme === 'dark',
            'layout-overlay':
                this.layoutService.config().menuMode === 'overlay',
            'layout-static': this.layoutService.config().menuMode === 'static',
            'layout-static-inactive':
                this.layoutService.state.staticMenuDesktopInactive &&
                this.layoutService.config().menuMode === 'static',
            'layout-overlay-active': this.layoutService.state.overlayMenuActive,
            'layout-mobile-active':
                this.layoutService.state.staticMenuMobileActive,
            'p-input-filled':
                this.layoutService.config().inputStyle === 'filled',
            'p-ripple-disabled': !this.layoutService.config().ripple,
        };
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }
}
