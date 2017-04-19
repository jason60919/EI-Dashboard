/* progressbar widget
 * @author: ken.tsai@advantech.com.tw
 * @date 2015/08/26
 * @requried
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 * js/sa/ui/progressbar.js
 */
(function () {

    if (typeof (i18n) != 'undefined') {
//        plugins_wd.<WIDGET_NAME>.<WIDGET_FIELD>
    }
    var logger = log4jq.getLogger({
        loggerName: 'SA.wg.progressbar.js'
    });
    logger.info('loaded');

    var progressBarWidget = function (settings) {

        var progressBarWidgetLog = log4jq.getLogger({
            loggerName: 'progressBarWidget'
        });
        var self = this;
        var currentSettings = settings;

        var $progressbarDiv = null;
        var $widgetTitle = null;
        self.widgetType = 'progressBar';

        var createProgressbar = function (currentSettings) {
            $progressbarDiv.progressbar({
                percent: 0
            });
        };

        var updateData = function (newValue) {
            progressBarWidgetLog.info('updateData as below: ' + newValue);

            $progressbarDiv.progressbar('update', newValue);
        };

        var updateTitle = function (newTitle) {
            progressBarWidgetLog.info('updateTitle as below: ' + newTitle);
            if (newTitle.length > 0) {
                $widgetTitle.html(newTitle);

            }

        };

        self.render = function (containerElement) {

            progressBarWidgetLog.info('render');

            //add external css
            //            $(element).append('<link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.8/jquery.jqplot.min.css" />');

            //add the chart div to the dom
            var $progressBarStriped = $('<div class="progress progress-striped" style="margin: 10px;"></div>');
            var progressbarElem = '<div class="progress-bar" style="width: 0%;"></div>';
            var titleElem = '<h2 class="section-title"></h2>';

            $progressbarDiv = $(progressbarElem);
            $progressBarStriped.append($progressbarDiv);
            $widgetTitle = $(titleElem);

            var $containerElement = $(containerElement);
            $containerElement.append($widgetTitle);
            $containerElement.append($progressBarStriped);

            self.onSettingsChanged(currentSettings);
        };

        self.onSettingsChanged = function (newSettings) {
            progressBarWidgetLog.info('onSettingsChanged as below: ');
            progressBarWidgetLog.debug(newSettings);
            currentSettings = newSettings;

            if (currentSettings.hasOwnProperty('title')) {
                updateTitle(currentSettings.title);
            }
            createProgressbar(currentSettings);
        };

        //seems to be called after render whenever a calculated value changes
        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection) {

            progressBarWidgetLog.debug('onCalculatedValueChanged settingName: ' + settingName);
            
            //Add icon to specify agent connect or not
            if ((agentConnection === false && !$widgetTitle.hasClass('agentDisconnect')) || (agentConnection === true && $widgetTitle.hasClass('agentDisconnect'))) {
                $widgetTitle.toggleClass('agentDisconnect');
                $widgetTitle.removeAttr('title');
            }

            if (settingName == 'value') {
                updateData(newValue);
            }
        };


    };

    freeboard.loadWidgetPlugin({
        // Same stuff here as with datasource plugin.
        type_name: 'progressbar',
        display_name: $.i18n.t('plugins_wd.progressbar.display_name'),
        description: $.i18n.t('plugins_wd.progressbar.description'),
        fill_size: true,
        settings: [
            {
                name: 'title',
                validate: 'optional,maxSize[100]',
                display_name: $.i18n.t('global.title'),
//                        $.i18n.t('plugins_wd.progressbar.title'),
                type: 'text'
            }, {
                name: 'value',
                display_name: $.i18n.t('global.data'),
//                        $.i18n.t('plugins_wd.progressbar.value'),
                type: 'calculated'
            }
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            logger.info('freeboard.loadWidgetPlugin: progressBar Widget newInstance');
            newInstanceCallback(new progressBarWidget(settings));
        }
    });
}());