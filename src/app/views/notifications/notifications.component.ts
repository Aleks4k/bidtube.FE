import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { StoreService } from '../../services/store.service';
import { first, Subscription } from 'rxjs';
import { NotificationDataModel } from '../../models/notification.data.model';
import { ApiService } from '../../services/api.service';
import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { GoBackButtonComponent } from '../../elements/go-back-button/go-back-button.component';
import { NotificationComponent } from '../../elements/notification/notification.component';
import { ScrollerModule } from 'primeng/scroller';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [ ScrollerModule, NotificationComponent, GoBackButtonComponent, CommonModule, ButtonModule, FormsModule, MenuModule, RippleModule, SkeletonModule ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  @ViewChild('scrollerHolder', { static: false }) scrollerHolder!: ElementRef;
  @Input() loadedAsOverlay: boolean = false;
  lazyLoading: boolean = true;
  dynamicHeight = 100;
  private notificationsSub!: Subscription;
  steps_skeleton: number[] = [0,1,2,3,4,5,6,7,8,9];
  items_All: MenuItem[] | undefined;
  findAll$ = this._sharedVariables.select<boolean>('findAll', true);
  initNotificationsLoaded: boolean = false; //Prvo učitavanje kada se dođe na formu.
  notifications: NotificationDataModel[] = [];
  constructor(private _message: MessageService, private cdref: ChangeDetectorRef, private _sharedVariables: StoreService, private _api: ApiService) {}
  ngOnInit(){
    this.notificationsSub = this._sharedVariables.select<NotificationDataModel[]>('notifications', []).subscribe(value => {
      this.notifications = value
      this.cdref.detectChanges();
    });
    this.items_All = [
      {
        label: 'Mark all as read',
        icon:'check',
        command: () => this.markAllAsRead()
      }
    ]
    this.initNotificationsLoaded = false;
    this.loadNotifications(0, true);
  }
  loadNotifications(startIndex: number, firstLoad: boolean){
    this.lazyLoading = true;
    this._api?.post("api/Notification/getNotifications", {
      notification: {
        id: startIndex,
        findAll: this._sharedVariables.getValue<boolean>('findAll')
      }
    }).subscribe({
        next: (v: NotificationDataModel[]) => {
          if(v.length >= 10){ //Ako ima manje od 10 znači da nemamo više šta da učitavamo.
            v.push(...Array(1).fill({})) //Mozda je bolje da dodaš samo 1 element nego v.count jer kad dodaš v.count niko im ne brani da "preskroluju" prošlo a neću da im radi kao skipRows jer nije skalabilno. Oću da bukvalno ide po notification_id.
          }
          if(!firstLoad){ //Na svakom učitavanju osim prvog moramo da dumpujemo ovaj poslednji element.
            this.notifications.pop();
          } else {
            this.notifications = []; //Praznimo niz i krećemo da punimo opet. Moramo da ga praznimo zbog korisnika na racunarima koji imaju notifikacije kroz onaj mini menu.
          }
          this.notifications.push(...v) //Dodajemo 10 novih plus jedan prazan.
          this._sharedVariables.set<NotificationDataModel[]>('notifications', this.notifications)
          if(firstLoad){
            this.initNotificationsLoaded = true;
          }
          this.lazyLoading = false;
        },
        error: (e) => {
          if(firstLoad){
            this.initNotificationsLoaded = true;
          }
          this.lazyLoading = false;
          if(e.status === 400){
            for(var obj in e.error.validationErrors){
              this._message.add({ severity: 'error', summary: 'Error', detail: e.error.validationErrors[obj] });
            }
          }
        }
    });
  }
  ngOnDestroy():void {
    this.notificationsSub.unsubscribe();
  }
  markAllAsRead(){
    this._api?.post("api/Notification/markAllAsRead", {
    }).subscribe(
      {
        next: () => {
          //Menjamo broj nepročitanih koji se koristi na app.component-u.
          let current: number | undefined = this._sharedVariables.getValue<number>('unreadNotifications')
          current = 0;
          this._sharedVariables.set<number>('unreadNotifications', current)
          //Menjamo niz notifikacija.
          let notificationsTmp: NotificationDataModel[] | undefined = this._sharedVariables.getValue<NotificationDataModel[]>('notifications')
          if(notificationsTmp === undefined)
            return; //Nece se desiti.
          notificationsTmp.forEach(notification => {
            notification.status = 3;
          });
          let filter = this._sharedVariables.getValue<boolean>('findAll');
          if(filter !== undefined){
            if(!filter){ //Ako je korisnik označio da traži samo nepročitane notifikacije.
              notificationsTmp = [] //Bukvalno praznimo niz.
            }
          }
          this._sharedVariables.set<NotificationDataModel[]>('notifications', notificationsTmp)
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
  notificationFilterChanged(findAll: boolean){
    this._sharedVariables.set('findAll', findAll);
    this.initNotificationsLoaded = false; //Ovo je bukvalno kao da iz početka učitavamo stranicu.
    this.loadNotifications(0, true);
  }
  trackByNotificationId(index: number, item: NotificationDataModel): number {
    return item.id;
  }
  onLazyLoad(event: any) {
    if(this.lazyLoading)
      return; //Ako je jedno učitavanje već pokrenuto.
    const last = this.notifications.at(event.last-1)
    if(last === undefined || Object.keys(last).length === 0){
      const notification_id_filter = this.notifications.at(event.last-2)?.id
      if(!notification_id_filter) //Ako je 0 ili undefined (ne bi trebalo ikada da se desi).
        return;
      this.loadNotifications(notification_id_filter, false);
    }
  }
  ngAfterViewInit() {
    //Što timeout? Bukvalno kad ga ne stavim height kada se vraćam sa main npr. on daje neku ludačku vrednost.
    //Zašto sve ovo? Jer sam morao da nađem način da scrolleru kažem koliko je visok i ovo je bukvalno jedino moguće kada se koristi flex.
    setTimeout(() => {
      const height = this.scrollerHolder.nativeElement.offsetHeight;
      this.dynamicHeight = height;
      this.cdref.detectChanges();
    }, 0);
  }
}
