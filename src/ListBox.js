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

import ChildrenContentMixin from 'elix/elements/elix-mixins/src/ChildrenContentMixin';
import ClickSelectionMixin from 'elix/elements/elix-mixins/src/ClickSelectionMixin';
import ContentItemsMixin from 'elix/elements/elix-mixins/src/ContentItemsMixin';
import DirectionSelectionMixin from 'elix/elements/elix-mixins/src/DirectionSelectionMixin';
import KeyboardDirectionMixin from 'elix/elements/elix-mixins/src/KeyboardDirectionMixin';
import KeyboardMixin from 'elix/elements/elix-mixins/src/KeyboardMixin';
import KeyboardPagedSelectionMixin from 'elix/elements/elix-mixins/src/KeyboardPagedSelectionMixin';
import KeyboardPrefixSelectionMixin from 'elix/elements/elix-mixins/src/KeyboardPrefixSelectionMixin';
import SelectionAriaMixin from 'elix/elements/elix-mixins/src/SelectionAriaMixin';
import SelectionInViewMixin from 'elix/elements/elix-mixins/src/SelectionInViewMixin';
import SingleSelectionMixin from 'elix/elements/elix-mixins/src/SingleSelectionMixin';
import symbols from 'elix/elements/elix-mixins/src/symbols';


// Apply a set of Elix mixins to the Polymer.Element base class.
// Use `reduce` to apply all the mixin functions.
const mixins = [
  ChildrenContentMixin,
  ClickSelectionMixin,
  ContentItemsMixin,
  DirectionSelectionMixin,
  KeyboardDirectionMixin,
  KeyboardMixin,
  KeyboardPagedSelectionMixin,
  KeyboardPrefixSelectionMixin,
  SelectionAriaMixin,
  SelectionInViewMixin,
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
 */
class ListBox extends base {

  // We define a collection of default property values which can be set in
  // the constructor or connectedCallback. Defining the actual default values
  // in those calls would complicate things if a subclass someday wants to
  // define its own default value.
  get [symbols.defaults]() {
    const defaults = super[symbols.defaults] || {};
    // By default, we assume the list presents list items vertically.
    defaults.orientation = 'vertical';
    return defaults;
  }

  // Map item selection to a `selected` CSS class.
  [symbols.itemSelected](item, selected) {
    if (super[symbols.itemSelected]) { super[symbols.itemSelected](item, selected); }
    item.classList.toggle('selected', selected);
  }

  static get is() {
    return 'sample-list-box';
  }

  // Map item selection to a `selected` CSS class.
  [symbols.itemSelected](item, selected) {
    if (super[symbols.itemSelected]) { super[symbols.itemSelected](item, selected); }
    item.classList.toggle('selected', selected);
  }

}


customElements.define('sample-list-box', ListBox);
export default ListBox;
