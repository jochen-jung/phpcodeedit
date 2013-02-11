LoremIpsum = {
 fullstop: '.', /* Character(s) to add to the end of sentences */
 min_wps: 10, /* Minimum words per sentence */
 max_wps: 25, /* Maximum words per sentence */
 min_spp: 2,  /* Minimum sentences per paragraph */
 max_spp: 8, /* Maximum sentences per paragraph */

 /* Word bank
 Words are selected from this array randomly
 to generate complete text nodes.

 NOTE: This array __can__ be altered provided it remains a single-dimension array.
 */
 src: new Array('a','adipiscing','amet','arcu','at','auctor','bibendum','commodo','congue','curabitur','cursus','diam','donec','duis','eget','elementum','enim','eros','et','eu','fusce','gravida','in','integer','ipsum','justo','lectus','leo','ligula','lorem','maecenas','magna','malesuada','massa','mattis','mauris','metus','molestie','morbi','nam','nec','nibh','non','nulla','odio','orci','ornare','pellentesque','pharetra','porta','porttitor','proin','quam','quisque','risus','rutrum','sagittis','sapien','sed','sem','sit','sodales','tellus','tempus','ultricies','urna','ut','vitae','vivamus','vulputate'),

 /* words, getWords, get_words
 @param words: Number of words to return
 @param fullstop: String to append to the words, such as sentence ending punctuation.
 @returns String: String of whitespace delimited words.
 */
 words: function(words, fullstop){
  var lastword, nextword, str, wc = (LoremIpsum.src.length - 1);
  lastword = nextword = Math.round(Math.random() * wc);
  str = LoremIpsum.src[lastword].charAt(0).toUpperCase() + LoremIpsum.src[lastword].substr(1);
  words--;
  while(words > 0){
   while(lastword == nextword){
    nextword = Math.round(Math.random() * wc);
   }
   str += (' ' + LoremIpsum.src[nextword]);
   lastword = nextword;
   words--;
  }
  return str + (fullstop ? fullstop : '');
 },

 /* sentences, getSentences, get_sentences
 @param sentences: Number of sentences to return.
 @returns String: String of sentences delimited by current value of LoremIpsum.fullstop
 */
 sentences: function(sentences){
  var wpsos = LoremIpsum.max_wps - LoremIpsum.min_wps;
  var str = LoremIpsum.words((LoremIpsum.min_wps + Math.round(Math.random() * wpsos)), LoremIpsum.fullstop);
  sentences--;
  while(sentences > 0){
   str += (' ' + LoremIpsum.words((LoremIpsum.min_wps + Math.round(Math.random() * wpsos)), LoremIpsum.fullstop));
   sentences--;
  }
  return str;
 },

 /* paragraphs, getParagraphs, get_paragraphs
 @param paragraphs: Number of paragraphs to return.
 @param format: How to format each paragraph, where %s is the text.
  For instance: <p class="myclass">%s</p>
 @returns String: String of paragraphs formated using @format.
 */
 paragraphs: function(paragraphs, format){
  if(!format){
   format = "%s\n\n";
  }
  var sppos = LoremIpsum.max_spp - LoremIpsum.min_spp;
  var str = format.replace(/%s/i, LoremIpsum.sentences(LoremIpsum.min_spp + Math.round(Math.random() * sppos)));
  paragraphs--;
  while(paragraphs > 0){
   str += format.replace(/%s/i, LoremIpsum.sentences(LoremIpsum.min_spp + Math.round(Math.random() * sppos)));
   paragraphs--;
  }
  return str;
 },

 /* scanElm, scanelm, scan_elm
 @param elm: Entry point, DOM Node to begin searching for comment nodes.
 @returns Number: The number of comments replaced with text nodes.
 */
 scanElm: function(elm){
  var rc = 0;
  for(var c = 0; c < elm.childNodes.length; c++) {
   var child = elm.childNodes[c];
   if(child.nodeType == 1){
    LoremIpsum.scanElm(child);
   }else if (child.nodeType == 8){
    var matches = child.data.match(/^\s*(\d+(?:\s*-\s*\d+)?)\s+(words?|sentences?|paragraphs?)\s*$/i);
    if(matches){
     if(matches[1].indexOf('-') > -1){
      var ms = matches[1].split(/\s*-\s*/);
      matches[1] = Math.max(ms[0], Math.ceil(Math.random() * ms[1]));
     }
     child.parentNode.replaceChild(document.createTextNode(LoremIpsum[matches[2]](matches[1])), child);
     rc++;
    }
   }
  };
  return rc;
 },

 /* LoremIpsum, main, init
 Starts with the root node & recursively processes all comment nodes.
 */
 LoremIpsum: function(){
  var body = document.documentElement ? document.documentElement : document.body;
  LoremIpsum.scanElm(body);
 }
};
/* Convenience - aliases - etc */
LoremIpsum.main = LoremIpsum.init = LoremIpsum.LoremIpsum;
LoremIpsum.getWords = LoremIpsum.get_words = LoremIpsum.words;
LoremIpsum.getSentences = LoremIpsum.get_sentences = LoremIpsum.sentences;
LoremIpsum.getParagraphs = LoremIpsum.get_paragraphs = LoremIpsum.paragraphs;
LoremIpsum.scan_elm = LoremIpsum.scanelm = LoremIpsum.scanElm;
lorem_ipsum = loremipsum = loremIpsum = LoremIpsum;