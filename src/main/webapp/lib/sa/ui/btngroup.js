/* 
 *   Button group  plugin
 * @author ken.tsai@advantech.comt.w
 * @date 20141015
 * @requires
 *  js/libs/log4javascript/log4javascript.min.js
 *  js/sa/utils/log4jq.js
 */
;
(function($) {
    //define plugin name
    var pluginName =  'btngroup';
    
    //create plugin class
    function Plugin (element,options){
        
         this.logger = log4jq.getLogger({
            loggerName: 'btngroup.js'
        });
        
        this.el = element;
        this.$el = $(element);
        
        this.options = $.extend({}, $.fn[pluginName].defaults, options);
       
        this.$buttons = null;
        this.btnGroupType = null;
        
        //constrctor
        this.init();
        
        return this;
    };
    
    Plugin.prototype.name = pluginName;
    Plugin.prototype.version =  '0.0.1';
    
    Plugin.prototype = {
        
        init : function(){
            
            var plugin = this;
            
            var $currBtnGroup = plugin.$el;
            var opts = plugin.options;
            var enable = opts.enable;
            
            var $buttons =  $currBtnGroup.find('.mode-button');
            plugin.$buttons = $buttons;//save
            
            if(!enable){
                plugin.disable();
            }
            $buttons.click(function(){
                 
                 if(opts.enable){//need eanble plugin will do this event
                     
                     //reset btn styling
                    plugin.reset();

                    var $currBtn = $(this);
                    
                    //get group data
                    var currBtnGroupType = $currBtn.attr('data-group-val');
                    plugin.btnGroupType = currBtnGroupType;
                    
                    //set btn styling
                    $currBtn.addClass(opts.activeCSS);
                    
                    //callback event
                    if (opts.afterClick && typeof(opts.afterClick) === 'function') {
                        opts.afterClick($currBtn,currBtnGroupType);
                    }
                 }
                
            });
            
            if(opts.active != null && opts.active != ''){
                plugin.setActive(opts.active);
            }
        },
        
        reset: function(){
            var plugin = this;
            var opts = plugin.options;
            plugin.$buttons.removeClass(opts.activeCSS);
            plugin.$buttons.removeClass(opts.disableCSS);
        },
        
        setActive: function(btnType){
            var plugin = this;
            var opts = plugin.options;
            var $activeBtn = plugin.$buttons.filter('[data-group-val=' + btnType +']' );
            if($activeBtn.length > 0){
                $activeBtn.trigger('click');  
            }     
        },
        
        getActive: function(){
             var plugin = this;
             return plugin.btnGroupType;
        },
        
        enable: function(){
            var plugin = this;
            var opts = plugin.options;
            plugin.reset();
            opts.enable = true;
        },
        
        disable : function(){
            var plugin = this;
            var opts = plugin.options;
            plugin.reset();
            plugin.$buttons.addClass(opts.disableCSS);
            opts.enable = false;
        }
    }
 
    // Plugin wrapper around the constructor,
    $.fn[pluginName] = function(options) {
        
        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            // Create a plugin instance for each selected element.
            return this.each(function() {
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
                return this.each(function() {
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
        enable: true,
        disableCSS: 'mode-button-disable',
        activeCSS: 'mode-button-active',
        active: '',
        //callback
        afterClick: null
    };
    
})(jQuery);