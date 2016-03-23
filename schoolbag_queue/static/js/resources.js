var resourcesPage = (function() {
    //init
    var resourceUrl = $('input[name="resourceBagUrl"]').val();
    var cacheUrl = $('input[name="cacheBagUrl"]').val()
    var editTemplate = null
    var searchParams = {'resourceId': null}
    var embedData = {}
    var resourceLimit = 12
    //var searchParams = {'type':[], 'tag':[]}
    var searchResults = [], filtered = []
    var tagList = {topic:[], activity:[], level:[]}
    var searchObj = {}//temp search object untill resourcebag has full search implemented
    var resourceQueryString = decodeURIComponent(location.search);

    var init = function() {
        $('.ld-resources header' ).click( function(event) {
            window.location.href = urlBase + 'resources'
        })
        // NEW RESOURCE MODELS
        $('#openCreateTopicModal').on('click', openNewTopicDialog)
        // MAIN PAGE FUNCTIONS
        if ($('.ld-resources [data-search="recent-resources"]').length > 0) {
            fetchRecentResources()
        }
        $('.ld-resources .searchBox[data-search="text-search"] .searchBox_input').on('keyup', function(event) {
            if (event.keyCode && event.keyCode == 13) {
                frontPageSearch()
            }
        })
        $('.ld-resources .searchBox[data-search="text-search"] .searchBox_btn').on('click', frontPageSearch)
        $('.search-more-mine').on('click', function(event){
            goToMine({text: $('.searchBox[data-search="text-search"] .searchBox_input').val()})
        })
        $('.search-more-topicln').on('click', function(event){
            goToMyTopicLines({text: $('.searchBox[data-search="text-search"] .searchBox_input').val()})
        })
        $('.search-more-explore').on('click', function(event){
            goToExplore({text: $('.searchBox[data-search="text-search"] .searchBox_input').val()})
        })
        //Navigation
        $('.link-resource-mine').on('click', goToMine)
        $('.ld-resources .entryIcon.topicLn, .resourceLink.topicLn').on('click', goToMyTopicLines)
        $('.ld-resources .entryIcon.explore').on('click', goToExplore)
        //INITIAL SEARCH
        if ($('.adding-topic-mode .load-container-topic').length >0) {
            $.get(resourceUrl + '/' + $('.load-container-topic').attr('data-id'), function(response) {
                resourceFunctions.resources[response._id] = response
                loadContainerTopic(response)
            })
        }
        if ($('.ld-resources [data-search="my-resources"]').length > 0) {
            fetchMyResources()
        }
        if ($('.ld-resources [data-search="my-topic-lines"]').length > 0) {
            fetchMyTopiclines()
        }
        if ($('.ld-resources [data-search="explore"]').length > 0) {
            var query = {}
            fetchResources_NewSearch(query)
        }
        //SEARCH
        $('.ld-resources .search-box input').on('keyup', function(event) {
            if (event.keyCode && event.keyCode == 13) {
                var section = $(event.currentTarget).attr('data-search')
                if ( section == "explore") {
                    var query = {}
                    fetchResources_NewSearch(query)
                } else if (section == "my-topic-lines") {
                    fetchMyTopiclines()
                }
                else if (section == "my-resources") {
                    fetchMyResources()
                }
             }
        })
        $('.ld-resources .search-box .btn').on('click', function(event) {
            var section = $('.ld-resources .search-box input').attr('data-search')
            if ( section == "explore") {
                var query = {}
                fetchResources_NewSearch(query)
            } else if (section == "my-topic-lines") {
                fetchMyTopiclines()
            } else if (section == "my-resources") {
                fetchMyResources()
            }
        })
        if(resourceQueryString != 'undefined' ) {
            $('.ld-resources input[name="subject-label"]').val(parseQueryString(resourceQueryString).subject);
            $('.ld-resources input[name="resource-search"]').val(parseQueryString(resourceQueryString).text);
        }
        //FILTER
        $('.ld-resources .filter .resource-type').on('click', function(event){
            var type = event.currentTarget.getAttribute('data-type')
            var active = $('.ld-resources .filter .resource-type.' + type).hasClass('active')
            if (!active) {
                $('.ld-resources .view-manager').addClass(type + '-type')
                $('.ld-resources .filter .resource-type.' + type).addClass('active')
            } else {
                $('.ld-resources .view-manager').removeClass(type + '-type')
                $('.ld-resources .filter .resource-type.' + type).removeClass('active')
            }
            if ($('.ld-resources [data-search="my-resources"]').length > 0) {
                fetchMyResources()
            } else {
                var query = {}
                fetchResources_NewSearch(query)
            }

        })
        $('.ld-resources select.resource-visibility').on('change', function(event) {
            if ($('.ld-resources [data-search="my-resources"]').length > 0) {
                fetchMyResources()
            } else{
                var query = {}
                fetchResources_NewSearch(query)
            }
        })
        //INITIAL EVENTS
        $('body').on('click', function(event) {

            //TODO
            /**if ($(event.target).closest(".share-topic, .share-resource").length === 0 && $(event.target).closest(".popover").length === 0) {
                $(".popover").remove()
            }*/
        })
        //NEW RESOURCE PAGE
        $('#newResourceContent .btnNext').on('click', newResourceNextStage)
        $('input[name="link-input"]').on('paste blur', generateEmbedData)



        //EXISTING CODE
        $('.ld-resources .ld-control-filters span').on('click', function(event) {
            $('.ld-resources .filter').toggleClass('hidden')
            $('.ld-resources .ld-control-filters span').toggleClass('hidden')
        })
        $('.ld-resources .btn.rich-text').on('click', richText)
        function richText(){
            $('input[type="hidden"][name="type"]').val('rich-text')
            $('textarea[name="text"]').summernote({
                height: 150,
                toolbar: [
                    ['style', ['style']],
                    [ "style", [ "bold", "italic", "underline" ] ],
                        //['fontsize', ["fontsize"]],
                    ['para', ['ul', 'ol', 'paragraph']],
                    ['color', ['color']],
                    //['insert', ['picture', 'link']], // no insert buttons
                ]
            })
            $('textarea[name="text"]').code('')
            $('.ld-resources .btn.rich-text').on('click', plainText)
        }
        function plainText(){
            $('input[type="hidden"][name="type"]').val('rich-text')
            $('textarea[name="text"]').destroy()
            $('.ld-resources .btn.rich-text').on('click', richText)
        }
        var popover = $("body").popover({
            html : true,
            container : '.view-manager',
            selector : ".ld-card",
            trigger: "manual",
            placement : "top auto",
            content : function() {
                return $('#viewResourceModal').html();
            }
        }).parent()
        popover.on("click", ".popover button.close", function(event) {
            $(".popover").remove()
        })
    }
    //############################RECENT RESOURCES#############################
    function fetchRecentResources() {
        var query = {
            "$or" : [{ "$and": [
                {"metadata.clientId":  $('input[name="clientId"]').val()},
                {"metadata.visibility": {"$gt":"0"}}]},
                    {"$and": [
                {"metadata.curriculum": $('input[name="curriculum"]').val()},
                {"metadata.owner": $('body').attr('data-uid')},
                {"metadata.visibility": {"$lte":"2"}}]}]
            }
        var url = resourceUrl + '?limit='+ resourceLimit + '&query=' + encodeURIComponent(JSON.stringify(query))
        $.get( url, function(resultSet) {
            searchResultFunction_NewSearch(resultSet, query)
        })
    }
    function fetchMyResources() {
        var query = {
            "metadata.owner": $('input[type="hidden"][name="owner"]').val(),
            "metadata.clientId":  $('input[type="hidden"][name="clientId"]').val()
        }
        fetchResources_NewSearch(query)
    }

    function fetchResources_NewSearch(query) {
        var subject = $('.resource-subject').val()
        if (subject) {
           query["metadata.subject"] = subject
        }
        if ($('.ld-resources .filter .resource-type').length > 0) {
            var active = $('.ld-resources .filter .resource-type.active')
            if (active.length == 0) {
                query["metadata.type"] = {"$nin": ["topic-line"]}
            } else {
                var typeList = []
                active.each(function (index, element) {
                    var type = element.getAttribute('data-type')
                    if (type == "video") {
                        query["$or"] = [{"metadata.embed.type": "video"},
                            {"metadata.content_type": {"$regex": "video/"}}]
                    }
                    if (type == "audio") {
                        query["$or"] = [{"metadata.content_type": {"$regex": "audio/"}}]
                    }
                    if (type == "file") {
                        typeList.push('pdf')
                    }
                    typeList.push(type)
                })
                if (query["$or"]) {
                    query["$or"].push({"metadata.type":{"$in": typeList}})
                } else {
                    query["metadata.type"] = {"$in": typeList}
                }
            }
        }
        var text = $('.ld-resources .search-box input').val().trim();

        if(text != ""){

            var search = [].concat.apply([], text.split('"').map(function(v,i){
                return i%2 ?  v  : v.split(' ')
            })).filter(Boolean);

            //add metadata title search
            var titleSearch = "";
            var descriptionSearch = "";
            var subjectSearch = "";
            var topicSearch = "";
            var typeSearch = "";
            var levelSearch = "";
            var metaSearchTitle = '{"metadata.title": {"$regex":';
            var metaSearchDesc = '{"metadata.description": {"$regex":';
            var metaSearchSubject = '{"metadata.subject": {"$regex":';
            var metaSearchTopic = '{"metadata.topic-tags": {"$regex":';
            var metaSearchType = '{"metadata.type-tags": {"$regex":';
            var metaSearchLevel = '{"metadata.level-tags": {"$regex":';
            var metaSearchEnd = ',"$options":"i"}},';

            for (var i = 0; i < search.length; i++) {
                titleSearch = titleSearch.concat(metaSearchTitle + '"' + search[i] + '"' + metaSearchEnd);
                descriptionSearch = descriptionSearch.concat(metaSearchDesc + '"' + search[i] + '"' + metaSearchEnd);
                subjectSearch = subjectSearch.concat(metaSearchSubject + '"' + search[i] + '"' + metaSearchEnd);
                topicSearch = topicSearch.concat(metaSearchTopic + '"' + search[i] + '"' + metaSearchEnd);
                typeSearch = typeSearch.concat(metaSearchType + '"' + search[i] + '"' + metaSearchEnd);
                levelSearch = levelSearch.concat(metaSearchLevel + '"' + search[i] + '"' + metaSearchEnd);
            }

            titleSearch = titleSearch.replace(/,$/,"");
            descriptionSearch = descriptionSearch.replace(/,$/,"");
            subjectSearch = subjectSearch.replace(/,$/,"");
            topicSearch = topicSearch.replace(/,$/,"");
            typeSearch = typeSearch.replace(/,$/,"");
            levelSearch = levelSearch.replace(/,$/,"");

            query["$or"] = 
                [
                    {"$and":
                        [   
                            titleSearch
                        ]  
                    },
                    {"$and":
                        [ 
                            descriptionSearch
                        ]
                    },
                    {"$and":
                        [ 
                            subjectSearch
                        ]
                    },
                    {"$and":
                        [ 
                            topicSearch
                        ]
                    },
                    {"$and":
                        [ 
                            typeSearch
                        ]
                    },
                    {"$and":
                        [ 
                            levelSearch
                        ]
                    }
                ]
        }

        var visibility = $('.resource-visibility').val();
        if (visibility == 1) { //my school
            query["metadata.clientId"] = $('input[name="clientId"]').val();
            query["metadata.visibility"] = {"$gte":"1"}
        }
        if (visibility == 2) {
            query["metadata.curriculum"] = $('input[name="curriculum"]').val();
            query["metadata.visibility"] = "2"
        }
        
        var url = resourceUrl + '?limit='+ resourceLimit + '&query=' + encodeURIComponent(JSON.stringify(query));
        url = cleanSearchUrl(url);
        $.get( url, function(response) {
            searchResultFunction_NewSearch(response, query)
        })
    }
    function fetchMyTopiclines() {
        //this block should be only code in this function
        var query = {
           "metadata.owner": $('input[type="hidden"][name="owner"]').val(),
           "metadata.clientId":  $('input[type="hidden"][name="clientId"]').val(),
           "metadata.type": "topic-line"
        }
        fetchResources_NewSearch(query)
    }
    //######################SEARCH RESOURCES####################################
    $('.ld-resources input[name="subject-label"]').autocomplete({
        source: function(request, response) {
            //using regex to ignore case, need escapeRegex to escape special chars from user input
            var avoidDuplicates = []
            var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
            response($('select[name="subject-id"]').find( "option" ).map(function(index, option) {
                var text = $(option).text();
                if(option.value && ( !request.term || matcher.test(text)) && avoidDuplicates.indexOf(option.value) == -1) {
                    avoidDuplicates.push(option.value)
                    return {
                        label: text.trim(),
                        value: option.value,
                      };
                }
                })
            )},
        select: function(event, ui) {
            $('input[name="subject-label"]').val(ui.item.label)
            $('select[name="subject-id"]').val(ui.item.value)
            $('.ld-resources .search-box .btn').click()
            return false
        },
        change: function(event, ui) {
            if (ui.item === null) {
                if (!event.currentTarget.value) {
                    $('input[name="subject-label"]').val('')
                    $('select[name="subject-id"]').val('')
                } else {
                    var val = new RegExp("^" + $.ui.autocomplete.escapeRegex(event.currentTarget.value) + "$", "i");
                    var options = $('option').filter(function(index,element) {
                        if (val.test($(element).text().trim()))
                        return element
                    })
                    if (options.length > 0) {
                        $('select[name="subject-id"]').val(options[0].value)
                    } else {
                        $('input[name="subject-label"]').val('')
                        $('select[name="subject-id"]').val('')
                    }
                }
                $('.ld-resources .search-box .btn').click()
                return false
            }
        }
    })
    function frontPageSearch() {
        $(".searchResults-topicLn .resource-cards .topic-line").remove()
        $(".searchResults-mine .resource-cards .file").remove()
        $(".searchResults-mine .resource-cards .ld-card").remove()
        $(".searchResults-explore .resource-cards .ld-card").remove()
        $(".searchResults-explore .resource-cards .topic-line").remove()

        var text = $('.ld-resources .searchBox[data-search="text-search"] .searchBox_input').val().trim()
        if (text == ""){ return }

        var params = [
            {"metadata.title": {"$regex":text,"$options":"i"}},
            {"metadata.description": {"$regex":text,"$options":"i"}},
            {"metadata.type-tags": {"$regex":text,"$options":"i"}},
            {"metadata.topic-tags": {"$regex":text,"$options":"i"}},
            {"metadata.level-tags": {"$regex":text,"$options":"i"}}
        ]

        var query = {
            "metadata.owner": $('input[type="hidden"][name="owner"]').val(),
            "metadata.clientId":  $('input[type="hidden"][name="clientId"]').val(),
            "metadata.type":  {"$nin": ["topic-line"]},
            "$or": params
        }

        var url = resourceUrl + '?limit=3&query=' + encodeURIComponent(JSON.stringify(query))
        $.get( url, function(response) {
            frontPageSearchResults(response, '.searchResults-mine')
        })

        url = resourceUrl + '?limit=3&query=' +
            encodeURIComponent(JSON.stringify(query))

        $.get( url, function(response) {
            response.items = getTags(response)
            frontPageSearchResults(response, '.searchResults-topicLn')
        })

        var query = {"$and":
            [{"$or" : [
                { "$and": [
                    {"metadata.clientId":  $('input[name="clientId"]').val()},
                    {"metadata.visibility": {"$gte":"1"}}]},
                {"$and": [
                    {"metadata.curriculum": $('input[name="curriculum"]').val()},
                    {"metadata.visibility": "2"}]}]
                },
            {"$or": params
            }]
        }
        url = resourceUrl + '?limit=3&query=' + encodeURIComponent(JSON.stringify(query))
        $.get( url, function(response) {
             frontPageSearchResults(response, '.searchResults-explore')
        })
    }

    function getTags(response){
        var newItems = []
        var usedTags = []

        for (var i = 0; i < response.items.length; i++) {
            var resource = response.items[i]
            types = ["topic-tags",
                "type-tags", "activity-tags", "level-tags"]

            for (var typePos = types.length - 1; typePos >= 0; typePos--){
                type = types[typePos]

                if(resource.metadata[type] != null){
                    var tags = resource.metadata[type]

                    if(tags.constructor === Array){
                        for (var pos = tags.length - 1; pos >= 0; pos--) {
                            tagName = tags[pos]
                            if(usedTags.indexOf(tagName.toLowerCase()) < 0){
                                usedTags.push(tagName.toLowerCase())

                                var tag = JSON.parse(JSON.stringify(resource));
                                tag.filename = tags[pos]
                                tag.metadata.title = tags[pos]
                                tag.metadata.type = "topic-line"
                                newItems.push(tag)
                            }
                        }
                    } else {
                        if(usedTags.indexOf(tags.toLowerCase()) < 0){
                            usedTags.push(tags.toLowerCase())

                            var tag = JSON.parse(JSON.stringify(resource));
                            tag.filename = tags
                            tag.metadata.title = tags
                            tag.metadata.type = "topic-line"
                            newItems.push(tag)
                        }
                    }
                }
            }
        }

        return newItems
    }

    function frontPageSearchResults(response, resultType) {
        $('.recentResources').addClass('hidden')
        $('.searchResults').removeClass('hidden')
        var template = $("#resource-card-template").html()

        if (response.items.length == 0) {
            $('.searchResults ' + resultType).children().addClass('hidden')
            $('.searchResults ' + resultType + ' .no-content').removeClass('hidden')
            return
        } else {
            $('.searchResults ' + resultType).children().removeClass('hidden')
            $('.searchResults ' + resultType + ' .no-content').addClass('hidden')
        }

        Mustache.parse(template)
        for (var i = 0; i < response.items.length; i++) {
            var resource = response.items[i]
            resourceFunctions.resources[resource._id] = resource
            resourceFunctions.setAsSubtype(resource.metadata, resource.metadata)
            var preview = resourceFunctions.previewResource(resource)
            resource.preview = preview.prop('outerHTML')
            resource.displayDate = moment(resource.uploadDate).format('DD/MMM/YY')
            var resourceCard = Mustache.render(template, resource)

            $('.searchResults ' + resultType + ' .resource-cards').append(resourceCard)
        }
        bindIconEvents()
        resourceTooltip()
    }
    function searchResultFunction_NewSearch(resultSet, query) {
        $('.view-manager .grid').empty()
        $('.view-manager .list').empty()
        addMoreResults_NewSearch(resultSet, query)
        if ($('.ld-resources .view-manager .ld-card').length == 0) {
            $('.ld-resources .view-manager .no-content').removeClass('hidden')
        } else {
            $('.ld-resources .view-manager .no-content').addClass('hidden')
        }
        $('.ld-resources .view-manager .loading').addClass('hidden')
    }
    function addMoreResults_NewSearch(resultSet, query) {
        var cardTemplate = $("#resource-card-template").html();
        var rowTemplate = $("#resource-row-template").html();
        Mustache.parse(cardTemplate)
        Mustache.parse(rowTemplate)
        for (var i=0; i < resultSet.items.length; i++) {
            var data = resultSet.items[i]
            resourceFunctions.setAsSubtype(data.metadata, data.metadata)
            if (data.metadata.type) {
                var preview = resourceFunctions.previewResource(data)
                data.preview = preview.prop('outerHTML')
                data.displayDate = moment(data.uploadDate).format('DD/MMM/YY')
                if (data.metadata.owner == $('input[name="owner"]').val()) {
                    data.owner = "mine"
                }
                var resourceCard = Mustache.render(cardTemplate, data)
                var resourceRow = Mustache.render(rowTemplate, data)
                resourceFunctions.resources[data._id] = data
                if (data.metadata.type == "topic-line") {
                    //old resources are stored in json string
                    data.resources = resourceFunctions.resourceJsonToArray(data)
                }
                $('.view-manager .grid').append(resourceCard)
                $('.view-manager .list').append(resourceRow)
            }
        }
        if ($('.has-hover').length == 0) {
            $('.ld-card .contents').addClass('resource-preview')
            $('.ld-card .resource-preview').removeClass('resource-preview')
        }
        bindIconEvents()
        if (resultSet.items.length == resourceLimit) {
            $('.addMore.loadMore').removeClass('hidden');
            $('.addMore.loadMore').off('click').on('click', function(event) {
                var url = resourceUrl + '?limit=' + resourceLimit + '&page=' + resultSet.next + '&query=' + encodeURIComponent(JSON.stringify(query));
                url = cleanSearchUrl(url);
                $.get( url, function(response) {
                    addMoreResults_NewSearch(response, query);
                })
            })
        } else {
           $('.addMore.loadMore').addClass('hidden')
        }
        resourceTooltip()
    }
    function bindIconEvents() {
        $('.save-resource').off('click', saveResource).on('click', saveResource
      )
        $('.share-resource').off('click', shareResource).on('click', shareResource)
        $('.preview-resource').off('click').on('click', resourcePreview)
        $('.preview-row').off('click').on('click', rowPreview)
        $('.share-topic').off('click', shareTopic).on('click', shareTopic)
        $('.copy-topic').off('click', copyTopic).on('click', copyTopic);
        $('.open-embed').off('click', openEmbed).on('click', openEmbed)
        $(".scroll").off('click', scrollTriggerEvent).on('click', scrollTriggerEvent)
    }
    function cleanSearchUrl(url){
        url = url.replace(/%22%7b/gi,"%7b");
        url = url.replace(/%7d%22/gi,"%7d");
        url = url.replace(/%5c/gi,""); 
        return url;   
    }
    function parseQueryString(resourceQueryString){
        var params = {}, queries, temp, i, l;
        resourceQueryString = resourceQueryString.substring(1);
     
        queries = resourceQueryString.split("&");
     
        for ( i = 0, l = queries.length; i < l; i++ ) {
            temp = queries[i].split('=');
            params[temp[0]] = temp[1];
        }
     
        return params;
    }
    //###########################INTERACT WITH RESOUCE##########################
    function resourcePreview(event) {
        event.preventDefault()
        var card = $(event.currentTarget).closest('.ld-card')
        if (card.hasClass('is-selected')) {
            $('.view-manager .resourcePreview').slideToggle(400, function(event){
              $(this).remove()
            })
            card.removeClass('is-selected')
        }
        else {
          resourcePreviewMode(card)
        }
    }
    function resourcePreviewMode(resourceElm) {
        $('.view-manager .resourcePreview').css('visibility','hidden')
        $('.view-manager .resourcePreview').slideToggle(400, function(event){
          $(this).remove()
        })

        $('.ld-card, .ld-row').removeClass('is-selected')
        resourceElm.addClass('is-selected')
        var elem = resourceElm
        if (resourceElm.hasClass('ld-card')) {//need to find last card in row and append preview after
            var percent = 3
            if (Math.round(resourceElm[0].clientWidth*100/resourceElm.parent()[0].clientWidth,2) == 25) {
                percent = 4
            }
            while (elem.next().length > 0 && (elem.index('.ld-card:visible') == -1 || (elem.index('.ld-card:visible') +1) % percent != 0)) {
                elem = elem.next()
            }
        }
        var data = resourceFunctions.resources[resourceElm.attr('data-id')]
        var template = $("#resource-preview-template").html();
        Mustache.parse(template)
        if (data.metadata.type == "topic-line") {
            if (!data.resources || data.resources.length == 0) {
                data.view = "No resources added"
            } else {
                for (var i = 0; i < data.resources.length; i++) {
                    var displayDetails = resourceFunctions.resourceDisplayDetails(data, data.resources[i].id, data.resources[i])
                    data.resources[i].view = displayDetails.preview.prop('outerHTML')
                    data.resources[i].download = displayDetails.content.prop('outerHTML')
                }
                var topicTemplate = $("#resource-topic-view-template").html();

                for (var i = 0; i < data.resources.length; i++) {
                    if(data.resources[i].comment == "") {
                        data.view = Mustache.render(topicTemplate, data, {
                        topicResourceView: $("#resource-in-topic-template-description").html()
                        })
                    }
                    else {
                        data.view = Mustache.render(topicTemplate, data, {
                        topicResourceView: $("#resource-in-topic-template").html()  
                        })
                    }
                }
            }
        } else {
            var displayDetails = resourceFunctions.resourceDisplayDetails(data, data._id, data.metadata)
            data.view = displayDetails.preview.prop('outerHTML')
            data.download = displayDetails.content.prop('outerHTML')
        }
        if (data.metadata.owner == $('input[name="owner"]').val()) {
            data.owner = "mine"
        }
        var resourceCard = Mustache.render(template, data)
        elem.after(resourceCard)
        var previewElm = resourceElm.parent().find('.resourcePreview')
        if ($('.ld-card[data-id="' + data._id + '"]').hasClass('is-added')) {
            previewElm.addClass('is-added')
        }
        previewElm.slideDown()
        bindResourcePreviewEvents(previewElm, resourceElm, data)
        resourceTooltipFooter()
    }
    function bindResourcePreviewEvents(previewElm, resourceElm, data) {
        if (data.metadata.type != 'topic-line') {
            previewElm.find('.add-resource').remove()
            previewElm.find('.share-topic').remove()
            previewElm.find('.copy-topic').remove();
        } else {
            previewElm.find('.save-resource').remove()
            previewElm.find('.share-resource').remove()
        }
        previewElm.find('.resourcePreview-close').on('click',
            function(event) {
                previewElm.slideToggle(400, function(event){
                    previewElm.remove()
                    resourceElm.removeClass('is-selected')
                })
            }
        )
        previewElm.find('.edit-resource').on('click', function(event) {
            resourceEditMode(previewElm, resourceElm)
        })
        bindIconEvents()
        previewElm.find('.add-resource').on('click', function(event) {
          goToMine({resourceId: resourceElm.attr('data-id')})
        })
    }

    function resourceEditMode(previewElm, resourceElm) {
        var panel = previewElm;
        var id = panel.attr('data-id');
        var data = resourceFunctions.resources[id];
        if (editTemplate == null) {
            editTemplate = $("#resource-edit-template").html();
            Mustache.parse(editTemplate);
        }
        var resourceCard = Mustache.render(editTemplate, data);
        var panelParent = panel.parent();
        panel.replaceWith(resourceCard);
        var editPanel = panelParent.find('.resourcePreview');
        editPanel.find('select[name="visibility"]').val(data.metadata.visibility);
        editPanel.find('select[name="visibility"]').uniform();
        editPanel.find('.btn-cancel').on('click',
            function(event) {
                editPanel.replaceWith(panel);
                bindResourcePreviewEvents(panel, resourceElm, data);
            }
        )
        editPanel.find('.close-preview').on('click',
            function(event) {
            editPanel.slideToggle(400, function(event){
                $('.ld-card').removeClass('is-selected')
                editPanel.remove()
            })
        })
        editPanel.find('.btn-edit').on('click', function(event) {
            editResource(id, editPanel)
            resourcePreviewMode(resourceElm)
        })
        if (data.metadata.type == "topic-line") {
             editPanel.find('.delete-resource').on('click', deleteTopic)
        } else {
             editPanel.find('.delete-resource').on('click', deleteResource)
        }
        //Edit Tags
        editPanel.find('.button-input .btn').on('click', addTag)
        editPanel.find('.button-input input').on('keyup', addTag)
        editPanel.find('.remove-tag').on('click', removeTag)
    }
    function rowPreview(event) {
        var row = $(event.currentTarget).closest('.ld-row')
        row.parent().find('.resourcePreview').remove()
        if (row.hasClass('is-selected')) {
            $('.ld-row').removeClass('is-selected')
            return
        }
        $('.ld-row').removeClass('is-selected')
        row.addClass('is-selected')
        var data = resourceFunctions.resources[row.attr('data-id')]
        var display = resourceFunctions.getResourceDisplay(row.attr('data-id'), data.metadata)
        data.view = display.prop('outerHTML')
        var template = $("#resource-preview-template").html();
        Mustache.parse(template)
        //var preview = resourceFunctions.previewResource(data)
        //data.preview = preview.prop('outerHTML')
        //data.displayDate = moment(data.uploadDate).format('DD/MMM/YY')
        var resourceCard = Mustache.render(template, data)
        row.after(resourceCard)
        var previewElm = row.parent().find('.resourcePreview')
        previewElm.slideDown()
        row.parent().find('.resourcePreview .resourcePreview-close').on('click',
            function(event) {
                $('.ld-row').removeClass('is-selected')
                row.parent().find('.resourcePreview').remove()
            }
        )
        bindResourcePreviewEvents(previewElm, row, data)
    }
    function saveResource(event) {
        var id = $(event.currentTarget).attr('data-resource-id')
        var card = $('.ld-card[data-id="' + id +'"]')
        var row = $('.ld-row[data-id="' + id +'"]')
        $('.remove-resource').off('click', removeResource).on('click', removeResource)

        var data = resourceFunctions.resources[card.attr('data-id')]
        if ($('.adding-topic-mode').length > 0) {
            saveResourceTopic(data)

            return
        //add as watcher to resource
        } else if (data.metadata.type == "topic-line") {
            var target = $('.entryIcon.topicLn .entryIcon-number')
            target.text((parseInt(target.text()) || 0) + 1)
            target = $('.resourceLink.topicLn .resourceLink-number')
            target.text(" " + ((parseInt(target.text()) || 0) + 1) + " ")
        } else {
            var target = $('.entryIcon.mine .entryIcon-number')
            target.text((parseInt(target.text()) || 0) + 1)
            target = $('.resourceLink.mine .resourceLink-number')
            target.text(" " + ((parseInt(target.text()) || 0) + 1) + " ")
            resourceFunctions.copy(data, $('input[name="owner"]').val(), function(new_data) {
                card.attr('data-save-id', new_data.id)
                row.attr('data-save-id', new_data.id)
                updateResourceCardSave(data._id)
            })
            return
        }
        updateResourceCardSave(data._id)
    }

    function saveResourceTopic(resourceData) {
        if(resourceData.metadata.type == "topic-line") {
            return
        }
        //Shake function
        jQuery.fn.shake = function(intShakes, intDistance, intDuration) {
          this.each(function() {
            $(this).css("position","relative");
            for (var x=1; x<=intShakes; x++) {
              $(this).animate({left:(intDistance*-1)}, (((intDuration/intShakes)/4)))
              .animate({left:intDistance}, ((intDuration/intShakes)/2))
              .animate({left:0}, (((intDuration/intShakes)/4)));
            }
          });
        return this;
        };

        target = $('.selectedResourcePreview-resourceNumber')
        target.text(" " + ((parseInt(target.text()) || 0) + 1) + " ")
        $(".selectedResourcePreview-resourceCount").shake(4,6,300);
        var topicId = $('.selectedResourcePreview').attr('data-id')
        var topic = resourceFunctions.resources[topicId]

        topicLine.addResource(topic, resourceData, null, function() {
            resourceFunctions.updateResourceTags(resourceData, {
                'topic-tags': topic.metadata.title,
                //'subject': $('.popover [name="select-class"] option:selected').attr('data-class-name')
            })
            $('.remove-resource').off('click', removeResourceTopic).on('click', removeResourceTopic)
            updateResourceCardSave(resourceData._id)
            loadContainerTopic(topic)
        })

    }
    function updateResourceCardSave(id) {
        $('.ld-card[data-id="' + id + '"]').addClass('is-added')
        $('.ld-row[data-id="' + id + '"]').addClass('is-added')
        $('.resourcePreview[data-id="' + id + '"]').addClass('is-added')
    }
    function removeResource(event) {
      var id = $(event.currentTarget).attr('data-resource-id')
      var card = $('.ld-card[data-id="' + id +'"]')
      var row = $('.ld-row[data-id="' + id +'"]')
      var data = resourceFunctions.resources[card.attr('data-id')]
        if (data.metadata.type == "topic-line") {
            var target = $('.entryIcon.topicLn .entryIcon-number')
            target.text(parseInt(target.text()) - 1 || '')
            target = $('.resourceLink.topicLn .resourceLink-number')
            target.text((" " + (parseInt(target.text()) - 1) + " " ) || '')
        } else {
            var target = $('.entryIcon.mine .entryIcon-number')
            target.text(parseInt(target.text()) - 1 || '')
            target = $('.resourceLink.mine .resourceLink-number')
            target.text((" " + (parseInt(target.text()) - 1) + " " ) || '')
            if (card.attr('data-save-id')) {
                var url = urlBase + 'teacher/removeTopic/' + card.attr('data-save-id')
                $.ajax({url: url,
                    type: 'GET',
                    success: function(data, textStatus, jqXHR) {
                        card.removeAttr('data-save-id')
                        row.removeAttr('data-save-id')
                    }
                })
            }
        }
        updateResourceCardRemove(card.attr('data-id'))
    }

    function removeResourceTopic(event) {
        var id = $(event.currentTarget).attr('data-resource-id')
        if ($('.adding-topic-mode').length > 0) {
            target = $('.selectedResourcePreview-resourceNumber')
            target.text(" " + ((parseInt(target.text()) || 0) - 1) + " ")
            var topicId = $('.selectedResourcePreview').attr('data-id')
            var topic = resourceFunctions.resources[topicId]
            if ($(event.currentTarget).closest('.media-resource').length == 1) {
                //remove button clicked from within topic line remove clicked
                index = $(event.currentTarget).closest('.media-resource').index('.media-resource')
                topicLine.removeResource(topic, index, function() {
                    $(event.currentTarget).closest('.media-resource').slideToggle('400', function(event) {
                        $(this).remove()
                    })
                    updateResourceCardRemove(id)
                })
            } else {
            //remove clicked from resource card remove last instance of resource
                for (var i = topic.resources.length-1; i >= 0; i--) {
                    if (topic.resources[i].id == id) {
                        topicLine.removeResource(topic, i, function() {
                            $('.media-resource[data-id="' + id + '"]').last().remove()
                            updateResourceCardRemove(id)
                        })
                        return
                    }
                }
            }
        }
    }
    function updateResourceCardRemove(id) {
        $('.ld-card.is-added[data-id="' + id + '"]').removeClass('is-added')
        $('.ld-row.is-added[data-id="' + id + '"]').removeClass('is-added')
        $('.resourcePreview.is-added[data-id="' + id + '"]').removeClass('is-added')
    }
    function openEmbed(event) {
        var link = $(event.currentTarget).attr('data-link')
        var url = urlBase + "service/fetchEmbedData?url=" + encodeURIComponent(link)
        var jqxhr = $.get(url, function(response) {
            if (response.type == "video") {
                $(event.currentTarget).replaceWith(response.html)
            }
        })
    }

    //#########################SHARE RESOURCE###################################
    function shareResource(event) {
        var target = $(event.currentTarget)
        var id = target.attr('data-resource-id')
        if (!id) {
            return
        }
        var resourceData = resourceFunctions.resources[id]
        if(resourceData.metadata.type == "topic-line") {
            return
        }
        $.uniform.restore($('#addResourceToTopic select[name="select-topicline"]'))
        $(".popover").remove()
        target.popover({
            html : true,
            trigger: "manual",
            placement : "auto",
            content : function() {
                return $('#addResourceToTopic').html()
            }
        })

        var addResource = function(event) {
            event.stopPropagation()
            if ($('.popover [name="select-topicline"]').val() == "") {
                $('.popover .validation-box').addClass('error required')
               return
            }
            var clientId = $('input[name="clientId"]').val()
            $('.popover .btn.add-resource').replaceWith($('<button class="btn btn-sm"><span class="fa fa-spinner fa-spin"></span></button>'))
            topicId = $('.popover [name="select-topicline"]').val()
            topicLine.addResource(topicLine.topics[topicId], resourceData, null, function() {
                resourceFunctions.updateResourceTags(resourceData, {
                    'topic-tags': topicLine.topics[topicId].metadata.title//,
                    //'subject': $('.popover [name="select-class"] option:selected').attr('data-class-name')
                })
                $('.popover button.btn').addClass('hidden')
                $('.popover .btn.view-topic').removeClass('hidden')
                $('.popover .btn.view-topic').on('click', function(event) {
                    $(".popover").remove()
                    loadContainerTopic(topicLine.topics[topicId],1);
                })
            }, function() {
                //add error message
            })
        }

        if ($('#addResourceToTopic select[name="select-topicline"] option').length == 1) {
            var url = resourceUrl + "/and/search?" +
            "metadata.type=topic-line" +
            "&metadata.clientId=" + $('input[name="clientId"]').val() +
            "&metadata.owner=" + $('input[name="owner"]').val() + "&limit=1000"
            $.get(url, function(response) {
                if (response.items.length > 0) {
                    for (var i=0; i < response.items.length; i++) {
                        topicLine.addTopic(response.items[i]._id, response.items[i])
                        $('#addResourceToTopic select[name="select-topicline"]').append(
                            '<option value="' + response.items[i]._id + '">' +
                          response.items[i].metadata.title + '</option>')
                    }
                    $(event.currentTarget).popover("show")
                    $('.popover select[name="select-topicline"]').combobox()
                    $('.popover').on("click", ".btn-close", function(event) {
                        $(".popover").remove()
                    })
                    $('.popover').on("click", '.btn.add-resource', addResource)
                }
            })
        } else {
            $(event.currentTarget).popover("show")
            $('.popover select[name="select-topicline"]').combobox()
            $('.popover').on("click", ".btn-close", function(event) {
                $(".popover").remove()
            })
            $('.popover').on("click", '.btn.add-resource', addResource)
        }

    }
    function shareTopic(event) {
        var target = $(event.currentTarget)
        var id = target.attr('data-topic-id')
        if (!id) {
            return
        }
        var resourceData = resourceFunctions.resources[id]
        if(resourceData.metadata.type != "topic-line") {
            return
        }
        $.uniform.restore($('#addTopicToClass select[name="select-class"]'))
        $(".popover").remove()
        target.popover({
            html : true,
            trigger: "manual",
            placement : "auto top",
            content : function() {
                return $('#addTopicToClass').html()
            }
        })
        $(event.currentTarget).popover("show")
        $('.popover input[name="topic-id"]').val(resourceData._id)
        $('.popover input[name="label"]').val(resourceData.metadata.title)
        $('.popover select[name="select-class"]').val("")
        $('.popover select[name="select-class"]').combobox()
        $('.popover').on("click", ".btn-close", function(event) {
            $(".popover").remove()
        })
        $('.popover').on("click", '.btn.add-topic-line', function(event) {
            event.stopPropagation()
            if ($('.popover [name="select-class"]').val() == "") {
                $('.popover .validation-box').addClass('error required')
                return
            }
            if (!validation.validateElement($('.popover input[name="label"]')[0])) return
            var classId = $('.popover [name="select-class"]').val();
            $('.popover .btn.view-class').attr('href', urlBase + getUser() +
                '/showClass/' + classId + '#topics');
            var clientId = $('input[name="clientId"]').val();
            var subject = $('.popover').find(':selected').data('class-name');
            $('.popover .btn.add-topic-line').replaceWith($('<button class="btn"><span class="fa fa-spinner fa-spin"></span></button>'))
            topicLine.addTopicToClass(resourceData, clientId, classId, function() {
                resourceFunctions.updateResourceTags(resourceData, {
                    'topic-tags': $('.popover input[name="label"]').val(),
                    'subject': subject
                })
                $('.popover button.btn').addClass('hidden')
                $('.popover .btn.view-class').removeClass('hidden')
            }, function() {
                //add error message
            })
        })
    }

    function copyTopic(event) {
        var target = $(event.currentTarget);
        var id = target.attr('data-topic-id')
        if (!id) {
            return
        }
        var resourceData = resourceFunctions.resources[id]
        if(resourceData.metadata.type != "topic-line") {
            return
        }
        $(".popover").remove()
        target.popover({
            html : true,
            trigger: "manual",
            placement : "auto top",
            content : function() {
                return $('#copyTopicLine').html()
            }
        })
        $(event.currentTarget).popover("show")
        $('.popover input[name="topic-id"]').val(resourceData._id)
        $('.popover input[name="label"]').val(resourceData.metadata.title)
        $('.popover').on("click", ".btn-close", function(event) {
            $(".popover").remove()
        })

         $('.popover').on("click", '.btn.copy-topic-line', function(event) {
            var userId = $('input[name="owner"]').val();
            var classId = "";

            topicLine.copy(resourceData, userId, classId, function(topic,clientId,classId, successCallback, failCallback) {
                $(".popover").remove();
                topicLine.removeClass(topic, clientId, classId, successCallback, failCallback);
                window.location.href = urlBase + 'resources/topicLine';
            }, function(topic,data,status,error){
                if(status == "error") {
                    $(".popover").remove();
                    $('.copy-topic-line-message').removeClass('hidden');
                    window.scrollTo(0,0);
                    deleteTopicCopy(topic._id);
                    $('.copy-topic-line-message').click(function(){
                        $(this).addClass('hidden');
                    });
                }
            });
            return false;
        })
    }

    //#########################LOAD INITIAL TOPIC##############################
    function loadContainerTopic(topic,expanded) {
        if(typeof expanded != 'undefined') {
            $("html,body").animate({scrollTop: 100}, 1000);
        }

        var template = $("#topic-container").html();

        if (topic.metadata.type == "topic-line") {
            topic.resources = resourceFunctions.resourceJsonToArray(topic)
            if (!topic.resources || topic.resources.length == 0) {
                topic.view = "No resources added"
            } else {
                for (var i = 0; i < topic.resources.length; i++) {
                    var displayDetails = resourceFunctions.resourceDisplayDetails(topic, topic.resources[i].id, topic.resources[i])
                    topic.resources[i].view = displayDetails.preview.prop('outerHTML')
                    topic.resources[i].download = displayDetails.content.prop('outerHTML')
                }
                var topicTemplate = $("#resource-topic-view-template").html();
                topic.view = Mustache.render(topicTemplate, topic, {
                    topicResourceView: $("#resource-in-topic-edit-template").html()
                })
            }
        }
        resourceFunctions.resources[topic._id] = topic
        $('.selectedResourcePreview').empty().append(Mustache.render(template, topic))
        bindIconEvents()
        $('.selectedResourcePreview').find('.remove-resource-topic').on('click', removeResourceTopic)
        $('.selectedResourcePreview').find('.remove-topic').on('click', function(event) {
            $('.selectedResourcePreview').slideToggle(400, function(event){
                $('.selectedResourcePreview').empty()
                $('.selectedResourcePreview').removeClass('load-container-topic')
                $('.ld-resources').removeClass('adding-topic-mode')
                $('.ld-card, .ld-row, .resourcePreview').removeClass('is-added')

            })
        })
        $('.ld-resources').addClass('adding-topic-mode')
        $('.selectedResourcePreview').css('display', 'block')
            .attr('data-topic-id', topic._id)
            .addClass('load-container-topic')
        //auto expand topic line here
        if(typeof expanded != 'undefined') {
            $('#topicEditCollapse').addClass('collapsed');
            $('.remove-topic').css('visibility', 'hidden');
            $('.ld-resources .removeMode').addClass('in').removeClass('collapse');
            $('.ld-resources .removeMode').css('height','auto');
            $('.ld-resources .view-manager').addClass('hidden');
        }
        $('.load-container-topic').attr('data-id', topic._id)
        $('.ld-resources .removeMode, #topicEditCollapse').on('shown.bs.collapse', function(event) {
            $('select[name="visibility"]').val(topic.metadata.visibility);
            $('select[name="visibility"]').uniform();
            if ($('.ld-resources .searchResults').hasClass('hidden')) {
                //remove other collapse
                if ($(event.currentTarget).hasClass('removeMode')) {
                    $('#topicEditCollapse').addClass('collapse').removeClass('in')
                } else {
                    $('.ld-resources .removeMode').addClass('collapse').removeClass('in')
                }
            } else {
                $('.ld-resources .searchResults').addClass('hidden')
                $('.remove-topic').css('visibility', 'hidden')
             }
            $('.topiclineEdit .resourcePreview-close').removeClass('hidden')
        })
        $('.ld-resources .removeMode, #topicEditCollapse').on('hide.bs.collapse', function(event) {
          $('.ld-resources .searchResults').removeClass('hidden')
          $('.topiclineEdit .resourcePreview-close').addClass('hidden')
          $('.remove-topic').css('visibility', 'visible')
        })
        $('.edit-topic').on('click', function(event) {
            editResource(topic._id, $('#topicEditCollapse'))
            $('#topicEditCollapse').collapse('hide')
        })
        $('.delete-topic').off('click', deleteTopic).on('click', deleteTopic)
        $('.topiclineEdit .btn-cancel').on('click', function(event) {
            $('#topicEditCollapse').collapse('hide')
        })
    }
    //##########################NAVIGATION#####################################
    function goToMine(params) {
        searchParamsForm(params, 'resources/mine')
    }
    function goToMyTopicLines(params) {
        searchParamsForm(params, 'resources/topicLine')
    }
    function goToExplore(params) {
        searchParamsForm(params, 'resources/explore')
    }
    function searchParamsForm(params, action) {
        var query = ""
        if (params.resourceId) {
            query = "?rid=" + params.resourceId
        } else if ($('.load-container-topic').length == 1) {
            query = "?rid=" + $('.load-container-topic').attr('data-id')
        }
        if (params.text) {
            if (query == "") {
                query = "?text=" + encodeURIComponent(params.text)
            }
            else {
                query += "&text=" + encodeURIComponent(params.text)
            }
        } else if ($('.ld-resources .search-box input').val()) {
            if (query == "") {
                query = "?text=" + encodeURIComponent($('.ld-resources .search-box input').val())
            }
            else {
                query += "&text=" + encodeURIComponent($('.ld-resources .search-box input').val())
            }
        }
        if ($('.ld-resources select.resource-subject').val()) {
            if (query == "") {
                query = "?subject=" + encodeURIComponent($('.ld-resources select.resource-subject').val())
            }
            else {
                query += "&subject=" + encodeURIComponent($('.ld-resources select.resource-subject').val())
            }
        }
        window.location.href = urlBase + action + query;
    }
    //##########################NEW RESOURCES###################################
    function generateEmbedData(event) {
        var link = $('input[name="link-input"]').val()
        if (event.originalEvent.clipboardData) {
            link = event.originalEvent.clipboardData.getData('text/plain')
        } else if (window.clipboardData) {
            link = window.clipboardData.getData('Text')
        }
        if (link == "" || !link.match(regexURL)) return
        var url = urlBase + "service/fetchEmbedData?url=" + encodeURIComponent(link)
        var nextBtn = $('#newResourceContent .btnNext')
        nextBtn.replaceWith($('<button class="btn btn-sm btnLoading"><span class="fa fa-spinner fa-spin"></span></button>'))
        var jqxhr = $.get(url, function(response) {
            $(event.currentTarget).off('paste blur', generateEmbedData)
            embedData = response
            if (embedData.title) {
                $('input[name="title"]').val(embedData.title)
            }
            return
        })
        .always(function() {
            $('#newResourceContent .btnLoading').replaceWith(nextBtn)
            nextBtn.on('click', newResourceNextStage)
            $(event.currentTarget).on('paste blur', generateEmbedData)
        })
    }
    function newResourceNextStage(args) {
        var resourceData = {}
        var preview = ""
        var formData = new FormData()
        if ($('.nav-resource .active').attr('data-input-type') == "text") {
            var text = $('textarea[name="text-input"]').val()
            if (text == "") {
                $('textarea[name="text-input"]').closest('.validation-box').addClass('error required')
                return
            } else {
                resourceData['type'] = 'text'
                resourceData['text'] = text
                preview  = $('<div class="resource-text"><p>').text(text)
                preview.html(Autolinker.link(preview.html(), {className: "text-link"}));
                formData.append('file', new Blob([' ']), " ")
            }
        } else if ($('.nav-resource .active').attr('data-input-type') == "file") {
            resourceData.type = "file"
            if ($('[name="resource-upload"]').attr('type') === 'button') { //using icab
                title = $('[name="resource-upload"]').val()
                if (title == "Select File" && $('#fileUploadIcabFix input[type="hidden"]').length == 0) {
                    $('[name="resource-upload"]').closest('.validation-box').addClass('error required')
                   return
                }
                resourceData.fileName = title
                preview = '<div class="resource-file"> <span class="' + getFileIcon({type:title}) + '"></span><span class="file-name">' + title + "</span></div>"
            } else {
                var files = $('[name="resource-upload"]')[0].files
                if (files.length == 0) {
                    $('[name="resource-upload"]').closest('.validation-box').addClass('error required')
                    return
                }
                var file = files[0]
                resourceData.file = file
                resourceData.fileName = file.name
                if (window.File && file.type.indexOf('image') != -1) { //check for file api ie9 does not have this
                    preview = $("<div class='resource-image' style='background-image:url(" + window.URL.createObjectURL(file) + ");'>")
                } else {
                    preview = '<div class="resource-file"><span class="' + getFileIcon(file) + '"></span><span class="file-name">' + file.name + "</span></div>"
                }
                formData.append('file', file, file.name)
                var titleAlias = file.name.substr(0,file.name.lastIndexOf('.')) || file.name;
                $('input[name="title"]').val(titleAlias);
            }
        } else if ($('.nav-resource .active').attr('data-input-type') == "link") {
            var text = $('input[name="link-input"]').val()
            if (text == "") {
                $('input[name="link-input"]').closest('.validation-box').addClass('error required')
                return
            } else {
                resourceData['type'] = 'link'
                resourceData['text'] = resourceData['link'] = text
                if (embedData) {
                    resourceData['embed'] = embedData
                }
                formData.append('file', new Blob([' ']), " ")
                if (embedData.thumbnail_url) {
                    preview = $("<div class='resource-image' style='background-image:url(" + embedData.thumbnail_url + ");'>")
                    $('.embeded').empty().append(preview.clone())
                } else {
                    preview  = '<a href="' + text + '" class="resource-link"><span class="fa fa-link"></span>' + text + '</a>'
                }
            }
        }
        $('.resource-preview').empty().append(preview)
        $('#newResourceContent').addClass('hidden')
        $('#newResourceCreate').removeClass('hidden')
        $('#newResourceCreate .new-resource').off('click').on('click', function(event) {
            createNewResource(resourceData, formData)
        })
    }
    function createNewResource(resourceData, formData) {
        //get resource type + data
        if (!validation.validateElement($('.ld-resources input[name="title"]')[0])) return
        $('#newResourceCreate .new-resource').replaceWith($('<button class="btn btn-sm"><span class="fa fa-spinner fa-spin"></span></button>'))
        resourceData['description'] =  $('.ld-resources textarea[name="description"]').val();
        resourceData['title'] =  $('input[name="title"]').val();
        if ($('select[name="subject"]').val()) {
            resourceData['subject'] =  $('select[name="subject"]').val();
        }

        formData.append('owner', $('input[name="owner"]').val());
        formData.append('visibility', $('select[name="visibility"]').val());
        formData.append('subject', $('input[name="subject-label"]').val());
        formData.append('creator', $('input[name="creator"]').val());
        formData.append('clientId', $('input[name="clientId"]').val());
        formData.append('curriculum', $('input[name="curriculum"]').val());
        formData.append('key', $('input[name="key"]').val());
        $('input[name*="-tags"]').each(function(index, element) {
            formData.append(element.name, element.value);
        })

        resourceFunctions.uploadResource(resourceData, formData, function(data) {
            window.location.href = urlBase + 'resources/mine'
        }, function(request, status, error) {
            $('#addResourceModal .error').removeClass('hidden')
            $('#addResourceModal .loading').addClass('hidden')
        })
    }
    function createResourceFromRemote(file, extraData) {
        if (!validation.validateElement($('.ld-resources input[name="title"]')[0])) return
        $('#newResourceCreate .new-resource').replaceWith($('<button class="btn btn-sm"><span class="fa fa-spinner fa-spin"></span></button>'))
        var deferreds = [], deferResults = []
        var postVals = {
            'url': extraData.url || 'https://www.googleapis.com/drive/v2/files/' + file.id + '?alt=media',
            'name': file.name
        }
        if (extraData.bearer) {
            postVals['bearer'] = extraData.bearer
        }
        deferreds.push(
            $.post(urlBase + "resources/upload", postVals,
                (function(file){return function(response) {
                    var id = JSON.parse(response.response).id
                    deferResults.push(id)
                    resourceFunctions.resources[id] = {
                        '_id': id,
                        'metadata': {'name': file.name}
                    }
                }}(file))
            )
        )
        $.when.apply($, deferreds).then(function() {
            if (deferreds.length == 1) {
                var id = deferResults[0]
                var resource = resourceFunctions.resources[id]

                if(extraData.hasOwnProperty('ext'))
                    resource.filename = resource.metadata.name + extraData.ext;
                else
                    resource.filename = resource.metadata.name;

                var resourceData = {
                    'clientId': $('input[name="clientId"]').val(),
                    'curriculum': $('input[name="curriculum"]').val(),
                    'type': extraData.type,
                    'title': $('input[name="title"]').val(),
                    'owner': $('input[name="owner"]').val(),
                    'visibility': $('select[name="visibility"]').val(),
                    'description': $('.ld-resources textarea[name="description"]').val(),
                    'creator':  $('input[name="creator"]').val(),
                    'content_type': extraData.cType
                    }

                if ($('select[name="subject"]').val()) {
                    resourceData['subject'] =  $('select[name="subject"]').val()
                }
                $('input[name*="-tags"]').each(function(index, element) {
                    resourceData[element.name] = element.value
                })
                resource.metadata = resourceData
                resourceFunctions.saveResource(resource, function(data) {
                    window.location.href = urlBase + 'resources/mine'
                }, function(request, status, error) {
                })
            }
        })
    }
    //############################MODIFY RESOURCE###############################
    function editResource(resourceId, container) {
        var resource = resourceFunctions.resources[resourceId]
        resource.metadata['topic-tags'] = []
        resource.metadata['type-tags'] = []
        resource.metadata['level-tags'] = []
        var title = container.find('input[name="title"]').val()
        var description = container.find('textarea[name="description"]').val()
        if (resource.metadata['title'] != title) {
            delete resource.metadata['title']
            resource.metadata['title'] = title
        }
        if (resource.metadata['description'] != description) {
            delete resource.metadata['description']
            resource.metadata['description'] = description
        }
        resource.metadata['visibility'] =  container.find('select[name="visibility"]').val()
        container.find('input[name*="-tags"]').each(function(index, element) {
            if (element.value !="") {
               resource.metadata[element.name].push(element.value)
            }
        })
        container.find('.facet-list [data-tag-type]').each(function(index, element) {
            resource.metadata[$(element).attr('data-tag-type') + '-tags'].push($(element).text().trim())
        })
        resourceFunctions.saveResource(resource, null)
    }
    function deleteTopic(event) {
        $('#removeTopicModal').modal('show')
        var id = $(event.currentTarget).attr('data-id')
        $('#removeTopicModal .btn.remove').off('click').on('click', function(event) {
            var url = urlBase + 'teacher/removeTopic/' + id
            $.ajax({url: url,
            type: 'GET',
            success: function(data, textStatus, jqXHR) {
                if ($('.adding-topic-mode').length == 1) {
                    window.location.href = window.location.pathname
                } else {
                    $('.ld-card[data-id="' + id + '"], .ld-row[data-id="' + id + '"]').remove()
                    $('.view-manager .resourcePreview').remove()
                    $('#removeTopicModal').modal('hide')
                }
            }
            })
        })

    }
    function deleteTopicCopy(topicId) {
        var id = topicId;
        var url = urlBase + 'teacher/removeTopic/' + id;
        $.ajax({
            url: url,
            type: 'GET',
            success: function(data, textStatus, jqXHR) {
                if ($('.adding-topic-mode').length == 1) {
                    window.location.href = window.location.pathname
                } else {
                    $('.ld-card[data-id="' + id + '"], .ld-row[data-id="' + id + '"]').remove()
                }
            }
        });
    }
    function deleteResource(event) {
        $('#removeResourceModal').modal('show')
        var id = $(event.currentTarget).attr('data-id')
        $('#removeResourceModal .btn.remove').off('click').on('click', function(event) {
            var url = urlBase + 'teacher/removeTopic/' + id
            $.ajax({url: url,
            type: 'GET',
            success: function(data, textStatus, jqXHR) {
                $('.ld-card[data-id="' + id + '"], .ld-row[data-id="' + id + '"]').remove()
                $('.view-manager .resourcePreview').remove()
                $('#removeResourceModal').modal('hide')
            }
            })
        })
    }

    //##########################NEW TOPICLINE###################################
    function openNewTopicDialog(event) {
        $('#resourceImportModal').modal('hide')
        $('#createTopicLine input').val("")
        $('#createTopicLine').on('shown.bs.modal', function (e) {
          setTimeout(function() {
            $('#createTopicLine input').focus()
          },0)
        })
        $('#createTopicLine .add-topic-line').off('click').on('click', function(event) {
            resourceFunctions.createTopicLine($('#createTopicLine input[name="title"]').val())
            url = urlBase + "resources/createEvent"

            $.ajax({
                type: "POST",
                url: url,
                data: {"eventName": "topic-line-created"}
            });
        })
        $('#createTopicLine').modal('show')
    }

    /*######################RESOURCES DETAILS#################################*/
    function fetchResourceDetails() {
        var url = resourceUrl + '/' + $('input[type="hidden"][name="rid"]').val()
        $.get(url, function(response) {
            var containter = $('#viewing-resource')
            var resource = response
            resourceFunctions.resources[resource._id] = resource
            var resourceElement = $('<span class="' + resource.metadata.type  + '">')
            resourceElement.append(resourceFunctions.getResourceDisplay(resource._id, resource.metadata))
            containter.append(resourceElement)

            $('.loading').addClass('hidden')
            $('#viewing-resource').removeClass('hidden')
        })
    }
    /*######################EDIT DETAILS######################################*/
    function addTag(event) {
        if (event.keyCode && event.keyCode != 13) {
            return
        }
        var target = $(event.currentTarget).closest('.add-facet')
        var type = target.attr("data-tag-type")
        var text = target.find('input:not(:hidden)').val()
        if (text == "") return
        var tag = $('<div class="ld-tag color" data-tag-type="' + type + '" >' + text + ' </div>')
        var removeIcon = $('<span class="remove fa fa-times-circle">')
        tag.append(removeIcon)
        $('.facet-list.' + type).append(tag)
        removeIcon.on('click', removeTag)
        target.find('input:not(:hidden)').val("")
    }

    function removeTag(event) {
        $(event.currentTarget).closest('[data-tag-type]').remove()
    }
    function removeSubject(event) {
        $(event.currentTarget).closest('.ld-tag.subject').toggleClass('removed')
        if ($('.ld-tag.subject:not(.removed)').length == 0) {
            $(event.currentTarget).closest('.validation-box').addClass('error required')
        } else {
            $(event.currentTarget).closest('.validation-box').removeClass('error required')
        }
    }
    function updateResourceDetails(event) {
        var resource = resourceFunctions.resources[$('input[type="hidden"][name="rid"]').val()]
        resource.metadata['topic-tags'] = []
        resource.metadata['type-tags'] = []
        resource.metadata['level-tags'] = []
        if (resource.metadata['title'] != $('input[name="title"]').val()) {
            delete resource.metadata['title']
            resource.metadata['title'] = $('input[name="title"]').val()
        }
        if (resource.metadata['description'] != $('textarea[name="description"]').val()) {
            delete resource.metadata['description']
            resource.metadata['description'] = $('textarea[name="description"]').val()
        }
        if (resource.metadata['visibility'] != $('select[name="visibility"]').val()) {
            delete resource.metadata['visibility']
            resource.metadata['visibility'] = $('select[name="visibility"]').val()
        }
        if ($('select[name="visibility"]').val() == "2" ) {
            delete resource.metadata['curriculum']
            resource.metadata['curriculum'] = $('input[type="hidden"][name="curriculum"]').val()
        }
        $('input[name*="-tags"]').each(function(index, element) {
            if (element.value !="") {
               resource.metadata[element.name].push(element.value)
            }
        })
        $('.ld-tag[data-tag-type]:not(.removed)').each(function(index, element) {
            resource.metadata[$(element).attr('data-tag-type') + '-tags'].push($(element).text().trim())
        })
        //can remove all-1 subject tags
        if ($('.ld-tag.subject').length > 0) {
            if ($('.ld-tag.subject:not(.removed)').length == 0) {
                $('.ld-tag.subject').closest('.validation-box').addClass('error required')[0].scrollIntoView()
                return
            } else {
                resource.metadata['subject'] = []
                $('.ld-tag.subject:not(.removed)').each(function(index, element) {
                resource.metadata['subject'].push($(element).text().trim())
                })
            }
        }
        resourceFunctions.saveResource(resource, function(data){ window.location.href = urlBase + '/resources/show/' + $('input[name="area"]').val()}, {})

    }

    return {
        init: init, searchObj: searchObj, source: tagList, createResourceFromRemote: createResourceFromRemote
    };
})()
