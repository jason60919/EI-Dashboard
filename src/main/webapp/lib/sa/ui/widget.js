/* 
 *   widget plugin
 * @date 20141001
 * @requires 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 */
;
(function ($) {

    //define plugin name
    var pluginName = 'widget';

    //create plugin class
    function Plugin(element, options) {

        this.logger = log4jq.getLogger({
            loggerName: 'widget.js'
        });

        this.el = element;
        this.$el = $(element);
        this.widgetId = null;
        
        this.options = $.extend({}, $.fn[pluginName].defaults, options);

        this.$widgetTitle = null;// title 
        this.$widgetFooter = null;//footer
        this.$widgetContent = null;// content 
        this.$btnToggle = null;// toggle button
        this.$btnRemove = null;// remove button
        this.$btnConfig = null;// config button
        this.$btnColor = null;// color button
        
        this.coutDownTimerInstance = null;//display countdown
        this.jqTimerInstance = null;//save settimeout object
        this.$currDropdownMenu = null;//save active dropdown menu
        
        this.status = 'hide';

        //constrctor
        this.init();

        return this;
    }
    ;

    Plugin.prototype.name = pluginName;
    Plugin.prototype.version = '0.0.1';

    //
    // Plugin prototype
    //
    Plugin.prototype = {
        init: function () {

            var plugin = this;
            plugin.logger.info('call init func');

            var $currWidget = plugin.$el;
            var opts = plugin.options;
            
            plugin.widgetId = $currWidget.attr('data-widget-id');
            var $widgetContent = plugin.$widgetContent = $currWidget.find('.widget-content');

            plugin.$widgetTitle = $currWidget.find('.widget-header');
            plugin.$widgetFooter =  $currWidget.find('.widget-footer');

            //get btn group elem
            var $btnGroup = $currWidget.find('.widget-header-toolbar-btn-group');
            var $btnToggle = plugin.$btnToggle = $btnGroup.find('.widget-header-toolbar-btn-toggle-collapse');
            //            console.log('toggle btn:' + $btnToggle.length);

            var $btnColor = $btnGroup.find('.widget-header-toolbar-btn-color');
            var $btnConfig = $btnGroup.find('.widget-header-toolbar-btn-config');

            var $btnRemove
                    = plugin.$btnRemove
                    = $btnGroup.find(".widget-header-toolbar-btn-remove");
            //            console.log('del btn:' + $btnRemove.length);

            //event binding
            $btnToggle.click(function () {
                //                console.log('click toggle: ');

                var $currBtn = $(this);

                if ($currBtn.hasClass('widget-header-toolbar-btn-toggle-collapse')) {
                    //hide
                    plugin._hide(function () {
                        if (opts.afterToggle && typeof (opts.afterToggle) === 'function') {
                            opts.afterToggle($currWidget, plugin.status);
                        }
                    });

                } else {
                    //show
                    plugin._show(function () {
                        if (opts.afterToggle && typeof (opts.afterToggle) === 'function') {
                            opts.afterToggle($currWidget, plugin.status);
                        }
                    });
                }
            });

            $btnRemove.click(function () {
                if (opts.beforeRemove && typeof (opts.beforeRemove) === 'function') {
                    opts.beforeRemove($currWidget);
                }
            });

            //2015/04/20 added by ken
            //color dropdown menu
            $btnColor.dropdown({
                afterShow: function($dropdownMenuTarget){
                       plugin.$currDropdownMenu = $dropdownMenuTarget;
                },
                afterActive: function (active) {
                    plugin.setLevel(active);
                    //change color
                    if (opts.afterThemeActive && typeof (opts.afterThemeActive) === 'function') {
                        opts.afterThemeActive($currWidget, active);
                    }
                }
            });
            
            //config dropdown menu
            $btnConfig.dropdown({
               afterShow: function($dropdownMenuTarget){
                       plugin.$currDropdownMenu = $dropdownMenuTarget;
                },
                afterActive: function (active) {
                    plugin.logger.debug('config button: ' + active);
                    //save curr dropdown menu elem
                 
                    if (active == 'title_desc') {
                        //change color
                        if (opts.afterConfigTextActive && typeof (opts.afterConfigTextActive) === 'function') {

                            opts.afterConfigTextActive($currWidget, active);
                        }
                    } else if (active == 'data_analytics') {

                        if (opts.afterConfigDataAnalyticsActive && typeof (opts.afterConfigDataAnalyticsActive) === 'function') {
                            opts.afterConfigDataAnalyticsActive($currWidget, active);
                        }

                    }

                }
            });

            if (opts.afterInit && typeof (opts.afterInit) === 'function') {
                opts.afterInit($currWidget);
            }
            plugin.startPooling();
        },
        updateTitle: function (newTitle) {
            var plugin = this;
            plugin.logger.info('call updateTitle func');
            var $title = plugin.$widgetTitle.find('h3');
            $title.html(newTitle).attr('title', newTitle);
        },
        //2015/04/20 added by ken
        setLevel: function (active) {
            var plugin = this;
            var $currWidget = plugin.$el;
            var activeClass = '';

            switch (active) {
                case 'default':
                    activeClass = 'widget';
                    break;
                case 'primary':
                    activeClass = 'widget widget-' + active;
                    break;
                case 'success':
                    activeClass = 'widget widget-' + active;
                    break;
                case 'info':
                    activeClass = 'widget widget-' + active;
                    break;
                case 'warning':
                    activeClass = 'widget widget-' + active;
                    break;
                case 'danger':
                    activeClass = 'widget widget-' + active;
                    break;
            }
            ;
            plugin.logger.debug('activeClass: ' + activeClass);
            $currWidget.removeAttr('class').addClass(activeClass);

        },
        
        closeDropdownMenu: function(){
              var plugin = this;
            plugin.logger.info('call closeDropdownMenu func');
//            console.log(plugin.$currDropdownMenu);
            if(plugin.$currDropdownMenu != null){
                plugin.$currDropdownMenu.dropdown('close');
            }else{
                plugin.logger.warn('cannot find dropdown menu');
            }
        },
        
        //block widget
        block: function () {
            var plugin = this;
            plugin.logger.info('call block func');

            if (plugin.$widgetContent.find('div.widget-block').length == 0) {
                plugin.$widgetContent.append('<div class="widget-block"></div>');
            } else {
                plugin.logger.warn('widget block has appended!!');
            }

        },
        unblock: function () {
            var plugin = this;
            plugin.logger.info('call unblock func');
            plugin.$widgetContent.find('div.widget-block').remove();
        },
        
        destroy: function () {
            // Remove any attached data from your plugin
            var plugin = this;
            plugin.logger.info('call destroy func');
            plugin.stopPooling();
            plugin.$el.removeData();
        },
        _show: function (callback) {

            $currBtn = this.$btnToggle;
            $widgetContent = this.$widgetContent;
            this.status = 'show';
            //show
            $currBtn.addClass('widget-header-toolbar-btn-toggle-collapse');
            $currBtn.removeClass('widget-header-toolbar-btn-toggle-expand');
            $widgetContent.show('slow', function () {

                callback();
            });

        },
        show: function () {
            //            console.log('call show func');
            this._show();
        },
        _hide: function (callback) {

            $currBtn = this.$btnToggle;
            $widgetContent = this.$widgetContent;
            this.status = 'hide';

            //hide
            $currBtn.removeClass('widget-header-toolbar-btn-toggle-collapse');
            $currBtn.addClass('widget-header-toolbar-btn-toggle-expand');
            $widgetContent.hide('slow', function () {
                callback();
            });
        },
        hide: function () {
            //            console.log('call hide func');
            this._hide();
        },
        remove: function () {
            //            console.log('call remove func');
            this.$btnRemove.click();
        },

        //!!!important
        startPooling: function () {

            var plugin = this;

            var opts = plugin.options;
            plugin.logger.info('call startPooling func');

            if (opts.interval > 0) {

//                plugin.countDown();

//                  plugin.$widgetFooter.html(opts.interval);
                var currTime = opts.interval;
//            plugin.coutDownTimerInstance =
                plugin.jqTimerInstance =
                        setInterval(function () {
//                        var currTime = parseInt(plugin.$widgetFooter.html()) - 1;
                            currTime = currTime - 1;
                            plugin.logger.debug('widget id: ' + plugin.widgetId + ', countdown time: ' + currTime);
                            if (currTime > 0) {
//                            plugin.$widgetFooter.html(currTime);
                            } else {
                                //reset with start time
//                            plugin.$widgetFooter.html(opts.interval);

                                if (opts.afterPooling && typeof (opts.afterPooling) === 'function') {
                                    plugin.logger.debug('setInterval timer id: ' + plugin.jqTimerInstance);
                                    opts.afterPooling(plugin.$el, plugin.jqTimerInstance, 'start');
                                    //reset
                                     currTime = opts.interval;
                                }
                            }
                        }, 1000);

//                plugin.jqTimerInstance =
//                        setInterval(function () {
//                            plugin.logger.debug('widget setInterval');
//                            if (opts.afterPooling && typeof (opts.afterPooling) === 'function') {
//                                plugin.logger.debug('setInterval timer id: ' + plugin.jqTimerInstance);
//                                opts.afterPooling(plugin.$el, plugin.jqTimerInstance, 'start');
//                                
//                            }
//
//                        }, opts.interval * 1000);

                plugin.logger.debug('create timer id: ' + plugin.jqTimerInstance);

            } else {
                plugin.logger.debug('cannot init pooling process. current interval:' + opts.interval);
                plugin.unblock();
            }

        },
        stopPooling: function () {
            var plugin = this;
            plugin.logger.info('call stopPooling func');

            if (plugin.jqTimerInstance != null) {
                plugin.logger.debug('widget id' + plugin.widgetId + ', delete timer id: ' + plugin.jqTimerInstance);
                clearInterval(plugin.jqTimerInstance);
            }
        }
    }

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

    $.fn[pluginName].getters = [];

    $.fn[pluginName].defaults = {
        //callback
        interval: 1, //for interval pooling, -1: it doesn't trigger pooling'
        afterToggle: null,
        afterRemove: null,
        afterThemeActive: null,
        afterConfigTextActive: null,
        afterConfigDataAnalyticsActive: null,
        beforeRemove: null, //for confirm dialog for end user
        afterPooling: null,
        afterInit: null
    };

})(jQuery);
