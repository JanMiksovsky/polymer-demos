(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ChildrenContentMixin;

var _content = require('./content');

var _microtask = require('./microtask');

var _microtask2 = _interopRequireDefault(_microtask);

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixin which defines a component's `symbols.content` property as all
 * child elements, including elements distributed to the component's slots.
 *
 * This also provides notification of changes to a component's content. It
 * will invoke a `symbols.contentChanged` method when the component is first
 * instantiated, and whenever its distributed children change. This is intended
 * to satisfy the Gold Standard checklist item for monitoring
 * [Content Changes](https://github.com/webcomponents/gold-standard/wiki/Content-Changes).
 *
 * Example:
 *
 * ```
 * let base = ChildrenContentMixin(DistributedChildrenMixin(HTMLElement));
 * class CountingElement extends base {
 *
 *   constructor() {
 *     super();
 *     let root = this.attachShadow({ mode: 'open' });
 *     root.innerHTML = `<slot></slot>`;
 *     this[symbols.shadowCreated]();
 *   }
 *
 *   [symbols.contentChanged]() {
 *     if (super[symbols.contentChanged]) { super[symbols.contentChanged](); }
 *     // Count the component's children, both initially and when changed.
 *     this.count = this.distributedChildren.length;
 *   }
 *
 * }
 * ```
 *
 * Note that content change detection depends upon the element having at least
 * one `slot` element in its shadow subtree.
 *
 * This mixin is intended for use with the
 * [DistributedChildrenMixin](DistributedChildrenMixin.md). See that mixin for
 * a discussion of how that works. This ChildrenContentMixin
 * provides an easy way of defining the "content" of a component as the
 * component's distributed children. That in turn lets mixins like
 * [ContentItemsMixin](ContentItemsMixin.md) manipulate the children as list
 * items.
 *
 * To receive `contentChanged` notification, this mixin expects a component to
 * invoke a method called `symbols.shadowCreated` after the component's shadow
 * root has been created and populated.
 *
 * Note: This mixin relies upon the browser firing `slotchange` events when the
 * contents of a `slot` change. Safari and the polyfills fire this event when a
 * custom element is first upgraded, while Chrome does not. This mixin always
 * invokes the `contentChanged` method after component instantiation so that the
 * method will always be invoked at least once. However, on Safari (and possibly
 * other browsers), `contentChanged` might be invoked _twice_ for a new
 * component instance.
 *
 * @module ChildrenContentMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
function ChildrenContentMixin(base) {

  /**
   * The class prototype added by the mixin.
   */
  class ChildrenContent extends base {

    constructor() {
      super();

      // Make an initial call to contentChanged() so that the component can do
      // initialization that it normally does when content changes.
      //
      // This will invoke contentChanged() handlers in other mixins. In order
      // that those mixins have a chance to complete their own initialization,
      // we add the contentChanged() call to the microtask queue.
      (0, _microtask2.default)(() => {
        if (this[_symbols2.default.contentChanged]) {
          this[_symbols2.default.contentChanged]();
        }
      });
    }

    /**
     * The content of this component, defined to be the flattened array of
     * children distributed to the component.
     *
     * The default implementation of this property only returns instances of
     * Element
     *
     * @type {HTMLElement[]}
     */
    get [_symbols2.default.content]() {
      return (0, _content.assignedChildren)(this);
    }

    [_symbols2.default.shadowCreated]() {
      if (super[_symbols2.default.shadowCreated]) {
        super[_symbols2.default.shadowCreated]();
      }
      // Listen to changes on all slots.
      const slots = this.shadowRoot.querySelectorAll('slot');
      slots.forEach(slot => slot.addEventListener('slotchange', event => {
        if (this[_symbols2.default.contentChanged]) {
          this[_symbols2.default.contentChanged]();
        }
      }));
    }
  }

  return ChildrenContent;
}

},{"./content":14,"./microtask":16,"./symbols":17}],2:[function(require,module,exports){
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
 * On touch devices, that event appears to trigger when the touch is *released*.
 *
 * This mixin only listens to mousedown events for the primary mouse button
 * (typically the left button). Right-clicks are ignored so that the browser
 * may display a context menu.
 *
 * Much has been written about how to ensure "fast tap" behavior on mobile
 * devices. This mixin makes a very straightforward use of a standard event, and
 * this appears to perform well on mobile devices when, e.g., the viewport is
 * configured with `width=device-width`.
 *
 * This mixin expects the component to provide an `items` property. It also
 * expects the component to define a `selectedItem` property; you can provide
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

        // Only process events for the main (usually left) button.
        if (event.button !== 0) {
          return;
        }

        this[_symbols2.default.raiseChangeEvents] = true;

        // If the item clicked on is a button, the event seems to be raised in
        // phase 2 (AT_TARGET) — but the event target will be the component, not
        // the item that was clicked on.
        const target = event.target === this ? event.path[0] : // Event target isn't the item, so get it from path.
        event.target;

        // Find which item was clicked on and, if found, select it. For elements
        // which don't require a selection, a background click will determine
        // the item was null, in which we case we'll remove the selection.
        const item = itemForTarget(this, target);
        if (item || !this.selectionRequired) {

          if (!('selectedItem' in this)) {
            console.warn(`ClickSelectionMixin expects a component to define a "selectedItem" property.`);
          } else {
            this.selectedItem = item;
          }

          // We don't call preventDefault here. The default behavior for
          // mousedown includes setting keyboard focus if the element doesn't
          // already have the focus, and we want to preserve that behavior.
          event.stopPropagation();
        }

        this[_symbols2.default.raiseChangeEvents] = false;
      });
    }

  }

  return ClickSelection;
}

/*
 * Return the list item that is, or contains, the indicated target element.
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

},{"./symbols":17}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ContentItemsMixin;

var _content = require('./content');

var content = _interopRequireWildcard(_content);

var _Symbol = require('./Symbol');

var _Symbol2 = _interopRequireDefault(_Symbol);

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

var _toggleClass = require('./toggleClass');

var _toggleClass2 = _interopRequireDefault(_toggleClass);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Symbols for private data members on an element.
const itemsSymbol = (0, _Symbol2.default)('items');
const itemInitializedSymbol = (0, _Symbol2.default)('itemInitialized');

/**
 * Mixin which maps content semantics (elements) to list item semantics.
 *
 * Items differ from element contents in several ways:
 *
 * * They are often referenced via index.
 * * They may have a selection state.
 * * It's common to do work to initialize the appearance or state of a new
 *   item.
 * * Auxiliary invisible child elements are filtered out and not counted as
 *   items. Auxiliary elements include link, script, style, and template
 *   elements. This filtering ensures that those auxiliary elements can be
 *   used in markup inside of a list without being treated as list items.
 *
 * This mixin expects a component to provide a `content` property returning a
 * raw set of elements. You can provide that yourself, or use
 * [ChildrenContentMixin](ChildrenContentMixin.md).
 *
 * [ChildrenContentMixin](ChildrenContentMixin.md), the
 * `contentChanged` method will be invoked for you when the element's children
 * care of notifying it of future changes, and turns on the optimization. With
 * change, turning on the optimization automatically.
 * method when the set of items changes, the mixin concludes that you'll take
 * property. To avoid having to do work each time that property is requested,
 * return that immediately on subsequent calls to the `items` property. If you
 * that on, the mixin saves a reference to the computed set of items, and will
 * The most commonly referenced property defined by this mixin is the `items`
 * this mixin supports an optimized mode. If you invoke the `contentChanged`
 * use this mixin in conjunction with
 *
 * @module ContentItemsMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
function ContentItemsMixin(base) {

  /**
   * The class prototype added by the mixin.
   */
  class ContentItems extends base {

    [_symbols2.default.contentChanged]() {
      if (super[_symbols2.default.contentChanged]) {
        super[_symbols2.default.contentChanged]();
      }

      // Since we got the contentChanged call, we'll assume we'll be notified if
      // the set of items changes later. We turn on memoization of the items
      // property by setting our internal property to null (instead of
      // undefined).
      this[itemsSymbol] = null;

      this[_symbols2.default.itemsChanged]();
    }

    /**
     * The selection state for a single item has changed.
     *
     * Invoke this method to signal that the selected state of the indicated item
     * has changed. By default, this applies a `selected` CSS class if the item
     * is selected, and removed it if not selected.
     *
     * @param {HTMLElement} item - The item whose selection state has changed.
     * @param {boolean} selected - True if the item is selected, false if not.
     */
    [_symbols2.default.itemSelected](item, selected) {
      if (super[_symbols2.default.itemSelected]) {
        super[_symbols2.default.itemSelected](item, selected);
      }
      (0, _toggleClass2.default)(item, 'selected', selected);
    }

    /**
     * The current set of items in the list. See the top-level documentation for
     * mixin for a description of how items differ from plain content.
     *
     * @type {HTMLElement[]}
     */
    get items() {
      let items;
      if (this[itemsSymbol] == null) {
        items = content.filterAuxiliaryElements(this[_symbols2.default.content]);
        // Note: test for *equality* with null, since we use `undefined` to
        // indicate that we're not yet caching items.
        if (this[itemsSymbol] === null) {
          // Memoize the set of items.
          this[itemsSymbol] = items;
        }
      } else {
        // Return the memoized items.
        items = this[itemsSymbol];
      }
      return items;
    }

    /**
     * This method is invoked when the underlying contents change. It is also
     * invoked on component initialization – since the items have "changed" from
     * being nothing.
     */
    [_symbols2.default.itemsChanged]() {
      if (super[_symbols2.default.itemsChanged]) {
        super[_symbols2.default.itemsChanged]();
      }

      // Perform per-item initialization if `itemAdded` is defined.
      if (this[_symbols2.default.itemAdded]) {
        Array.prototype.forEach.call(this.items, item => {
          if (!item[itemInitializedSymbol]) {
            this[_symbols2.default.itemAdded](item);
            item[itemInitializedSymbol] = true;
          }
        });
      }

      if (this[_symbols2.default.raiseChangeEvents]) {
        this.dispatchEvent(new CustomEvent('items-changed'));
      }
    }

    /**
     * Fires when the items in the list change.
     *
     * @memberof ContentItems
     * @event items-changed
     */
  }

  return ContentItems;
}

},{"./Symbol":12,"./content":14,"./symbols":17,"./toggleClass":18}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = DirectionSelectionMixin;

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixin which maps direction semantics (goLeft, goRight, etc.) to selection
 * semantics (selectPrevious, selectNext, etc.).
 *
 * This mixin can be used in conjunction with
 * [KeyboardDirectionMixin](KeyboardDirectionMixin.md) (which maps keyboard
 * events to directions) and a mixin that handles selection like
 * [SingleSelectionMixin](SingleSelectionMixin.md).
 *
 * @module DirectionSelectionMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
function DirectionSelectionMixin(base) {

  /**
   * The class prototype added by the mixin.
   */
  class DirectionSelection extends base {

    [_symbols2.default.goDown]() {
      if (super[_symbols2.default.goDown]) {
        super[_symbols2.default.goDown]();
      }
      if (!this.selectNext) {
        console.warn(`DirectionSelectionMixin expects a component to define a "selectNext" method.`);
      } else {
        return this.selectNext();
      }
    }

    [_symbols2.default.goEnd]() {
      if (super[_symbols2.default.goEnd]) {
        super[_symbols2.default.goEnd]();
      }
      if (!this.selectLast) {
        console.warn(`DirectionSelectionMixin expects a component to define a "selectLast" method.`);
      } else {
        return this.selectLast();
      }
    }

    [_symbols2.default.goLeft]() {
      if (super[_symbols2.default.goLeft]) {
        super[_symbols2.default.goLeft]();
      }
      if (!this.selectPrevious) {
        console.warn(`DirectionSelectionMixin expects a component to define a "selectPrevious" method.`);
      } else {
        return this.selectPrevious();
      }
    }

    [_symbols2.default.goRight]() {
      if (super[_symbols2.default.goRight]) {
        super[_symbols2.default.goRight]();
      }
      if (!this.selectNext) {
        console.warn(`DirectionSelectionMixin expects a component to define a "selectNext" method.`);
      } else {
        return this.selectNext();
      }
    }

    [_symbols2.default.goStart]() {
      if (super[_symbols2.default.goStart]) {
        super[_symbols2.default.goStart]();
      }
      if (!this.selectFirst) {
        console.warn(`DirectionSelectionMixin expects a component to define a "selectFirst" method.`);
      } else {
        return this.selectFirst();
      }
    }

    [_symbols2.default.goUp]() {
      if (super[_symbols2.default.goUp]) {
        super[_symbols2.default.goUp]();
      }
      if (!this.selectPrevious) {
        console.warn(`DirectionSelectionMixin expects a component to define a "selectPrevious" method.`);
      } else {
        return this.selectPrevious();
      }
    }

  }

  return DirectionSelection;
}

},{"./symbols":17}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = KeyboardDirectionMixin;

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixin which maps direction keys (Left, Right, etc.) to direction semantics
 * (go left, go right, etc.).
 *
 * This mixin expects the component to invoke a `keydown` method when a key is
 * pressed. You can use [KeyboardMixin](KeyboardMixin.md) for that
 * purpose, or wire up your own keyboard handling and call `keydown` yourself.
 *
 * This mixin calls methods such as `goLeft` and `goRight`. You can define
 * what that means by implementing those methods yourself. If you want to use
 * direction keys to navigate a selection, use this mixin with
 * [DirectionSelectionMixin](DirectionSelectionMixin.md).
 *
 * If the component defines a property called `symbols.orientation`, the value
 * of that property will constrain navigation to the horizontal or vertical axis.
 *
 * @module KeyboardDirectionMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
function KeyboardDirectionMixin(base) {

  /**
   * The class prototype added by the mixin.
   */
  class KeyboardDirection extends base {

    /**
     * Invoked when the user wants to go/navigate down.
     * The default implementation of this method does nothing.
     */
    [_symbols2.default.goDown]() {
      if (super[_symbols2.default.goDown]) {
        return super[_symbols2.default.goDown]();
      }
    }

    /**
     * Invoked when the user wants to go/navigate to the end (e.g., of a list).
     * The default implementation of this method does nothing.
     */
    [_symbols2.default.goEnd]() {
      if (super[_symbols2.default.goEnd]) {
        return super[_symbols2.default.goEnd]();
      }
    }

    /**
     * Invoked when the user wants to go/navigate left.
     * The default implementation of this method does nothing.
     */
    [_symbols2.default.goLeft]() {
      if (super[_symbols2.default.goLeft]) {
        return super[_symbols2.default.goLeft]();
      }
    }

    /**
     * Invoked when the user wants to go/navigate right.
     * The default implementation of this method does nothing.
     */
    [_symbols2.default.goRight]() {
      if (super[_symbols2.default.goRight]) {
        return super[_symbols2.default.goRight]();
      }
    }

    /**
     * Invoked when the user wants to go/navigate to the start (e.g., of a
     * list). The default implementation of this method does nothing.
     */
    [_symbols2.default.goStart]() {
      if (super[_symbols2.default.goStart]) {
        return super[_symbols2.default.goStart]();
      }
    }

    /**
     * Invoked when the user wants to go/navigate up.
     * The default implementation of this method does nothing.
     */
    [_symbols2.default.goUp]() {
      if (super[_symbols2.default.goUp]) {
        return super[_symbols2.default.goUp]();
      }
    }

    [_symbols2.default.keydown](event) {
      let handled = false;

      const orientation = this[_symbols2.default.orientation] || 'both';
      const horizontal = orientation === 'horizontal' || orientation === 'both';
      const vertical = orientation === 'vertical' || orientation === 'both';

      // Ignore Left/Right keys when metaKey or altKey modifier is also pressed,
      // as the user may be trying to navigate back or forward in the browser.
      switch (event.keyCode) {
        case 35:
          // End
          handled = this[_symbols2.default.goEnd]();
          break;
        case 36:
          // Home
          handled = this[_symbols2.default.goStart]();
          break;
        case 37:
          // Left
          if (horizontal && !event.metaKey && !event.altKey) {
            handled = this[_symbols2.default.goLeft]();
          }
          break;
        case 38:
          // Up
          if (vertical) {
            handled = event.altKey ? this[_symbols2.default.goStart]() : this[_symbols2.default.goUp]();
          }
          break;
        case 39:
          // Right
          if (horizontal && !event.metaKey && !event.altKey) {
            handled = this[_symbols2.default.goRight]();
          }
          break;
        case 40:
          // Down
          if (vertical) {
            handled = event.altKey ? this[_symbols2.default.goEnd]() : this[_symbols2.default.goDown]();
          }
          break;
      }
      // Prefer mixin result if it's defined, otherwise use base result.
      return handled || super[_symbols2.default.keydown] && super[_symbols2.default.keydown](event) || false;
    }

  }

  return KeyboardDirection;
}

},{"./symbols":17}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = KeyboardMixin;

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixin which manages the keydown handling for a component.
 *
 * This mixin handles several keyboard-related features.
 *
 * First, it wires up a single keydown event handler that can be shared by
 * multiple mixins on a component. The event handler will invoke a `keydown`
 * method with the event object, and any mixin along the prototype chain that
 * wants to handle that method can do so.
 *
 * If a mixin wants to indicate that keyboard event has been handled, and that
 * other mixins should *not* handle it, the mixin's `keydown` handler should
 * return a value of true. The convention that seems to work well is that a
 * mixin should see if it wants to handle the event and, if not, then ask the
 * superclass to see if it wants to handle the event. This has the effect of
 * giving the mixin that was applied last the first chance at handling a
 * keyboard event.
 *
 * Example:
 *
 *     [symbols.keydown](event) {
 *       let handled;
 *       switch (event.keyCode) {
 *         // Handle the keys you want, setting handled = true if appropriate.
 *       }
 *       // Prefer mixin result if it's defined, otherwise use base result.
 *       return handled || (super[symbols.keydown] && super[symbols.keydown](event));
 *     }
 *
 * Until iOS Safari supports the `KeyboardEvent.key` property
 * (see http://caniuse.com/#search=keyboardevent.key), mixins should generally
 * test keys using the legacy `keyCode` property, not `key`.
 *
 * A second feature provided by this mixin is that it implicitly makes the
 * component a tab stop if it isn't already, by setting `tabIndex` to 0. This
 * has the effect of adding the component to the tab order in document order.
 *
 * @module KeyboardMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
function KeyboardMixin(base) {

  /**
   * The class prototype added by the mixin.
   */
  class Keyboard extends base {

    constructor() {
      super();
      this.addEventListener('keydown', event => {
        this[_symbols2.default.raiseChangeEvents] = true;
        const handled = this[_symbols2.default.keydown](event);
        if (handled) {
          event.preventDefault();
          event.stopPropagation();
        }
        this[_symbols2.default.raiseChangeEvents] = false;
      });
    }

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }
      if (this.getAttribute('tabindex') == null && this[_symbols2.default.defaults].tabindex !== null) {
        this.setAttribute('tabindex', this[_symbols2.default.defaults].tabindex);
      }
    }

    get [_symbols2.default.defaults]() {
      const defaults = super[_symbols2.default.defaults] || {};
      // The default tab index is 0 (document order).
      defaults.tabindex = 0;
      return defaults;
    }

    /**
     * Handle the indicated keyboard event.
     *
     * The default implementation of this method does nothing. This will
     * typically be handled by other mixins.
     *
     * @param {KeyboardEvent} event - the keyboard event
     * @return {boolean} true if the event was handled
     */
    [_symbols2.default.keydown](event) {
      if (super[_symbols2.default.keydown]) {
        return super[_symbols2.default.keydown](event);
      }
    }

  }

  return Keyboard;
}

},{"./symbols":17}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = KeyboardPagedSelectionMixin;

var _defaultScrollTarget = require('./defaultScrollTarget');

var _defaultScrollTarget2 = _interopRequireDefault(_defaultScrollTarget);

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixin which maps page keys (Page Up, Page Down) into operations that move
 * the selection by one page.
 *
 * The keyboard interaction model generally follows that of Microsoft Windows'
 * list boxes instead of those in OS X:
 *
 * * The Page Up/Down and Home/End keys actually change the selection, rather
 *   than just scrolling. The former behavior seems more generally useful for
 *   keyboard users.
 *
 * * Pressing Page Up/Down will change the selection to the topmost/bottommost
 *   visible item if the selection is not already there. Thereafter, the key
 *   will move the selection up/down by a page, and (per the above point) make
 *   the selected item visible.
 *
 * To ensure the selected item is in view following use of Page Up/Down, use
 * the related [SelectionInViewMixin](SelectionInViewMixin.md).
 *
 * This mixin expects the component to provide:
 *
 * * A `[symbols.keydown]` method invoked when a key is pressed. You can use
 *   [KeyboardMixin](KeyboardMixin.md) for that purpose, or wire up your own
 *   keyboard handling and call `[symbols.keydown]` yourself.
 * * A `selectedIndex` property that indicates the index of the selected item.
 *
 * @module KeyboardPagedSelectionMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
function KeyboardPagedSelectionMixin(base) {

  /**
   * The class prototype added by the mixin.
   */
  class KeyboardPagedSelection extends base {

    [_symbols2.default.keydown](event) {
      let handled = false;
      const orientation = this[_symbols2.default.orientation];
      if (orientation !== 'horizontal') {
        switch (event.keyCode) {
          case 33:
            // Page Up
            handled = this.pageUp();
            break;
          case 34:
            // Page Down
            handled = this.pageDown();
            break;
        }
      }
      // Prefer mixin result if it's defined, otherwise use base result.
      return handled || super[_symbols2.default.keydown] && super[_symbols2.default.keydown](event);
    }

    /**
     * Scroll down one page.
     */
    pageDown() {
      if (super.pageDown) {
        super.pageDown();
      }
      return scrollOnePage(this, true);
    }

    /**
     * Scroll up one page.
     */
    pageUp() {
      if (super.pageUp) {
        super.pageUp();
      }
      return scrollOnePage(this, false);
    }

    /* Provide a default scrollTarget implementation if none exists. */
    get [_symbols2.default.scrollTarget]() {
      return super[_symbols2.default.scrollTarget] || (0, _defaultScrollTarget2.default)(this);
    }

  }

  return KeyboardPagedSelection;
}

// Return the item whose content spans the given y position (relative to the
// top of the list's scrolling client area), or null if not found.
//
// If downward is true, move down the list of items to find the first item
// found at the given y position; if downward is false, move up the list of
// items to find the last item at that position.
function getIndexOfItemAtY(element, scrollTarget, y, downward) {

  const items = element.items;
  const start = downward ? 0 : items.length - 1;
  const end = downward ? items.length : 0;
  const step = downward ? 1 : -1;

  const topOfClientArea = scrollTarget.offsetTop + scrollTarget.clientTop;

  // Find the item spanning the indicated y coordinate.
  let item;
  let itemIndex = start;
  let itemTop;
  let found = false;
  while (itemIndex !== end) {
    item = items[itemIndex];
    itemTop = item.offsetTop - topOfClientArea;
    const itemBottom = itemTop + item.offsetHeight;
    if (itemTop <= y && itemBottom >= y) {
      // Item spans the indicated y coordinate.
      found = true;
      break;
    }
    itemIndex += step;
  }

  if (!found) {
    return null;
  }

  // We may have found an item whose padding spans the given y coordinate,
  // but whose content is actually above/below that point.
  // TODO: If the item has a border, then padding should be included in
  // considering a hit.
  const itemStyle = getComputedStyle(item);
  const itemPaddingTop = parseFloat(itemStyle.paddingTop);
  const itemPaddingBottom = parseFloat(itemStyle.paddingBottom);
  const contentTop = itemTop + item.clientTop + itemPaddingTop;
  const contentBottom = contentTop + item.clientHeight - itemPaddingTop - itemPaddingBottom;
  if (downward && contentTop <= y || !downward && contentBottom >= y) {
    // The indicated coordinate hits the actual item content.
    return itemIndex;
  } else {
    // The indicated coordinate falls within the item's padding. Back up to
    // the item below/above the item we found and return that.
    return itemIndex - step;
  }
}

// Move by one page downward (if downward is true), or upward (if false).
// Return true if we ended up changing the selection, false if not.
function scrollOnePage(element, downward) {

  // Determine the item visible just at the edge of direction we're heading.
  // We'll select that item if it's not already selected.
  const scrollTarget = element[_symbols2.default.scrollTarget];
  const edge = scrollTarget.scrollTop + (downward ? scrollTarget.clientHeight : 0);
  const indexOfItemAtEdge = getIndexOfItemAtY(element, scrollTarget, edge, downward);

  const selectedIndex = element.selectedIndex;
  let newIndex;
  if (indexOfItemAtEdge && selectedIndex === indexOfItemAtEdge) {
    // The item at the edge was already selected, so scroll in the indicated
    // direction by one page. Leave the new item at that edge selected.
    const delta = (downward ? 1 : -1) * scrollTarget.clientHeight;
    newIndex = getIndexOfItemAtY(element, scrollTarget, edge + delta, downward);
  } else {
    // The item at the edge wasn't selected yet. Instead of scrolling, we'll
    // just select that item. That is, the first attempt to page up/down
    // usually just moves the selection to the edge in that direction.
    newIndex = indexOfItemAtEdge;
  }

  if (!newIndex) {
    // We can't find an item in the direction we want to travel. Select the
    // last item (if moving downward) or first item (if moving upward).
    newIndex = downward ? element.items.length - 1 : 0;
  }

  if (newIndex !== selectedIndex) {
    element.selectedIndex = newIndex;
    return true; // We handled the page up/down ourselves.
  } else {
    return false; // We didn't do anything.
  }
}

},{"./defaultScrollTarget":15,"./symbols":17}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = KeyboardPrefixSelectionMixin;

var _constants = require('./constants');

var _constants2 = _interopRequireDefault(_constants);

var _Symbol = require('./Symbol');

var _Symbol2 = _interopRequireDefault(_Symbol);

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Symbols for private data members on an element.
const itemTextContentsSymbol = (0, _Symbol2.default)('itemTextContents');
const typedPrefixSymbol = (0, _Symbol2.default)('typedPrefix');
const prefixTimeoutSymbol = (0, _Symbol2.default)('prefixTimeout');
const settingSelectionSymbol = (0, _Symbol2.default)('settingSelection');

/**
 * Mixin that handles list box-style prefix typing, in which the user can type
 * a string to select the first item that begins with that string.
 *
 * Example: suppose a component using this mixin has the following items:
 *
 *     <sample-list-component>
 *       <div>Apple</div>
 *       <div>Apricot</div>
 *       <div>Banana</div>
 *       <div>Blackberry</div>
 *       <div>Blueberry</div>
 *       <div>Cantaloupe</div>
 *       <div>Cherry</div>
 *       <div>Lemon</div>
 *       <div>Lime</div>
 *     </sample-list-component>
 *
 * If this component receives the focus, and the user presses the "b" or "B"
 * key, the "Banana" item will be selected, because it's the first item that
 * matches the prefix "b". (Matching is case-insensitive.) If the user now
 * presses the "l" or "L" key quickly, the prefix to match becomes "bl", so
 * "Blackberry" will be selected.
 *
 * The prefix typing feature has a one second timeout — the prefix to match
 * will be reset after a second has passed since the user last typed a key.
 * If, in the above example, the user waits a second between typing "b" and
 * "l", the prefix will become "l", so "Lemon" would be selected.
 *
 * This mixin expects the component to invoke a `keydown` method when a key is
 * pressed. You can use [KeyboardMixin](KeyboardMixin.md) for that
 * purpose, or wire up your own keyboard handling and call `keydown` yourself.
 *
 * This mixin also expects the component to provide an `items` property. The
 * `textContent` of those items will be used for purposes of prefix matching.
 *
 * @module KeyboardPrefixSelectionMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
function KeyboardPrefixSelectionMixin(base) {

  /**
   * The class prototype added by the mixin.
   */
  class KeyboardPrefixSelection extends base {

    // Default implementation returns an item's `alt` attribute or its
    // `textContent`, in that order.
    [_symbols2.default.getItemText](item) {
      return item.getAttribute('alt') || item.textContent;
    }

    // If the set of items has changed, reset the prefix. We'll also need to
    // rebuild our cache of item text the next time we're asked for it.
    [_symbols2.default.itemsChanged]() {
      if (super[_symbols2.default.itemsChanged]) {
        super[_symbols2.default.itemsChanged]();
      }
      this[itemTextContentsSymbol] = null;
      resetTypedPrefix(this);
    }

    [_symbols2.default.keydown](event) {
      let handled;
      let resetPrefix = true;

      switch (event.keyCode) {
        case 8:
          // Backspace
          handleBackspace(this);
          handled = true;
          resetPrefix = false;
          break;
        case 27:
          // Escape
          handled = true;
          break;
        default:
          if (!event.ctrlKey && !event.metaKey && !event.altKey && event.which !== 32 /* Space */) {
              handlePlainCharacter(this, String.fromCharCode(event.keyCode));
            }
          resetPrefix = false;
      }

      if (resetPrefix) {
        resetTypedPrefix(this);
      }

      // Prefer mixin result if it's defined, otherwise use base result.
      return handled || super[_symbols2.default.keydown] && super[_symbols2.default.keydown](event);
    }

    get selectedIndex() {
      return super.selectedIndex;
    }
    set selectedIndex(index) {
      if ('selectedIndex' in base.prototype) {
        super.selectedIndex = index;
      }
      if (!this[settingSelectionSymbol]) {
        // Someone else (not this mixin) has changed the selection. In response,
        // we invalidate the prefix under construction.
        resetTypedPrefix(this);
      }
    }

    /**
     * Select the first item whose text content begins with the given prefix.
     *
     * @param prefix [String] The prefix string to search for
     */
    selectItemWithTextPrefix(prefix) {
      if (super.selectItemWithTextPrefix) {
        super.selectItemWithTextPrefix(prefix);
      }
      if (prefix == null || prefix.length === 0) {
        return;
      }
      const index = getIndexOfItemWithTextPrefix(this, prefix);
      if (index >= 0) {
        // Update the selection. During that operation, set the flag that lets
        // us know that we are the cause of the selection change. See note at
        // this mixin's `selectedIndex` implementation.
        this[settingSelectionSymbol] = true;
        this.selectedIndex = index;
        this[settingSelectionSymbol] = false;
      }
    }

  }

  return KeyboardPrefixSelection;
}

// Return the index of the first item with the given prefix, else -1.
function getIndexOfItemWithTextPrefix(element, prefix) {
  const itemTextContents = getItemTextContents(element);
  const prefixLength = prefix.length;
  for (let i = 0; i < itemTextContents.length; i++) {
    const itemTextContent = itemTextContents[i];
    if (itemTextContent.substr(0, prefixLength) === prefix) {
      return i;
    }
  }
  return -1;
}

// Return an array of the text content (in lowercase) of all items.
// Cache these results.
function getItemTextContents(element) {
  if (!element[itemTextContentsSymbol]) {
    const items = element.items;
    element[itemTextContentsSymbol] = Array.prototype.map.call(items, item => {
      const text = element[_symbols2.default.getItemText](item);
      return text.toLowerCase();
    });
  }
  return element[itemTextContentsSymbol];
}

// Handle the Backspace key: remove the last character from the prefix.
function handleBackspace(element) {
  const length = element[typedPrefixSymbol] ? element[typedPrefixSymbol].length : 0;
  if (length > 0) {
    element[typedPrefixSymbol] = element[typedPrefixSymbol].substr(0, length - 1);
  }
  element.selectItemWithTextPrefix(element[typedPrefixSymbol]);
  setPrefixTimeout(element);
}

// Add a plain character to the prefix.
function handlePlainCharacter(element, char) {
  const prefix = element[typedPrefixSymbol] || '';
  element[typedPrefixSymbol] = prefix + char.toLowerCase();
  element.selectItemWithTextPrefix(element[typedPrefixSymbol]);
  setPrefixTimeout(element);
}

// Stop listening for typing.
function resetPrefixTimeout(element) {
  if (element[prefixTimeoutSymbol]) {
    clearTimeout(element[prefixTimeoutSymbol]);
    element[prefixTimeoutSymbol] = false;
  }
}

// Clear the prefix under construction.
function resetTypedPrefix(element) {
  element[typedPrefixSymbol] = '';
  resetPrefixTimeout(element);
}

