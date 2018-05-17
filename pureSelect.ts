interface SelectOption {
    id: string;
    label: string;
    value: any;
}
interface PureSelectQuery {
    term: string
    more?: boolean
    meta?: any
}

interface FetchRemoteResponse {
    enteties: SelectOption[];
    query: PureSelectQuery
}

interface CreateButton {
    text: string;
    callback: () => void;
}
interface PureSelectSettings {
    filter_placeholder?: string;
    class?: string;
    filtered?: string;
    closeOnSelect?: boolean;
    createButton?: CreateButton
    filter_threshold?: number;
    optionTemplate?: (options?: SelectOption)=> string;
    resultTemplate?: (options?: SelectOption | string)=> string;
    onSelect?: (options?: SelectOption[], dataIds?: string[]) => void;
    onRemove?:(options?: SelectOption[], dataIds?: string[]) => void;
    fetchRemote?: (query: PureSelectQuery, callback: Function) => Promise<FetchRemoteResponse>;


}

export class PureSelect {
    public target: any = null;
    public select: any = null;
    public display: any = null;
    public selected: any = null;
    public list: any = null;
    public value: any = null;
    public isLarge: boolean = true;
    public filter: any = null;
    public query: any = {};
    public options: any = [];
    public multi: boolean = false;
    public settings: PureSelectSettings = {};
    public ul: any = null;
    public selectOptions: SelectOption[] = [];
    constructor(target: any, settings: any = {}, selectOptions: any = []) {
        this.selected = {};
        this.value = {};
        this.selectOptions = selectOptions;
        console.log('pure select');
        this.init(target, settings);
    }

    private storeManager(li: HTMLLIElement) {
        console.log('slected');
        li.classList.add('selected');
        if(this.multi) {
            this.multiSelectedUpdate(li)
        } else {
            this.singleSelectedUpdate(li);
        }

        //On select event.
        if(this.settings.onSelect) {
            this.settings.onSelect(this.value, this.select);
        }


    }

    getValById(id: string) {
        return this.selectOptions.find((option: any)=> option && option.id == id);
    }

    private multiSelectedUpdate(li) {
        let id = li.getAttribute('data-id'), value;
        //Verify that not already set.
        if(!this.value[id]) {
            this.display.insertAdjacentHTML('beforeend', this.multiResultTemplate(li.innerHTML));
            this.selected[id] = li;
            value = this.getValById(id);
            if(value) this.value[id] = value;
        }
    }

    private singleSelectedUpdate(li) {
        let id = li.getAttribute('data-id');
        this.display.innerHTML = this.settings.resultTemplate(li.innerHTML);
        this.value[0] = this.getValById(id);
        this.selected[0] = li;
    }

    public setValues(labels: string[]) {
        labels.forEach((label)=> {
            if(this.options[label]) {
                this.storeManager(this.options[label]);
            }
        });
    }

    //TODO check if working.
    public removeValue(label: string) {
        if(this.selected[label]) delete this.selected[label];
        if(this.value[label]) delete this.value[label];
        let target = this.display.querySelector(`[data-id="${label}"]`);
        if(target) target.remove();
        this.positionList();
    }

    /**
     * init options and inject ul select to dom.
     * @param target
     * @param settings
     */
    private init(target: any, settings: any) {
        console.log('init');
        switch(typeof target) {
            case 'object':
                break;
            case 'string':
                this.target = document.querySelector(`${target}`);
                this.multi = this.target.multiple;
                break;
        }

        this.settings = this.getSettings(settings);
        this.buildSelect();


        this.setOverflow();

        this.target.parentNode.replaceChild(this.select, this.target);
        this.target.style.display = 'none';
        this.select.appendChild(this.target);

        document.addEventListener('click', this.handleClickOff.bind(this));
        this.positionList();
        if(this.selectOptions.length == 0 && this.settings && this.settings.fetchRemote) {
            this.handleFilterKeyup();
            this.select.classList.add('large');
        }
    }

    private buildSelect() {
        console.log('buildSelect');
        this.select = document.createElement('div');
        this.select.classList.add(`select`);
        this.select.classList.add(this.settings.class);
        this.select.setAttribute('tabindex', this.target.tabIndex);
        this.select.addEventListener('keydown', this.handleSelectKeydown.bind(this));

        this.display = document.createElement('span');
        this.display.classList.add('value');
        this.display.addEventListener('click', this.handleDisplayClick.bind(this));
        this.select.appendChild(this.display);

        this.buildList();

    };

