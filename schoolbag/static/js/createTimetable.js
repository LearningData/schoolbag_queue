var timetableFunctions = (function() {

    var getTextInline = function( data ) {
        var text = []
        if ( data.subject ) {
            var str = '<span '
            if (data['class-id']) {
                str += 'data-class-id="' + data["class-id"] + '" ' +
                'class="class-code"'
            }
            str += '>'
            if (getUser() == 'teacher' && data.extraRef) {
                str += data.subject + " " + data.extraRef
            } else if (data.isPreset > 0 || data['class-id']){
                str += data.subject
            }
            str += '</span>'
            text.push(str)
        }
        if ( data.teacher ) {
            text.push( data.teacher )
        }
        if ( data.room ) {
            text.push( data.room )
        }
        text = text.join (" | ")
        return text
    }

    var getTextBlock = function( data ) {
        var text
        if (data.teacher ) { //is student
            text = "<span data-class-id=\"" + data["class-id"] + "\" class=\"class-code\">" + (data.subject || "") + "</span>"
            text += "<span>" + (data.teacher || "") + "</span>"
            text += "<span>" + (data.room || "") + "</span>"
        } else {
            text = "<span data-class-id=\"" + data["class-id"] + "\" class=\"class-code\">" + (data.extraRef || "") + "</span>"
            if (data.isPreset > 0 || data['class-id']){
                text += "<span data-class-id=\"" + data["class-id"] + "\" class=\"subject\">" + (data.subject || "") + "</span>"
            }
            text += "<span>" + (data.room || "") + "</span>"
        }
        return text
    }

    return {
        getTimetableTextInline: getTextInline,
        getTimetableTextBlock: getTextBlock
    }
})()

