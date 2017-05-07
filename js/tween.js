"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const Easing = exports.Easing = {
  outQuad(t, destination, duration) {
    t /= duration
    return -destination * t * (t - 2)
  },

  inQuad(t, destination, duration) {
    t /= duration
    return destination * t * t
  },

  inOutQuad(t, c, d) {
    t /= d/2
    if (t < 1) return c/2*t*t
    t--
    return -c/2 * (t*(t-2) - 1)
  },

  linear(t, destination, duration) {
    return (destination * (t / duration))
  },
}

function defaults(a) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    for (var i = 0, k = void 0; i < args.length; i++) {
        for (k in args[i]) {
            if (a[k] === undefined)
                a[k] = args[i][k];
        }
    }
    return a;
}

/**
 * Represents a Tween. If we need to, we'll make this generic
 */
var Tween = (function () {
    function Tween(options) {
        if (options === void 0) { options = {}; }
        this.currentStep = 0;
        this.listeners = [];
        this.isStopped = false;
        this.options = defaults(options, Tween.defaults);
    }
    Tween.prototype.stop = function () {
        this.isStopped = true;
        return this;
    };
    Tween.prototype.start = function (val) {
        this.options.startValue = val;
        return this;
    };
    Tween.prototype.end = function (val) {
        this.options.endValue = val;
        return this;
    };
    Tween.prototype.easing = function (val) {
        this.options.easing = val;
        return this;
    };
    Tween.prototype.duration = function (val) {
        this.options.duration = val;
        return this;
    };
    Tween.prototype.onTick = function (callback) {
        this.listeners.push(callback);
        return this;
    };
    Tween.prototype.execute = function (callback) {
        this.startTime = this.options.now();
        this.next(callback);
        return this;
    };
    Tween.prototype.next = function (callback) {
        var _this = this;
        this.options.timingFunction(function (now) { return _this._onTick(now, callback); });
    };
    Tween.prototype._onTick = function (now, callback) {
        // If the user manually stopped by calling .stop()
        if (this.isStopped) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }
        var timeStep = Math.min(now - this.startTime, this.options.duration);
        this.currentValue = this.options.startValue + this.options.easing(timeStep, this.options.endValue - this.options.startValue, this.options.duration);
        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i](this.currentValue, this.currentStep);
        }
        this.currentStep++;
        if (timeStep === this.options.duration) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }
        this.next(callback);
    };
    return Tween;
}());
Tween.defaults = {
    duration: 300,
    easing: exports.Easing.linear,
};
exports.Tween = Tween;
function createTween(options) {
    return new Tween(options);
}
exports.default = createTween;
var BrowserTween = (function (_super) {
    __extends(BrowserTween, _super);
    function BrowserTween(options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        var now = 'performance' in window
            ? performance.now.bind(performance)
            : (function (start) { return function () { return start - new Date().valueOf(); }; })(new Date().valueOf());
        _this = _super.call(this, defaults(options, {
            now: now,
            timingFunction: 'requestAnimationFrame' in window
                ? requestAnimationFrame.bind(window)
                : function (callback) { return setTimeout(function () { return callback(now()); }, 0); }
        })) || this;
        return _this;
    }
    return BrowserTween;
}(Tween));
exports.BrowserTween = BrowserTween;