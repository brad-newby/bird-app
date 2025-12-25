import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BirdPrediction } from '../Models/bird-prediction';

@Injectable({
  providedIn: 'root'
})
export class BirdServiceService {

  constructor(private _httpClient: HttpClient) {}

  baseUrl = "https://bird-app-api-vzcffxirda-uc.a.run.app/"
  //baseUrl = "http://127.0.0.1:5000/"

  getTest(): Observable<any> {
    return this._httpClient.get(this.baseUrl + "bird")
  }

  healthCheck(): Observable<any> {
    return this._httpClient.get(this.baseUrl + "health")
  }

  analyzeBird(audioFile: Blob, lat: string, long: string, day: string, month: string, year: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file',audioFile,"sample.wav");
    formData.append('lat',lat);
    formData.append('long',long);
    formData.append('day', day);
    formData.append('month', month);
    formData.append('year',year);
    console.log(this.baseUrl + "analyze");
    return this._httpClient.post(this.baseUrl + "analyze", formData);
  }

  getBirdTest(name: string): Observable<any> {
    const headers = {
      'API-Key': '6e13ee64-e838-4dcc-b26b-b499b799894f'
    }
    const params = {
      'page': 1,
      'pageSize': 25,
      'sciName': name,
      'hasImg': true
    }
    return this._httpClient.get("https://nuthatch.lastelm.software/v2/birds", { headers: headers, params: params })
  }
}
