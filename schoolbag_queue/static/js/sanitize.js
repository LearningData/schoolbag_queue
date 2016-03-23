var sanitize = (function() {
    var allowedTags = ['a', 'abbr', 'address', 'article', 'b', 'br', 'caption',
        'cite', 'code', 'col', 'colgroup', 'data', 'dd', 'dfn', 'div', 'dl', 'dt',
        'em', 'i', 'figcaption', 'figure',
        'footer', 'h1','h2','h3','h4','h5','h6', 'header', 'hr', 
        'hgroup', 'li', 'main', 'mark', 'nav', 'ol', 'p', 'pre', 'q', 's', 'section',
        'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot',
        'time', 'th', 'tr', 'u', 'ul', 'var', /* depriciated -- should be replaced */ 'font']
    var allowedAttributes = ['abbr', 'align', 'alt', 'axis', 'bgcolor', 'border', 'cellpadding',
        'cellspacing', 'charset', 'clear', 'color', 'cols', 'colspan', 'compact', 'coords', 'datetime',
        'dir', 'disabled', 'enctype', 'height', 'href', 'id', 'label', 'lang', 'list', 'longdesc',
        'max', 'maxlength', 'name', 'nowrap', 'placeholder', 'prompt', 'pubdate', 'radiogroup', 'readonly',
        'rel', 'rows', 'rowspan', 'scope', 'size', 'spellcheck', 'src', 'start', 'step', 'style', 'summary',
        'tabindex', 'target', 'title', 'valign', 'value', 'width']
    var allowedProtocols = /^(#|http(s?):|mailto:|\/)/i
    
    function cleanHTML(htmlObj, allowSpans) {
        var atts = htmlObj.clone()[0].attributes
        $.each(atts, function(index, attr) {
            if (allowedAttributes.indexOf(attr.name) == -1) {
                htmlObj.removeAttr(attr.name)
            } else if (attr.name == "src" || attr.name == "href") {
                if (attr.value.search(allowedProtocols) != 0) {
                    htmlObj.removeAttr(attr.name) //invalid link
                }
            } else if (attr.value.search(/^\s+(expression|javascript)/i) == 0) {
                htmlObj.removeAttr(attr.name)
            }
        })
        var cssItems = htmlObj[0].style.cssText.split(';')
        for (var i = 0; i < cssItems.length; i++) {
            var item = cssItems[i].trim().split(":")
            if (item[1] && item[1].trim().search(/^(expression|javascript)/i) == 0) {
                htmlObj.css(item[0].trim(), "")
            }
        }
        var items = htmlObj.contents()
        stripTags(items)
    }
    function stripTags(items, allowSpans) {
        for (var i = 0; i<items.length; i++) {
            if (items[i].nodeType === 3) { //textnode
                
            } else if (items[i].nodeType === 8) { //comment
                $(items[i]).remove()
            } else if (allowedTags.indexOf(items[i].tagName.toLowerCase()) == -1) {
                $(items[i]).remove()
            } else if (items[i].tagName.toLowerCase() == 'span' && (allowSpans === undefined || allowSpans ==! true)) {
               var contents = $(items[i]).contents()
                stripTags(contents)
                $(items[i]).replaceWith($(items[i]).html())
            } else {
                cleanHTML($(items[i]))
            }
        }
    }
    return {cleanHTML: cleanHTML}
})()