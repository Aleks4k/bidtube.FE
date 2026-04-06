import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class HubService {
    public baseUrl = environment.baseUrl;
    private hubConnection: any;
    private auctionUpdateSubject = new Subject<string>();
    private notificationSubject = new Subject<string>();
    private signalR: any;
    async startConnection(token: string) : Promise<number> {
        if(this.signalR === undefined){
            this.signalR = await import('@microsoft/signalr');
        }
        this.hubConnection = new this.signalR.HubConnectionBuilder()
            .withUrl(`${this.baseUrl}/hub`, {
                accessTokenFactory: () => token
            })
            .build();
        this.hubConnection.keepAliveIntervalInMilliseconds = 30000;
        this.hubConnection.serverTimeoutInMilliseconds = 60000;
        if(this.auctionUpdateSubject.closed){
            this.auctionUpdateSubject = new Subject<string>(); //Mora jer smo se na stopConnection unsubscribe.
        }
        this.hubConnection.on('AuctionUpdate', (message: string) => {
            this.auctionUpdateSubject.next(message);
        });
        if(this.notificationSubject.closed){
            this.notificationSubject = new Subject<string>(); //Mora jer smo se na stopConnection unsubscribe.
        }
        this.hubConnection.on('Notification', (message: string) => {
            this.notificationSubject.next(message);
        });
        return await this.hubConnection.start()
            .then(() => {
                return 200;
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.toString().includes("Status code '401'")) {
                    return 401;
                }
                return 400;
            });
    }
    stopConnection(){
        if(this.hubConnection !== undefined){
            this.auctionUpdateSubject.unsubscribe();
            this.notificationSubject.unsubscribe();
            this.hubConnection.stop();
            this.hubConnection = undefined;
        }
    }
    onNotificationReceived(): Observable<string> {
        return this.notificationSubject.asObservable();
    }
    onAuctionUpdate(): Observable<string> {
        return this.auctionUpdateSubject.asObservable();
    }
}