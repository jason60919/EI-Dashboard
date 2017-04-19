/*
 * Fans widget 
 * Integration with SA Fans
 * @author: ken.tsai@advantech.com.tw
 * @date 2015/08/18
 * @requried 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 * js/sa/ui/fan.js
 */
(function () {

    var logger = log4jq.getLogger({
        loggerName: 'SA.wg.fans.js'
    });
    logger.info('SA.wg.fans.js loaded');
    
    /*
     * i18n 
     */
    if (typeof (i18n) != 'undefined') {
//       i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'fans',
        display_name: $.i18n.t('plugins_wd.fans.display_name'),
        description: $.i18n.t('plugins_wd.fans.description'),
        fill_size: true,
        settings: [
            {
                name: 'title',
                validate: 'optional,maxSize[100]',
                display_name: $.i18n.t('global.title'),
//                        $.i18n.t('plugins_wd.progressbar.title'),
                type: 'text'
            }, 
            {
                name: 'on_off',
                display_name: $.i18n.t('plugins_wd.fans.on_off'),
                description: $.i18n.t('plugins_wd.fans.on_off_desc'),
                type: 'calculated'
            }
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            logger.info('freeboard.loadWidgetPlugin: fansWidget newInstance');
            newInstanceCallback(new fansWidget(settings));
        }
    });

    var fansWidgetId = 0;
    var fansWidget = function (settings)
    {
        logger.info('fansWidget init');

        var self = this;
  
        var currentSettings = settings;

        fansWidgetId++;//plugins id


        var $fansElem = $('<div class="widget-fans" id="' + fansWidgetId + '"></div>');
        self.widgetType = 'fans';

        self.render = function (containerElement)
        {
            logger.info('render');
            // Here we append our text element to the widget container element.
            $(containerElement).append('<h2 class="section-title">' + currentSettings.title + '</h2>');
            $(containerElement).append($fansElem);
            //init fans plguin
            $fansElem.fans({
                icon: '../images/fans.png'
            });
        };

        // **getHeight()** (required) : A public function we must implement that will be called when freeboard wants to know how big we expect to be when we render, and returns a height. This function will be called any time a user updates their settings (including the first time they create the widget).
        //
        // Note here that the height is not in pixels, but in blocks. A block in freeboard is currently defined as a rectangle that is fixed at 300 pixels wide and around 45 pixels multiplied by the value you return here.
        //
        // Blocks of different sizes may be supported in the future.
        self.getHeight = function ()
        {
            logger.info('getHeight');
            return 4;
        };

        // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
        self.onSettingsChanged = function (newSettings)
        {
            logger.info('onSettingsChanged');
            // Normally we'd update our text element with the value we defined in the user settings above (the_text), but there is a special case for settings that are of type **"calculated"** -- see below.
            currentSettings = newSettings;
            $fansElem.parent().find(".section-title").html(currentSettings.title);
        };

        // **onCalculatedValueChanged(settingName, newValue)** (required) : A public function we must implement that will be called when a calculated value changes. Since calculated values can change at any time (like when a datasource is updated) we handle them in a special callback function here.
        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection)
        {
            logger.info('onCalculatedValueChanged: ' + newValue);
            
            //Add icon to specify agent connect or not
            if ((agentConnection === false && !$fansElem.parent().find(".section-title").hasClass('agentDisconnect')) || (agentConnection === true && $fansElem.parent().find(".section-title").hasClass('agentDisconnect'))) {
                $fansElem.parent().find(".section-title").toggleClass('agentDisconnect');
                $fansElem.parent().find(".section-title").removeAttr('title');
            }
            
            if (newValue == true || newValue == 1) {
                $fansElem.fans('on');
            } else if (!newValue == false || newValue == 0) {
                $fansElem.fans('off');
            } else {
                $fansElem.fans('off');
                logger.error('invalid value');
            }
        };

        // **onDispose()** (required) : Same as with datasource plugins.
        self.onDispose = function ()
        {
            logger.info('onDispose');
        };

        self.onSettingsChanged(currentSettings);
    };


}());