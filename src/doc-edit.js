import { LitElement, css, html, unsafeCSS } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { when } from "lit/directives/when.js";
import { List } from "immutable";
import { api } from "./api/api.js";
import { convert } from "html-to-text";
import { docstyle } from "./style/docstyle.js";
import { docItemNums } from "./api/docItemNums.js";
import { classMap } from "lit/directives/class-map.js";
import { DivInput } from "./components/div-input.js";
import * as R from "ramda";
const { pipe, ifElse, isEmpty, identity, indexOf } = R;

const { hello, getPath, deleteItem, updateContent, insertItem } = api();
export class DocEditor extends LitElement {
  static properties = {
    source: { type: Array },
    maxDegree: { type: Number },
    maxItems: { type: Number },
    contenteditable: { type: Boolean },
    _degree: { type: Number, state: true },
    _index: { type: Number, state: true },
    _paths: { type: Array, state: true },
  };

  // Define scoped styles right with your component, in plain CSS
  static styles = [
    docstyle,
    css`
      :host {
        display: block;
        padding: 1rem;
        //border: 2px solid #007acc;
        border-radius: 8px;
        background: #f9f9f9;
        margin: 1rem 0;
      }

      .content-item {
        padding: 0.5rem;
        /* padding: 0.5rem;
      margin: 0.25rem 0;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); */
      }

      .hidden {
        display: none;
      }

      button {
        font-size: xx-small;
        background-color: lightblue;
        border-style: none;
      }
    `,
  ];

  constructor() {
    super();
    // Declare reactive properties
    this.source = [];
    this.maxDegree = 6;
    this.maxItems = 30;
    this.contenteditable = false;
    this._degree = -1;
    this._index = -1;
    this._paths = [];
  }

  // Render the UI as a function of component state
  render() {
    return html`
      <ol>
        ${this.source.map((item, index) => html`${this._generateContent(item, [], 0, index)}`)}
      </ol>
    `;
  }

  _handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  }

  _handleFocusIn(e, currentPaths, currentDegree, currentIndex) {
    //e.srcElement.parentElement.querySelector(".command").classList.remove("hidden");
    this._degree = currentDegree;
    this._index = currentIndex;    
    this._paths = [...currentPaths];
  }

  //刪除項目
  _deleteItem(path) {
    pipe(deleteItem(this.source), (result) =>
      this.dispatchEvent(new CustomEvent("change-item", { detail: { result }, bubbles: true, composed: true }))
    )(path);
  }

  //更新項目內容
  _updateContent(innerHTML, path) {
    pipe(updateContent(this.source)(innerHTML), (result) =>
      this.dispatchEvent(new CustomEvent("change-item", { detail: { result }, bubbles: true, composed: true }))
    )([...path, "text"]);
  }

  //新增上方項目
  _insertItem(path, shift) {
    pipe(
      (p) => {
        this._index += shift === 0 ? 1 : 0;
        return p;
      },
      insertItem(this.source)(shift),
      (result) =>
        this.dispatchEvent(new CustomEvent("change-item", { detail: { result }, bubbles: true, composed: true }))
    )(path);
  }

  //新增子項目
  _appendItem(path) {
    pipe(
      (p) => List(this.source).setIn([...p, "items"], [{ text: "新分項" }]),
      (result) =>
        this.dispatchEvent(new CustomEvent("change-item", { detail: { result }, bubbles: true, composed: true }))
    )(path);
  }

  //產生命令按鈕
  _generateCommand(path) {
    return pipe(
      (items) => !List(items).isEmpty(),
      (hasItems) => html`
        <div contenteditable="false" class="command">
          <button @click=${(e) => this._insertItem(path, 0)}>新增上方分項</button>
          <button @click=${(e) => this._insertItem(path, 1)}>新增下方分項</button>
          <button @click=${(e) => this._appendItem(path)} ?disabled=${hasItems}>新增子分項</button>
          <button @click=${(e) => this._deleteItem(path)}>刪除</button>
        </div>
      `
    )(List(this.source).getIn([...path, "items"]));
  }

  _generateContent(item, paths, degree, index) {
    const style = { marginLeft: "0px", "list-style-type": `'${docItemNums[degree][index]}'` };
    // var a=paths;
    // var b=this._paths;
    // var c=List(this.paths).equals(List(this._paths));
    return degree < this.maxDegree
      ? html`
          <li data-degree=${degree} style=${styleMap(style)}>
            <div style="padding:3px">
              <div-input
                ?contenteditable=${this.contenteditable}
                .text=${item.text}
                @focus-out=${(e) => this._updateContent(e.detail.innerText, [...paths, index])}
                @focus-in=${(e) => this._handleFocusIn(e, paths, degree, index)}
              ></div-input>
              ${this.contenteditable && List(paths).equals(List(this._paths)) && index === this._index
                ? this._generateCommand([...paths, index])
                : ""}
            </div>
            ${!!item.items && item.items.length > 0
              ? html`
                  <ol>
                    ${item.items.map(
                      (subItem, i) => html`${this._generateContent(subItem, [...paths, index, "items"], degree + 1, i)}`
                    )}
                  </ol>
                `
              : null}
          </li>
        `
      : html``;
  }

  getHtml() {
    return `
      <ol>
        ${this.source.reduce((acc, item, index) => acc + this._getHtml(item, 0, index), "")}          
      </ol>
    `;
  }

  _getHtml(item, degree, index) {
    return `
      <li style="margin-left: 0px; list-style-type: '${docItemNums[degree][index]}'">
        ${item.text}
        ${
          !!item.items && item.items.length > 0
            ? `<ol>${item.items.reduce((acc, item, index) => acc + this._getHtml(item, degree + 1, index), "")}</ol>`
            : ``
        }
      </li>
    `;
  }
}

customElements.define("doc-editor", DocEditor);
