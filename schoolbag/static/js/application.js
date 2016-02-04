


  /*
 * School Bag Main application file and common functions
 * sortTables

 * Table of contents:
 * TODO complete ToC
 * Globals
 * Document Start
 *

 * File Browser common events
 * External Protocol Handler
 */
 /* Globals */
var regexURL = /(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/
$.uniform.defaults.fileDefaultHtml = _t("select-file-please")
$.uniform.defaults.fileButtonHtml = _t("choose-file")
var resourceUploadWizard = {}
var sortDataTable
$(document).ready(function() {
    $(".homework-title").focus();
    //Translate external js
    $.datepicker.setDefaults($.datepicker.regional["en-GB"]);
    $.datepicker.setDefaults($.datepicker.regional[$('body').data().lang]);
    var timezone = $('input[name="session_timezone"]').val() || 'GMT'
    useTimezones($.datepicker, timezone)
    var language = $('body').data().lang
    if (language) {
        moment.lang(language)
		if (language=='ga') {
			moment.lang('ga', {weekdays : ["Dé Domhnaigh", "Dé Luain", "Dé Máirt", "Dé Céadaoin", "Déardaoin", "Dé hAoine", "Dé Sathairn"]})
			moment.lang('ga', {weekdaysShort : ["Do", "Lu", "Má", "Cé", "Dé", "hA", "Sa"]})
			moment.lang('ga', {weekdaysMin : ["D", "L", "M", "C", "D", "h", "S"]})
			moment.lang('ga', {months : ["Mí Eanair", "Mí Feabhra", "Mí Márta", "Mí Aibreán", "Mí Bealtaine", "Mí Meitheamh", "Mí Iúil", "Mí Lúnasa", "Mí Meán Fomhair", "Mí Deireadh Fomhair", "Mí na Samhna", "Mí na Nollag"]})
			moment.lang('ga', {monthsShort : ["Ean", "Feab", "Már", "Aib", "Beal", "Meit", "Iúil", "Lún", "MF", "DF", "Samh", "Nol"]})
		}
    }

    //Homework View LIST and Grid --used in homework and class views
    $('.view-grid-list button').on('click', function(e) {
        if ($(this).hasClass('grid')) {
            $('.view-manager').removeClass('list').addClass('grid');
            $(this).addClass('hidden');
            $('button.list').removeClass('hidden');
            try {
                sessionStorage.setItem('homework-view', 'grid')
            } catch (error) {}

        } else if ($(this).hasClass('list')) {
            $('.view-manager').removeClass('grid').addClass('list');

            $(this).addClass('hidden');
            $('button.grid').removeClass('hidden');
            try {
                sessionStorage.setItem('homework-view', 'list')
            } catch (error) {}
        }
        $('.homework-description').dotdotdot()
    });
    $("iframe").each(function() {
        var ifr_source = $(this).attr('src');
        var wmode = "wmode=transparent";
        if (ifr_source.indexOf('?') != -1)
            $(this).attr('src', ifr_source + '&' + wmode);
        else
            $(this).attr('src', ifr_source + '?' + wmode);
    });

    init()
    setUpEvents()
    // a very simple regex for links





    //Profile Context Menu
    $('.user-profile').click(function(event) {
        event.stopPropagation();
        $(".user-profile-actions").slideToggle("fast");
    });
    $(".user-profile-actions").on("click", function(event) {
        event.stopPropagation();
    });
    $(document).on("click", function() {
        $(".user-profile-actions").hide();
    });

    // jquery libs
    $("select:not(.hidden)").uniform();
    $(":checkbox:not(.hidden)").uniform({
        checkboxClass : 'ld-CheckClass'
    });
    $(":radio").uniform({
        radioClass : 'ld-RadioClass'
    });
    $(".sidebar-scroll").slimScroll({
        height : "100%"
    })
    /****************************************************
        DataTable sort classes
    ******************************************************/

    $('#sortByClass').DataTable({
        paging: false,
        searching: false,
        info: false
    })
    sortDataTable = $('#sortAndFilter').DataTable({
        paging: false,
        info: false
    })
    try { sessionStorage.exitRoute = sessionStorage.exitRoute || "" } catch(error) {}
    $(".nav.navbar-nav li").removeClass("active")
    if (window.location.pathname.indexOf("dashboard") != -1) {
        dashboard.init()
        $(".nav.navbar-nav li.dashboard").addClass("active")
    } else if (window.location.pathname.indexOf("messages") != -1) {
        $(".nav.navbar-nav li.messages").addClass("active")
    } else if (window.location.pathname.indexOf("noticeboard") != -1) {
        noticesPage.init()
        $(".nav.navbar-nav li.notices").addClass("active")
    } else if (window.location.pathname.indexOf("calendar") != -1) {
        calendarPage.init()
        $(".nav.navbar-nav li.events").addClass("active")
    } else if (window.location.pathname.indexOf("Ebooks") != -1) {
        $(".nav.navbar-nav li.ebooks").addClass("active")
        place = "ebooks"
    } else if (window.location.pathname.indexOf("policies") != -1) {
        $(".nav.navbar-nav li.policies").addClass("active")
        policiesPage.init()
    } else if ($("div.ld-timetable").length > 0) {
        timetablePage.init()
        $(".nav.navbar-nav li.timetable").addClass("active")
    } else if ($("div.ld-homework").length > 0) {
        homeworkPage.init()
        $(".nav.navbar-nav li.homework").addClass("active")
        try {
            sessionStorage.location += "homework"
            if ($("div.ld-homework .btn.return").length > 0) {
                if (!sessionStorage.exitRoute) {
                    sessionStorage.exitRoute = document.referrer
                }
            } else {
                sessionStorage.exitRoute = ""
            }
        } catch (error) {}
    } else if ($("div.ld-classes").length > 0) {
        classesPage.init()
        $(".nav.navbar-nav li.classes").addClass("active")
        try {
            sessionStorage.location = "classes"
            sessionStorage.exitRoute = ""
        } catch (error) {}
    } else if ($("div.ld-resources").length > 0) {
        resourcesPage.init()
        $(".nav.navbar-nav li.resources").addClass("active")
    } else if ($("div.ld-school-info").length > 0) {
        schoolInfoPage.init()
    }
    $(".alert").alert();
    try {
        var view = null
        if ($('div.ld-resources').length > 0 && sessionStorage.getItem("resource-view")) {
            view = sessionStorage.getItem("resource-view")
        } else if ($('div.ld-resources').length == 0 && sessionStorage.getItem("homework-view")) {
            view = sessionStorage.getItem("homework-view")
        }
        if (view) {
            $('.view-grid-list button').removeClass('hidden')
            $('.view-grid-list button.' + view).addClass('hidden')
            $('.view-manager').removeClass('grid list').addClass(view)
            $('.homework-description').dotdotdot({watch: true})
        } else {
            $('.view-manager').addClass('grid')
            $('.homework-description').dotdotdot({watch: true})
        }
        if (sessionStorage.getItem('classes-view')) {
            $('.ld-classes .nav a[data-toggle="'+ sessionStorage.getItem('classes-view') +'"]').click()
            sessionStorage.removeItem('classes-view')
        }
    } catch (error) {}
    validationEvents()
});



// Tooltip
if ("ontouchstart" in document.documentElement) {
  $("[data-toggle='tooltip']").removeAttr("data-toggle")
}
else {
  $('[data-toggle="tooltip"]').tooltip()
}

// Tooltip Summernote
function removeDataTitle(){
  if ("ontouchstart" in document.documentElement) {
    $('[data-original-title]').removeAttr("data-original-title");
  }
}

// Tooltip Resource
function resourceTooltip() {
  if ("ontouchstart" in document.documentElement) {
    $('[data-toggle="tooltip"]').removeAttr("data-toggle")
  }
  else {
    $('[data-toggle="tooltip"]').tooltip()
  }
}
function resourceTooltipFooter() {
  if ("ontouchstart" in document.documentElement) {
    $('[data-toggle="tooltip"]').removeAttr("data-toggle")
  }
  else {
    $('[data-toggle="tooltip"]').tooltip({
      placement: "auto right"
    })
  }
}




$('.homework-description').dotdotdot({watch: true});
$('.homework-title, .ld-card.students .subject').dotdotdot({ellipsis	: ' '});
$('.homework-text').dotdotdot();





function updateFormDate(date, datePicker){
    var element = datePicker.input
    element.parent().find("input[type='hidden']").val(date)
    var ele = element.parent().find("input[type='hidden']")
    formatDate(element[0])
}

// var urlBase = window.location.protocol + "//" + window.location.host
// urlBase += $('input[type="hidden"][name="baseUrl"]').val() || ""
// $("input[type=file]:not([class='hidden'])").uniform();
var urlBase = "http://localhost:7002/schoolbag/";

function init() {
    $(".format-date").each(function(index, element) {
        formatDate(element)
    })
    $(".ld-date-month").each(function(index, element) {
        var text = element.textContent.trim()
        if (text == "") {
            return
        } else {
            element.textContent = textToMonth(text)
        }
    })
    $(".format-date-range").each(function(index, element) {
        formatDateRange(element)
    })
    //sign in to remote connections
}
function formatDate(element) {
    var text = element.textContent.trim()
    var valType = "textContent"
    if (element.tagName.toLowerCase() == "input") {
        text = element.value
        valType = "value"
    }
    if (text == "") {
        return
    }
    switch (element.getAttribute("data-date-special")) {
        case("week-begins"):
            if (moment(text).week() == moment().week()) {
                element.textContent = "This Week"
            } else {
                element.textContent = "Week of " + moment(text).format("dddd, Do MMM")
            }
            break
        case("relative-time"):
            var relative = textToRelativeTime(text)
            element[valType] = relative.time
            if (relative.status) {
                element.classList.add(relative.status)
            }
            break
        default:
             element[valType] = textToTime(text)
            break
    }
}
function textToMonth(text) {
    if (moment(text).isSame(new Date(), 'year')) {
        return moment(text).format("MMMM")
    } else {
       return moment(text).format("MMMM YYYY")
    }
}
function textToTime(text) {
    if (moment(text).isSame(new Date(), 'year')) {
        return moment(text).format("dddd, Do MMM")
    } else {
       return moment(text).format("dddd, Do MMM YYYY")
    }
}
function textToRelativeTime(text) {
    var timezone = $('input[name="session_timezone"]').val() || 'GMT'
    moment(text).tz(timezone)
    var status = ""
    var timeStr = "Due " + moment(text).endOf('day').fromNow()
    if (text == moment().format('YYYY-MM-DD')) {
        timeStr = "Due Today"
        if (moment().hours() > 16) {
            status = "overdue"
        }
    } else if (text == moment(moment().add('days', 1)).format("YYYY-MM-DD")) {
        timeStr = "Due Tomorrow"
    } else if (text == moment(moment().add('days', -1)).format("YYYY-MM-DD")) {
        timeStr = "Due Yesterday";
        status = "overdue"
    } else {
        if (moment(text).isBefore(moment())) {
            status = "overdue"
        }
    }
    return {time: timeStr, status: status}
}
function formatDateRange(element) {
    var start = moment(element.getAttribute("data-start"))
    var end = moment(element.getAttribute("data-end"))
    switch (element.getAttribute("data-date-special")) {
        case("inc-time"):
            if (start.isSame(end, 'day')) {
                element.textContent = start.format('hh:mma') + " - " + end.format('hh:mma, dddd Do MMM')
            } else if (start.isSame(end, 'month')) {
                element.textContent = start.format('hh:mma ddd Do') + " - " + end.format('hh:mma ddd Do, MMM')
            } else {
                element.textContent = start.format('hh:mma ddd Do MMM') + " - " + end.format('hh:mma ddd Do MMM')
            }
            break
        default:
            if (moment(start).isSame(end, 'day')) {
                element.textContent = start.format('dddd, Do MMM')
            } else if (moment(start).isSame(end, 'month')) {
                element.textContent = moment(start).format("ddd Do") + "-" + moment(end).format("ddd Do, MMM")
            } else {
                element.textContent = moment(start).format("Do MMM YYYY") + "-" + moment(end).format("Do MMM YYYY")
            }
    }
}

function getUser() {
    var body = $("body")
    if (body.hasClass("teacher")) {
        return "teacher"
    } else if (body.hasClass("student")) {
        return "student"
    } else if (body.hasClass("school")) {
        return "school"
    } else if (body.hasClass("administrator")) {
        return "administrator"
    }
    return ""
}

function enableDatePicker(id) {
    $(id).removeAttr("disabled")
    validationEvents()
}

function populeStudentsAndDays(classId) {
    getEnableDays(classId);
    if ($("[name='student']").length > 0) {
        $("[name='student']").remove();
    }

    var url = urlBase + "service/getStudents/" + classId.value;
    $.get(url, function(response) {
        var students = response.students;
        for (var i = students.length - 1; i >= 0; i--) {
            var student = students[i];
            var input = "<p name='student'><input  type='checkbox' name='students[]' value='" + student.id + "'>" + student.name + "</p>";
            $("#students").append(input);
        };
    });

}

function getEnableDays(classId) {
    var url = urlBase + "service/daysByClass/" + classId.value;
    $.get(url, function(response) {
        $("#week-days")[0].value = response.weekDays;
        $("#class-id")[0].value = classId.value;
    });

    if ($("[name='pdue-time']").length > 0) {
        $("[name='pdue-time']").remove();
    }
    enableDatePicker("#visible-due-date")
}

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function dayOfWeek(date) {
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[date.getUTCDay()]
}

function hiddenRadioElements() {
    $(":radio").each(function(index, element) {
        element.hidden = true;
    });
}

function setUpEvents() {
    //button events
    $(".btn.btn-cancel").click(function(a) {
        try {
            if (sessionStorage.exitRoute) {
                window.location.href = sessionStorage.exitRoute
            } else {
                window.location.href = document.referrer
            }
        } catch (error) {window.history.back()}
    })
    // validate forms
    $(".btn:submit, button.submit").on("click", function(event) {
        event.preventDefault()
        var form = $(this).closest("form")
        if (validation.validateForm(form) == true && validForm(form)) {
            form.submit()
        }
    })
    //general collapse event
    $('.collapse-toggle').on("click", ldCollapseFunction)
    //alerts
    window.setTimeout(function() {
        $(".alert-warning").fadeTo(500, 0).slideUp(500, function() {
            $(this).remove();
        });
    }, 5000);
    if ($(".ld-tree, .ld-check-parent").length > 0)
        setTreeEvents()
}

function ldCollapseFunction(event) {
    var mainEvent = event
    var element = event.currentTarget
    var target = element.getAttribute("data-target")

    var iconTarget = element.getAttribute("data-icon")
    if (iconTarget == null) {
        iconTarget = element
    }
    $(target).off('hide.bs.collapse')
    $(target).on('hide.bs.collapse', function(){
        $(iconTarget).toggleClass('collapse-icon-open')
        $(iconTarget).toggleClass('collapse-icon-close')
        $(element.getAttribute("data-extra-target")).toggleClass('hidden')
        ldResourseCount(mainEvent)
    })
    $(target).off('show.bs.collapse')
    $(target).on('show.bs.collapse', function(){
        $(iconTarget).toggleClass('collapse-icon-open')
        $(iconTarget).toggleClass('collapse-icon-close')
        $(element.getAttribute("data-extra-target")).toggleClass('hidden')
        ldResourseCount(mainEvent)
    })
    $(target).collapse('toggle')
}

/****************************************
 translate //First attempt at translating js
 ******************************************/
function _t(str) {
    return translate[str]
}
/****************************************
 UI Events
 ******************************************/
function setTreeEvents() {
    var checkUpwards = function(source) {
        var all = 0, checkCount = 0
        $(source.data().child).each(function() {
            all++
            if (this.checked) {
                checkCount++
            }
        })
        if (checkCount == 0) {
            source.prop('checked', "")
            source.prop('indeterminate', "false")
        } else if (checkCount == all) {
            source.prop('checked', "checked")
            source.prop('indeterminate', "false")
        } else {
            source.prop('checked', "")
            source.prop('indeterminate', "true")
        }
        $.uniform.update(source)
        if (source.data().source)
            checkUpwards($(source.data().source))
    }
    //set child node when change parent
    $(".ld-tree .parent-node, .ld-check-parent").change(function(event) {
        $(event.currentTarget.getAttribute('data-child')).each(function() {
            this.checked = (event.target.checked) ? "checked" : ""
            $.uniform.update($(event.target).data().child)
            $(this).change()
        })
        //may use button at top & buttom of tree check upwards will update both
        checkUpwards($($(event.currentTarget.getAttribute('data-child')).data().parent))
    })
    //set state of parent when click on child
    $(".ld-tree .child-node, .ld-check-child").click(function(event) {
        checkUpwards($($(event.target).data().parent))
    })
}
//misc functions
function getFileIcon(file) {
    if (file.type.indexOf('pdf') != -1) {
        return 'fa fa-file-pdf-o'
    } else {
        return 'fa fa-file'
    }
}
/********************************************
    Tab Navigation
************************************************/
$(".ld-tabs.nav a").on("click", switchTab)
$( ".info-title a" ).on( "click", function() {
    $('.ld-tabs.nav li').removeClass('active')
});
function switchTab(event){
    var navElement = $($(event.currentTarget).closest('.nav'))
    navElement.find('li a').removeClass('active')
    event.preventDefault();
    $(event.currentTarget).tab("show")
    navElement.find('.info-title').removeClass('hide')
}

//validation
var validForm = function(form) {
    var valid = validation.validateForm(form)
    if (valid != true) {
        return valid
    }
    $(form).find("input:not(:checkbox):not(:radio)").each(function(index, element) {
        //old validation -- to remove
        if (!isValid(element))
            valid = false
    })
    if ($(form).find('input:checkbox').length > 0) {
        if (!isValidCheckbox(form))
            valid = false
    }
    if ($(form).find("input:radio").length > 0) {
        if (!isValidRadio(form))
            valid = false
    }
    $(form).find("textarea").each(function(index, element) {
        if (!isValid(element))
            valid = false
    })
    $(form).find("select").each(function(index, element) {
        if (!isValid(element))
            valid = false
    })
    return valid
}
function isValid(element) {
    var required = element.getAttribute("data-required-key")
    if (required == "true" && element.value.trim() == "") {
        $(element.getAttribute("data-validation-target")).addClass('error error-old')
        return false
    } else {
        $(element.getAttribute("data-validation-target")).removeClass('error error-old')
    }
    if (required == "date" && !moment(element.value, "YYYY-MM-DD", true).isValid()) {
        $(element.getAttribute("data-validation-target")).addClass('error error-old')
        return false
    } else {
        $(element.getAttribute("data-validation-target")).removeClass('error error-old')
    }
    if (required == "time" && !moment(element.value, "h:mma", true).isValid()) {
        $(element.getAttribute("data-validation-target")).addClass('error error-old')
        return false
    } else {
        $(element.getAttribute("data-validation-target")).removeClass('error error-old')
    }
    var preDate = element.getAttribute("data-date-after")
    if (preDate != null) {
        if (!moment(preDate).isValid())
            preDate = $(element.getAttribute("data-date-after")).val()
        if (moment(element.value) < moment(preDate)) {
            $(element.getAttribute("data-validation-target")).addClass('error error-old')
            return false
        } else {
            $(element.getAttribute("data-validation-target")).removeClass('error error-old')
        }
    }

    var isBeforeDate = element.getAttribute("data-valid-dat-before")
    if (required == "true" && element.value.trim() == "") {
        $(element.getAttribute("data-validation-target")).addClass('error error-old')
        return false
    } else {
        $(element.getAttribute("data-validation-target")).removeClass('error error-old')
    }
    return true
}

var isValidCheckbox = function(parent) {
    var element = $(parent).find("input:checkbox")[0]
    if (element) {
        var required = element.getAttribute('data-validation')
        if (required == 'one') {
            var count = $(parent).find("input:checkbox:checked").length
            if (count == 0) {
                $(element).closest('.validation-box').addClass('error one')
                return false
            }
        }
    }
    $(parent).closest('.validation-box').removeClass('error one')
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
    var required = element.getAttribute('data-validation')
    var valid = true
    if (required == 'required' && element.value.trim() == "" ||
        required == "date" && !moment(element.value, "YYYY-MM-DD", true).isValid()
        ) {
        valid = false
    }
    if (!valid) {
        $(element).closest('.validation-box').addClass('error')
        return false
    } else {
        $(element).closest('.validation-box').removeClass('error')
        return true
    }
}

function validateOnBlur(event) {
    if (!validation.validateElement(event.currentTarget)) {
        $("input").keyup(function(event) {
            validation.validateElement(event.currentTarget)
        })
    }
}

var validationEvents = function() {
    $("input").off("blur", validateOnBlur)
    $("input:not('.hasDatepicker'):not('.ui-timepicker-input'):not([type='file']), form textarea").on("blur", validateOnBlur)
    $("input.ui-timepicker-input").change(function(event) {
        isValid(event.target)
    })
}
function getResourceFileType(contentType) {
    var type = contentType.split("/")
    if (type[0] == "image") {
        return type[0]
    }
    return type[0]
}
//confirm delete
function createRemoveItemDialog(message, deleteUrl, parentClass, ajaxFunction) {
    $('#removeItemModal').remove()
    var modal = $('<div class="modal fade" id="removeItemModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">')
    var modalHeader = $('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h2 class="modal-title">Delete Item</h2></div>')
    var modalBody = $('<div class="modal-body"><p>' + message + ' This action cannot be undone.</p></div>')
    //buttons
    var send = $('<a href="' + deleteUrl + '" class="btn">Yes</a>')
    if (ajaxFunction) {
        send = $('<span class="btn">Yes</span>')
        send.on('click', function(event) {
            $.post(deleteUrl, function(result) {
                ajaxFunction(result)
            })
        })
    }
    var cancel = $('<button class="btn btn-dismiss" data-dismiss="modal">Cancel</button>')
    var modalFooter = $('<div class="modal-footer"></div>')
    modalFooter.append(send)
    modalFooter.append(cancel)

    var modalDialog = $('<div class="modal-dialog"></div>')

    var modalContent = $('<div class="modal-classes modal-content"></div>')
    modalContent.append(modalHeader)
    modalContent.append(modalBody)
    modalContent.append(modalFooter)

    modalContent.appendTo(modalDialog)
    modalDialog.appendTo(modal)
    modal.appendTo(parentClass)
}
//old remove function //TODO::replace
function removeItemDialog(message, deleteUrl, parentClass, noRedirect) {
    var modal = $('<div class="modal fade" id="removeItemModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">')
    var modalHeader = $('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h2 class="modal-title">Delete Item</h2></div>')
    var modalBody = $('<div class="modal-body"><p>' + message + ' This action cannot be undone.</p></div>')
    //buttons
    var send = $('<a href="' + deleteUrl + '" class="btn">Yes</a>')
    if (noRedirect) {
        send = $('<span class="btn">Yes</span>')
        send.on('click', function(event) {
            event.stopPropagation();
            event.preventDefault();
            $.get(deleteUrl, function(result) {
                window.location.reload()
            })
        })
    }

    var cancel = $('<button class="btn btn-dismiss" data-dismiss="modal">Cancel</button>')
    var modalFooter = $('<div class="modal-footer"></div>')
    modalFooter.append(send)
    modalFooter.append(cancel)

    var modalDialog = $('<div class="modal-dialog"></div>')

    var modalContent = $('<div class="modal-classes modal-content"></div>')
    modalContent.append(modalHeader)
    modalContent.append(modalBody)
    modalContent.append(modalFooter)

    modalContent.appendTo(modalDialog)
    modalDialog.appendTo(modal)
    modal.appendTo(parentClass)
}

function ajaxPost(url, data, successCallback, errorCallback) {
    $.ajax({
        url : url,
        type : 'POST',
        data : data,
        cache : false,
        dataType : 'json',
        processData : false,
        contentType : false,
        success : successCallback,
        error : errorCallback
    })
}

function ldResourseCount(event) {
    var topicBlock = $(event.currentTarget)
    if (topicBlock.hasClass('topicLn-header')) {
        topicBlock.find('.fa-pencil, .fa-trash, .fa-chain-broken').toggleClass('hidden')
    }
    topicBlock.find('.new').toggleClass('hidden')
    topicBlock.find('.resource-count').toggleClass('hidden')
}

//windows phone / fixed bug
if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
    var msViewportStyle = document.createElement("style");
    msViewportStyle.appendChild(document.createTextNode("@-ms-viewport{width:auto!important}"));
    document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
}
/***********************************************
        Resource Importer
************************************************/
$('.modal').on('shown.bs.modal', function() {
  setTimeout(function() {
    $(this).find('input:first').focus();
  },0)
});

