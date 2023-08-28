import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { StreamComponent } from './stream.component';
import { OpenViduVideoComponent } from './ov-video.component';

@NgModule({
  declarations: [
    StreamComponent,
    OpenViduVideoComponent
  ],
  exports: [
    StreamComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [StreamComponent]
})
export class StreamModule { }