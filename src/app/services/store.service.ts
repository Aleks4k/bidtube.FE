import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StoreService {
    private subjects = new Map<string, BehaviorSubject<any>>();
    select<T>(key: string, defaultValue?: T): Observable<T> {
        if (!this.subjects.has(key)) {
            this.subjects.set(key, new BehaviorSubject<T>(defaultValue as T));
        }
        return this.subjects.get(key)!.asObservable();
    }
    set<T>(key: string, value: T): void {
        if (!this.subjects.has(key)) {
            this.subjects.set(key, new BehaviorSubject<T>(value));
        } else {
            this.subjects.get(key)!.next(value);
        }
    }
    getValue<T>(key: string): T | undefined {
        return this.subjects.get(key)?.getValue();
    }
}