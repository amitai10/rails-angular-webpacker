# Angular 2+ with Rails and Webpacker

I love Rails, I think it’s the best web development platform, at least from a developer point of view (DX).  
But it is not perfect. One of its major disadvantages is when you try to use it with one of  new modern JavaScript framework (React, Angular, Vue…).  
There is no “Rails” way to do it. You need to start messing with configurations and settings, all the things that Rails trying to avoid.
Writing a web application in Rails traditional way would be using ActiveViews, and add a little JQuery when you need JavaScript in the client. But when You want to write a single page application (SPA), it’s just not good enough.

In this blog post I will explain how to create a SPA application with Rails and Angular 2+. I will do it with the new [Webpacker](https://github.com/Rails/webpacker) gem.
Because I use bleeding edge technologies, it may improve and become more smooth in the future, so stay tuned.

## First some history

The firsts Rails versions didn’t have any unique feature for running JavaScript in the browser. When JavaScript had become a key player in web development, Rails introduced the “Asset pipeline”.  
The asset pipeline through the ‘sprockets-rails’ gem provides a framework to concatenate and minify or compress JavaScript and CSS assets. It enabled using a lot of JavaScript files much easier. For instance, to creating an Rails + Angular1 SPA.  
But the JavaScript world had evolved and minifying and concentrate JavaScript files is not enough.   
In order to use features of ES6+ or TypeScript we need to use a compiler (or transpiler). The same goes for features like hot reloading and more. The Asset Pipeline could not provide it (although there are efforts to enable it).  
There are few ways that I can use Rails with modern JavaScript library (React, Angular2+, Vue):
- Run Rails as API, and call it from JavaScript files that is serving from different place. The biggest disadvantage is that it is not served from the same server. The deployment is harder. I cannot use Rails session for CSRF, I cannot use Devise out of the box, I cannot add Rails variables to my page and so on.
- The second option is to use  to build the JavaScript artifacts (using Angular-cli, or webpack), and put it in the Rails public folder. This way I can serve the JavaScript through the same server. It can work but it is not convenient, because I lose features like hot reloading,
- Luckily there is a third option. Use Railes official gem [Webpacker](https://github.com/Rails/webpacker).


## Webpacker

Webpacker makes it easy to use the JavaScript pre-processor and bundler webpack 3.x.x+ to manage application-like JavaScript in Rails. It coexists with the asset pipeline, as the primary purpose for webpack is app-like JavaScript, not images, CSS, or even JavaScript Sprinkles (that all continues to live in app/assets).
However, it is possible to use Webpacker for CSS, images and fonts assets as well, in which case you may not even need the asset pipeline. This is mostly relevant when exclusively using component-based JavaScript frameworks.

### A word about webpack
Webpack is a module bundler for modern JavaScript applications. Webpack builds a dependency graph that includes every module your application needs, then packages all of those modules into one or more bundles.   
Webpack allows use of loaders and plugins for processing and building the files. 
Webpack is the most popular utility today for this purpose.

## Rails with Angular 2+
Although webpacker let you use several JavaScript libraries, I decided to demonstrate Angular 2+ because there is not a lot of material on this subject. React has some proven solutions (such as react-Rails gem).  

After the release of Angular 2+, there was a lot of disappointment in the Angular community (due to the major change)  and many migrated to React. I feel that lately there is a drifting back to angular, and I find it myself quite attractive.

# A step by step tutorial for your first Rails-Angular-Webpacker application
We will start by creating a new Rails application with Webpacker and angular. You can do it for React/Vue/Elm as well, and you can add it also to an existing application.
There are few prerequisites that needs to be installed before:
- Ruby 2.2.6+
- Rails 5+
- Node
- Yarn 
- Webpack
```
Rails new webpacker-angular-app --webpack=angular
```
Let's enter the created code and go over the created files and folders:  
The angular code is placed in *app/javascript* which is a new subfolder in the app folder (in addition to app/asset/javascript).
In *app/javascript* there are two subfolders:
- packs - contains the modules entry points (this folder can be configured). Webpack will treat these files as entry point, and the result will be bundling the modules.  
- Hello_angular - an example module (or angular app). Contains the angular code.

The webpacker configuration is placed in the config folder:
- Webpacker.yml - a config file for webpacker
- config/webpack - webpack configuration files
	
## Improve the hello_angular app
The generated code comes with a sample application called hello_angular, I'll expand and explain how to work with it. The common scenario will be creating one or more apps like this for every application.  
I will start by creating a page that contains the angular application. I will create a controller and a view and place the angular inside:
```
Rails g controller hello_angular index
``` 
Now I will add hello_angular to the view app/views/hello_angular/index.html.erb
```html
<div>
 <hello-angular></hello-angular>
</div>
<%= javascript_pack_tag 'hello_angular' %>
```
_hello-angular_ is the component name.   
_javascript_pack_tag_ will pull in the compiled hello_angular module script and reference it in the application.
I will make this page the root of the application, and check if it works:
config/routes.rb :
```ruby
Rails.application.routes.draw do
  root 'hello_angular#index'
  get 'hello_angular/index'
end
```
In order to run the server we have to run the server:
```
Rails s
```
And run webpack (in a different tab - I will show how to run them together later)
```
./bin/webpack-dev-server
```
Oops, it is not working…   
We need to hack the configuration a bit for it to work. We need to tell webpack what to do with the “@angular/core” symbol. In order to do it we will need to use ContextReplacementPlugin. The way to add plugins or loaders to webpacker is to use a custom configuration file.
We will create a new file *config/webpack/custom.js*
```js
const webpack = require('webpack')
const path = require('path')
module.exports = {
  plugins: [
      new webpack.ContextReplacementPlugin(
        /angular(\\|\/)core/,
        root('../../app/javascript/hello_angular'), // location of your src
        { }
      )
  ]
}
function root(__path) {
  return path.join(__dirname, __path);
}
```
We can read more about it in [here](https://webpack.js.org/plugins/context-replacement-plugin/)

Then we will add it to the environment (for example to config/webpack/development.js)
```js
const environment = require('./environment')
const merge = require('webpack-merge')
const customConfig = require('./custom')

module.exports = merge(environment.toWebpackConfig(), customConfig)
```
You can read more about it [here](https://github.com/Rails/webpacker/blob/master/docs/webpack.md)

In addition we need to install the ‘webpack-merge’ library
```
npm i -D webpack-merge
```
Let’s try again, now it is working!  
Navigate to http://localhost:3000 And you will see the hello_angular app.

## Using a different file for html
One of the things that I like in angular 2+ components is the division of code (ts file), html and style (scss in our example) to different files.

I will start with taking out the template from the app.component.ts, into an html file.      
First we will write our html file app/javascript/hello_angular/app/app.component.html
```html
<h1>Hello {{name}}</h1>
```
There are couple of things that we need to do in order to allow it. The first is to add html loader to webpack so it will know what to do with the html file. I will do it in config/webpack/environment.js :
```js
const { environment } = require('@Rails/webpacker')

environment.loaders.set('html', {
  test: /\.html$/,
  exclude: /node_modules/,
  loaders: ['html-loader'] 
})

module.exports = environment
```
And install the loader:
```
npm i -D html-loader
```

As you can see, webpacker lets you add loaders to the configuration without defining a custom module and merge. More details can be found [here](https://github.com/Rails/webpacker/blob/master/docs/webpack.md).  
To complete this I will add html extension to webpacker.yml:
```
- .html
```
Second, we need to require this file in order that we can use it. It is not so simple in TypeScript. First we need to declare it as module (of type ‘html’) and then import it and use it.  
I will add a declaration file app/javascript/hello_angular/html.d.ts :
```ts
declare module "*.html" {
  const content: string
  export default content
}
```
And then I will change app/javascript/hello_angular/app/app.component.ts:
```ts
import { Component } thing in order from '@angular/core';
import templateString from './app.component.html'

@Component({
  selector: 'hello-angular',
  template: templateString,
})
export class AppComponent {
  name = 'Angular';
}
```
You can read more about it [here](https://www.typescriptlang.org/docs/handbook/modules.html).  
Notice that unlike the Angular-cli, here I’m using “template” instead of “templateUrl”, and serve it as a string.

## Using a different file for style
I will do a pretty similar things for the style form. I’ll start by creating a scss file, 
app.component.scss:
```css
h1 {
  color: red;
}
```
I’ll add a module declaration for scss and webpack loders:
app/javascript/hello_angular/scss.d.ts:
```ts
declare module "*.scss" {
  const content: string
  export default content
}
```
Add the loaders to config/webpack/environment.js:
```js
const { environment } = require('@Rails/webpacker')

environment.loaders.set('html', {
  test: /\.html$/,
  exclude: /node_modules/,
  loaders: ['html-loader'] 
})

environment.loaders.set('style', {
  test: /\.(scss|sass|css)$/,
  use: [{
      loader: "to-string-loader"
  }, {
      loader: "css-loader"
  }, {
      loader: "resolve-url-loader"
  }, {
      loader: "sass-loader"
  }]
})
module.exports = environment
```
Install them:
```
npm i -D to-string-loader css-loader resolve-url-loader sass-loader
```
Import the scss file and use it in app.component.ts:
```ts
import { Component } from '@angular/core';
import templateString from './app.component.html'
import styleString from './app.component.scss';


@Component({
  selector: 'hello-angular',
  template: templateString,
  styles: [ styleString ]
})
export class AppComponent {
  name = 'Angular';
}
```
Again, I use “styles” instead of “styleUrl”.
And we have a style!
## Adding a server call
Now I’ll add a server call so we will see tht there is no need for url specification, angular will call its server.  
I’ll start by adding an endpoint to my Rails controller that returns a new name:
app/controllers/hello_angular_controller.rb:
```ruby
class HelloAngularController < ApplicationController
  def index; end

  def name
    name = %w[Jack Smith Sara Linda Josh Amitai].sample
    render json: { name: name }
  end
end
```
Add to routes.rb:
```ruby
Rails.application.routes.draw do
  root 'hello_angular#index'
  get 'hello_angular/index'
  get 'hello_angular/name'
end
```
Then I’ll add HttpClient to angular, call it from a button, and replace the name.
App.module.ts:
```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {HttpClientModule} from '@angular/common/http';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
App.component.html:
```html
<h1>Hello {{name}}</h1>
<button (click)="changeName()">Change Name!</button>
```
App.component.ts:
```ts
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
```
That’s all!
## Running all together in one command:
Create a Procfile.dev file:
```
web: bundle exec Rails s
webpacker: ./bin/webpack-dev-server
```
Add forman to Gemfile:
```
gem 'foreman'
```
And then you can run the command:
```
bundle exec foreman start -f Procfile.dev
```
The server address is http://localhost:5000

## deploying to heroku
remove 'sqlite3' gem and add 'pg' gem in the Gemfile:
```
gem ‘pg’
```
Create a new app in Heroku, provide a postgresql and push. Heroku will build webpack and run it.

## Conclusion
The JavaScript development has changed in the last few years. We need utilities like webpack for using modern framework like React and Angular.  
Until the introduction of webpacker, Rails didn’t have a clear way of how to combine them. Now we can use them together and enjoy developing in Rails and modern JavaScript framework.  
It is not smooth yet, and there are still some wiring and configuration that need to be done in order to make it work. I hope that it will be fixed, so it would not be necessary in the future.  

You can find all the code in https://github.com/amitai10/rails-angular-webpacker

Happy coding!

## References
- https://github.com/Rails/webpacker
- https://medium.com/statuscode/introducing-webpacker-7136d66cddfb


