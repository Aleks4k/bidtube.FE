import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  constructor(private router: Router, private _auth: AuthService) { }
  canActivate(route: ActivatedRouteSnapshot): boolean {
    var route_link = route.routeConfig?.path
    if (this._auth.getAccessToken()) {
      if(this._auth.isFirstTime() && route_link != 'google-password-reset'){
        this.router.navigate(['/google-password-reset']);
        return false;
      }
      else if(this._auth.isFirstTime() && route_link == 'google-password-reset'){
        return true;
      } else {
        if(route_link === 'login' || route_link === 'register' || route_link === 'google-password-reset'){
          this.router.navigate(['/home']);
          return false;
        }
        return true;
      }
    } else {
      if(route_link !== 'login' && route_link !== 'register'){
        this.router.navigate(['/login']);
        return false;
      }
      return true;
    }
  }
}