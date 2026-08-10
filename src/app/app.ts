import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopProgressBar } from "@shared/ui/top-progress-bar/top-progress-bar";
import { ToastContainer } from "@shared/ui/toast-container/toast-container";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopProgressBar, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
