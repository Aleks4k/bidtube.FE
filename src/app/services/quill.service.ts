import { DOCUMENT } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { MessageService } from "primeng/api";

@Injectable({
    providedIn: "root",
})
export class QuillService{
    quillLoaded: boolean = false;
    constructor(@Inject(DOCUMENT) private document: Document, private http: HttpClient, private _message: MessageService){}
    loadQuill(){
        let quillLink = this.document.getElementById('quill-loader') as HTMLLinkElement;
        if(quillLink){
            if(!this.quillLoaded){
                this.http.get("/quill.css", { responseType: 'text' }).subscribe(
                {
                    next: (v) => {
                        quillLink.href = 'quill.css';
                        this.quillLoaded = true;
                    },
                    error: (e) => {
                        this._message.add({ severity: 'error', summary: 'Error', detail: 'An error occurred while loading text editor.' });
                    }
                })
            } else {
                quillLink.href = 'quill.css';
            }
        }
    }
}