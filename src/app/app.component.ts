import { 
  Component, 
  ElementRef, 
  QueryList, 
  ViewChild, 
  ViewChildren 
} from '@angular/core';
import { 
  OpenVidu, 
  Session, 
  Stream, 
  StreamEvent, 
  SignalOptions, 
  StreamManagerEvent, 
  SignalEvent, 
  ConnectionEvent, 
  PublisherSpeakingEvent, 
  RecordingEvent, 
  NetworkQualityLevelChangedEvent, 
  ExceptionEvent } from 'openvidu-browser';
import { UserModel } from './models/user-model';
import { OpenViduService } from './services/openvidu.service';
import { Router } from '@angular/router';

import { OpenViduLayout, OpenViduLayoutOptions } from "./provider/openvidu-layout";
import { StreamComponent } from "./components/stream/stream.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  hasTransmision:boolean = false;
  loading:boolean = true;
  transmissionClosed:boolean = false;

  OV!: OpenVidu;
  @ViewChild("mainStream", { static: false }) mainStream!: ElementRef;
  session!: Session;
  openviduLayout!: OpenViduLayout;
  openviduLayoutOptions!: OpenViduLayoutOptions;
  myUserName!: string;
  mainUserTransmission: any;
  localUser!: UserModel;
  remoteUsers!: UserModel[];
  resizeTimeout:any;

  sessionId:string = "";

  @ViewChildren('streamComponentRemotes') streamComponentRemotes!: QueryList<StreamComponent>;

  constructor(
    public router: Router,
    private openViduSrv: OpenViduService
  ) {}

  initApp() {
    this.hasTransmision = true;
    this.remoteUsers = [];
    this.generateParticipantInfo();
    this.openviduLayout = new OpenViduLayout();
    this.openviduLayoutOptions = {
      maxRatio: 3 / 2, // The narrowest ratio that will be used (default 2x3)
      minRatio: 9 / 16, // The widest ratio that will be used (default 16x9)
      fixedRatio: false, // If this is true then the aspect ratio of the video is maintained and minRatio and maxRatio are ignored (default false)
      bigClass: "OV_big", // The class to add to elements that should be sized bigger
      bigPercentage: 0.82, // The maximum percentage of space the big ones should take up
      bigFixedRatio: false, // fixedRatio for the big ones
      bigMaxRatio: 3 / 2, // The narrowest ratio to use for the big elements (default 2x3)
      bigMinRatio: 9 / 16, // The widest ratio to use for the big elements (default 16x9)
      bigFirst: false, // Whether to place the big one in the top left (true) or bottom right
      animate: false, // Whether you want to animate the transitions
    };
    this.openviduLayout.initLayoutContainer(
      document.getElementById("layout"),
      this.openviduLayoutOptions
    );

    this.joinToSession();
  }

  joinToSession() {
    this.OV = new OpenVidu();
    this.session = this.OV.initSession();
    this.subscribeToUserChanged();
    this.subscribeToStreamCreated();
    this.subscribedToStreamDestroyed();
    this.connectToSession();
  }

  async exitSession() {
    if (this.session) {
      this.session.disconnect();
    }
    this.remoteUsers = [];
  }

  private generateParticipantInfo() {
    this.myUserName = `OneMind/${Math.floor(Math.random() * 100)}$dashboard`;
  }

  private deleteRemoteStream(stream: Stream): void {
    const userStream = this.remoteUsers.filter(
      (user: UserModel) => user.getStreamManager().stream === stream
    )[0];

    const index = this.remoteUsers.indexOf(userStream, 0);
    if (index > -1) {
      this.remoteUsers.splice(index, 1);
    }
  }

  private subscribeToUserChanged() {
    this.session.on("signal:userChanged", (event: any) => {
      const data = JSON.parse(event.data);
      this.remoteUsers.forEach((user: UserModel) => {
        if (user.getConnectionId() === event.from.connectionId) {
          if (data.avatar !== undefined) {
            user.setUserAvatar(data.avatar);
          }
        }
      });
    });
  }

  private subscribeToStreamCreated() {
    this.session.on("streamCreated", (event: StreamEvent | SignalEvent | ConnectionEvent | PublisherSpeakingEvent | RecordingEvent | NetworkQualityLevelChangedEvent | ExceptionEvent) => {
      /*let data = JSON.parse(event.stream.connection.data);
      if(data.main){
        this.mainUserTransmission = data.clientData;
      }*/
      if (this.remoteUsers.length == 0 /*&& data.main*/) {
        this.loading = false;
        //@ts-ignore
        const subscriber = this.session.subscribe(event.stream, undefined);
        //@ts-ignore
        subscriber.on("streamPlaying", (e: StreamManagerEvent) => {

        });
        const newUser = new UserModel();
        newUser.setStreamManager(subscriber);
        //@ts-ignore
        newUser.setConnectionId(event.stream.connection.connectionId);
        //@ts-ignore
        const nickname = event.stream.connection.data.split("%")[0];
        try {
          newUser.setNickname(JSON.parse(nickname).clientData);
        } catch (err) {
          newUser.setNickname(nickname);
        }
        newUser.setType("remote");
        newUser.setUserAvatar(this.openViduSrv.getRandomAvatar());
        this.remoteUsers.push(newUser);
        this.sendSignalUserAvatar(this.localUser);
      }
    });
  }

  private subscribedToStreamDestroyed() {
    //@ts-ignore
    this.session.on("streamDestroyed", async (event: StreamEvent) => {
      let target = JSON.parse(event.stream.connection.data);
      if(this.myUserName == target.clientData || target.main){
        this.deleteRemoteStream(event.stream);
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
        }, 20);
        event.preventDefault();

        if(target.main && event.reason == "disconnect"){
          this.transmissionClosed = true;
          this.hasTransmision = false;
          setTimeout(() => {
            close();
          }, 5000)
        }
      }
    });
  }

  private sendSignalUserAvatar(user: UserModel): void {
    const data = {
      avatar: 'https://openvidu.io/img/logos/openvidu_globe_bg_transp_cropped.png',
      platformIsMobile: false
    };
    const signalOptions: SignalOptions = {
      data: JSON.stringify(data),
      type: "userChanged",
    };
    this.session.signal(signalOptions);
  }

  private connectToSession(): void {
    this.openViduSrv
      .getToken(this.sessionId)
      .then((token) => {

        this.connect(token);
      })
      .catch((error) => {
        console.error(
          "There was an error getting the token:",
          error.code,
          error.message
        );
      });
  }

  private connect(token: string): void {
    this.session
      .connect(token, { 
        clientData: this.myUserName,
        main: false
      })
      .then(() => {})
      .catch((error) => {
        console.error("Error", error);
      });
  }
}
