/*
 * A collection of functions for functions such as fetching resources, resource preview and
 *  topic line generation.
 *  Required by resources.js and classes.js
 *
 */
var resourceFunctions = (function() {
    var resources = {}
    var resourceUrl = $('input[name="resourceBagUrl"]').val();
    var cacheUrl = $('input[name="cacheBagUrl"]').val()
    //if type is file or text it may have a better defined subtype

    function fetchResources(searchStr, successFunction, failFunction) {
        var url = resourceUrl + "/" + searchStr
        var jqxhr = $.get(url, function(response) {
            for (var i=0; i < response.items.length; i++) {
                var data = response.items[i]
                resources[data._id] = data
            }
            successFunction(response)
        })
        .fail(function(request, status, error) {
            failFunction(request, status, error)
        })
    }

    function resourceCard(resource) {
        setAsSubtype(resource.metadata, resource.metadata)
        var type = resource.metadata.type
        var block = $('<div class="ld-card col-xs-4 col-sm-4 col-md-4 col-lg-3 ' + type + '" ></div>')

        var contents = $('<label class="contents"></label>')
        block.attr('data-id', resource._id)
        var preview = previewResource(resource)
        contents.append(preview)
        var title = $('<h6 class="title">' + resource.metadata.title + '</h6>')
        title.attr({"data-toogle":"tooltip", "title":"", "data-original-title":resource.metadata.title})
        contents.append(title)
        var details = $('<span class="details-block" data-id="' + resource._id +'"></span>')
        contents.append('<span class="fa fa-user"> ' + resource.metadata.creator + '</span>')
        contents.append('<span class="fa fa-calendar"> ' + moment(resource.uploadDate).format('DD/MMM/YY') + '</span>')
        block.append(contents)
        block.append(details)
        title.tooltip()
        return block
    }
    function resourceRow(resource) {
        setAsSubtype(resource.metadata, resource.metadata)
        var type = resource.metadata.type
        var block = $('<tr class="' + type + '" ></div>')
        block.append('<td class="semibold" width="65%">' + resource.metadata.title + '</td>')
        block.append('<td width="15%">' + resource.metadata.creator + '</td>')
        block.append('<td>' + moment(resource.uploadDate).format('DD/MMM/YY') + '</td>')
        block.append('<td max-width="5%"><span class="icon-block"><span class="icon-sign fa fa-picture-o"></span></span></td>')
        return block
    }
    function setAsSubtype(resource, data) {
        if ((resource.type == 'text' || resource.type == 'link') && data.embed) {
            if (typeof(data.embed) == 'object') {
                resource.embed = data.embed
                resource.type = resource.embed.type || resource.type
                if (resource.type == 'article') {
                    resource.type = 'link'
                }
            } else { //TODO remove JSON embed from resourcebag
                try {
                    resource.embed = JSON.parse(data.embed)
                    resource.type = resource.embed.type || resource.type
                    if (resource.type == 'article') {
                        resource.type = 'link'
                    }
                } catch(error) {}
            }
        } else if (resource.type == 'file' || resource.type == 'F') {
            resource.type = getTypeFromContentType(resource)
        }
    }
    function getTypeFromContentType(data) {
        if (data.content_type) {
            if (data.type == 'file' && data.content_type == 'application/octet-stream') {
                return data['file-name'] ? getTypeFromFileExtension(data['file-name']) : 'file'
            }
            var type = data.content_type.split('/')
            switch (type[0]) {
                case 'image':
                    return 'image'
                    break
                case 'video':
                    return 'video-file'
                    break
                case 'text':
                    return 'text-file'
                    break
                case 'audio':
                    return 'audio-file'
                    break
                case 'application':
                    return getTypeFromApplication(type)
                    break
                default:
                    return 'file'
            }
        }
        return data.type
    }
    function getTypeFromApplication(data) {
        if (data[1] === "pdf" ) {
            return "pdf"
        }
        if (data[1] === "vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            data[1] === "msword" ||
            data[1] === "vnd.oasis.opendocument.text") {
            return "document"
        }
        if (data[1] === "vnd.oasis.opendocument.presentation" ||
            data[1] === "vnd.ms-powerpoint" ||
            data[1] === "vnd.openxmlformats-officedocument.presentationml.presentation") {
            return "presentation"
        }
        if (data[1] === "vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            data[1] === "vnd.ms-excel") {
            return "spreadsheet"
        }
        return 'file'
    }
    function getTypeFromFileExtension(name) {
        var nameArr = name.split('.')
        switch (nameArr[nameArr.length - 1]) {
        case 'png':
        case 'jpg':
            return 'image'
        default:
            return 'file'
        }
    }
    function resourceDisplay(id, metadata) {
        var view
        switch (metadata.type) {
        case "image":
            view = $('<img src="' + cacheUrl + '/' +  id + '/small">')
            break
        case "text":
            view = $('<span>').text(metadata.text)
            view.html(Autolinker.link(view.html(), {className: "text-link", stripPrefix:false}));
            break
        case "rich-text":
            view = $('<span>').append(metadata.text)
            break
        case "video":
            if (typeof(metadata.embed) == "object") {
                if (metadata.embed.html) {
                    metadata.embed.html = metadata.embed.html.replace(/src="http:/, "src=\"https:")
                    view = metadata.embed.html
                } else if (metadata.embed.video) {
                    metadata.embed.video = metadata.embed.video.replace(/^http:/, "https:")
                    view = '<iframe width="100%" height="315" src="' + metadata.embed.video + '" frameborder="0" allowfullscreen></iframe>'
                } else if (metadata.embed['video:url']) {
                    metadata.embed.video =  metadata.embed['video:url'].replace(/^http:/, "https:")
                    view = '<iframe width="100%" height="315" src="' + metadata.embed.video + '" frameborder="0" allowfullscreen></iframe>'
                }
            } else {
                try {
                    var embed = JSON.parse(metadata.embed)
                    if (embed.html) {
                        embed.html = embed.html.replace(/src="http:/, "src=\"https:")
                        view = embed.html
                    } else if (embed.video) {
                        embed.video = embed.video.replace(/^http:/, "https:")
                        view = '<iframe width="100%" height="315" src="' + embed.video + '" frameborder="0" allowfullscreen></iframe>'
                    } else if (embed['video:url']) {
                        embed.video = embed['video:url'].replace(/^http:/, "https:")
                        view = '<iframe width="100%" height="315" src="' + embed.video + '" frameborder="0" allowfullscreen></iframe>'
                    }
                } catch(error) {
                    view = 'Sorry, an error occured loading this video'
                }
            }
            view = $('<div>').append(view)
            break
        case "topic-line":
            var topicline  = topicLine.createTopicView(resources[id])
            var count = 0
            if (metadata.objects) {
                count = (typeof(metadata.objects) == 'string') ? 1 :
                    metadata.objects.length
            }
            topicline.find('#topic_' + id).addClass('collapse')
            topicline.find('.topic-title').text(count + ' resources')
            view = topicline
            if ($('input[type="hidden"][name="owner"]').val() == metadata.owner) {
                var str = ''
                str += '<span class="ld-icon-new icon-sign"' + ' data-topic="' + metadata.title + '" data-id="' + id + '" ></span>'
                str += '</span>'
                topicline.find('#topic_' + id).append(str)
                topicline.find('.ld-icon-new').on('click', function addResourceClick(event) {
                    var element = event.currentTarget
                    wizard = resourceUploadWizard = {resourceType:'upload'}
                    wizard.topic = element.getAttribute('data-topic')
                    wizard.id = element.getAttribute('data-id')
                    $('#resourceImportModal .nav a[data-toggle="resources"]').removeClass('inactive')
                    $('#previewResourceModal').modal('hide')
                    openAddResourceModal()
                })
            }
            break
        case 'multi-resource':
            view = $('<span class="multi-preview"></span>')
            if (!metadata.resources) {
                break
            }
            for (var i = 0; i < metadata.resources.length; i++) {
                var resource = metadata.resources[i]
                if (typeof(metadata.resources[i]) == "string") {
                    var resource = metadata.resources[i] = resourceStringToArray(metadata.resources[i])[0]
                }
                var resourceItem = $('<div class="resource-item">').append(resourceDisplay(resource.id, resource))
                view.append(resourceItem)
            }
            break
        case 'link':
            var view = $('<span>')
            if (metadata.text) {
                view = $('<a href="' + metadata.text + '">').text(metadata.text)
            } else if (typeof(metadata.html) == 'string') {
                view = $(metadata.html)
            }
            view.addClass('mleft-5 fa fa-external-link').attr('target', '_blank')
            break

        case 'pdf': //fallthrough
        case 'file':
        case 'F':
        default: //default resource type has always been a file
            view = $('<a href="' + resourceUrl + '/download/' +  id +
                '" class="file-link" target="_blank">' + ((resources[id] && resources[id].filename) || metadata.filename || metadata.title) + '<span class="right fa fa-download"></span></a>')
        }
        return view
    }

    function resourceDisplayDetails(resource, id, metadata) {
        var filename = metadata['file-name'] || metadata.filename
        if (!filename && resources[id]) filename = resources[id].filename
        if (!filename) filename = metadata.title
        var preview, content= $('<div>')
        switch (metadata.type) {
        case "text":
            //preview.append($('<p>').text(data.text))
            //preview.html(Autolinker.link(preview.html(), {className: "text-link", stripPrefix:false}));
            preview = $('<div class="media-resource-left text"></div>').append('<span>').text(metadata.text)
            preview.html(Autolinker.link(preview.html(), {className: "text-link", stripPrefix:false}));
            break
        case 'video':
            if (metadata.isCopy) {
                preview = $('<div class="media-resource-left"></div>')
            } else {
                if (metadata.embed.html) {
                    preview = $('<div class="media-resource-left open-embed" data-link="' + (metadata.link || metadata.text) + '"></div>').append($('<img src="' + metadata.embed.thumbnail_url + '" ><span class="fa fa-play-circle-o"></span>'))
                } else {
                    preview = $('<div class="media-resource-left open-embed" data-link="' + (metadata.link || metadata.text) + '"></div>').append($('<img src="' + metadata.embed.image + '" ><span class="fa fa-play-circle-o"></span>'))
                }
                }
            break
        case 'video-file':
            preview = $('<div class="media-resource-left fa fa-file-video-o"></div>')
            if (metadata.isCopy == "true") {
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
/*
 case "topic-line":
            var count = 0
            if (data.objects) {
                count = (typeof(data.objects) == 'string') ? 1 :
                    data.objects.length
            }
            preview.append($('<div class="info">' + count + ' resource' + (count == 1 ? '' : 's') + '</div>'))
            break
*/
        case "image":
            if (metadata.isCopy == "true") {
                preview = $('<div class="media-resource-left"><img src="' + cacheUrl + '/' +  metadata.resource + '/small"></div>')
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link">' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                preview = $('<div class="media-resource-left"><img src="' + cacheUrl + '/' +  id + '/small"></div>')
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link">' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
        case 'pdf':
            preview = $('<div class="media-resource-left fa fa-file-pdf-o"></div>')
            if (metadata.isCopy == "true") {
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
        case 'document':
            preview = $('<div class="media-resource-left fa fa-file-word-o"></div>')
            if (metadata.isCopy == "true") {
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
        case 'presentation':
            preview = $('<div class="media-resource-left fa fa-file-powerpoint-o"></div>')
            if (metadata.isCopy == "true") {
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
        case 'spreadsheet':
            preview = $('<div class="media-resource-left fa fa-file-excel-o"></div>')
            if (metadata.isCopy == "true") {
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
        case 'file':
            preview = $('<div class="media-resource-left fa fa-file-o"></div>')
            if (metadata.isCopy == "true") {
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
        case 'F':
            preview = $('<div class="media-resource-left fa fa-file-o"></div>')
            if (metadata.isCopy == "true") {
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
        case 'audio-file':
            preview = $('<div class="media-resource-left fa fa-file-audio-o"></div>')
            if (metadata.isCopy == "true") {
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link" target="_blank">' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
      case 'link':
            //preview.append($(data.html))
            //preview.attr("target", "_blank")
            //preview.append('<span class="right fa fa-external-link">')
            if (metadata.text) {
                preview = $('<div class="media-resource-left fa fa-link"></div><a target="_blank" href="' + metadata.text + '"><span class="mleft-5 fa fa-external-link"></span></a>')
                content = $('<a target="_blank" href="' + metadata.text + '">' + metadata.text + '<span class="mleft-5 fa fa-external-link"></span></a>')
            } else if (typeof(metadata.html) == 'string') {
                var link = $(metadata.html).attr('href')
                var text = $(metadata.html).text()
                preview = $('<div class="media-resource-left fa fa-link"></div><a target="_blank" href="' + link + '"><span class="mleft-5 fa fa-external-link"></span></a>')
                content = $('<a target="_blank" href="' + link + '"> ' + text + '<span class="mleft-5 fa fa-external-link"></span></a>')
            }
            break
        case 'multi-resource':
            var count = 0
            if (metadata.objects) {
                count = (typeof(metadata.objects) == 'string') ? 1 :
                    metadata.objects.length
            } else if (metadata.resources) {
                if (typeof(metadata.resources) == "string") {
                    count = 1
                } else {
                    count = metadata.resources.length
                }

            }
            preview = $('<div class="info">' + count + ' resource' + (count == 1 ? '' : 's') + '</div>')
            break
        case 'default':
            //preview.append($('<a href="' + resourceUrl + '/download/' +  resource._id +
            //    '" class="file-link">' + data.title + '<span class="right fa fa-download"></span></a>'))
            preview = $('<div class="preview media-left fa fa-file"></div>')
            if (metadata.isCopy == "true") {
                content = $('<a href="' + resourceUrl + '/download/' + metadata.resource + '" class="file-link" target="_blank>' + filename + '<span class="right fa fa-download"></span></a>')
            } else {
                content = $('<a href="' + resourceUrl + '/download/' + id + '" class="file-link" target="_blank>' + filename + '<span class="right fa fa-download"></span></a>')
            }
            break
        }

        return {preview:preview, content:content}
    }

    function resourceStringToArray(str) {
        arr = []
        if (str != undefined ) {
            if (typeof(str) === 'string') {
                try {
                        arr.push(JSON.parse(str))
                } catch(error) {console.log(str, typeof(str))}
            } else {
                for (var i = 0; i < str.length; i++) {
                    try {
                        arr.push(JSON.parse(str[i]))
                    } catch(error) {}
                }
            }
        }
        console.log(arr)
        return arr
    }
    /******************
     *    Dialogs      *
     ******************/
    function resourceDialog(data, type, source) {
        var modal = $( '<div class="modal fade" id="previewResourceModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' )
        var modalHeader = $( '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button></div>')
        var modalBody = $('<div class="modal-body"></div>')

        var modalFooter = $('<div class="modal-footer"></div>')
        modalFooter.append('<button type="button" class="btn btn-add btn-sm">Share With Class</button>')
        modalFooter.append('<button type="button" class="btn btn-cancel btn-sm" data-dismiss="modal">Cancel</button>')


        var title = $('<h2 class="modal-title">' + data.metadata.title + '</h2>')
        modalBody.append(resourceDisplay(data._id, data.metadata))

        if (type == 'file' || type == 'image' || type == 'document' || type == 'presentation' || type == 'spreadsheet'  || type == 'pdf') {
            var link = resourceUrl + '/download/' + data._id
            modalFooter.append('<a href="' + link + '" class="btn-icon fa fa-download right" ' + 'data-toggle="tooltip" ' + 'data-placement="auto left" title="" ' + 'data-original-title="Download" target="_blank"></a>')
        }
        modalHeader.append(title)
        if ($('input[type="hidden"][name="owner"]').val() == data.metadata.owner) {
            modalFooter.prepend('<a href="' + urlBase + 'resources/edit/' +data._id + '?sid=' + $('input[type="hidden"][name="area"]').val() + '" class="btn-icon fa fa-pencil right"></a>')
        } else {
            modalFooter.prepend('<a href="' + urlBase + 'resources/view/' +data._id + '?sid=' + $('input[type="hidden"][name="area"]').val() + '" class="btn-icon fa fa-eye right"></a>')
        }

        var modalDialog = $('<div class="modal-dialog"></div>')

        var modalContent = $('<div class="modal-classes modal-content"></div>')
        modalContent.append(modalHeader)
        modalContent.append(modalBody)
        modalContent.append(modalFooter)

        modalContent.appendTo(modalDialog)
        modalDialog.appendTo(modal)
        modal.appendTo(source)
    }
    function removeResourceDialog(element, data, source) {
        $('#removeResourceModal').remove()
        var modal = $( '<div class="modal fade" id="removeResourceModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' )
        var modalHeader = $( '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h2 class="modal-title">Remove Resource</h2></div>')
        var modalBody = $('<div class="modal-body"><p>' + _t("confirm-delete-resource") + 'This action cannot be undone.</p></div>')
        //buttons
        var send = $( '<button>', {
            'class': 'btn',
            html: _t('yes')
        }).on('click', function(event) {

            var url = urlBase + 'teacher/removeTopic/' + data.id
            $.ajax({url: url,
                type: 'GET',
                success: function(data, textStatus, jqXHR) {
                    element.remove()
                    cancel.click()
                }
            })
        })
        var cancel = $('<button>', {
            type: 'button',
            'class': 'btn btn-dismiss',
            'data-dismiss': 'modal',
            html: 'Cancel'
        })
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
        modal.appendTo(source)
        $('#removeResourceModal').modal('show')
    }
    /*******************************
    *       Upload Resource        *
    ********************************/
    //######  resource modal functions
    function setResourceModalFunctions() {
        $('#resourceImportModal #upload .btn.add').on('click', attachNewResource)
        $('#resourceImportModal .remote .btn.add').on('click', attachRemoteResource)
        $('#resourceImportModal #resources .btn.add').on('click', attachExistingResource)
        $('#addResourceModal .btn.prev-stage').on('click', function(event) {
            $('#resourceImportModal').modal('show')
            $('#addResourceModal').modal('hide')
        })
        $('#addResourceModal .btn.btn-cancel').on('click', function(event) {
            $('#addResourceModal').modal('hide')
        })
    }
    function attachNewResource(event) {
        var resourceType = $('#resourceImportModal input[name="input-type"]:checked').val()
        var wizard = resourceUploadWizard
        wizard.preview = ""
        wizard.text = $('#resourceImportModal textarea[name="text-input"]').val()
        if (resourceType == "upload") {
            wizard.resourceType = "upload"
            $('#resourceImportModal .validation-box').removeClass('error one type required custom')
            if ($('#resourceImportModal .fileInput').attr('type') === 'button') { //using icab
                title = $('#resourceImportModal .fileInput').val()
                if (title == "Select File" && $('#resourceImportModal #fileUploadIcabFix input[type="hidden"]').length == 0) {
                    $('#resourceImportModal #upload .validation-box').addClass('error required')
                   return
                }
                wizard.fileName = title
                wizard.preview = '<span class="' + getFileIcon({type:title}) + '"></span><span class="file-name">' + title + "</span>"
            } else {
                var files = $('#resourceImportModal .fileInput')[0].files
                if (files.length == 0) {
                    $('#resourceImportModal #upload .validation-box').addClass('error required')
                    return
                }
                var file = wizard.file = files[0]
                wizard.fileName=file.name
                if (window.File && file.type.indexOf('image') != -1) { //check for file api ie9 does not have this
                    var image = wizard.file
                    wizard.preview = $("<img src='" + window.URL.createObjectURL(image) + "'>")
                } else {
                    wizard.preview = '<span class="' + getFileIcon(file) + '"></span><span class="file-name">' + file.name + "</span>"
                }
            }
        } else if (wizard.resourceType == 'link') {
             //TODO escape invalid html
            wizard.preview =  $('<div><a href="' + wizard.text + '">' + wizard.text  + '</a></div>')
        } else {
            wizard.resourceType = 'text'
            if (wizard.text == "") {
                $('#resourceImportModal #upload .validation-box').addClass('error required')
                return
            }
            //    if (wizard.embedElement) wizard.preview = wizard.embedElement
            if ($('#resourceImportModal').hasClass('embed')) {
                wizard.preview  = wizard.embedElement
            } else {
                wizard.preview  = $('<div>').text(wizard.text)
                wizard.preview.html(Autolinker.link(wizard.preview.html(), {className: "text-link"}));
            }
        }
        $('#addResourceModal .resource-preview').empty().prepend(wizard.preview)
        $('#addResourceModal .visibility-box').removeClass("hidden")
        if (wizard.topic) {$("#addResourceModal input[name='topic-tags']").val(wizard.topic) }
        $("#addResourceModal").removeClass("hidden")
        $("#resourceImportModal").addClass("hidden")
    }
    function attachRemoteResource(event) {
        var resourceSource = $(event.currentTarget).closest('.remote').attr('id')
        var wizard = resourceUploadWizard
        wizard.resourceType = 'remote'
        var checked = wizard.fetched = $('#resourceImportModal #' + resourceSource +
            ' .remote-browser input[type="checkbox"]:checked')
        if (checked.length == 0) {
            //error
            return
        } else {
            wizard.preview = $('<div>')
            wizard.preview.append('<span class="fa fa-file"></span>' + checked[0].getAttribute('data-name'))
            $('#addResourceModal input[name="title"]').val(checked[0].getAttribute('data-name').slice(0, checked[0].getAttribute('data-name').lastIndexOf('.')))
            $('#addResourceModal .resource-preview').empty().prepend(wizard.preview)
            $('#addResourceModal .visibility-box').removeClass("hidden")
            if (wizard.topic) {$("#addResourceModal input[name='topic-tags']").val(wizard.topic) }
            $('#addResourceModal').modal('show')
            $('#resourceImportModal').modal('hide')
        }
    }
    function attachExistingResource(event) {
        var wizard = resourceUploadWizard
        wizard.resourceType = 'fetch'
        //existing resource
        var checked = wizard.fetched =  $('#resourceImportModal #resources input[type="checkbox"]:checked')
        if (checked.length == 0) {
            $('#resourceImportModal #resources .validation-box').addClass('error required')
            return
        }
        wizard.preview = previewResource(resources[checked[0].value])
        var resource = resources[checked[0].value]
        $('#addResourceModal input[name="title"]').val(resource.metadata.title)
        $('#addResourceModal textarea[name="description"]').val(resource.metadata.description)
        $('#addResourceModal .resource-preview').empty().prepend(wizard.preview)
        $('#addResourceModal select[name="visibility"]').val(resource.metadata.visibility)
        $('#addResourceModal .visibility-box').addClass("hidden")

        if (wizard.topic) {$("#addResourceModal input[name='topic-tags']").val(wizard.topic) }
        $('#addResourceModal').modal('show')
        $('#resourceImportModal').modal('hide')
    }
    //########### Embed resource data
    function embed(eventObj) {
        var wizard = resourceUploadWizard
        var link = ""
        if (eventObj.originalEvent.clipboardData) {
            link = eventObj.originalEvent.clipboardData.getData('text/plain')
        } else if (window.clipboardData) {
            link = window.clipboardData.getData('Text')
        }
        if (!link.match(regexURL)) return
        var url = urlBase + "service/fetchEmbedData?url=" + encodeURIComponent(link)
        var loadingBtn = $('<button class="btn" type="button"><span class="ld-icon-backpack"></span></button>')
        var addBtn = $('#resourceImportModal #upload .btn.add').replaceWith(loadingBtn)
        var jqxhr = $.get(url, function(response) {
            var embedData = wizard.embedData = response
            //check for valid embed data
            $(eventObj.currentTarget).off('paste', embed)
            if (embedData.html) { //oembed
                embedData.html = embedData.html.replace(/src="http:/, "src=\"https:")
                wizard.embedElement = embedData.html
                $('#resourceImportModal .embeded').append(embedData.html)
            } else  if (embedData.type == 'video') {
                embedData.video = embedData.video.replace(/src="http:/, "src=\"https:")
                wizard.embedElement = $('<iframe width="100%" height="315" src="'
                    + embedData.video + '" frameborder="0" allowfullscreen></iframe>')
                $('#resourceImportModal .embeded').append(wizard.embedElement)
            } else if (embedData.type ==  'article') {
                //TODO add oembed richdata
                /*wizard.embedElement = $('<a href="' + embedData.url + '"><h3>' + embedData.title + '</h3>' +
                    '<span>' + embedData.description || ""  + '</span></a>' +
                    '<a href="' + embedData.url + '"><img width="100%" src="' + embedData.image + '" ></a>')
                 $('#resourceImportModal .embeded').append(wizard.embedElement)*/
                wizard.resourceType = "link"
                wizard.link = link
                embedData = ""
            } else if (embedData.type) {
                wizard.resourceType = "link"
                wizard.link = link
                embedData = ""
            }
            if (embedData.html || embedData.type) {
                $('#resourceImportModal').addClass('embed')
                if ($('#resourceImportModal input[name="title"]').val() == "") {
                    $('#resourceImportModal input[name="title"]').val(embedData.title)
                }
                var disembed = $('#resourceImportModal .embeded .disembed')
                disembed.on('click', function(event) {
                    $('#resourceImportModal .embeded').empty().append(disembed)
                    wizard.embedData = null
                    delete wizard.embedElement
                    $('#resourceImportModal').removeClass('embed')
                    $('#resourceImportModal .text-input').off('paste').on('paste', embed)
                })
                //$('#resourceImportModal .embeded').addClass('embed')

            } else if (response) {
                wizard.resourceType = "link"
                wizard.link = link
            }
        })
        .always(function() { loadingBtn.replaceWith(addBtn); addBtn.on('click', attachNewResource) })
    }
    function createFromRemote(event, success, fail) {
        //var checked = $('#resourceImportModal .onedrive-browser input[type="checkbox"]:checked')
        var deferreds = [], deferResults = []
        var resource = resourceUploadWizard.fetched[0]
        $('#addResourceModal .loading').removeClass('hidden')
        $('#addResourceModal .modal-footer, #addResourceModal .modal-body').addClass('hidden')
        var postVals = {
            'url': resource.getAttribute('data-source'),
            'name': resource.getAttribute('data-name')
        }
        if (resource.getAttribute('data-bearer')) {
            postVals['bearer'] = resource.getAttribute('data-bearer')
        }
        deferreds.push(
            $.post(urlBase + "resources/upload", postVals,
            (function(resource){return function(response) {
                var id = JSON.parse(response.response).id
                console.log(id)
                deferResults.push(id)
                resourceFunctions.resources[id] = {
                    '_id': id,
                    'metadata': {'name': resource.getAttribute('data-name')}
                }
            }}(resource)))
        )
        $.when.apply($, deferreds).then(function() {
                if (deferreds.length == 1) {
                var id = deferResults[0]
                var resource = resourceFunctions.resources[id]
                resource.filename = resource.metadata.name
                var resourceData = {
                    'clientId': $('input[type="hidden"][name="client-id"]').val(),
                    'file-name': resource.metadata.name,
                    'subject': $('.hidden input[name="subject"]').val(),
                    'type': 'file',
                    'title': $('#addResourceModal input[name="title"]').val(),
                    'owner': $('.hidden input[name="owner"]').val(),
                    'visibility': $('#addResourceModal select[name="visibility"]').val(),
                    'description': $('#addResourceModal textarea[name="description"]').val(),
                    'creator': $('.hidden input[name="creator"]').val()
                }
                $('#addResourceModal input[name*="-tags"]').each(function(index, element) {
                    resourceData[element.name] = element.value
                })
                var topicLineData = {
                    'title': resource.metadata.name,
                    'type': getTypeFromFileExtension(resource.metadata.name),
                    'id': id
                }
                resource.metadata = resourceData
                saveResource(resource, function(data) {
                    success(data, topicLineData)
                }, function(request, status, error) {
                    $('#addResourceModal .error').removeClass('hidden')
                    $('#addResourceModal .loading').addClass('hidden')
                })
            }
        }, function(request, status, error) {
            $('#addResourceModal .error').removeClass('hidden')
            $('#addResourceModal .error').addClass('hidden')
        })
    }
    // New topicline
    function createTopicLine(name,topicClass) {
        var clientId = $('input[name="clientId"]').val();
        var owner = $('input[name="owner"]').val();
        var visibility = 1;
        var curriculum = $('input[name="curriculum"]').val();
        var data = new FormData();
        data.append('title', name);
        if ($('input[name="classId"]').length > 0) {
            data.append('classId', $('input[name="classId"]').val());
            data.append('classes['+ clientId + ']', $('input[name="classId"]').val());
        }
        data.append('type', 'topic-line');
        data.append('topic-tags', name);
        data.append('owner', owner);
        data.append('visibility', visibility);
        data.append('curriculum', curriculum);
        data.append('creator', $('input[name="creator"]').val());
        data.append('clientId', clientId);
        data.append('key', $('input[name="key"]').val());
        try {
            data.append('file', new Blob(['Hello']), name)
        } catch(e) { //cannot use blob need to create resource in schoolbag server
            ajaxPost(urlBase + 'service/uploadResource', data,
                function(data, textStatus, jqXHR) {
                    if (data) {
                        try { sessionStorage.setItem('classes-view', 'resources') } catch(error) {}
                        if(topicClass != null) {
                            window.location.href = urlBase + 'resources/mine?rid=' + data.id + '&cid=' + topicClass;
                        }
                        else {
                            window.location.href = urlBase + 'resources/mine?rid=' + data.id;
                        }
                    }
                },{}
            )
        }
        ajaxPost(resourceUrl, data,
            function(data, textStatus, jqXHR) {
                if (data.success) {
                    try { sessionStorage.setItem('classes-view', 'resources') } catch(error) {}
                    if(topicClass != null) {
                        window.location.href = urlBase + 'resources/mine?rid=' + data.id + '&cid=' + topicClass;
                    }
                    else {
                        window.location.href = urlBase + 'resources/mine?rid=' + data.id;
                    }
                }
            },{}
        )
    }

    /*************
    *  Database  *
    *************/
    function uploadResource(resourceData, formData, successCallback, failCallback) {
        addObject(formData, resourceData)
        ajaxPost(resourceUrl, formData, function(result) {
            if (result.success && result.id) {
                successCallback(result)
            } else {
                console.log(result)
            }
        }, function(request, status, error) {
            failCallback(request, status, error)
        })
    }
    function addObject(data, inputArray, prefix) {
        for (var key in inputArray) {
            if (typeof(inputArray[key]) == "object") {
                if (prefix) {
                    addObject(data, inputArray[key], prefix + "[" + key + "]")
                } else {
                    addObject(data, inputArray[key], key)
                }
            } else {
                if (prefix) {
                    data.append(prefix + "[" + key + "]", inputArray[key])
                } else {
                    data.append(key, inputArray[key])
                }
            }
        }
    }
    //when adding a resource to topicLine, we need to update the original resource
    //tags subject and collection get updated
    function updateResourceTags(resource, updateData, successCallback, failCallback) {
        var id = resource.id || resource._id
        var data = new FormData();
        data.append('key', $('.hidden input[name="key"]').val())
        data.append('id', id)
        for (key in updateData) {
            if (key in resource.metadata) {
                if (typeof(resource.metadata[key]) == "string") {
                    if (resource.metadata[key] != updateData[key]) {
                        data.append('metadata.' + key, resource.metadata[key])
                        if (updateData[key] != "") {
                            resource.metadata[key] = [resource.metadata[key]]
                            if (typeof(updateData[key]) == "string") {
                                resource.metadata[key].push(updateData[key])
                                data.append('metadata.' + key, updateData[key])
                            } else {
                                for (var i = 0; i < updateData[key].length; i++) {
                                    resource.metadata[key].push(updateData[key][i])
                                    data.append('metadata.' + key, updateData[key][i])
                                }
                            }
                        }
                    }
                } else {
                    var changeValues = false
                    if (typeof(updateData[key]) == "string") {
                        if (resource.metadata[key].indexOf(updateData[key]) == -1) {
                            resource.metadata[key].push(updateData[key])
                            changeValues = true
                        }
                    } else {
                        for (var i = 0; i < updateData[key].length; i++) {
                            if (resource.metadata[key].indexOf(updateData[key][i]) == -1) {
                                changeValues = true
                                resource.metadata[key].push(updateData[key][i])

                            }
                        }
                    }
                    if (changeValues) {
                        for (var i = 0; i < resource.metadata[key].length; i++) {
                            data.append('metadata.' + key, resource.metadata[key][i])
                       }
                    }
                }
            } else {
                if (updateData[key] != "") {
                    if (typeof(updateData[key]) == "string") {
                        data.append('metadata.' + key, updateData[key])
                        resource.metadata[key] = updateData[key]
                    } else {
                        for (var i = 0; i < updateData[key].length; i++) {
                            data.append('metadata.' + key, updateData[key][i])
                            resource.metadata[key] = updateData[key][i]
                        }
                    }
                }
            }
        }
        ajaxPost(resourceUrl + "/update", data,
            function(data, textStatus, jqXHR) {
                if (successCallback && data.success) {
                    successCallback(data)
                }
            }, function(data, status, error) {
                failCallback(data, status, error)
            }
        )
    }
    //#############################previews####################################
    function previewResource(resource) {
        var data = resource.metadata
        var preview = $('<div class="preview"></div>')
        switch (data.type) {
        case "text":
            //preview.append($('<p>').text(data.text))
            //preview.html(Autolinker.link(preview.html(), {className: "text-link", stripPrefix:false}));
            break
        case "image":
            if (data.isCopy == "true") {
                preview.append('<img src="' + cacheUrl + '/' +  data.resource + '/small">')
            } else {
                preview.append('<img src="' + cacheUrl + '/' +  resource._id + '/small">')
            }

            break
        //TODO update all resource types
        case "topic-line":
            var count = 0
            if (data.objects) {
                count = (typeof(data.objects) == 'string') ? 1 :
                    data.objects.length
            }
            preview.append($('<div class="info">' + count + ' resource' + (count == 1 ? '' : 's') + '</div>'))
            break
        case 'multi-resource':
            var count = 0
            if (data.objects) {
                count = (typeof(data.objects) == 'string') ? 1 :
                    data.objects.length
            } else {
                if (typeof(data.resources) == "string") {
                    count = 1
                } else {
                    count = data.resources.length
                }

            }
            preview.append($('<div class="info">' + count + ' resource' + (count == 1 ? '' : 's') + '</div>'))
            break
        case "rich-text":
            //preview = $('<span>').append(data.text)
            break
        case 'video':
            if (data.isCopy) {
                var origResource = resources[data.resource]
            } else {
                if (data.embed.html) {
                    preview.append($('<img src="' + data.embed.thumbnail_url + '" >'))
                } else {
                    preview.append($('<img src="' + data.embed.image + '" >'))
                }
            }
            break

        case 'link':
            //preview.append($(data.html))
            //preview.attr("target", "_blank")
            //preview.append('<span class="right fa fa-external-link">')
            break
        default:
            //preview.append($('<a href="' + resourceUrl + '/download/' +  resource._id +
            //    '" class="file-link">' + data.title + '<span class="right fa fa-download"></span></a>'))
        }
        return preview
    }
    //copyResource
    function copyResource(resource, ownerId, successCallback, failCallback) {
        var clientId = $('input[name="clientId"]').val()
        var data = new FormData();
        data.append('title', resource.metadata.title)
        data.append('owner', ownerId)
        data.append('clientId', clientId)
        data.append('key', $('input[name="key"]').val())
        data.append('type', resource.metadata.type)
        try {
            data.append('file', new Blob(['Copy']), resource.metadata.title)
        } catch(e) { //cannot use blob need to create resource in schoolbag server
            ajaxPost(urlBase + 'service/uploadResource', data,
                function(data, textStatus, jqXHR) {
                    if (data) {
                        var copy = jQuery.extend(true, {}, resource)
                        copy._id = data.id
                        copy.metadata.owner = ownerId
                        copy.metadata.isCopy = 'true'
                        copy.metadata.resource = resource._id
                        copy.metadata.visibility = 0
                        saveResource(copy)
                        successCallback(data)
                    }
                },{}
            )
        }
        ajaxPost(resourceUrl, data,
            function(data, textStatus, jqXHR) {
                if (data.success) {
                    var copy = jQuery.extend(true, {}, resource)
                    copy._id = data.id
                    copy.metadata.owner = ownerId
                    copy.metadata.isCopy = 'true'
                    copy.metadata.resource = resource._id
                    copy.metadata.visibility = 0
                    saveResource(copy)
                    successCallback(data)
                }
            },{}
        )
    }
    //###########################update resource###############################
    //if a resoruce gets changed through the interface we need to update the resource
    function saveResource(resource, successCallback, failCallback) {
        var id = resource.id || resource._id
        var data = new FormData();
        data.append('filename', resource.filename)
        var timezone = $('input[name="session_timezone"]').val() || 'GMT'
        data.append('lastModified', moment().tz(timezone).format())
        data.append('key', $('input[name="key"]').val())
        data.append('id', id)
        for (key in resource.metadata) {
            if (typeof(resource.metadata[key]) == "string") {
                data.append('metadata.' + key, resource.metadata[key])
            } else {
                if (resource.metadata[key].length == 0) {
                    data.append('metadata.' + key, "")
                }
                for (var i = 0; i < resource.metadata[key].length; i++) {
                   data.append('metadata.' + key, resource.metadata[key][i])
                }
            }
        }
        ajaxPost(resourceUrl + "/update", data,
            function(data, textStatus, jqXHR) {
                if (data.success && successCallback) {
                    successCallback(data)
                }
            }, function(data, status, error) {
                failCallback(data, status, error)
            }
        )
    }
    function resourceJsonToArray(data) {
        var resources = []
        if (data.resources != undefined ) {
            if (typeof(data.resources) === 'string') {
                try {
                        resources.push(JSON.parse(data.resources))
                } catch(error) {}
            } else {
                for (var i = 0; i < data.resources.length; i++) {
                    if (typeof(data.resources[i]) === 'object') {
                        resources.push(data.resources[i])
                    } else {
                        try {
                            resources.push(JSON.parse(data.resources[i]))
                        } catch(error) {}
                    }
                }
            }
        }
        return resources
    }

    return {
        fetchResources: fetchResources, resources: resources, saveResource: saveResource,
        uploadResource: uploadResource, updateResourceTags: updateResourceTags,
        getResourceCard: resourceCard, getResourceRow: resourceRow, getResourceDisplay: resourceDisplay,
        getResourceDialog: resourceDialog, previewResource: previewResource,
        removeDialog:removeResourceDialog, createTopicLine: createTopicLine,
        resourceJsonToArray:resourceJsonToArray, embed: embed,
        setResourceModalFunctions: setResourceModalFunctions, copy: copyResource,
        setAsSubtype: setAsSubtype, resourceDisplayDetails:resourceDisplayDetails
    }

})()
