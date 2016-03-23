var homeworkPage = (function() {
    var searchParams = {'expired':1}
    var dirtyHomeworkText = false
    var datePickerObject = {
        dateFormat : 'yy-mm-dd',
        minDate : 0,
        beforeShowDay : enableDays,
        onSelect : updateHomeworkDueDate,
        onClose : function() {
            isValid(this)
        },
        firstDay : 1,
        prevText : "",
        nextText : ""
    }
    var init = function() {
        /*************** #(hash) redirects       *************/
        if (getUser() == "student") {
            if (window.location.hash == '#new') {
                $('#newHomeworkModal').modal('show')
                window.location.hash = ''
            }
        }
        if (getUser() == "teacher") {
            if (/hw\d+$/.test(window.location.hash)) {
                $('.collapse-toggle[data-target="' + window.location.hash  + '"]').click()
                window.location.hash = ''
            }
        }
        stylePaginator()
        /*****************  tooltips            ****************/
        $( ".btn-remove" ).tooltip( {title: "Remove File"} )
        $( ".btn-edit" ).tooltip( {title: "Edit Homework"} )
        $( ".btn-pending" ).tooltip( {title: "Start Homework"} )
        //$( ".btn-review" ).tooltip( {title: "Review Homework"} )

        //events
        $( ".ld-homework header" ).click( function( event ) {
            window.location.href = urlBase + getUser() + "/homework"
        })
        $('.ld-new-buttons.new-homework a').click(function(event) {
            event.preventDefault()
            $('#newHomeworkModal').modal('show')
        })
        $( "#upload-homework-file" ).click(function( event ) {
            event.preventDefault()
            $('#uploadHomeworkModal .contents').removeClass('hidden')
            $('#uploadHomeworkModal .loading').addClass('hidden')
            $('#uploadHomeworkModal button.close').removeClass('hidden')
            $('#uploadHomeworkModal').modal('show')
        })
        $('#uploadHomeworkModal .btn.add').on('click', addHomeworkFile)
        $('.ld-homework .btn-remove').on('click', removeHomeworkFile)
        if ($( "#homework-text-editor" ).length > 0) {
            $( "#homework-text-editor" ).summernote({
                height: 150,
                toolbar: [
                    ['style', ['style']],
                    [ "style", [ "bold", "italic", "underline" ] ],
                        //['fontsize', ["fontsize"]],
                    ['para', ['ul', 'ol', 'paragraph']],
                    //['insert', ['picture', 'link']], // no insert buttons
                ],
                  onPaste: function(event) {
                    event.preventDefault()
                    var selection = document.getSelection()
                    var offset = selection.anchorOffset
                    var element = selection.anchorNode
                    var inputText
                    var range = document.createRange()
                    range.selectNodeContents(selection.anchorNode)
                    range.collapse(false)
                    if (event.originalEvent.clipboardData) {
                        inputText = event.originalEvent.clipboardData.getData('text/plain')
                    } else if (window.clipboardData) {
                        inputText = window.clipboardData.getData('Text')
                    }
                    range = document.createRange();
                    newNode = document.createTextNode(inputText)
                    range.selectNode(selection.anchorNode);
                    range.setStart(selection.anchorNode, offset)
                    range.insertNode(newNode);
                    range.setStartAfter(newNode)
                    range.setEndAfter(newNode)
                    selection.removeAllRanges()
                    selection.addRange(range)
                },
                onChange: function(contents, $editable) {
                    dirtyHomeworkText = true
                }
            })
            removeDataTitle()
        }
        $( "#save-homework-text" ).click(function( event ) {
            event.preventDefault()
                dirtyHomeworkText = false
            $('textarea[name="content-homework"]').val($('#homework-text-editor').code())[0]
            $("#text-form").submit()
        })
        //register external protocl for oneNote
        $('.one-note-link').on('click', function(event) {
            var currentElement = $(event.currentTarget)
            var href = currentElement.attr('data-onenote-url')
            var fallbackHref = currentElement.attr('data-web-url')
            extenalProtocol('OneNote', href, fallbackHref)
        })
        $('.ld-homework .btn.submit').off('click')
        $('.ld-homework .btn.submit').on('click', function(event) {
            var form = $(this).closest("form")
            if (validForm(form)) {
                form.submit()
                //disable resubmitting form before page reloads
                $('.ld-homework .btn.submit').off('click')
            }
        })
        $(".ld-homework #submit-homework").on('click', submitHomework)
        $( ".btn-submit-review" ).click(function( event ) {
            event.preventDefault()
            var data = $(this).data()
            submitHomeworkDialog("Are you sure you want set the homework " + data.title + " as reviewed",  urlBase + "homework/reviewed/" + data.homeworkId  )
            $( "#submitHomeworkModal" ).modal( "show" )
        })

        $( ".ld-homework .btn-correct" ).click(function(event) {
            event.preventDefault()
            var data = $(event.currentTarget).data()
            submitHomeworkDialog("Are you sure you want save the homework " + data.title + " as reviewed",  urlBase + "homework/reviewed/" + data.homeworkId  )
            $( "#submitHomeworkModal" ).modal("show")
        })
        //overwrite skydrive values if using fileinput
        $('#uploadHomeworkModal input[type="file"]').on('change', function(event){
            $('#uploadHomeworkModal input[name="file-id"],' +
              '#uploadHomeworkModal input[name="file-name"]').remove()
        })
        // check if unsaved changes to dialog
        window.addEventListener("beforeunload", function(event) {
            if (dirtyHomeworkText) {
                event.returnValue = "You have unsaved changes to your homework."
            }
        })
        /*************** Review Homework ***********************/
        $('.ld-homework .student-homework-item') .on('click', fetchHomeworkData)
        $('.ld-homework input[type="checkbox"]').on('change', function(event) {
            if ($('.ld-homework  input[name="ids[]"]:checked').length > 0) {
                $('.ld-homework .btn-review-many').removeClass('inactive')
             } else {
                $('.ld-homework .btn-review-many').addClass('inactive')
             }
        })
        $('.ld-homework.list-items .btn-review-many').on('click', function(event) {
            if ($( event.currentTarget ).hasClass("inactive")) {
                return
            }
            var form = $('.ld-homework form.review-many')
            form.empty()
            $('.ld-homework input[name="ids[]"]:checked').each(function(index, element){
                form.append($(element.cloneNode()).addClass('hidden'))
            })
            form.submit()
        })
        //get stopwatch icon
        $('.time-remaining-icon').each(function(index, element) {
            var setTime = moment(element.getAttribute('data-set'))
            var dueTime = moment(element.getAttribute('data-due'))
            var nowTime = moment(element.getAttribute('data-now'))
            var submittedTime = moment(element.getAttribute('data-submitted'))
            var reviewedTime = moment(element.getAttribute('data-reviewed'))
            var timeleft = dueTime.diff(nowTime,'days')
            var timetaken = nowTime.diff(setTime,'days')
            if (submittedTime.isValid()) {
                timeleft = dueTime.diff(submittedTime,'days')
                if (timeleft >= 0) {
                    $(element).addClass('ontime full')
                    $(element).tooltip( {title: "Completed on time"} )
                } else {
                    $(element).addClass('late overdue')
                    $(element).tooltip( {title: "Completed late"} )
                }
                if (reviewedTime.isValid()) {
                    $(element).addClass('reviewed')
                }
            } else {
                if (reviewedTime.isValid()) {
                    timetaken = reviewedTime.diff(setTime,'days')
                }
                if (timeleft < 0) {
                    $(element).addClass('overdue')
                    $(element).tooltip( {title: "Overdue"} )
                } else if (timeleft == 0) {
                    $(element).addClass('full')
                    $(element).tooltip( {title: "Due today"} )
                } else if (timeleft <2) {
                    $(element).addClass('soon')
                    $(element).tooltip( {title: "Due tomorrow"} )
                } else if (timeleft/timetaken < 0.25) {
                    $(element).addClass('soon')
                    $(element).tooltip( {title: "Due soon"} )
                } else if (timeleft/timetaken < 0.5) {
                    $(element).addClass('middle')
                    $(element).tooltip( {title: "Not due yet"} )
                } else {
                    $(element).addClass('start')
                    $(element).tooltip( {title: "Not due yet"} )
                }
            }
            $(element).removeClass('hidden')
        })
        /****************  New/Edit homework  *******************/
        $("#visible-due-date").datepicker(datePickerObject)
        if ($('input[name="due-date"]').val() && moment($('input[name="due-date"]').val()).isValid()) {
            $('input[name="due-time"]').val('input[name="slot-id"]')
            showTimes($('input[name="due-date"]').val())
            $.uniform.update($('input[name="due-time"]'))
        }

        $("#schedule-date").datepicker(datePickerObject)
        if ($('input[name="hidden-schedule-date"]').val() && moment($('input[name="hidden-schedule-date"]').val()).isValid()) {
            $('input[name="due-time"]').val('input[name="slot-id"]')
            showTimes($('input[name="hidden-schedule-date"]').val())
            $.uniform.update($('input[name="due-time"]'))
        }

        var setDatePicker = {
            dateFormat : 'yy-mm-dd',
            altFormat: "DD, dd M",
            minDate : 0,
            beforeShowDay : enableDays,
            onClose: function(dateText, input){
              if(dateText && moment(dateText).isValid()){
                $('input[name="schedule-date"]').val(
                  moment(dateText).format("dddd, Do MMM"));
              }
            },
            firstDay : 1,
            prevText : "",
            nextText : ""
        }

        $("#schedule-date").datepicker(setDatePicker)

        $('.ld-homework .btn-remove-file').on('click', function(event) {
            $(event.currentTarget).closest('div').remove()
        })
        //homework submission type
        $('.ld-homework input[name="submission-type"]').on('change', function() {
            if ($('.ld-homework input[name="submission-type"]:checked').length == '0') {
                $('.ld-homework form.new input[name="homework-task"]').removeAttr('disabled')
                $('.ld-homework form.new .homework-task').removeClass('disabled')
                $.uniform.update('.ld-homework form.new input[name="homework-task"]')
                disableRequireFile()
            } else {
                $('.ld-homework form.new input[name="file-required"]').removeAttr('disabled')
                $('.ld-homework form.new .file-required').removeClass('disabled')
                $.uniform.update('.ld-homework form.new input[name="file-required"]')
                $('.ld-homework form.new input[name="type"]').val('1')
                disableHomeworkTaskType();
            }
        })
        if ($('.ld-homework input[name="submission-type"]:checked').length == '0') {
            disableRequireFile()
        }
        $('.ld-homework input[name="file-required"]').on('click', function() {
            if ($('.ld-homework form.new input[name="file-required"]:checked').val() == "on") {
                $('.ld-homework form.new input[name="type"]').val('2')
            } else {
                $('.ld-homework form.new input[name="type"]').val('1')
            }
        })

        $('.ld-homework input[name="homework-task"]').on('change', function() {
            if ($('.ld-homework input[name="homework-task"]:checked').length == '0') {
                $('.ld-homework form.new input[name="submission-type"]').removeAttr('disabled')
                $('.ld-homework form.new .submission-type').removeClass('disabled')
                $.uniform.update('.ld-homework form.new input[name="submission-type"]')
            } else {
                $('.ld-homework form.new input[name="type"]').val('4');
                disableSubmissionType();
                disableRequireFile();
            }
        })

        $('#removeHomeworkModal .btn.remove').on('click', function(event) {
            form = $('.ld-homework #removeHomework')
            form.submit()

        })
        $('.ld-homework .btn-delete.remove-homework').on('click', function(event) {
            event.preventDefault()
            $('#removeHomeworkModal').modal('show')
        })
        /* resourceImporter overwrites */
        //upload
        $('#resourceImportModal #upload .btn.add').on('click', uploadAndAttachNewResource)
        //resourcebag
        $('#resourceImportModal #resources .btn.add').on('click', attachExistingResources)
        //onedrive
        $('#resourceImportModal .remote .btn.add').on('click', attachRemoteResources)

        //        ->    LIST SEARCH
        $('#homeworkSearch .filter .resource-type').on('click', filterHomeworkStatus)
        $('#homeworkSearch .search select').on('change', filterHomeworkClass)
        $('#homeworkSearch .search-box input').on('keypress', function(event) {
            if (event.keyCode == 13) filterHomeworkKeyword()
            else $('.fa.ld-clear-search').addClass('hidden')
        })
        $('.ld-homework .ld-clear-search').on('click', clearSearch)
        $('#homeworkSearch .search-box .btn').on('click', filterHomeworkKeyword)
        //STUDENT set initial status
        if ($('.student .ld-homework #homeworkSearch').length == 1) {
            $('#homeworkSearch .filter .resource-type.to-do').click()
        }
        //TEACHER set class
        if ($('.teacher .ld-homework #homeworkSearch').length == 1) {
            searchParams['class'] = $('input[name="class-id"]').val()
        }

    }

    /***************************** new/edit homework *****************************/
    // due date
    function enableDays(date) {
        var day = date.getDay();
        var weekDays = document.getElementById("week-days").value;
        var days = weekDays.split(",");

        if (days.indexOf(day.toString()) >= 0) {
            return [true, "active orange"];
        } else {
            return [true, ""];
        }
    }
    function updateHomeworkDueDate(date, datePicker) {
        updateFormDate(date, datePicker)
        showTimes(date)
    }
    function showTimes(date) {
        var day = moment(date).day()
        var classId = $("#class-id")[0].value;
        var url = urlBase + "service/getClassTimes/" + classId + "/" + day;
        $.get(url, function(response) {})
    }
    function disableRequireFile() {
        $('.ld-homework form.new input[name="file-required"]').prop('checked', '')
        $('.ld-homework form.new input[name="file-required"]').attr('disabled', 'disabled')
        $('.ld-homework form.new .file-required').addClass('disabled')
        $.uniform.update('.ld-homework input[name="file-required"]')
    }
    function disableSubmissionType() {
        $('.ld-homework form.new input[name="submission-type"]').prop('checked', '')
        $('.ld-homework form.new input[name="submission-type"]').attr('disabled', 'disabled')
        $('.ld-homework form.new .submission-type').addClass('disabled')
        $.uniform.update('.ld-homework input[name="submission-type"]')
    }
    function disableHomeworkTaskType() {
        $('.ld-homework form.new input[name="homework-task"]').prop('checked', '')
        $('.ld-homework form.new input[name="homework-task"]').attr('disabled', 'disabled')
        $('.ld-homework form.new .homework-task').addClass('disabled')
        $.uniform.update('.ld-homework input[name="homework-task"]')
    }
    //#########################REVIEW HOMEWORK################################
    function fetchHomeworkData(event) {
        ldCollapseFunction(event)
        var collapseTargetEvent = event
        var currentTarget = $(event.currentTarget);
        var homeworkId = event.currentTarget.getAttribute('data-id')
        var contentBox = $('#hw' + homeworkId)
        if (contentBox.find('form').length > 0) {
            return;
        }
        var complete = 0;
        if($(currentTarget).closest('td').hasClass('reviewed')){
            complete = 1;
        }
        var url = urlBase + "service/homework/" + homeworkId
        $.get(url, function(response) {
            var work = response.homework

            if (work.text && work.text.trim() != "") {
                contentBox.append('<p id="text-inputs"><span class="text">' +
                    work.text.trim() + '</span></p>')
            }
            var files = response.files
            if (files && files.length != 0 ) {
                var fileBlock = $('<p class="mtop-20">')
                for (var i = 0; i < files.length; i++) {
                    fileBlock.append('<a href="' + urlBase + 'download/homework/' + files[i].id + '" target="_blank">' +
                        files[i].originalName + '<span class="fa fa-download"></span></a>')
                    fileBlock.append('<span class="help-note">' + files[i].description + '</span>')
                }
                contentBox.append(fileBlock)
            }
            var form = $('<form action="" class="inline feedback form" method="post">');
            form.append($('#homeworkReviewForm').html());
            if(complete == 1) {
                form.find('.btn-review-item').addClass('inactive');
            }
            form.find('.btn-review-item').on('click', function(event){
                if(complete == 1) {
                    return;
                }
                $(form).attr('action',urlBase + 'homework/reviewed/' + homeworkId);
                var data = form.serialize();
                $.post(form.attr('action'), data, function(newResponse){
                    currentTarget.find('.fa.fa-pencil').removeClass('fa-pencil').addClass('fa-eye');
                    currentTarget.find('.fa.fa-check').removeClass('fa-check').addClass('fa-eye');
                    $('input[type="checkbox"][value="' + currentTarget.attr('data-id') + '"]').closest('.ld-CheckClass').css('visibility', 'hidden');
                    $('#hw'+homeworkId + ' .btn-review-item-status').attr('value','Completed');
                    $("#hw"+homeworkId + ' .btn-review-item-status').removeClass('inactive');
                    $("#hw"+homeworkId + ' .btn-review-item').addClass('inactive');
                    $('#hw'+homeworkId).closest('td').addClass('reviewed');
                    complete = 1;
                    var text = form.find('textarea[name="feedback"]').text();
                    currentTarget.find('.feedback-block .feedback-text').text(text);
                    var mark = form.find('.feedback-mark .mark-option svg').clone();
                    currentTarget.find('.feedback-block .mark-option.stamp').empty().append(mark);
                    ldCollapseFunction(collapseTargetEvent);
                })
            })
            form.find('.btn-review-item-status').on('click', function(event){
                $(form).attr('action',urlBase + 'homework/uncheck/' + homeworkId);
                var data = form.serialize();
                if(complete == 0) {
                    return;
                }
                $.post(form.attr('action'), data, function(newResponse){
                        $('#hw'+homeworkId + ' .btn-review-item-status').attr('value','In Progress');
                        $('#hw'+homeworkId + ' .btn-review-item-status').addClass('inactive');
                        $('#hw'+homeworkId + ' .btn-review-item').removeClass('inactive');
                        currentTarget.find('.fa.fa-eye').addClass('fa-pencil').removeClass('fa-eye');
                        $('#hw'+homeworkId).closest('td').removeAttr('class');
                        $(currentTarget).siblings('.ld-CheckClass').removeAttr('style');
                        $('#hw'+homeworkId).siblings('.ld-CheckClass').find('input[type="checkbox"]').attr({class:"ld-check-child","data-parent":".ld-homework .ld-check-parent", name:"ids[]", value:homeworkId});
                        complete = 0;
                        var text = form.find('textarea[name="feedback"]').text();
                        currentTarget.find('.feedback-block .feedback-text').text(text);
                        var mark = form.find('.feedback-mark .mark-option svg').clone();
                        currentTarget.find('.feedback-block .mark-option.stamp').empty().append(mark);
                        ldCollapseFunction(collapseTargetEvent);
                })
            })
            var feedbacks = response.feedbacks
            if (feedbacks && feedbacks.length > 0) {
                var feedback = feedbacks[feedbacks.length - 1]
                form.append('<input type="hidden" name="feedbackId" value="' + feedback.id + '">')
                form.find('textarea[name="feedback"]').append(feedback.text)
                if (feedback.feedbackSetId) {
                    var selectedMark = form.find('.mark-option[data-id="' + feedback.feedbackSetId  + '"]').clone()
                    selectedMark.append('<input name="mark" value="' + selectedMark.attr('data-id') + '" class="hidden">')
                    form.find('.mark-groups').addClass('hidden')

                    var feedbackMark = form.find('.feedback-mark')
                    feedbackMark.removeClass('positive negative')
                    if (selectedMark.attr('data-value') > 0) {
                        feedbackMark.addClass('positive')
                    } else if (selectedMark.attr('data-value') < 0) {
                        feedbackMark.addClass('negative')
                    }
                    feedbackMark.find('.mark-option').remove()
                    feedbackMark.removeClass('hidden').append(selectedMark)

                    var removeBtn = $('<span class="remove-feedback-mark fa fa-times"></span>')
                    feedbackMark.append(removeBtn)
                    removeBtn.on('click', removeFeedbackMark)
                }
            }
            contentBox.append(form);
            if(complete == 1){
                $("#hw"+homeworkId + " .btn-review-item-status").attr('value','Completed');
                $("#hw"+homeworkId + " .btn-review-item-status").removeClass('inactive');
                $("#hw"+homeworkId + " .btn-review-item").addClass('inactive');
            }
            contentBox.find('.loading').toggle();
            contentBox.find('.mark-option').on('click', openMarkPopover);
        })
    }
    function openMarkPopover(event) {
        $('body').popover('destroy')
        var target = $(event.currentTarget)
        var container = target.closest('form')
        $('body').popover({
            html : true,
            trigger: "manual",
            container: container.find('.feedback-stamp'),
            placement : "buttom auto",
            content : function() {
                var popoverContainer = $('<div>')
                var options = '.mark-option[data-mark-group="' + target.attr('data-mark-group') + '"]'
                container.find(options).each(function(index, element) {
                    popoverContainer.append(element.cloneNode(true))
                })
                return popoverContainer
            }
        })
        $('body').popover('show')
        $('.popover .arrow').remove()
        var pop = $('.popover').css('top', event.currentTarget.offsetTop+event.currentTarget.clientHeight)
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
        var posLeft =  pop.offset().left
        var posWidth = pop.width()
        var allowedWidth = $(window).scrollLeft() + $(window).width()
        if (left < 0) {
            pop.css('left', 0)
        } else if(posLeft + posWidth > allowedWidth) {
            var offset =  posLeft + posWidth - allowedWidth
            pop.css('left', left - offset)
        }
        $('.popover .mark-option').on('click', function(event) {
            var selectedMark = $(event.currentTarget).clone()
            selectedMark.append('<input name="mark" value="' + selectedMark.attr('data-id') + '" class="hidden">')
            var feedbackMark = container.find('.feedback-mark')
            feedbackMark.removeClass('positive negative')
            if (selectedMark.attr('data-value') > 0) {
                feedbackMark.addClass('positive')
            } else if (selectedMark.attr('data-value') < 0) {
                feedbackMark.addClass('negative')
            }
            feedbackMark.find('.mark-option').remove()
            feedbackMark.removeClass('hidden').append(selectedMark)
            var removeBtn = $('<span class="remove-feedback-mark fa fa-times"></span>')
            feedbackMark.append(removeBtn)
            removeBtn.on('click', removeFeedbackMark)
            container.find('.mark-groups').addClass('hidden')
        })
        event.stopPropagation()
        $('body').off('click', closeMarkPopover).on('click', closeMarkPopover)//popover('destroy')
    }
    function removeFeedbackMark(event) {
        var form = $(event.currentTarget).closest('form')
        form.find('.mark-groups').removeClass('hidden')
        form.find('.feedback-mark').empty()
        form.find('.feedback-mark').addClass('hidden')
    }
    function closeMarkPopover(event) {
        $('body').popover('destroy')
    }
    //          Add resource
    /* use existing resource */
    function attachExistingResources(event) {
        //TODO check for file
        var checked = $('#resourceImportModal #resources input[type="checkbox"]:checked')
        if (checked.length == 0) {
            $('#resourceImportModal #resources .validation-box').addClass('error required')
            return
        } else {
            for (var i = 0; i < checked.length; i++) {
                var resource = resourceFunctions.resources[checked[i].value]
                var row = $('<div>')
                row.append('<input type="hidden" name="file-id[]" value="' + resource._id + '::' + resource.metadata.title + '">')
                row.append('<span class="col-sm-9">' + resource.metadata.title + '</span>')
                $('.add-file-list').append(row)
                var remove = $('<span class="col-sm-3"><span class="btn-remove btn-icon fa fa-times" title="Remove"></span></span>')
                row.append(remove)
                remove.on('click', function(event) {
                    $(event.currentTarget).closest('div').remove()
                })
            }
            $('.ld-homework form.new input[name="submission-type"]').prop("checked", true)
            $('.ld-homework form.new input[name="file-required"]').prop("checked", true)
            $('.ld-homework form.new input[name="file-required"]').removeAttr('disabled')
            $('.ld-homework form.new .file-required').removeClass("disabled")
            $('.ld-homework form.new input[name="type"]').val('2')
            $.uniform.update('.ld-homework form.new input[name="submission-type"]')
            $.uniform.update('.ld-homework form.new input[name="file-required"]')
        }
        $('#resourceImportModal').modal('hide')
    }
    /*add new resource*/
    function uploadAndAttachNewResource(event) {
        var formData = new FormData();
        var resourceData = {}
        var title = ""
        if ($('#resourceImportModal .fileInput').attr('type') === 'button') { //using icab
            formData = new FormData($('#resourceImportModal #fileUploadIcabFix')[0])
            title = $('#resourceImportModal .fileInput').val()
            if (title == "Select File" && $('#resourceImportModal #fileUploadIcabFix input[type="hidden"]').length == 0) {
                $('#resourceImportModal #upload .validation-box').addClass('error required')
               return
            }
            formData.append('type', 'file') //::TODO get type from title extension.
            formData.append('title',  title)
            //formData.append('file', file, file.name)
        } else {
            var files = $('#resourceImportModal .fileInput')[0].files
            if (files.length == 0) {
                $('#resourceImportModal #upload .validation-box').addClass('error required')
                return
            }
            var file = files[0]
            title = file.name
            resourceData['content-type'] = file.type
            if (file.type.split('/')[0] == 'image') {
                resourceData['type'] = 'image'
            } else if (file.type.indexOf('pdf') != -1) {
                resourceData['type'] = 'pdf'
            } else {
                resourceData['type'] =  'file'
            }
            formData.append('file', file, file.name)
            formData.append('title',  file.name.slice(0, file.name.lastIndexOf('.')))
        }
        formData.append('subject', $('.hidden input[name="subject"]').val())
        formData.append('level-tags', $('.hidden input[name="cohortStage"]').val())
        formData.append('type-tags', 'homework')
        formData.append('owner', $('.hidden input[name="owner"]').val())
        formData.append('visibility', '1')
        formData.append('creator', $('.hidden input[name="creator"]').val())
        formData.append('clientId', $('.hidden input[name="client-id"]').val())
        formData.append('key', $('.hidden input[name="key"]').val())
        resourceFunctions.uploadResource(resourceData, formData, function(response) {
            var row = $('<div>')
            row.append('<input type="hidden" name="file-id[]" value="' + response.id + '::' + title + '">')
            row.append('<span class="col-sm-9">' + title + '</span>')
            $('.add-file-list').append(row)

            var remove = $('<span class="col-sm-3"><span class="btn-remove btn-icon fa fa-times" title="Remove"></span></span>')
            row.append(remove)
            remove.on('click', function() {
                row.remove()
            })
            $('#resourceImportModal').modal('hide')
        }, function(request, status, error){
            $('#resourceImportModal #upload .error').removeClass('hidden')
            $('#resourceImportModal #upload .loading').addClass('hidden')
        })
        $('.ld-homework .submission-type input[name="submission-type"][value="1"]').click()
        $('.ld-homework form.new input[name="file-required"]').prop("checked", true)
        $('.ld-homework form.new input[name="type"]').val('2')
        $.uniform.update('.ld-homework form.new input[name="file-required"]')
        $('#resourceImportModal #upload .contents').addClass('hidden')
        $('#resourceImportModal #upload .loading').removeClass('hidden')
        $('#resourceImportModal button.close').addClass('hidden')
        $('#resourceImportModal .ld-tabs.nav a').off("click")
    }
    /*upload from onedrive */
    function attachRemoteResources(event) {
        var id = $(event.currentTarget).closest('.remote').attr('id')
        var checked = $('#resourceImportModal #' + id + ' .remote-browser input[type="checkbox"]:checked')
        if (checked.length == 0) {
            $('#resourceImportModal #' + id + ' .validation-box').addClass('error required')
            return
        } else {
            var deferreds = []
            $('#resourceImportModal #' + id + ' .contents').addClass('hidden')
            $('#resourceImportModal #' + id + ' .loading').removeClass('hidden')
            $('#resourceImportModal button.close').addClass('hidden')
            $('#resourceImportModal .ld-tabs.nav a').off("click")
            for (var i = 0; i < checked.length; i++) {
                var resourceElement = checked[i]
                var postVals = {
                    'url': resourceElement.getAttribute('data-source'),
                    'name': resourceElement.getAttribute('data-name')
                }
                if (resourceElement.getAttribute('data-bearer')) {
                    postVals['bearer'] = resourceElement.getAttribute('data-bearer')
                }
                deferreds.push(
                    $.post(urlBase + "resources/upload", postVals,
                    (function(resourceElement) { return function(response) {
                        if (!response.response) return
                        var id = JSON.parse(response.response).id
                        var title = resourceElement.getAttribute('data-name')
                        resourceFunctions.resources[id] = {
                            '_id': id,
                            'metadata': {'title': title}
                        }
                        var resource = resourceFunctions.resources[id]
                        resource.filename = title
                        resourceData = {
                            'type': 'file',
                            'title':  title,
                            'subject': $('.hidden input[name="subject"]').val(),
                            'level-tags': $('.hidden input[name="cohortStage"]').val() || "",
                            'type-tags': 'homework',
                            'owner': $('.hidden input[name="owner"]').val(),
                            'creator': $('.hidden input[name="creator"]').val(),
                            'clientId': $('.hidden input[name="client-id"]').val()
                        }
                        resource.metadata = resourceData
                        resourceFunctions.saveResource(resource)
                        var row = $('<div>')
                        row.append('<input type="hidden" name="file-id[]" value="' + id + '::' + title + '">')
                        row.append('<span class="col-sm-9">' + title + '</span>')
                        $('.add-file-list').append(row)
                        var remove = $('<span class="col-sm-3"><span class="btn-remove btn-icon fa fa-times" title="Remove"></span></span>')
                        row.append(remove)
                        remove.on('click', function(event) {
                            $(event.currentTarget).closest('div').remove()
                        })
                    }}(resourceElement)))
                )
            }
            $.when.apply($, deferreds).then(function() {
                $('.ld-homework .submission-type input[name="submission-type"][value="1"]').click()
                $('.ld-homework form.new input[name="file-required"]').prop("checked", true)
                $('.ld-homework form.new input[name="type"]').val('2')
                $.uniform.update('.ld-homework form.new input[name="file-required"]')
                $('#resourceImportModal').modal('hide')
            })
        }
    }
    /***************************** existing(do) homework *****************************/
    function addHomeworkFile(event) {
        var deferreds = []
        if (dirtyHomeworkText) {
            dirtyHomeworkText = false
            var form = $('#text-form')
            $('textarea[name="content-homework"]').val($('#homework-text-editor').code())[0]
            var data = form.serializeArray()
            var postData = {}
            for (var i = 0; i < data.length; i++) {
                postData[data[i]['name']] = data[i]['value']
            }
            var url = form.attr('action')
            deferreds.push($.post(url, postData))
        }
        $.when.apply($, deferreds).then(function() {
            form = $('#uploadHomeworkModal form')
            if (validForm(form)) {
                $('#uploadHomeworkModal .contents').addClass('hidden')
                $('#uploadHomeworkModal .loading').removeClass('hidden')
                $('#uploadHomeworkModal button.close').addClass('hidden')
                form.submit()
            }
        })
    }
    function removeHomeworkFile(event) {
        var target = $(event.currentTarget)
        var currentRow = target.closest('.file-row')
        message = "Are you sure you want to remove the file " + target.attr('data-name') + "."
        deleteUrl = urlBase + 'homework/removeFile/' + target.attr('data-file-id')
        createRemoveItemDialog(message, deleteUrl, "div.ld-homework", function(response) {
            currentRow.remove()
            if ($('.ld-homework .files-uploaded table tr').length == 2) {
                $('.ld-homework .files-uploaded table tr').removeClass('hidden')
                $('#submit-homework').addClass('btn-inactive').off('click')
            }
            $('#removeItemModal').modal('hide')
        })
        $('#removeItemModal').modal('show')
    }

    /***************************** submit homework *****************************/
    function submitHomework(event) {
        var form = $('#hwk-frm-submit')
        if (validForm(form)) {
            var deferreds = []
            if (dirtyHomeworkText) {
                dirtyHomeworkText = false
                var form = $('#text-form')
                $('textarea[name="content-homework"]').val($('#homework-text-editor').code())[0]
                var data = form.serializeArray()
                var postData = {}
                for (var i = 0; i < data.length; i++) {
                    postData[data[i]['name']] = data[i]['value']
                }
                var url = form.attr('action')
                deferreds.push($.post(url, postData))
            }
            $.when.apply($, deferreds).then(function() {
                window.location.href = $('.ld-homework #submit-homework').data('link')
                $('.ld-homework #submit-homework').off('click');
            })
        }
    }
    function submitHomeworkDialog(text, ref) {

        var modal = $( "<div class=\"modal fade\" id=\"submitHomeworkModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">" )
        var modalHeader = $( "<div class=\"modal-header\"><button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button><h4 class=\"modal-title\">Submit Homework</h4></div>")
        var modalBody = $ ( "<div class=\"modal-body\"><p>" + text + " </p></div>" )

        //buttons
        var send = $( "<a>", {
            href: ref,
            "class": "btn",
            html: "Yes"
        })

        var cancel = $( "<button>", {
            "class": "btn btn-cancel",
            "data-dismiss": "modal",
            html: "Cancel"
        })
        var modalFooter = $ ( "<div class=\"modal-footer\"></div>" )
        modalFooter.append( send )
        modalFooter.append( cancel )

        var modalDialog = $ ( "<div class=\"modal-dialog\"></div>" )

        var modalContent = $ ( "<div class=\"modal-homework modal-content\"></div>" )
        modalContent.append( modalHeader )
        modalContent.append( modalBody )
        modalContent.append( modalFooter )

        modalContent.appendTo( modalDialog )
        modalDialog.appendTo( modal )
        modal.appendTo( "div.ld-homework" )
    }

    var stylePaginator = function() {
        var paginator = $( ".pagination" )
        if ( paginator.length == 0 )
            return
        var pageNumber = 1
        var startPos = window.location.href.indexOf( "?" )
        startPos = window.location.href.substring( startPos).indexOf( "page" )
        if ( startPos != -1 ) {
            var endPos = window.location.href.indexOf( "&" )
            pageNumber = parseInt(window.location.href.substring( startPos, endPos ).split( "=" )[1])
        }
        paginator.children().eq(pageNumber).addClass("this-page")
        paginator.children().eq(pageNumber).click(function(event) {
            event.preventDefault()
        })
        if ( pageNumber == 1) {
            paginator.addClass("AtStart")
            $( ".pagination .Prev" ).replaceWith( $( "<span class=\"fa fa-chevron-left Prev\"></span>" ) )
        }
        if ( pageNumber == paginator.children().length - 2) {
            paginator.addClass("AtEnd")
            $( ".pagination .Next" ).replaceWith( $( "<span class=\"fa fa-chevron-right Next\"></span>" ) )
        }

    }
    //############################## SEARCH ####################################
    var getSearchParams = function(){
        var params = Object.keys(searchParams).map(function(elem) { return elem+ "=" + encodeURIComponent(searchParams[elem])})
        if (params.length > 0) {
            return "?" + params.join('&')
        } else {
            return ""
        }
    }
    var filterHomeworkKeyword = function(event) {
        var val = $('#homeworkSearch .search-box input').val()
        if (val.length > 0) {
            searchParams['keyword'] = val
        } else if ( val.length == 0) {
            delete searchParams['keyword']
        }
        if (getUser() == "teacher") {
            fetchTeacherHomework()
        } else {
            fetchStudentHomework()
        }
    }
    var clearSearch = function() {
        $('#homeworkSearch .search-box input').val('')
        $('.fa.ld-clear-search').addClass('hidden')
        delete searchParams['keyword']
        if (getUser() == "teacher") {
            fetchTeacherHomework()
        } else {
            fetchStudentHomework()
        }
    }
    var filterHomeworkStatus = function(event) {
        var status = event.currentTarget.getAttribute('data-status')
        var active = $(event.currentTarget).hasClass('active')
        $('#homeworkSearch .filter .resource-type').removeClass('active')
        if (!active) {
            $(event.currentTarget).addClass('active')
            searchParams.status = status
        } else {
            delete searchParams.status
        }
        fetchStudentHomework()
    }
    var filterHomeworkClass = function(event) {
        var val = event.currentTarget.value
        if (val) {
            searchParams['class'] = val
        } else {
            delete searchParams['class']
        }
        fetchStudentHomework()
    }
    //######################### STUDENT HOMEWORK SEARCH ########################
    var addHomeworkRow = function(homework) {
        var timeElem = $('<td class="format-date">').text(textToTime(homework.dueDate))
        var link = $('<a href="' + urlBase + 'student/homework/show/' +
            homework.id + '" class="btn-icon">')
        var content = $('<a href="' + urlBase + 'student/homework/show/' +
            homework.id + '">')

        var stamp = ""
        if(homework.feedbacks){
            var feedback = homework.feedbacks[0]
            content.text(feedback.description)
            stamp = feedback.stamp
        } else {
            content.text(homework.description)
        }

        var row = $('<tr class="collapse-toggle" data-target="#hw' +
            homework.id + '"  data-icon="#hwicon' + homework.id + '">' +
            '<td width="40%" id="hwicon' + homework.id + '" class="semibold ' +
            'collapse-icon collapse-icon-close">' +
            homework.title + '</td>' +
            '<td  width="15%">' + homework.subject + '</td>' +
            '<td  width="15%">' + homework.teacher + '</td>' +
            '</tr>')
        row.append(timeElem)
        row.append($('<td width="5%">').append(link))

        if (homework.status < 2) {
            var relative = textToRelativeTime(homework.dueDate)
            timeElem.addClass(relative.status)
            timeElem.text(relative.time)
            link.addClass('btn-edit fa fa-pencil')
            link.attr('href', urlBase + 'student/homework/do/' + homework.id)
            content.attr('href', urlBase + 'student/homework/do/' + homework.id)
        } else if (homework.status == 2) {
            link.addClass('btn-review fa fa-check')
        } else {
            link.addClass('btn-review fa fa-eye')
        }

        $('.view-manager .list').append(row)
        row.on("click", ldCollapseFunction)
        var description = $('<tr>')
        description.append($('<td class="td-collapse" colspan="5">').append(
        $('<div id="hw' + homework.id + '" class="collapse">').append(
        $('<span class="text-cell">' + stamp).append(content))) )
        row.after(description)
    }
    var addHomeworkCard = function(homework) {
        var timeElem = $('<div class="format-date">').text(textToTime(homework.dueDate))
        var hasFile = $('<span class="mright-10 fa-lg fa fa-paperclip pull-left mtop-5"></span>')

        var link = $('<a href="' + urlBase + 'student/homework/show/' +
            homework.id + '" class="btn-icon">')

        var content = $('<a class="description-text" href="' + urlBase + 'student/homework/show/' +
            homework.id + '">')
            content.text(homework.description)
        var stamp = ""
        var cardContent = $('<div style="word-wrap: break-word;" class="homework-description"><h4 class="semibold"><span class="color"> ' + homework.subject  +
            ' | </span>' + homework.teacher + '</h4>')

        if(homework.hasFeedbacks == true){
            var numFeedbacks = homework.feedbacks.length;
            var feedback = homework.feedbacks[numFeedbacks - 1];
            content.text(feedback.description)
            stamp = feedback.stamp
            var card = $('<div class="ld-card-border ld-card-background ld-card-feedback">')
            cardContent.append($('<h6 class="semibold homework-title">' + homework.title + '</h6>'))
            cardContent.append(content)
        } else {
            content.text(homework.description)
            var card = $('<div class="ld-card-border ld-card-background">')
            cardContent.append($('<h6 class="semibold">' + homework.title + '</h6>'))
            cardContent.append(content)
        }


        card.append(stamp)
        card.append(cardContent)
        if(homework.hasFiles || homework.hasResources){
          card.append(hasFile)
        }
        card.append(timeElem)
        card.append($('<div class="homework-action">').append(link))

        if (homework.status < 2) {
            var relative = textToRelativeTime(homework.dueDate)
            timeElem.addClass(relative.status)
            timeElem.text(relative.time)
            link.addClass('btn-edit fa fa-pencil')
            link.attr('href', urlBase + 'student/homework/do/' + homework.id)
            content.attr('href', urlBase + 'student/homework/do/' + homework.id)
        } else if (homework.status == 2) {
            link.addClass('btn-review fa fa-check')
        } else {
            link.addClass('btn-review fa fa-eye')
        }

        card = $('<div class="ld-card col-xs-12 col-sm-6 col-md-4 col-lg-4">').append(card)
        $('.view-manager .grid').append(card)
    }
    var fetchStudentHomework = function(conditions) {
        var params = getSearchParams()
        var url = urlBase + '/api/homeworks/' + $('body').attr('data-uid') + params
        $('.view-manager .loading').removeClass('hidden')
        $('.view-manager > .no-content').addClass('hidden')
        $('.view-manager .list').empty()
        $('.view-manager .grid').empty()
        $.get(url, function(response) {
            var hasResult = false
            for (var i = 0; i < response.length; i++) {
                var homework = response[i]
                if (searchParams['status'] == 1) {
                    var overdue = $('#homeworkSearch .filter .resource-type.active').hasClass('overdue-count')
                    if (overdue && moment().isBefore(moment(homework.dueDate))) {
                        continue
                    } else if (!overdue &&
                        moment(homework.dueDate).isBefore(moment($('input[name="expiry-date"]').val()))) {
                        continue
                    }
                }
                hasResult = true
                addHomeworkRow(homework)
                addHomeworkCard(homework)

            }
            if (searchParams['keyword'] && searchParams['keyword'] != "") {
              $('.fa.ld-clear-search').removeClass('hidden')
            }
            $('.view-manager .loading').addClass('hidden')
            if (!hasResult) {
                $('.view-manager > .no-content').removeClass('hidden')
                return
            }
            $('.homework-description').dotdotdot()
            $('#homeworkList .list').removeClass('hidden')
        })
    }

    //######################### TEACHER HOMEWORK SEARCH ########################
    var addTeacherHomeworkList = function(homework) {
        var keyword = searchParams['keyword']
        var link = urlBase + 'teacher/homework/list/' + homework.id
        var index = (homework.title).search(new RegExp(keyword, 'i'))
        var title = homework.title
        var desc = homework.description

        if (index > -1) {
            title .slice(0, index) + '<strong class="color">' +
            title.slice(index, index + keyword.length) + '</strong>' +
            title.slice(index + keyword.length)
        }
        index = (homework.description).search(new RegExp(keyword, 'i'))

        if (index < -1 && desc.length > 100) {
            desc = desc.slice(0, 90) + "..."
        } else if (index > -1) {
            if (desc.length < 100) {
                desc = desc.slice(0, index) + '<strong class="color">' +
                  desc.slice(index, index + keyword.length) + '</strong>' +
                  desc.slice(index + keyword.length)
            } else {
                if (index + keyword.length < 90) {
                    desc = desc.slice(0, index) + '<strong class="color">' +
                    desc.slice(index, index + keyword.length) + '</strong>' +
                    desc.slice(index + keyword.length, 100) +
                    "..."
                } else if (desc.length - index < 90) {
                    desc = '...' + desc.slice(desc.length - 90, index) + '<strong class="color">' +
                    desc.slice(index, index + keyword.length) + '</strong>' +
                    desc.slice(index + keyword.length)
                } else {
                    desc = '...' + desc.slice(index-50, index) + '<strong class="color">' +
                    desc.slice(index, index + keyword.length) + '</strong>' +
                    desc.slice(index + keyword.length, index + keyword.length + 50) +  "..."
                }
            }
        }
        var container = '<div class="container-row">'

        container += '<div class="container-cell large"><a href="' + link + '">' +
          '<span class="semibold">' + title + '</span>' +
          '<span class="ld-legend-title">' + textToTime(homework.dueDate) + '</span>'
        container += '<span>' +  desc + '</span>'
        container += '</a></div>'
        container += '<div class="container-action container-cell">'
        if (homework.submitted > 0) {
            container += '<div class="button-action"><a href="' + link +
            '?filter=2" class="color">' +  homework.submitted + '</a>'
        } else {
            container += '<div class="color ld-btn-inactive button-action">0'
        }
        container += ' <span class="btn-icon fa fa-check"></span></div>'
        if (homework.pending > 0) {
            container += '<div class="button-action"><a href="' + link +
            '?filter=1" class="color">' +  homework.pending + '</a>'
        } else {
            container += '<div class="color ld-btn-inactive button-action">0'
        }
        container += ' <span class="btn-icon fa fa-pencil"></span></div>'
        if (homework.reviewed > 0) {
            container += '<div class="button-action"><a href="' + link +
            '?filter=3" class="color">' +  homework.reviewed + '</a>'
        } else {
            container += '<div class="color ld-btn-inactive button-action">0'
        }
        container += ' <span class="btn-icon fa fa-eye"></span></div>'
        container += '</div></div>'
        $('#homeworkList .list').append(container)
    }
    var fetchTeacherHomework = function(conditions) {
        if (!searchParams['keyword'] || searchParams['keyword'] == "") {
            $('#homeworkList .list, #homeworkList .loading, #homeworkList > .no-content').addClass('hidden')
            $('#homeworkSearch .search-status-box').addClass('hidden')
            $('#homeworkItems').removeClass('hidden')
            return
        }
        $('#homeworkSearch .search-text').text(searchParams['keyword'])
        var params = getSearchParams()
        var url = urlBase + '/api/homeworks/' + $('body').attr('data-uid') + params
        $('#homeworkList .loading').removeClass('hidden')
        $('#homeworkList > .no-content').addClass('hidden')
        $('#homeworkSearch .search-status-box').removeClass('hidden')
        $('#homeworkList .list').empty()
        $.get(url, function(response) {
            for (var i = 0; i < response.length; i++) {
                var homework = response[i]
                addTeacherHomeworkList(homework)
            }
            $('.fa.ld-clear-search').removeClass('hidden')
            $('#homeworkList .loading').addClass('hidden')
            $('#homeworkItems').addClass('hidden')
            if (response.length == 0) {
                $('#homeworkList > .no-content').removeClass('hidden')
                return
            }

            $('#homeworkList .list').removeClass('hidden')
        })
    }

    return {
        init: init
    };
})()
