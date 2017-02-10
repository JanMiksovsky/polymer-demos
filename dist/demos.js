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
};

},{"./symbols":17}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = KeyboardDirectionMixin;

var _Symbol = require('./Symbol');

var _Symbol2 = _interopRequireDefault(_Symbol);

var _symbols = require('./symbols');

var _symbols2 = _interopRequireDefault(_symbols);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Symbols for private data members on an element.
const orientationSymbol = (0, _Symbol2.default)('orientation');

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
};

},{"./Symbol":12,"./symbols":17}],6:[function(require,module,exports){
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
};

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
  return `_${ description }${ count++ }`;
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
 * elements. Like the standard `children` property, this skips text nodes.
 *
 * @param {HTMLElement} element - the element to inspect
 * @returns {HTMLElement[]} - the children assigned to the element
 */
function assignedChildren(element) {
  return expandContentElements(element.children, false);
}

/**
 * An in-order collection of distributed child nodes, expanding any slot
 * elements. Like the standard `childNodes` property, this includes text
 * nodes.
 *
 * @param {HTMLElement} element - the element to inspect
 * @returns {Node[]} - the nodes assigned to the element
 */
function assignedChildNodes(element) {
  return expandContentElements(element.childNodes, true);
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
 * typically visible. Items which are not elements are returned as is.
 *
 * @param {NodeList|HTMLElement[]} elements - the list of elements to filter
 * @returns {HTMLElement[]} - the filtered elements
 */
function filterAuxiliaryElements(elements) {

  // These are tags that can appear in the document body, but do not seem to
  // have any user-visible manifestation.
  // See https://developer.mozilla.org/en-US/docs/Web/HTML/Element
  const auxiliaryTags = ['applet', // deprecated
  'basefont', // deprecated
  'dir', // deprecated
  'embed', 'font', // deprecated
  'frame', // deprecated
  'frameset', // deprecated
  'isindex', // deprecated
  'keygen', // deprecated
  'link', 'link', 'multicol', // deprecated
  'nextid', // deprecated
  'noscript', 'object', 'param', 'script', 'style', 'template', 'noembed' // deprecated
  ];

  return [].filter.call(elements, element => !element.localName || auxiliaryTags.indexOf(element.localName) < 0);
}

//
// Helper functions for the helpers.
//

/*
 * Given a array of nodes, return a new array with any content elements expanded
 * to the nodes distributed to that content element. This rule is applied
 * recursively.
 *
 * If includeTextNodes is true, text nodes will be included, as in the
 * standard childNodes property; by default, this skips text nodes, like the
 * standard children property.
 */
function expandContentElements(nodes, includeTextNodes) {
  const expanded = Array.prototype.map.call(nodes, node => {
    // We want to see if the node is an instanceof HTMLSlotELement, but
    // that class won't exist if the browser that doesn't support native
    // Shadow DOM and if the Shadow DOM polyfill hasn't been loaded. Instead,
    // we do a simplistic check to see if the tag name is "slot".
    const isSlot = typeof HTMLSlotElement !== 'undefined' ? node instanceof HTMLSlotElement : node.localName === 'slot';
    if (isSlot) {
      // Use the nodes assigned to this node instead.
      const assignedNodes = node.assignedNodes({ flatten: true });
      return assignedNodes ? expandContentElements(assignedNodes, includeTextNodes) : [];
    } else if (node instanceof HTMLElement) {
      // Plain element; use as is.
      return [node];
    } else if (node instanceof Text && includeTextNodes) {
      // Text node.
      return [node];
    } else {
      // Comment, processing instruction, etc.; skip.
      return [];
    }
  });
  const flattened = [].concat(...expanded);
  return flattened;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9DaGlsZHJlbkNvbnRlbnRNaXhpbi5qcyIsIi4uL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0NsaWNrU2VsZWN0aW9uTWl4aW4uanMiLCIuLi9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9Db250ZW50SXRlbXNNaXhpbi5qcyIsIi4uL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0RpcmVjdGlvblNlbGVjdGlvbk1peGluLmpzIiwiLi4vZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvS2V5Ym9hcmREaXJlY3Rpb25NaXhpbi5qcyIsIi4uL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0tleWJvYXJkTWl4aW4uanMiLCIuLi9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9LZXlib2FyZFBhZ2VkU2VsZWN0aW9uTWl4aW4uanMiLCIuLi9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9LZXlib2FyZFByZWZpeFNlbGVjdGlvbk1peGluLmpzIiwiLi4vZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU2VsZWN0aW9uQXJpYU1peGluLmpzIiwiLi4vZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU2VsZWN0aW9uSW5WaWV3TWl4aW4uanMiLCIuLi9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9TaW5nbGVTZWxlY3Rpb25NaXhpbi5qcyIsIi4uL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL1N5bWJvbC5qcyIsIi4uL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL2NvbnN0YW50cy5qcyIsIi4uL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL2NvbnRlbnQuanMiLCIuLi9lbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9kZWZhdWx0U2Nyb2xsVGFyZ2V0LmpzIiwiLi4vZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvbWljcm90YXNrLmpzIiwiLi4vZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvc3ltYm9scy5qcyIsIi4uL2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL3RvZ2dsZUNsYXNzLmpzIiwic3JjL0xpc3RCb3guanMiLCJzcmMvU2luZ2xlU2VsZWN0aW9uRGVtby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O2tCQ2dFd0Isb0I7O0FBaEV4Qjs7QUFDQTs7OztBQUNBOzs7Ozs7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyRGUsU0FBUyxvQkFBVCxDQUE4QixJQUE5QixFQUFvQzs7QUFFakQ7OztBQUdBLFFBQU0sZUFBTixTQUE4QixJQUE5QixDQUFtQzs7QUFFakMsa0JBQWM7QUFDWjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBVSxNQUFNO0FBQ2QsWUFBSSxLQUFLLGtCQUFRLGNBQWIsQ0FBSixFQUFrQztBQUNoQyxlQUFLLGtCQUFRLGNBQWI7QUFDRDtBQUNGLE9BSkQ7QUFLRDs7QUFFRDs7Ozs7O0FBTUEsU0FBSyxrQkFBUSxPQUFiLElBQXdCO0FBQ3RCLGFBQU8sK0JBQWlCLElBQWpCLENBQVA7QUFDRDs7QUFFRCxLQUFDLGtCQUFRLGFBQVQsSUFBMEI7QUFDeEIsVUFBSSxNQUFNLGtCQUFRLGFBQWQsQ0FBSixFQUFrQztBQUFFLGNBQU0sa0JBQVEsYUFBZDtBQUFpQztBQUNyRTtBQUNBLFlBQU0sUUFBUSxLQUFLLFVBQUwsQ0FBZ0IsZ0JBQWhCLENBQWlDLE1BQWpDLENBQWQ7QUFDQSxZQUFNLE9BQU4sQ0FBYyxRQUFRLEtBQUssZ0JBQUwsQ0FBc0IsWUFBdEIsRUFBb0MsU0FBUztBQUNqRSxZQUFJLEtBQUssa0JBQVEsY0FBYixDQUFKLEVBQWtDO0FBQ2hDLGVBQUssa0JB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QUssUUFBWjtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBOztBQXhENkU7O0FBNkQvRSxlQUFlLE1BQWYsQ0FBc0Isb0JBQW9CLEVBQTFDLEVBQThDLG1CQUE5QyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgeyBhc3NpZ25lZENoaWxkcmVuIH0gZnJvbSAnLi9jb250ZW50JztcbmltcG9ydCBtaWNyb3Rhc2sgZnJvbSAnLi9taWNyb3Rhc2snO1xuaW1wb3J0IHN5bWJvbHMgZnJvbSAnLi9zeW1ib2xzJztcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIGRlZmluZXMgYSBjb21wb25lbnQncyBgc3ltYm9scy5jb250ZW50YCBwcm9wZXJ0eSBhcyBhbGxcbiAqIGNoaWxkIGVsZW1lbnRzLCBpbmNsdWRpbmcgZWxlbWVudHMgZGlzdHJpYnV0ZWQgdG8gdGhlIGNvbXBvbmVudCdzIHNsb3RzLlxuICpcbiAqIFRoaXMgYWxzbyBwcm92aWRlcyBub3RpZmljYXRpb24gb2YgY2hhbmdlcyB0byBhIGNvbXBvbmVudCdzIGNvbnRlbnQuIEl0XG4gKiB3aWxsIGludm9rZSBhIGBzeW1ib2xzLmNvbnRlbnRDaGFuZ2VkYCBtZXRob2Qgd2hlbiB0aGUgY29tcG9uZW50IGlzIGZpcnN0XG4gKiBpbnN0YW50aWF0ZWQsIGFuZCB3aGVuZXZlciBpdHMgZGlzdHJpYnV0ZWQgY2hpbGRyZW4gY2hhbmdlLiBUaGlzIGlzIGludGVuZGVkXG4gKiB0byBzYXRpc2Z5IHRoZSBHb2xkIFN0YW5kYXJkIGNoZWNrbGlzdCBpdGVtIGZvciBtb25pdG9yaW5nXG4gKiBbQ29udGVudCBDaGFuZ2VzXShodHRwczovL2dpdGh1Yi5jb20vd2ViY29tcG9uZW50cy9nb2xkLXN0YW5kYXJkL3dpa2kvQ29udGVudC1DaGFuZ2VzKS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogbGV0IGJhc2UgPSBDaGlsZHJlbkNvbnRlbnRNaXhpbihEaXN0cmlidXRlZENoaWxkcmVuTWl4aW4oSFRNTEVsZW1lbnQpKTtcbiAqIGNsYXNzIENvdW50aW5nRWxlbWVudCBleHRlbmRzIGJhc2Uge1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgc3VwZXIoKTtcbiAqICAgICBsZXQgcm9vdCA9IHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICogICAgIHJvb3QuaW5uZXJIVE1MID0gYDxzbG90Pjwvc2xvdD5gO1xuICogICAgIHRoaXNbc3ltYm9scy5zaGFkb3dDcmVhdGVkXSgpO1xuICogICB9XG4gKlxuICogICBbc3ltYm9scy5jb250ZW50Q2hhbmdlZF0oKSB7XG4gKiAgICAgaWYgKHN1cGVyW3N5bWJvbHMuY29udGVudENoYW5nZWRdKSB7IHN1cGVyW3N5bWJvbHMuY29udGVudENoYW5nZWRdKCk7IH1cbiAqICAgICAvLyBDb3VudCB0aGUgY29tcG9uZW50J3MgY2hpbGRyZW4sIGJvdGggaW5pdGlhbGx5IGFuZCB3aGVuIGNoYW5nZWQuXG4gKiAgICAgdGhpcy5jb3VudCA9IHRoaXMuZGlzdHJpYnV0ZWRDaGlsZHJlbi5sZW5ndGg7XG4gKiAgIH1cbiAqXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBOb3RlIHRoYXQgY29udGVudCBjaGFuZ2UgZGV0ZWN0aW9uIGRlcGVuZHMgdXBvbiB0aGUgZWxlbWVudCBoYXZpbmcgYXQgbGVhc3RcbiAqIG9uZSBgc2xvdGAgZWxlbWVudCBpbiBpdHMgc2hhZG93IHN1YnRyZWUuXG4gKlxuICogVGhpcyBtaXhpbiBpcyBpbnRlbmRlZCBmb3IgdXNlIHdpdGggdGhlXG4gKiBbRGlzdHJpYnV0ZWRDaGlsZHJlbk1peGluXShEaXN0cmlidXRlZENoaWxkcmVuTWl4aW4ubWQpLiBTZWUgdGhhdCBtaXhpbiBmb3JcbiAqIGEgZGlzY3Vzc2lvbiBvZiBob3cgdGhhdCB3b3Jrcy4gVGhpcyBDaGlsZHJlbkNvbnRlbnRNaXhpblxuICogcHJvdmlkZXMgYW4gZWFzeSB3YXkgb2YgZGVmaW5pbmcgdGhlIFwiY29udGVudFwiIG9mIGEgY29tcG9uZW50IGFzIHRoZVxuICogY29tcG9uZW50J3MgZGlzdHJpYnV0ZWQgY2hpbGRyZW4uIFRoYXQgaW4gdHVybiBsZXRzIG1peGlucyBsaWtlXG4gKiBbQ29udGVudEl0ZW1zTWl4aW5dKENvbnRlbnRJdGVtc01peGluLm1kKSBtYW5pcHVsYXRlIHRoZSBjaGlsZHJlbiBhcyBsaXN0XG4gKiBpdGVtcy5cbiAqXG4gKiBUbyByZWNlaXZlIGBjb250ZW50Q2hhbmdlZGAgbm90aWZpY2F0aW9uLCB0aGlzIG1peGluIGV4cGVjdHMgYSBjb21wb25lbnQgdG9cbiAqIGludm9rZSBhIG1ldGhvZCBjYWxsZWQgYHN5bWJvbHMuc2hhZG93Q3JlYXRlZGAgYWZ0ZXIgdGhlIGNvbXBvbmVudCdzIHNoYWRvd1xuICogcm9vdCBoYXMgYmVlbiBjcmVhdGVkIGFuZCBwb3B1bGF0ZWQuXG4gKlxuICogTm90ZTogVGhpcyBtaXhpbiByZWxpZXMgdXBvbiB0aGUgYnJvd3NlciBmaXJpbmcgYHNsb3RjaGFuZ2VgIGV2ZW50cyB3aGVuIHRoZVxuICogY29udGVudHMgb2YgYSBgc2xvdGAgY2hhbmdlLiBTYWZhcmkgYW5kIHRoZSBwb2x5ZmlsbHMgZmlyZSB0aGlzIGV2ZW50IHdoZW4gYVxuICogY3VzdG9tIGVsZW1lbnQgaXMgZmlyc3QgdXBncmFkZWQsIHdoaWxlIENocm9tZSBkb2VzIG5vdC4gVGhpcyBtaXhpbiBhbHdheXNcbiAqIGludm9rZXMgdGhlIGBjb250ZW50Q2hhbmdlZGAgbWV0aG9kIGFmdGVyIGNvbXBvbmVudCBpbnN0YW50aWF0aW9uIHNvIHRoYXQgdGhlXG4gKiBtZXRob2Qgd2lsbCBhbHdheXMgYmUgaW52b2tlZCBhdCBsZWFzdCBvbmNlLiBIb3dldmVyLCBvbiBTYWZhcmkgKGFuZCBwb3NzaWJseVxuICogb3RoZXIgYnJvd3NlcnMpLCBgY29udGVudENoYW5nZWRgIG1pZ2h0IGJlIGludm9rZWQgX3R3aWNlXyBmb3IgYSBuZXdcbiAqIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBAbW9kdWxlIENoaWxkcmVuQ29udGVudE1peGluXG4gKiBAcGFyYW0gYmFzZSB7Q2xhc3N9IHRoZSBiYXNlIGNsYXNzIHRvIGV4dGVuZFxuICogQHJldHVybnMge0NsYXNzfSB0aGUgZXh0ZW5kZWQgY2xhc3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ2hpbGRyZW5Db250ZW50TWl4aW4oYmFzZSkge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIENoaWxkcmVuQ29udGVudCBleHRlbmRzIGJhc2Uge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICBzdXBlcigpO1xuXG4gICAgICAvLyBNYWtlIGFuIGluaXRpYWwgY2FsbCB0byBjb250ZW50Q2hhbmdlZCgpIHNvIHRoYXQgdGhlIGNvbXBvbmVudCBjYW4gZG9cbiAgICAgIC8vIGluaXRpYWxpemF0aW9uIHRoYXQgaXQgbm9ybWFsbHkgZG9lcyB3aGVuIGNvbnRlbnQgY2hhbmdlcy5cbiAgICAgIC8vXG4gICAgICAvLyBUaGlzIHdpbGwgaW52b2tlIGNvbnRlbnRDaGFuZ2VkKCkgaGFuZGxlcnMgaW4gb3RoZXIgbWl4aW5zLiBJbiBvcmRlclxuICAgICAgLy8gdGhhdCB0aG9zZSBtaXhpbnMgaGF2ZSBhIGNoYW5jZSB0byBjb21wbGV0ZSB0aGVpciBvd24gaW5pdGlhbGl6YXRpb24sXG4gICAgICAvLyB3ZSBhZGQgdGhlIGNvbnRlbnRDaGFuZ2VkKCkgY2FsbCB0byB0aGUgbWljcm90YXNrIHF1ZXVlLlxuICAgICAgbWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXNbc3ltYm9scy5jb250ZW50Q2hhbmdlZF0pIHtcbiAgICAgICAgICB0aGlzW3N5bWJvbHMuY29udGVudENoYW5nZWRdKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBjb250ZW50IG9mIHRoaXMgY29tcG9uZW50LCBkZWZpbmVkIHRvIGJlIHRoZSBmbGF0dGVuZWQgYXJyYXkgb2ZcbiAgICAgKiBjaGlsZHJlbiBkaXN0cmlidXRlZCB0byB0aGUgY29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHR5cGUge0hUTUxFbGVtZW50W119XG4gICAgICovXG4gICAgZ2V0IFtzeW1ib2xzLmNvbnRlbnRdKCkge1xuICAgICAgcmV0dXJuIGFzc2lnbmVkQ2hpbGRyZW4odGhpcyk7XG4gICAgfVxuXG4gICAgW3N5bWJvbHMuc2hhZG93Q3JlYXRlZF0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5zaGFkb3dDcmVhdGVkXSkgeyBzdXBlcltzeW1ib2xzLnNoYWRvd0NyZWF0ZWRdKCk7IH1cbiAgICAgIC8vIExpc3RlbiB0byBjaGFuZ2VzIG9uIGFsbCBzbG90cy5cbiAgICAgIGNvbnN0IHNsb3RzID0gdGhpcy5zaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ3Nsb3QnKTtcbiAgICAgIHNsb3RzLmZvckVhY2goc2xvdCA9PiBzbG90LmFkZEV2ZW50TGlzdGVuZXIoJ3Nsb3RjaGFuZ2UnLCBldmVudCA9PiB7XG4gICAgICAgIGlmICh0aGlzW3N5bWJvbHMuY29udGVudENoYW5nZWRdKSB7XG4gICAgICAgICAgdGhpc1tzeW1ib2xzLmNvbnRlbnRDaGFuZ2VkXSgpO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIENoaWxkcmVuQ29udGVudDtcbn1cbiIsImltcG9ydCBzeW1ib2xzIGZyb20gJy4vc3ltYm9scyc7XG5cblxuLyoqXG4gKiBNaXhpbiB3aGljaCBtYXBzIGEgY2xpY2sgKGFjdHVhbGx5LCBhIG1vdXNlZG93bikgdG8gYSBzZWxlY3Rpb24uXG4gKlxuICogVGhpcyBzaW1wbGUgbWl4aW4gaXMgdXNlZnVsIGluIGxpc3QgYm94LWxpa2UgZWxlbWVudHMsIHdoZXJlIGEgY2xpY2sgb24gYVxuICogbGlzdCBpdGVtIGltcGxpY2l0bHkgc2VsZWN0cyBpdC5cbiAqXG4gKiBUaGUgc3RhbmRhcmQgdXNlIGZvciB0aGlzIG1peGluIGlzIGluIGxpc3QtbGlrZSBlbGVtZW50cy4gTmF0aXZlIGxpc3RcbiAqIGJveGVzIGRvbid0IGFwcGVhciB0byBiZSBjb25zaXN0ZW50IHdpdGggcmVnYXJkIHRvIHdoZXRoZXIgdGhleSBzZWxlY3RcbiAqIG9uIG1vdXNlZG93biBvciBjbGljay9tb3VzZXVwLiBUaGlzIG1peGluIGFzc3VtZXMgdGhlIHVzZSBvZiBtb3VzZWRvd24uXG4gKiBPbiB0b3VjaCBkZXZpY2VzLCB0aGF0IGV2ZW50IGFwcGVhcnMgdG8gdHJpZ2dlciB3aGVuIHRoZSB0b3VjaCBpcyAqcmVsZWFzZWQqLlxuICpcbiAqIFRoaXMgbWl4aW4gb25seSBsaXN0ZW5zIHRvIG1vdXNlZG93biBldmVudHMgZm9yIHRoZSBwcmltYXJ5IG1vdXNlIGJ1dHRvblxuICogKHR5cGljYWxseSB0aGUgbGVmdCBidXR0b24pLiBSaWdodC1jbGlja3MgYXJlIGlnbm9yZWQgc28gdGhhdCB0aGUgYnJvd3NlclxuICogbWF5IGRpc3BsYXkgYSBjb250ZXh0IG1lbnUuXG4gKlxuICogTXVjaCBoYXMgYmVlbiB3cml0dGVuIGFib3V0IGhvdyB0byBlbnN1cmUgXCJmYXN0IHRhcFwiIGJlaGF2aW9yIG9uIG1vYmlsZVxuICogZGV2aWNlcy4gVGhpcyBtaXhpbiBtYWtlcyBhIHZlcnkgc3RyYWlnaHRmb3J3YXJkIHVzZSBvZiBhIHN0YW5kYXJkIGV2ZW50LCBhbmRcbiAqIHRoaXMgYXBwZWFycyB0byBwZXJmb3JtIHdlbGwgb24gbW9iaWxlIGRldmljZXMgd2hlbiwgZS5nLiwgdGhlIHZpZXdwb3J0IGlzXG4gKiBjb25maWd1cmVkIHdpdGggYHdpZHRoPWRldmljZS13aWR0aGAuXG4gKlxuICogVGhpcyBtaXhpbiBleHBlY3RzIHRoZSBjb21wb25lbnQgdG8gcHJvdmlkZSBhbiBgaXRlbXNgIHByb3BlcnR5LiBJdCBhbHNvXG4gKiBleHBlY3RzIHRoZSBjb21wb25lbnQgdG8gZGVmaW5lIGEgYHNlbGVjdGVkSXRlbWAgcHJvcGVydHk7IHlvdSBjYW4gcHJvdmlkZVxuICogdGhhdCB5b3Vyc2VsZiwgb3IgdXNlIFtTaW5nbGVTZWxlY3Rpb25NaXhpbl0oU2luZ2xlU2VsZWN0aW9uTWl4aW4ubWQpLlxuICpcbiAqIElmIHRoZSBjb21wb25lbnQgcmVjZWl2ZXMgYSBjbGlja3MgdGhhdCBkb2Vzbid0IGNvcnJlc3BvbmQgdG8gYW4gaXRlbSAoZS5nLixcbiAqIHRoZSB1c2VyIGNsaWNrcyBvbiB0aGUgZWxlbWVudCBiYWNrZ3JvdW5kIHZpc2libGUgYmV0d2VlbiBpdGVtcyksIHRoZVxuICogc2VsZWN0aW9uIHdpbGwgYmUgcmVtb3ZlZC4gSG93ZXZlciwgaWYgdGhlIGNvbXBvbmVudCBkZWZpbmVzIGFcbiAqIGBzZWxlY3Rpb25SZXF1aXJlZGAgYW5kIHRoaXMgaXMgdHJ1ZSwgYSBiYWNrZ3JvdW5kIGNsaWNrIHdpbGwgKm5vdCogcmVtb3ZlXG4gKiB0aGUgc2VsZWN0aW9uLlxuICpcbiAqIEBtb2R1bGUgQ2xpY2tTZWxlY3Rpb25NaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIENsaWNrU2VsZWN0aW9uTWl4aW4oYmFzZSkge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIENsaWNrU2VsZWN0aW9uIGV4dGVuZHMgYmFzZSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGV2ZW50ID0+IHtcblxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MgZXZlbnRzIGZvciB0aGUgbWFpbiAodXN1YWxseSBsZWZ0KSBidXR0b24uXG4gICAgICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdID0gdHJ1ZTtcblxuICAgICAgICAvLyBJZiB0aGUgaXRlbSBjbGlja2VkIG9uIGlzIGEgYnV0dG9uLCB0aGUgZXZlbnQgc2VlbXMgdG8gYmUgcmFpc2VkIGluXG4gICAgICAgIC8vIHBoYXNlIDIgKEFUX1RBUkdFVCkg4oCUIGJ1dCB0aGUgZXZlbnQgdGFyZ2V0IHdpbGwgYmUgdGhlIGNvbXBvbmVudCwgbm90XG4gICAgICAgIC8vIHRoZSBpdGVtIHRoYXQgd2FzIGNsaWNrZWQgb24uXG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCA9PT0gdGhpcyA/XG4gICAgICAgICAgZXZlbnQucGF0aFswXSA6IC8vIEV2ZW50IHRhcmdldCBpc24ndCB0aGUgaXRlbSwgc28gZ2V0IGl0IGZyb20gcGF0aC5cbiAgICAgICAgICBldmVudC50YXJnZXQ7XG5cbiAgICAgICAgLy8gRmluZCB3aGljaCBpdGVtIHdhcyBjbGlja2VkIG9uIGFuZCwgaWYgZm91bmQsIHNlbGVjdCBpdC4gRm9yIGVsZW1lbnRzXG4gICAgICAgIC8vIHdoaWNoIGRvbid0IHJlcXVpcmUgYSBzZWxlY3Rpb24sIGEgYmFja2dyb3VuZCBjbGljayB3aWxsIGRldGVybWluZVxuICAgICAgICAvLyB0aGUgaXRlbSB3YXMgbnVsbCwgaW4gd2hpY2ggd2UgY2FzZSB3ZSdsbCByZW1vdmUgdGhlIHNlbGVjdGlvbi5cbiAgICAgICAgY29uc3QgaXRlbSA9IGl0ZW1Gb3JUYXJnZXQodGhpcywgdGFyZ2V0KTtcbiAgICAgICAgaWYgKGl0ZW0gfHwgIXRoaXMuc2VsZWN0aW9uUmVxdWlyZWQpIHtcblxuICAgICAgICAgIGlmICghKCdzZWxlY3RlZEl0ZW0nIGluIHRoaXMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYENsaWNrU2VsZWN0aW9uTWl4aW4gZXhwZWN0cyBhIGNvbXBvbmVudCB0byBkZWZpbmUgYSBcInNlbGVjdGVkSXRlbVwiIHByb3BlcnR5LmApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSXRlbSA9IGl0ZW07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gV2UgZG9uJ3QgY2FsbCBwcmV2ZW50RGVmYXVsdCBoZXJlLiBUaGUgZGVmYXVsdCBiZWhhdmlvciBmb3JcbiAgICAgICAgICAvLyBtb3VzZWRvd24gaW5jbHVkZXMgc2V0dGluZyBrZXlib2FyZCBmb2N1cyBpZiB0aGUgZWxlbWVudCBkb2Vzbid0XG4gICAgICAgICAgLy8gYWxyZWFkeSBoYXZlIHRoZSBmb2N1cywgYW5kIHdlIHdhbnQgdG8gcHJlc2VydmUgdGhhdCBiZWhhdmlvci5cbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10gPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIENsaWNrU2VsZWN0aW9uO1xufVxuXG5cbi8qXG4gKiBSZXR1cm4gdGhlIGxpc3QgaXRlbSB0aGF0IGlzLCBvciBjb250YWlucywgdGhlIGluZGljYXRlZCB0YXJnZXQgZWxlbWVudC5cbiAqIFJldHVybiBudWxsIGlmIG5vdCBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gaXRlbUZvclRhcmdldChsaXN0RWxlbWVudCwgdGFyZ2V0KSB7XG4gIGNvbnN0IGl0ZW1zID0gbGlzdEVsZW1lbnQuaXRlbXM7XG4gIGNvbnN0IGl0ZW1Db3VudCA9IGl0ZW1zID8gaXRlbXMubGVuZ3RoIDogMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtQ291bnQ7IGkrKykge1xuICAgIGxldCBpdGVtID0gaXRlbXNbaV07XG4gICAgaWYgKGl0ZW0gPT09IHRhcmdldCB8fCBpdGVtLmNvbnRhaW5zKHRhcmdldCkpIHtcbiAgICAgIHJldHVybiBpdGVtO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiIsImltcG9ydCAqIGFzIGNvbnRlbnQgZnJvbSAnLi9jb250ZW50JztcbmltcG9ydCBTeW1ib2wgZnJvbSAnLi9TeW1ib2wnO1xuaW1wb3J0IHN5bWJvbHMgZnJvbSAnLi9zeW1ib2xzJztcbmltcG9ydCB0b2dnbGVDbGFzcyBmcm9tICcuL3RvZ2dsZUNsYXNzJztcblxuXG4vLyBTeW1ib2xzIGZvciBwcml2YXRlIGRhdGEgbWVtYmVycyBvbiBhbiBlbGVtZW50LlxuY29uc3QgaXRlbXNTeW1ib2wgPSBTeW1ib2woJ2l0ZW1zJyk7XG5jb25zdCBpdGVtSW5pdGlhbGl6ZWRTeW1ib2wgPSBTeW1ib2woJ2l0ZW1Jbml0aWFsaXplZCcpO1xuXG5cbi8qKlxuICogTWl4aW4gd2hpY2ggbWFwcyBjb250ZW50IHNlbWFudGljcyAoZWxlbWVudHMpIHRvIGxpc3QgaXRlbSBzZW1hbnRpY3MuXG4gKlxuICogSXRlbXMgZGlmZmVyIGZyb20gZWxlbWVudCBjb250ZW50cyBpbiBzZXZlcmFsIHdheXM6XG4gKlxuICogKiBUaGV5IGFyZSBvZnRlbiByZWZlcmVuY2VkIHZpYSBpbmRleC5cbiAqICogVGhleSBtYXkgaGF2ZSBhIHNlbGVjdGlvbiBzdGF0ZS5cbiAqICogSXQncyBjb21tb24gdG8gZG8gd29yayB0byBpbml0aWFsaXplIHRoZSBhcHBlYXJhbmNlIG9yIHN0YXRlIG9mIGEgbmV3XG4gKiAgIGl0ZW0uXG4gKiAqIEF1eGlsaWFyeSBpbnZpc2libGUgY2hpbGQgZWxlbWVudHMgYXJlIGZpbHRlcmVkIG91dCBhbmQgbm90IGNvdW50ZWQgYXNcbiAqICAgaXRlbXMuIEF1eGlsaWFyeSBlbGVtZW50cyBpbmNsdWRlIGxpbmssIHNjcmlwdCwgc3R5bGUsIGFuZCB0ZW1wbGF0ZVxuICogICBlbGVtZW50cy4gVGhpcyBmaWx0ZXJpbmcgZW5zdXJlcyB0aGF0IHRob3NlIGF1eGlsaWFyeSBlbGVtZW50cyBjYW4gYmVcbiAqICAgdXNlZCBpbiBtYXJrdXAgaW5zaWRlIG9mIGEgbGlzdCB3aXRob3V0IGJlaW5nIHRyZWF0ZWQgYXMgbGlzdCBpdGVtcy5cbiAqXG4gKiBUaGlzIG1peGluIGV4cGVjdHMgYSBjb21wb25lbnQgdG8gcHJvdmlkZSBhIGBjb250ZW50YCBwcm9wZXJ0eSByZXR1cm5pbmcgYVxuICogcmF3IHNldCBvZiBlbGVtZW50cy4gWW91IGNhbiBwcm92aWRlIHRoYXQgeW91cnNlbGYsIG9yIHVzZVxuICogW0NoaWxkcmVuQ29udGVudE1peGluXShDaGlsZHJlbkNvbnRlbnRNaXhpbi5tZCkuXG4gKlxuICogW0NoaWxkcmVuQ29udGVudE1peGluXShDaGlsZHJlbkNvbnRlbnRNaXhpbi5tZCksIHRoZVxuICogYGNvbnRlbnRDaGFuZ2VkYCBtZXRob2Qgd2lsbCBiZSBpbnZva2VkIGZvciB5b3Ugd2hlbiB0aGUgZWxlbWVudCdzIGNoaWxkcmVuXG4gKiBjYXJlIG9mIG5vdGlmeWluZyBpdCBvZiBmdXR1cmUgY2hhbmdlcywgYW5kIHR1cm5zIG9uIHRoZSBvcHRpbWl6YXRpb24uIFdpdGhcbiAqIGNoYW5nZSwgdHVybmluZyBvbiB0aGUgb3B0aW1pemF0aW9uIGF1dG9tYXRpY2FsbHkuXG4gKiBtZXRob2Qgd2hlbiB0aGUgc2V0IG9mIGl0ZW1zIGNoYW5nZXMsIHRoZSBtaXhpbiBjb25jbHVkZXMgdGhhdCB5b3UnbGwgdGFrZVxuICogcHJvcGVydHkuIFRvIGF2b2lkIGhhdmluZyB0byBkbyB3b3JrIGVhY2ggdGltZSB0aGF0IHByb3BlcnR5IGlzIHJlcXVlc3RlZCxcbiAqIHJldHVybiB0aGF0IGltbWVkaWF0ZWx5IG9uIHN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIGBpdGVtc2AgcHJvcGVydHkuIElmIHlvdVxuICogdGhhdCBvbiwgdGhlIG1peGluIHNhdmVzIGEgcmVmZXJlbmNlIHRvIHRoZSBjb21wdXRlZCBzZXQgb2YgaXRlbXMsIGFuZCB3aWxsXG4gKiBUaGUgbW9zdCBjb21tb25seSByZWZlcmVuY2VkIHByb3BlcnR5IGRlZmluZWQgYnkgdGhpcyBtaXhpbiBpcyB0aGUgYGl0ZW1zYFxuICogdGhpcyBtaXhpbiBzdXBwb3J0cyBhbiBvcHRpbWl6ZWQgbW9kZS4gSWYgeW91IGludm9rZSB0aGUgYGNvbnRlbnRDaGFuZ2VkYFxuICogdXNlIHRoaXMgbWl4aW4gaW4gY29uanVuY3Rpb24gd2l0aFxuICpcbiAqIEBtb2R1bGUgQ29udGVudEl0ZW1zTWl4aW5cbiAqIEBwYXJhbSBiYXNlIHtDbGFzc30gdGhlIGJhc2UgY2xhc3MgdG8gZXh0ZW5kXG4gKiBAcmV0dXJucyB7Q2xhc3N9IHRoZSBleHRlbmRlZCBjbGFzc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBDb250ZW50SXRlbXNNaXhpbihiYXNlKSB7XG5cbiAgLyoqXG4gICAqIFRoZSBjbGFzcyBwcm90b3R5cGUgYWRkZWQgYnkgdGhlIG1peGluLlxuICAgKi9cbiAgY2xhc3MgQ29udGVudEl0ZW1zIGV4dGVuZHMgYmFzZSB7XG5cbiAgICBbc3ltYm9scy5jb250ZW50Q2hhbmdlZF0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5jb250ZW50Q2hhbmdlZF0pIHsgc3VwZXJbc3ltYm9scy5jb250ZW50Q2hhbmdlZF0oKTsgfVxuXG4gICAgICAvLyBTaW5jZSB3ZSBnb3QgdGhlIGNvbnRlbnRDaGFuZ2VkIGNhbGwsIHdlJ2xsIGFzc3VtZSB3ZSdsbCBiZSBub3RpZmllZCBpZlxuICAgICAgLy8gdGhlIHNldCBvZiBpdGVtcyBjaGFuZ2VzIGxhdGVyLiBXZSB0dXJuIG9uIG1lbW9pemF0aW9uIG9mIHRoZSBpdGVtc1xuICAgICAgLy8gcHJvcGVydHkgYnkgc2V0dGluZyBvdXIgaW50ZXJuYWwgcHJvcGVydHkgdG8gbnVsbCAoaW5zdGVhZCBvZlxuICAgICAgLy8gdW5kZWZpbmVkKS5cbiAgICAgIHRoaXNbaXRlbXNTeW1ib2xdID0gbnVsbDtcblxuICAgICAgdGhpc1tzeW1ib2xzLml0ZW1zQ2hhbmdlZF0oKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2VsZWN0aW9uIHN0YXRlIGZvciBhIHNpbmdsZSBpdGVtIGhhcyBjaGFuZ2VkLlxuICAgICAqXG4gICAgICogSW52b2tlIHRoaXMgbWV0aG9kIHRvIHNpZ25hbCB0aGF0IHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgaW5kaWNhdGVkIGl0ZW1cbiAgICAgKiBoYXMgY2hhbmdlZC4gQnkgZGVmYXVsdCwgdGhpcyBhcHBsaWVzIGEgYHNlbGVjdGVkYCBDU1MgY2xhc3MgaWYgdGhlIGl0ZW1cbiAgICAgKiBpcyBzZWxlY3RlZCwgYW5kIHJlbW92ZWQgaXQgaWYgbm90IHNlbGVjdGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaXRlbSAtIFRoZSBpdGVtIHdob3NlIHNlbGVjdGlvbiBzdGF0ZSBoYXMgY2hhbmdlZC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNlbGVjdGVkIC0gVHJ1ZSBpZiB0aGUgaXRlbSBpcyBzZWxlY3RlZCwgZmFsc2UgaWYgbm90LlxuICAgICAqL1xuICAgIFtzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0pIHsgc3VwZXJbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKTsgfVxuICAgICAgdG9nZ2xlQ2xhc3MoaXRlbSwgJ3NlbGVjdGVkJywgc2VsZWN0ZWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBjdXJyZW50IHNldCBvZiBpdGVtcyBpbiB0aGUgbGlzdC4gU2VlIHRoZSB0b3AtbGV2ZWwgZG9jdW1lbnRhdGlvbiBmb3JcbiAgICAgKiBtaXhpbiBmb3IgYSBkZXNjcmlwdGlvbiBvZiBob3cgaXRlbXMgZGlmZmVyIGZyb20gcGxhaW4gY29udGVudC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudFtdfVxuICAgICAqL1xuICAgIGdldCBpdGVtcygpIHtcbiAgICAgIGxldCBpdGVtcztcbiAgICAgIGlmICh0aGlzW2l0ZW1zU3ltYm9sXSA9PSBudWxsKSB7XG4gICAgICAgIGl0ZW1zID0gY29udGVudC5maWx0ZXJBdXhpbGlhcnlFbGVtZW50cyh0aGlzW3N5bWJvbHMuY29udGVudF0pO1xuICAgICAgICAvLyBOb3RlOiB0ZXN0IGZvciAqZXF1YWxpdHkqIHdpdGggbnVsbCwgc2luY2Ugd2UgdXNlIGB1bmRlZmluZWRgIHRvXG4gICAgICAgIC8vIGluZGljYXRlIHRoYXQgd2UncmUgbm90IHlldCBjYWNoaW5nIGl0ZW1zLlxuICAgICAgICBpZiAodGhpc1tpdGVtc1N5bWJvbF0gPT09IG51bGwpIHtcbiAgICAgICAgICAvLyBNZW1vaXplIHRoZSBzZXQgb2YgaXRlbXMuXG4gICAgICAgICAgdGhpc1tpdGVtc1N5bWJvbF0gPSBpdGVtcztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBtZW1vaXplZCBpdGVtcy5cbiAgICAgICAgaXRlbXMgPSB0aGlzW2l0ZW1zU3ltYm9sXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVtcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBpbnZva2VkIHdoZW4gdGhlIHVuZGVybHlpbmcgY29udGVudHMgY2hhbmdlLiBJdCBpcyBhbHNvXG4gICAgICogaW52b2tlZCBvbiBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24g4oCTIHNpbmNlIHRoZSBpdGVtcyBoYXZlIFwiY2hhbmdlZFwiIGZyb21cbiAgICAgKiBiZWluZyBub3RoaW5nLlxuICAgICAqL1xuICAgIFtzeW1ib2xzLml0ZW1zQ2hhbmdlZF0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5pdGVtc0NoYW5nZWRdKSB7IHN1cGVyW3N5bWJvbHMuaXRlbXNDaGFuZ2VkXSgpOyB9XG5cbiAgICAgIC8vIFBlcmZvcm0gcGVyLWl0ZW0gaW5pdGlhbGl6YXRpb24gaWYgYGl0ZW1BZGRlZGAgaXMgZGVmaW5lZC5cbiAgICAgIGlmICh0aGlzW3N5bWJvbHMuaXRlbUFkZGVkXSkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHRoaXMuaXRlbXMsIGl0ZW0gPT4ge1xuICAgICAgICAgIGlmICghaXRlbVtpdGVtSW5pdGlhbGl6ZWRTeW1ib2xdKSB7XG4gICAgICAgICAgICB0aGlzW3N5bWJvbHMuaXRlbUFkZGVkXShpdGVtKTtcbiAgICAgICAgICAgIGl0ZW1baXRlbUluaXRpYWxpemVkU3ltYm9sXSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10pIHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnaXRlbXMtY2hhbmdlZCcpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBpdGVtcyBpbiB0aGUgbGlzdCBjaGFuZ2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ29udGVudEl0ZW1zXG4gICAgICogQGV2ZW50IGl0ZW1zLWNoYW5nZWRcbiAgICAgKi9cbiAgfVxuXG4gIHJldHVybiBDb250ZW50SXRlbXM7XG59XG4iLCJpbXBvcnQgc3ltYm9scyBmcm9tICcuL3N5bWJvbHMnO1xuXG5cbi8qKlxuICogTWl4aW4gd2hpY2ggbWFwcyBkaXJlY3Rpb24gc2VtYW50aWNzIChnb0xlZnQsIGdvUmlnaHQsIGV0Yy4pIHRvIHNlbGVjdGlvblxuICogc2VtYW50aWNzIChzZWxlY3RQcmV2aW91cywgc2VsZWN0TmV4dCwgZXRjLikuXG4gKlxuICogVGhpcyBtaXhpbiBjYW4gYmUgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoXG4gKiBbS2V5Ym9hcmREaXJlY3Rpb25NaXhpbl0oS2V5Ym9hcmREaXJlY3Rpb25NaXhpbi5tZCkgKHdoaWNoIG1hcHMga2V5Ym9hcmRcbiAqIGV2ZW50cyB0byBkaXJlY3Rpb25zKSBhbmQgYSBtaXhpbiB0aGF0IGhhbmRsZXMgc2VsZWN0aW9uIGxpa2VcbiAqIFtTaW5nbGVTZWxlY3Rpb25NaXhpbl0oU2luZ2xlU2VsZWN0aW9uTWl4aW4ubWQpLlxuICpcbiAqIEBtb2R1bGUgRGlyZWN0aW9uU2VsZWN0aW9uTWl4aW5cbiAqIEBwYXJhbSBiYXNlIHtDbGFzc30gdGhlIGJhc2UgY2xhc3MgdG8gZXh0ZW5kXG4gKiBAcmV0dXJucyB7Q2xhc3N9IHRoZSBleHRlbmRlZCBjbGFzc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBEaXJlY3Rpb25TZWxlY3Rpb25NaXhpbihiYXNlKSB7XG5cbiAgLyoqXG4gICAqIFRoZSBjbGFzcyBwcm90b3R5cGUgYWRkZWQgYnkgdGhlIG1peGluLlxuICAgKi9cbiAgY2xhc3MgRGlyZWN0aW9uU2VsZWN0aW9uIGV4dGVuZHMgYmFzZSB7XG5cbiAgICBbc3ltYm9scy5nb0Rvd25dKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuZ29Eb3duXSkgeyBzdXBlcltzeW1ib2xzLmdvRG93bl0oKTsgfVxuICAgICAgaWYgKCF0aGlzLnNlbGVjdE5leHQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBEaXJlY3Rpb25TZWxlY3Rpb25NaXhpbiBleHBlY3RzIGEgY29tcG9uZW50IHRvIGRlZmluZSBhIFwic2VsZWN0TmV4dFwiIG1ldGhvZC5gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdE5leHQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBbc3ltYm9scy5nb0VuZF0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5nb0VuZF0pIHsgc3VwZXJbc3ltYm9scy5nb0VuZF0oKTsgfVxuICAgICAgaWYgKCF0aGlzLnNlbGVjdExhc3QpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBEaXJlY3Rpb25TZWxlY3Rpb25NaXhpbiBleHBlY3RzIGEgY29tcG9uZW50IHRvIGRlZmluZSBhIFwic2VsZWN0TGFzdFwiIG1ldGhvZC5gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdExhc3QoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBbc3ltYm9scy5nb0xlZnRdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuZ29MZWZ0XSkgeyBzdXBlcltzeW1ib2xzLmdvTGVmdF0oKTsgfVxuICAgICAgaWYgKCF0aGlzLnNlbGVjdFByZXZpb3VzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgRGlyZWN0aW9uU2VsZWN0aW9uTWl4aW4gZXhwZWN0cyBhIGNvbXBvbmVudCB0byBkZWZpbmUgYSBcInNlbGVjdFByZXZpb3VzXCIgbWV0aG9kLmApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0UHJldmlvdXMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBbc3ltYm9scy5nb1JpZ2h0XSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmdvUmlnaHRdKSB7IHN1cGVyW3N5bWJvbHMuZ29SaWdodF0oKTsgfVxuICAgICAgaWYgKCF0aGlzLnNlbGVjdE5leHQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBEaXJlY3Rpb25TZWxlY3Rpb25NaXhpbiBleHBlY3RzIGEgY29tcG9uZW50IHRvIGRlZmluZSBhIFwic2VsZWN0TmV4dFwiIG1ldGhvZC5gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdE5leHQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBbc3ltYm9scy5nb1N0YXJ0XSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmdvU3RhcnRdKSB7IHN1cGVyW3N5bWJvbHMuZ29TdGFydF0oKTsgfVxuICAgICAgaWYgKCF0aGlzLnNlbGVjdEZpcnN0KSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgRGlyZWN0aW9uU2VsZWN0aW9uTWl4aW4gZXhwZWN0cyBhIGNvbXBvbmVudCB0byBkZWZpbmUgYSBcInNlbGVjdEZpcnN0XCIgbWV0aG9kLmApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0Rmlyc3QoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBbc3ltYm9scy5nb1VwXSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmdvVXBdKSB7IHN1cGVyW3N5bWJvbHMuZ29VcF0oKTsgfVxuICAgICAgaWYgKCF0aGlzLnNlbGVjdFByZXZpb3VzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgRGlyZWN0aW9uU2VsZWN0aW9uTWl4aW4gZXhwZWN0cyBhIGNvbXBvbmVudCB0byBkZWZpbmUgYSBcInNlbGVjdFByZXZpb3VzXCIgbWV0aG9kLmApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0UHJldmlvdXMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiBEaXJlY3Rpb25TZWxlY3Rpb247XG59O1xuIiwiaW1wb3J0IFN5bWJvbCBmcm9tICcuL1N5bWJvbCc7XG5pbXBvcnQgc3ltYm9scyBmcm9tICcuL3N5bWJvbHMnO1xuXG5cbi8vIFN5bWJvbHMgZm9yIHByaXZhdGUgZGF0YSBtZW1iZXJzIG9uIGFuIGVsZW1lbnQuXG5jb25zdCBvcmllbnRhdGlvblN5bWJvbCA9IFN5bWJvbCgnb3JpZW50YXRpb24nKTtcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIG1hcHMgZGlyZWN0aW9uIGtleXMgKExlZnQsIFJpZ2h0LCBldGMuKSB0byBkaXJlY3Rpb24gc2VtYW50aWNzXG4gKiAoZ28gbGVmdCwgZ28gcmlnaHQsIGV0Yy4pLlxuICpcbiAqIFRoaXMgbWl4aW4gZXhwZWN0cyB0aGUgY29tcG9uZW50IHRvIGludm9rZSBhIGBrZXlkb3duYCBtZXRob2Qgd2hlbiBhIGtleSBpc1xuICogcHJlc3NlZC4gWW91IGNhbiB1c2UgW0tleWJvYXJkTWl4aW5dKEtleWJvYXJkTWl4aW4ubWQpIGZvciB0aGF0XG4gKiBwdXJwb3NlLCBvciB3aXJlIHVwIHlvdXIgb3duIGtleWJvYXJkIGhhbmRsaW5nIGFuZCBjYWxsIGBrZXlkb3duYCB5b3Vyc2VsZi5cbiAqXG4gKiBUaGlzIG1peGluIGNhbGxzIG1ldGhvZHMgc3VjaCBhcyBgZ29MZWZ0YCBhbmQgYGdvUmlnaHRgLiBZb3UgY2FuIGRlZmluZVxuICogd2hhdCB0aGF0IG1lYW5zIGJ5IGltcGxlbWVudGluZyB0aG9zZSBtZXRob2RzIHlvdXJzZWxmLiBJZiB5b3Ugd2FudCB0byB1c2VcbiAqIGRpcmVjdGlvbiBrZXlzIHRvIG5hdmlnYXRlIGEgc2VsZWN0aW9uLCB1c2UgdGhpcyBtaXhpbiB3aXRoXG4gKiBbRGlyZWN0aW9uU2VsZWN0aW9uTWl4aW5dKERpcmVjdGlvblNlbGVjdGlvbk1peGluLm1kKS5cbiAqXG4gKiBJZiB0aGUgY29tcG9uZW50IGRlZmluZXMgYSBwcm9wZXJ0eSBjYWxsZWQgYHN5bWJvbHMub3JpZW50YXRpb25gLCB0aGUgdmFsdWVcbiAqIG9mIHRoYXQgcHJvcGVydHkgd2lsbCBjb25zdHJhaW4gbmF2aWdhdGlvbiB0byB0aGUgaG9yaXpvbnRhbCBvciB2ZXJ0aWNhbCBheGlzLlxuICpcbiAqIEBtb2R1bGUgS2V5Ym9hcmREaXJlY3Rpb25NaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEtleWJvYXJkRGlyZWN0aW9uTWl4aW4oYmFzZSkge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIEtleWJvYXJkRGlyZWN0aW9uIGV4dGVuZHMgYmFzZSB7XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2VkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gZ28vbmF2aWdhdGUgZG93bi5cbiAgICAgKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIG1ldGhvZCBkb2VzIG5vdGhpbmcuXG4gICAgICovXG4gICAgW3N5bWJvbHMuZ29Eb3duXSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmdvRG93bl0pIHsgcmV0dXJuIHN1cGVyW3N5bWJvbHMuZ29Eb3duXSgpOyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCB3aGVuIHRoZSB1c2VyIHdhbnRzIHRvIGdvL25hdmlnYXRlIHRvIHRoZSBlbmQgKGUuZy4sIG9mIGEgbGlzdCkuXG4gICAgICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLlxuICAgICAqL1xuICAgIFtzeW1ib2xzLmdvRW5kXSgpIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLmdvRW5kXSkgeyByZXR1cm4gc3VwZXJbc3ltYm9scy5nb0VuZF0oKTsgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSBsZWZ0LlxuICAgICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIHRoaXMgbWV0aG9kIGRvZXMgbm90aGluZy5cbiAgICAgKi9cbiAgICBbc3ltYm9scy5nb0xlZnRdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuZ29MZWZ0XSkgeyByZXR1cm4gc3VwZXJbc3ltYm9scy5nb0xlZnRdKCk7IH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2VkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gZ28vbmF2aWdhdGUgcmlnaHQuXG4gICAgICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLlxuICAgICAqL1xuICAgIFtzeW1ib2xzLmdvUmlnaHRdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuZ29SaWdodF0pIHsgcmV0dXJuIHN1cGVyW3N5bWJvbHMuZ29SaWdodF0oKTsgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSB0byB0aGUgc3RhcnQgKGUuZy4sIG9mIGFcbiAgICAgKiBsaXN0KS4gVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLlxuICAgICAqL1xuICAgIFtzeW1ib2xzLmdvU3RhcnRdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuZ29TdGFydF0pIHsgcmV0dXJuIHN1cGVyW3N5bWJvbHMuZ29TdGFydF0oKTsgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSB1cC5cbiAgICAgKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIG1ldGhvZCBkb2VzIG5vdGhpbmcuXG4gICAgICovXG4gICAgW3N5bWJvbHMuZ29VcF0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5nb1VwXSkgeyByZXR1cm4gc3VwZXJbc3ltYm9scy5nb1VwXSgpOyB9XG4gICAgfVxuXG4gICAgW3N5bWJvbHMua2V5ZG93bl0oZXZlbnQpIHtcbiAgICAgIGxldCBoYW5kbGVkID0gZmFsc2U7XG5cbiAgICAgIGNvbnN0IG9yaWVudGF0aW9uID0gdGhpc1tzeW1ib2xzLm9yaWVudGF0aW9uXSB8fCAnYm90aCc7XG4gICAgICBjb25zdCBob3Jpem9udGFsID0gKG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgfHwgb3JpZW50YXRpb24gPT09ICdib3RoJyk7XG4gICAgICBjb25zdCB2ZXJ0aWNhbCA9IChvcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJyB8fCBvcmllbnRhdGlvbiA9PT0gJ2JvdGgnKTtcblxuICAgICAgLy8gSWdub3JlIExlZnQvUmlnaHQga2V5cyB3aGVuIG1ldGFLZXkgb3IgYWx0S2V5IG1vZGlmaWVyIGlzIGFsc28gcHJlc3NlZCxcbiAgICAgIC8vIGFzIHRoZSB1c2VyIG1heSBiZSB0cnlpbmcgdG8gbmF2aWdhdGUgYmFjayBvciBmb3J3YXJkIGluIHRoZSBicm93c2VyLlxuICAgICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICAgIGNhc2UgMzU6IC8vIEVuZFxuICAgICAgICAgIGhhbmRsZWQgPSB0aGlzW3N5bWJvbHMuZ29FbmRdKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzY6IC8vIEhvbWVcbiAgICAgICAgICBoYW5kbGVkID0gdGhpc1tzeW1ib2xzLmdvU3RhcnRdKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzc6IC8vIExlZnRcbiAgICAgICAgICBpZiAoaG9yaXpvbnRhbCAmJiAhZXZlbnQubWV0YUtleSAmJiAhZXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICAgICBoYW5kbGVkID0gdGhpc1tzeW1ib2xzLmdvTGVmdF0oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzg6IC8vIFVwXG4gICAgICAgICAgaWYgKHZlcnRpY2FsKSB7XG4gICAgICAgICAgICBoYW5kbGVkID0gZXZlbnQuYWx0S2V5ID8gdGhpc1tzeW1ib2xzLmdvU3RhcnRdKCkgOiB0aGlzW3N5bWJvbHMuZ29VcF0oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzk6IC8vIFJpZ2h0XG4gICAgICAgICAgaWYgKGhvcml6b250YWwgJiYgIWV2ZW50Lm1ldGFLZXkgJiYgIWV2ZW50LmFsdEtleSkge1xuICAgICAgICAgICAgaGFuZGxlZCA9IHRoaXNbc3ltYm9scy5nb1JpZ2h0XSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA0MDogLy8gRG93blxuICAgICAgICAgIGlmICh2ZXJ0aWNhbCkge1xuICAgICAgICAgICAgaGFuZGxlZCA9IGV2ZW50LmFsdEtleSA/IHRoaXNbc3ltYm9scy5nb0VuZF0oKSA6IHRoaXNbc3ltYm9scy5nb0Rvd25dKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy8gUHJlZmVyIG1peGluIHJlc3VsdCBpZiBpdCdzIGRlZmluZWQsIG90aGVyd2lzZSB1c2UgYmFzZSByZXN1bHQuXG4gICAgICByZXR1cm4gaGFuZGxlZCB8fCAoc3VwZXJbc3ltYm9scy5rZXlkb3duXSAmJiBzdXBlcltzeW1ib2xzLmtleWRvd25dKGV2ZW50KSkgfHwgZmFsc2U7XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gS2V5Ym9hcmREaXJlY3Rpb247XG59O1xuIiwiaW1wb3J0IHN5bWJvbHMgZnJvbSAnLi9zeW1ib2xzJztcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIG1hbmFnZXMgdGhlIGtleWRvd24gaGFuZGxpbmcgZm9yIGEgY29tcG9uZW50LlxuICpcbiAqIFRoaXMgbWl4aW4gaGFuZGxlcyBzZXZlcmFsIGtleWJvYXJkLXJlbGF0ZWQgZmVhdHVyZXMuXG4gKlxuICogRmlyc3QsIGl0IHdpcmVzIHVwIGEgc2luZ2xlIGtleWRvd24gZXZlbnQgaGFuZGxlciB0aGF0IGNhbiBiZSBzaGFyZWQgYnlcbiAqIG11bHRpcGxlIG1peGlucyBvbiBhIGNvbXBvbmVudC4gVGhlIGV2ZW50IGhhbmRsZXIgd2lsbCBpbnZva2UgYSBga2V5ZG93bmBcbiAqIG1ldGhvZCB3aXRoIHRoZSBldmVudCBvYmplY3QsIGFuZCBhbnkgbWl4aW4gYWxvbmcgdGhlIHByb3RvdHlwZSBjaGFpbiB0aGF0XG4gKiB3YW50cyB0byBoYW5kbGUgdGhhdCBtZXRob2QgY2FuIGRvIHNvLlxuICpcbiAqIElmIGEgbWl4aW4gd2FudHMgdG8gaW5kaWNhdGUgdGhhdCBrZXlib2FyZCBldmVudCBoYXMgYmVlbiBoYW5kbGVkLCBhbmQgdGhhdFxuICogb3RoZXIgbWl4aW5zIHNob3VsZCAqbm90KiBoYW5kbGUgaXQsIHRoZSBtaXhpbidzIGBrZXlkb3duYCBoYW5kbGVyIHNob3VsZFxuICogcmV0dXJuIGEgdmFsdWUgb2YgdHJ1ZS4gVGhlIGNvbnZlbnRpb24gdGhhdCBzZWVtcyB0byB3b3JrIHdlbGwgaXMgdGhhdCBhXG4gKiBtaXhpbiBzaG91bGQgc2VlIGlmIGl0IHdhbnRzIHRvIGhhbmRsZSB0aGUgZXZlbnQgYW5kLCBpZiBub3QsIHRoZW4gYXNrIHRoZVxuICogc3VwZXJjbGFzcyB0byBzZWUgaWYgaXQgd2FudHMgdG8gaGFuZGxlIHRoZSBldmVudC4gVGhpcyBoYXMgdGhlIGVmZmVjdCBvZlxuICogZ2l2aW5nIHRoZSBtaXhpbiB0aGF0IHdhcyBhcHBsaWVkIGxhc3QgdGhlIGZpcnN0IGNoYW5jZSBhdCBoYW5kbGluZyBhXG4gKiBrZXlib2FyZCBldmVudC5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgICBbc3ltYm9scy5rZXlkb3duXShldmVudCkge1xuICogICAgICAgbGV0IGhhbmRsZWQ7XG4gKiAgICAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAqICAgICAgICAgLy8gSGFuZGxlIHRoZSBrZXlzIHlvdSB3YW50LCBzZXR0aW5nIGhhbmRsZWQgPSB0cnVlIGlmIGFwcHJvcHJpYXRlLlxuICogICAgICAgfVxuICogICAgICAgLy8gUHJlZmVyIG1peGluIHJlc3VsdCBpZiBpdCdzIGRlZmluZWQsIG90aGVyd2lzZSB1c2UgYmFzZSByZXN1bHQuXG4gKiAgICAgICByZXR1cm4gaGFuZGxlZCB8fCAoc3VwZXJbc3ltYm9scy5rZXlkb3duXSAmJiBzdXBlcltzeW1ib2xzLmtleWRvd25dKGV2ZW50KSk7XG4gKiAgICAgfVxuICpcbiAqIFVudGlsIGlPUyBTYWZhcmkgc3VwcG9ydHMgdGhlIGBLZXlib2FyZEV2ZW50LmtleWAgcHJvcGVydHlcbiAqIChzZWUgaHR0cDovL2Nhbml1c2UuY29tLyNzZWFyY2g9a2V5Ym9hcmRldmVudC5rZXkpLCBtaXhpbnMgc2hvdWxkIGdlbmVyYWxseVxuICogdGVzdCBrZXlzIHVzaW5nIHRoZSBsZWdhY3kgYGtleUNvZGVgIHByb3BlcnR5LCBub3QgYGtleWAuXG4gKlxuICogQSBzZWNvbmQgZmVhdHVyZSBwcm92aWRlZCBieSB0aGlzIG1peGluIGlzIHRoYXQgaXQgaW1wbGljaXRseSBtYWtlcyB0aGVcbiAqIGNvbXBvbmVudCBhIHRhYiBzdG9wIGlmIGl0IGlzbid0IGFscmVhZHksIGJ5IHNldHRpbmcgYHRhYkluZGV4YCB0byAwLiBUaGlzXG4gKiBoYXMgdGhlIGVmZmVjdCBvZiBhZGRpbmcgdGhlIGNvbXBvbmVudCB0byB0aGUgdGFiIG9yZGVyIGluIGRvY3VtZW50IG9yZGVyLlxuICpcbiAqIEBtb2R1bGUgS2V5Ym9hcmRNaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEtleWJvYXJkTWl4aW4oYmFzZSkge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIEtleWJvYXJkIGV4dGVuZHMgYmFzZSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBldmVudCA9PiB7XG4gICAgICAgIHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10gPSB0cnVlO1xuICAgICAgICBjb25zdCBoYW5kbGVkID0gdGhpc1tzeW1ib2xzLmtleWRvd25dKGV2ZW50KTtcbiAgICAgICAgaWYgKGhhbmRsZWQpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbc3ltYm9scy5yYWlzZUNoYW5nZUV2ZW50c10gPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgaWYgKHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKSB7IHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7IH1cbiAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKSA9PSBudWxsICYmIHRoaXNbc3ltYm9scy5kZWZhdWx0c10udGFiaW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS50YWJpbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IFtzeW1ib2xzLmRlZmF1bHRzXSgpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRzID0gc3VwZXJbc3ltYm9scy5kZWZhdWx0c10gfHwge307XG4gICAgICAvLyBUaGUgZGVmYXVsdCB0YWIgaW5kZXggaXMgMCAoZG9jdW1lbnQgb3JkZXIpLlxuICAgICAgZGVmYXVsdHMudGFiaW5kZXggPSAwO1xuICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSB0aGUgaW5kaWNhdGVkIGtleWJvYXJkIGV2ZW50LlxuICAgICAqXG4gICAgICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLiBUaGlzIHdpbGxcbiAgICAgKiB0eXBpY2FsbHkgYmUgaGFuZGxlZCBieSBvdGhlciBtaXhpbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IC0gdGhlIGtleWJvYXJkIGV2ZW50XG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZXZlbnQgd2FzIGhhbmRsZWRcbiAgICAgKi9cbiAgICBbc3ltYm9scy5rZXlkb3duXShldmVudCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMua2V5ZG93bl0pIHsgcmV0dXJuIHN1cGVyW3N5bWJvbHMua2V5ZG93bl0oZXZlbnQpOyB9XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gS2V5Ym9hcmQ7XG59O1xuIiwiaW1wb3J0IGRlZmF1bHRTY3JvbGxUYXJnZXQgZnJvbSAnLi9kZWZhdWx0U2Nyb2xsVGFyZ2V0JztcbmltcG9ydCBzeW1ib2xzIGZyb20gJy4vc3ltYm9scyc7XG5cblxuLyoqXG4gKiBNaXhpbiB3aGljaCBtYXBzIHBhZ2Uga2V5cyAoUGFnZSBVcCwgUGFnZSBEb3duKSBpbnRvIG9wZXJhdGlvbnMgdGhhdCBtb3ZlXG4gKiB0aGUgc2VsZWN0aW9uIGJ5IG9uZSBwYWdlLlxuICpcbiAqIFRoZSBrZXlib2FyZCBpbnRlcmFjdGlvbiBtb2RlbCBnZW5lcmFsbHkgZm9sbG93cyB0aGF0IG9mIE1pY3Jvc29mdCBXaW5kb3dzJ1xuICogbGlzdCBib3hlcyBpbnN0ZWFkIG9mIHRob3NlIGluIE9TIFg6XG4gKlxuICogKiBUaGUgUGFnZSBVcC9Eb3duIGFuZCBIb21lL0VuZCBrZXlzIGFjdHVhbGx5IGNoYW5nZSB0aGUgc2VsZWN0aW9uLCByYXRoZXJcbiAqICAgdGhhbiBqdXN0IHNjcm9sbGluZy4gVGhlIGZvcm1lciBiZWhhdmlvciBzZWVtcyBtb3JlIGdlbmVyYWxseSB1c2VmdWwgZm9yXG4gKiAgIGtleWJvYXJkIHVzZXJzLlxuICpcbiAqICogUHJlc3NpbmcgUGFnZSBVcC9Eb3duIHdpbGwgY2hhbmdlIHRoZSBzZWxlY3Rpb24gdG8gdGhlIHRvcG1vc3QvYm90dG9tbW9zdFxuICogICB2aXNpYmxlIGl0ZW0gaWYgdGhlIHNlbGVjdGlvbiBpcyBub3QgYWxyZWFkeSB0aGVyZS4gVGhlcmVhZnRlciwgdGhlIGtleVxuICogICB3aWxsIG1vdmUgdGhlIHNlbGVjdGlvbiB1cC9kb3duIGJ5IGEgcGFnZSwgYW5kIChwZXIgdGhlIGFib3ZlIHBvaW50KSBtYWtlXG4gKiAgIHRoZSBzZWxlY3RlZCBpdGVtIHZpc2libGUuXG4gKlxuICogVG8gZW5zdXJlIHRoZSBzZWxlY3RlZCBpdGVtIGlzIGluIHZpZXcgZm9sbG93aW5nIHVzZSBvZiBQYWdlIFVwL0Rvd24sIHVzZVxuICogdGhlIHJlbGF0ZWQgW1NlbGVjdGlvbkluVmlld01peGluXShTZWxlY3Rpb25JblZpZXdNaXhpbi5tZCkuXG4gKlxuICogVGhpcyBtaXhpbiBleHBlY3RzIHRoZSBjb21wb25lbnQgdG8gcHJvdmlkZTpcbiAqXG4gKiAqIEEgYFtzeW1ib2xzLmtleWRvd25dYCBtZXRob2QgaW52b2tlZCB3aGVuIGEga2V5IGlzIHByZXNzZWQuIFlvdSBjYW4gdXNlXG4gKiAgIFtLZXlib2FyZE1peGluXShLZXlib2FyZE1peGluLm1kKSBmb3IgdGhhdCBwdXJwb3NlLCBvciB3aXJlIHVwIHlvdXIgb3duXG4gKiAgIGtleWJvYXJkIGhhbmRsaW5nIGFuZCBjYWxsIGBbc3ltYm9scy5rZXlkb3duXWAgeW91cnNlbGYuXG4gKiAqIEEgYHNlbGVjdGVkSW5kZXhgIHByb3BlcnR5IHRoYXQgaW5kaWNhdGVzIHRoZSBpbmRleCBvZiB0aGUgc2VsZWN0ZWQgaXRlbS5cbiAqXG4gKiBAbW9kdWxlIEtleWJvYXJkUGFnZWRTZWxlY3Rpb25NaXhpblxuICogQHBhcmFtIGJhc2Uge0NsYXNzfSB0aGUgYmFzZSBjbGFzcyB0byBleHRlbmRcbiAqIEByZXR1cm5zIHtDbGFzc30gdGhlIGV4dGVuZGVkIGNsYXNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEtleWJvYXJkUGFnZWRTZWxlY3Rpb25NaXhpbihiYXNlKSB7XG5cbiAgLyoqXG4gICAqIFRoZSBjbGFzcyBwcm90b3R5cGUgYWRkZWQgYnkgdGhlIG1peGluLlxuICAgKi9cbiAgY2xhc3MgS2V5Ym9hcmRQYWdlZFNlbGVjdGlvbiBleHRlbmRzIGJhc2Uge1xuXG4gICAgW3N5bWJvbHMua2V5ZG93bl0oZXZlbnQpIHtcbiAgICAgIGxldCBoYW5kbGVkID0gZmFsc2U7XG4gICAgICBjb25zdCBvcmllbnRhdGlvbiA9IHRoaXNbc3ltYm9scy5vcmllbnRhdGlvbl07XG4gICAgICBpZiAob3JpZW50YXRpb24gIT09ICdob3Jpem9udGFsJykge1xuICAgICAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgICAgICBjYXNlIDMzOiAvLyBQYWdlIFVwXG4gICAgICAgICAgaGFuZGxlZCA9IHRoaXMucGFnZVVwKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAzNDogLy8gUGFnZSBEb3duXG4gICAgICAgICAgaGFuZGxlZCA9IHRoaXMucGFnZURvd24oKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gUHJlZmVyIG1peGluIHJlc3VsdCBpZiBpdCdzIGRlZmluZWQsIG90aGVyd2lzZSB1c2UgYmFzZSByZXN1bHQuXG4gICAgICByZXR1cm4gaGFuZGxlZCB8fCAoc3VwZXJbc3ltYm9scy5rZXlkb3duXSAmJiBzdXBlcltzeW1ib2xzLmtleWRvd25dKGV2ZW50KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2Nyb2xsIGRvd24gb25lIHBhZ2UuXG4gICAgICovXG4gICAgcGFnZURvd24oKSB7XG4gICAgICBpZiAoc3VwZXIucGFnZURvd24pIHsgc3VwZXIucGFnZURvd24oKTsgfVxuICAgICAgcmV0dXJuIHNjcm9sbE9uZVBhZ2UodGhpcywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2Nyb2xsIHVwIG9uZSBwYWdlLlxuICAgICAqL1xuICAgIHBhZ2VVcCgpIHtcbiAgICAgIGlmIChzdXBlci5wYWdlVXApIHsgc3VwZXIucGFnZVVwKCk7IH1cbiAgICAgIHJldHVybiBzY3JvbGxPbmVQYWdlKHRoaXMsIGZhbHNlKTtcbiAgICB9XG5cbiAgICAvKiBQcm92aWRlIGEgZGVmYXVsdCBzY3JvbGxUYXJnZXQgaW1wbGVtZW50YXRpb24gaWYgbm9uZSBleGlzdHMuICovXG4gICAgZ2V0IFtzeW1ib2xzLnNjcm9sbFRhcmdldF0oKSB7XG4gICAgICByZXR1cm4gc3VwZXJbc3ltYm9scy5zY3JvbGxUYXJnZXRdIHx8IGRlZmF1bHRTY3JvbGxUYXJnZXQodGhpcyk7XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gS2V5Ym9hcmRQYWdlZFNlbGVjdGlvbjtcbn1cblxuXG4vLyBSZXR1cm4gdGhlIGl0ZW0gd2hvc2UgY29udGVudCBzcGFucyB0aGUgZ2l2ZW4geSBwb3NpdGlvbiAocmVsYXRpdmUgdG8gdGhlXG4vLyB0b3Agb2YgdGhlIGxpc3QncyBzY3JvbGxpbmcgY2xpZW50IGFyZWEpLCBvciBudWxsIGlmIG5vdCBmb3VuZC5cbi8vXG4vLyBJZiBkb3dud2FyZCBpcyB0cnVlLCBtb3ZlIGRvd24gdGhlIGxpc3Qgb2YgaXRlbXMgdG8gZmluZCB0aGUgZmlyc3QgaXRlbVxuLy8gZm91bmQgYXQgdGhlIGdpdmVuIHkgcG9zaXRpb247IGlmIGRvd253YXJkIGlzIGZhbHNlLCBtb3ZlIHVwIHRoZSBsaXN0IG9mXG4vLyBpdGVtcyB0byBmaW5kIHRoZSBsYXN0IGl0ZW0gYXQgdGhhdCBwb3NpdGlvbi5cbmZ1bmN0aW9uIGdldEluZGV4T2ZJdGVtQXRZKGVsZW1lbnQsIHNjcm9sbFRhcmdldCwgeSwgZG93bndhcmQpIHtcblxuICBjb25zdCBpdGVtcyA9IGVsZW1lbnQuaXRlbXM7XG4gIGNvbnN0IHN0YXJ0ID0gZG93bndhcmQgPyAwIDogaXRlbXMubGVuZ3RoIC0gMTtcbiAgY29uc3QgZW5kID0gZG93bndhcmQgPyBpdGVtcy5sZW5ndGggOiAwO1xuICBjb25zdCBzdGVwID0gZG93bndhcmQgPyAxIDogLTE7XG5cbiAgY29uc3QgdG9wT2ZDbGllbnRBcmVhID0gc2Nyb2xsVGFyZ2V0Lm9mZnNldFRvcCArIHNjcm9sbFRhcmdldC5jbGllbnRUb3A7XG5cbiAgLy8gRmluZCB0aGUgaXRlbSBzcGFubmluZyB0aGUgaW5kaWNhdGVkIHkgY29vcmRpbmF0ZS5cbiAgbGV0IGl0ZW07XG4gIGxldCBpdGVtSW5kZXggPSBzdGFydDtcbiAgbGV0IGl0ZW1Ub3A7XG4gIGxldCBmb3VuZCA9IGZhbHNlO1xuICB3aGlsZSAoaXRlbUluZGV4ICE9PSBlbmQpIHtcbiAgICBpdGVtID0gaXRlbXNbaXRlbUluZGV4XTtcbiAgICBpdGVtVG9wID0gaXRlbS5vZmZzZXRUb3AgLSB0b3BPZkNsaWVudEFyZWE7XG4gICAgY29uc3QgaXRlbUJvdHRvbSA9IGl0ZW1Ub3AgKyBpdGVtLm9mZnNldEhlaWdodDtcbiAgICBpZiAoaXRlbVRvcCA8PSB5ICYmIGl0ZW1Cb3R0b20gPj0geSkge1xuICAgICAgLy8gSXRlbSBzcGFucyB0aGUgaW5kaWNhdGVkIHkgY29vcmRpbmF0ZS5cbiAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpdGVtSW5kZXggKz0gc3RlcDtcbiAgfVxuXG4gIGlmICghZm91bmQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFdlIG1heSBoYXZlIGZvdW5kIGFuIGl0ZW0gd2hvc2UgcGFkZGluZyBzcGFucyB0aGUgZ2l2ZW4geSBjb29yZGluYXRlLFxuICAvLyBidXQgd2hvc2UgY29udGVudCBpcyBhY3R1YWxseSBhYm92ZS9iZWxvdyB0aGF0IHBvaW50LlxuICAvLyBUT0RPOiBJZiB0aGUgaXRlbSBoYXMgYSBib3JkZXIsIHRoZW4gcGFkZGluZyBzaG91bGQgYmUgaW5jbHVkZWQgaW5cbiAgLy8gY29uc2lkZXJpbmcgYSBoaXQuXG4gIGNvbnN0IGl0ZW1TdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoaXRlbSk7XG4gIGNvbnN0IGl0ZW1QYWRkaW5nVG9wID0gcGFyc2VGbG9hdChpdGVtU3R5bGUucGFkZGluZ1RvcCk7XG4gIGNvbnN0IGl0ZW1QYWRkaW5nQm90dG9tID0gcGFyc2VGbG9hdChpdGVtU3R5bGUucGFkZGluZ0JvdHRvbSk7XG4gIGNvbnN0IGNvbnRlbnRUb3AgPSBpdGVtVG9wICsgaXRlbS5jbGllbnRUb3AgKyBpdGVtUGFkZGluZ1RvcDtcbiAgY29uc3QgY29udGVudEJvdHRvbSA9IGNvbnRlbnRUb3AgKyBpdGVtLmNsaWVudEhlaWdodCAtIGl0ZW1QYWRkaW5nVG9wIC0gaXRlbVBhZGRpbmdCb3R0b207XG4gIGlmIChkb3dud2FyZCAmJiBjb250ZW50VG9wIDw9IHkgfHwgIWRvd253YXJkICYmIGNvbnRlbnRCb3R0b20gPj0geSkge1xuICAgIC8vIFRoZSBpbmRpY2F0ZWQgY29vcmRpbmF0ZSBoaXRzIHRoZSBhY3R1YWwgaXRlbSBjb250ZW50LlxuICAgIHJldHVybiBpdGVtSW5kZXg7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gVGhlIGluZGljYXRlZCBjb29yZGluYXRlIGZhbGxzIHdpdGhpbiB0aGUgaXRlbSdzIHBhZGRpbmcuIEJhY2sgdXAgdG9cbiAgICAvLyB0aGUgaXRlbSBiZWxvdy9hYm92ZSB0aGUgaXRlbSB3ZSBmb3VuZCBhbmQgcmV0dXJuIHRoYXQuXG4gICAgcmV0dXJuIGl0ZW1JbmRleCAtIHN0ZXA7XG4gIH1cbn1cblxuLy8gTW92ZSBieSBvbmUgcGFnZSBkb3dud2FyZCAoaWYgZG93bndhcmQgaXMgdHJ1ZSksIG9yIHVwd2FyZCAoaWYgZmFsc2UpLlxuLy8gUmV0dXJuIHRydWUgaWYgd2UgZW5kZWQgdXAgY2hhbmdpbmcgdGhlIHNlbGVjdGlvbiwgZmFsc2UgaWYgbm90LlxuZnVuY3Rpb24gc2Nyb2xsT25lUGFnZShlbGVtZW50LCBkb3dud2FyZCkge1xuXG4gIC8vIERldGVybWluZSB0aGUgaXRlbSB2aXNpYmxlIGp1c3QgYXQgdGhlIGVkZ2Ugb2YgZGlyZWN0aW9uIHdlJ3JlIGhlYWRpbmcuXG4gIC8vIFdlJ2xsIHNlbGVjdCB0aGF0IGl0ZW0gaWYgaXQncyBub3QgYWxyZWFkeSBzZWxlY3RlZC5cbiAgY29uc3Qgc2Nyb2xsVGFyZ2V0ID0gZWxlbWVudFtzeW1ib2xzLnNjcm9sbFRhcmdldF07XG4gIGNvbnN0IGVkZ2UgPSBzY3JvbGxUYXJnZXQuc2Nyb2xsVG9wICsgKGRvd253YXJkID8gc2Nyb2xsVGFyZ2V0LmNsaWVudEhlaWdodCA6IDApO1xuICBjb25zdCBpbmRleE9mSXRlbUF0RWRnZSA9IGdldEluZGV4T2ZJdGVtQXRZKGVsZW1lbnQsIHNjcm9sbFRhcmdldCwgZWRnZSwgZG93bndhcmQpO1xuXG4gIGNvbnN0IHNlbGVjdGVkSW5kZXggPSBlbGVtZW50LnNlbGVjdGVkSW5kZXg7XG4gIGxldCBuZXdJbmRleDtcbiAgaWYgKGluZGV4T2ZJdGVtQXRFZGdlICYmIHNlbGVjdGVkSW5kZXggPT09IGluZGV4T2ZJdGVtQXRFZGdlKSB7XG4gICAgLy8gVGhlIGl0ZW0gYXQgdGhlIGVkZ2Ugd2FzIGFscmVhZHkgc2VsZWN0ZWQsIHNvIHNjcm9sbCBpbiB0aGUgaW5kaWNhdGVkXG4gICAgLy8gZGlyZWN0aW9uIGJ5IG9uZSBwYWdlLiBMZWF2ZSB0aGUgbmV3IGl0ZW0gYXQgdGhhdCBlZGdlIHNlbGVjdGVkLlxuICAgIGNvbnN0IGRlbHRhID0gKGRvd253YXJkID8gMSA6IC0xKSAqIHNjcm9sbFRhcmdldC5jbGllbnRIZWlnaHQ7XG4gICAgbmV3SW5kZXggPSBnZXRJbmRleE9mSXRlbUF0WShlbGVtZW50LCBzY3JvbGxUYXJnZXQsIGVkZ2UgKyBkZWx0YSwgZG93bndhcmQpO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIFRoZSBpdGVtIGF0IHRoZSBlZGdlIHdhc24ndCBzZWxlY3RlZCB5ZXQuIEluc3RlYWQgb2Ygc2Nyb2xsaW5nLCB3ZSdsbFxuICAgIC8vIGp1c3Qgc2VsZWN0IHRoYXQgaXRlbS4gVGhhdCBpcywgdGhlIGZpcnN0IGF0dGVtcHQgdG8gcGFnZSB1cC9kb3duXG4gICAgLy8gdXN1YWxseSBqdXN0IG1vdmVzIHRoZSBzZWxlY3Rpb24gdG8gdGhlIGVkZ2UgaW4gdGhhdCBkaXJlY3Rpb24uXG4gICAgbmV3SW5kZXggPSBpbmRleE9mSXRlbUF0RWRnZTtcbiAgfVxuXG4gIGlmICghbmV3SW5kZXgpIHtcbiAgICAvLyBXZSBjYW4ndCBmaW5kIGFuIGl0ZW0gaW4gdGhlIGRpcmVjdGlvbiB3ZSB3YW50IHRvIHRyYXZlbC4gU2VsZWN0IHRoZVxuICAgIC8vIGxhc3QgaXRlbSAoaWYgbW92aW5nIGRvd253YXJkKSBvciBmaXJzdCBpdGVtIChpZiBtb3ZpbmcgdXB3YXJkKS5cbiAgICBuZXdJbmRleCA9IChkb3dud2FyZCA/IGVsZW1lbnQuaXRlbXMubGVuZ3RoIC0gMSA6IDApO1xuICB9XG5cbiAgaWYgKG5ld0luZGV4ICE9PSBzZWxlY3RlZEluZGV4KSB7XG4gICAgZWxlbWVudC5zZWxlY3RlZEluZGV4ID0gbmV3SW5kZXg7XG4gICAgcmV0dXJuIHRydWU7IC8vIFdlIGhhbmRsZWQgdGhlIHBhZ2UgdXAvZG93biBvdXJzZWx2ZXMuXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBXZSBkaWRuJ3QgZG8gYW55dGhpbmcuXG4gIH1cbn1cbiIsImltcG9ydCBjb25zdGFudHMgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IFN5bWJvbCBmcm9tICcuL1N5bWJvbCc7XG5pbXBvcnQgc3ltYm9scyBmcm9tICcuL3N5bWJvbHMnO1xuXG5cbi8vIFN5bWJvbHMgZm9yIHByaXZhdGUgZGF0YSBtZW1iZXJzIG9uIGFuIGVsZW1lbnQuXG5jb25zdCBpdGVtVGV4dENvbnRlbnRzU3ltYm9sID0gU3ltYm9sKCdpdGVtVGV4dENvbnRlbnRzJyk7XG5jb25zdCB0eXBlZFByZWZpeFN5bWJvbCA9IFN5bWJvbCgndHlwZWRQcmVmaXgnKTtcbmNvbnN0IHByZWZpeFRpbWVvdXRTeW1ib2wgPSBTeW1ib2woJ3ByZWZpeFRpbWVvdXQnKTtcbmNvbnN0IHNldHRpbmdTZWxlY3Rpb25TeW1ib2wgPSBTeW1ib2woJ3NldHRpbmdTZWxlY3Rpb24nKTtcblxuXG4vKipcbiAqIE1peGluIHRoYXQgaGFuZGxlcyBsaXN0IGJveC1zdHlsZSBwcmVmaXggdHlwaW5nLCBpbiB3aGljaCB0aGUgdXNlciBjYW4gdHlwZVxuICogYSBzdHJpbmcgdG8gc2VsZWN0IHRoZSBmaXJzdCBpdGVtIHRoYXQgYmVnaW5zIHdpdGggdGhhdCBzdHJpbmcuXG4gKlxuICogRXhhbXBsZTogc3VwcG9zZSBhIGNvbXBvbmVudCB1c2luZyB0aGlzIG1peGluIGhhcyB0aGUgZm9sbG93aW5nIGl0ZW1zOlxuICpcbiAqICAgICA8c2FtcGxlLWxpc3QtY29tcG9uZW50PlxuICogICAgICAgPGRpdj5BcHBsZTwvZGl2PlxuICogICAgICAgPGRpdj5BcHJpY290PC9kaXY+XG4gKiAgICAgICA8ZGl2PkJhbmFuYTwvZGl2PlxuICogICAgICAgPGRpdj5CbGFja2JlcnJ5PC9kaXY+XG4gKiAgICAgICA8ZGl2PkJsdWViZXJyeTwvZGl2PlxuICogICAgICAgPGRpdj5DYW50YWxvdXBlPC9kaXY+XG4gKiAgICAgICA8ZGl2PkNoZXJyeTwvZGl2PlxuICogICAgICAgPGRpdj5MZW1vbjwvZGl2PlxuICogICAgICAgPGRpdj5MaW1lPC9kaXY+XG4gKiAgICAgPC9zYW1wbGUtbGlzdC1jb21wb25lbnQ+XG4gKlxuICogSWYgdGhpcyBjb21wb25lbnQgcmVjZWl2ZXMgdGhlIGZvY3VzLCBhbmQgdGhlIHVzZXIgcHJlc3NlcyB0aGUgXCJiXCIgb3IgXCJCXCJcbiAqIGtleSwgdGhlIFwiQmFuYW5hXCIgaXRlbSB3aWxsIGJlIHNlbGVjdGVkLCBiZWNhdXNlIGl0J3MgdGhlIGZpcnN0IGl0ZW0gdGhhdFxuICogbWF0Y2hlcyB0aGUgcHJlZml4IFwiYlwiLiAoTWF0Y2hpbmcgaXMgY2FzZS1pbnNlbnNpdGl2ZS4pIElmIHRoZSB1c2VyIG5vd1xuICogcHJlc3NlcyB0aGUgXCJsXCIgb3IgXCJMXCIga2V5IHF1aWNrbHksIHRoZSBwcmVmaXggdG8gbWF0Y2ggYmVjb21lcyBcImJsXCIsIHNvXG4gKiBcIkJsYWNrYmVycnlcIiB3aWxsIGJlIHNlbGVjdGVkLlxuICpcbiAqIFRoZSBwcmVmaXggdHlwaW5nIGZlYXR1cmUgaGFzIGEgb25lIHNlY29uZCB0aW1lb3V0IOKAlMKgdGhlIHByZWZpeCB0byBtYXRjaFxuICogd2lsbCBiZSByZXNldCBhZnRlciBhIHNlY29uZCBoYXMgcGFzc2VkIHNpbmNlIHRoZSB1c2VyIGxhc3QgdHlwZWQgYSBrZXkuXG4gKiBJZiwgaW4gdGhlIGFib3ZlIGV4YW1wbGUsIHRoZSB1c2VyIHdhaXRzIGEgc2Vjb25kIGJldHdlZW4gdHlwaW5nIFwiYlwiIGFuZFxuICogXCJsXCIsIHRoZSBwcmVmaXggd2lsbCBiZWNvbWUgXCJsXCIsIHNvIFwiTGVtb25cIiB3b3VsZCBiZSBzZWxlY3RlZC5cbiAqXG4gKiBUaGlzIG1peGluIGV4cGVjdHMgdGhlIGNvbXBvbmVudCB0byBpbnZva2UgYSBga2V5ZG93bmAgbWV0aG9kIHdoZW4gYSBrZXkgaXNcbiAqIHByZXNzZWQuIFlvdSBjYW4gdXNlIFtLZXlib2FyZE1peGluXShLZXlib2FyZE1peGluLm1kKSBmb3IgdGhhdFxuICogcHVycG9zZSwgb3Igd2lyZSB1cCB5b3VyIG93biBrZXlib2FyZCBoYW5kbGluZyBhbmQgY2FsbCBga2V5ZG93bmAgeW91cnNlbGYuXG4gKlxuICogVGhpcyBtaXhpbiBhbHNvIGV4cGVjdHMgdGhlIGNvbXBvbmVudCB0byBwcm92aWRlIGFuIGBpdGVtc2AgcHJvcGVydHkuIFRoZVxuICogYHRleHRDb250ZW50YCBvZiB0aG9zZSBpdGVtcyB3aWxsIGJlIHVzZWQgZm9yIHB1cnBvc2VzIG9mIHByZWZpeCBtYXRjaGluZy5cbiAqXG4gKiBAbW9kdWxlIEtleWJvYXJkUHJlZml4U2VsZWN0aW9uTWl4aW5cbiAqIEBwYXJhbSBiYXNlIHtDbGFzc30gdGhlIGJhc2UgY2xhc3MgdG8gZXh0ZW5kXG4gKiBAcmV0dXJucyB7Q2xhc3N9IHRoZSBleHRlbmRlZCBjbGFzc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBLZXlib2FyZFByZWZpeFNlbGVjdGlvbk1peGluKGJhc2UpIHtcblxuICAvKipcbiAgICogVGhlIGNsYXNzIHByb3RvdHlwZSBhZGRlZCBieSB0aGUgbWl4aW4uXG4gICAqL1xuICBjbGFzcyBLZXlib2FyZFByZWZpeFNlbGVjdGlvbiBleHRlbmRzIGJhc2Uge1xuXG4gICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiByZXR1cm5zIGFuIGl0ZW0ncyBgYWx0YCBhdHRyaWJ1dGUgb3IgaXRzXG4gICAgLy8gYHRleHRDb250ZW50YCwgaW4gdGhhdCBvcmRlci5cbiAgICBbc3ltYm9scy5nZXRJdGVtVGV4dF0oaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0QXR0cmlidXRlKCdhbHQnKSB8fCBpdGVtLnRleHRDb250ZW50O1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBzZXQgb2YgaXRlbXMgaGFzIGNoYW5nZWQsIHJlc2V0IHRoZSBwcmVmaXguIFdlJ2xsIGFsc28gbmVlZCB0b1xuICAgIC8vIHJlYnVpbGQgb3VyIGNhY2hlIG9mIGl0ZW0gdGV4dCB0aGUgbmV4dCB0aW1lIHdlJ3JlIGFza2VkIGZvciBpdC5cbiAgICBbc3ltYm9scy5pdGVtc0NoYW5nZWRdKCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbXNDaGFuZ2VkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1zQ2hhbmdlZF0oKTsgfVxuICAgICAgdGhpc1tpdGVtVGV4dENvbnRlbnRzU3ltYm9sXSA9IG51bGw7XG4gICAgICByZXNldFR5cGVkUHJlZml4KHRoaXMpO1xuICAgIH1cblxuICAgIFtzeW1ib2xzLmtleWRvd25dKGV2ZW50KSB7XG4gICAgICBsZXQgaGFuZGxlZDtcbiAgICAgIGxldCByZXNldFByZWZpeCA9IHRydWU7XG5cbiAgICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgICBjYXNlIDg6IC8vIEJhY2tzcGFjZVxuICAgICAgICAgIGhhbmRsZUJhY2tzcGFjZSh0aGlzKTtcbiAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICByZXNldFByZWZpeCA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI3OiAvLyBFc2NhcGVcbiAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWV2ZW50LmN0cmxLZXkgJiYgIWV2ZW50Lm1ldGFLZXkgJiYgIWV2ZW50LmFsdEtleSAmJlxuICAgICAgICAgICAgICBldmVudC53aGljaCAhPT0gMzIgLyogU3BhY2UgKi8pIHtcbiAgICAgICAgICAgIGhhbmRsZVBsYWluQ2hhcmFjdGVyKHRoaXMsIFN0cmluZy5mcm9tQ2hhckNvZGUoZXZlbnQua2V5Q29kZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNldFByZWZpeCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzZXRQcmVmaXgpIHtcbiAgICAgICAgcmVzZXRUeXBlZFByZWZpeCh0aGlzKTtcbiAgICAgIH1cblxuICAgICAgLy8gUHJlZmVyIG1peGluIHJlc3VsdCBpZiBpdCdzIGRlZmluZWQsIG90aGVyd2lzZSB1c2UgYmFzZSByZXN1bHQuXG4gICAgICByZXR1cm4gaGFuZGxlZCB8fCAoc3VwZXJbc3ltYm9scy5rZXlkb3duXSAmJiBzdXBlcltzeW1ib2xzLmtleWRvd25dKGV2ZW50KSk7XG4gICAgfVxuXG4gICAgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7XG4gICAgICByZXR1cm4gc3VwZXIuc2VsZWN0ZWRJbmRleDtcbiAgICB9XG4gICAgc2V0IHNlbGVjdGVkSW5kZXgoaW5kZXgpIHtcbiAgICAgIGlmICgnc2VsZWN0ZWRJbmRleCcgaW4gYmFzZS5wcm90b3R5cGUpIHsgc3VwZXIuc2VsZWN0ZWRJbmRleCA9IGluZGV4OyB9XG4gICAgICBpZiAoIXRoaXNbc2V0dGluZ1NlbGVjdGlvblN5bWJvbF0pIHtcbiAgICAgICAgLy8gU29tZW9uZSBlbHNlIChub3QgdGhpcyBtaXhpbikgaGFzIGNoYW5nZWQgdGhlIHNlbGVjdGlvbi4gSW4gcmVzcG9uc2UsXG4gICAgICAgIC8vIHdlIGludmFsaWRhdGUgdGhlIHByZWZpeCB1bmRlciBjb25zdHJ1Y3Rpb24uXG4gICAgICAgIHJlc2V0VHlwZWRQcmVmaXgodGhpcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VsZWN0IHRoZSBmaXJzdCBpdGVtIHdob3NlIHRleHQgY29udGVudCBiZWdpbnMgd2l0aCB0aGUgZ2l2ZW4gcHJlZml4LlxuICAgICAqXG4gICAgICogQHBhcmFtIHByZWZpeCBbU3RyaW5nXSBUaGUgcHJlZml4IHN0cmluZyB0byBzZWFyY2ggZm9yXG4gICAgICovXG4gICAgc2VsZWN0SXRlbVdpdGhUZXh0UHJlZml4KHByZWZpeCkge1xuICAgICAgaWYgKHN1cGVyLnNlbGVjdEl0ZW1XaXRoVGV4dFByZWZpeCkgeyBzdXBlci5zZWxlY3RJdGVtV2l0aFRleHRQcmVmaXgocHJlZml4KTsgfVxuICAgICAgaWYgKHByZWZpeCA9PSBudWxsIHx8IHByZWZpeC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgaW5kZXggPSBnZXRJbmRleE9mSXRlbVdpdGhUZXh0UHJlZml4KHRoaXMsIHByZWZpeCk7XG4gICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAvLyBVcGRhdGUgdGhlIHNlbGVjdGlvbi4gRHVyaW5nIHRoYXQgb3BlcmF0aW9uLCBzZXQgdGhlIGZsYWcgdGhhdCBsZXRzXG4gICAgICAgIC8vIHVzIGtub3cgdGhhdCB3ZSBhcmUgdGhlIGNhdXNlIG9mIHRoZSBzZWxlY3Rpb24gY2hhbmdlLiBTZWUgbm90ZSBhdFxuICAgICAgICAvLyB0aGlzIG1peGluJ3MgYHNlbGVjdGVkSW5kZXhgIGltcGxlbWVudGF0aW9uLlxuICAgICAgICB0aGlzW3NldHRpbmdTZWxlY3Rpb25TeW1ib2xdID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgICAgIHRoaXNbc2V0dGluZ1NlbGVjdGlvblN5bWJvbF0gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiBLZXlib2FyZFByZWZpeFNlbGVjdGlvbjtcbn1cblxuXG4vLyBSZXR1cm4gdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBpdGVtIHdpdGggdGhlIGdpdmVuIHByZWZpeCwgZWxzZSAtMS5cbmZ1bmN0aW9uIGdldEluZGV4T2ZJdGVtV2l0aFRleHRQcmVmaXgoZWxlbWVudCwgcHJlZml4KSB7XG4gIGNvbnN0IGl0ZW1UZXh0Q29udGVudHMgPSBnZXRJdGVtVGV4dENvbnRlbnRzKGVsZW1lbnQpO1xuICBjb25zdCBwcmVmaXhMZW5ndGggPSBwcmVmaXgubGVuZ3RoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1UZXh0Q29udGVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBpdGVtVGV4dENvbnRlbnQgPSBpdGVtVGV4dENvbnRlbnRzW2ldO1xuICAgIGlmIChpdGVtVGV4dENvbnRlbnQuc3Vic3RyKDAsIHByZWZpeExlbmd0aCkgPT09IHByZWZpeCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLy8gUmV0dXJuIGFuIGFycmF5IG9mIHRoZSB0ZXh0IGNvbnRlbnQgKGluIGxvd2VyY2FzZSkgb2YgYWxsIGl0ZW1zLlxuLy8gQ2FjaGUgdGhlc2UgcmVzdWx0cy5cbmZ1bmN0aW9uIGdldEl0ZW1UZXh0Q29udGVudHMoZWxlbWVudCkge1xuICBpZiAoIWVsZW1lbnRbaXRlbVRleHRDb250ZW50c1N5bWJvbF0pIHtcbiAgICBjb25zdCBpdGVtcyA9IGVsZW1lbnQuaXRlbXM7XG4gICAgZWxlbWVudFtpdGVtVGV4dENvbnRlbnRzU3ltYm9sXSA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbChpdGVtcywgaXRlbSA9PiB7XG4gICAgICBjb25zdCB0ZXh0ID0gZWxlbWVudFtzeW1ib2xzLmdldEl0ZW1UZXh0XShpdGVtKTtcbiAgICAgIHJldHVybiB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGVsZW1lbnRbaXRlbVRleHRDb250ZW50c1N5bWJvbF07XG59XG5cbi8vIEhhbmRsZSB0aGUgQmFja3NwYWNlIGtleTogcmVtb3ZlIHRoZSBsYXN0IGNoYXJhY3RlciBmcm9tIHRoZSBwcmVmaXguXG5mdW5jdGlvbiBoYW5kbGVCYWNrc3BhY2UoZWxlbWVudCkge1xuICBjb25zdCBsZW5ndGggPSBlbGVtZW50W3R5cGVkUHJlZml4U3ltYm9sXSA/IGVsZW1lbnRbdHlwZWRQcmVmaXhTeW1ib2xdLmxlbmd0aCA6IDA7XG4gIGlmIChsZW5ndGggPiAwKSB7XG4gICAgZWxlbWVudFt0eXBlZFByZWZpeFN5bWJvbF0gPSBlbGVtZW50W3R5cGVkUHJlZml4U3ltYm9sXS5zdWJzdHIoMCwgbGVuZ3RoIC0gMSk7XG4gIH1cbiAgZWxlbWVudC5zZWxlY3RJdGVtV2l0aFRleHRQcmVmaXgoZWxlbWVudFt0eXBlZFByZWZpeFN5bWJvbF0pO1xuICBzZXRQcmVmaXhUaW1lb3V0KGVsZW1lbnQpO1xufVxuXG4vLyBBZGQgYSBwbGFpbiBjaGFyYWN0ZXIgdG8gdGhlIHByZWZpeC5cbmZ1bmN0aW9uIGhhbmRsZVBsYWluQ2hhcmFjdGVyKGVsZW1lbnQsIGNoYXIpIHtcbiAgY29uc3QgcHJlZml4ID0gZWxlbWVudFt0eXBlZFByZWZpeFN5bWJvbF0gfHwgJyc7XG4gIGVsZW1lbnRbdHlwZWRQcmVmaXhTeW1ib2xdID0gcHJlZml4ICsgY2hhci50b0xvd2VyQ2FzZSgpO1xuICBlbGVtZW50LnNlbGVjdEl0ZW1XaXRoVGV4dFByZWZpeChlbGVtZW50W3R5cGVkUHJlZml4U3ltYm9sXSk7XG4gIHNldFByZWZpeFRpbWVvdXQoZWxlbWVudCk7XG59XG5cbi8vIFN0b3AgbGlzdGVuaW5nIGZvciB0eXBpbmcuXG5mdW5jdGlvbiByZXNldFByZWZpeFRpbWVvdXQoZWxlbWVudCkge1xuICBpZiAoZWxlbWVudFtwcmVmaXhUaW1lb3V0U3ltYm9sXSkge1xuICAgIGNsZWFyVGltZW91dChlbGVtZW50W3ByZWZpeFRpbWVvdXRTeW1ib2xdKTtcbiAgICBlbGVtZW50W3ByZWZpeFRpbWVvdXRTeW1ib2xdID0gZmFsc2U7XG4gIH1cbn1cblxuLy8gQ2xlYXIgdGhlIHByZWZpeCB1bmRlciBjb25zdHJ1Y3Rpb24uXG5mdW5jdGlvbiByZXNldFR5cGVkUHJlZml4KGVsZW1lbnQpIHtcbiAgZWxlbWVudFt0eXBlZFByZWZpeFN5bWJvbF0gPSAnJztcbiAgcmVzZXRQcmVmaXhUaW1lb3V0KGVsZW1lbnQpO1xufVxuXG4vLyBXYWl0IGZvciB0aGUgdXNlciB0byBzdG9wIHR5cGluZy5cbmZ1bmN0aW9uIHNldFByZWZpeFRpbWVvdXQoZWxlbWVudCkge1xuICByZXNldFByZWZpeFRpbWVvdXQoZWxlbWVudCk7XG4gIGVsZW1lbnRbcHJlZml4VGltZW91dFN5bWJvbF0gPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICByZXNldFR5cGVkUHJlZml4KGVsZW1lbnQpO1xuICB9LCBjb25zdGFudHMuVFlQSU5HX1RJTUVPVVRfRFVSQVRJT04pO1xufVxuIiwiaW1wb3J0IHN5bWJvbHMgZnJvbSAnLi9zeW1ib2xzJztcblxuXG4vLyBVc2VkIHRvIGFzc2lnbiB1bmlxdWUgSURzIHRvIGl0ZW0gZWxlbWVudHMgd2l0aG91dCBJRHMuXG5sZXQgaWRDb3VudCA9IDA7XG5cblxuLyoqXG4gKiBNaXhpbiB3aGljaCB0cmVhdHMgdGhlIHNlbGVjdGVkIGl0ZW0gaW4gYSBsaXN0IGFzIHRoZSBhY3RpdmUgaXRlbSBpbiBBUklBXG4gKiBhY2Nlc3NpYmlsaXR5IHRlcm1zLlxuICpcbiAqIEhhbmRsaW5nIEFSSUEgc2VsZWN0aW9uIHN0YXRlIHByb3Blcmx5IGlzIGFjdHVhbGx5IHF1aXRlIGNvbXBsZXg6XG4gKlxuICogKiBUaGUgaXRlbXMgaW4gdGhlIGxpc3QgbmVlZCB0byBiZSBpbmRpY2F0ZWQgYXMgcG9zc2libGUgaXRlbXMgdmlhIGFuIEFSSUFcbiAqICAgYHJvbGVgIGF0dHJpYnV0ZSB2YWx1ZSBzdWNoIGFzIFwib3B0aW9uXCIuXG4gKiAqIFRoZSBzZWxlY3RlZCBpdGVtIG5lZWQgdG8gYmUgbWFya2VkIGFzIHNlbGVjdGVkIGJ5IHNldHRpbmcgdGhlIGl0ZW0nc1xuICogICBgYXJpYS1zZWxlY3RlZGAgYXR0cmlidXRlIHRvIHRydWUgKmFuZCogdGhlIG90aGVyIGl0ZW1zIG5lZWQgYmUgbWFya2VkIGFzXG4gKiAgICpub3QqIHNlbGVjdGVkIGJ5IHNldHRpbmcgYGFyaWEtc2VsZWN0ZWRgIHRvIGZhbHNlLlxuICogKiBUaGUgb3V0ZXJtb3N0IGVsZW1lbnQgd2l0aCB0aGUga2V5Ym9hcmQgZm9jdXMgbmVlZHMgdG8gaGF2ZSBhdHRyaWJ1dGVzXG4gKiAgIHNldCBvbiBpdCBzbyB0aGF0IHRoZSBzZWxlY3Rpb24gaXMga25vd2FibGUgYXQgdGhlIGxpc3QgbGV2ZWwgdmlhIHRoZVxuICogICBgYXJpYS1hY3RpdmVkZXNjZW5kYW50YCBhdHRyaWJ1dGUuXG4gKiAqIFVzZSBvZiBgYXJpYS1hY3RpdmVkZXNjZW5kYW50YCBpbiB0dXJuIHJlcXVpcmVzIHRoYXQgYWxsIGl0ZW1zIGluIHRoZVxuICogICBsaXN0IGhhdmUgSUQgYXR0cmlidXRlcyBhc3NpZ25lZCB0byB0aGVtLlxuICpcbiAqIFRoaXMgbWl4aW4gdHJpZXMgdG8gYWRkcmVzcyBhbGwgb2YgdGhlIGFib3ZlIHJlcXVpcmVtZW50cy4gVG8gdGhhdCBlbmQsXG4gKiB0aGlzIG1peGluIHdpbGwgYXNzaWduIGdlbmVyYXRlZCBJRHMgdG8gYW55IGl0ZW0gdGhhdCBkb2Vzbid0IGFscmVhZHkgaGF2ZVxuICogYW4gSUQuXG4gKlxuICogQVJJQSByZWxpZXMgb24gZWxlbWVudHMgdG8gcHJvdmlkZSBgcm9sZWAgYXR0cmlidXRlcy4gVGhpcyBtaXhpbiB3aWxsIGFwcGx5XG4gKiBhIGRlZmF1bHQgcm9sZSBvZiBcImxpc3Rib3hcIiBvbiB0aGUgb3V0ZXIgbGlzdCBpZiBpdCBkb2Vzbid0IGFscmVhZHkgaGF2ZSBhblxuICogZXhwbGljaXQgcm9sZS4gU2ltaWxhcmx5LCB0aGlzIG1peGluIHdpbGwgYXBwbHkgYSBkZWZhdWx0IHJvbGUgb2YgXCJvcHRpb25cIlxuICogdG8gYW55IGxpc3QgaXRlbSB0aGF0IGRvZXMgbm90IGFscmVhZHkgaGF2ZSBhIHJvbGUgc3BlY2lmaWVkLlxuICpcbiAqIFRoaXMgbWl4aW4gZXhwZWN0cyBhIHNldCBvZiBtZW1iZXJzIHRoYXQgbWFuYWdlIHRoZSBzdGF0ZSBvZiB0aGUgc2VsZWN0aW9uOlxuICogYFtzeW1ib2xzLml0ZW1TZWxlY3RlZF1gLCBgW3N5bWJvbHMuaXRlbUFkZGVkXWAsIGFuZCBgc2VsZWN0ZWRJdGVtYC4gWW91IGNhblxuICogc3VwcGx5IHRoZXNlIHlvdXJzZWxmLCBvciBkbyBzbyB2aWFcbiAqIFtTaW5nbGVTZWxlY3Rpb25NaXhpbl0oU2luZ2xlU2VsZWN0aW9uTWl4aW4ubWQpLlxuICpcbiAqIEBtb2R1bGVcbiAqIEBwYXJhbSBiYXNlIHtDbGFzc30gdGhlIGJhc2UgY2xhc3MgdG8gZXh0ZW5kXG4gKiBAcmV0dXJucyB7Q2xhc3N9IHRoZSBleHRlbmRlZCBjbGFzc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoYmFzZSkge1xuXG4gIC8qKlxuICAgKiBUaGUgY2xhc3MgcHJvdG90eXBlIGFkZGVkIGJ5IHRoZSBtaXhpbi5cbiAgICovXG4gIGNsYXNzIFNlbGVjdGlvbkFyaWEgZXh0ZW5kcyBiYXNlIHtcblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgaWYgKHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKSB7IHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7IH1cblxuICAgICAgLy8gU2V0IGRlZmF1bHQgQVJJQSByb2xlIGZvciB0aGUgb3ZlcmFsbCBjb21wb25lbnQuXG4gICAgICBpZiAodGhpcy5nZXRBdHRyaWJ1dGUoJ3JvbGUnKSA9PSBudWxsICYmIHRoaXNbc3ltYm9scy5kZWZhdWx0c10ucm9sZSkge1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgncm9sZScsIHRoaXNbc3ltYm9scy5kZWZhdWx0c10ucm9sZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IFtzeW1ib2xzLmRlZmF1bHRzXSgpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRzID0gc3VwZXJbc3ltYm9scy5kZWZhdWx0c10gfHwge307XG4gICAgICBkZWZhdWx0cy5yb2xlID0gJ2xpc3Rib3gnO1xuICAgICAgZGVmYXVsdHMuaXRlbVJvbGUgPSAnb3B0aW9uJztcbiAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG5cbiAgICBbc3ltYm9scy5pdGVtQWRkZWRdKGl0ZW0pIHtcbiAgICAgIGlmIChzdXBlcltzeW1ib2xzLml0ZW1BZGRlZF0pIHsgc3VwZXJbc3ltYm9scy5pdGVtQWRkZWRdKGl0ZW0pOyB9XG5cbiAgICAgIGlmICghaXRlbS5nZXRBdHRyaWJ1dGUoJ3JvbGUnKSkge1xuICAgICAgICAvLyBBc3NpZ24gYSBkZWZhdWx0IEFSSUEgcm9sZSBmb3IgYW4gaW5kaXZpZHVhbCBpdGVtLlxuICAgICAgICBpdGVtLnNldEF0dHJpYnV0ZSgncm9sZScsIHRoaXNbc3ltYm9scy5kZWZhdWx0c10uaXRlbVJvbGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBFbnN1cmUgZWFjaCBpdGVtIGhhcyBhbiBJRCBzbyB3ZSBjYW4gc2V0IGFyaWEtYWN0aXZlZGVzY2VuZGFudCBvbiB0aGVcbiAgICAgIC8vIG92ZXJhbGwgbGlzdCB3aGVuZXZlciB0aGUgc2VsZWN0aW9uIGNoYW5nZXMuXG4gICAgICAvL1xuICAgICAgLy8gVGhlIElEIHdpbGwgdGFrZSB0aGUgZm9ybSBvZiBhIGJhc2UgSUQgcGx1cyBhIHVuaXF1ZSBpbnRlZ2VyLiBUaGUgYmFzZVxuICAgICAgLy8gSUQgd2lsbCBiZSBpbmNvcnBvcmF0ZSB0aGUgY29tcG9uZW50J3Mgb3duIElELiBFLmcuLCBpZiBhIGNvbXBvbmVudCBoYXNcbiAgICAgIC8vIElEIFwiZm9vXCIsIHRoZW4gaXRzIGl0ZW1zIHdpbGwgaGF2ZSBJRHMgdGhhdCBsb29rIGxpa2UgXCJfZm9vT3B0aW9uMVwiLiBJZlxuICAgICAgLy8gdGhlIGNvbXBuZW50IGhhcyBubyBJRCBpdHNlbGYsIGl0cyBpdGVtcyB3aWxsIGdldCBJRHMgdGhhdCBsb29rIGxpa2VcbiAgICAgIC8vIFwiX29wdGlvbjFcIi4gSXRlbSBJRHMgYXJlIHByZWZpeGVkIHdpdGggYW4gdW5kZXJzY29yZSB0byBkaWZmZXJlbnRpYXRlXG4gICAgICAvLyB0aGVtIGZyb20gbWFudWFsbHktYXNzaWduZWQgSURzLCBhbmQgdG8gbWluaW1pemUgdGhlIHBvdGVudGlhbCBmb3IgSURcbiAgICAgIC8vIGNvbmZsaWN0cy5cbiAgICAgIGlmICghaXRlbS5pZCkge1xuICAgICAgICBjb25zdCBiYXNlSWQgPSB0aGlzLmlkID9cbiAgICAgICAgICAgIFwiX1wiICsgdGhpcy5pZCArIFwiT3B0aW9uXCIgOlxuICAgICAgICAgICAgXCJfb3B0aW9uXCI7XG4gICAgICAgIGl0ZW0uaWQgPSBiYXNlSWQgKyBpZENvdW50Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCkge1xuICAgICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpOyB9XG4gICAgICBpdGVtLnNldEF0dHJpYnV0ZSgnYXJpYS1zZWxlY3RlZCcsIHNlbGVjdGVkKTtcbiAgICAgIGNvbnN0IGl0ZW1JZCA9IGl0ZW0uaWQ7XG4gICAgICBpZiAoaXRlbUlkICYmIHNlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdhcmlhLWFjdGl2ZWRlc2NlbmRhbnQnLCBpdGVtSWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGdldCBzZWxlY3RlZEl0ZW0oKSB7XG4gICAgICByZXR1cm4gc3VwZXIuc2VsZWN0ZWRJdGVtO1xuICAgIH1cbiAgICBzZXQgc2VsZWN0ZWRJdGVtKGl0ZW0pIHtcbiAgICAgIGlmICgnc2VsZWN0ZWRJdGVtJyBpbiBiYXNlLnByb3RvdHlwZSkgeyBzdXBlci5zZWxlY3RlZEl0ZW0gPSBpdGVtOyB9XG4gICAgICBpZiAoaXRlbSA9PSBudWxsKSB7XG4gICAgICAgIC8vIFNlbGVjdGlvbiB3YXMgcmVtb3ZlZC5cbiAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCcpO1xuICAgICAgfVxuICAgIH1cblxuICB9XG5cbiAgcmV0dXJuIFNlbGVjdGlvbkFyaWE7XG59XG4iLCJpbXBvcnQgZGVmYXVsdFNjcm9sbFRhcmdldCBmcm9tICcuL2RlZmF1bHRTY3JvbGxUYXJnZXQnO1xuaW1wb3J0IHN5bWJvbHMgZnJvbSAnLi9zeW1ib2xzJztcblxuXG4vKipcbiAqIE1peGluIHdoaWNoIHNjcm9sbHMgYSBjb250YWluZXIgaG9yaXpvbnRhbGx5IGFuZC9vciB2ZXJ0aWNhbGx5IHRvIGVuc3VyZSB0aGF0XG4gKiBhIG5ld2x5LXNlbGVjdGVkIGl0ZW0gaXMgdmlzaWJsZSB0byB0aGUgdXNlci5cbiAqXG4gKiBXaGVuIHRoZSBzZWxlY3RlZCBpdGVtIGluIGEgbGlzdC1saWtlIGNvbXBvbmVudCBjaGFuZ2VzLCB0aGUgc2VsZWN0ZWQgaXRlbVxuICogc2hvdWxkIGJlIGJyb3VnaHQgaW50byB2aWV3IHNvIHRoYXQgdGhlIHVzZXIgY2FuIGNvbmZpcm0gdGhlaXIgc2VsZWN0aW9uLlxuICpcbiAqIFRoaXMgbWl4aW4gZXhwZWN0cyBhIGBzZWxlY3RlZEl0ZW1gIHByb3BlcnR5IHRvIGJlIHNldCB3aGVuIHRoZSBzZWxlY3Rpb25cbiAqIGNoYW5nZXMuIFlvdSBjYW4gc3VwcGx5IHRoYXQgeW91cnNlbGYsIG9yIHVzZVxuICogW1NpbmdsZVNlbGVjdGlvbk1peGluXShTaW5nbGVTZWxlY3Rpb25NaXhpbi5tZCkuXG4gKlxuICogQG1vZHVsZSBTZWxlY3RpbkluVmlld01peGluXG4gKiBAcGFyYW0gYmFzZSB7Q2xhc3N9IHRoZSBiYXNlIGNsYXNzIHRvIGV4dGVuZFxuICogQHJldHVybnMge0NsYXNzfSB0aGUgZXh0ZW5kZWQgY2xhc3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgKGJhc2UpID0+IHtcblxuICAvKipcbiAgICogVGhlIGNsYXNzIHByb3RvdHlwZSBhZGRlZCBieSB0aGUgbWl4aW4uXG4gICAqL1xuICBjbGFzcyBTZWxlY3Rpb25JblZpZXcgZXh0ZW5kcyBiYXNlIHtcblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgaWYgKHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKSB7IHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7IH1cbiAgICAgIGNvbnN0IHNlbGVjdGVkSXRlbSA9IHRoaXMuc2VsZWN0ZWRJdGVtO1xuICAgICAgaWYgKHNlbGVjdGVkSXRlbSkge1xuICAgICAgICB0aGlzLnNjcm9sbEl0ZW1JbnRvVmlldyhzZWxlY3RlZEl0ZW0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNjcm9sbCB0aGUgZ2l2ZW4gZWxlbWVudCBjb21wbGV0ZWx5IGludG8gdmlldywgbWluaW1pemluZyB0aGUgZGVncmVlIG9mXG4gICAgICogc2Nyb2xsaW5nIHBlcmZvcm1lZC5cbiAgICAgKlxuICAgICAqIEJsaW5rIGhhcyBhIGBzY3JvbGxJbnRvVmlld0lmTmVlZGVkKClgIGZ1bmN0aW9uIHRoYXQgZG9lcyBzb21ldGhpbmdcbiAgICAgKiBzaW1pbGFyLCBidXQgdW5mb3J0dW5hdGVseSBpdCdzIG5vbi1zdGFuZGFyZCwgYW5kIGluIGFueSBldmVudCBvZnRlbiBlbmRzXG4gICAgICogdXAgc2Nyb2xsaW5nIG1vcmUgdGhhbiBpcyBhYnNvbHV0ZWx5IG5lY2Vzc2FyeS5cbiAgICAgKlxuICAgICAqIFRoaXMgc2Nyb2xscyB0aGUgY29udGFpbmluZyBlbGVtZW50IGRlZmluZWQgYnkgdGhlIGBzY3JvbGxUYXJnZXRgXG4gICAgICogcHJvcGVydHkuIFNlZSB0aGF0IHByb3BlcnR5IGZvciBhIGRpc2N1c3Npb24gb2YgdGhlIGRlZmF1bHQgdmFsdWUgb2ZcbiAgICAgKiB0aGF0IHByb3BlcnR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaXRlbSAtIHRoZSBpdGVtIHRvIHNjcm9sbCBpbnRvIHZpZXcuXG4gICAgICovXG4gICAgc2Nyb2xsSXRlbUludG9WaWV3KGl0ZW0pIHtcbiAgICAgIGlmIChzdXBlci5zY3JvbGxJdGVtSW50b1ZpZXcpIHsgc3VwZXIuc2Nyb2xsSXRlbUludG9WaWV3KCk7IH1cblxuICAgICAgY29uc3Qgc2Nyb2xsVGFyZ2V0ID0gdGhpc1tzeW1ib2xzLnNjcm9sbFRhcmdldF07XG5cbiAgICAgIC8vIERldGVybWluZSB0aGUgYm91bmRzIG9mIHRoZSBzY3JvbGwgdGFyZ2V0IGFuZCBpdGVtLiBXZSB1c2VcbiAgICAgIC8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpbnN0ZWFkIG9mIC5vZmZzZXRUb3AsIGV0Yy4sIGJlY2F1c2UgdGhlIGxhdHRlclxuICAgICAgLy8gcm91bmQgdmFsdWVzLCBhbmQgd2Ugd2FudCB0byBoYW5kbGUgZnJhY3Rpb25hbCB2YWx1ZXMuXG4gICAgICBjb25zdCBzY3JvbGxUYXJnZXRSZWN0ID0gc2Nyb2xsVGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgaXRlbVJlY3QgPSBpdGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAvLyBEZXRlcm1pbmUgaG93IGZhciB0aGUgaXRlbSBpcyBvdXRzaWRlIHRoZSB2aWV3cG9ydC5cbiAgICAgIGNvbnN0IGJvdHRvbURlbHRhID0gaXRlbVJlY3QuYm90dG9tIC0gc2Nyb2xsVGFyZ2V0UmVjdC5ib3R0b207XG4gICAgICBjb25zdCB0b3BEZWx0YSA9IGl0ZW1SZWN0LnRvcCAtIHNjcm9sbFRhcmdldFJlY3QudG9wO1xuICAgICAgY29uc3QgbGVmdERlbHRhID0gaXRlbVJlY3QubGVmdCAtIHNjcm9sbFRhcmdldFJlY3QubGVmdDtcbiAgICAgIGNvbnN0IHJpZ2h0RGVsdGEgPSBpdGVtUmVjdC5yaWdodCAtIHNjcm9sbFRhcmdldFJlY3QucmlnaHQ7XG5cbiAgICAgIC8vIFNjcm9sbCB0aGUgdGFyZ2V0IGFzIG5lY2Vzc2FyeSB0byBicmluZyB0aGUgaXRlbSBpbnRvIHZpZXcuXG4gICAgICBpZiAoYm90dG9tRGVsdGEgPiAwKSB7XG4gICAgICAgIHNjcm9sbFRhcmdldC5zY3JvbGxUb3AgKz0gYm90dG9tRGVsdGE7ICAgICAgICAgICAgLy8gU2Nyb2xsIGRvd25cbiAgICAgIH0gZWxzZSBpZiAodG9wRGVsdGEgPCAwKSB7XG4gICAgICAgIHNjcm9sbFRhcmdldC5zY3JvbGxUb3AgKz0gTWF0aC5jZWlsKHRvcERlbHRhKTsgICAgLy8gU2Nyb2xsIHVwXG4gICAgICB9XG4gICAgICBpZiAocmlnaHREZWx0YSA+IDApIHtcbiAgICAgICAgc2Nyb2xsVGFyZ2V0LnNjcm9sbExlZnQgKz0gcmlnaHREZWx0YTsgICAgICAgICAgICAvLyBTY3JvbGwgcmlnaHRcbiAgICAgIH0gZWxzZSBpZiAobGVmdERlbHRhIDwgMCkge1xuICAgICAgICBzY3JvbGxUYXJnZXQuc2Nyb2xsTGVmdCArPSBNYXRoLmNlaWwobGVmdERlbHRhKTsgIC8vIFNjcm9sbCBsZWZ0XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyogUHJvdmlkZSBhIGRlZmF1bHQgc2Nyb2xsVGFyZ2V0IGltcGxlbWVudGF0aW9uIGlmIG5vbmUgZXhpc3RzLiAqL1xuICAgIGdldCBbc3ltYm9scy5zY3JvbGxUYXJnZXRdKCkge1xuICAgICAgcmV0dXJuIHN1cGVyW3N5bWJvbHMuc2Nyb2xsVGFyZ2V0XSB8fCBkZWZhdWx0U2Nyb2xsVGFyZ2V0KHRoaXMpO1xuICAgIH1cblxuICAgIGdldCBzZWxlY3RlZEl0ZW0oKSB7XG4gICAgICByZXR1cm4gc3VwZXIuc2VsZWN0ZWRJdGVtO1xuICAgIH1cbiAgICBzZXQgc2VsZWN0ZWRJdGVtKGl0ZW0pIHtcbiAgICAgIGlmICgnc2VsZWN0ZWRJdGVtJyBpbiBiYXNlLnByb3RvdHlwZSkgeyBzdXBlci5zZWxlY3RlZEl0ZW0gPSBpdGVtOyB9XG4gICAgICBpZiAoaXRlbSkge1xuICAgICAgICAvLyBLZWVwIHRoZSBzZWxlY3RlZCBpdGVtIGluIHZpZXcuXG4gICAgICAgIHRoaXMuc2Nyb2xsSXRlbUludG9WaWV3KGl0ZW0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBTZWxlY3Rpb25JblZpZXc7XG59O1xuIiwiaW1wb3J0IFN5bWJvbCBmcm9tICcuL1N5bWJvbCc7XG5pbXBvcnQgc3ltYm9scyBmcm9tICcuL3N5bWJvbHMnO1xuXG5cbi8vIFN5bWJvbHMgZm9yIHByaXZhdGUgZGF0YSBtZW1iZXJzIG9uIGFuIGVsZW1lbnQuXG5jb25zdCBjYW5TZWxlY3ROZXh0U3ltYm9sID0gU3ltYm9sKCdjYW5TZWxlY3ROZXh0Jyk7XG5jb25zdCBjYW5TZWxlY3RQcmV2aW91c1N5bWJvbCA9IFN5bWJvbCgnY2FuU2VsZWN0UHJldmlvdXMnKTtcbmNvbnN0IHNlbGVjdGlvblJlcXVpcmVkU3ltYm9sID0gU3ltYm9sKCdzZWxlY3Rpb25SZXF1aXJlZCcpO1xuY29uc3Qgc2VsZWN0aW9uV3JhcHNTeW1ib2wgPSBTeW1ib2woJ3NlbGVjdGlvbldyYXBzJyk7XG5cbi8vIFdlIHdhbnQgdG8gZXhwb3NlIGJvdGggc2VsZWN0ZWRJbmRleCBhbmQgc2VsZWN0ZWRJdGVtIGFzIGluZGVwZW5kZW50XG4vLyBwcm9wZXJ0aWVzIGJ1dCBrZWVwIHRoZW0gaW4gc3luYy4gVGhpcyBhbGxvd3MgYSBjb21wb25lbnQgdXNlciB0byByZWZlcmVuY2Vcbi8vIHRoZSBzZWxlY3Rpb24gYnkgd2hhdGV2ZXIgbWVhbnMgaXMgbW9zdCBuYXR1cmFsIGZvciB0aGVpciBzaXR1YXRpb24uXG4vL1xuLy8gVG8gZWZmaWNpZW50bHkga2VlcCB0aGVzZSBwcm9wZXJ0aWVzIGluIHN5bmMsIHdlIHRyYWNrIFwiZXh0ZXJuYWxcIiBhbmRcbi8vIFwiaW50ZXJuYWxcIiByZWZlcmVuY2VzIGZvciBlYWNoIHByb3BlcnR5OlxuLy9cbi8vIFRoZSBleHRlcm5hbCBpbmRleCBvciBpdGVtIGlzIHRoZSBvbmUgd2UgcmVwb3J0IHRvIHRoZSBvdXRzaWRlIHdvcmxkIHdoZW5cbi8vIGFza2VkIGZvciBzZWxlY3Rpb24uICBXaGVuIGhhbmRsaW5nIGEgY2hhbmdlIHRvIGluZGV4IG9yIGl0ZW0sIHdlIHVwZGF0ZSB0aGVcbi8vIGV4dGVybmFsIHJlZmVyZW5jZSBhcyBzb29uIGFzIHBvc3NpYmxlLCBzbyB0aGF0IGlmIGFueW9uZSBpbW1lZGlhdGVseSBhc2tzXG4vLyBmb3IgdGhlIGN1cnJlbnQgc2VsZWN0aW9uLCB0aGV5IHdpbGwgcmVjZWl2ZSBhIHN0YWJsZSBhbnN3ZXIuXG4vL1xuLy8gVGhlIGludGVybmFsIGluZGV4IG9yIGl0ZW0gdHJhY2tzIHdoaWNoZXZlciBpbmRleCBvciBpdGVtIGxhc3QgcmVjZWl2ZWQgdGhlXG4vLyBmdWxsIHNldCBvZiBwcm9jZXNzaW5nLiBQcm9jZXNzaW5nIGluY2x1ZGVzIHJhaXNpbmcgYSBjaGFuZ2UgZXZlbnQgZm9yIHRoZVxuLy8gbmV3IHZhbHVlLiBPbmNlIHdlJ3ZlIGJlZ3VuIHRoYXQgcHJvY2Vzc2luZywgd2Ugc3RvcmUgdGhlIG5ldyB2YWx1ZSBhcyB0aGVcbi8vIGludGVybmFsIHZhbHVlIHRvIGluZGljYXRlIHdlJ3ZlIGhhbmRsZWQgaXQuXG4vL1xuY29uc3QgZXh0ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sID0gU3ltYm9sKCdleHRlcm5hbFNlbGVjdGVkSW5kZXgnKTtcbmNvbnN0IGV4dGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sID0gU3ltYm9sKCdleHRlcm5hbFNlbGVjdGVkSXRlbScpO1xuY29uc3QgaW50ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sID0gU3ltYm9sKCdpbnRlcm5hbFNlbGVjdGVkSW5kZXgnKTtcbmNvbnN0IGludGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sID0gU3ltYm9sKCdpbnRlcm5hbFNlbGVjdGVkSXRlbScpO1xuXG5cbi8qKlxuICogTWl4aW4gd2hpY2ggYWRkcyBzaW5nbGUtc2VsZWN0aW9uIHNlbWFudGljcyBmb3IgaXRlbXMgaW4gYSBsaXN0LlxuICpcbiAqIFRoaXMgbWl4aW4gZXhwZWN0cyBhIGNvbXBvbmVudCB0byBwcm92aWRlIGFuIGBpdGVtc2AgQXJyYXkgb3IgTm9kZUxpc3Qgb2ZcbiAqIGFsbCBlbGVtZW50cyBpbiB0aGUgbGlzdC5cbiAqXG4gKiBUaGlzIG1peGluIHRyYWNrcyBhIHNpbmdsZSBzZWxlY3RlZCBpdGVtIGluIHRoZSBsaXN0LCBhbmQgcHJvdmlkZXMgbWVhbnMgdG9cbiAqIGdldCBhbmQgc2V0IHRoYXQgc3RhdGUgYnkgaXRlbSBwb3NpdGlvbiAoYHNlbGVjdGVkSW5kZXhgKSBvciBpdGVtIGlkZW50aXR5XG4gKiAoYHNlbGVjdGVkSXRlbWApLiBUaGUgc2VsZWN0aW9uIGNhbiBiZSBtb3ZlZCBpbiB0aGUgbGlzdCB2aWEgdGhlIG1ldGhvZHNcbiAqIGBzZWxlY3RGaXJzdGAsIGBzZWxlY3RMYXN0YCwgYHNlbGVjdE5leHRgLCBhbmQgYHNlbGVjdFByZXZpb3VzYC5cbiAqXG4gKiBUaGlzIG1peGluIGRvZXMgbm90IHByb2R1Y2UgYW55IHVzZXItdmlzaWJsZSBlZmZlY3RzIHRvIHJlcHJlc2VudFxuICogc2VsZWN0aW9uLlxuICpcbiAqIEBtb2R1bGUgU2luZ2xlU2VsZWN0aW9uTWl4aW5cbiAqIEBwYXJhbSBiYXNlIHtDbGFzc30gdGhlIGJhc2UgY2xhc3MgdG8gZXh0ZW5kXG4gKiBAcmV0dXJucyB7Q2xhc3N9IHRoZSBleHRlbmRlZCBjbGFzc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTaW5nbGVTZWxlY3Rpb25NaXhpbihiYXNlKSB7XG5cbiAgLyoqXG4gICAqIFRoZSBjbGFzcyBwcm90b3R5cGUgYWRkZWQgYnkgdGhlIG1peGluLlxuICAgKi9cbiAgY2xhc3MgU2luZ2xlU2VsZWN0aW9uIGV4dGVuZHMgYmFzZSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICAvLyBTZXQgZGVmYXVsdHMuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuc2VsZWN0aW9uUmVxdWlyZWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uUmVxdWlyZWQgPSB0aGlzW3N5bWJvbHMuZGVmYXVsdHNdLnNlbGVjdGlvblJlcXVpcmVkO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNlbGVjdGlvbldyYXBzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLnNlbGVjdGlvbldyYXBzID0gdGhpc1tzeW1ib2xzLmRlZmF1bHRzXS5zZWxlY3Rpb25XcmFwcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcnVlIGlmIHRoZSBzZWxlY3Rpb24gY2FuIGJlIG1vdmVkIHRvIHRoZSBuZXh0IGl0ZW0sIGZhbHNlIGlmIG5vdCAodGhlXG4gICAgICogc2VsZWN0ZWQgaXRlbSBpcyB0aGUgbGFzdCBpdGVtIGluIHRoZSBsaXN0KS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIGdldCBjYW5TZWxlY3ROZXh0KCkge1xuICAgICAgcmV0dXJuIHRoaXNbY2FuU2VsZWN0TmV4dFN5bWJvbF07XG4gICAgfVxuICAgIHNldCBjYW5TZWxlY3ROZXh0KGNhblNlbGVjdE5leHQpIHtcbiAgICAgIGNvbnN0IGNoYW5nZWQgPSBjYW5TZWxlY3ROZXh0ICE9PSB0aGlzW2NhblNlbGVjdE5leHRTeW1ib2xdO1xuICAgICAgdGhpc1tjYW5TZWxlY3ROZXh0U3ltYm9sXSA9IGNhblNlbGVjdE5leHQ7XG4gICAgICBpZiAoJ2NhblNlbGVjdE5leHQnIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLmNhblNlbGVjdE5leHQgPSBjYW5TZWxlY3ROZXh0OyB9XG4gICAgICBpZiAodGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSAmJiBjaGFuZ2VkKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2Nhbi1zZWxlY3QtbmV4dC1jaGFuZ2VkJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRydWUgaWYgdGhlIHNlbGVjdGlvbiBjYW4gYmUgbW92ZWQgdG8gdGhlIHByZXZpb3VzIGl0ZW0sIGZhbHNlIGlmIG5vdFxuICAgICAqICh0aGUgc2VsZWN0ZWQgaXRlbSBpcyB0aGUgZmlyc3Qgb25lIGluIHRoZSBsaXN0KS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIGdldCBjYW5TZWxlY3RQcmV2aW91cygpIHtcbiAgICAgIHJldHVybiB0aGlzW2NhblNlbGVjdFByZXZpb3VzU3ltYm9sXTtcbiAgICB9XG4gICAgc2V0IGNhblNlbGVjdFByZXZpb3VzKGNhblNlbGVjdFByZXZpb3VzKSB7XG4gICAgICBjb25zdCBjaGFuZ2VkID0gY2FuU2VsZWN0UHJldmlvdXMgIT09IHRoaXNbY2FuU2VsZWN0UHJldmlvdXNTeW1ib2xdO1xuICAgICAgdGhpc1tjYW5TZWxlY3RQcmV2aW91c1N5bWJvbF0gPSBjYW5TZWxlY3RQcmV2aW91cztcbiAgICAgIGlmICgnY2FuU2VsZWN0UHJldmlvdXMnIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLmNhblNlbGVjdFByZXZpb3VzID0gY2FuU2VsZWN0UHJldmlvdXM7IH1cbiAgICAgIGlmICh0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdICYmIGNoYW5nZWQpIHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnY2FuLXNlbGVjdC1wcmV2aW91cy1jaGFuZ2VkJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGdldCBbc3ltYm9scy5kZWZhdWx0c10oKSB7XG4gICAgICBjb25zdCBkZWZhdWx0cyA9IHN1cGVyW3N5bWJvbHMuZGVmYXVsdHNdIHx8IHt9O1xuICAgICAgZGVmYXVsdHMuc2VsZWN0aW9uUmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgIGRlZmF1bHRzLnNlbGVjdGlvbldyYXBzID0gZmFsc2U7XG4gICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlIGEgbmV3IGl0ZW0gYmVpbmcgYWRkZWQgdG8gdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIG1ldGhvZCBzaW1wbHkgc2V0cyB0aGUgaXRlbSdzXG4gICAgICogc2VsZWN0aW9uIHN0YXRlIHRvIGZhbHNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaXRlbSAtIHRoZSBpdGVtIGJlaW5nIGFkZGVkXG4gICAgICovXG4gICAgW3N5bWJvbHMuaXRlbUFkZGVkXShpdGVtKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5pdGVtQWRkZWRdKSB7IHN1cGVyW3N5bWJvbHMuaXRlbUFkZGVkXShpdGVtKTsgfVxuICAgICAgdGhpc1tzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgaXRlbSA9PT0gdGhpcy5zZWxlY3RlZEl0ZW0pO1xuICAgIH1cblxuICAgIFtzeW1ib2xzLml0ZW1zQ2hhbmdlZF0oKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5pdGVtc0NoYW5nZWRdKSB7IHN1cGVyW3N5bWJvbHMuaXRlbXNDaGFuZ2VkXSgpOyB9XG5cbiAgICAgIC8vIEluIGNhc2Ugc2VsZWN0ZWQgaXRlbSBjaGFuZ2VkIHBvc2l0aW9uIG9yIHdhcyByZW1vdmVkLlxuICAgICAgdHJhY2tTZWxlY3RlZEl0ZW0odGhpcyk7XG5cbiAgICAgIC8vIEluIGNhc2UgdGhlIGNoYW5nZSBpbiBpdGVtcyBhZmZlY3RlZCB3aGljaCBuYXZpZ2F0aW9ucyBhcmUgcG9zc2libGUuXG4gICAgICB1cGRhdGVQb3NzaWJsZU5hdmlnYXRpb25zKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFwcGx5IHRoZSBpbmRpY2F0ZSBzZWxlY3Rpb24gc3RhdGUgdG8gdGhlIGl0ZW0uXG4gICAgICpcbiAgICAgKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIG1ldGhvZCBkb2VzIG5vdGhpbmcuIFVzZXItdmlzaWJsZVxuICAgICAqIGVmZmVjdHMgd2lsbCB0eXBpY2FsbHkgYmUgaGFuZGxlZCBieSBvdGhlciBtaXhpbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gYmVpbmcgc2VsZWN0ZWQvZGVzZWxlY3RlZFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2VsZWN0ZWQgLSB0cnVlIGlmIHRoZSBpdGVtIGlzIHNlbGVjdGVkLCBmYWxzZSBpZiBub3RcbiAgICAgKi9cbiAgICBbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKSB7XG4gICAgICBpZiAoc3VwZXJbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKSB7IHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCk7IH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaW5kZXggb2YgdGhlIGl0ZW0gd2hpY2ggaXMgY3VycmVudGx5IHNlbGVjdGVkLlxuICAgICAqXG4gICAgICogVGhlIHNldHRlciBleHBlY3RzIGFuIGludGVnZXIgb3IgYSBzdHJpbmcgcmVwcmVzZW50aW5nIGFuIGludGVnZXIuXG4gICAgICpcbiAgICAgKiBBIGBzZWxlY3RlZEluZGV4YCBvZiAtMSBpbmRpY2F0ZXMgdGhlcmUgaXMgbm8gc2VsZWN0aW9uLiBTZXR0aW5nIHRoaXNcbiAgICAgKiBwcm9wZXJ0eSB0byAtMSB3aWxsIHJlbW92ZSBhbnkgZXhpc3Rpbmcgc2VsZWN0aW9uLlxuICAgICAqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXQgc2VsZWN0ZWRJbmRleCgpIHtcbiAgICAgIHJldHVybiB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbF0gIT0gbnVsbCA/XG4gICAgICAgIHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sXSA6XG4gICAgICAgIC0xO1xuICAgIH1cbiAgICBzZXQgc2VsZWN0ZWRJbmRleChpbmRleCkge1xuICAgICAgLy8gU2VlIG5vdGVzIGF0IHRvcCBhYm91dCBpbnRlcm5hbCB2cy4gZXh0ZXJuYWwgY29waWVzIG9mIHRoaXMgcHJvcGVydHkuXG4gICAgICBjb25zdCBjaGFuZ2VkID0gaW5kZXggIT09IHRoaXNbaW50ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sXTtcbiAgICAgIGxldCBpdGVtO1xuICAgICAgbGV0IHBhcnNlZEluZGV4ID0gcGFyc2VJbnQoaW5kZXgpO1xuICAgICAgaWYgKHBhcnNlZEluZGV4ICE9PSB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbF0pIHtcbiAgICAgICAgLy8gU3RvcmUgdGhlIG5ldyBpbmRleCBhbmQgdGhlIGNvcnJlc3BvbmRpbmcgaXRlbS5cbiAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLml0ZW1zO1xuICAgICAgICBjb25zdCBoYXNJdGVtcyA9IGl0ZW1zICYmIGl0ZW1zLmxlbmd0aCA+IDA7XG4gICAgICAgIGlmICghKGhhc0l0ZW1zICYmIHBhcnNlZEluZGV4ID49IDAgJiYgcGFyc2VkSW5kZXggPCBpdGVtcy5sZW5ndGgpKSB7XG4gICAgICAgICAgcGFyc2VkSW5kZXggPSAtMTsgLy8gTm8gaXRlbSBhdCB0aGF0IGluZGV4LlxuICAgICAgICB9XG4gICAgICAgIHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sXSA9IHBhcnNlZEluZGV4O1xuICAgICAgICBpdGVtID0gaGFzSXRlbXMgJiYgcGFyc2VkSW5kZXggPj0gMCA/IGl0ZW1zW3BhcnNlZEluZGV4XSA6IG51bGw7XG4gICAgICAgIHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2xdID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW0gPSB0aGlzW2V4dGVybmFsU2VsZWN0ZWRJdGVtU3ltYm9sXTtcbiAgICAgIH1cblxuICAgICAgLy8gTm93IGxldCBzdXBlciBkbyBhbnkgd29yay5cbiAgICAgIGlmICgnc2VsZWN0ZWRJbmRleCcgaW4gYmFzZS5wcm90b3R5cGUpIHsgc3VwZXIuc2VsZWN0ZWRJbmRleCA9IGluZGV4OyB9XG5cbiAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgIC8vIFRoZSBzZWxlY3RlZCBpbmRleCBjaGFuZ2VkLlxuICAgICAgICB0aGlzW2ludGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbF0gPSBwYXJzZWRJbmRleDtcblxuICAgICAgICBpZiAodGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSkge1xuICAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdzZWxlY3RlZC1pbmRleC1jaGFuZ2VkJywge1xuICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgIHNlbGVjdGVkSW5kZXg6IHBhcnNlZEluZGV4LFxuICAgICAgICAgICAgICB2YWx1ZTogcGFyc2VkSW5kZXggLy8gZm9yIFBvbHltZXIgYmluZGluZy4gVE9ETzogVmVyaWZ5IHN0aWxsIG5lY2Vzc2FyeVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXNbaW50ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2xdICE9PSBpdGVtKSB7XG4gICAgICAgIC8vIFVwZGF0ZSBzZWxlY3RlZEl0ZW0gcHJvcGVydHkgc28gaXQgY2FuIGhhdmUgaXRzIG93biBlZmZlY3RzLlxuICAgICAgICB0aGlzLnNlbGVjdGVkSXRlbSA9IGl0ZW07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtLCBvciBudWxsIGlmIHRoZXJlIGlzIG5vIHNlbGVjdGlvbi5cbiAgICAgKlxuICAgICAqIFNldHRpbmcgdGhpcyBwcm9wZXJ0eSB0byBudWxsIGRlc2VsZWN0cyBhbnkgY3VycmVudGx5LXNlbGVjdGVkIGl0ZW0uXG4gICAgICogU2V0dGluZyB0aGlzIHByb3BlcnR5IHRvIGFuIG9iamVjdCB0aGF0IGlzIG5vdCBpbiB0aGUgbGlzdCBoYXMgbm8gZWZmZWN0LlxuICAgICAqXG4gICAgICogVE9ETzogRXZlbiBpZiBzZWxlY3Rpb25SZXF1aXJlZCwgY2FuIHN0aWxsIGV4cGxpY2l0bHkgc2V0IHNlbGVjdGVkSXRlbSB0byBudWxsLlxuICAgICAqIFRPRE86IElmIHNlbGVjdGlvblJlcXVpcmVkLCBsZWF2ZSBzZWxlY3Rpb24gYWxvbmU/XG4gICAgICpcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqL1xuICAgIGdldCBzZWxlY3RlZEl0ZW0oKSB7XG4gICAgICByZXR1cm4gdGhpc1tleHRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbF0gfHwgbnVsbDtcbiAgICB9XG4gICAgc2V0IHNlbGVjdGVkSXRlbShpdGVtKSB7XG4gICAgICAvLyBTZWUgbm90ZXMgYXQgdG9wIGFib3V0IGludGVybmFsIHZzLiBleHRlcm5hbCBjb3BpZXMgb2YgdGhpcyBwcm9wZXJ0eS5cbiAgICAgIGNvbnN0IHByZXZpb3VzU2VsZWN0ZWRJdGVtID0gdGhpc1tpbnRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbF07XG4gICAgICBjb25zdCBjaGFuZ2VkID0gaXRlbSAhPT0gcHJldmlvdXNTZWxlY3RlZEl0ZW07XG4gICAgICBsZXQgaW5kZXg7XG4gICAgICBpZiAoaXRlbSAhPT0gdGhpc1tleHRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbF0pIHtcbiAgICAgICAgLy8gU3RvcmUgaXRlbSBhbmQgbG9vayB1cCBjb3JyZXNwb25kaW5nIGluZGV4LlxuICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuaXRlbXM7XG4gICAgICAgIGNvbnN0IGhhc0l0ZW1zID0gaXRlbXMgJiYgaXRlbXMubGVuZ3RoID4gMDtcbiAgICAgICAgaW5kZXggPSBoYXNJdGVtcyA/IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoaXRlbXMsIGl0ZW0pIDogLTE7XG4gICAgICAgIHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEluZGV4U3ltYm9sXSA9IGluZGV4O1xuICAgICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgICAgaXRlbSA9IG51bGw7IC8vIFRoZSBpbmRpY2F0ZWQgaXRlbSBpc24ndCBhY3R1YWxseSBpbiBgaXRlbXNgLlxuICAgICAgICB9XG4gICAgICAgIHRoaXNbZXh0ZXJuYWxTZWxlY3RlZEl0ZW1TeW1ib2xdID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGV4ID0gdGhpc1tleHRlcm5hbFNlbGVjdGVkSW5kZXhTeW1ib2xdO1xuICAgICAgfVxuXG4gICAgICAvLyBOb3cgbGV0IHN1cGVyIGRvIGFueSB3b3JrLlxuICAgICAgaWYgKCdzZWxlY3RlZEl0ZW0nIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLnNlbGVjdGVkSXRlbSA9IGl0ZW07IH1cblxuICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgLy8gVGhlIHNlbGVjdGVkIGl0ZW0gY2hhbmdlZC5cbiAgICAgICAgdGhpc1tpbnRlcm5hbFNlbGVjdGVkSXRlbVN5bWJvbF0gPSBpdGVtO1xuXG4gICAgICAgIGlmIChwcmV2aW91c1NlbGVjdGVkSXRlbSkge1xuICAgICAgICAgIC8vIFVwZGF0ZSBzZWxlY3Rpb24gc3RhdGUgb2Ygb2xkIGl0ZW0uXG4gICAgICAgICAgdGhpc1tzeW1ib2xzLml0ZW1TZWxlY3RlZF0ocHJldmlvdXNTZWxlY3RlZEl0ZW0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgIC8vIFVwZGF0ZSBzZWxlY3Rpb24gc3RhdGUgdG8gbmV3IGl0ZW0uXG4gICAgICAgICAgdGhpc1tzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVQb3NzaWJsZU5hdmlnYXRpb25zKHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdKSB7XG4gICAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ3NlbGVjdGVkLWl0ZW0tY2hhbmdlZCcsIHtcbiAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICBzZWxlY3RlZEl0ZW06IGl0ZW0sXG4gICAgICAgICAgICAgIHZhbHVlOiBpdGVtIC8vIGZvciBQb2x5bWVyIGJpbmRpbmdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzW2ludGVybmFsU2VsZWN0ZWRJbmRleFN5bWJvbF0gIT09IGluZGV4KSB7XG4gICAgICAgIC8vIFVwZGF0ZSBzZWxlY3RlZEluZGV4IHByb3BlcnR5IHNvIGl0IGNhbiBoYXZlIGl0cyBvd24gZWZmZWN0cy5cbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VsZWN0IHRoZSBmaXJzdCBpdGVtIGluIHRoZSBsaXN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIHNlbGVjdGlvbiBjaGFuZ2VkLCBmYWxzZSBpZiBub3QuXG4gICAgICovXG4gICAgc2VsZWN0Rmlyc3QoKSB7XG4gICAgICBpZiAoc3VwZXIuc2VsZWN0Rmlyc3QpIHsgc3VwZXIuc2VsZWN0Rmlyc3QoKTsgfVxuICAgICAgcmV0dXJuIHNlbGVjdEluZGV4KHRoaXMsIDApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRydWUgaWYgdGhlIGxpc3Qgc2hvdWxkIGFsd2F5cyBoYXZlIGEgc2VsZWN0aW9uIChpZiBpdCBoYXMgaXRlbXMpLlxuICAgICAqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgKi9cbiAgICBnZXQgc2VsZWN0aW9uUmVxdWlyZWQoKSB7XG4gICAgICByZXR1cm4gdGhpc1tzZWxlY3Rpb25SZXF1aXJlZFN5bWJvbF07XG4gICAgfVxuICAgIHNldCBzZWxlY3Rpb25SZXF1aXJlZChzZWxlY3Rpb25SZXF1aXJlZCkge1xuICAgICAgY29uc3QgcGFyc2VkID0gU3RyaW5nKHNlbGVjdGlvblJlcXVpcmVkKSA9PT0gJ3RydWUnO1xuICAgICAgY29uc3QgY2hhbmdlZCA9IHBhcnNlZCAhPT0gdGhpc1tzZWxlY3Rpb25SZXF1aXJlZFN5bWJvbF07XG4gICAgICB0aGlzW3NlbGVjdGlvblJlcXVpcmVkU3ltYm9sXSA9IHBhcnNlZDtcbiAgICAgIGlmICgnc2VsZWN0aW9uUmVxdWlyZWQnIGluIGJhc2UucHJvdG90eXBlKSB7IHN1cGVyLnNlbGVjdGlvblJlcXVpcmVkID0gc2VsZWN0aW9uUmVxdWlyZWQ7IH1cbiAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgIGlmICh0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdKSB7XG4gICAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ3NlbGVjdGlvbi1yZXF1aXJlZC1jaGFuZ2VkJyk7XG4gICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZWN0aW9uUmVxdWlyZWQpIHtcbiAgICAgICAgICB0cmFja1NlbGVjdGVkSXRlbSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRydWUgaWYgc2VsZWN0aW9uIG5hdmlnYXRpb25zIHdyYXAgZnJvbSBsYXN0IHRvIGZpcnN0LCBhbmQgdmljZSB2ZXJzYS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgZ2V0IHNlbGVjdGlvbldyYXBzKCkge1xuICAgICAgcmV0dXJuIHRoaXNbc2VsZWN0aW9uV3JhcHNTeW1ib2xdO1xuICAgIH1cbiAgICBzZXQgc2VsZWN0aW9uV3JhcHMoc2VsZWN0aW9uV3JhcHMpIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IFN0cmluZyhzZWxlY3Rpb25XcmFwcykgPT09ICd0cnVlJztcbiAgICAgIGNvbnN0IGNoYW5nZWQgPSBwYXJzZWQgIT09IHRoaXNbc2VsZWN0aW9uV3JhcHNTeW1ib2xdO1xuICAgICAgdGhpc1tzZWxlY3Rpb25XcmFwc1N5bWJvbF0gPSBwYXJzZWQ7XG4gICAgICBpZiAoJ3NlbGVjdGlvbldyYXBzJyBpbiBiYXNlLnByb3RvdHlwZSkgeyBzdXBlci5zZWxlY3Rpb25XcmFwcyA9IHNlbGVjdGlvbldyYXBzOyB9XG4gICAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICBpZiAodGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSkge1xuICAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdzZWxlY3Rpb24td3JhcHMtY2hhbmdlZCcpO1xuICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlUG9zc2libGVOYXZpZ2F0aW9ucyh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZWxlY3QgdGhlIGxhc3QgaXRlbSBpbiB0aGUgbGlzdC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSBzZWxlY3Rpb24gY2hhbmdlZCwgZmFsc2UgaWYgbm90LlxuICAgICAqL1xuICAgIHNlbGVjdExhc3QoKSB7XG4gICAgICBpZiAoc3VwZXIuc2VsZWN0TGFzdCkgeyBzdXBlci5zZWxlY3RMYXN0KCk7IH1cbiAgICAgIHJldHVybiBzZWxlY3RJbmRleCh0aGlzLCB0aGlzLml0ZW1zLmxlbmd0aCAtIDEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbGVjdCB0aGUgbmV4dCBpdGVtIGluIHRoZSBsaXN0LlxuICAgICAqXG4gICAgICogSWYgdGhlIGxpc3QgaGFzIG5vIHNlbGVjdGlvbiwgdGhlIGZpcnN0IGl0ZW0gd2lsbCBiZSBzZWxlY3RlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSBUcnVlIGlmIHRoZSBzZWxlY3Rpb24gY2hhbmdlZCwgZmFsc2UgaWYgbm90LlxuICAgICAqL1xuICAgIHNlbGVjdE5leHQoKSB7XG4gICAgICBpZiAoc3VwZXIuc2VsZWN0TmV4dCkgeyBzdXBlci5zZWxlY3ROZXh0KCk7IH1cbiAgICAgIHJldHVybiBzZWxlY3RJbmRleCh0aGlzLCB0aGlzLnNlbGVjdGVkSW5kZXggKyAxKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZWxlY3QgdGhlIHByZXZpb3VzIGl0ZW0gaW4gdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBJZiB0aGUgbGlzdCBoYXMgbm8gc2VsZWN0aW9uLCB0aGUgbGFzdCBpdGVtIHdpbGwgYmUgc2VsZWN0ZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgc2VsZWN0aW9uIGNoYW5nZWQsIGZhbHNlIGlmIG5vdC5cbiAgICAgKi9cbiAgICBzZWxlY3RQcmV2aW91cygpIHtcbiAgICAgIGlmIChzdXBlci5zZWxlY3RQcmV2aW91cykgeyBzdXBlci5zZWxlY3RQcmV2aW91cygpOyB9XG4gICAgICBjb25zdCBuZXdJbmRleCA9IHRoaXMuc2VsZWN0ZWRJbmRleCA8IDAgP1xuICAgICAgICB0aGlzLml0ZW1zLmxlbmd0aCAtIDEgOiAgICAgLy8gTm8gc2VsZWN0aW9uIHlldDsgc2VsZWN0IGxhc3QgaXRlbS5cbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4IC0gMTtcbiAgICAgIHJldHVybiBzZWxlY3RJbmRleCh0aGlzLCBuZXdJbmRleCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgY2FuU2VsZWN0TmV4dCBwcm9wZXJ0eSBjaGFuZ2VzIGluIHJlc3BvbnNlIHRvIGludGVybmFsXG4gICAgICogY29tcG9uZW50IGFjdGl2aXR5LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIFNpbmdsZVNlbGVjdGlvblxuICAgICAqIEBldmVudCBjYW4tc2VsZWN0LW5leHQtY2hhbmdlZFxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgY2FuU2VsZWN0UHJldmlvdXMgcHJvcGVydHkgY2hhbmdlcyBpbiByZXNwb25zZSB0byBpbnRlcm5hbFxuICAgICAqIGNvbXBvbmVudCBhY3Rpdml0eS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBTaW5nbGVTZWxlY3Rpb25cbiAgICAgKiBAZXZlbnQgY2FuLXNlbGVjdC1wcmV2aW91cy1jaGFuZ2VkXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBzZWxlY3RlZEluZGV4IHByb3BlcnR5IGNoYW5nZXMgaW4gcmVzcG9uc2UgdG8gaW50ZXJuYWxcbiAgICAgKiBjb21wb25lbnQgYWN0aXZpdHkuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgU2luZ2xlU2VsZWN0aW9uXG4gICAgICogQGV2ZW50IHNlbGVjdGVkLWluZGV4LWNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGV0YWlsLnNlbGVjdGVkSW5kZXggVGhlIG5ldyBzZWxlY3RlZCBpbmRleC5cbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHNlbGVjdGVkSXRlbSBwcm9wZXJ0eSBjaGFuZ2VzIGluIHJlc3BvbnNlIHRvIGludGVybmFsXG4gICAgICogY29tcG9uZW50IGFjdGl2aXR5LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIFNpbmdsZVNlbGVjdGlvblxuICAgICAqIEBldmVudCBzZWxlY3RlZC1pdGVtLWNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBkZXRhaWwuc2VsZWN0ZWRJdGVtIFRoZSBuZXcgc2VsZWN0ZWQgaXRlbS5cbiAgICAgKi9cblxuICB9XG5cbiAgcmV0dXJuIFNpbmdsZVNlbGVjdGlvbjtcbn1cblxuXG4vLyBFbnN1cmUgdGhlIGdpdmVuIGluZGV4IGlzIHdpdGhpbiBib3VuZHMsIGFuZCBzZWxlY3QgaXQgaWYgaXQncyBub3QgYWxyZWFkeVxuLy8gc2VsZWN0ZWQuXG5mdW5jdGlvbiBzZWxlY3RJbmRleChlbGVtZW50LCBpbmRleCkge1xuXG4gIGNvbnN0IGl0ZW1zID0gZWxlbWVudC5pdGVtcztcbiAgaWYgKGl0ZW1zID09IG51bGwpIHtcbiAgICAvLyBOb3RoaW5nIHRvIHNlbGVjdC5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBjb3VudCA9IGl0ZW1zLmxlbmd0aDtcbiAgY29uc3QgYm91bmRlZEluZGV4ID0gZWxlbWVudC5zZWxlY3Rpb25XcmFwcyA/XG4gICAgLy8gSmF2YVNjcmlwdCBtb2QgZG9lc24ndCBoYW5kbGUgbmVnYXRpdmUgbnVtYmVycyB0aGUgd2F5IHdlIHdhbnQgdG8gd3JhcC5cbiAgICAvLyBTZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTg2MTgyNTAvNzY0NzJcbiAgICAoKGluZGV4ICUgY291bnQpICsgY291bnQpICUgY291bnQgOlxuXG4gICAgLy8gS2VlcCBpbmRleCB3aXRoaW4gYm91bmRzIG9mIGFycmF5LlxuICAgIE1hdGgubWF4KE1hdGgubWluKGluZGV4LCBjb3VudCAtIDEpLCAwKTtcblxuICBjb25zdCBwcmV2aW91c0luZGV4ID0gZWxlbWVudC5zZWxlY3RlZEluZGV4O1xuICBpZiAocHJldmlvdXNJbmRleCAhPT0gYm91bmRlZEluZGV4KSB7XG4gICAgZWxlbWVudC5zZWxlY3RlZEluZGV4ID0gYm91bmRlZEluZGV4O1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vLyBGb2xsb3dpbmcgYSBjaGFuZ2UgaW4gdGhlIHNldCBvZiBpdGVtcywgb3IgaW4gdGhlIHZhbHVlIG9mIHRoZVxuLy8gYHNlbGVjdGlvblJlcXVpcmVkYCBwcm9wZXJ0eSwgcmVhY3F1aXJlIHRoZSBzZWxlY3RlZCBpdGVtLiBJZiBpdCdzIG1vdmVkLFxuLy8gdXBkYXRlIGBzZWxlY3RlZEluZGV4YC4gSWYgaXQncyBiZWVuIHJlbW92ZWQsIGFuZCBhIHNlbGVjdGlvbiBpcyByZXF1aXJlZCxcbi8vIHRyeSB0byBzZWxlY3QgYW5vdGhlciBpdGVtLlxuZnVuY3Rpb24gdHJhY2tTZWxlY3RlZEl0ZW0oZWxlbWVudCkge1xuXG4gIGNvbnN0IGl0ZW1zID0gZWxlbWVudC5pdGVtcztcbiAgY29uc3QgaXRlbUNvdW50ID0gaXRlbXMgPyBpdGVtcy5sZW5ndGggOiAwO1xuXG4gIGNvbnN0IHByZXZpb3VzU2VsZWN0ZWRJdGVtID0gZWxlbWVudC5zZWxlY3RlZEl0ZW07XG4gIGlmICghcHJldmlvdXNTZWxlY3RlZEl0ZW0pIHtcbiAgICAvLyBObyBpdGVtIHdhcyBwcmV2aW91c2x5IHNlbGVjdGVkLlxuICAgIGlmIChlbGVtZW50LnNlbGVjdGlvblJlcXVpcmVkKSB7XG4gICAgICAvLyBTZWxlY3QgdGhlIGZpcnN0IGl0ZW0gYnkgZGVmYXVsdC5cbiAgICAgIGVsZW1lbnQuc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgfVxuICB9IGVsc2UgaWYgKGl0ZW1Db3VudCA9PT0gMCkge1xuICAgIC8vIFdlJ3ZlIGxvc3QgdGhlIHNlbGVjdGlvbiwgYW5kIHRoZXJlJ3Mgbm90aGluZyBsZWZ0IHRvIHNlbGVjdC5cbiAgICBlbGVtZW50LnNlbGVjdGVkSXRlbSA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgLy8gVHJ5IHRvIGZpbmQgdGhlIHByZXZpb3VzbHktc2VsZWN0ZWQgaXRlbSBpbiB0aGUgY3VycmVudCBzZXQgb2YgaXRlbXMuXG4gICAgY29uc3QgaW5kZXhJbkN1cnJlbnRJdGVtcyA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoaXRlbXMsIHByZXZpb3VzU2VsZWN0ZWRJdGVtKTtcbiAgICBjb25zdCBwcmV2aW91c1NlbGVjdGVkSW5kZXggPSBlbGVtZW50LnNlbGVjdGVkSW5kZXg7XG4gICAgaWYgKGluZGV4SW5DdXJyZW50SXRlbXMgPCAwKSB7XG4gICAgICAvLyBQcmV2aW91c2x5LXNlbGVjdGVkIGl0ZW0gd2FzIHJlbW92ZWQgZnJvbSB0aGUgaXRlbXMuXG4gICAgICAvLyBTZWxlY3QgdGhlIGl0ZW0gYXQgdGhlIHNhbWUgaW5kZXggKGlmIGl0IGV4aXN0cykgb3IgYXMgY2xvc2UgYXMgcG9zc2libGUuXG4gICAgICBjb25zdCBuZXdTZWxlY3RlZEluZGV4ID0gTWF0aC5taW4ocHJldmlvdXNTZWxlY3RlZEluZGV4LCBpdGVtQ291bnQgLSAxKTtcbiAgICAgIC8vIFNlbGVjdCBieSBpdGVtLCBzaW5jZSBpbmRleCBtYXkgYmUgdGhlIHNhbWUsIGFuZCB3ZSB3YW50IHRvIHJhaXNlIHRoZVxuICAgICAgLy8gc2VsZWN0ZWQtaXRlbS1jaGFuZ2VkIGV2ZW50LlxuICAgICAgZWxlbWVudC5zZWxlY3RlZEl0ZW0gPSBpdGVtc1tuZXdTZWxlY3RlZEluZGV4XTtcbiAgICB9IGVsc2UgaWYgKGluZGV4SW5DdXJyZW50SXRlbXMgIT09IHByZXZpb3VzU2VsZWN0ZWRJbmRleCkge1xuICAgICAgLy8gUHJldmlvdXNseS1zZWxlY3RlZCBpdGVtIHN0aWxsIHRoZXJlLCBidXQgY2hhbmdlZCBwb3NpdGlvbi5cbiAgICAgIGVsZW1lbnQuc2VsZWN0ZWRJbmRleCA9IGluZGV4SW5DdXJyZW50SXRlbXM7XG4gICAgfVxuICB9XG59XG5cbi8vIEZvbGxvd2luZyBhIGNoYW5nZSBpbiBzZWxlY3Rpb24sIHJlcG9ydCB3aGV0aGVyIGl0J3Mgbm93IHBvc3NpYmxlIHRvXG4vLyBnbyBuZXh0L3ByZXZpb3VzIGZyb20gdGhlIGdpdmVuIGluZGV4LlxuZnVuY3Rpb24gdXBkYXRlUG9zc2libGVOYXZpZ2F0aW9ucyhlbGVtZW50KSB7XG4gIGxldCBjYW5TZWxlY3ROZXh0O1xuICBsZXQgY2FuU2VsZWN0UHJldmlvdXM7XG4gIGNvbnN0IGl0ZW1zID0gZWxlbWVudC5pdGVtcztcbiAgaWYgKGl0ZW1zID09IG51bGwgfHwgaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gTm8gaXRlbXMgdG8gc2VsZWN0LlxuICAgIGNhblNlbGVjdE5leHQgPSBmYWxzZTtcbiAgICBjYW5TZWxlY3RQcmV2aW91cyA9IGZhbHNlO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQuc2VsZWN0aW9uV3JhcHMpIHtcbiAgICAvLyBTaW5jZSB0aGVyZSBhcmUgaXRlbXMsIGNhbiBhbHdheXMgZ28gbmV4dC9wcmV2aW91cy5cbiAgICBjYW5TZWxlY3ROZXh0ID0gdHJ1ZTtcbiAgICBjYW5TZWxlY3RQcmV2aW91cyA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaW5kZXggPSBlbGVtZW50LnNlbGVjdGVkSW5kZXg7XG4gICAgaWYgKGluZGV4IDwgMCAmJiBpdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBTcGVjaWFsIGNhc2UuIElmIHRoZXJlIGFyZSBpdGVtcyBidXQgbm8gc2VsZWN0aW9uLCBkZWNsYXJlIHRoYXQgaXQnc1xuICAgICAgLy8gYWx3YXlzIHBvc3NpYmxlIHRvIGdvIG5leHQvcHJldmlvdXMgdG8gY3JlYXRlIGEgc2VsZWN0aW9uLlxuICAgICAgY2FuU2VsZWN0TmV4dCA9IHRydWU7XG4gICAgICBjYW5TZWxlY3RQcmV2aW91cyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5vcm1hbCBjYXNlOiB3ZSBoYXZlIGFuIGluZGV4IGluIGEgbGlzdCB0aGF0IGhhcyBpdGVtcy5cbiAgICAgIGNhblNlbGVjdFByZXZpb3VzID0gKGluZGV4ID4gMCk7XG4gICAgICBjYW5TZWxlY3ROZXh0ID0gKGluZGV4IDwgaXRlbXMubGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG4gIGlmIChlbGVtZW50LmNhblNlbGVjdE5leHQgIT09IGNhblNlbGVjdE5leHQpIHtcbiAgICBlbGVtZW50LmNhblNlbGVjdE5leHQgPSBjYW5TZWxlY3ROZXh0O1xuICB9XG4gIGlmIChlbGVtZW50LmNhblNlbGVjdFByZXZpb3VzICE9PSBjYW5TZWxlY3RQcmV2aW91cykge1xuICAgIGVsZW1lbnQuY2FuU2VsZWN0UHJldmlvdXMgPSBjYW5TZWxlY3RQcmV2aW91cztcbiAgfVxufVxuIiwiLyogVGhlIG51bWJlciBvZiBmYWtlIHN5bWJvbHMgd2UndmUgc2VydmVkIHVwICovXG5sZXQgY291bnQgPSAwO1xuXG5mdW5jdGlvbiB1bmlxdWVTdHJpbmcoZGVzY3JpcHRpb24pIHtcbiAgcmV0dXJuIGBfJHtkZXNjcmlwdGlvbn0ke2NvdW50Kyt9YDtcbn1cblxuY29uc3Qgc3ltYm9sRnVuY3Rpb24gPSB0eXBlb2Ygd2luZG93LlN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyA/XG4gIHdpbmRvdy5TeW1ib2wgOlxuICB1bmlxdWVTdHJpbmc7XG5cbi8qKlxuICogUG9seWZpbGwgZm9yIEVTNiBzeW1ib2wgY2xhc3MuXG4gKlxuICogTWl4aW5zIGFuZCBjb21wb25lbnQgY2xhc3NlcyBvZnRlbiB3YW50IHRvIGFzc29jaWF0ZSBwcml2YXRlIGRhdGEgd2l0aCBhblxuICogZWxlbWVudCBpbnN0YW5jZSwgYnV0IEphdmFTY3JpcHQgZG9lcyBub3QgaGF2ZSBkaXJlY3Qgc3VwcG9ydCBmb3IgdHJ1ZVxuICogcHJpdmF0ZSBwcm9wZXJ0aWVzLiBPbmUgYXBwcm9hY2ggaXMgdG8gdXNlIHRoZVxuICogW1N5bWJvbF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3ltYm9sKVxuICogZGF0YSB0eXBlIHRvIHNldCBhbmQgcmV0cmlldmUgZGF0YSBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFVuZm9ydHVuYXRlbHksIHRoZSBTeW1ib2wgdHlwZSBpcyBub3QgYXZhaWxhYmxlIGluIEludGVybmV0IEV4cGxvcmVyIDExLiBJblxuICogbGlldSBvZiByZXR1cm5pbmcgYSB0cnVlIFN5bWJvbCwgdGhpcyBwb2x5ZmlsbCByZXR1cm5zIGEgZGlmZmVyZW50IHN0cmluZ1xuICogZWFjaCB0aW1lIGl0IGlzIGNhbGxlZC5cbiAqXG4gKiBVc2FnZTpcbiAqXG4gKiAgICAgY29uc3QgZm9vU3ltYm9sID0gU3ltYm9sKCdmb28nKTtcbiAqXG4gKiAgICAgY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICogICAgICAgZ2V0IGZvbygpIHtcbiAqICAgICAgICAgcmV0dXJuIHRoaXNbZm9vU3ltYm9sXTtcbiAqICAgICAgIH1cbiAqICAgICAgIHNldCBmb28odmFsdWUpIHtcbiAqICAgICAgICAgdGhpc1tmb29TeW1ib2xdID0gdmFsdWU7XG4gKiAgICAgICB9XG4gKiAgICAgfVxuICpcbiAqIEluIElFIDExLCB0aGlzIHNhbXBsZSB3aWxsIFwiaGlkZVwiIGRhdGEgYmVoaW5kIGFuIGluc3RhbmNlIHByb3BlcnR5IHRoYXQgbG9va3NcbiAqIGxpa2UgdGhpcy5fZm9vMC4gVGhlIHVuZGVyc2NvcmUgaXMgbWVhbnQgdG8gcmVkdWNlIChub3QgZWxpbWluYXRlKSBwb3RlbnRpYWxcbiAqIGFjY2lkZW50YWwgYWNjZXNzLCBhbmQgdGhlIHVuaXF1ZSBudW1iZXIgYXQgdGhlIGVuZCBpcyBtZWFuIHRvIGF2b2lkIChub3RcbiAqIGVsaW1pbmF0ZSkgbmFtaW5nIGNvbmZsaWN0cy5cbiAqXG4gKiBAZnVuY3Rpb24gU3ltYm9sXG4gKiBAcGFyYW0ge3N0cmluZ30gZGVzY3JpcHRpb24gLSBBIHN0cmluZyB0byBpZGVudGlmeSB0aGUgc3ltYm9sIHdoZW4gZGVidWdnaW5nXG4gKiBAcmV0dXJucyB7U3ltYm9sfHN0cmluZ30g4oCUIEEgU3ltYm9sIChpbiBFUzYgYnJvd3NlcnMpIG9yIHVuaXF1ZSBzdHJpbmcgSUQgKGluXG4gKiBFUzUpLlxuICovXG5leHBvcnQgZGVmYXVsdCBzeW1ib2xGdW5jdGlvbjtcbiIsIi8qKlxuICogQSBjb2xsZWN0aW9uIG9mIGNvbnN0YW50cyB1c2VkIGJ5IEVsaXggbWl4aW5zIGFuZCBjb21wb25lbnRzIGZvciBjb25zaXN0ZW5jeVxuICogaW4gdGhpbmdzIHN1Y2ggYXMgdXNlciBpbnRlcmZhY2UgdGltaW5ncy5cbiAqXG4gKiBAbW9kdWxlIGNvbnN0YW50c1xuICovXG5jb25zdCBjb25zdGFudHMgPSB7XG5cbiAgLyoqXG4gICAqIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHdoaWNoIHRoZSB1c2VyIGlzIGNvbnNpZGVyZWQgdG8gaGF2ZSBzdG9wcGVkXG4gICAqIHR5cGluZy5cbiAgICpcbiAgICogQGNvbnN0IHtudW1iZXJ9IFRZUElOR19USU1FT1VUX0RVUkFUSU9OXG4gICAqL1xuICBUWVBJTkdfVElNRU9VVF9EVVJBVElPTjogMTAwMFxuXG59O1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNvbnN0YW50cztcbiIsIi8qKlxuICogSGVscGVycyBmb3IgYWNjZXNzaW5nIGEgY29tcG9uZW50J3MgY29udGVudC5cbiAqXG4gKiBUaGUgc3RhbmRhcmQgRE9NIEFQSSBwcm92aWRlcyBzZXZlcmFsIHdheXMgb2YgYWNjZXNzaW5nIGNoaWxkIGNvbnRlbnQ6XG4gKiBgY2hpbGRyZW5gLCBgY2hpbGROb2Rlc2AsIGFuZCBgdGV4dENvbnRlbnRgLiBOb25lIG9mIHRoZXNlIGZ1bmN0aW9ucyBhcmVcbiAqIFNoYWRvdyBET00gYXdhcmUuIFRoaXMgbWl4aW4gZGVmaW5lcyB2YXJpYXRpb25zIG9mIHRob3NlIGZ1bmN0aW9ucyB0aGF0XG4gKiAqYXJlKiBTaGFkb3cgRE9NIGF3YXJlLlxuICpcbiAqIEV4YW1wbGU6IHlvdSBjcmVhdGUgYSBjb21wb25lbnQgYDxjb3VudC1jaGlsZHJlbj5gIHRoYXQgZGlzcGxheXMgYSBudW1iZXJcbiAqIGVxdWFsIHRvIHRoZSBudW1iZXIgb2YgY2hpbGRyZW4gcGxhY2VkIGluc2lkZSB0aGF0IGNvbXBvbmVudC4gSWYgc29tZW9uZVxuICogaW5zdGFudGlhdGVzIHlvdXIgY29tcG9uZW50IGxpa2U6XG4gKlxuICogICAgIDxjb3VudC1jaGlsZHJlbj5cbiAqICAgICAgIDxkaXY+PC9kaXY+XG4gKiAgICAgICA8ZGl2PjwvZGl2PlxuICogICAgICAgPGRpdj48L2Rpdj5cbiAqICAgICA8L2NvdW50LWNoaWxkcmVuPlxuICpcbiAqIFRoZW4gdGhlIGNvbXBvbmVudCBzaG91bGQgc2hvdyBcIjNcIiwgYmVjYXVzZSB0aGVyZSBhcmUgdGhyZWUgY2hpbGRyZW4uIFRvXG4gKiBjYWxjdWxhdGUgdGhlIG51bWJlciBvZiBjaGlsZHJlbiwgdGhlIGNvbXBvbmVudCBjYW4ganVzdCBjYWxjdWxhdGVcbiAqIGB0aGlzLmNoaWxkcmVuLmxlbmd0aGAuIEhvd2V2ZXIsIHN1cHBvc2Ugc29tZW9uZSBpbnN0YW50aWF0ZXMgeW91clxuICogY29tcG9uZW50IGluc2lkZSBvbmUgb2YgdGhlaXIgb3duIGNvbXBvbmVudHMsIGFuZCBwdXRzIGEgYDxzbG90PmAgZWxlbWVudFxuICogaW5zaWRlIHlvdXIgY29tcG9uZW50OlxuICpcbiAqICAgICA8Y291bnQtY2hpbGRyZW4+XG4gKiAgICAgICA8c2xvdD48L3Nsb3Q+XG4gKiAgICAgPC9jb3VudC1jaGlsZHJlbj5cbiAqXG4gKiBJZiB5b3VyIGNvbXBvbmVudCBvbmx5IGxvb2tzIGF0IGB0aGlzLmNoaWxkcmVuYCwgaXQgd2lsbCBhbHdheXMgc2VlIGV4YWN0bHlcbiAqIG9uZSBjaGlsZCDigJTCoHRoZSBgPHNsb3Q+YCBlbGVtZW50LiBCdXQgdGhlIHVzZXIgbG9va2luZyBhdCB0aGUgcGFnZSB3aWxsXG4gKiAqc2VlKiBhbnkgbm9kZXMgZGlzdHJpYnV0ZWQgdG8gdGhhdCBzbG90LiBUbyBtYXRjaCB3aGF0IHRoZSB1c2VyIHNlZXMsIHlvdXJcbiAqIGNvbXBvbmVudCBzaG91bGQgZXhwYW5kIGFueSBgPHNsb3Q+YCBlbGVtZW50cyBpdCBjb250YWlucy5cbiAqXG4gKiBUaGF0IGlzIG9uZSBwcm9ibGVtIHRoZXNlIGhlbHBlcnMgc29sdmUuIEZvciBleGFtcGxlLCB0aGUgaGVscGVyXG4gKiBgYXNzaWduZWRDaGlsZHJlbmAgd2lsbCByZXR1cm4gYWxsIGNoaWxkcmVuIGFzc2lnbmVkIHRvIHlvdXIgY29tcG9uZW50IGluXG4gKiB0aGUgY29tcG9zZWQgdHJlZS5cbiAqXG4gKiBAbW9kdWxlIGNvbnRlbnRcbiAqL1xuXG4vKipcbiAqIEFuIGluLW9yZGVyIGNvbGxlY3Rpb24gb2YgZGlzdHJpYnV0ZWQgY2hpbGRyZW4sIGV4cGFuZGluZyBhbnkgc2xvdFxuICogZWxlbWVudHMuIExpa2UgdGhlIHN0YW5kYXJkIGBjaGlsZHJlbmAgcHJvcGVydHksIHRoaXMgc2tpcHMgdGV4dCBub2Rlcy5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gdGhlIGVsZW1lbnQgdG8gaW5zcGVjdFxuICogQHJldHVybnMge0hUTUxFbGVtZW50W119IC0gdGhlIGNoaWxkcmVuIGFzc2lnbmVkIHRvIHRoZSBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ25lZENoaWxkcmVuKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGV4cGFuZENvbnRlbnRFbGVtZW50cyhlbGVtZW50LmNoaWxkcmVuLCBmYWxzZSk7XG59XG5cbi8qKlxuICogQW4gaW4tb3JkZXIgY29sbGVjdGlvbiBvZiBkaXN0cmlidXRlZCBjaGlsZCBub2RlcywgZXhwYW5kaW5nIGFueSBzbG90XG4gKiBlbGVtZW50cy4gTGlrZSB0aGUgc3RhbmRhcmQgYGNoaWxkTm9kZXNgIHByb3BlcnR5LCB0aGlzIGluY2x1ZGVzIHRleHRcbiAqIG5vZGVzLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgZWxlbWVudCB0byBpbnNwZWN0XG4gKiBAcmV0dXJucyB7Tm9kZVtdfSAtIHRoZSBub2RlcyBhc3NpZ25lZCB0byB0aGUgZWxlbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduZWRDaGlsZE5vZGVzKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGV4cGFuZENvbnRlbnRFbGVtZW50cyhlbGVtZW50LmNoaWxkTm9kZXMsIHRydWUpO1xufVxuXG4vKipcbiAqIFRoZSBjb25jYXRlbmF0ZWQgYHRleHRDb250ZW50YCBvZiBhbGwgZGlzdHJpYnV0ZWQgY2hpbGQgbm9kZXMsIGV4cGFuZGluZ1xuICogYW55IHNsb3QgZWxlbWVudHMuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBlbGVtZW50IHRvIGluc3BlY3RcbiAqIEB0eXBlIHtzdHJpbmd9IC0gdGhlIHRleHQgY29udGVudCBvZiBhbGwgbm9kZXMgYXNzaWduZWQgdG8gdGhlIGVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnbmVkVGV4dENvbnRlbnQoZWxlbWVudCkge1xuICBjb25zdCBzdHJpbmdzID0gYXNzaWduZWRDaGlsZE5vZGVzKGVsZW1lbnQpLm1hcChcbiAgICBjaGlsZCA9PiBjaGlsZC50ZXh0Q29udGVudFxuICApO1xuICByZXR1cm4gc3RyaW5ncy5qb2luKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGdpdmVuIGVsZW1lbnRzLCBmaWx0ZXJpbmcgb3V0IGF1eGlsaWFyeSBlbGVtZW50cyB0aGF0IGFyZW4ndFxuICogdHlwaWNhbGx5IHZpc2libGUuIEl0ZW1zIHdoaWNoIGFyZSBub3QgZWxlbWVudHMgYXJlIHJldHVybmVkIGFzIGlzLlxuICpcbiAqIEBwYXJhbSB7Tm9kZUxpc3R8SFRNTEVsZW1lbnRbXX0gZWxlbWVudHMgLSB0aGUgbGlzdCBvZiBlbGVtZW50cyB0byBmaWx0ZXJcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudFtdfSAtIHRoZSBmaWx0ZXJlZCBlbGVtZW50c1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyQXV4aWxpYXJ5RWxlbWVudHMoZWxlbWVudHMpIHtcbiAgXG4gIC8vIFRoZXNlIGFyZSB0YWdzIHRoYXQgY2FuIGFwcGVhciBpbiB0aGUgZG9jdW1lbnQgYm9keSwgYnV0IGRvIG5vdCBzZWVtIHRvXG4gIC8vIGhhdmUgYW55IHVzZXItdmlzaWJsZSBtYW5pZmVzdGF0aW9uLlxuICAvLyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9FbGVtZW50XG4gIGNvbnN0IGF1eGlsaWFyeVRhZ3MgPSBbXG4gICAgJ2FwcGxldCcsICAgICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICdiYXNlZm9udCcsICAgICAgIC8vIGRlcHJlY2F0ZWRcbiAgICAnZGlyJywgICAgICAgICAgICAvLyBkZXByZWNhdGVkXG4gICAgJ2VtYmVkJyxcbiAgICAnZm9udCcsICAgICAgICAgICAvLyBkZXByZWNhdGVkXG4gICAgJ2ZyYW1lJywgICAgICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICdmcmFtZXNldCcsICAgICAgIC8vIGRlcHJlY2F0ZWRcbiAgICAnaXNpbmRleCcsICAgICAgICAvLyBkZXByZWNhdGVkXG4gICAgJ2tleWdlbicsICAgICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICdsaW5rJyxcbiAgICAnbGluaycsXG4gICAgJ211bHRpY29sJywgICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICduZXh0aWQnLCAgICAgICAgIC8vIGRlcHJlY2F0ZWRcbiAgICAnbm9zY3JpcHQnLFxuICAgICdvYmplY3QnLFxuICAgICdwYXJhbScsXG4gICAgJ3NjcmlwdCcsXG4gICAgJ3N0eWxlJyxcbiAgICAndGVtcGxhdGUnLFxuICAgICdub2VtYmVkJyAgICAgICAgIC8vIGRlcHJlY2F0ZWRcbiAgXTtcblxuICByZXR1cm4gW10uZmlsdGVyLmNhbGwoZWxlbWVudHMsXG4gICAgZWxlbWVudCA9PiAhZWxlbWVudC5sb2NhbE5hbWUgfHwgYXV4aWxpYXJ5VGFncy5pbmRleE9mKGVsZW1lbnQubG9jYWxOYW1lKSA8IDBcbiAgKTtcbn1cblxuXG4vL1xuLy8gSGVscGVyIGZ1bmN0aW9ucyBmb3IgdGhlIGhlbHBlcnMuXG4vL1xuXG4vKlxuICogR2l2ZW4gYSBhcnJheSBvZiBub2RlcywgcmV0dXJuIGEgbmV3IGFycmF5IHdpdGggYW55IGNvbnRlbnQgZWxlbWVudHMgZXhwYW5kZWRcbiAqIHRvIHRoZSBub2RlcyBkaXN0cmlidXRlZCB0byB0aGF0IGNvbnRlbnQgZWxlbWVudC4gVGhpcyBydWxlIGlzIGFwcGxpZWRcbiAqIHJlY3Vyc2l2ZWx5LlxuICpcbiAqIElmIGluY2x1ZGVUZXh0Tm9kZXMgaXMgdHJ1ZSwgdGV4dCBub2RlcyB3aWxsIGJlIGluY2x1ZGVkLCBhcyBpbiB0aGVcbiAqIHN0YW5kYXJkIGNoaWxkTm9kZXMgcHJvcGVydHk7IGJ5IGRlZmF1bHQsIHRoaXMgc2tpcHMgdGV4dCBub2RlcywgbGlrZSB0aGVcbiAqIHN0YW5kYXJkIGNoaWxkcmVuIHByb3BlcnR5LlxuICovXG5mdW5jdGlvbiBleHBhbmRDb250ZW50RWxlbWVudHMobm9kZXMsIGluY2x1ZGVUZXh0Tm9kZXMpIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwobm9kZXMsIG5vZGUgPT4ge1xuICAgIC8vIFdlIHdhbnQgdG8gc2VlIGlmIHRoZSBub2RlIGlzIGFuIGluc3RhbmNlb2YgSFRNTFNsb3RFTGVtZW50LCBidXRcbiAgICAvLyB0aGF0IGNsYXNzIHdvbid0IGV4aXN0IGlmIHRoZSBicm93c2VyIHRoYXQgZG9lc24ndCBzdXBwb3J0IG5hdGl2ZVxuICAgIC8vIFNoYWRvdyBET00gYW5kIGlmIHRoZSBTaGFkb3cgRE9NIHBvbHlmaWxsIGhhc24ndCBiZWVuIGxvYWRlZC4gSW5zdGVhZCxcbiAgICAvLyB3ZSBkbyBhIHNpbXBsaXN0aWMgY2hlY2sgdG8gc2VlIGlmIHRoZSB0YWcgbmFtZSBpcyBcInNsb3RcIi5cbiAgICBjb25zdCBpc1Nsb3QgPSB0eXBlb2YgSFRNTFNsb3RFbGVtZW50ICE9PSAndW5kZWZpbmVkJyA/XG4gICAgICBub2RlIGluc3RhbmNlb2YgSFRNTFNsb3RFbGVtZW50IDpcbiAgICAgIG5vZGUubG9jYWxOYW1lID09PSAnc2xvdCc7XG4gICAgaWYgKGlzU2xvdCkge1xuICAgICAgLy8gVXNlIHRoZSBub2RlcyBhc3NpZ25lZCB0byB0aGlzIG5vZGUgaW5zdGVhZC5cbiAgICAgIGNvbnN0IGFzc2lnbmVkTm9kZXMgPSBub2RlLmFzc2lnbmVkTm9kZXMoeyBmbGF0dGVuOiB0cnVlIH0pO1xuICAgICAgcmV0dXJuIGFzc2lnbmVkTm9kZXMgP1xuICAgICAgICBleHBhbmRDb250ZW50RWxlbWVudHMoYXNzaWduZWROb2RlcywgaW5jbHVkZVRleHROb2RlcykgOlxuICAgICAgICBbXTtcbiAgICB9IGVsc2UgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgLy8gUGxhaW4gZWxlbWVudDsgdXNlIGFzIGlzLlxuICAgICAgcmV0dXJuIFtub2RlXTtcbiAgICB9IGVsc2UgaWYgKG5vZGUgaW5zdGFuY2VvZiBUZXh0ICYmIGluY2x1ZGVUZXh0Tm9kZXMpIHtcbiAgICAgIC8vIFRleHQgbm9kZS5cbiAgICAgIHJldHVybiBbbm9kZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENvbW1lbnQsIHByb2Nlc3NpbmcgaW5zdHJ1Y3Rpb24sIGV0Yy47IHNraXAuXG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9KTtcbiAgY29uc3QgZmxhdHRlbmVkID0gW10uY29uY2F0KC4uLmV4cGFuZGVkKTtcbiAgcmV0dXJuIGZsYXR0ZW5lZDtcbn1cbiIsIi8qKlxuICogUmV0dXJuIGEgZ3Vlc3MgYXMgdG8gd2hhdCBwb3J0aW9uIG9mIHRoZSBnaXZlbiBlbGVtZW50IGNhbiBiZSBzY3JvbGxlZC5cbiAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gcHJvdmlkZSBhIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2ZcbiAqIFtzeW1ib2xzLnNjcm9sbFRhcmdldF0uXG4gKlxuICogSWYgdGhlIGVsZW1lbnQgaGFzIGEgc2hhZG93IHJvb3QgY29udGFpbmluZyBhIGRlZmF1bHQgKHVubmFtZWQpIHNsb3QsIHRoaXNcbiAqIHJldHVybnMgdGhlIGZpcnN0IGFuY2VzdG9yIG9mIHRoYXQgc2xvdCB0aGF0IGlzIHN0eWxlZCB3aXRoIGBvdmVyZmxvdy15OlxuICogYXV0b2Agb3IgYG92ZXJmbG93LXk6IHNjcm9sbGAuIElmIHRoZSBlbGVtZW50IGhhcyBubyBkZWZhdWx0IHNsb3QsIG9yIG5vXG4gKiBzY3JvbGxpbmcgYW5jZXN0b3IgaXMgZm91bmQsIHRoZSBlbGVtZW50IGl0c2VsZiBpcyByZXR1cm5lZC5cbiAqXG4gKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRlZmF1bHRTY3JvbGxUYXJnZXQoZWxlbWVudCkge1xuICBjb25zdCBzbG90ID0gZWxlbWVudC5zaGFkb3dSb290ICYmIGVsZW1lbnQuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCdzbG90Om5vdChbbmFtZV0pJyk7XG4gIHJldHVybiBzbG90ID9cbiAgICBnZXRTY3JvbGxpbmdQYXJlbnQoc2xvdCwgZWxlbWVudCkgOlxuICAgIGVsZW1lbnQ7XG59XG5cblxuLy8gUmV0dXJuIHRoZSBwYXJlbnQgb2YgdGhlIGdpdmVuIGVsZW1lbnQgdGhhdCBjYW4gYmUgc2Nyb2xsIHZlcnRpY2FsbHkuIElmIG5vXG4vLyBzdWNoIGVsZW1lbnQgaXMgZm91bmQsIHJldHVybiB0aGUgZ2l2ZW4gcm9vdCBlbGVtZW50LlxuZnVuY3Rpb24gZ2V0U2Nyb2xsaW5nUGFyZW50KGVsZW1lbnQsIHJvb3QpIHtcbiAgaWYgKGVsZW1lbnQgPT09IG51bGwgfHwgZWxlbWVudCA9PT0gcm9vdCkge1xuICAgIC8vIERpZG4ndCBmaW5kIGEgc2Nyb2xsaW5nIHBhcmVudDsgdXNlIHRoZSByb290IGVsZW1lbnQgaW5zdGVhZC5cbiAgICByZXR1cm4gcm9vdDtcbiAgfVxuICBjb25zdCBvdmVyZmxvd1kgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpLm92ZXJmbG93WTtcbiAgaWYgKG92ZXJmbG93WSA9PT0gJ3Njcm9sbCcgfHwgb3ZlcmZsb3dZID09PSAnYXV0bycpIHtcbiAgICAvLyBGb3VuZCBhbiBlbGVtZW50IHdlIGNhbiBzY3JvbGwgdmVydGljYWxseS5cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuICAvLyBLZWVwIGxvb2tpbmcgaGlnaGVyIGluIHRoZSBoaWVyYXJjaHkgZm9yIGEgc2Nyb2xsaW5nIHBhcmVudC5cbiAgcmV0dXJuIGdldFNjcm9sbGluZ1BhcmVudChlbGVtZW50LnBhcmVudE5vZGUsIHJvb3QpO1xufVxuIiwiLypcbiAqIE1pY3JvdGFzayBoZWxwZXIgZm9yIElFIDExLlxuICpcbiAqIEV4ZWN1dGluZyBhIGZ1bmN0aW9uIGFzIGEgbWljcm90YXNrIGlzIHRyaXZpYWwgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0XG4gKiBwcm9taXNlcywgd2hvc2UgdGhlbigpIGNsYXVzZXMgdXNlIG1pY3JvdGFzayB0aW1pbmcuIElFIDExIGRvZXNuJ3Qgc3VwcG9ydFxuICogcHJvbWlzZXMsIGJ1dCBkb2VzIHN1cHBvcnQgTXV0YXRpb25PYnNlcnZlcnMsIHdoaWNoIGFyZSBhbHNvIGV4ZWN1dGVkIGFzXG4gKiBtaWNyb3Rhc2tzLiBTbyB0aGlzIGhlbHBlciB1c2VzIGFuIE11dGF0aW9uT2JzZXJ2ZXIgdG8gYWNoaWV2ZSBtaWNyb3Rhc2tcbiAqIHRpbWluZy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYWtlYXJjaGliYWxkLmNvbS8yMDE1L3Rhc2tzLW1pY3JvdGFza3MtcXVldWVzLWFuZC1zY2hlZHVsZXMvXG4gKlxuICogSW5zcGlyZWQgYnkgUG9seW1lcidzIGFzeW5jKCkgZnVuY3Rpb24uXG4gKi9cblxuXG4vLyBUaGUgcXVldWUgb2YgcGVuZGluZyBjYWxsYmFja3MgdG8gYmUgZXhlY3V0ZWQgYXMgbWljcm90YXNrcy5cbmNvbnN0IGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDcmVhdGUgYW4gZWxlbWVudCB0aGF0IHdlIHdpbGwgbW9kaWZ5IHRvIGZvcmNlIG9ic2VydmFibGUgbXV0YXRpb25zLlxuY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcblxuLy8gQSBtb25vdG9uaWNhbGx5LWluY3JlYXNpbmcgdmFsdWUuXG5sZXQgY291bnRlciA9IDA7XG5cblxuLyoqXG4gKiBBZGQgYSBjYWxsYmFjayB0byB0aGUgbWljcm90YXNrIHF1ZXVlLlxuICpcbiAqIFRoaXMgdXNlcyBhIE11dGF0aW9uT2JzZXJ2ZXIgc28gdGhhdCBpdCB3b3JrcyBvbiBJRSAxMS5cbiAqXG4gKiBOT1RFOiBJRSAxMSBtYXkgYWN0dWFsbHkgdXNlIHRpbWVvdXQgdGltaW5nIHdpdGggTXV0YXRpb25PYnNlcnZlcnMuIFRoaXNcbiAqIG5lZWRzIG1vcmUgaW52ZXN0aWdhdGlvbi5cbiAqXG4gKiBAZnVuY3Rpb24gbWljcm90YXNrXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtaWNyb3Rhc2soY2FsbGJhY2spIHtcbiAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAvLyBGb3JjZSBhIG11dGF0aW9uLlxuICBlbGVtZW50LnRleHRDb250ZW50ID0gKytjb3VudGVyO1xufVxuXG5cbi8vIEV4ZWN1dGUgYW55IHBlbmRpbmcgY2FsbGJhY2tzLlxuZnVuY3Rpb24gZXhlY3V0ZUNhbGxiYWNrcygpIHtcbiAgd2hpbGUgKGNhbGxiYWNrcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY2FsbGJhY2sgPSBjYWxsYmFja3Muc2hpZnQoKTtcbiAgICBjYWxsYmFjaygpO1xuICB9XG59XG5cblxuLy8gQ3JlYXRlIHRoZSBvYnNlcnZlci5cbmNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZXhlY3V0ZUNhbGxiYWNrcyk7XG5vYnNlcnZlci5vYnNlcnZlKGVsZW1lbnQsIHtcbiAgY2hhcmFjdGVyRGF0YTogdHJ1ZVxufSk7XG4iLCJpbXBvcnQgU3ltYm9sIGZyb20gJy4vU3ltYm9sJztcblxuXG4vKipcbiAqIEEgY29sbGVjdGlvbiBvZiAocG90ZW50aWFsbHkgcG9seWZpbGxlZCkgU3ltYm9sIG9iamVjdHMgZm9yIHN0YW5kYXJkXG4gKiBjb21wb25lbnQgcHJvcGVydGllcyBhbmQgbWV0aG9kcy5cbiAqXG4gKiBUaGVzZSBTeW1ib2wgb2JqZWN0cyBhcmUgdXNlZCB0byBhbGxvdyBtaXhpbnMgYW5kIGEgY29tcG9uZW50IHRvIGludGVybmFsbHlcbiAqIGNvbW11bmljYXRlLCB3aXRob3V0IGV4cG9zaW5nIHRoZXNlIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgaW4gdGhlIGNvbXBvbmVudCdzXG4gKiBwdWJsaWMgQVBJLlxuICpcbiAqIFRvIHVzZSB0aGVzZSBTeW1ib2wgb2JqZWN0cyBpbiB5b3VyIG93biBjb21wb25lbnQsIGluY2x1ZGUgdGhpcyBtb2R1bGUgYW5kXG4gKiB0aGVuIGNyZWF0ZSBhIHByb3BlcnR5IG9yIG1ldGhvZCB3aG9zZSBrZXkgaXMgdGhlIGRlc2lyZWQgU3ltYm9sLlxuICpcbiAqICAgICBpbXBvcnQgJ1NpbmdsZVNlbGVjdGlvbk1peGluJyBmcm9tICdlbGl4LW1peGlucy9zcmMvU2luZ2xlU2VsZWN0aW9uTWl4aW4nO1xuICogICAgIGltcG9ydCAnc3ltYm9scycgZnJvbSAnZWxpeC1taXhpbnMvc3JjL3N5bWJvbHMnO1xuICpcbiAqICAgICBjbGFzcyBNeUVsZW1lbnQgZXh0ZW5kcyBTaW5nbGVTZWxlY3Rpb25NaXhpbihIVE1MRWxlbWVudCkge1xuICogICAgICAgW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCkge1xuICogICAgICAgICAvLyBUaGlzIHdpbGwgYmUgaW52b2tlZCB3aGVuZXZlciBhbiBpdGVtIGlzIHNlbGVjdGVkL2Rlc2VsZWN0ZWQuXG4gKiAgICAgICB9XG4gKiAgICAgfVxuICpcbiAqIEBtb2R1bGUgc3ltYm9sc1xuICovXG5jb25zdCBzeW1ib2xzID0ge1xuXG4gIC8qKlxuICAgKiBTeW1ib2xzIGZvciB0aGUgYGNvbnRlbnRgIHByb3BlcnR5LlxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IHJldHVybnMgdGhlIGNvbXBvbmVudCdzIGNvbnRlbnQgLS0gaG93ZXZlciB0aGUgY29tcG9uZW50XG4gICAqIHdhbnRzIHRvIGRlZmluZSB0aGF0LiBUaGlzIGNvdWxkLCBmb3IgZXhhbXBsZSwgcmV0dXJuIHRoZSBjb21wb25lbnQnc1xuICAgKiBkaXN0cmlidXRlZCBjaGlsZHJlbi5cbiAgICpcbiAgICogQHR5cGUge0hUTUxFbGVtZW50W119XG4gICAqL1xuICBjb250ZW50OiBTeW1ib2woJ2NvbnRlbnQnKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYGNvbnRlbnRDaGFuZ2VkYCBtZXRob2QuXG4gICAqXG4gICAqIEZvciBjb21wb25lbnRzIHRoYXQgZGVmaW5lIGEgYGNvbnRlbnRgIHByb3BlcnR5LCB0aGlzIG1ldGhvZCBzaG91bGQgYmVcbiAgICogaW52b2tlZCB3aGVuIHRoYXQgcHJvcGVydHkgY2hhbmdlcy5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGNvbnRlbnRDaGFuZ2VkXG4gICAqL1xuICBjb250ZW50Q2hhbmdlZDogU3ltYm9sKCdjb250ZW50Q2hhbmdlZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgZGVmYXVsdHNgIHByb3BlcnR5LlxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IGNhbiBiZSB1c2VkIHRvIHNldCBvciBvdmVycmlkZSBkZWZhdWx0cyB0aGF0IHdpbGwgYmUgYXBwbGllZFxuICAgKiB0byBhIG5ldyBjb21wb25lbnQgaW5zdGFuY2UuIFdoZW4gaW1wbGVtZW50aW5nIHRoaXMgcHJvcGVydHksIHRha2UgY2FyZSB0b1xuICAgKiBmaXJzdCBhY3F1aXJlIGFueSBkZWZhdWx0cyBkZWZpbmVkIGJ5IHRoZSBzdXBlcmNsYXNzLiBUaGUgc3RhbmRhcmQgaWRpb20gaXNcbiAgICogYXMgZm9sbG93czpcbiAgICpcbiAgICogICAgIGdldCBbc3ltYm9scy5kZWZhdWx0c10oKSB7XG4gICAqICAgICAgIGNvbnN0IGRlZmF1bHRzID0gc3VwZXJbc3ltYm9scy5kZWZhdWx0c10gfHwge307XG4gICAqICAgICAgIC8vIFNldCBvciBvdmVycmlkZSBkZWZhdWx0IHZhbHVlcyBoZXJlXG4gICAqICAgICAgIGRlZmF1bHRzLmN1c3RvbVByb3BlcnR5ID0gZmFsc2U7XG4gICAqICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICogICAgIH1cbiAgICpcbiAgICogQHZhciB7b2JqZWN0fSBkZWZhdWx0c1xuICAgKi9cbiAgZGVmYXVsdHM6IFN5bWJvbCgnZGVmYXVsdHMnKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYGdldEl0ZW1UZXh0YCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGNhbiBiZSBhcHBsaWVkIHRvIGFuIGl0ZW0gdG8gcmV0dXJuIGl0cyB0ZXh0LlxuICAgKlxuICAgKiBAZnVuY3Rpb24gZ2V0VGV4dFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gdG8gZXh0cmFjdCB0ZXh0IGZyb21cbiAgICogQHJldHVybnMge3N0cmluZ30gLSB0aGUgdGV4dCBvZiB0aGUgaXRlbVxuICAgKi9cbiAgZ2V0SXRlbVRleHQ6IFN5bWJvbCgnZ2V0VGV4dCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgZ29Eb3duYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSBkb3duLlxuICAgKlxuICAgKiBAZnVuY3Rpb24gZ29Eb3duXG4gICAqL1xuICBnb0Rvd246IFN5bWJvbCgnZ29Eb3duJyksXG5cbiAgLyoqXG4gICAqIFN5bWJvbCBmb3IgdGhlIGBnb0VuZGAgbWV0aG9kLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnZva2VkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gZ28vbmF2aWdhdGUgdG8gdGhlIGVuZCAoZS5nLixcbiAgICogb2YgYSBsaXN0KS5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGdvRW5kXG4gICAqL1xuICBnb0VuZDogU3ltYm9sKCdnb0VuZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgZ29MZWZ0YCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSBsZWZ0LlxuICAgKlxuICAgKiBAZnVuY3Rpb24gZ29MZWZ0XG4gICAqL1xuICBnb0xlZnQ6IFN5bWJvbCgnZ29MZWZ0JyksXG5cbiAgLyoqXG4gICAqIFN5bWJvbCBmb3IgdGhlIGBnb1JpZ2h0YCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSByaWdodC5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGdvUmlnaHRcbiAgICovXG4gIGdvUmlnaHQ6IFN5bWJvbCgnZ29SaWdodCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgZ29TdGFydGAgbWV0aG9kLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnZva2VkIHdoZW4gdGhlIHVzZXIgd2FudHMgdG8gZ28vbmF2aWdhdGUgdG8gdGhlIHN0YXJ0XG4gICAqIChlLmcuLCBvZiBhIGxpc3QpLlxuICAgKlxuICAgKiBAZnVuY3Rpb24gZ29TdGFydFxuICAgKi9cbiAgZ29TdGFydDogU3ltYm9sKCdnb1N0YXJ0JyksXG5cbiAgLyoqXG4gICAqIFN5bWJvbCBmb3IgdGhlIGBnb1VwYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdXNlciB3YW50cyB0byBnby9uYXZpZ2F0ZSB1cC5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGdvVXBcbiAgICovXG4gIGdvVXA6IFN5bWJvbCgnZ29VcCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgaXRlbUFkZGVkYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiBhIG5ldyBpdGVtIGlzIGFkZGVkIHRvIGEgbGlzdC5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGl0ZW1BZGRlZFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gYmVpbmcgc2VsZWN0ZWQvZGVzZWxlY3RlZFxuICAgKi9cbiAgaXRlbUFkZGVkOiBTeW1ib2woJ2l0ZW1BZGRlZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgaXRlbXNDaGFuZ2VkYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiB0aGUgdW5kZXJseWluZyBjb250ZW50cyBjaGFuZ2UuIEl0IGlzIGFsc29cbiAgICogaW52b2tlZCBvbiBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24g4oCTIHNpbmNlIHRoZSBpdGVtcyBoYXZlIFwiY2hhbmdlZFwiIGZyb21cbiAgICogYmVpbmcgbm90aGluZy5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGl0ZW1zQ2hhbmdlZFxuICAgKi9cbiAgaXRlbXNDaGFuZ2VkOiBTeW1ib2woJ2l0ZW1zQ2hhbmdlZCcpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgaXRlbVNlbGVjdGVkYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiBhbiBpdGVtIGJlY29tZXMgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZC5cbiAgICpcbiAgICogQGZ1bmN0aW9uIGl0ZW1TZWxlY3RlZFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpdGVtIC0gdGhlIGl0ZW0gYmVpbmcgc2VsZWN0ZWQvZGVzZWxlY3RlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNlbGVjdGVkIC0gdHJ1ZSBpZiB0aGUgaXRlbSBpcyBzZWxlY3RlZCwgZmFsc2UgaWYgbm90XG4gICAqL1xuICBpdGVtU2VsZWN0ZWQ6IFN5bWJvbCgnaXRlbVNlbGVjdGVkJyksXG5cbiAgLyoqXG4gICAqIFN5bWJvbCBmb3IgdGhlIGBrZXlkb3duYCBtZXRob2QuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2hlbiBhbiBlbGVtZW50IHJlY2VpdmVzIGEgYGtleWRvd25gIGV2ZW50LlxuICAgKlxuICAgKiBAZnVuY3Rpb24ga2V5ZG93blxuICAgKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGJlaW5nIHByb2Nlc3NlZFxuICAgKi9cbiAga2V5ZG93bjogU3ltYm9sKCdrZXlkb3duJyksXG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgZ2VuZXJhbCBob3Jpem9udGFsIGFuZC9vciB2ZXJ0aWNhbCBvcmllbnRhdGlvbiBvZiB0aGVcbiAgICogY29tcG9uZW50LiBUaGlzIG1heSBhZmZlY3QgYm90aCBwcmVzZW50YXRpb24gYW5kIGJlaGF2aW9yIChlLmcuLCBvZlxuICAgKiBrZXlib2FyZCBuYXZpZ2F0aW9uKS5cbiAgICpcbiAgICogQWNjZXB0ZWQgdmFsdWVzIGFyZSBcImhvcml6b250YWxcIiwgXCJ2ZXJ0aWNhbFwiLCBvciBcImJvdGhcIiAodGhlIGRlZmF1bHQpLlxuICAgKlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgb3JpZW50YXRpb246IFN5bWJvbCgnb3JpZW50YXRpb24nKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYHJhaXNlQ2hhbmdlRXZlbnRzYCBwcm9wZXJ0eS5cbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IG1peGlucyB0byBkZXRlcm1pbmUgd2hldGhlciB0aGV5IHNob3VsZCByYWlzZVxuICAgKiBwcm9wZXJ0eSBjaGFuZ2UgZXZlbnRzLiBUaGUgc3RhbmRhcmQgSFRNTCBwYXR0ZXJuIGlzIHRvIG9ubHkgcmFpc2Ugc3VjaFxuICAgKiBldmVudHMgaW4gcmVzcG9uc2UgdG8gZGlyZWN0IHVzZXIgaW50ZXJhY3Rpb25zLiBGb3IgYSBkZXRhaWxlZCBkaXNjdXNzaW9uXG4gICAqIG9mIHRoaXMgcG9pbnQsIHNlZSB0aGUgR29sZCBTdGFuZGFyZCBjaGVja2xpc3QgaXRlbSBmb3JcbiAgICogW1Byb3BlcnkgQ2hhbmdlIEV2ZW50c10oaHR0cHM6Ly9naXRodWIuY29tL3dlYmNvbXBvbmVudHMvZ29sZC1zdGFuZGFyZC93aWtpL1Byb3BlcnR5JTIwQ2hhbmdlJTIwRXZlbnRzKS5cbiAgICpcbiAgICogVGhlIGFib3ZlIGFydGljbGUgZGVzY3JpYmVzIGEgcGF0dGVybiBmb3IgdXNpbmcgYSBmbGFnIHRvIHRyYWNrIHdoZXRoZXJcbiAgICogd29yayBpcyBiZWluZyBwZXJmb3JtZWQgaW4gcmVzcG9uc2UgdG8gaW50ZXJuYWwgY29tcG9uZW50IGFjdGl2aXR5LCBhbmRcbiAgICogd2hldGhlciB0aGUgY29tcG9uZW50IHNob3VsZCB0aGVyZWZvcmUgcmFpc2UgcHJvcGVydHkgY2hhbmdlIGV2ZW50cy5cbiAgICogVGhpcyBgcmFpc2VDaGFuZ2VFdmVudHNgIHN5bWJvbCBpcyBhIHNoYXJlZCBmbGFnIHVzZWQgZm9yIHRoYXQgcHVycG9zZSBieVxuICAgKiBhbGwgRWxpeCBtaXhpbnMgYW5kIGNvbXBvbmVudHMuIFNoYXJpbmcgdGhpcyBmbGFnIGVuc3VyZXMgdGhhdCBpbnRlcm5hbFxuICAgKiBhY3Rpdml0eSAoZS5nLiwgYSBVSSBldmVudCBsaXN0ZW5lcikgaW4gb25lIG1peGluIGNhbiBzaWduYWwgb3RoZXIgbWl4aW5zXG4gICAqIGhhbmRsaW5nIGFmZmVjdGVkIHByb3BlcnRpZXMgdG8gcmFpc2UgY2hhbmdlIGV2ZW50cy5cbiAgICpcbiAgICogQWxsIFVJIGV2ZW50IGxpc3RlbmVycyAoYW5kIG90aGVyIGZvcm1zIG9mIGludGVybmFsIGhhbmRsZXJzLCBzdWNoIGFzXG4gICAqIHRpbWVvdXRzIGFuZCBhc3luYyBuZXR3b3JrIGhhbmRsZXJzKSBzaG91bGQgc2V0IGByYWlzZUNoYW5nZUV2ZW50c2AgdG9cbiAgICogYHRydWVgIGF0IHRoZSBzdGFydCBvZiB0aGUgZXZlbnQgaGFuZGxlciwgdGhlbiBgZmFsc2VgIGF0IHRoZSBlbmQ6XG4gICAqXG4gICAqICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgKiAgICAgICB0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdID0gdHJ1ZTtcbiAgICogICAgICAgLy8gRG8gd29yayBoZXJlLCBwb3NzaWJseSBzZXR0aW5nIHByb3BlcnRpZXMsIGxpa2U6XG4gICAqICAgICAgIHRoaXMuZm9vID0gJ0hlbGxvJztcbiAgICogICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IGZhbHNlO1xuICAgKiAgICAgfSk7XG4gICAqXG4gICAqIEVsc2V3aGVyZSwgcHJvcGVydHkgc2V0dGVycyB0aGF0IHJhaXNlIGNoYW5nZSBldmVudHMgc2hvdWxkIG9ubHkgZG8gc28gaXRcbiAgICogdGhpcyBwcm9wZXJ0eSBpcyBgdHJ1ZWA6XG4gICAqXG4gICAqICAgICBzZXQgZm9vKHZhbHVlKSB7XG4gICAqICAgICAgIC8vIFNhdmUgZm9vIHZhbHVlIGhlcmUsIGRvIGFueSBvdGhlciB3b3JrLlxuICAgKiAgICAgICBpZiAodGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSkge1xuICAgKiAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdmb28tY2hhbmdlZCcpO1xuICAgKiAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAqICAgICAgIH1cbiAgICogICAgIH1cbiAgICpcbiAgICogSW4gdGhpcyB3YXksIHByb2dyYW1tYXRpYyBhdHRlbXB0cyB0byBzZXQgdGhlIGBmb29gIHByb3BlcnR5IHdpbGwgbm90XG4gICAqIHRyaWdnZXIgdGhlIGBmb28tY2hhbmdlZGAgZXZlbnQsIGJ1dCBVSSBpbnRlcmFjdGlvbnMgdGhhdCB1cGRhdGUgdGhhdFxuICAgKiBwcm9wZXJ0eSB3aWxsIGNhdXNlIHRob3NlIGV2ZW50cyB0byBiZSByYWlzZWQuXG4gICAqXG4gICAqIEB2YXIge2Jvb2xlYW59IHJhaXNlQ2hhbmdlRXZlbnRzXG4gICAqL1xuICByYWlzZUNoYW5nZUV2ZW50czogU3ltYm9sKCdyYWlzZUNoYW5nZUV2ZW50cycpLFxuXG4gIC8qKlxuICAgKiBTeW1ib2wgZm9yIHRoZSBgc2hhZG93Q3JlYXRlZGAgbWV0aG9kLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnZva2VkIHdoZW4gdGhlIGNvbXBvbmVudCdzIHNoYWRvdyByb290IGhhcyBiZWVuIGF0dGFjaGVkXG4gICAqIGFuZCBwb3B1bGF0ZWQuIE90aGVyIGNvZGUgY2FuIGhhbmRsZSB0aGlzIG1ldGhvZCB0byBwZXJmb3JtIGluaXRpYWxpemF0aW9uXG4gICAqIHRoYXQgZGVwZW5kcyB1cG9uIHRoZSBleGlzdGVuY2Ugb2YgYSBwb3B1bGF0ZWQgc2hhZG93IHN1YnRyZWUuXG4gICAqXG4gICAqIEBmdW5jdGlvbiBzaGFkb3dDcmVhdGVkXG4gICAqL1xuICBzaGFkb3dDcmVhdGVkOiBTeW1ib2woJ3NoYWRvd0NyZWF0ZWQnKSxcblxuICAvKipcbiAgICogU3ltYm9sIGZvciB0aGUgYHRlbXBsYXRlYCBwcm9wZXJ0eS5cbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSByZXR1cm5zIGEgY29tcG9uZW50J3MgdGVtcGxhdGUuXG4gICAqXG4gICAqIEB0eXBlIHtzdHJpbmd8SFRNTFRlbXBsYXRlRWxlbWVudH1cbiAgICovXG4gIHRlbXBsYXRlOiBTeW1ib2woJ3RlbXBsYXRlJylcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHN5bWJvbHM7XG4iLCIvKipcbiAqIEhlbHBlciBmdW5jdGlvbiBmb3Igc3RhbmRhcmQgY2xhc3NMaXN0LnRvZ2dsZSgpIGJlaGF2aW9yIG9uIG9sZCBicm93c2VycyxcbiAqIG5hbWVseSBJRSAxMS5cbiAqXG4gKiBUaGUgc3RhbmRhcmRcbiAqIFtjbGFzc2xpc3RdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2NsYXNzTGlzdClcbiAqIG9iamVjdCBoYXMgYSBgdG9nZ2xlKClgIGZ1bmN0aW9uIHRoYXQgc3VwcG9ydHMgYSBzZWNvbmQgQm9vbGVhbiBwYXJhbWV0ZXJcbiAqIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3VjY2luY3RseSB0dXJuIGEgY2xhc3Mgb24gb3Igb2ZmLiBUaGlzIGZlYXR1cmUgaXMgb2Z0ZW5cbiAqIHVzZWZ1bCBpbiBkZXNpZ25pbmcgY3VzdG9tIGVsZW1lbnRzLCB3aGljaCBtYXkgd2FudCB0byBleHRlcm5hbGx5IHJlZmxlY3RcbiAqIGNvbXBvbmVudCBzdGF0ZSBpbiBhIENTUyBjbGFzcyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdHlsaW5nIHB1cnBvc2VzLlxuICpcbiAqIFVuZm9ydHVuYXRlbHksIElFIDExIGRvZXMgbm90IHN1cHBvcnQgdGhlIEJvb2xlYW4gcGFyYW1ldGVyIHRvXG4gKiBgY2xhc3NMaXN0LnRvZ2dsZSgpYC4gVGhpcyBoZWxwZXIgZnVuY3Rpb24gYmVoYXZlcyBsaWtlIHRoZSBzdGFuZGFyZFxuICogYHRvZ2dsZSgpYCwgaW5jbHVkaW5nIHN1cHBvcnQgZm9yIHRoZSBCb29sZWFuIHBhcmFtZXRlciwgc28gdGhhdCBpdCBjYW4gYmVcbiAqIHVzZWQgZXZlbiBvbiBJRSAxMS5cbiAqXG4gKiBAZnVuY3Rpb24gdG9nZ2xlQ2xhc3NcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBUaGUgZWxlbWVudCB0byBtb2RpZnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWUgLSBUaGUgY2xhc3MgdG8gYWRkL3JlbW92ZVxuICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIC0gRm9yY2UgdGhlIGNsYXNzIHRvIGJlIGFkZGVkIChpZiB0cnVlKSBvciByZW1vdmVkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaWYgZmFsc2UpXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRvZ2dsZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSwgZm9yY2UpIHtcbiAgY29uc3QgY2xhc3NMaXN0ID0gZWxlbWVudC5jbGFzc0xpc3Q7XG4gIGNvbnN0IGFkZENsYXNzID0gKHR5cGVvZiBmb3JjZSA9PT0gJ3VuZGVmaW5lZCcpID9cbiAgICAhY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzTmFtZSkgOlxuICAgIGZvcmNlO1xuICBpZiAoYWRkQ2xhc3MpIHtcbiAgICBjbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICB9XG4gIHJldHVybiBhZGRDbGFzcztcbn1cbiIsIi8qXG4gKiBUaGlzIGRlbW8gY3JlYXRlcyBhIHNpbXBsZSBzaW5nbGUtc2VsZWN0aW9uIGxpc3QgYm94IGluIFBvbHltZXIuXG4gKiBUaGlzIHdvcmtzIGp1c3QgbGlrZSB0aGUgc2FtcGxlIGxpc3QgYm94IGRlbW8gaW4gdGhlIG1haW4gZWxpeC9lbGl4IHJlcG8sXG4gKiBvbmx5IHRoZSBtaXhpbnMgYXJlIGFwcGxpZWQgdG8gYSBQb2x5bWVyIGJhc2UgY2xhc3MgaW5zdGVhZCBvZiBIVE1MRWxlbWVudC5cbiAqIFNlZSB0aGF0IGRlbW8gZm9yIG1vcmUgZGV0YWlscyBhYm91dCBob3cgdGhlIG1peGlucyB3b3JrIHRvZ2V0aGVyLlxuICpcbiAqIFRoaXMgZXhhbXBsZSBkZWZpbmVzIHRoZSBsaXN0IGJveCB0ZW1wbGF0ZSBpbiBhbiBIVE1MIEltcG9ydCwgd2hpY2ggaXNcbiAqIHN0YW5kYXJkIHByYWN0aWNlIGZvciBQb2x5bWVyIGVsZW1lbnRzLiBGb3IgdGhlIHRpbWUgYmVpbmcsIHRoaXMgc2NyaXB0IGlzXG4gKiBtYWludGFpbmVkIG91dHNpZGUgb2YgdGhhdCBIVE1MIGZpbGUgdG8gc2ltcGxpZnkgdHJhbnNwaWxhdGlvbi5cbiAqL1xuXG5pbXBvcnQgQ2hpbGRyZW5Db250ZW50TWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ2hpbGRyZW5Db250ZW50TWl4aW4nO1xuaW1wb3J0IENsaWNrU2VsZWN0aW9uTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ2xpY2tTZWxlY3Rpb25NaXhpbic7XG5pbXBvcnQgQ29udGVudEl0ZW1zTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvQ29udGVudEl0ZW1zTWl4aW4nO1xuaW1wb3J0IERpcmVjdGlvblNlbGVjdGlvbk1peGluIGZyb20gJ2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0RpcmVjdGlvblNlbGVjdGlvbk1peGluJztcbmltcG9ydCBLZXlib2FyZERpcmVjdGlvbk1peGluIGZyb20gJ2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0tleWJvYXJkRGlyZWN0aW9uTWl4aW4nO1xuaW1wb3J0IEtleWJvYXJkTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvS2V5Ym9hcmRNaXhpbic7XG5pbXBvcnQgS2V5Ym9hcmRQYWdlZFNlbGVjdGlvbk1peGluIGZyb20gJ2VsaXgvZWxlbWVudHMvZWxpeC1taXhpbnMvc3JjL0tleWJvYXJkUGFnZWRTZWxlY3Rpb25NaXhpbic7XG5pbXBvcnQgS2V5Ym9hcmRQcmVmaXhTZWxlY3Rpb25NaXhpbiBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9LZXlib2FyZFByZWZpeFNlbGVjdGlvbk1peGluJztcbmltcG9ydCBTZWxlY3Rpb25BcmlhTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU2VsZWN0aW9uQXJpYU1peGluJztcbmltcG9ydCBTZWxlY3Rpb25JblZpZXdNaXhpbiBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9TZWxlY3Rpb25JblZpZXdNaXhpbic7XG5pbXBvcnQgU2luZ2xlU2VsZWN0aW9uTWl4aW4gZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvU2luZ2xlU2VsZWN0aW9uTWl4aW4nO1xuaW1wb3J0IHN5bWJvbHMgZnJvbSAnZWxpeC9lbGVtZW50cy9lbGl4LW1peGlucy9zcmMvc3ltYm9scyc7XG5cblxuLy8gQXBwbHkgYSBzZXQgb2YgRWxpeCBtaXhpbnMgdG8gdGhlIFBvbHltZXIuRWxlbWVudCBiYXNlIGNsYXNzLlxuLy8gVXNlIGByZWR1Y2VgIHRvIGFwcGx5IGFsbCB0aGUgbWl4aW4gZnVuY3Rpb25zLlxuY29uc3QgbWl4aW5zID0gW1xuICBDaGlsZHJlbkNvbnRlbnRNaXhpbixcbiAgQ2xpY2tTZWxlY3Rpb25NaXhpbixcbiAgQ29udGVudEl0ZW1zTWl4aW4sXG4gIERpcmVjdGlvblNlbGVjdGlvbk1peGluLFxuICBLZXlib2FyZERpcmVjdGlvbk1peGluLFxuICBLZXlib2FyZE1peGluLFxuICBLZXlib2FyZFBhZ2VkU2VsZWN0aW9uTWl4aW4sXG4gIEtleWJvYXJkUHJlZml4U2VsZWN0aW9uTWl4aW4sXG4gIFNlbGVjdGlvbkFyaWFNaXhpbixcbiAgU2VsZWN0aW9uSW5WaWV3TWl4aW4sXG4gIFNpbmdsZVNlbGVjdGlvbk1peGluXG5dO1xuXG5jb25zdCBiYXNlID0gbWl4aW5zLnJlZHVjZSgoY2xzLCBtaXhpbikgPT4gbWl4aW4oY2xzKSwgd2luZG93LlBvbHltZXIuRWxlbWVudCk7XG5cblxuLyoqXG4gKiBBIHNpbXBsZSBzaW5nbGUtc2VsZWN0aW9uIGxpc3QgYm94LlxuICpcbiAqIFRoaXMgdXNlcyB0aGUgYmFzZSBjbGFzcyB3ZSBqdXN0IGNyZWF0ZWQgYWJvdmUsIGFuZCBhZGRzIGluIHRoZSBiZWhhdmlvclxuICogdW5pcXVlIHRvIHRoaXMgbGlzdCBib3ggZWxlbWVudC5cbiAqXG4gKiBUT0RPOiBXb3JrIG91dCB0aGUgYmVzdCB3YXkgdG8gc3VwcG9ydCBzZXR0aW5nIHByb3BlcnRpZXMgdmlhIGF0dHJpYnV0ZXMuXG4gKiBTZWUgdGhlIGFkamFjZW50IFNpbmdsZVNlbGVjdGlvbkRlbW8uanMgZmlsZSBmb3IgbW9yZSBvbiB0aGF0IGlzc3VlLlxuICovXG5jbGFzcyBMaXN0Qm94IGV4dGVuZHMgYmFzZSB7XG5cbiAgLy8gV2UgZGVmaW5lIGEgY29sbGVjdGlvbiBvZiBkZWZhdWx0IHByb3BlcnR5IHZhbHVlcyB3aGljaCBjYW4gYmUgc2V0IGluXG4gIC8vIHRoZSBjb25zdHJ1Y3RvciBvciBjb25uZWN0ZWRDYWxsYmFjay4gRGVmaW5pbmcgdGhlIGFjdHVhbCBkZWZhdWx0IHZhbHVlc1xuICAvLyBpbiB0aG9zZSBjYWxscyB3b3VsZCBjb21wbGljYXRlIHRoaW5ncyBpZiBhIHN1YmNsYXNzIHNvbWVkYXkgd2FudHMgdG9cbiAgLy8gZGVmaW5lIGl0cyBvd24gZGVmYXVsdCB2YWx1ZS5cbiAgZ2V0IFtzeW1ib2xzLmRlZmF1bHRzXSgpIHtcbiAgICBjb25zdCBkZWZhdWx0cyA9IHN1cGVyW3N5bWJvbHMuZGVmYXVsdHNdIHx8IHt9O1xuICAgIC8vIEJ5IGRlZmF1bHQsIHdlIGFzc3VtZSB0aGUgbGlzdCBwcmVzZW50cyBsaXN0IGl0ZW1zIHZlcnRpY2FsbHkuXG4gICAgZGVmYXVsdHMub3JpZW50YXRpb24gPSAndmVydGljYWwnO1xuICAgIHJldHVybiBkZWZhdWx0cztcbiAgfVxuXG4gIC8vIE1hcCBpdGVtIHNlbGVjdGlvbiB0byBhIGBzZWxlY3RlZGAgQ1NTIGNsYXNzLlxuICBbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKSB7XG4gICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpOyB9XG4gICAgaXRlbS5jbGFzc0xpc3QudG9nZ2xlKCdzZWxlY3RlZCcsIHNlbGVjdGVkKTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgaXMoKSB7XG4gICAgcmV0dXJuICdzYW1wbGUtbGlzdC1ib3gnO1xuICB9XG5cbiAgLy8gTWFwIGl0ZW0gc2VsZWN0aW9uIHRvIGEgYHNlbGVjdGVkYCBDU1MgY2xhc3MuXG4gIFtzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpIHtcbiAgICBpZiAoc3VwZXJbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKSB7IHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXShpdGVtLCBzZWxlY3RlZCk7IH1cbiAgICBpdGVtLmNsYXNzTGlzdC50b2dnbGUoJ3NlbGVjdGVkJywgc2VsZWN0ZWQpO1xuICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3NhbXBsZS1saXN0LWJveCcsIExpc3RCb3gpO1xuZXhwb3J0IGRlZmF1bHQgTGlzdEJveDtcbiIsImltcG9ydCBTaW5nbGVTZWxlY3Rpb25NaXhpbiBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9TaW5nbGVTZWxlY3Rpb25NaXhpbic7XG5pbXBvcnQgc3ltYm9scyBmcm9tICdlbGl4L2VsZW1lbnRzL2VsaXgtbWl4aW5zL3NyYy9zeW1ib2xzJztcblxuXG4vKlxuICogRGVtb25zdHJhdGUgdGhlIEVsaXggc2luZ2xlLXNlbGVjdGlvbiBtaXhpbiBhcHBsaWVkIHRvIGEgUG9seW1lciAyLjAgZWxlbWVudC5cbiAqL1xuY2xhc3MgU2luZ2xlU2VsZWN0aW9uRGVtbyBleHRlbmRzIFNpbmdsZVNlbGVjdGlvbk1peGluKHdpbmRvdy5Qb2x5bWVyLkVsZW1lbnQpIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgLy8gV2hlbiBhIGNoaWxkIGlzIGNsaWNrZWQsIHNldCB0aGUgc2VsZWN0ZWRJdGVtLlxuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICB0aGlzW3N5bWJvbHMucmFpc2VDaGFuZ2VFdmVudHNdID0gdHJ1ZTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gZXZlbnQudGFyZ2V0ICE9PSB0aGlzID9cbiAgICAgICAgZXZlbnQudGFyZ2V0IDogIC8vIENsaWNrZWQgb24gYW4gaXRlbVxuICAgICAgICBudWxsOyAgICAgICAgICAgLy8gQ2xpY2tlZCBvbiBlbGVtZW50IGJhY2tncm91bmRcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpc1tzeW1ib2xzLnJhaXNlQ2hhbmdlRXZlbnRzXSA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gSXQncyB1bmNsZWFyIHdobyBzaG91bGQgaGFuZGxlIGF0dHJpYnV0ZXMgbGlrZSBgc2VsZWN0ZWQtaW5kZXhgLiBQb2x5bWVyXG4gIC8vIHdpbGwgdHJ5IHRvIGhhbmRsZSB0aGVtLCBidXQgdGhlbiB3ZSBoYXZlIHRvIGRlY2xhcmUgdGhlbSwgZXZlbiBpZiB0aGV5XG4gIC8vIGNvbWUgZnJvbSBtaXhpbnMuIEFsdGVybmF0aXZlbHksIHdlIGNvdWxkIGRlZmluZSBvdXIgb3duXG4gIC8vIGBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2tgIGFuZCBgb2JzZXJ2ZWRBdHRyaWJ1dGVzYCBhbmQgaGFuZGxlIG91clxuICAvLyBhdHRyaWJ1dGVzIG91cnNlbHZlcy4gQ3VycmVudGx5LCBob3dldmVyLCBQb2x5bWVyIHdpbGwgZmlnaHQgdXMgZm9yXG4gIC8vIGNvbnRyb2wuXG4gIHN0YXRpYyBnZXQgY29uZmlnKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHNlbGVjdGVkSW5kZXg6IHtcbiAgICAgICAgICB0eXBlOiBOdW1iZXJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBTZWUgbm90ZXMgYXQgYGNvbmZpZ2AuXG4gIC8vIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyaWJ1dGVOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgLy8gICBpZiAoc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKSB7IHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyaWJ1dGVOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpOyB9XG4gIC8vICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdzZWxlY3RlZC1pbmRleCcpIHtcbiAgLy8gICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IG5ld1ZhbHVlO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHN0YXRpYyBnZXQgaXMoKSB7IHJldHVybiAnc2luZ2xlLXNlbGVjdGlvbi1kZW1vJzsgfVxuXG4gIC8vIE1hcCBpdGVtIHNlbGVjdGlvbiB0byBhIGBzZWxlY3RlZGAgQ1NTIGNsYXNzLlxuICBbc3ltYm9scy5pdGVtU2VsZWN0ZWRdKGl0ZW0sIHNlbGVjdGVkKSB7XG4gICAgaWYgKHN1cGVyW3N5bWJvbHMuaXRlbVNlbGVjdGVkXSkgeyBzdXBlcltzeW1ib2xzLml0ZW1TZWxlY3RlZF0oaXRlbSwgc2VsZWN0ZWQpOyB9XG4gICAgaXRlbS5jbGFzc0xpc3QudG9nZ2xlKCdzZWxlY3RlZCcsIHNlbGVjdGVkKTtcbiAgfVxuXG4gIC8vIFNpbXBsaXN0aWMgaW1wbGVtZW50YXRpb24gb2YgaXRlbXMgcHJvcGVydHkg4oCUwqBkb2Vzbid0IGhhbmRsZSByZWRpc3RyaWJ1dGlvbi5cbiAgZ2V0IGl0ZW1zKCkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkcmVuO1xuICB9XG5cbiAgLy8gU2VlIG5vdGVzIGF0IGBjb25maWdgLlxuICAvLyBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgLy8gICByZXR1cm4gWydzZWxlY3RlZC1pbmRleCddO1xuICAvLyB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoU2luZ2xlU2VsZWN0aW9uRGVtby5pcywgU2luZ2xlU2VsZWN0aW9uRGVtbyk7XG4iXX0=
