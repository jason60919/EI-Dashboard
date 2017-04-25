/*
 * Template widget 
 * Integration with SA Fans
 * @author: ken.tsai@advantech.com.tw
 * @date 2015/09/22
 * @requried 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 */
(function () {

    var logger = log4jq.getLogger({
        loggerName: 'plugin.wg.IAQ_Pie.js'
    });
    logger.info('plugin.wg.IAQ_Pie.js loaded');

    /*
     * i18n 
     */
    if (typeof (i18n) != 'undefined') {
        i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'IAQ_Pie',
        display_name: 'IAQ 圓餅圖',
        description:'IAQ 圓餅圖 : (1) 取得資料來源的getCountSensorVal (例如: datasources["Co2"] ) (2)並設定門檻值畫出圓餅圖',
        fill_size: true,
		external_scripts: [
            'js/FreeBoard/plugins/thirdparty/c3.min.js',
			//'js/FreeBoard/plugins/thirdparty/c3.min.411.js',
			// 'js/FreeBoard/plugins/freeboard/wg/Customization/c3.min.411.js',
        ],
        settings: [
            {
                name: 'value',
                display_name: $.i18n.t('global.data'),
                type: 'calculated'
            },
			{
				name : 'myWgHeight',
				display_name : 'Widget高度',
				type : 'number',
				validate: 'required',
				default_value: 6
			},
			{
				name : 'myDataName',
				display_name : '資料名稱',
				//validate: 'required',
				type : 'text',
				default_value: 'C02'
			},
			{
				name : 'myDataUnit',
				display_name : '資料單位',
				validate: 'required',
				type : 'text',
				default_value: 'PPM'
			},
			{
				name : 'myth0',
				display_name : '門檻值 0 ',
				validate: 'required',
				type : 'number',
				default_value: 420
			},

			{
				name : 'myth1',
				display_name : '門檻值 1 ',
				type : 'number',
				default_value: 430
			},
			{ 	name: 'myth0_color',
                display_name: '顏色0',
                validate: 'required,custom[hexcolor]',
                type: 'color',
                default_value: '#228adf',
			},
			{ 
				name: 'myth1_color',
                display_name: '顏色1',
                validate: 'required,custom[hexcolor]',
                type: 'color',
                default_value: '#ec9720',
			},
			{ 
				name: 'myth2_color',
                display_name: '顏色2',
                validate: 'required,custom[hexcolor]',
                type: 'color',
                default_value: '#ee534f',
			},
			
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            logger.info('freeboard.loadWidgetPlugin: IAQ_PieWidget newInstance');
            newInstanceCallback(new IAQ_PieWidget(settings));
        }
    });


    var IAQ_PieWidget = function (settings)
    {
        logger.info('IAQ_PieWidget init');
        var self = this;
        var currentSettings = settings;
        var mainContainer;
        var bChangeValue = false;
        var timChange;
        var nChangeInterval = 30;
        self.widgetType = 'IAQ_Pie';
		var chart;
		var currentID = _.uniqueId('c3js_');
        self.render = function (containerElement)
        {
            mainContainer = $(containerElement);
            mainContainer.append('<h2 class="section-title"></h2>');
            mainContainer.append('<div id="'+currentID+'" >TEST1</div>');
			
        };// end render

		 self.getHeight = function ()
        {
            return currentSettings.myWgHeight;
        };
        self.onSettingsChanged = function (newSettings)
        {
            logger.info('IAQ_PieWidget : onSettingsChanged');
            currentSettings = newSettings;
        };

        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection)
        {
			if (newValue!= "undefined"){
				var oItem = newValue.itemList;
				var r0 =[];var r1 =[];var r2 =[];
				var th0 = currentSettings.myth0; var cnt0=0;
				var th1 = currentSettings.myth1; var cnt1=0;
				                                 var cnt2=0;
				var sum_val = 0; var sum_cnt=0; 
				for ( var i = 0 ; i < oItem.length ; ++i){
					if (oItem[i].v < th0){
						cnt0 = cnt0 + 1;
					}
					else if (oItem[i].v>=th0 && oItem[i].v<th1){
						cnt1 = cnt1 + 1;
					}	
					else {
						cnt2 = cnt2 + 1;
					}
					sum_cnt = sum_cnt + 1;
					sum_val = sum_val + oItem[i].v * 1;
				}// end i for
				
				// 塞資料處理
				r0.push("<" + th0 + " " + currentSettings.myDataUnit);r0.push(cnt0);
				r1.push(th0 + "~" + th1 + " " + currentSettings.myDataUnit);r1.push(cnt1);
				r2.push(">" + th1 +" " + currentSettings.myDataUnit);r2.push(cnt2);
				var cols=[];
				cols.push(r0);
				cols.push(r1);
				cols.push(r2);
				// 算平均值
				var avg=0;
				if (sum_cnt>0) avg = sum_val/sum_cnt;
				if (avg>1) avg = parseInt(avg);
				else avg = avg.toFixed(2);
				// 標題
				var myTitle = avg ;
				// 顏色
				var color_pattern=[];
				color_pattern.push(currentSettings.myth0_color);
				color_pattern.push(currentSettings.myth1_color);
				color_pattern.push(currentSettings.myth2_color);
				// 開始畫圖
				chart = c3.generate({
						bindto: '#'+currentID,
						data: {
						  columns: cols,
						  type : 'donut',
						},
						color:{
							pattern : color_pattern,
						},
						donut: {
							title: myTitle,
						}
					});
				/*
				chart.load({
					columns: cols,
				});
				*/
			}
			
        };
    };
}());