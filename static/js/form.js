$(document).ready(function() {


  function collect_text() {
    const paragraph = {};
      var st = "";
      $('.paragraph')
        .find(".clickable")
        .each(function (index, value) {
        word_order = $(this).attr("data-word-order")
        word_content = $(this).attr("data-word-content")
        word_mask = $(this).attr("data-word-mask")
//          if ($(this).attr("data-val").length != 0) {
//            st += $(this).attr("data-val");
//          }
//           st += $(this).text()+" ";
        paragraph[word_order] = {'word_order': word_order,'word_content':word_content,'word_mask':word_mask };
        });
      // remove the last space and add
//      answer_results["example_content_" + example_no] = st.trim();
//      console.log(paragraph);
    return paragraph;
  }


//$(document).on('submit', 'form[id^=initial_example_form_]',function(event) {
$(document).on('dblclick', '.clickable',function(event) {
        var selected = $(this)
        var mask = '[MASK] ';
        var original_text = selected.data('word-content')+' ';
        var current_text = selected.text();

       if (current_text ==mask ){
           selected.text(original_text);
           selected.attr('data-word-mask', 'false');
           selected.removeClass('masked');
       }
       else {
           selected.text(mask);
           selected.attr('data-word-mask', 'true');
           selected.addClass('masked');
       }
//collect_text();
  });

$(document).on('click', '#show_text',function(event) {
    $('.bert_text').show();
    $('.bert_id').hide();
      event.preventDefault();
})

$(document).on('click', '#show_ids',function(event) {
    $('.bert_text').hide();
    $('.bert_id').show();
      event.preventDefault();
})

//$(document).on('submit', 'form[id^=initial_example_form_]',function(event) {
$(document).on('click', '#masked',function(event) {

          // collect data from the form
          var data = collect_text();
          var form_data = {'data':data};
            console.log(form_data)
           var results = $('#results')
        var predictions = $('.predictions');
            predictions.remove();
//           waiting loader
          $('#loading-image').show();
          results.hide().empty();
          // ajax call
          $.ajax({
              type: 'POST',
              url: '/masked',
              data: JSON.stringify(form_data),
              contentType: false,
              cache: false,
              processData: false,
          })
          .done(function(data) {
              $('#loading-image').hide();
              results.show();
              results.append('<h2>Step 3 - BERT MLM Behind the scenes </h2><p>([CLS]=101, [SEP]=102, [MASK]=103)</p>');

              $.each( data, function( key, value ) {
//      console.log(value.predictions)

                      // find masks and replace them
                        var masking = $('#masking');
                        masking.append('<br/><p class="predictions">Predictions: </p>');
                      var predictions = $('.predictions');
                      $.each( value.predictions, function( k, v ) {
//                      console.log(v)
                        $("[data-word-order='" + v[1] +"']").text(v[0]+" ");
                        predictions.append('<span>'+ v[0]+' </span>, ');
                        });

                       // create bert text and ids
                      results.append('<p class="bert_paragraph"></p>');
                      var bert_paragraph = $('.bert_paragraph');
                      $.each( value.bert_text_and_ids, function( k, v ) {
//                      console.log(v)
                      bert_paragraph.append('<span class="bert_text" title="BERT MASK ID: '+v[1]+'">'+ v[0]+'</span> <span class="bert_id" style="display: none" title="BERT TOKEN: '+v[0]+'">'+ v[1]+' </span>');
                        });
                      results.append('<br/><br/><a href="" id="show_text">Show text</a>  <a href="" id="show_ids">Show MASK IDS</a>');
                });


          });

  event.preventDefault();
  });


	$('form').on('submit', function(event) {
        var form_data = new FormData($('#upload-list')[0]);
//        form_data.append("lang", $("#lang").val());

//        var formData = {
//              vlist: $("#vlist").val(),
//              lang: $("#lang").val(),
//            };
        var list_wrapper = $('#list_wrapper');
        var masking = $('#masking');
        $('#loading-image').show();
        $('#masking').hide().empty();
        $('#results').hide().empty();
        list_wrapper.hide();
        console.log(form_data);
        $.ajax({
            type: 'POST',
            url: '/process',
            data: form_data,
            contentType: false,
            cache: false,
            processData: false,
        })
        .done(function(data) {
            if (data.error) {
                $('#loading-image').hide();
                $('#errorAlert').text(data.error).show();
                $('#successAlert').hide();
                $('#masking').show();
                $('#results').show();
            }
            else {
                $('#loading-image').hide();

                masking.append('<h2>Step 2 - Double click words to mask them</h2>');
                $.each( data, function( key, value ) {

                      $.each( value, function( k, v ) {
                      console.log(v);
                      let text_id = k;
                      masking.append('<p class="paragraph"></p>');
                      var paragraph = $('.paragraph');
                          $.each( v, function( ke, val ) {
                          console.log(ke)
                            paragraph.append('<span class="clickable" data-word-order="'+ke+'" data-word-content="'+val.word+'" data-word-mask="false" title="Original word: '+val.word+'">'+ val.word +' </span>');
                          });
                         masking.append('<a href="/masked" id="masked">Ready</a>');
                        });
                });

            }
        })

       list_wrapper.show();
    //   leid.show();
       $('#masking').show();
        var script = $('#reload');
        script.remove()
        $('body').append('<script id="reload" src="static/js/script.js"></script>');
        event.preventDefault();

    });





});

