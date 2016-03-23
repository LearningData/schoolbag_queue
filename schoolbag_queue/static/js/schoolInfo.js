var schoolInfoPage = (function() {
    var actionBase = $('#editSlotPopover form').attr('action')
    var hasTimetable = false
    //init
    var init = function() {
        //user managment
        //$('.ld-school-info .student-info a').on('click', studentCardClick)


        //$("#homework-daily-time").on("change", function(event){
        //    var homeworkTime = $( "#homework-daily-time option:selected" ).val()
        //    var params = {name: "homeworkDailyTime", value: homeworkTime}

        //    $.post("updateConfig", params, function(data){
        //            location.reload()
        //        }
        //    )
        //})
        //$("#homework-time").on("change", function(event){
        //    var homeworkTime = $( "#homework-time option:selected" ).val()
        //    var params = {name: "homeworkTime", value: homeworkTime}

        //    $.post("updateConfig", params, function(data){
        //            location.reload()
        //        }
        //    )
        //})
        if (window.location.hash == '#timetable-form') {
            $('.ld-school-info .ld-tabs a[data-toggle="timetable"]').click()
            window.location.hash = ''
        }
        $('.ld-school-info .internal-tab-link a[data-toggle="timetable"]').on('click', function(event){
            $('.ld-school-info .ld-tabs a[data-toggle="timetable"]').click()
            window.location.hash = ''
        })
        $( ".ld-school-info header" ).click( function( event ) {
            window.location.href = urlBase + "school/index"
        })
        //timezone
        var value = $('input[name="timezone"]').val()
        var options='<select name="timezone">'
        var timezones = moment.tz.names()
        for (var i = 0; i < timezones.length; i++) {
            if (timezones[i] == value) {
                 options+='<option selected="selected">' + timezones[i] + '</option>'
            }
            options+='<option>' + timezones[i] + '</option>'
        }
        options+='</select>'
        $('input[name="timezone"]').replaceWith(options)
        $('select[name="timezone"]').uniform()
        //Country
        if ($('input[name="country"]').length > 0) {
            //country select
            var countryArray = []
            var value = $('input[name="country"]').val()
            for (code in countries) {
                countryArray.push({"label": countries[code], "value":code})
                console.log(code, $('input[name="country"]').val())
                if (code == $('input[name="country"]').val()) {
                    $('input[name="country-label"]').val(countries[code])
                }
            }
            $('input[name="country-label"]').autocomplete({
                source: function(request, response) {
                    request.term = request.term.toLowerCase()
                    response( (function(countryArray) {
                        var countryFilter = []
                        for (var i = 0; i < countryArray.length; i++) {
                            var pos = countryArray[i]['label'].toLowerCase().indexOf(request.term)
                            if (pos != -1) {
                                countryFilter.push({
                                    label:countryArray[i]['label'], value: countryArray[i]['value'], pos: pos
                                })
                            }
                        }
                        return countryFilter.sort(function(a,b){ return a.pos - b.pos})
                    }(countryArray)))
                },
                focus: function( event, ui ) {
                    $('input[name="country"]').val(ui.item.label)
                    return false
                },
                select: function(event, ui) {
                    $('input[name="country-label"]').val(ui.item.label);
                    $('input[name="country"]').val(ui.item.value)
                    $('input[name="country"]').closest('.validation-box').removeClass("error custom")
                    return false
                },
                change: function(event, ui) {
                    if (ui.item === null) {
                        for(var key in countries){
                            if(countries[key].toLowerCase() == event.currentTarget.value.toLowerCase()){
                                $('input[name="country"]').val(key)
                                $('input[name="country-label"]').val(countries[key])
                                $('input[name="country"]').closest('.validation-box').removeClass("error custom")
                                return
                            }
                        }
                        $('input[name="country"]').val("")
                        $('input[name="country"]').closest('.validation-box').addClass("error custom")
                    }
                }
            })
        }
        //validation
        $('.btn:submit').on("click", function(event) {
            event.preventDefault()
            var form = $(this).closest("form")
            if (validation.validateForm(form) == true && validForm(form)) {
                form.submit()
            }
        })
    }

    //timetable
    $('.ld-school-info .tab-pane.timetable .btn-icon.edit').on('click', function() {
        //TODO add warning!
        $('.ld-school-info .tab-pane.timetable .edit-timetable').removeClass('hidden')
        $('.ld-school-info .tab-pane.timetable .timetable').addClass('hidden')
    })
    $('.ld-school-info .tab-pane.timetable .btn.cancel').on('click', function() {
        //TODO add warning!
        $('.ld-school-info .tab-pane.timetable .edit-timetable').addClass('hidden')
        $('.ld-school-info .tab-pane.timetable .timetable').removeClass('hidden')
    })
    $('.ld-school-info .tab-pane.timetable input[name="isPreset"]').on('click', function() {
        if ($('.ld-school-info .tab-pane.timetable input[name="isPreset"]').is(':checked')) {
            $('.ld-school-info .tab-pane.timetable input[name="presetLabel"]').removeAttr("readonly disabled")
        } else {
            $('.ld-school-info .tab-pane.timetable input[name="presetLabel"]').attr({"readonly":"readonly", "disabled":"disabled"})
        }
    })
    $('.ld-school-info .ld-tabs a[data-toggle="timetable"]').on('click', function(event) {
        if (!hasTimetable) {
            var column = $('#timetable .column')
            column.css('width',  100/column.length + '%')
            $('#timetable .add-row').removeClass('hidden')
            var parent = $("body").popover({
                html : true,
                container : "#timetable",
                selector : ".slot",
                trigger: "manual",
                placement : "top auto",
                content : function() {
                    $.uniform.restore('#editSlotPopover select')
                    $.uniform.restore('#editSlotPopover input[type="checkbox"]')
                    return $('#editSlotPopover').html()
                }
            })
            .on("click", ".popover button.close, .popover button.cancel", function(event) {
                $(".popover").remove()
            })
            .on('click', '.popover input[name="isPreset"]', function() {
                if ($('.popover input[name="isPreset"]').is(':checked')) {
                    $('.popover input[name="preset"]').attr('data-validation', 'required')
                } else {
                    $('.popover input[name="preset"]').removeAttr("data-validation")
                }
            })
            .on('change', '.popover select[name="presetVal"]', function() {
                var selected = $('.popover select[name="presetVal"] option:selected').val()
                if (selected == 0) {
                    $('.popover input[name="isPreset"]').val('0')
                    $('.popover input[name="preset"]').val('')
                } else {
                    $('.popover input[name="isPreset"]').val('1')
                    $('.popover input[name="preset"]').val(selected)
                    if (selected == '-') {
                       $('.popover input[name="preset"]').val("")
                    }
                }
            })
           .on('click', '.popover button.submit' , function(event) {
                event.preventDefault()
                var form = $( ".popover form")
                if (validation.validateForm(form) == true && validForm(form)) {
                    if ($('.popover input[name="allWeek"]')[0].checked) {
                        var deferreds = []
                        $('.slot[data-sequence="' + form.attr('data-sequence-number') + '"]').each(function(index, element){
                            var slotId = element.getAttribute('data-id')
                            var url = actionBase.replace('%slotId%', slotId)
                            var label = $('.popover select[name="presetVal"]').val()
                            deferreds.push(
                                $.post(url, {
                                    presetVal: label,
                                    id: slotId,
                                    isPreset: $('.popover input[name="isPreset"]').val(),
                                    preset: $('.popover input[name="preset"]').val(),
                                    sequence: element.getAttribute('data-sequence')
                                }, function (response) {
                                    if ($('.popover input[name="isPreset"]').val() == 1) {
                                        $(element).addClass("break")
                                        .attr({'data-label': label, 'data-is-preset':true})
                                        $(element).empty().append('<span>' + label + '</span>')
                                    } else {
                                        var eleObj = $(element)
                                        var sequence = eleObj.attr('data-sequence') - eleObj.prevAll('.break').length
                                        eleObj.removeClass("break").removeAttr('data-label').attr('data-is-preset', false)
                                        eleObj.empty().append('<span>' + sequence + '</span>')
                                    }
                                })
                            )
                        })
                        $.when.apply($, deferreds).then(function(){
                            $(".popover").remove()
                        })

                    } else {
                        form.submit()
                    }
                }
            })
            .on('shown.bs.popover', function () {
                $('.popover select').uniform()
                $('.popover input[type="checkbox"]').uniform({checkboxClass : 'ld-CheckClass'})
            })
            $('.slot').on('click', showPopover)
            hasTimetable=true
        }
    })
    $('#timetable .week-select input[type="checkbox"]:checked').on('click', function(event) {
        $(event.currentTarget).prop('checked', 'checked')
        $.uniform.update(event.currentTarget)
        $('#remove2Week').modal('show')
    })
    $('#remove2Week .btn.delete').on('click', function(event) {
        $('#timetable .week-select input[type="checkbox"]').closest('form').submit()
    })
    $('#timetable .week-select input[type="checkbox"]:not(":checked")').on('click', function(event) {
        $(event.currentTarget).closest('form').submit()
    })
    function showPopover(event){
        $("body").popover("show")
        var pop = $(".popover")
        var slotId = event.currentTarget.getAttribute('data-id')
        $('.popover input[name="id"]').val(slotId)
        $('.popover form').attr('action', actionBase.replace('%slotId%', slotId))
        $('.popover form').attr('data-sequence-number', event.currentTarget.getAttribute('data-sequence'))
        $('.popover input[name="preset"]').val()
        if (event.currentTarget.getAttribute('data-is-preset')=='true') {
            $('.popover input[name="isPreset"]').val('1')
            $('.popover input[name="preset"]').val(event.currentTarget.getAttribute('data-label'))
            $('.popover select[name="presetVal"]').val(event.currentTarget.getAttribute('data-label'))
            $.uniform.update('.popover select[name="presetVal"]')
        } else {
            $('.popover input[name="preset"]').val("")
        }
        $('.popover input[name="sequence"]').val(event.currentTarget.getAttribute('data-sequence'))
        pop.css('top', event.currentTarget.offsetTop+event.currentTarget.clientHeight)
        var left = event.currentTarget.offsetLeft +
            event.currentTarget.clientWidth/2 - pop[0].clientWidth/2
        pop.css('left', left)
        //check height
        var posTop =  pop.offset().top
        var posHeight = pop.height()
        var allowedHeight = $(window).scrollTop() + $(window).height()
        if(posTop + posHeight > allowedHeight) {
            pop.css('top', event.currentTarget.offsetTop - posHeight )
            pop.removeClass("bottom")
            pop.addClass("top")
        }
        //check width
   /*     var posLeft =  pop.offset().left
        var posWidth = pop.width()
        var allowedWidth = $(window).scrollLeft() + $(window).width()
        if (left < 0) {
            pop.css('left', 0)
            pop.find('.arrow').css("left", ((left/(pop[0].clientWidth/2) * 50) + 50) + "%")
        } else if(posLeft + posWidth > allowedWidth) {
            var offset =  posLeft + posWidth - allowedWidth
            pop.css('left', left - offset)
            pop.find('.arrow').css("left", ((offset/(pop[0].clientWidth/2) * 50) + 50) + "%")
        }
    */
    }
    //###################################MANAGE STUDENTS######################
    function studentCardClick(event) {
        event.preventDefault()
        if (event.ctrlKey) {
            $(event.currentTarget).toggleClass('selected')
            var selectedCount = $('.ld-school-info .student-info a.selected').length  
            if (selectedCount == 1) {
                switchToManagementMode()
            } else if (selectedCount == 0) {
                leaveManagementMode()      
            }
        } else {
            window.location.href = event.currentTarget.getAttribute('href')
        }
    }
    function switchToManagementMode() {
        $('.ld-school-info .ld-user-control').removeClass('hidden')
        $(".pop").popover('disable')
    }
    function leaveManagementMode() {
        $('.ld-school-info .ld-user-control').addClass('hidden')
        $(".pop").popover('enable')
    }

    return {
        init: init
    }
})()


/*
$('.schoolModal').on('click', function() {
  $('#removeResourceModal').modal('show')
})

$(".pop").popover({ trigger: "manual" , html: true, animation:true})
  .on("mouseenter", function () {
    var _this = this;
    $(this).popover("show");
    $(".popover").on("mouseleave", function () {
        $(_this).popover('hide');
    });
  })
  .on("mouseleave", function () {
    var _this = this;
    setTimeout(function () {
      if (!$(".popover:hover").length) {
        $(_this).popover("hide");
      }
    }, 300);
  });
*/
