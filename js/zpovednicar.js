'use strict';

document.getElementsByTagName('head')[0].appendChild(Object.assign(document.createElement('link'), {
    rel: 'stylesheet',
    href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css'
}));

for (let resource of ['CSS_TINGLE', 'CSS_TABBY', 'CSS_MODAL', 'CSS_PICKER', 'CSS_EMOJI', 'CSS_EASYMDE', 'CSS_CUSTOM']) {
    GM_addStyle(GM_getResourceText(resource));
}

const sinnerStyle = (function () {
    let el = document.createElement('style');

    el.appendChild(document.createTextNode(''));
    document.head.appendChild(el);

    return el;
})();

function sinner(callback) {
    if (document.readyState !== 'loading') {
        callback();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        document.attachEvent('onreadystatechange', function () {
            if (document.readyState == 'complete') callback();
        });
    }
}

sinner(function () {
    let db,
        gettext = (function () {
            let gettext = i18n(),
                lang = window.location.hostname.match(/^(www\.)?spovednica\.sk$/) ? 'sk' : 'cz';

            gettext.loadJSON(sinnerI18n[lang], 'messages');
            gettext.setLocale(lang);

            return gettext;
        })(),
        page,
        settingsModal;

    const config = {
            color: GM_getValue('sinner.highlightColor', '#ff0000'),
            domain: GM_getValue('sinner.enforceDomain', '.'),
            domains: new Map([
                ['.', gettext.__('-- do not use --')],
                ['www.zpovednice.eu', 'www.zpovednice.eu'],
                ['www.zpovednice.cz', 'www.zpovednice.cz'],
                ['www.spovednica.sk', 'www.spovednica.sk']
            ]),
            hideDeleted: GM_getValue('sinner.hideDeleted', true),
            hideUnregistered: GM_getValue('sinner.hideUnregistered', false),
            transformAnchors: GM_getValue('sinner.transformAnchors', false),
            transformAvatars: GM_getValue('sinner.transformAvatars', true),
            useHiding: GM_getValue('sinner.useHiding', true),
            useHighlighting: GM_getValue('sinner.useHighlighting', true),
            useMarkdown: GM_getValue('sinner.useMarkdown', 2),
            useMarkdowns: new Map([
                [0, gettext.__('-- do not use --')],
                [1, gettext.__('Format selected only')],
                [2, gettext.__('Format everything')]
            ]),
            youtubeThumbnail: GM_getValue('sinner.youtubeThumbnail', 1),
            youtubeThumbnails: new Map([
                [0, {
                    label: gettext.__('-- none --')
                }],
                [1, {
                    label: '3 ks (60 x 45)',
                    cnt: 3,
                    width: 60,
                    height: 45,
                    pattern: 'https://img.youtube.com/vi/[id]/[i].jpg'
                }],
                [2, {
                    label: '3 ks (120 x 90)',
                    cnt: 3,
                    width: 120,
                    height: 90,
                    pattern: 'https://img.youtube.com/vi/[id]/[i].jpg'
                }],
                [3, {
                    label: '1 ks (320 x 180)',
                    cnt: 1,
                    width: 320,
                    height: 180,
                    pattern: 'https://img.youtube.com/vi/[id]/mqdefault.jpg'
                }],
                [4, {
                    label: '1 ks (480 x 360)',
                    cnt: 1,
                    width: 480,
                    height: 360,
                    pattern: 'https://img.youtube.com/vi/[id]/hqdefault.jpg'
                }]
            ]),
            questions: new Map([
                ['ul#highlightUser', gettext.__('Really delete highlighted user?')],
                ['ul#hideUser', gettext.__('Really delete hidden user?')],
                ['ul#highlightWord', gettext.__('Really delete highlighted term?')],
                ['ul#hideWord', gettext.__('Really delete hidden term?')]
            ]),
            emoji: {
                pickerOptions: {
                    // showCategoryTabs: false,
                    showVariants: false,
                    emojiSize: '2em',
                    i18n: {
                        'categories.activities': gettext.__('Activities'),
                        'categories.animals-nature': gettext.__('Animals & Nature'),
                        'categories.custom': gettext.__('Custom'),
                        'categories.flags': gettext.__('Flags'),
                        'categories.food-drink': gettext.__('Food & Drink'),
                        'categories.objects': gettext.__('Objects'),
                        'categories.people-body': gettext.__('People & Body'),
                        'categories.recents': gettext.__('Recently Used'),
                        'categories.smileys-emotion': gettext.__('Smileys & Emotion'),
                        'categories.symbols': gettext.__('Symbols'),
                        'categories.travel-places': gettext.__('Travel & Places'),
                        'error.load': gettext.__('Failed to load emojis'),
                        'recents.clear': gettext.__('Clear recent emojis'),
                        'recents.none': gettext.__("You haven't selected any emojis yet."),
                        'retry': gettext.__('Try again'),
                        'search.clear': gettext.__('Clear search'),
                        'search.error': gettext.__('Failed to search emojis'),
                        'search.notFound': gettext.__('No results found'),
                        'search': gettext.__('Search emojis...')
                    }
                },
                popupOptions: {
                    className: 'picmoPopup',
                    // https://popper.js.org/docs/v2/constructors/#options
                    // position: 'auto'
                    // position: 'auto-start'
                    position: 'auto-end'
                    // position: 'top'
                    // position: 'top-start'
                    // position: 'top-end'
                    // position: 'bottom'
                    // position: 'bottom-start'
                    // position: 'bottom-end'
                    // position: 'right'
                    // position: 'right-start'
                    // position: 'right-end'
                    // position: 'left'
                    // position: 'left-start'
                    // position: 'left-end'
                }
            },
            mermaidOptions: {
                // https://mermaid.live/
                startOnLoad: false
            },
            sanitizerOptions: {
                USE_PROFILES: {html: true},
                FORBID_TAGS: ['style'],
                FORBID_ATTR: ['style'],
                ALLOW_ARIA_ATTR: false,
                ALLOW_DATA_ATTR: false
            },
            parserOptions: {
                // https://marked.js.org/using_advanced#options
                headerIds: false,
                breaks: true
            },
            editorOptions: {
                // https://github.com/Ionaru/easy-markdown-editor#options-list
                autoDownloadFontAwesome: false,
                autosave: {
                    enabled: true,
                    text: gettext.__('saved: '),
                    timeFormat: {
                        locale: 'cs-CZ',
                        format: {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        },
                    }
                },
                unorderedListStyle: '-',
                forceSync: true,
                indentWithTabs: false,
                previewRender: function (text, el) {
                    setTimeout(function () {
                        mermaid.init(undefined, el.querySelectorAll('div.mermaid'));
                    }, 100);

                    return Utils.String.parseMarkdown(text);
                },
                // lineWrapping: false
                renderingConfig: {
                    headerIds: false,
                    breaks: true,
                    sanitizerFunction: function (dirty) {
                        //TODO verify that DOMPurify.setConfig() in Page.initialize() works as expected
                        // return DOMPurify.sanitize(dirty);
                        return DOMPurify.sanitize(dirty, config.sanitizerOptions);
                    }
                },
                placeholder: gettext.__('start typing here...'),
                promptTexts: {
                    image: gettext.__('URL of the image:'),
                    link: gettext.__('URL for the link:')
                },
                spellChecker: false,
                sideBySideFullscreen: false,
                status: ['autosave'],
                toolbar: [
                    {
                        name: 'bold',
                        action: EasyMDE.toggleBold,
                        className: 'fa fa-bold',
                        title: gettext.__('Bold')
                    },
                    {
                        name: 'italic',
                        action: EasyMDE.toggleItalic,
                        className: 'fa fa-italic',
                        title: gettext.__('Italic')
                    },
                    {
                        name: 'strikethrough',
                        action: EasyMDE.toggleStrikethrough,
                        className: 'fa fa-strikethrough',
                        title: gettext.__('Strikethrough')
                    },
                    {
                        name: 'heading',
                        action: EasyMDE.toggleHeadingSmaller,
                        className: 'fa fa-header fa-heading',
                        title: gettext.__('Heading')
                    },
                    '|',
                    {
                        name: 'unordered-list',
                        action: EasyMDE.toggleUnorderedList,
                        className: 'fa fa-list-ul',
                        title: gettext.__('Generic List')
                    },
                    {
                        name: 'ordered-list',
                        action: EasyMDE.toggleOrderedList,
                        className: 'fa fa-list-ol',
                        title: gettext.__('Numbered List')
                    },
                    {
                        name: 'quote',
                        action: EasyMDE.toggleBlockquote,
                        className: 'fa fa-quote-left',
                        title: gettext.__('Quote')
                    },
                    {
                        name: 'code',
                        action: EasyMDE.toggleCodeBlock,
                        className: 'fa fa-code',
                        title: gettext.__('Code')
                    },
                    '|',
                    {
                        name: 'link',
                        action: EasyMDE.drawLink,
                        className: 'fa fa-link',
                        title: gettext.__('Create Link')
                    },
                    {
                        name: 'image',
                        action: EasyMDE.drawImage,
                        className: 'fa fa-image',
                        title: gettext.__('Insert Image')
                    },
                    {
                        name: 'table',
                        action: EasyMDE.drawTable,
                        className: 'fa fa-table',
                        title: gettext.__('Insert Table')
                    },
                    {
                        name: 'horizontal-rule',
                        action: EasyMDE.drawHorizontalRule,
                        className: 'fa fa-minus',
                        title: gettext.__('Insert Horizontal Line')
                    },
                    '|',
                    {
                        name: 'preview',
                        action: EasyMDE.togglePreview,
                        className: 'fa fa-eye',
                        noDisable: true,
                        title: gettext.__('Toggle Preview')
                    },
                    {
                        name: 'side-by-side',
                        action: EasyMDE.toggleSideBySide,
                        className: 'fa fa-columns',
                        noDisable: true,
                        noMobile: true,
                        title: gettext.__('Toggle Side by Side')
                    },
                    {
                        name: 'fullscreen',
                        action: EasyMDE.toggleFullScreen,
                        className: 'fa fa-arrows-alt',
                        noDisable: true,
                        noMobile: true,
                        title: gettext.__('Toggle Fullscreen')
                    },
                    '|',
                    {
                        name: 'undo',
                        action: EasyMDE.undo,
                        className: 'fa fa-undo',
                        noDisable: true,
                        title: gettext.__('Undo')
                    },
                    {
                        name: 'redo',
                        action: EasyMDE.redo,
                        className: 'fa fa-repeat fa-redo',
                        noDisable: true,
                        title: gettext.__('Redo')
                    },
                    '|',
                    {
                        name: 'emoji',
                        action: function (editor) {
                            editor.emojiPicker.open();
                        },
                        className: 'fa-regular fa-face-smile',
                        attributes: {
                            id: 'emojiTrigger'
                        },
                        // noDisable: true,
                        title: gettext.__('Emojis')
                    },
                    {
                        name: 'mermaid',
                        action: 'https://mermaid.live/',
                        className: 'fas fa-diagram-project',
                        noDisable: true,
                        title: gettext.__('Mermaid live editor')
                    },
                    {
                        name: 'guide',
                        action: 'https://www.markdownguide.org/basic-syntax/',
                        className: 'fa fa-question-circle',
                        noDisable: true,
                        title: gettext.__('Markdown Guide')
                    }
                ]
            }
        },
        cssRules = new Map([
            ['homeHighlightUser', {
                selector: '#conflist li.highlightUser',
                style: new Map([
                    ['font-weight', 'bold'],
                    ['color', config.color]
                ]),
                index: 0
            }],
            ['postHighlightUser', {
                selector: 'tr.highlightUser, td.highlightUser',
                style: new Map([
                    ['outline-style', 'outset'],
                    ['outline-width', '2px'],
                    ['outline-color', config.color]
                ]),
                index: 1
            }],
            ['statsHighlightUser', {
                selector: 'td.highlightStatsUser a',
                style: new Map([
                    ['color', config.color]
                ]),
                index: 2
            }],
            ['pageHighlightWord', {
                selector: 'span.highlightWord',
                style: new Map([
                    ['color', '#000000'],
                    ['background-color', config.color]
                ]),
                index: 3
            }],
            ['markdownHighlightMark', {
                selector: 'mark',
                style: new Map([
                    ['color', '#000000'],
                    ['padding', '0.1rem'],
                    ['background-color', config.color]
                ]),
                index: 4
            }]
        ]),
        Events = {
            Config: {
                enforceDomainChangeListener: function (key, old_value, new_value, remote) {
                    Settings.enforceDomain(new_value);
                },
                hideDeletedChangeListener: async function (key, old_value, new_value, remote) {
                    config.hideDeleted = new_value;
                    page.resetDeleted();
                    await page.processDeleted();
                    page.displayCounters();
                },
                hideUnregisteredChangeListener: async function (key, old_value, new_value, remote) {
                    config.hideUnregistered = new_value;
                    page.resetNicks();
                    page.resetUnregistered();
                    await page.processNicks();
                    page.displayCounters();
                },
                highlightColorChangeListener: function (key, old_value, new_value, remote) {
                    config.color = new_value;

                    Utils.Css.setStyle('homeHighlightUser', 'color', new_value);
                    Utils.Css.setStyle('postHighlightUser', 'color', new_value);
                    Utils.Css.setStyle('statsHighlightUser', 'color', new_value);
                    Utils.Css.setStyle('pageHighlightWord', 'background-color', new_value);
                    Utils.Css.setStyle('markdownHighlightMark', 'background-color', new_value);

                    if (typeof settingsModal !== 'undefined' && remote) {
                        document.getElementById('colorPicker').value = config.color;
                    }
                },
                transformAnchorsChangeListener: function (key, old_value, new_value, remote) {
                    config.transformAnchors = new_value;
                    page.resetAnchors();
                    page.processAnchors();
                },
                transformAvatarsChangeListener: function (key, old_value, new_value, remote) {
                    config.transformAvatars = new_value;
                    page.resetAvatars();
                    page.processAvatars();
                },
                useHidingChangeListener: async function (key, old_value, new_value, remote) {
                    config.useHiding = new_value;
                    page.resetNicks();
                    page.resetUnregistered();
                    page.resetTexts();
                    await page.processNicks();
                    await page.processTexts();
                    page.displayCounters();
                },
                useHighlightingChangeListener: async function (key, old_value, new_value, remote) {
                    config.useHighlighting = new_value;
                    page.resetNicks();
                    page.resetUnregistered();
                    page.resetTexts();
                    await page.processNicks();
                    await page.processTexts();
                    page.displayCounters();
                },
                useMarkdownChangeListener: async function (key, old_value, new_value, remote) {
                    config.useMarkdown = new_value;

                    page.resetNicks();
                    page.resetTexts();
                    await page.processNicks();
                    await page.processTexts();

                    if (typeof page.editor === 'undefined') {
                        return;
                    }

                    if (new_value > 1) {
                        if (typeof page.editor !== 'object') {
                            page.editor = Utils.Dom.createMarkdownEditor();
                        }
                    } else if (typeof page.editor === 'object') {
                        page.editor.emojiPicker.destroy();
                        page.editor.emojiPicker = null;
                        page.editor.toTextArea();
                        page.editor.cleanup();
                        page.editor = null;
                    }
                },
                youtubeThumbnailChangeListener: async function (key, old_value, new_value, remote) {
                    config.youtubeThumbnail = new_value;
                    page.resetTexts();
                    await page.processTexts();
                    page.displayCounters();
                }
            },
            Modal: {
                formSubmitListener: function (e) {
                    e.preventDefault();
                    Settings.processForm(new FormData(e.target));
                },
                observableListener: function (changes) {
                    changes.forEach(function (change) {
                        if (change.table !== 'idioms') {
                            return;
                        }

                        switch (change.type) {
                            case 1:
                                Settings.appendItem(change.obj);
                                break;
                            case 2:
                                if (typeof change.mods.highlight === 'undefined') {
                                    return;
                                }

                                let append = Object.assign(change.obj, {
                                    highlight: change.mods.highlight
                                });

                                Settings.removeItem(change.obj);
                                Settings.appendItem(append);
                                break;
                            case 3:
                                Settings.removeItem(change.oldObj);
                                break;
                        }
                    });
                }
            },
            Page: {
                observableListener(changes) {
                    changes.forEach(async function (change) {
                        if (change.table !== 'idioms') {
                            return;
                        }

                        let subject = typeof change.oldObj === 'undefined' ? change.obj.subject : change.oldObj.subject;

                        switch (subject) {
                            case 'user':
                                page.resetNicks();
                                page.resetUnregistered();
                                await page.processNicks();
                                page.displayCounters();
                                break;
                            case 'word':
                                page.resetTexts();
                                await page.processTexts();
                                page.displayCounters();
                                break;
                        }
                    });
                }
            }
        },
        Utils = {
            Css: {
                initializeStylesheet: function () {
                    cssRules.forEach(function (rule, key) {
                        let index = sinnerStyle.sheet.insertRule(rule.selector + ' {}', rule.index);

                        rule.style.forEach(function (value, key) {
                            sinnerStyle.sheet.cssRules[index].style[key] = value;
                        });
                    });
                },
                removeClass: function (classNames, parentNode) {
                    classNames = typeof classNames === 'string' ? [classNames] : classNames;
                    parentNode = parentNode || document;

                    classNames.forEach(function (className) {
                        parentNode.querySelectorAll('.' + className).forEach(function (el) {
                            el.classList.remove(className);
                        });
                    });
                },
                setStyle: function (name, key, value) {
                    let rule = cssRules.get(name);

                    sinnerStyle.sheet.cssRules[rule.index].style[key] = value;
                }
            },
            Dom: {
                createMarkdownEditor: function () {
                    let params = new URLSearchParams(window.location.search),
                        options = config.editorOptions;

                    options.autosave.uniqueId = params.has('statusik') ? 'post_' + params.get('statusik') :
                        params.has('kdo') ? 'profile_' + params.get('kdo') : 'kniha';

                    let editor = new EasyMDE(options),
                        popupTrigger = document.getElementById('emojiTrigger'),
                        popupOptions = Object.assign(config.emoji.popupOptions, {
                            referenceElement: popupTrigger,
                            triggerElement: popupTrigger
                        });

                    editor.emojiPicker = picmoPopup.createPopup(config.emoji.pickerOptions, popupOptions);

                    editor.emojiPicker.addEventListener('emoji:select', function (selection) {
                        let doc = editor.codemirror.getDoc(),
                            cursor = doc.getCursor(),
                            emoji = marked.emojiConvertor.hex2colons(selection.hexcode, selection.emoji);

                        doc.replaceRange(emoji, cursor);
                    });

                    return editor;
                },
                embedHideUserLink: function (el, nick, hidden) {
                    hidden = hidden || false;

                    let link = Object.assign(document.createElement('a'), {
                            href: '#',
                            title: hidden ? gettext.__('Stop hiding nick') : gettext.__('Hide nick'),
                            className: 'hideUserLink'
                        }),
                        src = hidden ? '/grafika/s11.gif' : '/grafika/s8.gif',
                        width = hidden ? 21 : 15,
                        linkContent = Object.assign(document.createElement('img'), {
                            src: src,
                            width: width,
                            height: 15,
                            border: 0,
                            align: 'bottom',
                            alt: gettext.__('Hide nick')
                        });

                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.target.parentElement.parentElement.remove();

                        if (hidden) {
                            Utils.Db.removeUser(nick, 0);
                        } else {
                            Utils.Db.addOrToggleUser(nick, 0);
                        }
                    });

                    link.appendChild(linkContent);
                    el.prepend(link);
                    el.insertAdjacentHTML('afterbegin', '&nbsp;');
                },
                embedHighlightUserLink: function (el, nick, highlighted) {
                    highlighted = highlighted || false;

                    let link = Object.assign(document.createElement('a'), {
                            href: '#',
                            title: highlighted ? gettext.__('Stop highlighting nick') : gettext.__('Highlight nick'),
                            className: 'highlightUserLink'
                        }),
                        src = highlighted ? '/grafika/s6.gif' : '/grafika/s3.gif',
                        linkContent = Object.assign(document.createElement('img'), {
                            src: src,
                            width: 15,
                            height: 15,
                            border: 0,
                            align: 'bottom',
                            alt: gettext.__('Highlight nick')
                        });

                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.target.parentElement.parentElement.remove();

                        if (highlighted) {
                            Utils.Db.removeUser(nick, 1);
                        } else {
                            Utils.Db.addOrToggleUser(nick, 1);
                        }
                    });

                    link.appendChild(linkContent);
                    el.prepend(link);
                    el.insertAdjacentHTML('afterbegin', '&nbsp;');
                },
                embedMarkdownEditorSwitcher: function (text) {
                    let parent = document.querySelector('textarea').parentElement,
                        link = Object.assign(document.createElement('a'), {
                            href: '#',
                            title: (config.useMarkdown > 1 ? gettext.__('Hide text editor') : gettext.__('Show text editor'))
                        }),
                        linkContent = Object.assign(document.createElement('span'), {
                            className: 'fas ' + (config.useMarkdown > 1 ? 'fa-eye-slash' : 'fa-eye')
                        });

                    parent.innerHTML = Utils.String.wrapAll(parent, [text], page.editorSwitcher);
                    link.appendChild(linkContent);

                    link.addEventListener('click', function (e) {
                        e.preventDefault();

                        if (e.target.classList.contains('fa-eye-slash')) {
                            page.editor.toTextArea();
                            page.editor.cleanup();
                            page.editor = null;
                            e.target.classList.remove('fa-eye-slash')
                            e.target.classList.add('fa-eye')
                            e.target.parentElement.setAttribute('title', gettext.__('Show text editor'));
                        } else {
                            page.editor = Utils.Dom.createMarkdownEditor();
                            e.target.classList.remove('fa-eye')
                            e.target.classList.add('fa-eye-slash')
                            e.target.parentElement.setAttribute('title', gettext.__('Hide text editor'));
                        }
                    });

                    let switcher = document.querySelector('span.' + page.editorSwitcher);

                    switcher.insertAdjacentHTML('afterbegin', '&nbsp;');
                    switcher.prepend(link);

                },
                embedMarkdownParserLink: function (el, textEl) {
                    let link = Object.assign(document.createElement('a'), {
                            href: '#',
                            title: (config.useMarkdown > 1 ? gettext.__('Show original text') : gettext.__('Show formatted text'))
                        }),
                        linkContent = Object.assign(document.createElement('span'), {
                            className: 'fas ' + (config.useMarkdown > 1 ? 'fa-eye-slash' : 'fa-eye')
                        });

                    link.addEventListener('click', function (e) {
                        e.preventDefault();

                        if (e.target.classList.contains('fa-eye-slash')) {
                            textEl.parentElement.querySelector('.markdownParsed').remove();
                            textEl.classList.remove('markdownSource');
                            e.target.classList.remove('fa-eye-slash')
                            e.target.classList.add('fa-eye')
                            e.target.parentElement.setAttribute('title', gettext.__('Show formatted text'));
                        } else {
                            Utils.Dom.transformMarkdownSource(textEl);
                            e.target.classList.remove('fa-eye')
                            e.target.classList.add('fa-eye-slash')
                            e.target.parentElement.setAttribute('title', gettext.__('Show original text'));
                        }
                    });

                    link.appendChild(linkContent);
                    el.prepend(link);
                },
                embedUserLinks: async function (el, nick, highlight, hide, markdownEl) {
                    let compressed = Utils.String.compress(nick, true, true, true);

                    if (config.useHiding) {
                        Utils.Dom.embedHideUserLink(el, nick, hide.includes(compressed));
                    }

                    if (config.useHighlighting) {
                        Utils.Dom.embedHighlightUserLink(el, nick, highlight.includes(compressed));
                    }

                    if (config.useMarkdown > 0 && markdownEl) {
                        Utils.Dom.embedMarkdownParserLink(el, markdownEl);
                    }
                },
                embedYoutube: function (el) {
                    let regexp = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?/g,
                        links = el.querySelectorAll('a')

                    el.querySelectorAll('div.youtubeThumbnails').forEach(function (rel) {
                        rel.remove();
                    });

                    if (links.length > 0) {
                        links.forEach(function (link) {
                            Utils.Dom.embedYoutubeThumbnails(el, [...link.href.matchAll(regexp)]);
                        });
                    } else {
                        Utils.Dom.embedYoutubeThumbnails(el, [...el.innerHTML.matchAll(regexp)], true);
                    }
                },
                embedYoutubeThumbnails: function (el, matches, makeLinks) {
                    let thumb = config.youtubeThumbnails.get(config.youtubeThumbnail);

                    matches = matches || [];
                    makeLinks = makeLinks || false;

                    if (matches.length === 0) {
                        return;
                    }

                    matches.forEach(function (match) {
                        let container = Object.assign(document.createElement('div'), {className: 'youtubeThumbnails'}),
                            url = match[0],
                            id = match[1];

                        if (makeLinks) {
                            let link = Object.assign(document.createElement('a'), {
                                    href: url,
                                    title: url,
                                    target: '_blank',
                                    rel: 'noreferrer noopener nofollow'
                                }),
                                linkText = document.createTextNode(url);

                            link.appendChild(linkText);
                            el.innerHTML = el.innerHTML.replace(url, link.outerHTML);
                        }

                        for (let i = 1; i <= thumb.cnt; i++) {
                            let img = Object.assign(document.createElement('img'), {
                                src: thumb.pattern.replace('[id]', id).replace('[i]', i),
                                width: thumb.width,
                                height: thumb.height,
                                className: 'youtubeThumbnail'
                            });

                            img.addEventListener('click', function (e) {
                                container.insertAdjacentHTML('beforeend', '<div class="embed-container"><iframe src="https://www.youtube.com/embed/' + id + '" frameborder="0" allowfullscreen></iframe></div>');

                                e.target.parentElement.querySelectorAll('img').forEach(function (img) {
                                    img.remove();
                                });
                            });

                            container.appendChild(img);
                        }

                        el.appendChild(container);
                    });
                },
                removeAllChildNodes: function (parent) {
                    while (parent.firstChild) {
                        parent.removeChild(parent.firstChild);
                    }
                },
                replaceAvatar: function (container, src, related) {
                    if (!src.match(/^(http(s?):)([/|.|\w|\s|-])*\.(?:apng|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)$/)) {
                        return;
                    }

                    let photo = container.querySelector('img'),
                        img = Object.assign(document.createElement('img'), {
                            src: src,
                            border: 0,
                            alt: 'Avatar',
                            className: 'avatar',
                            crossorigin: 'anonymous',
                            decoding: 'sync',
                            loading: 'eager',
                            fetchpriority: 'high',
                            referrerpolicy: 'no-referrer',
                            width: 163
                        }),
                        link = Object.assign(document.createElement('a'), {
                            href: src,
                            title: src,
                            rel: 'noreferrer noopener nofollow'
                        });

                    if (!config.transformAnchors) {
                        link.target = '_blank';
                    }

                    if (photo === null) {
                        photo = document.createElement('span');
                        photo.innerHTML = container.innerText;
                        container.innerHTML = '';
                        container.appendChild(photo);
                    } else {
                        let copy = Object.assign(photo.cloneNode(), {
                                height: 50,
                            }),
                            tr = document.createElement('tr'),
                            td = document.createElement('td');

                        copy.removeAttribute('width');

                        copy.addEventListener('click', function (e) {
                            e.preventDefault();
                            e.target.parentElement.parentElement.remove();
                            page.resetAvatars();
                        });

                        td.appendChild(copy);
                        tr.appendChild(td);
                        related.appendChild(tr);
                    }

                    photo.classList.add('transformedAvatar');
                    link.appendChild(img);
                    container.appendChild(link);
                },
                transformAnchorTargets: function () {
                    document.querySelectorAll("a[target='_blank'], area[target='_blank']").forEach(function (link) {
                        link.classList.add('transformedAnchor');
                        link.removeAttribute('target');
                    });
                },
                transformMarkdownSource: function (el) {
                    let cloned = el.cloneNode();

                    cloned.innerHTML = Utils.String.parseMarkdown(el.innerHTML);
                    cloned.classList.add('markdownParsed');
                    el.classList.add('markdownSource');
                    el.after(cloned);

                    cloned.querySelectorAll('div.mermaid').forEach(function (el) {
                        mermaid.init(undefined, el);
                    });
                },
                wrapElementWords: function (page, el, highlight, hide) {
                    if (config.useHiding && Utils.String.containsWord(el, hide)) {
                        page.counterWords++;
                        el.parentElement.parentElement.classList.add('hiddenWord');
                        el.innerHTML = Utils.String.wrapAll(el, hide, 'strikeWord');
                    }

                    if (config.useHighlighting && Utils.String.containsWord(el, highlight)) {
                        el.innerHTML = Utils.String.wrapAll(el, highlight);
                    }
                }
            },
            String: {
                capitalizeFirstLetter: function (s) {
                    return s[0].toUpperCase() + s.slice(1);
                },
                compress: function (str, noAccent, lowerCase, noSpaces) {
                    let result = str;

                    if (noAccent || false) {
                        result = Utils.String.noAccent(result);
                    }

                    if (lowerCase || false) {
                        result = result.toLowerCase();
                    }

                    if (noSpaces || false) {
                        result = result.replaceAll(' ', '');
                    }

                    return result;
                },
                containsWord: function (el, words) {
                    let content = el.innerText.trim();

                    for (let word of words) {
                        if (Utils.String.stripos(content, word) !== false) {
                            return true;
                        }
                    }

                    return false;
                },
                noAccent: function (str) {
                    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                },
                parseMarkdown: function (text) {
                    let source = text.trim()
                            .replace(/&quot;/g, '"')
                            // encoded unicode characters
                            .replace(/&amp;#/g, '&#')
                            .replace(/&#\d+;/g, function (encoded) {
                                return decodeURIComponent(encoded);
                            })
                            .replace(/&lt;/g, '<')
                            .replace(/&( )?gt;/g, '>')
                            //TODO fix blockquotes nested by mistake
                            // .replace(/(>)\1+/g, '>')
                            // .replace(/(<)\1+/g, '<')
                            .replace(/<(\/)?b>/g, '**')
                            .replace(/<(\/)?i>/g, '*')
                            .replace(/(\s+)?<br( ?\/)?>\s+<br( ?\/)?>(\s+)?/g, '\n\n')
                            .replace(/(\s+)?<br( ?\/)?>(\s+)?/g, '   \n')
                            // sub/sup/mark tags https://regexr.com/6mtkv
                            .replace(/<[ /subpmark]*>/g, function (tag) {
                                return tag.replace(/\s+/g, '');
                            })
                            // markdown links and images https://regexr.com/6mtju
                            .replace(/!?\[(.*[^\]])\](\s*)\((\s*)(\S*[^)])(\s*)(\S*[^)])(\s*)\)/g, function (link) {
                                return link.replace(/\s+/g, '');
                            })
                            .trim(),
                        //TODO verify that marked.setOptions() in Page.initialize() works as expected
                        // dirty = marked.parse(source),
                        markdown = marked.parse(source, config.parserOptions),
                        dirty = marked.emojiConvertor.replace_unified(
                            marked.emojiConvertor.replace_colons(
                                marked.emojiConvertor.replace_emoticons(markdown)
                            )
                        ),
                    //TODO verify that DOMPurify.setConfig() in Page.initialize() works as expected
                    // clean = DOMPurify.sanitize(dirty);
                    clean = DOMPurify.sanitize(dirty, config.sanitizerOptions);

                    return clean;
                },
                rc4: function (key, str) {
                    let s = [],
                        res = '';

                    for (let i = 0; i < 256; i++) {
                        s[i] = i;
                    }
                    for (let i = 0, j = 0, x = 0; i < 256; i++) {
                        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
                        x = s[i];
                        s[i] = s[j];
                        s[j] = x;
                    }
                    for (let i = 0, j = 0, x = 0, y = 0; y < str.length; y++) {
                        i = (i + 1) % 256;
                        j = (j + s[i]) % 256;
                        x = s[i];
                        s[i] = s[j];
                        s[j] = x;
                        res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
                    }

                    return res;
                },
                replaceIAll: function (str, searchValue, newValue) {
                    let escaped = searchValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
                        regexp = new RegExp(escaped, 'ig');

                    return str.replace(regexp, newValue);
                },
                stripos: function (haystack, needle, offset) {
                    let index = 0;

                    haystack = (haystack || '').toLowerCase();
                    needle = (needle || '').toLowerCase();

                    if ((index = haystack.indexOf(needle, offset)) !== -1) {
                        return index;
                    }

                    return false;
                },
                unwrap: function (el) {
                    el.outerHTML = el.innerHTML;
                },
                wrapAll: function (el, words, className) {
                    let result = el.innerHTML;

                    className = className || 'highlightWord';

                    words.forEach(function (needle) {
                        let wrapped = '<span class="' + className + '">' + needle + '</span>';

                        result = Utils.String.replaceIAll(result, needle, wrapped);
                    });

                    return result;
                },
            },
            Db: {
                addOrToggleUser: function (nick, highlight) {
                    let record = {
                            subject: 'user',
                            highlight: highlight,
                            content: nick.trim()
                        },
                        compressed = Utils.String.compress(nick, true, true, true);

                    highlight = highlight || 0;

                    db.idioms.where('subject').equals('user').and(function (rec) {
                        let content = Utils.String.compress(rec.content, true, true, true);

                        return compressed === content;
                    }).toArray(function (arr) {
                        if (arr.length === 0) {
                            return db.idioms.add(record);
                        }

                        arr.forEach(function (item) {
                            db.idioms.update(item.uuid, {highlight: highlight});
                        });
                    });
                },
                deleteIdiom: function (item) {
                    db.idioms.where('uuid').equals(item.uuid).delete().then(function (cnt) {
                    }).catch(function (err) {
                        console.error(err);
                    });
                },
                getIdioms: function (subject, highlight, compress) {
                    highlight = highlight || false;
                    compress = compress || false;

                    return db.idioms.where({
                        subject: subject,
                        highlight: highlight ? 1 : 0
                    }).toArray(function (arr) {
                        let results = [];

                        arr.forEach(function (item) {
                            results.push(compress ? Utils.String.compress(item.content, true, true, true) : item.content);
                        });

                        // distinct values only
                        return results.filter(function (value, index, self) {
                            return self.indexOf(value) === index;
                        });
                    });
                },
                initialize: function () {
                    let database = new Dexie('Sinner');

                    database.version(1).stores({
                        idioms: '$$uuid, [subject+highlight], content'
                    });

                    database.on('populate', function (transaction) {
                        transaction.idioms.add({subject: 'user', highlight: 0, content: 'Administrátor'});
                    });

                    database.open().catch(function (e) {
                        console.error('Failed to open database: ' + e.stack);
                    });

                    return database;
                },
                removeUser: function (nick, highlight) {
                    let compressed = Utils.String.compress(nick, true, true, true);

                    highlight = highlight || 0;

                    db.idioms.where('subject').equals('user').and(function (rec) {
                        let content = Utils.String.compress(rec.content, true, true, true);

                        return rec.highlight === highlight && compressed === content;
                    }).toArray(function (arr) {
                        arr.forEach(function (item) {
                            Utils.Db.deleteIdiom(item);
                        });
                    });
                }
            }
        },
        Settings = {
            appendItem: function (item) {
                let li = Object.assign(document.createElement('li'), {id: 'settingsModal-' + item.uuid}),
                    a = Object.assign(document.createElement('a'), {href: '#'}),
                    text = document.createTextNode(item.content),
                    caption = Settings.getCaptionByItem(item),
                    target = Settings.getTargetByItem(item),
                    question = config.questions.get(target);

                a.appendChild(text);
                a.addEventListener('click', function (e) {
                    e.preventDefault();

                    let options = {
                        okText: gettext.__('Yes'),
                        cancelText: gettext.__('No'),
                        container: document.querySelector('div.tingle-modal-box__content')
                    };

                    DayPilot.Modal.confirm(question, options).then(function (args) {
                        if (args.result === 'OK') {
                            Utils.Db.deleteIdiom(item);
                        }
                    });
                });
                li.appendChild(a);
                document.querySelector(target).appendChild(li);
                caption.style.display = 'none';
            },
            backup: function () {
                let promptOptions = {
                    okText: gettext.__('Send'),
                    cancelText: gettext.__('Cancel'),
                    container: document.querySelector('div.tingle-modal-box__content')
                };

                db.idioms.toArray(function (data) {
                    promptOptions.okText = gettext.__('OK');

                    if (data.length === 0) {
                        DayPilot.Modal.alert(gettext.__('Database is empty, there is nothing to backup'), promptOptions);

                        return;
                    }

                    DayPilot.Modal.prompt(gettext.__('Password for the backup file'), promptOptions).then(function (args) {
                        if (typeof args.result === 'undefined' || args.result.length === 0) {
                            return;
                        }

                        let csv = Papa.unparse(data, {
                                quotes: true
                            }),
                            encrypted = Utils.String.rc4(args.result, csv),
                            blob = new Blob([encrypted]),
                            filename = 'zpovednicar-' + (new Date()).toISOString() + '.data';

                        window.saveAs(blob, filename);
                        DayPilot.Modal.alert(gettext.__('Successful backup, downloading file %1%2', '<br><br>', filename), promptOptions);
                    });
                }).catch(function (err) {
                    console.error(err);
                });
            },
            enforceDomain: function (hostname) {
                if (window.location.hostname === hostname || hostname === '.' || !config.domains.has(hostname)) {
                    return;
                }

                let location = window.location.protocol + '//' + hostname +
                    (window.location.port.length ? ':' + window.location.port : '') +
                    window.location.pathname + window.location.search + window.location.hash;

                window.location.assign(location);
            },
            getCaptionByItem: function (item) {
                return document.getElementById((item.highlight === 1 ? 'highlight' : 'hide') + Utils.String.capitalizeFirstLetter(item.subject) + 'None');
            },
            getTargetByItem: function (item) {
                return 'ul#' + (item.highlight === 1 ? 'highlight' : 'hide') + Utils.String.capitalizeFirstLetter(item.subject);
            },
            initializeModal: function () {
                let type = Object.assign(document.createElement('input'), {
                        type: 'hidden',
                        name: 'highlight',
                        id: 'sinnerInputType',
                        value: '1'
                    }),
                    text = Object.assign(document.createElement('input'), {
                        type: 'text',
                        name: 'content',
                        id: 'sinnerInputContent'
                    }),
                    select = Object.assign(document.createElement('select'), {
                        name: 'subject',
                        id: 'sinnerInputSubject'
                    }),
                    submit = Object.assign(document.createElement('input'), {
                        type: 'submit',
                        value: gettext.__('Highlight'),
                        id: 'sinnerInputSubmit'
                    }),
                    form = Object.assign(document.createElement('form'), {id: 'sinnerDataForm'}),
                    isFileSaverSupported = false;

                try {
                    isFileSaverSupported = !!new Blob;
                } catch (e) {
                    isFileSaverSupported = false;
                }


                select.appendChild(Object.assign(document.createElement('option'), {
                    value: 'user',
                    text: gettext.__('nick')
                }));
                select.appendChild(Object.assign(document.createElement('option'), {
                    value: 'word',
                    selected: 'selected',
                    text: gettext.__('term')
                }));

                form.appendChild(type);
                form.appendChild(select);
                form.insertAdjacentHTML('beforeend', '&nbsp;');
                form.appendChild(text);
                form.insertAdjacentHTML('beforeend', '&nbsp;');
                form.appendChild(submit);
                form.addEventListener('submit', Events.Modal.formSubmitListener);

                settingsModal = new tingle.modal({
                    footer: true,
                    closeMethods: ['overlay', 'button', 'escape'],
                    closeLabel: gettext.__('Close'),
                    cssClass: ['custom-class-1', 'custom-class-2'],
                    beforeOpen: function () {
                        Utils.Dom.removeAllChildNodes(document.querySelector('ul#highlightUser'));
                        document.getElementById('highlightUserNone').style.display = 'inline';
                        Utils.Dom.removeAllChildNodes(document.querySelector('ul#highlightWord'));
                        document.getElementById('highlightWordNone').style.display = 'inline';
                        Utils.Dom.removeAllChildNodes(document.querySelector('ul#hideUser'));
                        document.getElementById('hideUserNone').style.display = 'inline';
                        Utils.Dom.removeAllChildNodes(document.querySelector('ul#hideWord'));
                        document.getElementById('hideWordNone').style.display = 'inline';

                        Settings.showRecords('user', 1);
                        Settings.showRecords('user', 0);
                        Settings.showRecords('word', 1);
                        Settings.showRecords('word', 0);

                        document.getElementById('colorPicker').value = config.color;
                    },
                    beforeClose: function () {
                        text.value = '';

                        return true;
                    }
                });

                let modalContent =
                    '<ul data-tabs>' +
                    '<li><a data-tabby-default href="#tabHighlight"><img src="/grafika/s3.gif" width="15" height="15">&nbsp;' + gettext.__('Highlight') + '</a></li>' +
                    '<li><a href="#tabHide"><img src="/grafika/s8.gif" width="15" height="15">&nbsp;' + gettext.__('Hide') + '</a></li>' +
                    '<li><a href="#tabSettings">' + gettext.__('Settings') + '</a></li>' +
                    '</ul>' +
                    '<div id="tabHighlight">' +
                    '<p>' +
                    '<input type="radio" name="useHighlighting" id="highlightingYes"' + (config.useHighlighting ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="highlightingYes">' + gettext.__('enable') + '</label>&nbsp;' +
                    '<input type="radio" name="useHighlighting" id="highlightingNo"' + (config.useHighlighting ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="highlightingNo">' + gettext.__('disable') + '</label>' +
                    '</p>' +
                    '<div class="row">' +
                    '<div class="column">' +
                    '<strong>' + gettext.__('Nicks') + ':</strong>&nbsp;<span id="highlightUserNone">(' + gettext.__('none') + ')</span>' +
                    '<ul id="highlightUser" class="sinnerList"></ul>' +
                    '</div>' +
                    '<div class="column">' +
                    '<strong>' + gettext.__('Terms') + ':</strong>&nbsp;<span id="highlightWordNone">(' + gettext.__('none') + ')</span>' +
                    '<ul id="highlightWord" class="sinnerList"></ul>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div id="tabHide">' +
                    '<p>' +
                    '<input type="radio" name="useHiding" id="hidingYes"' + (config.useHiding ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="hidingYes">' + gettext.__('enable') + '</label>&nbsp;' +
                    '<input type="radio" name="useHiding" id="hidingNo"' + (config.useHiding ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="hidingNo">' + gettext.__('disable') + '</label>' +
                    '</p>' +
                    '<div class="row">' +
                    '<div class="column">' +
                    '<strong>' + gettext.__('Nicks') + ':</strong>&nbsp;<span id="hideUserNone">(' + gettext.__('none') + ')</span>' +
                    '<ul id="hideUser" class="sinnerList"></ul>' +
                    '</div>' +
                    '<div class="column">' +
                    '<strong>' + gettext.__('Terms') + ':</strong>&nbsp;<span id="hideWordNone">(' + gettext.__('none') + ')</span>' +
                    '<ul id="hideWord" class="sinnerList"></ul>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div id="tabSettings">' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<p>' +
                    gettext.__('Help is available at') +
                    ':</p>' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<p>' +
                    '<a href="https://www.zpovednicar.cz/" target="_blank">www.zpovednicar.cz</a>' +
                    '</p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<img src="/grafika/s17.gif" width="15" height="15">&nbsp;' +
                    gettext.__('Hide deleted') +
                    ':' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<input type="radio" name="hideDeleted" id="hideDeletedYes"' + (config.hideDeleted ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="hideDeletedYes">' + gettext.__('Yes') + '</label>&nbsp;' +
                    '<input type="radio" name="hideDeleted" id="hideDeletedNo"' + (config.hideDeleted ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="hideDeletedNo">' + gettext.__('No') + '</label>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<p>' +
                    '<img src="/grafika/s7.gif" width="15" height="15">&nbsp;' +
                    gettext.__('Hide unregistered') +
                    ':</p>' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<p>' +
                    '<input type="radio" name="hideUnregistered" id="hideUnregisteredYes"' + (config.hideUnregistered ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="hideUnregisteredYes">' + gettext.__('Yes') + '</label>&nbsp;' +
                    '<input type="radio" name="hideUnregistered" id="hideUnregisteredNo"' + (config.hideUnregistered ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="hideUnregisteredNo">' + gettext.__('No') + '</label>' +
                    '</p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    gettext.__('Open links in the same window') +
                    ':' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<input type="radio" name="transformAnchors" id="transformAnchorsYes"' + (config.transformAnchors ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="transformAnchorsYes">' + gettext.__('Yes') + '</label>&nbsp;' +
                    '<input type="radio" name="transformAnchors" id="transformAnchorsNo"' + (config.transformAnchors ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="transformAnchorsNo">' + gettext.__('No') + '</label>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<p>' +
                    gettext.__('Replace profile picture') +
                    ':</p>' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<p>' +
                    '<input type="radio" name="transformAvatars" id="transformAvatarsYes"' + (config.transformAvatars ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="transformAvatarsYes">' + gettext.__('Yes') + '</label>&nbsp;' +
                    '<input type="radio" name="transformAvatars" id="transformAvatarsNo"' + (config.transformAvatars ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="transformAvatarsNo">' + gettext.__('No') + '</label>' +
                    '</p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<span class="fas fa-eye"></span>&nbsp;' +
                    gettext.__('Use formatted text') +
                    ':' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<select id="useMarkdown">';
                config.useMarkdowns.forEach(function (label, key) {
                    modalContent += '<option value="' + key + '"' + (key === config.useMarkdown ? ' selected' : '') + '>' + label + '</option>';
                })
                modalContent +=
                    '</select>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<p>' +
                    gettext.__('Thumbnails of Youtube videos') +
                    ':</p>' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<p>' +
                    '<select id="youtubeThumbnail">';
                config.youtubeThumbnails.forEach(function (thumb, key) {
                    modalContent += '<option value="' + key + '"' + (key === config.youtubeThumbnail ? ' selected' : '') + '>' + thumb.label + '</option>';
                })
                modalContent +=
                    '</select>' +
                    '</p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    gettext.__('Enforce domain') +
                    ':' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<select id="enforceDomain">';
                config.domains.forEach(function (value, key) {
                    modalContent += '<option value="' + key + '"' + (key === config.domain ? ' selected' : '') + '>' + value + '</option>';
                })
                modalContent +=
                    '</select>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<p>' +
                    gettext.__('Color for highlighting') +
                    ':</p>' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<p>' +
                    '<span class="colorFull"><input type="text" id="colorPicker" value="' + config.color + '"></span>' +
                    '</p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    gettext.__('Database backup') +
                    ':' +
                    '</div>' +
                    '<div class="column-narrow">';
                if (isFileSaverSupported) {
                    modalContent +=
                        '<button id="settingsBackup">' + gettext.__('Backup') + '</button>' +
                        '&nbsp;' +
                        '<button id="settingsRestore">' + gettext.__('Restore') + '</button>';
                } else {
                    modalContent += gettext.__('Not supported by your browser');
                }
                modalContent +=
                    '</div>' +
                    '</div>' +
                    '</div>';

                settingsModal.setContent(modalContent);

                document.getElementById('enforceDomain').onchange = function (e) {
                    GM_setValue('sinner.enforceDomain', e.target.value)
                };
                document.getElementById('youtubeThumbnail').onchange = function (e) {
                    GM_setValue('sinner.youtubeThumbnail', parseInt(e.target.value))
                };
                document.getElementById('useMarkdown').onchange = function (e) {
                    GM_setValue('sinner.useMarkdown', parseInt(e.target.value))
                };

                document.querySelectorAll('input[name="useHighlighting"]').forEach(function (input) {
                    input.addEventListener('change', function (e) {
                        GM_setValue('sinner.useHighlighting', Boolean(parseInt(e.target.value)))
                    });
                });
                document.querySelectorAll('input[name="useHiding"]').forEach(function (input) {
                    input.addEventListener('change', function (e) {
                        GM_setValue('sinner.useHiding', Boolean(parseInt(e.target.value)))
                    });
                });
                document.querySelectorAll('input[name="hideDeleted"]').forEach(function (input) {
                    input.addEventListener('change', function (e) {
                        GM_setValue('sinner.hideDeleted', Boolean(parseInt(e.target.value)))
                    });
                });
                document.querySelectorAll('input[name="hideUnregistered"]').forEach(function (input) {
                    input.addEventListener('change', function (e) {
                        GM_setValue('sinner.hideUnregistered', Boolean(parseInt(e.target.value)))
                    });
                });
                document.querySelectorAll('input[name="transformAnchors"]').forEach(function (input) {
                    input.addEventListener('change', function (e) {
                        GM_setValue('sinner.transformAnchors', Boolean(parseInt(e.target.value)))
                    });
                });
                document.querySelectorAll('input[name="transformAvatars"]').forEach(function (input) {
                    input.addEventListener('change', function (e) {
                        GM_setValue('sinner.transformAvatars', Boolean(parseInt(e.target.value)))
                    });
                });
                document.querySelector('div.tingle-modal-box__footer').appendChild(form);
                document.querySelector('div.tingle-modal').addEventListener('tabby', function (e) {
                    let footer = document.querySelector('div.tingle-modal-box__footer');

                    switch (e.target.hash.substr(1)) {
                        case 'tabHighlight':
                            type.value = 1;
                            submit.value = gettext.__('Highlight');
                            footer.style.display = 'block';
                            break;
                        case 'tabHide':
                            type.value = 0;
                            submit.value = gettext.__('Hide');
                            footer.style.display = 'block';
                            break;
                        default:
                            footer.style.display = 'none';
                            break;
                    }
                });

                if (isFileSaverSupported) {
                    document.getElementById('settingsBackup').addEventListener('click', Settings.backup);
                    document.getElementById('settingsRestore').addEventListener('click', Settings.restore);
                }

                Coloris({
                    el: '#colorPicker',
                    format: 'hex',
                    theme: 'polaroid',
                    themeMode: 'dark',
                    swatches: [
                        '#ff0000',
                        '#bf2626',
                        '#e76f51',
                        '#ffff00',
                        '#00ffff',
                        '#00ff00'
                    ],
                    alpha: false
                });

                document.getElementById('colorPicker').addEventListener('change', function (e) {
                    GM_setValue('sinner.highlightColor', e.target.value)
                });
                db.on('changes', Events.Modal.observableListener);

                settingsModal.tabs = new Tabby('[data-tabs]');
            },
            processForm: function (data) {
                let record = {
                        subject: data.get('subject'),
                        highlight: parseInt(data.get('highlight')),
                        content: data.get('content').trim()
                    },
                    alertOptions = {
                        okText: gettext.__('OK'),
                        container: document.querySelector('div.tingle-modal-box__content')
                    },
                    minLength = 3;

                if (record.content.length < minLength) {
                    let msg = gettext._n('Minimal length is %1 character', 'Minimal length is %1 characters', minLength);

                    DayPilot.Modal.alert(msg, alertOptions);

                    return false;
                }

                document.querySelector('input#sinnerInputContent').value = '';

                db.idioms.where('content').equalsIgnoreCase(record.content).and(function (rec) {
                    return rec.subject === record.subject;
                }).count().then(function (cnt) {
                    if (cnt > 0) {
                        let highlight = record.highlight === 1 ? gettext.__('hidden ones') : gettext.__('highlighted ones'),
                            msg = gettext.__('Record exists in %1, it is impossible to save it in both', highlight);

                        DayPilot.Modal.alert(msg, alertOptions);

                        return false;
                    }

                    return db.idioms.add(record);
                }).then(function (uuid) {
                }).catch(function (err) {
                    console.error(err);
                });
            },
            removeItem: function (item) {
                document.getElementById('settingsModal-' + item.uuid).remove();

                db.idioms.where({
                    subject: item.subject,
                    highlight: item.highlight
                }).count().then(function (cnt) {
                    if (cnt > 0) {
                        return false;
                    }

                    Settings.getCaptionByItem(item).style.display = 'inline';
                }).catch(function (err) {
                    console.error(err);
                });
            },
            restore: function () {
                let promptOptions = {
                        okText: gettext.__('Send'),
                        cancelText: gettext.__('Cancel'),
                        container: document.querySelector('div.tingle-modal-box__content')
                    },
                    input = Object.assign(document.createElement('input'), {
                        type: 'file'
                    });

                input.onchange = function (e) {
                    let file = e.target.files[0],
                        reader = new FileReader();

                    reader.readAsText(file, 'UTF-8');

                    reader.onload = function (eRead) {
                        let raw = eRead.target.result;

                        DayPilot.Modal.prompt(gettext.__('Password for the backup file'), promptOptions).then(function (args) {
                            if (typeof args.result === 'undefined' || args.result.length === 0) {
                                return;
                            }

                            let csv = Utils.String.rc4(args.result, raw),
                                data = Papa.parse(csv, {
                                    header: true,
                                    dynamicTyping: true
                                });

                            promptOptions.okText = gettext.__('OK');

                            if (data.errors.length > 0) {
                                DayPilot.Modal.alert(gettext.__('Invalid password or damaged backup file'), promptOptions);
                            } else {
                                db.idioms.clear().then(function () {
                                    db.idioms.bulkPut(data.data).then(function (lastKey) {
                                        DayPilot.Modal.alert(gettext.__('Successful restore from backup'), promptOptions);
                                    }).catch(Dexie.BulkError, function (err) {
                                        console.error(err);
                                    });
                                });
                            }
                        });
                    }
                };

                input.click();
            },
            showRecords: function (subject, highlight) {
                db.idioms.where({subject: subject, highlight: highlight}).each(function (item) {
                    Settings.appendItem(item);
                }).catch(function (err) {
                    console.error(err);
                });
            }
        };

    class Page {
        constructor() {
            this.counterDeleted = 0;
            this.counterUnregistered = 0;
            this.counterNicks = 0;
            this.counterWords = 0;
            this.countersContainer = 'countersContainer';
            this.editorSwitcher = 'editorSwitcher';
        }

        displayCounters() {
            let self = this,
                container = document.getElementById(self.countersContainer),
                links = new Map([
                    ['counterWords', {
                        action: 'resetTexts',
                        icon: '/grafika/s10.gif',
                        singular: 'Hidden word: %1',
                        plural: 'Hidden words: %1'
                    }],
                    ['counterNicks', {
                        action: 'resetNicks',
                        icon: '/grafika/s8.gif',
                        singular: 'Hidden nick: %1',
                        plural: 'Hidden nicks: %1'
                    }],
                    ['counterUnregistered', {
                        action: 'resetUnregistered',
                        icon: '/grafika/s7.gif',
                        singular: 'Hidden unregistered nick: %1',
                        plural: 'Hidden unregistered nicks: %1'
                    }],
                    ['counterDeleted', {
                        action: 'resetDeleted',
                        icon: '/grafika/s17.gif',
                        singular: 'Hidden deleted record: %1',
                        plural: 'Hidden deleted records: %1'
                    }]
                ]);

            links.forEach(function (options, id) {
                let el = document.getElementById(id),
                    counter = self[id];

                if (el !== null) {
                    el.remove();
                }

                if (counter > 0) {
                    let title = gettext._n(options.singular, options.plural, counter),
                        link = Object.assign(document.createElement('a'), {
                            id: id,
                            className: 'counter',
                            href: '#',
                            title: title
                        }),
                        span = document.createElement('span'),
                        icon = Object.assign(document.createElement('img'), {
                            src: options.icon,
                            width: 19,
                            height: 19,
                            border: 0,
                            align: 'bottom',
                            alt: title
                        });

                    span.appendChild(icon);
                    span.insertAdjacentHTML('beforeend', '&nbsp;' + counter + '&nbsp;');
                    link.appendChild(span);

                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.target.remove();
                        self[options.action](true);
                        self.displayCounters();
                    });

                    container.prepend(link);
                }
            });
        }

        initialize() {
            db = Utils.Db.initialize();

            db.on('changes', Events.Page.observableListener);

            GM_addValueChangeListener('sinner.enforceDomain', Events.Config.enforceDomainChangeListener);
            GM_addValueChangeListener('sinner.hideDeleted', Events.Config.hideDeletedChangeListener);
            GM_addValueChangeListener('sinner.hideUnregistered', Events.Config.hideUnregisteredChangeListener);
            GM_addValueChangeListener('sinner.highlightColor', Events.Config.highlightColorChangeListener);
            GM_addValueChangeListener('sinner.useHiding', Events.Config.useHidingChangeListener);
            GM_addValueChangeListener('sinner.useHighlighting', Events.Config.useHighlightingChangeListener);
            GM_addValueChangeListener('sinner.useMarkdown', Events.Config.useMarkdownChangeListener);
            GM_addValueChangeListener('sinner.transformAnchors', Events.Config.transformAnchorsChangeListener);
            GM_addValueChangeListener('sinner.transformAvatars', Events.Config.transformAvatarsChangeListener);
            GM_addValueChangeListener('sinner.youtubeThumbnail', Events.Config.youtubeThumbnailChangeListener);

            DOMPurify.setConfig(config.sanitizerOptions);

            mermaid.mermaidAPI.initialize(config.mermaidOptions);

            const renderer = {
                code(code, infostring, escaped) {
                    if (infostring === 'mermaid') {
                        return '<div class="mermaid">' + code + '</div>';
                    }

                    return '<pre><code class="language-' + infostring + '">' + code + '</code></pre>';
                }
            };
            marked.setOptions(config.parserOptions);
            marked.use({renderer});
            marked.emojiConvertor = new EmojiConvertor();
            marked.emojiConvertor.allow_caps = true;
            marked.emojiConvertor.hex2colons = function (hexcode, emoji) {
                hexcode = hexcode.toLowerCase();

                if (typeof marked.emojiConvertor.data[hexcode] !== 'undefined') {
                    return (':' + marked.emojiConvertor.data[hexcode][3][0] + ':');
                }

                return emoji;
            };

            return this;
        }

        modal(e) {
            e.preventDefault();

            if (typeof settingsModal === 'undefined') {
                Settings.initializeModal();
            }

            settingsModal.open();
        }

        async process() {
            await this.processNicks();
            await this.processTexts();
            this.processDeleted();
            this.processAvatars();
            this.processAnchors();
            this.displayCounters();
        }

        processAnchors() {
            if (config.transformAnchors) {
                Utils.Dom.transformAnchorTargets();
            }
        }

        processAvatars() {
        }

        processDeleted() {
        }

        async processNicks() {
        }

        async processTexts() {
        }

        reset() {
            this.resetDeleted();
            this.resetNicks();
            this.resetUnregistered();
            this.resetTexts();
            this.resetAnchors();
            this.resetAvatars();
            this.displayCounters();
        }

        resetAnchors() {
            document.querySelectorAll(".transformedAnchor").forEach(function (link) {
                link.target = '_blank';
                link.classList.remove('transformedAnchor');
            });
        }

        resetAvatars() {
        }

        resetDeleted() {
            this.counterDeleted = 0;

            Utils.Css.removeClass('hiddenDeleted');
        }

        resetNicks(unhideOnly) {
            unhideOnly = unhideOnly || false;

            this.counterNicks = 0;

            Utils.Css.removeClass('hiddenUser');

            if (unhideOnly) {
                return;
            }

            Utils.Css.removeClass(['highlightUser', 'strikeUser', 'highlightStatsUser']);

            document.querySelectorAll('.userLinks').forEach(function (el) {
                Utils.Dom.removeAllChildNodes(el);
                el.remove();
            });
        }

        resetTexts(unhideOnly) {
            unhideOnly = unhideOnly || false;

            this.counterWords = 0;

            Utils.Css.removeClass('hiddenWord');

            if (unhideOnly) {
                return;
            }

            document.querySelectorAll('.highlightWord, .strikeWord').forEach(function (el) {
                Utils.String.unwrap(el);
            });

            document.querySelectorAll('.markdownParsed').forEach(function (el) {
                el.remove();
            });

            Utils.Css.removeClass('markdownSource');
        }

        resetUnregistered() {
            this.counterUnregistered = 0;

            Utils.Css.removeClass('unregisteredUser');
        }
    }

    class HomePage extends Page {
        initialize() {
            super.initialize();

            let menu = document.querySelector('div#ixright')
                    .querySelector('div.boxaround')
                    .querySelector('div.boxchk'),
                br = document.createElement('br'),
                a = Object.assign(document.createElement('a'), {href: '#'}),
                text = document.createTextNode(gettext.__('SINNER')),
                img = Object.assign(document.createElement('img'), {
                    src: 'grafika/flarr.gif',
                    width: 13,
                    height: 11,
                    align: 'top',
                    border: 0,
                    alt: 'Bod'
                });

            a.appendChild(img);
            a.appendChild(text);
            a.addEventListener('click', this.modal);

            menu.appendChild(br);
            menu.appendChild(a);

            document.querySelector('#ixmidst > div.boxheader > span').id = this.countersContainer;

            return this;
        }

        async processNicks() {
            await super.processNicks();

            let self = this,
                highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true);

            document.querySelectorAll('li.c4, li.c4u').forEach(function (el) {
                let index = el.innerText.indexOf('('),
                    text = index === -1 ? el.innerText : el.innerText.slice(0, index - 1).trim(),
                    nick = Utils.String.compress(text, true, true, true);

                if (config.useHighlighting && highlight.includes(nick)) {
                    if (!el.classList.contains('highlightUser')) {
                        el.classList.add('highlightUser');
                    }
                } else if (config.useHiding && hide.includes(nick)) {
                    if (!el.parentElement.classList.contains('hiddenUser')) {
                        self.counterNicks++;
                        el.parentElement.classList.add('hiddenUser');
                    }
                }
            });
        }

        async processTexts() {
            await super.processTexts();

            let self = this,
                highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false);

            document.querySelectorAll('li.c3 a, li.c3l a').forEach(function (el) {
                Utils.Dom.wrapElementWords(self, el, highlight, hide);
            });
        }
    }

    class PostPage extends Page {
        constructor() {
            super();

            this.editor = null;
        }

        initialize() {
            super.initialize();

            let tables = document.querySelectorAll('body > div > table');

            tables[tables.length - 2].querySelectorAll('tbody > tr td')[1].id = this.countersContainer;

            return this;
        }

        async process() {
            if (document.querySelector('.infoctext')) {
                return;
            }

            super.process();

            let isQuotes = window.location.pathname.startsWith('/zpovperl.php');

            Utils.Dom.embedMarkdownEditorSwitcher('TEXT ROZHŘEŠENÍ:');

            if (!isQuotes && config.useMarkdown > 1) {
                this.editor = Utils.Dom.createMarkdownEditor();
            }
        }

        processDeleted() {
            if (!config.hideDeleted) {
                return;
            }

            super.processDeleted();
            let self = this;

            document.querySelectorAll('td.infortext').forEach(function (deleted) {
                let toHide = [deleted.parentElement, deleted.parentElement.previousElementSibling, deleted.parentElement.nextElementSibling],
                    previousContent = deleted.parentElement.previousElementSibling.previousElementSibling.firstElementChild.firstElementChild.innerHTML.trim();

                self.counterDeleted++;

                if (previousContent.length === 0) {
                    toHide.push(deleted.parentElement.previousElementSibling.previousElementSibling);
                }

                toHide.forEach(function (el) {
                    el.classList.add('hiddenDeleted');
                });
            });
        }

        async processNicks() {
            await super.processNicks();

            let self = this,
                highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true),
                el = document.querySelector('span.signunreg, span.signnick'),
                isQuotes = window.location.pathname.startsWith('/zpovperl.php'),
                text = el.innerText.trim(),
                nick = Utils.String.compress(text, true, true, true),
                parent = el.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement,
                superParent = parent.parentElement.parentElement.parentElement,
                infoParent = document.querySelectorAll('td.conftext')[1],
                infoWrapper = infoParent.classList.contains('markdownParsed') ? document.querySelectorAll('td.conftext')[2] : infoParent,
                info = infoWrapper.querySelectorAll('td.signinfo')[1],
                linksEl = Object.assign(document.createElement('span'), {
                    className: 'userLinks'
                });

            if (config.useHighlighting && highlight.includes(nick)) {
                if (!superParent.classList.contains('highlightUser')) {
                    superParent.classList.add('highlightUser');
                }
            } else if (config.useHiding && hide.includes(nick)) {
                if (!el.classList.contains('strikeUser')) {
                    el.classList.add('strikeUser');
                }
            }

            // quotes header is rendered without userinfo (system account)
            if (!isQuotes) {
                info.prepend(linksEl);
                Utils.Dom.embedUserLinks(linksEl, text, highlight, hide, parent.previousElementSibling.firstElementChild);
            }

            document.querySelectorAll('td.signunreg, td.signnick').forEach(function (el) {
                let text = el.innerText.trim(),
                    nick = Utils.String.compress(text, true, true, true),
                    parent = el.parentElement,
                    info = parent.querySelector('td.signinfo'),
                    isRegistered = info.childElementCount !== 0,
                    container1 = parent.parentElement.parentElement.parentElement.parentElement,
                    container2 = container1.previousElementSibling,
                    container3 = container2.previousElementSibling,
                    containers = [container1, container2, container3],
                    linksEl = Object.assign(document.createElement('span'), {
                        className: 'userLinks'
                    });

                // all quote authors are rendered as unregistered
                if (!isQuotes
                    && config.hideUnregistered
                    && !isRegistered
                ) {
                    self.counterUnregistered++;

                    containers.forEach(function (tr) {
                        if (!tr.classList.contains('unregisteredUser')) {
                            tr.classList.add('unregisteredUser');
                        }
                    });
                }

                if (config.useHighlighting && highlight.includes(nick)) {
                    if (!parent.classList.contains('highlightUser')) {
                        parent.classList.add('highlightUser');
                    }
                } else if (config.useHiding && hide.includes(nick)) {
                    self.counterNicks++;

                    containers.forEach(function (tr) {
                        if (!tr.classList.contains('hiddenUser')) {
                            tr.classList.add('hiddenUser');
                        }
                    });
                }

                info.prepend(linksEl);
                Utils.Dom.embedUserLinks(linksEl, text, highlight, hide, container2.firstElementChild);
            });
        }

        async processTexts() {
            await super.processTexts();

            let self = this,
                highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false),
                header = document.querySelector('td.confheader'),
                headers = document.querySelectorAll('td.conftext'),
                content = headers[0],
                authorInfo = headers[1].querySelectorAll('td.signinfo')[1];

            if (config.useHiding) {
                if (Utils.String.containsWord(header, hide)) {
                    header.innerHTML = Utils.String.wrapAll(header, hide, 'strikeWord');
                }
                if (Utils.String.containsWord(content, hide)) {
                    content.innerHTML = Utils.String.wrapAll(content, hide, 'strikeWord');
                }
            }

            if (config.useHighlighting) {
                if (Utils.String.containsWord(header, highlight)) {
                    header.innerHTML = Utils.String.wrapAll(header, highlight);
                }
                if (Utils.String.containsWord(content, highlight)) {
                    content.innerHTML = Utils.String.wrapAll(content, highlight);
                }
            }

            Utils.Dom.embedYoutube(content);

            if (config.useMarkdown > 1) {
                Utils.Dom.transformMarkdownSource(content);
            }

            document.querySelectorAll('td.signunreg, td.signnick').forEach(function (el) {
                let nickEl = el.parentElement.parentElement.parentElement.parentElement.parentElement,
                    headEl = nickEl.previousElementSibling.previousElementSibling,
                    textEl = nickEl.previousElementSibling.firstElementChild,
                    toHide = [nickEl, headEl, textEl.parentElement];

                if (config.useHiding && Utils.String.containsWord(textEl, hide)) {
                    self.counterWords++;
                    textEl.innerHTML = Utils.String.wrapAll(textEl, hide, 'strikeWord');

                    toHide.forEach(function (hel) {
                        hel.classList.add('hiddenWord');
                    });
                }

                if (config.useHighlighting && Utils.String.containsWord(textEl, highlight)) {
                    textEl.innerHTML = Utils.String.wrapAll(textEl, highlight);
                }

                Utils.Dom.embedYoutube(textEl);

                if (config.useMarkdown > 1) {
                    Utils.Dom.transformMarkdownSource(textEl);
                }
            });
        }
    }

    class ProfilePage extends Page {
        constructor() {
            super();

            this.editor = null;
        }

        initialize() {
            super.initialize();

            let tables = document.querySelectorAll('body > div > table');

            tables[tables.length === 5 ? 4 : 5]
                .querySelectorAll('tbody > tr td')[1].id = this.countersContainer;

            return this;
        }

        async process() {
            super.process();

            Utils.Dom.embedMarkdownEditorSwitcher('TEXT ZÁPISU:');

            if (config.useMarkdown > 1) {
                this.editor = Utils.Dom.createMarkdownEditor();
            }
        }

        processAvatars() {
            let info = document.querySelectorAll('table.infoltext tbody'),
                wwwContainer = info[0].children[info[0].children.length - 5];

            // Fixes ugly design effect of long URL in the table cell refs #13
            wwwContainer.parentElement.parentElement.parentElement.setAttribute('align', 'left');

            if (!config.transformAvatars) {
                return;
            }

            let www = wwwContainer.innerText.trim().slice(13).trim(),
                container = document.querySelector('td.photo');

            Utils.Dom.replaceAvatar(container, www, info[1]);
        }

        async processNicks() {
            await super.processNicks();

            let self = this,
                highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true),
                el = document.querySelector('td.profheader'),
                text = el.innerText.trim(),
                info = document.querySelector('table.infoltext tbody').firstElementChild.firstElementChild,
                nick = Utils.String.compress(text, true, true, true),
                parent = el.parentElement,
                linksEl = Object.assign(document.createElement('span'), {
                    className: 'userLinks'
                });

            if (config.useHighlighting && highlight.includes(nick)) {
                if (!parent.classList.contains('highlightUser')) {
                    parent.classList.add('highlightUser');
                }
            } else if (config.useHiding && hide.includes(nick)) {
                if (!el.classList.contains('strikeUser')) {
                    el.classList.add('strikeUser');
                }
            }

            info.appendChild(linksEl);
            Utils.Dom.embedUserLinks(linksEl, text, highlight, hide);
            linksEl.insertAdjacentHTML('afterbegin', '&nbsp;');

            document.querySelectorAll('span.guestnote, span.guestnick').forEach(function (el) {
                let isRegistered = el.innerText.indexOf('(') === -1,
                    index = isRegistered ? el.innerText.indexOf(':') : el.innerText.indexOf('(') - 1,
                    text = el.innerText.slice(0, index).trim(),
                    nick = Utils.String.compress(text, true, true, true),
                    parent = el.parentElement.parentElement,
                    linksEl = Object.assign(document.createElement('span'), {
                        className: 'userLinks'
                    });

                if (config.hideUnregistered && !isRegistered) {
                    if (!parent.classList.contains('unregisteredUser')) {
                        self.counterUnregistered++;
                        parent.classList.add('unregisteredUser');
                    }
                }

                if (config.useHighlighting && highlight.includes(nick)) {
                    if (!parent.classList.contains('highlightUser')) {
                        parent.classList.add('highlightUser');
                    }
                } else if (config.useHiding && hide.includes(nick)) {
                    if (!parent.classList.contains('hiddenUser')) {
                        self.counterNicks++;
                        parent.classList.add('hiddenUser');
                    }
                }

                el.prepend(linksEl);
                Utils.Dom.embedUserLinks(linksEl, text, highlight, hide, el.parentElement.querySelector('div.guesttext'));
            });
        }

        async processTexts() {
            await super.processTexts();

            let self = this,
                highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false);

            document.querySelectorAll('div.guesttext').forEach(function (el) {
                Utils.Dom.wrapElementWords(self, el, highlight, hide);

                Utils.Dom.embedYoutube(el);

                if (config.useMarkdown > 1) {
                    Utils.Dom.transformMarkdownSource(el);
                }
            });
        }

        resetAvatars() {
            Utils.Css.removeClass('transformedAvatar');

            document.querySelectorAll('img.avatar').forEach(function (avatar) {
                avatar.parentElement.remove();
            });
        }
    }

    class BookPage extends Page {
        constructor() {
            super();

            this.editor = null;
        }

        initialize() {
            super.initialize();

            document.querySelectorAll('body > div > table')[3]
                .querySelectorAll('tbody > tr')[1]
                .querySelectorAll('td.boxheader')[1].id = this.countersContainer;

            return this;
        }

        async process() {
            super.process();

            Utils.Dom.embedMarkdownEditorSwitcher('TEXT ZÁPISU:');

            if (config.useMarkdown > 1) {
                this.editor = Utils.Dom.createMarkdownEditor();
            }
        }

        async processNicks() {
            await super.processNicks();

            let self = this,
                highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true);

            document.querySelectorAll('span.guestnote, span.guestnick').forEach(function (el) {
                let isRegistered = el.innerText.indexOf('(') === -1,
                    index = el.innerText.indexOf('(') === -1 ? el.innerText.indexOf(':') : el.innerText.indexOf('(') - 1,
                    text = el.innerText.slice(0, index).trim(),
                    nick = Utils.String.compress(text, true, true, true),
                    parent = el.parentElement.parentElement,
                    linksEl = Object.assign(document.createElement('span'), {
                        className: 'userLinks'
                    });

                if (config.hideUnregistered && !isRegistered) {
                    if (!parent.classList.contains('unregisteredUser')) {
                        self.counterUnregistered++;
                        parent.classList.add('unregisteredUser');
                    }
                }

                if (config.useHighlighting && highlight.includes(nick)) {
                    if (!parent.classList.contains('highlightUser')) {
                        parent.classList.add('highlightUser');
                    }
                } else if (config.useHiding && hide.includes(nick)) {
                    if (!parent.classList.contains('hiddenUser')) {
                        self.counterNicks++;
                        parent.classList.add('hiddenUser');
                    }
                }

                el.prepend(linksEl);
                Utils.Dom.embedUserLinks(linksEl, text, highlight, hide, el.parentElement.querySelector('div.guesttext'));
            });
        }

        async processTexts() {
            await super.processTexts();

            let self = this,
                highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false);

            document.querySelectorAll('div.guesttext').forEach(function (el) {
                Utils.Dom.wrapElementWords(self, el, highlight, hide);

                Utils.Dom.embedYoutube(el);

                if (config.useMarkdown > 1) {
                    Utils.Dom.transformMarkdownSource(el);
                }
            });
        }
    }

    class StatsPage extends Page {
        initialize() {
            super.initialize();

            document.querySelectorAll('body > div > table')[4]
                .querySelector('tbody > tr')
                .querySelectorAll('td.boxheader')[1].id = this.countersContainer;

            return this;
        }

        async process() {
            switch (window.location.search) {
                case '?prehled=4':
                    await this.processNicks();
                    break;
                case '?prehled=3':
                    await this.processNicks(40);
                    await this.processTexts(40);
                    break;
                case '?prehled=2':
                    await this.processNicks(20);
                    await this.processTexts(20);
                    break;
                case '?prehled=1':
                default:
                    await this.processTexts();
                    break;
            }

            this.processDeleted();
            this.processAvatars();
            this.processAnchors();
            this.displayCounters();
        }

        async processNicks(skip) {
            await super.processNicks();

            let self = this,
                highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true),
                index = 0;

            skip = skip || 0;

            document.querySelectorAll('td.lstconf').forEach(function (el) {
                if (index++ < skip) {
                    return;
                }

                let nick = Utils.String.compress(el.innerText, true, true, true);

                if (config.useHighlighting && highlight.includes(nick)) {
                    if (!el.classList.contains('highlightStatsUser')) {
                        el.classList.add('highlightStatsUser');
                    }
                } else if (config.useHiding && hide.includes(nick)) {
                    if (!el.parentElement.classList.contains('hiddenUser')) {
                        self.counterNicks++;
                        el.parentElement.classList.add('hiddenUser');
                    }
                }
            });
        }

        async processTexts(count) {
            await super.processTexts();

            let self = this,
                highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false),
                index = 0;

            count = count || 0;

            document.querySelectorAll('td.lstconf').forEach(function (el) {
                if (count > 0 && ++index > count) {
                    return;
                }

                if (config.useHiding && Utils.String.containsWord(el, hide)) {
                    self.counterWords++;
                    el.parentElement.classList.add('hiddenWord');
                    el.innerHTML = Utils.String.wrapAll(el, hide, 'strikeWord');
                }

                if (config.useHighlighting && Utils.String.containsWord(el, highlight)) {
                    el.innerHTML = Utils.String.wrapAll(el, highlight);
                }
            });
        }
    }

    if (config.domain !== '.' && window.location.hostname !== config.domain) {
        Settings.enforceDomain(config.domain);
        return;
    }

    let pathname = window.location.pathname,
        path = pathname === '/' ? 'index' : pathname.substring(1, pathname.indexOf('.php'));

    switch (path) {
        case 'index':
            page = new HomePage;
            break;
        case 'detail':
        case 'zpovperl':
            page = new PostPage;
            break;
        case 'profil':
            page = new ProfilePage;
            break;
        case 'kniha':
            page = new BookPage;
            break;
        case 'stat':
            page = new StatsPage;
            break;
        default:
            console.error('ZPOVEDNICAR unknown page ' + path);
            return;
    }

    Utils.Css.initializeStylesheet();

    GM_registerMenuCommand(gettext.__('Settings'), page.modal);

    page.initialize().process();
});
