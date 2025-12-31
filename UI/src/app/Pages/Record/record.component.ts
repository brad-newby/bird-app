import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { BirdServiceService } from '../../Services/bird-service.service';
import { BirdPrediction } from '../../Models/bird-prediction';
import { DomSanitizer } from '@angular/platform-browser';
import RecordRTC from 'recordrtc';

@Component({
  selector: 'app-record',
  templateUrl: './record.component.html',
  styleUrl: '../../app.component.scss',
  standalone: false,
})
export class RecordComponent implements OnInit {
  imageURL = "";
  birdPredictions: (BirdPrediction|undefined)[] = [];
  recording = false;
  record: RecordRTC.StereoAudioRecorder | undefined;
  audioURL: string = "";
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
  }

  onUploadClick(event: any) {
    console.log("uploading...")
    const file: File = event.target.files[0];
    this.getBirds(file);
    this.audioURL = URL.createObjectURL(file);
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
      window.speechSynthesis.speak(utterance);
      if (this.birdPredictions.length > 0) {
        this.birdPredictions.sort((n1,n2) => Number(n2!.confidence) - Number(n1!.confidence))
        this.birdPredictions.forEach((bird,index) => {
          this._birdService.getBirdTest(bird!.scientific_name).subscribe({next: (result) => {
            console.log(result);
            const entry = result['entities'][0]
            this.birdPredictions[index]!.imageURL = entry['images'][0];
            const description = "The " + entry['name'] + ", is of the order: " + entry['order'] + ", scientific name: " + entry['sciName'] + ", has a wing span of " + entry['wingspanMin'] + " centimeters to " + 
            entry['wingspanMax'] + " centimeters, and a status of: " + entry['status'];
            this.birdPredictions[index]!.description = description;
            this.birdPredictions[index]!.confidence = bird!.confidence.toString();
            this.birdPredictions[index]!.end_time = bird!.end_time.toString();
            this.birdPredictions[index]!.start_time = bird!.start_time.toString();
          }, error: (err) => {
            console.log(err);
            this.analyzing = false;
          }}).add(() => {
            this._birdService.savePrediction(this.birdPredictions as BirdPrediction[],blob).subscribe({next: (result) => {
              console.log(result);
              this.analyzing = false;
            }, error: (err) => {
              console.log(err);
              this.analyzing = false;
            }});
          })
        })
      }
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
    this.audioURL = URL.createObjectURL(blob);
  }

  errorCallback(error: any) {
    console.log(error);
  }
}
