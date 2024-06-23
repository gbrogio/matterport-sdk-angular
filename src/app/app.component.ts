import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { setupSdk, MpSdk } from '@matterport/sdk';
import { MatterPortIcons } from '../types/matter-port-icons';
import { hexToRgbPercent } from '../utils/hex-to-rgb';

type CreateTag = {
  position: MpSdk.Vector3;
  color?: `#${string}`;
  html?: string;
  title?: string;
  description?: string;
  offset?: Partial<MpSdk.Vector3>;
  opacity?: number;
  enableLine?: boolean;
  icon?: MatterPortIcons;
};

const HTML_UTILS = {
  rootStyles: `
    * {
      margin: 0;
      border: 0;
      box-sizing: border-box;
    }
    body {
      color: white;
      font-family: sans-serif;
      background-color: #222;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding-bottom: 1rem;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
  `
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
})
export class AppComponent implements AfterViewInit {
  @ViewChild('iframe', { static: false })
  iframeRef!: ElementRef<HTMLIFrameElement>;

  @ViewChild('button', { static: false })
  buttonRef!: ElementRef<HTMLButtonElement>;

  @ViewChild('text', { static: false })
  textRef!: ElementRef<HTMLDivElement>;

  private sdk: MpSdk | null = null;

  private async createTag({
    color,
    html,
    offset,
    opacity,
    position,
    enableLine = true,
    title,
    description,
    icon,
  }: CreateTag) {
    if (!this.sdk) throw Error('MatterPort SDK need be initialize!');

    const id = (
      new Date().getTime() + Math.floor(Math.random() * 1000)
    ).toString();
    const htmlID = html ? [(await this.sdk.Tag.registerSandbox(html))[0]] : [];

    this.sdk.Tag.add({
      id,
      description,
      label: title,
      anchorPosition: position,
      attachments: htmlID,
      stemVector: {
        x: offset?.x ?? 0,
        y: offset?.y ?? 0.3, // 0.30 meters
        z: offset?.z ?? 0,
      },
      opacity,
      color: hexToRgbPercent(color || '#000'),
      stemVisible: enableLine,
      iconId: icon,
    });

    return id;
  }

  private pointToString(point: MpSdk.Vector3) {
    var x = point.x.toFixed(3);
    var y = point.y.toFixed(3);
    var z = point.z.toFixed(3);

    return `{ x: ${x}, y: ${y}, z: ${z} }`;
  }

  async ngAfterViewInit() {
    this.sdk = await setupSdk('<MATTER_PORT_SDK_KEY>', {
      iframe: this.iframeRef.nativeElement,
    });

    await Promise.all([
      this.createTag({
        html: `
          <style>
            ${HTML_UTILS.rootStyles}
            .image-test {
              width: 100%;
              height: 64px;
              object-fit: cover;
              object-position: center -30px;
            }
            p { opacity: 0.6; }
          </style>
          <img src="<image-url>" class="image-test">
          <h1>Image Test</h1>
          <p>Test with image.</p>
        `,
        position: { x: -12.259, y: -0.008, z: 1.036 },
        offset: {
          y: 1.4,
        },
        icon: 'public_symbols_image',
        color: '#5f5bf9',
      }),
      this.createTag({
        html: `
          <style>
            ${HTML_UTILS.rootStyles}
            p { opacity: 0.6; }
          </style>
          <h1>Test 1</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        `,
        position: { x: -9.267, y: 0.756, z: 0.959 },
        color: '#5f5bf9',
      }),
      this.createTag({
        title: 'Test 2',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        position: { x: -2.558, y: 1.591, z: 3.876 },
        offset: { y: 0, z: -0.2 },
        color: '#5f5bf9',
        icon: 'public_buildings_apartment',
      }),
      this.createTag({
        position: { x: -4.95, y: 3.798, z: -0.263 },
        title: 'Test 3',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      }),
      this.createTag({
        html: `
          <style>
            ${HTML_UTILS.rootStyles}
            p { opacity: 0.6; }
          </style>
          <h1>Test 4</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        `,
        position: { x: -11.433, y: 4.129, z: 1.529 },
      }),
    ]);


    let poseCache: MpSdk.Camera.Pose;
    this.sdk?.Camera.pose.subscribe((pose) => {
      poseCache = pose;
    });

    let intersectionCache: MpSdk.Pointer.Intersection & { time: number };
    this.sdk?.Pointer.intersection.subscribe((intersection) => {
      intersectionCache = {
        ...intersection,
        time: new Date().getTime(),
      };
      this.buttonRef.nativeElement.style.display = "none";
      buttonDisplayed = false;
    });

    var delayBeforeShow = 1000;
    var buttonDisplayed = false;
    setInterval(() => {
      if (!intersectionCache || !poseCache) {
        return;
      }

      const nextShow = intersectionCache.time + delayBeforeShow;
      if (new Date().getTime() > nextShow) {
        if (buttonDisplayed) {
          return;
        }

        const size = {
          w: this.iframeRef.nativeElement.clientWidth,
          h: this.iframeRef.nativeElement.clientHeight,
        };
        const coord = this.sdk!.Conversion.worldToScreen(
          intersectionCache.position,
          poseCache,
          size
        );
        this.buttonRef.nativeElement.style.left = `${coord.x - 30}px`;
        this.buttonRef.nativeElement.style.top = `${coord.y - 30}px`;
        this.buttonRef.nativeElement.style.display = "flex";
        buttonDisplayed = true;
      }
    }, 16);

    this.buttonRef.nativeElement.addEventListener("click", () => {
      this.textRef.nativeElement.innerHTML = `position: ${this.pointToString(
        intersectionCache.position
      )}\nnormal: ${this.pointToString(intersectionCache.normal)}\nfloorId: ${
        intersectionCache.floorId
      }`;
      this.buttonRef.nativeElement.style.display = "none";
      this.iframeRef.nativeElement.focus();
    });
  }
}