// Wait for the user to stop typing.
function setPrefixTimeout(element) {
  resetPrefixTimeout(element);
  element[prefixTimeoutSymbol] = setTimeout(() => {
    resetTypedPrefix(element);
  }, _constants2.default.TYPING_TIMEOUT_DURATION);
}

},{"./Symbol":12,"./constants":13,"./symbols":17}],9:[function(require,module,exports){
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

},{"./symbols":17}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defaultScrollTarget = require('./defaultScrollTarget');

var _defaultScrollTarget2 = _interopRequireDefault(_defaultScrollTarget);

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixin which scrolls a container horizontally and/or vertically to ensure that
 * a newly-selected item is visible to the user.
 *
 * When the selected item in a list-like component changes, the selected item
 * should be brought into view so that the user can confirm their selection.
 *
 * This mixin expects a `selectedItem` property to be set when the selection
 * changes. You can supply that yourself, or use
 * [SingleSelectionMixin](SingleSelectionMixin.md).
 *
 * @module SelectinInViewMixin
 * @param base {Class} the base class to extend
 * @returns {Class} the extended class
 */
exports.default = base => {

  /**
   * The class prototype added by the mixin.
   */
  class SelectionInView extends base {

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }
      const selectedItem = this.selectedItem;
      if (selectedItem) {
        this.scrollItemIntoView(selectedItem);
      }
    }

    /**
     * Scroll the given element completely into view, minimizing the degree of
     * scrolling performed.
     *
     * Blink has a `scrollIntoViewIfNeeded()` function that does something
     * similar, but unfortunately it's non-standard, and in any event often ends
     * up scrolling more than is absolutely necessary.
     *
     * This scrolls the containing element defined by the `scrollTarget`
     * property. See that property for a discussion of the default value of
     * that property.
     *
     * @param {HTMLElement} item - the item to scroll into view.
     */
    scrollItemIntoView(item) {
      if (super.scrollItemIntoView) {
        super.scrollItemIntoView();
      }

      const scrollTarget = this[_symbols2.default.scrollTarget];

      // Determine the bounds of the scroll target and item. We use
      // getBoundingClientRect instead of .offsetTop, etc., because the latter
      // round values, and we want to handle fractional values.
      const scrollTargetRect = scrollTarget.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      // Determine how far the item is outside the viewport.
      const bottomDelta = itemRect.bottom - scrollTargetRect.bottom;
      const topDelta = itemRect.top - scrollTargetRect.top;
      const leftDelta = itemRect.left - scrollTargetRect.left;
      const rightDelta = itemRect.right - scrollTargetRect.right;

      // Scroll the target as necessary to bring the item into view.
      if (bottomDelta > 0) {
        scrollTarget.scrollTop += bottomDelta; // Scroll down
      } else if (topDelta < 0) {
        scrollTarget.scrollTop += Math.ceil(topDelta); // Scroll up
      }
      if (rightDelta > 0) {
        scrollTarget.scrollLeft += rightDelta; // Scroll right
      } else if (leftDelta < 0) {
        scrollTarget.scrollLeft += Math.ceil(leftDelta); // Scroll left
      }
    }

    /* Provide a default scrollTarget implementation if none exists. */
    get [_symbols2.default.scrollTarget]() {
      return super[_symbols2.default.scrollTarget] || (0, _defaultScrollTarget2.default)(this);
    }

    get selectedItem() {
      return super.selectedItem;
    }
    set selectedItem(item) {
      if ('selectedItem' in base.prototype) {
        super.selectedItem = item;
      }
      if (item) {
        // Keep the selected item in view.
        this.scrollItemIntoView(item);
      }
    }
  }

  return SelectionInView;
};

},{"./defaultScrollTarget":15,"./symbols":17}],11:[function(require,module,exports){
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
      const parsed = String(selectionRequired) === 'true';
      const changed = parsed !== this[selectionRequiredSymbol];
      this[selectionRequiredSymbol] = parsed;
      if ('selectionRequired' in base.prototype) {
        super.selectionRequired = selectionRequired;
      }
      if (changed) {
        if (this[_symbols2.default.raiseChangeEvents]) {
          const event = new CustomEvent('selection-required-changed');
          this.dispatchEvent(event);
        }
        if (selectionRequired) {
          trackSelectedItem(this);
        }
      }
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
    set selectionWraps(selectionWraps) {
      const parsed = String(selectionWraps) === 'true';
      const changed = parsed !== this[selectionWrapsSymbol];
      this[selectionWrapsSymbol] = parsed;
      if ('selectionWraps' in base.prototype) {
        super.selectionWraps = selectionWraps;
      }
      if (changed) {
        if (this[_symbols2.default.raiseChangeEvents]) {
          const event = new CustomEvent('selection-wraps-changed');
          this.dispatchEvent(event);
        }
        updatePossibleNavigations(this);
      }
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

},{"./Symbol":12,"./symbols":17}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * A collection of constants used by Elix mixins and components for consistency
 * in things such as user interface timings.
 *
 * @module constants
 */
const constants = {

  /**
   * Time in milliseconds after which the user is considered to have stopped
   * typing.
   *
   * @const {number} TYPING_TIMEOUT_DURATION
   */
  TYPING_TIMEOUT_DURATION: 1000

};

exports.default = constants;

},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assignedChildren = assignedChildren;
exports.assignedChildNodes = assignedChildNodes;
exports.assignedTextContent = assignedTextContent;
exports.filterAuxiliaryElements = filterAuxiliaryElements;
/**
 * Helpers for accessing a component's content.
 *
 * The standard DOM API provides several ways of accessing child content:
 * `children`, `childNodes`, and `textContent`. None of these functions are
 * Shadow DOM aware. This mixin defines variations of those functions that
 * *are* Shadow DOM aware.
 *
 * Example: you create a component `<count-children>` that displays a number
 * equal to the number of children placed inside that component. If someone
 * instantiates your component like:
 *
 *     <count-children>
 *       <div></div>
 *       <div></div>
 *       <div></div>
 *     </count-children>
 *
 * Then the component should show "3", because there are three children. To
 * calculate the number of children, the component can just calculate
 * `this.children.length`. However, suppose someone instantiates your
 * component inside one of their own components, and puts a `<slot>` element
 * inside your component:
 *
 *     <count-children>
 *       <slot></slot>
 *     </count-children>
 *
 * If your component only looks at `this.children`, it will always see exactly
 * one child — the `<slot>` element. But the user looking at the page will
 * *see* any nodes distributed to that slot. To match what the user sees, your
 * component should expand any `<slot>` elements it contains.
 *
 * That is one problem these helpers solve. For example, the helper
 * `assignedChildren` will return all children assigned to your component in
 * the composed tree.
 *
 * @module content
 */

/**
 * An in-order collection of distributed children, expanding any slot
 * elements. Like the standard `children` property, this skips text and other
 * node types which are not Element instances.
 *
 * @param {HTMLElement} element - the element to inspect
 * @returns {Element[]} - the children assigned to the element
 */
function assignedChildren(element) {
  return expandAssignedNodes(element.children, true);
}

/**
 * An in-order collection of distributed child nodes, expanding any slot
 * elements. Like the standard `childNodes` property, this includes text and
 * other types of nodes.
 *
 * @param {HTMLElement} element - the element to inspect
 * @returns {Node[]} - the nodes assigned to the element
 */
function assignedChildNodes(element) {
  return expandAssignedNodes(element.childNodes, false);
}

/**
 * The concatenated `textContent` of all distributed child nodes, expanding
 * any slot elements.
 *
 * @param {HTMLElement} element - the element to inspect
 * @type {string} - the text content of all nodes assigned to the element
 */
function assignedTextContent(element) {
  const strings = assignedChildNodes(element).map(child => child.textContent);
  return strings.join('');
}

/**
 * Return the given elements, filtering out auxiliary elements that aren't
 * typically visible. Given a `NodeList` or array of objects, it will only
 * return array members that are instances of `Element` (`HTMLElement` or
 * `SVGElement`), and not on a blacklist of normally invisible elements
 * (such as `style` or `script`).
 *
 * @param {NodeList|Element[]} elements - the list of elements to filter
 * @returns {Element[]} - the filtered elements
 */
function filterAuxiliaryElements(elements) {

  // These are tags that can appear in the document body, but do not seem to
  // have any user-visible manifestation.
  // See https://developer.mozilla.org/en-US/docs/Web/HTML/Element
  const auxiliaryTags = ['applet', // deprecated
  'basefont', // deprecated
  'embed', 'font', // deprecated
  'frame', // deprecated
  'frameset', // deprecated
  'isindex', // deprecated
  'keygen', // deprecated
  'link', 'multicol', // deprecated
  'nextid', // deprecated
  'noscript', 'object', 'param', 'script', 'style', 'template', 'noembed' // deprecated
  ];

  return [].filter.call(elements, element => element instanceof Element && (!element.localName || auxiliaryTags.indexOf(element.localName) < 0));
}

//
// Helpers for the helper functions
//

/*
 * Given a array of nodes, return a new array with any `slot` elements expanded
 * to the nodes assigned to those slots.
 *
 * If ElementsOnly is true, only Element instances are returned, as with the
 * standard `children` property. Otherwise, all nodes are returned, as in the
 * standard `childNodes` property.
 */
function expandAssignedNodes(nodes, ElementsOnly) {
  const expanded = Array.prototype.map.call(nodes, node => {

    // We want to see if the node is an instanceof HTMLSlotELement, but
    // that class won't exist if the browser that doesn't support native
    // Shadow DOM and if the Shadow DOM polyfill hasn't been loaded. Instead,
    // we do a simplistic check to see if the tag name is "slot".
    const isSlot = typeof HTMLSlotElement !== 'undefined' ? node instanceof HTMLSlotElement : node.localName === 'slot';

    return isSlot ? node.assignedNodes({ flatten: true }) : [node];
  });
  const flattened = [].concat(...expanded);
  const result = ElementsOnly ? flattened.filter(node => node instanceof Element) : flattened;
  return result;
}

},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = defaultScrollTarget;
/**
 * Return a guess as to what portion of the given element can be scrolled.
 * This can be used to provide a default implementation of
 * [symbols.scrollTarget].
 *
 * If the element has a shadow root containing a default (unnamed) slot, this
 * returns the first ancestor of that slot that is styled with `overflow-y:
 * auto` or `overflow-y: scroll`. If the element has no default slot, or no
 * scrolling ancestor is found, the element itself is returned.
 *
 * @type {HTMLElement}
 */
function defaultScrollTarget(element) {
  const slot = element.shadowRoot && element.shadowRoot.querySelector('slot:not([name])');
  return slot ? getScrollingParent(slot, element) : element;
}

// Return the parent of the given element that can be scroll vertically. If no
// such element is found, return the given root element.
function getScrollingParent(element, root) {
  if (element === null || element === root) {
    // Didn't find a scrolling parent; use the root element instead.
    return root;
  }
  const overflowY = getComputedStyle(element).overflowY;
  if (overflowY === 'scroll' || overflowY === 'auto') {
    // Found an element we can scroll vertically.
    return element;
  }
  // Keep looking higher in the hierarchy for a scrolling parent.
  return getScrollingParent(element.parentNode, root);
}

},{}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = microtask;
/*
 * Microtask helper for IE 11.
 *
 * Executing a function as a microtask is trivial in browsers that support
 * promises, whose then() clauses use microtask timing. IE 11 doesn't support
 * promises, but does support MutationObservers, which are also executed as
 * microtasks. So this helper uses an MutationObserver to achieve microtask
 * timing.
 *
 * See https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
 *
 * Inspired by Polymer's async() function.
 */

// The queue of pending callbacks to be executed as microtasks.
const callbacks = [];

// Create an element that we will modify to force observable mutations.
const element = document.createTextNode('');

// A monotonically-increasing value.
let counter = 0;

/**
 * Add a callback to the microtask queue.
 *
 * This uses a MutationObserver so that it works on IE 11.
 *
 * NOTE: IE 11 may actually use timeout timing with MutationObservers. This
 * needs more investigation.
 *
 * @function microtask
 * @param {function} callback
 */
function microtask(callback) {
  callbacks.push(callback);
  // Force a mutation.
  element.textContent = ++counter;
}

// Execute any pending callbacks.
function executeCallbacks() {
  while (callbacks.length > 0) {
    const callback = callbacks.shift();
    callback();
  }
}

// Create the observer.
const observer = new MutationObserver(executeCallbacks);
observer.observe(element, {
  characterData: true
});

},{}],17:[function(require,module,exports){
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
   * Symbols for the `content` property.
   *
   * This property returns the component's content -- however the component
   * wants to define that. This could, for example, return the component's
   * distributed children.
   *
   * @type {HTMLElement[]}
   */
  content: (0, _Symbol2.default)('content'),

  /**
   * Symbol for the `contentChanged` method.
   *
   * For components that define a `content` property, this method should be
   * invoked when that property changes.
   *
   * @function contentChanged
   */
  contentChanged: (0, _Symbol2.default)('contentChanged'),

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
   * Symbol for the `getItemText` method.
   *
   * This method can be applied to an item to return its text.
   *
   * @function getText
   * @param {HTMLElement} item - the item to extract text from
   * @returns {string} - the text of the item
   */
  getItemText: (0, _Symbol2.default)('getText'),

  /**
   * Symbol for the `goDown` method.
   *
   * This method is invoked when the user wants to go/navigate down.
   *
   * @function goDown
   */
  goDown: (0, _Symbol2.default)('goDown'),

  /**
   * Symbol for the `goEnd` method.
   *
   * This method is invoked when the user wants to go/navigate to the end (e.g.,
   * of a list).
   *
   * @function goEnd
   */
  goEnd: (0, _Symbol2.default)('goEnd'),

  /**
   * Symbol for the `goLeft` method.
   *
   * This method is invoked when the user wants to go/navigate left.
   *
   * @function goLeft
   */
  goLeft: (0, _Symbol2.default)('goLeft'),

  /**
   * Symbol for the `goRight` method.
   *
   * This method is invoked when the user wants to go/navigate right.
   *
   * @function goRight
   */
  goRight: (0, _Symbol2.default)('goRight'),

  /**
   * Symbol for the `goStart` method.
   *
   * This method is invoked when the user wants to go/navigate to the start
   * (e.g., of a list).
   *
   * @function goStart
   */
  goStart: (0, _Symbol2.default)('goStart'),

  /**
   * Symbol for the `goUp` method.
   *
   * This method is invoked when the user wants to go/navigate up.
   *
   * @function goUp
   */
  goUp: (0, _Symbol2.default)('goUp'),

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
   *
   * @function itemsChanged
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
   * Symbol for the `keydown` method.
   *
   * This method is invoked when an element receives a `keydown` event.
   *
   * @function keydown
   * @param {KeyboardEvent} event - the event being processed
   */
  keydown: (0, _Symbol2.default)('keydown'),

  /**
   * Indicates the general horizontal and/or vertical orientation of the
   * component. This may affect both presentation and behavior (e.g., of
   * keyboard navigation).
   *
   * Accepted values are "horizontal", "vertical", or "both" (the default).
   *
   * @type {string}
   */
  orientation: (0, _Symbol2.default)('orientation'),

  /**
   * Symbol for the `raiseChangeEvents` property.
   *
   * This property is used by mixins to determine whether they should raise
   * property change events. The standard HTML pattern is to only raise such
   * events in response to direct user interactions. For a detailed discussion
   * of this point, see the Gold Standard checklist item for
   * [Propery Change Events](https://github.com/webcomponents/gold-standard/wiki/Property%20Change%20Events).
   *
   * The above article describes a pattern for using a flag to track whether
   * work is being performed in response to internal component activity, and
   * whether the component should therefore raise property change events.
   * This `raiseChangeEvents` symbol is a shared flag used for that purpose by
   * all Elix mixins and components. Sharing this flag ensures that internal
   * activity (e.g., a UI event listener) in one mixin can signal other mixins
   * handling affected properties to raise change events.
   *
   * All UI event listeners (and other forms of internal handlers, such as
   * timeouts and async network handlers) should set `raiseChangeEvents` to
   * `true` at the start of the event handler, then `false` at the end:
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
   * @var {boolean} raiseChangeEvents
   */
  raiseChangeEvents: (0, _Symbol2.default)('raiseChangeEvents'),

  /**
   * Symbol for the `shadowCreated` method.
   *
   * This method is invoked when the component's shadow root has been attached
   * and populated. Other code can handle this method to perform initialization
   * that depends upon the existence of a populated shadow subtree.
   *
   * @function shadowCreated
   */
  shadowCreated: (0, _Symbol2.default)('shadowCreated'),

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

},{"./Symbol":12}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toggleClass;
/**
 * Helper function for standard classList.toggle() behavior on old browsers,
 * namely IE 11.
 *
 * The standard
 * [classlist](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList)
 * object has a `toggle()` function that supports a second Boolean parameter
 * that can be used to succinctly turn a class on or off. This feature is often
 * useful in designing custom elements, which may want to externally reflect
 * component state in a CSS class that can be used for styling purposes.
 *
 * Unfortunately, IE 11 does not support the Boolean parameter to
 * `classList.toggle()`. This helper function behaves like the standard
 * `toggle()`, including support for the Boolean parameter, so that it can be
 * used even on IE 11.
 *
 * @function toggleClass
 * @param {HTMLElement} element - The element to modify
 * @param {string} className - The class to add/remove
 * @param {boolean} [force] - Force the class to be added (if true) or removed
 *                            (if false)
 */
function toggleClass(element, className, force) {
  const classList = element.classList;
  const addClass = typeof force === 'undefined' ? !classList.contains(className) : force;
  if (addClass) {
    classList.add(className);
  } else {
    classList.remove(className);
  }
  return addClass;
}

},{}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ChildrenContentMixin = require('elix/elements/elix-mixins/src/ChildrenContentMixin');

var _ChildrenContentMixin2 = _interopRequireDefault(_ChildrenContentMixin);

var _ClickSelectionMixin = require('elix/elements/elix-mixins/src/ClickSelectionMixin');

var _ClickSelectionMixin2 = _interopRequireDefault(_ClickSelectionMixin);

var _ContentItemsMixin = require('elix/elements/elix-mixins/src/ContentItemsMixin');

var _ContentItemsMixin2 = _interopRequireDefault(_ContentItemsMixin);

var _DirectionSelectionMixin = require('elix/elements/elix-mixins/src/DirectionSelectionMixin');

var _DirectionSelectionMixin2 = _interopRequireDefault(_DirectionSelectionMixin);

var _KeyboardDirectionMixin = require('elix/elements/elix-mixins/src/KeyboardDirectionMixin');

var _KeyboardDirectionMixin2 = _interopRequireDefault(_KeyboardDirectionMixin);

var _KeyboardMixin = require('elix/elements/elix-mixins/src/KeyboardMixin');

var _KeyboardMixin2 = _interopRequireDefault(_KeyboardMixin);

var _KeyboardPagedSelectionMixin = require('elix/elements/elix-mixins/src/KeyboardPagedSelectionMixin');

var _KeyboardPagedSelectionMixin2 = _interopRequireDefault(_KeyboardPagedSelectionMixin);

var _KeyboardPrefixSelectionMixin = require('elix/elements/elix-mixins/src/KeyboardPrefixSelectionMixin');

var _KeyboardPrefixSelectionMixin2 = _interopRequireDefault(_KeyboardPrefixSelectionMixin);

var _SelectionAriaMixin = require('elix/elements/elix-mixins/src/SelectionAriaMixin');

var _SelectionAriaMixin2 = _interopRequireDefault(_SelectionAriaMixin);

var _SelectionInViewMixin = require('elix/elements/elix-mixins/src/SelectionInViewMixin');

var _SelectionInViewMixin2 = _interopRequireDefault(_SelectionInViewMixin);

var _SingleSelectionMixin = require('elix/elements/elix-mixins/src/SingleSelectionMixin');

var _SingleSelectionMixin2 = _interopRequireDefault(_SingleSelectionMixin);

