This is just sort of a brain dump doc for me to record some ideas and maybe figure some of this out.

I’d like to lead with some sort of provocative question. One that will hopefully be answered satisfactorily during the talk. Maybe something like:

> Adding new functionality to a website is most likely the domain of everyone in this room. But what about the majority of website owners? The salon owner who has his daughter hack together a static site for his business doesn’t think about the impact of adding a random image gallery and analytics tracking tool to his site. Overtime, small salon website turns into a multi-megabyte monstrosity.

> How can we, as developers of these third-party, embedded scripts, code more responsibly?

> I'd like to share a few stories and techniques we learned while distributing embedded JavaScript for Cloudflare's Apps and AMP platforms.

I like that a lot better. It jives well with this idea of conscious coding or coding with respect to the host environment theme that I’ve been building up.

> Before we get into that, who am I? I’m John. I work for Cloudflare on the Product Strategy team. I built Cloudflare’s AMP Viewer SDK and I’ve been helping out with the new Apps platform.

> By the way, we’re hosting a dev lounge where you can build a Cloudflare App with us and get free stuff.

I’m not sure if this is even necessary, but it’s short and gives a shoutout.

The problem re-stated:

> According to one survey from a presumably reputable source, there are over 1 billion unique hostnames on the public internet today. I don’t mean to Carl Sagan here, but that’s a lot!

> We want to allow a fair chunk of these website owners - who may or may not be developers - to easily embed our code. How do we start? What channels do non-developers go to to add functionality? Basically, there are three:

> They already know how to copy-and-paste some random script tag onto their site. Even developers do this because some integration tells you to in their docs. This is a little ridiculous. Third party code should be accessible to non-developers, but it should also be able to be consumed from standard channels for developers (like npm)
> CMS Plugins (Wordpress, Wix, Squarespace, etc.).
> Ask a developer.

> Out of those three options, we’ll really only focus on the first two. And actually, at the end of the day, the first two a really similar and share the same constraints.

Contraints

> So what are those constraints?

> Environment. Right? We really don’t know where this code will be run or even who it will be run for. When you’re writing code for an app, you can identify your audience and design the UX accordingly. You can make certain assumptions about what’s available to you. Not so for embedded libraries.

> File size. Not only do we need to respect the end-user’s bandwidth and JavaScript parsing capacity, but we also need to respect the website owner. We need to do everything we can to make a minimal impact on the website. And this goes for JavaScript and CSS bundles, along with overall performance.

> Browser Compatibility. When we’re writing a web app, there’s generally a well-defined audience we can target, and that audience has some typical browser usage range. We cannot make those assumptions in embedded libraries. When confronted with this problem, a lot of library developers code for the lowest common denominator and have a poor developer experience in the name of compatibility and file size. I’ll elaborate later on why this isn’t strictly necessary.

> Latency and chatty websites. I’m sure we’ve all been to a website that takes a painfully long time to load and get situated. This is generally because of bloat in third-party code usage. We really don’t know if we’re going to be embedded alongside 7 different analytics and tracking tools. If we want to be respectful to our users - which again, is both end users and website owners - the ability to phone home could be severely limited. 

> Given those constraints, can we build a compelling library that’s agnostic of its web environment? Can we create embedded code that doesn’t contribute to a painful user experience?

This ought to conclude the “State the problem” section. Let’s actually delve into solutions:

> First, let's get the easy stuff out of the way. I know you guys know these things. No fonts. No global selectors. Keep your

> When writing an embedded library, CSS is often a necessary component. The question of whether to have external styles or to inline them directly isn’t terribly important here. You might think that inline styles are a great way to keep your styles isolated from the outside environment. However, the larger challenge is not knowing how your environment has changed default behavior of elements.

> For instance, if a website set all div’s to have border-radius: 5px, we’d want to protect against that.

> What do we do to protect against this?

Show slide of CSS declaration div { border-radius: 5px;!important }

> If you really want to be defensive against this case, then I see two options:

> Use Custom HTML Elements
> Use Iframes
  
Show slide of CSS declaration my-custom-element { … }

> However, it’s still susceptible to styles that target all elements (which, some reset sheets will do)

Slide: * { padding: 0 }

> If style isolation is really really important, then your next course of action is to use an iframe.

> So you put everything in an iframe and yay! You’ve got style isolation. Except for global styles affecting your iframe!

> No worries. Just create the iframe in JavaScript and reset every CSS property inline!

> In fact, some parts of Cloudflare’s App previewer uses this technique.

Writing JavaScript

> But now we’re in JavaScript territory. You’re sane developer. You’re following solid practices for third-party JavaScript. You’re only using well-supported, built-in APIs. And you write the following code:

Show slide of array map

> You're getting the following error on _some_ sites:

Show slide of error array map

> So you're like what the hell? This clearly isn't a browser issue. Sometimes this will even break on Chrome. But it's only on some sites. You'll eventually be lead to prototype.js Specifically, a version of prototype.js prior to the year 2012, when Array enumeration methods were overwritten with non-spec-compliant implementations. These implementations failed to pass the third argument, the list were enumerating, to the iterator function.

