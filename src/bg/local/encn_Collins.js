if (typeof encn_Collins == 'undefined') {

    class encn_Collins {
        constructor(options) {
            this.options = options;
            this.maxexample = options.maxexample;
            this.word = '';
            this.base = 'http://dict.youdao.com/jsonapi?jsonversion=2&client=mobile&dicts={"count":99,"dicts":[["ec","collins"]]}&xmlVersion=5.1&q='
        }

        resourceURL(word) {
            return this.base + encodeURIComponent(word);
        }

        async findTerm(word) {
            this.word = word;
            //let deflection = formhelper.deinflect(word);
            let results = await Promise.all([this.findCollins(word), this.findEC(word)]);
            return [].concat(...results);
        }

        async onlineQuery(url) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: url,
                    type: "GET",
                    timeout: 5000,
                    error: (xhr, status, error) => {
                        reject(error);
                    },
                    success: (data, status) => {
                        if (data) {
                            resolve(data);
                        } else {
                            reject(new Error('Not Found!'));
                        }
                    }
                });
            });
        }

        async findCollins(word) {
            let notes = [];

            if (!word) return notes;
            let url = this.resourceURL(word);
            let data = await this.onlineQuery(url);

            if (!data.collins) return notes;
            for (const collins_entry of data.collins.collins_entries) {
                let definitions = [];
                let audios = [];

                let expression = collins_entry.headword; //headword
                let reading = collins_entry.phonetic || ''; // phonetic
                audios[0] = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(expression)}&type=1`;
                audios[1] = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(expression)}&type=2`;

                for (const entry of collins_entry.entries.entry) {
                    for (const tran_entry of entry.tran_entry) {
                        let definition = '';
                        const pos = tran_entry.pos_entry ? `<span class='pos'>${tran_entry.pos_entry.pos}</span>` : '';
                        if (!tran_entry.tran) continue;
                        let chn_tran = tran_entry.tran.match(/([\u4e00-\u9fa5]|;|( ?\()|(\) ?))+/gi).join(' ').trim();
                        let eng_tran = tran_entry.tran.replace(/([\u4e00-\u9fa5]|;|( ?\()|(\) ?))+/gi, '').trim();
                        chn_tran = chn_tran ? `<span class="chn_tran">${chn_tran}</span>` : '';
                        eng_tran = eng_tran ? `<span class="eng_tran">${eng_tran}</span>` : '';
                        definition += `${pos}<span clas="tran">${eng_tran}${chn_tran}</span>`;
                        // make exmaple sentence segement
                        let sents = tran_entry.exam_sents ? tran_entry.exam_sents.sent : [];
                        if (sents.length > 0 && this.maxexample > 0) {
                            definition += '<ul class="sents">';
                            for (const [index, sent] of sents.entries()) {
                                if (index > this.maxexample - 1) break; // to control only 2 example sentence.
                                definition += `<li class='sent'><span class='eng_sent'>${sent.eng_sent}</span><span class='chn_sent'>${sent.chn_sent}</span></li>`;
                            }
                            definition += '</ul>';
                        }
                        definitions.push(definition);
                    }
                }

                let css = this.renderCSS();
                notes.push({
                    css,
                    expression,
                    reading,
                    definitions,
                    audios
                });
            }
            return notes;
        }

        async findEC(word) {
            let notes = [];

            if (!word) return notes;

            let base = 'http://dict.youdao.com/jsonapi?jsonversion=2&client=mobile&dicts={"count":99,"dicts":[["ec"]]}&xmlVersion=5.1&q='
            let url = base + encodeURIComponent(word);
            let data = await this.onlineQuery(url);

            if (!data.ec) return notes;
            let expression = data.ec.word[0]['return-phrase'].l.i;
            let reading = data.ec.word[0].phone || data.ec.word[0].ukphone;
            let audios = [];
            let definition = '<ul class="ec">';
            const trs = data.ec.word ? data.ec.word[0].trs : [];
            for (const tr of trs)
                definition += `<li class="ec"><span class="ec_chn">${tr.tr[0].l.i[0]}</span></li>`;
            definition += '</ul>';
            let css = `
            <style>
                ul.ec, li.ec {list-style: square inside; margin:0; padding:0;}
                span.ec_chn {margin-left: -10px;}
            </style>`;
            notes.push({
                css,
                expression,
                reading,
                definitions: [definition],
                audios,
            });
            return notes;
        }

        renderCSS() {
            let css = `
            <style>
                span.pos{
                    text-transform: lowercase;
                    font-size: 0.9em;
                    margin-right: 5px;
                    padding: 2px 4px;
                    color: white;
                    background-color: #0d47a1;
                    border-radius: 3px;
                }
                span.tran{
                    margin: 0;
                    padding: 0;
                }
                span.eng_tran{
                    margin-right: 3px;
                    padding: 0;
                }
                span.chn_tran{
                    color:#0d47a1;
                }
                ul.sents{
                    font-size: 0.9em;
                    list-style: square inside;
                    margin: 3px 0;
                    padding: 5px;
                    background: rgba(13,71,161,0.1);;
                    border-radius: 5px;
                }
                li.sent{
                    margin: 0;
                    padding: 0;
                }
                span.eng_sent{
                    margin-right: 5px;
                    margin-left: -5px;
                    color: black;
                }
                span.chn_sent{
                    color:#0d47a1;
                }
            </style>`;
            return css;
        }
    }

    registerDict(chrome.i18n.getMessage('encn_Collins'), encn_Collins);

}