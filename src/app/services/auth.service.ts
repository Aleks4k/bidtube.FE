import { Injectable } from '@angular/core';
import { AuthModel } from '../models/auth.model';
import { HubService } from './hub.service';
import { MessageService } from 'primeng/api';
import { ApiService } from './api.service';
import { catchError, finalize, Observable, shareReplay, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { StoreService } from './store.service';
import { NotificationDataModel } from '../models/notification.data.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  refreshAjax: boolean = false;
  lastObservable: Observable<any> | undefined;
  private loginSubject = new Subject<void>();
  onLogin$ = this.loginSubject.asObservable();
  constructor(private _sharedVariables: StoreService, private router: Router, private _hub: HubService, private _message: MessageService, private _api: ApiService) { }
  private getToken(): AuthModel | null {
    var auth = localStorage.getItem("authToken");
    if(!auth){
      auth = sessionStorage.getItem("authToken");
      if(!auth){
        return null;
      }
    }
    return JSON.parse(auth!);
  }
  setAuthToken(token: string): void{
    const model = this.getToken();
    if(model){
      model.access = token;
      if(localStorage.getItem("authToken")){
        this.setToken(model, false, false);
      } else {
        this.setToken(model, true, false);
      }
    }
  }
  clearToken(logout: boolean){ //Ako je caller iz f-je koja ima za cilj da skroz log-outuje usera onda se stopira.
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    if(logout){
      this._hub.stopConnection();
      this._sharedVariables.set<NotificationDataModel[]>('notifications', []) //Restartujemo/setujemo memoriju da je prazna kao što i treba da bude ovde.
    }
  }
  emitLogin() { //Koristi se da kažemo svima koji su subsribeovani na onLogin da se dogodio login.
    this.loginSubject.next();
  }
  setToken(model: AuthModel, session: boolean, login: boolean): void {
    //login - predstavlja info da li se metoda poziva u momentu kada se user loguje ili negde kada je već logovan.
    this.clearToken(false);
    if(session){
      sessionStorage.setItem("authToken", JSON.stringify(model));
    } else {
      localStorage.setItem("authToken", JSON.stringify(model));
    }
    if(login){
      //Treba da emitujem događaj koji ću moći da prisluškujem na app.component.ts
      this.emitLogin();
    }
  }
  removeToken(): void {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
  }
  getAccessToken(): string{
    const model = this.getToken();
    return model !== null ? model.access : '';
  }
  getRefresh(): string{
    const model = this.getToken();
    return model !== null ? model.refresh : '';
  }
  getUserEmail(): string{
    const model = this.getToken();
    return model !== null ? model.mail : '';
  }
  getUsername(): string{
    const model = this.getToken();
    return model !== null ? model.username : '';
  }
  isFirstTime(): boolean{
    const model = this.getToken();
    return model !== null ? model.firstTime : false;
  }
  setFirstTime(first: boolean): void {
    const model = this.getToken();
    if(model){
      model.firstTime = first;
      if(localStorage.getItem("authToken")){
        this.setToken(model, false, false);
      } else {
        this.setToken(model, true, false);
      }
    }
  }
  setUsername(username: string): void {
    const model = this.getToken();
    if(model){
      model.username = username;
      if(localStorage.getItem("authToken")){
        this.setToken(model, false, false);
      } else {
        this.setToken(model, true, false);
      }
    }
  }
  refreshAccessToken(): Observable<any> { //Mehanizam koji nam omogućava da ako je već pozvan jedan refresh ne moramo da zovemo drugi već dozvoljavamo subscribe na isti.
    if (!this.refreshAjax) {
        this.refreshAjax = true;
        this.lastObservable = this._api.post("api/User/refresh", {
            user: {
                token: this.getRefresh(),
                mail: this.getUserEmail()
            }
        }).pipe(
            tap((response: any) => {
                this.setAuthToken(response.access);
            }),
            catchError((error: any) => {
                if (error.status === 405) {
                    this.clearToken(true);
                    this.router.navigate(['/login']);
                    this._message.add({ severity: 'error', summary: 'Error', detail: 'Please log in again.' });
                }
                return throwError(() => new HttpErrorResponse({
                  error: error.error,
                  headers: error.headers,
                  status: error.status,
                  statusText: error.statusText,
                  url: error.url
                }));
            }),
            finalize(() => {
                this.refreshAjax = false;
            }),
            shareReplay(1)
        );
    }
    return this.lastObservable!;
  }
}
