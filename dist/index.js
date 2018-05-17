"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pureSelect_1 = require("./pureSelect");
let demoSelect = new pureSelect_1.PureSelect('#demo', {
    fetchRemote: (query, callback) => {
        fetch(`https://api.github.com/legacy/repos/search/${encodeURIComponent(query.term)}`)
            .then(res => res.json())
            .then((response) => {
            let entities = response.repositories;
            callback({
                entities: entities.map((entry) => {
                    return {
                        label: `${entry.name}(${entry.owner})`,
                        value: entry,
                        id: entry.url
                    };
                }),
                query: {
                    term: query.term,
                    more: entities.length > 0
                }
            });
        });
    }
});
//# sourceMappingURL=index.js.map