import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError as observableThrowError } from 'rxjs';
import { OPENVIDU_SERVER_URL, OPENVIDU_SECRET } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class OpenViduService {
    constructor(
        private http: HttpClient
    ) {}

    getToken(mySessionId: string): Promise<string> {
        return this.createSession(mySessionId, OPENVIDU_SERVER_URL, OPENVIDU_SECRET).then((sessionId:any) => {
            return this.createToken(sessionId, OPENVIDU_SERVER_URL, OPENVIDU_SECRET);
        });
    }

    createSession(sessionId:any, openviduServerUrl: string, openviduSecret:string) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify(
                { 
                    "customSessionId": sessionId.toString(),
                    "recordingMode": "MANUAL"
                }
            );

            const options = {
                headers: new HttpHeaders({
                    'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + openviduSecret),
                    'Content-Type': 'application/json',
                }),
            };

            return this.http
                .post<any>(openviduServerUrl + '/openvidu/api/sessions', body, options)
                .pipe(
                    catchError((error) => {
                        console.error('Error', error);
                        error.status === 409 ? resolve(sessionId) : reject(error);
                        return observableThrowError(error);
                    }),
                )
                .subscribe((response) => {
                    console.log(response);
                    resolve(response.id);
                });
        });
    }

    createToken(sessionId: string, openviduServerUrl: string, openviduSecret: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({});
            const options = {
                headers: new HttpHeaders({
                    'Authorization': 'Basic ' + btoa('OPENVIDUAPP:' + openviduSecret),
                    'Content-Type': 'application/json',
                }),
            };

            return this.http
                .post<any>(openviduServerUrl + '/openvidu/api/sessions/' + sessionId + '/connection', body, options)
                .pipe(
                    catchError((error) => {
                        console.error('Error', error);
                        reject(error);
                        return observableThrowError(error);
                    }),
                )
                .subscribe((response) => {
                    console.log(response);
                    resolve(response.token);
                });
        });
    }

    public getRandomAvatar(): string {
        return 'https://openvidu.io/img/logos/openvidu_globe_bg_transp_cropped.png';
    }
}