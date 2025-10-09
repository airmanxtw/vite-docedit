import { LitElement, css, html } from "lit";

export class DivInput extends LitElement {
  static properties = {
    contenteditable: { type: Boolean },
    text: { type: String },    
  };
  // Define scoped styles right with your component, in plain CSS
  static styles = css`
    :host {
      //color: blue;
    }
  `;

  constructor() {
    super();
    // Declare reactive properties
    this.contenteditable = false;
    this.text = "";    
  }

  _handleFocusOut(innerText) {
    this.dispatchEvent(new CustomEvent("focus-out", { detail: { innerText }, bubbles: true, composed: true }));
  }

  _handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  }

  _handleFocusIn(e){
    this.dispatchEvent(new CustomEvent("focus-in", { detail: {  }, bubbles: true, composed: true }));
  }

  // Render the UI as a function of component state
  render() {
    return html`<div
      contenteditable=${this.contenteditable ? "plaintext-only" : "false"}
      style="padding:3px"
      @focusout=${(e) => this._handleFocusOut(e.srcElement.innerHTML)}
      @focusin=${this._handleFocusIn}
      @keydown=${this._handleKeyDown}
    >${this.text}</div>`;
  }
}
customElements.define("div-input", DivInput);
