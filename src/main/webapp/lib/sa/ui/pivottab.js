/* 
 *  Pivot tab  plugin
 * @date 20141015
 * @requires 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 * js/jqplugins/jquery.tipsy.js
 */
;
(function ($) {
    //define plugin name
    var pluginName = 'pivottab';

    //create plugin class
    function Plugin(element, options) {

        this.logger = log4jq.getLogger({
            loggerName: 'pivottab.js'
        });

        this.el = element;
        this.$el = $(element);

        this.options = $.extend({}, $.fn[pluginName].defaults, options);

        this.$liOfPivot = null;
        this.$aOfLiOfPivot = null;
        this.$pivotTab = null;
        this.$pivotSubTab = null;
        this.pivotTabType = null;

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

            var $currPivot = plugin.$el;
            var opts = plugin.options;


            plugin.$liOfPivot = $currPivot.find('> li');
            plugin.$aOfLiOfPivot = plugin.$liOfPivot.find("> a");

            //init tipsy
            //need to import jquery.tipsy plugin
//            plugin.$aOfLiOfPivot.tipsy({
//                fade: true, 
//                gravity: 'w'
//            });
            var $allSubMenu = plugin.$el.find('ul.sub-pivot-menu');
            
            $allSubMenu.click(function (event) {
                plugin.logger.debug('stop bubble event');
                event.stopPropagation();
            });

            $(document).click(function (event) {
                plugin.logger.debug('click docuemnt zone');
                var $clickElem = $(event.target);
//                console.log($clickElem);
                if (!$clickElem.closest('ul').length && !$clickElem.closest('.ui-datepicker').length
                         && !$clickElem.closest('span.ui-icon').length) {
                    if(plugin.$pivotTab != null){
                        plugin.logger.debug('hide sub pivot menu');
                        if(plugin.$pivotTab.hasClass(opts.activeCSS)){
                            plugin.$pivotTab.removeClass(opts.activeCSS);
                            plugin.$pivotSubTab.removeClass(opts.activeL2CSS).hide();
                        }
                    }
                }
            });

            plugin.$aOfLiOfPivot.click(function (event) {
                plugin.logger.debug('click pivot menu: ' + opts.activeCSS);

                //reset tab styling
                plugin.$liOfPivot.removeClass(opts.activeCSS);
                if (plugin.$pivotSubTab != null) {
                    plugin.$pivotSubTab.removeClass(opts.activeL2CSS).hide();
                }

                var $currTab = $(this).parent();//get li
                plugin.$pivotTab = $currTab;

                //get pivot data
                var currPivotType = $currTab.attr('data-val');

                plugin.pivotTabType = currPivotType;//keep current status

                //set tab styling
                $currTab.addClass(opts.activeCSS);

                //find sub-pviot
//                $allSubMenu.removeClass(opts.activeL2CSS);
                var $currSubMenu = $currTab.find('ul.sub-pivot-menu');
                //set focus with tabindex
                $currSubMenu.addClass(opts.activeL2CSS).fadeIn();
                plugin.$pivotSubTab = $currSubMenu;

                //callback event
                if (opts.afterClick && typeof (opts.afterClick) === 'function') {
                    opts.afterClick($currTab, currPivotType);
                }
            });

            if (opts.active != null && opts.active != '') {
                plugin.logger.debug('trigger default tab:' + opts.active);
                plugin.setActive(opts.active);
            }
        },
        
        close: function () {
            var plugin = this;
            var opts = plugin.options;
            plugin.logger.info('close');
            if (plugin.$pivotTab != null) {
                if (plugin.$pivotTab.hasClass(opts.activeCSS)) {
                    plugin.$pivotTab.removeClass(opts.activeCSS);
                    plugin.$pivotSubTab.removeClass(opts.activeL2CSS).hide();
                }
            }
        },
        
        setActive: function (pivotActive) {
//            console.log('pivotActive: ' + pivotActive);
            var plugin = this;
            var opts = plugin.options;
            var $activeBtn = plugin.$aOfLiOfPivot.filter('[data-val=' + pivotActive + ']');
            if ($activeBtn.length > 0) {
                $activeBtn.trigger('click');
            }
        },
        
        getActive: function () {
            var plugin = this;
            var currVal = plugin.pivotTabType
            return currVal;
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
        active: '', //default pivot
        activeL2CSS: 'sub-pivot-menu-active',
        activeCSS: 'pivot-menu-active',
        //callback
        afterClick: null
    };

})(jQuery);