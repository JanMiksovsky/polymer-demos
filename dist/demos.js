(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ClickSelectionMixin;

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixin which maps a click (actually, a mousedown) to a selection.
 *
 * This simple mixin is useful in list box-like elements, where a click on a
 * list item implicitly selects it.
 *
 * The standard use for this mixin is in list-like elements. Native list
 * boxes don't appear to be consistent with regard to whether they select
 * on mousedown or click/mouseup. This mixin assumes the use of mousedown.
 *
 * This mixin expects the component to provide an `items` property. It also
 * expects the component to define a `selectedItem` property. You can provide
 * that yourself, or use [SingleSelectionMixin](SingleSelectionMixin.md).
 *
 * If the component receives a clicks that doesn't correspond to an item (e.g.,
 * the user clicks on the element background visible between items), the
 * selection will be removed. However, if the component defines a
 * `selectionRequired` and this is true, a background click will *not* remove
 * the selection.
 *
 * @module ClickSelectionMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
function ClickSelectionMixin(base) {

  /**
   * The class prototype added by the mixin.
   */
  class ClickSelection extends base {

    constructor() {
      super();
      this.addEventListener('mousedown', event => {
        this[_symbols2.default.raiseChangeEvents] = true;
        // REVIEW: If the item is a button, the event seems to be raised in
        // phase 2 (AT_TARGET), but the target is the component, not item.
        // Need to invesigate.
        const target = event.target === this ? event.path[0] : event.target;
        const item = itemForTarget(this, target);
        if (item || !this.selectionRequired) {
          this.selectedItem = item;
          // Note: We don't call preventDefault here. The default behavior for
          // mousedown includes setting keyboard focus if the element doesn't
          // already have the focus, and we want to preserve that behavior.
          event.stopPropagation();
        }
        this[_symbols2.default.raiseChangeEvents] = false;
      });
    }

    // Default implementation. This will typically be handled by other mixins.
    get selectedItem() {
      return super.selectedItem;
    }
    set selectedItem(item) {
      if ('selectedItem' in base.prototype) {
        super.selectedItem = item;
      }
    }

  }

  return ClickSelection;
}

/*
 * Return the list item that is or contains the indicated target element.
 * Return null if not found.
 */
function itemForTarget(listElement, target) {
  const items = listElement.items;
  const itemCount = items ? items.length : 0;
  for (let i = 0; i < itemCount; i++) {
    let item = items[i];
    if (item === target || item.contains(target)) {
      return item;
    }
  }
  return null;
}

},{"./symbols":5}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (base) {

  /**
   * The class prototype added by the mixin.
   */
  class SelectionAria extends base {

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      // Set default ARIA role for the overall component.
      if (this.getAttribute('role') == null && this[_symbols2.default.defaults].role) {
        this.setAttribute('role', this[_symbols2.default.defaults].role);
      }
    }

    get [_symbols2.default.defaults]() {
      const defaults = super[_symbols2.default.defaults] || {};
      defaults.role = 'listbox';
      defaults.itemRole = 'option';
      return defaults;
    }

    [_symbols2.default.itemAdded](item) {
      if (super[_symbols2.default.itemAdded]) {
        super[_symbols2.default.itemAdded](item);
      }

      if (!item.getAttribute('role')) {
        // Assign a default ARIA role for an individual item.
        item.setAttribute('role', this[_symbols2.default.defaults].itemRole);
      }

      // Ensure each item has an ID so we can set aria-activedescendant on the
      // overall list whenever the selection changes.
      //
      // The ID will take the form of a base ID plus a unique integer. The base
      // ID will be incorporate the component's own ID. E.g., if a component has
      // ID "foo", then its items will have IDs that look like "_fooOption1". If
      // the compnent has no ID itself, its items will get IDs that look like
      // "_option1". Item IDs are prefixed with an underscore to differentiate
      // them from manually-assigned IDs, and to minimize the potential for ID
      // conflicts.
      if (!item.id) {
        const baseId = this.id ? "_" + this.id + "Option" : "_option";
        item.id = baseId + idCount++;
      }
    }

    [_symbols2.default.itemSelected](item, selected) {
      if (super[_symbols2.default.itemSelected]) {
        super[_symbols2.default.itemSelected](item, selected);
      }
      item.setAttribute('aria-selected', selected);
      const itemId = item.id;
      if (itemId && selected) {
        this.setAttribute('aria-activedescendant', itemId);
      }
    }

    get selectedItem() {
      return super.selectedItem;
    }
    set selectedItem(item) {
      if ('selectedItem' in base.prototype) {
        super.selectedItem = item;
      }
      if (item == null) {
        // Selection was removed.
        this.removeAttribute('aria-activedescendant');
      }
    }

  }

  return SelectionAria;
};

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Used to assign unique IDs to item elements without IDs.
let idCount = 0;

/**
 * Mixin which treats the selected item in a list as the active item in ARIA
 * accessibility terms.
 *
 * Handling ARIA selection state properly is actually quite complex:
 *
 * * The items in the list need to be indicated as possible items via an ARIA
 *   `role` attribute value such as "option".
 * * The selected item need to be marked as selected by setting the item's
 *   `aria-selected` attribute to true *and* the other items need be marked as
 *   *not* selected by setting `aria-selected` to false.
 * * The outermost element with the keyboard focus needs to have attributes
 *   set on it so that the selection is knowable at the list level via the
 *   `aria-activedescendant` attribute.
 * * Use of `aria-activedescendant` in turn requires that all items in the
 *   list have ID attributes assigned to them.
 *
 * This mixin tries to address all of the above requirements. To that end,
 * this mixin will assign generated IDs to any item that doesn't already have
 * an ID.
 *
 * ARIA relies on elements to provide `role` attributes. This mixin will apply
 * a default role of "listbox" on the outer list if it doesn't already have an
 * explicit role. Similarly, this mixin will apply a default role of "option"
 * to any list item that does not already have a role specified.
 *
 * This mixin expects a set of members that manage the state of the selection:
 * `[symbols.itemSelected]`, `[symbols.itemAdded]`, and `selectedItem`. You can
 * supply these yourself, or do so via
 * [SingleSelectionMixin](SingleSelectionMixin.md).
 *
 * @module
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */

},{"./symbols":5}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SingleSelectionMixin;

var _Symbol = require('./Symbol');

var _Symbol2 = _interopRequireDefault(_Symbol);

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Symbols for private data members on an element.
const canSelectNextSymbol = (0, _Symbol2.default)('canSelectNext');
const canSelectPreviousSymbol = (0, _Symbol2.default)('canSelectPrevious');
const selectionRequiredSymbol = (0, _Symbol2.default)('selectionRequired');
const selectionWrapsSymbol = (0, _Symbol2.default)('selectionWraps');

// We want to expose both selectedIndex and selectedItem as independent
// properties but keep them in sync. This allows a component user to reference
// the selection by whatever means is most natural for their situation.
//
// To efficiently keep these properties in sync, we track "external" and
// "internal" references for each property:
//
// The external index or item is the one we report to the outside world when
// asked for selection.  When handling a change to index or item, we update the
// external reference as soon as possible, so that if anyone immediately asks
// for the current selection, they will receive a stable answer.
//
// The internal index or item tracks whichever index or item last received the
// full set of processing. Processing includes raising a change event for the
// new value. Once we've begun that processing, we store the new value as the
// internal value to indicate we've handled it.
//
const externalSelectedIndexSymbol = (0, _Symbol2.default)('externalSelectedIndex');
const externalSelectedItemSymbol = (0, _Symbol2.default)('externalSelectedItem');
const internalSelectedIndexSymbol = (0, _Symbol2.default)('internalSelectedIndex');
const internalSelectedItemSymbol = (0, _Symbol2.default)('internalSelectedItem');

/**
 * Mixin which adds single-selection semantics for items in a list.
 *
 * This mixin expects a component to provide an `items` Array or NodeList of
 * all elements in the list.
 *
 * This mixin tracks a single selected item in the list, and provides means to
 * get and set that state by item position (`selectedIndex`) or item identity
 * (`selectedItem`). The selection can be moved in the list via the methods
 * `selectFirst`, `selectLast`, `selectNext`, and `selectPrevious`.
 *
 * This mixin does not produce any user-visible effects to represent
 * selection.
 *
 * @module SingleSelectionMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
function SingleSelectionMixin(base) {

  /**
   * The class prototype added by the mixin.
   */
  class SingleSelection extends base {

    constructor() {
      super();
      // Set defaults.
      if (typeof this.selectionRequired === 'undefined') {
        this.selectionRequired = this[_symbols2.default.defaults].selectionRequired;
      }
      if (typeof this.selectionWraps === 'undefined') {
        this.selectionWraps = this[_symbols2.default.defaults].selectionWraps;
      }
    }

    /**
     * True if the selection can be moved to the next item, false if not (the
     * selected item is the last item in the list).
     *
     * @type {boolean}
     */
    get canSelectNext() {
      return this[canSelectNextSymbol];
    }
    set canSelectNext(canSelectNext) {
      const changed = canSelectNext !== this[canSelectNextSymbol];
      this[canSelectNextSymbol] = canSelectNext;
      if ('canSelectNext' in base.prototype) {
        super.canSelectNext = canSelectNext;
      }
      if (this[_symbols2.default.raiseChangeEvents] && changed) {
        this.dispatchEvent(new CustomEvent('can-select-next-changed'));
      }
    }

    /**
     * True if the selection can be moved to the previous item, false if not
     * (the selected item is the first one in the list).
     *
     * @type {boolean}
     */
    get canSelectPrevious() {
      return this[canSelectPreviousSymbol];
    }
    set canSelectPrevious(canSelectPrevious) {
      const changed = canSelectPrevious !== this[canSelectPreviousSymbol];
      this[canSelectPreviousSymbol] = canSelectPrevious;
      if ('canSelectPrevious' in base.prototype) {
        super.canSelectPrevious = canSelectPrevious;
      }
      if (this[_symbols2.default.raiseChangeEvents] && changed) {
        this.dispatchEvent(new CustomEvent('can-select-previous-changed'));
      }
    }

    get [_symbols2.default.defaults]() {
      const defaults = super[_symbols2.default.defaults] || {};
      defaults.selectionRequired = false;
      defaults.selectionWraps = false;
      return defaults;
    }

    /**
     * Handle a new item being added to the list.
     *
     * The default implementation of this method simply sets the item's
     * selection state to false.
     *
     * @param {HTMLElement} item - the item being added
     */
    [_symbols2.default.itemAdded](item) {
      if (super[_symbols2.default.itemAdded]) {
        super[_symbols2.default.itemAdded](item);
      }
      this[_symbols2.default.itemSelected](item, item === this.selectedItem);
    }

    [_symbols2.default.itemsChanged]() {
      if (super[_symbols2.default.itemsChanged]) {
        super[_symbols2.default.itemsChanged]();
      }

      // In case selected item changed position or was removed.
      trackSelectedItem(this);

      // In case the change in items affected which navigations are possible.
      updatePossibleNavigations(this);
    }

    /**
     * Apply the indicate selection state to the item.
     *
     * The default implementation of this method does nothing. User-visible
     * effects will typically be handled by other mixins.
     *
     * @param {HTMLElement} item - the item being selected/deselected
     * @param {boolean} selected - true if the item is selected, false if not
     */
    [_symbols2.default.itemSelected](item, selected) {
      if (super[_symbols2.default.itemSelected]) {
        super[_symbols2.default.itemSelected](item, selected);
      }
    }

    /**
     * The index of the item which is currently selected.
     *
     * The setter expects an integer or a string representing an integer.
     *
     * A `selectedIndex` of -1 indicates there is no selection. Setting this
     * property to -1 will remove any existing selection.
     *
     * @type {number}
     */
    get selectedIndex() {
      return this[externalSelectedIndexSymbol] != null ? this[externalSelectedIndexSymbol] : -1;
    }
    set selectedIndex(index) {
      // See notes at top about internal vs. external copies of this property.
      const changed = index !== this[internalSelectedIndexSymbol];
      let item;
      let parsedIndex = parseInt(index);
      if (parsedIndex !== this[externalSelectedIndexSymbol]) {
        // Store the new index and the corresponding item.
        const items = this.items;
        const hasItems = items && items.length > 0;
        if (!(hasItems && parsedIndex >= 0 && parsedIndex < items.length)) {
          parsedIndex = -1; // No item at that index.
        }
        this[externalSelectedIndexSymbol] = parsedIndex;
        item = hasItems && parsedIndex >= 0 ? items[parsedIndex] : null;
        this[externalSelectedItemSymbol] = item;
      } else {
        item = this[externalSelectedItemSymbol];
      }

      // Now let super do any work.
      if ('selectedIndex' in base.prototype) {
        super.selectedIndex = index;
      }

      if (changed) {
        // The selected index changed.
        this[internalSelectedIndexSymbol] = parsedIndex;

        if (this[_symbols2.default.raiseChangeEvents]) {
          const event = new CustomEvent('selected-index-changed', {
            detail: {
              selectedIndex: parsedIndex,
              value: parsedIndex // for Polymer binding. TODO: Verify still necessary
            }
          });
          this.dispatchEvent(event);
        }
      }

      if (this[internalSelectedItemSymbol] !== item) {
        // Update selectedItem property so it can have its own effects.
        this.selectedItem = item;
      }
    }

    /**
     * The currently selected item, or null if there is no selection.
     *
     * Setting this property to null deselects any currently-selected item.
     * Setting this property to an object that is not in the list has no effect.
     *
     * TODO: Even if selectionRequired, can still explicitly set selectedItem to null.
     * TODO: If selectionRequired, leave selection alone?
     *
     * @type {object}
     */
    get selectedItem() {
      return this[externalSelectedItemSymbol] || null;
    }
    set selectedItem(item) {
      // See notes at top about internal vs. external copies of this property.
      const previousSelectedItem = this[internalSelectedItemSymbol];
      const changed = item !== previousSelectedItem;
      let index;
      if (item !== this[externalSelectedItemSymbol]) {
        // Store item and look up corresponding index.
        const items = this.items;
        const hasItems = items && items.length > 0;
        index = hasItems ? Array.prototype.indexOf.call(items, item) : -1;
        this[externalSelectedIndexSymbol] = index;
        if (index < 0) {
          item = null; // The indicated item isn't actually in `items`.
        }
        this[externalSelectedItemSymbol] = item;
      } else {
        index = this[externalSelectedIndexSymbol];
      }

      // Now let super do any work.
      if ('selectedItem' in base.prototype) {
        super.selectedItem = item;
      }

      if (changed) {
        // The selected item changed.
        this[internalSelectedItemSymbol] = item;

        if (previousSelectedItem) {
          // Update selection state of old item.
          this[_symbols2.default.itemSelected](previousSelectedItem, false);
        }
        if (item) {
          // Update selection state to new item.
          this[_symbols2.default.itemSelected](item, true);
        }

        updatePossibleNavigations(this);

        if (this[_symbols2.default.raiseChangeEvents]) {
          const event = new CustomEvent('selected-item-changed', {
            detail: {
              selectedItem: item,
              value: item // for Polymer binding
            }
          });
          this.dispatchEvent(event);
        }
      }

      if (this[internalSelectedIndexSymbol] !== index) {
        // Update selectedIndex property so it can have its own effects.
        this.selectedIndex = index;
      }
    }

    /**
     * Select the first item in the list.
     *
     * @returns {Boolean} True if the selection changed, false if not.
     */
    selectFirst() {
      if (super.selectFirst) {
        super.selectFirst();
      }
      return selectIndex(this, 0);
    }

    /**
     * True if the list should always have a selection (if it has items).
     *
     * @type {boolean}
     * @default false
     */
    get selectionRequired() {
      return this[selectionRequiredSymbol];
    }
    set selectionRequired(selectionRequired) {
      this[selectionRequiredSymbol] = selectionRequired;
      if ('selectionRequired' in base.prototype) {
        super.selectionRequired = selectionRequired;
      }
      trackSelectedItem(this);
    }

    /**
     * True if selection navigations wrap from last to first, and vice versa.
     *
     * @type {boolean}
     * @default false
     */
    get selectionWraps() {
      return this[selectionWrapsSymbol];
    }
    set selectionWraps(value) {
      this[selectionWrapsSymbol] = String(value) === 'true';
      if ('selectionWraps' in base.prototype) {
        super.selectionWraps = value;
      }
      updatePossibleNavigations(this);
    }

    /**
     * Select the last item in the list.
     *
     * @returns {Boolean} True if the selection changed, false if not.
     */
    selectLast() {
      if (super.selectLast) {
        super.selectLast();
      }
      return selectIndex(this, this.items.length - 1);
    }

    /**
     * Select the next item in the list.
     *
     * If the list has no selection, the first item will be selected.
     *
     * @returns {Boolean} True if the selection changed, false if not.
     */
    selectNext() {
      if (super.selectNext) {
        super.selectNext();
      }
      return selectIndex(this, this.selectedIndex + 1);
    }

    /**
     * Select the previous item in the list.
     *
     * If the list has no selection, the last item will be selected.
     *
     * @returns {Boolean} True if the selection changed, false if not.
     */
    selectPrevious() {
      if (super.selectPrevious) {
        super.selectPrevious();
      }
      const newIndex = this.selectedIndex < 0 ? this.items.length - 1 : // No selection yet; select last item.
      this.selectedIndex - 1;
      return selectIndex(this, newIndex);
    }

    /**
     * Fires when the canSelectNext property changes in response to internal
     * component activity.
     *
     * @memberof SingleSelection
     * @event can-select-next-changed
     */

    /**
     * Fires when the canSelectPrevious property changes in response to internal
     * component activity.
     *
     * @memberof SingleSelection
     * @event can-select-previous-changed
     */

    /**
     * Fires when the selectedIndex property changes in response to internal
     * component activity.
     *
     * @memberof SingleSelection
     * @event selected-index-changed
     * @param {number} detail.selectedIndex The new selected index.
     */

    /**
     * Fires when the selectedItem property changes in response to internal
     * component activity.
     *
     * @memberof SingleSelection
     * @event selected-item-changed
     * @param {HTMLElement} detail.selectedItem The new selected item.
     */

  }

  return SingleSelection;
}

