
import Enso, { css, html } from "enso";


const faces = [
    {label: 'front', width: '--width', height: '--height', transform: 'rotateY(0deg) translateZ(calc(var(--depth) / 2))'},
    {label: 'back', width: '--width', height: '--height', transform: 'rotateY(180deg) translateZ(calc(var(--depth) / 2))'},
    {label: 'left', width: '--depth', height: '--height', transform: 'rotateY(-90deg) translateZ(calc(var(--width) / 2))'},
    {label: 'right', width: '--depth', height: '--height', transform: 'rotateY(90deg) translateZ(calc(var(--width) / 2))'},
    {label: 'top', width: '--width', height: '--depth', transform: 'rotateX(90deg) translateZ(calc(var(--height) / 2))'},
    {label: 'bottom', width: '--width', height: '--depth', transform: 'rotateX(-90deg) translateZ(calc(var(--height) / 2))'}
];

Enso.component(

    'enso-cuboid', {
  
    properties: {
        width: {attribute: true},
        height: {attribute: true},
        depth: {attribute: true}
    },

    styles: css`
        :host {
            display: block;
            width: var(--width);
            height: var(--height);
            transform-style: preserve-3d;
        }
        #faces {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
        }
        .face {
            position: absolute;
            left: 50%; top: 50%;
        }
        ${faces.map(e => (
            `#${e.label} {
                width: var(${e.width});
                height: var(${e.height});
                transform: translate(-50%,-50%) ${e.transform};
            }`
        )).join('\n')}`,

    template: html`
        <div id="faces">
            ${faces.map(e => 
                `<div id=${e.label} part="face" class="face">
                    <slot name=${e.label}></slot>
                </div>`).join('\n')
            }
        </div>`,

    component: {
        onPropertyChange(prop, value) {
            this.style.setProperty(`--${prop}`, value);
        }
    },

});