/* 
 * Content Pack Generator
 * @date 2015/11/03
 */

var ContentPackGenerator = (function (log4jq) {

    var self = {};
    
    var logger = log4jq.getLogger({
        loggerName: 'SA.ContentPackGenerator.js'
    });
    
    self.exceptionEventCallback = null;
    self.setExceptionEventCallback = function (newCallback) {
        self.exceptionEventCallback = newCallback;
    };
    
    //store all types
    var types = {};


    self.register = function (pack_type, generatorName) {
        logger.info('register');

        var checkerGenerator = types[generatorName];

        if (typeof (checkerGenerator) != 'undefined') {
            logger.debug('overwrite OLD generator. pack type: ' + pack_type + ', generator name: ' + generatorName);
            checkerGenerator = generatorName;
        } else {
            logger.debug('add NEW adapter. pack type: ' + pack_type + ', generator name: ' + generatorName);
            types[pack_type] = generatorName;
        }

    };

    self.getGenerators = function () {
        logger.info('getGenerators');
        return types;
    };

    self.create = function (packSettings, data,callback) {
        logger.info('create');
        logger.debug(packSettings);
        var pack_dispaly_name = packSettings.display_name;
        var pack_type = packSettings.type_name;

        try {
            //get generator
            var currGenerator = types[pack_type];
            logger.debug('check generator: ' + pack_type + ', result: ' + currGenerator);
            if (typeof (currGenerator) != 'undefined') {
                //find 
                logger.debug('find generator: ' + currGenerator);
//                var freeboardConfig = window[currGenerator]['create'](data);
//                logger.debug('final data as below: ');
//                logger.debug(freeboardConfig);
              
//                return freeboardConfig;
            
                if(typeof(callback) === 'function'){
                      window[currGenerator]['create'](data,callback);
                }else{
                    alert('Please set callback function of generator');
                }
                    
            } else {
                logger.warn('CANNOT find \"' +  pack_type + '\" generator: ' + data);
                return '';
            }
        } catch (e) {

            logger.error('Generator create exception: ' + e);
            if (typeof (exceptionEventCallback) === 'function') {
//                alert(e);
                self.exceptionEventCallback(e);
            }
           return '';
        }

    };

    window.ContentPackGenerator = self;
    return self;

})(log4jq);