// Ensure the given index is within bounds, and select it if it's not already
// selected.
function selectIndex(element, index) {

  const items = element.items;
  if (items == null) {
    // Nothing to select.
    return false;
  }

  const count = items.length;
  const boundedIndex = element.selectionWraps ?
  // JavaScript mod doesn't handle negative numbers the way we want to wrap.
  // See http://stackoverflow.com/a/18618250/76472
  (index % count + count) % count :

  // Keep index within bounds of array.
  Math.max(Math.min(index, count - 1), 0);

  const previousIndex = element.selectedIndex;
  if (previousIndex !== boundedIndex) {
    element.selectedIndex = boundedIndex;
    return true;
  } else {
    return false;
  }
}

// Following a change in the set of items, or in the value of the
// `selectionRequired` property, reacquire the selected item. If it's moved,
// update `selectedIndex`. If it's been removed, and a selection is required,
// try to select another item.
function trackSelectedItem(element) {

  const items = element.items;
  const itemCount = items ? items.length : 0;

  const previousSelectedItem = element.selectedItem;
  if (!previousSelectedItem) {
    // No item was previously selected.
    if (element.selectionRequired) {
      // Select the first item by default.
      element.selectedIndex = 0;
    }
  } else if (itemCount === 0) {
    // We've lost the selection, and there's nothing left to select.
    element.selectedItem = null;
  } else {
    // Try to find the previously-selected item in the current set of items.
    const indexInCurrentItems = Array.prototype.indexOf.call(items, previousSelectedItem);
    const previousSelectedIndex = element.selectedIndex;
    if (indexInCurrentItems < 0) {
      // Previously-selected item was removed from the items.
      // Select the item at the same index (if it exists) or as close as possible.
      const newSelectedIndex = Math.min(previousSelectedIndex, itemCount - 1);
      // Select by item, since index may be the same, and we want to raise the
      // selected-item-changed event.
      element.selectedItem = items[newSelectedIndex];
    } else if (indexInCurrentItems !== previousSelectedIndex) {
      // Previously-selected item still there, but changed position.
      element.selectedIndex = indexInCurrentItems;
    }
  }
}

// Following a change in selection, report whether it's now possible to
// go next/previous from the given index.
function updatePossibleNavigations(element) {
  let canSelectNext;
  let canSelectPrevious;
  const items = element.items;
  if (items == null || items.length === 0) {
    // No items to select.
    canSelectNext = false;
    canSelectPrevious = false;
  } else if (element.selectionWraps) {
    // Since there are items, can always go next/previous.
    canSelectNext = true;
    canSelectPrevious = true;
  } else {
    const index = element.selectedIndex;
    if (index < 0 && items.length > 0) {
      // Special case. If there are items but no selection, declare that it's
      // always possible to go next/previous to create a selection.
      canSelectNext = true;
      canSelectPrevious = true;
    } else {
      // Normal case: we have an index in a list that has items.
      canSelectPrevious = index > 0;
      canSelectNext = index < items.length - 1;
    }
  }
  if (element.canSelectNext !== canSelectNext) {
    element.canSelectNext = canSelectNext;
  }
  if (element.canSelectPrevious !== canSelectPrevious) {
    element.canSelectPrevious = canSelectPrevious;
  }
}

},{"./Symbol":4,"./symbols":5}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/* The number of fake symbols we've served up */
let count = 0;

function uniqueString(description) {
  return `_${description}${count++}`;
}

const symbolFunction = typeof window.Symbol === 'function' ? window.Symbol : uniqueString;

/**
 * Polyfill for ES6 symbol class.
 *
 * Mixins and component classes often want to associate private data with an
 * element instance, but JavaScript does not have direct support for true
 * private properties. One approach is to use the
 * [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
 * data type to set and retrieve data on an element.
 *
 * Unfortunately, the Symbol type is not available in Internet Explorer 11. In
 * lieu of returning a true Symbol, this polyfill returns a different string
 * each time it is called.
 *
 * Usage:
 *
 *     const fooSymbol = Symbol('foo');
 *
 *     class MyElement extends HTMLElement {
 *       get foo() {
 *         return this[fooSymbol];
 *       }
 *       set foo(value) {
 *         this[fooSymbol] = value;
 *       }
 *     }
 *
 * In IE 11, this sample will "hide" data behind an instance property that looks
 * like this._foo0. The underscore is meant to reduce (not eliminate) potential
 * accidental access, and the unique number at the end is mean to avoid (not
 * eliminate) naming conflicts.
 *
 * @function Symbol
 * @param {string} description - A string to identify the symbol when debugging
 * @returns {Symbol|string} — A Symbol (in ES6 browsers) or unique string ID (in
 * ES5).
 */
exports.default = symbolFunction;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Symbol = require('./Symbol');

var _Symbol2 = _interopRequireDefault(_Symbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A collection of (potentially polyfilled) Symbol objects for standard
 * component properties and methods.
 *
 * These Symbol objects are used to allow mixins and a component to internally
 * communicate, without exposing these properties and methods in the component's
 * public API.
 *
 * To use these Symbol objects in your own component, include this module and
 * then create a property or method whose key is the desired Symbol.
 *
 *     import 'SingleSelectionMixin' from 'elix-mixins/src/SingleSelectionMixin';
 *     import 'symbols' from 'elix-mixins/src/symbols';
 *
 *     class MyElement extends SingleSelectionMixin(HTMLElement) {
 *       [symbols.itemSelected](item, selected) {
 *         // This will be invoked whenever an item is selected/deselected.
 *       }
 *     }
 *
 * @module symbols
 */
const symbols = {

  /**
   * Symbol for the `defaults` property.
   *
   * This property can be used to set or override defaults that will be applied
   * to a new component instance. When implementing this property, take care to
   * first acquire any defaults defined by the superclass. The standard idiom is
   * as follows:
   *
   *     get [symbols.defaults]() {
   *       const defaults = super[symbols.defaults] || {};
   *       // Set or override default values here
   *       defaults.customProperty = false;
   *       return defaults;
   *     }
   *
   * @var {object} defaults
   */
  defaults: (0, _Symbol2.default)('defaults'),

  /**
   * Symbol for the `raiseChangeEvents` property.
   *
   * This property is used by mixins to determine whether they should raise
   * property change events. The standard HTML pattern is to only raise such
   * events in response to direct user interactions. This property can be used
   * to manage events as follows.
   *
   * First, UI event listeners should set this property to `true` at the start
   * of the event handler, then `false` at the end:
   *
   *     this.addEventListener('click', event => {
   *       this[symbols.raiseChangeEvents] = true;
   *       // Do work here, possibly setting properties, like:
   *       this.foo = 'Hello';
   *       this[symbols.raiseChangeEvents] = false;
   *     });
   *
   * Elsewhere, property setters that raise change events should only do so it
   * this property is `true`:
   *
   *     set foo(value) {
   *       // Save foo value here, do any other work.
   *       if (this[symbols.raiseChangeEvents]) {
   *         const event = new CustomEvent('foo-changed');
   *         this.dispatchEvent(event);
   *       }
   *     }
   *
   * In this way, programmatic attempts to set the `foo` property will not
   * trigger the `foo-changed` event, but UI interactions that update that
   * property will cause those events to be raised.
   *
   */
  raiseChangeEvents: (0, _Symbol2.default)('raiseChangeEvents'),

  /**
   * Symbol for the `itemAdded` method.
   *
   * This method is invoked when a new item is added to a list.
   *
   * @function itemAdded
   * @param {HTMLElement} item - the item being selected/deselected
   */
  itemAdded: (0, _Symbol2.default)('itemAdded'),

  /**
   * Symbol for the `itemsChanged` method.
   *
   * This method is invoked when the underlying contents change. It is also
   * invoked on component initialization – since the items have "changed" from
   * being nothing.
   */
  itemsChanged: (0, _Symbol2.default)('itemsChanged'),

  /**
   * Symbol for the `itemSelected` method.
   *
   * This method is invoked when an item becomes selected or deselected.
   *
   * @function itemSelected
   * @param {HTMLElement} item - the item being selected/deselected
   * @param {boolean} selected - true if the item is selected, false if not
   */
  itemSelected: (0, _Symbol2.default)('itemSelected'),

  /**
   * Symbol for the `template` property.
   *
   * This property returns a component's template.
   *
   * @type {string|HTMLTemplateElement}
   */
  template: (0, _Symbol2.default)('template')
};

exports.default = symbols;

},{"./Symbol":4}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ClickSelectionMixin = require('elix/elements/elix-mixins/src/ClickSelectionMixin');

var _ClickSelectionMixin2 = _interopRequireDefault(_ClickSelectionMixin);

var _SelectionAriaMixin = require('elix/elements/elix-mixins/src/SelectionAriaMixin');

var _SelectionAriaMixin2 = _interopRequireDefault(_SelectionAriaMixin);

var _SingleSelectionMixin = require('elix/elements/elix-mixins/src/SingleSelectionMixin');

var _SingleSelectionMixin2 = _interopRequireDefault(_SingleSelectionMixin);

var _symbols = require('elix/elements/elix-mixins/src/symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Apply a set of Elix mixins to the Polymer.Element base class.
// Use `reduce` to apply the functions in order.
/*
 * This demo creates a simple single-selection list box in Polymer.
 * This works just like the sample list box demo in the main elix/elix repo,
 * only the mixins are applied to a Polymer base class instead of HTMLElement.
 * See that demo for more details about how the mixins work together.
 *
 * This example defines the list box template in an HTML Import, which is
 * standard practice for Polymer elements.
 */

const mixins = [_ClickSelectionMixin2.default, _SelectionAriaMixin2.default, _SingleSelectionMixin2.default];
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
      this[_symbols2.default.raiseChangeEvents] = true;
      let handled = false;
      switch (event.keyCode) {
        case 37: // Left
        case 38:
          // Up
          handled = this.selectPrevious();
          break;
        case 39: // Right
        case 40:
          // Down
          handled = this.selectNext();
          break;
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
      this[_symbols2.default.raiseChangeEvents] = false;
    });

    // The list needs to initialize any items it starts with by invoking the
    // itemsChanged method. Mixins like the ARIA mixin will then use that signal
    // to apply attributes to each item, as well as to the list element itself.
    // For now, we invoke the method manually, but eventually we'll want a mixin
    // to handle this common need. Because the Custom Element spec prevents an
    // element from modifying itself in its own constructor, we do so in
    // timeout.
    setTimeout(() => {
      this[_symbols2.default.itemsChanged]();
    });
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    // Set a default tabindex so that the element can receive focus. That lets
    // us support keyboard selection. We take care to avoid ovewritting any
    // tabindex that's explicitly set on the list element.
    if (this.getAttribute('tabindex') == null && this[_symbols2.default.defaults].tabindex !== null) {
      this.setAttribute('tabindex', this[_symbols2.default.defaults].tabindex);
    }
  }

  // We define a collection of default property values which can be set in
  // the constructor or connectedCallback. Defining the actual default values
  // in those calls would complicate things if a subclass someday wants to
  // define its own default value.
  get [_symbols2.default.defaults]() {
    const defaults = super[_symbols2.default.defaults] || {};
    // The default tab index is 0 (document order).
    defaults.tabindex = 0;
    return defaults;
  }

  static get is() {
    return 'sample-list-box';
  }

  // Map item selection to a `selected` CSS class.
  [_symbols2.default.itemSelected](item, selected) {
    if (super[_symbols2.default.itemSelected]) {
      super[_symbols2.default.itemSelected](item, selected);
    }
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
  [_symbols2.default.itemsChanged]() {
    Array.prototype.forEach.call(this.items, child => {
      this[_symbols2.default.itemAdded](child);
    });
  }

}

