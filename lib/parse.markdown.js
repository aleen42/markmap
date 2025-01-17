var Remarkable = require('remarkable');

function extractLinks(tokens) {
  var result = [];
  var href;
  var parts;
  for (var i = 0; i < tokens.length; i += 1) {
    var token = tokens[i];
    switch (token.type) {
      case "link_open":
        href = token.href;
        parts = [];
        break;
      case "text":
        if (parts) {
          parts.push(token.content)
        }
        break;
      case "link_close":
        result.push({
          href: href,
          name: parts.join('')
        });
        parts = null;
        break;
    }
  }
  return result;
}

module.exports = function parseMarkdown(text, options) {
  options = options || {};
  parseLists = options.lists !== false;

  function renderHTML(text) {
    return md.render(text)
      .replace(/\n/g, '')
      .replace(/^<p>(.*?)<\/p>$/, '$1');
  }

  var md = new Remarkable({maxNesting: Infinity});
  md.block.ruler.enable([
    'deflist'
  ]);

  var tokens = md.parse(text, {});
  var headings = [];
  var depth = 0;
  for (var i = 0; i < tokens.length; i += 1) {
    if (tokens[i].type === 'heading_open') {
      depth = tokens[i].hLevel;
      headings.push({
        depth: depth,
        line: tokens[i].lines[0],
        name: renderHTML(tokens[i+1].content || '')
      });
      i += 1;
    } else if (parseLists) {
      switch (tokens[i].type) {
        case 'bullet_list_open':
        case 'dl_open':
        case 'ordered_list_open':
          headings.push({
            depth: depth + 1,
            line: tokens[i].lines[0],
            name: '',
            autoCollapse: true
          });
          depth += 2;
          break;
        case 'bullet_list_close':
        case 'dl_close':
        case 'ordered_list_close':
          depth -= 2;
          break;
        case 'list_item_open':
          var heading = {
            depth: depth,
            line: tokens[i].lines[0],
          };
          if (tokens[i+1].type === "list_item_close") {
            heading.name = "";
            i += 1;
          } else {
            heading.name = renderHTML(tokens[i+2].content || '');
            i += 2;
          }
          headings.push(heading);
          break;
        case 'dt_open':
          headings.push({
            depth: depth,
            line: tokens[i].lines[0],
            name: renderHTML(tokens[i+1].content || '')
          });
          i += 1;
          break;
      }
    }
  }

  return headings;
};
