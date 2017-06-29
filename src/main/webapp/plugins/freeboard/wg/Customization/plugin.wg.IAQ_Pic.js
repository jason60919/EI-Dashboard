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
        loggerName: 'plugin.wg.IAQ_Pic.js'
    });
    logger.info('plugin.wg.IAQ_Pic.js loaded');

    /*
     * i18n 
     */
    if (typeof (i18n) != 'undefined') {
        i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'IAQ_Pic',
        display_name: 'IAQ 圖片',
        description:'IAQ PIC...',
        fill_size: true,
        settings: [
			{
				name : 'myWgHeight',
				display_name : 'Widget高度',
				type : 'number',
				validate: 'required',
				default_value: 8
			},
			{
				name : 'myTextSize',
				display_name : '數值文字大小',
				type : 'number',
				validate: 'required',
				default_value: 5
			},

			{ 	name: 'myTextColor',
                display_name: '數值顏色',
                validate: 'required,custom[hexcolor]',
                type: 'color',
                default_value: '#ffffff',
			},
			{
				name : 'myBgImg',
				display_name : '背景圖片',
				validate: 'required',
				type : 'text',
				default_value: 'plugins/freeboard/wg/Customization/advantech.jpg'
			},
            {
                name: 'myCo2',
                display_name: '二氧化碳(CO2)',
                type: 'calculated'
            },
			{
                name: 'myPM10',
                display_name: '懸浮微粒(PM10)',
                type: 'calculated'
            },
			{
                name: 'myPM25',
                display_name: '細懸浮微粒(PM2.5)',
                type: 'calculated'
            },
			{
                name: 'myHCHO',
                display_name: '甲醛(HCHO)',
                type: 'calculated'
            },
			{
                name: 'myTemp',
                display_name: '溫度',
                type: 'calculated'
            },
			{
                name: 'myHum',
                display_name: '濕度',
                type: 'calculated'
            },

			
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            logger.info('freeboard.loadWidgetPlugin: IAQ_LineWidget newInstance');
            newInstanceCallback(new IAQ_PicWidget(settings));
        }
    });


    var IAQ_PicWidget = function (settings)
    {
        logger.info('IAQ_PicWidget init');
        var self = this;
        var currentSettings = settings;
        var mainContainer;
        var bChangeValue = false;
        var timChange;
        var nChangeInterval = 30;
        self.widgetType = 'IAQ_Pic';
		var chart;
		var currentID = _.uniqueId('c3js_');
		// 參數存放
		var nCO2 =0, nPM10=0 , nPM25=0, nHCHO=0, nTemp=0, nHum=0;
        self.render = function (containerElement)
        {
            mainContainer = $(containerElement);
            mainContainer.append('<h2 class="section-title"></h2>');
            mainContainer.append('<div id="'+currentID+'" >TEST3</div>');
        };// end render

		 self.getHeight = function ()
        {
            return currentSettings.myWgHeight;
        };
        self.onSettingsChanged = function (newSettings)
        {
            logger.info('IAQ_PicWidget : onSettingsChanged');
            currentSettings = newSettings;
        };

        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection)
        {
			var oW = $('#'+currentID).parent('div').css("width");
			var oH = $('#'+currentID).parent('div').css("height");
			var imgPath = currentSettings.myBgImg;
			$('#'+currentID).css("width", oW);
			$('#'+currentID).css("height", oH);
			$('#'+currentID).css("background-image", "url("+imgPath+")");
			$('#'+currentID).css("background-size", oW +" "+oH);
			$('#'+currentID).css("background-repeat", "no-repeat");
			$('#'+currentID).html("<table width="+oW+" height= "+oH+" > " +
								  "<tr>" + 
								  "<td  height=13%></td> " + "<td  height=13%></td> " + 
								  "<td  height=13%></td> " + "<td  height=13%></td> " + 
								  "</tr>"+
								  "<tr>" + 
								  "<td width=18.75% height=14.5% > </td>" + 
								  "<td width=18.75% height=14.5% align='center' id='vCo2'> </td>" + 
								  "<td width=40.625% height=14.5% > </td>" + 
								  "<td width=21.875% height=14.5% align='center' id='iCo2'> </td>"+
								  "</tr>"+
								  "<tr>" + 
								  "<td width=18.75% height=14% > </td>" + 
								  "<td width=18.75% height=14% align='center' id='vPM10'> </td>" + 
								  "<td width=40.625% height=14% > </td>" + 
								  "<td width=21.875% height=14% align='center' id='iPM10'> </td>"+
								  "</tr>"+
								  "<tr>" + 
								  "<td width=18.75% height=14%> </td>" + 
								  "<td width=18.75% height=14% align='center' id='vPM25'> </td>" + 
								  "<td width=40.625% height=14%> </td>" + 
								  "<td width=21.875% height=14% align='center' id='iPM25'> </td>"+
								  "</tr>"+
								  "<tr>" + 
								  "<td width=18.75% height=14.5% > </td>" + 
								  "<td width=18.75% height=14.5% align='center' id='vHCHO'> </td>" + 
								  "<td width=40.625% height=14.5% > </td>"+
								  "<td width=21.875% height=14.5% align='center' id='iHCHO'> </td>"+
								  "</tr>"+
								  "<tr>" + 
								  "<td width=18.75%  height=13%> </td>" + 
								  "<td width=18.75%  height=13% align='center' id='vTemp'> </td>" + 
								  "<td width=40.625% height=13% > </td>"+
								  "<td width=21.875% height=13% > </td>"+
								  "</tr>"+
								  "<tr>" + 
								  "<td width=18.75% height=15% > </td>"+
								  "<td width=18.75% height=15% align='center' id='vHum'> </td>" + 
								  "<td width=40.625% height=15% > </td>"+
								  "<td width=21.875% height=15% > </td>"+
								  "</tr>"+
								  "<tr>" + 
								  "<td ></td> " + "<td ></td> " + 
								  "<td ></td> " + "<td ></td> " + 
								  "</tr>"+
								  "</table>");
			
			if (newValue!= "undefined"){
				// update
				//var oItem = newValue.result.itemList;
				var oValue = {};
                oValue.v = newValue;
                var oItem = [oValue];
				if (settingName=="myCo2"){
					nCO2=oItem[0].v;
				}// end myCo2
				if (settingName=="myPM10"){
					 nPM10 = oItem[0].v;
				}// end myPM10
				if (settingName=="myPM25"){
					 nPM25 = oItem[0].v;
				}// end myPM25
				if (settingName=="myHCHO"){
					 nHCHO = oItem[0].v;
				}// end myHCHO
				if (settingName=="myTemp"){
					 nTemp = oItem[0].v;
				}// end myTemp
				if (settingName=="myHum"){
					 nHum = oItem[0].v;
				}// end myHum
				
				//顯示數據
				var text_size = currentSettings.myTextSize;
				var text_color =currentSettings.myTextColor;
				var PNG = "icon-5.png";
				var pH = parseInt(oH)*0.101977107;
				pH = pH +"px";
				var pW = parseInt(oW)*0.16875;
				pW = pW +"px";

				$('#'+currentID).find('#vCo2').html("<font size='"+text_size+"' color='"+text_color+"'> " + nCO2.toFixed(0) + "</font>");
				if (nCO2<1000)PNG = "icon-1.png"; else if (nCO2<2000) PNG = "icon-3.png"; else PNG = "icon-5.png";
				$('#'+currentID).find('#iCo2').html("<img src=\"plugins/freeboard/wg/Customization/"+PNG+"\" width='"+pW+"' height='"+pH+"'>");
								
				$('#'+currentID).find('#vPM10').html("<font size='"+text_size+"' color='"+text_color+"'> " + nPM10.toFixed(1) + "</font>");
				if (nPM10<70)PNG = "icon-1.png"; else if (nPM10<140) PNG = "icon-3.png"; else PNG = "icon-5.png";
				$('#'+currentID).find('#iPM10').html("<img src=\"plugins/freeboard/wg/Customization/"+PNG+"\" width='"+pW+"' height='"+pH+"'>");
				
				$('#'+currentID).find('#vPM25').html("<font size='"+text_size+"' color='"+text_color+"'> " + nPM25.toFixed(1) + "</font>");
				if (nPM25<35)PNG = "icon-1.png"; else if (nPM25<70) PNG = "icon-3.png"; else PNG = "icon-5.png";
				$('#'+currentID).find('#iPM25').html("<img src=\"plugins/freeboard/wg/Customization/"+PNG+"\" width='"+pW+"' height='"+pH+"'>");
				
				$('#'+currentID).find('#vHCHO').html("<font size='"+text_size+"' color='"+text_color+"'> " + nHCHO.toFixed(2) + "</font>");
				if (nHCHO<0.08)PNG = "icon-1.png"; else if (nHCHO<0.16) PNG = "icon-3.png"; else PNG = "icon-5.png";
				$('#'+currentID).find('#iHCHO').html("<img src=\"plugins/freeboard/wg/Customization/"+PNG+"\" width='"+pW+"' height='"+pH+"'>");
				
				$('#'+currentID).find('#vTemp').html("<font size='"+text_size+"' color='"+text_color+"'> " + nTemp.toFixed(1) + "</font>");
				$('#'+currentID).find('#vHum').html("<font size='"+text_size+"' color='"+text_color+"'> " + nHum.toFixed(1) + "</font>");
			}// end newValue!= "undefined"
			
        };
    };
}());