import { NgModule, isDevMode } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AdminLayoutModule } from './presentations/layout/admin/admin-layout.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TenantLayoutModule } from './presentations/layout/tenant/tenant-layout.module';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha';
import { OwnerLayoutModule } from './presentations/layout/owner/owner-layout.module';

@NgModule({
    declarations: [AppComponent],
    imports: [
        AppRoutingModule,
        AdminLayoutModule,
        TenantLayoutModule,
        OwnerLayoutModule,
        ToastModule,
        RecaptchaV3Module,
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        MessageService,
        {
            provide: RECAPTCHA_V3_SITE_KEY,
            useValue: '6Lc8HAgqAAAAAJugjiHqmlDf9XPHE5FOh0ifdcEe',
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
