/* 
 *  progessbar plugin
 * @author ken.tsai@advantech.comt.w
 * @date 20141022
 * @requires 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 */

;(function($) {
    //define plugin name
    var pluginName =  'progressbar';
    
    //create plugin class
    function Plugin (element,options){
        
        this.logger = log4jq.getLogger({
            loggerName: 'progressbar.js'
        });
        
        this.el = element;
        this.$el = $(element);
        
        this.options = $.extend({}, $.fn[pluginName].defaults, options);
       
        //constrctor
        this.init();
        
        return this;
    };
    
    Plugin.prototype.name = pluginName;
    Plugin.prototype.version =  '0.0.1';
    
    Plugin.prototype = {
        
        init : function(){
     
            var plugin = this;
            var opts = plugin.options;
            
            plugin.logger.debug('init progressbar: ' + opts.percent);
            
            plugin.update(opts.percent);
            
        },
        
        update: function(percent){
    
             var plugin = this;
             
             plugin.logger.debug('update progressbar: ' + percent);
             
             var $progressbar = plugin.$el;
             
             var barstyle = '';
             percent = percent.toFixed(2);
             if(percent <= 50){
                 barstyle = 'progress-bar-info';
             }else if(percent > 50 && percent <=70){
                 barstyle = 'progress-bar-warning';
             }else if (percent > 70 && percent <= 100){
                barstyle = 'progress-bar-danger';
             }
             
             $progressbar.removeClass('progress-bar-info progress-bar-warning progress-bar-danger')
             .addClass(barstyle)
             .css({
                   width: percent + '%'
             }).text( percent + '%').attr('title',percent);
          
        }
        
    };
 
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
    };

    
    $.fn[pluginName].defaults = {
        percent: 0
    };
    
})(jQuery);