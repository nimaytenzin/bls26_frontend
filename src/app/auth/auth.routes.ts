import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { VerifyNoticeComponent } from './verify-notice/verify-notice.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { SetPasswordComponent } from './set-password/set-password.component';
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
	{ path: 'verify-notice', component: VerifyNoticeComponent },
	{	path: 'verify-email', component: VerifyEmailComponent },
	{ path: 'set-password', component: SetPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent }
];
