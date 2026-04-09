(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../../node_modules/react/cjs/react.production.js
  var require_react_production = __commonJS({
    "../../node_modules/react/cjs/react.production.js"(exports) {
      "use strict";
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
      var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
      var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
      var REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode");
      var REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler");
      var REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer");
      var REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context");
      var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref");
      var REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense");
      var REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo");
      var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
      var REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity");
      var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      var ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function() {
        },
        enqueueReplaceState: function() {
        },
        enqueueSetState: function() {
        }
      };
      var assign = Object.assign;
      var emptyObject = {};
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      function ComponentDummy() {
      }
      ComponentDummy.prototype = Component.prototype;
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
      pureComponentPrototype.constructor = PureComponent;
      assign(pureComponentPrototype, Component.prototype);
      pureComponentPrototype.isPureReactComponent = true;
      var isArrayImpl = Array.isArray;
      function noop() {
      }
      var ReactSharedInternals = { H: null, A: null, T: null, S: null };
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      function ReactElement(type, key, props) {
        var refProp = props.ref;
        return {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref: void 0 !== refProp ? refProp : null,
          props
        };
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        return ReactElement(oldElement.type, newKey, oldElement.props);
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      var userProvidedKeyEscapeRegex = /\/+/g;
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback)
          return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + invokeCallback
          )), array.push(callback)), 1;
        invokeCallback = 0;
        var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ctor = payload._result;
          ctor = ctor();
          ctor.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status)
                payload._status = 1, payload._result = moduleObject;
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status)
                payload._status = 2, payload._result = error;
            }
          );
          -1 === payload._status && (payload._status = 0, payload._result = ctor);
        }
        if (1 === payload._status) return payload._result.default;
        throw payload._result;
      }
      var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      };
      var Children = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = Children;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function(size) {
          return ReactSharedInternals.H.useMemoCache(size);
        }
      };
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key;
        if (null != config)
          for (propName in void 0 !== config.key && (key = "" + config.key), config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          for (var childArray = Array(propName), i = 0; i < propName; i++)
            childArray[i] = arguments[i + 2];
          props.children = childArray;
        }
        return ReactElement(element.type, key, props);
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        var propName, props = {}, key = null;
        if (null != config)
          for (propName in void 0 !== config.key && (key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) props.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
            childArray[i] = arguments[i + 2];
          props.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === props[propName] && (props[propName] = childrenLength[propName]);
        return ReactElement(type, key, props);
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(render) {
        return { $$typeof: REACT_FORWARD_REF_TYPE, render };
      };
      exports.isValidElement = isValidElement;
      exports.lazy = function(ctor) {
        return {
          $$typeof: REACT_LAZY_TYPE,
          _payload: { _status: -1, _result: ctor },
          _init: lazyInitializer
        };
      };
      exports.memo = function(type, compare) {
        return {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
      };
      exports.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      };
      exports.unstable_useCacheRefresh = function() {
        return ReactSharedInternals.H.useCacheRefresh();
      };
      exports.use = function(usable) {
        return ReactSharedInternals.H.use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return ReactSharedInternals.H.useActionState(action, initialState, permalink);
      };
      exports.useCallback = function(callback, deps) {
        return ReactSharedInternals.H.useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        return ReactSharedInternals.H.useContext(Context);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(value, initialValue) {
        return ReactSharedInternals.H.useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        return ReactSharedInternals.H.useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return ReactSharedInternals.H.useEffectEvent(callback);
      };
      exports.useId = function() {
        return ReactSharedInternals.H.useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        return ReactSharedInternals.H.useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        return ReactSharedInternals.H.useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return ReactSharedInternals.H.useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return ReactSharedInternals.H.useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return ReactSharedInternals.H.useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return ReactSharedInternals.H.useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return ReactSharedInternals.H.useTransition();
      };
      exports.version = "19.2.4";
    }
  });

  // ../../node_modules/react/index.js
  var require_react = __commonJS({
    "../../node_modules/react/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_production();
      } else {
        module.exports = null;
      }
    }
  });

  // ../../node_modules/react/cjs/react-jsx-runtime.production.js
  var require_react_jsx_runtime_production = __commonJS({
    "../../node_modules/react/cjs/react-jsx-runtime.production.js"(exports) {
      "use strict";
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
      var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
      function jsxProd(type, config, maybeKey) {
        var key = null;
        void 0 !== maybeKey && (key = "" + maybeKey);
        void 0 !== config.key && (key = "" + config.key);
        if ("key" in config) {
          maybeKey = {};
          for (var propName in config)
            "key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        config = maybeKey.ref;
        return {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref: void 0 !== config ? config : null,
          props: maybeKey
        };
      }
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = jsxProd;
      exports.jsxs = jsxProd;
    }
  });

  // ../../node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "../../node_modules/react/jsx-runtime.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_jsx_runtime_production();
      } else {
        module.exports = null;
      }
    }
  });

  // trailhead-v1.jsx
  var import_react4 = __toESM(require_react());

  // ../../node_modules/lucide-react/dist/esm/createLucideIcon.js
  var import_react3 = __toESM(require_react());

  // ../../node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.js
  var mergeClasses = (...classes) => classes.filter((className, index, array) => {
    return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
  }).join(" ").trim();

  // ../../node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.js
  var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

  // ../../node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.js
  var toCamelCase = (string) => string.replace(
    /^([A-Z])|[\s-_]+(\w)/g,
    (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
  );

  // ../../node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.js
  var toPascalCase = (string) => {
    const camelCase = toCamelCase(string);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  };

  // ../../node_modules/lucide-react/dist/esm/Icon.js
  var import_react2 = __toESM(require_react());

  // ../../node_modules/lucide-react/dist/esm/defaultAttributes.js
  var defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  // ../../node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.js
  var hasA11yProp = (props) => {
    for (const prop in props) {
      if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
        return true;
      }
    }
    return false;
  };

  // ../../node_modules/lucide-react/dist/esm/context.js
  var import_react = __toESM(require_react());
  var LucideContext = (0, import_react.createContext)({});
  var useLucideContext = () => (0, import_react.useContext)(LucideContext);

  // ../../node_modules/lucide-react/dist/esm/Icon.js
  var Icon = (0, import_react2.forwardRef)(
    ({ color, size, strokeWidth, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => {
      const {
        size: contextSize = 24,
        strokeWidth: contextStrokeWidth = 2,
        absoluteStrokeWidth: contextAbsoluteStrokeWidth = false,
        color: contextColor = "currentColor",
        className: contextClass = ""
      } = useLucideContext() ?? {};
      const calculatedStrokeWidth = absoluteStrokeWidth ?? contextAbsoluteStrokeWidth ? Number(strokeWidth ?? contextStrokeWidth) * 24 / Number(size ?? contextSize) : strokeWidth ?? contextStrokeWidth;
      return (0, import_react2.createElement)(
        "svg",
        {
          ref,
          ...defaultAttributes,
          width: size ?? contextSize ?? defaultAttributes.width,
          height: size ?? contextSize ?? defaultAttributes.height,
          stroke: color ?? contextColor,
          strokeWidth: calculatedStrokeWidth,
          className: mergeClasses("lucide", contextClass, className),
          ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
          ...rest
        },
        [
          ...iconNode.map(([tag, attrs]) => (0, import_react2.createElement)(tag, attrs)),
          ...Array.isArray(children) ? children : [children]
        ]
      );
    }
  );

  // ../../node_modules/lucide-react/dist/esm/createLucideIcon.js
  var createLucideIcon = (iconName, iconNode) => {
    const Component = (0, import_react3.forwardRef)(
      ({ className, ...props }, ref) => (0, import_react3.createElement)(Icon, {
        ref,
        iconNode,
        className: mergeClasses(
          `lucide-${toKebabCase(toPascalCase(iconName))}`,
          `lucide-${iconName}`,
          className
        ),
        ...props
      })
    );
    Component.displayName = toPascalCase(iconName);
    return Component;
  };

  // ../../node_modules/lucide-react/dist/esm/icons/arrow-up.js
  var __iconNode = [
    ["path", { d: "m5 12 7-7 7 7", key: "hav0vg" }],
    ["path", { d: "M12 19V5", key: "x0mq9r" }]
  ];
  var ArrowUp = createLucideIcon("arrow-up", __iconNode);

  // ../../node_modules/lucide-react/dist/esm/icons/at-sign.js
  var __iconNode2 = [
    ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
    ["path", { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8", key: "7n84p3" }]
  ];
  var AtSign = createLucideIcon("at-sign", __iconNode2);

  // ../../node_modules/lucide-react/dist/esm/icons/award.js
  var __iconNode3 = [
    [
      "path",
      {
        d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",
        key: "1yiouv"
      }
    ],
    ["circle", { cx: "12", cy: "8", r: "6", key: "1vp47v" }]
  ];
  var Award = createLucideIcon("award", __iconNode3);

  // ../../node_modules/lucide-react/dist/esm/icons/bell.js
  var __iconNode4 = [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
    [
      "path",
      {
        d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
        key: "11g9vi"
      }
    ]
  ];
  var Bell = createLucideIcon("bell", __iconNode4);

  // ../../node_modules/lucide-react/dist/esm/icons/bookmark.js
  var __iconNode5 = [
    [
      "path",
      {
        d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z",
        key: "oz39mx"
      }
    ]
  ];
  var Bookmark = createLucideIcon("bookmark", __iconNode5);

  // ../../node_modules/lucide-react/dist/esm/icons/camera.js
  var __iconNode6 = [
    [
      "path",
      {
        d: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",
        key: "18u6gg"
      }
    ],
    ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }]
  ];
  var Camera = createLucideIcon("camera", __iconNode6);

  // ../../node_modules/lucide-react/dist/esm/icons/chevron-down.js
  var __iconNode7 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
  var ChevronDown = createLucideIcon("chevron-down", __iconNode7);

  // ../../node_modules/lucide-react/dist/esm/icons/chevron-left.js
  var __iconNode8 = [["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]];
  var ChevronLeft = createLucideIcon("chevron-left", __iconNode8);

  // ../../node_modules/lucide-react/dist/esm/icons/chevron-right.js
  var __iconNode9 = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]];
  var ChevronRight = createLucideIcon("chevron-right", __iconNode9);

  // ../../node_modules/lucide-react/dist/esm/icons/chevron-up.js
  var __iconNode10 = [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]];
  var ChevronUp = createLucideIcon("chevron-up", __iconNode10);

  // ../../node_modules/lucide-react/dist/esm/icons/circle-check-big.js
  var __iconNode11 = [
    ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335", key: "yps3ct" }],
    ["path", { d: "m9 11 3 3L22 4", key: "1pflzl" }]
  ];
  var CircleCheckBig = createLucideIcon("circle-check-big", __iconNode11);

  // ../../node_modules/lucide-react/dist/esm/icons/clock.js
  var __iconNode12 = [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }]
  ];
  var Clock = createLucideIcon("clock", __iconNode12);

  // ../../node_modules/lucide-react/dist/esm/icons/compass.js
  var __iconNode13 = [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    [
      "path",
      {
        d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
        key: "9ktpf1"
      }
    ]
  ];
  var Compass = createLucideIcon("compass", __iconNode13);

  // ../../node_modules/lucide-react/dist/esm/icons/dollar-sign.js
  var __iconNode14 = [
    ["line", { x1: "12", x2: "12", y1: "2", y2: "22", key: "7eqyqh" }],
    ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", key: "1b0p4s" }]
  ];
  var DollarSign = createLucideIcon("dollar-sign", __iconNode14);

  // ../../node_modules/lucide-react/dist/esm/icons/external-link.js
  var __iconNode15 = [
    ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
    ["path", { d: "M10 14 21 3", key: "gplh6r" }],
    ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
  ];
  var ExternalLink = createLucideIcon("external-link", __iconNode15);

  // ../../node_modules/lucide-react/dist/esm/icons/eye-off.js
  var __iconNode16 = [
    [
      "path",
      {
        d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
        key: "ct8e1f"
      }
    ],
    ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242", key: "151rxh" }],
    [
      "path",
      {
        d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
        key: "13bj9a"
      }
    ],
    ["path", { d: "m2 2 20 20", key: "1ooewy" }]
  ];
  var EyeOff = createLucideIcon("eye-off", __iconNode16);

  // ../../node_modules/lucide-react/dist/esm/icons/eye.js
  var __iconNode17 = [
    [
      "path",
      {
        d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
        key: "1nclc0"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
  ];
  var Eye = createLucideIcon("eye", __iconNode17);

  // ../../node_modules/lucide-react/dist/esm/icons/flame.js
  var __iconNode18 = [
    [
      "path",
      {
        d: "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",
        key: "1slcih"
      }
    ]
  ];
  var Flame = createLucideIcon("flame", __iconNode18);

  // ../../node_modules/lucide-react/dist/esm/icons/globe.js
  var __iconNode19 = [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" }],
    ["path", { d: "M2 12h20", key: "9i4pu4" }]
  ];
  var Globe = createLucideIcon("globe", __iconNode19);

  // ../../node_modules/lucide-react/dist/esm/icons/heart.js
  var __iconNode20 = [
    [
      "path",
      {
        d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
        key: "mvr1a0"
      }
    ]
  ];
  var Heart = createLucideIcon("heart", __iconNode20);

  // ../../node_modules/lucide-react/dist/esm/icons/house.js
  var __iconNode21 = [
    ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
    [
      "path",
      {
        d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
        key: "r6nss1"
      }
    ]
  ];
  var House = createLucideIcon("house", __iconNode21);

  // ../../node_modules/lucide-react/dist/esm/icons/image.js
  var __iconNode22 = [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
    ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
    ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
  ];
  var Image = createLucideIcon("image", __iconNode22);

  // ../../node_modules/lucide-react/dist/esm/icons/lock.js
  var __iconNode23 = [
    ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
    ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
  ];
  var Lock = createLucideIcon("lock", __iconNode23);

  // ../../node_modules/lucide-react/dist/esm/icons/mail.js
  var __iconNode24 = [
    ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", key: "132q7q" }],
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", key: "izxlao" }]
  ];
  var Mail = createLucideIcon("mail", __iconNode24);

  // ../../node_modules/lucide-react/dist/esm/icons/map-pin.js
  var __iconNode25 = [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
        key: "1r0f0z"
      }
    ],
    ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }]
  ];
  var MapPin = createLucideIcon("map-pin", __iconNode25);

  // ../../node_modules/lucide-react/dist/esm/icons/map.js
  var __iconNode26 = [
    [
      "path",
      {
        d: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z",
        key: "169xi5"
      }
    ],
    ["path", { d: "M15 5.764v15", key: "1pn4in" }],
    ["path", { d: "M9 3.236v15", key: "1uimfh" }]
  ];
  var Map = createLucideIcon("map", __iconNode26);

  // ../../node_modules/lucide-react/dist/esm/icons/message-circle.js
  var __iconNode27 = [
    [
      "path",
      {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
        key: "1sd12s"
      }
    ]
  ];
  var MessageCircle = createLucideIcon("message-circle", __iconNode27);

  // ../../node_modules/lucide-react/dist/esm/icons/mountain.js
  var __iconNode28 = [["path", { d: "m8 3 4 8 5-5 5 15H2L8 3z", key: "otkl63" }]];
  var Mountain = createLucideIcon("mountain", __iconNode28);

  // ../../node_modules/lucide-react/dist/esm/icons/navigation.js
  var __iconNode29 = [
    ["polygon", { points: "3 11 22 2 13 21 11 13 3 11", key: "1ltx0t" }]
  ];
  var Navigation = createLucideIcon("navigation", __iconNode29);

  // ../../node_modules/lucide-react/dist/esm/icons/pen-line.js
  var __iconNode30 = [
    ["path", { d: "M13 21h8", key: "1jsn5i" }],
    [
      "path",
      {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
        key: "1a8usu"
      }
    ]
  ];
  var PenLine = createLucideIcon("pen-line", __iconNode30);

  // ../../node_modules/lucide-react/dist/esm/icons/plus.js
  var __iconNode31 = [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "M12 5v14", key: "s699le" }]
  ];
  var Plus = createLucideIcon("plus", __iconNode31);

  // ../../node_modules/lucide-react/dist/esm/icons/radio.js
  var __iconNode32 = [
    ["path", { d: "M16.247 7.761a6 6 0 0 1 0 8.478", key: "1fwjs5" }],
    ["path", { d: "M19.075 4.933a10 10 0 0 1 0 14.134", key: "ehdyv1" }],
    ["path", { d: "M4.925 19.067a10 10 0 0 1 0-14.134", key: "1q22gi" }],
    ["path", { d: "M7.753 16.239a6 6 0 0 1 0-8.478", key: "r2q7qm" }],
    ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }]
  ];
  var Radio = createLucideIcon("radio", __iconNode32);

  // ../../node_modules/lucide-react/dist/esm/icons/search.js
  var __iconNode33 = [
    ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
    ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
  ];
  var Search = createLucideIcon("search", __iconNode33);

  // ../../node_modules/lucide-react/dist/esm/icons/send.js
  var __iconNode34 = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
        key: "1ffxy3"
      }
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
  ];
  var Send = createLucideIcon("send", __iconNode34);

  // ../../node_modules/lucide-react/dist/esm/icons/settings.js
  var __iconNode35 = [
    [
      "path",
      {
        d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
        key: "1i5ecw"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
  ];
  var Settings = createLucideIcon("settings", __iconNode35);

  // ../../node_modules/lucide-react/dist/esm/icons/share-2.js
  var __iconNode36 = [
    ["circle", { cx: "18", cy: "5", r: "3", key: "gq8acd" }],
    ["circle", { cx: "6", cy: "12", r: "3", key: "w7nqdw" }],
    ["circle", { cx: "18", cy: "19", r: "3", key: "1xt0gg" }],
    ["line", { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49", key: "47mynk" }],
    ["line", { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49", key: "1n3mei" }]
  ];
  var Share2 = createLucideIcon("share-2", __iconNode36);

  // ../../node_modules/lucide-react/dist/esm/icons/shield.js
  var __iconNode37 = [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y"
      }
    ]
  ];
  var Shield = createLucideIcon("shield", __iconNode37);

  // ../../node_modules/lucide-react/dist/esm/icons/smartphone.js
  var __iconNode38 = [
    ["rect", { width: "14", height: "20", x: "5", y: "2", rx: "2", ry: "2", key: "1yt0o3" }],
    ["path", { d: "M12 18h.01", key: "mhygvu" }]
  ];
  var Smartphone = createLucideIcon("smartphone", __iconNode38);

  // ../../node_modules/lucide-react/dist/esm/icons/star.js
  var __iconNode39 = [
    [
      "path",
      {
        d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
        key: "r04s7s"
      }
    ]
  ];
  var Star = createLucideIcon("star", __iconNode39);

  // ../../node_modules/lucide-react/dist/esm/icons/target.js
  var __iconNode40 = [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["circle", { cx: "12", cy: "12", r: "6", key: "1vlfrh" }],
    ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }]
  ];
  var Target = createLucideIcon("target", __iconNode40);

  // ../../node_modules/lucide-react/dist/esm/icons/trash-2.js
  var __iconNode41 = [
    ["path", { d: "M10 11v6", key: "nco0om" }],
    ["path", { d: "M14 11v6", key: "outv1u" }],
    ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }]
  ];
  var Trash2 = createLucideIcon("trash-2", __iconNode41);

  // ../../node_modules/lucide-react/dist/esm/icons/trending-up.js
  var __iconNode42 = [
    ["path", { d: "M16 7h6v6", key: "box55l" }],
    ["path", { d: "m22 7-8.5 8.5-5-5L2 17", key: "1t1m79" }]
  ];
  var TrendingUp = createLucideIcon("trending-up", __iconNode42);

  // ../../node_modules/lucide-react/dist/esm/icons/triangle-alert.js
  var __iconNode43 = [
    [
      "path",
      {
        d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
        key: "wmoenq"
      }
    ],
    ["path", { d: "M12 9v4", key: "juzpu7" }],
    ["path", { d: "M12 17h.01", key: "p32p05" }]
  ];
  var TriangleAlert = createLucideIcon("triangle-alert", __iconNode43);

  // ../../node_modules/lucide-react/dist/esm/icons/trophy.js
  var __iconNode44 = [
    ["path", { d: "M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978", key: "1n3hpd" }],
    ["path", { d: "M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978", key: "rfe1zi" }],
    ["path", { d: "M18 9h1.5a1 1 0 0 0 0-5H18", key: "7xy6bh" }],
    ["path", { d: "M4 22h16", key: "57wxv0" }],
    ["path", { d: "M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z", key: "1mhfuq" }],
    ["path", { d: "M6 9H4.5a1 1 0 0 1 0-5H6", key: "tex48p" }]
  ];
  var Trophy = createLucideIcon("trophy", __iconNode44);

  // ../../node_modules/lucide-react/dist/esm/icons/user-check.js
  var __iconNode45 = [
    ["path", { d: "m16 11 2 2 4-4", key: "9rsbq5" }],
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
  ];
  var UserCheck = createLucideIcon("user-check", __iconNode45);

  // ../../node_modules/lucide-react/dist/esm/icons/user-plus.js
  var __iconNode46 = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
    ["line", { x1: "19", x2: "19", y1: "8", y2: "14", key: "1bvyxn" }],
    ["line", { x1: "22", x2: "16", y1: "11", y2: "11", key: "1shjgl" }]
  ];
  var UserPlus = createLucideIcon("user-plus", __iconNode46);

  // ../../node_modules/lucide-react/dist/esm/icons/users.js
  var __iconNode47 = [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
    ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
  ];
  var Users = createLucideIcon("users", __iconNode47);

  // ../../node_modules/lucide-react/dist/esm/icons/video.js
  var __iconNode48 = [
    [
      "path",
      {
        d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
        key: "ftymec"
      }
    ],
    ["rect", { x: "2", y: "6", width: "14", height: "12", rx: "2", key: "158x01" }]
  ];
  var Video = createLucideIcon("video", __iconNode48);

  // ../../node_modules/lucide-react/dist/esm/icons/wrench.js
  var __iconNode49 = [
    [
      "path",
      {
        d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",
        key: "1ngwbx"
      }
    ]
  ];
  var Wrench = createLucideIcon("wrench", __iconNode49);

  // ../../node_modules/lucide-react/dist/esm/icons/x.js
  var __iconNode50 = [
    ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
    ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
  ];
  var X = createLucideIcon("x", __iconNode50);

  // ../../node_modules/lucide-react/dist/esm/icons/zap.js
  var __iconNode51 = [
    [
      "path",
      {
        d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
        key: "1xq2db"
      }
    ]
  ];
  var Zap = createLucideIcon("zap", __iconNode51);

  // trailhead-v1.jsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var T = {
    red: "#BD472A",
    copper: "#C49A6C",
    tertiary: "#8B7D6B",
    charcoal: "#2A2A28",
    warmStone: "#E8E2D9",
    warmBg: "#F5F2ED",
    darkBg: "#111111",
    darkCard: "#1A1A1A",
    white: "#FFFFFF",
    lightGray: "#F9F7F4",
    textGray: "#666666",
    mutedText: "#999999",
    green: "#4A7C59"
  };
  var RANK_TIERS = [
    { name: "Scout", min: 0, max: 999, color: "#8B7D6B", icon: "Compass" },
    { name: "Explorer", min: 1e3, max: 4999, color: "#4A7C59", icon: "Map" },
    { name: "Pathfinder", min: 5e3, max: 14999, color: "#C49A6C", icon: "Navigation" },
    { name: "Trailblazer", min: 15e3, max: 29999, color: "#C49A6C", icon: "Flame" },
    { name: "Navigator", min: 3e4, max: 49999, color: "#C0A060", icon: "Star" },
    { name: "Expedition Lead", min: 5e4, max: 99999, color: "#BD472A", icon: "Shield" },
    { name: "Legend", min: 1e5, max: Infinity, color: "#FFD700", icon: "Trophy" }
  ];
  var RANK_ICON_MAP = { Compass, Map, Navigation, Flame, Star, Shield, Trophy };
  function getUserRank(points) {
    return RANK_TIERS.find((r) => points >= r.min && points <= r.max) || RANK_TIERS[0];
  }
  function RankBadge({ points, size = 12 }) {
    const rank = getUserRank(points);
    const Icon2 = RANK_ICON_MAP[rank.icon] || Star;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: rank.name, style: { display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon2, { size, color: rank.color, strokeWidth: 1.5 }) });
  }
  function RankBadgeWithName({ points, size = 10 }) {
    const rank = getUserRank(points);
    const Icon2 = RANK_ICON_MAP[rank.icon] || Star;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon2, { size, color: rank.color, strokeWidth: 1.5 }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: "Trebuchet MS, Gill Sans, sans-serif", fontSize: size - 1, color: rank.color, fontWeight: 600, letterSpacing: 0.3 }, children: rank.name })
    ] });
  }
  var USER_POINTS = {
    "Sierra_Tactical": 48900,
    "Nomad_Queen": 32100,
    "Peak_Finder": 28750,
    "TrailBoss_88": 26200,
    "DirtRoadDave": 22800,
    "MountainGoat": 19400,
    "FoxFanatic": 17600,
    "BajaBound": 14200,
    "StockHero": 13100,
    "LiftKing": 12800,
    "KyleLPO": 12450,
    "Nomad_Mike": 11200,
    "DesertRat_4x4": 8500,
    "Overland_Expert": 15200,
    "SteelCraft": 9800,
    "MudRunner_CO": 6700
  };
  function getPoints(user) {
    return USER_POINTS[user] || 1500;
  }
  var BADGE_TIER_COLORS = ["#8B7D6B", "#C49A6C", "#C0A060", "#FFD700", "#BD472A"];
  var BADGE_CATEGORIES = [
    { name: "Trail Mastery", icon: MapPin, tiers: [
      { name: "First Trail", desc: "Log your first route", goal: 1 },
      { name: "Trail Runner", desc: "Log 5 routes", goal: 5 },
      { name: "Pathmaker", desc: "Log 15 routes", goal: 15 },
      { name: "Trail Legend", desc: "Log 50 routes", goal: 50 }
    ] },
    { name: "Community", icon: MessageCircle, tiers: [
      { name: "First Post", desc: "Create your first feed post", goal: 1 },
      { name: "Storyteller", desc: "Create 10 forum threads", goal: 10 },
      { name: "Helpful Hand", desc: "Get 50 likes on your posts", goal: 50 },
      { name: "Community Pillar", desc: "Get 500 likes on your posts", goal: 500 }
    ] },
    { name: "Builder", icon: Wrench, tiers: [
      { name: "Garage Started", desc: "Add your first build", goal: 1 },
      { name: "Master Builder", desc: "Add 3 complete builds", goal: 3 },
      { name: "Mod Guru", desc: "Log 20 modifications", goal: 20 }
    ] },
    { name: "Explorer", icon: Compass, tiers: [
      { name: "Daily Driver", desc: "Log in 7 days in a row", goal: 7 },
      { name: "Dedicated", desc: "Log in 30 days in a row", goal: 30 },
      { name: "Shutterbug", desc: "Upload 50 photos", goal: 50 },
      { name: "First Responder", desc: "Respond to 5 recovery requests", goal: 5 }
    ] },
    { name: "Bounty Hunter", icon: Target, tiers: [
      { name: "First Bounty", desc: "Complete your first bounty", goal: 1 },
      { name: "Bounty Pro", desc: "Complete 5 bounties", goal: 5 },
      { name: "Top Contributor", desc: "Earn $500 in bounties", goal: 500 }
    ] }
  ];
  var MY_BADGE_PROGRESS = {
    "Trail Mastery": 9,
    "Community": 92,
    "Builder": 2,
    "Explorer": 5,
    "Bounty Hunter": 3
  };
  function getBadgeTierForCategory(catName) {
    const cat = BADGE_CATEGORIES.find((c) => c.name === catName);
    if (!cat) return { tier: -1, color: "#333", name: "Locked", tierIdx: -1 };
    const progress = MY_BADGE_PROGRESS[catName] || 0;
    let highestTier = -1;
    for (let i = cat.tiers.length - 1; i >= 0; i--) {
      if (progress >= cat.tiers[i].goal) {
        highestTier = i;
        break;
      }
    }
    if (highestTier < 0) return { tier: -1, color: "#333", name: "Locked", tierIdx: -1, progress, nextGoal: cat.tiers[0].goal, nextName: cat.tiers[0].name };
    const color = BADGE_TIER_COLORS[Math.min(highestTier, BADGE_TIER_COLORS.length - 1)];
    return { tier: highestTier, color, name: cat.tiers[highestTier].name, tierIdx: highestTier, progress, nextGoal: cat.tiers[highestTier + 1] ? cat.tiers[highestTier + 1].goal : null, nextName: cat.tiers[highestTier + 1] ? cat.tiers[highestTier + 1].name : null };
  }
  var fontLink = document.createElement("link");
  fontLink.href = "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap";
  fontLink.rel = "stylesheet";
  if (!document.querySelector('link[href*="Source+Serif+4"]')) document.head.appendChild(fontLink);
  var GMAPS_KEY = "AIzaSyBEqra4C4sdGg7ufDyh6xjwo5g79nXJHkc";
  function loadGmaps() {
    if (window.google?.maps) return Promise.resolve();
    if (window._gmapsReadyPromise) return window._gmapsReadyPromise;
    window._gmapsReadyPromise = new Promise((resolve, reject) => {
      window._gmapsReady = resolve;
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places&callback=_gmapsReady`;
      s.async = true;
      s.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(s);
    });
    return window._gmapsReadyPromise;
  }
  if (!document.querySelector("style[data-trailhead-scroll]")) {
    const scrollStyle = document.createElement("style");
    scrollStyle.setAttribute("data-trailhead-scroll", "1");
    scrollStyle.textContent = `
    .th-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
    .th-scroll:hover, .th-scroll:active { scrollbar-color: rgba(139,125,107,0.35) transparent; }
    .th-scroll::-webkit-scrollbar { width: 4px; }
    .th-scroll::-webkit-scrollbar-track { background: transparent; }
    .th-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
    .th-scroll:hover::-webkit-scrollbar-thumb,
    .th-scroll:active::-webkit-scrollbar-thumb { background: rgba(139,125,107,0.35); }
    .th-scroll::-webkit-scrollbar-thumb:hover { background: rgba(139,125,107,0.55); }
    .th-hscroll { scrollbar-width: none; }
    .th-hscroll::-webkit-scrollbar { display: none; }
    @keyframes thspin { to { transform: rotate(360deg); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    .th-rich-body h1 { display: block !important; font-size: 26px !important; font-weight: 700 !important; color: #fff !important; margin: 14px 0 8px !important; font-family: Trebuchet MS, Gill Sans, sans-serif !important; line-height: 1.2 !important; }
    .th-rich-body h2 { display: block !important; font-size: 21px !important; font-weight: 700 !important; color: #fff !important; margin: 12px 0 6px !important; font-family: Trebuchet MS, Gill Sans, sans-serif !important; line-height: 1.3 !important; }
    .th-rich-body h3 { display: block !important; font-size: 17px !important; font-weight: 600 !important; color: #fff !important; margin: 10px 0 4px !important; font-family: Trebuchet MS, Gill Sans, sans-serif !important; line-height: 1.3 !important; }
    .th-rich-body p { display: block !important; margin: 6px 0 !important; font-size: 14px !important; }
    .th-rich-body ul { display: block !important; list-style-type: disc !important; padding-left: 24px !important; margin: 8px 0 !important; }
    .th-rich-body ol { display: block !important; list-style-type: decimal !important; padding-left: 24px !important; margin: 8px 0 !important; }
    .th-rich-body li { display: list-item !important; margin: 4px 0 !important; list-style-position: outside !important; }
    .th-rich-body ul li { list-style-type: disc !important; }
    .th-rich-body ol li { list-style-type: decimal !important; }
    .th-rich-body a { color: #C49A6C !important; text-decoration: underline !important; cursor: pointer !important; }
    .th-rich-body b, .th-rich-body strong { font-weight: 700 !important; color: #fff !important; }
    .th-rich-body u { text-decoration: underline !important; }
    .th-rich-body strike, .th-rich-body s { text-decoration: line-through !important; }
  `;
    document.head.appendChild(scrollStyle);
  }
  var sans = "'Trebuchet MS', 'Gill Sans', sans-serif";
  var serif = "'Source Serif 4', 'Georgia', serif";
  var parseCoords = (coords) => {
    if (!coords) return null;
    const nums = coords.match(/([\d.]+)°?\s*([NSns]),?\s*([\d.]+)°?\s*([EWew])/);
    if (!nums) return null;
    const lat = nums[2].toUpperCase() === "S" ? -parseFloat(nums[1]) : parseFloat(nums[1]);
    const lng = nums[4].toUpperCase() === "W" ? -parseFloat(nums[3]) : parseFloat(nums[3]);
    return { lat, lng };
  };
  var getMapQuery = (coords, location) => {
    const c = parseCoords(coords);
    if (c) return `${c.lat},${c.lng}`;
    if (location) return location;
    return null;
  };
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
  function MapOverlay({ coords, location, title, onClose, recoveryCtx, onRecoveryStartTrip, onRecoveryArrived }) {
    const query = getMapQuery(coords, location);
    const mapRef = (0, import_react4.useRef)(null);
    const mapInstance = (0, import_react4.useRef)(null);
    const markerRef = (0, import_react4.useRef)(null);
    const directionsRenderer = (0, import_react4.useRef)(null);
    const userMarkerRef = (0, import_react4.useRef)(null);
    const watchIdRef = (0, import_react4.useRef)(null);
    const [mode, setMode] = (0, import_react4.useState)("place");
    const [startInput, setStartInput] = (0, import_react4.useState)("");
    const [origin, setOrigin] = (0, import_react4.useState)(null);
    const [gpsStatus, setGpsStatus] = (0, import_react4.useState)(null);
    const [mapReady, setMapReady] = (0, import_react4.useState)(false);
    const [dirError, setDirError] = (0, import_react4.useState)(null);
    const [routeSteps, setRouteSteps] = (0, import_react4.useState)([]);
    const [currentStepIdx, setCurrentStepIdx] = (0, import_react4.useState)(0);
    const [tripSummary, setTripSummary] = (0, import_react4.useState)(null);
    const [userPos, setUserPos] = (0, import_react4.useState)(null);
    const [distToNext, setDistToNext] = (0, import_react4.useState)(null);
    const [recoveryNotified, setRecoveryNotified] = (0, import_react4.useState)(false);
    const [proximityTriggered, setProximityTriggered] = (0, import_react4.useState)(false);
    const [distToDest, setDistToDest] = (0, import_react4.useState)(null);
    const destCoords = parseCoords(coords);
    const destLatLng = destCoords ? { lat: destCoords.lat, lng: destCoords.lng } : null;
    const externalUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    const externalDirUrl = origin ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${query}` : `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    (0, import_react4.useEffect)(() => {
      if (!query || !mapRef.current) return;
      let cancelled = false;
      const init = async () => {
        try {
          await loadGmaps();
        } catch (e) {
          console.error("Google Maps load failed:", e);
          return;
        }
        if (cancelled || !mapRef.current) return;
        const center = destLatLng || { lat: 39.5, lng: -98.35 };
        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: destLatLng ? 13 : 5,
          mapTypeId: "terrain",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] }
          ]
        });
        mapInstance.current = map;
        if (destLatLng) {
          markerRef.current = new window.google.maps.Marker({
            position: destLatLng,
            map,
            title: title || "Location",
            icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: T.red, fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 }
          });
        } else if (location) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: location }, (results, status) => {
            if (status === "OK" && results[0]) {
              map.setCenter(results[0].geometry.location);
              map.setZoom(13);
              markerRef.current = new window.google.maps.Marker({
                position: results[0].geometry.location,
                map,
                title: title || location,
                icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: T.red, fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 }
              });
            }
          });
        }
        directionsRenderer.current = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: { strokeColor: T.red, strokeWeight: 4, strokeOpacity: 0.9 }
        });
        setMapReady(true);
      };
      init();
      return () => {
        cancelled = true;
      };
    }, [query]);
    (0, import_react4.useEffect)(() => {
      if (!mapReady || !origin || mode !== "directions" && mode !== "navigating") return;
      setDirError(null);
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination: destLatLng ? destLatLng : location,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === "OK" && directionsRenderer.current) {
            if (markerRef.current) markerRef.current.setMap(null);
            directionsRenderer.current.setDirections(result);
            const leg = result.routes[0]?.legs[0];
            if (leg) {
              setRouteSteps(leg.steps.map((s) => ({
                instruction: stripHtml(s.instructions),
                distance: s.distance?.text || "",
                duration: s.duration?.text || "",
                endLat: s.end_location.lat(),
                endLng: s.end_location.lng(),
                startLat: s.start_location.lat(),
                startLng: s.start_location.lng()
              })));
              setTripSummary({ distance: leg.distance?.text || "", duration: leg.duration?.text || "" });
              setCurrentStepIdx(0);
            }
          } else {
            setDirError("Could not find a route. Try a different starting location.");
          }
        }
      );
    }, [origin, mode, mapReady]);
    (0, import_react4.useEffect)(() => {
      if (mode !== "navigating") {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (userMarkerRef.current) {
          userMarkerRef.current.setMap(null);
          userMarkerRef.current = null;
        }
        return;
      }
      if (!navigator.geolocation || !mapInstance.current) return;
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const p = new window.google.maps.LatLng(lat, lng);
          setUserPos({ lat, lng });
          if (!userMarkerRef.current) {
            userMarkerRef.current = new window.google.maps.Marker({
              position: p,
              map: mapInstance.current,
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#4285F4", fillOpacity: 1, strokeColor: T.white, strokeWeight: 3 },
              zIndex: 999
            });
          } else {
            userMarkerRef.current.setPosition(p);
          }
          mapInstance.current.panTo(p);
          setCurrentStepIdx((prev) => {
            if (prev >= routeSteps.length) return prev;
            const step = routeSteps[prev];
            const dist = haversine(lat, lng, step.endLat, step.endLng);
            setDistToNext(Math.round(dist));
            if (dist < 50 && prev < routeSteps.length - 1) {
              return prev + 1;
            }
            return prev;
          });
          if (destLatLng && recoveryCtx) {
            const destDist = haversine(lat, lng, destLatLng.lat, destLatLng.lng);
            setDistToDest(Math.round(destDist));
            if (destDist < 500 && !proximityTriggered) {
              setProximityTriggered(true);
              if (onRecoveryArrived) onRecoveryArrived(recoveryCtx);
            }
          }
        },
        (err) => console.warn("GPS error:", err.message),
        { enableHighAccuracy: true, timeout: 1e4, maximumAge: 2e3 }
      );
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    }, [mode, routeSteps]);
    if (!query) return null;
    const startDirections = () => {
      setGpsStatus("locating");
      setDirError(null);
      if (!navigator.geolocation) {
        setGpsStatus("failed");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const o = `${pos.coords.latitude},${pos.coords.longitude}`;
          setOrigin(o);
          setMode("directions");
          setGpsStatus(null);
        },
        () => setGpsStatus("failed"),
        { enableHighAccuracy: true, timeout: 8e3 }
      );
    };
    const handleManualStart = () => {
      if (!startInput.trim()) return;
      setOrigin(startInput.trim());
      setMode("directions");
      setGpsStatus(null);
    };
    const startTrip = () => {
      setCurrentStepIdx(0);
      setMode("navigating");
      if (mapInstance.current) mapInstance.current.setZoom(17);
      if (recoveryCtx && !recoveryNotified && onRecoveryStartTrip) {
        onRecoveryStartTrip(recoveryCtx);
        setRecoveryNotified(true);
      }
    };
    const endTrip = () => {
      setMode("directions");
      setDistToNext(null);
      if (mapInstance.current) {
        const bounds = new window.google.maps.LatLngBounds();
        routeSteps.forEach((s) => {
          bounds.extend({ lat: s.startLat, lng: s.startLng });
          bounds.extend({ lat: s.endLat, lng: s.endLng });
        });
        mapInstance.current.fitBounds(bounds);
      }
    };
    const clearRoute = () => {
      setMode("place");
      setOrigin(null);
      setStartInput("");
      setGpsStatus(null);
      setDirError(null);
      setRouteSteps([]);
      setTripSummary(null);
      setDistToNext(null);
      if (directionsRenderer.current) directionsRenderer.current.setDirections({ routes: [] });
      if (markerRef.current && mapInstance.current) {
        markerRef.current.setMap(mapInstance.current);
        if (destLatLng) mapInstance.current.setCenter(destLatLng);
        mapInstance.current.setZoom(13);
      }
    };
    const currentStep = routeSteps[currentStepIdx];
    const nextStep = routeSteps[currentStepIdx + 1];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, zIndex: 300, background: T.darkBg, display: "flex", flexDirection: "column" }, children: [
      mode !== "navigating" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: title || "Location" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: mode === "directions" && origin ? `From: ${origin}` : coords || location })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => window.open(mode === "directions" ? externalDirUrl : externalUrl, "_blank", "noopener"), style: { display: "flex", alignItems: "center", gap: 5, background: T.darkCard, border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer", flexShrink: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 13, color: T.red }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.red, fontWeight: 600, letterSpacing: 0.5 }, children: "OPEN APP" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: mapRef, style: { width: "100%", height: "100%" } }),
        !mapReady && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: T.darkBg }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 28, height: 28, border: `3px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite", margin: "0 auto 12px" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.tertiary }, children: "Loading map..." })
        ] }) }),
        mode === "navigating" && currentStep && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 400 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "12px 12px 0", background: `${T.charcoal}F5`, backdropFilter: "blur(12px)", borderRadius: 14, border: `1px solid ${T.darkCard}`, overflow: "hidden" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px 16px 12px", display: "flex", gap: 12, alignItems: "flex-start" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 40, height: 40, borderRadius: 10, background: T.red, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 20, color: T.white }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 15, fontWeight: 700, color: T.white, display: "block", lineHeight: 1.3 }, children: currentStep.instruction }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12, marginTop: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }, children: distToNext !== null ? distToNext > 1e3 ? `${(distToNext / 1609).toFixed(1)} mi` : `${distToNext} m` : currentStep.distance }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.tertiary }, children: currentStep.duration })
              ] })
            ] })
          ] }),
          nextStep && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "10px 16px", borderTop: `1px solid ${T.darkCard}`, display: "flex", gap: 8, alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, fontWeight: 600, letterSpacing: 0.5 }, children: "THEN" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.mutedText, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: nextStep.instruction }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: nextStep.distance })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 3, background: T.darkCard }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 3, background: T.red, width: `${Math.min(100, (currentStepIdx + 1) / routeSteps.length * 100)}%`, transition: "width 0.5s ease" } }) })
        ] }) }),
        gpsStatus === "locating" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 12, left: 12, right: 12, background: `${T.darkCard}F2`, backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", zIndex: 400, display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.charcoal}` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 18, height: 18, border: `2px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite", flexShrink: 0 } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white }, children: "Getting your location..." })
        ] }),
        gpsStatus === "failed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 12, left: 12, right: 12, background: `${T.darkCard}F2`, backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", zIndex: 400, border: `1px solid ${T.charcoal}` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 14, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600 }, children: "Enter starting location" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setGpsStatus(null), style: { background: "none", border: "none", cursor: "pointer", padding: 2, marginLeft: "auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                value: startInput,
                onChange: (e) => setStartInput(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && handleManualStart(),
                placeholder: "City, state or address...",
                autoFocus: true,
                style: { flex: 1, padding: "11px 14px", borderRadius: 8, background: T.charcoal, border: `1px solid ${T.tertiary}40`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none" }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: handleManualStart, style: { padding: "0 16px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 18, color: T.white }) })
          ] })
        ] }),
        dirError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: 12, left: 12, right: 12, background: `${T.darkCard}F2`, backdropFilter: "blur(10px)", borderRadius: 12, padding: "12px 16px", zIndex: 400, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.red}40` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14, color: T.red }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: dirError })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "12px 16px", background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: mode === "navigating" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        recoveryCtx && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: `${T.red}15`, borderRadius: 8, border: `1px solid ${T.red}30`, marginBottom: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14, color: T.red }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.red, fontWeight: 600, letterSpacing: 0.5, display: "block" }, children: "RECOVERY RESPONSE" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: [
              "Heading to help ",
              recoveryCtx.author
            ] })
          ] }),
          distToDest !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700 }, children: distToDest > 1609 ? `${(distToDest / 1609).toFixed(1)} mi` : `${distToDest} m` })
        ] }),
        recoveryCtx && proximityTriggered && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: `${T.green}15`, borderRadius: 8, border: `1px solid ${T.green}30`, marginBottom: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 14, color: T.green }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.green, fontWeight: 600, flex: 1 }, children: [
            "You've arrived \u2014 ",
            recoveryCtx.author,
            " has been notified"
          ] })
        ] }),
        recoveryCtx && !proximityTriggered && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
          setProximityTriggered(true);
          if (onRecoveryArrived) onRecoveryArrived(recoveryCtx);
        }, style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, background: `${T.green}20`, border: `1px dashed ${T.green}50`, cursor: "pointer", marginBottom: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 13, color: T.green }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: 0.5 }, children: "SIMULATE ARRIVAL (TESTING)" })
        ] }),
        tripSummary && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "center", gap: 20, marginBottom: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5, display: "block" }, children: "DISTANCE" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }, children: tripSummary.distance })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5, display: "block" }, children: "ETA" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }, children: tripSummary.duration })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5, display: "block" }, children: "STEP" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }, children: [
              currentStepIdx + 1,
              "/",
              routeSteps.length
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: endTrip, style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "END TRIP" })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10 }, children: [
        mode === "place" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: startDirections, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "GET DIRECTIONS" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: startTrip, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px", borderRadius: 8, background: recoveryCtx ? T.red : T.green, border: "none", cursor: "pointer" }, children: [
            recoveryCtx ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14, color: T.white }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 14, color: T.white }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: recoveryCtx ? "START RESCUE" : "START TRIP" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: clearRoute, style: { padding: "12px 16px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { padding: "12px 20px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.tertiary, fontWeight: 600 }, children: "CLOSE" }) })
      ] }) })
    ] });
  }
  var pill = (active) => ({
    padding: "6px 14px",
    borderRadius: 20,
    background: active ? T.red : T.darkCard,
    color: active ? T.white : T.tertiary,
    fontFamily: sans,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.5,
    cursor: "pointer",
    border: "none",
    whiteSpace: "nowrap",
    transition: "all 0.2s"
  });
  var cardStyle = {
    background: T.darkCard,
    borderRadius: 12,
    overflow: "hidden"
  };
  function BottomNav({ active, onNav }) {
    const items = [
      { key: "feed", label: "Feed", icon: House },
      { key: "forum", label: "Forum", icon: Compass },
      { key: "routes", label: "Routes", icon: Map },
      { key: "builds", label: "Builds", icon: Wrench },
      { key: "ranks", label: "Ranks", icon: Trophy }
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", position: "sticky", bottom: 0, background: T.darkCard, padding: "6px 0 max(6px, env(safe-area-inset-bottom))", borderTop: `1px solid ${T.charcoal}`, zIndex: 100, flexShrink: 0 }, children: items.map((it) => {
      const Icon2 = it.icon;
      const isActive = active === it.key;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => onNav(it.key), style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 0", position: "relative" }, children: [
        isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: -8, width: 20, height: 3, borderRadius: 2, background: T.red } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon2, { size: 20, color: isActive ? T.red : T.tertiary, strokeWidth: 1.5 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: isActive ? T.red : T.tertiary, letterSpacing: 1, fontWeight: 600 }, children: it.label.toUpperCase() })
      ] }, it.key);
    }) });
  }
  function NotifBadge({ count, color }) {
    if (!count) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: color || T.red, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: `2px solid ${T.charcoal}` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white, lineHeight: 1 }, children: count > 99 ? "99+" : count }) });
  }
  function BellNotifPanel({ onClose, onViewUser, notifs, onDismiss, onClearAll }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: "100%", right: 0, width: "calc(100vw - 32px)", maxWidth: 398, background: T.darkCard, borderRadius: "0 0 12px 12px", boxShadow: `0 12px 40px rgba(0,0,0,0.6)`, zIndex: 200, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${T.charcoal}`, borderTop: "none" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${T.charcoal}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, letterSpacing: 1 }, children: "NOTIFICATIONS" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16, color: T.tertiary }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "th-scroll", style: { flex: 1, overflowY: "auto", minHeight: 0 }, children: notifs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "40px 16px", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 28, color: T.tertiary, strokeWidth: 1, style: { opacity: 0.3, marginBottom: 8 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 13, color: T.tertiary, margin: 0 }, children: "No new notifications" })
      ] }) : notifs.map((n, i) => {
        const Icon2 = n.icon;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${T.charcoal}22`, cursor: "pointer", transition: "background 0.15s", position: "relative" }, onMouseEnter: (e) => e.currentTarget.style.background = `${T.charcoal}`, onMouseLeave: (e) => e.currentTarget.style.background = "transparent", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 32, height: 32, borderRadius: "50%", background: `${n.iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon2, { size: 14, color: n.iconColor, strokeWidth: 1.8 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontFamily: serif, fontSize: 13, color: T.white, margin: 0, lineHeight: 1.45 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontWeight: 600, cursor: "pointer" }, onClick: (e) => {
                e.stopPropagation();
                onViewUser && onViewUser(n.user);
              }, children: n.user }),
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: T.tertiary }, children: n.text }),
              n.target && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: T.warmStone }, children: n.target })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, marginTop: 2, display: "block" }, children: formatPostTime(n.time) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: (e) => {
            e.stopPropagation();
            onDismiss(n.id);
          }, style: { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", flexShrink: 0, opacity: 0.5 }, onMouseEnter: (e) => e.currentTarget.style.opacity = 1, onMouseLeave: (e) => e.currentTarget.style.opacity = 0.5, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12, color: T.tertiary }) })
        ] }, n.id);
      }) }),
      notifs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClearAll, style: { padding: "10px 16px", borderTop: `1px solid ${T.charcoal}`, background: "none", border: "none", borderTopStyle: "solid", borderTopWidth: 1, borderTopColor: T.charcoal, cursor: "pointer", textAlign: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.red, letterSpacing: 0.5, fontWeight: 600 }, children: "CLEAR ALL NOTIFICATIONS" }) })
    ] });
  }
  function RecoveryNotifPanel({ onClose, onGoToRecovery, alerts, onDismiss, onClearAll, onOpenMap, onOpenDM }) {
    const urgencyColor = (u) => u === "HIGH" ? T.red : T.copper;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: "100%", right: 0, width: "calc(100vw - 32px)", maxWidth: 398, background: T.darkCard, borderRadius: "0 0 12px 12px", boxShadow: `0 12px 40px rgba(0,0,0,0.6)`, zIndex: 200, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${T.charcoal}`, borderTop: "none" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${T.charcoal}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14, color: T.red }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, letterSpacing: 1 }, children: "RECOVERY ALERTS" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          alerts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClearAll, style: { background: "none", border: "none", cursor: "pointer", padding: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5 }, children: "CLEAR" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16, color: T.tertiary }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "th-scroll", style: { flex: 1, overflowY: "auto", minHeight: 0 }, children: alerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "40px 16px", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 28, color: T.tertiary, strokeWidth: 1, style: { opacity: 0.3, marginBottom: 8 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 13, color: T.tertiary, margin: 0 }, children: "No active recovery alerts" })
      ] }) : alerts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "14px 16px", borderBottom: `1px solid ${T.charcoal}22`, cursor: "pointer", position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, background: urgencyColor(a.urgency), padding: "2px 7px", borderRadius: 3, letterSpacing: 1, fontWeight: 600 }, children: a.urgency }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: formatPostTime(a.time) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: (e) => {
            e.stopPropagation();
            onDismiss(a.id);
          }, style: { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", opacity: 0.5 }, onMouseEnter: (e) => e.currentTarget.style.opacity = 1, onMouseLeave: (e) => e.currentTarget.style.opacity = 0.5, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12, color: T.tertiary }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 14, color: T.white, margin: "0 0 4px", fontWeight: 600 }, children: a.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: "0 0 8px", lineHeight: 1.5 }, children: a.detail }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 11, color: T.tertiary }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: a.location })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: a.vehicle })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
            onClose();
            onOpenDM && onOpenDM(a.author, "I'm responding to your recovery request \u2014 on my way to help!", { title: `\u{1F6A8} Recovery: ${a.title}`, user: a.author, initial: a.author.charAt(0).toUpperCase(), type: "recovery", location: a.location, urgency: a.urgency });
          }, style: { background: T.red, color: T.white, fontFamily: sans, fontSize: 10, fontWeight: 600, padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 0.5 }, children: "RESPOND" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
            onClose();
            onOpenMap && onOpenMap(a.coords, a.location, a.title, { author: a.author, alertId: a.id, title: a.title });
          }, style: { background: "none", color: T.tertiary, fontFamily: sans, fontSize: 10, padding: "7px 14px", borderRadius: 6, border: `1px solid ${T.charcoal}`, cursor: "pointer", letterSpacing: 0.5 }, children: "VIEW ON MAP" })
        ] })
      ] }, a.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
        onClose();
        onGoToRecovery && onGoToRecovery();
      }, style: { padding: "12px 16px", borderTop: `1px solid ${T.charcoal}`, background: "none", border: "none", borderTopStyle: "solid", borderTopWidth: 1, borderTopColor: T.charcoal, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 12, color: T.red }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.red, fontWeight: 600, letterSpacing: 0.5 }, children: "VIEW ALL RECOVERY REQUESTS" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14, color: T.red })
      ] })
    ] });
  }
  function TopBar({ onProfile, onBack, showBack, title, onViewUser, onGoToRecovery, onOpenMap, onSearch, onOpenDM, dmUnread, bellNotifs, setBellNotifs, profilePic, notifPrefs, recoveryAlerts, setRecoveryAlerts }) {
    const notifTypeMap = { like: "likes", comment: "comments", reply: "replies", follow: "follows", mention: "mentions" };
    const filteredNotifs = bellNotifs.filter((n) => {
      const pref = notifTypeMap[n.type];
      return !pref || notifPrefs && notifPrefs[pref] !== false;
    });
    const [openPanel, setOpenPanel] = (0, import_react4.useState)(null);
    const togglePanel = (panel) => setOpenPanel(openPanel === panel ? null : panel);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, zIndex: 200, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0, position: "relative" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        showBack && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onBack, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", marginRight: 4 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white, strokeWidth: 1.5 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white, letterSpacing: 3 }, children: title || "TRAILHEAD" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 14 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => onSearch && onSearch(), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 19, color: T.tertiary, strokeWidth: 1.5 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => onOpenDM && onOpenDM(), style: { background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", display: "flex", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: 19, color: T.tertiary, strokeWidth: 1.5 }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotifBadge, { count: dmUnread, color: T.copper })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => togglePanel("recovery"), style: { background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", display: "flex", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 19, color: openPanel === "recovery" ? T.red : T.tertiary, strokeWidth: 1.5 }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotifBadge, { count: recoveryAlerts.length, color: T.red })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => togglePanel("bell"), style: { background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", display: "flex", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 19, color: openPanel === "bell" ? T.copper : T.tertiary, strokeWidth: 1.5 }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotifBadge, { count: filteredNotifs.length, color: T.copper })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
          setOpenPanel(null);
          onProfile();
        }, style: { background: "none", border: "none", cursor: "pointer", padding: 0 }, children: profilePic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: profilePic, alt: "", style: { width: 28, height: 28, borderRadius: "50%", objectFit: "cover" } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 28, height: 28, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }, children: "K" }) }) })
      ] }),
      openPanel === "bell" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        BellNotifPanel,
        {
          onClose: () => setOpenPanel(null),
          onViewUser: (u) => {
            setOpenPanel(null);
            onViewUser && onViewUser(u);
          },
          notifs: filteredNotifs,
          onDismiss: (id) => setBellNotifs((prev) => prev.filter((n) => n.id !== id)),
          onClearAll: () => setBellNotifs([])
        }
      ),
      openPanel === "recovery" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        RecoveryNotifPanel,
        {
          onClose: () => setOpenPanel(null),
          onGoToRecovery: () => {
            setOpenPanel(null);
            onGoToRecovery && onGoToRecovery();
          },
          alerts: recoveryAlerts,
          onDismiss: (id) => setRecoveryAlerts((prev) => prev.filter((a) => a.id !== id)),
          onClearAll: () => setRecoveryAlerts([]),
          onOpenMap,
          onOpenDM: (user, prefill, shared) => {
            setOpenPanel(null);
            onOpenDM && onOpenDM(user, prefill, shared);
          }
        }
      ),
      openPanel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { onClick: () => setOpenPanel(null), style: { position: "fixed", inset: 0, zIndex: 150 } })
    ] });
  }
  var globalSearchUsers = [
    { handle: "KyleLPO", initial: "K", name: "Kyle \u2014 Lone Peak Overland", badge: "Founder", followers: 4200 },
    { handle: "TrailBoss_88", initial: "T", name: "TrailBoss 88", badge: "Explorer", followers: 1860 },
    { handle: "VoltWrangler", initial: "V", name: "Volt Wrangler", badge: "Master Builder", followers: 3100 },
    { handle: "BajaBound", initial: "B", name: "Baja Bound", badge: "Navigator", followers: 920 },
    { handle: "SuspensionGuru", initial: "S", name: "Suspension Guru", badge: "Master Builder", followers: 2740 },
    { handle: "StockHero", initial: "S", name: "Stock Hero", badge: "Scout", followers: 680 },
    { handle: "Overland_Expert", initial: "O", name: "Overland Expert", badge: "Master Builder", followers: 2340 },
    { handle: "DesertRat_4x4", initial: "D", name: "DesertRat 4x4", badge: "Navigator", followers: 1580 },
    { handle: "SolarTrail", initial: "S", name: "Solar Trail", badge: "Explorer", followers: 1120 },
    { handle: "FoxFanatic", initial: "F", name: "Fox Fanatic", badge: "Explorer", followers: 840 },
    { handle: "GearDump", initial: "G", name: "Gear Dump", badge: "Scout", followers: 320 },
    { handle: "LiftKing", initial: "L", name: "Lift King", badge: "Master Builder", followers: 1950 },
    { handle: "DirtRoadDave", initial: "D", name: "DirtRoad Dave", badge: "Explorer", followers: 770 },
    { handle: "WattMaster", initial: "W", name: "Watt Master", badge: "Explorer", followers: 990 }
  ];
  var globalSearchRoutes = [
    { name: "The Timberline Traverse", difficulty: "Hard", distance: "64.2 MI", region: "Pacific Northwest" },
    { name: "Hell's Revenge Loop", difficulty: "Expert", distance: "6.5 MI", region: "Southwest & Desert" },
    { name: "Eagle Rim Loop", difficulty: "Moderate", distance: "42.5 MI", region: "Southwest & Desert" },
    { name: "Shadow Peak Traverse", difficulty: "Hard", distance: "38.0 MI", region: "Rockies & High Plains" }
  ];
  function GlobalSearch({ onClose, onViewUser, onOpenThread, onNavigate, forumUserReplies, forumViewCounts }) {
    const [query, setQuery] = (0, import_react4.useState)("");
    const [activeTab, setActiveTab] = (0, import_react4.useState)("ALL");
    const inputRef = (0, import_react4.useRef)(null);
    const tabs = ["ALL", "THREADS", "USERS", "ROUTES"];
    (0, import_react4.useEffect)(() => {
      if (inputRef.current) inputRef.current.focus();
    }, []);
    const q = query.trim().toLowerCase();
    const threadResults = q.length > 0 ? (() => {
      const results = [];
      forumData.categories.forEach((cat) => {
        cat.subs.forEach((sub) => {
          (forumData.threads[sub.name] || []).forEach((t) => {
            if (t.title.toLowerCase().includes(q) || t.body && t.body.toLowerCase().includes(q) || t.author.toLowerCase().includes(q)) {
              results.push({ ...t, catName: cat.name, subName: sub.name, cat, sub });
            }
          });
        });
      });
      return results;
    })() : [];
    const userResults = q.length > 0 ? globalSearchUsers.filter(
      (u) => u.handle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    ) : [];
    const routeResults = q.length > 0 ? globalSearchRoutes.filter(
      (r) => r.name.toLowerCase().includes(q) || r.region.toLowerCase().includes(q) || r.difficulty.toLowerCase().includes(q)
    ) : [];
    const totalResults = threadResults.length + userResults.length + routeResults.length;
    const showThreads = (activeTab === "ALL" || activeTab === "THREADS") && threadResults.length > 0;
    const showUsers = (activeTab === "ALL" || activeTab === "USERS") && userResults.length > 0;
    const showRoutes = (activeTab === "ALL" || activeTab === "ROUTES") && routeResults.length > 0;
    const limitAll = activeTab === "ALL" ? 3 : 999;
    const diffColor = (d) => d === "Expert" ? T.red : d === "Hard" ? T.copper : T.green;
    const badgeColor = (b) => b === "Founder" ? T.red : b === "Master Builder" ? T.copper : b === "Navigator" ? T.green : T.tertiary;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, background: T.darkBg, zIndex: 500, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px", border: `1px solid ${T.copper}40` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 16, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: inputRef, value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search threads, @users, routes...", style: { flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, marginLeft: 8, padding: 0 } }),
            query && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setQuery(""), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginTop: 12, overflowX: "auto" }, children: tabs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setActiveTab(t), style: { padding: "6px 14px", borderRadius: 20, background: activeTab === t ? T.red : T.darkCard, border: activeTab === t ? "none" : `1px solid ${T.charcoal}`, cursor: "pointer", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: activeTab === t ? T.white : T.tertiary, fontWeight: 700, letterSpacing: 1 }, children: t }) }, t)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, overflowY: "auto", padding: "16px" }, children: q.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", padding: "40px 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 32, color: T.tertiary, style: { opacity: 0.3, marginBottom: 12 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 4px" }, children: "Search across Trailhead" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }, children: "Find threads, users, and routes" })
      ] }) : totalResults === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", padding: "40px 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 32, color: T.tertiary, style: { opacity: 0.3, marginBottom: 12 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 4px" }, children: [
          'No results for "',
          query,
          '"'
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }, children: "Try different keywords or check spelling" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        showUsers && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600 }, children: [
              "USERS (",
              userResults.length,
              ")"
            ] }),
            activeTab === "ALL" && userResults.length > limitAll && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setActiveTab("USERS"), style: { background: "none", border: "none", cursor: "pointer", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }, children: "SEE ALL" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: userResults.slice(0, limitAll).map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => {
            onClose();
            onViewUser && onViewUser(u.handle);
          }, style: { background: T.darkCard, padding: "12px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === Math.min(limitAll, userResults.length) - 1 ? "0 0 8px 8px" : 0, borderBottom: i < Math.min(limitAll, userResults.length) - 1 ? `1px solid ${T.charcoal}` : "none", display: "flex", alignItems: "center", gap: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 40, height: 40, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${badgeColor(u.badge)}` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 15, fontWeight: 700, color: T.white }, children: u.initial }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: [
                "@",
                u.handle
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 2 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: badgeColor(u.badge), background: `${badgeColor(u.badge)}15`, padding: "1px 6px", borderRadius: 3, letterSpacing: 0.5 }, children: u.badge }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: [
                  u.followers.toLocaleString(),
                  " followers"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14, color: T.tertiary })
          ] }, u.handle)) })
        ] }),
        showThreads && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600 }, children: [
              "THREADS (",
              threadResults.length,
              ")"
            ] }),
            activeTab === "ALL" && threadResults.length > limitAll && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setActiveTab("THREADS"), style: { background: "none", border: "none", cursor: "pointer", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }, children: "SEE ALL" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: threadResults.slice(0, limitAll).map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => {
            onClose();
            onOpenThread && onOpenThread(t.id, t.catName, t.subName);
          }, style: { background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === Math.min(limitAll, threadResults.length) - 1 ? "0 0 8px 8px" : 0, borderBottom: i < Math.min(limitAll, threadResults.length) - 1 ? `1px solid ${T.charcoal}` : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 10, color: T.copper }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 0.5 }, children: t.catName }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary }, children: "\u203A" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary }, children: t.subName })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.white, margin: "0 0 6px", lineHeight: 1.4 }, children: t.title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: [
                "@",
                t.author
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: [
                (t.replies || 0) + ((forumUserReplies || {})[t.id] || []).length,
                " replies"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: [
                (() => {
                  const base = typeof t.views === "string" ? parseFloat(t.views.replace(/[^0-9.]/g, "")) * (t.views.includes("K") ? 1e3 : 1) : t.views || 0;
                  const extra = (forumViewCounts || {})[t.id] || 0;
                  const total = Math.round(base + extra);
                  return total >= 1e3 ? (total / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(total);
                })(),
                " views"
              ] })
            ] })
          ] }, t.id)) })
        ] }),
        showRoutes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600 }, children: [
              "ROUTES (",
              routeResults.length,
              ")"
            ] }),
            activeTab === "ALL" && routeResults.length > limitAll && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setActiveTab("ROUTES"), style: { background: "none", border: "none", cursor: "pointer", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }, children: "SEE ALL" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: routeResults.slice(0, limitAll).map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => {
            onClose();
            onNavigate && onNavigate("routes");
          }, style: { background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === Math.min(limitAll, routeResults.length) - 1 ? "0 0 8px 8px" : 0, borderBottom: i < Math.min(limitAll, routeResults.length) - 1 ? `1px solid ${T.charcoal}` : "none", display: "flex", alignItems: "center", gap: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 40, height: 40, borderRadius: 8, background: `${diffColor(r.difficulty)}15`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { size: 18, color: diffColor(r.difficulty) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: r.name }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 2 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: diffColor(r.difficulty), fontWeight: 600 }, children: r.difficulty }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: r.distance }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: r.region })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14, color: T.tertiary })
          ] }, r.name)) })
        ] })
      ] }) })
    ] });
  }
  var ensureUrl = (link) => {
    if (!link) return "#";
    if (/^https?:\/\//i.test(link)) return link;
    return "https://" + link;
  };
  var formatPostTime = (t) => {
    if (!t) return "";
    if (typeof t === "string" && !/^\d{10,}$/.test(t)) return t;
    const ts = typeof t === "number" ? t : parseInt(t, 10);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 0) return "Just now";
    const secs = Math.floor(diff / 1e3);
    if (secs < 60) return "Just now";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    const d = new Date(ts);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  };
  function MentionInput({ value, onChange, onKeyDown, placeholder, style, inputRef, users, multiline, onFocus, onBlur }) {
    const [mentionQuery, setMentionQuery] = (0, import_react4.useState)("");
    const [mentionActive, setMentionActive] = (0, import_react4.useState)(false);
    const [cursorPos, setCursorPos] = (0, import_react4.useState)(0);
    const internalRef = (0, import_react4.useRef)(null);
    const ref = inputRef || internalRef;
    const mentionUsers = users || globalSearchUsers.filter((u) => u.handle !== "KyleLPO");
    const handleChange = (e) => {
      const val = e.target.value;
      const pos = e.target.selectionStart;
      onChange(val);
      setCursorPos(pos);
      const before = val.slice(0, pos);
      const atMatch = before.match(/@(\w*)$/);
      if (atMatch) {
        setMentionQuery(atMatch[1].toLowerCase());
        setMentionActive(true);
      } else {
        setMentionActive(false);
        setMentionQuery("");
      }
    };
    const insertMention = (handle) => {
      const before = value.slice(0, cursorPos);
      const after = value.slice(cursorPos);
      const atIdx = before.lastIndexOf("@");
      const newVal = before.slice(0, atIdx) + "@" + handle + " " + after;
      onChange(newVal);
      setMentionActive(false);
      setMentionQuery("");
      setTimeout(() => {
        if (ref.current) {
          const newPos = atIdx + handle.length + 2;
          ref.current.focus();
          ref.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    };
    const filtered = mentionUsers.filter(
      (u) => mentionQuery === "" || u.handle.toLowerCase().includes(mentionQuery) || u.name.toLowerCase().includes(mentionQuery)
    ).slice(0, 5);
    const InputEl = multiline ? "textarea" : "input";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", flex: 1 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        InputEl,
        {
          ref,
          value,
          onChange: handleChange,
          onKeyDown: (e) => {
            if (mentionActive && e.key === "Escape") {
              setMentionActive(false);
              return;
            }
            onKeyDown && onKeyDown(e);
          },
          onFocus,
          onBlur,
          placeholder,
          style
        }
      ),
      mentionActive && filtered.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: "100%", left: 0, right: 0, background: T.darkCard, border: `1px solid ${T.charcoal}`, borderRadius: 10, marginBottom: 4, maxHeight: 200, overflowY: "auto", zIndex: 300, boxShadow: "0 -4px 20px rgba(0,0,0,0.5)" }, children: filtered.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        insertMention(u.handle);
      }, style: { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", borderBottom: `1px solid ${T.charcoal}20`, cursor: "pointer", textAlign: "left" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 28, height: 28, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }, children: u.initial }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, display: "block" }, children: [
            "@",
            u.handle
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: u.name })
        ] }),
        u.badge && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { marginLeft: "auto", fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}18`, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }, children: u.badge })
      ] }, u.handle)) })
    ] });
  }
  var extractMentions = (text) => {
    const matches = text.match(/@(\w+)/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1));
  };
  function ImageCarousel({ images, startIndex, onClose }) {
    const [idx, setIdx] = (0, import_react4.useState)(startIndex || 0);
    const touchStartX = (0, import_react4.useRef)(null);
    if (!images || images.length === 0) return null;
    const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
    const next = () => setIdx((i) => (i + 1) % images.length);
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
      if (touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) > 50) {
        diff > 0 ? prev() : next();
      }
      touchStartX.current = null;
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { position: "absolute", top: 16, right: 16, background: `${T.charcoal}CC`, border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18, color: T.white }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", fontFamily: sans, fontSize: 12, color: T.warmBg, letterSpacing: 1, zIndex: 10 }, children: [
        idx + 1,
        " / ",
        images.length
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: (e) => e.stopPropagation(), onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd, style: { width: "100%", maxWidth: 430, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "50px 0" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: images[idx], alt: "", style: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4 } }),
        images.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: (e) => {
            e.stopPropagation();
            prev();
          }, style: { position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: `${T.charcoal}AA`, border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: (e) => {
            e.stopPropagation();
            next();
          }, style: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: `${T.charcoal}AA`, border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 22, color: T.white }) })
        ] })
      ] }),
      images.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { onClick: (e) => e.stopPropagation(), style: { display: "flex", gap: 6, padding: "12px 16px", overflowX: "auto", maxWidth: 430, width: "100%" }, children: images.map((img, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: img, alt: "", onClick: () => setIdx(i), style: { width: 48, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0, cursor: "pointer", border: i === idx ? `2px solid ${T.copper}` : `2px solid transparent`, opacity: i === idx ? 1 : 0.5, transition: "opacity 0.15s, border 0.15s" } }, i)) })
    ] });
  }
  var defaultFeedItems = [
    {
      id: "f1",
      type: "RECOVERY",
      user: "DesertRat_4x4",
      initial: "D",
      time: "2m ago",
      title: "Stuck in Black Bear Pass: Winch Support Required",
      body: "High-centered on a shelf. Front locker acting up. Need a heavy rig with at least 12k winch to assist.",
      location: "San Juan, CO",
      urgency: "HIGH",
      coords: "45.89\xB0 N, 121.35\xB0 W",
      likes: 18,
      comments: 24,
      seedComments: [
        { user: "TrailBoss_88", initial: "T", text: "I'm 20 minutes out with a 12k Warn. Hang tight.", time: "1m ago", likes: 14 },
        { user: "Sierra_Tactical", initial: "S", text: "What's your exact pin? I can relay to the convoy group heading that way.", time: "1m ago", likes: 8 },
        { user: "Peak_Finder", initial: "P", text: "That shelf gets everyone. Stay patient, help is close.", time: Date.now(), likes: 3 }
      ]
    },
    {
      id: "f2",
      type: "ROUTES",
      user: "Peak_Finder",
      initial: "P",
      time: "28m ago",
      title: "Hell's Revenge Loop",
      body: null,
      distance: "6.5 MI",
      duration: "2H 45M",
      badge: "TOP RATED",
      verified: 12,
      likes: 142,
      comments: 31,
      seedComments: [
        { user: "Overland_Expert", initial: "O", text: "Ran this last weekend \u2014 the fin climb is no joke. Air down to 18 psi minimum.", time: "20m ago", likes: 23 },
        { user: "BajaBound", initial: "B", text: "One of the best loops in Moab. The views at the top are unreal.", time: "15m ago", likes: 11 },
        { user: "DirtRoadDave", initial: "D", text: "Is this doable on 33s with no lockers?", time: "8m ago", likes: 5 }
      ]
    },
    {
      id: "f3",
      type: "BUILDS",
      user: "Overland_Expert",
      initial: "OE",
      time: "1h ago",
      title: "Stage 3: Suspension Complete",
      subtitle: "Posted a new Build Stage",
      stage: "Stage 3: Suspension",
      likes: 1200,
      comments: 84,
      seedComments: [
        { user: "LiftKing", initial: "L", text: "Icon Stage 3 is the move. How's the ride quality on highway?", time: "52m ago", likes: 34 },
        { user: "FoxFanatic", initial: "F", text: "Clean install. What spring rate did you go with up front?", time: "45m ago", likes: 18 },
        { user: "SuspensionGuru", initial: "S", text: "Great choice on the adjustable UCAs. Makes a huge difference for alignment.", time: "30m ago", likes: 27 }
      ]
    },
    {
      id: "f4",
      type: "CONVOYS",
      user: "Sierra_Tactical",
      initial: "S",
      time: "2h ago",
      title: "Alpine Summit Chase",
      body: "Join 8 other rigs for a sunrise ascent. Stock friendly with recovery points.",
      month: "OCT",
      day: "24",
      departs: "05:00 AM",
      slots: 4,
      likes: 67,
      comments: 12,
      seedComments: [
        { user: "MountainGoat", initial: "M", text: "Count me in! I'll bring my recovery kit and a SAT phone.", time: "1h ago", likes: 9 },
        { user: "GearDump", initial: "G", text: "Is there a minimum tire size requirement?", time: "55m ago", likes: 2 }
      ]
    },
    {
      id: "f5",
      type: "PHOTOS",
      user: "Nomad_Queen",
      initial: "N",
      time: "3h ago",
      title: "Golden hour on the Mojave \u2014 first trip with the new rack setup",
      body: null,
      photoCount: 4,
      likes: 389,
      comments: 42,
      seedComments: [
        { user: "SolarTrail", initial: "S", text: "That light is unreal. What rack system are you running?", time: "2h ago", likes: 31 },
        { user: "DesertRat_4x4", initial: "D", text: "Mojave golden hour hits different. Amazing shots.", time: "1h ago", likes: 22 },
        { user: "WattMaster", initial: "W", text: "The rack looks great with that setup. Clean build overall.", time: "45m ago", likes: 8 }
      ]
    },
    {
      id: "f6",
      type: "ROUTES",
      user: "TrailBoss_88",
      initial: "T",
      time: "4h ago",
      title: "Rubicon Trail \u2014 Full GPS Track",
      body: null,
      distance: "22 MI",
      duration: "6H 30M",
      badge: null,
      verified: 34,
      likes: 210,
      comments: 56,
      seedComments: [
        { user: "Overland_Expert", initial: "O", text: "The Rubicon is a bucket list trail. This GPS track is solid \u2014 saved it.", time: "3h ago", likes: 19 },
        { user: "StockHero", initial: "S", text: "Can a stock 4Runner make it through or do you need lockers?", time: "2h ago", likes: 7 },
        { user: "LiftKing", initial: "L", text: "Did this last spring. The Sluice is the gnarliest section by far.", time: "1h ago", likes: 15 }
      ]
    },
    {
      id: "f7",
      type: "BUILDS",
      user: "Kyle Morrison",
      initial: "K",
      time: "5h ago",
      title: "CBI Front Bumper Install",
      subtitle: "Updated build \u2014 THE HIGHLANDER",
      stage: "Armor: CBI Offroad",
      likes: 94,
      comments: 17,
      seedComments: [
        { user: "TrailBoss_88", initial: "T", text: "CBI makes the best bumpers in the game. How's the approach angle now?", time: "4h ago", likes: 12 },
        { user: "GearDump", initial: "G", text: "Looks tank-tough. Did you add the light bar cutout?", time: "3h ago", likes: 6 }
      ]
    },
    {
      id: "f8",
      type: "CONVOYS",
      user: "BajaBound",
      initial: "B",
      time: "6h ago",
      title: "Baja Norte Expedition \u2014 Feb 2027",
      body: '5-day coastal run from Ensenada to Bah\xEDa de los \xC1ngeles. Need min 33" tires and recovery gear.',
      month: "FEB",
      day: "14",
      departs: "06:00 AM",
      slots: 6,
      likes: 156,
      comments: 38,
      seedComments: [
        { user: "Sierra_Tactical", initial: "S", text: "This sounds epic. What's the camping situation \u2014 dispersed or established sites?", time: "5h ago", likes: 16 },
        { user: "Nomad_Queen", initial: "N", text: "I've done this route twice. Pro tip: carry extra fuel after El Rosario.", time: "4h ago", likes: 42 },
        { user: "DesertRat_4x4", initial: "D", text: "I'm in. Running 35s with dual lockers. Will DM you.", time: "3h ago", likes: 10 }
      ]
    },
    {
      id: "f9",
      type: "PHOTOS",
      user: "MountainGoat",
      initial: "M",
      time: "8h ago",
      title: "Snowcapped ridgeline crossing \u2014 4Runner doing 4Runner things",
      body: null,
      photoCount: 7,
      likes: 512,
      comments: 63,
      seedComments: [
        { user: "Peak_Finder", initial: "P", text: "This is why I drive a 4Runner. Incredible shots.", time: "7h ago", likes: 38 },
        { user: "Overland_Expert", initial: "O", text: "What tires are you running for the snow? Looks like great traction.", time: "6h ago", likes: 14 },
        { user: "DirtRoadDave", initial: "D", text: "The snow on the ridge makes this look like a postcard. Jealous.", time: "5h ago", likes: 21 }
      ]
    },
    {
      id: "f10",
      type: "RECOVERY",
      user: "TrailBoss_88",
      initial: "T",
      time: "12h ago",
      title: "Tow Needed \u2014 Broken Axle on Rubicon",
      body: "Front axle snapped at the birfield. Cannot move under own power. Need a flatbed or heavy tow rig.",
      location: "Rubicon Trail, CA",
      urgency: "HIGH",
      coords: "38.97\xB0 N, 120.16\xB0 W",
      likes: 32,
      comments: 41,
      seedComments: [
        { user: "Overland_Expert", initial: "O", text: "That's a tough break. I know a flatbed service out of Placerville \u2014 DM me.", time: "11h ago", likes: 17 },
        { user: "LiftKing", initial: "L", text: "Birfields are the weak link on those axles. Glad you're safe.", time: "10h ago", likes: 9 }
      ]
    },
    {
      id: "f11",
      type: "FORUM",
      user: "VoltWrangler",
      initial: "V",
      time: "6h ago",
      title: "How to properly wire auxiliary batteries for dual setups",
      body: "Complete guide to dual battery setups \u2014 isolators, wiring gauges, fusing, and what NOT to do. Learned some hard lessons.",
      forumCat: "How-To Guides",
      forumSub: "Electrical & Wiring",
      replies: 124,
      views: "8.4K",
      threadId: 5,
      likes: 89,
      comments: 124,
      seedComments: [
        { user: "WattMaster", initial: "W", text: "Great write-up. One thing to add \u2014 always fuse both sides of the isolator.", time: "5h ago", likes: 45 },
        { user: "SolarTrail", initial: "S", text: "Wish I had this guide before I fried my first isolator. Bookmarked.", time: "4h ago", likes: 28 }
      ]
    },
    {
      id: "f12",
      type: "FORUM",
      user: "TrailBoss_88",
      initial: "T",
      time: "2h ago",
      title: "Best budget lift kit for 3rd Gen Tacoma?",
      body: "Looking at Icon, Bilstein, or OME for my 2020 Tacoma. Budget is around $1,500. Primarily doing fire roads and moderate trails in the PNW.",
      forumCat: "How-To Guides",
      forumSub: "Suspension & Lift",
      replies: 47,
      views: "2.1K",
      threadId: 1,
      likes: 56,
      comments: 47,
      seedComments: [
        { user: "SuspensionGuru", initial: "S", text: "For $1,500 you can't beat Bilstein 5100s with OME springs. Great combo for PNW trails.", time: "1h ago", likes: 33 },
        { user: "FoxFanatic", initial: "F", text: "If you can stretch the budget a bit, the Icon Stage 1 is worth every penny.", time: "45m ago", likes: 19 },
        { user: "LiftKing", initial: "L", text: "OME is the go-to for budget builds. Reliable and great ride quality.", time: "30m ago", likes: 24 }
      ]
    },
    {
      id: "f13",
      type: "FORUM",
      user: "BajaBound",
      initial: "B",
      time: "1d ago",
      title: "Planning a Baja convoy \u2014 Feb 2027",
      body: "Looking for 6-8 rigs for a 2-week Baja trip. Starting in San Diego, heading down to Cabo via the pacific coast.",
      forumCat: "Trip Coordination",
      forumSub: "Convoy Planning",
      replies: 31,
      views: "890",
      threadId: 7,
      likes: 42,
      comments: 31,
      seedComments: [
        { user: "Sierra_Tactical", initial: "S", text: "I'm interested. What's the plan for border crossing logistics?", time: "20h ago", likes: 11 },
        { user: "Nomad_Queen", initial: "N", text: "Two weeks in Baja sounds amazing. Is there a WhatsApp group yet?", time: "18h ago", likes: 15 }
      ]
    }
  ];
  function FeedScreen({ onViewUser, onOpenMap, onOpenThread, onOpenDM, feedItems, onUpdateFeed, onAddNotification, forumUserReplies, forumViewCounts, savedRoutes, onSaveRoute, onUnsaveRoute, onStartNav, onAwardPoints }) {
    const [activeFilter, setActiveFilter] = (0, import_react4.useState)("ALL");
    const filters = ["ALL", "BUILDS", "CONVOYS", "ROUTES", "PHOTOS", "FORUM"];
    const [likedPosts, setLikedPosts] = (0, import_react4.useState)({});
    const [likedComments, setLikedComments] = (0, import_react4.useState)({});
    const [commentLikeCounts, setCommentLikeCounts] = (0, import_react4.useState)({});
    const [openComments, setOpenComments] = (0, import_react4.useState)(null);
    const [commentText, setCommentText] = (0, import_react4.useState)("");
    const [postComments, setPostComments] = (0, import_react4.useState)({});
    const [shareMenuId, setShareMenuId] = (0, import_react4.useState)(null);
    const [sharePickerId, setSharePickerId] = (0, import_react4.useState)(null);
    const [shareSearch, setShareSearch] = (0, import_react4.useState)("");
    const [copiedToast, setCopiedToast] = (0, import_react4.useState)(false);
    const [expandedBuildPost, setExpandedBuildPost] = (0, import_react4.useState)(null);
    const [expandedRoutePost, setExpandedRoutePost] = (0, import_react4.useState)(null);
    const [routeShareMenu, setRouteShareMenu] = (0, import_react4.useState)(null);
    const [carouselImages, setCarouselImages] = (0, import_react4.useState)(null);
    const [carouselIndex, setCarouselIndex] = (0, import_react4.useState)(0);
    const collectBuildImages = (bd) => {
      const imgs = [];
      if (bd.mainPhotos) bd.mainPhotos.forEach((p) => imgs.push(p.url));
      [bd.suspension, bd.tires, bd.wheels, bd.bumpers, bd.armor, bd.lighting, bd.rack, bd.winch, bd.otherMods].forEach((mod) => {
        if (mod && mod.photo) mod.photo.forEach((p) => imgs.push(p.url));
      });
      if (bd.camperPhoto) bd.camperPhoto.forEach((p) => imgs.push(p.url));
      return imgs;
    };
    const openCarousel = (images, startIdx) => {
      if (images && images.length > 0) {
        setCarouselImages(images);
        setCarouselIndex(startIdx || 0);
      }
    };
    const commentInputRef = (0, import_react4.useRef)(null);
    const shareSearchRef = (0, import_react4.useRef)(null);
    const toggleLike = (id) => {
      const wasLiked = likedPosts[id];
      setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
      onUpdateFeed && onUpdateFeed(feedItems.map(
        (item) => item.id === id ? { ...item, likes: item.likes + (wasLiked ? -1 : 1) } : item
      ));
      if (!wasLiked) {
        const post = feedItems.find((p) => p.id === id);
        if (post) onAddNotification && onAddNotification({ type: "like", user: "KyleLPO", text: "liked a post by @" + post.user, target: post.title, icon: Heart, iconColor: T.red });
      }
    };
    const toggleCommentLike = (postId, commentIdx, comment) => {
      const key = postId + "-" + commentIdx;
      const wasLiked = likedComments[key];
      setLikedComments((prev) => ({ ...prev, [key]: !prev[key] }));
      setCommentLikeCounts((prev) => ({ ...prev, [key]: (prev[key] || (comment.likes || 0)) + (wasLiked ? -1 : 1) }));
      if (!wasLiked) {
        const post = feedItems.find((p) => p.id === postId);
        onAddNotification && onAddNotification({ type: "like", user: "KyleLPO", text: "liked @" + comment.user + "'s comment on", target: post ? post.title : "", icon: Heart, iconColor: T.red });
      }
    };
    const addComment = (id) => {
      if (!commentText.trim()) return;
      const newComment = { user: "KyleLPO", initial: "K", text: commentText.trim(), time: Date.now(), likes: 0 };
      setPostComments((prev) => ({ ...prev, [id]: [...prev[id] || [], newComment] }));
      onUpdateFeed && onUpdateFeed(feedItems.map(
        (item) => item.id === id ? { ...item, comments: item.comments + 1 } : item
      ));
      const post = feedItems.find((p) => p.id === id);
      if (post) onAddNotification && onAddNotification({ type: "comment", user: "KyleLPO", text: "commented on @" + post.user + "'s post", target: post.title, icon: MessageCircle, iconColor: T.copper });
      const mentions = extractMentions(commentText);
      mentions.forEach((handle) => {
        if (handle !== "KyleLPO") {
          onAddNotification && onAddNotification({ type: "mention", user: "KyleLPO", text: "mentioned you in a comment", target: post ? post.title : "", icon: AtSign, iconColor: T.copper });
        }
      });
      onAwardPoints && onAwardPoints(3, "Comment Posted");
      setCommentText("");
    };
    const toggleComments = (id) => {
      setOpenComments(openComments === id ? null : id);
      setCommentText("");
      setShareMenuId(null);
      setSharePickerId(null);
      setShareSearch("");
    };
    const filtered = activeFilter === "ALL" ? feedItems : feedItems.filter((p) => p.type === activeFilter);
    const fmtLikes = (n) => n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : n;
    const sendShareToUser = (recipientHandle, item) => {
      const shareText = "";
      const sharedPost = { id: item.id, title: item.title, user: item.user, initial: item.initial, type: item.type, image: item.photoUrls && item.photoUrls[0] || null, threadId: item.threadId, forumCat: item.forumCat, forumSub: item.forumSub };
      setShareMenuId(null);
      setSharePickerId(null);
      setShareSearch("");
      onOpenDM && onOpenDM(recipientHandle, shareText, sharedPost);
    };
    const actionBar = (item, extraLeft) => {
      const liked = likedPosts[item.id];
      const allComments = [...item.seedComments || [], ...postComments[item.id] || []];
      const shareFilteredUsers = globalSearchUsers.filter((u) => u.handle !== "KyleLPO" && (shareSearch === "" || u.name.toLowerCase().includes(shareSearch.toLowerCase()) || u.handle.toLowerCase().includes(shareSearch.toLowerCase())));
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
              e.stopPropagation();
              toggleLike(item.id);
            }, style: { display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 20, background: liked ? `${T.red}18` : "transparent", border: "none", cursor: "pointer", transition: "all 0.15s" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 16, color: liked ? T.red : T.tertiary, strokeWidth: 1.5, fill: liked ? T.red : "none" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: liked ? T.red : T.tertiary, fontWeight: liked ? 600 : 400 }, children: fmtLikes(item.likes) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
              e.stopPropagation();
              toggleComments(item.id);
            }, style: { display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 20, background: openComments === item.id ? `${T.copper}18` : "transparent", border: "none", cursor: "pointer" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 16, color: openComments === item.id ? T.copper : T.tertiary, strokeWidth: 1.5 }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: openComments === item.id ? T.copper : T.tertiary }, children: item.comments })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: (e) => {
              e.stopPropagation();
              const isOpen = shareMenuId === item.id;
              setShareMenuId(isOpen ? null : item.id);
              setSharePickerId(null);
              setShareSearch("");
              setOpenComments(null);
            }, style: { display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 20, background: shareMenuId === item.id ? `${T.copper}18` : "transparent", border: "none", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 15, color: shareMenuId === item.id ? T.copper : T.tertiary, strokeWidth: 1.5 }) })
          ] }),
          extraLeft
        ] }),
        shareMenuId === item.id && !sharePickerId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "0 16px 10px", background: T.darkCard, borderRadius: 8, border: `1px solid ${T.charcoal}`, overflow: "hidden" }, onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
            setSharePickerId(item.id);
            setTimeout(() => shareSearchRef.current && shareSearchRef.current.focus(), 50);
          }, style: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "none", border: "none", borderBottom: `1px solid ${T.charcoal}`, cursor: "pointer", width: "100%" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: 14, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: "Send via Direct Message" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14, color: T.tertiary, style: { marginLeft: "auto" } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
            setShareMenuId(null);
            const url = window.location.origin + "/post/" + item.id;
            navigator.clipboard && navigator.clipboard.writeText(url);
            setCopiedToast(true);
            setTimeout(() => setCopiedToast(false), 1800);
          }, style: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "none", border: "none", cursor: "pointer", width: "100%" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 14, color: T.tertiary }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: "Copy link" })
          ] })
        ] }),
        sharePickerId === item.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "0 16px 10px", background: T.darkCard, borderRadius: 8, border: `1px solid ${T.charcoal}`, overflow: "hidden" }, onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "10px 12px", borderBottom: `1px solid ${T.charcoal}`, display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
              setSharePickerId(null);
            }, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 16, color: T.tertiary }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600 }, children: "Send to..." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "8px 12px", borderBottom: `1px solid ${T.charcoal}` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, background: T.charcoal, borderRadius: 20, padding: "6px 12px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 13, color: T.tertiary }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: shareSearchRef, value: shareSearch, onChange: (e) => setShareSearch(e.target.value), placeholder: "Search people...", style: { flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: sans, fontSize: 12, padding: 0 } })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "8px 12px", borderBottom: `1px solid ${T.charcoal}`, background: `${T.charcoal}60` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 18, height: 18, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 7, fontWeight: 700, color: T.white }, children: item.initial }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: [
                "@",
                item.user
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 11, color: T.warmStone, margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: item.title })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { maxHeight: 200, overflowY: "auto" }, children: [
            shareFilteredUsers.slice(0, 8).map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => sendShareToUser(u.handle, item), style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", borderBottom: `1px solid ${T.charcoal}20`, cursor: "pointer", width: "100%" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 30, height: 30, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }, children: u.initial }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, textAlign: "left" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, display: "block" }, children: u.name }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: [
                  "@",
                  u.handle
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 14, color: T.copper })
            ] }, u.handle)),
            shareFilteredUsers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "16px 12px", textAlign: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.tertiary }, children: "No users found" }) })
          ] })
        ] }),
        openComments === item.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "0 16px 12px", borderTop: `1px solid ${T.charcoal}`, paddingTop: 10 }, onClick: (e) => e.stopPropagation(), children: [
          allComments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10, maxHeight: 280, overflowY: "auto" }, children: allComments.map((c, ci) => {
            const cmtKey = item.id + "-" + ci;
            const cmtLiked = likedComments[cmtKey];
            const cmtLikeCount = commentLikeCounts[cmtKey] !== void 0 ? commentLikeCounts[cmtKey] : c.likes || 0;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 28, height: 28, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.copper }, children: c.initial }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { onClick: () => onViewUser && onViewUser(c.user.replace(/\s/g, "_")), style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, cursor: "pointer" }, children: [
                    "@",
                    c.user
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankBadge, { points: getPoints(c.user), size: 10 }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary }, children: formatPostTime(c.time) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.warmStone, margin: "2px 0 0", lineHeight: 1.4 }, children: c.text }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => toggleCommentLike(item.id, ci, c), style: { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 0 0 0", marginTop: 2 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 12, color: cmtLiked ? T.red : T.tertiary, strokeWidth: 1.5, fill: cmtLiked ? T.red : "none" }),
                  cmtLikeCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: cmtLiked ? T.red : T.tertiary }, children: cmtLikeCount })
                ] })
              ] })
            ] }, ci);
          }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 28, height: 28, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }, children: "K" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 20, padding: "8px 12px", border: `1px solid ${T.charcoal}` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MentionInput, { inputRef: openComments === item.id ? commentInputRef : null, value: commentText, onChange: setCommentText, onKeyDown: (e) => {
              if (e.key === "Enter") addComment(item.id);
            }, placeholder: "Add a comment...", style: { flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 12, padding: 0, width: "100%" } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => addComment(item.id), disabled: !commentText.trim(), style: { background: commentText.trim() ? T.red : T.charcoal, border: "none", cursor: commentText.trim() ? "pointer" : "default", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", opacity: commentText.trim() ? 1 : 0.4, padding: 0, flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { size: 14, color: T.white }) })
          ] })
        ] })
      ] });
    };
    const renderCard = (item) => {
      if (item.type === "POST") {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: cardStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }, children: item.initial }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 5 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: () => onViewUser && onViewUser(item.user.replace(/\s/g, "_")), style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, cursor: "pointer" }, children: item.user }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankBadge, { points: getPoints(item.user), size: 12 })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, display: "block" }, children: formatPostTime(item.time) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px 14px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 8px", lineHeight: 1.6, whiteSpace: "pre-wrap" }, children: item.title }),
            item.location && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 5, marginTop: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 11, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: item.location })
            ] })
          ] }),
          actionBar(item)
        ] }, item.id);
      }
      if (item.type === "RECOVERY") {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: cardStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.red}18`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 16, color: T.red }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, fontWeight: 700, color: T.red, letterSpacing: 0.5 }, children: "RECOVERY NEEDED" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: formatPostTime(item.time) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 24, height: 24, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white }, children: item.initial }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: () => onViewUser && onViewUser(item.user.replace(/\s/g, "_")), style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, cursor: "pointer" }, children: item.user }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankBadge, { points: getPoints(item.user), size: 11 })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 8px", lineHeight: 1.5 }, children: item.title }),
            item.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: "0 0 12px", lineHeight: 1.6 }, children: item.body }),
            item.vehicle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 11, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: item.vehicle })
            ] }),
            item.photoUrls && item.photoUrls.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }, children: item.photoUrls.map((url, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: url, alt: "", onClick: () => openCarousel(item.photoUrls, pi), style: { width: item.photoUrls.length === 1 ? "100%" : 140, height: item.photoUrls.length === 1 ? 180 : 100, borderRadius: 8, objectFit: "cover", cursor: "pointer", flexShrink: 0 } }, pi)) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 16, marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 12, color: T.tertiary }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: item.location })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 12, color: item.urgency === "HIGH" ? T.red : T.copper }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: item.urgency === "HIGH" ? T.red : T.copper, fontWeight: 600 }, children: [
                  item.urgency || "HIGH",
                  " URGENCY"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.charcoal, padding: "6px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 12, color: T.tertiary }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: item.coords })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => onOpenMap && onOpenMap(item.coords, item.location, item.title, { author: item.user, alertId: item.id, title: item.title }), style: { fontFamily: sans, fontSize: 11, color: T.red, background: "none", border: "none", cursor: "pointer", letterSpacing: 0.5 }, children: "Open in Maps" })
            ] })
          ] }),
          actionBar(item, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
            onOpenDM && onOpenDM(item.user, "I'm responding to your recovery request \u2014 on my way to help!", { title: `\u{1F6A8} Recovery: ${item.title}`, user: item.user, initial: item.initial, type: "recovery", location: item.location, urgency: item.urgency });
          }, style: { background: T.red, color: T.white, fontFamily: sans, fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 0.5 }, children: "Respond" }))
        ] }, item.id);
      }
      if (item.type === "ROUTES") {
        const isRouteExp = expandedRoutePost === item.id;
        const rdiffColor = (d) => d === "Expert" ? T.red : d === "Hard" ? T.copper : d === "Moderate" ? T.tertiary : T.green;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: cardStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => setExpandedRoutePost(isRouteExp ? null : item.id), style: { height: 160, background: T.charcoal, position: "relative", cursor: "pointer", overflow: "hidden" }, children: [
            item.pins && item.pins.length > 0 || item.points && item.points.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteMapPreview, { pins: item.pins, points: item.points, photos: item.photos }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: "100%", height: "100%", background: `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}40 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { size: 48, color: T.tertiary, strokeWidth: 0.5, style: { opacity: 0.3 } }) }),
            item.badge && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: 12, right: 12, background: `${T.charcoal}CC`, padding: "4px 10px", borderRadius: 4, zIndex: 5 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.warmBg, letterSpacing: 1, fontWeight: 600 }, children: item.badge }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: 12, left: 12, zIndex: 5 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14, color: T.white, style: { transform: isRouteExp ? "rotate(180deg)" : "none", transition: "transform 0.2s", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 6, background: `${T.darkBg}CC`, padding: "5px 10px 5px 5px", borderRadius: 20, zIndex: 5, backdropFilter: "blur(4px)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 22, height: 22, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white }, children: item.initial }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: (e) => {
                e.stopPropagation();
                onViewUser && onViewUser(item.user.replace(/\s/g, "_"));
              }, style: { fontFamily: sans, fontSize: 10, color: T.white, cursor: "pointer" }, children: item.user }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: formatPostTime(item.time) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { onClick: () => setExpandedRoutePost(isRouteExp ? null : item.id), style: { fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 8px", cursor: "pointer" }, children: item.title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 16, marginBottom: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }, children: item.distance }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }, children: item.duration }),
              item.difficulty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: rdiffColor(item.difficulty), background: `${rdiffColor(item.difficulty)}20`, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 }, children: item.difficulty.toUpperCase() })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, marginBottom: 4 }, children: [
              "+",
              item.verified,
              " Verified This Week"
            ] })
          ] }),
          isRouteExp && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderTop: `1px solid ${T.charcoal}`, padding: 16 }, children: [
            (item.pins && item.pins.length > 0 || item.points && item.points.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "ROUTE MAP" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: "100%", height: 180, borderRadius: 10, overflow: "hidden", position: "relative", background: T.charcoal }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteMapPreview, { pins: item.pins, points: item.points, photos: item.photos }) })
            ] }),
            item.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 12px", lineHeight: 1.5 }, children: item.body }),
            item.elevation && item.elevation !== "\u2014" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 16, marginBottom: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "ELEVATION" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600 }, children: item.elevation })
            ] }) }),
            item.location && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 13, color: T.copper }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.warmStone || T.tertiary }, children: item.location })
            ] }),
            item.terrains && item.terrains.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "TERRAIN" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: item.terrains.map((t, ti) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, background: `${T.copper}18`, padding: "4px 10px", borderRadius: 12, letterSpacing: 0.5 }, children: t }, ti)) })
            ] }),
            item.tags && item.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "TAGS" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: item.tags.map((t, ti) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, background: T.charcoal, padding: "4px 10px", borderRadius: 12, letterSpacing: 0.5 }, children: t }, ti)) })
            ] }),
            item.photos && item.photos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "MEDIA" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: item.photos.map((p, pi) => {
                const url = p.url || p;
                const isVideo = p.type === "video";
                return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderRadius: 10, overflow: "hidden", border: `1px solid ${T.charcoal}`, position: "relative" }, children: [
                  isVideo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: url, preload: "metadata", playsInline: true, controls: true, style: { width: "100%", maxHeight: 300, objectFit: "contain", display: "block", background: "#000", borderRadius: 0 } }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4, pointerEvents: "none" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 10, color: T.white }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, fontWeight: 600 }, children: "VIDEO" })
                    ] })
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: url, alt: "", onClick: () => openCarousel(item.photos.filter((ph) => (ph.type || "image") === "image").map((ph) => ph.url || ph), 0), style: { width: "100%", height: 200, objectFit: "cover", display: "block", cursor: "pointer" } }),
                  p.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "6px 10px", background: T.darkCard }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, fontStyle: "italic" }, children: p.caption }) })
                ] }, pi);
              }) })
            ] }),
            (() => {
              const rPins = item.pins || [];
              const startPin = rPins.length > 0 ? rPins[0] : null;
              const endPin = rPins.length > 1 ? rPins[rPins.length - 1] : null;
              const isSaved = savedRoutes && savedRoutes.some((sr) => sr.id === item.id || sr.name === item.title);
              const showMenu = routeShareMenu === item.id;
              return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6, marginTop: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                    e.stopPropagation();
                    if (startPin) {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${startPin.lat},${startPin.lng}&travelmode=driving`, "_blank");
                    }
                  }, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.green, border: "none", cursor: startPin ? "pointer" : "default", opacity: startPin ? 1 : 0.4 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 13, color: T.white }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }, children: "DIRECTIONS" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                    e.stopPropagation();
                    if (startPin && endPin && onStartNav) {
                      onStartNav({ name: item.title, pins: rPins, points: item.points, distance: item.distance, duration: item.duration, time: item.duration, elevation: item.elevation });
                    }
                  }, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.copper, border: "none", cursor: startPin && endPin ? "pointer" : "default", opacity: startPin && endPin ? 1 : 0.4 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 13, color: T.white }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }, children: "START ROUTE" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                    e.stopPropagation();
                    setRouteShareMenu(showMenu ? null : item.id);
                  }, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.charcoal, border: `1px solid ${T.tertiary}30`, cursor: "pointer" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 13, color: T.white }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }, children: "SHARE / SAVE" })
                  ] })
                ] }),
                showMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: "100%", right: 0, marginBottom: 6, background: T.darkCard, border: `1px solid ${T.charcoal}`, borderRadius: 10, padding: "6px 0", minWidth: 180, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                    e.stopPropagation();
                    onOpenDM && onOpenDM(null, null, { type: "route", title: item.title, distance: item.distance, duration: item.duration });
                    setRouteShareMenu(null);
                  }, style: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 14, color: T.copper }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: "Send in DM" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                    e.stopPropagation();
                    setRouteShareMenu(null);
                  }, style: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 14, color: T.copper }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: "Share to Feed" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "2px 10px" } }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                    e.stopPropagation();
                    if (isSaved) {
                      onUnsaveRoute && onUnsaveRoute(item.id);
                    } else {
                      onSaveRoute && onSaveRoute({ id: item.id, name: item.title, desc: item.body || "", difficulty: item.difficulty || "Moderate", distance: item.distance, time: item.duration, elevation: item.elevation || "\u2014", location: item.location || "", terrains: item.terrains || [], tags: item.tags || [], pins: item.pins || [], photos: item.photos || [], rating: null, reviews: 0, savedFrom: item.user, savedAt: Date.now() });
                    }
                    setRouteShareMenu(null);
                  }, style: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { size: 14, color: isSaved ? T.red : T.copper, fill: isSaved ? T.red : "none" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: isSaved ? T.red : T.white }, children: isSaved ? "Unsave Route" : "Save for Later" })
                  ] })
                ] })
              ] });
            })()
          ] }),
          actionBar(item)
        ] }, item.id);
      }
      if (item.type === "BUILDS") {
        const bd = item.buildData;
        const isExpanded = expandedBuildPost === item.id;
        const modRow = (label, mod) => {
          if (!mod || !mod.value) return null;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.charcoal}20` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, flexShrink: 0, minWidth: 70 }, children: label }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, textAlign: "right" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.white }, children: mod.value }),
              mod.photo && mod.photo.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: mod.photo[0].url, alt: "", onClick: () => {
                const imgs = bd ? collectBuildImages(bd) : [mod.photo[0].url];
                openCarousel(imgs, 0);
              }, style: { width: 40, height: 40, borderRadius: 6, objectFit: "cover", marginLeft: 8, verticalAlign: "middle", cursor: "pointer" } }),
              mod.link && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 3 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: ensureUrl(mod.link), target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), style: { fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 9 }),
                " View Product"
              ] }) })
            ] })
          ] });
        };
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: cardStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }, children: item.initial }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 5 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: () => onViewUser && onViewUser(item.user.replace(/\s/g, "_")), style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, cursor: "pointer" }, children: item.user }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankBadge, { points: getPoints(item.user), size: 12 })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.tertiary, display: "block" }, children: item.subtitle }),
              item.location && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 10, color: T.tertiary }),
                item.location
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }, children: formatPostTime(item.time) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            item.photoUrls && item.photoUrls[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: item.photoUrls[0], alt: "", onClick: () => {
                const imgs = bd ? collectBuildImages(bd) : item.photoUrls;
                openCarousel(imgs, 0);
              }, style: { width: "100%", height: 220, objectFit: "cover", display: "block", cursor: "pointer" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(transparent 40%, rgba(0,0,0,0.8))", pointerEvents: "none" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: 12, left: 14, right: 14, pointerEvents: "none" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 12, color: T.copper }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "NEW BUILD" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 20, color: T.white, margin: 0, fontWeight: 700, letterSpacing: 0.5 }, children: item.title }),
                item.vehicle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.warmBg, opacity: 0.8 }, children: item.vehicle })
              ] })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => setExpandedBuildPost(isExpanded ? null : item.id), style: { height: 180, background: `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}30 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 40, color: T.tertiary, strokeWidth: 0.5, style: { opacity: 0.3 } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: 12, left: 14 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 20, color: T.white, margin: 0, fontWeight: 700 }, children: item.title }),
                item.vehicle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.warmBg, opacity: 0.8 }, children: item.vehicle })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => setExpandedBuildPost(isExpanded ? null : item.id), style: { position: "absolute", top: 10, right: 10, background: `${T.darkBg}CC`, padding: "5px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 12, color: T.warmBg, style: { transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.warmBg, letterSpacing: 0.5 }, children: isExpanded ? "COLLAPSE" : "VIEW BUILD" })
            ] })
          ] }),
          !isExpanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "10px 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: T.charcoal, padding: "8px 12px", borderRadius: 6, display: "inline-block" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: item.stage }) }) }),
          isExpanded && bd && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 16px 4px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 12, color: T.copper }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "BUILD SPECS" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column" }, children: [
              modRow("Suspension", bd.suspension),
              modRow("Tires", bd.tires),
              modRow("Wheels", bd.wheels),
              modRow("Bumpers", bd.bumpers),
              modRow("Armor", bd.armor),
              modRow("Lighting", bd.lighting),
              modRow("Rack/Storage", bd.rack),
              modRow("Winch", bd.winch),
              modRow("Other Mods", bd.otherMods)
            ] }),
            bd.hasCamper && (bd.camperMake || bd.camperModel) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "12px 0" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { size: 12, color: T.copper }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "CAMPER" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: "Setup" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }, children: [
                  bd.camperMake,
                  " ",
                  bd.camperModel
                ] })
              ] }),
              bd.camperPhoto && bd.camperPhoto.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginTop: 6 }, children: bd.camperPhoto.map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", onClick: () => {
                const imgs = collectBuildImages(bd);
                openCarousel(imgs, 0);
              }, style: { width: 60, height: 60, borderRadius: 6, objectFit: "cover", cursor: "pointer" } }, pi)) }),
              bd.camperLink && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: ensureUrl(bd.camperLink), target: "_blank", rel: "noopener noreferrer", style: { fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 9 }),
                " View Product"
              ] }) })
            ] }),
            bd.mainPhotos && bd.mainPhotos.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "12px 0" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, display: "block", marginBottom: 8 }, children: "MORE PHOTOS" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }, children: bd.mainPhotos.slice(1).map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", onClick: () => openCarousel(collectBuildImages(bd), pi + 1), style: { width: 80, height: 80, borderRadius: 8, objectFit: "cover", flexShrink: 0, cursor: "pointer" } }, pi)) })
            ] })
          ] }),
          isExpanded && !bd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "10px 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: T.charcoal, padding: "8px 12px", borderRadius: 6, display: "inline-block" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: item.stage }) }) }),
          actionBar(item)
        ] }, item.id);
      }
      if (item.type === "CONVOYS") {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: cardStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 16, display: "flex", gap: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { width: 56, background: T.charcoal, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0", flexShrink: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: item.month }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 28, color: T.white, fontWeight: 700 }, children: item.day })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, background: `${T.copper}20`, padding: "3px 8px", borderRadius: 4, letterSpacing: 1, fontWeight: 600 }, children: "CONVOY GROUP" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: formatPostTime(item.time) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 6px" }, children: item.title }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: "0 0 8px", lineHeight: 1.5 }, children: item.body }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12, marginBottom: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 0.5 }, children: [
                  "DEPARTS ",
                  item.departs
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 0.5 }, children: [
                  item.slots,
                  " SLOTS LEFT"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 20, height: 20, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, fontWeight: 700, color: T.white }, children: item.initial }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: () => onViewUser && onViewUser(item.user.replace(/\s/g, "_")), style: { fontFamily: sans, fontSize: 11, color: T.white, cursor: "pointer" }, children: item.user })
              ] })
            ] })
          ] }),
          actionBar(item)
        ] }, item.id);
      }
      if (item.type === "PHOTOS") {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: cardStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }, children: item.initial }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 5 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: () => onViewUser && onViewUser(item.user.replace(/\s/g, "_")), style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, cursor: "pointer" }, children: item.user }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankBadge, { points: getPoints(item.user), size: 12 })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 12, color: T.tertiary, display: "block" }, children: [
                "Shared ",
                item.photoCount,
                " photos"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: formatPostTime(item.time) })
          ] }),
          item.photoUrls && item.photoUrls.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: item.photoUrls[0], alt: "", onClick: () => openCarousel(item.photoUrls, 0), style: { width: "100%", height: 220, objectFit: "cover", display: "block", cursor: "pointer" } }),
            item.photoCount > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: 10, right: 10, background: `${T.darkBg}CC`, padding: "4px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 11, color: T.warmBg }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.warmBg }, children: [
                "1 / ",
                item.photoCount
              ] })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { height: 220, background: `linear-gradient(135deg, ${T.charcoal} 0%, ${T.copper}15 100%)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 48, color: T.tertiary, strokeWidth: 0.5, style: { opacity: 0.25 } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: 10, right: 10, background: `${T.darkBg}CC`, padding: "4px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 11, color: T.warmBg }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.warmBg }, children: [
                "1 / ",
                item.photoCount
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 6px", lineHeight: 1.5 }, children: item.title }),
            item.location && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 11, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: item.location })
            ] })
          ] }),
          actionBar(item)
        ] }, item.id);
      }
      if (item.type === "FORUM") {
        const snippet = item.body && item.body.length > 120 ? item.body.slice(0, 120) + "..." : item.body;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => onOpenThread && onOpenThread(item.threadId, item.forumCat, item.forumSub), style: { ...cardStyle, cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${T.charcoal}` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 14, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 1, fontWeight: 600 }, children: "FORUM THREAD" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: 4 }, children: [
              item.forumCat,
              " > ",
              item.forumSub
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }, children: formatPostTime(item.time) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 28, height: 28, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }, children: item.initial }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: (e) => {
                e.stopPropagation();
                onViewUser && onViewUser(item.user.replace(/\s/g, "_"));
              }, style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, cursor: "pointer" }, children: item.user }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankBadge, { points: getPoints(item.user), size: 11 })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 6px", lineHeight: 1.3 }, children: item.title }),
            snippet && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 12px", lineHeight: 1.5 }, children: snippet }),
            item.image && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginBottom: 12, borderRadius: 8, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: item.image, alt: "", style: { width: "100%", maxHeight: 200, objectFit: "cover", display: "block" } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14, color: T.tertiary, strokeWidth: 1.5 }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
                  (() => {
                    const base = typeof item.views === "string" ? parseFloat(item.views.replace(/[^0-9.]/g, "")) * (item.views.includes("K") ? 1e3 : 1) : item.views || 0;
                    const extra = (forumViewCounts || {})[item.threadId] || 0;
                    const total = Math.round(base + extra);
                    return total >= 1e3 ? (total / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(total);
                  })(),
                  " views"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 14, color: T.tertiary, strokeWidth: 1.5 }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
                  (item.replies || 0) + ((forumUserReplies || {})[item.threadId] || []).length,
                  " replies"
                ] })
              ] })
            ] })
          ] }),
          actionBar(item, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: (e) => {
            e.stopPropagation();
            onOpenThread && onOpenThread(item.threadId, item.forumCat, item.forumSub);
          }, style: { fontFamily: sans, fontSize: 10, color: T.red, fontWeight: 600, cursor: "pointer", padding: "8px 12px" }, children: "VIEW THREAD >" }))
        ] }, item.id);
      }
      return null;
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
      carouselImages && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageCarousel, { images: carouselImages, startIndex: carouselIndex, onClose: () => setCarouselImages(null) }),
      copiedToast && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: T.charcoal, border: `1px solid ${T.copper}`, borderRadius: 24, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, zIndex: 999, boxShadow: `0 8px 30px rgba(0,0,0,0.5)`, animation: "fadeInUp 0.25s ease-out" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 16, color: T.green }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600 }, children: "Link copied to clipboard" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "th-hscroll", style: { display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto", background: T.charcoal }, children: filters.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setActiveFilter(f), style: pill(activeFilter === f), children: f }, f)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }, children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "40px 0", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { size: 36, color: T.tertiary, strokeWidth: 0.8, style: { opacity: 0.3, marginBottom: 10 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontFamily: sans, fontSize: 14, color: T.tertiary, margin: 0 }, children: [
          "No ",
          activeFilter.toLowerCase(),
          " posts yet"
        ] })
      ] }) : filtered.map(renderCard) })
    ] });
  }
  var forumData = {
    categories: [
      { name: "How-To Guides", color: T.copper, icon: "wrench", subs: [
        { name: "Suspension & Lift", threads: 86 },
        { name: "Electrical & Wiring", threads: 64 },
        { name: "Armor & Protection", threads: 52 },
        { name: "Camper Installs", threads: 41 },
        { name: "Recovery Techniques", threads: 38 },
        { name: "Maintenance & Repair", threads: 61 }
      ] },
      { name: "Troubleshooting", color: T.red, icon: "alert", subs: [
        { name: "Engine & Drivetrain", threads: 74 },
        { name: "Electrical Issues", threads: 48 },
        { name: "Suspension & Steering", threads: 39 },
        { name: "Body & Frame", threads: 28 },
        { name: "Accessories & Mods", threads: 29 }
      ] },
      { name: "Inspiration", color: T.green, icon: "mountain", subs: [
        { name: "Trip Reports", threads: 198 },
        { name: "Build Showcases", threads: 142 },
        { name: "Photography", threads: 127 },
        { name: "Bucket List Routes", threads: 100 }
      ] },
      { name: "Trip Coordination", color: T.copper, icon: "users", subs: [
        { name: "Convoy Planning", threads: 24 },
        { name: "Meetups & Events", threads: 31 },
        { name: "Trail Partners Wanted", threads: 34 }
      ] },
      { name: "Regional Groups", color: T.tertiary, icon: "map", subs: [
        { name: "Pacific Northwest", threads: 42 },
        { name: "Southwest & Desert", threads: 38 },
        { name: "Rockies & High Plains", threads: 29 },
        { name: "Southeast & Appalachia", threads: 21 },
        { name: "Midwest", threads: 14 },
        { name: "International", threads: 12 }
      ] },
      { name: "Marketplace", color: T.red, icon: "tag", subs: [
        { name: "Parts For Sale", threads: 186 },
        { name: "Vehicles For Sale", threads: 89 },
        { name: "Wanted / ISO", threads: 78 },
        { name: "Group Buys", threads: 42 },
        { name: "Free / Trade", threads: 28 }
      ] }
    ],
    threads: {
      "Suspension & Lift": [
        {
          id: 1,
          title: "Best budget lift kit for 3rd Gen Tacoma?",
          replies: 47,
          views: "2.1K",
          author: "TrailBoss_88",
          initial: "T",
          time: "2h ago",
          pinned: true,
          body: "Looking at Icon, Bilstein, or OME for my 2020 Tacoma. Budget is around $1,500. Primarily doing fire roads and moderate trails in the PNW. What would you all recommend?",
          posts: [
            { author: "SuspensionGuru", initial: "S", time: "1h ago", body: "Icon Stage 2 is hard to beat at that price. I ran it on my 3rd gen for 2 years before upgrading to King coilovers. Great ride quality on and off road.", likes: 24 },
            { author: "KyleLPO", initial: "K", time: "45m ago", body: "I went Icon Stage 3 on my Tundra and it's been bulletproof. For a Tacoma at $1,500, the Icon Stage 2 or Bilstein 5100s are your best bet. Bilstein if you want set-and-forget, Icon if you want adjustability.", likes: 31 },
            { author: "DirtRoadDave", initial: "D", time: "30m ago", body: "OME is solid but rides a bit stiff when unloaded. If you're not carrying a lot of weight, go Bilstein 5100 and save the extra for tires.", likes: 12 }
          ]
        },
        {
          id: 2,
          title: '2" vs 3" lift \u2014 real-world pros and cons',
          replies: 89,
          views: "5.8K",
          author: "LiftKing",
          initial: "L",
          time: "6h ago",
          pinned: false,
          body: 'I keep going back and forth. Running 33s now, want to fit 35s. Is 3" worth the extra cost and potential CV angle issues?',
          posts: [
            { author: "AxleWise", initial: "A", time: "5h ago", body: `3" is the sweet spot for 35s but you'll want to address the CV angles. Budget for diff drop or SPC UCAs at minimum.`, likes: 18 }
          ]
        },
        {
          id: 3,
          title: "Icon Stage 3 long-term review \u2014 40K miles",
          replies: 34,
          views: "3.2K",
          author: "KyleLPO",
          initial: "K",
          time: "1d ago",
          pinned: false,
          body: "Just hit 40K on my Icon Stage 3 setup. Here's everything I've learned about maintenance, revalving, and what to expect long-term.",
          posts: []
        },
        {
          id: 4,
          title: "Fox 2.5 Factory Race Series install tips",
          replies: 56,
          views: "4.1K",
          author: "FoxFanatic",
          initial: "F",
          time: "2d ago",
          pinned: false,
          body: "Just finished installing Fox 2.5 Factory Race on my 4Runner. Sharing some tips that would have saved me hours.",
          posts: []
        }
      ],
      "Electrical & Wiring": [
        {
          id: 5,
          title: "How to properly wire auxiliary batteries for dual setups",
          replies: 124,
          views: "8.4K",
          author: "VoltWrangler",
          initial: "V",
          time: "6h ago",
          pinned: true,
          body: "Complete guide to dual battery setups \u2014 isolators, wiring gauges, fusing, and what NOT to do. Learned some hard lessons.",
          posts: [
            { author: "WattMaster", initial: "W", time: "4h ago", body: "This is the guide I wish I had 2 years ago. One thing to add \u2014 always fuse both sides of your isolator, not just the main feed.", likes: 42 }
          ]
        },
        {
          id: 6,
          title: "Solar panel setup for roof-top tent camping",
          replies: 67,
          views: "4.9K",
          author: "SolarTrail",
          initial: "S",
          time: "1d ago",
          pinned: false,
          body: "Running a 200W panel with Victron MPPT into a 100Ah lithium. Here's my complete setup and wiring diagram.",
          posts: []
        }
      ],
      "Convoy Planning": [
        {
          id: 7,
          title: "Planning a Baja convoy \u2014 Feb 2027",
          replies: 31,
          views: "890",
          author: "BajaBound",
          initial: "B",
          time: "1d ago",
          pinned: true,
          body: "Looking for 6-8 rigs for a 2-week Baja trip. Starting in San Diego, heading down to Cabo via the pacific coast. Experience level: intermediate+",
          posts: [
            { author: "DesertRat_4x4", initial: "D", time: "18h ago", body: "I'm in! Running a Bronco Sasquatch with full armor. Done the Baja loop twice before. What's the planned route?", likes: 8 },
            { author: "BajaVet", initial: "B", time: "12h ago", body: "Count me in. I'd recommend hitting Mike's Sky Rancho on the way down. Best tacos you'll ever have.", likes: 15 }
          ]
        }
      ],
      "Parts For Sale": [
        {
          id: 8,
          title: "Selling: ARB bumper for 200 Series LC \u2014 $800",
          replies: 12,
          views: "340",
          author: "GearDump",
          initial: "G",
          time: "5h ago",
          pinned: false,
          body: "ARB Deluxe front bumper for 200 Series Land Cruiser. Excellent condition, includes fog light mounts. Pickup in Denver or ship at buyer's expense.",
          posts: []
        },
        {
          id: 9,
          title: "CBI rear bumper + swing-out for Tundra \u2014 $1,200",
          replies: 8,
          views: "210",
          author: "KyleLPO",
          initial: "K",
          time: "2d ago",
          pinned: false,
          body: "Upgraded to a custom setup. CBI T-bar rear with dual swing-outs. Fits 2014-2021 Tundra. Includes jerry can mount and tire carrier.",
          posts: []
        }
      ],
      "Trip Reports": [
        {
          id: 10,
          title: "Rubicon Trail in a stock 4Runner \u2014 full report",
          replies: 98,
          views: "7.2K",
          author: "StockHero",
          initial: "S",
          time: "3d ago",
          pinned: true,
          body: "They said it couldn't be done. It can, but I don't recommend it. Here's my full trip report with photos, damage assessment, and lessons learned.",
          posts: [
            { author: "RubiVet", initial: "R", time: "2d ago", body: "Impressive that you made it through! The Sluice alone would have me sweating in a stock rig. How'd you handle the approach angle on the big rocks?", likes: 22 }
          ]
        }
      ]
    }
  };
  forumData.categories.forEach((cat) => {
    cat.subs.forEach((sub) => {
      if (!forumData.threads[sub.name]) {
        forumData.threads[sub.name] = [
          { id: Math.random(), title: `Welcome to ${sub.name}`, replies: 3, views: "120", author: "Admin", initial: "A", time: "1w ago", pinned: true, body: `This is the ${sub.name} subcategory under ${cat.name}. Start a thread to share your knowledge!`, posts: [] }
        ];
      }
    });
  });
  function ForumScreen({ pendingThread, onPendingHandled, onAddNotification, onOpenDM, onAddFeedPost, userThreads, setUserThreads, userReplies, setUserReplies, likedForumItems, setLikedForumItems, forumLikeCounts, setForumLikeCounts, forumViewCounts, setForumViewCounts, onAwardPoints }) {
    const [view, setView] = (0, import_react4.useState)("categories");
    const [selectedCat, setSelectedCat] = (0, import_react4.useState)(null);
    const [selectedSub, setSelectedSub] = (0, import_react4.useState)(null);
    const [selectedThread, setSelectedThread] = (0, import_react4.useState)(null);
    const [forumReplyText, setForumReplyText] = (0, import_react4.useState)("");
    const [replyPhotos, setReplyPhotos] = (0, import_react4.useState)([]);
    const replyFileRef = import_react4.default.useRef(null);
    const handleReplyPhoto = (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      Array.from(files).forEach((file) => {
        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          const blobUrl = URL.createObjectURL(file);
          setReplyPhotos((prev) => [...prev, { id: Date.now() + Math.random(), url: blobUrl, name: file.name, type: "video", caption: "" }]);
        } else {
          const reader = new FileReader();
          reader.onload = (ev) => setReplyPhotos((prev) => [...prev, { id: Date.now() + Math.random(), url: ev.target.result, name: file.name, type: "image", caption: "" }]);
          reader.readAsDataURL(file);
        }
      });
      e.target.value = "";
    };
    const [replyToReply, setReplyToReply] = (0, import_react4.useState)(null);
    const [forumShareMenu, setForumShareMenu] = (0, import_react4.useState)(null);
    const getReplyCount = (thread) => {
      const seedCount = (thread.posts || []).length + (thread.replies || 0);
      const userCount = (userReplies[thread.id] || []).length;
      return seedCount + userCount;
    };
    const getViewCount = (thread) => {
      const base = typeof thread.views === "string" ? parseFloat(thread.views.replace(/[^0-9.]/g, "")) * (thread.views.includes("K") ? 1e3 : 1) : thread.views || 0;
      const extra = forumViewCounts[thread.id] || 0;
      const total = Math.round(base + extra);
      return total >= 1e3 ? (total / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(total);
    };
    const trackView = (threadId) => {
      setForumViewCounts((prev) => ({ ...prev, [threadId]: (prev[threadId] || 0) + 1 }));
    };
    (0, import_react4.useEffect)(() => {
      if (!pendingThread) return;
      const { threadId, catName, subName } = pendingThread;
      for (const cat of forumData.categories) {
        if (cat.name !== catName) continue;
        for (const sub of cat.subs) {
          if (sub.name !== subName) continue;
          const allThreads = [...forumData.threads[sub.name] || [], ...userThreads[sub.name] || []];
          const thread = allThreads.find((t) => t.id === threadId);
          if (thread) {
            setSelectedCat(cat);
            setSelectedSub(sub);
            setSelectedThread(thread);
            setView("thread");
            trackView(thread.id);
            onPendingHandled && onPendingHandled();
            return;
          }
        }
      }
      onPendingHandled && onPendingHandled();
    }, [pendingThread]);
    const [editingThreadId, setEditingThreadId] = (0, import_react4.useState)(null);
    const [editTitle, setEditTitle] = (0, import_react4.useState)("");
    const [editBody, setEditBody] = (0, import_react4.useState)("");
    const editBodyRef = (0, import_react4.useRef)(null);
    const [editPhotos, setEditPhotos] = (0, import_react4.useState)([]);
    const [editActiveFormats, setEditActiveFormats] = (0, import_react4.useState)({});
    const editSavedRange = (0, import_react4.useRef)(null);
    const editInitialized = (0, import_react4.useRef)(null);
    const [editLinkInput, setEditLinkInput] = (0, import_react4.useState)(false);
    const [editLinkUrl, setEditLinkUrl] = (0, import_react4.useState)("");
    const updateEditFormats = () => {
      const fb = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      setEditActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        h1: fb === "h1",
        h2: fb === "h2",
        h3: fb === "h3",
        p: fb === "p" || fb === "" || fb === "div"
      });
    };
    const [ntTitle, setNtTitle] = (0, import_react4.useState)("");
    const [ntBody, setNtBody] = (0, import_react4.useState)("");
    const ntBodyRef = (0, import_react4.useRef)(null);
    const [ntLinkInput, setNtLinkInput] = (0, import_react4.useState)(false);
    const [ntLinkUrl, setNtLinkUrl] = (0, import_react4.useState)("");
    const ntSavedRange = (0, import_react4.useRef)(null);
    const [ntActiveFormats, setNtActiveFormats] = (0, import_react4.useState)({});
    const updateActiveFormats = () => {
      const fb = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      setNtActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        h1: fb === "h1",
        h2: fb === "h2",
        h3: fb === "h3",
        p: fb === "p" || fb === "" || fb === "div"
      });
    };
    const [ntShareToFeed, setNtShareToFeed] = (0, import_react4.useState)(true);
    const [ntPhotos, setNtPhotos] = (0, import_react4.useState)([]);
    const [ntPickCat, setNtPickCat] = (0, import_react4.useState)(null);
    const [ntPickSub, setNtPickSub] = (0, import_react4.useState)(null);
    const [ntFromHome, setNtFromHome] = (0, import_react4.useState)(false);
    const [searchQuery, setSearchQuery] = (0, import_react4.useState)("");
    const [searchActive, setSearchActive] = (0, import_react4.useState)(false);
    const searchInputRef = (0, import_react4.useRef)(null);
    const allThreadsFlat = (() => {
      const results = [];
      forumData.categories.forEach((cat) => {
        cat.subs.forEach((sub) => {
          (forumData.threads[sub.name] || []).forEach((t) => {
            results.push({ ...t, catName: cat.name, subName: sub.name, cat, sub });
          });
        });
      });
      return results;
    })();
    const searchResults = searchQuery.trim().length > 0 ? (() => {
      const q = searchQuery.trim().toLowerCase();
      return allThreadsFlat.filter((t) => {
        if (t.title.toLowerCase().includes(q)) return true;
        if (t.body && t.body.toLowerCase().includes(q)) return true;
        if (t.author.toLowerCase().includes(q)) return true;
        if (t.posts && t.posts.some((p) => p.author.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))) return true;
        return false;
      });
    })() : [];
    const openCategory = (cat) => {
      setSelectedCat(cat);
      setView("subcategories");
    };
    const openSubcategory = (sub) => {
      setSelectedSub(sub);
      setView("threads");
    };
    const openThread = (thread) => {
      setSelectedThread(thread);
      setView("thread");
      trackView(thread.id);
    };
    const openNewThreadFromHome = () => {
      setNtFromHome(true);
      setNtPickCat(null);
      setNtPickSub(null);
      setNtTitle("");
      setNtBody("");
      setNtPhotos([]);
      setNtShareToFeed(true);
      setView("newThread");
    };
    const openNewThreadFromSub = () => {
      setNtFromHome(false);
      setNtPickCat(selectedCat);
      setNtPickSub(selectedSub);
      setNtTitle("");
      setNtBody("");
      setNtPhotos([]);
      setNtShareToFeed(true);
      setView("newThread");
    };
    const goBack = () => {
      if (view === "newThread") setView(ntFromHome ? "categories" : "threads");
      else if (view === "thread") setView("threads");
      else if (view === "threads") setView("subcategories");
      else if (view === "subcategories") setView("categories");
    };
    if (view === "newThread" && (selectedSub || ntFromHome)) {
      const activeCat = ntFromHome ? ntPickCat : selectedCat;
      const activeSub = ntFromHome ? ntPickSub : selectedSub;
      const submitThread = () => {
        if (!ntTitle.trim()) return;
        if (ntFromHome && (!ntPickCat || !ntPickSub)) return;
        const subName = (activeSub || {}).name;
        const newThread = {
          id: Date.now(),
          title: ntTitle.trim(),
          body: (() => {
            const html = ntBodyRef.current ? ntBodyRef.current.innerHTML : ntBody;
            console.log("[TRAILHEAD DEBUG] Submitting body HTML:", html);
            return html && html.replace(/<[^>]+>/g, "").trim() ? html : null;
          })(),
          replies: 0,
          views: "0",
          author: "KyleLPO",
          initial: "K",
          time: Date.now(),
          pinned: false,
          posts: [],
          ...ntPhotos.length > 0 ? { photos: ntPhotos.map((p) => ({ url: p.url, type: p.type || "image", caption: p.caption || "" })) } : {}
        };
        setUserThreads((prev) => ({
          ...prev,
          [subName]: [newThread, ...prev[subName] || []]
        }));
        if (ntShareToFeed && onAddFeedPost) {
          const catName = (activeCat || ntPickCat || {}).name || "";
          onAddFeedPost({
            id: Date.now() + 1,
            type: "FORUM",
            user: "KyleLPO",
            initial: "K",
            title: newThread.title,
            body: null,
            ...newThread.photos && newThread.photos.length > 0 ? { image: newThread.photos[0].url || newThread.photos[0] } : {},
            time: Date.now(),
            likes: 0,
            comments: 0,
            replies: 0,
            views: "0",
            threadId: newThread.id,
            forumCat: catName,
            forumSub: subName
          });
        }
        const plainBody = ntBody.replace(/<[^>]+>/g, " ");
        const mentions = extractMentions(ntTitle + " " + plainBody);
        mentions.forEach((handle) => {
          if (handle !== "KyleLPO") {
            onAddNotification && onAddNotification({ type: "mention", user: "KyleLPO", text: "mentioned you in a forum thread", target: ntTitle.trim(), icon: AtSign, iconColor: T.copper });
          }
        });
        onAwardPoints && onAwardPoints(25, "Forum Thread");
        if (ntPhotos.length > 0) onAwardPoints && onAwardPoints(5 * ntPhotos.length, "Photos Uploaded");
        setNtTitle("");
        setNtBody("");
        if (ntBodyRef.current) ntBodyRef.current.innerHTML = "";
        setNtPhotos([]);
        setNtShareToFeed(true);
        if (ntFromHome) {
          setSelectedCat(activeCat);
          setSelectedSub(activeSub);
          setView("threads");
        } else {
          setView("threads");
        }
      };
      const canPost = ntTitle.trim() && (!ntFromHome || ntPickCat && ntPickSub);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: goBack, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20, color: T.white, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 700, display: "block" }, children: "New Thread" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: activeSub ? activeSub.name : "Select a category" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px" }, children: [
          ntFromHome && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "CATEGORY *" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { value: ntPickCat ? ntPickCat.name : "", onChange: (e) => {
                const cat = forumData.categories.find((c) => c.name === e.target.value);
                setNtPickCat(cat || null);
                setNtPickSub(null);
              }, style: { width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: sans, fontSize: 13, outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238B7D6B' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", disabled: true, style: { color: T.tertiary }, children: "Select category..." }),
                forumData.categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: cat.name, style: { background: T.darkCard, color: T.white }, children: cat.name }, cat.name))
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "SUBCATEGORY *" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { value: ntPickSub ? ntPickSub.name : "", onChange: (e) => {
                const sub = ntPickCat ? ntPickCat.subs.find((s) => s.name === e.target.value) : null;
                setNtPickSub(sub || null);
              }, disabled: !ntPickCat, style: { width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: ntPickCat ? T.white : T.tertiary, fontFamily: sans, fontSize: 13, outline: "none", boxSizing: "border-box", opacity: ntPickCat ? 1 : 0.5, appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238B7D6B' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", disabled: true, style: { color: T.tertiary }, children: "Select subcategory..." }),
                ntPickCat && ntPickCat.subs.map((sub) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: sub.name, style: { background: T.darkCard, color: T.white }, children: sub.name }, sub.name))
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "TITLE *" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: ntTitle, onChange: (e) => setNtTitle(e.target.value), placeholder: "Thread title...", style: { width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box" } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "BODY" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 8px", background: T.charcoal, borderRadius: "8px 8px 0 0", border: `1px solid ${T.charcoal}`, borderBottom: "none" }, children: [
              [
                { cmd: "bold", label: "B", style: { fontWeight: 700 } },
                { cmd: "italic", label: "I", style: { fontStyle: "italic" } },
                { cmd: "underline", label: "U", style: { textDecoration: "underline" } },
                { cmd: "strikeThrough", label: "S", style: { textDecoration: "line-through" } }
              ].map((btn) => {
                const isActive = ntActiveFormats[btn.cmd];
                return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                  e.preventDefault();
                  document.execCommand(btn.cmd, false, null);
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                  setTimeout(updateActiveFormats, 0);
                }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${T.copper}30` : "none", border: isActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", ...btn.style, color: isActive ? T.copper : T.white, fontFamily: serif, fontSize: 13, transition: "all 0.15s" }, children: btn.label }, btn.cmd);
              }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" } }),
              [
                { cmd: "formatBlock", arg: "<h1>", label: "H1", key: "h1" },
                { cmd: "formatBlock", arg: "<h2>", label: "H2", key: "h2" },
                { cmd: "formatBlock", arg: "<h3>", label: "H3", key: "h3" },
                { cmd: "formatBlock", arg: "<p>", label: "P", key: "p" }
              ].map((btn) => {
                const isActive = ntActiveFormats[btn.key];
                return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                  e.preventDefault();
                  document.execCommand(btn.cmd, false, btn.arg);
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                  setTimeout(updateActiveFormats, 0);
                }, style: { minWidth: 28, height: 28, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${T.copper}30` : "none", border: isActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: isActive ? T.copper : T.white, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, transition: "all 0.15s" }, children: btn.label }, btn.label);
              }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" } }),
              (() => {
                const ulActive = ntActiveFormats.insertUnorderedList;
                return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                  e.preventDefault();
                  document.execCommand("insertUnorderedList", false, null);
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                  setTimeout(updateActiveFormats, 0);
                }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: ulActive ? `${T.copper}30` : "none", border: ulActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: ulActive ? T.copper : T.white, fontFamily: sans, fontSize: 11, transition: "all 0.15s" }, title: "Bullet list", children: "\u2022\u2261" });
              })(),
              (() => {
                const olActive = ntActiveFormats.insertOrderedList;
                return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                  e.preventDefault();
                  document.execCommand("insertOrderedList", false, null);
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                  setTimeout(updateActiveFormats, 0);
                }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: olActive ? `${T.copper}30` : "none", border: olActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: olActive ? T.copper : T.white, fontFamily: sans, fontSize: 11, transition: "all 0.15s" }, title: "Numbered list", children: "1." });
              })(),
              (() => {
                const sel = window.getSelection && window.getSelection();
                let isHighlighted = false;
                if (sel && sel.rangeCount > 0 && sel.anchorNode) {
                  let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
                  while (node && node !== ntBodyRef.current) {
                    const bg = node.style && node.style.backgroundColor;
                    if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "") {
                      isHighlighted = true;
                      break;
                    }
                    node = node.parentElement;
                  }
                }
                return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                  e.preventDefault();
                  if (isHighlighted) {
                    document.execCommand("hiliteColor", false, "transparent");
                  } else {
                    document.execCommand("hiliteColor", false, "#C49A6C40");
                  }
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: isHighlighted ? `${T.copper}60` : `${T.copper}20`, border: isHighlighted ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 10, fontWeight: 700, transition: "all 0.15s" }, title: isHighlighted ? "Remove highlight" : "Highlight", children: "Hi" });
              })(),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                e.preventDefault();
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
                ntSavedRange.current = selection.getRangeAt(0).cloneRange();
                setNtLinkInput(true);
                setNtLinkUrl("");
              }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: ntLinkInput ? `${T.copper}30` : "none", border: ntLinkInput ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 11, textDecoration: "underline", transition: "all 0.15s" }, title: "Insert link", children: "\u{1F517}" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                e.preventDefault();
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  ntSavedRange.current = selection.getRangeAt(0).cloneRange();
                }
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = "image/*";
                fileInput.multiple = true;
                fileInput.onchange = (ev) => {
                  const files = Array.from(ev.target.files || []);
                  files.forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                      if (ntBodyRef.current) {
                        ntBodyRef.current.focus();
                        const sel = window.getSelection();
                        if (ntSavedRange.current) {
                          sel.removeAllRanges();
                          sel.addRange(ntSavedRange.current);
                        }
                        document.execCommand("insertHTML", false, `<div style="margin:8px 0"><img src="${re.target.result}" style="max-width:100%;border-radius:8px;display:block" /></div>`);
                        setNtBody(ntBodyRef.current.innerHTML);
                        const newSel = window.getSelection();
                        if (newSel.rangeCount > 0) {
                          ntSavedRange.current = newSel.getRangeAt(0).cloneRange();
                        }
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                };
                fileInput.click();
              }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 13, transition: "all 0.15s" }, title: "Insert image", children: "\u{1F4F7}" })
            ] }),
            ntLinkInput && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6, padding: "8px 10px", background: T.darkBg, border: `1px solid ${T.copper}`, borderBottom: "none" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { autoFocus: true, value: ntLinkUrl, onChange: (e) => setNtLinkUrl(e.target.value), onKeyDown: (e) => {
                if (e.key === "Enter" && ntLinkUrl.trim()) {
                  e.preventDefault();
                  const sel = window.getSelection();
                  if (ntSavedRange.current) {
                    sel.removeAllRanges();
                    sel.addRange(ntSavedRange.current);
                  }
                  document.execCommand("createLink", false, ntLinkUrl.trim().startsWith("http") ? ntLinkUrl.trim() : "https://" + ntLinkUrl.trim());
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                  setNtLinkInput(false);
                  setNtLinkUrl("");
                  ntSavedRange.current = null;
                } else if (e.key === "Escape") {
                  setNtLinkInput(false);
                  setNtLinkUrl("");
                  ntSavedRange.current = null;
                }
              }, placeholder: "Paste URL and press Enter...", style: { flex: 1, padding: "6px 10px", borderRadius: 6, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: sans, fontSize: 12, outline: "none" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
                if (ntLinkUrl.trim()) {
                  const sel = window.getSelection();
                  if (ntSavedRange.current) {
                    sel.removeAllRanges();
                    sel.addRange(ntSavedRange.current);
                  }
                  document.execCommand("createLink", false, ntLinkUrl.trim().startsWith("http") ? ntLinkUrl.trim() : "https://" + ntLinkUrl.trim());
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                }
                setNtLinkInput(false);
                setNtLinkUrl("");
                ntSavedRange.current = null;
              }, style: { padding: "6px 12px", borderRadius: 6, background: T.copper, border: "none", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600 }, children: "Add" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
                setNtLinkInput(false);
                setNtLinkUrl("");
                ntSavedRange.current = null;
              }, style: { padding: "6px 8px", borderRadius: 6, background: "none", border: `1px solid ${T.tertiary}40`, cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12, color: T.tertiary }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                ref: ntBodyRef,
                contentEditable: true,
                onInput: () => {
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                  updateActiveFormats();
                },
                onKeyUp: updateActiveFormats,
                onMouseUp: updateActiveFormats,
                onSelect: updateActiveFormats,
                onFocus: updateActiveFormats,
                onPaste: (e) => {
                  e.preventDefault();
                  const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
                  document.execCommand("insertHTML", false, text);
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                },
                "data-placeholder": "Share your knowledge, ask a question, or start a discussion...",
                style: { width: "100%", minHeight: 140, padding: "12px 14px", borderRadius: "0 0 8px 8px", background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box", lineHeight: 1.6, overflowY: "auto", maxHeight: 300, position: "relative" }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
              [contenteditable][data-placeholder]:empty::before {
                content: attr(data-placeholder);
                color: ${T.tertiary};
                opacity: 0.5;
                pointer-events: none;
              }
              [contenteditable] h1 { font-size: 26px !important; font-weight: 700; color: ${T.white}; margin: 10px 0 6px; font-family: ${sans}; line-height: 1.2; }
              [contenteditable] h2 { font-size: 21px !important; font-weight: 700; color: ${T.white}; margin: 8px 0 4px; font-family: ${sans}; line-height: 1.3; }
              [contenteditable] h3 { font-size: 17px !important; font-weight: 600; color: ${T.white}; margin: 6px 0 3px; font-family: ${sans}; line-height: 1.3; }
              [contenteditable] p { margin: 4px 0; font-size: 14px; }
              [contenteditable] ul { list-style-type: disc !important; padding-left: 24px !important; margin: 6px 0; }
              [contenteditable] ol { list-style-type: decimal !important; padding-left: 24px !important; margin: 6px 0; }
              [contenteditable] li { display: list-item !important; margin: 3px 0; list-style-position: outside !important; }
              [contenteditable] ul li { list-style-type: disc !important; }
              [contenteditable] ol li { list-style-type: decimal !important; }
              [contenteditable] a { color: ${T.copper}; text-decoration: underline; }
              [contenteditable] img { max-width: 100%; border-radius: 8px; display: block; margin: 8px 0; }
            ` })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "HERO IMAGE" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoUploader, { photos: ntPhotos, onChange: setNtPhotos })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${T.charcoal}`, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: "Share to Feed" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary }, children: "Post a snippet with link to the community feed" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setNtShareToFeed(!ntShareToFeed), style: { width: 48, height: 28, borderRadius: 14, background: ntShareToFeed ? T.green : T.charcoal, border: `1px solid ${ntShareToFeed ? T.green : T.tertiary}40`, cursor: "pointer", position: "relative", transition: "background 0.2s" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 22, height: 22, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: ntShareToFeed ? 23 : 2, transition: "left 0.2s" } }) })
          ] }),
          ntShareToFeed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 8, padding: "12px 14px", marginBottom: 16, border: `1px solid ${T.charcoal}` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 12, color: T.copper }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 0.5, fontWeight: 600 }, children: "FEED PREVIEW" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.white, fontWeight: 600, display: "block", marginBottom: 4 }, children: ntTitle || "Thread title..." }),
            ntPhotos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: ntPhotos[0].url, alt: "", style: { width: "100%", height: 100, objectFit: "cover", borderRadius: 6, marginBottom: 6 } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 4 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.red }, children: "VIEW THREAD >" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: submitThread, disabled: !canPost, style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 8, background: canPost ? T.red : T.charcoal, border: "none", cursor: canPost ? "pointer" : "default", opacity: canPost ? 1 : 0.5 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16, color: T.white }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "POST THREAD" })
          ] })
        ] })
      ] });
    }
    if (view === "thread" && selectedThread) {
      const threadLikeKey = "thread_" + selectedThread.id;
      const allPosts = [...selectedThread.posts || [], ...userReplies[selectedThread.id] || []];
      const toggleForumLike = (key, baseLikes) => {
        const wasLiked = likedForumItems[key];
        setLikedForumItems((prev) => ({ ...prev, [key]: !wasLiked }));
        setForumLikeCounts((prev) => ({ ...prev, [key]: (prev[key] !== void 0 ? prev[key] : baseLikes) + (wasLiked ? -1 : 1) }));
      };
      const getForumLikes = (key, baseLikes) => forumLikeCounts[key] !== void 0 ? forumLikeCounts[key] : baseLikes;
      const shareToFeed = (title, body, author) => {
        const feedPost = {
          id: "forum_share_" + Date.now(),
          type: "FORUM",
          user: "KyleLPO",
          initial: "K",
          time: Date.now(),
          title,
          body: null,
          forumCat: selectedCat?.name || "",
          forumSub: selectedSub?.name || "",
          replies: 0,
          views: "0",
          threadId: selectedThread.id,
          ...selectedThread.photos && selectedThread.photos.length > 0 ? { image: selectedThread.photos[0] } : {},
          likes: 0,
          comments: 0
        };
        onAddFeedPost && onAddFeedPost(feedPost);
      };
      const sendViaDM = (title, author) => {
        const sharedPost = { id: selectedThread.id, title, user: author, initial: author[0], type: "FORUM", threadId: selectedThread.id, forumCat: selectedCat?.name, forumSub: selectedSub?.name };
        onOpenDM && onOpenDM(null, "", sharedPost);
      };
      const submitReply = () => {
        if (!forumReplyText.trim() && replyPhotos.length === 0) return;
        const newReply = {
          author: "KyleLPO",
          initial: "K",
          body: (replyToReply ? `@${replyToReply.author} ` : "") + forumReplyText.trim(),
          time: Date.now(),
          likes: 0,
          ...replyPhotos.length > 0 ? { photos: replyPhotos.map((p) => ({ url: p.url, type: p.type || "image", caption: p.caption || "" })) } : {},
          ...replyToReply ? { replyTo: replyToReply.author, parentIdx: replyToReply.idx } : {}
        };
        setUserReplies((prev) => ({
          ...prev,
          [selectedThread.id]: [...prev[selectedThread.id] || [], newReply]
        }));
        const mentions = extractMentions(forumReplyText);
        if (replyToReply && !mentions.includes(replyToReply.author)) mentions.push(replyToReply.author);
        mentions.forEach((handle) => {
          if (handle !== "KyleLPO") {
            onAddNotification && onAddNotification({ type: "mention", user: "KyleLPO", text: "mentioned you in a forum reply", target: selectedThread.title, icon: AtSign, iconColor: T.copper });
          }
        });
        onAwardPoints && onAwardPoints(10, "Forum Reply");
        if (replyPhotos.length > 0) onAwardPoints && onAwardPoints(5 * replyPhotos.length, "Photos Uploaded");
        setForumReplyText("");
        setReplyPhotos([]);
        setReplyToReply(null);
      };
      const replyActionBar = (post, idx, rootParentIdx) => {
        const key = "reply_" + selectedThread.id + "_" + idx;
        const liked = likedForumItems[key];
        const likes = getForumLikes(key, post.likes || 0);
        const showShare = forumShareMenu === key;
        const replyTargetIdx = typeof rootParentIdx === "number" ? rootParentIdx : idx;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, marginTop: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => toggleForumLike(key, post.likes || 0), style: { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px 4px 0" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 12, color: liked ? T.red : T.tertiary, strokeWidth: 1.5, fill: liked ? T.red : "none" }),
            likes > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: liked ? T.red : T.tertiary }, children: likes })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
            setReplyToReply({ author: post.author, idx: replyTargetIdx });
          }, style: { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 12, color: T.tertiary, strokeWidth: 1.5 }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: "Reply" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setForumShareMenu(showShare ? null : key), style: { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 12, color: T.tertiary, strokeWidth: 1.5 }) }),
            showShare && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: "100%", right: 0, background: T.darkBg, border: `1px solid ${T.charcoal}`, borderRadius: 8, padding: 4, marginBottom: 4, zIndex: 200, minWidth: 140, boxShadow: "0 -4px 16px rgba(0,0,0,0.5)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
                shareToFeed(selectedThread.title, post.body, post.author);
                setForumShareMenu(null);
              }, style: { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", border: "none", cursor: "pointer" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 12, color: T.copper }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white }, children: "Share to Feed" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
                sendViaDM(post.body || selectedThread.title, post.author);
                setForumShareMenu(null);
              }, style: { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", border: "none", cursor: "pointer" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: 12, color: T.copper }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white }, children: "Send via DM" })
              ] })
            ] })
          ] })
        ] });
      };
      const threadLiked = likedForumItems[threadLikeKey];
      const threadLikes = getForumLikes(threadLikeKey, selectedThread.likes || 0);
      const threadShareOpen = forumShareMenu === threadLikeKey;
      const isOwnThread = selectedThread.author === "KyleLPO";
      const thRbCSS = `<style>
.th-rb h1{display:block;font-size:26px;font-weight:700;color:#fff;margin:14px 0 8px;font-family:Trebuchet MS,Gill Sans,sans-serif;line-height:1.2}
.th-rb h2{display:block;font-size:21px;font-weight:700;color:#fff;margin:12px 0 6px;font-family:Trebuchet MS,Gill Sans,sans-serif;line-height:1.3}
.th-rb h3{display:block;font-size:17px;font-weight:600;color:#fff;margin:10px 0 4px;font-family:Trebuchet MS,Gill Sans,sans-serif;line-height:1.3}
.th-rb img{max-width:100%;border-radius:8px;display:block;margin:8px 0}
.th-rb p{display:block;margin:6px 0;font-size:14px}
.th-rb div{display:block;margin:4px 0}
.th-rb ul{display:block;list-style-type:disc;padding-left:24px;margin:8px 0}
.th-rb ol{display:block;list-style-type:decimal;padding-left:24px;margin:8px 0}
.th-rb li{display:list-item;margin:4px 0;list-style-position:outside}
.th-rb ul li{list-style-type:disc}
.th-rb ol li{list-style-type:decimal}
.th-rb a{color:#C49A6C;text-decoration:underline;cursor:pointer}
.th-rb b,.th-rb strong{font-weight:700;color:#fff}
.th-rb u{text-decoration:underline}
.th-rb strike,.th-rb s{text-decoration:line-through}
.th-rb span[style*="background"]{border-radius:2px;padding:0 2px}
</style>`;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
        selectedThread.photos && selectedThread.photos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", width: "100%", height: 220 }, children: [
          (() => {
            const firstP = selectedThread.photos[0];
            const firstUrl = firstP.url || firstP;
            const isVid = firstP.type === "video";
            return isVid ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: firstUrl + "#t=0.001", preload: "metadata", playsInline: true, muted: true, style: { width: "100%", height: "100%", objectFit: "cover" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 12, right: 50, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4, zIndex: 2 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 10, color: T.white }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, fontWeight: 600 }, children: "VIDEO" })
              ] })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: firstUrl, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } });
          })(),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: goBack, style: { position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex", backdropFilter: "blur(4px)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20, color: T.white, strokeWidth: 1.5 }) }),
          isOwnThread && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
            setEditingThreadId(selectedThread.id);
            setEditTitle(selectedThread.title);
            setEditBody(selectedThread.body || "");
            setEditPhotos(selectedThread.photos ? selectedThread.photos.map((u, i) => ({ url: u.url || u, id: i, type: u.type || "image", caption: u.caption || "" })) : []);
          }, style: { position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex", backdropFilter: "blur(4px)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 16, color: T.white, strokeWidth: 1.5 }) }),
          selectedThread.pinned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { position: "absolute", top: 14, left: 50, fontFamily: sans, fontSize: 9, color: T.copper, background: `rgba(0,0,0,0.6)`, padding: "3px 8px", borderRadius: 3, letterSpacing: 1, backdropFilter: "blur(4px)" }, children: "PINNED" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 16px 14px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 20, color: T.white, fontWeight: 700, margin: 0, lineHeight: 1.25, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }, children: selectedThread.title }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: goBack, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20, color: T.white, strokeWidth: 1.5 }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.tertiary }, children: selectedSub?.name })
            ] }),
            isOwnThread && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
              setEditingThreadId(selectedThread.id);
              setEditTitle(selectedThread.title);
              setEditBody(selectedThread.body || "");
              setEditPhotos(selectedThread.photos ? selectedThread.photos.map((u, i) => ({ url: u.url || u, id: i, type: u.type || "image", caption: u.caption || "" })) : []);
            }, style: { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 16, color: T.tertiary, strokeWidth: 1.5 }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "0 16px 4px", padding: "0 0 8px" }, children: [
            selectedThread.pinned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}20`, padding: "2px 6px", borderRadius: 3, letterSpacing: 1, marginBottom: 8, display: "inline-block" }, children: "PINNED" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 20, color: T.white, fontWeight: 700, margin: 0, lineHeight: 1.25 }, children: selectedThread.title })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "0 16px 12px", background: T.darkCard, borderRadius: 12, padding: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, fontWeight: 700, color: T.copper }, children: selectedThread.initial }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 5 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600 }, children: [
                  "@",
                  selectedThread.author
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankBadgeWithName, { points: getPoints(selectedThread.author), size: 10 })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, display: "block" }, children: [
                formatPostTime(selectedThread.time),
                selectedThread.editedAt ? " \xB7 edited" : ""
              ] })
            ] })
          ] }),
          selectedThread.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontFamily: serif, fontSize: 14, color: T.warmStone, lineHeight: 1.6, margin: 0 }, dangerouslySetInnerHTML: { __html: `${thRbCSS}<div class="th-rb">${selectedThread.body}</div>` } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.charcoal}` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => toggleForumLike(threadLikeKey, selectedThread.likes || 0), style: { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 8px 4px 0" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 14, color: threadLiked ? T.red : T.tertiary, strokeWidth: 1.5, fill: threadLiked ? T.red : "none" }),
              threadLikes > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: threadLiked ? T.red : T.tertiary }, children: threadLikes })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 14, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
                allPosts.length,
                " replies"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
                getViewCount(selectedThread),
                " views"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", marginLeft: "auto" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setForumShareMenu(threadShareOpen ? null : threadLikeKey), style: { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 14, color: T.tertiary, strokeWidth: 1.5 }) }),
              threadShareOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: "100%", right: 0, background: T.darkBg, border: `1px solid ${T.charcoal}`, borderRadius: 8, padding: 4, marginBottom: 4, zIndex: 200, minWidth: 150, boxShadow: "0 -4px 16px rgba(0,0,0,0.5)" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
                  shareToFeed(selectedThread.title, selectedThread.body, selectedThread.author);
                  setForumShareMenu(null);
                }, style: { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", border: "none", cursor: "pointer" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 12, color: T.copper }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white }, children: "Share to Feed" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
                  sendViaDM(selectedThread.title, selectedThread.author);
                  setForumShareMenu(null);
                }, style: { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", border: "none", cursor: "pointer" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: 12, color: T.copper }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white }, children: "Send via DM" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        allPosts.length > 0 && (() => {
          const topLevel = [];
          const subReplies = {};
          allPosts.forEach((post, i) => {
            if (post.replyTo && typeof post.parentIdx === "number") {
              if (!subReplies[post.parentIdx]) subReplies[post.parentIdx] = [];
              subReplies[post.parentIdx].push({ ...post, _origIdx: i });
            } else {
              topLevel.push({ ...post, _origIdx: i });
            }
          });
          const renderReply = (post, i, isSub, rootParentIdx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: isSub ? `${T.charcoal}40` : T.darkCard, padding: isSub ? "10px 14px 10px 20px" : "14px 16px", marginLeft: isSub ? 24 : 0, borderLeft: isSub ? `2px solid ${T.copper}30` : "none", borderBottom: `1px solid ${T.charcoal}` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: isSub ? 22 : 26, height: isSub ? 22 : 26, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: isSub ? 9 : 11, fontWeight: 700, color: T.copper }, children: post.initial }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: isSub ? 11 : 12, color: T.white, fontWeight: 600 }, children: [
                "@",
                post.author
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankBadge, { points: getPoints(post.author), size: isSub ? 9 : 10 }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: formatPostTime(post.time) })
            ] }),
            isSub && post.replyTo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginBottom: 4, paddingLeft: isSub ? 30 : 34 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper }, children: [
              "replying to @",
              post.replyTo
            ] }) }),
            post.body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontFamily: serif, fontSize: isSub ? 12 : 13, color: T.warmStone, lineHeight: 1.5, margin: "0 0 4px", paddingLeft: isSub ? 30 : 34 }, dangerouslySetInnerHTML: { __html: post.body.includes("<") ? `<div class="th-rb">${post.body}</div>` : post.body } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: isSub ? 12 : 13, color: T.warmStone, lineHeight: 1.5, margin: "0 0 4px", paddingLeft: isSub ? 30 : 34 }, children: post.body }),
            post.photos && post.photos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 6, paddingLeft: isSub ? 30 : 34 }, children: post.photos.map((p, pi) => {
              const pUrl = p.url || p;
              const isVid = p.type === "video";
              return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderRadius: 10, overflow: "hidden", border: `1px solid ${T.charcoal}`, position: "relative" }, children: [
                isVid ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: pUrl, preload: "metadata", playsInline: true, controls: true, style: { width: "100%", maxHeight: 260, objectFit: "contain", display: "block", background: "#000" } }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3, pointerEvents: "none" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 9, color: T.white }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.white, fontWeight: 600 }, children: "VIDEO" })
                  ] })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: pUrl, alt: "", style: { width: "100%", height: 180, objectFit: "cover", display: "block" } }),
                p.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "5px 10px", background: T.darkCard }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary, fontStyle: "italic" }, children: p.caption }) })
              ] }, pi);
            }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { paddingLeft: isSub ? 30 : 34 }, children: replyActionBar(post, post._origIdx, isSub ? rootParentIdx : void 0) })
          ] }, post._origIdx);
          const renderInlineReplyInput = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginLeft: 24, borderLeft: `2px solid ${T.copper}30`, background: `${T.charcoal}25`, padding: "10px 14px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: replyFileRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: handleReplyPhoto, style: { display: "none" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper }, children: [
                "Replying to @",
                replyToReply.author
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setReplyToReply(null), style: { background: "none", border: "none", cursor: "pointer", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, position: "relative", display: "flex", alignItems: "center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MentionInput, { value: forumReplyText, onChange: setForumReplyText, onKeyDown: (e) => {
                  if (e.key === "Enter" && (forumReplyText.trim() || replyPhotos.length > 0)) {
                    submitReply();
                  }
                }, placeholder: `Reply to @${replyToReply.author}...`, style: { flex: 1, padding: "10px 38px 10px 12px", borderRadius: 8, background: T.darkBg, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 13, outline: "none", width: "100%" } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => replyFileRef.current && replyFileRef.current.click(), style: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 16, color: T.tertiary }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: submitReply, style: { padding: "0 14px", borderRadius: 8, height: 40, background: forumReplyText.trim() || replyPhotos.length > 0 ? T.red : T.charcoal, border: "none", cursor: forumReplyText.trim() || replyPhotos.length > 0 ? "pointer" : "default", opacity: forumReplyText.trim() || replyPhotos.length > 0 ? 1 : 0.4, display: "flex", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16, color: T.white }) })
            ] }),
            replyPhotos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoUploader, { photos: replyPhotos, onChange: setReplyPhotos }) })
          ] });
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }, children: [
              "REPLIES (",
              allPosts.length,
              ")"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { borderRadius: 8, overflow: "hidden" }, children: topLevel.map((post, ti) => {
              const isReplyTarget = replyToReply && replyToReply.idx === post._origIdx;
              return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react4.default.Fragment, { children: [
                renderReply(post, ti, false, void 0),
                subReplies[post._origIdx] && subReplies[post._origIdx].map((sub, si) => renderReply(sub, si, true, post._origIdx)),
                isReplyTarget && renderInlineReplyInput()
              ] }, post._origIdx);
            }) })
          ] });
        })(),
        !replyToReply && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "16px 16px 0" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: replyFileRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: handleReplyPhoto, style: { display: "none" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, position: "relative", display: "flex", alignItems: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MentionInput, { value: forumReplyText, onChange: setForumReplyText, onKeyDown: (e) => {
                if (e.key === "Enter" && (forumReplyText.trim() || replyPhotos.length > 0)) {
                  submitReply();
                }
              }, placeholder: "Write a reply...", style: { flex: 1, padding: "12px 38px 12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 13, outline: "none", width: "100%" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => replyFileRef.current && replyFileRef.current.click(), style: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 16, color: T.tertiary }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: submitReply, style: { padding: "0 16px", borderRadius: 8, height: 42, background: forumReplyText.trim() || replyPhotos.length > 0 ? T.red : T.charcoal, border: "none", cursor: forumReplyText.trim() || replyPhotos.length > 0 ? "pointer" : "default", opacity: forumReplyText.trim() || replyPhotos.length > 0 ? 1 : 0.4, display: "flex", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 18, color: T.white }) })
          ] }),
          replyPhotos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoUploader, { photos: replyPhotos, onChange: setReplyPhotos }) })
        ] }),
        editingThreadId === selectedThread.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: T.darkBg, zIndex: 500, overflowY: "auto", display: "flex", flexDirection: "column" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${T.charcoal}`, flexShrink: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
                setEditingThreadId(null);
                setEditLinkInput(false);
              }, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20, color: T.white, strokeWidth: 1.5 }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 700 }, children: "Edit Thread" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
              const newBody = editBodyRef.current ? editBodyRef.current.innerHTML : editBody;
              const cleanBody = newBody && newBody.replace(/<[^>]+>/g, "").trim() ? newBody : null;
              const newPhotos = editPhotos.map((p) => ({ url: p.url, type: p.type || "image", caption: p.caption || "" }));
              const subName = selectedSub?.name;
              if (subName) {
                setUserThreads((prev) => {
                  const threads = prev[subName] || [];
                  return { ...prev, [subName]: threads.map((t) => t.id === selectedThread.id ? { ...t, title: editTitle.trim(), body: cleanBody, photos: newPhotos.length > 0 ? newPhotos : void 0, editedAt: Date.now() } : t) };
                });
              }
              setSelectedThread({ ...selectedThread, title: editTitle.trim(), body: cleanBody, photos: newPhotos.length > 0 ? newPhotos : void 0, editedAt: Date.now() });
              setEditingThreadId(null);
              setEditLinkInput(false);
            }, style: { padding: "8px 18px", borderRadius: 8, background: editTitle.trim() ? T.red : T.charcoal, border: "none", cursor: editTitle.trim() ? "pointer" : "default", opacity: editTitle.trim() ? 1 : 0.5 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "SAVE" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, overflowY: "auto", padding: "16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "TITLE *" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: editTitle, onChange: (e) => setEditTitle(e.target.value), style: { width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box" } })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "BODY" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 8px", background: T.charcoal, borderRadius: "8px 8px 0 0", border: `1px solid ${T.charcoal}`, borderBottom: "none" }, children: [
                [
                  { cmd: "bold", label: "B", style: { fontWeight: 700 } },
                  { cmd: "italic", label: "I", style: { fontStyle: "italic" } },
                  { cmd: "underline", label: "U", style: { textDecoration: "underline" } },
                  { cmd: "strikeThrough", label: "S", style: { textDecoration: "line-through" } }
                ].map((btn) => {
                  const isActive = editActiveFormats[btn.cmd];
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                    e.preventDefault();
                    document.execCommand(btn.cmd, false, null);
                    editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                    setTimeout(updateEditFormats, 0);
                  }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${T.copper}30` : "none", border: isActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", ...btn.style, color: isActive ? T.copper : T.white, fontFamily: serif, fontSize: 13, transition: "all 0.15s" }, children: btn.label }, btn.cmd);
                }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" } }),
                [
                  { cmd: "formatBlock", arg: "<h1>", label: "H1", key: "h1" },
                  { cmd: "formatBlock", arg: "<h2>", label: "H2", key: "h2" },
                  { cmd: "formatBlock", arg: "<h3>", label: "H3", key: "h3" },
                  { cmd: "formatBlock", arg: "<p>", label: "P", key: "p" }
                ].map((btn) => {
                  const isActive = editActiveFormats[btn.key];
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                    e.preventDefault();
                    document.execCommand(btn.cmd, false, btn.arg);
                    editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                    setTimeout(updateEditFormats, 0);
                  }, style: { minWidth: 28, height: 28, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${T.copper}30` : "none", border: isActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: isActive ? T.copper : T.white, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, transition: "all 0.15s" }, children: btn.label }, btn.label);
                }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" } }),
                (() => {
                  const ulActive = editActiveFormats.insertUnorderedList;
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                    e.preventDefault();
                    document.execCommand("insertUnorderedList", false, null);
                    editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                    setTimeout(updateEditFormats, 0);
                  }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: ulActive ? `${T.copper}30` : "none", border: ulActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: ulActive ? T.copper : T.white, fontFamily: sans, fontSize: 11, transition: "all 0.15s" }, title: "Bullet list", children: "\u2022\u2261" });
                })(),
                (() => {
                  const olActive = editActiveFormats.insertOrderedList;
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                    e.preventDefault();
                    document.execCommand("insertOrderedList", false, null);
                    editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                    setTimeout(updateEditFormats, 0);
                  }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: olActive ? `${T.copper}30` : "none", border: olActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: olActive ? T.copper : T.white, fontFamily: sans, fontSize: 11, transition: "all 0.15s" }, title: "Numbered list", children: "1." });
                })(),
                (() => {
                  const sel = window.getSelection && window.getSelection();
                  let isHighlighted = false;
                  if (sel && sel.rangeCount > 0 && sel.anchorNode) {
                    let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
                    while (node && node !== editBodyRef.current) {
                      const bg = node.style && node.style.backgroundColor;
                      if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "") {
                        isHighlighted = true;
                        break;
                      }
                      node = node.parentElement;
                    }
                  }
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                    e.preventDefault();
                    document.execCommand("hiliteColor", false, isHighlighted ? "transparent" : "#C49A6C40");
                    editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                  }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: isHighlighted ? `${T.copper}60` : `${T.copper}20`, border: isHighlighted ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 10, fontWeight: 700, transition: "all 0.15s" }, title: "Highlight", children: "Hi" });
                })(),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                  e.preventDefault();
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
                  editSavedRange.current = selection.getRangeAt(0).cloneRange();
                  setEditLinkInput(true);
                  setEditLinkUrl("");
                }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: editLinkInput ? `${T.copper}30` : "none", border: editLinkInput ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 11, textDecoration: "underline", transition: "all 0.15s" }, title: "Insert link", children: "\u{1F517}" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => {
                  e.preventDefault();
                  const selection = window.getSelection();
                  if (selection && selection.rangeCount > 0) editSavedRange.current = selection.getRangeAt(0).cloneRange();
                  const fileInput = document.createElement("input");
                  fileInput.type = "file";
                  fileInput.accept = "image/*";
                  fileInput.multiple = true;
                  fileInput.onchange = (ev) => {
                    Array.from(ev.target.files || []).forEach((file) => {
                      const reader = new FileReader();
                      reader.onload = (re) => {
                        if (editBodyRef.current) {
                          editBodyRef.current.focus();
                          const sel = window.getSelection();
                          if (editSavedRange.current) {
                            sel.removeAllRanges();
                            sel.addRange(editSavedRange.current);
                          }
                          document.execCommand("insertHTML", false, `<div style="margin:8px 0"><img src="${re.target.result}" style="max-width:100%;border-radius:8px;display:block" /></div>`);
                          setEditBody(editBodyRef.current.innerHTML);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                  };
                  fileInput.click();
                }, style: { width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 13, transition: "all 0.15s" }, title: "Insert image", children: "\u{1F4F7}" })
              ] }),
              editLinkInput && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6, padding: "8px 10px", background: T.darkBg, border: `1px solid ${T.copper}`, borderBottom: "none" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { autoFocus: true, value: editLinkUrl, onChange: (e) => setEditLinkUrl(e.target.value), onKeyDown: (e) => {
                  if (e.key === "Enter" && editLinkUrl.trim()) {
                    e.preventDefault();
                    const sel = window.getSelection();
                    if (editSavedRange.current) {
                      sel.removeAllRanges();
                      sel.addRange(editSavedRange.current);
                    }
                    document.execCommand("createLink", false, editLinkUrl.trim().startsWith("http") ? editLinkUrl.trim() : "https://" + editLinkUrl.trim());
                    editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                    setEditLinkInput(false);
                    setEditLinkUrl("");
                    editSavedRange.current = null;
                  } else if (e.key === "Escape") {
                    setEditLinkInput(false);
                    setEditLinkUrl("");
                    editSavedRange.current = null;
                  }
                }, placeholder: "Paste URL and press Enter...", style: { flex: 1, padding: "6px 10px", borderRadius: 6, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: sans, fontSize: 12, outline: "none" } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
                  if (editLinkUrl.trim()) {
                    const sel = window.getSelection();
                    if (editSavedRange.current) {
                      sel.removeAllRanges();
                      sel.addRange(editSavedRange.current);
                    }
                    document.execCommand("createLink", false, editLinkUrl.trim().startsWith("http") ? editLinkUrl.trim() : "https://" + editLinkUrl.trim());
                    editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                  }
                  setEditLinkInput(false);
                  setEditLinkUrl("");
                  editSavedRange.current = null;
                }, style: { padding: "6px 12px", borderRadius: 6, background: T.copper, border: "none", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600 }, children: "Add" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
                  setEditLinkInput(false);
                  setEditLinkUrl("");
                  editSavedRange.current = null;
                }, style: { padding: "6px 8px", borderRadius: 6, background: "none", border: `1px solid ${T.tertiary}40`, cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12, color: T.tertiary }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  ref: (el) => {
                    editBodyRef.current = el;
                    if (el && editInitialized.current !== editingThreadId) {
                      el.innerHTML = editBody;
                      editInitialized.current = editingThreadId;
                    }
                  },
                  contentEditable: true,
                  onInput: () => {
                    editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                    updateEditFormats();
                  },
                  onKeyUp: updateEditFormats,
                  onMouseUp: updateEditFormats,
                  onSelect: updateEditFormats,
                  onFocus: updateEditFormats,
                  onPaste: (e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
                    document.execCommand("insertHTML", false, text);
                    editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                  },
                  style: { width: "100%", minHeight: 180, padding: "12px 14px", borderRadius: "0 0 8px 8px", background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box", lineHeight: 1.6, overflowY: "auto", maxHeight: 400 }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
                  [contenteditable] h1 { font-size: 26px !important; font-weight: 700; color: ${T.white}; margin: 10px 0 6px; font-family: ${sans}; line-height: 1.2; }
                  [contenteditable] h2 { font-size: 21px !important; font-weight: 700; color: ${T.white}; margin: 8px 0 4px; font-family: ${sans}; line-height: 1.3; }
                  [contenteditable] h3 { font-size: 17px !important; font-weight: 600; color: ${T.white}; margin: 6px 0 3px; font-family: ${sans}; line-height: 1.3; }
                  [contenteditable] img { max-width: 100%; border-radius: 8px; display: block; margin: 8px 0; }
                  [contenteditable] a { color: ${T.copper}; text-decoration: underline; }
                  [contenteditable] ul { list-style-type: disc !important; padding-left: 24px !important; }
                  [contenteditable] ol { list-style-type: decimal !important; padding-left: 24px !important; }
                  [contenteditable] li { display: list-item !important; }
                ` })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "HERO IMAGE" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoUploader, { photos: editPhotos, onChange: setEditPhotos })
            ] })
          ] })
        ] })
      ] });
    }
    if (view === "threads" && selectedSub && selectedCat) {
      const threads = [...userThreads[selectedSub.name] || [], ...forumData.threads[selectedSub.name] || []];
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: goBack, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20, color: T.white, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 700, display: "block" }, children: selectedSub.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: selectedCat.name })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: openNewThreadFromSub, style: { display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14, color: T.white }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "NEW" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: threads.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => openThread(t), style: { background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === threads.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < threads.length - 1 ? `1px solid ${T.charcoal}` : "none" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: t.pinned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}20`, padding: "2px 6px", borderRadius: 3, letterSpacing: 1 }, children: "PINNED" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 8px", lineHeight: 1.4 }, children: t.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
                "@",
                t.author
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: formatPostTime(t.time) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10, alignItems: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 3 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 12, color: T.tertiary }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: getReplyCount(t) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: getViewCount(t) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14, color: T.tertiary })
            ] })
          ] })
        ] }, t.id)) }) })
      ] });
    }
    if (view === "subcategories" && selectedCat) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: goBack, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20, color: T.white, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 700 }, children: selectedCat.name })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: selectedCat.subs.map((sub, i) => {
          const threadCount = (forumData.threads[sub.name] || []).length;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => openSubcategory(sub), style: { background: T.darkCard, padding: "16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === selectedCat.subs.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < selectedCat.subs.length - 1 ? `1px solid ${T.charcoal}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 36, height: 36, borderRadius: 8, background: `${selectedCat.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 16, color: selectedCat.color }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }, children: sub.name }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
                  sub.threads,
                  " threads"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16, color: T.tertiary })
          ] }, sub.name);
        }) }) })
      ] });
    }
    const totalThreads = (cat) => cat.subs.reduce((sum, s) => sum + s.threads, 0);
    const recentThreads = Object.values(forumData.threads).flat().sort((a, b) => {
      const timeVal = (t) => t.includes("m ago") ? 1 : t.includes("h ago") ? parseInt(t) : t.includes("d ago") ? parseInt(t) * 24 : 999;
      return timeVal(a.time) - timeVal(b.time);
    }).slice(0, 5);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px", border: searchActive ? `1px solid ${T.copper}` : `1px solid transparent` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 16, color: searchActive ? T.copper : T.tertiary }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              ref: searchInputRef,
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              onFocus: () => setSearchActive(true),
              placeholder: "Search threads, keywords, or @users...",
              style: { flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, marginLeft: 8, padding: 0 }
            }
          ),
          searchQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
            setSearchQuery("");
            setSearchActive(false);
          }, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", marginLeft: 4 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: openNewThreadFromHome, style: { display: "flex", alignItems: "center", gap: 5, padding: "10px 14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", whiteSpace: "nowrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "NEW THREAD" })
        ] })
      ] }) }),
      searchQuery.trim().length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }, children: [
          searchResults.length,
          " RESULT",
          searchResults.length !== 1 ? "S" : "",
          ' FOR "',
          searchQuery.trim().toUpperCase(),
          '"'
        ] }),
        searchResults.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 8, padding: "24px 16px", textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 24, color: T.tertiary, style: { marginBottom: 8 } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "8px 0 4px" }, children: "No threads found" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }, children: "Try different keywords or check the spelling" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: searchResults.map((t, i) => {
          const q = searchQuery.trim().toLowerCase();
          const matchesAuthor = t.author.toLowerCase().includes(q);
          const matchesReply = t.posts && t.posts.some((p) => p.author.toLowerCase().includes(q));
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => {
            setSelectedCat(t.cat);
            setSelectedSub(t.sub);
            setSelectedThread(t);
            setView("thread");
            trackView(t.id);
          }, style: { background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === searchResults.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < searchResults.length - 1 ? `1px solid ${T.charcoal}` : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}15`, padding: "2px 6px", borderRadius: 3, letterSpacing: 0.5 }, children: t.catName }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary }, children: "\u203A" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 0.5 }, children: t.subName }),
              matchesAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.green, background: `${T.green}20`, padding: "2px 6px", borderRadius: 3, marginLeft: "auto" }, children: "AUTHOR MATCH" }),
              !matchesAuthor && matchesReply && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.green, background: `${T.green}20`, padding: "2px 6px", borderRadius: 3, marginLeft: "auto" }, children: "REPLY MATCH" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 6px", lineHeight: 1.4 }, children: t.title }),
            t.body && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: "0 0 8px", lineHeight: 1.4 }, children: t.body.length > 80 ? t.body.slice(0, 80) + "..." : t.body }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: matchesAuthor ? T.green : T.tertiary, fontWeight: matchesAuthor ? 600 : 400 }, children: [
                  "@",
                  t.author
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: formatPostTime(t.time) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10, alignItems: "center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 3 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 12, color: T.tertiary }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: getReplyCount(t) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: getViewCount(t) })
              ] })
            ] })
          ] }, t.id);
        }) })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }, children: "CATEGORIES" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }, children: forumData.categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => openCategory(cat), style: { background: T.darkCard, borderRadius: 8, padding: "14px", cursor: "pointer", borderLeft: `3px solid ${cat.color}` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block", marginBottom: 4 }, children: cat.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: [
              totalThreads(cat),
              " threads"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, display: "block", marginTop: 2 }, children: [
              cat.subs.length,
              " subcategories"
            ] })
          ] }, cat.name)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }, children: "RECENT THREADS" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: recentThreads.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => {
            for (const cat of forumData.categories) {
              for (const sub of cat.subs) {
                if ((forumData.threads[sub.name] || []).find((th) => th.id === t.id)) {
                  setSelectedCat(cat);
                  setSelectedSub(sub);
                  setSelectedThread(t);
                  setView("thread");
                  trackView(t.id);
                  return;
                }
              }
            }
          }, style: { background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === recentThreads.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < recentThreads.length - 1 ? `1px solid ${T.charcoal}` : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: t.pinned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}20`, padding: "2px 6px", borderRadius: 3, letterSpacing: 1 }, children: "PINNED" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 8px", lineHeight: 1.4 }, children: t.title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
                  "@",
                  t.author
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: formatPostTime(t.time) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10, alignItems: "center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 3 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 12, color: T.tertiary }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: getReplyCount(t) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: getViewCount(t) })
              ] })
            ] })
          ] }, t.id)) })
        ] })
      ] })
    ] });
  }
  function RouteRecorder({ onClose, onSave }) {
    const mapRef = (0, import_react4.useRef)(null);
    const mapInst = (0, import_react4.useRef)(null);
    const polyRef = (0, import_react4.useRef)(null);
    const userDotRef = (0, import_react4.useRef)(null);
    const watchRef = (0, import_react4.useRef)(null);
    const startTimeRef = (0, import_react4.useRef)(null);
    const [mapReady, setMapReady] = (0, import_react4.useState)(false);
    const [recording, setRecording] = (0, import_react4.useState)(false);
    const [paused, setPaused] = (0, import_react4.useState)(false);
    const [trackPoints, setTrackPoints] = (0, import_react4.useState)([]);
    const [elapsed, setElapsed] = (0, import_react4.useState)(0);
    const [stats, setStats] = (0, import_react4.useState)({ speed: 0, maxSpeed: 0, elevation: 0, elevGain: 0, distance: 0 });
    const [showDetails, setShowDetails] = (0, import_react4.useState)(false);
    const timerRef = (0, import_react4.useRef)(null);
    const pausedTimeRef = (0, import_react4.useRef)(0);
    const pauseStartRef = (0, import_react4.useRef)(null);
    const [routePhotos, setRoutePhotos] = (0, import_react4.useState)([]);
    const recCamRef = (0, import_react4.useRef)(null);
    const photoMarkersRef = (0, import_react4.useRef)([]);
    const handleRecPhoto = (e) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      e.target.value = "";
      const processFile = (file, lat, lng) => {
        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          const blobUrl = URL.createObjectURL(file);
          const photo = { url: blobUrl, name: file.name, type: "video", ...lat != null ? { lat, lng } : {} };
          setRoutePhotos((prev) => [...prev, photo]);
        } else {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const photo = { url: ev.target.result, name: file.name, type: "image", ...lat != null ? { lat, lng } : {} };
            setRoutePhotos((prev) => [...prev, photo]);
            if (lat != null && mapInst.current && window.google) {
              const m = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInst.current,
                label: { text: "\u{1F4F7}", fontSize: "14px" },
                icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 16, fillColor: "#4A7C59", fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 },
                zIndex: 998
              });
              photoMarkersRef.current.push(m);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            files.forEach((file) => processFile(file, pos.coords.latitude, pos.coords.longitude));
          },
          () => {
            files.forEach((file) => processFile(file));
          },
          { enableHighAccuracy: true, timeout: 3e3 }
        );
      } else {
        files.forEach((file) => processFile(file));
      }
    };
    (0, import_react4.useEffect)(() => {
      let cancelled = false;
      const init = async () => {
        try {
          await loadGmaps();
        } catch (e) {
          return;
        }
        if (cancelled || !mapRef.current) return;
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 39.5, lng: -98.35 },
          zoom: 5,
          mapTypeId: "terrain",
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] }
          ]
        });
        mapInst.current = map;
        polyRef.current = new window.google.maps.Polyline({
          map,
          path: [],
          strokeColor: T.red,
          strokeWeight: 4,
          strokeOpacity: 0.9
        });
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              map.setCenter({ lat: p.coords.latitude, lng: p.coords.longitude });
              map.setZoom(15);
            },
            () => {
            },
            { enableHighAccuracy: true, timeout: 5e3 }
          );
        }
        setMapReady(true);
      };
      init();
      return () => {
        cancelled = true;
      };
    }, []);
    (0, import_react4.useEffect)(() => {
      if (recording && !paused) {
        timerRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1e3));
        }, 1e3);
      } else {
        clearInterval(timerRef.current);
      }
      return () => clearInterval(timerRef.current);
    }, [recording, paused]);
    const formatTime = (s) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor(s % 3600 / 60);
      const sec = s % 60;
      return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
    };
    const startRecording = () => {
      if (!navigator.geolocation) return;
      setRecording(true);
      setPaused(false);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setTrackPoints([]);
      setStats({ speed: 0, maxSpeed: 0, elevation: 0, elevGain: 0, distance: 0 });
      setElapsed(0);
      if (polyRef.current) polyRef.current.setPath([]);
      let prevAlt = null;
      let totalDist = 0;
      let totalGain = 0;
      let maxSpd = 0;
      let lastLat = null;
      let lastLng = null;
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const alt = pos.coords.altitude;
          const speed = pos.coords.speed;
          const pt = { lat, lng, alt, speed, time: Date.now() };
          setTrackPoints((prev) => [...prev, pt]);
          if (polyRef.current) {
            const path = polyRef.current.getPath();
            path.push(new window.google.maps.LatLng(lat, lng));
          }
          const p = new window.google.maps.LatLng(lat, lng);
          if (!userDotRef.current && mapInst.current) {
            userDotRef.current = new window.google.maps.Marker({
              position: p,
              map: mapInst.current,
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeColor: T.white, strokeWeight: 3 },
              zIndex: 999
            });
          } else if (userDotRef.current) {
            userDotRef.current.setPosition(p);
          }
          if (mapInst.current) mapInst.current.panTo(p);
          if (lastLat !== null) {
            totalDist += haversine(lastLat, lastLng, lat, lng);
          }
          lastLat = lat;
          lastLng = lng;
          if (alt !== null && prevAlt !== null && alt > prevAlt) {
            totalGain += alt - prevAlt;
          }
          if (alt !== null) prevAlt = alt;
          const spdMph = speed !== null ? speed * 2.237 : 0;
          if (spdMph > maxSpd) maxSpd = spdMph;
          setStats({
            speed: Math.round(spdMph),
            maxSpeed: Math.round(maxSpd),
            elevation: alt !== null ? Math.round(alt * 3.281) : 0,
            // m to ft
            elevGain: Math.round(totalGain * 3.281),
            distance: totalDist
          });
        },
        (err) => console.warn("GPS error:", err.message),
        { enableHighAccuracy: true, timeout: 1e4, maximumAge: 2e3 }
      );
    };
    const pauseRecording = () => {
      setPaused(true);
      pauseStartRef.current = Date.now();
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
    const resumeRecording = () => {
      setPaused(false);
      if (pauseStartRef.current) {
        pausedTimeRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      let prevAlt = trackPoints.length > 0 ? trackPoints[trackPoints.length - 1].alt : null;
      let totalDist = stats.distance;
      let totalGain = stats.elevGain / 3.281;
      let maxSpd = stats.maxSpeed;
      let lastPt = trackPoints.length > 0 ? trackPoints[trackPoints.length - 1] : null;
      let lastLat = lastPt ? lastPt.lat : null;
      let lastLng = lastPt ? lastPt.lng : null;
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const alt = pos.coords.altitude;
          const speed = pos.coords.speed;
          const pt = { lat, lng, alt, speed, time: Date.now() };
          setTrackPoints((prev) => [...prev, pt]);
          if (polyRef.current) polyRef.current.getPath().push(new window.google.maps.LatLng(lat, lng));
          const p = new window.google.maps.LatLng(lat, lng);
          if (userDotRef.current) userDotRef.current.setPosition(p);
          if (mapInst.current) mapInst.current.panTo(p);
          if (lastLat !== null) totalDist += haversine(lastLat, lastLng, lat, lng);
          lastLat = lat;
          lastLng = lng;
          if (alt !== null && prevAlt !== null && alt > prevAlt) totalGain += alt - prevAlt;
          if (alt !== null) prevAlt = alt;
          const spdMph = speed !== null ? speed * 2.237 : 0;
          if (spdMph > maxSpd) maxSpd = spdMph;
          setStats({
            speed: Math.round(spdMph),
            maxSpeed: Math.round(maxSpd),
            elevation: alt !== null ? Math.round(alt * 3.281) : 0,
            elevGain: Math.round(totalGain * 3.281),
            distance: totalDist
          });
        },
        (err) => console.warn("GPS error:", err.message),
        { enableHighAccuracy: true, timeout: 1e4, maximumAge: 2e3 }
      );
    };
    const stopRecording = () => {
      setRecording(false);
      setPaused(false);
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      if (userDotRef.current) {
        userDotRef.current.setMap(null);
        userDotRef.current = null;
      }
      if (mapInst.current && trackPoints.length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        trackPoints.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        mapInst.current.fitBounds(bounds, 40);
      }
      setShowDetails(true);
    };
    const handlePublish = (details) => {
      onSave({
        ...details,
        points: trackPoints,
        distance: stats.distance,
        elevGain: stats.elevGain,
        maxSpeed: stats.maxSpeed,
        duration: elapsed
      });
    };
    const distMi = (stats.distance / 1609.34).toFixed(1);
    if (showDetails) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        RouteDetailsForm,
        {
          autoStats: { distance: distMi, elevGain: stats.elevGain, maxSpeed: stats.maxSpeed, duration: formatTime(elapsed), elevation: stats.elevation },
          onBack: () => setShowDetails(false),
          onPublish: handlePublish,
          initialPhotos: routePhotos
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, zIndex: 300, background: T.darkBg, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }, children: "Record Route" })
        ] }),
        recording && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 8, height: 8, borderRadius: "50%", background: paused ? T.copper : T.red, animation: paused ? "none" : "thspin 2s linear infinite" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: paused ? T.copper : T.red, fontWeight: 600 }, children: paused ? "PAUSED" : "REC" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: mapRef, style: { width: "100%", height: "100%" } }),
        !mapReady && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: T.darkBg }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 28, height: 28, border: `3px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite", margin: "0 auto 12px" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.tertiary }, children: "Loading map..." })
        ] }) })
      ] }),
      recording && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, padding: "12px 16px", flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { textAlign: "center", marginBottom: 10 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 32, fontWeight: 700, color: T.white, letterSpacing: 1 }, children: formatTime(elapsed) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "SPEED" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }, children: stats.speed }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: "MPH" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "MAX" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.copper }, children: stats.maxSpeed }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: "MPH" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "ELEV" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }, children: stats.elevation.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: "FT" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "GAIN" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.green }, children: stats.elevGain.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: "FT" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", marginBottom: 12, padding: "8px 0", borderTop: `1px solid ${T.darkCard}`, borderBottom: `1px solid ${T.darkCard}` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1 }, children: "DISTANCE " }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 20, fontWeight: 700, color: T.red }, children: distMi }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: " MI" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "12px 16px", background: T.charcoal, borderTop: recording ? "none" : `1px solid ${T.darkCard}`, flexShrink: 0, display: "flex", gap: 10 }, children: !recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: startRecording, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { size: 16, color: T.white }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "START RECORDING" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: resumeRecording, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px", borderRadius: 8, background: T.green, border: "none", cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "RESUME" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: pauseRecording, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px", borderRadius: 8, background: T.copper, border: "none", cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "PAUSE" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: recCamRef, type: "file", accept: "image/*,video/*", capture: "environment", onChange: handleRecPhoto, style: { display: "none" } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => recCamRef.current && recCamRef.current.click(), style: { padding: "14px 18px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 16, color: T.white }),
          routePhotos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontSize: 9, color: T.white, fontWeight: 700 }, children: routePhotos.length })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: stopRecording, style: { padding: "14px 18px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: 14, height: 14, borderRadius: 2, background: T.white, display: "block" } }) })
      ] }) })
    ] });
  }
  var rdInput = { width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box" };
  var rdLabel = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 };
  var rdStatBox = { textAlign: "center", padding: "10px 0", background: T.darkCard, borderRadius: 8 };
  function RouteMapPreview({ pins, points, photos }) {
    const mapRef = (0, import_react4.useRef)(null);
    const mapInst = (0, import_react4.useRef)(null);
    const markersRef = (0, import_react4.useRef)([]);
    const polyRef = (0, import_react4.useRef)(null);
    const infoRef = (0, import_react4.useRef)(null);
    const [ready, setReady] = (0, import_react4.useState)(false);
    const [selectedPhoto, setSelectedPhoto] = (0, import_react4.useState)(null);
    (0, import_react4.useEffect)(() => {
      if ((!pins || pins.length === 0) && (!points || points.length === 0)) return;
      if (!mapRef.current) return;
      const tryInit = () => {
        if (!window.google || !window.google.maps) {
          setTimeout(tryInit, 200);
          return;
        }
        if (mapInst.current) return;
        const bounds = new window.google.maps.LatLngBounds();
        const allPts = points && points.length > 0 ? points : pins;
        allPts.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        if (pins) pins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        const map = new window.google.maps.Map(mapRef.current, {
          center: bounds.getCenter(),
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8b7d6b" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#111111" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a28" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] }
          ]
        });
        map.fitBounds(bounds, 30);
        mapInst.current = map;
        const photoList = photos || [];
        let photoIdx = 0;
        if (pins && pins.length > 0) {
          pins.forEach((p, i) => {
            const isPhoto = !!p.photo;
            const marker = new window.google.maps.Marker({
              position: { lat: p.lat, lng: p.lng },
              map,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: isPhoto ? 10 : 6,
                fillColor: isPhoto ? "#4A7C59" : i === 0 ? T.green : i === pins.length - 1 ? T.red : T.copper,
                fillOpacity: 1,
                strokeColor: T.white,
                strokeWeight: isPhoto ? 2 : 1.5
              },
              label: isPhoto ? { text: "\u{1F4F7}", fontSize: "12px" } : null,
              zIndex: isPhoto ? 100 : 10
            });
            if (isPhoto && photoList.length > 0) {
              let matchedPhoto = null;
              const pPhoto = photoList.find((ph) => ph.lat && ph.lng && Math.abs(ph.lat - p.lat) < 5e-4 && Math.abs(ph.lng - p.lng) < 5e-4);
              if (pPhoto) {
                matchedPhoto = pPhoto.url || pPhoto;
              } else if (photoIdx < photoList.length) {
                matchedPhoto = photoList[photoIdx].url || photoList[photoIdx];
                photoIdx++;
              }
              if (matchedPhoto) {
                marker.addListener("click", () => {
                  setSelectedPhoto(matchedPhoto);
                });
                marker.setCursor("pointer");
              }
            }
            markersRef.current.push(marker);
          });
        }
        const polyPath = points && points.length > 1 ? points.map((p) => ({ lat: p.lat, lng: p.lng })) : pins && pins.length > 1 ? pins.map((p) => ({ lat: p.lat, lng: p.lng })) : [];
        if (polyPath.length > 1) {
          polyRef.current = new window.google.maps.Polyline({
            path: polyPath,
            map,
            strokeColor: T.red,
            strokeWeight: 3,
            strokeOpacity: 0.85
          });
        }
        setReady(true);
      };
      tryInit();
      return () => {
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        if (polyRef.current) {
          polyRef.current.setMap(null);
          polyRef.current = null;
        }
        mapInst.current = null;
      };
    }, [pins]);
    if (!pins || pins.length === 0) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: mapRef, style: { width: "100%", height: "100%" } }),
      selectedPhoto && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => setSelectedPhoto(null), style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, cursor: "pointer", borderRadius: 10 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: selectedPhoto, alt: "", style: { maxWidth: "90%", maxHeight: "90%", borderRadius: 10, objectFit: "contain" } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setSelectedPhoto(null), style: { position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: "#fff" }) })
      ] })
    ] });
  }
  function RouteNavigation({ route, onClose }) {
    const mapRef = (0, import_react4.useRef)(null);
    const mapInst = (0, import_react4.useRef)(null);
    const userDotRef = (0, import_react4.useRef)(null);
    const watchRef = (0, import_react4.useRef)(null);
    const dirRendererRef = (0, import_react4.useRef)(null);
    const [mapReady, setMapReady] = (0, import_react4.useState)(false);
    const [currentStep, setCurrentStep] = (0, import_react4.useState)(null);
    const [distToNext, setDistToNext] = (0, import_react4.useState)("");
    const [arrived, setArrived] = (0, import_react4.useState)(false);
    const [userPos, setUserPos] = (0, import_react4.useState)(null);
    const stepsRef = (0, import_react4.useRef)([]);
    const routeLegsRef = (0, import_react4.useRef)([]);
    const rPins = route.pins || [];
    const startPin = rPins.length > 0 ? rPins[0] : null;
    const endPin = rPins.length > 1 ? rPins[rPins.length - 1] : null;
    (0, import_react4.useEffect)(() => {
      let cancelled = false;
      const init = async () => {
        try {
          await loadGmaps();
        } catch (e) {
          return;
        }
        if (cancelled || !mapRef.current) return;
        const center = startPin ? { lat: startPin.lat, lng: startPin.lng } : { lat: 39.5, lng: -98.35 };
        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeId: "terrain",
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] }
          ]
        });
        mapInst.current = map;
        if (startPin && endPin) {
          const ds = new window.google.maps.DirectionsService();
          const dr = new window.google.maps.DirectionsRenderer({
            map,
            suppressMarkers: false,
            polylineOptions: { strokeColor: T.red, strokeWeight: 5, strokeOpacity: 0.9 },
            markerOptions: { visible: false }
          });
          dirRendererRef.current = dr;
          const waypoints = rPins.slice(1, -1).filter((p) => !p.photo).map((p) => ({ location: { lat: p.lat, lng: p.lng }, stopover: true }));
          ds.route({
            origin: { lat: startPin.lat, lng: startPin.lng },
            destination: { lat: endPin.lat, lng: endPin.lng },
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false
          }, (result, status) => {
            if (status === "OK") {
              dr.setDirections(result);
              const allSteps = [];
              result.routes[0].legs.forEach((leg) => {
                routeLegsRef.current.push(leg);
                leg.steps.forEach((step) => allSteps.push(step));
              });
              stepsRef.current = allSteps;
              if (allSteps.length > 0) {
                setCurrentStep({ instruction: allSteps[0].instructions, distance: allSteps[0].distance.text, duration: allSteps[0].duration.text });
              }
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].overview_path.forEach((p) => bounds.extend(p));
              map.fitBounds(bounds, 60);
            }
          });
          new window.google.maps.Marker({ position: { lat: startPin.lat, lng: startPin.lng }, map, icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: T.green, fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 }, label: { text: "S", color: T.white, fontWeight: "bold", fontSize: "11px" } });
          new window.google.maps.Marker({ position: { lat: endPin.lat, lng: endPin.lng }, map, icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: T.red, fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 }, label: { text: "F", color: T.white, fontWeight: "bold", fontSize: "11px" } });
        }
        if (navigator.geolocation) {
          watchRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setUserPos({ lat, lng });
              const p = new window.google.maps.LatLng(lat, lng);
              if (!userDotRef.current) {
                userDotRef.current = new window.google.maps.Marker({
                  position: p,
                  map,
                  icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#4285F4", fillOpacity: 1, strokeColor: T.white, strokeWeight: 3 },
                  zIndex: 999
                });
              } else {
                userDotRef.current.setPosition(p);
              }
              map.panTo(p);
              if (stepsRef.current.length > 0) {
                let closest = null;
                let closestDist = Infinity;
                stepsRef.current.forEach((step, si) => {
                  const sLat = step.start_location.lat();
                  const sLng = step.start_location.lng();
                  const d = Math.sqrt(Math.pow(lat - sLat, 2) + Math.pow(lng - sLng, 2));
                  if (d < closestDist) {
                    closestDist = d;
                    closest = si;
                  }
                });
                if (closest !== null) {
                  const step = stepsRef.current[closest];
                  setCurrentStep({ instruction: step.instructions, distance: step.distance.text, duration: step.duration.text });
                }
              }
              if (endPin) {
                const dEnd = haversine(lat, lng, endPin.lat, endPin.lng);
                if (dEnd < 50) setArrived(true);
              }
            },
            () => {
            },
            { enableHighAccuracy: true, timeout: 1e4, maximumAge: 2e3 }
          );
        }
        setMapReady(true);
      };
      init();
      return () => {
        cancelled = true;
        if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
        if (userDotRef.current) {
          userDotRef.current.setMap(null);
          userDotRef.current = null;
        }
      };
    }, []);
    const stripHtml2 = (html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, zIndex: 400, background: T.darkBg, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.charcoal, padding: "12px 16px", borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 16, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, fontWeight: 700, color: T.white, letterSpacing: 0.5 }, children: route.name || route.title || "Route Navigation" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { background: `${T.red}30`, border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.red, letterSpacing: 0.5 }, children: "END" }) })
        ] }),
        arrived ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.green}20`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 18, color: T.green }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.green }, children: "You have arrived!" })
        ] }) : currentStep ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 8, padding: "10px 14px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 4px", lineHeight: 1.4 }, children: stripHtml2(currentStep.instruction) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600 }, children: currentStep.distance }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: currentStep.duration })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 14, height: 14, border: `2px solid ${T.copper}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.tertiary }, children: "Calculating route..." })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: mapRef, style: { width: "100%", height: "100%" } }),
        !mapReady && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: T.darkBg }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 28, height: 28, border: `3px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite", margin: "0 auto 12px" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.tertiary }, children: "Loading navigation..." })
        ] }) }),
        userPos && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => mapInst.current && mapInst.current.panTo(userPos), style: { position: "absolute", bottom: 16, right: 16, width: 44, height: 44, borderRadius: "50%", background: T.charcoal, border: `1px solid ${T.tertiary}40`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { size: 18, color: T.copper }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, padding: "10px 16px", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-around" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "DISTANCE" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }, children: route.distance || "\u2014" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "EST. TIME" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }, children: route.time || route.duration || "\u2014" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "ELEVATION" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }, children: route.elevation || "\u2014" })
        ] })
      ] }) })
    ] });
  }
  function RoutePinMap({ pins, setPins, linkingPhotoIdx, onLinkPin, onRoutePoints }) {
    const mapRef = (0, import_react4.useRef)(null);
    const mapInst = (0, import_react4.useRef)(null);
    const markersRef = (0, import_react4.useRef)([]);
    const polyRef = (0, import_react4.useRef)(null);
    const dirRendererRef = (0, import_react4.useRef)(null);
    const dirServiceRef = (0, import_react4.useRef)(null);
    const [ready, setReady] = (0, import_react4.useState)(false);
    (0, import_react4.useEffect)(() => {
      let cancelled = false;
      const init = async () => {
        try {
          await loadGmaps();
        } catch (e) {
          return;
        }
        if (cancelled || !mapRef.current) return;
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 39.5, lng: -98.35 },
          zoom: 5,
          mapTypeId: "terrain",
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] }
          ]
        });
        mapInst.current = map;
        polyRef.current = new window.google.maps.Polyline({ map, path: [], strokeColor: T.red, strokeWeight: 3, strokeOpacity: 0.8 });
        dirServiceRef.current = new window.google.maps.DirectionsService();
        dirRendererRef.current = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: { strokeColor: T.red, strokeWeight: 4, strokeOpacity: 0.9 }
        });
        map.addListener("click", (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setPins((prev) => [...prev, { lat, lng }]);
        });
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              map.setCenter({ lat: p.coords.latitude, lng: p.coords.longitude });
              map.setZoom(10);
            },
            () => {
            },
            { enableHighAccuracy: true, timeout: 5e3 }
          );
        }
        setReady(true);
      };
      init();
      return () => {
        cancelled = true;
      };
    }, []);
    (0, import_react4.useEffect)(() => {
      if (!mapInst.current || !ready) return;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      pins.forEach((p, i) => {
        const isPhoto = !!p.photo;
        const marker = new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map: mapInst.current,
          label: isPhoto ? { text: "\u{1F4F7}", fontSize: "14px" } : { text: `${i + 1}`, color: T.white, fontWeight: "bold", fontSize: "11px" },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: isPhoto ? 16 : 14,
            fillColor: isPhoto ? "#4A7C59" : i === 0 ? T.green : i === pins.length - 1 ? T.red : T.copper,
            fillOpacity: 1,
            strokeColor: T.white,
            strokeWeight: 2
          }
        });
        marker.addListener("click", () => {
          if (typeof linkingPhotoIdx === "number" && onLinkPin) {
            onLinkPin(i);
          } else {
            setPins((prev) => prev.filter((_, idx) => idx !== i));
          }
        });
        markersRef.current.push(marker);
      });
      const routePins = pins.filter((p) => !p.photo);
      if (routePins.length >= 2 && dirServiceRef.current && dirRendererRef.current) {
        if (polyRef.current) polyRef.current.setPath([]);
        const origin = { lat: routePins[0].lat, lng: routePins[0].lng };
        const destination = { lat: routePins[routePins.length - 1].lat, lng: routePins[routePins.length - 1].lng };
        const waypoints = routePins.slice(1, -1).map((p) => ({ location: { lat: p.lat, lng: p.lng }, stopover: true }));
        dirServiceRef.current.route({
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false
        }, (result, status) => {
          if (status === "OK") {
            dirRendererRef.current.setDirections(result);
            if (onRoutePoints && result.routes && result.routes[0]) {
              const routePoints = [];
              result.routes[0].legs.forEach((leg) => {
                leg.steps.forEach((step) => {
                  step.path.forEach((pt) => {
                    routePoints.push({ lat: pt.lat(), lng: pt.lng() });
                  });
                });
              });
              onRoutePoints(routePoints);
            }
          } else {
            dirRendererRef.current.setDirections({ routes: [] });
            if (polyRef.current) {
              polyRef.current.setPath(pins.map((p) => ({ lat: p.lat, lng: p.lng })));
            }
            onRoutePoints && onRoutePoints([]);
          }
        });
      } else {
        if (dirRendererRef.current) dirRendererRef.current.setDirections({ routes: [] });
        if (polyRef.current) {
          polyRef.current.setPath(pins.map((p) => ({ lat: p.lat, lng: p.lng })));
        }
      }
    }, [pins, ready, linkingPhotoIdx]);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: typeof linkingPhotoIdx === "number" ? "TAP A PIN TO LINK PHOTO" : "ROUTE MAP \u2014 TAP TO ADD PINS" }),
        pins.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setPins([]), style: { background: "none", border: "none", cursor: "pointer", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.red, fontWeight: 600 }, children: "CLEAR ALL" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderRadius: 12, overflow: "hidden", border: typeof linkingPhotoIdx === "number" ? `2px solid ${T.copper}` : `1px solid ${T.charcoal}`, height: 220, position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: mapRef, style: { width: "100%", height: "100%" } }),
        !ready && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: T.darkCard }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 22, height: 22, border: `2px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite" } }) })
      ] }),
      pins.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: 6, display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 8, height: 8, borderRadius: "50%", background: T.green } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: "Start" }),
        pins.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, height: 1, background: T.charcoal } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 8, height: 8, borderRadius: "50%", background: T.red } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: "End" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }, children: [
          pins.length,
          " pin",
          pins.length !== 1 ? "s" : "",
          " \u2014 tap pin to remove"
        ] })
      ] })
    ] });
  }
  function RouteDetailsForm({ autoStats, onBack, onPublish, isManual, initialPhotos, isEdit, initialData, initialPins }) {
    const d = initialData || {};
    const [name, setName] = (0, import_react4.useState)(d.name || "");
    const [desc, setDesc] = (0, import_react4.useState)(d.desc || "");
    const [difficulty, setDifficulty] = (0, import_react4.useState)(d.difficulty || "Moderate");
    const [region, setRegion] = (0, import_react4.useState)(d.region || d.location || "");
    const [terrains, setTerrains] = (0, import_react4.useState)(d.terrains || []);
    const [tags, setTags] = (0, import_react4.useState)(d.tags ? d.tags.join(", ") : "");
    const [shareToFeed, setShareToFeed] = (0, import_react4.useState)(isEdit ? false : true);
    const [pins, setPins] = (0, import_react4.useState)(initialPins || []);
    const [routePhotos, setRoutePhotos] = (0, import_react4.useState)(initialPhotos || []);
    const routePhotoRef = (0, import_react4.useRef)(null);
    const [manualDistance, setManualDistance] = (0, import_react4.useState)(d.distance ? d.distance.replace(/[^0-9.]/g, "") : "");
    const [manualTime, setManualTime] = (0, import_react4.useState)(d.time || "");
    const [manualElevGain, setManualElevGain] = (0, import_react4.useState)(d.elevation ? d.elevation.replace(/[^0-9,]/g, "").replace(/,/g, "") : "");
    const [manualMaxElev, setManualMaxElev] = (0, import_react4.useState)("");
    const [manualLocation, setManualLocation] = (0, import_react4.useState)(d.location || "");
    const extractGPS = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const view = new DataView(e.target.result);
          if (view.getUint16(0) !== 65496) {
            resolve(null);
            return;
          }
          let offset = 2;
          while (offset < view.byteLength) {
            const marker = view.getUint16(offset);
            if (marker === 65505) {
              const exifData = view.buffer.slice(offset + 10);
              const dv = new DataView(exifData);
              const le = dv.getUint16(0) === 18761;
              const ifdOffset = dv.getUint32(4, le);
              const entries = dv.getUint16(ifdOffset, le);
              let gpsOffset = null;
              for (let i = 0; i < entries; i++) {
                const tag = dv.getUint16(ifdOffset + 2 + i * 12, le);
                if (tag === 34853) {
                  gpsOffset = dv.getUint32(ifdOffset + 2 + i * 12 + 8, le);
                  break;
                }
              }
              if (!gpsOffset) {
                resolve(null);
                return;
              }
              const gpsEntries = dv.getUint16(gpsOffset, le);
              let latRef = "N", lngRef = "E", latVals = null, lngVals = null;
              const readRational = (off) => dv.getUint32(off, le) / dv.getUint32(off + 4, le);
              const readDMS = (valOff) => {
                const d2 = readRational(valOff);
                const m = readRational(valOff + 8);
                const s = readRational(valOff + 16);
                return d2 + m / 60 + s / 3600;
              };
              for (let i = 0; i < gpsEntries; i++) {
                const gTag = dv.getUint16(gpsOffset + 2 + i * 12, le);
                const gValOff = dv.getUint32(gpsOffset + 2 + i * 12 + 8, le);
                if (gTag === 1) latRef = String.fromCharCode(dv.getUint8(gpsOffset + 2 + i * 12 + 8));
                if (gTag === 2) latVals = gValOff;
                if (gTag === 3) lngRef = String.fromCharCode(dv.getUint8(gpsOffset + 2 + i * 12 + 8));
                if (gTag === 4) lngVals = gValOff;
              }
              if (latVals && lngVals) {
                let lat = readDMS(latVals);
                let lng = readDMS(lngVals);
                if (latRef === "S") lat = -lat;
                if (lngRef === "W") lng = -lng;
                resolve({ lat, lng });
                return;
              }
            }
            offset += 2 + view.getUint16(offset + 2);
          }
        } catch (e2) {
        }
        resolve(null);
      };
      reader.readAsArrayBuffer(file.slice(0, 128 * 1024));
    });
    const handleRoutePhoto = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          const blobUrl = URL.createObjectURL(file);
          setRoutePhotos((prev) => [...prev, { url: blobUrl, name: file.name, type: "video" }]);
        } else {
          const gps = await extractGPS(file);
          const photoReader = new FileReader();
          photoReader.onload = (ev) => {
            const photo = { url: ev.target.result, name: file.name, type: "image", ...gps || {} };
            setRoutePhotos((prev) => [...prev, photo]);
            if (gps) {
              setPins((prev) => [...prev, { lat: gps.lat, lng: gps.lng, photo: ev.target.result, label: file.name }]);
            }
          };
          photoReader.readAsDataURL(file);
        }
      }
      e.target.value = "";
    };
    const [roadPoints, setRoadPoints] = (0, import_react4.useState)([]);
    const [linkingPhotoIdx, setLinkingPhotoIdx] = (0, import_react4.useState)(null);
    const linkPhotoToPin = (pinIdx) => {
      if (linkingPhotoIdx === null) return;
      const photo = routePhotos[linkingPhotoIdx];
      if (!photo) return;
      setPins((prev) => prev.map((p, i) => i === pinIdx ? { ...p, photo: photo.url, label: photo.name } : p));
      const pin = pins[pinIdx];
      if (pin) {
        setRoutePhotos((prev) => prev.map((p, i) => i === linkingPhotoIdx ? { ...p, lat: pin.lat, lng: pin.lng, pinIdx } : p));
      }
      setLinkingPhotoIdx(null);
    };
    const difficulties = ["Easy", "Moderate", "Hard", "Expert"];
    const terrainOpts = ["Dirt/Gravel", "Rock/Slickrock", "Sand", "Mud", "Snow/Ice", "Mixed", "Paved"];
    const diffColor = (d2) => d2 === "Expert" ? T.red : d2 === "Hard" ? T.copper : d2 === "Moderate" ? T.tertiary : T.green;
    const toggleTerrain = (t) => {
      setTerrains((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
    };
    const handleSubmit = () => {
      if (!name.trim()) return;
      onPublish({
        name,
        desc,
        difficulty,
        region,
        terrains,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        shareToFeed,
        pins,
        photos: routePhotos,
        ...roadPoints.length > 0 ? { points: roadPoints } : {},
        ...isManual ? { distance: manualDistance, time: manualTime, elevGain: manualElevGain, maxElev: manualMaxElev, location: manualLocation } : {}
      });
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, zIndex: 300, background: T.darkBg, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onBack, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white, strokeWidth: 1.5 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }, children: isEdit ? "Edit Route" : isManual ? "Add Route" : "Trip Details" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "th-scroll", style: { flex: 1, overflowY: "auto", padding: "16px" }, children: [
        autoStats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "RECORDED DATA" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rdStatBox, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.red }, children: autoStats.distance }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: "MILES" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rdStatBox, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.white }, children: autoStats.duration }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: "TIME" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rdStatBox, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.green }, children: [
                "+",
                autoStats.elevGain.toLocaleString()
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: "ELEV GAIN (FT)" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rdStatBox, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.copper }, children: autoStats.maxSpeed }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: "MAX SPEED (MPH)" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rdStatBox, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.white }, children: autoStats.elevation.toLocaleString() }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: "MAX ELEV (FT)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "ROUTE NAME *" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Hell's Revenge Loop", style: rdInput })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "DESCRIPTION" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: desc, onChange: (e) => setDesc(e.target.value), placeholder: "Describe the trail, conditions, highlights...", rows: 3, style: { ...rdInput, resize: "vertical", fontFamily: serif } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: isManual ? "LOCATION / TRAILHEAD" : "REGION" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: isManual ? manualLocation : region, onChange: (e) => isManual ? setManualLocation(e.target.value) : setRegion(e.target.value), placeholder: "e.g. Moab, UT", style: rdInput })
        ] }),
        isManual && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoutePinMap, { pins, setPins, linkingPhotoIdx, onLinkPin: linkPhotoToPin, onRoutePoints: setRoadPoints }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "DIFFICULTY" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 8 }, children: difficulties.map((d2) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setDifficulty(d2), style: { flex: 1, padding: "10px 0", borderRadius: 8, background: difficulty === d2 ? `${diffColor(d2)}25` : T.darkCard, border: `1px solid ${difficulty === d2 ? diffColor(d2) : T.charcoal}`, cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: difficulty === d2 ? diffColor(d2) : T.tertiary, fontWeight: 600, letterSpacing: 0.5 }, children: d2.toUpperCase() }) }, d2)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "TERRAIN (SELECT ALL THAT APPLY)" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: terrainOpts.map((t) => {
            const sel = terrains.includes(t);
            return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => toggleTerrain(t), style: { padding: "8px 14px", borderRadius: 20, background: sel ? `${T.copper}25` : T.darkCard, border: `1px solid ${sel ? T.copper : T.charcoal}`, cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: sel ? T.copper : T.tertiary, fontWeight: 600, letterSpacing: 0.5 }, children: t.toUpperCase() }) }, t);
          }) })
        ] }),
        isManual && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "DISTANCE (MI)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: manualDistance, onChange: (e) => setManualDistance(e.target.value), placeholder: "0.0", type: "number", style: rdInput })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "EST. TIME" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: manualTime, onChange: (e) => setManualTime(e.target.value), placeholder: "e.g. 3H 15M", style: rdInput })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "ELEVATION GAIN (FT)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: manualElevGain, onChange: (e) => setManualElevGain(e.target.value), placeholder: "0", type: "number", style: rdInput })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "MAX ELEVATION (FT)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: manualMaxElev, onChange: (e) => setManualMaxElev(e.target.value), placeholder: "0", type: "number", style: rdInput })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "PHOTOS" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: routePhotoRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: handleRoutePhoto, style: { display: "none" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }, children: [
            routePhotos.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", outline: linkingPhotoIdx === i ? `2px solid ${T.copper}` : "none", outlineOffset: 2 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } }),
              p.lat ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: 2, left: 2, background: `${T.darkBg}CC`, borderRadius: 4, padding: "1px 4px", display: "flex", alignItems: "center", gap: 2 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 8, color: T.green }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 7, color: T.green }, children: "PINNED" })
              ] }) : pins.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setLinkingPhotoIdx(linkingPhotoIdx === i ? null : i), style: { position: "absolute", bottom: 2, left: 2, background: linkingPhotoIdx === i ? T.copper : `${T.copper}DD`, borderRadius: 4, padding: "2px 5px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 8, color: T.white }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 7, color: T.white }, children: linkingPhotoIdx === i ? "TAP PIN" : "LINK PIN" })
              ] }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setRoutePhotos((prev) => prev.filter((_, idx) => idx !== i)), style: { position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: `${T.darkBg}CC`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 10, color: T.white }) })
            ] }, i)),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => routePhotoRef.current && routePhotoRef.current.click(), style: { width: 72, height: 72, borderRadius: 8, background: T.darkCard, border: `1px dashed ${T.charcoal}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 18, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.tertiary, letterSpacing: 0.5 }, children: "ADD" })
            ] })
          ] }),
          linkingPhotoIdx !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.copper}15`, border: `1px solid ${T.copper}30`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 14, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, flex: 1 }, children: "Tap a pin on the map to link this photo" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setLinkingPhotoIdx(null), style: { background: "none", border: "none", cursor: "pointer", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
          ] }),
          routePhotos.length > 0 && pins.length > 0 && linkingPhotoIdx === null && routePhotos.some((p) => !p.lat) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }, children: 'Tap "Link Pin" on a photo, then tap a map pin to associate them' })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: rdLabel, children: "TAGS (COMMA SEPARATED)" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: tags, onChange: (e) => setTags(e.target.value), placeholder: "e.g. scenic, technical, family-friendly", style: rdInput })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${T.charcoal}`, marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: "Share to Feed" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary }, children: "Post this route to the community feed" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShareToFeed(!shareToFeed), style: { width: 48, height: 28, borderRadius: 14, background: shareToFeed ? T.green : T.charcoal, border: `1px solid ${shareToFeed ? T.green : T.tertiary}40`, cursor: "pointer", position: "relative", transition: "background 0.2s" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 22, height: 22, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: shareToFeed ? 23 : 2, transition: "left 0.2s" } }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "12px 16px", background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: handleSubmit, disabled: !name.trim(), style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 8, background: name.trim() ? T.green : T.charcoal, border: "none", cursor: name.trim() ? "pointer" : "default", opacity: name.trim() ? 1 : 0.5 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 16, color: T.white }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: isEdit ? "SAVE CHANGES" : isManual ? "ADD ROUTE" : "PUBLISH ROUTE" })
      ] }) })
    ] });
  }
  function RoutesScreen({ onRecordRoute, onManualEntry, userRoutes, onUpdateRoute, savedRoutes, onSaveRoute, onUnsaveRoute, onOpenDM, onAddFeedPost, onStartNav }) {
    const seedRoutes = [
      { name: "The Timberline Traverse", difficulty: "Hard", distance: "64.2 MI", time: "5H 30M", elevation: "+4,200 FT", rating: 4.8, reviews: 142, desc: "Scenic high-altitude crawl across the eastern slopes of Mt. Hood.", location: "Mt. Hood, OR", terrains: ["Dirt/Gravel", "Rock/Slickrock"], tags: ["scenic", "challenging"] },
      { name: "Hell's Revenge Loop", difficulty: "Expert", distance: "6.5 MI", time: "2H 45M", elevation: "+1,800 FT", rating: 4.9, reviews: 312, desc: "Iconic slickrock trail in Moab with steep climbs and ledges.", location: "Moab, UT", terrains: ["Rock/Slickrock"], tags: ["technical", "iconic"] },
      { name: "Eagle Rim Loop", difficulty: "Moderate", distance: "42.5 MI", time: "3H 15M", elevation: "+2,100 FT", rating: 4.6, reviews: 89, desc: "Desert canyon walls and sweeping ridgeline views.", location: "Sedona, AZ", terrains: ["Dirt/Gravel", "Sand"], tags: ["scenic", "family-friendly"] },
      { name: "Shadow Peak Traverse", difficulty: "Hard", distance: "38.0 MI", time: "4H 00M", elevation: "+3,600 FT", rating: 4.7, reviews: 67, desc: "Technical grade 7 route through volcanic terrain.", location: "Lassen, CA", terrains: ["Rock/Slickrock", "Mixed"], tags: ["technical", "volcanic"] }
    ];
    const routes = [...userRoutes || [], ...seedRoutes];
    const [expandedRoute, setExpandedRoute] = (0, import_react4.useState)(null);
    const [routeTab, setRouteTab] = (0, import_react4.useState)("all");
    const [routeShareMenu, setRouteShareMenu] = (0, import_react4.useState)(null);
    const [editingRoute, setEditingRoute] = (0, import_react4.useState)(null);
    const diffColor = (d) => d === "Expert" ? T.red : d === "Hard" ? T.copper : d === "Moderate" ? T.tertiary : T.green;
    const displayRoutes = routeTab === "saved" ? savedRoutes || [] : routes;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px", display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 16, color: T.tertiary }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, marginLeft: 8 }, children: "Search trails, regions..." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: onManualEntry, style: { display: "flex", alignItems: "center", gap: 5, padding: "10px 12px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14, color: T.copper }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 700, letterSpacing: 0.5 }, children: "ADD" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: onRecordRoute, style: { display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "RECORD" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "0 16px 16px", borderRadius: 12, overflow: "hidden", background: T.charcoal, position: "relative", height: 200, display: "flex", alignItems: "flex-end" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, background: `linear-gradient(180deg, ${T.charcoal}00 40%, ${T.charcoal} 100%)` } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mountain, { size: 80, color: T.tertiary, strokeWidth: 0.3, style: { opacity: 0.15 } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", padding: 16, width: "100%", boxSizing: "border-box" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.red, letterSpacing: 2, fontWeight: 600 }, children: "FEATURED ROUTE" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 22, color: T.white, margin: "4px 0 8px", fontWeight: 700 }, children: "The Timberline Traverse" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper }, children: "64.2 MI" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper }, children: "5H 30M" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper }, children: "+4,200 FT" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 0, margin: "0 16px 12px", background: T.darkCard, borderRadius: 8, overflow: "hidden" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
          setRouteTab("all");
          setExpandedRoute(null);
        }, style: { flex: 1, padding: "10px 0", background: routeTab === "all" ? T.charcoal : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderBottom: routeTab === "all" ? `2px solid ${T.copper}` : "2px solid transparent" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { size: 13, color: routeTab === "all" ? T.copper : T.tertiary }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: routeTab === "all" ? T.white : T.tertiary, fontWeight: 600, letterSpacing: 0.5 }, children: "ALL ROUTES" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
          setRouteTab("saved");
          setExpandedRoute(null);
        }, style: { flex: 1, padding: "10px 0", background: routeTab === "saved" ? T.charcoal : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderBottom: routeTab === "saved" ? `2px solid ${T.copper}` : "2px solid transparent", position: "relative" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { size: 13, color: routeTab === "saved" ? T.copper : T.tertiary }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: routeTab === "saved" ? T.white : T.tertiary, fontWeight: 600, letterSpacing: 0.5 }, children: "SAVED" }),
          savedRoutes && savedRoutes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { position: "absolute", top: 5, right: "18%", width: 16, height: 16, borderRadius: "50%", background: T.red, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, fontWeight: 700 }, children: savedRoutes.length }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px" }, children: [
        routeTab === "saved" && (!savedRoutes || savedRoutes.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", padding: "40px 20px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { size: 36, color: T.tertiary, strokeWidth: 1, style: { opacity: 0.3, marginBottom: 12 } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 6px" }, children: "No saved routes yet" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, opacity: 0.6 }, children: "Save routes from the feed or routes list to build your bucket list" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: displayRoutes.map((r, i) => {
          const isExp = expandedRoute === i;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => setExpandedRoute(isExp ? null : i), style: { ...cardStyle, cursor: "pointer", overflow: "hidden" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 16 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 16, color: T.white, margin: 0, fontWeight: 600, flex: 1 }, children: r.name }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: diffColor(r.difficulty), background: `${diffColor(r.difficulty)}20`, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 }, children: r.difficulty.toUpperCase() }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14, color: T.tertiary, style: { transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" } })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 12px", lineHeight: 1.5 }, children: r.desc }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 16 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "DISTANCE" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600 }, children: r.distance })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "EST. TIME" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600 }, children: r.time })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "ELEVATION" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600 }, children: r.elevation })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: r.rating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { size: 12, color: T.copper, fill: T.copper }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }, children: r.rating }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: [
                    "(",
                    r.reviews,
                    ")"
                  ] })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, fontStyle: "italic" }, children: "New" }) })
              ] })
            ] }),
            isExp && (() => {
              const rPins = r.pins || [];
              const rPhotos = r.photos || [];
              const rPoints = r.points || [];
              const hasMap = rPins.length > 0 || rPoints.length > 0;
              return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderTop: `1px solid ${T.charcoal}`, padding: 16 }, children: [
                hasMap && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "ROUTE MAP" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: "100%", height: 180, borderRadius: 10, overflow: "hidden", position: "relative", background: T.charcoal }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteMapPreview, { pins: rPins, points: rPoints, photos: rPhotos }) })
                ] }),
                r.location && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 13, color: T.copper }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.warmStone }, children: r.location })
                ] }),
                r.terrains && r.terrains.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "TERRAIN" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: r.terrains.map((t, ti) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, background: `${T.copper}18`, padding: "4px 10px", borderRadius: 12, letterSpacing: 0.5 }, children: t }, ti)) })
                ] }),
                r.tags && r.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "TAGS" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: r.tags.map((t, ti) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, background: T.charcoal, padding: "4px 10px", borderRadius: 12, letterSpacing: 0.5 }, children: t }, ti)) })
                ] }),
                rPhotos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }, children: "PHOTOS" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }, children: rPhotos.map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url || p, alt: "", style: { width: 80, height: 80, borderRadius: 8, objectFit: "cover", flexShrink: 0 } }, pi)) })
                ] }),
                (r.author || r.savedFrom) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, paddingTop: 8, borderTop: `1px solid ${T.charcoal}` }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 22, height: 22, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white }, children: (r.author || r.savedFrom)[0] }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600 }, children: [
                    "@",
                    r.author || r.savedFrom
                  ] }),
                  r.savedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }, children: [
                    "Saved ",
                    formatPostTime(r.savedAt)
                  ] }),
                  !r.savedAt && r.createdAt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }, children: formatPostTime(r.createdAt) })
                ] }),
                (() => {
                  const startPin = rPins.length > 0 ? rPins[0] : null;
                  const endPin = rPins.length > 1 ? rPins[rPins.length - 1] : null;
                  const isSaved = savedRoutes && savedRoutes.some((sr) => sr.id === r.id || sr.name === r.name);
                  const showMenu = routeShareMenu === (r.id || i);
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6, marginTop: 12 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                        e.stopPropagation();
                        if (startPin) {
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${startPin.lat},${startPin.lng}&travelmode=driving`, "_blank");
                        }
                      }, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.green, border: "none", cursor: startPin ? "pointer" : "default", opacity: startPin ? 1 : 0.4 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 13, color: T.white }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }, children: "DIRECTIONS" })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                        e.stopPropagation();
                        if (startPin && endPin && onStartNav) {
                          onStartNav({ name: r.name, pins: rPins, points: rPoints, distance: r.distance, time: r.time, elevation: r.elevation });
                        }
                      }, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.copper, border: "none", cursor: startPin && endPin ? "pointer" : "default", opacity: startPin && endPin ? 1 : 0.4 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 13, color: T.white }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }, children: "START ROUTE" })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                        e.stopPropagation();
                        setRouteShareMenu(showMenu ? null : r.id || i);
                      }, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.charcoal, border: `1px solid ${T.tertiary}30`, cursor: "pointer" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 13, color: T.white }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }, children: "SHARE / SAVE" })
                      ] }),
                      r.author === "KyleLPO" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: (e) => {
                        e.stopPropagation();
                        setEditingRoute(r);
                      }, style: { padding: "10px 12px", borderRadius: 8, background: T.charcoal, border: `1px solid ${T.tertiary}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 13, color: T.copper }) })
                    ] }),
                    showMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: "100%", right: 0, marginBottom: 6, background: T.darkCard, border: `1px solid ${T.charcoal}`, borderRadius: 10, padding: "6px 0", minWidth: 180, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                        e.stopPropagation();
                        onOpenDM && onOpenDM(null, null, { type: "route", title: r.name, distance: r.distance, duration: r.time });
                        setRouteShareMenu(null);
                      }, style: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 14, color: T.copper }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: "Send in DM" })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                        e.stopPropagation();
                        if (onAddFeedPost) {
                          onAddFeedPost({ id: "shared_route_" + Date.now(), type: "ROUTES", user: "KyleLPO", initial: "K", time: Date.now(), title: r.name, body: r.desc || null, distance: r.distance, duration: r.time, badge: null, verified: 0, likes: 0, comments: 0, difficulty: r.difficulty, elevation: r.elevation || "\u2014", location: r.location || "", terrains: r.terrains || [], tags: r.tags || [], photos: rPhotos, pins: rPins });
                        }
                        setRouteShareMenu(null);
                      }, style: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 14, color: T.copper }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: "Share to Feed" })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "2px 10px" } }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                        e.stopPropagation();
                        if (isSaved) {
                          onUnsaveRoute && onUnsaveRoute(r.id || r.name);
                        } else {
                          onSaveRoute && onSaveRoute({ id: r.id || "seed_" + i, name: r.name, desc: r.desc || "", difficulty: r.difficulty, distance: r.distance, time: r.time, elevation: r.elevation || "\u2014", location: r.location || "", terrains: r.terrains || [], tags: r.tags || [], pins: rPins, photos: rPhotos, rating: r.rating, reviews: r.reviews, savedFrom: r.author || "Community", savedAt: Date.now() });
                        }
                        setRouteShareMenu(null);
                      }, style: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { size: 14, color: isSaved ? T.red : T.copper, fill: isSaved ? T.red : "none" }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: isSaved ? T.red : T.white }, children: isSaved ? "Unsave Route" : "Save for Later" })
                      ] })
                    ] })
                  ] });
                })()
              ] });
            })()
          ] }, i);
        }) })
      ] }),
      editingRoute && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        RouteDetailsForm,
        {
          isManual: true,
          isEdit: true,
          initialData: editingRoute,
          initialPhotos: editingRoute.photos || [],
          initialPins: editingRoute.pins || [],
          onBack: () => setEditingRoute(null),
          onPublish: (updatedData) => {
            if (onUpdateRoute) {
              onUpdateRoute(editingRoute.id, {
                name: updatedData.name,
                desc: updatedData.desc,
                difficulty: updatedData.difficulty,
                location: updatedData.location || updatedData.region || editingRoute.location,
                terrains: updatedData.terrains,
                tags: updatedData.tags,
                pins: updatedData.pins,
                photos: updatedData.photos,
                ...updatedData.distance ? { distance: updatedData.distance + " MI" } : {},
                ...updatedData.time ? { time: updatedData.time } : {},
                ...updatedData.elevGain ? { elevation: "+" + Number(updatedData.elevGain).toLocaleString() + " FT" } : {},
                editedAt: Date.now()
              });
            }
            setEditingRoute(null);
          }
        }
      )
    ] });
  }
  function BuildsScreen({ onViewUser, userBuilds }) {
    const [filter, setFilter] = (0, import_react4.useState)("all");
    const [search, setSearch] = (0, import_react4.useState)("");
    const [expandedBuild, setExpandedBuild] = (0, import_react4.useState)(null);
    const [carouselImages, setCarouselImages] = (0, import_react4.useState)(null);
    const [carouselIndex, setCarouselIndex] = (0, import_react4.useState)(0);
    const [likedBuilds, setLikedBuilds] = (0, import_react4.useState)({});
    const [likeBonuses, setLikeBonuses] = (0, import_react4.useState)({});
    const toggleLikeBuild = (id) => {
      const wasLiked = !!likedBuilds[id];
      setLikedBuilds((prev) => ({ ...prev, [id]: !wasLiked }));
      setLikeBonuses((prev) => ({ ...prev, [id]: wasLiked ? (prev[id] || 0) - 1 : (prev[id] || 0) + 1 }));
    };
    const getBuildLikes = (b) => b.likes + (likeBonuses[b.id] || 0);
    const collectBuildImagesGallery = (bd) => {
      const imgs = [];
      if (bd.mainPhotos) bd.mainPhotos.forEach((p) => imgs.push(p.url));
      [bd.suspension, bd.tires, bd.wheels, bd.bumpers, bd.armor, bd.lighting, bd.rack, bd.winch, bd.otherMods].forEach((mod) => {
        if (mod && mod.photo) mod.photo.forEach((p) => imgs.push(p.url));
      });
      if (bd.camperPhoto) bd.camperPhoto.forEach((p) => imgs.push(p.url));
      return imgs;
    };
    const openGalleryCarousel = (build, startIdx) => {
      const imgs = [];
      if (build.buildData) {
        imgs.push(...collectBuildImagesGallery(build.buildData));
      } else if (build.image) {
        imgs.push(build.image);
      }
      if (imgs.length > 0) {
        setCarouselImages(imgs);
        setCarouselIndex(startIdx || 0);
      }
    };
    const defaultBuilds = [
      { id: 1, name: "THE HIGHLANDER", owner: "Kyle Morrison", handle: "@KyleLPO", initial: "K", year: 2022, make: "Toyota", model: "Tundra", tags: ["V8 OVERLAND", "CLASS 4 READY"], suspension: 'Icon Stage 3, 2.5" lift', tires: "BFG KO2 35x12.5R17", bumpers: "CBI front & rear", miles: "2,482", elevation: "84K ft", routes: 34, hasCamper: true, camperMake: "Four Wheel Campers", camperModel: "Fleet Flatbed", isMine: true, isFollowing: true, likes: 312 },
      { id: 2, name: "PROJECT VULCAN", owner: "Overland Expert", handle: "@Overland_Expert", initial: "O", year: 2022, make: "Toyota", model: "Tacoma", tags: ["TACOMA 22", '35" TIRES'], suspension: "Fox 2.5 Factory Race Series", tires: 'Toyo Open Country M/T 35"', bumpers: "Pelfreybilt front bumper", miles: "3,800", elevation: "112K ft", routes: 56, hasCamper: false, isMine: false, isFollowing: true, likes: 540 },
      { id: 3, name: "DESERT HAWK", owner: "Kyle Morrison", handle: "@KyleLPO", initial: "K", year: 2019, make: "Jeep", model: "Gladiator", tags: ["TRAIL RATED", "EXPO READY"], suspension: 'AEV 3.5" DualSport', tires: 'Falken Wildpeak A/T3W 37"', bumpers: "AEV front & rear", miles: "1,120", elevation: "42K ft", routes: 18, hasCamper: false, isMine: true, isFollowing: true, likes: 189 },
      { id: 4, name: "IRON MAIDEN", owner: "DesertRat 4x4", handle: "@DesertRat_4x4", initial: "D", year: 2021, make: "Ford", model: "Bronco", tags: ["SASQUATCH", "FULL ARMOR"], suspension: 'Bilstein 5100 Series, 2" lift', tires: 'Nitto Ridge Grappler 37"', bumpers: "ARB Hoopless front", miles: "1,950", elevation: "56K ft", routes: 28, hasCamper: false, isMine: false, isFollowing: true, likes: 273 },
      { id: 5, name: "GHOST RUNNER", owner: "Sierra Tactical", handle: "@Sierra_Tactical", initial: "S", year: 2023, make: "Lexus", model: "GX 550", tags: ["LUXURY OVERLAND", "AIR SUSPENSION"], suspension: 'Ironman Foam Cell Pro, 2" lift', tires: 'BFG Trail Terrain 33"', bumpers: "RCI Rock Armor", miles: "980", elevation: "38K ft", routes: 12, hasCamper: true, camperMake: "Go Fast Campers", camperModel: "V2", isMine: false, isFollowing: false, likes: 421 },
      { id: 6, name: "MUD WITCH", owner: "TrailBoss_88", handle: "@TrailBoss_88", initial: "T", year: 2020, make: "Toyota", model: "4Runner TRD Pro", tags: ["CRAWL RIG", "LOCKED"], suspension: "King 2.5 Extended Travel", tires: 'Mickey Thompson Baja Boss 35"', bumpers: "C4 Fabrication Lo-Pro", miles: "4,200", elevation: "132K ft", routes: 72, hasCamper: false, isMine: false, isFollowing: false, likes: 687 },
      { id: 7, name: "RIDGE REAPER", owner: "Nomad Queen", handle: "@Nomad_Queen", initial: "N", year: 2024, make: "Land Rover", model: "Defender 110", tags: ["EXPEDITION", "ROOF TENT"], suspension: 'Old Man Emu BP-51, 2" lift', tires: 'Cooper Discoverer STT Pro 33"', bumpers: "Terrafirma front winch bumper", miles: "1,640", elevation: "68K ft", routes: 24, hasCamper: true, camperMake: "Alu-Cab", camperModel: "Canopy Camper", isMine: false, isFollowing: false, likes: 358 },
      { id: 8, name: "BLACK MAMBA", owner: "Peak Finder", handle: "@Peak_Finder", initial: "P", year: 2023, make: "Ram", model: "2500 Power Wagon", tags: ["HEAVY DUTY", "WINCH READY"], suspension: 'Carli Backcountry 2.0, 3" lift', tires: 'Toyo Open Country R/T 37"', bumpers: "Expedition One front & rear", miles: "2,870", elevation: "94K ft", routes: 41, hasCamper: true, camperMake: "Bundutop", camperModel: "Explorer", isMine: false, isFollowing: false, likes: 512 }
    ];
    const mappedUserBuilds = (userBuilds || []).map((b, i) => ({
      id: 100 + i,
      name: b.name || "UNNAMED BUILD",
      owner: "Kyle Morrison",
      handle: "@KyleLPO",
      initial: "K",
      year: parseInt(b.year) || 2024,
      make: b.make || "",
      model: b.model || "",
      tags: b.tags || [],
      suspension: b.buildData && b.buildData.suspension && b.buildData.suspension.value || "",
      tires: b.buildData && b.buildData.tires && b.buildData.tires.value || "",
      bumpers: b.buildData && b.buildData.bumpers && b.buildData.bumpers.value || "",
      miles: "0",
      elevation: "0 ft",
      routes: 0,
      hasCamper: !!(b.camperMake || b.camperModel),
      camperMake: b.camperMake || "",
      camperModel: b.camperModel || "",
      isMine: true,
      isFollowing: true,
      likes: 0,
      image: b.heroImg || null,
      buildData: b.buildData || null
    }));
    const allBuilds = [...defaultBuilds, ...mappedUserBuilds];
    const filters = [
      { key: "all", label: "ALL BUILDS", icon: Globe },
      { key: "mine", label: "MY BUILDS", icon: Wrench },
      { key: "following", label: "FOLLOWING", icon: Users }
    ];
    const filtered = allBuilds.filter((b) => {
      if (filter === "mine" && !b.isMine) return false;
      if (filter === "following" && !b.isFollowing) return false;
      if (search) {
        const q = search.toLowerCase();
        return b.name.toLowerCase().includes(q) || b.owner.toLowerCase().includes(q) || b.make.toLowerCase().includes(q) || b.model.toLowerCase().includes(q) || b.tags.some((t) => t.toLowerCase().includes(q));
      }
      return true;
    }).sort((a, b) => getBuildLikes(b) - getBuildLikes(a));
    const gradients = [
      `linear-gradient(135deg, ${T.charcoal} 0%, ${T.red}20 100%)`,
      `linear-gradient(135deg, ${T.charcoal} 0%, ${T.copper}20 100%)`,
      `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}25 100%)`,
      `linear-gradient(135deg, ${T.charcoal} 0%, ${T.green}20 100%)`
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
      carouselImages && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageCarousel, { images: carouselImages, startIndex: carouselIndex, onClose: () => setCarouselImages(null) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px 16px 0" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 22, color: T.white, margin: "0 0 4px", fontWeight: 700 }, children: "Build Gallery" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 16px" }, children: "Explore rigs from the Trailhead community" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", marginBottom: 14 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 16, color: T.tertiary, style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search by name, make, model, owner...",
              style: { width: "100%", boxSizing: "border-box", padding: "12px 14px 12px 38px", borderRadius: 10, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none" }
            }
          ),
          search && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setSearch(""), style: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginBottom: 16 }, children: filters.map((f) => {
          const active = filter === f.key;
          const Icon2 = f.icon;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setFilter(f.key), style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 8px", borderRadius: 8, background: active ? `${T.red}18` : T.darkCard, border: active ? `1px solid ${T.red}40` : `1px solid transparent`, cursor: "pointer" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon2, { size: 13, color: active ? T.red : T.tertiary }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: active ? T.red : T.tertiary, letterSpacing: 1, fontWeight: 600 }, children: f.label })
          ] }, f.key);
        }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px", marginBottom: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5 }, children: [
        filtered.length,
        " BUILD",
        filtered.length !== 1 ? "S" : "",
        " FOUND"
      ] }) }),
      filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "40px 16px", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 40, color: T.tertiary, strokeWidth: 0.8, style: { opacity: 0.3, marginBottom: 12 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 14, color: T.tertiary, margin: 0 }, children: "No builds match your search" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 10, padding: "0 16px" }, children: filtered.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, overflow: "hidden" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => setExpandedBuild(expandedBuild === b.id ? null : b.id), style: { cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { height: 120, background: b.image ? "none" : gradients[i % gradients.length], position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }, children: [
            b.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: b.image, alt: "", onClick: (e) => {
                e.stopPropagation();
                openGalleryCarousel(b, 0);
              }, style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(transparent 20%, rgba(0,0,0,0.75))" } })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 60, color: T.tertiary, strokeWidth: 0.2, style: { opacity: 0.06 } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6, background: `${T.darkBg}CC`, padding: "5px 10px 5px 5px", borderRadius: 20 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 22, height: 22, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white }, children: b.initial }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.white }, children: b.owner })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4, background: `${T.darkBg}CC`, padding: "5px 10px", borderRadius: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 11, color: T.red, fill: likedBuilds[b.id] ? T.red : "none" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.white }, children: getBuildLikes(b) })
            ] }),
            b.hasCamper && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 40, right: 10, display: "flex", alignItems: "center", gap: 4, background: `${T.copper}30`, padding: "4px 8px", borderRadius: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { size: 10, color: T.copper }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 0.5 }, children: "CAMPER" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", padding: "0 12px 10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 5, marginBottom: 4 }, children: b.tags.map((tag, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.warmBg, background: "#3D3D3A", padding: "3px 6px", borderRadius: 3, letterSpacing: 0.8 }, children: tag }, j)) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 22, color: T.warmBg, margin: 0, fontWeight: 700, letterSpacing: 1 }, children: b.name }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary }, children: [
                b.year,
                " ",
                b.make,
                " ",
                b.model
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${T.charcoal}` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "10px 12px", textAlign: "center", borderRight: `1px solid ${T.charcoal}` }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 1 }, children: "TRAIL MILES" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }, children: b.miles })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "10px 12px", textAlign: "center", borderRight: `1px solid ${T.charcoal}` }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 1 }, children: "ELEVATION" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }, children: b.elevation })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "10px 12px", textAlign: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 1 }, children: "ROUTES" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }, children: b.routes })
            ] })
          ] })
        ] }),
        expandedBuild === b.id && (() => {
          const bd = b.buildData;
          const specRow = (label, val, mod) => {
            const text = mod ? mod.value || "" : val || "";
            if (!text) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.charcoal}20` }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, flexShrink: 0, minWidth: 70 }, children: label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, textAlign: "right" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.white }, children: text }),
                mod && mod.photo && mod.photo.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: mod.photo[0].url, alt: "", onClick: (e) => {
                  e.stopPropagation();
                  openGalleryCarousel(b, 0);
                }, style: { width: 36, height: 36, borderRadius: 6, objectFit: "cover", marginLeft: 8, verticalAlign: "middle", cursor: "pointer" } }),
                mod && mod.link && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: ensureUrl(mod.link), target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), style: { fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 9 }),
                  " View Product"
                ] }) })
              ] })
            ] });
          };
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderTop: `1px solid ${T.charcoal}`, padding: "14px 14px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 10 }, children: "BUILD SPECS" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column" }, children: bd ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              specRow("Suspension", null, bd.suspension),
              specRow("Tires", null, bd.tires),
              specRow("Wheels", null, bd.wheels),
              specRow("Bumpers", null, bd.bumpers),
              specRow("Armor", null, bd.armor),
              specRow("Lighting", null, bd.lighting),
              specRow("Rack/Storage", null, bd.rack),
              specRow("Winch", null, bd.winch),
              specRow("Other Mods", null, bd.otherMods)
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              specRow("Suspension", b.suspension),
              specRow("Tires", b.tires),
              specRow("Bumpers", b.bumpers)
            ] }) }),
            b.hasCamper && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "12px 0" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { size: 12, color: T.copper }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "CAMPER" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: "Setup" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }, children: [
                  b.camperMake,
                  " ",
                  b.camperModel
                ] })
              ] }),
              bd && bd.camperPhoto && bd.camperPhoto.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginTop: 6 }, children: bd.camperPhoto.map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", onClick: (e) => {
                e.stopPropagation();
                openGalleryCarousel(b, 0);
              }, style: { width: 56, height: 56, borderRadius: 6, objectFit: "cover", cursor: "pointer" } }, pi)) }),
              bd && bd.camperLink && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: ensureUrl(bd.camperLink), target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), style: { fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 9 }),
                " View Product"
              ] }) })
            ] }),
            bd && bd.mainPhotos && bd.mainPhotos.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "12px 0" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, display: "block", marginBottom: 8 }, children: "MORE PHOTOS" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }, children: bd.mainPhotos.slice(1).map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", onClick: (e) => {
                e.stopPropagation();
                openGalleryCarousel(b, pi + 1);
              }, style: { width: 72, height: 72, borderRadius: 8, objectFit: "cover", flexShrink: 0, cursor: "pointer" } }, pi)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "12px 0" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                e.stopPropagation();
                onViewUser && onViewUser(b.handle.replace("@", ""));
              }, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, background: T.charcoal, border: "none", cursor: "pointer" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14, color: T.white }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "VIEW PROFILE" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                e.stopPropagation();
                toggleLikeBuild(b.id);
              }, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, background: likedBuilds[b.id] ? `${T.red}30` : `${T.red}18`, border: `1px solid ${likedBuilds[b.id] ? T.red + "60" : T.red + "30"}`, cursor: "pointer", transition: "all 0.2s" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 14, color: T.red, fill: likedBuilds[b.id] ? T.red : "none" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.red, fontWeight: 600, letterSpacing: 0.5 }, children: likedBuilds[b.id] ? "LIKED" : "LIKE BUILD" })
              ] })
            ] })
          ] });
        })()
      ] }, b.id)) })
    ] });
  }
  var BOUNTY_FORM_TEMPLATES = {
    "Gear Review": {
      description: "Write a structured gear review for the overlanding community. Fill out each section below \u2014 formatting is pre-set for optimal readability.",
      sections: [
        { id: "title", label: "Review Title", type: "h1", placeholder: "e.g. Recovery Board Showdown: MAXTRAX vs ARB vs X-Bull", required: true },
        { id: "hero_image", label: "Hero Image", type: "hero_image", placeholder: "This image appears as the header banner when posted to the forum", required: true },
        { id: "intro", label: "Introduction", type: "p", placeholder: "Set the scene \u2014 what prompted this review? What are you comparing and why does it matter for overlanders?", required: true },
        { id: "gear_overview", label: "Gear Overview", type: "h2", fixed: true, value: "Gear Overview" },
        { id: "gear_list", label: "Products Reviewed", type: "p", placeholder: "List each product with brand, model, price point, and where you purchased. Include any relevant specs (weight, dimensions, material)." },
        { id: "testing_header", label: "Testing & Field Use", type: "h2", fixed: true, value: "Testing & Field Use" },
        { id: "testing_body", label: "Testing Details", type: "p", placeholder: "Describe real-world testing conditions \u2014 trail name, terrain type, weather, vehicle weight. What scenarios did you test each product in?" },
        { id: "perf_header", label: "Performance Comparison", type: "h2", fixed: true, value: "Performance Comparison" },
        { id: "perf_body", label: "Performance Details", type: "p", placeholder: "Compare performance across products. Traction, durability, ease of use, weight, packability. Be specific with examples." },
        { id: "photos_field", label: "Photos", type: "photos", placeholder: "Upload photos of gear in use, comparison shots, detail shots", required: true, min: 3 },
        { id: "pros_header", label: "Pros & Cons", type: "h2", fixed: true, value: "Pros & Cons" },
        { id: "pros_list", label: "Pros", type: "bullet_list", icon: "check", color: T.green, placeholder: "Add a pro..." },
        { id: "cons_list", label: "Cons", type: "bullet_list", icon: "x", color: T.red, placeholder: "Add a con..." },
        { id: "verdict_header", label: "Final Verdict", type: "h2", fixed: true, value: "Final Verdict" },
        { id: "verdict_body", label: "Recommendation", type: "p", placeholder: "Who should buy what? Best for budget, best overall, best for hardcore use. Would you buy it again?" },
        { id: "rating", label: "Overall Rating", type: "rating", max: 5 }
      ]
    },
    "Route Report": {
      description: "Document a trail with enough detail that another overlander can run it confidently. Each section is pre-formatted for the route database.",
      publishTo: ["forum", "routes"],
      sections: [
        { id: "title", label: "Route Name", type: "h1", placeholder: "e.g. Black Bear Pass \u2014 Telluride to Ouray", required: true },
        { id: "hero_image", label: "Hero Image", type: "hero_image", placeholder: "Best photo of the trail \u2014 this becomes the banner when posted", required: true },
        { id: "intro", label: "Trail Summary", type: "p", placeholder: "One-paragraph overview \u2014 where is it, how long, what makes it notable? When did you run it?", required: true },
        { id: "details_header", label: "Route Details", type: "h2", fixed: true, value: "Route Details" },
        { id: "location", label: "Location / Region", type: "short", placeholder: "e.g. San Juan Mountains, CO", required: true },
        { id: "start_coords", label: "Trailhead Coordinates", type: "short", placeholder: "e.g. 37.9375\xB0 N, 107.8123\xB0 W" },
        { id: "end_coords", label: "End Point Coordinates", type: "short", placeholder: "e.g. 37.8106\xB0 N, 107.6992\xB0 W" },
        { id: "distance", label: "Distance (miles)", type: "short", placeholder: "e.g. 18.5" },
        { id: "time", label: "Estimated Time", type: "short", placeholder: "e.g. 4\u20136 hours" },
        { id: "elev_gain", label: "Elevation Gain (ft)", type: "short", placeholder: "e.g. 3200" },
        { id: "max_elev", label: "Max Elevation (ft)", type: "short", placeholder: "e.g. 12,840" },
        { id: "difficulty", label: "Difficulty Rating", type: "select", options: ["Easy \u2014 Stock friendly", "Moderate \u2014 High clearance recommended", "Hard \u2014 4WD required, some armor", "Expert \u2014 Lockers, armor, experience required"] },
        { id: "terrains", label: "Terrain Types", type: "tag_select", options: ["Rock", "Mud", "Sand", "Gravel", "Snow/Ice", "Water Crossing", "Shelf Road", "Forest", "Desert", "Alpine"] },
        { id: "map_field", label: "Route Map", type: "map_embed", description: "Map will auto-populate from your coordinates above" },
        { id: "conditions_header", label: "Current Conditions", type: "h2", fixed: true, value: "Current Trail Conditions" },
        { id: "conditions_body", label: "Conditions Detail", type: "p", placeholder: "Date of last run, surface conditions, water crossings, obstacles, closures, snow/ice. Be specific \u2014 other overlanders depend on this." },
        { id: "photos_field", label: "Trail Photos", type: "photos", placeholder: "Upload 10+ photos showing key obstacles, scenery, and trail conditions", required: true, min: 10 },
        { id: "obstacles_header", label: "Key Obstacles", type: "h2", fixed: true, value: "Key Obstacles & Bypass Info" },
        { id: "obstacles_body", label: "Obstacle Details", type: "p", placeholder: "Describe each major obstacle \u2014 location on trail, difficulty, bypass options, vehicle requirements." },
        { id: "gear_header", label: "Recommended Gear", type: "h2", fixed: true, value: "Recommended Gear & Vehicle Setup" },
        { id: "gear_body", label: "Gear Details", type: "p", placeholder: "Minimum tire size, recommended mods, recovery gear needed, comms equipment, fuel range considerations." }
      ]
    },
    "Build Feature": {
      description: "Showcase a complete build with full mod details. This will become a featured build on the platform.",
      sections: [
        { id: "title", label: "Build Name", type: "h1", placeholder: "e.g. The Desert Runner \u2014 2021 Tacoma TRD Off-Road", required: true },
        { id: "hero_image", label: "Hero Image", type: "hero_image", placeholder: "Your best build shot \u2014 this becomes the banner when posted", required: true },
        { id: "intro", label: "Build Story", type: "p", placeholder: "What's the vision behind this build? Daily driver, weekend warrior, full expedition? What drove your choices?", required: true },
        { id: "specs_header", label: "Vehicle Specs", type: "h2", fixed: true, value: "Base Vehicle & Specs" },
        { id: "specs_body", label: "Specs Detail", type: "p", placeholder: "Year, make, model, trim, engine, transmission, transfer case. Mileage at time of build." },
        { id: "mods_header", label: "Modifications", type: "h2", fixed: true, value: "Full Mod List" },
        { id: "mods_body", label: "Mod Details", type: "p", placeholder: "List every modification with brand, model, and product link where possible. Group by category (suspension, armor, lighting, etc.)." },
        { id: "photos_field", label: "Build Photos", type: "photos", placeholder: "Photos of each mod, overall build shots, before/after", required: true, min: 5 },
        { id: "cost_header", label: "Cost Breakdown", type: "h2", fixed: true, value: "Cost Breakdown" },
        { id: "cost_body", label: "Cost Details", type: "p", placeholder: "Approximate costs by category. Total investment. What was worth it, what wasn't?" },
        { id: "lessons_header", label: "Lessons Learned", type: "h2", fixed: true, value: "What I'd Do Differently" },
        { id: "lessons_body", label: "Lessons Detail", type: "p", placeholder: "Hindsight is 20/20 \u2014 what would you change? What mods exceeded expectations?" }
      ]
    },
    "Content Creation": {
      description: "Create engaging content for the community. Structure your post for maximum engagement and value.",
      sections: [
        { id: "title", label: "Content Title", type: "h1", placeholder: "e.g. Camp Kitchen Setup: From Trailhead to Table in 10 Minutes", required: true },
        { id: "hero_image", label: "Hero Image", type: "hero_image", placeholder: "Cover photo \u2014 this becomes the banner when posted to the forum", required: true },
        { id: "intro", label: "Introduction", type: "p", placeholder: "Hook the reader \u2014 what will they learn? Why should they care?", required: true },
        { id: "main_header", label: "Main Content", type: "h2", fixed: true, value: "The Breakdown" },
        { id: "main_body", label: "Main Content Body", type: "p", placeholder: "Walk through your process, gear, tips, and techniques. Be detailed and actionable." },
        { id: "photos_field", label: "Photos / Media", type: "photos", placeholder: "Upload photos, screenshots, or supporting visuals", required: true, min: 3 },
        { id: "tips_header", label: "Tips & Tricks", type: "h2", fixed: true, value: "Pro Tips" },
        { id: "tips_body", label: "Tips Detail", type: "p", placeholder: "Share specific tips, hacks, or lessons learned that others can use right away." },
        { id: "gear_header", label: "Gear List", type: "h2", fixed: true, value: "Gear List & Links" },
        { id: "gear_body", label: "Gear Details", type: "p", placeholder: "List all gear mentioned with brands, models, and links where possible." }
      ]
    }
  };
  function BountyResponseForm({ bounty, draft, onSave, onSubmit, onClose }) {
    const template = BOUNTY_FORM_TEMPLATES[bounty.category] || BOUNTY_FORM_TEMPLATES["Content Creation"];
    const [fields, setFields] = (0, import_react4.useState)(() => {
      if (draft) return draft;
      const init = {};
      template.sections.forEach((s) => {
        if (s.fixed) {
          init[s.id] = s.value;
        } else if (s.type === "photos") {
          init[s.id] = [];
        } else if (s.type === "bullet_list") {
          init[s.id] = [""];
        } else if (s.type === "tag_select") {
          init[s.id] = [];
        } else if (s.type === "map_embed") {
          init[s.id] = "";
        } else if (s.type === "hero_image") {
          init[s.id] = null;
        } else if (s.type === "rating") {
          init[s.id] = 0;
        } else {
          init[s.id] = "";
        }
      });
      return init;
    });
    const [saving, setSaving] = (0, import_react4.useState)(false);
    const [showPreview, setShowPreview] = (0, import_react4.useState)(false);
    const photoRef = (0, import_react4.useRef)(null);
    const heroRef = (0, import_react4.useRef)(null);
    const [activePhotoField, setActivePhotoField] = (0, import_react4.useState)(null);
    const updateField = (id, val) => setFields((prev) => ({ ...prev, [id]: val }));
    const handlePhotoUpload = (fieldId, e) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          const blobUrl = URL.createObjectURL(file);
          setFields((prev) => ({ ...prev, [fieldId]: [...prev[fieldId] || [], { id: Date.now() + Math.random(), url: blobUrl, name: file.name, type: "video", caption: "" }] }));
        } else {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setFields((prev) => ({ ...prev, [fieldId]: [...prev[fieldId] || [], { id: Date.now() + Math.random(), url: ev.target.result, name: file.name, type: "image", caption: "" }] }));
          };
          reader.readAsDataURL(file);
        }
      });
      if (e.target) e.target.value = "";
    };
    const removePhoto = (fieldId, photoId) => {
      setFields((prev) => ({ ...prev, [fieldId]: (prev[fieldId] || []).filter((p) => p.id !== photoId) }));
    };
    const handleHeroUpload = (fieldId, e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateField(fieldId, { url: ev.target.result, name: file.name });
      };
      reader.readAsDataURL(file);
      if (e.target) e.target.value = "";
    };
    const handleSave = () => {
      setSaving(true);
      onSave && onSave(bounty.id, fields);
      setTimeout(() => setSaving(false), 1e3);
    };
    const isComplete = () => {
      return template.sections.filter((s) => s.required).every((s) => {
        const val = fields[s.id];
        if (s.type === "photos") return val && val.length >= (s.min || 1);
        if (s.type === "hero_image") return val && val.url;
        return val && String(val).trim().length > 0;
      });
    };
    const handleSubmit = () => {
      if (!isComplete()) return;
      onSubmit && onSubmit(bounty.id, fields);
    };
    const blockLabel = (type) => {
      if (type === "h1") return "H1";
      if (type === "h2") return "H2";
      if (type === "h3") return "H3";
      if (type === "p") return "P";
      if (type === "short") return "FIELD";
      return "";
    };
    const blockLabelColor = (type) => {
      if (type === "h1") return T.red;
      if (type === "h2") return T.copper;
      if (type === "h3") return "#C0A060";
      return T.tertiary;
    };
    if (showPreview) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, background: T.darkBg, zIndex: 600, display: "flex", flexDirection: "column" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShowPreview(false), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white, letterSpacing: 1 }, children: "PREVIEW" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}18`, padding: "3px 8px", borderRadius: 4, fontWeight: 600 }, children: bounty.category.toUpperCase() })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "th-scroll", style: { flex: 1, overflowY: "auto", padding: 16 }, children: template.sections.map((s) => {
          const val = fields[s.id];
          if (s.type === "h1" && template.sections.some((ts) => ts.type === "hero_image") && fields["hero_image"]?.url) return null;
          if (s.type === "photos") {
            if (!val || val.length === 0) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 10, margin: "12px 0" }, children: val.map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderRadius: 10, overflow: "hidden", border: `1px solid ${T.charcoal}` }, children: [
              p.type === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: p.url, preload: "metadata", playsInline: true, controls: true, style: { width: "100%", maxHeight: 280, objectFit: "contain", display: "block", background: "#000" } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4, pointerEvents: "none" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 10, color: T.white }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, fontWeight: 600 }, children: "VIDEO" })
                ] })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", style: { width: "100%", height: 200, objectFit: "cover", display: "block" } }),
              p.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "8px 12px", background: T.darkCard }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, fontStyle: "italic", lineHeight: 1.4 }, children: p.caption }) })
            ] }, pi)) }, s.id);
          }
          if (s.type === "hero_image") {
            if (!val || !val.url) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", borderRadius: 12, overflow: "hidden", margin: "-16px -16px 16px", width: "calc(100% + 32px)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: val.url, alt: "", style: { width: "100%", height: 260, objectFit: "cover", display: "block" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.75))", padding: "40px 16px 14px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 20, color: T.white, fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }, children: fields["title"] || "Untitled" }) })
            ] }, s.id);
          }
          if (s.type === "rating") {
            return val > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, margin: "12px 0" }, children: [
              [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { size: 18, color: i <= val ? "#FFD700" : T.charcoal, fill: i <= val ? "#FFD700" : "none" }, i)),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, marginLeft: 6, fontWeight: 600 }, children: [
                val,
                "/5"
              ] })
            ] }, s.id) : null;
          }
          if (s.type === "select") {
            return val ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.copper, margin: "4px 0 12px", fontWeight: 600 }, children: val }, s.id) : null;
          }
          if (s.type === "tag_select") {
            const tags = val || [];
            if (tags.length === 0) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 12px" }, children: tags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, background: `${T.copper}18`, padding: "4px 10px", borderRadius: 12, fontWeight: 600 }, children: t }, t)) }, s.id);
          }
          if (s.type === "map_embed") {
            const startC = fields["start_coords"] || "";
            const loc = fields["location"] || "";
            const mapQ = startC.trim() || loc.trim();
            if (!mapQ) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { borderRadius: 12, overflow: "hidden", border: `1px solid ${T.charcoal}`, height: 180, margin: "12px 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "iframe",
              {
                src: `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mapQ)}&maptype=terrain&zoom=12`,
                style: { width: "100%", height: "100%", border: "none" },
                allowFullScreen: true,
                loading: "lazy"
              }
            ) }, s.id);
          }
          if (s.type === "bullet_list") {
            const items = (val || []).filter((v) => v.trim());
            if (items.length === 0) return null;
            const listColor = s.color || T.white;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "8px 0 12px", paddingLeft: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: [
                s.icon === "check" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 13, color: listColor }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13, color: listColor }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: listColor, fontWeight: 700 }, children: s.label })
              ] }),
              items.map((item, ii) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: listColor, fontSize: 16, lineHeight: 1.4, flexShrink: 0 }, children: "\u2022" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 14, color: T.warmStone, lineHeight: 1.5 }, children: item })
              ] }, ii))
            ] }, s.id);
          }
          if (!val || typeof val === "string" && !val.trim()) return null;
          const fontSize = s.type === "h1" ? 22 : s.type === "h2" ? 17 : s.type === "h3" ? 14 : s.type === "short" ? 13 : 14;
          const fontWeight = s.type === "h1" || s.type === "h2" || s.type === "h3" ? 700 : 400;
          const margin = s.type === "h1" ? "0 0 8px" : s.type === "h2" ? "16px 0 6px" : "4px 0 10px";
          const font = s.type === "p" || s.type === "short" ? serif : sans;
          const color = s.type === "h1" ? T.red : s.type === "h2" ? T.copper : s.type === "short" ? T.tertiary : T.warmStone;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: font, fontSize, fontWeight, color, margin, lineHeight: 1.6 }, children: val }, s.id);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 16px", background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, flexShrink: 0, display: "flex", gap: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShowPreview(false), style: { flex: 1, padding: "12px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600 }, children: "BACK TO EDITOR" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: handleSubmit, disabled: !isComplete(), style: { flex: 1, padding: "12px", borderRadius: 8, background: isComplete() ? T.green : T.charcoal, border: "none", cursor: isComplete() ? "pointer" : "default", opacity: isComplete() ? 1 : 0.5 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "SUBMIT FOR REVIEW" }) })
        ] })
      ] });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, background: T.darkBg, zIndex: 600, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
            onSave && onSave(bounty.id, fields);
            onClose();
          }, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white, display: "block" }, children: "Bounty Response" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: bounty.title })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: handleSave, style: { display: "flex", alignItems: "center", gap: 5, background: `${T.copper}18`, padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.copper}30`, cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { size: 12, color: T.copper }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600, letterSpacing: 0.5 }, children: saving ? "SAVED \u2713" : "SAVE DRAFT" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 16px", background: `${T.charcoal}80`, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { size: 13, color: T.red }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.red, fontWeight: 600, letterSpacing: 0.5 }, children: bounty.category.toUpperCase() }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: "\u2022" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 3 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { size: 11, color: T.green }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.green, fontWeight: 600 }, children: [
              "$",
              (bounty.reward / 100).toFixed(0)
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 3 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 10, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600 }, children: [
              "+",
              bounty.rewardPts,
              " pts"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary, margin: "0 0 6px", lineHeight: 1.5 }, children: template.description }),
        template.publishTo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 0.5 }, children: "PUBLISHES TO:" }),
          template.publishTo.map((dest) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, background: dest === "forum" ? `${T.copper}30` : `${T.green}30`, padding: "2px 8px", borderRadius: 4, fontWeight: 600, letterSpacing: 0.5 }, children: dest === "forum" ? "\u{1F4CB} FORUM (FULL REPORT)" : dest === "routes" ? "\u{1F5FA}\uFE0F ROUTES (TRAIL DATA)" : dest.toUpperCase() }, dest))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "th-scroll", style: { flex: 1, overflowY: "auto", padding: "16px 16px 100px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: photoRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: (e) => {
          if (activePhotoField) handlePhotoUpload(activePhotoField, e);
        }, style: { display: "none" } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: heroRef, type: "file", accept: "image/*", onChange: (e) => {
          if (activePhotoField) handleHeroUpload(activePhotoField, e);
        }, style: { display: "none" } }),
        template.sections.map((section) => {
          if (section.fixed) {
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "20px 0 8px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.white, background: blockLabelColor(section.type), padding: "2px 5px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.5 }, children: blockLabel(section.type) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 15, color: T.copper, fontWeight: 700 }, children: section.value })
            ] }, section.id);
          }
          if (section.type === "photos") {
            const photos = fields[section.id] || [];
            const updateCaption = (photoId, caption) => {
              setFields((prev) => ({ ...prev, [section.id]: (prev[section.id] || []).map((p) => p.id === photoId ? { ...p, caption } : p) }));
            };
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "16px 0" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 14, color: T.copper }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600 }, children: section.label }),
                section.required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.red }, children: "REQUIRED" }),
                section.min && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 9, color: photos.length >= section.min ? T.green : T.tertiary }, children: [
                  "(",
                  photos.length,
                  "/",
                  section.min,
                  "+ media)"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
                photos.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderRadius: 12, overflow: "hidden", border: `1px solid ${T.charcoal}`, background: T.darkCard }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
                    p.type === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: p.url, preload: "metadata", playsInline: true, controls: true, style: { width: "100%", maxHeight: 280, objectFit: "contain", display: "block", background: "#000" } }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4, pointerEvents: "none" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 10, color: T.white }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, fontWeight: 600 }, children: "VIDEO" })
                      ] })
                    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", style: { width: "100%", height: 220, objectFit: "cover", display: "block" } }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => removePhoto(section.id, p.id), style: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.white }) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "8px 10px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "input",
                    {
                      value: p.caption || "",
                      onChange: (e) => updateCaption(p.id, e.target.value),
                      placeholder: "Add a caption...",
                      style: { width: "100%", padding: "8px 10px", borderRadius: 6, background: T.darkBg, border: `1px solid ${T.charcoal}`, color: T.warmStone, fontFamily: serif, fontSize: 12, outline: "none", boxSizing: "border-box" },
                      onFocus: (e) => e.target.style.borderColor = T.copper + "60",
                      onBlur: (e) => e.target.style.borderColor = T.charcoal
                    }
                  ) })
                ] }, p.id)),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
                  setActivePhotoField(section.id);
                  setTimeout(() => photoRef.current && photoRef.current.click(), 50);
                }, style: { width: "100%", padding: "18px 16px", borderRadius: 12, background: T.darkCard, border: `1px dashed ${T.copper}40`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 16, color: T.copper }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }, children: "Add Photo" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: "or" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 16, color: T.copper }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }, children: "Add Video" })
                  ] })
                ] })
              ] })
            ] }, section.id);
          }
          if (section.type === "hero_image") {
            const hero = fields[section.id];
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "16px 0" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 14, color: T.copper }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600 }, children: section.label }),
                section.required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.red }, children: "REQUIRED" })
              ] }),
              hero ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.charcoal}` }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: hero.url, alt: "", style: { width: "100%", height: 240, objectFit: "cover", display: "block" } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "24px 14px 12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }, children: fields["title"] || "Your Title Here" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
                    setActivePhotoField(section.id);
                    setTimeout(() => heroRef.current && heroRef.current.click(), 50);
                  }, style: { width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 12, color: T.white }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => updateField(section.id, null), style: { width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12, color: T.white }) })
                ] })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
                setActivePhotoField(section.id);
                setTimeout(() => heroRef.current && heroRef.current.click(), 50);
              }, style: { width: "100%", height: 180, borderRadius: 12, background: T.darkCard, border: `1px dashed ${T.copper}40`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 44, height: 44, borderRadius: "50%", background: `${T.copper}15`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 20, color: T.copper }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }, children: "Upload Hero Image" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, maxWidth: 240, textAlign: "center", lineHeight: 1.4 }, children: section.placeholder })
              ] })
            ] }, section.id);
          }
          if (section.type === "rating") {
            const val = fields[section.id] || 0;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "16px 0" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, display: "block", marginBottom: 8 }, children: section.label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 8 }, children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => updateField(section.id, i), style: { background: "none", border: "none", cursor: "pointer", padding: 4 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { size: 28, color: i <= val ? "#FFD700" : T.charcoal, fill: i <= val ? "#FFD700" : "none" }) }, i)) })
            ] }, section.id);
          }
          if (section.type === "select") {
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "12px 0" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, display: "block", marginBottom: 6 }, children: section.label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: section.options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => updateField(section.id, opt), style: { padding: "10px 12px", borderRadius: 8, background: fields[section.id] === opt ? `${T.copper}18` : T.darkCard, border: fields[section.id] === opt ? `1px solid ${T.copper}40` : `1px solid ${T.charcoal}`, cursor: "pointer", textAlign: "left" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: fields[section.id] === opt ? T.copper : T.tertiary, fontWeight: fields[section.id] === opt ? 600 : 400 }, children: opt }) }, opt)) })
            ] }, section.id);
          }
          if (section.type === "tag_select") {
            const selected = fields[section.id] || [];
            const toggle = (tag) => {
              if (selected.includes(tag)) updateField(section.id, selected.filter((t) => t !== tag));
              else updateField(section.id, [...selected, tag]);
            };
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "12px 0" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, display: "block", marginBottom: 8 }, children: section.label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: section.options.map((tag) => {
                const active = selected.includes(tag);
                return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => toggle(tag), style: { padding: "6px 12px", borderRadius: 16, background: active ? `${T.copper}20` : T.darkCard, border: active ? `1px solid ${T.copper}50` : `1px solid ${T.charcoal}`, cursor: "pointer", fontFamily: sans, fontSize: 11, color: active ? T.copper : T.tertiary, fontWeight: active ? 600 : 400, transition: "all 0.15s" }, children: tag }, tag);
              }) })
            ] }, section.id);
          }
          if (section.type === "map_embed") {
            const startC = fields["start_coords"] || "";
            const endC = fields["end_coords"] || "";
            const loc = fields["location"] || "";
            const hasCoords = startC.trim().length > 0;
            const mapQuery = hasCoords ? startC : loc;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "16px 0" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, display: "block", marginBottom: 8 }, children: section.label }),
              mapQuery ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderRadius: 12, overflow: "hidden", border: `1px solid ${T.charcoal}`, height: 200, position: "relative" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "iframe",
                  {
                    src: `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mapQuery)}&maptype=terrain&zoom=12`,
                    style: { width: "100%", height: "100%", border: "none" },
                    allowFullScreen: true,
                    loading: "lazy"
                  }
                ),
                startC && endC && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", gap: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.charcoal}E0`, backdropFilter: "blur(8px)", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 8, height: 8, borderRadius: "50%", background: T.green } }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white }, children: "Start" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.charcoal}E0`, backdropFilter: "blur(8px)", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 8, height: 8, borderRadius: "50%", background: T.red } }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white }, children: "End" })
                  ] })
                ] })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 120, borderRadius: 12, background: T.darkCard, border: `1px dashed ${T.charcoal}`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { size: 24, color: T.tertiary, strokeWidth: 1, style: { marginBottom: 4, opacity: 0.4 } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, margin: 0 }, children: "Enter coordinates or location above to preview map" })
              ] }) })
            ] }, section.id);
          }
          if (section.type === "bullet_list") {
            const items = fields[section.id] || [""];
            const listColor = section.color || T.white;
            const updateItem = (idx, val) => {
              const next = [...items];
              next[idx] = val;
              updateField(section.id, next);
            };
            const addItem = () => updateField(section.id, [...items, ""]);
            const removeItem = (idx) => {
              if (items.length > 1) updateField(section.id, items.filter((_, i) => i !== idx));
            };
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "12px 0" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }, children: [
                section.icon === "check" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 14, color: listColor }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: listColor }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: listColor, fontWeight: 700 }, children: section.label })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: items.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: listColor, fontSize: 18, lineHeight: 1, flexShrink: 0 }, children: "\u2022" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    value: item,
                    onChange: (e) => updateItem(idx, e.target.value),
                    placeholder: section.placeholder,
                    onKeyDown: (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem();
                      }
                    },
                    style: { flex: 1, padding: "9px 12px", borderRadius: 6, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 13, outline: "none", boxSizing: "border-box" },
                    onFocus: (e) => e.target.style.borderColor = listColor + "60",
                    onBlur: (e) => e.target.style.borderColor = T.charcoal
                  }
                ),
                items.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => removeItem(idx), style: { background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, opacity: 0.5 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12, color: T.tertiary }) })
              ] }, idx)) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: addItem, style: { marginTop: 6, display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 12, color: listColor }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: listColor, fontWeight: 600 }, children: [
                  "ADD ",
                  section.label.toUpperCase().slice(0, -1)
                ] })
              ] })
            ] }, section.id);
          }
          const isH1 = section.type === "h1";
          const isHeading = isH1 || section.type === "h3";
          const isShort = section.type === "short";
          const isLong = section.type === "p";
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { margin: "12px 0" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.white, background: blockLabelColor(section.type), padding: "2px 5px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.5 }, children: blockLabel(section.type) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600 }, children: section.label }),
              section.required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.red }, children: "REQUIRED" })
            ] }),
            isLong ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "textarea",
              {
                value: fields[section.id] || "",
                onChange: (e) => updateField(section.id, e.target.value),
                placeholder: section.placeholder,
                rows: 5,
                style: { width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" },
                onFocus: (e) => e.target.style.borderColor = T.copper,
                onBlur: (e) => e.target.style.borderColor = T.charcoal
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                value: fields[section.id] || "",
                onChange: (e) => updateField(section.id, e.target.value),
                placeholder: section.placeholder,
                style: { width: "100%", padding: "11px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: isH1 ? T.red : T.white, fontFamily: isHeading ? sans : serif, fontSize: isH1 ? 18 : isHeading ? 16 : 13, fontWeight: isHeading ? 700 : 400, outline: "none", boxSizing: "border-box" },
                onFocus: (e) => e.target.style.borderColor = T.copper,
                onBlur: (e) => e.target.style.borderColor = T.charcoal
              }
            )
          ] }, section.id);
        })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 16px", background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, flexShrink: 0, display: "flex", gap: 10 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setShowPreview(true), style: { flex: 1, padding: "12px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600 }, children: "PREVIEW" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: handleSubmit, disabled: !isComplete(), style: { flex: 1, padding: "12px", borderRadius: 8, background: isComplete() ? T.green : T.charcoal, border: "none", cursor: isComplete() ? "pointer" : "default", opacity: isComplete() ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "SUBMIT" })
        ] })
      ] })
    ] });
  }
  function RanksScreen({ myPoints: myPointsProp, pointsBreakdown: breakdownProp }) {
    const [tab, setTab] = (0, import_react4.useState)("overview");
    const rankTiers = RANK_TIERS.map((r) => ({ ...r, icon: RANK_ICON_MAP[r.icon] || Star }));
    const pointsConfig = {
      dailyLogin: 5,
      feedPost: 10,
      forumThread: 25,
      forumReply: 10,
      routeLogged: 30,
      buildAdded: 40,
      profileComplete: 100,
      receiveLike: 2,
      receiveComment: 3,
      receiveBookmark: 5,
      convoyJoined: 20,
      recoveryRespond: 50,
      photoUploaded: 5
    };
    const myPoints = myPointsProp || 12450;
    const myBountyEarnings = 124e3;
    const myRank = rankTiers.find((r) => myPoints >= r.min && myPoints <= r.max) || rankTiers[0];
    const nextRank = rankTiers[rankTiers.indexOf(myRank) + 1] || null;
    const rankProgress = nextRank ? (myPoints - myRank.min) / (nextRank.min - myRank.min) * 100 : 100;
    const RankIcon = myRank.icon;
    const breakdownIcons = { "Forum Threads": MessageCircle, "Routes Logged": Map, "Builds Added": Wrench, "Likes Received": Heart, "Feed Posts": PenLine, "Daily Logins": Zap, "Recovery": TriangleAlert, "Other": Star };
    const bd = breakdownProp || { "Forum Threads": 3750, "Routes Logged": 2700, "Builds Added": 2e3, "Likes Received": 1840, "Feed Posts": 1200, "Daily Logins": 560, "Other": 400 };
    const myPointsBreakdown = Object.entries(bd).filter(([, pts]) => pts > 0).map(([label, pts]) => ({ label, pts, icon: breakdownIcons[label] || Star })).sort((a, b) => b.pts - a.pts);
    const lbOthers = [
      { name: "Sierra_Tactical", initial: "S", points: 48900, streak: 47 },
      { name: "Nomad_Queen", initial: "N", points: 32100, streak: 31 },
      { name: "Peak_Finder", initial: "P", points: 28750, streak: 22 },
      { name: "TrailBoss_88", initial: "T", points: 26200, streak: 18 },
      { name: "DirtRoadDave", initial: "D", points: 22800, streak: 15 },
      { name: "MountainGoat", initial: "M", points: 19400, streak: 12 },
      { name: "FoxFanatic", initial: "F", points: 17600, streak: 9 },
      { name: "BajaBound", initial: "B", points: 14200, streak: 6 },
      { name: "StockHero", initial: "S", points: 13100, streak: 11 },
      { name: "LiftKing", initial: "L", points: 12800, streak: 8 },
      { name: "Nomad_Mike", initial: "N", points: 11200, streak: 3 }
    ];
    const lbAll = [...lbOthers, { name: "KyleLPO", initial: "K", points: myPoints, isYou: true, streak: 5 }].sort((a, b) => b.points - a.points);
    const leaderboardData = lbAll.map((u, i) => ({ ...u, rank: i + 1, badge: (rankTiers.find((r) => u.points >= r.min && u.points <= r.max) || rankTiers[0]).name }));
    const myLeaderboardRank = leaderboardData.find((u) => u.isYou)?.rank || "\u2014";
    const [lbFilter, setLbFilter] = (0, import_react4.useState)("ALL TIME");
    const lbFilters = ["ALL TIME", "THIS MONTH", "THIS WEEK"];
    const [bounties, setBounties] = (0, import_react4.useState)([
      { id: "b1", title: "Trail Report: Black Bear Pass", desc: "Complete a detailed route report with 10+ photos, GPS track, difficulty rating, and current trail conditions for Black Bear Pass.", reward: 7500, rewardPts: 500, category: "Route Report", difficulty: "Hard", deadline: "Apr 30, 2026", slots: 3, claimed: 1, status: "open" },
      { id: "b2", title: "Gear Review: Recovery Boards", desc: "Write a detailed forum review comparing at least 3 recovery board brands with photos of real-world use.", reward: 5e3, rewardPts: 300, category: "Gear Review", difficulty: "Medium", deadline: "May 15, 2026", slots: 5, claimed: 2, status: "open" },
      { id: "b3", title: "Build Feature: Overland Tacoma", desc: "Create a complete build profile for your Tacoma build with full mod list, photos of each mod, and product links.", reward: 3500, rewardPts: 200, category: "Build Feature", difficulty: "Easy", deadline: "May 1, 2026", slots: 10, claimed: 7, status: "open" },
      { id: "b4", title: "Video: Campsite Setup Walkthrough", desc: "Post a forum thread with video walkthrough of your camp setup process, including gear list and tips.", reward: 1e4, rewardPts: 750, category: "Content Creation", difficulty: "Hard", deadline: "May 20, 2026", slots: 2, claimed: 0, status: "open" },
      { id: "b5", title: "Trail Report: Rubicon Trail", desc: "Complete a detailed route report for the Rubicon Trail with obstacle descriptions and bypass info.", reward: 7500, rewardPts: 500, category: "Route Report", difficulty: "Hard", deadline: "Apr 15, 2026", slots: 3, claimed: 3, status: "completed" }
    ]);
    const [bountyFilter, setBountyFilter] = (0, import_react4.useState)("OPEN");
    const [expandedBounty, setExpandedBounty] = (0, import_react4.useState)(null);
    const [bountyDrafts, setBountyDrafts] = (0, import_react4.useState)({});
    const [activeBountyForm, setActiveBountyForm] = (0, import_react4.useState)(null);
    const startBounty = (bountyId) => {
      setBounties((prev) => prev.map((b) => b.id === bountyId ? { ...b, status: "in_progress", claimed: b.claimed + 1 } : b));
      setActiveBountyForm(bounties.find((b) => b.id === bountyId));
      setExpandedBounty(null);
    };
    const resumeBounty = (bountyId) => {
      setActiveBountyForm(bounties.find((b) => b.id === bountyId));
    };
    const saveBountyDraft = (bountyId, fields) => {
      setBountyDrafts((prev) => ({ ...prev, [bountyId]: fields }));
    };
    const submitBounty = (bountyId, fields) => {
      setBountyDrafts((prev) => ({ ...prev, [bountyId]: fields }));
      setBounties((prev) => prev.map((b) => b.id === bountyId ? { ...b, status: "submitted" } : b));
      setActiveBountyForm(null);
    };
    const totalBadges = BADGE_CATEGORIES.reduce((sum, cat) => sum + cat.tiers.length, 0);
    const earnedBadges = BADGE_CATEGORIES.reduce((sum, cat) => {
      const info = getBadgeTierForCategory(cat.name);
      return sum + (info.tier >= 0 ? info.tier + 1 : 0);
    }, 0);
    const diffColor = (d) => d === "Hard" ? T.red : d === "Medium" ? T.copper : T.green;
    const tabs = [
      { key: "overview", label: "My Rank", icon: Award },
      { key: "leaderboard", label: "Leaderboard", icon: TrendingUp },
      { key: "bounty", label: "Bounties", icon: Target },
      { key: "badges", label: "Badges", icon: Shield }
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", padding: "0 12px", gap: 2, borderBottom: `1px solid ${T.charcoal}`, marginBottom: 0 }, children: tabs.map((t) => {
        const active = tab === t.key;
        const Icon2 = t.icon;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setTab(t.key), style: { flex: 1, padding: "12px 0 10px", background: "none", border: "none", borderBottom: active ? `2px solid ${T.red}` : "2px solid transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all 0.15s" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon2, { size: 14, color: active ? T.red : T.tertiary, strokeWidth: 1.5 }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: active ? T.red : T.tertiary, fontWeight: 600, letterSpacing: 0.8 }, children: t.label.toUpperCase() })
        ] }, t.key);
      }) }),
      tab === "overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "24px 16px 16px", textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 72, height: 72, borderRadius: "50%", background: `${myRank.color}18`, border: `2px solid ${myRank.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankIcon, { size: 30, color: myRank.color, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, display: "block", marginBottom: 4 }, children: "COMMUNITY RANK" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { style: { fontFamily: sans, fontSize: 26, color: myRank.color, margin: "0 0 4px", fontWeight: 700 }, children: myRank.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary }, children: [
            "#",
            myLeaderboardRank,
            " Global Ranking"
          ] }),
          nextRank && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: 16, padding: "0 12px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5 }, children: [
                myPoints.toLocaleString(),
                " pts"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: nextRank.color, letterSpacing: 0.5 }, children: [
                nextRank.name,
                " \u2014 ",
                nextRank.min.toLocaleString(),
                " pts"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 6, background: T.charcoal, borderRadius: 3, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "100%", width: `${rankProgress}%`, background: `linear-gradient(90deg, ${myRank.color}, ${nextRank.color})`, borderRadius: 3, transition: "width 0.5s ease" } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, display: "block", marginTop: 4 }, children: [
              (nextRank.min - myPoints).toLocaleString(),
              " pts to next rank"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 10, padding: "14px 10px", textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 4 }, children: "TOTAL POINTS" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 20, color: T.copper, fontWeight: 700 }, children: myPoints.toLocaleString() })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 10, padding: "14px 10px", textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 4 }, children: "BADGES" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 20, color: T.green, fontWeight: 700 }, children: [
              earnedBadges,
              "/",
              totalBadges
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 10, padding: "14px 10px", textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 4 }, children: "STREAK" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { size: 14, color: T.red }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 20, color: T.red, fontWeight: 700 }, children: "5" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `linear-gradient(135deg, ${T.charcoal}, #333330)`, borderRadius: 14, padding: "20px 20px", border: `1px solid ${T.copper}30`, position: "relative", overflow: "hidden" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: `${T.copper}08` } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { size: 14, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "BOUNTY EARNINGS" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 28, color: T.white, fontWeight: 700 }, children: [
              "$",
              (myBountyEarnings / 100).toFixed(2)
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: "available" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary, display: "block", marginBottom: 14 }, children: "Earned from completed bounty board tasks" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: { background: T.copper, color: T.charcoal, fontFamily: sans, fontSize: 11, fontWeight: 700, padding: "10px 24px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 1 }, children: "REDEEM CREDIT" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 12 }, children: "POINTS BREAKDOWN" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: myPointsBreakdown.map((bp, i) => {
            const pct = bp.pts / myPoints * 100;
            const BpIcon = bp.icon;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BpIcon, { size: 14, color: T.copper, strokeWidth: 1.5 }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, flex: 1 }, children: bp.label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 80, height: 4, background: T.charcoal, borderRadius: 2, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "100%", width: `${pct}%`, background: T.copper, borderRadius: 2 } }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600, width: 50, textAlign: "right" }, children: bp.pts.toLocaleString() })
            ] }, i);
          }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 12 }, children: "HOW TO EARN POINTS" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: T.darkCard, borderRadius: 10, overflow: "hidden" }, children: [
            { action: "Daily Login", pts: pointsConfig.dailyLogin },
            { action: "Feed Post", pts: pointsConfig.feedPost },
            { action: "Forum Thread", pts: pointsConfig.forumThread },
            { action: "Forum Reply", pts: pointsConfig.forumReply },
            { action: "Log a Route", pts: pointsConfig.routeLogged },
            { action: "Add a Build", pts: pointsConfig.buildAdded },
            { action: "Complete Profile", pts: pointsConfig.profileComplete },
            { action: "Receive a Like", pts: pointsConfig.receiveLike },
            { action: "Receive a Comment", pts: pointsConfig.receiveComment },
            { action: "Upload a Photo", pts: pointsConfig.photoUploaded },
            { action: "Recovery Response", pts: pointsConfig.recoveryRespond }
          ].map((item, i, arr) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < arr.length - 1 ? `1px solid ${T.charcoal}44` : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white }, children: item.action }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 12, color: T.green, fontWeight: 600 }, children: [
              "+",
              item.pts,
              " pts"
            ] })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px 16px 0" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 12 }, children: "COMMUNITY RANK TIERS" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: rankTiers.map((tier, i) => {
            const TierIcon = tier.icon;
            const isCurrent = tier.name === myRank.name;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: isCurrent ? `${tier.color}12` : T.darkCard, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, border: isCurrent ? `1px solid ${tier.color}30` : "1px solid transparent" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TierIcon, { size: 16, color: tier.color, strokeWidth: 1.5 }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: isCurrent ? tier.color : T.white, fontWeight: isCurrent ? 700 : 500, flex: 1 }, children: tier.name }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: tier.max === Infinity ? `${tier.min.toLocaleString()}+` : `${tier.min.toLocaleString()} \u2013 ${tier.max.toLocaleString()}` }),
              isCurrent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: tier.color, background: `${tier.color}20`, padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 }, children: "YOU" })
            ] }, i);
          }) })
        ] })
      ] }),
      tab === "leaderboard" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, padding: "14px 16px 10px" }, children: lbFilters.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setLbFilter(f), style: { padding: "6px 12px", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, background: lbFilter === f ? T.red : T.darkCard, color: lbFilter === f ? T.white : T.tertiary, transition: "all 0.15s" }, children: f }, f)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 8, padding: "8px 16px 20px" }, children: [leaderboardData[1], leaderboardData[0], leaderboardData[2]].map((u, i) => {
          const podiumOrder = [2, 1, 3];
          const heights = [90, 110, 75];
          const medalColors = ["#C0C0C0", "#FFD700", "#CD7F32"];
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: i === 1 ? 52 : 44, height: i === 1 ? 52 : 44, borderRadius: "50%", background: T.charcoal, border: `2px solid ${medalColors[i]}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: i === 1 ? 16 : 14, fontWeight: 700, color: T.white }, children: u.initial }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, marginBottom: 2, textAlign: "center" }, children: u.name.length > 12 ? u.name.slice(0, 11) + "\u2026" : u.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600, marginBottom: 6 }, children: u.points.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: "100%", height: heights[i], borderRadius: "10px 10px 0 0", background: `linear-gradient(180deg, ${medalColors[i]}30, ${medalColors[i]}08)`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${medalColors[i]}30`, borderBottom: "none" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 22, fontWeight: 700, color: medalColors[i] }, children: [
              "#",
              podiumOrder[i]
            ] }) })
          ] }, i);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: leaderboardData.map((r, i) => {
          const userRank = rankTiers.find((t) => r.points >= t.min && r.points <= t.max) || rankTiers[0];
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: r.isYou ? `${T.red}12` : T.darkCard, borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, border: r.isYou ? `1px solid ${T.red}25` : "1px solid transparent" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: r.rank <= 3 ? "#FFD700" : r.isYou ? T.red : T.tertiary, fontWeight: 700, width: 26, textAlign: "center" }, children: r.rank }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 34, height: 34, borderRadius: "50%", background: r.isYou ? T.red : T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, fontWeight: 700, color: T.white }, children: r.initial }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: r.isYou ? T.red : T.white, fontWeight: 600, display: "block" }, children: r.isYou ? "You" : r.name }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: userRank.color }, children: userRank.name }),
                r.streak >= 7 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 2 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { size: 9, color: T.red }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 9, color: T.red }, children: [
                    r.streak,
                    "d"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "right" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.copper, fontWeight: 600, display: "block" }, children: r.points.toLocaleString() }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary }, children: "pts" })
            ] })
          ] }, i);
        }) }) })
      ] }),
      tab === "bounty" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px 16px 8px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { size: 18, color: T.red }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 18, color: T.white, margin: 0, fontWeight: 700 }, children: "Bounty Board" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0, lineHeight: 1.5 }, children: "Complete bounties to earn cash credit and bonus points. All submissions are reviewed by admins before rewards are issued." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, padding: "10px 16px" }, children: ["OPEN", "IN PROGRESS", "SUBMITTED", "COMPLETED", "ALL"].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setBountyFilter(f), style: { padding: "6px 12px", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, background: bountyFilter === f ? T.red : T.darkCard, color: bountyFilter === f ? T.white : T.tertiary }, children: f }, f)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }, children: bounties.filter((b) => bountyFilter === "ALL" ? true : bountyFilter === "OPEN" ? b.status === "open" : bountyFilter === "IN PROGRESS" ? b.status === "in_progress" : bountyFilter === "SUBMITTED" ? b.status === "submitted" : b.status === "completed").map((b) => {
          const expanded = expandedBounty === b.id;
          const slotsLeft = b.slots - b.claimed;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => setExpandedBounty(expanded ? null : b.id), style: { background: T.darkCard, borderRadius: 12, overflow: "hidden", cursor: "pointer", border: b.status === "completed" ? `1px solid ${T.green}20` : b.status === "in_progress" ? `1px solid ${T.copper}25` : b.status === "submitted" ? `1px solid #C0A06025` : `1px solid ${T.charcoal}` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "14px 16px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, background: diffColor(b.difficulty), padding: "2px 7px", borderRadius: 3, letterSpacing: 0.5, fontWeight: 600 }, children: b.difficulty.toUpperCase() }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, background: `${T.charcoal}`, padding: "2px 7px", borderRadius: 3, letterSpacing: 0.5 }, children: b.category.toUpperCase() })
                ] }),
                b.status === "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 12, color: T.green }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.green, fontWeight: 600 }, children: "COMPLETED" })
                ] }) : b.status === "in_progress" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 11, color: T.copper }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, fontWeight: 600 }, children: "IN PROGRESS" })
                ] }) : b.status === "submitted" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 11, color: "#C0A060" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: "#C0A060", fontWeight: 600 }, children: "UNDER REVIEW" })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 9, color: slotsLeft <= 1 ? T.red : T.tertiary, fontWeight: 600 }, children: [
                  slotsLeft,
                  " SLOT",
                  slotsLeft !== 1 ? "S" : "",
                  " LEFT"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 15, color: T.white, margin: "0 0 6px", fontWeight: 600 }, children: b.title }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { size: 13, color: T.green }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 14, color: T.green, fontWeight: 700 }, children: [
                    "$",
                    (b.reward / 100).toFixed(0)
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 12, color: T.copper }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }, children: [
                    "+",
                    b.rewardPts,
                    " pts"
                  ] })
                ] })
              ] })
            ] }),
            expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px 14px", borderTop: `1px solid ${T.charcoal}44` }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "12px 0", lineHeight: 1.6 }, children: b.desc }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 11, color: T.tertiary }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
                    "Due ",
                    b.deadline
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 11, color: T.tertiary }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
                    b.claimed,
                    "/",
                    b.slots,
                    " claimed"
                  ] })
                ] })
              ] }),
              b.status === "open" && slotsLeft > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                e.stopPropagation();
                startBounty(b.id);
              }, style: { width: "100%", padding: "12px", background: T.red, color: T.white, fontFamily: sans, fontSize: 12, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer", letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { size: 14, color: T.white }),
                "START BOUNTY"
              ] }),
              b.status === "in_progress" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: (e) => {
                e.stopPropagation();
                resumeBounty(b.id);
              }, style: { width: "100%", padding: "12px", background: T.copper, color: T.white, fontFamily: sans, fontSize: 12, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer", letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 14, color: T.white }),
                "RESUME BOUNTY"
              ] }),
              b.status === "submitted" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 0 0" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 14, color: "#C0A060" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary }, children: "Awaiting admin review \u2014 you'll be notified when approved or if edits are needed." })
              ] })
            ] })
          ] }, b.id);
        }) })
      ] }),
      tab === "badges" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px 16px 8px", textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 18, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 22, color: T.white, fontWeight: 700 }, children: earnedBadges }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 14, color: T.tertiary }, children: [
              "/ ",
              totalBadges,
              " Badges Earned"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: "60%", height: 6, background: T.charcoal, borderRadius: 3, overflow: "hidden", margin: "8px auto 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "100%", width: `${earnedBadges / totalBadges * 100}%`, background: T.copper, borderRadius: 3 } }) })
        ] }),
        BADGE_CATEGORIES.map((cat, ci) => {
          const catInfo = getBadgeTierForCategory(cat.name);
          const CatIcon = cat.icon;
          const progress = MY_BADGE_PROGRESS[cat.name] || 0;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 16px 4px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatIcon, { size: 14, color: catInfo.tier >= 0 ? catInfo.color : T.tertiary, strokeWidth: 1.5 }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600 }, children: cat.name.toUpperCase() }),
              catInfo.tier >= 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: catInfo.color, background: `${catInfo.color}18`, padding: "2px 7px", borderRadius: 4, fontWeight: 600 }, children: catInfo.name })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }, children: cat.tiers.map((tier, ti) => {
              const earned = progress >= tier.goal;
              const isCurrent = catInfo.tierIdx === ti;
              const isNext = catInfo.tierIdx === ti - 1 || catInfo.tier < 0 && ti === 0;
              const tierColor = BADGE_TIER_COLORS[Math.min(ti, BADGE_TIER_COLORS.length - 1)];
              const pct = isNext ? Math.min(progress / tier.goal * 100, 100) : 0;
              return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: earned ? `${tierColor}10` : T.darkCard, borderRadius: 10, padding: "12px 14px", border: isCurrent ? `1px solid ${tierColor}35` : `1px solid ${T.charcoal}`, display: "flex", alignItems: "center", gap: 12 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 38, height: 38, borderRadius: "50%", background: earned ? `${tierColor}22` : T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: earned ? `2px solid ${tierColor}50` : "2px solid transparent" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatIcon, { size: 16, color: earned ? tierColor : `${T.tertiary}60`, strokeWidth: 1.5 }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: earned ? T.white : T.tertiary, fontWeight: 600 }, children: tier.name }),
                    earned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 12, color: tierColor })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 10, color: T.tertiary, display: "block", marginTop: 1 }, children: tier.desc }),
                  isNext && !earned && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: 6 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 2 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary }, children: [
                        progress,
                        "/",
                        tier.goal
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 9, color: tierColor }, children: [
                        Math.round(pct),
                        "%"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 4, background: T.charcoal, borderRadius: 2, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "100%", width: `${pct}%`, background: tierColor, borderRadius: 2 } }) })
                  ] })
                ] })
              ] }, ti);
            }) })
          ] }, ci);
        })
      ] }),
      activeBountyForm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        BountyResponseForm,
        {
          bounty: activeBountyForm,
          draft: bountyDrafts[activeBountyForm.id] || null,
          onSave: saveBountyDraft,
          onSubmit: submitBounty,
          onClose: () => setActiveBountyForm(null)
        }
      )
    ] });
  }
  function AddBuildForm({ onClose, onSave, initialData }) {
    const d = initialData || {};
    const initMod = (m) => m && m.value != null ? { ...m } : { value: "", photo: [], link: "" };
    const [buildName, setBuildName] = (0, import_react4.useState)(d.buildName || "");
    const [year, setYear] = (0, import_react4.useState)(d.year || "");
    const [make, setMake] = (0, import_react4.useState)(d.make || "");
    const [model, setModel] = (0, import_react4.useState)(d.model || "");
    const [trim, setTrim] = (0, import_react4.useState)(d.trim || "");
    const [showPreview, setShowPreview] = (0, import_react4.useState)(false);
    const [shareToFeed, setShareToFeed] = (0, import_react4.useState)(initialData ? false : true);
    const [mainPhotos, setMainPhotos] = (0, import_react4.useState)(d.mainPhotos || []);
    const emptyMod = () => ({ value: "", photo: [], link: "" });
    const [suspension, setSuspension] = (0, import_react4.useState)(initMod(d.suspension));
    const [tires, setTires] = (0, import_react4.useState)(initMod(d.tires));
    const [wheels, setWheels] = (0, import_react4.useState)(initMod(d.wheels));
    const [bumpers, setBumpers] = (0, import_react4.useState)(initMod(d.bumpers));
    const [armor, setArmor] = (0, import_react4.useState)(initMod(d.armor));
    const [lighting, setLighting] = (0, import_react4.useState)(initMod(d.lighting));
    const [rack, setRack] = (0, import_react4.useState)(initMod(d.rack));
    const [winch, setWinch] = (0, import_react4.useState)(initMod(d.winch));
    const [otherMods, setOtherMods] = (0, import_react4.useState)(initMod(d.otherMods));
    const [hasCamper, setHasCamper] = (0, import_react4.useState)(d.hasCamper || false);
    const [camperMake, setCamperMake] = (0, import_react4.useState)(d.camperMake || "");
    const [camperModel, setCamperModel] = (0, import_react4.useState)(d.camperModel || "");
    const [camperPhoto, setCamperPhoto] = (0, import_react4.useState)(d.camperPhoto || []);
    const [camperLink, setCamperLink] = (0, import_react4.useState)(d.camperLink || "");
    const inputStyle = {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px 14px",
      borderRadius: 8,
      background: T.darkCard,
      border: `1px solid ${T.charcoal}`,
      color: T.white,
      fontFamily: serif,
      fontSize: 14,
      outline: "none",
      transition: "border 0.2s"
    };
    const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };
    const sectionTitle = (text, icon) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14, marginTop: 24 }, children: [
      icon,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, letterSpacing: 1.5, fontWeight: 700 }, children: text })
    ] });
    const fieldGroup = (label, value, setter, placeholder, multiline) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 14 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: label }),
      multiline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value, onChange: (e) => setter(e.target.value), placeholder, style: { ...inputStyle, minHeight: 70, resize: "vertical", lineHeight: 1.6 } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value, onChange: (e) => setter(e.target.value), placeholder, style: inputStyle })
    ] });
    const ModFieldPhoto = ({ mod, setMod }) => {
      const fRef = (0, import_react4.useRef)(null);
      const handleF = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (fRef.current) fRef.current.value = "";
        const reader = new FileReader();
        reader.onload = (ev) => {
          setMod({ ...mod, photo: [{ id: Date.now(), url: ev.target.result, name: file.name }] });
        };
        reader.readAsDataURL(file);
      };
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: fRef, type: "file", accept: "image/*", onChange: handleF, style: { display: "none" } }),
        mod.photo.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", flexShrink: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: mod.photo[0].url, alt: "", style: { width: 52, height: 52, borderRadius: 6, objectFit: "cover", display: "block", border: `1px solid ${T.charcoal}` } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setMod({ ...mod, photo: [] }), style: { position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: T.red, border: `2px solid ${T.darkBg}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 8, color: T.white }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => fRef.current && fRef.current.click(), style: { width: 52, height: 52, borderRadius: 6, background: T.darkCard, border: `1px dashed ${T.charcoal}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, flexShrink: 0, padding: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 14, color: T.tertiary }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 7, color: T.tertiary, letterSpacing: 0.3 }, children: "PHOTO" })
        ] })
      ] });
    };
    const modField = (label, mod, setMod, placeholder) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "flex-start" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: mod.value, onChange: (e) => setMod({ ...mod, value: e.target.value }), placeholder, style: inputStyle }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12, color: mod.link ? T.copper : T.tertiary, style: { flexShrink: 0 } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: mod.link, onChange: (e) => setMod({ ...mod, link: e.target.value }), placeholder: "Product link (optional)", style: { ...inputStyle, padding: "7px 10px", fontSize: 11, background: "transparent", border: `1px solid ${mod.link ? T.copper + "40" : T.charcoal}` } })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModFieldPhoto, { mod, setMod }) })
      ] })
    ] });
    const handleSave = () => {
      if (!make || !model || !year) return;
      onSave && onSave({ buildName, year, make, model, trim, mainPhotos, suspension, tires, wheels, bumpers, armor, lighting, rack, winch, otherMods, hasCamper, camperMake, camperModel, camperPhoto, camperLink, shareToFeed });
      onClose();
    };
    const formView = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "8px 16px 32px" }, children: [
      sectionTitle("BUILD IDENTITY", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 16, color: T.copper })),
      fieldGroup("BUILD NAME", buildName, setBuildName, "e.g. THE HIGHLANDER"),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 14 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "YEAR" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: year, onChange: (e) => setYear(e.target.value), placeholder: "2024", style: inputStyle })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "MAKE" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: make, onChange: (e) => setMake(e.target.value), placeholder: "Toyota", style: inputStyle })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }, children: [
        (() => {
          const f = fieldGroup("MODEL", model, setModel, "Tundra");
          return f;
        })(),
        (() => {
          const f = fieldGroup("TRIM / PACKAGE", trim, setTrim, "TRD Pro");
          return f;
        })()
      ] }),
      sectionTitle("BUILD PHOTOS", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 16, color: T.copper })),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "MAIN IMAGE" }),
        mainPhotos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", marginBottom: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: mainPhotos[0].url, alt: "", style: { width: "100%", height: 180, borderRadius: 10, objectFit: "cover", display: "block", border: `1px solid ${T.charcoal}` } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setMainPhotos([]), style: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: `${T.darkBg}CC`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.white }) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoUploader, { photos: mainPhotos, onChange: (p) => setMainPhotos(p.slice(0, 1)), maxPhotos: 1 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, marginTop: 4, display: "block" }, children: "This will be the hero image on your build card" })
      ] }),
      sectionTitle("SUSPENSION & WHEELS", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 16, color: T.copper })),
      modField("SUSPENSION", suspension, setSuspension, 'e.g. Icon Stage 3, 2.5" lift'),
      modField("TIRES", tires, setTires, "e.g. BFGoodrich KO2 35x12.5R17"),
      modField("WHEELS", wheels, setWheels, "e.g. Method 305 NV 17x8.5"),
      sectionTitle("ARMOR & PROTECTION", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 16, color: T.copper })),
      modField("BUMPERS", bumpers, setBumpers, "e.g. CBI front & rear bumpers"),
      modField("SKID PLATES / ARMOR", armor, setArmor, "e.g. RCI full skid package"),
      sectionTitle("ACCESSORIES", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { size: 16, color: T.copper })),
      modField("LIGHTING", lighting, setLighting, "e.g. Baja Designs squadron, ditch lights"),
      modField("ROOF RACK / BED RACK", rack, setRack, "e.g. Uptop Overland Alpha bed rack"),
      modField("RECOVERY / WINCH", winch, setWinch, "e.g. WARN Zeon 10-S"),
      modField("OTHER MODS", otherMods, setOtherMods, "Snorkel, dual battery, fridge slide, etc."),
      sectionTitle("CAMPER", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { size: 16, color: T.copper })),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          onClick: () => setHasCamper(!hasCamper),
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.darkCard, borderRadius: 10, cursor: "pointer", marginBottom: 14, border: hasCamper ? `1px solid ${T.copper}40` : `1px solid ${T.charcoal}` },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { size: 18, color: hasCamper ? T.copper : T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }, children: "Camper Installed" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: hasCamper ? "Tap to remove camper details" : "Tap to add camper details" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 44, height: 24, borderRadius: 12, background: hasCamper ? T.copper : T.charcoal, position: "relative", transition: "background 0.2s" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: hasCamper ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" } }) })
          ]
        }
      ),
      hasCamper && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.copper}08`, borderRadius: 10, padding: "4px 0 0", marginBottom: 14 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }, children: [
          (() => {
            const f = fieldGroup("CAMPER MAKE", camperMake, setCamperMake, "e.g. Four Wheel Campers");
            return f;
          })(),
          (() => {
            const f = fieldGroup("CAMPER MODEL", camperModel, setCamperModel, "e.g. Fleet Flatbed");
            return f;
          })()
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginBottom: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12, color: camperLink ? T.copper : T.tertiary, style: { flexShrink: 0 } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: camperLink, onChange: (e) => setCamperLink(e.target.value), placeholder: "Product link (optional)", style: { ...inputStyle, padding: "7px 10px", fontSize: 11, background: "transparent", border: `1px solid ${camperLink ? T.copper + "40" : T.charcoal}` } })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModFieldPhoto, { mod: { photo: camperPhoto }, setMod: (m) => setCamperPhoto(m.photo) }),
          camperPhoto.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginTop: 8 }, children: camperPhoto.map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", style: { width: 52, height: 52, borderRadius: 6, objectFit: "cover" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setCamperPhoto(camperPhoto.filter((_, j) => j !== pi)), style: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: T.red, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 8, color: T.white }) })
          ] }, pi)) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          onClick: () => {
            if (make && model && year) setShowPreview(true);
          },
          style: { width: "100%", padding: "16px", borderRadius: 10, background: !make || !model || !year ? T.charcoal : T.red, border: "none", cursor: !make || !model || !year ? "default" : "pointer", fontFamily: sans, fontSize: 14, color: !make || !model || !year ? T.tertiary : T.white, fontWeight: 700, letterSpacing: 1, marginTop: 8, opacity: !make || !model || !year ? 0.5 : 1, transition: "all 0.2s" },
          children: "PREVIEW BUILD"
        }
      ),
      (!make || !model || !year) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, textAlign: "center", display: "block", marginTop: 8 }, children: "Year, make, and model are required" })
    ] });
    const displayName = buildName || `${year} ${make} ${model}`;
    const specRows = [
      suspension.value && { label: "Suspension", mod: suspension },
      tires.value && { label: "Tires", mod: tires },
      wheels.value && { label: "Wheels", mod: wheels },
      bumpers.value && { label: "Bumpers", mod: bumpers },
      armor.value && { label: "Armor / Skid Plates", mod: armor },
      lighting.value && { label: "Lighting", mod: lighting },
      rack.value && { label: "Rack", mod: rack },
      winch.value && { label: "Recovery / Winch", mod: winch },
      otherMods.value && { label: "Other", mod: otherMods }
    ].filter(Boolean);
    const previewView = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "8px 16px 32px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, overflow: "hidden", marginBottom: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { height: 180, background: mainPhotos.length > 0 ? "none" : `linear-gradient(135deg, ${T.charcoal} 0%, ${T.red}20 100%)`, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }, children: [
          mainPhotos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: mainPhotos[0].url, alt: "", style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 70, color: T.tertiary, strokeWidth: 0.2, style: { opacity: 0.06 } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(transparent 30%, rgba(0,0,0,0.8) 100%)" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", padding: "0 14px 12px" }, children: [
            trim && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.warmBg, background: "#3D3D3A", padding: "3px 6px", borderRadius: 3, letterSpacing: 0.8, marginBottom: 4, display: "inline-block" }, children: trim.toUpperCase() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 24, color: T.warmBg, margin: "4px 0 0", fontWeight: 700, letterSpacing: 1 }, children: displayName.toUpperCase() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary }, children: [
              year,
              " ",
              make,
              " ",
              model
            ] })
          ] })
        ] }),
        specRows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 14px", borderTop: `1px solid ${T.charcoal}` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 10 }, children: "MODIFICATIONS" }),
          specRows.map((row, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "10px 0", borderTop: j > 0 ? `1px solid ${T.charcoal}` : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, flexShrink: 0 }, children: row.label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }, children: row.mod.value })
            ] }),
            row.mod.photo.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: row.mod.photo[0].url, alt: "", style: { width: "100%", height: 100, borderRadius: 6, objectFit: "cover", display: "block", marginTop: 8, border: `1px solid ${T.charcoal}` } }),
            row.mod.link && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, marginTop: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 11, color: T.copper }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: "View Product" })
            ] })
          ] }, j))
        ] }),
        hasCamper && (camperMake || camperModel) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 14px", borderTop: `1px solid ${T.charcoal}` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { size: 12, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "CAMPER" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: "Make / Model" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }, children: [camperMake, camperModel].filter(Boolean).join(" ") })
          ] }),
          camperPhoto.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginTop: 6 }, children: camperPhoto.map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", style: { width: 60, height: 60, borderRadius: 6, objectFit: "cover", border: `1px solid ${T.charcoal}` } }, pi)) }),
          camperLink && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, marginTop: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 11, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }, children: "View Product" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          onClick: () => setShareToFeed(!shareToFeed),
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.darkCard, borderRadius: 10, cursor: "pointer", marginBottom: 20, border: shareToFeed ? `1px solid ${T.red}40` : `1px solid ${T.charcoal}` },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 18, color: shareToFeed ? T.red : T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }, children: "Share to Feed" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: shareToFeed ? "Your build will appear in the community feed" : "Only visible on your profile" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 44, height: 24, borderRadius: 12, background: shareToFeed ? T.red : T.charcoal, position: "relative", transition: "background 0.2s" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: shareToFeed ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" } }) })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            onClick: () => setShowPreview(false),
            style: { flex: 1, padding: "14px", borderRadius: 10, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, letterSpacing: 0.5 },
            children: "EDIT"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            onClick: handleSave,
            style: { flex: 2, padding: "14px", borderRadius: 10, background: T.red, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 1 },
            children: shareToFeed ? "SAVE & SHARE" : "SAVE BUILD"
          }
        )
      ] })
    ] });
    return showPreview ? previewView : formView;
  }
  function ProfileScreen({ onViewUser, onLogout, userBuilds, onAddBuild, onUpdateBuild, onDeleteBuild, profilePic, onSetProfilePic, notifPrefs, onSetNotifPrefs, feedItems, onDeletePost, onEditPost, onGoToPost, myPoints: myPointsProp }) {
    const [isPublic, setIsPublic] = (0, import_react4.useState)(true);
    const [activeTab, setActiveTab] = (0, import_react4.useState)("builds");
    const [activeBuild, setActiveBuild] = (0, import_react4.useState)(0);
    const [showAddBuild, setShowAddBuild] = (0, import_react4.useState)(false);
    const [editingBuild, setEditingBuild] = (0, import_react4.useState)(null);
    const [expandedProfileBuild, setExpandedProfileBuild] = (0, import_react4.useState)(false);
    const [deleteBuildConfirm, setDeleteBuildConfirm] = (0, import_react4.useState)(null);
    const [carouselImages, setCarouselImages] = (0, import_react4.useState)(null);
    const [carouselIndex, setCarouselIndex] = (0, import_react4.useState)(0);
    const [showSettings, setShowSettings] = (0, import_react4.useState)(false);
    const [showNotifSettings, setShowNotifSettings] = (0, import_react4.useState)(false);
    const [userName, setUserName] = (0, import_react4.useState)("Kyle Morrison");
    const [userHandle, setUserHandle] = (0, import_react4.useState)("@KyleLPO");
    const [userBio, setUserBio] = (0, import_react4.useState)("");
    const profilePicRef = (0, import_react4.useRef)(null);
    const settingsPicRef = (0, import_react4.useRef)(null);
    const handleProfilePicUpload = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        onSetProfilePic && onSetProfilePic(ev.target.result);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    };
    const collectAndOpenCarousel = (build, startIdx) => {
      const imgs = [];
      const bd = build.buildData;
      if (bd && bd.mainPhotos) bd.mainPhotos.forEach((p) => imgs.push(p.url));
      else if (build.image) imgs.push(build.image);
      if (bd) {
        [bd.suspension, bd.tires, bd.wheels, bd.bumpers, bd.armor, bd.lighting, bd.rack, bd.winch, bd.otherMods].forEach((mod) => {
          if (mod && mod.photo) mod.photo.forEach((p) => imgs.push(p.url));
        });
        if (bd.camperPhoto) bd.camperPhoto.forEach((p) => imgs.push(p.url));
      }
      if (imgs.length > 0) {
        setCarouselImages(imgs);
        setCarouselIndex(startIdx != null && startIdx < imgs.length ? startIdx : 0);
      }
    };
    const user = {
      name: userName,
      handle: userHandle,
      followers: 847,
      following: 234,
      points: myPointsProp || 12450,
      joinDate: "Mar 2025"
    };
    const defaultBuilds = [
      { name: "THE HIGHLANDER", vehicle: "2022 Toyota Tundra", tags: ["V8 OVERLAND", "CLASS 4 READY"], miles: "2,482", elevation: "84K ft", routes: 34 },
      { name: "DESERT HAWK", vehicle: "2019 Jeep Gladiator", tags: ["TRAIL RATED", "EXPO READY"], miles: "1,120", elevation: "42K ft", routes: 18 }
    ];
    const mappedUserBuilds = (userBuilds || []).map((b) => ({
      id: b.id,
      name: b.name || "UNNAMED BUILD",
      vehicle: `${b.year || ""} ${b.make || ""} ${b.model || ""}`.trim(),
      tags: b.tags || [],
      miles: "0",
      elevation: "0 ft",
      routes: 0,
      image: b.heroImg || null,
      buildData: b.buildData || null,
      isUserBuild: true
    }));
    const builds = [...defaultBuilds, ...mappedUserBuilds];
    const trips = [
      { name: "Shadow Peak Traverse", date: "Oct 12, 2025", distance: "42.5 mi", grade: 7, build: "THE HIGHLANDER" },
      { name: "Eagle Rim Loop", date: "Oct 8, 2025", distance: "38.0 mi", grade: 5, build: "THE HIGHLANDER" },
      { name: "Baja Norte Expedition", date: "Sep 22, 2025", distance: "286 mi", grade: 4, build: "DESERT HAWK" },
      { name: "Rubicon Trail", date: "Sep 5, 2025", distance: "22 mi", grade: 9, build: "THE HIGHLANDER" }
    ];
    const [editingPost, setEditingPost] = (0, import_react4.useState)(null);
    const [editPostText, setEditPostText] = (0, import_react4.useState)("");
    const [deleteConfirmId, setDeleteConfirmId] = (0, import_react4.useState)(null);
    const userPosts = (feedItems || []).filter((p) => p.user === "KyleLPO");
    const staticActivity = [
      { type: "forum", title: "Best budget lift kit for 3rd Gen Tacoma?", time: "5 days ago", replies: 47, category: "FORUM REPLY" },
      { type: "forum", title: "Custom skid plate fabrication \u2014 my walkthrough", time: "2 weeks ago", replies: 89, category: "FORUM POST" },
      { type: "forum", title: "ARB bumper install tips for 200 Series", time: "1 month ago", replies: 56, category: "FORUM REPLY" }
    ];
    const activity = [
      ...userPosts.map((p) => ({ type: "post", title: p.title, time: p.time, likes: p.likes, comments: p.comments, category: p.type, feedId: p.id, isOwn: true })),
      ...staticActivity
    ];
    const pendingRequests = [
      { name: "TrailRunner_88", badge: "Scout" },
      { name: "MountainGoat", badge: "Explorer" }
    ];
    const tabs = ["builds", "trips", "activity"];
    if (showAddBuild || editingBuild) {
      const isEdit = !!editingBuild;
      const closeForm = () => {
        setShowAddBuild(false);
        setEditingBuild(null);
      };
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 0" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: closeForm, style: { background: T.darkCard, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 18, color: T.white }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 18, color: T.white, margin: 0, fontWeight: 700 }, children: isEdit ? "Edit Build" : "Add New Build" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: isEdit ? "Update your vehicle and mod details" : "Enter your vehicle and mod details" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          AddBuildForm,
          {
            onClose: closeForm,
            initialData: isEdit ? editingBuild.buildData : void 0,
            onSave: (data) => {
              if (isEdit) {
                onUpdateBuild && onUpdateBuild(editingBuild.id, data);
              } else {
                onAddBuild && onAddBuild(data);
              }
              closeForm();
            }
          },
          isEdit ? editingBuild.id : "new"
        )
      ] });
    }
    if (showSettings) {
      const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none" };
      const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };
      const handleSettingsPic = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          onSetProfilePic && onSetProfilePic(ev.target.result);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
      };
      if (showNotifSettings) {
        const togglePref = (key) => onSetNotifPrefs && onSetNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
        const prefToggle = (label, desc, key, icon, iconColor) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${T.charcoal}` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, flex: 1 }, children: [
            import_react4.default.createElement(icon, { size: 16, color: iconColor }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: desc })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { onClick: () => togglePref(key), style: { width: 44, height: 24, borderRadius: 12, background: notifPrefs[key] ? T.green : T.charcoal, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: notifPrefs[key] ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" } }) })
        ] });
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 20px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShowNotifSettings(false), style: { background: T.darkCard, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 18, color: T.white }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 18, color: T.white, margin: 0, fontWeight: 700 }, children: "Notifications" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: "Choose what alerts you receive" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 12, padding: "4px 16px 0" }, children: [
              prefToggle("Likes", "When someone likes your posts or routes", "likes", Heart, T.red),
              prefToggle("Comments", "When someone comments on your posts", "comments", MessageCircle, T.copper),
              prefToggle("Replies", "When someone replies to your threads", "replies", MessageCircle, T.copper),
              prefToggle("Follows", "When someone follows you or requests to follow", "follows", UserPlus, T.green),
              prefToggle("Mentions", "When someone mentions you in a post or comment", "mentions", AtSign, T.copper)
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 16, background: T.darkCard, borderRadius: 12, padding: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, flex: 1 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { size: 16, color: T.copper }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: "Push Notifications" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: notifPrefs.push ? "Enabled \u2014 you'll receive alerts on this device" : typeof Notification === "undefined" ? "Not supported on this browser" : Notification.permission === "denied" ? "Blocked \u2014 enable in browser settings" : "Get notified even when the app is closed" })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { onClick: async () => {
                if (typeof Notification === "undefined") return;
                if (!notifPrefs.push) {
                  const perm = await Notification.requestPermission();
                  if (perm === "granted") {
                    onSetNotifPrefs && onSetNotifPrefs((prev) => ({ ...prev, push: true }));
                    new Notification("Trailhead", { body: "Push notifications enabled! You'll stay in the loop.", icon: "" });
                  }
                } else {
                  onSetNotifPrefs && onSetNotifPrefs((prev) => ({ ...prev, push: false }));
                }
              }, style: { width: 44, height: 24, borderRadius: 12, background: notifPrefs.push ? T.green : T.charcoal, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0, opacity: typeof Notification !== "undefined" && Notification.permission !== "denied" ? 1 : 0.4 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: notifPrefs.push ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" } }) })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 16, background: T.darkCard, borderRadius: 12, padding: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: "Mute All" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: "Temporarily silence all notifications" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { onClick: () => {
                const allOn = Object.entries(notifPrefs).filter(([k]) => k !== "push").every(([, v]) => v);
                const newVal = allOn ? { likes: false, comments: false, replies: false, follows: false, mentions: false, push: notifPrefs.push } : { likes: true, comments: true, replies: true, follows: true, mentions: true, push: notifPrefs.push };
                onSetNotifPrefs && onSetNotifPrefs(newVal);
              }, style: { width: 44, height: 24, borderRadius: 12, background: Object.entries(notifPrefs).filter(([k]) => k !== "push").every(([, v]) => !v) ? T.red : T.charcoal, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: Object.entries(notifPrefs).filter(([k]) => k !== "push").every(([, v]) => !v) ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" } }) })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary, textAlign: "center", marginTop: 16, lineHeight: 1.5 }, children: "Disabled notifications won't appear in your bell icon or notification panel. Push notifications require browser permission. You can always change these later." })
          ] })
        ] });
      }
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: settingsPicRef, type: "file", accept: "image/*", onChange: handleSettingsPic, style: { display: "none" } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 20px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShowSettings(false), style: { background: T.darkCard, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 18, color: T.white }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 18, color: T.white, margin: 0, fontWeight: 700 }, children: "Settings" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: "Manage your profile and preferences" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 12, padding: 20, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 14, color: T.copper }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "EDIT PROFILE" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", marginBottom: 20 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", display: "inline-block" }, children: [
                profilePic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: profilePic, alt: "", style: { width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${T.copper}` } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 72, height: 72, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `3px dashed ${T.copper}40` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 24, color: T.copper, strokeWidth: 1.2, style: { opacity: 0.5 } }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => settingsPicRef.current && settingsPicRef.current.click(), style: { position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%", background: T.copper, border: `2px solid ${T.darkCard}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 11, color: T.white }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => settingsPicRef.current && settingsPicRef.current.click(), style: { display: "block", margin: "8px auto 0", background: "none", border: "none", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 0.5 }, children: profilePic ? "CHANGE PHOTO" : "ADD PHOTO" }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 14 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "DISPLAY NAME" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: userName, onChange: (e) => setUserName(e.target.value), placeholder: "Your name", style: inputStyle })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 14 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "USERNAME" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: userHandle, onChange: (e) => setUserHandle(e.target.value), placeholder: "@username", style: inputStyle })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "BIO" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: userBio, onChange: (e) => setUserBio(e.target.value), placeholder: "Tell the community about yourself...", rows: 3, style: { ...inputStyle, resize: "vertical", fontFamily: serif, lineHeight: 1.5 } })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 12, padding: 16, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 14, color: T.copper }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "PRIVACY" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
                isPublic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { size: 16, color: T.green }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 16, color: T.copper }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: isPublic ? "Public Profile" : "Private Profile" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: isPublic ? "Anyone can see your builds and activity" : "Only approved followers can see your content" })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { onClick: () => setIsPublic(!isPublic), style: { width: 44, height: 24, borderRadius: 12, background: isPublic ? T.green : T.charcoal, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: isPublic ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" } }) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 12, overflow: "hidden", marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "16px 16px 12px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 14, color: T.copper }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "ACCOUNT" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setShowNotifSettings(true), style: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", borderTop: `1px solid ${T.charcoal}`, cursor: "pointer", textAlign: "left" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 16, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, display: "block" }, children: "Notifications" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: "Manage push and in-app alerts" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16, color: T.tertiary })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { style: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", borderTop: `1px solid ${T.charcoal}`, cursor: "pointer", textAlign: "left" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 16, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, display: "block" }, children: "Blocked Users" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: "Manage blocked accounts" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16, color: T.tertiary })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: onLogout, style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 10, background: `${T.red}12`, border: `1px solid ${T.red}25`, cursor: "pointer" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 16, color: T.red }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.red, fontWeight: 600, letterSpacing: 0.5 }, children: "SIGN OUT" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", marginTop: 20 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: "TRAILHEAD v1.0" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 10, color: T.tertiary, display: "block", marginTop: 4 }, children: [
              "Member since ",
              user.joinDate
            ] })
          ] })
        ] })
      ] });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
      carouselImages && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageCarousel, { images: carouselImages, startIndex: carouselIndex, onClose: () => setCarouselImages(null) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: profilePicRef, type: "file", accept: "image/*", onChange: handleProfilePicUpload, style: { display: "none" } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "24px 16px 0", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", display: "inline-block", marginBottom: 12 }, children: [
          profilePic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: profilePic, alt: "", style: { width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${T.red}` } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 80, height: 80, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${T.red}` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 28, fontWeight: 700, color: T.white }, children: "K" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => profilePicRef.current && profilePicRef.current.click(), style: { position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%", background: T.charcoal, border: `2px solid ${T.darkCard}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 12, color: T.white }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 20, color: T.white, margin: "0 0 2px", fontWeight: 700 }, children: user.name }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.tertiary, display: "block", marginBottom: 4 }, children: user.handle }),
        (() => {
          const rank = getUserRank(user.points);
          const RIcon = RANK_ICON_MAP[rank.icon] || Star;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "inline-flex", alignItems: "center", gap: 5, background: `${rank.color}18`, padding: "4px 12px", borderRadius: 12, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RIcon, { size: 13, color: rank.color, strokeWidth: 1.5 }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: rank.color, letterSpacing: 1, fontWeight: 600 }, children: rank.name.toUpperCase() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 9, color: `${rank.color}90`, marginLeft: 2 }, children: [
              user.points.toLocaleString(),
              " pts"
            ] })
          ] });
        })(),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700, display: "block" }, children: user.followers }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: "FOLLOWERS" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, background: T.charcoal } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700, display: "block" }, children: user.following }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: "FOLLOWING" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, background: T.charcoal } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, color: T.copper, fontWeight: 700, display: "block" }, children: user.points.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: "POINTS" })
          ] })
        ] }),
        (() => {
          const [tappedBadge, setTappedBadge] = import_react4.default.useState(null);
          const earned = BADGE_CATEGORIES.map((cat) => {
            const info = getBadgeTierForCategory(cat.name);
            if (info.tier < 0) return null;
            return { cat, info };
          }).filter(Boolean);
          if (earned.length === 0) return null;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }, children: earned.map(({ cat, info }, i) => {
            const CatIcon = cat.icon;
            const isActive = tappedBadge === cat.name;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  onClick: () => setTappedBadge(isActive ? null : cat.name),
                  style: { width: 38, height: 38, borderRadius: "50%", background: `${info.color}20`, border: `2px solid ${info.color}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.15s", transform: isActive ? "scale(1.15)" : "scale(1)" },
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatIcon, { size: 16, color: info.color, strokeWidth: 2 })
                }
              ),
              isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: info.color, fontWeight: 600, textAlign: "center", maxWidth: 60, lineHeight: 1.2 }, children: info.name })
            ] }, cat.name);
          }) }) });
        })(),
        userBio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.warmBg, margin: "0 0 12px", lineHeight: 1.5, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }, children: userBio }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setShowSettings(true), style: { display: "flex", alignItems: "center", gap: 6, background: T.darkCard, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 14, color: T.tertiary }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, letterSpacing: 1, fontWeight: 600 }, children: "SETTINGS" })
        ] }) }),
        !isPublic && pendingRequests.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.copper}15`, borderRadius: 10, padding: 14, marginBottom: 16, textAlign: "left" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 14, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, letterSpacing: 1, fontWeight: 600 }, children: [
              "FOLLOW REQUESTS (",
              pendingRequests.length,
              ")"
            ] })
          ] }),
          pendingRequests.map((req, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i > 0 ? `1px solid ${T.charcoal}` : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 32, height: 32, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }, children: req.name[0] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600 }, children: req.name }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, display: "block" }, children: req.badge })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: { background: T.red, color: T.white, fontFamily: sans, fontSize: 10, padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 0.5, fontWeight: 600 }, children: "ACCEPT" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: { background: "none", color: T.tertiary, fontFamily: sans, fontSize: 10, padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.charcoal}`, cursor: "pointer", letterSpacing: 0.5 }, children: "DENY" })
          ] }, i))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", borderBottom: `1px solid ${T.charcoal}`, margin: "0 16px", marginBottom: 16 }, children: tabs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setActiveTab(t), style: { flex: 1, background: "none", border: "none", cursor: "pointer", padding: "12px 0 10px", borderBottom: activeTab === t ? `2px solid ${T.red}` : "2px solid transparent", transition: "all 0.2s" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: activeTab === t ? T.white : T.tertiary, letterSpacing: 1.5, fontWeight: 600 }, children: t.toUpperCase() }) }, t)) }),
      activeTab === "builds" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "th-hscroll", style: { display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }, children: [
          builds.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setActiveBuild(i), style: { padding: "10px 16px", borderRadius: 8, background: activeBuild === i ? `${T.red}20` : T.darkCard, border: activeBuild === i ? `1px solid ${T.red}40` : "1px solid transparent", cursor: "pointer", whiteSpace: "nowrap", minWidth: 0, flexShrink: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: activeBuild === i ? T.red : T.white, fontWeight: 600, display: "block" }, children: b.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: b.vehicle })
          ] }, i)),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setShowAddBuild(true), style: { padding: "10px 16px", borderRadius: 8, background: T.darkCard, border: `1px dashed ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14, color: T.tertiary }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: "Add Build" })
          ] })
        ] }),
        builds[activeBuild] && (() => {
          const ab = builds[activeBuild];
          const bd = ab.buildData;
          const isExp = expandedProfileBuild;
          const profSpecRow = (label, mod) => {
            if (!mod || !mod.value) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.charcoal}20` }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary, flexShrink: 0, minWidth: 70 }, children: label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, textAlign: "right" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.white }, children: mod.value }),
                mod.photo && mod.photo.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: mod.photo[0].url, alt: "", onClick: (e) => {
                  e.stopPropagation();
                  collectAndOpenCarousel(ab);
                }, style: { width: 36, height: 36, borderRadius: 6, objectFit: "cover", marginLeft: 8, verticalAlign: "middle", cursor: "pointer" } }),
                mod.link && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: ensureUrl(mod.link), target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), style: { fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 9 }),
                  " View Product"
                ] }) })
              ] })
            ] });
          };
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, overflow: "hidden" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { onClick: () => setExpandedProfileBuild(!isExp), style: { cursor: "pointer", position: "relative" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { height: 160, background: ab.image ? "none" : `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}30 100%)`, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }, children: [
              ab.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: ab.image, alt: "", onClick: (e) => {
                  e.stopPropagation();
                  collectAndOpenCarousel(ab);
                }, style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(transparent 20%, rgba(0,0,0,0.75))", pointerEvents: "none" } })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 60, color: T.tertiary, strokeWidth: 0.2, style: { opacity: 0.08 } }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", padding: 16, pointerEvents: "none" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginBottom: 6 }, children: ab.tags.map((tag, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.warmBg, background: "#3D3D3A", padding: "3px 8px", borderRadius: 4, letterSpacing: 1 }, children: tag }, j)) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 28, color: T.warmBg, margin: 0, fontWeight: 700, letterSpacing: 1 }, children: ab.name }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary }, children: ab.vehicle })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 10, right: 10, background: `${T.darkBg}CC`, padding: "5px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 12, color: T.warmBg, style: { transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.warmBg, letterSpacing: 0.5 }, children: isExp ? "COLLAPSE" : "VIEW BUILD" })
              ] })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderTop: `1px solid ${T.charcoal}` }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "14px 16px", textAlign: "center", borderRight: `1px solid ${T.charcoal}` }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 2 }, children: "TRAIL MILES" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700 }, children: ab.miles })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "14px 16px", textAlign: "center", borderRight: `1px solid ${T.charcoal}` }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 2 }, children: "ELEVATION" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700 }, children: ab.elevation })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "14px 16px", textAlign: "center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 2 }, children: "ROUTES" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700 }, children: ab.routes })
              ] })
            ] }),
            isExp && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderTop: `1px solid ${T.charcoal}`, padding: "12px 16px" }, children: [
              bd ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 8 }, children: "BUILD SPECS" }),
                profSpecRow("Suspension", bd.suspension),
                profSpecRow("Tires", bd.tires),
                profSpecRow("Wheels", bd.wheels),
                profSpecRow("Bumpers", bd.bumpers),
                profSpecRow("Armor", bd.armor),
                profSpecRow("Lighting", bd.lighting),
                profSpecRow("Rack/Storage", bd.rack),
                profSpecRow("Winch", bd.winch),
                profSpecRow("Other Mods", bd.otherMods),
                bd.hasCamper && (bd.camperMake || bd.camperModel) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "10px 0" } }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { size: 12, color: T.copper }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }, children: "CAMPER" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: "Setup" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }, children: [
                      bd.camperMake,
                      " ",
                      bd.camperModel
                    ] })
                  ] }),
                  bd.camperPhoto && bd.camperPhoto.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginTop: 6 }, children: bd.camperPhoto.map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", onClick: (e) => {
                    e.stopPropagation();
                    collectAndOpenCarousel(ab, 0);
                  }, style: { width: 56, height: 56, borderRadius: 6, objectFit: "cover", cursor: "pointer" } }, pi)) }),
                  bd.camperLink && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: ensureUrl(bd.camperLink), target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), style: { fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 9 }),
                    " View Product"
                  ] }) })
                ] }),
                bd.mainPhotos && bd.mainPhotos.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "10px 0" } }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, display: "block", marginBottom: 8 }, children: "PHOTOS" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }, children: bd.mainPhotos.map((p, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: "", onClick: () => collectAndOpenCarousel(ab, pi), style: { width: 68, height: 68, borderRadius: 8, objectFit: "cover", flexShrink: 0, cursor: "pointer" } }, pi)) })
                ] })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary }, children: "No detailed specs available for this build." }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: T.charcoal, margin: "12px 0" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
                ab.isUserBuild && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setEditingBuild({ id: ab.id, buildData: bd }), style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, background: `${T.copper}18`, border: `1px solid ${T.copper}30`, cursor: "pointer" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 14, color: T.copper }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600, letterSpacing: 0.5 }, children: "EDIT BUILD" })
                ] }),
                ab.isUserBuild && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setDeleteBuildConfirm(deleteBuildConfirm === ab.id ? null : ab.id), style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 14px", borderRadius: 8, background: `${T.red}18`, border: `1px solid ${T.red}30`, cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14, color: T.red }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
                }, style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, background: T.charcoal, border: "none", cursor: "pointer" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 14, color: T.white }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "SHARE" })
                ] })
              ] }),
              deleteBuildConfirm === ab.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.red}15`, border: `1px solid ${T.red}40`, borderRadius: 8, padding: 12, marginTop: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 12, color: T.white, margin: "0 0 8px" }, children: "Delete this build? This can't be undone." }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
                    onDeleteBuild && onDeleteBuild(ab.id);
                    setDeleteBuildConfirm(null);
                    setExpandedProfileBuild(false);
                  }, style: { padding: "6px 14px", borderRadius: 6, background: T.red, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "Delete" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setDeleteBuildConfirm(null), style: { padding: "6px 14px", borderRadius: 6, background: T.charcoal, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.tertiary, fontWeight: 600, letterSpacing: 0.5 }, children: "Cancel" })
                ] })
              ] })
            ] })
          ] });
        })()
      ] }),
      activeTab === "trips" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: trips.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { width: 44, height: 44, borderRadius: 10, background: T.charcoal, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mountain, { size: 16, color: T.copper, strokeWidth: 1.5 }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 8, color: T.tertiary, marginTop: 2 }, children: [
            "G",
            t.grade
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block", marginBottom: 2 }, children: t.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: t.date }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper }, children: t.distance })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, background: T.charcoal, padding: "4px 8px", borderRadius: 4 }, children: t.build })
      ] }, i)) }) }),
      activeTab === "activity" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: activity.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, padding: "14px 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: a.type === "forum" ? T.copper : T.red, background: a.type === "forum" ? `${T.copper}18` : `${T.red}18`, padding: "3px 8px", borderRadius: 4, letterSpacing: 1, fontWeight: 600 }, children: a.category }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: formatPostTime(a.time) }),
          a.isOwn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginLeft: "auto", display: "flex", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
              setEditingPost(a.feedId);
              setEditPostText(a.title);
              setDeleteConfirmId(null);
            }, style: { background: "none", border: "none", cursor: "pointer", padding: 2 }, title: "Edit", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 13, color: T.tertiary }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
              setDeleteConfirmId(deleteConfirmId === a.feedId ? null : a.feedId);
              setEditingPost(null);
            }, style: { background: "none", border: "none", cursor: "pointer", padding: 2 }, title: "Delete", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13, color: T.tertiary }) })
          ] })
        ] }),
        editingPost === a.feedId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: editPostText, onChange: (e) => setEditPostText(e.target.value), style: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, background: T.darkBg, border: `1px solid ${T.copper}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", resize: "vertical", minHeight: 60, lineHeight: 1.5 } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, marginTop: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
              onEditPost && onEditPost(a.feedId, editPostText.trim());
              setEditingPost(null);
            }, style: { padding: "6px 14px", borderRadius: 6, background: T.green, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "Save" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setEditingPost(null), style: { padding: "6px 14px", borderRadius: 6, background: T.charcoal, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.tertiary, fontWeight: 600, letterSpacing: 0.5 }, children: "Cancel" })
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 8px", lineHeight: 1.4 }, children: a.title }),
        deleteConfirmId === a.feedId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.red}15`, border: `1px solid ${T.red}40`, borderRadius: 8, padding: 12, marginBottom: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 12, color: T.white, margin: "0 0 8px" }, children: "Delete this post? This can't be undone." }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
              onDeletePost && onDeletePost(a.feedId);
              setDeleteConfirmId(null);
            }, style: { padding: "6px 14px", borderRadius: 6, background: T.red, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "Delete" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setDeleteConfirmId(null), style: { padding: "6px 14px", borderRadius: 6, background: T.charcoal, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.tertiary, fontWeight: 600, letterSpacing: 0.5 }, children: "Cancel" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
          a.likes !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 12, color: T.tertiary, strokeWidth: 1.5 }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: a.likes >= 1e3 ? (a.likes / 1e3).toFixed(1) + "K" : a.likes })
          ] }),
          a.comments !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 12, color: T.tertiary, strokeWidth: 1.5 }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: a.comments })
          ] }),
          a.replies !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 12, color: T.tertiary, strokeWidth: 1.5 }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
              a.replies,
              " replies"
            ] })
          ] }),
          a.isOwn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => onGoToPost && onGoToPost(a.feedId), style: { marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 0" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600, letterSpacing: 0.5 }, children: "VIEW POST" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 12, color: T.copper })
          ] })
        ] })
      ] }, a.feedId || i)) }) })
    ] });
  }
  function OtherProfileScreen({ userId, onBack, onMessage }) {
    const [followState, setFollowState] = (0, import_react4.useState)("none");
    const [activeTab, setActiveTab] = (0, import_react4.useState)("builds");
    const profiles = {
      "Overland_Expert": {
        name: "Overland Expert",
        handle: "@Overland_Expert",
        badge: "Master Builder",
        followers: 2340,
        following: 412,
        points: 32100,
        isPublic: true,
        initial: "O",
        builds: [{ name: "PROJECT VULCAN", vehicle: "2022 Tacoma", tags: ["TACOMA 22", '35" TIRES'], miles: "3,800", elevation: "112K ft", routes: 56 }],
        trips: [{ name: "Mojave Crossing", date: "Oct 1, 2025", distance: "180 mi", grade: 6 }],
        activity: [{ type: "post", title: "Stage 3 Suspension Complete", time: "3d ago", likes: 1200, comments: 84, category: "BUILD" }]
      },
      "DesertRat_4x4": {
        name: "DesertRat 4x4",
        handle: "@DesertRat_4x4",
        badge: "Navigator",
        followers: 1580,
        following: 320,
        points: 18400,
        isPublic: true,
        initial: "D",
        builds: [{ name: "SANDSTORM", vehicle: "2020 4Runner TRD Pro", tags: ["TRD PRO", "LONG TRAVEL"], miles: "5,200", elevation: "98K ft", routes: 72 }],
        trips: [{ name: "Black Rock Desert Expedition", date: "Oct 14, 2025", distance: "320 mi", grade: 5 }],
        activity: [{ type: "post", title: "Black Rock Desert Expedition convoy forming", time: "1d ago", likes: 42, comments: 8, category: "CONVOY" }]
      },
      "private_user": {
        name: "Ghost Rider",
        handle: "@GhostRider_OHV",
        badge: "Scout",
        followers: 89,
        following: 45,
        points: 2100,
        isPublic: false,
        initial: "G",
        builds: [],
        trips: [],
        activity: []
      }
    };
    const p = profiles[userId] || profiles["Overland_Expert"];
    const isPrivateAndNotFollowing = !p.isPublic && followState !== "following";
    const handleFollow = () => {
      if (followState === "none") {
        setFollowState(p.isPublic ? "following" : "requested");
      } else if (followState === "following") {
        setFollowState("none");
      } else if (followState === "requested") {
        setFollowState("none");
      }
    };
    const tabs = ["builds", "trips", "activity"];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "24px 16px 0", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", display: "inline-block", marginBottom: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 80, height: 80, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${p.isPublic ? T.copper : T.tertiary}` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 28, fontWeight: 700, color: T.white }, children: p.initial }) }),
          !p.isPublic && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: "50%", background: T.charcoal, border: `2px solid ${T.darkCard}`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 10, color: T.copper }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 20, color: T.white, margin: "0 0 2px", fontWeight: 700 }, children: p.name }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.tertiary, display: "block", marginBottom: 4 }, children: p.handle }),
        (() => {
          const rank = getUserRank(p.points);
          const RIcon = RANK_ICON_MAP[rank.icon] || Star;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "inline-flex", alignItems: "center", gap: 5, background: `${rank.color}18`, padding: "4px 12px", borderRadius: 12, marginBottom: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RIcon, { size: 13, color: rank.color, strokeWidth: 1.5 }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: rank.color, letterSpacing: 1, fontWeight: 600 }, children: rank.name.toUpperCase() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 9, color: `${rank.color}90`, marginLeft: 2 }, children: [
              p.points.toLocaleString(),
              " pts"
            ] })
          ] });
        })(),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: handleFollow, style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 24px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1,
            border: "none",
            transition: "all 0.2s",
            background: followState === "none" ? T.red : followState === "requested" ? T.darkCard : T.darkCard,
            color: followState === "none" ? T.white : followState === "requested" ? T.copper : T.green,
            ...followState !== "none" ? { border: `1px solid ${followState === "requested" ? T.copper : T.green}40` } : {}
          }, children: [
            followState === "none" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { size: 14 }),
              " FOLLOW"
            ] }),
            followState === "requested" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 14 }),
              " REQUESTED"
            ] }),
            followState === "following" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCheck, { size: 14 }),
              " FOLLOWING"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => onMessage && onMessage(userId), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: 1, background: T.darkCard, border: `1px solid ${T.copper}40`, color: T.copper, transition: "all 0.2s" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: 14 }),
            " MESSAGE"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700, display: "block" }, children: p.followers.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: "FOLLOWERS" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, background: T.charcoal } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700, display: "block" }, children: p.following.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: "FOLLOWING" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 1, background: T.charcoal } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, color: T.copper, fontWeight: 700, display: "block" }, children: p.points.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: "POINTS" })
          ] })
        ] }),
        (() => {
          const [tappedBadge, setTappedBadge] = import_react4.default.useState(null);
          const pts = p.points || 1500;
          const simBadges = BADGE_CATEGORIES.map((cat) => {
            const seed = (p.name || "").length + cat.name.length;
            const tierIdx = pts > 3e4 ? Math.min(seed % 4, cat.tiers.length - 1) : pts > 1e4 ? Math.min(seed % 3, cat.tiers.length - 1) : pts > 3e3 ? Math.min(seed % 2, cat.tiers.length - 1) : seed % 3 === 0 ? 0 : -1;
            if (tierIdx < 0) return null;
            const color = BADGE_TIER_COLORS[Math.min(tierIdx, BADGE_TIER_COLORS.length - 1)];
            return { cat, tierIdx, color, tierName: cat.tiers[tierIdx].name };
          }).filter(Boolean);
          if (simBadges.length === 0) return null;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }, children: simBadges.map(({ cat, tierIdx, color, tierName }) => {
            const CatIcon = cat.icon;
            const isActive = tappedBadge === cat.name;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  onClick: () => setTappedBadge(isActive ? null : cat.name),
                  style: { width: 34, height: 34, borderRadius: "50%", background: `${color}20`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.15s", transform: isActive ? "scale(1.15)" : "scale(1)" },
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatIcon, { size: 14, color, strokeWidth: 2 })
                }
              ),
              isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color, fontWeight: 600, textAlign: "center", maxWidth: 60, lineHeight: 1.2 }, children: tierName })
            ] }, cat.name);
          }) }) });
        })()
      ] }),
      isPrivateAndNotFollowing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "40px 16px", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 40, color: T.tertiary, strokeWidth: 1, style: { marginBottom: 12, opacity: 0.5 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 16, color: T.white, margin: "0 0 6px" }, children: "This Account is Private" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: 0, lineHeight: 1.6, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }, children: "Follow this explorer to see their builds, trips, and activity on Trailhead." })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", borderBottom: `1px solid ${T.charcoal}`, margin: "0 16px", marginBottom: 16 }, children: tabs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setActiveTab(t), style: { flex: 1, background: "none", border: "none", cursor: "pointer", padding: "12px 0 10px", borderBottom: activeTab === t ? `2px solid ${T.red}` : "2px solid transparent" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: activeTab === t ? T.white : T.tertiary, letterSpacing: 1.5, fontWeight: 600 }, children: t.toUpperCase() }) }, t)) }),
        activeTab === "builds" && p.builds.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, margin: "0 16px", overflow: "hidden" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { height: 140, background: `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}30 100%)`, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 50, color: T.tertiary, strokeWidth: 0.2, style: { opacity: 0.08 } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", padding: 16 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6, marginBottom: 4 }, children: b.tags.map((tag, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.warmBg, background: "#3D3D3A", padding: "3px 8px", borderRadius: 4, letterSpacing: 1 }, children: tag }, j)) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 24, color: T.warmBg, margin: 0, fontWeight: 700 }, children: b.name }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary }, children: b.vehicle })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${T.charcoal}` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 12, textAlign: "center", borderRight: `1px solid ${T.charcoal}` }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "MILES" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }, children: b.miles })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 12, textAlign: "center", borderRight: `1px solid ${T.charcoal}` }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "ELEVATION" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }, children: b.elevation })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 12, textAlign: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }, children: "ROUTES" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }, children: b.routes })
            ] })
          ] })
        ] }, i)),
        activeTab === "trips" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }, children: p.trips.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 44, height: 44, borderRadius: 10, background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mountain, { size: 16, color: T.copper, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }, children: t.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: [
              t.date,
              " \u2014 ",
              t.distance
            ] })
          ] })
        ] }, i)) }),
        activeTab === "activity" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }, children: p.activity.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, padding: "14px 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.red, background: `${T.red}18`, padding: "3px 8px", borderRadius: 4, letterSpacing: 1 }, children: a.category }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: formatPostTime(a.time) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 6px" }, children: a.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12 }, children: [
            a.likes !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { size: 12, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: a.likes >= 1e3 ? (a.likes / 1e3).toFixed(1) + "K" : a.likes })
            ] }),
            a.comments !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 12, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: a.comments })
            ] })
          ] })
        ] }, i)) })
      ] })
    ] });
  }
  function LoginScreen({ onLogin, onGoToSignup }) {
    const [email, setEmail] = (0, import_react4.useState)("");
    const [password, setPassword] = (0, import_react4.useState)("");
    const [showPassword, setShowPassword] = (0, import_react4.useState)(false);
    const [error, setError] = (0, import_react4.useState)("");
    const handleSubmit = () => {
      if (!email.trim()) return setError("Enter your email to continue.");
      if (!password) return setError("Enter your password.");
      setError("");
      onLogin();
    };
    const inputStyle = {
      width: "100%",
      boxSizing: "border-box",
      padding: "14px 16px",
      borderRadius: 8,
      background: T.darkCard,
      border: `1px solid ${T.charcoal}`,
      color: T.white,
      fontFamily: serif,
      fontSize: 14,
      outline: "none",
      transition: "border 0.2s"
    };
    const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: T.charcoal, height: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "th-scroll", style: { flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "48px 24px 32px", textAlign: "center", flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mountain, { size: 28, color: T.red, strokeWidth: 1.5 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { style: { fontFamily: sans, fontSize: 28, color: T.white, margin: "0 0 4px", fontWeight: 700, letterSpacing: 4 }, children: "TRAILHEAD" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 3 }, children: "BY LONE PEAK OVERLAND" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "16px auto 0", maxWidth: 280, lineHeight: 1.6 }, children: "Your overlanding community. Routes, builds, convoys, and recovery \u2014 all in one place." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 24px 32px", flex: 1 }, children: [
        error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.red}15`, border: `1px solid ${T.red}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14, color: T.red }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.red }, children: error })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "EMAIL" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "PASSWORD" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Enter your password", style: { ...inputStyle, paddingRight: 44 }, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShowPassword(!showPassword), style: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 16, color: T.tertiary }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 16, color: T.tertiary }) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { textAlign: "right", marginBottom: 24 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, cursor: "pointer" }, children: "Forgot password?" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: handleSubmit, style: { width: "100%", padding: "14px 0", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, fontWeight: 600, color: T.white, letterSpacing: 1.5 }, children: "SIGN IN" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, height: 1, background: T.charcoal } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: "OR" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, height: 1, background: T.charcoal } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { style: { width: "100%", padding: "12px 0", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z", fill: "#4285F4" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z", fill: "#FBBC05" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "Continue with Google" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { style: { width: "100%", padding: "12px 0", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "#FFFFFF", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "Continue with Apple" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary }, children: "New to the trail? " }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: onGoToSignup, style: { fontFamily: sans, fontSize: 13, color: T.red, fontWeight: 600, cursor: "pointer" }, children: "Create an account" })
        ] })
      ] })
    ] }) });
  }
  function SignupScreen({ onSignup, onGoToLogin, onSetProfilePic }) {
    const [step, setStep] = (0, import_react4.useState)(1);
    const [form, setForm] = (0, import_react4.useState)({ name: "", email: "", handle: "", password: "", confirmPassword: "" });
    const [rig, setRig] = (0, import_react4.useState)({ year: "", make: "", model: "", buildName: "" });
    const [error, setError] = (0, import_react4.useState)("");
    const [showPassword, setShowPassword] = (0, import_react4.useState)(false);
    const [signupPic, setSignupPic] = (0, import_react4.useState)(null);
    const signupPicRef = (0, import_react4.useRef)(null);
    const handlePicUpload = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSignupPic(ev.target.result);
        onSetProfilePic && onSetProfilePic(ev.target.result);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    };
    const set = (key, val) => setForm({ ...form, [key]: val });
    const setR = (key, val) => setRig({ ...rig, [key]: val });
    const inputStyle = {
      width: "100%",
      boxSizing: "border-box",
      padding: "14px 16px",
      borderRadius: 8,
      background: T.darkCard,
      border: `1px solid ${T.charcoal}`,
      color: T.white,
      fontFamily: serif,
      fontSize: 14,
      outline: "none",
      transition: "border 0.2s"
    };
    const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };
    const handleStep1 = () => {
      if (!form.name.trim()) return setError("Enter your name.");
      if (!form.email.trim()) return setError("Enter your email.");
      if (!form.handle.trim()) return setError("Choose a username.");
      if (form.password.length < 6) return setError("Password must be at least 6 characters.");
      if (form.password !== form.confirmPassword) return setError("Passwords don't match.");
      setError("");
      setStep(2);
    };
    const handleFinish = () => {
      onSignup();
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: T.charcoal, height: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "th-scroll", style: { flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "40px 24px 24px", textAlign: "center", flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mountain, { size: 24, color: T.red, strokeWidth: 1.5 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { style: { fontFamily: sans, fontSize: 22, color: T.white, margin: "0 0 4px", fontWeight: 700, letterSpacing: 3 }, children: step === 1 ? "JOIN TRAILHEAD" : "SET UP YOUR PROFILE" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "8px auto 0", maxWidth: 300, lineHeight: 1.5 }, children: step === 1 ? "Create your account and join the overlanding community." : "Add a photo and your vehicle to personalize your experience. You can skip this for now." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 32, height: 3, borderRadius: 2, background: T.red } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 32, height: 3, borderRadius: 2, background: step >= 2 ? T.red : T.charcoal } })
        ] })
      ] }),
      step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 24px 32px", flex: 1 }, children: [
        error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.red}15`, border: `1px solid ${T.red}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14, color: T.red }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.red }, children: error })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 14 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "FULL NAME" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: form.name, onChange: (e) => set("name", e.target.value), placeholder: "Kyle Morrison", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 14 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "EMAIL" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "email", value: form.email, onChange: (e) => set("email", e.target.value), placeholder: "you@example.com", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 14 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "USERNAME" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: serif, fontSize: 14, color: T.tertiary }, children: "@" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: form.handle, onChange: (e) => set("handle", e.target.value), placeholder: "trailname", style: { ...inputStyle, paddingLeft: 32 }, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 14 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "PASSWORD" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: showPassword ? "text" : "password", value: form.password, onChange: (e) => set("password", e.target.value), placeholder: "At least 6 characters", style: { ...inputStyle, paddingRight: 44 }, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShowPassword(!showPassword), style: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 16, color: T.tertiary }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 16, color: T.tertiary }) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 24 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "CONFIRM PASSWORD" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "password", value: form.confirmPassword, onChange: (e) => set("confirmPassword", e.target.value), placeholder: "Re-enter your password", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: handleStep1, style: { width: "100%", padding: "14px 0", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, fontWeight: 600, color: T.white, letterSpacing: 1.5 }, children: "CONTINUE" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, height: 1, background: T.charcoal } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }, children: "OR" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, height: 1, background: T.charcoal } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { style: { width: "100%", padding: "12px 0", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z", fill: "#4285F4" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z", fill: "#FBBC05" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "Sign up with Google" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { style: { width: "100%", padding: "12px 0", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "#FFFFFF", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "Sign up with Apple" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary }, children: "Already have an account? " }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { onClick: onGoToLogin, style: { fontFamily: sans, fontSize: 13, color: T.red, fontWeight: 600, cursor: "pointer" }, children: "Sign in" })
        ] })
      ] }),
      step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 24px 32px", flex: 1 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: signupPicRef, type: "file", accept: "image/*", onChange: handlePicUpload, style: { display: "none" } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", display: "inline-block", marginBottom: 12 }, children: [
            signupPic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: signupPic, alt: "", style: { width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${T.copper}` } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 80, height: 80, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `3px dashed ${T.copper}40` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 28, color: T.copper, strokeWidth: 1.2, style: { opacity: 0.5 } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => signupPicRef.current && signupPicRef.current.click(), style: { position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%", background: T.copper, border: `2px solid ${T.darkCard}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14, color: T.white }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block", marginBottom: 2 }, children: "Add a Profile Photo" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: "Help others recognize you on the trail" }),
          !signupPic && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => signupPicRef.current && signupPicRef.current.click(), style: { display: "block", margin: "12px auto 0", padding: "8px 20px", borderRadius: 8, background: `${T.copper}20`, border: `1px solid ${T.copper}40`, cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600, letterSpacing: 0.5 }, children: "UPLOAD PHOTO" }) }),
          signupPic && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => signupPicRef.current && signupPicRef.current.click(), style: { display: "inline-block", margin: "10px auto 0", padding: "6px 14px", borderRadius: 6, background: "transparent", border: `1px solid ${T.charcoal}`, cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5 }, children: "CHANGE PHOTO" }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 12, padding: 20, marginBottom: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 40, height: 40, borderRadius: 10, background: `${T.red}15`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { size: 18, color: T.red }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }, children: "Your First Build" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: "You can add more vehicles later" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "BUILD NAME" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: rig.buildName, onChange: (e) => setR("buildName", e.target.value), placeholder: 'e.g. "The Highlander"', style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "YEAR" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: rig.year, onChange: (e) => setR("year", e.target.value), placeholder: "2022", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "MAKE" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: rig.make, onChange: (e) => setR("make", e.target.value), placeholder: "Toyota", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "MODEL" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: rig.model, onChange: (e) => setR("model", e.target.value), placeholder: "Tundra TRD Pro", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { size: 16, color: T.green }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: "Public Profile" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: "Others can see your builds and activity" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 40, height: 22, borderRadius: 11, background: T.green, padding: 2, cursor: "pointer", display: "flex", alignItems: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 18, height: 18, borderRadius: "50%", background: T.white, marginLeft: 18, transition: "margin 0.2s" } }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: handleFinish, style: { width: "100%", padding: "14px 0", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", marginBottom: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 13, fontWeight: 600, color: T.white, letterSpacing: 1.5 }, children: "CREATE ACCOUNT" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: handleFinish, style: { width: "100%", padding: "12px 0", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.tertiary, letterSpacing: 0.5 }, children: "Skip for now" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 24px 24px", textAlign: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 10, color: T.textGray, lineHeight: 1.6 }, children: "By continuing you agree to Trailhead's Terms of Service and Privacy Policy" }) })
    ] }) });
  }
  function PhotoUploader({ photos, onChange, maxPhotos = 10, compact = false }) {
    const fileRef = (0, import_react4.useRef)(null);
    const handleFiles = (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      const allowed = files.slice(0, maxPhotos - photos.length);
      if (fileRef.current) fileRef.current.value = "";
      let loaded = 0;
      const results = [];
      allowed.forEach((file, idx) => {
        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          const blobUrl = URL.createObjectURL(file);
          results[idx] = { id: Date.now() + Math.random(), url: blobUrl, name: file.name, type: "video", caption: "" };
          loaded++;
          if (loaded === allowed.length) {
            onChange([...photos, ...results]);
          }
        } else {
          const reader = new FileReader();
          reader.onload = (ev) => {
            results[idx] = { id: Date.now() + Math.random(), url: ev.target.result, name: file.name, type: "image", caption: "" };
            loaded++;
            if (loaded === allowed.length) {
              onChange([...photos, ...results]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    };
    const removePhoto = (id) => {
      onChange(photos.filter((p) => p.id !== id));
    };
    const updateCaption = (id, caption) => {
      onChange(photos.map((p) => p.id === id ? { ...p, caption } : p));
    };
    if (compact) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: fileRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: handleFiles, style: { display: "none" } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => fileRef.current && fileRef.current.click(), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 20, color: T.tertiary }) }),
        photos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }, children: photos.length })
      ] });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: fileRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: handleFiles, style: { display: "none" } }),
      photos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }, children: photos.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { borderRadius: 10, overflow: "hidden", border: `1px solid ${T.charcoal}`, background: T.darkCard }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
          p.type === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: p.url, preload: "metadata", playsInline: true, controls: true, style: { width: "100%", maxHeight: 260, objectFit: "contain", display: "block", background: "#000" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4, pointerEvents: "none" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { size: 10, color: T.white }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, fontWeight: 600 }, children: "VIDEO" })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: p.name, style: { width: "100%", height: 200, objectFit: "cover", display: "block" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => removePhoto(p.id), style: { position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12, color: T.white }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "6px 10px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            value: p.caption || "",
            onChange: (e) => updateCaption(p.id, e.target.value),
            placeholder: "Add a caption...",
            style: { width: "100%", padding: "7px 10px", borderRadius: 6, background: T.darkBg, border: `1px solid ${T.charcoal}`, color: T.warmStone, fontFamily: serif, fontSize: 12, outline: "none", boxSizing: "border-box" },
            onFocus: (e) => e.target.style.borderColor = T.copper + "60",
            onBlur: (e) => e.target.style.borderColor = T.charcoal
          }
        ) })
      ] }, p.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
        if (photos.length < maxPhotos && fileRef.current) fileRef.current.click();
      }, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: T.darkCard, border: `1px dashed ${T.charcoal}`, borderRadius: 8, padding: "14px 16px", cursor: photos.length < maxPhotos ? "pointer" : "default", width: "100%", boxSizing: "border-box", opacity: photos.length < maxPhotos ? 1 : 0.5 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { size: 16, color: T.tertiary }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.tertiary }, children: photos.length > 0 ? `${photos.length} media added` : "Add photos / videos" }),
        photos.length < maxPhotos && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14, color: T.tertiary, style: { marginLeft: "auto" } })
      ] })
    ] });
  }
  function ComposeScreen({ onClose, onSubmit, onAddRecoveryAlert, onAddNotification, onAddRoute }) {
    const [postType, setPostType] = (0, import_react4.useState)(null);
    const [general, setGeneral] = (0, import_react4.useState)({ text: "", photos: [], location: "" });
    const [showLocationInput, setShowLocationInput] = (0, import_react4.useState)(false);
    const [geoLoading, setGeoLoading] = (0, import_react4.useState)(false);
    const [geoMsg, setGeoMsg] = (0, import_react4.useState)("");
    const [showRouteForm, setShowRouteForm] = (0, import_react4.useState)(false);
    const [route, setRoute] = (0, import_react4.useState)({ name: "", distance: "", time: "", elevation: "", difficulty: "Moderate", description: "", photos: [] });
    const [convoy, setConvoy] = (0, import_react4.useState)({ title: "", location: "", departDate: "", departTime: "", returnDate: "", returnTime: "", slots: "", description: "" });
    const [recovery, setRecovery] = (0, import_react4.useState)({ title: "", vehicle: "", description: "", urgency: "HIGH", location: "", coords: "" });
    const inputStyle = {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px 14px",
      borderRadius: 8,
      background: T.darkCard,
      border: `1px solid ${T.charcoal}`,
      color: T.white,
      fontFamily: serif,
      fontSize: 14,
      outline: "none",
      transition: "border 0.2s"
    };
    const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };
    const textareaStyle = { ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.6 };
    const types = [
      { key: "general", label: "Post", desc: "Share photos, updates, or trail stories", icon: Camera, color: T.copper },
      { key: "route", label: "Route", desc: "Upload a route with stats and GPS track", icon: Map, color: T.green },
      { key: "convoy", label: "Convoy / Event", desc: "Organize a group trip with dates and slots", icon: Users, color: T.copper },
      { key: "recovery", label: "Recovery Request", desc: "Request help from nearby overlanders", icon: TriangleAlert, color: T.red }
    ];
    const handleSubmit = () => {
      const id = "user_" + Date.now();
      let newPost = null;
      if (postType === "general") {
        if (!general.text.trim() && general.photos.length === 0) return;
        const hasPhotos = general.photos.length > 0;
        newPost = {
          id,
          type: hasPhotos ? "PHOTOS" : "POST",
          user: "KyleLPO",
          initial: "K",
          time: Date.now(),
          title: general.text.trim() || "New post",
          body: null,
          ...hasPhotos ? { photoCount: general.photos.length, photoUrls: general.photos.map((p) => p.url) } : {},
          ...general.location ? { location: general.location } : {},
          likes: 0,
          comments: 0
        };
      } else if (postType === "route") {
        if (!route.name.trim()) return;
        newPost = {
          id,
          type: "ROUTES",
          user: "KyleLPO",
          initial: "K",
          time: Date.now(),
          title: route.name,
          body: route.description || null,
          distance: route.distance || "\u2014",
          duration: route.time || "\u2014",
          badge: null,
          verified: 0,
          likes: 0,
          comments: 0
        };
      } else if (postType === "convoy") {
        if (!convoy.title.trim()) return;
        const d = convoy.departDate ? new Date(convoy.departDate) : null;
        newPost = {
          id,
          type: "CONVOYS",
          user: "KyleLPO",
          initial: "K",
          time: Date.now(),
          title: convoy.title,
          body: convoy.description || null,
          month: d ? d.toLocaleString("en", { month: "short" }).toUpperCase() : "TBD",
          day: d ? String(d.getDate()) : "\u2014",
          departs: convoy.departTime || "TBD",
          slots: parseInt(convoy.slots) || 0,
          likes: 0,
          comments: 0
        };
      } else if (postType === "recovery") {
        if (!recovery.title.trim()) return;
        const hasRecPhotos = recoveryPhotos.length > 0;
        newPost = {
          id,
          type: "RECOVERY",
          user: "KyleLPO",
          initial: "K",
          time: Date.now(),
          title: recovery.title,
          body: recovery.description || null,
          location: recovery.location || "Unknown",
          urgency: recovery.urgency,
          coords: recovery.coords || "\u2014",
          ...hasRecPhotos ? { photoCount: recoveryPhotos.length, photoUrls: recoveryPhotos.map((p) => p.url) } : {},
          ...recovery.vehicle ? { vehicle: recovery.vehicle } : {},
          likes: 0,
          comments: 0
        };
        onAddRecoveryAlert && onAddRecoveryAlert({
          id: "rec_" + Date.now(),
          title: recovery.title,
          location: recovery.location || "Unknown",
          coords: recovery.coords || "\u2014",
          urgency: recovery.urgency,
          time: Date.now(),
          vehicle: recovery.vehicle || "",
          detail: recovery.description || "",
          author: "KyleLPO"
        });
        onAddNotification && onAddNotification({
          type: "recovery",
          user: "KyleLPO",
          text: "posted a recovery request",
          target: recovery.title,
          icon: TriangleAlert,
          iconColor: T.red
        });
      }
      if (newPost) {
        onSubmit && onSubmit(newPost);
        const postText = newPost.title || "";
        const mentions = extractMentions(postText);
        mentions.forEach((handle) => {
          if (handle !== "KyleLPO") {
            onAddNotification && onAddNotification({ type: "mention", user: "KyleLPO", text: "mentioned you in a post", target: newPost.title, icon: AtSign, iconColor: T.copper });
          }
        });
      }
      onClose();
    };
    const [recoveryPhotos, setRecoveryPhotos] = (0, import_react4.useState)([]);
    const [recGeoLoading, setRecGeoLoading] = (0, import_react4.useState)(false);
    const [recGeoMsg, setRecGeoMsg] = (0, import_react4.useState)("");
    if (showRouteForm) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        RouteDetailsForm,
        {
          isManual: true,
          onBack: () => setShowRouteForm(false),
          onPublish: (routeData) => {
            const id = "user_" + Date.now();
            const newPost = {
              id,
              type: "ROUTES",
              user: "KyleLPO",
              initial: "K",
              time: Date.now(),
              title: routeData.name,
              body: routeData.desc || null,
              distance: routeData.distance ? routeData.distance + " MI" : "\u2014",
              duration: routeData.time || "\u2014",
              badge: null,
              verified: 0,
              likes: 0,
              comments: 0,
              difficulty: routeData.difficulty || "Moderate",
              elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "\u2014",
              location: routeData.location || "",
              terrains: routeData.terrains || [],
              tags: routeData.tags || [],
              photos: routeData.photos || [],
              pins: routeData.pins || []
            };
            if (routeData.shareToFeed) {
              onSubmit && onSubmit(newPost);
            }
            onAddRoute && onAddRoute({
              id,
              name: routeData.name,
              desc: routeData.desc || "",
              difficulty: routeData.difficulty || "Moderate",
              distance: routeData.distance ? routeData.distance + " MI" : "\u2014",
              time: routeData.time || "\u2014",
              elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "\u2014",
              location: routeData.location || "",
              terrains: routeData.terrains || [],
              tags: routeData.tags || [],
              pins: routeData.pins || [],
              photos: routeData.photos || [],
              rating: null,
              reviews: 0,
              author: "KyleLPO",
              createdAt: Date.now()
            });
            setShowRouteForm(false);
            onClose && onClose();
          }
        }
      );
    }
    if (!postType) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "20px 16px 8px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 20, color: T.white, margin: "0 0 4px", fontWeight: 700 }, children: "Create Post" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: 0 }, children: "What would you like to share?" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "8px 16px", display: "flex", flexDirection: "column", gap: 8 }, children: types.map((t) => {
          const Icon2 = t.icon;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
            if (t.key === "route") {
              setShowRouteForm(true);
            } else {
              setPostType(t.key);
            }
          }, style: { display: "flex", alignItems: "center", gap: 14, background: T.darkCard, borderRadius: 12, padding: "16px", border: "none", cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box", transition: "background 0.15s" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 44, height: 44, borderRadius: 10, background: `${t.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon2, { size: 20, color: t.color, strokeWidth: 1.5 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 15, color: T.white, fontWeight: 600, display: "block", marginBottom: 2 }, children: t.label }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, lineHeight: 1.4 }, children: t.desc })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 18, color: T.tertiary })
          ] }, t.key);
        }) })
      ] });
    }
    const currentType = types.find((t) => t.key === postType);
    const TypeIcon = currentType.icon;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setPostType(null), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20, color: T.white }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 28, height: 28, borderRadius: 6, background: `${currentType.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeIcon, { size: 14, color: currentType.color }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 600 }, children: [
              "New ",
              currentType.label
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: handleSubmit, style: { background: T.red, padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "POST" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }, children: [
        postType === "general" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "WHAT'S ON YOUR MIND?" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MentionInput, { multiline: true, value: general.text, onChange: (val) => setGeneral({ ...general, text: val }), placeholder: "Share a trail story, a build update, a question for the community...", style: textareaStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoUploader, { photos: general.photos, onChange: (p) => setGeneral({ ...general, photos: p }) }),
          !showLocationInput && !general.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setShowLocationInput(true), style: { width: "100%", background: T.darkCard, borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, border: "none", cursor: "pointer", textAlign: "left" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 16, color: T.tertiary }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary }, children: "Add location (optional)" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 8, padding: "12px 14px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 16, color: general.location ? T.copper : T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  autoFocus: true,
                  value: general.location,
                  onChange: (e) => setGeneral({ ...general, location: e.target.value }),
                  placeholder: "e.g. Moab, UT or Black Bear Pass",
                  style: { flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, padding: 0 }
                }
              ),
              general.location && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
                setGeneral({ ...general, location: "" });
                setShowLocationInput(false);
              }, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "button",
              {
                onClick: () => {
                  setGeoMsg("");
                  if (!navigator.geolocation) {
                    setGeoMsg("Geolocation is not supported by this browser.");
                    return;
                  }
                  setGeoLoading(true);
                  try {
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        const lat = pos.coords.latitude;
                        const lon = pos.coords.longitude;
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
                          const data = await res.json();
                          const addr = data.address || {};
                          const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || "";
                          const state = addr.state || "";
                          const country = addr.country_code ? addr.country_code.toUpperCase() : "";
                          const parts = [city, state].filter(Boolean);
                          const label = parts.length > 0 ? country === "US" ? parts.join(", ") : [...parts, country].join(", ") : `${lat.toFixed(4)}\xB0 ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}\xB0 ${lon >= 0 ? "E" : "W"}`;
                          setGeneral((prev) => ({ ...prev, location: label }));
                        } catch {
                          setGeneral((prev) => ({ ...prev, location: `${lat.toFixed(4)}\xB0 ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}\xB0 ${lon >= 0 ? "E" : "W"}` }));
                        }
                        setGeoLoading(false);
                        setGeoMsg("");
                      },
                      (err) => {
                        setGeoLoading(false);
                        if (err.code === 1) setGeoMsg("Location access denied. Enable permissions in browser settings.");
                        else if (err.code === 2) setGeoMsg("Location unavailable. This may not work in preview \u2014 try on the deployed site.");
                        else setGeoMsg("Location request timed out. Try again or type a location manually.");
                      },
                      { enableHighAccuracy: true, timeout: 1e4 }
                    );
                  } catch (e) {
                    setGeoLoading(false);
                    setGeoMsg("Location not available in this environment. Type your location manually.");
                  }
                },
                style: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "8px 0 0 26px" },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 12, color: T.copper }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600, letterSpacing: 0.5 }, children: geoLoading ? "Getting location..." : "Use current location" })
                ]
              }
            ),
            geoMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 11, color: T.red, margin: "6px 0 0 26px", lineHeight: 1.4 }, children: geoMsg })
          ] })
        ] }),
        postType === "convoy" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "TRIP NAME" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: convoy.title, onChange: (e) => setConvoy({ ...convoy, title: e.target.value }), placeholder: "e.g. Alpine Summit Chase", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "LOCATION" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 14, color: T.tertiary, style: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: convoy.location, onChange: (e) => setConvoy({ ...convoy, location: e.target.value }), placeholder: "Gerlach, Nevada", style: { ...inputStyle, paddingLeft: 36 }, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "DEPARTURE DATE" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "date", value: convoy.departDate, onChange: (e) => setConvoy({ ...convoy, departDate: e.target.value }), style: { ...inputStyle, colorScheme: "dark" } })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "DEPARTURE TIME" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "time", value: convoy.departTime, onChange: (e) => setConvoy({ ...convoy, departTime: e.target.value }), style: { ...inputStyle, colorScheme: "dark" } })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "RETURN DATE" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "date", value: convoy.returnDate, onChange: (e) => setConvoy({ ...convoy, returnDate: e.target.value }), style: { ...inputStyle, colorScheme: "dark" } })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "RETURN TIME" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "time", value: convoy.returnTime, onChange: (e) => setConvoy({ ...convoy, returnTime: e.target.value }), style: { ...inputStyle, colorScheme: "dark" } })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "MAX RIGS" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: convoy.slots, onChange: (e) => setConvoy({ ...convoy, slots: e.target.value }), placeholder: "e.g. 12", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "DETAILS" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: convoy.description, onChange: (e) => setConvoy({ ...convoy, description: e.target.value }), placeholder: "Describe the trip \u2014 terrain difficulty, what to bring, stock-friendly or not...", style: textareaStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] })
        ] }),
        postType === "recovery" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${T.red}12`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14, color: T.red }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 12, color: T.red, lineHeight: 1.4 }, children: "This will alert nearby Trailhead members. Use only for genuine recovery needs." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "URGENCY" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 8 }, children: ["HIGH", "LOW"].map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setRecovery({ ...recovery, urgency: u }), style: { flex: 1, padding: "12px 0", borderRadius: 6, cursor: "pointer", fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: 1, border: "none", background: recovery.urgency === u ? u === "HIGH" ? T.red : T.copper : T.darkCard, color: recovery.urgency === u ? T.white : T.tertiary, transition: "all 0.15s" }, children: u }, u)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "WHAT HAPPENED?" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: recovery.title, onChange: (e) => setRecovery({ ...recovery, title: e.target.value }), placeholder: "e.g. Stuck in mud, need winch assist", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "VEHICLE" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: recovery.vehicle, onChange: (e) => setRecovery({ ...recovery, vehicle: e.target.value }), placeholder: "e.g. 2022 Jeep Gladiator on 37s", style: inputStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "DETAILS" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: recovery.description, onChange: (e) => setRecovery({ ...recovery, description: e.target.value }), placeholder: "Describe your situation \u2014 what you need, injuries, losing daylight, etc.", style: textareaStyle, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: "LOCATION" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 14, color: T.tertiary, style: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: recovery.location, onChange: (e) => setRecovery({ ...recovery, location: e.target.value }), placeholder: "Black Bear Pass, CO", style: { ...inputStyle, paddingLeft: 36 }, onFocus: (e) => e.target.style.borderColor = T.copper, onBlur: (e) => e.target.style.borderColor = T.charcoal })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => {
            setRecGeoMsg("");
            if (!navigator.geolocation) {
              setRecGeoMsg("Geolocation not supported by this browser.");
              return;
            }
            setRecGeoLoading(true);
            try {
              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  const lat = pos.coords.latitude;
                  const lon = pos.coords.longitude;
                  const coordStr = `${lat.toFixed(4)}\xB0 ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}\xB0 ${lon >= 0 ? "E" : "W"}`;
                  setRecovery((prev) => ({ ...prev, coords: coordStr }));
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
                    const data = await res.json();
                    const addr = data.address || {};
                    const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || "";
                    const state = addr.state || "";
                    const country = addr.country_code ? addr.country_code.toUpperCase() : "";
                    const parts = [city, state].filter(Boolean);
                    const label = parts.length > 0 ? country === "US" ? parts.join(", ") : [...parts, country].join(", ") : coordStr;
                    setRecovery((prev) => ({ ...prev, location: label }));
                  } catch {
                    setRecovery((prev) => ({ ...prev, location: coordStr }));
                  }
                  setRecGeoLoading(false);
                  setRecGeoMsg("");
                },
                (err) => {
                  setRecGeoLoading(false);
                  if (err.code === 1) setRecGeoMsg("Location access denied. Enable permissions in browser settings.");
                  else if (err.code === 2) setRecGeoMsg("Location unavailable. This may not work in preview \u2014 try on the deployed site.");
                  else setRecGeoMsg("Location request timed out. Try again or type location manually.");
                },
                { enableHighAccuracy: true, timeout: 1e4 }
              );
            } catch (e) {
              setRecGeoLoading(false);
              setRecGeoMsg("Location not available in this environment. Type your location manually.");
            }
          }, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.darkCard, border: `1px dashed ${T.charcoal}`, borderRadius: 8, padding: "14px", cursor: "pointer", width: "100%", boxSizing: "border-box" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 16, color: T.copper }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }, children: recGeoLoading ? "Getting location..." : "Use Current GPS Location" })
          ] }),
          recGeoMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 11, color: T.red, margin: "6px 0 0", lineHeight: 1.4 }, children: recGeoMsg }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoUploader, { photos: recoveryPhotos, onChange: setRecoveryPhotos })
        ] })
      ] })
    ] });
  }
  function RecoveryScreen({ onOpenMap, onOpenDM }) {
    const [filter, setFilter] = (0, import_react4.useState)("ALL");
    const allAlerts = [
      { title: "Winch Support Required", location: "Black Bear Pass, CO", coords: "37.8106\xB0 N, 107.6992\xB0 W", urgency: "HIGH", time: "2m ago", vehicle: "Jeep Gladiator on 37s", detail: "High-centered on a shelf. Front locker acting up. Need a heavy rig with at least 12k winch to assist.", responses: 3, author: "DesertRat_4x4" },
      { title: "Tow Needed \u2014 Broken Axle", location: "Rubicon Trail, CA", coords: "38.9764\xB0 N, 120.1572\xB0 W", urgency: "HIGH", time: "25m ago", vehicle: "2018 Wrangler JL", detail: "Front axle snapped at the birfield. Cannot move under own power. Closest trailhead is 6 miles out.", responses: 7, author: "StockHero" },
      { title: "Flat Tire Assist", location: "Moab, UT", coords: "38.5733\xB0 N, 109.5498\xB0 W", urgency: "LOW", time: "1h ago", vehicle: "Toyota 4Runner", detail: "Spare is wrong size. Need 285/70R17 or close. Parked safely off-trail.", responses: 1, author: "DirtRoadDave" },
      { title: "Overheated Radiator \u2014 Stranded", location: "Johnson Valley, CA", coords: "34.3525\xB0 N, 116.4572\xB0 W", urgency: "HIGH", time: "3h ago", vehicle: "2016 Toyota Tacoma", detail: "Radiator hose blew on the lakebed. No cell service. Spotted via InReach.", responses: 5, author: "FoxFanatic" },
      { title: "Lost on Trail \u2014 Need GPS Guidance", location: "Uwharrie NF, NC", coords: "35.3894\xB0 N, 80.0674\xB0 W", urgency: "LOW", time: "5h ago", vehicle: "Ford Bronco", detail: "Took a wrong fork and can't find the main trail. No injuries, plenty of fuel.", responses: 12, author: "LiftKing" },
      { title: "Stuck in Deep Mud", location: "North Fork Crossing, OR", coords: "45.8923\xB0 N, 121.3482\xB0 W", urgency: "RESOLVED", time: "8h ago", vehicle: "Jeep Gladiator on 37s", detail: "Winch overheating. Vehicle recovered by @Peak_Finder.", responses: 24, author: "BajaBound" }
    ];
    const filters = ["ALL", "HIGH", "LOW", "RESOLVED"];
    const filtered = filter === "ALL" ? allAlerts : allAlerts.filter((a) => a.urgency === filter);
    const urgencyColor = (u) => u === "HIGH" ? T.red : u === "RESOLVED" ? T.green : T.copper;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "0 0 16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { fontFamily: sans, fontSize: 20, color: T.white, margin: "0 0 4px", fontWeight: 700 }, children: "Recovery Board" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary }, children: [
            allAlerts.filter((a) => a.urgency !== "RESOLVED").length,
            " active requests nearby"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { style: { background: T.red, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }, children: "REQUEST HELP" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "th-hscroll", style: { display: "flex", gap: 8, padding: "0 16px 14px", overflowX: "auto" }, children: filters.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setFilter(f), style: pill(filter === f), children: f }, f)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }, children: filtered.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, overflow: "hidden" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `${urgencyColor(a.urgency)}12`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.white, background: urgencyColor(a.urgency), padding: "2px 7px", borderRadius: 3, letterSpacing: 1, fontWeight: 600 }, children: a.urgency }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: formatPostTime(a.time) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 12, color: T.tertiary }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: [
              a.responses,
              " responding"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 15, color: T.white, margin: "0 0 4px", fontWeight: 600 }, children: a.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 10px", lineHeight: 1.5 }, children: a.detail }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 12, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: a.location })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { size: 12, color: T.tertiary }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: serif, fontSize: 11, color: T.tertiary }, children: a.coords })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: a.vehicle })
          ] }),
          a.urgency !== "RESOLVED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => onOpenDM && onOpenDM(a.author, "I'm responding to your recovery request \u2014 on my way to help!", { title: `\u{1F6A8} Recovery: ${a.title}`, user: a.author, initial: a.author.charAt(0).toUpperCase(), type: "recovery", location: a.location, urgency: a.urgency }), style: { background: T.red, color: T.white, fontFamily: sans, fontSize: 11, fontWeight: 600, padding: "9px 18px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 0.5 }, children: "RESPOND" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => onOpenMap && onOpenMap(a.coords, a.location, a.title, { author: a.author, alertId: "ra_" + i, title: a.title }), style: { background: "none", color: T.tertiary, fontFamily: sans, fontSize: 11, padding: "9px 18px", borderRadius: 6, border: `1px solid ${T.charcoal}`, cursor: "pointer", letterSpacing: 0.5 }, children: "VIEW ON MAP" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 14, color: T.green }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: 0.5 }, children: "RESOLVED" })
          ] })
        ] })
      ] }, i)) })
    ] });
  }
  var dmConversations = [
    {
      id: "dm1",
      user: "TrailBoss_88",
      initial: "T",
      name: "TrailBoss 88",
      badge: "Explorer",
      online: true,
      unread: 2,
      messages: [
        { id: 1, from: "TrailBoss_88", text: "Hey, saw your suspension build post. What size shocks did you end up going with?", time: "2:15 PM" },
        { id: 2, from: "me", text: "Went with Icon 2.5 VS RR \u2014 couldn't be happier with the ride quality on and off road.", time: "2:18 PM" },
        { id: 3, from: "TrailBoss_88", text: "Nice! I've been debating between those and the Fox 2.5 Factory. How's the heat fade on long descents?", time: "2:20 PM" },
        { id: 4, from: "TrailBoss_88", text: "Also \u2014 are you running the CDCV or standard valving?", time: "2:21 PM" }
      ],
      lastMessage: "Also \u2014 are you running the CDCV or standard valving?",
      lastTime: "2:21 PM"
    },
    {
      id: "dm2",
      user: "BajaBound",
      initial: "B",
      name: "Baja Bound",
      badge: "Navigator",
      online: false,
      unread: 0,
      messages: [
        { id: 1, from: "me", text: "I'm interested in the Feb Baja convoy. Got room for a Tundra?", time: "Yesterday" },
        { id: 2, from: "BajaBound", text: "Absolutely! We have 4 rigs confirmed so far. What's your setup?", time: "Yesterday" },
        { id: 3, from: "me", text: "2022 Tundra, Icon Stage 3, full armor, rooftop tent, dual battery. Ready to roll.", time: "Yesterday" },
        { id: 4, from: "BajaBound", text: "Perfect rig for it. I'll add you to the convoy group chat once we get closer. We're planning the route next week.", time: "Yesterday" }
      ],
      lastMessage: "Perfect rig for it. I'll add you to the convoy group chat once we get closer.",
      lastTime: "Yesterday"
    },
    {
      id: "dm3",
      user: "SuspensionGuru",
      initial: "S",
      name: "Suspension Guru",
      badge: "Master Builder",
      online: true,
      unread: 1,
      messages: [
        { id: 1, from: "SuspensionGuru", text: "Kyle, wanted to reach out about a potential collab. Love what Lone Peak is doing.", time: "Mon" },
        { id: 2, from: "me", text: "Appreciate that! What did you have in mind?", time: "Mon" },
        { id: 3, from: "SuspensionGuru", text: "I'm putting together a suspension comparison video \u2014 Icon vs King vs Fox. Would love to feature your Tundra build as the Icon test platform.", time: "Tue" }
      ],
      lastMessage: "I'm putting together a suspension comparison video \u2014 Icon vs King vs Fox.",
      lastTime: "Tue"
    },
    {
      id: "dm4",
      user: "GearDump",
      initial: "G",
      name: "Gear Dump",
      badge: "Scout",
      online: false,
      unread: 0,
      messages: [
        { id: 1, from: "me", text: "Is the ARB bumper still available?", time: "3d ago" },
        { id: 2, from: "GearDump", text: "Hey! Yeah it is. Are you in the Denver area? Would prefer local pickup.", time: "3d ago" },
        { id: 3, from: "me", text: "I'm in Utah but could arrange shipping. Would you do $700 shipped?", time: "3d ago" },
        { id: 4, from: "GearDump", text: "Let me check shipping costs and get back to you. The bumper is heavy \u2014 probably $100+ to ship.", time: "2d ago" }
      ],
      lastMessage: "Let me check shipping costs and get back to you.",
      lastTime: "2d ago"
    }
  ];
  function DMScreen({ onClose, onViewUser, initialUser, initialMessage, initialSharedPost, conversations, setConversations, onOpenPost }) {
    const [view, setView] = (0, import_react4.useState)(initialUser ? "chat" : "inbox");
    const [activeConvo, setActiveConvo] = (0, import_react4.useState)(() => {
      if (initialUser) {
        const existing = conversations.find((c) => c.user === initialUser);
        if (existing) return { ...existing, unread: 0 };
        return { id: "new_" + initialUser, user: initialUser, initial: initialUser.charAt(0).toUpperCase(), name: initialUser, badge: "", online: false, unread: 0, messages: [], lastMessage: "", lastTime: "now" };
      }
      return null;
    });
    const [msgText, setMsgText] = (0, import_react4.useState)(initialMessage || "");
    const [chatPhotos, setChatPhotos] = (0, import_react4.useState)([]);
    const [pendingSharedPost, setPendingSharedPost] = (0, import_react4.useState)(initialSharedPost || null);
    const [searchQ, setSearchQ] = (0, import_react4.useState)("");
    const [newRecipient, setNewRecipient] = (0, import_react4.useState)("");
    const chatEndRef = (0, import_react4.useRef)(null);
    const chatFileRef = (0, import_react4.useRef)(null);
    (0, import_react4.useEffect)(() => {
      if (initialUser) {
        setConversations((prev) => prev.map((c) => c.user === initialUser ? { ...c, unread: 0 } : c));
      }
    }, [initialUser]);
    const autoSentRef = (0, import_react4.useRef)(false);
    (0, import_react4.useEffect)(() => {
      if (autoSentRef.current || !initialUser || !initialMessage || !initialSharedPost || !activeConvo) return;
      autoSentRef.current = true;
      const timer = setTimeout(() => {
        const newMsg = { id: Date.now(), from: "me", text: initialMessage, time: Date.now(), sharedPost: initialSharedPost };
        const lastMsg = "Shared: " + initialSharedPost.title;
        const updated = { ...activeConvo, messages: [...activeConvo.messages, newMsg], lastMessage: lastMsg, lastTime: "Just now", unread: 0 };
        setActiveConvo(updated);
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === updated.id);
          if (exists) return prev.map((c) => c.id === updated.id ? updated : c);
          return [updated, ...prev];
        });
        setMsgText("");
        setPendingSharedPost(null);
      }, 300);
      return () => clearTimeout(timer);
    }, [initialUser, initialMessage, initialSharedPost, activeConvo]);
    (0, import_react4.useEffect)(() => {
      if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [activeConvo?.messages?.length]);
    const openConvo = (convo) => {
      const cleared = { ...convo, unread: 0 };
      setActiveConvo(cleared);
      setConversations((prev) => prev.map((c) => c.id === convo.id ? cleared : c));
      setView("chat");
    };
    const handleChatFiles = (e) => {
      const files = Array.from(e.target.files || []);
      if (chatFileRef.current) chatFileRef.current.value = "";
      files.forEach((file) => {
        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          const blobUrl = URL.createObjectURL(file);
          setChatPhotos((prev) => [...prev, { id: Date.now() + Math.random(), url: blobUrl, name: file.name, type: "video" }]);
        } else {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setChatPhotos((prev) => [...prev, { id: Date.now() + Math.random(), url: ev.target.result, name: file.name, type: "image" }]);
          };
          reader.readAsDataURL(file);
        }
      });
    };
    const sendMessage = () => {
      if (!msgText.trim() && chatPhotos.length === 0 && !pendingSharedPost || !activeConvo) return;
      const newMsg = { id: Date.now(), from: "me", text: msgText.trim(), time: Date.now(), photos: chatPhotos.length > 0 ? chatPhotos.map((p) => p.url) : void 0, sharedPost: pendingSharedPost || void 0 };
      const lastMsg = pendingSharedPost ? "Shared: " + pendingSharedPost.title : msgText.trim();
      const updated = { ...activeConvo, messages: [...activeConvo.messages, newMsg], lastMessage: lastMsg, lastTime: "Just now", unread: 0 };
      setActiveConvo(updated);
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === updated.id);
        if (exists) return prev.map((c) => c.id === updated.id ? updated : c);
        return [updated, ...prev];
      });
      setMsgText("");
      setChatPhotos([]);
      setPendingSharedPost(null);
    };
    const badgeColor = (b) => b === "Founder" ? T.red : b === "Master Builder" ? T.copper : b === "Navigator" ? T.green : T.tertiary;
    const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);
    const filteredConvos = searchQ.trim() ? conversations.filter((c) => c.user.toLowerCase().includes(searchQ.toLowerCase()) || c.name.toLowerCase().includes(searchQ.toLowerCase())) : conversations;
    const recipientResults = newRecipient.trim().length > 0 ? globalSearchUsers.filter((u) => (u.handle.toLowerCase().includes(newRecipient.toLowerCase()) || u.name.toLowerCase().includes(newRecipient.toLowerCase())) && !conversations.find((c) => c.user === u.handle)) : [];
    if (view === "chat" && activeConvo) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, background: T.darkBg, zIndex: 500, display: "flex", flexDirection: "column" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
            setView("inbox");
            setActiveConvo(null);
          }, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => {
            onViewUser && onViewUser(activeConvo.user);
          }, style: { display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 36, height: 36, borderRadius: "50%", background: T.charcoal, border: `2px solid ${T.copper}`, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }, children: activeConvo.initial }) }),
              activeConvo.online && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: T.green, border: `2px solid ${T.charcoal}` } })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }, children: [
                "@",
                activeConvo.user
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: activeConvo.online ? T.green : T.tertiary }, children: activeConvo.online ? "Online" : "Offline" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8 }, children: [
          activeConvo.messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", padding: "40px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: 32, color: T.tertiary, style: { opacity: 0.3, marginBottom: 12 } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 4px" }, children: "Start a conversation" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }, children: [
              "Send a message to @",
              activeConvo.user
            ] })
          ] }),
          activeConvo.messages.map((msg) => {
            const isMe = msg.from === "me";
            return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { maxWidth: "78%", padding: "10px 14px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMe ? T.red : T.darkCard, border: isMe ? "none" : `1px solid ${T.charcoal}` }, children: [
              msg.sharedPost && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => onOpenPost && onOpenPost(msg.sharedPost), style: { borderRadius: 8, overflow: "hidden", border: `1px solid ${isMe ? "rgba(255,255,255,0.15)" : T.charcoal}`, marginBottom: msg.text ? 8 : 0, background: isMe ? "rgba(0,0,0,0.15)" : `${T.charcoal}80`, cursor: "pointer", transition: "opacity 0.15s" }, onMouseEnter: (e) => e.currentTarget.style.opacity = "0.85", onMouseLeave: (e) => e.currentTarget.style.opacity = "1", children: [
                msg.sharedPost.image && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: msg.sharedPost.image, alt: "", style: { width: "100%", height: 120, objectFit: "cover", display: "block" } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "10px 12px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 20, height: 20, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, fontWeight: 700, color: T.white }, children: msg.sharedPost.initial }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 10, color: isMe ? "rgba(255,255,255,0.7)" : T.tertiary }, children: [
                      "@",
                      msg.sharedPost.user
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: isMe ? "rgba(255,255,255,0.45)" : `${T.tertiary}80`, marginLeft: "auto", textTransform: "uppercase", letterSpacing: 0.5 }, children: msg.sharedPost.type })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.white, margin: 0, lineHeight: 1.4 }, children: msg.sharedPost.title }),
                  msg.sharedPost.type === "recovery" && msg.sharedPost.location && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, marginTop: 4 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 10, color: T.red }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.tertiary }, children: msg.sharedPost.location }),
                    msg.sharedPost.urgency && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 8, color: T.white, background: msg.sharedPost.urgency === "HIGH" ? T.red : T.copper, padding: "1px 5px", borderRadius: 3, fontWeight: 600, marginLeft: 4 }, children: msg.sharedPost.urgency })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, marginTop: 6 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }, children: msg.sharedPost.type === "recovery" ? "VIEW ALERT" : "VIEW POST" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 12, color: T.copper })
                  ] })
                ] })
              ] }),
              msg.photos && msg.photos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 4, marginBottom: msg.text ? 8 : 0, flexWrap: "wrap" }, children: msg.photos.map((url, pi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: url, alt: "", style: { width: msg.photos.length === 1 ? "100%" : 80, height: msg.photos.length === 1 ? "auto" : 80, maxHeight: 200, borderRadius: 8, objectFit: "cover", display: "block" } }, pi)) }),
              msg.text && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.white, margin: 0, lineHeight: 1.5 }, children: msg.text }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: isMe ? `${T.white}90` : T.tertiary, display: "block", textAlign: "right", marginTop: 4 }, children: formatPostTime(msg.time) })
            ] }) }, msg.id);
          }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: chatEndRef })
        ] }),
        pendingSharedPost && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "8px 16px", background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, display: "flex", gap: 10, alignItems: "center" }, children: [
          pendingSharedPost.image && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: pendingSharedPost.image, alt: "", style: { width: 48, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0 } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 0.5, fontWeight: 600 }, children: "SHARED POST" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 9, color: T.tertiary }, children: [
                "by @",
                pendingSharedPost.user
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.white, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: pendingSharedPost.title })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setPendingSharedPost(null), style: { background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
        ] }),
        chatPhotos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "8px 16px 0", background: T.charcoal, display: "flex", gap: 8, overflowX: "auto" }, children: chatPhotos.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", flexShrink: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: p.url, alt: p.name, style: { width: 56, height: 56, borderRadius: 8, objectFit: "cover", display: "block", border: `1px solid ${T.charcoal}` } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setChatPhotos((prev) => prev.filter((x) => x.id !== p.id)), style: { position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: T.red, border: `2px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 8, color: T.white }) })
        ] }, p.id)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "10px 16px max(10px, env(safe-area-inset-bottom))", background: T.charcoal, borderTop: chatPhotos.length > 0 || pendingSharedPost ? "none" : `1px solid ${T.darkCard}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: chatFileRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: handleChatFiles, style: { display: "none" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => chatFileRef.current && chatFileRef.current.click(), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { size: 20, color: T.tertiary }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 20, padding: "8px 14px", border: `1px solid ${T.charcoal}` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: msgText, onChange: (e) => setMsgText(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }, placeholder: pendingSharedPost ? "Add a message..." : "Type a message...", style: { flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, padding: 0 } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: sendMessage, disabled: !msgText.trim() && chatPhotos.length === 0 && !pendingSharedPost, style: { background: msgText.trim() || chatPhotos.length > 0 || pendingSharedPost ? T.red : T.charcoal, border: "none", cursor: msgText.trim() || chatPhotos.length > 0 || pendingSharedPost ? "pointer" : "default", padding: 0, width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", opacity: msgText.trim() || chatPhotos.length > 0 || pendingSharedPost ? 1 : 0.4, transition: "all 0.15s" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 16, color: T.white, style: { marginLeft: 2 } }) })
        ] })
      ] });
    }
    if (view === "new") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, background: T.darkBg, zIndex: 500, display: "flex", flexDirection: "column" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setView("inbox"), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white, letterSpacing: 1 }, children: "New Message" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px", marginBottom: 16, border: `1px solid ${T.copper}40` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600, marginRight: 8 }, children: "TO:" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: newRecipient, onChange: (e) => setNewRecipient(e.target.value), placeholder: "Search for a user...", autoFocus: true, style: { flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, padding: 0 } }),
            newRecipient && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setNewRecipient(""), style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, color: T.tertiary }) })
          ] }),
          recipientResults.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: recipientResults.map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => {
            const newConvo = { id: "new_" + u.handle, user: u.handle, initial: u.initial, name: u.name, badge: u.badge, online: false, unread: 0, messages: [], lastMessage: "", lastTime: "now" };
            setActiveConvo(newConvo);
            setView("chat");
            setNewRecipient("");
          }, style: { background: T.darkCard, padding: "12px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === recipientResults.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < recipientResults.length - 1 ? `1px solid ${T.charcoal}` : "none", display: "flex", alignItems: "center", gap: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 40, height: 40, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${badgeColor(u.badge)}` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 15, fontWeight: 700, color: T.white }, children: u.initial }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }, children: [
                "@",
                u.handle
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: u.name })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14, color: T.tertiary })
          ] }, u.handle)) }) : newRecipient.trim().length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { textAlign: "center", padding: "24px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: 0 }, children: [
            'No users found for "',
            newRecipient,
            '"'
          ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", padding: "24px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 24, color: T.tertiary, style: { opacity: 0.3, marginBottom: 8 } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: 0 }, children: "Search for a user to start a conversation" })
          ] })
        ] })
      ] });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", inset: 0, background: T.darkBg, zIndex: 500, display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 22, color: T.white, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white, letterSpacing: 1 }, children: "Messages" }),
          totalUnread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { minWidth: 18, height: 18, borderRadius: 9, background: T.red, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }, children: totalUnread }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => setView("new"), style: { display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14, color: T.white }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 700, letterSpacing: 0.5 }, children: "NEW" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "12px 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 16, color: T.tertiary }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: searchQ, onChange: (e) => setSearchQ(e.target.value), placeholder: "Search conversations...", style: { flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, marginLeft: 8, padding: 0 } })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, overflowY: "auto" }, children: filteredConvos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", padding: "40px 16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: 32, color: T.tertiary, style: { opacity: 0.3, marginBottom: 12 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 4px" }, children: "No conversations yet" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }, children: "Start a new message to connect with the community" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "0 16px" }, children: filteredConvos.map((convo, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { onClick: () => openConvo({ ...convo, unread: 0 }), style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 0", cursor: "pointer", borderBottom: i < filteredConvos.length - 1 ? `1px solid ${T.charcoal}` : "none" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", flexShrink: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 48, height: 48, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${convo.unread > 0 ? T.copper : T.charcoal}` }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.white }, children: convo.initial }) }),
          convo.online && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: T.green, border: `2px solid ${T.darkBg}` } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: convo.unread > 0 ? 700 : 500 }, children: [
              "@",
              convo.user
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, color: convo.unread > 0 ? T.copper : T.tertiary, flexShrink: 0 }, children: convo.lastTime })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: convo.unread > 0 ? T.white : T.tertiary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontWeight: convo.unread > 0 ? 500 : 400 }, children: convo.lastMessage }),
            convo.unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { minWidth: 20, height: 20, borderRadius: 10, background: T.red, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }, children: convo.unread }) })
          ] })
        ] })
      ] }, convo.id)) }) })
    ] });
  }
  function Trailhead() {
    const [authState, setAuthState] = (0, import_react4.useState)("login");
    const [screen, setScreen] = (0, import_react4.useState)("feed");
    const [profileStack, setProfileStack] = (0, import_react4.useState)([]);
    const [showRecovery, setShowRecovery] = (0, import_react4.useState)(false);
    const [showCompose, setShowCompose] = (0, import_react4.useState)(false);
    const [mapData, setMapData] = (0, import_react4.useState)(null);
    const [recoveryConfirm, setRecoveryConfirm] = (0, import_react4.useState)(null);
    const [showRecorder, setShowRecorder] = (0, import_react4.useState)(false);
    const [showManualRoute, setShowManualRoute] = (0, import_react4.useState)(false);
    const [pendingThread, setPendingThread] = (0, import_react4.useState)(null);
    const [feedItems, setFeedItems] = (0, import_react4.useState)(defaultFeedItems);
    const [forumUserThreads, setForumUserThreads] = (0, import_react4.useState)({});
    const [forumUserReplies, setForumUserReplies] = (0, import_react4.useState)({});
    const [forumLikedItems, setForumLikedItems] = (0, import_react4.useState)({});
    const [forumLikeCounts, setForumLikeCounts] = (0, import_react4.useState)({});
    const [forumViewCounts, setForumViewCounts] = (0, import_react4.useState)({});
    const [userRoutes, setUserRoutes] = (0, import_react4.useState)([]);
    const [savedRoutes, setSavedRoutes] = (0, import_react4.useState)([]);
    const [activeNavRoute, setActiveNavRoute] = (0, import_react4.useState)(null);
    const [userBuilds, setUserBuilds] = (0, import_react4.useState)([]);
    const [profilePic, setProfilePic] = (0, import_react4.useState)(null);
    const [notifPrefs, setNotifPrefs] = (0, import_react4.useState)({ likes: true, comments: true, replies: true, follows: true, mentions: true, push: false });
    const [showGlobalSearch, setShowGlobalSearch] = (0, import_react4.useState)(false);
    const [showDM, setShowDM] = (0, import_react4.useState)(false);
    const [dmInitialUser, setDmInitialUser] = (0, import_react4.useState)(null);
    const [dmInitialMessage, setDmInitialMessage] = (0, import_react4.useState)("");
    const [dmConvos, setDmConvos] = (0, import_react4.useState)(dmConversations);
    const dmUnreadCount = dmConvos.reduce((sum, c) => sum + c.unread, 0);
    const [dmSharedPost, setDmSharedPost] = (0, import_react4.useState)(null);
    const [bellNotifs, setBellNotifs] = (0, import_react4.useState)([
      { id: "b1", type: "like", user: "Overland_Expert", text: "liked your post", target: "Stage 3 Suspension Build Complete", time: "2m ago", icon: Heart, iconColor: T.red },
      { id: "b2", type: "reply", user: "TrailBoss", text: "replied to your thread", target: "Best budget lift kit for 3rd Gen Tacoma?", time: "18m ago", icon: MessageCircle, iconColor: T.copper },
      { id: "b3", type: "follow", user: "MountainGoat", text: "started following you", target: null, time: "1h ago", icon: UserPlus, iconColor: T.green },
      { id: "b4", type: "like", user: "Peak_Finder", text: "liked your route", target: "Hell's Revenge Loop", time: "3h ago", icon: Heart, iconColor: T.red },
      { id: "b5", type: "mention", user: "BajaBound", text: "mentioned you in", target: "Planning a Baja convoy \u2014 Feb 2027", time: "5h ago", icon: AtSign, iconColor: T.copper },
      { id: "b6", type: "reply", user: "SteelCraft", text: "replied to your comment in", target: "Custom skid plate fabrication", time: "8h ago", icon: MessageCircle, iconColor: T.copper },
      { id: "b7", type: "like", user: "Nomad_Queen", text: "and 4 others liked your post", target: "Black Bear Pass Recovery", time: "1d ago", icon: Heart, iconColor: T.red }
    ]);
    const [recoveryAlerts, setRecoveryAlerts] = (0, import_react4.useState)([
      { id: "r1", title: "Winch Support Required", location: "Black Bear Pass, CO", coords: "37.8106\xB0 N, 107.6992\xB0 W", urgency: "HIGH", time: "2m ago", vehicle: "Jeep Gladiator on 37s", detail: "High-centered on a shelf. Front locker acting up.", author: "DesertRat_4x4" },
      { id: "r2", title: "Tow Needed \u2014 Broken Axle", location: "Rubicon Trail, CA", coords: "38.9764\xB0 N, 120.1572\xB0 W", urgency: "HIGH", time: "25m ago", vehicle: "2018 Wrangler JL", detail: "Front axle snapped at the birfield. Cannot move under own power.", author: "StockHero" },
      { id: "r3", title: "Flat Tire Assist", location: "Moab, UT", coords: "38.5733\xB0 N, 109.5498\xB0 W", urgency: "LOW", time: "1h ago", vehicle: "Toyota 4Runner", detail: "Spare is wrong size. Need 285/70R17 or close.", author: "DirtRoadDave" }
    ]);
    const addNotification = (notif) => {
      setBellNotifs((prev) => [{ id: "bn_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), time: Date.now(), ...notif }, ...prev]);
    };
    const POINTS = { dailyLogin: 5, feedPost: 10, forumThread: 25, forumReply: 10, routeLogged: 30, buildAdded: 40, profileComplete: 100, receiveLike: 2, receiveComment: 3, receiveBookmark: 5, convoyJoined: 20, recoveryRespond: 50, photoUploaded: 5 };
    const [myTotalPoints, setMyTotalPoints] = (0, import_react4.useState)(12450);
    const [pointsToasts, setPointsToasts] = (0, import_react4.useState)([]);
    const REASON_TO_BREAKDOWN = { "Forum Thread": "Forum Threads", "Forum Reply": "Forum Threads", "Route Logged": "Routes Logged", "Build Added": "Builds Added", "Feed Post": "Feed Posts", "Daily Login": "Daily Logins", "Photos Uploaded": "Feed Posts", "Comment Posted": "Feed Posts", "Recovery Response": "Recovery" };
    const [pointsBreakdown, setPointsBreakdown] = (0, import_react4.useState)({
      "Forum Threads": 3750,
      "Routes Logged": 2700,
      "Builds Added": 2e3,
      "Likes Received": 1840,
      "Feed Posts": 1200,
      "Daily Logins": 560,
      "Other": 400
    });
    const awardPoints = (amount, reason) => {
      if (!amount || !reason) return;
      setMyTotalPoints((prev) => prev + amount);
      USER_POINTS["KyleLPO"] = (USER_POINTS["KyleLPO"] || 12450) + amount;
      const cat = REASON_TO_BREAKDOWN[reason] || "Other";
      setPointsBreakdown((prev) => ({ ...prev, [cat]: (prev[cat] || 0) + amount }));
      const toastId = Date.now() + Math.random();
      setPointsToasts((prev) => [...prev, { id: toastId, amount, reason }]);
      setTimeout(() => setPointsToasts((prev) => prev.filter((t) => t.id !== toastId)), 2500);
    };
    const loginPointsAwarded = (0, import_react4.useRef)(false);
    (0, import_react4.useEffect)(() => {
      if (!loginPointsAwarded.current && authState === "app") {
        loginPointsAwarded.current = true;
        setTimeout(() => awardPoints(POINTS.dailyLogin, "Daily Login"), 1500);
      }
    }, [authState]);
    const addRecoveryAlert = (alert) => {
      setRecoveryAlerts((prev) => [alert, ...prev]);
    };
    const [dmKey, setDmKey] = (0, import_react4.useState)(0);
    const openDM = (user, prefillMsg, sharedPost) => {
      setDmInitialUser(user || null);
      setDmInitialMessage(prefillMsg || "");
      setDmSharedPost(sharedPost || null);
      setDmKey((k) => k + 1);
      setShowDM(true);
    };
    const addBuild = (data) => {
      const displayName = data.buildName || `${data.year} ${data.make} ${data.model}`;
      const heroImg = data.mainPhotos && data.mainPhotos.length > 0 ? data.mainPhotos[0].url : null;
      const newBuild = {
        id: Date.now(),
        name: displayName.toUpperCase(),
        owner: "Kyle Morrison",
        handle: "@KyleLPO",
        initial: "K",
        year: parseInt(data.year) || 2024,
        make: data.make,
        model: data.model,
        tags: [data.trim ? data.trim.toUpperCase() : data.make.toUpperCase(), "NEW BUILD"],
        suspension: data.suspension.value || "",
        tires: data.tires.value || "",
        bumpers: data.bumpers.value || "",
        miles: "0",
        elevation: "0 ft",
        routes: 0,
        hasCamper: data.hasCamper,
        camperMake: data.camperMake || "",
        camperModel: data.camperModel || "",
        isMine: true,
        isFollowing: true,
        likes: 0,
        heroImg,
        buildData: data
      };
      setUserBuilds((prev) => [newBuild, ...prev]);
      if (data.shareToFeed) {
        const feedPost = {
          id: "fb_" + Date.now(),
          type: "BUILDS",
          user: "Kyle Morrison",
          initial: "K",
          time: Date.now(),
          title: displayName.toUpperCase(),
          subtitle: "Added a new build",
          stage: data.suspension.value ? "Suspension: " + data.suspension.value : data.bumpers.value ? "Armor: " + data.bumpers.value : "New Build",
          likes: 0,
          comments: 0,
          seedComments: [],
          photoUrls: heroImg ? [heroImg] : void 0,
          buildData: data,
          vehicle: `${data.year} ${data.make} ${data.model}${data.trim ? " " + data.trim : ""}`
        };
        setFeedItems((prev) => [feedPost, ...prev]);
      }
      awardPoints(POINTS.buildAdded, "Build Added");
    };
    const updateBuild = (buildId, data) => {
      const displayName = data.buildName || `${data.year} ${data.make} ${data.model}`;
      const heroImg = data.mainPhotos && data.mainPhotos.length > 0 ? data.mainPhotos[0].url : null;
      setUserBuilds((prev) => prev.map((b) => b.id === buildId ? {
        ...b,
        name: displayName.toUpperCase(),
        year: parseInt(data.year) || b.year,
        make: data.make || b.make,
        model: data.model || b.model,
        tags: [data.trim ? data.trim.toUpperCase() : data.make.toUpperCase(), "UPDATED"],
        heroImg,
        buildData: data,
        hasCamper: data.hasCamper,
        camperMake: data.camperMake || "",
        camperModel: data.camperModel || ""
      } : b));
    };
    const openForumThread = (threadId, catName, subName) => {
      setPendingThread({ threadId, catName, subName });
      setScreen("forum");
    };
    const openProfile = () => setProfileStack(["self"]);
    const openUserProfile = (userId) => setProfileStack(["user", userId]);
    const openMap = (coords, location, title, recoveryCtx) => setMapData({ coords, location, title, recoveryCtx: recoveryCtx || null });
    const goBack = () => {
      setProfileStack([]);
      setShowRecovery(false);
      setShowCompose(false);
    };
    const handleNav = (key) => {
      setProfileStack([]);
      setShowRecovery(false);
      setShowCompose(false);
      setScreen(key);
    };
    const isProfile = profileStack.length > 0;
    const isOtherProfile = profileStack[0] === "user";
    const isOverlay = isProfile || showRecovery || showCompose;
    if (authState === "login") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginScreen, { onLogin: () => setAuthState("app"), onGoToSignup: () => setAuthState("signup") });
    }
    if (authState === "signup") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignupScreen, { onSignup: () => setAuthState("app"), onGoToLogin: () => setAuthState("login"), onSetProfilePic: setProfilePic });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.charcoal, height: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", fontFamily: sans, color: T.white, display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        TopBar,
        {
          onProfile: openProfile,
          onBack: goBack,
          showBack: isOverlay,
          title: showCompose ? "New Post" : showRecovery ? "Recovery" : isProfile ? isOtherProfile ? "" : "Profile" : void 0,
          onViewUser: openUserProfile,
          onGoToRecovery: () => {
            setShowRecovery(true);
            setProfileStack([]);
          },
          onOpenMap: openMap,
          onSearch: () => setShowGlobalSearch(true),
          onOpenDM: (user, prefill, shared) => openDM(user, prefill, shared),
          dmUnread: dmUnreadCount,
          bellNotifs,
          setBellNotifs,
          profilePic,
          notifPrefs,
          recoveryAlerts,
          setRecoveryAlerts
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "th-scroll", style: { flex: 1, overflowY: "auto", minHeight: 0 }, children: showCompose ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComposeScreen, { onClose: () => setShowCompose(false), onSubmit: (newPost) => {
        setFeedItems((prev) => [newPost, ...prev]);
        awardPoints(newPost.type === "RECOVERY" ? 0 : POINTS.feedPost, newPost.type === "RECOVERY" ? "" : "Feed Post");
        if (newPost.photoUrls && newPost.photoUrls.length > 0) awardPoints(POINTS.photoUploaded * newPost.photoUrls.length, "Photos Uploaded");
      }, onAddRecoveryAlert: addRecoveryAlert, onAddNotification: addNotification, onAddRoute: (r) => {
        setUserRoutes((prev) => [r, ...prev]);
        awardPoints(POINTS.routeLogged, "Route Logged");
      } }) : showRecovery ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecoveryScreen, { onOpenMap: openMap, onOpenDM: openDM }) : isProfile ? isOtherProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OtherProfileScreen, { userId: profileStack[1], onBack: goBack, onMessage: (user) => openDM(user) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileScreen, { onViewUser: openUserProfile, onLogout: () => {
        setAuthState("login");
        setProfileStack([]);
      }, userBuilds, onAddBuild: addBuild, onUpdateBuild: updateBuild, onDeleteBuild: (id) => {
        setUserBuilds((prev) => prev.filter((b) => b.id !== id));
        setFeedItems((prev) => prev.filter((p) => p.buildId !== id && p.id !== id));
      }, profilePic, onSetProfilePic: setProfilePic, notifPrefs, onSetNotifPrefs: setNotifPrefs, feedItems, onDeletePost: (id) => setFeedItems((prev) => prev.filter((p) => p.id !== id)), onEditPost: (id, newText) => setFeedItems((prev) => prev.map((p) => p.id === id ? { ...p, title: newText } : p)), onGoToPost: (id) => {
        setProfileStack([]);
        setScreen("feed");
      }, myPoints: myTotalPoints }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        screen === "feed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedScreen, { onViewUser: openUserProfile, onOpenMap: openMap, onOpenThread: (threadId, catName, subName) => openForumThread(threadId, catName, subName), onOpenDM: (user, msg, sp) => openDM(user, msg, sp), feedItems, onUpdateFeed: (items) => setFeedItems(items), onAddNotification: addNotification, forumUserReplies, forumViewCounts, savedRoutes, onSaveRoute: (route) => setSavedRoutes((prev) => prev.some((r) => r.id === route.id || r.name === route.name) ? prev : [route, ...prev]), onUnsaveRoute: (routeId) => setSavedRoutes((prev) => prev.filter((r) => r.id !== routeId && r.name !== routeId)), onStartNav: (route) => setActiveNavRoute(route), onAwardPoints: awardPoints }),
        screen === "forum" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForumScreen, { pendingThread, onPendingHandled: () => setPendingThread(null), onAddNotification: addNotification, onOpenDM: (user, msg, sp) => openDM(user, msg, sp), onAddFeedPost: (post) => setFeedItems((prev) => [post, ...prev]), userThreads: forumUserThreads, setUserThreads: setForumUserThreads, userReplies: forumUserReplies, setUserReplies: setForumUserReplies, likedForumItems: forumLikedItems, setLikedForumItems: setForumLikedItems, forumLikeCounts, setForumLikeCounts, forumViewCounts, setForumViewCounts, onAwardPoints: awardPoints }),
        screen === "routes" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoutesScreen, { onRecordRoute: () => setShowRecorder(true), onManualEntry: () => setShowManualRoute(true), userRoutes, onUpdateRoute: (routeId, updates) => setUserRoutes((prev) => prev.map((r) => r.id === routeId ? { ...r, ...updates } : r)), savedRoutes, onSaveRoute: (route) => setSavedRoutes((prev) => prev.some((r) => r.id === route.id || r.name === route.name) ? prev : [route, ...prev]), onUnsaveRoute: (routeId) => setSavedRoutes((prev) => prev.filter((r) => r.id !== routeId && r.name !== routeId)), onOpenDM: (user, msg, sharedPost) => openDM(user, msg, sharedPost), onAddFeedPost: (post) => setFeedItems((prev) => [post, ...prev]), onStartNav: (route) => setActiveNavRoute(route) }),
        screen === "builds" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BuildsScreen, { onViewUser: openUserProfile, userBuilds }),
        screen === "ranks" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RanksScreen, { myPoints: myTotalPoints, pointsBreakdown })
      ] }) }),
      screen === "feed" && !isOverlay && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShowCompose(true), style: { position: "absolute", bottom: 68, right: 16, width: 52, height: 52, borderRadius: "50%", background: T.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${T.red}60`, zIndex: 90 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 24, color: T.white, strokeWidth: 2 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, { active: isOverlay ? "" : screen, onNav: handleNav }),
      mapData && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        MapOverlay,
        {
          coords: mapData.coords,
          location: mapData.location,
          title: mapData.title,
          onClose: () => setMapData(null),
          recoveryCtx: mapData.recoveryCtx,
          onRecoveryStartTrip: (ctx) => {
            addNotification({ type: "recovery", user: "KyleLPO", text: "is on the way to help with", target: ctx.title, icon: Navigation, iconColor: T.green });
          },
          onRecoveryArrived: (ctx) => {
            setRecoveryConfirm(ctx);
          }
        }
      ),
      recoveryConfirm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: T.darkCard, borderRadius: 16, padding: 24, maxWidth: 340, width: "100%", textAlign: "center", border: `1px solid ${T.charcoal}` }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 56, height: 56, borderRadius: "50%", background: `${T.green}18`, border: `2px solid ${T.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { size: 28, color: T.green }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { fontFamily: sans, fontSize: 18, color: T.white, margin: "0 0 6px", fontWeight: 700 }, children: "Responder Arrived" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 6px", lineHeight: 1.5 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: T.copper, fontWeight: 600 }, children: "KyleLPO" }),
          " has arrived at your location for:"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, margin: "0 0 20px" }, children: recoveryConfirm.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontFamily: serif, fontSize: 12, color: T.tertiary, margin: "0 0 20px", lineHeight: 1.5 }, children: "Confirm they showed up to award them recovery points." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
            awardPoints(POINTS.recoveryRespond, "Recovery Response");
            addNotification({ type: "recovery", user: recoveryConfirm.author, text: "confirmed your recovery response for", target: recoveryConfirm.title, icon: CircleCheckBig, iconColor: T.green });
            setRecoveryConfirm(null);
          }, style: { flex: 1, padding: "12px", borderRadius: 8, background: T.green, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 12, fontWeight: 700, color: T.white, letterSpacing: 0.5 }, children: "CONFIRM ARRIVAL" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setRecoveryConfirm(null), style: { padding: "12px 16px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", fontFamily: sans, fontSize: 12, color: T.tertiary, fontWeight: 600 }, children: "DISMISS" })
        ] })
      ] }) }),
      activeNavRoute && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteNavigation, { route: activeNavRoute, onClose: () => setActiveNavRoute(null) }),
      showRecorder && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        RouteRecorder,
        {
          onClose: () => setShowRecorder(false),
          onSave: (routeData) => {
            const id = "rec_route_" + Date.now();
            const distMi = routeData.distance ? (routeData.distance / 1609.34).toFixed(1) : "\u2014";
            const durStr = routeData.duration ? typeof routeData.duration === "number" ? (() => {
              const h = Math.floor(routeData.duration / 3600);
              const m = Math.floor(routeData.duration % 3600 / 60);
              return h > 0 ? `${h}H ${m}M` : `${m}M`;
            })() : routeData.duration : "\u2014";
            const recPins = [];
            if (routeData.points && routeData.points.length > 0) {
              recPins.push({ lat: routeData.points[0].lat, lng: routeData.points[0].lng });
              if (routeData.photos) routeData.photos.filter((p) => p.lat && p.lng).forEach((p) => recPins.push({ lat: p.lat, lng: p.lng, photo: true }));
              if (routeData.points.length > 1) recPins.push({ lat: routeData.points[routeData.points.length - 1].lat, lng: routeData.points[routeData.points.length - 1].lng });
            }
            const allPins = routeData.pins && routeData.pins.length > 0 ? routeData.pins : recPins;
            setUserRoutes((prev) => [{
              id,
              name: routeData.name,
              desc: routeData.desc || "",
              difficulty: routeData.difficulty || "Moderate",
              distance: distMi + " MI",
              time: durStr,
              elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "\u2014",
              location: routeData.location || routeData.region || "",
              terrains: routeData.terrains || [],
              tags: routeData.tags || [],
              pins: allPins,
              photos: routeData.photos || [],
              points: routeData.points || [],
              rating: null,
              reviews: 0,
              author: "KyleLPO",
              createdAt: Date.now()
            }, ...prev]);
            if (routeData.shareToFeed) {
              setFeedItems((prev) => [{
                id,
                type: "ROUTES",
                user: "KyleLPO",
                initial: "K",
                time: Date.now(),
                title: routeData.name,
                body: routeData.desc || null,
                distance: distMi + " MI",
                duration: durStr,
                badge: null,
                verified: 0,
                likes: 0,
                comments: 0,
                difficulty: routeData.difficulty || "Moderate",
                elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "\u2014",
                location: routeData.location || routeData.region || "",
                terrains: routeData.terrains || [],
                tags: routeData.tags || [],
                photos: routeData.photos || [],
                pins: allPins,
                points: routeData.points || []
              }, ...prev]);
            }
            awardPoints(POINTS.routeLogged, "Route Logged");
            if (routeData.photos && routeData.photos.length > 0) awardPoints(POINTS.photoUploaded * routeData.photos.length, "Photos Uploaded");
            setShowRecorder(false);
          }
        }
      ),
      showManualRoute && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        RouteDetailsForm,
        {
          isManual: true,
          onBack: () => setShowManualRoute(false),
          onPublish: (routeData) => {
            const id = "user_route_" + Date.now();
            setUserRoutes((prev) => [{
              id,
              name: routeData.name,
              desc: routeData.desc || "",
              difficulty: routeData.difficulty || "Moderate",
              distance: routeData.distance ? routeData.distance + " MI" : "\u2014",
              time: routeData.time || "\u2014",
              elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "\u2014",
              location: routeData.location || "",
              terrains: routeData.terrains || [],
              tags: routeData.tags || [],
              pins: routeData.pins || [],
              photos: routeData.photos || [],
              points: routeData.points || [],
              rating: null,
              reviews: 0,
              author: "KyleLPO",
              createdAt: Date.now()
            }, ...prev]);
            if (routeData.shareToFeed) {
              setFeedItems((prev) => [{
                id,
                type: "ROUTES",
                user: "KyleLPO",
                initial: "K",
                time: Date.now(),
                title: routeData.name,
                body: routeData.desc || null,
                distance: routeData.distance ? routeData.distance + " MI" : "\u2014",
                duration: routeData.time || "\u2014",
                badge: null,
                verified: 0,
                likes: 0,
                comments: 0,
                difficulty: routeData.difficulty || "Moderate",
                elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "\u2014",
                location: routeData.location || "",
                terrains: routeData.terrains || [],
                tags: routeData.tags || [],
                photos: routeData.photos || [],
                pins: routeData.pins || [],
                points: routeData.points || []
              }, ...prev]);
            }
            awardPoints(POINTS.routeLogged, "Route Logged");
            if (routeData.photos && routeData.photos.length > 0) awardPoints(POINTS.photoUploaded * routeData.photos.length, "Photos Uploaded");
            setShowManualRoute(false);
          }
        }
      ),
      showGlobalSearch && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        GlobalSearch,
        {
          onClose: () => setShowGlobalSearch(false),
          onViewUser: (handle) => {
            setShowGlobalSearch(false);
            openUserProfile(handle);
          },
          onOpenThread: (threadId, catName, subName) => {
            setShowGlobalSearch(false);
            openForumThread(threadId, catName, subName);
          },
          onNavigate: (s) => {
            setShowGlobalSearch(false);
            setScreen(s);
          },
          forumUserReplies,
          forumViewCounts
        }
      ),
      showDM && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        DMScreen,
        {
          onClose: () => {
            setShowDM(false);
            setDmInitialUser(null);
            setDmInitialMessage("");
            setDmSharedPost(null);
          },
          onViewUser: (handle) => {
            setShowDM(false);
            setDmInitialUser(null);
            setDmInitialMessage("");
            setDmSharedPost(null);
            openUserProfile(handle);
          },
          initialUser: dmInitialUser,
          initialMessage: dmInitialMessage,
          initialSharedPost: dmSharedPost,
          conversations: dmConvos,
          setConversations: setDmConvos,
          onOpenPost: (sp) => {
            setShowDM(false);
            setDmInitialUser(null);
            setDmInitialMessage("");
            setDmSharedPost(null);
            if (sp.type === "FORUM" && sp.threadId) {
              openForumThread(sp.threadId, sp.forumCat, sp.forumSub);
            } else {
              setProfileStack([]);
              setShowRecovery(false);
              setShowCompose(false);
              setScreen("feed");
            }
          }
        },
        dmKey
      ),
      pointsToasts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 6, alignItems: "center", pointerEvents: "none" }, children: pointsToasts.map((toast) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: `linear-gradient(135deg, ${T.charcoal}, #333330)`, border: `1px solid ${T.copper}40`, borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, animation: "fadeInUp 0.3s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 14, color: T.copper, fill: T.copper }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontFamily: sans, fontSize: 13, color: T.copper, fontWeight: 700 }, children: [
          "+",
          toast.amount
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: sans, fontSize: 11, color: T.tertiary }, children: toast.reason })
      ] }, toast.id)) })
    ] });
  }
})();
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.js:
  (**
   * @license React
   * react-jsx-runtime.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils/mergeClasses.js:
lucide-react/dist/esm/shared/src/utils/toKebabCase.js:
lucide-react/dist/esm/shared/src/utils/toCamelCase.js:
lucide-react/dist/esm/shared/src/utils/toPascalCase.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/shared/src/utils/hasA11yProp.js:
lucide-react/dist/esm/context.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/arrow-up.js:
lucide-react/dist/esm/icons/at-sign.js:
lucide-react/dist/esm/icons/award.js:
lucide-react/dist/esm/icons/bell.js:
lucide-react/dist/esm/icons/bookmark.js:
lucide-react/dist/esm/icons/camera.js:
lucide-react/dist/esm/icons/chevron-down.js:
lucide-react/dist/esm/icons/chevron-left.js:
lucide-react/dist/esm/icons/chevron-right.js:
lucide-react/dist/esm/icons/chevron-up.js:
lucide-react/dist/esm/icons/circle-check-big.js:
lucide-react/dist/esm/icons/clock.js:
lucide-react/dist/esm/icons/compass.js:
lucide-react/dist/esm/icons/dollar-sign.js:
lucide-react/dist/esm/icons/external-link.js:
lucide-react/dist/esm/icons/eye-off.js:
lucide-react/dist/esm/icons/eye.js:
lucide-react/dist/esm/icons/flame.js:
lucide-react/dist/esm/icons/globe.js:
lucide-react/dist/esm/icons/heart.js:
lucide-react/dist/esm/icons/house.js:
lucide-react/dist/esm/icons/image.js:
lucide-react/dist/esm/icons/lock.js:
lucide-react/dist/esm/icons/mail.js:
lucide-react/dist/esm/icons/map-pin.js:
lucide-react/dist/esm/icons/map.js:
lucide-react/dist/esm/icons/message-circle.js:
lucide-react/dist/esm/icons/mountain.js:
lucide-react/dist/esm/icons/navigation.js:
lucide-react/dist/esm/icons/pen-line.js:
lucide-react/dist/esm/icons/plus.js:
lucide-react/dist/esm/icons/radio.js:
lucide-react/dist/esm/icons/search.js:
lucide-react/dist/esm/icons/send.js:
lucide-react/dist/esm/icons/settings.js:
lucide-react/dist/esm/icons/share-2.js:
lucide-react/dist/esm/icons/shield.js:
lucide-react/dist/esm/icons/smartphone.js:
lucide-react/dist/esm/icons/star.js:
lucide-react/dist/esm/icons/target.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/icons/trending-up.js:
lucide-react/dist/esm/icons/triangle-alert.js:
lucide-react/dist/esm/icons/trophy.js:
lucide-react/dist/esm/icons/user-check.js:
lucide-react/dist/esm/icons/user-plus.js:
lucide-react/dist/esm/icons/users.js:
lucide-react/dist/esm/icons/video.js:
lucide-react/dist/esm/icons/wrench.js:
lucide-react/dist/esm/icons/x.js:
lucide-react/dist/esm/icons/zap.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v1.7.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
