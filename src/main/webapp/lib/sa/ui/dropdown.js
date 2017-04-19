/* 
 *  dropdown  plugin for widget plugin
 * @author ken.tsai@advantech.com.tw
 * @date 2015/04/20
 */

;
(function ($) {
    //define plugin name
    var pluginName = 'dropdown';

    //create plugin class
    function Plugin(element, options) {
        console.log("Plugin");
        console.log(options);
        this.logger = log4jq.getLogger({
            loggerName: 'dropdown.js'
        });

        this.el = element;
        this.$el = $(element);

        this.$dropdownMenu = null;//save dropdown element

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
            console.log("init");
            var plugin = this;
            var opts = plugin.options;

            var $dropdownTarget = plugin.$el;
//            var opts = plugin.options;
            plugin.$dropdownMenu = $dropdownTarget.parent().find('.dropdown-menu');


            $(document).on('click', function (event) {
                plugin.logger.debug('hide dropdown menu');
//                console.log($(event.target));
                if (!$(event.target).closest('ul').length) {
                    plugin.$dropdownMenu.fadeOut();
                }
            });

            $dropdownTarget.on('click', function () {

                //show dropdown menu
                plugin.logger.debug('show dropdown menu');

//              console.log(plugin.$dropdownMenu );
                $('.dropdown-menu').hide();//hide all

                var $btn = $(this);
                var offset = $btn.offset();

                plugin.logger.debug("left: " + offset.left + ", top: " + offset.top);

                //menu show/hide
                if (plugin.$dropdownMenu.is(':visible')) {
                    plugin.$dropdownMenu.fadeOut();
                } else {

                    if (opts.beforeShow && typeof (opts.beforeShow) === 'function') {
                        opts.beforeShow($btn);
                    }
                    plugin.$dropdownMenu.fadeIn().focus()
                            .css({
                                position: 'fixed',
//                                position: 'absolute',
                                left: offset.left
//                                top: offset.top
                            });

                    if (opts.afterShow && typeof (opts.afterShow) === 'function') {
                        opts.afterShow($btn);
                    }
                }
            });
            plugin.$dropdownMenu.find('li a').on('click', function () {

                var $active = $(this);
                var $parentDropdownMenu = $active.parent().parent();
                //$parentDropdownMenu.fadeOut();
                var active = $active.attr('data-active');
                plugin.logger.debug('active val: ' + active);

                if (opts.afterActive && typeof (opts.afterActive) === 'function') {
                    opts.afterActive(active);
                }
            });
        },
        close: function () {
            var plugin = this;
            plugin.logger.info('close');
            if (plugin.$dropdownMenu !== null) {
                plugin.$dropdownMenu.fadeOut();
            } else {
                plugin.logger.warn('cannot find dropdown menu');
            }
            console.log("Close");
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

            // Remove any attached data from your plugin
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
        defaultOption: "I'm a default option",
        beforeShow: null, //show callback
        afterShow: null, //show callback
        afterActive: null//for confirm dialog for end user
    };


})(jQuery);