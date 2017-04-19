/* 
 * Create tabs  plugin
 * @author ken.tsai@advantech.comt.w
 * @date 20141015
 * @requires 
 *  js/libs/log4javascript/log4javascript.min.js
 *  js/sa/utils/log4jq.js
 */
;
(function ($) {
    //define plugin name
    var pluginName = 'tabs';//conflict with jquery mobile tabs

    //create plugin class
    function Plugin(element, options) {

        this.logger = log4jq.getLogger({
            loggerName: 'tabs.js'
        });

        this.el = element;
        this.$el = $(element);

        this.options = $.extend({}, $.fn[pluginName].defaults, options);

        this.$liOfTabs = null;
        this.$aOfLiOfTabs = null;
        this.$tabConatiner = null;
        this.$activeLI = null;
        this.tabType = null;
        this.disable = false;

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

            var $currTabs = plugin.$el;
            var opts = plugin.options;

            plugin.$tabConatiner = $('.' + opts.tabConatinerCSS);
            plugin.$liOfTabs = $liOfTabs = $currTabs.find('li');
            plugin.$aOfLiOfTabs = $liOfTabs.find('a');
//            plugin.$aOfLiOfTabs.click(function () {
//                var $currTab = $(this);
//                if(plugin.disable == false){
//                    plugin._setActive($currTab);
//                }else{
//                    plugin.logger.warn('tab is disable');
//                }
//                
//            });

            plugin.$aOfLiOfTabs.on('click', function () {
                var $currTab = $(this);
                if (plugin.disable == false) {
                    plugin._setActive($currTab);
                } else {
                    plugin.logger.warn('tab is disable');
                }
            });
            if (opts.active != null && opts.active != '') {
                plugin.logger.debug('trigger default click');
                plugin.setActive(opts.active);
            }

            plugin.setDisable(opts.disable);

        },
        reset: function () {

            var plugin = this;
            var opts = plugin.options;

            //會有bug
            plugin.$tabConatiner.hide();

            if (opts.activeElem == 'li') {
                plugin.logger.debug('active with li elem');
                plugin.$liOfTabs.removeClass(opts.activeCSS);
//                     plugin.$liOfTabs.removeAttr('class');
//                     plugin.$liOfTabs.addClass('ui-link');
            } else {
                //for a tag
                plugin.logger.debug('active with a elem');
                var $aOfTabs = plugin.$liOfTabs.find('a');
                $aOfTabs.attr('isfocus', 'false');
                $aOfTabs.removeClass(opts.activeCSS);
            }

        },
        destroy: function () {
            var plugin = this;
            // Remove any attached data from your plugin
            plugin.$el.removeData();
            plugin.$aOfLiOfTabs.unbind('click');
        },
        setDisable: function (disable) {
            var plugin = this;
            plugin.disable = disable;
        },
        setActive: function (tabActive) {

            var plugin = this;
            var opts = plugin.options;
            var $activeTab = plugin.$aOfLiOfTabs.filter('[data-tab=' + tabActive + ']');

            if ($activeTab.length > 0) {
//                $activeTab.trigger('click');  //it will trigger afterClick callback
                plugin._setActive($activeTab);
            }
        },
        _setActive: function ($currTab) {
            var plugin = this;

            var opts = plugin.options;

            plugin.reset();

            //get pivot data
            var currTabType = $currTab.attr('data-tab');
            plugin.tabType = currTabType;
            var targetContainerID = $currTab.attr('href');

            //set tab styling
            if (opts.activeElem === 'li') {
                $currTab.parent().addClass(opts.activeCSS);
            } else {
                $currTab.attr('isfocus', 'true');
                $currTab.addClass(opts.activeCSS);
            }

            //show tab container
            plugin.logger.debug('target tabs container: ' + targetContainerID);
            var $targetContainer = $(targetContainerID);
//                console.log($targetContainer);
            if ($targetContainer.length >= 1) {
                $targetContainer.show();
            } else {
                plugin.logger.error('cannot find tab continaer:' + targetContainerID);
            }

            //callback event
            if (opts.afterClick && typeof (opts.afterClick) === 'function') {
                opts.afterClick($currTab, currTabType);
            }
        },
        getActive: function () {
            var plugin = this;
            return plugin.tabType;
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

    $.fn[pluginName].getters = ['getActive'];

    $.fn[pluginName].defaults = {
        disable: false,
        activeCSS: 'active',
        tabConatinerCSS: 'tab-container',
        activeElem: 'li',
        active: '',
        //callback
        afterClick: null
    };

})(jQuery);