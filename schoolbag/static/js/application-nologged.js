
// Background Carrousel Login Page
function changeBackground(){
  landscape = window.orientation? window.orientation=='landscape' : true;
  if(landscape && window.innerWidth<991){
    $(".cb-slideshow li span").css("background-image", "url(/schoolbag/img/artwork/" + Math.floor(Math.random() * 6) + ".jpg)");
  }
}
window.onload=window.onresize=changeBackground;
if(window.onorientationchange){
  window.onorientationchange=changeBackground;
}


$(document).ready(function() {
  // Reset Password
  $('form .btn.reset').on('click', function() {
    if (validation.validateForm($('form')[0])) {
      $.ajax({
        type: "POST",
        url: $("form").attr("action"),
        data: {email:$('#emailReset').val()}
      });
      $('form').hide()
      $('.alert-warning').show()
    }
  })

  // Close Flash message
  $(".success-alert").fadeTo(10000, 5000).slideUp(500, function(){
    $(".success-alert").alert('close');
  });

  //Change Password
  $('form .btn.change').on('click', function() {
    if (validation.validateForm($('form')[0])) {
      $('form').submit()
    }
  })



  //Register Users
  $('.flat-btn').on('click', function(event) {
      var user = event.currentTarget.getAttribute('data-user-type')
      console.log(user)
      if (user == "student") {
          $('input[name="type"]').val('P')
          $('.name.span-col-5').addClass('span-col-6').removeClass('span-col-5')
      } else {
          $('input[name="type"]').val('T')
          $('.name.span-col-6').addClass('span-col-5').removeClass('span-col-6')
      }
      $('body').removeClass('student').removeClass('teacher').addClass(user + ' code')
  })
  $('.access-code.btn').on('click', function(event) {
      var targetElem =  $('[name="accessCode"]').closest('.validation-box')
      targetElem.removeClass('required error ajax')
      $('[name="accessCode"]').attr('data-validation', 'required')
      if (validation.validateElement($('[name="accessCode"]')[0])) {
          $.post(document.URL + '/checkAccessCode',
            {type: $('input[name="type"]').val(), accessCode:$('[name="accessCode"]').val()},
            function(response){
              if (response.status == "success") {
                  $('body').removeClass('code').addClass('details')
              } else {
                  targetElem.removeClass('required').addClass('error ajax')
              }
          })
      }
  })
  //for reload page
  if ($('select.name').find(':selected').length > 0) {
    $('.selector.name span').text($('select.name').find(':selected').text())
  }

  $('select.name').on('change', function(event) {
      $('.selector.name span').text($(event.currentTarget).find(':selected').text())
  })
  $('.register.btn').on('click', function(event){
      var valid = true
      $('.step-details .details input').each(function(index, element) {
          if (!validation.validateElement(element)) {
              valid = false
          }
      })
      if (valid) {
         var form = $('form')
         form.submit()
      }
  })
  $('.new-school-link').on('click', function(){
      //new school
      $('body').removeClass('code').addClass('details').addClass('school')
      $('input[name="type"]').val('T')
      $('body').removeClass('student').addClass('teacher')
      $('.register.btn').off()
      $('.register.btn').on('click', createSchool)
  })
  //country select
  var countryArray = []
  for (code in countries) {
      countryArray.push({"label": countries[code], "value":code})
  }
  $('input[name="country-label"]').autocomplete({
      source: function(request, response) {
          request.term = request.term.toLowerCase()
          response( (function(countryArray) {
              var countryFilter = []
              for (var i = 0; i < countryArray.length; i++) {
                  var pos = countryArray[i]['label'].toLowerCase().indexOf(request.term)
                  if (pos != -1) {
                      countryFilter.push({
                          label:countryArray[i]['label'], value: countryArray[i]['value'], pos: pos
                      })
                  }
              }
              return countryFilter.sort(function(a,b){ return a.pos - b.pos})
          }(countryArray)))
      },
      focus: function( event, ui ) {
          $('input[name="country-label"]').val(ui.item.label)
          return false
      },
      select: function(event, ui) {
          $('input[name="country-label"]').val(ui.item.label);
          $('input[name="school[country]"]').val(ui.item.value)
          $('input[name="school[country]"]').closest('.validation-box').removeClass("error custom")
          return false
      },
      change: function(event, ui) {
          if (ui.item === null) {
              for(var key in countries){
                  console.log(countries[key].toLowerCase(),event.currentTarget.value.toLowerCase())
                  if(countries[key].toLowerCase() == event.currentTarget.value.toLowerCase()){
                      $('input[name="school[country]"]').val(key)
                      $('input[name="country-label"]').val(countries[key])
                      $('input[name="school[country]"]').closest('.validation-box').removeClass("error custom")
                      return
                  }
              }
              $('input[name="school[country]"]').val("")
              $('input[name="school[country]"]').closest('.validation-box').addClass("error custom")
          }
      }
  })
  function createSchool() {

      var valid = true
      $('input[name="terms"]').attr('data-validation', 'required')
      $('.step-school input').each(function(index, element) {
          if (!validation.validateElement(element)) {
              valid = false
          }
      })
      $('.step-details .details input').each(function(index, element) {
          if (!validation.validateElement(element)) {
              valid = false
          }
      })
      if ($('[name="user[name]"]').val().trim() == "" ||
        $('[name="user[lastName]"]').val().trim() == "") {
        $('[name="user[title]"]').closest('.validation-box')
          .removeClass('custom').addClass('error required')
      } else if ($('[name="user[title]"]').val() == "") {
        $('[name="user[title]"]').closest('.validation-box')
          .removeClass('required').addClass('error custom')
      }
      if ($('input[name="country-label"]').val() != "" && $('input[name="country"]').val() == "") {
          $('input[name="country"]').closest('.validation-box').addClass("error custom")
          return
      }
      if (valid) {
          var form = $('form')
          form.submit()
      }
  }
  //return to signup if error returned
  var userType = $('input[name="type"]').val()
  var schoolName = $('input[type="school-name"]').val()
  if (userType == "T") {
      $('.name.span-col-6').addClass('span-col-5').removeClass('span-col-6')
      $('body').removeClass('student').removeClass('teacher')
      $('body').addClass('teacher').addClass('details')
      if (schoolName && schoolName != "") {
        $('body').addClass('school')
      }
  } else if (userType == "P") {
      $('.name.span-col-5').addClass('span-col-6').removeClass('span-col-5')
      $('body').removeClass('teacher').removeClass('student')
      $('body').addClass('student').addClass('details')
  }
})

// Fix Microsoft touch scroll
if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
  var msViewportStyle = document.createElement("style");
  msViewportStyle.appendChild(document.createTextNode("@-ms-viewport{width:auto!important}"));
  document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
}
