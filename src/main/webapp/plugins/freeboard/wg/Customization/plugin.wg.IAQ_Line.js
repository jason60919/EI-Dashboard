/*
 * Template widget 
 * Integration with SA Fans
 * @date 2015/09/22
 * @requried 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 */
(function () {
    var logger = log4jq.getLogger({
        loggerName: 'plugin.wg.IAQ_Line.js'
    });
    logger.info('plugin.wg.IAQ_Line.js loaded');

    /*
     * i18n 
     */
    if (typeof (i18n) != 'undefined') {
        i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'IAQ_Line',
        display_name: 'IAQ Line Chart',
        fill_size: true,
        settings: [
            {
                name: 'value',
                display_name: $.i18n.t('global.data'),
                type: 'calculated'
            },
			{
				name : 'myWgHeight',
				display_name : 'Height',
				type : 'number',
				validate: 'required',
				default_value: 6
			},
			{
				name : 'myXHeight',
				display_name : 'Height of Axis X',
				type : 'number',
				validate: 'required',
				default_value: 40
			},
			{
				name : 'myDataName',
				display_name : ' Name',
				//validate: 'required',
				type : 'text',
				default_value: 'C02'
			},
			{
				name : 'myDataUnit',
				display_name : 'Unit',
				validate: 'required',
				type : 'text',
				default_value: 'ppm'
			},
			{ 
				name: 'line_color',
                display_name: 'Color',
                validate: 'required,custom[hexcolor]',
                type: 'color',
                default_value: '#228adf',
			},
			{
				name : 'YHeight',
				display_name : 'Max Value',
				validate: 'required',
				type : 'number',
				default_value: 1000
			},
			{
				name : 'YLow',
				display_name : 'Min Value',
				validate: 'required',
				type : 'number',
				default_value: 0
			},
			
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            logger.info('freeboard.loadWidgetPlugin: IAQ_LineWidget newInstance');
            newInstanceCallback(new IAQ_LineWidget(settings));
        }
    });


    var IAQ_LineWidget = function (settings)
    {
        logger.info('IAQ_LineWidget init');
        var self = this;
        var currentSettings = settings;
        var mainContainer;
        var bChangeValue = false;
        var timChange;
        var nChangeInterval = 30;
        self.widgetType = 'IAQ_Line';
		var chart;
		var currentID = _.uniqueId('c3js_');
        self.render = function (containerElement)
        {
            mainContainer = $(containerElement);
            mainContainer.append('<h2 class="section-title"></h2>');
            mainContainer.append('<div id="'+currentID+'" >TEST2</div>');
			
        };// end render

		 self.getHeight = function ()
        {
            return currentSettings.myWgHeight;
        };
        self.onSettingsChanged = function (newSettings)
        {
            logger.info('IAQ_LineWidget : onSettingsChanged');
            currentSettings = newSettings;
        };

        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection)
        {
			if (newValue!= "undefined"){
				var oItem = newValue.itemList;
				var mydata=[]; var myXLable=[];
				mydata.push(currentSettings.myDataName);
				for ( var i = oItem.length-1 ; i>-1 ; i--){
					mydata.push(oItem[i].v);
					var t1 = oItem[i].ts;
					var d1 = new Date(t1);
					//d1.setHours(d1.getHours()+8);
					var outTime="--";
					outTime = d1.getHours() + ":"+d1.getMinutes();
					myXLable.push(outTime);
				}// end i for
				// 顏色
				var color_pattern=[];
				color_pattern.push(currentSettings.line_color);
				// 開始畫圖
				chart = c3.generate({
						bindto: '#'+currentID,
						data: {
							columns: [
								mydata
							]
						},
						axis: {
							x: {
								type: 'category',
								categories: myXLable,
								padding: {left:0, right:0},
								height: currentSettings.myXHeight,
								tick: {
                                    fit: false,
									rotate: 45,
									multiline: false
								},
							},
							y: {
								max: currentSettings.YHeight,
								min: currentSettings.YLow,
								padding: {top:20, bottom:0},
								label: {
									text: currentSettings.myDataUnit,
									position: 'outer-middle'
								}
							},
						},
						color:{
							pattern : color_pattern,
						},
						legend: {
							//position: 'inset'
							position: 'right'
						}
					});
			}// end newValue!= "undefined"
			
        };
    };
}());