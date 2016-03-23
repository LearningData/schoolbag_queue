var timetablePage = (function() {
    var timezone = $('input[name="session_timezone"]').val() || 'GMT'
    var displayDate = moment().tz(timezone)._d
    var displayDay = displayDate.getDay()
    var init = function() {
        refreshTables()
        //events
        $( ".ld-timetable header" ).click( function( event ) {
            window.location.href = urlBase + getUser() + "/timetable"
        })
        $( ".ld-timetable .ld-responsive-sm .nav .title" ).click( function( event ) {
            refreshTables()
            $( ".ld-timetable .day-of-week" ).removeClass( "active" )
        })
        $( ".ld-timetable .ld-responsive-sm .nav .btn-prev" ).click( function() {
            displayDate.setUTCDate(displayDate.getUTCDate() - 7)
            refreshTables()
            $( ".ld-timetable .day-of-week" ).removeClass( "active" )
        })
        $( ".ld-timetable .ld-responsive-sm .nav .btn-next" ).click( function() {
            displayDate.setUTCDate(displayDate.getUTCDate() + 7)
            refreshTables()
            $( ".day-of-week" ).removeClass( "active" )
        })
        $( ".ld-timetable .ld-responsive-xs .nav .btn-prev" ).click( function() {
            displayDay -= 1
            if (displayDay < 0) {
                displayDate.setUTCDate(displayDate.getUTCDate() - 7)
                displayDay = 6
            }
            refreshTables()
        })
        $( ".ld-timetable .ld-responsive-xs .nav .btn-next" ).click( function() {
            displayDay += 1
            if (displayDay > 6) {
                displayDate.setUTCDate(displayDate.getUTCDate() + 7)
                displayDay = 1
            }
            refreshTables()
        })
        /*$( ".teacher .ld-timetable .btn-edit").click( function() {
            $( ".teacher .ld-timetable .table" ).toggleClass( "edit" )
        })*/
    }

    var refreshTables = function() {
        getWeekView(displayDate)
        getSingleDayData(displayDay, true)
    }

    var getSingleDayData = function( day, hidden ) {
        var url = urlBase + 'service/timetable?date=' + moment(displayDate).day(day).format('YYYY-MM-DD')
        $.get(url, function(response) {
            data = response.week[day]
            if ( data == undefined ) {
                return
            }
            var timetable = $( "<table class=\"table day\">")
            var tableRows = []
            var numBreaks = 0
            for ( var i = 0; i < data.length; i++ ) {
                var rowStr = ""
                if (data[i]['isPreset'] > 0) {
                    rowStr = '<tr class="break"><td class="slot time" colspan=1>'
                    rowStr += (data[i].time != "" ? data[i].time.substr(0, 5) + " - " + data[i].endTime.substr(0, 5) : "---")
                    rowStr += "</td>"
                    numBreaks++
                } else {
                    rowStr = '<tr><td class="slot time" colspan=1>'
                    rowStr += (data[i].time != "" ? data[i].time.substr(0, 5) + " - " + data[i].endTime.substr(0, 5) : data[i].sequence - numBreaks)
                    rowStr += "</td>"
                }
                rowStr += '<td class="slot" colspan=' + (Object.keys(response.week).length - 1) +
                    '>' + timetableFunctions.getTimetableTextInline( data[i] ) + "</td></tr>"
                tableRows.push(rowStr)
            }
            var tableBody = $( "<tbody>" )
            tableBody.append( tableRows.join("") )
            timetable.append( tableBody )
            if (hidden) {
                var header = $( ".ld-timetable .ld-responsive-xs .nav .title h2" )
                var date = new Date(displayDate)
                date.setDate(date.getDate() - date.getDay() + day)
                header.empty()
                header.append(moment(date).format("dddd Do"))

                timetable.append( tableBody )
                $( ".ld-timetable .ld-responsive-xs .table" ).replaceWith( timetable )
            } else {
                var tableHead = $( ".ld-timetable .table .head" )
                timetable.prepend(tableHead)
                $( ".ld-timetable .ld-responsive-sm .table" ).replaceWith( timetable )
            }
            $( ".ld-timetable .table.day td .class-code").click(function( event ) {
                event.preventDefault()
                event.stopPropagation()
                window.location.href = urlBase + getUser() + "/showClass/" + event.target.getAttribute("data-class-id")
            })
        })
    }

    function getWeekRows(week) {
        //var times = createWeekTimes(week)
        //var keys = Object.keys(times)
        //keys.sort()
        var tableBody = $('<tbody>')
        for (var i = 0; i < week[1].length; i++) {
            var row = $('<tr>')
            for (var day in week) {
                cell = $('<td class="slot">')
                var dayData = week[day]
                //for (var j = 0; j < dayData.length; j++ ) {
                    //if (dayData[j] && dayData[j].time == keys[i] ) {
                        if (dayData[i]['isPreset'] > 0) {
                            cell.addClass('break')
                        }
                        cell.append(timetableFunctions.getTimetableTextBlock(dayData[i]))
                        if (getUser() != "teacher") {
                            if (dayData[i]["class-id"] == undefined) {
                                cell.append('<span class="cell-icon btn-icon fa fa-plus"></span>')
                            } else {
                                cell.append('<span class="cell-icon btn-icon fa fa-times"></span>')
                            }
                        }
                    //}
                //}
                row.append(cell)
            }
            tableBody.append(row)
        }
        return tableBody
    }

    var getWeekView = function(date) {
        var currentDate = moment(date).format("YYYY-MM-DD");
        var url = urlBase + "service/timetable?date=" + currentDate;

        $.get(url, function(response) {
            setTableHeader(response.week, date, response.currentWeek)
            var tableHead = setDaysHeader(response.week, date)
            var timetable = $( "<table class=\"table week\">")
            timetable.append( getWeekRows( response.week ) )
            timetable.prepend(tableHead)
            $( ".ld-timetable .ld-responsive-sm .table" ).replaceWith( timetable )
            $( ".teacher .ld-timetable .table.week td .cell-icon" ).click(function( event ) {
                event.stopPropagation()
                if ($( event.target ).hasClass("fa fa-remove") ) {
                    removeSubjectClass(event.target.parentElement, event.target)
                 }
                else if ($( event.target ).hasClass("fa fa-plus") ) {
                    addSubjectClass(event.target.parentElement, event.target)
                }
            })
            $( ".ld-timetable .table.week td .class-code").click(function( event ) {
                event.preventDefault()
                event.stopPropagation()
                window.location.href = urlBase + getUser() + "/showClass/" + event.target.getAttribute("data-class-id")
            })
            /*$( ".teacher .ld-timetable .table.week td").click(function( event ) {
                $( ".teacher .ld-timetable .table.week td").removeClass( "edit" )
                event.currentTarget.classList.add( "edit" )
            })*/
        })
    }

    function setTableHeader(week, date, currentWeek) {
        var header = $( ".ld-timetable .ld-responsive-sm .nav .title h2" )
        var weekMessage = "";

        if (currentWeek > 0) {
            weekMessage = " (Week - " + currentWeek + ")";
        }

        header.empty()
        header.append(moment(date).startOf("week").add("days", 1).format('D MMM') + " - " +
            moment(date).startOf("week").add("days", Object.keys(week).length).format('D MMM') +
             weekMessage)
    }
    function setDaysHeader(week, date) {
        var tableHead = $( ".ld-timetable .table .head" )
        var headRow = tableHead.find( "tr")
        headRow.empty()
        for (var day in week) {
            var cell =$("<th class='day-of-week'" +
                " data-day=" + day + ">" +
                moment(date).startOf("week").add("days", day).format('dddd') +
                "</th>")
            headRow.append(cell)
            cell.on("click", function(event) {
                getSingleDayData( $ ( this ).data().day )
                $( ".ld-timetable .day-of-week" ).removeClass( "active" )
                $( this ).addClass( "active" )
            })
        }
        return tableHead
    }
    var createWeekTimes = function( week ) {
        var times = {}
        for ( var day in week ) {
            for ( var i = 0; i < week[day].length; i++ ) {
                times[week[day][i].time] = week[day][i].time
            }
        }
        return times
    }


    var addSubjectClass = function(cell, icon) {
        $( icon ).detach()
        cell = $( cell )
        cell.empty()
        var selectClass = $( "<select>", {
            "class": "form-control customSelect"
        })

        selectClass.append("<option value=\"\" disabled selected>Select Class</option><option value=\"1\">Class 1</option><option value=\"class 2\">Class 2</option><option>Class 3</option><option value=\"redirect\">New Class</option>")
        cell.append( selectClass )
        selectClass.change(function( event ) {
            var selected = event.target.value
            if (selected == "redirect") {
                window.location.href = urlBase + getUser() + "/newClass?thisDay=2"
                return
            }
            cell.append( "<span>" + selected + "</span>" )
            icon.classList.remove( "fa fa-plus" )
            icon.classList.add( "fa fa-remove" )
            cell.append( icon )
            $( selectClass ).remove( )
            cell.removeClass("edit")
        })
    }

    var removeSubjectClass = function( cell, icon ) {
        $( icon ).detach()
        cell = $(cell)
        cell.empty()
        icon.classList.remove( "fa fa-remove" )
        icon.classList.add( "fa fa-plus" )
        cell.append( icon )
        cell.removeClass("edit")
    }

    return {
        init: init
    }
})()
