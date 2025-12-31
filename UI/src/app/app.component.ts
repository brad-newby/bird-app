import { Component } from '@angular/core';
import { Router}  from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent {
  routerSubscription: Subscription|undefined = undefined;

  constructor(private router: Router) {}

  ngOnInit() {
  }
}