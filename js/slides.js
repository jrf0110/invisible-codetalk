require('impress.js')
const EventEmitter = require('events').EventEmitter
var hljs = require('highlight.js')
const Easing = require('./tween').Easing
const Tween = require('./tween').BrowserTween

const slideEmitter = new EventEmitter()
const presentation = window.impress()

hljs.initHighlightingOnLoad()

let pingPongShouldRun = true
let pingPongTween
let slide
let $slide
document.addEventListener('DOMContentLoaded', () => {
  presentation.init()

  Array.prototype.slice
    .call(document.querySelectorAll('.chart-label-y'))
    .forEach(el => {
      el.style.marginTop = `${-parseInt(el.offsetWidth / 2)}px`
    })

  const onHashChange = () => {
    if (slide) {
      slideEmitter.emit(`${slide}:exit`, $slide)
    }

    pingPongShouldRun = false

    if (pingPongTween && pingPongTween.stop) {
      pingPongTween.stop()
      pingPongTween = undefined
    }

    slide = window.location.hash.substring(2)
    $slide = document.getElementById(slide)

    Array.prototype.slice
      .call($slide.querySelectorAll('video[autoplay]') || [])
      .forEach(el => {
        el.currentTime = 0
        el.play()
      })

    slideEmitter.emit(slide, $slide)
  }

  window.addEventListener('hashchange', onHashChange)

  onHashChange()
})

slideEmitter.on('slide-css-6', $el => {
  if (pingPongTween && pingPongTween.stop) {
    pingPongTween.stop()
    pingPongTween = undefined
  }

  pingPongShouldRun = true

  const $container = $el.querySelector('pre')
  $container.scrollTop = 0
  $container.scrollLeft = 0

  function ping() {
    pingPongTween = new Tween()
      .duration(21 * 1000)
      .start(0)
      .end($container.scrollHeight)
      .easing(Easing.inOutQuad)
      .onTick(v => $container.scrollTop = v)
      .execute(() => pingPongShouldRun && setTimeout(pong, 2000))
  }

  function pong() {
    pingPongTween = new Tween()
      .duration(21 * 1000)
      .end(0)
      .start($container.scrollHeight)
      .easing(Easing.inOutQuad)
      .onTick(v => $container.scrollTop = v)
      .execute(() => pingPongShouldRun && setTimeout(ping, 2000))
  }

  ping()
})

slideEmitter.on('slide-intro-1', $el => {
  const $invisible = $el.querySelector('.invisible-animate')
  const animation = animateInvisible($invisible)
  slideEmitter.once('slide-intro-1:exit', () => animation.stop())
})

function animateInvisible($el) {
  let shouldPlay = true

  const animations = {
    fadeOut: callback => {
      console.log('fadeOut')

      new Tween()
        .start(1)
        .end(0)
        .duration(1500)
        .onTick(v => $el.style.opacity = v)
        .execute(callback)
    },

    fadeIn: callback => {
      console.log('fadeIn')

      new Tween()
        .start(0)
        .end(1)
        .duration(1500)
        .onTick(v => $el.style.opacity = v)
        .execute(callback)
    },

    glitch: callback => {
      console.log('glitch')
      
      $el.style.opacity = 1
      $el.style.textShadow = '0 0 50px'
      setTimeout(() => { $el.style.opacity = 0.5 }, 10)
      setTimeout(() => { $el.style.opacity = 0.8 }, 20)
      setTimeout(() => { $el.style.opacity = 0 }, 30)
      setTimeout(() => { $el.style.opacity = 0.8 }, 60)
      setTimeout(() => { $el.style.opacity = 0 }, 100)
      setTimeout(() => { $el.style.opacity = 1 }, 200)
      setTimeout(() => { $el.style.opacity = 0 }, 300)
      setTimeout(() => { $el.style.opacity = 1 }, 200)
      setTimeout(() => { $el.style.opacity = 0 }, 400)
      setTimeout(() => { $el.style.opacity = 1; $el.style.transform = 'skew(30deg)' }, 600)
      setTimeout(() => { $el.style.opacity = 0 }, 800)
      setTimeout(() => { $el.style.opacity = 0.2 }, 1000)
      setTimeout(() => { $el.style.opacity = 0 }, 1500)
      setTimeout(() => { $el.style.opacity = 0.5 }, 1510)
      setTimeout(() => { $el.style.opacity = 0.8; $el.style.transform = 'skew(0)' }, 1520)
      setTimeout(() => { $el.style.opacity = 0 }, 1530)
      setTimeout(() => { $el.style.opacity = 0.8 }, 1560)
      setTimeout(() => { $el.style.opacity = 0 }, 1600)
      setTimeout(() => { $el.style.opacity = 1; $el.style.transform = 'skew(-10deg)' }, 1700)
      setTimeout(() => { $el.style.opacity = 0 }, 1800)
      setTimeout(() => { $el.style.opacity = 1 }, 2000)
      setTimeout(() => { $el.style.opacity = 0 }, 2200)
      setTimeout(() => { $el.style.opacity = 1; $el.style.transform = 'skew(5deg)' }, 2400)
      setTimeout(() => { $el.style.opacity = 0 }, 2600)
      setTimeout(() => {
        $el.style.textShadow = 'none'
        $el.style.transform = ''
        callback()
      }, 2700)
    },

    wait: (duration, callback) => {
      console.log('wait', duration)
      setTimeout(callback, duration * 1000)
    },
  }

  const { fadeIn, fadeOut, wait, glitch } = animations

  // const animate = callback => {
  //   const runner = [
  //     [fadeOut],
  //     [wait, 1],
  //     [glitch],
  //     [fadeIn],
  //     [wait, 1],
  //   ].reduce((curr, task) => {
  //     return callback => curr(() => {
  //       const fn = task[0]
  //       const args = task.slice(1).concat(callback)
  //       console.log('calling', fn.name, args)
  //       fn.apply(null, args)
  //     })
  //   }, callback => callback())
  // }

  const animate = 
  () => wait(5,
  () => fadeOut(
  () => wait(1,
  () => glitch(
  () => wait(3,
  () => fadeIn(
  () => shouldPlay && animateInvisible($el)))))))

  animate()

  return {
    stop: () => shouldPlay = false
  }

  // animate(() => animateInvisible($el))
}