    private setOverflow() {
        //TODO set logic for default value select. maybe remove---
        // if(this.options.length) {
        //     let id = this.options[this.target.selectedIndex].getAttribute('data-id');
        //     this.value[id] = this.options[this.target.selectedIndex].getAttribute('data-value');
        //     this.selected[id] = this.options[this.target.selectedIndex];
        //     this.display.innerHTML = this.selected.innerHTML;
        // }
        //
        // if((this.settings.filtered === 'auto' && this.options.length >= this.settings.filter_threshold) ||
        //     this.settings.filtered === true) {
        //     this.isLarge = true;
        //     this.select.classList.add('large');
        // }
    }

    private createButton() {
        if(this.settings && this.settings.createButton) {
            let createBtn = document.createElement('div');
            createBtn.classList.add('create-btn');
            this.list.appendChild(createBtn);
        }
    }

    private buildList() {
        console.log('buildList');
        this.list = document.createElement('div');
        this.ul = document.createElement('ul');
        this.list.classList.add('list');
        this.list.setAttribute('tabindex', '-1');

        this.buildFilter();

        let self = this;
        this.ul.addEventListener('scroll', self.throttle(self.handleScroll.bind(this), 1000));

        this.ul.addEventListener('click', (e)=> this.handleOptionClick(e));
        this.createButton();
        this.list.appendChild(this.ul);

        this.buildOptions(this.selectOptions);

        this.select.appendChild(this.list);
    };

    public stringify(v) {
        return typeof v === 'object' ? JSON.stringify(v) : v;
    }

    private checkForCustomTemplate(li: HTMLElement, option: SelectOption) {
        if(this.settings && this.settings.optionTemplate) {
            this.display.insertAdjacentHTML('beforeend', this.multiResultTemplate(li.innerHTML));
        } else {
            li.innerHTML = option.label;
        }
    }

    private buildOptions(options: SelectOption[]) {
        console.log('buildOptions');
        let liFragment = document.createDocumentFragment();
        let optionFragment = document.createDocumentFragment();
        let optionsLen = options.length;
        for(let i = 0; i < optionsLen; i++) {
            let li = document.createElement('li');
            let option = document.createElement('option');
            //TODO stringify if object should create function to check and convert;

            li.setAttribute('data-id', options[i].id);
            this.checkForCustomTemplate(li, options[i]);
            // In case of filter if li already selected we need to mark it as we re rendering the li's.
            if(this.selected[options[i].id]) {
                li.classList.add('selected');
            }
            option.setAttribute('value', this.stringify(options[i].value));

            option.innerHTML = options[i].label;

            liFragment.appendChild(li);
            optionFragment.appendChild(option);

            this.options[options[i].label] = li;
        }
        this.target.appendChild(optionFragment);
        this.ul.appendChild(liFragment);
    };

    private handleRemove(target: any) {
        let parent = target.parentNode;
        let id = parent.getAttribute('data-id');
        parent.remove();
        if(this.selected[id]) {
            this.selected[id].classList.remove('selected');
            delete this.selected[id];
        }
        if(this.value[id]) delete this.value[id];
        this.positionList();
        if(this.settings && this.settings.onRemove) {
            this.settings.onRemove(this.value, this.select);
        }
    }

    private handleDisplayClick(e) {
        e.preventDefault();
        if(e.target && e.target.classList.contains('ps-chip-del')) {
            this.handleRemove(e.target);
        } else {
            this.list.classList.add('open');
            if(this.isLarge) {
                this.filter.focus();
            }
        }
    };


    private positionList() {
        console.log('positionList');
        if(this.isLarge) {
            this.list.style.top = this.display.offsetHeight + 'px';
        }
    };

    private closeList() {
        console.log('closeList');
        this.list.classList.remove('open');
    };

    private toggleList() {
        console.log('toggleList');
        if(this.list.classList.contains('open')) {
            this.list.classList.remove('open');
            this.select.focus();
        } else {
            this.list.classList.add('open');
            this.list.focus();
        }
    };

    private buildFilter() {
        console.log('buildFilter');
        let wrapper = document.createElement('div');
        wrapper.classList.add('filter');

        this.filter = document.createElement('input');
        this.filter.type = 'text';
        this.filter.setAttribute('placeholder',this.settings.filter_placeholder);
        this.filter.addEventListener('keyup', this.handleFilterKeyup.bind(this));

        wrapper.appendChild(this.filter);
        this.list.appendChild(wrapper);
    };

