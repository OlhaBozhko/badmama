(function () {
  'use strict';

  function main() {

    let flag = true;
    $(document).ready(function ($) {
      $('.popup-open').click(function () {
        if (flag) {
          $('.popup__block').slick({
            slidesToShow: 1
          });
        }
        flag = false;
        $('.popup-fade').fadeIn();
        if ($(window).width() > '1023') {
          $('.popup__loop').okzoom({
            width: 150,
            height: 150,
            round: true,
            background: "#fff",
            backgroundRepeat: "repeat",
            shadow: "0 0 5px #000",
            border: "1px solid black"
          });
        }


        return false;
      });
      $('.popup__close').click(function () {
        $('.popup-fade').fadeOut();
        return false;
      });
      $(document).keydown(function (e) {
        if (e.keyCode === 27) {
          e.stopPropagation();
          $('.popup-fade').fadeOut();
        }
      });
      $('.popup-fade').click(function (e) {
        if ($(e.target).closest('.popup').length == 0) {
          $(this).fadeOut();
        }
      });
    });
    $('.reviews').slick({
       adaptiveHeight: true
});
  }

  main();

}());
if ($(window).width() < '1024') {
  console.log($(window).width())
  // Instantiate EasyZoom instances
  var $easyzoom = $('.easyzoom').easyZoom();

  // Get an instance API
  var api = $easyzoom.data('easyZoom');
}
