import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import templateString from './app.component.html'
import styleString from './app.component.scss';


@Component({
  selector: 'hello-angular',
  template: templateString,
  styles: [ styleString ]
})
export class AppComponent {
  name = 'Angular';

  constructor(private http: HttpClient){}  

  changeName() {
    this.http.get('/hello_angular/name').subscribe(data => {
      this.name = data['name'];
    });    
  }
}
