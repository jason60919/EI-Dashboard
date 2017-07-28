(function ()
{
    var logger = log4jq.getLogger({
        loggerName: 'plugin.wg.ragIndicator.js'
    });
    logger.info('plugin.wg.ragIndicator.js loaded');

    //Our RAG indicator styles
    freeboard.addStyle('.rag-light', "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;");
    freeboard.addStyle('.rag-light.red', "background-color: rgba(217, 0, 0, 1);box-shadow: 0px 0px 15px #D90000;border-color:#FDF1DF;");
    freeboard.addStyle('.rag-light.redUnSelect', "background-color: rgba(255, 0, 0, 0.1);box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.3);border-color:#FDF1DF;");
    freeboard.addStyle('.rag-light.amber', "background-color:rgba(228, 155, 0, 1);box-shadow: 0px 0px 15px #E49B00;border-color:#FDF1DF;");
    freeboard.addStyle('.rag-light.amberUnSelect', "background-color: rgba(228, 155, 0, 0.1);box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.3);border-color:#FDF1DF;");
    freeboard.addStyle('.rag-light.green', "background-color:rgba(0, 182, 14, 1);box-shadow: 0px 0px 15px #00B60E;border-color:#FDF1DF;");
    freeboard.addStyle('.rag-light.greenUnSelect', "background-color:rgba(0, 182, 14, 0.1);box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.3);border-color:#FDF1DF;");
    freeboard.addStyle('.rag-text', "margin-top:10px;");

    //Flashing status for the light
    freeboard.addStyle('.red-flash', "animation: red-flash 500ms infinite alternate;");
    freeboard.addStyle('.amber-flash', "animation: amber-flash 500ms infinite alternate;");
    freeboard.addStyle('.green-flash', "animation: green-flash 500ms infinite alternate;");

    //Dim status for the light
    freeboard.addStyle('.dim', "opacity: 0.6;");

    if (typeof (i18n) != 'undefined') {
//       i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    var ragWidget = function (settings) {
        var self = this;
        var titleElement = $('<h2 class="section-title"></h2>');
        var stateElement = $('<div class="rag-text"></div>');
        var indicatorElement = $('<div class="rag-light single"></div><div class="rag-light greenLed all"></div><div class="rag-light amberLed all"></div><div class="rag-light redLed all"></div>');
        var currentSettings = settings;
        var mainContainer;
        
        self.widgetType = 'rag';

        //define our keyframes for our flashing lights
        $.keyframe.define([{
                name: 'green-flash',
                '0%': {'background-color': '#2A2A2A', 'box-shadow': '0px 0px 0px #2A2A2A'},
                '100%': {'background-color': '#00B60E', 'box-shadow': '0px 0px 15px #00B60E'}

            }]);
        $.keyframe.define([{
                name: 'amber-flash',
                '0%': {'background-color': '#2A2A2A', 'box-shadow': '0px 0px 0px #2A2A2A'},
                '100%': {'background-color': '#E49B00', 'box-shadow': '0px 0px 15px #E49B00'}

            }]);
        $.keyframe.define([{
                name: 'red-flash',
                '0%': {'background-color': '#2A2A2A', 'box-shadow': '0px 0px 0px #2A2A2A'},
                '100%': {'background-color': '#D90000', 'box-shadow': '0px 0px 15px #D90000'}

            }]);

        //store our calculated values in an object
        var stateObject = {};

        //array of our values: 0=Green, 2=Amber, 3=Red
        var stateArray = ["green", "amber", "red"];

        function updateState() {
            var ragValue = _.isUndefined(stateObject.value) ? -1 : stateObject.value;
            //If we have a valid value set, continue
            indicatorElement
                .removeClass('red')
                .removeClass('amber')
                .removeClass('green')
                .removeClass('green-flash')
                .removeClass('amber-flash')
                .removeClass('red-flash')
                .removeClass('dim')
                .removeClass('greenUnSelect')
                .removeClass('amberUnSelect')
                .removeClass('redUnSelect');
            var oIndicatorElement;
            if (stateArray[stateObject.value]) {
                if (currentSettings.displayAll)
                {
                    switch (stateObject.value) {
                        case 0 :
                            oIndicatorElement = $(mainContainer).find(".greenLed");
                            $(mainContainer).find(".amberLed").addClass('amberUnSelect');
                            $(mainContainer).find(".redLed").addClass('redUnSelect');
                            break;
                        case 1 :
                            oIndicatorElement = $(mainContainer).find(".amberLed");
                            $(mainContainer).find(".greenLed").addClass('greenUnSelect');
                            $(mainContainer).find(".redLed").addClass('redUnSelect');
                            break;
                        case 2 :
                            oIndicatorElement = $(mainContainer).find(".redLed");
                            $(mainContainer).find(".greenLed").addClass('greenUnSelect');
                            $(mainContainer).find(".amberLed").addClass('amberUnSelect');
                            break;
                    }
                }
                else
                {
                    oIndicatorElement = $(mainContainer).find(".single");
                }
                
                oIndicatorElement.addClass(stateArray[stateObject.value]);
                var indicatorText = stateArray[stateObject.value] + '_text';
                stateElement.html((_.isUndefined(stateObject[indicatorText]) ? "" : stateObject[indicatorText]));
                var indicatorType = (_.isUndefined(stateObject.indicator_type) ? "" : stateObject.indicator_type.toLowerCase());
                switch (indicatorType) {
                    case 'dim' :
                        oIndicatorElement.addClass('dim');
                        break;
                    case 'flash' :
                        var indicatorTypeClass = stateArray[stateObject.value] + '-flash';
                        oIndicatorElement.addClass(indicatorTypeClass);
                        break;
                }
            }
            else
            {
                $(mainContainer).find(".greenLed").addClass('greenUnSelect');
                $(mainContainer).find(".amberLed").addClass('amberUnSelect');
                $(mainContainer).find(".redLed").addClass('redUnSelect');
            }
        }

        this.render = function (element) {
            mainContainer = $(element);
            $(element).append(titleElement).append(indicatorElement).append(stateElement);
            this.onSettingsChanged(settings);
        };

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            titleElement.prop('title', titleElement.html());
            if (currentSettings.displayAll)
            {
                $(mainContainer).find(".single").hide();
                $(mainContainer).find(".all").show();
            }
            else
            {
                $(mainContainer).find(".single").show();
                $(mainContainer).find(".all").hide();
            }
            stateObject.indicator_type = newSettings.indicator_type;
            updateState();
        };

        this.onCalculatedValueChanged = function (settingName, newValue, agentConnection) {
            //whenever a calculated value changes, store them in the variable 'stateObject'
            var strValue = newValue;
            
            //Add icon to specify agent connect or not
            if ((agentConnection === false && !titleElement.hasClass('agentDisconnect')) || (agentConnection === true && titleElement.hasClass('agentDisconnect'))) {
                titleElement.toggleClass('agentDisconnect');
                titleElement.removeAttr('title');
            }

            if (typeof newValue == "function")
            {
                strValue = newValue.toString().split(" ")[1];
                strValue = strValue.replace("(","").replace(")","");
            }
            if ((typeof newValue != "undefined") && (newValue != "undefined"))
                stateObject[settingName] = strValue;
            updateState();
        };

        this.onDispose = function () {
        };

        this.getHeight = function () {
            return 1;
        };

        //this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "ragIndicator",
        display_name: $.i18n.t('plugins_wd.RAG.display_name'),
        description: $.i18n.t('plugins_wd.RAG.description'),
        external_scripts: [
            "plugins/thirdparty/jquery.keyframes.min.js"
        ],
        settings: [
           
            {
                name: "title",
                display_name:$.i18n.t('global.title'),
                validate: 'optional,maxSize[100]',
//                        $.i18n.t('plugins_wd.RAG.title'),
                type: "text"
            },
            {
                name: "value",
                display_name: $.i18n.t('global.data'),
//                        $.i18n.t('plugins_wd.RAG.value'),
                type: "calculated"
            },
            {
                name: "green_text",
                display_name: $.i18n.t('plugins_wd.RAG.green_text'),
                type: "calculated"
            },
            {
                name: "amber_text",
                display_name: $.i18n.t('plugins_wd.RAG.amber_text'),
                type: "calculated"
            },
            {
                name: "red_text",
                display_name: $.i18n.t('plugins_wd.RAG.red_text'),
                type: "calculated"
            },
            {
                name: 'displayAll',
                display_name: $.i18n.t('plugins_wd.RAG.displayAll'),
                type: 'boolean',
                default_value: false,
                addClass: 'advancedSetting'
            },
            {
                name: "indicator_type",
                display_name: $.i18n.t('plugins_wd.RAG.type'),
                type: "calculated",
                addClass: 'advancedSetting'
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new ragWidget(settings));
        }
    });
}());