var _symbols = require('elix/elements/elix-mixins/src/symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Apply a set of Elix mixins to the Polymer.Element base class.
// Use `reduce` to apply all the mixin functions.
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

const mixins = [_ChildrenContentMixin2.default, _ClickSelectionMixin2.default, _ContentItemsMixin2.default, _DirectionSelectionMixin2.default, _KeyboardDirectionMixin2.default, _KeyboardMixin2.default, _KeyboardPagedSelectionMixin2.default, _KeyboardPrefixSelectionMixin2.default, _SelectionAriaMixin2.default, _SelectionInViewMixin2.default, _SingleSelectionMixin2.default];

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
  get [_symbols2.default.defaults]() {
    const defaults = super[_symbols2.default.defaults] || {};
    // By default, we assume the list presents list items vertically.
    defaults.orientation = 'vertical';
    return defaults;
  }

  // Map item selection to a `selected` CSS class.
  [_symbols2.default.itemSelected](item, selected) {
    if (super[_symbols2.default.itemSelected]) {
      super[_symbols2.default.itemSelected](item, selected);
    }
    item.classList.toggle('selected', selected);
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

}

customElements.define('sample-list-box', ListBox);
exports.default = ListBox;

},{"elix/elements/elix-mixins/src/ChildrenContentMixin":1,"elix/elements/elix-mixins/src/ClickSelectionMixin":2,"elix/elements/elix-mixins/src/ContentItemsMixin":3,"elix/elements/elix-mixins/src/DirectionSelectionMixin":4,"elix/elements/elix-mixins/src/KeyboardDirectionMixin":5,"elix/elements/elix-mixins/src/KeyboardMixin":6,"elix/elements/elix-mixins/src/KeyboardPagedSelectionMixin":7,"elix/elements/elix-mixins/src/KeyboardPrefixSelectionMixin":8,"elix/elements/elix-mixins/src/SelectionAriaMixin":9,"elix/elements/elix-mixins/src/SelectionInViewMixin":10,"elix/elements/elix-mixins/src/SingleSelectionMixin":11,"elix/elements/elix-mixins/src/symbols":17}],20:[function(require,module,exports){
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

},{"elix/elements/elix-mixins/src/SingleSelectionMixin":11,"elix/elements/elix-mixins/src/symbols":17}]},{},[19,20])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ2hpbGRyZW5Db250ZW50TWl4aW4uanMiLCJub2RlX21vZHVsZXMvZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ2xpY2tTZWxlY3Rpb25NaXhpbi5qcyIsIm5vZGVfbW9kdWxlcy9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9Db250ZW50SXRlbXNNaXhpbi5qcyIsIm5vZGVfbW9kdWxlcy9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9EaXJlY3Rpb25TZWxlY3Rpb25NaXhpbi5qcyIsIm5vZGVfbW9kdWxlcy9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9LZXlib2FyZERpcmVjdGlvbk1peGluLmpzIiwibm9kZV9tb2R1bGVzL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0tleWJvYXJkTWl4aW4uanMiLCJub2RlX21vZHVsZXMvZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvS2V5Ym9hcmRQYWdlZFNlbGVjdGlvbk1peGluLmpzIiwibm9kZV9tb2R1bGVzL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0tleWJvYXJkUHJlZml4U2VsZWN0aW9uTWl4aW4uanMiLCJub2RlX21vZHVsZXMvZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU2VsZWN0aW9uQXJpYU1peGluLmpzIiwibm9kZV9tb2R1bGVzL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL1NlbGVjdGlvbkluVmlld01peGluLmpzIiwibm9kZV9tb2R1bGVzL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL1NpbmdsZVNlbGVjdGlvbk1peGluLmpzIiwibm9kZV9tb2R1bGVzL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL1N5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9jb25zdGFudHMuanMiLCJub2RlX21vZHVsZXMvZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvY29udGVudC5qcyIsIm5vZGVfbW9kdWxlcy9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9kZWZhdWx0U2Nyb2xsVGFyZ2V0LmpzIiwibm9kZV9tb2R1bGVzL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL21pY3JvdGFzay5qcyIsIm5vZGVfbW9kdWxlcy9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9zeW1ib2xzLmpzIiwibm9kZV9tb2R1bGVzL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL3RvZ2dsZUNsYXNzLmpzIiwic3JjL0xpc3RCb3guanMiLCJzcmMvU2luZ2xlU2VsZWN0aW9uRGVtby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O2tCQ2dFd0Isb0I7O0FBaEV4Qjs7QUFDQTs7OztBQUNBOzs7Ozs7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyRGUsU0FBUyxvQkFBVCxDQUE4QixJQUE5QixFQUFvQzs7QUFFakQ7OztBQUdBLFFBQU0sZUFBTixTQUE4QixJQUE5QixDQUFtQzs7QUFFakMsa0JBQWM7QUFDWjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBVSxNQUFNO0FBQ2QsWUFBSSxLQUFLLGtCQUFRLGNBQWIsQ0FBSixFQUFrQztBQUNoQyxlQUFLLGtCQUFRLGNBQWI7QUFDRDtBQUNGLE9BSkQ7QUFLRDs7QUFFRDs7Ozs7Ozs7O0FBU0EsU0FBSyxrQkFBUSxPQUFiLElBQXdCO0FBQ3RCLGFBQU8sK0JBQWlCLElBQWpCLENBQVA7QUFDRDs7QUFFRCxLQUFDLGtCQUFRLGFBQVQsSUFBMEI7QUFDeEIsVUFBSSxNQUFNLGtCQUFRLGFBQWQsQ0FBSixFQUFrQztBQUFFLGNBQU0sa0JBQVEs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QUFzQixvQkFBb0IsRUFBMUMsRUFBOEMsbUJBQTlDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7IGFzc2lnbmVkQ2hpbGRyZW4gfSBmcm9tICcuL2NvbnRlbnQnO1xuaW1wb3J0IG1pY3JvdGFzayBmcm9tICcuL21pY3JvdGFzayc7XG5pbXBvcnQgc3ltYm9scyBmcm9tICcuL3N5bWJvbHMnO1xuXG5cbi8qKlxuICogTWl4aW4gd2hpY2ggZGVmaW5lcyBhIGNvbXBvbmVudCdzIGBzeW1ib2xzLmNvbnRlbnRgIHByb3BlcnR5IGFzIGFsbFxuICogY2hpbGQgZWxlbWVudHMsIGluY2x1ZGluZyBlbGVtZW50cyBkaXN0cmlidXRlZCB0byB0aGUgY29tcG9uZW50J3Mgc2xvdHMuXG4gKlxuICogVGhpcyBhbHNvIHByb3ZpZGVzIG5vdGlmaWNhdGlvbiBvZiBjaGFuZ2VzIHRvIGEgY29tcG9uZW50J3MgY29udGVudC4gSXRcbiAqIHdpbGwgaW52b2tlIGEgYHN5bWJvbHMuY29udGVudENoYW5nZWRgIG1ldGhvZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgZmlyc3RcbiAqIGluc3RhbnRpYXRlZCwgYW5kIHdoZW5ldmVyIGl0cyBkaXN0cmlidXRlZCBjaGlsZHJlbiBjaGFuZ2UuIFRoaXMgaXMgaW50ZW5kZWRcbiAqIHRvIHNhdGlzZnkgdGhlIEdvbGQgU3RhbmRhcmQgY2hlY2tsaXN0IGl0ZW0gZm9yIG1vbml0b3JpbmdcbiAqIFtDb250ZW50IENoYW5nZXNdKGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJjb21wb25lbnRzL2dvbGQtc3RhbmRhcmQvd2lraS9Db250ZW50LUNoYW5nZXMpLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBsZXQgYmFzZSA9IENoaWxkcmVuQ29udGVudE1peGluKERpc3RyaWJ1dGVkQ2hpbGRyZW5NaXhpbihIVE1MRWxlbWVudCkpO1xuICogY2xhc3MgQ291bnRpbmdFbGVtZW50IGV4dGVuZHMgYmFzZSB7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBzdXBlcigpO1xuICogICAgIGxldCByb290ID0gdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XG4gKiAgICAgcm9vdC5pbm5lckhUTUwgPSBgPHNsb3Q+PC9zbG90PmA7XG4gKiAgICAgdGhpc1tzeW1ib2xzLnNoYWRvd0NyZWF0ZWRdKCk7XG4gKiAgIH1cbiAqXG4gKiAgIFtzeW1ib2xzLmNvbnRlbnRDaGFuZ2VkXSgpIHtcbiAqICAgICBpZiAoc3VwZXJbc3ltYm9scy5jb250ZW50Q2hhbmdlZF0pIHsgc3VwZXJbc3ltYm9scy5jb250ZW50Q2hhbmdlZF0oKTsgfVxuICogICAgIC8vIENvdW50IHRoZSBjb21wb25lbnQncyBjaGlsZHJlbiwgYm90aCBpbml0aWFsbHkgYW5kIHdoZW4gY2hhbmdlZC5cbiAqICAgICB0aGlzLmNvdW50ID0gdGhpcy5kaXN0cmlidXRlZENoaWxkcmVuLmxlbmd0aDtcbiAqICAgfVxuICpcbiAqIH1cbiAqIGBgYFxuICpcbiAqIE5vdGUgdGhhdCBjb250ZW50IGNoYW5nZSBkZXRlY3Rpb24gZGVwZW5kcyB1cG9uIHRoZSBlbGVtZW50IGhhdmluZyBhdCBsZWFzdFxuICogb25lIGBzbG90YCBlbGVtZW50IGluIGl0cyBzaGFkb3cgc3VidHJlZS5cbiAqXG4gKiBUaGlzIG1peGluIGlzIGludGVuZGVkIGZvciB1c2Ugd2l0aCB0aGVcbiAqIFtEaXN0cmlidXRlZENoaWxkcmVuTWl4aW5dKERpc3RyaWJ1dGVkQ2hpbGRyZW5NaXhpbi5tZCkuIFNlZSB0aGF0IG1peGluIGZvclxuICogYSBkaXNjdXNzaW9uIG9mIGhvdyB0aGF0IHdvcmtzLiBUaGlzIENoaWxkcmVuQ29udGVudE1peGluXG4gKiBwcm92aWRlcyBhbiBlYXN5IHdheSBvZiBkZWZpbmluZyB0aGUgXCJjb250ZW50XCIgb2YgYSBjb21wb25lbnQgYXMgdGhlXG4gKiBjb21wb25lbnQncyBkaXN0cmlidXRlZCBjaGlsZHJlbi4gVGhhdCBpbiB0dXJuIGxldHMgbWl4aW5zIGxpa2VcbiAqIFtDb250ZW50SXRlbXNNaXhpbl0oQ29udGVudEl0ZW1zTWl4aW4ubWQpIG1hbmlwdWxhdGUgdGhlIGNoaWxkcmVuIGFzIGxpc3RcbiAqIGl0ZW1zLlxuICpcbiAqIFRvIHJlY2VpdmUgYGNvbnRlbnRDaGFuZ2VkYCBub3RpZmljYXRpb24sIHRoaXMgbWl4aW4gZXhwZWN0cyBhIGNvbXBvbmVudCB0b1xuICogaW52b2tlIGEgbWV0aG9kIGNhbGxlZCBgc3ltYm9scy5zaGFkb3dDcmVhdGVkYCBhZnRlciB0aGUgY29tcG9uZW50J3Mgc2hhZG93XG4gKiByb290IGhhcyBiZWVuIGNyZWF0ZWQgYW5kIHBvcHVsYXRlZC5cbiAqXG4gKiBOb3RlOiBUaGlzIG1peGluIHJlbGllcyB1cG9uIHRoZSBicm93c2VyIGZpcmluZyBgc2xvdGNoYW5nZWAgZXZlbnRzIHdoZW4gdGhlXG4gKiBjb250ZW50cyBvZiBhIGBzbG90YCBjaGFuZ2UuIFNhZmFyaSBhbmQgdGhlIHBvbHlmaWxscyBmaXJlIHRoaXMgZXZlbnQgd2hlbiBhXG4gKiBjdXN0b20gZWxlbWVudCBpcyBmaXJzdCB1cGdyYWRlZCwgd2hpbGUgQ2hyb21lIGRvZXMgbm90LiBUaGlzIG1peGluIGFsd2F5c1xuICogaW52b2tlcyB0aGUgYGNvbnRlbnRDaGFuZ2VkYCBtZXRob2QgYWZ0ZXIgY29tcG9uZW50IGluc3RhbnRpYXRpb24gc28gdGhhdCB0aGVcbiAqIG1ldGhvZCB3aWxsIGFsd2F5cyBiZSBpbnZva2VkIGF0IGxlYXN0IG9uY2UuIEhvd2V2ZXIsIG9uIFNhZmFyaSAoYW5kIHBvc3NpYmx5XG4gKiBvdGhlciBicm93c2VycyksIGBjb250ZW50Q2hhbmdlZGAgbWlnaHQgYmUgaW52b2tlZCBfdHdpY2VfIGZvciBhIG5ld1xuICogY29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIEBtb2R1bGUgQ2hpbGRyZW5Db250ZW50TWl4aW5cbiAqIEBwYXJhbSBiYXNlIHtDbGFzc30gdGhlIGJhc2UgY2xhc3MgdG8gZXh0ZW5kXG4gKiBAcmV0dXJucyB7Q2xhc3N9IHRoZSBleHRlbmRlZCBjbGFzc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBDaGlsZHJlbkNvbnRlbnRNaXhpbihiYXNlKSB7XG5cbiAgLyoqXG4gICAqIFRoZSBjbGFzcyBwcm90b3R5cGUgYWRkZWQgYnkgdGhlIG1peGluLlxuICAgKi9cbiAgY2xhc3MgQ2hpbGRyZW5Db250ZW50IGV4dGVuZHMgYmFzZSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG5cbiAgICAgIC8vIE1ha2UgYW4gaW5pdGlhbCBjYWxsIHRvIGNvbnRlbnRDaGFuZ2VkKCkgc28gdGhhdCB0aGUgY29tcG9uZW50IGNhbiBkb1xuICAgICAgLy8gaW5pdGlhbGl6YXRpb24gdGhhdCBpdCBub3JtYWxseSBkb2VzIHdoZW4gY29udGVudCBjaGFuZ2VzLlxuICAgICAgLy9cbiAgICAgIC8vIFRoaXMgd2lsbCBpbnZva2UgY29udGVudENoYW5nZWQoKSBoYW5kbGVycyBpbiBvdGhlciBtaXhpbnMuIEluIG9yZGVyXG4gICAgICAvLyB0aGF0IHRob3NlIG1peGlucyBoYXZlIGEgY2hhbmNlIHRvIGNvbXBsZXRlIHRoZWlyIG93biBpbml0aWFsaXphdGlvbixcbiAgICAgIC8vIHdlIGFkZCB0aGUgY29udGVudENoYW5nZWQoKSBjYWxsIHRvIHRoZSBtaWNyb3Rhc2sgcXVldWUuXG4gICAgICBtaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICBpZiAodGhpc1tzeW1ib2xzLmNvbnRlbnRDaGFuZ2VkXSkge1xuICAgICAgICAgIHRoaXNbc3ltYm9scy5jb250ZW50Q2hhbmdlZF0oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNvbnRlbnQgb2YgdGhpcyBjb21wb25lbnQsIGRlZmluZWQgdG8gYmUgdGhlIGZsYXR0ZW5lZCBhcnJheSBvZlxuICAgICAqIGNoaWxkcmVuIGRpc3RyaWJ1dGVkIHRvIHRoZSBjb21wb25lbnQuXG4gICAgICpcbiAgICAgKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIHByb3BlcnR5IG9ubHkgcmV0dXJucyBpbnN0YW5jZXMgb2ZcbiAgICAgKiBFbGVtZW50XG4gICAgICpcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnRbXX1cbiAgICAgKi9cbiAgICBnZXQgW3N5bWJvbHMuY29udGVudF0oKSB7XG4gICAgICByZXR1cm4gYXNzaWduZWRDaGlsZHJlbih0aGlzKTtcbiAgICB9XG5cbiAgICBbc3ltYm9scy5zaGFkb3dDcmVhdGVkXSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLnNoYWRvd0NyZWF0ZWRdKSB7IHN1cGVyW3N5bWJvbHMuc2hhZG93Q3JlYXRlZF0oKTsgfVxuICAgICAgLy8gTGlzdGVuIHRvIGNoYW5nZXMgb24gYWxsIHNsb3RzLlxuICAgICAgY29uc3Qgc2xvdHMgPSB0aGlzLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvckFsbCgnc2xvdCcpO1xuICAgICAgc2xvdHMuZm9yRWFjaChzbG90ID0+IHNsb3QuYWRkRXZlbnRMaXN0ZW5lcignc2xvdGNoYW5nZScsIGV2ZW50ID0+IHtcbiAgICAgICAgaWYgKHRoaXNbc3ltYm9scy5jb250ZW50Q2hhbmdlZF0pIHtcbiAgICAgICAgICB0aGlzW3N5bWJvbHMuY29udGVudENoYW5nZWRdKCk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gQ2hpbGRyZW5Db250ZW50O1xufVxuIiwiaW1wb3J0IHN5bWJvbHMgZnJvbSAnLi9zeW1ib2xzJztcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIG1hcHMgYSBjbGljayAoYWN0dWFsbHksIGEgbW91c2Vkb3duKSB0byBhIHNlbGVjdGlvbi5cbiAqXG4gKiBUaGlzIHNpbXBsZSBtaXhpbiBpcyB1c2VmdWwgaW4gbGlzdCBib3gtbGlrZSBlbGVtZW50cywgd2hlcmUgYSBjbGljayBvbiBhXG4gKiBsaXN0IGl0ZW0gaW1wbGljaXRseSBzZWxlY3RzIGl0LlxuICpcbiAqIFRoZSBzdGFuZGFyZCB1c2UgZm9yIHRoaXMgbWl4aW4gaXMgaW4gbGlzdC1saWtlIGVsZW1lbnRzLiBOYXRpdmUgbGlzdFxuICogYm94ZXMgZG9uJ3QgYXBwZWFyIHRvIGJlIGNvbnNpc3RlbnQgd2l0aCByZWdhcmQgdG8gd2hldGhlciB0aGV5IHNlbGVjdFxuICogb24gbW91c2Vkb3duIG9yIGNsaWNrL21vdXNldXAuIFRoaXMgbWl4aW4gYXNzdW1lcyB0aGUgdXNlIG9mIG1vdXNlZG93bi5cbiAqIE9uIHRvdWNoIGRldmljZXMsIHRoYXQgZXZlbnQgYXBwZWFycyB0byB0cmlnZ2VyIHdoZW4gdGhlIHRvdWNoIGlzICpyZWxlYXNlZCouXG4gKlxuICogVGhpcyBtaXhpbiBvbmx5IGxpc3RlbnMgdG8gbW91c2Vkb3duIGV2ZW50cyBmb3IgdGhlIHByaW1hcnkgbW91c2UgYnV0dG9uXG4gKiAodHlwaWNhbGx5IHRoZSBsZWZ0IGJ1dHRvbikuIFJpZ2h0LWNsaWNrcyBhcmUgaWdub3JlZCBzbyB0aGF0IHRoZSBicm93c2VyXG4gKiBtYXkgZGlzcGxheSBhIGNvbnRleHQgbWVudS5cbiAqXG4gKiBNdWNoIGhhcyBiZWVuIHdyaXR0ZW4gYWJvdXQgaG93IHRvIGVuc3VyZSBcImZhc3QgdGFwXCIgYmVoYXZpb3Igb24gbW9iaWxlXG4gKiBkZXZpY2VzLiBUaGlzIG1peGluIG1ha2VzIGEgdmVyeSBzdHJhaWdodGZvcndhcmQgdXNlIG9mIGEgc3RhbmRhcmQgZXZlbnQsIGFuZFxuICogdGhpcyBhcHBlYXJzIHRvIHBlcmZvcm0gd2VsbCBvbiBtb2JpbGUgZGV2aWNlcyB3aGVuLCBlLmcuLCB0aGUgdmlld3BvcnQgaXNcbiAqIGNvbmZpZ3VyZWQgd2l0aCBgd2lkdGg9ZGV2aWNlLXdpZHRoYC5cbiAqXG4gKiBUaGlzIG1peGluIGV4cGVjdHMgdGhlIGNvbXBvbmVudCB0byBwcm92aWRlIGFuIGBpdGVtc2AgcHJvcGVydHkuIEl0IGFsc29cbiAqIGV4cGVjdHMgdGhlIGNvbXBvbmVudCB0byBkZWZpbmUgYSBgc2VsZWN0ZWRJdGVtYCBwcm9wZXJ0eTsgeW91IGNhbiBwcm92aWRlXG4gKiB0aGF0IHlvdXJzZWxmLCBvciB1c2UgW1NpbmdsZVNlbGVjdGlvbk1peGluXShTaW5nbGVTZWxlY3Rpb25NaXhpbi5tZCkuXG4gKlxuICogSWYgdGhlIGNvbXBvbmVudCByZWNlaXZlcyBhIGNsaWNrcyB0aGF0IGRvZXNuJ3QgY29ycmVzcG9uZCB0byBhbiBpdGVtIChlLmcuLFxuICogdGhlIHVzZXIgY2xpY2tzIG9uIHRoZSBlbGVtZW50IGJhY2tncm91bmQgdmlzaWJsZSBiZXR3ZWVuIGl0ZW1zKSwgdGhlXG4gKiBzZWxlY3Rpb24gd2lsbCBiZSByZW1vdmVkLiBIb3dldmVyLCBpZiB0aGUgY29tcG9uZW50IGRlZmluZXMgYVxuICogYHNlbGVjdGlvblJlcXVpcmVkYCBhbmQgdGhpcyBpcyB0cnVlLCBhIGJhY2tncm91bmQgY2xpY2sgd2lsbCAqbm90KiByZW1vdmVcbiAqIHRoZSBzZWxlY3Rpb24uXG4gKlxuICogQG1vZHVsZSBDbGlja1NlbGVjdGlvbk1peGluXG4gKiBAcGFyYW0gYmFzZSB7Q2xhc3N9IHRoZSBiYXNlIGNsYXNzIHRvIGV4dGVuZFxuICogQHJldHVybnMge0NsYXNzfSB0aGUgZXh0ZW5kZWQgY2xhc3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ2xpY2tTZWxlY3Rpb25NaXhpbihiYXNlKSB7XG5cbiAgLyoqXG4gICAqIFRoZSBjbGFzcyBwcm90b3R5cGUgYWRkZWQgYnkgdGhlIG1peGluLlxuICAgKi9cbiAgY2xhc3MgQ2xpY2tTZWxlY3Rpb24gZXh0ZW5kcyBiYXNlIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgc3VwZXIoKTtcbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZXZlbnQgPT4ge1xuXG4gICAgICAgIC8vIE9ubHkgcHJvY2VzcyBldmVudHMgZm9yIHRoZSBtYWluICh1c3VhbGx5IGxlZnQpIGJ1dHRvbi5cbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10gPSB0cnVlO1xuXG4gICAgICAgIC8vIElmIHRoZSBpdGVtIGNsaWNrZWQgb24gaXMgYSBidXR0b24sIHRoZSBldmVudCBzZWVtcyB0byBiZSByYWlzZWQgaW5cbiAgICAgICAgLy8gcGhhc2UgMiAoQVRfVEFSR0VUKSDigJQgYnV0IHRoZSBldmVudCB0YXJnZXQgd2lsbCBiZSB0aGUgY29tcG9uZW50LCBub3RcbiAgICAgICAgLy8gdGhlIGl0ZW0gdGhhdCB3YXMgY2xpY2tlZCBvbi5cbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0ID09PSB0aGlzID9cbiAgICAgICAgICBldmVudC5wYXRoWzBdIDogLy8gRXZlbnQgdGFyZ2V0IGlzbid0IHRoZSBpdGVtLCBzbyBnZXQgaXQgZnJvbSBwYXRoLlxuICAgICAgICAgIGV2ZW50LnRhcmdldDtcblxuICAgICAgICAvLyBGaW5kIHdoaWNoIGl0ZW0gd2FzIGNsaWNrZWQgb24gYW5kLCBpZiBmb3VuZCwgc2VsZWN0IGl0LiBGb3IgZWxlbWVudHNcbiAgICAgICAgLy8gd2hpY2ggZG9uJ3QgcmVxdWlyZSBhIHNlbGVjdGlvbiwgYSBiYWNrZ3JvdW5kIGNsaWNrIHdpbGwgZGV0ZXJtaW5lXG4gICAgICAgIC8vIHRoZSBpdGVtIHdhcyBudWxsLCBpbiB3aGljaCB3ZSBjYXNlIHdlJ2xsIHJlbW92ZSB0aGUgc2VsZWN0aW9uLlxuICAgICAgICBjb25zdCBpdGVtID0gaXRlbUZvclRhcmdldCh0aGlzLCB0YXJnZXQpO1xuICAgICAgICBpZiAoaXRlbSB8fCAhdGhpcy5zZWxlY3Rpb25SZXF1aXJlZCkge1xuXG4gICAgICAgICAgaWYgKCEoJ3NlbGVjdGVkSXRlbScgaW4gdGhpcykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ2xpY2tTZWxlY3Rpb25NaXhpbiBleHBlY3RzIGEgY29tcG9uZW50IHRvIGRlZmluZSBhIFwic2VsZWN0ZWRJdGVtXCIgcHJvcGVydHkuYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gaXRlbTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBXZSBkb24ndCBjYWxsIHByZXZlbnREZWZhdWx0IGhlcmUuIFRoZSBkZWZhdWx0IGJlaGF2aW9yIGZvclxuICAgICAgICAgIC8vIG1vdXNlZG93biBpbmNsdWRlcyBzZXR0aW5nIGtleWJvYXJkIGZvY3VzIGlmIHRoZSBlbGVtZW50IGRvZXNuJ3RcbiAgICAgICAgICAvLyBhbHJlYWR5IGhhdmUgdGhlIGZvY3VzLCBhbmQgd2Ugd2FudCB0byBwcmVzZXJ2ZSB0aGF0IGJlaGF2aW9yLlxuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gQ2xpY2tTZWxlY3Rpb247XG59XG5cblxuLypcbiAqIFJldHVybiB0aGUgbGlzdCBpdGVtIHRoYXQgaXMsIG9yIGNvbnRhaW5zLCB0aGUgaW5kaWNhdGVkIHRhcmdldCBlbGVtZW50LlxuICogUmV0dXJuIG51bGwgaWYgbm90IGZvdW5kLlxuICovXG5mdW5jdGlvbiBpdGVtRm9yVGFyZ2V0KGxpc3RFbGVtZW50LCB0YXJnZXQpIHtcbiAgY29uc3QgaXRlbXMgPSBsaXN0RWxlbWVudC5pdGVtcztcbiAgY29uc3QgaXRlbUNvdW50ID0gaXRlbXMgPyBpdGVtcy5sZW5ndGggOiAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1Db3VudDsgaSsrKSB7XG4gICAgbGV0IGl0ZW0gPSBpdGVtc1tpXTtcbiAgICBpZiAoaXRlbSA9PT0gdGFyZ2V0IHx8IGl0ZW0uY29udGFpbnModGFyZ2V0KSkge1xuICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwiaW1wb3J0ICogYXMgY29udGVudCBmcm9tICcuL2NvbnRlbnQnO1xuaW1wb3J0IFN5bWJvbCBmcm9tICcuL1N5bWJvbCc7XG5pbXBvcnQgc3ltYm9scyBmcm9tICcuL3N5bWJvbHMnO1xuaW1wb3J0IHRvZ2dsZUNsYXNzIGZyb20gJy4vdG9nZ2xlQ2xhc3MnO1xuXG5cbi8vIFN5bWJvbHMgZm9yIHByaXZhdGUgZGF0YSBtZW1iZXJzIG9uIGFuIGVsZW1lbnQuXG5jb25zdCBpdGVtc1N5bWJvbCA9IFN5bWJvbCgnaXRlbXMnKTtcbmNvbnN0IGl0ZW1Jbml0aWFsaXplZFN5bWJvbCA9IFN5bWJvbCgnaXRlbUluaXRpYWxpemVkJyk7XG5cblxuLyoqXG4gKiBNaXhpbiB3aGljaCBtYXBzIGNvbnRlbnQgc2VtYW50aWNzIChlbGVtZW50cykgdG8gbGlzdCBpdGVtIHNlbWFudGljcy5cbiAqXG4gKiBJdGVtcyBkaWZmZXIgZnJvbSBlbGVtZW50IGNvbnRlbnRzIGluIHNldmVyYWwgd2F5czpcbiAqXG4gKiAqIFRoZXkgYXJlIG9mdGVuIHJlZmVyZW5jZWQgdmlhIGluZGV4LlxuICogKiBUaGV5IG1heSBoYXZlIGEgc2VsZWN0aW9uIHN0YXRlLlxuICogKiBJdCdzIGNvbW1vbiB0byBkbyB3b3JrIHRvIGluaXRpYWxpemUgdGhlIGFwcGVhcmFuY2Ugb3Igc3RhdGUgb2YgYSBuZXdcbiAqICAgaXRlbS5cbiAqICogQXV4aWxpYXJ5IGludmlzaWJsZSBjaGlsZCBlbGVtZW50cyBhcmUgZmlsdGVyZWQgb3V0IGFuZCBub3QgY291bnRlZCBhc1xuICogICBpdGVtcy4gQXV4aWxpYXJ5IGVsZW1lbnRzIGluY2x1ZGUgbGluaywgc2NyaXB0LCBzdHlsZSwgYW5kIHRlbXBsYXRlXG4gKiAgIGVsZW1lbnRzLiBUaGlzIGZpbHRlcmluZyBlbnN1cmVzIHRoYXQgdGhvc2UgYXV4aWxpYXJ5IGVsZW1lbnRzIGNhbiBiZVxuICogICB1c2VkIGluIG1hcmt1cCBpbnNpZGUgb2YgYSBsaXN0IHdpdGhvdXQgYmVpbmcgdHJlYXRlZCBhcyBsaXN0IGl0ZW1zLlxuICpcbiAqIFRoaXMgbWl4aW4gZXhwZWN0cyBhIGNvbXBvbmVudCB0byBwcm92aWRlIGEgYGNvbnRlbnRgIHByb3BlcnR5IHJldHVybmluZyBhXG4gKiByYXcgc2V0IG9mIGVsZW1lbnRzLiBZb3UgY2FuIHByb3ZpZGUgdGhhdCB5b3Vyc2VsZiwgb3IgdXNlXG4gKiBbQ2hpbGRyZW5Db250ZW50TWl4aW5dKENoaWxkcmVuQ29udGVudE1peGluLm1kKS5cbiAqXG4gKiBbQ2hpbGRyZW5Db250ZW50TWl4aW5dKENoaWxkcmVuQ29udGVudE1peGluLm1kKSwgdGhlXG4gKiBgY29udGVudENoYW5nZWRgIG1ldGhvZCB3aWxsIGJlIGludm9rZWQgZm9yIHlvdSB3aGVuIHRoZSBlbGVtZW50J3MgY2hpbGRyZW5cbiAqIGNhcmUgb2Ygbm90aWZ5aW5nIGl0IG9mIGZ1dHVyZSBjaGFuZ2VzLCBhbmQgdHVybnMgb24gdGhlIG9wdGltaXphdGlvbi4gV2l0aFxuICogY2hhbmdlLCB0dXJuaW5nIG9uIHRoZSBvcHRpbWl6YXRpb24gYXV0b21hdGljYWxseS5cbiAqIG1ldGhvZCB3aGVuIHRoZSBzZXQgb2YgaXRlbXMgY2hhbmdlcywgdGhlIG1peGluIGNvbmNsdWRlcyB0aGF0IHlvdSdsbCB0YWtlXG4gKiBwcm9wZXJ0eS4gVG8gYXZvaWQgaGF2aW5nIHRvIGRvIHdvcmsgZWFjaCB0aW1lIHRoYXQgcHJvcGVydHkgaXMgcmVxdWVzdGVkLFxuICogcmV0dXJuIHRoYXQgaW1tZWRpYXRlbHkgb24gc3Vic2VxdWVudCBjYWxscyB0byB0aGUgYGl0ZW1zYCBwcm9wZXJ0eS4gSWYgeW91XG4gKiB0aGF0IG9uLCB0aGUgbWl4aW4gc2F2ZXMgYSByZWZlcmVuY2UgdG8gdGhlIGNvbXB1dGVkIHNldCBvZiBpdGVtcywgYW5kIHdpbGxcbiAqIFRoZSBtb3N0IGNvbW1vbmx5IHJlZmVyZW5jZWQgcHJvcGVydHkgZGVmaW5lZCBieSB0aGlzIG1peGluIGlzIHRoZSBgaXRlbXNgXG4gKiB0aGlzIG1peGluIHN1cHBvcnRzIGFuIG9wdGltaXplZCBtb2RlLiBJZiB5b3UgaW52b2tlIHRoZSBgY29udGVudENoYW5nZWRgXG4gKiB1c2UgdGhpcyBtaXhpbiBpbiBjb25qdW5jdGlvbiB3aXRoXG4gKlxuICogQG1vZHVsZSBDb250ZW50SXRlbXNNaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIENvbnRlbnRJdGVtc01peGluKGJhc2UpIHtcblxuICAvKipcbiAgICogVGhlIGNsYXNzIHByb3RvdHlwZSBhZGRlZCBieSB0aGUgbWl4aW4uXG4gICAqL1xuICBjbGFzcyBDb250ZW50SXRlbXMgZXh0ZW5kcyBiYXNlIHtcblxuICAgIFtzeW1ib2xzLmNvbnRlbnRDaGFuZ2VkXSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmNvbnRlbnRDaGFuZ2VkXSkgeyBzdXBlcltzeW1ib2xzLmNvbnRlbnRDaGFuZ2VkXSgpOyB9XG5cbiAgICAgIC8vIFNpbmNlIHdlIGdvdCB0aGUgY29udGVudENoYW5nZWQgY2FsbCwgd2UnbGwgYXNzdW1lIHdlJ2xsIGJlIG5vdGlmaWVkIGlmXG4gICAgICAvLyB0aGUgc2V0IG9mIGl0ZW1zIGNoYW5nZXMgbGF0ZXIuIFdlIHR1cm4gb24gbWVtb2l6YXRpb24gb2YgdGhlIGl0ZW1zXG4gICAgICAvLyBwcm9wZXJ0eSBieSBzZXR0aW5nIG91ciBpbnRlcm5hbCBwcm9wZXJ0eSB0byBudWxsIChpbnN0ZWFkIG9mXG4gICAgICAvLyB1bmRlZmluZWQpLlxuICAgICAgdGhpc1tpdGVtc1N5bWJvbF0gPSBudWxsO1xuXG4gICAgICB0aGlzW3N5bWJvbHMuaXRlbXNDaGFuZ2VkXSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBzZWxlY3Rpb24gc3RhdGUgZm9yIGEgc2luZ2xlIGl0ZW0gaGFzIGNoYW5nZWQuXG4gICAgICpcbiAgICAgKiBJbnZva2UgdGhpcyBtZXRob2QgdG8gc2lnbmFsIHRoYXQgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIHRoZSBpbmRpY2F0ZWQgaXRlbVxuICAgICAqIGhhcyBjaGFuZ2VkLiBCeSBkZWZhdWx0LCB0aGlzIGFwcGxpZXMgYSBgc2VsZWN0ZWRgIENTUyBjbGFzcyBpZiB0aGUgaXRlbVxuICAgICAqIGlzIHNlbGVjdGVkLCBhbmQgcmVtb3ZlZCBpdCBpZiBub3Qgc2VsZWN0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gVGhlIGl0ZW0gd2hvc2Ugc2VsZWN0aW9uIHN0YXRlIGhhcyBjaGFuZ2VkLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2VsZWN0ZWQgLSBUcnVlIGlmIHRoZSBpdGVtIGlzIHNlbGVjdGVkLCBmYWxzZSBpZiBub3QuXG4gICAgICovXG4gICAgW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpOyB9XG4gICAgICB0b2dnbGVDbGFzcyhpdGVtLCAnc2VsZWN0ZWQnLCBzZWxlY3RlZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGN1cnJlbnQgc2V0IG9mIGl0ZW1zIGluIHRoZSBsaXN0LiBTZWUgdGhlIHRvcC1sZXZlbCBkb2N1bWVudGF0aW9uIGZvclxuICAgICAqIG1peGluIGZvciBhIGRlc2NyaXB0aW9uIG9mIGhvdyBpdGVtcyBkaWZmZXIgZnJvbSBwbGFpbiBjb250ZW50LlxuICAgICAqXG4gICAgICogQHR5cGUge0hUTUxFbGVtZW50W119XG4gICAgICovXG4gICAgZ2V0IGl0ZW1zKCkge1xuICAgICAgbGV0IGl0ZW1zO1xuICAgICAgaWYgKHRoaXNbaXRlbXNTeW1ib2xdID09IG51bGwpIHtcbiAgICAgICAgaXRlbXMgPSBjb250ZW50LmZpbHRlckF1eGlsaWFyeUVsZW1lbnRzKHRoaXNbc3ltYm9scy5jb250ZW50XSk7XG4gICAgICAgIC8vIE5vdGU6IHRlc3QgZm9yICplcXVhbGl0eSogd2l0aCBudWxsLCBzaW5jZSB3ZSB1c2UgYHVuZGVmaW5lZGAgdG9cbiAgICAgICAgLy8gaW5kaWNhdGUgdGhhdCB3ZSdyZSBub3QgeWV0IGNhY2hpbmcgaXRlbXMuXG4gICAgICAgIGlmICh0aGlzW2l0ZW1zU3ltYm9sXSA9PT0gbnVsbCkge1xuICAgICAgICAgIC8vIE1lbW9pemUgdGhlIHNldCBvZiBpdGVtcy5cbiAgICAgICAgICB0aGlzW2l0ZW1zU3ltYm9sXSA9IGl0ZW1zO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIG1lbW9pemVkIGl0ZW1zLlxuICAgICAgICBpdGVtcyA9IHRoaXNbaXRlbXNTeW1ib2xdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdW5kZXJseWluZyBjb250ZW50cyBjaGFuZ2UuIEl0IGlzIGFsc29cbiAgICAgKiBpbnZva2VkIG9uIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbiDigJMgc2luY2UgdGhlIGl0ZW1zIGhhdmUgXCJjaGFuZ2VkXCIgZnJvbVxuICAgICAqIGJlaW5nIG5vdGhpbmcuXG4gICAgICovXG4gICAgW3N5bWJvbHMuaXRlbXNDaGFuZ2VkXSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLml0ZW1zQ2hhbmdlZF0pIHsgc3VwZXJbc3ltYm9scy5pdGVtc0NoYW5nZWRdKCk7IH1cblxuICAgICAgLy8gUGVyZm9ybSBwZXItaXRlbSBpbml0aWFsaXphdGlvbiBpZiBgaXRlbUFkZGVkYCBpcyBkZWZpbmVkLlxuICAgICAgaWYgKHRoaXNbc3ltYm9scy5pdGVtQWRkZWRdKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodGhpcy5pdGVtcywgaXRlbSA9PiB7XG4gICAgICAgICAgaWYgKCFpdGVtW2l0ZW1Jbml0aWFsaXplZFN5bWJvbF0pIHtcbiAgICAgICAgICAgIHRoaXNbc3ltYm9scy5pdGVtQWRkZWRdKGl0ZW0pO1xuICAgICAgICAgICAgaXRlbVtpdGVtSW5pdGlhbGl6ZWRTeW1ib2xdID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSkge1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdpdGVtcy1jaGFuZ2VkJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGl0ZW1zIGluIHRoZSBsaXN0IGNoYW5nZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDb250ZW50SXRlbXNcbiAgICAgKiBAZXZlbnQgaXRlbXMtY2hhbmdlZFxuICAgICAqL1xuICB9XG5cbiAgcmV0dXJuIENvbnRlbnRJdGVtcztcbn1cbiIsImltcG9ydCBzeW1ib2xzIGZyb20gJy4vc3ltYm9scyc7XG5cblxuLyoqXG4gKiBNaXhpbiB3aGljaCBtYXBzIGRpcmVjdGlvbiBzZW1hbnRpY3MgKGdvTGVmdCwgZ29SaWdodCwgZXRjLikgdG8gc2VsZWN0aW9uXG4gKiBzZW1hbnRpY3MgKHNlbGVjdFByZXZpb3VzLCBzZWxlY3ROZXh0LCBldGMuKS5cbiAqXG4gKiBUaGlzIG1peGluIGNhbiBiZSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGhcbiAqIFtLZXlib2FyZERpcmVjdGlvbk1peGluXShLZXlib2FyZERpcmVjdGlvbk1peGluLm1kKSAod2hpY2ggbWFwcyBrZXlib2FyZFxuICogZXZlbnRzIHRvIGRpcmVjdGlvbnMpIGFuZCBhIG1peGluIHRoYXQgaGFuZGxlcyBzZWxlY3Rpb24gbGlrZVxuICogW1NpbmdsZVNlbGVjdGlvbk1peGluXShTaW5nbGVTZWxlY3Rpb25NaXhpbi5tZCkuXG4gKlxuICogQG1vZHVsZSBEaXJlY3Rpb25TZWxlY3Rpb25NaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIERpcmVjdGlvblNlbGVjdGlvbk1peGluKGJhc2UpIHtcblxuICAvKipcbiAgICogVGhlIGNsYXNzIHByb3RvdHlwZSBhZGRlZCBieSB0aGUgbWl4aW4uXG4gICAqL1xuICBjbGFzcyBEaXJlY3Rpb25TZWxlY3Rpb24gZXh0ZW5kcyBiYXNlIHtcblxuICAgIFtzeW1ib2xzLmdvRG93bl0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5nb0Rvd25dKSB7IHN1cGVyW3N5bWJvbHMuZ29Eb3duXSgpOyB9XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0TmV4dCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYERpcmVjdGlvblNlbGVjdGlvbk1peGluIGV4cGVjdHMgYSBjb21wb25lbnQgdG8gZGVmaW5lIGEgXCJzZWxlY3ROZXh0XCIgbWV0aG9kLmApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0TmV4dCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIFtzeW1ib2xzLmdvRW5kXSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmdvRW5kXSkgeyBzdXBlcltzeW1ib2xzLmdvRW5kXSgpOyB9XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0TGFzdCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYERpcmVjdGlvblNlbGVjdGlvbk1peGluIGV4cGVjdHMgYSBjb21wb25lbnQgdG8gZGVmaW5lIGEgXCJzZWxlY3RMYXN0XCIgbWV0aG9kLmApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0TGFzdCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIFtzeW1ib2xzLmdvTGVmdF0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5nb0xlZnRdKSB7IHN1cGVyW3N5bWJvbHMuZ29MZWZ0XSgpOyB9XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0UHJldmlvdXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBEaXJlY3Rpb25TZWxlY3Rpb25NaXhpbiBleHBlY3RzIGEgY29tcG9uZW50IHRvIGRlZmluZSBhIFwic2VsZWN0UHJldmlvdXNcIiBtZXRob2QuYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RQcmV2aW91cygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIFtzeW1ib2xzLmdvUmlnaHRdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuZ29SaWdodF0pIHsgc3VwZXJbc3ltYm9scy5nb1JpZ2h0XSgpOyB9XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0TmV4dCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYERpcmVjdGlvblNlbGVjdGlvbk1peGluIGV4cGVjdHMgYSBjb21wb25lbnQgdG8gZGVmaW5lIGEgXCJzZWxlY3ROZXh0XCIgbWV0aG9kLmApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0TmV4dCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIFtzeW1ib2xzLmdvU3RhcnRdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuZ29TdGFydF0pIHsgc3VwZXJbc3ltYm9scy5nb1N0YXJ0XSgpOyB9XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0Rmlyc3QpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBEaXJlY3Rpb25TZWxlY3Rpb25NaXhpbiBleHBlY3RzIGEgY29tcG9uZW50IHRvIGRlZmluZSBhIFwic2VsZWN0Rmlyc3RcIiBtZXRob2QuYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RGaXJzdCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIFtzeW1ib2xzLmdvVXBdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuZ29VcF0pIHsgc3VwZXJbc3ltYm9scy5nb1VwXSgpOyB9XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0UHJldmlvdXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBEaXJlY3Rpb25TZWxlY3Rpb25NaXhpbiBleHBlY3RzIGEgY29tcG9uZW50IHRvIGRlZmluZSBhIFwic2VsZWN0UHJldmlvdXNcIiBtZXRob2QuYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RQcmV2aW91cygpO1xuICAgICAgfVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIERpcmVjdGlvblNlbGVjdGlvbjtcbn1cbiIsImltcG9ydCBzeW1ib2xzIGZyb20gJy4vc3ltYm9scyc7XG5cblxuLyoqXG4gKiBNaXhpbiB3aGljaCBtYXBzIGRpcmVjdGlvbiBrZXlzIChMZWZ0LCBSaWdodCwgZXRjLikgdG8gZGlyZWN0aW9uIHNlbWFudGljc1xuICogKGdvIGxlZnQsIGdvIHJpZ2h0LCBldGMuKS5cbiAqXG4gKiBUaGlzIG1peGluIGV4cGVjdHMgdGhlIGNvbXBvbmVudCB0byBpbnZva2UgYSBga2V5ZG93bmAgbWV0aG9kIHdoZW4gYSBrZXkgaXNcbiAqIHByZXNzZWQuIFlvdSBjYW4gdXNlIFtLZXlib2FyZE1peGluXShLZXlib2FyZE1peGluLm1kKSBmb3IgdGhhdFxuICogcHVycG9zZSwgb3Igd2lyZSB1cCB5b3VyIG93biBrZXlib2FyZCBoYW5kbGluZyBhbmQgY2FsbCBga2V5ZG93bmAgeW91cnNlbGYuXG4gKlxuICogVGhpcyBtaXhpbiBjYWxscyBtZXRob2RzIHN1Y2ggYXMgYGdvTGVmdGAgYW5kIGBnb1JpZ2h0YC4gWW91IGNhbiBkZWZpbmVcbiAqIHdoYXQgdGhhdCBtZWFucyBieSBpbXBsZW1lbnRpbmcgdGhvc2UgbWV0aG9kcyB5b3Vyc2VsZi4gSWYgeW91IHdhbnQgdG8gdXNlXG4gKiBkaXJlY3Rpb24ga2V5cyB0byBuYXZpZ2F0ZSBhIHNlbGVjdGlvbiwgdXNlIHRoaXMgbWl4aW4gd2l0aFxuICogW0RpcmVjdGlvblNlbGVjdGlvbk1peGluXShEaXJlY3Rpb25TZWxlY3Rpb25NaXhpbi5tZCkuXG4gKlxuICogSWYgdGhlIGNvbXBvbmVudCBkZWZpbmVzIGEgcHJvcGVydHkgY2FsbGVkIGBzeW1ib2xzLm9yaWVudGF0aW9uYCwgdGhlIHZhbHVlXG4gKiBvZiB0aGF0IHByb3BlcnR5IHdpbGwgY29uc3RyYWluIG5hdmlnYXRpb24gdG8gdGhlIGhvcml6b250YWwgb3IgdmVydGljYWwgYXhpcy5cbiAqXG4gKiBAbW9kdWxlIEtleWJvYXJkRGlyZWN0aW9uTWl4aW5cbiAqIEBwYXJhbSBiYXNlIHtDbGFzc30gdGhlIGJhc2UgY2xhc3MgdG8gZXh0ZW5kXG4gKiBAcmV0dXJucyB7Q2xhc3N9IHRoZSBleHRlbmRlZCBjbGFzc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBLZXlib2FyZERpcmVjdGlvbk1peGluKGJhc2UpIHtcblxuICAvKipcbiAgICogVGhlIGNsYXNzIHByb3RvdHlwZSBhZGRlZCBieSB0aGUgbWl4aW4uXG4gICAqL1xuICBjbGFzcyBLZXlib2FyZERpcmVjdGlvbiBleHRlbmRzIGJhc2Uge1xuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCB3aGVuIHRoZSB1c2VyIHdhbnRzIHRvIGdvL25hdmlnYXRlIGRvd24uXG4gICAgICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLlxuICAgICAqL1xuICAgIFtzeW1ib2xzLmdvRG93bl0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5nb0Rvd25dKSB7IHJldHVybiBzdXBlcltzeW1ib2xzLmdvRG93bl0oKTsgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSB0byB0aGUgZW5kIChlLmcuLCBvZiBhIGxpc3QpLlxuICAgICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIHRoaXMgbWV0aG9kIGRvZXMgbm90aGluZy5cbiAgICAgKi9cbiAgICBbc3ltYm9scy5nb0VuZF0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5nb0VuZF0pIHsgcmV0dXJuIHN1cGVyW3N5bWJvbHMuZ29FbmRdKCk7IH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2VkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gZ28vbmF2aWdhdGUgbGVmdC5cbiAgICAgKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIG1ldGhvZCBkb2VzIG5vdGhpbmcuXG4gICAgICovXG4gICAgW3N5bWJvbHMuZ29MZWZ0XSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmdvTGVmdF0pIHsgcmV0dXJuIHN1cGVyW3N5bWJvbHMuZ29MZWZ0XSgpOyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCB3aGVuIHRoZSB1c2VyIHdhbnRzIHRvIGdvL25hdmlnYXRlIHJpZ2h0LlxuICAgICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIHRoaXMgbWV0aG9kIGRvZXMgbm90aGluZy5cbiAgICAgKi9cbiAgICBbc3ltYm9scy5nb1JpZ2h0XSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmdvUmlnaHRdKSB7IHJldHVybiBzdXBlcltzeW1ib2xzLmdvUmlnaHRdKCk7IH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2VkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gZ28vbmF2aWdhdGUgdG8gdGhlIHN0YXJ0IChlLmcuLCBvZiBhXG4gICAgICogbGlzdCkuIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIHRoaXMgbWV0aG9kIGRvZXMgbm90aGluZy5cbiAgICAgKi9cbiAgICBbc3ltYm9scy5nb1N0YXJ0XSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmdvU3RhcnRdKSB7IHJldHVybiBzdXBlcltzeW1ib2xzLmdvU3RhcnRdKCk7IH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2VkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gZ28vbmF2aWdhdGUgdXAuXG4gICAgICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLlxuICAgICAqL1xuICAgIFtzeW1ib2xzLmdvVXBdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuZ29VcF0pIHsgcmV0dXJuIHN1cGVyW3N5bWJvbHMuZ29VcF0oKTsgfVxuICAgIH1cblxuICAgIFtzeW1ib2xzLmtleWRvd25dKGV2ZW50KSB7XG4gICAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xuXG4gICAgICBjb25zdCBvcmllbnRhdGlvbiA9IHRoaXNbc3ltYm9scy5vcmllbnRhdGlvbl0gfHwgJ2JvdGgnO1xuICAgICAgY29uc3QgaG9yaXpvbnRhbCA9IChvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnIHx8IG9yaWVudGF0aW9uID09PSAnYm90aCcpO1xuICAgICAgY29uc3QgdmVydGljYWwgPSAob3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcgfHwgb3JpZW50YXRpb24gPT09ICdib3RoJyk7XG5cbiAgICAgIC8vIElnbm9yZSBMZWZ0L1JpZ2h0IGtleXMgd2hlbiBtZXRhS2V5IG9yIGFsdEtleSBtb2RpZmllciBpcyBhbHNvIHByZXNzZWQsXG4gICAgICAvLyBhcyB0aGUgdXNlciBtYXkgYmUgdHJ5aW5nIHRvIG5hdmlnYXRlIGJhY2sgb3IgZm9yd2FyZCBpbiB0aGUgYnJvd3Nlci5cbiAgICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgICBjYXNlIDM1OiAvLyBFbmRcbiAgICAgICAgICBoYW5kbGVkID0gdGhpc1tzeW1ib2xzLmdvRW5kXSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM2OiAvLyBIb21lXG4gICAgICAgICAgaGFuZGxlZCA9IHRoaXNbc3ltYm9scy5nb1N0YXJ0XSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM3OiAvLyBMZWZ0XG4gICAgICAgICAgaWYgKGhvcml6b250YWwgJiYgIWV2ZW50Lm1ldGFLZXkgJiYgIWV2ZW50LmFsdEtleSkge1xuICAgICAgICAgICAgaGFuZGxlZCA9IHRoaXNbc3ltYm9scy5nb0xlZnRdKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM4OiAvLyBVcFxuICAgICAgICAgIGlmICh2ZXJ0aWNhbCkge1xuICAgICAgICAgICAgaGFuZGxlZCA9IGV2ZW50LmFsdEtleSA/IHRoaXNbc3ltYm9scy5nb1N0YXJ0XSgpIDogdGhpc1tzeW1ib2xzLmdvVXBdKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM5OiAvLyBSaWdodFxuICAgICAgICAgIGlmIChob3Jpem9udGFsICYmICFldmVudC5tZXRhS2V5ICYmICFldmVudC5hbHRLZXkpIHtcbiAgICAgICAgICAgIGhhbmRsZWQgPSB0aGlzW3N5bWJvbHMuZ29SaWdodF0oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDA6IC8vIERvd25cbiAgICAgICAgICBpZiAodmVydGljYWwpIHtcbiAgICAgICAgICAgIGhhbmRsZWQgPSBldmVudC5hbHRLZXkgPyB0aGlzW3N5bWJvbHMuZ29FbmRdKCkgOiB0aGlzW3N5bWJvbHMuZ29Eb3duXSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIC8vIFByZWZlciBtaXhpbiByZXN1bHQgaWYgaXQncyBkZWZpbmVkLCBvdGhlcndpc2UgdXNlIGJhc2UgcmVzdWx0LlxuICAgICAgcmV0dXJuIGhhbmRsZWQgfHwgKHN1cGVyW3N5bWJvbHMua2V5ZG93bl0gJiYgc3VwZXJbc3ltYm9scy5rZXlkb3duXShldmVudCkpIHx8IGZhbHNlO1xuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIEtleWJvYXJkRGlyZWN0aW9uO1xufVxuIiwiaW1wb3J0IHN5bWJvbHMgZnJvbSAnLi9zeW1ib2xzJztcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIG1hbmFnZXMgdGhlIGtleWRvd24gaGFuZGxpbmcgZm9yIGEgY29tcG9uZW50LlxuICpcbiAqIFRoaXMgbWl4aW4gaGFuZGxlcyBzZXZlcmFsIGtleWJvYXJkLXJlbGF0ZWQgZmVhdHVyZXMuXG4gKlxuICogRmlyc3QsIGl0IHdpcmVzIHVwIGEgc2luZ2xlIGtleWRvd24gZXZlbnQgaGFuZGxlciB0aGF0IGNhbiBiZSBzaGFyZWQgYnlcbiAqIG11bHRpcGxlIG1peGlucyBvbiBhIGNvbXBvbmVudC4gVGhlIGV2ZW50IGhhbmRsZXIgd2lsbCBpbnZva2UgYSBga2V5ZG93bmBcbiAqIG1ldGhvZCB3aXRoIHRoZSBldmVudCBvYmplY3QsIGFuZCBhbnkgbWl4aW4gYWxvbmcgdGhlIHByb3RvdHlwZSBjaGFpbiB0aGF0XG4gKiB3YW50cyB0byBoYW5kbGUgdGhhdCBtZXRob2QgY2FuIGRvIHNvLlxuICpcbiAqIElmIGEgbWl4aW4gd2FudHMgdG8gaW5kaWNhdGUgdGhhdCBrZXlib2FyZCBldmVudCBoYXMgYmVlbiBoYW5kbGVkLCBhbmQgdGhhdFxuICogb3RoZXIgbWl4aW5zIHNob3VsZCAqbm90KiBoYW5kbGUgaXQsIHRoZSBtaXhpbidzIGBrZXlkb3duYCBoYW5kbGVyIHNob3VsZFxuICogcmV0dXJuIGEgdmFsdWUgb2YgdHJ1ZS4gVGhlIGNvbnZlbnRpb24gdGhhdCBzZWVtcyB0byB3b3JrIHdlbGwgaXMgdGhhdCBhXG4gKiBtaXhpbiBzaG91bGQgc2VlIGlmIGl0IHdhbnRzIHRvIGhhbmRsZSB0aGUgZXZlbnQgYW5kLCBpZiBub3QsIHRoZW4gYXNrIHRoZVxuICogc3VwZXJjbGFzcyB0byBzZWUgaWYgaXQgd2FudHMgdG8gaGFuZGxlIHRoZSBldmVudC4gVGhpcyBoYXMgdGhlIGVmZmVjdCBvZlxuICogZ2l2aW5nIHRoZSBtaXhpbiB0aGF0IHdhcyBhcHBsaWVkIGxhc3QgdGhlIGZpcnN0IGNoYW5jZSBhdCBoYW5kbGluZyBhXG4gKiBrZXlib2FyZCBldmVudC5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgICBbc3ltYm9scy5rZXlkb3duXShldmVudCkge1xuICogICAgICAgbGV0IGhhbmRsZWQ7XG4gKiAgICAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAqICAgICAgICAgLy8gSGFuZGxlIHRoZSBrZXlzIHlvdSB3YW50LCBzZXR0aW5nIGhhbmRsZWQgPSB0cnVlIGlmIGFwcHJvcHJpYXRlLlxuICogICAgICAgfVxuICogICAgICAgLy8gUHJlZmVyIG1peGluIHJlc3VsdCBpZiBpdCdzIGRlZmluZWQsIG90aGVyd2lzZSB1c2UgYmFzZSByZXN1bHQuXG4gKiAgICAgICByZXR1cm4gaGFuZGxlZCB8fCAoc3VwZXJbc3ltYm9scy5rZXlkb3duXSAmJiBzdXBlcltzeW1ib2xzLmtleWRvd25dKGV2ZW50KSk7XG4gKiAgICAgfVxuICpcbiAqIFVudGlsIGlPUyBTYWZhcmkgc3VwcG9ydHMgdGhlIGBLZXlib2FyZEV2ZW50LmtleWAgcHJvcGVydHlcbiAqIChzZWUgaHR0cDovL2Nhbml1c2UuY29tLyNzZWFyY2g9a2V5Ym9hcmRldmVudC5rZXkpLCBtaXhpbnMgc2hvdWxkIGdlbmVyYWxseVxuICogdGVzdCBrZXlzIHVzaW5nIHRoZSBsZWdhY3kgYGtleUNvZGVgIHByb3BlcnR5LCBub3QgYGtleWAuXG4gKlxuICogQSBzZWNvbmQgZmVhdHVyZSBwcm92aWRlZCBieSB0aGlzIG1peGluIGlzIHRoYXQgaXQgaW1wbGljaXRseSBtYWtlcyB0aGVcbiAqIGNvbXBvbmVudCBhIHRhYiBzdG9wIGlmIGl0IGlzbid0IGFscmVhZHksIGJ5IHNldHRpbmcgYHRhYkluZGV4YCB0byAwLiBUaGlzXG4gKiBoYXMgdGhlIGVmZmVjdCBvZiBhZGRpbmcgdGhlIGNvbXBvbmVudCB0byB0aGUgdGFiIG9yZGVyIGluIGRvY3VtZW50IG9yZGVyLlxuICpcbiAqIEBtb2R1bGUgS2V5Ym9hcmRNaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEtleWJvYXJkTWl4aW4oYmFzZSkge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIEtleWJvYXJkIGV4dGVuZHMgYmFzZSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBldmVudCA9PiB7XG4gICAgICAgIHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10gPSB0cnVlO1xuICAgICAgICBjb25zdCBoYW5kbGVkID0gdGhpc1tzeW1ib2xzLmtleWRvd25dKGV2ZW50KTtcbiAgICAgICAgaWYgKGhhbmRsZWQpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10gPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgaWYgKHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKSB7IHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7IH1cbiAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKSA9PSBudWxsICYmIHRoaXNbc3ltYm9scy5kZWZhdWx0c10udGFiaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS50YWJpbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IFtzeW1ib2xzLmRlZmF1bHRzXSgpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRzID0gc3VwZXJbc3ltYm9scy5kZWZhdWx0c10gfHwge307XG4gICAgICAvLyBUaGUgZGVmYXVsdCB0YWIgaW5kZXggaXMgMCAoZG9jdW1lbnQgb3JkZXIpLlxuICAgICAgZGVmYXVsdHMudGFiaW5kZXggPSAwO1xuICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSB0aGUgaW5kaWNhdGVkIGtleWJvYXJkIGV2ZW50LlxuICAgICAqXG4gICAgICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLiBUaGlzIHdpbGxcbiAgICAgKiB0eXBpY2FsbHkgYmUgaGFuZGxlZCBieSBvdGhlciBtaXhpbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IC0gdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZXZlbnQgd2FzIGhhbmRsZWRcbiAgICAgKi9cbiAgICBbc3ltYm9scy5rZXlkb3duXShldmVudCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMua2V5ZG93bl0pIHsgcmV0dXJuIHN1cGVyW3N5bWJvbHMua2V5ZG93bl0oZXZlbnQpOyB9XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gS2V5Ym9hcmQ7XG59XG4iLCJpbXBvcnQgZGVmYXVsdFNjcm9sbFRhcmdldCBmcm9tICcuL2RlZmF1bHRTY3JvbGxUYXJnZXQnO1xuaW1wb3J0IHN5bWJvbHMgZnJvbSAnLi9zeW1ib2xzJztcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIG1hcHMgcGFnZSBrZXlzIChQYWdlIFVwLCBQYWdlIERvd24pIGludG8gb3BlcmF0aW9ucyB0aGF0IG1vdmVcbiAqIHRoZSBzZWxlY3Rpb24gYnkgb25lIHBhZ2UuXG4gKlxuICogVGhlIGtleWJvYXJkIGludGVyYWN0aW9uIG1vZGVsIGdlbmVyYWxseSBmb2xsb3dzIHRoYXQgb2YgTWljcm9zb2Z0IFdpbmRvd3MnXG4gKiBsaXN0IGJveGVzIGluc3RlYWQgb2YgdGhvc2UgaW4gT1MgWDpcbiAqXG4gKiAqIFRoZSBQYWdlIFVwL0Rvd24gYW5kIEhvbWUvRW5kIGtleXMgYWN0dWFsbHkgY2hhbmdlIHRoZSBzZWxlY3Rpb24sIHJhdGhlclxuICogICB0aGFuIGp1c3Qgc2Nyb2xsaW5nLiBUaGUgZm9ybWVyIGJlaGF2aW9yIHNlZW1zIG1vcmUgZ2VuZXJhbGx5IHVzZWZ1bCBmb3JcbiAqICAga2V5Ym9hcmQgdXNlcnMuXG4gKlxuICogKiBQcmVzc2luZyBQYWdlIFVwL0Rvd24gd2lsbCBjaGFuZ2UgdGhlIHNlbGVjdGlvbiB0byB0aGUgdG9wbW9zdC9ib3R0b21tb3N0XG4gKiAgIHZpc2libGUgaXRlbSBpZiB0aGUgc2VsZWN0aW9uIGlzIG5vdCBhbHJlYWR5IHRoZXJlLiBUaGVyZWFmdGVyLCB0aGUga2V5XG4gKiAgIHdpbGwgbW92ZSB0aGUgc2VsZWN0aW9uIHVwL2Rvd24gYnkgYSBwYWdlLCBhbmQgKHBlciB0aGUgYWJvdmUgcG9pbnQpIG1ha2VcbiAqICAgdGhlIHNlbGVjdGVkIGl0ZW0gdmlzaWJsZS5cbiAqXG4gKiBUbyBlbnN1cmUgdGhlIHNlbGVjdGVkIGl0ZW0gaXMgaW4gdmlldyBmb2xsb3dpbmcgdXNlIG9mIFBhZ2UgVXAvRG93biwgdXNlXG4gKiB0aGUgcmVsYXRlZCBbU2VsZWN0aW9uSW5WaWV3TWl4aW5dKFNlbGVjdGlvbkluVmlld01peGluLm1kKS5cbiAqXG4gKiBUaGlzIG1peGluIGV4cGVjdHMgdGhlIGNvbXBvbmVudCB0byBwcm92aWRlOlxuICpcbiAqICogQSBgW3N5bWJvbHMua2V5ZG93bl1gIG1ldGhvZCBpbnZva2VkIHdoZW4gYSBrZXkgaXMgcHJlc3NlZC4gWW91IGNhbiB1c2VcbiAqICAgW0tleWJvYXJkTWl4aW5dKEtleWJvYXJkTWl4aW4ubWQpIGZvciB0aGF0IHB1cnBvc2UsIG9yIHdpcmUgdXAgeW91ciBvd25cbiAqICAga2V5Ym9hcmQgaGFuZGxpbmcgYW5kIGNhbGwgYFtzeW1ib2xzLmtleWRvd25dYCB5b3Vyc2VsZi5cbiAqICogQSBgc2VsZWN0ZWRJbmRleGAgcHJvcGVydHkgdGhhdCBpbmRpY2F0ZXMgdGhlIGluZGV4IG9mIHRoZSBzZWxlY3RlZCBpdGVtLlxuICpcbiAqIEBtb2R1bGUgS2V5Ym9hcmRQYWdlZFNlbGVjdGlvbk1peGluXG4gKiBAcGFyYW0gYmFzZSB7Q2xhc3N9IHRoZSBiYXNlIGNsYXNzIHRvIGV4dGVuZFxuICogQHJldHVybnMge0NsYXNzfSB0aGUgZXh0ZW5kZWQgY2xhc3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gS2V5Ym9hcmRQYWdlZFNlbGVjdGlvbk1peGluKGJhc2UpIHtcblxuICAvKipcbiAgICogVGhlIGNsYXNzIHByb3RvdHlwZSBhZGRlZCBieSB0aGUgbWl4aW4uXG4gICAqL1xuICBjbGFzcyBLZXlib2FyZFBhZ2VkU2VsZWN0aW9uIGV4dGVuZHMgYmFzZSB7XG5cbiAgICBbc3ltYm9scy5rZXlkb3duXShldmVudCkge1xuICAgICAgbGV0IGhhbmRsZWQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IG9yaWVudGF0aW9uID0gdGhpc1tzeW1ib2xzLm9yaWVudGF0aW9uXTtcbiAgICAgIGlmIChvcmllbnRhdGlvbiAhPT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgICAgIGNhc2UgMzM6IC8vIFBhZ2UgVXBcbiAgICAgICAgICBoYW5kbGVkID0gdGhpcy5wYWdlVXAoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM0OiAvLyBQYWdlIERvd25cbiAgICAgICAgICBoYW5kbGVkID0gdGhpcy5wYWdlRG93bigpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBQcmVmZXIgbWl4aW4gcmVzdWx0IGlmIGl0J3MgZGVmaW5lZCwgb3RoZXJ3aXNlIHVzZSBiYXNlIHJlc3VsdC5cbiAgICAgIHJldHVybiBoYW5kbGVkIHx8IChzdXBlcltzeW1ib2xzLmtleWRvd25dICYmIHN1cGVyW3N5bWJvbHMua2V5ZG93bl0oZXZlbnQpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTY3JvbGwgZG93biBvbmUgcGFnZS5cbiAgICAgKi9cbiAgICBwYWdlRG93bigpIHtcbiAgICAgIGlmIChzdXBlci5wYWdlRG93bikgeyBzdXBlci5wYWdlRG93bigpOyB9XG4gICAgICByZXR1cm4gc2Nyb2xsT25lUGFnZSh0aGlzLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTY3JvbGwgdXAgb25lIHBhZ2UuXG4gICAgICovXG4gICAgcGFnZVVwKCkge1xuICAgICAgaWYgKHN1cGVyLnBhZ2VVcCkgeyBzdXBlci5wYWdlVXAoKTsgfVxuICAgICAgcmV0dXJuIHNjcm9sbE9uZVBhZ2UodGhpcywgZmFsc2UpO1xuICAgIH1cblxuICAgIC8qIFByb3ZpZGUgYSBkZWZhdWx0IHNjcm9sbFRhcmdldCBpbXBsZW1lbnRhdGlvbiBpZiBub25lIGV4aXN0cy4gKi9cbiAgICBnZXQgW3N5bWJvbHMuc2Nyb2xsVGFyZ2V0XSgpIHtcbiAgICAgIHJldHVybiBzdXBlcltzeW1ib2xzLnNjcm9sbFRhcmdldF0gfHwgZGVmYXVsdFNjcm9sbFRhcmdldCh0aGlzKTtcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiBLZXlib2FyZFBhZ2VkU2VsZWN0aW9uO1xufVxuXG5cbi8vIFJldHVybiB0aGUgaXRlbSB3aG9zZSBjb250ZW50IHNwYW5zIHRoZSBnaXZlbiB5IHBvc2l0aW9uIChyZWxhdGl2ZSB0byB0aGVcbi8vIHRvcCBvZiB0aGUgbGlzdCdzIHNjcm9sbGluZyBjbGllbnQgYXJlYSksIG9yIG51bGwgaWYgbm90IGZvdW5kLlxuLy9cbi8vIElmIGRvd253YXJkIGlzIHRydWUsIG1vdmUgZG93biB0aGUgbGlzdCBvZiBpdGVtcyB0byBmaW5kIHRoZSBmaXJzdCBpdGVtXG4vLyBmb3VuZCBhdCB0aGUgZ2l2ZW4geSBwb3NpdGlvbjsgaWYgZG93bndhcmQgaXMgZmFsc2UsIG1vdmUgdXAgdGhlIGxpc3Qgb2Zcbi8vIGl0ZW1zIHRvIGZpbmQgdGhlIGxhc3QgaXRlbSBhdCB0aGF0IHBvc2l0aW9uLlxuZnVuY3Rpb24gZ2V0SW5kZXhPZkl0ZW1BdFkoZWxlbWVudCwgc2Nyb2xsVGFyZ2V0LCB5LCBkb3dud2FyZCkge1xuXG4gIGNvbnN0IGl0ZW1zID0gZWxlbWVudC5pdGVtcztcbiAgY29uc3Qgc3RhcnQgPSBkb3dud2FyZCA/IDAgOiBpdGVtcy5sZW5ndGggLSAxO1xuICBjb25zdCBlbmQgPSBkb3dud2FyZCA/IGl0ZW1zLmxlbmd0aCA6IDA7XG4gIGNvbnN0IHN0ZXAgPSBkb3dud2FyZCA/IDEgOiAtMTtcblxuICBjb25zdCB0b3BPZkNsaWVudEFyZWEgPSBzY3JvbGxUYXJnZXQub2Zmc2V0VG9wICsgc2Nyb2xsVGFyZ2V0LmNsaWVudFRvcDtcblxuICAvLyBGaW5kIHRoZSBpdGVtIHNwYW5uaW5nIHRoZSBpbmRpY2F0ZWQgeSBjb29yZGluYXRlLlxuICBsZXQgaXRlbTtcbiAgbGV0IGl0ZW1JbmRleCA9IHN0YXJ0O1xuICBsZXQgaXRlbVRvcDtcbiAgbGV0IGZvdW5kID0gZmFsc2U7XG4gIHdoaWxlIChpdGVtSW5kZXggIT09IGVuZCkge1xuICAgIGl0ZW0gPSBpdGVtc1tpdGVtSW5kZXhdO1xuICAgIGl0ZW1Ub3AgPSBpdGVtLm9mZnNldFRvcCAtIHRvcE9mQ2xpZW50QXJlYTtcbiAgICBjb25zdCBpdGVtQm90dG9tID0gaXRlbVRvcCArIGl0ZW0ub2Zmc2V0SGVpZ2h0O1xuICAgIGlmIChpdGVtVG9wIDw9IHkgJiYgaXRlbUJvdHRvbSA+PSB5KSB7XG4gICAgICAvLyBJdGVtIHNwYW5zIHRoZSBpbmRpY2F0ZWQgeSBjb29yZGluYXRlLlxuICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGl0ZW1JbmRleCArPSBzdGVwO1xuICB9XG5cbiAgaWYgKCFmb3VuZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gV2UgbWF5IGhhdmUgZm91bmQgYW4gaXRlbSB3aG9zZSBwYWRkaW5nIHNwYW5zIHRoZSBnaXZlbiB5IGNvb3JkaW5hdGUsXG4gIC8vIGJ1dCB3aG9zZSBjb250ZW50IGlzIGFjdHVhbGx5IGFib3ZlL2JlbG93IHRoYXQgcG9pbnQuXG4gIC8vIFRPRE86IElmIHRoZSBpdGVtIGhhcyBhIGJvcmRlciwgdGhlbiBwYWRkaW5nIHNob3VsZCBiZSBpbmNsdWRlZCBpblxuICAvLyBjb25zaWRlcmluZyBhIGhpdC5cbiAgY29uc3QgaXRlbVN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShpdGVtKTtcbiAgY29uc3QgaXRlbVBhZGRpbmdUb3AgPSBwYXJzZUZsb2F0KGl0ZW1TdHlsZS5wYWRkaW5nVG9wKTtcbiAgY29uc3QgaXRlbVBhZGRpbmdCb3R0b20gPSBwYXJzZUZsb2F0KGl0ZW1TdHlsZS5wYWRkaW5nQm90dG9tKTtcbiAgY29uc3QgY29udGVudFRvcCA9IGl0ZW1Ub3AgKyBpdGVtLmNsaWVudFRvcCArIGl0ZW1QYWRkaW5nVG9wO1xuICBjb25zdCBjb250ZW50Qm90dG9tID0gY29udGVudFRvcCArIGl0ZW0uY2xpZW50SGVpZ2h0IC0gaXRlbVBhZGRpbmdUb3AgLSBpdGVtUGFkZGluZ0JvdHRvbTtcbiAgaWYgKGRvd253YXJkICYmIGNvbnRlbnRUb3AgPD0geSB8fCAhZG93bndhcmQgJiYgY29udGVudEJvdHRvbSA+PSB5KSB7XG4gICAgLy8gVGhlIGluZGljYXRlZCBjb29yZGluYXRlIGhpdHMgdGhlIGFjdHVhbCBpdGVtIGNvbnRlbnQuXG4gICAgcmV0dXJuIGl0ZW1JbmRleDtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBUaGUgaW5kaWNhdGVkIGNvb3JkaW5hdGUgZmFsbHMgd2l0aGluIHRoZSBpdGVtJ3MgcGFkZGluZy4gQmFjayB1cCB0b1xuICAgIC8vIHRoZSBpdGVtIGJlbG93L2Fib3ZlIHRoZSBpdGVtIHdlIGZvdW5kIGFuZCByZXR1cm4gdGhhdC5cbiAgICByZXR1cm4gaXRlbUluZGV4IC0gc3RlcDtcbiAgfVxufVxuXG4vLyBNb3ZlIGJ5IG9uZSBwYWdlIGRvd253YXJkIChpZiBkb3dud2FyZCBpcyB0cnVlKSwgb3IgdXB3YXJkIChpZiBmYWxzZSkuXG4vLyBSZXR1cm4gdHJ1ZSBpZiB3ZSBlbmRlZCB1cCBjaGFuZ2luZyB0aGUgc2VsZWN0aW9uLCBmYWxzZSBpZiBub3QuXG5mdW5jdGlvbiBzY3JvbGxPbmVQYWdlKGVsZW1lbnQsIGRvd253YXJkKSB7XG5cbiAgLy8gRGV0ZXJtaW5lIHRoZSBpdGVtIHZpc2libGUganVzdCBhdCB0aGUgZWRnZSBvZiBkaXJlY3Rpb24gd2UncmUgaGVhZGluZy5cbiAgLy8gV2UnbGwgc2VsZWN0IHRoYXQgaXRlbSBpZiBpdCdzIG5vdCBhbHJlYWR5IHNlbGVjdGVkLlxuICBjb25zdCBzY3JvbGxUYXJnZXQgPSBlbGVtZW50W3N5bWJvbHMuc2Nyb2xsVGFyZ2V0XTtcbiAgY29uc3QgZWRnZSA9IHNjcm9sbFRhcmdldC5zY3JvbGxUb3AgKyAoZG93bndhcmQgPyBzY3JvbGxUYXJnZXQuY2xpZW50SGVpZ2h0IDogMCk7XG4gIGNvbnN0IGluZGV4T2ZJdGVtQXRFZGdlID0gZ2V0SW5kZXhPZkl0ZW1BdFkoZWxlbWVudCwgc2Nyb2xsVGFyZ2V0LCBlZGdlLCBkb3dud2FyZCk7XG5cbiAgY29uc3Qgc2VsZWN0ZWRJbmRleCA9IGVsZW1lbnQuc2VsZWN0ZWRJbmRleDtcbiAgbGV0IG5ld0luZGV4O1xuICBpZiAoaW5kZXhPZkl0ZW1BdEVkZ2UgJiYgc2VsZWN0ZWRJbmRleCA9PT0gaW5kZXhPZkl0ZW1BdEVkZ2UpIHtcbiAgICAvLyBUaGUgaXRlbSBhdCB0aGUgZWRnZSB3YXMgYWxyZWFkeSBzZWxlY3RlZCwgc28gc2Nyb2xsIGluIHRoZSBpbmRpY2F0ZWRcbiAgICAvLyBkaXJlY3Rpb24gYnkgb25lIHBhZ2UuIExlYXZlIHRoZSBuZXcgaXRlbSBhdCB0aGF0IGVkZ2Ugc2VsZWN0ZWQuXG4gICAgY29uc3QgZGVsdGEgPSAoZG93bndhcmQgPyAxIDogLTEpICogc2Nyb2xsVGFyZ2V0LmNsaWVudEhlaWdodDtcbiAgICBuZXdJbmRleCA9IGdldEluZGV4T2ZJdGVtQXRZKGVsZW1lbnQsIHNjcm9sbFRhcmdldCwgZWRnZSArIGRlbHRhLCBkb3dud2FyZCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gVGhlIGl0ZW0gYXQgdGhlIGVkZ2Ugd2Fzbid0IHNlbGVjdGVkIHlldC4gSW5zdGVhZCBvZiBzY3JvbGxpbmcsIHdlJ2xsXG4gICAgLy8ganVzdCBzZWxlY3QgdGhhdCBpdGVtLiBUaGF0IGlzLCB0aGUgZmlyc3QgYXR0ZW1wdCB0byBwYWdlIHVwL2Rvd25cbiAgICAvLyB1c3VhbGx5IGp1c3QgbW92ZXMgdGhlIHNlbGVjdGlvbiB0byB0aGUgZWRnZSBpbiB0aGF0IGRpcmVjdGlvbi5cbiAgICBuZXdJbmRleCA9IGluZGV4T2ZJdGVtQXRFZGdlO1xuICB9XG5cbiAgaWYgKCFuZXdJbmRleCkge1xuICAgIC8vIFdlIGNhbid0IGZpbmQgYW4gaXRlbSBpbiB0aGUgZGlyZWN0aW9uIHdlIHdhbnQgdG8gdHJhdmVsLiBTZWxlY3QgdGhlXG4gICAgLy8gbGFzdCBpdGVtIChpZiBtb3ZpbmcgZG93bndhcmQpIG9yIGZpcnN0IGl0ZW0gKGlmIG1vdmluZyB1cHdhcmQpLlxuICAgIG5ld0luZGV4ID0gKGRvd253YXJkID8gZWxlbWVudC5pdGVtcy5sZW5ndGggLSAxIDogMCk7XG4gIH1cblxuICBpZiAobmV3SW5kZXggIT09IHNlbGVjdGVkSW5kZXgpIHtcbiAgICBlbGVtZW50LnNlbGVjdGVkSW5kZXggPSBuZXdJbmRleDtcbiAgICByZXR1cm4gdHJ1ZTsgLy8gV2UgaGFuZGxlZCB0aGUgcGFnZSB1cC9kb3duIG91cnNlbHZlcy5cbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIFdlIGRpZG4ndCBkbyBhbnl0aGluZy5cbiAgfVxufVxuIiwiaW1wb3J0IGNvbnN0YW50cyBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgU3ltYm9sIGZyb20gJy4vU3ltYm9sJztcbmltcG9ydCBzeW1ib2xzIGZyb20gJy4vc3ltYm9scyc7XG5cblxuLy8gU3ltYm9scyBmb3IgcHJpdmF0ZSBkYXRhIG1lbWJlcnMgb24gYW4gZWxlbWVudC5cbmNvbnN0IGl0ZW1UZXh0Q29udGVudHNTeW1ib2wgPSBTeW1ib2woJ2l0ZW1UZXh0Q29udGVudHMnKTtcbmNvbnN0IHR5cGVkUHJlZml4U3ltYm9sID0gU3ltYm9sKCd0eXBlZFByZWZpeCcpO1xuY29uc3QgcHJlZml4VGltZW91dFN5bWJvbCA9IFN5bWJvbCgncHJlZml4VGltZW91dCcpO1xuY29uc3Qgc2V0dGluZ1NlbGVjdGlvblN5bWJvbCA9IFN5bWJvbCgnc2V0dGluZ1NlbGVjdGlvbicpO1xuXG5cbi8qKlxuICogTWl4aW4gdGhhdCBoYW5kbGVzIGxpc3QgYm94LXN0eWxlIHByZWZpeCB0eXBpbmcsIGluIHdoaWNoIHRoZSB1c2VyIGNhbiB0eXBlXG4gKiBhIHN0cmluZyB0byBzZWxlY3QgdGhlIGZpcnN0IGl0ZW0gdGhhdCBiZWdpbnMgd2l0aCB0aGF0IHN0cmluZy5cbiAqXG4gKiBFeGFtcGxlOiBzdXBwb3NlIGEgY29tcG9uZW50IHVzaW5nIHRoaXMgbWl4aW4gaGFzIHRoZSBmb2xsb3dpbmcgaXRlbXM6XG4gKlxuICogICAgIDxzYW1wbGUtbGlzdC1jb21wb25lbnQ+XG4gKiAgICAgICA8ZGl2PkFwcGxlPC9kaXY+XG4gKiAgICAgICA8ZGl2PkFwcmljb3Q8L2Rpdj5cbiAqICAgICAgIDxkaXY+QmFuYW5hPC9kaXY+XG4gKiAgICAgICA8ZGl2PkJsYWNrYmVycnk8L2Rpdj5cbiAqICAgICAgIDxkaXY+Qmx1ZWJlcnJ5PC9kaXY+XG4gKiAgICAgICA8ZGl2PkNhbnRhbG91cGU8L2Rpdj5cbiAqICAgICAgIDxkaXY+Q2hlcnJ5PC9kaXY+XG4gKiAgICAgICA8ZGl2PkxlbW9uPC9kaXY+XG4gKiAgICAgICA8ZGl2PkxpbWU8L2Rpdj5cbiAqICAgICA8L3NhbXBsZS1saXN0LWNvbXBvbmVudD5cbiAqXG4gKiBJZiB0aGlzIGNvbXBvbmVudCByZWNlaXZlcyB0aGUgZm9jdXMsIGFuZCB0aGUgdXNlciBwcmVzc2VzIHRoZSBcImJcIiBvciBcIkJcIlxuICoga2V5LCB0aGUgXCJCYW5hbmFcIiBpdGVtIHdpbGwgYmUgc2VsZWN0ZWQsIGJlY2F1c2UgaXQncyB0aGUgZmlyc3QgaXRlbSB0aGF0XG4gKiBtYXRjaGVzIHRoZSBwcmVmaXggXCJiXCIuIChNYXRjaGluZyBpcyBjYXNlLWluc2Vuc2l0aXZlLikgSWYgdGhlIHVzZXIgbm93XG4gKiBwcmVzc2VzIHRoZSBcImxcIiBvciBcIkxcIiBrZXkgcXVpY2tseSwgdGhlIHByZWZpeCB0byBtYXRjaCBiZWNvbWVzIFwiYmxcIiwgc29cbiAqIFwiQmxhY2tiZXJyeVwiIHdpbGwgYmUgc2VsZWN0ZWQuXG4gKlxuICogVGhlIHByZWZpeCB0eXBpbmcgZmVhdHVyZSBoYXMgYSBvbmUgc2Vjb25kIHRpbWVvdXQg4oCUwqB0aGUgcHJlZml4IHRvIG1hdGNoXG4gKiB3aWxsIGJlIHJlc2V0IGFmdGVyIGEgc2Vjb25kIGhhcyBwYXNzZWQgc2luY2UgdGhlIHVzZXIgbGFzdCB0eXBlZCBhIGtleS5cbiAqIElmLCBpbiB0aGUgYWJvdmUgZXhhbXBsZSwgdGhlIHVzZXIgd2FpdHMgYSBzZWNvbmQgYmV0d2VlbiB0eXBpbmcgXCJiXCIgYW5kXG4gKiBcImxcIiwgdGhlIHByZWZpeCB3aWxsIGJlY29tZSBcImxcIiwgc28gXCJMZW1vblwiIHdvdWxkIGJlIHNlbGVjdGVkLlxuICpcbiAqIFRoaXMgbWl4aW4gZXhwZWN0cyB0aGUgY29tcG9uZW50IHRvIGludm9rZSBhIGBrZXlkb3duYCBtZXRob2Qgd2hlbiBhIGtleSBpc1xuICogcHJlc3NlZC4gWW91IGNhbiB1c2UgW0tleWJvYXJkTWl4aW5dKEtleWJvYXJkTWl4aW4ubWQpIGZvciB0aGF0XG4gKiBwdXJwb3NlLCBvciB3aXJlIHVwIHlvdXIgb3duIGtleWJvYXJkIGhhbmRsaW5nIGFuZCBjYWxsIGBrZXlkb3duYCB5b3Vyc2VsZi5cbiAqXG4gKiBUaGlzIG1peGluIGFsc28gZXhwZWN0cyB0aGUgY29tcG9uZW50IHRvIHByb3ZpZGUgYW4gYGl0ZW1zYCBwcm9wZXJ0eS4gVGhlXG4gKiBgdGV4dENvbnRlbnRgIG9mIHRob3NlIGl0ZW1zIHdpbGwgYmUgdXNlZCBmb3IgcHVycG9zZXMgb2YgcHJlZml4IG1hdGNoaW5nLlxuICpcbiAqIEBtb2R1bGUgS2V5Ym9hcmRQcmVmaXhTZWxlY3Rpb25NaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEtleWJvYXJkUHJlZml4U2VsZWN0aW9uTWl4aW4oYmFzZSkge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIEtleWJvYXJkUHJlZml4U2VsZWN0aW9uIGV4dGVuZHMgYmFzZSB7XG5cbiAgICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uIHJldHVybnMgYW4gaXRlbSdzIGBhbHRgIGF0dHJpYnV0ZSBvciBpdHNcbiAgICAvLyBgdGV4dENvbnRlbnRgLCBpbiB0aGF0IG9yZGVyLlxuICAgIFtzeW1ib2xzLmdldEl0ZW1UZXh0XShpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXRBdHRyaWJ1dGUoJ2FsdCcpIHx8IGl0ZW0udGV4dENvbnRlbnQ7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHNldCBvZiBpdGVtcyBoYXMgY2hhbmdlZCwgcmVzZXQgdGhlIHByZWZpeC4gV2UnbGwgYWxzbyBuZWVkIHRvXG4gICAgLy8gcmVidWlsZCBvdXIgY2FjaGUgb2YgaXRlbSB0ZXh0IHRoZSBuZXh0IHRpbWUgd2UncmUgYXNrZWQgZm9yIGl0LlxuICAgIFtzeW1ib2xzLml0ZW1zQ2hhbmdlZF0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5pdGVtc0NoYW5nZWRdKSB7IHN1cGVyW3N5bWJvbHMuaXRlbXNDaGFuZ2VkXSgpOyB9XG4gICAgICB0aGlzW2l0ZW1UZXh0Q29udGVudHNTeW1ib2xdID0gbnVsbDtcbiAgICAgIHJlc2V0VHlwZWRQcmVmaXgodGhpcyk7XG4gICAgfVxuXG4gICAgW3N5bWJvbHMua2V5ZG93bl0oZXZlbnQpIHtcbiAgICAgIGxldCBoYW5kbGVkO1xuICAgICAgbGV0IHJlc2V0UHJlZml4ID0gdHJ1ZTtcblxuICAgICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICAgIGNhc2UgODogLy8gQmFja3NwYWNlXG4gICAgICAgICAgaGFuZGxlQmFja3NwYWNlKHRoaXMpO1xuICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAgIHJlc2V0UHJlZml4ID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjc6IC8vIEVzY2FwZVxuICAgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghZXZlbnQuY3RybEtleSAmJiAhZXZlbnQubWV0YUtleSAmJiAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICAgICAgIGV2ZW50LndoaWNoICE9PSAzMiAvKiBTcGFjZSAqLykge1xuICAgICAgICAgICAgaGFuZGxlUGxhaW5DaGFyYWN0ZXIodGhpcywgU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC5rZXlDb2RlKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc2V0UHJlZml4ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXNldFByZWZpeCkge1xuICAgICAgICByZXNldFR5cGVkUHJlZml4KHRoaXMpO1xuICAgICAgfVxuXG4gICAgICAvLyBQcmVmZXIgbWl4aW4gcmVzdWx0IGlmIGl0J3MgZGVmaW5lZCwgb3RoZXJ3aXNlIHVzZSBiYXNlIHJlc3VsdC5cbiAgICAgIHJldHVybiBoYW5kbGVkIHx8IChzdXBlcltzeW1ib2xzLmtleWRvd25dICYmIHN1cGVyW3N5bWJvbHMua2V5ZG93bl0oZXZlbnQpKTtcbiAgICB9XG5cbiAgICBnZXQgc2VsZWN0ZWRJbmRleCgpIHtcbiAgICAgIHJldHVybiBzdXBlci5zZWxlY3RlZEluZGV4O1xuICAgIH1cbiAgICBzZXQgc2VsZWN0ZWRJbmRleChpbmRleCkge1xuICAgICAgaWYgKCdzZWxlY3RlZEluZGV4JyBpbiBiYXNlLnByb3RvdHlwZSkgeyBzdXBlci5zZWxlY3RlZEluZGV4ID0gaW5kZXg7IH1cbiAgICAgIGlmICghdGhpc1tzZXR0aW5nU2VsZWN0aW9uU3ltYm9sXSkge1xuICAgICAgICAvLyBTb21lb25lIGVsc2UgKG5vdCB0aGlzIG1peGluKSBoYXMgY2hhbmdlZCB0aGUgc2VsZWN0aW9uLiBJbiByZXNwb25zZSxcbiAgICAgICAgLy8gd2UgaW52YWxpZGF0ZSB0aGUgcHJlZml4IHVuZGVyIGNvbnN0cnVjdGlvbi5cbiAgICAgICAgcmVzZXRUeXBlZFByZWZpeCh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZWxlY3QgdGhlIGZpcnN0IGl0ZW0gd2hvc2UgdGV4dCBjb250ZW50IGJlZ2lucyB3aXRoIHRoZSBnaXZlbiBwcmVmaXguXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJlZml4IFtTdHJpbmddIFRoZSBwcmVmaXggc3RyaW5nIHRvIHNlYXJjaCBmb3JcbiAgICAgKi9cbiAgICBzZWxlY3RJdGVtV2l0aFRleHRQcmVmaXgocHJlZml4KSB7XG4gICAgICBpZiAoc3VwZXIuc2VsZWN0SXRlbVdpdGhUZXh0UHJlZml4KSB7IHN1cGVyLnNlbGVjdEl0ZW1XaXRoVGV4dFByZWZpeChwcmVmaXgpOyB9XG4gICAgICBpZiAocHJlZml4ID09IG51bGwgfHwgcHJlZml4Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBpbmRleCA9IGdldEluZGV4T2ZJdGVtV2l0aFRleHRQcmVmaXgodGhpcywgcHJlZml4KTtcbiAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgc2VsZWN0aW9uLiBEdXJpbmcgdGhhdCBvcGVyYXRpb24sIHNldCB0aGUgZmxhZyB0aGF0IGxldHNcbiAgICAgICAgLy8gdXMga25vdyB0aGF0IHdlIGFyZSB0aGUgY2F1c2Ugb2YgdGhlIHNlbGVjdGlvbiBjaGFuZ2UuIFNlZSBub3RlIGF0XG4gICAgICAgIC8vIHRoaXMgbWl4aW4ncyBgc2VsZWN0ZWRJbmRleGAgaW1wbGVtZW50YXRpb24uXG4gICAgICAgIHRoaXNbc2V0dGluZ1NlbGVjdGlvblN5bWJvbF0gPSB0cnVlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBpbmRleDtcbiAgICAgICAgdGhpc1tzZXR0aW5nU2VsZWN0aW9uU3ltYm9sXSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIEtleWJvYXJkUHJlZml4U2VsZWN0aW9uO1xufVxuXG5cbi8vIFJldHVybiB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IGl0ZW0gd2l0aCB0aGUgZ2l2ZW4gcHJlZml4LCBlbHNlIC0xLlxuZnVuY3Rpb24gZ2V0SW5kZXhPZkl0ZW1XaXRoVGV4dFByZWZpeChlbGVtZW50LCBwcmVmaXgpIHtcbiAgY29uc3QgaXRlbVRleHRDb250ZW50cyA9IGdldEl0ZW1UZXh0Q29udGVudHMoZWxlbWVudCk7XG4gIGNvbnN0IHByZWZpeExlbmd0aCA9IHByZWZpeC5sZW5ndGg7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbVRleHRDb250ZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGl0ZW1UZXh0Q29udGVudCA9IGl0ZW1UZXh0Q29udGVudHNbaV07XG4gICAgaWYgKGl0ZW1UZXh0Q29udGVudC5zdWJzdHIoMCwgcHJlZml4TGVuZ3RoKSA9PT0gcHJlZml4KSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vLyBSZXR1cm4gYW4gYXJyYXkgb2YgdGhlIHRleHQgY29udGVudCAoaW4gbG93ZXJjYXNlKSBvZiBhbGwgaXRlbXMuXG4vLyBDYWNoZSB0aGVzZSByZXN1bHRzLlxuZnVuY3Rpb24gZ2V0SXRlbVRleHRDb250ZW50cyhlbGVtZW50KSB7XG4gIGlmICghZWxlbWVudFtpdGVtVGV4dENvbnRlbnRzU3ltYm9sXSkge1xuICAgIGNvbnN0IGl0ZW1zID0gZWxlbWVudC5pdGVtcztcbiAgICBlbGVtZW50W2l0ZW1UZXh0Q29udGVudHNTeW1ib2xdID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKGl0ZW1zLCBpdGVtID0+IHtcbiAgICAgIGNvbnN0IHRleHQgPSBlbGVtZW50W3N5bWJvbHMuZ2V0SXRlbVRleHRdKGl0ZW0pO1xuICAgICAgcmV0dXJuIHRleHQudG9Mb3dlckNhc2UoKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZWxlbWVudFtpdGVtVGV4dENvbnRlbnRzU3ltYm9sXTtcbn1cblxuLy8gSGFuZGxlIHRoZSBCYWNrc3BhY2Uga2V5OiByZW1vdmUgdGhlIGxhc3QgY2hhcmFjdGVyIGZyb20gdGhlIHByZWZpeC5cbmZ1bmN0aW9uIGhhbmRsZUJhY2tzcGFjZShlbGVtZW50KSB7XG4gIGNvbnN0IGxlbmd0aCA9IGVsZW1lbnRbdHlwZWRQcmVmaXhTeW1ib2xdID8gZWxlbWVudFt0eXBlZFByZWZpeFN5bWJvbF0ubGVuZ3RoIDogMDtcbiAgaWYgKGxlbmd0aCA+IDApIHtcbiAgICBlbGVtZW50W3R5cGVkUHJlZml4U3ltYm9sXSA9IGVsZW1lbnRbdHlwZWRQcmVmaXhTeW1ib2xdLnN1YnN0cigwLCBsZW5ndGggLSAxKTtcbiAgfVxuICBlbGVtZW50LnNlbGVjdEl0ZW1XaXRoVGV4dFByZWZpeChlbGVtZW50W3R5cGVkUHJlZml4U3ltYm9sXSk7XG4gIHNldFByZWZpeFRpbWVvdXQoZWxlbWVudCk7XG59XG5cbi8vIEFkZCBhIHBsYWluIGNoYXJhY3RlciB0byB0aGUgcHJlZml4LlxuZnVuY3Rpb24gaGFuZGxlUGxhaW5DaGFyYWN0ZXIoZWxlbWVudCwgY2hhcikge1xuICBjb25zdCBwcmVmaXggPSBlbGVtZW50W3R5cGVkUHJlZml4U3ltYm9sXSB8fCAnJztcbiAgZWxlbWVudFt0eXBlZFByZWZpeFN5bWJvbF0gPSBwcmVmaXggKyBjaGFyLnRvTG93ZXJDYXNlKCk7XG4gIGVsZW1lbnQuc2VsZWN0SXRlbVdpdGhUZXh0UHJlZml4KGVsZW1lbnRbdHlwZWRQcmVmaXhTeW1ib2xdKTtcbiAgc2V0UHJlZml4VGltZW91dChlbGVtZW50KTtcbn1cblxuLy8gU3RvcCBsaXN0ZW5pbmcgZm9yIHR5cGluZy5cbmZ1bmN0aW9uIHJlc2V0UHJlZml4VGltZW91dChlbGVtZW50KSB7XG4gIGlmIChlbGVtZW50W3ByZWZpeFRpbWVvdXRTeW1ib2xdKSB7XG4gICAgY2xlYXJUaW1lb3V0KGVsZW1lbnRbcHJlZml4VGltZW91dFN5bWJvbF0pO1xuICAgIGVsZW1lbnRbcHJlZml4VGltZW91dFN5bWJvbF0gPSBmYWxzZTtcbiAgfVxufVxuXG4vLyBDbGVhciB0aGUgcHJlZml4IHVuZGVyIGNvbnN0cnVjdGlvbi5cbmZ1bmN0aW9uIHJlc2V0VHlwZWRQcmVmaXgoZWxlbWVudCkge1xuICBlbGVtZW50W3R5cGVkUHJlZml4U3ltYm9sXSA9ICcnO1xuICByZXNldFByZWZpeFRpbWVvdXQoZWxlbWVudCk7XG59XG5cbi8vIFdhaXQgZm9yIHRoZSB1c2VyIHRvIHN0b3AgdHlwaW5nLlxuZnVuY3Rpb24gc2V0UHJlZml4VGltZW91dChlbGVtZW50KSB7XG4gIHJlc2V0UHJlZml4VGltZW91dChlbGVtZW50KTtcbiAgZWxlbWVudFtwcmVmaXhUaW1lb3V0U3ltYm9sXSA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHJlc2V0VHlwZWRQcmVmaXgoZWxlbWVudCk7XG4gIH0sIGNvbnN0YW50cy5UWVBJTkdfVElNRU9VVF9EVVJBVElPTik7XG59XG4iLCJpbXBvcnQgc3ltYm9scyBmcm9tICcuL3N5bWJvbHMnO1xuXG5cbi8vIFVzZWQgdG8gYXNzaWduIHVuaXF1ZSBJRHMgdG8gaXRlbSBlbGVtZW50cyB3aXRob3V0IElEcy5cbmxldCBpZENvdW50ID0gMDtcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIHRyZWF0cyB0aGUgc2VsZWN0ZWQgaXRlbSBpbiBhIGxpc3QgYXMgdGhlIGFjdGl2ZSBpdGVtIGluIEFSSUFcbiAqIGFjY2Vzc2liaWxpdHkgdGVybXMuXG4gKlxuICogSGFuZGxpbmcgQVJJQSBzZWxlY3Rpb24gc3RhdGUgcHJvcGVybHkgaXMgYWN0dWFsbHkgcXVpdGUgY29tcGxleDpcbiAqXG4gKiAqIFRoZSBpdGVtcyBpbiB0aGUgbGlzdCBuZWVkIHRvIGJlIGluZGljYXRlZCBhcyBwb3NzaWJsZSBpdGVtcyB2aWEgYW4gQVJJQVxuICogICBgcm9sZWAgYXR0cmlidXRlIHZhbHVlIHN1Y2ggYXMgXCJvcHRpb25cIi5cbiAqICogVGhlIHNlbGVjdGVkIGl0ZW0gbmVlZCB0byBiZSBtYXJrZWQgYXMgc2VsZWN0ZWQgYnkgc2V0dGluZyB0aGUgaXRlbSdzXG4gKiAgIGBhcmlhLXNlbGVjdGVkYCBhdHRyaWJ1dGUgdG8gdHJ1ZSAqYW5kKiB0aGUgb3RoZXIgaXRlbXMgbmVlZCBiZSBtYXJrZWQgYXNcbiAqICAgKm5vdCogc2VsZWN0ZWQgYnkgc2V0dGluZyBgYXJpYS1zZWxlY3RlZGAgdG8gZmFsc2UuXG4gKiAqIFRoZSBvdXRlcm1vc3QgZWxlbWVudCB3aXRoIHRoZSBrZXlib2FyZCBmb2N1cyBuZWVkcyB0byBoYXZlIGF0dHJpYnV0ZXNcbiAqICAgc2V0IG9uIGl0IHNvIHRoYXQgdGhlIHNlbGVjdGlvbiBpcyBrbm93YWJsZSBhdCB0aGUgbGlzdCBsZXZlbCB2aWEgdGhlXG4gKiAgIGBhcmlhLWFjdGl2ZWRlc2NlbmRhbnRgIGF0dHJpYnV0ZS5cbiAqICogVXNlIG9mIGBhcmlhLWFjdGl2ZWRlc2NlbmRhbnRgIGluIHR1cm4gcmVxdWlyZXMgdGhhdCBhbGwgaXRlbXMgaW4gdGhlXG4gKiAgIGxpc3QgaGF2ZSBJRCBhdHRyaWJ1dGVzIGFzc2lnbmVkIHRvIHRoZW0uXG4gKlxuICogVGhpcyBtaXhpbiB0cmllcyB0byBhZGRyZXNzIGFsbCBvZiB0aGUgYWJvdmUgcmVxdWlyZW1lbnRzLiBUbyB0aGF0IGVuZCxcbiAqIHRoaXMgbWl4aW4gd2lsbCBhc3NpZ24gZ2VuZXJhdGVkIElEcyB0byBhbnkgaXRlbSB0aGF0IGRvZXNuJ3QgYWxyZWFkeSBoYXZlXG4gKiBhbiBJRC5cbiAqXG4gKiBBUklBIHJlbGllcyBvbiBlbGVtZW50cyB0byBwcm92aWRlIGByb2xlYCBhdHRyaWJ1dGVzLiBUaGlzIG1peGluIHdpbGwgYXBwbHlcbiAqIGEgZGVmYXVsdCByb2xlIG9mIFwibGlzdGJveFwiIG9uIHRoZSBvdXRlciBsaXN0IGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBoYXZlIGFuXG4gKiBleHBsaWNpdCByb2xlLiBTaW1pbGFybHksIHRoaXMgbWl4aW4gd2lsbCBhcHBseSBhIGRlZmF1bHQgcm9sZSBvZiBcIm9wdGlvblwiXG4gKiB0byBhbnkgbGlzdCBpdGVtIHRoYXQgZG9lcyBub3QgYWxyZWFkeSBoYXZlIGEgcm9sZSBzcGVjaWZpZWQuXG4gKlxuICogVGhpcyBtaXhpbiBleHBlY3RzIGEgc2V0IG9mIG1lbWJlcnMgdGhhdCBtYW5hZ2UgdGhlIHN0YXRlIG9mIHRoZSBzZWxlY3Rpb246XG4gKiBgW3N5bWJvbHMuaXRlbVNlbGVjdGVkXWAsIGBbc3ltYm9scy5pdGVtQWRkZWRdYCwgYW5kIGBzZWxlY3RlZEl0ZW1gLiBZb3UgY2FuXG4gKiBzdXBwbHkgdGhlc2UgeW91cnNlbGYsIG9yIGRvIHNvIHZpYVxuICogW1NpbmdsZVNlbGVjdGlvbk1peGluXShTaW5nbGVTZWxlY3Rpb25NaXhpbi5tZCkuXG4gKlxuICogQG1vZHVsZVxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChiYXNlKSB7XG5cbiAgLyoqXG4gICAqIFRoZSBjbGFzcyBwcm90b3R5cGUgYWRkZWQgYnkgdGhlIG1peGluLlxuICAgKi9cbiAgY2xhc3MgU2VsZWN0aW9uQXJpYSBleHRlbmRzIGJhc2Uge1xuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICBpZiAoc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2spIHsgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTsgfVxuXG4gICAgICAvLyBTZXQgZGVmYXVsdCBBUklBIHJvbGUgZm9yIHRoZSBvdmVyYWxsIGNvbXBvbmVudC5cbiAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZSgncm9sZScpID09IG51bGwgJiYgdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS5yb2xlKSB7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdyb2xlJywgdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS5yb2xlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgW3N5bWJvbHMuZGVmYXVsdHNdKCkge1xuICAgICAgY29uc3QgZGVmYXVsdHMgPSBzdXBlcltzeW1ib2xzLmRlZmF1bHRzXSB8fCB7fTtcbiAgICAgIGRlZmF1bHRzLnJvbGUgPSAnbGlzdGJveCc7XG4gICAgICBkZWZhdWx0cy5pdGVtUm9sZSA9ICdvcHRpb24nO1xuICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIFtzeW1ib2xzLml0ZW1BZGRlZF0oaXRlbSkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbUFkZGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1BZGRlZF0oaXRlbSk7IH1cblxuICAgICAgaWYgKCFpdGVtLmdldEF0dHJpYnV0ZSgncm9sZScpKSB7XG4gICAgICAgIC8vIEFzc2lnbiBhIGRlZmF1bHQgQVJJQSByb2xlIGZvciBhbiBpbmRpdmlkdWFsIGl0ZW0uXG4gICAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdyb2xlJywgdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS5pdGVtUm9sZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEVuc3VyZSBlYWNoIGl0ZW0gaGFzIGFuIElEIHNvIHdlIGNhbiBzZXQgYXJpYS1hY3RpdmVkZXNjZW5kYW50IG9uIHRoZVxuICAgICAgLy8gb3ZlcmFsbCBsaXN0IHdoZW5ldmVyIHRoZSBzZWxlY3Rpb24gY2hhbmdlcy5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgSUQgd2lsbCB0YWtlIHRoZSBmb3JtIG9mIGEgYmFzZSBJRCBwbHVzIGEgdW5pcXVlIGludGVnZXIuIFRoZSBiYXNlXG4gICAgICAvLyBJRCB3aWxsIGJlIGluY29ycG9yYXRlIHRoZSBjb21wb25lbnQncyBvd24gSUQuIEUuZy4sIGlmIGEgY29tcG9uZW50IGhhc1xuICAgICAgLy8gSUQgXCJmb29cIiwgdGhlbiBpdHMgaXRlbXMgd2lsbCBoYXZlIElEcyB0aGF0IGxvb2sgbGlrZSBcIl9mb29PcHRpb24xXCIuIElmXG4gICAgICAvLyB0aGUgY29tcG5lbnQgaGFzIG5vIElEIGl0c2VsZiwgaXRzIGl0ZW1zIHdpbGwgZ2V0IElEcyB0aGF0IGxvb2sgbGlrZVxuICAgICAgLy8gXCJfb3B0aW9uMVwiLiBJdGVtIElEcyBhcmUgcHJlZml4ZWQgd2l0aCBhbiB1bmRlcnNjb3JlIHRvIGRpZmZlcmVudGlhdGVcbiAgICAgIC8vIHRoZW0gZnJvbSBtYW51YWxseS1hc3NpZ25lZCBJRHMsIGFuZCB0byBtaW5pbWl6ZSB0aGUgcG90ZW50aWFsIGZvciBJRFxuICAgICAgLy8gY29uZmxpY3RzLlxuICAgICAgaWYgKCFpdGVtLmlkKSB7XG4gICAgICAgIGNvbnN0IGJhc2VJZCA9IHRoaXMuaWQgP1xuICAgICAgICAgICAgXCJfXCIgKyB0aGlzLmlkICsgXCJPcHRpb25cIiA6XG4gICAgICAgICAgICBcIl9vcHRpb25cIjtcbiAgICAgICAgaXRlbS5pZCA9IGJhc2VJZCArIGlkQ291bnQrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKSB7IHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCk7IH1cbiAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdhcmlhLXNlbGVjdGVkJywgc2VsZWN0ZWQpO1xuICAgICAgY29uc3QgaXRlbUlkID0gaXRlbS5pZDtcbiAgICAgIGlmIChpdGVtSWQgJiYgc2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCcsIGl0ZW1JZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHNlbGVjdGVkSXRlbSgpIHtcbiAgICAgIHJldHVybiBzdXBlci5zZWxlY3RlZEl0ZW07XG4gICAgfVxuICAgIHNldCBzZWxlY3RlZEl0ZW0oaXRlbSkge1xuICAgICAgaWYgKCdzZWxlY3RlZEl0ZW0nIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLnNlbGVjdGVkSXRlbSA9IGl0ZW07IH1cbiAgICAgIGlmIChpdGVtID09IG51bGwpIHtcbiAgICAgICAgLy8gU2VsZWN0aW9uIHdhcyByZW1vdmVkLlxuICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1hY3RpdmVkZXNjZW5kYW50Jyk7XG4gICAgICB9XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gU2VsZWN0aW9uQXJpYTtcbn1cbiIsImltcG9ydCBkZWZhdWx0U2Nyb2xsVGFyZ2V0IGZyb20gJy4vZGVmYXVsdFNjcm9sbFRhcmdldCc7XG5pbXBvcnQgc3ltYm9scyBmcm9tICcuL3N5bWJvbHMnO1xuXG5cbi8qKlxuICogTWl4aW4gd2hpY2ggc2Nyb2xscyBhIGNvbnRhaW5lciBob3Jpem9udGFsbHkgYW5kL29yIHZlcnRpY2FsbHkgdG8gZW5zdXJlIHRoYXRcbiAqIGEgbmV3bHktc2VsZWN0ZWQgaXRlbSBpcyB2aXNpYmxlIHRvIHRoZSB1c2VyLlxuICpcbiAqIFdoZW4gdGhlIHNlbGVjdGVkIGl0ZW0gaW4gYSBsaXN0LWxpa2UgY29tcG9uZW50IGNoYW5nZXMsIHRoZSBzZWxlY3RlZCBpdGVtXG4gKiBzaG91bGQgYmUgYnJvdWdodCBpbnRvIHZpZXcgc28gdGhhdCB0aGUgdXNlciBjYW4gY29uZmlybSB0aGVpciBzZWxlY3Rpb24uXG4gKlxuICogVGhpcyBtaXhpbiBleHBlY3RzIGEgYHNlbGVjdGVkSXRlbWAgcHJvcGVydHkgdG8gYmUgc2V0IHdoZW4gdGhlIHNlbGVjdGlvblxuICogY2hhbmdlcy4gWW91IGNhbiBzdXBwbHkgdGhhdCB5b3Vyc2VsZiwgb3IgdXNlXG4gKiBbU2luZ2xlU2VsZWN0aW9uTWl4aW5dKFNpbmdsZVNlbGVjdGlvbk1peGluLm1kKS5cbiAqXG4gKiBAbW9kdWxlIFNlbGVjdGluSW5WaWV3TWl4aW5cbiAqIEBwYXJhbSBiYXNlIHtDbGFzc30gdGhlIGJhc2UgY2xhc3MgdG8gZXh0ZW5kXG4gKiBAcmV0dXJucyB7Q2xhc3N9IHRoZSBleHRlbmRlZCBjbGFzc1xuICovXG5leHBvcnQgZGVmYXVsdCAoYmFzZSkgPT4ge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIFNlbGVjdGlvbkluVmlldyBleHRlbmRzIGJhc2Uge1xuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICBpZiAoc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2spIHsgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTsgfVxuICAgICAgY29uc3Qgc2VsZWN0ZWRJdGVtID0gdGhpcy5zZWxlY3RlZEl0ZW07XG4gICAgICBpZiAoc2VsZWN0ZWRJdGVtKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsSXRlbUludG9WaWV3KHNlbGVjdGVkSXRlbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2Nyb2xsIHRoZSBnaXZlbiBlbGVtZW50IGNvbXBsZXRlbHkgaW50byB2aWV3LCBtaW5pbWl6aW5nIHRoZSBkZWdyZWUgb2ZcbiAgICAgKiBzY3JvbGxpbmcgcGVyZm9ybWVkLlxuICAgICAqXG4gICAgICogQmxpbmsgaGFzIGEgYHNjcm9sbEludG9WaWV3SWZOZWVkZWQoKWAgZnVuY3Rpb24gdGhhdCBkb2VzIHNvbWV0aGluZ1xuICAgICAqIHNpbWlsYXIsIGJ1dCB1bmZvcnR1bmF0ZWx5IGl0J3Mgbm9uLXN0YW5kYXJkLCBhbmQgaW4gYW55IGV2ZW50IG9mdGVuIGVuZHNcbiAgICAgKiB1cCBzY3JvbGxpbmcgbW9yZSB0aGFuIGlzIGFic29sdXRlbHkgbmVjZXNzYXJ5LlxuICAgICAqXG4gICAgICogVGhpcyBzY3JvbGxzIHRoZSBjb250YWluaW5nIGVsZW1lbnQgZGVmaW5lZCBieSB0aGUgYHNjcm9sbFRhcmdldGBcbiAgICAgKiBwcm9wZXJ0eS4gU2VlIHRoYXQgcHJvcGVydHkgZm9yIGEgZGlzY3Vzc2lvbiBvZiB0aGUgZGVmYXVsdCB2YWx1ZSBvZlxuICAgICAqIHRoYXQgcHJvcGVydHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gdG8gc2Nyb2xsIGludG8gdmlldy5cbiAgICAgKi9cbiAgICBzY3JvbGxJdGVtSW50b1ZpZXcoaXRlbSkge1xuICAgICAgaWYgKHN1cGVyLnNjcm9sbEl0ZW1JbnRvVmlldykgeyBzdXBlci5zY3JvbGxJdGVtSW50b1ZpZXcoKTsgfVxuXG4gICAgICBjb25zdCBzY3JvbGxUYXJnZXQgPSB0aGlzW3N5bWJvbHMuc2Nyb2xsVGFyZ2V0XTtcblxuICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBib3VuZHMgb2YgdGhlIHNjcm9sbCB0YXJnZXQgYW5kIGl0ZW0uIFdlIHVzZVxuICAgICAgLy8gZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGluc3RlYWQgb2YgLm9mZnNldFRvcCwgZXRjLiwgYmVjYXVzZSB0aGUgbGF0dGVyXG4gICAgICAvLyByb3VuZCB2YWx1ZXMsIGFuZCB3ZSB3YW50IHRvIGhhbmRsZSBmcmFjdGlvbmFsIHZhbHVlcy5cbiAgICAgIGNvbnN0IHNjcm9sbFRhcmdldFJlY3QgPSBzY3JvbGxUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBpdGVtUmVjdCA9IGl0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgIC8vIERldGVybWluZSBob3cgZmFyIHRoZSBpdGVtIGlzIG91dHNpZGUgdGhlIHZpZXdwb3J0LlxuICAgICAgY29uc3QgYm90dG9tRGVsdGEgPSBpdGVtUmVjdC5ib3R0b20gLSBzY3JvbGxUYXJnZXRSZWN0LmJvdHRvbTtcbiAgICAgIGNvbnN0IHRvcERlbHRhID0gaXRlbVJlY3QudG9wIC0gc2Nyb2xsVGFyZ2V0UmVjdC50b3A7XG4gICAgICBjb25zdCBsZWZ0RGVsdGEgPSBpdGVtUmVjdC5sZWZ0IC0gc2Nyb2xsVGFyZ2V0UmVjdC5sZWZ0O1xuICAgICAgY29uc3QgcmlnaHREZWx0YSA9IGl0ZW1SZWN0LnJpZ2h0IC0gc2Nyb2xsVGFyZ2V0UmVjdC5yaWdodDtcblxuICAgICAgLy8gU2Nyb2xsIHRoZSB0YXJnZXQgYXMgbmVjZXNzYXJ5IHRvIGJyaW5nIHRoZSBpdGVtIGludG8gdmlldy5cbiAgICAgIGlmIChib3R0b21EZWx0YSA+IDApIHtcbiAgICAgICAgc2Nyb2xsVGFyZ2V0LnNjcm9sbFRvcCArPSBib3R0b21EZWx0YTsgICAgICAgICAgICAvLyBTY3JvbGwgZG93blxuICAgICAgfSBlbHNlIGlmICh0b3BEZWx0YSA8IDApIHtcbiAgICAgICAgc2Nyb2xsVGFyZ2V0LnNjcm9sbFRvcCArPSBNYXRoLmNlaWwodG9wRGVsdGEpOyAgICAvLyBTY3JvbGwgdXBcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodERlbHRhID4gMCkge1xuICAgICAgICBzY3JvbGxUYXJnZXQuc2Nyb2xsTGVmdCArPSByaWdodERlbHRhOyAgICAgICAgICAgIC8vIFNjcm9sbCByaWdodFxuICAgICAgfSBlbHNlIGlmIChsZWZ0RGVsdGEgPCAwKSB7XG4gICAgICAgIHNjcm9sbFRhcmdldC5zY3JvbGxMZWZ0ICs9IE1hdGguY2VpbChsZWZ0RGVsdGEpOyAgLy8gU2Nyb2xsIGxlZnRcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKiBQcm92aWRlIGEgZGVmYXVsdCBzY3JvbGxUYXJnZXQgaW1wbGVtZW50YXRpb24gaWYgbm9uZSBleGlzdHMuICovXG4gICAgZ2V0IFtzeW1ib2xzLnNjcm9sbFRhcmdldF0oKSB7XG4gICAgICByZXR1cm4gc3VwZXJbc3ltYm9scy5zY3JvbGxUYXJnZXRdIHx8IGRlZmF1bHRTY3JvbGxUYXJnZXQodGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0IHNlbGVjdGVkSXRlbSgpIHtcbiAgICAgIHJldHVybiBzdXBlci5zZWxlY3RlZEl0ZW07XG4gICAgfVxuICAgIHNldCBzZWxlY3RlZEl0ZW0oaXRlbSkge1xuICAgICAgaWYgKCdzZWxlY3RlZEl0ZW0nIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLnNlbGVjdGVkSXRlbSA9IGl0ZW07IH1cbiAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgIC8vIEtlZXAgdGhlIHNlbGVjdGVkIGl0ZW0gaW4gdmlldy5cbiAgICAgICAgdGhpcy5zY3JvbGxJdGVtSW50b1ZpZXcoaXRlbSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFNlbGVjdGlvbkluVmlldztcbn07XG4iLCJpbXBvcnQgU3ltYm9sIGZyb20gJy4vU3ltYm9sJztcbmltcG9ydCBzeW1ib2xzIGZyb20gJy4vc3ltYm9scyc7XG5cblxuLy8gU3ltYm9scyBmb3IgcHJpdmF0ZSBkYXRhIG1lbWJlcnMgb24gYW4gZWxlbWVudC5cbmNvbnN0IGNhblNlbGVjdE5leHRTeW1ib2wgPSBTeW1ib2woJ2NhblNlbGVjdE5leHQnKTtcbmNvbnN0IGNhblNlbGVjdFByZXZpb3VzU3ltYm9sID0gU3ltYm9sKCdjYW5TZWxlY3RQcmV2aW91cycpO1xuY29uc3Qgc2VsZWN0aW9uUmVxdWlyZWRTeW1ib2wgPSBTeW1ib2woJ3NlbGVjdGlvblJlcXVpcmVkJyk7XG5jb25zdCBzZWxlY3Rpb25XcmFwc1N5bWJvbCA9IFN5bWJvbCgnc2VsZWN0aW9uV3JhcHMnKTtcblxuLy8gV2Ugd2FudCB0byBleHBvc2UgYm90aCBzZWxlY3RlZEluZGV4IGFuZCBzZWxlY3RlZEl0ZW0gYXMgaW5kZXBlbmRlbnRcbi8vIHByb3BlcnRpZXMgYnV0IGtlZXAgdGhlbSBpbiBzeW5jLiBUaGlzIGFsbG93cyBhIGNvbXBvbmVudCB1c2VyIHRvIHJlZmVyZW5jZVxuLy8gdGhlIHNlbGVjdGlvbiBieSB3aGF0ZXZlciBtZWFucyBpcyBtb3N0IG5hdHVyYWwgZm9yIHRoZWlyIHNpdHVhdGlvbi5cbi8vXG4vLyBUbyBlZmZpY2llbnRseSBrZWVwIHRoZXNlIHByb3BlcnRpZXMgaW4gc3luYywgd2UgdHJhY2sgXCJleHRlcm5hbFwiIGFuZFxuLy8gXCJpbnRlcm5hbFwiIHJlZmVyZW5jZXMgZm9yIGVhY2ggcHJvcGVydHk6XG4vL1xuLy8gVGhlIGV4dGVybmFsIGluZGV4IG9yIGl0ZW0gaXMgdGhlIG9uZSB3ZSByZXBvcnQgdG8gdGhlIG91dHNpZGUgd29ybGQgd2hlblxuLy8gYXNrZWQgZm9yIHNlbGVjdGlvbi4gIFdoZW4gaGFuZGxpbmcgYSBjaGFuZ2UgdG8gaW5kZXggb3IgaXRlbSwgd2UgdXBkYXRlIHRoZVxuLy8gZXh0ZXJuYWwgcmVmZXJlbmNlIGFzIHNvb24gYXMgcG9zc2libGUsIHNvIHRoYXQgaWYgYW55b25lIGltbWVkaWF0ZWx5IGFza3Ncbi8vIGZvciB0aGUgY3VycmVudCBzZWxlY3Rpb24sIHRoZXkgd2lsbCByZWNlaXZlIGEgc3RhYmxlIGFuc3dlci5cbi8vXG4vLyBUaGUgaW50ZXJuYWwgaW5kZXggb3IgaXRlbSB0cmFja3Mgd2hpY2hldmVyIGluZGV4IG9yIGl0ZW0gbGFzdCByZWNlaXZlZCB0aGVcbi8vIGZ1bGwgc2V0IG9mIHByb2Nlc3NpbmcuIFByb2Nlc3NpbmcgaW5jbHVkZXMgcmFpc2luZyBhIGNoYW5nZSBldmVudCBmb3IgdGhlXG4vLyBuZXcgdmFsdWUuIE9uY2Ugd2UndmUgYmVndW4gdGhhdCBwcm9jZXNzaW5nLCB3ZSBzdG9yZSB0aGUgbmV3IHZhbHVlIGFzIHRoZVxuLy8gaW50ZXJuYWwgdmFsdWUgdG8gaW5kaWNhdGUgd2UndmUgaGFuZGxlZCBpdC5cbi8vXG5jb25zdCBleHRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2wgPSBTeW1ib2woJ2V4dGVybmFsU2VsZWN0ZWRJbmRleCcpO1xuY29uc3QgZXh0ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2wgPSBTeW1ib2woJ2V4dGVybmFsU2VsZWN0ZWRJdGVtJyk7XG5jb25zdCBpbnRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2wgPSBTeW1ib2woJ2ludGVybmFsU2VsZWN0ZWRJbmRleCcpO1xuY29uc3QgaW50ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2wgPSBTeW1ib2woJ2ludGVybmFsU2VsZWN0ZWRJdGVtJyk7XG5cblxuLyoqXG4gKiBNaXhpbiB3aGljaCBhZGRzIHNpbmdsZS1zZWxlY3Rpb24gc2VtYW50aWNzIGZvciBpdGVtcyBpbiBhIGxpc3QuXG4gKlxuICogVGhpcyBtaXhpbiBleHBlY3RzIGEgY29tcG9uZW50IHRvIHByb3ZpZGUgYW4gYGl0ZW1zYCBBcnJheSBvciBOb2RlTGlzdCBvZlxuICogYWxsIGVsZW1lbnRzIGluIHRoZSBsaXN0LlxuICpcbiAqIFRoaXMgbWl4aW4gdHJhY2tzIGEgc2luZ2xlIHNlbGVjdGVkIGl0ZW0gaW4gdGhlIGxpc3QsIGFuZCBwcm92aWRlcyBtZWFucyB0b1xuICogZ2V0IGFuZCBzZXQgdGhhdCBzdGF0ZSBieSBpdGVtIHBvc2l0aW9uIChgc2VsZWN0ZWRJbmRleGApIG9yIGl0ZW0gaWRlbnRpdHlcbiAqIChgc2VsZWN0ZWRJdGVtYCkuIFRoZSBzZWxlY3Rpb24gY2FuIGJlIG1vdmVkIGluIHRoZSBsaXN0IHZpYSB0aGUgbWV0aG9kc1xuICogYHNlbGVjdEZpcnN0YCwgYHNlbGVjdExhc3RgLCBgc2VsZWN0TmV4dGAsIGFuZCBgc2VsZWN0UHJldmlvdXNgLlxuICpcbiAqIFRoaXMgbWl4aW4gZG9lcyBub3QgcHJvZHVjZSBhbnkgdXNlci12aXNpYmxlIGVmZmVjdHMgdG8gcmVwcmVzZW50XG4gKiBzZWxlY3Rpb24uXG4gKlxuICogQG1vZHVsZSBTaW5nbGVTZWxlY3Rpb25NaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFNpbmdsZVNlbGVjdGlvbk1peGluKGJhc2UpIHtcblxuICAvKipcbiAgICogVGhlIGNsYXNzIHByb3RvdHlwZSBhZGRlZCBieSB0aGUgbWl4aW4uXG4gICAqL1xuICBjbGFzcyBTaW5nbGVTZWxlY3Rpb24gZXh0ZW5kcyBiYXNlIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgc3VwZXIoKTtcbiAgICAgIC8vIFNldCBkZWZhdWx0cy5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zZWxlY3Rpb25SZXF1aXJlZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb25SZXF1aXJlZCA9IHRoaXNbc3ltYm9scy5kZWZhdWx0c10uc2VsZWN0aW9uUmVxdWlyZWQ7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHRoaXMuc2VsZWN0aW9uV3JhcHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uV3JhcHMgPSB0aGlzW3N5bWJvbHMuZGVmYXVsdHNdLnNlbGVjdGlvbldyYXBzO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRydWUgaWYgdGhlIHNlbGVjdGlvbiBjYW4gYmUgbW92ZWQgdG8gdGhlIG5leHQgaXRlbSwgZmFsc2UgaWYgbm90ICh0aGVcbiAgICAgKiBzZWxlY3RlZCBpdGVtIGlzIHRoZSBsYXN0IGl0ZW0gaW4gdGhlIGxpc3QpLlxuICAgICAqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGNhblNlbGVjdE5leHQoKSB7XG4gICAgICByZXR1cm4gdGhpc1tjYW5TZWxlY3ROZXh0U3ltYm9sXTtcbiAgICB9XG4gICAgc2V0IGNhblNlbGVjdE5leHQoY2FuU2VsZWN0TmV4dCkge1xuICAgICAgY29uc3QgY2hhbmdlZCA9IGNhblNlbGVjdE5leHQgIT09IHRoaXNbY2FuU2VsZWN0TmV4dFN5bWJvbF07XG4gICAgICB0aGlzW2NhblNlbGVjdE5leHRTeW1ib2xdID0gY2FuU2VsZWN0TmV4dDtcbiAgICAgIGlmICgnY2FuU2VsZWN0TmV4dCcgaW4gYmFzZS5wcm90b3R5cGUpIHsgc3VwZXIuY2FuU2VsZWN0TmV4dCA9IGNhblNlbGVjdE5leHQ7IH1cbiAgICAgIGlmICh0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdICYmIGNoYW5nZWQpIHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnY2FuLXNlbGVjdC1uZXh0LWNoYW5nZWQnKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJ1ZSBpZiB0aGUgc2VsZWN0aW9uIGNhbiBiZSBtb3ZlZCB0byB0aGUgcHJldmlvdXMgaXRlbSwgZmFsc2UgaWYgbm90XG4gICAgICogKHRoZSBzZWxlY3RlZCBpdGVtIGlzIHRoZSBmaXJzdCBvbmUgaW4gdGhlIGxpc3QpLlxuICAgICAqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgZ2V0IGNhblNlbGVjdFByZXZpb3VzKCkge1xuICAgICAgcmV0dXJuIHRoaXNbY2FuU2VsZWN0UHJldmlvdXNTeW1ib2xdO1xuICAgIH1cbiAgICBzZXQgY2FuU2VsZWN0UHJldmlvdXMoY2FuU2VsZWN0UHJldmlvdXMpIHtcbiAgICAgIGNvbnN0IGNoYW5nZWQgPSBjYW5TZWxlY3RQcmV2aW91cyAhPT0gdGhpc1tjYW5TZWxlY3RQcmV2aW91c1N5bWJvbF07XG4gICAgICB0aGlzW2NhblNlbGVjdFByZXZpb3VzU3ltYm9sXSA9IGNhblNlbGVjdFByZXZpb3VzO1xuICAgICAgaWYgKCdjYW5TZWxlY3RQcmV2aW91cycgaW4gYmFzZS5wcm90b3R5cGUpIHsgc3VwZXIuY2FuU2VsZWN0UHJldmlvdXMgPSBjYW5TZWxlY3RQcmV2aW91czsgfVxuICAgICAgaWYgKHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10gJiYgY2hhbmdlZCkge1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdjYW4tc2VsZWN0LXByZXZpb3VzLWNoYW5nZWQnKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IFtzeW1ib2xzLmRlZmF1bHRzXSgpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRzID0gc3VwZXJbc3ltYm9scy5kZWZhdWx0c10gfHwge307XG4gICAgICBkZWZhdWx0cy5zZWxlY3Rpb25SZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgZGVmYXVsdHMuc2VsZWN0aW9uV3JhcHMgPSBmYWxzZTtcbiAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgYSBuZXcgaXRlbSBiZWluZyBhZGRlZCB0byB0aGUgbGlzdC5cbiAgICAgKlxuICAgICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIHRoaXMgbWV0aG9kIHNpbXBseSBzZXRzIHRoZSBpdGVtJ3NcbiAgICAgKiBzZWxlY3Rpb24gc3RhdGUgdG8gZmFsc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gYmVpbmcgYWRkZWRcbiAgICAgKi9cbiAgICBbc3ltYm9scy5pdGVtQWRkZWRdKGl0ZW0pIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLml0ZW1BZGRlZF0pIHsgc3VwZXJbc3ltYm9scy5pdGVtQWRkZWRdKGl0ZW0pOyB9XG4gICAgICB0aGlzW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBpdGVtID09PSB0aGlzLnNlbGVjdGVkSXRlbSk7XG4gICAgfVxuXG4gICAgW3N5bWJvbHMuaXRlbXNDaGFuZ2VkXSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLml0ZW1zQ2hhbmdlZF0pIHsgc3VwZXJbc3ltYm9scy5pdGVtc0NoYW5nZWRdKCk7IH1cblxuICAgICAgLy8gSW4gY2FzZSBzZWxlY3RlZCBpdGVtIGNoYW5nZWQgcG9zaXRpb24gb3Igd2FzIHJlbW92ZWQuXG4gICAgICB0cmFja1NlbGVjdGVkSXRlbSh0aGlzKTtcblxuICAgICAgLy8gSW4gY2FzZSB0aGUgY2hhbmdlIGluIGl0ZW1zIGFmZmVjdGVkIHdoaWNoIG5hdmlnYXRpb25zIGFyZSBwb3NzaWJsZS5cbiAgICAgIHVwZGF0ZVBvc3NpYmxlTmF2aWdhdGlvbnModGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXBwbHkgdGhlIGluZGljYXRlIHNlbGVjdGlvbiBzdGF0ZSB0byB0aGUgaXRlbS5cbiAgICAgKlxuICAgICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIHRoaXMgbWV0aG9kIGRvZXMgbm90aGluZy4gVXNlci12aXNpYmxlXG4gICAgICogZWZmZWN0cyB3aWxsIHR5cGljYWxseSBiZSBoYW5kbGVkIGJ5IG90aGVyIG1peGlucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGl0ZW0gLSB0aGUgaXRlbSBiZWluZyBzZWxlY3RlZC9kZXNlbGVjdGVkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBzZWxlY3RlZCAtIHRydWUgaWYgdGhlIGl0ZW0gaXMgc2VsZWN0ZWQsIGZhbHNlIGlmIG5vdFxuICAgICAqL1xuICAgIFtzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0pIHsgc3VwZXJbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKTsgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBpbmRleCBvZiB0aGUgaXRlbSB3aGljaCBpcyBjdXJyZW50bHkgc2VsZWN0ZWQuXG4gICAgICpcbiAgICAgKiBUaGUgc2V0dGVyIGV4cGVjdHMgYW4gaW50ZWdlciBvciBhIHN0cmluZyByZXByZXNlbnRpbmcgYW4gaW50ZWdlci5cbiAgICAgKlxuICAgICAqIEEgYHNlbGVjdGVkSW5kZXhgIG9mIC0xIGluZGljYXRlcyB0aGVyZSBpcyBubyBzZWxlY3Rpb24uIFNldHRpbmcgdGhpc1xuICAgICAqIHByb3BlcnR5IHRvIC0xIHdpbGwgcmVtb3ZlIGFueSBleGlzdGluZyBzZWxlY3Rpb24uXG4gICAgICpcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldCBzZWxlY3RlZEluZGV4KCkge1xuICAgICAgcmV0dXJuIHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sXSAhPSBudWxsID9cbiAgICAgICAgdGhpc1tleHRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2xdIDpcbiAgICAgICAgLTE7XG4gICAgfVxuICAgIHNldCBzZWxlY3RlZEluZGV4KGluZGV4KSB7XG4gICAgICAvLyBTZWUgbm90ZXMgYXQgdG9wIGFib3V0IGludGVybmFsIHZzLiBleHRlcm5hbCBjb3BpZXMgb2YgdGhpcyBwcm9wZXJ0eS5cbiAgICAgIGNvbnN0IGNoYW5nZWQgPSBpbmRleCAhPT0gdGhpc1tpbnRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2xdO1xuICAgICAgbGV0IGl0ZW07XG4gICAgICBsZXQgcGFyc2VkSW5kZXggPSBwYXJzZUludChpbmRleCk7XG4gICAgICBpZiAocGFyc2VkSW5kZXggIT09IHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sXSkge1xuICAgICAgICAvLyBTdG9yZSB0aGUgbmV3IGluZGV4IGFuZCB0aGUgY29ycmVzcG9uZGluZyBpdGVtLlxuICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuaXRlbXM7XG4gICAgICAgIGNvbnN0IGhhc0l0ZW1zID0gaXRlbXMgJiYgaXRlbXMubGVuZ3RoID4gMDtcbiAgICAgICAgaWYgKCEoaGFzSXRlbXMgJiYgcGFyc2VkSW5kZXggPj0gMCAmJiBwYXJzZWRJbmRleCA8IGl0ZW1zLmxlbmd0aCkpIHtcbiAgICAgICAgICBwYXJzZWRJbmRleCA9IC0xOyAvLyBObyBpdGVtIGF0IHRoYXQgaW5kZXguXG4gICAgICAgIH1cbiAgICAgICAgdGhpc1tleHRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2xdID0gcGFyc2VkSW5kZXg7XG4gICAgICAgIGl0ZW0gPSBoYXNJdGVtcyAmJiBwYXJzZWRJbmRleCA+PSAwID8gaXRlbXNbcGFyc2VkSW5kZXhdIDogbnVsbDtcbiAgICAgICAgdGhpc1tleHRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbF0gPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbSA9IHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2xdO1xuICAgICAgfVxuXG4gICAgICAvLyBOb3cgbGV0IHN1cGVyIGRvIGFueSB3b3JrLlxuICAgICAgaWYgKCdzZWxlY3RlZEluZGV4JyBpbiBiYXNlLnByb3RvdHlwZSkgeyBzdXBlci5zZWxlY3RlZEluZGV4ID0gaW5kZXg7IH1cblxuICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgLy8gVGhlIHNlbGVjdGVkIGluZGV4IGNoYW5nZWQuXG4gICAgICAgIHRoaXNbaW50ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sXSA9IHBhcnNlZEluZGV4O1xuXG4gICAgICAgIGlmICh0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdKSB7XG4gICAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ3NlbGVjdGVkLWluZGV4LWNoYW5nZWQnLCB7XG4gICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgc2VsZWN0ZWRJbmRleDogcGFyc2VkSW5kZXgsXG4gICAgICAgICAgICAgIHZhbHVlOiBwYXJzZWRJbmRleCAvLyBmb3IgUG9seW1lciBiaW5kaW5nLiBUT0RPOiBWZXJpZnkgc3RpbGwgbmVjZXNzYXJ5XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpc1tpbnRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbF0gIT09IGl0ZW0pIHtcbiAgICAgICAgLy8gVXBkYXRlIHNlbGVjdGVkSXRlbSBwcm9wZXJ0eSBzbyBpdCBjYW4gaGF2ZSBpdHMgb3duIGVmZmVjdHMuXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gaXRlbTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0sIG9yIG51bGwgaWYgdGhlcmUgaXMgbm8gc2VsZWN0aW9uLlxuICAgICAqXG4gICAgICogU2V0dGluZyB0aGlzIHByb3BlcnR5IHRvIG51bGwgZGVzZWxlY3RzIGFueSBjdXJyZW50bHktc2VsZWN0ZWQgaXRlbS5cbiAgICAgKiBTZXR0aW5nIHRoaXMgcHJvcGVydHkgdG8gYW4gb2JqZWN0IHRoYXQgaXMgbm90IGluIHRoZSBsaXN0IGhhcyBubyBlZmZlY3QuXG4gICAgICpcbiAgICAgKiBUT0RPOiBFdmVuIGlmIHNlbGVjdGlvblJlcXVpcmVkLCBjYW4gc3RpbGwgZXhwbGljaXRseSBzZXQgc2VsZWN0ZWRJdGVtIHRvIG51bGwuXG4gICAgICogVE9ETzogSWYgc2VsZWN0aW9uUmVxdWlyZWQsIGxlYXZlIHNlbGVjdGlvbiBhbG9uZT9cbiAgICAgKlxuICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICovXG4gICAgZ2V0IHNlbGVjdGVkSXRlbSgpIHtcbiAgICAgIHJldHVybiB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sXSB8fCBudWxsO1xuICAgIH1cbiAgICBzZXQgc2VsZWN0ZWRJdGVtKGl0ZW0pIHtcbiAgICAgIC8vIFNlZSBub3RlcyBhdCB0b3AgYWJvdXQgaW50ZXJuYWwgdnMuIGV4dGVybmFsIGNvcGllcyBvZiB0aGlzIHByb3BlcnR5LlxuICAgICAgY29uc3QgcHJldmlvdXNTZWxlY3RlZEl0ZW0gPSB0aGlzW2ludGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sXTtcbiAgICAgIGNvbnN0IGNoYW5nZWQgPSBpdGVtICE9PSBwcmV2aW91c1NlbGVjdGVkSXRlbTtcbiAgICAgIGxldCBpbmRleDtcbiAgICAgIGlmIChpdGVtICE9PSB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sXSkge1xuICAgICAgICAvLyBTdG9yZSBpdGVtIGFuZCBsb29rIHVwIGNvcnJlc3BvbmRpbmcgaW5kZXguXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5pdGVtcztcbiAgICAgICAgY29uc3QgaGFzSXRlbXMgPSBpdGVtcyAmJiBpdGVtcy5sZW5ndGggPiAwO1xuICAgICAgICBpbmRleCA9IGhhc0l0ZW1zID8gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChpdGVtcywgaXRlbSkgOiAtMTtcbiAgICAgICAgdGhpc1tleHRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2xdID0gaW5kZXg7XG4gICAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgICBpdGVtID0gbnVsbDsgLy8gVGhlIGluZGljYXRlZCBpdGVtIGlzbid0IGFjdHVhbGx5IGluIGBpdGVtc2AuXG4gICAgICAgIH1cbiAgICAgICAgdGhpc1tleHRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbF0gPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5kZXggPSB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbF07XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdyBsZXQgc3VwZXIgZG8gYW55IHdvcmsuXG4gICAgICBpZiAoJ3NlbGVjdGVkSXRlbScgaW4gYmFzZS5wcm90b3R5cGUpIHsgc3VwZXIuc2VsZWN0ZWRJdGVtID0gaXRlbTsgfVxuXG4gICAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICAvLyBUaGUgc2VsZWN0ZWQgaXRlbSBjaGFuZ2VkLlxuICAgICAgICB0aGlzW2ludGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sXSA9IGl0ZW07XG5cbiAgICAgICAgaWYgKHByZXZpb3VzU2VsZWN0ZWRJdGVtKSB7XG4gICAgICAgICAgLy8gVXBkYXRlIHNlbGVjdGlvbiBzdGF0ZSBvZiBvbGQgaXRlbS5cbiAgICAgICAgICB0aGlzW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShwcmV2aW91c1NlbGVjdGVkSXRlbSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgLy8gVXBkYXRlIHNlbGVjdGlvbiBzdGF0ZSB0byBuZXcgaXRlbS5cbiAgICAgICAgICB0aGlzW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZVBvc3NpYmxlTmF2aWdhdGlvbnModGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10pIHtcbiAgICAgICAgICBjb25zdCBldmVudCA9IG5ldyBDdXN0b21FdmVudCgnc2VsZWN0ZWQtaXRlbS1jaGFuZ2VkJywge1xuICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgIHNlbGVjdGVkSXRlbTogaXRlbSxcbiAgICAgICAgICAgICAgdmFsdWU6IGl0ZW0gLy8gZm9yIFBvbHltZXIgYmluZGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXNbaW50ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sXSAhPT0gaW5kZXgpIHtcbiAgICAgICAgLy8gVXBkYXRlIHNlbGVjdGVkSW5kZXggcHJvcGVydHkgc28gaXQgY2FuIGhhdmUgaXRzIG93biBlZmZlY3RzLlxuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBpbmRleDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZWxlY3QgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgc2VsZWN0aW9uIGNoYW5nZWQsIGZhbHNlIGlmIG5vdC5cbiAgICAgKi9cbiAgICBzZWxlY3RGaXJzdCgpIHtcbiAgICAgIGlmIChzdXBlci5zZWxlY3RGaXJzdCkgeyBzdXBlci5zZWxlY3RGaXJzdCgpOyB9XG4gICAgICByZXR1cm4gc2VsZWN0SW5kZXgodGhpcywgMCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJ1ZSBpZiB0aGUgbGlzdCBzaG91bGQgYWx3YXlzIGhhdmUgYSBzZWxlY3Rpb24gKGlmIGl0IGhhcyBpdGVtcykuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgICAqL1xuICAgIGdldCBzZWxlY3Rpb25SZXF1aXJlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzW3NlbGVjdGlvblJlcXVpcmVkU3ltYm9sXTtcbiAgICB9XG4gICAgc2V0IHNlbGVjdGlvblJlcXVpcmVkKHNlbGVjdGlvblJlcXVpcmVkKSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBTdHJpbmcoc2VsZWN0aW9uUmVxdWlyZWQpID09PSAndHJ1ZSc7XG4gICAgICBjb25zdCBjaGFuZ2VkID0gcGFyc2VkICE9PSB0aGlzW3NlbGVjdGlvblJlcXVpcmVkU3ltYm9sXTtcbiAgICAgIHRoaXNbc2VsZWN0aW9uUmVxdWlyZWRTeW1ib2xdID0gcGFyc2VkO1xuICAgICAgaWYgKCdzZWxlY3Rpb25SZXF1aXJlZCcgaW4gYmFzZS5wcm90b3R5cGUpIHsgc3VwZXIuc2VsZWN0aW9uUmVxdWlyZWQgPSBzZWxlY3Rpb25SZXF1aXJlZDsgfVxuICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgaWYgKHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10pIHtcbiAgICAgICAgICBjb25zdCBldmVudCA9IG5ldyBDdXN0b21FdmVudCgnc2VsZWN0aW9uLXJlcXVpcmVkLWNoYW5nZWQnKTtcbiAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3Rpb25SZXF1aXJlZCkge1xuICAgICAgICAgIHRyYWNrU2VsZWN0ZWRJdGVtKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJ1ZSBpZiBzZWxlY3Rpb24gbmF2aWdhdGlvbnMgd3JhcCBmcm9tIGxhc3QgdG8gZmlyc3QsIGFuZCB2aWNlIHZlcnNhLlxuICAgICAqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgKi9cbiAgICBnZXQgc2VsZWN0aW9uV3JhcHMoKSB7XG4gICAgICByZXR1cm4gdGhpc1tzZWxlY3Rpb25XcmFwc1N5bWJvbF07XG4gICAgfVxuICAgIHNldCBzZWxlY3Rpb25XcmFwcyhzZWxlY3Rpb25XcmFwcykge1xuICAgICAgY29uc3QgcGFyc2VkID0gU3RyaW5nKHNlbGVjdGlvbldyYXBzKSA9PT0gJ3RydWUnO1xuICAgICAgY29uc3QgY2hhbmdlZCA9IHBhcnNlZCAhPT0gdGhpc1tzZWxlY3Rpb25XcmFwc1N5bWJvbF07XG4gICAgICB0aGlzW3NlbGVjdGlvbldyYXBzU3ltYm9sXSA9IHBhcnNlZDtcbiAgICAgIGlmICgnc2VsZWN0aW9uV3JhcHMnIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLnNlbGVjdGlvbldyYXBzID0gc2VsZWN0aW9uV3JhcHM7IH1cbiAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgIGlmICh0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdKSB7XG4gICAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ3NlbGVjdGlvbi13cmFwcy1jaGFuZ2VkJyk7XG4gICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVQb3NzaWJsZU5hdmlnYXRpb25zKHRoaXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbGVjdCB0aGUgbGFzdCBpdGVtIGluIHRoZSBsaXN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIHNlbGVjdGlvbiBjaGFuZ2VkLCBmYWxzZSBpZiBub3QuXG4gICAgICovXG4gICAgc2VsZWN0TGFzdCgpIHtcbiAgICAgIGlmIChzdXBlci5zZWxlY3RMYXN0KSB7IHN1cGVyLnNlbGVjdExhc3QoKTsgfVxuICAgICAgcmV0dXJuIHNlbGVjdEluZGV4KHRoaXMsIHRoaXMuaXRlbXMubGVuZ3RoIC0gMSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VsZWN0IHRoZSBuZXh0IGl0ZW0gaW4gdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBJZiB0aGUgbGlzdCBoYXMgbm8gc2VsZWN0aW9uLCB0aGUgZmlyc3QgaXRlbSB3aWxsIGJlIHNlbGVjdGVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIHNlbGVjdGlvbiBjaGFuZ2VkLCBmYWxzZSBpZiBub3QuXG4gICAgICovXG4gICAgc2VsZWN0TmV4dCgpIHtcbiAgICAgIGlmIChzdXBlci5zZWxlY3ROZXh0KSB7IHN1cGVyLnNlbGVjdE5leHQoKTsgfVxuICAgICAgcmV0dXJuIHNlbGVjdEluZGV4KHRoaXMsIHRoaXMuc2VsZWN0ZWRJbmRleCArIDEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbGVjdCB0aGUgcHJldmlvdXMgaXRlbSBpbiB0aGUgbGlzdC5cbiAgICAgKlxuICAgICAqIElmIHRoZSBsaXN0IGhhcyBubyBzZWxlY3Rpb24sIHRoZSBsYXN0IGl0ZW0gd2lsbCBiZSBzZWxlY3RlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSBzZWxlY3Rpb24gY2hhbmdlZCwgZmFsc2UgaWYgbm90LlxuICAgICAqL1xuICAgIHNlbGVjdFByZXZpb3VzKCkge1xuICAgICAgaWYgKHN1cGVyLnNlbGVjdFByZXZpb3VzKSB7IHN1cGVyLnNlbGVjdFByZXZpb3VzKCk7IH1cbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gdGhpcy5zZWxlY3RlZEluZGV4IDwgMCA/XG4gICAgICAgIHRoaXMuaXRlbXMubGVuZ3RoIC0gMSA6ICAgICAvLyBObyBzZWxlY3Rpb24geWV0OyBzZWxlY3QgbGFzdCBpdGVtLlxuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggLSAxO1xuICAgICAgcmV0dXJuIHNlbGVjdEluZGV4KHRoaXMsIG5ld0luZGV4KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBjYW5TZWxlY3ROZXh0IHByb3BlcnR5IGNoYW5nZXMgaW4gcmVzcG9uc2UgdG8gaW50ZXJuYWxcbiAgICAgKiBjb21wb25lbnQgYWN0aXZpdHkuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgU2luZ2xlU2VsZWN0aW9uXG4gICAgICogQGV2ZW50IGNhbi1zZWxlY3QtbmV4dC1jaGFuZ2VkXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBjYW5TZWxlY3RQcmV2aW91cyBwcm9wZXJ0eSBjaGFuZ2VzIGluIHJlc3BvbnNlIHRvIGludGVybmFsXG4gICAgICogY29tcG9uZW50IGFjdGl2aXR5LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIFNpbmdsZVNlbGVjdGlvblxuICAgICAqIEBldmVudCBjYW4tc2VsZWN0LXByZXZpb3VzLWNoYW5nZWRcbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHNlbGVjdGVkSW5kZXggcHJvcGVydHkgY2hhbmdlcyBpbiByZXNwb25zZSB0byBpbnRlcm5hbFxuICAgICAqIGNvbXBvbmVudCBhY3Rpdml0eS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBTaW5nbGVTZWxlY3Rpb25cbiAgICAgKiBAZXZlbnQgc2VsZWN0ZWQtaW5kZXgtY2hhbmdlZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZXRhaWwuc2VsZWN0ZWRJbmRleCBUaGUgbmV3IHNlbGVjdGVkIGluZGV4LlxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgc2VsZWN0ZWRJdGVtIHByb3BlcnR5IGNoYW5nZXMgaW4gcmVzcG9uc2UgdG8gaW50ZXJuYWxcbiAgICAgKiBjb21wb25lbnQgYWN0aXZpdHkuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgU2luZ2xlU2VsZWN0aW9uXG4gICAgICogQGV2ZW50IHNlbGVjdGVkLWl0ZW0tY2hhbmdlZFxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGRldGFpbC5zZWxlY3RlZEl0ZW0gVGhlIG5ldyBzZWxlY3RlZCBpdGVtLlxuICAgICAqL1xuXG4gIH1cblxuICByZXR1cm4gU2luZ2xlU2VsZWN0aW9uO1xufVxuXG5cbi8vIEVuc3VyZSB0aGUgZ2l2ZW4gaW5kZXggaXMgd2l0aGluIGJvdW5kcywgYW5kIHNlbGVjdCBpdCBpZiBpdCdzIG5vdCBhbHJlYWR5XG4vLyBzZWxlY3RlZC5cbmZ1bmN0aW9uIHNlbGVjdEluZGV4KGVsZW1lbnQsIGluZGV4KSB7XG5cbiAgY29uc3QgaXRlbXMgPSBlbGVtZW50Lml0ZW1zO1xuICBpZiAoaXRlbXMgPT0gbnVsbCkge1xuICAgIC8vIE5vdGhpbmcgdG8gc2VsZWN0LlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGNvdW50ID0gaXRlbXMubGVuZ3RoO1xuICBjb25zdCBib3VuZGVkSW5kZXggPSBlbGVtZW50LnNlbGVjdGlvbldyYXBzID9cbiAgICAvLyBKYXZhU2NyaXB0IG1vZCBkb2Vzbid0IGhhbmRsZSBuZWdhdGl2ZSBudW1iZXJzIHRoZSB3YXkgd2Ugd2FudCB0byB3cmFwLlxuICAgIC8vIFNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xODYxODI1MC83NjQ3MlxuICAgICgoaW5kZXggJSBjb3VudCkgKyBjb3VudCkgJSBjb3VudCA6XG5cbiAgICAvLyBLZWVwIGluZGV4IHdpdGhpbiBib3VuZHMgb2YgYXJyYXkuXG4gICAgTWF0aC5tYXgoTWF0aC5taW4oaW5kZXgsIGNvdW50IC0gMSksIDApO1xuXG4gIGNvbnN0IHByZXZpb3VzSW5kZXggPSBlbGVtZW50LnNlbGVjdGVkSW5kZXg7XG4gIGlmIChwcmV2aW91c0luZGV4ICE9PSBib3VuZGVkSW5kZXgpIHtcbiAgICBlbGVtZW50LnNlbGVjdGVkSW5kZXggPSBib3VuZGVkSW5kZXg7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIEZvbGxvd2luZyBhIGNoYW5nZSBpbiB0aGUgc2V0IG9mIGl0ZW1zLCBvciBpbiB0aGUgdmFsdWUgb2YgdGhlXG4vLyBgc2VsZWN0aW9uUmVxdWlyZWRgIHByb3BlcnR5LCByZWFjcXVpcmUgdGhlIHNlbGVjdGVkIGl0ZW0uIElmIGl0J3MgbW92ZWQsXG4vLyB1cGRhdGUgYHNlbGVjdGVkSW5kZXhgLiBJZiBpdCdzIGJlZW4gcmVtb3ZlZCwgYW5kIGEgc2VsZWN0aW9uIGlzIHJlcXVpcmVkLFxuLy8gdHJ5IHRvIHNlbGVjdCBhbm90aGVyIGl0ZW0uXG5mdW5jdGlvbiB0cmFja1NlbGVjdGVkSXRlbShlbGVtZW50KSB7XG5cbiAgY29uc3QgaXRlbXMgPSBlbGVtZW50Lml0ZW1zO1xuICBjb25zdCBpdGVtQ291bnQgPSBpdGVtcyA/IGl0ZW1zLmxlbmd0aCA6IDA7XG5cbiAgY29uc3QgcHJldmlvdXNTZWxlY3RlZEl0ZW0gPSBlbGVtZW50LnNlbGVjdGVkSXRlbTtcbiAgaWYgKCFwcmV2aW91c1NlbGVjdGVkSXRlbSkge1xuICAgIC8vIE5vIGl0ZW0gd2FzIHByZXZpb3VzbHkgc2VsZWN0ZWQuXG4gICAgaWYgKGVsZW1lbnQuc2VsZWN0aW9uUmVxdWlyZWQpIHtcbiAgICAgIC8vIFNlbGVjdCB0aGUgZmlyc3QgaXRlbSBieSBkZWZhdWx0LlxuICAgICAgZWxlbWVudC5zZWxlY3RlZEluZGV4ID0gMDtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXRlbUNvdW50ID09PSAwKSB7XG4gICAgLy8gV2UndmUgbG9zdCB0aGUgc2VsZWN0aW9uLCBhbmQgdGhlcmUncyBub3RoaW5nIGxlZnQgdG8gc2VsZWN0LlxuICAgIGVsZW1lbnQuc2VsZWN0ZWRJdGVtID0gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICAvLyBUcnkgdG8gZmluZCB0aGUgcHJldmlvdXNseS1zZWxlY3RlZCBpdGVtIGluIHRoZSBjdXJyZW50IHNldCBvZiBpdGVtcy5cbiAgICBjb25zdCBpbmRleEluQ3VycmVudEl0ZW1zID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChpdGVtcywgcHJldmlvdXNTZWxlY3RlZEl0ZW0pO1xuICAgIGNvbnN0IHByZXZpb3VzU2VsZWN0ZWRJbmRleCA9IGVsZW1lbnQuc2VsZWN0ZWRJbmRleDtcbiAgICBpZiAoaW5kZXhJbkN1cnJlbnRJdGVtcyA8IDApIHtcbiAgICAgIC8vIFByZXZpb3VzbHktc2VsZWN0ZWQgaXRlbSB3YXMgcmVtb3ZlZCBmcm9tIHRoZSBpdGVtcy5cbiAgICAgIC8vIFNlbGVjdCB0aGUgaXRlbSBhdCB0aGUgc2FtZSBpbmRleCAoaWYgaXQgZXhpc3RzKSBvciBhcyBjbG9zZSBhcyBwb3NzaWJsZS5cbiAgICAgIGNvbnN0IG5ld1NlbGVjdGVkSW5kZXggPSBNYXRoLm1pbihwcmV2aW91c1NlbGVjdGVkSW5kZXgsIGl0ZW1Db3VudCAtIDEpO1xuICAgICAgLy8gU2VsZWN0IGJ5IGl0ZW0sIHNpbmNlIGluZGV4IG1heSBiZSB0aGUgc2FtZSwgYW5kIHdlIHdhbnQgdG8gcmFpc2UgdGhlXG4gICAgICAvLyBzZWxlY3RlZC1pdGVtLWNoYW5nZWQgZXZlbnQuXG4gICAgICBlbGVtZW50LnNlbGVjdGVkSXRlbSA9IGl0ZW1zW25ld1NlbGVjdGVkSW5kZXhdO1xuICAgIH0gZWxzZSBpZiAoaW5kZXhJbkN1cnJlbnRJdGVtcyAhPT0gcHJldmlvdXNTZWxlY3RlZEluZGV4KSB7XG4gICAgICAvLyBQcmV2aW91c2x5LXNlbGVjdGVkIGl0ZW0gc3RpbGwgdGhlcmUsIGJ1dCBjaGFuZ2VkIHBvc2l0aW9uLlxuICAgICAgZWxlbWVudC5zZWxlY3RlZEluZGV4ID0gaW5kZXhJbkN1cnJlbnRJdGVtcztcbiAgICB9XG4gIH1cbn1cblxuLy8gRm9sbG93aW5nIGEgY2hhbmdlIGluIHNlbGVjdGlvbiwgcmVwb3J0IHdoZXRoZXIgaXQncyBub3cgcG9zc2libGUgdG9cbi8vIGdvIG5leHQvcHJldmlvdXMgZnJvbSB0aGUgZ2l2ZW4gaW5kZXguXG5mdW5jdGlvbiB1cGRhdGVQb3NzaWJsZU5hdmlnYXRpb25zKGVsZW1lbnQpIHtcbiAgbGV0IGNhblNlbGVjdE5leHQ7XG4gIGxldCBjYW5TZWxlY3RQcmV2aW91cztcbiAgY29uc3QgaXRlbXMgPSBlbGVtZW50Lml0ZW1zO1xuICBpZiAoaXRlbXMgPT0gbnVsbCB8fCBpdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAvLyBObyBpdGVtcyB0byBzZWxlY3QuXG4gICAgY2FuU2VsZWN0TmV4dCA9IGZhbHNlO1xuICAgIGNhblNlbGVjdFByZXZpb3VzID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC5zZWxlY3Rpb25XcmFwcykge1xuICAgIC8vIFNpbmNlIHRoZXJlIGFyZSBpdGVtcywgY2FuIGFsd2F5cyBnbyBuZXh0L3ByZXZpb3VzLlxuICAgIGNhblNlbGVjdE5leHQgPSB0cnVlO1xuICAgIGNhblNlbGVjdFByZXZpb3VzID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBpbmRleCA9IGVsZW1lbnQuc2VsZWN0ZWRJbmRleDtcbiAgICBpZiAoaW5kZXggPCAwICYmIGl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIFNwZWNpYWwgY2FzZS4gSWYgdGhlcmUgYXJlIGl0ZW1zIGJ1dCBubyBzZWxlY3Rpb24sIGRlY2xhcmUgdGhhdCBpdCdzXG4gICAgICAvLyBhbHdheXMgcG9zc2libGUgdG8gZ28gbmV4dC9wcmV2aW91cyB0byBjcmVhdGUgYSBzZWxlY3Rpb24uXG4gICAgICBjYW5TZWxlY3ROZXh0ID0gdHJ1ZTtcbiAgICAgIGNhblNlbGVjdFByZXZpb3VzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTm9ybWFsIGNhc2U6IHdlIGhhdmUgYW4gaW5kZXggaW4gYSBsaXN0IHRoYXQgaGFzIGl0ZW1zLlxuICAgICAgY2FuU2VsZWN0UHJldmlvdXMgPSAoaW5kZXggPiAwKTtcbiAgICAgIGNhblNlbGVjdE5leHQgPSAoaW5kZXggPCBpdGVtcy5sZW5ndGggLSAxKTtcbiAgICB9XG4gIH1cbiAgaWYgKGVsZW1lbnQuY2FuU2VsZWN0TmV4dCAhPT0gY2FuU2VsZWN0TmV4dCkge1xuICAgIGVsZW1lbnQuY2FuU2VsZWN0TmV4dCA9IGNhblNlbGVjdE5leHQ7XG4gIH1cbiAgaWYgKGVsZW1lbnQuY2FuU2VsZWN0UHJldmlvdXMgIT09IGNhblNlbGVjdFByZXZpb3VzKSB7XG4gICAgZWxlbWVudC5jYW5TZWxlY3RQcmV2aW91cyA9IGNhblNlbGVjdFByZXZpb3VzO1xuICB9XG59XG4iLCIvKiBUaGUgbnVtYmVyIG9mIGZha2Ugc3ltYm9scyB3ZSd2ZSBzZXJ2ZWQgdXAgKi9cbmxldCBjb3VudCA9IDA7XG5cbmZ1bmN0aW9uIHVuaXF1ZVN0cmluZyhkZXNjcmlwdGlvbikge1xuICByZXR1cm4gYF8ke2Rlc2NyaXB0aW9ufSR7Y291bnQrK31gO1xufVxuXG5jb25zdCBzeW1ib2xGdW5jdGlvbiA9IHR5cGVvZiB3aW5kb3cuU3ltYm9sID09PSAnZnVuY3Rpb24nID9cbiAgd2luZG93LlN5bWJvbCA6XG4gIHVuaXF1ZVN0cmluZztcblxuLyoqXG4gKiBQb2x5ZmlsbCBmb3IgRVM2IHN5bWJvbCBjbGFzcy5cbiAqXG4gKiBNaXhpbnMgYW5kIGNvbXBvbmVudCBjbGFzc2VzIG9mdGVuIHdhbnQgdG8gYXNzb2NpYXRlIHByaXZhdGUgZGF0YSB3aXRoIGFuXG4gKiBlbGVtZW50IGluc3RhbmNlLCBidXQgSmF2YVNjcmlwdCBkb2VzIG5vdCBoYXZlIGRpcmVjdCBzdXBwb3J0IGZvciB0cnVlXG4gKiBwcml2YXRlIHByb3BlcnRpZXMuIE9uZSBhcHByb2FjaCBpcyB0byB1c2UgdGhlXG4gKiBbU3ltYm9sXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TeW1ib2wpXG4gKiBkYXRhIHR5cGUgdG8gc2V0IGFuZCByZXRyaWV2ZSBkYXRhIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVW5mb3J0dW5hdGVseSwgdGhlIFN5bWJvbCB0eXBlIGlzIG5vdCBhdmFpbGFibGUgaW4gSW50ZXJuZXQgRXhwbG9yZXIgMTEuIEluXG4gKiBsaWV1IG9mIHJldHVybmluZyBhIHRydWUgU3ltYm9sLCB0aGlzIHBvbHlmaWxsIHJldHVybnMgYSBkaWZmZXJlbnQgc3RyaW5nXG4gKiBlYWNoIHRpbWUgaXQgaXMgY2FsbGVkLlxuICpcbiAqIFVzYWdlOlxuICpcbiAqICAgICBjb25zdCBmb29TeW1ib2wgPSBTeW1ib2woJ2ZvbycpO1xuICpcbiAqICAgICBjbGFzcyBNeUVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gKiAgICAgICBnZXQgZm9vKCkge1xuICogICAgICAgICByZXR1cm4gdGhpc1tmb29TeW1ib2xdO1xuICogICAgICAgfVxuICogICAgICAgc2V0IGZvbyh2YWx1ZSkge1xuICogICAgICAgICB0aGlzW2Zvb1N5bWJvbF0gPSB2YWx1ZTtcbiAqICAgICAgIH1cbiAqICAgICB9XG4gKlxuICogSW4gSUUgMTEsIHRoaXMgc2FtcGxlIHdpbGwgXCJoaWRlXCIgZGF0YSBiZWhpbmQgYW4gaW5zdGFuY2UgcHJvcGVydHkgdGhhdCBsb29rc1xuICogbGlrZSB0aGlzLl9mb28wLiBUaGUgdW5kZXJzY29yZSBpcyBtZWFudCB0byByZWR1Y2UgKG5vdCBlbGltaW5hdGUpIHBvdGVudGlhbFxuICogYWNjaWRlbnRhbCBhY2Nlc3MsIGFuZCB0aGUgdW5pcXVlIG51bWJlciBhdCB0aGUgZW5kIGlzIG1lYW4gdG8gYXZvaWQgKG5vdFxuICogZWxpbWluYXRlKSBuYW1pbmcgY29uZmxpY3RzLlxuICpcbiAqIEBmdW5jdGlvbiBTeW1ib2xcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZXNjcmlwdGlvbiAtIEEgc3RyaW5nIHRvIGlkZW50aWZ5IHRoZSBzeW1ib2wgd2hlbiBkZWJ1Z2dpbmdcbiAqIEByZXR1cm5zIHtTeW1ib2x8c3RyaW5nfSDigJQgQSBTeW1ib2wgKGluIEVTNiBicm93c2Vycykgb3IgdW5pcXVlIHN0cmluZyBJRCAoaW5cbiAqIEVTNSkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHN5bWJvbEZ1bmN0aW9uO1xuIiwiLyoqXG4gKiBBIGNvbGxlY3Rpb24gb2YgY29uc3RhbnRzIHVzZWQgYnkgRWxpeCBtaXhpbnMgYW5kIGNvbXBvbmVudHMgZm9yIGNvbnNpc3RlbmN5XG4gKiBpbiB0aGluZ3Mgc3VjaCBhcyB1c2VyIGludGVyZmFjZSB0aW1pbmdzLlxuICpcbiAqIEBtb2R1bGUgY29uc3RhbnRzXG4gKi9cbmNvbnN0IGNvbnN0YW50cyA9IHtcblxuICAvKipcbiAgICogVGltZSBpbiBtaWxsaXNlY29uZHMgYWZ0ZXIgd2hpY2ggdGhlIHVzZXIgaXMgY29uc2lkZXJlZCB0byBoYXZlIHN0b3BwZWRcbiAgICogdHlwaW5nLlxuICAgKlxuICAgKiBAY29uc3Qge251bWJlcn0gVFlQSU5HX1RJTUVPVVRfRFVSQVRJT05cbiAgICovXG4gIFRZUElOR19USU1FT1VUX0RVUkFUSU9OOiAxMDAwXG5cbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgY29uc3RhbnRzO1xuIiwiLyoqXG4gKiBIZWxwZXJzIGZvciBhY2Nlc3NpbmcgYSBjb21wb25lbnQncyBjb250ZW50LlxuICpcbiAqIFRoZSBzdGFuZGFyZCBET00gQVBJIHByb3ZpZGVzIHNldmVyYWwgd2F5cyBvZiBhY2Nlc3NpbmcgY2hpbGQgY29udGVudDpcbiAqIGBjaGlsZHJlbmAsIGBjaGlsZE5vZGVzYCwgYW5kIGB0ZXh0Q29udGVudGAuIE5vbmUgb2YgdGhlc2UgZnVuY3Rpb25zIGFyZVxuICogU2hhZG93IERPTSBhd2FyZS4gVGhpcyBtaXhpbiBkZWZpbmVzIHZhcmlhdGlvbnMgb2YgdGhvc2UgZnVuY3Rpb25zIHRoYXRcbiAqICphcmUqIFNoYWRvdyBET00gYXdhcmUuXG4gKlxuICogRXhhbXBsZTogeW91IGNyZWF0ZSBhIGNvbXBvbmVudCBgPGNvdW50LWNoaWxkcmVuPmAgdGhhdCBkaXNwbGF5cyBhIG51bWJlclxuICogZXF1YWwgdG8gdGhlIG51bWJlciBvZiBjaGlsZHJlbiBwbGFjZWQgaW5zaWRlIHRoYXQgY29tcG9uZW50LiBJZiBzb21lb25lXG4gKiBpbnN0YW50aWF0ZXMgeW91ciBjb21wb25lbnQgbGlrZTpcbiAqXG4gKiAgICAgPGNvdW50LWNoaWxkcmVuPlxuICogICAgICAgPGRpdj48L2Rpdj5cbiAqICAgICAgIDxkaXY+PC9kaXY+XG4gKiAgICAgICA8ZGl2PjwvZGl2PlxuICogICAgIDwvY291bnQtY2hpbGRyZW4+XG4gKlxuICogVGhlbiB0aGUgY29tcG9uZW50IHNob3VsZCBzaG93IFwiM1wiLCBiZWNhdXNlIHRoZXJlIGFyZSB0aHJlZSBjaGlsZHJlbi4gVG9cbiAqIGNhbGN1bGF0ZSB0aGUgbnVtYmVyIG9mIGNoaWxkcmVuLCB0aGUgY29tcG9uZW50IGNhbiBqdXN0IGNhbGN1bGF0ZVxuICogYHRoaXMuY2hpbGRyZW4ubGVuZ3RoYC4gSG93ZXZlciwgc3VwcG9zZSBzb21lb25lIGluc3RhbnRpYXRlcyB5b3VyXG4gKiBjb21wb25lbnQgaW5zaWRlIG9uZSBvZiB0aGVpciBvd24gY29tcG9uZW50cywgYW5kIHB1dHMgYSBgPHNsb3Q+YCBlbGVtZW50XG4gKiBpbnNpZGUgeW91ciBjb21wb25lbnQ6XG4gKlxuICogICAgIDxjb3VudC1jaGlsZHJlbj5cbiAqICAgICAgIDxzbG90Pjwvc2xvdD5cbiAqICAgICA8L2NvdW50LWNoaWxkcmVuPlxuICpcbiAqIElmIHlvdXIgY29tcG9uZW50IG9ubHkgbG9va3MgYXQgYHRoaXMuY2hpbGRyZW5gLCBpdCB3aWxsIGFsd2F5cyBzZWUgZXhhY3RseVxuICogb25lIGNoaWxkIOKAlMKgdGhlIGA8c2xvdD5gIGVsZW1lbnQuIEJ1dCB0aGUgdXNlciBsb29raW5nIGF0IHRoZSBwYWdlIHdpbGxcbiAqICpzZWUqIGFueSBub2RlcyBkaXN0cmlidXRlZCB0byB0aGF0IHNsb3QuIFRvIG1hdGNoIHdoYXQgdGhlIHVzZXIgc2VlcywgeW91clxuICogY29tcG9uZW50IHNob3VsZCBleHBhbmQgYW55IGA8c2xvdD5gIGVsZW1lbnRzIGl0IGNvbnRhaW5zLlxuICpcbiAqIFRoYXQgaXMgb25lIHByb2JsZW0gdGhlc2UgaGVscGVycyBzb2x2ZS4gRm9yIGV4YW1wbGUsIHRoZSBoZWxwZXJcbiAqIGBhc3NpZ25lZENoaWxkcmVuYCB3aWxsIHJldHVybiBhbGwgY2hpbGRyZW4gYXNzaWduZWQgdG8geW91ciBjb21wb25lbnQgaW5cbiAqIHRoZSBjb21wb3NlZCB0cmVlLlxuICpcbiAqIEBtb2R1bGUgY29udGVudFxuICovXG5cbi8qKlxuICogQW4gaW4tb3JkZXIgY29sbGVjdGlvbiBvZiBkaXN0cmlidXRlZCBjaGlsZHJlbiwgZXhwYW5kaW5nIGFueSBzbG90XG4gKiBlbGVtZW50cy4gTGlrZSB0aGUgc3RhbmRhcmQgYGNoaWxkcmVuYCBwcm9wZXJ0eSwgdGhpcyBza2lwcyB0ZXh0IGFuZCBvdGhlclxuICogbm9kZSB0eXBlcyB3aGljaCBhcmUgbm90IEVsZW1lbnQgaW5zdGFuY2VzLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgZWxlbWVudCB0byBpbnNwZWN0XG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfSAtIHRoZSBjaGlsZHJlbiBhc3NpZ25lZCB0byB0aGUgZWxlbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduZWRDaGlsZHJlbihlbGVtZW50KSB7XG4gIHJldHVybiBleHBhbmRBc3NpZ25lZE5vZGVzKGVsZW1lbnQuY2hpbGRyZW4sIHRydWUpO1xufVxuXG4vKipcbiAqIEFuIGluLW9yZGVyIGNvbGxlY3Rpb24gb2YgZGlzdHJpYnV0ZWQgY2hpbGQgbm9kZXMsIGV4cGFuZGluZyBhbnkgc2xvdFxuICogZWxlbWVudHMuIExpa2UgdGhlIHN0YW5kYXJkIGBjaGlsZE5vZGVzYCBwcm9wZXJ0eSwgdGhpcyBpbmNsdWRlcyB0ZXh0IGFuZFxuICogb3RoZXIgdHlwZXMgb2Ygbm9kZXMuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBlbGVtZW50IHRvIGluc3BlY3RcbiAqIEByZXR1cm5zIHtOb2RlW119IC0gdGhlIG5vZGVzIGFzc2lnbmVkIHRvIHRoZSBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ25lZENoaWxkTm9kZXMoZWxlbWVudCkge1xuICByZXR1cm4gZXhwYW5kQXNzaWduZWROb2RlcyhlbGVtZW50LmNoaWxkTm9kZXMsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBUaGUgY29uY2F0ZW5hdGVkIGB0ZXh0Q29udGVudGAgb2YgYWxsIGRpc3RyaWJ1dGVkIGNoaWxkIG5vZGVzLCBleHBhbmRpbmdcbiAqIGFueSBzbG90IGVsZW1lbnRzLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgZWxlbWVudCB0byBpbnNwZWN0XG4gKiBAdHlwZSB7c3RyaW5nfSAtIHRoZSB0ZXh0IGNvbnRlbnQgb2YgYWxsIG5vZGVzIGFzc2lnbmVkIHRvIHRoZSBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ25lZFRleHRDb250ZW50KGVsZW1lbnQpIHtcbiAgY29uc3Qgc3RyaW5ncyA9IGFzc2lnbmVkQ2hpbGROb2RlcyhlbGVtZW50KS5tYXAoXG4gICAgY2hpbGQgPT4gY2hpbGQudGV4dENvbnRlbnRcbiAgKTtcbiAgcmV0dXJuIHN0cmluZ3Muam9pbignJyk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBnaXZlbiBlbGVtZW50cywgZmlsdGVyaW5nIG91dCBhdXhpbGlhcnkgZWxlbWVudHMgdGhhdCBhcmVuJ3RcbiAqIHR5cGljYWxseSB2aXNpYmxlLiBHaXZlbiBhIGBOb2RlTGlzdGAgb3IgYXJyYXkgb2Ygb2JqZWN0cywgaXQgd2lsbCBvbmx5XG4gKiByZXR1cm4gYXJyYXkgbWVtYmVycyB0aGF0IGFyZSBpbnN0YW5jZXMgb2YgYEVsZW1lbnRgIChgSFRNTEVsZW1lbnRgIG9yXG4gKiBgU1ZHRWxlbWVudGApLCBhbmQgbm90IG9uIGEgYmxhY2tsaXN0IG9mIG5vcm1hbGx5IGludmlzaWJsZSBlbGVtZW50c1xuICogKHN1Y2ggYXMgYHN0eWxlYCBvciBgc2NyaXB0YCkuXG4gKlxuICogQHBhcmFtIHtOb2RlTGlzdHxFbGVtZW50W119IGVsZW1lbnRzIC0gdGhlIGxpc3Qgb2YgZWxlbWVudHMgdG8gZmlsdGVyXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfSAtIHRoZSBmaWx0ZXJlZCBlbGVtZW50c1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyQXV4aWxpYXJ5RWxlbWVudHMoZWxlbWVudHMpIHtcblxuICAvLyBUaGVzZSBhcmUgdGFncyB0aGF0IGNhbiBhcHBlYXIgaW4gdGhlIGRvY3VtZW50IGJvZHksIGJ1dCBkbyBub3Qgc2VlbSB0b1xuICAvLyBoYXZlIGFueSB1c2VyLXZpc2libGUgbWFuaWZlc3RhdGlvbi5cbiAgLy8gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvRWxlbWVudFxuICBjb25zdCBhdXhpbGlhcnlUYWdzID0gW1xuICAgICdhcHBsZXQnLCAgICAgICAgIC8vIGRlcHJlY2F0ZWRcbiAgICAnYmFzZWZvbnQnLCAgICAgICAvLyBkZXByZWNhdGVkXG4gICAgJ2VtYmVkJyxcbiAgICAnZm9udCcsICAgICAgICAgICAvLyBkZXByZWNhdGVkXG4gICAgJ2ZyYW1lJywgICAgICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICdmcmFtZXNldCcsICAgICAgIC8vIGRlcHJlY2F0ZWRcbiAgICAnaXNpbmRleCcsICAgICAgICAvLyBkZXByZWNhdGVkXG4gICAgJ2tleWdlbicsICAgICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICdsaW5rJyxcbiAgICAnbXVsdGljb2wnLCAgICAgICAvLyBkZXByZWNhdGVkXG4gICAgJ25leHRpZCcsICAgICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICdub3NjcmlwdCcsXG4gICAgJ29iamVjdCcsXG4gICAgJ3BhcmFtJyxcbiAgICAnc2NyaXB0JyxcbiAgICAnc3R5bGUnLFxuICAgICd0ZW1wbGF0ZScsXG4gICAgJ25vZW1iZWQnICAgICAgICAgLy8gZGVwcmVjYXRlZFxuICBdO1xuXG4gIHJldHVybiBbXS5maWx0ZXIuY2FsbChlbGVtZW50cyxcbiAgICBlbGVtZW50ID0+IGVsZW1lbnQgaW5zdGFuY2VvZiBFbGVtZW50ICYmXG4gICAgICAgICghZWxlbWVudC5sb2NhbE5hbWUgfHwgYXV4aWxpYXJ5VGFncy5pbmRleE9mKGVsZW1lbnQubG9jYWxOYW1lKSA8IDApXG4gICk7XG59XG5cbi8vXG4vLyBIZWxwZXJzIGZvciB0aGUgaGVscGVyIGZ1bmN0aW9uc1xuLy9cblxuLypcbiAqIEdpdmVuIGEgYXJyYXkgb2Ygbm9kZXMsIHJldHVybiBhIG5ldyBhcnJheSB3aXRoIGFueSBgc2xvdGAgZWxlbWVudHMgZXhwYW5kZWRcbiAqIHRvIHRoZSBub2RlcyBhc3NpZ25lZCB0byB0aG9zZSBzbG90cy5cbiAqXG4gKiBJZiBFbGVtZW50c09ubHkgaXMgdHJ1ZSwgb25seSBFbGVtZW50IGluc3RhbmNlcyBhcmUgcmV0dXJuZWQsIGFzIHdpdGggdGhlXG4gKiBzdGFuZGFyZCBgY2hpbGRyZW5gIHByb3BlcnR5LiBPdGhlcndpc2UsIGFsbCBub2RlcyBhcmUgcmV0dXJuZWQsIGFzIGluIHRoZVxuICogc3RhbmRhcmQgYGNoaWxkTm9kZXNgIHByb3BlcnR5LlxuICovXG5mdW5jdGlvbiBleHBhbmRBc3NpZ25lZE5vZGVzKG5vZGVzLCBFbGVtZW50c09ubHkpIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwobm9kZXMsIG5vZGUgPT4ge1xuXG4gICAgLy8gV2Ugd2FudCB0byBzZWUgaWYgdGhlIG5vZGUgaXMgYW4gaW5zdGFuY2VvZiBIVE1MU2xvdEVMZW1lbnQsIGJ1dFxuICAgIC8vIHRoYXQgY2xhc3Mgd29uJ3QgZXhpc3QgaWYgdGhlIGJyb3dzZXIgdGhhdCBkb2Vzbid0IHN1cHBvcnQgbmF0aXZlXG4gICAgLy8gU2hhZG93IERPTSBhbmQgaWYgdGhlIFNoYWRvdyBET00gcG9seWZpbGwgaGFzbid0IGJlZW4gbG9hZGVkLiBJbnN0ZWFkLFxuICAgIC8vIHdlIGRvIGEgc2ltcGxpc3RpYyBjaGVjayB0byBzZWUgaWYgdGhlIHRhZyBuYW1lIGlzIFwic2xvdFwiLlxuICAgIGNvbnN0IGlzU2xvdCA9IHR5cGVvZiBIVE1MU2xvdEVsZW1lbnQgIT09ICd1bmRlZmluZWQnID9cbiAgICAgIG5vZGUgaW5zdGFuY2VvZiBIVE1MU2xvdEVsZW1lbnQgOlxuICAgICAgbm9kZS5sb2NhbE5hbWUgPT09ICdzbG90JztcblxuICAgIHJldHVybiBpc1Nsb3QgP1xuICAgICAgbm9kZS5hc3NpZ25lZE5vZGVzKHsgZmxhdHRlbjogdHJ1ZSB9KSA6XG4gICAgICBbbm9kZV07XG4gIH0pO1xuICBjb25zdCBmbGF0dGVuZWQgPSBbXS5jb25jYXQoLi4uZXhwYW5kZWQpO1xuICBjb25zdCByZXN1bHQgPSBFbGVtZW50c09ubHkgP1xuICAgIGZsYXR0ZW5lZC5maWx0ZXIobm9kZSA9PiBub2RlIGluc3RhbmNlb2YgRWxlbWVudCkgOlxuICAgIGZsYXR0ZW5lZDtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiIsIi8qKlxuICogUmV0dXJuIGEgZ3Vlc3MgYXMgdG8gd2hhdCBwb3J0aW9uIG9mIHRoZSBnaXZlbiBlbGVtZW50IGNhbiBiZSBzY3JvbGxlZC5cbiAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gcHJvdmlkZSBhIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2ZcbiAqIFtzeW1ib2xzLnNjcm9sbFRhcmdldF0uXG4gKlxuICogSWYgdGhlIGVsZW1lbnQgaGFzIGEgc2hhZG93IHJvb3QgY29udGFpbmluZyBhIGRlZmF1bHQgKHVubmFtZWQpIHNsb3QsIHRoaXNcbiAqIHJldHVybnMgdGhlIGZpcnN0IGFuY2VzdG9yIG9mIHRoYXQgc2xvdCB0aGF0IGlzIHN0eWxlZCB3aXRoIGBvdmVyZmxvdy15OlxuICogYXV0b2Agb3IgYG92ZXJmbG93LXk6IHNjcm9sbGAuIElmIHRoZSBlbGVtZW50IGhhcyBubyBkZWZhdWx0IHNsb3QsIG9yIG5vXG4gKiBzY3JvbGxpbmcgYW5jZXN0b3IgaXMgZm91bmQsIHRoZSBlbGVtZW50IGl0c2VsZiBpcyByZXR1cm5lZC5cbiAqXG4gKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRlZmF1bHRTY3JvbGxUYXJnZXQoZWxlbWVudCkge1xuICBjb25zdCBzbG90ID0gZWxlbWVudC5zaGFkb3dSb290ICYmIGVsZW1lbnQuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCdzbG90Om5vdChbbmFtZV0pJyk7XG4gIHJldHVybiBzbG90ID9cbiAgICBnZXRTY3JvbGxpbmdQYXJlbnQoc2xvdCwgZWxlbWVudCkgOlxuICAgIGVsZW1lbnQ7XG59XG5cblxuLy8gUmV0dXJuIHRoZSBwYXJlbnQgb2YgdGhlIGdpdmVuIGVsZW1lbnQgdGhhdCBjYW4gYmUgc2Nyb2xsIHZlcnRpY2FsbHkuIElmIG5vXG4vLyBzdWNoIGVsZW1lbnQgaXMgZm91bmQsIHJldHVybiB0aGUgZ2l2ZW4gcm9vdCBlbGVtZW50LlxuZnVuY3Rpb24gZ2V0U2Nyb2xsaW5nUGFyZW50KGVsZW1lbnQsIHJvb3QpIHtcbiAgaWYgKGVsZW1lbnQgPT09IG51bGwgfHwgZWxlbWVudCA9PT0gcm9vdCkge1xuICAgIC8vIERpZG4ndCBmaW5kIGEgc2Nyb2xsaW5nIHBhcmVudDsgdXNlIHRoZSByb290IGVsZW1lbnQgaW5zdGVhZC5cbiAgICByZXR1cm4gcm9vdDtcbiAgfVxuICBjb25zdCBvdmVyZmxvd1kgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpLm92ZXJmbG93WTtcbiAgaWYgKG92ZXJmbG93WSA9PT0gJ3Njcm9sbCcgfHwgb3ZlcmZsb3dZID09PSAnYXV0bycpIHtcbiAgICAvLyBGb3VuZCBhbiBlbGVtZW50IHdlIGNhbiBzY3JvbGwgdmVydGljYWxseS5cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuICAvLyBLZWVwIGxvb2tpbmcgaGlnaGVyIGluIHRoZSBoaWVyYXJjaHkgZm9yIGEgc2Nyb2xsaW5nIHBhcmVudC5cbiAgcmV0dXJuIGdldFNjcm9sbGluZ1BhcmVudChlbGVtZW50LnBhcmVudE5vZGUsIHJvb3QpO1xufVxuIiwiLypcbiAqIE1pY3JvdGFzayBoZWxwZXIgZm9yIElFIDExLlxuICpcbiAqIEV4ZWN1dGluZyBhIGZ1bmN0aW9uIGFzIGEgbWljcm90YXNrIGlzIHRyaXZpYWwgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0XG4gKiBwcm9taXNlcywgd2hvc2UgdGhlbigpIGNsYXVzZXMgdXNlIG1pY3JvdGFzayB0aW1pbmcuIElFIDExIGRvZXNuJ3Qgc3VwcG9ydFxuICogcHJvbWlzZXMsIGJ1dCBkb2VzIHN1cHBvcnQgTXV0YXRpb25PYnNlcnZlcnMsIHdoaWNoIGFyZSBhbHNvIGV4ZWN1dGVkIGFzXG4gKiBtaWNyb3Rhc2tzLiBTbyB0aGlzIGhlbHBlciB1c2VzIGFuIE11dGF0aW9uT2JzZXJ2ZXIgdG8gYWNoaWV2ZSBtaWNyb3Rhc2tcbiAqIHRpbWluZy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYWtlYXJjaGliYWxkLmNvbS8yMDE1L3Rhc2tzLW1pY3JvdGFza3MtcXVldWVzLWFuZC1zY2hlZHVsZXMvXG4gKlxuICogSW5zcGlyZWQgYnkgUG9seW1lcidzIGFzeW5jKCkgZnVuY3Rpb24uXG4gKi9cblxuXG4vLyBUaGUgcXVldWUgb2YgcGVuZGluZyBjYWxsYmFja3MgdG8gYmUgZXhlY3V0ZWQgYXMgbWljcm90YXNrcy5cbmNvbnN0IGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDcmVhdGUgYW4gZWxlbWVudCB0aGF0IHdlIHdpbGwgbW9kaWZ5IHRvIGZvcmNlIG9ic2VydmFibGUgbXV0YXRpb25zLlxuY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcblxuLy8gQSBtb25vdG9uaWNhbGx5LWluY3JlYXNpbmcgdmFsdWUuXG5sZXQgY291bnRlciA9IDA7XG5cblxuLyoqXG4gKiBBZGQgYSBjYWxsYmFjayB0byB0aGUgbWljcm90YXNrIHF1ZXVlLlxuICpcbiAqIFRoaXMgdXNlcyBhIE11dGF0aW9uT2JzZXJ2ZXIgc28gdGhhdCBpdCB3b3JrcyBvbiBJRSAxMS5cbiAqXG4gKiBOT1RFOiBJRSAxMSBtYXkgYWN0dWFsbHkgdXNlIHRpbWVvdXQgdGltaW5nIHdpdGggTXV0YXRpb25PYnNlcnZlcnMuIFRoaXNcbiAqIG5lZWRzIG1vcmUgaW52ZXN0aWdhdGlvbi5cbiAqXG4gKiBAZnVuY3Rpb24gbWljcm90YXNrXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtaWNyb3Rhc2soY2FsbGJhY2spIHtcbiAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAvLyBGb3JjZSBhIG11dGF0aW9uLlxuICBlbGVtZW50LnRleHRDb250ZW50ID0gKytjb3VudGVyO1xufVxuXG5cbi8vIEV4ZWN1dGUgYW55IHBlbmRpbmcgY2FsbGJhY2tzLlxuZnVuY3Rpb24gZXhlY3V0ZUNhbGxiYWNrcygpIHtcbiAgd2hpbGUgKGNhbGxiYWNrcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY2FsbGJhY2sgPSBjYWxsYmFja3Muc2hpZnQoKTtcbiAgICBjYWxsYmFjaygpO1xuICB9XG59XG5cblxuLy8gQ3JlYXRlIHRoZSBvYnNlcnZlci5cbmNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZXhlY3V0ZUNhbGxiYWNrcyk7XG5vYnNlcnZlci5vYnNlcnZlKGVsZW1lbnQsIHtcbiAgY2hhcmFjdGVyRGF0YTogdHJ1ZVxufSk7XG4iLCJpbXBvcnQgU3ltYm9sIGZyb20gJy4vU3ltYm9sJztcblxuXG4vKipcbiAqIEEgY29sbGVjdGlvbiBvZiAocG90ZW50aWFsbHkgcG9seWZpbGxlZCkgU3ltYm9sIG9iamVjdHMgZm9yIHN0YW5kYXJkXG4gKiBjb21wb25lbnQgcHJvcGVydGllcyBhbmQgbWV0aG9kcy5cbiAqXG4gKiBUaGVzZSBTeW1ib2wgb2JqZWN0cyBhcmUgdXNlZCB0byBhbGxvdyBtaXhpbnMgYW5kIGEgY29tcG9uZW50IHRvIGludGVybmFsbHlcbiAqIGNvbW11bmljYXRlLCB3aXRob3V0IGV4cG9zaW5nIHRoZXNlIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgaW4gdGhlIGNvbXBvbmVudCdzXG4gKiBwdWJsaWMgQVBJLlxuICpcbiAqIFRvIHVzZSB0aGVzZSBTeW1ib2wgb2JqZWN0cyBpbiB5b3VyIG93biBjb21wb25lbnQsIGluY2x1ZGUgdGhpcyBtb2R1bGUgYW5kXG4gKiB0aGVuIGNyZWF0ZSBhIHByb3BlcnR5IG9yIG1ldGhvZCB3aG9zZSBrZXkgaXMgdGhlIGRlc2lyZWQgU3ltYm9sLlxuICpcbiAqICAgICBpbXBvcnQgJ1NpbmdsZVNlbGVjdGlvbk1peGluJyBmcm9tICdlbGl4LW1peGlucy9zcmMvU2luZ2xlU2VsZWN0aW9uTWl4aW4nO1xuICogICAgIGltcG9ydCAnc3ltYm9scycgZnJvbSAnZWxpeC1taXhpbnMvc3JjL3N5bWJvbHMnO1xuICpcbiAqICAgICBjbGFzcyBNeUVsZW1lbnQgZXh0ZW5kcyBTaW5nbGVTZWxlY3Rpb25NaXhpbihIVE1MRWxlbWVudCkge1xuICogICAgICAgW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCkge1xuICogICAgICAgICAvLyBUaGlzIHdpbGwgYmUgaW52b2tlZCB3aGVuZXZlciBhbiBpdGVtIGlzIHNlbGVjdGVkL2Rlc2VsZWN0ZWQuXG4gKiAgICAgICB9XG4gKiAgICAgfVxuICpcbiAqIEBtb2R1bGUgc3ltYm9sc1xuICovXG5jb25zdCBzeW1ib2xzID0ge1xuXG4gIC8qKlxuICAgKiBTeW1ib2xzIGZvciB0aGUgYGNvbnRlbnRgIHByb3BlcnR5LlxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IHJldHVybnMgdGhlIGNvbXBvbmVudCdzIGNvbnRlbnQgLS0gaG93ZXZlciB0aGUgY29tcG9uZW50XG4gICAqIHdhbnRzIHRvIGRlZmluZSB0aGF0LiBUaGlzIGNvdWxkLCBmb3IgZXhhbXBsZSwgcmV0dXJuIHRoZSBjb21wb25lbnQnc1xuICAgKiBkaXN0cmlidXRlZCBjaGlsZHJlbi5cbiAgICpcbiAgICogQHR5cGUge0hUTUxFbGVtZW50W119XG4gICAqL1xuICBjb250ZW50OiBTeW1ib2woJ2NvbnRlbnQnKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYGNvbnRlbnRDaGFuZ2VkYCBtZXRob2QuXG4gICAqXG4gICAqIEZvciBjb21wb25lbnRzIHRoYXQgZGVmaW5lIGEgYGNvbnRlbnRgIHByb3BlcnR5LCB0aGlzIG1ldGhvZCBzaG91bGQgYmVcbiAgICogaW52b2tlZCB3aGVuIHRoYXQgcHJvcGVydHkgY2hhbmdlcy5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGNvbnRlbnRDaGFuZ2VkXG4gICAqL1xuICBjb250ZW50Q2hhbmdlZDogU3ltYm9sKCdjb250ZW50Q2hhbmdlZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgZGVmYXVsdHNgIHByb3BlcnR5LlxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IGNhbiBiZSB1c2VkIHRvIHNldCBvciBvdmVycmlkZSBkZWZhdWx0cyB0aGF0IHdpbGwgYmUgYXBwbGllZFxuICAgKiB0byBhIG5ldyBjb21wb25lbnQgaW5zdGFuY2UuIFdoZW4gaW1wbGVtZW50aW5nIHRoaXMgcHJvcGVydHksIHRha2UgY2FyZSB0b1xuICAgKiBmaXJzdCBhY3F1aXJlIGFueSBkZWZhdWx0cyBkZWZpbmVkIGJ5IHRoZSBzdXBlcmNsYXNzLiBUaGUgc3RhbmRhcmQgaWRpb20gaXNcbiAgICogYXMgZm9sbG93czpcbiAgICpcbiAgICogICAgIGdldCBbc3ltYm9scy5kZWZhdWx0c10oKSB7XG4gICAqICAgICAgIGNvbnN0IGRlZmF1bHRzID0gc3VwZXJbc3ltYm9scy5kZWZhdWx0c10gfHwge307XG4gICAqICAgICAgIC8vIFNldCBvciBvdmVycmlkZSBkZWZhdWx0IHZhbHVlcyBoZXJlXG4gICAqICAgICAgIGRlZmF1bHRzLmN1c3RvbVByb3BlcnR5ID0gZmFsc2U7XG4gICAqICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICogICAgIH1cbiAgICpcbiAgICogQHZhciB7b2JqZWN0fSBkZWZhdWx0c1xuICAgKi9cbiAgZGVmYXVsdHM6IFN5bWJvbCgnZGVmYXVsdHMnKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYGdldEl0ZW1UZXh0YCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGNhbiBiZSBhcHBsaWVkIHRvIGFuIGl0ZW0gdG8gcmV0dXJuIGl0cyB0ZXh0LlxuICAgKlxuICAgKiBAZnVuY3Rpb24gZ2V0VGV4dFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gdG8gZXh0cmFjdCB0ZXh0IGZyb21cbiAgICogQHJldHVybnMge3N0cmluZ30gLSB0aGUgdGV4dCBvZiB0aGUgaXRlbVxuICAgKi9cbiAgZ2V0SXRlbVRleHQ6IFN5bWJvbCgnZ2V0VGV4dCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgZ29Eb3duYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSBkb3duLlxuICAgKlxuICAgKiBAZnVuY3Rpb24gZ29Eb3duXG4gICAqL1xuICBnb0Rvd246IFN5bWJvbCgnZ29Eb3duJyksXG5cbiAgLyoqXG4gICAqIFN5bWJvbCBmb3IgdGhlIGBnb0VuZGAgbWV0aG9kLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnZva2VkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gZ28vbmF2aWdhdGUgdG8gdGhlIGVuZCAoZS5nLixcbiAgICogb2YgYSBsaXN0KS5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGdvRW5kXG4gICAqL1xuICBnb0VuZDogU3ltYm9sKCdnb0VuZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgZ29MZWZ0YCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSBsZWZ0LlxuICAgKlxuICAgKiBAZnVuY3Rpb24gZ29MZWZ0XG4gICAqL1xuICBnb0xlZnQ6IFN5bWJvbCgnZ29MZWZ0JyksXG5cbiAgLyoqXG4gICAqIFN5bWJvbCBmb3IgdGhlIGBnb1JpZ2h0YCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSByaWdodC5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGdvUmlnaHRcbiAgICovXG4gIGdvUmlnaHQ6IFN5bWJvbCgnZ29SaWdodCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgZ29TdGFydGAgbWV0aG9kLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnZva2VkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gZ28vbmF2aWdhdGUgdG8gdGhlIHN0YXJ0XG4gICAqIChlLmcuLCBvZiBhIGxpc3QpLlxuICAgKlxuICAgKiBAZnVuY3Rpb24gZ29TdGFydFxuICAgKi9cbiAgZ29TdGFydDogU3ltYm9sKCdnb1N0YXJ0JyksXG5cbiAgLyoqXG4gICAqIFN5bWJvbCBmb3IgdGhlIGBnb1VwYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSB1cC5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGdvVXBcbiAgICovXG4gIGdvVXA6IFN5bWJvbCgnZ29VcCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgaXRlbUFkZGVkYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiBhIG5ldyBpdGVtIGlzIGFkZGVkIHRvIGEgbGlzdC5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGl0ZW1BZGRlZFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gYmVpbmcgc2VsZWN0ZWQvZGVzZWxlY3RlZFxuICAgKi9cbiAgaXRlbUFkZGVkOiBTeW1ib2woJ2l0ZW1BZGRlZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgaXRlbXNDaGFuZ2VkYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdW5kZXJseWluZyBjb250ZW50cyBjaGFuZ2UuIEl0IGlzIGFsc29cbiAgICogaW52b2tlZCBvbiBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24g4oCTIHNpbmNlIHRoZSBpdGVtcyBoYXZlIFwiY2hhbmdlZFwiIGZyb21cbiAgICogYmVpbmcgbm90aGluZy5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGl0ZW1zQ2hhbmdlZFxuICAgKi9cbiAgaXRlbXNDaGFuZ2VkOiBTeW1ib2woJ2l0ZW1zQ2hhbmdlZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgaXRlbVNlbGVjdGVkYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiBhbiBpdGVtIGJlY29tZXMgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZC5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGl0ZW1TZWxlY3RlZFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gYmVpbmcgc2VsZWN0ZWQvZGVzZWxlY3RlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNlbGVjdGVkIC0gdHJ1ZSBpZiB0aGUgaXRlbSBpcyBzZWxlY3RlZCwgZmFsc2UgaWYgbm90XG4gICAqL1xuICBpdGVtU2VsZWN0ZWQ6IFN5bWJvbCgnaXRlbVNlbGVjdGVkJyksXG5cbiAgLyoqXG4gICAqIFN5bWJvbCBmb3IgdGhlIGBrZXlkb3duYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiBhbiBlbGVtZW50IHJlY2VpdmVzIGEgYGtleWRvd25gIGV2ZW50LlxuICAgKlxuICAgKiBAZnVuY3Rpb24ga2V5ZG93blxuICAgKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGJlaW5nIHByb2Nlc3NlZFxuICAgKi9cbiAga2V5ZG93bjogU3ltYm9sKCdrZXlkb3duJyksXG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgZ2VuZXJhbCBob3Jpem9udGFsIGFuZC9vciB2ZXJ0aWNhbCBvcmllbnRhdGlvbiBvZiB0aGVcbiAgICogY29tcG9uZW50LiBUaGlzIG1heSBhZmZlY3QgYm90aCBwcmVzZW50YXRpb24gYW5kIGJlaGF2aW9yIChlLmcuLCBvZlxuICAgKiBrZXlib2FyZCBuYXZpZ2F0aW9uKS5cbiAgICpcbiAgICogQWNjZXB0ZWQgdmFsdWVzIGFyZSBcImhvcml6b250YWxcIiwgXCJ2ZXJ0aWNhbFwiLCBvciBcImJvdGhcIiAodGhlIGRlZmF1bHQpLlxuICAgKlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgb3JpZW50YXRpb246IFN5bWJvbCgnb3JpZW50YXRpb24nKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYHJhaXNlQ2hhbmdlRXZlbnRzYCBwcm9wZXJ0eS5cbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IG1peGlucyB0byBkZXRlcm1pbmUgd2hldGhlciB0aGV5IHNob3VsZCByYWlzZVxuICAgKiBwcm9wZXJ0eSBjaGFuZ2UgZXZlbnRzLiBUaGUgc3RhbmRhcmQgSFRNTCBwYXR0ZXJuIGlzIHRvIG9ubHkgcmFpc2Ugc3VjaFxuICAgKiBldmVudHMgaW4gcmVzcG9uc2UgdG8gZGlyZWN0IHVzZXIgaW50ZXJhY3Rpb25zLiBGb3IgYSBkZXRhaWxlZCBkaXNjdXNzaW9uXG4gICAqIG9mIHRoaXMgcG9pbnQsIHNlZSB0aGUgR29sZCBTdGFuZGFyZCBjaGVja2xpc3QgaXRlbSBmb3JcbiAgICogW1Byb3BlcnkgQ2hhbmdlIEV2ZW50c10oaHR0cHM6Ly9naXRodWIuY29tL3dlYmNvbXBvbmVudHMvZ29sZC1zdGFuZGFyZC93aWtpL1Byb3BlcnR5JTIwQ2hhbmdlJTIwRXZlbnRzKS5cbiAgICpcbiAgICogVGhlIGFib3ZlIGFydGljbGUgZGVzY3JpYmVzIGEgcGF0dGVybiBmb3IgdXNpbmcgYSBmbGFnIHRvIHRyYWNrIHdoZXRoZXJcbiAgICogd29yayBpcyBiZWluZyBwZXJmb3JtZWQgaW4gcmVzcG9uc2UgdG8gaW50ZXJuYWwgY29tcG9uZW50IGFjdGl2aXR5LCBhbmRcbiAgICogd2hldGhlciB0aGUgY29tcG9uZW50IHNob3VsZCB0aGVyZWZvcmUgcmFpc2UgcHJvcGVydHkgY2hhbmdlIGV2ZW50cy5cbiAgICogVGhpcyBgcmFpc2VDaGFuZ2VFdmVudHNgIHN5bWJvbCBpcyBhIHNoYXJlZCBmbGFnIHVzZWQgZm9yIHRoYXQgcHVycG9zZSBieVxuICAgKiBhbGwgRWxpeCBtaXhpbnMgYW5kIGNvbXBvbmVudHMuIFNoYXJpbmcgdGhpcyBmbGFnIGVuc3VyZXMgdGhhdCBpbnRlcm5hbFxuICAgKiBhY3Rpdml0eSAoZS5nLiwgYSBVSSBldmVudCBsaXN0ZW5lcikgaW4gb25lIG1peGluIGNhbiBzaWduYWwgb3RoZXIgbWl4aW5zXG4gICAqIGhhbmRsaW5nIGFmZmVjdGVkIHByb3BlcnRpZXMgdG8gcmFpc2UgY2hhbmdlIGV2ZW50cy5cbiAgICpcbiAgICogQWxsIFVJIGV2ZW50IGxpc3RlbmVycyAoYW5kIG90aGVyIGZvcm1zIG9mIGludGVybmFsIGhhbmRsZXJzLCBzdWNoIGFzXG4gICAqIHRpbWVvdXRzIGFuZCBhc3luYyBuZXR3b3JrIGhhbmRsZXJzKSBzaG91bGQgc2V0IGByYWlzZUNoYW5nZUV2ZW50c2AgdG9cbiAgICogYHRydWVgIGF0IHRoZSBzdGFydCBvZiB0aGUgZXZlbnQgaGFuZGxlciwgdGhlbiBgZmFsc2VgIGF0IHRoZSBlbmQ6XG4gICAqXG4gICAqICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgKiAgICAgICB0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdID0gdHJ1ZTtcbiAgICogICAgICAgLy8gRG8gd29yayBoZXJlLCBwb3NzaWJseSBzZXR0aW5nIHByb3BlcnRpZXMsIGxpa2U6XG4gICAqICAgICAgIHRoaXMuZm9vID0gJ0hlbGxvJztcbiAgICogICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IGZhbHNlO1xuICAgKiAgICAgfSk7XG4gICAqXG4gICAqIEVsc2V3aGVyZSwgcHJvcGVydHkgc2V0dGVycyB0aGF0IHJhaXNlIGNoYW5nZSBldmVudHMgc2hvdWxkIG9ubHkgZG8gc28gaXRcbiAgICogdGhpcyBwcm9wZXJ0eSBpcyBgdHJ1ZWA6XG4gICAqXG4gICAqICAgICBzZXQgZm9vKHZhbHVlKSB7XG4gICAqICAgICAgIC8vIFNhdmUgZm9vIHZhbHVlIGhlcmUsIGRvIGFueSBvdGhlciB3b3JrLlxuICAgKiAgICAgICBpZiAodGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSkge1xuICAgKiAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdmb28tY2hhbmdlZCcpO1xuICAgKiAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAqICAgICAgIH1cbiAgICogICAgIH1cbiAgICpcbiAgICogSW4gdGhpcyB3YXksIHByb2dyYW1tYXRpYyBhdHRlbXB0cyB0byBzZXQgdGhlIGBmb29gIHByb3BlcnR5IHdpbGwgbm90XG4gICAqIHRyaWdnZXIgdGhlIGBmb28tY2hhbmdlZGAgZXZlbnQsIGJ1dCBVSSBpbnRlcmFjdGlvbnMgdGhhdCB1cGRhdGUgdGhhdFxuICAgKiBwcm9wZXJ0eSB3aWxsIGNhdXNlIHRob3NlIGV2ZW50cyB0byBiZSByYWlzZWQuXG4gICAqXG4gICAqIEB2YXIge2Jvb2xlYW59IHJhaXNlQ2hhbmdlRXZlbnRzXG4gICAqL1xuICByYWlzZUNoYW5nZUV2ZW50czogU3ltYm9sKCdyYWlzZUNoYW5nZUV2ZW50cycpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgc2hhZG93Q3JlYXRlZGAgbWV0aG9kLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnZva2VkIHdoZW4gdGhlIGNvbXBvbmVudCdzIHNoYWRvdyByb290IGhhcyBiZWVuIGF0dGFjaGVkXG4gICAqIGFuZCBwb3B1bGF0ZWQuIE90aGVyIGNvZGUgY2FuIGhhbmRsZSB0aGlzIG1ldGhvZCB0byBwZXJmb3JtIGluaXRpYWxpemF0aW9uXG4gICAqIHRoYXQgZGVwZW5kcyB1cG9uIHRoZSBleGlzdGVuY2Ugb2YgYSBwb3B1bGF0ZWQgc2hhZG93IHN1YnRyZWUuXG4gICAqXG4gICAqIEBmdW5jdGlvbiBzaGFkb3dDcmVhdGVkXG4gICAqL1xuICBzaGFkb3dDcmVhdGVkOiBTeW1ib2woJ3NoYWRvd0NyZWF0ZWQnKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYHRlbXBsYXRlYCBwcm9wZXJ0eS5cbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSByZXR1cm5zIGEgY29tcG9uZW50J3MgdGVtcGxhdGUuXG4gICAqXG4gICAqIEB0eXBlIHtzdHJpbmd8SFRNTFRlbXBsYXRlRWxlbWVudH1cbiAgICovXG4gIHRlbXBsYXRlOiBTeW1ib2woJ3RlbXBsYXRlJylcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHN5bWJvbHM7XG4iLCIvKipcbiAqIEhlbHBlciBmdW5jdGlvbiBmb3Igc3RhbmRhcmQgY2xhc3NMaXN0LnRvZ2dsZSgpIGJlaGF2aW9yIG9uIG9sZCBicm93c2VycyxcbiAqIG5hbWVseSBJRSAxMS5cbiAqXG4gKiBUaGUgc3RhbmRhcmRcbiAqIFtjbGFzc2xpc3RdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2NsYXNzTGlzdClcbiAqIG9iamVjdCBoYXMgYSBgdG9nZ2xlKClgIGZ1bmN0aW9uIHRoYXQgc3VwcG9ydHMgYSBzZWNvbmQgQm9vbGVhbiBwYXJhbWV0ZXJcbiAqIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3VjY2luY3RseSB0dXJuIGEgY2xhc3Mgb24gb3Igb2ZmLiBUaGlzIGZlYXR1cmUgaXMgb2Z0ZW5cbiAqIHVzZWZ1bCBpbiBkZXNpZ25pbmcgY3VzdG9tIGVsZW1lbnRzLCB3aGljaCBtYXkgd2FudCB0byBleHRlcm5hbGx5IHJlZmxlY3RcbiAqIGNvbXBvbmVudCBzdGF0ZSBpbiBhIENTUyBjbGFzcyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdHlsaW5nIHB1cnBvc2VzLlxuICpcbiAqIFVuZm9ydHVuYXRlbHksIElFIDExIGRvZXMgbm90IHN1cHBvcnQgdGhlIEJvb2xlYW4gcGFyYW1ldGVyIHRvXG4gKiBgY2xhc3NMaXN0LnRvZ2dsZSgpYC4gVGhpcyBoZWxwZXIgZnVuY3Rpb24gYmVoYXZlcyBsaWtlIHRoZSBzdGFuZGFyZFxuICogYHRvZ2dsZSgpYCwgaW5jbHVkaW5nIHN1cHBvcnQgZm9yIHRoZSBCb29sZWFuIHBhcmFtZXRlciwgc28gdGhhdCBpdCBjYW4gYmVcbiAqIHVzZWQgZXZlbiBvbiBJRSAxMS5cbiAqXG4gKiBAZnVuY3Rpb24gdG9nZ2xlQ2xhc3NcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUaGUgZWxlbWVudCB0byBtb2RpZnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBUaGUgY2xhc3MgdG8gYWRkL3JlbW92ZVxuICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIC0gRm9yY2UgdGhlIGNsYXNzIHRvIGJlIGFkZGVkIChpZiB0cnVlKSBvciByZW1vdmVkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaWYgZmFsc2UpXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRvZ2dsZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSwgZm9yY2UpIHtcbiAgY29uc3QgY2xhc3NMaXN0ID0gZWxlbWVudC5jbGFzc0xpc3Q7XG4gIGNvbnN0IGFkZENsYXNzID0gKHR5cGVvZiBmb3JjZSA9PT0gJ3VuZGVmaW5lZCcpID9cbiAgICAhY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzTmFtZSkgOlxuICAgIGZvcmNlO1xuICBpZiAoYWRkQ2xhc3MpIHtcbiAgICBjbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICB9XG4gIHJldHVybiBhZGRDbGFzcztcbn1cbiIsIi8qXG4gKiBUaGlzIGRlbW8gY3JlYXRlcyBhIHNpbXBsZSBzaW5nbGUtc2VsZWN0aW9uIGxpc3QgYm94IGluIFBvbHltZXIuXG4gKiBUaGlzIHdvcmtzIGp1c3QgbGlrZSB0aGUgc2FtcGxlIGxpc3QgYm94IGRlbW8gaW4gdGhlIG1haW4gZWxpeC9lbGl4IHJlcG8sXG4gKiBvbmx5IHRoZSBtaXhpbnMgYXJlIGFwcGxpZWQgdG8gYSBQb2x5bWVyIGJhc2UgY2xhc3MgaW5zdGVhZCBvZiBIVE1MRWxlbWVudC5cbiAqIFNlZSB0aGF0IGRlbW8gZm9yIG1vcmUgZGV0YWlscyBhYm91dCBob3cgdGhlIG1peGlucyB3b3JrIHRvZ2V0aGVyLlxuICpcbiAqIFRoaXMgZXhhbXBsZSBkZWZpbmVzIHRoZSBsaXN0IGJveCB0ZW1wbGF0ZSBpbiBhbiBIVE1MIEltcG9ydCwgd2hpY2ggaXNcbiAqIHN0YW5kYXJkIHByYWN0aWNlIGZvciBQb2x5bWVyIGVsZW1lbnRzLiBGb3IgdGhlIHRpbWUgYmVpbmcsIHRoaXMgc2NyaXB0IGlzXG4gKiBtYWludGFpbmVkIG91dHNpZGUgb2YgdGhhdCBIVE1MIGZpbGUgdG8gc2ltcGxpZnkgdHJhbnNwaWxhdGlvbi5cbiAqL1xuXG5pbXBvcnQgQ2hpbGRyZW5Db250ZW50TWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ2hpbGRyZW5Db250ZW50TWl4aW4nO1xuaW1wb3J0IENsaWNrU2VsZWN0aW9uTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ2xpY2tTZWxlY3Rpb25NaXhpbic7XG5pbXBvcnQgQ29udGVudEl0ZW1zTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ29udGVudEl0ZW1zTWl4aW4nO1xuaW1wb3J0IERpcmVjdGlvblNlbGVjdGlvbk1peGluIGZyb20gJ2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0RpcmVjdGlvblNlbGVjdGlvbk1peGluJztcbmltcG9ydCBLZXlib2FyZERpcmVjdGlvbk1peGluIGZyb20gJ2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0tleWJvYXJkRGlyZWN0aW9uTWl4aW4nO1xuaW1wb3J0IEtleWJvYXJkTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvS2V5Ym9hcmRNaXhpbic7XG5pbXBvcnQgS2V5Ym9hcmRQYWdlZFNlbGVjdGlvbk1peGluIGZyb20gJ2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0tleWJvYXJkUGFnZWRTZWxlY3Rpb25NaXhpbic7XG5pbXBvcnQgS2V5Ym9hcmRQcmVmaXhTZWxlY3Rpb25NaXhpbiBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9LZXlib2FyZFByZWZpeFNlbGVjdGlvbk1peGluJztcbmltcG9ydCBTZWxlY3Rpb25BcmlhTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU2VsZWN0aW9uQXJpYU1peGluJztcbmltcG9ydCBTZWxlY3Rpb25JblZpZXdNaXhpbiBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9TZWxlY3Rpb25JblZpZXdNaXhpbic7XG5pbXBvcnQgU2luZ2xlU2VsZWN0aW9uTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU2luZ2xlU2VsZWN0aW9uTWl4aW4nO1xuaW1wb3J0IHN5bWJvbHMgZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvc3ltYm9scyc7XG5cblxuLy8gQXBwbHkgYSBzZXQgb2YgRWxpeCBtaXhpbnMgdG8gdGhlIFBvbHltZXIuRWxlbWVudCBiYXNlIGNsYXNzLlxuLy8gVXNlIGByZWR1Y2VgIHRvIGFwcGx5IGFsbCB0aGUgbWl4aW4gZnVuY3Rpb25zLlxuY29uc3QgbWl4aW5zID0gW1xuICBDaGlsZHJlbkNvbnRlbnRNaXhpbixcbiAgQ2xpY2tTZWxlY3Rpb25NaXhpbixcbiAgQ29udGVudEl0ZW1zTWl4aW4sXG4gIERpcmVjdGlvblNlbGVjdGlvbk1peGluLFxuICBLZXlib2FyZERpcmVjdGlvbk1peGluLFxuICBLZXlib2FyZE1peGluLFxuICBLZXlib2FyZFBhZ2VkU2VsZWN0aW9uTWl4aW4sXG4gIEtleWJvYXJkUHJlZml4U2VsZWN0aW9uTWl4aW4sXG4gIFNlbGVjdGlvbkFyaWFNaXhpbixcbiAgU2VsZWN0aW9uSW5WaWV3TWl4aW4sXG4gIFNpbmdsZVNlbGVjdGlvbk1peGluXG5dO1xuXG5jb25zdCBiYXNlID0gbWl4aW5zLnJlZHVjZSgoY2xzLCBtaXhpbikgPT4gbWl4aW4oY2xzKSwgd2luZG93LlBvbHltZXIuRWxlbWVudCk7XG5cblxuLyoqXG4gKiBBIHNpbXBsZSBzaW5nbGUtc2VsZWN0aW9uIGxpc3QgYm94LlxuICpcbiAqIFRoaXMgdXNlcyB0aGUgYmFzZSBjbGFzcyB3ZSBqdXN0IGNyZWF0ZWQgYWJvdmUsIGFuZCBhZGRzIGluIHRoZSBiZWhhdmlvclxuICogdW5pcXVlIHRvIHRoaXMgbGlzdCBib3ggZWxlbWVudC5cbiAqXG4gKiBUT0RPOiBXb3JrIG91dCB0aGUgYmVzdCB3YXkgdG8gc3VwcG9ydCBzZXR0aW5nIHByb3BlcnRpZXMgdmlhIGF0dHJpYnV0ZXMuXG4gKiBTZWUgdGhlIGFkamFjZW50IFNpbmdsZVNlbGVjdGlvbkRlbW8uanMgZmlsZSBmb3IgbW9yZSBvbiB0aGF0IGlzc3VlLlxuICovXG5jbGFzcyBMaXN0Qm94IGV4dGVuZHMgYmFzZSB7XG5cbiAgLy8gV2UgZGVmaW5lIGEgY29sbGVjdGlvbiBvZiBkZWZhdWx0IHByb3BlcnR5IHZhbHVlcyB3aGljaCBjYW4gYmUgc2V0IGluXG4gIC8vIHRoZSBjb25zdHJ1Y3RvciBvciBjb25uZWN0ZWRDYWxsYmFjay4gRGVmaW5pbmcgdGhlIGFjdHVhbCBkZWZhdWx0IHZhbHVlc1xuICAvLyBpbiB0aG9zZSBjYWxscyB3b3VsZCBjb21wbGljYXRlIHRoaW5ncyBpZiBhIHN1YmNsYXNzIHNvbWVkYXkgd2FudHMgdG9cbiAgLy8gZGVmaW5lIGl0cyBvd24gZGVmYXVsdCB2YWx1ZS5cbiAgZ2V0IFtzeW1ib2xzLmRlZmF1bHRzXSgpIHtcbiAgICBjb25zdCBkZWZhdWx0cyA9IHN1cGVyW3N5bWJvbHMuZGVmYXVsdHNdIHx8IHt9O1xuICAgIC8vIEJ5IGRlZmF1bHQsIHdlIGFzc3VtZSB0aGUgbGlzdCBwcmVzZW50cyBsaXN0IGl0ZW1zIHZlcnRpY2FsbHkuXG4gICAgZGVmYXVsdHMub3JpZW50YXRpb24gPSAndmVydGljYWwnO1xuICAgIHJldHVybiBkZWZhdWx0cztcbiAgfVxuXG4gIC8vIE1hcCBpdGVtIHNlbGVjdGlvbiB0byBhIGBzZWxlY3RlZGAgQ1NTIGNsYXNzLlxuICBbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKSB7XG4gICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpOyB9XG4gICAgaXRlbS5jbGFzc0xpc3QudG9nZ2xlKCdzZWxlY3RlZCcsIHNlbGVjdGVkKTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgaXMoKSB7XG4gICAgcmV0dXJuICdzYW1wbGUtbGlzdC1ib3gnO1xuICB9XG5cbiAgLy8gTWFwIGl0ZW0gc2VsZWN0aW9uIHRvIGEgYHNlbGVjdGVkYCBDU1MgY2xhc3MuXG4gIFtzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpIHtcbiAgICBpZiAoc3VwZXJbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKSB7IHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCk7IH1cbiAgICBpdGVtLmNsYXNzTGlzdC50b2dnbGUoJ3NlbGVjdGVkJywgc2VsZWN0ZWQpO1xuICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3NhbXBsZS1saXN0LWJveCcsIExpc3RCb3gpO1xuZXhwb3J0IGRlZmF1bHQgTGlzdEJveDtcbiIsImltcG9ydCBTaW5nbGVTZWxlY3Rpb25NaXhpbiBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9TaW5nbGVTZWxlY3Rpb25NaXhpbic7XG5pbXBvcnQgc3ltYm9scyBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9zeW1ib2xzJztcblxuXG4vKlxuICogRGVtb25zdHJhdGUgdGhlIEVsaXggc2luZ2xlLXNlbGVjdGlvbiBtaXhpbiBhcHBsaWVkIHRvIGEgUG9seW1lciAyLjAgZWxlbWVudC5cbiAqL1xuY2xhc3MgU2luZ2xlU2VsZWN0aW9uRGVtbyBleHRlbmRzIFNpbmdsZVNlbGVjdGlvbk1peGluKHdpbmRvdy5Qb2x5bWVyLkVsZW1lbnQpIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgLy8gV2hlbiBhIGNoaWxkIGlzIGNsaWNrZWQsIHNldCB0aGUgc2VsZWN0ZWRJdGVtLlxuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICB0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdID0gdHJ1ZTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gZXZlbnQudGFyZ2V0ICE9PSB0aGlzID9cbiAgICAgICAgZXZlbnQudGFyZ2V0IDogIC8vIENsaWNrZWQgb24gYW4gaXRlbVxuICAgICAgICBudWxsOyAgICAgICAgICAgLy8gQ2xpY2tlZCBvbiBlbGVtZW50IGJhY2tncm91bmRcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gSXQncyB1bmNsZWFyIHdobyBzaG91bGQgaGFuZGxlIGF0dHJpYnV0ZXMgbGlrZSBgc2VsZWN0ZWQtaW5kZXhgLiBQb2x5bWVyXG4gIC8vIHdpbGwgdHJ5IHRvIGhhbmRsZSB0aGVtLCBidXQgdGhlbiB3ZSBoYXZlIHRvIGRlY2xhcmUgdGhlbSwgZXZlbiBpZiB0aGV5XG4gIC8vIGNvbWUgZnJvbSBtaXhpbnMuIEFsdGVybmF0aXZlbHksIHdlIGNvdWxkIGRlZmluZSBvdXIgb3duXG4gIC8vIGBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2tgIGFuZCBgb2JzZXJ2ZWRBdHRyaWJ1dGVzYCBhbmQgaGFuZGxlIG91clxuICAvLyBhdHRyaWJ1dGVzIG91cnNlbHZlcy4gQ3VycmVudGx5LCBob3dldmVyLCBQb2x5bWVyIHdpbGwgZmlnaHQgdXMgZm9yXG4gIC8vIGNvbnRyb2wuXG4gIHN0YXRpYyBnZXQgY29uZmlnKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHNlbGVjdGVkSW5kZXg6IHtcbiAgICAgICAgICB0eXBlOiBOdW1iZXJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBTZWUgbm90ZXMgYXQgYGNvbmZpZ2AuXG4gIC8vIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyaWJ1dGVOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgLy8gICBpZiAoc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKSB7IHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyaWJ1dGVOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpOyB9XG4gIC8vICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdzZWxlY3RlZC1pbmRleCcpIHtcbiAgLy8gICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IG5ld1ZhbHVlO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHN0YXRpYyBnZXQgaXMoKSB7IHJldHVybiAnc2luZ2xlLXNlbGVjdGlvbi1kZW1vJzsgfVxuXG4gIC8vIE1hcCBpdGVtIHNlbGVjdGlvbiB0byBhIGBzZWxlY3RlZGAgQ1NTIGNsYXNzLlxuICBbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKSB7XG4gICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpOyB9XG4gICAgaXRlbS5jbGFzc0xpc3QudG9nZ2xlKCdzZWxlY3RlZCcsIHNlbGVjdGVkKTtcbiAgfVxuXG4gIC8vIFNpbXBsaXN0aWMgaW1wbGVtZW50YXRpb24gb2YgaXRlbXMgcHJvcGVydHkg4oCUwqBkb2Vzbid0IGhhbmRsZSByZWRpc3RyaWJ1dGlvbi5cbiAgZ2V0IGl0ZW1zKCkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkcmVuO1xuICB9XG5cbiAgLy8gU2VlIG5vdGVzIGF0IGBjb25maWdgLlxuICAvLyBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgLy8gICByZXR1cm4gWydzZWxlY3RlZC1pbmRleCddO1xuICAvLyB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoU2luZ2xlU2VsZWN0aW9uRGVtby5pcywgU2luZ2xlU2VsZWN0aW9uRGVtbyk7XG4iXX0=
