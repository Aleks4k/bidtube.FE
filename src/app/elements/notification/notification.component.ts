import { Component, Input, ViewChild } from '@angular/core';
import { NotificationDataModel } from '../../models/notification.data.model';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { TagModule } from 'primeng/tag';
import { ApiService } from '../../services/api.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [ TagModule, CommonModule, PanelModule, MenuModule, RippleModule, ContextMenuModule ],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent {
  @Input() notification! : NotificationDataModel;
  @ViewChild('cm') cm!: ContextMenu;
  items_All: MenuItem[] = [];
  constructor(private _message: MessageService, private _api: ApiService, private _sharedVariables: StoreService) {
  }
  ngOnInit(){
    if(this.notification.status === 1 || this.notification.status === 2){
      this.items_All.push({
        label: 'Mark as read',
        icon: 'check',
        command: () => this.markAsRead()
      });
    }
    if(this.notification.action?.includes("msg(")){
      this.items_All.push({
        label: 'Send a message',
        icon: 'forum',
        command: () => this.openChat()
      });
    }
  }
  markAsRead(){
    if(this.notification.status === 3){
      this._message.add({ severity: 'error', summary: 'Error', detail: 'Notification is already marked as read.' });
      return;
    }
    this._api?.post("api/Notification/markAsRead", {
      notification: {
        Id: this.notification.id
      }
    }).subscribe(
      {
        next: () => {
          //Menjamo broj nepročitanih koji se koristi na app.component-u.
          let current: number | undefined = this._sharedVariables.getValue<number>('unreadNotifications')
          if(current === undefined){
            current = 0;
          }
          current--;
          this._sharedVariables.set<number>('unreadNotifications', current)
          //Menjamo niz notifikacija.
          let notificationsTmp: NotificationDataModel[] | undefined = this._sharedVariables.getValue<NotificationDataModel[]>('notifications')
          if(notificationsTmp === undefined)
            return; //Nece se desiti.
          let myNotification = notificationsTmp.find(x => x.id === this.notification.id)
          if(myNotification === undefined)
            return; //Nece se desiti.
          myNotification.status = 3;
          let filter = this._sharedVariables.getValue<boolean>('findAll');
          if(filter !== undefined){
            if(!filter){ //Ako je korisnik označio da traži samo nepročitane notifikacije.
              const index = notificationsTmp.findIndex(x => x.id === myNotification.id);
              if (index > -1) {
                notificationsTmp.splice(index, 1);
              }
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
  openChat(){

  }
  onContextMenu(event: any) {
    this.cm.target = event.currentTarget;
    this.cm.show(event);
  }
}