    private handleOptionClick(e) {
        console.log('handleOptionClick');
        if(e && e.target && e.target.nodeName && e.target.nodeName == 'LI') {
            this.storeManager(e.target);
            if(this.settings.closeOnSelect) this.closeList();
            this.clearFilter();
            setTimeout(this.positionList.bind(this), 200);
        }
    };

    public activeSpinner() {
        this.select.classList.add('loading');

    }

    public disableSpinner() {
        this.select.classList.remove('loading');
    }

    //TODO duplicate validation.
    private handleRemoteResponseOnFilter(response) {
        this.selectOptions = response.entities;
        this.query = Object.assign({}, this.query, response.query);
        if(this.query.page) this.query.page = this.query.page++;
        this.buildOptions(response.entities);
        this.disableSpinner();
    }

    private handleRemoteResponseOnScroll(response) {
        this.selectOptions = this.selectOptions.concat(response.entities);
        this.query = Object.assign({}, this.query, response.query);
        if(this.query.page) this.query.page = this.query.page++;
        this.buildOptions(response.entities);
        this.disableSpinner();
    }

    private initArrays() {
        this.emptyNode(this.ul);
        this.emptyNode(this.target);
        this.selectOptions = [];
        this.options = [];
    }

    DisableSelect() {

    }

    ActiveSelect() {

    }

    private handleFilterKeyup() {
        console.log('handleFilterKeyup');
        this.query.term = this.filter.value;
        if(this.settings.fetchRemote) {
            this.initArrays();
            //TODO active spinner
            this.activeSpinner();
            this.settings.fetchRemote(this.query, this.handleRemoteResponseOnFilter.bind(this));

        } else {
            for(let k in this.options) {
                if (this.options.hasOwnProperty(k)) {
                    if(this.options[k].innerHTML.substring(0, this.filter.value.length).toLowerCase() == this.filter.value.toLowerCase()) {
                        this.options[k].style.display = 'block';
                    } else {
                        this.options[k].style.display = 'none';
                    }
                }
            }
        }
    };

    private clearFilter() {
        console.log('clearFilter');
        this.filter.value = '';
        for(let k in this.options) {
            if (this.options.hasOwnProperty(k)) {
                this.options[k].style.display = 'block';
            }
        }
    };


    private handleClickOff(e) {
        if(!this.select.contains(e.target) && !e.target.classList.contains('ps-chip-del')) {
            this.closeList();
        }
    };

    private handleScroll(e) {
        console.log('handlescroll');
        console.log(e.target.scrollHeight);
        e.preventDefault();
        if(((e.target.scrollTop + e.target.offsetHeight) >= (e.target.scrollHeight - 20))
            && this.settings.fetchRemote) {
            this.activeSpinner();
            this.settings.fetchRemote(this.query, this.handleRemoteResponseOnScroll.bind(this));
        }
    }

    // EVENT HANDLERS

    private handleSelectKeydown(e) {
        console.log('handleSelectKeydown');
        console.log(e);
        if (this.select === document.activeElement && e.keyCode == 32) {
            this.toggleList();
        }
    };


    private multiResultTemplate(v: string) {
        return `<div class="ps-chip-wrap" data-id="${v}">
                <span class="ps-chip-label">${v}</span>
                <span class="del-chip-btn ps-chip-del">x</span>
              </div>`
    }

    public getSettings(settings: PureSelectSettings): PureSelectSettings {
        console.log('getSettings');
        let defaults: PureSelectSettings = {
            resultTemplate: (v: string) => ` ${v} `,
            fetchRemote: null,
            filtered: 'auto',
            class: 'default',
            filter_threshold: 8,
            filter_placeholder: 'Filter options...'
        };

        for(let p in settings) {
            defaults[p] = settings[p];
        }

        return defaults;
    }

    public destroy() {
        document.removeEventListener('click', this.handleClickOff.bind(this));
        this.emptyNode(this.select);
        this.select.remove();

    }

    public emptyNode(elem: HTMLElement) {
        if(elem && elem.firstChild) {
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
        }
    }

    public throttle(func: any, wait: any, immediate = false) {
        let timeout;
        return function() {
            let context = this, args = arguments;
            let later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        }
    }
}
