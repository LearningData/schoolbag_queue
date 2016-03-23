var topicLine = (function() {
    var topics = []
    var resourceUrl = $('input[name="resourceBagUrl"]').val();
    var classId = $(".ld-classes").attr('data-id');
    var mode = {
        //resource
        CREATE: 0,
        EDIT: 1,
        DELETE: 2,
        //topic
        RENAME: 3
    }
    //TODO add functionality to return a unique id to allow the same topic
    function addTopic(id, data){
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
        topics[id] = data
        topics[id].metadata.title =  data.metadata.title || data.metadata.name || data.filename
        topics[id].resources = resources
    }
    function editTopicLine(topicId, resourceData, updateType) {
        var topicData =  topics[topicId]
        var id = topicData.id
        var data = new FormData();
        data.append('key', $('.hidden input[name="key"]').val())
        data.append('id', id)
        updateTopicData(data, topicData, resourceData, updateType)
        var url = resourceUrl + "/update"
        ajaxPost(url, data, function(data, textStatus, jqXHR) {
            if (data.success) {}
        }, {})
    }


    function createTopicLine(data) {
        var title = data.metadata.title
        var titleElement = $('<div class="topicLn-header" data-icon="#icon' + data._id + '">' + '<span class="topic-title">' + title + '</span></div>')
        var topicBlock = $('<div class="topicLn" data-id="' + data._id + '">' + '</div>')
        topicBlock.append(titleElement)
        titleElement.on('click', ldCollapseFunction)
        var topicElements = $('<div id="' + 'topic_' + data._id + '">' + '<span class="drop-target"></span></div>')
        if (data.resources) {
            data.resources.sort(function(a, b) {
                return a.position > b.position
            })
            for (var i = 0; i < data.resources.length; i++) {
                topicElements.append(createResourceItem(data.resources[i]))
            }
            if(getUser() == "teacher") {
                var addResourceItem = $('<span class="ld-icon-new icon-sign classes"></span>')
                addResourceItem.on('click', function(event){
                    event.stopPropagation()
                    url = urlBase + 'resources/mine?rid=' + data._id + '&cid=' + classId;
                    window.location.href = url;
                })
                topicElements.append(addResourceItem);
            }
        } else {
            topicElements.append(_t('topic-no-resources'))
        }
        topicBlock.append(topicElements)
        return topicBlock
    }

    function createResourceItem(resource) {
        if (resource.type == undefined) {
            resource.type = 'application'
        }
        if (resource.type == 'text') {
            if (resource.embed && resource.embed.type == 'video') {
                resource.type = 'video'
            } else if (resource.embed && resource.embed.type) {
                resource.type = 'link'
            }
        }
        var resourceBlock = $('<div class="resource-block ' + resource.type + '" data-id="' + resource.id + '"></div>')
        var wrapper = $("<div class='wrapper'></div>")
        var resourceElement = $('<div class="resource"></div>')
        //change to topicline resources data, now using a label and comment as the existing
        //title and desc was confusing these fields with the org resource data.
        var label = resource.label != undefined ? resource.label : resource.title
        var comment = resource.comment != undefined ? resource.comment : (resource.desc != undefined ? resource.desc : '')
        var descriptionBlock = $('<div class="segment description">')
        descriptionBlock.append("<span class='icon-sign fa'></span>")
        descriptionBlock.append('<h6 class="bold">' + label + '</h6>')
        descriptionBlock.append('<p>' + comment + '</p>')
        resourceElement.append(descriptionBlock)
        var theResource = $('<div class="segment content">').append(resourceFunctions.getResourceDisplay(resource.id, resource))
        theResource.find('img').on('click', function() {viewImageResource(resource.id)})
        resourceElement.append(theResource)
        resourceElement.append("<span class='arrow'></span>")

        wrapper.append(resourceElement)
        resourceBlock.append(wrapper)
        resourceBlock.append("<span class='activity'>" + (resource.activity || "") + "</span>")

        return resourceBlock
    }
    function updateTopicData(data, topicData, resourceData, updateType) {
        if (updateType == mode.RENAME) {
            data.append('metadata.title', resourceData.name)
        } else {
            for (var i = 0; i < topicData.resources.length; i++) {
                var resource = topicData.resources[i]
                if (resource.id != resourceData.id || updateType == mode.ADD) {
                    data.append('resources', JSON.stringify(resource))
                    data.append('metadata.objects', resource.id)
                }
            }
            if (updateType == mode.ADD) {
                data.append('resources', JSON.stringify(resourceData))
                data.append('metadata.objects', resourceData.id)
            }
            if (updateType == mode.EDIT) {
                data.append('resources', JSON.stringify(resourceData))
                data.append('metadata.objects', resource.id)
            }
        }
        return topicData
    }
    function copyTopicData(topic) {
        var data = new FormData();
        for (key in topic.metadata) {
            if (topic.metadata[key]) {
                if (typeof(topic.metadata[key]) == "string") {
                        data.append(key, topic.metadata[key])
                } else {
                    for (var i = 0; i < topic.metadata[key].length; i++) {
                        data.append(key, topic.metadata[key][i])
                    }
                }
            }
        }
        return data
    }
    function copyTopicResources(topic) {
        var data = new FormData();
        var len = topic.resources.length
        if (len == 0) {
            data.append('resources', "")
            data.append('metadata.objects', "")
        } else {
            for (var i = 0; i < topic.resources.length; i++) {
                try {
                    var resource = topic.resources[i]
                    data.append('resources', JSON.stringify(resource))
                    data.append('metadata.objects', resource.id)
                } catch(error) {}
            }
        }
        return data
    }
    function addTopicDataToForm(data, formdata, prefix) {
        for (var key in data) {
            if (typeof(data[key]) == "object") {
                if (prefix) {
                    addTopicDataToForm(data[key], formdata, prefix + "[" + key + "]")
                } else {
                    addTopicDataToForm(data[key], formdata, key)
                }
            } else {
                if (prefix) {
                    formdata.append(prefix + "[" + key + "]", data[key])
                } else {
                    formdata.append(key, data[key])
                }
            }
        }
    }
    function updateTopicLine(topic, successCallback, failCallback) {
        var data = new FormData();
        data.append('key', $('input[name="key"]').val());
        data.append('id', topic._id);
        var timezone = $('input[name="session_timezone"]').val() || 'GMT';
        data.append('lastModified', moment().tz(timezone).format());
        addTopicDataToForm(topic.metadata, data, 'metadata')
        if (topic.resources.length == 0) {
            data.append('resources', "")
        } else {
           addTopicDataToForm(topic.resources, data, 'resources')
        }
        ajaxPost(resourceUrl + "/update", data,
            function(data, textStatus, jqXHR) {
                if (data.success) {
                    successCallback(data)
                }
            }, function(data, status, error) {
                failCallback(data, status, error)
            }
        )
    }
    function updateTopicLineFromCopy(topic, clientId, classId, successCallback, failCallback) {
        var data = new FormData();
        data.append('key', $('input[name="key"]').val());
        data.append('id', topic._id);
        var timezone = $('input[name="session_timezone"]').val() || 'GMT'
        data.append('lastModified', moment().tz(timezone).format());
        addTopicDataToForm(topic.metadata, data, 'metadata')
        if (topic.resources.length == 0) {
            data.append('resources', "")
        } else {
           addTopicDataToForm(topic.resources, data, 'resources')
        }
 
        var updateTLC = $.ajax({
            url : resourceUrl + "/update",
            type: 'POST',
            data : data,
            cache : false,
            dataType : 'json',
            processData : false,
            contentType : false,
            async : false    
        });
 
        updateTLC.done(function(data) {
            if (data.success) {
                successCallback(topic,clientId,classId,successCallback, failCallback);
            }
        });
 
        updateTLC.fail(function (data, status, error) {
            failCallback(topic,data, status, error);
        });
    }
    function cloneTopicLine(topic, ownerId, classId, successCallback, failCallback) {
        var clientId = $('input[name="clientId"]').val()
        var data = new FormData();
        data.append('title', topic.metadata.name)
        data.append('owner', ownerId)
        data.append('clientId', clientId)
        data.append('key', $('input[name="key"]').val())
        data.append('type', 'topic-line')
        try {
            data.append('file', new Blob(['Hello']), topic.metadata.name)
        } catch(e) { //cannot use blob need to create resource in schoolbag server
            ajaxPost(urlBase + 'service/uploadResource', data,
                function(data, textStatus, jqXHR) {
                    if (data) {
                        var clone = jQuery.extend(true, {}, topic)
                        clone._id = data.id
                        clone.metadata.owner = ownerId
                        clone.metadata.classes = []
                        clone.metadata.classes[clientId] = classId
                        updateTopicLine(clone, successCallback, failCallback)
                        removeClassFromTopic(topic, clientId, classId)
                    }
                },{}
            )
        }
        ajaxPost(resourceUrl, data,
            function(data, textStatus, jqXHR) {
                if (data.success) {
                    var clone = jQuery.extend(true, {}, topic)
                    clone._id = data.id
                    clone.metadata.owner = ownerId
                    clone.metadata.classes = []
                    clone.metadata.classes[clientId] = classId
                    updateTopicLine(clone, successCallback, failCallback)
                    removeClassFromTopic(topic, clientId, classId)
                }
            },{}
        )
    }
    function copyTopicLine(topic, ownerId, classId, successCallback, failCallback) {
        topic.metadata.creator = $('input[name="creator"]').val();
        topic.metadata.title += ' (Copy)';
        topic.metadata.visibility = 0;
        var clientId = $('input[name="clientId"]').val();
        topic.metadata.clientId = clientId;
        var data = new FormData();
        data.append('owner', ownerId)
        data.append('clientId', clientId)
        data.append('key', $('input[name="key"]').val());
        data.append('type', 'topic-line');
        try {
            data.append('file', new Blob(['Hello']), topic.metadata.title);
        } catch(e) { //cannot use blob need to create resource in schoolbag server
            ajaxPost(urlBase + 'service/uploadResource', data,
                function(data, textStatus, jqXHR) {
                    if (data) {
                        var copy = jQuery.extend(true, {}, topic)
                        copy._id = data.id;
                        copy.metadata.owner = ownerId;
                        copy.metadata.classes = [];
                        copy.metadata.classes[clientId] = classId;
                        updateTopicLineFromCopy(copy, successCallback, failCallback);
                    }
                },{}
            )
        }
        ajaxPost(resourceUrl, data,
            function(data, textStatus, jqXHR) {
                if (data.success) {
                    var copy = jQuery.extend(true, {}, topic)
                    copy._id = data.id;
                    copy.metadata.owner = ownerId;
                    copy.metadata.classes = [];
                    copy.metadata.classes[clientId] = classId;
                    updateTopicLineFromCopy(copy,clientId, classId, successCallback, failCallback);
                }
            },{}
        )
    }
    function updateTopicLineFunction(topic, classId, updateData, successCallback, failCallback) {


        /*if (typeof(topic.metadata.classId) == "object" && topic.metadata.classId.length > 1) {
            removeClassFromTopic(topic, classId, function () {
                //need to clone topicline and remove from existing
                topic.metadata.classId =  classId
                topic.metadata.owner =  $('.hidden input[name="owner"]').val()
                topic.metadata.clientId = $('.hidden input[name=\"client-id\"]').val()
                formData = copyTopicData(topic)
                formData.append('file', new Blob([' ']), topic.metadata.title)
                formData.append('key', $('.hidden input[name="key"]').val())
                ajaxPost(resourceUrl, formData,
                    function(data, textStatus, jqXHR) {
                        if (data.success) {
                            formData = copyTopicResources(topic)
                            formData.append('metadata.classId', classId)
                            topic._id = data.id
                            updateTopic(data.id, formData, successCallback, failCallback)
                            //$()
                        }
                    }
                )
            })
        } else {
            updateTopic(topic._id, updateData, successCallback, failCallback)
        }*/
        updateTopic(topic._id, updateData, successCallback, failCallback)
    }
    /************
    *           *
    * Database  *
    *           *
    ************/
    function updateTopic(topicId, formData, successCallback, failCallback) {
        formData.append('key', $('input[name="key"]').val());
        formData.append('id', topicId);
        var url = resourceUrl + "/update";
        ajaxPost(url, formData, function(data, textStatus, jqXHR) {
            if (data.success && successCallback) {
                    successCallback(data);
            }
            if (data.error && failCallback) {
                    failCallback(data);
            }
        }, {})
    }
    function excludeClassFromFormData(formdata, topic, clientId, classId) {
        for (var client in topic.metadata.classes) {
            if (client == clientId) {
                if (topic.metadata.classes[clientId] == null || typeof(topic.metadata.classes[clientId]) == "string") {
                    if (topic.metadata.classes[clientId] != classId) {
                        formdata.append('metadata.classes[' + clientId + ']', topic.metadata.classes[clientId])
                        topic.metadata.classes[clientId] = [classId]
                    } else {
                        formdata.append('metadata.classes[' + clientId + ']', "")
                    }
                } else {
                    for (var i = 0; i < topic.metadata.classes[clientId].length; i++) {
                        if (!(topic.metadata.classes[clientId][i] == classId)) {
                            formdata.append('metadata.classes[' + clientId + ']', topic.metadata.classes[clientId][i])
                        }
                    }
                }
            } else {
                if (topic.metadata.classes[clientId] == null || typeof(topic.metadata.classes[client]) == "string") {
                        formdata.append('metadata.classes[' + client + ']', topic.metadata.classes[client])
                } else {
                    for (var i = 0; i < topic.metadata.classes[client].length; i++) {
                        formdata.append('metadata.classes[' + client + ']', topic.metadata.classes[client][i])
                    }
                }
            }
        }
    }
    function addClassToTopic(topic, clientId, classId, successCallback, failCallback) {
        var data = new FormData();
        excludeClassFromFormData(data, topic, clientId, classId);
        if (topic.metadata.classes == undefined) {
            topic.metadata.classes = {"dev": classId}
        }
        else if (topic.metadata.classes[clientId] == undefined || typeof(topic.metadata.classes[clientId] == 'string')) {
            topic.metadata.classes[clientId] = classId;
        } else {
            topic.metadata.classes[clientId].push(classId);
        }
        data.append('metadata.classes[' + clientId + ']', classId);
        updateTopic(topic._id, data, successCallback, failCallback);
    }
    function removeClassFromTopic(topic, clientId, classId, successCallback, failCallback) {
        var data = new FormData()
        excludeClassFromFormData(data, topic, clientId, classId)
        //TODO fix resource metadata to remove classId field
        //remove classId for old classes format
        if (topic.metadata.classId == classId) {
            data.append('metadata.classId', ' ')
        } else if (typeof(topic.metadata.classId) == 'object') {
            data.append('metadata.classId', ' ')
            for (var i = 0; i < topic.metadata.classId.length; i++) {
                if ( topic.metadata.classId[i] != classId) {
                    data.append('metadata.classId', topic.metadata.classId[i])
                }
            }
        }
        updateTopic(topic._id, data, successCallback, failCallback)
    }
    function addResource(topic, resource, index, successCallback, failCallback) {
        //build resource data
        var resourceData = {
            label: resource.metadata.title,
            title: resource.metadata.title,
            comment: "",
            activity: "",
        }
        resourceData['file-name'] = resource.filename || resource.metadata.title;
        resourceData['type'] =  resource.metadata['type'];
        resourceData['id'] = resource._id;
        if (resource.metadata.text) resourceData['text'] = resource.metadata.text;
        if (resource.metadata.html) resourceData['html'] = resource.metadata.html;
        if (resource.metadata.embed) resourceData['embed'] = resource.metadata.embed;
        if (resource.metadata.resources) resourceData['resources'] = resource.metadata.resources;
        if (resource.metadata.description) resourceData['description'] = resource.metadata.description;
        //add ressource to topicline
        if (topic.resources == undefined || topic.resources == "") {
            topic.resources = [];
        }
        if (index == null) {
            topic.resources.push(resourceData);
        } else {
            topic.resources.splice(index, 0, resourceData);
        }
        if (!topic.metadata.objects || topic.metadata.objects == "") {
            topic.metadata.objects = [resourceData.id];
        } else if (typeof(topic.metadata.objects) == "string") {
            topic.metadata.objects = [topic.metadata.objects, resourceData.id];
        } else {
            topic.metadata.objects.push(resourceData.id);
        }
        updateTopicLine(topic, successCallback, failCallback);
    }
    function removeResource(topic, resourceIndex, successCallback, failCallback) {
        topic.resources.splice(resourceIndex, 1)
        if (!topic.metadata.objects || topic.metadata.objects == "") {
            topic.metadata.objects = []
        } else {
            var index = topic.metadata.objects.indexOf(topic.resources[resourceIndex])
            topic.metadata.objects.splice(index, 1)
        }
        updateTopicLine(topic, successCallback, failCallback)
    }
    function editResource(topic, classId, resourceIndex, resource, successCallback, failCallback) {
        topic.resources[resourceIndex] = resource
        var data = copyTopicResources(topic)
        updateTopicLineFunction(topic, classId, data, successCallback, failCallback)
    }
    /************
    *           *
    *   View    *
    *           *
    ************/

    function viewTopicLine(data) {
        addTopic(data._id, data)
        //var topicLineElement = $('<div class="ld-topicLine">')
        var topicBlock = createTopicLine(data)
       // topicLineElement.append(topicBlock)
        var titleElement = topicBlock.find('.topicLn-header').first()
        titleElement.prepend('<span id="icon' + data._id + '" class="collapse-icon-close"></span>')
        titleElement.attr('data-target','#' + 'topic_' +data._id)
        topicElement = topicBlock.find('#topic_' + data._id)
        return topicBlock
    }
    //################################ view image################################
    function viewImageResource(resourceId) {
        $('#viewImage').remove()
        var modal = $('<div class="modal fade" id="viewImage" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">')
        var modalDialog = $('<div class="modal-dialog"></div>')
        var modalContent = $('<div class="modal-classes modal-content"></div>')
        modalContent.append('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><div class="clearfix"></div></div>')
        modalContent.append('<div class="modal-body"><div class="preview"><img src="' + $('input[name="cacheBagUrl"]').val() + '/' + resourceId + '/original"></div></div>')
        modalContent.append('<div class="modal-footer"><a class="btn" href="' + $('input[name="resourceBagUrl"]').val() + '/download/' + resourceId + '">Download</a><button type="button" class="btn btn-dismiss" data-dismiss="modal">Cancel</button></div>')
        modalContent.appendTo(modalDialog)
        modalDialog.appendTo(modal)
        modal.appendTo($('.main-content :first-child')[0])
        modal.modal('show')
    }
    return {
        create:createTopicLine, newResource: createResourceItem,
        addTopic: addTopic, addTopicToClass: addClassToTopic,
        removeClass: removeClassFromTopic,
        addResource: addResource, editResource: editResource, removeResource: removeResource,
        editTopicLine:editTopicLine,
        update: updateTopicLine, clone: cloneTopicLine, copy: copyTopicLine,
        updateTopicLine: updateTopicLineFunction, topics: topics,
        createTopicView: viewTopicLine
    }
})()
