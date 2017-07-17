(function () {
    /*i18n*/
    if (typeof (i18n) != 'undefined') {
        i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'IAQ_Bar',
        display_name: 'IAQ Bar Chart',
        fill_size: true,
        settings: [
            {
                name: 'Value',
                display_name: 'Value',
                description: 'Value Of Data Source ',
                type: 'calculated'
            },
            {
                name : 'Unit',
                display_name : 'Unit',
                validate: 'required',
                type : 'text',
                default_value: 'NTD'
            },
            {
                name: "height",
                display_name: "height",
               validate: "required,custom[integer],min[3],max[20]",
                type: "number",
                default_value: 5,
                description: "",
                addClass: 'advancedSetting'
            }
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            newInstanceCallback(new IAQ_BarWidget(settings));
        }
    });

    var IAQ_BarWidget = function (settings)
    {
        var self = this;
        var currentSettings = settings;
        var titleElement = $('<h2 class="section-title"></h2>');
        var currentID = _.uniqueId('wgd_');
        var widgetElement = $('<div id="' + currentID + '" style="text-align: center;"></div>');
        var oChart;

        self.getHeight = function ()
        {
            return currentSettings.height;
        };

        self.render = function (containerElement)
        {
            $(containerElement).append(titleElement).append(widgetElement);
        };

        self.onSettingsChanged = function (newSettings)
        {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(currentSettings.title) ? '' : currentSettings.title));
        };

        self.onCalculatedValueChanged = function (settingName, newValue)
        {
            var data = newValue;
            var aX = [];
            var aData = ["Data"];
            aData[0] = "ECR Total";
            for (var i = 0; i < data.itemList.length; i++)
            {
                aX.push(data.itemList[i].ts);
                aData.push(data.itemList[i].v);
            }
            oChart = c3.generate({
                bindto: '#' + currentID,
                data: {
                    columns: [
                        aData
                    ],
                    type: 'bar'
                },
                bar: {
                    width: {
                        ratio: 0.5 // this makes bar width 50% of length between ticks
                    }
                },
                axis: {
                    x: {
                        label: {
                            text: 'States',
                            position: 'outer-center',
                        },
                        type: 'category',
                        categories: aX,
                        tick: {
                            centered: true
                        }
                    },
                    y: {
                        label: {
                            text: currentSettings.Unit,
                            position: 'outer-middle'
                        }
                    },
                }
            });
        };

        self.onDispose = function ()
        {
            if (typeof oChart!= "undefined"){
                if (!_.isNull(oChart)) {
                    oChart.destroy();
                    oChart = null;
                }
            }
        };
    };
}());