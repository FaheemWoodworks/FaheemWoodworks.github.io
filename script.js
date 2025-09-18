// Tiny helpers shared across pages

// Mobile hamburger toggle
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.hamburger');
  if(btn){
    const menu = document.querySelector('.navbar-right');
    menu?.classList.toggle('open');
  }
});

// Sticky Inquire bar (appears after scrolling a bit)
(function(){
  const bar = document.querySelector('.sticky-inquire');
  if(!bar) return;
  const showAfter = 600;
  let visible = false;
  function onScroll(){
    const show = window.scrollY > showAfter;
    if(show !== visible){ visible = show; bar.classList.toggle('show', show); }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();