$('#openAddResourceModal, .openAddResourceModal').on('click', openAddResourceModal)
function openAddResourceModal() {
    //reset paused events
    $('#resourceImportModal .ld-tabs.nav a').off("click", switchTab)
    $('#resourceImportModal .ld-tabs.nav a:not(.inactive)').on("click", switchTab)

    $('#resourceImportModal textarea[name="text-input"]').off('paste').on('paste', resourceFunctions.embed)
    //reset fields
    if ($('#resourceImportModal .fileInput').attr('type') !== 'button') {
        $.uniform.restore($('#resourceImportModal .fileInput'))
        $('#resourceImportModal .fileInput').replaceWith($('#resourceImportModal .fileInput').clone(true))
        $('#resourceImportModal .fileInput').uniform()
    }
    $('#resourceImportModal .validation-box').removeClass('error one type required custom')
    $('#resourceImportModal #resources input[type="checkbox"]:checked').removeAttr("checked")
    $('#resourceImportModal textarea').val("")
    $('#resourceImportModal input[name="input-type"][value="upload"]').prop('checked', 'true')
    $.uniform.update('#resourceImportModal input[name="input-type"]')
    $('#resourceImportModal').addClass('upload').removeClass('text')
    //reset views
    $('#resourceImportModal .nav a[data-toggle="upload"]').click()
    $('#resourceImportModal #upload .contents').removeClass('hidden')
    $('#resourceImportModal #upload .loading').addClass('hidden')
    $('#resourceImportModal .remote .contents').removeClass('hidden')
    $('#resourceImportModal .remote .loading').addClass('hidden')
    $('#resourceImportModal button.close').removeClass('hidden')
    $('#resourceImportModal .error').addClass('hidden')
    $('#resourceImportModal .embeded').empty()
    $('#resourceImportModal').removeClass('embed')
    $('#resourceImportModal').modal('show')
    if ($('#addResourceModal').length == 1) {

        $('#addResourceModal input[name="title"]').val(''),

        $('#addResourceModal textarea[name="description"]').val(''),
        $('#addResourceModal input[name="topic-tags"]').val(''),
        $('#addResourceModal input[name="type-tags"]').val('')
        $('#addResourceModal input[name="level-tags"]').val('')
        $('#addResourceModal input[name="topic-id"]').val('')
        $('iframe').css('visibility', 'hidden')
    }

}
/* File Browser common events */
$('#resourceImportModal .btn-upload-resource').on('click',function(event) {
    $('#resourceImportModal').addClass('upload')
    $('#resourceImportModal').removeClass('text')
    $('#resourceImportModal #upload input[type="file"]').attr('data-validation', 'required')
    $('#resourceImportModal #upload textarea[name="text-input"]').attr('data-validation', '')

})
$('#resourceImportModal .btn-text-resource').on('click',function(event) {
    $('#resourceImportModal').addClass('text')
    $('#resourceImportModal').removeClass('upload')
    $('#resourceImportModal #upload textarea[name="text-input"]').off('blur', validateOnBlur)
    $('#resourceImportModal #upload textarea[name="text-input"]').attr('data-validation', 'required')
    $('#resourceImportModal #upload input[type="file"]').attr('data-validation', '')
})
$('#resourceImportModal .nav a[data-toggle="resources"]').on('click', loadResourceImporterResources)

