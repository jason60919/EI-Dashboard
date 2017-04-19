/* 
 *  Hareware Monitor  plugin
 * @author ken.tsai@advantech.com.tw
 * @date 20141113
 * @requires 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 * js/sa/utils/easydate.js
 */

;
(function($,easydate) {
    
    //define plugin name
    var pluginName =  'hwmonitor';
    
    //create plugin class
    function Plugin (element,options){
        
        this.logger = log4jq.getLogger({
            loggerName: 'hwmonitor.js'
        });
    
        this.el = element;
        this.$el = $(element);
      
        this.options = $.extend({}, $.fn[pluginName].defaults, options);
        //this.options = $.extend($.fn[pluginName].defaults, options);
       
        //jqplot parmeters
        this.jqPlotInstance = null;
        this.jqTimerInstance = null;
        this.jqCountDown = null;
        this.jqElemId = null;
        
        //refresh time (in millisec)
        this.jqRefreshTimeInterval = null;
        
        this.jqData = []; //keep data
        this.jqSampleNum = 20;
        this.jqStartDate =  null;
        //            new Date(year, month, day [, hour, minute, second, millisecond ])
        //            new Date('2014', '11', '21' , '16','00' ,'20');
        
        
        this.jqEndDate = null;
        this.jqOptions = null;

        //constrctor
        this.init();
        
        return this;
        
    };
    
    Plugin.prototype.name = pluginName;
    Plugin.prototype.version =  '0.0.1';

    Plugin.prototype = {
        
        init : function(){
            
            var plugin = this;
            
            plugin.logger.info('init');
            
            plugin.jqElemId = generateElemId();
            plugin.$el.append(generateElemOfPlot(plugin.jqElemId));
            var $chartElem = plugin.$el.find('#' + plugin.jqElemId);
            $chartElem.css('height',plugin.$el.height());
            plugin.reset();
        },

        reset : function(){
            
            var plugin = this;
            var opts = plugin.options;
            
            plugin.logger.info('reset');

            //get opts
            var series = opts.series;
            var autoPlay = opts.autoPlay;
            plugin.logger.debug('auto play: ' + autoPlay);
            var yaxis = opts.yaxis;
            
            var tickColorOfAxis = opts.theme.axis.tickColor;
            var seriesColor = opts.theme.series.color;
           
            var backgroundOfGrid = opts.theme.grid.background;
            var lineColorOfGrid = opts.theme.grid.gridLineColor;
            var borderColorOfGrid = opts.theme.grid.borderColor;
               
           
              
            //update refresh time 
            plugin.jqRefreshTimeInterval = opts.interval * 1000;
            plugin.logger.debug('jqplot refresh interval: ' + plugin.jqRefreshTimeInterval );
            
            //改動態產生來解決memory leak的問題
            //get elem id to craete jqplot
//            var currElemId = plugin.$el.attr('id');
//            plugin.jqElemId  = currElemId;
//            plugin.logger.debug('jqplot elem id: ' + currElemId);
                                 
            //buffer of n samples
            plugin.jqData = [];//reset
            var i=0;
            plugin.jqStartDate =   new Date();//easydate.dateAdd(new Date().getTime(),'second',-60); // current time
            plugin.logger.debug('jqStartDate: ' +plugin.jqStartDate);
            
            var convJqStartDateToTime = plugin.jqStartDate.getTime();
            for(i=0; i<plugin.jqSampleNum; i++){
                var xTime = convJqStartDateToTime - (plugin.jqSampleNum-1-i)* plugin.jqRefreshTimeInterval;
                var smapleData = [ xTime,0];
                plugin.jqData.push(smapleData);
            } 
            
    
            
            var min =  plugin.jqData[0][0];
            var max =  plugin.jqData[ plugin.jqData.length-1][0];
            plugin.logger.debug('x axis date min:  ' + new Date(min));
            plugin.logger.debug('x axis date max:  ' +  new Date(max));
            
            
            //            console.log( plugin.jqPlotInstance);
            if( plugin.jqPlotInstance != null){
                plugin.jqPlotInstance.destroy();
            }
            
            plugin.stop();
          
            plugin.jqOptions = {      
                axes: {   	    
                    xaxis: {   	   
                        numberTicks: plugin.jqSampleNum,
                        renderer: $.jqplot.DateAxisRenderer,
                        tickRenderer: $.jqplot.CanvasAxisTickRenderer ,
                        tickOptions:{
                            formatString:'%H:%M:%S',
                            angle: -30,
                            textColor: tickColorOfAxis
                        },
                        min : min ,
                        max: max
                    }, 	    
                    yaxis: {
                        min: yaxis.min, 
                        max: yaxis.max,
                        numberTicks: 10,
                        tickOptions:{
//                            formatString:'%.1f',
                            textColor: tickColorOfAxis
                        } 
                    }
                },      
                seriesDefaults: {
                    color: seriesColor, // CSS color spec to use for the line.  Determined automatically.
                    rendererOptions: {
                        smooth: true
                    },
                    markerOptions: {
                        style: 'filledCircle',
                        size: 5
                    }
                },      
                highlighter: {
                    show: true,
                    sizeAdjust: 10,
                    tooltipLocation: 'nw',
                    useAxesFormatters: true,
                    formatString:'<table class="jqplot-highlighter"><tr><td>x axis: </td><td>%s</td></tr><tr><td>y axis: </td><td>%s</td></tr></table>'
                },
                grid: {
                    background: backgroundOfGrid,
                    gridLineColor: lineColorOfGrid,
                    borderColor: borderColorOfGrid
                }
            };  
            
            //add series name
            if(series.length > 0){
                plugin.jqOptions.series = series;
            }
                  
            if( plugin.jqOptions){
                
            }
                    
            //create jqplot instance
            plugin.logger.debug('create new jqplat instance');
            //console.log(plugin.jqData);
            
            plugin.logger.debug('==============FINAL jq opts================');
            //console.log(plugin.jqOptions);
            plugin.jqPlotInstance =
            $.jqplot (
                plugin.jqElemId, 
                [plugin.jqData],   
                plugin.jqOptions);   
            
//            plugin.logger.debug('jqPlot instance as below: ');
//            plugin.logger.debug(plugin.jqPlotInstance);    
            
            if(autoPlay && plugin.jqRefreshTimeInterval > 0){
                plugin.logger.debug('call play');
                plugin.play();
            }
        },
        
        refresh: function(){
            var plugin = this;
            var opts = plugin.options;
             
            plugin.logger.info('refresh');
                  
            if (opts.afterRefresh && typeof(opts.afterRefresh) === 'function') {
                
                if(plugin.jqEndDate == null){
                    //first run
                    plugin.jqEndDate = easydate.dateAdd(plugin.jqStartDate, 'second', plugin.jqRefreshTimeInterval/1000);
                   
                }else{
                    plugin.jqStartDate = plugin.jqEndDate;
                    plugin.jqEndDate = easydate.dateAdd(plugin.jqEndDate, 'second', plugin.jqRefreshTimeInterval/1000); 
                }
                
                var start = easydate.date2Str(plugin.jqStartDate);
                var end = easydate.date2Str(plugin.jqEndDate);
                
                plugin.logger.debug('refresh start date: ' + start);
                plugin.logger.debug('refresh end date: ' + end);
                opts.afterRefresh(
                    plugin,
                    start ,
                    end);
            }
           
        },
        
        play: function(){
            
            var plugin = this;
            var opts = plugin.options;
             
            plugin.logger.info('play');
            plugin.stop();
            plugin.jqTimerInstance = setInterval(
                function(){
                    plugin.refresh();
                },
                plugin.jqRefreshTimeInterval);
            plugin.logger.debug('create timer id: ' + plugin.jqTimerInstance );
        },
        
        stop: function(){
            var plugin = this;
            
            plugin.logger.info('stop');
            
            if(plugin.jqTimerInstance != null){
                plugin.logger.debug('delete current timer id: ' + plugin.jqTimerInstance );
                clearInterval(plugin.jqTimerInstance);
            }
        },
        
        update: function(smapleData){
            var plugin = this;
            var opts = plugin.options;
            
            plugin.logger.info('update');
            
            plugin.logger.debug('sample as below');
            plugin.logger.debug('last data from init jqData: ' + new Date(plugin.jqData[ plugin.jqData.length-1][0])  );
            plugin.logger.debug('sample as below: ' +　new Date(smapleData[0]), ', value:' + smapleData[1]);
            plugin.logger.debug(smapleData);
             
            //shift data (拿掉舊的第一筆)
            if( plugin.jqData.length >  plugin.jqSampleNum -1){
                plugin.jqData.shift();
            }
            
            if(new Date(plugin.jqData[ plugin.jqData.length-1][0]).getSeconds() == new Date(smapleData[0]).getSeconds()){
                plugin.logger.debug('update last data');
                plugin.jqData[ plugin.jqData.length-1][01] = smapleData[1];
            }else{
                plugin.jqData.push(smapleData);//新的加到最後一筆
            }

           
               
            plugin.logger.debug('jq data length: ' + plugin.jqData.length);
            var xaxisMin =  plugin.jqData[0][0];//第一條線[x,y] x的日期
            var xaxisMax = plugin.jqData[plugin.jqData.length-1][0];
            
            plugin.logger.debug('xaxis date min: ' + new Date(xaxisMin));
            plugin.logger.debug('xaxis date max: ' + new Date(xaxisMax));
            
            //註解掉就會gg了
            plugin.jqOptions.axes.xaxis.min = xaxisMin;
            plugin.jqOptions.axes.xaxis.max =  xaxisMax;
                 
            if (plugin.jqPlotInstance != null) {
                plugin.logger.debug('destroy jqplot');
                plugin.jqPlotInstance.destroy();
                
                $('#' + plugin.jqElemId).remove();
                plugin.jqElemId = generateElemId();
                plugin.$el.append(generateElemOfPlot(plugin.jqElemId));
                var $chartElem = plugin.$el.find('#' + plugin.jqElemId);
                $chartElem.css('height',plugin.$el.height());
                
            }
            
            //redraw
            plugin.logger.debug('create jqplot');
            plugin.logger.debug('==============FINAL jq opts (2)================');
            var printOps = JSON.stringify(plugin.jqOptions);
            //console.log(printOps);
            plugin.jqPlotInstance 
                = $.jqplot (plugin.jqElemId, [ plugin.jqData],plugin.jqOptions)
                      
            ;
            
            //hide odd x-axis
//            var $findXaxisElems = plugin.$el.find('canvas[class="jqplot-xaxis-tick"]:odd');
//            var countOfXaxisElems = $findXaxisElems.length;
//            
//            plugin.logger.debug('find xaxis elems: ' + countOfXaxisElems);
//            
//            if(countOfXaxisElems > 0){
//                plugin.logger.debug('hide find xaxis elems');
//                $findXaxisElems.remove();
//            }
            
            //聽說會吃記憶體(禁用，不要聽網路傳言)
//            plugin.jqPlotInstance.replot({
//                resetAxes:['xaxis','yaxis']
//                });  
        },
        
        setLineColor: function (colorHex) {
            var plugin = this;

            plugin.logger.info('setLineColor: ' + colorHex);

//            plugin.jqPlotInstance.series[0].color = colorHex;
            plugin.jqPlotInstance.seriesColors[0] = colorHex;
//            plugin.jqPlotInstance.series[0].markerRenderer.color = colorHex;
//            plugin.jsetLineColorqPlotInstance.series[0].markerOptions.color = colorHex;
            plugin.jqPlotInstance.drawSeries({color: colorHex, markerOptions:{color: colorHex}}, 0);
        },
        
        resizePlot: function () {
            var plugin = this;
            plugin.logger.info('resizePlot');
            var w = plugin.$el.width();
            var h = plugin.$el.height();
            plugin.logger.debug('resize w: ' + w + ', h: ' + h);
         
            //get jqplot target elem
            var $elemOfPlot = plugin.$el.find('.jqplot-target');
            $elemOfPlot.css('width', w);
            $elemOfPlot.css('height',h);
    
//            var $canvas = plugin.$el.find('canvas');
//            $canvas.attr('width', w);
//            $canvas.attr('height',h );
//            plugin.jqPlotInstance.replot({resetAxes: true});
            plugin.jqPlotInstance.replot({
                resetAxes: ['xaxis', 'yaxis']
            });
        },
        
        setInterval: function(newInterval){
            var plugin = this;
            
            plugin.logger.debug('set interval:' + newInterval);
            plugin.options.interval = newInterval;
            plugin.logger.debug('current opts interval:' + newInterval);
        },
        
        setYaxisMinMax: function(min,max){
            var plugin = this;
            plugin.logger.debug('set min and max: ' + min +' , ' + max);
            
            plugin.jqOptions.axes.yaxis.min =   min;
            plugin.jqOptions.axes.yaxis.max =   max;
            
            plugin.logger.debug('yaxis min: ' +  plugin.jqOptions.axes.yaxis.min);
            plugin.logger.debug('yaxis max: ' +  plugin.jqOptions.axes.yaxis.max);
        },
        
        getStartDate: function(){
            
            var plugin = this;
            
            plugin.logger.debug('get start date');
            
            var date = new Date(plugin.jqStartDate);

            return date;
        },
        
        getEndDate: function(){
            var plugin = this;
            
            plugin.logger.debug('get start date');
            
            var date = new Date(plugin.jqEndDate);

            return date;
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
        destroy: function() {

            var plugin = this;
            
            plugin.logger.debug('destroy');
            
            plugin.stop();
            
            if ( plugin.jqPlotInstance) {
                plugin.jqPlotInstance.destroy();
                $('#' + plugin.jqElemId).remove();
            }
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
        pubMethod : function(){
            
        }
        
    }
 
    /**
     * This is a real private method. A plugin instance has access to it
     * @return {[type]}
     */
    var privateMethod = function() {
        console.log("privateMethod");
        console.log(this);
    };
    
    var generateElemOfPlot = function(elemId){
      var elem = '<div id="' + elemId + '"></div>';  
      return elem;
    };
    
    var generateElemId = function(){
        var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      
        var uniqid = randLetter + (+new Date);
        return uniqid;
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
    }

    /**
     * Names of the pluguin methods that can act as a getter method.
     * @type {Array}
     */
    $.fn[pluginName].getters = ['getStartDate'];
    
    /**
     * Default options
     */
    $.fn[pluginName].defaults = {
        autoPlay: false,
        series:[],
        interval: 60,
        theme: {
            series:{
                color: '#00ff00'
            },
            axis: {
                tickColor: '#000'
            },
            grid: {
                background: '#000',
                gridLineColor: '#222',
                borderColor: '#222'
            }
            
        },
        yaxis: {
            min: null,
            max: null
        },
        afterRefresh: null //event callback
        
        
        
    };
    
})(jQuery,easydate);