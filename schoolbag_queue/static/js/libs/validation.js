//validation
var validation = (function() {
    //init
    function init() {
        $(form).find('input:not(:checkbox):not(:radio)[data-validation]').on('blur', validateOnBlur)
    }
    var validForm = function(form) {
        var valid = true
        $(form).find('input[data-validation], textarea[data-validation], select[data-validation]').each(function(index, element) {
            if (!isValidElement(element))
                valid = false
        })
        $(form).find("select").each(function(index, element) {
            if (!isValid(element))
                valid = false
        })
        return valid
    }
    var isValidCheckbox = function(parent) {
        var element = $(parent).find("input:checkbox")[0]
        if (element) {
            var required = element.getAttribute('data-validation')
            if (required == 'one') {
                var count = $(parent).find("input:checkbox:checked").length
                if (count == 0) {
                    $(element).closest('.validation-box').addClass('error')
                    return false
                }
            }
        }
        $(parent).closest('.validation-box').removeClass('error')
        return true
    }
    var isValidRadio = function(form) {
        var element = $( form ).find("input:radio")[0]
        var required = element.getAttribute("data-required-key")
        if (required == "one") {
            var count = $(form).find("input:radio:checked").length
            if (count == 0) {
                $(element.getAttribute("data-validation-target")).addClass('error')
                return false
            }
        }
        return true
    }
    function isValidElement(element) {
        var validationRule = element.getAttribute('data-validation')
        if (!validationRule) {
            return true
        }
        var rules = element.getAttribute('data-validation').split(/\s*,\s*/)
        var valid = true
        var required = rules.indexOf('required')
        if (required == -1 &&  element.value.trim() == "") {
            return true
        } else if (required != -1 &&  element.value.trim() == "") {
            valid = 'required'
        } else {
            for (var i = 0; i < rules.length; i++) {
                valid = checkValidation(rules[i], element)
                if (valid !== true) {
                    break
                }
            }
        }
        if (valid !== true) {
            var targetElem =  $(element).closest('.validation-box')
            targetElem.removeClass('required email match number password date max afterElement time')
            targetElem.addClass('error ' + valid )
            return false
        } else {
            var targetElem =  $(element).closest('.validation-box')
            targetElem.removeClass('error required email match number password date max afterElement time')
            return true
        }
    }
    function checkValidation(rule, element, required) {
        if (rule == 'required')
            if (element.value.trim() == "" ||
             ((element.getAttribute('type') == 'radio' || element.getAttribute('type') == 'checkbox')
                && (!element.checked && $('[name="'+ element.name + '"]:checked').length < 1))
            ){
            return rule
        }
        if (rule == 'number' && !element.value.replace(' ', '').match(/^\d*$/)) {
            return rule
        }
        if (rule == 'number-phone' && !element.value.replace(/[ -]/g, '').match(/^\+?\d+$/)) {
            return rule
        }
        if (rule == 'password') {
            regex = /^(?=[a-zA-Z0-9]*\d[a-zA-Z0-9]*)(?=[a-zA-Z0-9]*[a-z][a-zA-Z0-9]*)(?=[a-zA-Z0-9]*[a-zA-Z0-9]*)[\S]{8,}$/

            if (!element.value.match(regex)) {
                return rule
            }
        }
        if (rule == 'email'  &&
                element.value.match(/^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/) == null
            ) {
            return rule
        }
        if (rule == "match" &&
            element.value != $(element.getAttribute('data-match')).val()) {
            return rule
        }
        if (rule == "date" && !moment(element.value).isValid()) {
            console.log(moment(element.value), element.value)
            console.log(moment(element.value).isValid())
            return rule
        }
        if (rule == "time" && !moment(element.value, element.getAttribute('data-time-format'), true).isValid()) {
            return rule
        }
        if (rule == "max") {
            if ((element.type == 'text' || element.type == 'number') && parseInt(element.value) > parseInt(element.getAttribute('data-max')))
                return rule
            else if (element.type == 'file' && element.files[0].size > element.getAttribute('data-max')) {
                return rule
            }
        }
        if (rule == "after-element") {
            var targetElem = $(element.getAttribute('data-validation-after'))[0]
            if (element.getAttribute('data-validation').indexOf('date') != -1) {
                if (!moment(targetElem.value).isValid() || moment(element.value).isBefore(moment(targetElem.value))) {
                    return rule
                }
            }
            if (element.getAttribute('data-validation').indexOf('time') != -1) {
                var timeFormat = targetElem.getAttribute('data-time-format')
                if (!moment(targetElem.value, timeFormat).isValid() || moment(element.value, timeFormat).isBefore(moment(targetElem.value, timeFormat))) {
                    return rule
                }
            }
        }
        if (rule == "after-element-compare") { //::TODO remove this attribute and use a custom validation in place of it
        //used in events to ensure event ends after it starts when time is used and one day event
            var compareElem = $(element.getAttribute('data-validation-compare'))[0]
            var targetElem = $(element.getAttribute('data-validation-after'))[0]
            if (moment(targetElem.value).isAfter(moment(compareElem.value))) {
                return "after-element"
            }

        }
        return true
    }
    return {
        init: init, validateForm:validForm, validateElement:isValidElement
    }
})()
