import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
} from '@angular/common/http';
import { AuthService } from '../dataservice/users-and-auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler) {
        const authToken = this.authService.GetToken();
        const authRequest = request.clone({
            headers: request.headers.set(
                'Authorization',
                `Bearer ${authToken}`
            ),
        });
        return next.handle(authRequest);
    }
}
