/*
 * OKZoom by OKFocus v1.2
 * http://okfoc.us // @okfocus
 * Copyright 2012 OKFocus
 * Licensed under the MIT License
 **/

$(function ($) {

  // Identify browser based on useragent string
  var browser = (function (ua) {
    ua = ua.toLowerCase();
    var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
      /(webkit)[ \/]([\w.]+)/.exec(ua) ||
      /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
      /(msie) ([\w.]+)/.exec(ua) ||
      ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
    var matched = {
      browser: match[1] || "",
      version: match[2] || "0"
    };
    browser = {};
    if (matched.browser) {
      browser[matched.browser] = true;
      browser.version = matched.version;
    }
    // Chrome is Webkit, but Webkit is also Safari.
    if (browser.chrome) {
      browser.webkit = true;
    } else if (browser.webkit) {
      browser.safari = true;
    }
    if (window.$) $.browser = browser;
    return browser;
  })(navigator.userAgent);

  var is_iphone = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))
  var is_ipad = (navigator.userAgent.match(/iPad/i))
  var is_android = (navigator.userAgent.match(/Android/i))
  var is_mobile = is_iphone || is_ipad || is_android
  var is_desktop = !is_mobile;
  var transitionProp = browser.safari ? "WebkitTransition" : "transition";
  var transformProp = browser.safari ? "WebkitTransform" : "transform";
  var longTransformProp = browser.safari ? "-webkit-transform" : "transform";
  var transformOriginProp = browser.safari ? "WebkitTransformOrigin" : "transformOrigin";

  $.fn.okzoom = function (options) {
    options = $.extend({}, $.fn.okzoom.defaults, options);

    return this.each(function () {
      var base = {};
      var el = this;
      base.options = options;
      base.$el = $(el);
      base.el = el;

      base.listener = document.createElement('div');
      base.$listener = $(base.listener).addClass('ok-listener').css({
        position: 'absolute',
        zIndex: 10000
      });
      $('body').append(base.$listener);

      var loupe = document.createElement("div");
      loupe.id = "ok-loupe";
      loupe.style.position = "absolute";
      loupe.style.backgroundRepeat = "no-repeat";
      loupe.style.pointerEvents = "none";
      loupe.style.opacity = 0;
      loupe.style.zIndex = 99999;
      $('body').append(loupe);
      base.loupe = loupe;

      base.$el.data("okzoom", base);

      base.options = options;

      if (is_mobile) {
        base.$el.bind('touchstart', (function (b) {
          return function (e) {
            console.log("TS", e)
            e.preventDefault()
            $.fn.okzoom.build(b, e.originalEvent.touches[0]);
          };
        }(base)));

        base.$el.bind('touchmove', (function (b) {
          return function (e) {
            console.log("TM")
            e.preventDefault()
            $.fn.okzoom.mousemove(b, e.originalEvent.touches[0]);
          };
        }(base)));

        base.$el.bind('touchend', (function (b) {
          return function (e) {
            console.log("TE")
            e.preventDefault()
            $.fn.okzoom.mouseout(b, e);
          };
        }(base)));
      } else {
        $(base.el).bind('mouseover', (function (b) {
          return function (e) {
            $.fn.okzoom.build(b, e);
          };
        }(base)));

        base.$listener.bind('mousemove', (function (b) {
          return function (e) {
            $.fn.okzoom.mousemove(b, e);
          };
        }(base)));

        base.$listener.bind('mouseout', (function (b) {
          return function (e) {
            $.fn.okzoom.mouseout(b, e);
          };
        }(base)));
      }

      base.options.height = base.options.height || base.options.width;

      base.image_from_data = base.$el.data("okimage");
      base.has_data_image = typeof base.image_from_data !== "undefined";
      base.timeout = null

      if (base.has_data_image) {
        base.img = new Image();
        base.img.src = base.image_from_data;
      }

      base.msie = -1; // Return value assumes failure.
      if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
          base.msie = parseFloat(RegExp.$1);
      }
    });
  };

  $.fn.okzoom.defaults = {
    "width": 150,
    "height": null,
    "scaleWidth": null,
    "round": true,
    "background": "#fff",
    "backgroundRepeat": "no-repeat",
    "shadow": "0 0 4px #000",
    "inset": 0,
    "border": 0,
    "transform": is_mobile ? ["scale(0)", "scale(1)"] : null,
    "transformOrigin": is_mobile ? "50% 100%" : "50% 50%",
    "transitionTime": 200,
    "transitionTimingFunction": "cubic-bezier(0,0,0,1)",
  };

  $.fn.okzoom.build = function (base, e) {
    if (!base.has_data_image) {
      base.img = base.el;
    } else if (base.image_from_data != base.$el.attr('data-okimage')) {
      // data() returns cached values, whereas attr() returns from the dom.
      base.image_from_data = base.$el.attr('data-okimage');

      $(base.img).remove();
      base.img = new Image();
      base.img.src = base.image_from_data;
    }

    if (base.msie > -1 && base.msie < 9.0 && !base.img.naturalized) {
      var naturalize = function (img) {
        img = img || this;
        var io = new Image();

        io.el = img;
        io.src = img.src;

        img.naturalWidth = io.width;
        img.naturalHeight = io.height;
        img.naturalized = true;
      };
      if (base.img.complete) naturalize(base.img);
      else return;
    }

    base.offset = base.$el.offset();
    base.width = base.$el.width();
    base.height = base.$el.height();
    base.$listener.css({
      display: 'block',
      width: base.$el.outerWidth(),
      height: base.$el.outerHeight(),
      top: base.$el.offset().top,
      left: base.$el.offset().left
    });

    if (base.options.scaleWidth) {
      base.naturalWidth = base.options.scaleWidth;
      base.naturalHeight = Math.round(base.img.naturalHeight * base.options.scaleWidth / base.img.naturalWidth);
    } else {
      base.naturalWidth = base.img.naturalWidth;
      base.naturalHeight = base.img.naturalHeight;
    }

    base.widthRatio = base.naturalWidth / base.width;
    base.heightRatio = base.naturalHeight / base.height;

    base.loupe.style.width = base.options.width + "px";
    base.loupe.style.height = base.options.height + "px";
    base.loupe.style.border = base.options.border;
    base.loupe.style.background = base.options.background + " url(" + base.img.src + ")";
    base.loupe.style.backgroundRepeat = base.options.backgroundRepeat;
    base.loupe.style.backgroundSize = base.options.scaleWidth ?
      base.naturalWidth + "px " + base.naturalHeight + "px" : "auto";
    base.loupe.style.borderRadius =
      base.loupe.style.MozBorderRadius =
      base.loupe.style.WebkitBorderRadius = base.options.round ? "50%" : 0;
    base.loupe.style.boxShadow = base.options.shadow;
    base.loupe.style.opacity = 0;
    if (base.options.transform) {
      base.loupe.style[transformProp] = base.options.transform[0]
      base.loupe.style[transformOriginProp] = base.options.transformOrigin
      base.loupe.style[transitionProp] = longTransformProp + " " + base.options.transitionTime
    }
    base.initialized = true;
    $.fn.okzoom.mousemove(base, e);
  };

  $.fn.okzoom.mousemove = function (base, e) {
    if (!base.initialized) return;
    var shimLeft = base.options.width / 2;
    var shimTop = base.options.height / 2;
    var offsetTop = is_mobile ? base.options.height : shimTop
    var pageX = typeof e.pageX !== 'undefined' ? e.pageX :
      (e.clientX + document.documentElement.scrollLeft);
    var pageY = typeof e.pageY !== 'undefined' ? e.pageY :
      (e.clientY + document.documentElement.scrollTop);
    var scaleLeft = -1 * Math.floor((pageX - base.offset.left) * base.widthRatio - shimLeft);
    var scaleTop = -1 * Math.floor((pageY - base.offset.top) * base.heightRatio - shimTop);

    document.body.style.cursor = "none";
    // base.loupe.style.display = "block";
    base.loupe.style.left = pageX - shimLeft + "px";
    base.loupe.style.top = pageY - offsetTop + "px";
    base.loupe.style.backgroundPosition = scaleLeft + "px " + scaleTop + "px";
    base.loupe.style.opacity = 1;
    if (base.options.transform) {
      base.loupe.style[transformProp] = base.options.transform[1]
      base.loupe.style[transformProp] = base.options.transform[1]
      base.loupe.style[transitionProp] = longTransformProp + " " + base.options.transitionTime + "ms " + base.options.transitionTimingFunction
    }
    clearTimeout(base.timeout)
  };

  $.fn.okzoom.mouseout = function (base, e) {
    // base.loupe.style.display = "none";
    if (base.options.transform) {
      base.loupe.style[transformProp] = base.options.transform[0]
      base.timeout = setTimeout(function () {
        base.loupe.style.opacity = 0;
      }, base.options.transitionTime);
    } else {
      base.loupe.style.opacity = 0;
    }
    base.loupe.style.background = "none";
    base.listener.style.display = "none";
    document.body.style.cursor = "auto";
  };

});
(function (root, factory) {
  'use strict';
  if(typeof define === 'function' && define.amd) {
      define(['jquery'], function($){
          factory($);
      });
  } else if(typeof module === 'object' && module.exports) {
      module.exports = (root.EasyZoom = factory(require('jquery')));
  } else {
      root.EasyZoom = factory(root.jQuery);
  }
}(this, function ($) {

  'use strict';

  var zoomImgOverlapX;
  var zoomImgOverlapY;
  var ratioX;
  var ratioY;
  var pointerPositionX;
  var pointerPositionY;

  var defaults = {

      // The text to display within the notice box while loading the zoom image.
      loadingNotice: 'Loading image',

      // The text to display within the notice box if an error occurs when loading the zoom image.
      errorNotice: 'The image could not be loaded',

      // The time (in milliseconds) to display the error notice.
      errorDuration: 2500,

      // Attribute to retrieve the zoom image URL from.
      linkAttribute: 'href',

      // Prevent clicks on the zoom image link.
      preventClicks: true,

      // Callback function to execute before the flyout is displayed.
      beforeShow: $.noop,

      // Callback function to execute before the flyout is removed.
      beforeHide: $.noop,

      // Callback function to execute when the flyout is displayed.
      onShow: $.noop,

      // Callback function to execute when the flyout is removed.
      onHide: $.noop,

      // Callback function to execute when the cursor is moved while over the image.
      onMove: $.noop

  };

  /**
   * EasyZoom
   * @constructor
   * @param {Object} target
   * @param {Object} options (Optional)
   */
  function EasyZoom(target, options) {
      this.$target = $(target);
      this.opts = $.extend({}, defaults, options, this.$target.data());

      this.isOpen === undefined && this._init();
  }

  /**
   * Init
   * @private
   */
  EasyZoom.prototype._init = function() {
      this.$link   = this.$target.find('a');
      this.$image  = this.$target.find('img');

      this.$flyout = $('<div class="easyzoom-flyout" />');
      this.$notice = $('<div class="easyzoom-notice" />');

      this.$target.on({
          'mousemove.easyzoom touchmove.easyzoom': $.proxy(this._onMove, this),
          'mouseleave.easyzoom touchend.easyzoom': $.proxy(this._onLeave, this),
          'mouseenter.easyzoom touchstart.easyzoom': $.proxy(this._onEnter, this)
      });

      this.opts.preventClicks && this.$target.on('click.easyzoom', function(e) {
          e.preventDefault();
      });
  };

  /**
   * Show
   * @param {MouseEvent|TouchEvent} e
   * @param {Boolean} testMouseOver (Optional)
   */
  EasyZoom.prototype.show = function(e, testMouseOver) {
      var self = this;

      if (this.opts.beforeShow.call(this) === false) return;

      if (!this.isReady) {
          return this._loadImage(this.$link.attr(this.opts.linkAttribute), function() {
              if (self.isMouseOver || !testMouseOver) {
                  self.show(e);
              }
          });
      }

      this.$target.append(this.$flyout);

      var targetWidth = this.$target.outerWidth();
      var targetHeight = this.$target.outerHeight();

      var flyoutInnerWidth = this.$flyout.width();
      var flyoutInnerHeight = this.$flyout.height();

      var zoomImgWidth = this.$zoom.width();
      var zoomImgHeight = this.$zoom.height();

      zoomImgOverlapX = Math.ceil(zoomImgWidth - flyoutInnerWidth);
      zoomImgOverlapY = Math.ceil(zoomImgHeight - flyoutInnerHeight);

      // For when the zoom image is smaller than the flyout element.
      if (zoomImgOverlapX < 0) zoomImgOverlapX = 0;
      if (zoomImgOverlapY < 0) zoomImgOverlapY = 0;

      ratioX = zoomImgOverlapX / targetWidth;
      ratioY = zoomImgOverlapY / targetHeight;

      this.isOpen = true;

      this.opts.onShow.call(this);

      e && this._move(e);
  };

  /**
   * On enter
   * @private
   * @param {Event} e
   */
  EasyZoom.prototype._onEnter = function(e) {
      var touches = e.originalEvent.touches;

      this.isMouseOver = true;

      if (!touches || touches.length == 1) {
          e.preventDefault();
          this.show(e, true);
      }
  };

  /**
   * On move
   * @private
   * @param {Event} e
   */
  EasyZoom.prototype._onMove = function(e) {
      if (!this.isOpen) return;

      e.preventDefault();
      this._move(e);
  };

  /**
   * On leave
   * @private
   */
  EasyZoom.prototype._onLeave = function() {
      this.isMouseOver = false;
      this.isOpen && this.hide();
  };

  /**
   * On load
   * @private
   * @param {Event} e
   */
  EasyZoom.prototype._onLoad = function(e) {
      // IE may fire a load event even on error so test the image dimensions
      if (!e.currentTarget.width) return;

      this.isReady = true;

      this.$notice.detach();
      this.$flyout.html(this.$zoom);
      this.$target.removeClass('is-loading').addClass('is-ready');

      e.data.call && e.data();
  };

  /**
   * On error
   * @private
   */
  EasyZoom.prototype._onError = function() {
      var self = this;

      this.$notice.text(this.opts.errorNotice);
      this.$target.removeClass('is-loading').addClass('is-error');

      this.detachNotice = setTimeout(function() {
          self.$notice.detach();
          self.detachNotice = null;
      }, this.opts.errorDuration);
  };

  /**
   * Load image
   * @private
   * @param {String} href
   * @param {Function} callback
   */
  EasyZoom.prototype._loadImage = function(href, callback) {
      var zoom = new Image();

      this.$target
          .addClass('is-loading')
          .append(this.$notice.text(this.opts.loadingNotice));

      this.$zoom = $(zoom)
          .on('error', $.proxy(this._onError, this))
          .on('load', callback, $.proxy(this._onLoad, this));

      zoom.style.position = 'absolute';
      zoom.src = href;
  };

  /**
   * Move
   * @private
   * @param {Event} e
   */
  EasyZoom.prototype._move = function(e) {

      if (e.type.indexOf('touch') === 0) {
          var touchlist = e.touches || e.originalEvent.touches;
          pointerPositionX = touchlist[0].pageX;
          pointerPositionY = touchlist[0].pageY;
      } else {
          pointerPositionX = e.pageX || pointerPositionX;
          pointerPositionY = e.pageY || pointerPositionY;
      }

      var targetOffset  = this.$target.offset();
      var relativePositionX = pointerPositionX - targetOffset.left;
      var relativePositionY = pointerPositionY - targetOffset.top;
      var moveX = Math.ceil(relativePositionX * ratioX);
      var moveY = Math.ceil(relativePositionY * ratioY);

      // Close if outside
      if (moveX < 0 || moveY < 0 || moveX > zoomImgOverlapX || moveY > zoomImgOverlapY) {
          this.hide();
      } else {
          var top = moveY * -1;
          var left = moveX * -1;

          this.$zoom.css({
              top: top,
              left: left
          });

          this.opts.onMove.call(this, top, left);
      }

  };

  /**
   * Hide
   */
  EasyZoom.prototype.hide = function() {
      if (!this.isOpen) return;
      if (this.opts.beforeHide.call(this) === false) return;

      this.$flyout.detach();
      this.isOpen = false;

      this.opts.onHide.call(this);
  };

  /**
   * Swap
   * @param {String} standardSrc
   * @param {String} zoomHref
   * @param {String|Array} srcset (Optional)
   */
  EasyZoom.prototype.swap = function(standardSrc, zoomHref, srcset) {
      this.hide();
      this.isReady = false;

      this.detachNotice && clearTimeout(this.detachNotice);

      this.$notice.parent().length && this.$notice.detach();

      this.$target.removeClass('is-loading is-ready is-error');

      this.$image.attr({
          src: standardSrc,
          srcset: $.isArray(srcset) ? srcset.join() : srcset
      });

      this.$link.attr(this.opts.linkAttribute, zoomHref);
  };

  /**
   * Teardown
   */
  EasyZoom.prototype.teardown = function() {
      this.hide();

      this.$target
          .off('.easyzoom')
          .removeClass('is-loading is-ready is-error');

      this.detachNotice && clearTimeout(this.detachNotice);

      delete this.$link;
      delete this.$zoom;
      delete this.$image;
      delete this.$notice;
      delete this.$flyout;

      delete this.isOpen;
      delete this.isReady;
  };

  // jQuery plugin wrapper
  $.fn.easyZoom = function(options) {
      return this.each(function() {
          var api = $.data(this, 'easyZoom');

          if (!api) {
              $.data(this, 'easyZoom', new EasyZoom(this, options));
          } else if (api.isOpen === undefined) {
              api._init();
          }
      });
  };

  return EasyZoom;
}));
