/*****************************************************************************/
/* Google Drive */
function openFromGoogleDrive() {
	var clientId = $('#google-js').attr('data-cid');

	gapi.load('picker');
    gapi.client.load('drive', 'v2');

	window.gapi.auth.authorize({
        'client_id': clientId,
        'scope': 'https://www.googleapis.com/auth/drive.readonly',
        'immediate': true
    }, handleAuthResult);
}
function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
        oauthToken = authResult.access_token;
        createGoogleDrivePicker(oauthToken);
    }
}
function createGoogleDrivePicker(oauthToken) {
	var clientId = $('#google-js').attr('data-cid');
	var shortClientId = clientId.split('-')[0]
	var devKey = $('#google-dev-key').val();

    if (oauthToken) {
        var view = new google.picker.View(google.picker.ViewId.DOCS);
        var picker = new google.picker.PickerBuilder()
            //.enableFeature(google.picker.Feature.NAV_HIDDEN)
            .disableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .setAppId(shortClientId)
            .setOAuthToken(oauthToken)
            .addView(view)
            //.addView(new google.picker.DocsUploadView())
            .setDeveloperKey(devKey)
            .setCallback(getGoogleDrivePickerSelectedFiles)
            .build();

        if($('#resourceImportModal').length != 0) {
            $('#resourceImportModal').modal('hide');
        }
        $('#file').addClass('hidden');
        $('.loading').removeClass('hidden');

        picker.setVisible(true);
    }
}
function getGoogleDrivePickerSelectedFiles(data) {
	if (data.action == google.picker.Action.PICKED) {
		var fileId = data.docs[0].id;
		var files = data.docs;

		var resourceImporter = false;
		if($('#resourceImportModal').length != 0) {
			$('#resourceImportModal').modal('show');
			resourceImporter = true;
		}

		for (var i = 0; i < files.length; i++) {
			var file = files[i]
			requestFile = getGoogleDriveFile(file.id);
			requestFile.execute(
				function(response) {
					extraData = getGoogleDriveExtraData(file, requestFile, response);
					file.owner = response.ownerNames[0];
					file.updated_at = response.client_updated_time;
					file.source = 'https://www.googleapis.com/drive/v2/files/' + file.id + '?alt=media';
					file.bearer = extraData.bearer;
					file.thumbnail = response.thumbnailLink;

					if(resourceImporter) {
						addDriveFileToResourceImporter(file, 'googledrive');
					} else {
						addDriveFile(file, 'googledrive', extraData);
					}
				}
			);
		}
	} else if(data.action == google.picker.Action.CANCEL) {
        $('#file').removeClass('hidden');
        $('.loading').addClass('hidden');
	}
}
function getGoogleDriveFile(fileId) {
	requestFile = '';

	requestFile = gapi.client.drive.files.get({
		'fileId': fileId
	});

	return requestFile;
}
function getGoogleDriveExtraData(file, requestFile, response) {
	googleDownloadUrl = 'https://docs.google.com/feeds/download';

	var accessToken = gapi.auth.getToken().access_token;
	var contentType;

	if (response.hasOwnProperty('exportLinks')) {
		var downloadURL;
		var fileExt;
		var fileType = response.mimeType.split('.').pop();

		if(fileType == 'document') {
			downloadURL = googleDownloadUrl + '/documents/Export?id=' + file.id + '&exportFormat=docx';
			contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
			fileExt = '.docx';
		} else if (fileType == "spreadsheet"){
			downloadURL = googleDownloadUrl + '/spreadsheets/Export?id=' + file.id + '&exportFormat=xlsx';
			contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
			fileExt = '.xlsx';
		} else if (fileType == "presentation"){
			downloadURL = googleDownloadUrl + '/presentations/Export?id=' + file.id + '&exportFormat=pptx';
			contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
			fileExt = '.pptx';
		} else if (fileType == "drawing"){
			downloadURL = googleDownloadUrl + '/drawings/Export?id=' + file.id + '&exportFormat=jpeg';
			contentType = 'image/jpeg';
			fileExt = '.jpg';
		}
	} else {
		if (response.mimeType == 'text/plain') {
			contentType = 'application/plain';
		} else {
			contentType = response.mimeType;
		}
		downloadURL = response.downloadUrl;
		fileExt = '';
	}

	var extraData = {bearer: accessToken, type: "file", url: downloadURL, ext:fileExt, cType: contentType};

	if (response.picture) {
		extraData.type = "image"
		extraData.picture = response.picture;
	}

	return extraData;
}
/*****************************************************************************/
/* One Drive */
function openFromOneDrive() {
  var pickerOptions = {
    success: function(files) {
		getOneDrivePickerSelectedFiles(files);
    },
    cancel: function() {
      $('#file').removeClass('hidden');
      $('.loading').addClass('hidden');
	},

    linkType: "downloadLink",
	multiSelect: false
  }
  $('#file').addClass('hidden');
  $('.loading').removeClass('hidden');
  OneDrive.open(pickerOptions);
}
function getOneDrivePickerSelectedFiles(files) {
	var resourceImporter = false;
	if($('#resourceImportModal').length != 0) {
		$('#resourceImportModal').modal('show');
		resourceImporter = true;
	}

	for (var i = 0; i < files.values.length; i++) {
		file = files.values[i];

		extension = file.fileName.split('.').pop();

		file.name = file.fileName;
		file.downloadUrl = file.link;
		file.contentType = documentMimeTypes[extension]
		file.extension = '.' + extension;
		file.source = file.link;
		file.owner = '';

		if(file.contentType && file.contentType.split('/')[0] == 'image') {
			file.resourceType = 'image';
			file.type = 'photo';
		} else {
			file.resourceType = 'file';
			file.type = 'file';
		}

		if(resourceImporter) {
			addDriveFileToResourceImporter(file, 'onedrive');
		} else {
			addDriveFile(file, 'onedrive');
		}
	}
}
/***********************************************************/
/* Resources */
function addDrivePhoto(file, provider, extraData) {
	if(!extraData) {
		extraData = {type: file.resourceType,  url: file.downloadUrl, cType: file.contentType, ext: file.extension}
	}

	document.getElementById('result').innerHTML = 'URL: ' + extraData.url;

	/*TODO: download the file and add it as a normal file for the profile*/
}
function addDriveFile(file, provider, extraData) {
	if(!extraData) {
		extraData = {type: file.resourceType, url: file.downloadUrl, cType: file.contentType, ext: file.extension}
	}

	if(file.thumbnail) {
		var item = '<img src="' + file.thumbnail + '">';
		$('.resource-preview').empty().append(item);
	} else {
		var item = '<span class="fa fa-file-o"></span><span class="file-name">' + file.name + "</span>";
		$('.resource-preview').empty().append(item);
	}

	var title = file.name.substr(0, file.name.lastIndexOf('.')) || file.name;

	$('input[name="title"]').val(title);
	$('#newResourceContent').addClass('hidden');
	$('#newResourceCreate').removeClass('hidden');
	$('#newResourceCreate .new-resource').off('click').on('click', function(event) {
		resourcesPage.init();
		resourcesPage.createResourceFromRemote(file, extraData);
	})
}
function addDriveFileToResourceImporter(file, provider) {
	var item = $('<div class="ld-card col-xs-6 col-sm-4 col-md-4 file" data-id="' + file.id + '"><label class="contents modalbox"><div class="preview"><div class="ld-checkbox"><input type="checkbox" checked="checked" value="' + file.id + '" data-type="' + file.type + '" data-name="' + file.name +'" data-source="' + file.source + '"><span class="display"></span></div><div class="icon-sign fa fa-picture"></div></div><div class="details-block"><div class="title"></div><div class="fa fa-calendar"></div><div class="fa fa-user"></div></div></label></div>');
	$('#' + provider + ' .contents .remote-browser .ld-card').remove();
	$('#' + provider + ' .contents .remote-browser').append(item);
	$('#' + provider + ' .contents .remote-browser .no-content').addClass('hidden');

	$('#resourceImportModal  #' + provider + ' .validation-box').removeClass("error required one custom")
	item.find('input[type="checkbox"]').on('change', function(event) {
		$('#resourceImportModal  #' + provider + ' .validation-box').removeClass("error required one custom")
		if ($('#resourceImportModal').hasClass('single')) {
			var current = event.currentTarget
			if (current.checked) {
				$('#resourceImportModal  #' + provider + ' .ld-checkbox input[type="checkbox"]:checked').removeAttr("checked")
				$(current).prop("checked", "checked")
			}
		}
	});

    $('#file').removeClass('hidden');
    $('.loading').addClass('hidden');

	if(file.bearer) {
		item.find('input[type="checkbox"]').attr('data-bearer', file.bearer);
	}

	item.find('.title').text(file.name);
	item.find('.fa.fa-calendar').text(moment(file.updated_at).format('DD/MMM/YY'));
	item.find('.fa.fa-user').text(file.owner);
	if (file.thumbnail) {
		item.addClass("picture");
		item.find('.icon-sign.fa.fa-picture').replaceWith('<img src="' + file.thumbnail + '">');
	}
}
