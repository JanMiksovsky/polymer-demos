import SingleSelectionMixin from 'elix/elements/elix-mixins/src/SingleSelectionMixin';
import symbols from 'elix/elements/elix-mixins/src/symbols';


/*
 * Demonstrate the Elix single-selection mixin applied to a Polymer 2.0 element.
 */
class SingleSelectionDemo extends SingleSelectionMixin(window.Polymer.Element) {

  constructor() {
    super();

    // When a child is clicked, set the selectedItem.
    this.addEventListener('click', event => {
      this[symbols.raiseChangeEvents] = true;
      this.selectedItem = event.target !== this ?
        event.target :  // Clicked on an item
        null;           // Clicked on element background
      event.stopPropagation();
      this[symbols.raiseChangeEvents] = false;
    });
  }

  // It's unclear who should handle attributes like `selected-index`. Polymer
  // will try to handle them, but then we have to declare them, even if they
  // come from mixins. Alternatively, we could define our own
  // `attributeChangedCallback` and `observedAttributes` and handle our
  // attributes ourselves. Currently, however, Polymer will fight us for
  // control.
  static get config() {
    return {
      properties: {
        selectedIndex: {
          type: Number
        }
      }
    };
  }

  // See notes at `config`.
  // attributeChangedCallback(attributeName, oldValue, newValue) {
  //   if (super.attributeChangedCallback) { super.attributeChangedCallback(attributeName, oldValue, newValue); }
  //   if (attributeName === 'selected-index') {
  //     this.selectedIndex = newValue;
  //   }
  // }

  static get is() { return 'single-selection-demo'; }

  // Map item selection to a `selected` CSS class.
  [symbols.itemSelected](item, selected) {
    if (super[symbols.itemSelected]) { super[symbols.itemSelected](item, selected); }
    item.classList.toggle('selected', selected);
  }

  // Simplistic implementation of items property — doesn't handle redistribution.
  get items() {
    return this.children;
  }

  // See notes at `config`.
  // static get observedAttributes() {
  //   return ['selected-index'];
  // }

}


customElements.define(SingleSelectionDemo.is, SingleSelectionDemo);
