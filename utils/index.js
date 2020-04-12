const DOM = require("prismic-dom")
const marked = require("marked")

// fields that don't need any parsing
const SIMPLE_FIELDS = {
  string: 'string',
  boolean: 'boolean',
  number: 'number'
}

// supported link types. For now, all but document links
const LINK_TYPES = {
  media: 'media',
  web: 'web'
}

// all parser types
const PARSER_TYPES = {
  NONE: 'none',
  TEXT: 'text',
  HTML: 'html',
  NOT_SUPPORTED: 'not_supported'
}

// function to get the parser type for each field
const getParser = (field) => {
  if (field) {
    if (SIMPLE_FIELDS[typeof field]) {
      return PARSER_TYPES.NONE
    }

    if (typeof field === 'object') {
      // the only array types are headers and rich texts
      // if the only element of the array is of type 'pre' then
      // render text as it's markdown, else render HTML instead
      if (Array.isArray(field)) {
        if (field.length === 1 && field[0].type === 'preformatted') {
          return PARSER_TYPES.TEXT
        }

        return PARSER_TYPES.HTML
      } else {
        // the only (supported) object types are images and links
        // images and links don't need any parsing as they are simple objects
        if (field.dimensions || (field.link_type && LINK_TYPES[field.link_type.toLowerCase()])) {
          return PARSER_TYPES.NONE
        }
      }
    }
  }

  return PARSER_TYPES.NOT_SUPPORTED
}

// function that parses a prismic document to a javascript object
const documentParser = ({
  id,
  type,
  tags,
  first_publication_date,
  last_publication_date,
  slugs,
  lang,
  data,
}) => {
  const parsedDocument = {
    id,
    type,
    tags,
    first_publication_date,
    last_publication_date,
    slugs,
    lang,
  }

  const parsedData = {}

  Object.keys(data).forEach((key) => {
    const parserType = getParser(data[key])

    switch (parserType) {
      case "none":
        parsedData[key] = data[key]
        break
      case "text":
        parsedData[key] = marked(DOM.RichText.asText(data[key]))
        break
      case "html":
        parsedData[key] = DOM.RichText.asHtml(data[key])
        break
      default:
        break
    }
  })

  parsedDocument.data = parsedData
  return parsedDocument
}

// function to capitalize words
const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

module.exports = { documentParser, capitalize }