const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function main(argv) {
    const args = parseArgs(argv.slice(2));
    if (!args) {
        console.log("args[0]: access uri not found.");
        return;
    }

    const res = await scrape(args);
    console.log(JSON.stringify(res));
};
main(process.argv);

function parseArgs(args) {
    if (!args.length) {
        return null;
    }

    return {
        uri: args[0]
    };
}

async function scrape(args) {
    const ats = await fetch(args.uri)
        .then(filter)
        .catch(console.error);
    return ats;
}

async function filter(res) {
    const body = await res.text();
    const $ = cheerio.load(body);

    const og = {key: 'og', selector: `meta[property^="og:"]`};
    const fb = {key: 'facebook', selector: `meta[property^="fb:"]`};
    const tw = {key: 'twitter', selector: `meta[property^="twitter:"]`};

    const mapper = (p) => {
        const elms = Array.from($(p.selector).map((i, e) => e.attribs));
        const props = elms.reduce((acc, e) => {
            const a = [e.property.split(':').slice(1).join(':'), e.content];
            return [...acc, a];
        }, []);

        return [p.key, Object.fromEntries(props)];
    };
    const ogmerged = Object.fromEntries([og, fb, tw].map(mapper));

    const title = $('title').text();
    const metadesc = $('meta[name="description"]').attr('content');
    const metakeywords = $('meta[name="keywords"]').attr('content');
    const metas = {
        title: title,
        description: metadesc,
        keywords: metakeywords
    };
    
    return Object.assign({}, ogmerged, metas);
}
