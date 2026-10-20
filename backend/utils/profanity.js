const filter = require('leo-profanity')

// English list from leo-profanity + common Tagalog/Filipino words
filter.add([
    'putangina', 'puta', 'tangina', 'gago', 'gaga', 'bobo', 'ulol', 'tarantado',
    'pakyu', 'pakshet', 'leche', 'lintik', 'bwisit', 'hinayupak', 'inutil', 'tanga'
])

// Masks bad words with asterisks, e.g. "ang gago" -> "ang ****"
exports.cleanText = (text = '') => filter.clean(String(text))
exports.hasProfanity = (text = '') => filter.check(String(text))
