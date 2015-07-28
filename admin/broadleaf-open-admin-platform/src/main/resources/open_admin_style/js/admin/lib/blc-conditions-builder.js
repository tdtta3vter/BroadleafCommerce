/*
 * #%L
 * BroadleafCommerce Open Admin Platform
 * %%
 * Copyright (C) 2009 - 2013 Broadleaf Commerce
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *       http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
/**
 * Broadleaf Commerce Conditions Rule Builder
 * Javascript Conditions Builder that handles both simple targeting rules
 * and complex quantitative item rules.
 * @author: elbertbautista
 *
 * Based off the Javascript component "business-rules"
 * @author: chris j. powers
 * https://github.com/chrisjpowers/business-rules
 * Copyright 2013 Chris Powers
 * http://chrisjpowers.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
(function($) {
    var uniqueModifier = 1;

    $.fn.conditionsBuilder = function(options) {
        if(options == "data") {
            var builder = $(this).eq(0).data("conditionsBuilder");
            return builder.collectData();
        } else if (options == "builder") {
            var builder = $(this).eq(0).data("conditionsBuilder");
            return builder;
        } else {
            return $(this).each(function() {
                var builder = new ConditionsBuilder(this, options);
                $(this).data("conditionsBuilder", builder);
            });
        }
    };

    function ConditionsBuilder(element, options) {
        this.element = $(element);
        this.options = options || {};
        this.init();
    }

    ConditionsBuilder.prototype = {
        init: function() {
            this.fields = this.options[0].fields;
            this.data = this.options[1].data;
            this.error = this.options[1].error;
            var rules = this.buildRules(this.data);
            this.element.html(rules);
            this.element.find(".conditional-rules").unwrap();

            var andDivider = $("<div>", {'class' : 'and-divider'});
            var andSpan = $("<span>", {'text' : 'AND'});

            andDivider.append(andSpan);

            if (this.data[0] != null && this.data[0].quantity != null) {
                var addMainConditionLink = this.getAddMainConditionLink();
                this.element.append(andDivider);

                this.element.append(addMainConditionLink);
            }
        },

        collectData: function() {
            var elements = this.element.find("> .conditional-rules > .conditional");
            var dataWrapper = {};
            dataWrapper.data = [];
            for (var i=0;i<elements.length;i++) {
                var element = elements[i];
                var data = this.collectDataFromNode($(element));
                if (data != null) {
                    dataWrapper.data.push(data);
                }
            }
            return dataWrapper;
        },
        
        /**
         * Starting at the given element, traverse down through all the conditional children building a JSON representation
         * of the conditional nodes with their rules. This method will ONLY collect data from top-level conditionals and
         * groups where there are actual rules (that reference properties) within them. If there are no rules within the
         * given element, this will return null. If this is apart of a larger JSON object graph you should have specific
         * null protection in this case
         */
        collectDataFromNode: function($element) {
            var klass = null;
            var id = null;
            var qty = null;
            var _this = this;
            if ($element.find('.rule').length == 0 && !$element.is('.rule')) {
                return null;
            }
            
            if ($element.is(".conditional")) {
                klass = $element.find("> .all-any-none-wrapper > .all-any-none").val();
                if ("all" == klass) {klass = "AND";}
                if ("any" == klass) {klass = "OR";}
                if ("none" == klass) {klass = "NOT";}
                qty = $element.find("> .all-any-none-wrapper > .conditional-qty").val();
                id = $element.find("> .all-any-none-wrapper > .conditional-id").val();
            }

            if (klass) {
                var out = {};
                if (qty) {
                    out.quantity = qty;
                } else {
                    out.quantity = null;
                }
                if (id) {
                    out.id = id;
                } else {
                    out.id = null;
                }
                out.groupOperator = klass;
                out.groups = [];
                $element.find("> .conditional-rules > .conditional, > .rule").each(function() {
                    var data = _this.collectDataFromNode($(this));
                    if (data != null) {
                        out.groups.push(data);
                    }
                });
                return out;
            } else {
                var value;
                var trueRadio = $element.find(".true");
                var falseRadio = $element.find(".false");
                if (trueRadio != null && trueRadio.is(':checked')) {
                    value = "true";
                } else if (falseRadio != null && falseRadio.is(':checked')) {
                    value = "false";
                } else {
                    value = $element.find(".value").val();
                }
                return {
                    id:null,
                    quantity:null,
                    groupOperator:null,
                    groups:[],
                    name: $element.find(".field").val(),
                    operator: $element.find(".operator").val(),
                    value: value,
                    start: $element.find(".start").val(),
                    end: $element.find(".end").val()
                };
            }
        },

        buildAddNewRule: function(rules) {
            var _this = this;
            var f = _this.fields[0];
            var newField = {id:null, quantity:null, groupOperator: "AND", groups: []};
            rules.append(_this.buildConditional(newField));
        },

        buildAddNewItemRule: function(rules, isAdditional) {
            var _this = this;
            var f = _this.fields[0];
            var newField = {id:null, quantity:1, groupOperator: "AND", groups: []};

            var andDivider = $("<div>", {'class' : 'and-divider'});
            var andSpan = $("<span>", {'text' : 'AND'});

            andDivider.append(andSpan);

            //if (!isAdditional) {
            //    rules.append(_this.buildConditional(newField, isAdditional));
            //
            //    var addMainConditionLink = this.getAddMainConditionLink();
            //    rules.append(addMainConditionLink);
            //} else {
                _this.buildConditional(newField, isAdditional).insertBefore(rules.children(':last'));
                andDivider.insertBefore(rules.children(':last'));

                var f = _this.fields[0];
                var newField = {name: f.value, operator: f.operators[0], value: null};
                rules.children('.conditional-rules').last().children(':first').prepend(_this.buildRule(newField));
            //}

            if (rules.children('.add-and-button').length == 0) {
                var addMainConditionLink = this.getAddMainConditionLink();
                    rules.append(addMainConditionLink);
            }
        },

        buildRules: function(ruleDataArray) {
            var container = $("<div>");
            
            for (var i=0; i<ruleDataArray.length; i++) {
                var conditional = this.buildConditional(ruleDataArray[i], (i != 0));
                if (conditional) {
                    container.append(conditional);
                } else {
                    return this.buildRule(ruleDataArray[i]);
                }
            }
            
            return container;
        },
        
        buildConditional: function(ruleData, isAdditional) {
            var output = $("<div>", {"class": "conditional-rules"});
            var kind;
            if(ruleData.groupOperator == "AND") { kind = "all"; }
            else if(ruleData.groupOperator == "OR") { kind = "any"; }
            else if (ruleData.groupOperator == "NOT") { kind = "none"; }
            if(!kind) { return; }

            var div = $("<div>", {"class": "rule-holder conditional " + kind});
            var selectWrapper = $("<div>", {"class": "all-any-none-wrapper"});
            selectWrapper.append($("<span>", {text: "Match", "class": "conditional-spacer"}));

            var qty = ruleData.quantity;
            if (qty != null) {
                var quantity = $("<input>", {"class": "conditional-qty", "type": "text", "value": qty});
                selectWrapper.append(quantity);
                selectWrapper.append($("<span>", {text: "of", "class": "conditional-spacer"}));
            }

            var id = ruleData.id;
            if (id != null) {
                var idHidden = $("<input>", {"class": "conditional-id", "type": "hidden", "value": id});
                selectWrapper.append(idHidden);
            }
            
            var removeLink = $("<a>", {"class": "remove tiny secondary radius button remove-subcondition", "href": "#", "text": "X"});
            removeLink.click(function(e) {
                e.preventDefault();
                $(this).parent().remove();
            });
            //div.append(removeLink);

            var select = $("<select>", {"class": "all-any-none"});
            select.append($("<option>", {"value": "all", "text": "All", "selected": kind == "all"}));
            select.append($("<option>", {"value": "any", "text": "Any", "selected": kind == "any"}));
            select.append($("<option>", {"value": "none", "text": "None", "selected": kind == "none"}));
            selectWrapper.append(select);
            selectWrapper.append($("<span>", {text: "of the following rules:"}));
            //div.append(selectWrapper);




            var addConditionLink = $("<a>", {"href": "#", "class": "add-condition tiny secondary radius button", "text": BLCAdmin.messages.subCondition});
            addConditionLink.prepend($('<i>', {'class' : 'icon-plus' }));
            addConditionLink.click(function(e) {
                e.preventDefault();
                var f = _this.fields[0];
                var newField = {quantity:null, groupOperator: "AND", groups: [{name: f.value, operator: f.operators[0], value: null}]};
                $(this).parent(".conditional").append(_this.buildConditional(newField));
            });
            //div.append(addConditionLink);
            
            if (isAdditional) {
                var removeMainConditionLink = $("<a>", {"href": "#", "class": "remove-main-condition tiny secondary radius button", "text": BLCAdmin.messages.entireCondition});
                removeMainConditionLink.prepend($('<i>', {'class' : 'icon-minus' }));
                removeMainConditionLink.click(function(e) {
                    e.preventDefault();
                    $(this).parent().parent().remove();
                });
                //div.append(removeMainConditionLink);
            }

            var rules = ruleData.groups;
            for(var j=0; j<rules.length; j++) {
                var ruleArray = [];
                ruleArray.push(rules[j]);
                div.append(this.buildRules(ruleArray));
            }

            var addRuleLinkOuter = $("<div>", {'class' : 'add-or-button'});
            var addRuleLink = $("<div>", {"class": "add-rule button or-button", "text": "Add Or Condition"});


            addRuleLinkOuter.prepend(addRuleLink);
            div.append(addRuleLinkOuter);
            var _this = this;
            addRuleLink.click(function(e) {
                e.preventDefault();
                var f = _this.fields[0];
                var newField = {name: f.value, operator: f.operators[0], value: null};

                _this.buildRule(newField).insertBefore($(this).parent());
            });

            output.append(div);

            return output;
        },

        buildRule: function(ruleData) {
            var ruleDiv = $("<div>", {"class": "row or-condition rule"});
            var fieldSelect = getFieldSelect(this.fields, ruleData);
            var operatorSelect = getOperatorSelect();

            fieldSelect.change(onFieldSelectChanged.call(this, operatorSelect, ruleData));

            var fieldSelectOuter = $("<div>", {'class' : 'col4' });
            var fieldSelectOuter2 = $("<div>", {'class' : 'select-style' });
            fieldSelectOuter2.prepend(fieldSelect);
            fieldSelectOuter.prepend(fieldSelectOuter2);

            var operatorSelectOuter = $("<div>", {'class' : 'col4' });
            var operatorSelectOuter2 = $("<div>", {'class' : 'select-style' });
            operatorSelectOuter2.prepend(operatorSelect);
            operatorSelectOuter.prepend(operatorSelectOuter2);

            ruleDiv.append(fieldSelectOuter);
            ruleDiv.append(operatorSelectOuter);

            fieldSelect.change();

            var trueRadio = ruleDiv.find(".true");
            var falseRadio = ruleDiv.find(".false");
            if (trueRadio != null && ruleData.value == "true") {
                trueRadio.prop('checked', true)
                falseRadio.prop('checked', false)
            } else if (ruleData.start && ruleData.start != "null" && ruleData.end && ruleData.end != "null") {
                ruleDiv.find(".start").val(ruleData.start);
                ruleDiv.find(".end").val(ruleData.end);
            } else if ((falseRadio != null && ruleData.value == "false") || ruleData.value == null) {
                falseRadio.prop('checked', true)
                trueRadio.prop('checked', false)
            } else {
                ruleDiv.find(".value").val(ruleData.value);
            }
            ruleDiv.append(removeLink());

            return ruleDiv;
        },

        operatorsFor: function(fieldName) {
            for(var i=0; i < this.fields.length; i++) {
                var field = this.fields[i];
                if(field.name == fieldName) {
                    return window[field.operators];
                }
            }
        },
        
        getAddMainConditionLink : function() {
            var outerDiv = $("<div>", {'class' : 'add-and-button' });

            var addMainConditionLink = $("<div>", {
                'class': "button and-button add-main-condition",
                'text': "Add And Condition"
            });

            outerDiv.prepend(addMainConditionLink);
            
            return outerDiv;
        }
    };

    function getFieldSelect(fields, ruleData) {
        var select = $("<select>", {"class": "field"});
        for(var i=0; i < fields.length; i++) {
            var field = fields[i];
            var option = $("<option>", {
                text: field.label,
                value: field.name,
                selected: ruleData.name == field.name
            });
            option.data("options", window[field.options]);
            select.append(option);
        }

        return select;
    }

    function getOperatorSelect() {
        var select = $("<select>", {"class": "operator"});
        select.change(onOperatorSelectChange);
        return select;
    }
    
    function removeLink() {
        var outerDiv = $("<div>", {'class' : 'col1 remove-row'});
        var removeLink = $("<i>", {"class": "fa fa-minus-circle"});
        removeLink.click(onRemoveLinkClicked);

        outerDiv.prepend(removeLink);
        return outerDiv;
    }

    function onRemoveLinkClicked(e) {
        e.preventDefault();

        var container = $(this).parent().parent().parent();
        var rules = container.children('.or-condition');
        if (rules.length == 1) {
            container.parent().next('.and-divider').remove();
            container.remove();
        } else {
            $(this).parent().parent().remove();
        }
    }

    function onFieldSelectChanged(operatorSelect, ruleData) {
        var builder = this;
        return function(e) {
            var operators = builder.operatorsFor($(e.target).val());
            operatorSelect.empty();
            for(var i=0; i < operators.length; i++) {
                var operator = operators[i];
                var option = $("<option>", {
                    text: operator.label || operator.name,
                    value: operator.name,
                    selected: ruleData.operator == operator.name
                });
                option.data("fieldType", operator.fieldType);
                operatorSelect.append(option);
            }
            operatorSelect.change();
        }
    }

    function getUniqueModifier() {
        uniqueModifier++;
        return uniqueModifier;
    }

    function onOperatorSelectChange(e) {
        var $this = $(this);
        var option = $this.find("> :selected");
        var container = $this.closest(".row");
        var fieldSelect = container.find(".field");
        var currentValue = container.find(".value");

        var outerDiv = $("<div>", {'class' : 'col3'});
        //$(container).append(outerDiv);

        var val = currentValue.val();
        var radioContainer = container.find(".radioContainer");
        if (radioContainer != null) {
            radioContainer.remove();
        }
        var datePickerContainer = container.find(".single-picker");
        if (datePickerContainer != null) {
            datePickerContainer.remove();
        }
        var rangeDatePickerContainer = container.find(".range-picker");
        if (rangeDatePickerContainer != null) {
            rangeDatePickerContainer.remove();
        }

        switch(option.data("fieldType")) {
            case "NONE":
                outerDiv.append($("<input>", {"type": "hidden", "class": "value"}));
                break;
            case "TEXT":
                outerDiv.append($("<input>", {"type": "text", "class": "value"}));
                break;
            case "DATE":
                outerDiv.append($("<div>", {"class": "datepicker-container single-picker"}));
                datePickerContainer = container.find(".single-picker");
                datePickerContainer.append($("<input>", {"type": "text", "class": "three datepicker value"}));
                datePickerContainer.append($("<i>", {"class": "icon-calendar"}));
                BLCAdmin.dates.initialize(datePickerContainer.find('.datepicker'));
                break;
            case "RANGE":
                $this.after($("<input>", {"type": "text", "class": "end"}))
                    .after("<span class=\"value conditional-spacer\">and</span>")
                    .after($("<input>", {"type": "text", "class": "start"}));
                break;
            case "DATE_RANGE":
                outerDiv.append($("<span>", {"class": "datepicker-container range-picker"}));
                rangeDatePickerContainer = container.find(".range-picker");
                rangeDatePickerContainer.append($("<div>", {"class": "datepicker-container start-picker"}));
                var startContainer = rangeDatePickerContainer.find(".start-picker");
                startContainer.append($("<input>", {"type": "text", "class": "three datepicker start"}));
                startContainer.append($("<i>", {"class": "icon-calendar"}));
                BLCAdmin.dates.initialize(startContainer.find('.datepicker'));
                rangeDatePickerContainer.append("<span class=\"value conditional-spacer conditional-date-spacer\">and</span>")
                rangeDatePickerContainer.append($("<div>", {"class": "datepicker-container end-picker"}));
                var endContainer = rangeDatePickerContainer.find(".end-picker");
                endContainer.append($("<input>", {"type": "text", "class": "three datepicker end"}));
                endContainer.append($("<i>", {"class": "icon-calendar"}));
                BLCAdmin.dates.initialize(endContainer.find('.datepicker'));
                break;
            case "BOOLEAN":
                outerDiv.append($("<span>", {"class": "radioContainer"}));
                radioContainer = container.find(".radioContainer");
                var modifier = getUniqueModifier();
                radioContainer.append($("<input>", {"type": "radio", "name": "ruleBuilderBooleanRadio" + modifier, "value":"true", "class": "true"}));
                radioContainer.append($("<span>", {"style": "margin-right: 10px; margin-left: 3px", "text" : BLCAdmin.messages.booleanTrue}));
                radioContainer.append($("<input>", {"type": "radio", "name": "ruleBuilderBooleanRadio" + modifier, "value":"false", "class": "false", "checked": "true"}));
                radioContainer.append($("<span>", {"style": "margin-right: 10px; margin-left: 3px", "text" : BLCAdmin.messages.booleanFalse}));
                break;
            case "SELECT":
                var outerDiv2 = $("<div>", {'class' : 'select-style'});
                var select = $("<select>", {"class": "value"});
                var options = fieldSelect.find("> :selected").data("options");
                for(var i=0; i < options.length; i++) {
                    var opt = options[i];
                    select.append($("<option>", {"text": opt.label || opt.name, "value": opt.name}));
                }
                outerDiv2.append(select);
                outerDiv.append(outerDiv2);
                break;
            default:
                break;
        }
        if (currentValue.length) {
            currentValue.parents('.col3').replaceWith(outerDiv);
        } else {
            $(container).append(outerDiv);

        }
    }

})(jQuery);