customElements.define('sample-list-box', ListBox);
exports.default = ListBox;

},{"elix/elements/elix-mixins/src/ClickSelectionMixin":1,"elix/elements/elix-mixins/src/SelectionAriaMixin":2,"elix/elements/elix-mixins/src/SingleSelectionMixin":3,"elix/elements/elix-mixins/src/symbols":5}],7:[function(require,module,exports){
'use strict';

var _SingleSelectionMixin = require('elix/elements/elix-mixins/src/SingleSelectionMixin');

var _SingleSelectionMixin2 = _interopRequireDefault(_SingleSelectionMixin);

var _symbols = require('elix/elements/elix-mixins/src/symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Demonstrate the Elix single-selection mixin applied to a Polymer 2.0 element.
 */
class SingleSelectionDemo extends (0, _SingleSelectionMixin2.default)(window.Polymer.Element) {

  constructor() {
    super();

    // When a child is clicked, set the selectedItem.
    this.addEventListener('click', event => {
      this[_symbols2.default.raiseChangeEvents] = true;
      this.selectedItem = event.target !== this ? event.target : // Clicked on an item
      null; // Clicked on element background
      event.stopPropagation();
      this[_symbols2.default.raiseChangeEvents] = false;
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

  static get is() {
    return 'single-selection-demo';
  }

  // Map item selection to a `selected` CSS class.
  [_symbols2.default.itemSelected](item, selected) {
    if (super[_symbols2.default.itemSelected]) {
      super[_symbols2.default.itemSelected](item, selected);
    }
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

},{"elix/elements/elix-mixins/src/SingleSelectionMixin":3,"elix/elements/elix-mixins/src/symbols":5}]},{},[6,7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ2xpY2tTZWxlY3Rpb25NaXhpbi5qcyIsIm5vZGVfbW9kdWxlcy9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9TZWxlY3Rpb25BcmlhTWl4aW4uanMiLCJub2RlX21vZHVsZXMvZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU2luZ2xlU2VsZWN0aW9uTWl4aW4uanMiLCJub2RlX21vZHVsZXMvZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL3N5bWJvbHMuanMiLCJzcmMvTGlzdEJveC5qcyIsInNyYy9TaW5nbGVTZWxlY3Rpb25EZW1vLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7a0JDMkJ3QixtQjs7QUEzQnhCOzs7Ozs7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JlLFNBQVMsbUJBQVQsQ0FBNkIsSUFBN0IsRUFBbUM7O0FBRWhEOzs7QUFHQSxRQUFNLGNBQU4sU0FBNkIsSUFBN0IsQ0FBa0M7O0FBRWhDLGtCQUFjO0FBQ1o7QUFDQSxXQUFLLGdCQUFMLENBQXNCLFdBQXRCLEVBQW1DLFNBQVM7QUFDMUMsYUFBSyxrQkFBUSxpQkFBYixJQUFrQyxJQUFsQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQU0sU0FBUyxNQUFNLE1BQU4sS0FBaUIsSUFBakIsR0FDYixNQUFNLElBQU4sQ0FBVyxDQUFYLENBRGEsR0FFYixNQUFNLE1BRlI7QUFHQSxjQUFNLE9BQU8sY0FBYyxJQUFkLEVBQW9CLE1BQXBCLENBQWI7QUFDQSxZQUFJLFFBQVEsQ0FBQyxLQUFLLGlCQUFsQixFQUFxQztBQUNuQyxlQUFLLFlBQUwsR0FBb0IsSUFBcEI7QUFDQTtBQUNBO0FBQ0E7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QWlCLElBQWpCLEdBQ2xCLE1BQU0sTUFEWSxHQUNGO0FBQ2hCLFVBRkYsQ0FGc0MsQ0FJcEI7QUFDbEIsWUFBTSxlQUFOO0FBQ0EsV0FBSyxrQkFBUSxpQkFBYixJQUFrQyxLQUFsQztBQUNELEtBUEQ7QUFRRDs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFXLE1BQVgsR0FBb0I7QUFDbEIsV0FBTztBQUNMLGtCQUFZO0FBQ1YsdUJBQWU7QUFDYixnQkFBTTtBQURPO0FBREw7QUFEUCxLQUFQO0FBT0Q7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsYUFBVyxFQUFYLEdBQWdCO0FBQUUsV0FBTyx1QkFBUDtBQUFpQzs7QUFFbkQ7QUFDQSxHQUFDLGtCQUFRLFlBQVQsRUFBdUIsSUFBdkIsRUFBNkIsUUFBN0IsRUFBdUM7QUFDckMsUUFBSSxNQUFNLGtCQUFRLFlBQWQsQ0FBSixFQUFpQztBQUFFLFlBQU0sa0JBQVEsWUFBZCxFQUE0QixJQUE1QixFQUFrQyxRQUFsQztBQUE4QztBQUNqRixTQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLFVBQXRCLEVBQWtDLFFBQWxDO0FBQ0Q7O0FBRUQ7QUFDQSxNQUFJLEtBQUosR0FBWTtBQUNWLFdBQU8sS0FBSyxRQUFaO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7O0FBeEQ2RTs7QUE2RC9FLGVBQWUsTUFBZixDQUFzQixvQkFBb0IsRUFBMUMsRUFBOEMsbUJBQTlDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBzeW1ib2xzIGZyb20gJy4vc3ltYm9scyc7XG5cblxuLyoqXG4gKiBNaXhpbiB3aGljaCBtYXBzIGEgY2xpY2sgKGFjdHVhbGx5LCBhIG1vdXNlZG93bikgdG8gYSBzZWxlY3Rpb24uXG4gKlxuICogVGhpcyBzaW1wbGUgbWl4aW4gaXMgdXNlZnVsIGluIGxpc3QgYm94LWxpa2UgZWxlbWVudHMsIHdoZXJlIGEgY2xpY2sgb24gYVxuICogbGlzdCBpdGVtIGltcGxpY2l0bHkgc2VsZWN0cyBpdC5cbiAqXG4gKiBUaGUgc3RhbmRhcmQgdXNlIGZvciB0aGlzIG1peGluIGlzIGluIGxpc3QtbGlrZSBlbGVtZW50cy4gTmF0aXZlIGxpc3RcbiAqIGJveGVzIGRvbid0IGFwcGVhciB0byBiZSBjb25zaXN0ZW50IHdpdGggcmVnYXJkIHRvIHdoZXRoZXIgdGhleSBzZWxlY3RcbiAqIG9uIG1vdXNlZG93biBvciBjbGljay9tb3VzZXVwLiBUaGlzIG1peGluIGFzc3VtZXMgdGhlIHVzZSBvZiBtb3VzZWRvd24uXG4gKlxuICogVGhpcyBtaXhpbiBleHBlY3RzIHRoZSBjb21wb25lbnQgdG8gcHJvdmlkZSBhbiBgaXRlbXNgIHByb3BlcnR5LiBJdCBhbHNvXG4gKiBleHBlY3RzIHRoZSBjb21wb25lbnQgdG8gZGVmaW5lIGEgYHNlbGVjdGVkSXRlbWAgcHJvcGVydHkuIFlvdSBjYW4gcHJvdmlkZVxuICogdGhhdCB5b3Vyc2VsZiwgb3IgdXNlIFtTaW5nbGVTZWxlY3Rpb25NaXhpbl0oU2luZ2xlU2VsZWN0aW9uTWl4aW4ubWQpLlxuICpcbiAqIElmIHRoZSBjb21wb25lbnQgcmVjZWl2ZXMgYSBjbGlja3MgdGhhdCBkb2Vzbid0IGNvcnJlc3BvbmQgdG8gYW4gaXRlbSAoZS5nLixcbiAqIHRoZSB1c2VyIGNsaWNrcyBvbiB0aGUgZWxlbWVudCBiYWNrZ3JvdW5kIHZpc2libGUgYmV0d2VlbiBpdGVtcyksIHRoZVxuICogc2VsZWN0aW9uIHdpbGwgYmUgcmVtb3ZlZC4gSG93ZXZlciwgaWYgdGhlIGNvbXBvbmVudCBkZWZpbmVzIGFcbiAqIGBzZWxlY3Rpb25SZXF1aXJlZGAgYW5kIHRoaXMgaXMgdHJ1ZSwgYSBiYWNrZ3JvdW5kIGNsaWNrIHdpbGwgKm5vdCogcmVtb3ZlXG4gKiB0aGUgc2VsZWN0aW9uLlxuICpcbiAqIEBtb2R1bGUgQ2xpY2tTZWxlY3Rpb25NaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIENsaWNrU2VsZWN0aW9uTWl4aW4oYmFzZSkge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIENsaWNrU2VsZWN0aW9uIGV4dGVuZHMgYmFzZSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGV2ZW50ID0+IHtcbiAgICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IHRydWU7XG4gICAgICAgIC8vIFJFVklFVzogSWYgdGhlIGl0ZW0gaXMgYSBidXR0b24sIHRoZSBldmVudCBzZWVtcyB0byBiZSByYWlzZWQgaW5cbiAgICAgICAgLy8gcGhhc2UgMiAoQVRfVEFSR0VUKSwgYnV0IHRoZSB0YXJnZXQgaXMgdGhlIGNvbXBvbmVudCwgbm90IGl0ZW0uXG4gICAgICAgIC8vIE5lZWQgdG8gaW52ZXNpZ2F0ZS5cbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0ID09PSB0aGlzID9cbiAgICAgICAgICBldmVudC5wYXRoWzBdIDpcbiAgICAgICAgICBldmVudC50YXJnZXQ7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBpdGVtRm9yVGFyZ2V0KHRoaXMsIHRhcmdldCk7XG4gICAgICAgIGlmIChpdGVtIHx8ICF0aGlzLnNlbGVjdGlvblJlcXVpcmVkKSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0gPSBpdGVtO1xuICAgICAgICAgIC8vIE5vdGU6IFdlIGRvbid0IGNhbGwgcHJldmVudERlZmF1bHQgaGVyZS4gVGhlIGRlZmF1bHQgYmVoYXZpb3IgZm9yXG4gICAgICAgICAgLy8gbW91c2Vkb3duIGluY2x1ZGVzIHNldHRpbmcga2V5Ym9hcmQgZm9jdXMgaWYgdGhlIGVsZW1lbnQgZG9lc24ndFxuICAgICAgICAgIC8vIGFscmVhZHkgaGF2ZSB0aGUgZm9jdXMsIGFuZCB3ZSB3YW50IHRvIHByZXNlcnZlIHRoYXQgYmVoYXZpb3IuXG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbi4gVGhpcyB3aWxsIHR5cGljYWxseSBiZSBoYW5kbGVkIGJ5IG90aGVyIG1peGlucy5cbiAgICBnZXQgc2VsZWN0ZWRJdGVtKCkge1xuICAgICAgcmV0dXJuIHN1cGVyLnNlbGVjdGVkSXRlbTtcbiAgICB9XG4gICAgc2V0IHNlbGVjdGVkSXRlbShpdGVtKSB7XG4gICAgICBpZiAoJ3NlbGVjdGVkSXRlbScgaW4gYmFzZS5wcm90b3R5cGUpIHsgc3VwZXIuc2VsZWN0ZWRJdGVtID0gaXRlbTsgfVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIENsaWNrU2VsZWN0aW9uO1xufVxuXG5cbi8qXG4gKiBSZXR1cm4gdGhlIGxpc3QgaXRlbSB0aGF0IGlzIG9yIGNvbnRhaW5zIHRoZSBpbmRpY2F0ZWQgdGFyZ2V0IGVsZW1lbnQuXG4gKiBSZXR1cm4gbnVsbCBpZiBub3QgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGl0ZW1Gb3JUYXJnZXQobGlzdEVsZW1lbnQsIHRhcmdldCkge1xuICBjb25zdCBpdGVtcyA9IGxpc3RFbGVtZW50Lml0ZW1zO1xuICBjb25zdCBpdGVtQ291bnQgPSBpdGVtcyA/IGl0ZW1zLmxlbmd0aCA6IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbUNvdW50OyBpKyspIHtcbiAgICBsZXQgaXRlbSA9IGl0ZW1zW2ldO1xuICAgIGlmIChpdGVtID09PSB0YXJnZXQgfHwgaXRlbS5jb250YWlucyh0YXJnZXQpKSB7XG4gICAgICByZXR1cm4gaXRlbTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG4iLCJpbXBvcnQgc3ltYm9scyBmcm9tICcuL3N5bWJvbHMnO1xuXG5cbi8vIFVzZWQgdG8gYXNzaWduIHVuaXF1ZSBJRHMgdG8gaXRlbSBlbGVtZW50cyB3aXRob3V0IElEcy5cbmxldCBpZENvdW50ID0gMDtcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIHRyZWF0cyB0aGUgc2VsZWN0ZWQgaXRlbSBpbiBhIGxpc3QgYXMgdGhlIGFjdGl2ZSBpdGVtIGluIEFSSUFcbiAqIGFjY2Vzc2liaWxpdHkgdGVybXMuXG4gKlxuICogSGFuZGxpbmcgQVJJQSBzZWxlY3Rpb24gc3RhdGUgcHJvcGVybHkgaXMgYWN0dWFsbHkgcXVpdGUgY29tcGxleDpcbiAqXG4gKiAqIFRoZSBpdGVtcyBpbiB0aGUgbGlzdCBuZWVkIHRvIGJlIGluZGljYXRlZCBhcyBwb3NzaWJsZSBpdGVtcyB2aWEgYW4gQVJJQVxuICogICBgcm9sZWAgYXR0cmlidXRlIHZhbHVlIHN1Y2ggYXMgXCJvcHRpb25cIi5cbiAqICogVGhlIHNlbGVjdGVkIGl0ZW0gbmVlZCB0byBiZSBtYXJrZWQgYXMgc2VsZWN0ZWQgYnkgc2V0dGluZyB0aGUgaXRlbSdzXG4gKiAgIGBhcmlhLXNlbGVjdGVkYCBhdHRyaWJ1dGUgdG8gdHJ1ZSAqYW5kKiB0aGUgb3RoZXIgaXRlbXMgbmVlZCBiZSBtYXJrZWQgYXNcbiAqICAgKm5vdCogc2VsZWN0ZWQgYnkgc2V0dGluZyBgYXJpYS1zZWxlY3RlZGAgdG8gZmFsc2UuXG4gKiAqIFRoZSBvdXRlcm1vc3QgZWxlbWVudCB3aXRoIHRoZSBrZXlib2FyZCBmb2N1cyBuZWVkcyB0byBoYXZlIGF0dHJpYnV0ZXNcbiAqICAgc2V0IG9uIGl0IHNvIHRoYXQgdGhlIHNlbGVjdGlvbiBpcyBrbm93YWJsZSBhdCB0aGUgbGlzdCBsZXZlbCB2aWEgdGhlXG4gKiAgIGBhcmlhLWFjdGl2ZWRlc2NlbmRhbnRgIGF0dHJpYnV0ZS5cbiAqICogVXNlIG9mIGBhcmlhLWFjdGl2ZWRlc2NlbmRhbnRgIGluIHR1cm4gcmVxdWlyZXMgdGhhdCBhbGwgaXRlbXMgaW4gdGhlXG4gKiAgIGxpc3QgaGF2ZSBJRCBhdHRyaWJ1dGVzIGFzc2lnbmVkIHRvIHRoZW0uXG4gKlxuICogVGhpcyBtaXhpbiB0cmllcyB0byBhZGRyZXNzIGFsbCBvZiB0aGUgYWJvdmUgcmVxdWlyZW1lbnRzLiBUbyB0aGF0IGVuZCxcbiAqIHRoaXMgbWl4aW4gd2lsbCBhc3NpZ24gZ2VuZXJhdGVkIElEcyB0byBhbnkgaXRlbSB0aGF0IGRvZXNuJ3QgYWxyZWFkeSBoYXZlXG4gKiBhbiBJRC5cbiAqXG4gKiBBUklBIHJlbGllcyBvbiBlbGVtZW50cyB0byBwcm92aWRlIGByb2xlYCBhdHRyaWJ1dGVzLiBUaGlzIG1peGluIHdpbGwgYXBwbHlcbiAqIGEgZGVmYXVsdCByb2xlIG9mIFwibGlzdGJveFwiIG9uIHRoZSBvdXRlciBsaXN0IGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBoYXZlIGFuXG4gKiBleHBsaWNpdCByb2xlLiBTaW1pbGFybHksIHRoaXMgbWl4aW4gd2lsbCBhcHBseSBhIGRlZmF1bHQgcm9sZSBvZiBcIm9wdGlvblwiXG4gKiB0byBhbnkgbGlzdCBpdGVtIHRoYXQgZG9lcyBub3QgYWxyZWFkeSBoYXZlIGEgcm9sZSBzcGVjaWZpZWQuXG4gKlxuICogVGhpcyBtaXhpbiBleHBlY3RzIGEgc2V0IG9mIG1lbWJlcnMgdGhhdCBtYW5hZ2UgdGhlIHN0YXRlIG9mIHRoZSBzZWxlY3Rpb246XG4gKiBgW3N5bWJvbHMuaXRlbVNlbGVjdGVkXWAsIGBbc3ltYm9scy5pdGVtQWRkZWRdYCwgYW5kIGBzZWxlY3RlZEl0ZW1gLiBZb3UgY2FuXG4gKiBzdXBwbHkgdGhlc2UgeW91cnNlbGYsIG9yIGRvIHNvIHZpYVxuICogW1NpbmdsZVNlbGVjdGlvbk1peGluXShTaW5nbGVTZWxlY3Rpb25NaXhpbi5tZCkuXG4gKlxuICogQG1vZHVsZVxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChiYXNlKSB7XG5cbiAgLyoqXG4gICAqIFRoZSBjbGFzcyBwcm90b3R5cGUgYWRkZWQgYnkgdGhlIG1peGluLlxuICAgKi9cbiAgY2xhc3MgU2VsZWN0aW9uQXJpYSBleHRlbmRzIGJhc2Uge1xuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICBpZiAoc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2spIHsgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTsgfVxuXG4gICAgICAvLyBTZXQgZGVmYXVsdCBBUklBIHJvbGUgZm9yIHRoZSBvdmVyYWxsIGNvbXBvbmVudC5cbiAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZSgncm9sZScpID09IG51bGwgJiYgdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS5yb2xlKSB7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdyb2xlJywgdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS5yb2xlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgW3N5bWJvbHMuZGVmYXVsdHNdKCkge1xuICAgICAgY29uc3QgZGVmYXVsdHMgPSBzdXBlcltzeW1ib2xzLmRlZmF1bHRzXSB8fCB7fTtcbiAgICAgIGRlZmF1bHRzLnJvbGUgPSAnbGlzdGJveCc7XG4gICAgICBkZWZhdWx0cy5pdGVtUm9sZSA9ICdvcHRpb24nO1xuICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIFtzeW1ib2xzLml0ZW1BZGRlZF0oaXRlbSkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbUFkZGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1BZGRlZF0oaXRlbSk7IH1cblxuICAgICAgaWYgKCFpdGVtLmdldEF0dHJpYnV0ZSgncm9sZScpKSB7XG4gICAgICAgIC8vIEFzc2lnbiBhIGRlZmF1bHQgQVJJQSByb2xlIGZvciBhbiBpbmRpdmlkdWFsIGl0ZW0uXG4gICAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdyb2xlJywgdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS5pdGVtUm9sZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEVuc3VyZSBlYWNoIGl0ZW0gaGFzIGFuIElEIHNvIHdlIGNhbiBzZXQgYXJpYS1hY3RpdmVkZXNjZW5kYW50IG9uIHRoZVxuICAgICAgLy8gb3ZlcmFsbCBsaXN0IHdoZW5ldmVyIHRoZSBzZWxlY3Rpb24gY2hhbmdlcy5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgSUQgd2lsbCB0YWtlIHRoZSBmb3JtIG9mIGEgYmFzZSBJRCBwbHVzIGEgdW5pcXVlIGludGVnZXIuIFRoZSBiYXNlXG4gICAgICAvLyBJRCB3aWxsIGJlIGluY29ycG9yYXRlIHRoZSBjb21wb25lbnQncyBvd24gSUQuIEUuZy4sIGlmIGEgY29tcG9uZW50IGhhc1xuICAgICAgLy8gSUQgXCJmb29cIiwgdGhlbiBpdHMgaXRlbXMgd2lsbCBoYXZlIElEcyB0aGF0IGxvb2sgbGlrZSBcIl9mb29PcHRpb24xXCIuIElmXG4gICAgICAvLyB0aGUgY29tcG5lbnQgaGFzIG5vIElEIGl0c2VsZiwgaXRzIGl0ZW1zIHdpbGwgZ2V0IElEcyB0aGF0IGxvb2sgbGlrZVxuICAgICAgLy8gXCJfb3B0aW9uMVwiLiBJdGVtIElEcyBhcmUgcHJlZml4ZWQgd2l0aCBhbiB1bmRlcnNjb3JlIHRvIGRpZmZlcmVudGlhdGVcbiAgICAgIC8vIHRoZW0gZnJvbSBtYW51YWxseS1hc3NpZ25lZCBJRHMsIGFuZCB0byBtaW5pbWl6ZSB0aGUgcG90ZW50aWFsIGZvciBJRFxuICAgICAgLy8gY29uZmxpY3RzLlxuICAgICAgaWYgKCFpdGVtLmlkKSB7XG4gICAgICAgIGNvbnN0IGJhc2VJZCA9IHRoaXMuaWQgP1xuICAgICAgICAgICAgXCJfXCIgKyB0aGlzLmlkICsgXCJPcHRpb25cIiA6XG4gICAgICAgICAgICBcIl9vcHRpb25cIjtcbiAgICAgICAgaXRlbS5pZCA9IGJhc2VJZCArIGlkQ291bnQrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKSB7IHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCk7IH1cbiAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdhcmlhLXNlbGVjdGVkJywgc2VsZWN0ZWQpO1xuICAgICAgY29uc3QgaXRlbUlkID0gaXRlbS5pZDtcbiAgICAgIGlmIChpdGVtSWQgJiYgc2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCcsIGl0ZW1JZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHNlbGVjdGVkSXRlbSgpIHtcbiAgICAgIHJldHVybiBzdXBlci5zZWxlY3RlZEl0ZW07XG4gICAgfVxuICAgIHNldCBzZWxlY3RlZEl0ZW0oaXRlbSkge1xuICAgICAgaWYgKCdzZWxlY3RlZEl0ZW0nIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLnNlbGVjdGVkSXRlbSA9IGl0ZW07IH1cbiAgICAgIGlmIChpdGVtID09IG51bGwpIHtcbiAgICAgICAgLy8gU2VsZWN0aW9uIHdhcyByZW1vdmVkLlxuICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1hY3RpdmVkZXNjZW5kYW50Jyk7XG4gICAgICB9XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gU2VsZWN0aW9uQXJpYTtcbn1cbiIsImltcG9ydCBTeW1ib2wgZnJvbSAnLi9TeW1ib2wnO1xuaW1wb3J0IHN5bWJvbHMgZnJvbSAnLi9zeW1ib2xzJztcblxuXG4vLyBTeW1ib2xzIGZvciBwcml2YXRlIGRhdGEgbWVtYmVycyBvbiBhbiBlbGVtZW50LlxuY29uc3QgY2FuU2VsZWN0TmV4dFN5bWJvbCA9IFN5bWJvbCgnY2FuU2VsZWN0TmV4dCcpO1xuY29uc3QgY2FuU2VsZWN0UHJldmlvdXNTeW1ib2wgPSBTeW1ib2woJ2NhblNlbGVjdFByZXZpb3VzJyk7XG5jb25zdCBzZWxlY3Rpb25SZXF1aXJlZFN5bWJvbCA9IFN5bWJvbCgnc2VsZWN0aW9uUmVxdWlyZWQnKTtcbmNvbnN0IHNlbGVjdGlvbldyYXBzU3ltYm9sID0gU3ltYm9sKCdzZWxlY3Rpb25XcmFwcycpO1xuXG4vLyBXZSB3YW50IHRvIGV4cG9zZSBib3RoIHNlbGVjdGVkSW5kZXggYW5kIHNlbGVjdGVkSXRlbSBhcyBpbmRlcGVuZGVudFxuLy8gcHJvcGVydGllcyBidXQga2VlcCB0aGVtIGluIHN5bmMuIFRoaXMgYWxsb3dzIGEgY29tcG9uZW50IHVzZXIgdG8gcmVmZXJlbmNlXG4vLyB0aGUgc2VsZWN0aW9uIGJ5IHdoYXRldmVyIG1lYW5zIGlzIG1vc3QgbmF0dXJhbCBmb3IgdGhlaXIgc2l0dWF0aW9uLlxuLy9cbi8vIFRvIGVmZmljaWVudGx5IGtlZXAgdGhlc2UgcHJvcGVydGllcyBpbiBzeW5jLCB3ZSB0cmFjayBcImV4dGVybmFsXCIgYW5kXG4vLyBcImludGVybmFsXCIgcmVmZXJlbmNlcyBmb3IgZWFjaCBwcm9wZXJ0eTpcbi8vXG4vLyBUaGUgZXh0ZXJuYWwgaW5kZXggb3IgaXRlbSBpcyB0aGUgb25lIHdlIHJlcG9ydCB0byB0aGUgb3V0c2lkZSB3b3JsZCB3aGVuXG4vLyBhc2tlZCBmb3Igc2VsZWN0aW9uLiAgV2hlbiBoYW5kbGluZyBhIGNoYW5nZSB0byBpbmRleCBvciBpdGVtLCB3ZSB1cGRhdGUgdGhlXG4vLyBleHRlcm5hbCByZWZlcmVuY2UgYXMgc29vbiBhcyBwb3NzaWJsZSwgc28gdGhhdCBpZiBhbnlvbmUgaW1tZWRpYXRlbHkgYXNrc1xuLy8gZm9yIHRoZSBjdXJyZW50IHNlbGVjdGlvbiwgdGhleSB3aWxsIHJlY2VpdmUgYSBzdGFibGUgYW5zd2VyLlxuLy9cbi8vIFRoZSBpbnRlcm5hbCBpbmRleCBvciBpdGVtIHRyYWNrcyB3aGljaGV2ZXIgaW5kZXggb3IgaXRlbSBsYXN0IHJlY2VpdmVkIHRoZVxuLy8gZnVsbCBzZXQgb2YgcHJvY2Vzc2luZy4gUHJvY2Vzc2luZyBpbmNsdWRlcyByYWlzaW5nIGEgY2hhbmdlIGV2ZW50IGZvciB0aGVcbi8vIG5ldyB2YWx1ZS4gT25jZSB3ZSd2ZSBiZWd1biB0aGF0IHByb2Nlc3NpbmcsIHdlIHN0b3JlIHRoZSBuZXcgdmFsdWUgYXMgdGhlXG4vLyBpbnRlcm5hbCB2YWx1ZSB0byBpbmRpY2F0ZSB3ZSd2ZSBoYW5kbGVkIGl0LlxuLy9cbmNvbnN0IGV4dGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbCA9IFN5bWJvbCgnZXh0ZXJuYWxTZWxlY3RlZEluZGV4Jyk7XG5jb25zdCBleHRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbCA9IFN5bWJvbCgnZXh0ZXJuYWxTZWxlY3RlZEl0ZW0nKTtcbmNvbnN0IGludGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbCA9IFN5bWJvbCgnaW50ZXJuYWxTZWxlY3RlZEluZGV4Jyk7XG5jb25zdCBpbnRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbCA9IFN5bWJvbCgnaW50ZXJuYWxTZWxlY3RlZEl0ZW0nKTtcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIGFkZHMgc2luZ2xlLXNlbGVjdGlvbiBzZW1hbnRpY3MgZm9yIGl0ZW1zIGluIGEgbGlzdC5cbiAqXG4gKiBUaGlzIG1peGluIGV4cGVjdHMgYSBjb21wb25lbnQgdG8gcHJvdmlkZSBhbiBgaXRlbXNgIEFycmF5IG9yIE5vZGVMaXN0IG9mXG4gKiBhbGwgZWxlbWVudHMgaW4gdGhlIGxpc3QuXG4gKlxuICogVGhpcyBtaXhpbiB0cmFja3MgYSBzaW5nbGUgc2VsZWN0ZWQgaXRlbSBpbiB0aGUgbGlzdCwgYW5kIHByb3ZpZGVzIG1lYW5zIHRvXG4gKiBnZXQgYW5kIHNldCB0aGF0IHN0YXRlIGJ5IGl0ZW0gcG9zaXRpb24gKGBzZWxlY3RlZEluZGV4YCkgb3IgaXRlbSBpZGVudGl0eVxuICogKGBzZWxlY3RlZEl0ZW1gKS4gVGhlIHNlbGVjdGlvbiBjYW4gYmUgbW92ZWQgaW4gdGhlIGxpc3QgdmlhIHRoZSBtZXRob2RzXG4gKiBgc2VsZWN0Rmlyc3RgLCBgc2VsZWN0TGFzdGAsIGBzZWxlY3ROZXh0YCwgYW5kIGBzZWxlY3RQcmV2aW91c2AuXG4gKlxuICogVGhpcyBtaXhpbiBkb2VzIG5vdCBwcm9kdWNlIGFueSB1c2VyLXZpc2libGUgZWZmZWN0cyB0byByZXByZXNlbnRcbiAqIHNlbGVjdGlvbi5cbiAqXG4gKiBAbW9kdWxlIFNpbmdsZVNlbGVjdGlvbk1peGluXG4gKiBAcGFyYW0gYmFzZSB7Q2xhc3N9IHRoZSBiYXNlIGNsYXNzIHRvIGV4dGVuZFxuICogQHJldHVybnMge0NsYXNzfSB0aGUgZXh0ZW5kZWQgY2xhc3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU2luZ2xlU2VsZWN0aW9uTWl4aW4oYmFzZSkge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIFNpbmdsZVNlbGVjdGlvbiBleHRlbmRzIGJhc2Uge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICBzdXBlcigpO1xuICAgICAgLy8gU2V0IGRlZmF1bHRzLlxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNlbGVjdGlvblJlcXVpcmVkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLnNlbGVjdGlvblJlcXVpcmVkID0gdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS5zZWxlY3Rpb25SZXF1aXJlZDtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zZWxlY3Rpb25XcmFwcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb25XcmFwcyA9IHRoaXNbc3ltYm9scy5kZWZhdWx0c10uc2VsZWN0aW9uV3JhcHM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJ1ZSBpZiB0aGUgc2VsZWN0aW9uIGNhbiBiZSBtb3ZlZCB0byB0aGUgbmV4dCBpdGVtLCBmYWxzZSBpZiBub3QgKHRoZVxuICAgICAqIHNlbGVjdGVkIGl0ZW0gaXMgdGhlIGxhc3QgaXRlbSBpbiB0aGUgbGlzdCkuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgY2FuU2VsZWN0TmV4dCgpIHtcbiAgICAgIHJldHVybiB0aGlzW2NhblNlbGVjdE5leHRTeW1ib2xdO1xuICAgIH1cbiAgICBzZXQgY2FuU2VsZWN0TmV4dChjYW5TZWxlY3ROZXh0KSB7XG4gICAgICBjb25zdCBjaGFuZ2VkID0gY2FuU2VsZWN0TmV4dCAhPT0gdGhpc1tjYW5TZWxlY3ROZXh0U3ltYm9sXTtcbiAgICAgIHRoaXNbY2FuU2VsZWN0TmV4dFN5bWJvbF0gPSBjYW5TZWxlY3ROZXh0O1xuICAgICAgaWYgKCdjYW5TZWxlY3ROZXh0JyBpbiBiYXNlLnByb3RvdHlwZSkgeyBzdXBlci5jYW5TZWxlY3ROZXh0ID0gY2FuU2VsZWN0TmV4dDsgfVxuICAgICAgaWYgKHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10gJiYgY2hhbmdlZCkge1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdjYW4tc2VsZWN0LW5leHQtY2hhbmdlZCcpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcnVlIGlmIHRoZSBzZWxlY3Rpb24gY2FuIGJlIG1vdmVkIHRvIHRoZSBwcmV2aW91cyBpdGVtLCBmYWxzZSBpZiBub3RcbiAgICAgKiAodGhlIHNlbGVjdGVkIGl0ZW0gaXMgdGhlIGZpcnN0IG9uZSBpbiB0aGUgbGlzdCkuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXQgY2FuU2VsZWN0UHJldmlvdXMoKSB7XG4gICAgICByZXR1cm4gdGhpc1tjYW5TZWxlY3RQcmV2aW91c1N5bWJvbF07XG4gICAgfVxuICAgIHNldCBjYW5TZWxlY3RQcmV2aW91cyhjYW5TZWxlY3RQcmV2aW91cykge1xuICAgICAgY29uc3QgY2hhbmdlZCA9IGNhblNlbGVjdFByZXZpb3VzICE9PSB0aGlzW2NhblNlbGVjdFByZXZpb3VzU3ltYm9sXTtcbiAgICAgIHRoaXNbY2FuU2VsZWN0UHJldmlvdXNTeW1ib2xdID0gY2FuU2VsZWN0UHJldmlvdXM7XG4gICAgICBpZiAoJ2NhblNlbGVjdFByZXZpb3VzJyBpbiBiYXNlLnByb3RvdHlwZSkgeyBzdXBlci5jYW5TZWxlY3RQcmV2aW91cyA9IGNhblNlbGVjdFByZXZpb3VzOyB9XG4gICAgICBpZiAodGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSAmJiBjaGFuZ2VkKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2Nhbi1zZWxlY3QtcHJldmlvdXMtY2hhbmdlZCcpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgW3N5bWJvbHMuZGVmYXVsdHNdKCkge1xuICAgICAgY29uc3QgZGVmYXVsdHMgPSBzdXBlcltzeW1ib2xzLmRlZmF1bHRzXSB8fCB7fTtcbiAgICAgIGRlZmF1bHRzLnNlbGVjdGlvblJlcXVpcmVkID0gZmFsc2U7XG4gICAgICBkZWZhdWx0cy5zZWxlY3Rpb25XcmFwcyA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBhIG5ldyBpdGVtIGJlaW5nIGFkZGVkIHRvIHRoZSBsaXN0LlxuICAgICAqXG4gICAgICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2Qgc2ltcGx5IHNldHMgdGhlIGl0ZW0nc1xuICAgICAqIHNlbGVjdGlvbiBzdGF0ZSB0byBmYWxzZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGl0ZW0gLSB0aGUgaXRlbSBiZWluZyBhZGRlZFxuICAgICAqL1xuICAgIFtzeW1ib2xzLml0ZW1BZGRlZF0oaXRlbSkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbUFkZGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1BZGRlZF0oaXRlbSk7IH1cbiAgICAgIHRoaXNbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIGl0ZW0gPT09IHRoaXMuc2VsZWN0ZWRJdGVtKTtcbiAgICB9XG5cbiAgICBbc3ltYm9scy5pdGVtc0NoYW5nZWRdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbXNDaGFuZ2VkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1zQ2hhbmdlZF0oKTsgfVxuXG4gICAgICAvLyBJbiBjYXNlIHNlbGVjdGVkIGl0ZW0gY2hhbmdlZCBwb3NpdGlvbiBvciB3YXMgcmVtb3ZlZC5cbiAgICAgIHRyYWNrU2VsZWN0ZWRJdGVtKHRoaXMpO1xuXG4gICAgICAvLyBJbiBjYXNlIHRoZSBjaGFuZ2UgaW4gaXRlbXMgYWZmZWN0ZWQgd2hpY2ggbmF2aWdhdGlvbnMgYXJlIHBvc3NpYmxlLlxuICAgICAgdXBkYXRlUG9zc2libGVOYXZpZ2F0aW9ucyh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcHBseSB0aGUgaW5kaWNhdGUgc2VsZWN0aW9uIHN0YXRlIHRvIHRoZSBpdGVtLlxuICAgICAqXG4gICAgICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLiBVc2VyLXZpc2libGVcbiAgICAgKiBlZmZlY3RzIHdpbGwgdHlwaWNhbGx5IGJlIGhhbmRsZWQgYnkgb3RoZXIgbWl4aW5zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaXRlbSAtIHRoZSBpdGVtIGJlaW5nIHNlbGVjdGVkL2Rlc2VsZWN0ZWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNlbGVjdGVkIC0gdHJ1ZSBpZiB0aGUgaXRlbSBpcyBzZWxlY3RlZCwgZmFsc2UgaWYgbm90XG4gICAgICovXG4gICAgW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpOyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGluZGV4IG9mIHRoZSBpdGVtIHdoaWNoIGlzIGN1cnJlbnRseSBzZWxlY3RlZC5cbiAgICAgKlxuICAgICAqIFRoZSBzZXR0ZXIgZXhwZWN0cyBhbiBpbnRlZ2VyIG9yIGEgc3RyaW5nIHJlcHJlc2VudGluZyBhbiBpbnRlZ2VyLlxuICAgICAqXG4gICAgICogQSBgc2VsZWN0ZWRJbmRleGAgb2YgLTEgaW5kaWNhdGVzIHRoZXJlIGlzIG5vIHNlbGVjdGlvbi4gU2V0dGluZyB0aGlzXG4gICAgICogcHJvcGVydHkgdG8gLTEgd2lsbCByZW1vdmUgYW55IGV4aXN0aW5nIHNlbGVjdGlvbi5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7XG4gICAgICByZXR1cm4gdGhpc1tleHRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2xdICE9IG51bGwgP1xuICAgICAgICB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbF0gOlxuICAgICAgICAtMTtcbiAgICB9XG4gICAgc2V0IHNlbGVjdGVkSW5kZXgoaW5kZXgpIHtcbiAgICAgIC8vIFNlZSBub3RlcyBhdCB0b3AgYWJvdXQgaW50ZXJuYWwgdnMuIGV4dGVybmFsIGNvcGllcyBvZiB0aGlzIHByb3BlcnR5LlxuICAgICAgY29uc3QgY2hhbmdlZCA9IGluZGV4ICE9PSB0aGlzW2ludGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbF07XG4gICAgICBsZXQgaXRlbTtcbiAgICAgIGxldCBwYXJzZWRJbmRleCA9IHBhcnNlSW50KGluZGV4KTtcbiAgICAgIGlmIChwYXJzZWRJbmRleCAhPT0gdGhpc1tleHRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2xdKSB7XG4gICAgICAgIC8vIFN0b3JlIHRoZSBuZXcgaW5kZXggYW5kIHRoZSBjb3JyZXNwb25kaW5nIGl0ZW0uXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5pdGVtcztcbiAgICAgICAgY29uc3QgaGFzSXRlbXMgPSBpdGVtcyAmJiBpdGVtcy5sZW5ndGggPiAwO1xuICAgICAgICBpZiAoIShoYXNJdGVtcyAmJiBwYXJzZWRJbmRleCA+PSAwICYmIHBhcnNlZEluZGV4IDwgaXRlbXMubGVuZ3RoKSkge1xuICAgICAgICAgIHBhcnNlZEluZGV4ID0gLTE7IC8vIE5vIGl0ZW0gYXQgdGhhdCBpbmRleC5cbiAgICAgICAgfVxuICAgICAgICB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbF0gPSBwYXJzZWRJbmRleDtcbiAgICAgICAgaXRlbSA9IGhhc0l0ZW1zICYmIHBhcnNlZEluZGV4ID49IDAgPyBpdGVtc1twYXJzZWRJbmRleF0gOiBudWxsO1xuICAgICAgICB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sXSA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtID0gdGhpc1tleHRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbF07XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdyBsZXQgc3VwZXIgZG8gYW55IHdvcmsuXG4gICAgICBpZiAoJ3NlbGVjdGVkSW5kZXgnIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLnNlbGVjdGVkSW5kZXggPSBpbmRleDsgfVxuXG4gICAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICAvLyBUaGUgc2VsZWN0ZWQgaW5kZXggY2hhbmdlZC5cbiAgICAgICAgdGhpc1tpbnRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2xdID0gcGFyc2VkSW5kZXg7XG5cbiAgICAgICAgaWYgKHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10pIHtcbiAgICAgICAgICBjb25zdCBldmVudCA9IG5ldyBDdXN0b21FdmVudCgnc2VsZWN0ZWQtaW5kZXgtY2hhbmdlZCcsIHtcbiAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICBzZWxlY3RlZEluZGV4OiBwYXJzZWRJbmRleCxcbiAgICAgICAgICAgICAgdmFsdWU6IHBhcnNlZEluZGV4IC8vIGZvciBQb2x5bWVyIGJpbmRpbmcuIFRPRE86IFZlcmlmeSBzdGlsbCBuZWNlc3NhcnlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzW2ludGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sXSAhPT0gaXRlbSkge1xuICAgICAgICAvLyBVcGRhdGUgc2VsZWN0ZWRJdGVtIHByb3BlcnR5IHNvIGl0IGNhbiBoYXZlIGl0cyBvd24gZWZmZWN0cy5cbiAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0gPSBpdGVtO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaXRlbSwgb3IgbnVsbCBpZiB0aGVyZSBpcyBubyBzZWxlY3Rpb24uXG4gICAgICpcbiAgICAgKiBTZXR0aW5nIHRoaXMgcHJvcGVydHkgdG8gbnVsbCBkZXNlbGVjdHMgYW55IGN1cnJlbnRseS1zZWxlY3RlZCBpdGVtLlxuICAgICAqIFNldHRpbmcgdGhpcyBwcm9wZXJ0eSB0byBhbiBvYmplY3QgdGhhdCBpcyBub3QgaW4gdGhlIGxpc3QgaGFzIG5vIGVmZmVjdC5cbiAgICAgKlxuICAgICAqIFRPRE86IEV2ZW4gaWYgc2VsZWN0aW9uUmVxdWlyZWQsIGNhbiBzdGlsbCBleHBsaWNpdGx5IHNldCBzZWxlY3RlZEl0ZW0gdG8gbnVsbC5cbiAgICAgKiBUT0RPOiBJZiBzZWxlY3Rpb25SZXF1aXJlZCwgbGVhdmUgc2VsZWN0aW9uIGFsb25lP1xuICAgICAqXG4gICAgICogQHR5cGUge29iamVjdH1cbiAgICAgKi9cbiAgICBnZXQgc2VsZWN0ZWRJdGVtKCkge1xuICAgICAgcmV0dXJuIHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2xdIHx8IG51bGw7XG4gICAgfVxuICAgIHNldCBzZWxlY3RlZEl0ZW0oaXRlbSkge1xuICAgICAgLy8gU2VlIG5vdGVzIGF0IHRvcCBhYm91dCBpbnRlcm5hbCB2cy4gZXh0ZXJuYWwgY29waWVzIG9mIHRoaXMgcHJvcGVydHkuXG4gICAgICBjb25zdCBwcmV2aW91c1NlbGVjdGVkSXRlbSA9IHRoaXNbaW50ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2xdO1xuICAgICAgY29uc3QgY2hhbmdlZCA9IGl0ZW0gIT09IHByZXZpb3VzU2VsZWN0ZWRJdGVtO1xuICAgICAgbGV0IGluZGV4O1xuICAgICAgaWYgKGl0ZW0gIT09IHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2xdKSB7XG4gICAgICAgIC8vIFN0b3JlIGl0ZW0gYW5kIGxvb2sgdXAgY29ycmVzcG9uZGluZyBpbmRleC5cbiAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLml0ZW1zO1xuICAgICAgICBjb25zdCBoYXNJdGVtcyA9IGl0ZW1zICYmIGl0ZW1zLmxlbmd0aCA+IDA7XG4gICAgICAgIGluZGV4ID0gaGFzSXRlbXMgPyBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGl0ZW1zLCBpdGVtKSA6IC0xO1xuICAgICAgICB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbF0gPSBpbmRleDtcbiAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgIGl0ZW0gPSBudWxsOyAvLyBUaGUgaW5kaWNhdGVkIGl0ZW0gaXNuJ3QgYWN0dWFsbHkgaW4gYGl0ZW1zYC5cbiAgICAgICAgfVxuICAgICAgICB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sXSA9IGl0ZW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmRleCA9IHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sXTtcbiAgICAgIH1cblxuICAgICAgLy8gTm93IGxldCBzdXBlciBkbyBhbnkgd29yay5cbiAgICAgIGlmICgnc2VsZWN0ZWRJdGVtJyBpbiBiYXNlLnByb3RvdHlwZSkgeyBzdXBlci5zZWxlY3RlZEl0ZW0gPSBpdGVtOyB9XG5cbiAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgIC8vIFRoZSBzZWxlY3RlZCBpdGVtIGNoYW5nZWQuXG4gICAgICAgIHRoaXNbaW50ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2xdID0gaXRlbTtcblxuICAgICAgICBpZiAocHJldmlvdXNTZWxlY3RlZEl0ZW0pIHtcbiAgICAgICAgICAvLyBVcGRhdGUgc2VsZWN0aW9uIHN0YXRlIG9mIG9sZCBpdGVtLlxuICAgICAgICAgIHRoaXNbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKHByZXZpb3VzU2VsZWN0ZWRJdGVtLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAvLyBVcGRhdGUgc2VsZWN0aW9uIHN0YXRlIHRvIG5ldyBpdGVtLlxuICAgICAgICAgIHRoaXNbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlUG9zc2libGVOYXZpZ2F0aW9ucyh0aGlzKTtcblxuICAgICAgICBpZiAodGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSkge1xuICAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdzZWxlY3RlZC1pdGVtLWNoYW5nZWQnLCB7XG4gICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtOiBpdGVtLFxuICAgICAgICAgICAgICB2YWx1ZTogaXRlbSAvLyBmb3IgUG9seW1lciBiaW5kaW5nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpc1tpbnRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2xdICE9PSBpbmRleCkge1xuICAgICAgICAvLyBVcGRhdGUgc2VsZWN0ZWRJbmRleCBwcm9wZXJ0eSBzbyBpdCBjYW4gaGF2ZSBpdHMgb3duIGVmZmVjdHMuXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbGVjdCB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgbGlzdC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSBzZWxlY3Rpb24gY2hhbmdlZCwgZmFsc2UgaWYgbm90LlxuICAgICAqL1xuICAgIHNlbGVjdEZpcnN0KCkge1xuICAgICAgaWYgKHN1cGVyLnNlbGVjdEZpcnN0KSB7IHN1cGVyLnNlbGVjdEZpcnN0KCk7IH1cbiAgICAgIHJldHVybiBzZWxlY3RJbmRleCh0aGlzLCAwKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcnVlIGlmIHRoZSBsaXN0IHNob3VsZCBhbHdheXMgaGF2ZSBhIHNlbGVjdGlvbiAoaWYgaXQgaGFzIGl0ZW1zKS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgZ2V0IHNlbGVjdGlvblJlcXVpcmVkKCkge1xuICAgICAgcmV0dXJuIHRoaXNbc2VsZWN0aW9uUmVxdWlyZWRTeW1ib2xdO1xuICAgIH1cbiAgICBzZXQgc2VsZWN0aW9uUmVxdWlyZWQoc2VsZWN0aW9uUmVxdWlyZWQpIHtcbiAgICAgIHRoaXNbc2VsZWN0aW9uUmVxdWlyZWRTeW1ib2xdID0gc2VsZWN0aW9uUmVxdWlyZWQ7XG4gICAgICBpZiAoJ3NlbGVjdGlvblJlcXVpcmVkJyBpbiBiYXNlLnByb3RvdHlwZSkgeyBzdXBlci5zZWxlY3Rpb25SZXF1aXJlZCA9IHNlbGVjdGlvblJlcXVpcmVkOyB9XG4gICAgICB0cmFja1NlbGVjdGVkSXRlbSh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcnVlIGlmIHNlbGVjdGlvbiBuYXZpZ2F0aW9ucyB3cmFwIGZyb20gbGFzdCB0byBmaXJzdCwgYW5kIHZpY2UgdmVyc2EuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAqL1xuICAgIGdldCBzZWxlY3Rpb25XcmFwcygpIHtcbiAgICAgIHJldHVybiB0aGlzW3NlbGVjdGlvbldyYXBzU3ltYm9sXTtcbiAgICB9XG4gICAgc2V0IHNlbGVjdGlvbldyYXBzKHZhbHVlKSB7XG4gICAgICB0aGlzW3NlbGVjdGlvbldyYXBzU3ltYm9sXSA9IFN0cmluZyh2YWx1ZSkgPT09ICd0cnVlJztcbiAgICAgIGlmICgnc2VsZWN0aW9uV3JhcHMnIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLnNlbGVjdGlvbldyYXBzID0gdmFsdWU7IH1cbiAgICAgIHVwZGF0ZVBvc3NpYmxlTmF2aWdhdGlvbnModGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VsZWN0IHRoZSBsYXN0IGl0ZW0gaW4gdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgc2VsZWN0aW9uIGNoYW5nZWQsIGZhbHNlIGlmIG5vdC5cbiAgICAgKi9cbiAgICBzZWxlY3RMYXN0KCkge1xuICAgICAgaWYgKHN1cGVyLnNlbGVjdExhc3QpIHsgc3VwZXIuc2VsZWN0TGFzdCgpOyB9XG4gICAgICByZXR1cm4gc2VsZWN0SW5kZXgodGhpcywgdGhpcy5pdGVtcy5sZW5ndGggLSAxKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZWxlY3QgdGhlIG5leHQgaXRlbSBpbiB0aGUgbGlzdC5cbiAgICAgKlxuICAgICAqIElmIHRoZSBsaXN0IGhhcyBubyBzZWxlY3Rpb24sIHRoZSBmaXJzdCBpdGVtIHdpbGwgYmUgc2VsZWN0ZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgc2VsZWN0aW9uIGNoYW5nZWQsIGZhbHNlIGlmIG5vdC5cbiAgICAgKi9cbiAgICBzZWxlY3ROZXh0KCkge1xuICAgICAgaWYgKHN1cGVyLnNlbGVjdE5leHQpIHsgc3VwZXIuc2VsZWN0TmV4dCgpOyB9XG4gICAgICByZXR1cm4gc2VsZWN0SW5kZXgodGhpcywgdGhpcy5zZWxlY3RlZEluZGV4ICsgMSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VsZWN0IHRoZSBwcmV2aW91cyBpdGVtIGluIHRoZSBsaXN0LlxuICAgICAqXG4gICAgICogSWYgdGhlIGxpc3QgaGFzIG5vIHNlbGVjdGlvbiwgdGhlIGxhc3QgaXRlbSB3aWxsIGJlIHNlbGVjdGVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIHNlbGVjdGlvbiBjaGFuZ2VkLCBmYWxzZSBpZiBub3QuXG4gICAgICovXG4gICAgc2VsZWN0UHJldmlvdXMoKSB7XG4gICAgICBpZiAoc3VwZXIuc2VsZWN0UHJldmlvdXMpIHsgc3VwZXIuc2VsZWN0UHJldmlvdXMoKTsgfVxuICAgICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLnNlbGVjdGVkSW5kZXggPCAwID9cbiAgICAgICAgdGhpcy5pdGVtcy5sZW5ndGggLSAxIDogICAgIC8vIE5vIHNlbGVjdGlvbiB5ZXQ7IHNlbGVjdCBsYXN0IGl0ZW0uXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCAtIDE7XG4gICAgICByZXR1cm4gc2VsZWN0SW5kZXgodGhpcywgbmV3SW5kZXgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGNhblNlbGVjdE5leHQgcHJvcGVydHkgY2hhbmdlcyBpbiByZXNwb25zZSB0byBpbnRlcm5hbFxuICAgICAqIGNvbXBvbmVudCBhY3Rpdml0eS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBTaW5nbGVTZWxlY3Rpb25cbiAgICAgKiBAZXZlbnQgY2FuLXNlbGVjdC1uZXh0LWNoYW5nZWRcbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGNhblNlbGVjdFByZXZpb3VzIHByb3BlcnR5IGNoYW5nZXMgaW4gcmVzcG9uc2UgdG8gaW50ZXJuYWxcbiAgICAgKiBjb21wb25lbnQgYWN0aXZpdHkuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgU2luZ2xlU2VsZWN0aW9uXG4gICAgICogQGV2ZW50IGNhbi1zZWxlY3QtcHJldmlvdXMtY2hhbmdlZFxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgc2VsZWN0ZWRJbmRleCBwcm9wZXJ0eSBjaGFuZ2VzIGluIHJlc3BvbnNlIHRvIGludGVybmFsXG4gICAgICogY29tcG9uZW50IGFjdGl2aXR5LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIFNpbmdsZVNlbGVjdGlvblxuICAgICAqIEBldmVudCBzZWxlY3RlZC1pbmRleC1jaGFuZ2VkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRldGFpbC5zZWxlY3RlZEluZGV4IFRoZSBuZXcgc2VsZWN0ZWQgaW5kZXguXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBzZWxlY3RlZEl0ZW0gcHJvcGVydHkgY2hhbmdlcyBpbiByZXNwb25zZSB0byBpbnRlcm5hbFxuICAgICAqIGNvbXBvbmVudCBhY3Rpdml0eS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBTaW5nbGVTZWxlY3Rpb25cbiAgICAgKiBAZXZlbnQgc2VsZWN0ZWQtaXRlbS1jaGFuZ2VkXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZGV0YWlsLnNlbGVjdGVkSXRlbSBUaGUgbmV3IHNlbGVjdGVkIGl0ZW0uXG4gICAgICovXG5cbiAgfVxuXG4gIHJldHVybiBTaW5nbGVTZWxlY3Rpb247XG59XG5cblxuLy8gRW5zdXJlIHRoZSBnaXZlbiBpbmRleCBpcyB3aXRoaW4gYm91bmRzLCBhbmQgc2VsZWN0IGl0IGlmIGl0J3Mgbm90IGFscmVhZHlcbi8vIHNlbGVjdGVkLlxuZnVuY3Rpb24gc2VsZWN0SW5kZXgoZWxlbWVudCwgaW5kZXgpIHtcblxuICBjb25zdCBpdGVtcyA9IGVsZW1lbnQuaXRlbXM7XG4gIGlmIChpdGVtcyA9PSBudWxsKSB7XG4gICAgLy8gTm90aGluZyB0byBzZWxlY3QuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgY291bnQgPSBpdGVtcy5sZW5ndGg7XG4gIGNvbnN0IGJvdW5kZWRJbmRleCA9IGVsZW1lbnQuc2VsZWN0aW9uV3JhcHMgP1xuICAgIC8vIEphdmFTY3JpcHQgbW9kIGRvZXNuJ3QgaGFuZGxlIG5lZ2F0aXZlIG51bWJlcnMgdGhlIHdheSB3ZSB3YW50IHRvIHdyYXAuXG4gICAgLy8gU2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE4NjE4MjUwLzc2NDcyXG4gICAgKChpbmRleCAlIGNvdW50KSArIGNvdW50KSAlIGNvdW50IDpcblxuICAgIC8vIEtlZXAgaW5kZXggd2l0aGluIGJvdW5kcyBvZiBhcnJheS5cbiAgICBNYXRoLm1heChNYXRoLm1pbihpbmRleCwgY291bnQgLSAxKSwgMCk7XG5cbiAgY29uc3QgcHJldmlvdXNJbmRleCA9IGVsZW1lbnQuc2VsZWN0ZWRJbmRleDtcbiAgaWYgKHByZXZpb3VzSW5kZXggIT09IGJvdW5kZWRJbmRleCkge1xuICAgIGVsZW1lbnQuc2VsZWN0ZWRJbmRleCA9IGJvdW5kZWRJbmRleDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLy8gRm9sbG93aW5nIGEgY2hhbmdlIGluIHRoZSBzZXQgb2YgaXRlbXMsIG9yIGluIHRoZSB2YWx1ZSBvZiB0aGVcbi8vIGBzZWxlY3Rpb25SZXF1aXJlZGAgcHJvcGVydHksIHJlYWNxdWlyZSB0aGUgc2VsZWN0ZWQgaXRlbS4gSWYgaXQncyBtb3ZlZCxcbi8vIHVwZGF0ZSBgc2VsZWN0ZWRJbmRleGAuIElmIGl0J3MgYmVlbiByZW1vdmVkLCBhbmQgYSBzZWxlY3Rpb24gaXMgcmVxdWlyZWQsXG4vLyB0cnkgdG8gc2VsZWN0IGFub3RoZXIgaXRlbS5cbmZ1bmN0aW9uIHRyYWNrU2VsZWN0ZWRJdGVtKGVsZW1lbnQpIHtcblxuICBjb25zdCBpdGVtcyA9IGVsZW1lbnQuaXRlbXM7XG4gIGNvbnN0IGl0ZW1Db3VudCA9IGl0ZW1zID8gaXRlbXMubGVuZ3RoIDogMDtcblxuICBjb25zdCBwcmV2aW91c1NlbGVjdGVkSXRlbSA9IGVsZW1lbnQuc2VsZWN0ZWRJdGVtO1xuICBpZiAoIXByZXZpb3VzU2VsZWN0ZWRJdGVtKSB7XG4gICAgLy8gTm8gaXRlbSB3YXMgcHJldmlvdXNseSBzZWxlY3RlZC5cbiAgICBpZiAoZWxlbWVudC5zZWxlY3Rpb25SZXF1aXJlZCkge1xuICAgICAgLy8gU2VsZWN0IHRoZSBmaXJzdCBpdGVtIGJ5IGRlZmF1bHQuXG4gICAgICBlbGVtZW50LnNlbGVjdGVkSW5kZXggPSAwO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpdGVtQ291bnQgPT09IDApIHtcbiAgICAvLyBXZSd2ZSBsb3N0IHRoZSBzZWxlY3Rpb24sIGFuZCB0aGVyZSdzIG5vdGhpbmcgbGVmdCB0byBzZWxlY3QuXG4gICAgZWxlbWVudC5zZWxlY3RlZEl0ZW0gPSBudWxsO1xuICB9IGVsc2Uge1xuICAgIC8vIFRyeSB0byBmaW5kIHRoZSBwcmV2aW91c2x5LXNlbGVjdGVkIGl0ZW0gaW4gdGhlIGN1cnJlbnQgc2V0IG9mIGl0ZW1zLlxuICAgIGNvbnN0IGluZGV4SW5DdXJyZW50SXRlbXMgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGl0ZW1zLCBwcmV2aW91c1NlbGVjdGVkSXRlbSk7XG4gICAgY29uc3QgcHJldmlvdXNTZWxlY3RlZEluZGV4ID0gZWxlbWVudC5zZWxlY3RlZEluZGV4O1xuICAgIGlmIChpbmRleEluQ3VycmVudEl0ZW1zIDwgMCkge1xuICAgICAgLy8gUHJldmlvdXNseS1zZWxlY3RlZCBpdGVtIHdhcyByZW1vdmVkIGZyb20gdGhlIGl0ZW1zLlxuICAgICAgLy8gU2VsZWN0IHRoZSBpdGVtIGF0IHRoZSBzYW1lIGluZGV4IChpZiBpdCBleGlzdHMpIG9yIGFzIGNsb3NlIGFzIHBvc3NpYmxlLlxuICAgICAgY29uc3QgbmV3U2VsZWN0ZWRJbmRleCA9IE1hdGgubWluKHByZXZpb3VzU2VsZWN0ZWRJbmRleCwgaXRlbUNvdW50IC0gMSk7XG4gICAgICAvLyBTZWxlY3QgYnkgaXRlbSwgc2luY2UgaW5kZXggbWF5IGJlIHRoZSBzYW1lLCBhbmQgd2Ugd2FudCB0byByYWlzZSB0aGVcbiAgICAgIC8vIHNlbGVjdGVkLWl0ZW0tY2hhbmdlZCBldmVudC5cbiAgICAgIGVsZW1lbnQuc2VsZWN0ZWRJdGVtID0gaXRlbXNbbmV3U2VsZWN0ZWRJbmRleF07XG4gICAgfSBlbHNlIGlmIChpbmRleEluQ3VycmVudEl0ZW1zICE9PSBwcmV2aW91c1NlbGVjdGVkSW5kZXgpIHtcbiAgICAgIC8vIFByZXZpb3VzbHktc2VsZWN0ZWQgaXRlbSBzdGlsbCB0aGVyZSwgYnV0IGNoYW5nZWQgcG9zaXRpb24uXG4gICAgICBlbGVtZW50LnNlbGVjdGVkSW5kZXggPSBpbmRleEluQ3VycmVudEl0ZW1zO1xuICAgIH1cbiAgfVxufVxuXG4vLyBGb2xsb3dpbmcgYSBjaGFuZ2UgaW4gc2VsZWN0aW9uLCByZXBvcnQgd2hldGhlciBpdCdzIG5vdyBwb3NzaWJsZSB0b1xuLy8gZ28gbmV4dC9wcmV2aW91cyBmcm9tIHRoZSBnaXZlbiBpbmRleC5cbmZ1bmN0aW9uIHVwZGF0ZVBvc3NpYmxlTmF2aWdhdGlvbnMoZWxlbWVudCkge1xuICBsZXQgY2FuU2VsZWN0TmV4dDtcbiAgbGV0IGNhblNlbGVjdFByZXZpb3VzO1xuICBjb25zdCBpdGVtcyA9IGVsZW1lbnQuaXRlbXM7XG4gIGlmIChpdGVtcyA9PSBudWxsIHx8IGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIE5vIGl0ZW1zIHRvIHNlbGVjdC5cbiAgICBjYW5TZWxlY3ROZXh0ID0gZmFsc2U7XG4gICAgY2FuU2VsZWN0UHJldmlvdXMgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChlbGVtZW50LnNlbGVjdGlvbldyYXBzKSB7XG4gICAgLy8gU2luY2UgdGhlcmUgYXJlIGl0ZW1zLCBjYW4gYWx3YXlzIGdvIG5leHQvcHJldmlvdXMuXG4gICAgY2FuU2VsZWN0TmV4dCA9IHRydWU7XG4gICAgY2FuU2VsZWN0UHJldmlvdXMgPSB0cnVlO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGluZGV4ID0gZWxlbWVudC5zZWxlY3RlZEluZGV4O1xuICAgIGlmIChpbmRleCA8IDAgJiYgaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgLy8gU3BlY2lhbCBjYXNlLiBJZiB0aGVyZSBhcmUgaXRlbXMgYnV0IG5vIHNlbGVjdGlvbiwgZGVjbGFyZSB0aGF0IGl0J3NcbiAgICAgIC8vIGFsd2F5cyBwb3NzaWJsZSB0byBnbyBuZXh0L3ByZXZpb3VzIHRvIGNyZWF0ZSBhIHNlbGVjdGlvbi5cbiAgICAgIGNhblNlbGVjdE5leHQgPSB0cnVlO1xuICAgICAgY2FuU2VsZWN0UHJldmlvdXMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb3JtYWwgY2FzZTogd2UgaGF2ZSBhbiBpbmRleCBpbiBhIGxpc3QgdGhhdCBoYXMgaXRlbXMuXG4gICAgICBjYW5TZWxlY3RQcmV2aW91cyA9IChpbmRleCA+IDApO1xuICAgICAgY2FuU2VsZWN0TmV4dCA9IChpbmRleCA8IGl0ZW1zLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxuICBpZiAoZWxlbWVudC5jYW5TZWxlY3ROZXh0ICE9PSBjYW5TZWxlY3ROZXh0KSB7XG4gICAgZWxlbWVudC5jYW5TZWxlY3ROZXh0ID0gY2FuU2VsZWN0TmV4dDtcbiAgfVxuICBpZiAoZWxlbWVudC5jYW5TZWxlY3RQcmV2aW91cyAhPT0gY2FuU2VsZWN0UHJldmlvdXMpIHtcbiAgICBlbGVtZW50LmNhblNlbGVjdFByZXZpb3VzID0gY2FuU2VsZWN0UHJldmlvdXM7XG4gIH1cbn1cbiIsIi8qIFRoZSBudW1iZXIgb2YgZmFrZSBzeW1ib2xzIHdlJ3ZlIHNlcnZlZCB1cCAqL1xubGV0IGNvdW50ID0gMDtcblxuZnVuY3Rpb24gdW5pcXVlU3RyaW5nKGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBgXyR7ZGVzY3JpcHRpb259JHtjb3VudCsrfWA7XG59XG5cbmNvbnN0IHN5bWJvbEZ1bmN0aW9uID0gdHlwZW9mIHdpbmRvdy5TeW1ib2wgPT09ICdmdW5jdGlvbicgP1xuICB3aW5kb3cuU3ltYm9sIDpcbiAgdW5pcXVlU3RyaW5nO1xuXG4vKipcbiAqIFBvbHlmaWxsIGZvciBFUzYgc3ltYm9sIGNsYXNzLlxuICpcbiAqIE1peGlucyBhbmQgY29tcG9uZW50IGNsYXNzZXMgb2Z0ZW4gd2FudCB0byBhc3NvY2lhdGUgcHJpdmF0ZSBkYXRhIHdpdGggYW5cbiAqIGVsZW1lbnQgaW5zdGFuY2UsIGJ1dCBKYXZhU2NyaXB0IGRvZXMgbm90IGhhdmUgZGlyZWN0IHN1cHBvcnQgZm9yIHRydWVcbiAqIHByaXZhdGUgcHJvcGVydGllcy4gT25lIGFwcHJvYWNoIGlzIHRvIHVzZSB0aGVcbiAqIFtTeW1ib2xdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL1N5bWJvbClcbiAqIGRhdGEgdHlwZSB0byBzZXQgYW5kIHJldHJpZXZlIGRhdGEgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBVbmZvcnR1bmF0ZWx5LCB0aGUgU3ltYm9sIHR5cGUgaXMgbm90IGF2YWlsYWJsZSBpbiBJbnRlcm5ldCBFeHBsb3JlciAxMS4gSW5cbiAqIGxpZXUgb2YgcmV0dXJuaW5nIGEgdHJ1ZSBTeW1ib2wsIHRoaXMgcG9seWZpbGwgcmV0dXJucyBhIGRpZmZlcmVudCBzdHJpbmdcbiAqIGVhY2ggdGltZSBpdCBpcyBjYWxsZWQuXG4gKlxuICogVXNhZ2U6XG4gKlxuICogICAgIGNvbnN0IGZvb1N5bWJvbCA9IFN5bWJvbCgnZm9vJyk7XG4gKlxuICogICAgIGNsYXNzIE15RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAqICAgICAgIGdldCBmb28oKSB7XG4gKiAgICAgICAgIHJldHVybiB0aGlzW2Zvb1N5bWJvbF07XG4gKiAgICAgICB9XG4gKiAgICAgICBzZXQgZm9vKHZhbHVlKSB7XG4gKiAgICAgICAgIHRoaXNbZm9vU3ltYm9sXSA9IHZhbHVlO1xuICogICAgICAgfVxuICogICAgIH1cbiAqXG4gKiBJbiBJRSAxMSwgdGhpcyBzYW1wbGUgd2lsbCBcImhpZGVcIiBkYXRhIGJlaGluZCBhbiBpbnN0YW5jZSBwcm9wZXJ0eSB0aGF0IGxvb2tzXG4gKiBsaWtlIHRoaXMuX2ZvbzAuIFRoZSB1bmRlcnNjb3JlIGlzIG1lYW50IHRvIHJlZHVjZSAobm90IGVsaW1pbmF0ZSkgcG90ZW50aWFsXG4gKiBhY2NpZGVudGFsIGFjY2VzcywgYW5kIHRoZSB1bmlxdWUgbnVtYmVyIGF0IHRoZSBlbmQgaXMgbWVhbiB0byBhdm9pZCAobm90XG4gKiBlbGltaW5hdGUpIG5hbWluZyBjb25mbGljdHMuXG4gKlxuICogQGZ1bmN0aW9uIFN5bWJvbFxuICogQHBhcmFtIHtzdHJpbmd9IGRlc2NyaXB0aW9uIC0gQSBzdHJpbmcgdG8gaWRlbnRpZnkgdGhlIHN5bWJvbCB3aGVuIGRlYnVnZ2luZ1xuICogQHJldHVybnMge1N5bWJvbHxzdHJpbmd9IOKAlCBBIFN5bWJvbCAoaW4gRVM2IGJyb3dzZXJzKSBvciB1bmlxdWUgc3RyaW5nIElEIChpblxuICogRVM1KS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgc3ltYm9sRnVuY3Rpb247XG4iLCJpbXBvcnQgU3ltYm9sIGZyb20gJy4vU3ltYm9sJztcblxuXG4vKipcbiAqIEEgY29sbGVjdGlvbiBvZiAocG90ZW50aWFsbHkgcG9seWZpbGxlZCkgU3ltYm9sIG9iamVjdHMgZm9yIHN0YW5kYXJkXG4gKiBjb21wb25lbnQgcHJvcGVydGllcyBhbmQgbWV0aG9kcy5cbiAqXG4gKiBUaGVzZSBTeW1ib2wgb2JqZWN0cyBhcmUgdXNlZCB0byBhbGxvdyBtaXhpbnMgYW5kIGEgY29tcG9uZW50IHRvIGludGVybmFsbHlcbiAqIGNvbW11bmljYXRlLCB3aXRob3V0IGV4cG9zaW5nIHRoZXNlIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgaW4gdGhlIGNvbXBvbmVudCdzXG4gKiBwdWJsaWMgQVBJLlxuICpcbiAqIFRvIHVzZSB0aGVzZSBTeW1ib2wgb2JqZWN0cyBpbiB5b3VyIG93biBjb21wb25lbnQsIGluY2x1ZGUgdGhpcyBtb2R1bGUgYW5kXG4gKiB0aGVuIGNyZWF0ZSBhIHByb3BlcnR5IG9yIG1ldGhvZCB3aG9zZSBrZXkgaXMgdGhlIGRlc2lyZWQgU3ltYm9sLlxuICpcbiAqICAgICBpbXBvcnQgJ1NpbmdsZVNlbGVjdGlvbk1peGluJyBmcm9tICdlbGl4LW1peGlucy9zcmMvU2luZ2xlU2VsZWN0aW9uTWl4aW4nO1xuICogICAgIGltcG9ydCAnc3ltYm9scycgZnJvbSAnZWxpeC1taXhpbnMvc3JjL3N5bWJvbHMnO1xuICpcbiAqICAgICBjbGFzcyBNeUVsZW1lbnQgZXh0ZW5kcyBTaW5nbGVTZWxlY3Rpb25NaXhpbihIVE1MRWxlbWVudCkge1xuICogICAgICAgW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCkge1xuICogICAgICAgICAvLyBUaGlzIHdpbGwgYmUgaW52b2tlZCB3aGVuZXZlciBhbiBpdGVtIGlzIHNlbGVjdGVkL2Rlc2VsZWN0ZWQuXG4gKiAgICAgICB9XG4gKiAgICAgfVxuICpcbiAqIEBtb2R1bGUgc3ltYm9sc1xuICovXG5jb25zdCBzeW1ib2xzID0ge1xuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgZGVmYXVsdHNgIHByb3BlcnR5LlxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IGNhbiBiZSB1c2VkIHRvIHNldCBvciBvdmVycmlkZSBkZWZhdWx0cyB0aGF0IHdpbGwgYmUgYXBwbGllZFxuICAgKiB0byBhIG5ldyBjb21wb25lbnQgaW5zdGFuY2UuIFdoZW4gaW1wbGVtZW50aW5nIHRoaXMgcHJvcGVydHksIHRha2UgY2FyZSB0b1xuICAgKiBmaXJzdCBhY3F1aXJlIGFueSBkZWZhdWx0cyBkZWZpbmVkIGJ5IHRoZSBzdXBlcmNsYXNzLiBUaGUgc3RhbmRhcmQgaWRpb20gaXNcbiAgICogYXMgZm9sbG93czpcbiAgICpcbiAgICogICAgIGdldCBbc3ltYm9scy5kZWZhdWx0c10oKSB7XG4gICAqICAgICAgIGNvbnN0IGRlZmF1bHRzID0gc3VwZXJbc3ltYm9scy5kZWZhdWx0c10gfHwge307XG4gICAqICAgICAgIC8vIFNldCBvciBvdmVycmlkZSBkZWZhdWx0IHZhbHVlcyBoZXJlXG4gICAqICAgICAgIGRlZmF1bHRzLmN1c3RvbVByb3BlcnR5ID0gZmFsc2U7XG4gICAqICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICogICAgIH1cbiAgICpcbiAgICogQHZhciB7b2JqZWN0fSBkZWZhdWx0c1xuICAgKi9cbiAgZGVmYXVsdHM6IFN5bWJvbCgnZGVmYXVsdHMnKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYHJhaXNlQ2hhbmdlRXZlbnRzYCBwcm9wZXJ0eS5cbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IG1peGlucyB0byBkZXRlcm1pbmUgd2hldGhlciB0aGV5IHNob3VsZCByYWlzZVxuICAgKiBwcm9wZXJ0eSBjaGFuZ2UgZXZlbnRzLiBUaGUgc3RhbmRhcmQgSFRNTCBwYXR0ZXJuIGlzIHRvIG9ubHkgcmFpc2Ugc3VjaFxuICAgKiBldmVudHMgaW4gcmVzcG9uc2UgdG8gZGlyZWN0IHVzZXIgaW50ZXJhY3Rpb25zLiBUaGlzIHByb3BlcnR5IGNhbiBiZSB1c2VkXG4gICAqIHRvIG1hbmFnZSBldmVudHMgYXMgZm9sbG93cy5cbiAgICpcbiAgICogRmlyc3QsIFVJIGV2ZW50IGxpc3RlbmVycyBzaG91bGQgc2V0IHRoaXMgcHJvcGVydHkgdG8gYHRydWVgIGF0IHRoZSBzdGFydFxuICAgKiBvZiB0aGUgZXZlbnQgaGFuZGxlciwgdGhlbiBgZmFsc2VgIGF0IHRoZSBlbmQ6XG4gICAqXG4gICAqICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgKiAgICAgICB0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdID0gdHJ1ZTtcbiAgICogICAgICAgLy8gRG8gd29yayBoZXJlLCBwb3NzaWJseSBzZXR0aW5nIHByb3BlcnRpZXMsIGxpa2U6XG4gICAqICAgICAgIHRoaXMuZm9vID0gJ0hlbGxvJztcbiAgICogICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IGZhbHNlO1xuICAgKiAgICAgfSk7XG4gICAqXG4gICAqIEVsc2V3aGVyZSwgcHJvcGVydHkgc2V0dGVycyB0aGF0IHJhaXNlIGNoYW5nZSBldmVudHMgc2hvdWxkIG9ubHkgZG8gc28gaXRcbiAgICogdGhpcyBwcm9wZXJ0eSBpcyBgdHJ1ZWA6XG4gICAqXG4gICAqICAgICBzZXQgZm9vKHZhbHVlKSB7XG4gICAqICAgICAgIC8vIFNhdmUgZm9vIHZhbHVlIGhlcmUsIGRvIGFueSBvdGhlciB3b3JrLlxuICAgKiAgICAgICBpZiAodGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSkge1xuICAgKiAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdmb28tY2hhbmdlZCcpO1xuICAgKiAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAqICAgICAgIH1cbiAgICogICAgIH1cbiAgICpcbiAgICogSW4gdGhpcyB3YXksIHByb2dyYW1tYXRpYyBhdHRlbXB0cyB0byBzZXQgdGhlIGBmb29gIHByb3BlcnR5IHdpbGwgbm90XG4gICAqIHRyaWdnZXIgdGhlIGBmb28tY2hhbmdlZGAgZXZlbnQsIGJ1dCBVSSBpbnRlcmFjdGlvbnMgdGhhdCB1cGRhdGUgdGhhdFxuICAgKiBwcm9wZXJ0eSB3aWxsIGNhdXNlIHRob3NlIGV2ZW50cyB0byBiZSByYWlzZWQuXG4gICAqXG4gICAqL1xuICByYWlzZUNoYW5nZUV2ZW50czogU3ltYm9sKCdyYWlzZUNoYW5nZUV2ZW50cycpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgaXRlbUFkZGVkYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiBhIG5ldyBpdGVtIGlzIGFkZGVkIHRvIGEgbGlzdC5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGl0ZW1BZGRlZFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gYmVpbmcgc2VsZWN0ZWQvZGVzZWxlY3RlZFxuICAgKi9cbiAgaXRlbUFkZGVkOiBTeW1ib2woJ2l0ZW1BZGRlZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgaXRlbXNDaGFuZ2VkYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdW5kZXJseWluZyBjb250ZW50cyBjaGFuZ2UuIEl0IGlzIGFsc29cbiAgICogaW52b2tlZCBvbiBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24g4oCTIHNpbmNlIHRoZSBpdGVtcyBoYXZlIFwiY2hhbmdlZFwiIGZyb21cbiAgICogYmVpbmcgbm90aGluZy5cbiAgICovXG4gIGl0ZW1zQ2hhbmdlZDogU3ltYm9sKCdpdGVtc0NoYW5nZWQnKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYGl0ZW1TZWxlY3RlZGAgbWV0aG9kLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnZva2VkIHdoZW4gYW4gaXRlbSBiZWNvbWVzIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQuXG4gICAqXG4gICAqIEBmdW5jdGlvbiBpdGVtU2VsZWN0ZWRcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaXRlbSAtIHRoZSBpdGVtIGJlaW5nIHNlbGVjdGVkL2Rlc2VsZWN0ZWRcbiAgICogQHBhcmFtIHtib29sZWFufSBzZWxlY3RlZCAtIHRydWUgaWYgdGhlIGl0ZW0gaXMgc2VsZWN0ZWQsIGZhbHNlIGlmIG5vdFxuICAgKi9cbiAgaXRlbVNlbGVjdGVkOiBTeW1ib2woJ2l0ZW1TZWxlY3RlZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgdGVtcGxhdGVgIHByb3BlcnR5LlxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IHJldHVybnMgYSBjb21wb25lbnQncyB0ZW1wbGF0ZS5cbiAgICpcbiAgICogQHR5cGUge3N0cmluZ3xIVE1MVGVtcGxhdGVFbGVtZW50fVxuICAgKi9cbiAgdGVtcGxhdGU6IFN5bWJvbCgndGVtcGxhdGUnKVxufTtcblxuZXhwb3J0IGRlZmF1bHQgc3ltYm9scztcbiIsIi8qXG4gKiBUaGlzIGRlbW8gY3JlYXRlcyBhIHNpbXBsZSBzaW5nbGUtc2VsZWN0aW9uIGxpc3QgYm94IGluIFBvbHltZXIuXG4gKiBUaGlzIHdvcmtzIGp1c3QgbGlrZSB0aGUgc2FtcGxlIGxpc3QgYm94IGRlbW8gaW4gdGhlIG1haW4gZWxpeC9lbGl4IHJlcG8sXG4gKiBvbmx5IHRoZSBtaXhpbnMgYXJlIGFwcGxpZWQgdG8gYSBQb2x5bWVyIGJhc2UgY2xhc3MgaW5zdGVhZCBvZiBIVE1MRWxlbWVudC5cbiAqIFNlZSB0aGF0IGRlbW8gZm9yIG1vcmUgZGV0YWlscyBhYm91dCBob3cgdGhlIG1peGlucyB3b3JrIHRvZ2V0aGVyLlxuICpcbiAqIFRoaXMgZXhhbXBsZSBkZWZpbmVzIHRoZSBsaXN0IGJveCB0ZW1wbGF0ZSBpbiBhbiBIVE1MIEltcG9ydCwgd2hpY2ggaXNcbiAqIHN0YW5kYXJkIHByYWN0aWNlIGZvciBQb2x5bWVyIGVsZW1lbnRzLlxuICovXG5cblxuaW1wb3J0IENsaWNrU2VsZWN0aW9uTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ2xpY2tTZWxlY3Rpb25NaXhpbic7XG5pbXBvcnQgU2VsZWN0aW9uQXJpYU1peGluIGZyb20gJ2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL1NlbGVjdGlvbkFyaWFNaXhpbic7XG5pbXBvcnQgU2luZ2xlU2VsZWN0aW9uTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU2luZ2xlU2VsZWN0aW9uTWl4aW4nO1xuaW1wb3J0IHN5bWJvbHMgZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvc3ltYm9scyc7XG5cblxuLy8gQXBwbHkgYSBzZXQgb2YgRWxpeCBtaXhpbnMgdG8gdGhlIFBvbHltZXIuRWxlbWVudCBiYXNlIGNsYXNzLlxuLy8gVXNlIGByZWR1Y2VgIHRvIGFwcGx5IHRoZSBmdW5jdGlvbnMgaW4gb3JkZXIuXG5jb25zdCBtaXhpbnMgPSBbXG4gIENsaWNrU2VsZWN0aW9uTWl4aW4sXG4gIFNlbGVjdGlvbkFyaWFNaXhpbixcbiAgU2luZ2xlU2VsZWN0aW9uTWl4aW5cbl07XG5jb25zdCBiYXNlID0gbWl4aW5zLnJlZHVjZSgoY2xzLCBtaXhpbikgPT4gbWl4aW4oY2xzKSwgd2luZG93LlBvbHltZXIuRWxlbWVudCk7XG5cblxuLyoqXG4gKiBBIHNpbXBsZSBzaW5nbGUtc2VsZWN0aW9uIGxpc3QgYm94LlxuICpcbiAqIFRoaXMgdXNlcyB0aGUgYmFzZSBjbGFzcyB3ZSBqdXN0IGNyZWF0ZWQgYWJvdmUsIGFuZCBhZGRzIGluIHRoZSBiZWhhdmlvclxuICogdW5pcXVlIHRvIHRoaXMgbGlzdCBib3ggZWxlbWVudC5cbiAqXG4gKiBUT0RPOiBXb3JrIG91dCB0aGUgYmVzdCB3YXkgdG8gc3VwcG9ydCBzZXR0aW5nIHByb3BlcnRpZXMgdmlhIGF0dHJpYnV0ZXMuXG4gKiBTZWUgdGhlIGFkamFjZW50IFNpbmdsZVNlbGVjdGlvbkRlbW8uanMgZmlsZSBmb3IgbW9yZSBvbiB0aGF0IGlzc3VlLlxuICpcbiAqIEBleHRlbmRzIFBvbHltZXIuRWxlbWVudFxuICogQG1peGVzIENsaWNrU2VsZWN0aW9uTWl4aW5cbiAqIEBtaXhlcyBTZWxlY3Rpb25BcmlhTWl4aW5cbiAqIEBtaXhlcyBTaW5nbGVTZWxlY3Rpb25NaXhpblxuICovXG5jbGFzcyBMaXN0Qm94IGV4dGVuZHMgYmFzZSB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIC8vIFNpbXBsaXN0aWMga2V5Ym9hcmQgaGFuZGxpbmcgZm9yIExlZnQvUmlnaHQgYW5kIFVwL0Rvd24ga2V5cy5cbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBldmVudCA9PiB7XG4gICAgICB0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdID0gdHJ1ZTtcbiAgICAgIGxldCBoYW5kbGVkID0gZmFsc2U7XG4gICAgICBzd2l0Y2goZXZlbnQua2V5Q29kZSkge1xuICAgICAgICBjYXNlIDM3OiAvLyBMZWZ0XG4gICAgICAgIGNhc2UgMzg6IC8vIFVwXG4gICAgICAgICAgaGFuZGxlZCA9IHRoaXMuc2VsZWN0UHJldmlvdXMoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOTogLy8gUmlnaHRcbiAgICAgICAgY2FzZSA0MDogLy8gRG93blxuICAgICAgICAgIGhhbmRsZWQgPSB0aGlzLnNlbGVjdE5leHQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChoYW5kbGVkKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgfVxuICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IGZhbHNlO1xuICAgIH0pO1xuXG4gICAgLy8gVGhlIGxpc3QgbmVlZHMgdG8gaW5pdGlhbGl6ZSBhbnkgaXRlbXMgaXQgc3RhcnRzIHdpdGggYnkgaW52b2tpbmcgdGhlXG4gICAgLy8gaXRlbXNDaGFuZ2VkIG1ldGhvZC4gTWl4aW5zIGxpa2UgdGhlIEFSSUEgbWl4aW4gd2lsbCB0aGVuIHVzZSB0aGF0IHNpZ25hbFxuICAgIC8vIHRvIGFwcGx5IGF0dHJpYnV0ZXMgdG8gZWFjaCBpdGVtLCBhcyB3ZWxsIGFzIHRvIHRoZSBsaXN0IGVsZW1lbnQgaXRzZWxmLlxuICAgIC8vIEZvciBub3csIHdlIGludm9rZSB0aGUgbWV0aG9kIG1hbnVhbGx5LCBidXQgZXZlbnR1YWxseSB3ZSdsbCB3YW50IGEgbWl4aW5cbiAgICAvLyB0byBoYW5kbGUgdGhpcyBjb21tb24gbmVlZC4gQmVjYXVzZSB0aGUgQ3VzdG9tIEVsZW1lbnQgc3BlYyBwcmV2ZW50cyBhblxuICAgIC8vIGVsZW1lbnQgZnJvbSBtb2RpZnlpbmcgaXRzZWxmIGluIGl0cyBvd24gY29uc3RydWN0b3IsIHdlIGRvIHNvIGluXG4gICAgLy8gdGltZW91dC5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXNbc3ltYm9scy5pdGVtc0NoYW5nZWRdKCk7XG4gICAgfSk7XG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBpZiAoc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2spIHsgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTsgfVxuICAgIC8vIFNldCBhIGRlZmF1bHQgdGFiaW5kZXggc28gdGhhdCB0aGUgZWxlbWVudCBjYW4gcmVjZWl2ZSBmb2N1cy4gVGhhdCBsZXRzXG4gICAgLy8gdXMgc3VwcG9ydCBrZXlib2FyZCBzZWxlY3Rpb24uIFdlIHRha2UgY2FyZSB0byBhdm9pZCBvdmV3cml0dGluZyBhbnlcbiAgICAvLyB0YWJpbmRleCB0aGF0J3MgZXhwbGljaXRseSBzZXQgb24gdGhlIGxpc3QgZWxlbWVudC5cbiAgICBpZiAodGhpcy5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JykgPT0gbnVsbCAmJiB0aGlzW3N5bWJvbHMuZGVmYXVsdHNdLnRhYmluZGV4ICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCB0aGlzW3N5bWJvbHMuZGVmYXVsdHNdLnRhYmluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvLyBXZSBkZWZpbmUgYSBjb2xsZWN0aW9uIG9mIGRlZmF1bHQgcHJvcGVydHkgdmFsdWVzIHdoaWNoIGNhbiBiZSBzZXQgaW5cbiAgLy8gdGhlIGNvbnN0cnVjdG9yIG9yIGNvbm5lY3RlZENhbGxiYWNrLiBEZWZpbmluZyB0aGUgYWN0dWFsIGRlZmF1bHQgdmFsdWVzXG4gIC8vIGluIHRob3NlIGNhbGxzIHdvdWxkIGNvbXBsaWNhdGUgdGhpbmdzIGlmIGEgc3ViY2xhc3Mgc29tZWRheSB3YW50cyB0b1xuICAvLyBkZWZpbmUgaXRzIG93biBkZWZhdWx0IHZhbHVlLlxuICBnZXQgW3N5bWJvbHMuZGVmYXVsdHNdKCkge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gc3VwZXJbc3ltYm9scy5kZWZhdWx0c10gfHwge307XG4gICAgLy8gVGhlIGRlZmF1bHQgdGFiIGluZGV4IGlzIDAgKGRvY3VtZW50IG9yZGVyKS5cbiAgICBkZWZhdWx0cy50YWJpbmRleCA9IDA7XG4gICAgcmV0dXJuIGRlZmF1bHRzO1xuICB9XG5cbiAgc3RhdGljIGdldCBpcygpIHtcbiAgICByZXR1cm4gJ3NhbXBsZS1saXN0LWJveCc7XG4gIH1cblxuICAvLyBNYXAgaXRlbSBzZWxlY3Rpb24gdG8gYSBgc2VsZWN0ZWRgIENTUyBjbGFzcy5cbiAgW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCkge1xuICAgIGlmIChzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0pIHsgc3VwZXJbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKTsgfVxuICAgIGl0ZW0uY2xhc3NMaXN0LnRvZ2dsZSgnc2VsZWN0ZWQnLCBzZWxlY3RlZCk7XG4gIH1cblxuICAvLyBTaW1wbGlzdGljIGltcGxlbWVudGF0aW9uIG9mIGFuIGl0ZW1zIHByb3BlcnR5IHNvIHRoYXQgU2luZ2xlU2VsZWN0aW9uTWl4aW5cbiAgLy8gaGFzIGl0ZW1zIHRvIHdvcmsgd2l0aC4gVGhpcyBkb2Vzbid0IGhhbmRsZSBTaGFkb3cgRE9NIHJlZGlzdHJpYnV0aW9uLCBzb1xuICAvLyBpZiBzb21lb25lIHB1dHMgYSBzbG90IGVsZW1lbnQgaW5zaWRlIHRoZSBsaXN0LCBpdCB3b24ndCBiZWhhdmUgYXNcbiAgLy8gZXhwZWN0ZWQuXG4gIGdldCBpdGVtcygpIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZHJlbjtcbiAgfVxuXG4gIC8vIEEgc2ltcGxpc3RpYyBpbXBsZW1lbnRhdGlvbiBvZiBpdGVtc0NoYW5nZWQuIEEgcmVhbCBpbXBsZW1lbnRhdGlvblxuICAvLyB3b3VsZCBhbHNvIG5lZWQgdG8gdHJhY2sgY2hhbmdlcyBpbiB0aGUgc2V0IG9mIGNoaWxkcmVuLCBhbmQgaW52b2tlXG4gIC8vIGl0ZW1BZGRlZCBmb3IgbmV3IGNoaWxkcmVuLlxuICBbc3ltYm9scy5pdGVtc0NoYW5nZWRdKCkge1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodGhpcy5pdGVtcywgY2hpbGQgPT4ge1xuICAgICAgdGhpc1tzeW1ib2xzLml0ZW1BZGRlZF0oY2hpbGQpO1xuICAgIH0pO1xuICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3NhbXBsZS1saXN0LWJveCcsIExpc3RCb3gpO1xuZXhwb3J0IGRlZmF1bHQgTGlzdEJveDtcbiIsImltcG9ydCBTaW5nbGVTZWxlY3Rpb25NaXhpbiBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9TaW5nbGVTZWxlY3Rpb25NaXhpbic7XG5pbXBvcnQgc3ltYm9scyBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9zeW1ib2xzJztcblxuXG4vKlxuICogRGVtb25zdHJhdGUgdGhlIEVsaXggc2luZ2xlLXNlbGVjdGlvbiBtaXhpbiBhcHBsaWVkIHRvIGEgUG9seW1lciAyLjAgZWxlbWVudC5cbiAqL1xuY2xhc3MgU2luZ2xlU2VsZWN0aW9uRGVtbyBleHRlbmRzIFNpbmdsZVNlbGVjdGlvbk1peGluKHdpbmRvdy5Qb2x5bWVyLkVsZW1lbnQpIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgLy8gV2hlbiBhIGNoaWxkIGlzIGNsaWNrZWQsIHNldCB0aGUgc2VsZWN0ZWRJdGVtLlxuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICB0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdID0gdHJ1ZTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gZXZlbnQudGFyZ2V0ICE9PSB0aGlzID9cbiAgICAgICAgZXZlbnQudGFyZ2V0IDogIC8vIENsaWNrZWQgb24gYW4gaXRlbVxuICAgICAgICBudWxsOyAgICAgICAgICAgLy8gQ2xpY2tlZCBvbiBlbGVtZW50IGJhY2tncm91bmRcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gSXQncyB1bmNsZWFyIHdobyBzaG91bGQgaGFuZGxlIGF0dHJpYnV0ZXMgbGlrZSBgc2VsZWN0ZWQtaW5kZXhgLiBQb2x5bWVyXG4gIC8vIHdpbGwgdHJ5IHRvIGhhbmRsZSB0aGVtLCBidXQgdGhlbiB3ZSBoYXZlIHRvIGRlY2xhcmUgdGhlbSwgZXZlbiBpZiB0aGV5XG4gIC8vIGNvbWUgZnJvbSBtaXhpbnMuIEFsdGVybmF0aXZlbHksIHdlIGNvdWxkIGRlZmluZSBvdXIgb3duXG4gIC8vIGBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2tgIGFuZCBgb2JzZXJ2ZWRBdHRyaWJ1dGVzYCBhbmQgaGFuZGxlIG91clxuICAvLyBhdHRyaWJ1dGVzIG91cnNlbHZlcy4gQ3VycmVudGx5LCBob3dldmVyLCBQb2x5bWVyIHdpbGwgZmlnaHQgdXMgZm9yXG4gIC8vIGNvbnRyb2wuXG4gIHN0YXRpYyBnZXQgY29uZmlnKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHNlbGVjdGVkSW5kZXg6IHtcbiAgICAgICAgICB0eXBlOiBOdW1iZXJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBTZWUgbm90ZXMgYXQgYGNvbmZpZ2AuXG4gIC8vIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyaWJ1dGVOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgLy8gICBpZiAoc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKSB7IHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyaWJ1dGVOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpOyB9XG4gIC8vICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdzZWxlY3RlZC1pbmRleCcpIHtcbiAgLy8gICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IG5ld1ZhbHVlO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHN0YXRpYyBnZXQgaXMoKSB7IHJldHVybiAnc2luZ2xlLXNlbGVjdGlvbi1kZW1vJzsgfVxuXG4gIC8vIE1hcCBpdGVtIHNlbGVjdGlvbiB0byBhIGBzZWxlY3RlZGAgQ1NTIGNsYXNzLlxuICBbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKSB7XG4gICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpOyB9XG4gICAgaXRlbS5jbGFzc0xpc3QudG9nZ2xlKCdzZWxlY3RlZCcsIHNlbGVjdGVkKTtcbiAgfVxuXG4gIC8vIFNpbXBsaXN0aWMgaW1wbGVtZW50YXRpb24gb2YgaXRlbXMgcHJvcGVydHkg4oCUwqBkb2Vzbid0IGhhbmRsZSByZWRpc3RyaWJ1dGlvbi5cbiAgZ2V0IGl0ZW1zKCkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkcmVuO1xuICB9XG5cbiAgLy8gU2VlIG5vdGVzIGF0IGBjb25maWdgLlxuICAvLyBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgLy8gICByZXR1cm4gWydzZWxlY3RlZC1pbmRleCddO1xuICAvLyB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoU2luZ2xlU2VsZWN0aW9uRGVtby5pcywgU2luZ2xlU2VsZWN0aW9uRGVtbyk7XG4iXX0=
