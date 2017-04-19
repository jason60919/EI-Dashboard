/*
 *  content pack generator template
 *  @ken.tsai@advantech.com.tw
 *  @date 2015/11/04
 */
if (typeof (ContentPackGenerator) !== 'undefined') {
    ContentPackGenerator.register('Temp', 'ContentPackGenerator');
}

var TempContentPackGenerator = (function (log4jq) {

    var cpGenerator = {};
    cpGenerator.name = 'SA.TempContentPackGenerator.js';

    var logger = log4jq.getLogger({
        loggerName: cpGenerator.name
    });

    /*
     * Sample create function
     * dsGenerator.create = function (pack_type,data) {};
     */
    cpGenerator.create = function (data) {
        logger.info('create');
        var config = '';

        return config;
    };

    window[cpGenerator.name] = cpGenerator;

    return cpGenerator;
})(log4jq);
