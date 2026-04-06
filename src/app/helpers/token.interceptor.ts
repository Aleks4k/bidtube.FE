import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private _message: MessageService,
    private _auth: AuthService
  ) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this._auth.getAccessToken();
    let clonedRequest = req;
    if (token) {
      clonedRequest = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }
    return next.handle(clonedRequest).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 0) {
            this._message.add({ severity: 'error', summary: 'Error', detail: 'Could not connect with server. Check your internet connection.' });
          } else if (error.status === 401) {
            return this.refreshAccessToken(req, next);
          }
        }
        return throwError(() => new HttpErrorResponse({
          error: error.error,
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        }));
      })
    );
  }
  private refreshAccessToken(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this._auth.refreshAccessToken().pipe(
      switchMap((response: any) => {
        const updatedRequest = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${response.access}`)
        });
        return next.handle(updatedRequest);
      })
    );
  }
}