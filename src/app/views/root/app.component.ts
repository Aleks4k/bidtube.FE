import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteConfigLoadEnd, RouteConfigLoadStart, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { StyleClassModule } from 'primeng/styleclass';
import { AuthService } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MenubarModule } from 'primeng/menubar';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { MenuItem, PrimeNGConfig } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ThemeService } from '../../services/theme.service';
import { DockModule } from 'primeng/dock';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HubService } from '../../services/hub.service';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { StoreService } from '../../services/store.service';
import { lastValueFrom, Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { UnreadNotifications } from '../../models/unread.notifications.model';
import { NotificationDataModel } from '../../models/notification.data.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ToastModule,
    BadgeModule,
    ButtonModule,
    DividerModule,
    MenubarModule,
    InputTextModule,
    RippleModule,
    CommonModule,
    FormsModule,
    AnimateOnScrollModule,
    StyleClassModule,
    MenuModule,
    DockModule,
    ProgressSpinnerModule,
    OverlayPanelModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private loginSub!: Subscription;
  private unreadNotificationsSub!: Subscription;
  private notificationReceivedSub!: Subscription;
  loadingRouteConfig: boolean = false;
  private routerEventsSubscription: any;
  items: MenuItem[] | undefined; //Itemi za dock na malim ekranima.
  title = 'bidtube';
  theme!: string;
  menu_person_items: MenuItem[] | undefined; //Za user menu na velikim ekranima.
  year: number = new Date().getFullYear();
  notificationsContainerLoaded: boolean = false; //Koristi se za prikazivanje loadera.
  unreadNotifications: number = 0;
  @ViewChild('opn') opn!: OverlayPanel;
  @ViewChild('notificationIcon') notificationIconRef!: ElementRef; //Moramo da imamo ovo jer nemamo drugi način da otvorimo notifikacije kroz menu u TS.
  @ViewChild('notificationsContainer', { read: ViewContainerRef }) notificationsContainer!: ViewContainerRef;
  @ViewChild('tempNotificationsContainer', { read: ViewContainerRef }) tempNotificationsContainer!: ViewContainerRef;
  constructor(
    private router: Router,
    private themeService: ThemeService,
    public _auth: AuthService,
    private _message: MessageService,
    private primengConfig: PrimeNGConfig,
    private _hub: HubService,
    private _sharedVariables: StoreService,
    private cdref: ChangeDetectorRef,
    private _api: ApiService
  ) {
    this.theme = localStorage.getItem("darkMode") === 'true' ? 'dark': 'light';
  }
  ngOnInit() {
    this.primengConfig.ripple = true;
    this.updateMenuItems();
    this.updateItems();
    this.routerEventsSubscription = this.router.events.subscribe(event => {
      //Pošto je ovo app.component koji drži sve ostale problem je kada neka podkomponenta ima isti ovaj listener za istu nameru odnosno prikazivanje loadera za vreme učitavanja lazy rute. Zbog toga je ideja da ovde direktno proverimo da li se radi o ruti na koju se direktno ide sa app.componenta ili ne.
      //Zbog ovog treba paziti da se neka subruta neće zvati isto npr.
      let routes: string[];
      routes = [ 'post_auction', 'profile', 'register', 'google-password-reset', 'notifications' ];
      if (event instanceof RouteConfigLoadStart) {
        if(routes.includes(event.route.path!)){
          this.loadingRouteConfig = true;
        }
      } else if (event instanceof RouteConfigLoadEnd) {
        if(routes.includes(event.route.path!)){
          this.loadingRouteConfig = false;
        }
      }
    });
    let access: string = this._auth.getAccessToken()
    if(access){
      this.startHubConnection().then(() => {
        this.initAndLoadNotifications()
      })
    }
    this.loginSub = this._auth.onLogin$.subscribe(() => {
      //ovo se dešava kada se korisnik loginuje.
      this.startHubConnection().then(() => {
        this._sharedVariables.set<NotificationDataModel[]>('notifications', []) //Restartujemo/setujemo memoriju da je prazna kao što i treba da bude ovde. Ovo ne mora pošto i na loguout ima al neka ga.
        this.initAndLoadNotifications()
      })
    });
  }
  async startHubConnection() : Promise<void>{
    let access: string = this._auth.getAccessToken()
    let statusCode = await this._hub.startConnection(access);
    if (statusCode === 401) {
      try {
        const refreshed = await lastValueFrom(this._auth.refreshAccessToken());
        let newStatus = await this._hub.startConnection(refreshed.access);
        if (newStatus !== 200) {
          this._message.add({ severity: 'error', summary: 'Error', detail: 'Something went wrong during the initialization of the connection with the server.' });
        }
      } catch (err) {
        this._message.add({ severity: 'error', summary: 'Auth Error', detail: 'Could not refresh access token.' });
      }
    }
  }
  initAndLoadNotifications(){
    if (this.notificationReceivedSub) {
      this.notificationReceivedSub.unsubscribe();
    }
    if(this.unreadNotificationsSub){
      this.unreadNotificationsSub.unsubscribe();
    }
    this.unreadNotificationsSub = this._sharedVariables.select<number>('unreadNotifications', 0).subscribe(value => {
      this.unreadNotifications = value;
      this.updateMenuItems();
      this.updateItems();
      this.cdref.detectChanges();
    });
    this.notificationReceivedSub = this._hub.onNotificationReceived().subscribe((message : string) => {
      //Znači da smo dobili novu notifikaciju.
      let current: number | undefined = this._sharedVariables.getValue<number>('unreadNotifications')
      if(current === undefined){
        current = 0;
      }
      current++;
      this._sharedVariables.set<number>('unreadNotifications', current)
      const parsedObject = JSON.parse(message) as NotificationDataModel;
      //Dodajemo notifikaciju u _sharedVariables notifications.
      let notifications: NotificationDataModel[] | undefined = this._sharedVariables.getValue<NotificationDataModel[]>('notifications')
      if(notifications === undefined){
        notifications = []
      }
      notifications.unshift(parsedObject) //Ovako dodajemo element na prvo mesto niza a nama to treba jer su sortirani po ID odnosno po datumu ubacivanja.
      this._sharedVariables.set<NotificationDataModel[]>('notifications', notifications)
    });
    this._api?.get("api/Notification/unread/count").subscribe(
      {
        next: (v: UnreadNotifications) => {
          this._sharedVariables.set<number>('unreadNotifications', v.count)
        },
        error: (e) => {
          if(e.status === 400){
            for(var obj in e.error.validationErrors){
              this._message.add({ severity: 'error', summary: 'Error', detail: e.error.validationErrors[obj] });
            }
          }
        }
      }
    )
  }
  ngOnDestroy(): void { //Ovo su više dobre prakse nego što nam treba jer se ngOnDestory ove komponente nikada neće pozivati.
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }
    if(this.unreadNotificationsSub){
      this.unreadNotificationsSub.unsubscribe();
    }
    if(this.loginSub){
      this.loginSub.unsubscribe();
    }
    if(this.notificationReceivedSub){
      this.notificationReceivedSub.unsubscribe();
    }
  }
  openPostAuction(){
    this.router.navigate(['/post_auction'])
  }
  updateMenuItems() {
      this.menu_person_items = [
          {
              items: [
                  {
                    separator: true
                  },
                  {
                    label: 'Add Auction',
                    icon: 'add_circle',
                    command: () => this.openPostAuction()
                  },
                  {
                    separator: true
                  },
                  {
                    label: 'My Auctions',
                    icon: 'folder_open',
                    //command: () => this.changeTheme(),
                  },
                  {
                    label: 'Inbox',
                    icon: 'inbox',
                    //command: () => this.changeTheme(),
                  },
                  {
                    label: 'Notifications',
                    icon: 'notifications',
                    badge: this.unreadNotifications.toString(),
                    command: () => this.notificationIconRef.nativeElement.click(), //Fake click na ovaj element.
                  },
                  {
                    separator: true
                  },
                  {
                    label: ( this.theme === 'light' ? 'Toggle dark mode' : 'Toggle light mode' ),
                    icon: ( this.theme === 'light' ? 'dark_mode' : 'light_mode' ),
                    command: () => this.changeTheme(),
                  },
                  {
                    separator: true
                  },
                  {
                      label: 'Open profile',
                      icon: 'person',
                      command: () => this.openEditProfile(),
                  },
                  {
                      label: 'Logout',
                      icon: 'logout',
                      command: () => this.logout(),
                  },
                  {
                    separator: true
                  },
              ]
          }
      ];
  }
  updateItems(){
    this.items = [
      {
          label: 'Home',
          icon: 'home',
          routerLink: '/home'
      },
      {
          label: 'Messages',
          icon: 'inbox'
      },
      {
          label: 'Add Auction',
          icon: 'add_circle',
          command: () => this.openPostAuction()
      },
      {
          label: 'Notifications',
          icon: 'notifications',
          badge: this.unreadNotifications.toString(),
          command: () => this.navigateToNotifications()
      },
      {
        label: 'My Auctions',
        icon: 'folder_open'
      },
    ];
  }
  logout(){
    this._auth.clearToken(true);
    this.router.navigate(['/login'])
    this._message.add({ severity: 'info', summary: 'Log out', detail: 'You have successfully logged out.' });
  }
  openEditProfile(){
    this.router.navigate(['/profile'])
  }
  navigateToNotifications(){
    this.router.navigate(['/notifications'])
  }
  async onNotificationOverlayShow(){
    //Cilj svega ovoga: Kada ne bi imali ovako ucitavanje vec stalno ucitavali iznova i iznova createComponent, svaki put bi morali opet i opet da pozivamo sve iz ngOnInit na notifikacijama a to nam ne treba. Nama treba da kada jednom učitamo obaveštenja ne učitavamo ponovo ista obaveštenja jer je to idiotski.
    if(this.tempNotificationsContainer.length === 0){ //Učitavamo prvi put komponentu.
      //Otvaramo prvi put.
      const { NotificationsComponent } = await import('../notifications/notifications.component');
      const componentRef = this.notificationsContainer.createComponent(NotificationsComponent);
      componentRef.setInput('loadedAsOverlay', true);
      this.notificationsContainerLoaded = true;
    } else { //Već je bila učitavana i zatvorena pa premeštana u tempNotificationsContainer.
      //Otvaramo 2 ili više puta.
      for (let i = this.tempNotificationsContainer.length - 1; i >= 0; i--) {
        const view = this.tempNotificationsContainer.detach(i);
        this.notificationsContainer.insert(view!);
      }
      this.notificationsContainerLoaded = true;
    }
  }
  onNotificationHide(){
    //Zatvaramo.
    for (let i = this.notificationsContainer.length - 1; i >= 0; i--) {
      const view = this.notificationsContainer.detach(i);
      this.tempNotificationsContainer.insert(view!);
    }
    this.notificationsContainerLoaded = false;
  }
  toggleNotifications(event: Event){
    this.opn.toggle(event)
  }
  changeTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.themeService.switchTheme(this.theme);
    this.updateMenuItems();
  }
}