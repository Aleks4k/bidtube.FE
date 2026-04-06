import { DOCUMENT } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { MessageService } from "primeng/api";

@Injectable({
    providedIn: "root",
})
export class ThemeService{
    firstChange: boolean = true;
    constructor(@Inject(DOCUMENT) private document: Document, private http: HttpClient, private _message: MessageService){}
    switchTheme(theme: string){
        let themeLink = this.document.getElementById('app-theme') as HTMLLinkElement;
        if(themeLink){
            if(this.firstChange){ //Samo prvi put nam treba da preuzmemo dark/light mode i posle su oni keširani i nema razloga da ih opet preuzimamo. Ako bi ostavili bez ovoga iz nekog razloga nakon nekog vremena get request kao da ne kapira da je već preuzimao ovo i opet počinje preuzimanje što nije potrebno.
                this._message.add({ severity: 'info', summary: 'Info', detail: 'Theme change initiated.' });
                this.http.get("/" + theme + ".css", { responseType: 'text' }).subscribe(
                    {
                    next: (v) => {
                        themeLink.href = theme + '.css';
                        localStorage.setItem("darkMode", theme === 'light' ? 'false': 'true');
                        this._message.add({ severity: 'success', summary: 'Success', detail: 'Theme change finished.' });
                    },
                    error: (e) => {
                        this._message.add({ severity: 'error', summary: 'Error', detail: 'An error occurred while changing the theme.' });
                    }
                })
                this.firstChange = false;
            } else {
                themeLink.href = theme + '.css';
                localStorage.setItem("darkMode", theme === 'light' ? 'false': 'true');
            }
        }
    }
}