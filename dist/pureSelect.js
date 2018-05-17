"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PureSelect {
    constructor(target, settings = {}, selectOptions = []) {
        this.target = null;
        this.select = null;
        this.display = null;
        this.selected = null;
        this.list = null;
        this.value = null;
        this.isLarge = true;
        this.filter = null;
        this.query = {};
        this.options = [];
        this.multi = false;
        this.settings = {};
        this.ul = null;
        this.selectOptions = [];
        this.selected = {};
        this.value = {};
        this.selectOptions = selectOptions;
        console.log('pure select');
        this.init(target, settings);
    }
    storeManager(li) {
        console.log('slected');
        li.classList.add('selected');
        if (this.multi) {
            this.multiSelectedUpdate(li);
        }
        else {
            this.singleSelectedUpdate(li);
        }
        //On select event.
        if (this.settings.onSelect) {
            this.settings.onSelect(this.value, this.select);
        }
    }
    getValById(id) {
        return this.selectOptions.find((option) => option && option.id == id);
    }
    multiSelectedUpdate(li) {
        let id = li.getAttribute('data-id'), value;
        //Verify that not already set.
        if (!this.value[id]) {
            this.display.insertAdjacentHTML('beforeend', this.multiResultTemplate(li.innerHTML));
            this.selected[id] = li;
            value = this.getValById(id);
            if (value)
                this.value[id] = value;
        }
    }
    singleSelectedUpdate(li) {
        let id = li.getAttribute('data-id');
        this.display.innerHTML = this.settings.resultTemplate(li.innerHTML);
        this.value[0] = this.getValById(id);
        this.selected[0] = li;
    }
    setValues(labels) {
        labels.forEach((label) => {
            if (this.options[label]) {
                this.storeManager(this.options[label]);
            }
        });
    }
    //TODO check if working.
    removeValue(label) {
        if (this.selected[label])
            delete this.selected[label];
        if (this.value[label])
            delete this.value[label];
        let target = this.display.querySelector(`[data-id="${label}"]`);
        if (target)
            target.remove();
        this.positionList();
    }
    /**
     * init options and inject ul select to dom.
     * @param target
     * @param settings
     */
    init(target, settings) {
        console.log('init');
        switch (typeof target) {
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
        if (this.selectOptions.length == 0 && this.settings && this.settings.fetchRemote) {
            this.handleFilterKeyup();
            this.select.classList.add('large');
        }
    }
    buildSelect() {
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
    }
    ;
    setOverflow() {
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
    createButton() {
        if (this.settings && this.settings.createButton) {
            let createBtn = document.createElement('div');
            createBtn.classList.add('create-btn');
            this.list.appendChild(createBtn);
        }
    }
    buildList() {
        console.log('buildList');
        this.list = document.createElement('div');
        this.ul = document.createElement('ul');
        this.list.classList.add('list');
        this.list.setAttribute('tabindex', '-1');
        this.buildFilter();
        let self = this;
        this.ul.addEventListener('scroll', self.throttle(self.handleScroll.bind(this), 1000));
        this.ul.addEventListener('click', (e) => this.handleOptionClick(e));
        this.createButton();
        this.list.appendChild(this.ul);
        this.buildOptions(this.selectOptions);
        this.select.appendChild(this.list);
    }
    ;
    stringify(v) {
        return typeof v === 'object' ? JSON.stringify(v) : v;
    }
    checkForCustomTemplate(li, option) {
        if (this.settings && this.settings.optionTemplate) {
            this.display.insertAdjacentHTML('beforeend', this.multiResultTemplate(li.innerHTML));
        }
        else {
            li.innerHTML = option.label;
        }
    }
    buildOptions(options) {
        console.log('buildOptions');
        let liFragment = document.createDocumentFragment();
        let optionFragment = document.createDocumentFragment();
        let optionsLen = options.length;
        for (let i = 0; i < optionsLen; i++) {
            let li = document.createElement('li');
            let option = document.createElement('option');
            //TODO stringify if object should create function to check and convert;
            li.setAttribute('data-id', options[i].id);
            this.checkForCustomTemplate(li, options[i]);
            // In case of filter if li already selected we need to mark it as we re rendering the li's.
            if (this.selected[options[i].id]) {
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
    }
    ;
    handleRemove(target) {
        let parent = target.parentNode;
        let id = parent.getAttribute('data-id');
        parent.remove();
        if (this.selected[id]) {
            this.selected[id].classList.remove('selected');
            delete this.selected[id];
        }
        if (this.value[id])
            delete this.value[id];
        this.positionList();
        if (this.settings && this.settings.onRemove) {
            this.settings.onRemove(this.value, this.select);
        }
    }
    handleDisplayClick(e) {
        e.preventDefault();
        if (e.target && e.target.classList.contains('ps-chip-del')) {
            this.handleRemove(e.target);
        }
        else {
            this.list.classList.add('open');
            if (this.isLarge) {
                this.filter.focus();
            }
        }
    }
    ;
    positionList() {
        console.log('positionList');
        if (this.isLarge) {
            this.list.style.top = this.display.offsetHeight + 'px';
        }
    }
    ;
    closeList() {
        console.log('closeList');
        this.list.classList.remove('open');
    }
    ;
    toggleList() {
        console.log('toggleList');
        if (this.list.classList.contains('open')) {
            this.list.classList.remove('open');
            this.select.focus();
        }
        else {
            this.list.classList.add('open');
            this.list.focus();
        }
    }
    ;
    buildFilter() {
        console.log('buildFilter');
        let wrapper = document.createElement('div');
        wrapper.classList.add('filter');
        this.filter = document.createElement('input');
        this.filter.type = 'text';
        this.filter.setAttribute('placeholder', this.settings.filter_placeholder);
        this.filter.addEventListener('keyup', this.handleFilterKeyup.bind(this));
        wrapper.appendChild(this.filter);
        this.list.appendChild(wrapper);
    }
    ;
    handleOptionClick(e) {
        console.log('handleOptionClick');
        if (e && e.target && e.target.nodeName && e.target.nodeName == 'LI') {
            this.storeManager(e.target);
            if (this.settings.closeOnSelect)
                this.closeList();
            this.clearFilter();
            setTimeout(this.positionList.bind(this), 200);
        }
    }
    ;
    activeSpinner() {
        this.select.classList.add('loading');
    }
    disableSpinner() {
        this.select.classList.remove('loading');
    }
    //TODO duplicate validation.
    handleRemoteResponseOnFilter(response) {
        this.selectOptions = response.entities;
        this.query = Object.assign({}, this.query, response.query);
        if (this.query.page)
            this.query.page = this.query.page++;
        this.buildOptions(response.entities);
        this.disableSpinner();
    }
    handleRemoteResponseOnScroll(response) {
        this.selectOptions = this.selectOptions.concat(response.entities);
        this.query = Object.assign({}, this.query, response.query);
        if (this.query.page)
            this.query.page = this.query.page++;
        this.buildOptions(response.entities);
        this.disableSpinner();
    }
    initArrays() {
        this.emptyNode(this.ul);
        this.emptyNode(this.target);
        this.selectOptions = [];
        this.options = [];
    }
    DisableSelect() {
    }
    ActiveSelect() {
    }
    handleFilterKeyup() {
        console.log('handleFilterKeyup');
        this.query.term = this.filter.value;
        if (this.settings.fetchRemote) {
            this.initArrays();
            //TODO active spinner
            this.activeSpinner();
            this.settings.fetchRemote(this.query, this.handleRemoteResponseOnFilter.bind(this));
        }
        else {
            for (let k in this.options) {
                if (this.options.hasOwnProperty(k)) {
                    if (this.options[k].innerHTML.substring(0, this.filter.value.length).toLowerCase() == this.filter.value.toLowerCase()) {
                        this.options[k].style.display = 'block';
                    }
                    else {
                        this.options[k].style.display = 'none';
                    }
                }
            }
        }
    }
    ;
    clearFilter() {
        console.log('clearFilter');
        this.filter.value = '';
        for (let k in this.options) {
            if (this.options.hasOwnProperty(k)) {
                this.options[k].style.display = 'block';
            }
        }
    }
    ;
    handleClickOff(e) {
        if (!this.select.contains(e.target) && !e.target.classList.contains('ps-chip-del')) {
            this.closeList();
        }
    }
    ;
    handleScroll(e) {
        console.log('handlescroll');
        console.log(e.target.scrollHeight);
        e.preventDefault();
        if (((e.target.scrollTop + e.target.offsetHeight) >= (e.target.scrollHeight - 20))
            && this.settings.fetchRemote) {
            this.activeSpinner();
            this.settings.fetchRemote(this.query, this.handleRemoteResponseOnScroll.bind(this));
        }
    }
    // EVENT HANDLERS
    handleSelectKeydown(e) {
        console.log('handleSelectKeydown');
        console.log(e);
        if (this.select === document.activeElement && e.keyCode == 32) {
            this.toggleList();
        }
    }
    ;
    multiResultTemplate(v) {
        return `<div class="ps-chip-wrap" data-id="${v}">
                <span class="ps-chip-label">${v}</span>
                <span class="del-chip-btn ps-chip-del">x</span>
              </div>`;
    }
    getSettings(settings) {
        console.log('getSettings');
        let defaults = {
            resultTemplate: (v) => ` ${v} `,
            fetchRemote: null,
            filtered: 'auto',
            class: 'default',
            filter_threshold: 8,
            filter_placeholder: 'Filter options...'
        };
        for (let p in settings) {
            defaults[p] = settings[p];
        }
        return defaults;
    }
    destroy() {
        document.removeEventListener('click', this.handleClickOff.bind(this));
        this.emptyNode(this.select);
        this.select.remove();
    }
    emptyNode(elem) {
        if (elem && elem.firstChild) {
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
        }
    }
    throttle(func, wait, immediate = false) {
        let timeout;
        return function () {
            let context = this, args = arguments;
            let later = function () {
                timeout = null;
                if (!immediate)
                    func.apply(context, args);
            };
            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow)
                func.apply(context, args);
        };
    }
}
exports.PureSelect = PureSelect;
//# sourceMappingURL=pureSelect.js.map