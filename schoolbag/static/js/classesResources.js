var classesResource = (function() {
    var topicLines = {}
    var resourceUrl = $("input[name='resourceBagUrl']").val()
    var cacheUrl = $("input[name='cacheBagUrl']").val()
    var classId = $(".ld-classes").attr('data-id');

    var mode = {
        //resource
        CREATE: 0,
        EDIT: 1,
        DELETE: 2,
        //topic
        RENAME: 3
    }
    function fetchResources(parentElement) {
        var order = []
        var clientId = $('.hidden input[name="clientId"]').val()
        var url = resourceUrl + "/and/search?" +
            "metadata.classId=" + $(".ld-classes").data().id + "&" +
            "metadata.type=topic-line&metadata.clientId=" + clientId
        var jqxhr = $.get(url, function(response) {
            for (var i=0; i < response.items.length; i++) {
                var data = response.items[i]
                if (topicLines[data._id]) {
                    continue
                }
                var classData = data.metadata
                topicLines[data._id] = data
                var pos = 0
                if (data.metadata.classes.position &&
                    data.metadata.classes.position[clientId + ':' + classId]) {
                    pos = data.metadata.classes.position[clientId + ':' + classId]
                }
                order.push({id: data._id, pos: pos})
            }
            var url = resourceUrl + "/and/search?" +
                'metadata.classes.' + clientId + '='
                + classId + "&metadata.type=topic-line"
                var jqxhr = $.get(url, function(response) {
                    for (var i=0; i < response.items.length; i++) {
                        var data = response.items[i]
                        if (topicLines[data._id]) {
                            continue
                        }
                        var classData = data.metadata
                        topicLines[data._id] = data
                        var pos = 0
                        if (data.metadata.classes.position &&
                            data.metadata.classes.position[clientId + ':' + classId]) {
                            pos = data.metadata.classes.position[clientId + ':' + classId]
                        }
                        order.push({id: data._id, pos: pos})
                    }
                $('#topics .loading').addClass('hidden')
                $('#topics .load-success').removeClass('hidden')
                if (Object.keys(topicLines).length == 0) {
                    $('#topics .load-success').addClass('no-items')
                } else {
                    var topicLineElement = $('<div data-sortable="topicLn" data-target=".order-topic">')
                    order.sort(function(a,b) {return a.pos > b.pos})
                    for (var i =0; i < order.length; i++) {
                        var id = order[i].id
                        var nextTopic = topicLine.createTopicView(topicLines[id])
                        topicLineElement.append(nextTopic)
                        var titleElement = nextTopic.find('.topicLn-header').first()
                        titleElement.attr('data-target','#' + 'topic_' + id)
                        topicElement = nextTopic.find('#topic_' + id)
                        topicElement.addClass('sortable connectedSortable collapse')
                        /*var lastModified = topicLines[topic].lastModified
                        if ((lastModified && moment(lastModified).isAfter(moment(lastModified).subtract('d',7))) ||
                            moment(topicLines[topic].uploadDate).isAfter(moment(topicLines[topic].uploadDate).subtract('d',7))) {
                            titleElement.append('<span class="new"><span class="fa fa-globe"></span>!</span>')
                        }*/
                        var resourceCount = $('<span class="resource-count">')
                        var items = topicLines[id].resources.length + ' item'
                        if (topicLines[id].resources.length != 1) { items += 's' }
                        resourceCount.append('<div>' + items + '</div>')
                        titleElement.append(resourceCount)
                        if (getUser() == "teacher") {(function(id){
                            if (topicLines[id].metadata.owner == $('input[name="owner"]').val()) {
                               var editElement = $('<span class="fa fa-pencil" ' + '></span>')
                                editElement.on('click', function(event){
                                    event.stopPropagation()
                                    url = urlBase + 'resources/mine?rid=' + id + '&cid=' + classId;
                                    window.location.href = url;
                                })
                                titleElement.append(editElement)
                            } else {
                                var copyTopicBtn = $('<span class="fa fa-copy"></span>');
                                titleElement.append(copyTopicBtn);
                                copyTopicBtn.on('click', function(event){
                                    $(".popover").remove()
                                    target = $(event.currentTarget)
                                    target.popover({
                                        html : true,
                                        trigger: "manual",
                                        placement : "auto right",
                                        content : function() {
                                            return $('#cloneTopic').html()
                                        }
                                    })
                                    target.popover("show")
                                    $('.popover').on("click", ".btn-close", function(event) {
                                        $(".popover").remove()
                                        return false
                                    })
                                    $('.popover').on("click", '.btn.copy-topic', function(event) {
                                        topicLine.copy(topicLines[id], $('input[name="owner"]').val(), $('input[name="classId"]').val(),  function() {
                                            
                                            var resourceLink;
                                            if(window.location.href.indexOf("#") != -1) {
                                                resourceLink = window.location.href;
                                            }
                                            else {
                                                resourceLink = window.location.href + "#topics";
                                            }
                                            window.location.href = resourceLink;
                                            window.location.reload(true);

                                            var editTopicBtn = $('<span class="fa fa-pencil"></span>')
                                            editTopicBtn.on('click', function() {
                                                url = urlBase + 'resources/mine?rid=' + id
                                                window.location.href = url
                                            })
                                            copyTopicBtn.replaceWith(editTopicBtn)
                                            $(".popover").remove()
                                        })
                                        return false
                                    })
                                    return false
                                })
                            }
                            var removeElement = $('<span class="fa fa-trash" ' + '></span>')
                            removeElement.on('click', function(event){
                                $(".popover").remove()
                                target = $(event.currentTarget)
                                target.popover({
                                    html : true,
                                    trigger: "manual",
                                    placement : "auto right",
                                    content : function() {
                                        return $('#removeTopic').html()
                                    }
                                })
                                target.popover("show")
                                $('.popover').on("click", ".btn-close", function(event) {
                                    $(".popover").remove()
                                    return false
                                })
                                $('.popover').on("click", '.btn.remove-topic', function(event) {
                                    topicLine.removeClass(topicLines[id], $('input[name="clientId"]').val(), $('input[name="classId"]').val(),  function() {
                                        $('.topicLn[data-id="' + id + '"]').remove()
                                    })
                                })
                                return false
                            })
                            titleElement.append(removeElement)
                            titleElement.append('<span class="fa fa-sort order-topic"></span>')
                            
                        
                        }(id))}
                    }
                    $("#topics .load-success .no-content").replaceWith(topicLineElement)
                    $('.resource-block').filter(':even').addClass('left-block')
                    $('.resource-block').filter(':odd').addClass('right-block')
                    if (getUser() == "teacher" && topicLines[id].metadata.owner == $('input[name="owner"]').val()) {
                        $('.sortable').sortable({
                            items: ".resource-block:not(.new-resource)",
                            cancel: "drop-target",
                            handle: ".icon-sign",
                            connectWith: ".connectedSortable",
                            placeholder: "ui-sortable-placeholder",
                            forcePlaceholderSize: true,
                            start: startSorting,
                            change: changeSortPosition,
                            stop: endSorting
                        })
                        $('[data-sortable="topicLn"]').sortable({
                            handle: $('[data-sortable="topicLn"]').attr('data-target'),
                            cancel: "drop-target",
                            stop: updateTopicLnPosition
                        })
                        $(".ld-classes .topicLn .ld-icon-new").on('click', addResourceClick)
                    }
                }
            })
            .fail(function(object, text, error) {
                $('#topics .loading').addClass('hidden')
                $('#topics .load-fail').removeClass('hidden')
            })
        })
        .fail(function(object, text, error) {
            $('#topics .loading').addClass('hidden')
            $('#topics .load-fail').removeClass('hidden')
        })
    }
    /************************
    *                       *
    *   create new topic    *
    *                       *
    ************************/
     function createNewTopic(event) {
        if ($('#newTopicBlock').length > 0) {
            $('#newTopicBlock input').focus()
            return
        }
        var newTopicDiv = $('<div class="topicLn" id="newTopicBlock">')
        var row = $('<div class="topicLn-header">')
        var inputElem = $('<input type="text" name="title" placeholder="' + _t('new-topic-line') + '">')
        var createBtn = $('<button type="button" class="btn  add-topic-line btn-sm">Create</button>')
        var cancelBtn = $('<button type="button" class="btn btn-cancel btn-sm">Cancel</button>')
        var buttons = $('<div>')
        buttons.append(createBtn)
        buttons.append(cancelBtn)
        cancelBtn.on('click', function(event){
            $('#newTopicBlock').remove()
            noContent.removeClass('hidden')
        })
        createBtn.on('click', function(event){
            resourceFunctions.createTopicLine(inputElem.val(),classId);
        })

        var form = $('<h5>')
        form.append(inputElem)
        form.append(buttons)
        row.append(form)
        newTopicDiv.append(row)

        var noContent = $('.ld-classes .load-success .no-content')
        noContent.addClass('hidden')
        $('#topics .title.info-title').after(newTopicDiv)


    }

    /********************
    *                   *
    *   Add resources   *
    *                   *
    ********************/
    //add resource wizard
    function addResourceClick(event) {
        var element = event.currentTarget
        wizard = resourceUploadWizard = {resourceType:'upload'}
        wizard.topic = element.getAttribute('data-topic')
        wizard.id = element.getAttribute('data-id')
        openAddResourceModal()
    }
    function insertResource(topicId, resourceData) {
        $('#addResourceModal .loading').removeClass('hidden')
        $('#addResourceModal .modal-footer, #addResourceModal .modal-body').addClass('hidden')
        var resourceItem = topicLine.newResource(resourceData)
        var classId = $('.ld-classes').attr('data-id') || ""
        var topic = topicLines[topicId] || resourceFunctions.resources[topicId]
        topicLine.addResource(topic, classId, resourceData, null, function() {
            var deleteBlock = $('<span class="btn-icon fa fa-pencil" ' + '></span>')
            deleteBlock.on('click', function(event){
                editResource($(event.currentTarget).parents('.resource-block'))
            })
            resourceItem.find('.description').append(deleteBlock)
            var lastItem = $('[data-id="' + topicId + '"] .resource-block:last').after()
            if (lastItem.length > 0) {
                if (lastItem.hasClass('left-block')) {
                    resourceItem.addClass('right-block')
                } else {
                    resourceItem.addClass('left-block')
                }
                lastItem.after(resourceItem)
            } else {
                $('#topic_' + topicId + ' .ld-icon-new').before(resourceItem)
            }
            $('#addResourceModal').modal('hide')
            $('#addResourceModal .loading').addClass('hidden')
            $('#addResourceModal .modal-footer, #addResourceModal .modal-body').removeClass('hidden')
            if (classId == "" && topicLines[topicId] ==undefined ) { //using resources page
                window.location.reload()
            }
            //window.location.reload()
        })
    }
    function createEditResource(resource, index) {
        var resourceBlock = $('<div class="resource-block"></div>')
        var wrapper = $('<div class="wrapper"></div>')
        var resourceElement = $('<div class="resource"></div>')
        //change to topicline resources data, now using a label and comment as the existing
        //title and desc was confusing these fields with the org resource data.
        var label = $('<input type="text" value="' + (resource.label || "") + '">')
        var comment = $('<input type="text" placeholder="' + _t('comment') + '" value="' + (resource.comment || '' ) + '">')
        var descriptionBlock = $('<div class="segment description">')
        descriptionBlock.append('<label>' + _t('label') + '</label>')
        descriptionBlock.append(label)
        descriptionBlock.append('<label>' + _t('comment') + '</label>')
        descriptionBlock.append(comment)
        descriptionBlock.append("<span class='icon-sign fa'></span>")
        resourceElement.append(descriptionBlock)

        var previewContent = $('<span class="resource-preview"></span>')
        previewContent.append(resourceFunctions.previewResource({_id: resource.id, metadata: resource}))
        var dataTags = $('<span class="tag-data">')
        dataTags.append('<label>' + _t('type-activity') + '</label>' +
            '<input name="activity" type="text" value="'+ (resource.activity || "") + '"' + 'placeholder="' + _t('resource-activity-type') + '">')

        var resourceSegment = $('<div class="segment content">')
        resourceSegment.append(previewContent)
        resourceSegment.append($('<div class="clearfix">'))
        resourceSegment.append(dataTags)
        resourceElement.append(resourceSegment)
        resourceElement.append("<span class='arrow'></span>")
        wrapper.append(resourceElement)
        resourceBlock.append(wrapper)
        var saveBtn = $('<button type="button" class="btn btn-sm">' + _t('save') + '</button>')
        var cancelBtn = $('<button type="button" class="btn btn-cancel btn-sm">' + _t('cancel') + '</button>')
        var deleteBtn = $('<button type="button" class="btn-delete"><span class="fa fa-trash-o"></span> Remove</button>')
        resourceSegment.append(saveBtn)
        resourceSegment.append(cancelBtn)
        resourceSegment.append(deleteBtn)
        saveBtn.on('click', function() {
            var topic = resourceBlock.parents('.topicLn').data().id
            var activity = $('input[name="activity"]').val()
            if (resources[resource.id]) {
                changeResource(resources[resource.id], activity)
            } else {
                $.get(resourceUrl + '/' + resource.id,  function(response) {
                    resources[response._id] = response
                    changeResource(response, activity)
                })
            }
            if (resource.label != label.val() ||
                resource.comment != comment.val() ||
                resource.activity != activity) {
                    resource.label = label.val()
                    resource.comment = comment.val()
                    resource.activity = activity
                    topicLine.editResource(topicLine.topics[topic], $('.ld-classes').data().id, index, resource)
            }
            cancelBtn.click()
        })
        cancelBtn.on('click', function(event) {
            resourceBlock.removeClass('edit-block')
            var newBlock = topicLine.newResource(resource)
            newBlock.attr('class', resourceBlock.attr('class'))
            var deleteBlock = $('<span class="fa fa-pencil" ' + '></span>')
            deleteBlock.on('click', function(event){
                editResource($(event.currentTarget).parents('.resource-block'))
            })
            newBlock.find('.description').append(deleteBlock)
            resourceBlock.replaceWith(newBlock)
            return
        })
        deleteBtn.on('click', function(event) {
            var topic = resourceBlock.parents('.topicLn').data().id
            resourceBlock.remove()
            topicLine.removeResource(topicLine.topics[topic], $('.ld-classes').data().id, index)
            /*if (resources[resource.id]) {
                removeResource(resources[resource.id], topic)
            } else {
                $.get(resourceUrl + '/' + resource.id,  function(response) {
                    resources[response._id] = response
                    removeResource(response, topic)
                })
            }*/
            $('.resource-block').removeClass('left-block right-block')
            $('.resource-block').filter(':even').addClass('left-block')
            $('.resource-block').filter(':odd').addClass('right-block')
        })
        return resourceBlock
    }
    //need to remove reference to topic in metadata.collection
    //add update the selected topic
    function changeResource(resource, activity) {
        if ((typeof(resource.metadata['type-tags']) == "string" &&
            resource.metadata['type-tags'] == activity) ||
           (typeof(resource.metadata['type-tags']) == "object" &&
            resource.metadata['type-tags'].indexOf(activity) == -1)) {
            change = true
            resourceFunctions.updateResourceTags(resource, {'type-tags': activity})
        }
    }
    /*              *
     *   sorting    *
     *              */
    function startSorting(event, ui) {
        var classes = ui.item[0].className
        classes = classes.split(" ")
        for (var i = 0; i < classes.length; i++) {
            ui.placeholder.addClass(classes[i])
        }
        ui.placeholder.append(ui.item.html())
        ui.item.attr('data-topic-id', ui.item.parents('[class="topicLn"]').attr('data-id'))
        ui.item.attr('data-sort-index', ui.item.index() - 1)
        ui.item.removeClass('resource-block')
    }
    function endSorting(event, ui) {
        ui.item.addClass('resource-block')
        $('.resource-block').removeClass('left-block right-block')
        $('.resource-block').filter(':even').addClass('left-block')
        $('.resource-block').filter(':odd').addClass('right-block')
        updatePosition(ui.item)
    }
    function changeSortPosition(event, ui) {
        $('.resource-block').removeClass('left-block right-block')
        $('.resource-block').filter(':even').addClass('left-block')
        $('.resource-block').filter(':odd').addClass('right-block')
        $('.resource-block.new-resource').each(function (index, element) {
            element = $(element)
           if (element.is(':last-child') == false) {
                element.parent().append(element)
           }
        })
    }
    function updatePosition(elemObj) {
        var topicParent = elemObj.parents('.topicLn').attr('data-id')
        var topic = topicLine.topics[topicParent].metadata.title
        var origParent = elemObj.attr('data-topic-id')
        var origPosition = elemObj.attr('data-sort-index')
        var position = elemObj.index()-1
        var resource = topicLine.topics[origParent].resources[origPosition]
        $.get(resourceUrl + '/' + resource.id,  function(response) {
            topicLine.removeResource(topicLine.topics[origParent], origPosition)
            topicLine.addResource(topicLine.topics[topicParent], response, position)
        })
        for (var i = position; i < topicLine.topics[topicParent].resources.length; i++) {
            topicLine.topics[topicParent].resources[i].position = i + 1
        }
        if (origParent != topicParent) {
            if (resources[resource.id]) {
                //removeResource(resources[resource.id], origParent)
                resourceFunctions.updateResourceTags(resources[resource.id], {'topic-tags': topic})
            } else {
                $.get(resourceUrl + '/' + resource.id,  function(response) {
                    resources[response._id] = response
                    resourceFunctions.updateResourceTags(response, {'topic-tags': topic})
                })
            }
        }
    }
    function updateTopicLnPosition(elemObj) {
        $('.topicLn').each(function(index, element) {
            var topicElm = $(element)
            var topic = topicLines[topicElm.attr('data-id')]
            var clientId = $('.hidden input[name="clientId"]').val()
            if (!topic.metadata.classes.position) {
                topic.metadata.classes.position = {}
                topic.metadata.classes.position[clientId + ':' + classId] = index
                topicLine.update(topic, function(){}, function(){})
            } else if (!topic.metadata.classes.position[clientId + ':'+ classId]
                || topic.metadata.classes.position[clientId + ':' + classId] != topicElm.index()) {
                topic.metadata.classes.position[clientId + ':' + classId] = index
                topicLine.update(topic, function(){}, function(){})
            }
        })
    }
    /*              *
     *   editing    *
     *              */
    function editResource(resourceBlock) {
        var index = resourceBlock.index() - 1
        var topic = resourceBlock.parents('.topicLn').data().id
        var resource = topicLine.topics[topic].resources[index]
        if (resource.id != resourceBlock.data().id) {
            return
        }
        var editBlock = createEditResource(resource, index)
        editBlock.attr('class', resourceBlock.attr('class'))
        editBlock.addClass('edit-block')
        resourceBlock.replaceWith(editBlock)
    }


    function updateResourceDialog(element) {

        $("#addResourceModal input[name='topic-id']").val(element.getAttribute('data-id'))
    }
    function updateTopicLineDialog() {
        $("#createTopicLineModal input[name='title']").val('')
    }
    return {
        fetchResources: fetchResources, createNewTopicElement: createNewTopic
    }
})()
