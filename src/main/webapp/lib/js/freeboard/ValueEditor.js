// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

ValueEditor = function(theFreeboardModel) {
    'use strict';

    //added by ken 2015/09/15
    var valueEditorLog = log4jq.getLogger({
        loggerName: 'ValueEditor.js'
    });
    
    var _veDatasourceRegex = new RegExp('.*datasources\\[\"([^\"]*)(\"\\])?(.*)$');

    var dropdown = null;
    var selectedOptionIndex = 0;
    var _autocompleteOptions = [];//auto complete optios object array 
    var currentValue = null;

    var EXPECTED_TYPE = {
        ANY : 'any',
        ARRAY : 'array',
        OBJECT : 'object',
        STRING : 'string',
        NUMBER : 'number',
        BOOLEAN : 'boolean'
    };

    function _isPotentialTypeMatch(value, expectsType) {
        if(_.isArray(value) || _.isObject(value))
            return true;
        return _isTypeMatch(value, expectsType);
    }

    function _isTypeMatch(value, expectsType) {
        switch(expectsType) {
        case EXPECTED_TYPE.ANY: return true;
        case EXPECTED_TYPE.ARRAY: return _.isArray(value);
        case EXPECTED_TYPE.OBJECT: return _.isObject(value);
        case EXPECTED_TYPE.STRING: return _.isString(value);
        case EXPECTED_TYPE.NUMBER: return _.isNumber(value);
        case EXPECTED_TYPE.BOOLEAN: return _.isBoolean(value);
        }
    }

    function _checkCurrentValueType(element, expectsType) {
        $(element).parent().find('.validation-error').remove();
        if(!_isTypeMatch(currentValue, expectsType)) {
            $(element).parent().append('<div class="validation-error">' +
                'This field expects an expression that evaluates to type ' +
                expectsType + '.</div>');
        }
    }

    function _resizeValueEditor(element) {
        var lineBreakCount = ($(element).val().match(/\n/g) || []).length;

        var newHeight = Math.min(200, 20 * (lineBreakCount + 1));

        $(element).css({height: newHeight + 'px'});
    }

    /*
     * 
     * @param {String} inputString: datasources["
     * @param {Object} datasources: DatasourceModel
     * @param {String} expectsType: any,
     * @returns {undefined}
     */
    function _autocompleteFromDatasource(inputString, datasources, expectsType) {
        valueEditorLog.info('_autocompleteFromDatasource');
//        console.log(inputString);
//        console.log(datasources);
//        console.log(expectsType);
        var match = _veDatasourceRegex.exec(inputString);

        var options = [];//parse data soruce opts to autocomplete opts

        if (match) {
            if (match[1] === '') {
                // Editor value is: datasources["; List all datasources
                valueEditorLog.debug('list all datasouces');
                _.each(datasources, function(datasource) {
//                    console.log(datasource);
                    valueEditorLog.debug('ds name: ' +  datasource.name());
                    options.push({value: datasource.name(), entity: undefined,
                        precede_char: '', follow_char: '\"]'});
                });
            } else if (match[1] !== '' && _.isUndefined(match[2])) {
                // Editor value is a partial match for a datasource; list matching datasources
                var replacementString = match[1];

                _.each(datasources, function(datasource) {
                    var dsName = datasource.name();

                    if(dsName != replacementString && dsName.indexOf(replacementString) === 0) {
                        options.push({value: dsName, entity: undefined,
                            precede_char: '', follow_char: '\"]'});
                    }
                });
            } else {
                // Editor value matches a datasources; parse JSON in order to populate list
                // We already have a datasource selected; find it
                var datasource = _.find(datasources, function(datasource) {
                    return (datasource.name() === match[1]);
                });

                if (!_.isUndefined(datasource)) {
                    var dataPath = 'data';
                    var remainder = '';

                    // Parse the partial JSON selectors
                    if (!_.isUndefined(match[2])) {
                        // Strip any incomplete field values, and store the remainder
                        var remainderIndex = match[3].lastIndexOf(']') + 1;
                        dataPath = dataPath + match[3].substring(0, remainderIndex);
                        remainder = match[3].substring(remainderIndex, match[3].length);
                   
                        remainder = remainder.replace(/^[\[\"]*/, '');
                        remainder = remainder.replace(/[\"\]]*$/, '');
                    }

                    // Get the data for the last complete JSON field
                    valueEditorLog.debug('Get the data for the last complete JSON field: ' + dataPath);
                    var dataValue = datasource.getDataRepresentation(dataPath);
                    currentValue = dataValue;

                    // For arrays, list out the indices
                    if (_.isArray(dataValue)) {
                        for(var index = 0; index < dataValue.length; index++) {
                            if (index.toString().indexOf(remainder) === 0) {
                                var value = dataValue[index];
                                if (_isPotentialTypeMatch(value, expectsType)) {
                                    options.push({value: index, entity: value,
                                        precede_char: '[', follow_char: ']',
                                        preview: value.toString()});
                                }
                            }
                        }
                    } else if(_.isObject(dataValue)) {
                        // For objects, list out the keys
                        _.each(dataValue, function(value, name) {
                            if (name.indexOf(remainder) === 0) {
                                if (_isPotentialTypeMatch(value, expectsType)) {
                                    options.push({value: name, entity: value,
                                        precede_char: '[\"', follow_char: '\"]'});
                                }
                            }
                        });
                    } else {
                        // For everything else, do nothing (no further selection possible)
                        // no-op
                    }
                }
            }
        }
//        valueEditorLog.debug(options);
        _autocompleteOptions = options;
    }

    function _renderAutocompleteDropdown(element, expectsType) {
        var elemVal = $(element).val();
        valueEditorLog.info('_renderAutocompleteDropdown element:' + elemVal + ' ,expectsType: ' + expectsType);
        
        var inputString = elemVal.substring(0, $(element).getCaretPosition());

        // Weird issue where the textarea box was putting in ASCII (nbsp) for spaces.
        inputString = inputString.replace(String.fromCharCode(160), ' ');

        //theFreeboardModel.datasources() => get all datasoruce
        _autocompleteFromDatasource(inputString, theFreeboardModel.datasources(), expectsType);     
        valueEditorLog.debug('autocomplete datasource as below:');
//        console.log(_autocompleteOptions);

        if (_autocompleteOptions.length > 0) {
            if (!dropdown) {
                dropdown = $('<ul id="value-selector" class="value-dropdown"></ul>')
                    .insertAfter(element)
                    .width($(element).outerWidth() - 2)
                    .css('left', $(element).position().left)
                    .css('top', $(element).position().top + $(element).outerHeight() - 1);
            }

            dropdown.empty();
            dropdown.scrollTop(0);

            var selected = true;
            selectedOptionIndex = 0;

            _.each(_autocompleteOptions, function(option, index) {
                var li = _renderAutocompleteDropdownOption(element, inputString, option, index);
                if (selected) {
                    $(li).addClass('selected');
                    selected = false;
                }
            });
        } else {
            _checkCurrentValueType(element, expectsType);
            $(element).next('ul#value-selector').remove();
            dropdown = null;
            selectedOptionIndex = -1;
        }
    }

    function _renderAutocompleteDropdownOption(element, inputString, option, currentIndex) {
        valueEditorLog.info('_renderAutocompleteDropdownOption');
        var optionLabel = option.value;
          valueEditorLog.info('optionLabel: ' + optionLabel);
          
        if(option.preview)
            optionLabel = optionLabel + '<span class="preview">' + option.preview + '</span>';

        var li = $('<li>' + optionLabel + '</li>').appendTo(dropdown)
            .mouseenter(function() {
                $(this).trigger('freeboard-select');
            })
            .mousedown(function(event) {
                $(this).trigger('freeboard-insertValue');
                event.preventDefault();
            })
            .data('freeboard-optionIndex', currentIndex)
            .data('freeboard-optionValue', option.value)
            .bind('freeboard-insertValue', function() {
                var optionValue = option.value;
                optionValue = option.precede_char + optionValue + option.follow_char;

                var replacementIndex = inputString.lastIndexOf(']');
                if(replacementIndex != -1)
                    $(element).replaceTextAt(replacementIndex+1, $(element).val().length, optionValue);
                else
                    $(element).insertAtCaret(optionValue);

                currentValue = option.entity;
                $(element).triggerHandler('mouseup');
            })
            .bind('freeboard-select', function() {
                $(this).parent().find('li.selected').removeClass('selected');
                $(this).addClass('selected');
                selectedOptionIndex = $(this).data('freeboard-optionIndex');
            });
        return li;
    }

    function createValueEditor(element, expectsType) {
        valueEditorLog.info('createValueEditor expectsType:' + expectsType);
        $(element).addClass('calculated-value-input')
            .bind('keyup mouseup freeboard-eval', function(event) {
                // Ignore arrow keys and enter keys
                if(dropdown && event.type === 'keyup' && (event.keyCode === 38 || event.keyCode === 40 || event.keyCode === 13)) {
                    event.preventDefault();
                    return;
                }
                _renderAutocompleteDropdown(element, expectsType);
            })
            .focus(function() {
                $(element).css({'z-index' : 3001});
                _resizeValueEditor(element);
            })
            .focusout(function() {
                _checkCurrentValueType(element, expectsType);
                $(element).css({
                    'height': '',
                    'z-index' : 3000
                });
                $(element).next('ul#value-selector').remove();
                dropdown = null;
                selectedOptionIndex = -1;
            })
            .bind('keydown', function(event) {
                if (dropdown) {
                    if (event.keyCode === 38 || event.keyCode === 40) {
                        // Handle Arrow keys
                        event.preventDefault();

                        var optionItems = $(dropdown).find('li');

                        if (event.keyCode === 38) // Up Arrow
                            selectedOptionIndex--;
                        else if(event.keyCode === 40) // Down Arrow
                            selectedOptionIndex++;

                        if (selectedOptionIndex < 0)
                            selectedOptionIndex = optionItems.size() - 1;
                        else if (selectedOptionIndex >= optionItems.size())
                            selectedOptionIndex = 0;

                        var optionElement = $(optionItems).eq(selectedOptionIndex);

                        optionElement.trigger('freeboard-select');
                        $(dropdown).scrollTop($(optionElement).position().top);

                    } else if (event.keyCode === 13) {
                        event.preventDefault();

                        if (selectedOptionIndex != -1) {
                            $(dropdown).find('li').eq(selectedOptionIndex)
                                .trigger('freeboard-insertValue');
                        }
                    }
                }
            });
    }

    // Public API
    return {
        createValueEditor : function(element, expectsType) {
            if(expectsType)
                createValueEditor(element, expectsType);
            else
                createValueEditor(element, EXPECTED_TYPE.ANY);
        },
        EXPECTED_TYPE : EXPECTED_TYPE
    };
};
