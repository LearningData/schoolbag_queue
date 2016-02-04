var classesPage = (function() {
    //resources subsection is found in classesResources.js
    //init
    var resourceUrl = $("input[name='resourceBagUrl']").val()
    var resources = {}
    var cacheUrl = $("input[name='cacheBagUrl']").val()
    var slotIdCount = 0
    var init = function() {
        // Events
        $( ".ld-classes header" ).click( function( event ) {
            window.location.href = urlBase + getUser() + "/classes"
        })






        $(".ld-classes .nav a").on("click", checkLoadResources)
        $("#AddFileModal .nav a").off("click", checkLoadResources)

        $('.ld-classes .edit-class .btn-delete').click(function(event) {
            event.preventDefault()
            var data = $(event.currentTarget).data()
            var message = _t('confirm-delete-class')
            removeItemDialog(message, urlBase + 'teacher/deleteClass/' + data.classId, '.ld-classes')
            $( "#removeItemModal" ).modal( "show" )
        })

        $(".ld-classes .edit-class").keypress( function( event ) {
            if (event.keyCode == 13) event.preventDefault()
        })

        //add resource events
        $('.ld-classes .btn-new-class').on('click',function(event) {
            $('.ld-classes .btn-new-class').addClass('active')
            $('.ld-classes .btn-join-class').removeClass('active')
            $('.ld-classes .join-class').addClass('hidden')
            $('.ld-classes .edit-class').removeClass('hidden')
        })
        $('.ld-classes .btn-join-class').on('click',function(event) {
            $('.ld-classes .btn-join-class').addClass('active')
            $('.ld-classes .btn-new-class').removeClass('active')
            $('.ld-classes .edit-class').addClass('hidden')
            $('.join-class').removeClass('hidden')
        })
        $('.ld-classes .btn.submit').click( function(event) {
            var form = $(this).closest("form")
            if (validForm(form)) {
                form.submit()
                //disable resubmitting form before page reloads
                $('.ld-classes .btn.submit').off('click')
            }
        })
        $( ".ld-classes .btn:submit").off("click")
        $( ".ld-classes .btn:submit").click( function( event ) {
            event.preventDefault()
            event.stopPropagation()
            var form = $(event.currentTarget).closest("form")
            if (validForm(form)) {
                form.submit()
            }
        })
        //edit class events
        $(".ld-classes .select-image").on("change", changePreviewPhoto)
        $(".ld-classes .file-dnd").on("dragover", function () { this.className = 'hover'; return false; });
        $(".ld-classes .select-day select, .ld-classes .select-time select").removeClass('hidden')
        $(".ld-classes .select-day select").on('change', changeDayValue)
        $(".ld-classes .select-time select").on('change', changeTimeValue)
        if ($(".ld-classes .select-day select").length>0) {
            updateSelectOptions()
        }
        $(".ld-classes .remove-slot").on("click", removeSlot)
        $(".ld-classes .create-slot").on("click", addSlot)
        // add image fileImporter overrides for class image
        $('#openImageModal').on('click', function(event) {
            openAddResourceModal()
            $('#resourceImportModal #upload .btn.add').on('click', uploadAndAttachImage)
            $('#resourceImportModal #resources .btn.add').on('click', attachExistingImage)
            $('#resourceImportModal .remote .btn.add').off('click').on('click', attachRemoteImage)
        })
        //add resource events
        $('.ld-classes .new-topic').on('click', classesResource.createNewTopicElement)
        $('.ld-classes .load-success .no-content .action').on('click', classesResource.createNewTopicElement)
        $( ".ld-classes .new-topic" ).click(function() {
          $('#newTopicBlock input').focus()
        });

        //close modal show iframes
        $('.btn-dismiss, .modal-header button').on('click', function(){
            $('iframe').css('visibility', 'visible')
        })
        $('.modal').on('click', function(event) {
            if($(event.target).hasClass('modal')) {
                $('iframe').css('visibility', 'visible')
            }
        })
        $('.btn-dismiss, .modal-header button, .btn.add-resource').on('click', function(){
            $('iframe').css('visibility', 'visible')
        })
        $('.ld-classes .nav  a[href="' + window.location.hash + '"]').not('#AddFileModal a[href="' + window.location.hash + '"]').click()


        //Prevent hash link jump
        if (location.hash) {
            window.scrollTo(0, 0);
            setTimeout(function() {
                window.scrollTo(0, 0);
             }, 1);
         }


      }







    /*
     *  Navigation
     */
    function checkLoadResources(event){
        var href = event.currentTarget.getAttribute("href")
        if ( href == "#topics") {
           classesResource.fetchResources()
        } else if (href =="#homework") {
            if(getUser() == "teacher" && charts.workLoad) {
                charts.workLoad.height = 80
                charts.workLoad.draw()
            }
        }
       return false;
    }
    /*
     * edit class * photo functions
     */

    function uploadAndAttachImage(event) {
        var formData = new FormData();
        var resourceData = {}
        $('#resourceImportModal .validation-box').removeClass('error one type required custom')
        var files = $('#resourceImportModal .fileInput')[0].files
        if (files.length == 0) {
            $('#resourceImportModal #upload .validation-box').addClass('error required')
            return
        }
        file = files[0]
        resourceData['content-type'] = file.type
        if (file.type.split('/')[0] == 'image') {
            resourceData['type'] = 'image'
        } else {
            $('#resourceImportModal #upload .validation-box').addClass('error custom')
            return
        }
        formData.append('file', file, file.name)
        formData.append('title',  file.name.slice(0, file.name.lastIndexOf('.')))
        formData.append('subject', $('input[type="hidden"][name="subject"]').val())
        formData.append('type-tags', 'cover-image')
        formData.append('visibility', '1')
        formData.append('owner', $('input[type="hidden"][name="owner"]').val())
        formData.append('creator', $('input[type="hidden"][name="creator"]').val())
        formData.append('clientId', $('input[type="hidden"][name="client-id"]').val())
        formData.append('key', $('input[type="hidden"][name="key"]').val())

        resourceFunctions.uploadResource(resourceData, formData, function(response) {
            var image = $('<div class="existing-file">')
            image.append('<input type="hidden" name="resource-id" value="' + response.id + '">')
            image.append('<img src="' + $('.hidden input[name="cacheBagUrl"]').val() +
                           '/' + response.id + '/small" alt="Class Image"' +
                'style="border:1px solid black;width:200px; height:150px">')
            $('div.existing-file').replaceWith(image)
            $('#resourceImportModal').modal('hide')
        }, function(request, status, error){
            $('#resourceImportModal #upload .error').removeClass('hidden')
            $('#resourceImportModal #upload .loading').addClass('hidden')
        })
        $('#resourceImportModal #upload .contents').addClass('hidden')
        $('#resourceImportModal #upload .loading').removeClass('hidden')
        $('#resourceImportModal button.close').addClass('hidden')
    }
    /* use existing resource */
    function attachExistingImage(event) {
        console.log(0)
        //TODO check for file
        var checked = $('#resourceImportModal #resources input[type="checkbox"]:checked')
        if (checked.length == 0) {
            $('#resourceImportModal #resources .validation-box').addClass('error required')
            return
        } else {
            for (var i = 0; i < checked.length; i++) {
                var resource = resourceFunctions.resources[checked[i].value]
                var image = $('<div class="existing-file">')
                image.append('<input type="hidden" name="resource-id" value="' + resource._id + '">')
                image.append('<img src="' + $('input[type="hidden"][name="cacheBagUrl"]').val() +
                           '/' + resource._id + '/small" alt="Class Image"' +
                'style="border:1px solid black;width:200px; height:150px">')
                $('div.existing-file').replaceWith(image)
            }
        }
        $('#resourceImportModal').modal('hide')
    }
    function attachRemoteImage(event) {
        var id = $(event.currentTarget).closest('.remote').attr('id')
        $('#resourceImportModal .validation-box').removeClass('error one type required custom')
        var checked = $('#resourceImportModal #' + id + ' .remote-browser input[type="checkbox"]:checked')
        if (checked.length == 0) {
            $('#resourceImportModal #' + id + '  .validation-box').addClass('error required')
            return
        } else {
            var deferreds = []
            if (checked.length > 1) {
                $('#resourceImportModal #' + id + '  .validation-box').addClass('error one')
                return
            } else if (checked[0].getAttribute('data-type') != "photo") {
                $('#resourceImportModal #' + id + '  .validation-box').addClass('error custom')
                return
            }
            $('#resourceImportModal #' + id + '  .contents').addClass('hidden')
            $('#resourceImportModal #' + id + '  .loading').removeClass('hidden')
            $('#resourceImportModal button.close').addClass('hidden')

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
                        var id = JSON.parse(response.response).id
                        var title = resourceElement.getAttribute('data-name')
                        resourceFunctions.resources[id] = {
                            '_id': id,
                            'metadata': {'title': title}
                        }
                        var resource = resourceFunctions.resources[id]
                        resource.filename = title
                        resourceData = {
                            'type': 'image',
                            'title':  title,
                            'subject': $('input[type="hidden"][name="subject"]').val(),
                            'type-tags': 'cover-image',
                            'owner': $('input[type="hidden"][name="owner"]').val(),
                            'creator': $('input[type="hidden"][name="creator"]').val(),
                            'clientId': $('input[type="hidden"][name="client-id"]').val()
                        }
                        resource.metadata = resourceData
                        resourceFunctions.saveResource(resource)
                        var image = $('<div class="existing-file">')
                        image.append('<input type="hidden" name="resource-id" value="' + id + '">')
                        image.append('<img src="' + $('input[type="hidden"][name="cacheBagUrl"]').val() +
                           '/' + id + '/small" alt="Class Image"' +
                        'style="border:1px solid black;width:200px; height:150px">')
                        $('div.existing-file').replaceWith(image)
                    }}(resourceElement)))
                )
            }
            $.when.apply($, deferreds).then(function(){
                $('#resourceImportModal').modal('hide')
            })
        }
    }
    function changePreviewPhoto(event) {
        if (window.File) { //check for file api ie9 does not have this
            var image = event.currentTarget.files[0];
            var imgElement = $("<img src='" + window.URL.createObjectURL(image) + "' style='width:250px;height:180px'>")
            //release url resource on image load
            imgElement.onload = function () {
                window.URL.revokeObjectURL(this.src)
            }
            $(".ld-classes .image-preview").empty()
            $(".ld-classes .image-preview").append(imgElement)
        }
    }
    /* autocomplete subject */
    $('.ld-classes input[name="subject-label"]').autocomplete({
        source: function(request, response) {
            //using regex to ignore case, need escapeRegex to escape special chars from user input
            var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
            response($('select[name="subject-id"]').find( "option" ).map(function(index, option) {
                var text = $(option).text();
                if(option.value && ( !request.term || matcher.test(text) ) )
                    return {
                        label: text.trim(),
                        value: option.value,
                      };
                })
            )},
        focus: function(event, ui) {
                $('input[name="subject-label"]').val(ui.item.label)
                return false
        },
        select: function(event, ui) {
                $('input[name="subject-label"]').val(ui.item.label);
                $('select[name="subject-id"]').val(ui.item.value)
                validation.validateElement($('select[name="subject-id"]')[0])
                return false
        },
        change: function(event, ui) {
                if (ui.item === null) {
                var val = new RegExp("^" + $.ui.autocomplete.escapeRegex(event.currentTarget.value) + "$", "i");
                var options = $('option').filter(function(index,element) {
                    if (val.test($(element).text().trim()))
                    return element
                })
                if (options.length > 0) {
                    $('select[name="subject-id"]').val(options[0].value)
                } else {
                    $('select[name="subject-id"]').val("")
                }
                validation.validateElement($('select[name="subject-id"]')[0])
            }
        }
    })
    /*
     * edit class * slot functions
     */
    function updateSelectOptions() {
        $('.edit-slot .select-day select').each(function(index, element) {
            updateDayOptions($(element))
        })
        $('.edit-slot .select-time select').each(function(index, element) {
            updateTimeOptions($(element))
        })
    }
    function updateDayOptions(selectElem) {
        var parent = selectElem.closest('.edit-slot')
        var dayId = parent.attr('data-day-id')
        var options = []

        selectElem.find('option:not(:disabled)').remove()
        $('.day-options optgroup').each( function(index, element){
            $(element).find("option").each(function(index, element){
                var val = element.getAttribute('value')

                if (val == dayId) {
                    options.push('<option selected="selected" value="' + element.getAttribute('value') +
                        '">' + element.textContent + '</option>')
                } else if (hasFreeSlots(val) || val == dayId) {
                    options.push('<option value="' + element.getAttribute('value') +
                        '">' + element.textContent + '</option>')
                }

            });

            if (options.length > 0) {
                var week = index + 1
                selectElem.append($("<optgroup label='Week "+week+"'>").append(options.join("")))
            }

            options = []
        })

        removeEmptyGroups()
    }

    function removeEmptyGroups(){
        $('optgroup').each( function(index, element){
            if ($(element).find("option").length == 0) {
                $(element).remove()
            }
        });
    }

    function updateTimeOptions(selectElem) {
        var parent = selectElem.closest('.edit-slot')
        var dayId = parent.attr('data-day-id')
        var timeId = parent.attr("data-time-id")
        var options = []
        $("input[type='checkbox'][name='day" + dayId + "[]']").each( function(index, element){
            if (element.getAttribute("value") == timeId && timeId !="") {
                options.push('<option selected="selected" value="' + element.getAttribute('value') +
                    '">' + element.getAttribute("data-slot-text") + '</option>')
            } else if (!element.checked) {
                options.push('<option value="' + element.getAttribute('value') +
                    '">' + element.getAttribute("data-slot-text") + '</option>')
            }
        })
        selectElem.find('option:not(:disabled)').remove()
        selectElem.append(options.join(""))
    }
    function changeDayValue(event) {
        var element = $(event.currentTarget)
        var slot = element.closest('.edit-slot')
        uncheckSlot(slot)
        slot.attr('data-day-id', element.val())
        slot.attr('data-time-id', "")
        var value = element.find('option[value="' + element.val() + '"]' ).text()
        var day = slot.find('.select-day > span')
        day.text(value).removeClass('placeholder')
        var timeSelect = slot.find('.select-time > select')
        slot.find('.select-time > span').text(timeSelect.find('option[value=""]').text()).addClass('placeholder')
        element.blur()
        updateSelectOptions()
    }
    function changeTimeValue(event) {
        var element = $(event.currentTarget)
        var slot = element.closest('.edit-slot')
        uncheckSlot(slot)
        slot.attr('data-time-id', element.val())
        var value = element.find('option[value="' + element.val() + '"]' ).text()
        var time =  slot.find('.select-time > span')
        time.text(value).removeClass('placeholder')
        $('input[type="checkbox"][name="day' + slot.attr('data-day-id') + '[]"][value="' + element.val() + '"]').prop('checked', true)
        slot.find('input[type="text"]').attr("name", "room-" + slot.attr('data-day-id') + "-" + element.val())
        element.blur()
        updateSelectOptions()
    }
    function createSlot() {
        var slot = $('.edit-slot-base p').clone()
        slot.addClass('edit-slot')
        slot.find('select').removeClass('hidden')
        select = slot.find('select.day')
        updateDayOptions(select)
        select.on('change', changeDayValue)
        select = slot.find('select.time')
        updateTimeOptions(select)
        select.on('change', changeTimeValue)
        slot.find('.remove-slot').on('click', removeSlot)
        slot.find('input[type="text"]').attr('data-validation', 'required')
        slot.find('input[type="text"]').on("blur", validateOnBlur)
        return slot
    }

    function addSlot(event) {
        var element = $(event.currentTarget)
        var dayId = findFirstFreeDay()
        if (dayId == null) return
        var slot = createSlot()
        $('.slot-landing-placeholder').before(slot)
        removeEmptyGroups()

    }
    function removeSlot(event) {
        var parent = $(event.currentTarget.parentNode)
        uncheckSlot(parent)
        parent.empty()
    }
    function uncheckSlot(slotElement) {
        if (slotElement.attr('data-time-id')) {
            $('input[type="checkbox"][name="day' +
                slotElement.attr('data-day-id') + '[]"][value="' +
                slotElement.attr('data-time-id') + '"]').prop('checked', false)
        }

    }
    //day-timeslot functions
    function hasFreeSlots(dayId) {
       return findFirstFreeSlot(dayId) != null
    }
    function findFirstFreeDay() {
        var ans = null
        $(".day-options option").each(function(index, element) {
            var val = element.getAttribute("value")
            if (hasFreeSlots(val)) {
                ans = val
                return false
            }
        })
        return ans
    }
    function isFreeSlot(element) {
        if (element.length == 0) return false
        return element.prop("checked") == false
    }
    function findFirstFreeSlot(dayId) {
        var ans = null
        $("input[type='checkbox'][name='day" + dayId + "[]']").each(function(index, element){
            if (element.checked == false) {
                ans =  element
                return false
            }
        })
        return ans
    }
    /*
     *  Students
     *
     */
    $('.ld-classes .print-students').on('click', function(event){
        $('body').addClass('print-students')
        $('body').append($('#printStudents'))
        window.print()
    })

    $('.ld-classes .students .btn-flat').on('click', function(event){
        var target = event.currentTarget.getAttribute('data-toggle')
        $('.ld-classes .students .btn-flat').removeClass('active')
        $('.ld-classes .students .btn-flat.' + target).addClass('active')
        $('.ld-classes .tab-pane.students .tab-pane').addClass('hidden')
        $('.ld-classes .tab-pane.students .tab-pane.' + target).removeClass('hidden')
    })

    $('.ld-classes .students .student-info').on('click', function(event){
        if ($(event.currentTarget).find('input:checked').length > 0) {
            $(event.currentTarget).addClass('selected')
        } else {
            $(event.currentTarget).removeClass('selected')
        }
        var action
        if ($(event.currentTarget).parents('.remove-students').length > 0) {
            action = '.remove-students'
        } else if ($(event.currentTarget).parents('.add-students').length > 0) {
            action = '.add-students'
        } else {
            return
        }
        if ($('.ld-classes .students ' + action + ' input:not(":checked")').length == 0) {
            $('.ld-classes .students ' + action + ' .select-all').addClass("selected")
        } else {
            $('.ld-classes .students ' + action + ' .select-all').removeClass("selected")
        }
        if ($('.ld-classes .students ' + action + ' input:checked').length == 0) {
            $('.ld-classes .students ' + action + ' .btn').addClass('inactive')
            $('.ld-classes .students ' + action + ' .select-none').addClass("selected")
        } else {
            $('.ld-classes .students ' + action + ' .select-none').removeClass("selected")
            $('.ld-classes .students ' + action + ' .btn').removeClass('inactive')
        }
    })
    $('.ld-classes .students .add-students .btn.add').on('click', function(event){
        try{ sessionStorage.setItem('classes-view', 'students') } catch(error) {}
        var form = $('.ld-classes .tab-pane.students .tab-pane:not(.hidden)')
        form.submit()
    })
    $('.ld-classes .students .select-all').on('click', function(event){
        var action
        if ($(event.currentTarget).parents('.remove-students').length > 0) {
            action = '.remove-students'
        } else if ($(event.currentTarget).parents('.add-students').length > 0) {
            action = '.add-students'
        } else {
            return
        }
        $('.ld-classes .students ' + action + ' .select-all').addClass("selected")
        $('.ld-classes .students ' + action + ' .select-none').removeClass("selected")
        $('.ld-classes .students ' + action + ' .btn').removeClass('inactive')
        $('.ld-classes .students ' + action + ' .student-info').each(function(index, element){
            $(element).addClass('selected')
            $(element).find('input').prop('checked', true)
        })
    })
    $('.ld-classes .students .select-none').on('click', function(event) {
        var action
        if ($(event.currentTarget).parents('.remove-students').length > 0) {
            action = '.remove-students'
        } else if ($(event.currentTarget).parents('.add-students').length > 0) {
            action = '.add-students'
        } else {
            return
        }
        $('.ld-classes .students ' + action + ' .select-all').removeClass("selected")
        $('.ld-classes .students ' + action + ' .select-none').addClass("selected")
        $('.ld-classes .students ' + action + ' .btn').addClass('inactive')
        $('.ld-classes .students ' + action + ' .student-info').each(function(index, element){
            $(element).removeClass('selected')
            $(element).find('input').prop('checked', false)
        })
    })
    $('.ld-classes .students .remove-students .btn.remove').on('click', function(event){
        if ($(event.currentTarget).hasClass('inactive')) return
        var studentElements = $('.ld-classes .student-info.selected')
        //confirm delete
        var modal = $('<div class="modal fade" id="removeItemModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">')
        var modalHeader = $('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h2 class="modal-title">Remove Students</h2></div>')
        var modalBody = $('<div class="modal-body"><p>Do you want to remove the selected students from this class</p></div>')
        //buttons
        var send = $('<span class="btn">Yes</span>')
        send.on('click', function(event) {
            try { sessionStorage.setItem('classes-view', 'students') } catch(error) {}
            var form = $('.ld-classes .tab-pane.students .tab-pane:not(.hidden) form')
            form.submit()
        })
        var cancel = $('<button type="button" class="btn btn-dismiss" data-dismiss="modal">Cancel</button>')
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
        modal.appendTo('.ld-classes')
        modal.modal("show")
    })
    return {
        init: init
    }
})()
