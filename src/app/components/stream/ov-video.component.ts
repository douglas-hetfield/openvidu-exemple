import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { StreamManager, StreamPropertyChangedEvent } from 'openvidu-browser';

@Component({
    selector: 'ov-video',
    template: `
        <video #videoElement [id]="'video-' + _streamManager.stream.streamId" [muted]="mutedSound"></video>
    `,
    styleUrls: ['./stream.component.scss'],
})
export class OpenViduVideoComponent implements AfterViewInit {

    @ViewChild('videoElement', {static: false}) elementRef!: ElementRef;

    @Input() mutedSound!: boolean;
    @Input() isBackCamera!: boolean;

    _streamManager!: StreamManager;

    constructor() {}

    ngAfterViewInit() {
        this.updateVideoView();
    }

    @Input()
    set streamManager(streamManager: StreamManager) {
        this._streamManager = streamManager;
        if (!!this.elementRef) {
            this._streamManager.addVideoElement(this.elementRef.nativeElement);
        }
    }

    private updateVideoView() {
        this._streamManager.addVideoElement(this.elementRef.nativeElement);
    }

    public applyIosIonicVideoAttributes() {
        this.elementRef.nativeElement.style.width = '100% !important';
        this.elementRef.nativeElement.style.zIndex = '-1';
        if (!this._streamManager.remote && !this.isBackCamera) {
            // It is a Publisher video. Custom iosrtc plugin mirror video
            this.elementRef.nativeElement.style.transform = 'scaleX(-1)';
        }
    }

}