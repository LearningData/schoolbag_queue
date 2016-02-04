var policiesPage = (function() {
    var dirtyPolicyText = false
    var activeFileButton
    var init = function() {
        //events
        $('.ld-policies .policy .fa-pencil').on('click', function(event) {
            editPolicy($(event.currentTarget).closest('.policy'))
        })
        $('.ld-policies .new-policy.ld-new-buttons').on('click', function(event) {
            newPolicy(event.currentTarget.getAttribute('data-target'), event.currentTarget.getAttribute('data-type'))
            removeDataTitle()
        })
        $('#removePolicyModal .btn.remove').on('click', removePolicy)
        // fileImporter
        $('#resourceImportModal .nav a[data-toggle="resources"]').addClass('inactive').off('click')
        $('#resourceImportModal #upload .btn.add').on('click', uploadAndAttachNewResource)
        $('#resourceImportModal #resources .btn.add').on('click', attachExistingResources)
        $('#resourceImportModal .remote .btn.add').on('click', attachRemoteResources)
    }
    //#############################SUMMERNOTE###################################
    var summernoteParams = {toolbar:[
            ['style', ['style']],
            ['para', ['paragraph']],
            ['style', [ "bold", "italic", "underline" ]],
            ['color', [ "color" ]],
            ['para', ['ul', 'ol']],
            ['insert', ['table']],
            ['insert', ['link', 'picture', 'hr']]
        ],
        height: 200,
        minHeight: 200,
        onPaste:function(event) {
            var target = $(event.currentTarget)
            setTimeout(function() {
                var atts = target.clone()[0].attributes
                sanitize.cleanHTML(target)
                $.each(atts, function(index, attr) {
                    target.attr(attr.name, attr.value)
                })
            }, 0)
        },
        onChange: function(contents, $editable) {
            dirtyPolicyText = true
        }
    }
    //############################# NEW POLICY #################################
    function newPolicy(sectionClass, sectionType) {
        if ($('.policy-type-' + sectionType).length > 0) {
            $('.policy-type-' + sectionType).focus()
            return
        }
        var newBlock = $('#new-policy .policy').clone()
        var titleInput = newBlock.find('input[name="title"]')
        titleInput.addClass('policy-type-' + sectionType)
        var editable = newBlock.find('#policyText')
        editable.summernote(summernoteParams)
        $('.ld-policies .list.type-' + sectionType).append(newBlock)
        titleInput.focus()

        var saveBtn = newBlock.find('button.save')
        var cancelBtn = newBlock.find('button.btn-cancel')
        saveBtn.on('click', function(event) {
            if (!validation.validateElement(titleInput[0])) {
                return
            }
            var name = titleInput.val()

            var data = {section: sectionType, status: 1}
            var sequence = $('.ld-policies .list.type-' + sectionType).find('input[type="hidden"][name="sequence"]:last').val()
            if (sequence) {
                sequence++
            } else {
                sequence = 1
            }
            data['ownerId'] =  $('#new-policy input[type="hidden"][name="ownerId"]').val()
            data['schoolId'] =  $('#new-policy input[type="hidden"][name="schoolId"]').val()
            data['title'] = name
            data['sequence'] = sequence
            newBlock.find('input[name="file-id"]').each(function(index, element) {
                if (data[element.getAttribute('name')]) {
                    data[element.getAttribute('name')].push(element.getAttribute('value'))
                } else {
                    data[element.getAttribute('name')] = [element.getAttribute('value')]
                }
            })
            var content = newBlock.find('.editable').code()
            data['content'] = content
            $.post(urlBase + 'policies/create', data, function(response) {
                window.location.reload()
            })
        })
        cancelBtn.on('click', function(event) {
            newBlock.remove()
        })
        newBlock.find('.openAddResourceModal').on('click', function(event) {
            activeFileButton = newBlock.find('.openAddResourceModal')
            openAddResourceModal(event)
        })
    }
    //############################ EDIT POLICY ##############################
    function editPolicy(policyBlock) {
        var title = policyBlock.find('.policy-title')
        var content = policyBlock.find('#policyText').clone()
        title.off('click', ldCollapseFunction)
        var name = title.text()
        var inputTitle = $('<input type="text">')
        title.replaceWith(inputTitle)
        inputTitle.val(title.text())
        policyBlock.find('.fa-pencil').addClass('hidden')
        policyBlock.find('.add-file-list').addClass('hidden')
        policyBlock.find('label').removeClass('hidden')
        policyBlock.find('[class*="collapse-icon-"]').addClass('hidden')
        policyBlock.find('.editable').summernote(summernoteParams)
        var collapseBlock = $('#pol' + policyBlock.attr('data-policy-id'))
        var collapseStatus = collapseBlock.hasClass('in')
        if (!collapseStatus) {
            collapseBlock.addClass('in')
            collapseBlock.css('height', 'auto')
        }
        var addFile = $('<button type="button" class="btn-add openAddResourceModal mtop-20"><span class="fa fa-plus"></span> Add File</button>')
        var addFileBlock = $('<div>')
        var btnBlock = $('<div class="col-xs-12 col-md-12">')
        btnBlock.append(addFile)
        addFileBlock.append(btnBlock)
        policyBlock.append(addFileBlock)
        addFileBlock.append('<div class="clearfix"></div><hr>')
        var fileList = policyBlock.find('input[name="file-id"]')
        fileList.each(function(index, element) {
            var row = $('<div class="file-row">')
            row.append('<span>' + element.getAttribute('data-name') + '</span>')
            addFile.before(row)
            var remove = $('<span class="btn-remove btn-icon fa fa-times" title="Remove"></span>')
            row.append(remove)
            remove.on('click', function(event) {
                $(event.currentTarget).closest('div').remove()
                $('input[name="file-id"][value="' +  element.getAttribute('value') + '"]').remove()
            })
        })
        var saveBtn = $('<button type="button" class="btn btn-sm">' + _t('save') + '</button>')
        var cancelBtn = $('<button type="button" class="btn btn-cancel btn-sm">' + _t('cancel') + '</button>')
        var deleteBtn = $('<button type="button" class="btn-delete remove-policy"><span class="fa fa-archive"></span>Archive</button>')
        var btnBlock = $('<div class="button-block">')
        btnBlock.append(saveBtn)
        btnBlock.append(cancelBtn)
        btnBlock.append(deleteBtn)
        policyBlock.append(btnBlock)
        policyBlock.find('.note-editable').focus()
        saveBtn.on('click', function(event) {
            var name = inputTitle.val()
            title.text(name)
            var id = policyBlock.attr('data-policy-id')
            var data = {}
            policyBlock.find('form.update.hidden input').each(function(index, element) {
                data[element.getAttribute('name')] = element.getAttribute('value')
            })
            var fileList = policyBlock.find('input[name="file-id"]')
            policyBlock.find('.add-file-list').empty()
            fileList.each(function(index, element) {
                if (data[element.getAttribute('name')]) {
                    data[element.getAttribute('name')].push(element.getAttribute('value'))
                } else {
                    data[element.getAttribute('name')] = [element.getAttribute('value')]
                }
                var fileData = element.getAttribute('value').split("::")
                var row = $('<div class="file-row">').append(element)
                element.setAttribute("data-name",fileData[1])
                row.append('<a href="' + $('input[name="resourceBagUrl"]').val() +
                    '/download/' + fileData[0] + '" target="_blank">'+ fileData[1] + ' <span class="fa fa-download"></span></a>')
                policyBlock.find('.add-file-list').append(row)
            })
            data['title'] = name
            data['id'] = id
            content = null
            data['content'] = policyBlock.find('#policyText').code()
            $.post(policyBlock.find('form.hidden').attr('action'), data, function(response) {
                cancelBtn.click()
            })
        })
        cancelBtn.on('click', function(event) {
            event.stopPropagation()
            inputTitle.replaceWith(title)
            title.on('click', ldCollapseFunction)
            btnBlock.remove()
            addFileBlock.remove()
            policyBlock.find('.fa-pencil').removeClass('hidden')
            policyBlock.find('.add-file-list').removeClass('hidden')
            policyBlock.find('label').addClass('hidden')
            policyBlock.find('#policyText').destroy()
            if (content !== null) {
                policyBlock.find('#policyText').replaceWith(content)
            }
            policyBlock.find('[class*="collapse-icon-"]').removeClass('hidden')
            if (!collapseStatus) {
                collapseBlock.removeClass('in')
                collapseBlock.css('height', '0px')
            }
        })
        addFile.on('click', function(event) {
            activeFileButton = addFile
            openAddResourceModal(event)
        })

        deleteBtn.on('click', function(event) {
            var id =  policyBlock.attr('data-policy-id')
            $('#removePolicyModal').attr('data-policy-id', id)
            $('#removePolicyModal p.message strong')
            $('#removePolicyModal').modal('show')
        })

    }
    //########################SORT POLICYS####################################
    $('[data-sortable="policy"]').sortable({
        handle: $('[data-sortable="policy"]').attr('data-target'),
        cancel: $('[data-sortable="policy"]').attr('data-cancel'),
        stop: updatePolicyPosition
    })
    function updatePolicyPosition(obj) {
        $('.policy:not(".policy-new")').each(function(index, element) {
            var policyElm = $(element)
            var pos = policyElm.find($('input[type="hidden"][name="sequence"]')).val()
            if (!pos || pos != policyElm.index()) {
                var data = {}
                var fileList = policyElm.find('input[name="file-id"]')
                fileList.each(function(index, element) {
                    if (data[element.getAttribute('name')]) {
                        data[element.getAttribute('name')].push(element.getAttribute('value'))
                    } else {
                        data[element.getAttribute('name')] = [element.getAttribute('value')]
                    }
                })
                data['title'] = policyElm.find('.policy-title').text()
                data['id'] = policyElm.attr('data-policy-id')
                data['content'] = policyElm.find('#policyText').code()

                policyElm.find('form.update.hidden input').each(function(index, element) {
                    data[element.getAttribute('name')] = element.getAttribute('value')
                })
                data['sequence'] = policyElm.index()
                $.post(policyElm.find('form.hidden').attr('action'), data, function(response) {
                    console.log(response)
                })
            }
        })
    }
    //########################REMOVE POLICY####################################
    function removePolicy(event) {
        var id = $('#removePolicyModal').attr('data-policy-id')
        var url = urlBase + 'policies/delete/' + $('#removePolicyModal').attr('data-policy-id')
        $.ajax({url: url,
            type: 'GET',
            success: function(data, textStatus, jqXHR) {
                $('.ld-policies .policy[data-policy-id="' + id + '"]').remove()
                $('#removePolicyModal').modal('hide')
            }
        })
    }
    //#############################ADD FILE#####################################
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
        formData.append('creator', 'policies')
        formData.append('clientId', $('.hidden input[name="client-id"]').val())
        formData.append('key', $('.hidden input[name="key"]').val())

        resourceFunctions.uploadResource(resourceData, formData, function(response) {
            var row = $('<div class="file-row">')
            row.append('<input type="hidden" name="file-id" value="' + response.id + '::' + title + '">')
            row.append('<span>' + title + '</span>')
            activeFileButton.before(row)

            var remove = $('<span class="btn-remove btn-icon fa fa-times" title="Remove"></span>')
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
                var row = $('<div class="file-row">')
                row.append('<input type="hidden" name="file-id" value="' + resource._id + '::' + resource.metadata.title + '">')
                row.append('<span>' + resource.metadata.title + '</span>')
                activeFileButton.before(row)
                var remove = $('<span class="btn-remove btn-icon fa fa-times" title="Remove"></span>')
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
                            'creator': 'policies',
                            'clientId': $('.hidden input[name="client-id"]').val()
                        }
                        resource.metadata = resourceData
                        resourceFunctions.saveResource(resource)
                        var row = $('<div class="file-row">')
                        row.append('<input type="hidden" name="file-id" value="' + id + '::' + title + '">')
                        row.append('<span>' + title + '</span>')
                        activeFileButton.before(row)

                        var remove = $('<span class="btn-remove btn-icon fa fa-times" title="Remove"></span>')
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
    };
})()
