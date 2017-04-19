/* 
 *  fans  plugin
 * @author ken.tsai@advantech.com.tw
 * @date 2015/03/06
 *  @requires
 *  js/libs/log4javascript/log4javascript.min.js
 *  js/sa/utils/log4jq.js
 */

;
(function ($) {
    //define plugin name
    var pluginName = 'fans';

    //create plugin class
    function Plugin(element, options) {

        this.logger = log4jq.getLogger({
            loggerName: 'fans.js'
        });

        this.el = element;
        this.$el = $(element);
      
        
        this.jqPlotInstance = null;
        this.jqRefreshTimeInterval = 0.1;
        this.rotateAngle = 0;
        this.status = null;
        this.paper = null;
        this.rotateImg = null;
        
        this.options = $.extend({}, $.fn[pluginName].defaults, options);
        
        this.onImg = this.options.on;
        this.offImg = this.options.off;
        
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

            plugin.logger.info('init');
            var opts = plugin.options;

            var $imgBG = $('<div class="widget-fans-bg"><img></div>');
            plugin.$el.append($imgBG);

            var $img = $imgBG.find('img').attr('src', opts.icon);
//            $img.hide();
//            var imgSrc = $img.attr('src');

            //raphael
//            var fanCavansWidth = plugin.$el.width()-20;
//            plugin.paper = Raphael(plugin.$el.find('div.widget-fans-bg')[0],
//            fanCavansWidth ,fanCavansWidth);
//         
//            plugin.rotateImg = plugin.paper.image(imgSrc,30 ,30, 200, 200);

            plugin._changeImage($img, false);
        },
        on: function () {

            var plugin = this;
            plugin.logger.info('on');
            plugin.status = 'on';
            var $img = plugin.$el.find('img');
            plugin._changeImage($img, true);
        },
        off: function () {

            var plugin = this;
            plugin.logger.info('off');
            plugin.status = 'off';
            var $img = plugin.$el.find('img');
            plugin._changeImage($img, false);
        },
        getStatus: function () {
            var plugin = this;
            plugin.logger.info('getStatus: ' + plugin.status);
            return  plugin.status;
        },
        _changeImage: function ($img, isOn) {
            var plugin = this;
            plugin.logger.info('_changeImage');

//            if (plugin.jqTimerInstance != null) {
//                clearInterval(plugin.jqTimerInstance);
//            }

            if (isOn) {
//                $img.attr('src','images/fans_on.gif');
                 $img.attr('src',plugin.onImg);
//                plugin.jqTimerInstance = setInterval(
//                        function () {
//
//                            plugin.rotateImg.rotate(10);
//
//                            if (plugin.rotateAngle > 360) {
//                                plugin.rotateAngle = 0;
//                            }
//                            plugin.rotateAngle += 10;
//                            
////                            plugin.logger.debug('rotate angle: ' + plugin.rotateAngle);
//
//
//                            //會爆
////                            plugin.rotateImg.animate({'transform': 'r' + plugin.rotateAngle}, 1000, "<>");
//                       
//
//                        },
//                        plugin.jqRefreshTimeInterval * 1000);

                plugin.logger.debug('create current timer id: ' + plugin.jqTimerInstance);
            } else {

                plugin.logger.debug('delete current timer id: ' + plugin.jqTimerInstance);
//               clearInterval(plugin.jqTimerInstance);
                
//                $img.attr('src','images/fans.png');
                  $img.attr('src',plugin.offImg);
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
            plugin.$el.empty();
            // Remove any attached data from your plugin
            plugin.$el.removeData();
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
    $.fn[pluginName].getters = ['getStatus'];

    /**
     * Default options
     */
    $.fn[pluginName].defaults = {
         icon: 'images/fans.png',
         on: 'images/fans_on.gif',
         off: 'images/fans.png'
         
    };

})(jQuery);