$('#resourceImportModal .nav a[data-toggle="onedrive"]').on('click', function (event) {
    $('#onedrive .contents .remote-browser .ld-card').remove()
    $('#onedrive .contents .remote-browser .no-content').removeClass('hidden')
})
$('#resourceImportModal .nav a[data-toggle="googledrive"]').on('click', function (event) {
    $('#googledrive .contents .remote-browser .ld-card').remove()
    $('#googledrive .contents .remote-browser .no-content').removeClass('hidden')
})

$('#resourceImportModal #resources input[name="existing"]').on('change', function (event) {
    $('#resourceImportModal #resources .contents input[type="checkbox"]:checked').removeAttr("checked")
    loadResourceImporterResources(event)
})
function loadResourceImporterResources(event) {
    var searchArr, contentElement
    if ($('input[name="type"]').val() == "image") {
        searchArr = ['and/search?metadata.clientId=' +  $('input[type="hidden"][name="client-id"]').val() +
          '&limit=50&metadata.type=image&metadata.owner=' + $('input[name="owner"]').val()]
        contentElement = $('#resourceImportModal #resources .contents .mine')
        $('#resourceImportModal').removeClass('subject').addClass('mine')
    }
    else if ($('input[name="existing"]:checked').val() == "mine") {
        searchArr = ['and/search?metadata.clientId=' +  $('input[type="hidden"][name="client-id"]').val() +
          '&limit=50&contentType=binary/octet-stream&metadata.owner=' + $('input[name="owner"]').val()]
        contentElement = $('#resourceImportModal #resources .contents .mine')
        $('#resourceImportModal').removeClass('subject').addClass('mine')
    }

     else {
        searchArr = [
            'and/search?metadata.subject=' + encodeURIComponent($('.hidden input[name="subject"]').val()) + '&limit=50&contentType=binary/octet-stream&metadata.owner=' + $('input[name="owner"]').val() + '&metadata.clientId=' +  $('input[type="hidden"][name="client-id"]').val(),
            'and/search?metadata.subject=' + encodeURIComponent($('.hidden input[name="subject"]').val()) + '&limit=50&contentType=binary/octet-stream&metadata.clientId=' + $('input[type="hidden"][name="client-id"]').val() + '&metadata.visibility=1',
            'and/search?metadata.subject=' + encodeURIComponent($('.hidden input[name="subject"]').val()) + '&limit=50&contentType=binary/octet-stream&metadata.visibility=2' + '&metadata.curriculum=' + ($('input[type="hidden"][name="curriculum"]').val() || 'Irish Secondary')
        ]
        contentElement = $('#resourceImportModal #resources .contents .subject')
        $('#resourceImportModal').removeClass('mine').addClass('subject')
    }

    if (contentElement.find('.load-success').children().length == 0) {
        fetchResourceBagResources(searchArr, 0, contentElement)
    }
}
function fetchResourceBagResources(searchArr, n, contentElement) {
    if (n < searchArr.length) {
        resourceFunctions.fetchResources(searchArr[n],
        function (response) {
            for (var i = 0; i < response.items.length; i++) {
                var resource = response.items[i]
                if (!response.items[i].metadata.creator ||
                    contentElement.find('input[type="checkbox"][value="' + resource._id + '"]').length > 0) {
                    continue
                }
                var resourceCard = resourceFunctions.getResourceCard(resource)
                resourceCard.removeClass(function (index, css) {
                    return (css.match(/col-(xs|sm|md|lg)-\d+/g) || []).join(' ')
                })
                resourceCard.addClass('col-xs-6 col-sm-4')
                var input = $('<input type="checkbox" value="' + resource._id +'" data-title="' + resource.metadata.title  +'">')
                resourceCard.find('.preview').append('<div class="ld-checkbox"><input type="checkbox" value="' + resource._id +'" data-title="' + resource.metadata.title  +'"><span class="display"></span></div>')
                contentElement.find('.load-success').append(resourceCard)
            }
            fetchResourceBagResources(searchArr, n+1, contentElement)
        }, function(request, status, error){
            contentElement.find('.error').removeClass('hidden')
            contentElement.find('.loading').addClass('hidden')
        })
    } else {
        contentElement.find('.loading').addClass('hidden')
        if (contentElement.find('input[type="checkbox"]').length == 0) {
            contentElement.find('.load-empty').removeClass('hidden')
        } else {
            contentElement.find('.load-success').removeClass('hidden')
        }
        $('#resourceImportModal #resources .ld-checkbox input[type="checkbox"]').on('change', function(event) {
            $('#resourceImportModal #resources .validation-box').removeClass("error required one custom")
            if ($('#resourceImportModal').hasClass('single')) {
                var current = event.currentTarget
                if (current.checked) {
                    $('#resourceImportModal  #resources .ld-checkbox input[type="checkbox"]:checked').removeAttr("checked")
                    $(current).prop("checked", "checked")
                }
            }
        })
    }
}


