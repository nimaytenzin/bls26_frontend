import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
// This code bootstraps the Angular application by loading the AppModule.
// The platformBrowserDynamic function is used to compile and launch the application in the browser.