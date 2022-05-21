'use strict';

for (let resource of ['CSS_TINGLE', 'CSS_TABBY', 'CSS_MODAL', 'CSS_PICKER', 'CSS_CUSTOM']) {
    GM_addStyle(GM_getResourceText(resource));
}

const style = (function () {
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
        page,
        settingsModal;

    const i18n = {
            language: window.location.hostname.match(/^(www\.)?spovednica\.sk$/) ? 'sk' : 'cz',
            cz: {
                yes: 'Ano',
                no: 'Ne',
                ok: 'Rozumím',
                menuLabel: 'ZPOVĚDNIČÁŘ',
                enable: 'zapnout',
                disable: 'vypnout',
                comingSoon: 'už brzy',
                domainsNone: '-- nepoužívat --',
                questionHighlightUser: 'Opravdu smazat zvýrazněného uživatele?',
                questionHideUser: 'Opravdu smazat skrývaného uživatele?',
                questionHighlightWord: 'Opravdu smazat zvýrazněný výraz?',
                questionHideWord: 'Opravdu smazat skrývaný výraz?',
                settingsSubmit: 'Uložit',
                settingsSend: 'Odeslat',
                settingsCancel: 'Zrušit',
                settingsUser: 'přezdívka',
                settingsWord: 'výraz',
                settingsClose: 'Zavřít',
                settingsHighlight: 'Zvýrazňovat',
                settingsHide: 'Skrývat',
                settingsLabel: 'Nastavení',
                settingsUsers: 'Přezdívky',
                settingsWords: 'Výrazy',
                settingsNone: 'žádné',
                settingsColor: 'Barva zvýraznění',
                settingsDomain: 'Vynutit doménu',
                settingsHideDeleted: 'Skrývat smazané',
                settingsHideUnregistered: 'Skrývat neregistrované',
                settingsTransformAnchors: 'Odkazy otevřít ve stejném okně',
                settingsYoutubeThumbnails: 'Náhledy Youtube videí',
                idiomContentLength: 'Minimální délka jsou [length] znaky',
                idiomContentExists: 'Záznam existuje ve [highlight], obojí najednou není možné',
                idiomContentHighlighted: 'zvýrazňovaných',
                idiomContentHidden: 'skrývaných',
                fileSaverUnsupported: 'Nepodporováno vaším prohlížečem',
                settingsBackups: 'Zálohování',
                settingsBackup: 'Zálohovat',
                settingsBackupEmpty: 'Databáze je prázdná, není co zálohovat',
                settingsBackupPassword: 'Heslo pro soubor se zálohou',
                settingsBackupSuccess: 'Záloha proběhla úspěšně, stahuje se soubor:<br><br>[filename]',
                settingsRestore: 'Obnovit',
                settingsRestoreError: 'Neplatné heslo nebo poškozený soubor se zálohou',
                settingsRestoreSuccess: 'Obnova ze zálohy proběhla úspěšně',
                thumbnailsNone: '-- žádné --',
                helpLabel: 'Nápovědu najdete na',
                hideUser: 'Skrývat přezdívku',
                highlightUser: 'Zvýrazňovat přezdívku'
            },
            sk: {
                yes: 'Áno',
                no: 'Nie',
                ok: 'Rozumiem',
                menuLabel: 'SPOVEDNIČIAR',
                enable: 'zapnúť',
                disable: 'vypnúť',
                comingSoon: 'už čoskoro',
                domainsNone: '-- nepoužívať --',
                questionHighlightUser: 'Naozaj zmazať zvýrazneného užívateľa?',
                questionHideUser: 'Naozaj zmazať skrývaného užívateľa?',
                questionHighlightWord: 'Naozaj zmazať zvýraznený výraz?',
                questionHideWord: 'Naozaj zmazať skrývaný výraz?',
                settingsSubmit: 'Uložiť',
                settingsSend: 'Odoslať',
                settingsCancel: 'Zrušiť',
                settingsUser: 'prezývka',
                settingsWord: 'výraz',
                settingsClose: 'Zavrieť',
                settingsHighlight: 'Zvýrazňovať',
                settingsHide: 'Skrývať',
                settingsLabel: 'Nastavenia',
                settingsUsers: 'Prezývky',
                settingsWords: 'Výrazy',
                settingsNone: 'žiadne',
                settingsColor: 'Farba zvýraznenia',
                settingsDomain: 'Vynútiť doménu',
                settingsHideDeleted: 'Skrývať zmazané',
                settingsHideUnregistered: 'Skrývať neregistrované',
                settingsTransformAnchors: 'Odkazy otvoriť v rovnakom okne',
                settingsYoutubeThumbnails: 'Náhľady Youtube videí',
                idiomContentLength: 'Minimálna dĺžka sú [length] znaky',
                idiomContentExists: 'Záznam existuje vo [highlight], oboje naraz nie je možné',
                idiomContentHighlighted: 'zvýrazňovaných',
                idiomContentHidden: 'skrývaných',
                fileSaverUnsupported: 'Nepodporované vašim prehliadačom',
                settingsBackups: 'Zálohovanie',
                settingsBackup: 'Zálohovať',
                settingsBackupEmpty: 'Databáza je prázdna, nie je čo zálohovať',
                settingsBackupPassword: 'Heslo pre súbor so zálohou',
                settingsBackupSuccess: 'Záloha prebehla úspešne, sťahuje sa súbor:<br><br>[filename]',
                settingsRestore: 'Obnoviť',
                settingsRestoreError: 'Neplatné heslo alebo poškodený súbor so zálohou',
                settingsRestoreSuccess: 'Obnova zo zálohy prebehla úspešne',
                thumbnailsNone: '-- žiadne --',
                helpLabel: 'Nápovedu nájdete na',
                hideUser: 'Skrývať prezývku',
                highlightUser: 'Zvýrazňovať prezývku'
            }
        },
        config = {
            color: GM_getValue('sinner.highlightColor', '#ff0000'),
            domain: GM_getValue('sinner.enforceDomain', '.'),
            youtubeThumbnail: GM_getValue('sinner.youtubeThumbnail', 0),
            hideDeleted: GM_getValue('sinner.hideDeleted', false),
            hideUnregistered: GM_getValue('sinner.hideUnregistered', false),
            useHighlighting: GM_getValue('sinner.useHighlighting', true),
            useHiding: GM_getValue('sinner.useHiding', true),
            transformAnchors: GM_getValue('sinner.transformAnchors', false),
            transformAvatars: GM_getValue('sinner.transformAvatars', false),
            domains: new Map([
                ['.', i18n[i18n.language].domainsNone],
                ['www.zpovednice.eu', 'www.zpovednice.eu'],
                ['www.zpovednice.cz', 'www.zpovednice.cz'],
                ['www.spovednica.sk', 'www.spovednica.sk']
            ]),
            youtubeThumbnails: new Map([
                [0, {
                    label: i18n[i18n.language].thumbnailsNone
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
                ['ul#highlightUser', i18n[i18n.language].questionHighlightUser],
                ['ul#hideUser', i18n[i18n.language].questionHideUser],
                ['ul#highlightWord', i18n[i18n.language].questionHighlightWord],
                ['ul#hideWord', i18n[i18n.language].questionHideWord]
            ]),
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
            }]
        ]),
        Utils = {
            i18n: function (key) {
                return i18n[i18n.language][key] || 'Missing ' + i18n.language + ' translation for key ' + key;
            },
            Css: {
                initializeStylesheet: function () {
                    cssRules.forEach(function (rule, key) {
                        let index = style.sheet.insertRule(rule.selector + ' {}', rule.index);

                        rule.style.forEach(function (value, key) {
                            style.sheet.cssRules[index].style[key] = value;
                        });
                    });
                },
                setStyle: function (name, key, value) {
                    let rule = cssRules.get(name);

                    style.sheet.cssRules[rule.index].style[key] = value;
                },
                removeClass: function (classNames) {
                    classNames = typeof classNames === 'string' ? [classNames] : classNames;

                    classNames.forEach(function (className) {
                        document.querySelectorAll('.' + className).forEach(function (el) {
                            el.classList.remove(className);
                        });
                    });
                }
            },
            Dom: {
                removeAllChildNodes: function (parent) {
                    while (parent.firstChild) {
                        parent.removeChild(parent.firstChild);
                    }
                },
                isVip: function (infoEl) {
                    let imgs = infoEl.querySelectorAll('img'),
                        vip = ['cathome', 'cathomeh', 'catclub', 'catclubh', 'catmod', 'catmodh', 'catvip', 'catviph'];

                    return imgs.length && vip.includes(imgs[imgs.length - 1].src.split('/').pop().split('.').shift());
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
                                    target: '_blank'
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
                embedHighlightUserLink: function (el, nick) {
                    let link = Object.assign(document.createElement('a'), {
                            href: '#',
                            title: Utils.i18n('highlightUser'),
                            className: 'highlightUserLink'
                        }),
                        linkContent = Object.assign(document.createElement('img'), {
                            src: '/grafika/s3.gif',
                            width: 15,
                            height: 15,
                            border: 0,
                            align: 'bottom',
                            alt: Utils.i18n('highlightUser')
                        });

                    link.appendChild(linkContent);
                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.target.parentElement.parentElement.remove();
                        Settings.highlightUser(nick);
                    });

                    el.prepend(link);
                },
                embedHideUserLink: function (el, nick) {
                    let link = Object.assign(document.createElement('a'), {
                            href: '#',
                            title: Utils.i18n('hideUser'),
                            className: 'hideUserLink'
                        }),
                        linkContent = Object.assign(document.createElement('img'), {
                            src: '/grafika/s8.gif',
                            width: 15,
                            height: 15,
                            border: 0,
                            align: 'bottom',
                            alt: Utils.i18n('hideUser')
                        });

                    link.appendChild(linkContent);
                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.target.parentElement.parentElement.remove();
                        Settings.hideUser(nick);
                    });

                    el.prepend(link);
                    el.insertAdjacentHTML('afterbegin', '&nbsp;');
                },
                embedUserLinks: function (el, nick) {
                    if (config.useHiding) {
                        Utils.Dom.embedHideUserLink(el, nick);
                    }

                    if (config.useHighlighting) {
                        Utils.Dom.embedHighlightUserLink(el, nick);
                    }
                },
                transformAnchorTargets: function () {
                    if (config.transformAnchors) {
                        document.querySelectorAll("a[target='_blank']").forEach(function (link) {
                            link.classList.add('transformedAnchor');
                            link.removeAttribute('target');
                        });
                    } else {
                        document.querySelectorAll("a.transformedAnchor").forEach(function (link) {
                            link.target = '_blank';
                            link.classList.remove('transformedAnchor');
                        });
                    }
                },
                replaceAvatar: function (container, src) {
                    if (!config.transformAvatars || !src.match(/^(http(s?):)([/|.|\w|\s|-])*\.(?:apng|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)$/)) {
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
                            title: src
                        });

                    if (!config.transformAnchors) {
                        link.target = '_blank';
                    }

                    if (photo !== null) {
                        photo.remove();
                    }

                    link.appendChild(img);
                    container.appendChild(link);
                }
            },
            String: {
                replaceIAll: function (str, searchValue, newValue) {
                    let escaped = searchValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
                        regexp = new RegExp(escaped, 'ig');

                    return str.replace(regexp, newValue);
                },
                capitalizeFirstLetter: function (s) {
                    return s[0].toUpperCase() + s.slice(1);
                },
                noAccent: function (str) {
                    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
                containsWord: function (el, words) {
                    let content = el.innerText.trim(),
                        haystack = Utils.String.compress(content, true),
                        result = false;

                    for (let word of words) {
                        if (result) {
                            continue;
                        }

                        let needle = Utils.String.compress(word, true);

                        if (Utils.String.stripos(haystack, needle) !== false) {
                            result = true;
                        }
                    }

                    return result;
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
                initialize: function () {
                    let database = new Dexie('Sinner');

                    database.version(1).stores({
                        idioms: '$$uuid, [subject+highlight], content'
                    });

                    database.open().catch(function (e) {
                        console.error('Failed to open database: ' + e.stack);
                    });

                    return database;
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

                        return results;
                    });
                }
            }
        },
        Settings = {
            getTargetByItem: function (item) {
                return 'ul#' + (item.highlight === 1 ? 'highlight' : 'hide') + Utils.String.capitalizeFirstLetter(item.subject);
            },
            getCaptionByItem: function (item) {
                return document.getElementById((item.highlight === 1 ? 'highlight' : 'hide') + Utils.String.capitalizeFirstLetter(item.subject) + 'None');
            },
            deleteRecord: function (item) {
                db.idioms.where('uuid').equals(item.uuid).delete().then(function (cnt) {
                }).catch(function (err) {
                    console.error(err);
                });
            },
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
                        okText: Utils.i18n('yes'),
                        cancelText: Utils.i18n('no'),
                        container: document.querySelector('div.tingle-modal-box__content')
                    };

                    DayPilot.Modal.confirm(question, options).then(function (args) {
                        if (args.result === 'OK') {
                            Settings.deleteRecord(item);
                        }
                    });
                });
                li.appendChild(a);
                document.querySelector(target).appendChild(li);
                caption.style.display = 'none';
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
            colorChangeListener: function (key, old_value, new_value, remote) {
                config.color = new_value;

                Utils.Css.setStyle('homeHighlightUser', 'color', new_value);
                Utils.Css.setStyle('postHighlightUser', 'color', new_value);
                Utils.Css.setStyle('statsHighlightUser', 'color', new_value);
                Utils.Css.setStyle('pageHighlightWord', 'background-color', new_value);

                if (typeof settingsModal !== 'undefined' && remote) {
                    document.getElementById('colorPicker').value = config.color;
                }
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
            domainChangeListener: function (key, old_value, new_value, remote) {
                Settings.enforceDomain(new_value);
            },
            youtubeThumbnailChangeListener: function (key, old_value, new_value, remote) {
                config.youtubeThumbnail = new_value;
                page.process();
            },
            hideDeletedChangeListener: function (key, old_value, new_value, remote) {
                config.hideDeleted = new_value;

                if (new_value) {
                    page.hideDeleted();
                } else {
                    page.showDeleted();
                }
            },
            hideUnregisteredChangeListener: function (key, old_value, new_value, remote) {
                config.hideUnregistered = new_value;
                page.process();
            },
            useHighlightingChangeListener: function (key, old_value, new_value, remote) {
                config.useHighlighting = new_value;
                page.process();
            },
            useHidingChangeListener: function (key, old_value, new_value, remote) {
                config.useHiding = new_value;
                page.process();
            },
            transformAnchorsChangeListener: function (key, old_value, new_value, remote) {
                config.transformAnchors = new_value;
                Utils.Dom.transformAnchorTargets();
            },
            transformAvatarsChangeListener: function (key, old_value, new_value, remote) {
                config.transformAvatars = new_value;
                page.processAvatars();
            },
            showRecords: function (subject, highlight) {
                db.idioms.where({subject: subject, highlight: highlight}).each(function (item) {
                    Settings.appendItem(item);
                }).catch(function (err) {
                    console.error(err);
                });
            },
            processForm: function (data) {
                let record = {
                        subject: data.get('subject'),
                        highlight: parseInt(data.get('highlight')),
                        content: data.get('content').trim()
                    },
                    alertOptions = {
                        okText: Utils.i18n('ok'),
                        container: document.querySelector('div.tingle-modal-box__content')
                    };

                if (record.content.length < 3) {
                    let msg = Utils.i18n('idiomContentLength').replace('[length]', 3);

                    DayPilot.Modal.alert(msg, alertOptions);

                    return false;
                }

                document.querySelector('input#sinnerInputContent').value = '';

                db.idioms.where('content').equalsIgnoreCase(record.content).and(function (rec) {
                    return rec.subject === record.subject;
                }).count().then(function (cnt) {
                    if (cnt > 0) {
                        let highlight = record.highlight === 1 ? Utils.i18n('idiomContentHidden') : Utils.i18n('idiomContentHighlighted'),
                            msg = Utils.i18n('idiomContentExists').replace('[highlight]', highlight);

                        DayPilot.Modal.alert(msg, alertOptions);

                        return false;
                    }

                    return db.idioms.add(record);
                }).then(function (uuid) {
                }).catch(function (err) {
                    console.error(err);
                });
            },
            hideUser: function (nick) {
                let record = {
                    subject: 'user',
                    highlight: 0,
                    content: nick.trim()
                };

                db.idioms.add(record);
            },
            highlightUser: function (nick) {
                let record = {
                    subject: 'user',
                    highlight: 1,
                    content: nick.trim()
                };

                db.idioms.add(record);
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
                        case 3:
                            Settings.removeItem(change.oldObj);
                            break;
                    }
                });
            },
            backup: function () {
                let promptOptions = {
                    okText: Utils.i18n('settingsSend'),
                    cancelText: Utils.i18n('settingsCancel'),
                    container: document.querySelector('div.tingle-modal-box__content')
                };

                db.idioms.toArray(function (data) {
                    promptOptions.okText = Utils.i18n('ok');

                    if (data.length === 0) {
                        DayPilot.Modal.alert(Utils.i18n('settingsBackupEmpty'), promptOptions);

                        return;
                    }

                    DayPilot.Modal.prompt(Utils.i18n('settingsBackupPassword'), promptOptions).then(function (args) {
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
                        DayPilot.Modal.alert(Utils.i18n('settingsBackupSuccess').replace('[filename]', filename), promptOptions);
                    });
                }).catch(function (err) {
                    console.error(err);
                });
            },
            restore: function () {
                let promptOptions = {
                        okText: Utils.i18n('settingsSend'),
                        cancelText: Utils.i18n('settingsCancel'),
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

                        DayPilot.Modal.prompt(Utils.i18n('settingsBackupPassword'), promptOptions).then(function (args) {
                            if (typeof args.result === 'undefined' || args.result.length === 0) {
                                return;
                            }

                            let csv = Utils.String.rc4(args.result, raw),
                                data = Papa.parse(csv, {
                                    header: true,
                                    dynamicTyping: true
                                });

                            promptOptions.okText = Utils.i18n('ok');

                            if (data.errors.length > 0) {
                                DayPilot.Modal.alert(Utils.i18n('settingsRestoreError'), promptOptions);
                            } else {
                                db.idioms.clear().then(function () {
                                    db.idioms.bulkPut(data.data).then(function (lastKey) {
                                        DayPilot.Modal.alert(Utils.i18n('settingsRestoreSuccess'), promptOptions);
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
                        value: Utils.i18n('settingsHighlight'),
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
                    text: Utils.i18n('settingsUser')
                }));
                select.appendChild(Object.assign(document.createElement('option'), {
                    value: 'word',
                    selected: 'selected',
                    text: Utils.i18n('settingsWord')
                }));

                form.appendChild(type);
                form.appendChild(select);
                form.insertAdjacentHTML('beforeend', '&nbsp;');
                form.appendChild(text);
                form.insertAdjacentHTML('beforeend', '&nbsp;');
                form.appendChild(submit);
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    Settings.processForm(new FormData(e.target));
                });

                settingsModal = new tingle.modal({
                    footer: true,
                    closeMethods: ['overlay', 'button', 'escape'],
                    closeLabel: Utils.i18n('settingsClose'),
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
                    '<li><a data-tabby-default href="#tabHighlight">' + Utils.i18n('settingsHighlight') + '</a></li>' +
                    '<li><a href="#tabHide">' + Utils.i18n('settingsHide') + '</a></li>' +
                    '<li><a href="#tabSettings">' + Utils.i18n('settingsLabel') + '</a></li>' +
                    '</ul>' +
                    '<div id="tabHighlight">' +
                    '<p>' +
                    '<input type="radio" name="useHighlighting" id="highlightingYes"' + (config.useHighlighting ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="highlightingYes">' + Utils.i18n('enable') + '</label>&nbsp;' +
                    '<input type="radio" name="useHighlighting" id="highlightingNo"' + (config.useHighlighting ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="highlightingNo">' + Utils.i18n('disable') + '</label>' +
                    '</p>' +
                    '<div class="row">' +
                    '<div class="column">' +
                    '<strong>' + Utils.i18n('settingsUsers') + ':</strong>&nbsp;<span id="highlightUserNone">(' + Utils.i18n('settingsNone') + ')</span>' +
                    '<ul id="highlightUser" class="sinnerList"></ul>' +
                    '</div>' +
                    '<div class="column">' +
                    '<strong>' + Utils.i18n('settingsWords') + ':</strong>&nbsp;<span id="highlightWordNone">(' + Utils.i18n('settingsNone') + ')</span>' +
                    '<ul id="highlightWord" class="sinnerList"></ul>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div id="tabHide">' +
                    '<p>' +
                    '<input type="radio" name="useHiding" id="hidingYes"' + (config.useHiding ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="hidingYes">' + Utils.i18n('enable') + '</label>&nbsp;' +
                    '<input type="radio" name="useHiding" id="hidingNo"' + (config.useHiding ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="hidingNo">' + Utils.i18n('disable') + '</label>' +
                    '</p>' +
                    '<div class="row">' +
                    '<div class="column">' +
                    '<strong>' + Utils.i18n('settingsUsers') + ':</strong>&nbsp;<span id="hideUserNone">(' + Utils.i18n('settingsNone') + ')</span>' +
                    '<ul id="hideUser" class="sinnerList"></ul>' +
                    '</div>' +
                    '<div class="column">' +
                    '<strong>' + Utils.i18n('settingsWords') + ':</strong>&nbsp;<span id="hideWordNone">(' + Utils.i18n('settingsNone') + ')</span>' +
                    '<ul id="hideWord" class="sinnerList"></ul>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div id="tabSettings">' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<p>' +
                    Utils.i18n('helpLabel') +
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
                    Utils.i18n('settingsHideDeleted') +
                    ':' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<input type="radio" name="hideDeleted" id="hideDeletedYes"' + (config.hideDeleted ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="hideDeletedYes">' + Utils.i18n('yes') + '</label>&nbsp;' +
                    '<input type="radio" name="hideDeleted" id="hideDeletedNo"' + (config.hideDeleted ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="hideDeletedNo">' + Utils.i18n('no') + '</label>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<p>' +
                    Utils.i18n('settingsHideUnregistered') +
                    ':</p>' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<p>' +
                    '<input type="radio" name="hideUnregistered" id="hideUnregisteredYes"' + (config.hideUnregistered ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="hideUnregisteredYes">' + Utils.i18n('yes') + '</label>&nbsp;' +
                    '<input type="radio" name="hideUnregistered" id="hideUnregisteredNo"' + (config.hideUnregistered ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="hideUnregisteredNo">' + Utils.i18n('no') + '</label>' +
                    '</p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    Utils.i18n('settingsTransformAnchors') +
                    ':' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<input type="radio" name="transformAnchors" id="transformAnchorsYes"' + (config.transformAnchors ? ' checked' : '') + ' value="1">&nbsp;' +
                    '<label for="transformAnchorsYes">' + Utils.i18n('yes') + '</label>&nbsp;' +
                    '<input type="radio" name="transformAnchors" id="transformAnchorsNo"' + (config.transformAnchors ? '' : ' checked') + ' value="0">&nbsp;' +
                    '<label for="transformAnchorsNo">' + Utils.i18n('no') + '</label>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    '<p>' +
                    Utils.i18n('settingsYoutubeThumbnails') +
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
                    Utils.i18n('settingsDomain') +
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
                    Utils.i18n('settingsColor') +
                    ':</p>' +
                    '</div>' +
                    '<div class="column-narrow">' +
                    '<p class="colorFull"><input type="text" id="colorPicker" value="' + config.color + '"></p>' +
                    '</div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<div class="column-wide">' +
                    Utils.i18n('settingsBackups') +
                    ':' +
                    '</div>' +
                    '<div class="column-narrow">';
                if (isFileSaverSupported) {
                    modalContent +=
                        '<button id="settingsBackup">' + Utils.i18n('settingsBackup') + '</button>' +
                        '&nbsp;' +
                        '<button id="settingsRestore">' + Utils.i18n('settingsRestore') + '</button>';
                } else {
                    modalContent += Utils.i18n('fileSaverUnsupported');
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
                document.querySelector('div.tingle-modal-box__footer').appendChild(form);
                document.querySelector('div.tingle-modal').addEventListener('tabby', function (e) {
                    let footer = document.querySelector('div.tingle-modal-box__footer');

                    switch (e.target.hash.substr(1)) {
                        case 'tabHighlight':
                            type.value = 1;
                            submit.value = Utils.i18n('settingsHighlight');
                            footer.style.display = 'block';
                            break;
                        case 'tabHide':
                            type.value = 0;
                            submit.value = Utils.i18n('settingsHide');
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

                settingsModal.tabs = new Tabby('[data-tabs]');
            }
        };

    class Page {
        constructor() {
            this.initialize();
        }

        initialize() {
            db = Utils.Db.initialize();

            db.on('changes', this.observableListener);

            GM_addValueChangeListener('sinner.highlightColor', Settings.colorChangeListener);
            GM_addValueChangeListener('sinner.enforceDomain', Settings.domainChangeListener);
            GM_addValueChangeListener('sinner.youtubeThumbnail', Settings.youtubeThumbnailChangeListener);
            GM_addValueChangeListener('sinner.hideDeleted', Settings.hideDeletedChangeListener);
            GM_addValueChangeListener('sinner.hideUnregistered', Settings.hideUnregisteredChangeListener);
            GM_addValueChangeListener('sinner.useHighlighting', Settings.useHighlightingChangeListener);
            GM_addValueChangeListener('sinner.useHiding', Settings.useHidingChangeListener);
            GM_addValueChangeListener('sinner.transformAnchors', Settings.transformAnchorsChangeListener);
            GM_addValueChangeListener('sinner.transformAvatars', Settings.transformAvatarsChangeListener);
        }

        modal(e) {
            e.preventDefault();

            if (typeof settingsModal === 'undefined') {
                Settings.initializeModal();
                db.on('changes', Settings.observableListener);
            }

            settingsModal.open();
        }

        observableListener(changes) {
            changes.forEach(function (change) {
                if (change.table !== 'idioms') {
                    return;
                }

                page.process();
            });
        }

        async hideDeleted() {
        }

        async showDeleted() {
        }

        async processUsers() {
        }

        async processWords() {
        }

        processAnchors() {
            Utils.Dom.transformAnchorTargets();
        }

        processAvatars() {
        }

        async process() {
            this.processUsers();
            this.processWords();
            this.processAnchors();
            this.processAvatars();
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
                text = document.createTextNode(Utils.i18n('menuLabel')),
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
        }

        async processUsers() {
            let highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true);

            Utils.Css.removeClass(['highlightUser', 'hiddenUser']);

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
                        el.parentElement.classList.add('hiddenUser');
                    }
                }
            });
        }

        async processWords() {
            let highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false);

            Utils.Css.removeClass('hiddenWord');

            document.querySelectorAll('.highlightWord').forEach(function (rel) {
                Utils.String.unwrap(rel);
            });

            document.querySelectorAll('li.c3 a, li.c3l a').forEach(function (el) {
                let hidden = false,
                    wrapped;

                if (config.useHiding && (hidden = Utils.String.containsWord(el, hide)) !== false) {
                    el.parentElement.parentElement.classList.add('hiddenWord');
                }

                if (!hidden && config.useHighlighting) {
                    if ((wrapped = Utils.String.wrapAll(el, highlight)) !== false) {
                        el.innerHTML = wrapped;
                    }
                }
            });
        }
    }

    class PostPage extends Page {
        async processUsers() {
            let highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true),
                el = document.querySelector('span.signunreg, span.signnick'),
                isQuotes = window.location.pathname.startsWith('/zpovperl.php'),
                text = el.innerText.trim(),
                nick = Utils.String.compress(text, true, true, true),
                parent = el.parentElement.parentElement.parentElement.parentElement.parentElement
                    .parentElement.parentElement.parentElement.parentElement;

            Utils.Css.removeClass(['highlightUser', 'hiddenUser', 'strikeUser']);

            document.querySelectorAll('.userLinks').forEach(function (rel) {
                Utils.Dom.removeAllChildNodes(rel);
                rel.remove();
            });

            if (config.useHighlighting && highlight.includes(nick)) {
                if (!parent.classList.contains('highlightUser')) {
                    parent.classList.add('highlightUser');
                }
            } else if (config.useHiding && hide.includes(nick)) {
                if (!el.classList.contains('strikeUser')) {
                    el.classList.add('strikeUser');
                }
            } else if (!isQuotes) { // quotes are rendered without userinfo
                let info = document.querySelectorAll('td.conftext')[1].querySelectorAll('td.signinfo')[1],
                    linksEl = Object.assign(document.createElement('span'), {
                        className: 'userLinks'
                    });

                info.prepend(linksEl);
                Utils.Dom.embedUserLinks(linksEl, text);
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
                    containers = [container1, container2, container3];

                // quotes are rendered without userinfo
                if (!isQuotes
                    && config.hideUnregistered
                    && !isRegistered
                ) {
                    containers.forEach(function (tr) {
                        if (!tr.classList.contains('hiddenUser')) {
                            tr.classList.add('hiddenUser');
                        }
                    });
                }

                if (config.useHighlighting && highlight.includes(nick)) {
                    if (!parent.classList.contains('highlightUser')) {
                        parent.classList.add('highlightUser');
                    }
                } else if (config.useHiding && hide.includes(nick)) {
                    containers.forEach(function (tr) {
                        if (!tr.classList.contains('hiddenUser')) {
                            tr.classList.add('hiddenUser');
                        }
                    });
                } else {
                    let linksEl = Object.assign(document.createElement('span'), {
                        className: 'userLinks'
                    });

                    info.prepend(linksEl);
                    Utils.Dom.embedUserLinks(linksEl, text);
                }
            });
        }

        async processWords() {
            let highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false),
                header = document.querySelector('td.confheader'),
                headers = document.querySelectorAll('td.conftext'),
                content = headers[0],
                authorInfo = headers[1].querySelectorAll('td.signinfo')[1],
                wrapped;

            Utils.Css.removeClass('hiddenWord');

            document.querySelectorAll('.strikeWord').forEach(function (rel) {
                Utils.String.unwrap(rel);
            });
            document.querySelectorAll('.highlightWord').forEach(function (rel) {
                Utils.String.unwrap(rel);
            });

            if (config.useHiding) {
                if ((wrapped = Utils.String.wrapAll(header, hide, 'strikeWord')) !== false) {
                    header.innerHTML = wrapped;
                }
                if ((wrapped = Utils.String.wrapAll(content, hide, 'strikeWord')) !== false) {
                    content.innerHTML = wrapped;
                }
            }

            if (config.useHighlighting) {
                if ((wrapped = Utils.String.wrapAll(header, highlight)) !== false) {
                    header.innerHTML = wrapped;
                }
                if ((wrapped = Utils.String.wrapAll(content, highlight)) !== false) {
                    content.innerHTML = wrapped;
                }
            }

            if (Utils.Dom.isVip(authorInfo)) {
                Utils.Dom.embedYoutube(content);
            }

            document.querySelectorAll('td.signunreg, td.signnick').forEach(function (el) {
                let nickEl = el.parentElement.parentElement.parentElement.parentElement.parentElement,
                    headEl = nickEl.previousElementSibling.previousElementSibling,
                    textEl = nickEl.previousElementSibling.firstElementChild,
                    toHide = [nickEl, headEl, textEl.parentElement],
                    isVip = Utils.Dom.isVip(el.nextElementSibling),
                    hidden = false;

                if (config.useHiding && (hidden = Utils.String.containsWord(textEl, hide)) !== false) {
                    toHide.forEach(function (hel) {
                        hel.classList.add('hiddenWord');
                    });
                }

                if (!hidden) {
                    if (config.useHighlighting) {
                        if ((wrapped = Utils.String.wrapAll(textEl, highlight)) !== false) {
                            textEl.innerHTML = wrapped;
                        }
                    }

                    if (isVip) {
                        Utils.Dom.embedYoutube(textEl);
                    }
                }
            });
        }

        async hideDeleted() {
            document.querySelectorAll('td.infortext').forEach(function (deleted) {
                let toHide = [deleted.parentElement, deleted.parentElement.previousElementSibling, deleted.parentElement.nextElementSibling],
                    previousContent = deleted.parentElement.previousElementSibling.previousElementSibling.firstElementChild.firstElementChild.innerHTML.trim();

                if (previousContent.length === 0) {
                    toHide.push(deleted.parentElement.previousElementSibling.previousElementSibling);
                }

                toHide.forEach(function (el) {
                    el.classList.add('hiddenDeleted');
                });
            });
        }

        async showDeleted() {
            document.querySelectorAll('tr.hiddenDeleted').forEach(function (el) {
                el.classList.remove('hiddenDeleted');
            });
        }

        async process() {
            super.process();

            if (config.hideDeleted) {
                this.hideDeleted();
            }
        }
    }

    class ProfilePage extends Page {
        async processUsers() {
            let highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true),
                el = document.querySelector('td.profheader'),
                text = el.innerText.trim(),
                info = document.querySelector('table.infoltext tbody').firstElementChild.firstElementChild,
                nick = Utils.String.compress(text, true, true, true),
                parent = el.parentElement;

            Utils.Css.removeClass(['highlightUser', 'hiddenUser', 'strikeUser']);

            document.querySelectorAll('.userLinks').forEach(function (rel) {
                Utils.Dom.removeAllChildNodes(rel);
                rel.remove();
            });

            if (config.useHighlighting && highlight.includes(nick)) {
                if (!parent.classList.contains('highlightUser')) {
                    parent.classList.add('highlightUser');
                }
            } else if (config.useHiding && hide.includes(nick)) {
                if (!el.classList.contains('strikeUser')) {
                    el.classList.add('strikeUser');
                }
            } else {
                let linksEl = Object.assign(document.createElement('span'), {
                    className: 'userLinks'
                });

                info.appendChild(linksEl);
                Utils.Dom.embedUserLinks(linksEl, text);
                linksEl.insertAdjacentHTML('afterbegin', '&nbsp;');
            }

            document.querySelectorAll('span.guestnote, span.guestnick').forEach(function (el) {
                let isRegistered = el.innerText.indexOf('(') === -1,
                    index = isRegistered ? el.innerText.indexOf(':') : el.innerText.indexOf('(') - 1,
                    text = el.innerText.slice(0, index).trim(),
                    nick = Utils.String.compress(text, true, true, true),
                    parent = el.parentElement.parentElement;

                if (config.hideUnregistered && !isRegistered) {
                    if (!parent.classList.contains('hiddenUser')) {
                        parent.classList.add('hiddenUser');
                    }
                }

                if (config.useHighlighting && highlight.includes(nick)) {
                    if (!parent.classList.contains('highlightUser')) {
                        parent.classList.add('highlightUser');
                    }
                } else if (config.useHiding && hide.includes(nick)) {
                    if (!parent.classList.contains('hiddenUser')) {
                        parent.classList.add('hiddenUser');
                    }
                } else {
                    let linksEl = Object.assign(document.createElement('span'), {
                        className: 'userLinks'
                    });

                    el.prepend(linksEl);
                    Utils.Dom.embedUserLinks(linksEl, text);
                }
            });
        }

        async processWords() {
            let highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false);

            Utils.Css.removeClass('hiddenWord');

            document.querySelectorAll('.highlightWord').forEach(function (rel) {
                Utils.String.unwrap(rel);
            });

            document.querySelectorAll('div.guesttext').forEach(function (el) {
                let hidden = false,
                    wrapped;

                if (config.useHiding && (hidden = Utils.String.containsWord(el, hide)) !== false) {
                    el.parentElement.parentElement.classList.add('hiddenWord');
                }

                if (!hidden && config.useHighlighting) {
                    if ((wrapped = Utils.String.wrapAll(el, highlight)) !== false) {
                        el.innerHTML = wrapped;
                    }
                }
            });
        }

        processAvatars() {
            let info = document.querySelector('table.infoltext tbody'),
                www = info.children[info.children.length - 5].innerText.trim().slice(13).trim(),
                container = document.querySelector('td.photo');

            Utils.Dom.replaceAvatar(container, www);
        }
    }

    class BookPage extends Page {
        async processUsers() {
            let highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true);

            Utils.Css.removeClass(['highlightUser', 'hiddenUser']);

            document.querySelectorAll('.userLinks').forEach(function (rel) {
                Utils.Dom.removeAllChildNodes(rel);
                rel.remove();
            });

            document.querySelectorAll('span.guestnote, span.guestnick').forEach(function (el) {
                let isRegistered = el.innerText.indexOf('(') === -1,
                    index = el.innerText.indexOf('(') === -1 ? el.innerText.indexOf(':') : el.innerText.indexOf('(') - 1,
                    text = el.innerText.slice(0, index).trim(),
                    nick = Utils.String.compress(text, true, true, true),
                    parent = el.parentElement.parentElement;

                if (config.hideUnregistered && !isRegistered) {
                    if (!parent.classList.contains('hiddenUser')) {
                        parent.classList.add('hiddenUser');
                    }
                }

                if (config.useHighlighting && highlight.includes(nick)) {
                    if (!parent.classList.contains('highlightUser')) {
                        parent.classList.add('highlightUser');
                    }
                } else if (config.useHiding && hide.includes(nick)) {
                    if (!parent.classList.contains('hiddenUser')) {
                        parent.classList.add('hiddenUser');
                    }
                } else {
                    let linksEl = Object.assign(document.createElement('span'), {
                        className: 'userLinks'
                    });

                    el.prepend(linksEl);
                    Utils.Dom.embedUserLinks(linksEl, text);
                }
            });
        }

        async processWords() {
            let highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false);

            document.querySelectorAll('.highlightWord').forEach(function (rel) {
                Utils.String.unwrap(rel);
            });
            document.querySelectorAll('.hiddenWord').forEach(function (rel) {
                rel.classList.remove('hiddenWord');
            });

            document.querySelectorAll('div.guesttext').forEach(function (el) {
                let hidden = false,
                    wrapped;

                if (config.useHiding && (hidden = Utils.String.containsWord(el, hide)) !== false) {
                    el.parentElement.parentElement.classList.add('hiddenWord');
                }

                if (!hidden && config.useHighlighting) {
                    if ((wrapped = Utils.String.wrapAll(el, highlight)) !== false) {
                        el.innerHTML = wrapped;
                    }
                }
            });
        }
    }

    class StatsPage extends Page {
        async processUsers(skip) {
            let highlight = await Utils.Db.getIdioms('user', true, true),
                hide = await Utils.Db.getIdioms('user', false, true),
                index = 0;

            skip = skip || 0;

            Utils.Css.removeClass(['highlightStatsUser', 'hiddenUser']);

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
                        el.parentElement.classList.add('hiddenUser');
                    }
                }
            });
        }

        async processWords(count) {
            let highlight = await Utils.Db.getIdioms('word', true),
                hide = await Utils.Db.getIdioms('word', false),
                index = 0;

            count = count || 0;

            document.querySelectorAll('.highlightWord').forEach(function (rel) {
                Utils.String.unwrap(rel);
            });
            document.querySelectorAll('.hiddenWord').forEach(function (rel) {
                rel.classList.remove('hiddenWord');
            });

            document.querySelectorAll('td.lstconf').forEach(function (el) {
                let hidden = false,
                    wrapped;

                if (count > 0 && ++index > count) {
                    return;
                }

                if (config.useHiding && (hidden = Utils.String.containsWord(el, hide)) !== false) {
                    el.parentElement.classList.add('hiddenWord');
                }

                if (!hidden && config.useHighlighting) {
                    if ((wrapped = Utils.String.wrapAll(el, highlight)) !== false) {
                        el.innerHTML = wrapped;
                    }
                }
            });
        }

        async process() {
            switch (window.location.search) {
                case '?prehled=4':
                    this.processUsers();
                    break;
                case '?prehled=3':
                    this.processUsers(40);
                    this.processWords(40);
                    break;
                case '?prehled=2':
                    this.processUsers(20);
                    this.processWords(20);
                    break;
                case '?prehled=1':
                default:
                    this.processWords();
                    break;
            }

            this.processAnchors();
            this.processAvatars();
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

    GM_registerMenuCommand(Utils.i18n('settingsLabel'), page.modal);

    page.process();
});
