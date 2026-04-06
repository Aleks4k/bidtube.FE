import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MainComponent } from './views/main/main.component';
import { AuthGuardService } from './services/auth.guard.service';
import { LoginComponent } from './views/login/login.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent, canActivate: [AuthGuardService] },
    { 
        path: 'register', 
        loadComponent: () => import('./views/register/register.component')
            .then(x => x.RegisterComponent),
        canActivate: [AuthGuardService] 
    },
    {
        path: 'google-password-reset', 
        loadComponent: () => import('./views/google-password-reset/google-password-reset.component')
            .then(x => x.GooglePasswordResetComponent),
        canActivate: [AuthGuardService] 
    },
    { path: 'home', component: MainComponent, canActivate: [AuthGuardService] },
    { 
        path: 'post_auction',  
        loadComponent: () => import('./views/make-auction/make-auction.component')
            .then(x => x.MakeAuctionComponent),
        canActivate: [AuthGuardService]
    },
    { 
        path: 'notifications',  
        loadComponent: () => import('./views/notifications/notifications.component')
            .then(x => x.NotificationsComponent),
        canActivate: [AuthGuardService]
    },
    { 
        path: 'profile',
        loadComponent: () => import('./views/profile/profile.component')
            .then(x => x.ProfileComponent),
        children: [
            { 
                path: 'edit',  
                loadComponent: () => import('./views/profile/child/general-account-informations/general-account-informations.component')
                    .then(x => x.GeneralAccountInformationsComponent)
            },
            { 
                path: 'password',  
                loadComponent: () => import('./views/profile/child/reset-password/reset-password.component')
                    .then(x => x.ResetPasswordComponent)
            },
        ],
        canActivate: [AuthGuardService] 
    },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { 
        path: '**',
        loadComponent: () => import('./views/not-found/not-found.component')
                .then(x => x.NotFoundComponent)
    }
];
@NgModule({
    imports: [RouterModule.forRoot(routes, {onSameUrlNavigation:'reload'})],
    exports: [RouterModule]
})
export class AppRoutingModule { }