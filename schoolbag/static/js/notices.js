var noticesPage = (function() {
    //init
    var notes = [], noteIndex = 0
    var classTree = null
    var init = function() {
        var url = urlBase + "notice/jsonNotices/"
        $( ".ld-notices header" ).click( function( event ) {
            window.location.href = urlBase + getUser() + "/noticeboard"
        })
        $( ".btn-notice.btn-return" ).click( function( event ) {
            window.location.href = urlBase + getUser() + "/noticeboard"
        })
        //sharing options
        $('.ld-notices .ld-all-school').on('click', function(event) {
            $('.ld-notices .ld-tree').detach()
        })
        $('.ld-notices .ld-my-classes').on('click', function(event) {
            if (classTree == null ) {
                generateClassesTree()
            } else {
                $('.ld-notices .ld-classes-tree').append(classTree)
            }
        })
        if ($('.ld-notices .ld-my-classes').is(":checked")) {
            $('.ld-notices .ld-my-classes').click()
        }
        $( ".ld-notices .notice-space .note .message" ).each(function (index, element) {
           //cutText(element, $( element ).find(".text"))
        })

        $('span.text').dotdotdot();


        $( ".ld-notices .btn:submit").off('click')
        $( ".ld-notices .btn:submit").click( function( event ) {
            event.preventDefault()
            var form = $( ".ld-notices form")
            if (validForm(form)) {
                if ($("input[type='file']").val() == "") {
                    form.submit()
                }
                var data = new FormData(form[0]);

                var id = $("input[name='file-id']").val()
                if (id) {
                    var url = $("input[name='action']").val() + '/' + id
                    $.ajax({url: url,
                        type: 'DELETE',
                        success: function(data, textStatus, jqXHR) {
                        }
                    })
                }
                url = $("input[name='action']").val()
                $.ajax({
                    url: url,
                    type: 'POST',
                    data: data,
                    cache: false,
                    dataType: 'json',
                    processData: false,
                    contentType: false,
                    success: function(data, textStatus, jqXHR) {
                        if (data.success && data.id) {
                            if ($("input[name='file-id']").length > 0) {
                                $("input[name='file-id']").val(data.id)
                            } else {
                                form.append($("<input type='hidden' name='file-id' value=" + data.id + ">"))
                            }
                            form.submit()
                        }
                    },
                    error: function(data, status, error) {
                       form.submit()
                    }
                })
            }
        })

        $( ".ld-notices .btn-delete" ).click(function( event ) {
            event.preventDefault()
            var message = _t("confirm-delete-notice")
            var url = urlBase + "notice/remove/" + event.currentTarget.getAttribute('data-id')
            removeItemDialog(message, url, '.ld-notices')
            $( "#removeItemModal" ).modal( "show" )
        })
        //form dates
        $(".ld-notices .display-date").datepicker({
            dateFormat : 'yy-mm-dd',
            minDate : 0,
            firstDay: 1,
            onSelect: updateFormDate,
            onClose: function() {isValid(this)},
            prevText: "",
            nextText: ""
        })
        $(".ld-notices .display-date").datepicker("widget").addClass("datepicker-note")
        /* fileImporter overrides */
        $('#resourceImportModal #upload .btn.add').on('click', uploadAndAttachNewResource)
        $('#resourceImportModal #resources .btn.add').on('click', attachExistingResources)
        $('#resourceImportModal .remote .btn.add').on('click', attachRemoteResources)
    }
    /* remove existing files */
    $('.ld-notices .existing-file .btn-remove').on('click', function() {
        $(event.currentTarget).closest('div').remove()
    })
    /****************************sharing options**********************/
    function generateClassesTree(event) {
        var url = urlBase + "service/subjectsandclasses/"
        $.get(url, function(response) {
            var classes = []
            for (var item in response) {
                var subjectName = response[item]['name']
                for (var i =0; i < response[item]['classes'].length; i++) {
                    var subjectClass = response[item]['classes'][i]
                    if (subjectClass.teacherId == $('body').attr('data-uid')) {
                        classes.push({id: subjectClass.id, name: subjectName + " " + subjectClass.extraRef})
                    }
                }
            }
            var includedClasses = $('input[name="selected-classes"]').val().split(" ")
            var tree = $('.ld-tree')
            var classes = classes.sort(function(a,b) { return (a['name']).localeCompare(b['name']) })
            var classBranches = []
            for (var i = 0; i < classes.length; i++) {
                var branchStr = '<label class="sub-list">'
                branchStr += '<input name="class-id[]" value="' + classes[i].id + '" data-parent=".parent-node.top-level" '
                branchStr += (includedClasses.indexOf(String(classes[i].id)) != -1) ? 'checked="checked"' : ''
                branchStr += 'type="checkbox" class="subject-level child-node" data-validation="required" />'
                branchStr += classes[i].name + '</label>'
                classBranches.push(branchStr)
            }
            var span = $("<span>")
            span.append(classBranches.join(""))
            tree.append(span).removeClass('hidden')
            $( ".ld-notices .ld-classes-tree" ).append(tree)
            $( ".ld-notices .ld-classes-tree :checkbox").uniform({checkboxClass: 'ld-CheckClass'})
            classTree = tree
            setTreeEvents()
        })
    }
    /**************************** add file ***************************/
    /*upload file */
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
            resourceData['type'] = 'file'
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
            formData.append('title',  file.name)
        }
        formData.append('owner', 'schoolbag')
        formData.append('creator', 'noticeboard')
        formData.append('clientId', $('.hidden input[name="client-id"]').val())
        formData.append('key', $('.hidden input[name="key"]').val())

        resourceFunctions.uploadResource(resourceData, formData, function(response) {
            var row = $('<div>')
            row.append('<input type="hidden" name="file-id" value="' + response.id + '">')
            row.append('<span class="col-sm-9">' + title + '</span>')
            $('#openAddResourceModal').before(row)

            var remove = $('<span class="col-sm-3"><span class="btn-remove btn-icon fa fa-times" title="Remove"></span></span>')
            row.append(remove)
            remove.on('click', function(event) {
                $(event.currentTarget).closest('div').remove()
            })
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
                row.append('<input type="hidden" name="file-id" value="' + resource._id + '">')
                row.append('<span class="col-sm-9">' + resource.metadata.title + '</span>')
                $('#openAddResourceModal').before(row)
                var remove = $('<span class="col-sm-3"><span class="btn-remove btn-icon fa fa-times" title="Remove"></span></span>')
                row.append(remove)
                remove.on('click', function(event) {
                    $(event.currentTarget).closest('div').remove()
                })
            }
        }
        $('#resourceImportModal').modal('hide')
    }
    /*upload from onedrive/googledrive */
    function attachRemoteResources(event) {
        var id = $(event.currentTarget).closest('.remote').attr('id')
        var checked = $('#resourceImportModal #' + id + ' .remote-browser input[type="checkbox"]:checked')
        if (checked.length == 0) {
            $('#resourceImportModal #' + id + ' .validation-box').addClass('error required')
            return
        } else {
            var deferreds = []
            if (checked.length > 1) {
                $('#resourceImportModal #' + id + ' .validation-box').addClass('error one')
                return
            }/* else if (checked[0].getAttribute('data-type') != "photo") {
                $('#resourceImportModal #' + id + ' .validation-box').addClass('error custom')
                return
            }*/
            var deferreds = []
            $('#resourceImportModal #' + id + ' .contents').addClass('hidden')
            $('#resourceImportModal #' + id + ' .loading').removeClass('hidden')
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
                            'type': 'file',
                            'file-name': title,
                            'title':  title,
                            'owner': 'schoolbag',
                            'creator': 'noticeboard',
                            'clientId': $('.hidden input[name="client-id"]').val()
                        }
                        resource.metadata = resourceData
                        resourceFunctions.saveResource(resource)
                        var row = $('<div>')
                        row.append('<input type="hidden" name="file-id" value="' + id + '">')
                        row.append('<span class="col-sm-9">' + title + '</span>')
                        $('#openAddResourceModal').before(row)

                        var remove = $('<span class="col-sm-3"><span class="btn-remove btn-icon fa fa-times" title="Remove"></span></span>')
                        row.append(remove)
                        remove.on('click', function(event) {
                            $(event.currentTarget).closest('div').remove()
                        })
                    }}(resourceElement)))
                )
            }
            $.when.apply($, deferreds).then(function(){
                $('#resourceImportModal').modal('hide')
            })
        }
    }

    return {
        init: init
    }
})()
