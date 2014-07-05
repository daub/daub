# Engine [![Build Status](https://travis-ci.org/decanat/engine.svg?branch=master)](https://travis-ci.org/decanat/engine)

A templating engine with Mustache-like syntax based on [Whiskers](https://github.com/gsf/whiskers.js).

## Installation

Using [component](https://github.com/component/component):

    $ component install decanat/engine

Using [npm](http://npmjs.org/) for server-side use or for [browserify](http://browserify.org/):

    $ npm install decanat-engine

## Example

Templates are rendered as follows, where "template" is a string and "context"
is an object:

```js
var engine = require('decanat-engine');

var markup = engine.render(template, context);
```

A template might look something like this:

```html
<article>
  <header>
    {>header}
  </header>
  {if tags}
    <ul id="tags">
      {for tag in tags}
      <li>{tag}</li>
      {/for}
    </ul>
  {else}
    <p>No tags!</p>
  {/if}
  <div>{content}</div>
  {!<p>this paragraph is 
    commented out</p>!}
</article>
```

With the following context:

```js
{
  header: '<h1>{title}</h1>\n<p id="by">{author}</p>',
  title: 'My life',
  author: 'Bars Thorman',
  tags: [
    'real',
    'vivid'
  ],
  content: 'I grew up into a fine willow.'
}
```

It would be rendered as this:

```html
<article>
  <header>
    <h1>My life</h1>
    <p id="by">Bars Thorman</p>
  </header>
  <ul id="tags">
    <li>real</li>
    <li>vivid</li>
  </ul>
  <div>I grew up into a fine willow.</div>
</article>
```

## Test

Run unit tests:

    $ make test

## Best practices

Use [Whiskers.js](https://github.com/gsf/whiskers.js) instead, it's ~3x faster (could get even faster because of internal caching).

## Forebears

* <https://github.com/gsf/whiskers.js>
* <https://github.com/visionmedia/ejs>
* <https://github.com/janl/mustache.js>
* <https://github.com/akdubya/dustjs>
* <http://code.google.com/p/json-template/>
* <http://docs.djangoproject.com/en/dev/ref/templates/>

## License

The MIT License.
