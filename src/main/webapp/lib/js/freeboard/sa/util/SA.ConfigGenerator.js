/* 
 * Config Generator
 * It will create config of freeboard 
 * @date 2015/11/04
 */
var ConfigGenerator = function () {

    var self = {};

    var logger = log4jq.getLogger({
        loggerName: 'SA.ConfigGenerator.js'
    });
    logger.info('init ConfigGenerator');

    var PANES_COLL = {};//save panes 
    var DATASOURCE_COLL = {};//save data source
    var WIDGETS_COLL = {}; //save widgets

    //
    //
    // config template
    //
    var layout = {
        'allow_edit': true,
        'panes': [],
        'datasources': []//put dataSourceTemplate
    };
    
    self.getLayout = function(){
        logger.info('getLayout');
        return layout;
    };

    self.getPaneTemplate = function () {
        logger.info('getPaneTemplate');
        var paneTemplate = {
            title: '',
            width: 1,
            row: {}, //DONOT ASSIGN freeboard will auto arrange 
            col: {}, //
            col_width: 1,
            widgets: []// put widgetTemplate object
        };

        return paneTemplate;
    };

    self.getWidgetTemplate = function () {
        logger.info('getWidgetTemplate');
        var widgetTemplate = {
            titie: '',
            type: '',
            settings: {
            }
        };
        return widgetTemplate;
    };

    self.getDatasourceTemplate = function () {
        logger.info('getDatasourceTemplate');

        var dataSourceTemplate = {
            name: '',
            type: '',
            settings: {
            }
        };
//        console.log(dataSourceTemplate);
        return dataSourceTemplate;
    };

    self.addPane = function (pane) {
        logger.info('addPane');
        logger.debug(pane);

        PANES_COLL[pane.title] = pane;

//        layout.panes.push(pane);
    };

    self.getPane = function (title) {
        logger.info('getPane: ' + title);
        var pane = PANES_COLL[title];
        return pane;
    };

    self.addDS = function (ds) {
        logger.info('addDS');
        logger.debug(ds);
        
        if(typeof(DATASOURCE_COLL[ds.name]) == 'undefined'){
            DATASOURCE_COLL[ds.name] = ds;
        }else{
            logger.warn('duplicated ds');
        }
        
//        layout.datasources.push(ds);
//        console.log(ds);
        
    };
    self.getDS = function (name) {
        logger.info('getDS: ' + name);
        var ds = DATASOURCE_COLL[name];
        return ds;
    };

    self.addWidgetToPane = function (pane, widget) {
        logger.info('addWidgetToPane');
        var pane = self.getPane(pane.title);
        
        WIDGETS_COLL[widget.settings.title] = widget;
//        console.log(widget);
        pane.widgets.push(widget);//update to PANES_COLL
        
    };
    self.getWidget = function ( nameOfWidget) {
        logger.info('getWidget: ');
        var widget = WIDGETS_COLL[nameOfWidget];
        return widget;
    };
    
    self.removeWidget = function ( nameOfWidget) {
        logger.info('getWidget: ');
        delete WIDGETS_COLL[nameOfWidget];
    };
    
    self.print = function(){
        logger.info('print: ');
        console.log(layout);
        console.log(PANES_COLL);
        console.log(DATASOURCE_COLL);
        console.log(WIDGETS_COLL);
    };

    self.reset = function () {
        logger.info('reset');
        layout = {
            'allow_edit': true,
            'panes': [],
            'datasources': []//put dataSourceTemplate
        };
        
        PANES_COLL = {};//save panes 
        DATASOURCE_COLL = {};//save data source
        WIDGETS_COLL = {}; //save widgets
        
//        self.print();
    };

    //CORE
    self.create = function () {
        logger.info('create: output config');
//        console.log(layout);
        for (paneKey in PANES_COLL) {
            layout.panes.push(PANES_COLL[paneKey]);
        }
        for (dsKey in DATASOURCE_COLL) {
            layout.datasources.push(DATASOURCE_COLL[dsKey]);
        }
//        var config = JSON.stringify(layout);
        var config = layout;
        self.reset();
        
//        logger.debug(config);
//        console.log(JSON.stringify(config));
        return config;
    };

//    self.print();
    return self;
};
