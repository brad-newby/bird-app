import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OnInit } from '@angular/core';
import { BirdServiceService } from './Services/bird-service.service';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { BirdPrediction } from './Models/bird-prediction';
import { NgFor, NgIf } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import RecordRTC from 'recordrtc';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, NgFor, NgIf, MatInputModule, MatDatepickerModule, MatFormFieldModule, MatProgressSpinnerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'birdApp';
  imageURL = "";
  birdPredictions: (BirdPrediction|undefined)[] = [];
  recording = false;
  record: RecordRTC.StereoAudioRecorder | undefined;
  audioURL: string | undefined;
  tts = false;
  lat: string = "0";
  long: string = "0";  
  day: string = "";
  month: string = "";
  year: string = ""
  analyzing = false;

  constructor(private _birdService: BirdServiceService, private _domSanitizer: DomSanitizer) {}
  
  ngOnInit(): void {
    navigator.geolocation.getCurrentPosition(resp => {
      this.lat = resp.coords.latitude.toString();
      this.long = resp.coords.longitude.toString();
    })
    console.log("Running health check...")
    this._birdService.healthCheck().subscribe(result => {
      console.log(result);
    })
  }

  onUploadClick(event: any) {
    console.log("uploading...")
    console.log(event);
    const file: File = event.target.files[0];
    console.log(file);
    this.getBirds(file);
  }

  onDateChange(newDate: string){
    let temp = newDate.split("/");
    this.month = temp[0];
    this.day = temp[1];
    this.year = temp[2];
  }

  getBirds(blob: Blob) {
    this.analyzing = true;
    if (this.day === "" || this.month === "" || this.year === "") {
      let tempDate = new Date()
      this.day = tempDate.getDay().toString();
      this.month = tempDate.getMonth().toString();
      this.year = tempDate.getFullYear().toString();
    }
    this._birdService.analyzeBird(blob, this.lat, this.long, this.day, this.month, this.year).subscribe({next: (result) => {
      console.log(result);
      this.birdPredictions = result;
      this.birdPredictions = Array.from(new Set(this.birdPredictions.map(a => a!.scientific_name)))
      .map(id => {
        return this.birdPredictions.find(a => a!.scientific_name === id)
      })
      console.log(this.birdPredictions);
      let birdsFound = ""
      if (this.birdPredictions.length){
        birdsFound = "There are: " + this.birdPredictions.length.toString() + " possible results";
      } else {
        birdsFound = "There were no results found. Please try again.";
      }
      const utterance = new SpeechSynthesisUtterance(birdsFound)
      utterance.lang = 'en-US'
      utterance.pitch = 1;
      utterance.rate = 1;
      if (this.tts) {
        window.speechSynthesis.speak(utterance);
      }
      this.birdPredictions.sort((n1,n2) => n2!.confidence - n1!.confidence)
      this.birdPredictions.forEach(bird => {
        this._birdService.getBirdTest(bird!.scientific_name).subscribe({next: (result) => {
          console.log(result);
          const entry = result['entities'][0]
          bird!.imageURL = entry['images'][0];
          const description = "The " + entry['name'] + ", is of the order: " + entry['order'] + ", scientific name: " + entry['sciName'] + ", has a wing span of " + entry['wingspanMin'] + " to " + 
          entry['wingspanMax'] + ", and a status of: " + entry['status'];
          bird!.description = description
        }, error: (err) => {
          console.log(err);
          this.analyzing = false;
        }})
      })
      this.analyzing = false;
    }, error: (err) => {
      console.log(err)
      this.analyzing = false;
    }})
  }

  ttsButton() {
    this.tts = !this.tts;
    if (this.tts) {
      const utterance = new SpeechSynthesisUtterance("Text to speach enabled...")
      utterance.lang = 'en-US'
      utterance.pitch = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    } else {
      const utterance = new SpeechSynthesisUtterance("Text to speach disabled...")
      utterance.lang = 'en-US'
      utterance.pitch = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  sanitize(url: string) {
    return this._domSanitizer.bypassSecurityTrustUrl(url);
    }

  onButtonClick(birdPrediction: BirdPrediction) {
    const utterance = new SpeechSynthesisUtterance(birdPrediction.description)
    utterance.lang = 'en-US'
    utterance.pitch = 1;
    utterance.rate = 1;
    if (this.tts) {
      window.speechSynthesis.speak(utterance);
    }
  }

  startRecording() {
    if (this.tts) {
      const utterance = new SpeechSynthesisUtterance("Now Recording...")
      utterance.lang = 'en-US'
      utterance.pitch = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
    this.recording = true;
    let mediaContraints = {
      video: false,
      audio: true
    };
    navigator.mediaDevices.getUserMedia(mediaContraints).then(this.successCallback.bind(this), )
  }

  successCallback(stream: MediaStream) {
    var options: RecordRTC.Options = {
      mimeType: "audio/wav",
      numberOfAudioChannels: 1,
      sampleRate: 48000,                          // Target sample rate for the output file
      desiredSampRate: 48000 
      };

    var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
    this.record = new StereoAudioRecorder(stream, options);
    this.record.record();
  }

  stopRecording() {
    this.recording = false;
    this.record?.stop(this.processRecording.bind(this));
  }

  processRecording(blob: Blob) {
    if (this.tts) {
      const utterance = new SpeechSynthesisUtterance("Stopped Recording...")
      utterance.lang = 'en-US'
      utterance.pitch = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
    this.getBirds(blob);
    this.record?.clearRecordedData();
  }

  errorCallback(error: any) {
    console.log(error);
  }
}