/* External Protocol Handler */
//ActiveX is for IE, plugin is for Firefox/Chrome is  'Microsoft Office 2010'
var extenalProtocolList = {
    'OneNote': {'activeX': 'OneNote.Application', 'plugin': 'application/x-sharepoint'}
}
function extenalProtocol(protocol, href, fallbackHref) {
    function openProtocol(href, fallbackHref) {
        var iframe = $('<iframe>');
        try {
            $('body').append(iframe);
            iframe[0].contentWindow.location.href = href
        } catch(e) {
            iframe.remove()
            window.open(fallbackHref, '_blank')
        }
    }
    function checkPlugins(href, fallbackHref) {
        navigator.plugins.refresh(true)
        if (navigator.mimeTypes[extenalProtocolList[protocol].plugin]) {
            openProtocol(href, fallbackHref)
        } else {
            window.open(fallbackHref, '_blank')
        }
    }
    if (navigator.msLaunchUri) {
        navigator.msLaunchUri(href)
    }
    else {
        try { //IE WIN8+
            var useActiveX = new ActiveXObject(extenalProtocolList[protocol].activeX)
            openProtocol(href, fallbackHref)
        } catch(error) { //other browsers
           checkPlugins(href, fallbackHref)
        }
    }
}
// JqueryUI datepicker timezone overwrite
var useTimezones = function(datepicker, timezone) {
    datepicker._generateHTML = function(e){var t,i,s,n,a,o,r,h,l,u,d,c,p,f,m,g,v,_,y,b,x,k,w,D,T,M,S,C,N,I,A,P,H,z,F,E,O,j,W,R=moment().tz(timezone)._d,L=this._daylightSavingAdjust(new Date(R.getFullYear(),R.getMonth(),R.getDate())),Y=this._get(e,"isRTL"),B=this._get(e,"showButtonPanel"),J=this._get(e,"hideIfNoPrevNext"),K=this._get(e,"navigationAsDateFormat"),q=this._getNumberOfMonths(e),V=this._get(e,"showCurrentAtPos"),U=this._get(e,"stepMonths"),Q=1!==q[0]||1!==q[1],G=this._daylightSavingAdjust(e.currentDay?new Date(e.currentYear,e.currentMonth,e.currentDay):new Date(9999,9,9)),X=this._getMinMaxDate(e,"min"),$=this._getMinMaxDate(e,"max"),Z=e.drawMonth-V,et=e.drawYear;if(0>Z&&(Z+=12,et--),$)for(t=this._daylightSavingAdjust(new Date($.getFullYear(),$.getMonth()-q[0]*q[1]+1,$.getDate())),t=X&&X>t?X:t;this._daylightSavingAdjust(new Date(et,Z,1))>t;)Z--,0>Z&&(Z=11,et--);for(e.drawMonth=Z,e.drawYear=et,i=this._get(e,"prevText"),i=K?this.formatDate(i,this._daylightSavingAdjust(new Date(et,Z-U,1)),this._getFormatConfig(e)):i,s=this._canAdjustMonth(e,-1,et,Z)?"<a class='ui-datepicker-prev ui-corner-all' data-handler='prev' data-event='click' title='"+i+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"e":"w")+"'>"+i+"</span></a>":J?"":"<a class='ui-datepicker-prev ui-corner-all ui-state-disabled' title='"+i+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"e":"w")+"'>"+i+"</span></a>",n=this._get(e,"nextText"),n=K?this.formatDate(n,this._daylightSavingAdjust(new Date(et,Z+U,1)),this._getFormatConfig(e)):n,a=this._canAdjustMonth(e,1,et,Z)?"<a class='ui-datepicker-next ui-corner-all' data-handler='next' data-event='click' title='"+n+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"w":"e")+"'>"+n+"</span></a>":J?"":"<a class='ui-datepicker-next ui-corner-all ui-state-disabled' title='"+n+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"w":"e")+"'>"+n+"</span></a>",o=this._get(e,"currentText"),r=this._get(e,"gotoCurrent")&&e.currentDay?G:L,o=K?this.formatDate(o,r,this._getFormatConfig(e)):o,h=e.inline?"":"<button type='button' class='ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all' data-handler='hide' data-event='click'>"+this._get(e,"closeText")+"</button>",l=B?"<div class='ui-datepicker-buttonpane ui-widget-content'>"+(Y?h:"")+(this._isInRange(e,r)?"<button type='button' class='ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all' data-handler='today' data-event='click'>"+o+"</button>":"")+(Y?"":h)+"</div>":"",u=parseInt(this._get(e,"firstDay"),10),u=isNaN(u)?0:u,d=this._get(e,"showWeek"),c=this._get(e,"dayNames"),p=this._get(e,"dayNamesMin"),f=this._get(e,"monthNames"),m=this._get(e,"monthNamesShort"),g=this._get(e,"beforeShowDay"),v=this._get(e,"showOtherMonths"),_=this._get(e,"selectOtherMonths"),y=this._getDefaultDate(e),b="",k=0;q[0]>k;k++){for(w="",this.maxRows=4,D=0;q[1]>D;D++){if(T=this._daylightSavingAdjust(new Date(et,Z,e.selectedDay)),M=" ui-corner-all",S="",Q){if(S+="<div class='ui-datepicker-group",q[1]>1)switch(D){case 0:S+=" ui-datepicker-group-first",M=" ui-corner-"+(Y?"right":"left");break;case q[1]-1:S+=" ui-datepicker-group-last",M=" ui-corner-"+(Y?"left":"right");break;default:S+=" ui-datepicker-group-middle",M=""}S+="'>"}for(S+="<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix"+M+"'>"+(/all|left/.test(M)&&0===k?Y?a:s:"")+(/all|right/.test(M)&&0===k?Y?s:a:"")+this._generateMonthYearHeader(e,Z,et,X,$,k>0||D>0,f,m)+"</div><table class='ui-datepicker-calendar'><thead>"+"<tr>",C=d?"<th class='ui-datepicker-week-col'>"+this._get(e,"weekHeader")+"</th>":"",x=0;7>x;x++)N=(x+u)%7,C+="<th"+((x+u+6)%7>=5?" class='ui-datepicker-week-end'":"")+">"+"<span title='"+c[N]+"'>"+p[N]+"</span></th>";for(S+=C+"</tr></thead><tbody>",I=this._getDaysInMonth(et,Z),et===e.selectedYear&&Z===e.selectedMonth&&(e.selectedDay=Math.min(e.selectedDay,I)),A=(this._getFirstDayOfMonth(et,Z)-u+7)%7,P=Math.ceil((A+I)/7),H=Q?this.maxRows>P?this.maxRows:P:P,this.maxRows=H,z=this._daylightSavingAdjust(new Date(et,Z,1-A)),F=0;H>F;F++){for(S+="<tr>",E=d?"<td class='ui-datepicker-week-col'>"+this._get(e,"calculateWeek")(z)+"</td>":"",x=0;7>x;x++)O=g?g.apply(e.input?e.input[0]:null,[z]):[!0,""],j=z.getMonth()!==Z,W=j&&!_||!O[0]||X&&X>z||$&&z>$,E+="<td class='"+((x+u+6)%7>=5?" ui-datepicker-week-end":"")+(j?" ui-datepicker-other-month":"")+(z.getTime()===T.getTime()&&Z===e.selectedMonth&&e._keyEvent||y.getTime()===z.getTime()&&y.getTime()===T.getTime()?" "+this._dayOverClass:"")+(W?" "+this._unselectableClass+" ui-state-disabled":"")+(j&&!v?"":" "+O[1]+(z.getTime()===G.getTime()?" "+this._currentClass:"")+(z.getTime()===L.getTime()?" ui-datepicker-today":""))+"'"+(j&&!v||!O[2]?"":" title='"+O[2].replace(/'/g,"&#39;")+"'")+(W?"":" data-handler='selectDay' data-event='click' data-month='"+z.getMonth()+"' data-year='"+z.getFullYear()+"'")+">"+(j&&!v?"&#xa0;":W?"<span class='ui-state-default'>"+z.getDate()+"</span>":"<a class='ui-state-default"+(z.getTime()===L.getTime()?" ui-state-highlight":"")+(z.getTime()===G.getTime()?" ui-state-active":"")+(j?" ui-priority-secondary":"")+"' href='#'>"+z.getDate()+"</a>")+"</td>",z.setDate(z.getDate()+1),z=this._daylightSavingAdjust(z);S+=E+"</tr>"}Z++,Z>11&&(Z=0,et++),S+="</tbody></table>"+(Q?"</div>"+(q[0]>0&&D===q[1]-1?"<div class='ui-datepicker-row-break'></div>":""):""),w+=S}b+=w}return b+=l,e._keyEvent=!1,b}
}

// Scroll Preview
function scrollTriggerEvent(event) {
    event.preventDefault();
    $('html,body').animate({scrollTop:$(this.hash).offset().top - $('header').outerHeight()}, 500);
}

// Detect if is IOS
if(window.navigator.userAgent.match( /iP(hone|od|ad)/)){
    // Hidden upload icons on IOS
    $(".detect-IOS").addClass("hidden");
}

//Homework (show) Student View
$(function() {
  var $readmore = $('.readmore');
  function createDots(){
    $readmore.dotdotdot({
      after: 'a.toggle'
    });
  }
  function destroyDots() {
    $readmore.trigger( 'destroy' );
  }
  createDots();
  if ($('.readmore:contains("...")').length > 0) {
    $readmore.append( ' <a class="toggle" href="#"><span class="readopen">[ + ]</span><span class="readclose">[ - ]</span></a>' );
  }
  $readmore.on(
    'click',
    'a.toggle',
    function() {
      $readmore.toggleClass( 'opened' );
      if ( $readmore.hasClass( 'opened' ) ) {
        destroyDots();
        $readmore.find("a.toggle").remove( ' <a class="toggle" href="#"><span class="readopen">[ + ]</span><span class="readclose">[ - ]</span></a>' );
        $readmore.append( ' <a class="toggle" href="#"><span class="readopen">[ + ]</span><span class="readclose">[ - ]</span></a>' );
      } else {
        createDots();
      }
      return false;
    }
  );
});
