import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterModule, RouteConfigLoadStart, RouteConfigLoadEnd, NavigationEnd } from '@angular/router';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { UserDataModel } from '../../models/user.data.model';
import { ChangeDetectorRef } from '@angular/core';
import { GoBackButtonComponent } from '../../elements/go-back-button/go-back-button.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ GoBackButtonComponent, SkeletonModule, DividerModule, FormsModule, RatingModule, StyleClassModule, AnimateOnScrollModule, RippleModule, RouterModule, BreadcrumbModule, CommonModule, ProgressSpinnerModule ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  @ViewChild('profileOutlet') profileOutlet!: RouterOutlet;
  loadingRouteConfig: boolean = false;
  items: MenuItem[] | undefined;
  private routerEventsSubscription: any;
  user_data: UserDataModel | undefined;
  loading_Data: boolean = true;
  constructor (private cdref: ChangeDetectorRef, private _message: MessageService, private router: Router, public _auth: AuthService, private _api:ApiService) {}
  ngAfterContentChecked(){
    this.cdref.detectChanges(); //Sprečavamo da kada se profileOutlet update izbaci grešku.
  }
  ngOnInit(): void {
    this.routerEventsSubscription = this.router.events.subscribe(event => {
        if (event instanceof RouteConfigLoadStart) {
          this.loadingRouteConfig = true;
        } else if (event instanceof RouteConfigLoadEnd) {
          this.loadingRouteConfig = false;
        }
        else if (event instanceof NavigationEnd){
          this.getBreadcrumbItems();
        }
    });
    this.getBreadcrumbItems();
    this.loading_Data = true;
    this._api.post("api/User/getUserData", {
      user: {
        mail: this._auth.getUserEmail()
      }
    }).subscribe({
      next: (v: UserDataModel) => {
        this.loading_Data = false;
        this.user_data = v;
      },
      error: (e) => {
        if(e.status === 400){
          for(var obj in e.error.validationErrors){
            this._message.add({ severity: 'error', summary: 'Error', detail: e.error.validationErrors[obj] });
          }
        }
      }
    })
  }
  ngOnDestroy(): void {
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }
  }
  getBreadcrumbItems(): void {
    this.items = [{ icon: 'home', route: '/home' }];
    var routes = this.router.url.split("/");
    routes.forEach((route, index) => {
      if(route){
        if(routes.length === index+1){
          this.items?.push({label: this.getLabelFromRoute(route), route: this.router.url.substring(0, this.router.url.indexOf(route) + route.length), active: true});
        } else {
          this.items?.push({label: this.getLabelFromRoute(route), route: this.router.url.substring(0, this.router.url.indexOf(route) + route.length)});
        }
      }
    });
  }
  getLabelFromRoute(route: string): string {
    switch(route)
    {
      case "profile":
        return "Profile";
      case "edit":
        return "General Informations";
      case "password":
        return "Password Settings"
      default:
        return "Unknown";
    }
  }
}
