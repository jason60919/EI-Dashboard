/*
 * Template widget 
 * Integration with SA Fans
 * @date 2015/09/22
 * @requried 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 */
(function () {

    var tempWidgetLog = log4jq.getLogger({
        loggerName: 'SA.wg.template.js'
    });
    tempWidgetLog.info('SA.wg.template.js loaded');
    
    /*
     * i18n 
     */
    if (typeof (i18n) != 'undefined') {
        i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'templateWidget',
        display_name: 'Template Widget',
        fill_size: true,
        settings: [
            {
                name: 'Value',
                display_name: 'Value',
                description: 'Value Of Data Source ',
                type: 'calculated'
            }
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            tempWidgetLog.info('freeboard.loadWidgetPlugin: templateWidget newInstance');
            newInstanceCallback(new templateWidget(settings));
        }
    });

 
    var templateWidget = function (settings)
    {
        tempWidgetLog.info('templateWidget init');

        var self = this;
        var currentSettings = settings;

        self.render = function (containerElement)
        {
            //parent elem of widget
            //<div class="widget fillsize" data-bind="widget: true, css:{fillsize:fillSize}">
            //</div>
            var $containerElement = $(containerElement);
        };

        self.getHeight = function ()
        {
            tempWidgetLog.info('getHeight');
            return 4;
        };

        self.onSettingsChanged = function (newSettings)
        {
            tempWidgetLog.info('onSettingsChanged');

            currentSettings = newSettings;
        };
        
        self.onCalculatedValueChanged = function (settingName, newValue)
        {
            tempWidgetLog.info('onCalculatedValueChanged: ' + newValue);
           
        };

        self.onDispose = function ()
        {
            tempWidgetLog.info('onDispose');
        };

        self.onSettingsChanged(currentSettings);
    };


}());