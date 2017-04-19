/* 
 *  Count down plugin
 * @author ken.tsai@advantech.com.tw
 * @date 20141022
 */

;
(function ($) {
    //define plugin name
    var pluginName = 'timer';

    //create plugin class
    function Plugin(element, options) {

        this.logger = log4jq.getLogger({
            loggerName: 'timer.js'
        });

        this.el = element;
        this.$el = $(element);

        this.jqTimerInstance = null;//save settimeout object
        this.jqRefreshTimeInterval = null;

        this.options = $.extend({}, $.fn[pluginName].defaults, options);

        //constrctor
        this.init();

        return this;
    }
    ;

    Plugin.prototype.name = pluginName;
    Plugin.prototype.version = '0.0.1';

    Plugin.prototype = {
        init: function () {

            var plugin = this;

            var opts = plugin.options;

            plugin.logger.info('call init func');


            var autoPlay = opts.autoPlay;
            plugin.logger.debug('auto play: ' + autoPlay);

            //update refresh time 
            plugin.jqRefreshTimeInterval = opts.interval * 1000;
//            plugin.jqRefreshTimeInterval = 1 * 1000;//testing
            plugin.logger.debug('refresh interval: ' + plugin.jqRefreshTimeInterval);

            if (autoPlay && plugin.jqRefreshTimeInterval > 0) {
                plugin.logger.debug('call playPooling');
                plugin.startPooling();
            }
        },
        setInterval: function (newInterval) {
            var plugin = this;
            plugin.logger.info('call setInterval fuc: ' + newInterval);
            plugin.options.interval = newInterval;
            plugin.jqRefreshTimeInterval = plugin.options.interval * 1000;
            plugin.stopPooling();
            plugin.startPooling();
        },
        startPooling: function ()
        {

            var plugin = this;

            var opts = plugin.options;
            var currTime = opts.interval;
            plugin.stopPooling();
            plugin.logger.info('call startPooling fuc: ' + currTime);
            if (currTime > 0) {

//                plugin.jqTimerInstance =
//                        setInterval(function () {
//                            plugin.logger.debug('set interval');
//                            if (opts.afterPooling && typeof (opts.afterPooling) === 'function') {
//                                plugin.logger.debug('setInterval timer id: ' + plugin.jqTimerInstance);
//                                opts.afterPooling(plugin.$el, plugin.jqTimerInstance, 'start');
//                            }
//                        }, opts.interval * 1000);

                plugin.jqTimerInstance =
                        setInterval(function () {


                            if (currTime >= 0) {
                                if (opts.afterCountdown && typeof (opts.afterCountdown) === 'function') {
                                    plugin.logger.debug('currTime(' + plugin.jqTimerInstance + '): ' + currTime);
                                    opts.afterCountdown(currTime);
                                }

                                currTime = currTime - 1;
                            } else {
                                //reset with start time
//                              plugin.$widgetFooter.html(opts.interval);

                                if (opts.afterPooling && typeof (opts.afterPooling) === 'function') {
                                    plugin.logger.debug('setInterval timer id: ' + plugin.jqTimerInstance);
                                    opts.afterPooling(plugin.$el, plugin.jqTimerInstance, 'start');
                                    //reset
                                    currTime = opts.interval;
                                }
                            }


                        }, 1000);


                plugin.logger.debug('create timer id: ' + plugin.jqTimerInstance);

            } else {
                plugin.logger.debug('cannot init pooling process. current interval:' + opts.interval);
            }
        },
        stopPooling: function () {
            var plugin = this;
            plugin.logger.info('call stopPooling func');

            if (plugin.jqTimerInstance != null) {
                plugin.logger.debug('delete  timer id: ' + plugin.jqTimerInstance);
                clearInterval(plugin.jqTimerInstance);
            }
        },
        /**
         * The 'destroy' method is were you free the resources used by your plugin:
         * references, unregister listeners, etc.
         *
         * Remember to unbind for your event:
         *
         * @example
         * this.$someSubElement.off('.' + pluginName);
         *
         * Above example will remove any listener from your plugin for on the given
         * element.
         */
        destroy: function () {
            var plugin = this;

            plugin.logger.info('call destroy func');
            plugin.stopPooling();

            this.$el.removeData();
        },
        /**
         * Write public methods within the plugin's prototype. They can 
         * be called with:
         *
         * @example
         * $('#element').jqueryPlugin('somePublicMethod','Arguments', 'Here', 1001);
         *  
         * @param  {[type]} foo [some parameter]
         * @param  {[type]} bar [some other parameter]
         * @return {[type]}
         */
        pubMethod: function () {

        }

    }

    /**
     * This is a real private method. A plugin instance has access to it
     * @return {[type]}
     */
    var privateMethod = function () {
        console.log("privateMethod");
        console.log(this);
    };

    // Plugin wrapper around the constructor,
    $.fn[pluginName] = function (options) {

        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            // Create a plugin instance for each selected element.
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            // Call a pluguin method for each selected element.
            if (Array.prototype.slice.call(args, 1).length == 0 && $.inArray(options, $.fn[pluginName].getters) != -1) {
                // If the user does not pass any arguments and the method allows to
                // work as a getter then break the chainability
                var instance = $.data(this[0], 'plugin_' + pluginName);
                return instance[options].apply(instance, Array.prototype.slice.call(args, 1));
            } else {
                // Invoke the speficied method on each selected element
                return this.each(function () {
                    var instance = $.data(this, 'plugin_' + pluginName);
                    if (instance instanceof Plugin && typeof instance[options] === 'function') {
                        instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                    }
                });
            }
        }
    }

    /**
     * Names of the pluguin methods that can act as a getter method.
     * @type {Array}
     */
    $.fn[pluginName].getters = ['pubMethod'];

    /**
     * Default options
     */
    $.fn[pluginName].defaults = {
        autoPlay: true,
        interval: 60,
        afterPooling: null //event callback
    };

})(jQuery);