> This exact situation happened to me while building AMPViewer.

> What can you really do about this? How much can we really trust the JavaScript environment? This all really depends on how often your code is used in environments where default browser api's are overwritten. I'd mostly say this is the problem of the website owner, but they don't write code, so it really just seems like your problem to them.

Error detection

> I mentioned we came across this error with AMPViewer. But how did we get visibility?

> The answer is that Sentry is awesome.

Sentry slide

> Sentry is a really great error reporting tool for software. However, their official web client, raven-js, is going to net your build an extra 24kb minified. This isn't really acceptable for third-party embedded code. Additionally, it may not be appropriate for your code to phone home with errors or usage tracking for your library specifically. But we can't exactly rely on the website owner to let us know when things go awry, so it's useful to at least provide the option to enable.

> What do you do here? To avoid bloat, we ended up implementing our own minimal Sentry API client that used our existing XHR wrapper. This saved on quite a few bytes, but we've started to take it a bit further.

> Now, I'm not exactly trying to say you should use Sentry in your embedded JavaScript library. However, the conversation is relevant to any shared dependencies, like a common XHR wrapper. Because there's a decent chance that one already exists on the page, we just need to be able to detect it.

> A common case is jQuery:

jQuery fingerprinting. Would be nice to show stats about jquery usage.

> The basic idea is to detect for the existence of the jQuery global and to make sure the `ajax` function exists. If so, we can write a thin wrapper to resolve a response. The wrapper code will be _much_ smaller and less error-prone than a custom implementation.

Show jQuery stats slide

> We can see that it will be pretty likely that jQuery exists in your environment and that most of the time, we need not bring in an XHR wrapper.
> And if jQuery isn't on the page? Try something else!

Show superagent slide

> These wrappers are so cheap, we could check for the existence of most of the common XHR libraries.

> But what if there's nothing on the page to help us out with XHR? We could try to gracefully degrade and just disable the features that require XHR. But that's no fun.

Show slide with `async` script tag to common xhr wrapper on cdnjs

> We could use a common library from a well-established CDN. There's even a chance that the user has already cached this resource from another site. Further, subsequent requests to the page with your widget need not download the wrapper a second time, since the browser will have already cached it.

> This requires an asynchronous step and could get pretty cumbersome if we were manually writing the code. So we built a library for fingerprinting and injecting these sort of common dependencies.

Show fingerprinted lib slide

> We should be able to call out to our code without needing to know that the ajax implementation could have come from an existing jquery instance, or a prototype.js instance, or barring some conditions, loaded separately from a CDN.

> Further, any calls to these xhr functions should queue the request until the api has been sussed out (or loaded asynchronously).

Show get/post wrappers

> This is actually just dependency injection. We decorate the function we want to have the fingerprinted api. When the function is called, we inject the fetch api. If the browser supports fetch, hooray, it's injected immediately. If not, then we'll check the next strategy (like jQuery). If that's not there, maybe we'll fetch it from the CDN. Once that's done, we call the original function with the dependency injected.

> And of course the these decorators are optional, but the overhead of using them is very minimal

Show fingerprinting def slide

> The library is general enough to express many commmon scenarios. Here is how we might define "fetch" scenario. First, import the strategies we'd like to use to fingerprint. With a tree-shaking-capable bundler, this will mean only the strategies you import will be used in the final bundle.

Show fingerprinting def next slide

> Here we just need to tell the DI tool how to resolve a dependency. We do this with a series of built-in strategies. First, we check the built-in window.fetch. If that's not available, fingerprint for jquery. If that's not available, go to the CDN and just load jquery.

> We could also fingerprint for other libraries like moment.js or even a DOM library like React, Inferno, or Preact.

Performance tips slide

> Fingerprinting reduces overall bundle sizes, but what about how our code affects the performance of a page? If we want our code to respect the host environment, then we should put expensive operations in a queue to be executed when we're not in a critical path. This is hard to know exactly, but we can occasionally sample the frames per second of the page, and decide based on that. This is a surprisingly effective method for deferring the loading of additional resources as well.

> For instance ...
> TODO: write the rest of this'

Developer Ergonomics

> When writing embedded JavaScript, it may be tempting write everything in es5 compliant code, in a single script file by hand. No modules. No transpilers. No fancy faeatures. This desire comes from not wanting unnecessary overhead. My opinion is that this comes at too high of a cost.

Show next slide

> The AMP Viewer is currently embedded in thousands of sites across the world. It contains logic for handling

> Before writing the AMP Viewer, which is currently embedded on thousands of sites, I wondered if there were any virtual dom libraries that would be small enough to include in the bundle. I eventully landed

At some point, I'd like to summarize things we should do in JS to be responsible:

* Detect network conditions
* Detect framerate
* Defer/Schedule/Queue expensive operations and network requests
* When startup performance is critical, consider deferring the creation of constructors and other objects
  - Use factories that declare their classes inside the definition the first time called