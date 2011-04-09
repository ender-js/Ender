function f1() {
  $('h1').animate({
    color: '#222222',
    after: f2
  });
}
function f2() {
  $('h1').animate({
    color: '#66cd00',
    after: f1
  });
}
f1();