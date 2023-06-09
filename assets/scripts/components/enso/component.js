
import EnsoStylesheet from "./templates/stylesheets.js";
import EnsoTemplate from "./templates/templates.js";

import { parser } from "./templates/parsers.js";
import { runEffect } from "./utils/effects.js";
import { defineWatchedProperty, createComponent } from "./utils/properties.js";

/**
 * Enso Web Component base class
 * @abstract
 */
export default class Enso extends HTMLElement {

    /**
     * Defines a new Enso component and registers it in the browser as a custom element.
     * @param {String} tag                            - DOM tag name for this component
     * @param {Object} props                          - Component properties
     *  @param {String|EnsoTemplate} props.template   - Template defining component HTML
     *  @param {String|EnsoStylesheet} [props.styles] - (Optional) Adoptable Style sheet
     *  @param {Object} [props.properties]            - (optional) This component's properties
     *  @param {Boolean} [props.useShadow=true]       - (Optional) Should the component use shadow dom 
     *  @param {Object} [props.component]             - (Optional) Custom component code implementation
     * @static
     */
    static component(tag, 
        {template, styles=null, properties={}, useShadow=true, component=null}) {

        component = createComponent(this, component);

        // Create observed properties
        const attributes = [];
        for (const prop in properties) {
            properties[prop] = defineWatchedProperty(component, prop, properties[prop]);
            if (properties[prop].attribute) attributes.push(prop);
        }
        
        if (typeof template === 'string') template = new EnsoTemplate(template);
        if (typeof styles === 'string') styles = new EnsoStylesheet(styles);

        // Type properties
        Object.defineProperty(component, 'observedAttributes', {
            get() { return attributes; }
        });
        Object.defineProperties(component.prototype, {
            'observedAttributes': { get() { return attributes; } },
            'properties': { get() { return properties; } },
            'useShadow': { get() { return useShadow; } },
            'template': { get() { return template; } },
            'styles': { get() { return styles; } },
        });

        // Define the custom element
        customElements.define(tag, component);
    }
    
    #intialised = false;
    // Root element -> either this, or shadowroot
    #root = null;
    // Reactivity properties
    #bindings = new Map();
    #refs = {};

    constructor() {
        super();

        for (const prop in this.properties) {
            this.#bindings.set(prop, { changed: false, effects: [] });
        }

        this.update = this.update.bind(this);

        this.#root = this.useShadow ? 
            this.shadowRoot ?? this.attachShadow({mode:'open'}) : this;
    }

    get refs() { return this.#refs; }

    getBinding(bind) { return this.#bindings.get(bind); }

    markChanged(prop) {
        const bind = this.#bindings.get(prop);
        if (bind) {
            bind.changed = true;
        }
    }

    /**
     * Called after the component has been mounted and started on the page.
     * @abstract
     */
    onStart() {}

    /**
     * Called after a property value changes.
     * @param {String} prop - String name of the property
     * @param {*} value - The new property value
     * @abstract
     */
    onPropertyChange() {}

    /**
     * Called before the component is removed from the page. Component cleanup
     * should be done here.
     * @abstract
     */
    onRemoved() {}


    //
    // Web Component API
    //
    connectedCallback() {
        if (this.#intialised) return;

        // Loops through all properties defined as attributes and sets 
        // their initial value if they're forced.
        const attributes = this.observedAttributes;
        for (const attr of attributes) {
            if (this.properties[attr].attribute.force) {
                this.reflectAttribute(attr);
            }
        }

        // Parse and attach template
        const DOM = this.template.clone();
        const watched = this.template.watchedNodes;
        const elements = parser.getElements(DOM);

        for (const element of elements) {
            const idx = parser.getNodeIndex(element);
            parser.process(watched[idx], this, element);
        }
        // Attach to the dom on the next update
        requestAnimationFrame( () => this.#root.append(DOM) );

        if (this.styles) {
            this.styles.adopt(this.#root);
        }

        this.#intialised = true;
        this.onStart();

        requestAnimationFrame(this.update);
    }

    disconnectedCallback() {
        this.onRemoved();
    }
      
    // adoptedCallback() {}

    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) return;

        const val = this.properties[property].attribute.toProp(newValue);
        if (this[property] !== val) this[property] = val;
    }

    reflectAttribute(attribute) {
        // We don't care about unobserved attributes
        if (attribute in this.observedAttributes) return;

        const attr = this.properties[attribute];
        const value = attr.attribute.toAttr(this[attribute]);
        
        if (value !== this.getAttribute(attribute)) {
            if (value === null) this.removeAttribute(attribute);
            else this.setAttribute(attribute, value);
        }
    }

    update() {

        for (const bind of this.#bindings.values()) {
            if (bind.changed) {
                for (const effect of bind.effects) {
                    runEffect(effect.action, this, effect.element);
                }
                bind.changed = false;
            }
        }

        requestAnimationFrame(this.update);
    }
}
