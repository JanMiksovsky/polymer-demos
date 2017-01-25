/*
 * This demo creates a simple single-selection list box in Polymer.
 * This works just like the sample list box demo in the main elix/elix repo,
 * only the mixins are applied to a Polymer base class instead of HTMLElement.
 * See that demo for more details about how the mixins work together.
 *
 * This example defines the list box template in an HTML Import, which is
 * standard practice for Polymer elements. For the time being, this script is
 * maintained outside of that HTML file to simplify transpilation.
 */


import ClickSelectionMixin from 'elix/elements/elix-mixins/src/ClickSelectionMixin';
import SelectionAriaMixin from 'elix/elements/elix-mixins/src/SelectionAriaMixin';
import SingleSelectionMixin from 'elix/elements/elix-mixins/src/SingleSelectionMixin';
import symbols from 'elix/elements/elix-mixins/src/symbols';


// Apply a set of Elix mixins to the Polymer.Element base class.
// Use `reduce` to apply all the mixin functions.
const mixins = [
  ClickSelectionMixin,
  SelectionAriaMixin,
  SingleSelectionMixin
];
const base = mixins.reduce((cls, mixin) => mixin(cls), window.Polymer.Element);


/**
 * A simple single-selection list box.
 *
 * This uses the base class we just created above, and adds in the behavior
 * unique to this list box element.
 *
 * TODO: Work out the best way to support setting properties via attributes.
 * See the adjacent SingleSelectionDemo.js file for more on that issue.
 *
 * @extends Polymer.Element
 * @mixes ClickSelectionMixin
 * @mixes SelectionAriaMixin
 * @mixes SingleSelectionMixin
 */
class ListBox extends base {

  constructor() {
    super();

    // Simplistic keyboard handling for Left/Right and Up/Down keys.
    this.addEventListener('keydown', event => {
      this[symbols.raiseChangeEvents] = true;
      let handled = false;
      switch(event.keyCode) {
        case 37: // Left
        case 38: // Up
          handled = this.selectPrevious();
          break;
        case 39: // Right
        case 40: // Down
          handled = this.selectNext();
          break;
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
      this[symbols.raiseChangeEvents] = false;
    });

    // The list needs to initialize any items it starts with by invoking the
    // itemsChanged method. Mixins like the ARIA mixin will then use that signal
    // to apply attributes to each item, as well as to the list element itself.
    // For now, we invoke the method manually, but eventually we'll want a mixin
    // to handle this common need. Because the Custom Element spec prevents an
    // element from modifying itself in its own constructor, we do so in
    // timeout.
    setTimeout(() => {
      this[symbols.itemsChanged]();
    });
  }

  connectedCallback() {
    if (super.connectedCallback) { super.connectedCallback(); }
    // Set a default tabindex so that the element can receive focus. That lets
    // us support keyboard selection. We take care to avoid ovewritting any
    // tabindex that's explicitly set on the list element.
    if (this.getAttribute('tabindex') == null && this[symbols.defaults].tabindex !== null) {
      this.setAttribute('tabindex', this[symbols.defaults].tabindex);
    }
  }

  // We define a collection of default property values which can be set in
  // the constructor or connectedCallback. Defining the actual default values
  // in those calls would complicate things if a subclass someday wants to
  // define its own default value.
  get [symbols.defaults]() {
    const defaults = super[symbols.defaults] || {};
    // The default tab index is 0 (document order).
    defaults.tabindex = 0;
    return defaults;
  }

  static get is() {
    return 'sample-list-box';
  }

  // Map item selection to a `selected` CSS class.
  [symbols.itemSelected](item, selected) {
    if (super[symbols.itemSelected]) { super[symbols.itemSelected](item, selected); }
    item.classList.toggle('selected', selected);
  }

  // Simplistic implementation of an items property so that SingleSelectionMixin
  // has items to work with. This doesn't handle Shadow DOM redistribution, so
  // if someone puts a slot element inside the list, it won't behave as
  // expected.
  get items() {
    return this.children;
  }

  // A simplistic implementation of itemsChanged. A real implementation
  // would also need to track changes in the set of children, and invoke
  // itemAdded for new children.
  [symbols.itemsChanged]() {
    Array.prototype.forEach.call(this.items, child => {
      this[symbols.itemAdded](child);
    });
  }

}


customElements.define('sample-list-box', ListBox);
export default ListBox;
