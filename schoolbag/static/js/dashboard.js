var dashboard = (function() {
    //dashboard properties
    var numPanels = 5
    var timezone = $('input[name="session_timezone"]').val() || 'GMT'
    var displayDate = moment().tz(timezone)._d
    var timetable
    var classList

    function init() {
        $('.dashboard-head').on('click', function(event) {
            if ($( event.target ).closest('.ui-datepicker-calendar').length >0) {
                return
            }

            window.location.href = urlBase + getUser() + '/' +
                event.currentTarget.getAttribute("data-panel-type")
        })
        $.get(urlBase + "service/classes", function(response) {
            classList = response.classes
            populatePanels()
        })
    }

    function populatePanels() {
        numPanels = $(".ld-box").length
        switch (numPanels) {
            case 1:
                $('.ld-box').addClass('one-panel')
            break
            case 2:
                $('.ld-box').addClass('two-panels')
            break
            case 3:
                $('.ld-box').addClass('three-panels')
            break
            case 4:
                $('.ld-box').addClass('four-panels')
            break
            default:
                $('.ld-box').addClass('five-panels')
            break
        }
        if ($('#dashboard-timetable-box').length != 0) {
            populateTimetable(displayDate)
        }
        if ($('#dashboard-homework-box').length != 0) {
            populateHomework()
        }
        if ($('#dashboard-notices-box').length != 0) {
            populateNotices()
        }
        if ($('#dashboard-events-box').length != 0) {
            populateEvents()
        }
        if ($('#dashboard-messages-box').length != 0) {
            populateMessages()
        }
        $('.main-content .dashboard').addClass('topmargin')

        $('.ld-box').removeClass('hidden')
    }

    function populateTimetable(date) {
        var header = $('#dashboard-timetable-contents .header-navigation h3')
        header.empty()
        header.append(moment(date).format('dddd Do'))
        var url = urlBase + 'service/timetable/?date='+ moment(date).format('YYYY-MM-DD') //TODO add dates
        $.get(url, function(response) {
            var day = date.getDay()
            if (response.week.length == 0) {//timetable not set
                $('#dashboard-timetable-contents .no-timetable').removeClass('hidden')
                return
            }
            data = response.week[day]
            if ( timetable) {
                timetable.remove()
            }
            //does not work with new timetable service
            var hasClassCode = false
            for (var i in response.week) {
                for (var j = 0; j < response.week[i].length; j++) {
                    if (response.week[i][j]['class-id']) {
                        hasClassCode = true
                        break
                    }
                }
                if (hasClassCode) {
                    break
                }
            }
            if ( data == undefined || data.length == 0 ) {
                timetable = $('<div class="table none"> No Classes Today</div>')
            } else {
                timetable = $('<div class="timetable day">')
                var tableRows = []
                var numBreaks = 0
                for ( var i = 0; i < data.length; i++ ) {
                    var rowStr = ""
                    if (data[i]['isPreset'] > 0) {
                        rowStr = '<div class="slot break"><span class="time">'
                        rowStr += (data[i].time != "" ? data[i].time.substr(0, 5) + " - " + data[i].endTime.substr(0, 5) : "---")
                        rowStr += "</span>"
                        numBreaks++
                    } else {
                        rowStr = '<div class="slot"><span class="time">'
                        rowStr += (data[i].time != "" ? data[i].time.substr(0, 5) + " - " + data[i].endTime.substr(0, 5) : data[i].sequence - numBreaks)
                        rowStr += "</span>"
                    }
                    rowStr += '<span class="class">' + timetableFunctions.getTimetableTextInline(data[i]) + "</span></div>"
                    tableRows.push(rowStr)
                }
                timetable.append(tableRows.join(""))
            }
            //check if no classes
            if (classList.length == 0) {
                $('#dashboard-timetable-contents .no-classes').removeClass('hidden')
            } else if (!hasClassCode) { //need fix for new timetable service
                //$('#dashboard-timetable-contents .empty-timetable').removeClass('hidden')
            }
            $('#dashboard-timetable-contents').append(timetable)
            //fix table heigh for dashboard
            var rowCount = tableRows.length //subtract break tables
            var height = parseInt($('#dashboard-timetable-box').css('height'))
            height -= parseInt($('#dashboard-timetable-box .ld-box-head').css('height'))
            height -= parseInt($('#dashboard-timetable-box .ld-box-child .header-navigation').css('height'))
            height -= parseInt($('#dashboard-timetable-contents .no-classes').css('height'))
            height -= parseInt($('#dashboard-timetable-contents .empty-timetable').css('height'))
           // height -= (2 * parseInt($('#dashboard-timetable-box .timetable .slot').css('height')))
            height /= rowCount
            $('#dashboard-timetable-box .timetable .slot').css({height: height -1, 'line-height': (height-1) + 'px'})
            $('#dashboard-timetable-contents .class-code').click(function( event ) {
                event.preventDefault()
                event.stopPropagation()
                window.location.href = urlBase + getUser() + "/showClass/" + event.target.getAttribute("data-class-id")
            })
        })
    }
    function populateHomework() {
        var url = urlBase + "service/homeworks/"
        $.get(url, function(response) {
            if (response.homeworks.length == 0) {
                $('#dashboard-homework-contents .no-homework').removeClass('hidden')
                return
            }
            var homeworkItems = getUser() == "student" ? studentHomeworkList(response.homeworks) : teacherHomeworkList(response.homeworks)
            var homeworkList = $( "<ul>")
            homeworkList.append( homeworkItems.join("") )
            $('#dashboard-homework-contents').append(homeworkList)
            $('.ld-tooltip').tooltip({selector: "[data-toggle=tooltip]", container: ".ld-tooltip"})
            $('.dashboard .ld-homework.ld-box .ld-box-child').slimScroll({height:'335px'})
        })
    }
    function populateNotices() {
        var url = urlBase + "service/notices/"
        $.get(url, function(response) {
            var notices = response.notices
            var items = []
            if (notices.length == 0) {
              $('#dashboard-notices .no-notices').removeClass('hidden');
            }else {
              for (var i = 0; i < 3; i++) {
                  if (notices[i] != undefined) {
                      var notice = '<div class="note ' + (notices[i].category || "general") + '" data-id=' + notices[i].id + '>'
                      if (notices[i].link !== undefined && notices[i].link != "") {
                          notice += '<a href="' + notices[i].link +'" class="btn-icon fa fa-download" target="_blank"></a>'
                      }
                      notice += '<span class="ld-notice-icon"></span>' +
                          '<p>' + notices[i].text + '</p></div>'
                      items.push(notice)
                  }
              }
              $('#dashboard-notices .no-notices').remove();
            }
            $('#dashboard-notices').append(items.join(''))
            $('#dashboard-notices .note').on('click', function(event) {
                if (event.currentTarget.getAttribute('data-id')) {
                    window.location.href = urlBase + getUser() + '/noticeboard/show/'
                        + event.currentTarget.getAttribute('data-id')
                }
            })

            $('#dashboard-notices .note').dotdotdot();

        })
    }

    function populateEvents() {
        var url = urlBase + "service/calendar/"
        $.get( url, function(response ) {
            response.sort(function(a, b) {
                if (moment(a["start"]).isBefore(moment(b["start"]), 'day'))
                    return -1
                if (moment(a["start"]).isAfter(moment(b["start"]), 'day'))
                    return 1
                return 0
            })
            calendarEvents = response
            $('.dashboard-head[data-panel-type="calendar"]').datepicker({
                inline: true,
                firstDay: 1,
                onSelect: fillDaysEvents,
                beforeShowDay: findCurrentEvents,
                showOtherMonths: true,
                dayNamesMin:["Su","Mo","Tu","We","Th","Fr","Sa"]
            })
            $('<h2><span class="ld-icon-events"></span>' + _t('events') + '</h2>').prependTo($('.dashboard .ld-box.ld-events .ld-box-head .ui-datepicker-header .ui-datepicker-title'))
            upcomingEvents()
        })
    }
    var calendarEvents
    //events

    $( "#dashboard-timetable-contents .header-navigation a.default-prev").click(
        function() {
            displayDate.setDate(displayDate.getDate() - 1)
            populateTimetable(displayDate)
    })
    $( "#dashboard-timetable-contents .header-navigation a.default-next").click(
        function() {
            displayDate.setDate(displayDate.getDate() + 1)
            populateTimetable(displayDate)
    })
    nextThreeEvents = function() {
        var items = []
        $("#dashboard-events").empty()
        for ( var i = 0; i < calendarEvents.length; i++ ) {
            var eventDate = moment(calendarEvents[i].start)
            if ( eventDate >= moment()) {
                var eventStr = "<tr class='event-details' data-index=" + i + "><td colSpan=\"3\">" + calendarEvents[i].title + "</td>"
                eventStr += "<td colSpan=2>" + moment(eventDate).format("ddd Do MMM") + "<br/>"
                if ( calendarEvents[i].allDay == 0 ) {
                    eventStr += "All Day"
                } else {
                    eventStr += moment(eventDate).format("hh:mm")
                }
                eventStr += "</td></tr>"
                items.push(eventStr)
                if (items.length == 3) break
            }
        }
        var tableBody = $( "<tbody></tbody>")
        tableBody.append( "<tr><td class=\"single-date-cell\" colSpan=5> " +
            _t("upcoming-events") )
        tableBody.append( items.join("") )
        var table = $ ( "<table class=\"table table-events\"></table>" )
        table.append( tableBody )
        $( "#dashboard-events" ).append( table )
        $(".table-events tr.event-details").click(function(event) {
            createEditEventDialog(calendarEvents[$(event.currentTarget).data().index])
            $("#createEditEventModal").modal("show")
        })
    }
    fillDaysEvents = function(dateStr) {
        var selectDate = moment(dateStr, 'DD/MM/YYYY')
        var items = []
        $('#dashboard-events').empty()
        for (var i = 0; i < calendarEvents.length; i++ ) {
            var eventDate = moment(calendarEvents[i].start)
            if (eventDate.isSame(selectDate, "day")) {
                var eventStr = '<tr><td colSpan="3">' + calendarEvents[i].title + '</td>'
                if ( calendarEvents[i].allDay == 0 ) {
                    eventStr += '<td> All Day </td></tr>'
                } else {
                    eventStr += "<td>" + moment(eventDate).format("hh:mm") + "</td></tr>"
                }
                items.push(eventStr)
            }
        }
        var tableBody = $("<tbody></tbody>")
        tableBody.append("<tr><td class=\"single-date-cell\" colSpan=4> " +
            moment(selectDate).format("ddd MMM Do YYYY")  + " </td></tr>")
        tableBody.append(items.join(""))

        var getString = 'title=&start=' +  encodeURIComponent(selectDate.format("YYYY-MM-DD 00:00:00")) +
            '&end=' +  encodeURIComponent(selectDate.format("YYYY-MM-DD 00:00:00"))

        tableBody.append('<tr><td class="single-date-cell" colSpan=4><a class="btn" href="' + urlBase + getUser() + '/calendar/new?' + getString + '">New Event</a></td></tr>')
        var table = $ ('<table class="table table-events"></table>')
        table.append(tableBody)
        $('#dashboard-events').append(table)
    }

    findCurrentEvents = function(date) {
       // if (date < new Date().setHours(0,0,0,0))
       //     return [false]
        for ( var i = 0; i < calendarEvents.length; i++ ) {
            var data = calendarEvents[i]
            var eventDate = moment(data.start)
            if (eventDate.isSame(date, "day")) {
                if (!data.end || moment(data.end).isSame(data.start, 'day')) {
                    return [true, "ui-datepicker-selectable ui-state-enabled"]
                } else {
                    return [true, "ui-datepicker-selectable ui-state-enabled multi-day start"]
                }
            } else if (eventDate.isBefore(date, "day")) {
                if (moment(data.end).isAfter(date, 'day')) {
                    return[true, "ui-datepicker-selectable ui-state-enabled multi-day"]
                } else if (moment(data.end).isSame(date, 'day')) {
                    return[true, "ui-datepicker-selectable ui-state-enabled multi-day end"]
                }

            }
        }
        return [true, ""]
    }



    var studentHomeworkList = function(homework) {
        homework.sort(function(a, b) {
            if (a["due-date"] < b["due-date"] ) return -1
            if (a["due-date"] > b["due-date"] ) return 1
            return 0
        })
        var homeworkItems = []
        var length = homework.length
        for ( var i = 0; i < length; i++ ) {
            var item = homework[i]
            var icon = "fa fa-pencil"
            var titleTip  = "Do homework"
            var statusUrl = "do"
            var dueDate = item["due-date"]
            var today = moment().format("YYYY-MM-DD")

            var btnIcon = "<span title=\"" + titleTip + "\" class=\"btn-icon "
                + icon +
                "\" data-placement='left auto' data-toggle='tooltip'></span>"

            // var overdue = moment(dueDate).isBefore(moment()) ? "overdue" : ""
            var overdue = ""

            if(moment(dueDate).isSame(today)) {
                if(moment().hours() >= 16) {
                    overdue = "Overdue"
                }
            } else {
                overdue = moment(dueDate).isBefore(moment()) ? "Overdue" : ""
            }

            var tomorrow = moment(moment().add('days', 1)).format("YYYY-MM-DD")
            var yesterday = moment(moment().add('days', -1)).format("YYYY-MM-DD")

            if(item["hasPeriod"] == true) {
                var period = moment(dueDate).endOf('day').fromNow()

                if (dueDate == today) {
                    var period = "Due today - Period " + item["period"]
                }

                if (dueDate == tomorrow) {
                    var period = "Due tomorrow - Period " + item["period"]
                }

                if (dueDate == moment(moment().add('days', -1)).format("YYYY-MM-DD")) {
                    var period = "Due yesterday - Period " + item["period"]
                }
            } else {
                if(dueDate == today) {
                    var period = "Today"
                } else if (dueDate == tomorrow) {
                    var period = "Tomorrow"
                } else if (dueDate == yesterday) {
                    var period = "Yesterday"
                } else {
                    var period = moment(dueDate).endOf('day').fromNow()
                }
            }
            var due = "<p class=\"due-date " + overdue + "\">" +
                "<span class=\"due-date-icon\" title=\"" + overdue + "\"" +
                "data-placement='left auto' data-toggle='tooltip'>" +
                "</span> " + period + "</p>"

            homeworkItems.push("<li class=\"ld-tooltip\">" +
                "<a  href=\"" + urlBase + "student/homework/" + statusUrl + "/" +
                homework[i].id + "\">" + btnIcon + "<p>" +
                homework[i].title + " (" + homework[i].subject +
                ")</p>" + due + "</a></li>"
            )
        }
        return homeworkItems
    }
    var teacherHomeworkList = function(homework) {
        var homeworkItems = []
        var length = homework.length
        for ( var i = 0; i < length; i++ ) {
            var item = homework[i]
            var urlSegment
            var icon

            icon = "fa fa-eye"
            titleTip = "View howework"
            urlSegment = "review"

            homeworkItems.push("<li class='ld-tooltip'><a href=" +
                urlBase + "teacher/homework/list/" + homework[i].id +
                "><span title=\"" + titleTip + "\" class=\"btn-icon bg-hwk " +
                icon + "\" data-placement='left auto' data-toggle='tooltip'></span><p>" +
                 homework[i].title + "</p></a></li>"
            )
        }
        return homeworkItems
    }




    upcomingEvents = function() {
        var items = []
        $( "#dashboard-events" ).empty( )
        for ( var i = 0; i < calendarEvents.length; i++ ) {
            var eventDate = moment(calendarEvents[i].start)
            if ( eventDate >= moment()) {
                var eventStr = "<tr class='event-details' data-index=" + i + "><td colSpan=\"3\">" + calendarEvents[i].title + "</td>"
                eventStr += "<td colSpan=2>" + moment(eventDate).fromNow()
                eventStr += "</td></tr>"
                items.push(eventStr)
            }
        }
        var tableBody = $( "<tbody></tbody>")
        tableBody.append( items.join("") )
        var table = $ ( "<table class=\"table table-events\"></table>" )
        table.append( tableBody )
        $( "#dashboard-events" ).append( table )
        $(".table-events tr.event-details").click(function(event) {
            createEditEventDialog(calendarEvents[$(event.currentTarget).data().index])
            $("#createEditEventModal").modal("show")
        })
        $("#dashboard-events").slimScroll({height:"200px"})
    }

    var populateMessages = function( date ) {
        //var url = urlBase + "service/events/"
        //$.get(url, function(response) {
        var response = {messages: [{status: 0, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},{status: 1, sender: "P", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},{status: 1, sender: "S", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},{status: 1, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},{status: 1, sender: "S", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},
{status: 0, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}, {status: 0, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}, {status: 1, sender: "P", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}, {status: 1, sender: "S", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}, {status: 1, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}, {status: 1, sender: "S", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}, {status: 0, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}, {status: 0, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}, {status: 1, sender: "P", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}, {status: 1, sender: "S", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},
{status: 1, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},{status: 1,sender: "S", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},
{status: 0, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},{status: 0, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},
{status: 1, sender: "P",text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},{status: 1, sender: "S", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},
{status: 1, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},{status: 1, sender: "S", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."},
{status: 0, sender: "ST", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus ipsum."}]}
            /*var items = []
            for ( var i = 0; i < response.messages.length; i++ ) {
                var msg = response.messages[i]
                var classStr = "class=" + ((msg.status == 0) ? "\"unread\"" : "")
                items.push("<li " + classStr + "><div class=label>" + msg.sender + "</div><p>" + msg.text + "</p></li>")
            }
            var list = $( "<ul>")
            list.append( items.join("") )
            $( "#dashboard-messages-contents" ).append( list )*/
            $(".dashboard .messages .ld-box-child").slimScroll({height:"335px"})
        //})
    }


    var createEditEventDialog = function(data) {
        $("#createEditEventModal").remove()
        var modal = $("<div class=\"modal fade\" id=\"createEditEventModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">")
        var modalHeader = $("<div class=\"modal-header\"><button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button><h2 class=\"modal-title\">" + data.title + "</h2></div>")
        var modalBody = $("<div class=\"modal-body\"></div>")
        if (data.end == null) data.end = data.start
        var dateElement = $('<span class="modal-value" data-start=' + moment(data.start).format() + ' data-end=' + moment(data.end).format() + ' ></span>')
        formatDateRange(dateElement[0])
        modalBody.append('<span class="fa fa-calendar"></span>')
        modalBody.append(dateElement)
        if (!data.allDay) dateElement.attr("data-date-special", "inc-time")
        modalBody.append("<hr/>")
        if (data.location) {
            modalBody.append('<span class="fa fa-map-marker"></span><span class="modal-value">' + data.location + '</span>')
            modalBody.append('<hr/>')
        }
        if (data.contact) {
            modalBody.append('<span class="fa fa-phone"></span><span class="modal-value">' + data.contact + '</span>')
        }
        if (data.url) {
            modalBody.append('<span class="fa fa-link"></span><span class="modal-value"> <a href=" + data.url + " target="_blank">' + data.url + '</a></span>')
            modalBody.append('<hr/>')
        }
        if (data.description) {
            modalBody.append('<span class="fa fa-align-left"></span><p class="value">' + data.description + '</p>')
        }

        var modalFooter = $("<div class=\"modal-footer\"></div>")
        /*modalFooter.append("<hr/>")
        modalFooter.append(edit)
        modalFooter.append(cancel)
        modalFooter.append(del)
        */var modalDialog = $("<div class=\"modal-dialog\"></div>")

        var modalContent = $("<div class=\"modal-calendar modal-content\"></div>")
        modalContent.append(modalHeader)
        modalContent.append(modalBody)
        modalContent.append(modalFooter)

        modalContent.appendTo(modalDialog)
        modalDialog.appendTo(modal)
        modal.appendTo("li.ld-events")

        /*edit.click(function() {
            window.location.href = urlBase + getUser() + "/calendar/edit/" + data.id
        })
        del.click(function() {
            window.location.href = urlBase + "calendar/remove/" + data.id
        })*/
    }

    return {
        init: init
    };
})()
